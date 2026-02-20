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
└── tools/                # Core tool implementations
    ├── askQuestions.ts   # Interactive questioning tool
    ├── getFileFeedback.ts # File content review tool
    └── react-feedback.ts  # React component preview tool
```

## Core Tools

### 1. askQuestions

Interactive questioning tool that presents form-based questions to users with optional multiple-choice options and freeform text responses.

**Tool Name**: `ask_questions`  
**Tool Display**: `Feedback/askQuestions`

**Description**: Use this tool when human feedback is needed or when you're uncertain about the proper path to complete a task. It provides a strong guarantee that decisions align with user intent.

**Input Schema** (Zod):

```typescript
{
  message: string,                           // Description of the problem or uncertainty
  questions: Array<{
    question: string,                        // Question to ask the user
    choices: string[]                       // Suggested choices (optional, can be empty for freeform)
  }>
}
```

**Schema Definition**:

```typescript
askQuestions.execute({
  message: string,
  questions: z.array(z.object({
    question: z.string(),
    choices: z.array(z.string()).optional()
  }))
}, agent)
```

**Input Parameters**:

- **message** (string): Required - Free-form paragraph explaining the problem or uncertainty
- **questions** (array): Required - Array of question objects
  - **question** (string): Required - The specific question to ask
  - **choices** (string[], optional): Suggested choices for user to select from. If empty, user can provide freeform responses

**Browser Response Format**:

```typescript
{
  status: "accept" | "reject",
  comments: string  // User's comments
}
```

**Example Usage**:

```typescript
const result = await askQuestions.execute({
  message: "I'm unsure about the best approach for implementing this authentication flow.",
  questions: [
    {
      question: "Which authentication strategy should we implement?",
      choices: ["OAuth 2.0 / OpenID Connect", "JWT tokens", "Session-based auth", "Custom token scheme"]
    }
  ]
}, agent);

// Multiple questions with different types
const result = await askQuestions.execute({
  message: "I need additional information to complete this task properly.",
  questions: [
    {
      question: "What is the priority level for this task?",
      choices: ["High", "Medium", "Low"]
    },
    {
      question: "What deadline should we target?",
      choices: ["Urgent", "Within week", "Flexible"]
    },
    {
      question: "Do you have specific preferences for the approach?",
      choices: []
    }
  ]
}, agent);

// Single-question workflow
const result = await askQuestions.execute({
  message: "I need clarification on the requirements.",
  questions: [{
    question: "What specific requirements do you need to clarify?",
    choices: ["Performance requirements", "Security requirements", "API design", "User interface"]
  }]
}, agent);
```

**Response Format**:

Returns a formatted string with user responses:

```
The user has provided the following responses:

Question 1
Answer 1

Question 2
Answer 2
```

**Implementation Details**:

- Form-based questions with treeSelect or text input fields
- Supports multiple questions that are collected until all are answered
- Allows users to select from choices or provide "Other" for freeform responses
- Non-response behavior: Returns "The user did not provide an answer, use your own judgement"
- Uses agent's askQuestion API with form-based structured questions
- Question items are dynamically transformed from choices to treeSelect questions

**Use Cases**:

- Task clarification when path uncertainty exists
- Requirement gathering from stakeholders
- Approval workflow questions
- Strategy selection when multiple options exist
- Freeform feedback collection

---

### 2. getFileFeedback

Browser-based file content review tool that displays file contents (text, Markdown, HTML, JSON) in an interactive UI for user approval/rejection with optional comments.

**Tool Name**: `feedback_getFileFeedback`  
**Tool Display**: `Feedback/getFileFeedback`

**Description**: Present file content to users for review with Accept/Reject functionality and optional comment submission. Supports multiple content types with appropriate rendering.

**Input Schema** (Zod):

```typescript
{
  filePath: string,          // Path where content will be saved if accepted
  content: string,           // The file content to review
  contentType?: string       // MIME type (defaults to text/plain)
}
```

**Schema Definition**:

```typescript
getFileFeedback.execute({
  filePath: string,
  content: string,
  contentType: z.enum(["text/plain", "text/markdown", "text/x-markdown", "text/html", "application/json"]).optional()
}, agent)
```

**Input Parameters**:

- **filePath** (string): Required - Destination file path where content will be saved if user accepts
- **content** (string): Required - File content to display and review
- **contentType** (string, optional): MIME type for content rendering. Defaults to `text/plain`. Supports:
  - `text/plain`: Plain text with HTML escaping
  - `text/markdown` / `text/x-markdown`: Markdown rendered to HTML using marked.js
  - `text/html`: Raw HTML content rendered in iframe
  - `application/json`: JSON formatted with syntax highlighting

**Browser Response Format**:

```typescript
{
  status: string;  // "accepted" | "rejected"
  comment?: string;  // Optional user comment
  filePath?: string;  // File path of accepted content
  rejectedFilePath?: string;  // File path of rejected content
}
```

**Example Usage**:

```typescript
// Review Markdown documentation
const result = await getFileFeedback.execute({
  filePath: "docs/api-reference.md",
  content: "# API Reference\n\n## Authentication\n\nOAuth 2.0 tokens...",
  contentType: "text/markdown"
}, agent);

// Review JSON configuration
const result = await getFileFeedback.execute({
  filePath: "config/settings.json",
  content: JSON.stringify({
    apiBaseUrl: "https://api.example.com",
    timeout: 30000,
    retryAttempts: 3
  }, null, 2),
  contentType: "application/json"
}, agent);

// Review HTML templates
const result = await getFileFeedback.execute({
  filePath: "templates/welcome.html",
  content: "<!DOCTYPE html><html><body><h1>Welcome</h1></body></html>",
  contentType: "text/html"
}, agent);

// Review plain text
const result = await getFileFeedback.execute({
  filePath: "README.md",
  content: "# Project\nThis is a sample README file.",
  contentType: "text/plain"
}, agent);
```

**Response Handling**:

```typescript
if (result.status === "accepted") {
  // Content successfully saved to filePath
  console.log("Content accepted:", result.filePath);
  if (result.comment) {
    console.log("User comment:", result.comment);
  }
} else {
  // Content saved with rejected suffix
  console.log("Content rejected:", result.rejectedFilePath);
  if (result.comment) {
    console.log("User comment:", result.comment);
  }
}
```

**Implementation Details**:

1. **Temporary Workspace**: Creates temp directory prefix `file-feedback-`
2. **Review UI**: Generates HTML page with Accept/Reject buttons and comment textarea
3. **Server**: Starts Express server in temp directory
4. **Browser**: Automatically launches browser to show review page
5. **Content Rendering**:
   - Markdown: Uses marked.js library on client side
   - HTML: Renders in iframe for proper isolation
   - JSON: Syntax highlighting with escaped content
   - Plain text: Safe HTML escaping for display
6. **File Operations**:
   - Accepted content: Saved to requested filePath
   - Rejected content: Saved with `.rejectedyyyyMMdd-HHmmss` suffix
7. **Cleanup**: Automatically removes temp directory on completion
8. **User Feedback Display**: Shows feedback bar at top of page with styling for accept/reject buttons

**Content Type Rendering**:

- **Plain Text**: Safe HTML escaping of content for display
- **Markdown**: Client-side rendering with CSS styling for markdown elements
- **HTML**: Iframe rendering with proper isolation from page styles
- **JSON**: Pre-formatted display with syntax highlighting

**Use Cases**:

- Code review before commit
- Documentation approval workflow
- Configuration file validation
- Template review and acceptance
- AI-generated content validation
- File content verification

---

### 3. reactFeedback

React component preview tool that bundles and renders React components in a browser for visual review and user feedback.

**Tool Name**: `feedback_react-feedback`  
**Tool Display**: `Feedback/react-feedback`

**Description**: Preview React components in browser UIs with Accept/Reject functionality and optional comments. The tool bundles the component code and renders it in a portable HTML format.

**Input Schema** (Zod):

```typescript
{
  code: string,              // Complete TSX/JSX code of React component
  file?: string              // Component filename (optional, defaults to timestamped name)
}
```

**Schema Definition**:

```typescript
reactFeedback.execute({
  code: string,
  file: z.string().optional()
}, agent)
```

**Input Parameters**:

- **code** (string): Required - Complete React component source code in JSX/TSX format
- **file** (string, optional): Desired filename for the component

**Browser Response Format**:

```typescript
// Accepted response
{
  status: "accept",      // or "reject"
  comment?: string       // Optional user comment
}

// Rejected response
{
  status: "reject",
  comment?: string
}
```

**Example Usage**:

```typescript
const componentCode = `
import React from 'react';

export default function UserProfile({
  username,
  avatar,
  bio
}: {
  username: string;
  avatar: string;
  bio: string;
}) {
  return (
    <div style={{
      padding: '20px',
      border: '2px solid #ddd',
      borderRadius: '8px',
      maxWidth: '400px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <img
        src={avatar}
        alt={username}
        style={{ width: '100px', borderRadius: '50%' }}
      />
      <h2>{username}</h2>
      <p style={{ color: '#666' }}>{bio}</p>
    </div>
  );
}
`;

const result = await reactFeedback.execute({
  code: componentCode,
  file: "src/components/UserProfile.tsx"
}, agent);

// Packaged result types (Internal use, return type)
type ReactToolResult = {
  status: "accept" | "reject";
  comment?: string;
};
```

**Response Handling**:

```typescript
if (result.status === "accept") {
  // Component saved to configured location
  console.log("Component accepted:", result.comment || "with no comments");
} else {
  // Component saved with rejected suffix
  console.log("Component rejected:", result.comment || "with no comments");
}
```

**Implementation Details**:

1. **Temporary Workspace**: Creates temp directory prefix `react-preview-`
2. **File Creation**: Writes component code to temp directory with specified filename or timestamped name
3. **Component Bundling**: Uses esbuild to bundle React component:
   - Converts JSX using automatic transformation mode
   - Configures external globals: `react`, `react-dom`, `react/jsx-runtime`
   - Packages all imports and dependencies
   - Injects React 18 development builds from CDN
4. **HTML Wrapper**: Generates HTML page with:
   - Accept/Reject button overlay
   - Comment textarea
   - React 18 script injection from CDN
   - Component bundle loading
   - React DOM rendering logic
5. **Review UI**: Features styled overlay with:
   - Accept button (yellow theme)
   - Reject button (default theme)
   - Comment textarea (5 rows)
   - Submit handling with alert notification
6. **Server**: Express server running in temp directory
7. **Browser Launch**: Automatically opens browser to preview page
8. **File Operations**:
   - Accepted component: Saved to specified file path
   - Rejected component: Saved with `.rejectedyyyyMMdd-HH:mm` suffix
9. **Cleanup**: Removes temp directory after user feedback
10. **Error Handling**: Throws error if code parameter is missing or invalid
11. **Cross-Origin**: Uses CDN-hosted React development builds without CORS issues

**Bundling Configuration**:

```typescript
esbuild.build({
  entryPoints: [componentPath],
  outfile: "./bundle.ts",
  bundle: true,
  jsx: "automatic",        // JSX transformation mode
  platform: "browser",     // Browser platform
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime"
  ],
  globalName: "window.App",
  plugins: esbuildExternalGlobalPlugin({
    react: "window.React",
    "react-dom": "window.ReactDOM",
    "react/jsx-runtime": "window.JSX",
    jQuery: "$"
  })
});
```

**CDN Resources** (Loaded from `https://unpkg.com/`):

- React 18 development build: `react@18/umd/react.development.ts`
- React DOM 18 development build: `react-dom@18/umd/react-dom.development.ts`
- Runtime module: `JSX = { "jsx": React.createElement, "jsxs": React.createElement }`

**Use Cases**:

- UI component review before integration
- Design verification and approval
- Frontend component validation
- Prototype review and feedback
- Component library submission review
- Accessibility and visual testing

## Plugin Configuration

The package uses a minimal configuration schema that accepts no custom configuration options.

**Plugin Registration**:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import feedbackTools from "./tools.ts";

const configSchema = z.object({});

export default {
  name: "@tokenring-ai/feedback",
  version: "0.2.0",
  description: "Feedback package for Token Ring",
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(feedbackTools)
    );
  },
  config: configSchema
} satisfies TokenRingPlugin<typeof configSchema>;
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

## Tools

### askQuestions Tool

**Tool Name**: `ask_questions`  
**Display Name**: `Feedback/askQuestions`  
**Description**: Interactive questioning tool for human-in-the-loop workflows

**Schema**:

```typescript
{
  message: string,                           // Description of the problem or uncertainty
  questions: Array<{
    question: string,                        // Question to ask the user
    choices: string[]                       // Suggested choices
  }>
}
```

**Implementation**:

```typescript
export default {
  name: "ask_questions",
  displayName: "Feedback/askQuestions",
  description: "The ask_questions tool is to be called when feedback from the user is necessary...",
  inputSchema: z.object({
    message: z.string(),
    questions: z.array(z.object({
      question: z.string(),
      choices: z.array(z.string())
    }))
  }),
  execute: async (params, agent) => {
    // Implementation details
  }
} satisfies TokenRingToolDefinition<typeof inputSchema>;
```

### getFileFeedback Tool

**Tool Name**: `feedback_getFileFeedback`  
**Display Name**: `Feedback/getFileFeedback`  
**Description**: Browser-based file content review tool

**Schema**:

```typescript
{
  filePath: string,          // Path where content will be saved if accepted
  content: string,           // The file content to review
  contentType?: string       // MIME type (defaults to text/plain)
}
```

**Implementation**:

```typescript
export default {
  name: "feedback_getFileFeedback",
  displayName: "Feedback/getFileFeedback",
  description: "This tool allows you to present the content of a file to the user...",
  inputSchema: z.object({
    filePath: z.string(),
    content: z.string(),
    contentType: z.string().default("text/plain")
  }),
  execute: async (params, agent) => {
    // Implementation details
  }
} satisfies TokenRingToolDefinition<typeof inputSchema>;
```

### reactFeedback Tool

**Tool Name**: `feedback_react-feedback`  
**Display Name**: `Feedback/react-feedback`  
**Description**: React component preview and review tool

**Schema**:

```typescript
{
  code: string,              // Complete TSX/JSX code of React component
  file?: string              // Component filename (optional)
}
```

**Implementation**:

```typescript
export default {
  name: "feedback_react-feedback",
  displayName: "Feedback/react-feedback",
  description: "This tool lets you solicit feedback from the user...",
  inputSchema: z.object({
    code: z.string(),
    file: z.string().optional()
  }),
  execute: async (params, agent) => {
    // Implementation details
  }
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
async function execute(params: unknown, agent: Agent) {
  // Access required services
  const fileSystem = agent.requireServiceByType(FileSystemService);
  
  // Use agent logging
  agent.infoMessage(`[tool-name] Operation started`);
  
  // Use agent question API
  const response = await agent.askQuestion({...});
}
```

## Dependencies

### Runtime Dependencies

- `zod@^4.3.6` - Schema validation
- `esbuild@^0.27.3` - React component bundling
- `esbuild-plugin-external-global@^1.0.1` - External global plugin for esbuild
- `express@^5.2.1` - Web server for preview
- `marked@^17.0.3` - Markdown rendering
- `date-fns@^4.1.0` - Date formatting
- `date-fns-tz@^3.2.0` - Time zone support
- `open@^11.0.0` - Browser launcher
- `react@^19.2.4` - React library
- `react-dom@^19.2.4` - React DOM library

### Development Dependencies

- `typescript@^5.9.3` - TypeScript compiler
- `@types/express@^5.0.6` - Express type definitions
- `vitest@^4.0.18` - Testing framework

### Token Ring Dependencies

- `@tokenring-ai/app@0.2.0` - Base application framework
- `@tokenring-ai/chat@0.2.0` - Chat service
- `@tokenring-ai/agent@0.2.0` - Agent system and question schema
- `@tokenring-ai/filesystem@0.2.0` - File system service

## Error Handling

All tools follow consistent error handling patterns:

### Parameter Validation

```typescript
// askQuestions: Validates message and questions are provided
if (!message || !questions) {
  throw new Error(`[ask_questions] message and questions are required parameters.`);
}

// getFileFeedback: Validates filePath and content are provided
if (!filePath || !content) {
  throw new Error(
    `[feedback_getFileFeedback] filePath and content are required parameters.`
  );
}

// reactFeedback: Validates code is provided
if (!code) {
  throw new Error(`[feedback_react-feedback] code is required parameter.`);
}
```

### Graceful Failure

- Invalid input parameters: Throws errors with descriptive messages
- File system operations: Handle errors with logging without crashing
- Server startup: Log errors and fall back to URL reporting
- Cleanup operations: Caught errors are logged but don't stop execution

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
import {askQuestions} from "@tokenring-ai/feedback";

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
import {getFileFeedback} from "@tokenring-ai/feedback";

// Before committing documentation
const result = await getFileFeedback.execute({
  filePath: "docs/api-endpoint-v2.md",
  content: "# API Endpoints\n\n## User\n\nGET /api/v2/users...",
  contentType: "text/markdown"
}, agent);

if (result.status === "accepted") {
  // Commit approved documentation
  await gitCommit(`docs/api-endpoint-v2.md`);
}
```

### React Component Review

```typescript
import {reactFeedback} from "@tokenring-ai/feedback";

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
if (result.status === "accept") {
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
if (planResult.status === "accepted" && codeResult.status === "accept") {
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

### Browser Preview Testing

Local testing with browser automation when needed for visual components.

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

### Testing Structure

- Uses vitest for testing
- Tests are located in `**/*.test.ts` files
- Node environment for test execution
- Isolated test runs with globals enabled

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