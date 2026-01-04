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
import &#123; TokenRingApp, TokenRingPlugin &#125; from '@tokenring-ai/app';
import &#123; CheckpointConfigSchema &#125; from '@tokenring-ai/checkpoint';
import &#123; BrowserAgentStateStorage, BrowserAgentStateStorageOptionsSchema &#125; from './BrowserAgentStateStorage';
import &#123; z &#125; from 'zod';
import packageJSON from './package.json' with &#123; type: 'json' &#125;;

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    if (config.checkpoint) &#123;
      app.services
        .waitForItemByType(AgentCheckpointService, (checkpointService) =&gt; &#123;
          const provider = config.checkpoint.provider;
          if (provider.type === 'browser') &#123;
            checkpointService.setCheckpointProvider(
              new BrowserAgentStateStorage(
                BrowserAgentStateStorageOptionsSchema.parse(provider)
              )
            );
          &#125;
        &#125;);
    &#125;
  &#125;,
  config: z.object(&#123;
    checkpoint: CheckpointConfigSchema.optional()
  &#125;)
&#125; satisfies TokenRingPlugin;
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
import &#123; TokenRingApp &#125; from '@tokenring-ai/app';
import browserAgentStorage from '@tokenring-ai/browser-agent-storage';

const app = new TokenRingApp();
app.registerPlugin(browserAgentStorage, &#123;
  checkpoint: &#123;
    provider: &#123;
      type: 'browser',
      storageKeyPrefix: 'myProject_'
    &#125;
  &#125;
&#125;);
```

### Programmatic Usage
```typescript
import &#123; BrowserAgentStateStorage, BrowserAgentStateStorageOptionsSchema &#125; from '@tokenring-ai/browser-agent-storage';
import &#123; z &#125; from 'zod';

// Create a storage instance
const storage = new BrowserAgentStateStorage(&#123;
  storageKeyPrefix: 'customPrefix_'
&#125;);

// Store a checkpoint
const checkpointId = await storage.storeCheckpoint(&#123;
  agentId: 'agent-123',
  name: 'Initial State',
  config: &#123; /* agent configuration */ &#125;,
  state: &#123; /* agent state data */ &#125;
&#125;);

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

- **Key**: `$&#123;storageKeyPrefix&#125;checkpoints`
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
- [Checkpoint Service](checkpoint.md)
- [Agent System](agent.md)