# @tokenring-ai/kalshi

The `@tokenring-ai/kalshi` package provides integration with Kalshi prediction markets for the Token Ring ecosystem. It enables agents to query market series, markets, events, and orderbooks for research, analysis, and decision-making purposes.

This package serves as both a service and a plugin that integrates with the TokenRing agent system, providing tools for programmatic access to Kalshi's prediction market data.

## Overview

The Kalshi package enables seamless integration with the Kalshi API for querying prediction markets and events. It is designed specifically for use within the Token Ring AI agent framework, allowing agents to access real-time prediction market data without authentication.

### Key Features

- **KalshiService**: Core service for direct API interactions with Kalshi
- **Agent Tools**: Four pre-built tools for AI workflows:
  - `kalshi_getSeries`: Get series information by ticker
  - `kalshi_getMarkets`: List and filter markets with pagination
  - `kalshi_getEvent`: Retrieve event details by ticker
  - `kalshi_getOrderbook`: Get orderbook data for a market
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Input Validation**: Zod schemas for robust input validation
- **Error Handling**: Built-in error handling for invalid inputs
- **Configurable**: Support for custom API base URLs
- **Plugin Architecture**: Integrates seamlessly with Token Ring app ecosystem
- **No Authentication Required**: Access public market data endpoints

## Installation

```bash
bun add @tokenring-ai/kalshi
```

## Core Components

### KalshiService

The core service class that extends `HttpService` and implements `TokenRingService`. It provides methods for querying Kalshi prediction markets.

**Location**: `pkg/kalshi/KalshiService.ts`

**Service Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service identifier (`"KalshiService"`) |
| `description` | `string` | Service description (`"Service for querying Kalshi prediction markets"`) |
| `baseUrl` | `string` | Kalshi API base URL (defaults to production API) |
| `defaultHeaders` | `{}` | HTTP headers for requests |

**Constructor:**

```typescript
constructor(config: KalshiConfig = {})
```

**Parameters:**
- `config.baseUrl` (string, optional): Base URL for Kalshi API (defaults to `"https://api.elections.kalshi.com/trade-api/v2"`)

**Service Methods:**

| Method | Description | Parameters | Return Type |
|--------|-------------|------------|-------------|
| `getSeries(ticker)` | Retrieves detailed information about a series | `ticker: string` | `Promise<any>` |
| `getMarkets(opts)` | Lists markets with optional filtering | `KalshiMarketOptions` | `Promise<any>` |
| `getEvent(ticker)` | Retrieves detailed information about an event | `ticker: string` | `Promise<any>` |
| `getOrderbook(ticker)` | Retrieves the orderbook for a market | `ticker: string` | `Promise<any>` |

### KalshiConfig

Configuration options for the KalshiService.

```typescript
export type KalshiConfig = {
  baseUrl?: string;
};
```

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `baseUrl` | `string` | Base URL for Kalshi API | `"https://api.elections.kalshi.com/trade-api/v2"` |

### KalshiMarketOptions

Options for filtering and paginating market queries.

```typescript
export type KalshiMarketOptions = {
  series_ticker?: string;
  status?: string;
  limit?: number;
  cursor?: string;
};
```

| Property | Type | Description | Constraints |
|----------|------|-------------|-------------|
| `series_ticker` | `string` | Filter by series ticker | Optional |
| `status` | `string` | Filter by market status (e.g., `"open"`, `"closed"`) | Optional |
| `limit` | `number` | Number of results to return | Max: 200, Optional |
| `cursor` | `string` | Pagination cursor for large result sets | Optional |

## Services

### KalshiService Provider

The `KalshiService` is a `TokenRingService` that can be required by agents using the `requireServiceByType` method.

**Provider Type:**

```typescript
import KalshiService from "@tokenring-ai/kalshi";

// In an agent context
const kalshi = agent.requireServiceByType(KalshiService);
```

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
}
```

**Method Signatures:**

```typescript
async getSeries(ticker: string): Promise<any>

async getMarkets(opts: KalshiMarketOptions = {}): Promise<any>

async getEvent(ticker: string): Promise<any>

async getOrderbook(ticker: string): Promise<any>
```

**Method Descriptions:**

- `getSeries(ticker)`: Retrieves detailed information about a series by ticker. Throws error if ticker is empty.
- `getMarkets(opts)`: Lists markets with optional filtering by series, status, and pagination.
- `getEvent(ticker)`: Retrieves detailed information about an event by ticker. Throws error if ticker is empty.
- `getOrderbook(ticker)`: Retrieves the orderbook for a specific market. Throws error if ticker is empty.

## RPC Endpoints

This package does not define RPC endpoints. It uses REST API endpoints through the `HttpService` base class:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/series/{ticker}` | GET | Get series information |
| `/markets` | GET | List markets with optional filters |
| `/events/{ticker}` | GET | Get event details |
| `/markets/{ticker}/orderbook` | GET | Get orderbook data |

Base URL: `https://api.elections.kalshi.com/trade-api/v2`

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

The plugin accepts a configuration object with optional Kalshi settings:

```typescript
import {z} from "zod";

const packageConfigSchema = z.object({
  kalshi: KalshiConfigSchema.optional()
});

// KalshiConfigSchema
z.object({
  baseUrl: z.string().optional(),
});
```

**Example configuration:**

```typescript
import TokenRingApp from "@tokenring-ai/app";
import kalshiPlugin from "@tokenring-ai/kalshi";

const app = new TokenRingApp();
app.install(kalshiPlugin, {
  kalshi: {
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2"  // Optional, defaults to Kalshi API
  }
});
```

## Tools

The plugin provides the following tools for Kalshi operations:

### kalshi_getSeries

Get information about a Kalshi market series by ticker.

**Tool Definition:**

- **Name**: `kalshi_getSeries`
- **Display Name**: `Kalshi/getSeries`
- **Description**: Get information about a Kalshi market series by ticker.

**Input Schema:**

```typescript
z.object({
  ticker: z.string().min(1).describe("Series ticker (e.g., KXHIGHNY)"),
})
```

**Returns**: `TokenRingToolJSONResult<{series?: any}>`

**Usage:**

```typescript
// Execute get series tool
const result = await agent.executeTool("kalshi_getSeries", {
  ticker: "KXHIGHNY"
});

console.log("Series details:", result.series);
```

### kalshi_getMarkets

Get Kalshi markets with optional filtering by series, status, and pagination.

**Tool Definition:**

- **Name**: `kalshi_getMarkets`
- **Display Name**: `Kalshi/getMarkets`
- **Description**: Get Kalshi markets with optional filtering by series, status, and pagination.

**Input Schema:**

```typescript
z.object({
  series_ticker: z.string().optional().describe("Filter by series ticker"),
  status: z.string().optional().describe("Filter by status (e.g., 'open', 'closed')"),
  limit: z.number().int().positive().max(200).optional().describe("Number of results (default: 100)"),
  cursor: z.string().optional().describe("Pagination cursor"),
})
```

**Returns**: `TokenRingToolJSONResult<{markets?: any}>`

**Usage:**

```typescript
// Execute get markets tool
const result = await agent.executeTool("kalshi_getMarkets", {
  series_ticker: "KXHIGHNY",
  status: "open",
  limit: 10
});

console.log("Markets found:", result.markets);
```

### kalshi_getEvent

Get a specific Kalshi event by ticker.

**Tool Definition:**

- **Name**: `kalshi_getEvent`
- **Display Name**: `Kalshi/getEvent`
- **Description**: Get a specific Kalshi event by ticker.

**Input Schema:**

```typescript
z.object({
  ticker: z.string().min(1).describe("Event ticker"),
})
```

**Returns**: `TokenRingToolJSONResult<{event?: any}>`

**Usage:**

```typescript
// Execute get event tool
const result = await agent.executeTool("kalshi_getEvent", {
  ticker: "KXHIGHNY-25JAN01"
});

console.log("Event title:", result.event.title);
```

### kalshi_getOrderbook

Get the orderbook (bids) for a specific Kalshi market.

**Tool Definition:**

- **Name**: `kalshi_getOrderbook`
- **Display Name**: `Kalshi/getOrderbook`
- **Description**: Get the orderbook (bids) for a specific Kalshi market.

**Input Schema:**

```typescript
z.object({
  ticker: z.string().min(1).describe("Market ticker"),
})
```

**Returns**: `TokenRingToolJSONResult<{orderbook?: any}>`

**Usage:**

```typescript
// Execute get orderbook tool
const result = await agent.executeTool("kalshi_getOrderbook", {
  ticker: "KXHIGHNY-25JAN01-T70"
});

console.log("Orderbook for market:", result.orderbook);
```

## Integration

### HttpService

The `KalshiService` extends `HttpService` from `@tokenring-ai/utility/http/HttpService` for HTTP request handling.

```typescript
import { HttpService } from "@tokenring-ai/utility/http/HttpService";

class KalshiService extends HttpService implements TokenRingService {
  protected baseUrl: string;

  constructor(config: KalshiConfig = {}) {
    super();
    this.baseUrl = config.baseUrl || "https://api.elections.kalshi.com/trade-api/v2";
  }

  async getSeries(ticker: string): Promise<any> {
    if (!ticker) throw new Error("ticker is required");
    return this.fetchJson(`/series/${ticker}`, {method: "GET"}, "Kalshi get series");
  }

  async getMarkets(opts: KalshiMarketOptions = {}): Promise<any> {
    const params = new URLSearchParams();
    if (opts.series_ticker) params.set("series_ticker", opts.series_ticker);
    if (opts.status) params.set("status", opts.status);
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.cursor) params.set("cursor", opts.cursor);

    const query = params.toString();
    return this.fetchJson(`/markets${query ? `?${query}` : ""}`, {method: "GET"}, "Kalshi get markets");
  }

  async getEvent(ticker: string): Promise<any> {
    if (!ticker) throw new Error("ticker is required");
    return this.fetchJson(`/events/${ticker}`, {method: "GET"}, "Kalshi get event");
  }

  async getOrderbook(ticker: string): Promise<any> {
    if (!ticker) throw new Error("ticker is required");
    return this.fetchJson(`/markets/${ticker}/orderbook`, {method: "GET"}, "Kalshi get orderbook");
  }
}
```

### Agent Integration

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
app.addServices(new KalshiService(config.kalshi));
```

### Plugin Installation

The plugin is installed during application initialization:

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

When installed with a Kalshi configuration, the plugin:
1. Creates and registers a `KalshiService` instance
2. Registers all four tools with the `ChatService`

## Usage Examples

### Basic Service Usage

```typescript
import KalshiService from "@tokenring-ai/kalshi";

const kalshi = new KalshiService({
  baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
});

// Get series information
const series = await kalshi.getSeries("KXHIGHNY");
console.log("Series:", series.series.title);

// List open markets for a series
const markets = await kalshi.getMarkets({
  series_ticker: "KXHIGHNY",
  status: "open",
  limit: 10
});
console.log("Markets:", markets.markets);

// Get event details
const event = await kalshi.getEvent("KXHIGHNY-25JAN01");
console.log("Event:", event.event.title);

// Get orderbook
const orderbook = await kalshi.getOrderbook("KXHIGHNY-25JAN01-T70");
console.log("Orderbook:", orderbook.orderbook);
```

### Agent Workflow Example

```typescript
// In a Token Ring agent
async function analyzeMarket(seriesTicker: string) {
  // Get series information
  const seriesResult = await agent.executeTool("kalshi_getSeries", {
    ticker: seriesTicker
  });

  // Get open markets for this series
  const marketsResult = await agent.executeTool("kalshi_getMarkets", {
    series_ticker: seriesTicker,
    status: "open",
    limit: 5
  });

  // Get orderbook for first market
  if (marketsResult.markets?.markets?.length > 0) {
    const firstMarket = marketsResult.markets.markets[0];
    const orderbookResult = await agent.executeTool("kalshi_getOrderbook", {
      ticker: firstMarket.ticker
    });

    return {
      series: seriesResult.series,
      topMarket: firstMarket,
      orderbook: orderbookResult.orderbook
    };
  }

  throw new Error("No markets found");
}
```

### Pagination Example

```typescript
import KalshiService from "@tokenring-ai/kalshi";

const kalshi = new KalshiService();

// Fetch first page
const page1 = await kalshi.getMarkets({
  status: "open",
  limit: 100
});

// Fetch next page using cursor
if (page1.cursor) {
  const page2 = await kalshi.getMarkets({
    status: "open",
    limit: 100,
    cursor: page1.cursor
  });
}
```

### Direct Tool Usage

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import tools from "@tokenring-ai/kalshi/tools";

// Get series tool
const seriesResult = await tools.getSeries.execute(
  { ticker: "KXHIGHNY" },
  agent
);

// Get markets tool
const marketsResult = await tools.getMarkets.execute(
  { series_ticker: "KXHIGHNY", status: "open", limit: 10 },
  agent
);

// Get event tool
const eventResult = await tools.getEvent.execute(
  { ticker: "KXHIGHNY-25JAN01" },
  agent
);

// Get orderbook tool
const orderbookResult = await tools.getOrderbook.execute(
  { ticker: "KXHIGHNY-25JAN01-T70" },
  agent
);
```

### Programmatic API Usage

```typescript
import { Agent } from "@tokenring-ai/agent";
import { KalshiService } from "@tokenring-ai/kalshi";

const agent = new Agent();
const kalshiService = agent.requireServiceByType(KalshiService);

// Get a series
const series = await kalshiService.getSeries("KXHIGHNY");

// List markets
const markets = await kalshiService.getMarkets({
  series_ticker: "KXHIGHNY",
  status: "open"
});

// Get an event
const event = await kalshiService.getEvent("KXHIGHNY-25JAN01");

// Get an orderbook
const orderbook = await kalshiService.getOrderbook("KXHIGHNY-25JAN01-T70");

// List markets with pagination
const page1 = await kalshiService.getMarkets({
  series_ticker: "KXHIGHNY",
  limit: 10,
  cursor: undefined
});

const page2 = await kalshiService.getMarkets({
  series_ticker: "KXHIGHNY",
  limit: 10,
  cursor: page1.cursor
});
```

## Best Practices

### Error Handling

Always handle errors when making API calls:

```typescript
try {
  const series = await kalshi.getSeries("KXHIGHNY");
  console.log("Series:", series);
} catch (error) {
  console.error("Failed to fetch series:", error);
}
```

### Input Validation

The tools use Zod schemas for input validation. Always provide valid inputs:

```typescript
// Valid usage
await kalshi.getSeries("KXHIGHNY");

// Invalid - will throw error
await kalshi.getSeries("");  // Error: "ticker is required"
```

### Pagination

When fetching large datasets, use pagination to avoid overwhelming the API:

```typescript
async function fetchAllMarkets(seriesTicker: string) {
  const allMarkets = [];
  let cursor;

  do {
    const response = await kalshi.getMarkets({
      series_ticker: seriesTicker,
      limit: 200,  // Maximum allowed
      cursor
    });

    allMarkets.push(...response.markets);
    cursor = response.cursor;
  } while (cursor);

  return allMarkets;
}
```

### Service Reuse

Create a single KalshiService instance and reuse it:

```typescript
// Good - single instance
const kalshi = new KalshiService();

// Multiple calls
const series = await kalshi.getSeries("KXHIGHNY");
const markets = await kalshi.getMarkets({ series_ticker: "KXHIGHNY" });

// Avoid - creating new instances
const kalshi1 = new KalshiService();
const series = await kalshi1.getSeries("KXHIGHNY");

const kalshi2 = new KalshiService();
const markets = await kalshi2.getMarkets({ series_ticker: "KXHIGHNY" });
```

### Understanding Kalshi Markets

#### Series, Events, and Markets

- **Series**: A recurring question (e.g., "Highest temperature in NYC")
- **Event**: A specific instance of a series (e.g., "January 1, 2025")
- **Market**: A specific outcome within an event (e.g., "Temperature will be 70°F or higher")

#### Orderbook Structure

Kalshi orderbooks only return bids (not asks) due to the reciprocal relationship between YES and NO positions. A YES bid at 60¢ is equivalent to a NO ask at 40¢.

## Testing and Development

### Running Tests

```bash
bun run test
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
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Package Structure

```
pkg/kalshi/
├── index.ts                 # Main entry point - exports KalshiService
├── KalshiService.ts         # Core Kalshi API service
├── plugin.ts                # Token Ring plugin integration
├── tools.ts                 # Tool exports
├── tools/
│   ├── getSeries.ts         # Get series tool
│   ├── getMarkets.ts        # Get markets tool
│   ├── getEvent.ts          # Get event tool
│   └── getOrderbook.ts      # Get orderbook tool
├── package.json             # Package metadata and dependencies
├── vitest.config.ts         # Vitest configuration
├── README.md                # Package documentation
├── LICENSE                  # MIT License
└── design/                  # Design documents
    └── quick_start_market_data.md  # Quick start guide for market data access
```

### Build Instructions

```bash
bun run build
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Base application framework with service management
- `@tokenring-ai/chat` (0.2.0) - Chat service for agent communication
- `@tokenring-ai/agent` (0.2.0) - Agent orchestration system
- `@tokenring-ai/utility` (0.2.0) - Shared utilities including HttpService
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `@vitest/coverage-v8` (^4.0.18) - Coverage reporter
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- **@tokenring-ai/app**: Base application framework
- **@tokenring-ai/agent**: Agent orchestration system
- **@tokenring-ai/chat**: Chat service and tool definitions
- **@tokenring-ai/utility**: HTTP service and utilities
- **@tokenring-ai/scheduler**: Automated scheduling (complementary for market monitoring)

## Error Handling

The service includes comprehensive error handling:

- **Invalid inputs**: Throws descriptive errors for missing required parameters
- **API failures**: Handles HTTP errors through the base `HttpService`
- **JSON parsing**: Validates and sanitizes API responses

**Error examples:**

```typescript
// Empty ticker throws error
await kalshi.getSeries("");  // Error: "ticker is required"
await kalshi.getEvent("");   // Error: "ticker is required"
await kalshi.getOrderbook(""); // Error: "ticker is required"

// Valid usage
await kalshi.getSeries("KXHIGHNY"); // OK
```

## Quick Start

For a quick start guide on accessing market data without authentication, refer to the design documentation in the package source.

## License

MIT License - see LICENSE file for details.

## Version

0.2.0
