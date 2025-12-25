# Filesystem Plugin

Provides an abstract filesystem interface for AI agents with file operations, search capabilities, shell execution, and multi-provider support.

## Overview

The `@tokenring-ai/filesystem` package provides a unified filesystem interface designed for integration with AI agents in the Token Ring framework. It enables virtual filesystem operations such as reading/writing files, directory traversal, globbing, searching, and executing shell commands. The package supports multiple filesystem providers (local, virtual, etc.) and integrates seamlessly with the `@tokenring-ai/agent` for state management, including file selection for chat sessions and memory injection.

Key features:
- **Unified API**: Create, read, update, delete, rename, permissions
- **Ignore Filters**: Based on `.gitignore` and `.aiignore`
- **Agent Tools**: File modification, patching, searching, and shell execution
- **Chat Commands**: Managing files in agent conversations (`/file`, `/foreach`)
- **Async Generators**: Directory trees and memories from selected files
- **Dirty Tracking**: Track changes for auto-commit workflows
- **Command Safety**: Validate shell commands with user confirmation for dangerous operations
- **Multi-Provider Support**: Register and switch between different filesystem providers
- **Scripting Integration**: Global functions for scripting environments
- **Context Handlers**: Provide file contents as chat context with fuzzy matching
- **JSON-RPC Endpoints**: Remote filesystem access

## Core Components

### FileSystemService

Main service class implementing `TokenRingService` that manages filesystem providers and state.

**Key Properties/Methods:**
- `registerFileSystemProvider(provider)`: Registers a filesystem provider
- `getActiveFileSystemProviderName()`: Gets the current active provider
- `setActiveFileSystemProviderName(name)`: Sets the active provider
- `getAvailableFileSystemProviders()`: Lists all registered providers
- `writeFile(path, content)`: Writes/overwrites file
- `readFile(path, encoding?)`: Raw read (supports buffer encoding)
- `getFile(path)`: Reads as UTF-8 string (convenience wrapper)
- `deleteFile(path)`, `rename(oldPath, newPath)`, `copy(source, dest)`: Standard ops
- `exists(path)`, `stat(path)`: File info and metadata
- `createDirectory(path, options?)`: Creates directory
- `glob(pattern, options?)`: Pattern matching with ignore filters
- `grep(searchString, options?)`: Text search across files
- `executeCommand(command, options?)`: Shell execution with safety validation
- `watch(dir, options?)`: File watching with ignore filters
- `addFileToChat(file, agent)`: Add file to agent context
- `getMemories(agent)`: Yields file contents as agent memories
- `askForFileSelection(options, agent)`: Interactive tree-based file selection
- `setDirty(dirty)`: Mark filesystem as dirty for auto-commit
- `getDirty()`: Get dirty status
- `getCommandSafetyLevel(command)`: Validate command safety level

### FileSystemProvider

Abstract base class for concrete implementations (e.g., local FS).

**Required Methods:**
- `getDirectoryTree(path, params?)`: Async generator for directory contents
- `writeFile(path, content)`: Write file
- `appendFile(filePath, content)`: Append to file
- `deleteFile(path)`: Delete file
- `readFile(path, encoding?)`: Read file
- `rename(oldPath, newPath)`: Rename file
- `exists(path)`: Check existence
- `stat(path)`: Get file stats
- `createDirectory(path, options?)`: Create directory
- `copy(source, dest, options?)`: Copy file
- `glob(pattern, options?)`: Pattern matching
- `watch(dir, options?)`: File watching
- `executeCommand(command, options?)`: Shell execution
- `grep(searchString, options?)`: Text search

### Tools

#### file/write

Write, append, delete, rename, or adjust file permissions.

**Parameters:**
- `path`: File path (relative to root)
- `action`: Operation to perform (`write`, `append`, `delete`, `rename`, `adjust`)
- `content`: File content (required for write/append)
- `is_base64`: Whether content is base64 encoded (optional)
- `fail_if_exists`: Fail if file exists (optional)
- `permissions`: Octal permissions (e.g., '644') (optional)
- `toPath`: Destination path for rename/copy (optional)
- `check_exists`: Check file existence before operation (optional)

**Example:**
```typescript
// Write a file
await agent.useTool({
  name: 'file/write',
  params: {
    path: 'example.txt',
    action: 'write',
    content: 'Hello, world!'
  }
});

// Append to a file
await agent.useTool({
  name: 'file/write',
  params: {
    path: 'log.txt',
    action: 'append',
    content: 'New log entry'
  }
});

// Rename a file
await agent.useTool({
  name: 'file/write',
  params: {
    path: 'old.txt',
    action: 'rename',
    toPath: 'new.txt'
  }
});

// Adjust permissions
await agent.useTool({
  name: 'file/write',
  params: {
    path: 'config.json',
    action: 'adjust',
    permissions: '600'
  }
});
```

#### file_search

Retrieve files by paths/globs or search text across files.

**Parameters:**
- `files`: File paths or glob patterns (optional)
- `searches`: Search patterns (optional)
- `returnType`: Result format (`names`, `content`, `matches`)
- `linesBefore/After`: Context lines around matches (default: 10 for matches)
- `caseSensitive`: Search case sensitivity (default: true)
- `matchType`: Matching type (`substring`, `whole-word`, `regex`)

**Example:**
```typescript
// Search for files matching patterns
await agent.useTool({
  name: 'file_search',
  params: {
    searches: ['TODO', 'FIXME'],
    returnType: 'matches',
    linesBefore: 3,
    linesAfter: 3
  }
});

// Get file contents
await agent.useTool({
  name: 'file_search',
  params: {
    files: ['src/**/*.ts'],
    returnType: 'content'
  }
});

// Get file names matching glob
await agent.useTool({
  name: 'file_search',
  params: {
    files: ['**/*.md'],
    returnType: 'names'
  }
});
```

#### terminal_bash

Execute shell commands with safety validation and timeout.

**Parameters:**
- `command`: Shell command to execute
- `timeoutSeconds`: Timeout in seconds (default: 60, max: 90)
- `workingDirectory`: Working directory (default: './')

**Example:**
```typescript
// Execute a safe command
await agent.useTool({
  name: 'terminal_bash',
  params: {
    command: 'ls -la',
    workingDirectory: './src'
  }
});

// Execute with custom timeout
await agent.useTool({
  name: 'terminal_bash',
  params: {
    command: 'bun test',
    timeoutSeconds: 120
  }
});
```

### Chat Commands

#### /file

Manage files in the chat session.

- **Actions**:
  - `select`: Interactive tree selection
  - `add [files...]`: Add specific files
  - `remove [files...]`: Remove specific files
  - `list`/`ls`: Show current files
  - `clear`: Remove all files
  - `default`: Reset to config defaults

**Example:**
```bash
/file select                    # Interactive file picker
/file add src/main.ts           # Add specific file
/file add src/*.ts              # Add all TypeScript files
/file remove src/main.ts        # Remove specific file
/file list                      # Show current files
/file clear                     # Remove all files
/file default                   # Reset to config defaults
```

#### /foreach <glob> <prompt>

Run AI prompt on each matching file.

**Example:**
```bash
/foreach src/**/*.ts "Update the copyright year to 2024"
```

### Global Scripting Functions

When `@tokenring-ai/scripting` is available, the following global functions are automatically registered:

- `createFile(path, content)`: Creates a file
- `deleteFile(path)`: Deletes a file
- `globFiles(pattern)`: Returns array of matching files
- `searchFiles(searchString)`: Searches for text across files

**Example:**
```bash
# Create a file
/var $result = createFile("report.txt", "This is a report")
/call echo $result

# Search for files
/var $todos = searchFiles("TODO")
/call echo $todos
```

### Context Handlers

#### selected-files

Provides contents of selected files as chat context.

#### search-files

Provides file search results for keywords as chat context with fuzzy matching and keyword extraction.

**Example:**
When a user asks about a specific file or functionality, the context handler automatically extracts keywords and provides relevant files.

### JSON-RPC Endpoints

Remote filesystem access via JSON-RPC:

- `readFile`, `exists`, `stat`, `glob`, `listDirectory`
- `writeFile`, `appendFile`, `deleteFile`, `rename`
- `createDirectory`, `copy`
- `addFileToChat`, `removeFileFromChat`, `getSelectedFiles`

## Usage Examples

### Basic File Operations

```typescript
import { FileSystemService } from '@tokenring-ai/filesystem';

const fs = new FileSystemService({
  defaultSelectedFiles: ['src/index.ts'],
  safeCommands: ['ls', 'cat', 'grep', 'git', 'npm', 'bun', 'node'],
  dangerousCommands: ['rm', 'chmod', 'chown', 'sudo']
});

// Write a file
await fs.writeFile('example.txt', 'Hello, world!');

// Read a file
const content = await fs.getFile('example.txt'); // 'Hello, world!'

// Check if file exists
const exists = await fs.exists('example.txt');

// Execute a safe command
const result = await fs.executeCommand('ls -la');
```

### Directory Traversal and Glob

```typescript
// List directory contents
for await (const path of fs.getDirectoryTree('./src', {recursive: true})) {
  console.log(path);
}

// Find all TypeScript files
const tsFiles = await fs.glob('**/*.ts');
```

### Agent Integration

```typescript
// Add file to chat context
await fs.addFileToChat('src/main.ts', agent);

// Get memories from selected files
for await (const memory of fs.getMemories(agent)) {
  console.log(memory.content);
}
```

### Multi-Provider Support

```typescript
// Register multiple providers
fs.registerFileSystemProvider(localFSProvider);
fs.registerFileSystemProvider(virtualFSProvider);

// Switch between providers
fs.setActiveFileSystemProviderName('virtual');
```

### Scripting Integration

```typescript
// Use filesystem functions in scripting
const files = globFiles('src/**/*.ts');
const results = searchFiles('TODO');
createFile('new.js', 'console.log("Hi");');
```

## Configuration Options

### Constructor

```typescript
const fs = new FileSystemService({
  defaultSelectedFiles: ['src/index.ts', 'README.md'], // Default files for chat
  dangerousCommands: [/^rm\\b/, /^chmod\\b/, /^chown\\b/, /^sudo\\b/], // Dangerous commands
  safeCommands: ['ls', 'cat', 'grep', 'git', 'npm', 'bun', 'node'] // Safe commands
});
```

### Provider Configuration

- Register multiple providers via `registerFileSystemProvider()`
- Set active provider via `setActiveFileSystemProviderName()`
- Providers can be switched dynamically

### Ignore Filters

- Automatically loads `.gitignore` and `.aiignore` files
- Custom ignore patterns can be configured
- Filters apply to directory traversal, glob, and other operations

### Permissions

- Octal permission strings (e.g., '644')
- Default permissions: 0o644 for new files
- Permissions can be adjusted via `file/write` tool

### Search

- Case-sensitive by default
- Limits: 50 results for content/matches modes
- Supports substring, whole-word, and regex matching
- OR-based searches across multiple patterns

### Shell Commands

- `timeoutSeconds`: Default 60, maximum 90 seconds
- `workingDirectory`: Relative to filesystem root
- Safety validation: `safe`, `unknown`, or `dangerous` commands
- User confirmation required for dangerous commands

### Scripting

- Automatically registers global functions when `@tokenring-ai/scripting` is available
- Functions: `createFile`, `deleteFile`, `globFiles`, `searchFiles`

## API Reference

### FileSystemService Methods

```typescript
interface FileSystemService {
  registerFileSystemProvider(provider: FileSystemProvider): void;
  getActiveFileSystemProviderName(): string | null;
  setActiveFileSystemProviderName(name: string): void;
  getAvailableFileSystemProviders(): string[];
  writeFile(path: string, content: string | Buffer): Promise<boolean>;
  readFile(path: string, encoding?: BufferEncoding | 'buffer'): Promise<string>;
  getFile(path: string): Promise<string | null>;
  deleteFile(path: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<boolean>;
  copy(source: string, dest: string, options?: {overwrite?: boolean}): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<StatLike>;
  createDirectory(path: string, options?: {recursive?: boolean}): Promise<boolean>;
  glob(pattern: string, options?: GlobOptions): Promise<string[]>;
  grep(searchString: string | string[], options?: GrepOptions): Promise<GrepResult[]>;
  executeCommand(command: string | string[], options?: ExecuteCommandOptions): Promise<ExecuteCommandResult>;
  watch(dir: string, options?: WatchOptions): Promise<any>;
  addFileToChat(file: string, agent: Agent): Promise<void>;
  getMemories(agent: Agent): AsyncGenerator<Memory>;
  getFilesInChat(agent: Agent): Set<string>;
  setFilesInChat(files: Iterable<string>, agent: Agent): Promise<void>;
  askForFileSelection(options: {initialSelection?, allowDirectories?}, agent: Agent): Promise<string[] | null>;
  setDirty(dirty: boolean): void;
  getDirty(): boolean;
  getCommandSafetyLevel(command: string): 'safe' | 'unknown' | 'dangerous';
  parseCompoundCommand(command: string): string[];
}
```

### Tool Schemas

#### file/write

```typescript
const fileWriteSchema = z.object({
  path: z.string().describe("Relative path of the file to write"),
  action: z.enum(['write', 'append', 'delete', 'rename', 'adjust']),
  content: z.string().optional().describe("Content to write (required for write/append)"),
  is_base64: z.boolean().optional().describe("Whether content is base64 encoded"),
  fail_if_exists: z.boolean().optional().describe("Fail if file exists"),
  permissions: z.string().optional().describe("Octal permissions (e.g., '644')"),
  toPath: z.string().optional().describe("Destination path for rename/copy"),
  check_exists: z.boolean().optional().describe("Check file existence before operation")
});
```

#### file_search

```typescript
const fileSearchSchema = z.object({
  files: z.array(z.string()).optional().describe("File paths or glob patterns"),
  searches: z.array(z.string()).optional().describe("Search patterns"),
  returnType: z.enum(['names', 'content', 'matches']).default('content'),
  linesBefore: z.number().int().min(0).optional(),
  linesAfter: z.number().int().min(0).optional(),
  caseSensitive: z.boolean().default(true),
  matchType: z.enum(['substring', 'whole-word', 'regex']).default('substring')
});
```

#### terminal_bash

```typescript
const terminalRunShellCommandSchema = z.object({
  command: z.string().describe("Shell command to execute"),
  timeoutSeconds: z.number().int().optional().describe("Timeout in seconds"),
  workingDirectory: z.string().optional().describe("Working directory")
});
```

### Interfaces

```typescript
interface StatLike {
  path: string;
  absolutePath?: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink?: boolean;
  size?: number;
  created?: Date;
  modified?: Date;
  accessed?: Date;
}

interface GrepResult {
  file: string;
  line: number;
  match: string;
  matchedString?: string;
  content: string | null;
}

interface ExecuteCommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

interface FileSearchResult {
  files: FileInfo[];
  matches: MatchInfo[];
  summary: SearchSummary;
}

interface FileInfo {
  file: string;
  exists: boolean;
  content?: string;
  error?: string;
}

interface MatchInfo {
  file: string;
  line: number;
  match: string;
  matchedPattern: string;
  content?: string;
}

interface SearchSummary {
  totalFiles: number;
  totalMatches: number;
  searchPatterns?: string[];
  returnType: ReturnType;
  limitExceeded: boolean;
}
```

## Dependencies

- `@tokenring-ai/agent`: Core agent integration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat and command types
- `@tokenring-ai/scripting`: Scripting integration
- `@tokenring-ai/web-host`: JSON-RPC endpoints
- `@tokenring-ai/utility`: Registry utilities
- `zod`: Schema validation
- `ignore@^7.0.5`: Gitignore parsing
- `path-browserify@^1.0.1`: Path utilities

## Contributing

### Testing

```bash
# Run unit tests
bun run test

# Run integration tests
bun run test:integration

# Run shell command tests
bun run test:shell

# Run all tests
bun run test:all
```

### Key Implementation Notes

- **Safety**: Shell commands are not sandboxed - use with caution
- **Binary Files**: Skipped in searches and content retrieval
- **Performance**: Search limits prevent excessive results
- **Path Handling**: Unix-style '/' separators, relative to root
- **State Management**: File selection persists across agent sessions
- **Multi-Provider**: Supports switching between different filesystem implementations
- **Context Injection**: Selected files and search results provide relevant context to agents