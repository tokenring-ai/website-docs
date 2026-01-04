# Docker Plugin

Docker integration package for Token Ring AI agents, providing both ephemeral container execution and persistent container management capabilities.

## Overview

The `@tokenring-ai/docker` package enables AI agents to interact with Docker through a configurable service and a comprehensive set of tools for Docker operations. It supports local Docker via Unix socket, remote hosts via TCP, and optional TLS configuration for secure connections.

### Key Features

- **Ephemeral Container Execution**: Run one-off commands in temporary containers using the `dockerRun` tool
- **Persistent Container Management**: Create, manage, and execute commands in long-running containers via `DockerSandboxProvider`
- **Secure Configuration**: Service-based Docker configuration with TLS support
- **Agent Integration**: Seamless integration with Token Ring's agent ecosystem and service architecture
- **Shell Safety**: All operations use proper shell escaping and timeout management

## Installation

```bash
bun install @tokenring-ai/docker
```

## Core Components

### DockerService

**Description**: A Token Ring service that configures Docker connection parameters. It builds Docker CLI commands with proper host and TLS settings.

**Constructor Parameters**:

```typescript
interface DockerConfig &#123;
  host?: string;                    // Docker daemon address (e.g., "unix:///var/run/docker.sock")
  tls?: &#123;
    verify?: boolean;              // Default: false
    caCert?: string;               // Path to CA certificate
    cert?: string;                 // Path to client certificate
    key?: string;                  // Path to client key
  &#125;;
&#125;
```

**Key Methods**:

- `buildDockerCmd(): string` - Builds the Docker CLI command with host and TLS settings

**Properties**:

- `name = "DockerService"` - Service identifier
- `description = "Provides Docker functionality"` - Service description
- `options` - The configuration options passed to the constructor

**Example Usage**:

```typescript
import DockerService from "@tokenring-ai/docker/DockerService.ts";

const dockerService = new DockerService(&#123;
  host: "unix:///var/run/docker.sock",
  tls: &#123;
    verify: true,
    caCert: "/path/to/ca.crt",
    cert: "/path/to/client.crt",
    key: "/path/to/client.key",
  &#125;,
&#125;);

const dockerCmd = dockerService.buildDockerCmd();
// Returns: "docker --tls --tlscacert=/path/to/ca.crt --tlscert=/path/to/client.crt --tlskey=/path/to/client.key"
```

### DockerSandboxProvider

**Description**: Implements `SandboxProvider` to manage persistent Docker containers. Creates detached containers that can execute multiple commands over time.

**Constructor Parameters**:

```typescript
constructor(readonly dockerService: DockerService) &#123;&#125;
```

**Key Methods**:

- `createContainer(options: SandboxOptions): Promise&lt;SandboxResult&gt;` - Create a new persistent container
- `executeCommand(containerId: string, command: string): Promise&lt;ExecuteResult&gt;` - Execute a command in a running container
- `stopContainer(containerId: string): Promise&lt;void&gt;` - Stop a running container
- `getLogs(containerId: string): Promise&lt;LogsResult&gt;` - Get container logs
- `removeContainer(containerId: string): Promise&lt;void&gt;` - Remove a container

**SandboxOptions**:

```typescript
interface SandboxOptions &#123;
  image?: string;                  // Docker image (default: "ubuntu:latest")
  workingDir?: string;            // Working directory inside the container
  environment?: Record&lt;string, string&gt;;  // Environment variables
  timeout?: number;               // Timeout in seconds (default: 30)
&#125;
```

**Example Usage**:

```typescript
import DockerSandboxProvider from "@tokenring-ai/docker/DockerSandboxProvider.ts";
import DockerService from "@tokenring-ai/docker/DockerService.ts";

const dockerService = new DockerService(&#123;&#125;);
const provider = new DockerSandboxProvider(dockerService);

// Create a persistent container
const &#123; containerId &#125; = await provider.createContainer(&#123;
  image: "python:3.9",
  environment: &#123; PYTHONPATH: "/app" &#125;,
  workingDir: "/app"
&#125;);

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

- **dockerRun**: Execute commands in ephemeral containers (currently the only tool exported via tools.ts)

### Available Tools (Not Currently Exported)

The tools directory contains additional Docker operations that can be extended:

- **Image Management**: `buildImage`, `listImages`, `pushImage`, `tagImage`, `pruneImages`, `removeImage`
- **Container Management**: `listContainers`, `startContainer`, `stopContainer`, `removeContainer`
- **Container Operations**: `execInContainer`, `getContainerLogs`, `getContainerStats`
- **Resource Management**: `pruneVolumes`, `createNetwork`
- **Advanced Operations**: `dockerStack`, `authenticateRegistry`

## Usage Examples

### 1. Ephemeral Container Execution

```typescript
import &#123; Agent &#125; from "@tokenring-ai/agent";
import &#123; dockerRun &#125; from "@tokenring-ai/docker/tools";

const agent = new Agent(registry);
const result = await dockerRun.execute(&#123;
  image: "ubuntu:22.04",
  cmd: "ls -la /usr/bin",
  timeoutSeconds: 30
&#125;, agent);

if (result.ok) &#123;
  console.log("Command output:", result.stdout);
&#125; else &#123;
  console.error("Error:", result.stderr);
&#125;
```

### 2. Container Management

```typescript
import &#123; listContainers, execInContainer &#125; from "@tokenring-ai/docker/tools";

// List all containers
const containers = await listContainers.execute(&#123;
  all: true,
  format: "json"
&#125;, agent);

// Execute command in a running container
if (containers.containers && containers.containers.length &gt; 0) &#123;
  const containerId = containers.containers[0].Id;
  const result = await execInContainer.execute(&#123;
    container: containerId,
    command: "cat /etc/os-release",
    timeoutSeconds: 30
  &#125;, agent);

  console.log(result.stdout);
&#125;
```

### 3. Image Building

```typescript
import &#123; buildImage &#125; from "@tokenring-ai/docker/tools";

const result = await buildImage.execute(&#123;
  context: "./myapp",
  tag: "myrepo/myapp:v1.0.0",
  dockerfile: "Dockerfile",
  buildArgs: &#123; NODE_VERSION: "18" &#125;,
  noCache: true,
  timeoutSeconds: 600
&#125;, agent);

if (result.ok) &#123;
  console.log("Image built successfully:", result.tag);
&#125;
```

### 4. Persistent Container Management

```typescript
import &#123; DockerSandboxProvider &#125; from "@tokenring-ai/docker";

const provider = new DockerSandboxProvider(dockerService);

// Create a persistent container
const &#123; containerId &#125; = await provider.createContainer(&#123;
  image: "node:18",
  environment: &#123; NODE_ENV: "production" &#125;,
  workingDir: "/app"
&#125;);

// Execute multiple commands
const commands = [
  "bun install",
  "bun run build",
  "bun test"
];

for (const cmd of commands) &#123;
  const result = await provider.executeCommand(containerId, cmd);
  console.log(`$&#123;cmd&#125;:`, result.stdout);
&#125;

// Clean up
await provider.stopContainer(containerId);
await provider.removeContainer(containerId);
```

## Configuration Options

### DockerService Configuration

```typescript
const DockerConfigSchema = z.object(&#123;
  host: z.string().optional(),
  tls: z.object(&#123;
    verify: z.boolean().default(false),
    caCert: z.string().optional(),
    cert: z.string().optional(),
    key: z.string().optional(),
  &#125;).optional(),
&#125;);
```

**Configuration Options**:

- **host**: Docker daemon address (e.g., `unix:///var/run/docker.sock`, `tcp://remote:2375`)
- **tls.verify**: Enable TLS verification (default: false)
- **tls.caCert**: Path to CA certificate file
- **tls.cert**: Path to client certificate file
- **tls.key**: Path to client key file

### Plugin Configuration

```typescript
const packageConfigSchema = z.object(&#123;
  docker: DockerConfigSchema.optional(),
  sandbox: SandboxServiceConfigSchema.optional(),
&#125;);
```

### Tool-Specific Configuration

- **Timeouts**: Automatically clamped per tool (5-600s for most operations, up to 1800s for builds)
- **Output Formats**: JSON for structured data, table for human-readable output
- **Shell Escaping**: Automatic shell escaping for all command arguments
- **Buffer Management**: Configurable maxBuffer sizes per operation

## API Reference

### Public Exports

```typescript
// Main service and provider
export &#123; default as DockerService &#125; from "./DockerService.ts";
export &#123; default as DockerSandboxProvider &#125; from "./DockerSandboxProvider.ts";

// Configuration schema
export &#123; DockerConfigSchema &#125; from "./schema.ts";

// Currently exported tools
export default from "./tools.ts";

// Types
export &#123; DockerCommandResult &#125; from "./types.ts";
```

### DockerCommandResult Interface

```typescript
interface DockerCommandResult &#123;
  ok?: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
&#125;
```

### Tool Interface

All tools follow this pattern:

```typescript
interface TokenRingToolDefinition&lt;T = z.ZodType&gt; &#123;
  name: string;                    // Tool name (e.g., "docker_dockerRun")
  description: string;            // Tool description
  inputSchema: T;                 // Zod schema for input validation
  execute: (args: any, agent: Agent) =&gt; Promise&lt;DockerCommandResult&gt;;
&#125;
```

## Plugin Integration

The package automatically integrates with Token Ring applications:

```typescript
// In plugin.ts
import &#123; TokenRingPlugin &#125; from "@tokenring-ai/app";
import &#123; ChatService &#125; from "@tokenring-ai/chat";
import &#123; SandboxService &#125; from "@tokenring-ai/sandbox";
import &#123; SandboxServiceConfigSchema &#125; from "@tokenring-ai/sandbox/schema";
import &#123; z &#125; from "zod";
import DockerSandboxProvider from "./DockerSandboxProvider.ts";
import DockerService from "./DockerService.ts";
import packageJSON from './package.json' with &#123;type: 'json'&#125;;
import &#123; DockerConfigSchema &#125; from "./schema.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object(&#123;
  docker: DockerConfigSchema.optional(),
  sandbox: SandboxServiceConfigSchema.optional(),
&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    if (! config.docker) return;
    app.waitForService(ChatService, chatService =&gt;
      chatService.addTools(packageJSON.name, tools)
    );
    const dockerService = new DockerService(config.docker);
    app.addServices(dockerService);

    if (config.sandbox) &#123;
      app.waitForService(SandboxService, sandboxService =&gt; &#123;
        for (const name in config.sandbox!.providers) &#123;
          const provider = config.sandbox!.providers[name];
          if (provider.type === "docker") &#123;
            sandboxService.registerProvider(name, new DockerSandboxProvider(dockerService));
          &#125;
        &#125;
      &#125;);
    &#125;
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
```

### Integration Example

```typescript
import &#123; TokenRingApp &#125; from "@tokenring-ai/app";
import dockerPlugin from "@tokenring-ai/docker";

const app = new TokenRingApp();
app.use(dockerPlugin, &#123;
  docker: &#123;
    host: "unix:///var/run/docker.sock",
    tls: &#123;
      verify: false,
      caCert: "/path/to/ca.crt",
      cert: "/path/to/client.crt",
      key: "/path/to/client.key",
    &#125;,
  &#125;,
  sandbox: &#123;
    providers: &#123;
      myDocker: &#123;
        type: "docker",
      &#125;,
    &#125;,
  &#125;,
&#125;);
```

## Development and Testing

### Testing

The package uses vitest for testing:

```bash
bun test
```

### Build

```bash
bun run build
```

### Linting

```bash
bun run eslint
```

## Limitations and Considerations

- **Docker CLI Dependency**: Requires Docker CLI installed on the host system
- **Unix Socket Permissions**: Local Docker access requires appropriate user permissions
- **Network Access**: Remote Docker hosts require network connectivity
- **Buffer Limits**: Large outputs may hit `maxBuffer` limits (configurable per tool)
- **Error Handling**: Tools throw exceptions on failure; implement proper error handling in agent workflows
- **Security**: All commands are executed via shell; ensure proper input validation and sanitization
- **JavaScript Tools**: Some tools are written in JavaScript and may need to be migrated to TypeScript

## Best Practices

1. **Use Ephemeral Containers**: For isolated, one-off operations
2. **Persistent Containers**: For stateful, long-running tasks
3. **Input Validation**: Leverage Zod schemas for all tool inputs
4. **Timeout Management**: Set appropriate timeouts for operations
5. **Error Handling**: Implement comprehensive error handling in agent workflows
6. **Resource Management**: Clean up resources after use to prevent leaks
7. **Shell Escaping**: Always use shellEscape utility for user-provided input

## Related Components

- `@tokenring-ai/sandbox` - Sandbox provider interface and service
- `@tokenring-ai/filesystem` - File system service used by dockerRun tool
- `@tokenring-ai/chat` - Chat service for tool registration
- `@tokenring-ai/agent` - Agent system that uses Docker tools
