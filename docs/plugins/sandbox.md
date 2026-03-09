# @tokenring-ai/sandbox

## Overview

The `@tokenring-ai/sandbox` package provides an abstract interface for managing sandboxed environments within the Token Ring AI agent system. It enables the creation, execution, and management of isolated containers (e.g., via Docker or similar providers) to safely run commands or code. The package acts as a service layer that abstracts provider-specific details, allowing multiple sandbox providers to be registered and switched dynamically.

## Key Features

- Abstract Provider Interface for extensibility (Docker, Kubernetes, etc.)
- Multi-Provider Support with dynamic switching
- Label-Based Container Management for easier referencing
- Agent State Integration with persistence and transfer capabilities
- Tool Registration for agent execution
- Chat Command Support for interactive control
- Service Architecture implementing TokenRingService
- KeyedRegistry Pattern for provider management

## Core Components

### SandboxProvider Interface

The `SandboxProvider` interface defines the contract for any concrete sandbox implementation. It defines methods for container lifecycle and execution.

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

| Interface | Description |
|-----------|-------------|
| `SandboxOptions` | Options for container creation |
| `SandboxResult` | Result of container creation |
| `ExecuteResult` | Result of command execution |
| `LogsResult` | Result of log retrieval |

### SandboxService

The `SandboxService` manages multiple providers and tracks the active container with label-to-container ID mapping. It implements `TokenRingService` for integration with agents.

**Key Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `registerProvider(name, resource)` | `name: string`, `resource: SandboxProvider` | `void` | Registers a provider |
| `getAvailableProviders()` | - | `string[]` | Lists registered providers |
| `attach(agent)` | `agent: Agent` | `void` | Attaches service to agent and initializes state |
| `requireActiveProvider(agent)` | `agent: Agent` | `SandboxProvider` | Gets active provider or throws error |
| `getActiveProvider(agent)` | `agent: Agent` | `SandboxProvider \| null` | Gets active provider or returns null |
| `setActiveProvider(name, agent)` | `name: string`, `agent: Agent` | `void` | Sets the active provider |
| `getActiveContainer(agent)` | `agent: Agent` | `string \| null` | Gets active container label |
| `setActiveContainer(containerId, agent)` | `containerId: string`, `agent: Agent` | `void` | Sets the active container |
| `createContainer(options, agent)` | `options: SandboxOptions`, `agent: Agent` | `Promise<SandboxResult>` | Creates a container |
| `executeCommand(label, command, agent)` | `label: string`, `command: string`, `agent: Agent` | `Promise<ExecuteResult>` | Executes a command |
| `stopContainer(label, agent)` | `label: string`, `agent: Agent` | `Promise<void>` | Stops a container |
| `getLogs(label, agent)` | `label: string`, `agent: Agent` | `Promise<LogsResult>` | Retrieves logs |
| `removeContainer(label, agent)` | `label: string`, `agent: Agent` | `Promise<void>` | Removes a container |

### SandboxState

The `SandboxState` class manages agent state for sandbox operations, implementing `AgentStateSlice`.

**State Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `string \| null` | Current active provider name |
| `activeContainer` | `string \| null` | Current active container label |
| `labelToContainerId` | `Map<string, string>` | Maps labels to container IDs |
| `initialConfig` | `z.output<typeof SandboxAgentConfigSchema>` | Initial configuration with provider |

**State Methods:**

- `transferStateFromParent(parent: Agent): void` - Transfers state from parent agent
- `serialize(): object` - Serializes state for persistence
- `deserialize(data: any): void` - Deserializes persisted state
- `show(): string[]` - Returns state summary strings

## Services

### SandboxService

The `SandboxService` is the core service implementation that manages sandbox operations. It implements the `TokenRingService` interface and integrates with the Token Ring agent system.

**Service Name:** `SandboxService`

**Description:** Abstract interface for sandbox operations

**Integration:** The service is attached to agents via the `attach()` method, which initializes agent state with the `SandboxState` class.

**Configuration:** The service accepts configuration via `SandboxServiceConfigSchema` which includes provider definitions and agent defaults.

## Providers

### Provider Architecture

The sandbox package uses a provider-based architecture with the `KeyedRegistry` pattern for managing multiple sandbox providers.

**Current Provider:**

| Provider Name | Description | Package |
|---------------|-------------|---------|
| `docker` | Docker container provider | `@tokenring-ai/docker` |

### Provider Interface

The `SandboxProvider` interface defines the contract for all sandbox implementations:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createContainer(options)` | `options?: SandboxOptions` | `Promise<SandboxResult>` | Creates a new container |
| `executeCommand(containerId, command)` | `containerId: string`, `command: string` | `Promise<ExecuteResult>` | Executes a command in the container |
| `stopContainer(containerId)` | `containerId: string` | `Promise<void>` | Stops the container |
| `getLogs(containerId)` | `containerId: string` | `Promise<LogsResult>` | Retrieves container logs |
| `removeContainer(containerId)` | `containerId: string` | `Promise<void>` | Removes the container |

### Provider Registration

Providers are registered through the plugin configuration or programmatically via `SandboxService.registerProvider()`.

**Plugin Configuration:**

```typescript
app.install(sandboxPlugin, {
  sandbox: {
    providers: {
      docker: {
        type: "docker",
        // Docker-specific configuration
      }
    },
    agentDefaults: {
      provider: "docker"
    }
  }
});
```

**Programmatic Registration:**

```typescript
import { SandboxService } from "@tokenring-ai/sandbox";
import { DockerSandboxProvider } from "@tokenring-ai/docker";

const sandboxService = new SandboxService({
  providers: {},
  agentDefaults: { provider: "docker" }
});

sandboxService.registerProvider('docker', new DockerSandboxProvider());
```

### KeyedRegistry Pattern

The `KeyedRegistry` pattern is used for managing sandbox providers. This pattern provides:

- **Registration:** Providers are registered with a unique name
- **Lookup:** Providers can be retrieved by name
- **Validation:** The `requireItemByName()` method throws an error if the provider doesn't exist
- **Listing:** `getAllItemNames()` returns all registered provider names

## RPC Endpoints

The sandbox package does not define any RPC endpoints.

## Chat Commands

The package provides the `/sandbox` command for interactive control in agent chats.

### Available Commands

| Command | Description |
|---------|-------------|
| `/sandbox create <label> [image]` | Create a new container with label and optional image |
| `/sandbox exec <command>` | Execute command in active container |
| `/sandbox stop [label]` | Stop container (uses active if unspecified) |
| `/sandbox logs [label]` | Get container logs (uses active if unspecified) |
| `/sandbox remove [label]` | Remove container (uses active if unspecified) |
| `/sandbox status` | Show active container and provider |
| `/sandbox provider get` | Show current provider |
| `/sandbox provider set <name>` | Set provider by name |
| `/sandbox provider reset` | Reset to initial provider |
| `/sandbox provider select` | Interactively select provider from available list |

### Command Usage Examples

```
/sandbox create myapp ubuntu:22.04
/sandbox exec ls -la /app
/sandbox logs
/sandbox stop
/sandbox status
/sandbox provider set docker
/sandbox provider select
```

## Configuration

### Plugin Configuration Schema

The plugin configuration is defined in `schema.ts` with the following structure:

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

### Configuration Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `providers` | `Record<string, { type: string }>` | No | `{}` | Provider configurations |
| `agentDefaults` | `object` | No | `{ provider: string }` | Default provider for agents |

### Example Configuration

```typescript
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

### SandboxOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | `string` | No | Container label for reference |
| `image` | `string` | No | Container image (e.g., 'ubuntu:latest') |
| `workingDir` | `string` | No | Working directory in container |
| `environment` | `Record<string, string>` | No | Environment variables |
| `timeout` | `number` | No | Timeout in seconds |

## Integration

The sandbox package integrates with the Token Ring agent system through the following patterns:

- **Service Registration:** The plugin registers as a `TokenRingPlugin`, adding the `SandboxService` to the application.
- **Chat Commands:** The `/sandbox` command is added to the agent's command list via `AgentCommandService`.
- **Tool Registration:** Tools are registered via the `ChatService` for agent execution.
- **State Management:** The `SandboxState` slice manages active container and provider state with persistence and transfer capabilities.
- **Agent Integration:** Agents can interact with sandbox services via tools and chat commands using the `attach()` method pattern.

### Integration with Agent System

The service integrates with agents through the `attach()` method, which:

1. Merges agent-specific configuration with service defaults
2. Initializes the `SandboxState` with the agent's configuration
3. Enables provider selection and container management per agent

## Tools

The package provides the following tools for agent execution:

| Tool Name | Description | Input Schema | Return Type |
|-----------|-------------|--------------|-------------|
| `sandbox_createContainer` | Creates a new sandbox container with optional parameters | `label`, `image`, `workingDir`, `environment`, `timeout` | `TokenRingToolJSONResult<{ containerId: string; status: string }>` |
| `sandbox_executeCommand` | Executes a command in a container (uses active if unspecified) | `label` (optional), `command` | `TokenRingToolJSONResult<{ stdout: string; stderr: string; exitCode: number }>` |
| `sandbox_stopContainer` | Stops a container (uses active if unspecified) | `label` (optional) | `TokenRingToolJSONResult<{ success: boolean }>` |
| `sandbox_getLogs` | Gets container logs (uses active if unspecified) | `label` (optional) | `TokenRingToolJSONResult<{ logs: string }>` |
| `sandbox_removeContainer` | Removes a container (uses active if unspecified) | `label` (optional) | `TokenRingToolJSONResult<{ success: boolean }>` |

### Tool Usage Example

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

## State Management

The `SandboxState` class manages agent state for sandbox operations, implementing the `AgentStateSlice` interface.

### State Properties

- `provider: string | null` - Current active provider name
- `activeContainer: string | null` - Current active container label
- `labelToContainerId: Map<string, string>` - Maps labels to container IDs
- `initialConfig: z.output<typeof SandboxAgentConfigSchema>` - Initial configuration

### State Persistence

The state is serialized and deserialized using a Zod schema:

```typescript
const serializationSchema = z.object({
  provider: z.string().nullable(),
  activeContainer: z.string().nullable(),
  labelToContainerId: z.array(z.tuple([z.string(), z.string()]))
});
```

**Serialization:**

```typescript
serialize(): z.output<typeof serializationSchema> {
  return {
    provider: this.provider,
    activeContainer: this.activeContainer,
    labelToContainerId: Array.from(this.labelToContainerId.entries()),
  };
}
```

**Deserialization:**

```typescript
deserialize(data: z.output<typeof serializationSchema>): void {
  this.provider = data.provider;
  this.activeContainer = data.activeContainer;
  this.labelToContainerId = new Map(data.labelToContainerId);
}
```

### State Transfer

The `transferStateFromParent()` method enables state transfer from parent agents, which is useful for agent teams:

```typescript
transferStateFromParent(parent: Agent): void {
  const parentState = parent.getState(SandboxState);
  this.provider = parentState.provider;
  this.activeContainer = parentState.activeContainer;
  this.labelToContainerId = new Map(parentState.labelToContainerId);
}
```

### State Display

The `show()` method returns a human-readable state summary:

```typescript
show(): string[] {
  return [
    `Active Provider: ${this.provider}`,
    `Active Container: ${this.activeContainer ?? "(none)"}`,
  ];
}
```

## Usage Examples

### 1. Plugin Registration

The package is designed as a Token Ring plugin. It automatically registers tools and chat commands when installed:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import sandboxPlugin from "@tokenring-ai/sandbox";

const app = new TokenRingApp();
app.install(sandboxPlugin, {
  sandbox: {
    providers: {
      docker: { type: "docker" }
    },
    agentDefaults: {
      provider: "docker"
    }
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

### 3. Provider Switching

```typescript
// List available providers
const providers = sandboxService.getAvailableProviders();

// Set active provider
sandboxService.setActiveProvider('docker', agent);

// Create container with active provider
const container = await sandboxService.createContainer({ label: 'test' }, agent);
```

### 4. Label-Based Container Management

```typescript
// Create container with label
await sandboxService.createContainer({ label: 'myapp' }, agent);

// Execute command using label
await sandboxService.executeCommand('myapp', 'ls -la', agent);

// Stop container using label
await sandboxService.stopContainer('myapp', agent);
```

## Error Handling

The package throws errors in various scenarios:

- **No Active Provider**: When attempting to perform operations without an active provider set
  ```
  [SandboxService] No active provider set
  ```

- **No Container Specified**: When a tool or command requires a container but none is specified and no active container exists
  ```
  [sandbox_executeCommand] No container specified and no active container
  ```

- **Command Failed**: When a command executes with a non-zero exit code, the tool returns the exit code but does not throw

- **Provider Not Found**: When attempting to set a provider that is not registered
  ```
  Provider "docker" not found. Available providers: kubernetes
  ```

- **No Initial Provider**: When attempting to reset to an initial provider that was not configured
  ```
  No initial provider configured
  ```

## Best Practices

- **Label Management:** Use descriptive labels for containers to make referencing easier
- **Provider Selection:** Set the active provider before creating containers
- **State Persistence:** Leverage agent state management for maintaining container references across sessions
- **Error Handling:** Always check for active containers before executing commands
- **Resource Cleanup:** Use `removeContainer` to clean up containers when finished
- **Label Uniqueness:** Ensure labels are unique to avoid conflicts in the label-to-container mapping

## Testing and Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Testing with Coverage

```bash
bun run test:coverage
```

### Testing with Watch Mode

```bash
bun run test:watch
```

### Extending

To add new sandbox providers:

1. Create a class that implements `SandboxProvider` interface
2. Implement all required methods
3. Register the provider with `SandboxService.registerProvider()`
4. Add provider type handling in `plugin.ts` if using plugin registration

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

## Dependencies

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/chat` | 0.2.0 | Chat service integration |
| `@tokenring-ai/docker` | 0.2.0 | Docker provider implementation |
| `@tokenring-ai/agent` | 0.2.0 | Agent system integration |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions |
| `zod` | ^4.3.6 | Schema validation |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.0.18 | Testing framework |
| `typescript` | ^5.9.3 | Type checking |

## Related Components

- `@tokenring-ai/docker`: Docker provider implementation for sandbox
- `@tokenring-ai/agent`: Agent system for integration
- `@tokenring-ai/chat`: Chat service for tool and command integration
- `@tokenring-ai/app`: Application framework for plugin registration

## License

MIT License - see `LICENSE` file for details.

Copyright (c) 2025 Mark Dierolf
