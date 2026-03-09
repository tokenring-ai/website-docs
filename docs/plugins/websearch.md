# @tokenring-ai/websearch

Plugin: Search and Content Retrieval

## Overview and Purpose

The `@tokenring-ai/websearch` package provides a comprehensive web search interface for the Token Ring AI ecosystem. It serves as an abstract service layer that enables agents to query the web dynamically, process search results, and fetch content for tasks like research, data gathering, and real-time information retrieval.

As a core abstract interface package, this defines the contract that concrete search provider implementations must follow. It integrates seamlessly with the Token Ring framework through its plugin system, offering:

- **Four interactive tools** for agent operations (`websearch_searchWeb`, `websearch_searchNews`, `websearch_fetchPage`, `websearch_deepSearch`)
- **Agent command interface** for CLI-based operations (`/websearch` with 8 subcommands)
- **Four global scripting functions** accessible through the scripting service
- **Service layer integration** with provider registry and state management
- **Deep search with custom reranking** for advanced result processing

## Key Features

- **Abstract Provider Interface**: Defines the contract for search providers to implement
- **Multi-Provider Support**: Registry system for managing multiple search provider implementations
- **Comprehensive Search Operations**: Web search, news search, page fetching, and deep search
- **Agent State Management**: Persistent provider selection per agent via `WebSearchState`
- **Interactive Tools**: Four agent-usable tools with Zod schema validation
- **CLI Commands**: Full-featured `/websearch` command with 8 subcommands and options
- **Scripting Functions**: Global functions for LLM access to search capabilities
- **Configurable Options**: Country/region targeting, language localization, pagination
- **Error Handling**: Proper validation with `CommandFailedError` and standardized error responses
- **Deep Search with Reranking**: Custom result sorting support via optional `rerank` function
- **Parallel Execution**: Deep search executes web and news searches in parallel for performance

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

**Component Types:**

```typescript
interface KnowledgeGraph {
  position?: number;
  title: string;
  type: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record<string, string>;
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

interface Sitelink {
  title: string;
  link: string;
}

interface PeopleAlsoAsk {
  question: string;
  snippet: string;
  title: string;
  link: string;
}

interface RelatedSearch {
  position?: number;
  query: string;
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

**Service Name**: `WebSearchService`

**Service Description**: `Service for Web Search`

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

1. Execute web search with `searchCount` configured results (if `searchCount > 0`)
2. Execute news search with `newsCount` configured results (if `newsCount > 0`)
3. Both searches run in parallel using `Promise.all()` for performance
4. Apply custom reranking function if provided (`options.rerank`)
5. Fetch top `fetchCount` results using `fetchPage` with markdown extraction
6. Return combined results with web results, news articles, and fetched page content
7. Pages that fail to fetch are silently excluded from results (returns filtered array)

**Error Handling:**

- `requireActiveProvider()` throws `Error` if no provider is set for the agent
- All search methods require an active provider to be configured
- Network errors from providers are propagated up to the caller

### Tools

The package provides four interactive tools that agents can use:

#### websearch_searchWeb

Search the web using the active web search provider.

**Location**: `pkg/websearch/tools/searchWeb.ts`

**Input Schema:**

```typescript
z.object({
  query: z.string().min(1).describe("Search query"),
  countryCode: z.string().optional().describe("Country code"),
  language: z.string().optional().describe("Language code"),
  location: z.string().optional().describe("Location string"),
  num: z.number().int().positive().optional().describe("Number of results"),
  page: z.number().int().positive().optional().describe("Page number"),
})
```

**Execution:**
- Requires `WebSearchService` from agent
- Calls `searchWeb` with provided options
- Returns `TokenRingToolJSONResult<WebSearchResult>`
- Logs info message: `[websearch_searchWeb] Searching: <query>`

#### websearch_searchNews

Search for news articles using the active web search provider.

**Location**: `pkg/websearch/tools/searchNews.ts`

**Input Schema:**

```typescript
z.object({
  query: z.string().min(1).describe("News search query"),
  countryCode: z.string().optional().describe("Country code"),
  language: z.string().optional().describe("Language code"),
  location: z.string().optional().describe("Location string"),
  num: z.number().int().positive().optional().describe("Number of results"),
  page: z.number().int().positive().optional().describe("Page number"),
})
```

**Execution:**
- Requires `WebSearchService` from agent
- Calls `searchNews` with provided options
- Returns `TokenRingToolJSONResult<NewsSearchResult>`
- Logs info message: `[websearch_searchNews] Searching news: <query>`

#### websearch_fetchPage

Fetch the content of a web page using the active web search provider.

**Location**: `pkg/websearch/tools/fetchPage.ts`

**Input Schema:**

```typescript
z.object({
  url: z.string().describe("URL to fetch"),
  render: z.boolean().optional().describe("Enable JavaScript rendering"),
  countryCode: z.string().optional().describe("Country code"),
})
```

**Execution:**
- Requires `WebSearchService` from agent
- Calls `fetchPage` with provided options
- Returns `TokenRingToolJSONResult<{ markdown: string, metadata?: Record<string, any> }>`
- Logs info message: `[websearch_fetchPage] Fetching: <url>`

#### websearch_deepSearch

Perform a comprehensive deep search that combines web search, news search, and page fetching for top results.

**Location**: `pkg/websearch/tools/deepSearch.ts`

**Input Schema:**

```typescript
z.object({
  query: z.string().min(1).describe("A short search query to perform"),
  searchCount: z.number().int().positive().optional().describe("Number of general search results links to include. Should be set to 0 or a low number if the search is for news"),
  newsCount: z.number().int().positive().optional().describe("Number of news articles to search for"),
  fetchCount: z.number().int().positive().optional().describe("Number of pages to fetch full page content for (default: 5)"),
  countryCode: z.string().optional().describe("Country code"),
  language: z.string().optional().describe("Language code"),
  location: z.string().optional().describe("Location string"),
})
```

**Execution:**
- Requires `WebSearchService` from agent
- Performs parallel web and news searches
- Fetches content from top results
- Returns `TokenRingToolJSONResult<{ results: any[], news: any[], pages: Array<{ url: string; markdown: string }> }>`
- Logs info message with search parameters

### Services

The plugin registers `WebSearchService` which implements the `TokenRingService` interface:

**Service Registration Pattern:**

```typescript
app.registerPlugin(websearch, {
  websearch: {
    providers: { /* provider configs */ },
    agentDefaults: { provider: 'default-provider' }
  }
});
```

The service is automatically attached to agents during initialization, where it:
- Merges global defaults with agent-specific configuration
- Initializes the agent's `WebSearchState` with the configured provider
- Makes the service available via `agent.requireServiceByType(WebSearchService)`

## Provider Documentation

This package uses a provider architecture pattern where concrete implementations extend the abstract `WebSearchProvider` class. Providers are registered with the `WebSearchService` and can be selected per-agent.

**KeyedRegistry Pattern:**

The service uses `KeyedRegistry<WebSearchProvider>` from `@tokenring-ai/utility` to manage provider instances by name.

**Provider Registration:**

```typescript
app.waitForService(WebSearchService, (websearchService) => {
  websearchService.registerProvider(new SerperWebSearchProvider(), 'serper');
  websearchService.registerProvider(new ScraperAPIWebSearchProvider(), 'scraperapi');
});
```

**Provider Selection:**
- Agents can have different active providers via state management
- Default provider is configured in `agentDefaults.provider`
- Agent-specific overrides via `agent.getAgentConfigSlice('websearch', WebSearchAgentConfigSchema)`
- Interactive selection via `/websearch provider select` command

**Provider Requirements:**
- Must implement all three abstract methods: `searchWeb`, `searchNews`, `fetchPage`
- Must return properly structured result objects matching the type definitions
- Should handle their own error handling and timeout management

## RPC Endpoints

This package does not define RPC endpoints directly. Provider implementations may define their own RPC endpoints for external access.

## Chat Commands

The plugin provides comprehensive chat commands for interactive web search operations. All commands are prefixed with `/websearch`.

### `/websearch search <query>`

Perform a general web search.

**Options:**
- `--country <code>` - Country code for localized results (e.g., 'us', 'uk', 'de')
- `--language <code>` - Language code for content (e.g., 'en', 'es', 'fr')
- `--location <name>` - Location name for geo-targeted results
- `--num <n>` - Number of results to return
- `--page <n>` - Page number for pagination

**Example:**

```bash
/websearch search typescript tutorial
/websearch search restaurants --location 'New York' --country us
```

**Response:** Returns search results as JSON (truncated to 500 characters)

**Error Handling:**
- Throws `CommandFailedError` if query is empty
- Error message: `Usage: /websearch search <query> [flags]`

### `/websearch news <query>`

Search for news articles.

**Options:**
- `--country <code>` - Country code for localized results
- `--language <code>` - Language code for content
- `--location <name>` - Location name for geo-targeted results
- `--num <n>` - Number of results to return
- `--page <n>` - Page number for pagination

**Example:**

```bash
/websearch news artificial intelligence
/websearch news cryptocurrency --num 5
```

**Response:** Returns news results as JSON (truncated to 500 characters)

**Error Handling:**
- Throws `CommandFailedError` if query is empty
- Error message: `Usage: /websearch news <query> [flags]`

### `/websearch fetch <url>`

Fetch and extract content from a specific web page as markdown.

**Options:**
- `--country <code>` - Country code for localized results
- `--render` - Enable JavaScript rendering for dynamic content

**Example:**

```bash
/websearch fetch https://example.com
/websearch fetch https://example.com --render
```

**Response:** Returns the number of characters fetched

**Error Handling:**
- Throws `CommandFailedError` if URL is empty
- Error message: `Usage: /websearch fetch <url> [flags]`

### `/websearch deep <query>`

Perform comprehensive search with content fetching.

**Options:**
- `--search <n>` - Number of web search results (default: 10)
- `--news <n>` - Number of news results (default: 0)
- `--fetch <n>` - Number of pages to fetch (default: 5)
- `--country <code>` - Country code for localized results
- `--language <code>` - Language code for content
- `--location <name>` - Location name for geo-targeted results

**Example:**

```bash
/websearch deep quantum computing
/websearch deep artificial intelligence --search 20 --news 5 --fetch 10
```

**Response:** Generates an artifact output with formatted markdown containing:
- Search options summary
- Web results (title, URL, snippet)
- News results (title, link, snippet)
- Fetched pages summary (URL, character count)

**Error Handling:**
- Throws `CommandFailedError` if query is empty
- Error message: `Usage: /websearch deep <query> [flags]`

### `/websearch provider get`

Display the currently active web search provider.

**Example:**

```bash
/websearch provider get
```

**Response:** `Current provider: <provider-name>` or `Current provider: (none)`

### `/websearch provider set <name>`

Set the active web search provider by name.

**Example:**

```bash
/websearch provider set serper
```

**Response:** `Provider set to: <name>` or error if provider not found

**Available Providers:** Shows list of registered providers if specified provider doesn't exist

**Error Handling:**
- Throws `CommandFailedError` if provider name is empty
- Error message: `Usage: /websearch provider set <name>`

### `/websearch provider select`

Interactively select the active web search provider. Auto-selects if only one provider is configured.

**Behavior:**
- If no providers registered: Returns "No web search providers are registered."
- If only one provider: Auto-selects and returns `Only one provider configured, auto-selecting: <name>`
- If multiple providers: Opens interactive tree selection with current provider marked

**Example:**

```bash
/websearch provider select
```

**Response:** `Active provider set to: <name>` or "Provider selection cancelled."

**Implementation Details:**
- Uses `agent.askQuestion()` with `treeSelect` question type
- Shows current provider marked with "(current)" suffix
- Supports cancellation via empty selection

### `/websearch provider reset`

Reset the active web search provider to the initial configured value.

**Example:**

```bash
/websearch provider reset
```

**Response:** `Provider reset to <initial-provider>` or error if no initial provider configured

**Error Handling:**
- Throws `CommandFailedError` if no initial provider is configured
- Error message: `No initial provider configured`

## Configuration

### Application Configuration

The plugin requires configuration to enable provider implementations. Configuration is loaded using the `WebSearchConfigSchema`:

```typescript
import { WebSearchConfigSchema } from '@tokenring-ai/websearch';

const config = {
  websearch: {
    providers: {
      "serper": {
        type: "SerperWebSearchProvider",
        apiKey: process.env.SERPER_API_KEY
      },
      "scraperapi": {
        type: "ScraperAPIWebSearchProvider",
        apiKey: process.env.SCRAPERAPI_KEY
      }
    },
    agentDefaults: {
      provider: "serper"  // Default provider for all agents
    }
  }
};
```

**Configuration Schema:**

```typescript
export const WebSearchConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),  // Provider configurations
  agentDefaults: z.object({
    provider: z.string()  // Required default provider
  })
});
```

### Agent Configuration

Individual agents can override the default provider configuration:

```typescript
const agentConfig = {
  websearch: {
    provider: "scraperapi"  // Override default for this agent only
  }
};
```

**Agent Configuration Schema:**

```typescript
export const WebSearchAgentConfigSchema = z.object({
  provider: z.string().optional()
}).default({});
```

## Integration

### Agent Integration

Agents can access the web search service directly through dependency injection:

```typescript
// In agent task execution
const webSearchService = agent.requireServiceByType(WebSearchService);
const results = await webSearchService.searchWeb('latest AI research', { num: 10 }, agent);
```

### Scripting Integration

The plugin automatically registers four global scripting functions when the scripting service is available:

- `searchWeb(query: string)`: Performs a web search and returns JSON results as string
- `searchNews(query: string)`: Performs a news search and returns JSON results as string
- `fetchPage(url: string)`: Fetches page markdown content as string
- `deepSearch(query: string, searchCount?, newsCount?, fetchCount?)`: Performs comprehensive deep search and returns JSON results as string

**Example:**

```javascript
// In a script context
const searchResults = await searchWeb('typescript best practices');
const newsResults = await searchNews('AI developments');
const content = await fetchPage('https://example.com');
const deep = await deepSearch('machine learning', '10', '5', '5');

console.log('Search results:', JSON.parse(searchResults));
console.log('News results:', JSON.parse(newsResults));
console.log('Page content length:', content.length);
```

**Note:** Numeric parameters are passed as strings and parsed internally.

### Provider Integration

This package is designed to work with concrete provider implementations:

- **@tokenring-ai/serper**: Google Search and News via Serper.dev API
- **@tokenring-ai/scraperapi**: Google SERP and News via ScraperAPI
- **Custom Providers**: Extend `WebSearchProvider` abstract class

**Custom Provider Registration:**

```typescript
import WebSearchProvider, {
  WebSearchResult,
  NewsSearchResult,
  WebPageResult
} from '@tokenring-ai/websearch';

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

// Register the provider
app.waitForService(WebSearchService, (websearchService) => {
  websearchService.registerProvider(new CustomSearchProvider(), 'custom');
});
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
const searchResults = await searchWeb("latest AI research");
// Returns: JSON string with WebSearchResult

// News search
const news = await searchNews("technology news");
// Returns: JSON string with NewsSearchResult

// Fetch page
const markdownContent = await fetchPage("https://example.com");
// Returns: Markdown string

// Deep search
const comprehensive = await deepSearch("machine learning breakthroughs", "15", "5", "3");
// Returns: JSON string with DeepSearchResult
```

### Deep Search with Custom Reranking

```typescript
const webSearchService = agent.requireServiceByType(WebSearchService);

const results = await webSearchService.deepSearch('machine learning', {
  searchCount: 20,
  newsCount: 5,
  fetchCount: 10,
  rerank: async (results) => {
    // Custom reranking logic - prioritize recent results
    return results.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }
}, agent);

console.log(`Found ${results.results.length} web results, ${results.news.length} news results`);
console.log(`Fetched ${results.pages.length} pages`);
```

### Agent State Management

```typescript
// Get current active provider
const state = agent.getState(WebSearchState);
console.log('Active provider:', state.provider);
console.log('Initial provider:', state.initialConfig.provider);

// Switch providers
webSearchService.setActiveProvider('scraperapi', agent);

// Reset to initial provider
webSearchService.setActiveProvider(state.initialConfig.provider, agent);

// Display state
console.log(state.show()); // ['Active Provider: scrpaerapi']
```

## Best Practices

1. **Provider Selection**: Configure a default provider in `agentDefaults`, but allow per-agent overrides for specialized tasks

2. **Rate Limit Handling**: Implement proper timeout configurations and handle rate limit errors
   - Set reasonable timeouts for API calls
   - Implement retry logic with exponential backoff in provider implementations

3. **Result Normalization**: While result structures are provider-dependent, implement normalization in consumer code

4. **Security**: Handle API keys and credentials securely
   - Use environment variables for sensitive data
   - Never embed credentials in configuration files

5. **Performance Optimization**:
   - Use `deepSearch` with appropriate result counts
   - Implement caching for frequently accessed content
   - Consider parallel execution for independent operations
   - Deep search already uses `Promise.all()` for web and news searches

6. **Error Handling**:
   - Validate all inputs before API calls
   - Provide clear error messages for troubleshooting
   - Include error context (status codes, hints) for API failures
   - Handle `CommandFailedError` for command operations

7. **Content Respect**:
   - Respect robots.txt and terms of service
   - Implement proper header handling for requests
   - Be mindful of volume limits and avoid excessive requests

8. **Testing**:
   - Test with multiple provider implementations to ensure consistency
   - Mock API responses for testing error conditions
   - Verify timeout and retry logic
   - Test state persistence and restoration

9. **Agent State Management**: Use provider selection to differentiate behavior in different agent contexts

10. **Custom Result Sorting**: Use the `rerank` option in deep search for intelligent result prioritization

11. **Deep Search Optimization**: Set `searchCount` to 0 for news-only searches to avoid irrelevant web results

12. **Provider Registration**: Always register providers before agents attempt to use the service

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

### Package Structure

```
pkg/websearch/
├── index.ts                 # Main exports (WebSearchService, WebSearchProvider, schemas)
├── plugin.ts                # TokenRingPlugin registration
├── WebSearchService.ts      # Core service implementation
├── WebSearchProvider.ts     # Abstract base class definition
├── schema.ts                # Zod schema definitions
├── tools.ts                 # Barrel export for all tools
├── commands.ts              # Chat command exports
├── state/
│   └── webSearchState.ts    # Agent state slice
├── tools/                   # Individual tool implementations
│   ├── searchWeb.ts         # Web search tool (websearch_searchWeb)
│   ├── searchNews.ts        # News search tool (websearch_searchNews)
│   ├── fetchPage.ts         # Page fetch tool (websearch_fetchPage)
│   └── deepSearch.ts        # Deep search tool (websearch_deepSearch)
└── commands/                # Chat command implementations
    └── websearch/
        ├── search.ts        # /websearch search <query>
        ├── news.ts          # /websearch news <query>
        ├── fetch.ts         # /websearch fetch <url>
        ├── deep.ts          # /websearch deep <query>
        └── provider/
            ├── get.ts       # /websearch provider get
            ├── set.ts       # /websearch provider set <name>
            ├── select.ts    # /websearch provider select
            └── reset.ts     # /websearch provider reset
```

## Dependencies

- `@tokenring-ai/app`: Application framework for plugin system
- `@tokenring-ai/agent`: Agent framework for state management and service access
- `@tokenring-ai/chat`: Chat functionality for tool registration
- `@tokenring-ai/utility`: Utility functions and KeyedRegistry
- `@tokenring-ai/scripting`: Scripting service for global functions
- `zod`: Runtime type validation for configuration and inputs (^4.3.6)

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

- **Silent Failures**: Pages that fail to fetch in deep search are silently excluded from results

- **Provider Dependency**: All operations require an active provider to be configured and selected

## Related Components

- **Serper Web Search Provider**: `@tokenring-ai/serper`
- **ScraperAPI Web Search Provider**: `@tokenring-ai/scraperapi`
- **NewsRPM Service**: `pkg/newsrpm` - Alternative news aggregation service
- **@tokenring-ai/agent**: Core agent system for service integration
- **@tokenring-ai/chat**: Chat interface for tools and commands
- **@tokenring-ai/scripting**: Scripting service for native function execution
- **@tokenring-ai/app**: Base application framework with plugin system
- **@tokenring-ai/utility**: Utility functions and KeyedRegistry

## License

MIT License - see the root LICENSE file for details.
