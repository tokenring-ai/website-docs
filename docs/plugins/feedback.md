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
about the proper path to complete a task. If there is uncertainty about the
task to be completed, or you are worried about doing something incorrectly,
use this tool, as it provides a strong guarantee that you are doing things
aligned with the users intents.

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
  message: "I'm unsure about the approach to take for this refactoring.",
  questions: [
    {
      question: "Which refactoring method do you prefer?",
      choices: ["Extract to separate module", "Inline functions", "Keep as-is"]
    },
    {
      question: "Should we add tests before or after?",
      choices: [] // Freeform answer
    }
  ]
}, agent);
```

**Response Format**:

Returns a formatted string with user responses:

```text
The user has provided the following responses:

Which refactoring method do you prefer?
Extract to separate module

Should we add tests before or after?
After implementation
```

**Error Handling**:

- Throws error if user doesn't respond to question prompt
- Returns default message if user doesn't provide answer
- Validates that at least one question is provided
- Supports iterative questioning - continues until all questions are answered

---

#### Feedback/getFileFeedback

Present file content to the user for review, solicit feedback (accept/reject
with comments), and optionally write content to a file if accepted. If the
`contentType` is `text/markdown` or `text/x-markdown`, the content will be
rendered as HTML for review.

**Input Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| filePath | string | Yes | Path where content should be saved if accepted |
| content | string | Yes | The actual text content to review |
| contentType | string | No | MIME type, defaults to 'text/plain' |

**Supported Content Types**:

| Content Type | Rendering Method |
| :--- | :--- |
| `text/plain` | Plain text with HTML escaping in `<pre>` tag |
| `text/markdown` | Markdown rendered to HTML using marked.js |
| `text/x-markdown` | Markdown rendered to HTML using marked.js |
| `text/html` | Raw HTML content rendered in iframe |
| `application/json` | JSON formatted with HTML escaping in `<pre>` tag |

**Example**:

```typescript
import getFileFeedback from "@tokenring-ai/feedback/tools/getFileFeedback";

const result = await getFileFeedback.execute({
  filePath: "docs/sample.md",
  content: "# Sample\n\nThis is **bold** text and `code`.",
  contentType: "text/markdown"
}, agent);
```

**Response Format**:

Returns a JSON string with the following structure:

```json
{
  "status": "accepted" | "rejected",
  "comment": "optional user comment",
  "filePath": "path if accepted",
  "rejectedFilePath": "path if rejected with timestamp"
}
```

**Error Handling**:

- Throws error if `filePath` or `content` parameters are missing
- Cleanup errors are logged but don't stop execution
- Server startup errors are logged with fallback URL reporting
- Rejected files are saved with `.rejected` prefix and timestamp

---

#### Feedback/react-feedback

Show a React component in a browser window for user feedback, allowing
accept/reject with optional comments. The component is bundled using esbuild
and rendered with React 18 from CDN.

**Input Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| code | string | Yes | Complete source code of the React component (valid JSX/TSX) |
| file | string | No | Filename/path of the React component to be previewed |

**Example**:

```typescript
import reactFeedback from "@tokenring-ai/feedback/tools/react-feedback";

const result = await reactFeedback.execute({
  code: `
    export default function MyComponent() {
      return (
        <div style={{ padding: '20px' }}>
          <h1>Hello, Feedback!</h1>
          <p>This is a React component preview.</p>
        </div>
      );
    }
  `,
  file: "src/components/MyComponent.tsx"
}, agent);
```

**Response Format**:

Returns a JSON string with the following structure:

```json
// Accepted
{ "status": "accept", "comment": "optional comment" }

// Rejected
{ "status": "reject", "comment": "optional comment" }
```

**Technical Details**:

- Components are bundled using esbuild with JSX automatic transformation
- React and React DOM are loaded from unpkg CDN (version 18)
- External dependencies (react, react-dom) are treated as global variables
- Components must export a default function component
- Temporary files are automatically cleaned up after feedback is received

**Error Handling**:

- Throws error if `code` parameter is missing
- Cleanup is performed after file operations
- Server is stopped after cleanup
- Rejected files are saved with `.rejected` prefix and timestamp

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

The plugin automatically registers all tools with the ChatService upon installation.

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

### Required Services

- **ChatService**: Required for tool registration (handled by plugin)
- **FileSystemService**: Required by `getFileFeedback` and `reactFeedback`
- **Agent**: Required for logging and service access

### Best Practices

#### Using ask_questions

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

export default [askQuestions, getFileFeedback, reactFeedback];
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

### Tool Definitions

#### askQuestions Tool

Located at `pkg/feedback/tools/askQuestions.ts`:

```typescript
const name = "ask_questions";
const displayName = "Feedback/askQuestions";

const inputSchema = z.object({
  message: z.string().describe("A free-form, paragraph sized message..."),
  questions: z.array(
    z.object({
      question: z.string().describe("A question to ask the human..."),
      choices: z.array(z.string()).describe("Suggested choices..."),
    }),
  ),
});
```

**Key Implementation Details**:

- Uses `agent.askQuestion()` API with form-based questions
- Supports iterative questioning for multiple questions
- Converts choice-based questions to treeSelect type
- Text questions without choices use text input type
- Handles `__other__` option for freeform responses

#### getFileFeedback Tool

Located at `pkg/feedback/tools/getFileFeedback.ts`:

```typescript
const name = "feedback_getFileFeedback";
const displayName = "Feedback/getFileFeedback";

const inputSchema = z
  .object({
    filePath: z.string().describe("The path where the file content should be saved..."),
    content: z.string().describe("The actual text content to be reviewed."),
    contentType: z.string().default("text/plain"),
  })
  .strict();
```

**Key Implementation Details**:

- Creates temporary directory for preview server
- Supports multiple content types (plain text, Markdown, HTML, JSON)
- Uses marked.js for Markdown rendering
- Express server for serving preview UI
- Accept/reject with optional comments
- Automatic cleanup of temporary files

#### react-feedback Tool

Located at `pkg/feedback/tools/react-feedback.ts`:

```typescript
const name = "feedback_react-feedback";
const displayName = "Feedback/react-feedback";

const inputSchema = z
  .object({
    code: z.string().describe("The complete source code of the React component..."),
    file: z.string().exactOptional().describe("The filename/path..."),
  })
  .strict();
```

**Key Implementation Details**:

- Uses esbuild for bundling React components
- Externalizes react and react-dom as global variables
- Serves preview via Express server
- React 18 loaded from unpkg CDN
- Automatic cleanup after feedback submission

### Services

The package does not define its own TokenRingService implementations. Instead,
it relies on existing services:

- **ChatService**: Required for tool registration
- **FileSystemService**: Required by `getFileFeedback` and `reactFeedback`
- **Agent**: Required for logging and service access

### Plugin Structure

Located at `pkg/feedback/plugin.ts`:

```typescript
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import packageJSON from "./package.json" with { type: "json" };
import tools from "./tools.ts";

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  displayName: "Human Feedback",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, _config) {
    app.waitForService(ChatService, chatService => chatService.addTools(...tools));
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

**Plugin Registration Flow**:

1. Plugin is installed via `app.install(feedbackPlugin)`
2. Plugin waits for ChatService to be available
3. All tools are registered with ChatService via `addTools()`
4. Tools become available for use in chat interactions

### RPC Endpoints

This package does not define any RPC endpoints.

### Chat Commands

This package does not define any chat commands. Tools are invoked through the
ChatService's tool calling mechanism, not through slash commands.

### Schema Documentation

The package uses an empty configuration schema with no configurable options:

```typescript
import { z } from "zod";

const packageConfigSchema = z.object({});
```

This minimal schema ensures the plugin can be installed without any configuration
parameters.

### Tool Input Schemas

#### ask_questions Schema

```typescript
z.object({
  message: z.string().describe(
    "A free-form, paragraph sized message, explaining the problem you are " +
    "facing, or the uncertainty you have about the task."
  ),
  questions: z.array(
    z.object({
      question: z.string().describe("A question to ask the human..."),
      choices: z.array(z.string()).describe(
        "Suggested choices for the human to select from..."
      ),
    })
  ),
});
```

#### getFileFeedback Schema

```typescript
z.object({
  filePath: z.string().describe(
    "The path where the file content should be saved if accepted."
  ),
  content: z.string().describe("The actual text content to be reviewed."),
  contentType: z.string().describe(
    "Optional. The MIME type of the content..."
  ).default("text/plain"),
}).strict();
```

#### react-feedback Schema

```typescript
z.object({
  code: z.string().describe(
    "The complete source code of the React component to be previewed..."
  ),
  file: z.string().exactOptional().describe(
    "The filename/path of the React component to be previewed"
  ),
}).strict();
```

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
  describe("ask_questions", () => {
    it("should throw error if message is missing", async () => {
      await expect(
        askQuestionsTool.execute(
          { message: "", questions: [] },
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
- `@tokenring-ai/utility@0.2.0` - Utility functions
- `zod@^4.3.6` - Schema validation
- `esbuild@^0.28.0` - React component bundling
- `esbuild-plugin-external-global@^1.0.1` - ESBuild plugin for external globals
- `express@^5.2.1` - Web server for preview
- `marked@^17.0.6` - Markdown rendering
- `date-fns@^4.1.0` - Date formatting
- `open@^11.0.0` - Browser launcher

#### Development Dependencies

- `typescript@^6.0.2` - TypeScript compiler
- `@types/express@^5.0.6` - Express type definitions
- `vitest@^4.1.1` - Testing framework

### Error Handling

All tools follow consistent error handling patterns.

#### Parameter Validation

```typescript
// ask_questions: Validates that at least one question is provided
if (questionItems.size === 0) {
  return "You did not provide any questions...";
}

// getFileFeedback: Validates filePath and content are provided
if (!filePath || !content) {
  throw new Error(
    `[getFileFeedback] filePath and content are required.`
  );
}

// react-feedback: Validates code is provided
if (!code) {
  throw new Error(`[react-feedback] code is required.`);
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
- `@tokenring-ai/utility`: Required for array utilities

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
