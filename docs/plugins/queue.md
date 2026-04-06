# Queue

## Overview

The `@tokenring-ai/queue` package provides a work queue system for managing and executing chat prompts in a batched manner. It leverages the Agent's state management and checkpoint system to preserve context between queued tasks, enabling efficient multi-prompt workflows. The package integrates seamlessly with the TokenRing agent framework, providing both programmatic and chat command interfaces for queue operations.

## Key Features

- **Queue Management**: Add, remove, and reorder work items with a simple API
- **Checkpoint-Based State**: Preserves agent state between queued tasks
- **Chat Command Interface**: Manage queues directly through `/queue` commands
- **Tool Access**: Programmatically add tasks via the `queue_addTaskToQueue` tool
- **State Persistence**: Automatic serialization and restoration of queue state
- **Queue Processing**: Start, load, execute, skip, and complete queued tasks
- **Configurable Queue Size**: Optional `maxSize` limit for bounded queues
- **Agent Integration**: Automatic registration with TokenRing agent framework
- **FIFO Processing**: First-in-first-out queue processing for reliable batch operations

## Core Components

### WorkQueueService

The main service class that implements the `TokenRingService` interface and manages work items.

**Constructor:**
```typescript
new WorkQueueService(options: ParsedWorkQueueConfig)
```

**Options:**
- `agentDefaults?: { maxSize?: number }` - Default configuration for agent state

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"WorkQueueService"` | Service identifier |
| `description` | `"Provides Work Queue functionality"` | Service description |

**Methods:**

#### Lifecycle Management Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `attach(agent)` | Initialize queue state on agent | `agent: Agent` | `void` |
| `startWork(agent)` | Start queue processing | `agent: Agent` | `void` |
| `stopWork(agent)` | Stop processing and clear current item | `agent: Agent` | `void` |
| `started(agent)` | Check if queue is active | `agent: Agent` | `boolean` |

#### Checkpoint Management Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `setInitialCheckpoint(checkpoint, agent)` | Set starting state checkpoint | `checkpoint: AgentCheckpointData`, `agent: Agent` | `void` |
| `getInitialCheckpoint(agent)` | Get initial checkpoint | `agent: Agent` | `AgentCheckpointData \| null` |

#### Queue Operation Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `enqueue(item, agent)` | Add item to queue | `item: QueueItem`, `agent: Agent` | `boolean` |
| `dequeue(agent)` | Remove and return front item | `agent: Agent` | `QueueItem \| undefined` |
| `get(idx, agent)` | Get item at index | `idx: number`, `agent: Agent` | `QueueItem` |
| `splice(start, deleteCount, agent, ...items)` | Modify queue like Array.splice | `start: number`, `deleteCount: number`, `agent: Agent`, `...items: QueueItem[]` | `QueueItem[]` |
| `size(agent)` | Get current queue length | `agent: Agent` | `number` |
| `isEmpty(agent)` | Check if queue is empty | `agent: Agent` | `boolean` |
| `clear(agent)` | Empty the queue | `agent: Agent` | `void` |
| `getAll(agent)` | Get copy of all items | `agent: Agent` | `QueueItem[]` |

#### Current Item Management Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getCurrentItem(agent)` | Get currently processing item | `agent: Agent` | `QueueItem \| null` |
| `setCurrentItem(item, agent)` | Set current processing item | `item: QueueItem \| null`, `agent: Agent` | `void` |

### State Slice: WorkQueueState

Manages the queue's internal state with persistence support. Implements `AgentStateSlice` for integration with the agent state system.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `QueueItem[]` | Array of queued work items |
| `started` | `boolean` | Whether queue processing has begun |
| `currentItem` | `QueueItem \| null` | Work item currently loaded for execution |
| `initialCheckpoint` | `AgentCheckpointData \| null` | Saved state at queue start |
| `maxSize` | `number \| null` | Maximum queue size (if configured) |
| `name` | `"WorkQueueState"` | State slice identifier |
| `serializationSchema` | `z.ZodSchema` | Zod schema for serialization |

**Queue Item Type:**
```typescript
interface QueueItem {
  checkpoint: AgentCheckpointData;  // Agent state checkpoint for restoration
  name: string;                     // Friendly name/description of task
  input: string;                    // Actual prompt content to execute
}
```

**Constructor:**
```typescript
new WorkQueueState(initialConfig: z.output<typeof WorkQueueAgentConfigSchema>)
```

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `reset()` | Reset all state components | None | `void` |
| `serialize()` | Convert state to plain object | None | `z.output<typeof serializationSchema>` |
| `deserialize(data)` | Restore state from plain object | `data: z.output<typeof serializationSchema>` | `void` |
| `show()` | Display current state in array form | None | `string[]` |

### Configuration Schemas

#### WorkQueueAgentConfigSchema

Agent-level configuration for queue size limits:

```typescript
import { z } from "zod";

export const WorkQueueAgentConfigSchema = z.object({
  maxSize: z.number().positive().optional(),
});
```

**Properties:**
- `maxSize?: number` - Optional: Maximum queue size (must be a positive number)

#### WorkQueueServiceConfigSchema

Plugin-level configuration with defaults:

```typescript
import { z } from "zod";

export const WorkQueueServiceConfigSchema = z.object({
  agentDefaults: z.object({
    maxSize: z.number().positive().optional(),
  }).prefault({})
});
```

**Properties:**
- `agentDefaults` - Default configuration for all agents
  - `agentDefaults.maxSize?: number` - Optional: Maximum queue size

**Type:**
```typescript
type ParsedWorkQueueConfig = z.output<typeof WorkQueueServiceConfigSchema>;
```

## Services

### WorkQueueService

The central service for queue operations with comprehensive state management.

**Service Registration:**
```typescript
import WorkQueueService from "@tokenring-ai/queue/WorkQueueService";

app.addServices(new WorkQueueService({
  agentDefaults: {
    maxSize: 50  // Optional: Maximum queue size
  }
}));
```

**Attachment to Agent:**
```typescript
const queueService = new WorkQueueService({ agentDefaults: {} });
queueService.attach(agent);  // Initializes WorkQueueState on agent
```

**State Access:**
```typescript
// Get state directly
const state = agent.getState(WorkQueueState);

// Mutate state
agent.mutateState(WorkQueueState, (state) => {
  state.started = true;
});
```

### Chat Commands

All `/queue` commands are registered with the `AgentCommandService` and are available through the chat interface. The commands are organized into two categories:

**Queue Management Commands:**
- `/queue add <prompt>` - Add a prompt to the queue
- `/queue remove --index <number>` - Remove a prompt at the given index
- `/queue details --index <number>` - Show details of a queue item
- `/queue clear` - Remove all prompts from the queue
- `/queue list` - Display all queued prompts

**Queue Processing Commands:**
- `/queue start` - Begin queue processing
- `/queue next` - Load the next queued item
- `/queue run` - Execute the currently loaded queued prompt
- `/queue skip` - Skip current item and re-add to end of queue
- `/queue done` - End queue processing and restore chat state

### `/queue list`

Display all queued prompts with their indices.

**Example:**
```bash
/queue list
```

**Output:**
```
Queue contents:
1. Write README for the project
2. Fix bugs in authentication module
3. Add unit tests for services
```

**Implementation Notes:**
- Uses `numberedList` utility from `@tokenring-ai/utility` to format output
- Shows only task names
- Returns "Queue is empty." if queue is empty

### `/queue add <prompt>`

Add a new chat prompt to the end of the queue.

**Example:**
```bash
/queue add 'Write a Python function to calculate Fibonacci numbers'
```

**Output:**
```
Added to queue. Queue length: 1
```

**Implementation Details:**
- Captures current agent state as checkpoint via `agent.generateCheckpoint()`
- Creates `QueueItem` with checkpoint, name (prompt), and input (prompt)
- Adds item to queue via `enqueue()`
- Returns updated queue length

**Input Schema:**
```typescript
{
  args: {},
  remainder: {name: "prompt", description: "Prompt to add to queue", required: true}
}
```

**Validation:**
- Requires remainder (prompt) to be provided
- Usage: `Usage: /queue add <prompt>`

### `/queue remove --index <number>`

Remove the prompt at the given zero-based index.

**Example:**
```bash
/queue remove --index 2
```

**Output:**
```
Removed "Fix bug in login" from queue. Remaining: 3
```

**Implementation Details:**
- Uses `splice()` to remove item at index
- Returns removed item name and remaining count

**Input Schema:**
```typescript
{
  args: {
    "--index": {
      type: "number",
      description: "Index of queue item",
      required: true,
      minimum: 0
    }
  }
}
```

**Validation:**
- Index must be >= 0 and < queue size
- Raises `CommandFailedError` for invalid indices

### `/queue details --index <number>`

Show detailed information about a specific queue item.

**Example:**
```bash
/queue details --index 0
```

**Output:**
```
Queue item details:
{
  "checkpoint": {...},
  "name": "Write README for the project",
  "input": "Write a comprehensive README covering all features..."
}
```

**Implementation Details:**
- Uses `JSON.stringify` with 2-space indentation
- Includes full item structure including checkpoint
- Shows checkpoint, name, and input

**Input Schema:**
```typescript
{
  args: {
    "--index": {
      type: "number",
      description: "Index of queue item",
      required: true,
      minimum: 0
    }
  }
}
```

**Validation:**
- Index must be >= 0 and < queue size
- Raises `CommandFailedError` for invalid indices

### `/queue clear`

Remove all prompts from the queue.

**Example:**
```bash
/queue clear
```

**Output:**
```
Queue cleared!
```

**Implementation Details:**
- Calls `queueService.clear(agent)`
- Sets queue array to empty

### `/queue start`

Begin queue processing. This command saves the current agent state as an initial checkpoint.

**Example:**
```bash
/queue start
```

**Output:**
```
Queue started, use /queue next to start working on the first item in the queue, or /queue done to end the queue.
```

**Process:**
1. Checks if queue is empty (returns error if empty)
2. Checks if queue is already started (returns message if already started)
3. Saves current agent state as initial checkpoint via `setInitialCheckpoint()`
4. Sets `started` flag to true via `startWork()`

**Error Cases:**
- Empty queue: "Queue is empty."
- Already started: "Queue already started. Use /queue next to load the next item in the queue, or queue done to end the queue."

### `/queue next`

Load the next queued item (does not execute it).

**Example:**
```bash
/queue next
```

**Output:**
```
Queue Item loaded: Write README for the project Use /queue run to run the queue item, and /queue next|skip|done to move on to the next item.
```

**Process:**
1. Checks if queue is started (returns error if not)
2. Dequeues the first item from the queue via `dequeue()`
3. Sets it as the current item via `setCurrentItem()`
4. Displays the item name with instructions for next steps

**Error Cases:**
- Queue not started: "Queue not started. Use /queue start to start the queue."
- Queue empty (when action is "done"): Restores initial state and returns "Queue complete."

### `/queue run`

Execute the currently loaded queued prompt.

**Example:**
```bash
/queue run
```

**Process:**
1. Checks if queue is started (returns error if not)
2. Checks if current item is loaded (returns error if not)
3. Restores agent state from the current item's checkpoint via `agent.restoreState()`
4. Retrieves chat service and chat config
5. Executes the chat command via `runChat()` from `@tokenring-ai/chat`
6. Includes try/catch error handling for failures

**Error Cases:**
- Queue not started: "Queue not started. Use /queue start to start the queue."
- No item loaded: "No queue item loaded. Use /queue next to load the next item..."
- Execution error: "Error running queued prompt: [error message]"

### `/queue skip`

Skip the current item and re-add it to the end of the queue.

**Example:**
```bash
/queue skip
```

**Output:**
```
Queue item skipped. It has been added to the end of the queue in case you would like to run it later, and you can use /queue next to load the next item in the queue, or /queue done to end the queue.
```

**Process:**
1. Checks if queue is started (returns error if not)
2. Checks if current item exists (returns error if not)
3. Re-adds the current item to the queue via `enqueue()`
4. Clears the current item via `setCurrentItem(null)`

**Error Cases:**
- Queue not started: "Queue not started. Use /queue start to start the queue."
- No item loaded: "No queue item loaded. Use /queue next to load the next item..."

### `/queue done`

End queue processing and restore the initial agent state.

**Example:**
```bash
/queue done
```

**Output:**
```
Restored chat state to preserved state.
```

**Process:**
1. Checks if queue is started (returns error if not)
2. Checks if queue is empty or action is "done"
3. Retrieves initial checkpoint via `getInitialCheckpoint()`
4. Restores agent state to initial checkpoint via `agent.restoreState()`
5. Stops work via `stopWork()`
6. Returns appropriate message

**Error Cases:**
- Queue not started: "Queue not started. Use /queue start to start the queue."
- No initial checkpoint: "Couldn't restore initial state, no initial checkpoint found"

### Command Help

The `/queue` command includes built-in help accessible when invalid subcommands are provided. The help text includes:

- Queue management commands (add, remove, details, clear, list)
- Queue processing commands (start, next, run, skip, done)
- Usage tips and examples
- Queue status information

## Tools

### queue_addTaskToQueue

Adds a task to the work queue for later execution.

**Tool Definition:**
```typescript
{
  name: "queue_addTaskToQueue",
  displayName: "Queue/addTaskToQueue",
  description: "Adds a task to the queue for later execution by the system."
}
```

**Input Schema:**
```typescript
import { z } from "zod";

const inputSchema = z.object({
  description: z.string().describe("A short description of the task to be performed"),
  content: z.string().describe(
    "A natural language string, explaining the exact task to be performed, in great detail. " +
    "This string will be used to prompt an AI agent as the next message in this conversation, " +
    "so should be as detailed as possible, and should directly order the AI agent to execute " +
    "the task, using the tools that are available to it."
  ),
});
```

**Returns:**
```typescript
{
  type: "json",
  data: {
    status: "queued",
    message: "Task has been queued for later execution."
  }
}
```

**Error Cases:**
- Throws error if `description` is not provided
- Throws error if `content` is not provided

**Output Handling:**
- Uses `agent.infoMessage()` to prefix output with tool name
- Example: `[queue_addTaskToQueue] Added task "Analyze dependencies" to queue`

**Usage Example:**
```typescript
// Via tool
const result = await agent.executeTool('queue_addTaskToQueue', {
  description: "Analyze dependencies",
  content: "Use the filesystem-tools to find all npm dependencies in the project and create a breakdown report."
});

console.log(result);
// { type: "json", data: { status: "queued", message: "Task has been queued for later execution." } }
```

## Integration

### Plugin Configuration

The package has a configuration schema with optional `agentDefaults` for queue size limits:

```typescript
// In plugin.ts
import { z } from "zod";
import { WorkQueueServiceConfigSchema } from "./schema";

const packageConfigSchema = z.object({
  queue: WorkQueueServiceConfigSchema.prefault({})
});
```

**Plugin Installation:**
```typescript
import queuePlugin from "@tokenring-ai/queue/plugin";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp();

// Configure with optional queue size limit
app.install(queuePlugin, {
  queue: {
    agentDefaults: {
      maxSize: 50  // Optional: Maximum number of items in the queue
    }
  }
});
```

### Agent Configuration

The queue service can be configured at the agent level:

```typescript
import Agent from "@tokenring-ai/agent";

const agentConfig = {
  queue: {
    maxSize: 100  // Override default queue size for this agent
  }
};

const agent = new Agent(app, { config: agentConfig, headless: false });
```

**Agent Configuration Schema:**
```typescript
{
  queue: {
    maxSize?: number  // Optional: Maximum queue size for this agent
  }
}
```

### Service Registration

The service is automatically registered in the plugin:

```typescript
// In plugin.ts
import WorkQueueService from "./WorkQueueService.js";

export default {
  name: "@tokenring-ai/queue",
  install(app, config) {
    app.addServices(new WorkQueueService(config.queue));
  }
};
```

**Manual Registration:**
```typescript
import WorkQueueService from "@tokenring-ai/queue/WorkQueueService";

const queueService = new WorkQueueService({
  agentDefaults: {
    maxSize: 50
  }
});

app.addServices(queueService);
```

### Tool Registration

The tool is automatically registered with the chat service:

```typescript
// In plugin.ts
import tools from "./tools";

app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
```

**Manual Registration:**
```typescript
import tools from "@tokenring-ai/queue/tools";

const chatService = agent.requireServiceByType(ChatService);
chatService.addTools(tools);
```

### Command Registration

The chat commands are automatically registered with the agent command service:

```typescript
// In plugin.ts
import agentCommands from "./commands";

app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(agentCommands)
);
```

**Manual Registration:**
```typescript
import agentCommands from "@tokenring-ai/queue/commands";

const agentCommandService = agent.requireServiceByType(AgentCommandService);
agentCommandService.addAgentCommands(agentCommands);
```

## Usage Examples

### Basic Queue Operations

```typescript
import WorkQueueService from "@tokenring-ai/queue";
import { WorkQueueState } from "@tokenring-ai/queue/state/workQueueState";

// Create service with optional size limit
const queueService = new WorkQueueService({ 
  agentDefaults: { maxSize: 10 } 
});

// Attach to agent (initializes state)
queueService.attach(agent);

// Add items to queue
const item = {
  checkpoint: agent.generateCheckpoint(),
  name: "Generate report",
  input: "Create a comprehensive sales report for Q4."
};

const added = queueService.enqueue(item, agent);
console.log(`Item added: ${added}`);

// Process queue
queueService.startWork(agent);
const nextItem = queueService.dequeue(agent);
console.log(`Processing: ${nextItem?.name}`);
```

### Interactive Queue Processing

```bash
# Build queue interactively
/queue add "Analyze user behavior patterns"
/queue add "Generate monthly metrics"
/queue add "Update dashboard data"

# Review the queue
/queue list

# Start processing
/queue start

# Process items one by one
/queue next
/queue run    # Execute task 1

/queue next
/queue run    # Execute task 2

# Skip an item for later
/queue skip

# Continue with remaining items
/queue next
/queue run

# Complete processing
/queue done   # Restore original state
```

### Programmatic Task Addition

```typescript
import Agent from "@tokenring-ai/agent";
import tools from "@tokenring-ai/queue/tools";

// Using the tool programmatically
const result = await tools.addTaskToQueue.execute({
  description: "Data analysis task",
  content: "Analyze the sales data from last quarter and identify trends, anomalies, and recommendations for improvement. Use all available data analysis tools."
}, agent);

console.log(result);
// { type: "json", data: { status: "queued", message: "Task has been queued for later execution." } }
```

### State Preservation and Restoration

```bash
# Queue processing preserves original state
/queue start  # Saves current agent state

# Process multiple items
/queue next
/queue run    # Each item can modify state temporarily

# Restore original state
/queue done   # Returns to saved state
```

### Removing and Inspecting Queue Items

```bash
# Add items to queue
/queue add "Task 1: Generate report"
/queue add "Task 2: Update metrics"
/queue add "Task 3: Send notifications"

# View queue contents
/queue list
# Output:
# Queue contents:
# 1. Task 1: Generate report
# 2. Task 2: Update metrics
# 3. Task 3: Send notifications

# Check details of a specific item
/queue details 1
# Output:
# Queue item details:
# {
#   "checkpoint": {...},
#   "name": "Task 2: Update metrics",
#   "input": "Task 2: Update metrics"
# }

# Remove an item from the queue
/queue remove 1
# Output:
# Removed "Task 2: Update metrics" from queue. Remaining: 2
```

### Queue with Size Limits

```typescript
import WorkQueueService from "@tokenring-ai/queue/WorkQueueService";
import { WorkQueueState } from "@tokenring-ai/queue/state/workQueueState";

// Create service with size limit
const boundedQueue = new WorkQueueService({
  agentDefaults: { maxSize: 5 }
});

boundedQueue.attach(agent);

// Add items
for (let i = 0; i < 7; i++) {
  const item = {
    checkpoint: agent.generateCheckpoint(),
    name: `Task ${i}`,
    input: `Process task ${i}`
  };
  
  const added = boundedQueue.enqueue(item, agent);
  console.log(`Task ${i} added: ${added}`);
  // Tasks 0-4 will be added (true), tasks 5-6 will fail (false)
}

// Check queue size through state
const state = agent.getState(WorkQueueState);
console.log(`Queue size: ${state.queue.length}`);  // 5
console.log(`Max size: ${state.maxSize}`);  // 5
```

### Advanced: Loading and Processing Items

```typescript
import WorkQueueService from "@tokenring-ai/queue/WorkQueueService";
import { ChatService } from "@tokenring-ai/chat";
import runChat from "@tokenring-ai/chat/runChat";

// Add items to queue with meaningful names
queueService.enqueue({ 
  checkpoint: agent.generateCheckpoint(), 
  name: "Task 1", 
  input: "Generate user documentation" 
}, agent);

queueService.enqueue({ 
  checkpoint: agent.generateCheckpoint(), 
  name: "Task 2", 
  input: "Write unit tests for user module" 
}, agent);

// Start queue
queueService.startWork(agent);
queueService.setInitialCheckpoint(agent.generateCheckpoint(), agent);

// Load and process items
while (true) {
  const next = queueService.dequeue(agent);
  if (!next) break;

  queueService.setCurrentItem(next, agent);

  // Activate the item's chat context
  agent.restoreState(next.checkpoint.state);

  // Get chat service and execute
  const chatService = agent.requireServiceByType(ChatService);
  const chatConfig = chatService.getChatConfig(agent);

  try {
    await runChat(next.input, chatConfig, agent);
  } catch (error: any) {
    agent.errorMessage("Error running queued prompt: " + (error.message || error));
  }
}

// Restore initial state
queueService.stopWork(agent);
const initial = queueService.getInitialCheckpoint(agent);
if (initial) {
  agent.restoreState(initial.state);
}
```

## Configuration

### Plugin Configuration

```typescript
import queuePlugin from "@tokenring-ai/queue/plugin";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp();

// Basic queue with unlimited size
app.install(queuePlugin, {
  queue: {
    agentDefaults: {}
  }
});

// Queue with size limit
app.install(queuePlugin, {
  queue: {
    agentDefaults: {
      maxSize: 50
    }
  }
});
```

### Agent Configuration

```typescript
import Agent from "@tokenring-ai/agent";

// Configure queue size at the agent level
const agentConfig = {
  queue: {
    maxSize: 100
  }
};

const agent = new Agent(app, { config: agentConfig, headless: false });
```

## State Management

### Serialization

The queue state is automatically serialized using a Zod schema:

```typescript
import { z } from "zod";

const serializationSchema = z.object({
  queue: z.array(z.object({
    checkpoint: z.any(),
    name: z.string(),
    input: z.string()
  })),
  started: z.boolean(),
  currentItem: z.any().nullable(),
  initialCheckpoint: z.any().nullable(),
  maxSize: z.number().nullable()
});
```

**When serialized:**
- Queue items maintain their checkpoint references
- Processing state (started, currentItem) is preserved
- Initial checkpoint is kept for restoration
- Queue size limit is preserved

**State structure:**
```typescript
interface SerializedWorkQueueState {
  queue: QueueItem[];
  started: boolean;
  currentItem: QueueItem | null;
  initialCheckpoint: AgentCheckpointData | null;
  maxSize: number | null;
}
```

### Reset Behavior

The `reset()` method clears all queue state components:

```typescript
// Reset all state
state.reset();

// This clears:
// - queue array
// - started flag
// - currentItem
// - initialCheckpoint
```

**Reset behavior:**
- Clears all state components unconditionally
- Does not accept parameters
- Resets queue, started, currentItem, and initialCheckpoint

### Checkpoint Integration

The queue uses checkpoints for state preservation:

- **Initial Checkpoint**: Created when queue is started via `setInitialCheckpoint()`
- **Item Checkpoints**: Each queue item stores its own checkpoint when added

**Checkpoint Flow:**
```typescript
// When /queue start is called
queueService.setInitialCheckpoint(agent.generateCheckpoint(), agent);

// When adding items via /queue add
queueService.enqueue({
  checkpoint: agent.generateCheckpoint(),
  name: prompt,
  input: prompt
}, agent);
```

### State Circular References

The serialization schema uses `z.any()` for checkpoint fields to handle circular references that naturally exist in the `AgentCheckpointData` structure, ensuring successful serialization.

## Best Practices

### Queue Organization

1. **Descriptive Names**: Use clear, descriptive names for queue items
2. **Logical Ordering**: Sort tasks logically (e.g., write → test → deploy)
3. **Batch Related Tasks**: Group related operations together

**Example:**
```bash
/queue add 'Analyze user behavior'
/queue add 'Generate monthly reports'
/queue add 'Update dashboard queries'
```

### Error Handling

1. **Try/Catch in Commands**: All `/queue run` commands include error handling
2. **Checkpoint Recovery**: System attempts to restore initial state even after errors
3. **Manual Recovery**: Use `/queue done` to restore state if automation fails

### Performance Considerations

1. **MaxSize Option**: Set `maxSize` to prevent memory issues with very large queues
2. **Batch Processing**: Queue is more efficient than executing prompts one-by-one
3. **State Efficiency**: Checkpoint system provides good balance between speed and state capture

### Usage Patterns

1. **Seed the Queue**: Add multiple tasks before starting processing
2. **Process Incrementally**: Load and execute items iteratively to monitor progress
3. **Handle Interruptions**: Use `/queue next` and `/queue skip` to manage unexpected issues
4. **Preserve Context**: Queue maintains full conversation context between tasks

### Checkpoint Strategy

1. **Start Checkpoint**: Enable state restoration after successful completion
2. **Item Checkpoints**: Each item preserves its state for execution context
3. **Error Recovery**: System attempts auto-recovery using checkpoints

### Queue Size Management

1. **Set maxSize**: Configure queue size limits to prevent unbounded memory usage
2. **Monitor Queue Size**: Use `/queue list` and `size()` to monitor queue growth
3. **Regular Processing**: Process queue items regularly to prevent accumulation

## Troubleshooting

### Queue Empty

**Problem**: Queue appears empty but not processing

**Solution:**
- Verify with `/queue list` to confirm items exist
- Check that `/queue start` was called
- Ensure no items were accidentally cleared

### Not Started

**Problem**: Cannot load items from queue

**Solution:**
- Run `/queue start` to begin queue processing
- Check queue is not empty with `/queue list`

### State Restoration Issues

**Problem**: State not restored after completing queue

**Solution:**
- Verify initial checkpoint was saved with `/queue start`
- Check for errors during checkpoint creation
- Manually restore using `/queue done`

### Index Out of Range

**Problem**: Remove operation fails with index error

**Solution:**
- Use `/queue list` to get current queue indices
- Ensure index is 0-based and within queue size
- Check for queue changes between add and remove

### Tool Parameter Errors

**Problem**: `queue_addTaskToQueue` throws errors about missing parameters

**Solution:**
- Ensure both `description` and `content` parameters are provided
- Check parameter schema for type requirements
- Verify string inputs are not empty

### Queue Items Not Processing

**Problem**: After `/queue next`, items don't process

**Solution:**
- Ensure `/queue start` was called before processing
- Verify items were added with `/queue add`
- Check queue with `/queue list` to confirm items exist

### Queue Full

**Problem**: Cannot add more items to queue

**Solution:**
- Check `maxSize` configuration
- Process or remove items to make space
- Increase `maxSize` if needed

## Testing

### Unit Tests

The package includes comprehensive unit tests using `vitest`:

**Test File:** `pkg/queue/test/WorkQueueService.test.ts`

**Test Setup:**
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import WorkQueueService from "@tokenring-ai/queue/WorkQueueService";
import { WorkQueueState } from "@tokenring-ai/queue/state/workQueueState";
import createTestingAgent from "@tokenring-ai/agent/test/createTestingAgent";
import createTestingApp from "@tokenring-ai/app/test/createTestingApp";

describe("WorkQueueService", () => {
  let app;
  let workQueueService;
  let agent;

  beforeEach(() => {
    app = createTestingApp();
    agent = createTestingAgent(app);
    workQueueService = new WorkQueueService({ agentDefaults: {} });
    app.addServices(workQueueService);
    workQueueService.attach(agent);
  });

  // Tests follow...
});
```

### Test Examples

**Test 1: Initialize with default parameters**
```typescript
it("should initialize with default parameters", () => {
  const state = agent.getState(WorkQueueState);
  expect(state.queue).toEqual([]);
});
```

**Test 2: Initialize with maxSize parameter**
```typescript
it("should initialize with maxSize parameter", () => {
  const maxSize = 5;
  workQueueService = new WorkQueueService({ agentDefaults: { maxSize } });
  workQueueService.attach(agent);
  
  const state = agent.getState(WorkQueueState);
  expect(state.maxSize).toBe(maxSize);
});
```

**Test 3: Enqueue with unlimited queue**
```typescript
it("should add items to an unlimited queue", () => {
  const item1 = { name: "item1", checkpoint: {}, input: "" };
  const item2 = { name: "item2", checkpoint: {}, input: "" };
  
  const result1 = workQueueService.enqueue(item1, agent);
  const result2 = workQueueService.enqueue(item2, agent);
  
  expect(result1).toBe(true);
  expect(result2).toBe(true);
  expect(workQueueService.size(agent)).toBe(2);
});
```

**Test 4: Enqueue with size limit**
```typescript
it("should respect maxSize when adding items", () => {
  const boundedService = new WorkQueueService({ agentDefaults: { maxSize: 2 } });
  boundedService.attach(agent);
  
  const item1 = { name: "item1", checkpoint: {}, input: "" };
  const item2 = { name: "item2", checkpoint: {}, input: "" };
  const item3 = { name: "item3", checkpoint: {}, input: "" };
  
  expect(boundedService.enqueue(item1, agent)).toBe(true);
  expect(boundedService.enqueue(item2, agent)).toBe(true);
  expect(boundedService.enqueue(item3, agent)).toBe(false); // Queue full
});
```

**Test 5: Dequeue from empty queue**
```typescript
it("should return undefined when dequeuing from empty queue", () => {
  const result = workQueueService.dequeue(agent);
  expect(result).toBeUndefined();
});
```

**Test 6: Queue state management**
```typescript
it("should correctly manage queue state", () => {
  // Test start/started
  expect(workQueueService.started(agent)).toBe(false);
  workQueueService.startWork(agent);
  expect(workQueueService.started(agent)).toBe(true);
  
  // Test current item
  const item = { name: "test-item", checkpoint: {}, input: "" };
  expect(workQueueService.getCurrentItem(agent)).toBeNull();
  workQueueService.setCurrentItem(item, agent);
  expect(workQueueService.getCurrentItem(agent)).toBe(item);
});
```

**Test 7: Queue manipulation**
```typescript
it("should correctly manipulate queue contents", () => {
  const item1 = { name: "item1", checkpoint: {}, input: "" };
  const item2 = { name: "item2", checkpoint: {}, input: "" };
  const item3 = { name: "item3", checkpoint: {}, input: "" };
  
  // Enqueue and size
  workQueueService.enqueue(item1, agent);
  workQueueService.enqueue(item2, agent);
  workQueueService.enqueue(item3, agent);
  expect(workQueueService.size(agent)).toBe(3);
  expect(workQueueService.isEmpty(agent)).toBe(false);
  
  // Get item
  expect(workQueueService.get(1, agent)).toBe(item2);
  
  // Get all (returns copy)
  const all = workQueueService.getAll(agent);
  expect(all).toEqual([item1, item2, item3]);
  expect(all).not.toBe(workQueueService.getAll(agent));
  
  // Splice
  const removed = workQueueService.splice(1, 1, agent);
  expect(removed).toEqual([item2]);
  expect(workQueueService.size(agent)).toBe(2);
  
  // Dequeue
  const dequeued = workQueueService.dequeue(agent);
  expect(dequeued).toBe(item1);
  
  // Clear
  workQueueService.clear(agent);
  expect(workQueueService.isEmpty(agent)).toBe(true);
});
```

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Package Structure

```
@tokenring-ai/queue/
├── plugin.ts                      # Plugin registration and service setup
├── package.json                   # Package metadata and dependencies
├── index.ts                       # Service exports
├── WorkQueueService.ts            # Main service class
├── commands.ts                    # Command exports
├── tools.ts                       # Tool exports
├── schema.ts                      # Configuration schemas
├── commands/
│   └── queue/                     # Queue command implementations
│       ├── add.ts                 # /queue add command
│       ├── remove.ts              # /queue remove command
│       ├── details.ts             # /queue details command
│       ├── clear.ts               # /queue clear command
│       ├── list.ts                # /queue list command
│       ├── start.ts               # /queue start command
│       ├── next-done.ts           # /queue next and /queue done commands
│       ├── skip.ts                # /queue skip command
│       └── run.ts                 # /queue run command
├── tools/
│   └── addTaskToQueue.ts          # addTaskToQueue tool
├── state/
│   └── workQueueState.ts          # WorkQueueState implementation
├── test/
│   └── WorkQueueService.test.ts   # Unit tests
└── vitest.config.ts               # Test configuration
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent`: Agent framework and state management
- `@tokenring-ai/app`: Application framework and plugin system
- `@tokenring-ai/chat`: Chat service for command execution (`runChat`)
- `@tokenring-ai/utility`: Shared utilities including `deepMerge` and `numberedList`
- `zod`: Schema validation and configuration

### Development Dependencies

- `typescript`: TypeScript compiler
- `vitest`: Unit testing framework

## Plugin Registration

The plugin automatically registers:

1. **Tools**: Adds `queue_addTaskToQueue` tool to chat service
2. **Agent Commands**: Registers `/queue` commands with `AgentCommandService`
3. **Services**: Registers `WorkQueueService` with app

```typescript
// plugin.ts
import { AgentCommandService } from "@tokenring-ai/agent";
import { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";

import agentCommands from "./commands";
import packageJSON from "./package.json" with {type: "json"};
import { WorkQueueServiceConfigSchema } from "./schema";
import tools from "./tools";
import WorkQueueService from "./WorkQueueService.js";

const packageConfigSchema = z.object({
  queue: WorkQueueServiceConfigSchema.prefault({})
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // Register tools with chat service
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    
    // Register commands with agent command service
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(agentCommands)
    );
    
    // Register service
    app.addServices(new WorkQueueService(config.queue));
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## API Reference

### WorkQueueService

#### Constructor

```typescript
new WorkQueueService(options: ParsedWorkQueueConfig)
```

Creates a new WorkQueueService instance.

**Parameters:**
- `options` (ParsedWorkQueueConfig): Service configuration options
  - `options.agentDefaults` (object): Default configuration for agents
    - `options.agentDefaults.maxSize` (number, optional): Maximum queue size

#### attach

```typescript
attach(agent: Agent): void
```

Initializes queue state on the agent.

**Parameters:**
- `agent` (Agent): The agent to attach to

#### startWork

```typescript
startWork(agent: Agent): void
```

Starts queue processing.

**Parameters:**
- `agent` (Agent): The agent to start processing for

#### stopWork

```typescript
stopWork(agent: Agent): void
```

Stops queue processing and clears current item.

**Parameters:**
- `agent` (Agent): The agent to stop processing for

#### started

```typescript
started(agent: Agent): boolean
```

Checks if queue processing is active.

**Parameters:**
- `agent` (Agent): The agent to check

**Returns:**
- `boolean`: True if queue processing is active

#### setInitialCheckpoint

```typescript
setInitialCheckpoint(checkpoint: AgentCheckpointData, agent: Agent): void
```

Sets the initial checkpoint for the queue.

**Parameters:**
- `checkpoint` (AgentCheckpointData): The checkpoint to set
- `agent` (Agent): The agent to set checkpoint for

#### getInitialCheckpoint

```typescript
getInitialCheckpoint(agent: Agent): AgentCheckpointData | null
```

Gets the initial checkpoint for the queue.

**Parameters:**
- `agent` (Agent): The agent to get checkpoint for

**Returns:**
- `AgentCheckpointData | null`: The initial checkpoint or null

#### getCurrentItem

```typescript
getCurrentItem(agent: Agent): QueueItem | null
```

Gets the current item being processed.

**Parameters:**
- `agent` (Agent): The agent to get current item for

**Returns:**
- `QueueItem | null`: The current item or null

#### setCurrentItem

```typescript
setCurrentItem(item: QueueItem | null, agent: Agent): void
```

Sets the current item being processed.

**Parameters:**
- `item` (QueueItem | null): The item to set or null to clear
- `agent` (Agent): The agent to set current item for

#### enqueue

```typescript
enqueue(item: QueueItem, agent: Agent): boolean
```

Adds a work item to the end of the queue.

**Parameters:**
- `item` (QueueItem): The item to add
- `agent` (Agent): The agent to add item to

**Returns:**
- `boolean`: True if item was added, false if queue is full

#### dequeue

```typescript
dequeue(agent: Agent): QueueItem | undefined
```

Removes and returns the first item from the queue.

**Parameters:**
- `agent` (Agent): The agent to remove item from

**Returns:**
- `QueueItem | undefined`: The removed item or undefined if queue is empty

#### get

```typescript
get(idx: number, agent: Agent): QueueItem
```

Gets the item at the specified index.

**Parameters:**
- `idx` (number): The index of the item
- `agent` (Agent): The agent to get item from

**Returns:**
- `QueueItem`: The item at the specified index

#### splice

```typescript
splice(start: number, deleteCount: number, agent: Agent, ...items: QueueItem[]): QueueItem[]
```

Modifies the queue by removing or replacing items.

**Parameters:**
- `start` (number): The index to start modification
- `deleteCount` (number): The number of items to delete
- `agent` (Agent): The agent to modify
- `...items` (QueueItem[]): Items to insert

**Returns:**
- `QueueItem[]`: The removed items

#### size

```typescript
size(agent: Agent): number
```

Returns the current size of the queue.

**Parameters:**
- `agent` (Agent): The agent to get size for

**Returns:**
- `number`: The current queue size

#### isEmpty

```typescript
isEmpty(agent: Agent): boolean
```

Checks if the queue is empty.

**Parameters:**
- `agent` (Agent): The agent to check

**Returns:**
- `boolean`: True if queue is empty

#### clear

```typescript
clear(agent: Agent): void
```

Clears all items from the queue.

**Parameters:**
- `agent` (Agent): The agent to clear

#### getAll

```typescript
getAll(agent: Agent): QueueItem[]
```

Returns all items in the queue without removing them.

**Parameters:**
- `agent` (Agent): The agent to get items from

**Returns:**
- `QueueItem[]`: Copy of all queue items

## Related Components

- **@tokenring-ai/agent**: Core agent framework used for state management
- **@tokenring-ai/app**: Application framework for plugin registration
- **@tokenring-ai/chat**: Chat service for command execution
- **@tokenring-ai/utility**: Utility functions including `deepMerge` and `numberedList`

## License

MIT License - see LICENSE file for details.
