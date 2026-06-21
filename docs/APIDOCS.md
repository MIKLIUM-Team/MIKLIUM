# MIKLIUM API Documentation
# Navigation
### Information
 - [MIKLIUM API Documentation](#miklium-api-documentation)
 - [Navigation](#navigation)
 - [About MIKLIUM APIs](#about-miklium-apis)
### APIs Documentations
> **6 APIs are avaiable now:**
 - [Apple Shortcuts Data API Documentation](#apple-shortcuts-data-api-documentation)
 - [Chatbot API Documentation](#chatbot-api-documentation)
 - [Miklium LLM Responses API Documentation](#miklium-llm-responses-api-documentation)
 - [Python Sandbox API Documentation](#python-sandbox-api-documentation)
 - [Search API Documentation](#search-api-documentation)
 - [YouTube Transcription API Documentation](#youtube-transcription-api-documentation)

# About MIKLIUM APIs

At MIKLIUM, we empower developers and users with high-quality, free APIs and software tools to help you build, innovate, and explore without limits. Here you will find detailed documentation for each of our APIs.

---
# Apple Shortcuts Data API Documentation

## Navigation
**[Back to MIKLIUM APIs navigation](#navigation)**


- [Apple Shortcuts Data API Documentation](#apple-shortcuts-data-api-documentation)
    - [Navigation](#navigation-1)
    - [About MIKLIUM Apple Shortcuts Data API](#about-miklium-apple-shortcuts-data-api)
    - [Request Body](#request-body)
        - [GET Method](#get-method)
        - [POST Method](#post-method)
    - [Code Examples](#code-examples)
    - [API Responses](#api-responses)
        - [Success](#success)
        - [Error](#error)
    - [What Services Does This API Use?](#what-services-does-this-api-use)

## About MIKLIUM Apple Shortcuts Data API

**Get detailed information about Apple Shortcut from its link quickly and conveniently.** Using this API, you can get data such as the name of the shortcut, the date of creation of the link to it, the links to download the signed `.shortcut` file, `.plist` file, the shortcut icon and much more. Our “shortcut data scraper” uses the iCloud API system and RoutineHub API for [RoutineHub](https://routinehub.co/) (place where you can search for beautiful and incredible shortcuts and share yours projects) integration.

## Request Body

Link: `https://miklium.vercel.app/api/shortcut-info`

| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `url` | Yes | Text | Shortcut link (iCloud links, RoutineHub links and direct download RoutineHub links are supported) |

### GET Method

`https://miklium.vercel.app/api/shortcut-info?url=Paste Your link here`

> [!IMPORTANT]
> For GET Method the link to shortcut should be URL-encoded!

**Request Link Examples:**
* `https://miklium.vercel.app/api/shortcut-info?url=https://www.icloud.com/shortcuts/dbd68fde729740b2a7218a177808655f`
* `https://miklium.vercel.app/api/shortcut-info?url=https://routinehub.co/download/56215/`
* `https://miklium.vercel.app/api/shortcut-info?url=https://routinehub.co/shortcut/18431/`

### POST Method

`https://miklium.vercel.app/api/shortcut-info`

```javascript
{
  "url": "Paste Your link here"
}
```

**Request Body Examples (JSON):**
```javascript
{
  "url": "https://routinehub.co/shortcut/18431/"
}
```
```javascript
{
  "url": "https://www.icloud.com/shortcuts/dbd68fde729740b2a7218a177808655f"
}
```

## Code Examples

### JavaScript (Fetch)
```javascript
const url = 'https://miklium.vercel.app/api/shortcut-info';
const data = {
  url: "https://www.icloud.com/shortcuts/dbd68fde729740b2a7218a177808655f"
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Python (Requests)
```python
import requests

url = "https://miklium.vercel.app/api/shortcut-info"
data = {
    "url": "https://www.icloud.com/shortcuts/dbd68fde729740b2a7218a177808655f"
}

try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### cURL
```bash
curl -X POST https://miklium.vercel.app/api/shortcut-info \
     -H "Content-Type: application/json" \
     -d '{
           "url": "https://www.icloud.com/shortcuts/dbd68fde729740b2a7218a177808655f"
         }'
```

## API Responses

### Success

```javascript
{
  "success": true,
  "inputType": "…", // The type of the URL that was entered as an input
  "shortcutLinks": {
    "iCloudLink": "…", // iCloud link to download shortcut, if it was found, or null
    "routineHubLink": "…", // RoutineHub link to shortcut, if it was found, or null
    "routineHubDirectLink": "…" // RoutineHub direct download link to shortcut, if it was found, or null
  },
  "shortcutData": {
    "name": "…", // Shotcut name
    "dateOfSharing": {
      "readable": "…", // Date of creation of a shortcut link in a readable format
      "asInShortcuts": "…", // Date of creation of a shortcut link in format displayed in the “Shortcuts” app
      "iso8601": "…", // Date of creation of a shortcut link in ISO 8601 format
      "rfc2822": "…", // Date of creation of a shortcut link in RFC 2822 format
      "timestamp": 0 // Date of creation of a shortcut link in timestamp format
    },
    "icon": {
      "colorId": 255, // ID of the background color of the shortcut icon
      "glyphId": 61989, // ID of the glyph of the shortcut icon
      "size": {
        "mb": 0.00, // Size of the .png shortcut icon in megabytes
        "kb": 0.00, // Size of the .png shortcut icon in kilobytes
        "bit": 0 // Size of the .png shortcut icon in bites
      },
      "downloadUrl": "…" // Link to download the .png shortcut icon
    },
    "signedShortcutFile": {
      "isSigned": true,
      "size": {
        "mb": 0.00, // Size of the signed .shortcut file in megabytes
        "kb": 0.00, // Size of the signed .shortcut file in kilobytes
        "bit": 0 // Size of the signed .shortcut file in bites
      },
      "downloadUrl": "…" // Link to download the signed .shortcut file
    },
    "plistShortcutFile": {
      "size": {
        "mb": 0.00, // Size of the .plist file in megabytes
        "kb": 0.00, // Size of the .plist file in kilobytes
        "bit": 0 // Size of the .plist file in bites
      },
      "downloadUrl": "…" // Link to download the .plist file
    }
  }
}
```

**Success response example:**
```javascript
{
  "success": true,
  "inputType": "RoutineHub Link",
  "shortcutLinks": {
    "iCloudLink": "https://www.icloud.com/shortcuts/dbd68fde729740b2a7218a177808655f",
    "routineHubLink": "https://routinehub.co/shortcut/18431",
    "routineHubDirectLink": "https://routinehub.co/download/56215"
  },
  "shortcutData": {
    "name": "Nuvole AI",
    "dateOfSharing": {
      "readable": "October 21, 2025 at 10:34:17 AM (GMT)",
      "asInShortcuts": "October 21 2025",
      "iso8601": "2025-10-21T10:34:17.360Z",
      "rfc2822": "Tue, 21 Oct 2025 10:34:17 GMT",
      "timestamp": 1761042857360
    },
    "icon": {
      "colorId": 255,
      "glyphId": 61989,
      "size": {
        "mb": 0.04,
        "kb": 43.37,
        "bit": 44406
      },
      "downloadUrl": "https://cvws.icloud-content.com/…"
    },
    "signedShortcutFile": {
      "isSigned": true,
      "size": {
        "mb": 0.95,
        "kb": 970.73,
        "bit": 994025
      },
      "downloadUrl": "https://cvws.icloud-content.com/…"
    },
    "plistShortcutFile": {
      "size": {
        "mb": 2.71,
        "kb": 2779.88,
        "bit": 2846600
      },
      "downloadUrl": "https://cvws.icloud-content.com/…"
    }
  }
}
```

> [!IMPORTANT]
> Links to download files and icon image are temporary and are valid for about 7 hours.

### Error

| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `error` | `String`, Error message |

**Error response example:**
```javascript
{
  "success": false,
  "error": "Invalid shortcut URL"
}
```

## What Services Does This API Use?

- iCloud Shortcuts Records API
- [RoutineHub API](https://github.com/mvan231/RoutineHubDocs/blob/main/README.md)


---
# Chatbot API Documentation

## Navigation
**[Back to MIKLIUM APIs navigation](#navigation)**


- [Chatbot API Documentation](#chatbot-api-documentation)
    - [Navigation](#navigation-2)
    - [About MIKLIUM Chatbot API](#about-miklium-chatbot-api)
    - [Request Body](#request-body-1)
        - [GET Method](#get-method-1)
        - [POST Method](#post-method-1)
    - [Response Stacking](#response-stacking)
    - [Bot Personalities](#bot-personalities)
    - [Supported Topics](#supported-topics)
    - [Code Examples](#code-examples-1)
    - [API Responses](#api-responses-1)
        - [Success](#success-1)
        - [Error](#error-1)

## About MIKLIUM Chatbot API

**A lightweight, rule-based chatbot.** This API provides a conversational interface that can answer questions about MIKLIUM, its APIs, documentation, community, and more. It is designed to work on low-compute devices and delivers quick, deterministic responses with no external dependencies.

Unlike a single-match bot, MIKLIUM Chatbot supports **response stacking** — when your message touches multiple topics (e.g. a greeting *and* a question about the APIs), the chatbot can intelligently combine matching responses into one rich reply.

## Request Body

Link: `https://miklium.vercel.app/api/chatbot`

| Parameter | Required | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `message` | Yes | String | — | The user's message to the chatbot |
| `response_stacking` | No | Integer (0 – 100) | `4` | How many matched topic responses to combine in the reply |
| `personality` | No | String | `miklium` | The personality of the bot (`miklium`, `personalityless`, `male`, `female`, `all`) |

### GET Method

`https://miklium.vercel.app/api/chatbot?message=Paste Your message here`

> [!IMPORTANT]
> For GET Method the message should be URL-encoded!

**Request Link Examples:**
* `https://miklium.vercel.app/api/chatbot?message=Hello%2C%20how%20do%20I%20use%20the%20Python%20Sandbox%3F`
* `https://miklium.vercel.app/api/chatbot?message=Hi%2C%20how%20are%20you%3F&response_stacking=2&personality=male`

### POST Method

`https://miklium.vercel.app/api/chatbot`

```javascript
{
  "message": "Hello, how do I use the Python Sandbox?",
  "response_stacking": 4,
  "personality": "miklium"
}
```

## Response Stacking

`response_stacking` is an optional integer parameter (**0 – 100**, default **`4`**) that controls how many pattern-matched responses are combined into the final reply.

| Value | Behaviour |
| :--- | :--- |
| `0` | Only the **first** matching response is returned (classic single-match mode) |
| `1` – `99` | Up to **N + 1** matched responses are joined into one reply |
| `100` | All matching responses are combined (maximum verbosity) |

**How it works:** The chatbot scans your message against every topic pattern in order. Each time a pattern matches, one randomly-chosen response for that topic is added to the list. When the list reaches `response_stacking + 1` entries (or all patterns have been checked), the collected responses are joined with a space and returned as a single string.

**Example — `response_stacking: 2` with message `"Hey, how are you? Tell me about the APIs"`:**

```javascript
// Request
{
  "message": "Hey, how are you? Tell me about the APIs",
  "response_stacking": 2
}

// Response (three matched topics combined)
{
  "response": "Hey there! Welcome to MIKLIUM. What can I do for you? Running at full capacity and feeling fantastic! What can I do for you? All MIKLIUM APIs are free and require no API key. Current offerings: Python Sandbox, Search, YouTube Transcript, Apple Shortcuts Info, and Chatbot."
}
```

## Bot Personalities

The `personality` parameter allows you to change the bot's tone and response style.

| Personality | Alias | Description |
| :--- | :--- | :--- |
| **MIKLIUM** | `miklium` | The default assistant. Helpful, professional, and knowledgeable about MIKLIUM. |
| **Personalityless** | `personalityless`| A cold, logical bot. Minimalist and formal. Focused on pure data. |
| **General Male** | `male` | A friendly guy in his early 20s. Casual tone, uses "yo", "vibing", etc. |
| **General Female** | `female` | A friendly girl in her early 20s. Warm tone, uses emojis and casual language. |
| **All** | `all` | A hybrid mode that uses all response sets. This is the **most intelligent mode** as it pulls from every knowledge base. |

Each personality has its own unique set of pattern responses and fallbacks. The "All" mode is particularly powerful as it combines the strengths (and variety) of every single personality into one.

## Supported Topics

The chatbot recognises a wide range of topics out of the box:

| Topic | Example phrases |
| :--- | :--- |
| Greetings | hello, hi, hey, good morning, howdy |
| How are you | how are you, you doing okay, are you well |
| Capabilities | what can you do, how can you help |
| APIs overview | apis, what do you offer, what is available |
| Documentation | docs, documentation, how to use, guide |
| Python Sandbox | python, sandbox, run code, code execution |
| Search API | search, web search, find, queries |
| YouTube Transcript | youtube, transcript, captions, subtitles |
| Apple Shortcuts | shortcut, icloud, routinehub, automation |
| Chatbot API | chatbot, chat api, this api, bot api |
| Response Stacking | response stacking, stacking, stacked response |
| GitHub / OSS | github, open source, contribute, pull request |
| Community / Support | discord, help, support, bug, issue |
| About MIKLIUM | what is miklium, who made you, about miklium |
| Pricing | free, cost, price, subscription |
| Rate Limits | rate limit, quota, throttle |
| Error Handling | error, 500, 400, bad request, not working |
| Authentication | auth, api key, token, bearer |
| Request Format | json, body, content-type, endpoint |
| Versioning | version, update, changelog, release |
| Deployment | deploy, vercel, serverless, self-host |
| Language / SDK | sdk, npm, curl, fetch, javascript, python |
| Examples | example, sample, demo, getting started |
| Thanks | thank you, appreciate, awesome, great |
| Goodbye | bye, goodbye, see you, take care |
| Jokes | joke, funny, lol, humor |
| Time / Date | time, date, today, clock |
| Weather | weather, temperature, forecast |

## Code Examples

### JavaScript (Fetch)
```javascript
const url = 'https://miklium.vercel.app/api/chatbot';
const data = {
  message: "Hello, how do I use the Python Sandbox?",
  response_stacking: 4,
  personality: "miklium"
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Python (Requests)
```python
import requests

url = "https://miklium.vercel.app/api/chatbot"
data = {
    "message": "Hello, how do I use the Python Sandbox?",
    "response_stacking": 4,
    "personality": "miklium"
}

try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### cURL
```bash
curl -X POST https://miklium.vercel.app/api/chatbot \
     -H "Content-Type: application/json" \
     -d '{
           "message": "Hello, how do I use the Python Sandbox?",
           "response_stacking": 4,
           "personality": "miklium"
         }'
```

## API Responses

### Success

**Response structure:**
| Parameter | Value |
| :--- | :--- |
| `success` | `true` |
| `response` | `String`, The chatbot's response text (may be multiple sentences if stacking > 0) |

**Success response examples:**
```javascript
{
  "success": "true",
  "response": "You can find our full API documentation at APIDOCS.html. It covers all endpoints and usage examples." // No stacking
}
```
```javascript
{
  "success": "true",
  "response": "Hi! Great to see you here. Ask me anything about MIKLIUM! All systems green! I'm here and ready to assist." // Stacking = 2, greeting + how-are-you combined
}
```

### Error

| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `error` | `String`, Error message |

**Error response example:**
```javascript
{
  "success": "false",
  "error": "Missing 'message' field"
}
```


---
# Miklium LLM Responses API Documentation

## Navigation
**[Back to MIKLIUM APIs navigation](#navigation)**


- [Miklium LLM Responses API Documentation](#miklium-llm-responses-api-documentation)
  - [About MIKLIUM Responses](#about-miklium-responses)
  - [Request Body](#request-body-2)
    - [POST Method](#post-method-2)
  - [Code Examples](#code-examples-2)
    - [JavaScript (OpenAI-like SDK Style)](#javascript-openai-like-sdk-style)
  - [API Responses](#api-responses-2)
    - [Success](#success-2)
    - [Error](#error-2)

## About MIKLIUM Responses

This API provides access to the Miklium LLM models, starting with **miklium-lm-nano**. It is designed to be easy to use and follows a clean request structure similar to the OpenAI SDK.

## Request Body

Link: `https://miklium.vercel.app/api/responses`

| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `input` | Yes | String | The prompt text to send to the model. |
| `model` | No | String | The model ID (currently only `miklium-lm-nano`). |

### POST Method

```json
{
  "model": "miklium-lm-nano",
  "input": "Write a short bedtime story about a unicorn."
}
```

## Code Examples

### JavaScript (OpenAI-like SDK Style)

You can use the following pattern to call the API in a way that feels like the OpenAI SDK:

```javascript
class MikliumAI {
  constructor(config = {}) {
    this.baseURL = config.baseURL || "https://miklium.vercel.app/api/responses";
  }

  get responses() {
    return {
      create: async (data) => {
        const res = await fetch(this.baseURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
    };
  }
}

const client = new MikliumAI();

const response = await client.responses.create({
  model: "miklium-lm-nano",
  input: "Write a short bedtime story about a unicorn.",
});

console.log(response.output_text);
```

### Python (Requests)

```python
import requests

r = requests.post("https://miklium.vercel.app/api/responses",
                   json={"model": "miklium-lm-nano", "input": "Write a short bedtime story about a unicorn."})
print(r.json()["output_text"])
```

## API Responses

### Success

| Parameter | Value |
| :--- | :--- |
| `success` | `true` |
| `model` | `String`, The model used |
| `output_text` | `String`, The generated response |
| `usage` | `Object`, Token usage information |

```json
{
  "success": true,
  "model": "miklium-lm-nano",
  "output_text": "Once upon a time, in a land of rainbows...",
  "usage": {
    "total_tokens": 42
  }
}
```

### Error

| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `error` | `String`, Error message |

```json
{
  "success": false,
  "error": "Missing 'input' field"
}
```


---
# Python Sandbox API Documentation

## Navigation
**[Back to MIKLIUM APIs navigation](#navigation)**


- [Python Sandbox API Documentation](#python-sandbox-api-documentation)
    - [Navigation](#navigation-4)
    - [About MIKLIUM Python Sandbox API](#about-miklium-python-sandbox-api)
    - [Request Body](#request-body-3)
        - [POST Method](#post-method-3)
    - [Code Examples](#code-examples-3)
    - [API Responses](#api-responses-3)
        - [Success](#success-3)
        - [Error](#error-3)
    - [Limitations](#limitations)
        - [Code Limitations](#code-limitations)
        - [Code Running and Output Limits:](#code-running-and-output-limits)

## About MIKLIUM Python Sandbox API

**Easily and quickly launch Python code.** Using this API, you can run Python code, configuring timeouts and inputs as needed for your code execution. Everything works without external dependencies.

_Python Sandbox was suggested for creation by [Elc29](https://github.com/TheCodeWan)._

## Request Body

Link: `https://miklium.vercel.app/api/python-sandbox`

| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `code` | Yes | Text | Your Python code |
| `stdin` | No | Array | Inputs for your program |
| `timeout` | No | Number | Code execution time limit in seconds (by default `20`, maximum `40`, minimum `0.5`) |

### POST Method

`https://miklium.vercel.app/api/python-sandbox`

```javascript
{
  "code": "Paste Your Python code here",
  "stdin": ["Paste input here", "Another input…"] // Not necessarily
  "timeout": 0 // Number of seconds (Not necessarily)
}
```

**Request Body Examples (JSON):**

* Python code:
  ```python
  print('Hello World!')
  ```
  Request Body:
  ```javascript
  {
    "code": "print('Hello World!')"
  }
  ```

* Python code:
  ```python
  a, b = int(input()), int(input()) # For example, inputs are 2 and 6
  print(a, '+', b, '=', a+b)
  ```
  Request Body:
  ```javascript
  {
    "code": "a, b = int(input()), int(input())\nprint(a, '+', b, '=', a+b)",
    "stdin": [ 2, 6 ]
  }
  ```

## Code Examples

### JavaScript (Fetch)
```javascript
const url = 'https://miklium.vercel.app/api/python-sandbox';
const data = {
  code: "print('Hello from MIKLIUM!')\n",
  timeout: 10
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Python (Requests)
```python
import requests

url = "https://miklium.vercel.app/api/python-sandbox"
data = {
    "code": "print('Hello from MIKLIUM!')\n",
    "timeout": 10
}

try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### cURL
```bash
curl -X POST https://miklium.vercel.app/api/python-sandbox \
     -H "Content-Type: application/json" \
     -d '{
           "code": "print('\''Hello from MIKLIUM!'\'')\n",
           "timeout": 10
         }'
```

## API Responses

### Success

**Response structure:**
| Parameter | Value |
| :--- | :--- |
| `success` | `true` |
| `exit_code` | `0` |
| `stdout` | `Text`, Python program output |
| `time_ms` | `Number`, Code execution time in milliseconds |

**Success response example:**
```javascript
{
  "success" : true,
  "exit_code" : 0,
  "stdout" : "5 + 6 = 11",
  "time_ms" : 18
}
```

### Error

**Server error:**
| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `error` | `String`, Error message |

**Code running error:**
| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `exit_code` | `Number`, Code of error |
| `stdout` | `Text`, Python program output before error |
| `time_ms` | `Number`, Code execution time in milliseconds |
| `error` | `Text`, Python error message |


**Error response examples:**
```javascript
{
  "success" : false,
  "error" : "Blocked: os — not allowed in sandbox"
}
```
```javascript
{
  "success" : false,
  "stdout" : "",
  "exit_code" : 1,
  "time_ms" : 22,
  "error" : "Runtime error: Traceback (most recent call last):\n  line 1, in <module>\nImportError: cannot import name 'products' from 'itertools' (unknown location). Did you mean: 'product'?"
}
```

## Limitations

Unfortunately, the Python Sandbox is not designed to run very complex or potentially dangerous code, so it has several limitations.

### Code Limitations:

* Maximum size of standard input of code: `50000` characters
* Blocked modules that cannot be imported:
  ```python
  "os", "sys", "subprocess", "shutil", "pathlib", "glob", "tempfile" # File system
  "socket", "urllib", "requests", "httpx", "http", "aiohttp" # Network
  "ftplib", "smtplib", "imaplib", "poplib" # Mail protocols
  "multiprocessing", "threading", "signal", "asyncio" # Concurrency
  "ctypes", "cffi", "mmap" # Low-level operations
  "pickle", "shelve", "marshal" # Unsafe serialization
  "importlib", "code", "codeop" # Dynamic imports
  "webbrowser", "antigravity", "turtle" # GUI and browser
  "gc", "resource", "atexit" # System resources
  "posix", "nt", "posixpath", "ntpath", "genericpath", "pwd", "grp", "fcntl", "termios", "tty", "pty" # Low-level system
  "_posixsubprocess", "_signal" # Low-level process
  "_frozen_importlib", "_frozen_importlib_external", "zipimport", "_imp" # Import system internals
  ```
* Third-party modules cannot be imported (standard library modules work fine: e.g. `json`, `math`, `random`, `datetime`, `itertools`, `collections`, `re`, and others)
* Blocked built-in functions:
  ```python
  open() # File read or write
  exec() # Execute arbitrary code
  eval() # Evaluate strings as code
  compile() # Compile code (set to None)
  breakpoint() # Debugging (set to None)
  __import__() # Dynamic import (intercepted)
  exit() # Exit program (set to None)
  quit() # Exit program (set to None)
  ```
* Blocked Dunder Attributes (sandbox escape prevention):
  ```python
  __subclasses__ # Get subclasses (for RCE)
  __globals__ # Access global variables
  __builtins__ # Access built-in functions
  __code__ # Access bytecode
  __bases__ # Parent classes
  __mro__ # Method Resolution Order
  __dict__ # Access object internals
  __class__ # Class manipulation
  __base__ # Direct parent class
  __getattribute__ # Attribute access override
  __setattr__ # Attribute setting override
  __delattr__ # Attribute deletion override
  ```

### Code Running and Output Limits:

* Maximum Python program output: `10 000` characters
* Maximum Python code error message: `7 000` characters
* Maximum timeout: `40` seconds (can be configured in Request Body)
* Maximum memory usage (RAM): `64` MB
* Maximum recursion (then function calls itself) depth: `200` levels. Example of recursion:
  ```python
  # Factorial calculator

  def factorial(n):
    if n <= 1:
      return 1
    return n * factorial(n - 1) # Function calls itself

  print(factorial(5))  # 120
  ```

---
# Search API Documentation

## Navigation
**[Back to MIKLIUM APIs navigation](#navigation)**


- [Search API Documentation](#search-api-documentation)
    - [Navigation](#navigation-5)
    - [About MIKLIUM Search API](#about-miklium-search-api)
    - [Request Parameters](#request-parameters)
        - [GET Method](#get-method-2)
        - [POST Method](#post-method-4)
    - [Code Examples](#code-examples-4)
    - [API Responses](#api-responses-4)
        - [Success (Web Search)](#success-web-search)
        - [Success (Image Search)](#success-image-search)
        - [Success (Video Search)](#success-video-search)
        - [Error](#error-4)
    - [Additional Information](#additional-information)
        - [Filtering Media Results](#filtering-media-results)
        - [Choosing the Right Web Format](#choosing-the-right-web-format)
    - [What Services Does This API Use?](#what-services-does-this-api-use-1)

## About MIKLIUM Search API

**Get text, image, or video search results from the Internet on your request.** You can configure the type of search, filter results by size or duration, and specify how much data you want to retrieve. The API uses the Yahoo Search engine (utilizing a built-in session cookie and consent-bypass mechanism) and includes a robust scraping system to extract full page contents.

## Request Parameters

Link: `https://miklium.vercel.app/api/search`

### General Parameters
| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `search` | Yes | Array / String | Search queries (maximum 5) |
| `type` | No | String | Type of search: `'default'`, `'images'`, or `'videos'` (by default `'default'`) |

### Web Search Parameters for `type: 'default'`
| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `maxSmallSnippets`| No | Number | The number of short text snippets for each query (by default `5`) |
| `maxLargeSnippets` | No | Number | The number of long full-text scrapes for each query (by default `2`) |
| `maxLargeSnippetSymbols` | No | Number | Maximum number of characters for one long scrape (by default `4500`) |

### Image Search Parameters for `type: 'images'`
| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `maxResults` | No | Number | Maximum number of results to return (by default `10`) |
| `minWidth` | No | Number | Minimum image width in pixels |
| `maxWidth` | No | Number | Maximum image width in pixels |
| `minHeight` | No | Number | Minimum image height in pixels |
| `maxHeight` | No | Number | Maximum image height in pixels |

### Video Search Parameters for `type: `'videos'`
| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `maxResults` | No | Number | Maximum number of results to return (by default `10`) |
| `minDuration` | No | String / Number | Minimum video duration (e.g. `"1:30"`, `"01:00:00"` or number of seconds) |
| `maxDuration` | No | String / Number | Maximum video duration (e.g. `"10:00"` or number of seconds) |
| `site` | No | String | Filter videos by origin host domain (e.g. `"youtube.com"`) |

---

### GET Method

`https://miklium.vercel.app/api/search?search=Paste Your query(queries) here`

If you want to write several requests at once (maximum 5), connect them with `~`. If you want to add additional parameters or filters, write them through `&`.

> [!IMPORTANT]
> For the GET Method, the search requests should be URL-encoded!

**Request Link Examples:**
* Web search: `https://miklium.vercel.app/api/search?search=iPhone%20Air`
* Image search (with 2 requests and filters): `https://miklium.vercel.app/api/search?search=Nature~Birds&type=images&minWidth=1920&minHeight=1080`
* Video search (with filters): `https://miklium.vercel.app/api/search?search=Nodejs%20tutorial&type=videos&maxResults=5&minDuration=01:00:00&site=youtube`

---

### POST Method

`https://miklium.vercel.app/api/search`

**Request Body Examples (JSON):**

*   **Web search (Default):**
    ```json
    {
      "search": ["iPhone Air"]
    }
    ```

*   **Image search (with 2 requests and filters):**
    ```json
    {
      "search": ["Nature", "Birds"],
      "type": "images"
      "minSize": {
        "width": 1920,
        "height": 1080
      }
    }
    ```

*   **Video search (with filters):**
    ```json
    {
      "search": ["Nodejs tutorial"],
      "type": "videos",
      "maxResults": 5,
      "minDuration": "01:00:00",
      "site": "youtube"
    }
    ```

---

## Code Examples

### JavaScript (Fetch)
```javascript
const url = 'https://miklium.vercel.app/api/search';
const data = {
  search: ["JavaScript tutorial"],
  type: "videos",
  maxResults: 3,
  minDuration: "10:00",
  site: "youtube"
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Python (Requests)
```python
import requests

url = "https://miklium.vercel.app/api/search"
data = {
    "search": ["Cyberpunk landscape"],
    "type": "images",
    "maxResults": 5,
    "minWidth": 1280
}

try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### cURL
```bash
curl -X POST https://miklium.vercel.app/api/search \
     -H "Content-Type: application/json" \
     -d '{
           "search": ["iPhone 17 Pro"],
           "type": "default",
           "maxSmallSnippets": 3,
           "maxLargeSnippets": 1
         }'
```

---

## API Responses

### Success (Web Search)

**Components of `results` elements for `'default'` type:**
| Parameter | Value |
| :--- | :--- |
| `query` | `String`, The query associated with this result |
| `symbols` | `Number`, The number of characters in the snippet |
| `url` | `String`, Link to the source webpage |
| `type` | `String: short OR long`, The format of information (search engine description vs. full-text scrape) |
| `snippet` | `String`, The text content itself |

**Response example:**
```json
{
  "success": true,
  "results": [
    {
      "symbols": 194,
      "query": "iPhone Air",
      "url": "https://en.wikipedia.org/wiki/Iphone_air",
      "type": "short",
      "snippet": "iPhone Air is rumored to be..."
    },
    {
      "symbols": 4350,
      "query": "iPhone Air",
      "url": "https://www.pcmag.com/reviews/apple-iphone-air",
      "type": "long",
      "snippet": "Apple is reportedly developing a super-thin smartphone..."
    }
  ]
}
```

### Success (Image Search)

**Components of `results` elements for `'images'` type:**
| Parameter | Value |
| :--- | :--- |
| `imageUrl` | `String`, Direct link to the image |
| `title` | `String`, Image title or alt text |
| `referenceUrl` | `String`, Page URL where the image is hosted |
| `size` | `Object`, Contains `width` (Number or `null`) and `height` (Number or `null`) |
| `query` | `String`, The search query associated with this result |

**Response example:**
```json
{
  "success": true,
  "results": [
    {
      "imageUrl": "https://example.com/wp-content/uploads/neon_city.jpg",
      "title": "Neon City Grid Wallpaper",
      "referenceUrl": "https://example.com/neon-city-gallery",
      "size": {
        "width": 1920,
        "height": 1080
      },
      "query": "Neon city wallpaper"
    }
  ]
}
```

### Success (Video Search)

**Components of `results` elements for `'videos'` type:**
| Parameter | Value |
| :--- | :--- |
| `videoUrl` | `String`, Direct link to the video (or video page) |
| `thumbUrl` | `String`, Link to the video thumbnail |
| `title` | `String`, Title of the video |
| `description` | `String`, Brief video description |
| `duration` | `String`, Video length (e.g. `"10:15"`, `"1:30:00"`, or `null`) |
| `query` | `String`, The search query associated with this result |

**Response example:**
```json
{
  "success": true,
  "results": [
    {
      "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "thumbUrl": "https://tse2.mm.bing.net/th/id/OVP.Tr3QV0Ijo966Ruun8RTPXwHgFo?pid=Api&h=360&w=480&c=7&rs=1",
      "title": "Rick Astley - Never Gonna Give You Up",
      "description": "The official video for “Never Gonna Give You Up” by Rick Astley...",
      "duration": "3:34",
      "query": "Lofi music"
    }
  ]
}
```

### Error

| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `error` | `String`, Error message details |

**Error response example:**
```json
{
  "success": false,
  "error": "Invalid type parameter"
}
```

---

## Additional Information

### Filtering Media Results

*   **Resolution Filters:** For images, setting parameters like `minWidth`, `maxWidth`, `minHeight`, and `maxHeight` strictly filters out items that do not meet the criteria. If Yahoo does not provide metadata size parameters, those items may also be excluded to ensure quality.
*   **Duration Parsing:** Video durations are parsed dynamically. Filters accept duration strings formatted as `"MM:SS"` or `"HH:MM:SS"`, as well as raw numbers representing seconds. For example, setting `minDuration: "05:00"` or `minDuration: 300` will ensure only videos longer than 5 minutes are retrieved.

### Choosing the Right Web Format

> [!NOTE]
> Applies only when `type` is set to `'default'`

*   **Short vs. Long Snippets:** Information marked `short` is parsed directly from the search engine result page (SERP) snippet text. The `long` type represents full-text scrapes. 
*   **Disabling Formats:**
    *   Set `maxSmallSnippets: 0` to fetch only `long` articles (completely avoiding short snippets).
    *   Set `maxLargeSnippets: 0` to fetch only `short` search engine summaries (disabling the scraping phase for faster response times).
*   **Formatting Limits:** The parameter `maxLargeSnippetSymbols` defines the character cutoff limit for scraped web articles (defaults to `4500` characters) to prevent excessive payloads.

---

## What Services Does This API Use?

- [Yahoo Search / Images / Video](https://search.yahoo.com)

---
# YouTube Transcription API Documentation

## Navigation
**[Back to MIKLIUM APIs navigation](#navigation)**


- [YouTube Transcription API Documentation](#youtube-transcription-api-documentation)
    - [Navigation](#navigation-6)
    - [About MIKLIUM YouTube Transcription API](#about-miklium-youtube-transcription-api)
    - [Request Body](#request-body-4)
        - [GET Method](#get-method-3)
        - [POST Method](#post-method-5)
    - [Code Examples](#code-examples-5)
    - [API Responses](#api-responses-5)
        - [Success](#success-4)
        - [Error](#error-5)
    - [What Services Does This API Use?](#what-services-does-this-api-use-2)

## About MIKLIUM YouTube Transcription API

**Get text from a YouTube video in seconds using our API.** Also with the transcription of the video you can get additional details such as title, channel name, stats, etc. To work, you only need a link to a YouTube video.

> [!NOTE]
> This API works only with YouTube videos.

## Request Body

Link: `https://miklium.vercel.app/api/youtube-transcript`

| Parameter | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `url` | Yes | Text | Link to the YouTube video from which you want to extract the text |
| `removeTimestamps` | No | Boolean | Whether to remove timestamps from the transcription (by default `false`) |
| `includeInfo` | No | Boolean | Whether to include additional video details such as title, channel name, stats and more (by default `false`) |

### GET Method

`https://miklium.vercel.app/api/youtube-transcript?url=Paste Your link here`

If you want to add additional parameters, write them through `&`.

> [!IMPORTANT]
> For GET Method the link to the YouTube video should be URL-encoded!

**Request Link Example:**
* `https://miklium.vercel.app/api/youtube-transcript?url=https://youtu.be/Qz8u00pX738`
* `https://miklium.vercel.app/api/youtube-transcript?url=https://youtu.be/dQw4w9WgXcQ&removeTimestamps=true&includeInfo=true`

### POST Method

`https://miklium.vercel.app/api/youtube-transcript`

```javascript
{
  "url": "Paste Your link here",
  "removeTimestamps": true, // Boolean (Not necessarily)
  "includeInfo": true // Boolean (Not necessarily)
}
```

**Request Body Example (JSON):**
```javascript
{
  "url": "https://youtu.be/Qz8u00pX738"
}
```
```javascript
{
  "url": "https://youtu.be/dQw4w9WgXcQ",
  "removeTimestamps": true,
  "includeInfo": true
}
```

## Code Examples

### JavaScript (Fetch)
```javascript
const url = 'https://miklium.vercel.app/api/youtube-transcript';
const data = {
  url: "https://youtu.be/Qz8u00pX738",
  removeTimestamps: true,
  includeInfo: true
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Python (Requests)
```python
import requests

url = "https://miklium.vercel.app/api/youtube-transcript"
data = {
    "url": "https://youtu.be/Qz8u00pX738",
    "removeTimestamps": True,
    "includeInfo": True
}

try:
    response = requests.post(url, json=data)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### cURL
```bash
curl -X POST https://miklium.vercel.app/api/youtube-transcript \
     -H "Content-Type: application/json" \
     -d '{
           "url": "https://youtu.be/Qz8u00pX738",
           "removeTimestamps": true,
           "includeInfo": true
         }'
```

## API Responses

### Success

**General response:**
| Parameter | Value |
| :--- | :--- |
| `success` | `true` |
| `transcript` | `String`, Video transcription |
| `info` | `Dictionary`, Video info (if `includeInfo` is `true`) |

**Structure of `info`:**
```javascript
{
  "video": {
    "id": "...", // Video ID
    "title": "...", // Video title
    "description": "...", // Video description
    "duration": "00:00:00", // Video duration in 'HH:MM:SS' format
    "date": "…", // Date the video was posted in ISO 8601 format
    "hashtags": [
        "#…",
        "#..."
    ] // Video hashtags
  },
  "channel": {
    "name": "...", // Channel name
    "username": "...", // Channel username
    "subscribers": 0 // Subscribers count
  },
  "stats": {
    "views": 0, // Views count
    "likes": 0, // Likes count
    "comments": 0 // Comments count
  }
}
```

**Success response example:**
```javascript
{
  "success": true,
  "transcript": "Voiceover: Want to see something gorgeous…",
  "info": {
    "video": {
      "id": "Qz8u00pX738",
      "title": "New things on the way from Apple",
      "description": "Woah. Here’s your guide to some of the big announcements from this year’s Worldwide Developers Conference...",
      "duration": "00:02:13",
      "date": "2025-06-09T18:41:34.000Z",
      "hashtags": [
        "#LiquidGlass",
        "#AppleEvent",
        "#WWDC25"
      ]
    },
    "channel": {
      "name": "Apple",
      "username": "Apple",
      "subscribers": 20600000
    },
    "stats": {
      "views": 1673530,
      "likes": 41000,
      "comments": 0
    }
  }
}
```

### Error

| Parameter | Value |
| :--- | :--- |
| `success` | `false` |
| `error` | `String`, Error message |

**Error response example:**
```javascript
{
  "success": false,
  "error": "Invalid YouTube URL."
}
```

## What Services Does This API Use?

- [YouTube Scraper (Created by @Streamers at Apify)](https://apify.com/streamers/youtube-scraper)
