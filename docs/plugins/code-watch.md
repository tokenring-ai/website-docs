# Code Watch Plugin

Service for monitoring file changes and detecting AI-triggered comments for automatic code modification.

## Overview

The `@tokenring-ai/code-watch` package provides a service for monitoring file changes in a filesystem and detecting special AI-triggered comments within those files. It integrates with the TokenRing AI agent framework to automatically execute actions based on comments like `# AI!` or `// AI?` in code files.

## Key Features

- File system watching with polling
- AI comment detection in code files
- Automatic code modification via AI agents
- Support for Python (#) and C-style (//) comments
- Queued file processing to avoid overload
- Integration with agent checkpoint system

## Core Components

### CodeWatchService

Main service implementing file watching and AI comment processing.

**Key Methods:**
- `constructor(config)`: Initializes with agent types configuration
- `start(agentTeam)`: Starts the file watcher
- `stop(agentTeam)`: Stops the watcher
- `startWatching()`: Creates or recreates the file watcher
- `onFileChanged(eventType, filePath)`: Handles file change events
- `processFileForAIComments(filePath)`: Scans file for AI triggers

### AI Comment Triggers

**AI!**: Triggers code modification
- Creates agent to execute the instruction
- Removes the AI! comment after execution

**AI?**: Question answering (stubbed)
- Logs the question for future implementation

**AI**: Note taking (stubbed)
- Logs the note for future implementation

## Usage Example

```typescript
import { AgentTeam } from '@tokenring-ai/agent';
import { CodeWatchService } from '@tokenring-ai/code-watch';

const options = {
  agentTypes: {
    codeModification: 'code-modifier-agent'
  }
};

const codeWatch = new CodeWatchService(options);
const agentTeam = new AgentTeam(/* config */);

await codeWatch.start(agentTeam);
```

### Triggering Code Modification

Add a comment to a file:
```typescript
// AI! Add a function to calculate factorial
function factorial(n: number): number {
  // Implementation will be added by AI
}
```

On save, the watcher detects the change, spawns an agent, and the AI updates the file.

## Configuration Options

- `agentTypes.codeModification`: String identifier for the agent type to use for code changes (required)
- Watcher config (internal): `pollInterval: 1000ms`, `stabilityThreshold: 2000ms`

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: For AI chat requests
- `@tokenring-ai/agent@0.1.0`: For agent teams
- `@tokenring-ai/filesystem@0.1.0`: For file watching
- `ignore@^7.0.5`: For ignoring files
