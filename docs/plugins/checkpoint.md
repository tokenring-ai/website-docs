# Checkpoint Plugin

Checkpoint service for storing Agent Checkpoints with a storage provider.

## Overview

The `@tokenring-ai/checkpoint` package provides checkpoint management for TokenRing AI agents. It enables storing, retrieving, and managing agent state snapshots through a configurable storage provider interface.

## Key Features

- Agent state checkpoint storage
- Pluggable storage provider architecture
- Named checkpoint management
- Checkpoint listing and retrieval
- Integration with agent lifecycle

## Core Components

### AgentCheckpointService

Service for managing agent checkpoints with a storage provider.

**Key Methods:**
- `storeCheckpoint(checkpoint)`: Stores a named checkpoint
- `retrieveCheckpoint(agentId)`: Retrieves checkpoint by agent ID
- `listCheckpoints()`: Lists all available checkpoints

### AgentCheckpointProvider

Abstract interface for checkpoint storage implementations.

**Required Methods:**
- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
- `retrieveCheckpoint(agentId: string): Promise<StoredAgentCheckpoint | null>`
- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`

## Usage Example

```typescript
import { AgentCheckpointService } from '@tokenring-ai/checkpoint';

const checkpointService = new AgentCheckpointService({ 
  provider: myStorageProvider 
});

// Store checkpoint
await checkpointService.storeCheckpoint({
  agentId: 'agent-123',
  name: 'session-1',
  state: { messages: [], variables: {} },
  createdAt: Date.now()
});

// Retrieve checkpoint
const checkpoint = await checkpointService.retrieveCheckpoint('agent-123');
```

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- Storage provider implementation (e.g., `@tokenring-ai/sqlite-storage`)
