# @tokenring-ai/tasks

Framework for planning and executing complex, multi-agent collaborative workflows.

## User Guide

### Overview

The `@tokenring-ai/tasks` package provides a complete task planning and execution framework for AI agents within the TokenRing system. It allows agents to create detailed task plans, present them to users for approval, and automatically execute approved tasks by dispatching them to specialized sub-agents with configurable parallel processing.

### Key Features

- **Task Planning**: Create comprehensive task plans with multiple tasks and detailed context
- **User Approval Workflow**: Interactive task plan approval system with configurable timeout
- **Parallel Execution**: Execute tasks in parallel with configurable concurrency limits
- **Task Status Tracking**: Monitor complete task lifecycle (pending, running, completed, failed)
- **Auto-Approve**: Configurable automatic approval for streamlined workflows
- **Sub-Agent Allowlisting**: Control which agent types can be dispatched as sub-agents via wildcard patterns
- **Sub-Agent Configuration**: Configure sub-agent execution options per agent
- **Manual Management**: Chat commands for task inspection, control, and configuration
- **Context Integration**: Seamless integration with agent context systems
- **RPC Endpoints**: Remote procedure call interface for managing sub-agents
- **State Persistence**: Persistent task state across agent instances

### Installation

This package is part of the TokenRing AI ecosystem. Install it as a dependency:

```bash
bun add @tokenring-ai/tasks
```

For local development in the TokenRing monorepo, the package is available as a workspace dependency.

### Chat Commands

The package registers the following slash commands for task management:

| Command | Description |
|---------|-------------|
| `/tasks list` | Display all tasks in the current task queue |
| `/tasks execute` | Execute all pending tasks |
| `/tasks clear` | Remove all tasks from the task queue |
| `/tasks settings` | View or modify task settings |

#### `/tasks list`

Display all tasks in the current task queue with their status and details.

**Example**:

```bash
/tasks list
```

**Output**:

```text
Current tasks:
[0] Process Data (pending)
  Agent: data-processor
  Message: Process the uploaded CSV file
[1] Send Email (completed)
  Agent: email-sender
  Message: Send confirmation email to user@example.com
  Result: Email sent successfully...
```

Note: Task results are truncated to 100 characters with `...` appended.

#### `/tasks execute`

Execute all pending tasks in the task queue.

**Example**:

```bash
/tasks execute
```

**Output**:

```text
Task execution completed:
✓ Process Data: Completed
✗ Send Email: Failed - SMTP connection failed
```

#### `/tasks clear`

Remove all tasks from the current task queue.

**Example**:

```bash
/tasks clear
```

**Output**:

```text
Cleared all tasks
```

#### `/tasks settings`

View or modify task settings. Omit arguments to show current settings.

**Examples**:

```bash
/tasks settings
/tasks settings auto-approve=30
/tasks settings parallel=3
/tasks settings auto-approve=30 parallel=5
```

**Output** (no arguments):

```text
Task Settings:
 Auto-approve: 30s
 Parallel tasks: 3

Usage:
 /tasks settings auto-approve=<seconds> parallel=<number>
```

**Output** (with settings):

```text
Auto-approve enabled with 30s timeout
Parallel tasks set to 5
```

**Error Handling**: Invalid settings throw `CommandFailedError` with descriptive messages:

- `auto-approve must be >= 0`
- `parallel must be >= 1`
- `Invalid setting: <setting>`

### Tools

The package provides the following tool for AI agents:

| Tool | Display Name | Description |
|------|--------------|-------------|
| `tasks_run` | Tasks/runTasks | Create and execute task plans with user approval |

#### `tasks_run`

Create and present a complete task plan to the user for approval. If approved, execute all tasks immediately with parallel processing.

**Description**: Create and present a complete task plan to the user for approval (unless auto-approve is enabled). If approved, this will execute all tasks immediately and return results. If not approved, this will return a reason for rejection.

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
- If rejected: prompts for rejection reason and returns it via `ToolCallError`

**Example Usage**:

```typescript
await agent.executeTool("tasks_run", {
  tasks: [
    {
      taskName: "Create user authentication system",
      agentType: "backend-developer",
      message: "Implement JWT-based authentication with login/logout endpoints",
      context: "Create auth middleware, user model, login/logout routes in Express.js. Use bcrypt for password hashing. Include proper error handling and validation. Set up appropriate HTTP status codes and response formats. Handle edge cases like expired tokens and concurrent requests.",
    },
    {
      taskName: "Design login UI components",
      agentType: "frontend-developer",
      message: "Create responsive login and registration forms",
      context: "Build React components with form validation, error handling, and responsive design using Tailwind CSS. Include loading states, proper accessibility attributes, and consistent styling with the application's design system. Implement proper error messaging and success states.",
    },
  ],
});
```

### Plugin Configuration

The plugin can be configured with default settings for all agents:

```yaml
tasks:
  agentDefaults:
    autoApprove: 0
    parallel: 1
    allowedSubAgents: []
    subAgent: {}
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| autoApprove | number | 0 | Auto-approve timeout in seconds (0 = disabled) |
| parallel | number | 1 | Maximum parallel task execution (minimum: 1) |
| allowedSubAgents | string[] | [] | Agent types allowed as sub-agents (supports wildcards) |
| subAgent | object | {} | Sub-agent execution options |

#### Auto-Approve

- **Purpose**: Automatically approve task plans after a timeout
- **Range**: 0 (disabled) to any positive integer (seconds)
- **Default**: 0 (disabled)
- **Usage**: Set via `/tasks settings auto-approve=<seconds>` or `agent.getState(TaskState).autoApprove`

#### Parallel Tasks

- **Purpose**: Control concurrent task execution
- **Range**: 1 to any positive integer
- **Default**: 1 (sequential execution)
- **Usage**: Set via `/tasks settings parallel=<count>` or `agent.getState(TaskState).parallelTasks`

#### Allowed Sub-Agents

- **Purpose**: Restrict which agent types can be dispatched as sub-agents
- **Format**: Array of agent type strings or wildcard patterns (e.g., `"backend-*"`, `"*.developer"`)
- **Default**: `[]` (empty; resolved via wildcard matching in `attach()`)
- **Resolution**: Wildcard patterns are resolved to actual agent types using `AgentManager.getAgentTypesLike()` during agent attachment
- **Validation**: `executeTasks()` validates that each task's `agentType` is in the resolved `allowedSubAgents` list
- **Management**: Use RPC endpoints (`enableSubAgents`, `disableSubAgents`) or mutate `TaskState.allowedSubAgents` directly

#### Sub-Agent Configuration

- **Purpose**: Configure options passed to sub-agent execution
- **Schema**: Uses `SubAgentConfigSchema` from `@tokenring-ai/agent/schema`
- **Default**: `{}` (empty configuration)
- **Usage**: Passed to `SubAgentService.runSubAgent()` via the `options` parameter

#### Task Context

- **Message**: One paragraph describing the task objective
- **Context**: Three+ paragraphs with detailed execution instructions
- **Requirement**: Must include file paths, technical specifications, and step-by-step instructions

### Integration

The package integrates with the following TokenRing services:

- **ChatService**: Tool registration and context handler registration
- **AgentCommandService**: Slash command registration
- **RpcService**: RPC endpoint registration for sub-agent management
- **TaskService**: Core task management service

### Best Practices

#### Task Planning

- **Comprehensive Context**: Provide detailed context with step-by-step instructions
- **Clear Agent Assignment**: Use appropriate agent types for each task
- **Dependency Management**: Order tasks to handle dependencies properly
- **Context Detail**: Include file paths, technical requirements, and edge cases
- **Message Brevity**: Keep the message field to one paragraph
- **Context Depth**: Provide 3+ paragraphs in the context field

#### Configuration

- **Auto-Approve**: Use for routine or well-tested task plans
- **Parallel Execution**: Use for independent tasks to improve efficiency
- **Timeout Management**: Set reasonable timeouts based on task complexity
- **Parallel Limits**: Consider agent availability when setting parallel limits
- **Sub-Agent Allowlisting**: Restrict allowed sub-agents to only those needed for security and resource management

#### Error Handling

- **Retry Logic**: Use `/tasks execute` to retry failed tasks
- **Error Context**: Provide detailed error context in task results
- **Graceful Degradation**: Handle partial task execution failures

#### Performance

- **Parallel Limits**: Do not exceed reasonable parallel task limits
- **Memory Management**: Clear completed tasks periodically with `/tasks clear`
- **State Persistence**: Be mindful of state size with many tasks

## Developer Reference

### Core Components

#### TaskService

The main service that manages the complete task lifecycle.

```typescript
class TaskService implements TokenRingService {
  readonly name = "TaskService";
  description = "Provides task management functionality";

  constructor(readonly options: z.output<typeof TaskServiceConfigSchema>) {}

  attach(agent: Agent): void;

  addTask(task: Omit<Task, "id" | "status">, agent: Agent): string;

  getTasks(agent: Agent): Task[];

  updateTaskStatus(
    id: string,
    status: Task["status"],
    result: string | undefined,
    agent: Agent
  ): void;

  clearTasks(agent: Agent): void;

  executeTasks(taskIds: string[], parentAgent: Agent): Promise<string[]>;
}
```

#### Task Interface

Each task contains comprehensive information for execution:

```typescript
interface Task {
  id: string;
  name: string;
  agentType: string;
  message: string;
  context: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
}
```

#### TaskState

State management for persistence and serialization:

```typescript
class TaskState extends AgentStateSlice<typeof serializationSchema> {
  tasks: Task[] = [];
  autoApprove: number;
  parallelTasks: number;
  allowedSubAgents: string[];
  subAgent: ParsedSubAgentConfig;

  constructor(
    readonly initialConfig: z.output<typeof TaskServiceConfigSchema>["agentDefaults"]
  ) {
    super("TaskState", serializationSchema);
    this.autoApprove = initialConfig.autoApprove;
    this.parallelTasks = initialConfig.parallel;
    this.allowedSubAgents = [...initialConfig.allowedSubAgents];
    this.subAgent = deepClone(initialConfig.subAgent);
  }

  transferStateFromParent(agent: Agent): void;

  reset(): void;

  serialize(): z.output<typeof serializationSchema>;

  deserialize(data: z.output<typeof serializationSchema>): void;

  show(): string;
}
```

**Serialization Schema**:

```typescript
const serializationSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        agentType: z.string(),
        message: z.string(),
        context: z.string(),
        status: z.enum(["pending", "running", "completed", "failed"]),
        result: z.string().exactOptional(),
      })
    )
    .prefault([]),
  autoApprove: z.number(),
  parallelTasks: z.number(),
  allowedSubAgents: z.array(z.string()),
  subAgent: SubAgentConfigSchema,
});
```

### Services

#### TaskService API Reference

##### Service Registration

The TaskService is automatically registered when the plugin is installed. Access it via:

```typescript
const taskService = agent.requireServiceByType(TaskService);
```

##### Service Methods

###### `addTask(task, agent)`

Add a single task to the task list.

**Parameters**:

- `task`: `Omit<Task, "id" | "status">` - Task data without ID and status
- `agent`: `Agent` - Current agent instance

**Returns**: `string` - The generated task ID (UUID)

**Example**:

```typescript
const taskId = taskService.addTask(
  {
    name: "Create user account",
    agentType: "backend-developer",
    message: "Implement user registration functionality",
    context: "Create user model, registration endpoint, validation, and error handling. Use bcrypt for password hashing and JWT for session management.",
  },
  agent
);
```

###### `getTasks(agent)`

Retrieve all tasks with their current status.

**Parameters**:

- `agent`: `Agent` - Current agent instance

**Returns**: `Task[]` - Array of all tasks (copy)

**Example**:

```typescript
const tasks = taskService.getTasks(agent);
console.log(`Found ${tasks.length} tasks`);
```

###### `updateTaskStatus(id, status, result?, agent)`

Update the status and optionally the result of a task.

**Parameters**:

- `id`: `string` - Task ID
- `status`: `Task["status"]` - New status ("pending", "running", "completed", "failed")
- `result`: `string | undefined` - Execution result (optional)
- `agent`: `Agent` - Current agent instance

**Throws**: `Error` if task not found

**Example**:

```typescript
taskService.updateTaskStatus(
  taskId,
  "completed",
  "User account created successfully",
  agent
);
```

###### `clearTasks(agent)`

Remove all tasks from the task list.

**Parameters**:

- `agent`: `Agent` - Current agent instance

**Example**:

```typescript
taskService.clearTasks(agent);
```

###### `executeTasks(taskIds, parentAgent)`

Execute a list of tasks with configured parallelism.

**Parameters**:

- `taskIds`: `string[]` - IDs of tasks to execute (preserves order)
- `parentAgent`: `Agent` - Current parent agent instance

**Returns**: `Promise<string[]>` - Array of execution summaries

**Implementation Details**:

- Validates that each task's `agentType` is in `allowedSubAgents`
- Uses `SubAgentService.runSubAgent()` to dispatch sub-agents
- Uses `async.mapLimit` for controlled parallelism
- Updates task status to `running` before execution
- Updates task status to `completed` or `failed` after execution
- Captures and stores error messages for failed tasks
- Passes `subAgent` configuration options to sub-agent execution

**Example**:

```typescript
const results = await taskService.executeTasks([taskId1, taskId2], agent);
console.log(results);
// ["✓ Create API endpoint: Completed", "✗ Send Email: Failed - SMTP connection failed"]
```

### RPC Endpoints

The package exposes an RPC endpoint at `/rpc/tasks` for managing sub-agents remotely.

**Schema**: `rpc/schema.ts`

**Implementation**: `rpc/tasks.ts`

#### `getAvailableSubAgents`

Query the agent types that match the configured `allowedSubAgents` patterns.

- **Type**: `query`
- **Input**: `{ agentId: string }`
- **Result**: `{ status: "success", agents: Array<{ type, displayName, description, category?, enabledTools }> }` or `{ status: "agentNotFound" }`

#### `getEnabledSubAgents`

Query the currently enabled sub-agent types for an agent.

- **Type**: `query`
- **Input**: `{ agentId: string }`
- **Result**: `{ status: "success", agents: string[] }` or `{ status: "agentNotFound" }`

#### `streamEnabledSubAgents`

Stream the currently enabled sub-agent types for an agent with real-time updates.

- **Type**: `stream`
- **Input**: `{ agentId: string }`
- **Result**: `{ status: "success", agents: string[] }` or `{ status: "agentNotFound" }`

#### `enableSubAgents`

Enable specific agent types as allowed sub-agents.

- **Type**: `mutation`
- **Input**: `{ agentId: string, agents: string[] }`
- **Result**: `{ status: "success", success: boolean }` or `{ status: "agentNotFound" }`

#### `disableSubAgents`

Disable specific agent types from being used as sub-agents.

- **Type**: `mutation`
- **Input**: `{ agentId: string, agents: string[] }`
- **Result**: `{ status: "success", success: boolean }` or `{ status: "agentNotFound" }`

### Usage Examples

#### 1. Using the Task Planning Tool

The primary way to create and execute task plans with user approval:

```typescript
// Create a comprehensive task plan
await agent.executeTool("tasks_run", {
  tasks: [
    {
      taskName: "Create user authentication system",
      agentType: "backend-developer",
      message: "Implement JWT-based authentication with login/logout endpoints",
      context: "Create auth middleware, user model, login/logout routes in Express.js. Use bcrypt for password hashing. Include proper error handling and validation. Set up appropriate HTTP status codes and response formats. Handle edge cases like expired tokens and concurrent requests.",
    },
    {
      taskName: "Design login UI components",
      agentType: "frontend-developer",
      message: "Create responsive login and registration forms",
      context: "Build React components with form validation, error handling, and responsive design using Tailwind CSS. Include loading states, proper accessibility attributes, and consistent styling with the application's design system. Implement proper error messaging and success states.",
    },
    {
      taskName: "Write authentication tests",
      agentType: "test-engineer",
      message: "Create comprehensive test suite for auth system",
      context: "Write unit tests for auth middleware, integration tests for login/logout endpoints, and E2E tests for UI flows. Include edge cases like invalid credentials, expired tokens, and concurrent access scenarios. Ensure proper test coverage and maintainable test structure. Mock external dependencies appropriately.",
    },
  ],
});
```

#### 2. Programmatic Task Management

```typescript
import TaskService from "@tokenring-ai/tasks";

const taskService = agent.requireServiceByType(TaskService);

// Add individual tasks
const taskId = taskService.addTask(
  {
    name: "Process user data",
    agentType: "data-processor",
    message: "Clean and validate user input data",
    context: "Parse CSV files, remove duplicates, validate email formats, and standardize data formats. Handle missing values appropriately and generate summary reports. Implement proper error handling for malformed data.",
  },
  agent
);

// Get all tasks
const allTasks = taskService.getTasks(agent);

// Update task status
taskService.updateTaskStatus(
  taskId,
  "completed",
  "Data processed successfully",
  agent
);

// Execute specific tasks
const results = await taskService.executeTasks([taskId], agent);
```

#### 3. Configuration Management

```typescript
// Configure auto-approve timeout (seconds)
agent.mutateState(TaskState, (state) => {
  state.autoApprove = 30;
});

// Configure parallel task execution
agent.mutateState(TaskState, (state) => {
  state.parallelTasks = 3;
});

// Get current configuration
const autoApproveTimeout = agent.getState(TaskState).autoApprove;
const parallelLimit = agent.getState(TaskState).parallelTasks;
```

### Context Handlers

#### task-plan

Provides current task summaries to agents as context.

**Handler Name**: `task-plan`

**Usage**: Automatically integrated when plugin is installed

**Example Output**:

```text
/* The user has approved the following task plan */:
- Create user authentication (pending): backend-developer - Implement JWT-based authentication
- Design login UI (pending): frontend-developer - Create responsive login forms
- Write tests (completed): test-engineer - Create comprehensive test suite
```

**Implementation**:

```typescript
export default function* getContextItems({
  agent,
}: ContextHandlerOptions): Generator<ContextItem> {
  const taskService = agent.requireServiceByType(TaskService);
  const tasks = taskService.getTasks(agent);

  if (tasks.length > 0) {
    const taskSummary = tasks
      .map((t) => `- ${t.name} (${t.status}): ${t.agentType} - ${t.message}`)
      .join("\n");

    yield {
      role: "user",
      content: `/* The user has approved the following task plan */:\n${taskSummary}`,
    };
  }
}
```

### State Management

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| tasks | Task[] | Array of tasks in the queue |
| autoApprove | number | Auto-approve timeout in seconds (0 = disabled) |
| parallelTasks | number | Maximum parallel task execution |
| allowedSubAgents | string[] | Allowed sub-agent type names |
| subAgent | ParsedSubAgentConfig | Sub-agent execution configuration |

#### State Transfer

Tasks are transferred from parent agents via `transferStateFromParent()` method, which deep clones the tasks array from the parent agent's `TaskState`.

**Example**:

```typescript
taskState.transferStateFromParent(parentAgent);
```

#### State Reset

Tasks are cleared via the `reset()` method, which removes all tasks from the tasks array.

**Example**:

```typescript
taskState.reset(); // Clears all tasks
```

#### Serialization

The state can be serialized and deserialized for persistence:

```typescript
// Serialize
const serialized = taskState.serialize();
// { tasks: [...], autoApprove: 30, parallelTasks: 3, allowedSubAgents: [...], subAgent: {} }

// Deserialize
taskState.deserialize({
  tasks: [],
  autoApprove: 0,
  parallelTasks: 1,
  allowedSubAgents: [],
  subAgent: {},
});
```

#### State Display

The `show()` method returns a human-readable summary string:

```typescript
const output = taskState.show();
// Output:
// "Total Tasks: 5
// - pending: 2
// - running: 1
// - completed: 1
// - failed: 1
// Auto-approve: 30s
// Parallel tasks: 3
// Allowed sub-agents: backend-developer, frontend-developer"
```

### Testing

The package uses vitest for unit testing.

#### Test Files

- `runTasks.test.ts` - Tests for the runTasks tool
- `tasksCommand.test.ts` - Tests for task commands

#### Test Commands

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui
```

### Dependencies

#### Runtime Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| @tokenring-ai/app | workspace:* | Base application framework |
| @tokenring-ai/chat | workspace:* | Chat service and tool definitions |
| @tokenring-ai/agent | workspace:* | Agent orchestration and sub-agent execution |
| @tokenring-ai/utility | workspace:* | Shared utilities and helpers |
| @tokenring-ai/rpc | workspace:* | RPC endpoint framework |
| zod | ^4.4.3 | Schema validation |
| uuid | 14.0.1 | Unique ID generation |
| async | ^3.2.6 | Parallel task execution |

#### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| vitest | ^4.1.1 | Testing framework |
| typescript | ^6.0.2 | TypeScript compiler |
| @types/async | ^3.2.25 | Async library type definitions |

### Related Components

- [@tokenring-ai/agent](./agent.md): Core agent orchestration system
- [@tokenring-ai/chat](./chat.md): Chat interface and command handling
- [@tokenring-ai/app](./app.md): Base application framework
- [@tokenring-ai/utility](./utility.md): Shared utilities and helpers
- [@tokenring-ai/rpc](./rpc.md): RPC endpoint framework

### Schema Documentation

#### TaskAgentConfigSchema

Per-agent configuration override schema:

```typescript
export const TaskAgentConfigSchema = z
  .object({
    autoApprove: z.number().exactOptional(),
    parallel: z.number().exactOptional(),
    allowedSubAgents: z.array(z.string()).exactOptional(),
    subAgent: SubAgentConfigSchema.exactOptional(),
  })
  .default({});
```

#### TaskServiceConfigSchema

Plugin-level configuration schema with agent defaults:

```typescript
export const TaskServiceConfigSchema = z
  .object({
    agentDefaults: z
      .object({
        autoApprove: z.number().default(0),
        parallel: z.number().default(1),
        allowedSubAgents: z.array(z.string()).default([]),
        subAgent: SubAgentConfigSchema.prefault({}),
      })
      .prefault({}),
  })
  .strict()
  .prefault({});
```

### Package Exports

```typescript
// Main service
export { default as TaskService } from "./TaskService.ts";

// Type definitions
export type { Task } from "./state/taskState.ts";
```

### Package Structure

```text
pkg/tasks/
├── index.ts                    # Package exports (TaskService, Task type)
├── TaskService.ts              # Main task management service
├── schema.ts                   # Configuration schemas
├── plugin.ts                   # Plugin configuration and installation
├── tools.ts                    # Tool exports
├── tools/
│   └── runTasks.ts             # Task planning and execution tool
├── commands.ts                 # Command exports
├── commands/
│   └── tasks/
│       ├── list.ts             # List all tasks command
│       ├── execute.ts          # Execute pending tasks command
│       ├── clear.ts            # Clear all tasks command
│       └── settings.ts         # View/modify task settings command
├── state/
│   └── taskState.ts            # Task data structures and state management
├── contextHandlers.ts          # Context handler exports
├── contextHandlers/
│   └── taskPlan.ts             # Task plan context handler
├── rpc/
│   ├── schema.ts               # RPC schema definitions
│   └── tasks.ts                # RPC endpoint implementations
├── package.json                # Package metadata and dependencies
├── README.md                   # Package documentation
├── vitest.config.ts            # Test configuration
├── runTasks.test.ts            # Tool tests
└── tasksCommand.test.ts        # Command tests
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
