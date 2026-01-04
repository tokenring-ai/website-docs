# Filesystem Plugin

## Overview

The Filesystem plugin provides a comprehensive filesystem abstraction service for Token Ring AI agents. It enables file operations including reading, writing, searching, and executing shell commands through a provider-based architecture. The package integrates with the agent system for chat-based file management and state tracking, providing safety mechanisms for shell commands and support for multiple filesystem providers.

## Key Features

- **Unified File Operations**: Read, write, delete, rename, copy, and append to files
- **Directory Traversal**: Walk directory trees with recursive and filtered listing
- **Glob Pattern Matching**: Find files using wildcard patterns (e.g., `**/*.ts`)
- **Text Search**: Search across files for patterns with context lines
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

The main service class implementing `TokenRingService`. It manages filesystem providers, state (selected files for chat), and delegates operations.

**Key Methods:**

- `registerFileSystemProvider(provider)`: Registers a filesystem provider
- `setActiveFileSystem(providerName, agent)`: Sets the active provider
- `attach(agent)`: Initializes state with FileSystemState
- `getDirectoryTree(path, options, agent)`: Async generator for directory contents
- `writeFile(path, content, agent)`: Writes/overwrites file
- `appendFile(path, content, agent)`: Appends to file
- `deleteFile(path, agent)`: Deletes a file
- `getFile(path, agent)`: Reads file as UTF-8 string
- `readFile(path, encoding, agent)`: Raw file read
- `exists(path, agent)`: Checks if file exists
- `stat(path, agent)`: Returns file stat information
- `rename(oldPath, newPath, agent)`: Renames a file
- `createDirectory(path, options, agent)`: Creates a directory
- `copy(source, dest, options, agent)`: Copies a file
- `glob(pattern, options, agent)`: Returns matches for glob pattern
- `grep(searchString, options, agent)`: Searches for text patterns
- `executeCommand(command, options, agent)`: Executes shell command
- `getCommandSafetyLevel(command)`: Returns 'safe', 'unknown', or 'dangerous'
- `parseCompoundCommand(command)`: Parses compound shell commands

**Chat-specific Methods:**

- `addFileToChat(file, agent)`: Adds file to chat context
- `removeFileFromChat(file, agent)`: Removes file from chat context
- `getFilesInChat(agent)`: Returns set of files in chat
- `setFilesInChat(files, agent)`: Sets files in chat
- `askForFileSelection(options, agent)`: Interactive tree-based file selection
- `setDirty(dirty, agent) / isDirty(agent)`: Tracks modifications

### FileSystemProvider

Abstract interface for filesystem implementations.

**Key Methods:**

- `getDirectoryTree(path, options)`: Async generator for directory traversal
- `writeFile(path, content)`: Write file
- `appendFile(path, content)`: Append to file
- `deleteFile(path)`: Delete file
- `readFile(path, encoding)`: Read file
- `rename(oldPath, newPath)`: Rename file
- `exists(path)`: Check existence
- `stat(path)`: Get file stats
- `createDirectory(path, options)`: Create directory
- `copy(source, dest, options)`: Copy file
- `glob(pattern, options)`: Glob pattern matching
- `watch(dir, options)`: Watch for changes
- `executeCommand(command, options)`: Execute shell command
- `grep(searchString, options)`: Text search

### FileMatchResource

Utility for pattern-based file selection.

**Interface:**

```typescript
interface MatchItem {
  path: string;
  include?: RegExp;
  exclude?: RegExp;
}
```

**Key Methods:**

- `getMatchedFiles(agent)`: Async generator yielding matching paths
- `addFilesToSet(set, agent)`: Populates a Set with matches

## Tools

The plugin provides several tools for AI agent file operations.

### file_write

Writes a file to the filesystem.

**Parameters:**

- `path`: Relative path of the file to write (e.g., 'src/main.ts')
- `content`: Content to write to the file (must include ENTIRE content)

**Behavior:**

- Automatically creates parent directories if needed
- Enforces read-before-write policy if configured
- Marks filesystem as dirty on success

### file_search

Retrieves files by paths/globs or searches text within files.

**Parameters:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `files` | List of file paths or glob patterns | Optional |
| `searches` | List of search patterns | Optional |
| `returnType` | 'names' | 'content' | 'matches' | 'content' |
| `linesBefore` | Lines before each match | 0 (10 for matches) |
| `linesAfter` | Lines after each match | 0 (10 for matches) |
| `caseSensitive` | Whether searches are case-sensitive | true |
| `matchType` | 'substring' | 'whole-word' | 'regex' | 'substring' |

**Returns:**

```typescript
{
  files: FileInfo[],
  matches: MatchInfo[],
  summary: {
    totalFiles: number,
    totalMatches: number,
    searchPatterns?: string[],
    returnType: ReturnType,
    limitExceeded: boolean
  }
}
```

### terminal_bash

Executes shell commands with safety validation.

**Parameters:**

- `command`: The shell command to execute
- `timeoutSeconds`: Timeout in seconds (default: 60, max: 90)
- `workingDirectory`: Working directory relative to filesystem root

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

**Safe Commands:**

```typescript
["awk", "cat", "cd", "chdir", "diff", "echo", "find", "git", "grep",
 "head", "help", "hostname", "id", "ipconfig", "tee", "ls", "netstat",
 "ps", "pwd", "sort", "tail", "tree", "type", "uname", "uniq", "wc", "which",
 "npm", "yarn", "bun", "tsc", "node", "npx", "bunx", "vitest"]
```

### file_append

Appends content to the end of an existing file.

**Parameters:**

- `path`: Relative path of the file to append to
- `content`: The content to add to the end of the file

### file_patch

Patches a file by replacing content between two specific lines.

**Parameters:**

- `file`: Path to the file to patch
- `fromLine`: Line that marks the beginning of content to replace
- `toLine`: Line that marks the end of content to replace
- `contents`: The content that will replace everything from fromLine to toLine

### file_regexPatch

Patches a file using regular expressions.

**Parameters:**

- `file`: Path to the file to patch
- `startRegex`: Regular expression to match the beginning of the code block
- `endRegex`: Regular expression to match the end of the code block
- `replacement`: The code that will replace the matched block

### file_patchFilesNaturalLanguage

Patches multiple files using a natural language description processed by an LLM.

**Parameters:**

- `files`: List of file paths to patch
- `naturalLanguagePatch`: Detailed natural language description of the patch

## Chat Commands

### /file

Manage files in the chat session.

**Actions:**

- `select`: Open interactive file selector
- `add [files...]`: Add specific files to chat
- `remove [files...]` or `rm [files...]`: Remove specific files from chat
- `list` or `ls`: List current files in chat
- `clear`: Remove all files from chat
- `default`: Reset to config defaults

**Usage Examples:**

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

## Context Handlers

### selected-files

Provides contents of selected files as chat context.

**Behavior:**

- Yields file contents for files in the chat context
- For directories, provides directory listings
- Marks files as read in state
- Output format:
  - For files: `BEGIN FILE ATTACHMENT: {path}\n{content}\nEND FILE ATTACHMENT: {path}`
  - For directories: `BEGIN DIRECTORY LISTING:\n{path}\n- {file}\n...\nEND DIRECTORY LISTING`

### search-files

Provides file search results as chat context based on user input.

**Parameters:**

- `maxResults`: Maximum number of results (default: 25)

**Behavior:**

- Extracts keywords from chat input (ignores stop words)
- Performs fuzzy matching on file paths
- Optionally searches file contents for high-value keywords
- Returns formatted results with match types (filename/content/both)

## Configuration

### FileSystemConfigSchema

```typescript
const FileSystemConfigSchema = z.object({
  agentDefaults: z.object({
    provider: z.string(),
    selectedFiles: z.array(z.string()).default([]),
    requireReadBeforeWrite: z.boolean().default(true)
  }),
  providers: z.record(z.string(), z.any()),
  safeCommands: z.array(z.string()).default([...]),
  dangerousCommands: z.array(z.string()).default([...])
});
```

**agentDefaults:**

- `provider`: Name of the default filesystem provider
- `selectedFiles`: Array of file paths initially selected for chat
- `requireReadBeforeWrite`: Whether files must be read before writing (default: true)

**safeCommands:**

List of commands considered safe to execute without confirmation.

**dangerousCommands:**

List of regex patterns for commands that require explicit confirmation.

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
| readFile | query | `{agentId, path}` | `{content}` |
| exists | query | `{agentId, path}` | `{exists}` |
| stat | query | `{agentId, path}` | `{stats}` |
| glob | query | `{agentId, pattern}` | `{files}` |
| listDirectory | query | `{agentId, path, showHidden, recursive}` | `{files}` |
| writeFile | mutation | `{agentId, path, content}` | `{success}` |
| appendFile | mutation | `{agentId, path, content}` | `{success}` |
| deleteFile | mutation | `{agentId, path}` | `{success}` |
| rename | mutation | `{agentId, oldPath, newPath}` | `{success}` |
| createDirectory | mutation | `{agentId, path, recursive}` | `{success}` |
| copy | mutation | `{agentId, source, destination, overwrite}` | `{success}` |
| addFileToChat | mutation | `{agentId, file}` | `{success}` |
| removeFileFromChat | mutation | `{agentId, file}` | `{success}` |
| getSelectedFiles | query | `{agentId}` | `{files}` |

## State Management

### FileSystemState

Tracks filesystem-related state for agents.

**Properties:**

- `selectedFiles`: Set of file paths in chat context
- `providerName`: Active filesystem provider name
- `dirty`: Whether files have been modified
- `requireReadBeforeWrite`: Enforces read-before-write policy
- `readFiles`: Set of files that have been read

**Methods:**

- `reset(what)`: Resets state (supports 'chat' reset)
- `serialize()`: Returns serializable state object
- `deserialize(data)`: Restores state from object
- `show()`: Returns human-readable state summary

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

// Read a file
const content = await fs.getFile('example.txt', agent);

// Append to a file
await fs.appendFile('example.txt', '\nAdditional content', agent);
```

### Directory Traversal

```typescript
// Get directory tree
for await (const path of fs.getDirectoryTree('./src', {recursive: true}, agent)) {
  console.log(path);
}

// Find files with glob pattern
const tsFiles = await fs.glob('**/*.ts', {}, agent);
```

### Chat File Management

```typescript
// Add file to chat context
await fs.addFileToChat('src/main.ts', agent);

// Get all files in chat
const files = fs.getFilesInChat(agent);

// Remove file from chat
fs.removeFileFromChat('src/main.ts', agent);

// Interactive file selection
const selected = await fs.askForFileSelection({allowDirectories: true}, agent);
```

### File Search

```typescript
// Search for text in files
const results = await fs.grep(['TODO', 'FIXME'], {
  includeContent: {linesBefore: 2, linesAfter: 2}
}, agent);

// Glob pattern matching
const configs = await fs.glob('**/*.config.{js,json,ts}', {}, agent);
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
```

## Integration

### Scripting Functions

The plugin registers these functions with the ScriptingService:

- `createFile(path, content)`: Creates a new file
- `deleteFile(path)`: Deletes a file
- `globFiles(pattern)`: Returns files matching glob pattern
- `searchFiles(searchString)`: Searches files and returns formatted results

### Chat Service Integration

- Registers tools: `file_write`, `file_search`, `terminal_bash`
- Registers context handlers: `selected-files`, `search-files`

### Agent Command Service Integration

- Registers `/file` command for file management

### WebHost Service Integration

- Registers JSON-RPC endpoint at `/rpc/filesystem`

## Testing

Run tests with the following commands:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run integration tests
bun test:integration

# Run end-to-end tests
bun test:e2e
```

## Development

### Build

```bash
bun run build
```

### Package Structure

```
pkg/filesystem/
├── index.ts                      # Main exports and config schemas
├── plugin.ts                     # Plugin installation and service registration
├── FileSystemService.ts          # Core service implementation
├── FileSystemProvider.ts         # Provider interface definitions
├── FileMatchResource.ts          # Pattern-based file selection utility
├── chatCommands.ts               # Chat command exports
├── commands/
│   └── file.ts                   # /file command implementation
├── contextHandlers.ts            # Context handler exports
├── contextHandlers/
│   ├── selectedFiles.ts          # Selected files context provider
│   └── searchFiles.ts            # File search context provider
├── tools.ts                      # Tool exports
├── tools/
│   ├── write.ts                  # file_write tool
│   ├── search.ts                 # file_search tool
│   ├── bash.ts                   # terminal_bash tool
│   ├── append.ts                 # file_append tool
│   ├── patch.ts                  # file_patch tool
│   ├── regexPatch.ts             # file_regexPatch tool
│   └── patchFilesNaturalLanguage.ts  # file_patchFilesNaturalLanguage tool
├── rpc/
│   ├── schema.ts                 # RPC method definitions
│   └── filesystem.ts             # RPC endpoint implementation
├── state/
│   └── fileSystemState.ts        # State management
├── test/
│   ├── createTestFilesystem.ts   # Test helper
│   └── FileSystemService.commandValidation.test.ts
├── package.json
├── vitest.config.ts
└── README.md
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/tokenring/blob/main/packages/filesystem/LICENSE) for details.
