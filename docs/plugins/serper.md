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

##### searchWeb(query: string, options?: WebSearchProviderOptions): Promise&lt;WebSearchResult&gt;

Performs a Google web search and returns organic results, knowledge graphs, related searches, and people also ask results. Supports Serper-specific parameters such as `autocorrect` and `extraParams` for additional search options.

**Example:**
```typescript
// Search with autocorrect and other parameters
const results = await provider.searchWeb('machine learning', &#123;
  countryCode: 'us',
  language: 'en',
  num: 10,
  autocorrect: true,
  extraParams: &#123; gl: 'uk' &#125; // Override country code for this query
&#125;);
```

##### searchNews(query: string, options?: WebSearchProviderOptions): Promise&lt;NewsSearchResult&gt;

Performs a Google News search and returns recent news articles limited to the last hour by default. The date range can be adjusted using the `extraParams` parameter (e.g., `tbs` for custom date ranges).

**Example:**
```typescript
// Search for news within a specific date range
const news = await provider.searchNews('artificial intelligence breakthroughs', &#123;
  extraParams: &#123; tbs: 'qdr:d' &#125;, // Last day
  countryCode: 'us',
  num: 5,
  page: 1
&#125;);
```

##### fetchPage(url: string, options?: WebPageOptions): Promise&lt;WebPageResult&gt;

Fetches and extracts content from a web page using Serper's scraping service. The returned `WebPageResult` includes only `markdown` and `metadata` properties; `credits` from the raw API response are filtered out.

**Example:**
```typescript
// Fetch and extract content from a webpage
const page = await provider.fetchPage('https://tokenring.ai', &#123;
  timeout: 10000
&#125;);

console.log('Page title:', page.metadata.title);
console.log('Description:', page.metadata.description);
console.log('Markdown content:', page.markdown.substring(0, 200) + '...');
```

## Configuration

### Provider Options

```typescript
interface SerperWebSearchProviderOptions &#123;
  apiKey: string;
  defaults?: &#123;
    gl?: string;        // Country code
    hl?: string;        // Language code  
    location?: string;  // Geographic location
    num?: number;       // Results per page
    page?: number;      // Starting page
  &#125;;
&#125;
```

### Search Options

```typescript
interface SerperSearchOptions &#123;
  gl?: string;          // Country code
  hl?: string;          // Language code
  location?: string;    // Geographic location
  num?: number;         // Results per page (1-100)
  page?: number;        // Starting page number
  autocorrect?: boolean; // Enable autocorrection
  type?: "search";      // Fixed as "search"
  extraParams?: Record&lt;string, string | number | boolean&gt;; // Additional parameters
&#125;

interface SerperNewsOptions &#123;
  gl?: string;          // Country code
  location?: string;    // Geographic location
  num?: number;         // Results per page
  page?: number;        // Starting page number
  type?: "news";        // Fixed as "news"
  extraParams?: Record&lt;string, string | number | boolean&gt;; // Additional parameters
&#125;
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

const provider = new SerperWebSearchProvider(&#123;
  apiKey: process.env.SERPER_API_KEY!,
  defaults: &#123; 
    gl: 'us', 
    hl: 'en', 
    num: 10 
  &#125;
&#125;);

// Perform a web search
const results = await provider.searchWeb('Token Ring AI framework');
console.log('Organic results:', results.organic.length);

// Access different result types
if (results.knowledgeGraph) &#123;
  console.log('Knowledge Graph:', results.knowledgeGraph.title);
&#125;

if (results.relatedSearches) &#123;
  console.log('Related searches:', results.relatedSearches.map(r =&gt; r.query));
&#125;
```

### News Search

```typescript
// Search for recent news
const news = await provider.searchNews('artificial intelligence breakthroughs', &#123;
  countryCode: 'us',
  num: 5,
  page: 1
&#125;);

news.news.forEach(article =&gt; &#123;
  console.log(`Title: $&#123;article.title&#125;`);
  console.log(`Source: $&#123;article.source&#125;`);
  console.log(`Date: $&#123;article.date&#125;`);
  console.log(`Snippet: $&#123;article.snippet&#125;`);
  console.log(`Link: $&#123;article.link&#125;`);
&#125;);
```

### Web Page Fetching

```typescript
// Fetch and extract content from a webpage
const page = await provider.fetchPage('https://tokenring.ai', &#123;
  timeout: 10000
&#125;);

console.log('Page title:', page.metadata.title);
console.log('Description:', page.metadata.description);
console.log('Markdown content:', page.markdown.substring(0, 200) + '...');
```

### Advanced Configuration

```typescript
const provider = new SerperWebSearchProvider(&#123;
  apiKey: process.env.SERPER_API_KEY!,
  defaults: &#123;
    gl: 'us',
    hl: 'en',
    location: 'San Francisco,California,United States',
    num: 20,
    page: 1
  &#125;
&#125;);

// Search with additional parameters
const results = await provider.searchWeb('machine learning', &#123;
  countryCode: 'us',
  language: 'en',
  num: 10,
  // Serper-specific options
  autocorrect: true
&#125;);
```

### Integration with Token Ring Agents

```typescript
import TokenRingApp from '@tokenring-ai/app';
import SerperWebSearchProvider from '@tokenring-ai/serper';

const app = new TokenRingApp(&#123;
  websearch: &#123;
    providers: &#123;
      serper: &#123;
        type: 'serper',
        apiKey: process.env.SERPER_API_KEY!,
        defaults: &#123;
          gl: 'us',
          hl: 'en'
        &#125;
      &#125;
    &#125;
  &#125;
&#125;);
```

## API Reference

### Types

##### SerperSearchResponse

```typescript
&#123;
  searchParameters: SerperSearchParameters;
  knowledgeGraph?: SerperKnowledgeGraph;
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
&#125;
```

##### SerperNewsResponse

```typescript
&#123;
  searchParameters: SerperSearchParameters;
  news: SerperNewsResult[];
  credits?: number;
&#125;
```

##### SerperPageResponse

```typescript
&#123;
  text: string;
  markdown: string;
  metadata: &#123;
    title?: string;
    description?: string;
    "og:title"?: string;
    "og:description"?: string;
    "og:url"?: string;
    "og:image"?: string;
    "og:type"?: string;
    "og:site_name"?: string;
    [key: string]: any;
  &#125;;
  credits?: number;
&#125;
```

### Result Types

##### SerperKnowledgeGraph

```typescript
&#123;
  title: string;
  type: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record&lt;string, string&gt;;
&#125;
```

##### SerperSitelink

```typescript
&#123;
  title: string;
  link: string;
&#125;
```

##### SerperOrganicResult

```typescript
&#123;
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position: number;
  attributes?: Record&lt;string, string&gt;;
  sitelinks?: SerperSitelink[];
&#125;
```

##### SerperPeopleAlsoAsk

```typescript
&#123;
  question: string;
  snippet: string;
  title: string;
  link: string;
&#125;
```

##### SerperRelatedSearch

```typescript
&#123;
  query: string;
&#125;
```

##### SerperNewsResult

```typescript
&#123;
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  position: number;
&#125;
```

## Error Handling

The package provides comprehensive error handling with helpful hints:

```typescript
try &#123;
  const results = await provider.searchWeb('query');
&#125; catch (error) &#123;
  if (error.status === 401) &#123;
    console.log('Invalid API key - check SERPER_API_KEY');
  &#125; else if (error.status === 429) &#123;
    console.log('Rate limit exceeded - reduce request frequency');
  &#125; else &#123;
    console.log('Search failed:', error.message);
  &#125;
&#125;
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