# Kalshi Plugin

## Overview

The Kalshi Plugin provides integration with Kalshi prediction markets, enabling AI agents to query market series, markets, events, and orderbooks. It allows agents to interact with Kalshi's prediction market data for research, analysis, and decision-making purposes.

This plugin serves as a service that integrates with the TokenRing agent system. It provides tools for programmatic access to Kalshi's prediction market data, including series, markets, events, and orderbook information.

## Key Features

- **Series Retrieval**: Get detailed information about market series
- **Market Listing**: List markets with filtering options
- **Event Retrieval**: Get detailed information about specific events
- **Orderbook Access**: Access real-time orderbook data for markets
- **Configurable Base URL**: Support for custom Kalshi API endpoints
- **RESTful API**: Uses standard HTTP requests for API interactions
- **Error Handling**: Comprehensive error handling for API operations

## Chat Commands

The plugin does not currently provide chat commands. All operations are available through tools.

## Plugin Configuration

The plugin is configured through the `kalshi` section in the plugin configuration. It accepts a `KalshiConfigSchema` which defines the base URL for the Kalshi API.

### Configuration Schema

```typescript
import { z } from "zod";

export const KalshiConfigSchema = z.object({
  baseUrl: z.string().optional(),
});

export type KalshiConfig = z.infer<typeof KalshiConfigSchema>;
```

### Configuration Example

```typescript
const pluginConfig = {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
  }
};
```

### Plugin Registration

```typescript
import kalshiPlugin from "@tokenring-ai/kalshi";
import app from "@tokenring-ai/app";

const app = new app.App();

app.addPlugin(kalshiPlugin, {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
  }
});
```

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

## Tools

The plugin provides the following tools for Kalshi operations:

### getSeries

Retrieves detailed information about a specific market series.

**Tool Definition:**

```typescript
const name = "kalshi_getSeries";
const description = "Get detailed information about a market series";
const inputSchema = z.object({
  ticker: z.string().describe("The ticker symbol of the series")
});
```

**Tool Interface:**

```typescript
{
  name: "kalshi_getSeries";
  description: "Get detailed information about a market series";
  inputSchema: z.object({
    ticker: string;
  });
  execute: (
    args: { ticker: string },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute get series tool
const result = await agent.executeTool("kalshi_getSeries", {
  ticker: "PRES-24-SEC"
});

console.log("Series details:", result);
```

### getMarkets

Lists Kalshi markets with optional filtering.

**Tool Definition:**

```typescript
const name = "kalshi_getMarkets";
const description = "List Kalshi markets";
const inputSchema = z.object({
  series_ticker: z.string().optional().describe("Filter by series ticker"),
  status: z.string().optional().describe("Filter by market status"),
  limit: z.number().optional().describe("Number of markets to return"),
  cursor: z.string().optional().describe("Pagination cursor")
});
```

**Tool Interface:**

```typescript
{
  name: "kalshi_getMarkets";
  description: "List Kalshi markets";
  inputSchema: z.object({
    series_ticker?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  });
  execute: (
    args: {
      series_ticker?: string;
      status?: string;
      limit?: number;
      cursor?: string;
    },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute get markets tool
const result = await agent.executeTool("kalshi_getMarkets", {
  series_ticker: "PRES-24-SEC",
  status: "open",
  limit: 10
});

console.log("Markets found:", result.length);
result.forEach(market => {
  console.log(`- ${market.title} (${market.ticker})`);
});
```

### getEvent

Retrieves detailed information about a specific event.

**Tool Definition:**

```typescript
const name = "kalshi_getEvent";
const description = "Get detailed information about a specific event";
const inputSchema = z.object({
  ticker: z.string().describe("The ticker symbol of the event")
});
```

**Tool Interface:**

```typescript
{
  name: "kalshi_getEvent";
  description: "Get detailed information about a specific event";
  inputSchema: z.object({
    ticker: string;
  });
  execute: (
    args: { ticker: string },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute get event tool
const result = await agent.executeTool("kalshi_getEvent", {
  ticker: "PRES-24-SEC-001"
});

console.log("Event title:", result.title);
console.log("Event description:", result.description);
console.log("Event status:", result.status);
```

### getOrderbook

Retrieves the orderbook for a specific market.

**Tool Definition:**

```typescript
const name = "kalshi_getOrderbook";
const description = "Get the orderbook for a specific market";
const inputSchema = z.object({
  ticker: z.string().describe("The ticker symbol of the market")
});
```

**Tool Interface:**

```typescript
{
  name: "kalshi_getOrderbook";
  description: "Get the orderbook for a specific market";
  inputSchema: z.object({
    ticker: string;
  });
  execute: (
    args: { ticker: string },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute get orderbook tool
const result = await agent.executeTool("kalshi_getOrderbook", {
  ticker: "PRES-24-SEC-001-YES"
});

console.log("Orderbook for market:", result);
console.log("Yes orders:", result.yes_orders.length);
console.log("No orders:", result.no_orders.length);
```

## State Management

The Kalshi Plugin does not maintain agent state. All operations are stateless and rely on the KalshiService instance for API interactions.

## Context Handlers

The plugin does not provide context handlers. Kalshi operations are performed through tools.

## Usage Examples

### Basic Setup

```typescript
import kalshiPlugin from "@tokenring-ai/kalshi";
import app from "@tokenring-ai/app";

const app = new app.App();

app.addPlugin(kalshiPlugin, {
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

console.log("Series title:", seriesResult.title);
console.log("Series description:", seriesResult.description);
console.log("Series status:", seriesResult.status);
```

### Using the Get Markets Tool

```typescript
// List markets for a series
const marketsResult = await agent.executeTool("kalshi_getMarkets", {
  series_ticker: "PRES-24-SEC",
  status: "open"
});

console.log("Markets:", marketsResult.length);
marketsResult.forEach(market => {
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

console.log("Event:", eventResult.title);
console.log("Description:", eventResult.description);
console.log("Status:", eventResult.status);
console.log("Start Time:", eventResult.start_time);
console.log("End Time:", eventResult.end_time);
```

### Using the Get Orderbook Tool

```typescript
// Get orderbook for a market
const orderbookResult = await agent.executeTool("kalshi_getOrderbook", {
  ticker: "PRES-24-SEC-001-YES"
});

console.log("Market:", orderbookResult.market_ticker);
console.log("Yes Orders:", orderbookResult.yes_orders.length);
console.log("No Orders:", orderbookResult.no_orders.length);

// Analyze spread
const yesBest = orderbookResult.yes_orders[0];
const noBest = orderbookResult.no_orders[0];
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
openMarkets.forEach(market => {
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
  chatService.addTools(packageJSON.name, tools)
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

app.addPlugin(kalshiPlugin, {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
  }
});
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
└── tsconfig.json         # TypeScript configuration
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

MIT License

## Version

0.2.0
