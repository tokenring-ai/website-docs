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

## Installation

```bash
bun install @tokenring-ai/wikipedia
```

## Usage

### As a Token Ring Plugin

The package is designed to work as a Token Ring plugin. Import and install it in your app:

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
  baseUrl: "https://en.wikipedia.org" // Optional, defaults to English Wikipedia
});

// Search for articles
const searchResults = await wikipedia.search("artificial intelligence", {
  limit: 10,
  offset: 0
});

// Get page content
const pageContent = await wikipedia.getPage("Artificial intelligence");
```

### Agent Tool Usage

The package provides two tools that can be used by Token Ring agents:

#### wikipedia_search

Search Wikipedia articles and return structured results.

```typescript
// Tool input schema:
{
  query: string,           // Required search term
  limit?: number,          // Number of results (1-500, default: 10)
  offset?: number          // Pagination offset (default: 0)
}

// Example usage:
const result = await agent.executeTool("wikipedia_search", {
  query: "machine learning",
  limit: 5
});
```

#### wikipedia_getPage

Retrieve the raw wiki markup content of a Wikipedia page by title.

```typescript
// Tool input schema:
{
  title: string           // Required page title
}

// Example usage:
const result = await agent.executeTool("wikipedia_getPage", {
  title: "Machine learning"
});
```

## API Reference

### WikipediaService

The core service class for Wikipedia API interactions.

#### Constructor

```typescript
constructor(config?: WikipediaConfig)
```

**Parameters:**
- `config.baseUrl` (string, optional): Base URL for Wikipedia API (defaults to "https://en.wikipedia.org")

#### Methods

##### search(query: string, options?: WikipediaSearchOptions): Promise<any>

Search Wikipedia articles.

**Parameters:**
- `query` (string): Search term (required)
- `options` (object, optional):
  - `limit` (number): Maximum number of results (default: 10)
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
    offset: z.number().int().min(0).optional().describe("Offset for pagination (default: 0)"),
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
├── package.json            # Package metadata and dependencies
├── vitest.config.ts        # Vitest configuration
└── README.md              # This documentation
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

## Configuration

### Base URL Configuration

You can configure the service to use different Wikipedia language editions:

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

### User-Agent

The service uses a custom User-Agent header for API requests:
```
TokenRing-Writer/1.0 (https://github.com/tokenring/writer)
```

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