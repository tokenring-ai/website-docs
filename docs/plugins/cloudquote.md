# CloudQuote Financial Data Tools

The `@tokenring-ai/cloudquote` package provides financial data tools for TokenRing Writer agents, enabling access to real-time pricing information, historical data, price ticks, market leaders, and news headlines for securities through the CloudQuote API.

## Overview

The `@tokenring-ai/cloudquote` package provides comprehensive financial data tools for TokenRing Writer agents. It integrates with the CloudQuote financial data API to deliver real-time market data, historical price information, intraday ticks, market leaders, and news headlines. The package includes robust error handling, timezone-aware date formatting, and automatic link generation for news headlines.

### Key Features

- **Real-time Quote Data**: Retrieve pricing and metadata for single or multiple securities
- **Historical Price Data**: Fetch daily historical price data with timezone-aware formatting
- **Intraday Price Ticks**: Get intraday price data with time, price, and volume information
- **Market Leaders**: Access lists of most active stocks, percentage gainers, and percentage losers
- **News Headlines**: Retrieve news headlines for specified ticker symbols within date ranges
- **Price Chart URLs**: Generate dynamic price chart URLs for securities
- **Robust Error Handling**: Custom error types for API-related issues with detailed diagnostics
- **Timezone-Aware Formatting**: All dates are formatted in America/New_York timezone
- **Automatic Link Generation**: News headline links are automatically populated when available

## Core Components

### CloudQuoteService

The `CloudQuoteService` is the core service that manages authentication and API communication with CloudQuote. It extends `HttpService` and implements the `TokenRingService` interface.

#### Service Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service identifier (`"CloudQuote"`) |
| `description` | string | Human-readable service description |
| `baseUrl` | string | CloudQuote API endpoint URL (`https://api.cloudquote.io`) |
| `defaultHeaders` | `Record<string, string>` | HTTP headers including API key authorization |
| `timeout` | number | Request timeout in milliseconds (`10,000`) |

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

##### `constructor(options: CloudQuoteServiceOptions)`

Creates a new CloudQuoteService instance with the provided API key.

**Parameters:**

- `options` (CloudQuoteServiceOptions): Configuration options
  - `apiKey` (string): CloudQuote API key (required)

**Example:**

```typescript
import CloudQuoteService from "@tokenring-ai/cloudquote";

const service = new CloudQuoteService({
  apiKey: process.env.CLOUDQUOTE_API_KEY
});
```

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

Retrieve news headlines from the CloudQuote API. This method handles the API communication and returns headline data.

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

##### `getPriceChart(params: any): Promise<{ svgDataUri: string }>`

Generate a price chart URL for a security. This method returns a URL that can be used directly in HTML or displayed. **Note: This is a service method only and is not exposed as a tool.**

**Parameters:**

- `params` (any): Chart parameters
  - `symbol` (string): Ticker symbol
  - `interval` (string): Chart interval (e.g., `'1D'`, `'5D'`, `'1M'`)

**Returns:** `Promise<{ svgDataUri: string }>` - Chart URL

**Example:**

```typescript
const chart = await cloudQuoteService.getPriceChart({ 
  symbol: 'AAPL', 
  interval: '1D' 
});
console.log(chart.svgDataUri);
```

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
  const service = new CloudQuoteService({ 
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

The `CloudQuoteService` provides direct access to the CloudQuote financial data API and implements the `TokenRingService` interface.

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

app.addServices(new CloudQuoteService({
  apiKey: process.env.CLOUDQUOTE_API_KEY
}));
```

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

This package does not define RPC endpoints. All functionality is exposed through tools that can be invoked by agents.

## Chat Commands

This package does not define chat commands. All functionality is exposed through tools that can be invoked by agents.

## Configuration

### Plugin Configuration Schema

```typescript
import { z } from "zod";
import CloudQuoteService, { CloudQuoteServiceOptionsSchema } from "@tokenring-ai/cloudquote";

const packageConfigSchema = z.object({
  cloudquote: CloudQuoteServiceOptionsSchema.optional(),
});
```

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

export default {
  name: "@tokenring-ai/cloudquote",
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    if (config.cloudquote) {
      app.addServices(new CloudQuoteService(config.cloudquote));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

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

### Getting Intraday Price Ticks

```typescript
// Get intraday price ticks for AAPL
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});

// Response contains array of [date, price, volume] tuples
console.log(ticks);
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

### Generating Price Charts

```typescript
// Generate a 1-day price chart for AAPL
const chart = await cloudQuoteService.getPriceChart({ 
  symbol: 'AAPL', 
  interval: '1D' 
});

// The URL can be used directly in HTML
console.log(chart.svgDataUri);
```

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
// Prices are automatically converted to correct timezone
const ticks = await agent.invokeTool('cloudquote_getPriceTicks', {
  symbol: 'AAPL'
});
// Result timestamps are in America/New_York timezone (YYYY-MM-DD format)
```

### Timeframe Handling for Price Ticks

For `getPriceTicks`, the API requires requesting a data range **5 minutes ahead and behind** the time you are looking for. The tool handles this automatically, but be aware when interpreting results.

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

- Be mindful of API rate limits when making multiple requests
- The service includes a **10-second timeout** for requests
- Consider implementing retry logic for transient failures

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

### Available Lists for getLeaders

The `getLeaders` tool supports the following list types:

- `MOSTACTIVE` - Most active stocks by volume
- `PERCENTGAINERS` - Highest percentage gainers
- `PERCENTLOSERS` - Biggest percentage losers

Note: "MOSTPOPULAR" is not currently supported.

## Package Structure

```
pkg/cloudquote/
├── CloudQuoteService.ts    # Core service implementation
├── plugin.ts               # Plugin initialization and registration
├── tools.ts                # Tool registry
├── tools/
│   ├── getHeadlinesBySecurity.ts  # News headlines tool
│   ├── getLeaders.ts              # Market leaders tool
│   ├── getPriceHistory.ts         # Historical price tool
│   ├── getPriceTicks.ts           # Intraday ticks tool
│   └── getQuote.ts                # Real-time quote tool
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

### Test Structure

Tests are organized using vitest and follow the project's testing conventions. Test files should verify:

- Tool input validation
- Service initialization with valid and invalid API keys
- API request parameters and response handling
- Error cases and edge conditions
- Timezone-aware date formatting
- Automatic link generation for news headlines

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

- **@tokenring-ai/agent**: Agent system for orchestrating tool usage
- **@tokenring-ai/chat**: Chat interface and tool definitions
- **@tokenring-ai/utility**: HTTP utilities for making API requests
- **@tokenring-ai/app**: Base application framework with plugin architecture
- **@tokenring-ai/utility/http/doFetchWithRetry**: HTTP request utility with retry logic
- **@tokenring-ai/utility/http/HttpService**: Base HTTP service class

## License

MIT License - see LICENSE file for details.
