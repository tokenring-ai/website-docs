# Serper Plugin

Serper.dev API integration for Google web searches and news with structured results and geotargeting.

## Overview

The `@tokenring-ai/serper` package provides an integration with the Serper.dev API for performing Google web searches and news searches within the Token Ring AI framework. It extends the `WebSearchProvider` from `@tokenring-ai/websearch` to enable seamless web search capabilities, including organic search results, knowledge graphs, related searches, and news articles.

## Key Features

- **Google Web Search**: Organic results, knowledge graphs, related searches, and more
- **Google News Search**: Structured news articles with sources, dates, and snippets
- **Location-Based Search**: Support for country codes (`gl`), language (`hl`), and location strings
- **Pagination**: Navigate through multiple pages of results
- **Autocorrection**: Optional query autocorrection
- **Retry Logic**: Built-in retry handling via `doFetchWithRetry`
- **Error Handling**: Standardized errors for rate limits, invalid keys, and API issues

## Core Components

### SerperWebSearchProvider

Extends `WebSearchProvider` to manage Serper.dev API interactions.

**Constructor:**
```typescript
new SerperWebSearchProvider({
  apiKey: string,              // required
  defaults?: {
    gl?: string,               // country code (e.g., 'us', 'uk')
    hl?: string,               // language (e.g., 'en', 'fr')
    location?: string,         // e.g., 'Austin,Texas,United States'
    num?: number,              // results per page (1-100, default 10)
    page?: number              // page number (starting from 1)
  }
})
```

**Key Methods:**

- `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
  - Performs Google web search via Serper.dev
  - Maps options (countryCode → gl, language → hl)
  - Returns structured results with organic results, knowledge graph, etc.
  - Endpoint: `https://google.serper.dev/search`

- `searchNews(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
  - Performs Google News search
  - Returns news articles with title, link, snippet, date, source
  - Endpoint: `https://google.serper.dev/news`

- `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`
  - Fetches HTML content of a webpage using native fetch
  - Supports optional timeout with AbortController
  - Returns: `{ html: string }`

**Private Methods:**
- `buildPayload(query, opts)`: Constructs API request body, merging defaults and options
- `googleSearch` / `googleNews`: Handle API calls with retry logic and headers
- `parseJsonOrThrow(res, context)`: Parses JSON response with enhanced error messages

## Usage Examples

### Basic Web Search

```typescript
import SerperWebSearchProvider from '@tokenring-ai/serper';

const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: { gl: 'us', hl: 'en', num: 10 }
});

const results = await provider.searchWeb('Token Ring AI');
console.log(results.results); // Array of WebSearchResult objects
```

### News Search with Options

```typescript
const newsResults = await provider.searchNews('Latest AI news', {
  countryCode: 'us',
  num: 5,
  page: 1
});
console.log(newsResults.results); // News articles
```

### Fetch a Webpage

```typescript
const page = await provider.fetchPage('https://example.com', { timeout: 5000 });
console.log(page.html); // Raw HTML string
```

### With Location-Based Search

```typescript
const localResults = await provider.searchWeb('restaurants near me', {
  location: 'Austin,Texas,United States',
  num: 20
});
```

## Configuration Options

### Provider Configuration
- `apiKey`: Required Serper.dev API key
- `defaults`: Optional global overrides
  - `gl`: Country code (e.g., 'us', 'uk')
  - `hl`: Language code (e.g., 'en', 'fr')
  - `location`: Location string (e.g., 'Austin,Texas,United States')
  - `num`: Results per page (1-100, default 10)
  - `page`: Page number (starting from 1)

### Per-Request Options
- Inherits from `WebSearchProviderOptions`:
  - `countryCode`: Maps to `gl`
  - `language`: Maps to `hl`
  - `location`: Location string
  - `num`: Results count
  - `page`: Page number
- Additional options:
  - `autocorrect`: Boolean for query autocorrection
  - `type`: 'search' or 'news'
  - `extraParams`: Record for custom Serper parameters

**Environment Variables:**
- `SERPER_API_KEY`: Recommended for security

## Response Types

### Search Response
```typescript
SerperSearchResponse {
  organic: SerperOrganicResult[];  // title, link, snippet, position
  knowledgeGraph?: SerperKnowledgeGraph;
  relatedSearches?: Array<{ query: string }>;
  searchInformation?: { totalResults: string };
}
```

### News Response
```typescript
SerperNewsResponse {
  news: SerperNewsResult[];  // title, link, snippet, date, source
  credits?: number;          // Remaining API credits
}
```

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: AI client integration
- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/websearch@0.1.0`: Web search abstraction
- `zod@^4.0.17`: Schema validation

## Notes

- Relies on Serper.dev quotas (check credits in responses)
- Rate limits (429 errors) handled via retry logic
- Text/HTML only; no image/video search support
- No binary fetch support
- Example payloads/responses available in `design/` directory
