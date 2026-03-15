# Feedback Package

Provides tools for human-in-the-loop interactions in AI workflows, allowing agents to pause execution, present information to users, and collect feedback through chat-based questioning and browser-based reviews.

## Package Reference

**Package Name**: `@tokenring-ai/feedback`  
**Version**: 0.2.0  
**License**: MIT

## Overview

The feedback package enables AI agents to interact with humans during execution through three primary mechanisms:

1. **Interactive Chat Questioning**: Ask multiple questions via chat with support for text responses or multiple-choice options using structured form inputs
2. **Browser-Based File Review**: Display file contents (text, Markdown, HTML, JSON) in browser UIs for approval/rejection with optional comments
3. **React Component Preview**: Bundle and preview React components in browsers for visual feedback and approval

This package is designed for task uncertainty resolution, approval workflows, and interactive content review scenarios where human input is needed before proceeding.

## Installation

```bash
bun add @tokenring-ai/feedback
```

## Package Structure

```
pkg/feedback/
├── index.ts              # Main entry point (currently empty)
├── plugin.ts             # Plugin registration
├── tools.ts              # Tool exports aggregator
├── tools/                # Core tool implementations
│   ├── askQuestions.ts   # Interactive questioning tool
│   ├── getFileFeedback.ts # File content review tool
│   └── react-feedback.ts  # React component preview tool
├── package.json          # Package metadata and dependencies
├── vitest.config.ts      # Testing configuration
├── BRAINSTORM.md         # Feature brainstorming document
└── README.md             # Package documentation
```

## Core Tools

### 1. Feedback/askQuestions

Interactive questioning tool that presents form-based questions to users with optional multiple-choice options and freeform text responses.

**Tool Name**: `ask_questions`  
**Tool Display**: `Feedback/askQuestions`

**Description**: Use this tool when human feedback is needed or when you're uncertain about the proper path to complete a task. It provides a strong guarantee that decisions align with user intent. You can ask one or more questions, and you can also provide choices for the user to choose from for each one. The user will either pick one of these choices, or respond with their own answer if none of the options are aligned with their intent.

**Input Schema** (Zod):

```typescript
z.object({
  message: z.string().describe("A free-form, paragraph sized message, explaining the problem you are facing, or the uncertainty you have about the task."),
  questions: z.array(z.object({
    question: z.string().describe("A question to ask the human, such as something to clarify, or to get additional information on."),
    choices: z.array(z.string()).describe("Suggested choices for the human to select from. The human can choose from any of these options or provide their own response.")
  }))
})
```

**Input Parameters**:

- **message** (string): Required - Free-form paragraph explaining the problem or uncertainty
- **questions** (array): Required - Array of question objects
  - **question** (string): Required - The specific question to ask
  - **choices** (string[]): Required - Suggested choices for the user to select from (can be empty for freeform responses)

**Browser Response Format**:

The tool uses the agent's `askQuestion` API with a form-based interface. Users can:
- Select from provided choices (treeSelect)
- Provide freeform text responses (text input)
- Choose "Other" to provide custom answers for multiple-choice questions

**Example Usage**:

```typescript
import askQuestions from "@tokenring-ai/feedback/tools/askQuestions";

// Single question with choices
const result = await askQuestions.execute({
  message: "I'm unsure about the best approach for this feature.",
  questions: [
    {
      question: "Which implementation method do you prefer?",
      choices: ["Method A", "Method B", "Method C"]
    }
  ]
}, agent);

// Ask multiple questions
const result = await askQuestions.execute({
  message: "I need information to complete this task properly.",
  questions: [
    {
      question: "What is the priority level?",
      choices: ["High", "Medium", "Low"]
    },
    {
      question: "What is the deadline?",
      choices: ["Urgent", "Within week", "Flexible"]
    }
  ]
}, agent);

// Ask a question without choices (freeform response)
const result = await askQuestions.execute({
  message: "I need additional information about the requirements.",
  questions: [
    {
      question: "What specific details do you need to provide?",
      choices: []  // Empty choices array allows freeform input
    }
  ]
}, agent);
```

**Response Format**:

Returns a formatted string with the user's responses:

```
The user has provided the following responses:

Question 1
Answer 1

Question 2
Answer 2
```

**Implementation Details**:

- Form-based questions using agent's `askQuestion` API
- Supports both `treeSelect` (for choices) and `text` (for freeform) input types
- Users can select from choices or choose "Other (Will open a text box for a freeform answer)" for freeform input
- Empty choices array creates text input for freeform responses
- Questions are collected iteratively until all are answered
- If a user doesn't provide an answer, returns "The user did not provide an answer, use your own judgement"
- If user doesn't respond at all, throws error: "The user did not respond to the question prompt. Stop what you are doing. Do not call any more tools until the user gives you further instructions."
- Question items are dynamically transformed: choices → treeSelect, no choices → text

**Behavior**:

- If choices are provided, users can select one option or choose "Other" for freeform input
- If no choices are provided, users can type freeform responses
- The tool continues asking questions until all are answered
- If a user doesn't provide an answer, the agent uses its own judgment
- Uses agent's `askQuestion` API with form-based questions and treeSelect/text fields

**Error Handling**:

- Throws error if user doesn't respond to question prompt at all
- Returns default message if user doesn't provide answer to specific question
- Validates that at least one question is provided

---

### 2. Feedback/getFileFeedback

Browser-based file content review tool that displays file contents (text, Markdown, HTML, JSON) in an interactive UI for user approval/rejection with optional comments.

**Tool Name**: `feedback_getFileFeedback`  
**Tool Display**: `Feedback/getFileFeedback`

**Description**: This tool allows you to present the content of a file to the user, solicit feedback (accept/reject with comments), and optionally write the content to a specified file path if accepted. If the `contentType` is `text/markdown` or `text/x-markdown`, the content will be rendered as HTML for review. Creates a browser-based UI the user can review and leave comments on.

**Input Schema** (Zod):

```typescript
z.object({
  filePath: z.string().describe("The path where the file content should be saved if accepted."),
  content: z.string().describe("The actual text content to be reviewed."),
  contentType: z.string()
    .describe("Optional. The MIME type of the content (e.g., 'text/plain', 'text/html', 'application/json', 'text/markdown', 'text/x-markdown'). Defaults to 'text/plain'. If 'text/markdown' or 'text/x-markdown', content is rendered as HTML for review. Used for browser rendering.")
    .default("text/plain")
}).strict()
```

**Input Parameters**:

- **filePath** (string): Required - Path where content should be saved if accepted
- **content** (string): Required - The actual text content to be reviewed
- **contentType** (string, optional): MIME type for content rendering. Defaults to `text/plain`. Options:
  - `text/plain`: Plain text with HTML escaping
  - `text/markdown`, `text/x-markdown`: Markdown rendered to HTML using marked.js
  - `text/html`: Raw HTML content rendered in iframe (saved to separate file)
  - `application/json`: JSON formatted with syntax highlighting

**Supported Content Types**:

- `text/plain`: Plain text display with HTML escaping
- `text/markdown`, `text/x-markdown`: Markdown rendering using marked.js library
- `text/html`: Raw HTML content rendered in iframe (content saved to `user_content.html`)
- `application/json`: JSON formatted with HTML escaping in pre tag

**Browser Response Format**:

```typescript
{
  type: "json",
  data: {
    status: "accepted" | "rejected",
    comment?: string,         // User's comment if provided
    filePath?: string,        // Path where content was saved (if accepted)
    rejectedFilePath?: string // Original filePath (if rejected)
  }
}
```

**Example Usage**:

```typescript
import getFileFeedback from "@tokenring-ai/feedback/tools/getFileFeedback";

// Review Markdown content
const result = await getFileFeedback.execute({
  filePath: "docs/sample.md",
  content: "# Sample Markdown\nThis is **bold** text.",
  contentType: "text/markdown"
}, agent);

// Review JSON content
const result = await getFileFeedback.execute({
  filePath: "config/settings.json",
  content: JSON.stringify({ theme: "dark", language: "en" }, null, 2),
  contentType: "application/json"
}, agent);

// Review HTML content
const result = await getFileFeedback.execute({
  filePath: "templates/page.html",
  content: "<h1>Welcome</h1><p>This is HTML content.</p>",
  contentType: "text/html"
}, agent);

// Review plain text
const result = await getFileFeedback.execute({
  filePath: "README.txt",
  content: "This is plain text content.",
  contentType: "text/plain"
}, agent);
```

**Response Handling**:

```typescript
if (result.data.status === "accepted") {
  // Content successfully saved to filePath
  console.log("Content accepted:", result.data.filePath);
  if (result.data.comment) {
    console.log("User comment:", result.data.comment);
  }
} else {
  // Content saved with rejected suffix
  console.log("Content rejected:", result.data.rejectedFilePath);
  if (result.data.comment) {
    console.log("User comment:", result.data.comment);
  }
}
```

**Implementation Details**:

1. **Temporary Directory**: Creates temp directory with prefix `file-feedback-`
2. **HTML Content Handling**: For `text/html` content type, writes content to `user_content.html` in temp directory
3. **Review UI Generation**: Generates HTML review page with:
   - Accept/Reject buttons at top of page
   - Comment textarea for user feedback
   - Content display area with appropriate rendering
4. **Express Server**: Starts HTTP server to serve the review UI
5. **Browser Launch**: Automatically launches browser using `open` package
6. **Content Rendering**:
   - Markdown: Uses `marked.js` library for HTML conversion with CSS styling
   - HTML: Renders in iframe referencing `user_content.html` for proper isolation
   - JSON: Pre-formatted display with HTML escaping
   - Plain text: Safe HTML escaping for display
7. **File Operations**:
   - If accepted: Saves content to specified `filePath` using FileSystemService
   - If rejected: Saves content with `.rejectedyyyyMMdd-HHmmss` suffix (e.g., `file.rejected20240115-143022.txt`)
8. **Cleanup**: Automatically removes temporary directory and stops server
9. **Error Handling**: Throws error if required parameters are missing; cleanup errors are logged but don't stop execution

**Error Handling**:

- Throws error if `filePath` or `content` parameters are missing
- Cleanup errors are caught and logged but don't stop execution
- Server startup errors are logged with fallback URL reporting

---

### 3. Feedback/react-feedback

React component preview tool that bundles and renders React components in a browser for visual review and user feedback.

**Tool Name**: `feedback_react-feedback`  
**Tool Display**: `Feedback/react-feedback`

**Description**: This tool lets you solicit feedback from the user, by opening a browser window, where you can show them an HTML document (formatted in JSX, to be rendered via React), and then allows them to accept or reject the document, and optionally add comments, which are then returned to you as a result. Bundles React components and renders them in the browser for visual review.

**Input Schema** (Zod):

```typescript
z.object({
  code: z.string().describe("The complete source code of the React component to be previewed. This should be valid JSX/TSX that can be bundled and rendered in the browser."),
  file: z.string().optional().describe("The filename/path of the React component to be previewed")
}).strict()
```

**Input Parameters**:

- **code** (string): Required - Complete source code of React component to preview (valid JSX/TSX)
- **file** (string, optional): Filename/path of the React component. Defaults to auto-generated timestamped name: `React-Component-Preview-{ISO timestamp}.tsx`

**Browser Response Format**:

```typescript
// Accepted response
{
  type: "json",
  data: {
    status: "accept",
    comment?: string
  }
}

// Rejected response
{
  type: "json",
  data: {
    status: "reject" | "rejected",
    comment?: string
  }
}
```

**Example Usage**:

```typescript
import reactFeedback from "@tokenring-ai/feedback/tools/react-feedback";

const jsxCode = `
import React from 'react';

export default function MyComponent() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h1>Hello, Feedback!</h1>
      <p>This component can be reviewed and accepted or rejected.</p>
    </div>
  );
}
`;

const result = await reactFeedback.execute({
  code: jsxCode,
  file: "src/components/MyComponent.tsx"
}, agent);
```

**Response Handling**:

```typescript
if (result.data.status === "accept") {
  // Component saved to configured location
  console.log("Component accepted");
  if (result.data.comment) {
    console.log("User comment:", result.data.comment);
  }
} else {
  // Component saved with rejected suffix
  console.log("Component rejected");
  if (result.data.comment) {
    console.log("User comment:", result.data.comment);
  }
}
```

**Implementation Details**:

1. **Temporary Directory**: Creates temp directory with prefix `react-preview-`
2. **File Creation**: Writes component code to temp directory with specified filename or timestamped name
3. **Component Bundling**: Uses esbuild to bundle React component:
   - Entry point: Component file in temp directory
   - Output: `bundle.ts` in temp directory
   - JSX transformation: Automatic mode
   - Platform: Browser
   - External dependencies: `react`, `react-dom`, `react/jsx-runtime`
   - Global name: `window.App`
   - Plugin: `esbuild-plugin-external-global` for external globals
4. **HTML Wrapper**: Generates HTML page that:
   - Loads React 18 development builds from CDN (`https://unpkg.com/react@18/umd/react.development.ts`)
   - Loads React DOM 18 from CDN (`https://unpkg.com/react-dom@18/umd/react-dom.development.ts`)
   - Defines `window.JSX` with `React.createElement` for JSX runtime
   - Loads bundled component
   - Renders component using `ReactDOM.createRoot`
   - Includes styled overlay with Accept/Reject buttons and comment textarea
5. **Review UI Features**:
   - Fixed overlay at top with Accept/Reject buttons
   - Comment textarea (5 rows height)
   - Styled with yellow theme for submit button
   - Alert notification on submission
6. **Express Server**: Starts HTTP server to serve the preview
7. **Browser Launch**: Automatically opens browser to preview page
8. **File Operations**:
   - If accepted: Saves component code to specified `file` path using FileSystemService
   - If rejected: Saves component with `.rejectedyyyyMMdd-HH:mm` suffix (e.g., `component.rejected20240115-14:30.tsx`)
9. **Cleanup**: Removes temporary directory and stops server
10. **Error Handling**: Throws error if `code` parameter is missing

**Bundling Configuration**:

```typescript
await esbuild.build({
  entryPoints: [jsxPath],
  outfile: bundlePath,
  bundle: true,
  jsx: "automatic",
  platform: "browser",
  external: ["react", "react-dom", "react/jsx-runtime"],
  globalName: "window.App",
  plugins: [
    externalGlobalPlugin({
      react: "window.React",
      "react-dom": "window.ReactDOM",
      "react/jsx-runtime": "window.JSX",
      jQuery: "$"
    })
  ]
});
```

**CDN Resources**:

- React 18 development: `https://unpkg.com/react@18/umd/react.development.ts`
- React DOM 18 development: `https://unpkg.com/react-dom@18/umd/react-dom.development.ts`
- JSX runtime: `window.JSX = { "jsx": React.createElement, "jsxs": React.createElement }`

**Error Handling**:

- Throws error if `code` parameter is missing
- Cleanup errors are not explicitly caught (temporary directory is removed after file operations)

## Plugin Configuration

The package uses a minimal configuration schema that accepts no custom configuration options.

**Plugin Registration**:

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

### Configuration Schema

```typescript
const packageConfigSchema = z.object({});
// No configuration options available
```

### Required Services

The package requires the following services to be registered:

- **ChatService**: Required for tool registration
- **FileSystemService**: Required by getFileFeedback and reactFeedback for file operations
- **Agent**: Required for logging and service access

## Key Features

### Human-in-the-Loop Workflows

- **Uncertainty Resolution**: Ask questions when unsure about task approach or requirements
- **Approval Systems**: Get user approval for code, content, or configurations
- **Feedback Collection**: Gather freeform or structured user feedback

### Multiple Question Types

- **Form-based Questions**: Structured questions with treeSelect for multiple-choice options
- **Freeform Responses**: Unstructured text inputs for open-ended questions
- **Multi-question Workflows**: Collect multiple questions in single interaction
- **Iterative Questioning**: Clear previously asked questions as they're answered

### Rich Content Review

- **Multiple Content Types**: Support for plain text, Markdown, HTML, and JSON
- **Smart Rendering**: Appropriate rendering for each content type
- **Interactive UI**: Browser-based review interface with Accept/Reject buttons
- **Comment System**: Optional user comments with final feedback
- **Visual Preview**: React component preview with proper bundling and rendering

### Automatic Operations

- **Browser Launch**: Automatically opens browser for review
- **Temporary Files**: Creates and cleans up temporary directories
- **Server Management**: Runs and stops preview servers as needed
- **File Operations**: Saves accepted or rejected content automatically
- **Error Logging**: Graceful error handling with agent logging

### Integration Pattern

- **Tool-based Integration**: Simple tool registration via ChatService
- **Auto-registration**: Tools automatically registered when plugin installs
- **Service Access**: Uses agent's service requirement pattern
- **Logging Integration**: Message logging with tool name prefixes
- **Type Safety**: Full TypeScript support with Zod schema validation

## Tools Export

### Tool Registration

Tools are registered via the plugin system when the package is installed:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
```

Where `tools` is exported from `tools.ts`:

```typescript
import askQuestions from "./tools/askQuestions.ts";
import getFileFeedback from "./tools/getFileFeedback.js";
import reactFeedback from "./tools/react-feedback.js";

export default {
  askQuestions,
  getFileFeedback,
  reactFeedback,
};
```

Each tool follows the `TokenRingToolDefinition` pattern with:
- **name**: Internal tool name
- **displayName**: Formatted as "Category/ToolName"
- **description**: Detailed explanation of functionality
- **inputSchema**: Zod schema for validation
- **execute**: Async function that performs the tool's action

### Tool Interface

All tools export the following structure:

```typescript
export default {
  name: "tool_name",
  displayName: "Category/ToolName",
  description: "Tool description",
  inputSchema: z.object({ ... }),
  execute: async (params, agent) => { ... }
} satisfies TokenRingToolDefinition<typeof inputSchema>;
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands.

## Agent Configuration

The feedback package integrates with the Token Ring agent system through its tools. The tools expect an Agent instance to access services, logging, and human interaction capabilities.

### Required Services

The following services must be available for the tools to function:

- **ChatService**: Required for tool registration (handled by plugin)
- **FileSystemService**: Required by getFileFeedback and reactFeedback for file operations
- **Agent**: Required for logging, service access, and human interaction via `askQuestion` API

### Service Access Pattern

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

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/app@0.2.0` - Base application framework
- `@tokenring-ai/chat@0.2.0` - Chat service
- `@tokenring-ai/agent@0.2.0` - Agent system and question schema
- `@tokenring-ai/filesystem@0.2.0` - File system service
- `zod@^4.3.6` - Schema validation
- `esbuild@^0.27.4` - React component bundling
- `esbuild-plugin-external-global@^1.0.1` - External global plugin for esbuild
- `express@^5.2.1` - Web server for preview
- `marked@^17.0.4` - Markdown rendering
- `date-fns@^4.1.0` - Date formatting
- `date-fns-tz@^3.2.0` - Time zone support
- `open@^11.0.0` - Browser launcher
- `react@^19.2.4` - React library (package dependency, but uses React 18 from CDN for browser previews)
- `react-dom@^19.2.4` - React DOM library (package dependency, but uses React DOM 18 from CDN for browser previews)

### Development Dependencies

- `typescript@^5.9.3` - TypeScript compiler
- `@types/express@^5.0.6` - Express type definitions
- `vitest@^4.1.0` - Testing framework

## Error Handling

All tools follow consistent error handling patterns:

### Parameter Validation

```typescript
// askQuestions: Validates that at least one question is provided
if (questionItems.size === 0) {
  return "You did not provide any questions, please provide at least one question to ask the user.";
}

// getFileFeedback: Validates filePath and content are provided
if (!filePath || !content) {
  throw new Error(
    `[feedback_getFileFeedback] filePath and content are required parameters for getFileFeedback.`
  );
}

// reactFeedback: Validates code is provided
if (!code) {
  throw new Error(`[feedback_react-feedback] code is required parameter for react-feedback.`);
}
```

### Graceful Failure

- Invalid input parameters: Throws errors with descriptive messages
- File system operations: Handle errors with logging without crashing
- Server startup: Log errors and fall back to URL reporting
- Cleanup operations:
  - `getFileFeedback`: Caught errors are logged but don't stop execution
  - `react-feedback`: Cleanup errors are not explicitly caught

### Error Types

1. **Validation Errors**: Missing required parameters or invalid input types
2. **File System Errors**: File I/O operations, permissions, path validation
3. **Network Errors**: Server startup, browser launch, HTTP requests
4. **Build Errors**: React component bundling failures (esbuild errors)
5. **Agent Errors**: Service integration issues

## Integration Patterns

### Service Access

```typescript
// Access required services
const fileSystem = agent.requireServiceByType(FileSystemService);

// Use agent logging for tool execution
agent.infoMessage(`[tool-name] Operation started`);
agent.infoMessage(`[tool-name] File review server running at ${url}`);
agent.errorMessage(`[tool-name] Operation failed:`, error);
```

### Tool Registration

Tools are registered via the plugin system:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
```

Where `tools` exports individual tool definitions with the proper structure:

```typescript
export default {
  name: "tool_name",
  displayName: "Category/name",
  description: "Tool description",
  inputSchema: z.object({ ... }),
  execute: async (params, agent) => { ... }
};
```

## Usage Examples

### Basic Question Prompting

```typescript
import askQuestions from "@tokenring-ai/feedback/tools/askQuestions";

// When uncertain about approach
const result = await askQuestions.execute({
  message: "I'm uncertain about which implementation strategy to use for the data processing pipeline.",
  questions: [
    {
      question: "What is your priority concern?",
      choices: ["Performance efficiency", "Code simplicity", "Maintainability", "Scalability"]
    }
  ]
}, agent);

console.log(result);
// Returns: "The user has provided the following responses:\nQuestion 1\nPerformance efficiency"
```

### Requirement Gathering

```typescript
const requirements = await askQuestions.execute({
  message: "I need to understand the requirements for the new feature before implementation.",
  questions: [
    {
      question: "Who are the primary users of this feature?",
      choices: ["Internal team", "External customers", "Partners", "Multiple groups"]
    },
    {
      question: "What are the required performance characteristics?",
      choices: ["Fast iteration", "High throughput", "Low latency", "Scalable"]
    },
    {
      question: "What level of customization is needed?",
      choices: []  // Freeform
    }
  ]
}, agent);
```

### File Approval Workflow

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
  await gitCommit(`docs/api-endpoint-v2.md`);
}
```

### React Component Review

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

### Multi-step Human Approval

```typescript
// Step 1: Get requirements
const requirements = await askQuestions.execute({
  message: "I need specifications for the new feature.",
  questions: [{
    question: "What is the main purpose of this feature?",
    choices: []  // More complex questions
  }]
}, agent);

// Step 2: Approve implementation plan
const planResult = await getFileFeedback.execute({
  filePath: "docs/implementation-plan.md",
  content: generateImplementationPlan(requirements),
  contentType: "text/markdown"
}, agent);

// Step 3: Approve code implementation
const codeResult = await reactFeedback.execute({
  code: implementationCode,
  file: "src/components/Feature.tsx"
}, agent);

// Continue only if all approvals are received
if (planResult.data.status === "accepted" && codeResult.data.status === "accept") {
  // Proceed with implementation
}
```

## Best Practices

### When to Use askQuestions

✅ Use when:
- Uncertainty exists about task direction or requirements
- You're worried about making incorrect decisions
- You need clarification from stakeholders
- Multiple options exist and you need user input
- Complex requirements need breaking down

❌ Don't use when:
- Clear requirements are already established
- Automatic execution without human approval is acceptable
- You want exact implementation details without guidance

### Validation Strategies

Always validate input parameters before tool execution:

```typescript
// Example parameter validation
const { message, questions } = params;

if (!message || typeof message !== "string") {
  throw new Error("[ask_questions] message is required and must be a string");
}

if (!questions || !Array.isArray(questions)) {
  throw new Error("[ask_questions] questions is required and must be an array");
}

questions.forEach(q => {
  if (!q.question || typeof q.question !== "string") {
    throw new Error("[ask_questions] Each question must have a question field");
  }
});
```

### Error Handling

Implement comprehensive error handling:

```typescript
try {
  const result = await execute(params, agent);
  agent.infoMessage(`[tool-name] Success:`, result);
  return result;
} catch (error) {
  agent.errorMessage(`[tool-name] Execution failed:`, error);
  throw error; // Re-throw for caller handling
}
```

### Feedback Workflows

Design workflows with clear user expectations:

1. **Clarify Uncertainty**: Use askQuestions to gather requirements
2. **Get Approval**: Use getFileFeedback or reactFeedback for content review
3. **Log Results**: Document user feedback using agent logging
4. **Decide Next Action**: Based on user input, proceed or iteratively improve

### Component Review Best Practices

- Provide clear context in the code explaining purpose and usage
- Include proper TypeScript types and interfaces
- Test components in various display scenarios
- Consider accessibility when designing review UIs
- Keep component code focused and reusable

### Content Review Best Practices

- Format JSON with proper indentation and syntax highlighting
- Use appropriate MIME types for content types
- Document expected format and structure
- Include examples where possible
- Handle edge cases and error scenarios

## Testing

### Tool Testing Strategy

```typescript
import {describe, it, expect} from "vitest";
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

  describe("getFileFeedback", () => {
    it("should throw error if file path is missing", async () => {
      await expect(
        getFileFeedbackTool.execute(
          {content: "", filePath: ""},
          mockAgent
        )
      ).rejects.toThrow();
    });
  });

  describe("reactFeedback", () => {
    it("should throw error if code is missing", async () => {
      await expect(
        reactFeedbackTool.execute(
          {code: "", file: "test.tsx"},
          mockAgent
        )
      ).rejects.toThrow();
    });
  });
});
```

### Integration Testing

Test service integration and flow coordination:

```typescript
describe("Feedback Integration Tests", () => {
  it("should coordinate multi-step feedback workflow", async () => {
    // Step 1: Ask questions
    const questions = await askQuestions.execute({...}, agent);
    // Step 2: Get file feedback
    const file = await getFileFeedback.execute({...}, agent);
    // Step 3: Get component feedback
    const component = await reactFeedback.execute({...}, agent);

    expect(questions).toBeDefined();
    expect(file).toBeDefined();
    expect(component).toBeDefined();
  });
});
```

### Testing Structure

- Uses vitest for testing
- Tests are located in `**/*.test.ts` files
- Node environment for test execution
- Isolated test runs with globals enabled

### Test Configuration

The package uses the following vitest configuration:

```typescript
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Development

### Building

```bash
# Build the package TypeScript files (no Emit)
bun run build
```

### Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Related Components

### Dependent Packages

- `@tokenring-ai/chat`: Required for ChatService integration
- `@tokenring-ai/app`: Required for TokenRingPlugin abstraction
- `@tokenring-ai/agent`: Required for Agent, askQuestion API, question schemas
- `@tokenring-ai/filesystem`: Required for file operations in feedback tools

### Related Tools

- **Chat Service Tools**: Other tools available through ChatService integration
- **Code Review Tools**: Complementary tools for code validation

### Documentation Standards

Follows the general plugin documentation pattern:
- Tool-focused descriptions with clear input/output schemas
- Browser-based workflow documentation
- Implementation details for internal architectural patterns
- Service integration examples
- Error handling patterns

## License

MIT License - see LICENSE file for details.
