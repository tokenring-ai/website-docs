# File Index Plugin

File indexing and search functionality with semantic chunking and symbol extraction.

## Overview

The `@tokenring-ai/file-index` package provides file indexing and search functionality for AI agents within the TokenRing AI ecosystem. It enables agents to index project files, chunk their contents semantically, and perform searches (full-text, semantic, or hybrid) to retrieve relevant code or text snippets.

## Key Features

- Semantic text chunking using sentence boundaries and token limits
- Full-text search with relevance scoring
- Hybrid search combining embeddings, keywords, and full-text
- Symbol extraction for JavaScript/TypeScript using Tree-sitter
- In-memory (ephemeral) indexing for quick setup
- File watching and automatic re-indexing

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
- Watches files via filesystem events
- Chunks content into ~1000-char blocks
- Performs case-insensitive full-text search
- Uses Map for file contents with mtime tracking

### FileIndexService

Registry for multiple providers, allowing dynamic switching.

**Key Methods:**
- `registerFileIndexProvider(name, provider)`: Add a provider
- `setActiveFileIndexProviderName(name)`: Switch active provider
- `fullTextSearch(query, limit?, agent)`: Delegates to active provider
- Similar delegation for `search`, `waitReady`, `setCurrentFile`

### Utilities

**chunker.ts**: `chunkText(text, options)`
- Semantically chunks text by sentences
- Respects token limits (~256 default) with overlap (~32 tokens)
- Uses `sentencex` for segmentation and `gpt-tokenizer` for counting

**symbols/symbolExtractor.ts**: `extractSymbolsFromFile(filePath)`
- Parses JS/TS files with Tree-sitter
- Extracts functions and classes
- Returns: `[{ name, kind, startLine, endLine }]`

### Tools

**hybridSearchFileIndex**: Advanced search combining multiple methods
- Input: `{ query, topK=10, textWeight=0.3, fullTextWeight=0.3, mergeRadius=1 }`
- Returns: Merged `HybridSearchResult[]` with scores

### Chat Commands

**/search [query]**: Performs full-text search and displays results

## Usage Example

```typescript
import AgentTeam from '@tokenring-ai/agent/AgentTeam';
import StringSearchFileIndexService from '@tokenring-ai/file-index/StringSearchFileIndexService';

const agentTeam = new AgentTeam();
const fileIndexService = new StringSearchFileIndexService('/path/to/project');
agentTeam.registerService(fileIndexService);

await agentTeam.start();
await fileIndexService.waitReady(agent);

const results = await fileIndexService.search('function example', 5, agent);
console.log(results);
```

## Configuration Options

- Base Directory: Set in provider constructor for root to index
- Chunking: Customize via `chunkText` options (maxTokens, overlapTokens)
- Search Limits: `limit` param in search methods (default 10)
- Weights in Hybrid Search: `textWeight`, `fullTextWeight`

## Dependencies

- `@tokenring-ai/agent` (^0.1.0): Agent integration
- `@tokenring-ai/filesystem` (^0.1.0): File watching/paths
- `chokidar` (^4.0.3): File system watcher
- `gpt-tokenizer` (^3.0.1): Token counting
- `sentencex` (^0.4.2): Sentence segmentation
- `tree-sitter` (^0.22.4): Symbol parsing
