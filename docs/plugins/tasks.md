# Task Management Plugin

## Overview

The Task Management Plugin provides a robust system for handling tasks within the TokenRing ecosystem. It enables the scheduling, execution, and monitoring of tasks through an integrated service architecture, supporting both automated workflows and user-initiated commands. The package enables agents to create detailed task plans, present them to users for approval, and automatically execute approved tasks by dispatching them to specialized agents with configurable parallel processing.

## Key Features

- **Task Planning**: Create comprehensive task plans with multiple tasks and detailed context
- **User Approval Workflow**: Interactive task plan approval system with configurable timeout
- **Parallel Execution**: Execute tasks in parallel with configurable concurrency limits
- **Task Status Tracking**: Monitor complete task lifecycle (pending, running, completed, failed)
- **Auto-Approve**: Configurable automatic approval for streamlined workflows
- **Manual Management**: Slash commands for task inspection, control, and configuration
- **Context Integration**: Seamless integration with agent context systems
- **State Persistence**: Persistent task state across agent instances

## Core Components

- **TaskService**: The central service handling task creation, execution, and lifecycle management
- **TaskState**: State management for persistence and serialization
- **Tools**: A set of functions exposed to AI agents for task-related operations, primarily the `tasks_run` tool
- **Context Handlers**: Manage task-related context during chat sessions (e.g., `task-plan` handler)
- **Chat Commands**: User-facing slash commands for task management (`/tasks list`, `/tasks clear`, etc.)

## Installation

This package is part of the TokenRing AI ecosystem. Install it as a dependency:

```bash
bun install @tokenring-ai/tasks
```

## Usage Examples

### Basic Setup

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import tasksPlugin from '@tokenring-ai/tasks';

const app = new TokenRingApp();
app.install(tasksPlugin);
```

### Creating a Task Plan via AI Tool

```typescript
await agent.executeTool('tasks_run', {
  tasks: [
    {
      taskName: "Create user authentication system",
      agentType: "backend-developer",
      message: "Implement JWT-based authentication with login/logout endpoints",
      context: "Create auth middleware, user model, login/logout routes in Express.js. Use bcrypt for password hashing. Include proper error handling and validation. Set up appropriate HTTP status codes and response formats. Handle edge cases like expired tokens and concurrent requests."
    },
    {
      taskName: "Design login UI components",
      agentType: "frontend-developer",
      message: "Create responsive login and registration forms",
      context: "Build React components with form validation, error handling, and responsive design using Tailwind CSS. Include loading states, proper accessibility attributes, and consistent styling with the application's design system. Implement proper error messaging and success states."
    }
  ]
});
```

### Managing Tasks via Slash Commands

```bash
/tasks list
```

**Output:**
```
Current tasks:
[0] Process Data (pending)
    Agent: data-processor
    Message: Process the uploaded CSV file
[1] Send Email (completed)
    Agent: email-sender
    Message: Send confirmation email to user@example.com
```

```bash
/tasks auto-approve 30
```

**Output:**
```
Auto-approve enabled with 30s timeout
```

### Programmatic Task Management

```typescript
import TaskService from '@tokenring-ai/tasks';

const taskService = agent.requireServiceByType(TaskService);

// Add individual tasks
const taskId = taskService.addTask({
  name: "Process user data",
  agentType: "data-processor",
  message: "Clean and validate user input data",
  context: "Parse CSV files, remove duplicates, validate email formats, and standardize data formats. Handle missing values appropriately and generate summary reports."
}, agent);

// Get all tasks
const allTasks = taskService.getTasks(agent);

// Update task status
taskService.updateTaskStatus(taskId, 'completed', 'Data processed successfully', agent);

// Execute specific tasks
const results = await taskService.executeTasks([taskId], agent);
```

## Core Properties

### Task Interface

Each task contains comprehensive information for execution:

```typescript
interface Task {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Descriptive task name
  agentType: string;             // Type of agent to handle the task
  message: string;               // Main task description (1 paragraph)
  context: string;               // Detailed execution instructions (3+ paragraphs)
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;               // Execution result if completed
}
```

### TaskState

State management for persistence and serialization:

```typescript
class TaskState implements AgentStateSlice {
  tasks: Task[];                 // Array of all tasks
  autoApprove: number;           // Auto-approve timeout in seconds
  parallelTasks: number;         // Maximum parallel task execution

  // State management methods
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];

  // Reset and transfer methods
  transferStateFromParent(parent: Agent): void;
  reset(what: ResetWhat[]): void;
}
```

## Key Features Summary

- **Task Planning**: Create comprehensive task plans with multiple tasks and detailed context
- **User Approval Workflow**: Interactive task plan approval system with configurable timeout
- **Parallel Execution**: Execute tasks in parallel with configurable concurrency limits
- **Task Status Tracking**: Monitor complete task lifecycle (pending, running, completed, failed)
- **Auto-Approve**: Configurable automatic approval for streamlined workflows
- **Manual Management**: Slash commands for task inspection, control, and configuration
- **Context Integration**: Seamless integration with agent context systems
- **State Persistence**: Persistent task state across agent instances

## Core Methods

### TaskService Methods

#### `addTask(task, agent)`

Add a single task to the task list.

**Parameters:**
- `task`: `Omit<Task, 'id' | 'status'>` - Task data without ID and status
- `agent`: `Agent` - Current agent instance

**Returns:** `string` - The generated task ID

**Example:**
```typescript
const taskId = taskService.addTask({
  name: "Create user account",
  agentType: "backend-developer",
  message: "Implement user registration functionality",
  context: "Create user model, registration endpoint, validation, and error handling. Use bcrypt for password hashing and JWT for session management."
}, agent);
```

#### `getTasks(agent)`

Retrieve all tasks with their current status.

**Parameters:**
- `agent`: `Agent` - Current agent instance

**Returns:** `Task[]` - Array of all tasks

**Example:**
```typescript
const tasks = taskService.getTasks(agent);
console.log(`Found ${tasks.length} tasks`);
```

#### `updateTaskStatus(id, status, result?, agent)`

Update the status and optionally the result of a task.

**Parameters:**
- `id`: `string` - Task ID
- `status`: `Task['status']` - New status ('pending', 'running', 'completed', 'failed')
- `result`: `string | undefined` - Execution result (optional)
- `agent`: `Agent` - Current agent instance

**Example:**
```typescript
taskService.updateTaskStatus(taskId, 'completed', 'User account created successfully', agent);
```

#### `clearTasks(agent)`

Remove all tasks from the task list.

**Parameters:**
- `agent`: `Agent` - Current agent instance

**Example:**
```typescript
taskService.clearTasks(agent);
```

#### `executeTasks(taskIds, parentAgent)`

Execute a list of tasks with configured parallelism.

**Parameters:**
- `taskIds`: `string[]` - IDs of tasks to execute
- `parentAgent`: `Agent` - Current parent agent instance

**Returns:** `Promise<string[]>` - Array of execution summaries

**Example:**
```typescript
const results = await taskService.executeTasks([taskId1, taskId2], agent);
console.log(results); // ['✓ Task 1: Completed', '✗ Task 2: Failed - Error message']
```

#### `getAutoApprove(agent)`

Get the current auto-approve timeout setting.

**Parameters:**
- `agent`: `Agent` - Current agent instance

**Returns:** `number` - Auto-approve timeout in seconds (0 = disabled)

#### `setAutoApprove(seconds, agent)`

Set the auto-approve timeout.

**Parameters:**
- `seconds`: `number` - Timeout in seconds (0 = disabled)
- `agent`: `Agent` - Current agent instance

**Example:**
```typescript
taskService.setAutoApprove(45, agent); // Auto-approve after 45 seconds
```

#### `setParallelTasks(parallelTasks, agent)`

Set the maximum number of tasks to execute in parallel.

**Parameters:**
- `parallelTasks`: `number` - Maximum parallel tasks (minimum: 1)
- `agent`: `Agent` - Current agent instance

**Example:**
```typescript
taskService.setParallelTasks(3, agent); // Allow 3 parallel tasks
```

### TaskState Methods

#### `transferStateFromParent(parent)`

Transfer task state from a parent agent instance.

**Parameters:**
- `parent`: `Agent` - Parent agent instance

**Example:**
```typescript
taskState.transferStateFromParent(parentAgent);
```

#### `reset(what)`

Reset task state based on specified criteria.

**Parameters:**
- `what`: `ResetWhat[]` - Array of reset criteria (e.g., `['chat']` to clear tasks on chat reset)

**Behavior:**
- When `['chat']` is specified, all tasks are cleared
- Other reset criteria are passed through to other state handlers

**Example:**
```typescript
taskState.reset(['chat']); // Clears all tasks
```

#### `show()`

Get human-readable state summary.

**Returns:** `string[]` - Array of state information lines

**Example:**
```typescript
const output = taskState.show();
// Output: ['Total Tasks: 5', '  pending: 2', '  running: 1', '  completed: 1', '  failed: 1', 'Auto-approve: 30s', 'Parallel tasks: 3']
```

## Commands and Tools

### Chat Commands

The plugin registers the following slash commands for users:

- **`/tasks list`**: Display all tasks in the queue with their status, agent type, and message content
- **`/tasks clear`**: Remove all tasks from the task queue
- **`/tasks execute`**: Execute all pending tasks by dispatching them to their respective agents
- **`/tasks auto-approve [seconds]`**: Set auto-approve timeout in seconds (0 to disable)
- **`/tasks parallel [count]`**: Set the maximum number of tasks to run in parallel

### AI Tools

#### `tasks_run`

Create and present a complete task plan to the user for approval. If approved, executes all tasks immediately with parallel processing.

**Description:** "Create and present a complete task plan to the user for approval (unless auto-approve is enabled). If approved, this will execute all tasks immediately and return results. If not approved, this will return a reason for rejection."

**Required Context Handlers:** `["available-agents"]`

**Input Schema:**
```typescript
{
  tasks: z.array(z.object({
    taskName: z.string().describe("A descriptive name for the task"),
    agentType: z.string().describe("The type of agent that should handle this task"),
    message: z.string().describe("A one paragraph message/description of what needs to be done, to send to the agent."),
    context: z.string().describe("Three paragraphs of important contextual information to pass to the agent, such as file names, step by step instructions, descriptions, etc. of the exact steps the agent should take. This information is critical to proper agent functionality, and should be detailed and comprehensive. It needs to explain absolutely every aspect of how to complete the task to the agent that will be dispatched")
  })).describe("Array of tasks to add to the task list")
}
```

**Behavior:**
- Presents task plan to user for approval
- Respects auto-approve configuration if set
- If approved: adds tasks and executes them with parallel processing
- If rejected: prompts for rejection reason and returns it

### Context Handlers

#### `task-plan`

Provides current task summaries to agents as context.

**Usage:** Automatically integrated when the plugin is installed

**Example:**
```typescript
// Agent receives context like:
/* The user has approved the following task plan */:
- Create user authentication (pending): backend-developer - Implement JWT-based authentication
- Design login UI (pending): frontend-developer - Create responsive login forms
```

## Configuration

The plugin supports configuration through slash commands:

### Auto-Approve Timeout

Set the time (in seconds) for automatic approval of task plans. Default is 5 seconds. Set to 0 to disable.

- **Command:** `/tasks auto-approve [seconds]`
- **Programmatic:** `taskService.setAutoApprove(seconds, agent)`

**Example:**
```bash
/tasks auto-approve 30
```

### Parallel Tasks

Control the maximum number of tasks that can run concurrently. Default is 1.

- **Command:** `/tasks parallel [count]`
- **Programmatic:** `taskService.setParallelTasks(count, agent)`

**Example:**
```bash
/tasks parallel 3
```

### Configuration Summary

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `autoApprove` | number | 5 | 0+ seconds | Auto-approve timeout (0 = disabled) |
| `parallelTasks` | number | 1 | 1+ | Maximum concurrent task execution |

## Task Planning Workflow

1. **Planning Phase**: Create comprehensive task plans with detailed context
2. **Approval Phase**: Task plan presented to user with clear descriptions and agent assignments
3. **Auto-Approve Check**: If configured, automatically approve after timeout
4. **Execution Phase**: Upon approval, tasks are added and executed with parallel processing
5. **Tracking Phase**: Task status updated in real-time as agents complete work
6. **Results Phase**: Execution results collected and reported back

## Integration

The plugin integrates seamlessly with the TokenRing ecosystem:

### Plugin System

- **Automatic Registration**: Plugin automatically registers services and tools
- **Service Dependencies**: Waits for `ChatService` and `AgentCommandService`
- **Tool Registration**: Adds `tasks_run` tool to `ChatService` for agent use
- **Command Registration**: Adds slash commands for manual control
- **Context Handler Registration**: Registers `task-plan` context handler

### Service Integration

- **State Management**: Integrates with Agent state system via `TaskState`
- **Service Injection**: Available via `agent.requireServiceByType(TaskService)`
- **Lifecycle**: Attaches to agents during initialization

### Tool Integration

- **Tool Discovery**: Tools automatically available to agents via `ChatService`
- **Schema Validation**: Zod-based input validation for all tool parameters
- **Error Handling**: Comprehensive error handling and user feedback

### Command Integration

- **Slash Commands**: All commands use `/tasks` prefix
- **Parameter Parsing**: Robust parameter parsing and validation
- **Help Integration**: Built-in help system with detailed documentation

## Best Practices

### Task Planning

- **Comprehensive Context**: Provide detailed context with step-by-step instructions
- **Clear Agent Assignment**: Use appropriate agent types for each task
- **Dependency Management**: Order tasks to handle dependencies properly
- **Context Detail**: Include file paths, technical requirements, and edge cases

### Configuration

- **Auto-Approve**: Use for routine or well-tested task plans
- **Parallel Execution**: Use for independent tasks to improve efficiency
- **Timeout Management**: Set reasonable timeouts based on task complexity

### Error Handling

- **Retry Logic**: Implement retry logic for failed tasks
- **Error Context**: Provide detailed error context in task results
- **Graceful Degradation**: Handle partial task execution failures

### Performance

- **Parallel Limits**: Don't exceed reasonable parallel task limits
- **Memory Management**: Clear completed tasks periodically
- **State Persistence**: Be mindful of state size with many tasks

## Common Use Cases

### Development Workflows

```typescript
// Feature development
await agent.executeTool('tasks_run', {
  tasks: [
    {taskName: "Backend API", agentType: "backend-developer", message: "Create REST API endpoints", context: "..."},
    {taskName: "Frontend Components", agentType: "frontend-developer", message: "Build UI components", context: "..."},
    {taskName: "Integration Tests", agentType: "test-engineer", message: "Create integration tests", context: "..."}
  ]
});
```

### Data Processing

```typescript
// Batch data processing
const taskIds = [];
for (const file of dataFiles) {
  const taskId = taskService.addTask({
    name: `Process ${file}`,
    agentType: "data-processor",
    message: `Process ${file} and extract insights`,
    context: `Load ${file}, apply transformation rules, validate data quality, and generate summary report.`
  }, agent);
  taskIds.push(taskId);
}

await taskService.executeTasks(taskIds, agent);
```

### Content Creation

```typescript
// Content production pipeline
await agent.executeTool('tasks_run', {
  tasks: [
    {taskName: "Research", agentType: "researcher", message: "Gather information on topic", context: "..."},
    {taskName: "Writing", agentType: "writer", message: "Create draft content", context: "..."},
    {taskName: "Review", agentType: "editor", message: "Review and edit content", context: "..."}
  ]
});
```

## Error Handling

### Task Execution Errors

- **Network Issues**: Tasks fail gracefully with error messages
- **Agent Unavailable**: Proper error handling for missing agent types
- **Timeout**: Configurable timeouts for task execution
- **Partial Failures**: Individual task failures don't stop other tasks

### Recovery Strategies

- **Retry Failed Tasks**: Use `/tasks execute` to retry failed tasks
- **Clear and Restart**: Use `/tasks clear` to reset and start fresh
- **Status Inspection**: Use `/tasks list` to identify specific failures

## Monitoring and Debugging

- **Testing**: Run tests using `bun test` commands
- **Debugging**: Enable debug logs by setting `DEBUG=tokenring:tasks` environment variable
- **Error Handling**: Tasks fail gracefully with detailed error messages

## Development

### Building and Testing

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Run tests with coverage
bun run test:coverage

# Watch for changes
bun test --watch
```

### Package Structure

```
pkg/tasks/
├── index.ts                    # Package exports and plugin registration
├── TaskService.ts              # Main task management service
├── state/
│   └── taskState.ts            # Task data structures and state management
├── tools/
│   └── runTasks.ts             # Task planning and execution tool
├── commands/
│   └── tasks.ts                # Chat commands for task management
├── chatCommands.ts             # Command exports
├── tools.ts                    # Tool exports
├── contextHandlers.ts          # Context handler exports
├── contextHandlers/
│   └── taskPlan.ts             # Task plan context handler
├── plugin.ts                   # Plugin configuration
├── package.json                # Package metadata and dependencies
└── README.md                   # This documentation
```

## Related Components

- [@tokenring-ai/agent](./agent.md): Core agent orchestration system
- [@tokenring-ai/chat](./chat.md): Chat interface and command handling
- [@tokenring-ai/app](./app.md): Base application framework
- [@tokenring-ai/utility](./utility.md): Shared utilities and helpers
- [zod]: Schema validation for configuration
- [uuid]: UUID generation for unique task IDs
- [async]: Async utilities for parallel task execution

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/tokenring/blob/main/pkg/tasks/LICENSE) for details.

## Version

0.2.0
