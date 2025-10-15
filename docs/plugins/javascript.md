# Javascript Plugin

JavaScript development and execution tools including npm management and ESLint integration.

## Overview

The `@tokenring-ai/javascript` package provides integration tools for JavaScript development and execution within the TokenRing AI agent ecosystem. It enables AI agents to perform tasks such as running JavaScript scripts in a sandboxed environment, installing and removing npm packages, and automatically fixing code style issues with ESLint.

## Key Features

- Run JavaScript scripts in ESM or CommonJS format
- Install and remove npm packages using detected package managers
- Automatically fix code style issues with ESLint
- Detect package manager from lockfiles (npm, yarn, pnpm)
- Secure execution with configurable timeouts

## Core Components

### Tools

**eslint**: Runs ESLint with auto-fix on JS/TS files
- Input: `{ files: string[] }`
- Returns: Array of `{ file, output?, error? }`
- Automatically applies fixes and writes changes

**installPackages**: Installs npm packages via detected manager
- Input: `{ packageName, isDev? }`
- Detects pnpm, yarn, or npm from lockfiles
- Returns: Command execution result

**removePackages**: Removes npm packages
- Input: `{ packageName }`
- Uses detected package manager
- Returns: Command execution result

**runJavaScriptScript**: Executes JavaScript code in temp file
- Input: `{ script, format='esm', timeoutSeconds=30, workingDirectory? }`
- Supports ESM or CommonJS formats
- Returns: `{ ok, exitCode?, stdout?, stderr?, format }`
- Cleans up temp files automatically

## Usage Examples

### Running a JS Script

```typescript
const result = await agent.tools.javascript.runJavaScriptScript.execute({
  script: 'console.log("Hello from JS!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
}, agent);

console.log(result.stdout); // "Hello from JS!\n4"
```

### Installing a Package

```typescript
const result = await agent.tools.javascript.installPackages.execute({
  packageName: 'lodash',
  isDev: false
}, agent);

if (result.ok) {
  console.log('Package installed:', result.stdout);
}
```

### Fixing Code with ESLint

```typescript
const results = await agent.tools.javascript.eslint.execute({
  files: ['src/main.ts']
}, agent);

results.forEach(r => {
  if (r.output) console.log(`${r.file}: ${r.output}`);
  else if (r.error) console.error(`${r.file}: ${r.error}`);
});
```

## Configuration Options

- **ESLint**: Configured with `fix: true` by default
- **Package Management**: Auto-detects from lockfiles
- **Script Execution**: 
  - `timeoutSeconds` (default 30s, clamped 5-300s)
  - `format` defaults to ESM
  - `workingDirectory` optional

## Dependencies

- `@tokenring-ai/agent` (^0.1.0): Agent framework
- `@tokenring-ai/filesystem` (^0.1.0): Filesystem operations
- `eslint` (^9.33.0): Linting and fixing
- `execa` (^9.6.0): Command execution
- `jiti` (^2.5.1): Runtime transpilation
- `jscodeshift` (^17.3.0): Code transformation
- `zod`: Schema validation
