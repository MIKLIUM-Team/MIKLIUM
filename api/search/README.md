# Search API Documentation

## Navigation

- [Search API Documentation](#search-api-documentation)
    - [Navigation](#navigation)
    - [About MIKLIUM Search API](#about-miklium-search-api)
    - [Request Parameters](#request-parameters)
        - [GET Method](#get-method)
        - [POST Method](#post-method)
    - [Code Examples](#code-examples)
    - [API Responses](#api-responses)
        - [Success (Web Search)](#success-web-search)
        - [Success (Image Search)](#success-image-search)
        - [Success (Video Search)](#success-video-search)
        - [Error](#error)
    - [Additional Information](#additional-information)
        - [Filtering Media Results](#filtering-media-results)
        - [Choosing the Right Web Format](#choosing-the-right-web-format)
    - [What Services Does This API Use?](#what-services-does-this-api-use)

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