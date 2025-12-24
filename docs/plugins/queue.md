# Queue Plugin

Queue management system for Token Ring AI with state preservation, interactive commands, and programmatic task scheduling.

## Overview

The `@tokenring-ai/queue` package provides a comprehensive queue management system for the Token Ring AI agent framework. It enables the queuing of work items (such as chat prompts or tasks) to be processed sequentially while preserving and restoring agent state via checkpoints. This allows for batch processing of tasks while maintaining the agent's context and state between operations.

## Key Features

- **FIFO Queue Structure**: First-In-First-Out processing of queued items
- **State Preservation**: Maintains agent state via checkpoints for each queue item
- **Interactive Chat Commands**: Comprehensive `/queue` command with subcommands
- **Programmatic Integration**: Tool-based API for task enqueuing
- **Sequential Processing Workflow**: Start, process, and complete queue operations
- **Checkpoint Management**: Automatic checkpoint generation and restoration
- **Queue Status Tracking**: Real-time queue length and processing status

## Core Components

### WorkQueueService

Primary service for queue operations with state management.

**Constructor Options:**
- `maxSize` (number, optional): Limits queue length (defaults to unlimited)

**Key Methods:**
- `constructor({ maxSize? })`: Initializes queue with optional size limit
- `attach(agent)`: Initializes the state slice on the agent
- `startWork(agent)`: Sets `started = true` and creates initial checkpoint
- `stopWork(agent)`: Sets `started = false` and clears current item
- `started(agent)`: Checks if processing is active
- `enqueue(item, agent)`: Adds to end of queue (returns false if full)
- `dequeue(agent)`: Removes and returns front item
- `get(idx, agent)`: Retrieves item by index
- `splice(start, deleteCount, agent, ...items)`: Modifies queue
- `size(agent)`: Current queue length
- `isEmpty(agent)`: Checks if queue is empty
- `clear(agent)`: Empties the queue
- `getAll(agent)`: Returns a copy of all items
- `getCurrentItem(agent)`: Gets currently loaded item
- `getInitialCheckpoint(agent)`: Gets initial state checkpoint
- `setCurrentItem(item, agent)`: Sets currently loaded item
- `setInitialCheckpoint(checkpoint, agent)`: Sets initial state checkpoint

**Queue Item Structure:**
```typescript
interface QueueItem {
  checkpoint: Checkpoint;  // Agent state checkpoint
  name: string;           // Item description
  input: string;          // Task content or prompt
}
```

### Chat Commands

**/queue**: Interactive command for managing the queue with comprehensive help system.

**Subcommands:**
- `/queue add <prompt>`: Enqueues a new item with current agent state
- `/queue remove <index>`: Removes item at zero-based index
- `/queue details <index>`: Displays JSON details of queue item
- `/queue clear`: Empties the entire queue
- `/queue list`: Lists all items with indices
- `/queue start`: Initializes queue session and preserves current state
- `/queue next`: Advances to next queued item (does not execute)
- `/queue run`: Executes the currently loaded item's input
- `/queue skip`: Moves current item to end of queue
- `/queue done`: Ends queue processing and restores initial state

**Help Documentation:**
Built-in comprehensive help with usage examples, workflow tips, and status information.

### Tools

**addTaskToQueue**: Programmatic tool for enqueuing tasks with state preservation.

**Input Schema:**
```typescript
interface AddTaskInput {
  description: string;  // Short task description
  content: string;      // Detailed task content or prompt
}
```

**Execution**: Captures current agent checkpoint and adds to queue.

**Return Value:**
```typescript
interface AddTaskResult {
  status: 'queued';     // Success status
  message: string;      // Confirmation message
}
```

## Usage Examples

### Programmatic Queue Management

```typescript
import { Agent } from '@tokenring-ai/agent';
import { WorkQueueService } from '@tokenring-ai/queue';

// Create agent and queue service
const agent = new Agent(/* config */);
const queueService = new WorkQueueService({ maxSize: 10 });
await queueService.attach(agent);

// Add task to queue with current state
const item = {
  checkpoint: agent.generateCheckpoint(),
  name: 'Analyze data',
  input: 'Analyze the sales data and report trends.'
};

const added = queueService.enqueue(item, agent);
console.log(`Added: ${added}, Queue size: ${queueService.size(agent)}`);

// Process queue
if (queueService.started(agent)) {
  const nextItem = queueService.dequeue(agent);
  if (nextItem) {
    agent.restoreState(nextItem.checkpoint.state);
    // Execute task logic here
  }
}
```

### Using Chat Commands

```
/queue add 'Generate monthly report'
/queue add 'Fix authentication bug'
/queue list
[0] Generate monthly report
[1] Fix authentication bug

/queue start  // Preserves current chat state
Queue started. Use /queue next to start working on the first item.

/queue next   // Loads first item into context
Queue Item loaded: Generate monthly report
Use /queue run to execute the queue item, and /queue next|skip|done to move on.

/queue run    // Executes the loaded item
// Task runs with preserved state

/queue next   // Moves to second item
Queue Item loaded: Fix authentication bug

/queue done   // Ends queue processing
Restored chat state to preserved state.
```

### Enqueuing via Tool

```typescript
import { tools } from '@tokenring-ai/queue';

// Add task using the tool API
const result = await tools.addTaskToQueue.execute(
  {
    description: 'Optimize query performance',
    content: 'Review database queries, identify bottlenecks, and suggest indexes.'
  },
  agent
);

console.log(result.status);    // 'queued'
console.log(result.message);  // 'Task has been queued for later execution.'
```

### Advanced Workflow Example

```typescript
// Build queue of research tasks
/queue add 'Research AI trends 2024'
/queue add 'Analyze market competition'
/queue add 'Write technical documentation'

/queue start  // Begin processing
/queue next   // Load first item
/queue run    // Execute research
/queue next   // Load second item
/queue skip   // Skip and re-add to end
/queue next   // Load third item
/queue run    // Execute documentation
/queue done   // End and restore state
```

## Configuration Options

### Service Configuration
- `maxSize` (number, optional): Maximum queue length (0 = unlimited)
- No environment variables required

### Command Options
- None - all configuration handled via service

### Tool Options
- None - input validation handled via Zod schema

## Dependencies

- `@tokenring-ai/agent`: Core agent framework and state management
- `@tokenring-ai/app`: Application framework for plugin integration
- `@tokenring-ai/chat`: Chat service for tool registration
- `@tokenring-ai/checkpoint`: Checkpoint operations for state preservation
- `@tokenring-ai/ai-client`: AI client integration
- `zod@^3.22.4`: Schema validation for tool inputs
- `typescript@^5.9.2`: Type definitions and development
- `vitest@^1.6.0`: Testing framework

## Development

### Installation
```bash
bun add @tokenring-ai/queue
```

### Building
```bash
bun run build
```

### Testing
```bash
bun run test
bun run test:watch
bun run test:coverage
```

### License
MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **Queue not starting**: Ensure you call `/queue start` before using `/queue next` or `/queue run`
2. **State not preserved**: The service automatically captures checkpoints when adding items
3. **Queue full**: Check `maxSize` configuration if set
4. **Item not found**: Queue indices start at 0 and must be valid

### Debugging Tips

- Use `/queue list` to verify queue contents
- Use `/queue details <index>` to inspect item state
- Check agent console for checkpoint restoration messages
- Verify queue service is properly attached to the agent

## Integration

### Plugin Integration
The queue plugin integrates with the Token Ring application framework via:
- `app.waitForService(ChatService)` for tool registration
- `app.waitForService(AgentCommandService)` for chat commands
- `app.addServices(new WorkQueueService())` for service registration

### Service Dependencies
The queue service depends on:
- ChatService: For tool registration and execution
- AgentCommandService: For chat command registration
- Checkpoint system: For state preservation

This comprehensive queue management system enables efficient batch processing of AI tasks while maintaining the integrity of agent state throughout the workflow.