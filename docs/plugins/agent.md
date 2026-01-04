# Agent

## Overview

The Agent package serves as the core orchestration system for managing AI agents within the TokenRing ecosystem. It provides a complete agent framework with comprehensive state management, event handling, command execution, tool integration, and lifecycle management. This package enables the creation and management of individual AI agents that integrate seamlessly with the TokenRing application framework.

## Key Features

- **Agent Management**: Create, spawn, and manage individual AI agents with unique configurations
- **State Management**: Persistent state with serialization and checkpointing for session recovery
- **Event System**: Comprehensive event handling and emission for chat output, reasoning, and system messages
- **Command System**: Extensible slash command interface with built-in commands like help, cost, and settings
- **Tool Integration**: Tool execution with context and parameter validation
- **Hook System**: Lifecycle hooks for extensibility (before/after chat completion, agent events)
- **Human Interface**: Request/response system for human interaction and input with form support
- **Sub-Agent Support**: Create and manage child agents with independent state
- **Cost Tracking**: Monitor and track resource usage across API calls and tokens
- **RPC Integration**: JSON-RPC endpoints for remote agent management
- **Plugin Integration**: Automatic integration with TokenRing applications
- **Idle/Max Runtime Management**: Automatic cleanup of idle or long-running agents
- **Status Line Management**: Visual indicators for busy state and status messages

## Core Components

### Agent Class

The central agent implementation providing comprehensive AI agent functionality:

```typescript
import Agent from "@tokenring-ai/agent";

const agent = new Agent(app, &#123;
  config: &#123;
    name: "My Agent",
    description: "Custom development agent",
    category: "development",
    visual: &#123; color: "blue" &#125;,
    type: "interactive",
    initialCommands: ["/help"]
  &#125;,
  headless: false
&#125;);
```

**Key Properties:**
- `id`: Unique agent identifier (UUID)
- `name`: Agent name
- `description`: Agent description
- `config`: Parsed agent configuration
- `debugEnabled`: Debug logging toggle
- `headless`: Headless operation mode
- `app`: TokenRing application instance
- `stateManager`: State management system

**State Management Methods:**
- `initializeState&lt;T&gt;(ClassType, props)`: Initialize state slice
- `getState&lt;T&gt;(ClassType)`: Retrieve state slice
- `mutateState&lt;T&gt;(ClassType, callback)`: Modify state slice
- `subscribeState&lt;T&gt;(ClassType, callback)`: Subscribe to state changes
- `waitForState&lt;T&gt;(ClassType, predicate)`: Wait for state condition
- `timedWaitForState&lt;T&gt;(ClassType, predicate, timeout)`: Wait with timeout
- `subscribeStateAsync&lt;T&gt;(ClassType, callback)`: Subscribe asynchronously
- `generateCheckpoint()`: Create state checkpoint
- `restoreState(state)`: Restore from checkpoint

**Input Processing:**
- `handleInput(&#123;message&#125;)`: Process user input with event emission
- `runCommand(command)`: Execute agent commands
- `busyWhile&lt;T&gt;(message, awaitable)`: Execute with busy state
- `setBusyWith(message)`: Set busy status indicator
- `setStatusLine(status)`: Set status line indicator

**Event Emission:**
- `chatOutput(content)`: Emit chat output
- `reasoningOutput(content)`: Emit reasoning content
- `systemMessage(message, level)`: Emit system messages
- `infoLine(...messages)`: Emit info messages
- `warningLine(...messages)`: Emit warning messages
- `errorLine(...messages)`: Emit error messages
- `debugLine(...messages)`: Emit debug messages (if debugEnabled)
- `emit(event)`: Emit custom events

**Human Interface:**
- `askHuman&lt;T&gt;(request)`: Request human input
- `sendHumanResponse(requestId, response)`: Send human response

**Lifecycle Management:**
- `requestAbort(reason)`: Abort current operations
- `getAbortSignal()`: Get abort signal
- `getIdleDuration()`: Get time since last activity
- `getRunDuration()`: Get total run duration
- `reset(what)`: Reset specific state components
- `shutdown(reason)`: Shutdown agent completely

**Configuration Access:**
- `getAgentConfigSlice&lt;T&gt;(key, schema)`: Get config value with validation

**Checkpoint Creation:**
- `static createAgentFromCheckpoint(app, checkpoint, &#123;headless&#125;)`: Create agent from checkpoint

### AgentManager Service

Central service for managing agent lifecycles and configurations:

```typescript
const agentManager = new AgentManager(app);

// Add agent configurations
agentManager.addAgentConfigs(&#123;
  myAgent: &#123;
    name: "My Agent",
    description: "Custom agent description",
    category: "development",
    visual: &#123; color: "blue" &#125;,
    type: "interactive",
    initialCommands: ["/help"]
  &#125;
&#125;);

// Spawn agents
const agent = await agentManager.spawnAgent(&#123;
  agentType: "myAgent",
  headless: false
&#125;);
```

**Key Methods:**
- `addAgentConfig(name, config)`: Register agent configuration
- `addAgentConfigs(configs)`: Register multiple agent configurations
- `getAgentTypes()`: Get all available agent types
- `getAgentConfigs()`: Get all agent configurations
- `spawnAgent(&#123;agentType, headless&#125;)`: Create new agent
- `spawnSubAgent(agent, &#123;agentType, headless&#125;)`: Create sub-agent
- `spawnAgentFromConfig(config, &#123;headless&#125;)`: Create agent from config
- `spawnAgentFromCheckpoint(app, checkpoint, &#123;headless&#125;)`: Create from checkpoint
- `getAgent(id)`: Get agent by ID
- `getAgents()`: Get all active agents
- `deleteAgent(agent)`: Shutdown and remove agent

**Automatic Lifecycle Management:**
- Idle agent cleanup every 60 seconds
- Configurable `idleTimeout` per agent (default: 86400 seconds)
- Configurable `maxRunTime` per agent (default: 0 = no limit)

### AgentCommandService Service

Service for managing and executing agent commands:

```typescript
const commandService = new AgentCommandService();

// Commands are automatically registered via plugin
// Execute commands via agent
await agent.runCommand("/help");
await agent.runCommand("Hello, agent!");
```

**Command Processing:**
- Automatic slash command parsing
- Default chat command fallback (`/chat send`)
- Command singular/plural name handling
- Error handling for unknown commands

**Key Methods:**
- `addAgentCommands(commands)`: Register commands
- `getCommandNames()`: Get all command names
- `getCommands()`: Get all commands
- `getCommand(name)`: Get specific command
- `executeAgentCommand(agent, message)`: Execute command

### AgentLifecycleService Service

Service for managing hooks and lifecycle events:

```typescript
const lifecycleService = new AgentLifecycleService();

// Hooks are automatically registered via plugin
lifecycleService.enableHooks(["myPlugin/afterChatCompletion"], agent);

// Execute hooks manually
await lifecycleService.executeHooks(agent, "afterChatCompletion", args);
```

**Hook Management:**
- `registerHook(name, config)`: Register individual hook
- `addHooks(pkgName, hooks)`: Register hooks with package namespacing
- `getRegisteredHooks()`: Get all registered hooks
- `getEnabledHooks(agent)`: Get enabled hooks for agent
- `setEnabledHooks(hookNames, agent)`: Set enabled hooks
- `enableHooks(hookNames, agent)`: Enable specific hooks
- `disableHooks(hookNames, agent)`: Disable hooks
- `executeHooks(agent, hookType, ...args)`: Execute hooks

**Hook Types:**
- `beforeChatCompletion`: Called before chat completion
- `afterChatCompletion`: Called after chat completion
- `afterAgentInputComplete`: Called after agent input is fully processed

## Usage Examples

### Basic Agent Creation and Usage

```typescript
import Agent from "@tokenring-ai/agent";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp();

// Create agent
const agent = new Agent(app, &#123;
  config: &#123;
    name: "My Agent",
    description: "Custom development agent",
    category: "development",
    visual: &#123; color: "blue" &#125;,
    type: "interactive",
    initialCommands: ["/help"]
  &#125;,
  headless: false
&#125;);

// Initialize agent
await agent.initialize();

// Handle user input
const requestId = agent.handleInput(&#123; message: "Hello! How can you help me?" &#125;);

// Listen to events
agent.subscribeState(AgentEventState, (state) =&gt; &#123;
  for (const event of state.events) &#123;
    console.log("Event:", event.type, event);
  &#125;
&#125;);
```

### State Management and Checkpointing

```typescript
// Initialize custom state
class MyCustomState implements AgentStateSlice &#123;
  name = "MyCustomState";
  data: string[] = [];

  reset(what: ResetWhat[]) &#123;
    if (what.includes('chat')) this.data = [];
  &#125;

  show() &#123;
    return [`Data items: $&#123;this.data.length&#125;`];
  &#125;

  serialize() &#123; return &#123; data: this.data &#125;; &#125;

  deserialize(obj: any) &#123; this.data = obj.data || []; &#125;
&#125;

// Use state in agent
agent.initializeState(MyCustomState, &#123;&#125;);

// Modify state
agent.mutateState(MyCustomState, (state) =&gt; &#123;
  state.data.push("item");
&#125;);

// Create checkpoint
const checkpoint = agent.generateCheckpoint();
console.log("Checkpoint:", checkpoint);

// Restore from checkpoint
const restoredAgent = await Agent.createAgentFromCheckpoint(
  app,
  checkpoint,
  &#123; headless: false &#125;
);
```

### Sub-Agent Creation

```typescript
// Create sub-agent from parent
const subAgent = await agentManager.spawnSubAgent(agent, &#123;
  agentType: "backgroundWorker",
  headless: true
&#125;);

// Send message to sub-agent
await subAgent.handleInput(&#123; message: "Process this data" &#125;);

// Sub-agent state is automatically copied from parent
await agentManager.deleteAgent(subAgent);
```

### Advanced Sub-Agent Execution

```typescript
import &#123; runSubAgent &#125; from "@tokenring-ai/agent/runSubAgent";

// Run sub-agent with custom options
const result = await runSubAgent(&#123;
  agentType: "code-assistant",
  headless: true,
  command: "/work Analyze this code: function test() &#123; return true; &#125;",
  forwardChatOutput: true,
  forwardSystemOutput: true,
  forwardReasoning: true,
  forwardHumanRequests: true,
  forwardInputCommands: true,
  timeout: 60,
  maxResponseLength: 1000,
  minContextLength: 300,
  background: false
&#125;, agent, true);

console.log("Result:", result.status, result.response);
```

### Tool Execution

```typescript
// Built-in tool: runAgent
const result = await agent.runAgent(&#123;
  agentType: "dataProcessor",
  message: "Analyze this dataset",
  context: "File: data.csv\nColumns: name,age,income",
  forwardChatOutput: true,
  forwardSystemOutput: true,
  timeout: 300
&#125;);

console.log("Tool result:", result);
```

### Hook System

```typescript
// Register hook
const hookConfig: HookConfig = &#123;
  name: "myPlugin/afterChatCompletion",
  description: "Custom after chat completion hook",
  afterChatCompletion: async (agent, ...args) =&gt; &#123;
    console.log("Chat completed:", args);
  &#125;
&#125;;

// Enable hook for agent
lifecycleService.registerHook("myPlugin/afterChatCompletion", hookConfig);
lifecycleService.enableHooks(["myPlugin/afterChatCompletion"], agent);

// Hooks automatically execute on lifecycle events
```

### Human Interface Requests

```typescript
// Simple confirmation
const confirmed = await agent.askHuman(&#123;
  type: "askForConfirmation",
  message: "Are you sure you want to proceed?"
&#125;);

// Text input
const text = await agent.askHuman(&#123;
  type: "askForText",
  message: "Enter your name:"
&#125;);

// Single tree selection
const selection = await agent.askHuman(&#123;
  type: "askForSingleTreeSelection",
  title: "Choose an option",
  tree: &#123;
    name: "root",
    hasChildren: true,
    children: [
      &#123; name: "Option 1", value: "opt1" &#125;,
      &#123; name: "Option 2", value: "opt2" &#125;
    ]
  &#125;
&#125;);

// Complex form
const formData = await agent.askHuman(&#123;
  type: "askForForm",
  name: "contactForm",
  description: "Please fill out the contact form",
  sections: [
    &#123;
      name: "personal",
      description: "Personal Information",
      fields: [
        &#123; type: "text", label: "Full Name", key: "name", required: true &#125;,
        &#123; type: "text", label: "Email", key: "email", required: true &#125;
      ]
    &#125;,
    &#123;
      name: "preferences",
      description: "Preferences",
      fields: [
        &#123; 
          type: "selectOne", 
          label: "Category", 
          key: "category", 
          options: [
            &#123; label: "Support", value: "support" &#125;,
            &#123; label: "Sales", value: "sales" &#125;
          ]
        &#125;
      ]
    &#125;
  ]
&#125;);

// Handle human response
agent.sendHumanResponse(requestId, selection);
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
agent.setStatusLine("Ready for input");

// Clear status indicators
agent.setBusyWith(null);
agent.setStatusLine(null);
```

## Configuration

### AgentConfig Schema

```typescript
const agentConfig = &#123;
  name: string,                    // Agent identifier
  description: string,             // Agent purpose
  category: string,                // Agent category
  debug?: boolean,                 // Enable debug logging (default: false)
  visual: &#123;
    color: string                  // UI color theme
  &#125;,
  workHandler?: Function,          // Custom work handler
  initialCommands: string[],       // Startup commands
  persistent?: boolean,            // Enable checkpointing
  storagePath?: string,            // Storage location
  type: "interactive" | "background", // Agent type
  callable?: boolean,              // Enable tool calls (default: true)
  idleTimeout?: number,            // Idle timeout in seconds (default: 86400)
  maxRunTime?: number              // Max runtime in seconds (default: 0 = unlimited)
&#125;;
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

**State Events:**
- `reset` - State reset
- `human.request` - Human input requested
- `human.response` - Human response provided
- `abort` - Operation aborted
- `agent.created` - Agent was created
- `agent.stopped` - Agent was stopped

### Event Schema

All events follow this structure:
```typescript
&#123;
  type: EventType,
  timestamp: number,
  // Event-specific fields
&#125;
```

## Human Interface Types

### Form Fields

```typescript
// Text field
&#123; type: 'text', label: 'Name', key: 'name', required: true &#125;

// Select one field
&#123; 
  type: 'selectOne', 
  label: 'Category', 
  key: 'category', 
  options: [&#123; label: 'A', value: 'a' &#125;, &#123; label: 'B', value: 'b' &#125;] 
&#125;

// Select many field
&#123; 
  type: 'selectMany', 
  label: 'Tags', 
  key: 'tags', 
  options: [&#123; label: 'Tag 1', value: 't1' &#125;] 
&#125;

// Directory picker
&#123; type: 'directory', label: 'Folder', key: 'folder' &#125;

// File picker
&#123; type: 'file', label: 'File', key: 'file' &#125;

// Multiple file picker
&#123; type: 'multipleFile', label: 'Files', key: 'files' &#125;

// Tree selection (single)
&#123; type: 'askForSingleTreeSelection', title: 'Select', tree: treeLeaf &#125;

// Tree selection (multiple)
&#123; type: 'askForMultipleTreeSelection', title: 'Select', tree: treeLeaf &#125;
```

### Tree Leaf Structure

```typescript
&#123;
  name: string,
  value?: string,
  hasChildren?: boolean,
  children?: TreeLeaf[] | (() =&gt; TreeLeaf[] | Promise&lt;TreeLeaf[]&gt;)
&#125;
```

### Request Types

| Type | Request | Response |
|------|---------|----------|
| `askForConfirmation` | `&#123;type, message, default?, timeout?&#125;` | `boolean` |
| `askForText` | `&#123;type, message&#125;` | `string \| null` |
| `askForPassword` | `&#123;type, message&#125;` | `string \| null` |
| `askForSingleTreeSelection` | `&#123;type, title, message?, tree, initialSelection?, loop?, default?, timeout?&#125;` | `string \| null` |
| `askForMultipleTreeSelection` | `&#123;type, title, message?, tree, initialSelection?, loop?, default?, timeout?&#125;` | `string[] \| null` |
| `openWebPage` | `&#123;type, url&#125;` | `boolean` |
| `askForForm` | `&#123;type, name, description, sections&#125;` | `&#123;type, values&#125;` |

## Plugin Configuration

The agent package automatically integrates with TokenRing applications:

```typescript
// Automatic registration via plugin
const app = new TokenRingApp();

// Agents configured in app config
const config = &#123;
  agents: &#123;
    myAgent: &#123;
      name: "My Agent",
      description: "Custom agent",
      category: "development",
      visual: &#123; color: "blue" &#125;,
      type: "interactive"
    &#125;
  &#125;
&#125;;
```

## Integration

### TokenRing Plugin Integration

The agent package automatically integrates with TokenRing applications:

```typescript
// Plugin automatically registers:
// - Chat service integration
// - Agent command service
// - Agent manager service
// - Agent lifecycle service
// - Web host RPC endpoints
// - Context handlers
// - Tools and commands
```

### Service Dependencies

- **ChatService**: For command and tool integration
- **WebHostService**: For RPC endpoint registration
- **FileSystemService**: For file operations
- **CheckpointService**: For state persistence

### Context Handlers

- **available-agents**: Provides list of available agent types
- **todo-list**: Provides todo list context

### RPC Endpoints

| Endpoint | Request Params | Response |
|----------|---------------|----------|
| `listAgents` | None | Array of agent information |
| `spawnAgent` | `&#123;agentType, headless&#125;` | Created agent details |
| `sendMessage` | `&#123;agentId, message&#125;` | Response from agent |

## State Management

### State Slices

Agents support multiple state slices for different concerns:

**Built-in State Slices:**
- **AgentEventState**: Event history and current state
- **CommandHistoryState**: Command execution history
- **CostTrackingState**: Resource usage tracking
- **HooksState**: Hook configuration and enabled hooks
- **TodoState**: Task list management

**Custom State Slices:**
```typescript
class CustomState implements AgentStateSlice &#123;
  name = "CustomState";
  reset(what: ResetWhat[]) &#123;
    // Implementation
  &#125;
  show(): string[] &#123;
    return ["Custom state data"];
  &#125;
  serialize() &#123;
    return &#123; data: this.data &#125;;
  &#125;
  deserialize(obj: any) &#123;
    // Implementation
  &#125;
&#125;
```

### Checkpointing

```typescript
// Generate checkpoint
const checkpoint = agent.generateCheckpoint();

// Restore from checkpoint
const restoredAgent = await Agent.createAgentFromCheckpoint(
  app,
  checkpoint,
  &#123; headless: false &#125;
);
```

## Monitoring and Debugging

- **State Management**: Use `agent.getState()` and `agent.mutateState()` for state operations
- **Checkpointing**: Generate checkpoints with `agent.generateCheckpoint()` for session recovery
- **Events**: Subscribe to state changes with `agent.subscribeState()`
- **Cost Tracking**: Monitor resource usage via cost tracking commands
- **Hook Debugging**: Use lifecycle hooks to debug agent lifecycle events
- **Logging**: Enable debug mode with `debug: true` in agent config
- **Status Indicators**: Use `setBusyWith()` and `setStatusLine()` for visual feedback
- **Duration Tracking**: Use `getIdleDuration()` and `getRunDuration()` for monitoring

## Development

### Testing

```bash
bun run test
bun run test:coverage
```

### Plugin Development

Create custom plugins for agent functionality:

```typescript
import &#123; TokenRingPlugin &#125; from "@tokenring-ai/app";

const myAgentPlugin: TokenRingPlugin = &#123;
  name: "my-plugin",
  install(app) &#123;
    // Register custom commands
    // Register custom tools
    // Register custom hooks
    // Register custom state slices
  &#125;
&#125;;
```

### Package Structure

```
pkg/agent/
├── Agent.ts                          # Core Agent class implementation
├── AgentEvents.ts                    # Event type definitions
├── HumanInterfaceRequest.ts          # Human interaction types
├── types.ts                          # Core type definitions
├── index.ts                          # Package exports
├── plugin.ts                         # TokenRing plugin integration
├── chatCommands.ts                   # Command exports
├── tools.ts                          # Tool exports
├── runSubAgent.ts                    # Sub-agent execution helper
├── commands/                         # Built-in commands
│   ├── agent.ts                      # Agent management commands
│   ├── cost.ts                       # Cost tracking commands
│   ├── work.ts                       # Work handler invocation
│   ├── settings.ts                   # Settings display
│   ├── reset.ts                      # State reset
│   ├── hook.ts                       # Hook management
│   ├── help.ts                       # Help system
│   └── debug/
│       ├── logging.ts                # Debug logging controls
│       ├── markdown.ts               # Markdown rendering test
│       ├── services.ts               # Service logs display
│       └── index.ts                  # Main debug command
├── services/                         # Core services
│   ├── AgentManager.ts               # Agent management service
│   ├── AgentLifecycleService.ts      # Lifecycle and hooks service
│   └── AgentCommandService.ts        # Command execution service
├── state/                            # State management
│   ├── agentEventState.ts            # Event state management
│   ├── commandHistoryState.ts        # Command history tracking
│   ├── costTrackingState.ts          # Cost tracking state
│   ├── hooksState.ts                 # Hook configuration state
│   └── todoState.ts                  # Todo state management
├── tools/                            # Built-in tools
│   ├── runAgent.ts                   # Sub-agent execution tool
│   └── todo.ts                       # Todo list management tool
├── contextHandlers/                  # Context providers
│   ├── availableAgents.ts            # Available agents context
│   └── todo.ts                       # Todo context provider
├── rpc/                              # RPC endpoints
│   ├── agent.ts                      # Agent RPC implementation
│   └── schema.ts                     # RPC schema definitions
└── util/                             # Utilities
    ├── formatAgentId.ts              # Agent ID formatting
    └── subcommandRouter.ts           # Command routing utilities
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
