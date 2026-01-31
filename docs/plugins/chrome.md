# Chrome Plugin

## Overview

The Chrome Plugin provides browser automation capabilities for Token Ring using Puppeteer. It integrates with the WebSearchService to provide Chrome-based web search and news search providers, and adds tools for web scraping via the chat service. The plugin manages browser lifecycle through ChromeService and provides state management via ChromeState for agent configuration.

## Key Features

- **Browser Automation**: Full Puppeteer integration for Chrome/Chromium browser control
- **Web Search Provider**: Chrome-based web search and news search using Google
- **Web Scraping Tools**: Three specialized tools for extracting text, metadata, and screenshots
- **Agent Integration**: Deep integration with the agent system for configuration and state management
- **Flexible Configuration**: Support for launching new browsers or connecting to existing ones
- **Headless Mode**: Default headless operation for server-side usage
- **State Persistence**: ChromeState for agent configuration and state management
- **Markdown Conversion**: Automatic HTML to Markdown conversion for scraped content

## Package Information

- **Name**: `@tokenring-ai/chrome`
- **Version**: 0.2.0
- **Description**: Chrome browser automation for Token Ring
- **License**: MIT

## Installation

Install the package via npm:

```bash
npm install @tokenring-ai/chrome
```

Or using bun:

```bash
bun add @tokenring-ai/chrome
```

## Configuration

The plugin supports configuration via the `chrome` section of the app config. It registers Chrome-based WebSearchProvider instances that use Puppeteer for browser automation.

```typescript
import { TokenRingApp } from '@tokenring-ai/app';

const app = new TokenRingApp({
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true,
    },
  },
});
```

### Plugin Configuration Schema

The plugin configuration schema is defined in `plugin.ts`:

```typescript
import { z } from 'zod';

const ChromeConfigSchema = z.object({
  agentDefaults: z.object({
    launch: z.boolean().default(true),
    headless: z.boolean().default(true),
    browserWSEndpoint: z.string().optional(),
    executablePath: z.string().optional(),
  }),
}).strict();

const packageConfigSchema = z.object({
  chrome: ChromeConfigSchema.optional(),
});
```

### Chrome Agent Configuration Schema

Zod schema for agent-level Chrome configuration:

```typescript
import { ChromeAgentConfigSchema } from '@tokenring-ai/chrome';

const agentConfig = ChromeAgentConfigSchema.parse({
  launch: true,
  headless: true,
  browserWSEndpoint: 'ws://localhost:9222/devtools/browser',
  executablePath: '/usr/bin/google-chrome',
});
```

**Schema Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `launch` | boolean | `true` | Whether to launch a new browser instance. If false, connects to an existing browser |
| `headless` | boolean | `true` | Run browser in headless mode |
| `browserWSEndpoint` | string | `undefined` | WebSocket endpoint for connecting to existing browser |
| `executablePath` | string | `undefined` | Path to Chrome/Chromium executable |

### Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chrome.agentDefaults.launch` | boolean | `true` | Default browser launch behavior |
| `chrome.agentDefaults.headless` | boolean | `true` | Default headless mode |
| `chrome.agentDefaults.browserWSEndpoint` | string | `undefined` | WebSocket endpoint for existing browser |
| `chrome.agentDefaults.executablePath` | string | `undefined` | Path to Chrome executable |

### Example Configuration

```typescript
import { TokenRingApp } from '@tokenring-ai/app';

const app = new TokenRingApp({
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true,
    },
  },
});
```

### Agent-Level Configuration

Agents can override the default Chrome configuration:

```typescript
import { Agent } from '@tokenring-ai/agent';

const agent = new Agent({
  name: 'my-agent',
  config: {
    chrome: {
      launch: false,
      browserWSEndpoint: 'ws://localhost:9222/devtools/browser',
    },
  },
});
```

## Core Components

### ChromeService

The `ChromeService` class manages browser lifecycle and provides browser instances to other components.

**Constructor:**

```typescript
constructor(options: z.output<typeof ChromeConfigSchema>)
```

**Options:**

```typescript
interface ChromeServiceOptions {
  agentDefaults: {
    launch: boolean;
    headless: boolean;
    browserWSEndpoint?: string;
    executablePath?: string;
  };
}
```

**Methods:**

#### attach

Attaches the service to an agent and initializes ChromeState.

```typescript
attach(agent: Agent): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent` | Agent | The agent to attach to |

**Returns:** `void`

**Notes:**

- Merges default configuration with agent-specific configuration
- Initializes ChromeState with merged configuration
- Uses deepMerge to combine configurations

#### getBrowser

Manages browser lifecycle based on launch option.

```typescript
async getBrowser(agent: Agent): Promise<Browser>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent` | Agent | The agent to get browser for |

**Returns:** `Promise<Browser>` - Puppeteer browser instance

**Notes:**

- If `launch: true`: Creates new Puppeteer browser instance
- If `launch: false`: Connects to existing browser session
- Returns browser instance for the operation

### ChromeWebSearchProvider

The `ChromeWebSearchProvider` class implements the `WebSearchProvider` interface from `@tokenring-ai/websearch`. It uses Puppeteer to interact with websites for searching and content fetching.

**Constructor:**

```typescript
constructor(private chromeService: ChromeService)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `chromeService` | ChromeService | ChromeService instance to use for browser operations |

**Methods:**

#### searchWeb

Perform a web search and return organic results.

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<WebSearchResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query |
| `options` | WebSearchProviderOptions (optional) | Search options including `countryCode` |
| `agent` | Agent (optional) | Agent instance for browser access |

**Returns:**

```typescript
{
  organic: WebSearchResult[];  // Array of organic search results
}
```

**Notes:**

- Uses Google search results
- Parses organic search results from the search page
- Extracts title, link, and snippet for each result
- Returns results in order of appearance
- Uses `[data-ved] h3` selectors for results
- Uses `[data-sncf]` for snippets
- Uses `networkidle0` wait condition for page loading
- Browser is launched, used, and disconnected for each request

#### searchNews

Perform a news search and return news articles.

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions, agent?: Agent): Promise<NewsSearchResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query |
| `options` | WebSearchProviderOptions (optional) | Search options including `countryCode` |
| `agent` | Agent (optional) | Agent instance for browser access |

**Returns:**

```typescript
{
  news: NewsSearchResult[];  // Array of news articles
}
```

**NewsSearchResult Structure:**

```typescript
{
  position: number;
  title: string;
  link: string;
  snippet: string;
  source: string;
  date: string;
}
```

**Notes:**

- Uses Google news search results
- Parses news article containers using `[data-news-doc-id]` attribute
- Extracts title using `[role="heading"]` or `[aria-level]` selectors
- Extracts snippet from divs, excluding those with `[data-ved]` or `[data-hveid]` attributes
- Extracts source from spans near images with `[alt=""]` or `[data-atf]` attributes
- Extracts date from `[data-ts]` or specific span elements
- Filters out empty results where title or link is missing
- Uses `networkidle0` wait condition for page loading

#### fetchPage

Fetch a page and convert HTML to Markdown.

```typescript
async fetchPage(url: string, options?: WebPageOptions, agent?: Agent): Promise<WebPageResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL to fetch |
| `options` | WebPageOptions (optional) | Page options including `render` |
| `agent` | Agent (optional) | Agent instance for browser access |

**Returns:**

```typescript
{
  markdown: string;  // HTML content converted to Markdown
}
```

**Notes:**

- Uses TurndownService to convert HTML to Markdown
- Supports both rendered and non-rendered page fetching via `render` option
- `render: true` waits for `networkidle0` state
- `render: false` only waits for `domcontentloaded` state
- Browser is launched, used, and disconnected for each request

### ChromeState

The `ChromeState` class implements `AgentStateSlice` for managing Chrome configuration state.

**Constructor:**

```typescript
constructor(readonly initialConfig: z.output<typeof ChromeConfigSchema>["agentDefaults"])
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | State slice name |
| `serializationSchema` | z.ZodSchema | Schema for serialization |
| `launch` | boolean | Browser launch flag |
| `headless` | boolean | Headless mode flag |
| `browserWSEndpoint` | string | WebSocket endpoint |
| `executablePath` | string | Executable path |

**Methods:**

#### reset

Resets state based on specified criteria.

```typescript
reset(what: ResetWhat[]): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `what` | ResetWhat[] | Array of reset criteria |

**Returns:** `void`

#### serialize

Serializes state to plain object.

```typescript
serialize(): z.output<typeof serializationSchema>
```

**Returns:** Plain object with state properties

#### deserialize

Deserializes state from plain object.

```typescript
deserialize(data: z.output<typeof serializationSchema>): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | Plain object | State data to deserialize |

**Returns:** `void`

#### show

Returns human-readable representation of state.

```typescript
show(): string[]
```

**Returns:** Array of state property descriptions

## Tools

The plugin exposes three tools with the ChatService:

### chrome_scrapePageText

Scrape text content from a web page using Puppeteer. By default, it prioritizes content from 'article', 'main', or 'body' tags in that order.

**Tool Definition:**

```typescript
const name = "chrome_scrapePageText";
const displayName = "Chrome/scrapePageText";
```

**Input Schema:**

```typescript
const inputSchema = z.object({
  url: z
    .string()
    .describe("The URL of the web page to scrape text from."),
  timeoutSeconds: z
    .number()
    .int()
    .min(5)
    .max(180)
    .describe("(Optional) Timeout for the scraping operation (default 30s, max 180s).")
    .optional(),
  selector: z
    .string()
    .describe("(Optional) Custom CSS selector to target specific content. If not provided, will use 'article', 'main', or 'body' in that priority order.")
    .optional(),
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL of the web page to scrape text from |
| `timeoutSeconds` | number | No | Timeout for the scraping operation (default: 30s, min: 5s, max: 180s) |
| `selector` | string | No | Custom CSS selector to target specific content. If not provided, will use 'article', 'main', or 'body' in that priority order |

**Returns:**

```typescript
{
  text: string;        // Extracted text content
  sourceSelector: string; // The selector that was used
  url: string;         // Original URL
}
```

**Example:**

```typescript
const result = await tools.chrome_scrapePageText({
  url: 'https://example.com/article',
  selector: 'article',
  timeoutSeconds: 60,
});
console.log(result.text);
console.log(result.sourceSelector);
console.log(result.url);
```

### chrome_scrapePageMetadata

Loads a web page and extracts metadata from the `<head>` tag and any JSON-LD (Schema.org) blocks found in the document.

**Tool Definition:**

```typescript
const name = "chrome_scrapePageMetadata";
const displayName = "Chrome/scrapePageMetadata";
```

**Input Schema:**

```typescript
const inputSchema = z.object({
  url: z
    .string()
    .describe("The URL of the web page to scrape metadata from."),
  timeoutSeconds: z
    .number()
    .int()
    .min(5)
    .max(180)
    .describe("(Optional) Timeout for the operation (default 30s).")
    .optional(),
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL of the web page to scrape metadata from |
| `timeoutSeconds` | number | No | Timeout for the operation (default: 30s, min: 5s, max: 180s) |

**Returns:**

```typescript
{
  type: "json";
  data: {
    headHtml: string;    // HTML from head tag (with scripts/styles omitted)
    jsonLd: any[];       // Array of JSON-LD structured data blocks
    url: string;         // Original URL
  }
}
```

**Example:**

```typescript
const result = await tools.chrome_scrapePageMetadata({
  url: 'https://example.com',
  timeoutSeconds: 45,
});
console.log(result.data.headHtml);
console.log(result.data.jsonLd);
console.log(result.data.url);
```

### chrome_takeScreenshot

Captures a visual screenshot of a web page at a specific width.

**Tool Definition:**

```typescript
const name = "chrome_takeScreenshot";
const displayName = "Chrome/takeScreenshot";
```

**Input Schema:**

```typescript
const inputSchema = z.object({
  url: z
    .string()
    .describe("The URL of the web page to screenshot."),
  screenWidth: z
    .number()
    .int()
    .min(300)
    .max(1024)
    .default(1024)
    .describe("The width of the browser viewport in pixels (min 300, max 1024)."),
});
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The URL of the web page to screenshot |
| `screenWidth` | number | No | `1024` | The width of the browser viewport in pixels (min: 300, max: 1024) |

**Returns:**

```typescript
{
  type: 'media';
  mediaType: 'image/png';
  data: string;  // Base64-encoded PNG image
}
```

**Example:**

```typescript
const result = await tools.chrome_takeScreenshot({
  url: 'https://example.com',
  screenWidth: 1280,
});
console.log(result.data);  // Base64 PNG image
```

## Usage Examples

### Plugin Installation

The plugin automatically installs through the `install(app, config)` method in `plugin.ts`. To use it:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';

const app = new TokenRingApp({
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
const app = new TokenRingApp({
  chrome: {
    agentDefaults: {
      launch: false,
      browserWSEndpoint: "ws://localhost:9222/devtools/browser", // Puppeteer remote debugging
    },
  },
});
```

**Note:** Requires Puppeteer to be launched with `--remote-debugging-port=9222` flag.

### Using Tools via Chat

The plugin provides tools that can be used by agents through the ChatService:

```typescript
import { ChatService } from '@tokenring-ai/chat';
import tools from '@tokenring-ai/chrome/tools';

async function runScrapingTask() {
  // The chat service will automatically handle tool execution
  const result = await tools.chrome_scrapePageText({
    url: 'https://example.com',
  });

  return result.text;
}
```

### Direct WebSearchService Usage

```typescript
import { WebSearchService } from '@tokenring-ai/websearch';
import ChromeWebSearchProvider from '@tokenring-ai/chrome/ChromeWebSearchProvider';

const webSearch = new WebSearchService();
const chromeProvider = new ChromeWebSearchProvider(chromeService);
webSearch.registerProvider('chrome', chromeProvider);

// Web search
const results = await webSearch.searchWeb('TypeScript documentation', {
  countryCode: 'us'
});
console.log(results.organic.map(r => r.title));

// News search
const newsResults = await webSearch.searchNews('technology news', {
  countryCode: 'us'
});
console.log(newsResults.news.map(n => n.title));

// Fetch and convert page to Markdown
const pageContent = await webSearch.fetchPage('https://example.com/article', {
  render: true
});
console.log(pageContent.markdown);
```

### Agent Configuration Example

```typescript
import { Agent } from '@tokenring-ai/agent';
import { TokenRingApp } from '@tokenring-ai/app';

const app = new TokenRingApp({
  chrome: {
    agentDefaults: {
      launch: true,
      headless: true,
    },
  },
});

const agent = new Agent({
  name: 'research-agent',
  config: {
    chrome: {
      launch: false,
      browserWSEndpoint: 'ws://localhost:9222/devtools/browser',
    },
  },
});

// Agent will use ChromeService with its configuration
```

## Integration

The Chrome Plugin integrates with the following Token Ring services:

- **WebSearchService**: Registers as a provider for the 'chrome' type in the websearch providers registry
- **ChatService**: Registers tool functions (chrome_scrapePageText, chrome_scrapePageMetadata, chrome_takeScreenshot)
- **Agent System**: Enables agents to perform browser-based tasks via registered tools and configuration
- **Puppeteer**: Uses Puppeteer for browser automation
- **Turndown**: Uses Turndown for HTML to Markdown conversion

## Service Registration Pattern

The provider is registered through the plugin system during installation:

```typescript
// In plugin.ts
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    if (config.chrome) {
      const chromeService = new ChromeService(config.chrome);
      app.addServices(chromeService);

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
10. **Selector Priorities**: The tool naturally prefers `article > main > body` selectors
11. **Agent Configuration**: Use agent-level configuration to override default Chrome settings per agent
12. **State Persistence**: ChromeState automatically manages configuration state for agents

## Testing and Development

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

### Package Structure

```
pkg/chrome/
├── ChromeWebSearchProvider.ts   # Web search provider implementation
├── ChromeService.ts             # Browser lifecycle management
├── plugin.ts                    # Plugin registration and configuration
├── schema.ts                    # Configuration schemas
├── state/
│   └── chromeState.ts          # State management for agents
├── tools/
│   ├── scrapePageText.ts       # Web scraping tool
│   ├── scrapePageMetadata.ts   # Metadata extraction tool
│   └── takeScreenshot.ts       # Screenshot tool
├── tools.ts                     # Tools exports
├── index.ts                     # Main exports
├── package.json
├── vitest.config.ts
├── README.md
└── LICENSE
```

### Dependencies

- **@tokenring-ai/app**: Base application framework for plugin registration
- **@tokenring-ai/chat**: Chat service and tool definitions
- **@tokenring-ai/agent**: Agent system integration and state management
- **@tokenring-ai/websearch**: Web search service and provider interface
- **puppeteer**: Browser automation library
- **turndown**: HTML to Markdown conversion
- **zod**: Schema validation

### Browser Requirements

- Chrome or Chromium browser installed on the system
- Puppeteer requires system packages for headless mode (Linux/Mac)
- Remote debugging endpoint required when using `launch: false`

**Install system dependencies (Linux):**

```bash
# Ubuntu/Debian
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

## Error Handling

The package provides robust error handling for browser operations:

### Common Errors

**Browser Launch Failure**

```typescript
// Error: Failed to launch the browser process
// Solution: Ensure Chrome/Chromium is installed and accessible
```

**Connection Timeout**

```typescript
// Error: Navigation took over 20000 ms
// Solution: Increase timeout or verify network connectivity
```

**Element Not Found**

```typescript
// Error: Element with selector "article" not found
// Solution: Adjust selector priority or use different selectors
```

**Invalid URL**

```typescript
// Error: [chrome_scrapePageText] Invalid URL
// Solution: Ensure URL is properly formed and includes http:// or https://
```

**Agent Required**

```typescript
// Error: Agent required for ChromeWebSearchProvider
// Solution: Provide an agent instance when calling search methods
```

## Troubleshooting

### Puppeteer Launch Issues

**"No such binary: chrome"**

- Install Chrome browser on your system
- The wrong Chromium binary may be used

**"Failed to launch"**

- Check Chrome version compatibility with Puppeteer
- Ensure system dependencies are installed
- Verify Chrome is not already running with debugging port

### Page Loading Issues

**"Navigation timeout exceeded"**

- Increase timeout in fetchPage options
- Check network connectivity
- Verify target URL is accessible and responsive

**Text extraction returns empty**

- Check if page loads JavaScript (use `render: true`)
- Verify selectors match page content structure
- Inspect page with browser DevTools first

**Resource Issues**

**High memory usage**

- Close browser connections efficiently
- Process results promptly
- Consider committing browser sessions

**Connection refused**

- Ensure remote debugging server is running
- Verify WebSocket endpoint is accessible
- Check firewall settings

### Agent Configuration Issues

**Agent not using configured Chrome settings**

- Ensure agent has `chrome` config slice
- Verify configuration is passed during agent initialization
- Check that ChromeService.attach() is called

**State not persisting**

- Verify ChromeState is properly initialized
- Check serialization/deserialization methods
- Ensure agent state is being saved/restored

## Related Components

- **@tokenring-ai/websearch**: Web search service that ChromeWebSearchProvider integrates with
- **@tokenring-ai/chat**: Chat service that provides tool execution framework and defines TokenRingToolDefinition
- **@tokenring-ai/app**: Base application framework for plugin registration
- **@tokenring-ai/agent**: Agent system that can use the plugin's tools and configuration
- **Puppeteer**: Chrome browser automation library
- **Turndown**: HTML to Markdown conversion library

## License

MIT License - see the root LICENSE file for details.
