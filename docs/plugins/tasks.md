# @tokenring-ai/tasks

A comprehensive task management service for the TokenRing AI ecosystem that enables agents to create, manage, and execute task plans with user approval workflows, parallel processing, and complete lifecycle tracking.

## Overview

The `@tokenring-ai/tasks` package provides a complete task planning and execution framework for AI agents within the TokenRing system. It allows agents to create detailed task plans, present them to users for approval, and automatically execute approved tasks by dispatching them to specialized agents with configurable parallel processing.

### Key Features

- **Task Planning**: Create comprehensive task plans with multiple tasks and detailed context
- **User Approval Workflow**: Interactive task plan approval system with configurable timeout
- **Parallel Execution**: Execute tasks in parallel with configurable concurrency limits
- **Task Status Tracking**: Monitor complete task lifecycle (pending, running, completed, failed)
- **Auto-Approve**: Configurable automatic approval for streamlined workflows
- **Manual Management**: Chat commands for task inspection, control, and configuration
- **Context Integration**: Seamless integration with agent context systems
- **State Persistence**: Persistent task state across agent instances
- **Sub-Agent Execution**: Tasks executed via `runSubAgent` with proper context injection

## Installation

This package is part of the TokenRing AI ecosystem. Install it as a dependency:

```bash
bun install @tokenring-ai/tasks
```

## Core Components

### TaskService

The main service that manages the complete task lifecycle:

```typescript
class TaskService implements TokenRingService {
  readonly name = "TaskService";
  description = "Provides task management functionality";

  constructor(readonly options: z.output<typeof TaskServiceConfigSchema>) {}

  attach(agent: Agent): void {
    const config = deepMerge(this.options.agentDefaults, agent.getAgentConfigSlice('tasks', TaskAgentConfigSchema));
    agent.initializeState(TaskState, config);
  }

  addTask(task: Omit<Task, 'id' | 'status'>, agent: Agent): string;
  getTasks(agent: Agent): Task[];
  updateTaskStatus(id: string, status: Task['status'], result: string | undefined, agent: Agent): void;
  clearTasks(agent: Agent): void;
  executeTasks(taskIds: string[], parentAgent: Agent): Promise<string[]>;
}
```

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
  readonly name = "TaskState";
  serializationSchema = serializationSchema;
  readonly tasks: Task[] = [];
  autoApprove: number;           // Auto-approve timeout in seconds
  parallelTasks: number;         // Maximum parallel task execution

  constructor(readonly initialConfig: z.output<typeof TaskServiceConfigSchema>["agentDefaults"]) {
    this.autoApprove = initialConfig.autoApprove;
    this.parallelTasks = initialConfig.parallel;
  }

  transferStateFromParent(agent: Agent): void;
  reset(): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

## Plugin Configuration

The plugin can be configured with default settings for all agents:

```typescript
{
  tasks: {
    agentDefaults: {
      autoApprove: 0,      // Auto-approve timeout in seconds (0 = disabled)
      parallel: 1          // Maximum parallel tasks (minimum: 1)
    }
  }
}
```

### Agent Configuration

Each agent can override the default configuration:

```typescript
{
  tasks: {
    autoApprove: 30,       // Override default auto-approve timeout
    parallel: 3            // Override default parallel tasks
  }
}
```

### Auto-Approve

- **Purpose**: Automatically approve task plans after a timeout
- **Range**: 0 (disabled) to any positive integer (seconds)
- **Default**: 0 (disabled)
- **Usage**: Set via `/tasks settings auto-approve=<seconds>` or `agent.getState(TaskState).autoApprove`

### Parallel Tasks

- **Purpose**: Control concurrent task execution
- **Range**: 1 to any positive integer
- **Default**: 1 (sequential execution)
- **Usage**: Set via `/tasks settings parallel=<count>` or `agent.getState(TaskState).parallelTasks`

### Task Context

- **Message**: One paragraph describing the task objective
- **Context**: Three+ paragraphs with detailed execution instructions
- **Requirement**: Must include file paths, technical specifications, and step-by-step instructions

## Services

### TaskService

The main service that manages the complete task lifecycle.

#### Service Registration

The TaskService is automatically registered when the plugin is installed. Access it via:

```typescript
const taskService = agent.requireServiceByType(TaskService);
```

#### Service Methods

##### `addTask(task, agent)`

Add a single task to the task list.

**Parameters**:
- `task`: `Omit<Task, 'id' | 'status'>` - Task data without ID and status
- `agent`: `Agent` - Current agent instance

**Returns**: `string` - The generated task ID (UUID)

**Example**:

```typescript
const taskId = taskService.addTask({
  name: "Create user account",
  agentType: "backend-developer",
  message: "Implement user registration functionality",
  context: "Create user model, registration endpoint, validation, and error handling. Use bcrypt for password hashing and JWT for session management."
}, agent);
```

##### `getTasks(agent)`

Retrieve all tasks with their current status.

**Parameters**:
- `agent`: `Agent` - Current agent instance

**Returns**: `Task[]` - Array of all tasks (copy)

**Example**:

```typescript
const tasks = taskService.getTasks(agent);
console.log(`Found ${tasks.length} tasks`);
```

##### `updateTaskStatus(id, status, result?, agent)`

Update the status and optionally the result of a task.

**Parameters**:
- `id`: `string` - Task ID
- `status`: `Task['status']` - New status ('pending', 'running', 'completed', 'failed')
- `result`: `string | undefined` - Execution result (optional)
- `agent`: `Agent` - Current agent instance

**Example**:

```typescript
taskService.updateTaskStatus(taskId, 'completed', 'User account created successfully', agent);
```

##### `clearTasks(agent)`

Remove all tasks from the task list.

**Parameters**:
- `agent`: `Agent` - Current agent instance

**Example**:

```typescript
taskService.clearTasks(agent);
```

##### `executeTasks(taskIds, parentAgent)`

Execute a list of tasks with configured parallelism.

**Parameters**:
- `taskIds`: `string[]` - IDs of tasks to execute
- `parentAgent`: `Agent` - Current parent agent instance

**Returns**: `Promise<string[]>` - Array of execution summaries

**Behavior**:
- Executes tasks with controlled parallelism using `async.mapLimit`
- Each task is executed via `runSubAgent` with the task message and context
- Updates task status to 'running' before execution
- Updates task status to 'completed' or 'failed' based on result
- Returns formatted execution summaries with checkmarks or X marks

**Example**:

```typescript
const results = await taskService.executeTasks([taskId1, taskId2], agent);
console.log(results); 
// ['✓ Task 1: Completed', '✗ Task 2: Failed - Error message']
```

## Providers

This package does not use a provider architecture.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

The package registers the following slash commands for users:

### `/tasks`

Manage and execute tasks in the task queue.

**Description**: `/tasks - Manage and execute tasks in the task queue.`

**Available Operations**:

#### list

Display all tasks in the current task queue with their status, agent type, and message content.

**Example**:

```
/tasks list
```

**Output**:

```
Current tasks:
[0] Process Data (pending)
  Agent: data-processor
  Message: Process the uploaded CSV file
[1] Send Email (completed)
  Agent: email-sender
  Message: Send confirmation email to user@example.com
  Result: Email sent successfully...
```

#### clear

Remove all tasks from the current task queue. This action cannot be undone.

**Example**:

```
/tasks clear
```

**Output**:

```
Cleared all tasks
```

#### execute

Execute all pending tasks by dispatching them to their respective agents. Only tasks with 'pending' status will be executed.

**Example**:

```
/tasks execute
```

**Output**:

```
Task execution completed:
✓ Process Data: Completed
✗ Send Email: Failed - SMTP connection failed
```

#### settings

View or modify task settings. Settings are stored in the agent state and apply to the current agent.

**Examples**:

```
/tasks settings
/tasks settings auto-approve=30
/tasks settings parallel=3
```

**Output**:

```
Task Settings:
 Auto-approve: 30s
 Parallel tasks: 3

Usage:
 /tasks settings auto-approve=<seconds> parallel=<number>
```

## State Management

### TaskState

The package uses a state management system for task persistence and serialization.

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| tasks | Task[] | Array of tasks in the queue |
| autoApprove | number | Auto-approve timeout in seconds (0 = disabled) |
| parallelTasks | number | Maximum parallel task execution |

#### State Transfer

Tasks are shared with parent agents via `transferStateFromParent()` method. 

**Important Note**: The tasks array is currently shared by reference with the parent agent. This is a temporary implementation that should be revisited for better state isolation. The array is marked as readonly to prevent accidental replacement.

#### State Reset

Tasks are cleared via the `reset()` method, which removes all tasks from the tasks array.

#### Serialization

The state can be serialized and deserialized for persistence:

```typescript
// Serialize
const serialized = taskState.serialize();
// { tasks: [...], autoApprove: 30, parallelTasks: 3 }

// Deserialize
taskState.deserialize({ tasks: [], autoApprove: 0, parallelTasks: 1 });
```

#### State Display

The `show()` method returns a human-readable summary:

```typescript
const output = taskState.show();
// [
//   'Total Tasks: 5',
//   '  pending: 2',
//   '  running: 1',
//   '  completed: 1',
//   '  failed: 1',
//   'Auto-approve: 30s',
//   'Parallel tasks: 3'
// ]
```

## Tools

The package provides the following tools for AI agents:

### tasks_run

Create and present a complete task plan to the user for approval. If approved, execute all tasks immediately with parallel processing.

**Tool Name**: `tasks_run`

**Display Name**: `Tasks/runTasks`

**Description**: "Create and present a complete task plan to the user for approval (unless auto-approve is enabled). If approved, this will execute all tasks immediately and return results. If not approved, this will return a reason for rejection."

**Required Context Handlers**: `["available-agents"]`

**Input Schema**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tasks | TaskInput[] | Yes | Array of tasks to add to the task list |

**TaskInput Schema**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| taskName | string | Yes | A descriptive name for the task |
| agentType | string | Yes | The type of agent that should handle this task |
| message | string | Yes | A one paragraph message/description of what needs to be done |
| context | string | Yes | Three paragraphs of important contextual information |

**Behavior**:
- Presents task plan to user for approval
- Respects auto-approve configuration if set
- If approved: adds tasks and executes them with parallel processing
- If rejected: prompts for rejection reason and returns it

**Example Usage**:

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

## Context Handlers

### task-plan

Provides current task summaries to agents as context.

**Handler Name**: `task-plan`

**Usage**: Automatically integrated when the plugin is installed

**Behavior**:
- Iterates through all tasks in the task list
- Yields context items with task summaries using async generator pattern
- Includes task name, status, agent type, and message
- Only provides context if tasks exist

**Example**:

```typescript
// Agent receives context like:
/* The user has approved the following task plan */:
- Create user authentication (pending): backend-developer - Implement JWT-based authentication
- Design login UI (pending): frontend-developer - Create responsive login forms
- Write tests (completed): test-engineer - Create comprehensive test suite
```

**Implementation Pattern**:

The context handler uses an async generator function to yield context items:

```typescript
export default async function* getContextItems({agent}: ContextHandlerOptions): AsyncGenerator<ContextItem> {
  const taskService = agent.requireServiceByType(TaskService);
  const tasks = taskService.getTasks(agent);
  
  if (tasks.length > 0) {
    const taskSummary = tasks.map(t =>
      `- ${t.name} (${t.status}): ${t.agentType} - ${t.message}`
    ).join('\n');

    yield {
      role: "user",
      content: `/* The user has approved the following task plan */:\n${taskSummary}`
    };
  }
}
```

## Scripting Integration

This package does not register functions with the ScriptingService.

## Usage Examples

### 1. Using the Task Planning Tool

The primary way to create and execute task plans with user approval:

```typescript
// Create a comprehensive task plan
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
    },
    {
      taskName: "Write authentication tests",
      agentType: "test-engineer",
      message: "Create comprehensive test suite for auth system",
      context: "Write unit tests for auth middleware, integration tests for login/logout endpoints, and E2E tests for UI flows. Include edge cases like invalid credentials, expired tokens, and concurrent access scenarios. Ensure proper test coverage and maintainable test structure. Mock external dependencies appropriately."
    }
  ]
});
```

### 2. Programmatic Task Management

```typescript
import TaskService from '@tokenring-ai/tasks';

const taskService = agent.requireServiceByType(TaskService);

// Add individual tasks
const taskId = taskService.addTask({
  name: "Process user data",
  agentType: "data-processor",
  message: "Clean and validate user input data",
  context: "Parse CSV files, remove duplicates, validate email formats, and standardize data formats. Handle missing values appropriately and generate summary reports. Implement proper error handling for malformed data."
}, agent);

// Get all tasks
const allTasks = taskService.getTasks(agent);

// Update task status
taskService.updateTaskStatus(taskId, 'completed', 'Data processed successfully', agent);

// Execute specific tasks
const results = await taskService.executeTasks([taskId], agent);
```

### 3. Configuration Management

```typescript
// Configure auto-approve timeout (seconds)
agent.mutateState(TaskState, state => {
  state.autoApprove = 30;
});

// Configure parallel task execution
agent.mutateState(TaskState, state => {
  state.parallelTasks = 3;
});

// Get current configuration
const autoApproveTimeout = agent.getState(TaskState).autoApprove;
const parallelLimit = agent.getState(TaskState).parallelTasks;
```

## Integration

The package integrates seamlessly with the TokenRing ecosystem:

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

### Sub-Agent Integration

- **Task Execution**: Tasks executed via `runSubAgent` from `@tokenring-ai/agent`
- **Context Injection**: Task message and context combined and passed to sub-agent
- **Status Tracking**: Task status updated based on sub-agent execution result
- **Error Handling**: Errors from sub-agent execution are captured and reported

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

### Command Errors

The settings command uses `CommandFailedError` for validation errors:

- **Invalid Setting Format**: Throws when setting doesn't match `key=value` pattern
- **Invalid Auto-Approve Value**: Throws when value is negative or not a number
- **Invalid Parallel Value**: Throws when value is less than 1 or not a number

**Example Error Handling**:

```typescript
try {
  await agent.executeCommand('/tasks settings auto-approve=-5');
} catch (error) {
  if (error instanceof CommandFailedError) {
    console.error(`Command failed: ${error.message}`);
    // Output: Command failed: auto-approve must be >= 0
  }
}
```

### Recovery Strategies

- **Retry Failed Tasks**: Use `/tasks execute` to retry failed tasks
- **Clear and Restart**: Use `/tasks clear` to reset and start fresh
- **Status Inspection**: Use `/tasks list` to identify specific failures

## Testing and Development

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

### Test Files

- `runTasks.test.ts` - Tests for the runTasks tool
- `tasksCommand.test.ts` - Tests for task commands

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
│   └── tasks/
│       ├── list.ts             # List all tasks command
│       ├── execute.ts          # Execute pending tasks command
│       ├── clear.ts            # Clear all tasks command
│       └── settings.ts         # View/modify task settings command
├── commands.ts                 # Command exports
├── tools.ts                    # Tool exports
├── contextHandlers.ts          # Context handler exports
├── contextHandlers/
│   └── taskPlan.ts             # Task plan context handler
├── plugin.ts                   # Plugin configuration
├── schema.ts                   # Configuration schemas
├── package.json                # Package metadata and dependencies
└── README.md                   # Package documentation
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: 0.2.0
- `@tokenring-ai/chat`: 0.2.0
- `@tokenring-ai/agent`: 0.2.0
- `@tokenring-ai/utility`: 0.2.0
- `zod`: ^4.3.6
- `uuid`: ^13.0.0
- `async`: ^3.2.6

### Development Dependencies

- `vitest`: ^4.0.18
- `typescript`: ^5.9.3
- `@types/async`: ^3.2.25

## Package Exports

The package exports the following:

```typescript
// Main service
export {default as TaskService} from "./TaskService.ts";

// Type definitions
export type {Task} from "./state/taskState.ts";
```

## Related Components

- [@tokenring-ai/agent](./agent.md): Core agent orchestration system
- [@tokenring-ai/chat](./chat.md): Chat interface and command handling
- [@tokenring-ai/app](./app.md): Base application framework
- [@tokenring-ai/utility](./utility.md): Shared utilities and helpers

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.

## Version

0.2.0
