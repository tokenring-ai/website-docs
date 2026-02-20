# JavaScript Plugin

## Overview

The JavaScript plugin provides comprehensive JavaScript/TypeScript development tools for TokenRing AI agents. It integrates with the TokenRing framework to enable code linting, package management, and script execution capabilities. This plugin serves as a specialized toolkit for JavaScript development workflows within the TokenRing ecosystem.

## Key Features

- **Automated Code Linting**: Run ESLint with auto-fix capabilities on JavaScript/TypeScript files
- **Package Management**: Install and remove packages using detected package managers (bun, pnpm, npm, yarn)
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
      chatService.addTools(tools)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Available Tools

#### 1. eslint (`javascript_eslint`)

**Description**: Runs ESLint with `--fix` option on JavaScript/TypeScript files to automatically fix code style issues.

**Parameters**:
- `files` (string[]): Array of file paths to apply ESLint fixes to

**Returns**: Array of `{ file: string; output?: string; error?: string }` objects
- `file`: Path of the file processed
- `output`: "Successfully fixed" or "No changes needed"
- `error`: Error message if fix failed

**Functionality**:
- Reads source files from the filesystem
- Runs ESLint with fix enabled
- Writes fixed code back to files when changes are detected
- Provides detailed logging through the agent system
- Handles errors on a per-file basis
- Returns JSON result with array of results

#### 2. installPackages (`javascript_installPackages`)

**Description**: Installs packages using the detected package manager (bun, pnpm, npm, or yarn).

**Parameters**:
- `packageName` (string): Package name(s) to install (space-separated for multiple packages)

**Returns**: `string`
- Returns the raw output from the package manager command
- On success: "Package {packageName} added"
- On failure: "Package {packageName} could not be added:\n{error output}"

**Package Manager Detection**:
- Automatically detects package manager based on lockfile presence
- Supports bun, pnpm, yarn, and npm
- Throws error if no supported lockfile is found

#### 3. removePackages (`javascript_removePackages`)

**Description**: Removes packages using the detected package manager (bun, pnpm, npm, or yarn).

**Parameters**:
- `packageName` (string): Package name(s) to remove (space-separated for multiple packages)

**Returns**: `string`
- Returns the raw output from the package manager command
- On success: "Package {packageName} removed"
- On failure: "Package {packageName} could not be removed:\n{error output}"

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

**Returns**: `{ ok: boolean; exitCode?: number; output: string; format: "esm" | "commonjs" }`
- `ok`: True if execution succeeded (exitCode is 0)
- `exitCode`: Exit code from the script execution
- `output`: Command output (stdout) or error message (stderr)
- `format`: The module format used ('esm' or 'commonjs')

**Features**:
- Creates temporary files for script execution (.mjs for ESM, .cjs for CommonJS)
- Supports both ESM and CommonJS formats
- Implements timeout controls (5-300 seconds)
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
): Promise<TokenRingToolJSONResult<EslintResult[]>>;

// Example usage
const results = await agent.executeTool('javascript_eslint', {
  files: ['src/main.ts', 'utils/helper.js']
});

for (const result of results.data) {
  if (result.output) {
    agent.infoMessage(`${result.file}: ${result.output}`);
  } else if (result.error) {
    agent.errorMessage(`${result.file}: ${result.error}`);
  }
}
```

### Tool: installPackages (`javascript_installPackages`)

```typescript
async function installPackages(
  { packageName }: { packageName: string },
  agent: Agent
): Promise<string>;

// Example usage
const result = await agent.executeTool('javascript_installPackages', {
  packageName: 'lodash'
});

if (result.includes('added')) {
  agent.infoMessage('Package installed successfully');
} else if (result.includes('could not be added')) {
  agent.errorMessage(result);
}
```

### Tool: removePackages (`javascript_removePackages`)

```typescript
async function removePackages(
  { packageName }: { packageName: string },
  agent: Agent
): Promise<string>;

// Example usage
const result = await agent.executeTool('javascript_removePackages', {
  packageName: 'lodash'
});

if (result.includes('removed')) {
  agent.infoMessage('Package removed successfully');
} else if (result.includes('could not be removed')) {
  agent.errorMessage(result);
}
```

### Tool: runJavaScriptScript (`javascript_runJavaScriptScript`)

```typescript
interface RunJavaScriptResult {
  ok: boolean;
  exitCode?: number;
  output: string;
  format: "esm" | "commonjs";
}

async function runJavaScriptScript(
  { script, format, timeoutSeconds }: {
    script: string;
    format?: "esm" | "commonjs";
    timeoutSeconds?: number;
  },
  agent: Agent
): Promise<TokenRingToolJSONResult<RunJavaScriptResult>>;

// Example usage
const result = await agent.executeTool('javascript_runJavaScriptScript', {
  script: 'console.log("Hello from JavaScript!"); console.log(2 + 2);',
  format: "esm",
  timeoutSeconds: 10
});

if (result.data.ok) {
  agent.infoMessage(`Exit code: ${result.data.exitCode}`);
  agent.infoMessage(`Output: ${result.data.output}`);
  agent.infoMessage(`Format: ${result.data.format}`);
} else {
  agent.errorMessage(`Error: ${result.data.output}`);
}

// CommonJS example
const cjsResult = await agent.executeTool('javascript_runJavaScriptScript', {
  script: 'const sum = (a, b) => a + b; console.log(sum(1, 2));',
  format: "commonjs",
  timeoutSeconds: 30
});
```

## Usage Examples

### Basic JavaScript Execution

```typescript
// Run a simple JavaScript script
const result = await agent.executeTool('javascript_runJavaScriptScript', {
  script: 'console.log("Hello, World!"); console.log(2 * 2);',
  format: "esm",
  timeoutSeconds: 5
});

if (result.data.ok) {
  agent.infoMessage('Script executed successfully');
  agent.infoMessage(`Output: ${result.data.output}`);
} else {
  agent.errorMessage(`Script failed: ${result.data.output}`);
}
```

### Package Installation

```typescript
// Install a package
const installResult = await agent.executeTool('javascript_installPackages', {
  packageName: 'lodash'
});

if (installResult.includes('added')) {
  agent.infoMessage('Package installed successfully');
} else {
  agent.errorMessage(installResult);
}
```

### Package Removal

```typescript
// Remove a package
const removeResult = await agent.executeTool('javascript_removePackages', {
  packageName: 'lodash'
});

if (removeResult.includes('removed')) {
  agent.infoMessage('Package removed successfully');
} else {
  agent.errorMessage(removeResult);
}
```

### Code Linting and Fixing

```typescript
// Run ESLint with auto-fix on multiple files
const lintResults = await agent.executeTool('javascript_eslint', {
  files: ['src/main.ts', 'utils/helper.js', 'components/button.tsx']
});

for (const result of lintResults.data) {
  if (result.output) {
    agent.infoMessage(`${result.file}: ${result.output}`);
  } else if (result.error) {
    agent.errorMessage(`${result.file}: ${result.error}`);
  }
}
```

## Configuration

The plugin automatically detects package managers based on lockfile presence:

- **bun**: Detected from `bun.lock`
- **pnpm**: Detected from `pnpm-lock.yaml`
- **yarn**: Detected from `yarn.lock`
- **npm**: Detected from `package-lock.json`

### Timeout Configuration

The `runJavaScriptScript` tool has configurable timeout:

- **Default**: 30 seconds
- **Minimum**: 5 seconds
- **Maximum**: 300 seconds

### Plugin Configuration

The plugin currently does not require any configuration:

```typescript
const configSchema = z.object({});
```

## Integration

### With TokenRing Agent System

The plugin integrates with TokenRing agents by registering tools that can be called through the agent's tool system:

```typescript
// Agent can access all JavaScript tools
const javascriptTools = agent.tools;

// Execute any of the available tools
await agent.executeTool('javascript_eslint', {
  files: ['file.ts']
});

await agent.executeTool('javascript_installPackages', {
  packageName: 'lodash'
});

await agent.executeTool('javascript_removePackages', {
  packageName: 'lodash'
});

await agent.executeTool('javascript_runJavaScriptScript', {
  script: 'console.log("test")'
});
```

### With Filesystem Service

The plugin relies on the TokenRing filesystem service for:

- Reading and writing files
- Executing commands
- Managing temporary files
- Detecting package manager lockfiles

### With Terminal Service

The plugin uses the TokenRing terminal service for:

- Executing package manager commands (bun, pnpm, yarn, npm)
- Running JavaScript scripts via Node.js
- Command execution with timeout support

### Error Handling

All tools provide comprehensive error handling:

- Per-file error reporting for ESLint
- Package manager detection errors
- Timeout handling for script execution
- Input validation and error messages
- All errors are prefixed with the tool name for identification

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

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: Plugin framework
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/agent`: Agent system
- `@tokenring-ai/filesystem`: File operations and command execution
- `@tokenring-ai/terminal`: Terminal service for command execution
- `eslint`: For code linting and fixing
- `execa`: For node command execution
- `jiti`: For TypeScript execution
- `jscodeshift`: For code transformation
- `zod`: For schema validation

### Development Dependencies

- `vitest`: For unit testing
- `typescript`: For TypeScript compilation

## License

MIT License - see [LICENSE](https://github.com/tokenring/ai/blob/main/pkg/javascript/LICENSE) file for details.
