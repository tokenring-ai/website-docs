# Docker Plugin

Docker integration via CLI for container and image management, with sandbox provider.

## Overview

The `@tokenring-ai/docker` package provides Docker integration for Token Ring AI agents. It enables interaction with Docker through a configurable service and a set of tools for common operations such as running containers, building images, listing resources, and managing container lifecycles. Supports local Docker via Unix socket, remote hosts via TCP or SSH, and optional TLS configuration.

## Key Features

- **Ephemeral Containers**: One-off command execution via `dockerRun` tool
- **Persistent Containers**: Management via `DockerSandboxProvider`
- **CLI-Based**: Secure command execution using `execa`
- **Flexible Connectivity**: Unix socket, TCP, SSH with TLS support
- **Comprehensive Tools**: Run, build, list, exec, logs, lifecycle management

## Core Components

### DockerService

Configuration service for Docker connection parameters.

**Key Methods:**
- `constructor(params?)`: Initializes with optional host and TLS options
  - Default: `host = "unix:///var/run/docker.sock"`, `tlsVerify = false`
- `getHost()`: Returns configured Docker host
- `getTLSConfig()`: Returns TLS settings

### DockerSandboxProvider

Manages persistent Docker containers, extends `SandboxProvider`.

**Key Methods:**
- `createContainer(options)`: Creates detached container running `sleep infinity`
  - Options: `image`, `workingDir`, `environment`, `timeout`
  - Returns: `{ containerId, status }`
- `executeCommand(containerId, command)`: Runs `docker exec`
  - Returns: `{ stdout, stderr, exitCode }`
- `stopContainer(containerId)`: Stops container
- `getLogs(containerId)`: Retrieves logs
- `removeContainer(containerId)`: Removes container

### Tools

**dockerRun**: Runs ephemeral containers (`docker run --rm`)
- Args: `image`, `cmd`, `workdir`, `timeoutSeconds`, `mountSrc`
- Supports mounting host source dir

**buildImage**: Builds images (`docker build`)
- Args: `context`, `tag`, `dockerfile`, `buildArgs`, `noCache`, `pull`, `timeoutSeconds`

**listImages/listContainers**: Lists resources with filters
- Parses JSON output into arrays

**getContainerLogs**: Retrieves logs with options
- Supports `--tail`, `--since`
- Returns: `{ logs, lineCount }`

**execInContainer**: Executes in running containers
- Supports env, user, privileged, interactive/TTY

**startContainer/stopContainer/removeContainer**: Lifecycle management
- Supports force, volumes, timeouts

**pushImage**: Pushes to registry

## Usage Examples

### Run Ephemeral Command

```typescript
import { dockerRun } from '@tokenring-ai/docker/tools';

const result = await dockerRun.execute({
  image: "ubuntu:22.04",
  cmd: "ls -la /",
  workdir: "/tmp",
  timeoutSeconds: 10,
  mountSrc: "/host-src"
}, agent);

if (result.ok) {
  console.log("Output:", result.stdout);
}
```

### Build and Push Image

```typescript
import { buildImage, pushImage } from '@tokenring-ai/docker/tools';

const buildResult = await buildImage.execute({
  context: "./myapp",
  tag: "myrepo/myapp:v1",
  dockerfile: "Dockerfile.dev",
  buildArgs: { NODE_VERSION: "18" },
  noCache: true
}, agent);

if (buildResult.ok) {
  await pushImage.execute({ tag: "myrepo/myapp:v1" }, agent);
}
```

### Persistent Container Management

```typescript
import { DockerSandboxProvider } from '@tokenring-ai/docker';

const provider = new DockerSandboxProvider({ host: "tcp://remote:2375" });
const { containerId } = await provider.createContainer({
  image: "python:3.9",
  environment: { SCRIPT: "print('Hello')"},
  workingDir: "/app"
});

const execResult = await provider.executeCommand(containerId, "python -c 'print(\"In container\")'");
console.log(execResult.stdout);

await provider.stopContainer(containerId);
await provider.removeContainer(containerId);
```

## Configuration Options

### DockerService Params
- `host`: Docker daemon address (default: unix socket)
- `tlsVerify`: Enable TLS (default: false)
- `tlsCACert/tlsCert/tlsKey`: Paths to cert files

### Tool-Specific
- **Timeouts**: Clamped (5-600s for runs, up to 1800s for builds)
- **Formats**: JSON for structured output in list tools
- **Mounts**: Via `mountSrc` in dockerRun

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Agent integration
- `@tokenring-ai/filesystem@0.1.0`: For mounts and command execution
- `@tokenring-ai/sandbox@0.1.0`: For DockerSandboxProvider
- `@tokenring-ai/utility@0.1.0`: Shell escaping
- `execa@^9.6.0`: Secure CLI execution
- `zod`: Schema validation

External: Requires Docker CLI installed on host
