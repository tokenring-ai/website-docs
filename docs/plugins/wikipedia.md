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
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Error Handling**: Comprehensive error handling with descriptive messages

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
  - Throws error for invalid inputs or API failures

- `getPage(title: string): Promise<string>`
  - Fetches raw wiki markup text of a page
  - Uses `action=raw` endpoint
  - Returns page content as string
  - Throws on 404 or fetch failure

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
- Automatic retry for transient failures

## API Reference

### WikipediaService
- `constructor(config?: { baseUrl?: string })`
- `search(query: string, opts?: { limit?: number; namespace?: number; offset?: number }): Promise<any>`
- `getPage(title: string): Promise<string>`

### Tools
- `wikipedia/search`: `execute({ query, limit?, offset? }, agent): Promise<{ results }>`
- `wikipedia/getPage`: `execute({ title }, agent): Promise<{ content }>`
- Tool input schemas:
  - `wikipedia/search`: `z.object({ query: z.string(), limit?: z.number(), offset?: z.number() })`
  - `wikipedia/getPage`: `z.object({ title: z.string() })`

### Exports
- `packageInfo: TokenRingPackage` (includes tools)
- `WikipediaService` (default export)

## Dependencies

- `@tokenring-ai/app`: Core application framework
- `@tokenring-ai/chat`: Chat and tool management
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/utility`: HTTP utilities and retry logic
- `zod@^4.0.17`: Schema validation

## Notes

- Searches limited to text; binary/media not supported
- Wikipedia API has query limits (500 results max per call)
- Respect robots.txt and Wikipedia usage policies
- No built-in caching; repeated calls may hit rate limits
- English Wikipedia by default; adjust `baseUrl` for other languages
- Raw wiki markup returned; parse as needed for formatted content
- Error handling includes:
  - Invalid inputs (missing query/title)
  - HTTP errors (404, 500, etc.)
  - Network failures with retry logic

## Integration with Token Ring

### As a Plugin

The package integrates seamlessly with the Token Ring application framework:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import wikipediaPlugin from "@tokenring-ai/wikipedia";

const app = new TokenRingApp();
app.install(wikipediaPlugin);
```

### Service Registration

The plugin automatically registers the WikipediaService when configured:

```typescript
// Configuration in app setup
app.addServices(new WikipediaService({ baseUrl: "https://es.wikipedia.org" }));
```

### Tool Registration

Tools are automatically registered with the chat service:

```typescript
// Tools available: wikipedia_search and wikipedia_getPage
chatService.addTools("wikipedia", tools);
```

## Package Structure

```
pkg/wikipedia/
├── index.ts                 # Main entry point and plugin export
├── WikipediaService.ts      # Core Wikipedia API service
├── plugin.ts               # Token Ring plugin integration
├── tools.ts                # Tool exports
├── tools/
│   ├── search.ts           # Wikipedia search tool
│   └── getPage.ts          # Wikipedia page retrieval tool
├── test/
│   └── WikipediaService.integration.test.js  # Integration tests
├── package.json            # Package metadata and dependencies
├── vitest.config.ts        # Vitest configuration
└── README.md              # Package documentation
```