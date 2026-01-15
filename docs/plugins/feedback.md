# Feedback Plugin

## Overview

The `@tokenring-ai/feedback` package provides essential tools for AI agents to solicit and collect feedback from human users through various interactive methods. This is crucial for iterative development, validation, and human-in-the-loop interactions in AI-driven workflows.

## Key Features

- **Human Questioning**: Ask humans open-ended questions or present multiple-choice options via chat
- **File Content Review**: Display file contents (text, Markdown, HTML, JSON) in browser UIs for approval/rejection with comments
- **React Component Preview**: Bundle and preview React components in browsers for visual feedback
- **Seamless Integration**: Automatically registers with Token Ring applications via plugin system
- **Safe Handling**: Automatic cleanup of temporary files and secure isolation
- **Type-Safe**: Full TypeScript support with Zod schema validation
- **Browser Preview**: Uses Express servers for local preview with automatic cleanup
- **Bundling Support**: ESBuild integration for React component bundling

## Core Components

The Feedback plugin consists of three main tools for handling human feedback:

- **askHuman**: For soliciting questions and responses from users via chat interface.
- **getFileFeedback**: For reviewing file content in a browser-based UI with support for various content types.
- **reactFeedback**: For previewing and obtaining feedback on React components via a browser interface.

## API Reference

### askHuman

**Purpose**: Ask humans questions via chat interface with support for text or multiple-choice responses.

**Input Schema** (Zod):
```typescript
{
  question: string,           // Required: The question to ask
  choices?: string[],         // Optional: List of choices for selection
  response_type?: "text" | "single" | "multiple"  // Optional: Response type
}
```

**Response Types**:
- `AskHumanTextResult`: `{ status: "question_asked_text", question, response_type, timestamp, message }`
- `AskHumanChoicesResult`: `{ status: "question_asked_choices", question, choices, response_type, timestamp, message }`

**Error Handling**: Throws exceptions for missing required parameters (e.g., empty question)

### getFileFeedback

**Purpose**: Present file content in a browser-based UI for human review and feedback.

**Input Schema** (Zod):
```typescript
{
  filePath: string,          // Required: Target path for accepted content
  content: string,           // Required: File content to review
  contentType?: string       // Optional: MIME type (default: "text/plain")
}
```

**Supported Content Types**:
- `text/plain`: Plain text display with syntax highlighting
- `text/markdown`, `text/x-markdown`: Markdown rendering with marked.js
- `text/html`: HTML content in iframe
- `application/json`: JSON with syntax highlighting

**Response Format**:
```typescript
{
  status: "accepted" | "rejected",
  comment?: string,          // User's comment if provided
  filePath?: string,         // Path where content was saved (if accepted)
  rejectedFilePath?: string  // Path where content was saved (if rejected)
}
```

**Implementation Details**:
- Creates temporary directory for preview
- Spins up Express server for browser interface
- Automatically opens browser (falls back to URL logging)
- Handles user acceptance/rejection with comments
- Cleans up temporary files automatically

### reactFeedback

**Purpose**: Bundle and preview React components in browsers for visual feedback.

**Input Schema** (Zod):
```typescript
{
  code: string,              // Required: JSX/TSX code to preview
  file?: string              // Optional: Target file path (auto-generated if not provided)
}
```

**Response Format**:
```typescript
{
  status: "accept" | "reject",
  comment?: string           // User's optional comment
}
```

**Implementation Details**:
- Uses esbuild for bundling React components
- Bundles with external React CDN imports
- Creates Express server for preview
- Supports JSX/TSX with automatic JSX transformation
- Handles global React imports properly

## Usage Examples

### Basic Usage

```typescript
// Ask an open-ended question
const result = await agent.executeTool('feedback_askHuman', {
  question: "What improvements would you suggest for this feature?"
});

// Review Markdown content
const result = await agent.executeTool('feedback_getFileFeedback', {
  filePath: "docs/sample.md",
  content: "# Sample Markdown\nThis is **bold** text.",
  contentType: "text/markdown"
});

// Preview React component
const jsxCode = `\nimport React from 'react';\n\nexport default function MyComponent() {\n  return (\n    <div style={{ padding: '20px', border: '1px solid #ccc' }}\n      <h1>Hello, Feedback!</h1>\n      <p>This component can be reviewed and accepted or rejected.</p>\n    </div>\n  );\n}\n`;

const result = await agent.executeTool('feedback_reactFeedback', {
  code: jsxCode,
  file: "src/components/MyComponent.tsx"
});
```

### Advanced Usage with Custom Error Handling

```typescript
try {
  const feedbackResult = await agent.executeTool('feedback_askHuman', {
    question: "Please confirm this design",
    choices: ["Yes", "No", "Maybe"],
    response_type: "single"
  });

  if (feedbackResult.status === "question_asked_choices") {
    // Process the user's choice
  }
} catch (error) {
  agent.errorMessage(`[feedback_askHuman] Error occurred:`, error);
}
```

## Configuration

The Feedback plugin automatically registers with Token Ring applications. No additional configuration is required beyond installing the plugin.

### Plugin Registration

```typescript
export default {
  name: "@tokenring-ai/feedback",
  version: "0.2.0",
  description: "Feedback package for Token Ring",
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService => 
      chatService.addTools(packageJSON.name, tools)
    );
  },
} satisfies TokenRingPlugin;
```

## Integration

### Service Dependencies

- **FileSystemService**: Required for file operations
- **ChatService**: Required for tool registration
- **Agent**: Required for logging and service access

### Agent Integration

Tools integrate with agents through the service system:

```typescript
// Access required services
const fileSystem = agent.requireServiceByType(FileSystemService);

// Use agent logging methods
agent.infoMessage(`[tool-name] Operation started`);
agent.errorMessage(`[tool-name] Operation failed:`, error);
```

## Monitoring and Debugging

### Error Handling

All tools follow consistent error handling patterns:

```typescript
// Parameter validation with Zod schemas
if (!question) {
  throw new Error(`[feedback_askHuman] Question is required.`);
}

// Proper error messages
if (!filePath || !content) {
  throw new Error(
    `[feedback_getFileFeedback] filePath and content are required parameters.`
  );
}

// Agent integration with error propagation
try {
  const result = await tool.execute(params, agent);
  return result;
} catch (error) {
  agent.errorMessage(`[tool-name] Operation failed:`, error);
  throw error;
}
```

### State Management

- Temporary files are automatically cleaned up after use
- No persistent state between executions
- Browser sessions are ephemeral

### Limitations and Considerations

- **Browser Requirements**: Browser-based tools require a graphical environment; fallback to URL logging in headless environments
- **Security Considerations**: Temporary files are cleaned up automatically; preview servers run on localhost only
- **Performance Considerations**: React bundling uses esbuild (fast but limited features); browser previews use development CDN scripts
- **Content Support**: Focus on text-based content and React components; binary files not handled

## Development

### Building and Testing

```bash
# Build the package
bun run build

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Code Style Guidelines

- Consistent tool naming: `feedback_toolName`
- Proper error messages with tool prefixes
- Async/await patterns throughout
- Proper TypeScript types and Zod validation
- Agent integration via service requirements
- Implement proper cleanup for temporary resources

### License

MIT License - see LICENSE file for details.