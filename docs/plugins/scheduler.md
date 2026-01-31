# Scheduler Plugin

Service for scheduling AI agents to run at specified intervals.

## Overview

The `@tokenring-ai/scheduler` package provides a scheduling system that runs within AI agents to automatically spawn and execute other agents at defined intervals or conditions. It supports recurring tasks, one-time executions, and time window constraints with comprehensive monitoring and state management.

## Key Features

- **Task Scheduling**: Schedule agents to run at specified intervals or conditions
- **Time Windows**: Define running time windows with start and end times
- **Recurring Tasks**: Support for daily, hourly, and custom interval scheduling
- **One-time Tasks**: Execute tasks once per day
- **Agent Integration**: Automatically spawn and run agents for scheduled tasks
- **Monitoring**: Track task execution history and current status
- **Chat Commands**: `/schedule` command to manage and view scheduled tasks
- **Task Conditions**: Run tasks on specific days of the week or days of the month
- **State Persistence**: Task state persists across agent restarts

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
- `abortController`: Controls the scheduler loop

## Chat Commands

**/schedule**: Manage and monitor scheduled tasks

**Usage:**
```bash
/schedule start              # Start the scheduler
/schedule stop               # Stop the scheduler
/schedule show               # Display current schedule and running status
/schedule history            # Display task execution history
/schedule add                # Add a new task (interactive)
/schedule remove <name>      # Remove a task by name
```

**Output Example:**
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
        }
      }
    }
  }
};
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
  repeat: "1 week",
  dayOfMonth: 1
}
```

## API Reference

### Tools

#### add_scheduled_task

Add a new scheduled task to run an agent at specified intervals.

**Parameters:**
- `taskName` (string): Unique name for the scheduled task
- `task` (ScheduledTask): Task configuration

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

#### remove_scheduled_task

Remove a scheduled task by name.

**Parameters:**
- `taskName` (string): Name of the scheduled task to remove

**Example:**
```typescript
await agent.executeTool('remove_scheduled_task', {
  taskName: "Daily Backup"
});
```

#### scheduler_get_schedule

Get the current schedule of all scheduled tasks with their status and next run times.

**Example:**
```typescript
const schedule = await agent.executeTool('scheduler_get_schedule', {});
```

## Task Configuration

### ScheduledTask Schema

```typescript
{
  message: string;             // Message to send to the agent
  repeat?: string;              // Run at fixed intervals (e.g., "30 minutes")
  after?: string;               // Start time in HH:MM format
  before?: string;             // End time in HH:MM format
  weekdays?: string;           // Days of week (e.g., "mon tue wed")
  dayOfMonth?: number;         // Specific day of month (1-31)
  timezone?: string;           // Timezone for scheduling
}
```

### Time Intervals

Supported formats:
- `"1 second"` / `"30 seconds"`
- `"1 minute"` / `"5 minutes"`
- `"1 hour"` / `"2 hours"`
- `"1 day"` / `"7 days"`

### Days of Week

Use three-letter abbreviations: `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`

Multiple days: `"mon tue wed thu fri"` or `"sat sun"`

## Integration

The scheduler integrates with the agent system by:
1. Automatically attaching to agents with scheduler configuration
2. Spawning agents of specified types when tasks are scheduled to run
3. Sending messages to agents to trigger their work
4. Monitoring agent execution and handling timeouts
5. Maintaining task state and execution history
6. Providing chat commands for viewing task status

## Best Practices

- **Use descriptive task names**: Make task names clear for monitoring and debugging
- **Set appropriate timeouts**: Use `before` time window to prevent runaway tasks
- **Monitor execution history**: Regularly check `/schedule history` for failures
- **Stagger schedules**: Avoid running multiple heavy tasks simultaneously
- **Use time windows**: Restrict tasks to business hours when appropriate
- **Test before deploying**: Verify task configuration with `/schedule show`

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

## Related Components

- **@tokenring-ai/agent**: Core agent system and orchestration
- **@tokenring-ai/app**: Application framework and plugin system
- **@tokenring-ai/chat**: Chat service and command management
