# @tokenring-ai/chrome

## Overview

The `@tokenring-ai/chrome` package provides Chrome browser automation for Token Ring using Puppeteer. It enables AI agents to perform web searches, news searches, web scraping, and screenshot capture in a headless browser environment.

### Key Features

- Puppeteer-based headless Chrome browser automation
- Google web search integration via DOM parsing
- Google News search with article metadata extraction
- Web page scraping with HTML to Markdown conversion
- Page metadata extraction including JSON-LD structured data
- Visual screenshot capture with configurable viewport width
- Browser lifecycle management (launch vs connect)
- Custom Puppeteer script execution tool

## Usage Examples

### Basic Web Search

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import chromePlugin from "@tokenring-ai/chrome";

const app = new TokenRingApp();
app.install(chromePlugin, {
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true,
    },
  },
});

// Access provider through websearch service
const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search("TypeScript documentation", "chrome");
console.log("Organic results:", results.organic.map(r => r.title));
```

### Google News Search

```typescript
const news = await websearchService.searchNews("artificial intelligence", "chrome");
console.log("News articles:", news.news.length);
news.news.forEach(article => {
  console.log(`Title: ${article.title}`);
  console.log(`Source: ${article.source}`);
  console.log(`Date: ${article.date}`);
});
```

### Page Content Retrieval

```typescript
// Scraping web page content
const pageContent = await websearchService.fetchPage("https://example.com/article", "chrome", {
  render: true
});
console.log(pageContent.markdown.substring(0, 200) + "...");

// Non-rendered fetching (faster, no JavaScript)
const staticContent = await websearchService.fetchPage("https://example.com", "chrome", {
  render: false
});
```

### Using Tools Directly

```typescript
// Scrape text from a web page
const textResult = await agent.callTool("chrome_scrapePageText", {
  url: "https://example.com/blog/post",
  selector: "article.main-content",
  timeoutSeconds: 30
});

// Extract metadata from a web page
const metadata = await agent.callTool("chrome_scrapePageMetadata", {
  url: "https://example.com/article",
  timeoutSeconds: 30
});

// Capture a screenshot
const screenshot = await agent.callTool("chrome_takeScreenshot", {
  url: "https://example.com",
  screenWidth: 1024
});

// Execute custom Puppeteer script
const result = await agent.callTool("chrome_runPuppeteerScript", {
  script: `(async ({ page, browser, consoleLog }) => {
    await page.goto('https://example.com');
    const title = await page.title();
    consoleLog('Page title:', title);
    return { title, success: true };
  })`,
  timeoutSeconds: 30
});
```

## Core Properties

### Package Metadata

- **Name**: `@tokenring-ai/chrome`
- **Version**: 0.2.0
- **Description**: Chrome browser automation for Token Ring

### Configuration Properties

The package supports the following configuration:

- `chrome.agentDefaults.launch` (boolean, default: `true`) - Whether to launch a new browser instance
- `chrome.agentDefaults.headless` (boolean, default: `true`) - Whether to run browser in headless mode
- `chrome.agentDefaults.browserWSEndpoint` (string, optional) - WebSocket endpoint for connecting to existing browser
- `chrome.agentDefaults.executablePath` (string, optional) - Path to Chrome/Chromium executable

## Key Features

- Puppeteer-based headless Chrome browser automation
- Google web search integration via DOM parsing
- Google News search with article metadata extraction
- Web page scraping with HTML to Markdown conversion
- Page metadata extraction including JSON-LD structured data
- Visual screenshot capture with configurable viewport width
- Browser lifecycle management (launch vs connect)
- Custom Puppeteer script execution tool
- Agent state management for browser configuration

## Core Methods/API

### ChromeWebSearchProvider

#### searchWeb

Performs Google web search via Puppeteer browser.

```typescript
async searchWeb(
  query: string, 
  options?: WebSearchProviderOptions, 
  agent?: Agent
): Promise<WebSearchResult>
```

**Parameters:**
- `query` (required): Search query string
- `options` (optional): Web search options including `countryCode`
- `agent` (optional): Agent instance for browser access

**Returns:** `WebSearchResult` with organic search results

#### searchNews

Performs Google News search via Puppeteer browser.

```typescript
async searchNews(
  query: string, 
  options?: WebSearchProviderOptions, 
  agent?: Agent
): Promise<NewsSearchResult>
```

**Parameters:**
- `query` (required): Search query string
- `options` (optional): Search options including `countryCode`
- `agent` (optional): Agent instance for browser access

**Returns:** `NewsSearchResult` with news articles

#### fetchPage

Scrapes web page content using Puppeteer browser.

```typescript
async fetchPage(
  url: string, 
  options?: WebPageOptions, 
  agent?: Agent
): Promise<WebPageResult>
```

**Parameters:**
- `url` (required): URL of the page to fetch
- `options` (optional): Page options including `render` flag
- `agent` (optional): Agent instance for browser access

**Returns:** `WebPageResult` with markdown content

### ChromeService

#### getBrowser

Manages browser lifecycle and returns browser instance.

```typescript
async getBrowser(agent: Agent): Promise<Browser>
```

**Parameters:**
- `agent` (required): Agent instance

**Returns:** Puppeteer Browser instance

### ChromeState

#### serialize

Returns serialized state for persistence.

```typescript
serialize(): z.output<typeof serializationSchema>
```

**Returns:** Serialized state object

#### deserialize

Restores state from serialized data.

```typescript
deserialize(data: z.output<typeof serializationSchema>): void
```

**Parameters:**
- `data`: Serialized state object

#### show

Returns formatted string representation of state.

```typescript
show(): string[]
```

**Returns:** Array of state property descriptions

## Usage Examples

### Plugin Installation

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import chromePlugin from "@tokenring-ai/chrome";

const app = new TokenRingApp();
app.install(chromePlugin, {
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true,
    },
  },
});
```

### Connecting to Existing Browser

For production environments, connect to an existing browser to avoid launching overhead:

```typescript
app.install(chromePlugin, {
  chrome: {
    agentDefaults: {
      launch: false,
      browserWSEndpoint: "ws://localhost:9222/devtools/browser"
    }
  }
});
```

### Agent Configuration

```typescript
const agent = new Agent({
  name: "research-agent",
  config: {
    chrome: {
      launch: false,
      browserWSEndpoint: "ws://localhost:9222/devtools/browser",
    },
  },
});
```

### Using WebSearch Service

```typescript
const websearchService = app.requireService(WebSearchService);

// Perform web search
const results = await websearchService.search("TypeScript documentation", "chrome", {
  countryCode: "us"
});

// Perform news search
const news = await websearchService.searchNews("technology", "chrome", {
  countryCode: "us"
});

// Fetch page content
const content = await websearchService.fetchPage("https://example.com", "chrome", {
  render: true
});
```

## Configuration

### ChromeConfigSchema

```typescript
export const ChromeConfigSchema = z.object({
  agentDefaults: z.object({
    launch: z.boolean().default(true),
    headless: z.boolean().default(true),
    browserWSEndpoint: z.string().optional(),
    executablePath: z.string().optional(),
  }),
}).strict();
```

### ChromeAgentConfigSchema

```typescript
export const ChromeAgentConfigSchema = z.object({
  launch: z.boolean().optional(),
  headless: z.boolean().optional(),
  browserWSEndpoint: z.string().optional(),
  executablePath: z.string().optional(),
}).strict().default({});
```

### Example Configuration

```json
{
  "chrome": {
    "agentDefaults": {
      "launch": true,
      "headless": true
    }
  }
}
```

**Configuration Notes:**
- `launch: true` - Creates a new Puppeteer browser instance for each operation
- `launch: false` - Connects to an existing browser session (for production use with remote browser)
- `headless: true` - Runs browser in headless mode (default)
- `headless: false` - Runs browser with visible UI (useful for debugging)
- `browserWSEndpoint` - WebSocket endpoint for connecting to an existing browser (e.g., `ws://localhost:9222/devtools/browser`)
- `executablePath` - Custom path to Chrome/Chromium executable

## Integration

The Chrome plugin integrates with the following Token Ring services:

- **WebSearchService**: Registers ChromeWebSearchProvider as the 'chrome' provider
- **ChatService**: Registers tools (chrome_runPuppeteerScript, chrome_scrapePageText, chrome_scrapePageMetadata, chrome_takeScreenshot)
- **Agent System**: Enables agents to perform browser-based tasks via registered tools and configuration

### Service Registration Pattern

```typescript
// In plugin.ts
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // Register tools
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    // Register Chrome service
    if (config.chrome) {
      const chromeService = new ChromeService(config.chrome);
      app.addServices(chromeService);

      // Register websearch provider
      app.waitForService(WebSearchService, websearchService => {
        websearchService.registerProvider(
          'chrome',
          new ChromeWebSearchProvider(chromeService)
        );
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Best Practices

1. **Selector Selection**: When using `chrome_scrapePageText`, provide specific selectors for better results
2. **Timeout Management**: Set appropriate timeouts for slow-loading pages (5-180 seconds range)
3. **Resource Cleanup**: The tools handle browser cleanup automatically via finally blocks
4. **Error Handling**: Tools throw descriptive errors with the tool name prefix (e.g., "[chrome_scrapePageText]")
5. **Browser Reuse**: For multiple operations, consider reusing browser instances where possible
6. **Headless Mode**: The browser runs in headless mode by default for server-side usage
7. **Country Filtering**: Use country codes for more relevant search results in specific regions
8. **Render Options**: Use `render: true` for pages that depend on JavaScript, `false` for static pages (faster)
9. **Browser Launch**: Use `launch: false` in production to connect to existing browsers and reduce overhead
10. **Agent Configuration**: Use agent-level configuration to override default Chrome settings per agent
11. **State Persistence**: ChromeState automatically manages configuration state for agents
12. **Custom Scripts**: Use `chrome_runPuppeteerScript` for complex automation tasks that require custom logic
13. **Console Logging**: Use `consoleLog` function in custom scripts to capture debug output
14. **Screen Size**: Adjust `screenWidth` parameter in screenshots based on target device dimensions

## Testing

### Build and Test

```bash
# Type check
bun run build

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
    globals: true,
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
});
```

## Related Components

- **@tokenring-ai/websearch**: Web search service that ChromeWebSearchProvider integrates with
- **@tokenring-ai/chat**: Chat service that provides tool execution framework and defines TokenRingToolDefinition
- **@tokenring-ai/app**: Base application framework for plugin registration
- **@tokenring-ai/agent**: Agent system that can use the plugin's tools and configuration
- **Puppeteer**: Chrome browser automation library
- **Turndown**: HTML to Markdown conversion library

## License

MIT License - see the root LICENSE file for details.
