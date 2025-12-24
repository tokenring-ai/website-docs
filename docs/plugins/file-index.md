# File Index Plugin

File indexing and search functionality for project code and text files.

## Overview

The `@tokenring-ai/file-index` package provides file indexing and search functionality for AI agents within the TokenRing AI ecosystem. It enables agents to index project files, perform full-text searches across file contents, and retrieve relevant code or text snippets.

## Key Features

- Full-text search across indexed files
- Automatic file watching and re-indexing
- In-memory (ephemeral) indexing for quick setup
- Chunk-based content indexing (1000-character chunks)
- Case-insensitive search with relevance scoring
- File path tracking and current file context

## Core Components

### FileIndexProvider (Abstract Class)

Defines the core interface for file indexing providers.

**Key Methods:**
- `search(query, limit?)`: Semantic or hybrid search for relevant chunks
- `fullTextSearch(query, limit?)`: Keyword-based full-text search
- `processFile(filePath)`: Index a single file
- `onFileChanged(type, filePath)`: Handle file events
- `waitReady()`: Await initialization
- `setCurrentFile(filePath)` / `clearCurrentFile()`: Track active file context

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
import StringSearchFileIndexService from '@tokenring-ai/file-index/StringSearchFileIndexService';
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
- `sentencex` (^1.0.13): Sentence segmentation
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