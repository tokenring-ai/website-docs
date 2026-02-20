# ScraperAPI Plugin

Web scraping integration via ScraperAPI for structured Google SERP, Google News, and HTML fetching with geotargeting capabilities.

## Overview

The `@tokenring-ai/scraperapi` package provides a ScraperAPI-based web search provider that integrates with the Token Ring AI platform. It enables AI agents and applications to perform web searches, fetch structured Google Search Engine Results Pages (SERP), retrieve Google News articles, and scrape web pages through a unified interface.

This package extends the `WebSearchProvider` from `@tokenring-ai/websearch`, offering:

- **Google SERP Search**: Structured search results with organic listings, knowledge graphs, and related questions
- **Google News Search**: Structured news articles with sources, thumbnails, dates, and links
- **HTML Fetching**: Retrieve page content with optional JavaScript rendering and geotargeting
- **Error Handling**: Robust error management with retry logic via `doFetchWithRetry`
- **Geotargeting**: Support for country-specific searches and custom TLDs
- **Plugin Integration**: Automatic registration with Token Ring applications

## Key Features

### Core Capabilities

- **Web Scraping**: Fetch HTML content from any URL with optional rendering
- **Google Search**: Perform structured searches with comprehensive parameter support
- **Google News**: Retrieve news articles with metadata and thumbnails
- **Geotargeting**: Country-specific searches with support for multiple Google TLDs
- **Pagination**: Support for result pagination and continuation
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

**Methods:**

- `searchWeb(query, options?)` - Perform Google SERP search
- `searchNews(query, options?)` - Perform Google News search
- `fetchPage(url, options?)` - Fetch HTML page content

## Services

### Provider Integration

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

## RPC Endpoints

*No RPC endpoints defined for this package.*

## Chat Commands

*No chat commands defined for this package. The package provides a web search provider that integrates with the agent system through tools and services.*

## Configuration

### Prerequisites

1. Sign up for a ScraperAPI account at [scraperapi.com](https://www.scraperapi.com/)
2. Obtain your API key

### Package Configuration

Add the ScraperAPI configuration to your Token Ring configuration file (e.g., `.tokenring/writer-config.js`):

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

### Google Search Parameters

The package supports comprehensive Google search parameters:

```typescript
// Search with time filter
const recentResults = await provider.searchWeb('technology news', {
  countryCode: 'us',
  gl: 'us'
});

// Search with result limit and pagination
const limitedResults = await provider.searchWeb('AI research', {
  countryCode: 'us',
  num: 20,
  start: 10
});

// News search with time range
const weeklyNews = await provider.searchNews('climate change', {
  countryCode: 'us',
  tbs: 'w'  // Past week
});

// Fetch page with JavaScript rendering
const renderedContent = await provider.fetchPage('https://example.com', {
  render: true,
  countryCode: 'gb'
});
```

## Best Practices

### API Key Management

- Use environment variables to store your ScraperAPI key
- Never commit API keys to version control
- Rotate API keys periodically for security

### Rate Limiting

- Implement caching for repeated queries
- Monitor your ScraperAPI usage through the dashboard
- Respect your plan's rate limits

### Geotargeting

- Use appropriate country codes for targeted content
- Combine `countryCode` and `tld` parameters for precise targeting
- Test results across different regions for consistency

### Error Handling

- Implement retry logic for transient errors (429, 5xx)
- Log errors with context for debugging
- Handle rate limit exceeded errors gracefully

### Performance Optimization

- Cache frequently accessed results
- Batch similar requests when possible
- Monitor and track usage metrics
- Use JavaScript rendering only when necessary

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

  it('should search web correctly', async () => {
    const results = await provider.searchWeb('test query');
    expect(results.organic).toBeInstanceOf(Array);
  });

  it('should search news correctly', async () => {
    const results = await provider.searchNews('test query');
    expect(results.news).toBeInstanceOf(Array);
  });

  it('should fetch page content correctly', async () => {
    const content = await provider.fetchPage('https://example.com');
    expect(content.markdown).toBeDefined();
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

- `@tokenring-ai/websearch` - Core web search service and provider interface
- `@tokenring-ai/agent` - Agent framework for service integration
- `@tokenring-ai/app` - Application framework for plugin management
- `@tokenring-ai/utility` - Shared utilities including `doFetchWithRetry`

### Sub-packages and Modules

- `ScraperAPIWebSearchProvider.ts` - Main provider implementation
- `index.ts` - Package entry point with exports

## Migration Guide

### From v0.1.x to v0.2.0

- Provider registration now uses the `websearch.providers` configuration structure
- The `type` field is required when registering the provider
- Configuration schema validation is now enforced via Zod schemas

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
```

## Package Structure

```
pkg/scraperapi/
├── index.ts                           # Package entry point
├── ScraperAPIWebSearchProvider.ts     # Main provider implementation
├── plugin.ts                          # Token Ring plugin integration
├── package.json                       # Package metadata and dependencies
└── vitest.config.ts                   # Vitest configuration
```

## Version History

### v0.2.0

- Initial release with ScraperAPI integration
- Support for Google SERP, Google News, and HTML fetching
- Provider-based architecture with Token Ring web search service

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.

END FILE ATTACHMENT