# File Index Plugin

## Overview

The `@tokenring-ai/file-index` package provides comprehensive file indexing and search functionality for AI agents within the TokenRing AI ecosystem. It enables agents to index project files, perform full-text searches across file contents, and retrieve relevant code or text snippets using both simple and advanced hybrid search methods.

## Key Features

- **Real-time File Indexing**: Automatically indexes files as they change using watchers
- **Full-Text Search**: Fast text-based search across all indexed files
- **Hybrid Search**: Combines semantic, full-text, and token overlap searching for better results
- **File Monitoring**: Uses chokidar to monitor file system changes
- **Memory Management**: Ephemeral in-memory index that can be cleared
- **Chat Integration**: Provides `/search` chat command and `hybridSearchFileIndex` tool
- **Chunk-Based Indexing**: Files are broken into ~1000-character chunks for efficient searching

## Core Components

### FileIndexProvider (Abstract Class)

Defines the core interface for file indexing providers.

```typescript
export interface SearchResult {
  path: string           // File path
  chunk_index: number    // Index of the matching chunk
  content: string        // Content of the matching chunk
  relevance?: number     // Relevance score (for full-text search)
  distance?: number      // Distance score (for semantic search)
}

abstract class FileIndexProvider {
  // Core search methods
  abstract search(query: string, limit?: number): Promise<SearchResult[]>
  abstract fullTextSearch(query: string, limit?: number): Promise<SearchResult[]>

  // Lifecycle methods
  abstract waitReady(): Promise<void>
  abstract processFile(filePath: string): Promise<void>
  abstract onFileChanged(type: string, filePath: string): void
  abstract close(): Promise<void>

  // Current file context
  abstract setCurrentFile(filePath: string): void
  abstract clearCurrentFile(): void
  abstract getCurrentFile(): string | null
}
```

### EphemeralFileIndexProvider

In-memory provider for quick, non-persistent indexing.

**Key Features:**
- Watches files via filesystem events using chokidar
- Chunks content into ~1000-character blocks
- Performs case-insensitive full-text search
- Uses Map for file contents with mtime tracking
- Automatic re-indexing on file changes

### FileIndexService

Registry for multiple providers, allowing dynamic switching.

**Key Methods:**
- `registerFileIndexProvider(name, provider)`: Add a provider
- `setActiveFileIndexProviderName(name)`: Switch active provider
- `getActiveFileIndexProviderName()`: Get current active provider
- `getAvailableFileIndexProviders()`: List registered provider names
- `fullTextSearch(query, limit?, agent)`: Delegates to active provider
- Similar delegation for `search`, `waitReady`, `setCurrentFile`

### Tools

**hybridSearchFileIndex**: Advanced search combining multiple methods
- Input: `{ query, topK=10, textWeight=0.3, fullTextWeight=0.3, mergeRadius=1 }`
- Returns: Merged `HybridSearchResult[]` with scores

### Chat Commands

**/search [query]**: Performs full-text search and displays results
- Usage: `/search function example` or `/search class Component`

## Usage Example

```typescript
import AgentTeam from '@tokenring-ai/agent/AgentTeam';
import { FileIndexService } from '@tokenring-ai/file-index';

const agentTeam = new AgentTeam();
const fileIndexService = new FileIndexService();
agentTeam.registerService(fileIndexService);

await agentTeam.start();
await fileIndexService.waitReady(agent);

const results = await fileIndexService.search('function example', 5, agent);
console.log(results);
```

## Configuration Options

### File Index Configuration

```typescript
import { FileIndexConfigSchema } from '@tokenring-ai/file-index';

const config = {
  providers: {
    ephemeral: {
      type: 'ephemeral'
    }
  }
} satisfies FileIndexConfigSchema;
```

### Search Options

- `limit`: Number of results to return (default: 10)
- `query`: Search query string (required)
- `relevance`: Auto-calculated based on query frequency and chunk length

### Chunking Options

- Chunk size: ~1000 characters per chunk
- Automatic re-indexing on file changes
- Case-insensitive search implementation

## Dependencies

- `@tokenring-ai/agent` (^0.2.0): Agent integration
- `@tokenring-ai/chat` (^0.2.0): Chat service integration
- `@tokenring-ai/app` (^0.2.0): Application framework
- `@tokenring-ai/filesystem` (^0.2.0): File system operations
- `chokidar` (^5.0.0): File system watcher
- `glob-gitignore` (^1.0.15): Git-aware file matching
- `sentencex` (^1.2.0): Sentence segmentation
- `gpt-tokenizer` (^3.4.0): Token counting
- `fs-extra` (^11.3.2): File system utilities

## Integration

### Plugin Installation

```typescript
// In your application setup
app.installPlugin('@tokenring-ai/file-index');
```

### Command Usage

```bash
# Search for text across files
/search function getUser
/search class Component
/search import React
/search database connection

# Results appear in chat with file paths and matching content
📄 /path/to/file.ts:
// Function implementation...
```

## Development

### Package Structure

```
pkg/file-index/
├── commands/          # Agent commands
│   └── search.ts      # /search command implementation
├── tools/             # Tool implementations
│   └── hybridSearchFileIndex.ts
├── EphemeralFileIndexProvider.ts  # In-memory provider
├── FileIndexService.ts            # Service registry
├── FileIndexProvider.ts           # Abstract provider interface
├── index.ts                      # Package exports
└── package.json
```

### Testing

```bash
# Run tests
bun run test

# Run with coverage
bun run test:coverage
```