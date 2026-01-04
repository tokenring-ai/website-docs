# @tokenring-ai/checkpoint Plugin

## Overview

The `@tokenring-ai/checkpoint` plugin provides persistent state management for agents within the Token Ring Agent framework. It enables agents to save snapshots of their current state and restore them later, supporting workflow interruption, experimentation, and session recovery. The plugin includes interactive chat commands, auto-checkpointing hooks, and RPC endpoints for programmatic access to checkpoint operations.

## Key Features

- **State Snapshots**: Save complete agent state including chat history, command history, hooks, events, and cost tracking
- **Pluggable Storage**: Custom storage backends for checkpoint persistence via `setCheckpointProvider`
- **Interactive Browsing**: Tree-based UI for exploring and restoring checkpoints
- **Auto-Checkpointing**: Automatic checkpoint creation after agent input processing
- **Session History**: Browse checkpoints grouped by agent session
- **Named Checkpoints**: Label checkpoints for easy identification
- **RPC Endpoints**: Programmatic access to checkpoint operations via JSON-RPC
- **Agent Launching**: Create new agents from saved checkpoints
- **Configuration Validation**: Zod schema for configuration validation

## Core Components

### AgentCheckpointService

The main service for checkpoint operations. Automatically installed when the plugin is registered with the Token Ring app.

**Key Methods:**

```typescript
// Set the checkpoint storage provider
setCheckpointProvider(provider: AgentCheckpointProvider): void

// Save agent state to a checkpoint
saveAgentCheckpoint(name: string, agent: Agent): Promise<string>

// Restore agent from checkpoint
restoreAgentCheckpoint(id: string, agent: Agent): Promise<void>

// List all available checkpoints
listCheckpoints(agent: Agent): Promise<AgentCheckpointListItem[]>
```

**Example Usage:**

```typescript
import { AgentCheckpointService } from '@tokenring-ai/checkpoint';
import { Agent } from '@tokenring-ai/agent';

// Create a memory provider
const memoryProvider = new MemoryProvider();

const checkpointService = agent.requireServiceByType(AgentCheckpointService);
checkpointService.setCheckpointProvider(memoryProvider);

// Save checkpoint
const checkpointId = await checkpointService.saveAgentCheckpoint('Before Feature Implementation', agent);

// Restore checkpoint
await checkpointService.restoreAgentCheckpoint(checkpointId, agent);

// List all checkpoints
const checkpoints = await checkpointService.listCheckpoints(agent);
```

### AgentCheckpointProvider Interface

The storage provider interface that users must implement for custom storage backends.

```typescript
export interface AgentCheckpointProvider {
  // Save checkpoint and return its ID
  storeCheckpoint(data: NamedAgentCheckpoint): Promise<string>;

  // Retrieve checkpoint by ID
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;

  // List all stored checkpoints (without state data)
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

**Data Structures:**

```typescript
// Checkpoint with name
export interface NamedAgentCheckpoint extends AgentCheckpointData {
  name: string;
}

// Checkpoint with storage ID
export interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

// Checkpoint listing item (minimal info)
export type AgentCheckpointListItem = Omit<StoredAgentCheckpoint, "state" | "config">;
```

**Checkpoint State Contains:**

- `AgentEventState` - Agent event state (busyWith, events, idle)
- `CommandHistoryState` - Command history
- `CostTrackingState` - Cost tracking information
- `HooksState` - Enabled hooks
- Additional agent-specific state data

## Configuration

The checkpoint plugin requires configuration for the checkpoint storage provider. The configuration is defined under the `checkpoint` key in your application's configuration file (e.g., `.tokenring/coder-config.mjs`).

**Configuration Schema:**

```typescript
import { z } from "zod";

export const CheckpointConfigSchema = z.object({
  provider: z.looseObject({
    type: z.string()
  })
});
```

**Example Configuration:**

```javascript
export default {
  checkpoint: {
    provider: {
      type: "memory",
      // Additional provider-specific properties can be included here
    }
  }
};
```

**Important Note:**

The checkpoint plugin does not automatically create storage providers based on configuration. Users must implement their own storage providers by implementing the `AgentCheckpointProvider` interface and set it using the `setCheckpointProvider` method of the `AgentCheckpointService`.

## Storage Provider Implementations

The checkpoint plugin defines the `AgentCheckpointProvider` interface, but does not include built-in storage providers. Users must implement their own storage providers.

**Example Implementation: Memory Provider**

```typescript
import type { AgentCheckpointProvider, NamedAgentCheckpoint, StoredAgentCheckpoint, AgentCheckpointListItem } from '@tokenring-ai/checkpoint';

class MemoryProvider implements AgentCheckpointProvider {
  private checkpoints = new Map<string, StoredAgentCheckpoint>();

  async storeCheckpoint(data: NamedAgentCheckpoint): Promise<string> {
    const id = crypto.randomUUID();
    const checkpoint = {
      ...data,
      id,
    };
    this.checkpoints.set(id, checkpoint);
    return id;
  }

  async retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  async listCheckpoints(): Promise<AgentCheckpointListItem[]> {
    return Array.from(this.checkpoints.values()).map(cp => ({
      id: cp.id,
      name: cp.name,
      agentId: cp.agentId,
      createdAt: cp.createdAt
    }));
  }
}
```

**Database Provider Example** (conceptual):

```typescript
class DatabaseProvider implements AgentCheckpointProvider {
  constructor(private connectionString: string) {}

  async storeCheckpoint(data: NamedAgentCheckpoint): Promise<string> {
    // Save to database and return ID
  }

  async retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
    // Retrieve from database
  }

  async listCheckpoints(): Promise<AgentCheckpointListItem[]> {
    // Query database for checkpoint listings
  }
}
```

## Commands

### `/checkpoint`

Manage agent checkpoints - create, restore, or browse with interactive tree selection.

**Syntax:**
```
/checkpoint [action] [args...]
```

**Actions:**

#### `create [label]`

Create a checkpoint of the current agent state with an optional label.

```
/checkpoint create
/checkpoint create "My Important Fix"
```

#### `restore <id>`

Restore agent state from a specific checkpoint by ID.

```
/checkpoint restore abc123def456
```

#### `list` (default)

Show interactive tree selection of all checkpoints, grouped by date. Select one to restore.

```
/checkpoint list
/checkpoint              # Same as list
```

**Examples:**

```
/checkpoint create              # Create with default label
/checkpoint create "Bug Fix"    # Create with custom label
/checkpoint restore xyz789      # Restore by ID
/checkpoint list                # Browse and restore interactively
```

**Output:**
- Shows checkpoint ID when created
- Displays grouped checkpoints by date with timestamps
- Indicates most recent checkpoints first
- Interactive tree selection for easy navigation

### `/history`

Browse and view checkpoint history grouped by agent session.

**Syntax:**
```
/history
```

Shows an interactive tree selection where checkpoints are grouped by:

1. Agent ID (session)
2. Individual checkpoints within each agent (sorted by creation time, newest first)

**Display Information:**

For each selected checkpoint:
- Name and creation timestamp
- Agent ID
- Full checkpoint details including state data (when retrievable)

## Hooks

### `autoCheckpoint`

Automatically creates a checkpoint after each agent input is processed. Enabled by default when the plugin is installed.

**Hook Points:**
- `afterAgentInputComplete` - Triggered after agent successfully processes input
- `beforeChatCompletion` - Triggered before chat response is generated

**Behavior:**
- Uses the input message as the checkpoint label
- Runs silently without interrupting workflow
- Can be disabled via agent hook management

**Configuration:**

```typescript
// Disable auto-checkpointing
agent.hooks.disableItems("@tokenring-ai/checkpoint/autoCheckpoint");

// Re-enable auto-checkpointing
agent.hooks.enableItems("@tokenring-ai/checkpoint/autoCheckpoint");
```

## RPC API

The plugin provides JSON-RPC endpoints for remote checkpoint operations.

**Endpoint:** `/rpc/checkpoint`

### `listCheckpoints`

Query all available checkpoints without state data.

**Request:**
```json
{
  "method": "listCheckpoints",
  "params": {}
}
```

**Response:**
```json
{
  "result": [
    {
      "id": "checkpoint-123",
      "name": "Before Feature Implementation",
      "agentId": "agent-456",
      "createdAt": 1640995200000
    }
  ]
}
```

### `getCheckpoint`

Retrieve a specific checkpoint with full state data.

**Request:**
```json
{
  "method": "getCheckpoint",
  "params": {
    "id": "checkpoint-123"
  }
}
```

**Response:**
```json
{
  "result": {
    "id": "checkpoint-123",
    "name": "Before Feature Implementation",
    "agentId": "agent-456",
    "createdAt": 1640995200000,
    "state": {
      "AgentEventState": {...},
      "CommandHistoryState": {...},
      "CostTrackingState": {...},
      "HooksState": {...}
    }
  }
}
```

### `launchAgentFromCheckpoint`

Create a new agent from a checkpoint.

**Request:**
```json
{
  "method": "launchAgentFromCheckpoint",
  "params": {
    "checkpointId": "checkpoint-123",
    "headless": false
  }
}
```

**Response:**
```json
{
  "result": {
    "agentId": "agent-789",
    "agentName": "Restored Agent",
    "agentType": "default"
  }
}
```

## Usage Examples

### Basic Checkpoint Workflow

```typescript
import { AgentCheckpointService } from '@tokenring-ai/checkpoint';
import { Agent } from '@tokenring-ai/agent';

// Create a memory provider
const memoryProvider = new MemoryProvider();

const checkpointService = agent.requireServiceByType(AgentCheckpointService);
checkpointService.setCheckpointProvider(memoryProvider);

// Save checkpoint
const id1 = await checkpointService.saveAgentCheckpoint('Before Changes', agent);

// Make changes to agent state
// ... agent does work ...

// Save another checkpoint
const id2 = await checkpointService.saveAgentCheckpoint('After Changes', agent);

// List all checkpoints
const all = await checkpointService.listCheckpoints(agent);
console.log(`Total checkpoints: ${all.length}`);

// Restore from earlier checkpoint
await checkpointService.restoreAgentCheckpoint(id1, agent);
```

### Custom Storage Provider

```typescript
import type { AgentCheckpointProvider, NamedAgentCheckpoint, StoredAgentCheckpoint, AgentCheckpointListItem } from '@tokenring-ai/checkpoint';

class CustomProvider implements AgentCheckpointProvider {
  private checkpoints = new Map<string, StoredAgentCheckpoint>();

  async storeCheckpoint(data: NamedAgentCheckpoint): Promise<string> {
    const id = crypto.randomUUID();
    this.checkpoints.set(id, {
      ...data,
      id,
    });
    return id;
  }

  async retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  async listCheckpoints(): Promise<AgentCheckpointListItem[]> {
    return Array.from(this.checkpoints.values()).map(cp => ({
      id: cp.id,
      name: cp.name,
      agentId: cp.agentId,
      createdAt: cp.createdAt
    }));
  }
}

// Register provider
const checkpointService = agent.requireServiceByType(AgentCheckpointService);
checkpointService.setCheckpointProvider(new CustomProvider());
```

### Conditional Checkpointing

```typescript
// Disable auto-checkpointing for certain operations
agent.hooks.disableItems("@tokenring-ai/checkpoint/autoCheckpoint");

// Do work without automatic checkpoints
// ...

// Re-enable auto-checkpointing
agent.hooks.enableItems("@tokenring-ai/checkpoint/autoCheckpoint");

// Save a specific checkpoint manually
const id = await service.saveAgentCheckpoint('Critical State', agent);
```

### RPC Usage

```typescript
// Using the RPC endpoint directly
const response = await fetch('/rpc/checkpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'listCheckpoints',
    params: {}
  })
});

const checkpoints = await response.json();
```

## Package Integration

### Installation with TokenRingApp

The checkpoint plugin is installed by adding it to your Token Ring application:

```typescript
import checkpointPackage from '@tokenring-ai/checkpoint';

const app = new TokenRingApp();
app.registerPackages([checkpointPackage]);
```

After installation, configure the storage provider:

```typescript
const checkpointService = app.requireService(AgentCheckpointService);
checkpointService.setCheckpointProvider(new MemoryProvider());
```

**Automatically Provides:**
- Chat commands (`/checkpoint`, `/history`)
- Auto-checkpoint hook
- `AgentCheckpointService` service instance
- RPC endpoints for remote operations
- Configuration schema validation

### Plugin Architecture

The plugin uses a modular architecture for automatic integration:

```typescript
import {AgentCommandService, AgentLifecycleService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {WebHostService} from "@tokenring-ai/web-host";
import JsonRpcResource from "@tokenring-ai/web-host/JsonRpcResource";

import {z} from "zod";
import AgentCheckpointService from "./AgentCheckpointService.ts";
import chatCommands from "./chatCommands.ts";
import hooks from "./hooks.ts";
import {CheckpointConfigSchema} from "./schema.ts";
import packageJSON from "./package.json" with {type: "json"};
import checkpointRPC from "./rpc/checkpoint.ts";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const checkpointService = new AgentCheckpointService(config.checkpoint);
    app.addServices(checkpointService);

    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(packageJSON.name, hooks)
    );
    app.waitForService(WebHostService, webHostService => {
      webHostService.registerResource("Checkpoint RPC endpoint", new JsonRpcResource(app, checkpointRPC));
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Best Practices

1. **Regular Checkpoints**: Use auto-checkpointing for frequent automatic saves
2. **Named Checkpoints**: Create named checkpoints at logical decision points
3. **Storage Selection**: Implement appropriate provider for your use case:
   - Memory for testing/experimentation
   - Database for production deployments
4. **Cleanup**: Periodically list and remove old checkpoints to manage storage
5. **Error Handling**: Always catch restore errors for graceful degradation
6. **RPC Usage**: Use RPC endpoints for remote checkpoint management and agent spawning

## Error Handling

```typescript
try {
  await checkpointService.restoreAgentCheckpoint(id, agent);
  agent.infoLine(`Checkpoint ${id} restored`);
} catch (error) {
  agent.errorLine(`Failed to restore checkpoint: ${error}`);
  // Agent state remains unchanged
}
```

## Testing

```bash
vitest run                  # Run tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

## Package Details

- **Name**: @tokenring-ai/checkpoint
- **Version**: 0.2.0
- **License**: MIT
- **Dependencies**: @tokenring-ai/app, @tokenring-ai/chat, @tokenring-ai/agent, @tokenring-ai/utility, @tokenring-ai/web-host
- **Dev Dependencies**: typescript, vitest

## License

MIT License - see LICENSE file for details.

## Implementation Note

The checkpoint plugin does not include built-in storage providers. Users must implement their own storage providers by implementing the `AgentCheckpointProvider` interface and set it using the `setCheckpointProvider` method of the `AgentCheckpointService`.
