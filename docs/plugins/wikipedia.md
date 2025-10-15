# Wikipedia Plugin

Wikipedia API integration for searching articles and fetching page content, with agent tools and service.

## Overview

The `@tokenring-ai/wikipedia` package provides seamless integration with the Wikipedia API for searching articles and retrieving raw page content. It is designed specifically for use within the Token Ring AI agent framework, enabling agents to query Wikipedia programmatically.

## Key Features

- **Article Search**: Search Wikipedia articles by query with limit, namespace, and offset options
- **Page Content**: Fetch raw wiki markup content of Wikipedia pages by title
- **Retry Logic**: Built-in retry logic for API requests using `doFetchWithRetry`
- **Input Validation**: Zod schemas for tool input validation
- **Configurable**: Custom base URL support for different language Wikipedias
- **Agent Tools**: Pre-built tools for easy agent integration

## Core Components

### WikipediaService

Core service class for Wikipedia API interactions, implements `TokenRingService`.

**Constructor:**
```typescript
new WikipediaService(config?: { baseUrl?: string })
```
- `baseUrl`: Custom Wikipedia API base (default: 'https://en.wikipedia.org')

**Key Methods:**

- `search(query: string, opts?: WikipediaSearchOptions): Promise<any>`
  - Performs search query using MediaWiki API
  - Options: `limit` (default 10, max 500), `namespace` (default 0), `offset` (default 0)
  - Returns Wikipedia's JSON response with search results
  - Uses `action=query&list=search`

- `getPage(title: string): Promise<string>`
  - Fetches raw wiki markup text of a page
  - Uses `action=raw` endpoint
  - Returns page content as string
  - Throws on 404 or fetch failure

**Internal Methods:**
- `parseJsonOrThrow(res, context)`: Parses responses with enhanced error handling

### Tools

**search** (`wikipedia/search`): Search Wikipedia articles
- Input: `{ query: string, limit?: number, offset?: number }`
- Returns: `{ results?: any }` with search hits
- Logs search query via agent chat

**getPage** (`wikipedia/getPage`): Retrieve page content
- Input: `{ title: string }`
- Returns: `{ content?: string }` with raw wiki markup
- Logs title being fetched

## Usage Examples

### Direct Service Usage

```typescript
import WikipediaService from '@tokenring-ai/wikipedia';

const wiki = new WikipediaService();

// Search for articles
const searchResults = await wiki.search('Token Ring', { limit: 5 });
console.log(searchResults.query.search); // Array of search hits

// Get page content
const pageContent = await wiki.getPage('Token Ring');
console.log(pageContent); // Raw wiki text
```

### Agent Tool Usage

```typescript
import { Agent } from '@tokenring-ai/agent';
import WikipediaService from '@tokenring-ai/wikipedia';

const agent = new Agent({
  services: [new WikipediaService()],
});

// Search via tool
const response = await agent.executeTool('wikipedia/search', {
  query: 'Artificial Intelligence',
  limit: 3,
});

// Get page via tool
const pageResponse = await agent.executeTool('wikipedia/getPage', {
  title: 'Token Ring (networking)',
});
console.log(pageResponse.content);
```

### Chained Tool Usage

```typescript
// Search first, then get page content
const searchRes = await agent.tools.wikipedia.search({ query: 'Python programming' });
const topTitle = searchRes.results.query.search[0].title;
const content = await agent.tools.wikipedia.getPage({ title: topTitle });
```

### Custom Language Wikipedia

```typescript
// Use French Wikipedia
const frWiki = new WikipediaService({ baseUrl: 'https://fr.wikipedia.org' });
const results = await frWiki.search('Intelligence artificielle');
```

## Configuration Options

### Service Configuration
- `baseUrl`: Custom Wikipedia API base URL
  - Default: 'https://en.wikipedia.org'
  - Examples: 'https://fr.wikipedia.org', 'https://de.wikipedia.org'

### Search Options
- `limit`: Number of results (1-500, default: 10)
- `namespace`: Search namespace (default: 0 for main articles)
- `offset`: Pagination offset (default: 0)

### Request Headers
- Fixed User-Agent: "TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"

### Retry Logic
- Handled internally by `doFetchWithRetry` from `@tokenring-ai/utility`

## API Reference

### WikipediaService
- `constructor(config?: { baseUrl?: string })`
- `search(query: string, opts?: { limit?: number; namespace?: number; offset?: number }): Promise<any>`
- `getPage(title: string): Promise<string>`

### Tools
- `wikipedia/search`: `execute({ query, limit?, offset? }, agent): Promise<{ results }>`
- `wikipedia/getPage`: `execute({ title }, agent): Promise<{ content }>`

### Exports
- `packageInfo: TokenRingPackage` (includes tools)
- `WikipediaService` (default export)

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: AI client integration
- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/utility`: For `doFetchWithRetry`
- `zod@^4.0.17`: Schema validation

## Notes

- Searches limited to text; binary/media not supported
- Wikipedia API has query limits (500 results max per call)
- Respect robots.txt and Wikipedia usage policies
- No built-in caching; repeated calls may hit rate limits
- English Wikipedia by default; adjust `baseUrl` for other languages
- Raw wiki markup returned; parse as needed for formatted content
