# Browser File System Plugin

## Overview

The browser-file-system plugin provides a browser-based mock FileSystemService using in-memory data. It implements the FileSystemProvider interface from the @tokenring-ai/filesystem package, allowing agents to perform file operations in a simulated browser environment.

## Key Features

- **In-memory file system**: All file operations occur in memory, perfect for browser environments
- **Complete file API**: Supports read, write, append, copy, rename, and stat operations
- **Directory tree generation**: Generates directory structures from in-memory data
- **Grep functionality**: Search for text across multiple files with context support
- **Mock data initialization**: Pre-populated with sample files for testing
- **Plugin integration**: Seamless integration with TokenRing's service architecture

## Installation

Add the package to your TokenRing application:

```bash
bun add @tokenring-ai/browser-file-system
```

## Configuration

Configure the filesystem service in your application configuration:

```json
{
  "filesystem": {
    "providers": {
      "browser": {
        "type": "browser"
      }
    }
  }
}
```

## Core Components

### BrowserFileSystemProvider

The main class implementing the FileSystemProvider interface with the following methods:

#### File Operations
- `readFile(filePath: string)`: Read file content
- `writeFile(filePath: string, content: string | Buffer)`: Write or overwrite file
- `appendFile(filePath: string, content: string | Buffer)`: Append to existing file
- `copy(source: string, destination: string, options?: { overwrite?: boolean })`: Copy files with overwrite option
- `rename(oldPath: string, newPath: string)`: Rename/move files
- `deleteFile(filePath: string)`: Not implemented in mock (read-only aspects)

#### Directory Operations
- `getDirectoryTree(path: string = "/", params?: { recursive?: boolean, ig?: (path: string) => boolean })`: Generate directory tree with optional ignore filters
- `createDirectory(path: string, options?: { recursive?: boolean })`: No-op implementation (always returns true)
- `exists(filePath: string)`: Check if file exists

#### Advanced Operations
- `stat(filePath: string)`: Get file statistics (size, dates, etc.)
- `glob(pattern: string, options?: { ignoreFilter?: (file: string) => boolean })`: **Note**: The `pattern` parameter is currently ignored; only the `ignoreFilter` is applied
- `grep(searchString: string | string[], options?: { ignoreFilter?: (file: string) => boolean, includeContent?: { linesBefore?: number, linesAfter?: number } })`: Search text across files
- `watch(dir: string, options?: WatchOptions)`: Not implemented
- `executeCommand(command: string | string[], options?: ExecuteCommandOptions)`: Not supported in browser

## Mock File System Structure

The plugin initializes with a pre-populated mock file system containing:

```
/
├── README.md
├── src/
│   ├── index.js
│   └── components/
│       └── Button.jsx
└── package.json
```

## Usage Examples

### Basic File Operations

```typescript
import { BrowserFileSystemProvider } from "@tokenring-ai/browser-file-system";

const provider = new BrowserFileSystemProvider();

// Read a file
const content = await provider.readFile("/README.md");
console.log(content);

// Write a new file
await provider.writeFile("/new-file.txt", "Hello World!");

// Append to existing file
await provider.appendFile("/new-file.txt", " - added content");

// Check if file exists
const exists = await provider.exists("/new-file.txt");
```

### Directory Tree Generation

```typescript
// Get all files recursively
for await (const filePath of provider.getDirectoryTree("/")) {
  console.log(filePath);
}

// Get only direct children (non-recursive)
for await (const filePath of provider.getDirectoryTree("/", { recursive: false })) {
  console.log(filePath);
}

// Get with ignore filter
const ignoreJsx = (path: string) => path.includes(".jsx");
for await (const filePath of provider.getDirectoryTree("/", { 
  recursive: true, 
  ig: ignoreJsx 
})) {
  console.log(filePath);
}
```

### File Copy and Rename

```typescript
// Copy a file
await provider.copy("/README.md", "/copy-of-readme.md");

// Copy with overwrite option
await provider.copy("/source.txt", "/dest.txt", { overwrite: true });

// Rename a file
await provider.rename("/temp.txt", "/renamed.txt");
```

### Grep Search

```typescript
// Basic search
const results = await provider.grep("console");
console.log(results);

// Search with context lines
const resultsWithContext = await provider.grep("console", {
  includeContent: { linesBefore: 1, linesAfter: 1 }
});

// Search with ignore filter
const resultsFiltered = await provider.grep("search term", {
  ignoreFilter: (file) => file.includes("subdirectory")
});
```

### Glob Pattern Matching

```typescript
// Note: The `pattern` parameter is ignored. Use `ignoreFilter` to filter files:
const jsFiles = await provider.glob("*", {
  ignoreFilter: (file) => !file.endsWith(".js")
}); // Excludes non-JavaScript files

// Example: Exclude test files
const filteredFiles = await provider.glob("*", {
  ignoreFilter: (file) => file.includes("test")
});
```

## Configuration Options

### Provider Configuration
```json
{
  "filesystem": {
    "providers": {
      "browser": {
        "type": "browser"
      }
    }
  }
}
```

### Provider Parameters
- `recursive` (boolean): Control directory tree recursion (default: true)
- `ignoreFilter` (function): Filter function to exclude files from results
- `overwrite` (boolean): Allow overwriting destination files during copy
- `linesBefore`/`linesAfter` (number): Context lines for grep searches

## Integration Patterns

### Plugin Installation

The plugin automatically registers with the FileSystemService when configured:

```typescript
import { BrowserFileSystemProvider } from "@tokenring-ai/browser-file-system";

// Plugin installation happens automatically when added to TokenRing app
// with the browser provider configured
```

### Service Registration

The plugin registers the browser file system provider with the TokenRing service registry:

```typescript
app.services.waitForItemByType(FileSystemService, (fileSystemService) => {
  fileSystemService.registerFileSystemProvider(
    "browser",
    new BrowserFileSystemProvider()
  );
});
```

## Limitations

- **Read-only aspects**: deleteFile is not implemented (console warning)
- **No command execution**: executeCommand returns error (not supported in browser)
- **No file watching**: watch returns null with warning
- **In-memory only**: All operations are in memory, no persistence across sessions
- **Mock data only**: Cannot access real browser file system

## Development

- **Version**: 0.2.0
- **Dependencies**:
  - `@tokenring-ai/app`: Application framework
  - `@tokenring-ai/filesystem`: Abstract filesystem interface
- **Testing**:
  ```bash
  bun run test
  ```
  ```bash
  bun run test:watch
  ```
- **License**: MIT License