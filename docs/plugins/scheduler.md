# Scheduler Plugin

Service for scheduling AI agents to run at specified intervals.

## Overview

The `@tokenring-ai/scheduler` package provides a scheduling system for AI agents with support for recurring tasks, one-time executions, and time window conditions. It allows agents to run automatically at defined intervals or specific conditions without manual intervention.

## Key Features

- **Task Scheduling**: Schedule agents to run at specified intervals or conditions
- **Time Windows**: Define running time windows with start and end times
- **Recurring Tasks**: Support for daily, hourly, and custom interval scheduling
- **One-time Tasks**: Execute tasks once per day
- **Agent Integration**: Automatically spawn and run agents for scheduled tasks
- **Monitoring**: Track task execution history and current status
- **Chat Command**: `/schedule` command to view scheduled tasks and execution history
- **Task Conditions**: Run tasks on specific days of the week or days of the month

## Core Components

### SchedulerService

The main service that manages task scheduling and execution.

**Key Methods:**
- `constructor(app: TokenRingApp, tasks: ScheduleTask[])`: Initialize with task configurations
- `run(signal: AbortSignal)`: Start the scheduling service
- `getStatus()`: Get current task status and execution history
- `runTask(taskIndex: number)`: Execute a specific task
- `retimeTask(taskIndex: number)`: Calculate next run time for a task

**Task Configuration:**
Each task is defined with the following properties:

```typescript
{
  name: string;                    // Task identifier
  agentType: string;               // Agent type to spawn
  every: string | undefined;       // Interval (e.g., "1 hour", "15 minutes")
  spaced: string | undefined;      // Spaced interval for immediate scheduling
  once: boolean | undefined;       // Run once per day
  from: string | undefined;        // Start time (e.g., "09:00")
  to: string | undefined;          // End time (e.g., "17:00")
  on: string | undefined;          // Days of week (e.g., "mon,tue,wed,thu,fri")
  dayOfMonth: number | undefined;  // Specific day of month (1-31)
  noLongerThan: string | undefined; // Maximum runtime (e.g., "1 hour")
  several: boolean | undefined;    // Allow multiple concurrent runs
  message: string;                // Message to send to the agent
}
```

### Task State Management

The scheduler maintains state for each task:
- `nextRun`: Next scheduled execution time
- `lastRun`: Last execution timestamp  
- `isRunning`: Whether the task is currently running
- `startTime`: Start time of current execution
- `maxRunTime`: Maximum allowed runtime

## Chat Commands

**/schedule**: Display current scheduled tasks and execution history

**Usage:**
```bash
/schedule
```

**Output:**
- List of scheduled tasks with names, agent types, and messages
- Current status (Running/Idle)
- Next run time for scheduled tasks
- Last run time for completed tasks
- Recent execution history with timestamps and status

## Usage Examples

### Basic Configuration

```typescript
import { AgentTeam } from "@tokenring-ai/agent";
import { packageInfo as schedulerPackage } from "@tokenring-ai/scheduler";

const team = new AgentTeam();

// Add scheduler package
await team.addPackages([schedulerPackage]);

// Configure scheduled tasks
const config = {
  scheduler: {
    tasks: [
      {
        name: "daily-report",
        agentType: "reporting-agent",
        every: "1 day",
        message: "generate daily sales report"
      },
      {
        name: "hourly-check",
        agentType: "monitoring-agent", 
        spaced: "1 hour",
        message: "check system health and performance"
      },
      {
        name: "weekly-backup",
        agentType: "backup-agent",
        once: true,
        on: "sun",
        message: "perform weekly data backup"
      }
    ]
  }
};

// Create agent and run with configuration
const agent = await team.createAgent("interactive-code-agent");
await agent.initialize();
```

### Advanced Scheduling with Time Windows

```typescript
const config = {
  scheduler: {
    tasks: [
      {
        name: "business-hours-report",
        agentType: "reporting-agent",
        every: "1 hour",
        from: "09:00",
        to: "17:00",
        on: "mon,tue,wed,thu,fri",
        message: "generate hourly business report"
      },
      {
        name: "end-of-day-summary", 
        agentType: "summary-agent",
        once: true,
        on: "mon,tue,wed,thu,fri",
        from: "17:00",
        to: "17:30",
        message: "generate end-of-day summary"
      },
      {
        name: "monthly-statistics",
        agentType: "analytics-agent",
        every: "1 month",
        dayOfMonth: 1,
        message: "generate monthly statistics report"
      }
    ]
  }
};
```

### Task with Runtime Limit

```typescript
const config = {
  scheduler: {
    tasks: [
      {
        name: "data-processing",
        agentType: "processor-agent",
        every: "6 hours",
        noLongerThan: "2 hours",
        message: "process incoming data batches"
      }
    ]
  }
};
```

### Multiple Concurrent Runs

```typescript
const config = {
  scheduler: {
    tasks: [
      {
        name: "api-health-check",
        agentType: "monitoring-agent",
        spaced: "5 minutes",
        several: true,
        message: "check API service health"
      }
    ]
  }
};
```

## Configuration Schema

```typescript
import { z } from "zod";

const SchedulerConfigSchema = z.object({
  tasks: z.array(z.object({
    name: z.string(),
    agentType: z.string(),
    every: z.string().optional(),
    spaced: z.string().optional(), 
    once: z.boolean().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    on: z.string().optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    noLongerThan: z.string().optional(),
    several: z.boolean().optional(),
    message: z.string()
  }))
}).optional();
```

## Time Interval Format

The scheduler supports various time interval formats:

- `"1 second"` / `"seconds"` - 1 second
- `"1 minute"` / `"minutes"` - 60 seconds  
- `"1 hour"` / `"hours"` - 3600 seconds
- `"1 day"` / `"days"` - 86400 seconds

Examples:
- `"15 minutes"` - Every 15 minutes
- `"2 hours"` - Every 2 hours
- `"1 day"` - Daily

## Dependencies

- `@tokenring-ai/app@0.2.0`: Application framework
- `@tokenring-ai/agent@0.2.0`: Core agent system
- `zod@^4.0.17`: Schema validation

## Integration

The scheduler integrates with the agent system by:
1. Spawning agents of specified types when tasks are scheduled to run
2. Sending messages to agents to trigger their work
3. Monitoring agent execution and handling timeouts
4. Maintaining task state and execution history
5. Providing a chat command for viewing task status

## Monitoring and Debugging

Use the `/schedule` command to monitor:
- Current task status and next run times
- Execution history with timestamps and durations
- Task errors and failure reasons
- Agent activity and completion status

The scheduler outputs detailed information to service logs for debugging and monitoring purposes.