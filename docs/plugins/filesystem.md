# Filesystem Plugin

## Overview

The Filesystem plugin provides a comprehensive filesystem abstraction service for Token Ring AI agents. It enables file operations including reading, writing, searching, and executing shell commands through a provider-based architecture. The package integrates with the agent system for chat-based file management and state tracking, providing safety mechanisms for shell commands and support for multiple filesystem providers.

## Key Features

- **Unified File Operations**: Read, write, search, and patch files
- **Directory Traversal**: Walk directory trees with recursive and filtered listing
- **Glob Pattern Matching**: Find files using wildcard patterns (e.g., `**/*.ts`)
- **Text Search**: Search across files for patterns with context lines
- **Patch Operations**: Line-based and regex-based file patching
- **Shell Command Execution**: Execute shell commands with safety validation
- **Command Safety Levels**: Classifies commands as safe, unknown, or dangerous
- **Provider Architecture**: Support multiple filesystem implementations
- **Chat Integration**: Tools for file operations within chat contexts
- **Context Handlers**: Provide file contents and search results to agents
- **State Management**: Track selected files, dirty state, and read-before-write policies
- **JSON-RPC Endpoints**: Remote filesystem access via RPC
- **Ignore Filters**: Respect `.gitignore` and `.aiignore` patterns

## Core Components

### FileSystemService

The main service class implementing `TokenRingService`. It manages filesystem providers, agent state, and delegates operations.

**Key Methods:**

#### Provider Management
- `registerFileSystemProvider(provider)`: Registers a filesystem provider
- `requireFileSystemProviderByName(name)`: Retrieves a registered provider by name
- `setActiveFileSystem(providerName, agent)`: Sets the active provider for an agent
- `requireActiveFileSystem(agent)`: Gets the active provider for an agent

#### State Management
- `attach(agent)`: Initializes state for agent
- `addFileToChat(file, agent)`: Adds file to chat context
- `removeFileFromChat(file, agent)`: Removes file from chat context
- `getFilesInChat(agent)`: Returns set of files in chat
- `setFilesInChat(files, agent)`: Sets files in chat context
- `setDirty(dirty, agent)`: Marks filesystem as modified
- `isDirty(agent)`: Checks if files have been modified

#### File Operations
- `writeFile(path, content, agent)`: Write or overwrite file
- `appendFile(filePath, content, agent)`: Append to file
- `deleteFile(path, agent)`: Delete file
- `readTextFile(path, agent)`: Read file as UTF-8 string
- `readFile(path, agent)`: Read file as buffer
- `exists(path, agent)`: Check if file exists
- `stat(path, agent)`: Get file statistics
- `rename(oldPath, newPath, agent)`: Rename file
- `copy(source, destination, options, agent)`: Copy file or directory
- `createDirectory(path, options, agent)`: Create directory recursively

#### Directory Operations
- `getDirectoryTree(path, options, agent)`: Async generator for directory traversal
- `glob(pattern, options, agent)`: Match files with glob pattern
- `watch(dir, options, agent)`: Watch for filesystem changes

#### Search Operations
- `executeCommand(command, options, agent)`: Execute shell command
- `getCommandSafetyLevel(command)`: Returns "safe", "unknown", or "dangerous"
- `parseCompoundCommand(command)`: Parse compound commands (&&, ||, ;, |)
- `grep(searchString, options, agent)`: Search for text patterns in files

**Run Method:**
```typescript
run(): void {
  // Throws an error if the default provider is not registered
  this.defaultProvider = this.fileSystemProviderRegistry.requireItemByName(
    this.options.agentDefaults.provider
  );
}
```

**Attach Method:**
```typescript
attach(agent: Agent): void {
  // Merge config and initialize state
  const config = deepMerge(
    this.options.agentDefaults,
    agent.getAgentConfigSlice('filesystem', FileSystemAgentConfigSchema)
  );
  agent.initializeState(FileSystemState, config);
  if (config.selectedFiles.length > 0) {
    agent.infoMessage(`Selected files: ${config.selectedFiles.join(', ')}`);
  }
}
```

### FileSystemProvider

Abstract interface for filesystem implementations. Implementations can provide virtual, remote, or local filesystem access.

**Interface:**
```typescript
export interface StatLike {
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

export interface GrepResult {
  file: string;
  line: number;
  match: string;
  matchedString?: string;
  content: string | null;
}

export interface DirectoryTreeOptions {
  ignoreFilter: (path: string) => boolean;
  recursive?: boolean;
}

export interface GlobOptions {
  ignoreFilter: (path: string) => boolean;
  absolute?: boolean;
  includeDirectories?: boolean;
}

export interface WatchOptions {
  ignoreFilter: (path: string) => boolean;
  pollInterval?: number;
  stabilityThreshold?: number;
}

export interface ExecuteCommandOptions {
  timeoutSeconds: number;
  env?: Record<string, string | undefined>;
  workingDirectory?: string;
}

export interface ExecuteCommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

export interface GrepOptions {
  ignoreFilter: (path: string) => boolean;
  includeContent?: { linesBefore?: number; linesAfter?: number };
}

export default interface FileSystemProvider {
  // Directory walking
  getDirectoryTree(
    path: string,
    params?: DirectoryTreeOptions,
  ): AsyncGenerator<string>;

  // File operations
  writeFile(path: string, content: string | Buffer): Promise<boolean>;
  appendFile(filePath: string, content: string | Buffer): Promise<boolean>;
  deleteFile(path: string): Promise<boolean>;
  readFile(path: string): Promise<Buffer | null>;
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
  executeCommand(
    command: string | string[],
    options?: ExecuteCommandOptions,
  ): Promise<ExecuteCommandResult>;
  grep(
    searchString: string | string[],
    options?: GrepOptions,
  ): Promise<GrepResult[]>;
}
```

## Tools

The plugin provides the following tools for AI agent file operations.

### file_write

Writes a file to the filesystem.

**Tool Basic Setup:**
```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import write from "./tools/write.ts";

const name = "file_write";
const displayName = "Filesystem/write";
```

**Parameters:**
- `path`: Relative path of the file to write (required)
- `content`: Content to write to the file (required)

**Behavior:**
- Enforces read-before-write policy if configured
- Creates parent directories automatically if needed
- Returns diff if file existed before (up to maxReturnedDiffSize limit)
- Sets filesystem as dirty on success
- Marks file as read in state
- Generates artifact output (diff)
- Cannot write `skipArtifactOutput: true` to suppress

**Error Cases:**
- Throws error if path or content is missing
- Returns helpful message if file wasn't read before write and policy is enforced

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

**Tool Basic Setup:**
```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import read from "./tools/read.ts";

const name = "file_read";
const displayName = "Filesystem/read";
```

**Parameters:**
- `files`: List of file paths or glob patterns (required)

**Behavior:**
- Resolves glob patterns to specific files
- Checks file existence for each path
- Reads file contents (up to maxFileSize limit)
- Marks read files in `FileSystemState`
- Returns file names only if too many files are matched
- Handles binary files gracefully

**Error Cases:**
- Returns "No files were found" if no files match
- Returns directory listing if more than `maxFileReadCount` files matched
- Treats pattern resolution errors as informational

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

**Tool Basic Setup:**
```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import search from "./tools/search.ts";

const name = "file_search";
const displayName = "Filesystem/search";
```

**Parameters:**
- `filePaths`: List of file paths or glob patterns to search within (defaults to ["**/*"])
- `searchTerms`: List of search terms to search for

**Behavior:**
- Supports substring, regex, and exact matching
- Returns grep-style snippets with context lines
- Automatically decides whether to return full file contents, snippets, or file names based on match count
- Marks read files in state
- Supports fuzzy matching and keyword extraction

**Search Patterns:**
- Plain strings: Fuzzy substring matching
- Regex: Enclosed in `/` (e.g., `/class \w+Service/`)

**Error Cases:**
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

### file_append

Appends content to the end of a file.

**Tool Basic Setup:**
```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import append from "./tools/append.ts";

const name = "file_append";
const displayName = "Filesystem/append";
```

**Parameters:**
- `path`: Relative path of the file to append to (required)
- `content`: The content to add to the end of the file (required)

**Behavior:**
- Ensures file has newline before appending if file exists
- Enforces read-before-write policy if configured
- Creates parent directories automatically if needed
- Returns diff if file existed before (up to maxReturnedDiffSize limit)
- Sets filesystem as dirty on success
- Marks file as read in state
- Generates artifact output (diff)
- Cannot write `skipArtifactOutput: true` to suppress

**Example:**
```typescript
const result = await append({
  path: 'logs/app.log',
  content: '2024-01-15: New entry\n'
}, agent);
```

### file_patch

Patches a file by replacing content between two specific lines that match exactly.

**Tool Basic Setup:**
```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import patch from "./tools/patch.ts";

const name = "file_patch";
const displayName = "Filesystem/patch";
```

**Parameters:**
- `file`: Path to the file to patch
- `firstLineToMatchAndRemove`: The first line of text to remove
- `lastLineToMatchAndRemove`: The last line of text to remove
- `replacementContent`: The content that will replace everything between the two lines

**Behavior:**
- Reads original file content
- Normalizes whitespace for comparison
- Finds exact matches for firstLineToMatchAndRemove
- Validates exactly one firstLineToMatchAndRemove match
- Finds lastLineToMatchAndRemove matches after firstLineToMatchAndRemove
- Validates exactly one lastLineToMatchAndRemove match after firstLineToMatchAndRemove
- Replaces content between firstLineToMatchAndRemove and lastLineToMatchAndRemove (inclusive)
- Writes patched content back to file
- Sets filesystem as dirty
- Returns success message with diff

**Error Handling:**
- Throws error if required parameters are missing
- Throws error if file content can't be read
- Throws error if firstLineToMatchAndRemove doesn't match anywhere in file
- Throws error if firstLineToMatchAndRemove matches multiple times
- Throws error if lastLineToMatchAndRemove doesn't match after firstLineToMatchAndRemove
- Throws error if lastLineToMatchAndRemove matches multiple times after firstLineToMatchAndRemove

**Agent State:**
- Sets `state.dirty = true`

**Example:**
```typescript
const result = await patch({
  file: 'src/old-config.ts',
  firstLineToMatchAndRemove: 'export const oldConfig = {',
  lastLineToMatchAndRemove: 'export const newConfig = {',
  replacementContent: '// New configuration values'
}, agent);
```

### bash

Executes shell commands with safety validation.

**Tool Basic Setup:**
```typescript
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import bash from "./tools/bash.ts";

const name = "bash";
const displayName = "Terminal/bash";
```

**Parameters:**
- `command`: The shell command to execute (required)
- `timeoutSeconds`: Timeout for the command in seconds (default 60, max 90)
- `workingDirectory`: Working directory, relative to the filesystem root

**Returns:**
```typescript
{
  ok: boolean,
  stdout: string,
  stderr: string,
  exitCode: number,
  error?: string
}
```

**Safety Levels:**

- `safe`: Pre-approved commands (e.g., ls, cat, git, npm, bun)
- `unknown`: Commands not in safe/dangerous lists (requires confirmation)
- `dangerous`: Commands matching dangerous patterns (e.g., rm, sudo, chmod)

**Confirmation Flow:**

- Asks for confirmation for unknown commands
- Asks for confirmation for dangerous commands
- User can choose to cancel execution

**Safe Commands:**
```typescript
["awk", "cat", "cd", "chdir", "diff", "echo", "find", "git", "grep",
 "head", "help", "hostname", "id", "ipconfig", "tee", "ls", "netstat",
 "ps", "pwd", "sort", "tail", "tree", "type", "uname", "uniq", "wc", "which",
 "touch", "mkdir",
 "npm", "yarn", "bun", "tsc", "node", "npx", "bunx", "vitest"]
```

**Dangerous Commands:**
Commands matching patterns like:
- `rm -rf *`
- `dd *`
- `chmod -R *`
- `chown -R *`
- `sudo *`
- `del *`
- `format *`
- `reboot`
- `shutdown`
- `git reset`

**Example:**
```typescript
const result = await bash({
  command: ['npm', 'install'],
  timeoutSeconds: 120,
  workingDirectory: './frontend'
}, agent);

if (result.ok) {
  console.log('Install completed:', result.stdout);
} else {
  console.error('Install failed:', result.stderr);
}
```

**Note:** The `bash` tool is currently not exported from the package. It may be available in future versions.

## Chat Commands

### /file

Manage files in the chat session.

**Location:** `commands/file.ts`

**Usage:**
```
/file [action] [files...]
```

**Actions:**
- `select`: Interactive file selector
- `add [files...]`: Add specific files to chat (or interactive if no files)
- `remove [files...]` or `rm [files...]`: Remove specific files from chat
- `list` or `ls`: List all files currently in chat
- `clear`: Remove all files from chat
- `default`: Reset to default files from config

**Options:**
```typescript
async function selectFiles(filesystem: FileSystemService, agent: Agent) {
  const selectedFiles = await agent.askQuestion({
    message: "Select a file or directory:",
    question: {
      type: 'fileSelect',
      label: "File Selection",
      defaultValue: Array.from(filesystem.getFilesInChat(agent)),
      allowDirectories: true,
      allowFiles: true,
    }
  });
  if (selectedFiles) {
    await filesystem.setFilesInChat(selectedFiles, agent);
    agent.infoMessage(`Selected ${selectedFiles.length} files`);
  }
}

async function addFiles(filesystem: FileSystemService, agent: Agent, filesToAdd: string[]) {
  let addedCount = 0;
  for (const file of filesToAdd) {
    try {
      await filesystem.addFileToChat(file, agent);
      agent.infoMessage(`Added file to chat: ${file}`);
      addedCount++;
    } catch (error) {
      agent.errorMessage(`Failed to add file ${file}:`, error);
    }
  }
  if (addedCount > 0) {
    agent.infoMessage(`Successfully added ${addedCount} file(s)`);
  }
}
```

## Context Handlers

### selected-files

Provides contents of selected files as chat context.

**Location:** `contextHandlers/selectedFiles.ts`

**Handler:** `getContextItems(input: string, chatConfig: ParsedChatConfig, params: {}, agent: Agent): AsyncGenerator<ContextItem>`

**Behavior:**
- Yields file contents for files in `state.selectedFiles`
- For directories, yields directory listings
- Marks files as read in `state.readFiles`
- Outputs format:
  - Files: `BEGIN FILE ATTACHMENT: {path}\n{content}\nEND FILE ATTACHMENT: {path}`
  - Directories: `BEGIN DIRECTORY LISTING:\n{path}\n- {file}\n...\nEND DIRECTORY LISTING`

**Implementation:**
```typescript
export default async function* getContextItems(
  input: string,
  chatConfig: ParsedChatConfig,
  params: {},
  agent: Agent
): AsyncGenerator<ContextItem> {
  const fileSystemService = agent.requireServiceByType(FileSystemService);
  const fileContents: string[] = [];
  const directoryContents: string[] = [];

  for (const file of agent.getState(FileSystemState).selectedFiles) {
    const content = await fileSystemService.readTextFile(file, agent);
    if (content) {
      fileContents.push(`BEGIN FILE ATTACHMENT: ${file}\n${content}\nEND FILE ATTACHMENT: ${file}`);
      agent.mutateState(FileSystemState, (state: FileSystemState) => {
        state.readFiles.add(file);
      });
    } else {
      try {
        const directoryListing = await fileSystemService.getDirectoryTree(
          file,
          {},
          agent
        );
        const files = await Array.fromAsync(directoryListing);
        directoryContents.push(`BEGIN DIRECTORY LISTING:\n${file}\n${files.map(f => `- ${f}`).join("\n")}\nEND DIRECTORY LISTING`);
      } catch (error) {
        // File doesn't exist or is not a directory
      }
    }
  }

  if (fileContents.length > 0) {
    yield {
      role: "user",
      content: `// The user has attached the following files:\n\n${fileContents.join("\n\n")}`,
    };
  }

  if (directoryContents.length > 0) {
    yield {
      role: "user",
      content: `// The user has attached the following directory listing:\n\n${directoryContents.join("\n\n")}`,
    };
  }
}
```

### search-files

Provides file search results based on user input keywords.

**Location:** `contextHandlers/searchFiles.ts`

**Handler:** `getContextItems(chatInputMessage: string, chatConfig: ParsedChatConfig, params: unknown, agent: Agent): AsyncGenerator<ContextItem>`

**Keyword Extraction:**
- Extracts quoted phrases (exact matches)
- Extracts file paths (containing / or \)
- Extracts file names with extensions
- Splits CamelCase and snake_case identifiers
- Removes stop words
- Deduplicates while preserving order

**Extension Detection:**
- Direct mentions (.ts, .js, etc.)
- Language patterns ("typescript files", "json files", etc.)

**Scoring Algorithm:**
- Filename match: 10 points
- Filename without extension match: 8 points
- Filename contains keyword: 5 * fuzzyScore
- Path contains keyword: 2 * fuzzyScore
- Penalties recursively nested files: 0.05 per level

**Search Strategies:**
1. **Path/Filename matching**: Uses glob pattern matching over all files
2. **Content search**: Uses grep for high-value keywords (length > 3, alphanumeric pattern)

**Output Format:**
```markdown
Found X file(s) matching keywords: keyword1, keyword2

## filepath (filename)

Matching lines:
  Line N: content line
  ...

## anotherfile (content)

Finding line N: content
```

## Configuration

### FileSystemConfigSchema

```typescript
const FileSystemConfigSchema = z.object({
  agentDefaults: z.object({
    provider: z.string(),
    selectedFiles: z.array(z.string()).default([]),
    fileWrite: z.object({
      requireReadBeforeWrite: z.boolean().default(true),
      maxReturnedDiffSize: z.number().default(1024),
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
  resources: z.record(z.string(), z.any()),
  safeCommands: z.array(z.string()).default([
    "awk", "cat", "cd", "chdir", "diff", "echo", "find", "git", "grep",
    "head", "help", "hostname", "id", "ipconfig", "tee",
    "ls", "netstat", "ps", "pwd", "sort", "tail", "tree", "type",
    "uname", "uniq", "wc", "which", "touch", "mkdir",
    "npm", "yarn", "bun", "tsc", "node", "npx", "bunx", "vitest"
  ]),
  dangerousCommands: z.array(z.string()).default([
    "(^|\\s)dd\\s",
    "(^|\\s)rm.*-.*r",
    "(^|\\s)chmod.*-.*r",
    "(^|\\s)chown.*-.*r",
    "(^|\\s)rmdir\\s",
    "find.*-(delete|exec)",
    "(^|\\s)sudo\\s",
    "(^|\\s)del\\s",
    "(^|\\s)format\\s",
    "(^|\\s)reboot",
    "(^|\\s)shutdown",
    "git.*reset",
  ])
}).strict();
```

### FileSystemAgentConfigSchema

```typescript
const FileSystemAgentConfigSchema = z.object({
  provider: z.string().optional(),
  selectedFiles: z.array(z.string()).optional(),
  fileWrite: z.object({
    requireReadBeforeWrite: z.boolean().optional(),
    maxReturnedDiffSize: z.number().optional(),
  }).optional(),
  fileRead: z.object({
    maxFileReadCount: z.number().optional(),
    maxFileSize: z.number().optional()
  }).optional(),
  fileSearch: z.object({
    maxSnippetCount: z.number().default(10),
    maxSnippetSizePercent: z.number().default(0.3),
    snippetLinesBefore: z.number().default(5),
    snippetLinesAfter: z.number().default(5),
  }).optional(),
}).strict().default({});
```

### Package Config Schema

```typescript
const packageConfigSchema = z.object({
  filesystem: FileSystemConfigSchema.optional(),
});
```

## RPC Endpoints

JSON-RPC endpoints available at `/rpc/filesystem`:

| Method | Type | Input | Output |
|--------|------|-------|--------|
| readTextFile | query | `{agentId, path}` | `{content}` |
| exists | query | `{agentId, path}` | `{exists}` |
| stat | query | `{agentId, path}` | `{stats}` |
| glob | query | `{agentId, pattern}` | `{files}` |
| listDirectory | query | `{agentId, path, showHidden?, recursive?}` | `{files}` |
| writeFile | mutation | `{agentId, path, content}` | `{success}` |
| appendFile | mutation | `{agentId, path, content}` | `{success}` |
| deleteFile | mutation | `{agentId, path}` | `{success}` |
| rename | mutation | `{agentId, oldPath, newPath}` | `{success}` |
| createDirectory | mutation | `{agentId, path, recursive?}` | `{success}` |
| copy | mutation | `{agentId, source, destination, overwrite?}` | `{success}` |
| addFileToChat | mutation | `{agentId, file}` | `{success}` |
| removeFileFromChat | mutation | `{agentId, file}` | `{success}` |
| getSelectedFiles | query | `{agentId}` | `{files}` |

## State Management

### FileSystemState

Tracks filesystem-related state for agents.

**Properties:**
```typescript
interface FileSystemState {
  selectedFiles: Set<string>       // Files in chat context
  providerName: string            // Active provider name
  dirty: boolean                  // Whether files have been modified
  readFiles: Set<string>          // Files that have been read
  initialConfig?: {
    selectedFiles: string[]       // Initial selected files from config
  }
}
```

**State Slices:**
```typescript
import {FileSystemState} from "./state/fileSystemState.ts";

// Get config slice
const config = agent.getAgentConfigSlice('filesystem', FileSystemAgentConfigSchema);

// Initialize state
agent.initializeState(FileSystemState, config);

// Access state
const state = agent.getState(FileSystemState);
console.log('Active provider:', state.providerName);
console.log('Dirty:', state.dirty);
console.log('Selected files:', Array.from(state.selectedFiles));
console.log('Read files:', Array.from(state.readFiles));

// Mutate state
agent.mutateState(FileSystemState, (state) => {
  state.dirty = true;
  state.readFiles.add('src/main.ts');
});
```

**State Transfers:**
```typescript
// Child agent transfers state from parent on attach
agent.attach(childAgent);
// childAgent transfers selectedFiles from parent on initialization
```

**State Methods:**
```typescript
state.reset('chat')           // Reset chat context
state.serialize()             // Return serializable state
state.deserialize(data)       // Restore state from object
state.show()                  // Return human-readable summary
```

## Ignore Filter System

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
import createIgnoreFilter from "./util/createIgnoreFilter.ts";

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
const fileSystem = agent.requireServiceByType(FileSystemService);

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

## Usage Examples

### Basic File Operations

```typescript
import FileSystemService from '@tokenring-ai/filesystem/FileSystemService';

const fs = new FileSystemService({
  agentDefaults: {
    provider: 'local',
    selectedFiles: [],
    requireReadBeforeWrite: true,
  },
  safeCommands: ['ls', 'cat', 'grep', 'git', 'npm', 'bun', 'node'],
  dangerousCommands: ['rm', 'chmod', 'chown', 'sudo'],
  providers: {
    local: { /* local provider config */ }
  }
});

// Write a file
await fs.writeFile('example.txt', 'Hello, world!', agent);

// Append to a file
await fs.appendFile('example.txt', '\nAdditional content', agent);

// Read a file
const content = await fs.readTextFile('example.txt', agent);

// Read raw file
const buffer = await fs.readFile('example.txt', agent);
```

### Directory Traversal

```typescript
// Get directory tree
for await (const path of fs.getDirectoryTree('./src', {recursive: true}, agent)) {
  console.log(path);
}

// Find files with glob pattern
const tsFiles = await fs.glob('**/*.ts', {}, agent);

// List directory
const files = await fs.glob('src/', {includeDirectories: true}, agent);
```

### Chat File Management

```typescript
// Add file to chat context
await fs.addFileToChat('src/main.ts', agent);

// Get all files in chat
const files = fs.getFilesInChat(agent);

// Remove file from chat
fs.removeFileFromChat('src/main.ts', agent);

// Set multiple files in chat
await fs.setFilesInChat(['src/main.ts', 'src/utils.ts'], agent);
```

### File Search

```typescript
// Search for text in files
const results = await fs.grep(['TODO', 'FIXME'], {
  includeContent: {linesBefore: 2, linesAfter: 2}
}, agent);

// Glob pattern matching
const configs = await fs.glob('**/*.config.{js,json,ts}', {}, agent);

// Watch for changes
const watcher = await fs.watch('src/', {pollInterval: 1000}, agent);
```

### Shell Command Execution

```typescript
const result = await fs.executeCommand(
  ['npm', 'install'],
  {timeoutSeconds: 120, workingDirectory: './frontend'},
  agent
);

if (result.ok) {
  console.log('Install completed:', result.stdout);
} else {
  console.error('Install failed:', result.stderr);
}

// Check command safety
const safety = fs.getCommandSafetyLevel('rm -rf /');
console.log(safety); // 'dangerous'

// Parse compound commands
const commands = fs.parseCompoundCommand('cd frontend/chat && bun add lucide-react');
console.log(commands); // ['cd', 'bun']
```

### Advanced Usage

```typescript
// Get file stats
const stats = await fs.stat('src/main.ts', agent);
console.log(stats.isFile, stats.size, stats.modified);

// Copy files
await fs.copy('src/old', 'src/new', {overwrite: false}, agent);

// Create directory
await fs.createDirectory('src/utils', {recursive: true}, agent);

// Delete file
await fs.deleteFile('src/old.js', agent);

// Rename file
await fs.rename('src/old.js', 'src/new.js', agent);
```

## Integration

### Scripting Functions

The plugin registers these functions with the ScriptingService:

- `createFile(path, content)`: Creates a new file
- `deleteFile(path)`: Deletes a file
- `globFiles(pattern)`: Returns files matching glob pattern
- `searchFiles(searchString)`: Searches files and returns formatted results

### Chat Service Integration

- Registers tools: `file_write`, `file_search`, `file_read`, `file_append`, `file_patch`, `bash`
- Registers context handlers: `selected-files`, `search-files`

### Agent Command Service Integration

- Registers `/file` command for file management

### WebHost Service Integration

- Registers JSON-RPC endpoint at `/rpc/filesystem`

## Package Structure

```
pkg/filesystem/
├── index.ts                         # Main exports
├── package.json                     # Package configuration
├── schema.ts                        # Zod configuration schemas
├── FileSystemService.ts             # Core service implementation
├── FileSystemProvider.ts            # Provider interface definitions
├── FileMatchResource.ts             # File matching resource class
├── tools.ts                         # Tool exports
├── tools/
│   ├── write.ts                     # file_write tool
│   ├── read.ts                      # file_read tool
│   ├── search.ts                    # file_search tool
│   ├── append.ts                    # file_append tool
│   ├── patch.ts                     # file_patch tool
│   └── bash.ts                      # bash tool (not currently exported)
├── chatCommands.ts                  # Chat command exports
├── commands/
│   └── file.ts                      # /file command implementation
├── contextHandlers.ts               # Context handler exports
├── contextHandlers/
│   ├── selectedFiles.ts             # selectedFiles context handler
│   └── searchFiles.ts               # searchFiles context handler
├── rpc/
│   ├── schema.ts                    # RPC method definitions
│   └── filesystem.ts                # RPC endpoint implementation
├── state/
│   └── fileSystemState.ts           # State management
├── util/
│   └── createIgnoreFilter.ts        # Ignore filter creation
└── test/
    ├── createTestFilesystem.ts      # Test helper
    └── FileSystemService.commandValidation.test.ts
```

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

# Run all tests including integration
bun test:all
```

## Dependencies

**Production Dependencies:**
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service
- `@tokenring-ai/ai-client`: AI client registry
- `@tokenring-ai/utility`: Utility functions
- `@tokenring-ai/scripting`: Scripting service
- `@tokenring-ai/rpc`: RPC service
- `ignore`: Git ignore pattern matching
- `path-browserify`: Path manipulation for browser
- `zod`: Schema validation
- `diff`: Diff generation for file operations
- `mime-types`: MIME type detection

## License

MIT License - see the root LICENSE file for details.
