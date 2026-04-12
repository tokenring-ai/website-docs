# Markdown Tooling

## User Guide

### Overview

The `@tokenring-ai/markdown` package provides Markdown file validation for the
TokenRing ecosystem. It integrates with the FileSystemService to register
`markdownlint`-based validation for Markdown files, surfacing style and
formatting issues during file writes and edits.

### Key Features

- `markdownlint`-based validation for Markdown content
- FileSystemService integration for automatic validation
- Error reporting with line and column information
- Support for `.md` and `.markdown` files
- Automatic loading of a root `.markdownlint.json` when present

### Chat Commands

This package does not define any chat commands.

### Tools

This package does not define any tools.

### Configuration

The `@tokenring-ai/markdown` package requires no plugin configuration:

```yaml
# No configuration required
```

If a `.markdownlint.json` file exists at the project root, it is loaded
automatically and passed to `markdownlint`.

#### Environment Variables

This package does not require any environment variables.

### Integration

The markdown package integrates with the following components:

- **FileSystemService**: Registers file validators for Markdown file extensions
- **@tokenring-ai/app**: Provides the TokenRingPlugin interface

### Best Practices

1. **Create a `.markdownlint.json`** at your project root to customize
   validation rules
2. **Review validation errors** before committing Markdown files
3. **Use consistent Markdown formatting** across your documentation
4. **Run validation during CI/CD** to maintain documentation quality

---

## Developer Reference

### Core Components

#### MarkdownFileValidator

The core file validator implementation runs `markdownlint` against Markdown
content and returns formatted issues.

**Type Signature:**

```typescript
type FileValidator = (filePath: string, content: string) =>
  Promise<string | null>;
```

**Supported File Extensions:**

- `.md` - Standard Markdown files
- `.markdown` - Alternate Markdown file extension

**Implementation Details:**

The validator performs the following steps:

1. Loads markdownlint configuration from `.markdownlint.json` if present
2. Runs linting against the provided content
3. Formats issues with line/column numbers, severity, descriptions,
   and rule names
4. Returns `null` if no issues are found

#### Plugin

The plugin registers Markdown file validators with the FileSystemService.

**Plugin Configuration:**

```typescript
const packageConfigSchema = z.object({});
```

- No configuration options required
- Automatically registers validators for all supported Markdown extensions

### Services

This package does not implement any TokenRingService classes. It consumes the
FileSystemService to register validators.

### Provider Documentation

This package does not define any provider interfaces.

### RPC Endpoints

This package does not define any RPC endpoints.

### Usage Examples

#### Basic Plugin Installation

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import markdownPlugin from "@tokenring-ai/markdown/plugin";

const app = new TokenRingApp();

await app.install(markdownPlugin);
```

#### Manual Validator Usage

```typescript
import MarkdownFileValidator from
  "@tokenring-ai/markdown/MarkdownFileValidator";

const content = `
#Heading

This line has trailing spaces.  
`;

const issues = await MarkdownFileValidator("README.md", content);

if (issues) {
  console.log(issues);
}
```

#### Integration With FileSystemService

```typescript
fileSystemService.registerFileValidator(".md", MarkdownFileValidator);
fileSystemService.registerFileValidator(".markdown", MarkdownFileValidator);
```

### Testing

#### Test Setup

The package uses Vitest for testing:

```json
{
  "test": {
    "include": ["**/*.test.ts"],
    "environment": "node",
    "globals": true,
    "isolate": true
  }
}
```

#### Running Tests

```bash
# Run tests once
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Dependencies

#### Runtime Dependencies

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `@tokenring-ai/app` | 0.2.0 | Core application framework |
| `@tokenring-ai/filesystem` | 0.2.0 | FileSystemService integration |
| `markdownlint` | ^0.40.0 | Markdown linting engine |
| `zod` | ^4.3.6 | Schema validation |

#### Dev Dependencies

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

### Related Components

- **@tokenring-ai/filesystem**: Provides FileSystemService for validator
  registration
- **@tokenring-ai/app**: Provides TokenRingPlugin interface
- **markdownlint**: External library for Markdown validation rules

### Package Structure

```text
pkg/markdown/
├── index.ts                  # Package exports
├── plugin.ts                 # Plugin definition and installation
├── MarkdownFileValidator.ts  # Core validator implementation
├── package.json              # Package configuration
├── vitest.config.ts          # Test configuration
└── README.md                 # Package documentation
```

### Error Format

The validator returns formatted lint messages with location information:

**Format:**

```text
line:column severity message (rule)
```

**Example:**

```text
1:2 error No space after hash on atx style heading
  (MD018/no-missing-space-atx)
```

### License

MIT License - see LICENSE file for details.
