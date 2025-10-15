# Filesystem Plugin

Abstract filesystem with operations for reading, writing, searching, and globbing files with ignore filters and dirty tracking.

## Overview

The `@tokenring-ai/filesystem` package provides an abstract filesystem interface designed for integration with AI agents. It enables virtual filesystem operations such as reading/writing files, directory traversal, globbing, searching, and executing shell commands. The package supports multiple filesystem providers (e.g., local FS, S3) and integrates seamlessly with agents for state management.

## Key Features

- **Unified API**: Create, read, update, delete, rename, permissions
- **Ignore Filters**: Based on `.gitignore` and `.aiignore`
- **Agent Tools**: File modification, patching, searching, and shell execution
- **Chat Commands**: Managing files in agent conversations (`/file`, `/foreach`)
- **Async Generators**: Directory trees and memories from selected files
- **Dirty Tracking**: Track changes for auto-commit workflows

## Core Components

### FileSystemService

Main service class implementing `TokenRingService` that manages filesystem providers and state.

**Key Methods:**
- `registerFileSystemProvider(provider)`: Registers a provider
- `writeFile(path, content)`: Writes/overwrites file
- `readFile(path, encoding?)`: Raw read
- `deleteFile(path)`, `rename(oldPath, newPath)`, `copy(source, dest)`: Standard ops
- `exists(path)`, `stat(path)`: File info
- `createDirectory(path, options?)`: Creates dir
- `glob(pattern, options?)`: Pattern matching
- `grep(searchString, options?)`: Text search
- `executeCommand(command, options?)`: Shell execution
- `watch(dir, options?)`: File watching
- `addFileToChat(file, agent)`: Add file to agent context
- `getMemories(agent)`: Yields file contents as agent memories

### FileSystemProvider

Abstract base class for concrete implementations (e.g., local FS, S3).

### Tools

**file/modify**: Write, append, delete, rename, adjust permissions
- Actions: `write`, `append`, `delete`, `rename`, `adjust`
- Auto-creates dirs, sets default permissions

**file/search**: Retrieve files by paths/globs or search text
- Modes: `names`, `content`, `matches`
- Supports substring/whole-word/regex matching

**file/patch**: Replace content between exact line matches
- Ensures single match, overwrites file

**terminal/runShellCommand**: Execute shell commands
- Not sandboxed - use cautiously
- Marks dirty on success

### Chat Commands

**/file**: Manage chat files
- `select`: Interactive tree selection
- `add/remove [files...]`: Add/remove specific files
- `list`: Show current files
- `clear`: Remove all
- `default`: Reset to config defaults

**/foreach &lt;glob&gt; &lt;prompt&gt;**: Run AI prompt on each matching file

### Global Scripting Functions

When `@tokenring-ai/scripting` is available:

- **createFile(path, content)**: Creates a file
- **deleteFile(path)**: Deletes a file
- **globFiles(pattern)**: Returns array of matching files
- **searchFiles(searchString)**: Searches for text across files

```bash
# Example usage
/var $files = globFiles("src/**/*.ts")
/var $todos = searchFiles("TODO")
/call createFile("report.txt", $todos)
```

## Usage Example

```typescript
import { FileSystemService } from '@tokenring-ai/filesystem';

const fs = new FileSystemService();
await fs.writeFile('example.txt', 'Hello, world!');
const content = await fs.getFile('example.txt');

// Directory traversal
for await (const path of fs.getDirectoryTree('./src', {recursive: true})) {
  console.log(path);
}

// Agent integration
await fs.addFileToChat('src/main.ts', agent);
for await (const memory of fs.getMemories(agent)) {
  console.log(memory.content);
}
```

## Configuration Options

- **Constructor**: `FileSystemService({defaultSelectedFiles?: string[]})`
- **Ignore Filters**: Auto-loads `.gitignore` and `.aiignore`
- **Permissions**: Octal strings (e.g., '644')
- **Search**: Case-sensitive by default, limits to 50 results
- **Shell**: `timeoutSeconds` (default 60, max 600)

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: For `runChat` in commands
- `@tokenring-ai/agent@0.1.0`: Core agent integration
- `@tokenring-ai/iterables@0.1.0`: Iterable providers
- `@tokenring-ai/scripting@0.1.0`: Optional, for global functions
- `ignore@^7.0.5`: Gitignore parsing
- `path-browserify@^1.0.1`: Path utils
