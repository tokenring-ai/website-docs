# Web Search Plugin

Abstract web search interface with pluggable providers, tools for search, news, page fetching, and comprehensive deep search capabilities.

## Overview

The `@tokenring-ai/websearch` package provides an abstract interface for web search operations within the Token Ring AI agent system. It enables the registration and use of pluggable web search providers to perform web searches, news searches, web page fetching, and deep search operations. The package integrates seamlessly with the `@tokenring-ai/agent` framework, offering tools and chat commands for interactive and programmatic search capabilities.

### Key Features

- **Pluggable Provider Architecture**: Support for multiple search engines and providers
- **Web Search**: General web search with localized results
- **News Search**: News-specific search functionality  
- **Page Fetching**: Retrieve and extract web page content with JavaScript rendering
- **Deep Search**: Comprehensive search combining web results, news, and full page content
- **Localization**: Support for country codes, languages, and locations
- **Pagination**: Handle multiple pages of results
- **Scripting Integration**: Global functions for programmatic access
- **Interactive Commands**: Comprehensive chat commands with help documentation
- **Provider Management**: Switch between different search providers
- **Result Formatting**: Clean markdown output for fetched pages

## Providers

The package includes support for multiple search providers:

- **Serper** (Google search via Serper.dev) - [Documentation](./serper.md)
- **ScraperAPI** (Web scraping and SERP) - [Documentation](./scraperapi.md)
- **Chrome** (Puppeteer-based automation) - [Documentation](./chrome.md)

## Core Components

### WebSearchService

Central hub for web search operations, implements `TokenRingService`.

```typescript
class WebSearchService implements TokenRingService {
  name = "WebSearchService";
  description = "Service for Web Search";
  
  // Provider management
  registerProvider(provider: WebSearchProvider, name: string): void
  setActiveProvider(name: string): void
  getActiveProvider(): WebSearchProvider
  getAvailableProviders(): string[]

  // Search operations
  async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>
  async searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>
  async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>
  async deepSearch(query: string, options?: DeepSearchOptions): Promise<DeepSearchResult>
}
```

### Tools

**searchWeb**: Executes a web search
- Input schema validates query and options
- Returns web search results

**searchNews**: Executes a news search  
- Similar to searchWeb but for news results

**fetchPage**: Fetches page HTML
- Validates URL, supports rendering
- Returns markdown content

**deepSearch**: Performs comprehensive search
- Combines search and fetch operations
- Configurable number of results to search, news, and fetch

### Chat Commands

**/websearch**: Interactive command for users
- Subcommands: `search <query>`, `news <query>`, `fetch <url>`, `deep <query>`, `provider`
- Supports flags: `--country`, `--language`, `--location`, `--num`, `--page`, `--render`
- Displays results or provider status in chat

### Global Scripting Functions

When `@tokenring-ai/scripting` is available:

**searchWeb(query)**: Performs web search and returns JSON results
```bash
/var $results = searchWeb("artificial intelligence")
/call searchWeb("latest tech news")
```

**searchNews(query)**: Searches for news articles
```bash
/var $news = searchNews("climate change") 
/call searchNews("stock market")
```

**fetchPage(url)**: Fetches HTML content of a web page
```bash
/var $html = fetchPage("https://example.com")
/call fetchPage("https://news.site/article")
```

**deepSearch(query, searchCount?, newsCount?, fetchCount?)**: Performs comprehensive search
```bash
/var $deep = deepSearch("quantum computing", 10, 5, 3)
/call deepSearch("AI breakthroughs", 20, 10, 5)
```

## Usage Examples

### Registering a Provider

```typescript
import { Agent } from '@tokenring-ai/agent';
import { WebSearchService } from '@tokenring-ai/websearch';
import { SerperWebSearchProvider } from './providers/SerperWebSearchProvider';

const agent = new Agent();
const webSearchService = new WebSearchService();
agent.registerService(webSearchService);

// Register Serper provider
const serperProvider = new SerperWebSearchProvider({ apiKey: 'your-serper-key' });
webSearchService.registerProvider(serperProvider, 'serper');

// Set active provider  
webSearchService.setActiveProvider('serper');

// Perform a search
const results = await webSearchService.searchWeb('Token Ring AI', { num: 5});
console.log(results.results);
```

### Using a Tool

```typescript
import { searchWeb } from '@tokenring-ai/websearch/tools/searchWeb';

const searchResults = await searchWeb.execute(
  { query: 'latest AI news', num: 3 },
  agent
);
agent.chat.infoLine(`Found: ${JSON.stringify(searchResults.results)}`);
```

### Using Deep Search Tool

```typescript
import { deepSearch } from '@tokenring-ai/websearch/tools/deepSearch';

const deepResults = await deepSearch.execute(
  { query: 'quantum computing', searchCount: 10, newsCount: 5, fetchCount: 3 },
  agent
);
agent.chat.infoLine(`Deep search results: ${deepResults.results.length} web results, ${deepResults.news.length} news results, ${deepResults.pages.length} pages fetched`);
```

### Chat Command Examples

```bash
# Basic Search
/websearch search typescript tutorial

# News Search with Limit
/websearch news artificial intelligence --num 5

# Location-specific Search
/websearch search restaurants --location 'New York' --country us

# Fetch Web Page
/websearch fetch https://developer.mozilla.org/en-US/docs/Web/JavaScript

# Fetch with JavaScript Rendering
/websearch fetch https://example.com --render

# Comprehensive Deep Search
/websearch deep artificial intelligence --search 20 --news 5 --fetch 10

# Deep Search with Localization
/websearch deep climate change --search 15 --news 3 --fetch 5 --language en --country uk

# View Providers
/websearch provider

# Set Provider
/websearch provider tavily
```

## Configuration Options

### Search Options (WebSearchProviderOptions)

- `countryCode`: e.g., 'US'
- `language`: e.g., 'en' 
- `location`: e.g., 'New York,US'
- `num`: Positive int, results per page
- `page`: Positive int for pagination
- `timeout`: Milliseconds

### Page Fetch Options (WebPageOptions)

- `render`: Boolean, for JS-heavy sites
- `countryCode`: Country code
- `timeout`: Milliseconds

### Deep Search Options (DeepSearchOptions)

- `searchCount`: Number of web search results (default: 10)
- `newsCount`: Number of news results (default: 0) 
- `fetchCount`: Number of pages to fetch (default: 5)
- `rerank`: Optional function to rerank results
- Inherits WebSearchProviderOptions

### Provider Configuration

```typescript
interface WebSearchConfig {
  providers: {
    [providerName: string]: {
      type: 'serper' | 'scraperapi' | 'chrome' | 'tavily' | string;
      apiKey: string;
      defaults?: {
        gl?: string;
        hl?: string;
        location?: string;
        num?: number;
        page?: number;
      };
    };
  };
}
```

## Dependencies

- `@tokenring-ai/agent@^0.2.0`: Core agent framework and types
- `@tokenring-ai/scripting@^0.2.0`: Optional, for global functions
- `@tokenring-ai/app@^0.2.0`: Application framework
- `@tokenring-ai/chat@^0.2.0`: Chat service integration
- `@tokenring-ai/utility@^0.2.0`: Utility functions and registries
- `zod@^4.0.17`: Schema validation for tool inputs
- Internal utilities from `@tokenring-ai/utility`

## Plugin Integration

The websearch package automatically integrates with Token Ring applications through its plugin:

```typescript
export default {
  name: "@tokenring-ai/websearch",
  version: "0.2.0",
  description: "Abstract web search interface for Token Ring",
  install(app: TokenRingApp) {
    const config = app.getConfigSlice('websearch', WebSearchConfigSchema);
    if (config) {
      app.waitForService(ScriptingService, (scriptingService: ScriptingService) => {
        scriptingService.registerFunction("searchWeb", {
            type: 'native',
            params: ['query'],
            async execute(this: ScriptingThis, query: string): Promise<string> {
              const result = await this.agent.requireServiceByType(WebSearchService).searchWeb(query);
              return JSON.stringify(result);
            }
          }
        );

        scriptingService.registerFunction("searchNews", {
            type: 'native',
            params: ['query'],
            async execute(this: ScriptingThis, query: string): Promise<string> {
              const result = await this.agent.requireServiceByType(WebSearchService).searchNews(query);
              return JSON.stringify(result);
            }
          }
        );

        scriptingService.registerFunction("fetchPage", {
            type: 'native',
            params: ['url'],
            async execute(this: ScriptingThis, url: string): Promise<string> {
              const result = await this.agent.requireServiceByType(WebSearchService).fetchPage(url);
              return result.markdown;
            }
          }
        );

        scriptingService.registerFunction("deepSearch", {
            type: 'native',
            params: ['query', 'searchCount', 'newsCount', 'fetchCount'],
            async execute(this: ScriptingThis, query: string, searchCount?: string, newsCount?: string, fetchCount?: string): Promise<string> {
              const result = await this.agent.requireServiceByType(WebSearchService).deepSearch(query, {
                searchCount: searchCount ? parseInt(searchCount) : undefined,
                newsCount: newsCount ? parseInt(newsCount) : undefined,
                fetchCount: fetchCount ? parseInt(fetchCount) : undefined
              });
              return JSON.stringify(result);
            }
          }
        );
      });
      app.waitForService(ChatService, chatService => 
        chatService.addTools(packageJSON.name, tools)
      );
      app.waitForService(AgentCommandService, agentCommandService => 
        agentCommandService.addAgentCommands(chatCommands)
      );
      app.addServices(new WebSearchService());
    }
  },

  start(app: TokenRingApp) {
    const config = app.getConfigSlice("websearch", WebSearchConfigSchema);
    if (config) {
      app.requireService(WebSearchService).setActiveProvider(config.defaultProvider);
    }
  }
} satisfies TokenRingPlugin;
```

## Service Lifecycle

1. **Initialization**: Service creates provider registry and sets up configuration
2. **Provider Registration**: Registers available search providers during plugin installation
3. **Resource Management**: Manages active provider selection and provider lifecycle
4. **Command Registration**: Registers chat commands and tools with appropriate services
5. **Scripting Integration**: Sets up global functions when ScriptingService is available
6. **Startup**: Sets active provider based on configuration when service starts
7. **Operation**: Delegates search operations to active provider
8. **Cleanup**: Proper resource management and provider cleanup on shutdown

## Error Handling

- **Provider Errors**: Graceful handling when providers are unavailable or fail
- **Input Validation**: Zod schemas validate all search parameters and inputs
- **Timeout Handling**: Configurable timeouts for search operations
- **Result Processing**: Proper error formatting and result validation
- **Service Dependencies**: Graceful handling when required services aren't available

## Security Considerations

- **API Keys**: Secure handling of API keys for search providers
- **URL Validation**: Proper validation of URLs before fetching
- **Content Filtering**: Potential for content filtering and safety checks
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