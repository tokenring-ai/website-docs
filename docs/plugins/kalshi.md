# Kalshi Plugin

## Overview

The Kalshi Plugin provides integration with Kalshi prediction markets, enabling AI agents to query market series, markets, events, and orderbooks. It allows agents to interact with Kalshi's prediction market data for research, analysis, and decision-making purposes.

This plugin serves as a service that integrates with the TokenRing agent system. It provides tools for programmatic access to Kalshi's prediction market data, including series, markets, events, and orderbook information.

## Key Features

- **Series Retrieval**: Get detailed information about market series
- **Market Listing**: List markets with filtering options and pagination support
- **Event Retrieval**: Get detailed information about specific events
- **Orderbook Access**: Access real-time orderbook data for markets (bids only)
- **Configurable Base URL**: Support for custom Kalshi API endpoints
- **RESTful API**: Uses standard HTTP requests for API interactions
- **Error Handling**: Comprehensive error handling for API operations
- **Agent Tools**: Four pre-built tools for AI workflows
- **Type Safety**: Full TypeScript support with Zod schemas

## Core Components

### KalshiService

The core service class that extends `HttpService` and implements `TokenRingService`. It provides methods for querying Kalshi prediction markets.

**Service Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service identifier ("KalshiService") |
| `description` | `string` | Service description |
| `baseUrl` | `string` | Kalshi API base URL (defaults to production API) |

**Service Methods:**

| Method | Description | Parameters | Return Type |
|--------|-------------|------------|-------------|
| `getSeries(ticker)` | Retrieves detailed information about a series | `ticker: string` | `Promise<any>` |
| `getMarkets(options)` | Lists markets with optional filtering | `KalshiMarketOptions` | `Promise<any>` |
| `getEvent(ticker)` | Retrieves detailed information about an event | `ticker: string` | `Promise<any>` |
| `getOrderbook(ticker)` | Retrieves the orderbook for a market | `ticker: string` | `Promise<any>` |

### KalshiMarketOptions

Options for filtering and paginating market queries.

| Property | Type | Description |
|----------|------|-------------|
| `series_ticker` | `string` | Filter by series ticker |
| `status` | `string` | Filter by market status (e.g., "open", "closed") |
| `limit` | `number` | Number of results to return (max: 200, default: 100) |
| `cursor` | `string` | Pagination cursor for large result sets |

## Services

### KalshiService

The main service class that implements `TokenRingService`. It provides methods for querying Kalshi prediction markets.

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  protected baseUrl: string;
}
```

**Service Properties:**

- `name`: Service identifier ("KalshiService")
- `description`: Service description
- `baseUrl`: Kalshi API base URL

**Constructor:**

```typescript
constructor(config: KalshiConfig = {})
```

**Service Methods:**

```typescript
async getSeries(ticker: string): Promise<any>

async getMarkets(opts: KalshiMarketOptions = {}): Promise<any>

async getEvent(ticker: string): Promise<any>

async getOrderbook(ticker: string): Promise<any>
```

**Method Descriptions:**

- `getSeries(ticker)`: Retrieves detailed information about a series by ticker
- `getMarkets(opts)`: Lists markets with optional filtering
- `getEvent(ticker)`: Retrieves detailed information about an event by ticker
- `getOrderbook(ticker)`: Retrieves the orderbook for a specific market

**Market Options:**

```typescript
interface KalshiMarketOptions {
  series_ticker?: string;  // Filter by series ticker
  status?: string;         // Filter by market status (e.g., "open", "closed")
  limit?: number;          // Number of results to return
  cursor?: string;         // Pagination cursor for large result sets
}
```

## Provider Documentation

### KalshiService Provider

The `KalshiService` is a `TokenRingService` that can be required by agents using the `requireServiceByType` method.

**Provider Type:**

```typescript
import KalshiService from "@tokenring-ai/kalshi";

// In an agent context
const kalshi = agent.requireServiceByType(KalshiService);
```

**Tool Integration Example:**

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import {z} from "zod";
import KalshiService from "../KalshiService.ts";
import {TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";

const name = "kalshi_getSeries";
const inputSchema = z.object({
  ticker: z.string().min(1).describe("Series ticker (e.g., KXHIGHNY)"),
});

async function execute(
  {ticker}: z.output<typeof inputSchema>,
  agent: Agent
): Promise<TokenRingToolJSONResult<{series?: any}>> {
  const kalshi = agent.requireServiceByType(KalshiService);

  if (!ticker) {
    throw new Error(`[${name}] ticker is required`);
  }

  agent.infoMessage(`[kalshiGetSeries] Fetching series: ${ticker}`);
  const series = await kalshi.getSeries(ticker);
  return {
    type: "json",
    data: {series}
  };
}
```

## RPC Endpoints

This package does not define RPC endpoints.

## Chat Commands

This package does not define chat commands. The functionality is exposed through agent tools instead.

## Configuration

### Base URL Configuration

You can configure the service to use different API endpoints:

```typescript
import KalshiService from "@tokenring-ai/kalshi";

// Production API (default)
const kalshi = new KalshiService();

// Custom endpoint
const customKalshi = new KalshiService({
  baseUrl: "https://custom-api.example.com"
});
```

### Plugin Configuration Schema

```typescript
import {z} from "zod";
import KalshiConfigSchema from "@tokenring-ai/kalshi/KalshiService.ts";

const packageConfigSchema = z.object({
  kalshi: KalshiConfigSchema.optional()
});

// KalshiConfigSchema
z.object({
  baseUrl: z.string().optional(),
});
```

### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import kalshiPlugin from "@tokenring-ai/kalshi";

const app = new TokenRingApp();

app.install(kalshiPlugin, {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
  }
});
```

## Tools

The plugin provides the following tools for Kalshi operations:

### kalshi_getSeries

Retrieves detailed information about a specific market series.

**Tool Definition:**

- **Name**: `kalshi_getSeries`
- **Display Name**: `Kalshi/getSeries`
- **Description**: Get detailed information about a market series

**Input Schema:**

```typescript
z.object({
  ticker: z.string().min(1).describe("Series ticker (e.g., KXHIGHNY)")
})
```

**Execute Function:**

```typescript
async function execute(
  {ticker}: z.output<typeof inputSchema>,
  agent: Agent
): Promise<TokenRingToolJSONResult<{series?: any}>>
```

**Usage:**

```typescript
// Execute get series tool
const result = await agent.executeTool("kalshi_getSeries", {
  ticker: "PRES-24-SEC"
});

console.log("Series details:", result.series);
```

### kalshi_getMarkets

Lists Kalshi markets with optional filtering.

**Tool Definition:**

- **Name**: `kalshi_getMarkets`
- **Display Name**: `Kalshi/getMarkets`
- **Description**: List Kalshi markets with filtering options

**Input Schema:**

```typescript
z.object({
  series_ticker: z.string().optional().describe("Filter by series ticker"),
  status: z.string().optional().describe("Filter by market status (e.g., 'open', 'closed')"),
  limit: z.number().int().positive().max(200).optional().describe("Number of markets to return (max: 200)"),
  cursor: z.string().optional().describe("Pagination cursor")
})
```

**Execute Function:**

```typescript
async function execute(
  {series_ticker, status, limit, cursor}: z.output<typeof inputSchema>,
  agent: Agent
): Promise<TokenRingToolJSONResult<{markets?: any}>>
```

**Usage:**

```typescript
// Execute get markets tool
const result = await agent.executeTool("kalshi_getMarkets", {
  series_ticker: "PRES-24-SEC",
  status: "open",
  limit: 10
});

console.log("Markets found:", result.markets);
```

### kalshi_getEvent

Retrieves detailed information about a specific event.

**Tool Definition:**

- **Name**: `kalshi_getEvent`
- **Display Name**: `Kalshi/getEvent`
- **Description**: Get detailed information about a specific event

**Input Schema:**

```typescript
z.object({
  ticker: z.string().min(1).describe("Event ticker")
})
```

**Execute Function:**

```typescript
async function execute(
  {ticker}: z.output<typeof inputSchema>,
  agent: Agent
): Promise<TokenRingToolJSONResult<{event?: any}>>
```

**Usage:**

```typescript
// Execute get event tool
const result = await agent.executeTool("kalshi_getEvent", {
  ticker: "PRES-24-SEC-001"
});

console.log("Event title:", result.event.title);
```

### kalshi_getOrderbook

Retrieves the orderbook for a specific market.

**Tool Definition:**

- **Name**: `kalshi_getOrderbook`
- **Display Name**: `Kalshi/getOrderbook`
- **Description**: Get the orderbook for a specific market

**Input Schema:**

```typescript
z.object({
  ticker: z.string().min(1).describe("Market ticker")
})
```

**Execute Function:**

```typescript
async function execute(
  {ticker}: z.output<typeof inputSchema>,
  agent: Agent
): Promise<TokenRingToolJSONResult<{orderbook?: any}>>
```

**Usage:**

```typescript
// Execute get orderbook tool
const result = await agent.executeTool("kalshi_getOrderbook", {
  ticker: "PRES-24-SEC-001-YES"
});

console.log("Orderbook for market:", result.orderbook);
```

## State Management

The Kalshi Plugin does not maintain agent state. All operations are stateless and rely on the KalshiService instance for API interactions.

## Integration

### HttpService

The KalshiService extends `HttpService` from `@tokenring-ai/utility/http/HttpService` for HTTP request handling.

```typescript
import { HttpService } from "@tokenring-ai/utility/http/HttpService";

class KalshiService extends HttpService implements TokenRingService {
  protected baseUrl: string;

  constructor(config: KalshiConfig = {}) {
    super();
    this.baseUrl = config.baseUrl || "https://api.elections.kalshi.com/trade-api/v2";
  }

  async fetchJson(endpoint: string, options: RequestInit, operation: string): Promise<any> {
    return super.fetchJson(endpoint, options, operation);
  }
}
```

### Agent

The plugin integrates with the agent system through tools:

**Tools Registration:**

Tools are registered through the plugin's install method:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
```

**Service Registration:**

The service is added to the application:

```typescript
if (config.kalshi) {
  app.addServices(new KalshiService(config.kalshi));
}
```

### Plugin Installation

The plugin is installed during application initialization:

```typescript
import kalshiPlugin from "@tokenring-ai/kalshi";

const app = new app.App();

app.install(kalshiPlugin, {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
  }
});
```

## Usage Examples

### Basic Setup

```typescript
import kalshiPlugin from "@tokenring-ai/kalshi";
import app from "@tokenring-ai/app";

const app = new app.App();

app.install(kalshiPlugin, {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
  }
});
```

### Using the Get Series Tool

```typescript
import { Agent } from "@tokenring-ai/agent";

const agent = new Agent();

// Get specific series
const seriesResult = await agent.executeTool("kalshi_getSeries", {
  ticker: "PRES-24-SEC"
});

console.log("Series title:", seriesResult.series.title);
console.log("Series description:", seriesResult.series.description);
console.log("Series status:", seriesResult.series.status);
```

### Using the Get Markets Tool

```typescript
// List markets for a series
const marketsResult = await agent.executeTool("kalshi_getMarkets", {
  series_ticker: "PRES-24-SEC",
  status: "open"
});

console.log("Markets:", marketsResult.markets);
marketsResult.markets.forEach(market => {
  console.log(`- ${market.title} (${market.ticker})`);
  console.log(`  Price: ${market.price}`);
  console.log(`  Yes Volume: ${market.yes_share_volume}`);
  console.log(`  No Volume: ${market.no_share_volume}`);
});
```

### Using the Get Event Tool

```typescript
// Get specific event
const eventResult = await agent.executeTool("kalshi_getEvent", {
  ticker: "PRES-24-SEC-001"
});

console.log("Event:", eventResult.event.title);
console.log("Description:", eventResult.event.description);
console.log("Status:", eventResult.event.status);
console.log("Start Time:", eventResult.event.start_time);
console.log("End Time:", eventResult.event.end_time);
```

### Using the Get Orderbook Tool

```typescript
// Get orderbook for a market
const orderbookResult = await agent.executeTool("kalshi_getOrderbook", {
  ticker: "PRES-24-SEC-001-YES"
});

console.log("Market:", orderbookResult.orderbook.market_ticker);
console.log("Yes Orders:", orderbookResult.orderbook.yes_orders.length);
console.log("No Orders:", orderbookResult.orderbook.no_orders.length);

// Analyze spread
const yesBest = orderbookResult.orderbook.yes_orders[0];
const noBest = orderbookResult.orderbook.no_orders[0];
console.log(`Spread: ${noBest.price} - ${yesBest.price}`);
```

### Programmatic API Usage

```typescript
import { Agent } from "@tokenring-ai/agent";
import { KalshiService } from "@tokenring-ai/kalshi";

const agent = new Agent();
const kalshiService = agent.requireServiceByType(KalshiService);

// Get a series
const series = await kalshiService.getSeries("PRES-24-SEC");

// List markets
const markets = await kalshiService.getMarkets({
  series_ticker: "PRES-24-SEC",
  status: "open"
});

// Get an event
const event = await kalshiService.getEvent("PRES-24-SEC-001");

// Get an orderbook
const orderbook = await kalshiService.getOrderbook("PRES-24-SEC-001-YES");

// List markets with pagination
const page1 = await kalshiService.getMarkets({
  series_ticker: "PRES-24-SEC",
  limit: 10,
  cursor: undefined
});

const page2 = await kalshiService.getMarkets({
  series_ticker: "PRES-24-SEC",
  limit: 10,
  cursor: page1.cursor
});
```

### Analyzing Market Data

```typescript
// Search for open markets
const openMarkets = await kalshiService.getMarkets({
  status: "open"
});

// Analyze market prices
openMarkets.markets.forEach(market => {
  console.log(`Market: ${market.title}`);
  console.log(`  Yes Price: ${market.price}`);
  console.log(`  Yes Volume: ${market.yes_share_volume}`);
  console.log(`  No Volume: ${market.no_share_volume}`);
  console.log(`  Total Volume: ${market.yes_share_volume + market.no_share_volume}`);
});
```

### Tracking Events Over Time

```typescript
// Get event details
const event = await kalshiService.getEvent("PRES-24-SEC-001");

// Check market prices
const orderbook = await kalshiService.getOrderbook("PRES-24-SEC-001-YES");

console.log(`Event: ${event.title}`);
console.log(`Start: ${event.start_time}`);
console.log(`End: ${event.end_time}`);
console.log(`Yes Price: ${orderbook.yes_orders[0].price}`);
console.log(`No Price: ${orderbook.no_orders[0].price}`);
```

## Best Practices

### API Usage

- **Ticker Verification**: Always verify ticker symbols from search results
- **Status Filtering**: Use status filters to narrow results
- **Pagination**: Use cursor for large result sets
- **Error Handling**: Handle API errors gracefully

### Market Analysis

- **Compare Markets**: Use getMarkets to find related markets
- **Track Events**: Use getEvent to monitor event details
- **Analyze Orderbooks**: Use getOrderbook for real-time market data
- **Volume Analysis**: Compare volumes across markets

### Performance Considerations

- **Caching**: Cache API responses when appropriate
- **Rate Limiting**: Respect API rate limits
- **Batch Operations**: Use getMarkets for multiple markets instead of individual calls
- **Pagination**: Use cursor for efficient pagination

### Error Handling

- **Input Validation**: Always provide required parameters
- **API Errors**: Handle HTTP errors and API-specific errors
- **Network Errors**: Implement retry logic for transient failures
- **Ticker Errors**: Verify tickers exist before querying

## Testing and Development

### Running Tests

```bash
bun test
```

### Test Commands

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"]
    }
  },
});
```

### Test Coverage

```bash
bun test --coverage
```

### Package Structure

```
pkg/kalshi/
├── KalshiService.ts      # Main service class
├── tools.ts              # Tool definitions
├── tools/
│   ├── getSeries.ts      # Get series tool
│   ├── getMarkets.ts     # Get markets tool
│   ├── getEvent.ts       # Get event tool
│   └── getOrderbook.ts   # Get orderbook tool
├── index.ts              # Package exports
├── plugin.ts             # Plugin registration
├── package.json          # Package metadata
└── vitest.config.ts      # Vitest configuration
```

### Build Instructions

```bash
bun run build
```

### Dependencies

- `@tokenring-ai/app` - Base application framework and plugin system
- `@tokenring-ai/chat` - Chat service and tool system
- `@tokenring-ai/agent` - Central orchestration system
- `@tokenring-ai/utility` - Shared utilities including HttpService
- `zod` - Runtime type validation and schema definition

## Related Components

- **HttpService**: HTTP service from `@tokenring-ai/utility`
- **TokenRingService**: Base interface for all services
- **TokenRingToolDefinition**: Interface for tools
- **Kalshi API**: Prediction market API documentation

## Troubleshooting

### API Errors

**Problem**: API requests fail with HTTP errors

**Solution**:
- Verify the baseUrl is correct
- Check network connectivity to Kalshi API
- Ensure API is not temporarily down
- Check for rate limiting

### Ticker Not Found

**Problem**: getSeries, getEvent, or getOrderbook returns error

**Solution**:
- Verify the ticker is correct
- Check that the ticker exists in Kalshi
- Ensure the ticker format is correct
- Use getMarkets to search for available tickers

### Markets Not Found

**Problem**: getMarkets returns no results

**Solution**:
- Verify the series_ticker is correct
- Check that markets exist for the series
- Try different status filters
- Use getSeries to verify the series exists

### Orderbook Errors

**Problem**: getOrderbook returns error

**Solution**:
- Verify the ticker is correct
- Ensure the market exists
- Check that the market is open
- Verify the ticker format

### Rate Limiting

**Problem**: API returns 429 Too Many Requests

**Solution**:
- Implement retry logic with exponential backoff
- Add delays between requests
- Monitor API rate limits
- Consider caching responses

### Configuration Issues

**Problem**: API requests fail with incorrect configuration

**Solution**:
- Verify baseUrl is set correctly
- Check that the URL uses HTTPS
- Ensure the base URL ends with a trailing slash
- Test the URL in a browser or curl

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Version

0.2.0