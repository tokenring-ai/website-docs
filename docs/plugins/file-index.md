# File Index

The `@tokenring-ai/file-index` package provides file indexing and search capabilities for AI agents, enabling efficient codebase exploration and retrieval through intelligent search algorithms.

## Overview

The File Index package allows AI agents to search across project files using hybrid search capabilities that combine semantic similarity, full-text matching, and token overlap scoring. It features an extensible provider architecture supporting different storage backends and seamless integration with TokenRing agents through tools and chat commands.

### Key Features

- **Hybrid Search**: Combines embedding similarity, full-text matching, and token overlap scoring with intelligent result merging
- **Provider Architecture**: Extensible system supporting different storage backends through the FileIndexProvider interface
- **Agent Integration**: Seamless integration with TokenRing AI agents through tools and chat commands
- **Result Merging**: Advanced search algorithm that merges adjacent results for better context coverage
- **Chat Commands**: Built-in command interface for managing providers and performing searches
- **State Management**: Agent-specific provider selection and state persistence

## Core Components

### FileIndexProvider (Abstract Class)

The base interface for all file indexing providers. Implement this class to create custom storage backends and search algorithms.

```typescript
import FileIndexProvider from '@tokenring-ai/file-index/FileIndexProvider.ts';

interface SearchResult {
  path: string;
  chunk_index: number;
  content: string;
  relevance?: number;
  distance?: number;
}

abstract class FileIndexProvider {
  // Core search methods
  abstract search(query: string, limit?: number): Promise<SearchResult[]>;
  abstract fullTextSearch(query: string, limit?: number): Promise<SearchResult[]>;

  // Lifecycle methods
  abstract waitReady(): Promise<void>;
  abstract processFile(filePath: string): Promise<void>;
  abstract onFileChanged(type: string, filePath: string): void;
  abstract close(): Promise<void>;

  // Current file context
  abstract setCurrentFile(filePath: string): void;
  abstract clearCurrentFile(): void;
  abstract getCurrentFile(): string | null;
}
```

### EphemeralFileIndexProvider

An in-memory implementation providing fast, non-persistent file indexing.

```typescript
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';

const provider = new EphemeralFileIndexProvider('/path/to/project');
await provider.start();
```

**Key Features:**

- In-memory storage using Map for file contents
- Queue-based batch processing for efficiency (250ms interval, 10 parallel tasks)
- Case-insensitive full-text search with BM25-like relevance scoring
- Automatic file watching and lazy initialization
- File change handling (unlinks remove from index, changes trigger re-indexing)

**Chunking Strategy:**

- Simple line-based splitting with 1000 character limit per chunk
- Chunks are concatenated with newlines between them

**Performance Characteristics:**

- Batch processing with up to 10 parallel tasks
- Polling interval of 250ms for file changes
- Lazy initialization pattern (files processed as queued)

### FileIndexService

A registry service that manages multiple providers and allows dynamic switching between implementations.

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';

const service = new FileIndexService(config);

// Register a provider
service.registerFileIndexProvider('ephemeral', new EphemeralFileIndexProvider());

// Get available providers
const providers = service.getAvailableFileIndexProviders();
```

**Key Methods:**

- `registerFileIndexProvider(name, provider)`: Register a new provider
- `getAvailableFileIndexProviders()`: Get list of registered provider names
- `setActiveProvider(name, agent)`: Set active provider for an agent session
- `search(query, limit, agent)`: Execute search using active provider
- `fullTextSearch(query, limit, agent)`: Full-text search via active provider
- `waitReady(agent)`: Wait for provider initialization
- `close(agent)`: Close and cleanup provider
- `requireActiveProvider(agent)`: Get current provider or throw if none set

### StringSearchFileIndexService

Alternative implementation focused on string-based search functionality.

## Tools

### hybridSearchFileIndex

Advanced hybrid search tool combining embedding similarity, full-text search, and token overlap scoring with intelligent result merging.

**Tool Definition:**

```typescript
import { hybridSearchFileIndex } from '@tokenring-ai/file-index/tools.ts';

const result = await hybridSearchFileIndex.execute(
  {
    query: 'implement user authentication',
    topK: 5,
    textWeight: 0.3,
    fullTextWeight: 0.3,
    mergeRadius: 1
  },
  agent
);
```

**Input Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Text or code query to search for |
| `topK` | number | 10 | Number of top merged results to return |
| `textWeight` | number | 0.3 | Weight (0-1) for token overlap score |
| `fullTextWeight` | number | 0.3 | Weight (0-1) for full-text search score |
| `mergeRadius` | number | 1 | Maximum gap between chunk indices to enable merging |

**Returns:** `TokenRingToolJSONResult<HybridSearchResult[]>` with merged search results:

```typescript
interface HybridSearchResult {
  path: string;         // Full path to the file
  start: number;        // Starting chunk index
  end: number;          // Ending chunk index
  hybridScore: number;  // Combined relevance score
  content: string;      // Merged content of all chunks
}
```

**Search Algorithm:**

1. Executes both embedding-based and full-text search in parallel
2. Computes token overlap score using frequency analysis (BM25-like)
3. Normalizes and combines scores using weighted formula
4. Merges adjacent/nearby chunks within mergeRadius per file
5. Returns top K merged results sorted by hybrid score

## Services

### FileIndexService

The main service implementation that manages file index providers and handles search queries.

**Service Interface:**

```typescript
class FileIndexService implements TokenRingService {
  readonly name = "FileIndexService";
  description = "Provides FileIndex functionality";

  // Provider registration and discovery
  registerFileIndexProvider(name: string, provider: FileIndexProvider): void;
  getAvailableFileIndexProviders(): string[];

  // Provider activation per agent
  setActiveProvider(name: string, agent: Agent): void;
  requireActiveProvider(agent: Agent): FileIndexProvider;

  // Search operations
  search(query: string, limit: number = 10, agent: Agent): Promise<SearchResult[]>;
  fullTextSearch(query: string, limit: number = 10, agent: Agent): Promise<SearchResult[]>;

  // Lifecycle management
  waitReady(agent: Agent): Promise<void>;
  close(agent: Agent): Promise<void>;

  // Agent attachment and configuration
  attach(agent: Agent): void;
}
```

**Attachment and Configuration:**

The service automatically initializes agent state using FileIndexState and merges agent configuration slices with service defaults.

## State Management

### FileIndexState

Manages agent-specific state for file index including active provider selection.

```typescript
import { FileIndexState } from '@tokenring-ai/file-index/state/FileIndexState.ts';

// State automatically initialized when agent attaches to service
const state = agent.getState(FileIndexState);

// Check active provider
const activeProvider = state.activeProvider;

// Transfer state from parent agent
state.transferStateFromParent(parentAgent);

// Serialize for persistence
const serialized = state.serialize();

// Restore state
state.deserialize(serialized);

// Display state information
const stateInfo = state.show();
```

**State Properties:**

- `activeProvider`: Name of currently active provider (nullable)
- `initialConfig`: Agent defaults configuration from service

**State Methods:**

- `transferStateFromParent(parent)`: Inherit active provider from parent agent
- `reset(what[])`: Reset state (currently no-op)
- `serialize()`: Return serializable state object
- `deserialize(data)`: Restore state from object
- `show()`: Display state information

## Providers

### EphemeralFileIndexProvider Provider

The in-memory provider implementation with automatic file indexing and batch processing.

**Provider Registration:**

```typescript
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';

fileIndexService.registerFileIndexProvider('ephemeral', new EphemeralFileIndexProvider('/project/root'));
```

**Provider Interface:**

```typescript
class EphemeralFileIndexProvider extends FileIndexProvider {
  constructor(baseDirectory?: string);
  
  async start(): Promise<void>;
  async waitReady(): Promise<void>;
  async processFile(filePath: string): Promise<void>;
  onFileChanged(type: string, filePath: string): void;
  
  async search(query: string, limit?: number): Promise<SearchResult[]>;
  async fullTextSearch(query: string, limit?: number): Promise<SearchResult[]>;
  
  setCurrentFile(filePath: string): void;
  clearCurrentFile(): void;
  getCurrentFile(): string | null;
  
  async close(): Promise<void>;
}
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

The `/fileindex` command provides command-line interface for provider management and search operations.

**Usage:**

```
/fileindex [action] [subaction]
```

### Provider Management Subcommands

#### `/fileindex provider get`

Display the currently active file index provider.

```
/fileindex provider get
```

#### `/fileindex provider set <name>`

Set a specific file index provider by name.

```
/fileindex provider set ephemeral
```

#### `/fileindex provider default`

Reset to the default provider from agent configuration.

```
/fileindex provider default
```

#### `/fileindex provider select`

Interactively select an active file index provider from available options.

```
/fileindex provider select
```

**Provider Selection Behavior:**

- Shows interactive tree-select menu with available providers
- Displays "(current)" marker for currently active provider
- Auto-selects sole available provider if only one is configured
- Returns early if no providers are registered

### Search Subcommands

#### `/fileindex search <query>`

Search for text across indexed files.

```
/fileindex search function.getUser
/fileindex search class.Component
```

**Search Behavior:**

- Searches across all indexed files
- Returns up to 10 matching results by default
- Displays file paths and matching content chunks
- Shows number of results found

**Examples:**

```
/fileindex provider get
# Response: Active provider: ephemeral

/fileindex provider set ephemeral
# Response: Active provider set to: ephemeral

/fileindex provider select
# Interactive prompt to choose provider

/fileindex search user authentication
# Response: Found 3 result(s):
# 📄 /path/to/file.ts:
# ...matching content...
```

## Configuration

### Plugin Configuration Schema

```typescript
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema.ts';

const config = {
  fileIndex: {
    providers: {
      ephemeral: {
        type: 'ephemeral'
      }
    },
    agentDefaults: {
      provider: 'ephemeral'
    }
  }
};
```

### Configuration Example

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema.ts';

const config = {
  providers: {
    ephemeral: {
      type: 'ephemeral'
    }
  },
  agentDefaults: {
    provider: 'ephemeral'
  }
};

const fileIndexService = new FileIndexService(config);
app.addServices(fileIndexService);
```

### Agent Configuration

Agents can override the default provider through agent configuration slices:

```typescript
import { FileIndexAgentConfigSchema } from '@tokenring-ai/file-index/schema.ts';

// Agent configuration
const agentConfig = {
  fileIndex: {
    provider: 'persistent' // Override service default
  }
};

// Service merges these during attachment
const mergedConfig = deepMerge(serviceDefaults, agentConfig.fileIndex);
```

## Integration

### Plugin Integration

```typescript
import { TokenRingPlugin } from '@tokenring-ai/app';
import { z } from 'zod';
import chatCommands from '@tokenring-ai/file-index/chatCommands.ts';
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';
import tools from '@tokenring-ai/file-index/tools.ts';

const packageConfigSchema = z.object({
  fileIndex: FileIndexServiceConfigSchema.optional()
});

export default {
  name: '@tokenring-ai/file-index',
  version: '0.2.0',
  description: 'Service that adds file contents or file names to the chat memory.',
  install(app, config) {
    if (!config.fileIndex) return;

    const fileIndexService = new FileIndexService(config.fileIndex);
    app.addServices(fileIndexService);

    if (config.fileIndex.providers) {
      for (const name in config.fileIndex.providers) {
        const fileIndexConfig = config.fileIndex.providers[name];
        switch (fileIndexConfig.type) {
          case 'ephemeral':
            fileIndexService.registerFileIndexProvider(
              name,
              new EphemeralFileIndexProvider()
            );
            break;
        }
      }
    }

    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin;
```

### Agent Integration

```typescript
// Agent automatically attaches to FileIndexService during initialization
const agent = app.getCurrentAgent();

// Access file index service
const fileIndexService = agent.requireServiceByType(FileIndexService);

// Check active provider
const state = agent.getState(FileIndexState);
console.log('Active provider:', state.activeProvider);

// Perform search
const results = await fileIndexService.search('function getUser', 10, agent);

// Switch providers
fileIndexService.setActiveProvider('ephemeral', agent);
```

## Usage Examples

### Basic Search

```typescript
import { hybridSearchFileIndex } from '@tokenring-ai/file-index/tools.ts';

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

console.log(`Found ${results.length} merged regions:`);
for (const result of results) {
  console.log(`\n📄 ${result.path} (chunks ${result.start}-${result.end}):`);
  console.log(`   Score: ${result.hybridScore.toFixed(3)}`);
  console.log(`   Content:\n${result.content}`);
}
```

### Provider Management

```typescript
const fileIndexService = agent.requireServiceByType(FileIndexService);

// Register a new provider
fileIndexService.registerFileIndexProvider(
  'customProvider',
  new CustomFileIndexProvider()
);

// Get available providers
const providers = fileIndexService.getAvailableFileIndexProviders();
// Returns: ['ephemeral', 'customProvider']

// Set active provider for agent session
fileIndexService.setActiveProvider('customProvider', agent);

// Wait for provider to be ready
await fileIndexService.waitReady(agent);

// Search using active provider
const results = await fileIndexService.search('user', 10, agent);
```

### Chat Command Usage

```typescript
// In your plugin, commands are automatically registered
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(chatCommands)
);

// Usage in agent chat:
// /fileindex search function.getUser
// /fileindex provider get
// /fileindex provider set ephemeral
// /fileindex provider default
// /fileindex provider select
```

### Advanced Search with Tuned Parameters

```typescript
// More semantic search
const semanticResults = await hybridSearchFileIndex.execute(
  { query, topK, textWeight: 0.5, fullTextWeight: 0.2, mergeRadius: 1 },
  agent
);

// More full-text matching
const textResults = await hybridSearchFileIndex.execute(
  { query, topK, textWeight: 0.2, fullTextWeight: 0.6, mergeRadius: 1 },
  agent
);

// Aggressive merging for context
const mergedResults = await hybridSearchFileIndex.execute(
  { query, topK, textWeight: 0.3, fullTextWeight: 0.3, mergeRadius: 2 },
  agent
);
```

## Best Practices

1. **Use Configurable Weights**: Adjust `textWeight` and `fullTextWeight` based on your search patterns
2. **Leverage Result Merging**: Increase `mergeRadius` to get broader context when needed
3. **Manage Provider Switching**: Consider agent-specific defaults to optimize different use cases
4. **Regular Index Updates**: Ensure file changes are indexed by calling `waitReady()` before searches
5. **Monitor Memory**: The ephemeral provider stores all files in memory, watch for large codebases
6. **Use Available Providers**: Check `getAvailableFileIndexProviders()` before setting
7. **Handle Errors**: Wrap search calls in try/catch for network or failure cases
8. **Clear Context**: Call `clearCurrentFile()` when no longer needed

## Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';

describe('FileIndexService', () => {
  let service: FileIndexService;
  let testAgent: Agent;

  beforeEach(async () => {
    const config = {
      providers: {
        ephemeral: { type: 'ephemeral' }
      },
      agentDefaults: { provider: 'ephemeral' }
    };
    service = new FileIndexService(config);
    testAgent = createTestAgent();
    service.attach(testAgent);
  });

  it('should search files', async () => {
    await service.waitReady(testAgent);
    const results = await service.search('test', 5, testAgent);
    expect(results).toBeInstanceOf(Array);
  });

  it('should manage providers', () => {
    service.registerFileIndexProvider('test', new EphemeralFileIndexProvider());
    const providers = service.getAvailableFileIndexProviders();
    expect(providers).toContain('ephemeral');
    expect(providers).toContain('test');
  });
});
```

## Dependencies

### Runtime Dependencies

All Token Ring packages are referenced as `@tokenring-ai/*` versions from the catalog:

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/chat`: Chat and tool system
- `@tokenring-ai/agent`: Agent orchestration and state management
- `@tokenring-ai/filesystem`: File system operations
- `@tokenring-ai/utility`: Shared utility functions
- `zod`: Schema validation
- `fs-extra`: File system operations
- `chokidar`: File watching
- `commander`: Command-line interface
- `glob-gitignore`: Gitignore-style pattern matching
- `gpt-tokenizer`: Token counting for chunking
- `mysql2`: MySQL client
- `sentencex`: Sentence segmentation
- `sqlite-vec`: Vector database
- `tree-sitter`: Syntax parsing
- `tree-sitter-javascript`: JavaScript grammar

### Development Dependencies

- `vitest`: Unit testing framework
- `typescript`: TypeScript compiler
- `@types/fs-extra`: Type definitions for fs-extra

## Development

### Building

```bash
bun run build
```

### Linting

```bash
bun run eslint
```

### Testing

```bash
bun run test
```

### Test Watching

```bash
bun run test:watch
```

### Test Coverage

```bash
bun run test:coverage
```

## Limitations and Considerations

- **Memory Usage**: The ephemeral provider stores all indexed files in memory, which may be unsuitable for very large codebases (5000+ files)
- **Search Methods**: The default `search()` method delegates to `fullTextSearch()`, so both achieve similar results from the current implementation
- **Storage Backend**: Currently only ephemeral in-memory provider is implemented. Database and vector providers are planned for future versions
- **File Types**: Focuses on text files. Binary files are silently skipped during indexing
- **Search Dimensions**: Currently provides full-text and hybrid scoring. True semantic search requires embedding model integration
- **Indexing Performance**: Large codebases may experience initial indexing lag due to lazy loading and batch processing
- **Chunk Size**: Fixed at ~1000 characters with simple line-based splitting. Variable chunking is possible with custom providers
- **Result Merging**: Merge behavior is controlled by `mergeRadius` parameter. Larger values increase context but reduce precision
- **Provider Switching**: Provider selection is session-specific. Changing provider affects only current agent session
- **Updates**: File modifications are only indexed after processing queue settles (250ms delay)
- **Default Provider Command**: The `/fileindex provider default` command has a bug where it references `defaultProvider` variable instead of `agent.initialConfig.provider` in the message

## Future Enhancements

Potential improvements for future versions:

- **Persistent Storage Providers**: SQLite, PostgreSQL, or cloud-based persistence options
- **Vector Search Providers**: Integration with embedding models and vector databases
- **Semantic Chunking**: Smart sentence-based or content-aware chunking
- **File Type Filtering**: Configuration options for which file types to index
- **Directory Exclusions**: Gitignore-style patterns for folder filtering
- **Incremental Indexing**: Optimized updates for changed files only
- **Search Rankings**: More sophisticated BM25 implementations
- **Index Statistics**: Metrics for indexed file count, total size, last update

## Related Components

- **@tokenring-ai/agent**: Agent orchestration and state management
- **@tokenring-ai/chat**: Chat and tool system for command and tool registration
- **@tokenring-ai/filesystem**: File system operations for file indexing
- **@tokenring-ai/utility**: Shared utilities including deepMerge and registry patterns

## License

MIT License - see [LICENSE](./LICENSE) file for details.
