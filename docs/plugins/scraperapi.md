# @tokenring-ai/scraperapi

ScraperAPI integration for Token Ring - A web search provider that enables structured Google SERP, Google News, and HTML fetching through ScraperAPI.

## Overview

The `@tokenring-ai/scraperapi` package provides a ScraperAPI-based web search provider that integrates with the Token Ring AI platform. It extends the `WebSearchProvider` from `@tokenring-ai/websearch`, offering:

- **Google SERP Search**: Structured search results with organic listings, knowledge graphs, and related questions
- **Google News Search**: Structured news articles with sources, thumbnails, dates, and links
- **HTML Fetching**: Retrieve page content with optional JavaScript rendering and geotargeting
- **Error Handling**: Robust error management with retry logic via `doFetchWithRetry`
- **Geotargeting**: Support for country-specific searches and custom TLDs
- **Plugin Integration**: Automatic registration with Token Ring applications

## Key Features

### Core Capabilities

- **Web Scraping**: Fetch HTML content from any URL with optional rendering
- **Google Search**: Perform structured SERP searches with comprehensive parameter support
- **Google News**: Retrieve news articles with metadata and thumbnails
- **Geotargeting**: Country-specific searches with support for multiple Google TLDs
- **Structured Data**: JSON responses with consistent response formats

### Configuration Options

- API key authentication
- Country code and TLD customization
- JavaScript rendering toggle
- Device type selection (desktop/mobile)

## Core Components

### ScraperAPIWebSearchProvider

The main provider class that extends `WebSearchProvider` from `@tokenring-ai/websearch`.

```typescript
import ScraperAPIWebSearchProvider from '@tokenring-ai/scraperapi';

const provider = new ScraperAPIWebSearchProvider({
  apiKey: 'your-api-key',
  countryCode: 'us',
  tld: 'com',
  render: false,
  deviceType: 'desktop'
});
```

**Constructor Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | Your ScraperAPI API key |
| `countryCode` | string | No | Two-letter ISO country code for geotargeting |
| `tld` | string | No | Google TLD (e.g., 'com', 'co.uk') |
| `render` | boolean | No | Enable JavaScript rendering |
| `deviceType` | 'desktop' \| 'mobile' | No | Device type for scraping |

**Public Methods:**

- `searchWeb(query, options?)` - Perform Google SERP search and return structured results
- `searchNews(query, options?)` - Perform Google News search and return structured results
- `fetchPage(url, options?)` - Fetch HTML page content and return as markdown

**Private Methods:**

- `googleSerp(query, opts?)` - Internal method for Google SERP searches
- `googleNews(query, opts?)` - Internal method for Google News searches
- `buildQuery(params)` - Build URL query parameters
- `createSerpEndpointURL(query, opts)` - Create Google SERP endpoint URL
- `createNewsEndpointURL(query, opts)` - Create Google News endpoint URL

## Services

### WebSearchService Integration

The `ScraperAPIWebSearchProvider` integrates with the `WebSearchService` from `@tokenring-ai/websearch` through the plugin system:

```typescript
// Plugin automatically registers the provider when configured
{
  websearch: {
    providers: {
      scraperapi: {
        type: "scraperapi",
        apiKey: process.env.SCRAPERAPI_KEY,
        countryCode: "us",
        tld: "com",
        render: false,
        deviceType: "desktop"
      }
    }
  }
}
```

The plugin uses `waitForService` to ensure the `WebSearchService` is available before registering providers:

```typescript
app.waitForService(WebSearchService, cdnService => {
  for (const name in config.websearch!.providers) {
    const provider = config.websearch!.providers[name];
    if (provider.type === "scraperapi") {
      cdnService.registerProvider(name, new ScraperAPIWebSearchProvider(
        ScraperAPIWebSearchProviderOptionsSchema.parse(provider)
      ));
    }
  }
});
```

## Provider Documentation

### ScraperAPIWebSearchProvider

The provider implements the `WebSearchProvider` interface and extends its functionality with ScraperAPI-specific features.

**Configuration Schema:**

```typescript
const ScraperAPIWebSearchProviderOptionsSchema = z.object({
  apiKey: z.string(),
  countryCode: z.string().optional(),
  tld: z.string().optional(),
  render: z.boolean().optional(),
  deviceType: z.enum(["desktop", "mobile"]).optional(),
});

export type ScraperAPIWebSearchProviderOptions = z.infer<typeof ScraperAPIWebSearchProviderOptionsSchema>;
```

**Interface Definition:**

```typescript
interface ScraperAPIWebSearchProviderOptions {
  apiKey: string;
  countryCode?: string;
  tld?: string;
  render?: boolean;
  deviceType?: 'desktop' | 'mobile';
}
```

### Response Types

#### WebSearchResult

Returned by `searchWeb()`:

```typescript
interface WebSearchResult {
  organic: Array<{
    position: number;
    title: string;
    snippet: string;
    highlights?: string[];
    link: string;
    displayed_link: string;
  }>;
  knowledgeGraph?: {
    position: number;
    title: string;
    imageUrl?: string;
    description: string;
  };
  relatedSearches?: Array<{
    query: string;
    position: number;
  }>;
}
```

#### NewsSearchResult

Returned by `searchNews()`:

```typescript
interface NewsSearchResult {
  news: Array<{
    source: string;
    thumbnail?: string;
    title: string;
    description: string;
    date: string;
    link: string;
  }>;
}
```

#### WebPageResult

Returned by `fetchPage()`:

```typescript
interface WebPageResult {
  markdown: string;
}
```

## RPC Endpoints

*No RPC endpoints defined for this package.*

## Chat Commands

*No chat commands defined for this package. The package provides a web search provider that integrates with the agent system through tools and services.*

## Configuration

### Prerequisites

1. Sign up for a ScraperAPI account at [scraperapi.com](https://www.scraperapi.com/)
2. Obtain your API key

### Package Configuration

Add the ScraperAPI configuration to your Token Ring configuration file:

```javascript
export default {
  websearch: {
    providers: {
      scraperapi: {
        type: "scraperapi",
        apiKey: process.env.SCRAPERAPI_KEY, // Required
        countryCode: "us",                  // Optional (e.g., 'us', 'gb', 'ca')
        tld: "com",                         // Optional (e.g., 'com', 'co.uk')
        render: false,                      // Optional (enable JS rendering)
        deviceType: "desktop",              // Optional ('desktop' or 'mobile')
      }
    }
  }
};
```

### Configuration Schema

The package uses Zod schema validation for configuration:

```typescript
const ScraperAPIWebSearchProviderOptionsSchema = z.object({
  apiKey: z.string(),                                    // Required
  countryCode: z.string().optional(),                    // Optional
  tld: z.string().optional(),                            // Optional
  render: z.boolean().optional(),                        // Optional
  deviceType: z.enum(["desktop", "mobile"]).optional(),  // Optional
});
```

## Integration

### Plugin Registration

The package is automatically registered through the Token Ring plugin system:

```typescript
import scraperapiPlugin from '@tokenring-ai/scraperapi';

app.registerPlugin(scraperapiPlugin, {
  websearch: {
    providers: {
      scraperapi: {
        type: "scraperapi",
        apiKey: process.env.SCRAPERAPI_KEY
      }
    }
  }
});
```

### Service Integration

The provider integrates with the `WebSearchService` from `@tokenring-ai/websearch`:

```typescript
import WebSearchService from '@tokenring-ai/websearch/WebSearchService';
import ScraperAPIWebSearchProvider from '@tokenring-ai/scraperapi';

// Access the web search service
const webSearchService = agent.requireServiceByType(WebSearchService);

// Register the provider programmatically
webSearchService.registerProvider('scraperapi', new ScraperAPIWebSearchProvider({
  apiKey: process.env.SCRAPERAPI_KEY,
  countryCode: 'us'
}));
```

### Tool and Command Integration

The web search provider can be used by agents through tools registered with the agent system:

```typescript
import { Tool } from '@tokenring-ai/agent';

// Example tool that uses the web search provider
const webSearchTool = new Tool({
  name: 'web_search',
  description: 'Search the web using ScraperAPI',
  parameters: z.object({
    query: z.string().describe('Search query'),
    options: z.object({
      countryCode: z.string().optional(),
      num: z.number().optional()
    }).optional()
  }),
  handler: async (args) => {
    const webSearchService = agent.requireServiceByType(WebSearchService);
    const provider = webSearchService.getProvider('scraperapi');
    return await provider.searchWeb(args.query, args.options);
  }
});
```

## Usage Examples

### Basic Usage

```typescript
import ScraperAPIWebSearchProvider from '@tokenring-ai/scraperapi';

// Initialize the provider
const provider = new ScraperAPIWebSearchProvider({
  apiKey: 'your-api-key',
  countryCode: 'us',
  tld: 'com',
  render: false,
  deviceType: 'desktop'
});

// Perform Google SERP search
const searchResults = await provider.searchWeb('cherry tomatoes', {
  countryCode: 'us'
});
console.log(searchResults.organic);
console.log(searchResults.knowledgeGraph);
console.log(searchResults.relatedSearches);

// Search Google News
const newsResults = await provider.searchNews('Space exploration', {
  countryCode: 'us',
  num: 10
});
console.log(newsResults.news);

// Fetch page content
const pageContent = await provider.fetchPage('https://example.com', {
  render: true,
  countryCode: 'gb'
});
console.log(pageContent.markdown);
```

### Advanced Usage with Parameters

The package supports comprehensive Google search parameters through the provider options and method-specific options:

```typescript
// Search with time filter
const recentResults = await provider.searchWeb('technology news', {
  countryCode: 'us'
});

// Search with result limit and pagination via googleSerp
const limitedResults = await provider['googleSerp']('AI research', {
  countryCode: 'us',
  num: 20,
  start: 10
});

// News search with time range
const weeklyNews = await provider.searchNews('climate change', {
  countryCode: 'us'
});

// Fetch page with JavaScript rendering
const renderedContent = await provider.fetchPage('https://example.com', {
  render: true,
  countryCode: 'gb'
});

// Search with location targeting via googleSerp
const localResults = await provider['googleSerp']('restaurants', {
  countryCode: 'us',
  uule: 'w+CAIQICINUGFyaXMsIEZyYW5jZQ'  // UULE parameter
});
```

### Error Handling

```typescript
import ScraperAPIWebSearchProvider from '@tokenring-ai/scraperapi';

const provider = new ScraperAPIWebSearchProvider({
  apiKey: 'your-api-key'
});

try {
  const results = await provider.searchWeb('query');
  console.log('Results:', results);
} catch (error) {
  console.error('Search failed:', error.message);
  console.error('Status code:', error.status);
  console.error('Hint:', error.hint);
  
  // Handle specific error cases
  if (error.status === 429) {
    console.log('Rate limit exceeded - consider upgrading your plan');
  } else if (error.status === 400) {
    console.log('Invalid parameters - check your request');
  }
}
```

## Best Practices

### API Key Management

- Use environment variables to store your ScraperAPI key
- Never commit API keys to version control
- Rotate API keys periodically for security

```typescript
// Recommended: Use environment variables
const provider = new ScraperAPIWebSearchProvider({
  apiKey: process.env.SCRAPERAPI_KEY
});
```

### Rate Limiting

- Implement caching for repeated queries
- Monitor your ScraperAPI usage through the dashboard
- Respect your plan's rate limits

```typescript
// Example: Simple caching implementation
const cache = new Map<string, any>();

async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  const results = await provider.searchWeb(query);
  cache.set(query, results);
  return results;
}
```

### Geotargeting

- Use appropriate country codes for targeted content
- Combine `countryCode` and `tld` parameters for precise targeting
- Test results across different regions for consistency

```typescript
// UK-specific search
const ukResults = await provider.searchWeb('weather', {
  countryCode: 'gb'
});

// Configure provider with default geotargeting
const ukProvider = new ScraperAPIWebSearchProvider({
  apiKey: 'your-api-key',
  countryCode: 'gb',
  tld: 'co.uk'
});
```

### Error Handling

- Implement retry logic for transient errors (429, 5xx)
- Log errors with context for debugging
- Handle rate limit exceeded errors gracefully

```typescript
// Retry logic example
async function searchWithRetry(query: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await provider.searchWeb(query);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}
```

### Performance Optimization

- Cache frequently accessed results
- Batch similar requests when possible
- Monitor and track usage metrics
- Use JavaScript rendering only when necessary

```typescript
// Only enable rendering when needed
const simpleContent = await provider.fetchPage('https://example.com/static-page');
const dynamicContent = await provider.fetchPage('https://example.com/app', {
  render: true  // Only when JS is required
});
```

## Testing

Run the test suite:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Testing Examples

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ScraperAPIWebSearchProvider from './ScraperAPIWebSearchProvider';

describe('ScraperAPIWebSearchProvider', () => {
  let provider: ScraperAPIWebSearchProvider;

  beforeEach(() => {
    provider = new ScraperAPIWebSearchProvider({
      apiKey: 'test-key',
      countryCode: 'us',
      tld: 'com'
    });
  });

  it('should have correct configuration', () => {
    expect(provider.config.apiKey).toBe('test-key');
    expect(provider.config.countryCode).toBe('us');
  });

  it('should validate configuration schema', () => {
    const schema = ScraperAPIWebSearchProviderOptionsSchema;
    const validConfig = schema.parse({
      apiKey: 'test-key',
      countryCode: 'us'
    });
    expect(validConfig).toBeDefined();
  });

  // Note: Actual API calls should be mocked in tests
  it('should search web correctly', async () => {
    // Mock the fetch implementation
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organic_results: [],
        search_information: { query_displayed: 'test' }
      })
    });

    const results = await provider.searchWeb('test query');
    expect(results.organic).toBeDefined();
  });

  it('should handle errors correctly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      text: async () => 'Error message'
    });

    await expect(provider.searchWeb('test query')).rejects.toThrow();
  });
});
```

## Dependencies

### Production Dependencies

```json
{
  "@tokenring-ai/app": "0.2.0",
  "zod": "^4.3.6",
  "@tokenring-ai/chat": "0.2.0",
  "@tokenring-ai/agent": "0.2.0",
  "@tokenring-ai/websearch": "0.2.0",
  "@tokenring-ai/utility": "0.2.0"
}
```

### Development Dependencies

```json
{
  "vitest": "^4.0.18",
  "typescript": "^5.9.3"
}
```

## Related Components

### Core Token Ring Packages

- `@tokenring-ai/websearch` - Core web search service and provider interface
- `@tokenring-ai/agent` - Agent framework for service integration
- `@tokenring-ai/app` - Application framework for plugin management
- `@tokenring-ai/utility` - Shared utilities including `doFetchWithRetry`

### Sub-packages and Modules

- `ScraperAPIWebSearchProvider.ts` - Main provider implementation
- `index.ts` - Package entry point with exports
- `plugin.ts` - Token Ring plugin integration

### External Services

- [ScraperAPI](https://www.scraperapi.com/) - Web scraping API service

## Google Search Parameters Reference

The package supports the following Google search parameters through ScraperAPI:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `countryCode` | Two-letter ISO country code for geotargeting | `us`, `gb`, `ca` |
| `tld` | Google domain TLD | `com`, `co.uk`, `ca` |
| `outputFormat` | Response format | `json`, `csv` |
| `uule` | Location targeting (UULE parameter) | `w+CAIQICINUGFyaXMsIEZyYW5jZQ` |
| `num` | Number of results | `10`, `20` |
| `hl` | Host language | `en`, `de` |
| `gl` | Country boost | `us`, `de` |
| `tbs` | Time-based filter | `d` (day), `w` (week), `m` (month), `y` (year) |
| `ie` | Input encoding | `UTF8` |
| `oe` | Output encoding | `UTF8` |
| `start` | Pagination offset | `0`, `10`, `20` |

### Time-Based Filters (tbs)

| Value | Description |
|-------|-------------|
| `qdr:d` | Past 24 hours |
| `qdr:w` | Past week |
| `qdr:m` | Past month |
| `qdr:y` | Past year |
| `w` | Past week (news) |
| `m` | Past month (news) |
| `y` | Past year (news) |

## Rate Limiting and Usage

- **ScraperAPI quotas**: Respects your plan's rate limits
- **429 handling**: Automatic retry with exponential backoff via `doFetchWithRetry`
- **Usage tracking**: Monitor your usage through ScraperAPI dashboard
- **Best practices**: Implement caching for repeated queries

## Ethical Considerations

- **Rate Limits**: Respect ScraperAPI's usage limits and quotas
- **Robots.txt**: The service automatically respects robots.txt directives
- **Frequency**: Avoid high-frequency scraping; implement caching where appropriate
- **Terms of Service**: Comply with ScraperAPI's terms of service and target websites' policies
- **Geographic Targeting**: Use appropriate country codes for targeted content

## Troubleshooting

### Common Issues

1. **Missing API Key**:
   ```typescript
   // Error: ScraperAPIWebSearchProvider requires apiKey
   // Solution: Ensure your configuration includes a valid apiKey
   ```

2. **Rate Limiting (429)**:
   ```typescript
   // Error: Rate limit exceeded
   // Solution: Check your ScraperAPI plan limits and implement caching
   ```

3. **Country Targeting**:
   ```typescript
   // Error: Unexpected results for targeted region
   // Solution: Verify country code and TLD combination
   ```

4. **JavaScript Rendering**:
   ```typescript
   // Issue: JS rendering consumes more credits
   // Solution: Only enable rendering when necessary
   ```

### Debug Information

Enable detailed logging to troubleshoot issues:

```typescript
// Check configuration validation
const validatedConfig = ScraperAPIWebSearchProviderOptionsSchema.parse(config);

// Monitor API responses
const response = await provider.searchWeb('test query');
console.log('Response status:', response);

// Log errors with context
try {
  await provider.searchWeb('test query');
} catch (error) {
  console.error('Error details:', {
    message: error.message,
    status: error.status,
    hint: error.hint
  });
}
```

## Package Structure

```
pkg/scraperapi/
├── index.ts                           # Package entry point
├── ScraperAPIWebSearchProvider.ts     # Main provider implementation
├── plugin.ts                          # Token Ring plugin integration
├── package.json                       # Package metadata and dependencies
├── README.md                          # Package documentation
├── vitest.config.ts                   # Vitest configuration
└── design/                            # Design documentation
    ├── implementation.md              # Implementation design
    ├── endpoint_docs.md               # ScraperAPI endpoint documentation
    ├── google_serp.md                 # Google SERP API documentation
    └── google_news.md                 # Google News API documentation
```

## Version History

### v0.2.0

- Initial release with ScraperAPI integration
- Support for Google SERP, Google News, and HTML fetching
- Provider-based architecture with Token Ring web search service
- Zod schema validation for configuration
- Comprehensive error handling with retry logic

## Migration Guide

### From v0.1.x to v0.2.0

- Provider registration now uses the `websearch.providers` configuration structure
- The `type` field is required when registering the provider
- Configuration schema validation is now enforced via Zod schemas
- Error responses now include status codes and hints for better debugging

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
