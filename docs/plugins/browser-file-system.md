# @tokenring-ai/browser-file-system

The `@tokenring-ai/browser-file-system` package provides a browser-based mock file system implementation for the Token Ring ecosystem. It implements the `FileSystemProvider` interface using in-memory data, offering a lightweight, browser-friendly file system abstraction for environments where direct file system access is not available. This package is ideal for demos, tests, and web-based interfaces like web terminals.

## Key Features

- **In-Memory Operations**: Full file system operations work entirely in memory
- **Browser Environment**: Lightweight implementation optimized for browser-based environments
- **Mock File System**: Includes built-in sample files for immediate testing and exploration
- **Complete API**: Implements the full `FileSystemProvider` interface
- **Directory Traversal**: Support for recursive and non-recursive directory listing with ignore filters
- **File Operations**: Read, write, append, delete, copy, and rename operations
- **Content Search**: Grep functionality with context line support and ignore filters
- **File Statistics**: Get file size, timestamps, and metadata
- **Path Normalization**: Consistent path handling across all operations
- **TokenRing Plugin Integration**: Automatic service registration via plugin system
- **Comprehensive Error Handling**: Descriptive error messages for invalid operations
- **Test Coverage**: Full unit and integration test suites

## Installation

```bash
bun install @tokenring-ai/browser-file-system
```

## Quick Start

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

// Create a file system provider
const fs = new BrowserFileSystemProvider();

// Read a file
const readmeContent = await fs.readFile('/README.md');
console.log(readmeContent.toString('utf-8'));

// List files in a directory
for await (const filePath of fs.getDirectoryTree('/', { recursive: true })) {
  console.log(filePath);
}

// Write a file
await fs.writeFile('/src/app.js', 'console.log("Hello from mock app");');
```

**Note:** All instances of `BrowserFileSystemProvider` share the same file system state as it is a module-level object.

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

**Note:** The mock file system is a shared module-level object. All instances share the same file system state.

## Services

### FileSystemService Integration

This package integrates with the `FileSystemService` from `@tokenring-ai/filesystem`. The provider is automatically registered when the plugin is loaded with the appropriate configuration.

The plugin waits for the FileSystemService to be available and then registers the BrowserFileSystemProvider:

```typescript
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.filesystem) {
      app.services
        .waitForItemByType(FileSystemService, (fileSystemService) => {
          for (const name in config.filesystem.providers) {
            const provider = config.filesystem.providers[name];
            if (provider.type === "browser") {
              fileSystemService.registerFileSystemProvider(
                name,
                new BrowserFileSystemProvider(),
              );
            }
          }
        });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
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

## Integration

### TokenRing Plugin Integration

The package integrates with the TokenRing plugin system and automatically registers the file system provider when configured:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import browserFileSystem from '@tokenring-ai/browser-file-system';

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

// Access the file system service
app.services.waitForItemByType(
  FileSystemService,
  async (fileSystemService) => {
    const fs = fileSystemService.getFileSystem('browser');
    const content = await fs.readFile('/README.md');
    console.log(content?.toString('utf-8'));
  }
);
```

### Agent System Integration

The browser file system provider can be used by agents through the FileSystemService:

```typescript
import { TokenRingAgent } from '@tokenring-ai/agent';
import { FileSystemService } from '@tokenring-ai/filesystem';

// Agent can access the file system through the service
const fileSystemService = agent.requireServiceByType(FileSystemService);
const fs = fileSystemService.getFileSystem('browser');

// Perform file operations
const content = await fs.readFile('/README.md');
```

### Tool Integration

The file system provider can be used to create tools for agents:

```typescript
import { TokenRingAgentTool } from '@tokenring-ai/app';
import { FileSystemService } from '@tokenring-ai/filesystem';

const readFileTool: TokenRingAgentTool = {
  name: 'browser_read_file',
  description: 'Read a file from the browser file system',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file to read' }
    },
    required: ['path']
  },
  execute: async (agent, params) => {
    const fileSystemService = agent.requireServiceByType(FileSystemService);
    const fs = fileSystemService.getFileSystem('browser');
    const content = await fs.readFile(params.path);
    return content?.toString('utf-8') || 'File not found';
  }
};
```

## API Reference

### BrowserFileSystemProvider

The main provider class that implements the `FileSystemProvider` interface with the following methods:

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| None | - | No public properties |

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

**Returns:** `Promise<boolean>` - Always returns `true` (even for non-existent files)

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

**Throws:** Error if destination exists and overwrite is false

**Note:** Returns `true` for non-existent source files (mock behavior)

**Example:**

```typescript
// Copy with overwrite
await fs.copy('/src/index.js', '/src/main.js', { overwrite: true });

// Copy without overwrite (throws error if destination exists)
await fs.copy('/src/index.js', '/src/main.js');

// Note: copy returns true for non-existent source (mock behavior)
const result = await fs.copy('/non-existent.txt', '/dest.txt');
console.log(result); // true
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

**Throws:** Error if destination exists

**Note:** Returns `true` for non-existent source files (mock behavior)

**Example:**

```typescript
await fs.rename('/src/main.js', '/src/app.js');

// Note: rename returns true for non-existent source (mock behavior)
const result = await fs.rename('/non-existent.txt', '/new.txt');
console.log(result); // true
```

##### stat

Gets file statistics.

```typescript
async stat(filePath: string): Promise<StatLike>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| filePath | string | Path to the file |

**Returns:** `Promise<StatLike>` - File statistics (see [StatLike type](#statlike))

For existing files:
```typescript
{
  exists: true,
  path: string,
  absolutePath: string,
  isFile: boolean,
  isDirectory: boolean,
  isSymbolicLink: boolean,
  size: number,
  created: Date,
  modified: Date,
  accessed: Date
}
```

For non-existent files:
```typescript
{
  exists: false,
  path: string
}
```

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

**Note:** The glob pattern parameter is currently ignored; only the ignoreFilter is applied

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

**Note:** Logs a warning as this functionality is not implemented

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
): Promise<GrepResult[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| searchString | string \| string[] | Search string(s) |
| options.ignoreFilter | (path: string) => boolean | Optional filter function |
| options.includeContent.linesBefore | number | Number of lines before match (default: 0) |
| options.includeContent.linesAfter | number | Number of lines after match (default: 0) |

**Returns:** `Promise<GrepResult[]>` - Array of search results (see [GrepResult type](#grepresult))

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

### Type Definitions

#### StatLike

```typescript
type StatLike = {
  path: string;
  absolutePath?: string;
  exists: true;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink?: boolean;
  size?: number;
  created?: Date;
  modified?: Date;
  accessed?: Date;
} | {
  path: string;
  exists: false;
}
```

#### GrepResult

```typescript
type GrepResult = {
  file: string;
  line: number;
  match: string;
  matchedString?: string;
  content: string | null;
}
```

#### GlobOptions

```typescript
type GlobOptions = {
  ignoreFilter?: (path: string) => boolean;
  absolute?: boolean;
  includeDirectories?: boolean;
}
```

#### GrepOptions

```typescript
type GrepOptions = {
  ignoreFilter?: (path: string) => boolean;
  includeContent?: { linesBefore?: number; linesAfter?: number };
}
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

### File Search with Context

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fs = new BrowserFileSystemProvider();

// Find all occurrences of 'console' with context
const results = await fs.grep('console', {
  includeContent: {
    linesBefore: 2,
    linesAfter: 2
  }
});

// Display results with context
for (const result of results) {
  console.log(`File: ${result.file}`);
  console.log(`Line: ${result.line}`);
  console.log(`Content:\n${result.content}`);
  console.log('---');
}
```

### Directory Navigation with Ignore Filters

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fs = new BrowserFileSystemProvider();

// Get all files except test files
const files = [];
for await (const filePath of fs.getDirectoryTree('/', {
  recursive: true,
  ig: (path) => path.includes('.test.') || path.includes('/test/')
})) {
  files.push(filePath);
}
console.log('Production files:', files);

// Get only JavaScript files
const jsFiles = await fs.glob('**/*.js', {
  ignoreFilter: (path) => !path.endsWith('.js')
});
console.log('JavaScript files:', jsFiles);
```

## Chat Commands

This package does not define any chat commands. File system operations are accessed through:

- **Tools**: Available as agent tools when integrated with the agent system
- **Service API**: Direct access through the FileSystemService
- **Provider API**: Direct usage of BrowserFileSystemProvider

## RPC Endpoints

This package does not define any RPC endpoints. File system operations are accessed through the provider API and service integration.

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
- State is **shared across all instances** (module-level object)
- State is lost when the provider instance is destroyed
- No background processes or file watchers
- Changes made programmatically are immediately reflected in the mock file system

## Limitations

- **In-Memory Only**: No persistence across page reloads
- **Browser Environment**: Designed for browser environments only
- **Mock Data**: Limited to predefined mock files and directories (can be extended programmatically)
- **No File Watching**: `watch` functionality not implemented
- **Partial API**: Some advanced features log warnings for unsupported operations
- **No Symbolic Links**: `isSymbolicLink` always returns `false`
- **Fixed Timestamps**: `created`, `modified`, and `accessed` timestamps are simulated
- **Glob Pattern Ignored**: The glob pattern parameter is currently ignored; only the ignoreFilter is applied
- **Shared State**: All instances share the same file system state
- **Mock Behavior for Copy/Rename**: Returns `true` for non-existent source files

## Error Handling

The provider implements comprehensive error handling:

- **File Not Found**: Returns `null` for missing files in `readFile`
- **Path Conflicts**: Validates copy and rename operations, throwing errors for conflicts
- **Invalid Operations**: Logs warnings for unsupported operations
- **Path Normalization**: Automatically normalizes paths for consistency

### Error Types

The provider may throw the following errors:

- `Error` - Path conflicts during copy/rename operations (when destination exists without overwrite option)
- `Error` - General errors for file operations

### Error Handling Example

```typescript
import { BrowserFileSystemProvider } from '@tokenring-ai/browser-file-system';

const fs = new BrowserFileSystemProvider();

try {
  await fs.copy('/source.txt', '/dest.txt'); // Will throw if /dest.txt exists
} catch (error) {
  console.error('Copy failed:', error.message);
}

// With overwrite option
await fs.copy('/source.txt', '/dest.txt', { overwrite: true });
console.log('Copy successful');
```

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

### Test Coverage

The package includes comprehensive unit and integration tests covering:

- **Basic File Operations**: Read, write, append, delete operations
- **Directory Operations**: Tree traversal with recursive and non-recursive modes
- **File Utilities**: Copy, rename, stat, exists operations
- **Advanced Operations**: Glob patterns, grep with context, ignore filters
- **Error Handling**: Conflict detection, path validation
- **Performance**: Large file handling and batch operations
- **Integration**: Plugin registration and service integration

### Test Files

- `BrowserFileSystemProvider.test.ts` - Unit tests for provider methods
- `integration.test.ts` - End-to-end integration tests

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
└── README.md                         # Package README
```

### Build Instructions

```bash
# Type checking
bun run build

# Linting
bun run eslint

# Testing
bun test
```

### Adding New Mock Files

To add new mock files for testing:

1. Edit `BrowserFileSystemProvider.ts`
2. Add the file path and content to the `mockFileSystem` object:
   ```typescript
   const mockFileSystem: Record<string, { content: string }> = {
     // ... existing files
     '/new-file.txt': 'New file content'
   };
   ```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Core application framework and plugin system
- `@tokenring-ai/filesystem` (0.2.0) - File system service and provider interface
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.1.0) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## License

MIT License - see the root LICENSE file for details.

Copyright (c) 2025 Mark Dierolf

## Related Components

- [File System Service](./filesystem.md) - File system service and provider interface
- [TokenRing App](./app.md) - Core application framework
- [Agent System](./agent.md) - Agent orchestration and tool integration
