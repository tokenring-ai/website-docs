# @tokenring-ai/docker

## User Guide

### Overview

The `@tokenring-ai/docker` package provides AI agents with comprehensive Docker integration capabilities, enabling container orchestration, image management, and secure container execution within the Token Ring ecosystem. It supports both ephemeral container execution for one-off commands and persistent container management through the sandbox system.

### Key Features

- **Ephemeral Container Execution**: Run one-off commands in temporary containers with automatic cleanup via `docker_dockerRun`
- **Persistent Container Management**: Create and manage long-running containers via `DockerSandboxProvider`
- **TLS/SSL Support**: Secure Docker daemon connections with certificate-based authentication
- **Multiple Docker Hosts**: Support for local Unix sockets (`unix:///var/run/docker.sock`) and remote TCP connections (`tcp://remote:2375`)
- **Agent Integration**: Seamless integration with Token Ring's agent and service architecture
- **18 Docker Tools**: Comprehensive toolset for container, image, network, and registry management
- **Shell Safety**: All operations use proper shell escaping via `@tokenring-ai/utility/string/shellEscape`
- **Workdir Bind Mount**: Ephemeral containers automatically bind mount the project directory at `/workdir`

### Installation

```bash
bun install @tokenring-ai/docker
```

### Chat Commands

This package does not define chat commands. It provides tools that can be invoked by AI agents through the chat service.

### Tools

The package provides 18 Docker tools for comprehensive container and image management. Each tool follows the TokenRing tool pattern with proper input validation, error handling, and agent integration.

#### Tool Categories

| Category             | Tools                                                                                                                                            |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Container Management | `docker_dockerRun`, `docker_listContainers`, `docker_startContainer`, `docker_stopContainer`, `docker_removeContainer`, `docker_execInContainer` |
| Image Management     | `docker_listImages`, `docker_buildImage`, `docker_removeImage`, `docker_tagImage`, `docker_pushImage`                                            |
| Network Management   | `docker_createNetwork`                                                                                                                           |
| Stack Management     | `docker_dockerStack`                                                                                                                             |
| Logging and Stats    | `docker_getContainerLogs`, `docker_getContainerStats`                                                                                            |
| Registry             | `docker_authenticateRegistry`                                                                                                                    |
| Maintenance          | `docker_pruneImages`, `docker_pruneVolumes`                                                                                                      |

### Tool Reference

#### docker_dockerRun

Execute a shell command in an ephemeral Docker container that is automatically removed after execution.

**Description**: Runs a shell command in an ephemeral Docker container (docker run --rm). Returns the result (stdout, stderr, exit code). The base directory for the project is bind mounted at `/workdir`, and the working directory of the container is set to `/workdir`.

**Parameters**:

| Parameter      | Type   | Required | Default | Description                                       |
|----------------|--------|----------|---------|---------------------------------------------------|
| image          | string | Yes      | -       | Docker image name (e.g., ubuntu:latest)           |
| cmd            | string | Yes      | -       | Command to run in the container (e.g., 'ls -l /') |
| timeoutSeconds | number | No       | 60      | Timeout for the command, in seconds (max: 600)    |

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

| Parameter      | Type    | Required | Default | Description                                                 |
|----------------|---------|----------|---------|-------------------------------------------------------------|
| all            | boolean | No       | false   | Whether to show all containers (default shows just running) |
| quiet          | boolean | No       | false   | Whether to only display container IDs                       |
| limit          | number  | No       | -       | Number of containers to show                                |
| filter         | string  | No       | -       | Filter output based on conditions                           |
| size           | boolean | No       | false   | Display total file sizes                                    |
| format         | string  | No       | "json"  | Format the output (json or table)                           |
| timeoutSeconds | number  | No       | 30      | Timeout in seconds (max: 120)                               |

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

| Parameter      | Type    | Required | Default | Description                                                    |
|----------------|---------|----------|---------|----------------------------------------------------------------|
| all            | boolean | No       | false   | Whether to show all images (default hides intermediate images) |
| quiet          | boolean | No       | false   | Whether to only display image IDs                              |
| digests        | boolean | No       | false   | Whether to show digests                                        |
| filter         | string  | No       | -       | Filter output based on conditions                              |
| format         | string  | No       | "json"  | Format the output (json or table)                              |
| timeoutSeconds | number  | No       | 30      | Timeout in seconds (max: 120)                                  |

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

| Parameter      | Type                         | Required | Default | Description                                          |
|----------------|------------------------------|----------|---------|------------------------------------------------------|
| context        | string                       | Yes      | -       | The build context (directory containing Dockerfile)  |
| tag            | string                       | Yes      | -       | The tag to apply to the built image                  |
| dockerfile     | string                       | No       | -       | Path to the Dockerfile (relative to context)         |
| buildArgs      | Record&lt;string, string&gt; | No       | {}      | Build arguments to pass to the build                 |
| noCache        | boolean                      | No       | false   | Whether to use cache when building                   |
| pull           | boolean                      | No       | false   | Whether to always pull newer versions of base images |
| timeoutSeconds | number                       | No       | 300     | Timeout in seconds (max: 1800)                       |

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

| Parameter      | Type               | Required | Default | Description                         |
|----------------|--------------------|----------|---------|-------------------------------------|
| containers     | string \| string[] | Yes      | -       | Container ID(s) or name(s) to start |
| attach         | boolean            | No       | false   | Whether to attach STDOUT/STDERR     |
| interactive    | boolean            | No       | false   | Whether to attach container's STDIN |
| timeoutSeconds | number             | No       | 30      | Timeout in seconds (max: 120)       |

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

| Parameter      | Type               | Required | Default | Description                             |
|----------------|--------------------|----------|---------|-----------------------------------------|
| containers     | string \| string[] | Yes      | -       | Container ID(s) or name(s) to stop      |
| time           | number             | No       | 10      | Seconds to wait for stop before killing |
| timeoutSeconds | number             | No       | 30      | Timeout in seconds (max: 120)           |

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

| Parameter      | Type               | Required | Default | Description                                   |
|----------------|--------------------|----------|---------|-----------------------------------------------|
| containers     | string \| string[] | Yes      | -       | Container ID(s) or name(s) to remove          |
| force          | boolean            | No       | false   | Whether to force removal of running container |
| volumes        | boolean            | No       | false   | Whether to remove anonymous volumes           |
| link           | boolean            | No       | false   | Whether to remove the specified link          |
| timeoutSeconds | number             | No       | 30      | Timeout in seconds (max: 120)                 |

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

| Parameter      | Type                         | Required | Default | Description                            |
|----------------|------------------------------|----------|---------|----------------------------------------|
| container      | string                       | Yes      | -       | Container name or ID                   |
| command        | string \| string[]           | Yes      | -       | Command to execute                     |
| interactive    | boolean                      | No       | false   | Whether to keep STDIN open             |
| tty            | boolean                      | No       | false   | Whether to allocate a pseudo-TTY       |
| workdir        | string                       | No       | -       | Working directory inside the container |
| env            | Record&lt;string, string&gt; | No       | {}      | Environment variables to set           |
| privileged     | boolean                      | No       | false   | Whether to give extended privileges    |
| user           | string                       | No       | -       | Username or UID to execute as          |
| timeoutSeconds | number                       | No       | 30      | Timeout in seconds (max: 300)          |

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

| Parameter      | Type    | Required | Default | Description                          |
|----------------|---------|----------|---------|--------------------------------------|
| name           | string  | Yes      | -       | The container name or ID             |
| follow         | boolean | No       | false   | Whether to follow log output         |
| timestamps     | boolean | No       | false   | Whether to show timestamps           |
| since          | string  | No       | -       | Show logs since timestamp            |
| until          | string  | No       | -       | Show logs before timestamp           |
| tail           | number  | No       | 100     | Number of lines to show from the end |
| details        | boolean | No       | false   | Whether to show extra details        |
| timeoutSeconds | number  | No       | 30      | Timeout in seconds (max: 300)        |

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

| Parameter      | Type               | Required | Default | Description                         |
|----------------|--------------------|----------|---------|-------------------------------------|
| containers     | string \| string[] | Yes      | -       | Container name(s) or ID(s)          |
| all            | boolean            | No       | false   | Whether to show all containers      |
| noStream       | boolean            | No       | true    | Disable streaming and pull one stat |
| format         | string             | No       | "json"  | Format the output (json or table)   |
| timeoutSeconds | number             | No       | 10      | Timeout in seconds (max: 60)        |

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

| Parameter      | Type     | Required | Default | Description                              |
|----------------|----------|----------|---------|------------------------------------------|
| images         | string[] | Yes      | -       | Image ID(s) or name(s) to remove         |
| force          | boolean  | No       | false   | Whether to force removal                 |
| noPrune        | boolean  | No       | false   | Whether to prevent pruning parent images |
| timeoutSeconds | number   | No       | 30      | Timeout in seconds (max: 120)            |

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

| Parameter      | Type   | Required | Default | Description                   |
|----------------|--------|----------|---------|-------------------------------|
| sourceImage    | string | Yes      | -       | The source image to tag       |
| targetImage    | string | Yes      | -       | The target image name and tag |
| timeoutSeconds | number | No       | 30      | Timeout in seconds (max: 120) |

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

| Parameter      | Type    | Required | Default | Description                    |
|----------------|---------|----------|---------|--------------------------------|
| tag            | string  | Yes      | -       | The image tag to push          |
| allTags        | boolean | No       | false   | Whether to push all tags       |
| timeoutSeconds | number  | No       | 300     | Timeout in seconds (max: 1800) |

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

| Parameter      | Type                         | Required | Default  | Description                            |
|----------------|------------------------------|----------|----------|----------------------------------------|
| name           | string                       | Yes      | -        | The name of the network                |
| driver         | string                       | No       | "bridge" | Driver to manage the network           |
| options        | Record&lt;string, string&gt; | No       | {}       | Driver specific options                |
| internal       | boolean                      | No       | false    | Restrict external access               |
| subnet         | string                       | No       | -        | Subnet in CIDR format                  |
| gateway        | string                       | No       | -        | Gateway for the subnet                 |
| ipRange        | string                       | No       | -        | Allocate container IP from a sub-range |
| timeoutSeconds | number                       | No       | 30       | Timeout in seconds (max: 120)          |

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

| Parameter      | Type                         | Required | Default | Description                                      |
|----------------|------------------------------|----------|---------|--------------------------------------------------|
| action         | "deploy" \| "remove" \| "ps" | Yes      | -       | Action to perform                                |
| stackName      | string                       | Yes      | -       | Name of the stack                                |
| composeFile    | string                       | No*      | -       | Path to docker-compose.yml (required for deploy) |
| timeoutSeconds | number                       | No       | 60      | Timeout in seconds (max: 600)                    |

*Required when action is "deploy"

**Actions**:

- `deploy` - Deploy or update a stack (requires `composeFile`)
- `remove` - Remove a stack
- `ps` - List services in a stack

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

// Remove a stack
await dockerStack.execute(
  {
    action: "remove",
    stackName: "my-stack"
  },
  agent
);
```

#### docker_authenticateRegistry

Authenticate against a Docker registry.

**Parameters**:

| Parameter      | Type    | Required | Default | Description                    |
|----------------|---------|----------|---------|--------------------------------|
| server         | string  | Yes      | -       | The registry server URL        |
| username       | string  | Yes      | -       | Username for the registry      |
| password       | string  | Yes      | -       | Password for the registry      |
| email          | string  | No       | -       | Email for the registry account |
| passwordStdin  | boolean | No       | false   | Take the password from stdin   |
| timeoutSeconds | number  | No       | 30      | Timeout in seconds (max: 120)  |

**Note**: When `passwordStdin` is true, the password is passed via stdin instead of as a command-line argument for improved security.

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

| Parameter      | Type    | Required | Default | Description                                 |
|----------------|---------|----------|---------|---------------------------------------------|
| all            | boolean | No       | false   | Remove all unused images, not just dangling |
| filter         | string  | No       | -       | Filter images based on conditions           |
| force          | boolean | No       | false   | Whether to force removal (always applied)   |
| timeoutSeconds | number  | No       | 60      | Timeout in seconds (max: 300)               |

**Note**: The `-f` flag is always used internally to avoid interactive prompts.

**Returns**: Object with `ok`, `exitCode`, `stdout`, `stderr`, and `spaceReclaimed` fields.

**Example**:

```typescript
import pruneImages from "@tokenring-ai/docker/tools/pruneImages";

const result = await pruneImages.execute(
  { all: true },
  agent
);

console.log(`Space reclaimed: ${result.data.spaceReclaimed}`);
```

#### docker_pruneVolumes

Prune unused Docker volumes.

**Parameters**:

| Parameter      | Type    | Required | Default | Description                               |
|----------------|---------|----------|---------|-------------------------------------------|
| filter         | string  | No       | -       | Filter volumes based on conditions        |
| force          | boolean | No       | false   | Whether to force removal (always applied) |
| timeoutSeconds | number  | No       | 60      | Timeout in seconds (max: 300)             |

**Note**: The `-f` flag is always used internally to avoid interactive prompts.

**Returns**: Object with `ok`, `exitCode`, `stdout`, `stderr`, `spaceReclaimed`, and `volumesDeleted` fields.

**Example**:

```typescript
import pruneVolumes from "@tokenring-ai/docker/tools/pruneVolumes";

const result = await pruneVolumes.execute(
  { filter: "dangling=true" },
  agent
);

console.log(`Space reclaimed: ${result.data.spaceReclaimed}`);
console.log(`Volumes deleted: ${result.data.volumesDeleted}`);
```

### Configuration

#### DockerService Configuration

```yaml
docker:
  host: "unix:///var/run/docker.sock"
  tls:
    verify: true
    caCert: "/path/to/ca.crt"
    cert: "/path/to/client.crt"
    key: "/path/to/client.key"
  sandbox: true
```

**Configuration Options**:

| Option     | Type    | Default | Description                                 |
|------------|---------|---------|---------------------------------------------|
| host       | string  | -       | Docker daemon address                       |
| tls.verify | boolean | false   | Enable TLS verification                     |
| tls.caCert | string  | -       | Path to CA certificate file                 |
| tls.cert   | string  | -       | Path to client certificate file             |
| tls.key    | string  | -       | Path to client key file                     |
| sandbox    | boolean | false   | Enable Docker sandbox provider registration |

#### Plugin Configuration

```typescript
import dockerPlugin from "@tokenring-ai/docker/plugin";

await app.install(dockerPlugin, {
  docker: {
    host: "unix:///var/run/docker.sock",
    sandbox: true
  }
});
```

**Note**: The plugin automatically registers tools with `ChatService` and creates a `DockerService`. When
`sandbox: true` is set, the plugin also registers `DockerSandboxProvider` with `SandboxService`.

#### Environment Variables

The plugin automatically applies environment variables:

| Variable          | Description                              |
|-------------------|------------------------------------------|
| DOCKER_HOST       | Sets the Docker host if not configured   |
| DOCKER_SANDBOX    | Enables sandbox provider if set          |
| DOCKER_TLS_VERIFY | Enables TLS verification if set          |
| DOCKER_CERT_PATH  | Can be used to set TLS certificate paths |

### Integration

#### Plugin Integration

The plugin automatically registers tools and services:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import dockerPlugin from "@tokenring-ai/docker/plugin";

const app = new TokenRingApp();

await app.install(dockerPlugin, {
  docker: {
    host: "unix:///var/run/docker.sock",
    sandbox: true
  }
});
```

#### Service Integration

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

### Best Practices

#### Container Management

1. **Use Persistent Containers for Long-Running Workloads**: Create containers once and reuse them for multiple commands
2. **Always Clean Up**: Use `stopContainer` and `removeContainer` to prevent resource leaks
3. **Set Appropriate Timeouts**: Configure timeouts based on expected operation duration
4. **Use Environment Variables**: Pass sensitive data via environment variables rather than command arguments

#### Image Management

1. **Build with Caching**: Use `noCache` only when necessary for debugging
2. **Tag Images Properly**: Use semantic versioning for image tags
3. **Prune Regularly**: Use pruning commands to reclaim disk space
4. **Authenticate Securely**: Use proper authentication for Docker registries

#### Security

1. **Use TLS for Remote Connections**: Enable TLS verification when connecting to remote Docker daemons
2. **Validate Input**: All tools validate inputs using Zod schemas
3. **Limit Container Privileges**: Use `--privileged` only when necessary
4. **Secure Credentials**: Never hardcode credentials; use environment variables or secure storage
5. **Use passwordStdin**: When authenticating to registries, consider using `passwordStdin: true` for improved security

#### Error Handling

1. **Check Result Status**: Always check `result.data.ok` before accessing output
2. **Handle Exit Codes**: Use `result.data.exitCode` for detailed error information
3. **Log Errors**: Use `agent.errorMessage()` for error reporting
4. **Implement Retries**: Consider retry logic for transient failures

---

## Developer Reference

### Core Components

#### DockerService

The `DockerService` class provides the core Docker configuration and command building functionality.

**File**: `pkg/docker/DockerService.ts`

**Properties**:

| Property    | Type         | Description                                           |
|-------------|--------------|-------------------------------------------------------|
| name        | string       | Service identifier ("DockerService")                  |
| description | string       | Service description ("Provides Docker functionality") |
| options     | DockerConfig | The configuration options                             |

**Constructor**:

```typescript
constructor(options: z.output<typeof DockerConfigSchema>) {}
```

**Methods**:

| Method           | Return Type | Description                                                       |
|------------------|-------------|-------------------------------------------------------------------|
| buildDockerCmd() | string      | Builds the complete Docker CLI command with host and TLS settings |

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

Implements `SandboxProvider` to manage persistent Docker containers that can execute multiple commands over time.

**File**: `pkg/docker/DockerSandboxProvider.ts`

**Constructor**:

```typescript
constructor(readonly
dockerService: DockerService
)
```

**Methods**:

| Method          | Parameters                           | Return Type                  | Description                              |
|-----------------|--------------------------------------|------------------------------|------------------------------------------|
| createContainer | options: SandboxOptions              | Promise&lt;SandboxResult&gt; | Create a new persistent container        |
| executeCommand  | containerId: string, command: string | Promise&lt;ExecuteResult&gt; | Execute a command in a running container |
| stopContainer   | containerId: string                  | Promise&lt;void&gt;          | Stop a running container                 |
| getLogs         | containerId: string                  | Promise&lt;LogsResult&gt;    | Get container logs                       |
| removeContainer | containerId: string                  | Promise&lt;void&gt;          | Remove a container                       |

**SandboxOptions**:

```typescript
interface SandboxOptions {
  image?: string;                  // Docker image (default: "ubuntu:latest")
  workingDir?: string;             // Working directory inside the container
  environment?: Record&lt;string, string&gt;;  // Environment variables
  timeout?: number;                // Timeout in seconds (default: 30)
}
```

**Example**:

```typescript
import {DockerSandboxProvider, DockerService} from "@tokenring-ai/docker";

const dockerService = new DockerService({});
const provider = new DockerSandboxProvider(dockerService);

// Create a persistent container
const {containerId} = await provider.createContainer({
  image: "python:3.9",
  environment: {PYTHONPATH: "/app"},
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

### Services

#### DockerService

The `DockerService` is a Token Ring service that manages Docker configuration and provides utility methods for building
Docker commands.

**Registration**:

```typescript
import {DockerService} from "@tokenring-ai/docker";

const dockerService = new DockerService({
  host: "unix:///var/run/docker.sock",
});

app.addServices(dockerService);
```

### Provider Documentation

#### DockerSandboxProvider

The `DockerSandboxProvider` implements the `SandboxProvider` interface from `@tokenring-ai/sandbox`.

**Interface Methods**:

- `createContainer(options)`: Creates a detached container that runs indefinitely (sleep infinity)
- `executeCommand(containerId, command)`: Executes a command inside a running container
- `stopContainer(containerId)`: Stops a running container
- `getLogs(containerId)`: Retrieves logs from a container
- `removeContainer(containerId)`: Removes a container

**Implementation Details**:

- Uses `shellEscape` from `@tokenring-ai/utility/string/shellEscape` for safe command construction
- Uses `execa` for process execution with proper timeout handling
- All container operations respect the Docker configuration from `DockerService`

### RPC Endpoints

This package does not define RPC endpoints. It uses the Token Ring tool system for agent communication.

### Usage Examples

#### 1. Ephemeral Container Execution

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

#### 2. Persistent Container Management

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

#### 3. Docker Image Operations

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

#### 4. Container Lifecycle Management

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

### Testing

#### Basic Test Setup

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

#### Running Tests

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

#### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | Type checking |

### Limitations and Considerations

- **Docker CLI Dependency**: Requires Docker CLI installed on the host system
- **Unix Socket Permissions**: Local Docker access requires appropriate user permissions
- **Network Access**: Remote Docker hosts require network connectivity
- **Error Handling**: Tools throw exceptions on failure; implement proper error handling in agent workflows
- **Security**: All commands are executed via shell; ensure proper input validation and sanitization
- **Resource Management**: Containers and images should be properly cleaned up to avoid resource exhaustion
- **TLS Configuration**: TLS verification requires proper certificate files to be accessible
- **Force Flags**: The `docker_pruneImages` and `docker_pruneVolumes` tools always use the `-f` flag internally to avoid interactive prompts
- **Timeout Limits**: Tools have maximum timeout limits to prevent indefinite execution
- **Shell Escaping**: All user-provided strings are shell-escaped for safety

### Package Structure

```
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
    ├── authenticateRegistry.ts     # Authenticate with Docker registry
    ├── pruneImages.ts              # Remove unused images
    └── pruneVolumes.ts             # Remove unused volumes
```

### Related Components

- `@tokenring-ai/sandbox`: Abstract sandbox interface for isolated execution
- `@tokenring-ai/agent`: Agent system for integration
- `@tokenring-ai/chat`: Chat service for tool and command integration
- `@tokenring-ai/app`: Application framework for plugin registration
- `@tokenring-ai/terminal`: Terminal service for command execution

### License

MIT License - see the root LICENSE file for details.
