# Chrome Plugin

Chrome browser automation and web search integration for Token Ring.

## Overview

The `@tokenring-ai/chrome` package provides Chrome browser automation capabilities for the Token Ring ecosystem. It includes a page scraping tool and integrates with the Token Ring web search service through a Chrome-based search provider.

## Key Features

- **Page Scrape Tool**: Extract text content from web pages using Puppeteer with intelligent selector prioritization
- **Web Search Provider**: Google search integration with the Token Ring websearch service
- **Smart Content Detection**: Prioritizes `article`, `main`, or `body` selectors when scraping content
- **Configurable Timeouts**: Control scraping and script execution timeouts (5-180 seconds)
- **Clean Text Extraction**: Automatically cleans and formats extracted text content
- **Seamless Plugin Integration**: Automatically registers with Token Ring chat and websearch services

## Core Components

### Tools

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

- **url**: string - Required URL to scrape text from
- **timeoutSeconds**: number - Execution timeout (5-180 seconds, default 30)
- **selector**: string - Optional custom CSS selector

### Web Search Provider Configuration

- **launch**: boolean - Whether to launch a new browser instance (true) or connect to existing (false)
- **countryCode**: Optional country code for localized search results

## Dependencies

- `@tokenring-ai/agent`: Agent integration
- `@tokenring-ai/chat`: Chat service for tool registration
- `@tokenring-ai/websearch`: Web search service integration
- `@tokenring-ai/app`: Application framework
- `puppeteer@^24.33.0`: Browser automation
- `turndown@^7.2.2`: HTML to markdown conversion
- `zod`: Schema validation

## Browser Management

The package automatically manages browser lifecycle:
- Launches browser instances as needed
- Closes browsers after operations complete
- Provides both local browser launch and connection options
- Handles timeout enforcement and cleanup

## Integration Points

- Integrates with the Token Ring chat service for tool registration
- Provides web search provider for the Token Ring websearch service
- Follows the standard Token Ring plugin architecture
- Supports both tool execution and service provider patterns

## Package Structure

- `index.ts`: Main export file
- `ChromeWebSearchProvider.ts`: Core web search provider implementation  
- `tools.ts`: Tool exports and definitions
- `tools/scrapePageText.ts`: Page scraping tool implementation
- `plugin.ts`: Plugin integration for Token Ring applications

## Development

### Build

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Scripts

- `build`: Compile TypeScript with `tsc --noEmit`
- `test`: Run Vitest tests
- `test:watch`: Watch mode for testing
- `test:coverage`: Run tests with coverage report

## License

MIT License - see LICENSE file for details.