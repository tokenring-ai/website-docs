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
saveAgentCheckpoint(name: string, agent: Agent): Promise&lt;string&gt;

// Restore agent from checkpoint
restoreAgentCheckpoint(id: string, agent: Agent): Promise&lt;void&gt;

// List all available checkpoints
listCheckpoints(agent: Agent): Promise&lt;AgentCheckpointListItem[]&gt;
```

**Example Usage:**

```typescript
import &#123; AgentCheckpointService &#125; from '@tokenring-ai/checkpoint';
import &#123; Agent &#125; from '@tokenring-ai/agent';

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
export interface AgentCheckpointProvider &#123;
  // Save checkpoint and return its ID
  storeCheckpoint(data: NamedAgentCheckpoint): Promise&lt;string&gt;;

  // Retrieve checkpoint by ID
  retrieveCheckpoint(id: string): Promise&lt;StoredAgentCheckpoint | null&gt;;

  // List all stored checkpoints (without state data)
  listCheckpoints(): Promise&lt;AgentCheckpointListItem[]&gt;;
&#125;
```

**Data Structures:**

```typescript
// Checkpoint with name
export interface NamedAgentCheckpoint extends AgentCheckpointData &#123;
  name: string;
&#125;

// Checkpoint with storage ID
export interface StoredAgentCheckpoint extends NamedAgentCheckpoint &#123;
  id: string;
&#125;

// Checkpoint listing item (minimal info)
export type AgentCheckpointListItem = Omit&lt;StoredAgentCheckpoint, "state" | "config"&gt;;
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
import &#123; z &#125; from "zod";

export const CheckpointConfigSchema = z.object(&#123;
  provider: z.looseObject(&#123;
    type: z.string()
  &#125;)
&#125;);
```

**Example Configuration:**

```javascript
export default &#123;
  checkpoint: &#123;
    provider: &#123;
      type: "memory",
      // Additional provider-specific properties can be included here
    &#125;
  &#125;
&#125;;
```

**Important Note:**

The checkpoint plugin does not automatically create storage providers based on configuration. Users must implement their own storage providers by implementing the `AgentCheckpointProvider` interface and set it using the `setCheckpointProvider` method of the `AgentCheckpointService`.

## Storage Provider Implementations

The checkpoint plugin defines the `AgentCheckpointProvider` interface, but does not include built-in storage providers. Users must implement their own storage providers.

**Example Implementation: Memory Provider**

```typescript
import type &#123; AgentCheckpointProvider, NamedAgentCheckpoint, StoredAgentCheckpoint, AgentCheckpointListItem &#125; from '@tokenring-ai/checkpoint';

class MemoryProvider implements AgentCheckpointProvider &#123;
  private checkpoints = new Map&lt;string, StoredAgentCheckpoint&gt;();

  async storeCheckpoint(data: NamedAgentCheckpoint): Promise&lt;string&gt; &#123;
    const id = crypto.randomUUID();
    const checkpoint = &#123;
      ...data,
      id,
    &#125;;
    this.checkpoints.set(id, checkpoint);
    return id;
  &#125;

  async retrieveCheckpoint(id: string): Promise&lt;StoredAgentCheckpoint | null&gt; &#123;
    return this.checkpoints.get(id) || null;
  &#125;

  async listCheckpoints(): Promise&lt;AgentCheckpointListItem[]&gt; &#123;
    return Array.from(this.checkpoints.values()).map(cp =&gt; (&#123;
      id: cp.id,
      name: cp.name,
      agentId: cp.agentId,
      createdAt: cp.createdAt
    &#125;));
  &#125;
&#125;
```

**Database Provider Example** (conceptual):

```typescript
class DatabaseProvider implements AgentCheckpointProvider &#123;
  constructor(private connectionString: string) &#123;&#125;

  async storeCheckpoint(data: NamedAgentCheckpoint): Promise&lt;string&gt; &#123;
    // Save to database and return ID
  &#125;

  async retrieveCheckpoint(id: string): Promise&lt;StoredAgentCheckpoint | null&gt; &#123;
    // Retrieve from database
  &#125;

  async listCheckpoints(): Promise&lt;AgentCheckpointListItem[]&gt; &#123;
    // Query database for checkpoint listings
  &#125;
&#125;
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

#### `restore &lt;id&gt;`

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
&#123;
  "method": "listCheckpoints",
  "params": &#123;&#125;
&#125;
```

**Response:**
```json
&#123;
  "result": [
    &#123;
      "id": "checkpoint-123",
      "name": "Before Feature Implementation",
      "agentId": "agent-456",
      "createdAt": 1640995200000
    &#125;
  ]
&#125;
```

### `getCheckpoint`

Retrieve a specific checkpoint with full state data.

**Request:**
```json
&#123;
  "method": "getCheckpoint",
  "params": &#123;
    "id": "checkpoint-123"
  &#125;
&#125;
```

**Response:**
```json
&#123;
  "result": &#123;
    "id": "checkpoint-123",
    "name": "Before Feature Implementation",
    "agentId": "agent-456",
    "createdAt": 1640995200000,
    "state": &#123;
      "AgentEventState": &#123;...&#125;,
      "CommandHistoryState": &#123;...&#125;,
      "CostTrackingState": &#123;...&#125;,
      "HooksState": &#123;...&#125;
    &#125;
  &#125;
&#125;
```

### `launchAgentFromCheckpoint`

Create a new agent from a checkpoint.

**Request:**
```json
&#123;
  "method": "launchAgentFromCheckpoint",
  "params": &#123;
    "checkpointId": "checkpoint-123",
    "headless": false
  &#125;
&#125;
```

**Response:**
```json
&#123;
  "result": &#123;
    "agentId": "agent-789",
    "agentName": "Restored Agent",
    "agentType": "default"
  &#125;
&#125;
```

## Usage Examples

### Basic Checkpoint Workflow

```typescript
import &#123; AgentCheckpointService &#125; from '@tokenring-ai/checkpoint';
import &#123; Agent &#125; from '@tokenring-ai/agent';

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
console.log(`Total checkpoints: $&#123;all.length&#125;`);

// Restore from earlier checkpoint
await checkpointService.restoreAgentCheckpoint(id1, agent);
```

### Custom Storage Provider

```typescript
import type &#123; AgentCheckpointProvider, NamedAgentCheckpoint, StoredAgentCheckpoint, AgentCheckpointListItem &#125; from '@tokenring-ai/checkpoint';

class CustomProvider implements AgentCheckpointProvider &#123;
  private checkpoints = new Map&lt;string, StoredAgentCheckpoint&gt;();

  async storeCheckpoint(data: NamedAgentCheckpoint): Promise&lt;string&gt; &#123;
    const id = crypto.randomUUID();
    this.checkpoints.set(id, &#123;
      ...data,
      id,
    &#125;);
    return id;
  &#125;

  async retrieveCheckpoint(id: string): Promise&lt;StoredAgentCheckpoint | null&gt; &#123;
    return this.checkpoints.get(id) || null;
  &#125;

  async listCheckpoints(): Promise&lt;AgentCheckpointListItem[]&gt; &#123;
    return Array.from(this.checkpoints.values()).map(cp =&gt; (&#123;
      id: cp.id,
      name: cp.name,
      agentId: cp.agentId,
      createdAt: cp.createdAt
    &#125;));
  &#125;
&#125;

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
const response = await fetch('/rpc/checkpoint', &#123;
  method: 'POST',
  headers: &#123; 'Content-Type': 'application/json' &#125;,
  body: JSON.stringify(&#123;
    method: 'listCheckpoints',
    params: &#123;&#125;
  &#125;)
&#125;);

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
import &#123;AgentCommandService, AgentLifecycleService&#125; from "@tokenring-ai/agent";
import &#123;TokenRingPlugin&#125; from "@tokenring-ai/app";
import &#123;WebHostService&#125; from "@tokenring-ai/web-host";
import JsonRpcResource from "@tokenring-ai/web-host/JsonRpcResource";

import &#123;z&#125; from "zod";
import AgentCheckpointService from "./AgentCheckpointService.ts";
import chatCommands from "./chatCommands.ts";
import hooks from "./hooks.ts";
import &#123;CheckpointConfigSchema&#125; from "./schema.ts";
import packageJSON from "./package.json" with &#123;type: "json"&#125;;
import checkpointRPC from "./rpc/checkpoint.ts";

const packageConfigSchema = z.object(&#123;
  checkpoint: CheckpointConfigSchema
&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    const checkpointService = new AgentCheckpointService(config.checkpoint);
    app.addServices(checkpointService);

    app.waitForService(AgentCommandService, agentCommandService =&gt;
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.waitForService(AgentLifecycleService, lifecycleService =&gt;
      lifecycleService.addHooks(packageJSON.name, hooks)
    );
    app.waitForService(WebHostService, webHostService =&gt; &#123;
      webHostService.registerResource("Checkpoint RPC endpoint", new JsonRpcResource(app, checkpointRPC));
    &#125;);
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
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
try &#123;
  await checkpointService.restoreAgentCheckpoint(id, agent);
  agent.infoLine(`Checkpoint $&#123;id&#125; restored`);
&#125; catch (error) &#123;
  agent.errorLine(`Failed to restore checkpoint: $&#123;error&#125;`);
  // Agent state remains unchanged
&#125;
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
