# Sandbox

## Overview

The `@tokenring-ai/sandbox` package provides an abstract interface for managing sandboxed environments within the Token Ring AI agent system. It enables the creation, execution, and management of isolated containers (e.g., via Docker or similar providers) to safely run commands or code. The package acts as a service layer that abstracts provider-specific details, allowing multiple sandbox providers to be registered and switched dynamically.

## Key Features

- **Abstract Provider Interface**: Extensible interface for implementing different sandbox providers (Docker, Kubernetes, etc.)
- **Multi-Provider Support**: Register and switch between multiple sandbox providers dynamically
- **Label-Based Container Management**: Reference containers by user-defined labels instead of container IDs
- **Agent State Integration**: Seamless integration with Token Ring agents via tools and chat commands
- **State Persistence**: Agent state management with persistence and transfer capabilities for agent teams
- **Service Architecture**: Implements `TokenRingService` for clean integration with the Token Ring application framework

## Core Components

### SandboxProvider (Interface)

The `SandboxProvider` interface defines the contract for any concrete sandbox implementation. It defines methods for container lifecycle and execution.

**Interface Definition:**

```typescript
interface SandboxProvider {
  createContainer(options?: SandboxOptions): Promise<SandboxResult>;
  executeCommand(containerId: string, command: string): Promise<ExecuteResult>;
  stopContainer(containerId: string): Promise<void>;
  getLogs(containerId: string): Promise<LogsResult>;
  removeContainer(containerId: string): Promise<void>;
}
```

**Type Definitions:**

```typescript
interface SandboxOptions {
  label?: string;
  image?: string;
  workingDir?: string;
  environment?: Record<string, string>;
  timeout?: number;
}

interface SandboxResult {
  containerId: string;
  status: string;
}

interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface LogsResult {
  logs: string;
}
```

### SandboxService

The `SandboxService` manages multiple providers and tracks the active container with label-to-container ID mapping. It implements `TokenRingService` for integration with agents.

**Key Methods:**

- `registerProvider(name: string, resource: SandboxProvider): void`
  - Registers a provider in the internal registry

- `attach(agent: Agent): Promise<void>`
  - Attaches the service to an agent and initializes agent state

- `requireActiveProvider(agent: Agent): SandboxProvider`
  - Gets the active provider or throws an error if none is set

- `getActiveProvider(agent: Agent): SandboxProvider | null`
  - Gets the active provider or returns null

- `setActiveProvider(name: string, agent: Agent): void`
  - Sets the active provider by name

- `getActiveContainer(agent: Agent): string | null`
  - Gets the active container label or ID

- `setActiveContainer(containerId: string, agent: Agent): void`
  - Sets the active container

- `createContainer(options: SandboxOptions | undefined, agent: Agent): Promise<SandboxResult>`
  - Creates a container using the active provider
  - Sets the created container as active with label mapping

- `executeCommand(label: string, command: string, agent: Agent): Promise<ExecuteResult>`
  - Executes a command in the specified container
  - Uses label-to-container ID mapping

- `stopContainer(label: string, agent: Agent): Promise<void>`
  - Stops the specified container
  - Clears active container if it matches

- `getLogs(label: string, agent: Agent): Promise<LogsResult>`
  - Retrieves logs from the specified container

- `removeContainer(label: string, agent: Agent): Promise<void>`
  - Removes the specified container and its label mapping

### SandboxState

The `SandboxState` class manages agent state for sandbox operations, implementing `AgentStateSlice`.

**State Properties:**

- `provider: string | null` - Current active provider name
- `activeContainer: string | null` - Current active container label
- `labelToContainerId: Map<string, string>` - Maps labels to container IDs

**State Methods:**

- `transferStateFromParent(parent: Agent): void`
  - Transfers state from a parent agent (for agent teams)

- `serialize(): object`
  - Serializes state for persistence

- `deserialize(data: any): void`
  - Deserializes persisted state

- `show(): string[]`
  - Returns state summary strings

## Services and APIs

The `SandboxService` provides a unified interface for sandbox operations across different providers. It manages container state and provider selection, ensuring seamless integration with Token Ring agents.

The service uses the agent-based pattern where all operations require an `Agent` instance to access state and services.

## Commands and Tools

### Chat Commands

The `/sandbox` command provides interactive control in agent chats.

**Syntax:**

```
/sandbox <action> [arguments]
```

**Available Actions:**

| Action | Description |
|--------|-------------|
| `create <label> [image]` | Create a new container with label and optional image |
| `exec <command>` | Execute command in active container |
| `stop [label]` | Stop container (uses active if unspecified) |
| `logs [label]` | Get container logs (uses active if unspecified) |
| `remove [label]` | Remove container (uses active if unspecified) |
| `status` | Show active container and provider |
| `provider get` | Show current provider |
| `provider set <name>` | Set provider by name |
| `provider reset` | Reset provider to initial configuration |
| `provider select` | Interactively select provider from available list |

**Usage Examples:**

```
/sandbox create myapp ubuntu:22.04
/sandbox exec ls -la /app
/sandbox logs
/sandbox stop
/sandbox status
/sandbox provider set docker
/sandbox provider select
```

### Tools

Available tools for agent execution:

| Tool Name | Description | Input Schema |
|-----------|-------------|--------------|
| `sandbox_createContainer` | Creates a new sandbox container with optional parameters | `label`, `image`, `workingDir`, `environment`, `timeout` |
| `sandbox_executeCommand` | Executes a command in a container (uses active if unspecified) | `label` (optional), `command` |
| `sandbox_stopContainer` | Stops a container (uses active if unspecified) | `label` (optional) |
| `sandbox_getLogs` | Gets container logs (uses active if unspecified) | `label` (optional) |
| `sandbox_removeContainer` | Removes a container (uses active if unspecified) | `label` (optional) |

Each tool logs actions via the agent's infoLine and errorLine methods and handles errors (e.g., no active container, provider not found).

## Plugin Configuration

The sandbox plugin uses a configuration schema defined in `schema.ts` for validating plugin options.

**Configuration Schema:**

```typescript
const packageConfigSchema = z.object({
  sandbox: SandboxServiceConfigSchema
});

const SandboxServiceConfigSchema = z.object({
  providers: z.record(z.string(), z.any()).optional(),
  agentDefaults: z.object({
    provider: z.string()
  })
});

const SandboxAgentConfigSchema = z.object({
  provider: z.string().optional()
}).default({});
```

### Example Configuration

```json
{
  "sandbox": {
    "providers": {
      "docker": {
        "type": "docker"
      }
    },
    "agentDefaults": {
      "provider": "docker"
    }
  }
}
```

## Configuration Options

### SandboxOptions

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Optional label for container reference |
| `image` | `string` | Container image to use (e.g., 'ubuntu:latest') |
| `workingDir` | `string` | Working directory in container |
| `environment` | `Record<string, string>` | Environment variables |
| `timeout` | `number` | Timeout in seconds for operations |

### Provider Configuration

Providers are configured through the app's sandbox configuration. The package currently supports Docker providers out of the box, with the ability to extend for other providers.

**Configuration Schema:**

```typescript
const config = {
  sandbox: {
    providers: {
      [providerName]: {
        type: "docker",
        // Provider-specific configuration
      }
    },
    agentDefaults: {
      provider: "docker"
    }
  }
};
```

## Usage Examples

### 1. Plugin Registration

The package is designed as a Token Ring plugin. It automatically registers tools and chat commands when installed:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import sandboxPlugin from "@tokenring-ai/sandbox";

const app = new TokenRingApp();
app.install(sandboxPlugin, {
  providers: {
    docker: { type: "docker" }
  },
  agentDefaults: {
    provider: "docker"
  }
});
```

### 2. Using the Service Directly

```typescript
import { SandboxService } from "@tokenring-ai/sandbox";
import { DockerSandboxProvider } from "@tokenring-ai/docker";

const sandboxService = new SandboxService({
  providers: {},
  agentDefaults: { provider: "docker" }
});

// Register a provider
sandboxService.registerProvider('docker', new DockerSandboxProvider());

// Create and use container
const result = await sandboxService.createContainer({ 
  label: 'myapp',
  image: 'ubuntu:latest' 
}, agent);
console.log(`Created: ${result.containerId}`);

const execResult = await sandboxService.executeCommand(
  result.containerId, 
  'ls -la',
  agent
);
console.log(`Stdout: ${execResult.stdout}`);
```

### 3. Using Tools in Agent Workflow

```typescript
// Agent invokes tool
await agent.executeTool('sandbox_createContainer', { 
  label: 'myapp',
  image: 'node:18' 
});
await agent.executeTool('sandbox_executeCommand', { 
  command: 'node --version'
});
```

## API Reference

### SandboxService

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `registerProvider(name, resource)` | `name`, `resource` | `void` | Registers a provider |
| `getAvailableProviders()` | - | `string[]` | Lists registered providers |
| `attach(agent)` | `agent` | `Promise<void>` | Attaches service to agent |
| `requireActiveProvider(agent)` | `agent` | `SandboxProvider` | Gets active provider or throws |
| `getActiveProvider(agent)` | `agent` | `SandboxProvider \| null` | Returns the active provider |
| `setActiveProvider(name, agent)` | `name`, `agent` | `void` | Sets the active provider |
| `getActiveContainer(agent)` | `agent` | `string \| null` | Returns active container |
| `setActiveContainer(containerId, agent)` | `containerId`, `agent` | `void` | Sets the active container |
| `createContainer(options, agent)` | `options`, `agent` | `Promise<SandboxResult>` | Creates a container |
| `executeCommand(label, command, agent)` | `label`, `command`, `agent` | `Promise<ExecuteResult>` | Executes a command |
| `stopContainer(label, agent)` | `label`, `agent` | `Promise<void>` | Stops a container |
| `getLogs(label, agent)` | `label`, `agent` | `Promise<LogsResult>` | Retrieves logs |
| `removeContainer(label, agent)` | `label`, `agent` | `Promise<void>` | Removes a container |

### SandboxProvider Interface

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createContainer(options)` | `options` | `Promise<SandboxResult>` | Creates a container |
| `executeCommand(containerId, command)` | `containerId`, `command` | `Promise<ExecuteResult>` | Executes a command |
| `stopContainer(containerId)` | `containerId` | `Promise<void>` | Stops a container |
| `getLogs(containerId)` | `containerId` | `Promise<LogsResult>` | Retrieves logs |
| `removeContainer(containerId)` | `containerId` | `Promise<void>` | Removes a container |

## Integration

The sandbox plugin integrates with the Token Ring agent system through the following patterns:

- **Service Registration**: The plugin registers as a `TokenRingPlugin`, adding services and tools.
- **Chat Commands**: The `/sandbox` command is added to the agent's command list via `AgentCommandService`.
- **Tool Registration**: Tools are registered via the `ChatService` for agent execution.
- **State Management**: The `SandboxState` slice manages active container and provider state with persistence.
- **Agent Integration**: Agents can interact with sandbox services via tools and chat commands using the `attach` method pattern.

## Monitoring and Debugging

- **Error Handling**: Tools and commands throw errors when required resources are missing (e.g., no active container).
- **Logging**: Actions are logged via agent's `infoLine` and `errorLine`.
- **Status Command**: `/sandbox status` shows current provider and container information.
- **Provider Commands**: Use `/sandbox provider get`, `/sandbox provider set`, and `/sandbox provider reset` to manage providers.

## Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Extending

To add new sandbox providers:

1. Create a class that implements `SandboxProvider` interface
2. Implement all required methods
3. Register the provider with `SandboxService.registerProvider()`

**Example:**

```typescript
import { SandboxProvider } from "@tokenring-ai/sandbox";

class MyCustomProvider implements SandboxProvider {
  async createContainer(options?: SandboxOptions): Promise<SandboxResult> {
    // Implementation
  }
  
  async executeCommand(containerId: string, command: string): Promise<ExecuteResult> {
    // Implementation
  }
  
  async stopContainer(containerId: string): Promise<void> {
    // Implementation
  }
  
  async getLogs(containerId: string): Promise<LogsResult> {
    // Implementation
  }
  
  async removeContainer(containerId: string): Promise<void> {
    // Implementation
  }
}
```

## License

MIT License - see LICENSE file for details.
