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
class WebSearchService implements TokenRingService &#123;
  name = "WebSearchService";
  description = "Service for Web Search";

  // Provider management
  registerProvider: (provider: WebSearchProvider, name: string) =&gt; void;
  getAvailableProviders: () =&gt; string[];
  setActiveProvider: (name: string, agent: Agent) =&gt; void;
  requireActiveProvider: (agent: Agent) =&gt; WebSearchProvider;

  // Search operations
  searchWeb: (query: string, options?: WebSearchProviderOptions, agent: Agent) =&gt; Promise&lt;WebSearchResult&gt;;
  searchNews: (query: string, options?: WebSearchProviderOptions, agent: Agent) =&gt; Promise&lt;NewsSearchResult&gt;;
  fetchPage: (url: string, options?: WebPageOptions, agent: Agent) =&gt; Promise&lt;WebPageResult&gt;;
  deepSearch: (query: string, options?: DeepSearchOptions, agent: Agent) =&gt; Promise&lt;DeepSearchResult&gt;;
&#125;
```

### WebSearchProvider (Abstract Class)

The base class that all search providers must implement. This abstract class defines the interface for concrete provider implementations.

```typescript
abstract class WebSearchProvider &#123;
  abstract searchWeb(query: string, options?: WebSearchProviderOptions): Promise&lt;WebSearchResult&gt;;
  abstract searchNews(query: string, options?: WebSearchProviderOptions): Promise&lt;NewsSearchResult&gt;;
  abstract fetchPage(url: string, options?: WebPageOptions): Promise&lt;WebPageResult&gt;;
&#125;
```

### WebSearchState

Agent state slice for managing web search state including the active provider.

```typescript
class WebSearchState implements AgentStateSlice &#123;
  name = "WebSearchState";
  provider: string | null;

  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
&#125;
```

## Chat Commands

### `/websearch`

Interactive command for performing web search operations in chat interfaces.

**Usage:**
```
/websearch &lt;action&gt; &lt;query|url&gt; [options]
```

**Actions:**
- `search &lt;query&gt;` - Perform a general web search
- `news &lt;query&gt;` - Search for news articles
- `fetch &lt;url&gt;` - Fetch and extract content from a web page
- `deep &lt;query&gt;` - Perform comprehensive search with content fetching
- `provider` - Manage the active search provider

### `/websearch search &lt;query&gt;`

Perform a general web search and return results with titles, URLs, and descriptions.

**Flags:**
- `--country &lt;code&gt;` - Country code for localized results (e.g., 'us', 'uk', 'de')
- `--language &lt;code&gt;` - Language code for content (e.g., 'en', 'es', 'fr')
- `--location &lt;name&gt;` - Location name for geo-targeted results
- `--num &lt;n&gt;` - Number of results to return
- `--page &lt;n&gt;` - Page number for pagination

**Examples:**
```bash
/websearch search typescript tutorial
/websearch search restaurants --location 'New York' --country us --num 10
```

### `/websearch news &lt;query&gt;`

Search for current news articles on a topic.

**Flags:**
- `--country &lt;code&gt;` - Country code for localized results
- `--language &lt;code&gt;` - Language code for content
- `--location &lt;name&gt;` - Location name for geo-targeted results
- `--num &lt;n&gt;` - Number of results to return
- `--page &lt;n&gt;` - Page number for pagination

**Examples:**
```bash
/websearch news artificial intelligence
/websearch news cryptocurrency --num 5
```

### `/websearch fetch &lt;url&gt;`

Fetch and extract content from a specific web page.

**Flags:**
- `--country &lt;code&gt;` - Country code for the request
- `--render` - Enable JavaScript rendering for dynamic content

**Examples:**
```bash
/websearch fetch https://developer.mozilla.org/en-US/docs/Web/JavaScript
/websearch fetch https://example.com --render
```

### `/websearch deep &lt;query&gt;`

Perform a comprehensive search combining web search, news search, and content fetching.

**Flags:**
- `--country &lt;code&gt;` - Country code for localized results
- `--language &lt;code&gt;` - Language code for content
- `--location &lt;name&gt;` - Location name for geo-targeted results
- `--search &lt;n&gt;` - Number of web search results (default: 10)
- `--news &lt;n&gt;` - Number of news results (default: 0)
- `--fetch &lt;n&gt;` - Number of pages to fetch (default: 5)

**Examples:**
```bash
/websearch deep quantum computing --search 10 --fetch 3
/websearch deep climate change --search 15 --news 3 --fetch 5 --language en --country uk
```

### `/websearch provider`

Manage the active web search provider.

**Subcommands:**
- `/websearch provider get` - Display the currently active provider
- `/websearch provider set &lt;name&gt;` - Set a specific provider by name
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
&#123;
  name: "websearch_searchWeb",
  description: "Search the web using the active web search provider",
  inputSchema: z.object(&#123;
    query: z.string().min(1).describe("Search query"),
    countryCode: z.string().optional().describe("Country code"),
    language: z.string().optional().describe("Language code"),
    location: z.string().optional().describe("Location string"),
    num: z.number().int().positive().optional().describe("Number of results"),
    page: z.number().int().positive().optional().describe("Page number"),
  &#125;)
&#125;
```

### websearch_searchNews

Search news using the active web search provider.

```typescript
&#123;
  name: "websearch_searchNews",
  description: "Search news using the active web search provider",
  inputSchema: z.object(&#123;
    query: z.string().min(1).describe("News search query"),
    countryCode: z.string().optional().describe("Country code"),
    language: z.string().optional().describe("Language code"),
    location: z.string().optional().describe("Location string"),
    num: z.number().int().positive().optional().describe("Number of results"),
    page: z.number().int().positive().optional().describe("Page number"),
  &#125;)
&#125;
```

### websearch_fetchPage

Fetch a web page using the active web search provider.

```typescript
&#123;
  name: "websearch_fetchPage",
  description: "Fetch a web page using the active web search provider",
  inputSchema: z.object(&#123;
    url: z.string().describe("URL to fetch"),
    render: z.boolean().optional().describe("Enable JavaScript rendering"),
    countryCode: z.string().optional().describe("Country code"),
  &#125;)
&#125;
```

### websearch_deepSearch

Perform a deep search: search the web, then fetch and return full page content for top results.

```typescript
&#123;
  name: "websearch_deepSearch",
  description: "Perform a deep search: search the web, then fetch and return full page content for top results",
  inputSchema: z.object(&#123;
    query: z.string().min(1).describe("A short search query to perform"),
    searchCount: z.number().int().positive().optional().describe("Number of general search results links to include"),
    newsCount: z.number().int().positive().optional().describe("Number of news articles to search for"),
    fetchCount: z.number().int().positive().optional().describe("Number of pages to fetch full page content for"),
    countryCode: z.string().optional().describe("Country code"),
    language: z.string().optional().describe("Language code"),
    location: z.string().optional().describe("Location string"),
  &#125;)
&#125;
```

## API Reference

### WebSearchService Methods

#### `searchWeb(query, options, agent)`

Performs a web search using the active provider.

**Parameters:**
- `query` (string): The search query string
- `options` (WebSearchProviderOptions): Optional search configuration
- `agent` (Agent): The agent context

**Returns:** Promise&lt;WebSearchResult&gt;

```typescript
interface WebSearchResult &#123;
  knowledgeGraph?: KnowledgeGraph;
  organic: OrganicResult[];
  peopleAlsoAsk?: PeopleAlsoAsk[];
  relatedSearches?: RelatedSearch[];
&#125;

interface OrganicResult &#123;
  title: string;
  link: string;
  snippet: string;
  sitelinks?: Sitelink[];
  position: number;
  date?: string;
  attributes?: Record&lt;string, string&gt;;
&#125;
```

#### `searchNews(query, options, agent)`

Performs a news search using the active provider.

**Parameters:**
- `query` (string): The search query string
- `options` (WebSearchProviderOptions): Optional search configuration
- `agent` (Agent): The agent context

**Returns:** Promise&lt;NewsSearchResult&gt;

```typescript
interface NewsSearchResult &#123;
  news: NewsItem[];
&#125;

interface NewsItem &#123;
  title: string;
  link: string;
  snippet?: string;
  date: string;
  source: string;
  position?: number;
&#125;
```

#### `fetchPage(url, options, agent)`

Fetches a web page using the active provider.

**Parameters:**
- `url` (string): The URL to fetch
- `options` (WebPageOptions): Optional fetch configuration
- `agent` (Agent): The agent context

**Returns:** Promise&lt;WebPageResult&gt;

```typescript
interface WebPageResult &#123;
  markdown: string;
  metadata?: Record&lt;string, string&gt;;
&#125;
```

#### `deepSearch(query, options, agent)`

Performs a comprehensive search combining web search, news search, and page fetching.

**Parameters:**
- `query` (string): The search query
- `options` (DeepSearchOptions): Optional configuration
- `agent` (Agent): The agent context

**Returns:** Promise&lt;DeepSearchResult&gt;

```typescript
interface DeepSearchResult &#123;
  results: any[];
  news: NewsItem[];
  pages: Array&lt;&#123;
    url: string;
    markdown: string;
    metadata?: Record&lt;string, string&gt;;
  &#125;&gt;;
&#125;
```

### WebSearchProviderOptions

```typescript
interface WebSearchProviderOptions &#123;
  countryCode?: string;    // Country code (e.g., 'US')
  language?: string;       // Language code (e.g., 'en')
  location?: string;       // Location string (e.g., 'New York,US')
  num?: number;            // Number of results (positive integer)
  page?: number;           // Page number (positive integer)
  timeout?: number;        // Request timeout in milliseconds
&#125;
```

### WebPageOptions

```typescript
interface WebPageOptions &#123;
  render?: boolean;        // Enable JavaScript rendering
  countryCode?: string;    // Country code
  timeout?: number;        // Request timeout in milliseconds
&#125;
```

### DeepSearchOptions

```typescript
interface DeepSearchOptions extends WebSearchProviderOptions &#123;
  searchCount?: number;    // Number of web results (default: 10)
  newsCount?: number;      // Number of news results (default: 0)
  fetchCount?: number;     // Number of pages to fetch (default: 5)
  rerank?: (results: any[]) =&gt; Promise&lt;any[]&gt;;  // Optional result reranking
&#125;
```

## Plugin Configuration

The plugin is configured through the application's configuration object under the `websearch` key.

```typescript
const WebSearchConfigSchema = z.object(&#123;
  providers: z.record(z.string(), z.any()),
  agentDefaults: z.object(&#123;
    provider: z.string()
  &#125;)
&#125;);
```

### Configuration Example

```typescript
const config = &#123;
  websearch: &#123;
    providers: &#123;
      "serper": &#123;
        type: "SerperWebSearchProvider",
        apiKey: "your-api-key"
      &#125;,
      "tavily": &#123;
        type: "TavilyWebSearchProvider",
        apiKey: "your-tavily-key"
      &#125;
    &#125;,
    agentDefaults: &#123;
      provider: "serper"
    &#125;
  &#125;
&#125;;
```

### Agent Configuration

Individual agents can override the default provider:

```typescript
const agentConfig = &#123;
  websearch: &#123;
    provider: "tavily"
  &#125;
&#125;;
```

## Plugin Integration

The plugin automatically integrates with Token Ring applications:

```typescript
export default &#123;
  name: "@tokenring-ai/websearch",
  version: "0.2.0",
  description: "Abstract web search interface for Token Ring",
  install(app, config) &#123;
    if (!config.websearch) return;
    app.addServices(new WebSearchService(config.websearch));
    app.waitForService(ScriptingService, (scriptingService) =&gt; &#123;
      // Register scripting functions
    &#125;);
    app.waitForService(ChatService, chatService =&gt;
      chatService.addTools(packageJSON.name, tools)
    );
    app.waitForService(AgentCommandService, agentCommandService =&gt;
      agentCommandService.addAgentCommands(chatCommands)
    );
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
```

## Usage Examples

### Basic Plugin Usage

```typescript
import &#123; TokenRingApp &#125; from '@tokenring-ai/app';
import websearch from '@tokenring-ai/websearch';
import &#123; WebSearchService &#125; from '@tokenring-ai/websearch';

const app = new TokenRingApp(&#123;
  config: &#123;
    websearch: &#123;
      providers: &#123;
        google: &#123;
          type: "GoogleSearchProvider"
        &#125;
      &#125;,
      agentDefaults: &#123;
        provider: "google"
      &#125;
    &#125;
  &#125;
&#125;);

app.registerPlugin(websearch);
await app.start();

const agent = app.agent;
const webSearchService = agent.requireServiceByType(WebSearchService);
const results = await webSearchService.searchWeb('Token Ring AI', undefined, agent);
console.log(results);
```

### Using Tools in Agent Tasks

```typescript
import &#123; searchWeb &#125; from '@tokenring-ai/websearch/tools/searchWeb';

const searchResults = await searchWeb.execute(
  &#123; query: 'latest AI news', num: 3 &#125;,
  agent
);
agent.infoLine(`Found $&#123;searchResults.organic.length&#125; results`);
```

### Deep Search Example

```typescript
const deepResults = await webSearchService.deepSearch(
  'machine learning trends 2024',
  &#123;
    searchCount: 15,
    newsCount: 5,
    fetchCount: 3
  &#125;,
  agent
);

console.log(`Found $&#123;deepResults.results.length&#125; web results`);
console.log(`Found $&#123;deepResults.news.length&#125; news articles`);
console.log(`Fetched $&#123;deepResults.pages.length&#125; pages`);
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

MIT License - See LICENSE file for details.

## Version

0.2.0
