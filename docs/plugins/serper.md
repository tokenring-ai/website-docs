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

## Core Components

### SerperWebSearchProvider Class

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

### Environment Variables

- `SERPER_API_KEY`: Your Serper.dev API key

## Plugin Integration

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

### Advanced Configuration

```typescript
const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: {
    gl: 'us',
    hl: 'en',
    location: 'San Francisco,California,United States',
    num: 20,
    page: 1
  }
});

// Search with additional parameters
const results = await provider.searchWeb('machine learning', {
  countryCode: 'us',
  language: 'en',
  num: 10,
  // Serper-specific options
  autocorrect: true
});
```

### Integration with Token Ring Agents

```typescript
import TokenRingApp from '@tokenring-ai/app';
import SerperWebSearchProvider from '@tokenring-ai/serper';

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
```

## API Reference

### Types

##### SerperSearchResponse

```typescript
{
  searchParameters: SerperSearchParameters;
  knowledgeGraph?: SerperKnowledgeGraph;
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
}
```

##### SerperNewsResponse

```typescript
{
  searchParameters: SerperSearchParameters;
  news: SerperNewsResult[];
  credits?: number;
}
```

##### SerperPageResponse

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

### Result Types

##### SerperKnowledgeGraph

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

##### SerperSitelink

```typescript
{
  title: string;
  link: string;
}
```

##### SerperOrganicResult

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

##### SerperPeopleAlsoAsk

```typescript
{
  question: string;
  snippet: string;
  title: string;
  link: string;
}
```

##### SerperRelatedSearch

```typescript
{
  query: string;
}
```

##### SerperNewsResult

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

## Error Handling

The package provides comprehensive error handling with helpful hints:

```typescript
try {
  const results = await provider.searchWeb('query');
} catch (error) {
  if (error.status === 401) {
    console.log('Invalid API key - check SERPER_API_KEY');
  } else if (error.status === 429) {
    console.log('Rate limit exceeded - reduce request frequency');
  } else {
    console.log('Search failed:', error.message);
  }
}
```

## Rate Limits and Credits

- **Credit Tracking**: The raw Serper API response includes a `credits` field for news searches, but this is filtered out in the returned `NewsSearchResult` from `searchNews`. Similarly, for `fetchPage`, the `credits` field is not included in the returned `WebPageResult`.
- **Rate Limiting**: Automatic retries with exponential backoff for 429 and 5xx errors.
- **Error Hints**: Clear messages for common issues such as invalid API key (401) or rate limits (429).

## Development

### Testing

```bash
bun run test
```

### Building

The package uses ES modules and requires no build step for development.

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

## Related Packages

- `@tokenring-ai/websearch`: Abstract web search provider interface
- `@tokenring-ai/agent`: Agent orchestration system
- `@tokenring-ai/utility`: HTTP utilities and retry logic

--- 

*Part of the Token Ring AI monorepo - building the future of AI-powered development tools.*