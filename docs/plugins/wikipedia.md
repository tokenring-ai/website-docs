# Wikipedia Plugin

Plugin: Knowledge Base Search and Content Retrieval

## Overview and Purpose

The `@tokenring-ai/wikipedia` package provides seamless integration with Wikipedia's API, enabling Token Ring agents and applications to search for articles, retrieve content, and access a global knowledge base. This plugin wraps Wikipedia's REST API, providing a clean interface for article searches and page content retrieval.

### Key Features

- **API Integration**: Access Wikipedia's search and raw content APIs
- **Flexible Search**: Search Wikipedia articles with configurable limits and pagination
- **Content Retrieval**: Fetch raw wiki markup content for any Wikipedia page
- **Multi-Language Support**: Works with Wikipedia content in multiple languages via baseUrl configuration
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Agent Tools**: Two tools automatically registered for agent interaction
- **Configurable**: Optional baseUrl for different Wikipedia language editions
- **Error Handling**: Comprehensive error handling with status codes and clear error messages
- **Retry Logic**: Built-in retry logic for transient network failures

## Core Components

### WikipediaService

The main service class that handles all Wikipedia API interactions. Implements `TokenRingService` interface and extends `HttpService` from `@tokenring-ai/utility`.

**Location**: `pkg/wikipedia/WikipediaService.ts`

#### Constructor

```typescript
constructor(config: ParsedWikipediaConfig)
```

**Parameters:**
- `config` (ParsedWikipediaConfig): Configuration object
  - `baseUrl` (optional): Base URL for Wikipedia API, defaults to `https://en.wikipedia.org`

**Properties:**
- `name`: "WikipediaService"
- `description`: "Service for searching Wikipedia articles"
- `options`: Service configuration (ParsedWikipediaConfig)
- `baseUrl`: Protected property storing the base URL
- `defaultHeaders`: Protected property with User-Agent header

#### Service Methods

##### `search(query: string, opts?: WikipediaSearchOptions): Promise<any>`

Performs a Wikipedia search and returns structured search results with articles matching the query.

**Parameters:**
- `query` (required): Search query string
- `opts` (optional): Search options
  - `limit` (optional): Number of results to return (1-500, default: 10)
  - `namespace` (optional): Article namespace (default: 0 = article namespace)
  - `offset` (optional): Pagination offset for large result sets (default: 0)

**Returns:**
Promise resolving to Wikipedia API search response:
```typescript
{
  query: {
    searchinfo: {
      totalresults: number;
      [key: string]: any;
    };
    search: Array<{
      title: string;
      pageid: number;
      namespace: number;
      snippet: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
}
```

**Throws:** Error if query is empty

**Example:**
```typescript
import WikipediaService, {WikipediaConfigSchema} from "@tokenring-ai/wikipedia";

const wikipedia = new WikipediaService(WikipediaConfigSchema.parse({}));

// Basic search
const results = await wikipedia.search("artificial intelligence");
console.log(`Found ${results.query.search.length} results`);

// Search with custom parameters
const specializedResults = await wikipedia.search("Token Ring AI framework", {
  limit: 20,
  namespace: 0,
  offset: 0
});
```

##### `getPage(title: string): Promise<string>`

Retrieves raw wiki markup content for a specific Wikipedia page title.

**Parameters:**
- `title` (required): Page title (URL-encoded in practice, but the service handles this)

**Returns:**
- Raw wiki markup content as a text string

**Throws:** Error if title is empty or page retrieval fails

**Example:**
```typescript
// Get raw wiki markup for a page
const content = await wikipedia.getPage("Token_Ring");
console.log(content.substring(0, 200) + "...");
// Returns: Raw wiki markup content
```

## Services

### WikipediaService

The `WikipediaService` is a `TokenRingService` that can be required by agents using the `requireServiceByType` method.

**Provider Type:**

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";

// In an agent context
const wikipedia = agent.requireServiceByType(WikipediaService);
```

**Service Registration:**

The service is automatically registered when the plugin is installed:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import wikipediaPlugin from "@tokenring-ai/wikipedia";

const app = new TokenRingApp();
app.install(wikipediaPlugin, {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org"
  }
});
```

## Providers

This package does not use a provider registry pattern. The `WikipediaService` is a standalone service class that implements `TokenRingService`.

## RPC Endpoints

This package does not define RPC endpoints.

## Chat Commands

This package does not define chat commands. The functionality is exposed through agent tools instead.

## Configuration

### Service Options

Wikipedia configuration is optional and uses Zod schema validation:

```typescript
import {WikipediaConfigSchema} from "@tokenring-ai/wikipedia";

interface WikipediaConfig {
  baseUrl?: string;  // Defaults to "https://en.wikipedia.org"
}
```

**Schema Definition:**
```typescript
export const WikipediaConfigSchema = z.object({
  baseUrl: z.string().default("https://en.wikipedia.org")
});

export type ParsedWikipediaConfig = z.output<typeof WikipediaConfigSchema>;
```

### Configuration Examples

#### Basic Configuration

```typescript
// In your application configuration
const config = {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org"
  }
};
```

#### Multi-Language Configuration

```typescript
// For German Wikipedia
const germanConfig = {
  wikipedia: {
    baseUrl: "https://de.wikipedia.org"
  }
};

// For French Wikipedia
const frenchConfig = {
  wikipedia: {
    baseUrl: "https://fr.wikipedia.org"
  }
};
```

#### Plugin Installation with Configuration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import wikipediaPlugin from "@tokenring-ai/wikipedia";

const app = new TokenRingApp();
app.install(wikipediaPlugin, {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org"
  }
});
```

**Note**: The baseUrl should be the base URL without the API path. The service constructs the full API endpoint internally.

## Wikipedia Tools

The package provides two tools for agent integration, automatically registered with the TokenRing chat service when the plugin is installed.

### `wikipedia_search`

Search Wikipedia articles with structured results.

**Tool Definition:**
```typescript
{
  name: "wikipedia_search",
  displayName: "Wikipedia/search",
  description: "Search Wikipedia articles. Returns structured JSON with search results.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query"),
    limit: z.number().int().positive().max(500).optional().describe("Number of results (1-500, default: 10)"),
    offset: z.number().int().min(0).optional().describe("Offset for pagination (default: 0)"),
  }),
  execute: async (input, agent) => {
    const wikipedia = agent.requireServiceByType(WikipediaService);
    agent.infoMessage(`[wikipediaSearch] Searching: ${input.query}`);
    const results = await wikipedia.search(input.query, {limit: input.limit, offset: input.offset});
    return { type: 'json' as const, data: results };
  }
}
```

**Input Schema:**
```typescript
z.object({
  query: z.string().min(1).describe("Search query"),
  limit: z.number().int().positive().max(500).optional().describe("Number of results (1-500, default: 10)"),
  offset: z.number().int().min(0).optional().describe("Offset for pagination (default: 0)"),
})
```

**Returns:** `TokenRingToolJSONResult` with search results

**Usage:**
```typescript
// In agent task execution, tool is auto-available
const agent = new Agent();
const results = await agent.executeTool("wikipedia_search", {
  query: "artificial intelligence",
  limit: 10
});
console.log(results.data.query.search);
// Output: Array of search results with title, snippet, pageid, etc.
```

### `wikipedia_getPage`

Retrieve raw wiki markup content for a specific Wikipedia page.

**Tool Definition:**
```typescript
{
  name: "wikipedia_getPage",
  displayName: "Wikipedia/getPage",
  description: "Retrieve a Wikipedia page's raw wiki markup content by title.",
  inputSchema: z.object({
    title: z.string().min(1).describe("Wikipedia page title"),
  }),
  execute: async (input, agent) => {
    const wikipedia = agent.requireServiceByType(WikipediaService);
    try {
      agent.infoMessage(`[wikipediaGetPage] Retrieving: ${input.title}`);
      return await wikipedia.getPage(input.title);
    } catch (e: any) {
      const message = e?.message || String(e);
      throw new Error(`[${name}] ${message}`);
    }
  }
}
```

**Input Schema:**
```typescript
z.object({
  title: z.string().min(1).describe("Wikipedia page title"),
})
```

**Returns:** `TokenRingToolTextResult` with raw wiki markup content

**Usage:**
```typescript
// In agent task execution, tool is auto-available
const agent = new Agent();
const content = await agent.executeTool("wikipedia_getPage", {
  title: "Machine learning"
});
console.log(content.data);
// Output: Raw wiki markup content of the page
```

## Package Structure

```
pkg/wikipedia/
├── index.ts                      # Main exports (WikipediaService)
├── WikipediaService.ts           # Core service class extending HttpService
├── plugin.ts                     # TokenRingPlugin registration
├── tools.ts                      # Barrel export for tools/
├── tools/
│   ├── search.ts                 # Wikipedia search tool
│   └── getPage.ts                # Wikipedia page retrieval tool
├── package.json                  # Package metadata and dependencies
├── vitest.config.ts              # Test configuration
└── test/
    └── WikipediaService.integration.test.ts  # Integration tests
```

## Usage Examples

### Service Integration

```typescript
import WikipediaService, {WikipediaConfigSchema} from "@tokenring-ai/wikipedia";

// Basic usage
const wikipedia = new WikipediaService(WikipediaConfigSchema.parse({}));

// Search Wikipedia articles
const results = await wikipedia.search("Token Ring AI framework");
console.log(`Total results: ${results.query.search.length}`);
results.query.search.forEach(result => {
  console.log(`${result.title} - ${result.snippet}`);
});

// Search with custom parameters
const techResults = await wikipedia.search("artificial intelligence", {
  limit: 20,
  offset: 0
});

// Get raw wiki markup for a page
const content = await wikipedia.getPage("Token_Ring");
console.log(content.substring(0, 100) + "...");

// Multi-language Wikipedia
const germanWikipedia = new WikipediaService({
  baseUrl: "https://de.wikipedia.org"
});
const germanResults = await germanWikipedia.search("KI-Forschung");
const germanContent = await germanWikipedia.getPage("KI");
```

### Agent Tool Usage

```typescript
import Agent from "@tokenring-ai/agent/Agent";

// Tools are auto-registered with agent after package installation
const agent = new Agent();

// Search Wikipedia
const searchResults = await agent.executeTool("wikipedia_search", {
  query: "machine learning",
  limit: 5
});
console.log(searchResults.data.query.search);

// Pagination example
const firstPage = await agent.executeTool("wikipedia_search", {
  query: "typescript",
  limit: 10,
  offset: 0
});

const secondPage = await agent.executeTool("wikipedia_search", {
  query: "typescript",
  limit: 10,
  offset: 10
});

// Get page content
const pageContent = await agent.executeTool("wikipedia_getPage", {
  title: "TypeScript"
});
console.log(pageContent.data.substring(0, 500));
```

### Integration with Token Ring Applications

```typescript
import TokenRingApp from '@tokenring-ai/app';
import wikipediaPlugin from '@tokenring-ai/wikipedia';

const app = new TokenRingApp();

// Register Wikipedia plugin
app.install(wikipediaPlugin, {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org"
  }
});

await app.start();

// Tools will be auto-registered and accessible via agent.executeTool()
```

### Complete Workflow Example

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import WikipediaService from "@tokenring-ai/wikipedia";

async function researchTopic(agent: Agent, query: string) {
  // Search for relevant articles
  const searchResult = await agent.executeTool("wikipedia_search", {
    query,
    limit: 5
  });

  // Process results
  if (searchResult.data.query.search.length === 0) {
    throw new Error("No relevant articles found");
  }

  // Get content from the most relevant article
  const topArticle = searchResult.data.query.search[0];
  const pageContent = await agent.executeTool("wikipedia_getPage", {
    title: topArticle.title
  });

  return {
    title: topArticle.title,
    snippet: topArticle.snippet,
    content: pageContent.data,
    pageId: topArticle.pageid
  };
}

// Usage
const agent = new Agent();
const research = await researchTopic(agent, "quantum computing");
console.log(`Research on: ${research.title}`);
console.log(`Content length: ${research.content.length} characters`);
```

## Response Types

### WikipediaSearchResponse

The search method returns a structured response with comprehensive metadata:

```typescript
{
  query: {
    searchinfo: {
      totalresults: number;        // Total number of matching articles
      [key: string]: any;
    };
    search: Array<{
      title: string;                 // Article title
      pageid: number;               // Page ID (unique identifier)
      namespace: number;             // Article namespace (0=main, etc.)
      snippet: string;              // Search snippet (HTML-formatted)
      size?: number;                // Page size in bytes
      wordcount?: number;           // Word count
      [key: string]: any;
    }>;
    [key: string]: any;            // Additional API fields
  };
}
```

### Tool Response Types

#### Search Tool Response
```typescript
{
  type: 'json';
  data: WikipediaSearchResponse;
}
```

#### GetPage Tool Response
```typescript
{
  type: 'text';
  data: string;  // Raw wiki markup
}
```

## Error Handling

The service implements comprehensive error handling:

- **Input Validation**: Required `query` and `title` parameters validated before API calls
- **HTTP Errors**: Non-2xx responses include status code
- **Error Properties**: Errors include `message` and optional `status` properties
- **Tool-level Error Wrapping**: The `wikipedia_getPage` tool wraps errors with tool name prefix

### Error Examples

```typescript
import WikipediaService, {WikipediaConfigSchema} from "@tokenring-ai/wikipedia";

const wikipedia = new WikipediaService(WikipediaConfigSchema.parse({}));

// Empty query error
try {
  const results = await wikipedia.search("");
} catch (error) {
  console.log(error.message); // "query is required"
}

// Empty title error
try {
  const results = await wikipedia.getPage("");
} catch (error) {
  console.log(error.message); // "title is required"
}

// HTTP error (page not found)
try {
  const results = await wikipedia.getPage("NonExistentPage12345");
} catch (error) {
  console.log(error.message); // "Wikipedia page retrieval failed (404)"
  console.log(error.status);  // HTTP status code: 404
}

// Tool-level error wrapping
try {
  await agent.executeTool("wikipedia_getPage", {title: ""});
} catch (error) {
  console.log(error.message); // "[wikipedia_getPage] title is required"
}
```

### Common Error Scenarios

1. **Missing Query**: `Error: query is required`
2. **Missing Title**: `Error: title is required`
3. **HTTP Error**: `Error: Wikipedia page retrieval failed (404)` with `status` property
4. **Network Error**: Service-level errors from fetch implementation
5. **Rate Limiting**: HTTP 429 error with rate limit information

## API Reference

### Wikipedia API Endpoints

#### Search Endpoint

**Location**: `/w/api.php?{params}`

**Parameters:**
- `action=query` - Action type (fixed)
- `list=search` - List search results
- `srsearch={query}` - Search query string
- `format=json` - Return format (fixed)
- `srlimit={number}` - Number of results (1-500, default: 10)
- `srnamespace={number}` - Article namespace (default: 0)
- `sroffset={number}` - Pagination offset (default: 0)

**Example Request:**
```
GET https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=AI&format=json&srlimit=10
```

**Response Structure:**
```json
{
  "batchcomplete": true,
  "query": {
    "searchinfo": {
      "totalresults": 12345
    },
    "search": [
      {
        "title": "Artificial intelligence",
        "pageid": 123456,
        "namespace": 0,
        "snippet": "...",
        "size": 123456,
        "wordcount": 5000
      }
    ]
  }
}
```

#### Raw Content Endpoint

**Location**: `{baseUrl}/w/index.php?{params}`

**Parameters:**
- `title={page}` - Page title
- `action=raw` - Return raw wiki markup (fixed)

**Example Request:**
```
GET https://en.wikipedia.org/w/index.php?title=Artificial_intelligence&action=raw
```

**Response:**
- Raw wiki markup text (plain text, not JSON)

### URLSearchParams Construction

The service uses URLSearchParams for parameter building:

```javascript
// Search endpoint
const params = new URLSearchParams({
  action: "query",
  list: "search",
  srsearch: query,
  format: "json",
  srlimit: String(opts.limit || 10),
  srnamespace: String(opts.namespace || 0),
  sroffset: String(opts.offset || 0),
});

// Raw content endpoint
const params = new URLSearchParams({
  title: title,
  action: "raw",
});
```

### HTTP Headers

The service sets a custom User-Agent header for all requests:

```typescript
defaultHeaders = {
  "User-Agent": "TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"
}
```

This is required by Wikipedia's API policy for proper identification of API clients.

## Best Practices

1. **Rate Limiting**: Wikipedia API has rate limits; implement appropriate delays if performing many searches
   ```typescript
   // Example: Add delay between requests
   const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
   
   for (const query of queries) {
     await wikipedia.search(query);
     await delay(1000); // 1 second delay
   }
   ```

2. **Query Optimization**:
   - Use specific, descriptive queries for better results
   - Consider using Boolean operators (e.g., "machine learning AND neural networks")
   - Adjust `limit` parameter based on result quantity needs

3. **Pagination**: For large result sets, use `offset` parameter to paginate through results
   ```typescript
   const pageSize = 50;
   let offset = 0;
   const allResults = [];
   
   do {
     const results = await wikipedia.search(query, { limit: pageSize, offset });
     if (results.query.search.length === 0) break;
     allResults.push(...results.query.search);
     offset += pageSize;
   } while (offset < results.query.searchinfo.totalresults);
   ```

4. **Page Titles**: Use underscores for spaces in page titles (`token_ring` not `token ring`)
   - Consider URL-encoding when dealing with special characters programmatically
   - Wikipedia API expects underscores in page titles

5. **Namespace Filtering**: Use namespace parameter to target specific content types
   - 0: Main article namespace (default)
   - 14: Category namespace
   - 108: Template namespace
   - Other namespaces available per Wikipedia documentation

6. **Error Handling**: Always wrap API calls in try-catch blocks
   ```typescript
   try {
     const results = await wikipedia.search("your query");
     // Process results
   } catch (error) {
     if (error.status === 429) {
       // Rate limited - implement backoff
       await delay(5000);
       return wikipedia.search("your query"); // Retry
     }
     throw error;
   }
   ```

7. **Caching**: Cache frequently accessed search results and page content
   ```typescript
   const cache = new Map<string, any>();
   
   async function cachedSearch(query: string) {
     if (cache.has(query)) return cache.get(query);
     const results = await wikipedia.search(query);
     cache.set(query, results);
     return results;
   }
   
   async function cachedGetPage(title: string) {
     if (cache.has(title)) return cache.get(title);
     const content = await wikipedia.getPage(title);
     cache.set(title, content);
     return content;
   }
   ```

8. **Multi-Language**: Configure appropriate `baseUrl` for different language editions
   - English: `https://en.wikipedia.org`
   - German: `https://de.wikipedia.org`
   - French: `https://fr.wikipedia.org`
   - Spanish: `https://es.wikipedia.org`
   - Japanese: `https://ja.wikipedia.org`

9. **Content Processing**: Raw wiki markup requires parsing for human-readable content
   - Consider using a wiki markup parser library
   - Strip templates and references for clean text
   - Handle special characters and formatting

## Integration

### Agent Integration

The package integrates with the Token Ring agent system through:

1. **Service Registration**: `WikipediaService` is registered as a `TokenRingService`
2. **Tool Registration**: Two tools are automatically registered with `ChatService`
3. **Service Access**: Agents can access the service via `requireServiceByType`

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import WikipediaService from "@tokenring-ai/wikipedia";

// In an agent context
const wikipedia = agent.requireServiceByType(WikipediaService);
const results = await wikipedia.search("machine learning");
```

### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import wikipediaPlugin from "@tokenring-ai/wikipedia";

const app = new TokenRingApp();

// Install with default configuration (English Wikipedia)
app.install(wikipediaPlugin, {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org"
  }
});

// Or with custom configuration
app.install(wikipediaPlugin, {
  wikipedia: {
    baseUrl: "https://de.wikipedia.org"  // German Wikipedia
  }
});

await app.start();
```

### Tool Registration

Tools are automatically registered when the plugin is installed:

```typescript
// In plugin.ts
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)  // Tools auto-registered
    );
    app.addServices(new WikipediaService(config.wikipedia));
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Testing

### Running Tests

```bash
cd pkg/wikipedia
bun run test
```

### Test Configuration

```bash
# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Verify build compiles without errors
bun run build
```

### Integration Tests

The package includes integration tests that verify:

- Wikipedia search functionality with various parameters
- Page content retrieval
- Error handling for invalid inputs
- Support for different language editions
- Pagination with offset support

**Test file**: `pkg/wikipedia/test/WikipediaService.integration.test.ts`

### Example Test

```typescript
import {describe, it, expect} from "vitest";
import WikipediaService, {WikipediaConfigSchema} from "../WikipediaService.ts";

describe("WikipediaService", () => {
  const wikipedia = new WikipediaService(WikipediaConfigSchema.parse({}));
  
  it("should search for articles", async () => {
    const results = await wikipedia.search("artificial intelligence", {limit: 5});
    expect(results.query.search).toHaveLength(5);
    expect(results.query.search[0]).toHaveProperty("title");
    expect(results.query.search[0]).toHaveProperty("snippet");
  });
  
  it("should retrieve page content", async () => {
    const content = await wikipedia.getPage("Artificial_intelligence");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
  });
  
  it("should throw error for empty query", async () => {
    await expect(wikipedia.search("")).rejects.toThrow("query is required");
  });
  
  it("should throw error for empty title", async () => {
    await expect(wikipedia.getPage("")).rejects.toThrow("title is required");
  });
});
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0): Application framework for service registration
- `@tokenring-ai/chat` (0.2.0): Chat functionality for tool registration
- `@tokenring-ai/agent` (0.2.0): Agent framework for tool execution
- `@tokenring-ai/utility` (0.2.0): HTTP service base class and general utilities (`doFetchWithRetry`, `HttpService`)
- `zod` (^4.3.6): Runtime type validation for configuration and inputs

### Development Dependencies

- `vitest` (^4.0.18): Testing framework
- `@vitest/coverage-v8` (^4.0.18): Code coverage
- `typescript` (^5.9.3): TypeScript support

The service extends `HttpService` from `@tokenring-ai/utility` for base HTTP functionality and uses `doFetchWithRetry` for reliable network requests.

## Limitations

- **API Rate Limits**: Wikipedia API has rate limits; high-volume usage requires implementation of rate limiting
- **No News Integration**: This package provides Wikipedia article search only, not news updates
- **No Article Editing**: Read-only API access; cannot create or modify articles
- **Network Dependency**: Requires network connectivity to Wikipedia API
- **Content Type**: Returns raw wiki markup; does not render HTML or formatted content
- **Namespace Support**: Supports standard Wikipedia namespaces (0, 14, 108, etc.)
- **No Image Handling**: Does not provide direct access to images or media files
- **No Category Browsing**: Search only, no category tree traversal

## Related Components

- `@tokenring-ai/research` - Research service that may integrate Wikipedia functionality
- `@tokenring-ai/websearch` - General web search integration
- `@tokenring-ai/browser` - Browser-based content retrieval
- `HttpService` - Base class for HTTP service implementations in `@tokenring-ai/utility`
- `TokenRingAgent` - Agent framework for tool execution and service access
- `ChatService` - Chat service for tool registration in `@tokenring-ai/chat`

## Notes

- Wikipedia API uses underscores for spaces in titles (`Token_Ring` not `Token Ring`)
- The service uses `doFetchWithRetry` from utility package for reliability
- User-Agent header defaults to `"TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"`
- Search results include HTML-formatted snippets for display purposes
- Page content returns raw wiki markup
- Maximum search results per request: 500
- Namespace parameter values match Wikipedia's namespace ID system
- All API calls are asynchronous and return Promises
- Configuration uses Zod schema validation for type safety

## License

MIT License - see the root LICENSE file for details.

---

*Part of the Token Ring AI monorepo - building the future of AI-powered development tools.*
