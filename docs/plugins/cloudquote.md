# CloudQuote Plugin

## Overview

The CloudQuote plugin provides comprehensive financial data and market information through the CloudQuote API. It offers tools for retrieving stock quotes, market leaders, historical price data, intraday price ticks, and news headlines for various securities.

## Key Features

- Real-time stock quotes with pricing and metadata
- Market leaders data (most active, percentage gainers/losers)
- Historical price data with daily price history
- Intraday price ticks for detailed time-based analysis
- News headlines by security with article links
- Chart generation capabilities with SVG data URIs
- Configurable API integration with required authentication

## Core Components

### CloudQuoteService

The primary service class responsible for handling all API communications with CloudQuote services. Manages authentication, request retries, and error handling.

**Configuration Schema:**
```typescript
const CloudQuoteServiceOptionsSchema = z.object(&#123;
  apiKey: z.string(),
&#125;);

export type CloudQuoteServiceOptions = z.infer&lt;typeof CloudQuoteServiceOptionsSchema&gt;;
```

Only the `apiKey` is required for configuration. This is passed when initializing the service.

## Services and APIs

### CloudQuoteService Methods

#### getPriceChart

Generates a stock chart SVG using FinancialContent.com's chart service.

- **Parameters:**
  - `symbol` (string): Ticker symbol (e.g., `"AAPL"`)
  - `interval` (string): Time interval (e.g., `"1d"`, `"1w"`)

- **Returns:** Object containing `svgDataUri` string with the chart SVG URL.

#### getHeadlinesBySecurity

Retrieves news headlines from the NewsRPM API (separate endpoint from main CloudQuote service).

- **Parameters:**
  - `symbols` (string): Comma-separated ticker symbols
  - `start` (number, optional): Number of records to skip
  - `count` (number, optional): Number of records to retrieve (max 100)
  - `minDate` (string, optional): Minimum publication date (ISO 8601)
  - `maxDate` (string, optional): Maximum publication date (ISO 8601)

- **Returns:** Array of news headline objects

#### getJSON

Internal method for making API requests to CloudQuote services (e.g., `/fcon/getQuote`). Not typically used directly; tools wrap this method.

## Commands and Tools

The plugin exposes these tools that can be used directly in chat commands:

### getQuote

Retrieves real-time stock quotes for given symbols.

- **Parameters:**
  - `symbols` (string[]): Array of ticker symbols (e.g., `["AAPL", "GOOGL"]`)

- **Returns:** Array of quote objects containing price, volume, and market metadata

- **Usage:**
```typescript
const quotes = await getQuote(&#123; symbols: ["AAPL", "GOOGL", "MSFT"] &#125;);
```

### getLeaders

Fetches market leaders data (most active, gainers, losers).

- **Parameters:**
  - `list` ("MOSTACTIVE" | "PERCENTGAINERS" | "PERCENTLOSERS"): List type
  - `type` ("STOCK" | "ETF", optional): Security type
  - `limit` (number, optional): Max results (1-50)
  - `minPrice` (number, optional): Minimum price filter
  - `maxPrice` (number, optional): Maximum price filter

- **Returns:** Array of security objects with market data

- **Usage:**
```typescript
// Get most active stocks
const active = await getLeaders(&#123; list: "MOSTACTIVE", limit: 25 &#125;);

// Get ETF percentage gainers
const gainers = await getLeaders(&#123; list: "PERCENTGAINERS", type: "ETF", limit: 10 &#125;);
```

### getPriceHistory

Fetches historical daily price data for a symbol.

- **Parameters:**
  - `symbol` (string): Ticker symbol
  - `from` (string, optional): Start date (YYYY-MM-DD)
  - `to` (string, optional): End date (YYYY-MM-DD)

- **Returns:** Array of historical price data rows

- **Usage:**
```typescript
const history = await getPriceHistory(&#123;
  symbol: "AAPL",
  from: "2023-01-01",
  to: "2023-12-31"
&#125;);
```

### getPriceTicks

Fetches intraday price ticks (time, price, volume) for a symbol.

- **Parameters:**
  - `symbol` (string): Ticker symbol

- **Returns:** Array of price tick records with timestamp, price, and volume

- **Usage:**
```typescript
const ticks = await getPriceTicks(&#123; symbol: "GOOGL" &#125;);
```

### getHeadlinesBySecurity

Retrieves news headlines for ticker symbols.

- **Parameters:**
  - `symbols` (string): Comma-separated ticker symbols
  - `start` (number, optional): Records to skip
  - `count` (number, optional): Records to retrieve (max 100)
  - `minDate` (string, optional): Minimum publication date (ISO 8601)
  - `maxDate` (string, optional): Maximum publication date (ISO 8601)

- **Returns:** Array of headline objects with article metadata and links

- **Usage:**
```typescript
const headlines = await getHeadlinesBySecurity(&#123;
  symbols: "AAPL,GOOGL",
  count: 20,
  minDate: "2023-01-01T00:00:00Z"
&#125;);
```

## Configuration

### Required Setup

The plugin requires an API key to access CloudQuote services. Configure it in your application:

```typescript
const config = &#123;
  cloudquote: &#123;
    apiKey: "your-cloudquote-api-key-here"
  &#125;
&#125;;
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
import cloudquotePlugin from "@tokenring-ai/cloudquote";

app.use(cloudquotePlugin);
```

### Tool Registration

Tools are automatically registered with the ChatService for chat command integration:

```
&gt; /getQuote AAPL
&gt; /getLeaders MOSTACTIVE
&gt; /getHeadlinesBySecurity GOOGL
```

### Error Handling

The plugin throws `CloudQuoteError` for API-related issues:

```typescript
try &#123;
  const result = await getQuote(&#123; symbols: ["AAPL"] &#125;);
&#125; catch (error) &#123;
  if (error instanceof CloudQuoteError) &#123;
    console.error(`CloudQuote Error: $&#123;error.message&#125;`);
  &#125; else &#123;
    console.error(`General error: $&#123;error.message&#125;`);
  &#125;
&#125;
```

## Monitoring and Debugging

- **Debug Command:** Use `/debug cloudquote` to view service status, request metrics, and recent errors
- **Logging:** Enable debug logging via `app.setLogLevel('debug')` to see detailed API request and response information
- **Error Handling:** All API errors throw `CloudQuoteError` with HTTP status codes and response details

## Development

### Testing

Run tests using Vitest:

```bash
bun run test          # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Generate test coverage report
```

### Build

```bash
bun run build         # Build TypeScript
```

### Package Structure

```
pkg/cloudquote/
├── plugin.ts          # Main plugin implementation
├── package.json       # Package metadata
├── CloudQuoteService.ts # Service class
├── tools.ts           # Tool exports
└── tools/
    ├── getQuote.ts
    ├── getLeaders.ts
    ├── getPriceHistory.ts
    ├── getPriceTicks.ts
    └── getHeadlinesBySecurity.ts
```

### License

MIT License - Copyright (c) 2025 TokenRing AI