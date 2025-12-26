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
import TokenRingApp, {TokenRingPlugin} from "@tokenring-ai/app";
import { CheckpointPluginConfigSchema } from "@tokenring-ai/checkpoint";

export default {
    name: "@tokenring-ai/browser-agent-storage",
    version: "0.2.0",
    description: "Provides browser-based agent state storage",
    install(app: TokenRingApp) {
        const config = app.getConfigSlice(
            "checkpoint",
            CheckpointPluginConfigSchema,
        );

        if (config) {
            app.services
                .waitForItemByType(AgentCheckpointService, (checkpointService) => {
                    for (const name in config.providers) {
                        const provider = config.providers[name];
                        if (provider.type === "browser") {
                            checkpointService.registerProvider(
                                name,
                                new BrowserAgentStateStorage(
                                    BrowserAgentStateStorageOptionsSchema.parse(provider),
                                ),
                            );
                        }
                    }
                });
        }
    },
} satisfies TokenRingPlugin;
```

## Core Components

### BrowserAgentStateStorage Class
Main implementation class that provides browser-based agent state storage functionality.

#### Constructor
```typescript
constructor({
    storageKeyPrefix,
}: z.infer<typeof BrowserAgentStateStorageOptionsSchema>);
```

**Parameters:**
- `storageKeyPrefix` (optional): Prefix for localStorage keys to achieve isolation between different applications or instances.

#### Methods

##### storeCheckpoint
```typescript
async storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
```
Stores a new checkpoint for an agent.

**Parameters:**
- `checkpoint`: The checkpoint data to store, including agent ID, name, config, and state.

**Returns:**
- A Promise that resolves to the checkpoint ID.

##### retrieveCheckpoint
```typescript
async retrieveCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>;
```
Retrieves a specific checkpoint by its ID.

**Parameters:**
- `checkpointId`: The unique identifier of the checkpoint to retrieve.

**Returns:**
- A Promise that resolves to the checkpoint data or null if not found.

##### listCheckpoints
```typescript
async listCheckpoints(): Promise<AgentCheckpointListItem[]>;
```
Lists all stored checkpoints, sorted by creation time (newest first).

**Returns:**
- A Promise that resolves to an array of checkpoint list items with metadata.

##### deleteCheckpoint
```typescript
async deleteCheckpoint(checkpointId: string): Promise<boolean>;
```
Deletes a specific checkpoint by its ID.

**Parameters:**
- `checkpointId`: The unique identifier of the checkpoint to delete.

**Returns:**
- A Promise that resolves to `true` if the checkpoint was deleted, `false` if not found.

##### clearAllCheckpoints
```typescript
async clearAllCheckpoints(): Promise<void>;
```
Clears all checkpoints from storage.

**Returns:**
- A Promise that resolves when the operation is complete.

##### close
```typescript
close(): void;
```
Closes any resources used by the service (no-op for localStorage implementation).

## Configuration

### BrowserAgentStateStorageOptionsSchema
Configuration schema for the browser storage provider:

```typescript
const BrowserAgentStateStorageOptionsSchema = z.object({
    storageKeyPrefix: z.string().optional().default(DEFAULT_AGENT_STATE_PREFIX),
});
```

**Properties:**
- `storageKeyPrefix` (optional): String prefix for localStorage keys. Defaults to `"tokenRingAgentState_v1_"`.

### Example Configuration
```typescript
import { z } from "zod";

const checkpointConfig = {
    providers: {
        "browser-storage": {
            type: "browser",
            storageKeyPrefix: "myAppAgents_",
        }
    }
};
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

## Usage Examples

### Basic Integration
```typescript
// In your TokenRing application configuration
const config = {
    checkpoint: {
        providers: {
            "browser-storage": {
                type: "browser",
                storageKeyPrefix: "myProject_",
            }
        }
    }
};

// The plugin automatically registers with the checkpoint service
```

### Programmatic Usage
```typescript
import { BrowserAgentStateStorage, BrowserAgentStateStorageOptionsSchema } from "@tokenring-ai/browser-agent-storage";
import { z } from "zod";

// Create a storage instance
const storage = new BrowserAgentStateStorage({
    storageKeyPrefix: "customPrefix_",
});

// Store a checkpoint
const checkpointId = await storage.storeCheckpoint({
    agentId: "agent-123",
    name: "Initial State",
    config: { /* agent configuration */ },
    state: { /* agent state data */ },
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

### Real-world Development Workflow
```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-agent-storage';

const storage = new BrowserAgentStateStorage({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'initial-development',
  config: { model: 'gpt-4', temperature: 0.7 },
  state: { messages: [], context: { project: 'todo-app' } },
  createdAt: Date.now() - 3600000,
};

const featureCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'feature-implementation',
  config: { model: 'gpt-4', temperature: 0.8 },
  state: { 
    messages: [{ role: 'user', content: 'Implement todo feature' }],
    context: { project: 'todo-app', phase: 'feature-development' }
  },
  createdAt: Date.now() - 1800000,
};

// Store checkpoints
await storage.storeCheckpoint(initialCheckpoint);
await storage.storeCheckpoint(featureCheckpoint);

// List checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();
console.log('Development checkpoints:', checkpoints);
```

### Content Creation Workflow
```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-agent-storage';

const storage = new BrowserAgentStateStorage({});

// Simulate content creation workflow
const planningCheckpoint = {
  agentId: 'content-agent-001',
  name: 'content-planning',
  config: { model: 'gpt-4', temperature: 0.9 },
  state: { messages: [], context: { project: 'blog-series', topic: 'AI development' } },
  createdAt: Date.now() - 7200000,
};

const draftingCheckpoint = {
  agentId: 'content-agent-001',
  name: 'drafting-article-1',
  config: { model: 'gpt-4', temperature: 0.8 },
  state: { 
    messages: [{ role: 'user', content: 'Write introduction' }],
    context: { project: 'blog-series', article: 'getting-started-with-ai', status: 'draft' }
  },
  createdAt: Date.now() - 3600000,
};

const finalizingCheckpoint = {
  agentId: 'content-agent-001',
  name: 'finalizing-article',
  config: { model: 'gpt-4', temperature: 0.6 },
  state: { 
    messages: [{ role: 'user', content: 'Review and finalize' }],
    context: { project: 'blog-series', article: 'getting-started-with-ai', status: 'final', reviewed: true }
  },
  createdAt: Date.now() - 600000,
};

// Store checkpoints
await storage.storeCheckpoint(planningCheckpoint);
await storage.storeCheckpoint(draftingCheckpoint);
await storage.storeCheckpoint(finalizingCheckpoint);

// List checkpoints to see workflow progression
const checkpoints = await storage.listCheckpoints();
console.log('Content creation checkpoints:', checkpoints);
```

### Multiple Agents with Different Prefixes
```typescript
// Create isolated storage instances for different agents
const devStorage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'dev_agents_',
});

const contentStorage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'content_agents_',
});

// Store checkpoints for different agents
const devCheckpoint = {
  agentId: 'dev-001',
  name: 'dev-checkpoint',
  config: { model: 'gpt-4' },
  state: { messages: [], context: { project: 'api' } },
  createdAt: Date.now() - 1800000,
};

const contentCheckpoint = {
  agentId: 'content-001',
  name: 'content-checkpoint',
  config: { model: 'gpt-4' },
  state: { messages: [], context: { project: 'blog' } },
  createdAt: Date.now() - 900000,
};

await devStorage.storeCheckpoint(devCheckpoint);
await contentStorage.storeCheckpoint(contentCheckpoint);

// Verify isolation
const devCheckpoints = await devStorage.listCheckpoints();
const contentCheckpoints = await contentStorage.listCheckpoints();

console.log('Dev checkpoints:', devCheckpoints);
console.log('Content checkpoints:', contentCheckpoints);

// Verify cross-storage retrieval returns null
const devInContent = await contentStorage.retrieveCheckpoint('dev-checkpoint-id');
const contentInDev = await devStorage.retrieveCheckpoint('content-checkpoint-id');

console.log('Dev checkpoint in content storage:', devInContent); // null
console.log('Content checkpoint in dev storage:', contentInDev); // null
```

## Limitations and Considerations

### Storage Constraints
- **Size Limit**: Browser localStorage typically has a 5MB limit per domain
- **Data Persistence**: Data is tied to the specific browser and domain
- **No Cross-device Sync**: Checkpoints are not synchronized across devices

### Best Practices
- Use meaningful prefix names to avoid conflicts with other applications
- Monitor storage usage to prevent exceeding localStorage limits
- Consider alternative storage solutions for large datasets or cross-device needs
- Implement checkpoint cleanup strategies for long-running applications

### Error Handling
The storage automatically handles:
- localStorage read/write errors
- JSON parsing errors
- Graceful fallback to empty state on errors
- Quota exceeded scenarios
- Data corruption recovery

## Dependencies

### Package Dependencies
- `@tokenring-ai/agent`: Core agent orchestration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/checkpoint`: Checkpoint service and schema definitions
- `zod`: Schema validation
- `uuid`: UUID generation for checkpoint IDs

### Development Dependencies
- `vitest`: Testing framework
- `typescript`: TypeScript support

## Testing
The package includes comprehensive unit and integration tests using Vitest:

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Coverage
- **Unit Tests**: `BrowserAgentStateStorage.test.ts` - Tests individual methods and edge cases
- **Integration Tests**: `integration.test.ts` - Tests real-world usage scenarios and workflows
- **Mocking**: localStorage is mocked for testing to ensure isolation

## Development

### Package Structure
```
pkg/browser-agent-storage/
├── BrowserAgentStateStorage.ts      # Core storage implementation
├── BrowserAgentStateStorage.test.ts # Unit tests
├── integration.test.ts            # Integration tests
├── plugin.ts                      # TokenRing plugin integration
├── index.ts                       # Module exports
├── package.json                   # Package configuration
├── vitest.config.ts              # Test configuration
└── README.md                      # Package documentation
```

### Building and Testing

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Build (TypeScript compilation)
bun run build
```

## License
MIT License - See LICENSE file for details.