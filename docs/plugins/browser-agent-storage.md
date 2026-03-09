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
- **Error Handling**: Graceful error handling for storage failures, data corruption, and quota exceeded scenarios
- **Type-safe Implementation**: Full TypeScript support with Zod schema validation
- **Comprehensive Testing**: Vitest-based test suite with mock localStorage
- **Performance Optimized**: Efficient storage and retrieval operations with batch support

## Core Components

### BrowserAgentStateStorage

The main storage class that implements the `AgentCheckpointProvider` interface for browser-based storage. It provides methods for storing, retrieving, listing, and deleting agent checkpoints using browser localStorage.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Storage provider name (`"BrowserAgentStateStorage"`) |
| `storageKeyPrefix` | `string` | Configured prefix for localStorage keys |

**Public Methods:**

- `storeCheckpoint(checkpoint)`: Stores a new checkpoint and returns its UUID v4 ID
- `retrieveCheckpoint(checkpointId)`: Retrieves a checkpoint by ID, returns null if not found
- `listCheckpoints()`: Lists all checkpoints ordered by creation time (newest first)
- `deleteCheckpoint(checkpointId)`: Deletes a specific checkpoint, returns boolean
- `clearAllCheckpoints()`: Clears all checkpoints from storage (browser-specific extension)
- `close()`: No-op method for resource cleanup (localStorage doesn't require closing)

**Private Methods:**

- `_getStorageKey()`: Returns the localStorage key for storing checkpoints
- `_getAllCheckpoints()`: Retrieves all checkpoints from localStorage
- `_saveAllCheckpoints(checkpoints)`: Saves all checkpoints to localStorage

### BrowserAgentStateStorageOptionsSchema

Zod schema for validating storage options:

```typescript
const BrowserAgentStateStorageOptionsSchema = z.object({
  storageKeyPrefix: z.string().optional().default("tokenRingAgentState_v1_"),
});
```

### Types and Exports

The package exports the following types and interfaces:

```typescript
// Main class
import BrowserAgentStateStorage from '@tokenring-ai/browser-storage';

// Zod schema for validation
import { BrowserAgentStateStorageOptionsSchema } from '@tokenring-ai/browser-storage';

// Checkpoint types from @tokenring-ai/checkpoint
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointProvider,
} from '@tokenring-ai/checkpoint/AgentCheckpointProvider';
```

**Type Definitions:**

| Type | Description | Fields |
|------|-------------|--------|
| `NamedAgentCheckpoint` | Checkpoint with name | `agentId`, `name`, `config`, `state`, `createdAt` |
| `StoredAgentCheckpoint` | Stored checkpoint with ID | All `NamedAgentCheckpoint` fields + `id` |
| `AgentCheckpointListItem` | Minimal checkpoint info (for listing) | `id`, `name`, `config`, `agentId`, `createdAt` (excludes `state` and full `config`) |

## Services

### AgentCheckpointProvider Integration

The `BrowserAgentStateStorage` class implements the `AgentCheckpointProvider` interface from `@tokenring-ai/checkpoint`:

```typescript
interface AgentCheckpointProvider {
  name: string;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
  deleteCheckpoint(checkpointId: string): Promise<boolean>;
  close(): void;
}
```

**Checkpoint Structure:**

Each checkpoint stored in localStorage has the following structure:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (UUID v4) |
| `agentId` | string | The agent identifier |
| `name` | string | Checkpoint name |
| `config` | object | Agent configuration at checkpoint time |
| `state` | object | Agent state data |
| `createdAt` | number | Timestamp of checkpoint creation |

**Storage Structure:**

- All checkpoints are stored in a single localStorage entry under the key: `{prefix}checkpoints`
- The storage contains an array of checkpoint objects
- All agents share the same storage when using the same prefix
- Use different prefixes to isolate data between applications

## Provider Documentation

This package implements a checkpoint provider for the TokenRing checkpoint system. Providers are registered with the `AgentCheckpointService` to provide storage implementations for agent checkpoints.

### Provider Interface

All checkpoint providers must implement the `AgentCheckpointProvider` interface:

| Method | Description | Returns |
|--------|-------------|---------|
| `storeCheckpoint(checkpoint)` | Store a new checkpoint and return its ID | `Promise<string>` (UUID v4) |
| `retrieveCheckpoint(checkpointId)` | Retrieve a checkpoint by its ID | `Promise<StoredAgentCheckpoint \| null>` |
| `listCheckpoints()` | List all checkpoints ordered by creation time (newest first) | `Promise<AgentCheckpointListItem[]>` |
| `deleteCheckpoint(checkpointId)` | Delete a specific checkpoint | `Promise<boolean>` |
| `close()` | Close any resources used by the provider | `void` (no-op for browser) |

### Browser-specific Extensions

The `BrowserAgentStateStorage` class extends the base interface with additional methods:

| Method | Description | Returns |
|--------|-------------|---------|
| `clearAllCheckpoints()` | Clear all checkpoints from storage | `Promise<void>` |

### Provider Configuration

The browser provider configuration is validated using `BrowserAgentStateStorageOptionsSchema`:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `storageKeyPrefix` | `string` | No | `"tokenRingAgentState_v1_"` | Prefix for localStorage keys to achieve isolation between applications |

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
import browserAgentStorage from "@tokenring-ai/browser-storage";

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
import browserAgentStorage from "@tokenring-ai/browser-storage";

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
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-storage";

// Create a storage instance with default prefix
const storage = new BrowserAgentStateStorage({});

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
if (checkpoint) {
  console.log("Retrieved:", checkpoint.name);
}

// List all checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();
console.log("Total checkpoints:", checkpoints.length);

// Delete a checkpoint
const deleted = await storage.deleteCheckpoint(checkpointId);
console.log("Deleted:", deleted);

// Clear all checkpoints
await storage.clearAllCheckpoints();

// Close resources (no-op for browser)
storage.close();
```

### Development Workflow Example

```typescript
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-storage";

const storage = new BrowserAgentStateStorage({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: "dev-agent-001",
  name: "initial-development",
  config: { model: "gpt-4", temperature: 0.7 },
  state: { 
    messages: [], 
    context: { project: "todo-app", phase: "initialization" } 
  },
  createdAt: Date.now() - 3600000, // 1 hour ago
};

const featureCheckpoint = {
  agentId: "dev-agent-001",
  name: "feature-implementation",
  config: { model: "gpt-4", temperature: 0.8 },
  state: {
    messages: [{ role: "user", content: "Implement todo feature" }],
    context: { project: "todo-app", phase: "feature-development" }
  },
  createdAt: Date.now() - 1800000, // 30 minutes ago
};

const testingCheckpoint = {
  agentId: "dev-agent-001",
  name: "testing-phase",
  config: { model: "gpt-4", temperature: 0.3 },
  state: {
    messages: [{ role: "user", content: "Run tests" }],
    context: { project: "todo-app", phase: "testing", testResults: "passed" }
  },
  createdAt: Date.now() - 600000, // 10 minutes ago
};

// Store checkpoints
const initialId = await storage.storeCheckpoint(initialCheckpoint);
const featureId = await storage.storeCheckpoint(featureCheckpoint);
const testingId = await storage.storeCheckpoint(testingCheckpoint);

// List checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();
// Order: testing-phase, feature-implementation, initial-development

// Retrieve a specific checkpoint
const current = await storage.retrieveCheckpoint(testingId);
console.log("Current phase:", current?.state.context.phase);

// Remove outdated checkpoint
await storage.deleteCheckpoint(initialId);

// Clear all checkpoints
await storage.clearAllCheckpoints();
```

### Isolation Example

```typescript
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-storage";

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
const app1Checkpoints = await app1Storage.listCheckpoints(); // Only app1 checkpoints
const app2Checkpoints = await app2Storage.listCheckpoints(); // Only app2 checkpoints

// Cross-storage retrieval returns null
const app1InApp2 = await app2Storage.retrieveCheckpoint(app1CheckpointId); // null
const app2InApp1 = await app1Storage.retrieveCheckpoint(app2CheckpointId); // null
```

### Error Handling Example

```typescript
import { BrowserAgentStateStorage } from "@tokenring-ai/browser-storage";

const storage = new BrowserAgentStateStorage({});

try {
  const checkpoint = {
    agentId: "agent-123",
    name: "test-checkpoint",
    config: { model: "gpt-4" },
    state: { messages: [] },
    createdAt: Date.now(),
  };

  const id = await storage.storeCheckpoint(checkpoint);
  console.log("Checkpoint stored:", id);
} catch (error) {
  console.error("Failed to store checkpoint:", error);
  // The implementation handles errors gracefully and logs them
  // Operations will fail silently with error logging to console
}

// Retrieving non-existent checkpoint returns null (not an error)
const nonExistent = await storage.retrieveCheckpoint("non-existent-id");
console.log(nonExistent); // null
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

### Monitoring Storage

Be aware of localStorage limits and implement monitoring:

```typescript
async function getStorageUsage(storage: BrowserAgentStateStorage): Promise<number> {
  const checkpoints = await storage.listCheckpoints();
  const data = JSON.stringify(checkpoints);
  return data.length; // Size in bytes
}

// Check if approaching limit (5MB = 5 * 1024 * 1024 bytes)
const usage = await getStorageUsage(storage);
if (usage > 4 * 1024 * 1024) {
  console.warn("Approaching localStorage limit, consider cleanup");
}
```

### Multiple Agents

When working with multiple agents, use descriptive agent IDs:

```typescript
const checkpoint = {
  agentId: "dev-agent-001", // Descriptive agent ID
  name: "checkpoint-name",
  config: { model: "gpt-4" },
  state: { messages: [] },
  createdAt: Date.now()
};
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

- **Constructor**: Default and custom prefix initialization
- **Storage Operations**: CRUD operations for checkpoints
- **Error Handling**: Quota exceeded, malformed JSON, localStorage unavailable
- **Integration**: Complete checkpoint lifecycle, data isolation
- **Performance**: Rapid checkpoint creation, batch operations
- **Real-world Workflows**: Development workflows, content creation workflows

### Running Tests

```bash
# Run unit tests
bun test BrowserAgentStateStorage.test.ts

# Run integration tests
bun test integration.test.ts

# Run all tests with coverage
bun test --coverage
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent system with state management
- `@tokenring-ai/app` (0.2.0) - TokenRing application framework
- `@tokenring-ai/checkpoint` (0.2.0) - Checkpoint management interface
- `zod` (^4.3.6) - Schema validation
- `uuid` (^13.0.0) - Unique ID generation (UUID v4)

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Package Structure

```
pkg/browser-storage/
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
- **Storage Limits**: Limited by browser localStorage size constraints (typically 5-10MB per domain)
- **No Cross-device Sync**: Data is tied to specific browser/domain
- **No Server-side Persistence**: All data remains in the browser
- **Single Storage Entry**: All checkpoints stored in a single localStorage entry
- **No Transaction Support**: Operations are not atomic

## Error Handling

The implementation includes robust error handling for common scenarios:

| Scenario | Behavior |
|----------|----------|
| Quota exceeded | Error logged to console, checkpoint not stored |
| Malformed JSON | Empty array returned, operation continues |
| localStorage unavailable | Error logged to console, empty array returned |
| Non-existent checkpoint | Returns null (not an error) |

All errors are logged to the console but do not throw exceptions, allowing the application to continue operating gracefully.

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

MIT License - see `LICENSE` file for details.

## Related Components

- [Checkpoint Service](checkpoint.md) - Core checkpoint management with provider system
- [Agent System](agent.md) - Agent system with state management
- [App Framework](./app.md) - TokenRing application framework
