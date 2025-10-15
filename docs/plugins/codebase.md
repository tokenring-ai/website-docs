# Codebase Plugin

Service for managing codebase resources and selectively including project files into AI context.

## Overview

The `@tokenring-ai/codebase` package provides a service for managing codebase resources in TokenRing AI agents. Its primary purpose is to selectively include project files and directory structures into the AI's context through memory messages, enabling AI agents to reason about and interact with the codebase.

## Key Features

- Generate directory tree of relevant files
- Include full contents of specified files in AI context
- Chat commands for enabling/disabling resources
- File matching and filtering
- Integration with filesystem service

## Core Components

### CodeBaseService

Main service for managing resources and generating memories.

**Key Methods:**
- `registerResource(resource)`: Registers a new resource
- `getActiveResourceNames()`: Returns active resource names
- `enableResources(...names)`: Enables specified resources
- `getAvailableResources()`: Returns all registered resource names
- `async* getMemories(agent)`: Yields file trees and contents as memories

### FileTreeResource

Resource for providing file tree (directory structure) for context.

**Properties:**
- `name: "FileTreeService"`
- `description: "Provides FileTree functionality"`

### WholeFileResource

Resource for including full file contents in context.

**Properties:**
- `name: "WholeFileResource"`
- `description: "Provides whole files to include in the chat context"`

### Chat Commands

**/codebaseResources**: Interactive resource management
- No args: Interactive multi-selection tree
- `enable <resource1> <resource2> ...`: Enables specified resources
- `set <resource1> <resource2> ...`: Sets active resources

## Usage Example

```typescript
import { Agent } from '@tokenring-ai/agent';
import { CodeBaseService, FileTreeResource } from '@tokenring-ai/codebase';

const agent = new Agent(/* config */);
const codebaseService = new CodeBaseService();
const treeResource = new FileTreeResource();
codebaseService.registerResource(treeResource);
codebaseService.enableResources('FileTreeService');

// Generate memories
for await (const memory of codebaseService.getMemories(agent)) {
  console.log(memory.content); // Outputs file tree or file contents
}
```

## Configuration Options

- Resource registration: Manually register `FileMatchResource` subclasses
- Enabling resources: Use chat command or `enableResources()` method
- No environment variables required

## Dependencies

- `@tokenring-ai/agent`: Agent integration
- `@tokenring-ai/filesystem`: File system operations
- `@tokenring-ai/utility`: Registry utilities
