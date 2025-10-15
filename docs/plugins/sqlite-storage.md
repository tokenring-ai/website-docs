# SQLite Storage Plugin

SQLite-based storage for agent state checkpoints with persistent local database.

## Overview

The `@tokenring-ai/sqlite-storage` package provides a lightweight SQLite-based storage solution for managing agent state checkpoints in the Token Ring AI system. It implements the `AgentCheckpointProvider` interface to handle storing, retrieving, and listing named checkpoints for agents, enabling persistent storage of agent states in a local SQLite database.

## Key Features

- **Checkpoint Storage**: Store agent checkpoints with ID, name, state (JSON), and timestamp
- **Bun SQLite**: Uses Bun's native SQLite for efficient local database operations
- **CRUD Operations**: Insert, update, retrieve, and list checkpoints
- **JSON State**: Stores arbitrary JSON-serializable agent state
- **Auto-Increment IDs**: Automatic ID generation for checkpoints
- **Persistent Storage**: Local file-based database for offline persistence

## Core Components

### SQLiteAgentStateStorage

Implements `AgentCheckpointProvider` for SQLite-based checkpoint management.

**Constructor:**
```typescript
new SQLiteAgentStateStorage({ 
  databasePath: string,
  busyTimeout?: number,
  maxRetries?: number,
  retryDelayMs?: number
})
```
- Parameters:
  - `databasePath` (required): Path to the SQLite database file
  - `busyTimeout` (optional): SQLite busy timeout in ms (default: 5000)
  - `maxRetries` (optional): Max retry attempts for busy database (default: 3)
  - `retryDelayMs` (optional): Base delay between retries in ms (default: 100)

**Key Methods:**

- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
  - Stores or updates a named checkpoint
  - Parameters: `{ agentId, name, state, createdAt }`
  - Uses `INSERT OR REPLACE INTO AgentState`
  - Returns: ID of stored checkpoint

- `retrieveCheckpoint(agentId: string): Promise<StoredAgentCheckpoint | null>`
  - Retrieves a checkpoint by agent ID
  - Parses JSON state from database
  - Returns checkpoint with parsed state, or null if not found

- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`
  - Lists all checkpoints ordered by creation time (descending)
  - Returns array with ID, name, agentId, createdAt (excludes state)

### Database Initialization

**initializeLocalDatabase(databaseFile: string): Database**
- Creates SQLite database at specified file path
- Executes schema from `db.sql`
- Returns Bun SQLite Database instance

**AgentState Table Schema:**
```sql
CREATE TABLE IF NOT EXISTS AgentState (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agentId TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
```

## Usage Examples

### Basic Initialization and Storage

```typescript
import SQLiteAgentStateStorage from '@tokenring-ai/sqlite-storage';

// Create storage instance with default options
const storage = new SQLiteAgentStateStorage({ 
  databasePath: './agent_state.db' 
});

// Or with custom configuration
const storage = new SQLiteAgentStateStorage({ 
  databasePath: './agent_state.db',
  busyTimeout: 10000,
  maxRetries: 5,
  retryDelayMs: 200
});

// Store a checkpoint
const checkpoint = {
  agentId: 'agent-123',
  name: 'session-1',
  state: { messages: ['Hello'], variables: { count: 1 } },
  createdAt: Date.now()
};
const id = await storage.storeCheckpoint(checkpoint);
console.log(`Stored with ID: ${id}`);
```

### Retrieval and Listing

```typescript
// Retrieve a checkpoint
const retrieved = await storage.retrieveCheckpoint('agent-123');
if (retrieved) {
  console.log('Retrieved state:', retrieved.state);
}

// List all checkpoints
const list = await storage.listCheckpoints();
console.log('Checkpoints:', list);
```

### Full Workflow

```typescript
import { NamedAgentCheckpoint } from '@tokenring-ai/checkpoint/AgentCheckpointProvider';
import SQLiteAgentStateStorage from '@tokenring-ai/sqlite-storage';

async function agentWorkflow() {
  const storage = new SQLiteAgentStateStorage({ 
    databasePath: './myapp.db' 
  });

  // Store initial state
  await storage.storeCheckpoint({
    agentId: 'my-agent',
    name: 'initial',
    state: { step: 0 },
    createdAt: Date.now()
  });

  // Later, retrieve and update
  const current = await storage.retrieveCheckpoint('my-agent');
  if (current) {
    current.state.step += 1;
    await storage.storeCheckpoint({ ...current, createdAt: Date.now() });
  }

  // List for overview
  const checkpoints = await storage.listCheckpoints();
  console.log('All checkpoints:', checkpoints);
}
```

## Configuration Options

The `SQLiteAgentStateStorage` constructor accepts the following configuration:

- **databasePath** (required): `string` – Path to the SQLite database file (e.g., `./data/agent.db`)
- **busyTimeout** (optional): `number` – SQLite busy timeout in milliseconds (default: 5000)
- **maxRetries** (optional): `number` – Maximum retry attempts for SQLITE_BUSY errors (default: 3)
- **retryDelayMs** (optional): `number` – Base delay between retries in milliseconds (default: 100)

**Concurrency Features:**
- WAL (Write-Ahead Logging) mode automatically enabled
- Automatic retry logic with exponential backoff for busy database
- Configurable busy timeout and retry parameters

**Error Handling:**
- Automatically retries on SQLITE_BUSY errors up to `maxRetries` times
- Throws error after max retries exceeded
- Wrap operations in try-catch for production use

## API Reference

### SQLiteAgentStateStorage (implements AgentCheckpointProvider)
- `constructor({ databasePath, busyTimeout?, maxRetries?, retryDelayMs? })`
- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
- `retrieveCheckpoint(agentId: string): Promise<StoredAgentCheckpoint | null>`
- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`

### Utilities
- `initializeLocalDatabase(databaseFile: string): Database`

### Types
- `NamedAgentCheckpoint`: `{ agentId: string; name: string; state: any; createdAt: number }`
- `StoredAgentCheckpoint`: `{ id: string; name: string; agentId: string; state: any; createdAt: number }`
- `AgentCheckpointListItem`: `{ id: string; name: string; agentId: string; createdAt: number }`

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: AI client integration
- `@tokenring-ai/history@0.1.0`: History management
- `bun:sqlite`: Runtime dependency (provided by Bun)

## Notes

- Requires Bun runtime for `bun:sqlite`
- WAL mode automatically enabled for better concurrency
- Automatic retry logic handles database busy scenarios
- State must be JSON-serializable
- Text/JSON only; binary states not supported
- Auto-increment IDs for checkpoints
