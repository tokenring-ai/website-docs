# Agent Plugin

Core component for creating, managing, and orchestrating AI agents with tools, commands, hooks, and state persistence.

## Overview

The `@tokenring-ai/agent` package is the core component of the TokenRing AI system, designed to create, manage, and orchestrate AI agents. These agents can process commands, utilize tools, execute hooks, maintain state, and interact with users or other services through events and chat interfaces. The package supports building collaborative AI teams where agents can share resources like tools, commands, and storage.

## Key Features

- **Agent and AgentTeam management**: Create and manage multiple agents with shared resources
- **Context and history storage**: Maintain conversation context and command history
- **Event-driven architecture**: Real-time event streaming for agent interactions
- **Tool and command registration**: Extensible system via registries
- **State persistence**: Checkpoint and restore agent state
- **Modular design**: Extensibility via TokenRingPackage system

## Core Components

### AgentTeam

Central orchestrator for managing multiple agents, packages, and shared resources using registries.

**Key Methods:**
- `addPackages(packages: TokenRingPackage[])`: Registers tools, commands, hooks, and agents from packages
- `createAgent(type: string): Promise<Agent>`: Creates and initializes a new agent instance
- `getAgents(): Agent[]`: Retrieves all active agents
- `deleteAgent(agent: Agent): Promise<void>`: Shuts down and removes an agent

### Agent

Represents an individual AI agent with state, tools, hooks, and services.

**Key Methods:**
- `initialize(): Promise<void>`: Attaches services and runs initial commands
- `handleInput({message: string}): Promise<void>`: Processes user input and dispatches to chat commands
- `generateCheckpoint(): AgentCheckpointData`: Serializes state for persistence
- `restoreCheckpoint(data: AgentCheckpointData): void`: Deserializes and restores state
- `events(signal: AbortSignal): AsyncGenerator<AgentEventEnvelope>`: Yields real-time events
- `askHuman(request: HumanInterfaceRequest): Promise<any>`: Requests human input
- `reset(what: ResetWhat[])`: Resets specific state slices

### State Management

- `initializeState(ClassType, props)`: Adds a state slice implementing `AgentStateSlice`
- `getState<T>(ClassType): T`: Retrieves a state slice
- State slices handle serialization for checkpoints

## Usage Example

```typescript
import { AgentTeam, TokenRingPackage } from '@tokenring-ai/agent';

const team = new AgentTeam({ persistentStorage: /* implement AgentPersistentStorage */ });
await team.addPackages([/* packages */]);

const agent = await team.createAgent('myAgentType');

// Listen to events
for await (const event of agent.events(new AbortController().signal)) {
  if (event.type === 'output.chat') {
    console.log('Agent says:', event.data.content);
  }
}

// Process input
await agent.handleInput({ message: '/help' });
```

## Dependencies

- `@tokenring-ai/utility` (^0.1.0): Registries, logging utilities
- `eventemitter3` (^5.0.1): Event handling
- `glob-gitignore` (^1.0.15): File globbing with .gitignore support
- `uuid` (^11.1.0): ID generation
