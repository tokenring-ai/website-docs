# Code Watch

Code Watch is a service that monitors files for AI comments and triggers automated code modification workflows. It integrates with the Token Ring AI framework to execute actions based on special comments like `# AI!` or `// AI!` in code files.

## Overview

Code Watch provides real-time file system monitoring for detecting code changes and processing AI instructions embedded in comments. When an AI comment containing `AI!` is detected, the service spawns an agent in headless mode to execute the specified instructions.

### Key Features

- **File System Monitoring**: Watches multiple filesystems for file additions and changes using virtual filesystem providers
- **AI Comment Detection**: Detects AI triggers in both Python/shell (`#`) and C-style (`//`) comments
- **Smart Change Handling**: Implements stability thresholds to debounce rapid file changes
- **Concurrent Processing**: Uses `async.queue` for configurable concurrent file processing operations
- **Agent Integration**: Automatically spawns agents in headless mode to execute AI instructions
- **Ignore Pattern Support**: Respects ignore patterns from filesystem providers
- **Error Resilience**: Comprehensive error logging and graceful failure handling
- **Background Service**: Runs as a background service without chat commands or tools

## Core Components

### CodeWatchService

The main service that monitors files and processes AI comments.

**Location**: `pkg/code-watch/CodeWatchService.ts`

**Interface**: Implements `TokenRingService` from `@tokenring-ai/app`

**Properties**:
- `name`: Service name, set to `"CodeWatchService"`
- `description`: Service description
- `workQueue`: Async queue for concurrent file processing operations

### Plugin

Coordinates service registration and configuration handling using TokenRingPlugin.

**Location**: `pkg/code-watch/plugin.ts`

**Exports**: Default token ring plugin configuration

## Services

### CodeWatchService

The primary service implementation that provides file monitoring and AI comment processing capabilities.

**Implements**: `TokenRingService`

**Constructor**:
```typescript
constructor(app: TokenRingApp, config: z.output<typeof CodeWatchConfigSchema>)
```

**Methods**:

- `async run(signal: AbortSignal): Promise<void>`
  - Starts the service and begins monitoring all configured filesystems
  - Returns when all watchers are set up and the abort signal is received

- `async watchFileSystem(fileSystemProviderName: string, filesystemConfig: FileSystemConfig, signal: AbortSignal): Promise<void>`
  - Configures and starts watching a specific filesystem
  - Sets up event handlers for file add, change, unlink, and error events
  - Implements debouncing using stability thresholds

- `async processFileForAIComments({filePath, fileSystemProviderName}): Promise<void>`
  - Scans a file for AI comments
  - Processes each line for Python/shell and C-style comment patterns

- `async checkAndTriggerAIAction(line: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>`
  - Checks if a comment line contains AI triggers
  - Initiates action handling for matching patterns

- `async handleAIComment(commentLine: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>`
  - Handles processing of AI comments
  - Triggers code modification for `AI!` markers

- `async triggerCodeModification(content: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>`
  - Spawns a code modification agent
  - Executes the AI instruction from the comment

- `async runCodeModification(prompt: string, filePath: string, agent: Agent): Promise<void>`
  - Executes the code modification command on the agent
  - Adds the file to the agent's chat context

## Configuration

### Plugin Configuration

Configure the CodeWatch plugin by adding the `codewatch` section to your application config:

```typescript
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
    concurrency: 1
  }
});
```

### Configuration Schema

CodeWatch configuration uses Zod schema validation in two locations:

**packageConfigSchema** (plugin.ts):
```typescript
const packageConfigSchema = z.object({
  codewatch: CodeWatchConfigSchema.optional(),
});
```

**CodeWatchConfigSchema** (index.ts):
```typescript
export const CodeWatchConfigSchema = z.object({
  filesystems: z.record(z.string(), z.object({
    pollInterval: z.number().default(1000),
    stabilityThreshold: z.number().default(2000),
    agentType: z.string()
  })),

  concurrency: z.number().default(1),
});
```

### Configuration Options

#### CodeWatchConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `filesystems` | `Record<string, FileSystemConfig>` | - | Configuration for each filesystem to monitor |
| `concurrency` | `number` | `1` | Maximum concurrent file processing operations |

#### FileSystemConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pollInterval` | `number` | `1000` | Polling interval in milliseconds for detecting file changes |
| `stabilityThreshold` | `number` | `2000` | Time in milliseconds to wait after a change before processing |
| `agentType` | `string` | - | Type of agent to spawn for code modifications |

## Chat Commands

This package does not provide chat commands. It operates as a background service that monitors files for changes and processes AI comments automatically.

## RPC Endpoints

This package does not define RPC endpoints. It operates as a background service within the TokenRing application.

## Usage Examples

### Basic Installation

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
    concurrency: 1
  }
});

// Start the service
const service = app.getService('CodeWatchService');
const abortController = new AbortController();
await service.run(abortController.signal);
```

### Configuring Multiple Filesystems

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
    concurrency: 2
  }
});

// Start the service
const service = app.getService('CodeWatchService');
const abortController = new AbortController();
await service.run(abortController.signal);
```

### Writing AI Comments

Use `AI!` tags in comments to trigger code modifications:

```typescript
// Python/shell style - triggers code modification
# AI! Refactor this function to use async/await properly
function oldFunction() {
  // ... existing code
}

// C-style - triggers code modification
// AI! Add error handling for file operations
function readFile(path: string) {
  // ... code that needs error handling
}

// AI! can also appear at the end of a line
const data = fetchData(); // AI! Add error handling here
```

### Starting and Stopping the Service

```typescript
import TokenRingApp from '@tokenring-ai/app';
import CodeWatchService from '@tokenring-ai/code-watch/CodeWatchService';
import {z} from 'zod';

const app = new TokenRingApp();

const config: z.infer<typeof import('@tokenring-ai/code-watch').CodeWatchConfigSchema> = {
  filesystems: {
    local: {
      pollInterval: 1500,
      stabilityThreshold: 2500,
      agentType: 'code-modification-agent'
    }
  },
  concurrency: 1
};

// Install the service manually
app.addServices(new CodeWatchService(app, config));

// Run the service
const service = app.getService('CodeWatchService');
const abortController = new AbortController();

try {
  await service.run(abortController.signal);
} catch (error) {
  console.error('CodeWatch service error:', error);
}

// Stop the service
abortController.abort();
```

### Error Handling

```typescript
import TokenRingApp from '@tokenring-ai/app';
import CodeWatchService from '@tokenring-ai/code-watch/CodeWatchService';
import {z} from 'zod';

const app = new TokenRingApp();
const config: z.infer<typeof import('@tokenring-ai/code-watch').CodeWatchConfigSchema> = {
  filesystems: {
    local: {
      pollInterval: 1000,
      stabilityThreshold: 2000,
      agentType: 'code-modification-agent'
    }
  },
  concurrency: 1
};

const service = new CodeWatchService(app, config);

const abortController = new AbortController();

await service.run(abortController.signal)
  .catch(error => {
    // Handle service errors
    console.error('Service stopped unexpectedly:', error);
  });
```

## Integration

### Service Integration Flow

1. **Service Registration**: CodeWatchService is registered with the application via plugin install
2. **Filesystem Setup**: Each configured filesystem is monitored for changes
3. **Change Detection**: Filesystem watcher detects additions and modifications
4. **Debouncing**: Multiple rapid changes trigger stability thresholds to filter out incomplete writes
5. **Comment Detection**: File content is scanned for AI comment patterns
6. **AI Trigger Detection**: Comments with `AI!` markers trigger action handling
7. **Agent Spawning**: Code modification agent is spawned in headless mode
8. **Instruction Execution**: Agent processes the AI instruction
9. **File Update**: Agent modifies the file and removes AI markers
10. **Completion**: Service logs success and continues monitoring

### Dependencies

The CodeWatch service integrates with:

- **FileSystemService**: For reading files, watching filesystem changes, and managing filesystem providers
- **AgentManager**: For spawning code modification agents
- **AgentCommandService**: For executing commands on spawned agents
- **getTokenRingApp**: Required by service context

### Agent Integration Workflow

When an `AI!` comment is detected:

```typescript
// 1. Agent is spawned in headless mode with specified agentType
const agent = await agentManager.spawnAgent({
  agentType: config.agentType,
  headless: true
});

// 2. File system provider name is set as active for the agent context
fileSystemService.setActiveFileSystem(fileSystemProviderName, agent);

// 3. Agent receives file context via addFileToChat
await fileSystemService.addFileToChat(filePath, agent);

// 4. Command is executed with specific prompt
const agentCommandService = agent.requireServiceByType(AgentCommandService);
await agentCommandService.executeAgentCommand(agent, `/work ${prompt}`);

// 5. File is updated and AI! is removed by agent completion
```

**Agent Prompt Format**:

```typescript
const prompt = `
The user has edited the file ${filePath}, included above, adding instructions to the file, which they expect AI to execute.
Look for any lines in the file marked with the tag AI!, which contain the users instructions.
Complete the instructions in that line or in any nearby comments, using any tools available to you to complete the task.
Once complete, update the file using the file_write tool. You MUST remove any lines that end with AI!. It is a critical failure to leave these lines in the file.

`.trim();
```

### Provided Package Structure

```
pkg/code-watch/
├── README.md                # Documentation
├── package.json             # Package configuration
├── vitest.config.ts         # Test configuration
├── index.ts                 # CodeWatchConfigSchema export
├── CodeWatchService.ts      # Main service implementation
└── plugin.ts                # Plugin registration
```

## AI Comment Detection Pattern

The service detects AI triggers using two patterns:

1. **Lines starting with `# AI` or `// AI`**: Triggers code modification processing
2. **Lines ending with `AI!`**: Triggers code modification processing regardless of prefix content

**Detection flow**:
- Lines starting with `#` or `//` are scanned
- Lines matching either pattern are sent to `checkAndTriggerAIAction()`
- Comments starting with `# AI` or `// AI` call `handleAIComment()`
- Comments ending with `AI!` call `handleAIComment()`
- Only comments with `AI!` in content trigger code modification via `triggerCodeModification()`

### AI Comment Types

The service supports one type of AI comment:

| Pattern | Description |
|---------|-------------|
| `AI!` | Indicates a command that AI must execute. This is a critical instruction that requires completion. |

**Note**: The `AI!` marker must be present in the comment content for code modification to be triggered. Comments that start with `# AI` or `// AI` but don't contain `AI!` will be detected but won't trigger action.

## Best Practices

### Agent Selection

Choose appropriate agent types based on the complexity of tasks:
- Use simpler agents for straightforward modifications
- Use more capable agents for complex refactoring

### Balancing Performance

- Adjust `pollInterval` for responsiveness vs. system load
- Set appropriate `stabilityThreshold` to avoid processing incomplete writes
- Configure `concurrency` based on your system's capabilities
- Stability thresholds handle file write completion detection

### Error Monitoring

Implement monitoring for service errors to catch issues early:
- File processing errors are logged via `app.serviceError()`
- Agent execution errors are caught and logged
- Watcher errors are caught and logged with event type

### File Stability

Ensure files are fully written before triggering processing. The `stabilityThreshold` handles this by waiting for changes to settle through debouncing.

### Provider Configuration

Configure appropriate filesystem providers before starting:
- Each filesystem provider must support watch and readFile operations
- Providers should have appropriate ignore patterns for non-code files
- Polling intervals can vary by filesystem location

## Error Handling

The service implements comprehensive error handling:

- **File Processing Errors**: Errors during file reading or processing are caught in workQueue worker callback and logged via `app.serviceError()`
- **Agent Errors**: Errors during agent execution are caught and logged via `app.serviceError()`
- **Watcher Errors**: Errors in file watchers are caught and logged via `app.serviceError()`
- **Graceful Shutdown**: Watchers are properly closed when signal is aborted via `waitForAbort()`
- **Queue Handling**: Errors don't stop the queue; failed items cause errors to be logged and processing continues

## Testing

The package includes test infrastructure configured with Vitest.

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Configuration

Test files are configured in `vitest.config.ts`:
```typescript
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true
  }
});
```

**Note**: No test files currently exist in the package. Test infrastructure is configured but individual tests have not been implemented yet.

## API Reference

### CodeWatchService

Main service class for monitoring files and processing AI comments.

```typescript
class CodeWatchService implements TokenRingService {
  name = "CodeWatchService";
  description = "Provides CodeWatch functionality that monitors files for AI comments";
  workQueue: async.queue<{ filePath: string, fileSystemProviderName: string }>;

  constructor(app: TokenRingApp, config: CodeWatchConfig);
  async run(signal: AbortSignal): Promise<void>;
  async watchFileSystem(fileSystemProviderName: string, filesystemConfig: FileSystemConfig, signal: AbortSignal): Promise<void>;
  async processFileForAIComments({filePath, fileSystemProviderName}: {filePath: string, fileSystemProviderName: string}): Promise<void>;
  async checkAndTriggerAIAction(line: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>;
  async handleAIComment(commentLine: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>;
  async triggerCodeModification(content: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>;
  async runCodeModification(prompt: string, filePath: string, agent: Agent): Promise<void>;
}
```

### Constructor

```typescript
constructor(app: TokenRingApp, config: z.output<typeof CodeWatchConfigSchema>)
```

Creates a new CodeWatchService instance.

**Parameters**:
- `app`: TokenRing application instance
- `config`: Configuration object containing `filesystems` and `concurrency`

**Properties**:
- `name`: Service name, set to `"CodeWatchService"`
- `description`: Service description
- `workQueue`: Async queue for concurrent file processing operations with configurable concurrency

**Methods**:

- `async run(signal: AbortSignal): Promise<void>`
  - Starts the service and monitors all configured filesystems
  - **Parameters**: `signal` - AbortSignal to cancel the service
  - **Returns**: `Promise<void>` - Resolves when service stops

- `async watchFileSystem(fileSystemProviderName: string, filesystemConfig: FileSystemConfig, signal: AbortSignal): Promise<void>`
  - Configures and starts watching a filesystem for file changes
  - **Parameters**:
    - `fileSystemProviderName`: Unique identifier for the filesystem
    - `filesystemConfig`: Configuration with `pollInterval`, `stabilityThreshold`, and `agentType`
    - `signal`: AbortSignal to cancel the watcher
  - **Returns**: `Promise<void>` - Resolves when watcher is set up
  - **Behavior**:
    - Retrieves FileSystemService
    - Gets filesystem provider by name
    - Creates watcher using provider's `watch()` method
    - Sets up event handlers for add, change, unlink, and error events
    - Implements debouncing using modifiedFiles Map
    - Waits for abort signal via `waitForAbort()`

- `async processFileForAIComments({filePath, fileSystemProviderName}): Promise<void>`
  - Scans a file for AI comments and processes them
  - **Parameters**:
    - `filePath`: Path to the file to process
    - `fileSystemProviderName`: Name of the filesystem provider
  - **Returns**: `Promise<void>` - Resolves when processing is complete
  - **Behavior**:
    - Reads file content via filesystem provider
    - Splits content into lines
    - Scans each line for Python/shell (`#`) or C-style (`//`) comments
    - Sends matching triggers to `checkAndTriggerAIAction()`

- `async checkAndTriggerAIAction(line: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>`
  - Checks a comment line for AI triggers and initiates action
  - **Parameters**:
    - `line`: The comment line content
    - `filePath`: Path of the file containing the comment
    - `lineNumber`: Line number in the file
    - `fileSystemProviderName`: Name of the filesystem provider
  - **Returns**: `Promise<void>` - Resolves when action is initiated
  - **AI Trigger Patterns**:
    - Lines starting with `# AI` or `// AI`
    - Lines ending with `AI!`

- `async handleAIComment(commentLine: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>`
  - Handles processing of a specific AI comment type
  - **Parameters**:
    - `commentLine`: The comment line content
    - `filePath`: Path of the file
    - `lineNumber`: Line number in the file
    - `fileSystemProviderName`: Name of the filesystem provider
  - **Returns**: `Promise<void>` - Resolves when handling is complete
  - **Behavior**:
    - Extracts actual comment content (removes `# ` or `// ` prefix)
    - Checks if content includes `AI!` marker
    - Calls `triggerCodeModification()` if `AI!` is present

- `async triggerCodeModification(content: string, filePath: string, lineNumber: number, fileSystemProviderName: string): Promise<void>`
  - Triggers code modification agent for an `AI!` comment
  - **Parameters**:
    - `content`: The content of the comment
    - `filePath`: Path of the file
    - `lineNumber`: Line number in the file
    - `fileSystemProviderName`: Name of the filesystem provider
  - **Returns**: `Promise<void>` - Resolves when code modification starts
  - **Behavior**:
    - Retrieves AgentManager and FileSystemService via `app.requireService()`
    - Fetches filesystem config for agent type
    - Spawns agent in headless mode with specified agentType
    - Sets active filesystem for agent using `fileSystemService.setActiveFileSystem()`
    - Logs action notification via `app.serviceOutput()`
    - Creates modification prompt with file context and AI! removal instruction
    - Executes via `runCodeModification()`

- `async runCodeModification(prompt: string, filePath: string, agent: Agent): Promise<void>`
  - Executes code modification agent
  - **Parameters**:
    - `prompt`: The instruction prompt for the agent
    - `filePath`: Path of the file
    - `agent`: The Agent instance to execute commands on
  - **Returns**: `Promise<void>` - Resolves when modification is complete
  - **Behavior**:
    - Adds file to agent's chat context
    - Retrieves AgentCommandService from agent
    - Executes `/work` command with the prompt
    - Waits for agent to complete the task

## Related Components

- **@tokenring-ai/app**: Core application framework
  - `TokenRingPlugin`: Plugin interface and TokenRingApp access
  - `TokenRingService`: Service interface and service registration
  - `waitForAbort`: Abort signal handler utility

- **@tokenring-ai/agent**: Agent management and execution
  - `Agent`: Agent class for command execution
  - `AgentManager`: Agent spawning and management
  - `AgentCommandService`: Command execution interface

- **@tokenring-ai/filesystem**: File system abstraction
  - `FileSystemService`: File system management
  - `FileSystemProvider`: File system provider interface
  - `createIgnoreFilter`: Ignore pattern filter utility

- **@tokenring-ai/utility**: Utility functions
  - Async queue handling

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: 0.2.0 - Core application framework
- `@tokenring-ai/chat`: 0.2.0 - Chat functionality
- `zod`: ^4.3.6 - Schema validation
- `@tokenring-ai/agent`: 0.2.0 - Agent management
- `@tokenring-ai/filesystem`: 0.2.0 - File system abstraction
- `@tokenring-ai/utility`: 0.2.0 - Utility functions
- `async`: ^3.2.6 - Concurrent processing
- `ignore`: ^7.0.5 - Ignore pattern matching

### Development Dependencies

- `vitest`: ^4.0.18 - Testing framework
- `typescript`: ^5.9.3 - TypeScript compiler
- `@types/async`: ^3.2.25 - Async type definitions

## License

MIT License - see LICENSE file for details.
