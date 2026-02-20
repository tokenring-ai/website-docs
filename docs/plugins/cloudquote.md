# CloudQuote Financial Data Tools

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer, enabling access to pricing information, historical data, price ticks, and news headlines for securities.

## Overview

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer, enabling access to pricing information, historical data, price ticks, and news headlines for securities. This package integrates with the CloudQuote financial data API to deliver comprehensive market data for analysis and reporting.

## Key Features

- **Real-time Quote Data**: Retrieve pricing and metadata for single or multiple securities
- **Historical Price Data**: Fetch daily historical price data with timezone-aware formatting
- **Intraday Price Ticks**: Get intraday price data with time, price, and volume information
- **Market Leaders**: Access lists of most active stocks, percentage gainers, percentage losers, and popular stocks
- **News Headlines**: Retrieve news headlines for specified ticker symbols within date ranges
- **SVG Price Charts**: Generate dynamic price charts for securities
- **Robust Error Handling**: Custom error types for API-related issues with detailed diagnostics

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote.

```typescript
import CloudQuoteService, { CloudQuoteError } from "@tokenring-ai/cloudquote";

interface CloudQuoteServiceOptions {
  apiKey: string;
}

class CloudQuoteService extends HttpService implements TokenRingService {
  name = "CloudQuote";
  description = "Service for accessing CloudQuote financial data API";
  
  protected baseUrl = "https://api.cloudquote.io";
  protected defaultHeaders: Record<string, string>;
  private readonly timeout = 10_000;
  
  constructor(options: CloudQuoteServiceOptions) {
    // API key must be provided in options
  }
  
  // API methods
  async getJSON(apiPath: string, params: Record<string, any>): Promise<any>;
  async getHeadlinesBySecurity(params: any): Promise<any>;
  async getPriceChart(params: any): Promise<{ svgDataUri: string }>;
}
```

**Service Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service identifier ("CloudQuote") |
| `description` | string | Service description |
| `baseUrl` | string | Base API URL ("https://api.cloudquote.io") |
| `defaultHeaders` | Record<string, string> | HTTP headers including API key |
| `timeout` | number | Request timeout in milliseconds (10 seconds) |

**Constructor Options:**

```typescript
interface CloudQuoteServiceOptions {
  apiKey: string;  // Your CloudQuote API key (required)
}
```

### Service Methods

| Method | Description | API Endpoint | Base URL |
|--------|-------------|--------------|----------|
| `getJSON(apiPath, params)` | Generic JSON API request | Dynamic | `https://api.cloudquote.io` |
| `getHeadlinesBySecurity(params)` | Get news headlines by ticker | `fcon/getHeadlinesBySecurity` | `http://api.investcenter.newsrpm.com:16016` |
| `getPriceChart(params)` | Get SVG price chart | Dynamic | `https://chart.financialcontent.com` |

**Error Handling:**

The service uses a custom `CloudQuoteError` class for API-related errors:

```typescript
import { CloudQuoteError } from "@tokenring-ai/cloudquote";

try {
  const service = new CloudQuoteService({ apiKey: process.env.CLOUDQUOTE_API_KEY });
  await service.getJSON('fcon/getQuote', { symbol: 'AAPL' });
} catch (err) {
  if (err instanceof CloudQuoteError) {
    console.error(`CloudQuote Error: ${err.message}`);
    console.error(`Cause: ${err.cause}`);
  }
}
```

## Tools

The package provides the following tools that can be used in TokenRing Writer agents:

### 1. getQuote

Retrieve pricing and metadata for given security symbols.

**Tool Definition:**

| Property | Value |
|----------|-------|
| Name | `cloudquote_getQuote` |
| Display Name | `Cloudquote/getQuote` |
| Description | Retrieve pricing and metadata for given security symbols. |

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string[] | Yes | Array of ticker symbols to fetch (e.g., `['AAPL', 'GOOGL', 'MSFT']`) |

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getQuote', {
  symbols: ['AAPL', 'GOOGL', 'MSFT']
});

// Response contains pricing and metadata for each symbol
console.log(result);
/*
[
  {
    symbol: "AAPL",
    price: 175.00,
    change: 2.50,
    volume: 50000000,
    // ... additional metadata
  },
  // ... additional symbols
]
*/
```

### 2. getLeaders

Get a list of stocks that are notable today.

**Tool Definition:**

| Property | Value |
|----------|-------|
| Name | `cloudquote_getLeaders` |
| Display Name | `Cloudquote/getLeaders` |
| Description | Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers, or most popular stocks). |

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list` | "MOSTACTIVE" \| "PERCENTGAINERS" \| "PERCENTLOSERS" | Yes | Type of list |
| `type` | "STOCK" \| "ETF" | No | Security type |
| `limit` | number (1-50) | No | Max number of results |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getLeaders', {
  list: 'PERCENTGAINERS',
  type: 'STOCK',
  limit: 10
});

// Response contains list of gainers
console.log(result);
/*
[
  {
    symbol: "AAPL",
    changePercent: 5.23,
    volume: 50000000,
    // ... additional details
  },
  // ... additional leaders
]
*/
```

### 3. getPriceTicks

Fetch intraday price ticks (time, price, volume) for a symbol.

**Tool Definition:**

| Property | Value |
|----------|-------|
| Name | `cloudquote_getPriceTicks` |
| Display Name | `Cloudquote/getPriceTicks` |
| Description | Fetch intraday price ticks (time, price, volume) for a symbol. To use this API correctly, request a data range 5 min ahead and behind the time you are looking for. |

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Ticker symbol |

**Important:** For `getPriceTicks`, request a data range 5 minutes ahead and behind the time you are looking for.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});

// Response contains array of [date, price, volume] tuples with timezone-aware dates
console.log(result);
/*
[
  {
    0: "2024-01-15",  // Date in America/New_York timezone
    1: 175.00,        // Price
    2: 2000000        // Volume
  },
  // ... additional tick data
]
*/
```

### 4. getPriceHistory

Fetch historical daily price data for a symbol.

**Tool Definition:**

| Property | Value |
|----------|-------|
| Name | `cloudquote_getPriceHistory` |
| Display Name | `Cloudquote/getPriceHistory` |
| Description | Fetch historical daily price data for a symbol. To use this API correctly, request a date range 1 day ahead and 1 day behind the date you are looking for. |

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Ticker symbol |
| `from` | string | No | Start date (YYYY-MM-DD). Must be at least 1 day before date requested |
| `to` | string | No | End date (YYYY-MM-DD). Must be at least 1 day after date requested |

**Important:** When using `getPriceHistory`, request a date range that is 1 day ahead and 1 day behind the date you want to analyze.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',
  to: '2024-01-16'
});

// Response contains historical price data with dates in YYYY-MM-DD format
console.log(result);
/*
[
  {
    0: "2024-01-14",  // Date in America/New_York timezone
    1: 150.00,        // Open price
    2: 152.00,        // High price
    // ... additional data
  },
  // ... additional historical records
]
*/
```

### 5. getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols within a specified time range.

**Tool Definition:**

| Property | Value |
|----------|-------|
| Name | `cloudquote_getHeadlinesBySecurity` |
| Display Name | `Cloudquote/getHeadlinesBySecurity` |
| Description | Retrieve news headlines for one or more ticker symbols within a specified time range. |

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | Yes | Comma-separated ticker symbols (e.g., `'GOOG,AAPL'`) |
| `start` | number | No | Number of records to skip before returning results |
| `count` | number | No | Number of records to retrieve (max 100) |
| `minDate` | string | No | Article publication date-time (ISO 8601) for start of date-time range |
| `maxDate` | string | No | Article publication date-time (ISO 8601) for end of date-time range |

**Note:** The service automatically fills in links for news headlines when `bodyId` is available.

**Example Usage:**

```typescript
const result = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL',
  start: 0,
  count: 10,
  minDate: '2024-01-01T00:00:00Z',
  maxDate: '2024-01-15T23:59:59Z'
});

// Response contains news headlines with automatically populated links
console.log(result);
/*
[
  {
    title: "Apple Reports Record Quarterly Earnings",
    bodyId: "12345",
    slug: "apple-records-earnings",
    link: "https://www.financialcontent.com/article/apple-records-earnings",  // Auto-populated
    published: "2024-01-15T10:30:00Z"
  },
  // ... additional headlines
]
*/
```

## Plugin Configuration

The package can be configured through the TokenRing application configuration:

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY
  }
});
```

**Configuration Schema:**

```typescript
z.object({
  cloudquote: CloudQuoteServiceOptionsSchema.optional()
});

// CloudQuoteServiceOptionsSchema
z.object({
  apiKey: z.string()
});
```

**Environment Variables:**

It's recommended to store your API key in environment variables for security:

```bash
export CLOUDQUOTE_API_KEY=your-cloudquote-api-key
```

## Agent Configuration

This package does not define agent-specific configuration schemas.

## RPC Endpoints

This package does not define RPC endpoints.

## Chat Commands

This package does not define chat commands. All functionality is exposed through tools that can be invoked by agents.

## State Management

This package does not define state management patterns.

## Integration

### Agent Service Integration

The CloudQuote service integrates with the agent system through the `requireServiceByType` method:

```typescript
async function execute(params, agent) {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  return await cloudQuoteService.getJSON('fcon/getQuote', { symbol: params.symbols });
}
```

### Chat Service Integration

The plugin automatically registers tools with the ChatService when installed:

```typescript
import tokenringPlugin from "@tokenring-ai/cloudquote";

app.installPlugin(tokenringPlugin, {
  cloudquote: {
    apiKey: process.env.CLOUDQUOTE_API_KEY
  }
});
```

## Best Practices

### API Key Management

- Never hardcode API keys in source code
- Use environment variables for production deployments
- Rotate API keys regularly for security

### Date Handling for Historical Data

When using `getPriceHistory`, request a date range that is 1 day ahead and 1 day behind the date you want to analyze:

```typescript
// Incorrect - would not return data for 2024-01-15
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-15',
  to: '2024-01-15'
});

// Correct - requests 1 day before and after
const history = await agent.invokeTool('cloudquote_getPriceHistory', {
  symbol: 'AAPL',
  from: '2024-01-14',
  to: '2024-01-16'
});
```

### Timezone-Aware Formatting

Price history and tick data are returned with timezone-aware dates. The service uses `America/New_York` timezone for date formatting:

```typescript
// Prices are automatically converted to correct timezone
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Result timestamps are in America/New_York timezone (YYYY-MM-DD format)
```

### Timeframe Handling for Price Ticks

For `getPriceTicks`, request a data range 5 minutes ahead and behind the time you are looking for:

```typescript
// Request a 10-minute window around the time of interest
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
```

### News Headline Links

The service automatically fills in links for news headline data when `bodyId` is available:

```typescript
const headlines = await agent.invokeTool('cloudquote_getHeadlinesBySecurity', {
  symbols: 'AAPL'
});

// Links are automatically populated when available
headlines.forEach(headline => {
  if (headline.bodyId) {
    console.log(headline.link); // Automatically set based on slug
  }
});
```

### Rate Limiting

Be mindful of API rate limits when making multiple requests. The service includes a 10-second timeout for requests.

### Performance Considerations

- Use limit parameters in `getLeaders` to control result size
- Set appropriate `start` and `count` values for large result sets
- Consider caching frequently accessed data to reduce API calls
- For `getHeadlinesBySecurity`, use `count` parameter to limit results (max 100)

## Package Structure

```
pkg/cloudquote/
├── CloudQuoteService.ts    # Core service implementation
├── plugin.ts               # Plugin initialization
├── tools.ts                # Tool registry
├── tools/
│   ├── getHeadlinesBySecurity.ts
│   ├── getLeaders.ts
│   ├── getPriceHistory.ts
│   ├── getPriceTicks.ts
│   └── getQuote.ts
├── index.ts                # Package exports
├── package.json            # Package configuration
└── vitest.config.ts        # Test configuration
```

## Exports

```typescript
// Main exports
export {default as CloudQuoteService} from "./CloudQuoteService.ts";

// CloudQuoteError class is available from CloudQuoteService.ts
export {CloudQuoteError} from "./CloudQuoteService.ts";
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0): Base application framework and plugin management
- `@tokenring-ai/agent` (0.2.0): Agent system and service management
- `@tokenring-ai/chat` (0.2.0): Chat interface and tool definitions
- `@tokenring-ai/utility` (0.2.0): Shared utilities and HTTP services
- `date-fns-tz` (^3.2.0): Timezone-aware date manipulation
- `zod` (^4.3.6): Runtime type checking and schema validation

### Development Dependencies

- `vitest` (^4.0.18): Unit testing framework
- `typescript` (^5.9.3): TypeScript compiler

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

### Test Structure

Tests are organized using vitest and follow the project's testing conventions. Test files should verify:

- Tool input validation
- Service initialization with valid and invalid API keys
- API request parameters and response handling
- Error cases and edge conditions

## Related Components

- **@tokenring-ai/agent**: Agent system for orchestrating tool usage
- **@tokenring-ai/chat**: Chat interface and tool definitions
- **@tokenring-ai/utility**: HTTP utilities for making API requests
- **@tokenring-ai/app**: Base application framework with plugin architecture

## License

MIT License