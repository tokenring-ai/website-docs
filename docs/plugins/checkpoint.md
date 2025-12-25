# @tokenring-ai/checkpoint Plugin

## Overview

The `@tokenring-ai/checkpoint` plugin provides persistent state management for agents within the Token Ring Agent framework. It enables agents to save snapshots of their current state and restore them later, supporting workflow interruption, experimentation, and session recovery. The plugin includes interactive chat commands, auto-checkpointing hooks, and RPC endpoints for programmatic access to checkpoint operations.

## Key Features

- **State Snapshots**: Save complete agent state including chat history, tools, hooks, and custom state
- **Multi-Provider Support**: Pluggable storage backends for checkpoint persistence
- **Interactive Browsing**: Tree-based UI for exploring and restoring checkpoints
- **Auto-Checkpointing**: Automatic checkpoint creation after agent input processing
- **Session History**: Browse checkpoints grouped by agent session
- **Named Checkpoints**: Label checkpoints for easy identification
- **RPC Endpoints**: Programmatic access to checkpoint operations via JSON-RPC
- **Agent Launching**: Create new agents from saved checkpoints
- **Configuration Validation**: Zod schema for configuration validation

## Core Components

### AgentCheckpointService

The main service for checkpoint operations. Automatically installed when the plugin is registered with an AgentTeam.

**Key Methods:**

```typescript
// Register a checkpoint storage provider
registerProvider(name: string, provider: AgentCheckpointProvider): void

// Get the currently active storage provider
getActiveProvider(): AgentCheckpointProvider

// Get the name of the active provider
getActiveProviderName(): string

// Switch to a different provider
setActiveProviderName(name: string): void

// List all registered provider names
getAvailableProviders(): string[]

// Save agent state to a checkpoint
saveAgentCheckpoint(name: string | undefined, agent: Agent): Promise<string>

// Restore agent from checkpoint
restoreAgentCheckpoint(id: string, agent: Agent): Promise<void>

// List all available checkpoints
listCheckpoints(): Promise<AgentCheckpointListItem[]>
```

**Example Usage:**

```typescript
import { AgentCheckpointService } from '@tokenring-ai/checkpoint';
import { Agent } from '@tokenring-ai/agent';

const checkpointService = agent.requireServiceByType(AgentCheckpointService);

// Save checkpoint
const checkpointId = await checkpointService.saveAgentCheckpoint(
  'Before Feature Implementation',
  agent
);

// Restore checkpoint
await checkpointService.restoreAgentCheckpoint(checkpointId, agent);

// List all checkpoints
const checkpoints = await checkpointService.listCheckpoints();
```

### AgentCheckpointProvider

Interface for implementing custom checkpoint storage backends.

```typescript
interface AgentCheckpointProvider {
  start?(): Promise<void>;
  storeCheckpoint(data: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}

// Checkpoint with name
interface NamedAgentCheckpoint extends AgentCheckpointData {
  name: string;
}

// Checkpoint with storage ID
interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

// Checkpoint listing item (minimal info)
type AgentCheckpointListItem = Omit<StoredAgentCheckpoint, "state" | "config">;
```

**Checkpoint State Contains:**
- `toolsEnabled` - Currently enabled tools
- `hooksEnabled` - Currently enabled hooks
- `agentState` - Custom agent state
- `chatMessages` - Conversation history
- `responseId` - Last response ID
- `agentId` - Agent identifier
- `createdAt` - Checkpoint creation timestamp

## Configuration

The plugin uses Zod schema validation for configuration. Configure in your `.tokenring/coder-config.mjs`:

```javascript
export default {
  checkpoint: {
    defaultProvider: "memory",  // or other provider name
    providers: {
      "memory": {
        // In-memory storage provider configuration
      },
      "database": {
        // Database storage provider configuration
        connectionString: "sqlite://./checkpoints.db"
      }
    }
  }
};
```

**Configuration Schema:**

```typescript
import { z } from "zod";

export const CheckpointPluginConfigSchema = z.object({
  defaultProvider: z.string(),
  providers: z.record(z.string(), z.any())
});
```

## Chat Commands

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
- Enabled tools and hooks
- Custom state keys
- Full checkpoint details (when retrievable)

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
      "agentState": {...},
      "chatMessages": [...],
      "toolsEnabled": [...],
      "hooksEnabled": [...]
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

const checkpointService = agent.requireServiceByType(AgentCheckpointService);

// Save checkpoint
const id1 = await checkpointService.saveAgentCheckpoint('Before Changes', agent);

// Make changes to agent state
// ... agent does work ...

// Save another checkpoint
const id2 = await checkpointService.saveAgentCheckpoint('After Changes', agent);

// List all checkpoints
const all = await checkpointService.listCheckpoints();
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

// Register provider
const checkpointService = agent.requireServiceByType(AgentCheckpointService);
checkpointService.registerProvider('custom', new CustomProvider());
checkpointService.setActiveProviderName('custom');
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

### Launching Agent from Checkpoint via RPC

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

### Installation with AgentTeam

The checkpoint plugin is automatically installed when registered with an AgentTeam:

```typescript
import checkpointPackage from '@tokenring-ai/checkpoint';

agentTeam.registerPackages([checkpointPackage]);
```

**Automatically Provides:**
- Chat commands (`/checkpoint`, `/history`)
- Auto-checkpoint hook
- `AgentCheckpointService` service instance
- RPC endpoints for remote operations
- Configuration schema validation

### Plugin Architecture

The plugin uses a modular architecture with automatic integration:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import {AgentCommandService, AgentLifecycleService} from "@tokenring-ai/agent";
import AgentCheckpointService from "./AgentCheckpointService.ts";
import chatCommands from "./chatCommands.ts";
import hooks from "./hooks.ts";
import {CheckpointPluginConfigSchema} from "./index.ts";
import packageJSON from "./package.json" with {type: "json"};
import checkpointRPC from "./rpc/checkpoint.ts";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(packageJSON.name, hooks)
    );
    app.addServices(new AgentCheckpointService());
    app.waitForService(WebHostService, webHostService => {
      webHostService.registerResource("Checkpoint RPC endpoint", new JsonRpcResource(app, checkpointRPC));
    });
  },

  start(app: TokenRingApp) {
    const config = app.getConfigSlice("checkpoint", CheckpointPluginConfigSchema);
    app.requireService(AgentCheckpointService).setActiveProviderName(config.defaultProvider);
  }
} satisfies TokenRingPlugin;
```

## Storage Provider Implementations

The plugin defines the interface; storage providers are implemented separately:

- **Memory Provider**: In-memory checkpoint storage (for testing/demo)
- **Database Provider**: Persistent storage in database
- **File Provider**: Checkpoint files in filesystem
- **Custom Providers**: Implement `AgentCheckpointProvider` interface

## Best Practices

1. **Regular Checkpoints**: Use auto-checkpointing for frequent automatic saves
2. **Named Checkpoints**: Create named checkpoints at logical decision points
3. **Storage Selection**: Choose appropriate provider for your use case:
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