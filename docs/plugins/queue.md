# Queue

## Overview

The Queue package provides a work queue system for managing and executing chat prompts in a batched manner. It leverages the Agent's state management and checkpoint system to preserve context between queued tasks, enabling efficient multi-prompt workflows.

## Key Features

- **Queue Management**: Add, remove, and reorder work items with a simple API
- **Checkpoint-Based State**: Preserves agent state between queued tasks
- **Chat Command Interface**: Manage queues directly through chat commands
- **Tool Access**: Programmatically add tasks via tools
- **State Persistence**: Automatic serialization and restoration of queue state
- **Queue Processing**: Start, load, execute, skip, and complete queued tasks
- **Configurable Queue Size**: Optional maxSize limit for bounded queues
- **Agent Integration**: Automatic registration with TokenRing agent framework

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
| `name` | `string` | Service name ("WorkQueueService") |
| `description` | `string` | Service description |
| `options` | `ParsedWorkQueueConfig` | Service configuration options |

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

Manages the queue's internal state with persistence support.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `QueueItem[]` | Array of queued work items |
| `started` | `boolean` | Whether queue processing has begun |
| `currentItem` | `QueueItem \| null` | Work item currently loaded for execution |
| `initialCheckpoint` | `AgentCheckpointData \| null` | Saved state at queue start |
| `maxSize` | `number \| null` | Maximum queue size (if configured) |

**Queue Item Type:**
```typescript
interface QueueItem {
  checkpoint: AgentCheckpointData;  // Agent state checkpoint for restoration
  name: string;                     // Friendly name/description of task
  input: string;                    // Actual prompt content to execute
}
```

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `reset(what)` | Reset state for specific scope | `what: ResetWhat[]` | `void` |
| `serialize()` | Convert state to plain object | None | `z.output<typeof serializationSchema>` |
| `deserialize(data)` | Restore state from plain object | `data: z.output<typeof serializationSchema>` | `void` |
| `show()` | Display current state in array form | None | `string[]` |

### Configuration Schemas

#### WorkQueueAgentConfigSchema

Agent-level configuration for queue size limits:

```typescript
{
  maxSize?: number  // Optional: Maximum queue size (positive number)
}
```

#### WorkQueueServiceConfigSchema

Plugin-level configuration with defaults:

```typescript
{
  queue: {
    agentDefaults: {
      maxSize?: number  // Optional: Maximum queue size (positive number)
    }
  }
}
```

## Chat Commands

All `/queue` commands are registered with the AgentCommandService and are available through the chat interface.

### /queue list

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
- Uses `numberedList` utility to format output
- Shows only task names
- Returns empty list message if queue is empty

### /queue add \<prompt\>

Add a new chat prompt to the end of the queue.

**Example:**
```
/queue add 'Write a Python function to calculate Fibonacci numbers'
```

**Output:**
```
Added to queue. Queue length: 1
```

**Validation:**
- Raises error if no prompt provided
- Captures conversation checkpoint for state restoration

### /queue remove \<index\>

Remove the prompt at the given zero-based index.

**Example:**
```
/queue remove 2
```

**Output:**
```
Removed "Fix bug in login" from queue. Remaining: 3
```

**Validation:**
- Index must be >= 0 and < queue size
- Shows error message for invalid indices

### /queue details \<index\>

Show detailed information about a specific queue item.

**Example:**
```
/queue details 0
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

**Implementation Notes:**
- Uses `JSON.stringify` with 2-space indentation
- Includes full item structure including checkpoint

### /queue clear

Remove all prompts from the queue.

**Example:**
```
/queue clear
```

**Output:**
```
Queue cleared!
```

### /queue start

Begin queue processing. This command saves the current agent state as an initial checkpoint.

**Example:**
```
/queue start
```

**Output:**
```
Queue started, use /queue next to start working on the first item in the queue, or /queue done to end the queue.
```

**Process:**
1. Saves current agent state as initial checkpoint
2. Sets started flag to true
3. Creates a checkpoint entry marking queue start using `@tokenring-ai/checkpoint`

### /queue next

Load the first queued item (does not execute it).

**Example:**
```
/queue next
```

**Output:**
```
Queue Item loaded: Write README for the project Use /queue run to run the queue item, and /queue next|skip|done to move on to the next item.
```

**Process:**
1. Dequeues the first item
2. Sets it as the current item
3. Displays the item name

### /queue run

Execute the currently loaded queued prompt.

**Example:**
```
/queue run
```

**Process:**
1. Restores agent state from the current item's checkpoint
2. Executes the chat command via `runChat()` with the item's input
3. Uses `@tokenring-ai/chat/runChat` function
4. Creates error handling for failures
5. Has no return value (directly processes chat)

### /queue skip

Skip the current item and re-add it to the end of the queue.

**Example:**
```
/queue skip
```

**Output:**
```
Queue item skipped. It has been added to the end of the queue in case you would like to run it later, and you can use /queue next to load the next item in the queue, or /queue done to end the queue.
```

**Process:**
1. Re-adds the current item to the queue
2. Clears the current item
3. Allows the next item to be processed

### /queue done

End queue processing and restore the initial agent state.

**Example:**
```
/queue done
```

**Output:**
```
Restored chat state to preserved state.
```

**Process:**
1. Checks if queue is empty
2. If initial checkpoint exists, restores agent state to it
3. Shows error if no initial checkpoint found
4. Clears queue items and processing state
5. Stops work/queue processing

**Error Cases:**
- If no initial checkpoint found, shows error:
  ```
  Couldn't restore initial state, no initial checkpoint found
  ```

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
{
  description: z.string().describe("A short description of the task to be performed"),
  content: z.string().describe("A natural language string, explaining the exact task to be performed, in great detail. This string will be used to prompt an AI agent as the next message in this conversation, so should be as detailed as possible, and should directly order the AI agent to execute the task, using the tools that are available to it.")
}
```

**Returns:**
```typescript
{
  status: "queued";
  message: "Task has been queued for later execution.";
}
```

**Error Cases:**
- Throws error if `description` is not provided
- Throws error if `content` is not provided

**Output Handling:**
- Uses `agent.infoMessage()` to prefix output with tool name
- This ensures output is clearly attributed to the tool

**Usage Example:**
```typescript
// Via tool
{
  "name": "queue_addTaskToQueue",
  "arguments": {
    "description": "Analyze dependencies",
    "content": "Use the filesystem tools to find all npm dependencies in the project and create a breakdown report."
  }
}
```

## Integration

### Plugin Configuration

The package has a configuration schema with optional `agentDefaults` for queue size limits:

```typescript
// In plugin.ts
const packageConfigSchema = z.object({
  queue: WorkQueueServiceConfigSchema.prefault({})
});

// WorkQueueServiceConfigSchema
export const WorkQueueServiceConfigSchema = z.object({
  agentDefaults: z.object({
    maxSize: z.number().positive().optional()
  }).prefault({})
});
```

### Agent Configuration

The queue service can be configured at the agent level:

```typescript
const agentConfig = {
  queue: {
    maxSize: 100
  }
};

const agent = new Agent(app, { config: agentConfig, headless: false });
```

### Agent Configuration Schema

```typescript
{
  queue: {
    maxSize?: number  // Optional: Maximum queue size for this agent
  }
}
```

### Agent Initialization

The service is automatically attached to the agent during plugin initialization.

```typescript
// Called automatically in plugin.ts
queueService.attach(agent);
```

### Service Registration

The service is registered in the plugin configuration:

```typescript
// In plugin.ts
import WorkQueueService from "./WorkQueueService.js";

app.addServices(new WorkQueueService());
```

### Tool Registration

The tool is automatically registered with the chat service:

```typescript
// In plugin.ts
chatService.addTools(tools);
```

### Command Registration

The chat commands are automatically registered with the agent command service:

```typescript
// In plugin.ts
agentCommandService.addAgentCommands(chatCommands);
```

## Usage Examples

### Basic Queue Workflow

```typescript
import WorkQueueService from '@tokenring-ai/queue';

// Initialize service (optional maxSize parameter)
const queueService = new WorkQueueService({ agentDefaults: { maxSize: 50 } });

// Attach to agent - this happens automatically in plugin
queueService.attach(agent);

// Add multiple tasks
queueService.enqueue(
  {
    checkpoint: agent.generateCheckpoint(),
    name: 'Create user types',
    input: 'Generate TypeScript interfaces for User, Account, and Profile'
  },
  agent
);

queueService.enqueue(
  {
    checkpoint: agent.generateCheckpoint(),
    name: 'Write service layer',
    input: 'Implement UserService, AccountService, and ProfileService with proper validation'
  },
  agent
);

// Start queue processing
queueService.startWork(agent);

// Process items one by one
while (true) {
  const item = queueService.dequeue(agent);

  if (!item) {
    break; // Queue is empty
  }

  // Set current item
  queueService.setCurrentItem(item, agent);

  // Restore state and execute
  agent.restoreState(item.checkpoint.state);

  // Execute the task
  // ... (execute using chat service or other means)

  // Create checkpoint
  await agent.createCheckpoint(`Completed: ${item.name}`);
}

// Complete queue and restore state
queueService.stopWork(agent);
const initial = queueService.getInitialCheckpoint(agent);
if (initial) {
  agent.restoreState(initial.state);
}
```

### Chat Command Workflow

```typescript
// Build up a queue of prompts offline
/queue add 'Generate README documentation for the project'
/queue add 'Create unit tests for database interactions'
/queue add 'Add error handling to API endpoints'

// Review the queue
/queue list

// Start processing
/queue start

// Process all items automatically

# Phase 1: Generate documentation
/queue next
/queue run

# Phase 2: Write tests
/queue next
/queue run

# Phase 3: Add error handling
/queue next
/queue run

# Found an issue in documentation - skip and fix later
/queue skip

# Continue with remaining items
/queue next
/queue run

# Finish and restore context
/queue done
```

### Programmatic Task Management

```typescript
// Add a task via tool
const result = await agent.executeTool('queue_addTaskToQueue', {
  description: 'Analyze performance bottlenecks',
  content: 'Use performance monitoring tools to identify slow queries and implement optimizations using database indexing and query optimization techniques.'
});

console.log(result); // { status: 'queued', message: 'Task has been queued for later execution.' }

// Check queue status
const size = queueService.size(agent);
const isEmpty = queueService.isEmpty(agent);
const itemCount = queueService.getAll(agent).length;

// Inspect current item
const current = queueService.getCurrentItem(agent);
console.log(`Current task: ${current?.name}`);

// Modify queue programmatically
queueService.splice(1, 1, agent, {
  checkpoint: agent.generateCheckpoint(),
  name: 'Fixed analysis task',
  input: 'Updated analysis with cache optimization'
});

// View queue state
const state = queueService.serialize();
console.log('Queue state:', state);

// Reset queue under specific scope
const agent = createAgent();
queueService.attach(agent);
// ... use queue ...

// Reset only when "chat" is reset
queueService.reset(['chat']);
```

### Advanced: Loading and Processing Items

```typescript
// Add items to queue with meaningful names
queueService.enqueue({ checkpoint: agent.generateCheckpoint(), name: "Task 1", input: "" }, agent);
queueService.enqueue({ checkpoint: agent.generateCheckpoint(), name: "Task 2", input: "" }, agent);
queueService.enqueue({ checkpoint: agent.generateCheckpoint(), name: "Task 3", input: "" }, agent);

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
    agent.errorMessage(`Error running queued prompt: ${error.message || error}`);
  }

  await agent.createCheckpoint(`Completed: ${next.name}`);
}

// Restore initial state
queueService.stopWork(agent);
const initial = queueService.getInitialCheckpoint(agent);
if (initial) {
  agent.restoreState(initial.state);
}
```

### Configuration Example

```typescript
import queuePlugin from "@tokenring-ai/queue/plugin";

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

## State Management

### Serialization

The queue state is automatically serialized using a Zod schema:

```typescript
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

The `reset(what)` method clears queue state when appropriate scopes are reset:

- When `what.includes('chat')`: Clears queue, current item, and initial checkpoint
- Other reset scopes: No effect on queue state (by design)

This ensures that queue items persist across unrelated state cleanups.

### Checkpoint Integration

The queue automatically creates checkpoints:

- **Initial Checkpoint**: Created when queue is started via `setInitialCheckpoint`
- **Completion Checkpoints**: Created for each completed item using `agent.createCheckpoint()`
- **Start Checkpoint**: Created using `@tokenring-ai/checkpoint` when queue starts processing
- **End Checkpoint**: Created for each item when done processing via `runChat`

### State Circular References

The serialization schema uses `z.any()` for checkpoint fields to handle circular references that naturally exist in the AgentCheckpointData structure, ensuring successful serialization.

## State Slice

### WorkQueueState Class

```typescript
class WorkQueueState implements AgentStateSlice<typeof serializationSchema> {
  // State properties
  name = "WorkQueueState";
  queue: QueueItem[] = [];
  started = false;
  currentItem: QueueItem | null = null;
  initialCheckpoint: AgentCheckpointData | null = null;
  maxSize: number | null = null;

  // Methods

  // Constructor - receives config
  constructor(readonly initialConfig: z.output<typeof WorkQueueAgentConfigSchema>) {
    this.maxSize = initialConfig.maxSize ?? null;
  }

  // Reset state when appropriate scope is reset
  reset(what: ResetWhat[]): void {
    if (what.includes("chat")) {
      this.queue = [];
      this.started = false;
      this.currentItem = null;
      this.initialCheckpoint = null;
    }
  }

  // Convert to serializable format
  serialize(): z.output<typeof serializationSchema> {
    return {
      started: this.started,
      currentItem: this.currentItem,
      initialCheckpoint: this.initialCheckpoint,
      queue: this.queue,
      maxSize: this.maxSize
    };
  }

  // Restore from serializable format
  deserialize(data: z.output<typeof serializationSchema>): void {
    this.started = data.started;
    this.currentItem = data.currentItem;
    this.initialCheckpoint = data.initialCheckpoint;
    this.queue = data.queue;
    this.maxSize = data.maxSize;
  }

  // Get human-readable state summary
  show(): string[] {
    return [
      "Started: " + this.started,
      "Queue Items: " + this.queue.length,
      "Current Item: " + (this.currentItem?.name || "None")
    ];
  }
}
```

### State Display

The `show()` method returns an array of status strings for quick debugging:

```typescript
[
  "Started: false",
  "Queue Items: 5",
  "Current Item: None"
]
```

## Error Handling

### Command Validation

All `/queue` commands include input validation:

- **Index validation**: Index must be within valid range
- **Prompt validation**: Add command requires non-empty prompt
- **State validation**: Run/Next require queue to be started

### Error Messages

Clear error messages guide users to correct their commands:

```typescript
// Invalid index
agent.errorMessage("Usage: /queue remove <index>  (index starts from 0)");

// Missing prompt
agent.errorMessage("Usage: /queue add <prompt>");

// Queue not started
agent.infoMessage("Queue not started. Use /queue start to start the queue.");

// No items in queue
agent.infoMessage("No queue item loaded. Use /queue next to load the next item...");

// No initial checkpoint
agent.errorMessage("Couldn't restore initial state, no initial checkpoint found");
```

### Execution Errors

The `/queue run` command includes try/catch error handling:

```typescript
try {
  await runChat(input, chatConfig, agent);
} catch (error: any) {
  agent.errorMessage(
    "Error running queued prompt: " + (error.message || error)
  );
}
```

## Best Practices

### Queue Organization

1. **Descriptive Names**: Use clear, descriptive names for queue items
2. **Logical Ordering**: Sort tasks logically (e.g., write → test → deploy)
3. **Batch Related Tasks**: Group related operations together

Example:
```
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
2. **Completion Checkpoints**: Track what has been done for debugging
3. **Error Recovery**: System attempts auto-recovery using checkpoints

### Queue Size Management

1. **Set maxSize**: Configure queue size limits to prevent unbounded memory usage
2. **Monitor Queue Size**: Use `/queue list` and `size()` to monitor queue growth
3. **Regular Processing**: Process queue items regularly to prevent accumulation

## Troubleshooting

### Queue Empty

**Problem**: Queue appears empty but not processing

**Solution**:
- Verify with `/queue list` to confirm items exist
- Check that `/queue start` was called
- Ensure no items were accidentally cleared

### Not Started

**Problem**: Cannot load items from queue

**Solution**:
- Run `/queue start` to begin queue processing
- Check queue is not empty with `/queue list`

### State Restoration Issues

**Problem**: State not restored after completing queue

**Solution**:
- Verify initial checkpoint was saved with `/queue start`
- Check for errors during checkpoint creation
- Manually restore using `/queue done`

### Index Out of Range

**Problem**: Remove operation fails with index error

**Solution**:
- Use `/queue list` to get current queue indices
- Ensure index is 0-based and within queue size
- Check for queue changes between add and remove

### Tool Parameter Errors

**Problem**: `queue_addTaskToQueue` throws errors about missing parameters

**Solution**:
- Ensure both `description` and `content` parameters are provided
- Check parameter schema for type requirements
- Verify string inputs are not empty

### Queue Items Not Processing

**Problem**: After `/queue next`, items don't process

**Solution**:
- Ensure `/queue start` was called before processing
- Verify items were added with `/queue add`
- Check queue with `/queue list` to confirm items exist

### Queue Full

**Problem**: Cannot add more items to queue

**Solution**:
- Check `maxSize` configuration
- Process or remove items to make space
- Increase `maxSize` if needed

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import WorkQueueService from './WorkQueueService';
import type { Agent } from '@tokenring-ai/agent';

describe('WorkQueueService', () => {
  it('should enqueue and dequeue items', () => {
    const service = new WorkQueueService({ agentDefaults: { maxSize: 10 } });
    const mockAgent = createMockAgent();

    // Attach agent to service (in real usage, this is automatic)
    // Attach would be needed for agent-dependent methods
    // For unit tests, mock the agent interactions

    // Service can be tested independently for queue operations

    expect(service.size(mockAgent)).toBe(0);
  });

  it('should enforce queue size limit', () => {
    const service = new WorkQueueService({ agentDefaults: { maxSize: 2 } });
    const mockAgent = createMockAgent();

    // Attempt to add more items than maxSize
    const result1 = service.enqueue(
      { checkpoint: {}, name: 'A', input: '' },
      mockAgent
    );
    const result2 = service.enqueue(
      { checkpoint: {}, name: 'B', input: '' },
      mockAgent
    );
    const result3 = service.enqueue(
      { checkpoint: {}, name: 'C', input: '' },
      mockAgent
    );

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(false); // Queue full
  });

  it('should serialize and deserialize state', () => {
    const service = new WorkQueueService();
    const mockAgent = createMockAgent();

    // Enqueue items
    service.enqueue(
      { checkpoint: {}, name: 'Test', input: '' },
      mockAgent
    );
    service.enqueue(
      { checkpoint: {}, name: 'Test2', input: '' },
      mockAgent
    );

    // Serialize
    const serialized = service.serialize();
    expect(serialized.queue.length).toBe(2);

    // Deserialize (requires WorkQueueState instance)
    const state = new WorkQueueState();
    state.deserialize(serialized);

    expect(state.queue.length).toBe(2);
  });
});

describe('WorkQueueState', () => {
  it('should reset queue state when chat is reset', () => {
    const state = new WorkQueueState({ maxSize: undefined });

    // Modify state
    const item: QueueItem = {
      checkpoint: {},
      name: 'Test',
      input: ''
    };
    state.queue.push(item);
    state.started = true;
    state.currentItem = item;

    // Reset
    state.reset(['chat']);

    expect(state.queue.length).toBe(0);
    expect(state.started).toBe(false);
    expect(state.currentItem).toBeNull();
  });

  it('should show state summary', () => {
    const state = new WorkQueueState({ maxSize: undefined });
    state.queue.push({ checkpoint: {}, name: 'Item1', input: '' });
    state.queue.push({ checkpoint: {}, name: 'Item2', input: '' });

    const summary = state.show();
    expect(summary[0]).toBe('Started: false');
    expect(summary[1]).toBe('Queue Items: 2');
    expect(summary[2]).toContain('Current Item: None');
  });
});
```

## Package Structure

```
@tokenring-ai/queue/
├── plugin.ts              # Plugin registration and service setup
├── package.json           # Package metadata and dependencies
├── index.ts               # Service exports
├── WorkQueueService.ts    # Main service class
├── chatCommands.ts        # Chat command exports
├── tools.ts               # Tool exports
├── commands/
│   └── queue.ts          # /queue command implementation
├── tools/
│   └── addTaskToQueue.ts # addTaskToQueue tool
├── state/
│   └── workQueueState.ts # WorkQueueState implementation
├── schema.ts              # Configuration schemas
├── test/
│   └── WorkQueueService.test.ts  # Unit tests
└── vitest.config.ts       # Test configuration
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent`: Agent framework and state management
- `@tokenring-ai/app`: Application framework and plugin system
- `@tokenring-ai/chat`: Chat service for command execution (`runChat`)
- `@tokenring-ai/checkpoint`: Checkpoint management for state saving
- `@tokenring-ai/utility`: Shared utilities including deepMerge
- `zod`: Schema validation and configuration

### Development Dependencies

- `typescript`: TypeScript compiler
- `vitest`: Unit testing framework

### Peer Dependencies

- `@tokenring-ai/agent` (required for Agent type)
- `@tokenring-ai/app` (required for TokenRingService interface)

## Plugin Registration

The plugin automatically registers:

1. **ChatTools**: Adds `queue_addTaskToQueue` tool to chat service
2. **AgentCommands**: Registers `/queue` commands with AgentCommandService
3. **Services**: Registers WorkQueueService with app

```typescript
// plugin.ts
export default {
  name: '@tokenring-ai/queue',
  version: '0.2.0',
  description: 'Queue for Token Ring',
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.addServices(new WorkQueueService(config.queue));
  },
  config: z.object({
    queue: WorkQueueServiceConfigSchema.prefault({})
  })
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

## License

MIT License - see LICENSE file for details.
