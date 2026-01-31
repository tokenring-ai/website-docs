# Browser Agent Storage Plugin

## Overview

Provides browser-based agent state storage for the TokenRing ecosystem using localStorage, enabling persistent agent state management directly in the browser environment.

## Key Features

- **Browser-based Storage**: Utilizes localStorage for agent checkpoint persistence
- **Cross-session Persistence**: Maintains agent state across browser sessions
- **Checkpoint Management**: Supports creation, retrieval, listing, and deletion of agent checkpoints
- **Metadata Tracking**: Stores checkpoint metadata including timestamps and agent IDs
- **Isolation Support**: Configurable storage key prefix for isolation between different applications
- **No Server Dependency**: Fully client-side implementation with no backend requirements
- **Standard API**: Implements the AgentCheckpointProvider interface for seamless integration
- **Error Handling**: Graceful error handling for storage failures and data corruption

## Integration Architecture

The browser-agent-storage plugin integrates with the TokenRing checkpoint system as a provider implementation. It registers with the AgentCheckpointService when the checkpoint configuration specifies the "browser" provider type.

### Plugin Registration

```typescript
import { TokenRingApp, TokenRingPlugin } from '@tokenring-ai/app';
import { CheckpointConfigSchema } from '@tokenring-ai/checkpoint';
import { BrowserAgentStateStorage, BrowserAgentStateStorageOptionsSchema } from './BrowserAgentStateStorage';
import { z } from 'zod';
import packageJSON from './package.json' with { type: 'json' };

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.checkpoint) {
      app.services
        .waitForItemByType(AgentCheckpointService, (checkpointService) => {
          const provider = config.checkpoint.provider;
          if (provider.type === 'browser') {
            checkpointService.setCheckpointProvider(
              new BrowserAgentStateStorage(
                BrowserAgentStateStorageOptionsSchema.parse(provider)
              )
            );
          }
        });
    }
  },
  config: z.object({
    checkpoint: CheckpointConfigSchema.optional()
  })
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Core Components

- **BrowserAgentStateStorage**: Handles the actual storage operations using browser localStorage API
- **TokenRingPlugin Integration**: Registers the storage provider with the checkpoint service during app initialization

## Configuration

The plugin's configuration is structured under the `checkpoint` property. Example configuration:

```yaml
checkpoint:
  provider:
    type: browser
    storageKeyPrefix: "myAppAgents_"
```

The specific options for the browser provider are defined by `BrowserAgentStateStorageOptionsSchema`, which includes:
- `storageKeyPrefix` (optional): String prefix for localStorage keys to avoid collisions. Defaults to `"tokenRingAgentState_v1_"`.

## Usage Examples

### Basic Integration

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import browserAgentStorage from '@tokenring-ai/browser-agent-storage';

const app = new TokenRingApp();
app.registerPlugin(browserAgentStorage, {
  checkpoint: {
    provider: {
      type: 'browser',
      storageKeyPrefix: 'myProject_'
    }
  }
});
```

### Programmatic Usage

```typescript
import { BrowserAgentStateStorage, BrowserAgentStateStorageOptionsSchema } from '@tokenring-ai/browser-agent-storage';

// Create a storage instance
const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'customPrefix_'
});

// Store a checkpoint
const checkpointId = await storage.storeCheckpoint({
  agentId: 'agent-123',
  name: 'Initial State',
  config: { /* agent configuration */ },
  state: { /* agent state data */ },
  createdAt: Date.now()
});

// Retrieve a checkpoint
const checkpoint = await storage.retrieveCheckpoint(checkpointId);

// List all checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();

// Delete a checkpoint
await storage.deleteCheckpoint(checkpointId);

// Clear all checkpoints
await storage.clearAllCheckpoints();
```

## Storage Structure

The plugin uses localStorage with the following structure:

- **Key**: `${storageKeyPrefix}checkpoints`
- **Value**: JSON string containing an array of stored checkpoints
- **Format**: Each checkpoint includes:
  - `id`: Unique identifier (UUID)
  - `agentId`: Associated agent identifier
  - `name`: Checkpoint name
  - `config`: Checkpoint configuration
  - `state`: Agent state data
  - `createdAt`: Timestamp of creation

## API Reference

### BrowserAgentStateStorage

The main storage class that implements the `AgentCheckpointProvider` interface for browser-based storage.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| name | string | Storage provider name (`"BrowserAgentStateStorage"`) |
| storageKeyPrefix | string | Configured prefix for localStorage keys |

#### Methods

##### storeCheckpoint

Stores a new checkpoint for an agent.

```typescript
async storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| checkpoint | NamedAgentCheckpoint | Checkpoint data including agentId, name, config, state, and createdAt |

**Returns:** `Promise<string>` - The ID of the stored checkpoint

##### retrieveCheckpoint

Retrieves a checkpoint by its ID.

```typescript
async retrieveCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| checkpointId | string | The checkpoint identifier |

**Returns:** `Promise<StoredAgentCheckpoint | null>` - The retrieved checkpoint or null if not found

##### listCheckpoints

Lists all stored checkpoints ordered by creation time (newest first).

```typescript
async listCheckpoints(): Promise<AgentCheckpointListItem[]>
```

**Returns:** `Promise<AgentCheckpointListItem[]>` - Array of checkpoint list items

##### deleteCheckpoint

Deletes a specific checkpoint by ID.

```typescript
async deleteCheckpoint(checkpointId: string): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| checkpointId | string | The checkpoint identifier to delete |

**Returns:** `Promise<boolean>` - True if checkpoint was deleted, false if not found

##### clearAllCheckpoints

Clears all checkpoints from storage.

```typescript
async clearAllCheckpoints(): Promise<void>
```

**Returns:** `Promise<void>`

##### close

Closes any resources used by the service. No-op for browser implementation.

```typescript
close(): void
```

**Returns:** `void`

## Agent Configuration

The plugin integrates with the TokenRing agent system through the checkpoint provider. The agent configuration is managed by the checkpoint system, and the browser storage provides the persistence layer for agent checkpoints.

## Development

- Tests are written using vitest (as per package.json scripts)
- To run tests: `bun test`
- Build instructions: `tsc --noEmit` for type checking
- License: MIT

## Related Components

- [Checkpoint Service](checkpoint.md)
- [Agent System](agent.md)
