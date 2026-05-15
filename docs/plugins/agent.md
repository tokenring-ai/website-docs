---
sidebar_position: 1
---

# Agent Core

## User Guide

### Overview and Purpose

The `@tokenring-ai/agent` package is the core component for creating, managing, and orchestrating AI agents within the Token Ring ecosystem. It provides a comprehensive framework for agent lifecycle management, state persistence, event handling, command execution, tool integration, and human interaction.

This package serves as the foundation for all AI agent functionality in Token Ring, enabling:

- Creation and management of multiple agent types
- Persistent state with checkpointing and restoration
- Comprehensive event system for real-time updates
- Extensible command system with slash commands
- Tool integration for agent capabilities
- Human interface for approvals and questions
- Sub-agent support for hierarchical workflows
- RPC endpoints for remote agent management

### Key Features

- **Agent Management**: Create, spawn, and manage individual AI agents with configurable lifecycles
- **State Management**: Persistent state with serialization, checkpointing, and restoration
- **Event System**: Comprehensive event handling with streaming capabilities
- **Command System**: Slash command interface with extensible commands
- **Tool Integration**: Tool execution with context and parameter validation
- **Human Interface**: Request/response system for human interaction
- **Sub-Agent Support**: Create and manage child agents with configurable output forwarding
- **RPC Integration**: JSON-RPC endpoints for remote agent management
- **Automatic Lifecycle Management**: Idle cleanup, max runtime, and minimum agent count

### Chat Commands

The agent package provides the following chat commands:

| Command                    | Description                              |
|----------------------------|------------------------------------------|
| `/agent types`             | List all available agent types           |
| `/agent list`              | List all currently running agents        |
| `/agent run`               | Run an agent with a message              |
| `/agent shutdown [agentId]`| Shut down an agent (current or specified)|
| `/help`                    | Display help information                 |
| `/settings`                | Display settings                         |
| `/debug logging`           | Debug logging controls                   |
| `/debug markdown`          | Markdown rendering test                  |
| `/debug services`          | Service logs display                     |
| `/debug questions`         | Debug questions display                  |
| `/debug checkpoint`        | Debug checkpoint test                    |
| `/debug app`               | Debug app info                           |
| `/debug commands`          | Debug commands display                   |

#### `/agent run` Options

| Flag                  | Description                                      |
|-----------------------|--------------------------------------------------|
| `--type`              | The type of agent to run (required)              |
| `--bg`                | Run the agent in the background                  |
| `--forwardChatOutput` | Forward chat output from the sub-agent           |
| `--noStatusMessages`  | Do not forward status messages                   |
| `--forwardSystemOutput` | Forward system output from the sub-agent       |
| `--noHumanRequests`   | Do not forward human requests                    |
| `--forwardReasoning`  | Forward reasoning output                         |
| `--noInputCommands`   | Do not forward input commands                    |
| `--forwardArtifacts`  | Forward artifacts from the sub-agent             |
| `--timeout`           | Timeout in milliseconds (0 = no timeout)         |
| `--maxResponseLength` | Maximum response length from the sub-agent       |
| `--minContextLength`  | Minimum context length for the sub-agent         |
| `--neverFail`         | Ignore errors, print as warnings instead         |

**Examples:**

```bash
/agent run --type leader --forwardChatOutput analyze the codebase
/agent run --bg --type researcher find information about AI
```

#### `/agent shutdown` Options

| Argument   | Description                                      |
|------------|--------------------------------------------------|
| `[agentId]`| Optional agent ID to shut down (defaults to current agent) |

**Examples:**

```bash
/agent shutdown
/agent shutdown abc123
```

### Tools

The agent package includes the following built-in tools:

| Tool                   | Description                                              |
|------------------------|----------------------------------------------------------|
| `get_current_datetime` | Returns the current date, time, day of week, and timezone |
| `sleep`                | Sleeps for a specified number of seconds                 |
| `give_up`              | Indicates that the task cannot be completed              |

### Configuration

#### Agent Configuration

Agents are configured using the `AgentConfigSchema`:

```yaml
agents:
  app:
    - agentType: teamLeader
      displayName: Team Leader
      description: Coordinates development tasks
      category: development
      debug: false
      initialCommands: []
      headless: false
      idleTimeout: 0
      maxRunTime: 0
      minimumRunning: 0
      createMessage: Agent Created
```

**Configuration Options:**

| Option             | Type     | Default | Description                              |
|--------------------|----------|---------|------------------------------------------|
| `agentType`        | string   | -       | Agent type identifier (required)         |
| `displayName`      | string   | -       | Agent display name (required)            |
| `description`      | string   | -       | Agent purpose (required)                 |
| `category`         | string   | -       | Agent category (required)                |
| `debug`            | boolean  | false   | Enable debug logging                     |
| `initialCommands`  | string[] | []      | Startup commands                         |
| `createMessage`    | string   | "Agent Created" | Message when agent is created    |
| `headless`         | boolean  | false   | Headless mode                            |
| `idleTimeout`      | number   | 0       | Idle timeout in seconds (0 = no limit)   |
| `maxRunTime`       | number   | 0       | Max runtime in seconds (0 = no limit)    |
| `minimumRunning`   | number   | 0       | Minimum running agents of this type      |

#### Sub-Agent Configuration

```yaml
subAgent:
  forwardChatOutput: false
  forwardStatusMessages: true
  forwardSystemOutput: false
  forwardHumanRequests: true
  forwardReasoning: false
  forwardInputCommands: true
  forwardArtifacts: false
  timeout: 0
  maxResponseLength: 10000
  minContextLength: 1000
```

**Configuration Options:**

| Option                  | Type     | Default | Description                              |
|-------------------------|----------|---------|------------------------------------------|
| `forwardChatOutput`     | boolean  | false   | Forward chat output                      |
| `forwardStatusMessages` | boolean  | true    | Forward status messages                  |
| `forwardSystemOutput`   | boolean  | false   | Forward system output                    |
| `forwardHumanRequests`  | boolean  | true    | Forward human requests                   |
| `forwardReasoning`      | boolean  | false   | Forward reasoning                        |
| `forwardInputCommands`  | boolean  | true    | Forward input commands                   |
| `forwardArtifacts`      | boolean  | false   | Forward artifacts                        |
| `timeout`               | number   | 0       | Sub-agent timeout in seconds (0 = no limit) |
| `maxResponseLength`     | number   | 10000   | Max response length in characters        |
| `minContextLength`      | number   | 1000    | Minimum context length in characters     |

#### Agent Command Configuration

Custom agent commands can be configured using the `AgentCommandConfigSchema`:

```yaml
commands:
  myCommand:
    agentType: teamLeader
    description: Custom command description
    help: "# /myCommand\n\nDetailed help text"
    background: false
    steps:
      - "/work Process this task"
    subAgent:
      forwardChatOutput: true
      timeout: 60
```

**Configuration Options:**

| Option         | Type        | Default | Description                                      |
|----------------|-------------|---------|--------------------------------------------------|
| `agentType`    | string      | -       | Type of agent to use for execution (required)    |
| `description`  | string      | -       | Custom command description                       |
| `help`         | string      | -       | Custom help text for the command                 |
| `background`   | boolean     | false   | Run in background mode by default                |
| `steps`        | string[]    | -       | Command steps to execute (minimum 1)             |
| `subAgent`     | SubAgentConfig | {}    | Sub-agent configuration for command execution    |

The `commandSchema` option allows customizing the input schema for the command, with a default `remainder` field named "prompt" that accepts the user's message.

### Integration

The agent package integrates with the following Token Ring components:

- **Chat Service**: Provides tool integration and context handlers
- **RPC Service**: Exposes agent management endpoints
- **Lifecycle Service**: Provides hook execution for agent input processing
- **App Framework**: Base application for service registration

### Best Practices

1. **Agent Lifecycle**: Configure appropriate `idleTimeout` and `maxRunTime` values to prevent resource exhaustion
2. **Sub-Agent Usage**: Use `autoCleanup: true` (default) to ensure sub-agents are properly cleaned up
3. **State Management**: Use checkpointing for long-running tasks that may need recovery
4. **Human Interface**: Set reasonable `timeout` values for approval requests to prevent hanging
5. **Event Streaming**: Use `subscribeStateAsync` for efficient event consumption in long-running operations
6. **Error Handling**: Always handle `CommandFailedError` when executing commands that may fail

## Developer Reference

### Core Components

#### Agent Class

The central agent implementation providing comprehensive AI agent functionality.

**Location**: `pkg/agent/Agent.ts`

**Key Properties:**

| Property              | Type                | Description                                 |
|-----------------------|---------------------|---------------------------------------------|
| `id`                  | `string`            | Unique agent identifier (human-readable ID) |
| `displayName`         | `string`            | Agent display name                          |
| `config`              | `ParsedAgentConfig` | Parsed agent configuration                  |
| `debugEnabled`        | `boolean`           | Debug logging toggle                        |
| `headless`            | `boolean`           | Headless operation mode                     |
| `app`                 | `TokenRingApp`      | TokenRing application instance              |
| `stateManager`        | `StateManager`      | State management system                     |

**Key Methods:**

| Method                                   | Description                                  |
|------------------------------------------|----------------------------------------------|
| `initializeState<T>(ClassType, props)`   | Initialize state slice with properties       |
| `getState<T>(ClassType)`                 | Retrieve state slice                         |
| `mutateState<T>(ClassType, callback)`    | Modify state slice with callback             |
| `subscribeState<T>(ClassType, callback)` | Subscribe to state changes                   |
| `waitForState<T>(ClassType, predicate)`  | Wait for state condition                     |
| `subscribeStateAsync<T>(ClassType)`      | Subscribe asynchronously with async iterator |
| `generateCheckpoint()`                   | Create state checkpoint for restoration      |
| `restoreState(state)`                    | Restore from checkpoint state                |
| `handleInput(input)`                     | Process user input, returns requestId        |
| `runCommand(command)`                    | Execute agent commands                       |
| `abortCurrentOperation(reason)`          | Abort current operation with reason          |
| `askForApproval(options)`                | Request approval (Yes/No)                    |
| `askForText(options)`                    | Request text input                           |
| `askQuestion(question)`                  | Request human input with various types       |
| `chatOutput(message)`                    | Emit chat output event                       |
| `reasoningOutput(message)`               | Emit reasoning output event                  |
| `artifactOutput(artifact)`               | Emit output artifact                         |

#### AgentManager Service

Central service for managing agent lifecycles and configurations.

**Location**: `pkg/agent/services/AgentManager.ts`

**Implements**: `TokenRingService`

**Key Methods:**

| Method                                         | Description                              |
|------------------------------------------------|------------------------------------------|
| `addAgentConfigs(...configs)`                  | Register multiple agent configurations   |
| `getAgentConfigEntries()`                      | Get all agent configuration entries      |
| `getAgentConfig(name)`                         | Get specific agent configuration by name |
| `getAgentTypes()`                              | Get all available agent types            |
| `getAgentTypesLike(pattern)`                   | Get agent types matching glob pattern    |
| `spawnAgent({agentType, headless})`            | Create new agent of specified type       |
| `spawnSubAgent(agent, agentType, config)`      | Create sub-agent with parent             |
| `spawnAgentFromConfig(config)`                 | Create agent from configuration          |
| `spawnAgentFromCheckpoint(checkpoint, config)` | Create agent from checkpoint             |
| `getAgent(id)`                                 | Get agent by ID                          |
| `getAgents()`                                  | Get all active agents                    |
| `deleteAgent(agentId, reason)`                 | Shutdown and remove agent                |

**Lifecycle Management:**

The AgentManager runs a housekeeping loop every 15 seconds that:

- Deletes idle agents exceeding their `idleTimeout`
- Deletes agents exceeding their `maxRunTime`
- Spawns new agents to meet `minimumRunning` requirements

#### AgentCommandService Service

Service for managing and executing agent commands.

**Location**: `pkg/agent/services/AgentCommandService.ts`

**Implements**: `TokenRingService`

**Key Methods:**

| Method                                             | Description                   |
|----------------------------------------------------|-------------------------------|
| `addAgentCommands(...commands)`                    | Register one or more commands |
| `getCommandNames()`                                | Get all command names         |
| `getCommandEntries()`                              | Get all command entries       |
| `getCommand(name)`                                 | Get specific command by name  |
| `executeAgentCommand(agent, message, attachments)` | Execute command               |

**Command Processing:**

- Automatic slash command parsing
- Default chat command fallback (`/chat send`) for plain text
- Agent mention handling (`@agentName message`)
- Error handling with suggestions for unknown commands

#### SubAgentService Service

Service for managing sub-agent execution and permissions.

**Location**: `pkg/agent/services/SubAgentService.ts`

**Implements**: `TokenRingService`

**Key Methods:**

| Method                 | Description                                |
|------------------------|--------------------------------------------|
| `runSubAgent(options)` | Run sub-agent with configurable forwarding |

**Event Forwarding:**

The service supports forwarding the following event types from child to parent agents:

- Chat output
- Reasoning output
- System output (info, warning)
- Error output
- Input commands
- Artifacts
- Status messages
- Human requests (with mirroring to parent)

### Services

#### TokenRingService Implementations

The package provides three `TokenRingService` implementations:

1. **AgentManager**: Manages agent configurations and lifecycles
2. **AgentCommandService**: Handles command registration and execution
3. **SubAgentService**: Manages sub-agent execution and event forwarding

### Provider Documentation

The package does not define provider interfaces. It relies on the `@tokenring-ai/chat` package for tool definitions and the `@tokenring-ai/rpc` package for RPC endpoint registration.

### Utility Functions

#### createAgentCommand

The `createAgentCommand` utility function is used to create agent commands from configuration:

**Location**: `pkg/agent/util/createAgentCommand.ts`

```typescript
import { createAgentCommand } from "@tokenring-ai/agent/util/createAgentCommand";

const command = createAgentCommand("myCommand", {
  agentType: "teamLeader",
  description: "Custom command",
  steps: ["/work Process this"],
  subAgent: {
    forwardChatOutput: true
  }
});
```

This utility creates a `TokenRingAgentCommand` that can be registered with the `AgentCommandService`.

#### formatAgentCommandUsage

Formats the usage information for agent commands:

**Location**: `pkg/agent/util/formatAgentCommandUsage.ts`

#### formatAgentId

Formats agent IDs for display:

**Location**: `pkg/agent/util/formatAgentId.ts`

#### parseAgentCommandInput

Parses user input into agent commands:

**Location**: `pkg/agent/util/parseAgentCommandInput.ts`

**Features**:

- Automatic slash command parsing
- Plain text fallback to `/chat send`
- Agent mention handling (`@agentName message`)
- Error handling with suggestions for unknown commands

### RPC Endpoints

The package registers the following RPC endpoints via `@tokenring-ai/rpc`:

| Endpoint                  | Type     | Request Params                                            | Response                                   |
|---------------------------|----------|-----------------------------------------------------------|--------------------------------------------|
| `getAgentConfig`          | query    | `{agentId}`                                               | Agent config or `agentNotFound`            |
| `getAgentEvents`          | query    | `{agentId, fromPosition}`                                 | Events from position                       |
| `streamAgentEvents`       | stream   | `{agentId, fromPosition}`                                 | Streaming events                           |
| `listAgents`              | query    | `{}`                                                      | Array of agent information                 |
| `getAgentTypes`           | query    | `{}`                                                      | Array of agent types                       |
| `createAgent`             | mutation | `{agentType, headless}`                                   | Created agent details                      |
| `deleteAgent`             | mutation | `{agentId, reason}`                                       | Success status or `agentNotFound`          |
| `sendInput`               | mutation | `{agentId, input: {from, message, attachments?}}`         | Request ID or `agentNotFound`              |
| `sendInteractionResponse` | mutation | `{agentId, response: {requestId, interactionId, result}}` | Success status or `agentNotFound`          |
| `abortCurrentOperation`   | mutation | `{agentId, message}`                                      | Success status or `agentNotFound`          |
| `getCommandHistory`       | query    | `{agentId}`                                               | Command history or `agentNotFound`         |
| `getAvailableCommands`    | query    | `{agentId}`                                               | Available command names or `agentNotFound` |

### Usage Examples

#### Creating and Using an Agent

```typescript
import Agent from "@tokenring-ai/agent";
import AgentManager from "@tokenring-ai/agent/services/AgentManager";
import TokenRingApp from "@tokenring-ai/app";
import { AgentEventState } from "@tokenring-ai/agent/state/agentEventState";

const app = new TokenRingApp();
const agentManager = new AgentManager(app);

// Add agent configuration
agentManager.addAgentConfigs({
  agentType: "myAgent",
  displayName: "My Agent",
  description: "Custom development agent",
  category: "development",
  debug: false,
  initialCommands: [],
  headless: false,
  idleTimeout: 0,
  maxRunTime: 0,
  minimumRunning: 0,
  createMessage: "Agent Created"
});

// Spawn agent
const agent = agentManager.spawnAgent({
  agentType: "myAgent",
  headless: false
});

// Handle user input
const requestId = agent.handleInput({ 
  from: "user", 
  message: "Hello! How can you help me?" 
});

// Listen to events
for await (const state of agent.subscribeStateAsync(
  AgentEventState, 
  agent.agentShutdownSignal
)) {
  for (const event of state.events) {
    console.log("Event:", event.type, event);
  }
}
```

#### Using Sub-Agent Service

```typescript
import SubAgentService from "@tokenring-ai/agent/services/SubAgentService";

const subAgentService = agent.getServiceByType(SubAgentService);

// Run sub-agent with custom forwarding options
const result = await subAgentService.runSubAgent({
  agentType: "code-assistant",
  headless: true,
  from: "parent",
  steps: ["/work Analyze this code"],
  parentAgent: agent,
  options: {
    forwardChatOutput: true,
    forwardSystemOutput: true,
    forwardHumanRequests: true,
    timeout: 60,
    maxResponseLength: 5000,
    minContextLength: 1000
  },
  autoCleanup: true,
});

console.log("Result:", result.status, result.response);
```

#### Human Interface

The agent package provides a comprehensive human interface for requesting user input. The following question types are supported:

- **Text Question**: Simple text input with optional masking for passwords. Supports `autoSubmitAfter` for automatic submission after a timeout.
- **Tree Select Question**: Hierarchical selection from a tree of options. Supports minimum and maximum selections. Allows freeform input if enabled.
- **File Select Question**: Selection of files and/or directories. Supports minimum and maximum selections.
- **Form Question**: Multi-section forms with various field types. Combines text, tree select, and file select fields.

The `autoSubmitAfter` option (in milliseconds) allows automatic submission of questions after a timeout, using the default value if no response is provided.

```typescript
// Simple approval
const approved = await agent.askForApproval({
  message: "Are you sure you want to proceed?",
  label: "Approve?",
  default: false,
  timeout: 30000
});

// Text input
const text = await agent.askForText({
  message: "Enter your name:",
  label: "Name",
  masked: false
});

// Tree selection
const selection = await agent.askQuestion({
  message: "Choose an option",
  question: {
    type: 'treeSelect',
    label: 'Select',
    minimumSelections: 1,
    maximumSelections: 1,
    defaultValue: [],
    tree: [
      { name: "Option 1", value: "opt1" },
      { name: "Option 2", value: "opt2" }
    ]
  }
});
```

### Event System

The agent package provides a comprehensive event system for real-time updates and state management. Events are emitted throughout the agent lifecycle and can be consumed via state subscriptions.

**Event Types:**

| Event Type              | Description                                      |
|-------------------------|--------------------------------------------------|
| `input.received`        | Input received from user                         |
| `input.interaction`     | User interaction response                        |
| `output.chat`           | Chat output from agent                           |
| `output.reasoning`      | Reasoning output from agent                      |
| `output.info`           | Informational messages                           |
| `output.warning`        | Warning messages                                 |
| `output.error`          | Error messages                                   |
| `output.artifact`       | Output artifact (files, documents, etc.)         |
| `agent.execution`       | Agent execution state update                     |
| `agent.created`         | Agent was created                                |
| `agent.stopped`         | Agent was stopped                                |
| `agent.response`        | Agent response (success, error, or cancelled)    |
| `agent.status`          | Agent status update                              |
| `cancel`                | Operation cancelled                              |
| `input.execution`       | Input execution status update                    |
| `toolCall`              | Tool call result                                 |

**Event Schema:**

All events follow this structure:

```typescript
{
  type: EventType,
  timestamp: number,
  // Event-specific fields
}
```

**Consuming Events:**

Events can be consumed via state subscriptions:

```typescript
import { AgentEventState } from "@tokenring-ai/agent/state/agentEventState";

for await (const state of agent.subscribeStateAsync(
  AgentEventState,
  agent.agentShutdownSignal
)) {
  for (const event of state.yieldEventsByCursor(cursor)) {
    console.log("Event:", event.type, event);
  }
}
```

### Testing

The package includes comprehensive unit and integration tests:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

**Test Structure:**

- `test/unit/agent.test.ts` - Core Agent class tests
- `test/unit/AgentManager.test.ts` - AgentManager service tests
- `test/unit/AgentCommandService.test.ts` - Command service tests
- `test/unit/commands/help.test.ts` - Help command tests
- `test/integration/agent-integration.test.ts` - Integration tests

### Schemas

The package exports the following Zod schemas from `pkg/agent/schema.ts`:

#### AgentConfigSchema

Defines the configuration for an individual agent type:

```typescript
import { AgentConfigSchema } from "@tokenring-ai/agent/schema";

const config = {
  agentType: "myAgent",
  displayName: "My Agent",
  description: "Custom development agent",
  category: "development",
  debug: false,
  initialCommands: [],
  createMessage: "Agent Created",
  headless: false,
  idleTimeout: 0,
  maxRunTime: 0,
  minimumRunning: 0
};
```

#### AgentPackageConfigSchema

Defines the package-level configuration for agents and commands:

```typescript
import { AgentPackageConfigSchema } from "@tokenring-ai/agent/schema";

const config = {
  agents: {
    app: [
      {
        agentType: "teamLeader",
        displayName: "Team Leader",
        description: "Coordinates development",
        category: "development"
      }
    ]
  },
  commands: {}
};
```

#### SubAgentConfigSchema

Defines the configuration for sub-agent execution:

```typescript
import { SubAgentConfigSchema } from "@tokenring-ai/agent/schema";

const config = {
  forwardChatOutput: false,
  forwardStatusMessages: true,
  forwardSystemOutput: false,
  forwardHumanRequests: true,
  forwardReasoning: false,
  forwardInputCommands: true,
  forwardArtifacts: false,
  timeout: 0,
  maxResponseLength: 10000,
  minContextLength: 1000
};
```

#### AgentCommandConfigSchema

Defines the configuration for custom agent commands:

```typescript
import { AgentCommandConfigSchema } from "@tokenring-ai/agent/schema";

const config = {
  agentType: "teamLeader",
  description: "Custom command",
  steps: ["/work Process this"],
  background: false,
  subAgent: {
    forwardChatOutput: true
  }
};
```

#### AgentEventEnvelopeSchema

Schema for all agent events. The package exports event schemas from `pkg/agent/AgentEvents.ts`:

```typescript
import { AgentEventEnvelopeSchema } from "@tokenring-ai/agent/AgentEvents";

// Event types include:
// - AgentCreatedSchema
// - AgentStoppedSchema
// - AgentStatusSchema
// - AgentResponseSchema (discriminated by status: success/error/cancelled)
// - OutputArtifactSchema
// - OutputChatSchema
// - OutputReasoningSchema
// - OutputInfoSchema
// - OutputWarningSchema
// - OutputErrorSchema
// - InputReceivedSchema
// - InputCancelSchema
// - InputExecutionStateSchema
// - InteractionResponseSchema
// - ToolCallResultSchema
```

#### AgentNotFoundSchema

Schema for agent not found errors in RPC responses:

```typescript
import { AgentNotFoundSchema } from "@tokenring-ai/agent/schema";

// Returns: { status: "agentNotFound" }
```

#### Question Type Schemas

The package exports the following question type schemas from `pkg/agent/question.ts`:

**TextQuestionSchema:**

```typescript
import { TextQuestionSchema } from "@tokenring-ai/agent/question";

const question = {
  type: "text",
  label: "Name",
  description: "Enter your name",
  required: false,
  defaultValue: "",
  expectedLines: 1,
  masked: false,
  autoSubmitAfter: 30000  // Optional: auto-submit after 30 seconds
};
```

**TreeSelectQuestionSchema:**

```typescript
import { TreeSelectQuestionSchema, TreeLeafSchema } from "@tokenring-ai/agent/question";

const question = {
  type: "treeSelect",
  label: "Choose an option",
  description: "Select from available options",
  minimumSelections: 1,
  maximumSelections: 1,
  defaultValue: [],
  allowFreeform: false,
  tree: [
    {
      name: "Option 1",
      value: "opt1"
    },
    {
      name: "Option Group",
      children: [
        { name: "Sub-option 1", value: "sub1" },
        { name: "Sub-option 2", value: "sub2" }
      ]
    }
  ]
};
```

**FileSelectQuestionSchema:**

```typescript
import { FileSelectQuestionSchema } from "@tokenring-ai/agent/question";

const question = {
  type: "fileSelect",
  allowFiles: true,
  allowDirectories: true,
  label: "Select files",
  description: "Choose files or folders",
  minimumSelections: 1,
  maximumSelections: 5,
  defaultValue: []
};
```

**FormQuestionSchema:**

```typescript
import { FormQuestionSchema, FormSectionSchema } from "@tokenring-ai/agent/question";

const question = {
  type: "form",
  sections: [
    {
      name: "personal",
      description: "Personal Information",
      fields: {
        name: {
          type: "text",
          label: "Full Name",
          defaultValue: ""
        },
        email: {
          type: "text",
          label: "Email",
          defaultValue: ""
        }
      }
    }
  ]
};
```

### Dependencies

| Dependency                | Version      | Purpose                          |
|---------------------------|--------------|----------------------------------|
| `@tokenring-ai/chat`      | workspace:*  | Chat service and tool definitions |
| `@tokenring-ai/utility`   | workspace:*  | Shared utilities                 |
| `@tokenring-ai/app`       | workspace:*  | Base application framework       |
| `@tokenring-ai/lifecycle` | workspace:*  | Lifecycle hooks integration      |
| `@tokenring-ai/rpc`       | workspace:*  | RPC service integration          |
| `uuid`                    | 14.0.0       | Unique ID generation             |
| `zod`                     | ^4.3.6       | Schema validation                |

### Related Components

- **@tokenring-ai/chat**: Provides tool definitions and chat context handlers
- **@tokenring-ai/rpc**: Provides RPC endpoint registration
- **@tokenring-ai/lifecycle**: Provides hook execution for agent input processing
- **@tokenring-ai/app**: Base application framework for service registration

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
