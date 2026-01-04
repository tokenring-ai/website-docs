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
import &#123;TokenRingPlugin&#125; from "@tokenring-ai/app";
import &#123;ChatService&#125; from "@tokenring-ai/chat";
import &#123;z&#125; from "zod";
import packageJSON from './package.json' with &#123;type: 'json'&#125;;
import tools from "./tools.ts";

const packageConfigSchema = z.object(&#123;&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    app.waitForService(ChatService, chatService =&gt;
      chatService.addTools(packageJSON.name, tools)
    );
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;```

### Available Tools

#### 1. eslint (`javascript_eslint`)

**Description**: Runs ESLint with `--fix` option on JavaScript/TypeScript files to automatically fix code style issues.

**Parameters**:
- `files` (string[]): Array of file paths to apply ESLint fixes to

**Returns**: Array of `&#123; file: string; output?: string; error?: string &#125;` objects

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

**Returns**: `&#123; ok: boolean; exitCode?: number; stdout?: string; stderr?: string; format: string &#125;`

**Features**:
- Creates temporary files for script execution
- Supports both ESM and CommonJS formats
- Implements timeout controls
- Automatically cleans up temporary files
- Provides execution results with exit codes

## API Reference

### Tool: eslint (`javascript_eslint`)

```typescript
interface EslintResult &#123;
  file: string;
  output?: string;
  error?: string;
&#125;

async function eslint(
  &#123; files &#125;: &#123; files: string[] &#125;,
  agent: Agent
): Promise&lt;EslintResult[]&gt;;

// Example usage
const results = await agent.tools.javascript_eslint.execute(&#123;
  files: ['src/main.ts', 'utils/helper.js']
&#125;, agent);

results.forEach(result =&gt; &#123;
  if (result.output) &#123;
    console.log(`$&#123;result.file&#125;: $&#123;result.output&#125;`);
  &#125; else if (result.error) &#123;
    console.error(`$&#123;result.file&#125;: $&#123;result.error&#125;`);
  &#125;
&#125;);
```

### Tool: installPackages (`javascript_installPackages`)

```typescript
interface InstallPackagesArgs &#123;
  packageName: string;
  isDev?: boolean;
&#125;

async function installPackages(
  &#123; packageName, isDev &#125;: InstallPackagesArgs,
  agent: Agent
): Promise&lt;ExecuteCommandResult&gt;;

// Example usage
const result = await agent.tools.javascript_installPackages.execute(&#123;
  packageName: 'lodash',
  isDev: false
&#125;, agent);

if (result.ok) &#123;
  console.log('Package installed successfully');
&#125;
```

### Tool: removePackages (`javascript_removePackages`)

```typescript
interface RemovePackagesArgs &#123;
  packageName: string;
&#125;

async function removePackages(
  &#123; packageName &#125;: RemovePackagesArgs,
  agent: Agent
): Promise&lt;ExecuteCommandResult&gt;;

// Example usage
const result = await agent.tools.javascript_removePackages.execute(&#123;
  packageName: 'lodash'
&#125;, agent);

if (result.ok) &#123;
  console.log('Package removed successfully');
&#125;
```

### Tool: runJavaScriptScript (`javascript_runJavaScriptScript`)

```typescript
interface RunJavaScriptResult &#123;
  ok: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  format: 'esm' | 'commonjs';
&#125;

async function runJavaScriptScript(
  &#123; script, format, timeoutSeconds &#125;: &#123;
    script: string;
    format?: 'esm' | 'commonjs';
    timeoutSeconds?: number;
  &#125;,
  agent: Agent
): Promise&lt;RunJavaScriptResult&gt;;

// Example usage
const result = await agent.tools.javascript_runJavaScriptScript.execute(&#123;
  script: 'console.log("Hello from JavaScript!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
&#125;, agent);

console.log('Exit code:', result.exitCode);
console.log('Output:', result.stdout);
if (result.stderr) &#123;
  console.error('Error:', result.stderr);
&#125;
```

## Usage Examples

### Basic JavaScript Execution

```typescript
// Run a simple JavaScript script
const result = await agent.tools.javascript_runJavaScriptScript.execute(&#123;
  script: 'console.log("Hello, World!"); console.log(2 * 2);',
  format: 'esm',
  timeoutSeconds: 5
&#125;, agent);

if (result.ok) &#123;
  console.log('Script executed successfully');
  console.log('Output:', result.stdout);
&#125;
```

### Package Installation

```typescript
// Install a production package
const installResult = await agent.tools.javascript_installPackages.execute(&#123;
  packageName: 'lodash',
  isDev: false
&#125;, agent);

if (installResult.ok) &#123;
  console.log('Package installed successfully');
  console.log('Output:', installResult.stdout);
&#125;

// Install a dev dependency
const devInstallResult = await agent.tools.javascript_installPackages.execute(&#123;
  packageName: 'typescript',
  isDev: true
&#125;, agent);
```

### Package Removal

```typescript
// Remove a package
const removeResult = await agent.tools.javascript_removePackages.execute(&#123;
  packageName: 'lodash'
&#125;, agent);

if (removeResult.ok) &#123;
  console.log('Package removed successfully');
  console.log('Output:', removeResult.stdout);
&#125;
```

### Code Linting and Fixing

```typescript
// Run ESLint with auto-fix on multiple files
const lintResults = await agent.tools.javascript_eslint.execute(&#123;
  files: ['src/main.ts', 'utils/helper.js', 'components/button.tsx']
&#125;, agent);

lintResults.forEach(result =&gt; &#123;
  if (result.output) &#123;
    console.log(`$&#123;result.file&#125;: $&#123;result.output&#125;`);
  &#125; else if (result.error) &#123;
    console.error(`$&#123;result.file&#125;: $&#123;result.error&#125;`);
  &#125;
&#125;);
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
await javascriptTools.javascript_eslint.execute(&#123; files: ['file.ts'] &#125;, agent);
await javascriptTools.javascript_installPackages.execute(&#123; packageName: 'lodash' &#125;, agent);
await javascriptTools.javascript_removePackages.execute(&#123; packageName: 'lodash' &#125;, agent);
await javascriptTools.javascript_runJavaScriptScript.execute(&#123; script: 'console.log("test")' &#125;, agent);
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