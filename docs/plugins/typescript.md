# TypeScript Package

## Overview

The `@tokenring-ai/typescript` package provides TypeScript language validation support for the TokenRing ecosystem. It integrates with the FileSystemService and AgentLifecycleService to register a TypeScript validation service and lifecycle hooks, enabling automatic syntax checking and error detection for TypeScript files after write operations.

This package leverages the TypeScript compiler API to provide accurate syntax analysis for multiple TypeScript file types including standard TypeScript files, TypeScript JSX files, ES modules, and CommonJS modules.

## Key Features

- **TypeScript Syntax Validation**: Real-time validation of TypeScript, TSX, MTS, and CTS files
- **FileSystemService Integration**: Seamless integration with the TokenRing file management system
- **Error Reporting**: Detailed error messages with line and column information
- **Multiple File Type Support**: Supports `.ts`, `.tsx`, `.mts`, and `.cts` file extensions
- **Compiler API Integration**: Leverages the TypeScript compiler API for accurate syntax analysis
- **Lifecycle Hooks**: Automatic validation of TypeScript files after write operations
- **Zero Configuration**: Automatically registers validators upon plugin installation

## Chat Commands

This package does not define any chat commands.

## Tools

This package does not define any tools.

## Configuration

The `@tokenring-ai/typescript` package requires no configuration. The plugin schema is defined as an empty object:

```typescript
const packageConfigSchema = z.object({});
```

All TypeScript file extensions are automatically registered upon plugin installation:

- `.ts` - Standard TypeScript files
- `.tsx` - TypeScript JSX files
- `.mts` - TypeScript ES modules
- `.cts` - TypeScript CommonJS modules

### Environment Variables

This package does not require any environment variables.

## User Guide

### Installation

Install the package using bun:

```bash
bun add @tokenring-ai/typescript
```

### Package Dependencies

**Production Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/filesystem` | 0.2.0 | File management and validation |
| `@tokenring-ai/lifecycle` | 0.2.0 | Lifecycle hook management |
| `typescript` | ^6.0.2 | TypeScript compiler API |
| `zod` | ^4.3.6 | Schema validation |

**Development Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Testing framework |

### Basic Usage

Install the plugin in your TokenRing application:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// TypeScript validators are now registered and will validate files after write
```

#### Service Usage Example

You can also use the TypescriptService directly:

```typescript
import { TypescriptService } from '@tokenring-ai/typescript';

const service = new TypescriptService();

const content = `
const x: number = "string"; // Type error
`;

const result = service.validateFile('example.ts', content);

if (result.valid) {
  console.log('No syntax errors');
} else {
  console.log('Syntax errors found:');
  console.log(result.result);
}
```

#### FileSystemService Integration Example

The plugin automatically integrates with FileSystemService through the lifecycle hooks:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import FileSystemService from '@tokenring-ai/filesystem/FileSystemService';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// Access the file service and validate files
const fileService = await app.getService(FileSystemService);

// Files will be automatically validated after write operations
```

### Best Practices

#### 1. Install Early in Application Lifecycle

Install the TypeScript plugin early in your application initialization to ensure validators are available for all file operations:

```typescript
const app = new TokenRingApp();
await app.install(typescriptPlugin); // Install early
// ... other initialization
```

#### 2. Use with File Operations

When performing file operations, leverage the registered validators:

```typescript
const fileService = await app.getService(FileSystemService);

// Validation happens automatically for registered extensions
await fileService.writeFile('example.ts', content);
```

#### 3. Handle Validation Results

Always check validation results before proceeding with code execution:

```typescript
const result = service.validateFile(filePath, content);

if (result.valid) {
  // Proceed with code execution
} else {
  // Handle validation errors
  console.log('Validation failed:', result.result);
}
```

#### 4. Provide Clear Error Messages

The validator returns formatted error messages. Use these directly in user interfaces:

```typescript
const result = service.validateFile(filePath, content);

if (!result.valid) {
  const errorLines = result.result.split('\n');
  for (const line of errorLines) {
    console.log(`Error: ${line}`);
  }
}
```

## Developer Reference

### Core Components

#### TypescriptService

The main service that implements TypeScript validation using the TypeScript compiler API.

**Type Signature:**

```typescript
class TypescriptService implements TokenRingService {
  readonly name = "TypescriptService";
  readonly description = "A service that implements TypeScript validation and linting using the TypeScript compiler.";

  validateFile(filePath: string, content: string): Required<FileValidationResult>
}
```

**Functionality:**

- Implements the `TokenRingService` interface
- Validates TypeScript syntax using the compiler API
- Determines the appropriate script kind based on file extension
- Creates a TypeScript source file and extracts parse diagnostics
- Returns formatted error messages with location information

**Supported File Extensions:**

The service supports the following TypeScript file extensions via the `TS_EXTENSIONS` constant:

| Extension | ScriptKind | Description |
|-----------|------------|-------------|
| `.ts` | `ts.ScriptKind.TS` | Standard TypeScript files |
| `.tsx` | `ts.ScriptKind.TSX` | TypeScript JSX files |
| `.mts` | `ts.ScriptKind.TS` | TypeScript ES modules |
| `.cts` | `ts.ScriptKind.TS` | TypeScript CommonJS modules |

**Error Format:**

```text
line:column error error_message
```

**Example Output:**

```text
1:10 error Type 'string' is not assignable to type 'number'.
```

### Services

#### TypescriptService Implementation

The `TypescriptService` is the core service that provides TypeScript validation functionality:

```typescript
import type { TokenRingService } from "@tokenring-ai/app/types";
import type { FileValidationResult } from "@tokenring-ai/filesystem/util/runFileValidator";
import ts from "typescript";

export const TS_EXTENSIONS: Record<string, ts.ScriptKind> = {
  ".ts": ts.ScriptKind.TS,
  ".tsx": ts.ScriptKind.TSX,
  ".mts": ts.ScriptKind.TS,
  ".cts": ts.ScriptKind.TS,
};

export class TypescriptService implements TokenRingService {
  readonly name = "TypescriptService";
  readonly description = "A service that implements TypeScript validation and linting using the TypeScript compiler.";

  validateFile(filePath: string, content: string): Required<FileValidationResult> {
    const ext = filePath.slice(filePath.lastIndexOf("."));
    const scriptKind = TS_EXTENSIONS[ext] ?? ts.ScriptKind.TS;

    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext, true, scriptKind);
    const diagnostics = ((sourceFile as any).parseDiagnostics as ts.Diagnostic[]) ?? [];

    const syntaxDiagnostics = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
    if (syntaxDiagnostics.length === 0) return { valid: true, result: "No issues found." };

    const result = syntaxDiagnostics
      .map(d => {
        const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
        const loc = pos ? `${pos.line + 1}:${pos.character + 1}` : "?:?";
        return `${loc} error ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
      })
      .join("\n");

    return { valid: false, result };
  }
}
```

### Plugin

The plugin registers the TypescriptService and lifecycle hooks with the application.

**Plugin Configuration:**

```typescript
const packageConfigSchema = z.object({});
```

**Plugin Interface:**

```typescript
export default {
  name: packageJSON.name,
  displayName: "TypeScript Tooling",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, _config) {
    app.waitForService(FileSystemService, fileSystemService => {
      app.addServices(new TypescriptService());

      // Register hooks with the lifecycle service
      app.waitForService(AgentLifecycleService, lifecycleService => {
        lifecycleService.addHooks(typescriptFileValidator);
      });
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Hooks

#### typescriptFileValidator

A lifecycle hook that automatically validates TypeScript files after write operations.

**Hook Details:**

- **Name**: `typescriptFileValidator`
- **Display Name**: `TypeScrtipt/Validate files after write`
- **Description**: Automatically validates written typescript files using the typescript compiler
- **Trigger**: `FileValidatonAfterFileWrite`

**Implementation:**

```typescript
import { FileValidatonAfterFileWrite } from "@tokenring-ai/filesystem/util/runFileValidator";
import type { HookSubscription } from "@tokenring-ai/lifecycle/types";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import { TS_EXTENSIONS, TypescriptService } from "../TypescriptService.ts";

const name = "typescriptFileValidator";
const displayName = "TypeScrtipt/Validate files after write";
const description = "Automatically validates written typescript files using the typescript compiler";

const callbacks = [
  new HookCallback(FileValidatonAfterFileWrite, (data, agent) => {
    if (Object.hasOwn(TS_EXTENSIONS, data.fileExtension)) {
      return agent.requireServiceByType(TypescriptService).validateFile(data.filePath, data.content);
    }
    return null;
  })
];

export default {
  name,
  displayName,
  description,
  callbacks,
} satisfies HookSubscription<any>;
```

**Functionality:**

- Checks if the file extension is a supported TypeScript extension
- Calls `TypescriptService.validateFile()` for TypeScript files
- Returns validation result or `null` for non-TypeScript files

### RPC Endpoints

This package does not define any RPC endpoints.

### Usage Examples

#### Basic Plugin Installation

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// TypeScript validators are now registered and will validate files after write
```

#### Direct Service Usage

```typescript
import { TypescriptService } from '@tokenring-ai/typescript';

const service = new TypescriptService();

const content = `
const x: number = "string"; // Type error
`;

const result = service.validateFile('example.ts', content);

if (result.valid) {
  console.log('No syntax errors');
} else {
  console.log('Syntax errors found:');
  console.log(result.result);
}
```

#### FileSystemService Integration

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import FileSystemService from '@tokenring-ai/filesystem/FileSystemService';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// Access the file service and validate files
const fileService = await app.getService(FileSystemService);

// Files will be automatically validated after write operations
```

#### Validating Multiple File Types

```typescript
import { TypescriptService } from '@tokenring-ai/typescript';

const service = new TypescriptService();

const files = [
  { path: 'example.ts', content: 'const x: number = 5;' },
  { path: 'example.tsx', content: 'const Component = () => <div>Hello</div>;' },
  { path: 'example.mts', content: 'export const value = 42;' },
  { path: 'example.cts', content: 'module.exports = { value: 42 };' }
];

for (const file of files) {
  const result = service.validateFile(file.path, file.content);
  console.log(`${file.path}: ${result.valid ? 'Valid' : result.result}`);
}
```

#### Error Handling in Validation

```typescript
import { TypescriptService } from '@tokenring-ai/typescript';

const service = new TypescriptService();

async function validateWithErrors(filePath: string, content: string): Promise<void> {
  try {
    const result = service.validateFile(filePath, content);
    
    if (!result.valid) {
      console.log('Validation failed:');
      console.log(result.result);
      // Handle validation errors
      throw new Error('TypeScript validation failed');
    } else {
      console.log('Validation passed');
    }
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}
```

### Testing

#### Running Tests

```bash
bun test
```

#### Test Configuration

The package uses Vitest for testing with the following configuration:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
    globals: true,
    isolate: true,
  },
});
```

#### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { TypescriptService } from '@tokenring-ai/typescript';

describe('TypescriptService', () => {
  const service = new TypescriptService();

  it('should return valid for valid TypeScript code', () => {
    const content = 'const x: number = 5;';
    const result = service.validateFile('test.ts', content);
    expect(result.valid).toBe(true);
  });

  it('should return invalid for invalid TypeScript code', () => {
    const content = 'const x: number = "string";';
    const result = service.validateFile('test.ts', content);
    expect(result.valid).toBe(false);
    expect(result.result).toContain('error');
  });

  it('should handle TypeScript JSX files', () => {
    const content = 'const Component = () => <div>Hello</div>;';
    const result = service.validateFile('test.tsx', content);
    expect(result.valid).toBe(true);
  });
});
```

#### Building

```bash
bun run build
```

The build command runs TypeScript type checking without emitting output.

### Development

#### Package Structure

```text
pkg/typescript/
├── index.ts                        # Package exports
├── plugin.ts                       # Plugin definition and installation
├── TypescriptService.ts            # Core service implementation
├── hooks/
│   └── typescriptFileValidator.ts  # Lifecycle hook for file validation
├── package.json                    # Package configuration
├── vitest.config.ts               # Test configuration
├── LICENSE                         # MIT License
└── README.md                       # Package documentation
```

#### Exports

The package exports the following:

```typescript
export { TypescriptService } from "./TypescriptService.ts";
```

#### Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `tsc --noEmit` | Type check without emitting |
| `test` | `vitest run` | Run tests |
| `test:watch` | `vitest` | Run tests in watch mode |
| `test:coverage` | `vitest run --coverage` | Run tests with coverage |

### Integration

#### With FileSystemService

The plugin waits for FileSystemService to be available before registering the TypescriptService:

```typescript
app.waitForService(FileSystemService, fileSystemService => {
  app.addServices(new TypescriptService());
});
```

#### With AgentLifecycleService

The plugin registers file validation hooks with the AgentLifecycleService:

```typescript
app.waitForService(AgentLifecycleService, lifecycleService => {
  lifecycleService.addHooks(typescriptFileValidator);
});
```

#### With TokenRingApp

Install the plugin during application initialization:

```typescript
await app.install(typescriptPlugin);
```

### Related Components

- `@tokenring-ai/filesystem` - File management and validation system
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/lifecycle` - Lifecycle and hook management
- `@tokenring-ai/utility` - Shared utilities and helpers

## License

MIT License - see LICENSE file for details.

Copyright (c) 2025 TokenRing AI
