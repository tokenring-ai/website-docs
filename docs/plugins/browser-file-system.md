# Browser File System Plugin

## Overview

Provides a browser-based mock FileSystemService using in-memory data. This package implements the `FileSystemProvider` interface using in-memory mock data, providing a lightweight, browser-friendly file system abstraction for environments where direct access to the file system is not available. It's ideal for demos, tests, and web-based interfaces like web terminals.

## Key Features

- **In-Memory Operations**: Full file system operations work entirely in memory
- **Browser Environment**: Lightweight implementation optimized for browser-based environments
- **Mock File System**: Includes built-in sample files for immediate testing and exploration
- **Complete API**: Implements the full `FileSystemProvider` interface
- **Directory Traversal**: Support for recursive and non-recursive directory listing
- **File Operations**: Read, write, append, delete, copy, and rename operations
- **Content Search**: Grep functionality with context line support
- **File Statistics**: Get file size, timestamps, and metadata
- **Path Normalization**: Consistent path handling across all operations
- **Ignore Filters**: Support for filtering files during traversal and search
- **TokenRing Plugin Integration**: Automatic service registration via plugin system
- **Error Handling**: Comprehensive error handling with descriptive messages

## Installation

```bash
npm install @tokenring-ai/browser-file-system
```

## Quick Start

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

// Create a file system provider
const fs = new BrowserFileSystemProvider();

// Read a file
const readmeContent = await fs.readFile('/README.md');
console.log(readmeContent);

// List files in a directory
for await (const filePath of fs.getDirectoryTree('/', { recursive: true })) {
  console.log(filePath);
}
```

## Plugin Configuration

The plugin integrates with the TokenRing configuration system and FileSystemService:

```typescript
import { TokenRingApp, TokenRingPlugin } from '@tokenring-ai/app';
import browserFileSystem from '@tokenring-ai/browser-file-system';
import { FileSystemConfigSchema } from '@tokenring-ai/filesystem/schema';

const app = new TokenRingApp();

app.registerPlugin(browserFileSystem, {
  filesystem: {
    providers: {
      browser: {
        type: 'browser'
      }
    }
  }
});
```

The plugin automatically registers the `BrowserFileSystemProvider` as a file system provider with the FileSystemService when configured with `type: 'browser'`.

## Core Components

### BrowserFileSystemProvider

The main class that implements the complete `FileSystemProvider` interface:

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fileSystem = new BrowserFileSystemProvider();
```

### Mock File System Structure

The provider includes built-in mock files for testing and demonstration:

```typescript
// Files included in the mock file system:
{
  '/README.md': '# Mock File System\n\nThis is a sample README file.',
  '/src/index.js': 'console.log("Hello from mock index.js");',
  '/src/components/Button.jsx': 'const Button = () => <button>Click Me</button>;\nexport default Button;',
  '/package.json': '{ "name": "mock-project", "version": "1.0.0" }'
}
```

## API Reference

### BrowserFileSystemProvider

The main provider class that implements the `FileSystemProvider` interface with the following methods:

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| name | string | Provider name (`"BrowserFileSystemProvider"`) |

#### Methods

##### getDirectoryTree

Returns an async generator that yields file paths in a directory tree.

```typescript
async *getDirectoryTree(
  path: string = '/',
  params?: {
    ig?: (path: string) => boolean;
    recursive?: boolean;
  }
): AsyncGenerator<string, void, unknown>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| path | string | Directory path to list (default: '/') |
| params.recursive | boolean | Whether to include subdirectories (default: true) |
| params.ig | (path: string) => boolean | Optional ignore filter function |

**Returns:** Async generator yielding file paths

**Example:**

```typescript
// Recursive listing
for await (const filePath of fs.getDirectoryTree('/')) {
  console.log(filePath);
}

// Non-recursive listing of direct children
for await (const filePath of fs.getDirectoryTree('/src', { recursive: false })) {
  console.log(filePath);
}

// With ignore filter
for await (const filePath of fs.getDirectoryTree('/', {
  recursive: true,
  ig: (path) => path.includes('test')
})) {
  console.log(filePath);
}
```

##### createDirectory

Creates a directory (no-op in mock implementation).

```typescript
async createDirectory(
  path: string,
  options?: { recursive?: boolean }
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| path | string | Directory path to create |
| options.recursive | boolean | Whether to create parent directories (ignored) |

**Returns:** `Promise<boolean>` - Always returns `true`

##### readFile

Reads file content from the file system.

```typescript
async readFile(filePath: string): Promise<Buffer | null>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to the file to read |

**Returns:** `Promise<Buffer | null>` - File content as Buffer or null if file doesn't exist

**Example:**

```typescript
const content = await fs.readFile('/README.md');
if (content) {
  console.log(content.toString('utf-8'));
}
```

##### writeFile

Writes content to a file.

```typescript
async writeFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path where to write the file |
| content | string \| Buffer | Content to write |

**Returns:** `Promise<boolean>` - Always returns `true`

**Example:**

```typescript
await fs.writeFile('/src/utils.js', 'export const helper = () => "Hello";');
```

##### appendFile

Appends content to an existing file or creates the file if it doesn't exist.

```typescript
async appendFile(
  filePath: string,
  content: string | Buffer
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to the file to append to |
| content | string \| Buffer | Content to append |

**Returns:** `Promise<boolean>` - Always returns `true`

**Example:**

```typescript
await fs.appendFile('/README.md', '\n## Updated content\n');
```

##### deleteFile

Deletes a file from the file system.

```typescript
async deleteFile(filePath: string): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to the file to delete |

**Returns:** `Promise<boolean>` - Always returns `true`

##### exists

Checks if a file exists in the file system.

```typescript
async exists(filePath: string): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to check |

**Returns:** `Promise<boolean>` - `true` if file exists, `false` otherwise

##### copy

Copies a file from source to destination.

```typescript
async copy(
  source: string,
  destination: string,
  options?: { overwrite?: boolean }
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| source | string | Source file path |
| destination | string | Destination file path |
| options.overwrite | boolean | Whether to overwrite destination if it exists (default: false) |

**Returns:** `Promise<boolean>` - Always returns `true`

**Example:**

```typescript
// Copy with overwrite
await fs.copy('/src/index.js', '/src/main.js', { overwrite: true });

// Copy without overwrite (throws error if destination exists)
await fs.copy('/src/index.js', '/src/main.js');
```

##### rename

Renames or moves a file.

```typescript
async rename(
  oldPath: string,
  newPath: string
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| oldPath | string | Current file path |
| newPath | string | New file path |

**Returns:** `Promise<boolean>` - Always returns `true`

**Example:**

```typescript
await fs.rename('/src/main.js', '/src/app.js');
```

##### stat

Gets file statistics.

```typescript
async stat(filePath: string): Promise<{
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
}>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to the file |

**Returns:** `Promise<StatLike>` - File statistics

**Example:**

```typescript
const stats = await fs.stat('/README.md');
console.log(`File size: ${stats.size} bytes`);
console.log(`Modified: ${stats.modified}`);
```

##### glob

Matches files using a glob pattern.

```typescript
async glob(
  pattern: string,
  options?: {
    ignoreFilter?: (path: string) => boolean;
  }
): Promise<string[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| pattern | string | Glob pattern (currently ignored, only ignoreFilter is applied) |
| options.ignoreFilter | (path: string) => boolean | Optional filter function |

**Returns:** `Promise<string[]>` - Array of matching file paths

**Example:**

```typescript
// Get all non-test files
const files = await fs.glob('**/*.js', {
  ignoreFilter: (path) => path.includes('test')
});
console.log(files);
```

##### watch

Watches for file changes (not implemented).

```typescript
async watch(
  dir: string,
  options?: any
): Promise<any>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| dir | string | Directory to watch |
| options | any | Watch options |

**Returns:** `Promise<any>` - Always returns `null`

##### grep

Searches file contents for matching strings.

```typescript
async grep(
  searchString: string | string[],
  options?: {
    ignoreFilter?: (path: string) => boolean;
    includeContent?: {
      linesBefore?: number;
      linesAfter?: number;
    };
  }
): Promise<Array<{
  file: string;
  line: number;
  match: string;
  matchedString: string;
  content: string | null;
}>>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| searchString | string \| string[] | Search string(s) |
| options.ignoreFilter | (path: string) => boolean | Optional filter function |
| options.includeContent.linesBefore | number | Number of lines before match (default: 0) |
| options.includeContent.linesAfter | number | Number of lines after match (default: 0) |

**Returns:** `Promise<GrepResult[]>` - Array of search results

**Example:**

```typescript
// Basic search
const results = await fs.grep('console');
console.log(results);

// Search with context
const resultsWithContext = await fs.grep('console', {
  includeContent: { linesBefore: 1, linesAfter: 1 }
});
console.log(resultsWithContext);

// Search with ignore filter
const resultsFiltered = await fs.grep('test', {
  ignoreFilter: (path) => path.includes('test')
});
console.log(resultsFiltered);
```

## Configuration

### Plugin Configuration Schema

The plugin configuration uses the `FileSystemConfigSchema` from `@tokenring-ai/filesystem`:

```typescript
import { FileSystemConfigSchema } from '@tokenring-ai/filesystem/schema';
import { z } from 'zod';

const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema
});

// Example configuration
const config = {
  filesystem: {
    providers: {
      browser: {
        type: 'browser'
      }
    }
  }
};
```

### Provider Configuration

The provider is registered through the FileSystemService:

```typescript
import { FileSystemService } from '@tokenring-ai/filesystem';
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fileSystemService = new FileSystemService();

// Register the browser provider
fileSystemService.registerFileSystemProvider(
  'browser',
  new BrowserFileSystemProvider()
);
```

## Usage Examples

### Complete Integration Example

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import browserFileSystem from '@tokenring-ai/browser-file-system';

// Create and configure the app
const app = new TokenRingApp();

// Register the browser file system plugin
app.registerPlugin(browserFileSystem, {
  filesystem: {
    providers: {
      browser: {
        type: 'browser'
      }
    }
  }
});

// Wait for the file system service to be ready
app.services.waitForItemByType(
  FileSystemService,
  async (fileSystemService) => {
    // Use the file system
    const fs = fileSystemService.getFileSystem('browser');

    // Read a file
    const content = await fs.readFile('/README.md');
    console.log('File content:', content?.toString('utf-8'));

    // Write a new file
    await fs.writeFile('/src/app.js', 'console.log("Hello");');

    // Search for content
    const results = await fs.grep('console', {
      includeContent: { linesBefore: 1, linesAfter: 1 }
    });
    console.log('Search results:', results);

    // Get directory listing
    const files = [];
    for await (const filePath of fs.getDirectoryTree('/')) {
      files.push(filePath);
    }
    console.log('Files:', files);
  }
);
```

### Testing with Mock Files

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fs = new BrowserFileSystemProvider();

// Test file operations
async function testFileSystem() {
  // Check if README exists
  const readmeExists = await fs.exists('/README.md');
  console.log('README exists:', readmeExists);

  // Read README
  const readme = await fs.readFile('/README.md');
  if (readme) {
    console.log('README content length:', readme.length);
  }

  // Create a new file
  await fs.writeFile('/test.txt', 'Test content');
  console.log('Test file created');

  // Append to file
  await fs.appendFile('/test.txt', '\nMore content');
  console.log('Content appended');

  // Copy file
  await fs.copy('/test.txt', '/test-copy.txt');
  console.log('File copied');

  // Rename file
  await fs.rename('/test-copy.txt', '/renamed.txt');
  console.log('File renamed');

  // Delete file
  await fs.deleteFile('/renamed.txt');
  console.log('File deleted');
}

testFileSystem().catch(console.error);
```

### Integration with Web Terminal

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fs = new BrowserFileSystemProvider();

// List directory command
async function listDirectory(path: string) {
  const files = [];
  for await (const filePath of fs.getDirectoryTree(path, { recursive: false })) {
    const stats = await fs.stat(filePath);
    files.push({
      name: filePath,
      size: stats.size,
      isFile: stats.isFile
    });
  }
  return files;
}

// Read file command
async function readFile(path: string) {
  const content = await fs.readFile(path);
  return content?.toString('utf-8') || null;
}

// Search command
async function searchFiles(query: string) {
  return await fs.grep(query);
}
```

## State Management

The BrowserFileSystemProvider maintains state entirely in memory using a JavaScript object:

```typescript
// Internal state structure
const mockFileSystem: Record<string, { content: string }> = {
  '/README.md': { content: '# Mock File System...' },
  '/src/index.js': { content: 'console.log("Hello");' },
  // ... more files
};
```

**Important Notes:**

- State is **not persisted** across page reloads
- All operations are **in-memory only**
- State is lost when the provider instance is destroyed
- No background processes or file watchers

## Limitations

- **In-Memory Only**: No persistence across page reloads
- **Browser Environment**: Designed for browser environments only
- **Mock Data**: Limited to predefined mock files and directories
- **No Command Execution**: `executeCommand` not supported in browser environment
- **No File Watching**: `watch` functionality not implemented
- **Partial API**: Some advanced features log warnings for unsupported operations

## Error Handling

The provider implements comprehensive error handling:

- **File Not Found**: Returns `null` for reads or ignores non-existent files for write operations
- **Path Conflicts**: Validates copy and rename operations, throwing errors for conflicts
- **Invalid Operations**: Logs warnings for unsupported operations
- **Path Normalization**: Automatically normalizes paths for consistency

### Error Types

- `Error` - General errors for file operations
- `Error` - Path conflicts during copy/rename operations

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch

# Run specific test file
bun test BrowserFileSystemProvider.test.ts

# Run integration tests
bun test integration.test.ts
```

## Development

### Project Structure

```
pkg/browser-file-system/
├── BrowserFileSystemProvider.ts      # Main provider implementation
├── BrowserFileSystemProvider.test.ts # Unit tests for provider
├── integration.test.ts               # Integration tests
├── index.ts                          # Module exports
├── plugin.ts                         # TokenRing plugin integration
├── package.json                      # Package configuration
├── vitest.config.ts                  # Test configuration
├── LICENSE                           # License information
└── README.md                         # This file
```

### Build Instructions

```bash
# Type checking
tsc --noEmit

# Linting
bun run eslint

# Testing
bun test
```

## Dependencies

This package depends on:

- `@tokenring-ai/app` - Core application framework and plugin system
- `@tokenring-ai/filesystem` - File system service and provider interface

## License

MIT License - see the root LICENSE file for details.

## Related Components

- [File System Service](./filesystem.md)
- [TokenRing App](./app.md)
