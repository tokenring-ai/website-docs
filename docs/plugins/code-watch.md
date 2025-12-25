# Code Watch Plugin

Service for watching code changes and triggering AI-powered actions based on special comments in code files.

## Overview

The `@tokenring-ai/code-watch` package provides a file monitoring service that detects and processes special AI comments (`# AI!`, `# AI?`, `# AI`) in code files. When a file containing an AI comment is modified, the service automatically spawns AI agents to process the instructions.

This enables developers to use natural language comments to request code modifications, questions, or notes directly within their codebase, making it easy to get AI assistance while coding.

## Key Features

- **Multi-Filesystem Support**: Watches multiple file systems with configurable polling intervals
- **AI Comment Detection**: Scans files for special AI comments (`# AI!`, `# AI?`, `# AI`)
- **Code Modification**: Spawns code modification agents to process `AI!` comments
- **Question Answering**: Notes `AI?` comments for future implementation
- **AI Notes**: Records `AI` comments for future reference
- **TokenRing Integration**: Seamless integration with the TokenRing application framework
- **Configurable Watchers**: Customizable polling intervals and stability thresholds per filesystem
- **Concurrent Processing**: Handles file processing with configurable concurrency
- **Error Handling**: Comprehensive error handling and service output logging

## Core Components

### CodeWatchService

The main class implementing the file watching and AI comment processing functionality.

**Key Methods:**
- `run(signal: AbortSignal)`: Start the service and begin watching files
- `watchFileSystem(fileSystemProviderName: string, config: FileSystemConfig, signal: AbortSignal)`: Configure watching for a specific filesystem
- `processFileForAIComments(task: {filePath: string, fileSystemProviderName: string})`: Process a file for AI comments
- `checkAndTriggerAIAction(line: string, filePath: string, lineNumber: number, fileSystemProviderName: string)`: Check for AI triggers
- `handleAIComment(commentLine: string, filePath: string, lineNumber: number, fileSystemProviderName: string)`: Handle AI comments based on type
- `triggerCodeModification(content: string, filePath: string, lineNumber: number, fileSystemProviderName: string)`: Process code modification requests

**Configuration Options:**
```typescript
interface CodeWatchServiceOptions {
  filesystems: {
    [key: string]: {
      pollInterval: number;      // Filesystem polling interval in ms
      stabilityThreshold: number; // Stability threshold in ms
      agentType: string;        // Agent type for code modifications
    }
  };
  concurrency: number;          // Processing concurrency level
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

### Configuration Schema

The configuration uses Zod for validation:

```typescript
import {z} from "zod";

export const CodeWatchConfigSchema = z.object({
  filesystems: z.record(z.string(), z.object({
    pollInterval: z.number().default(1000),
    stabilityThreshold: z.number().default(2000),
    agentType: z.string()
  })),
  concurrency: z.number().default(1),
});
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
    // code
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

// Configure the service with multiple filesystems
const config = {
  filesystems: {
    local: {
      pollInterval: 1000,
      stabilityThreshold: 2000,
      agentType: "code-modification-agent"
    }
  },
  concurrency: 1
};

// Add the service to the app
app.addServices(new CodeWatchService(app, config));
```

### Advanced Configuration

Configure multiple filesystems with different settings:

```typescript
import { CodeWatchConfigSchema } from "@tokenring-ai/code-watch";

const config = {
  filesystems: {
    local: {
      pollInterval: 1000,        // 1 second polling
      stabilityThreshold: 2000,  // 2 second stability
      agentType: "code-modification-agent"
    },
    remote: {
      pollInterval: 5000,       // 5 second polling
      stabilityThreshold: 10000, // 10 second stability
      agentType: "remote-code-agent"
    }
  },
  concurrency: 2               // Process 2 files simultaneously
};

// Add the service to the app
app.addServices(new CodeWatchService(app, config));
```

## Configuration Options

### Configuration Schema

```typescript
import { z } from "zod";

export const CodeWatchConfigSchema = z.object({
  filesystems: z.record(z.string(), z.object({
    pollInterval: z.number().default(1000),
    stabilityThreshold: z.number().default(2000),
    agentType: z.string()
  })),
  concurrency: z.number().default(1),
});
```

### Watcher Configuration

The file watcher uses the following settings (per filesystem):

- `pollInterval`: 1000ms (polling frequency)
- `stabilityThreshold`: 2000ms (stability threshold for change detection)

### Concurrency Settings

- `concurrency`: Number of files to process simultaneously (default: 1)

### Agent Configuration

Configure the agent type used for code modifications:

```typescript
const config = {
  filesystems: {
    local: {
      agentType: "code-modification-agent" // Default agent type
    }
  }
};
```

## Package Structure

```
pkg/code-watch/
├── index.ts                 # Entry point and schema definition
├── CodeWatchService.ts      # Main service implementation
├── plugin.ts               # TokenRing plugin interface
├── package.json            # Package configuration and dependencies
├── README.md               # Package documentation
├── LICENSE                 # MIT license
├── vitest.config.ts        # Test configuration
└── vitest.config.ts        # Test configuration
```

## Dependencies

- `@tokenring-ai/app@0.2.0`: Base application framework
- `@tokenring-ai/agent@0.2.0`: Agent management system
- `@tokenring-ai/filesystem@0.2.0`: Filesystem operations
- `zod`: Schema validation
- `@tokenring-ai/utility`: Utility functions
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
- No support for multi-line comment formats (/* ... */)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.