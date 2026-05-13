# @tokenring-ai/todo

The Todo package provides persistent task management for agents to track priorities and project progress. It enables agents to create, update, complete, and delete todo items with status tracking and persistent state storage across agent sessions.

## Overview

The `@tokenring-ai/todo` package provides a comprehensive todo list management system for TokenRing agents. It enables agents to organize complex tasks, track progress, and maintain a structured task list throughout their workflow.

The package integrates seamlessly with the TokenRing agent framework, providing tool-based interactions, context handlers for todo visibility, and automatic completion checks to ensure tasks are completed.

## Key Features

- **Task Management**: Create, update, complete, and delete todo items with unique IDs
- **Status Tracking**: Track tasks with `pending`, `in_progress`, and `completed` statuses
- **Persistent State**: Todos persist across agent sessions via state storage
- **Agent Context**: Automatic todo list context injection into chat sessions
- **Completion Hooks**: Automatic reminders for incomplete tasks after agent responses
- **Parent-Child Transfer**: Optional todo copying from parent to child agents
- **Current Activity Tracking**: Automatically sets agent activity to current task

## Core Components

### TodoService

The main service that provides todo list management functionality. Implements the `TokenRingService` interface.

```typescript
import TodoService from "@tokenring-ai/todo";

const todoService = new TodoService(config);
```

**Properties:**

- `name: "TodoService"` - Service identifier
- `description: string` - Service description
- `options: TodoConfig` - Service configuration

**Methods:**

#### `attach(agent: Agent)`

Attaches the service to an agent and initializes state.

**Parameters:**

- `agent`: The agent to attach to

**Behavior:**

1. Merges service defaults with agent-specific configuration
2. Initializes `TodoState` with the merged configuration
3. Sets up todo persistence for the agent

### TodoState

State slice for managing todo persistence across agent sessions.

**Properties:**

- `todos: TodoItem[]` - Array of todo items
- `initialConfig: TodoAgentConfig` - Initial configuration

**Methods:**

#### `transferStateFromParent(parentAgent: Agent)`

Transfers todos from parent agent if `copyToChild` is enabled.

#### `serialize()`

Serializes todos for persistence.

#### `deserialize(data)`

Deserializes todos from persisted data.

#### `show()`

Returns a summary of todo counts:

```text
Total: N
Pending: X
In Progress: Y
Completed: Z
```

## Services

The package provides one service:

### TodoService Integration

Implements `TokenRingService` interface and manages todo list state.

**Constructor Parameters:**

- `options: TodoConfig` - Service configuration with agent defaults

**Integration Example:**

```typescript
import TodoService from "@tokenring-ai/todo";

// Access via agent
const todoService = agent.requireServiceByType(TodoService);

// The service is automatically attached to agents when the plugin is loaded
```

## Provider Documentation

This package does not use a provider architecture. Todo management is handled directly through the TodoService and TodoState.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands. Todo management is performed through the `todo` tool.

## Tools

The package provides one main tool for todo management:

### `todo`

Manages todo items for task organization and progress tracking.

| Property | Value |
|----------|-------|
| **Name** | `todo` |
| **Display Name** | `Todo/todo` |
| **Required Context Handlers** | `todo-list` |

#### Description

The todo tool manages a list of items for the current task. This tool should proactively be used to organize complex tasks, track progress, and to convey the current task plan to the user.

**Use this tool for:**

- Non-trivial and complex tasks - Tasks that require careful planning or multiple operations
- Tasks with multiple concerns - Tasks that involve multiple areas of expertise or systems
- To capture and expand upon the most important requirements of the user and to complete the task
- So that you do not miss any critical execution details

**Before you start working on a task, mark it as `in_progress` BEFORE beginning work**

**After completing a task, mark it as `completed`, and add any new follow-up tasks discovered during implementation**

**Skip using this tool when:**

- The user's prompt is purely conversational
- The user has given a direct, straightforward, single concern, trivial task

#### Input Schema

```typescript
import { z } from "zod";

const inputSchema = z.object({
  todos: z.array(
    z.object({
      id: z.string().describe("Unique identifier for the task"),
      content: z.string().min(1).describe("The task description - what needs to be done"),
      status: z.enum(["pending", "in_progress", "completed"]).describe("Current status of the task"),
    })
  ).describe("The updated todo list"),
});
```

**Properties:**

- `todos: TodoItem[]` - Array of todo items to update or add
  - `id: string` - Unique identifier for the task
  - `content: string` - The task description
  - `status: "pending" | "in_progress" | "completed"` - Current status

#### Example Usage

```json
{
  "todos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Implement authentication flow",
      "status": "in_progress"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "content": "Write unit tests",
      "status": "pending"
    }
  ]
}
```

#### Output Format

Returns the updated todo list in a formatted string showing ID, status emoji, and content:

```text
Todo list updated! Current Todo list:
ID: STATUS CONTENT
550e8400-e29b-41d4-a716-446655440000: 🔄 Implement authentication flow
550e8400-e29b-41d4-a716-446655440001: 📝 Write unit tests
```

## Context Handlers

The package provides one context handler for injecting todo list into chat context:

### `todo-list`

Injects the current todo list into the agent's chat context.

**Purpose:** Provides the agent with visibility into current tasks and progress.

**Context Format:**

```text
/* Current todo list */
ID: STATUS CONTENT
550e8400-e29b-41d4-a716-446655440000: 📝 Implement authentication flow
550e8400-e29b-41d4-a716-446655440001: 🔄 Write unit tests
```

**Status Emojis:**

- `📝` - Pending
- `🔄` - In Progress
- `✅` - Completed

## Hooks

The package provides one hook for automatic todo completion checking:

### `todoCompletionCheck`

Automatically checks for incomplete todos after successful agent responses.

| Property | Value |
|----------|-------|
| **Name** | `todoCompletionCheck` |
| **Display Name** | `Todo/Completion Check` |
| **Description** | Checks if todos are complete at the end of a successful chat and prompts to complete remaining work |

#### Hook Subscription

- **Hook:** `AfterAgentInputSuccess`
- **Trigger:** After successful agent input completion

#### Behavior

1. Retrieves current todo state from the agent
2. Filters for incomplete todos (`pending` or `in_progress` status)
3. If incomplete todos exist:
   - Counts pending and in-progress tasks
   - Formats a reminder message with task details
   - Triggers agent input with the reminder
4. If all todos are complete: No action taken

#### Reminder Message Format

```text
📋 **N remaining task(s)** detected:
X pending, Y in progress

Please complete the remaining tasks on your todo list.

- 📝 id: Task content
- 🔄 id: Task content
```

## Configuration

### Service Configuration

The plugin accepts configuration via the `todo` key in your app configuration:

```yaml
todo:
  agentDefaults:
    copyToChild: false      # Copy todos from parent to child agents
    initialItems: []        # Initial todo items for new agents
```

### Configuration Schema

```typescript
import { z } from "zod";

export const TodoConfigSchema = z.object({
  agentDefaults: z.object({
    copyToChild: z.boolean().default(false),
    initialItems: z.array(TodoItemSchema).default([]),
  }).prefault({}),
}).prefault({});
```

**Configuration Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `agentDefaults.copyToChild` | `boolean` | `false` | Enable/disable copying todos to child agents |
| `agentDefaults.initialItems` | `TodoItem[]` | `[]` | Initial todos for new agents |

### Example Configuration

```typescript
import todoPlugin from "@tokenring-ai/todo/plugin";

const app = new TokenRingApp({
  plugins: [
    todoPlugin,
    // ... other plugins
  ],
  config: {
    todo: {
      agentDefaults: {
        copyToChild: true,
        initialItems: [
          {
            id: "1",
            content: "Set up project structure",
            status: "completed"
          },
          {
            id: "2",
            content: "Implement core features",
            status: "pending"
          }
        ]
      }
    }
  }
});
```

## Integration

### Plugin Architecture

The package automatically integrates with TokenRing applications via the plugin system. The plugin registers:

- **TodoService:** Manages todo list state
- **Tools:** `todo` tool for todo management
- **Context Handlers:** `todo-list` for injecting todo context
- **Hooks:** `todoCompletionCheck` for completion reminders

**Plugin Registration:**

```typescript
import todoPlugin from "@tokenring-ai/todo/plugin";

export default {
  plugins: {
    todo: {
      agentDefaults: {
        copyToChild: true,
        initialItems: []
      }
    }
  }
} satisfies TokenRingAppConfig;
```

### Service Dependencies

- **ChatService:** For tool registration and context handler integration
- **AgentLifecycleService:** For hook registration

### State Management

- **TodoState:** Manages todo persistence across agent sessions
- **Parent-Child Transfer:** Optional todo copying via `copyToChild` configuration

## Usage Examples

### Basic Todo Management

```typescript
import { Agent } from "@tokenring-ai/agent";

// Create and update todos
await agent.callTool("todo", {
  todos: [
    {
      id: "task-1",
      content: "Implement authentication",
      status: "in_progress"
    },
    {
      id: "task-2",
      content: "Write tests",
      status: "pending"
    }
  ]
});
```

### Completing a Task

```typescript
// Mark a task as completed
await agent.callTool("todo", {
  todos: [
    {
      id: "task-1",
      content: "Implement authentication",
      status: "completed"
    }
  ]
});
```

### Adding New Tasks

```typescript
// Add a new task (by providing a new ID)
await agent.callTool("todo", {
  todos: [
    {
      id: "task-3",
      content: "Deploy to production",
      status: "pending"
    }
  ]
});
```

### Updating Existing Tasks

```typescript
// Update an existing task (by matching ID)
await agent.callTool("todo", {
  todos: [
    {
      id: "task-2",
      content: "Write comprehensive unit tests",
      status: "in_progress"
    }
  ]
});
```

### Accessing Todo State Directly

```typescript
import { TodoState } from "@tokenring-ai/todo/state/todoState";

// Get current todo state
const todoState = agent.getState(TodoState);
console.log(todoState.todos);

// Get todo summary
console.log(todoState.show());
```

Expected output:

```text
Total: 3
Pending: 1
In Progress: 1
Completed: 1
```

### Configuring Initial Todos

```typescript
import todoPlugin from "@tokenring-ai/todo/plugin";

const app = new TokenRingApp({
  plugins: [todoPlugin],
  config: {
    todo: {
      agentDefaults: {
        initialItems: [
          {
            id: "1",
            content: "Review requirements",
            status: "completed"
          },
          {
            id: "2",
            content: "Design architecture",
            status: "pending"
          }
        ]
      }
    }
  }
});
```

### Enabling Parent-Child Todo Transfer

```typescript
const app = new TokenRingApp({
  plugins: [todoPlugin],
  config: {
    todo: {
      agentDefaults: {
        copyToChild: true  // Todos will be copied to child agents
      }
    }
  }
});
```

## Best Practices

1. **Unique IDs:** Always use unique identifiers for todo items to enable proper updates
2. **Status Progression:** Follow the natural progression: `pending` → `in_progress` → `completed`
3. **Descriptive Content:** Use clear, actionable task descriptions
4. **Regular Updates:** Keep todo status current as work progresses
5. **Task Granularity:** Break complex tasks into smaller, manageable items
6. **ID Generation:** Use UUIDs or other reliable ID generation methods
7. **Initial Setup:** Configure initial todos for new agents to establish workflow patterns
8. **Parent-Child Transfer:** Enable `copyToChild` when agent hierarchy should share task context

## Error Handling

The package includes error handling for:

- **Invalid Status Values:** Zod schema validation ensures only valid status values
- **Empty Content:** Minimum length validation on todo content
- **State Access:** Safe state access with proper agent context

### Schema Validation

```typescript
// Invalid status will fail validation
{
  todos: [
    {
      id: "1",
      content: "Task",
      status: "invalid_status"  // Error: Expected enum, received string
    }
  ]
}

// Empty content will fail validation
{
  todos: [
    {
      id: "1",
      content: "",  // Error: String must contain at least 1 character(s)
      status: "pending"
    }
  ]
}
```

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# With coverage
bun run test --coverage
```

### Test Coverage

The package includes comprehensive tests for the `todoCompletionCheck` hook covering:

- Hook configuration validation
- Empty todo list handling
- All todos completed scenario
- Pending todos notification
- In-progress todos notification
- Multiple incomplete todos
- Message formatting with emojis
- Edge cases

## Package Structure

```text
pkg/todo/
├── index.ts                    # Package exports
├── plugin.ts                   # TokenRing plugin implementation
├── TodoService.ts              # Core todo management service
├── schema.ts                   # Zod schema definitions
├── tools.ts                    # Tool exports
├── tools/
│   └── todo.ts                 # Todo tool implementation
├── contextHandlers.ts          # Context handler exports
├── contextHandlers/
│   └── todo.ts                 # Todo list context handler
├── hooks/
│   └── todoCompletionCheck.ts  # Completion check hook
├── state/
│   └── todoState.ts            # Todo state management
├── util/
│   └── todo.ts                 # Utility functions
├── package.json                # Package metadata
└── vitest.config.ts            # Test configuration
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent` (workspace:*) - Agent system
- `@tokenring-ai/app` (workspace:*) - Application framework
- `@tokenring-ai/chat` (workspace:*) - Chat service integration
- `@tokenring-ai/lifecycle` (workspace:*) - Lifecycle and hook management
- `@tokenring-ai/utility` (workspace:*) - Utility functions
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `typescript` (^6.0.2) - TypeScript compiler
- `vitest` (^4.1.1) - Testing framework

## Related Components

- [`@tokenring-ai/chat`](chat.md): Chat service for tool integration
- [`@tokenring-ai/agent`](agent.md): Agent system for state management
- [`@tokenring-ai/lifecycle`](lifecycle.md): Lifecycle hook system

## License

MIT License - see LICENSE file for details.

## Version

0.2.0
