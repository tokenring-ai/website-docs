# @tokenring-ai/checkpoint

The `@tokenring-ai/checkpoint` package provides persistent state management
for both agents and applications within the Token Ring Agent framework. It
enables saving snapshots of current state and restoring them later, supporting
workflow interruption, experimentation, and session recovery. The package
includes interactive chat commands, auto-checkpointing hooks, and RPC endpoints
for programmatic access to checkpoint operations.

## Overview

The checkpoint package provides two types of checkpoint services:

1. **AgentCheckpointService**: Manages checkpoints for individual agents
2. **AppCheckpointService**: Manages checkpoints for the entire application

## Key Features

- **Dual Checkpoint Types**: Supports both Agent Checkpoints and App Checkpoints
- **State Snapshots**: Save complete agent and application state including chat
  history, tools, hooks, and custom state
- **Storage Provider Architecture**: Configurable checkpoint storage providers
  via `setCheckpointProvider`
- **Interactive Browsing**: Tree-based UI for exploring and restoring checkpoints
- **Auto-Checkpointing**: Automatic checkpoint creation after agent input
  processing
- **Session History**: Browse checkpoints grouped by agent ID or date
- **Named Checkpoints**: Label checkpoints for easy identification
- **RPC API**: JSON-RPC endpoints for remote checkpoint operations, including
  streaming
- **Plugin Architecture**: Automatic integration with TokenRing applications
- **State Restoration**: Automatic restoration of previous app state on startup
  (configurable)

## User Guide

### Chat Commands

#### Agent Checkpoint Commands

| Command | Description |
|---------|-------------|
| `/agent checkpoint create [label]` | Create a checkpoint with an optional label (defaults to "New Checkpoint") |
| `/agent checkpoint restore <id>` | Restore agent state from a specific checkpoint by numeric ID (must be an integer) |
| `/agent checkpoint list` | Open an interactive tree browser to select and restore a checkpoint |
| `/agent checkpoint history` | Browse checkpoint history grouped by agent ID |

#### App Checkpoint Commands

| Command | Description |
|---------|-------------|
| `/app checkpoint create` | Create a checkpoint of the current app state |
| `/app checkpoint list` | Open an interactive tree browser to select and restore an app checkpoint |
| `/app checkpoint history` | Browse app checkpoint history grouped by date, select by session ID |

### Tools

This package does not define any tools.

### Configuration

Configure the checkpoint package using the plugin configuration:

```yaml
checkpoint:
  app:
    restorePreviousState: false
    projectDirectory: "/path/to/project"
    hostname: "localhost"
  agent: {}
```

#### Configuration Schema

The package uses the `CheckpointConfigSchema` which defines configuration for
both app and agent checkpointing.

**File:** `pkg/checkpoint/schema.ts`

**Exports:** `import { CheckpointConfigSchema } from "@tokenring-ai/checkpoint"`

```typescript
import { z } from "zod";
import { hostname } from "node:os";

// AppCheckpointServiceSchema
// - restorePreviousState: boolean (default: false)
// - projectDirectory: string (required)
// - hostname: string (default: current hostname)
const AppCheckpointServiceSchema = z.object({
  restorePreviousState: z.boolean().default(false),
  projectDirectory: z.string(),
  hostname: z.string().default(hostname()),
});

// AgentCheckpointServiceSchema (empty configuration)
const AgentCheckpointServiceSchema = z.object({}).prefault({});

// CheckpointConfigSchema
const CheckpointConfigSchema = z.object({
  app: AppCheckpointServiceSchema,
  agent: AgentCheckpointServiceSchema,
});
```

**Parsed Types:**

| Type | Source | Description |
|------|--------|-------------|
| `ParsedAppCheckpointConfig` | `AppCheckpointServiceSchema` | Parsed app checkpoint configuration |
| `ParsedAgentCheckpointConfig` | `AgentCheckpointServiceSchema` | Parsed agent checkpoint configuration (empty object) |

### Integration

The checkpoint plugin integrates with TokenRing applications by:

- Registering `AgentCheckpointService` and `AppCheckpointService`
- Adding agent checkpoint commands (`/agent checkpoint *`)
- Adding app checkpoint commands (`/app checkpoint *`)
- Installing the `autoCheckpoint` hook for automatic checkpointing
- Registering RPC endpoints at `/rpc/checkpoint`
- Providing `AppCheckpointState` for app-level state management

### Best Practices

1. **Register Providers**: Always register checkpoint providers before using
   checkpoint features
2. **Named Checkpoints**: Create named checkpoints at logical decision points
   for agents
3. **Provider Selection**: Set appropriate providers for your use case:
   - Memory provider for testing/experimentation
   - Persistent provider (file system, database) for production
4. **Cleanup**: Periodically list and manage checkpoints to manage storage
5. **Error Handling**: Always catch restore errors for graceful degradation
6. **RPC Usage**: Use RPC endpoints for remote checkpoint management and agent
   spawning
7. **Auto-Checkpointing**: Enable auto-checkpointing for frequent automatic
   saves during development
8. **App State Restoration**: Enable `restorePreviousState` for applications
   that need session continuity

## Developer Reference

### Core Components

#### AgentCheckpointService

The main service for agent checkpoint operations. Automatically installed when
the plugin is registered with the Token Ring app.

**File:** `pkg/checkpoint/AgentCheckpointService.ts`

**Exports:**
`import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService"`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"AgentCheckpointService"` | Service identifier |
| `description` | `"Persists agent state to a storage provider"` | Service description |
| `checkpointProvider` | `AgentCheckpointStorage \| null` | The registered storage provider |
| `app` | `TokenRingApp` | The application instance |
| `options` | `ParsedAgentCheckpointConfig` | Configuration options (empty object) |

**Methods:**

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `setCheckpointProvider` | `provider: AgentCheckpointStorage` | `void` | Set the checkpoint storage provider |
| `saveAgentCheckpoint` | `name: string, agent: Agent` | `Promise<number>` | Save agent state, returns numeric ID |
| `restoreAgentCheckpoint` | `id: number, agent: Agent` | `Promise<void>` | Restore agent from checkpoint by ID |
| `listAgentCheckpoints` | - | `Promise<AgentCheckpointListItem[]>` | List all available checkpoints |
| `retrieveAgentCheckpoint` | `checkpointId: number` | `Promise<StoredAgentCheckpoint\|null>` | Retrieve checkpoint with full state |
| `attach` | `agent: Agent, creationContext: AgentCreationContext` | `void` | Attach service to an agent |
| `start` | - | `void` | Initialize and validate checkpoint provider |

**Example Usage:**

```typescript
import AgentCheckpointService
  from "@tokenring-ai/checkpoint/AgentCheckpointService";

const checkpointService
  = agent.requireServiceByType(AgentCheckpointService);

// Set a custom provider
checkpointService.setCheckpointProvider(myProvider);

// Save checkpoint (returns numeric ID)
const checkpointId = await checkpointService.saveAgentCheckpoint(
  "Before Feature Implementation", agent
);

// Restore checkpoint
await checkpointService.restoreAgentCheckpoint(checkpointId, agent);

// List all checkpoints
const checkpoints = await checkpointService.listAgentCheckpoints();

// Retrieve full checkpoint with state
const fullCheckpoint
  = await checkpointService.retrieveAgentCheckpoint(checkpointId);
```

#### AppCheckpointService

Service for application-level checkpoint operations. Manages the state of the
entire application including all agents.

**File:** `pkg/checkpoint/AppCheckpointService.ts`

**Exports:**
`import AppCheckpointService from "@tokenring-ai/checkpoint/AppCheckpointService"`

**Constructor Behavior:**

The constructor requires the `TokenRingApp` instance and
`ParsedAppCheckpointConfig` options. During construction, it automatically
initializes the `AppCheckpointState` state slice by obtaining the
`AgentManager` service and calling
`app.stateManager.initializeState(AppCheckpointState, agentManager)`. This
enables app-level checkpointing of all agent states.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"AppCheckpointService"` | Service identifier |
| `description` | `"Persists app state to a storage provider"` | Service description |
| `checkpointProvider` | `AppCheckpointStorage \| null` | The registered storage provider |
| `app` | `TokenRingApp` | The application instance |
| `options` | `ParsedAppCheckpointConfig` | Configuration options |

**Methods:**

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `setCheckpointProvider` | `provider: AppCheckpointStorage` | `void` | Set the checkpoint storage provider |
| `saveAppCheckpoint` | - | `Promise<number>` | Save current app state, returns numeric ID |
| `restoreAppCheckpoint` | `id: number` | `Promise<void>` | Restore app from checkpoint by ID |
| `listAppCheckpoints` | - | `Promise<AppSessionListItem[]>` | List all available app checkpoints |
| `retrieveAppCheckpoint` | `checkpointId: number` | `Promise<StoredAppCheckpoint\|null>` | Retrieve a specific app checkpoint |
| `start` | - | `Promise<void>` | Initialize provider, optionally restore previous state |
| `stop` | - | `Promise<void>` | Save checkpoint on app stop |

**Example Usage:**

```typescript
import AppCheckpointService
  from "@tokenring-ai/checkpoint/AppCheckpointService";

const appCheckpointService = app.requireService(AppCheckpointService);

// Set a custom provider
appCheckpointService.setCheckpointProvider(myProvider);

// Save app checkpoint (returns numeric ID)
const checkpointId = await appCheckpointService.saveAppCheckpoint();

// Restore app from checkpoint
await appCheckpointService.restoreAppCheckpoint(checkpointId);

// List all app checkpoints
const checkpoints = await appCheckpointService.listAppCheckpoints();

// Retrieve full checkpoint with state
const fullCheckpoint
  = await appCheckpointService.retrieveAppCheckpoint(checkpointId);
```

**Lifecycle Behavior:**

- On `start()`: If `restorePreviousState` is enabled and a provider is
  registered, automatically retrieves and restores the latest checkpoint
- On `stop()`: Automatically saves the current app state to a checkpoint

### Services

#### AgentCheckpointService Methods

##### setCheckpointProvider (Agent)

Sets the agent checkpoint storage provider.

```typescript
const service = agent.requireServiceByType(AgentCheckpointService);
service.setCheckpointProvider(myProvider);
```

##### saveAgentCheckpoint

Saves the current state of an agent to a checkpoint. Returns a numeric ID.

```typescript
const id = await service.saveAgentCheckpoint("My Checkpoint", agent);
// Returns: number (checkpoint ID)
```

##### restoreAgentCheckpoint

Restores an agent state from a checkpoint by numeric ID.

```typescript
await service.restoreAgentCheckpoint(1, agent);
```

##### listAgentCheckpoints

Lists all available agent checkpoints without state data.

```typescript
const checkpoints = await service.listAgentCheckpoints();
// Returns: AgentCheckpointListItem[]
```

##### retrieveAgentCheckpoint

Retrieves a specific agent checkpoint with full state data.

```typescript
const checkpoint = await service.retrieveAgentCheckpoint(1);
// Returns: StoredAgentCheckpoint | null
```

##### start (Agent)

Initializes the checkpoint provider and validates it is registered.

```typescript
service.start();
// Logs error via app.serviceError if no provider is registered
```

##### attach

Attaches the service to an agent and adds checkpoint provider info to creation
context.

```typescript
service.attach(agent, creationContext);
// Adds checkpoint provider info to creation context
```

#### AppCheckpointService Methods

##### setCheckpointProvider (App)

Sets the app checkpoint storage provider.

```typescript
const service = app.requireService(AppCheckpointService);
service.setCheckpointProvider(myProvider);
```

##### saveAppCheckpoint

Saves the current state of the application to a checkpoint. Returns a numeric
ID.

```typescript
const id = await service.saveAppCheckpoint();
// Returns: number (checkpoint ID)
```

##### restoreAppCheckpoint

Restores the application state from a checkpoint by numeric ID.

```typescript
await service.restoreAppCheckpoint(1);
```

##### listAppCheckpoints

Lists all available app checkpoints without state data.

```typescript
const checkpoints = await service.listAppCheckpoints();
// Returns: AppSessionListItem[]
```

##### retrieveAppCheckpoint

Retrieves a specific app checkpoint with full state data.

```typescript
const checkpoint = await service.retrieveAppCheckpoint(1);
// Returns: StoredAppCheckpoint | null
```

##### start (App)

Initializes the checkpoint provider and optionally restores previous state.

```typescript
await service.start();
// If restorePreviousState is true and provider exists,
//   restores latest checkpoint
// Logs error via app.serviceError if no provider is registered
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

**File:** `pkg/checkpoint/AgentCheckpointStorage.ts`

**Exports:**
`import type { AgentCheckpointStorage } from "@tokenring-ai/checkpoint/AgentCheckpointStorage"`

```typescript
import { AgentCheckpointSchema } from "@tokenring-ai/agent/types";
import type { MaybePromise } from "bun";
import z from "zod";

export interface AgentCheckpointStorage {
  displayName: string;

  storeAgentCheckpoint(
    data: NamedAgentCheckpoint
  ): MaybePromise<number>;

  retrieveAgentCheckpoint(
    id: number
  ): MaybePromise<StoredAgentCheckpoint | null>;

  listAgentCheckpoints(): MaybePromise<AgentCheckpointListItem[]>;
}
```

**Data Structures:**

```typescript
// Checkpoint with name (extends AgentCheckpointSchema)
export const NamedAgentCheckpointSchema
  = AgentCheckpointSchema.extend({
    name: z.string(),
  });

export type NamedAgentCheckpoint
  = z.input<typeof NamedAgentCheckpointSchema>;

// Checkpoint with storage ID
export const StoredAgentCheckpointSchema
  = NamedAgentCheckpointSchema.extend({
    id: z.number(),
  });

export type StoredAgentCheckpoint
  = z.input<typeof StoredAgentCheckpointSchema>;

// Checkpoint listing item (without full state data)
export const AgentCheckpointListItemSchema
  = StoredAgentCheckpointSchema.pick({
    id: true,
    sessionId: true,
    name: true,
    agentId: true,
    agentType: true,
    createdAt: true,
  });

export type AgentCheckpointListItem
  = z.output<typeof AgentCheckpointListItemSchema>;
```

**AgentCheckpointListItem Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Numeric checkpoint identifier |
| `sessionId` | `string` | Session identifier |
| `name` | `string` | Checkpoint label/name |
| `agentId` | `string` | Agent identifier |
| `agentType` | `string` | Agent type |
| `createdAt` | `number` | Timestamp (milliseconds) |

**Example Agent Provider:**

```typescript
import type { AgentCheckpointStorage }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { StoredAgentCheckpoint }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { AgentCheckpointListItem }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";

class MemoryAgentCheckpointProvider implements AgentCheckpointStorage {
  displayName = "Memory Agent Provider";
  private checkpoints = new Map<number, StoredAgentCheckpoint>();
  private nextId = 1;

  async storeAgentCheckpoint(
    data: NamedAgentCheckpoint
  ): Promise<number> {
    const id = this.nextId++;
    this.checkpoints.set(id, {
      ...data,
      id,
      createdAt: Date.now(),
    });
    return id;
  }

  async retrieveAgentCheckpoint(
    id: number
  ): Promise<StoredAgentCheckpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  async listAgentCheckpoints(): Promise<AgentCheckpointListItem[]> {
    return Array.from(this.checkpoints.values()).map((cp) => ({
      id: cp.id,
      sessionId: cp.sessionId,
      name: cp.name,
      agentId: cp.agentId,
      agentType: cp.agentType,
      createdAt: cp.createdAt,
    }));
  }
}
```

#### AppCheckpointStorage Interface

Interface for implementing custom app checkpoint storage backends.

**File:** `pkg/checkpoint/AppCheckpointStorage.ts`

**Exports:**
`import type { AppCheckpointStorage } from "@tokenring-ai/checkpoint/AppCheckpointStorage"`

```typescript
import { type AppSessionCheckpoint, AppSessionCheckpointSchema }
  from "@tokenring-ai/app/schema";
import z from "zod";

export interface AppCheckpointStorage {
  displayName: string;

  storeAppCheckpoint(
    data: AppSessionCheckpoint
  ): Promise<number>;

  retrieveAppCheckpoint(
    id: number
  ): Promise<StoredAppCheckpoint | null>;

  listAppCheckpoints(): Promise<AppSessionListItem[]>;

  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

**Data Structures:**

```typescript
// App checkpoint with storage ID
export const StoredAppCheckpointSchema
  = AppSessionCheckpointSchema.extend({
    id: z.number(),
  });

export type StoredAppCheckpoint
  = z.input<typeof StoredAppCheckpointSchema>;

// App checkpoint listing item (without full state data)
export const AppCheckpointListItemSchema
  = StoredAppCheckpointSchema.pick({
    id: true,
    sessionId: true,
    hostname: true,
    projectDirectory: true,
    createdAt: true,
  });

export type AppSessionListItem
  = z.output<typeof AppCheckpointListItemSchema>;
```

**AppCheckpointListItem Schema Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Numeric checkpoint identifier |
| `sessionId` | `string` | Session identifier |
| `hostname` | `string` | Hostname where app is running |
| `projectDirectory` | `string` | Current project directory |
| `createdAt` | `number` | Timestamp (milliseconds) |

**AppSessionListItem Type:**

The `AppSessionListItem` type is the output type of
`AppCheckpointListItemSchema`, containing the same fields without the full
state data.

**AppSessionListItem Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Numeric checkpoint identifier |
| `sessionId` | `string` | Session identifier |
| `hostname` | `string` | Hostname where app is running |
| `projectDirectory` | `string` | Current project directory |
| `createdAt` | `number` | Timestamp (milliseconds) |

**Example App Provider:**

```typescript
import type { AppCheckpointStorage }
  from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import type { StoredAppCheckpoint }
  from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import type { AppSessionListItem }
  from "@tokenring-ai/checkpoint/AppCheckpointStorage";

class MemoryAppCheckpointProvider implements AppCheckpointStorage {
  displayName = "Memory App Provider";
  private checkpoints = new Map<number, StoredAppCheckpoint>();
  private nextId = 1;

  async storeAppCheckpoint(
    data: AppSessionCheckpoint
  ): Promise<number> {
    const id = this.nextId++;
    this.checkpoints.set(id, {
      ...data,
      id,
      createdAt: Date.now(),
    });
    return id;
  }

  async retrieveAppCheckpoint(
    id: number
  ): Promise<StoredAppCheckpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  async listAppCheckpoints(): Promise<AppSessionListItem[]> {
    return Array.from(this.checkpoints.values()).map((cp) => ({
      id: cp.id,
      sessionId: cp.sessionId,
      hostname: cp.hostname,
      projectDirectory: cp.projectDirectory,
      createdAt: cp.createdAt,
    }));
  }

  async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
    const entries = Array.from(this.checkpoints.values());
    if (entries.length === 0) return null;
    return entries.reduce((latest, cp) =>
      cp.createdAt > latest.createdAt ? cp : latest
    );
  }
}
```

#### Provider Registration

Set the checkpoint provider using `setCheckpointProvider`:

```typescript
// Set agent provider
const agentService
  = agent.requireServiceByType(AgentCheckpointService);
agentService.setCheckpointProvider(new MemoryAgentCheckpointProvider());

// Set app provider
const appService = app.requireService(AppCheckpointService);
appService.setCheckpointProvider(new MemoryAppCheckpointProvider());
```

### RPC Endpoints

The plugin provides JSON-RPC endpoints for remote checkpoint operations.

**File:** `pkg/checkpoint/rpc/checkpoint.ts`

**Schema:** `pkg/checkpoint/rpc/schema.ts`

**Endpoint:** `/rpc/checkpoint`

#### listCheckpoints

Query all available agent checkpoints without state data.

**Type:** `query`

**Input:** `{}`

**Result:** `AgentCheckpointListItem[]`

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
      "id": 1,
      "sessionId": "session-abc",
      "name": "Before Feature Implementation",
      "agentId": "agent-456",
      "agentType": "default",
      "createdAt": 1640995200000
    }
  ]
}
```

#### streamCheckpoints

Stream checkpoint list updates via polling query stream.

**Type:** `stream`

**Input:** `{}`

**Result:** `AgentCheckpointListItem[]`

**Polling Interval:** 5000ms

**Request:**

```json
{
  "method": "streamCheckpoints",
  "params": {}
}
```

#### getCheckpoint

Retrieve a specific agent checkpoint with full state data.

**Type:** `query`

**Input:** `{ id: number }`

**Result:** Discriminated union on `status` field, using
`z.discriminatedUnion("status", [SuccessSchema.extend({ checkpoint:
NamedAgentCheckpointSchema }), CheckpointNotFoundSchema])`:

- `{ status: "success", checkpoint: StoredAgentCheckpoint }` - checkpoint
  found, includes full state data
- `{ status: "checkpointNotFound" }` - checkpoint does not exist

**Request:**

```json
{
  "method": "getCheckpoint",
  "params": {
    "id": 1
  }
}
```

**Response (found):**

```json
{
  "result": {
    "status": "success",
    "checkpoint": {
      "id": 1,
      "name": "Before Feature Implementation",
      "sessionId": "session-abc",
      "agentId": "agent-456",
      "agentType": "default",
      "createdAt": 1640995200000,
      "state": {
        "agentState": {},
        "chatMessages": []
      }
    }
  }
}
```

**Response (not found):**

```json
{
  "result": {
    "status": "checkpointNotFound"
  }
}
```

#### launchAgentFromCheckpoint

Create a new agent from a checkpoint. Spawns a new agent instance from the
checkpoint data.

**Type:** `mutation`

**Input:** `{ checkpointId: number, headless?: boolean }`

**Result:** Discriminated union on `status` field, using
`z.discriminatedUnion("status", [SuccessSchema.extend({ agentId: z.string(),
agentName: z.string(), agentType: z.string().exactOptional() }),
CheckpointNotFoundSchema])`:

- `{ status: "success", agentId: string, agentName: string, agentType?: string }`
  - `agentType` is an exact optional field (only present if the agent
    configuration defines one)
- `{ status: "checkpointNotFound" }` - checkpoint does not exist

**Request:**

```json
{
  "method": "launchAgentFromCheckpoint",
  "params": {
    "checkpointId": 1,
    "headless": false
  }
}
```

**Response (success):**

```json
{
  "result": {
    "status": "success",
    "agentId": "agent-789",
    "agentName": "Restored Agent",
    "agentType": "default"
  }
}
```

**Response (not found):**

```json
{
  "result": {
    "status": "checkpointNotFound"
  }
}
```

**Note:** All RPC endpoints operate on agent checkpoints only. App checkpoints
are managed through the chat commands and service API.

### Hooks

#### autoCheckpoint Hook

Automatically creates a checkpoint after each agent input is processed. Enabled
by default when the plugin is attached to an agent.

**File:** `pkg/checkpoint/hooks/autoCheckpoint.ts`

**Hook Details:**

| Property | Value |
|----------|-------|
| Name | `autoCheckpoint` |
| Display Name | `Checkpoint/Auto Checkpoint` |
| Description | `Automatically saves agent checkpoints after input is handled` |
| Callback | `AfterAgentInputHandled` |

**Behavior:**

- Triggered after agent successfully processes input
- Uses the input message as the checkpoint label
- Runs silently without interrupting workflow
- Can be disabled via agent hook management

**Configuration:**

```typescript
// Disable auto-checkpointing
agent.hooks.disableItems("autoCheckpoint");

// Re-enable auto-checkpointing
agent.hooks.enableItems("autoCheckpoint");
```

### State Management

The checkpoint service provides state management through:

- **Checkpoint Persistence**: Store and retrieve agent and app states
- **Provider Registration**: Configure storage backends
- **State Restoration**: Restore complete agent and app state from checkpoints
- **AppCheckpointState**: Manages agent checkpoint data for app-level checkpoints

#### AppCheckpointState

State slice that manages agent checkpoint data for application-level checkpoints.

**File:** `pkg/checkpoint/state/appCheckpointState.ts`

**Exports:**
`import { AppCheckpointState } from "@tokenring-ai/checkpoint/state/appCheckpointState"`

**Serialization Schema:**

```typescript
const serializationSchema = z
  .object({
    agentCheckpointData: z.array(AgentCheckpointSchema).default([]),
  })
  .prefault({});
```

**Methods:**

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `serialize` | - | `{ agentCheckpointData: AgentCheckpointSchema[] }` | Returns array of all agent checkpoints |
| `deserialize` | `data` | `void` | Spawns agents from checkpoint data |

**Behavior:**

- `serialize()`: Collects checkpoints from all agents in the agent manager
- `deserialize()`: Restores agents from checkpoint data, skipping agents that
  already exist

**Example:**

```typescript
import { AppCheckpointState }
  from "@tokenring-ai/checkpoint/state/appCheckpointState";

// The state slice is automatically initialized by AppCheckpointService
// It serializes all agent checkpoints when app state is saved
// It restores agents from checkpoints when app state is restored
```

### Usage Examples

#### Basic Agent Checkpoint Workflow

```typescript
import AgentCheckpointService
  from "@tokenring-ai/checkpoint/AgentCheckpointService";

const service = agent.requireServiceByType(AgentCheckpointService);

// Save checkpoint (returns numeric ID)
const id1 = await service.saveAgentCheckpoint("Before Changes", agent);

// Make changes to agent state
// ... agent does work ...

// Save another checkpoint
const id2 = await service.saveAgentCheckpoint("After Changes", agent);

// List all checkpoints
const all = await service.listAgentCheckpoints();
console.log(`Total checkpoints: ${all.length}`);

// Restore from earlier checkpoint
await service.restoreAgentCheckpoint(id1, agent);
```

#### Basic App Checkpoint Workflow

```typescript
import AppCheckpointService
  from "@tokenring-ai/checkpoint/AppCheckpointService";

const service = app.requireService(AppCheckpointService);

// Save app checkpoint (returns numeric ID)
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
import type { AgentCheckpointStorage }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";

class CustomProvider implements AgentCheckpointStorage {
  displayName = "Custom Memory Provider";
  private checkpoints = new Map<number, StoredAgentCheckpoint>();
  private nextId = 1;

  async storeAgentCheckpoint(
    data: NamedAgentCheckpoint
  ): Promise<number> {
    const id = this.nextId++;
    const stored: StoredAgentCheckpoint = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    this.checkpoints.set(id, stored);
    return id;
  }

  async retrieveAgentCheckpoint(
    id: number
  ): Promise<StoredAgentCheckpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  async listAgentCheckpoints(): Promise<AgentCheckpointListItem[]> {
    return Array.from(this.checkpoints.values()).map((cp) => ({
      id: cp.id,
      sessionId: cp.sessionId,
      name: cp.name,
      agentId: cp.agentId,
      agentType: cp.agentType,
      createdAt: cp.createdAt,
    }));
  }
}

// Set provider
const service = agent.requireServiceByType(AgentCheckpointService);
service.setCheckpointProvider(new CustomProvider());
```

#### Conditional Checkpointing

```typescript
// Disable auto-checkpointing for certain operations
agent.hooks.disableItems("autoCheckpoint");

// Do work without automatic checkpoints
// ...

// Re-enable auto-checkpointing
agent.hooks.enableItems("autoCheckpoint");

// Save a specific checkpoint manually
const id = await service.saveAgentCheckpoint("Critical State", agent);
```

#### RPC Usage

```typescript
// Using the RPC endpoint directly
const response = await fetch("/rpc/checkpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    method: "listCheckpoints",
    params: {},
  }),
});

const checkpoints = await response.json();
```

#### Launch Agent from Checkpoint via RPC

```typescript
// Launch a new agent from a checkpoint
const response = await fetch("/rpc/checkpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    method: "launchAgentFromCheckpoint",
    params: {
      checkpointId: 1,
      headless: false,
    },
  }),
});

const result = await response.json();
console.log(`Launched agent: ${result.agentId}`);
```

#### Auto-Restore App State on Startup

```yaml
# Configure app checkpoint service to restore previous state
checkpoint:
  app:
    restorePreviousState: true
    projectDirectory: "/path/to/project"
```

The `AppCheckpointService` will automatically:

1. Retrieve the latest checkpoint on startup (via provider)
2. Restore the app state from that checkpoint
3. Save a checkpoint when the app stops (via `stop()` lifecycle method)

### Package Integration

#### Installation with TokenRingApp

The checkpoint plugin is automatically installed when registered:

```typescript
import checkpointPlugin from "@tokenring-ai/checkpoint";

export default {
  plugins: [checkpointPlugin],
} satisfies TokenRingPlugin;
```

**Automatically Provides:**

- Chat commands (`/agent checkpoint`, `/app checkpoint`, and subcommands)
- Auto-checkpoint hook
- `AgentCheckpointService` service instance
- `AppCheckpointService` service instance
- RPC endpoints for remote operations
- Configuration schema validation
- `AppCheckpointState` for app-level state management

#### Plugin Implementation

```typescript
import { AgentCommandService } from "@tokenring-ai/agent";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import { RpcService } from "@tokenring-ai/rpc";

import { z } from "zod";
import AgentCheckpointService from "./AgentCheckpointService.ts";
import AppCheckpointService from "./AppCheckpointService.ts";
import agentCommands from "./commands.ts";
import autoCheckpoint from "./hooks/autoCheckpoint.ts";
import packageJSON from "./package.json" with { type: "json" };
import checkpointRPC from "./rpc/checkpoint.ts";
import { CheckpointConfigSchema } from "./schema.ts";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema,
});

export default {
  name: packageJSON.name,
  displayName: "Checkpoint Service",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const agentCheckpointService
      = new AgentCheckpointService(app, config.checkpoint.agent);
    app.addServices(agentCheckpointService);

    const appCheckpointService
      = new AppCheckpointService(app, config.checkpoint.app);
    app.addServices(appCheckpointService);

    app.waitForService(
      AgentCommandService,
      (agentCommandService) =>
        agentCommandService.addAgentCommands(agentCommands)
    );
    app.waitForService(
      AgentLifecycleService,
      (lifecycleService) => lifecycleService.addHooks(autoCheckpoint)
    );
    app.waitForService(RpcService, (rpcService) => {
      rpcService.registerEndpoint(checkpointRPC);
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
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

// App checkpoint error handling (throws ConfigurationError)
try {
  await appCheckpointService.restoreAppCheckpoint(id);
  console.log(`App checkpoint ${id} restored`);
} catch (error) {
  console.error(`Failed to restore app checkpoint: ${error}`);
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

| Package | Description |
|---------|-------------|
| `@tokenring-ai/app` | Application framework |
| `@tokenring-ai/agent` | Agent framework |
| `@tokenring-ai/lifecycle` | Lifecycle hooks |
| `@tokenring-ai/utility` | Utility functions |
| `@tokenring-ai/rpc` | RPC framework |
| `zod` | Schema validation |

#### Development Dependencies

| Package | Description |
|---------|-------------|
| `typescript` | Type checking |
| `vitest` | Testing framework |

### Package Details

- **Name**: `@tokenring-ai/checkpoint`
- **Version**: `0.2.0`
- **License**: MIT
- **Description**: Persistent state management for agents and applications,
  enabling checkpoint creation, restoration, and session recovery

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
// Main services (from index.ts)
import AgentCheckpointService from "@tokenring-ai/checkpoint";
import AgentStateStorage from "@tokenring-ai/checkpoint"; // alias

// App storage types (from index.ts)
import type { AppCheckpointStorage } from "@tokenring-ai/checkpoint";
import type { AppSessionListItem } from "@tokenring-ai/checkpoint";
import type { StoredAppCheckpoint } from "@tokenring-ai/checkpoint";

// Configuration schema (from index.ts)
import { CheckpointConfigSchema } from "@tokenring-ai/checkpoint";
import type { ParsedAgentCheckpointConfig } from "@tokenring-ai/checkpoint";
import type { ParsedAppCheckpointConfig } from "@tokenring-ai/checkpoint";

// Agent storage interface (via path export)
import type { AgentCheckpointStorage }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { NamedAgentCheckpoint }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { StoredAgentCheckpoint }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { AgentCheckpointListItem }
  from "@tokenring-ai/checkpoint/AgentCheckpointStorage";

// App checkpoint service (via path export)
import AppCheckpointService
  from "@tokenring-ai/checkpoint/AppCheckpointService";

// Plugin (via path export)
import checkpointPlugin from "@tokenring-ai/checkpoint/plugin";

// State management (via path export)
import { AppCheckpointState }
  from "@tokenring-ai/checkpoint/state/appCheckpointState";
```

## License

MIT License - see `LICENSE` file for details.
