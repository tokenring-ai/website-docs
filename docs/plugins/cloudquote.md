# CloudQuote Plugin

Financial data tools for TokenRing Writer providing access to market data, quotes, and news through the CloudQuote API.

## Overview

The `@tokenring-ai/cloudquote` package provides comprehensive financial market data tools for accessing real-time stock quotes, historical price data, market leaders, intraday price ticks, and financial news. It integrates with the CloudQuote API service to deliver accurate and timely financial information through a robust service-based architecture.

## Key Features

- Real-time stock quotes with pricing and metadata
- Market leaders lists (most active, percent gainers, percent losers)
- Intraday price ticks with time, price, and volume data
- Historical daily price data for analysis and charting
- News headlines filtered by security symbols
- Automatic retry logic and error handling
- Timezone-aware data formatting
- Type-safe tool integration with schema validation
- Multi-API endpoint support (quotes and news)

## Core Components

### Service Architecture

The CloudQuote plugin implements a service-based architecture with:

- **CloudQuoteService**: Main service class handling API requests with automatic retry logic
- **HTTP Service Integration**: Extends `@tokenring-ai/utility` HTTP service with custom headers and error handling
- **Multi-API Support**: Separate endpoints for quote data and news headlines

### Tools

#### getQuote

Retrieve pricing and metadata for given security symbols.

**Parameters:**
- `symbols` (required): Array of ticker symbols to fetch (e.g. `['AAPL', 'GOOGL', 'MSFT']`)

```typescript
import * as cloudquote from '@tokenring-ai/cloudquote';

// Get quotes for multiple symbols
const quotes = await agent.executeTool('cloudquote/getQuote', {
  symbols: ['AAPL', 'GOOGL', 'MSFT']
});
```

#### getLeaders

Get a list of stocks that are notable today.

**Parameters:**
- `list` (required): Type of list (`MOSTACTIVE`, `PERCENTGAINERS`, `PERCENTLOSERS`)
- `type` (optional): Security type (`STOCK` or `ETF`)
- `limit` (optional): Max number of results (1-50)
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter

```typescript
// Get most active stocks
const active = await agent.executeTool('cloudquote/getLeaders', {
  list: 'MOSTACTIVE',
  limit: 25
});

// Get percent gainers
const gainers = await agent.executeTool('cloudquote/getLeaders', {
  list: 'PERCENTGAINERS',
  type: 'STOCK',
  limit: 20
});
```

#### getPriceTicks

Fetch intraday price ticks (time, price, volume) for a symbol.

**Parameters:**
- `symbol` (required): Ticker symbol

```typescript
// Get intraday price ticks for a symbol
const ticks = await agent.executeTool('cloudquote/getPriceTicks', {
  symbol: 'AAPL'
});
```

#### getPriceHistory

Fetch historical daily price data for a symbol.

**Parameters:**
- `symbol` (required): Ticker symbol
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

```typescript
// Get historical price data
const history = await agent.executeTool('cloudquote/getPriceHistory', {
  symbol: 'AAPL',
  from: '2023-01-01',
  to: '2023-12-31'
});
```

#### getHeadlinesBySecurity

Retrieve news headlines for one or more ticker symbols.

**Parameters:**
- `symbols` (required): Comma-separated ticker symbols (e.g., `'GOOG,AAPL'`)
- `start` (optional): Number of records to skip
- `count` (optional): Number of records to retrieve (max 100)
- `minDate` (optional): Start date-time filter (ISO 8601)
- `maxDate` (optional): End date-time filter (ISO 8601)

```typescript
// Get headlines for multiple symbols
const headlines = await agent.executeTool('cloudquote/getHeadlinesBySecurity', {
  symbols: 'AAPL,GOOGL,MSFT',
  count: 50
});
```

## Configuration Options

The plugin requires an API key to access the CloudQuote service:

```typescript
// In your app configuration
{
  "cloudquote": {
    "apiKey": "your-cloudquote-api-key"
  }
}
```

## Dependencies

- `@tokenring-ai/app`: Application framework and service management
- `@tokenring-ai/agent`: Core agent orchestration system
- `@tokenring-ai/chat`: Chat and tool integration
- `@tokenring-ai/utility`: HTTP utilities and retry logic
- `zod`: Schema validation for tool inputs
- `date-fns-tz`: Date formatting and timezone handling

## API Integration Details

### Quote API Endpoints

- **Base URL**: `https://api.cloudquote.io`
- **Endpoints**: 
  - `fcon/getQuote`: Get security quotes
  - `fcon/getLeaders`: Get market leaders
  - `fcon/getPriceTicks`: Get intraday price data
  - `fcon/getPriceHistory`: Get historical price data

### News API Integration

- **Base URL**: `http://api.investcenter.newsrpm.com:16016/search/indexedData`
- **Endpoint**: `fcon/getHeadlinesBySecurity`

### Chart Generation

- **URL**: `https://chart.financialcontent.com/Chart`
- **Parameters**: Symbol, interval, and styling options
- **Output**: SVG data URI for chart visualization

## Error Handling

The plugin implements custom error handling:

- **CloudQuoteError**: Custom error class with detailed error messages
- **Automatic Retries**: Built-in retry logic for failed API requests
- **Timeout Handling**: 10-second request timeouts
- **HTTP Status Errors**: Detailed error messages for non-200 responses

## Usage Examples

### Basic Integration

```typescript
import * as cloudquote from '@tokenring-ai/cloudquote';

// Get quote for a symbol
const quote = await agent.executeTool('cloudquote/getQuote', {
  symbols: ['AAPL']
});

// Get market leaders
const gainers = await agent.executeTool('cloudquote/getLeaders', {
  list: 'PERCENTGAINERS'
});

// Get price history
const history = await agent.executeTool('cloudquote/getPriceHistory', {
  symbol: 'TSLA',
  from: '2024-01-01',
  to: '2024-12-31'
});

// Get headlines
const headlines = await agent.executeTool('cloudquote/getHeadlinesBySecurity', {
  symbols: 'AAPL,GOOGL,MSFT',
  count: 10
});
```

### Service Direct Access

For more control, you can access the service directly:

```typescript
import { CloudQuoteService } from '@tokenring-ai/cloudquote';

// Assuming the service is registered in your app
const service = agent.requireService(CloudQuoteService);

// Get quotes directly through service
const quotes = await service.getJSON('fcon/getQuote', { symbol: 'AAPL' });

// Get headlines through dedicated news API
const headlines = await service.getHeadlinesBySecurity({ 
  symbols: 'AAPL', 
  count: 20 
});
```

## Development Notes

### Timezone Handling

The plugin automatically converts all timestamps to America/New_York timezone and formats them as YYYY-MM-DD for consistent display.

### Data Formatting

- **Price Ticks**: Formats time column to YYYY-MM-DD format
- **Price History**: Formats date column to YYYY-MM-DD format
- **Headlines**: Adds links to financial content articles when available

### API Best Practices

- Request date ranges with 1-day buffer for best results
- Use appropriate limits to avoid excessive data retrieval
- Handle API rate limits through built-in retry mechanisms

## License

MIT License - see LICENSE file for details.