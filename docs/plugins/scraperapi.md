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

## Installation

This package is part of the Token Ring AI monorepo. To use it:

```bash
# Install dependencies
bun install
```

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

## Usage

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

## API Reference

### ScraperAPIWebSearchProvider

The main provider class that extends `WebSearchProvider`.

#### Constructor

```typescript
new ScraperAPIWebSearchProvider(config: ScraperAPIWebSearchProviderOptions)
```

**Parameters:**
- `apiKey` (string, required): Your ScraperAPI API key
- `countryCode` (string, optional): Two-letter ISO country code for geotargeting
- `tld` (string, optional): Google TLD (e.g., 'com', 'co.uk')
- `render` (boolean, optional): Enable JavaScript rendering
- `deviceType` (string, optional): Device type ('desktop' or 'mobile')

#### Methods

##### searchWeb

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>
```

Performs a Google SERP search and returns structured results.

**Parameters:**
- `query` (string): Search query
- `options` (WebSearchProviderOptions, optional): Search options

**Returns:** `WebSearchResult` containing:
- `organic`: Array of organic search results
- `knowledgeGraph`: Knowledge graph information (if available)
- `relatedSearches`: Array of related search queries

##### searchNews

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>
```

Performs a Google News search and returns structured results.

**Parameters:**
- `query` (string): Search query
- `options` (WebSearchProviderOptions, optional): Search options

**Returns:** `NewsSearchResult` containing:
- `news`: Array of news articles with source, title, description, date, and link

##### fetchPage

```typescript
async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>
```

Fetches HTML content from a URL using ScraperAPI.

**Parameters:**
- `url` (string): URL to fetch
- `options` (WebPageOptions, optional): Fetch options

**Returns:** `WebPageResult` containing:
- `markdown`: Page content in markdown format

## Response Types

### Google SERP Response

```typescript
interface GoogleSerpResponse {
  search_information: {
    query_displayed: string;
    total_results?: number;
    time_taken_displayed?: number;
  };
  knowledge_graph?: {
    position: number;
    title: string;
    image?: string;
    description: string;
  };
  organic_results: Array<{
    position: number;
    title: string;
    snippet: string;
    highlights?: string[];
    link: string;
    displayed_link: string;
  }>;
  related_questions?: Array<{
    question: string;
    position: number;
  }>;
  videos?: Array<{
    position: number;
    link: string;
    title: string;
    source: string;
    channel: string;
    publish_date: string;
    thumbnail: string;
    duration: string;
  }>;
  pagination: {
    pages_count: number;
    current_page: number;
    next_page_url?: string;
    prev_page_url?: string;
    pages: Array<{
      page: number;
      url: string;
    }>;
  };
}
```

### Google News Response

```typescript
interface GoogleNewsResponse {
  search_information: {
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
  };
  articles: Array<{
    source: string;
    thumbnail?: string;
    title: string;
    description: string;
    date: string;
    link: string;
  }>;
  pagination: {
    pagesCount: number;
    currentPage: number;
    nextPageUrl?: string;
    prevPageUrl?: string;
    pages: Array<{
      page: number;
      url: string;
    }>;
  };
}
```

## Error Handling

The package provides standardized error handling with detailed error information:

```typescript
try {
  const results = await provider.searchWeb('query');
} catch (error) {
  console.error('Search failed:', error.message);
  console.error('Status code:', error.status);
  console.error('Hint:', error.hint);
  // Handle specific error cases
  if (error.status === 429) {
    console.log('Rate limit exceeded - consider upgrading your plan');
  }
}
```

**Error Types:**
- **400**: Missing required parameters (url, query, apiKey)
- **429**: Rate limit exceeded
- **5xx**: Server errors from ScraperAPI

## Plugin Integration

The package includes automatic plugin integration:

```typescript
// plugin.ts
import { TokenRingPlugin } from '@tokenring-ai/app';
import { WebSearchConfigSchema, WebSearchService } from '@tokenring-ai/websearch';
import { z } from 'zod';
import packageJSON from './package.json' with { type: 'json' };
import ScraperAPIWebSearchProvider, { ScraperAPIWebSearchProviderOptionsSchema } from './ScraperAPIWebSearchProvider.ts';

const packageConfigSchema = z.object({
  websearch: WebSearchConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.websearch) {
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
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Runtime Dependencies

```json
{
  "@tokenring-ai/app": "0.2.0",
  "@tokenring-ai/chat": "0.2.0",
  "@tokenring-ai/agent": "0.2.0",
  "@tokenring-ai/websearch": "0.2.0",
  "@tokenring-ai/utility": "0.2.0"
}
```

### Development Dependencies

- `vitest`: Testing framework
- `typescript`: Type checking

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

## Package Structure

```
pkg/scraperapi/
├── index.ts                           # Package entry point
├── ScraperAPIWebSearchProvider.ts     # Main provider implementation
├── plugin.ts                          # Token Ring plugin integration
├── package.json                       # Package metadata and dependencies
└── README.md                          # This documentation
```

## Rate Limiting and Usage

- **ScraperAPI quotas**: Respects your plan's rate limits
- **429 handling**: Automatic retry with exponential backoff
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
   if (!config?.apiKey) throw new Error("ScraperAPIWebSearchProvider requires apiKey");
   ```

2. **Rate Limiting (429)**:
   ```typescript
   // Check your ScraperAPI plan limits
   // Consider implementing caching
   ```

3. **Country Targeting**:
   ```typescript
   // Verify country code is supported
   // Use both countryCode and tld parameters
   ```

4. **JavaScript Rendering**:
   ```typescript
   // JS rendering consumes more credits
   // Only enable when necessary
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

### Performance Optimization

- **Caching**: Implement result caching for repeated queries
- **Batch Processing**: Group similar requests when possible
- **Monitoring**: Track usage and performance metrics
- **Error Handling**: Implement proper error recovery strategies

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Add tests for new functionality (`bun test`)
4. Ensure all tests pass (`bun run test:coverage`)
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Include comprehensive tests for new features
- Update documentation for API changes
- Respect semantic versioning (major.minor.patch)
- Use proper error handling patterns
- Add JSDoc comments for all public APIs

### Code Style

- Use consistent naming conventions
- Implement proper error handling
- Follow existing patterns for plugin integration
- Use Zod schemas for configuration validation
- Include proper TypeScript types
- Add comprehensive documentation

## Support

For issues related to:

- **ScraperAPI service**: Refer to [ScraperAPI documentation](https://www.scraperapi.com/documentation/)
- **Token Ring integration**: Check the main Token Ring repository
- **Package bugs**: Open an issue in this repository
- **Feature requests**: Submit a pull request or issue

### Getting Help

1. Check the troubleshooting section above
2. Review the design documents in `design/`
3. Examine test files for usage examples
4. Open an issue with detailed error information

---

**Version**: 0.2.0
**License**: MIT
**Maintainers**: Token Ring AI Team
