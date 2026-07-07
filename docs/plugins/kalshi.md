# @tokenring-ai/kalshi

Kalshi Prediction Markets - Integration with Kalshi prediction markets for
querying market series, markets, events, and orderbooks.

## User Guide

### Overview

The `@tokenring-ai/kalshi` package provides integration with Kalshi prediction
markets for the Token Ring ecosystem. It enables agents to query market series,
markets, events, and orderbooks for research, analysis, and decision-making
purposes.

This package serves as both a service and a plugin that integrates with the
TokenRing agent system, providing tools for programmatic access to Kalshi's
prediction market data without requiring authentication.

### Key Features

- **KalshiService**: Core service for direct API interactions with Kalshi
- **Agent Tools**: Four pre-built tools for AI workflows
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Input Validation**: Zod schemas for robust input validation
- **Error Handling**: Built-in error handling for invalid inputs
- **Configurable**: Support for custom API base URLs
- **Plugin Architecture**: Integrates seamlessly with Token Ring app ecosystem
- **No Authentication Required**: Access public market data endpoints
- **Pagination Support**: Cursor-based pagination for market listings

### Chat Commands

This package does not define chat commands. The functionality is exposed through
agent tools instead.

### Tools

The package provides four tools for AI agent interaction:

| Tool | Description |
|------|-------------|
| `kalshi_getSeries` | Get information about a Kalshi market series by ticker |
| `kalshi_getMarkets` | Get Kalshi markets with optional filtering by series, status, and pagination |
| `kalshi_getEvent` | Get a specific Kalshi event by ticker |
| `kalshi_getOrderbook` | Get the orderbook (bids) for a specific Kalshi market |

#### kalshi_getSeries

Get information about a Kalshi market series by ticker.

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Series ticker (e.g., KXHIGHNY) |

**Return Type:**

Returns a `TokenRingToolResult` containing JSON string of the series data.

**Errors:**

Throws `ToolCallError` when ticker is missing or empty.

**Example Response:**

```json
{
  "series": {
    "ticker": "KXHIGHNY",
    "title": "Highest temperature in NYC",
    "category": "Weather"
  }
}
```

#### kalshi_getMarkets

Get Kalshi markets with optional filtering by series, status, and pagination.

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `series_ticker` | string | No | Filter by series ticker |
| `status` | string | No | Filter by status (e.g., 'open', 'closed') |
| `limit` | number | No | Number of results (max 200, API default: 100) |
| `cursor` | string | No | Pagination cursor for retrieving next page |

**Return Type:**

Returns a `TokenRingToolResult` containing JSON string of the markets data.

**Notes:**

- All parameters are optional; calling without parameters returns all markets
- The `limit` parameter is constrained to positive integers with a maximum of 200
- Pagination is supported via the `cursor` parameter returned in the response

#### kalshi_getEvent

Get a specific Kalshi event by ticker.

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Event ticker |

**Return Type:**

Returns a `TokenRingToolResult` containing JSON string of the event data.

**Errors:**

Throws `ToolCallError` when ticker is missing or empty.

**Example Response:**

```json
{
  "event": {
    "ticker": "KXHIGHNY-25JAN01",
    "title": "Highest temperature in NYC on January 1, 2025",
    "series_ticker": "KXHIGHNY",
    "mutually_exclusive": true
  }
}
```

#### kalshi_getOrderbook

Get the orderbook (YES and NO bids) for a specific Kalshi market.

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Market ticker |

**Return Type:**

Returns a `TokenRingToolResult` containing JSON string of the orderbook data.

**Errors:**

Throws `ToolCallError` when ticker is missing or empty.

**Example Response:**

```json
{
  "orderbook": {
    "yes": [
      { "price": 60, "count": 100 },
      { "price": 55, "count": 250 }
    ],
    "no": [
      { "price": 45, "count": 150 },
      { "price": 40, "count": 300 }
    ]
  }
}
```

### Configuration

The kalshi package supports configuration through the Token Ring application
config system. The package defines a nested `kalshi` configuration key.

**Configuration Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `baseUrl` | string | No | `https://api.elections.kalshi.com/trade-api/v2` | Base URL for Kalshi API |

**Configuration Example:**

```yaml
kalshi:
  baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
```

**Environment Variables:**

This package does not require any environment variables. Configuration is passed
via the plugin configuration object.

### Integration

The package integrates with the Token Ring ecosystem through the plugin system.
When the plugin is installed, it automatically:

1. Creates and registers a `KalshiService` instance
2. Registers all four tools with the `ChatService`

**Plugin Installation:**

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

**Manual Service Registration:**

```typescript
import TokenRingApp from "@tokenring-ai/app";
import KalshiService from "@tokenring-ai/kalshi";

const app = new TokenRingApp();

app.addServices(new KalshiService({
  baseUrl: "https://api.elections.kalshi.com/trade-api/v2"
}));
```

**Manual Tool Registration:**

```typescript
import { ChatService } from "@tokenring-ai/chat";
import tools from "@tokenring-ai/kalshi/tools";

app.waitForService(ChatService, chatService =>
  chatService.addTools(...tools)
);
```

### Best Practices

#### Error Handling in Tools

Always handle errors when making API calls:

```typescript
try {
  const series = await kalshi.getSeries("KXHIGHNY");
  console.log("Series:", series);
} catch (error) {
  console.error("Failed to fetch series:", error);
}
```

#### Input Validation

The tools use Zod schemas for input validation. Always provide valid inputs:

```typescript
// Valid usage
await kalshi.getSeries("KXHIGHNY");

// Invalid - will throw error
await kalshi.getSeries("");  // Error: "ticker is required"
```

#### Pagination

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

#### Understanding Kalshi Markets

Kalshi prediction markets are organized in a hierarchical structure:

- **Series**: A recurring question (e.g., "Highest temperature in NYC")
- **Event**: A specific instance of a series (e.g., "January 1, 2025")
- **Market**: A specific outcome within an event (e.g., "Temperature will be
  70F or higher")

#### Orderbook Structure

Kalshi orderbooks return bid data for both YES and NO positions. Due to the
reciprocal relationship between YES and NO positions in Kalshi markets:

- A YES bid at 60 cents is equivalent to a NO ask at 40 cents
- The orderbook structure includes `yes` and `no` arrays, each containing bids
- Each bid includes `price` (in cents, 1-99) and `count` (number of contracts)

Example orderbook response structure:

```json
{
  "orderbook": {
    "yes": [
      { "price": 60, "count": 100 },
      { "price": 55, "count": 250 }
    ],
    "no": [
      { "price": 45, "count": 150 },
      { "price": 40, "count": 300 }
    ]
  }
}
```

---

## Developer Reference

### Core Components

#### KalshiService

The core service class for Kalshi API interactions. Implements
`TokenRingService`.

**Location**: `pkg/kalshi/KalshiService.ts`

**Constructor:**

```typescript
constructor(config?: KalshiConfig)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.baseUrl` | string (optional) | Base URL for Kalshi API (defaults to `https://api.elections.kalshi.com/trade-api/v2`) |

**Properties:**

- `name`: `"KalshiService"` - Service identifier
- `description`: `"Service for querying Kalshi prediction markets"` -
  Human-readable description

**Methods:**

##### getSeries(ticker: string): Promise

Get series information by ticker.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Series ticker |

**Returns:** Promise resolving to series object (`JSONValue`)

**Throws:** Error if ticker is empty

**Example:**

```typescript
const kalshi = new KalshiService();
const series = await kalshi.getSeries("KXHIGHNY");
```

##### getMarkets(opts?: KalshiMarketOptions): Promise

List markets with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `opts.series_ticker` | string | No | Filter by series ticker |
| `opts.status` | string | No | Filter by status (e.g., "open", "closed") |
| `opts.limit` | number | No | Maximum number of results (max 200) |
| `opts.cursor` | string | No | Pagination cursor |

**Returns:** Promise resolving to markets response object (`JSONValue`)

**Example:**

```typescript
const kalshi = new KalshiService();
const markets = await kalshi.getMarkets({
  series_ticker: "KXHIGHNY",
  status: "open",
  limit: 10
});
```

##### getEvent(ticker: string): Promise

Retrieve event details by ticker.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Event ticker |

**Returns:** Promise resolving to event object (`JSONValue`)

**Throws:** Error if ticker is empty

**Example:**

```typescript
const kalshi = new KalshiService();
const event = await kalshi.getEvent("KXHIGHNY-25JAN01");
```

##### getOrderbook(ticker: string): Promise

Get orderbook data for a market (YES and NO bids).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Market ticker |

**Returns:** Promise resolving to orderbook object with `yes` and `no` bid arrays (`JSONValue`)

**Throws:** Error if ticker is empty

**Example:**

```typescript
const kalshi = new KalshiService();
const orderbook = await kalshi.getOrderbook("KXHIGHNY-25JAN01-T70");
// Returns: { orderbook: { yes: [...], no: [...] } }
```

### Schema Documentation

The package exports the following Zod schemas:

#### KalshiConfigSchema

Configuration schema for the Kalshi service.

```typescript
export const KalshiConfigSchema = z.object({
  baseUrl: z.string().exactOptional(),
});
```

| Field | Type | Description |
|-------|------|-------------|
| `baseUrl` | string (optional) | Base URL for Kalshi API |

**Notes:**

- The `exactOptional()` modifier allows the config to be omitted entirely or
  passed with an undefined `baseUrl` value
- When omitted or undefined, the default API endpoint is used

#### KalshiMarketOptions

Type definition for market query options.

```typescript
export type KalshiMarketOptions = {
  series_ticker?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
};
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `series_ticker` | string (optional) | Filter markets by series ticker |
| `status` | string (optional) | Filter by market status (e.g., "open", "closed") |
| `limit` | number (optional) | Maximum number of results (API enforces max of 200) |
| `cursor` | string (optional) | Pagination cursor for retrieving next page of results |

#### Tool Input Schemas

##### getSeries

```typescript
z.object({
  ticker: z.string().min(1).describe("Series ticker (e.g., KXHIGHNY)"),
});
```

**Notes:**

- The `min(1)` constraint ensures the ticker is non-empty
- Throws `ToolCallError` if validation fails

**Example Response:**

```typescript
{
  series: {
    ticker: string;
    title: string;
    category: string;
    // ... additional series fields
  }
}
```

##### getMarkets

```typescript
z.object({
  series_ticker: z.string().exactOptional()
    .describe("Filter by series ticker"),
  status: z.string().exactOptional()
    .describe("Filter by status (e.g., 'open', 'closed')"),
  limit: z.number().int().positive().max(200).exactOptional()
    .describe("Number of results (API default: 100, max: 200)"),
  cursor: z.string().exactOptional()
    .describe("Pagination cursor for next page"),
});
```

**Notes:**

- All fields use `exactOptional()` to allow omission or undefined values
- The `limit` field has constraints: must be integer, positive, and max 200
- No default values are set in the schema; the API uses its own defaults (100)
- When all parameters are omitted, returns all markets (paginated)

**Example Response:**

```typescript
{
  markets: Array<{
    ticker: string;
    event_ticker: string;
    title: string;
    yes_bid: number;
    yes_ask: number;
    no_bid: number;
    no_ask: number;
    // ... additional market fields
  }>;
  cursor?: string;  // Present if more results available
}
```

##### getEvent

```typescript
z.object({
  ticker: z.string().min(1).describe("Event ticker"),
});
```

**Notes:**

- The `min(1)` constraint ensures the ticker is non-empty
- Throws `ToolCallError` if validation fails

**Example Response:**

```typescript
{
  event: {
    ticker: string;
    title: string;
    series_ticker: string;
    mutually_exclusive: boolean;
    // ... additional event fields
  }
}
```

##### getOrderbook

```typescript
z.object({
  ticker: z.string().min(1).describe("Market ticker"),
});
```

**Notes:**

- The `min(1)` constraint ensures the ticker is non-empty
- Throws `ToolCallError` if validation fails

**Example Response:**

```typescript
{
  orderbook: {
    yes: Array<{
      price: number;  // 1-99, price in cents
      count: number;  // number of contracts
    }>;
    no: Array<{
      price: number;  // 1-99, price in cents
      count: number;  // number of contracts
    }>;
  }
}
```

### Services

#### KalshiService Provider

The `KalshiService` is a `TokenRingService` that can be required by agents
using the `requireServiceByType` method.

**Provider Type:**

```typescript
import KalshiService from "@tokenring-ai/kalshi";

// In an agent context
const kalshi = agent.requireServiceByType(KalshiService);
```

### RPC Endpoints

This package interacts with the Kalshi REST API through the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/series/{ticker}` | GET | Get series information |
| `/markets` | GET | List markets with optional filters |
| `/events/{ticker}` | GET | Get event details |
| `/markets/{ticker}/orderbook` | GET | Get orderbook data |

**Base URL:** `https://api.elections.kalshi.com/trade-api/v2`

**HTTP Client:** The package uses `HTTPRetriever` from `@tokenring-ai/utility`
with a 10 second timeout for all requests.

### Usage Examples

#### Basic Service Usage

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

#### Agent Workflow Example

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

#### Pagination Example

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

### Service Error Handling

The service includes comprehensive error handling:

- **Invalid inputs**: Throws descriptive errors for missing required parameters
- **API failures**: Handles HTTP errors through the `HTTPRetriever`
- **JSON parsing**: Validates and sanitizes API responses using Zod schemas

**Error examples:**

```typescript
// Empty ticker throws error
await kalshi.getSeries("");  // Error: "ticker is required"
await kalshi.getEvent("");   // Error: "ticker is required"
await kalshi.getOrderbook(""); // Error: "ticker is required"

// Valid usage
await kalshi.getSeries("KXHIGHNY"); // OK
```

### Testing

#### Running Tests

```bash
bun run test          # Run all tests
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage report
```

#### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

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

```text
pkg/kalshi/
├── index.ts                 # Main entry point - exports KalshiService
├── KalshiService.ts         # Core Kalshi API service
├── plugin.ts                # Token Ring plugin integration
├── tools.ts                 # Tool exports
├── tools/
│   ├── getEvent.ts          # Get event tool
│   ├── getMarkets.ts        # Get markets tool
│   ├── getOrderbook.ts      # Get orderbook tool
│   └── getSeries.ts         # Get series tool
├── package.json             # Package metadata and dependencies
├── vitest.config.ts         # Vitest configuration
├── README.md                # Package documentation
└── LICENSE                  # MIT License
```

### Dependencies

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | workspace | Base application framework with service management |
| `@tokenring-ai/chat` | workspace | Chat service for agent communication |
| `@tokenring-ai/agent` | workspace | Agent orchestration system |
| `@tokenring-ai/utility` | workspace | Shared utilities including HTTPRetriever |
| `zod` | ^4.4.3 | Schema validation |

#### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

### Related Components

- **@tokenring-ai/app**: Base application framework with plugin system
- **@tokenring-ai/agent**: Agent orchestration system
- **@tokenring-ai/chat**: Chat service and tool definitions
- **@tokenring-ai/utility**: HTTP service and utilities

## License

MIT License - see LICENSE file for details.
