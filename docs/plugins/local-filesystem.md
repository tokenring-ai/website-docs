# @tokenring-ai/local-filesystem

A concrete implementation of the FileSystemProvider abstraction that provides safe, root-scoped access to your local filesystem for Token Ring apps and agents.

## Overview

The `@tokenring-ai/local-filesystem` package provides a concrete implementation of the FileSystemProvider interface that enables safe file operations on your local disk. All operations are confined to a configured base directory with comprehensive security boundaries, error handling, and advanced features like file watching and text searching.

## Package Structure

```
pkg/local-filesystem/
├── plugin.ts                 # Plugin registration and integration
├── LocalFileSystemProvider.ts # Core filesystem provider implementation
├── index.ts                  # Package exports
├── package.json              # Package metadata and dependencies
├── vitest.config.ts          # Vitest test configuration
└── README.md                 # Package documentation
```

## Key Features

- **Root-Scoped**: All operations confined to `baseDirectory`; attempts to access paths outside are rejected
- **Path Utilities**: Convert between relative and absolute paths with security validation
- **File Operations**: Read, write, append, delete, rename, copy, stat, and chmod operations
- **Directory Operations**: Create directories, glob pattern matching, text search (grep), and tree traversal
- **File Watching**: Uses chokidar for robust file change monitoring
- **Shell Execution**: Uses execa with configurable timeouts and environment overrides
- **Type-Safe**: Built with TypeScript and Zod for configuration validation
- **Plugin Architecture**: Designed to integrate with Token Ring applications as a plugin

## Core Components

### LocalFileSystemProvider

Main filesystem provider class implementing the FileSystemProvider interface.

**Constructor:**

```typescript
const provider = new LocalFileSystemProvider(&#123;
  baseDirectory: string,          // Root directory for all operations (required)
  defaultSelectedFiles?: string[] // Default file patterns to select (optional)
&#125;);
```

**Path Utilities:**

```typescript
// Convert any path (relative or absolute) to absolute path within root bounds
relativeOrAbsolutePathToAbsolutePath(p: string): string;

// Convert absolute path to relative path from root
relativeOrAbsolutePathToRelativePath(p: string): string;
```

**File Operations:**

```typescript
// Write/overwrite file content
writeFile(filePath: string, content: string | Buffer): Promise&lt;boolean&gt;;

// Append content to file
appendFile(filePath: string, content: string | Buffer): Promise&lt;boolean&gt;;

// Read file with optional encoding
readFile(filePath: string, encoding?: BufferEncoding): Promise&lt;string&gt;;

// Delete a file
deleteFile(filePath: string): Promise&lt;boolean&gt;;

// Rename/move file
rename(oldPath: string, newPath: string): Promise&lt;boolean&gt;;

// Check if file exists
exists(filePath: string): Promise&lt;boolean&gt;;

// Get file/directory statistics
stat(filePath: string): Promise&lt;StatLike&gt;;

// Change file permissions
chmod(filePath: string, mode: number): Promise&lt;boolean&gt;;

// Copy file or directory with optional overwrite
copy(source: string, destination: string, options?: &#123; overwrite?: boolean &#125;): Promise&lt;boolean&gt;;
```

**Directory Operations:**

```typescript
// Create directory with optional recursive creation
createDirectory(dirPath: string, options?: &#123; recursive?: boolean &#125;): Promise&lt;boolean&gt;;

// Find files matching glob patterns
glob(pattern: string, options?: GlobOptions): Promise&lt;string[]&gt;;

// Search for text content across files
grep(searchString: string, options?: GrepOptions): Promise&lt;GrepResult[]&gt;;

// Traverse directory tree
getDirectoryTree(dir: string, options?: DirectoryTreeOptions): AsyncGenerator&lt;string&gt;;
```

**File Watching:**

```typescript
// Watch directory for changes
watch(dir: string, options?: WatchOptions): Promise&lt;FSWatcher&gt;;
```

**Command Execution:**

```typescript
// Execute shell commands with timeout and environment control
executeCommand(command: string | string[], options?: ExecuteCommandOptions): Promise&lt;ExecuteCommandResult&gt;;
```

## Usage Examples

### Basic File Operations

```typescript
import LocalFileSystemProvider from '@tokenring-ai/local-filesystem';

// Create provider with root directory
const provider = new LocalFileSystemProvider(&#123;
  baseDirectory: process.cwd(),
  defaultSelectedFiles: ['**/*.ts', '**/*.js']
&#125;);

// Write file
await provider.writeFile('notes/todo.txt', '- [ ] Complete documentation');

// Read file
const content = await provider.readFile('notes/todo.txt', 'utf8');
console.log(content); // "- [ ] Complete documentation"

// Check if file exists
const exists = await provider.exists('notes/todo.txt');
console.log(exists); // true

// Get file stats
const info = await provider.stat('notes/todo.txt');
console.log(info);
/*
&#123;
  path: 'notes/todo.txt',
  absolutePath: '/path/to/project/notes/todo.txt',
  isFile: true,
  isDirectory: false,
  isSymbolicLink: false,
  size: 28,
  created: Date,
  modified: Date,
  accessed: Date
&#125;
*/

// Rename file
await provider.rename('notes/todo.txt', 'notes/TODO.md');

// Copy file
await provider.copy('notes/TODO.md', 'notes/backup/TODO.md');

// Change file permissions
await provider.chmod('notes/script.sh', 0o755);

// Delete file
await provider.delete('notes/TODO.md');
```

### Directory Operations

```typescript
// Create directory
await provider.createDirectory('new-folder', &#123; recursive: true &#125;);

// Create nested directory structure
await provider.createDirectory('src/components/ui', &#123; recursive: true &#125;);

// Copy entire directory
await provider.copy('src', 'backup/src', &#123; overwrite: true &#125;);
```

### Pattern Matching and Search

```typescript
// List TypeScript files
const tsFiles = await provider.glob('**/*.ts');

// List all files excluding node_modules
const allFiles = await provider.glob('**/*', &#123;
  ignoreFilter: (file) =&gt; file.includes('node_modules'),
  includeDirectories: false
&#125;);

// Search for TODO comments
const results = await provider.grep('TODO', &#123;
  includeContent: &#123; linesBefore: 2, linesAfter: 2 &#125;
&#125;);
console.log(results);
/*
[
  &#123;
    file: 'notes/TODO.md',
    line: 1,
    match: '- [ ] Complete documentation',
    content: 'Project Notes\n- [ ] Complete documentation\n\nDone'
  &#125;
]
*/

// Traverse directory tree
for await (const path of provider.getDirectoryTree('src', &#123; recursive: true &#125;)) &#123;
  console.log(path);
&#125;
```

### File Watching

```typescript
const watcher = await provider.watch('.', &#123;
  ignoreFilter: (file) =&gt; file.includes('node_modules') || file.includes('.git'),
  pollInterval: 1000,
  stabilityThreshold: 2000
&#125;);

watcher.on('change', (path) =&gt; &#123;
  console.log(`File changed: $&#123;path&#125;`);
&#125;);

watcher.on('add', (path) =&gt; &#123;
  console.log(`File added: $&#123;path&#125;`);
&#125;);

watcher.on('unlink', (path) =&gt; &#123;
  console.log(`File removed: $&#123;path&#125;`);
&#125;);
```

### Shell Command Execution

```typescript
// Run a simple command
const result = await provider.executeCommand('ls -la', &#123;
  workingDirectory: 'src',
  timeoutSeconds: 30
&#125;);

if (result.ok) &#123;
  console.log('Command succeeded:', result.stdout);
&#125; else &#123;
  console.error('Command failed:', result.stderr);
&#125;

// Run a command with arguments
const cmdResult = await provider.executeCommand(['npm', ['list', '--depth=0']], &#123;
  workingDirectory: '.',
  timeoutSeconds: 60,
  env: &#123; NODE_ENV: 'production' &#125;
&#125;);
```

### Path Resolution

```typescript
// Relative paths are resolved relative to baseDirectory
const absPath = provider.relativeOrAbsolutePathToAbsolutePath('file.txt');
console.log(absPath); // "/path/to/project/file.txt"

const relPath = provider.relativeOrAbsolutePathToRelativePath(absPath);
console.log(relPath); // "file.txt"

// Absolute paths outside baseDirectory throw an error
try &#123;
  provider.relativeOrAbsolutePathToAbsolutePath('/etc/passwd');
&#125; catch (error) &#123;
  console.error(error.message); // "Path /etc/passwd is outside the root directory"
&#125;
```

## Plugin Integration

### Token Ring Application Plugin

The package can be used as a plugin within a Token Ring application:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import localFilesystemPlugin from '@tokenring-ai/local-filesystem';

const app = new TokenRingApp(&#123;
  config: &#123;
    filesystem: &#123;
      providers: &#123;
        local: &#123;
          type: 'local',
          baseDirectory: process.cwd(),
          defaultSelectedFiles: ['**/*.ts', '**/*.js', '**/*.md']
        &#125;
      &#125;
    &#125;
  &#125;
&#125;);

app.use(localFilesystemPlugin);
await app.start();
```

### Configuration Schema

```typescript
import &#123; z &#125; from 'zod';

const packageConfigSchema = z.object(&#123;
  filesystem: z.object(&#123;
    providers: z.record(
      z.object(&#123;
        type: z.literal('local'),
        baseDirectory: z.string(),
        defaultSelectedFiles: z.array(z.string()).optional()
      &#125;)
    ).optional()
  &#125;).optional()
&#125;);
```

## Configuration Options

### Provider Options

```typescript
interface LocalFileSystemProviderOptions &#123;
  baseDirectory: string;           // Base directory for all operations (required)
  defaultSelectedFiles?: string[]; // Default file patterns to select (optional)
&#125;
```

### Glob Options

```typescript
interface GlobOptions &#123;
  ignoreFilter?: (file: string) =&gt; boolean; // Filter function for ignored files
  includeDirectories?: boolean;              // Include directories in results
&#125;
```

### Grep Options

```typescript
interface GrepOptions &#123;
  ignoreFilter?: (file: string) =&gt; boolean; // Filter function for ignored files
  includeContent?: &#123;
    linesBefore?: number;  // Lines before match (default: 0)
    linesAfter?: number;   // Lines after match (default: 0)
  &#125;;
&#125;
```

### Watch Options

```typescript
interface WatchOptions &#123;
  ignoreFilter?: (file: string) =&gt; boolean; // Filter function for ignored files
  pollInterval?: number;                    // Polling interval in ms (default: 1000)
  stabilityThreshold?: number;              // Stability threshold in ms (default: 2000)
&#125;
```

### Execute Command Options

```typescript
interface ExecuteCommandOptions &#123;
  timeoutSeconds?: number;                    // Timeout in seconds (default: 60)
  env?: Record&lt;string, string&gt;;               // Environment variables
  workingDirectory?: string;                  // Working directory for command
&#125;
```

### Directory Tree Options

```typescript
interface DirectoryTreeOptions &#123;
  ignoreFilter?: (file: string) =&gt; boolean; // Filter function for ignored files
  recursive?: boolean;                      // Traverse recursively (default: true)
&#125;
```

## Type Definitions

### StatLike

```typescript
interface StatLike &#123;
  path: string;
  absolutePath: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
&#125;
```

### ExecuteCommandResult

```typescript
interface ExecuteCommandResult &#123;
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
&#125;
```

### GrepResult

```typescript
interface GrepResult &#123;
  file: string;
  line: number;
  match: string;
  content: string | null;
&#125;
```

## Error Handling

The provider includes comprehensive error handling:

- **Security**: Paths outside the base directory throw errors with descriptive messages
- **Existence checks**: Operations on non-existent paths throw appropriate errors
- **Type validation**: Operations on directories when files are expected (and vice versa) throw errors
- **Command execution**: Failed commands return detailed error information without throwing
- **File permissions**: Graceful handling of permission errors where possible

```typescript
// Security: Outside root directory
try &#123;
  await provider.relativeOrAbsolutePathToAbsolutePath('/etc/passwd');
&#125; catch (error) &#123;
  // Error: "Path /etc/passwd is outside the root directory"
&#125;

// Existence: Non-existent file
try &#123;
  await provider.readFile('missing.txt');
&#125; catch (error) &#123;
  // Error: "File missing.txt does not exist"
&#125;

// Type: Directory where file expected
try &#123;
  await provider.deleteFile('src');
&#125; catch (error) &#123;
  // Error: "Path src is not a file"
&#125;
```

## Testing

Run the test suite:

```bash
bun run test
```

The test suite includes integration tests covering:

- File operations (read, write, append, delete, rename)
- Directory operations (create, copy, glob, grep)
- Path resolution and security boundaries
- Command execution with various options
- File watching functionality
- Error handling and edge cases

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
