# Local Filesystem Plugin

A concrete implementation of the FileSystemProvider abstraction that provides safe, root-scoped access to your local filesystem for Token Ring apps and agents.

## Overview

The `@tokenring-ai/local-filesystem` package provides a concrete implementation of the FileSystemProvider interface that enables safe file operations on your local disk. All operations are confined to a configured base directory with comprehensive security boundaries, error handling, and advanced features like file watching and text searching.

## Package Structure

```
pkg/local-filesystem/
├── plugin.ts                 # Plugin registration and integration
├── LocalFileSystemProvider.ts # Core filesystem provider implementation
├── index.ts                  # Package exports
├── package.json              # Package metadata and dependencies
├── vitest.config.ts          # Vitest test configuration
└── README.md                 # Package documentation
```

## Key Features

- **Root-Scoped**: All operations confined to `baseDirectory`; attempts to access paths outside are rejected
- **Path Utilities**: Convert between relative and absolute paths with security validation
- **File Operations**: Read, write, append, delete, rename, copy, stat, and chmod operations
- **Directory Operations**: Create directories, glob pattern matching, text search (grep), and tree traversal
- **File Watching**: Uses chokidar for robust file change monitoring
- **Shell Execution**: Uses execa with configurable timeouts and environment overrides
- **Type-Safe**: Built with TypeScript and Zod for configuration validation
- **Plugin Architecture**: Designed to integrate with Token Ring applications as a plugin

## Core Components

### LocalFileSystemProvider

Main filesystem provider class implementing the FileSystemProvider interface.

**Constructor:**

```typescript
const provider = new LocalFileSystemProvider({
  baseDirectory: string,          // Root directory for all operations (required)
  defaultSelectedFiles?: string[] // Default file patterns to select (optional)
});
```

**Path Utilities:**

```typescript
// Convert any path (relative or absolute) to absolute path within root bounds
relativeOrAbsolutePathToAbsolutePath(p: string): string;

// Convert absolute path to relative path from root
relativeOrAbsolutePathToRelativePath(p: string): string;
```

**File Operations:**

```typescript
// Write/overwrite file content
writeFile(filePath: string, content: string | Buffer): Promise<boolean>;

// Append content to file
appendFile(filePath: string, content: string | Buffer): Promise<boolean>;

// Read file with optional encoding
readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;

// Delete a file
deleteFile(filePath: string): Promise<boolean>;

// Rename/move file
rename(oldPath: string, newPath: string): Promise<boolean>;

// Check if file exists
exists(filePath: string): Promise<boolean>;

// Get file/directory statistics
stat(filePath: string): Promise<StatLike>;

// Change file permissions
chmod(filePath: string, mode: number): Promise<boolean>;

// Copy file or directory with optional overwrite
copy(source: string, destination: string, options?: { overwrite?: boolean }): Promise<boolean>;
```

**Directory Operations:**

```typescript
// Create directory with optional recursive creation
createDirectory(dirPath: string, options?: { recursive?: boolean }): Promise<boolean>;

// Find files matching glob patterns
glob(pattern: string, options?: GlobOptions): Promise<string[]>;

// Search for text content across files
grep(searchString: string, options?: GrepOptions): Promise<GrepResult[]>;

// Traverse directory tree
getDirectoryTree(dir: string, options?: DirectoryTreeOptions): AsyncGenerator<string>;
```

**File Watching:**

```typescript
// Watch directory for changes
watch(dir: string, options?: WatchOptions): Promise<FSWatcher>;
```

**Command Execution:**

```typescript
// Execute shell commands with timeout and environment control
executeCommand(command: string | string[], options?: ExecuteCommandOptions): Promise<ExecuteCommandResult>;
```

## Usage Examples

### Basic File Operations

```typescript
import LocalFileSystemProvider from '@tokenring-ai/local-filesystem';

// Create provider with root directory
const provider = new LocalFileSystemProvider({
  baseDirectory: process.cwd(),
  defaultSelectedFiles: ['**/*.ts', '**/*.js']
});

// Write file
await provider.writeFile('notes/todo.txt', '- [ ] Complete documentation');

// Read file
const content = await provider.readFile('notes/todo.txt', 'utf8');
console.log(content); // "- [ ] Complete documentation"

// Check if file exists
const exists = await provider.exists('notes/todo.txt');
console.log(exists); // true

// Get file stats
const info = await provider.stat('notes/todo.txt');
console.log(info);
/*
{
  path: 'notes/todo.txt',
  absolutePath: '/path/to/project/notes/todo.txt',
  isFile: true,
  isDirectory: false,
  isSymbolicLink: false,
  size: 28,
  created: Date,
  modified: Date,
  accessed: Date
}
*/

// Rename file
await provider.rename('notes/todo.txt', 'notes/TODO.md');

// Copy file
await provider.copy('notes/TODO.md', 'notes/backup/TODO.md');

// Change file permissions
await provider.chmod('notes/script.sh', 0o755);

// Delete file
await provider.delete('notes/TODO.md');
```

### Directory Operations

```typescript
// Create directory
await provider.createDirectory('new-folder', { recursive: true });

// Create nested directory structure
await provider.createDirectory('src/components/ui', { recursive: true });

// Copy entire directory
await provider.copy('src', 'backup/src', { overwrite: true });
```

### Pattern Matching and Search

```typescript
// List TypeScript files
const tsFiles = await provider.glob('**/*.ts');

// List all files excluding node_modules
const allFiles = await provider.glob('**/*', {
  ignoreFilter: (file) => file.includes('node_modules'),
  includeDirectories: false
});

// Search for TODO comments
const results = await provider.grep('TODO', {
  includeContent: { linesBefore: 2, linesAfter: 2 }
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

// Traverse directory tree
for await (const path of provider.getDirectoryTree('src', { recursive: true })) {
  console.log(path);
}
```

### File Watching

```typescript
const watcher = await provider.watch('.', {
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

```typescript
// Run a simple command
const result = await provider.executeCommand('ls -la', {
  workingDirectory: 'src',
  timeoutSeconds: 30
});

if (result.ok) {
  console.log('Command succeeded:', result.stdout);
} else {
  console.error('Command failed:', result.stderr);
}

// Run a command with arguments
const cmdResult = await provider.executeCommand(['npm', ['list', '--depth=0']], {
  workingDirectory: '.',
  timeoutSeconds: 60,
  env: { NODE_ENV: 'production' }
});
```

### Path Resolution

```typescript
// Relative paths are resolved relative to baseDirectory
const absPath = provider.relativeOrAbsolutePathToAbsolutePath('file.txt');
console.log(absPath); // "/path/to/project/file.txt"

const relPath = provider.relativeOrAbsolutePathToRelativePath(absPath);
console.log(relPath); // "file.txt"

// Absolute paths outside baseDirectory throw an error
try {
  provider.relativeOrAbsolutePathToAbsolutePath('/etc/passwd');
} catch (error) {
  console.error(error.message); // "Path /etc/passwd is outside the root directory"
}
```

## Plugin Integration

### Token Ring Application Plugin

The package can be used as a plugin within a Token Ring application:

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
```

## Configuration Options

### Provider Options

```typescript
interface LocalFileSystemProviderOptions {
  baseDirectory: string;           // Base directory for all operations (required)
  defaultSelectedFiles?: string[]; // Default file patterns to select (optional)
}
```

### Glob Options

```typescript
interface GlobOptions {
  ignoreFilter?: (file: string) => boolean; // Filter function for ignored files
  includeDirectories?: boolean;              // Include directories in results
}
```

### Grep Options

```typescript
interface GrepOptions {
  ignoreFilter?: (file: string) => boolean; // Filter function for ignored files
  includeContent?: {
    linesBefore?: number;  // Lines before match (default: 0)
    linesAfter?: number;   // Lines after match (default: 0)
  };
}
```

### Watch Options

```typescript
interface WatchOptions {
  ignoreFilter?: (file: string) => boolean; // Filter function for ignored files
  pollInterval?: number;                    // Polling interval in ms (default: 1000)
  stabilityThreshold?: number;              // Stability threshold in ms (default: 2000)
}
```

### Execute Command Options

```typescript
interface ExecuteCommandOptions {
  timeoutSeconds?: number;                    // Timeout in seconds (default: 60)
  env?: Record<string, string>;               // Environment variables
  workingDirectory?: string;                  // Working directory for command
}
```

### Directory Tree Options

```typescript
interface DirectoryTreeOptions {
  ignoreFilter?: (file: string) => boolean; // Filter function for ignored files
  recursive?: boolean;                      // Traverse recursively (default: true)
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
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
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

## Error Handling

The provider includes comprehensive error handling:

- **Security**: Paths outside the base directory throw errors with descriptive messages
- **Existence checks**: Operations on non-existent paths throw appropriate errors
- **Type validation**: Operations on directories when files are expected (and vice versa) throw errors
- **Command execution**: Failed commands return detailed error information without throwing
- **File permissions**: Graceful handling of permission errors where possible

```typescript
// Security: Outside root directory
try {
  await provider.relativeOrAbsolutePathToAbsolutePath('/etc/passwd');
} catch (error) {
  // Error: "Path /etc/passwd is outside the root directory"
}

// Existence: Non-existent file
try {
  await provider.readFile('missing.txt');
} catch (error) {
  // Error: "File missing.txt does not exist"
}

// Type: Directory where file expected
try {
  await provider.deleteFile('src');
} catch (error) {
  // Error: "Path src is not a file"
}
```

## Testing

Run the test suite:

```bash
bun run test
```

The test suite includes integration tests covering:

- File operations (read, write, append, delete, rename)
- Directory operations (create, copy, glob, grep)
- Path resolution and security boundaries
- Command execution with various options
- File watching functionality
- Error handling and edge cases

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
