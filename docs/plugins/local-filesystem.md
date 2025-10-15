# Local Filesystem Plugin

Concrete filesystem implementation for local disk access with root-scoped operations, ignore filters, and shell execution.

## Overview

The `@tokenring-ai/local-filesystem` package provides a concrete implementation of the FileSystemService abstraction that provides safe access to your local disk for Token Ring apps and agents. All operations are confined to a configured root directory with ignore-aware listing and searching.

## Key Features

- **Root-Scoped**: All operations confined to rootDirectory; attempts to access paths outside are rejected
- **Ignore-Aware**: Respects .gitignore and .aiignore patterns for listing/searching
- **File Watching**: Uses chokidar for robust file watching
- **Shell Execution**: Uses execa with timeouts and environment overrides
- **Comprehensive API**: Read, write, delete, rename, copy, stat, chmod operations
- **Directory Operations**: Create, list, glob, grep, tree traversal

## Core Components

### LocalFileSystemService

Concrete implementation extending FileSystemService for local disk operations.

**Constructor:**
- `new LocalFileSystemService({ rootDirectory: string, defaultSelectedFiles?: string[] })`

**Path Utilities:**
- `relativeOrAbsolutePathToAbsolutePath(p): string`: Convert to absolute path
- `relativeOrAbsolutePathToRelativePath(p): string`: Convert to relative path

**File Operations:**
- `writeFile(filePath, content): Promise<boolean>`: Write/overwrite file
- `getFile(filePath): Promise<string>`: Read file as string
- `readFile(filePath, encoding?): Promise<string>`: Read with encoding
- `deleteFile(filePath): Promise<boolean>`: Delete file
- `rename(oldPath, newPath): Promise<boolean>`: Rename/move file
- `exists(filePath): Promise<boolean>`: Check existence
- `stat(filePath): Promise<StatInfo>`: Get file stats
- `chmod(filePath, mode): Promise<boolean>`: Change permissions
- `copy(source, destination, options?): Promise<boolean>`: Copy file

**Directory Operations:**
- `createDirectory(dirPath, options?): Promise<boolean>`: Create directory
- `glob(pattern, options?): Promise<string[]>`: Pattern matching
- `grep(searchString, options?): Promise<SearchResult[]>`: Text search
- `getDirectoryTree(dir, options?): AsyncGenerator<string>`: Tree traversal
- `watch(dir, options?): Promise<FSWatcher>`: File watching

**Process Execution:**
- `executeCommand(command, options?): Promise<ExecuteResult>`: Run shell commands
  - Options: `timeoutSeconds`, `env`, `workingDirectory`
  - Returns: `{ ok, stdout, stderr, exitCode, error? }`

## Usage Example

```typescript
import { ServiceRegistry } from '@tokenring-ai/registry';
import { LocalFileSystemService } from '@tokenring-ai/local-filesystem';

const registry = new ServiceRegistry();
await registry.start();

const fsService = new LocalFileSystemService({ rootDirectory: process.cwd() });
await registry.services.addServices(fsService);

// Write
await fsService.writeFile('notes/todo.txt', '- [ ] Ship README\n');

// Read
const content = await fsService.getFile('notes/todo.txt');

// Stat
const info = await fsService.stat('notes/todo.txt');

// Rename
await fsService.rename('notes/todo.txt', 'notes/TODO.md');

// Glob
const mdFiles = await fsService.glob('**/*.md');

// Execute shell command
const result = await fsService.executeCommand('echo hello', { workingDirectory: '.' });
if (result.ok) {
  console.log(result.stdout); // "hello"
}

// Directory tree
for await (const path of fsService.getDirectoryTree('.', { recursive: true })) {
  console.log(path);
}
```

## Configuration Options

- **rootDirectory**: Base directory for all operations (required)
- **defaultSelectedFiles**: Array of default file patterns
- **Ignore Filters**: Auto-loads .gitignore and .aiignore patterns
- **Command Timeouts**: Minimum 5s, maximum 600s
- **Watch Options**: `pollInterval` (default 1000ms), `stabilityThreshold` (default 2000ms)

## Error Handling

- **Outside Root**: Throws error for paths outside rootDirectory
- **Nonexistent Paths**: Throws when targets are missing for operations requiring existing files
- **Overwrites**: `copy()` without `overwrite=true` throws if destination exists
- **Commands**: Returns `{ ok: false }` on failures with stderr and exitCode

## Dependencies

- `@tokenring-ai/filesystem@0.1.0`: Abstract base and ignore filter helpers
- `@tokenring-ai/registry@0.1.0`: Service registration support
- `chokidar@^4.0.3`: File watching
- `execa@^9.6.0`: Process execution
- `fs-extra@^11.2.0`: File utilities
- `glob@^11.0.0`: Pattern-based file listing
