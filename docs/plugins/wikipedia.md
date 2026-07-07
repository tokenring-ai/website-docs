# @tokenring-ai/wikipedia

The `@tokenring-ai/wikipedia` package provides Wikipedia search integration for Token Ring AI
agents. It implements a service for interacting with the Wikipedia API and provides tools for
agents to search articles and retrieve raw wiki markup content.

## User Guide

### Overview and Purpose

The `@tokenring-ai/wikipedia` package enables Token Ring AI agents to interact with Wikipedia
programmatically. It provides a service-based architecture with pre-built tools for searching
articles and retrieving raw wiki markup content. The package integrates within the Token Ring
ecosystem, allowing agents to leverage Wikipedia as a knowledge base for research, fact-checking,
and content generation tasks.

### Key Features

- **API Integration**: Access Wikipedia search and raw content APIs
- **Flexible Search**: Configurable limits, namespaces, and pagination
- **Content Retrieval**: Fetch raw wiki markup for any Wikipedia page
- **Multi-Language Support**: Different Wikipedia editions via baseUrl configuration
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Agent Tools**: Two tools automatically registered for agent interaction
- **Reliable HTTP**: Uses `HTTPRetriever` with 10-second timeout
- **Plugin Architecture**: Seamless integration with Token Ring app ecosystem

### Chat Commands

This package does not define chat commands. Functionality is exposed through agent tools.

### Tools

| Tool Name         | Display Name      | Description                                              |
|-------------------|-------------------|----------------------------------------------------------|
| wikipedia_search  | Wikipedia/search  | Search Wikipedia articles. Returns structured JSON.      |
| wikipedia_getPage | Wikipedia/getPage | Retrieve a page's raw wiki markup content by title.      |

#### wikipedia_search

**Input Schema:**

```typescript
z.object({
  query: z.string().min(1).describe("Search query"),
  limit: z.number().int().positive().max(500).exactOptional()
    .describe("Number of results (1-500, default: 10)"),
  offset: z.number().int().min(0).exactOptional()
    .describe("Offset for pagination (default: 0)"),
})
```

**Returns:** JSON string with search results.

**Note:** The `namespace` parameter is available on `WikipediaService` directly but is not
exposed through this tool. Use `agent.requireServiceByType(WikipediaService)` for namespace
filtering.

#### wikipedia_getPage

**Input Schema:**

```typescript
z.object({
  title: z.string().min(1).describe("Wikipedia page title"),
})
```

**Returns:** Text string with raw wiki markup content.

### Configuration

#### Schema

The `WikipediaConfigSchema` defines the configuration options for the Wikipedia service:

```typescript
export const WikipediaConfigSchema = z.object({
  baseUrl: z.string().default("https://en.wikipedia.org"),
});
```

**Core Configuration Fields:**

| Field     | Type   | Default                      | Description                         |
|-----------|--------|------------------------------|-------------------------------------|
| baseUrl   | string | `https://en.wikipedia.org`   | Base URL for the Wikipedia API      |

**Example Configuration:**

```typescript
import { WikipediaConfigSchema } from "@tokenring-ai/wikipedia";

// Use defaults (English Wikipedia)
const defaultConfig = WikipediaConfigSchema.parse({});

// Configure for German Wikipedia
const deConfig = WikipediaConfigSchema.parse({
  baseUrl: "https://de.wikipedia.org",
});
```

#### YAML Example

```yaml
wikipedia:
  baseUrl: "https://en.wikipedia.org"
```

#### Plugin Configuration

The plugin wraps the service config under a `wikipedia` key:

```typescript
const packageConfigSchema = z.object({
  wikipedia: WikipediaConfigSchema.prefault({}),
});
```

#### Multi-Language Examples

```typescript
// German Wikipedia
app.install(wikipediaPlugin, {
  wikipedia: { baseUrl: "https://de.wikipedia.org" },
});

// French Wikipedia
app.install(wikipediaPlugin, {
  wikipedia: { baseUrl: "https://fr.wikipedia.org" },
});

// Japanese Wikipedia
app.install(wikipediaPlugin, {
  wikipedia: { baseUrl: "https://ja.wikipedia.org" },
});
```

### Integration

#### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import wikipediaPlugin from "@tokenring-ai/wikipedia";

const app = new TokenRingApp();

// Default configuration (English Wikipedia)
app.install(wikipediaPlugin);

// Custom configuration
app.install(wikipediaPlugin, {
  wikipedia: {
    baseUrl: "https://en.wikipedia.org",
  },
});
```

The plugin automatically:

1. Registers `WikipediaService` with the app
2. Adds Wikipedia tools to `ChatService`

#### Manual Registration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import WikipediaService from "@tokenring-ai/wikipedia";
import tools from "@tokenring-ai/wikipedia/tools";
import { ChatService } from "@tokenring-ai/chat";

const app = new TokenRingApp();

app.addServices(new WikipediaService({}));

app.waitForService(ChatService, (chatService) =>
  chatService.addTools(...tools),
);
```

#### Agent Access

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";

// In an agent context
const wikipedia = agent.requireServiceByType(WikipediaService);
const results = await wikipedia.search("machine learning");
```

### Best Practices

#### Pagination

Use the `offset` parameter for large result sets:

```typescript
const page1 = await wikipedia.search("science", { limit: 10, offset: 0 });
const page2 = await wikipedia.search("science", { limit: 10, offset: 10 });
```

#### Rate Limiting

- Limit consecutive requests
- Use appropriate result limits (default: 10)
- Cache results when possible

#### Handling Errors

Wrap API calls in try-catch blocks:

```typescript
try {
  const results = await wikipedia.search("query");
  // Process results
} catch (error) {
  console.error("Search failed:", error.message);
}
```

#### Language Selection

Configure the appropriate Wikipedia edition:

```typescript
const enWiki = new WikipediaService({ baseUrl: "https://en.wikipedia.org" });
const esWiki = new WikipediaService({ baseUrl: "https://es.wikipedia.org" });
```

#### Page Titles

Wikipedia API expects underscores for spaces in page titles (e.g., `Token_Ring` not
`Token Ring`).

## Developer Reference

### Core Components

#### WikipediaService

The main service class handling all Wikipedia API interactions. Implements `TokenRingService`
and uses `HTTPRetriever` from `@tokenring-ai/utility`.

**Location:** `pkg/wikipedia/WikipediaService.ts`

**Properties:**

| Property      | Value                                                    |
|---------------|----------------------------------------------------------|
| name          | WikipediaService                                         |
| description   | Service for searching Wikipedia articles |
| options       | ParsedWikipediaConfig                                    |

**Constructor:**

```typescript
constructor(options: ParsedWikipediaConfig)
```

The constructor configures `HTTPRetriever` with:

- `baseUrl` from options
- `User-Agent`: `TokenRing-Writer/1.0 (https://github.com/tokenring/writer)`
- `timeout`: 10000 ms

##### search(query, opts?)

Search Wikipedia articles and return structured results.

**Parameters:**

| Parameter | Type                     | Required | Default | Description        |
|-----------|--------------------------|----------|---------|--------------------|
| query     | string                   | Yes      | -       | Search term        |
| opts      | WikipediaSearchOptions   | No       | {}      | Search options     |

**Search Options:**

| Field     | Type   | Default | Description              |
|-----------|--------|---------|--------------------------|
| limit     | number | 10      | Maximum results (1-500)  |
| namespace | number | 0       | Wikipedia namespace ID   |
| offset    | number | 0       | Pagination offset        |

**Returns:** JSONValue with Wikipedia API search response.

**Throws:** Error if query is empty.

##### getPage(title)

Retrieve raw wiki markup content for a Wikipedia page.

**Parameters:**

| Parameter | Type   | Required | Description          |
|-----------|--------|----------|----------------------|
| title     | string | Yes      | Wikipedia page title |

**Returns:** Raw wiki markup text.

**Throws:** Error if title is empty or retrieval fails.

#### Plugin

The plugin exports a `TokenRingPlugin`:

| Property      | Value                                      |
|---------------|--------------------------------------------|
| name          | @tokenring-ai/wikipedia                    |
| displayName   | Wikipedia Integration                      |
| version       | From package.json (0.2.0)                  |
| description   | Wikipedia search integration for Token Ring |

**Install Behavior:**

On install, the plugin:

1. Registers `WikipediaService` with the app via `app.addServices()`
2. Waits for `ChatService` and adds tools via `chatService.addTools(...tools)`

#### Tools Module

**Location:** `pkg/wikipedia/tools.ts`

Provides three export styles:

- **Default export:** Array `[search, getPage]` for spreading into `addTools()`
- **Named exports:** `wikipedia_search`, `wikipedia_getPage`
- **Object export:** `tools` with `{ search, getPage }`

### Services

#### Service Registration

`WikipediaService` implements `TokenRingService` interface. It is registered automatically by
the plugin or manually via `app.addServices()`.

**Access pattern:**

```typescript
const wikipedia = agent.requireServiceByType(WikipediaService);
```

### Provider Documentation

This package does not use a provider registry pattern. `WikipediaService` is a standalone
service registered directly with the application.

### RPC Endpoints

This package does not define RPC endpoints.

### Usage Examples

#### Basic Search and Retrieve

```typescript
import WikipediaService, { WikipediaConfigSchema }
  from "@tokenring-ai/wikipedia";

const wikipedia = new WikipediaService(
  WikipediaConfigSchema.parse({})
);

const searchResults = await wikipedia.search("quantum computing", {
  limit: 3,
});

if (searchResults.query.search.length > 0) {
  const firstResult = searchResults.query.search[0];
  const content = await wikipedia.getPage(firstResult.title);
  console.log("Page content length:", content.length);
}
```

#### Agent Workflow

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";
import type Agent from "@tokenring-ai/agent/Agent";

async function researchTopic(agent: Agent, query: string) {
  const wikipedia = agent.requireServiceByType(WikipediaService);
  const results = await wikipedia.search(query, { limit: 5 });

  if (results.query.search.length > 0) {
    const topArticle = results.query.search[0];
    const pageContent = await wikipedia.getPage(topArticle.title);

    return {
      title: topArticle.title,
      snippet: topArticle.snippet,
      content: pageContent,
    };
  }

  throw new Error("No relevant articles found");
}
```

#### Multi-Language Search

```typescript
import WikipediaService from "@tokenring-ai/wikipedia";

const enWiki = new WikipediaService({
  baseUrl: "https://en.wikipedia.org",
});
const deWiki = new WikipediaService({
  baseUrl: "https://de.wikipedia.org",
});

const enResults = await enWiki.search(
  "artificial intelligence", { limit: 5 }
);
const deResults = await deWiki.search(
  "Kuenstliche Intelligenz", { limit: 5 }
);
```

#### Using Tools

```typescript
import tools from "@tokenring-ai/wikipedia/tools";
import { wikipedia_search, wikipedia_getPage }
  from "@tokenring-ai/wikipedia/tools";

// Register all tools
agent.addTools(...tools);

// Or register individually
agent.addTools(wikipedia_search, wikipedia_getPage);

// Execute tools
const searchResult = await agent.executeTool("wikipedia_search", {
  query: "machine learning",
  limit: 10,
});

const pageResult = await agent.executeTool("wikipedia_getPage", {
  title: "Machine learning",
});
```

### Testing

#### Running Tests

```bash
bun run test           # Run all tests
bun run test:watch     # Watch mode
bun run test:coverage  # Coverage report
bun run build          # TypeScript check
```

#### Test Structure

Integration tests in `test/WikipediaService.integration.test.ts` verify:

- Search functionality with various parameters
- Page content retrieval
- Error handling for invalid inputs
- Multi-language support
- Pagination with offset
- Network error handling
- JSON parse error handling

#### Example Test

```typescript
import { describe, expect, it } from "vitest";
import WikipediaService, { WikipediaConfigSchema }
  from "../WikipediaService.ts";

describe("WikipediaService", () => {
  it("should throw error for empty query", async () => {
    const wikipedia = new WikipediaService(
      WikipediaConfigSchema.parse({})
    );
    await expect(wikipedia.search(""))
      .rejects.toThrow("query is required");
  });

  it("should throw error for empty title", async () => {
    const wikipedia = new WikipediaService(
      WikipediaConfigSchema.parse({})
    );
    await expect(wikipedia.getPage(""))
      .rejects.toThrow("title is required");
  });
});
```

### Dependencies

#### Production

| Package                | Version        | Purpose                     |
|------------------------|----------------|-----------------------------|
| @tokenring-ai/app      | workspace:*    | Application framework       |
| @tokenring-ai/chat     | workspace:*    | Chat and tool integration   |
| @tokenring-ai/agent    | workspace:*    | Agent framework             |
| @tokenring-ai/utility  | workspace:*    | HTTP utilities              |
| zod                    | ^4.4.3         | Schema validation           |

#### Development

| Package      | Version    | Purpose          |
|--------------|------------|------------------|
| vitest       | ^4.1.1     | Testing framework|
| typescript   | ^6.0.2     | TypeScript       |

### Related Components

- `@tokenring-ai/research` - Research service
- `@tokenring-ai/websearch` - General web search integration
- `@tokenring-ai/serper` - Serper web search provider
- `@tokenring-ai/scraperapi` - ScraperAPI web search provider

### Package Structure

```text
pkg/wikipedia/
├── index.ts                                    # Main entry point
├── plugin.ts                                   # Token Ring plugin
├── WikipediaService.ts                         # Core service and schema
├── tools.ts                                    # Tool exports
├── tools/
│   ├── search.ts                               # wikipedia_search tool
│   └── getPage.ts                              # wikipedia_getPage tool
├── package.json                                # Package metadata
├── vitest.config.ts                            # Vitest configuration
├── test/
│   └── WikipediaService.integration.test.ts    # Integration tests
└── README.md                                   # Package documentation
```

### Exports

#### index.ts

- `WikipediaService` (default) - Main service class
- `WikipediaConfigSchema` - Zod configuration schema
- `ParsedWikipediaConfig` (type) - Parsed configuration type
- `WikipediaSearchOptions` (type) - Search options type

#### tools.ts

- Default: `[search, getPage]` array
- `wikipedia_search` - Search tool
- `wikipedia_getPage` - Get page tool
- `tools` - Object with `{ search, getPage }`

### Error Handling

The service includes comprehensive error handling:

- **Invalid inputs:** Descriptive errors for missing parameters
- **API failures:** HTTPRetriever handles HTTP errors
- **Network issues:** Retry logic for transient failures
- **JSON parsing:** Validates responses against JSONValueSchema

**Error examples:**

```typescript
await wikipedia.search(""); // Error: "query is required"
await wikipedia.getPage(""); // Error: "title is required"
await wikipedia.getPage("NonExistentPage");
// Error: "Wikipedia page retrieval failed"
```

### API Reference

#### Search Endpoint

**URL:** `/w/api.php?action=query&list=search&srsearch={query}&format=json`

**Parameters:**

| Parameter   | Description              | Default |
|-------------|--------------------------|---------|
| action      | query (fixed)            | -       |
| list        | search (fixed)           | -       |
| srsearch    | Search query string      | -       |
| format      | json (fixed)             | -       |
| srlimit     | Number of results        | 10      |
| srnamespace | Namespace ID             | 0       |
| sroffset    | Pagination offset        | 0       |

#### Raw Content Endpoint

**URL:** `/w/index.php?title={title}&action=raw`

**Parameters:**

| Parameter | Description      |
|-----------|------------------|
| title     | Page title       |
| action    | raw (fixed)      |

### Limitations

- **Rate limits:** Wikipedia API enforces rate limits
- **Read-only:** Cannot create or modify articles
- **Raw markup only:** Returns wiki markup, not rendered HTML
- **Namespace in tools:** The search tool does not expose namespace parameter
- **No image handling:** Does not provide direct media access
- **Network required:** Requires connectivity to Wikipedia API

## License

MIT License - see the root LICENSE file for details.
