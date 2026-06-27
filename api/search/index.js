const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const MAX_SEARCH_QUERIES_LIMIT = 5;
const DEFAULT_MAX_RESULTS = 10;
const MAX_RESULTS_LIMIT = 50;
const MAX_SNIPPETS_SUM_LIMIT = 50;
const DEFAULT_MAX_SMALL_SNIPPETS = 5;
const DEFAULT_MAX_LARGE_SNIPPETS = 2;
const DEFAULT_MAX_LARGE_SNIPPET_SYMBOLS = 4500;
const MAX_LARGE_SNIPPET_SYMBOLS_LIMIT = 12000;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5',
  minVersion: 'TLSv1.2'
});

const generateB = () => Math.random().toString(36).substring(2, 10) + '&b=3&s=' + Math.random().toString(36).substring(2, 4);

let globalCookies = new Map([
  ['B', generateB()]
]);

function getRandomUserAgent() {
  const chromeVersion = Math.floor(Math.random() * 16) + 120;
  const firefoxVersion = Math.floor(Math.random() * 16) + 120;
  const safariVersion = Math.floor(Math.random() * 3) + 16;
  const macOsMinor = Math.floor(Math.random() * 8);

  const templates = [
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${firefoxVersion}.0) Gecko/20100101 Firefox/${firefoxVersion}.0`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_${macOsMinor}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion}.0 Safari/605.1.15`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36 Edg/${chromeVersion}.0.0.0`,
    `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function generateYahooUrl(baseUrl, query) {
  return `${baseUrl}?p=${encodeURIComponent(query)}&fr2=sb-top&ei=UTF-8&fr=sfp`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateCookies(setCookieHeader) {
  if (!Array.isArray(setCookieHeader)) return;
  setCookieHeader.forEach(c => {
    const mainPart = c.split(';')[0];
    const parts = mainPart.split('=');
    const k = parts.shift()?.trim();
    const v = parts.join('=');
    if (k && v) globalCookies.set(k, v);
  });
}

function getCookieString() {
  return Array.from(globalCookies.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function isLowValue(text) {
  if (!text || text.length < 20) return true;
  const badPhrases = ['Loading...', 'Creating an answer', 'AI-generated answer', 'Refresh your page'];
  return badPhrases.some(phrase => text.includes(phrase));
}

function isQualityContent(text) {
  if (!text) return false;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 30) return false;
  const cleanLetters = text.replace(/[^\p{L}]/gu, '');
  if (cleanLetters.length === 0) return true;
  const upperCaseRatio = (cleanLetters.match(/\p{Lu}/gu) || []).length / cleanLetters.length;
  return upperCaseRatio < 0.45;
}

function cleanHtmlText(html) {
  if (!html) return '';
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, .advertisement, .ads, noscript, iframe').remove();
  $('*').each((i, elem) => {
    $(elem).removeAttr('class').removeAttr('id').removeAttr('style');
  });
  return $('body').text().trim().replace(/\s+/g, ' ');
}

function extractRealUrl(href) {
  if (!href) return null;
  if (!href.includes('r.search.yahoo.com')) {
    try { new URL(href); return href; } catch { return null; }
  }
  const match = href.match(/RU=([^/]+)/);
  if (match && match[1]) {
    try {
      const decoded = decodeURIComponent(match[1]);
      return decoded.split('#')[0];
    } catch { return null; }
  }
  return null;
}

function extractVideoUrl(href) {
  if (!href) return null;
  try {
    if (href.includes('r.search.yahoo.com')) {
      const decoded = extractRealUrl(href);
      if (decoded) return decoded;
    }
    const urlObj = new URL(href, 'https://video.search.yahoo.com');
    const rUrl = urlObj.searchParams.get('rurl') || urlObj.searchParams.get('imgurl');
    if (rUrl) return decodeURIComponent(rUrl);
  } catch (e) {}
  return href;
}

function parseDurationToSec(val) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    if (val.includes(':')) {
      const parts = val.split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseNum(val) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function extractYoutubeId(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/')[2];
      }
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.substring(1);
    }
  } catch (e) {}
  return null;
}

async function fetchYoutubeMetadata(videoIds) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables.');
    return {};
  }
  if (videoIds.length === 0) {
    return {};
  }
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        id: videoIds.join(','),
        key: apiKey
      }
    });
    const items = response.data?.items || [];
    const dataMap = {};
    for (const item of items) {
      dataMap[item.id] = {
        channelTitle: item.snippet?.channelTitle || '',
        description: item.snippet?.description || '',
        statistics: {
          viewCount: item.statistics?.viewCount || '0',
          likeCount: item.statistics?.likeCount || '0',
          commentCount: item.statistics?.commentCount || '0'
        }
      };
    }
    return dataMap;
  } catch (e) {
    console.error('YouTube API Fetch error:', e.message, e.response?.data);
    return {};
  }
}

async function fetchWithFallback(url, maxSymbols = 5000, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 9000,
        httpsAgent,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const cleaned = cleanHtmlText(response.data);
      if (isQualityContent(cleaned)) return cleaned.substring(0, maxSymbols);
    } catch (e) {
      if (i === maxRetries - 1) throw e;
    }
  }
  throw new Error('Content not qualified');
}

async function handleYahooConsent(consentUrl, baseHeaders) {
  const currentHeaders = { ...baseHeaders };
  currentHeaders['Cookie'] = getCookieString();
  try {
    const consentRes = await axios.get(consentUrl, {
      headers: currentHeaders,
      httpsAgent,
      maxRedirects: 0,
      validateStatus: () => true
    });

    if (consentRes.headers['set-cookie']) updateCookies(consentRes.headers['set-cookie']);
    
    const $ = cheerio.load(consentRes.data);
    const formParams = new URLSearchParams();
    let formFound = false;

    $('form input[type="hidden"]').each((i, el) => {
      formFound = true;
      const name = $(el).attr('name');
      const value = $(el).attr('value');
      if (name && value) formParams.append(name, value);
    });
    
    formParams.append('agree', 'agree');

    if (formFound) {
      const postRes = await axios.post(consentUrl, formParams.toString(), {
        headers: {
          ...currentHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': getCookieString(),
          'Origin': 'https://consent.yahoo.com',
          'Referer': consentUrl
        },
        httpsAgent,
        maxRedirects: 0,
        validateStatus: () => true
      });

      if (postRes.headers['set-cookie']) updateCookies(postRes.headers['set-cookie']);
      
      if (postRes.headers['location']) {
        return new URL(postRes.headers['location'], consentUrl).toString();
      }
    }
  } catch (e) {
    console.error('Yahoo Consent flow failed:', e.message);
  }
  return null;
}

async function fetchYahooHtml(url, baseHeaders, maxRedirects = 4) {
  let currentUrl = url;
  let currentHeaders = { ...baseHeaders };

  for (let redirectCount = 0; redirectCount < maxRedirects; redirectCount++) {
    currentHeaders['Cookie'] = getCookieString();
    
    const response = await axios.get(currentUrl, {
      timeout: 18000,
      headers: currentHeaders,
      httpsAgent,
      maxRedirects: 0,
      validateStatus: () => true 
    });

    const bodyStr = response.data ? String(response.data) : '';
    const contentLength = bodyStr.length;

    if (response.headers['set-cookie']) {
      updateCookies(response.headers['set-cookie']);
    }

    if (response.status >= 300 && response.status < 400 && response.headers['location']) {
      const redirectUrl = new URL(response.headers['location'], currentUrl).toString();

      if (redirectUrl.includes('consent.yahoo.com') || redirectUrl.includes('guce.yahoo.com')) {
        const nextUrl = await handleYahooConsent(redirectUrl, baseHeaders);
        if (nextUrl) {
          currentUrl = nextUrl;
          continue;
        }
      }
      currentUrl = redirectUrl;
      continue;
    }

    if (response.status >= 400 || response.status === 999) {
      throw new Error(`Yahoo returned status ${response.status} (Body size: ${contentLength} bytes)`);
    }

    if (bodyStr.includes('Unable to process request') || bodyStr.includes('999 Unable to process') || bodyStr.includes('unusual traffic') || bodyStr.includes('unusual activity')) {
      throw new Error(`Yahoo blocked the request or detected unusual traffic (Status: ${response.status})`);
    }

    if (bodyStr.includes('consent.yahoo.com') || bodyStr.includes('guce.yahoo.com')) {
      const match = bodyStr.match(/https?:\/\/(?:consent|guce)\.yahoo\.com[^\s'"]*/);
      if (match) {
        const nextUrl = await handleYahooConsent(match[0], baseHeaders);
        if (nextUrl) {
          currentUrl = nextUrl;
          continue;
        }
      }
    }
    
    return bodyStr;
  }
  throw new Error('Redirect limit exceeded');
}

async function yahooFetchWithRetry(url, maxRetries = 3) {
  const baseHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const headers = { ...baseHeaders, 'User-Agent': getRandomUserAgent() };
    try {
      const html = await fetchYahooHtml(url, headers);
      if (html && html.length > 500) return html;
      throw new Error(`Invalid response body`);
    } catch (error) {
      console.error(`Attempt ${attempt} to fetch URL failed:`, error.message);
      if (attempt === maxRetries) throw error;
      await delay(1500);
    }
  }
}

async function searchYahooDefault(query) {
  const url = generateYahooUrl('https://search.yahoo.com/search', query);
  const html = await yahooFetchWithRetry(url);
  const results = [];
  const $ = cheerio.load(html);

  $('.algo, .algo-sr, .dd.algo, div[class*="algo"]').each((i, elem) => {
    const $elem = $(elem);
    const linkEl = $elem.find('a[href*="/RU="], h3 a, a.ac-algo').first();
    const href = linkEl.attr('href');
    const snippet = $elem.find('.compText, div[class*="compText"]').text().trim();
    const realUrl = extractRealUrl(href);
    if (realUrl && snippet) results.push({ realUrl, snippet });
  });

  if (results.length === 0) {
    $('a[href*="/RU="]').each((i, elem) => {
      const href = $(elem).attr('href');
      const realUrl = extractRealUrl(href);
      const parent = $(elem).closest('div');
      const snippet = parent.parent().find('.compText, div[class*="compText"]').first().text().trim() ||
                      parent.nextAll('.compText, div[class*="compText"]').first().text().trim();
      if (realUrl && snippet && snippet.length > 10) results.push({ realUrl, snippet });
    });
  }
  return results;
}

async function searchYahooImages(query, maxResults, filters) {
  const url = generateYahooUrl('https://images.search.yahoo.com/search/images', query);
  const html = await yahooFetchWithRetry(url);
  const results = [];
  const $ = cheerio.load(html);

  const targets = $('li.ld, li.tile, .tile, div.s-item, a[data-origurl]');

  targets.each((i, elem) => {
    if (results.length >= maxResults) return false;
    const $elem = $(elem);
    const anchor = $elem.is('a') ? $elem : $elem.find('a[data-origurl], a').first();
    
    if (!anchor.length) return;

    let imageUrl = anchor.attr('data-origurl') || null;
    const href = anchor.attr('href');
    const referenceUrl = anchor.attr('data-referenceurl') || null;

    if (!imageUrl && href) {
      try {
        const urlObj = new URL(href, 'https://images.search.yahoo.com');
        const imgUrlParam = urlObj.searchParams.get('imgurl');
        if (imgUrlParam) imageUrl = decodeURIComponent(imgUrlParam);
      } catch (e) {}
    }

    if (!imageUrl) return;

    const img = anchor.find('img').first();
    const title = anchor.find('.tile-title').text().trim() || img.attr('title') || img.attr('alt') || '';

    let meta = {};
    const dataMeta = img.attr('data-meta');
    if (dataMeta) {
      try { meta = JSON.parse(dataMeta); } catch (e) {}
    }

    const width = meta.ow ? parseInt(meta.ow, 10) : 0;
    const height = meta.oh ? parseInt(meta.oh, 10) : 0;

    if (filters.minWidth && width < filters.minWidth) return;
    if (filters.maxWidth && width > filters.maxWidth) return;
    if (filters.minHeight && height < filters.minHeight) return;
    if (filters.maxHeight && height > filters.maxHeight) return;

    results.push({
      imageUrl,
      title,
      referenceUrl,
      size: { width: width || null, height: height || null },
      query
    });
  });

  if (results.length === 0) {
    $('a').each((i, elem) => {
      if (results.length >= maxResults) return false;
      const href = $(elem).attr('href');
      if (!href) return;
      try {
        const urlObj = new URL(href, 'https://images.search.yahoo.com');
        const imgUrlParam = urlObj.searchParams.get('imgurl');
        if (imgUrlParam) {
          const imageUrl = decodeURIComponent(imgUrlParam);
          const rUrlParam = urlObj.searchParams.get('rurl');
          const referenceUrl = rUrlParam ? decodeURIComponent(rUrlParam) : null;
          const img = $(elem).find('img').first();
          const title = $(elem).text().trim() || img.attr('title') || img.attr('alt') || '';
          results.push({
            imageUrl,
            title,
            referenceUrl,
            size: { width: null, height: null },
            query
          });
        }
      } catch (e) {}
    });
  }

  return results;
}

async function searchYahooVideos(query, maxResults, filters) {
  const url = generateYahooUrl('https://video.search.yahoo.com/search/video', query);
  const html = await yahooFetchWithRetry(url);
  const results = [];
  const $ = cheerio.load(html);

  $('li.tile, li.vp').each((i, elem) => {
    if (results.length >= maxResults) return false;
    const $elem = $(elem);
    const anchor = $elem.find('a').first();
    if (!anchor.length) return;

    const href = anchor.attr('href');
    let videoUrl = extractVideoUrl(href);
    let site = '';
    
    if (videoUrl) {
      try {
        site = new URL(videoUrl).hostname.toLowerCase();
      } catch (e) {}
    }

    if (filters.site) {
      if (!site || !site.includes(filters.site.toLowerCase())) return;
    }

    const img = anchor.find('img').first();
    const thumbUrl = img.attr('src') || img.attr('data-src') || null;
    const duration = anchor.find('.time, .v-time').text().trim() || null;
    
    if (filters.minDuration || filters.maxDuration) {
      const durationSec = parseDurationToSec(duration);
      if (filters.minDuration && durationSec < filters.minDuration) return;
      if (filters.maxDuration && durationSec > filters.maxDuration) return;
    }

    const description = anchor.find('.tile-description, .v-desc').text().trim() || '';
    const title = anchor.find('.tile-title, .v-title').text().trim() || img.attr('title') || img.attr('alt') || '';

    if (videoUrl) {
      results.push({ videoUrl, thumbUrl, title, description, duration, query });
    }
  });

  if (results.length === 0) {
    $('a').each((i, elem) => {
      if (results.length >= maxResults) return false;
      const href = $(elem).attr('href');
      if (!href) return;
      try {
        const videoUrl = extractVideoUrl(href);
        if (videoUrl) {
          const site = new URL(videoUrl).hostname.toLowerCase();
          if (filters.site && !site.includes(filters.site.toLowerCase())) return;

          const img = $(elem).find('img').first();
          const thumbUrl = img.attr('src') || img.attr('data-src') || null;
          const title = $(elem).text().trim() || img.attr('title') || img.attr('alt') || '';
          
          results.push({
            videoUrl,
            thumbUrl,
            title,
            description: '',
            duration: null,
            query
          });
        }
      } catch (e) {}
    });
  }

  return results;
}

async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();

  let search = [];
  let type = 'default';
  let maxResults = DEFAULT_MAX_RESULTS;
  let maxSmallSnippets = DEFAULT_MAX_SMALL_SNIPPETS;
  let maxLargeSnippets = DEFAULT_MAX_LARGE_SNIPPETS;
  let maxLargeSnippetSymbols = DEFAULT_MAX_LARGE_SNIPPET_SYMBOLS;
  let includeAdditionalData = false;
  
  let filters = {
    minWidth: 0,
    maxWidth: 0,
    minHeight: 0,
    maxHeight: 0,
    minDuration: 0,
    maxDuration: 0,
    site: ''
  };

  try {
    if (request.method === 'GET') {
      const url = request.url;
      const queryStart = url.indexOf('?');
      if (queryStart !== -1) {
        const params = new URLSearchParams(url.substring(queryStart + 1));
        const searchParam = params.get('search');
        search = searchParam ? searchParam.split('~').map(s => s.trim()).filter(Boolean) : [];
        if (params.get('type')) type = params.get('type');
        if (params.get('includeAdditionalData') === 'true') includeAdditionalData = true;
        
        if (params.get('maxResults') !== null) {
          maxResults = parseNum(params.get('maxResults'));
        }
        if (params.get('maxSmallSnippets') !== null) {
          maxSmallSnippets = parseNum(params.get('maxSmallSnippets'));
        }
        if (params.get('maxLargeSnippets') !== null) {
          maxLargeSnippets = parseNum(params.get('maxLargeSnippets'));
        }
        if (params.get('maxLargeSnippetSymbols') !== null) {
          maxLargeSnippetSymbols = parseNum(params.get('maxLargeSnippetSymbols'));
        }

        filters.minWidth = parseNum(params.get('minWidth'));
        filters.maxWidth = parseNum(params.get('maxWidth'));
        filters.minHeight = parseNum(params.get('minHeight'));
        filters.maxHeight = parseNum(params.get('maxHeight'));
        filters.minDuration = parseDurationToSec(params.get('minDuration'));
        filters.maxDuration = parseDurationToSec(params.get('maxDuration'));
        filters.site = params.get('site') || '';
      }
    } else if (request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk.toString();
      let parsed;
      try { parsed = JSON.parse(body); } catch (e) { return response.status(400).json({ success: false, error: 'Invalid JSON' }); }
      
      search = Array.isArray(parsed.search) ? parsed.search : [];
      if (parsed.type) type = parsed.type;
      if (parsed.includeAdditionalData !== undefined) {
        includeAdditionalData = parsed.includeAdditionalData === true || parsed.includeAdditionalData === 'true';
      }
      if (parsed.maxResults !== undefined) maxResults = parseNum(parsed.maxResults);
      if (parsed.maxSmallSnippets !== undefined) maxSmallSnippets = parseNum(parsed.maxSmallSnippets);
      if (parsed.maxLargeSnippets !== undefined) maxLargeSnippets = parseNum(parsed.maxLargeSnippets);
      if (parsed.maxLargeSnippetSymbols !== undefined) maxLargeSnippetSymbols = parseNum(parsed.maxLargeSnippetSymbols);
      if (parsed.minWidth !== undefined) filters.minWidth = parseNum(parsed.minWidth);
      if (parsed.maxWidth !== undefined) filters.maxWidth = parseNum(parsed.maxWidth);
      if (parsed.minHeight !== undefined) filters.minHeight = parseNum(parsed.minHeight);
      if (parsed.maxHeight !== undefined) filters.maxHeight = parseNum(parsed.maxHeight);
      if (parsed.minDuration !== undefined) filters.minDuration = parseDurationToSec(parsed.minDuration);
      if (parsed.maxDuration !== undefined) filters.maxDuration = parseDurationToSec(parsed.maxDuration);
      if (parsed.site !== undefined) filters.site = String(parsed.site);
    } else {
      return response.status(405).json({ success: false, error: 'Method not allowed' });
    }

    if (!['default', 'images', 'videos'].includes(type)) {
      return response.status(400).json({ success: false, error: 'Invalid type parameter' });
    }
    if (!Array.isArray(search) || search.length === 0) {
      return response.status(400).json({ success: false, error: 'Invalid search parameter' });
    }

    if (type === 'images' || type === 'videos') {
      if (maxResults <= 0) {
        return response.status(400).json({ success: false, error: 'maxResults must be greater than 0' });
      }
      if (maxResults > MAX_RESULTS_LIMIT) {
        return response.status(400).json({ success: false, error: `maxResults cannot exceed ${MAX_RESULTS_LIMIT}` });
      }
    } else if (type === 'default') {
      if (maxSmallSnippets < 0 || maxLargeSnippets < 0) {
        return response.status(400).json({ success: false, error: 'Snippet limits cannot be negative' });
      }
      if (maxSmallSnippets === 0 && maxLargeSnippets === 0) {
        return response.status(400).json({ success: false, error: 'Both maxSmallSnippets and maxLargeSnippets cannot be 0' });
      }
      if (maxSmallSnippets + maxLargeSnippets > MAX_SNIPPETS_SUM_LIMIT) {
        return response.status(400).json({ success: false, error: `Combined snippets (maxSmallSnippets + maxLargeSnippets) cannot exceed ${MAX_SNIPPETS_SUM_LIMIT}` });
      }
      if (maxLargeSnippetSymbols <= 0) {
        return response.status(400).json({ success: false, error: 'maxLargeSnippetSymbols must be greater than 0' });
      }
      if (maxLargeSnippetSymbols > MAX_LARGE_SNIPPET_SYMBOLS_LIMIT) {
        return response.status(400).json({ success: false, error: `maxLargeSnippetSymbols cannot exceed ${MAX_LARGE_SNIPPET_SYMBOLS_LIMIT}` });
      }
    }

    const results = [];
    const processedDomains = new Set();

    for (const query of search.slice(0, MAX_SEARCH_QUERIES_LIMIT)) {
      const queryDomains = new Set();
      let queryShortCount = 0;
      let queryLongCount = 0;

      const searchQuery = filters.site ? `${query} site:${filters.site}` : query;

      try {
        if (type === 'images') {
          results.push(...(await searchYahooImages(searchQuery, maxResults, filters)));
        } else if (type === 'videos') {
          results.push(...(await searchYahooVideos(searchQuery, maxResults, filters)));
        } else {
          const queryResults = await searchYahooDefault(searchQuery);
          for (const item of queryResults) {
            if (queryShortCount >= maxSmallSnippets && queryLongCount >= maxLargeSnippets) break;
            const { realUrl, snippet } = item;
            if (!realUrl || !snippet) continue;

            if (maxSmallSnippets > 0 && queryShortCount < maxSmallSnippets) {
              if (snippet && !isLowValue(snippet) && snippet.length > 30) {
                results.push({ url: realUrl, snippet, type: 'short', symbols: snippet.length, query });
                queryShortCount++;
              }
            }

            if (maxLargeSnippets > 0 && queryLongCount < maxLargeSnippets) {
              try {
                const urlObj = new URL(realUrl);
                const domain = `${urlObj.protocol}//${urlObj.hostname}`;
                if (!processedDomains.has(domain) && !queryDomains.has(domain)) {
                  queryDomains.add(domain);
                  processedDomains.add(domain);
                  const fullContent = await fetchWithFallback(realUrl, maxLargeSnippetSymbols);
                  results.push({ url: realUrl, snippet: fullContent, type: 'long', symbols: fullContent.length, query });
                  queryLongCount++;
                }
              } catch (e) {}
            }
          }
        }
      } catch (error) {
        console.error(`Error processing query "${query}":`, error.message, error.stack);
        continue;
      }
    }

    let finalResults = results.slice(0, MAX_RESULTS_LIMIT);

    if (type === 'videos' && includeAdditionalData) {
      const ytVideoIds = [];
      const ytResults = [];
      for (const res of finalResults) {
        const ytId = extractYoutubeId(res.videoUrl);
        if (ytId) {
          ytVideoIds.push(ytId);
          ytResults.push({ result: res, ytId });
        }
      }

      if (ytVideoIds.length > 0) {
        const ytDataMap = await fetchYoutubeMetadata(ytVideoIds);
        for (const item of ytResults) {
          const meta = ytDataMap[item.ytId];
          if (meta) {
            item.result.description = meta.description;
            item.result.additionalData = {
              type: 'youtube',
              channelTitle: meta.channelTitle,
              statistics: meta.statistics
            };
          }
        }
      }
    }

    if (finalResults.length === 0) return response.status(404).json({ success: false, error: 'No results found' });
    return response.status(200).json({ results: finalResults, success: true });

  } catch (error) {
    console.error('Internal handler error:', error.message, error.stack);
    return response.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = handler;
