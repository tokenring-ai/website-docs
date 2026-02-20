# Scheduler Plugin

Service for scheduling AI agents to run at specified intervals.

## Overview

The `@tokenring-ai/scheduler` package provides a scheduling system that runs within AI agents to automatically spawn and execute other agents at defined intervals or conditions. It supports recurring tasks, one-time executions, time window constraints, and timezone-aware scheduling with comprehensive monitoring and state management.

## Key Features

- **Task Scheduling**: Schedule agents to run at specified intervals or conditions
- **Time Windows**: Define running time windows with start and end times
- **Recurring Tasks**: Support for second, minute, hour, day, week, and month intervals
- **One-time Tasks**: Execute tasks once per day or specific dates
- **Agent Integration**: Automatically spawn and run agents for scheduled tasks
- **Monitoring**: Track task execution history and current status
- **Chat Commands**: `/scheduler` command to manage and view scheduled tasks
- **Task Conditions**: Run tasks on specific days of the week or days of the month
- **Timezone Support**: Schedule tasks in specific IANA timezones
- **State Persistence**: Task state persists across agent restarts
- **Utility Functions**: `parseInterval`, `getNextRunTime`, and `checkDayConditions` for time calculations

## Core Components

### SchedulerService

The main service that manages task scheduling and execution within an agent.

**Key Methods:**
- `attach(agent: Agent)`: Attach scheduler to an agent with task and execution state
- `runScheduler(agent: Agent)`: Start the scheduler loop
- `stopScheduler(agent: Agent)`: Stop the scheduler loop
- `addTask(name: string, task: ScheduledTask, agent: Agent)`: Add a new task
- `removeTask(name: string, agent: Agent)`: Remove a task
- `watchTasks(agent: Agent, signal: AbortSignal)`: Watch and schedule task executions
- `runTask(name: string, task: ScheduledTask, agent: Agent)`: Execute a task

### State Management

**ScheduleTaskState**: Tracks configured tasks and execution history
- `tasks`: Map of task name to ScheduledTask configuration
- `history`: Map of task name to array of TaskRunHistory entries

**ScheduleExecutionState**: Tracks runtime execution state
- `tasks`: Map of task name to ExecutionScheduleEntry
- `autoStart`: Whether to auto-start the scheduler
- `abortController`: Controls the scheduler loop
- `timer`: Node.js timeout for scheduled tasks

## Services

### TokenRingService Implementation

The scheduler implements `TokenRingService` and provides:

- Automatic attachment to agents with scheduler configuration
- State initialization for task and execution management
- Scheduler loop management with abort signal support
- Task execution through agent spawning

### SchedulerService API Reference

#### Constructor

```typescript
constructor(app: TokenRingApp, options: z.output<typeof SchedulerConfigSchema>)
```

Creates a new scheduler service instance.

**Parameters:**
- `app` (TokenRingApp): The TokenRing application instance
- `options` (SchedulerConfigSchema): The scheduler configuration

#### attach(agent: Agent): void

Attaches the scheduler to an agent, initializing task and execution state.

**Parameters:**
- `agent` (Agent): The agent to attach to

#### runScheduler(agent: Agent): void

Starts the scheduler loop for the given agent.

**Parameters:**
- `agent` (Agent): The agent with scheduler configuration

#### stopScheduler(agent: Agent): void

Stops the scheduler loop for the given agent.

**Parameters:**
- `agent` (Agent): The agent to stop

#### addTask(name: string, task: ScheduledTask, agent: Agent): void

Adds a new scheduled task to the agent.

**Parameters:**
- `name` (string): Unique name for the task
- `task` (ScheduledTask): Task configuration
- `agent` (Agent): The agent to add the task to

#### removeTask(name: string, agent: Agent): void

Removes a scheduled task from the agent.

**Parameters:**
- `name` (string): Name of the task to remove
- `agent` (Agent): The agent with the task

#### watchTasks(agent: Agent, signal: AbortSignal): Promise<void>

Watches task state and schedules executions.

**Parameters:**
- `agent` (Agent): The agent with scheduled tasks
- `signal` (AbortSignal): Abort signal to stop watching

#### runTask(name: string, task: ScheduledTask, agent: Agent): Promise<void>

Executes a scheduled task by spawning the configured agent.

**Parameters:**
- `name` (string): Name of the task to run
- `task` (ScheduledTask): Task configuration
- `agent` (Agent): The agent running the scheduler

## Provider Documentation

The scheduler does not implement provider architecture.

## RPC Endpoints

The scheduler does not define RPC endpoints.

## Chat Commands

**/scheduler**: Manage and monitor scheduled tasks

**Usage:**
```bash
/scheduler start              # Start the scheduler
/scheduler stop               # Stop the scheduler
/scheduler show               # Display current schedule and running status
/scheduler history            # Display task execution history
/scheduler add                # Add a new task (interactive)
/scheduler remove <name>      # Remove a task by name or index
```

**Example Output:**
```
=== Scheduled Tasks ===

**Daily Report**
  Message: /chat Generate daily report
  Status: pending
  Next Run: Mon, Jan 15, 2024, 9:00:00 AM
  Last Run: Sun, Jan 14, 2024, 9:00:00 AM

**Health Check**
  Message: /chat Check system health
  Status: running
  Next Run: Mon, Jan 14, 2024, 2:30:00 PM
```

### /scheduler start

Starts the scheduler for the current agent.

**Usage:**
```
/scheduler start
```

### /scheduler stop

Stops the scheduler for the current agent.

**Usage:**
```
/scheduler stop
```

### /scheduler show

Displays the current schedule and running status of all tasks.

**Usage:**
```
/scheduler show
```

### /scheduler add

Adds a new task interactively through agent prompts.

**Usage:**
```
/scheduler add
```

The agent will prompt for:
1. Task name
2. Agent type to run
3. Message/command to send
4. Schedule type (every or once)
5. Schedule details (interval or time)

### /scheduler remove

Removes a task by name.

**Usage:**
```
/scheduler remove <name>
```

### /scheduler history

Displays the execution history of all tasks.

**Usage:**
```
/scheduler history
```

## Configuration

### Plugin Configuration

Configure at the application level in `.tokenring/config.mjs`:

```javascript
export default {
  scheduler: {
    agentDefaults: {
      autoStart: true,
      tasks: {}
    }
  }
};
```

### Agent Configuration

Configure per-agent with task definitions:

```javascript
export default {
  scheduler: {
    agentDefaults: {
      autoStart: true,
      tasks: {
        "Daily Report": {
          message: "/chat Generate daily report",
          repeat: "1 day",
          after: "09:00",
          before: "17:00",
          weekdays: "mon tue wed thu fri"
        },
        "Health Check": {
          message: "/chat Check system health",
          repeat: "30 minutes",
          after: "00:00",
          before: "23:59"
        },
        "Weekly Cleanup": {
          message: "/chat Clean up old files",
          repeat: "1 week",
          weekdays: "sun"
        }
      }
    }
  }
};
```

### Configuration Schema

#### SchedulerConfigSchema

```typescript
z.object({
  agentDefaults: SchedulerAgentConfigSchema
})
```

#### SchedulerAgentConfigSchema

```typescript
z.object({
  autoStart: z.boolean().default(true),
  tasks: z.record(z.string(), ScheduledTaskSchema).default({})
}).prefault({})
```

## Usage Examples

### Basic Setup

```typescript
import TokenRingApp from "@tokenring-ai/app";
import scheduler from "@tokenring-ai/scheduler";

const app = new TokenRingApp({
  // Your app configuration
});

app.install(scheduler);
```

### Run Every Hour During Business Hours

```javascript
{
  message: "/chat Sync data",
  repeat: "1 hour",
  after: "09:00",
  before: "17:00",
  weekdays: "mon tue wed thu fri"
}
```

### Run Once Daily at Specific Time

```javascript
{
  message: "/chat Generate morning briefing",
  repeat: "1 day",
  after: "08:00"
}
```

### Run Every 30 Minutes with Timezone

```javascript
{
  message: "/chat Quick system check",
  repeat: "30 minutes",
  after: "00:00",
  before: "23:59",
  timezone: "America/New_York"
}
```

### Run on Specific Day of Month

```javascript
{
  message: "/chat Generate monthly report",
  repeat: "1 month",
  dayOfMonth: 1
}
```

### Run Every 2 Hours with Timezone

```javascript
{
  message: "/chat Check database status",
  repeat: "2 hours",
  timezone: "UTC"
}
```

## Tools

The scheduler package provides three tools for programmatic task management.

### add_scheduled_task

Add a new scheduled task to run an agent at specified intervals.

**Input Schema:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `taskName` | `string` | Yes | Unique name for the scheduled task |
| `task.description` | `string` | Yes | A long, several paragraph description of the exact task to execute |
| `task.context` | `string` | No | Additional context or information relevant to task execution |
| `task.repeat` | `string` | No | Interval string (e.g., "1 hour", "30 minutes") |
| `task.after` | `string` | No | Start time in HH:mm format (24-hour clock) |
| `task.before` | `string` | No | End time in HH:mm format (24-hour clock) |
| `task.timezone` | `string` | No | IANA timezone string (e.g., 'America/New_York', 'UTC') |

**Example:**
```typescript
await agent.executeTool('add_scheduled_task', {
  taskName: "Daily Backup",
  task: {
    description: "Run a full backup of all critical data. This includes user documents, database exports, and configuration files. Ensure the backup completes within 30 minutes.",
    context: "Backup should run after regular business hours to minimize system impact. Include checksum verification for data integrity.",
    repeat: "1 day",
    after: "02:00",
    before: "03:00",
    timezone: "America/New_York"
  }
});
```

### scheduler_remove_task

Remove a scheduled task by name.

**Input Schema:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `taskName` | `string` | Yes | Name of the scheduled task to remove |

**Example:**
```typescript
await agent.executeTool('scheduler_remove_task', {
  taskName: "Daily Backup"
});
```

### scheduler_get_schedule

Get the current schedule of all scheduled tasks with their status and next run times.

**Input Schema:** Empty object

**Example:**
```typescript
const schedule = await agent.executeTool('scheduler_get_schedule', {});
// Returns formatted string with all scheduled tasks
```

## Utility Functions

### parseInterval

Parses interval strings into milliseconds.

```typescript
import { parseInterval } from "@tokenring-ai/scheduler/utility/parseInterval";

// Returns 60000 (1 minute in milliseconds)
const interval = parseInterval("1 minute");

// Returns 3600000 (1 hour in milliseconds)
const interval = parseInterval("1 hour");

// Returns null for invalid formats
const invalid = parseInterval("invalid");
```

**Supported intervals:**
- `second`, `seconds`: 1
- `minute`, `minutes`: 60
- `hour`, `hours`: 3600
- `day`, `days`: 86400
- `week`, `weeks`: 604800
- `month`, `months`: 2678400 (31 days)

### getNextRunTime

Calculates the next run time for a scheduled task.

```typescript
import { getNextRunTime } from "@tokenring-ai/scheduler/utility/getNextRunTime";
import moment from "moment-timezone";

const task = {
  message: "/chat Generate daily report",
  repeat: "1 day",
  after: "09:00"
};

const nextRun = getNextRunTime(task);
// Returns timestamp for next scheduled run
```

**Parameters:**
- `task` (ScheduledTask): The scheduled task configuration

**Returns:** `number | null` - Timestamp for next run or null if no scheduled time

### checkDayConditions

Checks if a date matches day conditions for scheduling.

```typescript
import { checkDayConditions } from "@tokenring-ai/scheduler/utility/checkDayConditions";
import moment from "moment-timezone";

const task = {
  weekdays: "mon wed fri",
  dayOfMonth: 15
};

const now = moment.tz("America/New_York");

// Check if today matches the day conditions
const matches = checkDayConditions(task, now);
```

**Parameters:**
- `task` (ScheduledTask): The scheduled task configuration
- `now` (moment.Moment): The date to check

**Returns:** `boolean` - True if the date matches the day conditions

## State Management

### ScheduleTaskState

Tracks configured tasks and execution history.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `tasks` | `Map<string, ScheduledTask>` | Map of task name to task configuration |
| `history` | `Map<string, TaskRunHistory[]>` | Map of task name to execution history array |

**Methods:**
- `serialize()`: Serialize state to plain object
- `deserialize(data)`: Deserialize state from plain object
- `show()`: Return human-readable state information

### ScheduleExecutionState

Tracks runtime execution state.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `tasks` | `Map<string, ExecutionScheduleEntry>` | Map of task name to execution entry |
| `autoStart` | `boolean` | Whether to auto-start the scheduler |
| `abortController` | `AbortController | null` | Controller for aborting the scheduler loop |
| `timer` | `NodeJS.Timeout | undefined` | Timer for scheduled task execution |

**Methods:**
- `serialize()`: Serialize state to plain object
- `deserialize(data)`: Deserialize state from plain object
- `show()`: Return human-readable state information

### State Persistence

- **Persistence**: State is persisted across agent sessions
- **Serialization**: Uses Zod schema for type-safe serialization
- **Deserialization**: Automatic type checking on deserialization
- **Integration**: Registered with agent system via `attach()` method

## Integration

The scheduler integrates with the agent system by:

1. **Automatic Attachment**: Automatically attaches to agents with scheduler configuration
2. **State Management**: Registers state slices for task and execution tracking
3. **Agent Spawning**: Spawns agents of specified types when tasks are scheduled to run
4. **Message Passing**: Sends messages to agents to trigger their work
5. **Event Monitoring**: Monitors agent execution and handles timeouts
6. **Command Registration**: Registers `/scheduler` command with subcommand routing
7. **State Persistence**: Maintains task state across agent restarts

### Integration with TokenRingApp

The scheduler is installed as a plugin in the TokenRingApp:

```typescript
const app = new TokenRingApp("path/to/packages");
app.install(scheduler);
```

### Integration with ChatService

The scheduler registers the `/scheduler` command with the ChatService:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(chatCommands)
);
```

### Integration with AgentManager

When a task is scheduled to run, the scheduler:

1. Creates a new agent of the specified type
2. Sets `headless: true` for the spawned agent
3. Sends the task message to the agent
4. Monitors execution through event streaming
5. Handles task completion or failure

## Best Practices

- **Use descriptive task names**: Make task names clear for monitoring and debugging
- **Set appropriate timeouts**: Use `before` time window to prevent runaway tasks
- **Monitor execution history**: Regularly check `/scheduler history` for failures
- **Stagger schedules**: Avoid running multiple heavy tasks simultaneously
- **Use time windows**: Restrict tasks to business hours when appropriate
- **Test before deploying**: Verify task configuration with `/scheduler show`
- **Consider timezones**: Specify timezones for tasks that should run at specific local times
- **Handle errors**: Monitor execution history for failed tasks

## Error Handling

- **Runtime Timeout**: Tasks may exceed configured time windows but are not terminated
- **Agent Errors**: Execution errors are captured in run history with error message
- **Configuration Validation**: Invalid configurations prevent agent attachment
- **Graceful Shutdown**: Scheduler stops scheduling new tasks and aborts running tasks
- **Task Not Found**: Remove operations throw clear error when task doesn't exist
- **Invalid Interval**: `parseInterval` returns null for invalid formats
- **State Errors**: Proper serialization/deserialization with type checking

## Monitoring and Logging

- **Agent Output**: Real-time logging of task scheduling and execution through agent info/error lines
- **Run History**: All executions tracked with timing and status information
- **Status Monitoring**: Real-time task status through `/scheduler show` command
- **Performance Tracking**: Runtime duration and time window monitoring
- **Timer Management**: Automatic cleanup of timer references on task completion or removal

## Testing and Development

Run tests:
```bash
bun test
```

Run tests in watch mode:
```bash
bun test:watch
```

Run tests with coverage:
```bash
bun test:coverage
```

### Package Structure

```
pkg/scheduler/
├── index.ts                    # Main exports
├── plugin.ts                   # Plugin definition for TokenRing integration
├── schema.ts                   # Zod schemas and type definitions
├── SchedulerService.ts         # Core service implementation
├── chatCommands.ts             # Chat command exports
├── tools.ts                    # Tool exports
├── tools/
│   ├── addScheduledTask.ts     # add_scheduled_task tool
│   ├── removeScheduledTask.ts  # scheduler_remove_task tool
│   └── getSchedule.ts          # scheduler_get_schedule tool
├── state/
│   ├── scheduleTaskState.ts    # ScheduleTaskState implementation
│   └── scheduleExecutionState.ts # ScheduleExecutionState implementation
├── commands/
│   ├── schedule.ts             # /scheduler command router
│   ├── schedule/add.ts         # /scheduler add subcommand
│   ├── schedule/remove.ts      # /scheduler remove subcommand
│   ├── schedule/show.ts        # /scheduler show subcommand
│   ├── schedule/start.ts       # /scheduler start subcommand
│   ├── schedule/stop.ts        # /scheduler stop subcommand
│   └── schedule/history.ts     # /scheduler history subcommand
├── utility/
│   ├── parseInterval.ts        # parseInterval utility function
│   ├── getNextRunTime.ts       # getNextRunTime utility function
│   └── checkDayConditions.ts   # checkDayConditions utility function
├── vitest.config.ts            # Vitest configuration
└── README.md                   # Package documentation
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework and plugin system
- `@tokenring-ai/agent` (0.2.0) - Core agent system and orchestration
- `@tokenring-ai/chat` (0.2.0) - Chat service and command management
- `@tokenring-ai/rpc` (0.2.0) - JSON-RPC implementation
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `zod` (^4.3.6) - Schema validation
- `moment-timezone` (^0.6.0) - Timezone support

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- **@tokenring-ai/agent**: Core agent system and orchestration
- **@tokenring-ai/app**: Application framework and plugin system
- **@tokenring-ai/chat**: Chat service and command management
- **@tokenring-ai/utility**: Shared utilities and helper functions
