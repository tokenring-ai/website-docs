# @tokenring-ai/browser-storage

## User Guide

The `@tokenring-ai/browser-storage` package provides browser-based agent state storage for the TokenRing ecosystem using localStorage for persistent checkpoint management. It implements the `AgentCheckpointStorage` interface and integrates seamlessly with the TokenRing checkpoint system.

### Overview

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

### Chat Commands

This package does not define any chat commands.

### Tools

This package does not define any tools.

### Configuration

The plugin configuration uses a flat `browserStorage` property structure.

#### Plugin Configuration Schema

```typescript
import { z } from "zod";
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

const packageConfigSchema = z.object({
  browserStorage: BrowserStorageServiceConfigSchema
});
```

#### Configuration Example

```yaml
browserStorage:
  storageKeyPrefix: "myApp_"
```

#### Configuration Options

| Property         | Type   | Required | Default      | Description                                                                   |
|------------------|--------|----------|--------------|-------------------------------------------------------------------------------|
| storageKeyPrefix | string | No       | `tokenring:` | Custom prefix for localStorage keys to achieve isolation between applications |

### Integration

The package integrates with the TokenRing agent system by providing persistent storage for agent checkpoints:

1. **Checkpoint Storage**: Stores agent state checkpoints in browser localStorage
2. **State Persistence**: Maintains agent state across sessions
3. **Plugin Registration**: Automatically registers with `AgentCheckpointService` when configured
4. **Agent Lifecycle**: Supports agent checkpoint creation, retrieval, and deletion

### Best Practices

1. **Use Descriptive Checkpoint Names**: Make checkpoint names meaningful for easy identification
2. **Implement Cleanup Logic**: Regularly delete outdated checkpoints to manage storage
3. **Monitor Storage Size**: Be aware of localStorage limits and implement cleanup when needed
4. **Use Prefixes for Isolation**: Use different prefixes for different applications
5. **Handle Errors Gracefully**: Always handle potential storage errors in production code

## Developer Reference

### Core Components

#### BrowserStorageService

The main storage class that implements the `AgentCheckpointStorage` interface for browser-based storage.

**Properties:**

| Property    | Type                       | Description                                          |
|-------------|----------------------------|------------------------------------------------------|
| name        | string                     | Storage provider name (`"BrowserAgentStateStorage"`) |
| description | string                     | Service description                                  |
| displayName | string                     | Display name including the configured prefix         |
| options     | ParsedBrowserStorageConfig | Configuration options                                |

**Public Methods:**

| Method                          | Parameters                      | Returns                        | Description                                              |
|---------------------------------|---------------------------------|--------------------------------|----------------------------------------------------------|
| `storeAgentCheckpoint`          | `NamedAgentCheckpoint`          | `string`                       | Stores a new checkpoint and returns its UUID v4 ID       |
| `retrieveAgentCheckpoint`       | `string`                        | `StoredAgentCheckpoint \| null`| Retrieves a checkpoint by ID, returns null if not found  |
| `listAgentCheckpoints`          | -                               | `AgentCheckpointListItem[]`    | Lists all checkpoints ordered by creation time (newest)  |
| `deleteCheckpoint`              | `string`                        | `boolean`                      | Deletes a specific checkpoint, returns true if deleted   |
| `clearAllCheckpoints`           | -                               | `void`                         | Clears all checkpoints from storage                      |
| `close`                         | -                               | `void`                         | No-op method for resource cleanup                        |

**Private Methods:**

- `_getStorageKey()`: Returns the localStorage key for storing checkpoints
- `_getAllCheckpoints()`: Retrieves all checkpoints from localStorage
- `_saveAllCheckpoints(checkpoints)`: Saves all checkpoints to localStorage

### Services

#### AgentCheckpointStorage Integration

The `BrowserStorageService` class implements the `AgentCheckpointStorage` interface from `@tokenring-ai/checkpoint`:

```typescript
interface AgentCheckpointStorage {
  name: string;
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): string;
  retrieveAgentCheckpoint(checkpointId: string): StoredAgentCheckpoint | null;
  listAgentCheckpoints(): AgentCheckpointListItem[];
  deleteCheckpoint(checkpointId: string): boolean;
  clearAllCheckpoints(): void;
  close(): void;
}
```

**Checkpoint Structure:**

Each checkpoint stored in localStorage has the following structure:

| Property  | Type   | Description                                              |
|-----------|--------|----------------------------------------------------------|
| id        | string | Unique identifier (UUID v4)                              |
| agentId   | string | The agent identifier                                     |
| agentType | string | The type of agent (e.g., 'developer', 'content-creator') |
| sessionId | string | Optional session identifier                              |
| name      | string | Checkpoint name                                          |
| state     | object | Agent state data                                         |
| createdAt | number | Timestamp of checkpoint creation                         |

**Storage Structure:**

- All checkpoints are stored in a single localStorage entry under the key: `{prefix}checkpoints`
- The storage contains an array of checkpoint objects
- All agents share the same storage when using the same prefix
- Use different prefixes to isolate data between applications

### Provider Documentation

This package implements a checkpoint storage provider for the TokenRing checkpoint system. Providers are registered with the `AgentCheckpointService` to provide storage implementations for agent checkpoints.

#### Provider Interface

All checkpoint storage providers must implement the `AgentCheckpointStorage` interface:

| Method                          | Description                                              | Returns                        |
|---------------------------------|----------------------------------------------------------|--------------------------------|
| `storeAgentCheckpoint`          | Store a new checkpoint and return its ID                 | `string` (UUID v4)             |
| `retrieveAgentCheckpoint`       | Retrieve a checkpoint by its ID                          | `StoredAgentCheckpoint \| null`|
| `listAgentCheckpoints`          | List all checkpoints ordered by creation time (newest)   | `AgentCheckpointListItem[]`    |
| `deleteCheckpoint`              | Delete a specific checkpoint                             | `boolean`                      |
| `clearAllCheckpoints`           | Clear all checkpoints from storage                       | `void`                         |
| `close`                         | Close any resources used by the provider                 | `void` (no-op for browser)     |

#### Browser-specific Extensions

The `BrowserStorageService` class extends the base interface with additional methods:

| Method                    | Description                           | Returns |
|---------------------------|---------------------------------------|---------|
| `clearAllCheckpoints`     | Clear all checkpoints from storage    | `void`  |

#### Provider Configuration

The browser provider configuration is validated using `BrowserStorageServiceConfigSchema`:

```typescript
const BrowserStorageServiceConfigSchema = z.object({
  storageKeyPrefix: z.string().default('tokenring:'),
}).default({ storageKeyPrefix: 'tokenring:' });
```

### RPC Endpoints

This package does not define any RPC endpoints.

### Usage Examples

#### Basic Storage Operations

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

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

const checkpointId = storage.storeAgentCheckpoint(checkpoint);
console.log('Stored checkpoint:', checkpointId);

// Retrieve a checkpoint
const retrieved = storage.retrieveAgentCheckpoint(checkpointId);
console.log('Retrieved checkpoint:', retrieved);

// List all checkpoints (newest first)
const allCheckpoints = storage.listAgentCheckpoints();
console.log('All checkpoints:', allCheckpoints);

// Delete a specific checkpoint
const deleted = storage.deleteCheckpoint(checkpointId);
console.log('Deleted:', deleted);
```

#### Custom Storage Prefix

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

// Use custom prefix for isolation between applications
const storage = new BrowserStorageService({
  storageKeyPrefix: 'myapp_v2_',
});

// This will store data under keys starting with 'myapp_v2_'
// Example: 'myapp_v2_checkpoints'
```

#### Multiple Agents with Isolation

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

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

const devId = devStorage.storeAgentCheckpoint(devCheckpoint);
const contentId = contentStorage.storeAgentCheckpoint(contentCheckpoint);

// Verify isolation - each storage only sees its own checkpoints
const devCheckpoints = devStorage.listAgentCheckpoints(); // 1 checkpoint
const contentCheckpoints = contentStorage.listAgentCheckpoints(); // 1 checkpoint

// Cross-storage retrieval returns null
const devInContent = contentStorage.retrieveAgentCheckpoint(devId); // null
const contentInDev = devStorage.retrieveAgentCheckpoint(contentId); // null
```

#### Integration with TokenRing

The plugin automatically registers the browser storage provider when configured:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import BrowserAgentStoragePlugin from '@tokenring-ai/browser-storage/plugin';

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

### Testing

The package includes comprehensive Vitest configuration for testing:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

#### Test Coverage

- **Unit Tests**: Unit tests for all storage operations
- **Integration Tests**: Integration tests for real-world usage scenarios
- **Error Handling**: Tests for error scenarios and edge cases
- **Performance**: Tests for rapid checkpoint creation and batch operations

#### Test Scenarios

The test suite includes scenarios for:

- **Constructor**: Default and custom prefix initialization
- **Storage Operations**: CRUD operations for checkpoints
- **Error Handling**: Quota exceeded, malformed JSON, localStorage unavailable
- **Integration**: Complete checkpoint lifecycle, data isolation
- **Performance**: Rapid checkpoint creation, batch operations
- **Real-world Workflows**: Development workflows, content creation workflows

### Dependencies

#### Production Dependencies

- `@tokenring-ai/app` (workspace:*) - TokenRing application framework
- `@tokenring-ai/checkpoint` (workspace:*) - Checkpoint management interface
- `zod` (^4.3.6) - Schema validation
- `uuid` (14.0.0) - Unique ID generation (UUID v4)

#### Development Dependencies

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

### Package Structure

```text
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

### Types and Exports

The package exports the following types and interfaces:

```typescript
// Main class (named export)
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

// Zod schema for validation
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

// Configuration type
import type { ParsedBrowserStorageConfig } from '@tokenring-ai/browser-storage';

// Checkpoint types from @tokenring-ai/checkpoint
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointStorage,
} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
```

#### Type Definitions

**NamedAgentCheckpoint:**

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  agentType?: string;
  sessionId?: string;
  name: string;
  state: Record<string, any>;
  createdAt?: number;
}
```

**StoredAgentCheckpoint:**

```typescript
interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}
```

**AgentCheckpointListItem:**

```typescript
interface AgentCheckpointListItem {
  id: string;
  name: string;
  agentId: string;
  agentType?: string;
  sessionId?: string;
  createdAt: number;
}
```

### Limitations

- **Browser-only**: Only works in browser environments with localStorage support
- **Storage Limits**: Limited by browser localStorage size constraints (typically 5-10MB per domain)
- **No Cross-device Sync**: Data is tied to specific browser/domain
- **No Server-side Persistence**: All data remains in the browser
- **Single Storage Entry**: All checkpoints stored in a single localStorage entry
- **No Transaction Support**: Operations are not atomic

### Error Handling and Recovery

The implementation includes robust error handling for common scenarios:

| Scenario                 | Behavior                                       |
|--------------------------|------------------------------------------------|
| Quota exceeded           | Error logged to console, checkpoint not stored |
| Malformed JSON           | Empty array returned, operation continues      |
| localStorage unavailable | Error logged to console, empty array returned  |
| Non-existent checkpoint  | Returns null (not an error)                    |

All errors are logged to the console but do not throw exceptions, allowing the application to continue operating gracefully.

### Related Components

- [Checkpoint Service](checkpoint.md) - Core checkpoint management with provider system
- [Agent System](agent.md) - Agent system with state management
- [App Framework](app.md) - TokenRing application framework

## License

MIT License - see `LICENSE` file for details.
