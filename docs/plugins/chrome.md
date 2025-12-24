# Chrome Plugin

Chrome browser automation and web search integration for Token Ring.

## Overview

The `@tokenring-ai/chrome` package provides comprehensive Chrome browser automation capabilities for the Token Ring ecosystem. It includes two primary tools for web scraping and script execution, plus a web search provider that integrates with the Token Ring websearch service.

## Key Features

- **Puppeteer Integration**: Run JavaScript functions in a live Puppeteer session
- **Console Capture**: Collect page console output and custom logs
- **Navigation Support**: Optionally navigate to URLs before script execution
- **Web Search Provider**: Google search integration with news and web search capabilities
- **Page Scrape Tool**: Extract text content from web pages with intelligent selector prioritization
- **HTML to Markdown**: Convert web pages to markdown format
- **Timeout Control**: Configurable execution timeouts (5-180 seconds)
- **Result Reporting**: Returns function results, logs, and error status

## Core Components

### Tools

#### Tool: `chrome_runPuppeteerScript`

Runs a Puppeteer script with access to a browser and page.

**Parameters:**
- `script`: string - JavaScript code string that evaluates to an async function taking `({ page, browser, consoleLog })`
- `navigateTo?`: string - Optional URL to load before running the script
- `timeoutSeconds?`: number - Maximum execution time (min 5, max 180, default 30)

**Returns:**
```typescript
{
  result: unknown;  // value your function resolves to
  logs: string[];   // collected console output and custom consoleLog messages
}
```

**Behavior:**
- Launches Chromium instance via Puppeteer with `headless: false`
- Evaluates script using `new Function` and immediately invokes it
- Captures page console messages with `[browser]` prefix
- Provides `consoleLog` helper for custom log lines
- Cleans up browser instance after execution

#### Tool: `chrome_scrapePageText`

Scrape text content from a web page using Puppeteer.

**Parameters:**
- `url`: string - The URL of the web page to scrape text from
- `timeoutSeconds?`: number - Timeout for the scraping operation (default 30s, max 180s)
- `selector?`: string - Custom CSS selector to target specific content

**Returns:**
```typescript
{
  text: string;           // Extracted text content
  sourceSelector: string;  // The selector that was used
  url: string;            // Original URL
}
```

**Behavior:**
- Launches Puppeteer in headless mode
- Navigates to the specified URL
- Attempts to find content using prioritized selectors: `article`, `main`, or `body`
- Extracts and cleans text content
- Returns the extracted text and the source selector used

### Web Search Provider

#### ChromeWebSearchProvider

Provides Google search capabilities integrated with the Token Ring websearch service.

**Search Methods:**

- `searchWeb(query, options)`: Perform web searches
- `searchNews(query, options)`: Perform news searches  
- `fetchPage(url, options)`: Fetch and convert HTML to markdown

**Configuration:**
- `launch`: boolean - Launch new browser instance (true) or connect to existing (false)

## Usage Examples

### Running Puppeteer Scripts

```typescript
import { ServiceRegistry } from '@tokenring-ai/registry';
import * as chromeTools from '@tokenring-ai/chrome/tools';
import ChatService from '@tokenring-ai/chat/ChatService';

const registry = new ServiceRegistry();
registry.registerService(new ChatService());

// Define script as a string that evaluates to an async function
const script = `async ({ page, browser, consoleLog }) => {
  await page.goto('https://example.com', { waitUntil: 'load' });
  const title = await page.title();
  consoleLog('Page title is:', title);
  return { title };
}`;

const res = await chromeTools.runPuppeteerScript.execute({ script }, registry);
if (res.ok) {
  console.log('Result:', res.result);
  console.log('Logs:', res.logs);
}
```

### Scraping Web Page Text

```typescript
import { ServiceRegistry } from '@tokenring-ai/registry';
import * as chromeTools from '@tokenring-ai/chrome/tools';
import ChatService from '@tokenring-ai/chat/ChatService';

const registry = new ServiceRegistry();
registry.registerService(new ChatService());

const res = await chromeTools.scrapePageText.execute(
  { 
    url: 'https://example.com', 
    selector: 'article' 
  }, 
  registry
);
if (res.ok) {
  console.log('Extracted text:', res.result.text);
  console.log('Used selector:', res.result.sourceSelector);
}
```

### Using Chrome Search Provider

```typescript
import { ServiceRegistry } from '@tokenring-ai/registry';
import WebSearchService from '@tokenring-ai/websearch';
import { ChromeWebSearchOptionsSchema } from '@tokenring-ai/chrome';

const registry = new ServiceRegistry();
const websearchConfig = {
  providers: {
    chrome: {
      type: 'chrome',
      launch: true
    }
  }
};

const webSearchService = new WebSearchService();
webSearchService.registerProvider('chrome', new ChromeWebSearchProvider(ChromeWebSearchOptionsSchema.parse(websearchConfig.providers.chrome)));

const results = await webSearchService.searchWeb('Token Ring AI', { countryCode: 'us' });
console.log('Search results:', results.organic);
```

## Configuration Options

### Tool Configuration

- **script**: JavaScript function as string with signature `async ({ page, browser, consoleLog }) => any`
- **navigateTo**: Optional URL to navigate to before execution
- **timeoutSeconds**: Execution timeout (5-180 seconds, default 30)
- **headless**: Currently set to `false` by default for debugging

### Web Search Provider Configuration

- **launch**: boolean - Whether to launch a new browser instance (true) or connect to existing (false)
- **countryCode**: Optional country code for localized search results

## Dependencies

- `@tokenring-ai/agent`: Agent integration
- `@tokenring-ai/chat`: Chat service for tool execution
- `@tokenring-ai/websearch`: Web search service integration
- `@tokenring-ai/app`: Application framework
- `puppeteer@^24.33.0`: Browser automation
- `turndown@^7.2.2`: HTML to markdown conversion
- `zod`: Schema validation

## Security Notes

- Scripts are evaluated using `new Function` and run with process privileges
- Only run trusted code as it executes with full system access
- Console messages from the page are collected and returned
- Use the provided `consoleLog` function for guaranteed log capture
- Scraping tool uses headless mode by default for security

## Browser Management

The package automatically manages browser lifecycle:
- Launches browser instances as needed
- Closes browsers after script execution
- Provides both local browser launch and connection options
- Handles timeout enforcement and cleanup

## Integration Points

- Integrates with the Token Ring chat service for tool registration
- Provides web search provider for the Token Ring websearch service
- Follows the standard Token Ring plugin architecture
- Supports both tool execution and service provider patterns