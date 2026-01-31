# Serper Web Search Plugin

## Overview

The Serper plugin provides seamless integration with Serper.dev's Google Search and News APIs, enabling Token Ring agents and applications to perform real-time web searches, fetch news articles, and extract web page content without direct Google API integration.

### Key Features

- **Google Search Integration**: Perform organic web searches with knowledge graphs, related searches, and people also ask results
- **Google News Search**: Access real-time news articles with source, date, and snippet information
- **Web Page Fetching**: Extract HTML content and markdown from web pages using Serper's scraping service
- **Location-Based Search**: Support for geographic targeting through `gl` and `location` parameters
- **Language Support**: Multi-language search capabilities through `hl` parameter
- **Automatic Plugin Registration**: Integrates automatically with Token Ring applications
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Error Handling**: Comprehensive error handling with helpful hints for common issues

## Installation

```bash
bun install @tokenring-ai/serper
```

## Usage Examples

### Basic Web Search

```typescript
import SerperWebSearchProvider from '@tokenring-ai/serper';

const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: {
    gl: 'us',
    hl: 'en',
    num: 10
  }
});

// Perform a web search
const results = await provider.searchWeb('Token Ring AI framework');
console.log('Organic results:', results.organic.length);

// Access different result types
if (results.knowledgeGraph) {
  console.log('Knowledge Graph:', results.knowledgeGraph.title);
}

if (results.peopleAlsoAsk) {
  console.log('People also ask:', results.peopleAlsoAsk.length);
}

if (results.relatedSearches) {
  console.log('Related searches:', results.relatedSearches.map(r => r.query));
}
```

### News Search

```typescript
// Search for recent news
const news = await provider.searchNews('artificial intelligence breakthroughs', {
  countryCode: 'us',
  num: 5,
  page: 1
});

news.news.forEach(article => {
  console.log(`Title: ${article.title}`);
  console.log(`Source: ${article.source}`);
  console.log(`Date: ${article.date}`);
  console.log(`Snippet: ${article.snippet}`);
  console.log(`Link: ${article.link}`);
});
```

### Web Page Fetching

```typescript
// Fetch and extract content from a webpage
const page = await provider.fetchPage('https://tokenring.ai', {
  timeout: 10000
});

console.log('Page title:', page.metadata.title);
console.log('Description:', page.metadata.description);
console.log('Markdown content:', page.markdown.substring(0, 200) + '...');
```

### Integration with Token Ring Agents

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp({
  websearch: {
    providers: {
      serper: {
        type: 'serper',
        apiKey: process.env.SERPER_API_KEY!,
        defaults: {
          gl: 'us',
          hl: 'en'
        }
      }
    }
  }
});

// Access the provider through the websearch service
const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'serper');
```

## Core Properties

### SerperWebSearchProvider

The main provider class that extends `WebSearchProvider` from `@tokenring-ai/websearch`.

#### Constructor

```typescript
constructor(config: SerperWebSearchProviderOptions)
```

**Parameters:**
- `apiKey` (required): Your Serper.dev API key
- `defaults` (optional): Default search parameters including:
  - `gl`: Country code (e.g., 'us', 'uk')
  - `hl`: Language code (e.g., 'en', 'fr')
  - `location`: Geographic location (e.g., 'Austin,Texas,United States')
  - `num`: Number of results per page (1-100, default 10)
  - `page`: Starting page number (default 1)

#### Methods

##### `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`

Performs a Google web search and returns organic results, knowledge graphs, related searches, and people also ask results. Supports Serper-specific parameters such as `autocorrect` and `extraParams` for additional search options.

**Example:**

```typescript
// Search with autocorrect and other parameters
const results = await provider.searchWeb('machine learning', {
  countryCode: 'us',
  language: 'en',
  num: 10,
  autocorrect: true,
  extraParams: { gl: 'uk' } // Override country code for this query
});
```

##### `searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>`

Performs a Google News search and returns recent news articles limited to the last hour by default. The date range can be adjusted using the `extraParams` parameter (e.g., `tbs` for custom date ranges).

**Example:**

```typescript
// Search for news within a specific date range
const news = await provider.searchNews('artificial intelligence breakthroughs', {
  extraParams: { tbs: 'qdr:d' }, // Last day
  countryCode: 'us',
  num: 5,
  page: 1
});
```

##### `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`

Fetches and extracts content from a web page using Serper's scraping service. The returned `WebPageResult` includes only `markdown` and `metadata` properties; `credits` from the raw API response are filtered out.

**Example:**

```typescript
// Fetch and extract content from a webpage
const page = await provider.fetchPage('https://tokenring.ai', {
  timeout: 10000
});

console.log('Page title:', page.metadata.title);
console.log('Description:', page.metadata.description);
console.log('Markdown content:', page.markdown.substring(0, 200) + '...');
```

## Key Features

- **Google Search Integration**: Perform organic web searches with knowledge graphs, related searches, and people also ask results
- **Google News Search**: Access real-time news articles with source, date, and snippet information
- **Web Page Fetching**: Extract HTML content and markdown from web pages using Serper's scraping service
- **Location-Based Search**: Support for geographic targeting through `gl` and `location` parameters
- **Language Support**: Multi-language search capabilities through `hl` parameter
- **Automatic Plugin Registration**: Integrates automatically with Token Ring applications
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Error Handling**: Comprehensive error handling with helpful hints for common issues

## Core Methods/API

### SerperWebSearchProvider Methods

#### `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`

Performs a Google web search and returns organic results, knowledge graphs, related searches, and people also ask results.

**Parameters:**
- `query` (required): Search query string
- `options` (optional): Search options including `countryCode`, `language`, `location`, `num`, `page`

**Returns:** `Promise<WebSearchResult>` containing organic results, knowledge graph, people also ask questions, and related searches

#### `searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>`

Performs a Google News search and returns recent news articles.

**Parameters:**
- `query` (required): News search query string
- `options` (optional): Search options including `countryCode`, `language`, `location`, `num`, `page`

**Returns:** `Promise<NewsSearchResult>` containing array of news articles

**Note:** The news search includes a hardcoded date filter for the last hour (`tbs: "qdr:h"`). Future versions may make this parameter configurable.

#### `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`

Fetches and extracts content from a web page using Serper's scraping service.

**Parameters:**
- `url` (required): URL of the webpage to fetch
- `options` (optional): Fetch options including `timeout` (in milliseconds)

**Endpoint:** `POST https://scrape.serper.dev`

**Returns:** `Promise<WebPageResult>` containing markdown content and metadata

## Configuration

### Provider Options

```typescript
interface SerperWebSearchProviderOptions {
  apiKey: string;
  defaults?: {
    gl?: string;        // Country code
    hl?: string;        // Language code
    location?: string;  // Geographic location
    num?: number;       // Results per page
    page?: number;      // Starting page
  };
}
```

### Search Options

```typescript
interface SerperSearchOptions {
  gl?: string;          // Country code
  hl?: string;          // Language code
  location?: string;    // Geographic location
  num?: number;         // Results per page (1-100)
  page?: number;        // Starting page number
  autocorrect?: boolean; // Enable autocorrection
  type?: "search";      // Fixed as "search"
  extraParams?: Record<string, string | number | boolean>; // Additional parameters
}

interface SerperNewsOptions {
  gl?: string;          // Country code
  location?: string;    // Geographic location
  num?: number;         // Results per page
  page?: number;        // Starting page number
  type?: "news";        // Fixed as "news"
  extraParams?: Record<string, string | number | boolean>; // Additional parameters
}
```

### Plugin Configuration

```typescript
import {z} from 'zod';

export const SerperPluginConfigSchema = z.object({
  websearch: z.object({
    providers: z.record(z.object({
      type: z.literal('serper'),
      apiKey: z.string(),
      defaults: SerperDefaultsSchema.optional(),
    })),
  }).optional(),
});

export const SerperDefaultsSchema = z.object({
  gl: z.string().optional(),
  hl: z.string().optional(),
  location: z.string().optional(),
  num: z.number().optional(),
  page: z.number().optional(),
});
```

### Configuration Example

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp({
  websearch: {
    providers: {
      serper: {
        type: 'serper',
        apiKey: process.env.SERPER_API_KEY!,
        defaults: {
          gl: 'us',
          hl: 'en',
          num: 10
        }
      }
    }
  }
});
```

### Environment Variables

- `SERPER_API_KEY`: Your Serper.dev API key

## Integration

### Token Ring Plugin Integration

The package includes automatic plugin integration with Token Ring applications:

```typescript
import SerperPlugin from '@tokenring-ai/serper/plugin';

// Automatically registers with Token Ring app
// when included in the application configuration
```

The plugin automatically:
- Validates configuration using Zod schemas
- Registers the provider with the websearch service
- Handles provider initialization and error scenarios

### Service Registration

```typescript
import SerperWebSearchProvider from '@tokenring-ai/serper';

// Create provider instance
const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: {
    gl: 'us',
    hl: 'en'
  }
});

// Register with websearch service
cdnService.registerProvider('serper', provider);
```

## Best Practices

### Error Handling

The package provides comprehensive error handling with helpful hints:

```typescript
try {
  const results = await provider.searchWeb('query');
} catch (error) {
  if (error instanceof Error) {
    if (error.status === 401) {
      console.log('Invalid API key - check SERPER_API_KEY');
    } else if (error.status === 429) {
      console.log('Rate limit exceeded - reduce request frequency');
    } else {
      console.log('Search failed:', error.message);
      if (error.hint) {
        console.log('Hint:', error.hint);
      }
      if (error.details) {
        console.log('Details:', error.details.slice(0, 500));
      }
    }
  }
}
```

### Error Object Structure

Error responses include:
- `status`: HTTP status code (400, 401, 429, etc.)
- `message`: Human-readable error message
- `hint`: Suggestion for resolving the error (optional)
- `details`: Raw response snippet (optional)

Common error responses:
- **401**: Invalid API key - check SERPER_API_KEY
- **429**: Rate limit exceeded - reduce request frequency
- **400**: Invalid request parameters (missing required fields)

### Rate Limits and Credits

- **Credit Tracking**: The raw Serper API response includes a `credits` field for news searches, but this is filtered out in the returned `NewsSearchResult` from `searchNews`. Similarly, for `fetchPage`, the `credits` field is not included in the returned `WebPageResult`.
- **Rate Limiting**: Automatic retries with exponential backoff for 429 and 5xx errors.
- **Error Hints**: Clear messages for common issues such as invalid API key (401) or rate limits (429).

### Usage Recommendations

1. **Always validate API key**: Ensure your Serper API key is properly configured before making requests
2. **Handle errors gracefully**: Use try-catch blocks to handle potential errors and check status codes
3. **Respect rate limits**: Monitor your API usage and reduce request frequency if you encounter rate limit errors
4. **Use appropriate parameters**: Set appropriate `gl`, `hl`, `num`, and `page` parameters based on your use case
5. **Monitor credits**: The API provides credit information for news searches, though it's not included in the returned results

## Testing

### Testing Setup

The package uses vitest for unit testing:

```bash
bun run test
bun run test:coverage
```

### Testing Examples

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SerperWebSearchProvider from './SerperWebSearchProvider';

describe('SerperWebSearchProvider', () => {
  let provider: SerperWebSearchProvider;

  beforeEach(() => {
    provider = new SerperWebSearchProvider({
      apiKey: 'test-api-key',
    });
  });

  it('should be created with valid apiKey', () => {
    expect(provider).toBeDefined();
  });

  it('should throw error without apiKey', () => {
    expect(() => {
      new SerperWebSearchProvider({ apiKey: '' });
    }).toThrow('SerperWebSearchProvider requires apiKey');
  });
});
```

### Build and Development

The package uses ES modules and requires no build step for development:

```bash
bun run build
```

## Related Components

### Dependencies

- `@tokenring-ai/app`: Application framework for plugin integration
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/websearch`: Abstract web search provider interface
- `@tokenring-ai/utility`: HTTP utilities and retry logic
- `zod`: Runtime type validation

### Related Packages

- `@tokenring-ai/websearch`: Base web search provider interface and abstract classes
- `@tokenring-ai/agent`: Agent orchestration system
- `@tokenring-ai/utility`: Utility functions (pick, doFetchWithRetry)

### API Reference

#### SerperSearchResponse

```typescript
{
  searchParameters: SerperSearchParameters;
  knowledgeGraph?: SerperKnowledgeGraph;
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
}
```

#### SerperNewsResponse

```typescript
{
  searchParameters: SerperSearchParameters;
  news: SerperNewsResult[];
  credits?: number;
}
```

#### SerperPageResponse

```typescript
{
  text: string;
  markdown: string;
  metadata: {
    title?: string;
    description?: string;
    "og:title"?: string;
    "og:description"?: string;
    "og:url"?: string;
    "og:image"?: string;
    "og:type"?: string;
    "og:site_name"?: string;
    [key: string]: any;
  };
  credits?: number;
}
```

#### SerperKnowledgeGraph

```typescript
{
  title: string;
  type: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record<string, string>;
}
```

#### SerperSitelink

```typescript
{
  title: string;
  link: string;
}
```

#### SerperOrganicResult

```typescript
{
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position: number;
  attributes?: Record<string, string>;
  sitelinks?: SerperSitelink[];
}
```

#### SerperPeopleAlsoAsk

```typescript
{
  question: string;
  snippet: string;
  title: string;
  link: string;
}
```

#### SerperRelatedSearch

```typescript
{
  query: string;
}
```

#### SerperNewsResult

```typescript
{
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  position: number;
}
```

## Limitations

- Relies on Serper.dev quotas and rate limits
- Only supports text/HTML content (no binary content)
- Web page fetching limited to Serper's scraping capabilities
- News search includes automatic date filtering (`tbs="qdr:h"`)

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request with comprehensive documentation

---

*Part of the Token Ring AI monorepo - building the future of AI-powered development tools.*
