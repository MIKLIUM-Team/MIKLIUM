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
    "os", "sys", "subprocess", "shutil", "pathlib", "glob", "tempfile",
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

WRAPPER = '''import sys as _sys, builtins as _builtins

_mem = {max_memory} * 1024 * 1024
try:
    import resource as _resource
    _resource.setrlimit(_resource.RLIMIT_AS, (_mem, _mem))
    _resource.setrlimit(_resource.RLIMIT_FSIZE, (0, 0))
    _resource.setrlimit(_resource.RLIMIT_NPROC, (0, 0))
except Exception:
    pass

_sys.setrecursionlimit({max_recursion})

if hasattr(_sys, "addaudithook"):
    def _audit_hook(event, args):
        if event in ("os.system", "os.exec", "os.spawn", "os.posix_spawn", "subprocess.Popen"):
            raise RuntimeError("Execution blocked")
        if event in ("socket.socket", "socket.getaddrinfo"):
            raise RuntimeError("Network blocked")
    try:
        _sys.addaudithook(_audit_hook)
    except Exception:
        pass

def _setup_sandbox():
    import sys
    import builtins
    
    _blocked = set({blocked_set})
    _blocked_sysmod_keys = {blocked_sysmodules}
    _blocked_attrs = frozenset({blocked_dunders})

    orig_import = builtins.__import__
    orig_exec = builtins.exec
    orig_eval = builtins.eval
    orig_open = builtins.open
    orig_getattr = builtins.getattr
    orig_setattr = builtins.setattr
    orig_delattr = builtins.delattr

    def _is_user():
        try:
            return sys._getframe(2).f_globals.get("__name__") == "__main__"
        except Exception:
            return False

    def _safe_import(name, *args, **kwargs):
        if _is_user():
            base = name.split(".")[0]
            if base in _blocked or base in _blocked_sysmod_keys:
                raise ImportError(f"Importing {{name!r}} is blocked")
        return orig_import(name, *args, **kwargs)

    def _safe_exec(*args, **kwargs):
        if _is_user():
            raise RuntimeError("exec is blocked")
        return orig_exec(*args, **kwargs)

    def _safe_eval(*args, **kwargs):
        if _is_user():
            raise RuntimeError("eval is blocked")
        return orig_eval(*args, **kwargs)

    def _safe_open(*args, **kwargs):
        if _is_user():
            raise RuntimeError("open is blocked")
        return orig_open(*args, **kwargs)

    def _safe_getattr(obj, name, *args):
        if isinstance(name, str) and name in _blocked_attrs and _is_user():
            raise AttributeError(f"Access to {{name!r}} is blocked")
        return orig_getattr(obj, name, *args)

    def _safe_setattr(obj, name, value):
        if isinstance(name, str) and name in _blocked_attrs and _is_user():
            raise AttributeError(f"Setting {{name!r}} is blocked")
        return orig_setattr(obj, name, value)

    def _safe_delattr(obj, name):
        if isinstance(name, str) and name in _blocked_attrs and _is_user():
            raise AttributeError(f"Deleting {{name!r}} is blocked")
        return orig_delattr(obj, name)

    builtins.__import__ = _safe_import
    builtins.getattr = _safe_getattr
    builtins.setattr = _safe_setattr
    builtins.delattr = _safe_delattr
    builtins.exec = _safe_exec
    builtins.eval = _safe_eval
    builtins.open = _safe_open
    builtins.compile = None
    builtins.breakpoint = None
    builtins.exit = None
    builtins.quit = None

_setup_sandbox()

def _cleanup():
    for _k in list(globals().keys()):
        if _k.startswith("_") and _k not in ("__name__", "__doc__", "__package__", "__loader__", "__spec__", "__builtins__", "__file__"):
            del globals()[_k]
_cleanup()
'''

FORMATTED_WRAPPER = WRAPPER.format(
    blocked_set=repr(set(BLOCKED_MODULES)),
    blocked_sysmodules=repr(BLOCKED_SYSMODULES_KEYS),
    blocked_dunders=repr(set(BLOCKED_DUNDERS)),
    max_memory=MAX_MEMORY_MB,
    max_recursion=MAX_RECURSION,
)
WRAPPER_PREFIX_LINES = len(FORMATTED_WRAPPER.split("\n"))

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

        script = FORMATTED_WRAPPER + "\n" + code
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
