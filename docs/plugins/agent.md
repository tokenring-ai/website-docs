# @tokenring-ai/agent

## Overview

The `@tokenring-ai/agent` package provides the core agent orchestration system for the Token Ring ecosystem. It enables creation and management of AI agents with comprehensive state management, event handling, command execution, tool integration, and lifecycle management. This package serves as the foundation for the 50+ package Token Ring ecosystem.

The agent package integrates seamlessly with the TokenRing agent framework, providing both tool-based interactions and command-based execution for programmatic agent management. It leverages an event-driven architecture with streaming capabilities and supports human interaction requests with multiple question types.

## Key Features

- **Agent Management**: Create, spawn, and manage individual AI agents with configurable lifecycles
- **State Management**: Persistent state with serialization, checkpointing, and restoration
- **Event System**: Comprehensive event handling with streaming capabilities
- **Command System**: Slash command interface with extensible commands and automatic command registration
- **Agent Command Registration**: Register agents as callable commands for easy invocation
- **Tool Integration**: Tool execution with context and parameter validation
- **Human Interface**: Request/response system for human interaction with multiple question types
- **Sub-Agent Support**: Create and manage child agents with configurable output forwarding
- **RPC Integration**: JSON-RPC endpoints for remote agent management
- **Plugin Integration**: Automatic integration with TokenRing applications
- **Idle/Max Runtime Management**: Automatic cleanup of idle or long-running agents
- **Minimum Agent Count**: Maintain minimum number of agents per type
- **Todo Management**: Built-in todo list with sub-agent state transfer
- **Abort Handling**: Graceful abort handling with cleanup

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
  todos: {},
  createMessage: "Agent Created"
};

const shutdownController = new AbortController();
const agent = new Agent(app, {}, config, shutdownController.signal);
```

**Key Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique agent identifier (human-readable ID) |
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
| `subscribeStateAsync<T>(ClassType)` | Subscribe asynchronously with async iterator |
| `generateCheckpoint()` | Create state checkpoint for restoration |
| `restoreState(state)` | Restore from checkpoint state |

**Input Processing:**

| Method | Description |
|--------|-------------|
| `handleInput({message, attachments})` | Process user input with event emission, returns requestId |
| `runCommand(command)` | Execute agent commands |
| `busyWithActivity<T>(message, awaitable)` | Execute with busy state indicator |
| `setCurrentActivity(message)` | Set current activity indicator |
| `getAbortSignal()` | Get current abort signal (when executing) |

**Event Emission:**

| Method | Description |
|--------|-------------|
| `chatOutput(message)` | Emit chat output event |
| `reasoningOutput(message)` | Emit reasoning output event |
| `infoMessage(...messages)` | Emit informational messages |
| `warningMessage(...messages)` | Emit warning messages |
| `errorMessage(...messages)` | Emit error messages |
| `artifactOutput({name, encoding, mimeType, body})` | Emit output artifact |

**Human Interface:**

| Method | Description |
|--------|-------------|
| `askForApproval({message, label, default, autoSubmitAfter})` | Request approval (Yes/No), returns `Promise<boolean \| null>` |
| `askForText({message, label, masked})` | Request text input, returns `Promise<string \| null>` |
| `askQuestion<T>(question)` | Request human input with various question types |
| `sendInteractionResponse(response)` | Send human response to interaction |
| `waitForInteraction(interaction)` | Wait for user interaction |

**Lifecycle Management:**

| Method | Description |
|--------|-------------|
| `abortCurrentOperation(reason)` | Abort current operation with reason |
| `getIdleDuration()` | Get time since last activity in milliseconds |
| `getRunDuration()` | Get total run duration in milliseconds |
| `runBackgroundTask(task)` | Run a background task with error handling |
| `getAgentConfigSlice<T>(key, schema)` | Get config value with validation |

**Checkpoint Creation:**

```typescript
const checkpoint = agent.generateCheckpoint();
// Returns: { agentId, createdAt, sessionId, agentType, state }
```

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
  inputSchema: {
    remainder: {
      name: "message",
      description: "Message to process",
      required: true,
    }
  },
  execute: async ({remainder, agent}) => {
    return `Processed: ${remainder}`;
  },
  help: "# /myCommand\\n\\nMy custom command help text"
});
```

**Command Processing:**

- Automatic slash command parsing
- Default chat command fallback (`/chat send`) for plain text
- Command singular/plural name handling
- Agent mention handling (`@agentName message` converts to `/agent run agentName message`)
- Error handling for unknown commands with suggestions
- Support for command attachments
- Hook integration for before/after command execution

**Key Methods:**

| Method | Description |
|--------|-------------|
| `addAgentCommands(...commands)` | Register one or more commands |
| `getCommandNames()` | Get all command names |
| `getCommandEntries()` | Get all command entries |
| `getCommand(name)` | Get specific command by name |
| `executeAgentCommand(agent, message, attachments)` | Execute command |

**Command Input Schema:**

Commands use `AgentCommandInputSchema` which supports:
- `args` - Named arguments with flags and strings
- `positionals` - Positional arguments
- `remainder` - Remaining text after parsed arguments

Example input schema:
```typescript
const inputSchema = {
  args: {
    "--bg": {
      type: "flag",
      description: "Run in background",
    },
    "--type": {
      type: "string",
      description: "Agent type",
      required: true,
    },
  },
  remainder: {
    name: "message",
    description: "Message to process",
    required: true,
  }
} as const satisfies AgentCommandInputSchema;
```

## Services

### AgentManager

The `AgentManager` service is the central hub for agent lifecycle management. It maintains agent configurations, spawns agents, and handles automatic cleanup based on idle timeout and maximum runtime settings.

**Registration:**

```typescript
const agentManager = new AgentManager(app);
app.addServices(agentManager);
```

**Key Features:**

- Agent configuration management via `KeyedRegistry`
- Automatic agent spawning from configurations
- Sub-agent creation with state transfer
- Idle agent cleanup (checks every 15 seconds)
- Maximum runtime enforcement
- Minimum agent count maintenance
- Checkpoint-based agent restoration
- Automatic command registration for agents with `command` config

**Agent Lifecycle Management:**

```typescript
// Add agent configurations
agentManager.addAgentConfigs({
  agentType: "myAgent",
  displayName: "My Agent",
  description: "Custom development agent",
  category: "development",
  idleTimeout: 300,        // 5 minutes idle timeout
  maxRunTime: 3600,        // 1 hour max runtime
  minimumRunning: 2,       // Keep 2 agents running
  // ... other config
});

// Spawn agents
const agent = await agentManager.spawnAgent({
  agentType: "myAgent",
  headless: false
});

// Get agents
const allAgents = agentManager.getAgents();
const agentTypes = agentManager.getAgentTypes();
const matchingTypes = agentManager.getAgentTypesLike("worker*");

// Delete agent
await agentManager.deleteAgent(agentId, "Reason for deletion");
```

### AgentCommandService

The `AgentCommandService` handles command parsing, registration, and execution. It manages the command registry and processes user input through the command system.

**Registration:**

```typescript
const commandService = new AgentCommandService(app);
app.addServices(commandService);
```

**Key Features:**

- Slash command parsing and routing
- Command registry with prefix matching
- Default command fallback (`/chat send`)
- Agent mention handling (`@agentName message`)
- Help command generation
- Hook integration for lifecycle events
- Error handling with suggestions

**Command Execution Flow:**

1. Input is parsed to extract command name and arguments
2. Command registry is searched for matching command
3. Command is executed with parsed arguments
4. Lifecycle hooks are executed (before/after)
5. Response is returned or error is thrown

### SubAgentService

The `SubAgentService` manages sub-agent execution with configurable output forwarding and permission controls.

**Registration:**

```typescript
const subAgentService = new SubAgentService(app);
app.addServices(subAgentService);
```

**Key Features:**

- Sub-agent permission management with wildcard pattern matching
- Configurable output forwarding (chat, reasoning, system, artifacts)
- Parent agent abort propagation to sub-agents
- Timeout enforcement for sub-agent execution
- Automatic cleanup of completed sub-agents
- Human request forwarding with mirrored interactions

**Sub-Agent Configuration:**

```typescript
const subAgentConfig = {
  allowedSubAgents: ["worker*", "researcher"],  // Wildcard patterns
  forwardChatOutput: true,
  forwardSystemOutput: true,
  forwardHumanRequests: true,
  forwardReasoning: false,
  forwardInputCommands: true,
  forwardArtifacts: false,
  timeout: 300,              // 5 minutes timeout
  maxResponseLength: 10000,  // Max response length
  minContextLength: 1000,    // Min context length
};
```

**Running Sub-Agents:**

```typescript
import SubAgentService from "@tokenring-ai/agent/services/SubAgentService";

const subAgentService = agent.requireServiceByType(SubAgentService);

// Run sub-agent with forwarding options
const result = await subAgentService.runSubAgent({
  agentType: "worker",
  headless: true,
  input: {
    from: "parent",
    message: "/work Process this data"
  },
  parentAgent: agent,
  options: {
    forwardChatOutput: true,
    forwardSystemOutput: true,
    forwardHumanRequests: true,
    forwardReasoning: false,
    forwardInputCommands: true,
    forwardArtifacts: false,
    timeout: 60,
    maxResponseLength: 500,
    minContextLength: 300
  },
  autoCleanup: true,
  checkPermissions: true,
});

console.log(result.status, result.response);
```

**RunSubAgentResult:**

```typescript
interface RunSubAgentResult {
  status: "success" | "error" | "cancelled";
  response: string;
  childAgent?: Agent; // Only if autoCleanup is false
}
```

## RPC Endpoints

The agent package provides the following JSON-RPC endpoints for remote agent management:

| Endpoint | Type | Request Params | Response |
|----------|------|----------------|----------|
| `getAgent` | query | `{agentId: string}` | `{id, displayName, description, debugEnabled, config}` |
| `getAgentEvents` | query | `{agentId: string, fromPosition: number}` | `{events: AgentEventEnvelope[], position: number}` |
| `streamAgentEvents` | stream | `{agentId: string, fromPosition: number}` | Async generator yielding `{events, position}` |
| `listAgents` | query | `{}` | `{id, displayName, description, idle, currentActivity}[]` |
| `getAgentTypes` | query | `{}` | `{type, displayName, description, category, callable}[]` |
| `createAgent` | mutation | `{agentType: string, headless: boolean}` | `{id, displayName, description}` |
| `deleteAgent` | mutation | `{agentId: string, reason: string}` | `{success: boolean}` |
| `sendInput` | mutation | `{agentId: string, input: {from: string, message: string, attachments?: InputAttachment[]}}` | `{requestId: string}` |
| `sendInteractionResponse` | mutation | `{agentId: string, response: {requestId: string, interactionId: string, result: any}}` | `{success: boolean}` |
| `abortCurrentOperation` | mutation | `{agentId: string, message: string}` | `{success: boolean}` |
| `getCommandHistory` | query | `{agentId: string}` | `string[]` |
| `getAvailableCommands` | query | `{agentId: string}` | `string[]` |
| `getAvailableSubAgents` | query | `{agentId: string}` | `{agents: {type, displayName, description, category}[]}` |
| `getEnabledSubAgents` | query | `{agentId: string}` | `{agents: string[]}` |
| `enableSubAgents` | mutation | `{agentId: string, agents: string[]}` | `{success: boolean}` |
| `disableSubAgents` | mutation | `{agentId: string, agents: string[]}` | `{success: boolean}` |

**RPC Endpoint Details:**

### Query Endpoints

#### `getAgent`

Retrieves detailed information about a specific agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getAgent",
  "params": {
    "agentId": "agent-123"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "agent-123",
    "displayName": "My Agent",
    "description": "Custom development agent",
    "debugEnabled": false,
    "config": {
      "agentType": "myAgent",
      "category": "development",
      // ... other config (excluding workHandler)
    }
  }
}
```

#### `getAgentEvents`

Retrieves events from a specific position in the agent's event history.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getAgentEvents",
  "params": {
    "agentId": "agent-123",
    "fromPosition": 0
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "events": [...],
    "position": 100
  }
}
```

### Streaming Endpoints

#### `streamAgentEvents`

Streams events from a specific position in the agent's event history.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "streamAgentEvents",
  "params": {
    "agentId": "agent-123",
    "fromPosition": 0
  }
}
```

**Response (streaming):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "events": [...],
    "position": 100
  }
}
```

### Mutation Endpoints

#### `createAgent`

Creates a new agent of the specified type.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "createAgent",
  "params": {
    "agentType": "myAgent",
    "headless": false
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "agent-456",
    "displayName": "My Agent",
    "description": "Custom development agent"
  }
}
```

#### `deleteAgent`

Shuts down and removes an agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "deleteAgent",
  "params": {
    "agentId": "agent-123",
    "reason": "Task completed"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true
  }
}
```

#### `sendInput`

Sends input to an agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sendInput",
  "params": {
    "agentId": "agent-123",
    "input": {
      "from": "user",
      "message": "Hello, agent!",
      "attachments": []
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "requestId": "req-789"
  }
}
```

#### `sendInteractionResponse`

Sends a response to a human interaction request.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sendInteractionResponse",
  "params": {
    "agentId": "agent-123",
    "response": {
      "requestId": "req-789",
      "interactionId": "interaction-456",
      "result": "Approved"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true
  }
}
```

#### `abortCurrentOperation`

Aborts the current operation of an agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "abortCurrentOperation",
  "params": {
    "agentId": "agent-123",
    "message": "User cancelled operation"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true
  }
}
```

#### `enableSubAgents`

Enables sub-agent types for an agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "enableSubAgents",
  "params": {
    "agentId": "agent-123",
    "agents": ["worker", "researcher"]
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true
  }
}
```

#### `disableSubAgents`

Disables sub-agent types for an agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "disableSubAgents",
  "params": {
    "agentId": "agent-123",
    "agents": ["worker"]
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true
  }
}
```

## Chat Commands

The agent package includes the following built-in slash commands:

### `/agent` - Agent Management

**List Agent Types:**

```bash
/agent types
```

Lists all available agent types with their descriptions.

**List Running Agents:**

```bash
/agent list
```

Lists all currently running agents with their IDs and descriptions.

**Run an Agent:**

```bash
/agent run --type <agentType> <message>
/agent run --bg --type <agentType> <message>
```

Runs an agent of the specified type with the given message.

**Examples:**

```bash
/agent run --type leader analyze the codebase
/agent run --bg --type researcher find information about AI
```

**Shutdown Agent:**

```bash
/agent shutdown [agentId]
```

Shuts down the current agent, or the agent with the given ID.

**Examples:**

```bash
/agent shutdown
/agent shutdown agent-123
```

### `/help` - Help System

```bash
/help [command]
```

Displays detailed help information for all available commands or a specific command.

**Examples:**

```bash
/help                   # Show help for all commands
/help multi            # Show help for multi command (if implemented)
```

### `/settings` - Settings Display

```bash
/settings
```

Displays agent settings and state information.

### `/work` - Work Handler

```bash
/work <task>
```

Invokes the work handler for the agent, with the message corresponding to the work which needs to be completed.

**Examples:**

```bash
/work Write a blog post about AI safety
/work Analyze the latest market trends
/work Create a new user account
```

**Notes:**

- If the agent has a custom `workHandler` configured, it will be used
- Otherwise, the default `AgentCommandService` will handle the request

### `/debug` - Debug Commands

**Debug Logging:**

```bash
/debug logging on|off
```

Enable or disable debug logging.

**Debug Markdown:**

```bash
/debug markdown
```

Output a markdown sample for testing.

**Debug Services:**

```bash
/debug services [limit]
```

Display service logs (default: last 50).

**Debug Questions:**

```bash
/debug questions <type>
```

Test human interface request types. Available types:

- `text` - Test text input
- `confirm` - Test approval dialog
- `tree` - Test tree selection
- `file` - Test file selection
- `form` - Test multi-section form

**Debug Chat:**

```bash
/debug chat throwError
```

Throw an error to test error handling.

**Debug App:**

```bash
/debug app shutdown
```

Send shutdown command to app.

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
  todos: {},
  createMessage: "Agent Created"
});

// Spawn agent
const agent = await agentManager.spawnAgent({
  agentType: "myAgent",
  headless: false
});

// Handle user input
const requestId = agent.handleInput({from: "user", message: "Hello! How can you help me?"});

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
import {TodoState} from "@tokenring-ai/agent/state/todoState";
import {SubAgentState} from "@tokenring-ai/agent/state/subAgentState";

// State slices are automatically initialized by Agent
// Access them via getState/mutateState:

// Get event state
const eventState = agent.getState(AgentEventState);
console.log("Events:", eventState.events);

// Modify command history
agent.mutateState(CommandHistoryState, (state) => {
  state.commands.push("new command");
});

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
await subAgent.handleInput({from: "parent", message: "Process this data"});

// Sub-agent state is automatically copied from parent (if configured)
await agentManager.deleteAgent(subAgent.id, "Cleanup");
```

### Advanced Sub-Agent Execution

For more advanced sub-agent execution with fine-grained control, use the `SubAgentService` directly:

```typescript
import SubAgentService from "@tokenring-ai/agent/services/SubAgentService";

const subAgentService = agent.requireServiceByType(SubAgentService);

// Run sub-agent with custom forwarding options
const result = await subAgentService.runSubAgent({
  agentType: "code-assistant",
  headless: true,
  input: {
    from: "parent",
    message: "/work Analyze this code: function test() { return true; }"
  },
  parentAgent: agent,
  options: {
    forwardChatOutput: true,
    forwardSystemOutput: true,
    forwardHumanRequests: true,
    forwardReasoning: false,
    forwardInputCommands: true,
    forwardArtifacts: false,
    timeout: 60,
    maxResponseLength: 500,
    minContextLength: 300
  },
  autoCleanup: true,
  checkPermissions: true,
});

console.log("Result:", result.status, result.response);
```

**RunSubAgentOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentType` | `string` | - | The type of agent to create |
| `headless` | `boolean` | - | Whether to run in headless mode |
| `input` | `InputMessage` | - | The command to send to the agent |
| `parentAgent` | `Agent` | - | The parent agent instance |
| `background` | `boolean` | false | Run in background and return immediately |
| `options` | `Partial<ParsedSubAgentConfig>` | `{}` | Configuration options for sub-agent |
| `autoCleanup` | `boolean` | true | Auto-delete child agent when done |
| `checkPermissions` | `boolean` | true | Check parent agent permissions |

**RunSubAgentResult:**

```typescript
interface RunSubAgentResult {
  status: "success" | "error" | "cancelled";
  response: string;
  childAgent?: Agent; // Only if autoCleanup is false
}
```

### Human Interface Requests

```typescript
// Simple approval (Yes/No)
const approved = await agent.askForApproval({
  message: "Are you sure you want to proceed?",
  label: "Approve?",
  default: false,
  autoSubmitAfter: 30000 // Auto-approve after 30 seconds
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
agent.sendInteractionResponse({
  requestId,
  interactionId,
  result: selection
});
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
| `TodoState` | Task list management |
| `SubAgentState` | Sub-agent configuration |

**AgentEventState:**

- `events`: Array of AgentEventEnvelope
- `inputQueue`: Array of input queue items
- `currentlyExecutingInputItem`: Currently executing input item or null
- `getEventCursorFromCurrentPosition()`: Get event cursor
- `yieldEventsByCursor(cursor)`: Yield events by cursor
- `idle`: Computed property (inputQueue.length === 0)

**AgentExecutionState (in AgentEventState):**

- `status`: Execution status (queued, running, finished)
- `currentActivity`: Current activity description
- `availableInteractions`: Array of available interactions

**CommandHistoryState:**

- `commands`: Array of command strings

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

class CustomState extends AgentStateSlice<typeof serializationSchema> {
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
    return {data: this.data};
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
- `input.interaction` - User interaction response

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

- `cancel` - Operation cancelled
- `input.execution` - Input execution status update

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
        name: {type: 'text', label: 'Full Name', defaultValue: ''},
        email: {type: 'text', label: 'Email', defaultValue: ''}
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
4. **Use sub-agents for background tasks**: Leverage sub-agent functionality for parallel processing

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
- `@tokenring-ai/lifecycle` - Lifecycle hooks integration
- `@tokenring-ai/rpc` - RPC service integration
- `eventemitter3` - Event handling
- `uuid` - Unique ID generation
- `glob-gitignore` - Gitignore parsing
- `zod` - Schema validation

## Related Components

- [@tokenring-ai/chat](/plugins/chat.md) - Chat service integration
- [@tokenring-ai/app](/plugins/app.md) - Base application framework
- [@tokenring-ai/rpc](/plugins/rpc.md) - RPC service
- [@tokenring-ai/utility](/plugins/utility.md) - Shared utilities
- [@tokenring-ai/lifecycle](/plugins/lifecycle.md) - Lifecycle hooks

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
