# posix-system

A POSIX system package for TokenRing applications, providing Terminal, Filesystem, and other POSIX-related utilities. This package implements filesystem and terminal providers that enable agents to interact with the local system in a controlled, scoped manner.

## Overview

The `posix-system` package provides two core providers for TokenRing applications:

- **PosixFileSystemProvider**: Safe filesystem operations with root-scoped access
- **PosixTerminalProvider**: Shell command execution with configurable environment, timeouts, and optional sandboxing

Both providers enforce strict security boundaries by operating only within a specified working directory, preventing agents from accessing sensitive system paths outside the designated scope.

The package integrates with the Token Ring application framework as a plugin and provides providers for both the filesystem and terminal services.

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

## Features

- **Filesystem Provider**: Full-featured filesystem operations with root-scoped access
- **Terminal Provider**: Shell command execution with configurable environment, timeouts, and sandboxing
- **Root-scoped operations**: All operations are confined to the `workingDirectory`; attempts to access paths outside are rejected
- **Ignore-aware**: Most listing/searching methods accept an ignore filter for respecting VCS/IDE ignore rules
- **Watcher-backed**: Uses chokidar for robust file system watching
- **Shell execution**: Uses execa with configurable timeouts and environment overrides
- **Sandboxing support**: Optional bubblewrap sandboxing for command execution (auto-detects availability)
- **Type-safe**: Built with TypeScript and Zod for configuration validation
- **Plugin architecture**: Designed to integrate with Token Ring applications as a plugin
- **Interactive sessions**: Support for persistent interactive terminal sessions
- **Comprehensive error handling**: Detailed error messages for security violations and operation failures

## Core Components

### PosixFileSystemProvider

A concrete implementation of the `FileSystemProvider` abstraction that provides safe, root-scoped access to the local filesystem for Token Ring apps and agents.

**Constructor Options:**

```typescript
interface LocalFileSystemProviderOptions {
  workingDirectory: string;  // The root directory for all file operations
  defaultSelectedFiles?: string[];  // Default file patterns for selection
}
```

**Properties:**

- `name: string` - Provider name ("LocalFilesystemProvider")
- `description: string` - Provider description ("Provides access to the local filesystem")

**Path Utilities:**

- `relativeOrAbsolutePathToAbsolutePath(p: string): string` - Converts any path to absolute path within bounds. Throws error if path is outside workingDirectory
- `relativeOrAbsolutePathToRelativePath(p: string): string` - Converts absolute path to relative path relative to workingDirectory

**File Operations:**

- `writeFile(filePath: string, content: string | Buffer): Promise<boolean>` - Create or overwrite a file
- `appendFile(filePath: string, content: string | Buffer): Promise<boolean>` - Append content to a file
- `readFile(filePath: string): Promise<Buffer|null>` - Read file content. Returns null if file doesn't exist
- `deleteFile(filePath: string): Promise<boolean>` - Delete a file. Throws error if file doesn't exist
- `rename(oldPath: string, newPath: string): Promise<boolean>` - Rename/move a file. Throws error if source doesn't exist or destination exists
- `exists(filePath: string): Promise<boolean>` - Check if file exists
- `stat(filePath: string): Promise<StatLike>` - Get file/directory statistics

**Directory Operations:**

- `createDirectory(dirPath: string, options?: { recursive?: boolean }): Promise<boolean>` - Create directory
- `copy(source: string, destination: string, options?: { overwrite?: boolean }): Promise<boolean>` - Copy files/directories

**Search and Listing:**

- `glob(pattern: string, options?: GlobOptions): Promise<string[]>` - Find files matching glob patterns
- `grep(searchString: string, options?: GrepOptions): Promise<GrepResult[]>` - Search for text in files with context
- `getDirectoryTree(dir: string, options?: DirectoryTreeOptions): AsyncGenerator<string>` - Traverse directory tree

**File Watching:**

- `watch(dir: string, options?: WatchOptions): Promise<FSWatcher>` - Watch directory for changes

### PosixTerminalProvider

A concrete implementation of the `TerminalProvider` abstraction that provides shell command execution capabilities with support for persistent sessions and optional sandboxing.

**Constructor Options:**

```typescript
interface LocalTerminalProviderOptions {
  workingDirectory: string;  // The root directory for command execution
  isolation?: 'none' | 'bubblewrap' | 'auto';  // Sandboxing mode (default: 'auto')
}
```

**Isolation Modes:**

- `"none"` - No sandboxing, commands run directly on the host system
- `"bubblewrap"` - Commands run in a bubblewrap sandbox with restricted filesystem access
- `"auto"` (default) - Automatically uses bubblewrap if the `bwrap` executable is available, otherwise falls back to none

**Properties:**

- `name: string` - Provider name ("PosixTerminalProvider")
- `description: string` - Provider description ("Provides shell command execution on local system")

**Methods:**

- `executeCommand(command: string, args: string[], options: ExecuteCommandOptions): Promise<ExecuteCommandResult>` - Execute shell commands with arguments
- `runScript(script: string, options: ExecuteCommandOptions): Promise<ExecuteCommandResult>` - Execute shell scripts
- `startInteractiveSession(options: ExecuteCommandOptions): Promise<string>` - Start an interactive terminal session, returns session ID
- `sendInput(sessionId: string, input: string): Promise<void>` - Send input to a session
- `collectOutput(sessionId: string, fromPosition: number, waitOptions: OutputWaitOptions): Promise<InteractiveTerminalOutput>` - Collect output from a session
- `terminateSession(sessionId: string): Promise<void>` - Terminate a session
- `getSessionStatus(sessionId: string): SessionStatus | null` - Get status of a session
- `getIsolationLevel(): TerminalIsolationLevel` - Get the active isolation level ('none' or 'sandbox')

**ExecuteCommandOptions:**

```typescript
interface ExecuteCommandOptions {
  timeoutSeconds?: number;
  env?: Record<string, string>;
  workingDirectory?: string;
  input?: string;
}
```

**ExecuteCommandResult:**

```typescript
interface ExecuteCommandResult {
  status: "success" | "timeout" | "badExitCode" | "unknownError";
  output?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}
```

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
          type: "posix",
          workingDirectory: "/path/to/your/project",
          defaultSelectedFiles: ["**/*.ts", "**/*.js"]
        }
      }
    },
    terminal: {
      providers: {
        posix: {
          type: "posix",
          workingDirectory: "/path/to/your/project",
          isolation: "auto"  // Optional: 'none', 'bubblewrap', or 'auto' (default)
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

### Configuration Options

#### Filesystem Provider Configuration

```typescript
filesystem?: {
  providers: {
    [providerName: string]: {
      type: "posix";
      workingDirectory: string;
      defaultSelectedFiles?: string[];
    };
  };
};
```

#### Terminal Provider Configuration

```typescript
terminal?: {
  providers: {
    [providerName: string]: {
      type: "posix";
      workingDirectory: string;
      isolation?: "none" | "bubblewrap" | "auto";
    };
  };
};
```

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
          type: "posix",
          workingDirectory: process.cwd(),
          defaultSelectedFiles: ["**/*.ts", "**/*.js"]
        }
      }
    },
    terminal: {
      providers: {
        posix: {
          type: "posix",
          workingDirectory: process.cwd(),
          isolation: "auto"  // Auto-detect bubblewrap
        }
      }
    }
  }
});

app.use(posixSystemPlugin);
await app.start();
```

### Filesystem Operations

#### Basic File Operations

```typescript
import PosixFileSystemProvider from "@tokenring-ai/posix-system/PosixFileSystemProvider";

const fsProvider = new PosixFileSystemProvider({
  workingDirectory: process.cwd(),
  defaultSelectedFiles: ["**/*.ts", "**/*.js"]
});

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
console.log(stats.size);      // 13
console.log(stats.modified);  // Date object
console.log(stats.isFile);    // true
```

#### Directory Operations

```typescript
// Create a directory
await fsProvider.createDirectory("subdir", { recursive: true });

// Copy a file
await fsProvider.copy("test.txt", "subdir/copy.txt", { overwrite: true });

// Delete a file
await fsProvider.deleteFile("subdir/copy.txt");
```

#### Path Resolution

```typescript
// Relative paths are resolved relative to workingDirectory
const absPath = fsProvider.relativeOrAbsolutePathToAbsolutePath("file.txt");
console.log(absPath);  // "/absolute/path/to/workingDirectory/file.txt"

// Absolute paths are validated to ensure they're within workingDirectory
const relPath = fsProvider.relativeOrAbsolutePathToRelativePath(absPath);
console.log(relPath);  // "file.txt"

// Attempting to access paths outside workingDirectory throws an error
try {
  fsProvider.relativeOrAbsolutePathToAbsolutePath("/etc/passwd");
} catch (error) {
  console.error(error.message);  // "Path /etc/passwd is outside the root directory"
}
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

### Terminal Operations

#### Execute Shell Commands

```typescript
import PosixTerminalProvider from "@tokenring-ai/posix-system/PosixTerminalProvider";

const terminalProvider = new PosixTerminalProvider(app, {
  workingDirectory: process.cwd(),
  isolation: "auto"  // Auto-detect bubblewrap
});

// Check isolation level
const isolationLevel = terminalProvider.getIsolationLevel();
console.log(`Running with isolation: ${isolationLevel}`);  // 'none' or 'sandbox'

// Execute shell commands with arguments
const result = await terminalProvider.executeCommand("ls", ["-la"], {
  workingDirectory: ".",
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
  workingDirectory: ".",
  timeoutSeconds: 60
});

if (scriptResult.status === "success") {
  console.log(scriptResult.output);
} else if (scriptResult.status === "timeout") {
  console.error("Script timed out");
} else if (scriptResult.status === "badExitCode") {
  console.error(`Script failed with exit code: ${scriptResult.exitCode}`);
}
```

### Interactive Terminal Sessions

Interactive sessions allow you to maintain stateful terminal sessions with a shell process.

```typescript
// Start an interactive session
const sessionId = await terminalProvider.startInteractiveSession({
  workingDirectory: ".",
  timeoutSeconds: 0,  // No timeout for interactive sessions
});

console.log(`Session started: ${sessionId}`);

// Send input to the session
await terminalProvider.sendInput(sessionId, "echo hello\n");

// Wait a bit for output
await new Promise(resolve => setTimeout(resolve, 100));

// Collect output
const output = await terminalProvider.collectOutput(sessionId, 0, {
  minInterval: 0.1,
  settleInterval: 0.5,
  maxInterval: 5,
});

console.log(output.output);
console.log(`Position: ${output.newPosition}`);
console.log(`Complete: ${output.isComplete}`);
console.log(`Exit code: ${output.exitCode}`);

// Get session status
const status = terminalProvider.getSessionStatus(sessionId);
if (status) {
  console.log(`Running: ${status.running}`);
  console.log(`Output length: ${status.outputLength}`);
}

// Terminate the session
await terminalProvider.terminateSession(sessionId);
```

### Search and Listing

#### Glob Patterns

```typescript
// Find all TypeScript files
const files = await fsProvider.glob("**/*.ts", {
  ignoreFilter: (file) => file.includes("node_modules"),
  includeDirectories: false
});

console.log(files);  // ["src/index.ts", "src/lib.ts", ...]
```

#### Directory Tree

```typescript
// Get directory tree with ignore filters
for await (const item of fsProvider.getDirectoryTree("", {
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

### Dependencies

- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/filesystem`: Abstract filesystem interfaces and utilities
- `@tokenring-ai/terminal`: Abstract terminal interfaces and utilities
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/utility`: Utility functions

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
              new PosixFileSystemProvider(LocalFileSystemProviderOptionsSchema.parse(provider))
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
              new PosixTerminalProvider(app, LocalTerminalProviderOptionsSchema.parse(provider))
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

## Best Practices

### Security

1. **Always specify workingDirectory**: Never use `process.cwd()` as the root directory in production. Use a specific project directory instead.
2. **Use ignore filters**: Always include ignore filters to exclude node_modules, build artifacts, and temporary files.
3. **Validate paths**: Always validate user input before passing to provider methods.
4. **Set timeouts**: Always set timeout limits for terminal operations to prevent hanging.
5. **Use sandboxing**: Consider using bubblewrap sandboxing for untrusted commands.

### Performance

1. **Use glob patterns**: Prefer glob patterns over individual file operations for batch processing.
2. **Batch operations**: Combine multiple file operations where possible.
3. **Watch selectively**: Use specific directories for watching rather than the entire filesystem.

### Error Handling

1. **Check result.status**: Always check `result.status` for terminal operations and handle each status type appropriately.
2. **Handle null reads**: Always check if `readFile` returns `null` before processing file content.
3. **Log errors**: Log both stdout and stderr for failed operations.
4. **Security violations**: Handle path violation errors gracefully and provide helpful error messages.

## Type Definitions

### LocalFileSystemProviderOptions

```typescript
interface LocalFileSystemProviderOptions {
  workingDirectory: string;
  defaultSelectedFiles?: string[];
}
```

### LocalTerminalProviderOptions

```typescript
interface LocalTerminalProviderOptions {
  workingDirectory: string;
  isolation?: "none" | "bubblewrap" | "auto";
}
```

### StatLike

```typescript
interface StatLike {
  exists: boolean;
  path: string;
  absolutePath: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
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

## Error Handling

The providers include comprehensive error handling:

- **Security**: Paths outside the working directory throw errors with descriptive messages
- **Existence checks**: Operations on non-existent paths throw appropriate errors
- **Type safety**: Operations on directories when files are expected (and vice versa) throw errors
- **Command execution**: Failed commands return detailed error information without throwing
- **Session management**: Sessions are properly tracked and cleaned up on termination
- **Permission errors**: Graceful handling of permission errors where possible

## Testing

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
- Path validation and security checks
- Error handling scenarios

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/filesystem`: Abstract filesystem interfaces
- `@tokenring-ai/terminal`: Abstract terminal interfaces
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/utility`: Utility functions
- `zod`: Runtime type validation
- `chokidar`: File system watching
- `execa`: Shell command execution
- `fs-extra`: File system utilities
- `glob`: Glob pattern matching
- `bun-pty`: Terminal emulation

### Development Dependencies

- `@types/fs-extra`: File system type definitions
- `vitest`: Testing framework
- `typescript`: TypeScript compiler

## License

MIT License - see [LICENSE](./LICENSE) file for details.
