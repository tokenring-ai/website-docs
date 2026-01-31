# @tokenring-ai/websearch

Plugin: Search and Content Retrieval

## Overview and Purpose

The `@tokenring-ai/websearch` plugin provides a comprehensive web search interface for the Token Ring AI ecosystem. It serves as an abstract service layer that enables agents to query the web dynamically, process search results, and fetch content for tasks like research, data gathering, and real-time information retrieval.

As a core abstract interface plugin, this package defines the contract that concrete search provider implementations must follow. It integrates seamlessly with the Token Ring framework through its plugin system, offering:

- **Four interactive tools** for agent operations (searchWeb, searchNews, fetchPage, deepSearch)
- **Agent command interface** for CLI-based operations (/websearch)
- **Four global scripting functions** accessible through the scripting service
- **Service layer integration** with provider registry and state management

## Key Features

- **Abstract Provider Interface**: Defines the contract for search providers to implement
- **Multi-Provider Support**: Registry system for managing multiple search provider implementations
- **Comprehensive Search Operations**: Web search, news search, page fetching, and deep search
- **Agent State Management**: Persistent provider selection per agent
- **Interactive Tools**: Four agent-usable tools with schema validation
- **CLI Commands**: Full-featured `/websearch` command with subcommands and options
- **Scripting Functions**: Global functions for LLM access to search capabilities
- **Configurable Options**: Country/region targeting, language localization, pagination
- **Error Handling**: Proper validation and standardized error responses

## Core Components

### WebSearchProvider (Abstract Class)

The abstract base class that defines the interface for all search provider implementations.

**Location**: `pkg/websearch/WebSearchProvider.ts`

**Abstract Methods:**
```typescript
abstract searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>
abstract searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>
abstract fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>
```

**Result Type Definitions:**

- `WebSearchResult`: General search results with knowledge graph, organic results, related searches, and people also ask sections
- `NewsSearchResult`: News article results with titles, links, dates, sources, and snippets
- `WebPageResult`: Web page content in markdown format with optional metadata
- `DeepSearchResult`: Combined results from web search, news search, and page fetching

**Option Type Definitions:**

```typescript
interface WebSearchProviderOptions {
  countryCode?: string;    // ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
  language?: string;       // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
  location?: string;       // Location string for geo-targeting (e.g., 'New York,US')
  num?: number;            // Number of results (positive integer)
  page?: number;           // Page number for pagination (positive integer)
  timeout?: number;        // Request timeout in milliseconds
}

interface WebPageOptions {
  render?: boolean;        // Enable JavaScript rendering for dynamic content
  countryCode?: string;    // Country code for localized results
  timeout?: number;        // Request timeout in milliseconds
}

interface DeepSearchOptions extends WebSearchProviderOptions {
  searchCount?: number;    // Number of web results (default: 10)
  newsCount?: number;      // Number of news results (default: 0)
  fetchCount?: number;     // Number of pages to fetch (default: 5)
  rerank?: (results: any[]) => Promise<any[]>; // Optional custom result sorter
}
```

### WebSearchService

Core service implementation managing provider registry, search operations, and agent integration.

**Location**: `pkg/websearch/WebSearchService.ts`

**Provider Management:**
```typescript
registerProvider(provider: WebSearchProvider, name: string): void
getAvailableProviders(): string[]
setActiveProvider(name: string, agent: Agent): void
requireActiveProvider(agent: Agent): WebSearchProvider
attach(agent: Agent): void
```

**Search Operations:**
```typescript
searchWeb(query: string, options?: WebSearchProviderOptions, agent: Agent): Promise<WebSearchResult>
searchNews(query: string, options?: WebSearchProviderOptions, agent: Agent): Promise<NewsSearchResult>
fetchPage(url: string, options?: WebPageOptions, agent: Agent): Promise<WebPageResult>
deepSearch(query: string, options?: DeepSearchOptions, agent: Agent): Promise<DeepSearchResult>
```

**DeepSearch Algorithm:**
1. Execute web search with `searchCount` configured results
2. Execute news search with `newsCount` configured results (in parallel)
3. Apply custom reranking function if provided (`options.rerank`)
4. Fetch top `fetchCount` results using `fetchPage` with markdown extraction
5. Return combined results with web results, news articles, and fetched page content

### Plugin Registration

**Location**: `pkg/websearch/plugin.ts`

The plugin exports a TokenRingPlugin configuration that:
- Registers WebSearchService with the application
- Registers four scripting functions via ScriptingService during install phase
- Registers four tools via ChatService.addTools() during install phase
- Registers chat commands via AgentCommandService.addAgentCommands() during install phase
- Provides configuration schema validation

**Scripting Functions Registered:**
- `searchWeb(query: string)`: Performs web search, returns JSON results
- `searchNews(query: string)`: Performs news search, returns JSON results
- `fetchPage(url: string)`: Fetches page markdown content
- `deepSearch(query: string, searchCount?, newsCount?, fetchCount?)`: Comprehensive deep search, returns JSON

**Tool Registration Pattern:**
All tools use Zod schema validation:
```typescript
const inputSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  countryCode: z.string().optional().describe("Country code"),
  // ... other optional fields
});
```

Tools access service via `agent.requireServiceByType(WebSearchService)`

## API Reference

### Configuration Schema

**Location**: `pkg/websearch/schema.ts`

```typescript
export const WebSearchAgentConfigSchema = z.object({
  provider: z.string().optional()
}).default({});

export const WebSearchConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),
  agentDefaults: z.object({
    provider: z.string()
  })
});
```

### Package Structure

```
pkg/websearch/
├── index.ts                 # Main exports (WebSearchService, WebSearchProvider, schemas)
├── plugin.ts                # TokenRingPlugin registration
├── WebSearchService.ts      # Core service implementation
├── WebSearchProvider.ts     # Abstract base class definition
├── schema.ts                # Zod schema definitions
├── tools.ts                 # Barrel export for all tools
├── chatCommands.ts          # Chat command exports (exports commands/websearch)
├── state/
│   └── webSearchState.ts    # Agent state slice
├── tools/                   # Individual tool implementations
│   ├── searchWeb.ts         # Web search tool (websearch_searchWeb)
│   ├── searchNews.ts        # News search tool (websearch_searchNews)
│   ├── fetchPage.ts         # Page fetch tool (websearch_fetchPage)
│   └── deepSearch.ts        # Deep search tool (websearch_deepSearch)
└── commands/                # Chat command implementations
    ├── websearch.ts         # Main command router (/websearch)
    ├── search.ts            # /websearch search <query>
    ├── news.ts              # /websearch news <query>
    ├── fetch.ts             # /websearch fetch <url>
    ├── deep.ts              # /websearch deep <query>
    └── provider/
        ├── get.ts           # /websearch provider get
        ├── set.ts           # /websearch provider set <name>
        ├── select.ts        # /websearch provider select
        └── reset.ts         # /websearch provider reset
```

## Usage Examples

### Service Integration

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import websearch from '@tokenring-ai/websearch';
import { WebSearchService } from '@tokenring-ai/websearch';

const app = new TokenRingApp({
  config: {
    websearch: {
      providers: {
        serper: {
          type: 'SerperWebSearchProvider'
        },
        scraperapi: {
          type: 'ScraperAPIWebSearchProvider'
        }
      },
      agentDefaults: {
        provider: 'serper'
      }
    }
  }
});

app.registerPlugin(websearch);
await app.start();

// Access the service
const webSearchService = app.requireServiceByType(WebSearchService);
const results = await webSearchService.searchWeb('Token Ring AI framework', { num: 10 }, app.agent);
console.log(`Found ${results.organic.length} results`);
```

### Tool Usage

```typescript
// In agent task execution, tools are auto-available
const articles = await agent.callTool("websearch_searchWeb", {
  query: "artificial intelligence 2024",
  num: 20,
  language: "en",
  countryCode: "us"
});

const news = await agent.callTool("websearch_searchNews", {
  query: "AI ethics",
  num: 10
});

// Fetch page content
const page = await agent.callTool("websearch_fetchPage", {
  url: "https://example.com/page-with-javascript",
  render: true
});

// Deep search with custom context
const deep = await agent.callTool("websearch_deepSearch", {
  query: "machine learning trends",
  searchCount: 15,
  newsCount: 5,
  fetchCount: 3
});
```

### CLI Command Usage

```bash
# Basic web search
/websearch search typescript tutorial

# Location-specific search
/websearch search restaurants --location "New York,US" --country us

# News search
/websearch news cryptocurrency --num 10

# Fetch web page with JavaScript rendering
/websearch fetch https://example.com --render

# Deep search with multiple operations
/websearch deep quantum computing --search 20 --news 5 --fetch 10 --language en --country uk

# Provider management
/websearch provider get
/websearch provider set serper
/websearch provider select
/websearch provider reset
```

### Scripting Function Usage

```javascript
// Available when scripting service is enabled

// Web search
const searchResults = searchWeb("latest AI research");
// Returns: JSON string with WebSearchResult

// News search
const news = searchNews("technology news");
// Returns: JSON string with NewsSearchResult

// Fetch page
const markdownContent = fetchPage("https://example.com");
// Returns: Markdown string

// Deep search
const comprehensive = deepSearch("machine learning breakthroughs", "15", "5", "3");
// Returns: JSON string with DeepSearchResult
```

### Agent State Management

```typescript
// Get current active provider
const state = agent.getState('WebSearchState');
console.log('Active provider:', state.provider);

// Switch providers
webSearchService.setActiveProvider('scraperapi', agent);

// Reset to initial provider
webSearchService.setActiveProvider(state.initialConfig.provider, agent);
```

## Configuration

### Application Configuration

```typescript
const appConfig = {
  websearch: {
    providers: {
      // Define provider configurations
      serper: {
        type: 'SerperWebSearchProvider',
        apiKey: process.env.SERPER_API_KEY!
      },
      scraperapi: {
        type: 'ScraperAPIWebSearchProvider',
        apiKey: process.env.SCRAPERAPI_KEY!
      }
    },
    agentDefaults: {
      provider: 'serper'  // Default provider for all agents
    }
  }
};
```

### Agent Configuration

Individual agents can override the default provider:

```typescript
const agentConfig = {
  websearch: {
    provider: 'scraperapi'  // Override default for this agent only
  }
};
```

## Integration with Providers

This plugin is designed to work with concrete provider implementations in the Token Ring ecosystem:

- **@tokenring-ai/serper**: Google Search and News integration via Serper.dev API
  - POST requests to serper.dev endpoints
  - Features: Knowledge graphs, related searches, people also ask
  - Automatic last-hour filtering for news

- **@tokenring-ai/scraperapi**: Google SERP and News integration via ScraperAPI
  - GET requests to api.scraperapi.com
  - Features: Videos section, device type selection
  - No automatic time filtering (unlike Serper)

- **Custom Providers**: Create new providers by extending `WebSearchProvider`

**Custom Provider Example:**
```typescript
import WebSearchProvider from '@tokenring-ai/websearch';

class CustomSearchProvider extends WebSearchProvider {
  async searchWeb(query: string, options?: any): Promise<WebSearchResult> {
    // Implement custom search logic
    // Return structured results matching WebSearchResult interface
  }

  async searchNews(query: string, options?: any): Promise<NewsSearchResult> {
    // Implement custom news search logic
    // Return structured results matching NewsSearchResult interface
  }

  async fetchPage(url: string, options?: any): Promise<WebPageResult> {
    // Implement custom page fetching logic
    // Return markdown content and optional metadata
  }
}
```

**Provider Registration:**
```typescript
app.waitForService(WebSearchService, (websearchService) => {
  websearchService.registerProvider(new CustomSearchProvider(), 'custom');
});
```

## Best Practices

1. **Provider Selection**: Configure a default provider in `agentDefaults`, but allow per-agent overrides for specialized tasks

2. **Rate Limit Handling**: Implement proper timeout configurations and handle rate limit errors
   - Set reasonable timeouts for API calls
   - Implement retry logic with exponential backoff

3. **Result Normalization**: While result structures are provider-dependent, implement normalization in consumer code

4. **Security**: Handle API keys and credentials securely
   - Use environment variables for sensitive data
   - Never embed credentials in configuration files

5. **Performance Optimization**:
   - Use `deepSearch` with appropriate result counts
   - Implement caching for frequently accessed content
   - Consider parallel execution for independent operations

6. **Error Handling**:
   - Validate all inputs before API calls
   - Provide clear error messages for troubleshooting
   - Include error context (status codes, hints) for API failures

7. **Content Respect**:
   - Respect robots.txt and terms of service
   - Implement proper header handling for requests
   - Be mindful of volume limits and avoid excessive requests

8. **Testing**:
   - Test with multiple provider implementations to ensure consistency
   - Mock API responses for testing error conditions
   - Verify timeout and retry logic

9. **Agent State Management**: Use provider selection to differentiate behavior in different agent contexts

10. **Custom Result Sorting**: Use the `rerank` option in deep search for intelligent result prioritization

## Testing and Development

### Running Tests

```bash
bun test                    # Run all tests
bun test:watch              # Run tests in watch mode
bun test:coverage           # Run tests with coverage report
bun build                   # Verify build compiles without errors
```

### Test Structure

Tests use vitest with node environment, following the patterns established in other packages.

### Development Checklist

- [ ] Implement abstract methods in provider
- [ ] Validate all input parameters with Zod schemas
- [ ] Handle API rate limits with appropriate timeouts
- [ ] Implement proper error handling
- [ ] Add unit tests for core functionality
- [ ] Test with actual provider APIs if available
- [ ] Verify agent integration (state management, service access)
- [ ] Document configuration options
- [ ] Provide usage examples

## Dependencies

- `@tokenring-ai/app`: Application framework for plugin system
- `@tokenring-ai/agent`: Agent framework for state management and service access
- `@tokenring-ai/chat`: Chat functionality for tool registration
- `@tokenring-ai/utility`: Utility functions and HTTP service base class
- `@tokenring-ai/scripting`: Scripting service for global functions
- `zod`: Runtime type validation for configuration and inputs

## Limitations

- **Abstract Package**: No built-in search engine implementations
  - Requires concrete provider implementations for actual functionality
  - Result structures are provider-dependent; implement normalization in consumer code

- **Rate Limiting**: High-volume fetching may trigger API rate limits
  - Configure appropriate timeouts and retry logic
  - Respect provider constraints

- **Content Type**: Binary/non-text content not supported in page fetch operations

- **Result Deduplication**: No built-in result deduplication or similarity filtering

- **State Persistence**: Agent-level provider selection is maintained in agent state

## Related Components

- **Serper Web Search Provider**: `@tokenring-ai/serper`
- **ScraperAPI Web Search Provider**: `@tokenring-ai/scraperapi`
- **NewsRPM Service**: `pkg/newsrpm` - Alternative news aggregation service

## License

MIT License - see the root LICENSE file for details.
