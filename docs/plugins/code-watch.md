# Code Watch Plugin

Service for watching code changes and triggering AI-powered actions based on special comments.

## Overview

The `@tokenring-ai/code-watch` package provides a file monitoring service that detects and processes special AI comments (`# AI!`, `# AI?`, `# AI`) in code files. When a file containing an AI comment is modified, the service automatically spawns AI agents to process the instructions.

This enables developers to use natural language comments to request code modifications, questions, or notes directly within their codebase.

## Key Features

- **File Watching**: Monitors the root directory for file additions, changes, and deletions
- **AI Comment Detection**: Scans files for special AI comments (`# AI!`, `# AI?`, `# AI`)
- **Code Modification**: Spawns code modification agents to process `AI!` comments
- **Question Answering**: Notes `AI?` comments for future implementation
- **AI Notes**: Records `AI` comments for future reference
- **TokenRing Integration**: Seamless integration with the TokenRing application framework
- **Configurable Agents**: Customizable agent types for different AI actions
- **Error Handling**: Comprehensive error handling and service output logging

## Core Components

### CodeWatchService

The main class implementing the file watching and AI comment processing functionality.

**Key Methods:**
- `run(signal: AbortSignal)`: Start the service and begin watching files
- `startWatching()`: Start watching the directory for file changes
- `stopWatching()`: Stop watching for file changes
- `onFileChanged(eventType: string, filePath: string)`: Handle file change events
- `processNextFile()`: Process the next file in the queue
- `processFileForAIComments(filePath: string)`: Process a file for AI comments
- `checkAndTriggerAIAction(line: string, filePath: string, lineNumber: number)`: Check for AI triggers
- `handleAIComment(commentLine: string, filePath: string, lineNumber: number)`: Handle AI comments based on type
- `triggerCodeModification(content: string, filePath: string, lineNumber: number)`: Process code modification requests
- `triggerQuestionAnswer(content: string, filePath: string, lineNumber: number)`: Handle question requests
- `noteAIComment(content: string, filePath: string, lineNumber: number)`: Record AI notes

**Configuration Options:**
```typescript
interface CodeWatchServiceOptions {
  agentTypes: {
    codeModification: string;  // Agent type for code modifications
  }
}
```

### Plugin Interface

The package exports a TokenRing plugin with the following structure:

```typescript
export default {
  name: "@tokenring-ai/code-watch",
  version: "0.2.0",
  description: "Service for watching code changes and triggering actions",
  install(app: TokenRingApp) {
    const config = app.getConfigSlice('codewatch', CodeWatchConfigSchema);
    if (config) {
      app.addServices(new CodeWatchService(app, config));
    }
  }
}
```

### Agent Integration

The package includes a specialized code modification agent:

```typescript
import { AgentConfig } from "@tokenring-ai/agent/types";

export default {
  name: "Code Modification Agent",
  description: "A code modification agent to work on files",
  category: "Development",
  type: "background",
  visual: {
    color: "blue",
  },
  chat: {
    systemPrompt: `When you output a file with file tool, you MUST remove any lines that end with AI!. It is a critical failure to leave these lines in the file.`,
    maxSteps: 100,
  },
  initialCommands: [
    "/tools enable @tokenring-ai/filesystem/*",
  ]
} satisfies AgentConfig;
```

## AI Comment Triggers

### Code Modification (`AI!`)

```typescript
// AI! Add a function to calculate factorial
function factorial(n: number): number {
  // Implementation will be added by AI
}
```

```python
# AI! Optimize this loop for better performance
for i in range(1000000):
    # code
```

When a file containing an `AI!` comment is saved, the service will:
1. Detect the comment
2. Spawn a code modification agent
3. Process the instruction and update the file
4. Remove the `AI!` comment line

### Question Answering (`AI?`)

```typescript
// AI? What is the best way to optimize this loop?
for i in range(1000000):
    # code
```

Currently logs the question for future implementation.

### AI Notes (`AI`)

```typescript
// AI This function needs unit tests
function example() {
    // code
}
```

Currently logs the comment for future implementation.

## Usage Examples

### Basic Integration

The package is designed to work as a TokenRing plugin:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import codeWatch from "@tokenring-ai/code-watch";

const app = new TokenRingApp({
  // Your app configuration
});

// Install the code-watch plugin
app.install(codeWatch);

// The service will be automatically configured and started
```

### Manual Configuration

You can also configure the service manually:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import { CodeWatchService } from "@tokenring-ai/code-watch";

const app = new TokenRingApp({
  // Your app configuration
});

// Configure the service
const config = {
  agentTypes: {
    codeModification: "code-modification-agent" // Agent type for code modifications
  }
};

// Add the service to the app
app.addServices(new CodeWatchService(app, config));
```

### Custom Agent Configuration

```typescript
import { CodeWatchService } from "@tokenring-ai/code-watch";

const codeWatchService = new CodeWatchService(app, {
  agentTypes: {
    codeModification: "custom-code-agent" // Use a custom agent type
  }
});
```

## Configuration Options

### Configuration Schema

```typescript
import { z } from "zod";

export const CodeWatchConfigSchema = z.any().optional();
```

### Watcher Configuration

The file watcher uses the following settings:
- `pollInterval`: 1000ms (polling frequency)
- `stabilityThreshold`: 2000ms (stability threshold for change detection)

### Agent Configuration

Configure the agent type used for code modifications:

```typescript
const config = {
  agentTypes: {
    codeModification: "code-modification-agent" // Default agent type
  }
};
```

## Package Structure

```
pkg/code-watch/
├── index.ts                 # Entry point and schema definition
├── CodeWatchService.ts      # Main service implementation
├── plugin.ts               # TokenRing plugin interface
├── agents/
│   └── codeModificationAgent.ts  # Agent configuration for code modifications
├── package.json            # Package configuration and dependencies
├── README.md               # Package documentation
├── LICENSE                 # MIT license
└── vitest.config.ts        # Test configuration
```

## Dependencies

- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/agent`: Agent management system
- `@tokenring-ai/chat`: AI chat functionality
- `@tokenring-ai/filesystem`: Filesystem operations
- `ignore@^7.0.5`: File ignoring patterns

## Testing

Run the test suite:

```bash
bun run test
```

Or with coverage:

```bash
bun run test:coverage
```

## Limitations

- Currently supports only `#` (Python/Shell) and `//` (C-style) comments
- `AI?` and `AI` comment types are stub implementations
- Polling-based file watching (not real-time)
- Assumes UTF-8 text files
- No support for file deletion processing
- Only processes files on add/change events
- Limited to single-line comment detection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.