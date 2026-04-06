# @tokenring-ai/file-index

The `@tokenring-ai/file-index` package provides file indexing and search capabilities for AI agents, enabling efficient codebase exploration and retrieval through intelligent search algorithms.

## Overview

The `@tokenring-ai/file-index` package provides file indexing and search capabilities for TokenRing AI agents. It enables agents to index project files and perform efficient searches across codebases using hybrid search combining full-text matching, token overlap scoring (BM25-like), and embedding similarity with intelligent result merging.

The package implements a provider architecture that allows for different storage backends, with an in-memory ephemeral provider currently available. It integrates seamlessly with TokenRing agents through tools, chat commands, and state management.

### Key Features

- **Hybrid Search**: Combines full-text matching, token overlap scoring (BM25-like), and embedding similarity with intelligent result merging
- **Line-Based Chunking**: Simple line-based chunking with ~1000 character limit per chunk for efficient processing
- **Provider Architecture**: Extensible system supporting different storage backends through the FileIndexProvider abstract class
- **Agent Integration**: Seamless integration with TokenRing AI agents through tools and chat commands
- **Result Merging**: Advanced search algorithm that merges adjacent/nearby chunks for better context coverage
- **Chat Commands**: Built-in command interface for managing providers and performing searches
- **Tool Integration**: Exported tools for hybrid search functionality
- **State Management**: Agent-specific state persistence for active provider selection
- **Lazy Initialization**: Non-blocking initialization with background file processing
- **File Change Detection**: Automatic handling of file additions, modifications, and deletions

## Core Components/API

### FileIndexProvider

Abstract base class defining the interface for all file indexing providers. All providers must implement this interface.

```typescript
export interface SearchResult {
  path: string;
  chunk_index: number;
  content: string;
  relevance?: number;
  distance?: number;
}

export default abstract class FileIndexProvider {
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

In-memory implementation providing fast, non-persistent file indexing. This is the only currently available provider implementation.

```typescript
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider';

const provider = new EphemeralFileIndexProvider('/path/to/project');
await provider.start();
```

**Key Features:**

- In-memory storage using Map for file contents and chunks
- Queue-based batch processing (250ms interval, 10 parallel tasks)
- Case-insensitive full-text search with relevance scoring
- Lazy initialization with background file processing
- File change handling (unlinks remove from index, changes trigger re-indexing)

**Chunking Strategy:**

- Line-based splitting with 1000 character limit per chunk
- Chunks concatenated with newlines between them
- Simple and fast, no tokenization or sentence segmentation

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `start()` | - | `Promise<void>` | Start lazy initialization and file processing |
| `waitReady()` | - | `Promise<void>` | Wait for initialization to complete |
| `processFile()` | `filePath: string` | `Promise<void>` | Process and index a single file |
| `onFileChanged()` | `type: string`, `filePath: string` | `void` | Handle file system changes |
| `fullTextSearch()` | `query: string`, `limit: number` | `Promise<SearchResult[]>` | Full-text search with relevance scoring |
| `search()` | `query: string`, `limit: number` | `Promise<SearchResult[]>` | Search (delegates to fullTextSearch) |
| `setCurrentFile()` | `filePath: string` | `void` | Set current file context |
| `clearCurrentFile()` | - | `void` | Clear current file context |
| `getCurrentFile()` | - | `string \| null` | Get current file context |
| `close()` | - | `Promise<void>` | Cleanup and clear all data |

### FileIndexService

Registry service that manages multiple providers and allows dynamic switching between implementations. Implements the `TokenRingService` interface.

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService';
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema';
import { z } from 'zod';

const config: z.input<typeof FileIndexServiceConfigSchema> = {
  providers: {
    ephemeral: { type: 'ephemeral' }
  },
  agentDefaults: {
    provider: 'ephemeral'
  }
};

const service = new FileIndexService(config);
```

**Service Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name: "FileIndexService" |
| `description` | `string` | Service description: "Provides FileIndex functionality" |
| `options` | `object` | Service configuration from schema |

**Key Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `registerFileIndexProvider` | `name: string`, `provider: FileIndexProvider` | `void` | Register a new provider via KeyedRegistry |
| `getAvailableFileIndexProviders` | - | `string[]` | Get list of registered provider names |
| `setActiveProvider` | `name: string`, `agent: Agent` | `void` | Set active provider for an agent session |
| `requireActiveProvider` | `agent: Agent` | `FileIndexProvider` | Get current provider or throw if none set |
| `search` | `query: string`, `limit: number`, `agent: Agent` | `Promise<SearchResult[]>` | Execute search using active provider |
| `fullTextSearch` | `query: string`, `limit: number`, `agent: Agent` | `Promise<SearchResult[]>` | Full-text search via active provider |
| `waitReady` | `agent: Agent` | `Promise<void>` | Wait for provider initialization |
| `close` | `agent: Agent` | `Promise<void>` | Close and cleanup provider |
| `attach` | `agent: Agent` | `void` | Attach service to agent and initialize state |

### StringSearchFileIndexService

Alternative service implementation that wraps EphemeralFileIndexProvider for direct usage with TokenRingApp.

```typescript
import StringSearchFileIndexService from '@tokenring-ai/file-index/StringSearchFileIndexService';

const service = new StringSearchFileIndexService(app, '/path/to/project');
await service.run();

const results = await service.search('query', 10, agent);
```

**Key Features:**

- Wrapper around EphemeralFileIndexProvider
- Implements TokenRingService interface
- Integration with TokenRingApp
- Agent-aware initialization and waiting

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `run()` | - | `Promise<void>` | Start the provider |
| `waitReady()` | `agent: Agent` | `Promise<void>` | Wait for provider initialization |
| `fullTextSearch()` | `query: string`, `limit: number`, `agent: Agent` | `Promise<SearchResult[]>` | Full-text search |
| `search()` | `query: string`, `limit: number`, `agent: Agent` | `Promise<SearchResult[]>` | Search |
| `close()` | - | `Promise<void>` | Close provider |

## State Management

### FileIndexState

Manages agent-specific state for file index including active provider selection. Extends `AgentStateSlice`.

```typescript
import { FileIndexState } from '@tokenring-ai/file-index/state/FileIndexState';

const state = agent.getState(FileIndexState);
console.log(state.activeProvider); // Current active provider
```

**State Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `activeProvider` | `string \| null` | Name of currently active provider |
| `initialConfig` | `object` | Agent defaults configuration from service |

**State Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `transferStateFromParent` | `parent: Agent` | `void` | Inherit active provider from parent agent |
| `reset` | - | `void` | Reset state to initial config provider |
| `serialize` | - | `{ activeProvider: string \| null }` | Return serializable state object |
| `deserialize` | `data: { activeProvider: string \| null }` | `void` | Restore state from object |
| `show` | - | `string[]` | Display state information as lines |

**Serialization Schema:**

```typescript
const serializationSchema = z.object({
  activeProvider: z.string().nullable()
});
```

## RPC Endpoints

This package does not define RPC endpoints. It provides functionality through:
- Chat tools (hybridSearchFileIndex)
- Chat commands (/fileindex)
- Direct service method calls

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

**Response:**

```
Active provider: ephemeral
```

#### `/fileindex provider set <name>`

Set a specific file index provider by name.

```
/fileindex provider set ephemeral
```

**Response:**

```
Active provider set to: ephemeral
```

**Error Handling:**

- If provider name is empty: `Usage: /fileindex provider set <name>`
- If provider not found: `Provider "name" not found. Available providers: ephemeral, persistent`

#### `/fileindex provider reset`

Reset to the default provider from agent configuration.

```
/fileindex provider reset
```

**Response:**

```
Default provider: ephemeral
```

#### `/fileindex provider select`

Interactively select an active file index provider from available options.

```
/fileindex provider select
```

**Behavior:**

- Shows interactive tree-select menu with available providers
- Displays "(current)" marker for currently active provider
- Auto-selects sole available provider if only one is configured
- Returns early if no providers are registered
- Returns "Provider selection cancelled." if user cancels

### Search Subcommands

#### `/fileindex search <query>`

Search for text across indexed files.

```
/fileindex search function getUser
```

**Response:**

```
Found 3 result(s):
📄 /path/to/file.ts:
...matching content...
```

**Error Handling:**

- If query is empty: `Usage: /fileindex search <query>`
- If no results found: `No results found.`

## Configuration

### Plugin Configuration Schema

```typescript
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema.ts';
import { z } from 'zod';

export const FileIndexServiceConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),
  agentDefaults: z.object({
    provider: z.string()
  })
});

export const FileIndexAgentConfigSchema = z.object({
  provider: z.string().optional()
}).default({});
```

### Configuration Example

```typescript
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

The agent's configuration slice is merged with the service's `agentDefaults` during service attachment using deep merge.

## Integration

### Plugin Integration

```typescript
import { TokenRingPlugin } from '@tokenring-ai/app';
import { z } from 'zod';
import agentCommands from '@tokenring-ai/file-index/commands.ts';
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';
import packageJSON from './package.json' with {type: 'json'};
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema.ts';
import tools from '@tokenring-ai/file-index/tools.ts';
import { ChatService } from '@tokenring-ai/chat';
import { AgentCommandService } from '@tokenring-ai/agent';

const packageConfigSchema = z.object({
  fileIndex: FileIndexServiceConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
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
      agentCommandService.addAgentCommands(agentCommands)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
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

## Tools

The package exports the following tools for agent interaction:

### hybridSearchFileIndex

Advanced hybrid search tool combining full-text search, token overlap scoring, and embedding similarity with intelligent result merging.

**Tool Definition:**

```typescript
const hybridSearchFileIndex = {
  name: 'file-index_hybridSearchFileIndex',
  displayName: 'FileIndex/hybridSearchFileIndex',
  description: 'Hybrid semantic+full-text+keyword search with merging/deduplication. Returns merged relevant code/text blocks.',
  inputSchema: z.object({
    query: z.string().describe('Text or code query: keyword, full-text, and semantic matches are combined.'),
    topK: z.number().int().default(10).describe('Number of top merged results to return (default 10)'),
    textWeight: z.number().default(0.3).describe('Weight (0-1) for token overlap score (default 0.3)'),
    fullTextWeight: z.number().default(0.3).describe('Weight (0-1) for full-text search score (default 0.3)'),
    mergeRadius: z.number().int().default(1).describe('How close (in chunk indices) hits must be to merge into a single region (default: 1)')
  }),
  execute: async (params, agent: Agent): Promise<TokenRingToolJSONResult<HybridSearchResult[]>>
};
```

**Input Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Text or code query to search for. Supports keywords, full-text, and semantic search. |
| `topK` | number | 10 | Number of top merged results to return |
| `textWeight` | number | 0.3 | Weight (0-1) for token overlap score (BM25-like) |
| `fullTextWeight` | number | 0.3 | Weight (0-1) for full-text search score |
| `mergeRadius` | number | 1 | Maximum gap between chunk indices to enable merging |

**Returns:** `TokenRingToolJSONResult<HybridSearchResult[]>`

**HybridSearchResult Interface:**

```typescript
interface HybridSearchResult {
  path: string;         // Full path to the file (absolute path)
  start: number;        // Starting chunk index in the file
  end: number;          // Ending chunk index in the file
  hybridScore: number;  // Combined relevance score
  content: string;      // Merged content of all chunks in the range
}
```

**Search Algorithm:**

1. **Parallel Search**: Executes both embedding-based search (`fileIndex.search`) and full-text search (`fileIndex.fullTextSearch`) in parallel with `topK * 4` results each
2. **Token Overlap (BM25-like)**: Computes token overlap score by counting query tokens found in each chunk
   ```typescript
   const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);
   const textTokens = text.toLowerCase().split(/\W+/).filter(Boolean);
   const overlap = textTokens.filter((t) => queryTokens.includes(t)).length;
   const textScore = overlap / (queryTokens.length || 1);
   ```
3. **Score Combination**: Normalizes and combines scores using weighted formula:
   - `embScore = 1 - distance` (converts embedding distance to similarity)
   - `normalizedFullText = fullTextScore / maxFullTextScore`
   - `hybridScore = (1 - textWeight - fullTextWeight) * embScore + textWeight * textScore + fullTextWeight * normalizedFullText`
4. **Chunk Merging**: Groups results by file and merges adjacent/nearby chunks within `mergeRadius`
5. **Result Selection**: Returns top K merged result blocks sorted by hybrid score

**Example Usage:**

```typescript
import { hybridSearchFileIndex } from '@tokenring-ai/file-index/tools';

// Basic usage
const results = await hybridSearchFileIndex.execute(
  {
    query: 'user authentication',
    topK: 5,
    textWeight: 0.3,
    fullTextWeight: 0.3,
    mergeRadius: 1
  },
  agent
);

console.log(`Found ${results.data.length} merged regions`);
for (const result of results.data) {
  console.log(`\n📄 ${result.path} (chunks ${result.start}-${result.end}):`);
  console.log(`   Score: ${result.hybridScore.toFixed(3)}`);
  console.log(`   Content:\n${result.content}`);
}
```

**Tuning Parameters:**

```typescript
// Emphasis on token overlap (keyword matching)
const keywordFocused = await hybridSearchFileIndex.execute(
  { query, topK, textWeight: 0.5, fullTextWeight: 0.2, mergeRadius: 1 },
  agent
);

// Emphasis on full-text matching
const fullTextFocused = await hybridSearchFileIndex.execute(
  { query, topK, textWeight: 0.2, fullTextWeight: 0.6, mergeRadius: 1 },
  agent
);

// Aggressive merging for broader context
const broadContext = await hybridSearchFileIndex.execute(
  { query, topK, textWeight: 0.3, fullTextWeight: 0.3, mergeRadius: 2 },
  agent
);
```

**Note:** The tool requires an active file index provider to be set. If no provider is active, it will throw an error.

### Available Tools Export

Tools are exported from `@tokenring-ai/file-index/tools`:

```typescript
import tools from '@tokenring-ai/file-index/tools';

// Currently exports:
// - hybridSearchFileIndex

// Note: searchFileIndex tool is commented out in the current implementation
// and not included in the exported tools.
```

## Usage Examples

### Basic Service Setup

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema.ts';
import { z } from 'zod';

const config: z.input<typeof FileIndexServiceConfigSchema> = {
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

### Using the Hybrid Search Tool

```typescript
import { hybridSearchFileIndex } from '@tokenring-ai/file-index/tools';

// Perform hybrid search with tuned parameters
const results = await hybridSearchFileIndex.execute(
  {
    query: 'implement user authentication flow',
    topK: 5,              // Return 5 merged results
    textWeight: 0.3,      // 30% token overlap importance
    fullTextWeight: 0.3,  // 30% full-text matching importance
    mergeRadius: 1        // Merge adjacent chunks within 1 index
  },
  agent
);

console.log(`Found ${results.data.length} merged regions:`);
for (const result of results.data) {
  console.log(`\n📄 ${result.path} (chunks ${result.start}-${result.end}):`);
  console.log(`   Score: ${result.hybridScore.toFixed(3)}`);
  console.log(`   Content:\n${result.content}`);
}
```

### Provider Management

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';

const fileIndexService = agent.requireServiceByType(FileIndexService);

// Get available providers
const providers = fileIndexService.getAvailableFileIndexProviders();
console.log('Available providers:', providers);

// Set provider for specific agent session
fileIndexService.setActiveProvider('ephemeral', agent);

// Wait for provider to be ready
await fileIndexService.waitReady(agent);

// Search using active provider
const results = await fileIndexService.search('user authentication', 10, agent);
```

### Using Chat Commands

```typescript
// Commands are automatically registered when plugin is installed
// Usage in agent chat:

// Search across indexed files
/fileindex search function getUser

// Get current provider
/fileindex provider get
// Response: Active provider: ephemeral

// Set specific provider
/fileindex provider set ephemeral
// Response: Active provider set to: ephemeral

// Reset to default provider
/fileindex provider reset
// Response: Default provider: ephemeral

// Interactively select provider
/fileindex provider select
// Shows interactive tree-select menu with available providers
```

### Custom Provider Implementation

```typescript
import FileIndexProvider, { SearchResult } from '@tokenring-ai/file-index/FileIndexProvider.ts';
import fs from 'fs-extra';

class CustomFileIndexProvider extends FileIndexProvider {
  private indexedFiles = new Map<string, string>();
  private isReady = false;

  async waitReady(): Promise<void> {
    if (!this.isReady) {
      await this.loadAllFiles();
      this.isReady = true;
    }
  }

  async search(query: string, limit?: number): Promise<SearchResult[]> {
    await this.waitReady();
    
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [filePath, content] of this.indexedFiles.entries()) {
      const matches = content.matchAll(new RegExp(lowerQuery, 'gi'));
      for (const match of matches) {
        if (results.length >= (limit || 10)) break;
        
        results.push({
          path: filePath,
          chunk_index: 0,
          content: match[0],
          relevance: match[0].length
        });
      }
    }
    
    return results.slice(0, limit).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  async fullTextSearch(query: string, limit?: number): Promise<SearchResult[]> {
    return this.search(query, limit);
  }

  async processFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf8');
    this.indexedFiles.set(filePath, content);
  }

  onFileChanged(type: string, filePath: string): void {
    if (type === 'unlink') {
      this.indexedFiles.delete(filePath);
    } else {
      this.processFile(filePath);
    }
  }

  setCurrentFile(filePath: string): void {
    // Implement file context tracking
  }

  clearCurrentFile(): void {
    // Reset current file context
  }

  getCurrentFile(): string | null {
    return null;
  }

  async close(): Promise<void> {
    this.indexedFiles.clear();
    this.isReady = false;
  }

  private async loadAllFiles(): Promise<void> {
    // Load and index files from your custom storage
  }
}

// Register with service
fileIndexService.registerFileIndexProvider('custom', new CustomFileIndexProvider());
```

### Agent State Persistence

```typescript
import { FileIndexState } from '@tokenring-ai/file-index/state/FileIndexState.ts';

// State is automatically managed per agent
const fileIndexService = agent.requireServiceByType(FileIndexService);

// State persists across agent sessions via serialization
const state = agent.getState(FileIndexState);

// Check current provider
const activeProvider = state.activeProvider;

// Serialize state for storage
const serialized = state.serialize();
// { activeProvider: 'ephemeral' }

// Restore state from storage
state.deserialize(serialized);

// Display state information
const stateInfo = state.show();
console.log(stateInfo.join('\n'));
// "Active FileIndex Provider: ephemeral"
```

## Best Practices

### Search Weight Tuning

The hybrid search tool allows tuning of search weights for different use cases. See the **Tools** section for detailed parameter tuning examples.

### Provider Selection

- Use `ephemeral` provider for development and testing
- Consider implementing persistent providers for production use
- Let agents choose providers via `provider select` command for flexibility

### Chunk Size Optimization

The default chunk size is ~1000 characters. For specific use cases:

- Smaller chunks (500-700): Better for precise keyword matching
- Larger chunks (1200-1500): Better for broader context understanding

### Performance Considerations

- Batch processing with 10 parallel tasks for file indexing
- 250ms polling interval for file change detection
- Lazy initialization to avoid blocking startup

## Error Handling

### Common Errors

**No Active Provider:**

```
Error: No file index provider has been enabled.
```

**Solution:** Set an active provider before searching:

```typescript
fileIndexService.setActiveProvider('ephemeral', agent);
```

**Command Failed Errors:**

- Empty query: `Usage: /fileindex search <query>`
- Empty provider name: `Usage: /fileindex provider set <name>`
- Provider not found: `Provider "name" not found. Available providers: ...`

### Error Types

- `CommandFailedError`: Thrown when command parameters are invalid
- Generic `Error`: Thrown when no active provider is set

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

## Dependencies

### Runtime Dependencies

All Token Ring packages are workspace dependencies (version 0.2.0):

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | workspace:* | Base application framework and plugin system |
| `@tokenring-ai/chat` | workspace:* | Chat and tool system |
| `@tokenring-ai/agent` | workspace:* | Agent orchestration and state management |
| `@tokenring-ai/filesystem` | workspace:* | File system operations |
| `@tokenring-ai/utility` | workspace:* | Shared utility functions |
| `zod` | ^4.3.6 | Schema validation |
| `fs-extra` | ^11.3.4 | File system operations |
| `commander` | ^14.0.3 | Command-line interface |
| `glob-gitignore` | ^1.0.15 | Gitignore-style pattern matching |
| `gpt-tokenizer` | ^3.4.0 | Token counting for chunking |
| `mysql2` | ^3.20.0 | MySQL client |
| `sentencex` | ^1.0.17 | Sentence segmentation |
| `sqlite-vec` | 0.1.8-alpha.1 | Vector database |
| `tree-sitter` | ^0.25.0 | Syntax parsing |
| `tree-sitter-javascript` | ^0.25.0 | JavaScript grammar |

**Note:** The package lists `chokidar` in dependencies but it is not currently used in the implementation. The `EphemeralFileIndexProvider` uses a simple polling mechanism for file change detection.

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Unit testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |
| `@types/fs-extra` | ^11.0.4 | Type definitions for fs-extra |

## Package Structure

```
pkg/file-index/
├── index.ts                          # Main entry point and exports (schemas, classes)
├── package.json                      # Package metadata and dependencies
├── plugin.ts                         # Plugin definition for app installation
├── schema.ts                         # Zod schemas for configuration
├── FileIndexProvider.ts              # Abstract provider interface and SearchResult type
├── FileIndexService.ts               # Service registry for providers (TokenRingService)
├── StringSearchFileIndexService.ts   # Alternative service using EphemeralFileIndexProvider
├── EphemeralFileIndexProvider.ts     # In-memory provider implementation
├── commands.ts                       # Exports all chat commands
│   └── commands/
│       └── fileindex/
│           ├── search.ts             # /fileindex search command
│           └── provider/
│               ├── get.ts            # /fileindex provider get command
│               ├── set.ts            # /fileindex provider set command
│               ├── reset.ts          # /fileindex provider reset command
│               └── select.ts         # /fileindex provider select command
├── tools.ts                          # Exports all tools (currently only hybridSearchFileIndex)
│   └── tools/
│       ├── hybridSearchFileIndex.ts  # Hybrid search tool implementation
│       └── searchFileIndex.ts        # Semantic search tool (commented out, not exported)
├── state/
│   └── FileIndexState.ts             # Agent state slice for file index
├── util/
│   ├── ComputeChunkLineStarts.ts     # Compute line starts for chunks (utility)
│   ├── chunker.ts                    # Line-based chunking utility
│   └── sha256.ts                     # SHA256 hash utility
├── symbols/
│   └── symbolExtractor.ts            # Symbol extraction using tree-sitter (utility)
└── vitest.config.ts                  # Test configuration
```

**Key Files:**

| File | Purpose |
|------|---------|
| `index.ts` | Main entry point exporting schemas and class types |
| `plugin.ts` | TokenRing plugin for installation and service registration |
| `schema.ts` | Zod schemas for service and agent configuration |
| `FileIndexProvider.ts` | Abstract base class for all providers |
| `FileIndexService.ts` | Main service managing providers and agent integration |
| `EphemeralFileIndexProvider.ts` | In-memory provider implementation |
| `StringSearchFileIndexService.ts` | Alternative service wrapper |
| `commands.ts` | Aggregates all chat command definitions |
| `tools.ts` | Aggregates all tool definitions |
| `state/FileIndexState.ts` | Agent state management |

## Utilities

### chunkText

Token-aware text chunking function that splits text into segments based on token count with optional overlap.

**Location:** `pkg/file-index/util/chunker.ts`

**Function Signature:**

```typescript
import { chunkText } from '@tokenring-ai/file-index/util/chunker.ts';

interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
}

function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[];
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | - | Text to chunk into segments |
| `options` | ChunkOptions | `{}` | Chunking options |
| `options.maxTokens` | number | 256 | Maximum tokens per chunk |
| `options.overlapTokens` | number | 32 | Number of overlapping tokens between chunks |

**Returns:** `string[]` - Array of text chunks

**Algorithm:**

1. Splits text into sentences using sentencex library
2. Encodes each sentence to count tokens using GPT-4 tokenizer (cl100k_base)
3. Groups sentences into chunks until maxTokens is reached
4. Creates overlap by encoding the last part of each chunk and decoding it
5. Returns array of text chunks with specified overlap

**Example Usage:**

```typescript
import { chunkText } from '@tokenring-ai/file-index/util/chunker.ts';

const text = `
This is a sample text. It contains multiple sentences.
We want to split it into chunks based on token count.
Each chunk will have some overlap with the previous chunk.
`;

// Default options (maxTokens: 256, overlapTokens: 32)
const chunks1 = chunkText(text);

// Custom options
const chunks2 = chunkText(text, {
  maxTokens: 128,
  overlapTokens: 16
});

console.log(`Created ${chunks1.length} chunks`);
console.log(`Chunk 1: ${chunks1[0].substring(0, 100)}...`);
```

**Notes:**

- Uses GPT-4 tokenizer (cl100k_base) for accurate token counting
- Preserves sentence boundaries when possible
- Overlap helps maintain context between chunks
- Empty or whitespace-only text returns empty array
- **Not currently exported from main package**

### computeChunkLineStarts

Computes the starting line numbers for each chunk in the original text.

**Location:** `pkg/file-index/util/ComputeChunkLineStarts.ts`

**Function Signature:**

```typescript
import { computeChunkLineStarts } from '@tokenring-ai/file-index/util/ComputeChunkLineStarts.ts';

function computeChunkLineStarts(
  text: string,
  chunks: string[]
): number[];
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | string | Original text containing all chunks |
| `chunks` | string[] | Array of chunk strings |

**Returns:** `number[]` - Array of line numbers where each chunk starts

**Algorithm:**

1. Creates array of line offsets starting with 0
2. For each chunk, finds its position in the original text
3. Counts newline characters before the chunk position to determine line number
4. If chunk not found, uses the previous line number
5. Returns array of line numbers corresponding to each chunk

**Example Usage:**

```typescript
import { computeChunkLineStarts } from '@tokenring-ai/file-index/util/ComputeChunkLineStarts.ts';

const text = `
Line 1: Introduction
Line 2: First paragraph
Line 3: More content
Line 4: Second paragraph
Line 5: Conclusion
`;

const chunks = [
  "Line 1: Introduction\nLine 2: First paragraph",
  "Line 3: More content\nLine 4: Second paragraph",
  "Line 5: Conclusion"
];

const lineStarts = computeChunkLineStarts(text, chunks);
console.log(lineStarts); // [1, 3, 5]

// Each number represents the line where the corresponding chunk starts
```

**Notes:**

- Line numbers are 1-indexed (first line is 1)
- If a chunk cannot be found in the text, it uses the previous line number
- Useful for tracking chunk positions in source files
- **Not currently exported from main package**

### sha256

Calculates SHA256 hash of the input text.

**Location:** `pkg/file-index/util/sha256.ts`

**Function Signature:**

```typescript
import { sha256 } from '@tokenring-ai/file-index/util/sha256.ts';

function sha256(text: string): string;
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | string | Text to hash |

**Returns:** `string` - Hexadecimal SHA256 hash string

**Example Usage:**

```typescript
import { sha256 } from '@tokenring-ai/file-index/util/sha256.ts';

const hash1 = sha256('Hello, World!');
console.log(hash1); // d9014c4624844aa5bac314773d6b689ad467fa4e1d1a50a1b8a99d5a95f72ff5

const hash2 = sha256('Different text');
console.log(hash2); // Different hash value

// Use case: Generate unique identifiers for file chunks
const chunkContent = 'This is file content to index';
const chunkId = sha256(chunkContent);
console.log(`Chunk ID: ${chunkId}`);
```

**Notes:**

- Uses Node.js crypto module's createHash function
- Returns lowercase hexadecimal string
- Deterministic: same input always produces same hash
- Useful for content-based deduplication and indexing
- **Not currently exported from main package**

## Limitations and Considerations

- **Memory Usage**: The ephemeral provider stores all indexed files in memory, which may be unsuitable for very large codebases (5000+ files)
- **Search Methods**: The default `search()` method delegates to `fullTextSearch()`, so both achieve similar results from the current implementation
- **Storage Backend**: Currently only ephemeral in-memory provider is implemented. Database and vector providers are dependencies but not currently used
- **File Types**: Focuses on text files. Binary files are silently skipped during indexing
- **Search Dimensions**: Currently provides full-text and hybrid scoring. True semantic search requires embedding model integration
- **Indexing Performance**: Large codebases may experience initial indexing lag due to lazy loading and batch processing
- **Chunk Size**: Fixed at ~1000 characters with simple line-based splitting. Variable chunking is possible with custom providers
- **Result Merging**: Merge behavior is controlled by `mergeRadius` parameter. Larger values increase context but reduce precision
- **Provider Switching**: Provider selection is session-specific. Changing provider affects only current agent session
- **Updates**: File modifications are only indexed after processing queue settles (250ms delay)
- **searchFileIndex Tool**: The semantic search tool is currently commented out in the tools export and not available for use
- **Utility Functions**: The utility functions (chunkText, computeChunkLineStarts, sha256) are not exported from the main package index

## Related Components

- **@tokenring-ai/agent**: Agent orchestration and state management
- **@tokenring-ai/chat**: Chat and tool system for command and tool registration
- **@tokenring-ai/app**: Base application framework and plugin system
- **@tokenring-ai/filesystem**: File system operations for file indexing
- **@tokenring-ai/utility**: Shared utilities including deepMerge and registry patterns

## License

MIT License - see `LICENSE` file for details.
