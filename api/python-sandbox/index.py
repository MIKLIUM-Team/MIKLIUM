import json
import sys
import subprocess
import tempfile
import os
import re
import time
from http.server import BaseHTTPRequestHandler

MAX_CODE_LENGTH = 15_000
MAX_STDOUT = 10_000
MAX_STDERR = 7_000
MAX_TIMEOUT = 40
DEFAULT_TIMEOUT = 20
MAX_MEMORY_MB = 64
MAX_RECURSION = 200

BLOCKED_MODULES = [
    "os", "subprocess", "shutil", "pathlib", "glob", "tempfile",
    "socket", "urllib", "requests", "httpx", "http", "aiohttp",
    "ftplib", "smtplib", "imaplib", "poplib",
    "multiprocessing", "threading", "signal", "asyncio",
    "ctypes", "cffi", "mmap",
    "pickle", "shelve", "marshal",
    "importlib", "code", "codeop",
    "webbrowser", "antigravity", "turtle",
    "gc", "resource", "atexit",
    "posix", "nt", "posixpath", "ntpath", "genericpath",
    "_posixsubprocess", "_signal",
    "pwd", "grp", "fcntl", "termios", "tty", "pty",
    "_frozen_importlib", "_frozen_importlib_external",
]

BLOCKED_BUILTINS_FOR_STATIC = [
    "open", "exec", "eval", "compile", "breakpoint",
    "__import__", "exit", "quit",
]

BLOCKED_DUNDERS = [
    "__subclasses__", "__globals__", "__builtins__",
    "__code__", "__bases__", "__mro__",
    "__dict__", "__class__", "__base__",
    "__getattribute__", "__setattr__", "__delattr__",
]

BLOCKED_SYSMODULES_KEYS = {
    "posix", "nt", "_posixsubprocess", "_signal",
    "pwd", "grp", "fcntl", "posixpath", "ntpath", "genericpath",
    "_frozen_importlib", "_frozen_importlib_external",
    "zipimport", "_imp",
}

ALL_BLOCKED = (
    [(rf"\b{re.escape(m)}\b", m) for m in BLOCKED_MODULES]
    + [(rf"\b{re.escape(b)}\s*\(", b) for b in BLOCKED_BUILTINS_FOR_STATIC]
    + [(re.escape(d), d) for d in BLOCKED_DUNDERS]
)

COMPILED = [(re.compile(p), name) for p, name in ALL_BLOCKED]

TMP_FILE_RE = re.compile(r'File "/tmp/[^"]+", ')
LINE_RE = re.compile(r'(?<=line )\d+')

WRAPPER = r'''
import sys, builtins

try:
    import resource
    _mem = {max_memory} * 1024 * 1024
    try:
        resource.setrlimit(resource.RLIMIT_AS, (_mem, _mem))
    except Exception:
        pass
    try:
        resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
    except Exception:
        pass
    try:
        resource.setrlimit(resource.RLIMIT_NPROC, (0, 0))
    except Exception:
        pass
except Exception:
    pass

_blocked = set({blocked_set})
_blocked_sysmod_keys = {blocked_sysmodules}
_blocked_attrs = frozenset({blocked_dunders})

for _mk in list(sys.modules.keys()):
    if _mk in _blocked_sysmod_keys or _mk.split(".")[0] in _blocked:
        del sys.modules[_mk]

_original_import = __import__
def _safe_import(name, *args, **kwargs):
    if name.split(".")[0] in _blocked or name in _blocked_sysmod_keys:
        raise ImportError(f"{{name!r}} is blocked")
    return _original_import(name, *args, **kwargs)

_orig_getattr = getattr
def _safe_getattr(obj, name, *args):
    if isinstance(name, str) and name in _blocked_attrs:
        raise AttributeError(f"Access to {{name!r}} is blocked")
    return _orig_getattr(obj, name, *args)

def _safe_setattr(obj, name, value):
    if isinstance(name, str) and name in _blocked_attrs:
        raise AttributeError(f"Setting {{name!r}} is blocked")
    object.__setattr__(obj, name, value)

def _safe_delattr(obj, name):
    if isinstance(name, str) and name in _blocked_attrs:
        raise AttributeError(f"Deleting {{name!r}} is blocked")
    object.__delattr__(obj, name)

builtins.__import__ = _safe_import
builtins.getattr = _safe_getattr
builtins.setattr = _safe_setattr
builtins.delattr = _safe_delattr

for _func in ("open", "exec", "eval", "compile", "breakpoint", "exit", "quit", "vars"):
    setattr(builtins, _func, None)

try:
    import io
    io.open = None
    io.FileIO = None
except ImportError:
    pass

try:
    import _io
    _io.FileIO = None
except ImportError:
    pass

user_code = {user_code!r}
exec(user_code)
'''

WRAPPER_PREFIX_LINES = len(WRAPPER.split("{user_code!r}")[0].format(
    blocked_set=repr(set(BLOCKED_MODULES)),
    blocked_sysmodules=repr(BLOCKED_SYSMODULES_KEYS),
    blocked_dunders=repr(set(BLOCKED_DUNDERS)),
    max_memory=MAX_MEMORY_MB,
    max_recursion=MAX_RECURSION,
).split("\n")) - 1

def strip_strings(code):
    r = re.sub(r'"""[\s\S]*?"""', '""', code)
    r = re.sub(r"'''[\s\S]*?'''", "''", r)
    r = re.sub(r'"[^"\n]*"', '""', r)
    r = re.sub(r"'[^'\n]*'", "''", r)
    r = re.sub(r"#.*$", "", r, flags=re.MULTILINE)
    return r

def check(code):
    return [name for pat, name in COMPILED if pat.search(strip_strings(code))]

def clean_stderr(text):
    text = TMP_FILE_RE.sub("", text)

    def adjust_line(m):
        n = int(m.group(0))
        adjusted = n - WRAPPER_PREFIX_LINES
        return str(max(adjusted, 1))

    text = LINE_RE.sub(adjust_line, text)
    return text

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        print("GET request rejected")
        return self._json(405, {"success": False, "error": "Only POST method is supported"})

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            print("Empty request body")
            return self._json(400, {"success": False, "error": "Empty body"})

        try:
            body = json.loads(self.rfile.read(length))
        except json.JSONDecodeError as e:
            print(f"JSON parse failed: {e}")
            return self._json(400, {"success": False, "error": "Invalid JSON"})

        code = body.get("code", "")
        stdin_list = body.get("stdin", [])
        timeout = min(max(0.5, body.get("timeout", DEFAULT_TIMEOUT)), MAX_TIMEOUT)

        if not code or not isinstance(code, str):
            print("Missing or invalid code field")
            return self._json(400, {"success": False, "error": "Missing 'code'"})

        if len(code) > MAX_CODE_LENGTH:
            print(f"Code too long: {len(code)} chars")
            return self._json(400, {"success": False, "error": "Code too long"})

        if not isinstance(stdin_list, list):
            print("Invalid stdin type")
            return self._json(400, {"success": False, "error": "'stdin' must be an array"})

        stdin_data = "\n".join(str(item) for item in stdin_list)

        blocked = check(code)
        if blocked:
            names = ", ".join(blocked)
            print(f"Blocked modules detected: {names}")
            return self._json(403, {
                "success": False,
                "error": f"Blocked: {names} — not allowed in sandbox",
            })

        script = WRAPPER.format(
            user_code=code,
            blocked_set=repr(set(BLOCKED_MODULES)),
            blocked_sysmodules=repr(BLOCKED_SYSMODULES_KEYS),
            blocked_dunders=repr(set(BLOCKED_DUNDERS)),
            max_memory=MAX_MEMORY_MB,
            max_recursion=MAX_RECURSION,
        )
        start = time.perf_counter()

        tmp = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, dir="/tmp") as f:
                f.write(script)
                tmp = f.name

            result = subprocess.run(
                [sys.executable, "-u", tmp],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd="/tmp",
                env={"PATH": "/usr/bin:/bin", "HOME": "/tmp", "PYTHONDONTWRITEBYTECODE": "1"},
            )
            ms = int(f"{(time.perf_counter() - start) * 1000:.2f}".split(".")[0])

            stdout = result.stdout[:MAX_STDOUT].rstrip("\n")
            stderr_clean = clean_stderr(result.stderr[:MAX_STDERR]).rstrip("\n") if result.stderr else None

            if result.returncode != 0:
                error_msg = "Runtime error"
                if stderr_clean:
                    error_msg += ": " + stderr_clean.strip()
                print(f"Runtime error, exit code {result.returncode}")
                return self._json(400, {
                    "success": False,
                    "error": error_msg,
                    "stdout": stdout,
                    "exit_code": result.returncode,
                    "time_ms": ms,
                })

            return self._json(200, {
                "success": True,
                "stdout": stdout,
                "exit_code": result.returncode,
                "time_ms": ms,
            })
        except subprocess.TimeoutExpired:
            ms = int(f"{(time.perf_counter() - start) * 1000:.2f}".split(".")[0])
            print(f"Execution timed out after {timeout}s")
            return self._json(408, {
                "success": False,
                "error": f"Timed out after {timeout}s",
                "stdout": "",
                "exit_code": -1,
                "time_ms": ms,
            })
        except Exception as e:
            print(f"Execution error: {type(e).__name__}: {e}")
            return self._json(500, {
                "success": False,
                "error": "Internal server error",
            })
        finally:
            if tmp:
                try:
                    os.unlink(tmp)
                except Exception as e:
                    print(f"Temp file cleanup failed: {e}")

    def _json(self, status, data):
        body = json.dumps(data, ensure_ascii=False, default=str).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, *a):
        pass
