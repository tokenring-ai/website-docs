# Feedback Plugin

Tools for soliciting and collecting feedback from human users during task execution.

## Overview

The `@tokenring-ai/feedback` package provides tools that enable AI agents to solicit and collect feedback from human users during task execution. This is crucial for iterative development, validation, and human-in-the-loop interactions in AI-driven workflows.

## Key Features

- Ask humans open-ended questions or present multiple-choice options
- Display file contents for review and approval/rejection
- Render React components in browser for visual feedback
- Temporary file handling with automatic cleanup
- Browser-based UI for interactive feedback

## Core Components

### Tools

**askHuman**: Allows AI to ask questions about the current task
- Supports free-text responses or single/multiple-choice selections
- Input: `{ question, choices?, response_type? }`
- Returns: `{ status, question, response_type, timestamp, message }`

**getFileFeedback**: Displays file content in browser for review
- Supports plain text, Markdown, HTML, and JSON rendering
- Human can accept/reject with optional comments
- Input: `{ filePath, content, contentType? }`
- Returns: `{ status: 'accepted' | 'rejected', comment?, filePath? }`

**react-feedback**: Bundles and previews React components
- Uses esbuild for fast bundling
- Serves via temporary browser UI
- Input: `{ code, file? }`
- Returns: `{ status: 'accept' | 'reject', comment? }`

## Usage Examples

### Asking a Text Question

```typescript
import { askHuman } from '@tokenring-ai/feedback/tools/askHuman.js';

const result = await askHuman.execute(
  { question: 'What improvements would you suggest for this feature?' },
  agent
);
```

### Multiple-Choice Question

```typescript
const result = await askHuman.execute(
  {
    question: 'Which option do you prefer?',
    choices: ['Option A', 'Option B', 'Option C'],
    response_type: 'multiple'
  },
  agent
);
```

### Reviewing File Content

```typescript
import { getFileFeedback } from '@tokenring-ai/feedback/tools/getFileFeedback.js';

const content = '# Sample Markdown\nThis is **bold** text.';
const result = await getFileFeedback.execute(
  {
    filePath: 'docs/sample.md',
    content,
    contentType: 'text/markdown'
  },
  agent
);

if (result.status === 'accepted') {
  console.log('Content saved to', result.filePath);
}
```

### Previewing React Component

```typescript
import { reactFeedback } from '@tokenring-ai/feedback/tools/react-feedback.js';

const jsxCode = `
import React from 'react';
export default function MyComponent() {
  return <div>Hello, Feedback!</div>;
}
`;

const result = await reactFeedback.execute(
  { code: jsxCode, file: 'src/MyComponent.tsx' },
  agent
);
```

## Configuration Options

- `contentType` (getFileFeedback): Controls rendering ('text/plain', 'text/markdown', 'text/html', 'application/json')
- `response_type` (askHuman): Defaults based on `choices` presence
- Server ports: Auto-assigned (random available port)
- Temp directories: Use OS tmpdir with prefixes

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/filesystem@0.1.0`: File operations
- `esbuild@^0.25.9`: Bundling for React
- `express@^5.1.0`: Server for UI
- `open@^10.2.0`: Browser launching
- `marked@^16.1.2`: Markdown rendering
- `react@^19.1.1`, `react-dom@^19.1.1`: React support
