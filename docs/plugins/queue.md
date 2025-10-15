# Queue Plugin

Lightweight in-memory queue management system for batching and deferred execution of AI agent tasks.

## Overview

The `@tokenring-ai/queue` package provides a lightweight, in-memory queue management system for the Token Ring AI agent framework. It enables the queuing of work items, such as chat prompts or tasks, to be processed sequentially while preserving and restoring agent state via checkpoints.

## Key Features

- FIFO (First-In-First-Out) queue structure
- Optional size limits
- State preservation via checkpoints
- Chat commands for interactive management
- Tool for programmatic task enqueueing
- Sequential processing with state restoration

## Core Components

### WorkQueueService

Primary service for queue operations.

**Key Methods:**
- `constructor({ maxSize? })`: Initializes with optional queue size limit
- `attach(agent)`: Initializes the state slice on the agent
- `startWork(agent)`: Sets `started = true`
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

### Chat Commands

**/queue**: Interactive command for managing the queue
- `add <prompt>`: Enqueues a new item
- `remove <index>`: Removes item at index
- `details <index>`: Displays JSON details
- `clear`: Empties the queue
- `list`: Lists all items with indices
- `start`: Initializes queue session
- `next` / `done`: Advances to next item or ends session
- `skip`: Moves current item to end
- `run`: Executes the current item's input

### Tools

**addTaskToQueue**: Programmatic tool for enqueuing tasks
- Input: `{ description, content }`
- Captures current agent checkpoint
- Returns: `{ status, message }`

## Usage Examples

### Programmatic Queue Management

```typescript
import { Agent } from '@tokenring-ai/agent';
import { WorkQueueService } from '@tokenring-ai/queue';

const agent = new Agent(/* config */);
const queueService = new WorkQueueService({ maxSize: 10 });
await queueService.attach(agent);

// Enqueue a task
const item = {
  checkpoint: agent.generateCheckpoint(),
  name: 'Analyze data',
  input: [{ role: 'user', content: 'Analyze the sales data and report trends.' }]
};
const added = queueService.enqueue(item, agent);
console.log(`Added: ${added}, Size: ${queueService.size(agent)}`);

// Process front item
const nextItem = queueService.dequeue(agent);
if (nextItem) {
  agent.restoreCheckpoint(nextItem.checkpoint);
  // Execute nextItem.input
}
```

### Using Chat Commands

```
/queue add Generate report on user metrics
/queue add Fix bug in authentication
/queue list  // Shows: [0] Generate report... [1] Fix bug...
/queue start  // Begins session
/queue next   // Loads first item
/queue run    // Executes it
/queue next   // Moves to second
/queue done   // Ends and restores initial state
```

### Enqueuing via Tool

```typescript
import { tools } from '@tokenring-ai/queue';

await tools.addTaskToQueue.execute(
  {
    description: 'Optimize query performance',
    content: 'Review database queries, identify bottlenecks, and suggest indexes.'
  },
  agent
);
```

## Configuration Options

- `maxSize` (number, optional): Limits queue length (defaults to unlimited)
- No environment variables required
- All configuration via constructor or agent state

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: For ChatInputMessage, runChat
- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/history@0.1.0`: Checkpoint operations
- `typescript@^5.9.2`: Development
- `zod`: Schema validation
