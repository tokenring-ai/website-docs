# Chrome Plugin

## Overview
The Chrome Plugin provides browser automation capabilities for Token Ring using Puppeteer. It integrates with the WebSearchService to provide Chrome-based web search and news search providers, and adds tools for web scraping via the chat service.

## Key Features
- **Chrome-based Web Search**: Utilizes Puppeteer for accurate web search results.
- **News Search**: Performs news-specific searches with source, date, and snippet information.
- **Dynamic Page Scraping**: Extracts content from HTML pages with intelligent selector prioritization.
- **HTML to Markdown Conversion**: Converts fetched HTML content to Markdown using Turndown.
- **Configurable Browser Launch**: Supports both launching new browser instances or connecting to existing ones.
- **Tool Integration**: Provides tools for web scraping via the chat service.

## Core Components

### ChromeWebSearchProvider

The ChromeWebSearchProvider class implements the WebSearchProvider interface. It uses Puppeteer to interact with websites for searching and content fetching.

**Constructor Parameters:**
- `options`: Configuration object with:
  - `launch`: boolean - Whether to launch a new browser instance (vs connecting to an existing one)

### Tools

The plugin registers the following tool with the chat service:

- **chrome_scrapePageText**: Scrapes text content from a web page using Puppeteer with selector prioritization.

## Usage Examples

### Basic Scraping via Chat

```typescript
const result = await tools.chrome_scrapePageText({
  url: 'https://example.com/article',
});
console.log(result.text);
```

### Direct WebSearchService Usage

```typescript
import { WebSearchService } from '@tokenring-ai/websearch';
import { ChromeWebSearchProvider } from '@tokenring-ai/chrome';

const webSearch = new WebSearchService();
const chromeProvider = new ChromeWebSearchProvider({ launch: true });
webSearch.registerProvider('chrome', chromeProvider);

const results = await webSearch.searchWeb('TypeScript documentation', { countryCode: 'us' });
console.log(results.organic);
```

## Configuration

The Chrome Plugin's configuration is structured under the `chrome` section of the Token Ring app configuration:

```typescript
interface ChromeConfig {
  websearch?: {
    providers: {
      [name: string]: {
        type: 'chrome';
        launch?: boolean;
      };
    };
  };
}
```

Example configuration:

```typescript
export default {
  chrome: {
    websearch: {
      providers: {
        'default-chrome': {
          type: 'chrome',
          launch: true,
        },
      },
    },
  },
} satisfies TokenRingPlugin;
```

## API Reference

### ChromeWebSearchProvider Methods

| Method | Description |
|--------|-------------|
| `searchWeb(query, options?)` | Perform a web search and return organic results |
| `searchNews(query, options?)` | Perform a news search and return news articles |
| `fetchPage(url, options?)` | Fetch a page and convert HTML to Markdown |

### Tool Definitions

#### chrome_scrapePageText

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string (required) | URL to scrape text from |
| `timeoutSeconds` | number (optional) | Timeout in seconds (5-180, default: 30) |
| `selector` | string (optional) | CSS selector for target content |

**Returns:**
```typescript
{
  text: string;        // Extracted text content
  sourceSelector: string; // The selector that was used
  url: string;         // Original URL
}
```

## Integration

- **WebSearchService**: Registers as a provider for the 'chrome' type
- **ChatService**: Adds tools for web scraping
- **Agent System**: Enables agents to perform browser-based tasks via tools

## Best Practices

1. **Selector Selection**: When using `chrome_scrapePageText`, provide specific selectors for better results
2. **Timeout Management**: Set appropriate timeouts for slow-loading pages
3. **Resource Cleanup**: The tools handle browser cleanup automatically
4. **Error Handling**: Tools throw descriptive errors with the tool name prefix

## Testing and Development

### Build and Test

```bash
# Type check
bun run build

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage
```

### Package Structure

```
pkg/chrome/
├── ChromeWebSearchProvider.ts   # Web search provider implementation
├── plugin.ts                    # Plugin registration
├── tools/
│   └── scrapePageText.ts       # Web scraping tool
├── package.json
└── README.md
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/tokenring/blob/main/LICENSE) for details.
