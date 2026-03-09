# TypeScript Package

## Overview

The `@tokenring-ai/typescript` package provides TypeScript language validation support for the TokenRing ecosystem. It integrates with the FileSystemService to register file validators for TypeScript files, enabling real-time syntax checking and error detection for TypeScript code.

This package leverages the TypeScript compiler API to provide accurate syntax analysis for multiple TypeScript file types including standard TypeScript files, TypeScript JSX files, ES modules, and CommonJS modules.

## Key Features

- **TypeScript Syntax Validation**: Real-time validation of TypeScript, TSX, MTS, and CTS files
- **FileSystemService Integration**: Seamless integration with the TokenRing file management system
- **Error Reporting**: Detailed error messages with line and column information
- **Multiple File Type Support**: Supports `.ts`, `.tsx`, `.mts`, and `.cts` file extensions
- **Compiler API Integration**: Leverages the TypeScript compiler API for accurate syntax analysis
- **Zero Configuration**: Automatically registers validators upon plugin installation

## Core Components

### TypescriptFileValidator

The core file validator implementation that checks TypeScript syntax errors.

**Type Signature:**
```typescript
type FileValidator = (filePath: string, content: string) => Promise<string | null>
```

**Implementation Details:**
- Accepts a file path and file content
- Determines the appropriate TypeScript script kind based on file extension
- Creates a TypeScript source file using the compiler API
- Extracts syntax errors from parse diagnostics
- Returns formatted error messages or `null` if no errors

**Supported File Extensions:**
| Extension | Description | ScriptKind |
|-----------|-------------|------------|
| `.ts` | Standard TypeScript files | `ts.ScriptKind.TS` |
| `.tsx` | TypeScript JSX files | `ts.ScriptKind.TSX` |
| `.mts` | TypeScript ES modules | `ts.ScriptKind.TS` |
| `.cts` | TypeScript CommonJS modules | `ts.ScriptKind.TS` |

**Error Format:**
```
line:column error error_message
```

**Example Error Output:**
```
1:10 error Type 'string' is not assignable to type 'number'.
```

### Plugin

The plugin registers TypeScript file validators with the FileSystemService.

**Plugin Configuration Schema:**
```typescript
const packageConfigSchema = z.object({});
```

The plugin requires no configuration options. All TypeScript file extensions are automatically registered upon plugin installation.

**Plugin Interface:**
```typescript
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(FileSystemService, fileSystemService => {
      for (const ext of TS_EXTENSIONS) {
        fileSystemService.registerFileValidator(ext, TypescriptFileValidator);
      }
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Services

### FileSystemService Integration

The TypeScript package integrates with the `FileSystemService` to register file validators. This integration enables:

- Automatic validation when files are created or modified
- Integration with the broader TokenRing file management ecosystem
- Consistent error reporting across all file types

**Service Registration Pattern:**
```typescript
app.waitForService(FileSystemService, fileSystemService => {
  for (const ext of TS_EXTENSIONS) {
    fileSystemService.registerFileValidator(ext, TypescriptFileValidator);
  }
});
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands.

## Configuration

The `@tokenring-ai/typescript` package requires no configuration. The plugin schema is defined as an empty object:

```typescript
const packageConfigSchema = z.object({});
```

All TypeScript file extensions are automatically registered upon plugin installation:
- `.ts`
- `.tsx`
- `.mts`
- `.cts`

## Integration

### With FileSystemService

The plugin registers file validators with the FileSystemService for all supported TypeScript extensions:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import FileSystemService from '@tokenring-ai/filesystem/FileSystemService';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// TypeScript validators are now registered for .ts, .tsx, .mts, and .cts files
```

### With TokenRingApp

Install the plugin during application initialization:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);
```

### With Agent System

The TypeScript validator can be used by agents to validate code before execution or submission:

```typescript
import { Agent } from '@tokenring-ai/agent';
import FileSystemService from '@tokenring-ai/filesystem/FileSystemService';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();
await app.install(typescriptPlugin);

const agent = new Agent({
  name: 'CodeValidator',
  tools: [
    async (filePath: string, content: string) => {
      const fileService = await app.getService(FileSystemService);
      const errors = await fileService.validateFile(filePath, content);
      return errors || 'No syntax errors found';
    }
  ]
});
```

## Usage Examples

### Basic Plugin Installation

Install the plugin in your TokenRing application:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// TypeScript validators are now registered for .ts, .tsx, .mts, and .cts files
```

### Manual Validator Usage

You can also use the validator directly:

```typescript
import TypescriptFileValidator from '@tokenring-ai/typescript/TypescriptFileValidator';

const content = `
const x: number = "string"; // Type error
`;

const errors = await TypescriptFileValidator('example.ts', content);

if (errors) {
  console.log('Syntax errors found:');
  console.log(errors);
} else {
  console.log('No syntax errors');
}
```

### Integration with FileSystemService

The plugin automatically integrates with FileSystemService:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import FileSystemService from '@tokenring-ai/filesystem/FileSystemService';
import typescriptPlugin from '@tokenring-ai/typescript/plugin';

const app = new TokenRingApp();

await app.install(typescriptPlugin);

// Access the file service and validate files
const fileService = await app.getService(FileSystemService);

const validationResult = await fileService.validateFile('example.ts', content);

if (validationResult) {
  console.log('Validation errors:', validationResult);
}
```

### Validating Multiple File Types

```typescript
import TypescriptFileValidator from '@tokenring-ai/typescript/TypescriptFileValidator';

const files = [
  { path: 'example.ts', content: 'const x: number = 5;' },
  { path: 'example.tsx', content: 'const Component = () => <div>Hello</div>;' },
  { path: 'example.mts', content: 'export const value = 42;' },
  { path: 'example.cts', content: 'module.exports = { value: 42 };' }
];

for (const file of files) {
  const errors = await TypescriptFileValidator(file.path, file.content);
  console.log(`${file.path}: ${errors || 'Valid'}`);
}
```

### Error Handling in Validation

```typescript
import TypescriptFileValidator from '@tokenring-ai/typescript/TypescriptFileValidator';

async function validateWithErrors(filePath: string, content: string): Promise<void> {
  try {
    const errors = await TypescriptFileValidator(filePath, content);
    
    if (errors) {
      console.log('Validation failed:');
      console.log(errors);
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

## Best Practices

### 1. Install Early in Application Lifecycle

Install the TypeScript plugin early in your application initialization to ensure validators are available for all file operations:

```typescript
const app = new TokenRingApp();
await app.install(typescriptPlugin); // Install early
// ... other initialization
```

### 2. Use with File Operations

When performing file operations, leverage the registered validators:

```typescript
const fileService = await app.getService(FileSystemService);

// Validation happens automatically for registered extensions
await fileService.writeFile('example.ts', content);
```

### 3. Handle Validation Results

Always check validation results before proceeding with code execution:

```typescript
const errors = await TypescriptFileValidator(filePath, content);

if (errors) {
  // Handle errors before proceeding
  return { success: false, errors };
}

// Proceed with code execution
return { success: true };
```

### 4. Provide Clear Error Messages

The validator returns formatted error messages. Use these directly in user interfaces:

```typescript
const errors = await TypescriptFileValidator(filePath, content);

if (errors) {
  const errorLines = errors.split('\n');
  for (const line of errorLines) {
    console.log(`Error: ${line}`);
  }
}
```

### 5. Combine with Other Validators

The TypeScript validator can be used alongside other file validators:

```typescript
import typescriptPlugin from '@tokenring-ai/typescript/plugin';
import javascriptPlugin from '@tokenring-ai/javascript/plugin';

await app.install(typescriptPlugin);
await app.install(javascriptPlugin);

// Both TypeScript and JavaScript validators are now active
```

## Testing

### Running Tests

```bash
bun test
```

### Test Configuration

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

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import TypescriptFileValidator from '@tokenring-ai/typescript/TypescriptFileValidator';

describe('TypescriptFileValidator', () => {
  it('should return null for valid TypeScript code', async () => {
    const content = 'const x: number = 5;';
    const result = await TypescriptFileValidator('test.ts', content);
    expect(result).toBeNull();
  });

  it('should return errors for invalid TypeScript code', async () => {
    const content = 'const x: number = "string";';
    const result = await TypescriptFileValidator('test.ts', content);
    expect(result).not.toBeNull();
    expect(result).toContain('error');
  });

  it('should handle TypeScript JSX files', async () => {
    const content = 'const Component = () => <div>Hello</div>;';
    const result = await TypescriptFileValidator('test.tsx', content);
    expect(result).toBeNull();
  });
});
```

### Building

```bash
bun run build
```

The build command runs TypeScript type checking without emitting output.

## Development

### Package Structure

```
pkg/typescript/
├── index.ts                    # Package exports
├── plugin.ts                   # Plugin definition and installation
├── TypescriptFileValidator.ts  # Core validator implementation
├── package.json               # Package configuration
├── vitest.config.ts          # Test configuration
└── README.md                  # Package documentation
```

### Dependencies

**Production Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/filesystem` | 0.2.0 | File management and validation |
| `typescript` | ^5.9.3 | TypeScript compiler API |
| `zod` | ^4.3.6 | Schema validation |

**Development Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.0.18 | Testing framework |

### Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `tsc --noEmit` | Type check without emitting |
| `test` | `vitest run` | Run tests |

## License

MIT License - see LICENSE file for details.

Copyright (c) 2024 TokenRing AI

## Related Components

- `@tokenring-ai/filesystem` - File management and validation system
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/utility` - Shared utilities and helpers
- `@tokenring-ai/agent` - Agent orchestration system
