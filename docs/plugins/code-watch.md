# @tokenring-ai/code-watch

## Overview

The `@tokenring-ai/code-watch` plugin provides real-time file system monitoring capabilities for the Token Ring ecosystem. It watches specified directories and files for changes, detecting **AI!** comments in code files to trigger automated code modification workflows. This plugin integrates seamlessly with the Token Ring agent system to enable dynamic responses to code changes.

When a file is modified, the service scans for comment lines that contain AI triggers. The package processes `AI!` comments by spawning code modification agents; other AI comment variants (`AI?`, `AI`) are not processed and are ignored.

## Key Features

- **Real-time Monitoring**: Watches configured filesystems for file additions, changes, and deletions using polling-based detection
- **AI Comment Detection**: Scans files for special `AI!` comments in Python/shell (`#`) and C-style (`//`) comment lines
- **Agent Integration**: Spawns code modification agents to process `AI!` comments
- **Configurable Filesystems**: Customizable agent types, polling intervals, and concurrency settings per filesystem
- **Queue Processing**: Handles file processing with configurable concurrency using an async work queue
- **Debounce Handling**: Prevents excessive triggering on rapid file changes
- **Automatic Service Registration**: Seamless integration with the Token Ring application framework

## Core Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service name: `"CodeWatchService"` |
| `description` | string | Service description |
| `workQueue` | AsyncQueue | Async queue for concurrent file processing |

## Key Features Summary

- Only processes `# AI!` and `// AI!` comments for code modification
- Supports Python/shell (`#`) and C-style (`//`) comment formats
- Configurable polling intervals and stability thresholds
- Multiple filesystem monitoring with individual configurations
- Concurrent file processing with configurable queue size
- Automatic agent spawning for code modifications
- File deletion events are logged but not processed

## Core Methods

### run(signal: AbortSignal): Promise<void>

Starts the CodeWatchService and begins monitoring all configured filesystems.

**Parameters:**

- `signal`: AbortSignal to cancel the service

**Example:**

```typescript
const abortController = new AbortController();
await service.run(abortController.signal);
```

### watchFileSystem(fileSystemProviderName: string, filesystemConfig: FileSystemConfig, signal: AbortSignal): Promise<void>

Configures and starts watching a filesystem for file changes.

**Parameters:**

- `fileSystemProviderName`: Unique identifier for the filesystem
- `filesystemConfig`: Configuration object including `pollInterval`, `stabilityThreshold`, and `agentType`
- `signal`: AbortSignal to cancel the watcher

### processFileForAIComments({filePath, fileSystemProviderName}): Promise<void>

Scans a file for AI comments and processes them.

**Parameters:**

- `filePath`: Path to the file to process
- `fileSystemProviderName`: Name of the filesystem provider

### checkAndTriggerAIAction(line: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>

Checks a comment line for AI triggers and initiates action.

**Parameters:**

- `line`: The comment line content
- `filePath`: Path of the file containing the comment
- `lineNumber`: Line number in the file
- `fileSystemProviderName`: Name of the filesystem provider

### handleAIComment(commentLine: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>

Handles processing of a specific AI comment type.

**Parameters:**

- `commentLine`: The comment line content
- `filePath`: Path of the file
- `lineNumber`: Line number in the file
- `fileSystemProviderName`: Name of the filesystem provider

### triggerCodeModification(content: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>

Triggers code modification agent for an `AI!` comment.

**Parameters:**

- `content`: The content of the comment
- `filePath`: Path of the file
- `lineNumber`: Line number in the file
- `fileSystemProviderName`: Name of the filesystem provider

### runCodeModification(prompt: string, filePath: string, agent: Agent): Promise<void>

Executes code modification agent.

**Parameters:**

- `prompt`: The instruction prompt for the agent
- `filePath`: Path of the file
- `agent`: The Agent instance to execute commands on

## Usage Examples

### Basic Integration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import codeWatchPlugin from "@tokenring-ai/code-watch";

const app = new TokenRingApp({
  plugins: [codeWatchPlugin],
  config: {
    codewatch: {
      filesystems: {
        local: {
          pollInterval: 1000,
          stabilityThreshold: 2000,
          agentType: "code-modification-agent"
        }
      },
      concurrency: 1
    }
  }
});

app.start();
```

### Manual Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import { CodeWatchService } from "@tokenring-ai/code-watch";
import { CodeWatchConfigSchema } from "@tokenring-ai/code-watch";

const app = new TokenRingApp();

const config = {
  filesystems: {
    local: {
      pollInterval: 1500,
      stabilityThreshold: 2500,
      agentType: "code-modification-agent"
    },
    project: {
      pollInterval: 1000,
      stabilityThreshold: 2000,
      agentType: "project-agent"
    }
  },
  concurrency: 2
};

app.addServices(new CodeWatchService(app, config));
```

### Running the Service Manually

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import { CodeWatchService } from "@tokenring-ai/code-watch";

const app = new TokenRingApp();
const config = {
  filesystems: {
    local: {
      pollInterval: 1000,
      stabilityThreshold: 2000,
      agentType: "code-modification-agent"
    }
  },
  concurrency: 1
};

const service = new CodeWatchService(app, config);
const abortController = new AbortController();

// Start monitoring
await service.run(abortController.signal);

// Stop monitoring
abortController.abort();
```

### Error Handling

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import { CodeWatchService } from "@tokenring-ai/code-watch";

const app = new TokenRingApp();
const service = new CodeWatchService(app, config);

try {
  await service.run(new AbortController().signal);
} catch (error) {
  app.logger.error(`CodeWatchService error: ${error}`);
}
```

## Configuration

The `codewatch` configuration schema defines the structure for configuring the CodeWatch plugin.

### Configuration Schema

```typescript
const CodeWatchConfigSchema = z.object({
  filesystems: z.record(z.string(), z.object({
    pollInterval: z.number().default(1000),
    stabilityThreshold: z.number().default(2000),
    agentType: z.string()
  })),
  concurrency: z.number().default(1),
});
```

### Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `filesystems` | Record<string, FileSystemConfig> | Required | Configuration for each filesystem to monitor |
| `concurrency` | number | 1 | Maximum concurrent file processing operations |

#### FileSystemConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pollInterval` | number | 1000 | Polling interval in milliseconds for detecting file changes |
| `stabilityThreshold` | number | 2000 | Time in milliseconds to wait after a change before processing |
| `agentType` | string | Required | Type of agent to spawn for code modifications |

### Example Configuration

```typescript
const appConfig = {
  codewatch: {
    filesystems: {
      local: {
        pollInterval: 1000,
        stabilityThreshold: 2000,
        agentType: "code-modification-agent"
      },
      project: {
        pollInterval: 1500,
        stabilityThreshold: 2500,
        agentType: "project-agent"
      }
    },
    concurrency: 2
  }
};
```

## Integration

The code-watch plugin integrates with the Token Ring agent system by registering the `CodeWatchService` as a service. The integration flow is:

1. **File Change Detection**: The service monitors configured filesystems for file additions and changes
2. **AI Comment Scanning**: When a file changes, it scans for comment lines containing AI triggers
3. **Agent Spawning**: When an `AI!` comment is detected, a code modification agent is spawned
4. **Code Modification**: The agent processes the instruction and updates the file
5. **Comment Cleanup**: The agent removes the `AI!` comment line from the file

### Integration Points

The plugin requires the following services:

- **FileSystemService**: For reading files and watching filesystem changes
- **AgentManager**: For spawning code modification agents

### AI Comment Processing

The service processes the following types of AI comments:

- **`AI!` Comments**: Trigger code modification actions. When detected, the service spawns a code modification agent to process the instruction, updates the file, and removes the comment
- **`AI?` and `AI` Comments**: Not implemented and are ignored

**Supported Comment Formats:**

- Python/shell style: `# AI!`, `# AI?`, `# AI`
- C-style: `// AI!`, `// AI?`, `// AI`

## Best Practices

1. **Agent Selection**: Choose appropriate agent types for different filesystems based on the type of code modifications expected
2. **Polling Intervals**: Balance between responsiveness and system load by adjusting `pollInterval` and `stabilityThreshold`
3. **Concurrency**: Set appropriate concurrency levels based on your system's capabilities
4. **Error Monitoring**: Implement monitoring for service errors to catch issues early
5. **File Patterns**: Use ignore patterns to exclude files that don't require monitoring

## Known Limitations

- Only supports `#` (Python/Shell) and `//` (C-style) comments for AI triggers
- Only processes `AI!` comments (other comment types like `AI?` or `AI` are not processed)
- Polling-based file watching (not real-time filesystem events)
- Assumes UTF-8 text files
- File deletion events are logged but not processed
- Only processes files on add/change events
- Limited to single-line comment detection
- No support for multi-line comment formats (`/* ... */`)

## Testing

Run tests using:

```bash
bun run test
```

Run tests in watch mode:

```bash
bun run test:watch
```

Generate coverage reports:

```bash
bun run test:coverage
```

## Development

### Build

```bash
bun run build
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests
4. Submit a pull request

## Related Components

- [@tokenring-ai/app](./app.md): Base application framework with service management
- [@tokenring-ai/filesystem](./filesystem.md): Filesystem operations and watching
- [@tokenring-ai/agent](./agent.md): Agent orchestration system
- [@tokenring-ai/chat](./chat.md): Chat functionality for agent interaction
