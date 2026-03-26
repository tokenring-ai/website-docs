# @tokenring-ai/scheduler

Service for scheduling AI agents to run at specified intervals.

## Overview

The `@tokenring-ai/scheduler` package provides a scheduling system that runs within AI agents to automatically spawn and execute other agents at defined intervals or conditions. It supports recurring tasks, one-time executions, time window constraints, and timezone-aware scheduling with comprehensive monitoring and state management.

The scheduler integrates seamlessly with the TokenRing agent framework, providing both tool-based interactions and chat commands for task management. It leverages agent state management for persistence and provides real-time monitoring through the `/schedule` command and `/loop` command.

## Key Features

- **Task Scheduling**: Schedule agents to run at specified intervals or conditions
- **Time Windows**: Define running time windows with start and end times
- **Recurring Tasks**: Support for second, minute, hour, day, week, and month intervals
- **One-time Tasks**: Execute tasks once by omitting the `repeat` field
- **Agent Integration**: Automatically spawn and run agents for scheduled tasks
- **Monitoring**: Track task execution history and current status
- **Chat Commands**: `/schedule` and `/loop` commands to manage and view scheduled tasks
- **Task Conditions**: Run tasks on specific days of the week or days of the month
- **Timezone Support**: Schedule tasks in specific IANA timezones
- **State Persistence**: Task state persists across agent restarts
- **Utility Functions**: `parseInterval`, `getNextRunTime`, `checkDayConditions`, and `parseLoopCommand` for time calculations
- **Tool Integration**: Programmatic task management through chat tools

## Core Components

### SchedulerService

The main service that manages task scheduling and execution within an agent.

**Constructor:**

```typescript
constructor(app: TokenRingApp, options: z.output<typeof SchedulerConfigSchema>)
```

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
- **Serialization**: Only `tasks` are persisted (not `history`)

**ScheduleExecutionState**: Tracks runtime execution state
- `tasks`: Map of task name to ExecutionScheduleEntry
- `autoStart`: Whether to auto-start the scheduler
- `abortController`: Controls the scheduler loop
- **Serialization**: Only `autoStart` is persisted

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

#### `attach(agent: Agent): void`

Attaches the scheduler to an agent, initializing task and execution state. Merges configuration using `deepMerge` and optionally auto-starts the scheduler.

**Parameters:**
- `agent` (Agent): The agent to attach to

#### `runScheduler(agent: Agent): void`

Starts the scheduler loop for the given agent. Creates a background task that watches for task executions. Starts a scheduler only if:
- No scheduler is already running
- At least one task is configured

**Parameters:**
- `agent` (Agent): The agent with scheduler configuration

#### `stopScheduler(agent: Agent): void`

Stops the scheduler loop for the given agent by aborting the running scheduler.

**Parameters:**
- `agent` (Agent): The agent to stop

#### `addTask(name: string, task: ScheduledTask, agent: Agent): void`

Adds a new scheduled task to the agent. If autoStart is enabled and the scheduler is not running, it will start automatically.

**Parameters:**
- `name` (string): Unique name for the task
- `task` (ScheduledTask): Task configuration
- `agent` (Agent): The agent to add the task to

#### `removeTask(name: string, agent: Agent): void`

Removes a scheduled task from the agent, clearing any timers or running tasks. Throws `Error` if task not found.

**Parameters:**
- `name` (string): Name of the task to remove
- `agent` (Agent): The agent with the task

#### `watchTasks(agent: Agent, signal: AbortSignal): Promise<void>`

Watches task state and schedules executions. Monitors for task changes and updates timers accordingly. Subscribes to `ScheduleTaskState` changes and manages execution state.

**Parameters:**
- `agent` (Agent): The agent with scheduled tasks
- `signal` (AbortSignal): Abort signal to stop watching

#### `runTask(name: string, task: ScheduledTask, agent: Agent): Promise<void>`

Executes a scheduled task by sending the task message to the agent and monitoring execution. Tracks execution state and records history.

**Parameters:**
- `name` (string): Name of the task to run
- `task` (ScheduledTask): Task configuration
- `agent` (Agent): The agent running the scheduler

## Provider Documentation

The scheduler does not implement provider architecture.

## RPC Endpoints

The scheduler does not define RPC endpoints.

## Chat Commands

The scheduler provides two main chat commands for task management.

### /schedule

Manage and monitor scheduled tasks.

#### /schedule start

Starts the scheduler for the current agent.

**Usage:**
```bash
/schedule start
```

#### /schedule stop

Stops the scheduler for the current agent.

**Usage:**
```bash
/schedule stop
```

#### /schedule show

Displays the current schedules and running status of all tasks.

**Usage:**
```bash
/schedule show
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

#### /schedule add

Adds a new task interactively through a form prompt.

**Usage:**
```bash
/schedule add
```

The command will prompt for:
- **Task Name**: Unique identifier for the task
- **Instructions for the agent**: The message to send to the agent when the task runs
- **How often to run**: One of:
  - Every 5 minutes
  - Every hour
  - Every day
  - For one-time tasks, simply omit the repeat interval when creating the task
- **Earliest time of day**: Optional start time (hh:mm, 24-hour clock)
- **Latest time of day**: Optional end time (hh:mm, 24-hour clock)

- **Note:** For one-time tasks, omit the `repeat` field instead of specifying a recurrence interval.

#### /schedule remove

Removes a task by name.

**Usage:**
```bash
/schedule remove <name>
```

**Throws:** `CommandFailedError` if no name provided or task not found

#### /schedule history

Displays the execution history of all tasks, including status and duration.

**Usage:**
```bash
/schedule history
```

**Example Output:**
```
=== Task Execution History ===

**Daily Report**
- [Mon, Jan 15, 2024, 9:00:00 AM] Daily Report - completed (120s) Task completed successfully
- [Sun, Jan 14, 2024, 9:00:00 AM] Daily Report - failed (45s) Task failed with error: ...
```

### /loop

Schedule a prompt to run repeatedly in the current session. This is a quick way to schedule repeated tasks without using the full `/schedule add` interface.

**Usage:**
```bash
/loop [interval] <prompt>
/loop <prompt> every <interval>
```

If no interval is provided, the prompt runs every 10 minutes.

**Examples:**
```bash
# Run every 5 minutes
/loop 5m check if the deployment finished

# Run every 2 hours
/loop check the build every 2 hours

# Run every 20 minutes
/loop /review-pr 1234 every 20m

# Run every 10 minutes (default interval)
/loop monitor the logs
```

**Supported Intervals:**
- Seconds: `s`, `sec`, `secs`, `second`, `seconds` (rounded up to minutes)
- Minutes: `m`, `min`, `mins`, `minute`, `minutes`
- Hours: `h`, `hr`, `hrs`, `hour`, `hours`
- Days: `d`, `day`, `days`

**Note:** Seconds are rounded up to the nearest minute since the scheduler operates on minute granularity. A task name is automatically generated (e.g., `loop-abc123def`).

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

The `agentDefaults` are merged with per-agent configuration using deep merge, allowing global defaults while supporting agent-specific overrides.

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

#### ScheduledTaskSchema

```typescript
z.object({
  repeat: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  weekdays: z.string().optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  lastRunTime: z.number().default(0),
  timezone: z.string().optional(),
  message: z.string(),
})
```

**Note:** For one-time tasks, omit the `repeat` field entirely.

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

### One-time Task

```javascript
{
  message: "/chat Run cleanup task",
  after: "14:00",
  timezone: "America/New_York"
}
```

**Note:** For one-time tasks, omit the `repeat` field. The task will run once at the specified time window.
```

## Tools

The scheduler package provides three tools for programmatic task management.

### scheduler_add_task

Add a new scheduled task to run an agent at specified intervals.

**Input Schema:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `taskName` | `string` | Yes | Unique name for the scheduled task |
| `task.description` | `string` | Yes | A long, several paragraph description of the exact task to execute. This should provide enough detail for an AI agent to understand the purpose and requirements of the task. |
| `task.context` | `string` | No | Additional context or information relevant to the task execution. This should include background information, dependencies, or any other details that could help the agent perform the task more effectively. |
| `task.repeat` | `string` | No | Interval string (e.g., "1 hour", "30 minutes"). Omit for one-time tasks. |
| `task.after` | `string` | No | Start time in HH:mm format (24-hour clock) |
| `task.before` | `string` | No | End time in HH:mm format (24-hour clock) |
| `task.timezone` | `string` | No | IANA timezone string (e.g., 'America/New_York', 'UTC') |

**Note:** The tool combines `description` and `context` into the task message with the format:
```
{`{description}`}

ADDITIONAL CONTEXT:{`{context}`}
```

**Required Context Handlers:** `["available-agents"]`

**Example:**

```typescript
await agent.executeTool('scheduler_add_task', {
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

**Throws:** `Error` if task not found

### scheduler_get_schedule

Get the current schedule of all scheduled tasks with their status and next run times.

**Input Schema:** Empty object

**Example:**

```typescript
const schedule = await agent.executeTool('scheduler_get_schedule', {});
// Returns:
// Scheduled Tasks:
//
// The current date and time is {current datetime}, and the following tasks are scheduled
//
// Daily Backup :
//   Message: Run a full backup...
//   Status: pending
//   Next Run: Mon, Jan 15, 2024, 2:00:00 AM
//   Last Run: Sun, Jan 14, 2024, 2:00:00 AM
```

## Utility Functions

The scheduler package provides several utility functions for time calculations.

### parseInterval

Parses interval strings into seconds.

**Location:** `@tokenring-ai/scheduler/utility/parseInterval`

```typescript
import { parseInterval } from "@tokenring-ai/scheduler/utility/parseInterval";

// Returns 60 (1 minute in seconds)
const interval = parseInterval("1 minute");

// Returns 3600 (1 hour in seconds)
const interval = parseInterval("1 hour");

// Returns 1728000 (20 days in seconds)
const interval = parseInterval("20 days");

// Returns null for invalid formats
const invalid = parseInterval("invalid");
```

**Supported Units:**
- `second`/`seconds`: 1 second
- `minute`/`minutes`: 60 seconds
- `hour`/`hours`: 3600 seconds
- `day`/`days`: 86400 seconds
- `week`/`weeks`: 604800 seconds (86400 × 7)
- `month`/`months`: 2678400 seconds (86400 × 31)

### getNextRunTime

Calculates the next run time for a scheduled task.

**Location:** `@tokenring-ai/scheduler/utility/getNextRunTime`

```typescript
import { getNextRunTime } from "@tokenring-ai/scheduler/utility/getNextRunTime";

// For a task configured to run daily at 9:00 AM
const task = {
  message: "/chat Generate daily report",
  repeat: "1 day",
  after: "09:00"
};

const nextRun = getNextRunTime(task);
// Returns timestamp for next scheduled run (or null if not schedulable)
```

**Behavior:**
- For tasks with `repeat`: Calculates next run time based on `lastRunTime + interval`
- For one-time tasks (no `repeat`): Calculates next run time from today/tomorrow
- Respects `after` and `before` time windows
- Respects `weekdays` and `dayOfMonth` conditions
- Searches up to 30 days ahead (`MAX_DAYS_AHEAD`)
- Returns `null` if no valid run time found within search window

### checkDayConditions

Checks if a date matches day conditions for scheduling.

**Location:** `@tokenring-ai/scheduler/utility/checkDayConditions`

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

**Behavior:**
- Checks if `dayOfMonth` matches (if specified)
- Checks if current day of week is in `weekdays` list (if specified)
- Returns `true` if both conditions match (or if no conditions specified)

### parseLoopCommand

Parses `/loop` command syntax into structured task configuration.

**Location:** `@tokenring-ai/scheduler/utility/parseLoopCommand`

```typescript
import { parseLoopCommand } from "@tokenring-ai/scheduler/utility/parseLoopCommand";

// Parse leading interval format
const result1 = parseLoopCommand("5m check deployment");
// { prompt: "check deployment", repeat: "5 minutes", displayInterval: "5 minutes" }

// Parse trailing "every" format
const result2 = parseLoopCommand("check build every 2 hours");
// { prompt: "check build", repeat: "2 hours", displayInterval: "2 hours" }

// Parse default interval (10 minutes)
const result3 = parseLoopCommand("monitor logs");
// { prompt: "monitor logs", repeat: "10 minutes", displayInterval: "10 minutes" }

// Parse seconds (rounded up to minutes)
const result4 = parseLoopCommand("30s ping server");
// { prompt: "ping server", repeat: "1 minute", displayInterval: "1 minute", note: "Rounded 30 seconds up to 1 minute..." }
```

**Behavior:**
- Supports leading interval format: `<interval> <prompt>`
- Supports trailing "every" format: `<prompt> every <interval>`
- Defaults to 10 minutes if no interval specified
- Rounds seconds up to the nearest minute
- Returns `null` for invalid input

## State Management

The scheduler maintains task state within the agent using two state slices.

### ScheduleTaskState

Tracks configured tasks and their execution history:
- `tasks`: Map of task name to ScheduledTask configuration
- `history`: Map of task name to array of TaskRunHistory entries

**Persistence:** Only `tasks` are serialized and persisted across agent restarts. Execution history is not persisted.

### ScheduleExecutionState

Tracks runtime execution state:
- `tasks`: Map of task name to ExecutionScheduleEntry
- `autoStart`: Whether the scheduler should auto-start
- `abortController`: Controls the scheduler loop

**Persistence:** Only `autoStart` is serialized and persisted. Runtime state (running tasks, timers) is not persisted and will be reset on restart.

**State Restoration Pattern:**
```typescript
// On agent restart, task configurations are restored from serialization
// The scheduler can be manually started with /schedule start
// Or automatically if autoStart is true and tasks exist
```

### ExecutionScheduleEntry

Interface for execution schedule entries:

```typescript
interface ExecutionScheduleEntry {
  nextRunTime: number | null;
  status: 'pending' | 'running';
  abortController?: AbortController;
  timer?: NodeJS.Timeout;
  startTime?: number;
}
```

### TaskRunHistory

Interface for task run history entries:

```typescript
interface TaskRunHistory {
  startTime: number;
  endTime: number;
  status: 'completed' | 'failed';
  message: string;
}
```

## Integration

The scheduler integrates with the agent system by:

1. **Plugin Registration**: Registers tools with `ChatService` and commands with `AgentCommandService`
2. **Service Registration**: Creates and attaches `SchedulerService` to agents
3. **State Management**: Registers state slices for task and execution tracking
4. **Agent Execution**: Sends messages to agents to trigger their work
5. **Event Monitoring**: Monitors agent execution and handles completion
6. **Command Registration**: Registers `/schedule` and `/loop` commands
7. **Tool Registration**: Registers tools with `ChatService` for programmatic access
8. **State Persistence**: Maintains task state across agent restarts

### Integration with TokenRingApp

The scheduler is installed as a plugin in the TokenRingApp:

```typescript
const app = new TokenRingApp("path/to/packages");
app.install(scheduler);
```

### Integration with ChatService

The scheduler registers tools with the ChatService:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
```

### Integration with AgentCommandService

The scheduler registers commands with the AgentCommandService:

```typescript
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(agentCommands)
);
```

### Integration with Agent System

When a task is scheduled to run, the scheduler:

1. Sends the task message to the current agent
2. Monitors execution through event streaming
3. Tracks completion status and timing
4. Updates execution history on completion
5. Handles errors and captures error messages

## Best Practices

### Task Naming

- Use descriptive, unique task names
- Avoid names with special characters or spaces
- Consider using prefixes for related tasks (e.g., "backup_daily", "backup_weekly")
- Ensure task names match between tools and commands

### Scheduling

- Set appropriate time windows to avoid overlapping executions
- Use timezones to ensure consistent scheduling across regions
- Consider system load when scheduling frequent tasks
- Test task configurations before deploying to production
- Use `weekdays` for business-day-only tasks
- Use `dayOfMonth` for monthly tasks (e.g., billing, reports)

### Monitoring

- Regularly check execution history for failed tasks with `/schedule history`
- Use `/schedule show` to verify task status
- Monitor agent logs for scheduler warnings and errors
- Review task duration in history to identify performance issues

### Task Design

- Keep task messages concise and focused
- Include context in task description for clarity
- Use appropriate repeat intervals (avoid too frequent execution)
- Consider using time windows to limit execution to off-peak hours

### State Management

- Understand that execution history is not persisted
- Plan for scheduler restart behavior (use `/schedule start` if needed)
- Verify task configurations after agent restarts

### Loop Command Usage

- Use `/loop` for quick, temporary repeated tasks
- Use `/schedule add` for permanent, configurable tasks
- Remember that loop tasks are auto-generated and may be harder to manage
- Use `/schedule show` to see all running tasks including loops

## Error Handling

- **Task Not Found**: `removeTask` throws `Error` when task doesn't exist
- **Configuration Validation**: Invalid configurations prevent agent attachment via Zod validation
- **Graceful Shutdown**: Scheduler stops scheduling new tasks and aborts running tasks via abort controller
- **Runtime Errors**: Execution errors are captured in run history with error message
- **Cancelled Operations**: Interactive task creation throws `CommandFailedError` when cancelled (e.g., user cancels form)
- **Missing Task Name**: `/schedule remove` throws `CommandFailedError` if no name provided
- **Task Exited Without Reason**: If task execution completes without proper event handling, marked as failed with "Task exited without any reason given"
- **Invalid Loop Command**: `/loop` throws `CommandFailedError` if command syntax is invalid

## Monitoring and Logging

- **Agent Output**: Real-time logging of task scheduling and execution through agent info/error messages
- **Run History**: All executions tracked with timing and status information
- **Status Monitoring**: Real-time task status through `/schedule show` command
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

### Test Files

- `utility/getNextRunTime.test.ts` - Tests for next run time calculation
- `utility/parseInterval.test.ts` - Tests for interval parsing
- `utility/checkDayConditions.test.ts` - Tests for day condition checking
- `utility/parseLoopCommand.test.ts` - Tests for loop command parsing

### Package Structure

```
pkg/scheduler/
├── index.ts                    # Main exports
├── plugin.ts                   # Plugin definition for TokenRing integration
├── schema.ts                   # Zod schemas and type definitions
├── SchedulerService.ts         # Core service implementation
├── commands.ts                 # Command exports
├── tools.ts                    # Tool exports
├── tools/
│   ├── addScheduledTask.ts     # scheduler_add_task tool
│   ├── removeScheduledTask.ts  # scheduler_remove_task tool
│   └── getSchedule.ts          # scheduler_get_schedule tool
├── state/
│   ├── scheduleTaskState.ts    # ScheduleTaskState implementation
│   └── scheduleExecutionState.ts # ScheduleExecutionState implementation
├── commands/
│   ├── schedule/
│   │   ├── add.ts              # /schedule add subcommand
│   │   ├── remove.ts           # /schedule remove subcommand
│   │   ├── show.ts             # /schedule show subcommand
│   │   ├── start.ts            # /schedule start subcommand
│   │   ├── stop.ts             # /schedule stop subcommand
│   │   └── history.ts          # /schedule history subcommand
│   └── loop.ts                 # /loop command
├── utility/
│   ├── parseInterval.ts        # parseInterval utility function
│   ├── getNextRunTime.ts       # getNextRunTime utility function
│   ├── checkDayConditions.ts   # checkDayConditions utility function
│   └── parseLoopCommand.ts     # parseLoopCommand utility function
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

- `vitest` (^4.1.0) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- **@tokenring-ai/agent**: Core agent system that the scheduler attaches to
- **@tokenring-ai/chat**: Chat service that provides tool integration
- **@tokenring-ai/app**: Base application framework for plugin registration
- **@tokenring-ai/utility**: Shared utilities including `deepMerge` for configuration
