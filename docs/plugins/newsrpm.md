# NewsRPM Plugin

Integration with NewsRPM API for storing, indexing, and retrieving news articles and metadata.

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

### Tools Integration

The package provides 8 tools for agent integration, automatically registered with the TokenRing chat service:

1. **newsrpm/searchIndexedData**
   ```typescript
   {
     key: "topic",
     value: "artificial intelligence",
     count: 10
   }
   ```

2. **newsrpm/searchArticles**
   ```typescript
   {
     publisher: "Reuters",
     fullText: "AI technology",
     count: 25
   }
   ```

3. **newsrpm/getArticleBySlug**
   ```typescript
   {
     slug: "example-article-slug"
   }
   ```

4. **newsrpm/getArticleById**
   ```typescript
   {
     id: 12345
   }
   ```

5. **newsrpm/uploadArticle**
   ```typescript
   {
     article: {
       provider: "News Source",
       headline: "Article Title",
       slug: "article-slug",
       date: "2025-01-01T00:00:00.000Z",
       quality: 0.9
     }
   }
   ```

6. **newsrpm/listProviders**
   ```typescript
   {}
   ```

7. **newsrpm/getBody**
   ```typescript
   {
     bodyId: "body-abc123"
   }
   ```

8. **newsrpm/renderBody**
   ```typescript
   {
     bodyId: "body-abc123"
   }
   ```

### Chat Commands

The package provides a comprehensive `/newsrpm` command for interactive use in the TokenRing REPL:

**Command Syntax:**
```
/newsrpm [subcommand] [options]
```

**Available Subcommands:**

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

## Global Scripting Functions

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
- `fetchImpl: any` - Custom fetch implementation for testing

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

### Environment Variables
- `NEWSRPM_API_KEY`: Set this environment variable to your NewsRPM API key
- `NEWSRPM_BASE_URL`: Optional, defaults to 'https://api.newsrpm.com'

## Dependencies

- `@tokenring-ai/app`: For plugin architecture and service management
- `@tokenring-ai/agent`: For agent integration
- `@tokenring-ai/chat`: For tool registration and chat command handling
- `@tokenring-ai/scripting`: For global scripting function registration (optional)
- `@tokenring-ai/utility`: For HTTP service utilities
- `@tokenring-ai/filesystem`: For file system operations
- `zod`: For configuration validation

## Authentication

The package supports 4 authentication modes:

1. **privateHeader** (default): `Authorization: privateKey <apiKey>`
2. **publicHeader**: `Authorization: publicKey <apiKey>`
3. **privateQuery**: Query parameter `T=<apiKey>`
4. **publicQuery**: Query parameter `P=<apiKey>`

Choose the mode that matches your NewsRPM deployment security requirements.

## Response Types

### MultipleArticleResponse
```typescript
{
  success: boolean;
  rows: Array<{
    headline?: string;
    provider?: string;
    slug?: string;
    // ... other article fields
  }>
}
```

### SingleArticleResponse
```typescript
{
  success: boolean;
  doc: {
    // Full article object
  }
}
```

### ProviderListResponse
```typescript
{
  success: boolean;
  rows: Array<{
    provider: string;
  }>
}
```

### ArticleBodyResponse
```typescript
{
  success: boolean;
  body: { v: number; chunks: Array<{ name: string; format: string; content: string }> }
}
```

## Error Handling

The service implements comprehensive error handling:

- **Input Validation**: Required fields are validated before API calls
- **HTTP Error Handling**: Non-2xx responses include status, message, and hints
- **Retry Logic**: 429 and 5xx responses retry with exponential backoff
- **Timeout Handling**: Requests timeout according to configured timeoutMs

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

## API Reference

The complete API schema is available in:
- `pkg/newsrpm/design/newsrpm.openapi.json` - OpenAPI specification
- `pkg/newsrpm/design/newsrpm_api.txt` - Text summary

### Upload Article Schema

For upload operations, the article object must include:
- `provider: string` - News provider name
- `headline: string` - Article headline
- `slug: string` - URL slug
- `date: string` - ISO date string
- `quality: number` - Quality score

Additional fields are documented in the OpenAPI schema.

## Integration Examples

### Basic Integration
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

### Advanced Integration with Agents
```typescript
// Tools are automatically available to agents
const agent = new Agent();
const articles = await agent.callTool("newsrpm/searchArticles", {
  fullText: "artificial intelligence",
  publisher: "TechCrunch",
  count: 20
});
```

### File System Integration
```typescript
// Upload article from JSON file
const fsService = agent.requireServiceByType(FileSystemService);
const raw = await fsService.readFile('article.json', 'utf-8');
const article = JSON.parse(raw);
const result = await service.uploadArticle(article);
```

## Best Practices

1. **API Key Security**: Store API keys in environment variables, never in code
2. **Rate Limiting**: Respect NewsRPM rate limits; use retry configuration
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Response Caching**: Consider caching frequently accessed articles
5. **Batch Operations**: Use appropriate count/offset parameters for large datasets
6. **Date Filtering**: Use ISO 8601 format for date parameters
7. **Provider Management**: Regularly check available providers

## Notes and Limitations

- Some server responses use "visiblity" (typo) in the schema; field names are preserved exactly
- Rate limiting: 429 responses are automatically retried with exponential backoff
- Timeout: Default timeout is 30 seconds; adjust based on your needs
- Authentication: Choose appropriate authMode for your deployment (headers preferred for server-side)
- The article upload schema requires specific fields including provider, headline, slug, date, and quality