# @tokenring-ai/browser-storage

The `@tokenring-ai/browser-storage` package provides browser-based agent state storage for the TokenRing ecosystem using localStorage for persistent checkpoint management. It implements the `AgentCheckpointStorage` interface and integrates seamlessly with the TokenRing checkpoint system.

## Overview

The Browser Storage package implements a browser-based storage provider for TokenRing AI agents, providing persistent state management through the browser's localStorage API. This implementation enables agents to store and retrieve their state checkpoints locally within the browser environment.

### Key Features

- **Browser-based Storage**: Uses localStorage for persistent agent state storage
- **Checkpoint Management**: Full CRUD operations for agent state checkpoints
- **TokenRing Integration**: Seamlessly integrates with the TokenRing checkpoint system via the `AgentCheckpointStorage` interface
- **Agent-specific Storage**: Supports multiple agents with configurable storage isolation via prefixes
- **Cross-platform Compatibility**: Works across all modern browsers supporting localStorage
- **Type-safe Implementation**: Full TypeScript support with Zod schema validation
- **Error Handling**: Graceful handling of storage errors, data corruption, and quota exceeded scenarios
- **Performance Optimized**: Efficient storage and retrieval operations with batch support

## Core Components

### BrowserStorageService

The main storage class that implements the `AgentCheckpointStorage` interface for browser-based storage:

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Storage provider name (`"BrowserAgentStateStorage"`) |
| `description` | `string` | Service description |
| `displayName` | `string` | Display name including the configured prefix |
| `options` | `ParsedBrowserStorageConfig` | Configuration options |

**Public Methods:**

- `storeAgentCheckpoint(checkpoint)`: Stores a new checkpoint and returns its UUID v4 ID
- `retrieveAgentCheckpoint(checkpointId)`: Retrieves a checkpoint by ID, returns null if not found
- `listAgentCheckpoints()`: Lists all checkpoints ordered by creation time (newest first)
- `deleteCheckpoint(checkpointId)`: Deletes a specific checkpoint, returns boolean
- `clearAllCheckpoints()`: Clears all checkpoints from storage (browser-specific extension)
- `close()`: No-op method for resource cleanup (localStorage doesn't require closing)

**Private Methods:**

- `_getStorageKey()`: Returns the localStorage key for storing checkpoints
- `_getAllCheckpoints()`: Retrieves all checkpoints from localStorage
- `_saveAllCheckpoints(checkpoints)`: Saves all checkpoints to localStorage

### BrowserStorageServiceConfigSchema

Zod schema for validating storage options:

```typescript
const BrowserStorageServiceConfigSchema = z.object({
  storageKeyPrefix: z.string().default('tokenring:'),
}).default({ storageKeyPrefix: 'tokenring:' });
```

### Types and Exports

The package exports the following types and interfaces:

```typescript
// Main class
import BrowserStorageService from '@tokenring-ai/browser-storage';

// Zod schema for validation
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

// Checkpoint types from @tokenring-ai/checkpoint
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointStorage,
} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
```

**Type Definitions:**

| Type | Description | Fields |
|------|-------------|--------|
| `NamedAgentCheckpoint` | Checkpoint with name | `agentId`, `agentType`, `sessionId`, `name`, `state`, `createdAt` |
| `StoredAgentCheckpoint` | Stored checkpoint with ID | All `NamedAgentCheckpoint` fields + `id` |
| `AgentCheckpointListItem` | Minimal checkpoint info (for listing) | `id`, `name`, `agentId`, `agentType`, `sessionId`, `createdAt` |

## Services

### AgentCheckpointStorage Integration

The `BrowserStorageService` class implements the `AgentCheckpointStorage` interface from `@tokenring-ai/checkpoint`:

```typescript
interface AgentCheckpointStorage {
  name: string;
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
  deleteCheckpoint(checkpointId: string): Promise<boolean>;
  clearAllCheckpoints(): Promise<void>;
  close(): void;
}
```

**Checkpoint Structure:**

Each checkpoint stored in localStorage has the following structure:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (UUID v4) |
| `agentId` | string | The agent identifier |
| `agentType` | string | The type of agent (e.g., 'developer', 'content-creator') |
| `sessionId` | string | Optional session identifier |
| `name` | string | Checkpoint name |
| `state` | object | Agent state data |
| `createdAt` | number | Timestamp of checkpoint creation |

**Storage Structure:**

- All checkpoints are stored in a single localStorage entry under the key: `{prefix}checkpoints`
- The storage contains an array of checkpoint objects
- All agents share the same storage when using the same prefix
- Use different prefixes to isolate data between applications

## Provider Documentation

This package implements a checkpoint storage provider for the TokenRing checkpoint system. Providers are registered with the `AgentCheckpointService` to provide storage implementations for agent checkpoints.

### Provider Interface

All checkpoint storage providers must implement the `AgentCheckpointStorage` interface:

| Method | Description | Returns |
|--------|-------------|---------|
| `storeAgentCheckpoint(checkpoint)` | Store a new checkpoint and return its ID | `Promise<string>` (UUID v4) |
| `retrieveAgentCheckpoint(checkpointId)` | Retrieve a checkpoint by its ID | `Promise<StoredAgentCheckpoint \| null>` |
| `listAgentCheckpoints()` | List all checkpoints ordered by creation time (newest first) | `Promise<AgentCheckpointListItem[]>` |
| `deleteCheckpoint(checkpointId)` | Delete a specific checkpoint | `Promise<boolean>` |
| `clearAllCheckpoints()` | Clear all checkpoints from storage | `Promise<void>` |
| `close()` | Close any resources used by the provider | `void` (no-op for browser) |

### Browser-specific Extensions

The `BrowserStorageService` class extends the base interface with additional methods:

| Method | Description | Returns |
|--------|-------------|---------|
| `clearAllCheckpoints()` | Clear all checkpoints from storage | `Promise<void>` |

### Provider Configuration

The browser provider configuration is validated using `BrowserStorageServiceConfigSchema`:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `storageKeyPrefix` | `string` | No | `"tokenring:"` | Prefix for localStorage keys to achieve isolation between applications |

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands.

## Configuration

The plugin configuration uses a flat `browserStorage` property structure.

### Plugin Configuration Schema

```typescript
import { z } from "zod";
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

const packageConfigSchema = z.object({
  browserStorage: BrowserStorageServiceConfigSchema
});
```

### Configuration Example

```yaml
browserStorage:
  storageKeyPrefix: "myApp_"
```

### Full Plugin Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import BrowserAgentStoragePlugin from "@tokenring-ai/browser-storage/plugin";

const app = new TokenRingApp({
  plugins: [
    BrowserAgentStoragePlugin({
      browserStorage: {
        storageKeyPrefix: "myApp_"
      }
    })
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

1. **Provider Registration**: Registers `BrowserStorageService` when plugin is configured
2. **Service Dependencies**: Uses `waitForItemByType` to ensure `AgentCheckpointService` is available
3. **Schema Validation**: Validates provider configuration using Zod schemas
4. **Automatic Initialization**: Provider is initialized during app startup

### Integration with App Framework

The package integrates with the TokenRing app framework through the plugin system:

1. **Plugin Registration**: Registered as a TokenRing plugin with configuration support
2. **Service Management**: Integrates with the app's service management system
3. **Lifecycle Management**: Provider is initialized during app startup
4. **Configuration Loading**: Configuration is loaded and validated at plugin installation

## Usage Examples

### Basic Storage Operations

```typescript
import BrowserStorageService from '@tokenring-ai/browser-storage';

// Initialize storage with default prefix
const storage = new BrowserStorageService({});

// Create a checkpoint
const checkpoint = {
  agentId: 'agent-123',
  agentType: 'developer',
  name: 'initial-state',
  state: { messages: [], context: {} },
  createdAt: Date.now(),
};

const checkpointId = await storage.storeAgentCheckpoint(checkpoint);
console.log('Stored checkpoint:', checkpointId);

// Retrieve a checkpoint
const retrieved = await storage.retrieveAgentCheckpoint(checkpointId);
console.log('Retrieved checkpoint:', retrieved);

// List all checkpoints (newest first)
const allCheckpoints = await storage.listAgentCheckpoints();
console.log('All checkpoints:', allCheckpoints);

// Delete a specific checkpoint
const deleted = await storage.deleteCheckpoint(checkpointId);
console.log('Deleted:', deleted);
```

### Custom Storage Prefix

```typescript
import BrowserStorageService from '@tokenring-ai/browser-storage';

// Use custom prefix for isolation between applications
const storage = new BrowserStorageService({
  storageKeyPrefix: 'myapp_v2_',
});

// This will store data under keys starting with 'myapp_v2_'
// Example: 'myapp_v2_checkpoints'
```

### Multiple Agents with Isolation

```typescript
import BrowserStorageService from '@tokenring-ai/browser-storage';

// Development agents
const devStorage = new BrowserStorageService({
  storageKeyPrefix: 'dev_agents_',
});

// Content creation agents
const contentStorage = new BrowserStorageService({
  storageKeyPrefix: 'content_agents_',
});

// Store checkpoints for different agents
const devCheckpoint = {
  agentId: 'dev-001',
  agentType: 'developer',
  name: 'dev-checkpoint',
  state: { messages: [], context: { project: 'api' } },
  createdAt: Date.now(),
};

const contentCheckpoint = {
  agentId: 'content-001',
  agentType: 'content-creator',
  name: 'content-checkpoint',
  state: { messages: [], context: { project: 'blog' } },
  createdAt: Date.now(),
};

const devId = await devStorage.storeAgentCheckpoint(devCheckpoint);
const contentId = await contentStorage.storeAgentCheckpoint(contentCheckpoint);

// Verify isolation - each storage only sees its own checkpoints
const devCheckpoints = await devStorage.listAgentCheckpoints(); // 1 checkpoint
const contentCheckpoints = await contentStorage.listAgentCheckpoints(); // 1 checkpoint

// Cross-storage retrieval returns null
const devInContent = await contentStorage.retrieveAgentCheckpoint(devId); // null
const contentInDev = await devStorage.retrieveAgentCheckpoint(contentId); // null
```

### Integration with TokenRing

The plugin automatically registers the browser storage provider when configured:

```typescript
// In your TokenRing app configuration
const app = new TokenRingApp({
  plugins: [
    BrowserAgentStoragePlugin({
      browserStorage: {
        storageKeyPrefix: "myapp_"
      }
    })
  ]
});

// The BrowserStorageService will be automatically registered
// with the AgentCheckpointService
```

### Development Workflow Example

```typescript
import BrowserStorageService from '@tokenring-ai/browser-storage';

const storage = new BrowserStorageService({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: 'dev-agent-001',
  agentType: 'developer',
  name: 'initial-development',
  state: {
    messages: [],
    context: { project: 'todo-app', phase: 'initialization' }
  },
  createdAt: Date.now() - 3600000, // 1 hour ago
};

const featureCheckpoint = {
  agentId: 'dev-agent-001',
  agentType: 'developer',
  name: 'feature-implementation',
  state: {
    messages: [{ role: 'user', content: 'Implement todo feature' }],
    context: { project: 'todo-app', phase: 'feature-development' }
  },
  createdAt: Date.now() - 1800000, // 30 minutes ago
};

const testingCheckpoint = {
  agentId: 'dev-agent-001',
  agentType: 'developer',
  name: 'testing-phase',
  state: {
    messages: [{ role: 'user', content: 'Run tests' }],
    context: { project: 'todo-app', phase: 'testing', testResults: 'passed' }
  },
  createdAt: Date.now() - 600000, // 10 minutes ago
};

// Store checkpoints
const initialId = await storage.storeAgentCheckpoint(initialCheckpoint);
const featureId = await storage.storeAgentCheckpoint(featureCheckpoint);
const testingId = await storage.storeAgentCheckpoint(testingCheckpoint);

// List checkpoints (newest first)
const checkpoints = await storage.listAgentCheckpoints();
// Order: testing-phase, feature-implementation, initial-development

// Retrieve specific checkpoint
const current = await storage.retrieveAgentCheckpoint(testingId);

// Remove outdated checkpoint
await storage.deleteCheckpoint(initialId);

// Clear all checkpoints
await storage.clearAllCheckpoints();
```

### Error Handling Example

```typescript
import BrowserStorageService from '@tokenring-ai/browser-storage';

const storage = new BrowserStorageService({});

try {
  const checkpoint = {
    agentId: 'agent-123',
    agentType: 'developer',
    name: 'test-checkpoint',
    state: { messages: [] },
    createdAt: Date.now(),
  };

  const id = await storage.storeAgentCheckpoint(checkpoint);
  console.log('Checkpoint stored:', id);
} catch (error) {
  console.error('Failed to store checkpoint:', error);
  // The implementation handles errors gracefully and logs them
  // Operations will fail silently with error logging to console
}

// Retrieving non-existent checkpoint returns null
const nonExistent = await storage.retrieveAgentCheckpoint('non-existent-id');
console.log(nonExistent); // null
```

## Best Practices

### Storage Prefix Isolation

Use unique storage prefixes for different applications to avoid conflicts:

```typescript
const storage = new BrowserStorageService({
  storageKeyPrefix: 'myapp_v2_' // Use versioned prefix for migrations
});
```

### Checkpoint Naming

Use descriptive checkpoint names that indicate their purpose:

```typescript
{
  agentId: 'agent-123',
  agentType: 'developer',
  name: 'feature-development', // Clear, descriptive name
  state: { /* ... */ },
  createdAt: Date.now()
}
```

### Error Handling

Handle potential storage errors gracefully:

```typescript
try {
  await storage.storeAgentCheckpoint(checkpoint);
} catch (error) {
  console.error('Failed to store checkpoint:', error);
  // Fallback strategy
}
```

### Cleanup Strategy

Regularly clean up old checkpoints to manage storage limits:

```typescript
const checkpoints = await storage.listAgentCheckpoints();
// Keep only the last 10 checkpoints
const toDelete = checkpoints.slice(0, -10);
for (const checkpoint of toDelete) {
  await storage.deleteCheckpoint(checkpoint.id);
}
```

### Monitoring Storage

Be aware of localStorage limits and implement monitoring:

```typescript
async function getStorageUsage(storage: BrowserStorageService): Promise<number> {
  const checkpoints = await storage.listAgentCheckpoints();
  const data = JSON.stringify(checkpoints);
  return data.length; // Size in bytes
}

// Check if approaching limit (5MB = 5 * 1024 * 1024 bytes)
const usage = await getStorageUsage(storage);
if (usage > 4 * 1024 * 1024) {
  console.warn('Approaching localStorage limit, consider cleanup');
}
```

### Multiple Agents

When working with multiple agents, use descriptive agent IDs:

```typescript
const checkpoint = {
  agentId: 'dev-agent-001', // Descriptive agent ID
  agentType: 'developer',
  name: 'checkpoint-name',
  state: { messages: [] },
  createdAt: Date.now()
};
```

## Testing

The package includes comprehensive Vitest configuration for testing:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
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
bun run test BrowserStorageService.test.ts

# Run integration tests
bun run test integration.test.ts

# Run all tests with coverage
bun run test:coverage
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent system with state management
- `@tokenring-ai/app` (0.2.0) - TokenRing application framework
- `@tokenring-ai/checkpoint` (0.2.0) - Checkpoint management interface
- `zod` (^4.3.6) - Schema validation
- `uuid` (^13.0.0) - Unique ID generation (UUID v4)

### Development Dependencies

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

## Package Structure

```
pkg/browser-storage/
├── index.ts                         # Main exports
├── plugin.ts                        # Plugin definition for TokenRing integration
├── package.json                     # Package configuration
├── README.md                        # Package documentation
├── schema.ts                        # Configuration schema
├── vitest.config.ts                 # Vitest configuration
├── BrowserStorageService.ts         # Core storage implementation
├── BrowserStorageService.test.ts    # Unit tests
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
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
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
