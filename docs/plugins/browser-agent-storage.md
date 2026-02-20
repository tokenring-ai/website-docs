# Browser Agent Storage Plugin

## Overview

Provides browser-based agent state storage for the TokenRing ecosystem using localStorage, enabling persistent agent state management directly in the browser environment. The plugin implements the `AgentCheckpointProvider` interface and integrates seamlessly with the TokenRing checkpoint system.

## Key Features

- **Browser-based Storage**: Utilizes localStorage for agent checkpoint persistence
- **Cross-session Persistence**: Maintains agent state across browser sessions
- **Checkpoint Management**: Supports creation, retrieval, listing, and deletion of agent checkpoints
- **Metadata Tracking**: Stores checkpoint metadata including timestamps and agent IDs
- **Isolation Support**: Configurable storage key prefix for isolation between different applications
- **No Server Dependency**: Fully client-side implementation with no backend requirements
- **Standard API**: Implements the `AgentCheckpointProvider` interface for seamless integration
- **Error Handling**: Graceful error handling for storage failures and data corruption
- **Type-safe Implementation**: Full TypeScript support with Zod schema validation
- **Comprehensive Testing**: Vitest-based test suite with mock localStorage

## Core Components

### BrowserAgentStateStorage

The main storage class that implements the `AgentCheckpointProvider` interface for browser-based storage. It provides methods for storing, retrieving, listing, and deleting agent checkpoints using browser localStorage.

**Key Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Storage provider name (`"BrowserAgentStateStorage"`) |
| `storageKeyPrefix` | `string` | Configured prefix for localStorage keys |

**Methods:**

- `storeCheckpoint(checkpoint)`: Stores a new checkpoint and returns its ID
- `retrieveCheckpoint(checkpointId)`: Retrieves a checkpoint by ID
- `listCheckpoints()`: Lists all checkpoints ordered by creation time (newest first)
- `deleteCheckpoint(checkpointId)`: Deletes a specific checkpoint
- `clearAllCheckpoints()`: Clears all checkpoints from storage
- `close()`: No-op method for resource cleanup

### BrowserAgentStateStorageOptionsSchema

Zod schema for validating storage options:

```typescript
const BrowserAgentStateStorageOptionsSchema = z.object({
  storageKeyPrefix: z.string().optional().default("tokenRingAgentState_v1_"),
});
```

## Services

### AgentCheckpointProvider Integration

The `BrowserAgentStateStorage` class implements the `AgentCheckpointProvider` interface from `@tokenring-ai/checkpoint`:

```typescript
interface AgentCheckpointProvider {
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
  deleteCheckpoint(checkpointId: string): Promise<boolean>;
  clearAllCheckpoints(): Promise<void>;
  close(): void;
}
```

**Checkpoint Types:**

| Type | Description | Fields |
|------|-------------|--------|
| `NamedAgentCheckpoint` | Checkpoint with name | `agentId`, `name`, `config`, `state`, `createdAt` |
| `StoredAgentCheckpoint` | Stored checkpoint with ID | All `NamedAgentCheckpoint` fields + `id` |
| `AgentCheckpointListItem` | Minimal checkpoint info | `id`, `name`, `config`, `agentId`, `createdAt` |

## Provider Documentation

This package implements a checkpoint provider for the TokenRing checkpoint system. Providers are registered with the `AgentCheckpointService` to provide storage implementations for agent checkpoints.

### Provider Interface

All checkpoint providers must implement the `AgentCheckpointProvider` interface:

| Method | Description |
|--------|-------------|
| `storeCheckpoint(checkpoint)` | Store a new checkpoint and return its ID |
| `retrieveCheckpoint(checkpointId)` | Retrieve a checkpoint by its ID |
| `listCheckpoints()` | List all checkpoints ordered by creation time |
| `deleteCheckpoint(checkpointId)` | Delete a specific checkpoint |
| `clearAllCheckpoints()` | Clear all checkpoints from storage |
| `close()` | Close any resources used by the provider |

### Provider Configuration

The browser provider configuration is validated using `BrowserAgentStateStorageOptionsSchema`:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `storageKeyPrefix` | `string` | No | `"tokenRingAgentState_v1_"` | Prefix for localStorage keys to achieve isolation |

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands.

## Configuration

The plugin configuration is structured under the `checkpoint` property and integrates with the checkpoint system from `@tokenring-ai/checkpoint`.

### Plugin Configuration Schema

```typescript
import { z } from "zod";
import { CheckpointConfigSchema } from "@tokenring-ai/checkpoint";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
});
```

### Configuration Example

```yaml
checkpoint:
  provider:
    type: browser
    storageKeyPrefix: "myAppAgents_"
```

### Full Plugin Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import browserAgentStorage from "@tokenring-ai/browser-agent-storage";

const app = new TokenRingApp("/path/to/packages", {
  plugins: [
    {
      plugin: browserAgentStorage,
      config: {
        checkpoint: {
          provider: {
            type: "browser",
            storageKeyPrefix: "myApp_"
          }
        }
      }
    }
  ]
});
```

## Integration

### Integration with Agent System

The package integrates with the TokenRing agent system by providing persistent storage for agent checkpoints:

1. **Checkpoint Storage**: Stores agent state checkpoints in browser localStorage
2. **State Persistence**: Maintains agent state across sessions
3. **Plugin Registration**: Automatically registers with `AgentCheckpointService` when configured
4. **Agent Lifecycle**: Supports agent checkpoint creation, retrieval, and deletion

### Integration with Checkpoint Service

The package integrates with the checkpoint service through plugin registration:

1. **Provider Registration**: Registers `BrowserAgentStateStorage` when checkpoint provider type is "browser"
2. **Service Dependencies**: Uses `waitForItemByType` to ensure `AgentCheckpointService` is available
3. **Schema Validation**: Validates provider configuration using Zod schemas
4. **Automatic Initialization**: Provider is initialized when app services are ready

### Integration with App Framework

The package integrates with the TokenRing app framework through the plugin system:

1. **Plugin Registration**: Registered as a TokenRing plugin with configuration support
2. **Service Management**: Integrates with the app's service management system
3. **Lifecycle Management**: Provider is initialized during app startup
4. **Configuration Loading**: Configuration is loaded and validated at plugin installation

## Usage Examples

### Basic Integration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import browserAgentStorage from "@tokenring-ai/browser-agent-storage";

const app = new TokenRingApp("/path/to/packages", {
  plugins: [
    {
      plugin: browserAgentStorage,
      config: {
        checkpoint: {
          provider: {
            type: "browser",
            storageKeyPrefix: "myApp_"
          }
        }
      }
    }
  ]
});

await app.run();
```

### Programmatic Usage

```typescript
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-agent-storage";

// Create a storage instance
const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: "customPrefix_"
});

// Store a checkpoint
const checkpointId = await storage.storeCheckpoint({
  agentId: "agent-123",
  name: "Initial State",
  config: { model: "gpt-4", temperature: 0.7 },
  state: { messages: [], context: {} },
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

// Close resources
storage.close();
```

### Development Workflow Example

```typescript
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-agent-storage";

const storage = new BrowserAgentStateStorage({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: "dev-agent-001",
  name: "initial-development",
  config: { model: "gpt-4", temperature: 0.7 },
  state: { messages: [], context: { project: "todo-app" } },
  createdAt: Date.now() - 3600000,
};

const featureCheckpoint = {
  agentId: "dev-agent-001",
  name: "feature-implementation",
  config: { model: "gpt-4", temperature: 0.8 },
  state: {
    messages: [{ role: "user", content: "Implement todo feature" }],
    context: { project: "todo-app", phase: "feature-development" }
  },
  createdAt: Date.now() - 1800000,
};

// Store checkpoints
await storage.storeCheckpoint(initialCheckpoint);
await storage.storeCheckpoint(featureCheckpoint);

// List checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();
console.log("Development checkpoints:", checkpoints);

// Retrieve a specific checkpoint
const retrieved = await storage.retrieveCheckpoint(checkpoints[0].id);
console.log("Retrieved checkpoint:", retrieved?.name);
```

### Isolation Example

```typescript
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-agent-storage";

// Create isolated storage instances for different applications
const app1Storage = new BrowserAgentStateStorage({
  storageKeyPrefix: "app1_"
});

const app2Storage = new BrowserAgentStateStorage({
  storageKeyPrefix: "app2_"
});

// Store checkpoints in each storage
const app1CheckpointId = await app1Storage.storeCheckpoint({
  agentId: "agent-1",
  name: "app1-checkpoint",
  config: { model: "gpt-4" },
  state: { messages: [] },
  createdAt: Date.now()
});

const app2CheckpointId = await app2Storage.storeCheckpoint({
  agentId: "agent-1",
  name: "app2-checkpoint",
  config: { model: "gpt-4" },
  state: { messages: [] },
  createdAt: Date.now()
});

// Verify isolation
console.log(await app1Storage.listCheckpoints()); // Only app1 checkpoints
console.log(await app2Storage.listCheckpoints()); // Only app2 checkpoints
```

## Best Practices

### Storage Prefix Isolation

Use unique storage prefixes for different applications to avoid conflicts:

```typescript
const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: "myapp_v2_" // Use versioned prefix for migrations
});
```

### Checkpoint Naming

Use descriptive checkpoint names that indicate their purpose:

```typescript
{
  agentId: "agent-123",
  name: "feature-development", // Clear, descriptive name
  config: { model: "gpt-4" },
  state: { /* ... */ },
  createdAt: Date.now()
}
```

### Error Handling

Handle potential storage errors gracefully:

```typescript
try {
  await storage.storeCheckpoint(checkpoint);
} catch (error) {
  console.error("Failed to store checkpoint:", error);
  // Fallback strategy
}
```

### Cleanup Strategy

Regularly clean up old checkpoints to manage storage limits:

```typescript
const checkpoints = await storage.listCheckpoints();
// Keep only the last 10 checkpoints
const toDelete = checkpoints.slice(0, -10);
for (const checkpoint of toDelete) {
  await storage.deleteCheckpoint(checkpoint.id);
}
```

## Testing

The package includes comprehensive Vitest configuration for testing:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Coverage

- **Unit Tests**: Unit tests for all storage operations
- **Integration Tests**: Integration tests for real-world usage scenarios
- **Error Handling**: Tests for error scenarios and edge cases
- **Performance**: Tests for rapid checkpoint creation and batch operations

### Test Scenarios

The test suite includes scenarios for:

- Basic CRUD operations (create, read, update, delete)
- Multiple checkpoints for same/different agents
- Storage isolation with different prefixes
- Large data storage handling
- Quota exceeded scenarios
- Data corruption recovery
- Consistency across operations
- Performance scenarios (rapid creation, batch operations)

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent system with state management
- `@tokenring-ai/app` (0.2.0) - TokenRing application framework
- `@tokenring-ai/checkpoint` (0.2.0) - Checkpoint management interface
- `zod` (^4.3.6) - Schema validation
- `uuid` (^13.0.0) - Unique ID generation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Package Structure

```
pkg/browser-agent-storage/
├── index.ts                         # Main exports
├── plugin.ts                        # Plugin definition for TokenRing integration
├── package.json                     # Package configuration
├── README.md                        # Package documentation
├── vitest.config.ts                 # Vitest configuration
├── BrowserAgentStateStorage.ts      # Core storage implementation
├── BrowserAgentStateStorage.test.ts # Unit tests
└── integration.test.ts              # Integration tests
```

## Limitations

- **Browser-only**: Only works in browser environments with localStorage support
- **Storage Limits**: Limited by browser localStorage size constraints (typically 5-10MB)
- **No Cross-device Sync**: Data is tied to specific browser/domain
- **No Server-side Persistence**: All data remains in the browser

## Development

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

### Building

```bash
bun run build
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Related Components

- [Checkpoint Service](checkpoint.md) - Core checkpoint management with provider system
- [Agent System](agent.md) - Agent system with state management
- [App Framework](token-ring-app.md) - TokenRing application framework
