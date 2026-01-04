# File Index Plugin

## Overview

The `@tokenring-ai/file-index` package provides comprehensive file indexing and search capabilities for AI agents within the TokenRing AI ecosystem. It enables agents to index project files, perform various types of searches to retrieve relevant code or text snippets, and manage multiple storage backends through a provider architecture.

## Key Features

- **Multiple Search Strategies**: Full-text search and hybrid search combining embedding similarity, full-text matching, and token overlap scoring
- **Provider Architecture**: Extensible system supporting different storage backends (currently includes in-memory ephemeral implementation)
- **Agent Integration**: Seamless integration with TokenRing AI agents through tools and chat commands
- **Real-time File Monitoring**: Automatic file watching and re-indexing using chokidar
- **Text Chunking**: Intelligent chunking using line boundaries with configurable limits
- **Hybrid Search with Merging**: Advanced search that merges adjacent results for better context
- **Command Interface**: Built-in chat command for managing providers and performing searches
- **Tool Integration**: Exported tools for hybrid search functionality

## Installation

```bash
bun install @tokenring-ai/file-index
```

## Core Components

### FileIndexProvider (Abstract Class)

The base interface for all file indexing providers. Defines the contract that all implementations must follow.

```typescript
export interface SearchResult {
  path: string;           // Full path to the file
  chunk_index: number;    // Index of the chunk in the file
  content: string;        // Content of the chunk
  relevance?: number;     // Relevance score (full-text search)
  distance?: number;      // Distance score (semantic search)
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

**Key Methods:**
- `search(query, limit)`: Performs semantic/embedding-based search
- `fullTextSearch(query, limit)`: Performs full-text search across file contents
- `waitReady()`: Waits for the index to finish initializing
- `processFile(filePath)`: Processes and indexes a single file
- `onFileChanged(type, filePath)`: Handles file system events
- `setCurrentFile(filePath)`: Sets the current file context
- `getCurrentFile()`: Returns the current file context

### EphemeralFileIndexProvider

An in-memory implementation that provides fast, non-persistent file indexing.

**Key Features:**
- In-memory storage using Map for file contents
- Chunk-based indexing with configurable chunk size (~1000 characters)
- File system monitoring for automatic re-indexing
- Case-insensitive full-text search with relevance scoring
- Queue-based batch processing for efficiency

```typescript
const provider = new EphemeralFileIndexProvider('/path/to/project');
await provider.start();
```

### FileIndexService

A registry service that manages multiple providers and allows dynamic switching between them.

```typescript
export default class FileIndexService implements TokenRingService {
  name = "FileIndexService";
  description = "Provides FileIndex functionality";

  // Provider management
  registerFileIndexProvider = this.providers.register;
  getAvailableFileIndexProviders = this.providers.getAllItemNames;

  constructor(readonly options: FileIndexServiceConfigSchema) {}

  // Provider activation
  setActiveProvider(name: string, agent: Agent): void;

  // Search operations
  search(query: string, limit?: number, agent?: Agent): Promise<SearchResult[]>;
  fullTextSearch(query: string, limit?: number, agent?: Agent): Promise<SearchResult[]>;

  // Lifecycle
  waitReady(agent: Agent): Promise<void>;
  close(agent: Agent): Promise<void>;

  // File context
  setCurrentFile(filePath: string, agent: Agent): void;
  clearCurrentFile(agent: Agent): void;
  getCurrentFile(agent: Agent): string | null;
}
```

**Key Methods:**
- `registerFileIndexProvider(name, provider)`: Register a new provider
- `getAvailableFileIndexProviders()`: Get list of registered provider names
- `setActiveProvider(name, agent)`: Set the active provider for an agent
- `search(query, limit, agent)`: Search using the active provider
- `fullTextSearch(query, limit, agent)`: Full-text search using the active provider
- `waitReady(agent)`: Wait for the active provider to be ready

## Tools

### hybridSearchFileIndex

Advanced search tool that combines semantic, full-text, and token overlap searching with result merging.

```typescript
const hybridSearchFileIndex = {
  name: "file-index_hybridSearchFileIndex",
  description: "Hybrid semantic+full-text+keyword search with merging/deduplication",
  inputSchema: z.object({
    query: z.string().describe("Text or code query"),
    topK: z.number().int().default(10).describe("Number of results to return"),
    textWeight: z.number().default(0.3).describe("Weight for token overlap"),
    fullTextWeight: z.number().default(0.3).describe("Weight for full-text search"),
    mergeRadius: z.number().int().default(1).describe("Merge radius for adjacent chunks")
  }),
  execute: async (params, agent: Agent) => HybridSearchResult[]
};
```

**Input Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Text or code query to search for |
| `topK` | number | 10 | Number of top merged results to return |
| `textWeight` | number | 0.3 | Weight (0-1) for token overlap score |
| `fullTextWeight` | number | 0.3 | Weight (0-1) for full-text search score |
| `mergeRadius` | number | 1 | How close chunks must be to merge |

**Returns:** `HybridSearchResult[]` with merged search results including:
- `path`: File path
- `start`: Starting chunk index
- `end`: Ending chunk index
- `hybridScore`: Combined relevance score
- `content`: Merged content of all chunks

## Chat Commands

### /fileindex

Manages file index providers and performs searches.

**Usage:**
```
/fileindex [action] [subaction]
```

**Available Subcommands:**

#### Provider Management

- `/fileindex provider get` - Display the currently active file index provider
- `/fileindex provider set <name>` - Set a specific file index provider by name
- `/fileindex provider default` - Reset to the default provider from configuration
- `/fileindex provider select` - Interactively select a provider from available options

#### Search

- `/fileindex search <query>` - Search for text across indexed files
  - Searches across all indexed files
  - Returns up to 10 matching results by default
  - Shows file paths and matching content

**Examples:**
```
/fileindex provider get
/fileindex provider set ephemeral
/fileindex provider select
/fileindex search function getUser
/fileindex search class Component
```

## Configuration

### Plugin Configuration Schema

```typescript
const packageConfigSchema = z.object({
  fileIndex: z.object({
    providers: z.record(z.string(), z.any()),
    agentDefaults: z.object({
      provider: z.string(),
    }),
  }).optional(),
});
```

### Configuration Example

```typescript
const config = {
  fileIndex: {
    providers: {
      ephemeral: {
        type: 'ephemeral',
      },
    },
    agentDefaults: {
      provider: 'ephemeral',
    },
  },
};
```

### Provider Configuration

Providers are configured as a record where the key is the provider name and the value contains provider-specific configuration.

**Ephemeral Provider:**
```typescript
{
  type: 'ephemeral',
  // No additional configuration required
}
```

### Agent Configuration

Agents can override the default provider:

```typescript
const FileIndexAgentConfigSchema = z.object({
  provider: z.string().optional()
});
```

## API Reference

### Search Results

```typescript
interface SearchResult {
  path: string;          // Full path to the file
  chunk_index: number;   // Index of the chunk in the file
  content: string;       // Content of the chunk
  relevance?: number;    // Relevance score (full-text search)
  distance?: number;     // Distance score (semantic search)
}
```

### Hybrid Search Results

```typescript
interface HybridSearchResult {
  path: string;         // Full path to the file
  start: number;        // Starting chunk index
  end: number;          // Ending chunk index
  hybridScore: number;  // Combined relevance score
  content: string;      // Merged content of all chunks
}
```

### FileIndexState

Manages the agent-specific state for file indexing.

```typescript
export class FileIndexState implements AgentStateSlice {
  name = "FileIndexState";
  activeProvider: string | null;

  constructor(readonly initialConfig: AgentDefaults) {
    this.activeProvider = initialConfig.provider;
  }

  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
}
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
      type: 'ephemeral',
    },
  },
  agentDefaults: {
    provider: 'ephemeral',
  },
};

const fileIndexService = new FileIndexService(config);
app.addServices(fileIndexService);
```

### Using the Hybrid Search Tool

```typescript
import { hybridSearchFileIndex } from '@tokenring-ai/file-index/tools.ts';

// Perform hybrid search
const results = await hybridSearchFileIndex.execute(
  {
    query: 'implement user authentication',
    topK: 5,
    textWeight: 0.3,
    fullTextWeight: 0.3,
    mergeRadius: 1,
  },
  agent
);

console.log(results);
// Output: Array of merged search results with hybrid scores
```

### Custom Provider Implementation

```typescript
import FileIndexProvider from '@tokenring-ai/file-index/FileIndexProvider.ts';

class CustomFileIndexProvider extends FileIndexProvider {
  async search(query: string, limit?: number): Promise<SearchResult[]> {
    // Implement your search logic
    return [];
  }

  async fullTextSearch(query: string, limit?: number): Promise<SearchResult[]> {
    // Implement your full-text search logic
    return [];
  }

  async waitReady(): Promise<void> {
    // Initialize your provider
  }

  async processFile(filePath: string): Promise<void> {
    // Process and index a file
  }

  onFileChanged(type: string, filePath: string): void {
    // Handle file changes
  }

  async close(): Promise<void> {
    // Cleanup
  }

  setCurrentFile(filePath: string): void {
    // Set current file context
  }

  clearCurrentFile(): void {
    // Clear current file context
  }

  getCurrentFile(): string | null {
    return null;
  }
}
```

## Plugin Integration

```typescript
import FileIndexPlugin from '@tokenring-ai/file-index';
import { z } from 'zod';

const configSchema = z.object({
  fileIndex: z.object({
    providers: z.record(z.string(), z.any()),
    agentDefaults: z.object({
      provider: z.string(),
    }),
  }).optional(),
});

// In your app configuration
app.install(FileIndexPlugin, {
  fileIndex: {
    providers: {
      ephemeral: {
        type: 'ephemeral',
      },
    },
    agentDefaults: {
      provider: 'ephemeral',
    },
  },
});
```

## Package Structure

```
pkg/file-index/
├── index.ts                          # Main entry point and exports
├── package.json                      # Package metadata and dependencies
├── plugin.ts                         # Plugin definition for app installation
├── schema.ts                         # Zod schemas for configuration
├── FileIndexProvider.ts              # Abstract provider interface
├── EphemeralFileIndexProvider.ts     # In-memory implementation
├── FileIndexService.ts               # Service registry for providers
├── chatCommands.ts                   # Exports chat commands
│   └── commands/
│       └── fileindex/
│           ├── search.ts             # Search command implementation
│           ├── provider.ts           # Provider command router
│           └── provider/
│               ├── select.ts         # Interactive provider selection
│               ├── default.ts        # Reset to default provider
│               ├── set.ts            # Set provider by name
│               └── get.ts            # Get current provider
├── tools.ts                          # Exports agent tools
│   └── hybridSearchFileIndex.ts      # Hybrid search tool
├── util/                             # Utilities
│   ├── sha256.ts                     # SHA256 hashing utility
│   ├── chunker.ts                    # Semantic chunking logic
│   └── ComputeChunkLineStarts.ts     # Line offset computation
├── state/
│   └── FileIndexState.ts             # State management for file index
└── symbols/
    └── symbolExtractor.ts            # Tree-sitter based symbol extraction
```

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

- **Memory Usage**: The ephemeral provider stores all file contents in memory, which may not be suitable for very large codebases
- **Search Types**: Currently supports full-text and hybrid search. The semantic search tool requires a vector database
- **File Types**: Focuses on text files. Binary files are skipped
- **Performance**: Indexing runs asynchronously to avoid blocking operations
- **Extensibility**: Designed to be extensible for custom storage backends and search algorithms

## Related Components

- `@tokenring-ai/filesystem` - File system utilities and operations
- `@tokenring-ai/agent` - Agent integration and state management
- `@tokenring-ai/chat` - Chat service and tool integration
