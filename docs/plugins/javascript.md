# Javascript Plugin

JavaScript development and execution tools including npm management, ESLint integration, and script execution.

## Overview

The `@tokenring-ai/javascript` package provides comprehensive JavaScript/TypeScript development tools for the TokenRing AI agent ecosystem. It enables AI agents to perform tasks such as running JavaScript scripts in a sandboxed environment, installing and removing npm packages, and automatically fixing code style issues with ESLint. This plugin integrates seamlessly with the TokenRing agent system to provide development capabilities directly within chat interfaces.

## Key Features

- **Script Execution**: Run JavaScript code in ESM or CommonJS format with timeout control
- **Package Management**: Install and remove npm packages using detected package managers (npm, yarn, pnpm)
- **Code Quality**: Automatically fix code style issues with ESLint
- **Secure Execution**: Sandbox environment with configurable timeouts
- **Package Manager Detection**: Auto-detect from lockfiles (pnpm-lock.yaml, yarn.lock, package-lock.json)

## Core Components

### Tools

#### `eslint` (javascript_eslint)

**Description**: Runs ESLint with auto-fix on JavaScript/TypeScript files to automatically fix code style issues.

**Input Schema**:
```typescript
interface EslintInput {
  files: string[]; // List of JS/TS file paths to apply ESLint fixes to
}
```

**Output**: Array of `{ file: string; output?: string; error?: string }`

**Features**:
- Automatically fixes code style issues
- Writes fixed code back to files
- Supports both .js and .ts files
- Provides detailed success/error feedback

#### `installPackages` (javascript_installPackages)

**Description**: Installs packages using the detected package manager.

**Input Schema**:
```typescript
interface InstallPackagesInput {
  packageName: string; // Package name(s) to install (space-separated)
  isDev?: boolean;     // Install as dev dependency (default: false)
}
```

**Output**: Command execution result with stdout, stderr, and exit code

**Package Manager Detection**:
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn  
- `package-lock.json` → npm

#### `removePackages` (javascript_removePackages)

**Description**: Removes packages using the detected package manager.

**Input Schema**:
```typescript
interface RemovePackagesInput {
  packageName: string; // Package name(s) to remove (space-separated)
}
```

**Output**: Command execution result with stdout, stderr, and exit code

#### `runJavaScriptScript` (javascript_runJavaScriptScript)

**Description**: Executes JavaScript code in a temporary file using Node.js with timeout control.

**Input Schema**:
```typescript
interface RunJavaScriptScriptInput {
  script: string;            // JavaScript code to execute
  format?: 'esm' | 'commonjs'; // Module format (default: 'esm')
  timeoutSeconds?: number;    // Timeout in seconds (default: 30, min: 5, max: 300)
}
```

**Output**: `{ ok: boolean; exitCode?: number; stdout?: string; stderr?: string; format: string }`

**Features**:
- Supports both ESM and CommonJS formats
- Creates temporary files that are automatically cleaned up
- Configurable timeout (5-300 seconds)
- Returns execution results with exit codes and output

## Usage Examples

### Running a JavaScript Script

```typescript
const result = await agent.tools.javascript.runJavaScriptScript.execute({
  script: 'console.log("Hello from JS!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
}, agent);

console.log(result.stdout); // "Hello from JS!\n4"
if (result.stderr) {
  console.error('Error:', result.stderr);
}
```

### Installing a Package

```typescript
const result = await agent.tools.javascript.installPackages.execute({
  packageName: 'lodash',
  isDev: false
}, agent);

if (result.ok) {
  console.log('Package installed successfully');
}
```

### Fixing Code with ESLint

```typescript
const results = await agent.tools.javascript.eslint.execute({
  files: ['src/main.ts', 'utils/helper.js']
}, agent);

results.forEach(r => {
  if (r.output) {
    console.log(`${r.file}: ${r.output}`);
  } else if (r.error) {
    console.error(`${r.file}: ${r.error}`);
  }
});
```

### Removing a Package

```typescript
const result = await agent.tools.javascript.removePackages.execute({
  packageName: 'lodash'
}, agent);

if (result.ok) {
  console.log('Package removed successfully');
}
```

## Configuration Options

### Script Execution
- **Timeout**: Default 30 seconds, configurable between 5-300 seconds
- **Format**: Defaults to ESM, supports CommonJS
- **Working Directory**: Executes in the project root directory

### Package Management
- **Auto-detection**: Automatically detects package manager from lockfiles
- **Dev Dependencies**: Optional flag to install as dev dependency
- **Multiple Packages**: Supports space-separated package names

### ESLint
- **Fix Mode**: Enabled by default to automatically fix issues
- **File Types**: Supports .js, .ts, .jsx, .tsx files
- **Configuration**: Uses standard ESLint configuration from project

## Package Manager Detection

The package automatically detects the appropriate package manager based on lockfile presence:

| Lockfile | Package Manager | Command Example |
|----------|----------------|----------------|
| `pnpm-lock.yaml` | pnpm | `pnpm add lodash` |
| `yarn.lock` | yarn | `yarn add lodash` |
| `package-lock.json` | npm | `npm install lodash` |

If no supported lockfile is found, an error will be thrown indicating that the package manager cannot be determined.

## Dependencies

- `@tokenring-ai/agent` (^0.2.0): Agent framework integration
- `@tokenring-ai/filesystem` (^0.2.0): Filesystem operations
- `@tokenring-ai/chat` (^0.2.0): Chat service integration
- `eslint` (^9.39.2): Code linting and fixing
- `execa` (^9.6.1): Command execution
- `jiti` (^2.6.1): Runtime transpilation
- `jscodeshift` (^17.3.0): Code transformation utilities
- `zod`: Schema validation

## Testing

The package includes comprehensive tests using Vitest:

```bash
bun run test                 # Run all tests
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Generate coverage report
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

## Integration

This package integrates with the TokenRing application framework by registering tools with the ChatService:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";

export default {
  name: "@tokenring-ai/javascript",
  version: "0.2.0",
  description: "TokenRing Coder Javascript Integration",
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService => 
      chatService.addTools("@tokenring-ai/javascript", tools)
    );
  }
} satisfies TokenRingPlugin;
```

## License

MIT License