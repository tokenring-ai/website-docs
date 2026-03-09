# Polymarket Plugin

## Overview

The Polymarket Plugin provides integration with Polymarket prediction markets, enabling AI agents to search for markets, list events, and retrieve detailed event information. It allows agents to interact with prediction market data for research, analysis, and decision-making purposes.

This plugin serves as a service that integrates with the TokenRing agent system. It provides tools for programmatic access to Polymarket's prediction market data, including market search, event listing, and event retrieval.

## Key Features

- **Market Search**: Search for prediction markets, events, and profiles by query
- **Event Listing**: List events with filtering options (limit, offset, closed status, tag_id)
- **Event Retrieval**: Get detailed information about specific events by slug
- **Market Retrieval**: Get detailed information about specific markets by slug
- **Configurable Base URL**: Support for custom Polymarket API endpoints
- **RESTful API**: Uses standard HTTP requests for API interactions
- **Error Handling**: Comprehensive error handling for API operations
- **TypeScript Support**: Full type definitions and validation
- **Tool Integration**: Tools are registered with the chat service for agent use
- **Service Architecture**: PolymarketService extends HttpService for robust HTTP handling

## Core Components

### PolymarketService

The main service class that implements `TokenRingService`. It extends `HttpService` from `@tokenring-ai/utility` for HTTP request handling.

**Service Properties:**

- `name`: Service identifier (`"PolymarketService"`)
- `description`: Service description (`"Service for querying Polymarket prediction markets"`)
- `defaultHeaders`: Default HTTP headers (empty object)
- `config`: Service configuration containing `baseUrl`

**Constructor:**

```typescript
constructor(config: ParsedPolymarketServiceConfig)
```

**Service Methods:**

```typescript
async searchMarkets(query: string): Promise<any>

async listEvents(opts: PolymarketSearchOptions = {}): Promise<any>

async getEventBySlug(slug: string): Promise<any>

async getMarketBySlug(slug: string): Promise<any>
```

**Method Descriptions:**

- `searchMarkets(query)`: Searches for prediction markets, events, and profiles matching the query
- `listEvents(opts)`: Lists events with optional filtering
- `getEventBySlug(slug)`: Retrieves detailed information about an event by its slug
- `getMarketBySlug(slug)`: Retrieves detailed information about a market by its slug

**PolymarketSearchOptions:**

```typescript
type PolymarketSearchOptions = {
  limit?: number;      // Number of results to return (default: 10)
  offset?: number;     // Number of results to skip (default: 0)
  closed?: boolean;    // Whether to include closed markets (default: false)
  tag_id?: number;     // Filter by tag ID
};
```

### Configuration Schema

```typescript
import { z } from "zod";

export const PolymarketConfigSchema = z.object({
  baseUrl: z.string().default("https://gamma-api.polymarket.com")
});

export type ParsedPolymarketServiceConfig = z.output<typeof PolymarketConfigSchema>;
```

**Configuration Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `baseUrl` | `string` | `https://gamma-api.polymarket.com` | Base URL for the Polymarket API |

## Services

### PolymarketService

The main service class that implements `TokenRingService`. It provides methods for querying Polymarket prediction markets.

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
}
```

**Service Properties:**

- `name`: Service identifier (`"PolymarketService"`)
- `description`: Service description
- `defaultHeaders`: Default HTTP headers (empty object)
- `config`: Service configuration

**Constructor:**

```typescript
constructor(config: ParsedPolymarketServiceConfig)
```

**Service Methods:**

#### `searchMarkets(query: string): Promise<any>`

Searches for prediction markets, events, and profiles matching the query.

**Parameters:**

- `query` (string): Search query (required, must be non-empty)

**Returns:** Promise resolving to Polymarket API search response containing events, tags, and profiles

**Throws:** Error if query is empty

**API Endpoint:** `GET /public-search?q={query}`

**Example:**

```typescript
const polymarket = new PolymarketService({
  baseUrl: "https://gamma-api.polymarket.com"
});

const results = await polymarket.searchMarkets("Artificial intelligence");
console.log("Search results:", results);
```

#### `listEvents(opts?: PolymarketSearchOptions): Promise<any>`

Lists prediction market events with optional filtering.

**Parameters:**

- `opts` (PolymarketSearchOptions, optional):
  - `limit` (number): Number of results (default: 10, max: 100)
  - `offset` (number): Pagination offset (default: 0)
  - `closed` (boolean): Include closed markets (default: false)
  - `tag_id` (number): Filter by tag ID

**Returns:** Promise resolving to array of events

**API Endpoint:** `GET /events?limit={limit}&offset={offset}&closed={closed}&tag_id={tag_id}`

**Example:**

```typescript
const events = await polymarket.listEvents({
  limit: 20,
  closed: false
});
console.log("Events:", events);
```

#### `getEventBySlug(slug: string): Promise<any>`

Retrieves detailed information about an event by its slug.

**Parameters:**

- `slug` (string): Event slug from Polymarket URL (required, must be non-empty)

**Returns:** Promise resolving to event object with markets, tags, and metadata

**Throws:** Error if slug is empty

**API Endpoint:** `GET /events/slug/{slug}`

**Example:**

```typescript
const event = await polymarket.getEventBySlug("will-ai-exceed-human-level-performance-by-2025");
console.log("Event:", event);
```

#### `getMarketBySlug(slug: string): Promise<any>`

Retrieves detailed information about a market by its slug.

**Parameters:**

- `slug` (string): Market slug from Polymarket URL (required, must be non-empty)

**Returns:** Promise resolving to market object with outcomes and trading data

**Throws:** Error if slug is empty

**API Endpoint:** `GET /markets/slug/{slug}`

**Example:**

```typescript
const market = await polymarket.getMarketBySlug("will-ai-exceed-human-level-performance-by-2025");
console.log("Market:", market);
```

## Provider Documentation

This package does not implement provider architecture. The `PolymarketService` is registered directly with the application and can be accessed by agents using `requireServiceByType`.

**Accessing the Service:**

```typescript
import { PolymarketService } from "@tokenring-ai/polymarket";

// In an agent context
const polymarket = agent.requireServiceByType(PolymarketService);
const results = await polymarket.searchMarkets("AI regulation");
```

## RPC Endpoints

This package does not define RPC endpoints.

## Chat Commands

The plugin does not currently provide chat commands. All operations are available through tools.

## Configuration

The plugin is configured through the `polymarket` section in the plugin configuration.

### Plugin Configuration Schema

```typescript
import { z } from "zod";

const packageConfigSchema = z.object({
  polymarket: PolymarketConfigSchema.prefault({})
});
```

### Configuration Example

```typescript
const pluginConfig = {
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com"
  }
};
```

### Plugin Registration

```typescript
import polymarketPlugin from "@tokenring-ai/polymarket";
import app from "@tokenring-ai/app";

const app = new app.TokenRingApp();

app.addPlugin(polymarketPlugin, {
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com"
  }
});
```

## Integration

### Agent System Integration

The plugin integrates with the TokenRing agent system by:

1. **Tool Registration**: Tools are registered with the chat service via `chatService.addTools(tools)`
2. **Service Registration**: The service is added to the application via `app.addServices(new PolymarketService(config.polymarket))`
3. **Agent State**: No agent state slices are registered

### Plugin Registration

```typescript
// In plugin.ts
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
app.addServices(new PolymarketService(config.polymarket));
```

### Service Registration

```typescript
// Programmatic service registration
import { PolymarketService } from "@tokenring-ai/polymarket";

const service = new PolymarketService({
  baseUrl: "https://gamma-api.polymarket.com"
});

app.addServices(service);
```

## Usage Examples

### Basic Setup

```typescript
import polymarketPlugin from "@tokenring-ai/polymarket";
import app from "@tokenring-ai/app";

const app = new app.TokenRingApp();

app.addPlugin(polymarketPlugin, {
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com"
  }
});
```

### Using the Search Tool

```typescript
import { Agent } from "@tokenring-ai/agent";

const agent = new Agent();

// Search for markets
const searchResult = await agent.executeTool("polymarket_search", {
  query: "Artificial intelligence"
});

console.log("Search results:", searchResult);
```

### Using the List Events Tool

```typescript
// List events with filters
const result = await agent.executeTool("polymarket_listEvents", {
  limit: 20,
  closed: false
});

console.log("Events found:", result.events?.length);
```

### Using the Get Event Tool

```typescript
// Get specific event details
const result = await agent.executeTool("polymarket_getEvent", {
  slug: "will-ai-exceed-human-level-performance-by-2025"
});

console.log("Event:", result.event);
```

### Programmatic API Usage

```typescript
import { Agent } from "@tokenring-ai/agent";
import { PolymarketService } from "@tokenring-ai/polymarket";

const agent = new Agent();
const polymarketService = agent.requireServiceByType(PolymarketService);

// Search for markets
const searchResults = await polymarketService.searchMarkets("Climate change");

// List events
const events = await polymarketService.listEvents({
  limit: 10,
  closed: false
});

// Get specific event
const event = await polymarketService.getEventBySlug("will-global-temperatures-rise-above-2c-by-2030");

// Get specific market
const market = await polymarketService.getMarketBySlug("will-global-temperatures-rise-above-2c-by-2030");

// List events with tag filter
const techEvents = await polymarketService.listEvents({
  limit: 10,
  tag_id: 12345
});
```

### Filtering Events

```typescript
// Get only open events
const openEvents = await polymarketService.listEvents({
  limit: 15,
  closed: false
});

// Get events with pagination
const page1 = await polymarketService.listEvents({
  limit: 10,
  offset: 0
});

const page2 = await polymarketService.listEvents({
  limit: 10,
  offset: 10
});
```

### Analyzing Market Data

```typescript
// Search for markets and analyze results
const searchResult = await polymarketService.searchMarkets("Elections 2024");

searchResult.markets.forEach(market => {
  console.log(`Market: ${market.title}`);
  console.log(`  Price: ${market.price}`);
  console.log(`  Volume: ${market.volume}`);
  console.log(`  Status: ${market.closed ? 'Closed' : 'Open'}`);
});
```

### Working with Slugs

```typescript
// Extract slugs from URLs
const url = "https://polymarket.com/event/fed-decision-in-october?tid=1758818660485";
const slug = url.split("/event/")[1].split("?")[0];
// slug = "fed-decision-in-october"

// Use slug to fetch event
const event = await polymarketService.getEventBySlug(slug);
```

### Tag-Based Filtering

```typescript
// Filter events by tag
const techEvents = await polymarketService.listEvents({
  limit: 10,
  tag_id: 100381,
  closed: false
});
```

## State Management

The Polymarket Plugin does not maintain agent state. All operations are stateless and rely on the PolymarketService instance for API interactions.

## Tools

The plugin provides the following tools for Polymarket operations:

### polymarket_search

Searches for prediction markets, events, and profiles matching the query.

**Tool Definition:**

```typescript
{
  name: "polymarket_search",
  displayName: "Polymarket/search",
  description: "Search Polymarket for prediction markets, events, and profiles.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query")
  }),
  execute: (
    { query }: z.output<typeof inputSchema>,
    agent: Agent
  ): Promise<TokenRingToolJSONResult<{ results?: any }>>
}
```

**Tool Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Tool identifier (`"polymarket_search"`) |
| `displayName` | `string` | Display name (`"Polymarket/search"`) |
| `description` | `string` | Tool description |
| `inputSchema` | `ZodObject` | Input validation schema |
| `execute` | `Function` | Tool execution function |

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | Search query for prediction markets |

**Example:**

```typescript
const result = await agent.executeTool("polymarket_search", {
  query: "Artificial intelligence"
});
console.log("Search results:", result.data.results);
```

### polymarket_listEvents

Lists Polymarket events with optional filtering.

**Tool Definition:**

```typescript
{
  name: "polymarket_listEvents",
  displayName: "Polymarket/listEvents",
  description: "List active prediction market events on Polymarket.",
  inputSchema: z.object({
    limit: z.number().int().positive().max(100).optional().describe("Number of results (default: 10)"),
    offset: z.number().int().min(0).optional().describe("Offset for pagination (default: 0)"),
    closed: z.boolean().optional().describe("Include closed markets (default: false)"),
    tag_id: z.number().int().optional().describe("Filter by tag ID")
  }),
  execute: (
    { limit, offset, closed, tag_id }: z.output<typeof inputSchema>,
    agent: Agent
  ): Promise<TokenRingToolJSONResult<{ events?: any }>>
}
```

**Tool Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Tool identifier (`"polymarket_listEvents"`) |
| `displayName` | `string` | Display name (`"Polymarket/listEvents"`) |
| `description` | `string` | Tool description |
| `inputSchema` | `ZodObject` | Input validation schema |
| `execute` | `Function` | Tool execution function |

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | `number` | No | `10` | Number of results (max: 100) |
| `offset` | `number` | No | `0` | Offset for pagination |
| `closed` | `boolean` | No | `false` | Include closed markets |
| `tag_id` | `number` | No | - | Filter by tag ID |

**Example:**

```typescript
const result = await agent.executeTool("polymarket_listEvents", {
  limit: 10,
  closed: false
});
console.log("Events:", result.data.events);
```

### polymarket_getEvent

Retrieves detailed information about a specific event by its slug.

**Tool Definition:**

```typescript
{
  name: "polymarket_getEvent",
  displayName: "Polymarket/getEvent",
  description: "Get a specific Polymarket event by its slug (from URL).",
  inputSchema: z.object({
    slug: z.string().min(1).describe("Event slug from Polymarket URL")
  }),
  execute: (
    { slug }: z.output<typeof inputSchema>,
    agent: Agent
  ): Promise<TokenRingToolJSONResult<{ event?: any }>>
}
```

**Tool Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Tool identifier (`"polymarket_getEvent"`) |
| `displayName` | `string` | Display name (`"Polymarket/getEvent"`) |
| `description` | `string` | Tool description |
| `inputSchema` | `ZodObject` | Input validation schema |
| `execute` | `Function` | Tool execution function |

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` | Yes | Event slug from Polymarket URL |

**Example:**

```typescript
const result = await agent.executeTool("polymarket_getEvent", {
  slug: "will-ai-exceed-human-level-performance-by-2025"
});
console.log("Event details:", result.data.event);
```

## Best Practices

### API Usage

- **Query Specificity**: Use specific queries for better search results
- **Pagination**: Use offset and limit for large result sets (max 100 per request)
- **Filtering**: Use tag_id and closed filters to narrow results
- **Slug Format**: Extract slugs from Polymarket URLs for accurate lookups
- **Rate Limiting**: Implement delays between requests for production use

### Market Analysis

- **Compare Markets**: Use search to find related markets for comparison
- **Track Events**: Use listEvents to monitor events over time
- **Analyze Data**: Use getEvent for detailed analysis
- **Volume Analysis**: Check yes_share_volume and no_share_volume for market depth

### Performance Considerations

- **Caching**: Cache API responses when appropriate
- **Rate Limiting**: Respect API rate limits for production applications
- **Batch Operations**: Use listEvents for multiple events instead of individual calls
- **Error Recovery**: Implement retry logic for transient failures

### Slug Extraction

```typescript
// Extract slug from Polymarket URL
function extractSlug(url: string): string {
  const parts = url.split("/event/");
  if (parts.length > 1) {
    return parts[1].split("?")[0];
  }
  throw new Error("Invalid Polymarket event URL");
}

// Usage
const url = "https://polymarket.com/event/fed-decision-in-october";
const slug = extractSlug(url);
const event = await polymarketService.getEventBySlug(slug);
```

### Error Handling

```typescript
try {
  const event = await polymarketService.getEventBySlug("invalid-slug");
  console.log("Event:", event);
} catch (error) {
  console.error("Failed to fetch event:", error.message);
  // Handle error appropriately
}
```

## Testing and Development

### Running Tests

```bash
bun run test
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
bun run test:coverage
```

### Package Structure

```
pkg/polymarket/
├── PolymarketService.ts     # Main service class
├── tools.ts                  # Tool definitions
├── tools/
│   ├── search.ts            # Search tool
│   ├── listEvents.ts        # List events tool
│   └── getEvent.ts          # Get event tool
├── index.ts                  # Package exports
├── plugin.ts                 # Plugin registration
├── package.json              # Package metadata
├── schema.ts                 # Configuration schema
├── vitest.config.ts         # Vitest configuration
├── README.md                # Documentation
└── design/                  # Design documentation
    ├── fetch-markets-guide.md
    ├── search-markets-events-and-profiles.md
    ├── list-markets.md
    ├── get-market-by-slug.md
    ├── list-events.md
    └── get-event-by-slug.md
```

### Build Instructions

```bash
bun run build
```

### Development Commands

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Dependencies

**Production Dependencies:**

- `@tokenring-ai/app` - Base application framework and plugin system
- `@tokenring-ai/chat` - Chat service and tool system
- `@tokenring-ai/agent` - Central orchestration system
- `@tokenring-ai/utility` - Shared utilities including HttpService
- `zod` - Runtime type validation and schema definition

**Development Dependencies:**

- `vitest` - Testing framework
- `@vitest/coverage-v8` - Coverage reporting
- `typescript` - TypeScript compiler

## Error Handling

The service includes comprehensive error handling:

- **Invalid inputs**: Throws descriptive errors for missing required parameters
- **API failures**: Handles HTTP errors and non-OK responses via HttpService
- **Network issues**: Uses retry logic for transient failures (inherited from HttpService)
- **JSON parsing**: Validates and sanitizes API responses

**Error examples:**

```typescript
// Empty query throws error
await polymarket.searchMarkets("");  // Error: "query is required"

// Empty slug throws error
await polymarket.getEventBySlug("");  // Error: "slug is required"

// Empty query in tool throws error
await agent.executeTool("polymarket_search", { query: "" });  // Error: "[polymarket_search] query is required"
```

## Related Components

- **@tokenring-ai/app**: Base application framework providing plugin and service architecture
- **@tokenring-ai/agent**: Agent system that uses the Polymarket tools
- **@tokenring-ai/chat**: Chat service that registers the Polymarket tools
- **@tokenring-ai/utility**: Provides HttpService base class for API interactions
- **HttpService**: HTTP service from `@tokenring-ai/utility`
- **TokenRingService**: Base interface for all services
- **TokenRingToolDefinition**: Interface for tools
- **Polymarket API**: Prediction market API documentation

## Troubleshooting

### API Errors

**Problem**: API requests fail with HTTP errors

**Solution:**
- Verify the baseUrl is correct
- Check network connectivity to Polymarket API
- Ensure API is not temporarily down
- Check for rate limiting

### Search Results

**Problem**: Search returns no results

**Solution:**
- Try different search queries
- Check that markets exist for the query
- Verify the search syntax is correct
- Try listing events to see available markets

### Event Not Found

**Problem**: getEvent returns error

**Solution:**
- Verify the slug is correct (check from search results)
- Ensure the event exists and is not closed
- Check that the slug matches the API format
- Use search to find the correct slug

### Rate Limiting

**Problem**: API returns 429 Too Many Requests

**Solution:**
- Implement retry logic with exponential backoff
- Add delays between requests
- Monitor API rate limits
- Consider caching responses

### Configuration Issues

**Problem**: API requests fail with incorrect configuration

**Solution:**
- Verify baseUrl is set correctly
- Check that the URL uses HTTPS
- Ensure the base URL ends with a trailing slash
- Test the URL in a browser or curl

## License

MIT License - see LICENSE file for details.

## Version

0.2.0
