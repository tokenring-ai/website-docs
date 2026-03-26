# @tokenring-ai/docker

## Overview

The `@tokenring-ai/docker` package provides AI agents with comprehensive Docker integration capabilities, enabling container orchestration, image management, and secure container execution within the Token Ring ecosystem. It supports both ephemeral container execution for one-off commands and persistent container management through the sandbox system.

### Key Features

- **Ephemeral Container Execution**: Run one-off commands in temporary containers with automatic cleanup
- **Persistent Container Management**: Create and manage long-running containers via DockerSandboxProvider
- **TLS/SSL Support**: Secure Docker daemon connections with certificate-based authentication
- **Multiple Docker Hosts**: Support for local Unix sockets and remote TCP connections
- **Agent Integration**: Seamless integration with Token Ring's agent and service architecture
- **Comprehensive Toolset**: 18 Docker tools for managing images, containers, networks, and more
- **Shell Safety**: All operations use proper shell escaping and timeout management
- **Workdir Bind Mount**: Ephemeral containers automatically bind mount the project directory at `/workdir`

## Installation

```bash
bun install @tokenring-ai/docker
```

## Key Features

- **Ephemeral Container Execution**: Run one-off commands in temporary containers with automatic cleanup via `docker_dockerRun`
- **Persistent Container Management**: Create and manage long-running containers via `DockerSandboxProvider`
- **TLS/SSL Support**: Secure Docker daemon connections with certificate-based authentication
- **Multiple Docker Hosts**: Support for local Unix sockets (`unix:///var/run/docker.sock`) and remote TCP connections (`tcp://remote:2375`)
- **Agent Integration**: Seamless integration with Token Ring's agent and service architecture
- **18 Docker Tools**: Comprehensive toolset for container, image, network, and registry management
- **Shell Safety**: All operations use proper shell escaping via `@tokenring-ai/utility/string/shellEscape`
- **Workdir Bind Mount**: Ephemeral containers automatically bind mount the project directory at `/workdir`

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

#### Properties

- **`name = "DockerService"`** - Service identifier
- **`description = "Provides Docker functionality"`** - Service description
- **`options`** - The configuration options passed to the constructor

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
// Returns: "docker -H unix:///var/run/docker.sock --tls --tlscacert=/path/to/ca.crt --tlscert=/path/to/client.crt --tlskey=/path/to/client.key"
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

## Services

### DockerService

The `DockerService` is a Token Ring service that manages Docker configuration and provides utility methods for building Docker commands.

**Registration**:

```typescript
import {DockerService} from "@tokenring-ai/docker";

const dockerService = new DockerService({
  host: "unix:///var/run/docker.sock",
});

app.addServices(dockerService);
```

## Tools

The package provides 18 Docker tools for comprehensive container and image management. Each tool follows the TokenRing tool pattern with proper input validation, error handling, and agent integration.

### Exported Tools

All tools are exported from `tools.ts` and can be imported individually or as a group:

```typescript
import tools from "@tokenring-ai/docker/tools";
// or import individually
import {dockerRun, listContainers, buildImage} from "@tokenring-ai/docker/tools";
```

The following tools are available:

#### Docker Container Management

- **docker_dockerRun** - Run ephemeral containers with bind mounts
- **docker_listContainers** - List Docker containers
- **docker_startContainer** - Start a container
- **docker_stopContainer** - Stop a container
- **docker_removeContainer** - Remove a container
- **docker_execInContainer** - Execute command in running container

#### Docker Image Management

- **docker_listImages** - List Docker images
- **docker_buildImage** - Build Docker images from Dockerfile
- **docker_removeImage** - Remove an image
- **docker_tagImage** - Tag an image
- **docker_pushImage** - Push an image to registry

#### Docker Network Management

- **docker_createNetwork** - Create a Docker network

#### Docker Stack Management

- **docker_dockerStack** - Run Docker Compose stacks in Swarm mode

#### Docker Logging and Stats

- **docker_getContainerLogs** - Get container logs
- **docker_getContainerStats** - Get container statistics

#### Docker Registry

- **docker_authenticateRegistry** - Authenticate with Docker registry

#### Docker Pruning

- **docker_pruneImages** - Remove unused images
- **docker_pruneVolumes** - Remove unused volumes

### Tool Reference

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
import dockerRun from "@tokenring-ai/docker/tools/dockerRun";

const agent = new Agent(registry);
const result = await dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "ls -la /usr/bin",
  timeoutSeconds: 30
}, agent);

if (result.data.ok) {
  console.log("Command output:", result.data.stdout);
} else {
  console.error("Error:", result.data.stderr);
}
```

#### docker_listContainers

List Docker containers with optional filtering and formatting.

**Parameters**:
- `all` (boolean, optional): Whether to show all containers (default: false)
- `quiet` (boolean, optional): Whether to only display container IDs (default: false)
- `limit` (number, optional): Number of containers to show
- `filter` (string, optional): Filter output based on conditions
- `size` (boolean, optional): Display total file sizes (default: false)
- `format` (string, optional): Format the output (json or table, default: "json")
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import listContainers from "@tokenring-ai/docker/tools/listContainers";

const result = await listContainers.execute(
  { all: true, format: "json" },
  agent
);
```

#### docker_listImages

List Docker images with optional filtering and formatting.

**Parameters**:
- `all` (boolean, optional): Whether to show all images (default: false)
- `quiet` (boolean, optional): Whether to only display image IDs (default: false)
- `digests` (boolean, optional): Whether to show digests (default: false)
- `filter` (string, optional): Filter output based on conditions
- `format` (string, optional): Format the output (json or table, default: "json")
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import listImages from "@tokenring-ai/docker/tools/listImages";

const result = await listImages.execute(
  { all: true, format: "json" },
  agent
);
```

#### docker_buildImage

Build a Docker image from a Dockerfile.

**Parameters**:
- `context` (string): The build context (directory containing Dockerfile)
- `tag` (string): The tag to apply to the built image
- `dockerfile` (string, optional): Path to the Dockerfile (relative to context)
- `buildArgs` (`Record<string, string>`, optional): Build arguments to pass to the build
- `noCache` (boolean, optional): Whether to NOT use cache when building (default: false)
- `pull` (boolean, optional): Whether to always pull newer versions of base images (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 300)

**Example**:
```typescript
import buildImage from "@tokenring-ai/docker/tools/buildImage";

const result = await buildImage.execute(
  {
    context: "./myapp",
    tag: "myapp:latest",
    dockerfile: "Dockerfile",
    buildArgs: { NODE_ENV: "production" }
  },
  agent
);
```

#### docker_startContainer

Start one or more Docker containers.

**Parameters**:
- `containers` (string | string[]): Container ID(s) or name(s) to start
- `attach` (boolean, optional): Whether to attach STDOUT/STDERR (default: false)
- `interactive` (boolean, optional): Whether to attach container's STDIN (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import startContainer from "@tokenring-ai/docker/tools/startContainer";

const result = await startContainer.execute(
  { containers: ["my-container"], attach: false },
  agent
);
```

#### docker_stopContainer

Stop one or more Docker containers.

**Parameters**:
- `containers` (string | string[]): Container ID(s) or name(s) to stop
- `time` (number, optional): Seconds to wait for stop before killing (default: 10)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import stopContainer from "@tokenring-ai/docker/tools/stopContainer";

const result = await stopContainer.execute(
  { containers: ["my-container"], time: 10 },
  agent
);
```

#### docker_removeContainer

Remove one or more Docker containers.

**Parameters**:
- `containers` (string | string[]): Container ID(s) or name(s) to remove
- `force` (boolean, optional): Whether to force removal of running container (default: false)
- `volumes` (boolean, optional): Whether to remove anonymous volumes (default: false)
- `link` (boolean, optional): Whether to remove the specified link (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import removeContainer from "@tokenring-ai/docker/tools/removeContainer";

const result = await removeContainer.execute(
  { containers: ["my-container"], force: true },
  agent
);
```

#### docker_execInContainer

Execute a command in a running Docker container.

**Parameters**:
- `container` (string): Container name or ID
- `command` (string | string[]): Command to execute
- `interactive` (boolean, optional): Whether to keep STDIN open (default: false)
- `tty` (boolean, optional): Whether to allocate a pseudo-TTY (default: false)
- `workdir` (string, optional): Working directory inside the container
- `env` (`Record<string, string>`, optional): Environment variables to set
- `privileged` (boolean, optional): Whether to give extended privileges (default: false)
- `user` (string, optional): Username or UID to execute as
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import execInContainer from "@tokenring-ai/docker/tools/execInContainer";

const result = await execInContainer.execute(
  {
    container: "my-container",
    command: ["ls", "-la"],
    workdir: "/app",
    env: { NODE_ENV: "production" }
  },
  agent
);
```

#### docker_getContainerLogs

Get logs from a Docker container.

**Parameters**:
- `name` (string): The container name or ID
- `follow` (boolean, optional): Whether to follow log output (default: false)
- `timestamps` (boolean, optional): Whether to show timestamps (default: false)
- `since` (string, optional): Show logs since timestamp
- `until` (string, optional): Show logs before timestamp
- `tail` (number, optional): Number of lines to show (default: 100)
- `details` (boolean, optional): Whether to show extra details (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import getContainerLogs from "@tokenring-ai/docker/tools/getContainerLogs";

const result = await getContainerLogs.execute(
  { name: "my-container", tail: 100, timestamps: true },
  agent
);
```

#### docker_getContainerStats

Get stats from a Docker container.

**Parameters**:
- `containers` (string | string[]): Container name(s) or ID(s)
- `all` (boolean, optional): Whether to show all containers (default: false)
- `noStream` (boolean, optional): Whether to disable streaming stats and only pull one stat (default: true)
- `format` (string, optional): Format the output (json or table, default: "json")
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 10)

**Example**:
```typescript
import getContainerStats from "@tokenring-ai/docker/tools/getContainerStats";

const result = await getContainerStats.execute(
  { containers: ["my-container"], noStream: true },
  agent
);
```

#### docker_removeImage

Remove one or more Docker images.

**Parameters**:
- `images` (string[]): Image ID(s) or name(s) to remove
- `force` (boolean, optional): Whether to force removal (default: false)
- `noPrune` (boolean, optional): Whether to prevent pruning parent images (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import removeImage from "@tokenring-ai/docker/tools/removeImage";

const result = await removeImage.execute(
  { images: ["myapp:latest"], force: true },
  agent
);
```

#### docker_tagImage

Tag a Docker image with a new name and/or tag.

**Parameters**:
- `sourceImage` (string): The source image to tag
- `targetImage` (string): The target image name and tag
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import tagImage from "@tokenring-ai/docker/tools/tagImage";

const result = await tagImage.execute(
  { sourceImage: "myapp:latest", targetImage: "myregistry/myapp:v1.0" },
  agent
);
```

#### docker_pushImage

Push a Docker image to a registry.

**Parameters**:
- `tag` (string): The image tag to push
- `allTags` (boolean, optional): Whether to push all tags (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 300)

**Example**:
```typescript
import pushImage from "@tokenring-ai/docker/tools/pushImage";

const result = await pushImage.execute(
  { tag: "myregistry/myapp:v1.0", allTags: false },
  agent
);
```

#### docker_createNetwork

Create a Docker network.

**Parameters**:
- `name` (string): The name of the network
- `driver` (string, optional): Driver to manage the network (default: "bridge")
- `options` (`Record<string, string>`, optional): Driver specific options
- `internal` (boolean, optional): Restrict external access (default: false)
- `subnet` (string, optional): Subnet in CIDR format
- `gateway` (string, optional): Gateway for the subnet
- `ipRange` (string, optional): Allocate container IP from a sub-range
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import createNetwork from "@tokenring-ai/docker/tools/createNetwork";

const result = await createNetwork.execute(
  {
    name: "my-network",
    driver: "bridge",
    subnet: "172.20.0.0/16"
  },
  agent
);
```

#### docker_dockerStack

Launch, update, or remove a Docker stack from the local Docker Swarm.

**Parameters**:
- `action` (enum): Action to perform - "deploy", "remove", or "ps"
- `stackName` (string): Name of the stack
- `composeFile` (string, optional): Path to docker-compose.yml (required for deploy)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 60)

**Example**:
```typescript
import dockerStack from "@tokenring-ai/docker/tools/dockerStack";

// Deploy a stack
const result = await dockerStack.execute(
  {
    action: "deploy",
    stackName: "my-stack",
    composeFile: "./docker-compose.yml"
  },
  agent
);
```

#### docker_authenticateRegistry

Authenticate against a Docker registry.

**Parameters**:
- `server` (string): The registry server URL
- `username` (string): Username for the registry
- `password` (string): Password for the registry
- `email` (string, optional): Email for the registry account
- `passwordStdin` (boolean, optional): Take the password from stdin (default: false)
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30)

**Example**:
```typescript
import authenticateRegistry from "@tokenring-ai/docker/tools/authenticateRegistry";

const result = await authenticateRegistry.execute(
  {
    server: "https://index.docker.io/v1/",
    username: "myuser",
    password: "mypassword"
  },
  agent
);
```

#### docker_pruneImages

Prune unused Docker images.

**Parameters**:
- `all` (boolean, optional): Remove all unused images, not just dangling (default: false)
- `filter` (string, optional): Filter images based on conditions
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 60)

**Note**: The `force` flag is always set internally to avoid interactive prompts.

**Example**:
```typescript
import pruneImages from "@tokenring-ai/docker/tools/pruneImages";

const result = await pruneImages.execute(
  { all: true },
  agent
);
```

#### docker_pruneVolumes

Prune unused Docker volumes.

**Parameters**:
- `filter` (string, optional): Filter volumes based on conditions
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 60)

**Note**: The `force` flag is always set internally to avoid interactive prompts.

**Example**:
```typescript
import pruneVolumes from "@tokenring-ai/docker/tools/pruneVolumes";

const result = await pruneVolumes.execute(
  {},
  agent
);
```

## Configuration

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

**Configuration Options**:

- **host**: Docker daemon address (e.g., `unix:///var/run/docker.sock`, `tcp://remote:2375`)
- **tls.verify**: Enable TLS verification (default: false)
- **tls.caCert**: Path to CA certificate file
- **tls.cert**: Path to client certificate file
- **tls.key**: Path to client key file

### Plugin Configuration

```typescript
import dockerPlugin from "@tokenring-ai/docker/plugin";

await app.install(dockerPlugin, {
  docker: {
    host: "unix:///var/run/docker.sock"
  },
  sandbox: {
    providers: {
      docker: {
        type: "docker"
      }
    }
  }
});
```

## Integration

### Plugin Integration

The plugin automatically registers tools and services:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import dockerPlugin from "@tokenring-ai/docker/plugin";

const app = new TokenRingApp();

await app.install(dockerPlugin, {
  docker: {
    host: "unix:///var/run/docker.sock"
  },
  sandbox: {
    providers: {
      docker: {
        type: "docker"
      }
    }
  }
});
```

### Service Integration

Register services directly:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import {DockerService, DockerSandboxProvider} from "@tokenring-ai/docker";
import {SandboxService} from "@tokenring-ai/sandbox";
import {ChatService} from "@tokenring-ai/chat";
import tools from "@tokenring-ai/docker/tools";

const app = new TokenRingApp();

const dockerService = new DockerService({
  host: "unix:///var/run/docker.sock"
});

app.addServices(dockerService);

app.waitForService(ChatService, chatService => {
  chatService.addTools(tools);
});

app.waitForService(SandboxService, sandboxService => {
  sandboxService.registerProvider("docker", new DockerSandboxProvider(dockerService));
});
```

### Agent Integration

The package integrates seamlessly with Token Ring agents:

```typescript
import {Agent} from "@tokenring-ai/agent";
import dockerRun from "@tokenring-ai/docker/tools/dockerRun";

const agent = new Agent(registry);

// Use Docker tools directly
const result = await dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "echo 'Hello from Docker'",
  timeoutSeconds: 30
}, agent);
```

## Usage Examples

### 1. Ephemeral Container Execution

```typescript
import {Agent} from "@tokenring-ai/agent";
import dockerRun from "@tokenring-ai/docker/tools/dockerRun";

const agent = new Agent(registry);
const result = await dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "ls -la /usr/bin",
  timeoutSeconds: 30
}, agent);

if (result.data.ok) {
  console.log("Command output:", result.data.stdout);
} else {
  console.error("Error:", result.data.stderr);
}
```

### 2. Persistent Container Management

```typescript
import DockerSandboxProvider from "@tokenring-ai/docker/DockerSandboxProvider";
import DockerService from "@tokenring-ai/docker/DockerService";

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

### 3. Docker Image Operations

```typescript
import buildImage from "@tokenring-ai/docker/tools/buildImage";
import tagImage from "@tokenring-ai/docker/tools/tagImage";
import pushImage from "@tokenring-ai/docker/tools/pushImage";

// Build an image
const buildResult = await buildImage.execute({
  context: "./myapp",
  tag: "myapp:latest",
  dockerfile: "Dockerfile"
}, agent);

// Tag and push
await tagImage.execute({
  sourceImage: "myapp:latest",
  targetImage: "myregistry/myapp:v1.0"
}, agent);

await pushImage.execute({
  tag: "myregistry/myapp:v1.0"
}, agent);
```

### 4. Container Lifecycle Management

```typescript
import listContainers from "@tokenring-ai/docker/tools/listContainers";
import startContainer from "@tokenring-ai/docker/tools/startContainer";
import stopContainer from "@tokenring-ai/docker/tools/stopContainer";
import execInContainer from "@tokenring-ai/docker/tools/execInContainer";
import getContainerLogs from "@tokenring-ai/docker/tools/getContainerLogs";

// List running containers
const containers = await listContainers.execute({ all: false }, agent);

// Start a container
await startContainer.execute({ containers: ["my-container"] }, agent);

// Execute a command
const execResult = await execInContainer.execute({
  container: "my-container",
  command: ["npm", "test"]
}, agent);

// Get logs
const logs = await getContainerLogs.execute({
  name: "my-container",
  tail: 50
}, agent);

// Stop the container
await stopContainer.execute({ containers: ["my-container"] }, agent);
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

1. **Check Result Status**: Always check `result.data.ok` before accessing output
2. **Handle Exit Codes**: Use `result.data.exitCode` for detailed error information
3. **Log Errors**: Use `agent.errorMessage()` for error reporting
4. **Implement Retries**: Consider retry logic for transient failures

## Testing

### Basic Test Setup

```typescript
import {describe, expect, it} from 'vitest';
import {Agent} from '@tokenring-ai/agent';
import dockerRun from '@tokenring-ai/docker/tools/dockerRun';

describe('dockerRun', () => {
  it('should execute command in container', async () => {
    const agent = new Agent(registry);
    const result = await dockerRun.execute({
      image: 'alpine:latest',
      cmd: 'echo "Hello World"',
      timeoutSeconds: 30
    }, agent);

    expect(result.data.ok).toBe(true);
    expect(result.data.stdout).toContain('Hello World');
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

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/chat` | 0.2.0 | Chat and tool management |
| `@tokenring-ai/agent` | 0.2.0 | Agent orchestration |
| `@tokenring-ai/filesystem` | 0.2.0 | File system operations |
| `@tokenring-ai/sandbox` | 0.2.0 | Sandbox service integration |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities |
| `@tokenring-ai/terminal` | 0.2.0 | Terminal service for command execution |
| `execa` | ^9.6.1 | Process execution |
| `zod` | ^4.3.6 | Schema validation |
| `glob-gitignore` | ^1.0.15 | Gitignore pattern matching |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.0.18 | Testing framework |
| `typescript` | ^5.9.3 | Type checking |

## Limitations and Considerations

- **Docker CLI Dependency**: Requires Docker CLI installed on the host system
- **Unix Socket Permissions**: Local Docker access requires appropriate user permissions
- **Network Access**: Remote Docker hosts require network connectivity
- **Error Handling**: Tools throw exceptions on failure; implement proper error handling in agent workflows
- **Security**: All commands are executed via shell; ensure proper input validation and sanitization
- **Resource Management**: Containers and images should be properly cleaned up to avoid resource exhaustion
- **TLS Configuration**: TLS verification requires proper certificate files to be accessible
- **Force Flag**: The `docker_pruneImages` and `docker_pruneVolumes` tools always use the `-f` flag internally to avoid interactive prompts

## License

MIT License - see the root LICENSE file for details.

## Related Components

- `@tokenring-ai/sandbox`: Abstract sandbox interface for isolated execution
- `@tokenring-ai/agent`: Agent system for integration
- `@tokenring-ai/chat`: Chat service for tool and command integration
- `@tokenring-ai/app`: Application framework for plugin registration
- `@tokenring-ai/terminal`: Terminal service for command execution
