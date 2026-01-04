# Queue Plugin

## Overview

The Queue plugin provides a comprehensive task management system for Token Ring AI, enabling sequential processing of work items with state preservation. It integrates with the agent framework to handle both interactive chat commands and programmatic task queuing. This package enables batch processing, task management, and workflow orchestration through a FIFO queue that preserves agent state via checkpointing.

## Key Features

- **FIFO Queue Processing**: First-in-first-out queue with state checkpointing for reliable batch processing
- **Interactive Command Interface**: Comprehensive `/queue` commands for user interaction and queue management
- **Programmatic Task Addition**: Tools for adding tasks to the queue programmatically
- **State Preservation and Restoration**: Checkpoint system ensures state consistency during queue processing
- **Queue Size Limits**: Support for both bounded and unbounded queues to prevent memory issues
- **Error Handling**: Robust error validation and clear error messages for invalid operations
- **Checkpoint Integration**: Seamless integration with TokenRing's checkpoint system for state management

## Core Components

- **WorkQueueService**: Central service for queue operations (enqueue, dequeue, state management)
- **WorkQueueState**: State management for queue operations including items, current item, and checkpoints
- **Chat Commands**: Comprehensive set of `/queue` commands for user interaction
- **queue_addTaskToQueue Tool**: Programmatic tool for adding tasks to the queue

## Chat Commands

### Queue Management Commands

| Command | Description |
|---------|-------------|
| `/queue add <prompt>` | Adds a new prompt to the end of the queue |
| `/queue remove <index>` | Removes the prompt at the given zero-based index |
| `/queue details <index>` | Shows detailed information about a specific queue item |
| `/queue clear` | Removes all prompts from the queue |
| `/queue list` | Displays all queued prompts with their indices |

### Queue Processing Commands

| Command | Description |
|---------|-------------|
| `/queue start` | Begins queue processing (preserves current chat state) |
| `/queue next` | Loads the next queued item (does not execute it) |
| `/queue run` | Executes the currently loaded queued prompt |
| `/queue skip` | Skips current item and re-adds it to end of queue |
| `/queue done` | Ends queue processing and restores previous chat state |

## Tools

### queue_addTaskToQueue

Adds a task to the queue for later execution by the system.

**Input Schema:**
```typescript
{
  description: string;  // A short description of the task to be performed
  content: string;      // A natural language string explaining the exact task to be performed in great detail
}
```

**Output:**
```typescript
{
  status: "queued";
  message: "Task has been queued for later execution.";
}
```

**Example:**
```typescript
await tools.queue_addTaskToQueue.execute({
  description: "Analyze data",
  content: "Process the sales data and generate a summary report. Use all available data analysis tools."
}, agent);
// Returns: { status: "queued", message: "Task has been queued for later execution." }
```

## Configuration

The plugin does not require any configuration options.

```typescript
import queuePlugin from "@tokenring-ai/queue/plugin";
const app = new TokenRingApp();
app.install(queuePlugin);
```

## Usage Examples

### Interactive Queue Processing

```bash
# Build queue interactively
/queue add "Analyze user behavior patterns"
/queue add "Generate monthly metrics"
/queue add "Update dashboard data"

# View queue contents
/queue list
# Output:
// Queue contents:
// [0] Analyze user behavior patterns
// [1] Generate monthly metrics
// [2] Update dashboard data

# Start processing
/queue start
# Output:
// Queue started, use /queue next to start working on the first item in the queue, or /queue done to end the queue.

# Process items one by one
/queue next
# Output:
// Queue Item loaded: Analyze user behavior patterns. Use /queue run to run the queue item...

/queue run    # Execute task 1
/queue next
/queue run    # Execute task 2

# Complete processing
/queue done   # Restore original state
# Output:
// Restored chat state to preserved state.
```

### Advanced Workflow Example

```bash
/queue add "Research AI trends 2024"
/queue add "Analyze market competition"
/queue add "Write technical documentation"
/queue start
/queue next
/queue run
/queue skip    # Skip current item and add to end of queue
/queue next
/queue run
/queue done
```

### Programmatic Task Addition

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import { WorkQueueService } from "@tokenring-ai/queue";

const agent = new Agent(app, { config: agentConfig, headless: false });
const queueService = new WorkQueueService({ maxSize: 10 });

// Initialize queue on agent
await queueService.attach(agent);

// Add item to queue
const item: QueueItem = {
  checkpoint: agent.generateCheckpoint(),
  name: "Generate report",
  input: "Create a comprehensive sales report for Q4."
};

const added = queueService.enqueue(item, agent);
// Returns: true if added successfully, false if queue is full

// Process queue
queueService.startWork(agent);
const nextItem = queueService.dequeue(agent);
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
// Queue contents:
// [0] Task 1: Generate report
// [1] Task 2: Update metrics
// [2] Task 3: Send notifications

# Check details of a specific item
/queue details 1
# Output:
// Queue item details:
// {
//   "checkpoint": {...},
//   "name": "Task 2: Update metrics",
//   "input": "Task 2: Update metrics"
// }

# Remove an item from the queue
/queue remove 1
# Output:
// Removed "Task 2: Update metrics" from queue. Remaining: 2
```

## Services and APIs

### WorkQueueService

The central service for queue operations with comprehensive state management.

**Constructor Options:**
```typescript
new WorkQueueService(options: { maxSize?: number })
```
- `maxSize?: number` - Optional maximum queue size (default: unlimited)

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `attach(agent)` | Initialize queue state on agent | `agent: Agent` | `Promise<void>` |
| `startWork(agent)` | Start queue processing | `agent: Agent` | `void` |
| `stopWork(agent)` | Stop processing and clear current item | `agent: Agent` | `void` |
| `started(agent)` | Check if queue is active | `agent: Agent` | `boolean` |
| `setInitialCheckpoint(checkpoint, agent)` | Set starting state checkpoint | `checkpoint: AgentCheckpointData`, `agent: Agent` | `void` |
| `getInitialCheckpoint(agent)` | Get initial checkpoint | `agent: Agent` | `AgentCheckpointData \| null` |
| `clearInitialCheckpoint(agent)` | Clear initial checkpoint | `agent: Agent` | `void` |
| `enqueue(item, agent)` | Add item to queue | `item: QueueItem`, `agent: Agent` | `boolean` |
| `dequeue(agent)` | Remove and return front item | `agent: Agent` | `QueueItem \| undefined` |
| `get(idx, agent)` | Get item at index | `idx: number`, `agent: Agent` | `QueueItem` |
| `splice(start, deleteCount, agent, ...items)` | Modify queue like Array.splice | `start: number`, `deleteCount: number`, `agent: Agent`, `...items: QueueItem[]` | `QueueItem[]` |
| `size(agent)` | Get current queue length | `agent: Agent` | `number` |
| `isEmpty(agent)` | Check if queue is empty | `agent: Agent` | `boolean` |
| `clear(agent)` | Empty the queue | `agent: Agent` | `void` |
| `getAll(agent)` | Get copy of all items | `agent: Agent` | `QueueItem[]` |
| `getCurrentItem(agent)` | Get currently processing item | `agent: Agent` | `QueueItem \| null` |
| `setCurrentItem(item, agent)` | Set current processing item | `item: QueueItem \| null`, `agent: Agent` | `void` |

### WorkQueueState

State management for queue operations.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `QueueItem[]` | Array of queue items |
| `started` | `boolean` | Whether queue processing is active |
| `initialCheckpoint` | `AgentCheckpointData \| null` | Preserved starting state |
| `currentItem` | `QueueItem \| null` | Currently processing item |

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `reset(what)` | Reset specific state components | `what: ResetWhat[]` | `void` |
| `serialize()` | Convert state to serializable format | None | `object` |
| `deserialize(data)` | Restore state from data | `data: any` | `void` |
| `show()` | Get human-readable state summary | None | `string[]` |

### QueueItem Interface

```typescript
interface QueueItem {
  checkpoint: AgentCheckpointData;
  name: string;
  input: string;
}
```

## Integration

### TokenRing Plugin Integration

The package automatically integrates with TokenRing applications:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import queuePlugin from "@tokenring-ai/queue/plugin";

const app = new TokenRingApp();
app.install(queuePlugin);
```

### Agent Integration

```typescript
import Agent from "@tokenring-ai/agent";
import { WorkQueueService } from "@tokenring-ai/queue";

// Automatic state slice attachment
await queueService.attach(agent);

// Access queue service through agent
const queueService = agent.requireServiceByType(WorkQueueService);

// Queue operations available through agent
const queueSize = queueService.size(agent);
```

### Checkpoint Integration

```typescript
// Items store checkpoints for state preservation
const item: QueueItem = {
  checkpoint: agent.generateCheckpoint(),  // Saves current state
  name: "Task name",
  input: "Task instructions"
};

// State restoration during processing
agent.restoreState(item.checkpoint.state);
```

### Chat Service Integration

```typescript
// Chat commands automatically registered
const chatService = agent.requireServiceByType(ChatService);

// Tools automatically available
const tools = chatService.getTools();

// Commands work through chat interface
await agent.handleInput({ message: "/queue list" });
```

## Monitoring and Debugging

- Monitor queue status using `/queue list` and `/queue details`
- Error messages provide clear guidance for invalid commands
- Checkpoint system ensures state consistency during processing
- Queue size can be limited to prevent memory issues

## Development

### Testing

```bash
bun run test
bun run test:coverage
```

### Build

```bash
bun run build
```

### Package Structure

```
pkg/queue/
├── WorkQueueService.ts              # Core queue management service
├── index.ts                          # Package exports and plugin integration
├── plugin.ts                         # TokenRing plugin implementation
├── package.json                      # Package configuration
├── commands/                         # Chat commands
│   └── queue.ts                      # /queue command implementation
├── tools/                            # Built-in tools
│   └── addTaskToQueue.ts             # Task addition tool
├── state/                            # State management
│   └── workQueueState.ts             # WorkQueueState implementation
├── chatCommands.ts                   # Command exports
├── tools.ts                          # Tool exports
├── test/                             # Test suite
│   └── WorkQueueService.test.js      # Unit tests
└── vitest.config.ts                  # Test configuration
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Queue not starting | Ensure `/queue start` is called before processing |
| Index errors | Verify zero-based indexing when removing items |
| Empty queue | Use `/queue list` to check current contents |
| State issues | Verify checkpoint restoration using `/queue done` |
| Queue overflow | Use `maxSize` option to limit queue size |
| Invalid operations | Check that required parameters are provided |

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
