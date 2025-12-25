# CloudQuote Plugin - Financial Data Tools

## Overview

The CloudQuote plugin provides access to comprehensive financial data and market information through the CloudQuote API. It offers tools for retrieving stock quotes, market leaders, historical price data, intraday price ticks, and news headlines for various securities.

## Key Features

- **Real-time stock quotes** with pricing and metadata
- **Market leaders** data including most active, percentage gainers, and losers
- **Historical price data** with daily price history
- **Intraday price ticks** for detailed time-based price analysis
- **News headlines** by security with article links and metadata
- **Chart generation** capabilities with SVG data URIs
- **Configurable API integration** with required API key authentication

## Core Components

### CloudQuoteService

The main service class that handles all API communications with the CloudQuote API.

**Configuration:**
```typescript
interface CloudQuoteServiceOptions {
  apiKey: string; // Required CloudQuote API key
}
```

**API Endpoints:**
- `fcon/getQuote` - Retrieve pricing and metadata
- `fcon/getLeaders` - Get market leaders data
- `fcon/getPriceHistory` - Historical daily price data
- `fcon/getPriceTicks` - Intraday price ticks
- `fcon/getHeadlinesBySecurity` - News headlines by security

### Available Tools

The plugin exposes 5 tools that can be used by agents and applications:

1. `cloudquote_getQuote` - Retrieve stock quotes
2. `cloudquote_getLeaders` - Get market leaders
3. `cloudquote_getPriceHistory` - Historical price data
4. `cloudquote_getPriceTicks` - Intraday price ticks
5. `cloudquote_getHeadlinesBySecurity` - News headlines

## API Reference

### cloudquote_getQuote

**Description:** Retrieve pricing and metadata for given security symbols.

**Parameters:**
```typescript
interface GetQuoteInput {
  symbols: string[]; // Array of ticker symbols to fetch
}
```

**Usage:**
```typescript
// Example: Get quotes for AAPL, GOOGL, MSFT
const result = await getQuote({ symbols: ['AAPL', 'GOOGL', 'MSFT'] });
```

**Return Value:** Array of quote objects containing price, volume, and other market data.

### cloudquote_getLeaders

**Description:** Get a list of stocks that are notable today.

**Parameters:**
```typescript
interface GetLeadersInput {
  list: "MOSTACTIVE" | "PERCENTGAINERS" | "PERCENTLOSERS"; // Type of list
  type?: "STOCK" | "ETF"; // Security type
  limit?: number; // Max number of results (1-50)
  minPrice?: number; // Minimum price filter
  maxPrice?: number; // Maximum price filter
}
```

**Usage:**
```typescript
// Example: Get most active stocks
const result = await getLeaders({ list: "MOSTACTIVE" });

// Example: Get ETF percentage gainers with limit
const result = await getLeaders({ list: "PERCENTGAINERS", type: "ETF", limit: 10 });
```

**Return Value:** Array of security objects with market data.

### cloudquote_getPriceHistory

**Description:** Fetch historical daily price data for a symbol.

**Parameters:**
```typescript
interface GetPriceHistoryInput {
  symbol: string; // Ticker symbol
  from?: string; // Start date (YYYY-MM-DD)
  to?: string; // End date (YYYY-MM-DD)
}
```

**Usage:**
```typescript
// Example: Get price history for AAPL
const result = await getPriceHistory({ symbol: "AAPL", from: "2023-01-01", to: "2023-12-31" });
```

**Return Value:** Array of price history rows with date and price data.

### cloudquote_getPriceTicks

**Description:** Fetch intraday price ticks (time, price, volume) for a symbol.

**Parameters:**
```typescript
interface GetPriceTicksInput {
  symbol: string; // Ticker symbol
}
```

**Usage:**
```typescript
// Example: Get intraday price ticks for GOOGL
const result = await getPriceTicks({ symbol: "GOOGL" });
```

**Return Value:** Array of price tick rows with timestamp, price, and volume data.

### cloudquote_getHeadlinesBySecurity

**Description:** Retrieve news headlines for one or more ticker symbols.

**Parameters:**
```typescript
interface GetHeadlinesInput {
  symbols: string; // Comma-separated ticker symbols
  start?: number; // Number of records to skip
  count?: number; // Number of records to retrieve (max 100)
  minDate?: string; // Minimum publication date (ISO 8601)
  maxDate?: string; // Maximum publication date (ISO 8601)
}
```

**Usage:**
```typescript
// Example: Get news for AAPL
const result = await getHeadlinesBySecurity({ symbols: "AAPL" });

// Example: Get 20 news items for GOOGL with date range
const result = await getHeadlinesBySecurity({
  symbols: "GOOGL",
  count: 20,
  minDate: "2023-01-01T00:00:00Z",
  maxDate: "2023-12-31T23:59:59Z"
});
```

**Return Value:** Array of headline objects with article metadata and links.

## Configuration

### Required Setup

To use the CloudQuote plugin, you need to configure it with a valid API key:

```typescript
// In your application configuration
const config = {
  cloudquote: {
    apiKey: "your-cloudquote-api-key-here"
  }
};
```

### Environment Variables

```bash
# Required environment variable
CLOUDQUOTE_API_KEY="your-api-key"
```

## Integration

### Service Registration

The plugin automatically registers the CloudQuoteService with the TokenRing application:

```typescript
// In plugin installation
app.addServices(new CloudQuoteService(config));
```

### Tool Registration

Tools are automatically registered with the ChatService:

```typescript
// In plugin installation
chatService.addTools(packageJSON.name, tools);
```

### Error Handling

The plugin includes comprehensive error handling:

```typescript
try {
  const result = await getQuote({ symbols: ["AAPL"] });
} catch (error) {
  if (error instanceof CloudQuoteError) {
    console.error(`CloudQuote Error: ${error.message}`);
  } else {
    console.error(`General Error: ${error.message}`);
  }
}
```

## Usage Examples

### Basic Integration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import cloudquotePlugin from "@tokenring-ai/cloudquote";

const app = new TokenRingApp({
  config: {
    cloudquote: {
      apiKey: "your-api-key"
    }
  }
});

app.use(cloudquotePlugin);
app.start();
```

### Advanced Usage with Agent

```typescript
import { Agent } from "@tokenring-ai/agent";

const agent = new Agent({
  services: [new CloudQuoteService({ apiKey: "your-api-key" })],
  tools: {
    cloudquote_getQuote: getQuote,
    cloudquote_getLeaders: getLeaders,
    cloudquote_getPriceHistory: getPriceHistory,
    cloudquote_getPriceTicks: getPriceTicks,
    cloudquote_getHeadlinesBySecurity: getHeadlinesBySecurity
  }
});

// Example: Get stock quote and news
const quoteResult = await agent.executeTool("cloudquote_getQuote", { symbols: ["AAPL"] });
const newsResult = await agent.executeTool("cloudquote_getHeadlinesBySecurity", { symbols: "AAPL" });
```

### Chart Generation

```typescript
// Example: Generate price chart SVG
const chartResult = await cloudQuoteService.getPriceChart({
  symbol: "AAPL",
  interval: "1d"
});

// Use the SVG data URI in your application
console.log(chartResult.svgDataUri);
```

## Dependencies

- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent system
- `@tokenring-ai/chat` - Chat and tool system
- `@tokenring-ai/utility` - HTTP utilities
- `zod` - Schema validation
- `date-fns-tz` - Time zone handling

## License

MIT License - Copyright TokenRing AI

## Development

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test:coverage
```

### Build

```bash
# Build TypeScript
bun build
```

### Package Structure

```
pkg/cloudquote/
├── plugin.ts          # Main plugin implementation
├── package.json      # Package metadata
├── CloudQuoteService.ts  # Service class
├── tools.ts          # Tool exports
└── tools/            # Individual tool implementations
    ├── getQuote.ts
    ├── getLeaders.ts
    ├── getPriceHistory.ts
    ├── getPriceTicks.ts
    └── getHeadlinesBySecurity.ts
```