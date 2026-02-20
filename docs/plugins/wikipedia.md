# Wikipedia Plugin

Plugin: Knowledge Base Search and Content Retrieval

## Overview and Purpose

The `@tokenring-ai/wikipedia` package provides seamless integration with Wikipedia's API, enabling Token Ring agents and applications to search for articles, retrieve content, and access a global knowledge base. This plugin wraps Wikipedia's REST API (.w/api.php), providing a clean interface for article searches and page content retrieval.

### Key Features

- **API Integration**: Access Wikipedia's search and raw content APIs
- **Flexible Search**: Search Wikipedia articles with configurable limits and namespace filtering
- **Content Retrieval**: Fetch raw wiki markup content for any Wikipedia page
- **Multi-Language Support**: Works with Wikipedia content in multiple languages via baseUrl configuration
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Agent Tools**: Search tool automatically registered for agent interaction
- **Configurable**: Optional baseUrl for different Wikipedia language editions
- **Error Handling**: Comprehensive error handling with status codes and clear error messages

## Core Components

### WikipediaService

The main service class that handles all Wikipedia API interactions.

**Location**: `pkg/wikipedia/WikipediaService.ts`

#### Constructor

```typescript
constructor(config: WikipediaConfig = {})
```

**Parameters:**
- `baseUrl` (optional): Base URL for Wikipedia API endpoint, defaults to `https://en.wikipedia.org/w/api.php`
- Available for multi-language Wikipedia editions (e.g., `https://de.wikipedia.org/w/api.php`, `https://fr.wikipedia.org/w/api.php`)

#### Service Methods

##### `search(query: string, opts?: WikipediaSearchOptions): Promise<any>`

Performs a Wikipedia search and returns structured search results with articles matching the query.

**Parameters:**
- `query` (required): Search query string
- `opts.limit` (optional): Number of results to return (1-500, default: 10)
- `opts.namespace` (optional: Article namespace (default: 0 = article namespace)
- `opts.offset` (optional: Pagination offset for large result sets (default: 0)

**Returns:**
```typescript
{
  query?: {
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

**Example:**
```typescript
const wikipedia = new WikipediaService(WikipediaConfigSchema.parse({}));

// Basic search
const results = await wikipedia.search("artificial intelligence");
console.log(`Found ${results.query.searchinfo.totalresults} results`);

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

**Example:**
```typescript
// Get raw wiki markup for a page
const content = await wikipedia.getPage("Token_Ring");
console.log(content.substring(0, 200) + "...");
// Returns: <nowiki> tag content and raw wiki markup
```

##### `fetchJson(endpoint: string, options?, context: string): Promise<any>`

Protected method extending HttpService base class for JSON API calls.

**Parameters:**
- `endpoint`: API endpoint path
- `options`: Fetch request options
- `context`: Error message context

**Internal Use**: This method handles the actual HTTP requests to Wikipedia's API endpoint.

## Plugin Registration

**Location**: `pkg/wikipedia/plugin.ts`

The plugin exports a TokenRingPlugin configuration that:
- Registers WikipediaService with the application (loaded from config slice `'wikipedia'`)
- Registers tool via ChatService.addTools() during install phase
- Provides optional configuration schema validation
- Does NOT include separate tool files (single search tool in tools.ts)

**Plugin Structure:**
```typescript
const plugin = {
  name: "@tokenring-ai/wikipedia",
  version: "0.2.0",
  description: "Wikipedia search integration for Token Ring",
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    if (config.wikipedia) {
      app.addServices(new WikipediaService(config.wikipedia));
    }
  },
  config: packageConfigSchema
};
```

## Wikipedia Tools

The package provides two tools for agent integration, automatically registered with the TokenRing chat service:

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
    // ... implementation
  }
}
```

**Usage:**
```typescript
// In agent task execution, tool is auto-available
const agent = new Agent();
const results = await agent.callTool("wikipedia_search", {
  query: "artificial intelligence",
  limit: 10
});
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
    // ... implementation
  }
}
```

**Usage:**
```typescript
// In agent task execution, tool is auto-available
const agent = new Agent();
const content = await agent.callTool("wikipedia_getPage", {
  title: "Machine learning"
});
```

**No Chat Commands**: Unlike some other packages, Wikipedia only provides tools, not CLI chat commands.

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
├── schema.ts                     # Zod configuration schema
├── package.json                  # Package metadata and dependencies
└── vitest.config.ts              # Test configuration
```

## Usage Examples

### Service Integration

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";

// Basic usage
const wikipedia = new WikipediaService(WikipediaConfigSchema.parse({}));

// Search Wikipedia articles
const results = await wikipedia.search("Token Ring AI framework");
console.log(`Total results: ${results.query.searchinfo.totalresults}`);
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
  baseUrl: "https://de.wikipedia.org/w/api.php"
});
const germanResults = await germanWikipedia.search("KI-Forschung");
const germanContent = await germanWikipedia.getPage("KI");
```

### Agent Tool Usage

```typescript
// Tools are auto-registered with agent after package installation
const agent = new Agent();
const searchResults = await agent.callTool("wikipedia_search", {
  query: "machine learning",
  limit: 5
});
console.log(searchResults.results.query.searchinfo.totalresults);

// Pagination example
const firstPage = await agent.callTool("wikipedia_search", {
  query: "typescript",
  limit: 10,
  offset: 0
});

const secondPage = await agent.callTool("wikipedia_search", {
  query: "typescript",
  limit: 10,
  offset: 10
});
```

### Integration with Token Ring Applications

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp({
  config: {
    wikipedia: {
      baseUrl: "https://en.wikipedia.org/w/api.php"
    }
  }
});

// Register Wikipedia plugin
app.registerPlugin((await import('@tokenring-ai/wikipedia')).default);
await app.start();

// Access the service (if available in agent context)
// Tools will be auto-registered and accessible via agent.callTool()
```

## Configuration

### Service Options

Wikipedia configuration is optional and uses Zod schema validation:

```typescript
interface WikipediaConfig {
  baseUrl?: string;  // Defaults to "https://en.wikipedia.org/w/api.php"
}
```

### Configuration Examples

#### Basic Configuration

```typescript
// In your application configuration
const config = {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org/w/api.php"
  }
};
```

#### Multi-Language Configuration

```typescript
// For German Wikipedia
const germanConfig = {
  wikipedia: {
    baseUrl: "https://de.wikipedia.org/w/api.php"
  }
};

// For French Wikipedia
const frenchConfig = {
  wikipedia: {
    baseUrl: "https://fr.wikipedia.org/w/api.php"
  }
};
```

#### Environment Variables

```bash
# Optional: Set default Wikipedia API base URL
export WIKIPEDIA_BASE_URL="https://en.wikipedia.org/w/api.php"
```

**Note**: Environment variables are not auto-loaded by the service; you must configure them in your application configuration file.

## Response Types

### WikipediaSearchResponse

The search method returns a structured response with comprehensive metadata:

```typescript
{
  query?: {
    searchinfo: {
      totalresults: number;        // Total number of matching articles
      suggestion?: string;          // Search suggestion if mismatch detected
      suggestionstats: number;      // Number of suggestions generated
      [key: string]: any;
    };
    search: Array<{
      title: string;                 // Article title
      pageid: number;               // Page ID (unique identifier)
      namespace: number;             // Article namespace (0=main, etc.)
      wordcount: number;            // Approximate word count in article
      timestamp: string;            // Last modification timestamp
      snippet: string;              // Search snippet (HTML-formatted)
      [key: string]: any;
    }>;
    [key: string]: any;            // Additional API fields
  };
}
```

## Error Handling

The service implements standard error handling:

- **Input Validation**: Required `query` parameter validated before API calls
- **HTTP Errors**: Non-2xx responses include status code via `Object.assign`
- **Error Properties**: Errors include `message` and optional `status` properties

### Error Examples

```typescript
try {
  const results = await wikipedia.search("");
} catch (error) {
  console.log(error.message); // "query is required"
}

try {
  const results = await wikipedia.getPage("");
} catch (error) {
  console.log(error.message); // "title is required"
  console.log(error.status);  // Status number if available
}

try {
  const results = await wikipedia.search("invalid query that produces HTTP error");
} catch (error) {
  console.log(error.message); // Error message from Wikipedia API
  console.log(error.status);  // HTTP status code
}
```

### Common Error Scenarios

1. **Missing Query**: `Error: query is required`
2. **Missing Title**: `Error: title is required`
3. **HTTP Error**: `Error: Wikipedia page retrieval failed (404)`
4. **Network Error**: Service-level errors from fetch implementation

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
GET https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=AI&format=json
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

### URLSearchParams Construction

The service uses URLSearchParams for parameter building:

```javascript
const params = new URLSearchParams({
  action: "query",
  list: "search",
  srsearch: query,
  format: "json",
  srlimit: String(opts.limit || 10),
  srnamespace: String(opts.namespace || 0),
  sroffset: String(opts.offset || 0),
});
```

## Best Practices

1. **Rate Limiting**: Wikipedia API has rate limits; implement appropriate delays if performing many searches

2. **Query Optimization**:
   - Use specific, descriptive queries for better results
   - Consider using Boolean operators (e.g., "machine learning AND neural networks")
   - Adjust `limit` parameter based on result quantity needs

3. **Pagination**: For large result sets, use `offset` parameter to paginate through results
   ```typescript
   const pageSize = 50;
   let offset = 0;
   do {
     const results = await wikipedia.search(query, { limit: pageSize, offset });
     if (results.query.search.length === 0) break;
     offset += pageSize;
   } while (offset < totalResults);
   ```

4. **Page Titles**: Use underscores for spaces in page titles (`token_ring` not `token ring`)
   - Consider URL-encoding when dealing with special characters programmatically

5. **Namespace Filtering**: Use namespace parameter to target specific content types
   - 0: Main article namespace
   - 14: Category namespace
   - 108: Template namespace

6. **Error Handling**: Always wrap API calls in try-catch blocks
   ```typescript
   try {
     const results = await wikipedia.search("your query");
     // Process results
   } catch (error) {
     if (error.status === 429) {
       // Rate limited - implement backoff
     }
   }
   ```

7. **Caching**: Cache frequently accessed search results and page content
   ```typescript
   const cache = new Map();
   async function cachedSearch(query) {
     if (cache.has(query)) return cache.get(query);
     const results = await wikipedia.search(query);
     cache.set(query, results);
     return results;
   }
   ```

8. **Multi-Language**: Configure appropriate `baseUrl` for different language editions
   - English: `https://en.wikipedia.org/w/api.php`
   - German: `https://de.wikipedia.org/w/api.php`
   - French: `https://fr.wikipedia.org/w/api.php`

## Dependencies

- `@tokenring-ai/app`: Application framework for service registration
- `@tokenring-ai/chat`: Chat functionality for tool registration
- `@tokenring-ai/agent`: Agent framework for tool execution
- `@tokenring-ai/utility`: HTTP service base class and general utilities
- `zod`: Runtime type validation for configuration and inputs

The service extends `HttpService` from `@tokenring-ai/utility` for base HTTP functionality.

## Limitations

- **No News Integration**: This package provides Wikipedia article search only, not news updates
- **API Rate Limits**: Wikipedia API has rate limits; high-volume usage requires implementation
- **No Article Editing**: Read-only API access; cannot create or modify articles
- **Network Dependency**: Requires network connectivity to Wikipedia API
- **Content Type**: Returns raw wiki markup; does not render HTML or formatted content
- **Namespace Support**: Supports standard Wikipedia namespaces (0, 14, 108, etc.)

## Related Components

- **HttpService**: Base class for HTTP service implementations in `@tokenring-ai/utility`
- **TokenRingAgent**: Agent framework for tool execution and service access

## Development

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

### Development Checklist

- [ ] Test search functionality with various queries
- [ ] Test pagination with offset parameter
- [ ] Test namespace filtering
- [ ] Test error handling for invalid inputs
- [ ] Test multi-language configuration
- [ ] Verify tool registration and agent integration
- [ ] Test rate limit handling (if applicable)
- [ ] Document additional Wikipedia API features
- [ ] Provide usage examples for common scenarios

## Notes

- Wikipedia API uses underscores for spaces in titles (`Token_Ring` not `Token Ring`)
- The service uses `doFetchWithRetry` from utility package for reliability
- User-Agent header defaults to `"TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"`
- Search results include HTML-formatted snippets for display purposes
- Page content returns raw wiki markup with `<nowiki>` tags
- Maximum search results per request: 500
- Namespace parameter values match Wikipedia's namespace ID system

## License

MIT License - see the root LICENSE file for details.

---

*Part of the Token Ring AI monorepo - building the future of AI-powered development tools.*
