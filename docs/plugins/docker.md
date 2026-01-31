# @tokenring-ai/docker

## Overview

The `@tokenring-ai/docker` package provides AI agents with Docker integration capabilities, enabling container orchestration and secure container execution within the Token Ring ecosystem. It supports both ephemeral container execution for one-off commands and persistent container management through the sandbox system.

## Key Features

- **Ephemeral Container Execution**: Run one-off commands in temporary containers with automatic cleanup
- **Persistent Container Management**: Create and manage long-running containers via SandboxProvider
- **TLS/SSL Support**: Secure Docker daemon connections with certificate-based authentication
- **Multiple Docker Hosts**: Support for local Unix sockets and remote TCP connections
- **Agent Integration**: Seamless integration with Token Ring's agent and service architecture

## Installation

```bash
bun install @tokenring-ai/docker
```

## Plugin Registration

Register the plugin in your application configuration:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {SandboxService} from "@tokenring-ai/sandbox";
import {SandboxServiceConfigSchema} from "@tokenring-ai/sandbox/schema";
import {z} from "zod";
import DockerSandboxProvider from "./DockerSandboxProvider.ts";
import DockerService from "./DockerService.ts";
import packageJSON from './package.json' with {type: 'json'};
import {DockerConfigSchema} from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  docker: DockerConfigSchema.optional(),
  sandbox: SandboxServiceConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (!config.docker) return;
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    const dockerService = new DockerService(config.docker);
    app.addServices(dockerService);

    if (config.sandbox) {
      app.waitForService(SandboxService, sandboxService => {
        for (const name in config.sandbox!.providers) {
          const provider = config.sandbox!.providers[name];
          if (provider.type === "docker") {
            sandboxService.registerProvider(name, new DockerSandboxProvider(dockerService));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Service Registration

Alternatively, register the service directly:

```typescript
import {DockerService, DockerSandboxProvider} from "./index.ts";
import {SandboxService} from "@tokenring-ai/sandbox";

const dockerService = new DockerService({
  host: "unix:///var/run/docker.sock",
});

app.addServices(dockerService);

app.waitForService(SandboxService, sandboxService => {
  sandboxService.registerProvider("docker", new DockerSandboxProvider(dockerService));
});
```

## Core Components

### DockerService

The `DockerService` class provides the core Docker configuration and command building functionality.

#### Constructor Parameters

```typescript
interface DockerConfig {
  host?: string;                    // Docker daemon address (e.g., "unix:///var/run/docker.sock")
  tls?: {
    verify?: boolean;              // Enable TLS verification (default: false)
    caCert?: string;               // Path to CA certificate
    cert?: string;                 // Path to client certificate
    key?: string;                  // Path to client key
  };
}
```

#### Methods

- **`buildDockerCmd(): string`** - Builds the complete Docker CLI command with host and TLS settings

#### Example

```typescript
import DockerService from "@tokenring-ai/docker/DockerService";

const dockerService = new DockerService({
  host: "unix:///var/run/docker.sock",
  tls: {
    verify: true,
    caCert: "/path/to/ca.crt",
    cert: "/path/to/client.crt",
    key: "/path/to/client.key",
  },
});

const dockerCmd = dockerService.buildDockerCmd();
// Returns: "docker --tls --tlscacert=/path/to/ca.crt --tlscert=/path/to/client.crt --tlskey=/path/to/client.key"
```

### DockerSandboxProvider

Implements `SandboxProvider` to manage persistent Docker containers that can execute multiple commands over time.

#### Constructor Parameters

```typescript
constructor(readonly dockerService: DockerService)
```

#### Methods

- **`createContainer(options): Promise<SandboxResult>`** - Create a new persistent container
- **`executeCommand(containerId, command): Promise<ExecuteResult>`** - Execute a command in a running container
- **`stopContainer(containerId): Promise<void>`** - Stop a running container
- **`getLogs(containerId): Promise<LogsResult>`** - Get container logs
- **`removeContainer(containerId): Promise<void>`** - Remove a container

#### SandboxOptions

```typescript
interface SandboxOptions {
  image?: string;                  // Docker image (default: "ubuntu:latest")
  workingDir?: string;            // Working directory inside the container
  environment?: Record<string, string>;  // Environment variables
  timeout?: number;               // Timeout in seconds (default: 30)
}
```

#### Example

```typescript
import {DockerSandboxProvider, DockerService} from "@tokenring-ai/docker";

const dockerService = new DockerService({});
const provider = new DockerSandboxProvider(dockerService);

// Create a persistent container
const { containerId } = await provider.createContainer({
  image: "python:3.9",
  environment: { PYTHONPATH: "/app" },
  workingDir: "/app"
});

// Execute multiple commands
const result = await provider.executeCommand(
  containerId,
  "python -c 'print(\"Hello from container\")'"
);

console.log(result.stdout);

// Clean up
await provider.stopContainer(containerId);
await provider.removeContainer(containerId);
```

## Available Tools

### Currently Exported Tools

Only the following tool is currently exported via the `tools.ts` file:

#### docker_dockerRun

Execute a shell command in an ephemeral Docker container that is automatically removed after execution.

**Tool Name**: `docker_dockerRun`

**Description**: Runs a shell command in an ephemeral Docker container (docker run --rm). Returns the result (stdout, stderr, exit code). The base directory for the project is bind mounted at `/workdir`, and the working directory of the container is set to `/workdir`.

**Input Schema**:

```typescript
{
  image: string;          // Docker image name (e.g., ubuntu:latest)
  cmd: string;            // Command to run in the container (e.g., 'ls -l /')
  timeoutSeconds?: number; // Timeout for the command, in seconds (default: 60)
}
```

**Example**:

```typescript
import {Agent} from "@tokenring-ai/agent";
import * as tools from "@tokenring-ai/docker/tools";

const agent = new Agent(registry);
const result = await tools.dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "ls -la /usr/bin",
  timeoutSeconds: 30
}, agent);

if (result.ok) {
  console.log("Command output:", result.stdout);
} else {
  console.error("Error:", result.stderr);
}
```

**Implementation Details**:
- Uses `docker run --rm` for ephemeral containers
- Binds project directory to `/workdir` in container
- Sets working directory to `/workdir`
- Supports custom timeouts (clamped between 5 and 600 seconds)
- Supports custom Docker host and TLS settings via DockerService
- Requires FileSystemService to execute commands on the host
- Requires DockerService to access Docker daemon configuration

## Configuration

### Plugin Configuration

```typescript
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({
  docker: DockerConfigSchema.optional(),
  sandbox: SandboxServiceConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (!config.docker) return;
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    const dockerService = new DockerService(config.docker);
    app.addServices(dockerService);

    if (config.sandbox) {
      app.waitForService(SandboxService, sandboxService => {
        for (const name in config.sandbox!.providers) {
          const provider = config.sandbox!.providers[name];
          if (provider.type === "docker") {
            sandboxService.registerProvider(name, new DockerSandboxProvider(dockerService));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### DockerService Configuration

```typescript
const DockerConfigSchema = z.object({
  host: z.string().optional(),
  tls: z.object({
    verify: z.boolean().default(false),
    caCert: z.string().optional(),
    cert: z.string().optional(),
    key: z.string().optional(),
  }).optional(),
});
```

### Sandbox Configuration

```typescript
const SandboxServiceConfigSchema = z.object({
  providers: z.record(z.object({
    type: z.literal("docker"),
    config: DockerConfigSchema,
  })),
});
```

## Usage Examples

### 1. Ephemeral Container Execution

```typescript
import {Agent} from "@tokenring-ai/agent";
import * as tools from "@tokenring-ai/docker/tools";

const agent = new Agent(registry);
const result = await tools.dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "ls -la /usr/bin",
  timeoutSeconds: 30
}, agent);

if (result.ok) {
  console.log("Command output:", result.stdout);
} else {
  console.error("Error:", result.stderr);
}
```

### 2. Persistent Container Management

```typescript
import DockerSandboxProvider from "./DockerSandboxProvider";
import DockerService from "./DockerService";

const dockerService = new DockerService({});
const provider = new DockerSandboxProvider(dockerService);

// Create a persistent container
const { containerId } = await provider.createContainer({
  image: "node:18",
  environment: { NODE_ENV: "production" },
  workingDir: "/app"
});

// Execute multiple commands
const commands = [
  "bun install",
  "bun run build",
  "bun test"
];

for (const cmd of commands) {
  const result = await provider.executeCommand(containerId, cmd);
  console.log(`${cmd}:`, result.stdout);
}

// Clean up
await provider.stopContainer(containerId);
await provider.removeContainer(containerId);
```

## Integration

### Agent Integration

The package integrates seamlessly with Token Ring agents:

```typescript
import {Agent} from "@tokenring-ai/agent";
import * as tools from "@tokenring-ai/docker/tools";

const agent = new Agent(registry);

// Use Docker tools directly
const result = await tools.dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "echo 'Hello from Docker'",
  timeoutSeconds: 30
}, agent);
```

### Service Integration

Register services with the Token Ring application:

```typescript
import {DockerService, DockerSandboxProvider} from "./index.ts";
import {SandboxService} from "@tokenring-ai/sandbox";

const dockerService = new DockerService({
  host: "unix:///var/run/docker.sock",
});

app.addServices(dockerService);

app.waitForService(SandboxService, sandboxService => {
  sandboxService.registerProvider("docker", new DockerSandboxProvider(dockerService));
});
```

### Plugin Integration

The plugin automatically registers tools and services:

```typescript
import packageJSON from './package.json' with {type: 'json'};

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (!config.docker) return;
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    const dockerService = new DockerService(config.docker);
    app.addServices(dockerService);

    if (config.sandbox) {
      app.waitForService(SandboxService, sandboxService => {
        for (const name in config.sandbox!.providers) {
          const provider = config.sandbox!.providers[name];
          if (provider.type === "docker") {
            sandboxService.registerProvider(name, new DockerSandboxProvider(dockerService));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Best Practices

### Container Management

1. **Use Persistent Containers for Long-Running Workloads**: Create containers once and reuse them for multiple commands
2. **Always Clean Up**: Use `stopContainer` and `removeContainer` to prevent resource leaks
3. **Set Appropriate Timeouts**: Configure timeouts based on expected operation duration
4. **Use Environment Variables**: Pass sensitive data via environment variables rather than command arguments

### Image Management

1. **Build with Caching**: Use `noCache` only when necessary for debugging
2. **Tag Images Properly**: Use semantic versioning for image tags
3. **Prune Regularly**: Use pruning commands to reclaim disk space
4. **Authenticate Securely**: Use proper authentication for Docker registries

### Security

1. **Use TLS for Remote Connections**: Enable TLS verification when connecting to remote Docker daemons
2. **Validate Input**: All tools validate inputs using Zod schemas
3. **Limit Container Privileges**: Use `--privileged` only when necessary
4. **Secure Credentials**: Never hardcode credentials; use environment variables or secure storage

### Error Handling

1. **Check Result Status**: Always check `result.ok` before accessing output
2. **Handle Exit Codes**: Use `result.exitCode` for detailed error information
3. **Log Errors**: Use `agent.errorMessage()` for error reporting
4. **Implement Retries**: Consider retry logic for transient failures

## Testing

### Basic Test Setup

```typescript
import {describe, expect, it} from 'vitest';
import {Agent} from '@tokenring-ai/agent';
import * as tools from '@tokenring-ai/docker/tools';

describe('dockerRun', () => {
  it('should execute command in container', async () => {
    const agent = new Agent(registry);
    const result = await tools.dockerRun.execute({
      image: 'alpine:latest',
      cmd: 'echo "Hello World"',
      timeoutSeconds: 30
    }, agent);

    expect(result.ok).toBe(true);
    expect(result.stdout).toContain('Hello World');
  });
});
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

## Dependencies

The package depends on:

- **@tokenring-ai/app**: Base application framework
- **@tokenring-ai/chat**: Chat and tool management
- **@tokenring-ai/agent**: Agent orchestration
- **@tokenring-ai/filesystem**: File system operations
- **@tokenring-ai/sandbox**: Sandbox service integration
- **@tokenring-ai/utility**: Shared utilities
- **execa**: Process execution
- **zod**: Schema validation

## License

MIT License - see the root LICENSE file for details.

## Related Components

- [DockerService](./docker.md) - Core Docker configuration service
- [DockerSandboxProvider](./docker.md) - Persistent container management
- [Plugin Configuration](./docker.md) - Token Ring plugin integration
- [Schema Definitions](./docker.md) - Configuration schemas
- [Type Definitions](./docker.md) - Shared interfaces
