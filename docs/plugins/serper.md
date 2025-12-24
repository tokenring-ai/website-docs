# Serper Provider for Web Search

Serper integration for web search using Serper.dev API, providing Google-like search results.

## Overview

The Serper provider implements the `WebSearchProvider` interface and connects to the Serper.dev API, offering Google search results with JSON responses. It's a convenient way to get search results without needing a Google API key.

## Features

- **Google-like Search Results**: Returns organic results, knowledge graphs, and related searches
- **News Search**: Access to recent news articles
- **Web Page Fetching**: Fetch and render web pages with JavaScript
- **Localization Support**: Country and language targeting
- **Easy Setup**: Simple API key configuration

## Configuration

### Required Configuration

```typescript
interface SerperConfig {
  apiKey: string;
  // Optional defaults
  defaults?: {
    gl?: string; // Country code (e.g., 'us', 'uk', 'de')
    hl?: string; // Language code (e.g., 'en', 'es', 'fr')
    location?: string; // Location string for geo-targeted results
    num?: number; // Default number of results
  };
}
```

### Example Configuration

```typescript
const serperProvider = new SerperWebSearchProvider({
  apiKey: 'your-serper-api-key',
  defaults: {
    gl: 'us',
    hl: 'en',
    num: 10
  }
});
```

## Usage

### Basic Search

```typescript
import { SerperWebSearchProvider } from '@tokenring-ai/websearch/providers/SerperWebSearchProvider';

const serperProvider = new SerperWebSearchProvider({ apiKey: 'your-api-key' });

// Perform web search
const results = await serperProvider.searchWeb('Token Ring AI');

// Perform news search
const newsResults = await serperProvider.searchNews('artificial intelligence');

// Fetch web page
const pageContent = await serperProvider.fetchPage('https://example.com');
```

### With Options

```typescript
const results = await serperProvider.searchWeb('typescript tutorial', {
  countryCode: 'us',
  language: 'en',
  location: 'New York',
  num: 15,
  page: 1
});
```

## Rate Limits

Serper.dev has rate limits based on your subscription plan:
- Free tier: ~100 requests per day
- Paid tiers: Varies by plan

## API Documentation

Refer to the [Serper.dev API documentation](https://serper.dev) for detailed information about:
- Available search types
- Response formats
- Rate limits and pricing
- Advanced search options

## Error Handling

The provider handles common HTTP errors and API limits. For detailed error information, check the Serper.dev documentation.

## Integration

When registering the provider in your agent:

```typescript
import { Agent } from '@tokenring-ai/agent';
import { WebSearchService } from '@tokenring-ai/websearch';
import { SerperWebSearchProvider } from '@tokenring-ai/websearch/providers/SerperWebSearchProvider';

const agent = new Agent();
const webSearchService = new WebSearchService();
agent.registerService(webSearchService);

const serperProvider = new SerperWebSearchProvider({ apiKey: 'your-api-key' });
webSearchService.registerResource(serperProvider, 'serper');

// Set as active provider
webSearchService.setActiveProvider('serper');
```