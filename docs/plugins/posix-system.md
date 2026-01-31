# posix-system

A POSIX system package for TokenRing applications, providing Terminal, Filesystem, and other POSIX-related utilities. This package implements filesystem and terminal providers that enable agents to interact with the local system in a controlled, scoped manner.

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

## Overview

The `posix-system` package provides two core providers for TokenRing applications:

- **PosixFileSystemProvider**: Safe filesystem operations with root-scoped access
- **PosixTerminalProvider**: Shell command execution with configurable environment and timeouts

Both providers enforce strict security boundaries by operating only within a specified working directory, preventing agents from accessing sensitive system paths outside the designated scope.

## Core Properties

### PosixFileSystemProvider

```typescript
class PosixFileSystemProvider implements FileSystemProvider
```

**Properties:**
- `name: string` - Provider name ("LocalFilesystemProvider")
- `description: string` - Provider description ("Provides access to the local filesystem")

**Constructor Options:**
```typescript
interface LocalFileSystemProviderOptions {
  workingDirectory: string;  // The root directory for all file operations
  defaultSelectedFiles?: string[];  // Default file patterns for selection
}
```

### PosixTerminalProvider

```typescript
class PosixTerminalProvider implements TerminalProvider
```

**Properties:**
- `name: string` - Provider name ("LocalTerminalProvider")
- `description: string` - Provider description ("Provides shell command execution on local system")

**Constructor Options:**
```typescript
interface LocalTerminalProviderOptions {
  workingDirectory: string;  // The root directory for command execution
}
```

## Key Features

- **Root-scoped operations**: All operations are confined to the `workingDirectory`; attempts to access paths outside are rejected
- **Ignore-aware**: Most listing/searching methods accept an ignore filter for respecting VCS/IDE ignore rules
- **Watcher-backed**: Uses chokidar for robust file system watching
- **Shell execution**: Uses execa with configurable timeouts and environment overrides
- **Type-safe**: Built with TypeScript and Zod for configuration validation
- **Plugin architecture**: Designed to integrate with Token Ring applications as a plugin
- **Comprehensive error handling**: Detailed error messages for security violations and operation failures

## Core Methods and Usage

### Filesystem Operations

#### write(filePath, content)

Create or overwrite a file.

```typescript
await fsProvider.writeFile("test.txt", "Hello, World!");
```

#### readFile(filePath)

Read file content.

```typescript
const content = await fsProvider.readFile("test.txt");
// Returns Buffer or null if file doesn't exist
```

#### exists(filePath)

Check if file exists.

```typescript
const exists = await fsProvider.exists("test.txt");
```

#### stat(filePath)

Get file/directory statistics.

```typescript
const stats = await fsProvider.stat("test.txt");
console.log(stats.size);     // File size in bytes
console.log(stats.modified); // Last modification date
console.log(stats.isFile);   // Boolean indicating if it's a file
```

#### glob(pattern, options)

Find files matching glob patterns.

```typescript
const files = await fsProvider.glob("**/*.ts", {
  ignoreFilter: (file) => file.includes("node_modules"),
  includeDirectories: false
});
```

#### grep(searchString, options)

Search for text in files with context.

```typescript
const results = await fsProvider.grep("error", {
  ignoreFilter: (file) => file.includes("node_modules"),
  includeContent: {
    linesBefore: 2,
    linesAfter: 2
  }
});
```

Returns array of `GrepResult` objects:
```typescript
interface GrepResult {
  file: string;
  line: number;
  match: string;
  content: string | null;
}
```

#### watch(dir, options)

Watch directory for changes.

```typescript
const watcher = await fsProvider.watch(".", {
  ignoreFilter: (file) => file.includes("node_modules"),
  pollInterval: 1000,
  stabilityThreshold: 2000
});

watcher.on('change', (path) => {
  console.log(`File changed: ${path}`);
});
```

### Terminal Operations

#### executeCommand(command, args, options)

Execute shell commands with arguments.

```typescript
const result = await terminalProvider.executeCommand("ls", ["-la"], {
  workingDirectory: ".",
  timeoutSeconds: 30,
  env: { CUSTOM_VAR: "value" },
  input: "echo test"
});

if (result.ok) {
  console.log(result.output);
  console.log(result.stdout);
} else {
  console.error(result.error);
  console.error(result.stderr);
}
```

**ExecuteCommandResult:**
```typescript
interface ExecuteCommandResult {
  ok: boolean;
  output: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
}
```

#### runScript(script, options)

Execute shell scripts.

```typescript
const scriptResult = await terminalProvider.runScript("npm install", {
  workingDirectory: ".",
  timeoutSeconds: 60
});
```

### Path Resolution

#### relativeOrAbsolutePathToAbsolutePath(p)

Convert any path to absolute path within bounds.

```typescript
// Relative path
const absPath = fsProvider.relativeOrAbsolutePathToAbsolutePath("file.txt");

// Absolute path
const absPath = fsProvider.relativeOrAbsolutePathToAbsolutePath("/absolute/path");
```

#### relativeOrAbsolutePathToRelativePath(p)

Convert absolute path to relative path.

```typescript
const relPath = fsProvider.relativeOrAbsolutePathToRelativePath(absPath);
```

**Security:** Paths outside the working directory throw an error.

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
          workingDirectory: "/path/to/your/project"
        }
      }
    }
  }
});

app.use(posixSystemPlugin);
await app.start();
```

### Configuration Schema

```typescript
const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema.optional(),
  terminal: TerminalConfigSchema.optional(),
});
```

## Integration

### Dependencies

- **@tokenring-ai/app**: Token Ring application framework
- **@tokenring-ai/filesystem**: Abstract filesystem interfaces and utilities
- **@tokenring-ai/terminal**: Abstract terminal interfaces and utilities
- **@tokenring-ai/agent**: Agent framework
- **@tokenring-ai/chat**: Chat functionality (if needed)

### Usage in Applications

The package is used in:
- **app/coder**: Developer assistant with full system access
- **app/writer**: Content creation with scoped filesystem access

## Best Practices

### Security

1. **Always specify workingDirectory**: Never use `process.cwd()` as the root directory in production
2. **Use ignore filters**: Always include ignore filters to exclude node_modules, build artifacts, and temporary files
3. **Validate paths**: Always validate user input before passing to provider methods
4. **Set timeouts**: Always set timeout limits for terminal operations to prevent hanging

### Performance

1. **Use glob patterns**: Prefer glob patterns over individual file operations for batch processing
2. **Batch operations**: Combine multiple file operations where possible
3. **Watch selectively**: Use specific directories for watching rather than the entire filesystem

### Error Handling

1. **Check result.ok**: Always check `result.ok` for terminal operations
2. **Handle null reads**: Always check if `readFile` returns `null`
3. **Log errors**: Log both stdout and stderr for failed operations
4. **Security violations**: Handle path violation errors gracefully

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

## Error Handling

The providers include comprehensive error handling:

- **Security**: Paths outside the working directory throw errors
- **Existence checks**: Operations on non-existent paths throw appropriate errors
- **Type safety**: Operations on directories when files are expected (and vice versa) throw errors
- **Command execution**: Failed commands return detailed error information without throwing
- **File permissions**: Graceful handling of permission errors where possible

## License

MIT License - see the root LICENSE file for details.
