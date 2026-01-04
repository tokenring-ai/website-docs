# JavaScript Plugin for TokenRing AI

## Overview

The JavaScript plugin provides comprehensive JavaScript/TypeScript development tools for TokenRing AI agents. It integrates with the TokenRing framework to enable code linting, package management, and script execution capabilities. This plugin serves as a specialized toolkit for JavaScript development workflows within the TokenRing ecosystem.

## Key Features

- **Automated Code Linting**: Run ESLint with auto-fix capabilities on JavaScript/TypeScript files
- **Package Management**: Install and remove packages using detected package managers (npm, yarn, pnpm)
- **Script Execution**: Execute JavaScript code in both ESM and CommonJS formats with timeout controls
- **Cross-Platform Compatibility**: Works with multiple package managers and module formats
- **Temporary File Management**: Automatically handles temporary script files with cleanup
- **Error Handling**: Comprehensive error reporting and logging with agent integration

## Core Components

### Plugin Registration

The plugin registers tools with the TokenRing chat service during installation:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;```

### Available Tools

#### 1. eslint (`javascript_eslint`)

**Description**: Runs ESLint with `--fix` option on JavaScript/TypeScript files to automatically fix code style issues.

**Parameters**:
- `files` (string[]): Array of file paths to apply ESLint fixes to

**Returns**: Array of `{ file: string; output?: string; error?: string }` objects

**Functionality**:
- Reads source files from the filesystem
- Runs ESLint with fix enabled
- Writes fixed code back to files when changes are detected
- Provides detailed logging through the agent system
- Handles errors on a per-file basis

#### 2. installPackages (`javascript_installPackages`)

**Description**: Installs packages using the detected package manager (npm, yarn, or pnpm).

**Parameters**:
- `packageName` (string): Package name(s) to install (space-separated for multiple packages)
- `isDev` (boolean, optional): Install as dev dependency (default: false)

**Returns**: Command execution result with stdout, stderr, and exit code

**Package Manager Detection**:
- Automatically detects package manager based on lockfile presence
- Supports pnpm, yarn, and npm
- Throws error if no supported lockfile is found

#### 3. removePackages (`javascript_removePackages`)

**Description**: Removes packages using the detected package manager.

**Parameters**:
- `packageName` (string): Package name(s) to remove (space-separated for multiple packages)

**Returns**: Command execution result with stdout, stderr, and exit code

**Functionality**:
- Detects package manager from lockfiles
- Executes appropriate removal command
- Provides error handling for missing lockfiles

#### 4. runJavaScriptScript (`javascript_runJavaScriptScript`)

**Description**: Executes JavaScript code in a temporary file using Node.js with timeout control.

**Parameters**:
- `script` (string): JavaScript code to execute
- `format` ('esm' | 'commonjs', optional): Module format (default: 'esm')
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30, min: 5, max: 300)

**Returns**: `{ ok: boolean; exitCode?: number; stdout?: string; stderr?: string; format: string }`

**Features**:
- Creates temporary files for script execution
- Supports both ESM and CommonJS formats
- Implements timeout controls
- Automatically cleans up temporary files
- Provides execution results with exit codes

## API Reference

### Tool: eslint (`javascript_eslint`)

```typescript
interface EslintResult {
  file: string;
  output?: string;
  error?: string;
}

async function eslint(
  { files }: { files: string[] },
  agent: Agent
): Promise<EslintResult[]>;

// Example usage
const results = await agent.tools.javascript_eslint.execute({
  files: ['src/main.ts', 'utils/helper.js']
}, agent);

results.forEach(result => {
  if (result.output) {
    console.log(`${result.file}: ${result.output}`);
  } else if (result.error) {
    console.error(`${result.file}: ${result.error}`);
  }
});
```

### Tool: installPackages (`javascript_installPackages`)

```typescript
interface InstallPackagesArgs {
  packageName: string;
  isDev?: boolean;
}

async function installPackages(
  { packageName, isDev }: InstallPackagesArgs,
  agent: Agent
): Promise<ExecuteCommandResult>;

// Example usage
const result = await agent.tools.javascript_installPackages.execute({
  packageName: 'lodash',
  isDev: false
}, agent);

if (result.ok) {
  console.log('Package installed successfully');
}
```

### Tool: removePackages (`javascript_removePackages`)

```typescript
interface RemovePackagesArgs {
  packageName: string;
}

async function removePackages(
  { packageName }: RemovePackagesArgs,
  agent: Agent
): Promise<ExecuteCommandResult>;

// Example usage
const result = await agent.tools.javascript_removePackages.execute({
  packageName: 'lodash'
}, agent);

if (result.ok) {
  console.log('Package removed successfully');
}
```

### Tool: runJavaScriptScript (`javascript_runJavaScriptScript`)

```typescript
interface RunJavaScriptResult {
  ok: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  format: 'esm' | 'commonjs';
}

async function runJavaScriptScript(
  { script, format, timeoutSeconds }: {
    script: string;
    format?: 'esm' | 'commonjs';
    timeoutSeconds?: number;
  },
  agent: Agent
): Promise<RunJavaScriptResult>;

// Example usage
const result = await agent.tools.javascript_runJavaScriptScript.execute({
  script: 'console.log("Hello from JavaScript!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
}, agent);

console.log('Exit code:', result.exitCode);
console.log('Output:', result.stdout);
if (result.stderr) {
  console.error('Error:', result.stderr);
}
```

## Usage Examples

### Basic JavaScript Execution

```typescript
// Run a simple JavaScript script
const result = await agent.tools.javascript_runJavaScriptScript.execute({
  script: 'console.log("Hello, World!"); console.log(2 * 2);',
  format: 'esm',
  timeoutSeconds: 5
}, agent);

if (result.ok) {
  console.log('Script executed successfully');
  console.log('Output:', result.stdout);
}
```

### Package Installation

```typescript
// Install a production package
const installResult = await agent.tools.javascript_installPackages.execute({
  packageName: 'lodash',
  isDev: false
}, agent);

if (installResult.ok) {
  console.log('Package installed successfully');
  console.log('Output:', installResult.stdout);
}

// Install a dev dependency
const devInstallResult = await agent.tools.javascript_installPackages.execute({
  packageName: 'typescript',
  isDev: true
}, agent);
```

### Package Removal

```typescript
// Remove a package
const removeResult = await agent.tools.javascript_removePackages.execute({
  packageName: 'lodash'
}, agent);

if (removeResult.ok) {
  console.log('Package removed successfully');
  console.log('Output:', removeResult.stdout);
}
```

### Code Linting and Fixing

```typescript
// Run ESLint with auto-fix on multiple files
const lintResults = await agent.tools.javascript_eslint.execute({
  files: ['src/main.ts', 'utils/helper.js', 'components/button.tsx']
}, agent);

lintResults.forEach(result => {
  if (result.output) {
    console.log(`${result.file}: ${result.output}`);
  } else if (result.error) {
    console.error(`${result.file}: ${result.error}`);
  }
});
```

## Configuration

The plugin automatically detects package managers based on lockfile presence:

- **pnpm**: Detected from `pnpm-lock.yaml`
- **yarn**: Detected from `yarn.lock`
- **npm**: Detected from `package-lock.json`

### Timeout Configuration

The `runJavaScriptScript` tool has configurable timeout:

- **Default**: 30 seconds
- **Minimum**: 5 seconds
- **Maximum**: 300 seconds

## Integration

### With TokenRing Agent System

The plugin integrates with TokenRing agents by registering tools that can be called through the agent's tool system:

```typescript
// Agent can access all JavaScript tools
const javascriptTools = agent.tools;

// Execute any of the available tools
await javascriptTools.javascript_eslint.execute({ files: ['file.ts'] }, agent);
await javascriptTools.javascript_installPackages.execute({ packageName: 'lodash' }, agent);
await javascriptTools.javascript_removePackages.execute({ packageName: 'lodash' }, agent);
await javascriptTools.javascript_runJavaScriptScript.execute({ script: 'console.log("test")' }, agent);
```

### With Filesystem Service

The plugin relies on the TokenRing filesystem service for:

- Reading and writing files
- Executing commands
- Managing temporary files
- Detecting package manager lockfiles

### Error Handling

All tools provide comprehensive error handling:

- Per-file error reporting for ESLint
- Package manager detection errors
- Timeout handling for script execution
- Input validation and error messages

## Development

### Testing

```bash
bun run test        # Run tests
bun run test:watch  # Watch mode
bun run test:coverage  # Coverage report
```

### Build

```bash
bun run build  # Type checking
```

## Package Structure

```
pkg/javascript/
├── index.ts              # Package exports
├── plugin.ts             # TokenRing plugin registration
├── README.md             # Package documentation
├── package.json          # Dependencies and metadata
├── tools.ts              # Tool exports
├── tools/
│   ├── eslint.ts         # ESLint tool implementation
│   ├── installPackages.ts # Package installation tool
│   ├── removePackages.ts # Package removal tool
│   └── runJavaScriptScript.ts # Script execution tool
└── vitest.config.ts      # Test configuration
```

## License

MIT License