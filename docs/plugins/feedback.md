# Feedback Package

Provides tools for human-in-the-loop interactions in AI workflows, allowing
agents to pause execution, present information to users, and collect feedback
through chat-based questioning and browser-based reviews.

## Package Reference

**Package Name**: `@tokenring-ai/feedback`  
**Version**: 0.2.0  
**License**: MIT  
**Plugin Display Name**: Human Feedback

---

## User Guide

### Overview

The `@tokenring-ai/feedback` package provides interactive tools for gathering
human input and reviewing agent proposals. It enables human-in-the-loop
interactions in AI-driven workflows by allowing AI agents to pause execution,
present information to users, and collect feedback through three mechanisms:

1. **Interactive Chat Questioning**: Ask multiple questions via chat with
   support for text responses or multiple-choice options
2. **Browser-Based File Review**: Display file contents in browser UIs for
   approval/rejection with optional comments
3. **React Component Preview**: Bundle and preview React components in browsers
   for visual feedback and approval

This package is designed for task uncertainty resolution, approval workflows,
and interactive content review scenarios where human input is needed.

### Key Features

- **Human-in-the-Loop Workflows**: Uncertainty resolution and approval systems
- **Multiple Question Types**: Form-based questions with treeSelect and text
  inputs
- **Rich Content Review**: Support for plain text, Markdown, HTML, and JSON
- **Automatic Operations**: Browser launch, temp file management, server cleanup
- **Integration Pattern**: Simple tool registration via ChatService

### Tools

| Tool Name | Display Name | Description |
| :--- | :--- | :--- |
| `ask_questions` | `Feedback/askQuestions` | Ask questions via chat with form inputs |
| `feedback_getFileFeedback` | `Feedback/getFileFeedback` | Get feedback on file content |
| `feedback_react-feedback` | `Feedback/react-feedback` | Get feedback on React components |

#### Feedback/askQuestions

Ask questions to users via chat when feedback is necessary or when uncertain
about the proper path to complete a task.

**Input Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| message | string | Yes | Free-form message explaining the problem |
| questions | array | Yes | Array of question objects |
| questions[].question | string | Yes | The specific question to ask |
| questions[].choices | string[] | Yes | Suggested choices (empty for freeform) |

**Example**:

```typescript
import askQuestions from "@tokenring-ai/feedback/tools/askQuestions";

const result = await askQuestions.execute({
  message: "I'm unsure about the approach.",
  questions: [
    {
      question: "Which method do you prefer?",
      choices: ["Method A", "Method B", "Method C"]
    }
  ]
}, agent);
```

#### Feedback/getFileFeedback

Present file content to the user for review, solicit feedback (accept/reject
with comments), and optionally write content to a file if accepted.

**Input Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| filePath | string | Yes | Path where content should be saved |
| content | string | Yes | The actual text content to review |
| contentType | string | No | MIME type, defaults to 'text/plain' |

**Supported Content Types**:

- `text/plain`: Plain text with HTML escaping
- `text/markdown`: Markdown rendered to HTML using marked.js
- `text/html`: Raw HTML content rendered in iframe
- `application/json`: JSON formatted with HTML escaping

**Example**:

```typescript
import getFileFeedback from "@tokenring-ai/feedback/tools/getFileFeedback";

const result = await getFileFeedback.execute({
  filePath: "docs/sample.md",
  content: "# Sample\nThis is **bold** text.",
  contentType: "text/markdown"
}, agent);
```

#### Feedback/react-feedback

Show a React component in a browser window for user feedback, allowing
accept/reject with optional comments.

**Input Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| code | string | Yes | Complete React component source code |
| file | string | No | Filename/path, defaults to timestamped name |

**Example**:

```typescript
import reactFeedback from "@tokenring-ai/feedback/tools/react-feedback";

const result = await reactFeedback.execute({
  code: `
    export default function MyComponent() {
      return <div>Hello, Feedback!</div>;
    }
  `,
  file: "src/components/MyComponent.tsx"
}, agent);
```

### Configuration

The package uses a minimal configuration schema that accepts no custom
configuration options.

#### Plugin Registration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import feedbackPlugin from "@tokenring-ai/feedback/plugin";

const app = new TokenRingApp();
app.install(feedbackPlugin);

// Tools are now available via the chat service
```

### Integration

The package integrates with Token Ring applications through its plugin system.
When installed, all tools are automatically registered with the ChatService.

#### Service Access Pattern

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import { FileSystemService } from "@tokenring-ai/filesystem";

async function execute(params: unknown, agent: Agent) {
  // Access required services
  const fileSystem = agent.requireServiceByType(FileSystemService);
  
  // Use agent logging
  agent.infoMessage(`[tool-name] Operation started`);
  agent.infoMessage(`[tool-name] File review server running at ${url}`);
  agent.errorMessage(`[tool-name] Operation failed:`, error);
  
  // Use agent question API
  const response = await agent.askQuestion({...});
}
```

### Best Practices

#### Using askQuestions

1. **Provide Clear Context**: Always include a descriptive message explaining
   why you need feedback
2. **Limit Question Count**: Ask focused questions to avoid overwhelming users
3. **Offer Meaningful Choices**: When providing choices, ensure they cover the
   main options
4. **Use Empty Choices**: For open-ended responses, use empty choices array to
   enable text input

#### Using getFileFeedback

1. **Specify Content Type**: Always specify the correct `contentType` for proper
   rendering
2. **Provide Valid Paths**: Ensure `filePath` is valid and writable
3. **Handle Large Files**: For large files, consider summarizing or splitting
   content
4. **Use Markdown**: For code or documentation, use `text/markdown` for better
   readability

#### Using react-feedback

1. **Include Dependencies**: Ensure all required imports are included in the
   code
2. **Keep Components Simple**: Focus on the component being reviewed
3. **Provide Filename**: Specify a meaningful filename for better organization
4. **Test Locally**: Verify the component works before submitting for feedback

---

## Developer Reference

### Core Components

The package exports three tools via `tools.ts`:

```typescript
import askQuestions from "./tools/askQuestions.ts";
import getFileFeedback from "./tools/getFileFeedback.ts";
import reactFeedback from "./tools/react-feedback.ts";

export default {
  askQuestions,
  getFileFeedback,
  reactFeedback,
};
```

Each tool follows the `TokenRingToolDefinition` pattern:

```typescript
export default {
  name: "tool_name",
  displayName: "Category/ToolName",
  description: "Tool description",
  inputSchema: z.object({ ... }),
  execute: async (params, agent) => { ... }
} satisfies TokenRingToolDefinition<typeof inputSchema>;
```

### Services

The package does not define its own TokenRingService implementations. Instead,
it relies on existing services:

- **ChatService**: Required for tool registration
- **FileSystemService**: Required by `getFileFeedback` and `reactFeedback`
- **Agent**: Required for logging and service access

### RPC Endpoints

This package does not define any RPC endpoints.

### Chat Commands

This package does not define any chat commands.

### Schema Documentation

The package uses an empty configuration schema with no configurable options:

```typescript
import {z} from "zod";

const packageConfigSchema = z.object({});
```

This minimal schema ensures the plugin can be installed without any configuration
parameters.

### Usage Examples

#### Basic Question Prompting

```typescript
import askQuestions from "@tokenring-ai/feedback/tools/askQuestions";

// When uncertain about approach
const result = await askQuestions.execute({
  message: "I'm uncertain about which implementation strategy to use.",
  questions: [
    {
      question: "What is your priority concern?",
      choices: [
        "Performance efficiency",
        "Code simplicity",
        "Maintainability"
      ]
    }
  ]
}, agent);
```

#### File Approval Workflow

```typescript
import getFileFeedback from "@tokenring-ai/feedback/tools/getFileFeedback";

// Before committing documentation
const result = await getFileFeedback.execute({
  filePath: "docs/api-endpoint-v2.md",
  content: "# API Endpoints\n\n## User\n\nGET /api/v2/users...",
  contentType: "text/markdown"
}, agent);

if (result.data.status === "accepted") {
  // Commit approved documentation
  await gitCommit("docs/api-endpoint-v2.md");
}
```

#### React Component Review

```typescript
import reactFeedback from "@tokenring-ai/feedback/tools/react-feedback";

// Before integrating new UI component
const componentCode = `
export default function NewSidebar() {
  return (
    <nav style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <h3>Sidebar</h3>
    </nav>
  );
}
`;

const result = await reactFeedback.execute({
  code: componentCode,
  file: "src/components/NewSidebar.tsx"
}, agent);

// Handle acceptance
if (result.data.status === "accept") {
  console.log("Component approved for integration");
}
```

## Testing and Development

### Tool Testing Strategy

```typescript
import { describe, it, expect } from "vitest";
import askQuestionsTool from "./tools/askQuestions.ts";

describe("Feedback Tools", () => {
  describe("askQuestions", () => {
    it("should throw error if message is missing", async () => {
      await expect(
        askQuestionsTool.execute(
          {message: "", questions: []},
          mockAgent
        )
      ).rejects.toThrow();
    });

    it("should process single choice question", async () => {
      const result = await askQuestionsTool.execute(
        {
          message: "Select option",
          questions: [{ question: "Choose", choices: ["A", "B"] }]
        },
        mockAgent
      );
      expect(result).toBeDefined();
    });
  });
});
```

#### Testing Structure

- Uses vitest for testing
- Tests are located in `**/*.test.ts` files
- Node environment for test execution
- Isolated test runs with globals enabled

#### Test Configuration

```typescript
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

- `@tokenring-ai/app@0.2.0` - Base application framework
- `@tokenring-ai/chat@0.2.0` - Chat service
- `@tokenring-ai/agent@0.2.0` - Agent system and question schema
- `@tokenring-ai/filesystem@0.2.0` - File system service
- `zod@^4.3.6` - Schema validation
- `esbuild@^0.27.4` - React component bundling
- `express@^5.2.1` - Web server for preview
- `marked@^17.0.5` - Markdown rendering
- `date-fns@^4.1.0` - Date formatting
- `open@^11.0.0` - Browser launcher
- `react@^19.2.4` - React library
- `react-dom@^19.2.4` - React DOM library

#### Development Dependencies

- `typescript@^6.0.2` - TypeScript compiler
- `@types/express@^5.0.6` - Express type definitions
- `vitest@^4.1.1` - Testing framework

### Error Handling

All tools follow consistent error handling patterns.

#### Parameter Validation

```typescript
// askQuestions: Validates that at least one question is provided
if (questionItems.size === 0) {
  return "You did not provide any questions...";
}

// getFileFeedback: Validates filePath and content are provided
if (!filePath || !content) {
  throw new Error(
    `[feedback_getFileFeedback] filePath and content are required.`
  );
}

// reactFeedback: Validates code is provided
if (!code) {
  throw new Error(`[feedback_react-feedback] code is required.`);
}
```

#### Error Types

1. **Validation Errors**: Missing required parameters or invalid input types
2. **File System Errors**: File I/O operations, permissions, path validation
3. **Network Errors**: Server startup, browser launch, HTTP requests
4. **Build Errors**: React component bundling failures (esbuild errors)
5. **Agent Errors**: Service integration issues

### Related Components

#### Dependent Packages

- `@tokenring-ai/chat`: Required for ChatService integration
- `@tokenring-ai/app`: Required for TokenRingPlugin abstraction
- `@tokenring-ai/agent`: Required for Agent and askQuestion API
- `@tokenring-ai/filesystem`: Required for file operations

#### Related Tools

- **Chat Service Tools**: Other tools available through ChatService integration
- **Code Review Tools**: Complementary tools for code validation

### Development

#### Building

```bash
# Build the package TypeScript files (no Emit)
bun run build
```

#### Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## License

MIT License - see LICENSE file for details.
