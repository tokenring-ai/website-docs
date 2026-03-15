# @tokenring-ai/checkpoint

The `@tokenring-ai/checkpoint` package provides persistent state management for both agents and applications within the Token Ring Agent framework. It enables saving snapshots of current state and restoring them later, supporting workflow interruption, experimentation, and session recovery. The package includes interactive chat commands, auto-checkpointing hooks, and RPC endpoints for programmatic access to checkpoint operations.

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

## Core Components

### AgentCheckpointService

The main service for agent checkpoint operations. Automatically installed when the plugin is registered with the Token Ring app.

**Properties:**

- `name`: "AgentCheckpointService"
- `description`: "Persists agent state to a storage provider"
- `checkpointProvider`: The registered storage provider (nullable)

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
start(): Promise<void>

// Attach service to an agent and enable auto-checkpoint hook
attach(agent: Agent, creationContext: AgentCreationContext): Promise<void>
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

### AppCheckpointService

Service for application-level checkpoint operations. Manages the state of the entire application including all agents.

**Properties:**

- `name`: "AppCheckpointService"
- `description`: "Persists app state to a storage provider"
- `checkpointProvider`: The registered storage provider (nullable)
- `options`: Configuration options including `restorePreviousState`

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

### AgentCheckpointStorage Interface

The storage provider interface for agent checkpoints that users must implement for custom storage backends.

```typescript
export interface AgentCheckpointStorage {
  // Display name for the provider
  displayName: string;

  // Save checkpoint and return its ID
  storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string>;

  // Retrieve checkpoint by ID
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;

  // List all stored checkpoints (without state data)
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
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

### AppCheckpointStorage Interface

The storage provider interface for application checkpoints.

```typescript
export interface AppCheckpointStorage {
  // Display name for the provider
  displayName: string;

  // Save app checkpoint and return its ID
  storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string>;

  // Retrieve checkpoint by ID
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;

  // List all stored app checkpoints (without state data)
  listAppCheckpoints(): Promise<AppSessionListItem[]>;

  // Retrieve the latest app checkpoint
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
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
- `workingDirectory` - Current working directory
- `createdAt` - Timestamp of checkpoint creation
- `state` - Complete application state including all agents

## Services

### AgentCheckpointService

Service implementation that manages agent checkpoint operations.

**Properties:**

- `name`: "AgentCheckpointService"
- `description`: "Persists agent state to a storage provider"
- `options`: Configuration options from schema (empty object)

**Methods:**

#### `setCheckpointProvider(provider: AgentCheckpointStorage)`

Sets the agent checkpoint storage provider.

```typescript
const service = agent.requireServiceByType(AgentCheckpointService);
service.setCheckpointProvider(myProvider);
```

#### `saveAgentCheckpoint(name: string, agent: Agent): Promise<string>`

Saves the current state of an agent to a checkpoint.

```typescript
const id = await service.saveAgentCheckpoint('My Checkpoint', agent);
// Returns: checkpoint ID
```

#### `restoreAgentCheckpoint(id: string, agent: Agent): Promise<void>`

Restores an agent's state from a checkpoint.

```typescript
await service.restoreAgentCheckpoint(checkpointId, agent);
```

#### `listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>`

Lists all available agent checkpoints (without state data).

```typescript
const checkpoints = await service.listAgentCheckpoints();
// Returns: Array of checkpoint list items
```

#### `retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>`

Retrieves a specific agent checkpoint with full state data.

```typescript
const checkpoint = await service.retrieveAgentCheckpoint(checkpointId);
// Returns: Full checkpoint or null
```

#### `start(): Promise<void>`

Initializes the checkpoint provider and validates it's registered.

```typescript
await service.start();
// Throws error if no provider is registered
```

#### `attach(agent: Agent, creationContext: AgentCreationContext): Promise<void>`

Attaches the service to an agent and enables auto-checkpointing.

```typescript
await service.attach(agent, creationContext);
// Adds checkpoint provider info to creation context
// Enables autoCheckpoint hook if provider is registered
```

### AppCheckpointService

Service implementation that manages application checkpoint operations.

**Properties:**

- `name`: "AppCheckpointService"
- `description`: "Persists app state to a storage provider"
- `options`: Configuration options from schema including `restorePreviousState`

**Methods:**

#### `setCheckpointProvider(provider: AppCheckpointStorage)`

Sets the app checkpoint storage provider.

```typescript
const service = app.requireService(AppCheckpointService);
service.setCheckpointProvider(myProvider);
```

#### `saveAppCheckpoint(): Promise<string>`

Saves the current state of the application to a checkpoint.

```typescript
const id = await service.saveAppCheckpoint();
// Returns: checkpoint ID
```

#### `restoreAppCheckpoint(id: string): Promise<void>`

Restores the application's state from a checkpoint.

```typescript
await service.restoreAppCheckpoint(checkpointId);
```

#### `listAppCheckpoints(): Promise<AppSessionListItem[]>`

Lists all available app checkpoints (without state data).

```typescript
const checkpoints = await service.listAppCheckpoints();
// Returns: Array of checkpoint list items
```

#### `retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>`

Retrieves a specific app checkpoint with full state data.

```typescript
const checkpoint = await service.retrieveAppCheckpoint(checkpointId);
// Returns: Full checkpoint or null
```

#### `retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>`

Retrieves the most recent app checkpoint.

```typescript
const latest = await service.retrieveLatestAppCheckpoint();
// Returns: Latest checkpoint or null
```

#### `start(): Promise<void>`

Initializes the checkpoint provider and optionally restores previous state.

```typescript
await service.start();
// If restorePreviousState is true and provider exists, restores latest checkpoint
// Throws error if no provider is registered
```

#### `stop(): Promise<void>`

Saves a checkpoint when the application stops.

```typescript
await service.stop();
// Saves current app state if provider is registered
```

## Configuration

The checkpoint plugin uses a configuration schema with separate configurations for agent and app checkpoint services.

**Configuration Schema:**

```typescript
import { z } from "zod";

export const AppCheckpointServiceSchema = z.object({
  restorePreviousState: z.boolean().default(false),
}).prefault({});

export const AgentCheckpointServiceSchema = z.object({
}).prefault({});

export const CheckpointConfigSchema = z.object({
  app: AppCheckpointServiceSchema,
  agent: AgentCheckpointServiceSchema,
}).prefault({});
```

**Example Configuration:**

```javascript
export default {
  checkpoint: {
    app: {
      restorePreviousState: true  // Automatically restore last app state on startup
    },
    agent: {}  // Agent checkpoint service has no configuration options
  }
};
```

**Important Note:**

The checkpoint plugin does not automatically create storage providers based on configuration. Users must implement their own storage providers by implementing the `AgentCheckpointStorage` or `AppCheckpointStorage` interfaces and set them using the `setCheckpointProvider` method of the respective services.

## Providers

### AgentCheckpointStorage Interface

Interface for implementing custom agent checkpoint storage backends.

**Required Properties:**

#### `displayName: string`

Display name for the storage provider.

```typescript
class MyProvider implements AgentCheckpointStorage {
  displayName = "My Custom Provider";
  // ... other methods
}
```

**Required Methods:**

#### `storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string>`

Stores a checkpoint and returns its ID.

```typescript
async storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string> {
  const id = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Store data with id and createdAt...
  return id;
}
```

#### `retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>`

Retrieves a checkpoint by ID.

```typescript
async retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
  // Retrieve and return checkpoint with full state or null
}
```

#### `listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>`

Lists all stored checkpoints (without state data).

```typescript
async listAgentCheckpoints(): Promise<AgentCheckpointListItem[]> {
  // Return array of checkpoint list items (id, name, agentId, createdAt)
}
```

### AppCheckpointStorage Interface

Interface for implementing custom app checkpoint storage backends.

**Required Properties:**

#### `displayName: string`

Display name for the storage provider.

```typescript
class MyProvider implements AppCheckpointStorage {
  displayName = "My Custom Provider";
  // ... other methods
}
```

**Required Methods:**

#### `storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string>`

Stores a checkpoint and returns its ID.

```typescript
async storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string> {
  const id = `app-checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Store data with id and createdAt...
  return id;
}
```

#### `retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>`

Retrieves a checkpoint by ID.

```typescript
async retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null> {
  // Retrieve and return checkpoint with full state or null
}
```

#### `listAppCheckpoints(): Promise<AppSessionListItem[]>`

Lists all stored checkpoints (without state data).

```typescript
async listAppCheckpoints(): Promise<AppSessionListItem[]> {
  // Return array of checkpoint list items (sessionId, createdAt, hostname, workingDirectory)
}
```

#### `retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>`

Retrieves the most recent checkpoint.

```typescript
async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
  // Return the most recent checkpoint or null
}
```

### Provider Registration

Set the checkpoint provider using `setCheckpointProvider`:

```typescript
import type {AgentCheckpointStorage} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
import type {AppCheckpointStorage} from '@tokenring-ai/checkpoint/AppCheckpointStorage';

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

## RPC Endpoints

The plugin provides JSON-RPC endpoints for remote checkpoint operations.

**Endpoint:** `/rpc/checkpoint`

### `listCheckpoints`

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

### `getCheckpoint`

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

## Chat Commands

### `/agent checkpoint create [label]`

Create a checkpoint of the current conversation state with an optional label.

**Syntax:**

```
/agent checkpoint create [label]
```

**Examples:**

```
/agent checkpoint create
/agent checkpoint create 'My Fix'
```

**Output:**

```
Checkpoint created: <checkpoint-id>: <label>
```

### `/agent checkpoint list`

Open an interactive tree browser to select and restore a checkpoint. Checkpoints are grouped by date, newest first.

**Syntax:**

```
/agent checkpoint list
```

**Behavior:**

- Groups checkpoints by date (YYYY-MM-DD format)
- Sorts dates with newest first
- Within each date, sorts checkpoints by creation time (newest first)
- Presents interactive tree selection
- Restores selected checkpoint

**Example Output:**

```
📅 2025-01-15 (3 checkpoints)
  ⏰ 14:30:25 - Before Feature Implementation
  ⏰ 12:15:10 - After Testing
  ⏰ 09:45:00 - Initial State
📅 2025-01-14 (2 checkpoints)
  ⏰ 16:20:30 - End of Day
  ⏰ 10:00:00 - Morning Start
```

### `/agent checkpoint restore <id>`

Restore a specific checkpoint by its ID.

**Syntax:**

```
/agent checkpoint restore <id>
```

**Examples:**

```
/agent checkpoint restore abc123
/agent checkpoint restore checkpoint-123
```

**Output:**

```
Checkpoint <id> loaded
```

**Error:**

```
Usage: /agent checkpoint restore <id> (see /agent checkpoint list for ids)
```

### `/agent checkpoint history`

Browse checkpoint history grouped by agent ID with detailed information.

**Syntax:**

```
/agent checkpoint history
```

**Behavior:**

- Groups checkpoints by agent ID
- Sorts checkpoints within each group by creation time (newest first)
- Presents interactive tree selection
- Displays full checkpoint details when selected

**Example Output:**

```
🤖 Agent: agent-456 (5 checkpoints)
  📋 Before Feature Implementation (14:30)
  📋 After Testing (12:15)
  📋 Initial State (09:45)
🤖 Agent: agent-789 (2 checkpoints)
  📋 End of Day (16:20)
  📋 Morning Start (10:00)
```

**Checkpoint Details Display:**

```
=== Checkpoint: Before Feature Implementation ===
ID: checkpoint-123
Agent ID: agent-456
Created: 1/15/2025, 2:30:25 PM

📋 Checkpoint State:
agentState:
  {
    "customField": "value"
  }
chatMessages:
  [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ]
...

--- End of Checkpoint Details ---
```

### `/app checkpoint create`

Create a checkpoint of the current app state.

**Syntax:**

```
/app checkpoint create
```

**Output:**

```
Checkpoint created: <checkpoint-id>
```

### `/app checkpoint list`

Open an interactive tree browser to select and restore an app checkpoint. Checkpoints are grouped by date, newest first.

**Syntax:**

```
/app checkpoint list
```

**Behavior:**

- Groups checkpoints by date (YYYY-MM-DD format)
- Sorts dates with newest first
- Within each date, sorts checkpoints by creation time (newest first)
- Shows session information (sessionId, hostname, workingDirectory)
- Presents interactive tree selection
- Restores selected checkpoint

**Example Output:**

```
📅 2025-01-15 (2 checkpoints)
  ⏰ 14:30:25 - Session abc123@localhost:/project
  ⏰ 09:45:00 - Session def456@localhost:/project
📅 2025-01-14 (1 checkpoint)
  ⏰ 16:20:30 - Session ghi789@localhost:/project
```

### `/app checkpoint history`

Browse app checkpoint history grouped by date.

**Syntax:**

```
/app checkpoint history
```

**Behavior:**

- Groups checkpoints by date
- Sorts dates with newest first
- Sorts checkpoints within each group by creation time (newest first)
- Presents interactive tree selection
- Displays full checkpoint details when selected

**Example Output:**

```
📅 2025-01-15 (3 checkpoints)
  📋 Checkpoint abc123 (14:30)
  📋 Checkpoint def456 (12:15)
  📋 Checkpoint ghi789 (09:45)
```

**Checkpoint Details Display:**

```
=== App Checkpoint ===
Session ID: abc123
Created: 1/15/2025, 2:30:25 PM
Hostname: localhost
Working Directory: /project

📋 Checkpoint State:
agentCheckpointData:
  [
    {
      "agentId": "agent-456",
      "agentState": {...},
      ...
    }
  ]

--- End of Checkpoint Details ---
```

## Hooks

### `autoCheckpoint`

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

## State Management

The checkpoint service provides state management through:

- **Checkpoint Persistence**: Store and retrieve agent and app states
- **Provider Registration**: Configure storage backends
- **State Restoration**: Restore complete agent and app state from checkpoints
- **AppCheckpointState**: Manages agent checkpoint data for app-level checkpoints

### AppCheckpointState

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

## Usage Examples

### Basic Agent Checkpoint Workflow

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

### Basic App Checkpoint Workflow

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

### Custom Storage Provider

```typescript
import type {AgentCheckpointStorage} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
import type {AppCheckpointStorage} from '@tokenring-ai/checkpoint/AppCheckpointStorage';

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
      workingDirectory: cp.workingDirectory
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

### Launch Agent from Checkpoint via RPC

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

### Auto-Restore App State on Startup

```javascript
// Configure app checkpoint service to restore previous state
export default {
  checkpoint: {
    app: {
      restorePreviousState: true
    }
  }
};

// AppCheckpointService will automatically:
// 1. Retrieve the latest checkpoint on startup
// 2. Restore the app state from that checkpoint
// 3. Save a checkpoint when the app stops
```

## Package Integration

### Installation with TokenRingApp

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

### Plugin Implementation

```typescript
import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {AgentLifecycleService} from "@tokenring-ai/lifecycle";
import {RpcService} from "@tokenring-ai/rpc";

import {z} from "zod";
import AgentCheckpointService from "./AgentCheckpointService.ts";
import AppCheckpointService from "./AppCheckpointService.ts";
import agentCommands from "./commands.ts";
import hooks from "./hooks.ts";
import packageJSON from "./package.json" with {type: "json"};
import checkpointRPC from "./rpc/checkpoint.ts";
import {CheckpointConfigSchema} from "./schema.ts";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema
});

export default {
  name: packageJSON.name,
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

## Storage Provider Implementations

The package defines the interfaces; storage providers are implemented by:

- Setting the provider directly via `setCheckpointProvider(provider)`
- Implementing the `AgentCheckpointStorage` or `AppCheckpointStorage` interface

**Example Agent Provider:**

```typescript
import type {AgentCheckpointStorage} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';

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
import type {AppCheckpointStorage} from '@tokenring-ai/checkpoint/AppCheckpointStorage';

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
      workingDirectory: cp.workingDirectory
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

## Best Practices

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
9. **Separate Providers**: Consider using separate providers for agent and app checkpoints

## Error Handling

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

## Testing

```bash
bun run test                  # Run tests
bun run test:watch            # Watch mode
bun run test:coverage         # Coverage report
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` - Application framework
- `@tokenring-ai/chat` - Chat service
- `@tokenring-ai/agent` - Agent framework
- `@tokenring-ai/lifecycle` - Lifecycle hooks
- `@tokenring-ai/utility` - Utility functions
- `@tokenring-ai/rpc` - RPC framework
- `zod` - Schema validation

### Development Dependencies

- `typescript` - Type checking
- `vitest` - Testing framework

## Package Details

- **Name**: @tokenring-ai/checkpoint
- **Version**: 0.2.0
- **License**: MIT
- **Dependencies**: @tokenring-ai/app, @tokenring-ai/chat, @tokenring-ai/agent, @tokenring-ai/lifecycle, @tokenring-ai/utility, @tokenring-ai/rpc, zod
- **Dev Dependencies**: typescript, vitest

## Related Components

- `@tokenring-ai/agent` - Core agent framework
- `@tokenring-ai/app` - Application framework
- `@tokenring-ai/rpc` - RPC framework
- `@tokenring-ai/lifecycle` - Lifecycle hooks

## License

MIT License - see `LICENSE` file for details.
