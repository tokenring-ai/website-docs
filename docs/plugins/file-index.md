# File Index Package

The `@tokenring-ai/file-index` package provides file indexing and search capabilities for AI agents, enabling efficient codebase exploration and retrieval through multiple search strategies.

## Overview

The File Index package allows AI agents to search across project files using intelligent search algorithms that combine semantic similarity, full-text matching, and token overlap scoring. This enables more accurate and context-aware code searching compared to simple keyword matching.

### Key Features

- **Hybrid Search**: Combines embedding similarity, full-text matching, and token frequency analysis for comprehensive results
- **Intelligent Result Merging**: Merges adjacent search results to provide more complete code context
- **Configurable Weights**: Fine-tune the balance between different search strategies
- **Provider Architecture**: Extensible system supporting multiple storage backends
- **Agent Integration**: Seamless integration with TokenRing agents through tools and commands

## Quick Examples

### Basic Search Using Tool

```typescript
import { hybridSearchFileIndex } from '@tokenring-ai/file-index';

// Perform hybrid search
const results = await hybridSearchFileIndex.execute(
  {
    query: 'implement user authentication',
    topK: 5,
    textWeight: 0.3,
    fullTextWeight: 0.3,
    mergeRadius: 1
  },
  agent
);

// Results contain merged, ranked code blocks
for (const result of results) {
  console.log(`Path: ${result.path}`);
  console.log(`Score: ${result.hybridScore}`);
  console.log(`Content:\n${result.content}`);
}
```

### Provider Management via Commands

```
/fileindex provider get            # Show active provider
/fileindex provider set ephemeral  # Switch provider
/fileindex provider select         # Interactive selection
/fileindex search function getUser # Search files
```

## Core Components

### FileIndexService

Main service that manages providers and handles search queries.

```typescript
import FileIndexService from './FileIndexService.ts';

const fileIndexService = new FileIndexService(config);
await fileIndexService.waitReady(agent);

// Search
const results = await fileIndexService.search('query', 10, agent);
```

### Hierarchy

```
FileIndexService (registry)
└── FileIndexProvider (interfaces)
    ├── search() - semantic/embedding search
    └── fullTextSearch() - keyword search
```

## Detailed API Reference

### Service Methods

```typescript
// Provider management
registerFileIndexProvider(name: string, provider: FileIndexProvider): void
getAvailableFileIndexProviders(): string[]
setActiveProvider(name: string, agent: Agent): void

// Search operations
search(query: string, limit: number, agent: Agent): Promise<SearchResult[]>
fullTextSearch(query: string, limit: number, agent: Agent): Promise<SearchResult[]>

// Lifecycle
waitReady(agent: Agent): Promise<void>
close(agent: Agent): Promise<void>

// File context
setCurrentFile(filePath: string, agent: Agent): void
clearCurrentFile(agent: Agent): void
getCurrentFile(agent: Agent): string | null
```

### Tool Definition

```typescript
{
  name: 'file-index_hybridSearchFileIndex',
  displayName: 'FileIndex/hybridSearchFileIndex',
  description: 'Hybrid semantic+full-text+keyword search with merging.',
  inputSchema: {
    query: string,        // Search query
    topK: number,         // Number of results (default: 10)
    textWeight: number,   // Token overlap weight (default: 0.3)
    fullTextWeight: number, // Full-text weight (default: 0.3)
    mergeRadius: number    // Merge gap (default: 1)
  }
}
```

### Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Search query text or code pattern |
| `topK` | number | 10 | Maximum number of merged results |
| `textWeight` | number | 0.3 | Importance of token overlap (0-1) |
| `fullTextWeight` | number | 0.3 | Importance of full-text matches (0-1) |
| `mergeRadius` | number | 1 | Max gap between chunks to merge |

### Output

Returns `HybridSearchResult[]`:

```typescript
{
  path: string,        // File path
  start: number,       // Starting chunk index
  end: number,         // Ending chunk index
  hybridScore: number, // Combined relevance score
  content: string      // Merged content
}
```

## Usage Patterns

### Pattern 1: Hybrid Search with Tuned Parameters

Balance between different search strategies:

```typescript
// High semantic, low matching
await hybridSearchFileIndex.execute(
  { query, textWeight: 0.5, fullTextWeight: 0.1, mergeRadius: 1 },
  agent
);

// Emphasize code patterns
await hybridSearchFileIndex.execute(
  { query, textWeight: 0.2, fullTextWeight: 0.7, mergeRadius: 1 },
  agent
);

// Maximize context with wider merging
await hybridSearchFileIndex.execute(
  { query, textWeight: 0.3, fullTextWeight: 0.3, mergeRadius: 2 },
  agent
);
```

### Pattern 2: Provider Switching

```typescript
const service = agent.requireServiceByType(FileIndexService);

// Check available providers
const providers = service.getAvailableFileIndexProviders();
// ['ephemeral', 'persistent']

// Switch provider
service.setActiveProvider('persistent', agent);

// Check current provider
const state = agent.getState(FileIndexState);
console.log(state.activeProvider);
```

### Pattern 3: File Context Tracking

```typescript
const service = agent.requireServiceByType(FileIndexService);

// Set current working file
service.setCurrentFile('/src/models/user.ts', agent);

// Get current file
const current = service.getCurrentFile(agent);

// Clear context when done
service.clearCurrentFile(agent);
```

## Integration Examples

### Service Integration

```typescript
import FileIndexService from './FileIndexService.ts';
import { FileIndexServiceConfigSchema } from './schema.ts';

const config = {
  providers: {
    ephemeral: { type: 'ephemeral' }
  },
  agentDefaults: {
    provider: 'ephemeral'
  }
};

const service = new FileIndexService(config);
app.addServices(service);

// Attach service to agent
agent.attach(service);
```

### Plugin Integration

```typescript
import {TokenRingPlugin} from '@tokenring-ai/app';
import {z} from 'zod';
import chatCommands from './chatCommands.ts';
import {hybridSearchFileIndex} from './tools.ts';
import FileIndexService from './FileIndexService.ts';

const packageConfigSchema = z.object({
  fileIndex: FileIndexServiceConfigSchema.optional()
});

export default {
  name: '@tokenring-ai/file-index',
  install(app, config) {
    if (!config.fileIndex) return;

    const service = new FileIndexService(config.fileIndex);
    app.addServices(service);

    app.waitForService(ChatService, chatService =>
      chatService.addTools(hybridSearchFileIndex)
    );

    app.waitForService(AgentCommandService, commands =>
      commands.addAgentCommands(chatCommands)
    );
  },
  config: packageConfigSchema
};
```

## Advanced Patterns

### Custom Provider Implementation

```typescript
import FileIndexProvider from './FileIndexProvider.ts';

class CustomProvider extends FileIndexProvider {
  async search(query, limit) {
    const results = [];
    // Custom search implementation
    return results;
  }

  async fullTextSearch(query, limit) {
    return this.search(query, limit);
  }

  async waitReady() {
    // Initialization
  }

  async processFile(filePath) {
    // File processing logic
  }

  onFileChanged(type, filePath) {
    // Handle changes
  }

  setCurrentFile(filePath) {}
  clearCurrentFile() {}
  getCurrentFile() { return null; }
  async close() {}
}
```

### Mass Search Operations

```typescript
async function bulkSearch(service, queries, agent) {
  const tasks = queries.map(query =>
    service.search(query, 5, agent)
  );
  const results = await Promise.all(tasks);

  return results;
}

const results = await bulkSearch(
  fileIndexService,
  ['authentication', 'database', 'api'],
  agent
);
```

### Search Performance Optimization

```typescript
// Queue multiple searches
const searchPromises = [];
for (const query of queries) {
  searchPromises.push(hybridSearchFileIndex.execute(
    { query, topK: 5, mergeRadius: 1 },
    agent
  ));
}

const results = await Promise.all(searchPromises);
```

## Chat Commands

### `/fileindex` Command

Manages providers and performs searches.

**Subcommands:**

- `provider get` - Display active provider
- `provider set <name>` - Set provider
- `default` - Use default provider
- `select` - Interactive provider selection
- `search <query>` - Search files

**Usage:**

```
/fileindex provider get
/fileindex provider set ephemeral
/fileindex search function getUser
```

## State Management

```typescript
import { FileIndexState } from '@tokenring-ai/file-index';

const state = agent.getState(FileIndexState);

// Check active provider
const provider = state.activeProvider;

// State transfers from parent agent
state.transferStateFromParent(parent);

// Serialize for persistence
const data = state.serialize();

// Restore state
state.deserialize(data);
```

## Configuration

### Schema

```typescript
{
  providers: {
    name: { type: string }  // Specialized provider configs
  },
  agentDefaults: {
    provider: string  // Default provider per agent
  }
}
```

### Examples

```typescript
// Minimal configuration
{
  providers: {
    ephemeral: { type: 'ephemeral' }
  },
  agentDefaults: {
    provider: 'ephemeral'
  }
}

// Multi-provider setup
{
  providers: {
    ephemeral: { type: 'ephemeral' },
    persistent: { type: 'persistent' }
  },
  agentDefaults: {
    provider: 'ephemeral'
  }
}
```

## Best Practices

1. **Use Configurable Weights**: Adjust `textWeight` and `fullTextWeight` based on your search patterns

2. **Leverage Result Merging**: Increase `mergeRadius` to get broader context when roomy on results

3. **Manage Provider Switching**: Consider agent-specific defaults to optimize different use cases

4. **Regular Index Updates**: Ensure file changes are indexed by calling `waitReady()` before searches

5. **Monitor Memory**: The ephemeral provider stores all files in memory, watch for large codebases

6. **Use Available Providers**: Check `getAvailableFileIndexProviders()` before setting

7. **Handle Errors**: Wrap search calls in try/catch for network or failure cases

8. **Clear Context**: Call `clearCurrentFile()` when no longer needed

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import FileIndexService from './FileIndexService.ts';

describe('FileIndexService', () => {
  it('should search files', async () => {
    const service = new FileIndexService(config);
    const results = await service.search('test', 5, agent);
    expect(results).toBeInstanceOf(Array);
  });
});
```

## Related Components

- **Agent System**: `@tokenring-ai/agent` - Agent orchestration
- **Chat Service**: `@tokenring-ai/chat` - Tool and command registration
- **File System**: `@tokenring-ai/filesystem` - File operations

## License

MIT License - see the root LICENSE file for details.