# Agent Plugin

## Overview

The Agent package serves as the core orchestration system for managing AI agents within the TokenRing ecosystem. It provides a complete agent framework with comprehensive state management, event handling, command execution, tool integration, and lifecycle management. This package enables the creation and management of individual AI agents that integrate seamlessly with the TokenRing application framework.

## Key Features

- **Agent Management**: Create, spawn, and manage individual AI agents with unique configurations
- **State Management**: Persistent state with serialization and checkpointing for session recovery
- **Event System**: Comprehensive event handling and emission for chat output, reasoning, and system messages
- **Command System**: Extensible slash command interface with built-in commands like help, cost, and settings
- **Agent Command Registration**: Automatically register agents as callable commands for intuitive invocation
- **Tool Integration**: Tool execution with context and parameter validation
- **Hook System**: Lifecycle hooks for extensibility (before/after chat completion, agent events)
- **Human Interface**: Request/response system for human interaction and input with form support
- **Sub-Agent Support**: Create and manage child agents with independent state
- **Cost Tracking**: Monitor and track resource usage across API calls and tokens
- **RPC Integration**: JSON-RPC endpoints for remote agent management
- **Plugin Integration**: Automatic integration with TokenRing applications
- **Idle/Max Runtime Management**: Automatic cleanup of idle or long-running agents
- **Minimum Running Agents**: Maintain minimum number of agents per type
- **Status Line Management**: Visual indicators for busy state and status messages
- **Todo Management**: Built-in todo list with sub-agent state transfer capability
- **Pause/Resume**: Pause and resume agent execution
- **Abort Handling**: Graceful abort handling with cleanup
- **Artifact Output**: Support for outputting artifacts (files, documents, etc.)

## Core Components

### Agent Class

The central agent implementation providing comprehensive AI agent functionality:

```typescript
import Agent from "@tokenring-ai/agent";
import TokenRingApp from "@tokenring-ai/app";
import {ParsedAgentConfig} from "@tokenring-ai/agent/schema";

const app = new TokenRingApp();

// Agent is typically created via AgentManager, not directly
// But can be created directly if needed:
const config: ParsedAgentConfig = {
  agentType: "myAgent",
  displayName: "My Agent",
  description: "Custom development agent",
  category: "development",
  debug: false,
  initialCommands: [],
  headless: false,
  callable: true,
  idleTimeout: 0,
  maxRunTime: 0,
  minimumRunning: 0,
  subAgent: {},
  allowedSubAgents: [],
  enabledHooks: [],
  todos: {},
  createMessage: "Agent Created"
};

const shutdownController = new AbortController();
const agent = new Agent(app, config, null, shutdownController.signal);
```

**Key Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique agent identifier (UUID) |
| `displayName` | `string` | Agent display name |
| `config` | `ParsedAgentConfig` | Parsed agent configuration |
| `debugEnabled` | `boolean` | Debug logging toggle |
| `headless` | `boolean` | Headless operation mode |
| `app` | `TokenRingApp` | TokenRing application instance |
| `stateManager` | `StateManager` | State management system |
| `agentShutdownSignal` | `AbortSignal` | Agent shutdown signal |

**State Management Methods:**

| Method | Description |
|--------|-------------|
| `initializeState<T>(ClassType, props)` | Initialize state slice with properties |
| `getState<T>(ClassType)` | Retrieve state slice |
| `mutateState<T>(ClassType, callback)` | Modify state slice with callback |
| `subscribeState<T>(ClassType, callback)` | Subscribe to state changes |
| `waitForState<T>(ClassType, predicate)` | Wait for state condition |
| `timedWaitForState<T>(ClassType, predicate, timeout)` | Wait for state with timeout |
| `subscribeStateAsync<T>(ClassType)` | Subscribe asynchronously with async iterator |
| `generateCheckpoint()` | Create state checkpoint for restoration |
| `restoreState(state)` | Restore from checkpoint state |

**Input Processing:**

| Method | Description |
|--------|-------------|
| `handleInput({message, attachments})` | Process user input with event emission, returns requestId |
| `runCommand(command)` | Execute agent commands |
| `busyWhile<T>(message, awaitable)` | Execute with busy state indicator |
| `setBusyWith(message)` | Set busy status indicator |
| `updateStatus(statusMessage)` | Update status message |

**Event Emission:**

| Method | Description |
|--------|-------------|
| `chatOutput(message)` | Emit chat output event |
| `reasoningOutput(message)` | Emit reasoning output event |
| `infoMessage(...messages)` | Emit informational messages |
| `warningMessage(...messages)` | Emit warning messages |
| `errorMessage(...messages)` | Emit error messages |
| `debugMessage(...messages)` | Emit debug messages (if debugEnabled) |
| `artifactOutput({name, encoding, mimeType, body})` | Emit output artifact |
| `updateStatus(message)` | Emit status update event |

**Human Interface:**

| Method | Description |
|--------|-------------|
| `askForApproval({message, label, default, timeout})` | Request approval (Yes/No), returns `Promise<boolean \| null>` |
| `askForText({message, label, masked})` | Request text input, returns `Promise<string \| null>` |
| `askQuestion<T>(question)` | Request human input with various question types |
| `sendQuestionResponse(requestId, response)` | Send human response to question |

**Lifecycle Management:**

| Method | Description |
|--------|-------------|
| `requestAbort(message)` | Request abort with message |
| `requestPause(message)` | Request pause with message |
| `requestResume(message)` | Request resume with message |
| `getAbortSignal()` | Get current abort signal |
| `getIdleDuration()` | Get time since last activity in milliseconds |
| `getRunDuration()` | Get total run duration in milliseconds |
| `runBackgroundTask(task)` | Run a background task with error handling |
| `getAgentConfigSlice<T>(key, schema)` | Get config value with validation |

### AgentManager Service

Central service for managing agent lifecycles and configurations:

```typescript
import AgentManager from "@tokenring-ai/agent/services/AgentManager";

const agentManager = new AgentManager(app);

// Add agent configurations
agentManager.addAgentConfigs({
  agentType: "myAgent",
  displayName: "My Agent",
  description: "Custom development agent",
  category: "development",
  debug: false,
  initialCommands: [],
  headless: false,
  callable: true,
  idleTimeout: 0,
  maxRunTime: 0,
  minimumRunning: 0,
  subAgent: {},
  allowedSubAgents: [],
  enabledHooks: [],
  todos: {},
  createMessage: "Agent Created"
});

// Spawn agents
const agent = await agentManager.spawnAgent({
  agentType: "myAgent",
  headless: false
});

// Spawn from config
const agent = await agentManager.spawnAgentFromConfig(config);

// Spawn sub-agent
const subAgent = await agentManager.spawnSubAgent(parentAgent, "workerAgent", {
  headless: true
});

// Get agents
const agent = agentManager.getAgent(agentId);
const allAgents = agentManager.getAgents();
const agentTypes = agentManager.getAgentTypes();

// Delete agent
await agentManager.deleteAgent(agentId, "Reason for deletion");
```

**Key Methods:**

| Method | Description |
|--------|-------------|
| `addAgentConfigs(...configs)` | Register multiple agent configurations |
| `getAgentConfigEntries()` | Get all agent configuration entries |
| `getAgentConfig(name)` | Get specific agent configuration by name |
| `getAgentTypes()` | Get all available agent types |
| `getAgentTypesLike(pattern)` | Get agent types matching glob pattern |
| `spawnAgent({agentType, headless})` | Create new agent of specified type |
| `spawnSubAgent(agent, agentType, config)` | Create sub-agent with parent |
| `spawnAgentFromConfig(config)` | Create agent from configuration |
| `spawnAgentFromCheckpoint(checkpoint, config)` | Create agent from checkpoint |
| `getAgent(id)` | Get agent by ID, returns `Agent \| null` |
| `getAgents()` | Get all active agents |
| `deleteAgent(agentId, reason)` | Shutdown and remove agent |

**Automatic Lifecycle Management:**

- Idle agent cleanup every 15 seconds
- Configurable `idleTimeout` per agent (default: 0 = no limit, in seconds)
- Configurable `maxRunTime` per agent (default: 0 = no limit, in seconds)
- Configurable `minimumRunning` per agent type (default: 0 = no minimum)

**Automatic Command Registration:**

When an agent config includes the `command` option, the agent is automatically registered as a callable command. See [Agent Command Registration](#agent-command-registration) for details.

### AgentCommandService Service

Service for managing and executing agent commands:

```typescript
import AgentCommandService from "@tokenring-ai/agent/services/AgentCommandService";

const commandService = new AgentCommandService(app);

// Commands are automatically registered via plugin
// Execute commands via agent
await agent.runCommand("/help");
await agent.runCommand("Hello, agent!");

// Add custom commands
commandService.addAgentCommands({
  name: "myCommand",
  description: "My custom command",
  execute: async (input, agent) => {
    return `Processed: ${input}`;
  },
  help: "# /myCommand\n\nMy custom command help text"
});
```

**Command Processing:**

- Automatic slash command parsing
- Default chat command fallback (`/chat send`) for plain text
- Command singular/plural name handling
- Agent mention handling (`@agentName message` converts to `/agent run agentName message`)
- Error handling for unknown commands with suggestions
- Support for command attachments

**Key Methods:**

| Method | Description |
|--------|-------------|
| `addAgentCommands(...commands)` | Register one or more commands |
| `getCommandNames()` | Get all command names |
| `getCommandEntries()` | Get all command entries |
| `getCommand(name)` | Get specific command by name |
| `executeAgentCommand(agent, message, attachments)` | Execute command |

### AgentLifecycleService Service

Service for managing hooks and lifecycle events:

```typescript
import AgentLifecycleService from "@tokenring-ai/agent/services/AgentLifecycleService";

const lifecycleService = new AgentLifecycleService();

// Hooks are automatically registered via plugin
lifecycleService.enableHooks(["myPlugin/afterChatCompletion"], agent);

// Register custom hooks
lifecycleService.addHooks("myPlugin", {
  afterChatCompletion: {
    name: "myPlugin/afterChatCompletion",
    displayName: "My Hook",
    description: "Custom after chat completion hook",
    callbacks: [
      async (data, agent) => {
        console.log("Chat completed:", data);
      }
    ]
  }
});
```

**Hook Management:**

| Method | Description |
|--------|-------------|
| `registerHook(name, config)` | Register individual hook |
| `addHooks(pkgName, hooks)` | Register hooks with package namespacing |
| `getAllHookNames()` | Get all registered hook names |
| `getAllHookEntries()` | Get all registered hook entries |
| `getEnabledHooks(agent)` | Get enabled hooks for agent |
| `setEnabledHooks(hookNames, agent)` | Set enabled hooks |
| `enableHooks(hookNames, agent)` | Enable specific hooks |
| `disableHooks(hookNames, agent)` | Disable hooks |
| `executeHooks(data, agent)` | Execute hooks for lifecycle event |

## Services

### AgentManager

The `AgentManager` service is the central hub for agent lifecycle management. It maintains agent configurations, spawns agents, and handles automatic cleanup based on idle timeout and maximum runtime settings.

**Registration:**

```typescript
const agentManager = new AgentManager(app);
app.addServices(agentManager);
```

### AgentCommandService

The `AgentCommandService` handles command parsing, registration, and execution. It manages the command registry and processes user input through the command system.

**Registration:**

```typescript
const commandService = new AgentCommandService(app);
app.addServices(commandService);
```

### AgentLifecycleService

The `AgentLifecycleService` manages hook registration and execution. It provides the infrastructure for extending agent behavior through lifecycle hooks.

**Registration:**

```typescript
const lifecycleService = new AgentLifecycleService();
app.addServices(lifecycleService);
```

## RPC Endpoints

The agent package provides the following JSON-RPC endpoints for remote agent management:

| Endpoint | Type | Request Params | Response |
|----------|------|----------------|----------|
| `getAgent` | query | `{agentId: string}` | `{id, displayName, description, debugEnabled, config}` |
| `getAgentEvents` | query | `{agentId: string, fromPosition: number}` | `{events: AgentEventEnvelope[], position: number}` |
| `streamAgentEvents` | stream | `{agentId: string, fromPosition: number}` | Async generator yielding `{events, position}` |
| `getAgentExecutionState` | query | `{agentId: string}` | `{idle: boolean, busyWith: string \| null, waitingOn: ParsedQuestionRequest[]}` |
| `streamAgentExecutionState` | stream | `{agentId: string}` | Async generator yielding execution state updates |
| `listAgents` | query | `{}` | `{id, displayName, description, idle, statusMessage}[]` |
| `getAgentTypes` | query | `{}` | `{type, displayName, description, category, callable}[]` |
| `createAgent` | mutation | `{agentType: string, headless: boolean}` | `{id, displayName, description}` |
| `deleteAgent` | mutation | `{agentId: string, reason: string}` | `{success: boolean}` |
| `sendInput` | mutation | `{agentId: string, message: string, attachments?: InputAttachment[]}` | `{requestId: string}` |
| `sendQuestionResponse` | mutation | `{agentId: string, requestId: string, response: any}` | `{success: boolean}` |
| `abortAgent` | mutation | `{agentId: string, message: string}` | `{success: boolean}` |
| `pauseAgent` | mutation | `{agentId: string, message: string}` | `{success: boolean}` |
| `resumeAgent` | mutation | `{agentId: string, message: string}` | `{success: boolean}` |
| `getCommandHistory` | query | `{agentId: string}` | `string[]` |
| `getAvailableCommands` | query | `{agentId: string}` | `string[]` |

## Chat Commands

The agent package includes the following built-in slash commands:

### `/agent` - Agent Management

```bash
/agent types                    # List available agent types
/agent list                     # List running agents
/agent run <type> <message>     # Run an agent with a message
/agent run --bg <type> <msg>    # Run agent in background
/agent shutdown [id]            # Shutdown agent (all or specific)
```

### `/cost` - Cost Tracking

```bash
/cost                           # Display total costs incurred by the agent
```

### `/help` - Help System

```bash
/help                           # Display help for all commands
/help <command>                 # Display help for specific command
```

### `/hooks` - Hook Management

```bash
/hooks list                     # List registered hooks
/hooks enable <hook-name>       # Enable hooks
/hooks disable <hook-name>      # Disable hooks
/hooks get                      # Get currently enabled hooks
/hooks set <hook1> [hook2...]   # Set enabled hooks (replaces current)
/hooks select                   # Select hooks interactively
/hooks reset                    # Reset hook configuration to initial state
```

### `/settings` - Settings Display

```bash
/settings                       # Display agent settings and state
```

### `/work` - Work Handler

```bash
/work <task>                    # Execute work handler with task
```

### `/debug` - Debug Commands

```bash
/debug logging on|off           # Enable or disable debug logging
/debug markdown                 # Output a markdown sample for testing
/debug services [limit]         # Display service logs (default: last 50)
/debug questions <type>         # Test human interface request types
/debug chat throwError          # Throw an error to test error handling
/debug app shutdown             # Send shutdown command to app
```

**Debug Questions Types:**

- `text` - Test text input
- `confirm` - Test approval dialog
- `tree` - Test tree selection
- `file` - Test file selection
- `form` - Test multi-section form

### Agent Mention Syntax

You can also invoke agents using the `@` mention syntax:

```
@researcher artificial intelligence
```

This is equivalent to:

```
/agent run researcher artificial intelligence
```

## Configuration

### AgentConfig Schema

```typescript
import {AgentConfigSchema} from "@tokenring-ai/agent/schema";

// AgentConfig is the input type (z.input<typeof AgentConfigSchema>)
// ParsedAgentConfig is the output type (z.output<typeof AgentConfigSchema>)

const agentConfig = {
  agentType: string,               // Agent type identifier (required)
  displayName: string,             // Agent display name (required)
  description: string,             // Agent purpose (required)
  category: string,                // Agent category (required)
  debug: boolean,                  // Enable debug logging (default: false)
  workHandler: Function,           // Custom work handler (optional)
  initialCommands: string[],       // Startup commands (default: [])
  createMessage: string,           // Message displayed when agent is created (default: "Agent Created")
  headless: boolean,               // Headless mode (default: false)
  callable: boolean,               // Enable tool calls (default: true)
  command: {                       // Register this agent as a callable command (optional)
    name?: string,                 // Custom command name (defaults to agentType)
    description?: string,          // Custom command description (defaults to agent description)
    help?: string,                 // Custom help text for the command
    background?: boolean,          // Run in background mode (default: false)
    forwardChatOutput?: boolean,   // Forward chat output (default: true)
    forwardSystemOutput?: boolean, // Forward system output (default: true)
    forwardHumanRequests?: boolean,// Forward human requests (default: true)
    forwardReasoning?: boolean,    // Forward reasoning (default: false)
    forwardInputCommands?: boolean,// Forward input commands (default: true)
    forwardArtifacts?: boolean,    // Forward artifacts (default: false)
  },
  minimumRunning: number,          // Minimum running agents of this type (default: 0)
  idleTimeout: number,             // Idle timeout in seconds (default: 0 = no limit)
  maxRunTime: number,              // Max runtime in seconds (default: 0 = no limit)
  subAgent: {                      // Sub-agent configuration
    forwardChatOutput?: boolean,   // Forward chat output (default: false)
    forwardStatusMessages?: boolean,// Forward status messages (default: true)
    forwardSystemOutput?: boolean, // Forward system output (default: false)
    forwardHumanRequests?: boolean,// Forward human requests (default: true)
    forwardReasoning?: boolean,    // Forward reasoning (default: false)
    forwardInputCommands?: boolean,// Forward input commands (default: true)
    forwardArtifacts?: boolean,    // Forward artifacts (default: false)
    timeout?: number,              // Sub-agent timeout in seconds (default: 0)
    maxResponseLength?: number,    // Max response length in characters (default: 10000)
    minContextLength?: number,     // Minimum context length in characters (default: 1000)
  },
  allowedSubAgents: string[],      // Allowed sub-agent types (default: [])
  enabledHooks: string[],          // Enabled hook names (default: [])
  todos: {                         // Todo list configuration
    copyToChild: boolean,          // Copy todos to child agents (default: true)
    initialItems: Array<{          // Initial todo items (default: [])
      id: string,
      content: string,
      status: "pending" | "in_progress" | "completed"
    }>
  }
};
```

### AgentPackageConfig Schema

```typescript
import {AgentPackageConfigSchema} from "@tokenring-ai/agent/schema";

// Allows defining multiple agent configurations in app config
const config = {
  agents: {
    app: [
      {
        agentType: "teamLeader",
        displayName: "Team Leader",
        description: "Coordinates development tasks",
        category: "development",
        // ... other config
      }
    ],
    user: [
      {
        agentType: "researcher",
        displayName: "Researcher",
        description: "Researches topics",
        category: "research",
        // ... other config
      }
    ]
  }
};
```

## Usage Examples

### Basic Agent Creation and Usage

```typescript
import Agent from "@tokenring-ai/agent";
import AgentManager from "@tokenring-ai/agent/services/AgentManager";
import TokenRingApp from "@tokenring-ai/app";
import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";

const app = new TokenRingApp();

// Create agent manager and add configurations
const agentManager = new AgentManager(app);
agentManager.addAgentConfigs({
  agentType: "myAgent",
  displayName: "My Agent",
  description: "Custom development agent",
  category: "development",
  debug: false,
  initialCommands: [],
  headless: false,
  callable: true,
  idleTimeout: 0,
  maxRunTime: 0,
  minimumRunning: 0,
  subAgent: {},
  allowedSubAgents: [],
  enabledHooks: [],
  todos: {},
  createMessage: "Agent Created"
});

// Spawn agent
const agent = await agentManager.spawnAgent({
  agentType: "myAgent",
  headless: false
});

// Handle user input
const requestId = agent.handleInput({ message: "Hello! How can you help me?" });

// Listen to events
for await (const state of agent.subscribeStateAsync(AgentEventState, agent.agentShutdownSignal)) {
  for (const event of state.events) {
    console.log("Event:", event.type, event);
  }
}
```

### Agent Command Registration

Agents can be automatically registered as callable commands, allowing users to invoke them directly using a simple slash command syntax. This provides a more intuitive interface than using `/agent run <type> <message>`.

```typescript
// Register agent as a command
agentManager.addAgentConfigs({
  agentType: "researcher",
  displayName: "Researcher Agent",
  description: "Researches topics and provides summaries",
  category: "research",
  command: {
    enabled: true,                    // Enable command registration (default: true when command is provided)
    name: "research",                 // Custom command name (defaults to agentType)
    description: "Research a topic",  // Custom description (defaults to agent description)
    help: `# /research

## Description
Research a topic and provide a comprehensive summary.

## Usage
/research <topic>

## Examples
/research artificial intelligence
/research quantum computing`,        // Custom help text
    background: false,                // Run in background (default: false)
    forwardChatOutput: true,          // Forward chat output (default: true)
    forwardSystemOutput: true,        // Forward system output (default: true)
    forwardHumanRequests: true,       // Forward human requests (default: true)
    forwardReasoning: false,          // Forward reasoning (default: false)
    forwardInputCommands: true,       // Forward input commands (default: true)
    forwardArtifacts: false,          // Forward artifacts (default: false)
  },
  // ... other config options
});

// Now users can invoke the agent with:
// /research artificial intelligence
// Instead of:
// /agent run researcher artificial intelligence
```

**Command Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | agentType | Custom command name |
| `description` | `string` | agent description | Command description shown in help |
| `help` | `string` | - | Custom help text for the command (markdown supported) |
| `background` | `boolean` | false | Run the agent in background mode |
| `forwardChatOutput` | `boolean` | true | Forward chat output to parent |
| `forwardSystemOutput` | `boolean` | true | Forward system output to parent |
| `forwardHumanRequests` | `boolean` | true | Forward human input requests to parent |
| `forwardReasoning` | `boolean` | false | Forward reasoning output to parent |
| `forwardInputCommands` | `boolean` | true | Forward input commands to parent |
| `forwardArtifacts` | `boolean` | false | Forward artifacts to parent |

**Simple Example:**

```typescript
// Minimal configuration - uses defaults
agentManager.addAgentConfigs({
  agentType: "translator",
  displayName: "Translator",
  description: "Translates text between languages",
  category: "utility",
  command: {},  // Just enable with defaults
  // ... other config
});

// Users can now use:
// /translator Hello, how are you?
```

### State Management and Checkpointing

```typescript
import {AgentEventState} from "@tokenring-ai/agent/state/agentEventState";
import {CommandHistoryState} from "@tokenring-ai/agent/state/commandHistoryState";
import {CostTrackingState} from "@tokenring-ai/agent/state/costTrackingState";
import {TodoState} from "@tokenring-ai/agent/state/todoState";
import {SubAgentState} from "@tokenring-ai/agent/state/subAgentState";
import {HooksState} from "@tokenring-ai/agent/state/hooksState";

// State slices are automatically initialized by Agent
// Access them via getState/mutateState:

// Get event state
const eventState = agent.getState(AgentEventState);
console.log("Events:", eventState.events);

// Modify command history
agent.mutateState(CommandHistoryState, (state) => {
  state.commands.push("new command");
});

// Add cost tracking
agent.addCost("api_calls", 1);
agent.addCost("tokens", 1500);

// View todo state
const todoState = agent.getState(TodoState);
console.log("Todos:", todoState.todos);

// Create checkpoint
const checkpoint = agent.generateCheckpoint();
console.log("Checkpoint:", checkpoint);

// Restore from checkpoint (via AgentManager)
const restoredAgent = await agentManager.spawnAgentFromCheckpoint(checkpoint, {});
```

### Sub-Agent Creation

```typescript
// Create sub-agent from parent
const subAgent = await agentManager.spawnSubAgent(agent, "backgroundWorker", {
  headless: true
});

// Send message to sub-agent
await subAgent.handleInput({ message: "Process this data" });

// Sub-agent state is automatically copied from parent (if configured)
await agentManager.deleteAgent(subAgent.id, "Cleanup");
```

### Advanced Sub-Agent Execution

```typescript
import {runSubAgent} from "@tokenring-ai/agent/runSubAgent";

// Run sub-agent with custom options
const result = await runSubAgent({
  agentType: "code-assistant",
  headless: true,
  input: {
    message: "/work Analyze this code: function test() { return true; }"
  },
  background: false,
  forwardChatOutput: true,
  forwardSystemOutput: true,
  forwardReasoning: false,
  forwardHumanRequests: true,
  forwardInputCommands: true,
  forwardArtifacts: false,
  timeout: 60,
  maxResponseLength: 500,
  minContextLength: 300
}, agent, true);

console.log("Result:", result.status, result.response);
```

**RunSubAgent Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentType` | `string` | - | The type of agent to create |
| `headless` | `boolean` | - | Whether to run in headless mode |
| `input` | `BareInputReceivedMessage` | - | The command to send to the agent |
| `background` | `boolean` | false | Run in background and return immediately |
| `forwardChatOutput` | `boolean` | true | Forward chat output to parent |
| `forwardSystemOutput` | `boolean` | true | Forward system output to parent |
| `forwardHumanRequests` | `boolean` | true | Forward human requests to parent |
| `forwardReasoning` | `boolean` | false | Forward reasoning output to parent |
| `forwardInputCommands` | `boolean` | true | Forward input commands to parent |
| `forwardArtifacts` | `boolean` | false | Forward artifacts to parent |
| `timeout` | `number` | 0 | Sub-agent timeout in seconds |
| `maxResponseLength` | `number` | 10000 | Max response length in characters |
| `minContextLength` | `number` | 1000 | Minimum context length in characters |
| `disablePermissionCheck` | `boolean` | false | Disable sub-agent permission checks |

**RunSubAgent Result:**

```typescript
interface RunSubAgentResult {
  status: "success" | "error" | "cancelled";
  response: string;
  childAgent?: Agent; // Only if autoCleanup is false
}
```

### Tool Execution

The agent package provides several built-in tools:

**runAgent Tool:**

```typescript
// Built-in tool: runAgent
const result = await agent.runAgent({
  agentType: "dataProcessor",
  message: "Analyze this dataset",
  context: "File: data.csv\nColumns: name,age,income"
});

console.log("Tool result:", result);
```

**todo Tool:**

```typescript
// Update todo list
const result = await agent.todo({
  todos: [
    {
      id: "task-1",
      content: "Analyze codebase",
      status: "in_progress"
    },
    {
      id: "task-2",
      content: "Write tests",
      status: "pending"
    }
  ]
});

console.log("Todo result:", result);
```

**getCurrentDatetime Tool:**

```typescript
// Get current date/time
const result = await agent.getCurrentDatetime({});

console.log("Current datetime:", result);
```

### Hook System

```typescript
import AgentLifecycleService from "@tokenring-ai/agent/services/AgentLifecycleService";

const lifecycleService = new AgentLifecycleService();

// Register hook
lifecycleService.addHooks("myPlugin", {
  afterChatCompletion: {
    name: "myPlugin/afterChatCompletion",
    displayName: "My Hook",
    description: "Custom after chat completion hook",
    callbacks: [
      async (data, agent) => {
        console.log("Chat completed:", data);
      }
    ]
  }
});

// Enable hook for agent
lifecycleService.enableHooks(["myPlugin/afterChatCompletion"], agent);

// Hooks automatically execute on lifecycle events
```

### Human Interface Requests

```typescript
// Simple approval (Yes/No)
const approved = await agent.askForApproval({
  message: "Are you sure you want to proceed?",
  label: "Approve?",
  default: false,
  timeout: 30
});

// Text input
const text = await agent.askForText({
  message: "Enter your name:",
  label: "Name",
  masked: false
});

// Single tree selection
const selection = await agent.askQuestion({
  message: "Choose an option",
  question: {
    type: 'treeSelect',
    label: 'Select',
    minimumSelections: 1,
    maximumSelections: 1,
    defaultValue: [],
    tree: [
      {
        name: "Option 1",
        value: "opt1"
      },
      {
        name: "Option 2",
        value: "opt2"
      }
    ]
  }
});

// Complex form
const formData = await agent.askQuestion({
  message: "Fill out the contact form",
  question: {
    type: 'form',
    sections: [
      {
        name: "personal",
        description: "Personal Information",
        fields: {
          name: {
            type: 'text',
            label: 'Full Name',
            defaultValue: ''
          },
          email: {
            type: 'text',
            label: 'Email',
            defaultValue: ''
          }
        }
      },
      {
        name: "preferences",
        description: "Preferences",
        fields: {
          category: {
            type: 'treeSelect',
            label: 'Category',
            defaultValue: [],
            tree: [
              {
                name: "Support",
                value: "support"
              },
              {
                name: "Sales",
                value: "sales"
              }
            ]
          }
        }
      }
    ]
  }
});

// Handle human response
agent.sendQuestionResponse(requestId, { result: selection });
```

### Output Artifacts

```typescript
// Emit an artifact (e.g., markdown file)
agent.artifactOutput({
  name: "report.md",
  encoding: "text",
  mimeType: "text/markdown",
  body: `# Report

Generated content...`
});

// Emit binary artifact
agent.artifactOutput({
  name: "image.png",
  encoding: "base64",
  mimeType: "image/png",
  body: "base64_encoded_data..."
});
```

### Cost Tracking

```typescript
// Add cost tracking
agent.addCost("api_calls", 1);
agent.addCost("tokens", 1500);

// View cost information
await agent.runCommand("/cost");
```

### Status Line Management

```typescript
// Set busy status
agent.setBusyWith("Processing request...");

// Set status line
agent.updateStatus("Ready for input");

// Clear status indicators
agent.setBusyWith(null);
```

## Integration

### TokenRing Plugin Integration

The agent package automatically integrates with TokenRing applications:

```typescript
// Automatic registration via plugin
const app = new TokenRingApp();

// Agents configured in app config
const config = {
  agents: {
    app: [
      {
        agentType: "myAgent",
        displayName: "My Agent",
        description: "Custom agent",
        category: "development",
        debug: false,
        initialCommands: [],
        headless: false,
        callable: true,
        idleTimeout: 0,
        maxRunTime: 0,
        minimumRunning: 0,
        subAgent: {},
        allowedSubAgents: [],
        enabledHooks: [],
        todos: {},
        createMessage: "Agent Created"
      }
    ]
  }
};
```

### Tools

The agent package includes built-in tools:

- `runAgent` - Execute sub-agent
- `todo` - Todo list management
- `getCurrentDatetime` - Get current date/time

### Context Handlers

- `available-agents` - Provides list of available agent types
- `todo-list` - Provides todo list context

## State Management

### State Slices

Agents support multiple state slices for different concerns:

**Built-in State Slices:**

| State Slice | Description |
|-------------|-------------|
| `AgentEventState` | Event history and current state |
| `CommandHistoryState` | Command execution history |
| `CostTrackingState` | Resource usage tracking |
| `HooksState` | Hook configuration and enabled hooks |
| `TodoState` | Task list management |
| `SubAgentState` | Sub-agent configuration |

**AgentEventState:**

- `events`: Array of AgentEventEnvelope
- `getEventCursorFromCurrentPosition()`: Get event cursor
- `yieldEventsByCursor(cursor)`: Yield events by cursor
- `idle`: Computed property (inputQueue.length === 0)

**AgentExecutionState:**

- `busyWith`: String or null
- `statusLine`: String or null
- `waitingOn`: Array of ParsedQuestionRequest
- `inputQueue`: Array of InputReceived
- `currentlyExecuting`: Currently executing operation or null
- `running`: Boolean

**CommandHistoryState:**

- `commands`: Array of command strings

**CostTrackingState:**

- `costs`: Record of cost categories and amounts

**HooksState:**

- `enabledHooks`: Array of enabled hook names

**TodoState:**

- `todos`: Array of TodoItem
- `transferStateFromParent(parentAgent)`: Copy todos from parent

**SubAgentState:**

- `allowedSubAgents`: Array of allowed sub-agent types

**Custom State Slices:**

```typescript
import {AgentStateSlice} from "@tokenring-ai/agent/types";
import {z} from "zod";

const serializationSchema = z.object({
  data: z.array(z.string()).default([])
});

class CustomState implements AgentStateSlice<typeof serializationSchema> {
  readonly name = "CustomState";
  serializationSchema = serializationSchema;
  data: string[] = [];

  reset(what: ResetWhat[]) {
    if (what.includes("chat")) {
      this.data = [];
    }
  }

  show(): string[] {
    return [`Data items: ${this.data.length}`];
  }

  serialize() {
    return { data: this.data };
  }

  deserialize(obj: any) {
    this.data = obj.data || [];
  }
}
```

### Checkpointing

```typescript
// Generate checkpoint
const checkpoint = agent.generateCheckpoint();

// Restore from checkpoint
const restoredAgent = await agentManager.spawnAgentFromCheckpoint(checkpoint, {});
```

### ResetWhat Types

The reset operation supports multiple target types:

```typescript
// ResetWhat is z.enum(["context", "chat", "history", "settings", "memory", "costs"])
```

## Event System

### Event Types

**Input Events:**

- `input.received` - Input received from user
- `input.handled` - Input processing completed (status: success, error, or cancelled)

**Output Events:**

- `output.chat` - Chat output
- `output.reasoning` - Reasoning output
- `output.info` - Informational messages
- `output.warning` - Warning messages
- `output.error` - Error messages
- `output.artifact` - Output artifact (files, documents, etc.)

**State Events:**

- `agent.execution` - Agent execution state update
- `agent.created` - Agent was created
- `agent.stopped` - Agent was stopped

**Control Events:**

- `abort` - Operation aborted
- `pause` - Agent paused
- `resume` - Agent resumed
- `status` - Status update

**Question Events:**

- `question.request` - Human input requested
- `question.response` - Human response provided

### Event Schema

All events follow this structure:

```typescript
{
  type: EventType,
  timestamp: number,
  // Event-specific fields
}
```

## Human Interface Types

### Question Types

The agent supports several question types for human interaction:

**Text Question:**

```typescript
{
  type: 'text',
  label: 'Name',
  description: 'Enter your name',
  required: false,
  defaultValue: '',
  expectedLines: 1,
  masked: false,
  autoSubmitAfter: number
}
```

**Tree Select Question:**

```typescript
{
  type: "treeSelect",
  label: 'Choose an option',
  minimumSelections: 1,
  maximumSelections: 1,
  defaultValue: [],
  allowFreeform: false,
  tree: [
    {
      name: "Option 1",
      value: "opt1",
      children: [...]
    }
  ]
}
```

**File Select Question:**

```typescript
{
  type: 'fileSelect',
  allowFiles: true,
  allowDirectories: true,
  label: 'Select files',
  description: 'Choose files or folders',
  minimumSelections: 1,
  maximumSelections: 5,
  defaultValue: []
}
```

**Form Question:**

```typescript
{
  type: 'form',
  sections: [
    {
      name: "personal",
      description: "Personal Information",
      fields: {
        name: { type: 'text', label: 'Full Name', defaultValue: '' },
        email: { type: 'text', label: 'Email', defaultValue: '' }
      }
    }
  ]
}
```

### Tree Leaf Structure

```typescript
{
  name: string,
  value?: string,
  children?: Array<TreeLeaf>
}
```

## Error Handling

### CommandFailedError

The agent package throws `CommandFailedError` when command execution fails:

```typescript
import {CommandFailedError} from "@tokenring-ai/agent/AgentError";

try {
  await agent.runCommand("/unknown-command");
} catch (error) {
  if (error instanceof CommandFailedError) {
    console.log("Command failed:", error.message);
  }
}
```

## Best Practices

### Agent Configuration

1. **Set appropriate timeouts**: Configure `idleTimeout` and `maxRunTime` based on agent use case
2. **Use minimumRunning for critical agents**: Maintain minimum running agents for frequently used types
3. **Register agents as commands**: Use the `command` config for intuitive agent invocation
4. **Enable hooks selectively**: Only enable hooks that are needed for specific functionality

### State Management

1. **Use state slices**: Keep different concerns in separate state slices
2. **Implement checkpointing**: Regularly generate checkpoints for long-running agents
3. **Subscribe to state changes**: Use `subscribeState` for reactive updates

### Error Handling

1. **Catch CommandFailedError**: Handle command execution errors gracefully
2. **Use abort signals**: Respect abort signals for cancellation
3. **Provide meaningful error messages**: Include context in error messages

## Testing and Development

### Testing

```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Plugin Development

Create custom plugins for agent functionality:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";

const myAgentPlugin: TokenRingPlugin = {
  name: "my-plugin",
  install(app, config) {
    // Register custom commands
    // Register custom tools
    // Register custom hooks
    // Register custom state slices
  },
  config: myConfigSchema // Optional
};
```

## Dependencies

- `@tokenring-ai/chat` - Chat service integration
- `@tokenring-ai/utility` - Shared utilities
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/rpc` - RPC service integration
- `eventemitter3` - Event emission
- `glob-gitignore` - Gitignore pattern matching
- `uuid` - UUID generation
- `zod` - Schema validation

## Related Components

- [@tokenring-ai/chat](/plugins/chat.md) - Chat service integration
- [@tokenring-ai/app](/plugins/app.md) - Base application framework
- [@tokenring-ai/rpc](/plugins/rpc.md) - RPC service
- [@tokenring-ai/utility](/plugins/utility.md) - Shared utilities

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
