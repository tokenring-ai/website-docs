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
} satisfies TokenRingPlugin;
```

## Core Components
- **BrowserAgentStateStorage**: Handles the actual storage operations using browser storage APIs (localStorage/sessionStorage)
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
import { z } from 'zod';

// Create a storage instance
const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'customPrefix_'
});

// Store a checkpoint
const checkpointId = await storage.storeCheckpoint({
  agentId: 'agent-123',
  name: 'Initial State',
  config: { /* agent configuration */ },
  state: { /* agent state data */ }
});

// Retrieve a checkpoint
const checkpoint = await storage.retrieveCheckpoint(checkpointId);

// List all checkpoints
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
  - `id`: Unique identifier
  - `agentId`: Associated agent identifier
  - `name`: Checkpoint name
  - `config`: Checkpoint configuration
  - `state`: Agent state data
  - `createdAt`: Timestamp of creation

## Monitoring and Debugging
- The plugin logs detailed messages when initializing the storage provider
- Errors during storage operations are caught and logged for debugging

## Development
- Tests are written using vitest (as per package.json scripts)
- To run tests: `bun test`
- Build instructions: `tsc --noEmit` for type checking
- License: MIT

## Related Components
- [Checkpoint Service](docs/docs/plugins/checkpoint.md)
- [Agent System](docs/docs/plugins/agent.md)