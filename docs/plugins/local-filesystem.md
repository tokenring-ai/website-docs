# @tokenring-ai/local-filesystem

A concrete implementation of the FileSystemProvider abstraction that provides safe, root-scoped access to your local filesystem for Token Ring apps and agents.

## Overview

The `@tokenring-ai/local-filesystem` package provides a concrete implementation of the FileSystemService abstraction that provides safe access to your local disk for Token Ring apps and agents. All operations are confined to a configured base directory with comprehensive error handling, security boundaries, and advanced features like file watching and text searching.

## Package Structure

```
pkg/local-filesystem/
├── plugin.ts          # Plugin registration and integration
├── LocalFileSystemProvider.ts  # Core filesystem provider implementation
├── index.ts          # Package exports
├── package.json      # Package metadata and dependencies
├── README.md         # Package documentation
└── test/             # Test suite
```

## Key Features

- **Root-Scoped**: All operations confined to rootDirectory; attempts to access paths outside are rejected
- **Ignore-Aware**: Respects .gitignore and .aiignore patterns for listing/searching
- **File Watching**: Uses chokidar for robust file watching
- **Shell Execution**: Uses execa with timeouts and environment overrides
- **Comprehensive API**: Read, write, delete, rename, copy, stat, chmod operations
- **Directory Operations**: Create, list, glob, grep, tree traversal
- **Command Execution**: Safe shell command execution with timeouts and working directory support
- **MCP Protocol**: Implements Model Context Protocol for AI integration
- **Type-safe**: Built with TypeScript and Zod for configuration validation

## Installation

```bash
# Using bun
bun add @tokenring-ai/local-filesystem
```

## Core Components

### LocalFileSystemProvider

Main filesystem provider class implementing the FileSystemProvider interface.

**Constructor:**
```typescript
const provider = new LocalFileSystemProvider({
  baseDirectory: string,  // Root directory for all operations
  defaultSelectedFiles?: string[]  // Optional default file patterns
});
```

**Path Utilities:**
- `relativeOrAbsolutePathToAbsolutePath(p): string`: Convert to absolute path within root
- `relativeOrAbsolutePathToRelativePath(p): string`: Convert to relative path from root

**File Operations:**
- `writeFile(filePath, content): Promise<boolean>`: Write/overwrite file
- `appendFile(filePath, content): Promise<boolean>`: Append to file
- `readFile(filePath, encoding?): Promise<string>`: Read file with encoding
- `deleteFile(filePath): Promise<boolean>`: Delete file
- `rename(oldPath, newPath): Promise<boolean>`: Rename/move file
- `exists(filePath): Promise<boolean>`: Check existence
- `stat(filePath): Promise<StatLike>`: Get file stats
- `chmod(filePath, mode): Promise<boolean>`: Change permissions
- `copy(source, destination, options?): Promise<boolean>`: Copy file with overwrite option

**Directory Operations:**
- `createDirectory(dirPath, options?): Promise<boolean>`: Create directory with recursive option
- `glob(pattern, options?): Promise<string[]>`: Pattern matching with ignore filters
- `grep(searchString, options?): Promise<GrepResult[]>`: Text search across files
- `getDirectoryTree(dir, options?): AsyncGenerator<string>`: Tree traversal
- `watch(dir, options?): Promise<FSWatcher>`: File watching with stability threshold

**Process Execution:**
- `executeCommand(command, options?): Promise<ExecuteCommandResult>`: Run shell commands
  - Options: `timeoutSeconds`, `env`, `workingDirectory`
  - Returns: `{ ok, stdout, stderr, exitCode, error? }`

## Usage Examples

### Basic File Operations

```typescript
import { LocalFileSystemProvider } from '@tokenring-ai/local-filesystem';
import { TokenRingApp } from '@tokenring-ai/app';
import { FileSystemService } from '@tokenring-ai/filesystem';

// Create provider
const provider = new LocalFileSystemProvider({
  baseDirectory: process.cwd(),
  defaultSelectedFiles: ['**/*.md']
});

// Write file
await provider.writeFile('notes/todo.txt', '- [ ] Ship README');

// Read file
const content = await provider.readFile('notes/todo.txt', 'utf8');

// Get file stats
const info = await provider.stat('notes/todo.txt');
console.log(info); // { path, absolutePath, isFile, isDirectory, size, created, modified, accessed }

// Rename file
await provider.rename('notes/todo.txt', 'notes/TODO.md');

// Copy file
await provider.copy('notes/TODO.md', 'notes/backup/TODO.md');
```

### Directory and Search Operations

```typescript
// Create directory
await provider.createDirectory('new-folder', { recursive: true });

// List files with glob pattern
const mdFiles = await provider.glob('**/*.md');

// Search text across files
const results = await provider.grep('TODO', {
  includeContent: { linesBefore: 1, linesAfter: 1 }
});

// Get directory tree
for await (const path of provider.getDirectoryTree('.', { recursive: true })) {
  console.log(path);
}
```

### File Watching

```typescript
const watcher = await provider.watch('.', {
  ignoreFilter: (file) => file.includes('node_modules'),
  pollInterval: 500,
  stabilityThreshold: 1000
});

watcher.on('all', (event, path) => {
  console.log(`File ${path} was ${event}`);
});
```

### Shell Command Execution

```typescript
const result = await provider.executeCommand('ls -la', {
  workingDirectory: 'src',
  timeoutSeconds: 30,
  env: { NODE_ENV: 'development' }
});

if (result.ok) {
  console.log('Command succeeded:', result.stdout);
} else {
  console.error('Command failed:', result.stderr);
}
```

## Configuration Options

### Provider Configuration

```typescript
const options: LocalFileSystemProviderOptions = {
  baseDirectory: string,  // Base directory for all operations
  defaultSelectedFiles?: string[]  // Default file patterns to select
};
```

### Command Execution Options

```typescript
const commandOptions = {
  timeoutSeconds: number,  // Default: 60 (seconds)
  env: Record<string, string>,  // Environment variables
  workingDirectory: string  // Working directory for command
};
```

### Watch Options

```typescript
const watchOptions = {
  ignoreFilter: (file: string) => boolean,  // Filter function for ignored files
  pollInterval: number,  // Polling interval in milliseconds (default: 1000)
  stabilityThreshold: number  // Stability threshold in milliseconds (default: 2000)
};
```

### Search Options

```typescript
const searchOptions = {
  includeContent: {
    linesBefore: number,  // Lines before match (default: 0)
    linesAfter: number   // Lines after match (default: 0)
  }
};
```

## Error Handling

- **Outside Root**: Throws error for paths outside `baseDirectory`
- **Nonexistent Paths**: Throws when targets are missing for operations requiring existing files
- **Overwrites**: `copy()` without `overwrite=true` throws if destination exists
- **Commands**: Returns `{ ok: false }` on failures with stderr and exitCode
- **File Operations**: Proper error messages for permissions, missing files, etc.

## Integration with TokenRing App

The plugin automatically registers with the TokenRing app when configured in the filesystem section:

```json
{
  "filesystem": {
    "providers": {
      "local": {
        "type": "local",
        "baseDirectory": "/path/to/project"
      }
    }
  }
}
```

## Dependencies

- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/filesystem`: Abstract filesystem interface
- `@tokenring-ai/chat`: Chat system integration
- `@tokenring-ai/agent`: Agent system integration
- `chokidar@^5.0.0`: File watching
- `execa@^9.6.1`: Process execution
- `fs-extra@^11.3.2`: File utilities
- `glob@^13.0.0`: Pattern matching
- `glob-gitignore@^1.0.15`: Ignore pattern handling
- `zod`: Type-safe schema validation

## Testing

Run the test suite:

```bash
bun run test
```

The test suite includes integration tests covering file operations, error handling, and edge cases.


## License

MIT License - see [LICENSE](LICENSE) file for details.