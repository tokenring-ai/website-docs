---
slug: web-search-plugins
title: Web Search Plugins - Serper and ScraperAPI Integration
authors: [mdierolf]
tags: [tokenring, plugins, web-search, announcement]
---

# Web Search Plugins - Serper and ScraperAPI Integration

TokenRing Coder now supports web search capabilities through Serper.dev and ScraperAPI integrations.

<!-- truncate -->

## Serper Plugin

Google search integration via Serper.dev API:

### Features
- **Web Search**: Organic results, knowledge graphs, related searches
- **News Search**: Structured news articles with sources and dates
- **Geotargeting**: Country codes, language, and location-based search
- **Pagination**: Navigate through multiple pages of results

### Usage
```typescript
const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY,
  defaults: { gl: 'us', hl: 'en', num: 10 }
});

const results = await provider.searchWeb('Token Ring AI');
```

## ScraperAPI Plugin

Web scraping and SERP integration:

### Features
- **HTML Fetching**: Retrieve page content with optional JavaScript rendering
- **Google SERP**: Structured JSON results including organic results and knowledge graphs
- **Google News**: Articles with sources, thumbnails, and dates
- **Geotargeting**: Country codes, TLDs, and UULE for location-specific results

### Usage
```typescript
const provider = new ScraperAPIWebSearchProvider({
  apiKey: process.env.SCRAPERAPI_KEY,
  render: true
});

const page = await provider.fetchPage('https://example.com');
```

## Agent Integration

Both plugins integrate seamlessly with agents:

```bash
/websearch search "latest AI news" --num 10
/websearch news "quantum computing"
/websearch fetch https://example.com
```

Enable AI agents to research topics, gather information, and stay current with the latest developments.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
