# Tasks Plugin

Task management and execution functionality for orchestrating complex multi-step workflows with user approval and automatic execution.

## Overview

The `@tokenring-ai/tasks` package provides comprehensive task planning and execution functionality for AI agents within the Token Ring framework. It enables agents to create detailed task plans, present them to users for approval, and automatically execute approved tasks by dispatching them to specialized agents with configurable parallelism.

## Key Features

- **Task Planning**: Create comprehensive task plans with multiple tasks
- **User Approval**: Interactive approval workflow with configurable auto-approval timeout
- **Automatic Execution**: Execute tasks immediately upon approval
- **Task Status Tracking**: Monitor task states (pending, running, completed, failed)
- **Parallel Execution**: Configurable parallel task execution
- **Context Injection**: Provide detailed context to specialized agents
- **Interactive Commands**: Comprehensive chat commands for task management
- **State Preservation**: Tasks persist across agent sessions for coordination

## Core Components

### TaskService

Main service that manages the complete task lifecycle with state preservation.

```typescript
class TaskService implements TokenRingService {
  name = "TaskService";
  description = "Provides task management functionality";
}
```

**Key Methods:**
- `addTask(task, agent)`: Add individual tasks to the queue
- `getTasks(agent)`: Retrieve all tasks with current status
- `updateTaskStatus(id, status, result, agent)`: Update task execution status
- `clearTasks(agent)`: Remove all tasks
- `executeTasks(taskIds, agent)`: Execute specified tasks with parallelism
- `setAutoApprove(seconds, agent)`: Configure auto-approval timeout
- `setParallelTasks(parallelTasks, agent)`: Set number of concurrent tasks
- `getAutoApprove(agent)`: Get current auto-approval timeout

### Task Interface

Each task contains comprehensive information for execution:

```typescript
interface Task {
  id: string;           // Unique identifier
  name: string;         // Descriptive task name
  agentType: string;    // Type of agent to handle this task
  message: string;      // Main task description
  context: string;      // Detailed execution instructions
  status: TaskStatus;   // Current state (pending/running/completed/failed)
  result?: string;      // Execution result (if completed)
}
```

### Task Status Management

The service maintains task state and updates it throughout the execution lifecycle:
- **Pending**: Task created and waiting for execution
- **Running**: Task currently being executed by an agent
- **Completed**: Task successfully executed
- **Failed**: Task execution encountered errors

### Tools

**runTasks**: Create and execute complete task plans with user approval
- Input: `{ tasks: Array<{ taskName, agentType, message, context }> }`
- Presents plan to user for approval
- Executes tasks automatically if approved
- Returns execution results or rejection reason

**Input Schema:**
```typescript
const inputSchema = z.object({
  tasks: z.array(z.object({
    taskName: z.string().describe("A descriptive name for the task"),
    agentType: z.string().describe("The type of agent that should handle this task"),
    message: z.string().describe("A one paragraph message/description of what needs to be done"),
    context: z.string().describe("Three paragraphs of important contextual information to pass to the agent, including detailed instructions, file names, and step by step processes")
  })).describe("Array of tasks to add to the task list"),
});
```

### Chat Commands

**/tasks**: Comprehensive task management commands

- `list`: Show all tasks with current status
- `clear`: Remove all tasks from the queue
- `execute`: Manually execute pending tasks
- `auto-approve [seconds]`: Set auto-approval timeout (0 to disable)
- `parallel [count]`: Set number of concurrent task executions

## Usage Examples

### Creating and Executing a Task Plan

```typescript
await agent.executeTool('tasks/run', {
  tasks: [
    {
      taskName: "Create user authentication system",
      agentType: "backend-developer", 
      message: "Implement JWT-based authentication with login/logout endpoints",
      context: "Create auth middleware, user model, login/logout routes in Express.js. Use bcrypt for password hashing and implement secure session management."
    },
    {
      taskName: "Design login UI components",
      agentType: "frontend-developer",
      message: "Create responsive login and registration forms", 
      context: "Build React components with form validation, responsive design using Tailwind CSS, and integrate with the backend authentication endpoints."
    },
    {
      taskName: "Write authentication tests",
      agentType: "test-engineer",
      message: "Create comprehensive test suite for auth system",
      context: "Write unit tests for auth middleware, integration tests for endpoints, and E2E tests covering the full authentication flow."
    }
  ]
});
```

### Task Plan Approval Workflow

When the tool executes:

1. **Plan Presentation**: Displays complete task plan with agent assignments
2. **User Approval**: Shows confirmation dialog with task details
3. **Automatic Execution**: Upon approval, tasks execute immediately
4. **Result Collection**: Returns execution status for each task

### Manual Task Management

```bash
# View all tasks and their current status
/tasks list

# Clear completed tasks
/tasks clear

# Execute pending tasks manually
/tasks execute

# Enable auto-approval with 30 second timeout
/tasks auto-approve 30

# Set to execute 3 tasks in parallel
/tasks parallel 3
```

### Programmatic Task Management

```typescript
import { TaskService } from '@tokenring-ai/tasks';

const taskService = agent.requireServiceByType(TaskService);

// Add individual tasks
const taskId1 = taskService.addTask({
  name: "Process user data",
  agentType: "data-processor",
  message: "Analyze and process uploaded CSV file",
  context: "Process the data using pandas, perform data cleaning, and generate summary statistics."
}, agent);

const taskId2 = taskService.addTask({
  name: "Send notification",
  agentType: "email-sender",
  message: "Send confirmation email to user",
  context: "Compose professional email with processing results and next steps."
}, agent);

// Execute specific tasks
const results = await taskService.executeTasks([taskId1, taskId2], agent);
console.log(results);
```

## Task Planning Workflow

1. **Planning Phase**: Team leader analyzes requirements and creates comprehensive task plan
2. **Approval Phase**: Task plan presented to user with clear descriptions and agent assignments
3. **Execution Phase**: Upon approval, tasks dispatched to appropriate specialist agents
4. **Tracking Phase**: Task status updated as agents complete their work
5. **Results Phase**: Execution results collected and reported back

## Configuration Options

### Auto-Approval Settings
- **Timeout (seconds)**: Set how long to wait before automatically approving tasks
- **Disabled**: Set to 0 to require manual approval for all task plans

### Parallel Execution
- **Concurrency Level**: Number of tasks that can run simultaneously (default: 1)
- **Resource Management**: Automatic handling of resource allocation

### State Preservation
- **Cross-Agent Coordination**: Tasks persist across different agent sessions
- **Status Tracking**: Automatic status updates during execution

## Integration with Agent System

The tasks plugin integrates seamlessly with the Token Ring agent framework:

```typescript
// Plugin installation
export default {
  name: "@tokenring-ai/tasks",
  version: "0.2.0",
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService => {
      chatService.addTools(packageJSON.name, tools);
      chatService.registerContextHandlers(contextHandlers);
    });
    app.waitForService(AgentCommandService, agentCommandService => 
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.addServices(new TaskService());
  },
}
```

### Service Dependencies

1. **ChatService**: For user interaction and tool registration
2. **AgentCommandService**: For chat command integration
3. **Agent**: For state management and service access

## API Reference

### TaskService Methods

#### addTask(task, agent)

```typescript
addTask(task: Omit<Task, 'id' | 'status'>, agent: Agent): string
```

**Parameters:**
- `task`: Task configuration without id and status
- `agent`: Current agent instance

**Returns:**
- `string`: Unique task identifier

#### getTasks(agent)

```typescript
getTasks(agent: Agent): Task[]
```

**Returns:**
- `Task[]`: Array of all tasks with current status

#### executeTasks(taskIds, agent)

```typescript
async executeTasks(
  taskIds: string[],
  agent: Agent
): Promise<string[]>
```

**Parameters:**
- `taskIds`: Array of task identifiers to execute
- `agent`: Current agent instance

**Returns:**
- `Promise<string[]>`: Array of execution results

#### setAutoApprove(seconds, agent)

```typescript
setAutoApprove(seconds: number, agent: Agent): void
```

**Parameters:**
- `seconds`: Timeout in seconds (0 to disable)

#### setParallelTasks(parallelTasks, agent)

```typescript
setParallelTasks(parallelTasks: number, agent: Agent): void
```

**Parameters:**
- `parallelTasks`: Number of concurrent tasks (minimum 1)

## Error Handling

The service provides comprehensive error handling:

- **Input Validation**: Validates task configurations
- **Task Existence**: Checks for task existence before operations
- **Execution Errors**: Catches and reports execution failures
- **State Management**: Proper error state updates

## Performance Considerations

- **Parallel Execution**: Configurable concurrency for optimal performance
- **Resource Management**: Automatic resource cleanup
- **State Persistence**: Efficient state management across sessions
- **Error Recovery**: Proper error state handling

## Dependencies

```json
{
  "dependencies": {
    "@tokenring-ai/app": "0.2.0",
    "@tokenring-ai/chat": "0.2.0", 
    "@tokenring-ai/agent": "0.2.0",
    "@tokenring-ai/utility": "0.2.0",
    "zod": "catalog:",
    "uuid": "^13.0.0",
    "async": "^3.2.6"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```

## Testing

The package includes comprehensive testing with Vitest:

```typescript
// Example test
import { describe, it, expect } from 'vitest';
import { TaskService } from './TaskService';

describe('TaskService', () => {
  it('should add and execute tasks', async () => {
    const taskService = new TaskService();
    const mockAgent = /* mock agent */;
    const taskId = taskService.addTask({ name: 'Test', agentType: 'test', message: 'Test', context: '' }, mockAgent);
    const results = await taskService.executeTasks([taskId], mockAgent);
    expect(results).toContain('completed');
  });
});
```

## License

MIT (see LICENSE file)