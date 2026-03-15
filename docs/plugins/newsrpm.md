# @tokenring-ai/newsrpm

The `@tokenring-ai/newsrpm` package provides comprehensive integration with NewsRPM, a powerful Cloud News Platform for ingesting, processing, storing, indexing, and distributing news articles and textual content. This package wraps common API calls and exposes them as services, tools, and chat commands for seamless integration with TokenRing agents and interactive use in the REPL.

**Package Name:** `@tokenring-ai/newsrpm`  
**Version:** 0.2.0  
**Description:** NewsRPM integration for Token Ring (search, retrieve, upload articles)

## Overview

NewsRPM is a Cloud News Platform designed for the ingestion, processing, storage, indexing, and distribution of news articles and other textual content. The package provides:

- **NewsRPMService**: A TokenRingService for direct API interactions
- **8 Tools**: Ready-to-use tools for the TokenRing tools registry
- **`/newsrpm` Chat Command**: Interactive CLI command with 6 subcommands for quick access
- **4 Scripting Functions**: Global functions available when scripting service is enabled

The package integrates seamlessly with the TokenRing agent framework, providing both tool-based interactions and scripting functions for programmatic news article management.

## Key Features

- **Comprehensive Search**: Search indexed data by taxonomy keys (ticker, topic, region) and articles by publisher, provider, type, full-text, and more
- **Article Retrieval**: Retrieve articles by slug or numeric ID with full metadata
- **Content Management**: Fetch article bodies in native format or rendered HTML
- **Provider Management**: List and manage available news providers
- **Article Upload**: Create and update articles in NewsRPM instances
- **Flexible Authentication**: Multiple authentication modes (header/query-based)
- **Robust Error Handling**: Built-in retry logic, timeout handling, and comprehensive error responses
- **Plugin Integration**: Seamless integration with TokenRing's plugin architecture
- **Scripting Support**: Global functions for agent scripting when `@tokenring-ai/scripting` is available
- **Chat Commands**: Interactive `/newsrpm` command for REPL usage

## Core Components

### NewsRPMService

The main service class that handles all API interactions with NewsRPM. Implements the `TokenRingService` interface.

```typescript
import NewsRPMService from "@tokenring-ai/newsrpm";

const service = new NewsRPMService({
  apiKey: "your-api-key",
  authMode: 'privateHeader',
  baseUrl: 'https://api.newsrpm.com'
});
```

#### Service Methods

##### Search Methods

**`searchIndexedData(body: any): Promise<MultipleArticleResponse>`**

Search indexed data by taxonomy keys.

```typescript
const result = await service.searchIndexedData({
  key: "NormalizedTicker",
  value: "AAPL",
  count: 25,
  minDate: "2024-01-01T00:00:00.000Z"
});
```

**Parameters:**
- `key` (required): Index key specifier (e.g., NormalizedTicker, topic, region)
- `value` (optional): Value to look up in the index (string or array of strings)
- `count` (optional): Number of articles to return
- `offset` (optional): How many articles to skip before returning results
- `minDate` (optional): Earliest date to return (inclusive, ISO 8601)
- `maxDate` (optional): Latest date to return (inclusive, ISO 8601)
- `order` (optional): Sort order: "date" or "dateWithQuality"

**`searchArticles(body: any): Promise<MultipleArticleResponse>`**

Search articles with various filters.

```typescript
const result = await service.searchArticles({
  publisher: ["Reuters", "BBC"],
  type: "Press Release",
  sponsored: false,
  count: 50
});
```

**Parameters:**
- `publisher` (optional): Name(s) of the publisher to search for
- `provider` (optional): Name(s) of the provider to search for
- `fullText` (optional): Full text query to execute against the article headline
- `type` (optional): Type(s) of article to search for
- `sponsored` (optional): Restrict to sponsored or non-sponsored content
- `count` (optional): Number of articles to return
- `offset` (optional): How many articles to skip before returning results
- `minDate` (optional): Earliest date to return (inclusive, ISO 8601)
- `maxDate` (optional): Latest date to return (inclusive, ISO 8601)
- `language` (optional): Filter by article language

##### Article Retrieval Methods

**`getArticleBySlug(slug: string): Promise<SingleArticleResponse>`**

Retrieve article by URL slug.

```typescript
const article = await service.getArticleBySlug("tech-earnings-report-2025");
```

**Parameters:**
- `slug` (required): The unique slug identifier of the article to retrieve

**`getArticleById(id: number): Promise<SingleArticleResponse>`**

Retrieve article by numeric ID.

```typescript
const article = await service.getArticleById(12345);
```

**Parameters:**
- `id` (required): The local numeric identifier of the article to retrieve

##### Content Management Methods

**`listProviders(): Promise<ProviderListResponse>`**

Get available news providers.

```typescript
const providers = await service.listProviders();
```

**`getBody(bodyId: string): Promise<ArticleBodyResponse>`**

Get article body in native format.

```typescript
const body = await service.getBody("body-abc123");
```

**Parameters:**
- `bodyId` (required): Body ID of the article body to retrieve

**`renderBody(bodyId: string): Promise<ArticleBodyResponse>`**

Get article body rendered as HTML.

```typescript
const rendered = await service.renderBody("body-abc123");
```

**Parameters:**
- `bodyId` (required): Body ID of the article body to retrieve (rendered)

##### Article Upload Method

**`uploadArticle(article: any): Promise<{ success: boolean; id: number }>`**

Create or update articles.

```typescript
const result = await service.uploadArticle({
  provider: "Tech News",
  headline: "Latest Technology Updates",
  slug: "tech-updates-2025",
  date: new Date().toISOString(),
  quality: 0.95
});
```

**Required Parameters:**
- `provider`: News provider name
- `headline`: Article headline
- `slug`: URL slug
- `date`: ISO date string
- `quality`: Quality score

**Optional Parameters:**
- `publisher`: The actual publisher of the article
- `link`: URL of the article
- `expires`: Expiration date for the article
- `summary`: Summary of the article (HTML)
- `firstParagraph`: First paragraph of the article (HTML)
- `bodyId`: Unique identifier for article body
- `language`: Language of the article
- `visiblity`: Article visibility ("draft", "embargo", "published", "retracted")
- `metaData`: Provider-specific metadata
- `normalizedData`: Normalized metadata

**Note:** The API schema uses "visiblity" (typo) — field names are preserved exactly as defined.

## Services

### NewsRPMService

The `NewsRPMService` class implements `TokenRingService` and provides all NewsRPM API functionality.

**Service Properties:**
- `name`: "NewsRPMService"
- `description`: "Service for interacting with a NewsRPM instance"

**Service Methods:**

| Method | Return Type | Description |
|--------|-------------|-------------|
| `searchIndexedData(body: any)` | `Promise<MultipleArticleResponse>` | Search indexed data by taxonomy keys |
| `searchArticles(body: any)` | `Promise<MultipleArticleResponse>` | Search articles with filters |
| `getArticleBySlug(slug: string)` | `Promise<SingleArticleResponse>` | Get article by slug |
| `getArticleById(id: number)` | `Promise<SingleArticleResponse>` | Get article by ID |
| `listProviders()` | `Promise<ProviderListResponse>` | List available providers |
| `getBody(bodyId: string)` | `Promise<ArticleBodyResponse>` | Get article body (native) |
| `renderBody(bodyId: string)` | `Promise<ArticleBodyResponse>` | Get article body (rendered) |
| `uploadArticle(article: any)` | `Promise<{ success: boolean; id: number }>` | Upload/update article |

**Response Types:**

```typescript
// MultipleArticleResponse
{
  success: boolean;
  rows: Array<{
    headline?: string;
    provider?: string;
    publisher?: string;
    slug?: string;
    link?: string;
    date?: string;
    expires?: string;
    summary?: string;
    firstParagraph?: string;
    bodyId?: string;
    language?: string;
    visiblity?: "draft" | "embargo" | "published" | "retracted";
    quality?: number;
    metaData?: object;
    normalizedData?: object;
  }>;
}

// SingleArticleResponse  
{
  success: boolean;
  doc: {
    // Full article object matching MultipleArticleResponse rows
  };
}

// ProviderListResponse
{
  success: boolean;
  rows: Array<{
    provider: string;
  }>;
}

// ArticleBodyResponse
{
  success: boolean;
  body: {
    v: number;
    chunks: Array<{
      name: string;
      format: string;  // MIME type (e.g., "text/html")
      content: string;
    }>;
  };
}
```

## Providers

This package does not use a provider architecture. The NewsRPMService directly communicates with the NewsRPM API.

## RPC Endpoints

This package does not define any RPC endpoints. It uses HTTP requests via the `HttpService` base class.

## Chat Commands

The package provides a comprehensive `/newsrpm` command for interactive use in the TokenRing REPL.

**Command Syntax:**
```
/newsrpm [subcommand] [options]
```

### Subcommands

#### Search Indexed Data

```bash
/newsrpm index <key> [options]
```

Search indexed data by key.

**Options:**
- `--value <values>` - Filter by value(s), comma-separated for multiple
- `--count <n>` - Limit number of results
- `--offset <n>` - Skip number of results
- `--min <iso>` - Minimum date (ISO format)
- `--max <iso>` - Maximum date (ISO format)
- `--order <order>` - Sort order (date or dateWithQuality)
- `--save <path>` - Save response to JSON file

**Example:**
```bash
/newsrpm index publisher --value "Reuters,BBC" --count 20
```

#### Search Articles

```bash
/newsrpm search [options]
```

Search articles with filters.

**Options:**
- `--publisher <names>` - Filter by publisher(s), comma-separated
- `--provider <names>` - Filter by provider(s), comma-separated
- `--type <types>` - Filter by type(s), comma-separated
- `--fulltext <query>` - Full-text search query
- `--sponsored <true|false>` - Filter by sponsored status
- `--language <lang>` - Filter by language
- `--count <n>` - Limit number of results
- `--offset <n>` - Skip number of results
- `--min <iso>` - Minimum date (ISO format)
- `--max <iso>` - Maximum date (ISO format)
- `--save <path>` - Save response to JSON file

**Example:**
```bash
/newsrpm search --fulltext "AI" --count 10 --publisher "Reuters"
```

#### Get Article

```bash
# By slug
/newsrpm article slug <slug>
# By ID
/newsrpm article id <id>
```

**Options:**
- `--save <path>` - Save response to JSON file

**Examples:**
```bash
/newsrpm article slug "my-article-slug"
/newsrpm article id 12345
```

#### List Providers

```bash
/newsrpm providers [options]
```

List available news providers.

**Options:**
- `--save <path>` - Save response to JSON file

**Example:**
```bash
/newsrpm providers --save providers.json
```

#### Get Article Body

```bash
/newsrpm body <bodyId> [options]
```

Get article body content.

**Options:**
- `--render` - Render the body content
- `--save <path>` - Save response to JSON file

**Example:**
```bash
/newsrpm body abc123 --render
```

#### Upload Article

```bash
/newsrpm upload --json <path>
```

Upload article from JSON file.

**Options:**
- `--json <path>` - Path to JSON file containing article data

**Example:**
```bash
/newsrpm upload --json article.json
```

## Scripting Functions

When `@tokenring-ai/scripting` is available, the package registers 4 global functions:

### Available Functions

1. **`searchArticles(query: string): string`**
   - Search articles using full-text query
   - Returns: JSON string of article rows

   ```javascript
   const articles = searchArticles("artificial intelligence");
   ```

2. **`searchIndexedData(key: string, value: string): string`**
   - Search indexed data by taxonomy keys
   - Returns: JSON string of article rows

   ```javascript
   const results = searchIndexedData("NormalizedTicker", "AAPL");
   ```

3. **`getArticleBySlug(slug: string): string`**
   - Retrieve article by slug
   - Returns: JSON string of article document

   ```javascript
   const article = getArticleBySlug("my-article-slug");
   ```

4. **`listProviders(): string`**
   - List available news providers
   - Returns: JSON string of provider list

   ```javascript
   const providers = listProviders();
   ```

## Configuration

The NewsRPMService accepts the following configuration schema (validated using Zod):

### Configuration Schema

```typescript
import { NewsRPMConfigSchema } from "@tokenring-ai/newsrpm";

// Schema definition:
{
  apiKey: string;                    // Required: API key for your NewsRPM instance
  authMode?: 'privateHeader' | 'publicHeader' | 'privateQuery' | 'publicQuery';
  baseUrl?: string;                  // Default: 'https://api.newsrpm.com'
  requestDefaults?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
  };
  retry?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
  };
}
```

### Required Configuration

- `apiKey: string` - API key for your NewsRPM instance

### Optional Configuration

- `authMode: 'privateHeader' | 'publicHeader' | 'privateQuery' | 'publicQuery'` (default: 'privateHeader')
- `baseUrl: string` (default: 'https://api.newsrpm.com')
- `requestDefaults: { headers?: Record<string,string>, timeoutMs?: number }`
- `retry: { maxRetries?: number, baseDelayMs?: number, maxDelayMs?: number, jitter?: boolean }`

### Configuration Example

```typescript
// In your application configuration
const config = {
  newsrpm: {
    apiKey: process.env.NEWSRPM_API_KEY!,
    authMode: 'privateHeader',
    baseUrl: 'https://api.newsrpm.com',
    requestDefaults: {
      timeoutMs: 20000,
      headers: {
        'User-Agent': 'TokenRing-NewsRPM/1.0'
      }
    },
    retry: {
      maxRetries: 5,
      baseDelayMs: 400,
      maxDelayMs: 4000,
      jitter: true
    }
  }
};
```

### Plugin Configuration

The plugin automatically handles configuration through the application's configuration system:

```typescript
// In your application plugin configuration
const appConfig = {
  newsrpm: {
    apiKey: process.env.NEWSRPM_API_KEY!,
    authMode: 'privateHeader'
  }
};

// The plugin will automatically initialize the service
```

### Authentication Modes

| Mode | Method | Description |
|------|--------|-------------|
| `privateHeader` (default) | `Authorization: privateKey <apiKey>` | Server-side authentication via header |
| `publicHeader` | `Authorization: publicKey <apiKey>` | Browser/CORS authentication via header |
| `privateQuery` | Query parameter `T=<apiKey>` | Server-side via query (not recommended for web) |
| `publicQuery` | Query parameter `P=<apiKey>` | Browser/CORS via query parameter |

## Integration

The NewsRPM plugin integrates with several TokenRing components:

### Core Services

- **@tokenring-ai/app**: Application framework for plugin registration and service management
- **@tokenring-ai/chat**: Chat service for tool registration and command processing
- **@tokenring-ai/scripting**: Scripting service for global function registration
- **@tokenring-ai/filesystem**: File system service for file operations in chat commands
- **@tokenring-ai/utility**: Utility functions including HttpService for HTTP requests
- **@tokenring-ai/agent**: Agent framework for tool execution and service management

### Plugin Registration

The plugin is registered automatically when included in your application's plugin registry:

```typescript
import NewsRPMPackage from "@tokenring-ai/newsrpm";

// In your application setup
const app = new TokenRingApp();
await app.start();

// Package automatically registers with TokenRing plugin system
// Services are registered based on configuration
```

### Service Registration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import NewsRPMService from "@tokenring-ai/newsrpm";

const app = new TokenRingApp();

// Register the service
app.addServices(new NewsRPMService({
  apiKey: process.env.NEWSRPM_API_KEY!
}));

// Access the service from an agent
const service = agent.requireServiceByType(NewsRPMService);
const articles = await service.searchArticles({ fullText: "AI" });
```

### Tools Integration

The package provides 8 tools for agent integration, automatically registered with the TokenRing chat service.

**Available Tools:**

| Tool Name | Display Name | Description |
|-----------|--------------|-------------|
| `newsrpm_searchIndexedData` | Newsrpm/searchIndexedData | Search by taxonomy keys |
| `newsrpm_searchArticles` | Newsrpm/searchArticles | Search articles with filters |
| `newsrpm_getArticleBySlug` | Newsrpm/getArticleBySlug | Get article by slug |
| `newsrpm_getArticleById` | Newsrpm/getArticleById | Get article by ID |
| `newsrpm_uploadArticle` | Newsrpm/uploadArticle | Upload/update article |
| `newsrpm_listProviders` | Newsrpm/listProviders | List available providers |
| `newsrpm_getBody` | Newsrpm/getBody | Get article body (native) |
| `newsrpm_renderBody` | Newsrpm/renderBody | Get article body (rendered) |

### Tool Schema Details

#### newsrpm_searchIndexedData

Search NewsRPM indexed data by taxonomy key/value.

**Input Schema:**
```typescript
{
  key: string,                    // Index key specifier (e.g., NormalizedTicker, topic, region)
  value: string | string[],      // Value to look up in the index (string or array)
  count?: number,                 // Number of articles to return
  offset?: number,                // How many articles to skip
  minDate?: string,               // Earliest date (ISO 8601)
  maxDate?: string,               // Latest date (ISO 8601)
  order?: "date" | "dateWithQuality"  // Sort order
}
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_searchIndexedData", {
  key: "NormalizedTicker",
  value: ["AAPL", "GOOGL"],
  count: 25,
  order: "dateWithQuality"
});
```

#### newsrpm_searchArticles

Search NewsRPM articles by publisher/provider/type/fullText.

**Input Schema:**
```typescript
{
  publisher?: string | string[],  // Name(s) of the publisher
  provider?: string | string[],   // Name(s) of the provider
  type?: string | string[],       // Type(s) of article
  fullText?: string,               // Full text query
  sponsored?: boolean,             // Restrict to sponsored/non-sponsored
  count?: number,                  // Number of articles to return
  offset?: number,                 // How many articles to skip
  minDate?: string,                // Earliest date (ISO 8601)
  maxDate?: string,                // Latest date (ISO 8601)
  language?: string                // Filter by language
}
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_searchArticles", {
  publisher: ["Reuters", "Bloomberg"],
  fullText: "artificial intelligence",
  count: 20,
  language: "en"
});
```

#### newsrpm_getArticleBySlug

Get a NewsRPM article by slug.

**Input Schema:**
```typescript
{
  slug: string  // The unique slug identifier of the article
}
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_getArticleBySlug", {
  slug: "tech-earnings-report-2025"
});
```

#### newsrpm_getArticleById

Get a NewsRPM article by id.

**Input Schema:**
```typescript
{
  id: number  // The local numeric identifier of the article
}
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_getArticleById", {
  id: 12345
});
```

#### newsrpm_listProviders

List providers present in this NewsRPM instance.

**Input Schema:**
```typescript
{}  // No parameters required
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_listProviders", {});
```

#### newsrpm_getBody

Retrieve an article body (native format) by bodyId.

**Input Schema:**
```typescript
{
  bodyId: string  // Body ID of the article body to retrieve
}
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_getBody", {
  bodyId: "body-abc123"
});
```

#### newsrpm_renderBody

Retrieve a rendered (HTML) article body by bodyId.

**Input Schema:**
```typescript
{
  bodyId: string  // Body ID of the article body to retrieve (rendered)
}
```

**Example:**
```typescript
const result = await agent.callTool("newsrpm_renderBody", {
  bodyId: "body-abc123"
});
```

#### newsrpm_uploadArticle

Upload (create/update) an article to NewsRPM.

**Input Schema:**
```typescript
{
  article: any  // Article object to upload. See pkg/newsrpm/design/newsrpm.openapi.json for the detailed schema
}
```

**Required Article Fields:**
- `provider: string` - News provider name
- `headline: string` - Article headline
- `slug: string` - URL slug
- `date: string` - ISO date string
- `visibility: string` - Article visibility (draft, embargo, published, retracted)
- `quality: number` - Quality score

**Example:**
```typescript
const result = await agent.callTool("newsrpm_uploadArticle", {
  article: {
    provider: "Tech News",
    headline: "Latest Technology Updates",
    slug: "tech-updates-2025",
    date: new Date().toISOString(),
    visibility: "published",
    quality: 0.95
  }
});
```

## Usage Examples

### Service Usage Examples

#### Search by Taxonomy

```typescript
const results = await service.searchIndexedData({
  key: "NormalizedTicker",
  value: ["AAPL", "GOOGL"],
  count: 25,
  minDate: "2024-01-01T00:00:00.000Z"
});
```

#### Search Articles

```typescript
const articles = await service.searchArticles({
  publisher: ["Reuters", "Bloomberg"],
  type: "Press Release",
  sponsored: false,
  count: 50,
  language: "en"
});
```

#### Get Article by Slug

```typescript
const article = await service.getArticleBySlug("tech-earnings-report-2025");
console.log(article.doc.headline);
```

#### Upload Article

```typescript
const result = await service.uploadArticle({
  provider: "Tech News",
  headline: "Latest Technology Updates",
  slug: "tech-updates-2025",
  date: new Date().toISOString(),
  quality: 0.95,
  visibility: "published"
});
```

### Chat Command Examples

```bash
# Search for AI articles
/newsrpm search --fulltext "AI" --count 10

# Search by ticker
/newsrpm index NormalizedTicker --value AAPL,GOOGL --count 25

# Get specific article
/newsrpm article slug "tech-earnings-report-2025"

# List providers
/newsrpm providers

# Upload article from file
/newsrpm upload --json article.json
```

### Scripting Examples

```javascript
// Search and analyze articles
const articles = searchArticles("climate change");
const analysis = llm("Summarize these articles: " + articles);

// Get ticker-specific news
const news = searchIndexedData("NormalizedTicker", "TSLA");
const summary = llm("Analyze sentiment: " + news);
```

## Best Practices

1. **API Key Security**: Store API keys in environment variables, never in code
2. **Rate Limiting**: Respect NewsRPM rate limits; use retry configuration
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Response Caching**: Consider caching frequently accessed articles
5. **Batch Operations**: Use appropriate count/offset parameters for large datasets
6. **Date Filtering**: Use ISO 8601 format for date parameters
7. **Provider Management**: Regularly check available providers
8. **Authentication Mode**: Choose appropriate authMode for your deployment (headers preferred for server-side)

## Error Handling

The service implements comprehensive error handling:

### Error Types

- **Input Validation Errors**: Thrown when required parameters are missing
- **HTTP Errors**: Non-2xx responses include status, message, and hints
- **Network Errors**: Connection timeouts and network failures
- **Rate Limit Errors**: 429 responses trigger automatic retry

### Error Response Format

```typescript
{
  message: string;
  status?: number;
  code?: string;
  details?: any;
  hint?: string;
}
```

### Error Handling Example

```typescript
try {
  const result = await service.searchArticles({ fullText: "test" });
} catch (error: any) {
  console.error(`Error: ${error.message}`);
  if (error.status === 400) {
    console.error("Invalid request parameters");
  } else if (error.status === 401) {
    console.error("Invalid API key");
  } else if (error.status === 429) {
    console.error("Rate limit exceeded");
  }
}
```

### Command Error Handling

The `/newsrpm` command throws `CommandFailedError` when operations fail:

```typescript
// Example error messages:
// "NewsRPM command error: key is required"
// "NewsRPM command error: slug is required"
// "NewsRPM command error: Failed to read file: article.json"
```

## Testing

The package uses vitest for unit testing. Test files are located in the `pkg/newsrpm/` directory.

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual service methods and tool functions
- **Integration Tests**: Test plugin registration and service initialization
- **Configuration Tests**: Verify schema validation and configuration parsing

### Example Test Setup

```typescript
import { describe, it, expect } from 'vitest';
import NewsRPMService from '../NewsRPMService.ts';

describe('NewsRPMService', () => {
  it('should initialize with valid config', () => {
    const service = new NewsRPMService({
      apiKey: 'test-key',
      authMode: 'privateHeader'
    });
    expect(service.name).toBe('NewsRPMService');
  });

  // Additional tests for service methods
});
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: Application framework for plugin integration
- `@tokenring-ai/chat`: Chat service for tool registration
- `zod`: Runtime type validation (^4.3.6)
- `@tokenring-ai/ai-client`: AI client integration
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/utility`: Utility functions
- `@tokenring-ai/scripting`: Scripting service
- `@tokenring-ai/filesystem`: File system service

### Development Dependencies

- `vitest`: Testing framework (^4.0.18)
- `@vitest/coverage-v8`: Code coverage (^4.0.18)
- `typescript`: TypeScript compiler (^5.9.3)

### Version Requirements

- **TypeScript**: ^5.9.3
- **Vitest**: ^4.0.18
- **Zod**: ^4.3.6

## Package Structure

```
pkg/newsrpm/
├── index.ts                          # Main exports (NewsRPMService)
├── NewsRPMService.ts                 # Core service class
├── plugin.ts                         # Plugin registration
├── tools.ts                          # Tool exports
├── commands.ts                       # Command exports
├── schema.ts                         # Configuration schema
├── commands/
│   └── newsrpm/
│       ├── index.ts                  # /newsrpm index
│       ├── search.ts                 # /newsrpm search
│       ├── article.ts                # /newsrpm article
│       ├── providers.ts              # /newsrpm providers
│       ├── body.ts                   # /newsrpm body
│       ├── upload.ts                 # /newsrpm upload
│       └── _utils.ts                 # Shared parseFlags/saveIfRequested
├── tools/
│   ├── getArticleById.ts
│   ├── getArticleBySlug.ts
│   ├── getBody.ts
│   ├── listProviders.ts
│   ├── renderBody.ts
│   ├── searchArticles.ts
│   ├── searchIndexedData.ts
│   └── uploadArticle.ts
├── design/
│   ├── newsrpm.openapi.json         # OpenAPI specification
│   ├── newsrpm_api.txt              # Text summary
│   └── implementation.md            # Implementation notes
├── package.json                     # Package metadata
├── vitest.config.ts                 # Test configuration
└── README.md                        # Package documentation
```

## Design Files

The package includes comprehensive design documentation in the `pkg/newsrpm/design/` directory:

- **newsrpm.openapi.json**: Complete OpenAPI 3.0 specification for the NewsRPM API
- **newsrpm_api.txt**: Text summary of the API endpoints and authentication methods
- **implementation.md**: Implementation notes and developer guidance

These files provide detailed information about:
- API endpoint definitions
- Request/response schemas
- Authentication mechanisms
- Implementation patterns
- Usage examples

## Related Components

The NewsRPM plugin integrates with several other TokenRing components and external services:

### Core Services

- **@tokenring-ai/agent**: Agent framework for tool execution and service management
- **@tokenring-ai/chat**: Chat service for tool registration and command processing
- **@tokenring-ai/scripting**: Scripting service for global function registration
- **@tokenring-ai/filesystem**: File system service for file operations in chat commands
- **@tokenring-ai/utility**: Utility functions including HttpService for HTTP requests

### External Services

- **NewsRPM API**: The NewsRPM service provides the actual news aggregation and storage functionality

### Related Packages

- **@tokenring-ai/websearch**: Alternative web search functionality for news discovery
- **@tokenring-ai/serper**: Serper web search provider for enhanced search capabilities
- **@tokenring-ai/scraperapi**: ScraperAPI web search provider for additional search options

### Documentation

- **Plugin Documentation**: See `pkg/newsrpm/README.md` for comprehensive package documentation
- **API Reference**: OpenAPI specification available in `pkg/newsrpm/design/newsrpm.openapi.json`

## Notes and Limitations

- Some server responses use "visiblity" (typo) in the schema; field names are preserved exactly
- Rate limiting: 429 responses are automatically retried with exponential backoff
- Timeout: Default timeout is 30 seconds; adjust based on your needs
- Authentication: Choose appropriate authMode for your deployment (headers preferred for server-side)
- The article upload schema requires specific fields including provider, headline, slug, date, visibility, and quality
- The package exports both the service and the tools together through the plugin system
- The plugin registers 4 scripting functions when `@tokenring-ai/scripting` is available

## License

MIT License - see LICENSE file for details.
