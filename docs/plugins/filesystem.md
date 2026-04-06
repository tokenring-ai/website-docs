# @tokenring-ai/filesystem

## Overview

`@tokenring-ai/filesystem` provides a unified filesystem abstraction service for Token Ring AI agents. It enables secure file operations including reading, writing, searching, and directory management through a provider-based architecture that supports multiple filesystem implementations.

The package integrates deeply with the agent system, providing both tools for AI-driven operations and chat commands for user interface control. It features state management for tracking selected files in chat sessions, comprehensive RPC endpoints for remote filesystem access, and scripting functions for common file operations.

## Key Features

- **Provider-based architecture**: Support for multiple filesystem implementations (local, virtual, remote)
- **Agent state management**: Tracks selected files, read history, working directory, and filesystem modifications
- **Chat integration**: Context handlers for file contents and intelligent file search
- **Tool suite**: file_modify, file_read, file_write, and file_search tools for AI operations
- **Chat commands**: /file command for managing files in chat sessions
- **RPC endpoints**: Full filesystem access via JSON-RPC
- **Scripting functions**: createFile, deleteFile, globFiles, searchFiles for programmatic access
- **Security controls**: Read-before-write policy, file size limits, ignore filtering, and file validation
- **Grep functionality**: Content search with snippet extraction and context lines
- **Glob support**: Pattern-based file matching and directory traversal
- **File validators**: Extension-based validation system for file contents after writing
- **Ignore filter system**: Automatic exclusion based on .gitignore and .aiignore patterns
- **Hooks integration**: Automatic cleanup of read files on chat compaction
- **Intelligent file search**: Keyword extraction, fuzzy matching, and content-based search

## Core Components

### FileSystemService

The main service class implementing `TokenRingService`. It manages filesystem providers, agent state, and delegates operations to active providers.

**File:** `pkg/filesystem/FileSystemService.ts`

**Exports:** `import FileSystemService from "@tokenring-ai/filesystem/FileSystemService"`

**Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `registerFileSystemProvider` | `name: string, provider: FileSystemProvider` | Registers a filesystem provider |
| `requireFileSystemProviderByName` | `name: string` | Retrieves a registered provider |
| `setActiveFileSystem` | `providerName: string, agent: Agent` | Sets the active provider for an agent |
| `requireActiveFileSystem` | `agent: Agent` | Gets the active provider for an agent |
| `registerFileValidator` | `extension: string, validator: FileValidator` | Registers a validator for file extension |
| `getFileValidatorForExtension` | `extension: string` | Gets validator for file extension |
| `getDirectoryTree` | `path: string, options, agent` | Async generator for directory traversal |
| `writeFile` | `path: string, content, agent` | Write or overwrite file |
| `appendFile` | `filePath: string, content, agent` | Append to file |
| `deleteFile` | `path: string, agent` | Delete file |
| `rename` | `oldPath: string, newPath: string, agent` | Rename file |
| `readTextFile` | `path: string, agent` | Read file as UTF-8 string |
| `readFile` | `path: string, agent` | Read file as buffer |
| `exists` | `path: string, agent` | Check if file exists |
| `stat` | `path: string, agent` | Get file statistics |
| `createDirectory` | `path: string, options, agent` | Create directory recursively |
| `copy` | `source: string, destination: string, options, agent` | Copy file or directory |
| `glob` | `pattern: string, options, agent` | Match files with glob pattern |
| `watch` | `dir: string, options, agent` | Watch for filesystem changes |
| `grep` | `searchString: string \| string[], options, agent` | Search for text patterns |
| `addFileToChat` | `file: string, agent` | Add file to chat context |
| `removeFileFromChat` | `file: string, agent` | Remove file from chat context |
| `getFilesInChat` | `agent: Agent` | Returns set of files in chat |
| `setFilesInChat` | `files: Iterable<string>, agent` | Sets files in chat context |
| `setDirty` | `dirty: boolean, agent` | Marks filesystem as modified |
| `isDirty` | `agent: Agent` | Checks if files have been modified |

**Service Lifecycle:**

```typescript
// Start the service (called automatically by app)
start(): void {
  this.defaultProvider = this.fileSystemProviderRegistry.requireItemByName(
    this.options.agentDefaults.provider
  );
}

// Attach to agent (called when agent is created)
attach(agent: Agent, creationContext: AgentCreationContext): void {
  const config = deepMerge(
    this.options.agentDefaults, 
    agent.getAgentConfigSlice('filesystem', FileSystemAgentConfigSchema)
  );
  agent.initializeState(FileSystemState, config);
  if (config.selectedFiles.length > 0) {
    creationContext.items.push(`Selected files: ${config.selectedFiles.join(', ')}`);
  }
}
```

### FileSystemProvider

Abstract interface for filesystem implementations. Implementations can provide virtual, remote, or local filesystem access.

**File:** `pkg/filesystem/FileSystemProvider.ts`

**Exports:** `import FileSystemProvider from "@tokenring-ai/filesystem/FileSystemProvider"`

**Interface:**

```typescript
interface StatLike {
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

interface GrepResult {
  file: string;
  line: number;
  match: string;
  matchedString?: string;
  content: string | null;
}

interface DirectoryTreeOptions {
  ignoreFilter: (path: string) => boolean;
  recursive?: boolean;
}

interface GlobOptions {
  ignoreFilter: (path: string) => boolean;
  absolute?: boolean;
  includeDirectories?: boolean;
}

interface WatchOptions {
  ignoreFilter: (path: string) => boolean;
  pollInterval?: number;
  stabilityThreshold?: number;
}

interface GrepOptions {
  ignoreFilter: (path: string) => boolean;
  includeContent?: { linesBefore?: number; linesAfter?: number };
  cwd?: string;
}

interface FileSystemProvider {
  // Directory walking
  getDirectoryTree(
    path: string,
    params?: DirectoryTreeOptions,
  ): AsyncGenerator<string>;

  // File operations
  writeFile(path: string, content: string | Buffer): Promise<boolean>;
  appendFile(filePath: string, finalContent: string | Buffer): Promise<boolean>;
  deleteFile(path: string): Promise<boolean>;
  readFile(path: string): Promise<Buffer|null>;
  rename(oldPath: string, newPath: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<StatLike>;
  createDirectory(
    path: string,
    options?: { recursive?: boolean },
  ): Promise<boolean>;
  copy(
    source: string,
    destination: string,
    options?: { overwrite?: boolean },
  ): Promise<boolean>;
  glob(pattern: string, options?: GlobOptions): Promise<string[]>;
  watch(dir: string, options?: WatchOptions): Promise<any>;
  grep(
    searchString: string | string[],
    options?: GrepOptions,
  ): Promise<GrepResult[]>;
}
```

### FileMatchResource

A resource class for matching files based on include/exclude patterns. Provides async generation of matched files using the FileSystemService.

**File:** `pkg/filesystem/FileMatchResource.ts`

**Exports:** `import FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource"`

**Interface:**

```typescript
interface MatchItem {
  path: string;
  include?: RegExp;
  exclude?: RegExp;
}

class FileMatchResource {
  constructor(items: MatchItem[])

  async* getMatchedFiles(agent: Agent): AsyncGenerator<string>
  async addFilesToSet(set: Set<string>, agent: Agent): Promise<void>
}
```

**Usage:**

```typescript
import FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource";

const resource = new FileMatchResource([
  { path: "src", include: /\.ts$/ },
  { path: "pkg", exclude: /node_modules/ }
]);

// Get matched files
for await (const file of resource.getMatchedFiles(agent)) {
  console.log(file);
}

// Add matched files to a set
const fileSet = new Set<string>();
await resource.addFilesToSet(fileSet, agent);
```

## Services

### FileSystemService

The `FileSystemService` class implements the `TokenRingService` interface and manages all filesystem operations.

**Registration:**

```typescript
app.addServices(new FileSystemService(config.filesystem));
```

**Integration with Agent System:**

The service integrates with the agent system through state management and configuration slicing:

```typescript
// Configuration slice for agent
agent.getAgentConfigSlice('filesystem', FileSystemAgentConfigSchema)

// State initialization
agent.initializeState(FileSystemState, config);

// State access
const state = agent.getState(FileSystemState);
state.selectedFiles;
state.readFiles;
state.dirty;
state.workingDirectory;
```

**Path Resolution:**

The service automatically resolves relative paths to absolute paths within the working directory:

```typescript
// All paths are resolved relative to the working directory
const content = await fileSystem.readTextFile('src/main.ts', agent);
// Resolves to: /project/root/src/main.ts
```

**Ignore Filter System:**

Automatic exclusion of files based on patterns:

- `.git` directory
- `*.lock` files
- `node_modules` directory
- All dotfiles (`.gitignore`, `.aiignore`, etc.)

Loaded from `.gitignore` and `.aiignore` files in the filesystem.

**Usage:**

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";

// Create instance
const fileSystemService = new FileSystemService(config);

// Register with app
app.addServices(fileSystemService);

// Use in agent operations
const filesystem = agent.requireServiceByType(FileSystemService);
const content = await filesystem.readTextFile('src/main.ts', agent);
await filesystem.writeFile('dist/main.js', content, agent);
```

## Providers

The filesystem package defines `FileSystemProvider` as an abstract interface for implementations. The package does not include a default provider - implementations must be registered separately.

### FileSystemProvider Interface

Implementations must provide all methods defined in the `FileSystemProvider` interface. Key considerations:

- **Path handling**: All paths are relative to the provider's root directory
- **Ignore filtering**: Use the `ignoreFilter` option to respect exclusion patterns
- **Error handling**: Return appropriate errors for missing files, permission issues, etc.
- **Directory traversal**: Implement `getDirectoryTree` as an async generator for memory efficiency

**Example Implementation Structure:**

```typescript
import FileSystemProvider from "@tokenring-ai/filesystem/FileSystemProvider";

class MyFileSystemProvider implements FileSystemProvider {
  async* getDirectoryTree(path, options) {
    // Yield file paths using ignoreFilter
    for (const file of listFiles(path)) {
      if (!options.ignoreFilter?.(file)) {
        yield file;
      }
    }
  }

  async writeFile(path, content) {
    // Write file with appropriate permissions
    return true;
  }

  // ... implement all other methods
}
```

## RPC Endpoints

The package registers RPC endpoints under `/rpc/filesystem` for remote filesystem access.

**File:** `pkg/filesystem/rpc/filesystem.ts`

**Schema:** `pkg/filesystem/rpc/schema.ts`

### Endpoints

| Method | Type | Description | Request Params | Response Params |
|--------|------|-------------|----------------|-----------------|
| `readTextFile` | Query | Read file content as text | `{ agentId, path }` | `{ content: string \| null }` |
| `exists` | Query | Check if a file exists | `{ agentId, path }` | `{ exists: boolean }` |
| `stat` | Query | Get file statistics | `{ agentId, path }` | `{ stats: string }` |
| `glob` | Query | Match files with glob pattern | `{ agentId, pattern }` | `{ files: string[] }` |
| `listDirectory` | Query | List directory contents | `{ agentId, path, showHidden?, recursive? }` | `{ files: string[] }` |
| `writeFile` | Mutation | Write a file | `{ agentId, path, content }` | `{ success: boolean }` |
| `appendFile` | Mutation | Append to a file | `{ agentId, path, content }` | `{ success: boolean }` |
| `deleteFile` | Mutation | Delete a file | `{ agentId, path }` | `{ success: boolean }` |
| `rename` | Mutation | Rename a file | `{ agentId, oldPath, newPath }` | `{ success: boolean }` |
| `createDirectory` | Mutation | Create a directory | `{ agentId, path, recursive? }` | `{ success: boolean }` |
| `copy` | Mutation | Copy a file or directory | `{ agentId, source, destination, overwrite? }` | `{ success: boolean }` |
| `addFileToChat` | Mutation | Add file to chat context | `{ agentId, file }` | `{ success: boolean }` |
| `removeFileFromChat` | Mutation | Remove file from chat context | `{ agentId, file }` | `{ success: boolean }` |
| `getSelectedFiles` | Query | Get currently selected files in chat | `{ agentId }` | `{ files: string[] }` |

### RPC Request Examples

```typescript
// Read file content
await rpcClient.request('/rpc/filesystem/readTextFile', {
  agentId: 'agent-123',
  path: 'src/main.ts'
});

// List directory
await rpcClient.request('/rpc/filesystem/listDirectory', {
  agentId: 'agent-123',
  path: 'src',
  recursive: true,
  showHidden: false
});

// Add file to chat
await rpcClient.request('/rpc/filesystem/addFileToChat', {
  agentId: 'agent-123',
  file: 'src/main.ts'
});
```

## Chat Commands

### /file

Manage files in the chat session with various actions to add, remove, list, or clear files.

**Location:** `pkg/filesystem/commands/file/`

**Usage:**

```
/file [action] [files...]
```

**Actions:**

| Action | File | Aliases | Description |
|--------|------|---------|-------------|
| `select` | `commands/file/select.ts` | - | Interactive file selector (tree-based selection) |
| `add [files...]` | `commands/file/add.ts` | - | Add specific files to chat (or interactive if no files) |
| `remove [files...]` | `commands/file/remove.ts` | `rm` | Remove specific files from chat |
| `list` | `commands/file/list.ts` | `ls` | List all files currently in chat |
| `clear` | `commands/file/clear.ts` | - | Remove all files from chat |
| `default` | `commands/file/default.ts` | - | Reset to default files from config |

**Examples:**

```bash
# Interactive file selection
/file select

# Add specific files
/file add src/main.ts

# Add all TypeScript files
/file add src/*.ts

# Add multiple files
/file add file1.txt file2.txt

# Remove a specific file
/file remove src/main.ts

# Remove using alias
/file rm old-file.js

# List current files
/file list

# List current files (alias)
/file ls

# Remove all files
/file clear

# Reset to config defaults
/file default
```

## Tools

Tools are exported from `tools.ts` and registered with `ChatService` during plugin installation.

Currently, four tools are actively exported: `file_modify`, `file_write`, `file_read`, and `file_search`. The `append` tool is defined but commented out in the exports.

### file_modify

Modifies an existing file by finding and replacing contiguous blocks of lines.

**File:** `pkg/filesystem/tools/modify.ts`

**Tool Definition:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import modify from "@tokenring-ai/filesystem/tools/modify";

const name = "file_modify";
const displayName = "Filesystem/file_modify";
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Relative path of the file to modify (required). Relative to the project root directory. |
| `findLines` | `string` | Up to 5 contiguous lines to match in the file (required). Each line must be complete, and all matched lines must be contiguous. |
| `replaceLines` | `string` | The complete lines that will replace the matched block (required). Provide an empty string to delete the matched lines. |

**Behavior:**

- Finds a contiguous block of complete lines in an existing file
- Replaces those lines with new lines
- Matches must be exact, complete lines, with the exact prior content of the line
- Partial-line matches are never allowed
- Supports fuzzy matching with similarity threshold (0.95) when exact match fails
- Automatically writes the updated file if content changes
- Returns diff if file existed before (up to `maxReturnedDiffSize` limit)
- Sets filesystem as dirty on success
- Marks file as read in state with modification time
- Runs file validator if configured (`validateWrittenFiles`)

**Matching Rules:**

- Ignores whitespace when matching lines
- Requires contiguous block of lines (no gaps)
- Maximum 5 lines for find operation
- Fuzzy matching uses Levenshtein similarity when exact match fails
- Minimum 15 characters required for fuzzy matching

**Error Cases:**

- Returns error if multiple exact matches found
- Returns error if fuzzy match is not unique enough
- Returns error if no match found
- Returns error if file cannot be read

**Agent State:**

- Sets `state.dirty = true`
- Updates `state.readFiles` Map with modification time

**Required Context Handlers:** `["selected-files"]`

**Example:**

```typescript
// Modify an existing file
const result = await modify({
  path: 'src/main.ts',
  findLines: 'const x = 1;\nconst y = 2;',
  replaceLines: 'const x = 10;\nconst y = 20;'
}, agent);

// Delete lines
const result = await modify({
  path: 'src/main.ts',
  findLines: '// Old comment\nconst old = true;',
  replaceLines: ''
}, agent);
```

### file_write

Writes a file to the filesystem.

**File:** `pkg/filesystem/tools/write.ts`

**Tool Definition:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import write from "@tokenring-ai/filesystem/tools/write";

const name = "file_write";
const displayName = "Filesystem/write";
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Relative path of the file to write (required). Paths are relative to the project root directory, and should not have a prefix (e.g. 'subdirectory/file.txt' or 'docs/file.md'). Directories are auto-created as needed. |
| `content` | `string` | Content to write to the file (required). ALWAYS include the ENTIRE file contents to avoid data loss. |

**Behavior:**

- Enforces read-before-write policy if configured (`requireReadBeforeWrite`)
- Creates parent directories automatically if needed
- Returns diff if file existed before (up to `maxReturnedDiffSize` limit)
- Sets filesystem as dirty on success
- Marks file as read in state with modification time
- Generates artifact output (diff for modifications, full content for new files)
- Runs file validator if configured (`validateWrittenFiles`)

**Error Cases:**

- Returns helpful message if file wasn't read before write and policy is enforced
- Includes original file contents in error message to expedite the workflow

**Agent State:**

- Sets `state.dirty = true`
- Adds file to `state.readFiles` Map with modification time

**Required Context Handlers:** `["selected-files"]`

**Example:**

```typescript
// Create a new file
const result = await write({
  path: 'src/main.ts',
  content: '// New file content'
}, agent);

// Modify an existing file
const result = await write({
  path: 'src/main.ts',
  content: '// Updated file content'
}, agent);
```

### file_read

Reads files from the filesystem by path or glob pattern.

**File:** `pkg/filesystem/tools/read.ts`

**Tool Definition:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import read from "@tokenring-ai/filesystem/tools/read";

const name = "file_read";
const displayName = "Filesystem/read";
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `files` | `string[]` | List of file paths or glob patterns (required). Examples: `'**/*.ts'`, `'path/to/file.txt'` |

**Behavior:**

- Resolves glob patterns to specific files
- Checks file existence for each path
- Reads file contents (up to `maxFileSize` limit)
- Marks read files in `FileSystemState` Map with modification time
- Returns file names only if too many files are matched
- Handles binary files gracefully (returns "[File is binary and cannot be displayed]")
- Handles directories by recursively reading contents
- Treats pattern resolution errors as informational

**Error Cases:**

- Returns "No files were found that matched the search criteria" if no files match
- Returns directory listing if more than `maxFileReadCount` files matched
- Returns "[File is too large to retrieve]" for files exceeding `maxFileSize`

**Agent State:**

- Adds matched file paths to `state.readFiles` Map with modification time

**Required Context Handlers:** `["selected-files"]`

**Example:**

```typescript
// Read specific file
const result = await read({
  files: ['src/main.ts']
}, agent);

// Get all TypeScript files
const result = await read({
  files: ['**/*.ts']
}, agent);

// Read multiple files
const result = await read({
  files: ['src/main.ts', 'src/utils.ts']
}, agent);
```

### file_search

Searches for text patterns within files.

**File:** `pkg/filesystem/tools/search.ts`

**Tool Definition:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import search from "@tokenring-ai/filesystem/tools/search";

const name = "file_search";
const displayName = "Filesystem/search";
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filePaths` | `string[]` | `["**/*"]` | List of file paths or glob patterns to search within |
| `searchTerms` | `string[]` | - | List of search terms to search for. Can be plain strings (fuzzy substring match) or regex (enclosed in `/`) |

**Behavior:**

- Supports substring, regex, and exact matching
- Returns grep-style snippets with context lines (`snippetLinesBefore` and `snippetLinesAfter`)
- Automatically decides whether to return full file contents, snippets, or file names based on match count
- Marks read files in state with modification time
- Searches are OR-based across multiple patterns (any match counts)

**Search Patterns:**

- Plain strings: Fuzzy substring matching (case-insensitive)
- Regex: Enclosed in `/` (e.g., `/class \w+Service/`)

**Output Format:**

- When matches are few: Returns grep-style snippets with line numbers (format: `BEGIN FILE GREP MATCHES: {file} (line: match)`)
- When snippet is too large: Returns full file contents (format: `BEGIN FILE ATTACHMENT: {file}`)
- When too many files match: Returns directory listing with file names

**Error Cases:**

- Returns "No files were found that matched the search criteria" if no files match
- Returns directory listing if more than `maxSnippetCount` files matched

**Agent State:**

- Adds matched file paths to `state.readFiles` Map with modification time

**Required Context Handlers:** `["selected-files"]`

**Examples:**

```typescript
// Search for a function across all files
const result = await search({
  filePaths: ['src/**/*.ts'],
  searchTerms: ['function execute']
}, agent);

// Regex search for pattern
const result = await search({
  filePaths: ['pkg/agent/**/*.ts'],
  searchTerms: ['/class \w+Service/']
}, agent);

// Search with specific files
const result = await search({
  filePaths: ['src/**/*.ts', 'pkg/**/*.ts'],
  searchTerms: ['TODO', 'FIXME']
}, agent);

// Search across all files (default)
const result = await search({
  searchTerms: ['import']
}, agent);
```

## Configuration

### FileSystemConfigSchema

The main configuration schema for the plugin.

**File:** `pkg/filesystem/schema.ts`

```typescript
const FileSystemConfigSchema = z.object({
  agentDefaults: z.object({
    provider: z.string(),
    workingDirectory: z.string(),
    selectedFiles: z.array(z.string()).default([]),
    fileWrite: z.object({
      requireReadBeforeWrite: z.boolean().default(true),
      maxReturnedDiffSize: z.number().default(1024),
      validateWrittenFiles: z.boolean().default(true),
    }).prefault({}),
    fileRead: z.object({
      maxFileReadCount: z.number().default(10),
      maxFileSize: z.number().default(128 * 1024), // 128KB default
    }).prefault({}),
    fileSearch: z.object({
      maxSnippetCount: z.number().default(10),
      maxSnippetSizePercent: z.number().default(0.3),
      snippetLinesBefore: z.number().default(5),
      snippetLinesAfter: z.number().default(5),
    }).prefault({}),
  }),
  providers: z.record(z.string(), z.any()),
}).strict();
```

### FileSystemAgentConfigSchema

The agent-specific configuration schema.

```typescript
const FileSystemAgentConfigSchema = z.object({
  provider: z.string().optional(),
  workingDirectory: z.string().optional(),
  selectedFiles: z.array(z.string()).optional(),
  fileWrite: z.object({
    requireReadBeforeWrite: z.boolean().optional(),
    maxReturnedDiffSize: z.number().optional(),
    validateWrittenFiles: z.boolean().optional(),
  }).optional(),
  fileRead: z.object({
    maxFileReadCount: z.number().optional(),
    maxFileSize: z.number().optional()
  }).optional(),
  fileSearch: z.object({
    maxSnippetCount: z.number().optional(),
    maxSnippetSizePercent: z.number().optional(),
    snippetLinesBefore: z.number().optional(),
    snippetLinesAfter: z.number().optional(),
  }).optional(),
}).strict().default({});
```

### Configuration Example

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {FileSystemConfigSchema} from "@tokenring-ai/filesystem/schema";

const config = {
  filesystem: {
    agentDefaults: {
      provider: "local",
      workingDirectory: "/path/to/project",
      selectedFiles: ["src/main.ts", "README.md"],
      fileWrite: {
        requireReadBeforeWrite: true,
        maxReturnedDiffSize: 2048,
        validateWrittenFiles: true,
      },
      fileRead: {
        maxFileReadCount: 20,
        maxFileSize: 256 * 1024, // 256KB
      },
      fileSearch: {
        maxSnippetCount: 50,
        maxSnippetSizePercent: 0.5,
        snippetLinesBefore: 3,
        snippetLinesAfter: 3,
      },
    },
    providers: {
      local: {
        root: "/path/to/project",
      }
    }
  }
};

app.addServices(new FileSystemService(config.filesystem));
```

## Integration

### Plugin Installation

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import packageJSON from "./package.json" with {type: "json"};
import FileSystemService from "./FileSystemService.ts";
import {FileSystemConfigSchema} from "./schema.ts";
import tools from "./tools.ts";
import contextHandlers from "./contextHandlers.ts";
import filesystemRPC from "./rpc/filesystem.ts";
import hooks from "./hooks.ts";
import agentCommands from "./commands.ts";
import {RpcService} from "@tokenring-ai/rpc";
import {ChatService} from "@tokenring-ai/chat";
import {AgentCommandService} from "@tokenring-ai/agent";
import {AgentLifecycleService} from "@tokenring-ai/lifecycle";
import {ScriptingService} from "@tokenring-ai/scripting";
import {ScriptingThis} from "@tokenring-ai/scripting/ScriptingService";

const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.filesystem) {
      // Register scripting functions
      app.waitForService(ScriptingService, (scriptingService: ScriptingService) => {
        scriptingService.registerFunction("createFile", {
          type: 'native',
          params: ['path', 'content'],
          async execute(this: ScriptingThis, path: string, content: string): Promise<string> {
            await this.agent.requireServiceByType(FileSystemService).writeFile(path, content, this.agent);
            return `Created file: ${path}`;
          }
        });

        scriptingService.registerFunction("deleteFile", {
          type: 'native',
          params: ['path'],
          async execute(this: ScriptingThis, path: string): Promise<string> {
            await this.agent.requireServiceByType(FileSystemService).deleteFile(path, this.agent);
            return `Deleted file: ${path}`;
          }
        });

        scriptingService.registerFunction("globFiles", {
          type: 'native',
          params: ['pattern'],
          async execute(this: ScriptingThis, pattern: string): Promise<string[]> {
            return await this.agent.requireServiceByType(FileSystemService).glob(pattern, {}, this.agent);
          }
        });

        scriptingService.registerFunction("searchFiles", {
          type: 'native',
          params: ['searchString'],
          async execute(this: ScriptingThis, searchString: string): Promise<string[]> {
            const results = await this.agent.requireServiceByType(FileSystemService).grep([searchString], {}, this.agent);
            return results.map(r => `${r.file}:${r.line}: ${r.match}`);
          }
        });
      });

      // Register tools and context handlers
      app.waitForService(ChatService, chatService => {
        chatService.addTools(tools);
        chatService.registerContextHandlers(contextHandlers);
      });

      // Register lifecycle hooks
      app.waitForService(AgentLifecycleService, lifecycleService =>
        lifecycleService.addHooks(hooks)
      );

      // Register chat commands
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(agentCommands)
      );

      // Add service
      app.addServices(new FileSystemService(config.filesystem));

      // Register RPC endpoints
      app.waitForService(RpcService, rpcService => {
        rpcService.registerEndpoint(filesystemRPC);
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Context Handlers

#### selected-files

Provides contents of selected files as chat context.

**File:** `pkg/filesystem/contextHandlers/selectedFiles.ts`

**Handler:** `getContextItems({agent}: ContextHandlerOptions): AsyncGenerator<ContextItem>`

**Behavior:**

- Yields file contents for files in `state.selectedFiles`
- For directories, yields directory listings
- Marks files as read in `state.readFiles`
- Output format:
  - Files: `BEGIN FILE ATTACHMENT: {path}\n{content}\nEND FILE ATTACHMENT: {path}`
  - Directories: `BEGIN DIRECTORY LISTING:\n{path}\n- {file}\n...\nEND DIRECTORY LISTING`

**Implementation:**

```typescript
export default async function* getContextItems({agent}: ContextHandlerOptions): AsyncGenerator<ContextItem> {
  const fileSystemService = agent.requireServiceByType(FileSystemService);

  const fileContents: string[] = [];
  const directoryContents: string[] = [];
  for (const filePath of agent.getState(FileSystemState).selectedFiles) {
    const fileModificationTime = await fileSystemService.getModifiedTimeNanos(filePath, agent);

    const content = await fileSystemService.readTextFile(filePath, agent);
    if (content) {
      fileContents.push(`BEGIN FILE ATTACHMENT: ${filePath}\n${content}\nEND FILE ATTACHMENT`);
      if (fileModificationTime === null) {
        agent.infoMessage(`[FileSystemService] Could not get the modification time for file ${filePath}: Cannot enforce read before write policy`);
      } else {
        agent.mutateState(FileSystemState, (state) => {
          state.readFiles.set(filePath, fileModificationTime);
        });
      }
    } else {
      try {
        const directoryListing = await fileSystemService.getDirectoryTree(filePath, {}, agent);
        const files = await Array.fromAsync(directoryListing);
        directoryContents.push(`BEGIN DIRECTORY LISTING:\n${filePath}\n${files.map(f => `- ${f}`).join("\n")}\nEND DIRECTORY LISTING`);
      } catch (error) {
        // The file does not exist, or is not a directory
      }
    }
  }

  if (fileContents.length > 0) {
    yield {
      role: "user",
      content: `// The user has attached the following files:\n\n${fileContents.join("\n\n")}`,
    }
  }

  if (directoryContents.length > 0) {
    yield {
      role: "user",
      content: `// The user has attached the following directory listing:\n\n${directoryContents.join("\n\n")}`,
    }
  }
}
```

#### search-files

Provides file search results based on user input keywords with intelligent keyword extraction and fuzzy matching.

**File:** `pkg/filesystem/contextHandlers/searchFiles.ts`

**Handler:** `getContextItems({input, attachments, chatConfig, sourceConfig, agent}: ContextHandlerOptions): AsyncGenerator<ContextItem>`

**Configuration Schema:**

```typescript
const FileSearchContextSchema = z.object({
  maxResults: z.number().default(25),
});
```

**Keyword Extraction:**

The context handler extracts meaningful keywords from user input using the following strategies:

- **Quoted phrases**: Exact matches (e.g., `"function name"`)
- **File paths**: Paths containing `/` or `\`
- **File names**: Names with extensions (e.g., `main.ts`)
- **Identifier splitting**: Splits CamelCase and snake_case identifiers
- **Stop word filtering**: Removes common words (a, the, and, etc.)
- **Deduplication**: Preserves order while removing duplicates

**Extension Detection:**

- Direct mentions (`.ts`, `.js`, etc.)
- Language patterns ("typescript files", "json files", etc.)

**Scoring Algorithm:**

- Filename exact match: 10 points
- Filename without extension match: 8 points
- Filename contains keyword: 5 * fuzzyScore
- Path contains keyword: 2 * fuzzyScore
- Depth penalty: 0.05 per level

**Search Strategies:**

1. **Path/Filename matching**: Uses glob pattern matching over all files
2. **Content search**: Uses grep for high-value keywords (length > 3, alphanumeric pattern)

**Output Format:**

```markdown
Found X file(s) matching keywords: keyword1, keyword2

## filepath (filename + content)

Matching lines:
  Line N: content line
  ...

## anotherfile (content)

  Line M: another match
```

**Implementation Highlights:**

```typescript
// Exported utilities for testing
export {
  extractKeywords,
  extractFileExtensions,
  fuzzyScore,
  scoreFilePath,
  searchFiles,
  aggregateGrepResults,
  formatResults,
};
```

### Hooks

#### clearReadFiles

Automatically clears the read files state when the chat context is compacted or cleared.

**File:** `pkg/filesystem/hooks/clearReadFiles.ts`

**Hook Subscription:**

```typescript
const name = "clearReadFiles";
const displayName = "Filesystem/Clear Read Files";
const description = "Automatically clears the read files state when the chat context is compacted or cleared";

const callbacks = [
  new HookCallback(AfterChatCompaction, clearReadFiles),
  new HookCallback(AfterChatClear, clearReadFiles),
];
```

**Behavior:**

- Clears `state.readFiles` when chat is compacted or cleared
- Resets `state.dirty` to false

### State Management

#### FileSystemState

Tracks filesystem-related state for agents.

**File:** `pkg/filesystem/state/fileSystemState.ts`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `selectedFiles` | `Set<string>` | Files in chat context |
| `providerName` | `string \| null` | Active provider name |
| `workingDirectory` | `string` | Working directory for path resolution |
| `dirty` | `boolean` | Whether files have been modified |
| `readFiles` | `Map<string, number>` | Files that have been read with modification times (path -> timestamp in ms) |
| `fileWrite` | `FileWriteConfig` | Write configuration |
| `fileRead` | `FileReadConfig` | Read configuration |
| `fileSearch` | `FileSearchConfig` | Search configuration |
| `initialConfig` | `object` | Initial selected files from config |

**State Methods:**

```typescript
state.reset()                    // Reset to initial config
state.serialize()                // Return serializable state
state.deserialize(data)          // Restore state from object
state.show()                     // Return human-readable summary
```

**State Display:**

```typescript
const state = agent.getState(FileSystemState);
console.log(state.show());
// Output:
// Provider: local
// Working Directory: /path/to/project
// Dirty: false
// Selected Files and Directories: 2
//   - src/main.ts
//   - README.md
```

**State Transfers:**

```typescript
// Child agent transfers state from parent on attach
agent.attach(childAgent);
// childAgent transfers selectedFiles from parent on initialization
```

### Ignore Filter System

Automatic exclusion of files based on patterns:

**Included Patterns:**

- `.git` directory
- `*.lock` files
- `node_modules` directory
- All dotfiles (`.gitignore`, `.aiignore`, etc.)

**Loaded from Files:**

- `.gitignore` - Git ignore patterns
- `.aiignore` - AI-specific ignore patterns

**Implementation:**

```typescript
import createIgnoreFilter from "@tokenring-ai/filesystem/util/createIgnoreFilter";

async function createIgnoreFilter(fileSystem: FileSystemProvider): Promise<(p: string) => boolean> {
  const ig = ignore();
  ig.add(".git"); // always ignore .git dir at root
  ig.add("*.lock");
  ig.add("node_modules");
  ig.add(".*");

  const gitIgnorePath = ".gitignore";
  if (await fileSystem.exists(gitIgnorePath)) {
    const data = await fileSystem.readFile(gitIgnorePath);
    if (data) {
      const lines = data.toString('utf-8').split(/\r?\n/).filter(Boolean);
      ig.add(lines);
    }
  }

  const aiIgnorePath = ".aiignore";
  if (await fileSystem.exists(aiIgnorePath)) {
    const data = await fileSystem.readFile(aiIgnorePath);
    if (data) {
      const lines = data.toString('utf-8').split(/\r?\n/).filter(Boolean);
      ig.add(lines);
    }
  }

  return ig.ignores.bind(ig);
}
```

**Usage in Operations:**

```typescript
// In getDirectoryTree
options.ignoreFilter ??= await createIgnoreFilter(activeFileSystem);
for await (const path of fs.getDirectoryTree(path, options, agent)) {
  if (options.ignoreFilter?.(path)) continue;
  // process path
}

// In glob
options.ignoreFilter ??= await createIgnoreFilter(activeFileSystem);
const files = await fs.glob(pattern, options, agent);
```

### FileValidator Interface

The `FileValidator` type defines the interface for file validation functions:

```typescript
export type FileValidator = (path: string, content: string) => Promise<string | null>;
```

Validators receive the file path and content, and return:
- `null` for successful validation
- An error message string for validation failures

Validators are registered with the `FileSystemService`:

**Registration:**

```typescript
const fileSystemService = app.requireService(FileSystemService);

fileSystemService.registerFileValidator('.ts', async (path: string, content: string) => {
  // Validate TypeScript file
  const result = await runTypeScriptValidator(content);
  return result ? `TypeScript validation failed: ${result}` : null;
});
```

**Usage:**

- Validators are automatically run after file writes if `validateWrittenFiles` is enabled
- Validators receive the file path and content
- Return `null` for success, or an error message string for failure
- Error messages are appended to the tool result

## Scripting Functions

The package registers scripting functions for common file operations:

**Location:** `pkg/filesystem/plugin.ts`

### Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `createFile` | `path`, `content` | Create a file with content |
| `deleteFile` | `path` | Delete a file |
| `globFiles` | `pattern` | Match files with glob pattern |
| `searchFiles` | `searchString` | Search for text patterns in files |

**Example:**

```typescript
// Create a file
await scriptingService.executeFunction("createFile", ["src/main.ts", "// content"]);

// Delete a file
await scriptingService.executeFunction("deleteFile", ["src/old.ts"]);

// Find all TypeScript files
const files = await scriptingService.executeFunction("globFiles", ["**/*.ts"]);

// Search for a pattern
const results = await scriptingService.executeFunction("searchFiles", ["function execute"]);
```

## Usage Examples

### Basic File Operations

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";

// Read a file
const content = await fileSystem.readTextFile('src/main.ts', agent);

// Write a file
await fileSystem.writeFile('dist/main.js', 'console.log("Hello");', agent);

// Search for files
const files = await fileSystem.glob('**/*.ts', {}, agent);

// List directory
for await (const file of fileSystem.getDirectoryTree('src', {}, agent)) {
  console.log(file);
}

// Check if file exists
if (await fileSystem.exists('src/main.ts', agent)) {
  console.log('File exists');
}
```

### File Search with Grep

```typescript
// Search for patterns in files
const results = await fileSystem.grep(['TODO', 'FIXME'], {
  includeContent: { linesBefore: 2, linesAfter: 2 }
}, agent);

for (const result of results) {
  console.log(`${result.file}:${result.line}: ${result.match}`);
}
```

### FileMatchResource Usage

```typescript
import FileMatchResource from "@tokenring-ai/filesystem/FileMatchResource";

// Create a resource for TypeScript files in src
const tsResource = new FileMatchResource([
  { path: "src", include: /\.ts$/ }
]);

// Get all matched files
for await (const file of tsResource.getMatchedFiles(agent)) {
  console.log(file);
}

// Add matched files to a set
const fileSet = new Set<string>();
await tsResource.addFilesToSet(fileSet, agent);
```

## Best Practices

### File Operations

1. **Always use relative paths** - All paths should be relative to the filesystem root
2. **Check file existence** - Use `exists()` before operations that require files
3. **Handle binary files** - The package automatically detects and handles binary files
4. **Respect limits** - Respect `maxFileReadCount`, `maxFileSize`, and other configured limits
5. **Read before write** - Enable `requireReadBeforeWrite` for safety in production
6. **Use file validators** - Register validators for critical file types to catch errors early

### Chat Integration

1. **Use selected files** - Add relevant files to chat context for AI operations
2. **Clear old files** - Remove unused files to keep context focused
3. **Use glob patterns** - Use glob patterns to add multiple files efficiently
4. **Monitor state** - Check `isDirty()` to track filesystem modifications

### Security Considerations

1. **Ignore filtering** - Always use ignore filters to prevent access to sensitive files
2. **Path validation** - Validate all paths to prevent directory traversal attacks
3. **Size limits** - Configure appropriate size limits for file operations
4. **Access controls** - Consider implementing provider-specific access controls

### Performance

1. **Use async generators** - For directory traversal, use async generators to avoid loading all files into memory
2. **Grep optimization** - Use specific file patterns in `file_search` tool to limit search scope
3. **Caching** - Consider caching filesystem operations for repeated access
4. **Streaming** - Use streaming for large file operations when possible

## Testing

### Unit Testing

```typescript
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import FileSystemProvider from "@tokenring-ai/filesystem/FileSystemProvider";
import {FileSystemConfigSchema} from "@tokenring-ai/filesystem/schema";

// Mock provider implementation
class MockFileSystemProvider implements FileSystemProvider {
  private files = new Map<string, string>();

  async* getDirectoryTree(path, options) {
    yield* Array.from(this.files.keys()).filter(f => f.startsWith(path));
  }

  async writeFile(path, content) {
    this.files.set(path, content);
    return true;
  }

  async readFile(path) {
    return this.files.get(path) ?? null;
  }

  async exists(path) {
    return this.files.has(path);
  }

  async stat(path) {
    if (!this.files.has(path)) {
      return {path, exists: false};
    }
    return {path, exists: true, isFile: true, isDirectory: false};
  }

  // ... implement other methods
}

describe('FileSystemService', () => {
  let service: FileSystemService;
  let agent: any;

  beforeEach(() => {
    service = new FileSystemService({
      agentDefaults: {
        provider: 'mock',
        workingDirectory: '/mock',
        selectedFiles: [],
        fileWrite: { requireReadBeforeWrite: false, validateWrittenFiles: false },
        fileRead: { maxFileReadCount: 100, maxFileSize: 1024 * 1024 },
        fileSearch: { maxSnippetCount: 100 }
      },
      providers: {
        mock: new MockFileSystemProvider()
      }
    });

    agent = {
      getState: () => ({
        providerName: 'mock',
        workingDirectory: '/mock',
        selectedFiles: new Set(),
        dirty: false,
        readFiles: new Set(),
        fileWrite: { requireReadBeforeWrite: false, validateWrittenFiles: false },
        fileRead: { maxFileReadCount: 100, maxFileSize: 1024 * 1024 },
        fileSearch: { maxSnippetCount: 100 }
      }),
      mutateState: (stateClass, mutator) => {
        // Simplified mutation for testing
      }
    };
  });

  it('should write and read files', async () => {
    await service.writeFile('test.txt', 'Hello World', agent);
    const content = await service.readTextFile('test.txt', agent);
    expect(content).toBe('Hello World');
  });

  it('should glob files', async () => {
    await service.writeFile('src/a.ts', '', agent);
    await service.writeFile('src/b.ts', '', agent);
    await service.writeFile('lib/c.js', '', agent);

    const files = await service.glob('src/**/*.ts', {}, agent);
    expect(files).toEqual(['src/a.ts', 'src/b.ts']);
  });
});
```

### Integration Testing

```typescript
import {describe, it, expect} from "vitest";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import FileSystemProvider from "@tokenring-ai/filesystem/FileSystemProvider";

describe('FileSystemService Integration', () => {
  it('should handle complex file operations', async () => {
    // Setup
    const service = new FileSystemService({
      agentDefaults: {
        provider: 'local',
        workingDirectory: '/tmp/test-filesystem',
        selectedFiles: [],
        fileWrite: { requireReadBeforeWrite: false, validateWrittenFiles: false },
        fileRead: { maxFileReadCount: 100, maxFileSize: 1024 * 1024 },
        fileSearch: { maxSnippetCount: 100 }
      },
      providers: {
        local: {
          root: '/tmp/test-filesystem'
        }
      }
    });

    const agent = {
      getState: () => ({
        providerName: 'local',
        workingDirectory: '/tmp/test-filesystem',
        selectedFiles: new Set(),
        dirty: false,
        readFiles: new Set(),
        fileWrite: { requireReadBeforeWrite: false, validateWrittenFiles: false },
        fileRead: { maxFileReadCount: 100, maxFileSize: 1024 * 1024 },
        fileSearch: { maxSnippetCount: 100 }
      }),
      mutateState: (stateClass, mutator) => {}
    };

    // Write files
    await service.writeFile('test.txt', 'Hello World', agent);
    await service.createDirectory('src', {recursive: true}, agent);
    await service.writeFile('src/app.ts', 'console.log("app");', agent);

    // Read files
    const content = await service.readTextFile('test.txt', agent);
    expect(content).toBe('Hello World');

    // Grep search
    const results = await service.grep(['app'], {}, agent);
    expect(results.length).toBeGreaterThan(0);

    // Cleanup
    await service.deleteFile('test.txt', agent);
    await service.deleteFile('src/app.ts', agent);
  });
});
```

## Dependencies

**Production Dependencies:**

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/agent` | 0.2.0 | Agent framework |
| `@tokenring-ai/app` | 0.2.0 | Application framework |
| `@tokenring-ai/chat` | 0.2.0 | Chat service |
| `@tokenring-ai/ai-client` | 0.2.0 | AI client registry |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions |
| `@tokenring-ai/lifecycle` | 0.2.0 | Lifecycle service |
| `@tokenring-ai/scripting` | 0.2.0 | Scripting service |
| `@tokenring-ai/rpc` | 0.2.0 | RPC service |
| `zod` | ^4.3.6 | Schema validation |
| `ignore` | ^7.0.5 | Git ignore pattern matching |
| `path-browserify` | ^1.0.1 | Path manipulation for browser |
| `diff` | ^8.0.4 | Diff generation for file operations |
| `mime-types` | ^3.0.2 | MIME type detection |

**Development Dependencies:**

| Package | Version | Description |
|---------|---------|-------------|
| `@vitest/coverage-v8` | ^4.1.1 | Coverage tool |
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

## Related Components

### Core Package

- `@tokenring-ai/agent` - Agent framework and orchestration
- `@tokenring-ai/app` - Application framework and plugin system
- `@tokenring-ai/chat` - Chat service and tool integration
- `@tokenring-ai/scripting` - Scripting service and function registration
- `@tokenring-ai/rpc` - RPC service and endpoint registration
- `@tokenring-ai/lifecycle` - Lifecycle service and hooks

### Related Plugins

- `@tokenring-ai/cli` - Command-line interface for agent interaction
- `@tokenring-ai/scheduler` - Automated scheduling service
- `@tokenring-ai/image-generation` - AI-powered image generation

### Integration Patterns

- **State Management** - Use `FileSystemState` for tracking file operations
- **Context Handlers** - Register `selected-files` and `search-files` handlers
- **Chat Commands** - Use `/file` command for manual file management
- **Tools** - Register `file_modify`, `file_read`, `file_write`, and `file_search` tools
- **RPC Endpoints** - Expose filesystem operations via JSON-RPC
- **Scripting** - Register `createFile`, `deleteFile`, `globFiles`, `searchFiles` functions
- **Hooks** - Register `clearReadFiles` hook for automatic cleanup

## Package Structure

```
pkg/filesystem/
├── index.ts                         # Main exports
├── package.json                     # Package configuration
├── plugin.ts                        # Plugin registration
├── schema.ts                        # Zod configuration schemas
├── FileSystemService.ts             # Core service implementation
├── FileSystemProvider.ts            # Provider interface definitions
├── FileMatchResource.ts             # File matching resource class
├── FileValidator.ts                 # File validator interface
├── tools.ts                         # Tool exports
├── tools/
│   ├── modify.ts                    # file_modify tool
│   ├── modify.test.ts               # Tests for modify tool
│   ├── write.ts                     # file_write tool
│   ├── read.ts                      # file_read tool
│   └── search.ts                    # file_search tool
├── commands.ts                      # Command exports
├── commands/
│   └── file/
│       ├── select.ts                # /file select
│       ├── add.ts                   # /file add
│       ├── remove.ts                # /file remove
│       ├── list.ts                  # /file list
│       ├── clear.ts                 # /file clear
│       └── default.ts               # /file default
├── contextHandlers.ts               # Context handler exports
├── contextHandlers/
│   ├── selectedFiles.ts             # selected-files context handler
│   └── searchFiles.ts               # search-files context handler
├── state/
│   └── fileSystemState.ts           # State management
├── util/
│   ├── createIgnoreFilter.ts        # Ignore filter creation
│   ├── runFileValidator.ts          # File validator runner
│   ├── createFileWriteResult.ts     # File write result creation
│   └── findContiguousLineMatch.ts   # Line matching utility
│   ├── findContiguousLineMatch.test.ts  # Tests for line matching
│   └── hooks/
│       └── autoCommit.ts            # Auto-commit hook utility
├── rpc/
│   ├── filesystem.ts                # RPC endpoint definitions
│   └── schema.ts                    # RPC schema definitions
├── hooks.ts                         # Hook exports
├── hooks/
│   └── clearReadFiles.ts            # clearReadFiles hook
├── vitest.config.ts                 # Test configuration
└── README.md                        # Package README
```

## Testing

The package uses `vitest` for testing. Test files follow the `*.test.ts` naming convention.

**Available Test Files:**
- `tools/modify.test.ts` - Tests for the modify tool
- `util/findContiguousLineMatch.test.ts` - Tests for line matching utility

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run integration tests
bun test:integration

# Run e2e tests
bun test:e2e

# Run all tests including integration
bun test:all

# Build (type check)
bun build
```

## License

MIT License - see `LICENSE` file for details.
