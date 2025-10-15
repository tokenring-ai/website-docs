# CloudQuote Plugin

Financial data tools for TokenRing Writer providing access to market data, quotes, and news.

## Overview

The `@tokenring-ai/cloudquote` package provides financial data tools for accessing market data, stock quotes, price history, and financial news. It integrates with the CloudQuote API to deliver real-time and historical market information.

## Key Features

- Real-time stock quotes and pricing
- Market leaders and movers
- Intraday price ticks
- Historical price data
- News headlines by security

## Core Components

### Tools

**getQuote**: Retrieve pricing and metadata for a security symbol
- Input: `{ symbol: string }`
- Returns: Current price, volume, market cap, and other quote data

**getLeaders**: Get notable stocks (most active, gainers, losers, popular)
- Input: `{ category: 'active' | 'gainers' | 'losers' | 'popular' }`
- Returns: List of top stocks in the specified category

**getPriceTicks**: Fetch intraday price ticks
- Input: `{ symbol: string, interval?: string }`
- Returns: Intraday price movements

**getPriceHistory**: Fetch historical daily price data
- Input: `{ symbol: string, startDate?: string, endDate?: string }`
- Returns: Historical price data for the specified period

**getHeadlinesBySecurity**: Retrieve news headlines for symbols
- Input: `{ symbols: string[] }`
- Returns: Recent news headlines related to the specified securities

## Usage Example

```typescript
import * as cloudquote from '@tokenring-ai/cloudquote';

// Get quote for a symbol
const quote = await agent.executeTool('cloudquote/getQuote', {
  symbol: 'AAPL'
});

// Get market leaders
const gainers = await agent.executeTool('cloudquote/getLeaders', {
  category: 'gainers'
});

// Get price history
const history = await agent.executeTool('cloudquote/getPriceHistory', {
  symbol: 'TSLA',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

## Configuration Options

- **API Key**: Required CloudQuote API key (set via environment variable)
- **Base URL**: CloudQuote API endpoint

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- CloudQuote API integration (requires implementation)

## Notes

- This package provides the tool structure but requires CloudQuote API integration to be functional
- Each tool currently throws a "Not implemented" error and needs actual API implementation
- Requires valid CloudQuote API credentials
