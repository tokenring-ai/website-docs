# @tokenring-ai/checkpoint

The `@tokenring-ai/checkpoint` package provides persistent state management for both agents and applications within the Token Ring Agent framework. It enables saving snapshots of current state and restoring them later, supporting workflow interruption, experimentation, and session recovery. The package includes interactive chat commands, auto-checkpointing hooks, and RPC endpoints for programmatic access to checkpoint operations.

## Overview

The checkpoint package provides two types of checkpoint services:

1. **AgentCheckpointService**: Manages checkpoints for individual agents
2. **AppCheckpointService**: Manages checkpoints for the entire application

## Key Features

- **Dual Checkpoint Types**: Supports both Agent Checkpoints and App Checkpoints
- **State Snapshots**: Save complete agent and application state including chat history, tools, hooks, and custom state
- **Storage Provider Architecture**: Configurable checkpoint storage providers via `setCheckpointProvider`
- **Interactive Browsing**: Tree-based UI for exploring and restoring checkpoints
- **Auto-Checkpointing**: Automatic checkpoint creation after agent input processing
- **Session History**: Browse checkpoints grouped by agent ID or date
- **Named Checkpoints**: Label checkpoints for easy identification
- **RPC API**: JSON-RPC endpoints for remote checkpoint operations
- **Plugin Architecture**: Automatic integration with TokenRing applications
- **State Restoration**: Automatic restoration of previous app state on startup (configurable)

## User Guide

### Chat Commands

#### Agent Checkpoint Commands

| Command | Description |
|---------|-------------|
| `/agent checkpoint create [label]` | Create a checkpoint of the current agent state with an optional label |
| `/agent checkpoint restore <id>` | Restore agent state from a specific checkpoint by ID |
| `/agent checkpoint list` | Open an interactive tree browser to select and restore a checkpoint |
| `/agent checkpoint history` | Browse checkpoint history grouped by agent ID |

#### App Checkpoint Commands

| Command | Description |
|---------|-------------|
| `/app checkpoint create` | Create a checkpoint of the current app state |
| `/app checkpoint list` | Open an interactive tree browser to select and restore an app checkpoint |
| `/app checkpoint history` | Browse app checkpoint history grouped by date |

### Tools

This package does not define any tools.

### Configuration

Configure the checkpoint package using the plugin configuration:

```typescript
import checkpointPlugin from '@tokenring-ai/checkpoint';

export default {
  plugins: [checkpointPlugin],
  checkpoint: {
    app: {
      restorePreviousState: false,  // Restore latest app checkpoint on startup
      projectDirectory: '/path/to/project',  // Required: project directory path
      hostname: 'localhost'  // Optional, defaults to current hostname
    },
    agent: {}  // Agent checkpoint configuration (currently empty)
  }
} satisfies TokenRingConfig;
```

#### Configuration Schema

The package uses the `CheckpointConfigSchema` which defines configuration for both app and agent checkpointing:

```typescript
import { CheckpointConfigSchema } from '@tokenring-ai/checkpoint';

// Schema structure:
// CheckpointConfigSchema = {
//   app: AppCheckpointServiceSchema,
//   agent: AgentCheckpointServiceSchema
// }

// AppCheckpointServiceSchema:
// {
//   restorePreviousState: boolean (default: false)
//   projectDirectory: string (required)
//   hostname: string (default: current hostname)
// }

// AgentCheckpointServiceSchema:
// {} (empty configuration)

// Schema validation example
const validConfig = CheckpointConfigSchema.parse({
  app: {
    restorePreviousState: true,
    projectDirectory: '/path/to/project',
    hostname: 'localhost'
  },
  agent: {}
});
```

### Integration

The checkpoint plugin integrates with TokenRing applications by:

- Registering `AgentCheckpointService` and `AppCheckpointService`
- Adding agent checkpoint commands (`/agent checkpoint *`)
- Adding app checkpoint commands (`/app checkpoint *`)
- Installing the `autoCheckpoint` hook for automatic checkpointing
- Registering RPC endpoints at `/rpc/checkpoint`

### Best Practices

1. **Register Providers**: Always register checkpoint providers before using checkpoint features
2. **Named Checkpoints**: Create named checkpoints at logical decision points for agents
3. **Provider Selection**: Set appropriate providers for your use case:
   - Memory provider for testing/experimentation
   - Persistent provider (file system, database) for production
4. **Cleanup**: Periodically list and manage checkpoints to manage storage
5. **Error Handling**: Always catch restore errors for graceful degradation
6. **RPC Usage**: Use RPC endpoints for remote checkpoint management and agent spawning
7. **Auto-Checkpointing**: Enable auto-checkpointing for frequent automatic saves during development
8. **App State Restoration**: Enable `restorePreviousState` for applications that need session continuity

## Developer Reference

### Core Components

#### AgentCheckpointService

The main service for agent checkpoint operations. Automatically installed when the plugin is registered with the Token Ring app.

**Properties:**

- `name`: "AgentCheckpointService"
- `description`: "Persists agent state to a storage provider"
- `checkpointProvider`: The registered storage provider (nullable)
- `options`: Configuration options from schema (empty object)

**Key Methods:**

```typescript
// Set the checkpoint storage provider
setCheckpointProvider(provider: AgentCheckpointStorage): void

// Save agent state to a checkpoint
saveAgentCheckpoint(name: string, agent: Agent): Promise<string>

// Restore agent from checkpoint
restoreAgentCheckpoint(id: string, agent: Agent): Promise<void>

// List all available checkpoints (without state data)
listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>

// Retrieve a specific checkpoint with full state data
retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>

// Initialize and validate checkpoint provider
start(): void

// Attach service to an agent and enable auto-checkpoint hook
attach(agent: Agent, creationContext: AgentCreationContext): void
```

**Example Usage:**

```typescript
import AgentCheckpointService from '@tokenring-ai/checkpoint/AgentCheckpointService';
import Agent from '@tokenring-ai/agent/Agent';

// Get the checkpoint service from the agent
const checkpointService = agent.requireServiceByType(AgentCheckpointService);

// Set a custom provider (see Providers section below)
// checkpointService.setCheckpointProvider(myProvider);

// Save checkpoint
const checkpointId = await checkpointService.saveAgentCheckpoint('Before Feature Implementation', agent);

// Restore checkpoint
await checkpointService.restoreAgentCheckpoint(checkpointId, agent);

// List all checkpoints
const checkpoints = await checkpointService.listAgentCheckpoints();

// Retrieve full checkpoint with state
const fullCheckpoint = await checkpointService.retrieveAgentCheckpoint(checkpointId);
```

#### AppCheckpointService

Service for application-level checkpoint operations. Manages the state of the entire application including all agents.

**Properties:**

- `name`: "AppCheckpointService"
- `description`: "Persists app state to a storage provider"
- `checkpointProvider`: The registered storage provider (nullable)
- `options`: Configuration options including `restorePreviousState`, `projectDirectory`, and `hostname`

**Key Methods:**

```typescript
// Set the checkpoint storage provider
setCheckpointProvider(provider: AppCheckpointStorage): void

// Save current app state to a checkpoint
saveAppCheckpoint(): Promise<string>

// Restore app from checkpoint
restoreAppCheckpoint(id: string): Promise<void>

// List all available app checkpoints
listAppCheckpoints(): Promise<AppSessionListItem[]>

// Retrieve a specific app checkpoint with full state data
retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>

// Retrieve the latest app checkpoint
retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>

// Initialize and validate checkpoint provider, optionally restore previous state
start(): Promise<void>

// Save checkpoint on app stop
stop(): Promise<void>
```

**Example Usage:**

```typescript
import AppCheckpointService from '@tokenring-ai/checkpoint/AppCheckpointService';

// Get the checkpoint service from the app
const appCheckpointService = app.requireService(AppCheckpointService);

// Set a custom provider
// appCheckpointService.setCheckpointProvider(myProvider);

// Save app checkpoint
const checkpointId = await appCheckpointService.saveAppCheckpoint();

// Restore app from checkpoint
await appCheckpointService.restoreAppCheckpoint(checkpointId);

// List all app checkpoints
const checkpoints = await appCheckpointService.listAppCheckpoints();

// Retrieve full checkpoint with state
const fullCheckpoint = await appCheckpointService.retrieveAppCheckpoint(checkpointId);

// Retrieve latest checkpoint
const latest = await appCheckpointService.retrieveLatestAppCheckpoint();
```

### Services Reference

#### AgentCheckpointService Methods

Service implementation that manages agent checkpoint operations.

**Properties:**

- `name`: "AgentCheckpointService"
- `description`: "Persists agent state to a storage provider"
- `options`: Configuration options from schema (empty object)

##### setCheckpointProvider Agent

Sets the agent checkpoint storage provider.

```typescript
const service = agent.requireServiceByType(AgentCheckpointService);
service.setCheckpointProvider(myProvider);
```

##### saveAgentCheckpoint

Saves the current state of an agent to a checkpoint.

```typescript
const id = await service.saveAgentCheckpoint('My Checkpoint', agent);
// Returns: checkpoint ID
```

##### restoreAgentCheckpoint

Restores an agent's state from a checkpoint.

```typescript
await service.restoreAgentCheckpoint(checkpointId, agent);
```

##### listAgentCheckpoints

Lists all available agent checkpoints (without state data).

```typescript
const checkpoints = await service.listAgentCheckpoints();
// Returns: Array of checkpoint list items
```

##### retrieveAgentCheckpoint

Retrieves a specific agent checkpoint with full state data.

```typescript
const checkpoint = await service.retrieveAgentCheckpoint(checkpointId);
// Returns: Full checkpoint or null
```

##### start Agent

Initializes the checkpoint provider and validates it's registered.

```typescript
service.start();
// Throws error via app.serviceError if no provider is registered
```

##### attach

Attaches the service to an agent and adds checkpoint provider info to creation context.

```typescript
service.attach(agent, creationContext);
// Adds checkpoint provider info to creation context
```

#### AppCheckpointService Methods

Service implementation that manages application checkpoint operations.

**Properties:**

- `name`: "AppCheckpointService"
- `description`: "Persists app state to a storage provider"
- `options`: Configuration options from schema including `restorePreviousState`

##### setCheckpointProvider App

Sets the app checkpoint storage provider.

```typescript
const service = app.requireService(AppCheckpointService);
service.setCheckpointProvider(myProvider);
```

##### saveAppCheckpoint

Saves the current state of the application to a checkpoint.

```typescript
const id = await service.saveAppCheckpoint();
// Returns: checkpoint ID
```

##### restoreAppCheckpoint

Restores the application's state from a checkpoint.

```typescript
await service.restoreAppCheckpoint(checkpointId);
```

##### listAppCheckpoints

Lists all available app checkpoints (without state data).

```typescript
const checkpoints = await service.listAppCheckpoints();
// Returns: Array of checkpoint list items
```

##### retrieveAppCheckpoint

Retrieves a specific app checkpoint with full state data.

```typescript
const checkpoint = await service.retrieveAppCheckpoint(checkpointId);
// Returns: Full checkpoint or null
```

##### retrieveLatestAppCheckpoint

Retrieves the most recent app checkpoint.

```typescript
const latest = await service.retrieveLatestAppCheckpoint();
// Returns: Latest checkpoint or null
```

##### start App

Initializes the checkpoint provider and optionally restores previous state.

```typescript
await service.start();
// If restorePreviousState is true and provider exists, restores latest checkpoint
// Throws error via app.serviceError if no provider is registered
```

##### stop

Saves a checkpoint when the application stops.

```typescript
await service.stop();
// Saves current app state if provider is registered
```

### Storage Providers

#### AgentCheckpointStorage Interface

Interface for implementing custom agent checkpoint storage backends.

**Required Properties:**

##### Agent Provider Display Name

Display name for the storage provider.

```typescript
class MyProvider implements AgentCheckpointStorage {
  displayName = "My Custom Provider";
  // ... other methods
}
```

**Required Methods:**

##### storeAgentCheckpoint

Stores a checkpoint and returns its ID.

```typescript
async storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string> {
  const id = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Store data with id and createdAt...
  return id;
}
```

##### retrieveAgentCheckpoint Provider

Retrieves a checkpoint by ID.

```typescript
async retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
  // Retrieve and return checkpoint with full state or null
}
```

##### listAgentCheckpoints Provider

Lists all stored checkpoints (without state data).

```typescript
async listAgentCheckpoints(): Promise<AgentCheckpointListItem[]> {
  // Return array of checkpoint list items (id, name, agentId, createdAt)
}
```

**Data Structures:**

```typescript
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem
} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';

// Checkpoint with name (extends AgentCheckpointData from agent package)
interface NamedAgentCheckpoint extends AgentCheckpointData {
  name: string;
}

// Checkpoint with storage ID
interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

// Checkpoint listing item (minimal info, no state)
type AgentCheckpointListItem = Omit<StoredAgentCheckpoint, "state">;
```

**Checkpoint State Contains:**

The `AgentCheckpointData` (from `@tokenring-ai/agent/types`) includes:

- `agentState` - Custom agent state
- `chatMessages` - Conversation history
- `CommandHistoryState` - Command history
- `HooksState` - Enabled hooks
- `AgentEventState` - Agent event state
- `CostTrackingState` - Cost tracking information
- `TodoState` - Todo list state
- `AgentExecutionState` - Agent execution state
- `config` - Agent configuration
- `previousResponseId` - ID of the previous response

#### AppCheckpointStorage Interface

Interface for implementing custom app checkpoint storage backends.

**Required Properties:**

##### App Provider Display Name

Display name for the storage provider.

```typescript
class MyProvider implements AppCheckpointStorage {
  displayName = "My Custom Provider";
  // ... other methods
}
```

**Required Methods:**

##### storeAppCheckpoint

Stores a checkpoint and returns its ID.

```typescript
async storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string> {
  const id = `app-checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Store data with id and createdAt...
  return id;
}
```

##### retrieveAppCheckpoint Provider

Retrieves a checkpoint by ID.

```typescript
async retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null> {
  // Retrieve and return checkpoint with full state or null
}
```

##### listAppCheckpoints Provider

Lists all stored checkpoints (without state data).

```typescript
async listAppCheckpoints(): Promise<AppSessionListItem[]> {
  // Return array of checkpoint list items (sessionId, createdAt, hostname, projectDirectory)
}
```

##### retrieveLatestAppCheckpoint Provider

Retrieves the most recent checkpoint.

```typescript
async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
  // Return the most recent checkpoint or null
}
```

**Data Structures:**

```typescript
import type {
  StoredAppCheckpoint,
  AppSessionListItem
} from '@tokenring-ai/checkpoint/AppCheckpointStorage';

// App checkpoint with storage ID
interface StoredAppCheckpoint extends AppSessionCheckpoint {
  id: string;
}

// App checkpoint listing item (minimal info, no state)
type AppSessionListItem = Omit<StoredAppCheckpoint, "state">;
```

**App Checkpoint State Contains:**

The `AppSessionCheckpoint` includes:

- `sessionId` - Unique session identifier
- `hostname` - Hostname where the app is running
- `projectDirectory` - Current project directory
- `createdAt` - Timestamp of checkpoint creation
- `state` - Complete application state including all agents

#### Provider Registration

Set the checkpoint provider using `setCheckpointProvider`:

```typescript
import type { AgentCheckpointStorage } from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
import type { AppCheckpointStorage } from '@tokenring-ai/checkpoint/AppCheckpointStorage';

// Agent checkpoint provider
class AgentProvider implements AgentCheckpointStorage {
  displayName = "Agent Provider";

  async storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string> {
    const id = crypto.randomUUID();
    // Store data...
    return id;
  }

  async retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
    // Retrieve checkpoint
  }

  async listAgentCheckpoints(): Promise<AgentCheckpointListItem[]> {
    // List checkpoints
  }
}

// App checkpoint provider
class AppProvider implements AppCheckpointStorage {
  displayName = "App Provider";

  async storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string> {
    const id = crypto.randomUUID();
    // Store data...
    return id;
  }

  async retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null> {
    // Retrieve checkpoint
  }

  async listAppCheckpoints(): Promise<AppSessionListItem[]> {
    // List checkpoints
  }

  async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
    // Retrieve latest checkpoint
  }
}

// Set providers
const agentService = agent.requireServiceByType(AgentCheckpointService);
agentService.setCheckpointProvider(new AgentProvider());

const appService = app.requireService(AppCheckpointService);
appService.setCheckpointProvider(new AppProvider());
```

### RPC Endpoints

The plugin provides JSON-RPC endpoints for remote checkpoint operations.

**Endpoint:** `/rpc/checkpoint`

#### listCheckpoints RPC

Query all available agent checkpoints without state data.

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

#### getCheckpoint RPC

Retrieve a specific agent checkpoint with full state data.

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
      "agentState": {},
      "chatMessages": [],
      "CommandHistoryState": {},
      "HooksState": {},
      "AgentEventState": {},
      "CostTrackingState": {},
      "TodoState": {},
      "AgentExecutionState": {},
      "config": {},
      "previousResponseId": "resp-789"
    }
  }
}
```

#### launchAgentFromCheckpoint RPC

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

### Hooks

#### autoCheckpoint Hook

Automatically creates a checkpoint after each agent input is processed. Enabled by default when the plugin is attached to an agent.

**Hook Points:**

- `AfterAgentInputHandled` - Triggered after agent successfully processes input

**Behavior:**

- Triggered after agent successfully processes input
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

**Hook Details:**

- **Name:** `autoCheckpoint`
- **Display Name:** `Checkpoint/Auto Checkpoint`
- **Description:** `Automatically saves agent checkpoints after input is handled`
- **Callback:** `AfterAgentInputHandled`

### State Management

The checkpoint service provides state management through:

- **Checkpoint Persistence**: Store and retrieve agent and app states
- **Provider Registration**: Configure storage backends
- **State Restoration**: Restore complete agent and app state from checkpoints
- **AppCheckpointState**: Manages agent checkpoint data for app-level checkpoints

#### AppCheckpointState

State slice that manages agent checkpoint data for application-level checkpoints.

**Serialization:**

```typescript
const serializationSchema = z.object({
  agentCheckpointData: z.array(AgentCheckpointSchema).default([]),
}).prefault({});
```

**Methods:**

- `serialize()`: Returns array of all agent checkpoints
- `deserialize(data)`: Spawns agents from checkpoint data

**Example:**

```typescript
import { AppCheckpointState } from '@tokenring-ai/checkpoint/state/appCheckpointState';

// The state slice is automatically initialized by AppCheckpointService
// It serializes all agent checkpoints when app state is saved
// It restores agents from checkpoints when app state is restored
```

State slices are managed by the agent's checkpoint mechanism, including:

- Agent execution state
- Command history state
- Hooks state
- Agent event state
- Cost tracking state
- Todo state
- Chat messages

### Usage Examples

#### Basic Agent Checkpoint Workflow

```typescript
import AgentCheckpointService from '@tokenring-ai/checkpoint/AgentCheckpointService';

const service = agent.requireServiceByType(AgentCheckpointService);

// Save checkpoint
const id1 = await service.saveAgentCheckpoint('Before Changes', agent);

// Make changes to agent state
// ... agent does work ...

// Save another checkpoint
const id2 = await service.saveAgentCheckpoint('After Changes', agent);

// List all checkpoints
const all = await service.listAgentCheckpoints();
console.log(`Total checkpoints: ${all.length}`);

// Restore from earlier checkpoint
await service.restoreAgentCheckpoint(id1, agent);
```

#### Basic App Checkpoint Workflow

```typescript
import AppCheckpointService from '@tokenring-ai/checkpoint/AppCheckpointService';

const service = app.requireService(AppCheckpointService);

// Save checkpoint
const id1 = await service.saveAppCheckpoint();

// Make changes to app state
// ... app does work ...

// Save another checkpoint
const id2 = await service.saveAppCheckpoint();

// List all checkpoints
const all = await service.listAppCheckpoints();
console.log(`Total checkpoints: ${all.length}`);

// Restore from earlier checkpoint
await service.restoreAppCheckpoint(id1);
```

#### Custom Storage Provider

```typescript
import type { AgentCheckpointStorage } from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
import type { AppCheckpointStorage } from '@tokenring-ai/checkpoint/AppCheckpointStorage';

// Agent checkpoint provider
class CustomAgentProvider implements AgentCheckpointStorage {
  displayName = "Custom Memory Provider";
  private checkpoints = new Map<string, any>();

  async storeAgentCheckpoint(data: any): Promise<string> {
    const id = crypto.randomUUID();
    const stored = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    this.checkpoints.set(id, stored);
    return id;
  }

  async retrieveAgentCheckpoint(id: string): Promise<any | null> {
    return this.checkpoints.get(id) || null;
  }

  async listAgentCheckpoints(): Promise<any[]> {
    return Array.from(this.checkpoints.values()).map(cp => ({
      id: cp.id,
      name: cp.name,
      agentId: cp.agentId,
      createdAt: cp.createdAt
    }));
  }
}

// App checkpoint provider
class CustomAppProvider implements AppCheckpointStorage {
  displayName = "Custom App Memory Provider";
  private checkpoints = new Map<string, any>();

  async storeAppCheckpoint(data: any): Promise<string> {
    const id = crypto.randomUUID();
    const stored = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    this.checkpoints.set(id, stored);
    return id;
  }

  async retrieveAppCheckpoint(id: string): Promise<any | null> {
    return this.checkpoints.get(id) || null;
  }

  async listAppCheckpoints(): Promise<any[]> {
    return Array.from(this.checkpoints.values()).map(cp => ({
      sessionId: cp.sessionId,
      createdAt: cp.createdAt,
      hostname: cp.hostname,
      projectDirectory: cp.projectDirectory
    }));
  }

  async retrieveLatestAppCheckpoint(): Promise<any | null> {
    const checkpoints = Array.from(this.checkpoints.values());
    if (checkpoints.length === 0) return null;
    checkpoints.sort((a, b) => b.createdAt - a.createdAt);
    return checkpoints[0];
  }
}

// Set providers
const agentService = agent.requireServiceByType(AgentCheckpointService);
agentService.setCheckpointProvider(new CustomAgentProvider());

const appService = app.requireService(AppCheckpointService);
appService.setCheckpointProvider(new CustomAppProvider());
```

#### Conditional Checkpointing

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

#### RPC Usage

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

#### Launch Agent from Checkpoint via RPC

```typescript
// Launch a new agent from a checkpoint
const response = await fetch('/rpc/checkpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'launchAgentFromCheckpoint',
    params: {
      checkpointId: 'checkpoint-123',
      headless: false
    }
  })
});

const result = await response.json();
console.log(`Launched agent: ${result.agentId}`);
```

#### Auto-Restore App State on Startup

```javascript
// Configure app checkpoint service to restore previous state
export default {
  checkpoint: {
    app: {
      restorePreviousState: true,
      projectDirectory: '/path/to/project'
    }
  }
};

// AppCheckpointService will automatically:
// 1. Retrieve the latest checkpoint on startup
// 2. Restore the app state from that checkpoint
// 3. Save a checkpoint when the app stops
```

### Package Integration

#### Installation with TokenRingApp

The checkpoint plugin is automatically installed when registered:

```typescript
import checkpointPlugin from '@tokenring-ai/checkpoint';

export default {
  plugins: [checkpointPlugin]
} satisfies TokenRingPlugin;
```

**Automatically Provides:**

- Chat commands (`/agent checkpoint`, `/app checkpoint`)
- Auto-checkpoint hook
- `AgentCheckpointService` service instance
- `AppCheckpointService` service instance
- RPC endpoints for remote operations
- Configuration schema validation
- `AppCheckpointState` for app-level state management

#### Plugin Implementation

```typescript
import { AgentCommandService } from "@tokenring-ai/agent";
import { TokenRingPlugin } from "@tokenring-ai/app";
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import { RpcService } from "@tokenring-ai/rpc";

import { z } from "zod";
import AgentCheckpointService from "./AgentCheckpointService.ts";
import AppCheckpointService from "./AppCheckpointService.ts";
import agentCommands from "./commands.ts";
import hooks from "./hooks.ts";
import packageJSON from "./package.json" with { type: "json" };
import checkpointRPC from "./rpc/checkpoint.ts";
import { CheckpointConfigSchema } from "./schema.ts";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema
});

export default {
  name: packageJSON.name,
  displayName: "Checkpoint Service",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const agentCheckpointService = new AgentCheckpointService(app, config.checkpoint.agent);
    app.addServices(agentCheckpointService);

    const appCheckpointService = new AppCheckpointService(app, config.checkpoint.app);
    app.addServices(appCheckpointService);

    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(agentCommands)
    );
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(hooks)
    );
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(checkpointRPC);
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Storage Provider Implementations

The package defines the interfaces; storage providers are implemented by:

- Setting the provider directly via `setCheckpointProvider(provider)`
- Implementing the `AgentCheckpointStorage` or `AppCheckpointStorage` interface

**Example Agent Provider:**

```typescript
import type { AgentCheckpointStorage } from '@tokenring-ai/checkpoint/AgentCheckpointStorage';

class MemoryAgentCheckpointProvider implements AgentCheckpointStorage {
  displayName = "Memory Agent Provider";
  private checkpoints = new Map<string, any>();

  async storeAgentCheckpoint(data: any): Promise<string> {
    const id = crypto.randomUUID();
    this.checkpoints.set(id, { ...data, id, createdAt: Date.now() });
    return id;
  }

  async retrieveAgentCheckpoint(id: string) {
    return this.checkpoints.get(id) || null;
  }

  async listAgentCheckpoints() {
    return Array.from(this.checkpoints.values()).map(cp => ({
      id: cp.id,
      name: cp.name,
      agentId: cp.agentId,
      createdAt: cp.createdAt
    }));
  }
}
```

**Example App Provider:**

```typescript
import type { AppCheckpointStorage } from '@tokenring-ai/checkpoint/AppCheckpointStorage';

class MemoryAppCheckpointProvider implements AppCheckpointStorage {
  displayName = "Memory App Provider";
  private checkpoints = new Map<string, any>();

  async storeAppCheckpoint(data: any): Promise<string> {
    const id = crypto.randomUUID();
    this.checkpoints.set(id, { ...data, id, createdAt: Date.now() });
    return id;
  }

  async retrieveAppCheckpoint(id: string) {
    return this.checkpoints.get(id) || null;
  }

  async listAppCheckpoints() {
    return Array.from(this.checkpoints.values()).map(cp => ({
      sessionId: cp.sessionId,
      createdAt: cp.createdAt,
      hostname: cp.hostname,
      projectDirectory: cp.projectDirectory
    }));
  }

  async retrieveLatestAppCheckpoint() {
    const checkpoints = Array.from(this.checkpoints.values());
    if (checkpoints.length === 0) return null;
    checkpoints.sort((a, b) => b.createdAt - a.createdAt);
    return checkpoints[0];
  }
}
```

### Error Handling

```typescript
// Agent checkpoint error handling
try {
  await checkpointService.restoreAgentCheckpoint(id, agent);
  agent.infoMessage(`Checkpoint ${id} restored`);
} catch (error) {
  agent.errorMessage(`Failed to restore checkpoint: ${error}`);
  // Agent state remains unchanged
}

// Check if provider is registered
if (!checkpointService.checkpointProvider) {
  agent.warningMessage("No checkpoint provider registered");
}

// App checkpoint error handling
try {
  await appCheckpointService.restoreAppCheckpoint(id);
  console.log(`App checkpoint ${id} restored`);
} catch (error) {
  console.error(`Failed to restore app checkpoint: ${error}`);
  // App state remains unchanged
}

// Check if provider is registered
if (!appCheckpointService.checkpointProvider) {
  console.warn("No app checkpoint provider registered");
}
```

### Testing

```bash
bun run test                  # Run tests
bun run test:watch            # Watch mode
bun run test:coverage         # Coverage report
```

### Dependencies

#### Production Dependencies

- `@tokenring-ai/app` - Application framework
- `@tokenring-ai/agent` - Agent framework
- `@tokenring-ai/lifecycle` - Lifecycle hooks
- `@tokenring-ai/utility` - Utility functions
- `@tokenring-ai/rpc` - RPC framework
- `zod` - Schema validation

#### Development Dependencies

- `typescript` - Type checking
- `vitest` - Testing framework

### Package Details

- **Name**: @tokenring-ai/checkpoint
- **Version**: 0.2.0
- **License**: MIT
- **Dependencies**: @tokenring-ai/app, @tokenring-ai/agent, @tokenring-ai/lifecycle, @tokenring-ai/utility, @tokenring-ai/rpc, zod
- **Dev Dependencies**: typescript, vitest

### Related Components

- `@tokenring-ai/agent` - Core agent framework
- `@tokenring-ai/app` - Application framework
- `@tokenring-ai/rpc` - RPC framework
- `@tokenring-ai/lifecycle` - Lifecycle hooks

### Package Structure

```text
pkg/checkpoint/
├── AgentCheckpointStorage.ts      # Agent storage interface and data types
├── AgentCheckpointService.ts      # Agent service implementation
├── AppCheckpointStorage.ts        # App storage interface and data types
├── AppCheckpointService.ts        # App service implementation
├── schema.ts                      # Configuration schema definitions
├── plugin.ts                      # Plugin registration
├── index.ts                       # Package exports
├── commands.ts                    # Command definitions
├── hooks.ts                       # Hook definitions
├── hooks/
│   └── autoCheckpoint.ts         # Auto-checkpointing hook
├── commands/
│   ├── agent-checkpoint/
│   │   ├── create.ts              # Create agent checkpoint command
│   │   ├── restore.ts             # Restore agent checkpoint command
│   │   ├── list.ts                # List agent checkpoints command
│   │   └── history.ts             # Agent history browsing command
│   └── app-checkpoint/
│       ├── create.ts              # Create app checkpoint command
│       ├── list.ts                # List app checkpoints command
│       └── history.ts             # App history browsing command
├── rpc/
│   ├── checkpoint.ts              # RPC endpoint implementation
│   └── schema.ts                  # RPC schema definition
├── state/
│   └── appCheckpointState.ts     # App checkpoint state management
├── README.md                      # Package README
└── package.json
```

### Exports

The package exports the following:

```typescript
// Main services
import AgentCheckpointService from '@tokenring-ai/checkpoint/AgentCheckpointService';
import AppCheckpointService from '@tokenring-ai/checkpoint/AppCheckpointService';

// Agent storage interface and types
import type { AgentCheckpointStorage } from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem
} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';

// App storage interface and types
import type { AppCheckpointStorage } from '@tokenring-ai/checkpoint/AppCheckpointStorage';
import type {
  StoredAppCheckpoint,
  AppSessionListItem
} from '@tokenring-ai/checkpoint/AppCheckpointStorage';

// Configuration schema
import { CheckpointConfigSchema } from '@tokenring-ai/checkpoint';

// Plugin
import checkpointPlugin from '@tokenring-ai/checkpoint';

// State management
import { AppCheckpointState } from '@tokenring-ai/checkpoint/state/appCheckpointState';

// Type exports
import type {
  ParsedAgentCheckpointConfig,
  ParsedAppCheckpointConfig
} from '@tokenring-ai/checkpoint';
```

## License

MIT License - see `LICENSE` file for details.
