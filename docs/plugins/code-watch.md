# Code Watch

## User Guide

### Overview and Purpose

The `@tokenring-ai/code-watch` plugin provides a background service for the Token Ring AI ecosystem that monitors configured filesystems for file changes, detects special AI comment patterns (like `# AI!` or `// AI!`), and automatically spawns agents to execute code modifications based on those instructions.

This service uses polling-based file system watching with configurable intervals and stability thresholds to debounce rapid file changes. When an AI comment with the `AI!` marker is detected, the service spawns a configured agent type in headless mode to execute the requested code modifications.

### Key Features

- **File System Monitoring**: Watches multiple filesystems for file additions and changes using virtual filesystem providers
- **AI Comment Detection**: Detects AI triggers in both Python/shell (`#`) and C-style (`//`) comments
- **Smart Change Handling**: Uses stability thresholds to debounce rapid file changes
- **Concurrent Processing**: Processes files concurrently with configurable worker queue via `async.queue`
- **Agent Integration**: Automatically spawns appropriate agents to execute AI instructions in headless mode
- **Error Handling**: Comprehensive error logging and graceful failure handling
- **Ignore Filtering**: Respects ignore patterns from filesystem providers

### Chat Commands

This plugin does not provide chat commands. It operates as a background service monitoring files for changes.

### Tools

This plugin does not provide tools. It operates as a background service.

### Configuration

The Code Watch plugin requires configuration to specify which filesystems to monitor and how to process changes.

#### Configuration Options

| Field       | Type              | Required | Description                          |
|:------------|:------------------|:---------|:-------------------------------------|
| `codewatch` | `CodeWatchConfig` | No       | Main configuration object            |

#### CodeWatchConfig

| Field         | Type                               | Default  | Description                          |
|:--------------|:-----------------------------------|:---------|:-------------------------------------|
| `filesystems` | `Record<string, FileSystemConfig>` | Yes      | Filesystems to monitor               |
| `concurrency` | `number`                           | `1`      | Maximum concurrent file processing   |

#### FileSystemConfig

| Field                | Type     | Default  | Description                          |
|:---------------------|:---------|:---------|:-------------------------------------|
| `pollInterval`       | `number` | `1000`   | Polling interval in milliseconds     |
| `stabilityThreshold` | `number` | `2000`   | Debounce threshold in milliseconds   |
| `agentType`          | `string` | Yes      | Type of agent to spawn for processing |

#### Configuration Example

```yaml
codewatch:
  filesystems:
    local:
      pollInterval: 1000
      stabilityThreshold: 2000
      agentType: 'code-modification-agent'
    project:
      pollInterval: 1500
      stabilityThreshold: 2500
      agentType: 'project-agent'
  concurrency: 2
```

### Integration

The Code Watch plugin integrates with the Token Ring application through the plugin system. It requires the following services to be available:

- **FileSystemService**: For file operations and watching
- **AgentManager**: For spawning agents to execute AI instructions

#### Plugin Installation

```typescript
import TokenRingApp from '@tokenring-ai/app';
import codeWatch from '@tokenring-ai/code-watch/plugin';

const app = new TokenRingApp();

app.install(codeWatch, {
  codewatch: {
    filesystems: {
      local: {
        pollInterval: 1000,
        stabilityThreshold: 2000,
        agentType: 'code-modification-agent'
      }
    },
    concurrency: 2
  }
});

await app.run();
```

### Best Practices

1. **Choose Appropriate Polling Intervals**: Set `pollInterval` based on your filesystem performance. Lower values provide faster response but consume more resources.

2. **Configure Stability Threshold**: Set `stabilityThreshold` to avoid processing files that are being rapidly modified. A value of 2000ms (2 seconds) is recommended for most use cases.

3. **Use Specific Agent Types**: Configure different agent types for different filesystems based on the expected code modification tasks.

4. **Respect Ignore Patterns**: Ensure your filesystem providers are configured with appropriate ignore patterns to avoid watching unnecessary files.

5. **Monitor Concurrency**: Set `concurrency` based on your system resources. Higher values allow parallel processing but may impact performance.

6. **Clear AI! Comments**: Remember that agents are instructed to remove `AI!` comments after completion. This serves as a completion marker.

---

## Developer Reference

### Core Components

#### CodeWatchService

The main service responsible for file monitoring and AI comment processing. Implements the `TokenRingService` interface.

**Location**: `pkg/code-watch/CodeWatchService.ts`

```typescript
import CodeWatchService from "@tokenring-ai/code-watch/CodeWatchService";
import { CodeWatchConfigSchema } from "@tokenring-ai/code-watch";
```

##### Properties

| Property      | Type                 | Description                                |
|:--------------|:---------------------|:-------------------------------------------|
| `name`        | `"CodeWatchService"` | Service name identifier                    |
| `description` | `string`             | Service description                        |
| `app`         | `TokenRingApp`       | TokenRing application instance             |
| `config`      | `CodeWatchConfig`    | Service configuration                      |
| `workQueue`   | `QueueObject`        | Async queue for concurrent file processing |

##### Constructor

```typescript
constructor(app: TokenRingApp, config: z.output<typeof CodeWatchConfigSchema>)
```

**Parameters:**

- `app`: TokenRing application instance
- `config`: Configuration object for service settings

### Services

#### CodeWatchService Implementation

The `CodeWatchService` implements the `TokenRingService` interface and provides the following lifecycle methods:

##### `run(signal: AbortSignal): Promise<void>`

Starts the service and begins monitoring files for changes across all configured filesystems.

**Parameters:**

- `signal`: `AbortSignal` to cancel the service

**Behavior:**

- Iterates through all configured filesystems
- Calls `watchFileSystem()` for each filesystem
- Returns after all watchers are set up
- Handles graceful shutdown when signal is aborted

### File System Watching

The service uses the virtual file system's `watch()` method to create watchers with the following configuration:

```typescript
const watcher = await fileSystemProvider.watch("./", {
  pollInterval: filesystemConfig.pollInterval,
  stabilityThreshold: filesystemConfig.stabilityThreshold,
  ignoreFilter: await createIgnoreFilter(fileSystemProvider),
});
```

#### Event Handling

The service handles the following file system events:

- **add**: New file added
- **change**: File content modified
- **unlink**: File deleted

Debouncing is implemented using `stabilityThreshold` to handle rapid file changes:

```typescript
const onFileChanged = (eventType: string, filePath: string) => {
  if (modifiedFiles.has(filePath)) {
    clearTimeout(modifiedFiles.get(filePath));
    modifiedFiles.delete(filePath);
  }

  if (eventType === "add" || eventType === "change") {
    modifiedFiles.set(
      filePath,
      setTimeout(() => {
        void this.workQueue.push({ filePath, fileSystemProviderName });
      }),
    );
  }
};
```

### AI Comment Detection

The service scans files for AI comments using these patterns:

1. **Lines starting with `# AI`**: Python/shell style comments
2. **Lines starting with `// AI`**: C-style comments
3. **Lines containing `AI!`**: Any comment with the trigger marker

Only comments containing `AI!` will trigger code modification.

#### Comment Processing Flow

```typescript
// Pattern matching
const startsWithAIPattern = line.startsWith("# AI") || line.startsWith("// AI");
const containsAIExclamation = line.includes("AI!");

if (startsWithAIPattern || containsAIExclamation) {
  await this.handleAIComment(line, filePath, lineNumber, fileSystemProviderName);
}
```

### Code Modification Workflow

When an `AI!` comment is detected, the service follows this workflow:

1. **Spawn Agent**: Creates an agent of the configured type in headless mode
2. **Set Active Filesystem**: Associates the filesystem with the agent
3. **Add File to Chat**: Includes the file in the agent's context
4. **Execute Command**: Runs the `/work` command with the modification prompt
5. **Agent Execution**: Agent completes the task and removes the `AI!` comment

#### Prompt Template

The service generates a prompt that instructs the agent:

```text
The user has edited the file {filePath}, included above, adding instructions to the file, which they expect AI to execute.
Look for any lines in the file marked with the tag AI!, which contain the users instructions.
Complete the instructions in that line or in any nearby comments, using any tools available to you to complete the task.
Once complete, update the file using the file_write tool. You MUST remove any lines that end with AI!. It is a critical failure to leave these lines in the file.
```

### Usage Examples

#### Basic Plugin Installation

```typescript
import TokenRingApp from '@tokenring-ai/app';
import codeWatch from '@tokenring-ai/code-watch/plugin';

const app = new TokenRingApp();

app.install(codeWatch, {
  codewatch: {
    filesystems: {
      local: {
        pollInterval: 1000,
        stabilityThreshold: 2000,
        agentType: 'code-modification-agent'
      }
    },
    concurrency: 2
  }
});

await app.run();
```

#### Multiple Filesystem Configuration

```typescript
import TokenRingApp from '@tokenring-ai/app';
import codeWatch from '@tokenring-ai/code-watch/plugin';

const app = new TokenRingApp();

app.install(codeWatch, {
  codewatch: {
    filesystems: {
      local: {
        pollInterval: 1000,
        stabilityThreshold: 2000,
        agentType: 'code-modification-agent'
      },
      project: {
        pollInterval: 1500,
        stabilityThreshold: 2500,
        agentType: 'project-agent'
      }
    },
    concurrency: 3
  }
});

await app.run();
```

#### AI Comment Examples

**Python/Shell Style:**

```python
# AI! Fix the off-by-one error in the loop below
for i in range(10):
    print(i)
```

**C-Style:**

```javascript
// AI! Refactor this function to use async/await
function fetchData() {
    return fetch('/api/data').then(res => res.json());
}
```

**Inline Instructions:**

```typescript
const result = processData(data); // AI! Add error handling here
```

### Testing

#### Test Configuration

The package uses Vitest for testing. Configuration is in `vitest.config.ts`.

#### Running Tests

```bash
bun test
```

#### Running Tests in Watch Mode

```bash
bun test:watch
```

#### Running Test Coverage

```bash
bun test:coverage
```

### Dependencies

#### Production Dependencies

| Package                    | Version    | Description                        |
|:---------------------------|:-----------|:-----------------------------------|
| `@tokenring-ai/app`        | workspace:* | Core application framework         |
| `@tokenring-ai/agent`      | workspace:* | Agent management and orchestration |
| `@tokenring-ai/filesystem` | workspace:* | File system abstraction            |
| `@tokenring-ai/utility`    | workspace:* | Utility functions and helpers      |
| `zod`                      | ^4.3.6     | Schema validation                  |
| `async`                    | ^3.2.6     | Concurrent processing utilities    |

#### Development Dependencies

| Package        | Version  | Description            |
|:---------------|:---------|:-----------------------|
| `vitest`       | ^4.1.1   | Testing framework      |
| `typescript`   | ^6.0.2   | TypeScript compiler    |
| `@types/async` | ^3.2.25  | Async type definitions |

### Related Components

- **@tokenring-ai/filesystem**: File system abstraction and providers
- **@tokenring-ai/agent**: Agent management and command execution
- **@tokenring-ai/utility**: Utility functions including promise helpers

### Package Structure

```text
pkg/code-watch/
├── index.ts              # Configuration schema and exports
├── CodeWatchService.ts   # Main service implementation
├── plugin.ts             # Plugin definition and registration
├── package.json          # Package metadata and dependencies
├── README.md             # Package documentation
├── vitest.config.ts      # Test configuration
└── LICENSE               # MIT License
```

### Schema Documentation

#### CodeWatchConfigSchema

Defined in `pkg/code-watch/index.ts`:

```typescript
import { z } from "zod";

export const CodeWatchConfigSchema = z.object({
  filesystems: z.record(
    z.string(),
    z.object({
      pollInterval: z.number().default(1000),
      stabilityThreshold: z.number().default(2000),
      agentType: z.string(),
    }),
  ),

  concurrency: z.number().default(1),
});
```

**Schema Fields:**

| Field         | Type                               | Description                          |
|:--------------|:-----------------------------------|:-------------------------------------|
| `filesystems` | `Record<string, FileSystemConfig>` | Map of filesystem provider names to configurations |
| `concurrency` | `number`                           | Maximum number of concurrent file processing operations |

**FileSystemConfig Fields:**

| Field                | Type     | Default  | Description                          |
|:---------------------|:---------|:---------|:-------------------------------------|
| `pollInterval`       | `number` | `1000`   | Polling interval in milliseconds     |
| `stabilityThreshold` | `number` | `2000`   | Debounce threshold in milliseconds   |
| `agentType`          | `string` | Required | Type of agent to spawn for processing |

### License

MIT License - see LICENSE file for details.
