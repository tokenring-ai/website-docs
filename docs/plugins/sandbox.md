# Sandbox Plugin

Abstract interface for managing sandboxed environments with container lifecycle and command execution.

## Overview

The `@tokenring-ai/sandbox` package provides an abstract interface for managing sandboxed environments within the Token Ring AI agent system. It enables the creation, execution, and management of isolated containers (e.g., via Docker or similar providers) to safely run commands or code.

## Key Features

- **Abstract Provider Interface**: Extensible for multiple sandbox backends (Docker, Kubernetes, etc.)
- **Container Lifecycle**: Create, stop, remove containers
- **Command Execution**: Run commands in isolated environments
- **Log Retrieval**: Access container logs
- **Service Management**: Dynamic provider registration and switching
- **Agent Integration**: Tools and chat commands for interactive control

## Core Components

### SandboxProvider (Abstract Class)

Base interface for sandbox implementations.

**Key Methods:**
- `createContainer(options?: SandboxOptions): Promise<SandboxResult>`
  - Creates a new container
  - Options: `image`, `workingDir`, `environment`, `timeout`
  - Returns: `{ containerId, status }`
- `executeCommand(containerId: string, command: string): Promise<ExecuteResult>`
  - Runs command in container
  - Returns: `{ stdout, stderr, exitCode }`
- `stopContainer(containerId: string): Promise<void>`
  - Stops the container
- `getLogs(containerId: string): Promise<LogsResult>`
  - Retrieves container logs
  - Returns: `{ logs }`
- `removeContainer(containerId: string): Promise<void>`
  - Removes the container

**Interfaces:**
```typescript
SandboxOptions: {
  image?: string;
  workingDir?: string;
  environment?: Record<string, string>;
  timeout?: number;
}

SandboxResult: { containerId: string; status: string; }
ExecuteResult: { stdout: string; stderr: string; exitCode: number; }
LogsResult: { logs: string; }
```

### SandboxService

Manages multiple providers and tracks active container.

**Key Methods:**
- `registerSandboxProvider(name, resource): void`: Register a provider
- `setActiveSandboxProviderName(name): void`: Switch active provider
- `getActiveSandboxProviderName(): string | null`: Get current provider
- `getAvailableSandboxProviders(): string[]`: List registered providers
- `setActiveContainer(containerId): void`: Set active container
- `getActiveContainer(): string | null`: Get active container
- `createContainer(options?): Promise<SandboxResult>`: Create via active provider
- `executeCommand(containerId, command): Promise<ExecuteResult>`: Execute command
- `stopContainer(containerId): Promise<void>`: Stop container
- `getLogs(containerId): Promise<LogsResult>`: Get logs
- `removeContainer(containerId): Promise<void>`: Remove container

### Tools

Agent-executable functions wrapping service methods:
- `sandbox/createContainer`: Create container with optional params
- `sandbox/executeCommand`: Run command (uses active container if unspecified)
- `sandbox/stopContainer`: Stop container
- `sandbox/getLogs`: Retrieve logs
- `sandbox/removeContainer`: Remove container

### Chat Commands

**/sandbox**: Interactive sandbox management
- `create [image]`: Create container
- `exec <command>`: Execute in active container
- `stop [containerId]`: Stop container
- `logs [containerId]`: Get logs
- `remove [containerId]`: Remove container
- `status`: Show active container/provider
- `provider [name]`: Set/show active provider

## Usage Examples

### Registering and Using a Provider

```typescript
import { Agent } from '@tokenring-ai/agent';
import { SandboxService } from '@tokenring-ai/sandbox';
import { DockerProvider } from './DockerProvider'; // Hypothetical

const agent = new Agent();
const sandboxService = new SandboxService();
const dockerProvider = new DockerProvider();

sandboxService.registerSandboxProvider('docker', dockerProvider);
agent.addService(sandboxService);

// Create and use container
const result = await sandboxService.createContainer({ image: 'ubuntu:latest' });
console.log(`Created: ${result.containerId}`);

const execResult = await sandboxService.executeCommand(result.containerId, 'ls -la');
console.log(`Stdout: ${execResult.stdout}`);

// Cleanup
await sandboxService.stopContainer(result.containerId);
await sandboxService.removeContainer(result.containerId);
```

### Using Tools in Agent Workflow

```typescript
// Agent invokes tools
await agent.executeTool('sandbox/createContainer', { image: 'node:18' });
await agent.executeTool('sandbox/executeCommand', { command: 'node --version' });
await agent.executeTool('sandbox/logs', {});
```

### Chat Command Interaction

```bash
/sandbox provider docker
/sandbox create ubuntu:latest
/sandbox exec echo "Hello Sandbox"
/sandbox logs
/sandbox remove
```

## Configuration Options

- **SandboxOptions**: Customize container creation
  - `image`: Container image (e.g., 'ubuntu:latest')
  - `workingDir`: Working directory inside container
  - `environment`: Environment variables as key-value pairs
  - `timeout`: Execution timeout in seconds
- **Active Provider/Container**: Managed via service methods
- No external config files; all via runtime registration

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework and service management
- `zod@^4.0.17`: Input validation for tools

## Implementations

See `@tokenring-ai/docker` for a concrete Docker-based sandbox implementation.

## Notes

- Abstract only—no built-in providers
- Concrete implementations must extend `SandboxProvider`
- Active container auto-set on creation for convenience
- Error handling for missing providers/containers
- Binary execution assumes text output
