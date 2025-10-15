# Web Search Plugin

Abstract web search interface with pluggable providers, tools for search, news, and page fetching.

## Overview

The `@tokenring-ai/websearch` package provides an abstract interface for web search operations within the Token Ring AI agent system. It enables the registration and use of pluggable web search providers to perform web searches, news searches, and web page fetching. The package integrates with the `@tokenring-ai/agent` framework, offering tools and chat commands for seamless interaction.

## Key Features

- **Pluggable Provider Architecture**: Support for multiple search engines
- **Web Search**: General web search capabilities
- **News Search**: News-specific search functionality
- **Page Fetching**: Retrieve web page content
- **Localization**: Support for country codes, languages, and locations
- **Pagination**: Handle multiple pages of results

## Providers

The package includes support for multiple search providers:

- **Serper** (Google search via Serper.dev)
- **ScraperAPI** (Web scraping and SERP)
- **Chrome** (Puppeteer-based automation)

## Core Components

### WebSearchProvider (Abstract Class)

Abstract class defining the interface for search providers.

**Key Methods:**
- `searchWeb(query, options?)`: Performs general web search
  - Parameters: `query` (required), `options` (countryCode, language, location, num, page, timeout)
  - Returns: `{ results: any }`
- `searchNews(query, options?)`: Performs news-focused search
  - Similar to searchWeb but for recent news
- `fetchPage(url, options?)`: Fetches HTML content of a URL
  - Parameters: `url` (required), `options` (render, countryCode, timeout)
  - Returns: `{ html: string }`

### WebSearchService

Central hub for web search operations, implements `TokenRingService`.

**Key Methods:**
- `registerResource(provider, name)`: Registers a provider
- `setActiveResource(name)`: Sets the active provider
- `getActiveResource()`: Gets current active provider
- `getAvailableResources()`: Lists registered provider names
- `searchWeb(query, options?)`: Delegates to active provider
- `searchNews(query, options?)`: Delegates to active provider
- `fetchPage(url, options?)`: Delegates to active provider

### Tools

**searchWeb**: Executes a web search
- Input schema validates query and options
- Logs progress and returns `{ results? }`

**searchNews**: Similar to searchWeb but for news
- Returns news results

**fetchPage**: Fetches page HTML
- Validates URL, supports rendering
- Returns `{ html: string }`

### Chat Commands

**/websearch**: Interactive command for users
- Subcommands: `search <query>`, `news <query>`, `fetch <url>`, `provider`
- Supports flags: `--country`, `--num`, `--render`
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

Example workflows:
```bash
# Research workflow
/var $results = searchWeb("quantum computing")
/var $analysis = llm("Analyze these search results: $results")

# News aggregation
/var $news = searchNews("AI breakthroughs")
/var $summary = llm("Summarize these news articles: $news")

# Content extraction
/var $html = fetchPage("https://example.com/article")
/var $content = llm("Extract the main content from this HTML: $html")
```

## Usage Examples

### Registering a Provider

```typescript
import { Agent } from '@tokenring-ai/agent';
import { WebSearchService } from '@tokenring-ai/websearch';
import { GoogleSearchProvider } from './providers/GoogleSearchProvider';

const agent = new Agent();
const webSearchService = new WebSearchService();
agent.registerService(webSearchService);

const googleProvider = new GoogleSearchProvider({ apiKey: 'your-key' });
webSearchService.registerResource(googleProvider, 'google');
webSearchService.setActiveResource('google');

// Perform a search
const results = await webSearchService.searchWeb('Token Ring AI', { num: 5 });
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

### Chat Command

```bash
/websearch search "web search APIs" --num 10 --language en
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

## Dependencies

- `@tokenring-ai/agent@^0.1.0`: Core agent framework and types
- `@tokenring-ai/scripting@^0.1.0`: Optional, for global functions
- `zod@^4.0.17`: Schema validation for tool inputs
- Internal utilities from `@tokenring-ai/utility`
