# CloudQuote Financial Data Tools

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer agents, enabling access to real-time pricing information, historical data, price ticks, market leaders, and news headlines for securities through the CloudQuote API and NewsRPM services.

## Overview

The `@tokenring-ai/cloudquote` package provides comprehensive financial data tools for TokenRing Writer agents. It integrates with the CloudQuote financial data API and NewsRPM news service to deliver real-time market data, historical price information, intraday ticks, market leaders, and news headlines. The package includes robust error handling, timezone-aware date formatting, automatic link generation for news headlines, and full RPC API support for programmatic access.

### Key Features

- **Real-time Quote Data**: Retrieve pricing and metadata for single or multiple securities
- **Historical Price Data**: Fetch daily historical price data with timezone-aware formatting
- **Intraday Price Ticks**: Get intraday price data with time, price, and volume information
- **Market Leaders**: Access lists of most active stocks, percentage gainers, and percentage losers
- **News Headlines**: Retrieve news headlines for specified ticker symbols within date ranges (via NewsRPM)
- **Price Chart URLs**: Generate price chart URLs for securities
- **RPC Endpoints**: Full RPC API for programmatic access to all CloudQuote functionality
- **Robust Error Handling**: Custom error types for API-related issues with detailed diagnostics
- **Timezone-Aware Formatting**: All dates are formatted in America/New_York timezone
- **Automatic Link Generation**: News headline links are automatically populated when available

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote. It extends `HttpService` and implements the `TokenRingService` interface.

#### Constructor

```typescript
constructor(app: TokenRingApp, options: CloudQuoteServiceOptions)
```

**Parameters:**

- `app` (TokenRingApp): The TokenRing application instance for service management and logging
- `options` (CloudQuoteServiceOptions): Configuration options
  - `apiKey` (string): CloudQuote API key (required)

**Example:**

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

const service = new CloudQuoteService(app, {
  apiKey: process.env.CLOUDQUOTE_API_KEY
});
```

**Note:** The service requires both the application instance and configuration options. The app instance is used for service output/error logging and dependency injection.

#### Configuration Schema

```typescript
import { z } from "zod";

export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export interface CloudQuoteServiceOptions {
  apiKey: string;
}
```

#### Service Methods

##### `getJSON(apiPath: string, params: Record<string, string | number | undefined | null>): Promise<T>`

Generic method for making CloudQuote API requests. Handles query parameter serialization and error handling.

**Parameters:**

- `apiPath` (string): API endpoint path (e.g., `'fcon/getQuote'`)
- `params` (`Record<string, string | number | undefined | null>`): Query parameters

**Returns:** `Promise<T>` - Response data

**Example:**

```typescript
const quote = await cloudQuoteService.getJSON('fcon/getQuote', { 
  symbol: 'AAPL,GOOGL' 
});
```

##### `getHeadlinesBySecurity(params: any): Promise<any>`

Retrieve news headlines from the NewsRPM API (not CloudQuote). This method handles the API communication to NewsRPM and returns headline data. **Note: This method uses a different base URL (`http://api.newsrpm.com`) than other CloudQuote methods.**

**Parameters:**

- `params` (any): Headline query parameters
  - `symbols` (string): Comma-separated ticker symbols
  - `start` (number): Number of records to skip
  - `count` (number): Number of records to retrieve (max 100)
  - `minDate` (string): Start date-time in ISO 8601 format
  - `maxDate` (string): End date-time in ISO 8601 format

**Returns:** `Promise<any>` - News headlines data

**Example:**

```typescript
const headlines = await cloudQuoteService.getHeadlinesBySecurity({
  symbols: 'AAPL,GOOGL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});
```

**Important:** This method makes requests to `http://api.newsrpm.com`, not the CloudQuote API. The same API key is used for authentication.

##### `getPriceChart(params: any): Promise<{ svgDataUri: string }>`

Generate a price chart URL for a security. This method returns a URL that can be used directly in HTML or displayed. **Note: This is a service method only and is not exposed as a tool. The method returns a static URL string, not an SVG data URI.**

**Parameters:**

- `params` (any): Chart parameters
  - `symbol` (string): Ticker symbol
  - `interval` (string): Chart interval (e.g., `'1D'`, `'5D'`, `'1M'`)

**Returns:** `Promise<{ svgDataUri: string }>` - Chart URL string

**Example:**

```typescript
const chart = await cloudQuoteService.getPriceChart({ 
  symbol: 'AAPL', 
  interval: '1D' 
});
console.log(chart.svgDataUri);
// Output: "https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&..."
```

**Note:** The returned URL is a static URL from financialcontent.com Chart service, not an actual SVG data URI.

#### Error Handling

The service uses `CloudQuoteError` for all API-related errors:

```typescript
export class CloudQuoteError extends Error {
  constructor(public readonly cause: unknown, message: string) {
    super(message);
    this.name = "CloudQuoteError";
  }
}
```

**Common Error Conditions:**

- Missing API key (throws error on initialization)
- Invalid API key (returns CloudQuoteError)
- Network errors (returns CloudQuoteError with HTTP status)
- API request failures (returns CloudQuoteError)

**Example:**

```typescript
import CloudQuoteService, { CloudQuoteError } from "@tokenring-ai/cloudquote";

try {
  const service = new CloudQuoteService(app, { 
    apiKey: process.env.CLOUDQUOTE_API_KEY 
  });
  await service.getJSON('fcon/getQuote', { symbol: 'AAPL' });
} catch (err) {
  if (err instanceof CloudQuoteError) {
    console.error(`CloudQuote Error: ${err.message}`);
    console.error(`Cause: ${err.cause}`);
  }
}
```

## Services

### CloudQuoteService

The `CloudQuoteService` provides direct access to the CloudQuote financial data API and NewsRPM API for news headlines. It implements the `TokenRingService` interface.

#### Service Registration

The service can be registered through the plugin configuration:

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY
  }
});
```

Or manually:

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

app.addServices(new CloudQuoteService(app, {
  apiKey: process.env.CLOUDQUOTE_API_KEY
}));
```

**Note:** The service constructor requires both the application instance and configuration options.

#### Service Usage in Tools

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import CloudQuoteService from "@tokenring-ai/cloudquote";

async function execute(params, agent: Agent) {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  return await cloudQuoteService.getJSON('fcon/getQuote', { 
    symbol: params.symbols 
  });
}
```

## Provider Documentation

This package does not use a provider architecture. The CloudQuoteService is directly instantiated with API key configuration.

## RPC Endpoints

This package defines the following RPC endpoints under `/rpc/cloudquote`:

| Endpoint | Method | Input Parameters | Response |
|----------|--------|------------------|----------|
| `getQuote` | query | `{ symbols: string[] }` | `{ rows: CloudQuoteQuoteSchema[] }` |
| `getPriceHistory` | query | `{ symbol: string, from?: string, to?: string }` | `{ rows: CloudQuoteQuoteHistoricalItemSchema[] }` |
| `getPriceTicks` | query | `{ symbol: string }` | `{ rows: CloudQuoteQuoteIntradayItemSchema[] }` |
| `getLeaders` | query | `{ list: "MOSTACTIVE"\|"PERCENTGAINERS"\|"PERCENTLOSERS", type?: "STOCK"\|"ETF", limit?: number, minPrice?: number, maxPrice?: number }` | `{ rows: CloudQuoteQuoteSchema[] }` |
| `getHeadlinesBySecurity` | query | `{ symbols: string, start?: number, count?: number, minDate?: string, maxDate?: string }` | `{ data: any }` |
| `getPriceChart` | query | `{ symbol: string, interval: string }` | `{ svgDataUri: string }` |

### RPC Endpoint Registration

The RPC endpoint is automatically registered when the plugin is installed:

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY
  }
});
```

### RPC Usage Example

```typescript
import { createRPCClient } from "@tokenring-ai/rpc";

const rpcClient = createRPCClient('/rpc/cloudquote');

// Get quote for multiple symbols
const quote = await rpcClient.getQuote({ symbols: ['AAPL', 'GOOGL'] });
console.log(quote.rows);

// Get price history
const history = await rpcClient.getPriceHistory({ 
  symbol: 'AAPL', 
  from: '2024-01-14', 
  to: '2024-01-16' 
});
console.log(history.rows);

// Get market leaders
const leaders = await rpcClient.getLeaders({ 
  list: 'PERCENTGAINERS', 
  limit: 10 
});
console.log(leaders.rows);
```

### Chat Commands

This package does not define chat commands. All functionality is exposed through:
- **Tools**: Available for agent invocation via the chat interface
- **RPC Endpoints**: Available for programmatic access via the RPC service

## Configuration

### Plugin Configuration Schema

```typescript
import { z } from "zod";
import CloudQuoteService, { CloudQuoteServiceOptionsSchema } from "@tokenring-ai/cloudquote";

const packageConfigSchema = z.object({
  cloudquote: CloudQuoteServiceOptionsSchema.nullable().prefault(() => {
    if (process.env.CLOUDQUOTE_API_KEY) {
      return {apiKey: process.env.CLOUDQUOTE_API_KEY};
    }
    return null;
  })
});
```

**Note:** The plugin configuration uses `nullable().prefault()` to automatically load the API key from the `CLOUDQUOTE_API_KEY` environment variable if available.

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `cloudquote` | object | No | CloudQuote service configuration |
| `cloudquote.apiKey` | string | Yes (if cloudquote is configured) | CloudQuote API key |

### Environment Variables

It's recommended to store your API key in environment variables for security:

```bash
export CLOUDQUOTE_API_KEY=your-cloudquote-api-key
```

### Plugin Installation Example

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY || 'your-api-key'
  }
});
```

## Integration

### Agent System Integration

The CloudQuote service integrates with the agent system through the `requireServiceByType` method. All tools in this package follow this pattern:

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import CloudQuoteService from "@tokenring-ai/cloudquote";

async function execute(params, agent: Agent) {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  // Use the service to make API calls
  return await cloudQuoteService.getJSON('fcon/getQuote', { 
    symbol: params.symbols 
  });
}
```

### Chat Service Integration

The plugin automatically registers tools with the ChatService when installed:

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { RpcService } from "@tokenring-ai/rpc";

export default {
  name: "@tokenring-ai/cloudquote",
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(cloudquoteRPC);
    });
    if (config.cloudquote) {
      app.addServices(new CloudQuoteService(app, config.cloudquote));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

**Note:** The plugin registers both tools (for chat/agent interaction) and RPC endpoints (for programmatic access). The service is only initialized if a valid API key is provided.

### Tool Registration

All tools are automatically registered when the plugin is installed. The following tools are available:

- `cloudquote_getQuote`
- `cloudquote_getLeaders`
- `cloudquote_getPriceTicks`
- `cloudquote_getPriceHistory`
- `cloudquote_getHeadlinesBySecurity`

## Usage Examples

### Getting Real-time Quotes

```typescript
const result = await agent.invokeTool('cloudquote_getQuote', {
  symbols: ['AAPL', 'GOOGL', 'MSFT']
});

// Response contains pricing and metadata for each symbol
console.log(result);
/*
{
  rows: [
    {
      Symbol: "AAPL",
      Price: 175.00,
      Change: 2.50,
      Volume: 50000000,
      // ... additional metadata (see CloudQuoteQuoteSchema)
    },
    // ... additional symbols
  ]
}
*/
```

**Response Schema:** The response follows the `CloudQuoteQuoteSchema` which includes core identification fields, price fields, calculated fields (Change, ChangePercent), volume fields, exchange information, and many more fields as defined in `schema.ts`.

### Getting Market Leaders

```typescript
// Get top 10 percentage gainers
const gainers = await agent.invokeTool('cloudquote_getLeaders', {
  list: 'PERCENTGAINERS',
  type: 'STOCK',
  limit: 10
});

// Get most active stocks by volume
const mostActive = await agent.invokeTool('cloudquote_getLeaders', {
  list: 'MOSTACTIVE',
  limit: 20
});

// Get biggest percentage losers
const losers = await agent.invokeTool('cloudquote_getLeaders', {
  list: 'PERCENTLOSERS',
  type: 'ETF',
  limit: 15
});

// Response format
console.log(gainers);
/*
{
  data: [
    {
      Symbol: "AAPL",
      ChangePercent: 5.23,
      Volume: 50000000,
      // ... additional details (see CloudQuoteQuoteSchema)
    },
    // ... additional leaders
  ]
}
*/
```

### Getting Historical Price Data

```typescript
// Get historical data for AAPL with proper date range
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',  // Start 1 day before
  to: '2024-01-16'     // End 1 day after
});

// Response contains historical price data with dates in YYYY-MM-DD format
console.log(history);
/*
{
  rows: [
    ["2024-01-14", 150.00, 152.00, 148.00, 151.00, 50000000, 150.50],
    // ... additional historical records
  ]
}
*/
```

**Response Format:** The response is an array of tuples where each tuple contains:
- Index 0: Date string in YYYY-MM-DD format (America/New_York timezone)
- Index 1: Open price
- Index 2: High price
- Index 3: Low price
- Index 4: Close price
- Index 5: Cumulative Volume
- Index 6: Adjusted close price

### Getting Intraday Price Ticks

```typescript
// Get intraday price ticks for AAPL
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});

// Response contains array of [date, price, volume] tuples
console.log(ticks);
/*
{
  rows: [
    ["2024-01-15", 175.00, 2000000],  // [date, price, cumulativeVolume]
    // ... additional tick data
  ]
}
*/
```

**Response Format:** The response is an array of tuples where each tuple contains:
- Index 0: Date string in YYYY-MM-DD format (America/New_York timezone)
- Index 1: Price (number)
- Index 2: Cumulative Volume (number)

**Note:** The tool fetches all available intraday ticks for the symbol. You may need to filter the results client-side based on your specific time requirements.

### Getting News Headlines

```typescript
// Get news headlines for AAPL and GOOGL
const headlines = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL,GOOGL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});

// Response contains news headlines with automatically populated links
console.log(headlines);
/*
{
  rows: [
    {
      title: "Apple Reports Record Quarterly Earnings",
      bodyId: "12345",
      slug: "apple-records-earnings",
      link: "https://www.financialcontent.com/article/apple-records-earnings",  // Auto-populated
      published: "2024-01-15T10:30:00Z"
    },
    // ... additional headlines
  ]
}
*/
```

**Important:** This tool calls the `fcon/getHeadlinesBySecurity` endpoint, but the underlying service method `getHeadlinesBySecurity` makes requests to `http://api.newsrpm.com` (NewsRPM API), not the CloudQuote API.

**Automatic Link Generation:** The tool automatically populates the `link` field for headlines that have both `bodyId` and `slug` fields using the pattern: `https://www.financialcontent.com/article/{slug}`

### Generating Price Charts

```typescript
// Generate a 1-day price chart for AAPL
const chart = await cloudQuoteService.getPriceChart({ 
  symbol: 'AAPL', 
  interval: '1D' 
});

// The URL can be used directly in HTML
console.log(chart.svgDataUri);
// Output: "https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&..."
```

**Note:** The returned URL is a static URL from financialcontent.com Chart service, not an actual SVG data URI despite the property name `svgDataUri`.

## Best Practices

### API Key Management

- **Never hardcode API keys** in source code
- Use environment variables for production deployments
- Rotate API keys regularly for security
- Use `.env` files for local development (add to `.gitignore`)

### Date Handling for Historical Data

When using `getPriceHistory`, always request a date range that is **1 day ahead and 1 day behind** the date you want to analyze:

```typescript
// ❌ Incorrect - would not return data for 2024-01-15
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-15',
  to: '2024-01-15'
});

// ✅ Correct - requests 1 day before and after
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',
  to: '2024-01-16'
});
```

### Timezone-Aware Formatting

All price history and tick data are returned with timezone-aware dates. The service uses **America/New_York** timezone for date formatting:

```typescript
// Timestamps are automatically converted to America/New_York timezone
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Result dates are in YYYY-MM-DD format (America/New_York timezone)
```

**Implementation Detail:** The tools use `date-fns-tz` library to convert epoch nanosecond timestamps to timezone-aware date strings:

```typescript
import {format, toZonedTime} from "date-fns-tz";

const zoned = toZonedTime(timestamp, 'America/New_York');
const dateStr = format(zoned, 'yyyy-MM-dd');
```

### Timeframe Handling for Price Ticks

For `getPriceTicks`, the API expects you to request a data range 5 minutes ahead and behind the time you are looking for. The tool fetches all available intraday ticks for the symbol:

```typescript
// Fetches all intraday ticks for the symbol
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Returns array of [date, price, cumulativeVolume] tuples
```

**Note:** The tool does not filter by time range - it returns all available intraday data. You may need to filter the results client-side based on your specific time requirements.

### News Headline Links

The service automatically fills in links for news headline data when both `bodyId` and `slug` are available:

```typescript
const headlines = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL'
});

// Links are automatically populated when available
headlines.rows.forEach(headline => {
  if (headline.bodyId && headline.slug) {
    console.log(headline.link); // Automatically set to https://www.financialcontent.com/article/{slug}
  }
});
```

**Implementation Detail:** The tool iterates through all headline rows and populates the `link` field using the pattern:
```typescript
row.link = `https://www.financialcontent.com/article/${row.slug}`;
```

### Rate Limiting

- Be mindful of API rate limits when making multiple requests
- The service includes a **10-second timeout** for requests using `AbortController`
- Consider implementing retry logic for transient failures

**Important:** The `getHeadlinesBySecurity` method uses a different API endpoint (`http://api.newsrpm.com`) than other methods (`https://api.cloudquote.io`). Both use the same API key for authentication.

### Performance Considerations

- Use `limit` parameters in `getLeaders` to control result size
- Set appropriate `start` and `count` values for large result sets
- Consider caching frequently accessed data to reduce API calls
- For `getHeadlinesBySecurity`, use `count` parameter to limit results (max 100)

### Error Handling

Always handle `CloudQuoteError` exceptions appropriately:

```typescript
import { CloudQuoteError } from "@tokenring-ai/cloudquote";

try {
  const result = await agent.invokeTool('cloudquote_getQuote', {
    symbols: ['AAPL']
  });
} catch (err) {
  if (err instanceof CloudQuoteError) {
    console.error(`API Error: ${err.message}`);
    console.error(`Details: ${err.cause}`);
    // Handle API-specific errors
  } else {
    console.error(`Unexpected error: ${err}`);
    // Handle other errors
  }
}
```



## Schema Definitions

The package exports Zod schemas for type-safe data validation:

### CloudQuoteServiceOptionsSchema

```typescript
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});
```

### CloudQuoteQuoteSchema

Comprehensive schema for quote data with the following field categories:

- **Core identification**: Symbol, Name, ShortName, SymbolID
- **Price fields**: Price, PrevClose, Ask, Bid, High, Low, Open, AfterHoursPrice
- **Calculated fields**: Change, ChangePercent
- **Size fields**: AskSize, BidSize
- **Time fields**: LastTradeTime, AfterHoursTradeTime
- **Volume fields**: Volume, AverageVolume, AvgVolume1M, AvgVolume1W, AvgVolume3M, etc.
- **Dividend fields**: AnnualDividend, TTMDividend, YTDDividend, LatestDividend, etc.
- **Financial fields**: EPS, SharesOutstanding
- **Exchange information**: ExchangeName, ExchangeShortName, ExchangePrefixCode, ExchangeDefaultCurrency
- **Security type**: SecurityTypeName, SecurityTypeCode
- **Currency**: NominalCurrencyCode, NominalCurrencyName
- **Period prices**: StartingPrice1M, StartingPrice1W, StartingPrice3M, etc.
- **Low/High values and dates**: Low1M, Low1MDate, High1M, High1MDate, etc.
- **Chart fields**: ChartStartTime, ChartEndTime, HolidayName
- **Moving averages**: MovingAverage50, MovingAverage200
- **Other**: Delay, CIK

### CloudQuoteQuoteHistoricalItemSchema

Tuple schema for historical price data:
```typescript
z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Open price"),
  z.number().describe("High price"),
  z.number().describe("Low price"),
  z.number().describe("Close price"),
  z.number().describe("Cumulative Volume"),
  z.number().describe("Adjusted close price"),
]);
```

### CloudQuoteQuoteIntradayItemSchema

Tuple schema for intraday price ticks:
```typescript
z.tuple([
  z.number().describe("Timestamp in epoch nanoseconds"),
  z.number().describe("Price"),
  z.number().describe("Cumulative Volume")
]);
```

## Package Structure

```
pkg/cloudquote/
├── CloudQuoteService.ts    # Core service implementation
├── plugin.ts               # Plugin initialization and registration
├── tools.ts                # Tool registry
├── rpc/
│   ├── cloudquote.ts       # RPC endpoint definitions
│   └── schema.ts           # RPC schema definitions
├── tools/
│   ├── getHeadlinesBySecurity.ts  # News headlines tool
│   ├── getLeaders.ts              # Market leaders tool
│   ├── getPriceHistory.ts         # Historical price tool
│   ├── getPriceTicks.ts           # Intraday ticks tool
│   └── getQuote.ts                # Real-time quote tool
├── schema.ts               # Data schemas
├── index.ts                # Package exports
├── package.json            # Package configuration
└── vitest.config.ts        # Test configuration
```

## Exports

```typescript
// Main exports from index.ts
export {default as CloudQuoteService} from "./CloudQuoteService.ts";

// CloudQuoteError is available from CloudQuoteService.ts
export {CloudQuoteError} from "./CloudQuoteService.ts";

// Tools are exported through tools.ts
export {default as tools} from "./tools.ts";
```

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework and plugin management |
| `@tokenring-ai/agent` | 0.2.0 | Agent system and service management |
| `@tokenring-ai/chat` | 0.2.0 | Chat interface and tool definitions |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities and HTTP services |
| `date-fns-tz` | ^3.2.0 | Timezone-aware date manipulation |
| `zod` | ^4.3.6 | Runtime type checking and schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Unit testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Generate coverage report
bun test:coverage
```

### Test Configuration

The package uses vitest for testing with the configuration in `vitest.config.ts`.

### Test Structure

Tests should verify:

- **Tool Input Validation**: Ensure required parameters are validated (e.g., non-empty symbols array for getQuote)
- **Service Initialization**: Test service creation with valid and missing API keys
- **API Request Parameters**: Verify correct parameter serialization and API endpoint calls
- **Response Handling**: Test parsing and transformation of API responses
- **Error Cases**: Test CloudQuoteError handling for network errors, invalid responses, and API failures
- **Timezone Conversion**: Verify date-fns-tz conversion to America/New_York timezone
- **Automatic Link Generation**: Test that headlines with bodyId and slug get correct link URLs
- **RPC Endpoint Registration**: Verify RPC endpoints are properly registered and callable

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import CloudQuoteService from '../CloudQuoteService';

describe('CloudQuoteService', () => {
  it('should initialize with valid API key', () => {
    const service = new CloudQuoteService({ 
      apiKey: 'test-api-key' 
    });
    expect(service.name).toBe('CloudQuote');
  });

  it('should throw error with missing API key', () => {
    expect(() => {
      new CloudQuoteService({ apiKey: '' } as any);
    }).toThrow();
  });
});
```

## Related Components

### Core Dependencies

- **@tokenring-ai/app**: Base application framework with service management and plugin architecture
- **@tokenring-ai/agent**: Agent system for orchestrating tool usage and execution
- **@tokenring-ai/chat**: Chat interface, tool definitions, and RPC service integration
- **@tokenring-ai/rpc**: RPC service for endpoint registration and programmatic access
- **@tokenring-ai/utility**: HTTP utilities including `HttpService` base class and `doFetchWithRetry`

### Utility Packages

- **@tokenring-ai/utility/http/HttpService**: Base HTTP service class for making API requests
- **@tokenring-ai/utility/http/doFetchWithRetry**: HTTP request utility with retry logic
- **date-fns-tz**: Timezone-aware date formatting library
- **zod**: Schema validation and type inference

### External Services

- **CloudQuote API** (`https://api.cloudquote.io`): Financial data API for quotes, history, ticks, and leaders
- **NewsRPM API** (`http://api.newsrpm.com`): News headlines API for security-related news

## License

MIT License - see LICENSE file for details.
