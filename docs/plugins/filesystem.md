# @tokenring-ai/filesystem

## Overview

`@tokenring-ai/filesystem` provides a unified filesystem abstraction service for Token Ring AI agents. It enables secure file operations including reading, writing, searching, and directory management through a provider-based architecture that supports multiple filesystem implementations.

The package integrates deeply with the agent system, providing both tools for AI-driven operations and chat commands for user interface control. It features state management for tracking selected files in chat sessions, comprehensive RPC endpoints for remote filesystem access, and scripting functions for common file operations.

## Key Features

- **Provider-based architecture**: Support for multiple filesystem implementations (local, virtual, remote)
- **Agent state management**: Tracks selected files, read history, and filesystem modifications
- **Chat integration**: Context handlers for file contents and intelligent file search
- **Tool suite**: file_read, file_write, and file_search tools for AI operations
- **Chat commands**: /file command for managing files in chat sessions
- **RPC endpoints**: Full filesystem access via JSON-RPC
- **Scripting functions**: createFile, deleteFile, globFiles, searchFiles for programmatic access
- **Security controls**: Read-before-write policy, file size limits, ignore filtering, and file validation
- **Grep functionality**: Content search with snippet extraction and context lines
- **Glob support**: Pattern-based file matching and directory traversal
- **File validators**: Extension-based validation system for file contents after writing

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

A resource class for matching files based on include/exclude patterns. Provides async generation of matched files.

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

The filesystem package defines `FileSystemProvider` as an abstract interface for implementations. The package includes the default provider which operates on the local filesystem.

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

**File:** `pkg/filesystem/commands/file.ts`

**Usage:**

```
/file [action] [files...]
```

**Actions:**

| Action | Description |
|--------|-------------|
| `select` | Interactive file selector (tree-based selection) |
| `add [files...]` | Add specific files to chat (or interactive if no files) |
| `remove [files...]` or `rm [files...]` | Remove specific files from chat |
| `list` or `ls` | List all files currently in chat |
| `clear` | Remove all files from chat |
| `default` | Reset to default files from config |

**Examples:**

```
/file select                    # Interactive file selection
/file add src/main.ts           # Add a specific file
/file add src/*.ts              # Add all TypeScript files
/file add file1.txt file2.txt   # Add multiple files
/file remove src/main.ts        # Remove a specific file
/file rm old-file.js            # Remove using alias
/file list                      # Show current files
/file ls                        # Show current files (alias)
/file clear                     # Remove all files
/file default                   # Reset to config defaults
```

## Tools

Tools are exported from `tools.ts` and registered with `ChatService` during plugin installation.

**Note:** Currently, only `write`, `read`, and `search` tools are actively exported. The `append` and `patch` tools are defined but commented out in the exports.

### file_write

Writes a file to the filesystem.

**File:** `pkg/filesystem/tools/write.ts`

**Basic Setup:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import write from "@tokenring-ai/filesystem/tools/write";

const name = "file_write";
const displayName = "Filesystem/write";
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Relative path of the file to write (required) |
| `content` | `string` | Content to write to the file (required) |

**Behavior:**

- Enforces read-before-write policy if configured
- Creates parent directories automatically if needed
- Returns diff if file existed before (up to `maxReturnedDiffSize` limit)
- Sets filesystem as dirty on success
- Marks file as read in state
- Generates artifact output (diff or full content)
- Runs file validator if configured (`validateWrittenFiles`)

**Error Cases:**

- Returns helpful message if file wasn't read before write and policy is enforced
- Includes original file contents in error message to expedite the workflow

**Agent State:**

- Sets `state.dirty = true`
- Adds file to `state.readFiles`

**Example:**

```typescript
const result = await write({
  path: 'src/main.ts',
  content: '// New file content'
}, agent);
```

### file_read

Reads files from the filesystem by path or glob pattern.

**File:** `pkg/filesystem/tools/read.ts`

**Basic Setup:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import read from "@tokenring-ai/filesystem/tools/read";

const name = "file_read";
const displayName = "Filesystem/read";
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `files` | `string[]` | List of file paths or glob patterns (required) |

**Behavior:**

- Resolves glob patterns to specific files
- Checks file existence for each path
- Reads file contents (up to `maxFileSize` limit)
- Marks read files in `FileSystemState`
- Returns file names only if too many files are matched
- Handles binary files gracefully (returns "[File is binary and cannot be displayed]")
- Handles directories by recursively reading contents
- Treats pattern resolution errors as informational

**Error Cases:**

- Returns "No files were found that matched the search criteria" if no files match
- Returns directory listing if more than `maxFileReadCount` files matched
- Returns "[File is too large to retrieve]" for files exceeding `maxFileSize`

**Agent State:**

- Adds matched file paths to `state.readFiles`

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
```

### file_search

Searches for text patterns within files.

**File:** `pkg/filesystem/tools/search.ts`

**Basic Setup:**

```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import search from "@tokenring-ai/filesystem/tools/search";

const name = "file_search";
const displayName = "Filesystem/search";
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filePaths` | `string[]` | `["**/*"]` | List of file paths or glob patterns to search within |
| `searchTerms` | `string[]` | - | List of search terms to search for |

**Behavior:**

- Supports substring, regex, and exact matching
- Returns grep-style snippets with context lines (`snippetLinesBefore` and `snippetLinesAfter`)
- Automatically decides whether to return full file contents, snippets, or file names based on match count
- Marks read files in state
- Supports fuzzy matching and keyword extraction

**Search Patterns:**

- Plain strings: Fuzzy substring matching (case-insensitive)
- Regex: Enclosed in `/` (e.g., `/class \w+Service/`)

**Output Format:**

- When matches are few: Returns grep-style snippets with line numbers
- When snippet is too large: Returns full file contents
- When too many files match: Returns directory listing with file names

**Error Cases:**

- Returns "No files were found that matched the search criteria" if no files match
- Returns directory listing if more than `maxSnippetCount` files matched

**Agent State:**

- Adds matched file paths to `state.readFiles`

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
```

## Configuration

### FileSystemConfigSchema

The main configuration schema for the plugin.

**File:** `pkg/filesystem/schema.ts`

```typescript
const FileSystemConfigSchema = z.object({
  agentDefaults: z.object({
    provider: z.string(),
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
import {RpcService} from "@tokenring-ai/rpc";
import {ChatService} from "@tokenring-ai/chat";
import {AgentCommandService} from "@tokenring-ai/agent";
import {ScriptingService} from "@tokenring-ai/scripting";

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

      // Register chat commands
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands([file])
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

**Behavior:**

- Yields file contents for files in `state.selectedFiles`
- For directories, yields directory listings
- Marks files as read in `state.readFiles`
- Outputs format:
  - Files: `BEGIN FILE ATTACHMENT: {path}\n{content}\nEND FILE ATTACHMENT: {path}`
  - Directories: `BEGIN DIRECTORY LISTING:\n{path}\n- {file}\n...\nEND DIRECTORY LISTING`

#### search-files

Provides file search results based on user input keywords.

**File:** `pkg/filesystem/contextHandlers/searchFiles.ts`

**Behavior:**

- Extracts keywords from user input (quoted phrases, file paths, identifiers)
- Extracts file extensions (direct mentions and language patterns)
- Scores files based on filename/path matching and content search
- Uses glob pattern matching and grep search strategies
- Returns formatted results with line matches

**Keyword Extraction:**

- Extracts quoted phrases (exact matches)
- Extracts file paths (containing / or \)
- Extracts file names with extensions
- Splits CamelCase and snake_case identifiers
- Removes stop words
- Deduplicates while preserving order

**Scoring Algorithm:**

- Filename match: 10 points
- Filename without extension match: 8 points
- Filename contains keyword: 5 * fuzzyScore
- Path contains keyword: 2 * fuzzyScore
- Penalties for deeply nested files: 0.05 per level

**Search Strategies:**

1. **Path/Filename matching**: Uses glob pattern matching over all files
2. **Content search**: Uses grep for high-value keywords (length > 3, alphanumeric pattern)

### State Management

#### FileSystemState

Tracks filesystem-related state for agents.

**File:** `pkg/filesystem/state/fileSystemState.ts`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `selectedFiles` | `Set<string>` | Files in chat context |
| `providerName` | `string \| null` | Active provider name |
| `dirty` | `boolean` | Whether files have been modified |
| `readFiles` | `Set<string>` | Files that have been read |
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

### File Validator System

File validators can be registered to validate file contents after writing:

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

### Scripting Functions

```typescript
// Create a file
await scripting.execute('createFile', 'src/new.ts', 'export const greeting = "Hello";');

// Delete a file
await scripting.execute('deleteFile', 'src/old.ts');

// Get files matching a pattern
const files = await scripting.execute('globFiles', 'src/**/*.ts');

// Search for text
const results = await scripting.execute('searchFiles', 'function execute');
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
| `@tokenring-ai/scripting` | 0.2.0 | Scripting service |
| `@tokenring-ai/rpc` | 0.2.0 | RPC service |
| `ignore` | ^7.0.5 | Git ignore pattern matching |
| `path-browserify` | ^1.0.1 | Path manipulation for browser |
| `zod` | ^4.3.6 | Schema validation |
| `diff` | ^8.0.3 | Diff generation for file operations |
| `mime-types` | ^2.1.35 | MIME type detection |

**Development Dependencies:**

| Package | Version | Description |
|---------|---------|-------------|
| `@vitest/coverage-v8` | ^4.0.18 | Coverage tool |
| `vitest` | ^4.0.18 | Testing framework |
| `typescript` | ^5.9.3 | TypeScript compiler |

## Related Components

### Core Package

- `@tokenring-ai/agent` - Agent framework and orchestration
- `@tokenring-ai/app` - Application framework and plugin system
- `@tokenring-ai/chat` - Chat service and tool integration
- `@tokenring-ai/scripting` - Scripting service and function registration
- `@tokenring-ai/rpc` - RPC service and endpoint registration

### Related Plugins

- `@tokenring-ai/cli` - Command-line interface for agent interaction
- `@tokenring-ai/scheduler` - Automated scheduling service
- `@tokenring-ai/image-generation` - AI-powered image generation

### Integration Patterns

- **State Management** - Use `FileSystemState` for tracking file operations
- **Context Handlers** - Register `selected-files` and `search-files` handlers
- **Chat Commands** - Use `/file` command for manual file management
- **Tools** - Register `file_read`, `file_write`, and `file_search` tools
- **RPC Endpoints** - Expose filesystem operations via JSON-RPC
- **Scripting** - Register `createFile`, `deleteFile`, `globFiles`, `searchFiles` functions

## Testing

```bash
# Run tests
bun test

# Run with watch mode
bun test:watch

# Run coverage
bun test:coverage

# Run integration tests
bun test:integration

# Run e2e tests
bun test:e2e

# Run all tests including integration
bun test:all
```

## License

MIT License - see `LICENSE` file for details.
