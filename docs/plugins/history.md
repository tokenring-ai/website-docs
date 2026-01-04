# History Plugin

The History plugin provides conversation history management and persistence for TokenRing agents.

## Overview

The History plugin stores and retrieves conversation messages, enabling agents to maintain context across sessions and interactions.

## Features

- Conversation history storage
- Message persistence
- Context retrieval
- Session management

## Installation

```bash
bun install @tokenring-ai/history
```

## Usage

```typescript
import &#123; Agent &#125; from '@tokenring-ai/agent';
import HistoryService from '@tokenring-ai/history';

const agent = new Agent(&#123;
  services: [new HistoryService()],
&#125;);
```

## Configuration

The History plugin can be configured with storage backends for persistent conversation history.

## API Reference

See the [Plugin Overview](./overview.md) for common patterns and architecture.
