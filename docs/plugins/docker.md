# Docker Integration

## User Guide

### Overview

The `@tokenring-ai/docker` package provides comprehensive container management
and isolated sandboxing capabilities via Docker. It enables AI agents to
interact with Docker through a configurable service and a set of tools for
Docker operations. The package supports local Docker via Unix socket, remote
hosts via TCP, and optional TLS configuration for secure connections.

### Key Features

- **Ephemeral Container Execution**: Run one-off commands in temporary
  containers with automatic cleanup
- **Persistent Container Management**: Create, manage, and execute commands in
  long-running containers via `DockerSandboxProvider`
- **Secure Configuration**: Service-based Docker configuration with TLS support
- **Agent Integration**: Seamless integration with Token Ring's agent ecosystem
  and service architecture
- **Sandbox Provider**: Integrates with the Token Ring sandbox system for
  container orchestration
- **Comprehensive Toolset**: 17 Docker tools for managing images, containers,
  networks, stacks, and more
- **Shell Safety**: All operations use proper shell escaping via
  `@tokenring-ai/utility/string/shellEscape`
- **Workdir Bind Mount**: Ephemeral containers automatically bind mount the
  project directory at `/workdir`

### Chat Commands

This package does not define chat commands (slash-prefixed commands). All
functionality is accessed through tools.

### Tools

The package provides 17 Docker tools for comprehensive container and image
management. Each tool follows the TokenRing tool pattern with proper input
validation, error handling, and agent integration.

#### Tool Categories

| Category | Tools |
|:---------|:------|
| Container Management | `docker_dockerRun`, `docker_listContainers`, `docker_startContainer`, `docker_stopContainer`, `docker_removeContainer`, `docker_execInContainer` |
| Image Management | `docker_listImages`, `docker_buildImage`, `docker_removeImage`, `docker_tagImage`, `docker_pushImage` |
| Network Management | `docker_createNetwork` |
| Stack Management | `docker_dockerStack` |
| Logging and Stats | `docker_getContainerLogs`, `docker_getContainerStats` |
| Registry | (none - tool not implemented) |
| Maintenance | `docker_pruneImages`, `docker_pruneVolumes` |

#### Container Tools

| Tool Name | Description |
|:----------|:------------|
| `docker_dockerRun` | Run ephemeral containers with bind mounts. Executes a command in a temporary container that auto-removes |
| `docker_listContainers` | List Docker containers with options for filtering, formatting, and limiting results |
| `docker_startContainer` | Start one or more Docker containers with optional attach and interactive flags |
| `docker_stopContainer` | Stop one or more Docker containers with configurable wait time |
| `docker_removeContainer` | Remove one or more Docker containers with options for force removal and volume cleanup |
| `docker_execInContainer` | Execute a command in a running Docker container with environment variables and working directory support |

##### docker_dockerRun

Runs a shell command in an ephemeral Docker container (`docker run --rm`).
The base directory for the project is bind mounted at `/workdir`, and the
working directory of the container is set to `/workdir`.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `image` | string | (required) | Docker image name (e.g., `ubuntu:latest`) |
| `cmd` | string | (required) | Command to run in the container |
| `timeoutSeconds` | number | 120 | Timeout for the command in seconds (max: 600) |

##### docker_listContainers

List Docker containers.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `all` | boolean | false | Show all containers (default shows just running) |
| `quiet` | boolean | false | Only display container IDs |
| `limit` | number | undefined | Number of containers to show |
| `filter` | string | undefined | Filter output based on conditions |
| `size` | boolean | false | Display total file sizes |
| `format` | string | "json" | Format the output (`json` or `table`) |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_startContainer

Start one or more Docker containers.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `containers` | string[] | (required) | Container ID(s) or name(s) to start (must be non-empty) |
| `attach` | boolean | false | Attach STDOUT/STDERR and forward signals |
| `interactive` | boolean | false | Attach container's STDIN |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_stopContainer

Stop one or more Docker containers.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `containers` | string[] | (required) | Container ID(s) or name(s) to stop (must be non-empty) |
| `time` | number | 10 | Seconds to wait for stop before killing the container |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_removeContainer

Remove one or more Docker containers.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `containers` | string[] | (required) | Container ID(s) or name(s) to remove (must be non-empty) |
| `force` | boolean | false | Force the removal of a running container |
| `volumes` | boolean | false | Remove anonymous volumes associated with the container |
| `link` | boolean | false | Remove the specified link |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_execInContainer

Execute a command in a running Docker container.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `container` | string | (required) | Container name or ID |
| `commands` | string[] | (required) | Commands to execute (must be non-empty) |
| `interactive` | boolean | false | Keep STDIN open even if not attached |
| `tty` | boolean | false | Allocate a pseudo-TTY |
| `workdir` | string | undefined | Working directory inside the container |
| `env` | Record<string, string> | {} | Environment variables to set |
| `privileged` | boolean | false | Give extended privileges to the command |
| `user` | string | undefined | Username or UID to execute the command as |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 300) |

#### Image Tools

| Tool Name | Description |
|:----------|:------------|
| `docker_listImages` | List Docker images with options for filtering, formatting, and showing digests |
| `docker_buildImage` | Build a Docker image from a Dockerfile with build arguments and cache options |
| `docker_removeImage` | Remove one or more Docker images with force and no-prune options |
| `docker_tagImage` | Tag a Docker image with a new name and/or tag |
| `docker_pushImage` | Push a Docker image to a registry with optional all-tags support |

##### docker_listImages

List Docker images.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `all` | boolean | false | Show all images (default hides intermediate images) |
| `quiet` | boolean | false | Only display image IDs |
| `digests` | boolean | false | Show digests |
| `filter` | string | undefined | Filter output based on conditions |
| `format` | string | "json" | Format the output (`json` or `table`) |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_buildImage

Build a Docker image from a Dockerfile.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `context` | string | (required) | The build context (directory containing Dockerfile) |
| `tag` | string | (required) | The tag to apply to the built image |
| `dockerfile` | string | undefined | Path to the Dockerfile (relative to context) |
| `buildArgs` | Record<string, string> | {} | Build arguments to pass to the build |
| `noCache` | boolean | false | Do not use cache when building the image |
| `pull` | boolean | false | Always pull newer versions of the base images |
| `timeoutSeconds` | number | 300 | Timeout in seconds (max: 1800) |

##### docker_removeImage

Remove one or more Docker images.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `images` | string[] | (required) | Image ID(s) or name(s) to remove (must be non-empty) |
| `force` | boolean | false | Force removal of the image |
| `noPrune` | boolean | false | Prevent the pruning of parent images |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_tagImage

Tag a Docker image with a new name and/or tag.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `sourceImage` | string | (required) | The source image to tag |
| `targetImage` | string | (required) | The target image name and tag |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

##### docker_pushImage

Push a Docker image to a registry.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `tag` | string | (required) | The image tag to push |
| `allTags` | boolean | false | Push all tags of the image |
| `timeoutSeconds` | number | 300 | Timeout in seconds (max: 1800) |

#### Network Tools

| Tool Name | Description |
|:----------|:------------|
| `docker_createNetwork` | Create a Docker network with driver, subnet, gateway, and IP range config |

##### docker_createNetwork

Create a Docker network.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `name` | string | (required) | The name of the network |
| `driver` | string | "bridge" | Driver to manage the network |
| `options` | Record<string, string> | {} | Driver specific options |
| `internal` | boolean | false | Restrict external access to the network |
| `subnet` | string | undefined | Subnet in CIDR format |
| `gateway` | string | undefined | Gateway for the subnet |
| `ipRange` | string | undefined | Allocate container IP from a sub-range |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 120) |

#### Stack Tools

| Tool Name | Description |
|:----------|:------------|
| `docker_dockerStack` | Launch, update, or remove a Docker stack from the local Docker Swarm mode |

##### docker_dockerStack

Launch, update, or remove a Docker stack from the local Docker Swarm.
Actions: `deploy` (requires composeFile), `remove`, `ps`.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `action` | enum | (required) | Action to perform: `deploy`, `remove`, or `ps` |
| `stackName` | string | (required) | Name of the stack to deploy/remove/list |
| `composeFile` | string | undefined | Path to docker-compose.yml file (required for deploy) |
| `timeoutSeconds` | number | 120 | Timeout for the stack operation in seconds (max: 600) |

#### Logging and Stats Tools

| Tool Name | Description |
|:----------|:------------|
| `docker_getContainerLogs` | Get logs from a Docker container with follow, timestamps, tail |
| `docker_getContainerStats` | Get stats from a Docker container with streaming control |

##### docker_getContainerLogs

Get logs from a Docker container.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `name` | string | (required) | The container name or ID |
| `follow` | boolean | false | Follow log output |
| `timestamps` | boolean | false | Show timestamps |
| `since` | string | undefined | Show logs since timestamp (e.g. `2013-01-02T13:23:37Z` or relative like `42m`) |
| `until` | string | undefined | Show logs before a timestamp |
| `tail` | number | 100 | Number of lines to show from the end of the logs |
| `details` | boolean | false | Show extra details provided to logs |
| `timeoutSeconds` | number | 30 | Timeout in seconds (max: 300) |

##### docker_getContainerStats

Get stats from a Docker container.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `containers` | string[] | (required) | Container name(s) or ID(s) (must be non-empty) |
| `all` | boolean | false | Show all containers (default shows just running) |
| `noStream` | boolean | true | Disable streaming stats and only pull one stat |
| `format` | string | "json" | Format the output (`json` or `table`) |
| `timeoutSeconds` | number | 10 | Timeout in seconds (max: 60) |

#### Registry Tools

| Tool Name | Description |
|:----------|:------------|
| (none) | Registry authentication tool is not currently implemented |

#### Maintenance Tools

| Tool Name | Description |
|:----------|:------------|
| `docker_pruneImages` | Prune unused Docker images with optional all and filter parameters |
| `docker_pruneVolumes` | Prune unused Docker volumes with filter support |

##### docker_pruneImages

Prune unused Docker images. The `-f` flag is always used internally to avoid
interactive prompts.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `all` | boolean | false | Remove all unused images, not just dangling ones |
| `filter` | string | undefined | Filter images based on conditions |
| `force` | boolean | false | Not used (the `-f` flag is always applied internally) |
| `timeoutSeconds` | number | 60 | Timeout in seconds (max: 300) |

##### docker_pruneVolumes

Prune unused Docker volumes. The `-f` flag is always used internally to avoid
interactive prompts.

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `filter` | string | undefined | Filter volumes based on conditions |
| `force` | boolean | false | Not used (the `-f` flag is always applied internally) |
| `timeoutSeconds` | number | 60 | Timeout in seconds (max: 300) |

### Configuration

#### Docker Configuration Schema

```yaml
docker:
  host: "unix:///var/run/docker.sock"  # Optional: Docker daemon address
  tls:                                  # Optional: TLS configuration
    verify: false                       # Enable TLS verification
    caCert: "/path/to/ca.crt"           # Path to CA certificate
    cert: "/path/to/client.crt"         # Path to client certificate
    key: "/path/to/client.key"          # Path to client key
  sandbox: false                        # Enable sandbox provider
```

#### Configuration Options

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `host` | string | undefined | Docker daemon address (e.g., `unix:///var/run/docker.sock`, `tcp://remote:2375`) |
| `tls.verify` | boolean | false | Enable TLS verification |
| `tls.caCert` | string | undefined | Path to CA certificate file |
| `tls.cert` | string | undefined | Path to client certificate file |
| `tls.key` | string | undefined | Path to client key file |
| `sandbox` | boolean | false | Enable Docker sandbox provider registration |

#### Environment Variables

The plugin automatically applies the following environment variables:

| Variable | Description |
|:---------|:------------|
| `DOCKER_HOST` | Sets the Docker host if not configured |
| `DOCKER_SANDBOX` | Enables sandbox provider if set |
| `DOCKER_TLS_VERIFY` | Enables TLS verification if set |
| `DOCKER_CERT_PATH` | Can be used to set TLS certificate paths |

### Integration

The Docker package integrates with the following Token Ring services:

- **ChatService**: Registers all 18 Docker tools for agent use
- **SandboxService**: Registers the DockerSandboxProvider when sandbox mode is
  enabled
- **TerminalService**: Used by `docker_dockerRun` tool for command execution

### Best Practices

1. **Timeout Management**: Set appropriate timeout values for long-running
   operations like image builds (default: 300s, max: 1800s)
2. **Resource Cleanup**: Always remove containers and images after use to avoid
   resource exhaustion
3. **Security**: Use TLS for remote Docker hosts and consider using password
   stdin for registry authentication
4. **Error Handling**: Implement proper error handling in agent workflows as
   tools throw exceptions on failure
5. **Shell Safety**: All user-provided strings are shell-escaped for safety
6. **Array Parameters**: Several tools require non-empty arrays for
   container/image identifiers (`startContainer`, `stopContainer`,
   `removeContainer`, `removeImage`, `getContainerStats`)

---

## Developer Reference

### Core Components

#### DockerService

The `DockerService` is a Token Ring service that configures Docker connection
parameters and builds Docker CLI commands with host and TLS settings.

**Location**: `pkg/docker/DockerService.ts`

**Properties**:

| Property | Type | Description |
|:---------|:-----|:------------|
| `name` | string | Service identifier ("DockerService") |
| `description` | string | Service description ("Provides Docker functionality") |
| `options` | DockerConfig | The configuration options |

**Constructor**:

```typescript
constructor(readonly options: z.output<typeof DockerConfigSchema>)
```

**Methods**:

| Method | Return Type | Description |
|:-------|:------------|:------------|
| `buildDockerCmd()` | string | Builds the Docker CLI command with host and TLS settings |

**Example**:

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

#### DockerSandboxProvider

The `DockerSandboxProvider` implements the `SandboxProvider` interface to
manage persistent Docker containers. It creates detached containers that can
execute multiple commands over time.

**Location**: `pkg/docker/DockerSandboxProvider.ts`

**Constructor**:

```typescript
constructor(readonly dockerService: DockerService)
```

**Methods**:

| Method | Parameters | Return Type | Description |
|:-------|:-----------|:------------|:------------|
| `createContainer` | `options: SandboxOptions` | `Promise<SandboxResult>` | Create a new persistent container |
| `executeCommand` | `containerId: string, command: string` | `Promise<ExecuteResult>` | Execute a command in a running container |
| `stopContainer` | `containerId: string` | `Promise<void>` | Stop a running container |
| `getLogs` | `containerId: string` | `Promise<LogsResult>` | Get container logs |
| `removeContainer` | `containerId: string` | `Promise<void>` | Remove a container |

**SandboxOptions**:

```typescript
interface SandboxOptions {
  image?: string;                    // Docker image (default: "ubuntu:latest")
  workingDir?: string;               // Working directory inside the container
  environment?: Record<string, string>;  // Environment variables
  timeout?: number;                  // Timeout in seconds (default: 30)
}
```

**Example**:

```typescript
import DockerSandboxProvider
  from "@tokenring-ai/docker/DockerSandboxProvider";
import DockerService from "@tokenring-ai/docker/DockerService";

const dockerService = new DockerService({});
const provider = new DockerSandboxProvider(dockerService);

// Create a persistent container
const { containerId } = await provider.createContainer({
  image: "python:3.9",
  environment: { PYTHONPATH: "/app" },
  workingDir: "/app"
});

const result = await provider.executeCommand(
  containerId,
  "python -c 'print(\"Hello from container\")'"
);

console.log(result.stdout);

// Clean up
await provider.stopContainer(containerId);
await provider.removeContainer(containerId);
```

### Services

#### DockerService Implementation

The `DockerService` implements the `TokenRingService` interface:

```typescript
interface TokenRingService {
  readonly name: string;
  readonly description: string;
}
```

**Usage in Plugin**:

```typescript
import DockerService from "./DockerService.ts";

const dockerService
  = new DockerService(DockerConfigSchema.parse(config.docker));
app.addServices(dockerService);
```

### Provider Documentation

#### DockerSandboxProvider (Sandbox Implementation)

The `DockerSandboxProvider` implements the `SandboxProvider` interface from
`@tokenring-ai/sandbox`.

**Interface Methods**:

- `createContainer(options)`: Creates a detached container that runs
  indefinitely (`sleep infinity`)
- `executeCommand(containerId, command)`: Executes a command inside a running
  container
- `stopContainer(containerId)`: Stops a running container
- `getLogs(containerId)`: Retrieves logs from a container
- `removeContainer(containerId)`: Removes a container

**Implementation Details**:

- Uses `shellEscape` from `@tokenring-ai/utility/string/shellEscape` for safe
  command construction
- Uses `execa` for process execution with proper timeout handling
- All container operations respect the Docker configuration from `DockerService`

### RPC Endpoints

This package does not define RPC endpoints. All functionality is accessed
through tools and services.

### Usage Examples

#### Ephemeral Container Execution

```typescript
import { Agent } from "@tokenring-ai/agent";
import dockerRun from "@tokenring-ai/docker/tools/dockerRun";

const agent = new Agent(registry);
const result = await dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "ls -la /usr/bin",
  timeoutSeconds: 30
}, agent);

if (result.data.ok) {
  console.log("Command succeeded");
} else {
  console.error("Error:", result.data.error);
}
```

#### Persistent Container Management

```typescript
import DockerSandboxProvider
  from "@tokenring-ai/docker/DockerSandboxProvider";
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

#### Docker Image Operations

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

#### Container Lifecycle Management

```typescript
import listContainers
  from "@tokenring-ai/docker/tools/listContainers";
import startContainer
  from "@tokenring-ai/docker/tools/startContainer";
import stopContainer
  from "@tokenring-ai/docker/tools/stopContainer";
import execInContainer
  from "@tokenring-ai/docker/tools/execInContainer";
import getContainerLogs
  from "@tokenring-ai/docker/tools/getContainerLogs";

// List running containers
const containers = await listContainers.execute({ all: false }, agent);

// Start a container
await startContainer.execute({ containers: ["my-container"] }, agent);

// Execute a command
const execResult = await execInContainer.execute({
  container: "my-container",
  commands: ["npm", "test"]
}, agent);

// Get logs
const logs = await getContainerLogs.execute({
  name: "my-container",
  tail: 50
}, agent);

// Stop the container
await stopContainer.execute({ containers: ["my-container"] }, agent);
```

### Testing

The package uses vitest for testing:

```bash
bun test
```

**Running Tests**:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Dependencies

#### Production Dependencies

| Package | Version | Purpose |
|:--------|:--------|:--------|
| `@tokenring-ai/app` | workspace:* | Base application framework |
| `@tokenring-ai/chat` | workspace:* | Chat service integration |
| `@tokenring-ai/agent` | workspace:* | Agent orchestration |
| `@tokenring-ai/sandbox` | workspace:* | Sandbox provider interface |
| `@tokenring-ai/utility` | workspace:* | Shared utilities |
| `@tokenring-ai/terminal` | workspace:* | Terminal service for command execution |
| `zod` | ^4.4.3 | Schema validation |
| `execa` | ^9.6.1 | Process execution |

#### Dev Dependencies

| Package | Version | Purpose |
|:--------|:--------|:--------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

### Related Components

- **@tokenring-ai/sandbox**: Sandbox provider interface used by
  DockerSandboxProvider
- **@tokenring-ai/chat**: Chat service for tool registration
- **@tokenring-ai/terminal**: Terminal service for command execution
- **@tokenring-ai/agent**: Agent orchestration for tool execution
- **@tokenring-ai/app**: Application framework for plugin registration

### API Reference

#### Public Exports

```typescript
// Main service and provider
export { default as DockerService }
  from "@tokenring-ai/docker/DockerService";
export { default as DockerSandboxProvider }
  from "@tokenring-ai/docker/DockerSandboxProvider";

// Configuration schema
export { DockerConfigSchema } from "@tokenring-ai/docker/schema";

// Types
export { DockerCommandResult } from "@tokenring-ai/docker/types";

// Plugin
export { default as dockerPlugin } from "@tokenring-ai/docker/plugin";

// Tools (import as a group)
import tools from "@tokenring-ai/docker/tools";

// Tools (import individually)
export { dockerRun } from "@tokenring-ai/docker/tools";
export { authenticateRegistry } from "@tokenring-ai/docker/tools";
export { buildImage } from "@tokenring-ai/docker/tools";
export { createNetwork } from "@tokenring-ai/docker/tools";
export { dockerStack } from "@tokenring-ai/docker/tools";
export { execInContainer } from "@tokenring-ai/docker/tools";
export { getContainerLogs } from "@tokenring-ai/docker/tools";
export { getContainerStats } from "@tokenring-ai/docker/tools";
export { listContainers } from "@tokenring-ai/docker/tools";
export { listImages } from "@tokenring-ai/docker/tools";
export { pruneImages } from "@tokenring-ai/docker/tools";
export { pruneVolumes } from "@tokenring-ai/docker/tools";
export { pushImage } from "@tokenring-ai/docker/tools";
export { removeContainer } from "@tokenring-ai/docker/tools";
export { removeImage } from "@tokenring-ai/docker/tools";
export { startContainer } from "@tokenring-ai/docker/tools";
export { stopContainer } from "@tokenring-ai/docker/tools";
export { tagImage } from "@tokenring-ai/docker/tools";
```

#### DockerCommandResult Interface

```typescript
interface DockerCommandResult {
  ok?: boolean | undefined;
  exitCode?: number | undefined;
  stdout?: string | undefined;
  stderr?: string | undefined;
  error?: string | undefined;
}
```

#### Tool Interface

All tools follow this pattern:

```typescript
interface TokenRingToolDefinition<T = z.ZodType> {
  name: string;                       // Tool name (e.g., "docker_dockerRun")
  displayName: string;                 // Display name (e.g., "Docker/dockerRun")
  description: string;                 // Tool description
  inputSchema: T;                      // Zod schema for input validation
  execute: (args: any, agent: Agent)
    => Promise<{ type: 'json', data: any }>;
}
```

### Package Structure

```text
pkg/docker/
├── index.ts                        # Main exports (DockerService, DockerSandboxProvider)
├── plugin.ts                       # TokenRing plugin integration
├── package.json                    # Package metadata and dependencies
├── schema.ts                       # Docker configuration schema
├── types.ts                        # Shared interfaces (DockerCommandResult)
├── DockerService.ts                # Core service for Docker configuration
├── DockerSandboxProvider.ts        # Sandbox implementation for persistent containers
├── tools.ts                        # Exported tools (all 18 tools)
└── tools/
    ├── dockerRun.ts                # Run ephemeral containers
    ├── listImages.ts               # List Docker images
    ├── buildImage.ts               # Build Docker images
    ├── listContainers.ts           # List Docker containers
    ├── getContainerLogs.ts         # Get container logs
    ├── getContainerStats.ts        # Get container statistics
    ├── startContainer.ts           # Start a container
    ├── stopContainer.ts            # Stop a container
    ├── removeContainer.ts          # Remove a container
    ├── removeImage.ts              # Remove an image
        ├── tagImage.ts                 # Tag an image
    ├── pushImage.ts                # Push an image to registry
    ├── createNetwork.ts            # Create a Docker network
    ├── dockerStack.ts              # Run Docker Compose stacks
    ├── execInContainer.ts          # Execute command in container
    ├── pruneImages.ts              # Remove unused images
    └── pruneVolumes.ts             # Remove unused volumes
```

### Limitations and Considerations

- **Docker CLI Dependency**: Requires Docker CLI installed on the host system
- **Unix Socket Permissions**: Local Docker access requires appropriate user
  permissions
- **Network Access**: Remote Docker hosts require network connectivity
- **Error Handling**: Tools throw exceptions on failure; implement proper error
  handling in agent workflows
- **Security**: All commands are executed via shell; ensure proper input
  validation and sanitization
- **Resource Management**: Containers and images should be properly cleaned up
  to avoid resource exhaustion
- **TLS Configuration**: TLS verification requires proper certificate files to
  be accessible
- **Force Flags**: The `docker_pruneImages` and `docker_pruneVolumes` tools
  always use the `-f` flag internally to avoid interactive prompts
- **Timeout Limits**: Tools have maximum timeout limits to prevent indefinite
  execution
- **Shell Escaping**: All user-provided strings are shell-escaped for safety
- **Array Parameters**: Several tools (`startContainer`, `stopContainer`,
  `removeContainer`, `removeImage`, `getContainerStats`) require non-empty
  arrays for container/image identifiers
