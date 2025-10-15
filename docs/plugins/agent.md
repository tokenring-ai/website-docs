# Agent Plugin

Core orchestration system for creating and managing AI agents with tools, commands, hooks, state persistence, and sub-agent support.

## Overview

The `@tokenring-ai/agent` package enables creation and management of AI agents that execute commands, use tools, run hooks, maintain state, and communicate through asynchronous events. Agents operate within teams (AgentTeam) that share registries of tools, commands, hooks, and services. Supports interactive and background agent types, sub-agent creation, state persistence via checkpoints, and human interaction requests.

## Key Features

- **AgentTeam orchestration**: Manage multiple agents with shared registries
- **State management**: StateManager with serializable state slices
- **Event-driven architecture**: Real-time event streaming for agent interactions
- **Sub-agent support**: Create child agents with inherited state
- **Human interaction**: Request user input with typed responses
- **Extensible system**: Tools, commands, hooks via TokenRingPackage
- **State persistence**: Checkpoint and restore agent state

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

**State Management:**
- `initializeState<T>(ClassType, props)` - Add state slice
- `getState<T>(ClassType): T` - Retrieve state slice
- `mutateState<T>(ClassType, callback)` - Modify state slice
- `generateCheckpoint(): AgentCheckpointData` - Serialize state
- `restoreCheckpoint(data: AgentCheckpointData)` - Restore state
- `reset(what: ResetWhat[])` - Reset state slices

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

## Built-in Commands

- `/debug [on|off]` - Toggle debug logging
- `/hooks [list|enable|disable] [hookName]` - Manage hooks
- `/reset [chat|memory|settings|all]` - Reset state
- `/settings` - Show active services and tools
- `/tools [enable|disable|set] <tool1> <tool2>` - Manage tools
- `/work [message]` - Invoke agent's work handler

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
  workHandler?: (msg: string, agent: Agent) => Promise<void>; // Custom work handler
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
- `eventemitter3` (^5.0.1): Event handling
- `glob-gitignore` (^1.0.15): File pattern matching
- `uuid` (^13.0.0): ID generation
