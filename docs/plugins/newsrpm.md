# NewsRPM Plugin

## Overview

The `@tokenring-ai/newsrpm` package provides comprehensive integration with NewsRPM, a powerful Cloud News Platform for ingesting, processing, storing, indexing, and distributing news articles and textual content. This package wraps common API calls and exposes them as services, tools, and chat commands for seamless integration with TokenRing agents and interactive use in the REPL.

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

## Core Components

### NewsRPMService

The main service class that handles all API interactions with NewsRPM:

```typescript
import NewsRPMService from "@tokenring-ai/newsrpm";

const service = new NewsRPMService({
  apiKey: "your-api-key",
  authMode: 'privateHeader',
  baseUrl: 'https://api.newsrpm.com'
});
```

#### Service Methods

**Search Methods:**

- `searchIndexedData(body)`: Search indexed data by taxonomy keys
  ```typescript
  await service.searchIndexedData({
    key: "NormalizedTicker",
    value: "AAPL",
    count: 25,
    minDate: "2024-01-01T00:00:00.000Z"
  });
  ```

- `searchArticles(body)`: Search articles with various filters
  ```typescript
  await service.searchArticles({
    publisher: ["Reuters", "BBC"],
    type: "Press Release",
    sponsored: false,
    count: 50
  });
  ```

**Article Retrieval Methods:**

- `getArticleBySlug(slug)`: Retrieve article by URL slug
  ```typescript
  const article = await service.getArticleBySlug("tech-earnings-report-2025");
  ```

- `getArticleById(id)`: Retrieve article by numeric ID
  ```typescript
  const article = await service.getArticleById(12345);
  ```

**Content Management Methods:**

- `listProviders()`: Get available news providers
  ```typescript
  const providers = await service.listProviders();
  ```

- `getBody(bodyId)`: Get article body in native format
  ```typescript
  const body = await service.getBody("body-abc123");
  ```

- `renderBody(bodyId)`: Get article body rendered as HTML
  ```typescript
  const rendered = await service.renderBody("body-abc123");
  ```

**Article Upload Method:**

- `uploadArticle(article)`: Create or update articles
  ```typescript
  const result = await service.uploadArticle({
    provider: "Tech News",
    headline: "Latest Technology Updates",
    slug: "tech-updates-2025",
    date: new Date().toISOString(),
    quality: 0.95
  });
  ```

## Services

### NewsRPMService

The `NewsRPMService` class implements `TokenRingService` and provides all NewsRPM API functionality:

**Methods:**

- `searchIndexedData(body: any): Promise<MultipleArticleResponse>`
- `searchArticles(body: any): Promise<MultipleArticleResponse>`
- `getArticleBySlug(slug: string): Promise<SingleArticleResponse>`
- `getArticleById(id: number): Promise<SingleArticleResponse>`
- `listProviders(): Promise<ProviderListResponse>`
- `getBody(bodyId: string): Promise<ArticleBodyResponse>`
- `renderBody(bodyId: string): Promise<ArticleBodyResponse>`
- `uploadArticle(article: any): Promise<{ success: boolean; id: number }>`

**Response Types:**

```typescript
// MultipleArticleResponse
{ success: boolean; rows: any[] }

// SingleArticleResponse  
{ success: boolean; doc: any }

// ProviderListResponse
{ success: boolean; rows: Array<{ provider: string }> }

// ArticleBodyResponse
{ 
  success: boolean;
  body: { v: number; chunks: Array<{ name: string; format: string; content: string }> }
}
```

## Tools

The package provides 8 tools for agent integration, automatically registered with the TokenRing chat service:

### Tool List

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `newsrpm_searchIndexedData` | Search by taxonomy keys | `key`, `value?`, `count?`, `offset?`, `minDate?`, `maxDate?`, `order?` |
| `newsrpm_searchArticles` | Search articles by filters | `publisher?`, `provider?`, `type?`, `fullText?`, `sponsored?`, `count?`, `offset?`, `minDate?`, `maxDate?`, `language?` |
| `newsrpm_getArticleBySlug` | Get article by slug | `slug` |
| `newsrpm_getArticleById` | Get article by ID | `id` |
| `newsrpm_listProviders` | List all providers | none |
| `newsrpm_getBody` | Get article body (native) | `bodyId` |
| `newsrpm_renderBody` | Get article body (HTML) | `bodyId` |
| `newsrpm_uploadArticle` | Upload/update article | `article` |

### Tool Usage Example

```typescript
// In an agent context
const results = await agent.callTool("newsrpm/searchArticles", {
  fullText: "artificial intelligence",
  publisher: "TechCrunch",
  count: 20
});
```

## Providers

This package does not use a provider architecture.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

The package provides a comprehensive `/newsrpm` command for interactive use in the TokenRing REPL:

**Command Syntax:**
```
/newsrpm [subcommand] [options]
```

### Subcommands

#### Search Indexed Data
```bash
/newsrpm index <key> [options]
```
- `--value <values>`: Filter by value(s), comma-separated for multiple
- `--count <n>`: Limit number of results
- `--offset <n>`: Skip number of results
- `--min <iso>`: Minimum date (ISO format)
- `--max <iso>`: Maximum date (ISO format)
- `--order <order>`: Sort order (date or dateWithQuality)
- `--save <path>`: Save response to JSON file

**Example:**
```bash
/newsrpm index publisher --value "Reuters,BBC" --count 20
```

#### Search Articles
```bash
/newsrpm search [options]
```
- `--publisher <names>`: Filter by publisher(s), comma-separated
- `--provider <names>`: Filter by provider(s), comma-separated
- `--type <types>`: Filter by type(s), comma-separated
- `--fulltext <query>`: Full-text search query
- `--sponsored <true|false>`: Filter by sponsored status
- `--language <lang>`: Filter by language
- `--count <n>`: Limit number of results
- `--offset <n>`: Skip number of results
- `--min <iso>`: Minimum date (ISO format)
- `--max <iso>`: Maximum date (ISO format)
- `--save <path>`: Save response to JSON file

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

**Examples:**
```bash
/newsrpm article slug "my-article-slug"
/newsrpm article id 12345
```

#### List Providers
```bash
/newsrpm providers [options]
```
- `--save <path>`: Save response to JSON file

**Example:**
```bash
/newsrpm providers --save providers.json
```

#### Get Article Body
```bash
/newsrpm body <bodyId> [options]
```
- `--render`: Render the body content
- `--save <path>`: Save response to JSON file

**Example:**
```bash
/newsrpm body abc123 --render
```

#### Upload Article
```bash
/newsrpm upload --json <path>
```
- `--json <path>`: Path to JSON file containing article data

**Example:**
```bash
/newsrpm upload --json article.json
```

## Scripting Functions

When `@tokenring-ai/scripting` is available, the package registers 4 global functions:

1. **searchArticles(query)**: Searches articles by full-text query
   ```javascript
   const articles = searchArticles("artificial intelligence");
   ```

2. **searchIndexedData(key, value)**: Searches indexed data by taxonomy
   ```javascript
   const results = searchIndexedData("NormalizedTicker", "AAPL");
   ```

3. **getArticleBySlug(slug)**: Retrieves article by slug
   ```javascript
   const article = getArticleBySlug("my-article-slug");
   ```

4. **listProviders()**: Lists all providers
   ```javascript
   const providers = listProviders();
   ```

## Configuration

The NewsRPMService accepts the following configuration schema (validated using Zod):

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

## Integration

The NewsRPM plugin integrates with several TokenRing components:

### Core Services
- **@tokenring-ai/app**: Application framework for plugin registration and service management
- **@tokenring-ai/chat**: Chat service for tool registration and command processing
- **@tokenring-ai/scripting**: Scripting service for global function registration
- **@tokenring-ai/filesystem**: File system service for file operations in chat commands
- **@tokenring-ai/utility**: Utility functions including HttpService for HTTP requests

### Integration Examples

#### Basic Integration
```typescript
import { NewsRPMService } from "@tokenring-ai/newsrpm";

const service = new NewsRPMService({
  apiKey: process.env.NEWSRPM_API_KEY!,
  authMode: 'privateHeader'
});

// Search for technology articles
const techNews = await service.searchArticles({
  type: "Technology",
  count: 10
});
```

#### Agent Integration
```typescript
// Tools are automatically available to agents
const agent = new Agent();
const articles = await agent.callTool("newsrpm/searchArticles", {
  fullText: "artificial intelligence",
  publisher: "TechCrunch",
  count: 20
});
```

#### File System Integration
```typescript
// Upload article from JSON file
const fsService = agent.requireServiceByType(FileSystemService);
const raw = await fsService.readFile('article.json', 'utf-8');
const article = JSON.parse(raw);
const result = await service.uploadArticle(article);
```

#### Chat Command Usage
```typescript
// When the app is running, access NewsRPM via:
/newsrpm search --fulltext "AI" --count 10
/newsrpm index NormalizedTicker --value GOOG --count 25
/newsrpm upload --json article.json
```

## Usage Examples

### Search Examples

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
  // ... other required fields per OpenAPI schema
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

## Best Practices

1. **API Key Security**: Store API keys in environment variables, never in code
2. **Rate Limiting**: Respect NewsRPM rate limits; use retry configuration
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Response Caching**: Consider caching frequently accessed articles
5. **Batch Operations**: Use appropriate count/offset parameters for large datasets
6. **Date Filtering**: Use ISO 8601 format for date parameters
7. **Provider Management**: Regularly check available providers
8. **Authentication Mode**: Choose appropriate authMode for your deployment (headers preferred for server-side)

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
- `zod`: Runtime type validation
- `@tokenring-ai/ai-client`: AI client integration
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/utility`: Utility functions
- `@tokenring-ai/scripting`: Scripting service
- `@tokenring-ai/filesystem`: File system service

### Development Dependencies

- `vitest`: Testing framework
- `@vitest/coverage-v8`: Code coverage
- `typescript`: TypeScript compiler

### Version Requirements

- Node.js: Required for execution
- TypeScript: ^5.9.3
- Vitest: ^4.0.18

## RPC Endpoints

This package does not define any RPC endpoints.

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
- The article upload schema requires specific fields including provider, headline, slug, date, and quality
- The package exports both the service and the tools together through the plugin system

## License

MIT License - see LICENSE file for details.

END FILE ATTACHMENT