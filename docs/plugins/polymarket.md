# Polymarket Plugin

## Overview

The Polymarket Plugin provides integration with Polymarket prediction markets, enabling AI agents to search for markets, list events, and retrieve detailed market information. It allows agents to interact with prediction market data for research, analysis, and decision-making purposes.

This plugin serves as a service that integrates with the TokenRing agent system. It provides tools for programmatic access to Polymarket's prediction market data, including market search, event listing, and individual market/event retrieval.

## Key Features

- **Market Search**: Search for prediction markets by query
- **Event Listing**: List events with filtering options
- **Event Retrieval**: Get detailed information about specific events
- **Market Retrieval**: Get detailed information about specific markets
- **Configurable Base URL**: Support for custom Polymarket API endpoints
- **RESTful API**: Uses standard HTTP requests for API interactions
- **Error Handling**: Comprehensive error handling for API operations

## Chat Commands

The plugin does not currently provide chat commands. All operations are available through tools.

## Plugin Configuration

The plugin is configured through the `polymarket` section in the plugin configuration. It accepts a `PolymarketConfigSchema` which defines the base URL for the Polymarket API.

### Configuration Schema

```typescript
import { z } from "zod";

export const PolymarketConfigSchema = z.object({
  baseUrl: z.string().optional(),
});

export type PolymarketConfig = z.infer<typeof PolymarketConfigSchema>;
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

const app = new app.App();

app.addPlugin(polymarketPlugin, {
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com"
  }
});
```

## Services

### PolymarketService

The main service class that implements `TokenRingService`. It provides methods for querying Polymarket prediction markets.

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  protected baseUrl: string;
}
```

**Service Properties:**

- `name`: Service identifier ("PolymarketService")
- `description`: Service description
- `baseUrl`: Polymarket API base URL

**Constructor:**

```typescript
constructor(config: PolymarketConfig = {})
```

**Service Methods:**

```typescript
async searchMarkets(query: string): Promise<any>

async listEvents(opts: PolymarketSearchOptions = {}): Promise<any>

async getEventBySlug(slug: string): Promise<any>

async getMarketBySlug(slug: string): Promise<any>
```

**Method Descriptions:**

- `searchMarkets(query)`: Searches for prediction markets matching the query
- `listEvents(opts)`: Lists events with optional filtering
- `getEventBySlug(slug)`: Retrieves detailed information about an event by its slug
- `getMarketBySlug(slug)`: Retrieves detailed information about a market by its slug

**Search Options:**

```typescript
interface PolymarketSearchOptions {
  limit?: number;      // Number of results to return (default: 10)
  offset?: number;     // Number of results to skip (default: 0)
  closed?: boolean;    // Whether to include closed markets (default: false)
  tag_id?: number;     // Filter by tag ID
}
```

## Tools

The plugin provides the following tools for Polymarket operations:

### search

Searches for prediction markets matching the query.

**Tool Definition:**

```typescript
const name = "polymarket_search";
const description = "Search for prediction markets";
const inputSchema = z.object({
  query: z.string().describe("The search query")
});
```

**Tool Interface:**

```typescript
{
  name: "polymarket_search";
  description: "Search for prediction markets";
  inputSchema: z.object({
    query: string;
  });
  execute: (
    args: { query: string },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute search tool
const result = await agent.executeTool("polymarket_search", {
  query: "AI development"
});

console.log("Search results:", result);
```

### listEvents

Lists Polymarket events with optional filtering.

**Tool Definition:**

```typescript
const name = "polymarket_listEvents";
const description = "List Polymarket events";
const inputSchema = z.object({
  limit: z.number().optional().describe("Number of events to return"),
  offset: z.number().optional().describe("Number of events to skip"),
  closed: z.boolean().optional().describe("Include closed events"),
  tag_id: z.number().optional().describe("Filter by tag ID")
});
```

**Tool Interface:**

```typescript
{
  name: "polymarket_listEvents";
  description: "List Polymarket events";
  inputSchema: z.object({
    limit?: number;
    offset?: number;
    closed?: boolean;
    tag_id?: number;
  });
  execute: (
    args: {
      limit?: number;
      offset?: number;
      closed?: boolean;
      tag_id?: number;
    },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute list events tool
const result = await agent.executeTool("polymarket_listEvents", {
  limit: 10,
  closed: false
});

console.log("Events:", result);
```

### getEvent

Retrieves detailed information about a specific event.

**Tool Definition:**

```typescript
const name = "polymarket_getEvent";
const description = "Get detailed information about a specific event";
const inputSchema = z.object({
  slug: z.string().describe("The slug of the event")
});
```

**Tool Interface:**

```typescript
{
  name: "polymarket_getEvent";
  description: "Get detailed information about a specific event";
  inputSchema: z.object({
    slug: string;
  });
  execute: (
    args: { slug: string },
    agent: Agent
  ) => Promise<any>;
}
```

**Usage:**

```typescript
// Execute get event tool
const result = await agent.executeTool("polymarket_getEvent", {
  slug: "will-ai-exceed-human-level-performance-by-2025"
});

console.log("Event details:", result);
```

## State Management

The Polymarket Plugin does not maintain agent state. All operations are stateless and rely on the PolymarketService instance for API interactions.

## Context Handlers

The plugin does not provide context handlers. Polymarket operations are performed through tools.

## Usage Examples

### Basic Setup

```typescript
import polymarketPlugin from "@tokenring-ai/polymarket";
import app from "@tokenring-ai/app";

const app = new app.App();

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
const eventsResult = await agent.executeTool("polymarket_listEvents", {
  limit: 20,
  closed: false
});

console.log("Events found:", eventsResult.length);
eventsResult.forEach(event => {
  console.log(`- ${event.title} (${event.slug})`);
});
```

### Using the Get Event Tool

```typescript
// Get specific event details
const eventResult = await agent.executeTool("polymarket_getEvent", {
  slug: "will-ai-exceed-human-level-performance-by-2025"
});

console.log("Event title:", eventResult.title);
console.log("Event description:", eventResult.description);
console.log("Market resolution:", eventResult.resolution);
```

### Using the Get Market Tool

```typescript
// Get specific market details
const marketResult = await agent.executeTool("polymarket_getMarket", {
  slug: "will-ai-exceed-human-level-performance-by-2025"
});

console.log("Market price:", marketResult.price);
console.log("Yes share volume:", marketResult.yes_share_volume);
console.log("No share volume:", marketResult.no_share_volume);
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

## Integration

### HttpService

The PolymarketService extends `HttpService` from `@tokenring-ai/utility/http/HttpService` for HTTP request handling.

```typescript
import { HttpService } from "@tokenring-ai/utility/http/HttpService";

class PolymarketService extends HttpService implements TokenRingService {
  protected baseUrl: string;

  constructor(config: PolymarketConfig = {}) {
    super();
    this.baseUrl = config.baseUrl || "https://gamma-api.polymarket.com";
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
if (config.polymarket) {
  app.addServices(new PolymarketService(config.polymarket));
}
```

### Plugin Installation

The plugin is installed during application initialization:

```typescript
import polymarketPlugin from "@tokenring-ai/polymarket";

const app = new app.App();

app.addPlugin(polymarketPlugin, {
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com"
  }
});
```

## Best Practices

### API Usage

- **Query Specificity**: Use specific queries for better search results
- **Pagination**: Use offset and limit for large result sets
- **Filtering**: Use tag_id and closed filters to narrow results
- **Error Handling**: Handle API errors gracefully

### Market Analysis

- **Compare Markets**: Use search to find related markets for comparison
- **Track Events**: Use listEvents to monitor events over time
- **Analyze Data**: Use getEvent and getMarket for detailed analysis

### Performance Considerations

- **Caching**: Cache API responses when appropriate
- **Rate Limiting**: Respect API rate limits
- **Batch Operations**: Use listEvents for multiple events instead of individual calls

### Error Handling

- **Input Validation**: Always provide required parameters
- **API Errors**: Handle HTTP errors and API-specific errors
- **Network Errors**: Implement retry logic for transient failures

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
└── tsconfig.json             # TypeScript configuration
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
- **Polymarket API**: Prediction market API documentation

## Troubleshooting

### API Errors

**Problem**: API requests fail with HTTP errors

**Solution**:
- Verify the baseUrl is correct
- Check network connectivity to Polymarket API
- Ensure API is not temporarily down
- Check for rate limiting

### Search Results

**Problem**: Search returns no results

**Solution**:
- Try different search queries
- Check that markets exist for the query
- Verify the search syntax is correct
- Try listing events to see available markets

### Event/Market Not Found

**Problem**: getEvent or getMarket returns error

**Solution**:
- Verify the slug is correct (check from search results)
- Ensure the event/market exists and is not closed
- Check that the slug matches the API format
- Use search to find the correct slug

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
