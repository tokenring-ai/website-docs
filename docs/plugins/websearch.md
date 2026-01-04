# Web Search Plugin

## Overview

The Web Search plugin provides comprehensive web search capabilities for the Token Ring ecosystem. It enables agents to perform web searches, news searches, fetch page content, and execute deep searches with customizable parameters. The package acts as an abstract interface that allows pluggable web search providers to be registered and used seamlessly.

## Key Features

- Multiple search methods (web search, news search, page fetching, deep search)
- Pluggable provider architecture supporting multiple search backends
- Chat commands for interactive search operations
- Tools integration with the chat service for agent-based searches
- Scripting functions for programmatic access
- Configurable search parameters (country, language, location, result count)
- State management for provider persistence across agent sessions
- Support for JavaScript rendering when fetching pages

## Core Components

### WebSearchService

The main service that coordinates web search operations. It manages a registry of providers and delegates search requests to the active provider.

```typescript
class WebSearchService implements TokenRingService {
  name = "WebSearchService";
  description = "Service for Web Search";

  // Provider management
  registerProvider: (provider: WebSearchProvider, name: string) => void;
  getAvailableProviders: () => string[];
  setActiveProvider: (name: string, agent: Agent) => void;
  requireActiveProvider: (agent: Agent) => WebSearchProvider;

  // Search operations
  searchWeb: (query: string, options?: WebSearchProviderOptions, agent: Agent) => Promise<WebSearchResult>;
  searchNews: (query: string, options?: WebSearchProviderOptions, agent: Agent) => Promise<NewsSearchResult>;
  fetchPage: (url: string, options?: WebPageOptions, agent: Agent) => Promise<WebPageResult>;
  deepSearch: (query: string, options?: DeepSearchOptions, agent: Agent) => Promise<DeepSearchResult>;
}
```

### WebSearchProvider (Abstract Class)

The base class that all search providers must implement. This abstract class defines the interface for concrete provider implementations.

```typescript
abstract class WebSearchProvider {
  abstract searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>;
  abstract searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>;
  abstract fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>;
}
```

### WebSearchState

Agent state slice for managing web search state including the active provider.

```typescript
class WebSearchState implements AgentStateSlice {
  name = "WebSearchState";
  provider: string | null;

  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
}
```

## Chat Commands

### `/websearch`

Interactive command for performing web search operations in chat interfaces.

**Usage:**
```
/websearch <action> <query|url> [options]
```

**Actions:**
- `search <query>` - Perform a general web search
- `news <query>` - Search for news articles
- `fetch <url>` - Fetch and extract content from a web page
- `deep <query>` - Perform comprehensive search with content fetching
- `provider` - Manage the active search provider

### `/websearch search <query>`

Perform a general web search and return results with titles, URLs, and descriptions.

**Flags:**
- `--country <code>` - Country code for localized results (e.g., 'us', 'uk', 'de')
- `--language <code>` - Language code for content (e.g., 'en', 'es', 'fr')
- `--location <name>` - Location name for geo-targeted results
- `--num <n>` - Number of results to return
- `--page <n>` - Page number for pagination

**Examples:**
```bash
/websearch search typescript tutorial
/websearch search restaurants --location 'New York' --country us --num 10
```

### `/websearch news <query>`

Search for current news articles on a topic.

**Flags:**
- `--country <code>` - Country code for localized results
- `--language <code>` - Language code for content
- `--location <name>` - Location name for geo-targeted results
- `--num <n>` - Number of results to return
- `--page <n>` - Page number for pagination

**Examples:**
```bash
/websearch news artificial intelligence
/websearch news cryptocurrency --num 5
```

### `/websearch fetch <url>`

Fetch and extract content from a specific web page.

**Flags:**
- `--country <code>` - Country code for the request
- `--render` - Enable JavaScript rendering for dynamic content

**Examples:**
```bash
/websearch fetch https://developer.mozilla.org/en-US/docs/Web/JavaScript
/websearch fetch https://example.com --render
```

### `/websearch deep <query>`

Perform a comprehensive search combining web search, news search, and content fetching.

**Flags:**
- `--country <code>` - Country code for localized results
- `--language <code>` - Language code for content
- `--location <name>` - Location name for geo-targeted results
- `--search <n>` - Number of web search results (default: 10)
- `--news <n>` - Number of news results (default: 0)
- `--fetch <n>` - Number of pages to fetch (default: 5)

**Examples:**
```bash
/websearch deep quantum computing --search 10 --fetch 3
/websearch deep climate change --search 15 --news 3 --fetch 5 --language en --country uk
```

### `/websearch provider`

Manage the active web search provider.

**Subcommands:**
- `/websearch provider get` - Display the currently active provider
- `/websearch provider set <name>` - Set a specific provider by name
- `/websearch provider select` - Select a provider interactively
- `/websearch provider reset` - Reset to the initial configured provider

**Examples:**
```bash
/websearch provider get
/websearch provider set tavily
/websearch provider select
/websearch provider reset
```

## Tools

The plugin provides four tools that can be used through the chat service:

### websearch_searchWeb

Search the web using the active web search provider.

```typescript
{
  name: "websearch_searchWeb",
  description: "Search the web using the active web search provider",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query"),
    countryCode: z.string().optional().describe("Country code"),
    language: z.string().optional().describe("Language code"),
    location: z.string().optional().describe("Location string"),
    num: z.number().int().positive().optional().describe("Number of results"),
    page: z.number().int().positive().optional().describe("Page number"),
  })
}
```

### websearch_searchNews

Search news using the active web search provider.

```typescript
{
  name: "websearch_searchNews",
  description: "Search news using the active web search provider",
  inputSchema: z.object({
    query: z.string().min(1).describe("News search query"),
    countryCode: z.string().optional().describe("Country code"),
    language: z.string().optional().describe("Language code"),
    location: z.string().optional().describe("Location string"),
    num: z.number().int().positive().optional().describe("Number of results"),
    page: z.number().int().positive().optional().describe("Page number"),
  })
}
```

### websearch_fetchPage

Fetch a web page using the active web search provider.

```typescript
{
  name: "websearch_fetchPage",
  description: "Fetch a web page using the active web search provider",
  inputSchema: z.object({
    url: z.string().describe("URL to fetch"),
    render: z.boolean().optional().describe("Enable JavaScript rendering"),
    countryCode: z.string().optional().describe("Country code"),
  })
}
```

### websearch_deepSearch

Perform a deep search: search the web, then fetch and return full page content for top results.

```typescript
{
  name: "websearch_deepSearch",
  description: "Perform a deep search: search the web, then fetch and return full page content for top results",
  inputSchema: z.object({
    query: z.string().min(1).describe("A short search query to perform"),
    searchCount: z.number().int().positive().optional().describe("Number of general search results links to include"),
    newsCount: z.number().int().positive().optional().describe("Number of news articles to search for"),
    fetchCount: z.number().int().positive().optional().describe("Number of pages to fetch full page content for"),
    countryCode: z.string().optional().describe("Country code"),
    language: z.string().optional().describe("Language code"),
    location: z.string().optional().describe("Location string"),
  })
}
```

## API Reference

### WebSearchService Methods

#### `searchWeb(query, options, agent)`

Performs a web search using the active provider.

**Parameters:**
- `query` (string): The search query string
- `options` (WebSearchProviderOptions): Optional search configuration
- `agent` (Agent): The agent context

**Returns:** `Promise<WebSearchResult>`

```typescript
interface WebSearchResult {
  knowledgeGraph?: KnowledgeGraph;
  organic: OrganicResult[];
  peopleAlsoAsk?: PeopleAlsoAsk[];
  relatedSearches?: RelatedSearch[];
}

interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  sitelinks?: Sitelink[];
  position: number;
  date?: string;
  attributes?: Record<string, string>;
}
```

#### `searchNews(query, options, agent)`

Performs a news search using the active provider.

**Parameters:**
- `query` (string): The search query string
- `options` (WebSearchProviderOptions): Optional search configuration
- `agent` (Agent): The agent context

**Returns:** `Promise<NewsSearchResult>`

```typescript
interface NewsSearchResult {
  news: NewsItem[];
}

interface NewsItem {
  title: string;
  link: string;
  snippet?: string;
  date: string;
  source: string;
  position?: number;
}
```

#### `fetchPage(url, options, agent)`

Fetches a web page using the active provider.

**Parameters:**
- `url` (string): The URL to fetch
- `options` (WebPageOptions): Optional fetch configuration
- `agent` (Agent): The agent context

**Returns:** `Promise<WebPageResult>`

```typescript
interface WebPageResult {
  markdown: string;
  metadata?: Record<string, string>;
}
```

#### `deepSearch(query, options, agent)`

Performs a comprehensive search combining web search, news search, and page fetching.

**Parameters:**
- `query` (string): The search query
- `options` (DeepSearchOptions): Optional configuration
- `agent` (Agent): The agent context

**Returns:** `Promise<DeepSearchResult>`

```typescript
interface DeepSearchResult {
  results: any[];
  news: NewsItem[];
  pages: Array<{
    url: string;
    markdown: string;
    metadata?: Record<string, string>;
  }>;
}
```

### WebSearchProviderOptions

```typescript
interface WebSearchProviderOptions {
  countryCode?: string;    // Country code (e.g., 'US')
  language?: string;       // Language code (e.g., 'en')
  location?: string;       // Location string (e.g., 'New York,US')
  num?: number;            // Number of results (positive integer)
  page?: number;           // Page number (positive integer)
  timeout?: number;        // Request timeout in milliseconds
}
```

### WebPageOptions

```typescript
interface WebPageOptions {
  render?: boolean;        // Enable JavaScript rendering
  countryCode?: string;    // Country code
  timeout?: number;        // Request timeout in milliseconds
}
```

### DeepSearchOptions

```typescript
interface DeepSearchOptions extends WebSearchProviderOptions {
  searchCount?: number;    // Number of web results (default: 10)
  newsCount?: number;      // Number of news results (default: 0)
  fetchCount?: number;     // Number of pages to fetch (default: 5)
  rerank?: (results: any[]) => Promise<any[]>;  // Optional result reranking
}
```

## Plugin Configuration

The plugin is configured through the application's configuration object under the `websearch` key.

```typescript
const WebSearchConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),
  agentDefaults: z.object({
    provider: z.string()
  })
});
```

### Configuration Example

```typescript
const config = {
  websearch: {
    providers: {
      "serper": {
        type: "SerperWebSearchProvider",
        apiKey: "your-api-key"
      },
      "tavily": {
        type: "TavilyWebSearchProvider",
        apiKey: "your-tavily-key"
      }
    },
    agentDefaults: {
      provider: "serper"
    }
  }
};
```

### Agent Configuration

Individual agents can override the default provider:

```typescript
const agentConfig = {
  websearch: {
    provider: "tavily"
  }
};
```

## Plugin Integration

The plugin automatically integrates with Token Ring applications:

```typescript
export default {
  name: "@tokenring-ai/websearch",
  version: "0.2.0",
  description: "Abstract web search interface for Token Ring",
  install(app, config) {
    if (!config.websearch) return;
    app.addServices(new WebSearchService(config.websearch));
    app.waitForService(ScriptingService, (scriptingService) => {
      // Register scripting functions
    });
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Usage Examples

### Basic Plugin Usage

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import websearch from '@tokenring-ai/websearch';
import { WebSearchService } from '@tokenring-ai/websearch';

const app = new TokenRingApp({
  config: {
    websearch: {
      providers: {
        google: {
          type: "GoogleSearchProvider"
        }
      },
      agentDefaults: {
        provider: "google"
      }
    }
  }
});

app.registerPlugin(websearch);
await app.start();

const agent = app.agent;
const webSearchService = agent.requireServiceByType(WebSearchService);
const results = await webSearchService.searchWeb('Token Ring AI', undefined, agent);
console.log(results);
```

### Using Tools in Agent Tasks

```typescript
import { searchWeb } from '@tokenring-ai/websearch/tools/searchWeb';

const searchResults = await searchWeb.execute(
  { query: 'latest AI news', num: 3 },
  agent
);
agent.infoLine(`Found ${searchResults.organic.length} results`);
```

### Deep Search Example

```typescript
const deepResults = await webSearchService.deepSearch(
  'machine learning trends 2024',
  {
    searchCount: 15,
    newsCount: 5,
    fetchCount: 3
  },
  agent
);

console.log(`Found ${deepResults.results.length} web results`);
console.log(`Found ${deepResults.news.length} news articles`);
console.log(`Fetched ${deepResults.pages.length} pages`);
```

### Provider Management

```typescript
const webSearchService = agent.requireServiceByType(WebSearchService);

// List available providers
const providers = webSearchService.getAvailableProviders();
console.log('Available providers:', providers);

// Switch provider
webSearchService.setActiveProvider('tavily', agent);

// Get current provider
const currentProvider = agent.getState(WebSearchState).provider;
```

### Scripting Functions

When `@tokenring-ai/scripting` is available, global functions are registered:

```typescript
// Search the web
const results = await searchWeb("artificial intelligence");

// Search news
const news = await searchNews("climate change");

// Fetch page content
const content = await fetchPage("https://example.com");

// Deep search
const deep = await deepSearch("quantum computing", "10", "5", "3");
```

## RPC Endpoints

The plugin registers the following RPC endpoints through the ScriptingService:

| Endpoint | Request Params | Response |
|----------|---------------|----------|
| `searchWeb` | `query: string` | `string` (JSON serialized WebSearchResult) |
| `searchNews` | `query: string` | `string` (JSON serialized NewsSearchResult) |
| `fetchPage` | `url: string` | `string` (page markdown content) |
| `deepSearch` | `query, searchCount?, newsCount?, fetchCount?` | `string` (JSON serialized DeepSearchResult) |

## State Management

The WebSearchState class manages agent state persistence:

- **Serialization**: Stores the active provider name
- **Deserialization**: Restores provider on agent load
- **Transfer**: Supports state transfer between parent and child agents
- **Display**: Shows current provider in agent state view

## Service Lifecycle

1. **Initialization**: Service creates provider registry and configuration
2. **Provider Registration**: Providers register themselves during plugin installation
3. **Agent Attachment**: When agent attaches, state is initialized with configured provider
4. **Command Registration**: Chat commands and tools register with appropriate services
5. **Scripting Integration**: Global functions set up when ScriptingService is available
6. **Operation**: Search operations delegate to the active provider
7. **Cleanup**: Proper resource management on shutdown

## Error Handling

- **Provider Errors**: Graceful handling when providers are unavailable or fail
- **Input Validation**: Zod schemas validate all search parameters
- **Timeout Handling**: Configurable timeouts for search operations
- **Result Processing**: Proper error formatting and result validation
- **Service Dependencies**: Graceful handling when required services aren't available

## Security Considerations

- **API Keys**: Secure handling of API keys for search providers
- **URL Validation**: Proper validation of URLs before fetching
- **Content Safety**: Potential for content filtering and safety checks
- **Rate Limiting**: Consideration for provider rate limits
- **Error Information**: User-friendly error messages without exposing sensitive information

## Performance Considerations

- **Provider Selection**: Efficient provider selection and caching
- **Result Caching**: Potential for result caching to improve performance
- **Pagination Handling**: Efficient handling of multiple result pages
- **Concurrent Operations**: Proper handling of concurrent search operations
- **Resource Management**: Proper cleanup of provider resources

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.