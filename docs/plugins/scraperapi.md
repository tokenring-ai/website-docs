# ScraperAPI Plugin

Web scraping integration via ScraperAPI for HTML fetching, Google SERP, and Google News with geotargeting.

## Overview

The `@tokenring-ai/scraperapi` package integrates ScraperAPI into the Token Ring AI ecosystem, providing robust web scraping capabilities. It enables fetching raw HTML from web pages (with optional JavaScript rendering), structured Google Search Engine Results Pages (SERP), and Google News results. This package extends the `WebSearchProvider` from `@tokenring-ai/websearch`.

## Key Features

- **HTML Fetching**: Retrieve page content with or without JS rendering
- **Google SERP**: Structured JSON/CSV results including organic results, knowledge graphs, related questions
- **Google News**: Structured articles with sources, thumbnails, dates, and pagination
- **Geotargeting**: Support for country codes, TLDs, and UULE for location-specific results
- **Error Handling**: Standardized errors with status codes and retry logic
- **Device Emulation**: Desktop/mobile user-agent support

## Core Components

### ScraperAPIWebSearchProvider

Extends `WebSearchProvider` to handle ScraperAPI interactions.

**Constructor:**
```typescript
new ScraperAPIWebSearchProvider({
  apiKey: string,              // required
  countryCode?: string,        // e.g., 'us', 'gb'
  tld?: string,                // e.g., 'com', 'co.uk'
  render?: boolean,            // enable JS rendering
  deviceType?: 'desktop' | 'mobile'
})
```

**Key Methods:**

- `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
  - Performs Google SERP search
  - Returns structured search results with organic results, knowledge graph, etc.
  - Uses `outputFormat: 'json'` by default

- `searchNews(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
  - Performs Google News search
  - Returns news articles with title, source, date, link
  - Supports pagination and time-based filtering

- `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`
  - Fetches HTML for a URL
  - Supports `render` and `countryCode` options
  - Returns: `{ html: string }`

**Private Methods:**
- `fetchHtml(url, opts)`: Builds query params and fetches via retry logic
- `googleSerp(query, opts)`: Constructs SERP endpoint URL with Google params
- `googleNews(query, opts)`: Similar to googleSerp but for News endpoint
- `buildQuery(params)`: Builds URLSearchParams, skipping undefined/null values

## Usage Examples

### Basic Web Search (SERP)

```typescript
import ScraperAPIWebSearchProvider from '@tokenring-ai/scraperapi';

const provider = new ScraperAPIWebSearchProvider({ apiKey: 'your-api-key' });
const results = await provider.searchWeb('cherry tomatoes', { countryCode: 'us' });
console.log(results.results[0].organic_results);
```

### Google News Search

```typescript
const newsResults = await provider.searchNews('Space exploration', {
  num: 20,
  tbs: 'w'  // Past week
});
console.log(newsResults.results[0].articles);
```

### Fetch Page HTML with Rendering

```typescript
const page = await provider.fetchPage('https://example.com', {
  render: true,
  countryCode: 'gb'
});
console.log(page.html);
```

## Configuration Options

### Provider Options
- `apiKey`: Required ScraperAPI key
- `countryCode`: Two-letter ISO code (e.g., 'us', 'gb')
- `tld`: Google TLD (e.g., 'com', 'co.uk'), defaults to 'com'
- `render`: Enable JS rendering (costs extra credits), defaults to false
- `deviceType`: 'desktop' or 'mobile' for user-agent emulation

### Google Search Parameters
- `num`: Results count per page
- `tbs`: Time filter ('h' hour, 'd' day, 'w' week, 'm' month, 'y' year)
- `hl`/`gl`: Language/country codes
- `start`: Pagination offset
- `uule`: Precise location encoding
- `ie`/`oe`: Input/output encoding (default UTF-8)
- `outputFormat`: 'json' or 'csv'

**Environment Variables:**
- `SCRAPERAPI_KEY`: Set for security

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: AI client integration
- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/websearch@0.1.0`: Web search abstraction
- `@tokenring-ai/utility`: For `doFetchWithRetry`

## Notes

- Subject to ScraperAPI credits and rate limits
- Ethical use: Honor robots.txt and avoid high-frequency scraping
- Cache results where possible to reduce API calls
- JS rendering costs extra credits
- Text-only; binary files not supported
