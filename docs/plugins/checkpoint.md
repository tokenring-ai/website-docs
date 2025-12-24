# Checkpoint Plugin

Checkpoint service for storing Agent Checkpoints with a storage provider.

## Overview

The `@tokenring-ai/checkpoint` package provides persistent state management for agents within the Token Ring Agent framework. It enables agents to save snapshots of their current state and restore them later, supporting workflow interruption, experimentation, and session recovery. The package includes interactive chat commands, auto-checkpointing hooks, and RPC endpoints for programmatic access.

## Key Features

- **State Snapshots**: Save complete agent state including chat history, tools, hooks, and custom state
- **Multi-Provider Support**: Pluggable storage backends for checkpoint persistence
- **Interactive Browsing**: Tree-based UI for exploring and restoring checkpoints
- **Auto-Checkpointing**: Automatic checkpoint creation after agent input processing
- **Session History**: Browse checkpoints grouped by agent session
- **Named Checkpoints**: Label checkpoints for easy identification
- **RPC Endpoints**: Programmatic access to checkpoint operations via JSON-RPC
- **Agent Launching**: Create new agents from saved checkpoints

## Core Components

### AgentCheckpointService

Service for managing agent checkpoints. Automatically installed when the package is registered with an AgentTeam.

**Key Methods:**
- `registerProvider(name, provider)` - Register a checkpoint storage provider
- `getActiveProvider()` - Get the currently active storage provider
- `getActiveProviderName()` - Get the name of the active provider
- `setActiveProviderName(name)` - Switch to a different provider
- `getAvailableProviders()` - List all registered provider names
- `saveAgentCheckpoint(name, agent)` - Save agent state to a checkpoint
- `restoreAgentCheckpoint(id, agent)` - Restore agent from checkpoint
- `listCheckpoints()` - List all available checkpoints
- `launchAgentFromCheckpoint(app, checkpoint, options)` - Create new agent from checkpoint

### AgentCheckpointProvider

Interface for implementing custom checkpoint storage backends.

**Required Methods:**
- `storeCheckpoint(data: NamedAgentCheckpoint): Promise<string>` - Save checkpoint and return its ID
- `retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>` - Retrieve checkpoint by ID
- `listCheckpoints(): Promise<AgentCheckpointListItem[]>` - List all stored checkpoints (without state data)

**Data Structures:**

```typescript
// Checkpoint with name
interface NamedAgentCheckpoint extends AgentCheckpointData {
  name: string;
}

// Checkpoint with storage ID
interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

// Checkpoint state contains:
// - toolsEnabled: Currently enabled tools
// - hooksEnabled: Currently enabled hooks
// - agentState: Custom agent state
// - chatMessages: Conversation history
// - responseId: Last response ID
// - agentId: Agent identifier
// - createdAt: Checkpoint creation timestamp
```

## Configuration

Configure the checkpoint package in your `.tokenring/coder-config.mjs`:

```javascript
export default {
  checkpoint: {
    defaultProvider: "memory",  // or other provider name
    providers: {
      "memory": {
        // In-memory storage provider
      },
      "database": {
        // Database storage provider
        connectionString: "sqlite://./checkpoints.db"
      }
    }
  }
};
```

## Commands

### `/checkpoint`

Manage agent checkpoints - create, restore, or browse with interactive tree selection.

**Actions:**
- `create [label]` - Create a checkpoint with optional label
- `restore <id>` - Restore agent state from checkpoint ID
- `list` (default) - Browse checkpoints interactively grouped by date

**Examples:**
```
/checkpoint create
/checkpoint create "Bug Fix"
/checkpoint restore xyz789
/checkpoint list
/checkpoint              # Same as list
```

### `/history`

Browse and view checkpoint history grouped by agent session.

Shows an interactive tree selection where checkpoints are grouped by agent ID and sorted by creation time.

## Hooks

### `autoCheckpoint`

Automatically creates a checkpoint after each agent input is processed.

- **Hook Point**: `afterAgentInputComplete` and `beforeChatCompletion`
- **Behavior**: Triggered after agent successfully processes input, uses input message as checkpoint label
- **Enabled by default** when the package is installed

**Disable auto-checkpointing:**
```typescript
agent.hooks.disableItems("@tokenring-ai/checkpoint/autoCheckpoint");
```

**Re-enable auto-checkpointing:**
```typescript
agent.hooks.enableItems("@tokenring-ai/checkpoint/autoCheckpoint");
```

## RPC Endpoints

The plugin provides JSON-RPC endpoints for programmatic access to checkpoint operations.

**Endpoints:**
- `/rpc/checkpoint` - Main checkpoint RPC endpoint

**Available Methods:**

#### `listCheckpoints()`
- **Input**: Empty object
- **Output**: Array of checkpoint metadata (id, name, agentId, createdAt)
- **Description**: List all available checkpoints

#### `getCheckpoint({ id })`
- **Input**: `{ id: string }`
- **Output**: Checkpoint data or null
- **Description**: Retrieve full checkpoint data by ID

#### `launchAgentFromCheckpoint({ checkpointId, headless })`
- **Input**: `{ checkpointId: string, headless: boolean }` (headless defaults to false)
- **Output**: `{ agentId, agentName, agentType }`
- **Description**: Launch a new agent from a saved checkpoint

## Usage Examples

### Basic Checkpoint Workflow

```typescript
import { AgentCheckpointService } from '@tokenring-ai/checkpoint';

const checkpointService = agent.requireServiceByType(AgentCheckpointService);

// Save checkpoint
const id1 = await checkpointService.saveAgentCheckpoint('Before Changes', agent);

// Make changes to agent state
// ... agent does work ...

// Save another checkpoint
const id2 = await checkpointService.saveAgentCheckpoint('After Changes', agent);

// List all checkpoints
const all = await checkpointService.listCheckpoints();

// Restore from earlier checkpoint
await checkpointService.restoreAgentCheckpoint(id1, agent);
```

### Launching Agent from Checkpoint via RPC

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { createJsonRPCEndpoint } from '@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint';

// In your web application:
const app = new TokenRingApp(config);
const checkpointRpc = createJsonRPCEndpoint(CheckpointRpcSchema, {
  async launchAgentFromCheckpoint(args, app) {
    const checkpointService = app.requireService(AgentCheckpointService);
    const agentManager = app.requireService(AgentManager);
    
    const checkpoint = await checkpointService.getActiveProvider().retrieveCheckpoint(args.checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${args.checkpointId} not found`);
    }
    
    const agent = await agentManager.spawnAgentFromCheckpoint(app, checkpoint, { headless: args.headless });
    return {
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.config.type,
    };
  }
});

// Call via RPC:
const result = await app.rpcClient.call('checkpoint.launchAgentFromCheckpoint', {
  checkpointId: 'abc123',
  headless: true
});
```

### Custom Storage Provider

```typescript
import type { AgentCheckpointProvider } from '@tokenring-ai/checkpoint';

class CustomProvider implements AgentCheckpointProvider {
  private checkpoints = new Map();

  async storeCheckpoint(data) {
    const id = crypto.randomUUID();
    this.checkpoints.set(id, { ...data, id });
    return id;
  }

  async retrieveCheckpoint(id) {
    return this.checkpoints.get(id) || null;
  }

  async listCheckpoints() {
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

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/web-host`: Web hosting and RPC infrastructure
- `@tokenring-ai/chat`: Chat command system
- Storage provider implementations (built-in and custom)