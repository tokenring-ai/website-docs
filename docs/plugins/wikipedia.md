# Wikipedia Plugin

Wikipedia search and content retrieval integration for Token Ring AI agents.

## Overview

The `@tokenring-ai/wikipedia` package provides a service for interacting with the Wikipedia API and tools for AI agents to search articles and retrieve raw wiki markup content. It is designed specifically for use within the Token Ring AI agent framework, allowing agents to query Wikipedia programmatically.

## Key Features

- **Wikipedia Service**: Core service for direct API interactions with Wikipedia
- **Agent Tools**: Two pre-built tools for AI workflows:
  - `wikipedia_search`: Search Wikipedia articles with configurable options
  - `wikipedia_getPage`: Retrieve raw wiki markup content by page title
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Input Validation**: Zod schemas for robust input validation
- **Error Handling**: Built-in error handling and retry logic
- **Configurable**: Support for different Wikipedia language editions
- **Plugin Architecture**: Integrates seamlessly with Token Ring app ecosystem

## Core Components

### WikipediaService

The core service class for Wikipedia API interactions.

**Constructor:**
```typescript
constructor(config?: WikipediaConfig)
```

**Parameters:**
- `config.baseUrl` (string, optional): Base URL for Wikipedia API (defaults to "https://en.wikipedia.org")

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

**wikipedia_search** (`wikipedia_search`): Search Wikipedia articles
- Input: `{ query: string, limit?: number, offset?: number }`
- Returns: `{ results?: any }` with search hits
- Logs search query via agent chat

**wikipedia_getPage** (`wikipedia_getPage`): Retrieve page content
- Input: `{ title: string }`
- Returns: `{ content?: string }` with raw wiki markup
- Logs title being fetched

## Services and APIs

### WikipediaService API

The WikipediaService provides direct access to the Wikipedia API:

```typescript
import WikipediaService from '@tokenring-ai/wikipedia';

const wikipedia = new WikipediaService({
  baseUrl: 'https://en.wikipedia.org' // Optional, defaults to English Wikipedia
});

// Search for articles
const searchResults = await wikipedia.search('artificial intelligence', {
  limit: 10,
  namespace: 0,
  offset: 0
});

// Get page content
const pageContent = await wikipedia.getPage('Artificial intelligence');
```

### Tool API

The package provides two tools that can be used by Token Ring agents:

#### wikipedia_search

Search Wikipedia articles and return structured results.

**Input Schema:**
```typescript
z.object({
  query: z.string().min(1).describe("Search query"),
  limit: z.number().int().positive().max(500).optional().describe("Number of results (1-500, default: 10)"),
  offset: z.number().int().min(0).optional().describe("Offset for pagination (default: 0)")
})
```

**Example Usage:**
```typescript
const result = await agent.executeTool("wikipedia_search", {
  query: "machine learning",
  limit: 5
});
```

#### wikipedia_getPage

Retrieve the raw wiki markup content of a Wikipedia page by title.

**Input Schema:**
```typescript
z.object({
  title: z.string().min(1).describe("Wikipedia page title")
})
```

**Example Usage:**
```typescript
const result = await agent.executeTool("wikipedia_getPage", {
  title: "Machine learning"
});
```

## Commands and Tools

### Available Tools

- **wikipedia_search**: Search Wikipedia articles
- **wikipedia_getPage**: Retrieve Wikipedia page content

### Tool Execution Patterns

The tools can be used individually or chained:

```typescript
// Individual tool usage
const searchResult = await agent.executeTool("wikipedia_search", {
  query: "Token Ring",
  limit: 3
});

const pageContent = await agent.executeTool("wikipedia_getPage", {
  title: "Token Ring (networking)"
});
```

```typescript
// Chained tool usage - search then retrieve content
const searchRes = await agent.executeTool("wikipedia_search", {
  query: "Python programming"
});

if (searchRes.results?.query?.search?.length > 0) {
  const topResult = searchRes.results.query.search[0];
  const content = await agent.executeTool("wikipedia_getPage", {
    title: topResult.title
  });
}
```

## Event System

The WikipediaService uses the Token Ring event system for logging and monitoring:

- **Tool Execution Events**: Logs search queries and page retrievals
- **Error Events**: Emits error events for failed operations
- **Service Events**: Lifecycle events for the service instance

## State Management

The WikipediaService maintains its state through:

- **Configuration**: Custom base URL and headers
- **API State**: Active API connections and requests
- **Error State**: Retry logic and error tracking

## Human Interface

The tools provide human-readable feedback:

- **Search Queries**: Logs search queries being executed
- **Page Retrievals**: Logs page titles being fetched
- **Error Messages**: Clear error messages for failures

## Configuration

### Service Configuration

```typescript
const wikipedia = new WikipediaService({
  baseUrl: 'https://en.wikipedia.org' // English Wikipedia (default)
  // baseUrl: 'https://fr.wikipedia.org' // French Wikipedia
  // baseUrl: 'https://es.wikipedia.org' // Spanish Wikipedia
});
```

### Search Options

- `limit`: Number of results (1-500, default: 10)
- `namespace`: Search namespace (default: 0 for main articles)
- `offset`: Pagination offset (default: 0)

### Request Headers

- Fixed User-Agent: "TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"

### Retry Logic

The service includes built-in retry logic for transient failures using `doFetchWithRetry` from `@tokenring-ai/utility`.

## Usage Examples

### Basic Integration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import wikipediaPlugin from "@tokenring-ai/wikipedia";

const app = new TokenRingApp();
app.install(wikipediaPlugin);
```

### Direct Service Usage

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";

const wikipedia = new WikipediaService({
  baseUrl: "https://en.wikipedia.org"
});

// Search for articles
const searchResults = await wikipedia.search("quantum computing", {
  limit: 3
});

console.log("Search results:", searchResults.query.search);

// Get content from the first result
if (searchResults.query.search.length > 0) {
  const firstResult = searchResults.query.search[0];
  const content = await wikipedia.getPage(firstResult.title);
  console.log("Page content length:", content.length);
}
```

### Agent Workflow Example

```typescript
// In a Token Ring agent
async function researchTopic(query: string) {
  // Search for relevant articles
  const searchResult = await agent.executeTool("wikipedia_search", {
    query,
    limit: 5
  });
  
  // Get content from the most relevant article
  if (searchResult.results?.query?.search?.length > 0) {
    const topArticle = searchResult.results.query.search[0];
    const pageContent = await agent.executeTool("wikipedia_getPage", {
      title: topArticle.title
    });
    
    return {
      title: topArticle.title,
      snippet: topArticle.snippet,
      content: pageContent.content
    };
  }
  
  throw new Error("No relevant articles found");
}
```

### Multi-language Wikipedia

```typescript
// English Wikipedia (default)
const englishWiki = new WikipediaService();

// Spanish Wikipedia
const spanishWiki = new WikipediaService({
  baseUrl: "https://es.wikipedia.org"
});

// French Wikipedia
const frenchWiki = new WikipediaService({
  baseUrl: "https://fr.wikipedia.org"
});
```

## API Reference

### WikipediaService

#### Constructor

```typescript
constructor(config?: WikipediaConfig)
```

**Parameters:**
- `config.baseUrl` (string, optional): Custom Wikipedia API base URL

#### Methods

##### search(query: string, opts?: WikipediaSearchOptions): Promise<any>

Search Wikipedia articles.

**Parameters:**
- `query` (string): Search term (required)
- `opts` (object, optional):
  - `limit` (number): Maximum number of results (1-500, default: 10)
  - `namespace` (number): Search namespace (default: 0)
  - `offset` (number): Pagination offset (default: 0)

**Returns:** Promise resolving to Wikipedia API response

##### getPage(title: string): Promise<string>

Retrieve raw wiki markup content.

**Parameters:**
- `title` (string): Wikipedia page title (required)

**Returns:** Promise resolving to raw wiki markup text

### Types and Schemas

#### WikipediaConfig

```typescript
export type WikipediaConfig = {
  baseUrl?: string;
}
```

#### WikipediaSearchOptions

```typescript
export type WikipediaSearchOptions = {
  limit?: number;
  namespace?: number;
  offset?: number;
}
```

#### Configuration Schema

```typescript
export const WikipediaConfigSchema = z.object({
  baseUrl: z.string().optional(),
});
```

### Tool Definitions

#### wikipedia_search Tool

```typescript
{
  name: "wikipedia_search",
  description: "Search Wikipedia articles. Returns structured JSON with search results.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query"),
    limit: z.number().int().positive().max(500).optional().describe("Number of results (1-500, default: 10)"),
    offset: z.number().int().min(0).optional().describe("Offset for pagination (default: 0)")
  }),
  execute: async function({ query, limit, offset }, agent) {
    const wikipedia = agent.requireServiceByType(WikipediaService);
    agent.infoLine(`[wikipediaSearch] Searching: ${query}`);
    const results = await wikipedia.search(query, { limit, offset });
    return { results };
  }
}
```

#### wikipedia_getPage Tool

```typescript
{
  name: "wikipedia_getPage",
  description: "Retrieve a Wikipedia page's raw wiki markup content by title.",
  inputSchema: z.object({
    title: z.string().min(1).describe("Wikipedia page title")
  }),
  execute: async function({ title }, agent) {
    const wikipedia = agent.requireServiceByType(WikipediaService);
    agent.infoLine(`[wikipediaGetPage] Retrieving: ${title}`);
    const content = await wikipedia.getPage(title);
    return { content };
  }
}
```

## Integration with Token Ring

### Plugin Installation

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

## Testing

Run the test suite:

```bash
bun run test
```

The package includes integration tests that verify:
- Wikipedia search functionality
- Page content retrieval
- Error handling for invalid inputs
- Support for different language editions

## Error Handling

The service includes comprehensive error handling:

- **Invalid inputs**: Throws descriptive errors for missing required parameters
- **API failures**: Handles HTTP errors and non-OK responses
- **Network issues**: Uses retry logic for transient failures
- **JSON parsing**: Validates and sanitizes API responses

## Examples

### Basic Search and Retrieve

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";

const wikipedia = new WikipediaService();

// Search for articles
const searchResults = await wikipedia.search("quantum computing", {
  limit: 3
});

console.log("Search results:", searchResults.query.search);

// Get content from the first result
if (searchResults.query.search.length > 0) {
  const firstResult = searchResults.query.search[0];
  const content = await wikipedia.getPage(firstResult.title);
  console.log("Page content length:", content.length);
}
```

### Agent Workflow Example

```typescript
// In a Token Ring agent
async function researchTopic(query: string) {
  // Search for relevant articles
  const searchResult = await agent.executeTool("wikipedia_search", {
    query,
    limit: 5
  });
  
  // Get content from the most relevant article
  if (searchResult.results?.query?.search?.length > 0) {
    const topArticle = searchResult.results.query.search[0];
    const pageContent = await agent.executeTool("wikipedia_getPage", {
      title: topArticle.title
    });
    
    return {
      title: topArticle.title,
      snippet: topArticle.snippet,
      content: pageContent.content
    };
  }
  
  throw new Error("No relevant articles found");
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage
```

## License

MIT License - see LICENSE file for details.