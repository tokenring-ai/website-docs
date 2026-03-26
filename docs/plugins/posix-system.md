# @tokenring-ai/posix-system

A POSIX system package for TokenRing applications, providing Terminal and Filesystem providers that enable agents to interact with the local system in a controlled manner. This package implements concrete providers for the Token Ring filesystem and terminal abstractions.

## Overview

The `posix-system` package provides two core providers for TokenRing applications:

- **PosixFileSystemProvider**: Local filesystem operations using fs-extra, glob, and chokidar
- **PosixTerminalProvider**: Shell command execution with PTY support and optional bubblewrap sandboxing

Both providers integrate with Token Ring's service architecture and support ignore-aware operations for respecting VCS/IDE ignore rules.

## Key Features

- **Filesystem Provider**: Comprehensive filesystem operations (read, write, delete, rename, copy, stat, glob, grep, watch)
- **Terminal Provider**: Shell command execution with configurable timeouts, environment, and optional sandboxing
- **Ignore-aware operations**: Most listing/searching methods accept ignore filters for respecting VCS/IDE patterns
- **File watching**: Uses chokidar for robust filesystem watching with stability thresholds
- **Shell execution**: Uses execa for reliable command execution with timeout and buffer management
- **Bubblewrap sandboxing**: Optional bubblewrap sandboxing for terminal commands (auto-detects availability)
- **Interactive sessions**: Support for persistent interactive terminal sessions with PTY via bun-pty
- **Type-safe**: Built with TypeScript and validated with Zod schemas
- **Plugin architecture**: Integrates with Token Ring applications as a plugin
- **Async generators**: Directory tree traversal via async generators for memory-efficient iteration

## Installation

This package is part of the Token Ring monorepo. Add it to your dependencies:

```bash
bun add @tokenring-ai/posix-system
```

```json
{
  "dependencies": {
    "@tokenring-ai/posix-system": "0.2.0"
  }
}
```

## Core Components

### PosixFileSystemProvider

A concrete implementation of the `FileSystemProvider` abstraction that provides access to the local filesystem.

**Exports:**

```typescript
export default class PosixFileSystemProvider implements FileSystemProvider
```

**Constructor:**

```typescript
constructor(options: PosixFileSystemProviderOptions)
```

**Options:**

```typescript
const PosixFileSystemProviderOptionsSchema = z.object({
  // No options currently required
});
type PosixFileSystemProviderOptions = z.output<typeof PosixFileSystemProviderOptionsSchema>;
```

**Properties:**

- `name: string` - Provider name ("LocalFilesystemProvider")
- `description: string` - Provider description ("Provides access to the local filesystem")
- `options: PosixFileSystemProviderOptions` - Configuration options

**File Operations:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `writeFile` | `writeFile(filePath: string, content: string \| Buffer): Promise<boolean>` | Create or overwrite a file |
| `appendFile` | `appendFile(filePath: string, content: string \| Buffer): Promise<boolean>` | Append content to a file |
| `deleteFile` | `deleteFile(filePath: string): Promise<boolean>` | Delete a file |
| `readFile` | `readFile(filePath: string): Promise<Buffer\|null>` | Read file content (returns null if not found) |
| `rename` | `rename(oldPath: string, newPath: string): Promise<boolean>` | Rename/move a file |
| `exists` | `exists(filePath: string): Promise<boolean>` | Check if file exists |
| `stat` | `stat(filePath: string): Promise<StatLike>` | Get file/directory statistics |
| `createDirectory` | `createDirectory(dirPath: string, options?: { recursive?: boolean }): Promise<boolean>` | Create directory |
| `copy` | `copy(source: string, destination: string, options?: { overwrite?: boolean }): Promise<boolean>` | Copy files/directories |

**Search and Listing:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `glob` | `glob(pattern: string, options?: GlobOptions): Promise<string[]>` | Find files matching glob patterns |
| `grep` | `grep(searchString: string\|string[], options?: GrepOptions): Promise<GrepResult[]>` | Search for text in files |
| `getDirectoryTree` | `getDirectoryTree(dir: string, options?: DirectoryTreeOptions): AsyncGenerator<string>` | Traverse directory tree |
| `watch` | `watch(dir: string, options?: WatchOptions): Promise<FSWatcher>` | Watch directory for changes |

### PosixTerminalProvider

A concrete implementation of the `TerminalProvider` abstraction that provides shell command execution with support for persistent interactive sessions and optional bubblewrap sandboxing.

**Exports:**

```typescript
export default class PosixTerminalProvider implements TerminalProvider
```

**Constructor:**

```typescript
constructor(app: TokenRingApp, terminalService: TerminalService, options: PosixTerminalProviderOptions)
```

**Options:**

```typescript
const PosixTerminalProviderOptionsSchema = z.object({
  isolation: z.enum(['auto', 'none', 'bubblewrap']).default('auto')
});
type PosixTerminalProviderOptions = z.output<typeof PosixTerminalProviderOptionsSchema>;
```

**Properties:**

- `name: string` - Provider name ("PosixTerminalProvider")
- `description: string` - Provider description ("Provides shell command execution on local system")
- `displayName: string` - Display name with isolation level (e.g., "PosixTerminalProvider (isolation: auto)")
- `app: TokenRingApp` - Reference to the Token Ring application
- `terminalService: TerminalService` - Reference to the terminal service
- `options: PosixTerminalProviderOptions` - Configuration options

**Command Execution:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `executeCommand` | `executeCommand(command: string, args: string[], options: ExecuteCommandOptions): Promise<ExecuteCommandResult>` | Execute shell commands with arguments |
| `runScript` | `runScript(script: string, options: ExecuteCommandOptions): Promise<ExecuteCommandResult>` | Execute shell scripts |

**Interactive Sessions:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `startInteractiveSession` | `startInteractiveSession(options: ExecuteCommandOptions): Promise<string>` | Start interactive session, returns session ID |
| `sendInput` | `sendInput(sessionId: string, input: string): Promise<void>` | Send input to a session |
| `collectOutput` | `collectOutput(sessionId: string, fromPosition: number, waitOptions: OutputWaitOptions): Promise<InteractiveTerminalOutput>` | Collect output from session |
| `terminateSession` | `terminateSession(sessionId: string): Promise<void>` | Terminate a session |
| `getSessionStatus` | `getSessionStatus(sessionId: string): SessionStatus\|null` | Get status of a session |
| `getIsolationLevel` | `getIsolationLevel(): TerminalIsolationLevel` | Get active isolation level |

## Services

The package integrates with the following Token Ring services:

- **FileSystemService**: Registers `PosixFileSystemProvider` instances for filesystem operations
- **TerminalService**: Registers `PosixTerminalProvider` instances for terminal operations

### Service Registration

The plugin automatically registers providers with the appropriate services when installed:

```typescript
// FileSystemService registration
app.waitForService(FileSystemService, fileSystemService => {
  for (const name in config.filesystem!.providers) {
    const provider = config.filesystem!.providers[name];
    if (provider.type === "posix") {
      fileSystemService.registerFileSystemProvider(name, new PosixFileSystemProvider(PosixFileSystemProviderOptionsSchema.parse(provider)));
    }
  }
});

// TerminalService registration
app.waitForService(TerminalService, terminalService => {
  for (const name in config.terminal!.providers) {
    const provider = config.terminal!.providers[name];
    if (provider.type === "posix") {
      terminalService.registerTerminalProvider(name, new PosixTerminalProvider(app, terminalService, PosixTerminalProviderOptionsSchema.parse(provider)));
    }
  }
});
```

## Provider Documentation

### PosixFileSystemProvider

Implements the `FileSystemProvider` interface with the following capabilities:

- File operations (read, write, append, delete, rename, copy)
- Directory operations (create, copy)
- Pattern matching (glob)
- Text searching (grep)
- Directory traversal (getDirectoryTree via async generator)
- File system watching (watch via chokidar)

### PosixTerminalProvider

Implements the `TerminalProvider` interface with the following capabilities:

- Command execution with arguments
- Script execution via shell
- Interactive session management with PTY
- Output collection with position tracking
- Session status monitoring
- Bubblewrap sandboxing support

## RPC Endpoints

This package does not define any RPC endpoints. It provides providers that are registered with the FileSystemService and TerminalService.

## Chat Commands

This package does not define any chat commands. It provides filesystem and terminal providers that can be used by agents through the Token Ring application framework.

## Configuration

### Plugin Configuration

The package is designed to be used as a Token Ring plugin with filesystem and terminal providers.

```typescript
import TokenRingApp from "@tokenring-ai/app";
import posixSystemPlugin from "@tokenring-ai/posix-system";

const app = new TokenRingApp({
  config: {
    filesystem: {
      providers: {
        posix: {
          type: "posix"
        }
      }
    },
    terminal: {
      providers: {
        posix: {
          type: "posix",
          isolation: "auto"
        }
      }
    }
  }
});

app.use(posixSystemPlugin);
await app.start();
```

### Plugin Configuration Schema

The package uses a minimal configuration schema that wraps the filesystem and terminal schemas:

```typescript
import {z} from "zod";

const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema.optional(),
  terminal: TerminalConfigSchema.optional(),
});
```

### Provider Options Schemas

**Filesystem Provider:**

```typescript
const PosixFileSystemProviderOptionsSchema = z.object({
  // No options currently
});
```

**Terminal Provider:**

```typescript
const PosixTerminalProviderOptionsSchema = z.object({
  isolation: z.enum(['auto', 'none', 'bubblewrap']).default('auto')
});
```

**Isolation Modes:**

- `"auto"` (default) - Automatically uses bubblewrap if the `bwrap` executable is available, otherwise falls back to none
- `"bubblewrap"` - Commands run in a bubblewrap sandbox with restricted filesystem access
- `"none"` - No sandboxing, commands run directly on the host system

**Bubblewrap Sandboxing Details:**

When bubblewrap is enabled, the sandbox provides:
- Read-only access to system directories (`/usr`, `/lib`, `/lib64`, `/bin`, `/sbin`, `/etc`)
- Read-write access only to the current working directory
- Temporary `/tmp` directory (tmpfs)
- Access to `/proc` and `/dev`
- Network access (via `--share-net`)
- Process isolation with `--unshare-all`
- Automatic termination when parent process exits (`--die-with-parent`)

## Usage Examples

### As a Token Ring Plugin

The primary usage is as a plugin within a Token Ring application:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import posixSystemPlugin from "@tokenring-ai/posix-system";

const app = new TokenRingApp({
  config: {
    filesystem: {
      providers: {
        posix: {
          type: "posix"
        }
      }
    },
    terminal: {
      providers: {
        posix: {
          type: "posix",
          isolation: "auto"
        }
      }
    }
  }
});

app.use(posixSystemPlugin);
await app.start();
```

### Filesystem Provider Usage

#### Basic File Operations

```typescript
import { PosixFileSystemProvider } from "@tokenring-ai/posix-system";

const fsProvider = new PosixFileSystemProvider({});

// Write a file
await fsProvider.writeFile("test.txt", "Hello, World!");

// Read a file
const content = await fsProvider.readFile("test.txt");
if (content) {
  console.log(content.toString());  // "Hello, World!"
}

// Check if file exists
const exists = await fsProvider.exists("test.txt");
console.log(exists);  // true

// Get file statistics
const stats = await fsProvider.stat("test.txt");
console.log(stats.isFile);       // true
console.log(stats.size);         // 13
console.log(stats.modified);     // Date object

// Append to a file
await fsProvider.appendFile("test.txt", "\nAppended text");
```

#### Directory Operations

```typescript
// Create a directory
await fsProvider.createDirectory("subdir", { recursive: true });

// Copy a file
await fsProvider.copy("test.txt", "subdir/copy.txt", { overwrite: true });

// Rename a file
await fsProvider.rename("subdir/copy.txt", "subdir/renamed.txt");

// Delete a file
await fsProvider.deleteFile("subdir/renamed.txt");
```

#### File Watching

```typescript
const watcher = await fsProvider.watch(".", {
  ignoreFilter: (file) => file.includes("node_modules"),
  pollInterval: 1000,
  stabilityThreshold: 2000
});

watcher.on('change', (path) => {
  console.log(`File changed: ${path}`);
});

watcher.on('add', (path) => {
  console.log(`File added: ${path}`);
});

watcher.on('unlink', (path) => {
  console.log(`File deleted: ${path}`);
});
```

### Terminal Provider Usage

**Note:** `PosixTerminalProvider` requires `app` and `terminalService` instances. It is typically used through the plugin registration pattern rather than direct instantiation.

#### Execute Shell Commands

```typescript
import { PosixTerminalProvider } from "@tokenring-ai/posix-system";
import TokenRingApp from "@tokenring-ai/app";
import { TerminalService } from "@tokenring-ai/terminal";

const app = new TokenRingApp({});
const terminalService = app.getService(TerminalService);

const terminalProvider = new PosixTerminalProvider(app, terminalService, {
  isolation: "auto"  // Auto-detect bubblewrap
});

// Check isolation level
const isolationLevel = terminalProvider.getIsolationLevel();
console.log(`Running with isolation: ${isolationLevel}`);  // 'none' or 'sandbox'

// Execute shell commands with arguments
const result = await terminalProvider.executeCommand("ls", ["-la"], {
  timeoutSeconds: 30,
  env: { CUSTOM_VAR: "value" }
});

if (result.status === "success") {
  console.log(result.output);  // Command output
} else if (result.status === "timeout") {
  console.error("Command timed out");
} else if (result.status === "badExitCode") {
  console.error(`Command failed with exit code: ${result.exitCode}`);
  console.error("Output:", result.output);
} else if (result.status === "unknownError") {
  console.error("Unknown error:", result.error);
}
```

#### Run Shell Scripts

```typescript
const scriptResult = await terminalProvider.runScript("npm install", {
  timeoutSeconds: 60
});

if (scriptResult.status === "success") {
  console.log(scriptResult.output);
} else if (scriptResult.status === "timeout") {
  console.error("Script timed out");
} else if (scriptResult.status === "badExitCode") {
  console.error(`Script failed with exit code: ${scriptResult.exitCode}`);
  console.error("Output:", scriptResult.output);
}
```

### Interactive Terminal Sessions

Interactive sessions allow you to maintain stateful terminal sessions with a shell process.

```typescript
import { PosixTerminalProvider } from "@tokenring-ai/posix-system";
import TokenRingApp from "@tokenring-ai/app";
import { TerminalService } from "@tokenring-ai/terminal";

const app = new TokenRingApp({});
const terminalService = app.getService(TerminalService);

const terminalProvider = new PosixTerminalProvider(app, terminalService, {
  isolation: "auto"
});

// Start an interactive session
const sessionId = await terminalProvider.startInteractiveSession({
  timeoutSeconds: 0  // No timeout for interactive sessions
});

console.log(`Session started: ${sessionId}`);

// Send input to the session
await terminalProvider.sendInput(sessionId, "echo hello");

// Wait a bit for output
await new Promise(resolve => setTimeout(resolve, 200));

// Collect output
const output = await terminalProvider.collectOutput(sessionId, 0, {
  minInterval: 0.1,
  settleInterval: 0.5,
  maxInterval: 5
});

console.log(output.output);
console.log(`New position: ${output.newPosition}`);
console.log(`Is complete: ${output.isComplete}`);
if (output.exitCode !== undefined) {
  console.log(`Exit code: ${output.exitCode}`);
}

// Get session status
const status = terminalProvider.getSessionStatus(sessionId);
if (status) {
  console.log(`Running: ${status.running}`);
  console.log(`Output length: ${status.outputLength}`);
  console.log(`Start time: ${new Date(status.startTime)}`);
}

// Terminate the session
await terminalProvider.terminateSession(sessionId);
```

### Search and Listing

#### Glob Patterns

```typescript
import { PosixFileSystemProvider } from "@tokenring-ai/posix-system";

const fsProvider = new PosixFileSystemProvider({});

// Find all TypeScript files
const files = await fsProvider.glob("**/*.ts", {
  ignoreFilter: (file) => file.includes("node_modules"),
  includeDirectories: false
});

console.log(files);  // ["src/index.ts", "src/lib.ts", ...]

// Include directories in results
const items = await fsProvider.glob("**", {
  ignoreFilter: (file) => file.includes("node_modules"),
  includeDirectories: true
});

console.log(items);
// ["file1.txt", "src/", "src/index.ts", "docs/", ...]
```

#### Directory Tree

```typescript
// Get directory tree with ignore filters (async generator)
for await (const item of fsProvider.getDirectoryTree(".", {
  ignoreFilter: (file) => file.includes("node_modules"),
  recursive: true
})) {
  console.log(item);
  // src/
  // src/index.ts
  // src/lib.ts
  // docs/
  // docs/README.md
  // ...
}
```

#### Grep with Context

```typescript
// Search for text with context
const results = await fsProvider.grep("error", {
  ignoreFilter: (file) => file.includes("node_modules"),
  includeContent: {
    linesBefore: 2,
    linesAfter: 2
  }
});

console.log(results.map(r => ({
  file: r.file,
  line: r.line,
  match: r.match,
  context: r.content
})));
```

## Integration

### Plugin Integration

The package integrates with the Token Ring application framework by registering both filesystem and terminal providers:

```typescript
// In plugin.ts
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.filesystem) {
      app.waitForService(FileSystemService, fileSystemService => {
        for (const name in config.filesystem!.providers) {
          const provider = config.filesystem!.providers[name];
          if (provider.type === "posix") {
            fileSystemService.registerFileSystemProvider(
              name,
              new PosixFileSystemProvider(PosixFileSystemProviderOptionsSchema.parse(provider))
            );
          }
        }
      });
    }
    if (config.terminal) {
      app.waitForService(TerminalService, terminalService => {
        for (const name in config.terminal!.providers) {
          const provider = config.terminal!.providers[name];
          if (provider.type === "posix") {
            terminalService.registerTerminalProvider(
              name,
              new PosixTerminalProvider(app, terminalService, PosixTerminalProviderOptionsSchema.parse(provider))
            );
          }
        }
      });
    }
  },
  config: packageConfigSchema
};
```

### Agent System Integration

The package integrates with the agent system through the app framework. Filesystem and terminal operations can be used by agents through the app's service registry.

### Bubblewrap Sandboxing

When bubblewrap is enabled (isolation mode is `'bubblewrap'` or `'auto'` with `bwrap` available), the sandbox provides:

- **Read-only system directories**: `/usr`, `/lib`, `/lib64`, `/bin`, `/sbin`, `/etc`
- **Read-write working directory**: Only the specified working directory is writable
- **Temporary directory**: `/tmp` is a tmpfs (in-memory filesystem)
- **System access**: `/proc` and `/dev` are accessible
- **Network access**: Network is shared with host (`--share-net`)
- **Process isolation**: Full user namespace isolation (`--unshare-all`)
- **Automatic cleanup**: Sandbox processes die when parent exits (`--die-with-parent`)

This provides a secure execution environment that prevents commands from modifying system files or accessing sensitive areas outside the working directory.

## Best Practices

### Filesystem Provider

1. **Use ignore filters**: When performing glob or grep operations, always provide an ignore filter to respect project conventions (e.g., ignore `node_modules`, `.git`, etc.).

2. **Check existence before operations**: Use `exists()` or `stat()` to check if a file/directory exists before performing operations that might fail.

3. **Handle null returns**: `readFile()` returns `null` for non-existent files, so always check for null before using the result.

4. **Use recursive operations wisely**: When creating directories or copying, consider using the `recursive` option to handle nested structures.

5. **Memory-efficient traversal**: Use `getDirectoryTree()` async generator for large directory trees to avoid loading everything into memory.

### Terminal Provider

1. **Set appropriate timeouts**: For long-running commands, set `timeoutSeconds` to prevent hanging. Use `0` for interactive sessions.

2. **Check isolation level**: Always check the isolation level using `getIsolationLevel()` to understand the security context of command execution.

3. **Handle all status types**: Always check the `status` field in command results and handle all possible states (`success`, `timeout`, `badExitCode`, `unknownError`).

4. **Manage session lifecycle**: For interactive sessions, always terminate them when done to free up resources.

5. **Wait for output**: When collecting output from interactive sessions, allow sufficient time for output to appear before collecting.

6. **Bubblewrap availability**: The `auto` isolation mode will detect bubblewrap availability. Ensure `bwrap` is installed for sandboxed execution.

## Type Definitions

### PosixFileSystemProviderOptions

```typescript
type PosixFileSystemProviderOptions = {
  // No options currently
};
```

### PosixTerminalProviderOptions

```typescript
type PosixTerminalProviderOptions = {
  isolation: 'auto' | 'none' | 'bubblewrap';
};
```

### StatLike

```typescript
interface StatLike {
  exists: boolean;
  path: string;
  absolutePath?: string;
  isFile?: boolean;
  isDirectory?: boolean;
  isSymbolicLink?: boolean;
  size?: number;
  created?: Date;
  modified?: Date;
  accessed?: Date;
}
```

### GrepResult

```typescript
interface GrepResult {
  file: string;
  line: number;
  match: string;
  content: string | null;
}
```

### GlobOptions

```typescript
interface GlobOptions {
  ignoreFilter?: (file: string) => boolean;
  includeDirectories?: boolean;
}
```

### GrepOptions

```typescript
interface GrepOptions {
  ignoreFilter?: (file: string) => boolean;
  includeContent?: {
    linesBefore?: number;
    linesAfter?: number;
  };
  cwd?: string;
}
```

### WatchOptions

```typescript
interface WatchOptions {
  ignoreFilter?: (file: string) => boolean;
  pollInterval?: number;
  stabilityThreshold?: number;
}
```

### DirectoryTreeOptions

```typescript
interface DirectoryTreeOptions {
  ignoreFilter?: (file: string) => boolean;
  recursive?: boolean;
}
```

### SessionStatus

```typescript
interface SessionStatus {
  id: string;
  running: boolean;
  startTime: number;
  outputLength: number;
  exitCode?: number;
}
```

### InteractiveTerminalOutput

```typescript
interface InteractiveTerminalOutput {
  output: string;
  newPosition: number;
  isComplete: boolean;
  exitCode?: number;
}
```

### ExecuteCommandOptions

```typescript
interface ExecuteCommandOptions {
  timeoutSeconds?: number;
  env?: Record<string, string>;
  workingDirectory?: string;
}
```

### ExecuteCommandResult

```typescript
interface ExecuteCommandResult {
  status: "success" | "timeout" | "badExitCode" | "unknownError";
  output?: string;
  exitCode?: number;
  error?: string;
}
```

### TerminalIsolationLevel

```typescript
type TerminalIsolationLevel = "none" | "sandbox";
```

## Error Handling

The providers include comprehensive error handling:

### Filesystem Provider Errors

- **File not found**: 
  - `readFile()` returns `null`
  - `deleteFile()` throws `Error` with message `File {path} does not exist`
- **Not a file**: `deleteFile()` throws `Error` with message `Path {path} is not a file`
- **Directory exists**: `createDirectory()` throws `Error` if path exists but is not a directory
- **Destination exists**: `rename()` and `copy()` throw errors if destination already exists
- **Permission errors**: Gracefully handled where possible, may throw system-specific errors

### Terminal Provider Errors

- **Command timeout**: Returns result with `status: "timeout"`
- **Bad exit code**: Returns result with `status: "badExitCode"` and includes `exitCode` and `output`
- **Unknown errors**: Returns result with `status: "unknownError"` and includes error message
- **Session not found**: Methods operating on sessions throw `Error` if session ID is not found
- **Directory not found**: Constructor throws `Error` if working directory does not exist for interactive sessions

### Error Handling Examples

```typescript
// Filesystem error handling
try {
  await fsProvider.deleteFile("nonexistent.txt");
} catch (error) {
  console.error(error.message);  // "File nonexistent.txt does not exist"
}

// Terminal command error handling
const result = await terminalProvider.executeCommand("false", [], {
  timeoutSeconds: 5
});

if (result.status === "badExitCode") {
  console.error(`Command failed with exit code: ${result.exitCode}`);
  console.error("Output:", result.output);
}

// Session error handling
try {
  await terminalProvider.sendInput("invalid-session-id", "echo hello");
} catch (error) {
  console.error(error.message);  // "Session invalid-session-id not found"
}
```

## Testing and Development

Run the test suite:

```bash
bun run test
```

Run tests in watch mode:

```bash
bun run test:watch
```

Run tests with coverage:

```bash
bun run test:coverage
```

Build the project to check for TypeScript errors:

```bash
bun run build
```

The test suite includes integration tests covering:

- File operations (read, write, delete, rename, copy)
- Directory operations (create, copy)
- Glob pattern matching
- Text searching with grep
- File watching
- Terminal command execution
- Terminal script execution
- Interactive session management
- Error handling scenarios

### Test Files

- **PosixFileSystemProvider.integration.test.ts**: Integration tests for filesystem operations
- **PosixTerminalProvider.integration.test.ts**: Integration tests for terminal operations
- **PosixTerminalProvider.persistent.test.ts**: Tests for persistent session management

### Running Specific Tests

```bash
# Run filesystem provider tests
bun run test PosixFileSystemProvider

# Run terminal provider tests
bun run test PosixTerminalProvider
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0): Token Ring application framework
- `@tokenring-ai/chat` (0.2.0): Chat functionality
- `@tokenring-ai/terminal` (0.2.0): Abstract terminal interfaces and services
- `@tokenring-ai/agent` (0.2.0): Agent framework
- `@tokenring-ai/filesystem` (0.2.0): Abstract filesystem interfaces
- `@tokenring-ai/utility` (0.2.0): Utility functions including message formatting
- `zod` (^4.3.6): Runtime type validation
- `chokidar` (^5.0.0): File system watching
- `execa` (^9.6.1): Shell command execution
- `fs-extra` (^11.3.4): File system utilities
- `glob` (^13.0.6): Glob pattern matching
- `glob-gitignore` (^1.0.15): Gitignore-aware glob patterns
- `bun-pty` (^0.4.8): Terminal emulation and PTY management

### Development Dependencies

- `@types/fs-extra` (^11.0.4): File system type definitions
- `vitest` (^4.1.1): Testing framework
- `typescript` (^6.0.2): TypeScript compiler

## Related Components

- **@tokenring-ai/terminal**: Abstract terminal provider interfaces and services
- **@tokenring-ai/filesystem**: Abstract filesystem provider interfaces and services
- **@tokenring-ai/app**: Base application framework with plugin architecture
- **@tokenring-ai/agent**: Agent orchestration and tool integration

## License

MIT License - see LICENSE file for details.
