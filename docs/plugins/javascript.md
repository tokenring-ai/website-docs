# @tokenring-ai/javascript

## User Guide

### Overview

The `@tokenring-ai/javascript` package provides JavaScript file validation capabilities for the TokenRing AI ecosystem. This package integrates with the TokenRing FileSystemService to register ESLint-based validation for JavaScript files, ensuring code quality and consistency across JavaScript projects.

The JavaScript package integrates seamlessly with the TokenRing file management system, providing automatic validation for all JavaScript files through the FileSystemService. It leverages ESLint to analyze code and report issues with detailed location and rule information.

### Key Features

- **ESLint Integration**: Automatic JavaScript file validation using ESLint
- **Multiple Format Support**: Validates `.js`, `.mjs`, `.cjs`, and `.jsx` files
- **Seamless Integration**: Works with FileSystemService for automatic validation
- **Detailed Reporting**: Returns validation issues with line, column, severity, and rule information
- **Error and Warning Support**: Distinguishes between errors and warnings in validation results
- **Zero Configuration**: Works with existing ESLint configuration in your project

### Chat Commands

This package does not define any chat commands (slash-prefixed commands).

### Tools

This package does not define any tools.

### Configuration

The package currently has no configuration options. The configuration schema is an empty object:

```typescript
const packageConfigSchema = z.object({});
```

#### Configuration Example

```yaml
# No configuration required
javascript: {}
```

### Integration

#### With FileSystemService

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

#### With TokenRingApp

Install the plugin during application setup:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// Now all JavaScript files will be automatically validated when requested
```

#### Supported File Extensions

The package registers validators for the following JavaScript file extensions:

| Extension | Description |
|-----------|-------------|
| `.js` | Standard JavaScript files |
| `.mjs` | ES Module files |
| `.cjs` | CommonJS files |
| `.jsx` | JavaScript JSX files |

### Best Practices

#### ESLint Configuration

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

#### Validation Performance

- The ESLint instance is created once and reused for all validations
- Validation is asynchronous to avoid blocking the event loop
- Consider caching validation results for frequently accessed files

#### Error Handling

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

### User Guide Usage Examples

#### Basic Integration

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// Now all JavaScript files will be automatically validated
```

#### File Validation Example

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

#### Parsing Validation Results

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

#### Integration with File Operations

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

---

## Developer Reference

### Core Components

#### JavascriptFileValidator

The `JavascriptFileValidator` is a file validator class that implements the `FileValidator` interface
and uses ESLint to validate JavaScript files.

**Interface:**

```typescript
interface FileValidator {
  validateFile(filePath: string, content: string): Promise<string | null>;
}
```

**Implementation:**

```typescript
import type { FileValidator } from "@tokenring-ai/filesystem/FileSystemService";
import { ESLint } from "eslint";

export default class JavascriptFileValidator implements FileValidator {
  private eslint = new ESLint();

  async validateFile(filePath: string, content: string) {
    const results = await this.eslint.lintText(content, { filePath });
    const messages = results.flatMap(r => r.messages);
    if (messages.length === 0) return null;
    return messages.map(m =>
      `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`
    ).join("\n");
  }
}
```

**Validation Output Format:**

```text
line:column severity message (ruleId)
line:column severity message (ruleId)
...
```

**Example Output:**

```text
5:3 warning 'x' is assigned a value but never used (@typescript-eslint/no-unused-vars)
10:1 error Missing semicolon (semi)
```

### Services

This package does not define a `TokenRingService`. Instead, it integrates with the existing `FileSystemService` from
`@tokenring-ai/filesystem` by registering file validators for JavaScript file extensions.

#### FileSystemService Integration

The package integrates with the `@tokenring-ai/filesystem` package's FileSystemService:

- **Service**: `FileSystemService`
- **Registration**: Registers file validators for JavaScript extensions
- **Lifecycle**: Uses `waitForService` to ensure FileSystemService is available before registration

```typescript
app.waitForService(FileSystemService, fileSystemService => {
  for (const ext of [".js", ".mjs", ".cjs", ".jsx"]) {
    fileSystemService.registerFileValidator(ext, validator);
  }
});
```

### RPC Endpoints

This package does not define any RPC endpoints.

### Developer Usage Examples

#### Plugin Installation

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// Now all JavaScript files will be automatically validated when requested
```

#### Manual Validator Usage

You can also use the validator directly:

```typescript
import JavascriptFileValidator from "@tokenring-ai/javascript/JavascriptFileValidator";

const validator = new JavascriptFileValidator();

const code = `
const x = 1;
const y = 2;
`;

const result = await validator.validateFile("example.js", code);

if (result) {
  console.log("Validation issues:");
  console.log(result);
} else {
  console.log("No issues found");
}
```

### Testing

The package is configured to use vitest for testing. Run the test suite with:

```bash
bun run test
```

Watch mode for development:

```bash
bun run test:watch
```

Generate coverage report:

```bash
bun run test:coverage
```

#### Test Configuration

The package uses vitest for testing with the following configuration:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Dependencies

#### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Plugin framework and application core |
| `@tokenring-ai/filesystem` | 0.2.0 | FileSystemService for file validation |
| `eslint` | ^10.2.0 | JavaScript linting engine |
| `zod` | ^4.3.6 | Schema validation |

#### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^6.0.2 | TypeScript compiler |
| `vitest` | ^4.1.1 | Testing framework |

### Related Components

- **[@tokenring-ai/filesystem](./filesystem.md)**: FileSystemService that this plugin integrates with
- **[@tokenring-ai/app](./app.md)**: Core application framework
- **ESLint**: [ESLint Documentation](https://eslint.org/docs/latest/)

---

## Package Structure

```text
pkg/javascript/
├── index.ts                      # Package entry point (exports)
├── plugin.ts                     # TokenRing plugin registration
├── JavascriptFileValidator.ts    # ESLint-based file validator
├── package.json                  # Dependencies and metadata
├── vitest.config.ts             # Test configuration
└── LICENSE                      # MIT License
```

## Exports

The package provides the following exports:

| Export Path | Description |
|-------------|-------------|
| `@tokenring-ai/javascript` | Main entry point (exports all) |
| `@tokenring-ai/javascript/plugin` | Default TokenRingPlugin export |
| `@tokenring-ai/javascript/JavascriptFileValidator` | File validator class |

## License

MIT License - see LICENSE file for details.
