# @tokenring-ai/javascript

The `@tokenring-ai/javascript` package provides JavaScript file validation capabilities for the TokenRing AI ecosystem. This package integrates with the TokenRing FileSystemService to register ESLint-based validation for JavaScript files, ensuring code quality and consistency across JavaScript projects.

## Overview

The `@tokenring-ai/javascript` package provides JavaScript file validation capabilities for the TokenRing AI ecosystem. This package integrates with the TokenRing FileSystemService to register ESLint-based validation for JavaScript files, ensuring code quality and consistency across JavaScript projects.

The JavaScript package integrates seamlessly with the TokenRing file management system, providing automatic validation for all JavaScript files through the FileSystemService. It leverages ESLint to analyze code and report issues with detailed location and rule information.

## Key Features

- **ESLint Integration**: Automatic JavaScript file validation using ESLint
- **Multiple Format Support**: Validates `.js`, `.mjs`, `.cjs`, and `.jsx` files
- **Seamless Integration**: Works with FileSystemService for automatic validation
- **Detailed Reporting**: Returns validation issues with line, column, severity, and rule information
- **Error and Warning Support**: Distinguishes between errors and warnings in validation results
- **Zero Configuration**: Works with existing ESLint configuration in your project

## Core Components

### JavascriptFileValidator

The core component is the `JavascriptFileValidator`, a file validator implementation that uses ESLint to validate JavaScript files.

**Type Signature:**
```typescript
type FileValidator = (filePath: string, content: string) => Promise<string | null>;
```

**Implementation:**
```typescript
import type {FileValidator} from "@tokenring-ai/filesystem/FileSystemService";
import {ESLint} from "eslint";

const eslint = new ESLint();

const JavascriptFileValidator: FileValidator = async (filePath, content) => {
  const results = await eslint.lintText(content, {filePath});
  const messages = results.flatMap(r => r.messages);
  if (messages.length === 0) return null;
  return messages.map(m => `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`).join("\n");
};

export default JavascriptFileValidator;
```

**Validation Output Format:**
```
line:column severity message (ruleId)
line:column severity message (ruleId)
...
```

**Example Output:**
```
5:3 warning 'x' is assigned a value but never used (@typescript-eslint/no-unused-vars)
10:1 error Missing semicolon (semi)
```

### Plugin Registration

The plugin registers file validators with the TokenRing FileSystemService during installation:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {z} from "zod";
import JavascriptFileValidator from "./JavascriptFileValidator.ts";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(FileSystemService, fileSystemService => {
      for (const ext of [".js", ".mjs", ".cjs", ".jsx"]) {
        fileSystemService.registerFileValidator(ext, JavascriptFileValidator);
      }
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Services

### FileSystemService Integration

The package integrates with the `@tokenring-ai/filesystem` package's FileSystemService:

- **Service**: `FileSystemService`
- **Registration**: Registers file validators for JavaScript extensions
- **Lifecycle**: Uses `waitForService` to ensure FileSystemService is available before registration

```typescript
app.waitForService(FileSystemService, fileSystemService => {
  for (const ext of [".js", ".mjs", ".cjs", ".jsx"]) {
    fileSystemService.registerFileValidator(ext, JavascriptFileValidator);
  }
});
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands (slash-prefixed commands).

## Configuration

The package currently has no configuration options. The configuration schema is an empty object:

```typescript
const packageConfigSchema = z.object({});
```

### Configuration Example

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install without configuration
await app.installPlugin(javascriptPlugin);

// Or with empty configuration object
await app.installPlugin(javascriptPlugin, {});
```

## Integration

### With FileSystemService

The primary integration is with the FileSystemService, which uses the registered validators:

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();
await app.installPlugin(javascriptPlugin);

// Get the file service and validate JavaScript files
const fileService = await app.getService(FileSystemService);
const validationResult = await fileService.validateFile("src/example.js", "const x = 1;");

if (validationResult === null) {
  console.log("File is valid");
} else {
  console.log("Validation issues:");
  console.log(validationResult);
}
```

### With TokenRingApp

Install the plugin during application setup:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// Now all JavaScript files will be automatically validated when requested
```

### Supported File Extensions

The package registers validators for the following JavaScript file extensions:

| Extension | Description |
|-----------|-------------|
| `.js` | Standard JavaScript files |
| `.mjs` | ES Module files |
| `.cjs` | CommonJS files |
| `.jsx` | JavaScript JSX files |

## Usage Examples

### Basic Integration

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// Now all JavaScript files will be automatically validated
```

### File Validation Example

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();
await app.installPlugin(javascriptPlugin);

const fileService = await app.getService(FileSystemService);

// Validate a JavaScript file
const code = `
const x = 1;
const y = 2;
`;

const validationResult = await fileService.validateFile("src/example.js", code);

if (validationResult === null) {
  console.log("✓ File is valid");
} else {
  console.log("✗ Validation issues found:");
  console.log(validationResult);
  // Output format:
  // 2:7 warning 'x' is assigned a value but never used (no-unused-vars)
}
```

### Parsing Validation Results

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";

const fileService = await app.getService(FileSystemService);
const result = await fileService.validateFile("src/example.js", code);

if (result) {
  // Parse the validation result
  const issues = result.split('\n').map(line => {
    const [location, severity, ...messageParts] = line.split(' ');
    const [lineNum, column] = location.split(':');
    return {
      line: parseInt(lineNum),
      column: parseInt(column),
      severity, // "error" or "warning"
      message: messageParts.join(' ')
    };
  });
  
  console.log(`Found ${issues.length} issues`);
  
  // Count errors and warnings
  const errors = issues.filter(i => i.severity === "error").length;
  const warnings = issues.filter(i => i.severity === "warning").length;
  
  console.log(`Errors: ${errors}, Warnings: ${warnings}`);
}
```

## Best Practices

### ESLint Configuration

This package uses ESLint with the project's existing ESLint configuration. Ensure you have:

1. A valid `.eslintrc` or `eslint.config.js` file in your project
2. All necessary ESLint plugins installed
3. Proper TypeScript support if validating TypeScript files

**Example ESLint Configuration:**
```javascript
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "semi": ["error", "always"]
    }
  }
];
```

### Validation Performance

- The ESLint instance is created once and reused for all validations
- Validation is asynchronous to avoid blocking the event loop
- Consider caching validation results for frequently accessed files

### Error Handling

When validation returns issues:

```typescript
const result = await fileService.validateFile("src/example.js", code);

if (result) {
  // Check for errors vs warnings
  const hasErrors = result.includes("error");
  const hasWarnings = result.includes("warning");
  
  if (hasErrors) {
    console.error("Validation failed with errors");
    // Handle errors
  } else if (hasWarnings) {
    console.warn("Validation passed with warnings");
    // Handle warnings
  }
} else {
  console.log("Validation passed");
}
```

### Integration with File Operations

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";

const fileService = await app.getService(FileSystemService);

// Validate before writing
const code = "const x = 1";
const validationResult = await fileService.validateFile("src/newfile.js", code);

if (validationResult) {
  console.log("Code has issues, please fix before saving:");
  console.log(validationResult);
} else {
  // Safe to write
  await fileService.writeFile("src/newfile.js", code);
}
```

## Testing and Development

### Running Tests

```bash
bun run test
```

### Watch Mode

```bash
bun run test:watch
```

### Coverage Report

```bash
bun run test:coverage
```

### Type Checking

```bash
bun run build
```

The package uses `vitest` for testing and `typescript` for type checking.

## Package Structure

```
pkg/javascript/
├── index.ts                      # Package entry point (empty)
├── plugin.ts                     # TokenRing plugin registration
├── JavascriptFileValidator.ts    # ESLint-based file validator
├── package.json                  # Dependencies and metadata
├── vitest.config.ts             # Test configuration
└── LICENSE                      # MIT License
```

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Plugin framework and application core |
| `@tokenring-ai/filesystem` | 0.2.0 | FileSystemService for file validation |
| `eslint` | ^10.1.0 | JavaScript linting engine |
| `zod` | ^4.3.6 | Schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^6.0.2 | TypeScript compiler |
| `vitest` | ^4.1.1 | Testing framework |

## Related Components

- **[@tokenring-ai/filesystem](./filesystem.md)**: FileSystemService that this plugin integrates with
- **[@tokenring-ai/app](./app.md)**: Core application framework
- **ESLint**: [ESLint Documentation](https://eslint.org/docs/latest/)

## License

MIT License - see LICENSE file for details.
