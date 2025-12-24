# Agent Plugin

Core orchestration system for creating and managing AI agents with tools, commands, hooks, state persistence, and sub-agent support. The `@tokenring-ai/agent` package provides the foundation for all TokenRing AI agents, enabling creation, management, and interaction with intelligent agents that execute commands, use tools, run hooks, maintain state, and communicate through asynchronous events.

## Overview

The `@tokenring-ai/agent` package enables creation and management of AI agents that execute commands, use tools, run hooks, maintain state, and communicate through asynchronous events. Agents operate within teams (AgentTeam) that share registries of tools, commands, hooks, and services. Supports interactive and background agent types, sub-agent creation, state persistence via checkpoints, and human interaction requests.

## Key Features

- **AgentTeam orchestration**: Manage multiple agents with shared registries
- **State management**: StateManager with serializable state slices and checkpointing
- **Event-driven architecture**: Real-time event streaming for agent interactions
- **Sub-agent support**: Create child agents with inherited state
- **Human interaction**: Request user input with typed responses
- **Extensible system**: Tools, commands, hooks via TokenRingPackage
- **State persistence**: Checkpoint and restore agent state
- **Command system**: Built-in chat commands like `/agent`, `/work`, `/reset`
- **JSON-RPC API**: Remote agent management and event streaming
- **Idle timeout**: Automatic agent cleanup based on inactivity
- **Lifecycle hooks**: Plugin system for extending agent behavior

## Core Components

### AgentTeam

Central orchestrator managing agents, packages, and shared registries.

**Key Methods:**
- `addPackages(packages: TokenRingPackage[])` - Install and start packages
- `createAgent(type: string): Promise<Agent>` - Create agent by type
- `getAgents(): Agent[]` - Get all active agents
- `deleteAgent(agent: Agent): Promise<void>` - Shutdown and remove agent
- `getConfigSlice<T>(key: string, schema: T)` - Get validated config
- `addAgentConfig(name: string, config: AgentConfig)` - Register agent type

**Registries:**
- `packages` - TokenRing packages
- `services` - Shared services (typed registry)
- `chatCommands` - Chat commands
- `tools` - Available tools
- `hooks` - Lifecycle hooks

### Agent

Individual AI agent with state management, event emission, and command processing.

**Core Methods:**
- `initialize(): Promise<void>` - Attach services, run initial commands
- `handleInput({message: string}): Promise<void>` - Process user input
- `runCommand(message: string): Promise<void>` - Execute command or chat
- `createSubAgent(agentType: string): Promise<Agent>` - Create child agent
- `generateCheckpoint(): AgentCheckpointData` - Serialize state
- `restoreCheckpoint(data: AgentCheckpointData)` - Restore state
- `reset(what: ResetWhat[])` - Reset state slices

**State Management:**
- `initializeState<T>(ClassType, props)` - Add state slice
- `getState<T>(ClassType): T` - Retrieve state slice
- `mutateState<T>(ClassType, callback)` - Modify state slice
- `serialize(): Record<string, object>` - Serialize all slices
- `deserialize(data, onMissing?)` - Restore state
- `reset(what: ResetWhat[])` - Reset slices

**Event System:**
- `events(signal: AbortSignal): AsyncGenerator<AgentEventEnvelope>` - Event stream
- `chatOutput(content: string)` - Emit chat output
- `reasoningOutput(content: string)` - Emit reasoning output
- `systemMessage(message: string, level?)` - Emit system message
- `setBusy(message: string)` / `setNotBusy()` / `setIdle()` - State changes

**Human Interaction:**
- `askHuman<T>(request: HumanInterfaceRequest): Promise<T>` - Request input
- `sendHumanResponse(sequence: number, response: any)` - Resolve request

### StateManager

Manages state slices with serialization/deserialization.

**Methods:**
- `initializeState<T>(ClassType, props)` - Register state slice
- `getState<T>(ClassType): T` - Get state slice
- `mutateState<T>(ClassType, callback)` - Modify state
- `serialize(): Record<string, object>` - Serialize all slices
- `deserialize(data, onMissing?)` - Restore state
- `reset(what: ResetWhat[])` - Reset slices

### Services

#### AgentManager

Manages agent lifecycle and configuration.

**Methods:**
- `addAgentConfig(name: string, config: AgentConfig)` - Register agent type
- `getAgentConfigs(): Record<string, AgentConfig>` - Get all agent configs
- `getAgentTypes(): string[]` - Get available agent types
- `spawnAgent(agentType: string, headless: boolean): Promise<Agent>` - Create agent
- `spawnSubAgent(parentAgent: Agent, agentType: string, headless: boolean): Promise<Agent>` - Create sub-agent
- `deleteAgent(agent: Agent): Promise<void>` - Shutdown and remove agent
- `getAgents(): Agent[]` - Get all active agents
- `getAgent(id: string): Agent | null` - Get agent by ID
- `checkAndDeleteIdleAgents(): Promise<void>` - Clean up idle agents

#### AgentLifecycleService

Manages lifecycle hooks for agents.

**Methods:**
- `registerHook(name: string, config: HookConfig)` - Register hook
- `getRegisteredHooks(): Record<string, HookConfig>` - Get all hooks
- `setEnabledHooks(hookNames: string[], agent: Agent): void` - Set enabled hooks
- `enableHooks(hookNames: string[], agent: Agent): void` - Enable hooks
- `disableHooks(hookNames: string[], agent: Agent): void` - Disable hooks
- `executeHooks(agent: Agent, hookType: HookType, ...args): Promise<void>` - Execute hooks

#### AgentCommandService

Manages chat commands for agents.

**Methods:**
- `addAgentCommands(commands: Record<string, TokenRingAgentCommand>)` - Add commands
- `getCommandNames(): string[]` - Get command names
- `getCommands(): Record<string, TokenRingAgentCommand>` - Get all commands
- `getCommand(name: string): TokenRingAgentCommand` - Get command by name
- `executeAgentCommand(agent: Agent, message: string): Promise<void>` - Execute command

### JSON-RPC API

Provides remote access to agent functionality via JSON-RPC.

**Endpoints:**
- `getAgent(agentId: string)` - Get agent details
- `getAgentEvents(agentId: string, fromPosition: number)` - Get agent events
- `streamAgentEvents(agentId: string, fromPosition: number)` - Stream agent events
- `listAgents()` - List all agents
- `getAgentTypes()` - Get available agent types
- `createAgent(agentType: string, headless: boolean)` - Create new agent
- `deleteAgent(agentId: string)` - Delete agent
- `sendInput(agentId: string, message: string)` - Send input to agent
- `sendHumanResponse(agentId: string, requestId: string, response: any)` - Send human response
- `abortAgent(agentId: string, reason: string)` - Abort agent operation
- `resetAgent(agentId: string, what: ResetWhat[])` - Reset agent state

## Built-in Commands

- `/agent [types|list|run [--bg] <agentType> <message>]` - Manage agents
- `/cost` - Display total costs incurred
- `/work <message>` - Run agent work handler
- `/reset [chat|memory|settings|all]` - Reset agent state
- `/settings` - Show active services and tools
- `/tools [enable|disable|set] <tool1> <tool2>` - Manage tools
- `/hooks [list|enable|disable] [hookName]` - Manage hooks
- `/debug [on|off]` - Toggle debug logging

## Built-in Tools

- `agent/run` - Create sub-agent, send message, wait for response, cleanup

## Event Types

- `output.chat` - Chat output
- `output.reasoning` - Reasoning output
- `output.system` - System messages (info/warning/error)
- `state.busy` - Agent busy
- `state.notBusy` - Agent not busy
- `state.idle` - Agent idle and ready
- `state.aborted` - Operation aborted
- `state.exit` - Exit requested
- `input.received` - Input received
- `human.request` - Human input requested
- `human.response` - Human response provided
- `reset` - State reset

## Usage Examples

### Creating an Agent Team

```typescript
import { AgentTeam, packageInfo } from '@tokenring-ai/agent';

const team = new AgentTeam({ /* config */ });
await team.addPackages([packageInfo]);

team.addAgentConfig('myAgent', {
  name: 'My Agent',
  description: 'Custom agent',
  visual: { color: 'blue' },
  ai: { /* AI config */ },
  initialCommands: [],
  type: 'interactive'
});

const agent = await team.createAgent('myAgent');
await agent.initialize();
```

### Processing Events

```typescript
const controller = new AbortController();
for await (const event of agent.events(controller.signal)) {
  switch (event.type) {
    case 'output.chat':
      console.log('Chat:', event.data.content);
      break;
    case 'state.idle':
      console.log('Agent ready');
      break;
    case 'human.request':
      const response = await getUserInput(event.data.request);
      agent.sendHumanResponse(event.data.sequence, response);
      break;
  }
}

await agent.handleInput({ message: '/tools enable myTool' });
```

### Creating Sub-Agents

```typescript
const subAgent = await agent.createSubAgent('backgroundWorker');
// Persistent state is copied to sub-agent
await team.deleteAgent(subAgent); // Cleanup
```

### State Management

```typescript
class MyState implements StateSlice {
  name = 'MyState';
  data: string[] = [];
  
  reset(what: ResetWhat[]) {
    if (what.includes('chat')) this.data = [];
  }
  
  serialize() { return { data: this.data }; }
  deserialize(obj: any) { this.data = obj.data || []; }
}

agent.initializeState(MyState, {});
agent.mutateState(MyState, state => state.data.push('item'));
const state = agent.getState(MyState);

const checkpoint = agent.generateCheckpoint();
agent.restoreCheckpoint(checkpoint);
```

### Using Agent Commands

```typescript
// List available agent types
await agent.runCommand('/agent types');

// List running agents
await agent.runCommand('/agent list');

// Run a sub-agent in background
await agent.runCommand('/agent run --bg researcher "find information about AI"');

// Reset agent state
await agent.runCommand('/reset chat memory');
```

### JSON-RPC API Usage

```typescript
import { createJsonRPCEndpoint } from '@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint';

// Create JSON-RPC endpoint
const agentRpc = createJsonRPCEndpoint(AgentRpcSchema, {
  getAgent(args, app) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) throw new Error("Agent not found");
    return {
      id: agent.id,
      name: agent.name,
      type: agent.config.type,
      description: agent.description,
    };
  },
  // ... other handlers
});

// Stream agent events
const stream = await agentRpc.streamAgentEvents({ agentId, fromPosition: 0 });
for await (const update of stream) {
  console.log('New events:', update.events);
}
```

## Configuration

**AgentConfig:**
```typescript
{
  name: string;                    // Agent identifier
  description: string;              // Purpose
  visual: { color: string };        // UI color
  ai: any;                          // AI configuration
  initialCommands: string[];        // Startup commands
  persistent?: boolean;             // Enable checkpointing
  storagePath?: string;             // Storage location
  type: 'interactive' | 'background'; // Agent type
  callable: boolean;                // Whether agent can be called
  idleTimeout?: number;             // Inactivity timeout in seconds (default: 86400)
  maxRunTime?: number;              // Maximum runtime in seconds (default: 1800)
  workHandler?: (msg: string, agent: Agent) => Promise<void>; // Custom work handler
  category?: string;                // Agent category for organization
  debug?: boolean;                 // Enable debug logging
}
```

## Human Interface Requests

Supported request types:
- `askForConfirmation` - Yes/no prompt
- `openWebPage` - Open URL
- `askForSelection` - Single choice
- `ask` - Text input
- `askForPassword` - Password input
- `askForMultipleSelections` - Multiple choices
- `askForSingleTreeSelection` - Tree navigation (single)
- `askForMultipleTreeSelection` - Tree navigation (multiple)

## Dependencies

- `@tokenring-ai/utility` (^0.1.0): Registries and utilities
- `@tokenring-ai/app` (^0.1.0): Application framework
- `@tokenring-ai/chat` (^0.1.0): Chat services
- `@tokenring-ai/web-host` (^0.1.0): Web server and WebSocket support
- `eventemitter3` (^5.0.1): Event handling
- `glob-gitignore` (^1.0.15): File pattern matching
- `uuid` (^13.0.0): ID generation

## Integration

The agent plugin integrates with:
- `@tokenring-ai/chat`: Provides chat services and command system
- `@tokenring-ai/web-host`: Provides JSON-RPC API endpoints
- `@tokenring-ai/agent-api`: WebSocket API for real-time agent communication

## Development

### Package Structure

```
pkg/agent/
├── Agent.ts                 # Main Agent class
├── AgentEvents.ts           # Event types and definitions
├── AgentManager.ts          # Agent lifecycle management
├── AgentLifecycleService.ts # Lifecycle hooks
├── AgentCommandService.ts   # Chat command processing
├── types.ts                # Type definitions
├── plugin.ts               # Plugin registration
├── index.ts                # Package exports
├── chatCommands.ts         # Built-in chat commands
├── tools.ts                # Built-in tools
├── contextHandlers.ts      # Context handlers
├── commands/              # Command implementations
├── services/              # Service implementations
├── state/                 # State management
├── rpc/                   # JSON-RPC endpoints
└── util/                  # Utility functions
```

### Testing

The package uses Vitest for testing:
```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Build

```bash
bun run build
```