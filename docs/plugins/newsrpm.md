# NewsRPM Plugin

Integration with NewsRPM API for storing, indexing, and retrieving news articles.

## Overview

The `@tokenring-ai/newsrpm` package provides integration with NewsRPM, an API for storing, indexing, and retrieving news articles and related metadata. It wraps common API calls and exposes them as services, tools, and chat commands for TokenRing agents.

## Key Features

- Search indexed data by taxonomy keys (ticker, topic, etc.)
- Search articles by publisher, provider, type, full-text
- Retrieve articles by slug or ID
- List providers
- Fetch article bodies (native or rendered HTML)
- Upload articles to NewsRPM
- Configurable authentication and retry policy

## Core Components

### NewsRPMService

Main service for NewsRPM API interactions.

**Constructor:**
```typescript
new NewsRPMService({
  apiKey: string,
  authMode?: 'privateHeader' | 'publicHeader' | 'privateQuery' | 'publicQuery',
  baseUrl?: string,
  requestDefaults?: { headers?, timeoutMs? },
  retry?: { maxRetries?, baseDelayMs?, maxDelayMs?, jitter? }
})
```

**Key Methods:**
- `searchIndexedData(body)` - Search by taxonomy key/value
- `searchArticles(body)` - Search articles by filters
- `getArticleBySlug(slug)` - Retrieve article by slug
- `getArticleById(id)` - Retrieve article by ID
- `listProviders()` - List available providers
- `getBody(bodyId)` - Get article body in native format
- `renderBody(bodyId)` - Get article body as HTML
- `uploadArticle(article)` - Create or update article

### Tools

**searchIndexedData**: Search indexed data by key/value
- Input: `{ key: string, value: string|string[], count?, offset?, minDate?, maxDate?, order? }`

**searchArticles**: Search articles by filters
- Input: `{ publisher?, provider?, fullText?, type?, sponsored?, count?, offset?, minDate?, maxDate?, language? }`

**getArticleBySlug**: Retrieve article by slug
- Input: `{ slug: string }`

**getArticleById**: Retrieve article by ID
- Input: `{ id: number }`

**listProviders**: List available providers

**getBody**: Get article body in native format
- Input: `{ bodyId: string }`

**renderBody**: Get article body as HTML
- Input: `{ bodyId: string }`

**uploadArticle**: Create or update article
- Input: `{ article: object }`

### Chat Commands

**/newsrpm**: NewsRPM operations
- `index <key> [--value <str|csv>] [options]` - Search indexed data
- `search [--publisher csv] [--provider csv] [options]` - Search articles
- `article slug <slug>` - Get article by slug
- `article id <id>` - Get article by ID
- `providers` - List providers
- `body <bodyId> [--render]` - Get article body
- `upload --json <path>` - Upload article

## Global Scripting Functions

When `@tokenring-ai/scripting` is available:

- **searchArticles(query)**: Searches articles by full-text query
  ```bash
  /var $articles = searchArticles("artificial intelligence")
  /call searchArticles("tech news")
  ```

- **searchIndexedData(key, value)**: Searches indexed data by taxonomy
  ```bash
  /var $results = searchIndexedData("NormalizedTicker", "AAPL")
  /call searchIndexedData("topic", "Cannabis")
  ```

- **getArticleBySlug(slug)**: Retrieves article by slug
  ```bash
  /var $article = getArticleBySlug("my-article-slug")
  ```

- **listProviders()**: Lists all providers
  ```bash
  /var $providers = listProviders()
  ```

## Usage Example

```typescript
import { NewsRPMService } from '@tokenring-ai/newsrpm';

const newsrpm = new NewsRPMService({
  apiKey: process.env.NEWSRPM_API_KEY!,
  baseUrl: 'https://api.newsrpm.com',
  authMode: 'privateHeader'
});

// Search articles
const results = await newsrpm.searchArticles({
  fullText: 'AI',
  count: 5
});

// Get article by slug
const article = await newsrpm.getArticleBySlug('my-article');
```

## Configuration Options

- **apiKey**: Required API key
- **authMode**: Authentication method (default: 'privateHeader')
- **baseUrl**: API base URL (default: https://api.newsrpm.com)
- **requestDefaults**: Headers and timeout settings
- **retry**: Retry policy configuration

**Environment Variables:**
- `NEWSRPM_API_KEY`
- `NEWSRPM_BASE_URL`

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/scripting@0.1.0`: Optional, for global functions
- `axios`: HTTP client

## Notes

- Supports multiple authentication modes
- Automatic retry with exponential backoff
- 429 and 5xx responses automatically retried
- Respects API rate limits
