# @tokenring-ai/file-index

The `@tokenring-ai/file-index` package provides file indexing and search capabilities for TokenRing AI agents, enabling efficient codebase exploration and retrieval through intelligent search algorithms.

## User Guide

### Overview and Purpose

The `@tokenring-ai/file-index` package provides a service for indexing and searching files within a codebase. It is designed to be used by AI agents to find relevant code snippets, documentation, or other file content based on text queries.

The package implements a provider architecture that allows for different storage backends, with an in-memory ephemeral provider currently available. It integrates seamlessly with TokenRing agents through tools, chat commands, and state management.

### Key Features

- **Full-Text Search**: Case-insensitive substring matching with relevance scoring
- **Hybrid Search**: Combines full-text search with token overlap scoring and embedding similarity for better results
- **Line-Based Chunking**: Simple line-based chunking with ~1000 character limit per chunk
- **Provider Architecture**: Pluggable provider system for different storage backends
- **Agent State Persistence**: Active provider selection persists across agent sessions
- **Lazy Initialization**: Non-blocking startup with background file processing
- **File Change Detection**: Automatic re-indexing when files change
- **Result Merging**: Merges adjacent/nearby chunks for better context coverage

### Chat Commands

#### `/fileindex search <query>`

Search for text across all indexed files.

**Example:**

```bash
/fileindex search function getUser
```

**Response:**

```text
Found 3 result(s):
📄 /path/to/file.ts:
...matching content...
```

**Parameters:**

- `query` (required): The search query string

**Description:** Performs a full-text search across all indexed files and returns up to 10 matching results with file paths and content.

#### `/fileindex provider get`

Display the currently active file index provider.

**Example:**

```bash
/fileindex provider get
```

**Response:**

```text
Active provider: ephemeral
```

**Description:** Shows the name of the currently active file index provider. Returns "none" if no provider is set.

#### `/fileindex provider set <providerName>`

Set a specific file index provider by name.

**Example:**

```bash
/fileindex provider set ephemeral
```

**Response (success):**

```text
Active provider set to: ephemeral
```

**Response (error):**

```text
Provider "invalid" not found. Available providers: ephemeral
```

**Parameters:**

- `providerName` (required): The name of the provider to activate

#### `/fileindex provider reset`

Reset to the default provider from agent configuration.

**Example:**

```bash
/fileindex provider reset
```

**Response:**

```text
Default provider: ephemeral
```

**Description:** Resets the active provider to the default configured in the agent's initial configuration.

#### `/fileindex provider select`

Interactively select a file index provider from available options.

**Example:**

```bash
/fileindex provider select
```

**Behavior:**

- Shows interactive tree-select menu with available providers
- Displays "(current)" marker for currently active provider
- Auto-selects sole available provider if only one is configured
- Returns "No file index providers are registered." if no providers exist
- Returns "Provider selection cancelled." if user cancels

### Tools

#### `file-index_hybridSearchFileIndex`

Advanced hybrid search tool combining full-text search, token overlap scoring, and embedding similarity with intelligent result merging.

**Note:** This is the only currently active tool. The `searchFileIndex` tool is defined but commented out in the source code.

**Input Parameters:**

| Parameter        | Type   | Default | Description                                         |
| ---------------- | ------ | ------- | --------------------------------------------------- |
| `query`          | string | -       | Text or code query to search for                    |
| `topK`           | number | 10      | Number of top merged results to return              |
| `textWeight`     | number | 0.3     | Weight for token overlap score (0-1)                |
| `fullTextWeight` | number | 0.3     | Weight for full-text search score (0-1)             |
| `mergeRadius`    | number | 1       | Maximum gap between chunks to merge                 |

**Returns:** TokenRingToolResult with merged search results

**Example Usage:**

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService';

const fileIndexService = agent.requireServiceByType(FileIndexService);

// Tool is automatically available via agent's tool system
const results = await agent.executeTool('file-index_hybridSearchFileIndex', {
  query: 'user authentication',
  topK: 5,
  textWeight: 0.3,
  fullTextWeight: 0.3,
  mergeRadius: 1
});

console.log(`Found ${results.length} merged regions`);
```

**Search Algorithm:**

1. **Parallel Search**: Executes both `search()` and `fullTextSearch()` in parallel
2. **Token Overlap**: Computes token overlap score by counting query tokens found in each chunk (BM25-like)
3. **Score Combination**: Normalizes and combines scores using weighted formula:
   - Hybrid score = (1 - textWeight - fullTextWeight) × embeddingScore + textWeight × textScore + fullTextWeight × normalizedFullTextScore
4. **Chunk Merging**: Groups results by file and merges adjacent/nearby chunks within `mergeRadius`
5. **Result Selection**: Returns top K merged result blocks sorted by hybrid score

### Configuration

#### Plugin Configuration

The plugin accepts configuration through the `fileIndex` property:

```yaml
fileIndex:
  agentDefaults:
    provider: ephemeral
```

#### Configuration Schema

```typescript
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema';
import { z } from 'zod';

export const FileIndexAgentConfigSchema = z
  .object({
    provider: z.string().exactOptional()
  })
  .default({});

export const FileIndexProviderConfigSchema = z.object({
  type: z.enum(['ephemeral'])
});

export const FileIndexServiceConfigSchema = z.object({
  agentDefaults: z
    .object({
      provider: z.string()
    })
    .default({ provider: 'ephemeral' })
});
```

**Schema Properties:**

| Property                 | Type   | Required | Description                 |
| ------------------------ | ------ | -------- | --------------------------- |
| `agentDefaults`          | object | Yes      | Default agent configuration |
| `agentDefaults.provider` | string | Yes      | Default provider name       |
| `type`                   | string | Yes      | Provider type               |

### Integration

#### Plugin Registration

The package follows the standard TokenRing plugin pattern. The plugin automatically:

1. Creates and registers the `FileIndexService`
2. Registers the `ephemeral` provider
3. Registers tools with `ChatService`
4. Registers chat commands with `AgentCommandService`

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import fileIndexPlugin from '@tokenring-ai/file-index/plugin';

const app = new TokenRingApp();

await app.install(fileIndexPlugin, {
  fileIndex: {
    agentDefaults: {
      provider: 'ephemeral'
    }
  }
});
```

#### Agent Integration

The service integrates with agents through:

1. **State Management**: `FileIndexState` is attached to each agent
2. **Tools**: `file-index_hybridSearchFileIndex` tool is available to agents
3. **Commands**: `/fileindex` commands are available in agent chat
4. **Service Access**: Agents can access the service via `agent.requireServiceByType(FileIndexService)`

```typescript
const fileIndexService = agent.requireServiceByType(FileIndexService);

const state = agent.getState(FileIndexState);
console.log(state.activeProvider);
```

### Best Practices

#### Search Weight Tuning

The hybrid search tool allows tuning of search weights for different use cases:

```typescript
// Emphasis on token overlap (keyword matching)
const keywordFocused = await agent.executeTool('file-index_hybridSearchFileIndex', {
  query, topK, textWeight: 0.5, fullTextWeight: 0.2, mergeRadius: 1
});

// Emphasis on full-text matching
const fullTextFocused = await agent.executeTool('file-index_hybridSearchFileIndex', {
  query, topK, textWeight: 0.2, fullTextWeight: 0.6, mergeRadius: 1
});

// Aggressive merging for broader context
const broadContext = await agent.executeTool('file-index_hybridSearchFileIndex', {
  query, topK, textWeight: 0.3, fullTextWeight: 0.3, mergeRadius: 2
});
```

#### Provider Selection

- Use `ephemeral` provider for development and testing
- Let agents choose providers via `/fileindex provider select` command

#### Performance Considerations

- **Batch Processing**: 10 parallel tasks for file indexing
- **Polling Interval**: 250ms for file change detection
- **Lazy Initialization**: Non-blocking startup with background processing
- **Memory Usage**: The ephemeral provider stores all indexed content in memory

---

## Developer Reference

### Core Components

#### FileIndexProvider

Abstract base class defining the interface for all file indexing providers.
All providers must implement this interface.

```typescript
export interface SearchResult {
  path: string;
  chunk_index: number;
  content: string;
  relevance?: number | undefined;
  distance?: number | undefined;
}

export default abstract class FileIndexProvider {
  abstract search(
    query: string,
    limit?: number
  ): MaybePromise<SearchResult[]>;

  abstract fullTextSearch(
    query: string,
    limit?: number
  ): MaybePromise<SearchResult[]>;

  // Lifecycle methods
  abstract waitReady(): MaybePromise<void>;
  abstract processFile(filePath: string): MaybePromise<void>;
  abstract onFileChanged(type: string, filePath: string): void;
  abstract close(): MaybePromise<void>;

  // Current file context
  abstract setCurrentFile(filePath: string): void;
  abstract clearCurrentFile(): void;
  abstract getCurrentFile(): string | null;
}
```

#### EphemeralFileIndexProvider

In-memory implementation providing fast, non-persistent file indexing.
This is the only currently available provider implementation.

**Constructor:**

| Parameter       | Type     | Default         | Description                        |
| --------------- | -------- | --------------- | ---------------------------------- |
| `baseDirectory` | string   | process.cwd()   | Base directory for file operations |

**Methods:**

| Method               | Parameters                         | Returns                      | Description                |
| -------------------- | ---------------------------------- | ---------------------------- | -------------------------- |
| `start()`            | -                                  | Promise void                 | Start lazy initialization  |
| `waitReady()`        | -                                  | Promise void                 | Wait for initialization    |
| `processFile()`      | filePath: string                   | Promise void                 | Process and index file     |
| `onFileChanged()`    | type: string, filePath: string     | void                         | Handle file changes        |
| `fullTextSearch()`   | query: string, limit: number       | Promise SearchResult array   | Full-text search           |
| `search()`           | query: string, limit: number       | Promise SearchResult array   | Search (delegates to fullTextSearch) |
| `setCurrentFile()`   | filePath: string                   | void                         | Set current file context   |
| `clearCurrentFile()` | -                                  | void                         | Clear current file context |
| `getCurrentFile()`   | -                                  | string or null               | Get current file context   |
| `close()`            | -                                  | Promise void                 | Cleanup and clear data     |

**Chunking Strategy:**

- Line-based splitting with 1000 character limit per chunk
- Chunks concatenated with newlines between them
- Simple and fast, no tokenization or sentence segmentation

**Implementation Details:**

- In-memory storage using Map for file contents and chunks
- Queue-based batch processing (250ms interval, 10 parallel tasks)
- Case-insensitive full-text search with relevance scoring
- Lazy initialization with background file processing
- File change handling (unlinks remove from index)

#### FileIndexService

Registry service that manages multiple providers and allows dynamic switching
between implementations. Implements the `TokenRingService` interface.

```typescript
import FileIndexService from '@tokenring-ai/file-index/FileIndexService';
import { FileIndexServiceConfigSchema } from '@tokenring-ai/file-index/schema';
import { z } from 'zod';

const config: z.input<typeof FileIndexServiceConfigSchema> = {
  agentDefaults: {
    provider: 'ephemeral'
  }
};

const service = new FileIndexService(config);
```

**Service Properties:**

| Property      | Type   | Description                       |
| ------------- | ------ | --------------------------------- |
| `name`        | string | Service name: FileIndexService    |
| `description` | string | Service description               |
| `options`     | object | Service configuration from schema |

**Key Methods:**

| Method                           | Parameters                                       | Returns                      | Description                   |
| -------------------------------- | ------------------------------------------------ | ---------------------------- | ----------------------------- |
| `registerFileIndexProvider`      | name: string, provider: FileIndexProvider        | void                         | Register a new provider       |
| `getAvailableFileIndexProviders` | -                                                | string array                 | Get registered provider names |
| `setActiveProvider`              | name: string, agent: Agent                       | void                         | Set active provider           |
| `requireActiveProvider`          | agent: Agent                                     | FileIndexProvider            | Get current provider or throw |
| `search`                         | query: string, limit: number, agent: Agent       | Promise SearchResult array   | Execute search                |
| `fullTextSearch`                 | query: string, limit: number, agent: Agent       | Promise SearchResult array   | Full-text search              |
| `waitReady`                      | agent: Agent                                     | Promise void                 | Wait for initialization       |
| `close`                          | agent: Agent                                     | Promise void                 | Close and cleanup             |
| `attach`                         | agent: Agent                                     | void                         | Attach service to agent       |

#### StringSearchFileIndexService

Alternative service implementation that wraps EphemeralFileIndexProvider
for direct usage with TokenRingApp. This is a legacy wrapper class and
should not be used for new implementations.

```typescript
import StringSearchFileIndexService
  from '@tokenring-ai/file-index/StringSearchFileIndexService';

const service = new StringSearchFileIndexService(app, '/path/to/project');
await service.run();

const results = await service.search('query', 10, agent);
```

**Constructor:**

| Parameter       | Type           | Description             |
| --------------- | -------------- | ----------------------- |
| `app`           | TokenRingApp   | Application instance    |
| `baseDirectory` | string         | Optional base directory |

**Methods:**

| Method             | Parameters                                       | Returns                      | Description             |
| ------------------ | ------------------------------------------------ | ---------------------------- | ----------------------- |
| `run()`            | -                                                | Promise void                 | Start the provider      |
| `waitReady()`      | agent: Agent                                     | Promise void                 | Wait for initialization |
| `fullTextSearch()` | query: string, limit: number, agent: Agent       | Promise SearchResult array   | Full-text search        |
| `search()`         | query: string, limit: number, agent: Agent       | Promise SearchResult array   | Search                  |
| `close()`          | -                                                | Promise void                 | Close provider          |

### Services

The `FileIndexService` implements the `TokenRingService` interface and provides:

- Provider registration and management
- Agent-specific state attachment
- Search delegation to active provider

**Service Lifecycle:**

1. **Construction**: Create with configuration options
2. **Registration**: Register providers via `registerFileIndexProvider`
3. **Attachment**: Attach to agents via `attach(agent)`
4. **Usage**: Delegate searches to active provider

**State Attachment:**

```typescript
attach(agent: Agent): void {
  const agentConfig = deepMerge(
    this.options.agentDefaults,
    agent.getAgentConfigSlice("fileIndex", FileIndexAgentConfigSchema)
  );
  agent.initializeState(FileIndexState, agentConfig);
}
```

### State Management

#### FileIndexState

Manages agent-specific state for file index including active provider selection.
Extends `AgentStateSlice`.

```typescript
import { FileIndexState } from '@tokenring-ai/file-index/state/FileIndexState';

const state = agent.getState(FileIndexState);
console.log(state.activeProvider);
```

**State Properties:**

| Property         | Type             | Description                       |
| ---------------- | ---------------- | --------------------------------- |
| `activeProvider` | string or null   | Name of currently active provider |

**State Methods:**

| Method                    | Parameters      | Returns                              | Description             |
| ------------------------- | --------------- | ------------------------------------ | ----------------------- |
| `transferStateFromParent` | parent: Agent   | void                                 | Inherit from parent     |
| `reset`                   | -               | void                                 | Reset to initial config |
| `serialize`               | -               | `{ activeProvider: string or null }` | Serialize state         |
| `deserialize`             | data: object    | void                                 | Restore state           |
| `show`                    | -               | string                               | Display state info      |

**Serialization Schema:**

```typescript
const serializationSchema = z.object({
  activeProvider: z.string().nullable()
});
```

### RPC Endpoints

This package does not define RPC endpoints. It provides functionality through:

- Chat tools (`file-index_hybridSearchFileIndex`)
- Chat commands (`/fileindex`)
- Direct service method calls

### Development

#### Building

```bash
bun run build
```

#### Linting

```bash
bun run eslint
```

#### Testing

```bash
bun run test
```

#### Test Watching

```bash
bun run test:watch
```

#### Test Coverage

```bash
bun run test:coverage
```

### Package Structure

```text
pkg/file-index/
+-- index.ts                          Main entry point and exports
+-- package.json                      Package metadata and dependencies
+-- plugin.ts                         Plugin definition for app installation
+-- schema.ts                         Zod schemas for configuration
+-- FileIndexProvider.ts              Abstract provider interface
+-- FileIndexService.ts               Service registry for providers
+-- StringSearchFileIndexService.ts   Alternative service wrapper (legacy)
+-- EphemeralFileIndexProvider.ts     In-memory provider implementation
+-- commands.ts                       Exports all chat commands
|   +-- commands/
|       +-- fileindex/
|           +-- search.ts             /fileindex search command
|           +-- provider/
|               +-- get.ts            /fileindex provider get command
|               +-- set.ts            /fileindex provider set command
|               +-- reset.ts          /fileindex provider reset command
|               +-- select.ts         /fileindex provider select command
+-- tools.ts                          Exports all tools
|   +-- tools/
|       +-- hybridSearchFileIndex.ts  Hybrid search tool implementation
+-- state/
|   +-- FileIndexState.ts             Agent state management
+-- vitest.config.ts                  Test configuration
```

**Key Files:**

| File                              | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `index.ts`                        | Main entry point exporting schemas and class types |
| `plugin.ts`                       | TokenRing plugin for installation                  |
| `schema.ts`                       | Zod schemas for service and agent configuration    |
| `FileIndexProvider.ts`            | Abstract base class for all providers              |
| `FileIndexService.ts`             | Main service managing providers                    |
| `EphemeralFileIndexProvider.ts`   | In-memory provider implementation                  |
| `StringSearchFileIndexService.ts` | Alternative service wrapper (legacy)               |
| `commands.ts`                     | Aggregates all chat command definitions            |
| `tools.ts`                        | Aggregates all tool definitions                    |
| `state/FileIndexState.ts`         | Agent state management                             |

### Dependencies

#### Runtime Dependencies

All Token Ring packages are workspace dependencies (version 0.2.0):

| Package                   | Version   | Purpose                        |
| ------------------------- | --------- | ------------------------------ |
| `@tokenring-ai/app`       | 0.2.0     | Base application framework     |
| `@tokenring-ai/chat`      | 0.2.0     | Chat and tool system           |
| `@tokenring-ai/agent`     | 0.2.0     | Agent orchestration            |
| `@tokenring-ai/utility`   | 0.2.0     | Shared utility functions       |
| `fs-extra`                | ^11.3.4   | File system operations         |
| `zod`                     | ^4.3.6    | Schema validation              |

#### Development Dependencies

| Package           | Version | Purpose                       |
| ----------------- | ------- | ----------------------------- |
| `vitest`          | ^4.1.1  | Unit testing framework        |
| `typescript`      | ^6.0.2  | TypeScript compiler           |
| `@types/fs-extra` | ^11.0.4 | Type definitions for fs-extra |

### Error Handling

#### Common Errors

**No Active Provider:**

```text
Error: No file index provider has been enabled.
```

**Solution:** Set an active provider before searching:

```typescript
fileIndexService.setActiveProvider('ephemeral', agent);
```

**Command Failed Errors:**

- Empty query: `No results found.`
- Provider not found: `Provider "name" not found. Available providers: ...`

### Limitations and Considerations

- **Memory Usage**: The ephemeral provider stores all indexed files in memory,
  which may be unsuitable for very large codebases (5000+ files)
- **Search Methods**: The default `search()` method delegates to
  `fullTextSearch()`, so both achieve similar results
- **Storage Backend**: Currently only ephemeral in-memory provider is implemented
- **File Types**: Focuses on text files. Binary files are silently skipped
- **Indexing Performance**: Large codebases may experience initial indexing lag
- **Chunk Size**: Fixed at ~1000 characters with simple line-based splitting
- **Result Merging**: Merge behavior is controlled by `mergeRadius` parameter
- **Provider Switching**: Provider selection is session-specific
- **Updates**: File modifications are only indexed after processing queue
  settles (250ms delay)
- **Tool Availability**: Only `file-index_hybridSearchFileIndex` tool is active;
  `searchFileIndex` is defined but commented out

### Related Components

- **@tokenring-ai/agent**: Agent orchestration and state management
- **@tokenring-ai/chat**: Chat and tool system
- **@tokenring-ai/app**: Base application framework
- **@tokenring-ai/utility**: Shared utility functions

## License

MIT License - see LICENSE file for details.
