# Tasks Plugin

Task planning and execution functionality for orchestrating complex multi-step workflows.

## Overview

The `@tokenring-ai/tasks` package provides task planning and execution functionality for AI agents within the TokenRing framework. It enables agents to create comprehensive task plans, present them to users for approval, and automatically execute approved tasks by dispatching them to specialized agents.

## Key Features

- Create and manage task plans with multiple tasks
- Present task plans to users for approval via interactive interface
- Automatic task execution upon approval
- Task status tracking (pending, running, completed, failed)
- Integration with agent dispatch system
- Task context and result management

## Core Components

### TaskService

Main service that manages task lifecycle.

**Key Methods:**
- `addTask(task, agent)`: Add individual tasks to the list
- `getTasks(agent)`: Retrieve all tasks with current status
- `updateTaskStatus(id, status, result, agent)`: Update task execution status
- `clearTasks(agent)`: Remove all tasks
- `getContextItems(agent)`: Provide task context to agents

### Task Interface

Each task contains:
- `id`: Unique identifier
- `name`: Descriptive task name
- `agentType`: Type of agent to handle the task
- `message`: Main task description
- `context`: Detailed instructions for execution
- `status`: Current state (pending/running/completed/failed)
- `result`: Execution result (if completed)

### Tools

**tasks/add**: Create and execute complete task plans with user approval
- Input: `{ tasks: Array<{ taskName, agentType, message, context }> }`
- Presents plan to user for approval
- Executes tasks automatically if approved

### Chat Commands

**/tasks**: Task management commands
- `list`: Show all tasks with status
- `clear`: Remove all tasks
- `execute`: Execute pending tasks manually

## Usage Examples

### Creating a Task Plan

```typescript
await agent.executeTool('tasks/add', {
  tasks: [
    {
      taskName: "Create user authentication system",
      agentType: "backend-developer", 
      message: "Implement JWT-based authentication with login/logout endpoints",
      context: "Create auth middleware, user model, login/logout routes in Express.js."
    },
    {
      taskName: "Design login UI components",
      agentType: "frontend-developer",
      message: "Create responsive login and registration forms", 
      context: "Build React components with form validation and responsive design."
    },
    {
      taskName: "Write authentication tests",
      agentType: "test-engineer",
      message: "Create comprehensive test suite for auth system",
      context: "Write unit tests for auth middleware and integration tests for endpoints."
    }
  ]
});
```

### Task Plan Approval Workflow

When the tool executes:
1. **Presents plan to user** with task descriptions and agent assignments
2. **If approved**: Tasks execute automatically and return results
3. **If rejected**: User explains rejection reason

### Manual Task Management

```bash
# View all tasks and their status
/tasks list

# Clear completed tasks
/tasks clear

# Execute pending tasks manually
/tasks execute
```

## Task Planning Workflow

1. **Planning Phase**: Team leader analyzes requirements and creates comprehensive task plan
2. **Approval Phase**: Task plan presented to user with clear descriptions
3. **Execution Phase**: Upon approval, tasks dispatched to appropriate specialist agents
4. **Tracking Phase**: Task status updated as agents complete their work
5. **Results Phase**: Execution results collected and reported back

## Configuration Options

- **Task Persistence**: Tasks persist across sub-agents for coordination
- **Status Tracking**: Automatic status updates during execution
- **Context Injection**: Task summaries provided to agents as context
- **Agent Dispatch**: Integration with `agent/run` tool for task execution

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework and types
- `@tokenring-ai/utility@0.1.0`: Utility functions
- `zod`: Schema validation for tool inputs
