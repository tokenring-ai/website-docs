# Local Filesystem Plugin

A concrete implementation of the FileSystemProvider abstraction that provides safe, root-scoped access to your local filesystem for Token Ring apps and agents.

## Overview

The `@tokenring-ai/local-filesystem` package provides a concrete implementation of the FileSystemProvider interface that enables safe file operations on your local disk. All operations are confined to a configured base directory with comprehensive security boundaries, error handling, and advanced features like file watching and text searching.

## Package Structure

```
pkg/local-filesystem/
├── plugin.ts                 # Plugin registration and configuration
├── LocalFileSystemProvider.ts # Core filesystem provider implementation
├── index.ts                  # Package exports
├── package.json              # Package metadata and dependencies
├── vitest.config.ts          # Test configuration
└── README.md                 # Package README
```

## Key Features

- **Root-Scoped**: All operations confined to `baseDirectory`; attempts to access paths outside are rejected
- **Ignore-Aware**: Most listing/searching methods accept an ignore filter for respecting VCS/IDE ignore rules
- **Watcher-Backed**: Uses chokidar for robust file system watching
- **Shell Execution**: Uses execa with configurable timeouts and environment overrides
- **Type-Safe**: Built with TypeScript and Zod for configuration validation
- **Plugin Architecture**: Designed to integrate with Token Ring applications as a plugin

## Core Components

### LocalFileSystemProvider

Main filesystem provider class implementing the FileSystemProvider interface.

**Constructor:**

```typescript
import LocalFileSystemProvider from '@tokenring-ai/local-filesystem';

const provider = new LocalFileSystemProvider({
  baseDirectory: string,          // Root directory for operations (required)
  defaultSelectedFiles?: string[]  // Default file patterns (optional)
});
```

### Properties

- `name: string` - Provider name ("LocalFilesystemProvider")
- `description: string` - Provider description ("Provides access to the local filesystem")

### Path Utilities

#### relativeOrAbsolutePathToAbsolutePath

Converts any path (relative or absolute) to absolute path within root bounds.

```typescript
import LocalFileSystemProvider from '@tokenring-ai/local-filesystem';

const provider = new LocalFileSystemProvider({
  baseDirectory: '/path/to/project'
});

// Relative path
const abs = provider.relativeOrAbsolutePathToAbsolutePath('file.txt');
console.log(abs); // "/path/to/project/file.txt"

// Absolute path within root
const abs2 = provider.relativeOrAbsolutePathToAbsolutePath('/path/to/project/sub/file.txt');
console.log(abs2); // "/path/to/project/sub/file.txt"

// Path outside root
try {
  provider.relativeOrAbsolutePathToAbsolutePath('/etc/passwd');
} catch (error) {
  console.error(error.message); // "Path /etc/passwd is outside the root directory"
}
```

#### relativeOrAbsolutePathToRelativePath

Converts absolute path to relative path from root.

```typescript
const rel = provider.relativeOrAbsolutePathToRelativePath('/path/to/project/file.txt');
console.log(rel); // "file.txt"
```

### File Operations

#### writeFile

Writes content to a file (overwrites if exists).

```typescript
await provider.writeFile('notes/todo.txt', '- [ ] Complete documentation');
```

#### appendFile

Appends content to a file.

```typescript
await provider.appendFile('notes/todo.txt', '\n- [ ] Fix bug');
```

#### readFile

Reads file content.

```typescript
const content = await provider.readFile('notes/todo.txt');
// Returns Buffer
console.log(content.toString()); // "- [ ] Complete documentation"
```

#### deleteFile

Deletes a file.

```typescript
await provider.deleteFile('notes/backup.txt');
```

#### rename

Renames or moves a file.

```typescript
await provider.rename('notes/old.txt', 'notes/new.txt');
```

#### exists

Checks if a file or directory exists.

```typescript
const exists = await provider.exists('notes/todo.txt');
console.log(exists); // true
```

#### stat

Gets file/directory statistics.

```typescript
const info = await provider.stat('notes/todo.txt');
console.log(info);
/*
{
  path: 'notes/todo.txt',
  absolutePath: '/path/to/notes/todo.txt',
  isFile: true,
  isDirectory: false,
  isSymbolicLink: false,
  size: 28,
  created: Date,
  modified: Date,
  accessed: Date
}
*/
```

#### chmod

Changes file permissions.

```typescript
await provider.chmod('notes/script.sh', 0o755);
```

#### copy

Copies a file or directory.

```typescript
await provider.copy('notes/file.txt', 'backup/file.txt');
await provider.copy('src', 'backup/src', { overwrite: true });
```

### Directory Operations

#### createDirectory

Creates a directory (optionally recursively).

```typescript
// Create single directory
await provider.createDirectory('new-folder');

// Create nested directories
await provider.createDirectory('src/components/ui', { recursive: true });
```

#### glob

Finds files matching glob patterns.

```typescript
// List TypeScript files
const tsFiles = await provider.glob('**/*.ts');

// List all files excluding node_modules
const allFiles = await provider.glob('**/*', {
  ignoreFilter: (file) => file.includes('node_modules'),
  includeDirectories: false
});

// Show files and directories
const items = await provider.glob('**/*', {
  ignoreFilter: (file) => file.includes('node_modules'),
  includeDirectories: true
});
```

#### grep

Searches for text content across files.

```typescript
const results = await provider.grep('TODO', {
  includeContent: {
    linesBefore: 2,
    linesAfter: 2
  }
});

console.log(results);
/*
[
  {
    file: 'notes/TODO.md',
    line: 1,
    match: '- [ ] Complete documentation',
    content: 'Project Notes\n- [ ] Complete documentation\n\nDone'
  }
]
*/
```

#### getDirectoryTree

Traverses directory tree asynchronously.

```typescript
for await (const path of provider.getDirectoryTree('src', { recursive: true })) {
  console.log(path);
}
```

### File Watching

#### watch

Watches directory for changes.

```typescript
import chokidar, { FSWatcher } from 'chokidar';

const watcher: FSWatcher = await provider.watch('.', {
  ignoreFilter: (file) => file.includes('node_modules') || file.includes('.git'),
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
  console.log(`File removed: ${path}`);
});
```

### Shell Command Execution

#### executeCommand

Executes shell commands with timeout and environment control.

```typescript
const result = await provider.executeCommand('ls -la', {
  workingDirectory: 'src',
  timeoutSeconds: 30
});

if (result.ok) {
  console.log('Command succeeded:', result.stdout);
} else {
  console.error('Command failed:', result.stderr);
}

// Command with timeout and custom environment
const result2 = await provider.executeCommand('npm list --depth=0', {
  workingDirectory: '.',
  timeoutSeconds: 60,
  env: { NODE_ENV: 'production' }
});
```

## Plugin Integration

### Token Ring Application Plugin

Register the plugin in your Token Ring application configuration:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import localFilesystemPlugin from '@tokenring-ai/local-filesystem';

const app = new TokenRingApp({
  config: {
    filesystem: {
      providers: {
        local: {
          type: 'local',
          baseDirectory: process.cwd(),
          defaultSelectedFiles: ['**/*.ts', '**/*.js', '**/*.md']
        }
      }
    }
  }
});

app.use(localFilesystemPlugin);
await app.start();
```

### Configuration Schema

```typescript
import { z } from 'zod';

const packageConfigSchema = z.object({
  filesystem: z.object({
    providers: z.record(
      z.object({
        type: z.literal('local'),
        baseDirectory: z.string(),
        defaultSelectedFiles: z.array(z.string()).optional()
      })
    ).optional()
  }).optional()
});

type AppConfig = z.infer<typeof packageConfigSchema>;
```

## Configuration Options

### Provider Options

```typescript
interface LocalFileSystemProviderOptions {
  baseDirectory: string;           // Required: Base directory for all operations
  defaultSelectedFiles?: string[]; // Optional: Default file patterns
}
```

### Glob Options

```typescript
interface GlobOptions {
  ignoreFilter?: (file: string) => boolean;  // Filter ignored files
  includeDirectories?: boolean;               // Include directories in results
}
```

### Grep Options

```typescript
interface GrepOptions {
  ignoreFilter?: (file: string) => boolean;  // Filter ignored files
  includeContent?: {
    linesBefore?: number;  // Lines before match (default: 0)
    linesAfter?: number;   // Lines after match (default: 0)
  };
}
```

### Watch Options

```typescript
interface WatchOptions {
  ignoreFilter?: (file: string) => boolean;  // Filter ignored files
  pollInterval?: number;                     // Polling interval in ms (default: 1000)
  stabilityThreshold?: number;               // Stability threshold in ms (default: 2000)
}
```

### Execute Command Options

```typescript
interface ExecuteCommandOptions {
  timeoutSeconds?: number;             // Timeout in seconds (default: no timeout)
  env?: Record<string, string>;        // Environment variables
  workingDirectory?: string;           // Working directory for command
}
```

### Directory Tree Options

```typescript
interface DirectoryTreeOptions {
  ignoreFilter?: (file: string) => boolean;  // Filter ignored files
  recursive?: boolean;                       // Traverse recursively (default: true)
}
```

## Type Definitions

### StatLike

```typescript
interface StatLike {
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

### ExecuteCommandResult

```typescript
interface ExecuteCommandResult {
  ok: boolean;            // Whether command succeeded
  exitCode: number;       // Exit code (0 = success)
  stdout: string;         // Standard output
  stderr: string;         // Standard error
  error?: string;         // Error message if failed
}
```

### GrepResult

```typescript
interface GrepResult {
  file: string;  // File path relative to root
  line: number;  // Line number (1-indexed)
  match: string; // The matching line content
  content: string | null;  // Context content if requested
}
```

## Error Handling

The provider includes comprehensive error handling:

### Security Errors

```typescript
try {
  await provider.relativeOrAbsolutePathToAbsolutePath('/etc/passwd');
} catch (error) {
  console.error(error.message);
  // Path /etc/passwd is outside the root directory
}
```

### Existence Errors

```typescript
try {
  await provider.readFile('missing.txt');
} catch (error) {
  console.error(error.message);
  // File missing.txt does not exist
}
```

### Type Errors

```typescript
try {
  await provider.deleteFile('src');  // src is a directory
} catch (error) {
  console.error(error.message);
  // Path src is not a file
}
```

### Command Execution Errors

```typescript
const result = await provider.executeCommand('nonexistent-command');

if (!result.ok) {
  console.error('Exit code:', result.exitCode);
  console.error('Error:', result.error);
  console.error('Stderr:', result.stderr);
}
```

## Dependencies

- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/chat`: Chat functionality
- `@tokenring-ai/filesystem`: Abstract filesystem interfaces
- `@tokenring-ai/agent`: Agent framework
- `chokidar`: File system watching
- `execa`: Shell command execution
- `fs-extra`: File system utilities
- `glob`: Glob pattern matching
- `glob-gitignore`: Git ignore pattern support
- `zod`: Runtime type validation

## Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Type checking
bun run build
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.