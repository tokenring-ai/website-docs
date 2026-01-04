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
export interface SearchResult &#123;
  path: string;           // Full path to the file
  chunk_index: number;    // Index of the chunk in the file
  content: string;        // Content of the chunk
  relevance?: number;     // Relevance score (full-text search)
  distance?: number;      // Distance score (semantic search)
&#125;

export default abstract class FileIndexProvider &#123;
  // Core search methods
  abstract search(query: string, limit?: number): Promise&lt;SearchResult[]&gt;;
  abstract fullTextSearch(query: string, limit?: number): Promise&lt;SearchResult[]&gt;;

  // Lifecycle methods
  abstract waitReady(): Promise&lt;void&gt;;
  abstract processFile(filePath: string): Promise&lt;void&gt;;
  abstract onFileChanged(type: string, filePath: string): void;
  abstract close(): Promise&lt;void&gt;;

  // Current file context
  abstract setCurrentFile(filePath: string): void;
  abstract clearCurrentFile(): void;
  abstract getCurrentFile(): string | null;
&#125;
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
export default class FileIndexService implements TokenRingService &#123;
  name = "FileIndexService";
  description = "Provides FileIndex functionality";

  // Provider management
  registerFileIndexProvider = this.providers.register;
  getAvailableFileIndexProviders = this.providers.getAllItemNames;

  constructor(readonly options: FileIndexServiceConfigSchema) &#123;&#125;

  // Provider activation
  setActiveProvider(name: string, agent: Agent): void;

  // Search operations
  search(query: string, limit?: number, agent?: Agent): Promise&lt;SearchResult[]&gt;;
  fullTextSearch(query: string, limit?: number, agent?: Agent): Promise&lt;SearchResult[]&gt;;

  // Lifecycle
  waitReady(agent: Agent): Promise&lt;void&gt;;
  close(agent: Agent): Promise&lt;void&gt;;

  // File context
  setCurrentFile(filePath: string, agent: Agent): void;
  clearCurrentFile(agent: Agent): void;
  getCurrentFile(agent: Agent): string | null;
&#125;
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
const hybridSearchFileIndex = &#123;
  name: "file-index_hybridSearchFileIndex",
  description: "Hybrid semantic+full-text+keyword search with merging/deduplication",
  inputSchema: z.object(&#123;
    query: z.string().describe("Text or code query"),
    topK: z.number().int().default(10).describe("Number of results to return"),
    textWeight: z.number().default(0.3).describe("Weight for token overlap"),
    fullTextWeight: z.number().default(0.3).describe("Weight for full-text search"),
    mergeRadius: z.number().int().default(1).describe("Merge radius for adjacent chunks")
  &#125;),
  execute: async (params, agent: Agent) =&gt; HybridSearchResult[]
&#125;;
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
- `/fileindex provider set &lt;name&gt;` - Set a specific file index provider by name
- `/fileindex provider default` - Reset to the default provider from configuration
- `/fileindex provider select` - Interactively select a provider from available options

#### Search

- `/fileindex search &lt;query&gt;` - Search for text across indexed files
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
const packageConfigSchema = z.object(&#123;
  fileIndex: z.object(&#123;
    providers: z.record(z.string(), z.any()),
    agentDefaults: z.object(&#123;
      provider: z.string(),
    &#125;),
  &#125;).optional(),
&#125;);
```

### Configuration Example

```typescript
const config = &#123;
  fileIndex: &#123;
    providers: &#123;
      ephemeral: &#123;
        type: 'ephemeral',
      &#125;,
    &#125;,
    agentDefaults: &#123;
      provider: 'ephemeral',
    &#125;,
  &#125;,
&#125;;
```

### Provider Configuration

Providers are configured as a record where the key is the provider name and the value contains provider-specific configuration.

**Ephemeral Provider:**
```typescript
&#123;
  type: 'ephemeral',
  // No additional configuration required
&#125;
```

### Agent Configuration

Agents can override the default provider:

```typescript
const FileIndexAgentConfigSchema = z.object(&#123;
  provider: z.string().optional()
&#125;);
```

## API Reference

### Search Results

```typescript
interface SearchResult &#123;
  path: string;          // Full path to the file
  chunk_index: number;   // Index of the chunk in the file
  content: string;       // Content of the chunk
  relevance?: number;    // Relevance score (full-text search)
  distance?: number;     // Distance score (semantic search)
&#125;
```

### Hybrid Search Results

```typescript
interface HybridSearchResult &#123;
  path: string;         // Full path to the file
  start: number;        // Starting chunk index
  end: number;          // Ending chunk index
  hybridScore: number;  // Combined relevance score
  content: string;      // Merged content of all chunks
&#125;
```

### FileIndexState

Manages the agent-specific state for file indexing.

```typescript
export class FileIndexState implements AgentStateSlice &#123;
  name = "FileIndexState";
  activeProvider: string | null;

  constructor(readonly initialConfig: AgentDefaults) &#123;
    this.activeProvider = initialConfig.provider;
  &#125;

  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
&#125;
```

## Usage Examples

### Basic Service Setup

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService.ts';
import EphemeralFileIndexProvider from '@tokenring-ai/file-index/EphemeralFileIndexProvider.ts';
import &#123; FileIndexServiceConfigSchema &#125; from '@tokenring-ai/file-index/schema.ts';
import &#123; z &#125; from 'zod';

const config: z.input&lt;typeof FileIndexServiceConfigSchema&gt; = &#123;
  providers: &#123;
    ephemeral: &#123;
      type: 'ephemeral',
    &#125;,
  &#125;,
  agentDefaults: &#123;
    provider: 'ephemeral',
  &#125;,
&#125;;

const fileIndexService = new FileIndexService(config);
app.addServices(fileIndexService);
```

### Using the Hybrid Search Tool

```typescript
import &#123; hybridSearchFileIndex &#125; from '@tokenring-ai/file-index/tools.ts';

// Perform hybrid search
const results = await hybridSearchFileIndex.execute(
  &#123;
    query: 'implement user authentication',
    topK: 5,
    textWeight: 0.3,
    fullTextWeight: 0.3,
    mergeRadius: 1,
  &#125;,
  agent
);

console.log(results);
// Output: Array of merged search results with hybrid scores
```

### Custom Provider Implementation

```typescript
import FileIndexProvider from '@tokenring-ai/file-index/FileIndexProvider.ts';

class CustomFileIndexProvider extends FileIndexProvider &#123;
  async search(query: string, limit?: number): Promise&lt;SearchResult[]&gt; &#123;
    // Implement your search logic
    return [];
  &#125;

  async fullTextSearch(query: string, limit?: number): Promise&lt;SearchResult[]&gt; &#123;
    // Implement your full-text search logic
    return [];
  &#125;

  async waitReady(): Promise&lt;void&gt; &#123;
    // Initialize your provider
  &#125;

  async processFile(filePath: string): Promise&lt;void&gt; &#123;
    // Process and index a file
  &#125;

  onFileChanged(type: string, filePath: string): void &#123;
    // Handle file changes
  &#125;

  async close(): Promise&lt;void&gt; &#123;
    // Cleanup
  &#125;

  setCurrentFile(filePath: string): void &#123;
    // Set current file context
  &#125;

  clearCurrentFile(): void &#123;
    // Clear current file context
  &#125;

  getCurrentFile(): string | null &#123;
    return null;
  &#125;
&#125;
```

## Plugin Integration

```typescript
import FileIndexPlugin from '@tokenring-ai/file-index';
import &#123; z &#125; from 'zod';

const configSchema = z.object(&#123;
  fileIndex: z.object(&#123;
    providers: z.record(z.string(), z.any()),
    agentDefaults: z.object(&#123;
      provider: z.string(),
    &#125;),
  &#125;).optional(),
&#125;);

// In your app configuration
app.install(FileIndexPlugin, &#123;
  fileIndex: &#123;
    providers: &#123;
      ephemeral: &#123;
        type: 'ephemeral',
      &#125;,
    &#125;,
    agentDefaults: &#123;
      provider: 'ephemeral',
    &#125;,
  &#125;,
&#125;);
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
