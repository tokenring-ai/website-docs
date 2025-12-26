# Drizzle Storage Plugin

Multi-database storage for agent state checkpoints using Drizzle ORM with support for SQLite, MySQL, and PostgreSQL.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a production-ready, multi-database storage solution for managing agent state checkpoints in the Token Ring AI system. It implements the `AgentCheckpointProvider` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations and automatic schema migrations.

## Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, PostgreSQL
- **Type-Safe Operations**: Full TypeScript type safety with Drizzle ORM
- **Automatic Migrations**: Runtime migration application using codebase-first approach
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Unified Interface**: Same API across all database types
- **Production Ready**: Comprehensive testing with Docker containers
- **Token Ring Integration**: Seamless integration with Token Ring's checkpoint system
- **JSON State Management**: Automatic JSON serialization/deserialization

## Core Components

### Storage Factory Functions

The package provides separate factory functions for each database type, all implementing the `AgentCheckpointProvider` interface.

**Factory Functions:**
```typescript
createSQLiteStorage(config: SQLiteConfig): AgentCheckpointProvider
createMySQLStorage(config: MySQLConfig): AgentCheckpointProvider
createPostgresStorage(config: PostgresConfig): AgentCheckpointProvider
```

**Key Methods:**

- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
  - Stores or updates a named checkpoint
  - Parameters: `{ agentId, name, state, createdAt }`
  - Returns: ID of stored checkpoint

- `retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>`
  - Retrieves a checkpoint by ID
  - Parses JSON state from database
  - Returns checkpoint with parsed state, or null if not found

- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`
  - Lists all checkpoints ordered by creation time (descending)
  - Returns array with ID, name, agentId, createdAt (excludes state)

- `start(): Promise<void>`
  - Initializes database connection and applies migrations
  - Must be called before using storage methods

### Database Schema

All databases use the same logical schema:

```sql
-- SQLite
CREATE TABLE agent_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- MySQL
CREATE TABLE agent_state (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- PostgreSQL
CREATE TABLE agent_state (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
```

### Migration Strategy

Follows Drizzle's codebase-first approach:

1. **Schema Definition**: TypeScript schema in `db/schema.ts` as source of truth
2. **Migration Generation**: `bun run db:generate` creates SQL files
3. **Runtime Application**: Migrations auto-apply on storage initialization
4. **Tracking**: Drizzle maintains migration history in database

## Usage Examples

### SQLite

```typescript
import { createSQLiteStorage } from '@tokenring-ai/drizzle-storage/sqlite/createSQLiteStorage';

const storage = createSQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

// Initialize the storage
await storage.start();

const checkpoint = {
  agentId: "agent-123",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);
const retrieved = await storage.retrieveCheckpoint(id);
```

### MySQL

```typescript
import { createMySQLStorage } from '@tokenring-ai/drizzle-storage/mysql/createMySQLStorage';

const storage = createMySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:pass@localhost:3306/dbname"
});

// Initialize the storage
await storage.start();

const id = await storage.storeCheckpoint(checkpoint);
```

### PostgreSQL

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

const storage = createPostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:pass@localhost:5432/dbname"
});

// Initialize the storage
await storage.start();

const id = await storage.storeCheckpoint(checkpoint);
```

### Token Ring Configuration

```javascript
// .tokenring/coder-config.mjs
export default {
  checkpoint: {
    providers: {
      main: {
        type: "postgres",
        connectionString: process.env.DATABASE_URL
      }
    }
  }
};
```

### Full Workflow

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

async function agentWorkflow() {
  const storage = createPostgresStorage({
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  });

  // Initialize the storage
  await storage.start();

  // Store initial state
  const id = await storage.storeCheckpoint({
    agentId: 'my-agent',
    name: 'initial',
    state: { step: 0 },
    createdAt: Date.now()
  });

  // Retrieve and update
  const current = await storage.retrieveCheckpoint(id);
  if (current) {
    current.state.step += 1;
    await storage.storeCheckpoint({ ...current, createdAt: Date.now() });
  }

  // List all checkpoints
  const checkpoints = await storage.listCheckpoints();
  console.log('All checkpoints:', checkpoints);
}
```

## Configuration Options

### SQLite Configuration
- **type**: `"sqlite"` (required)
- **databasePath**: `string` (required) – Path to SQLite file

### MySQL Configuration
- **type**: `"mysql"` (required)
- **connectionString**: `string` (required) – MySQL connection string
  - Format: `mysql://user:password@host:port/database`
  - Supports connection pooling automatically

### PostgreSQL Configuration
- **type**: `"postgres"` (required)
- **connectionString**: `string` (required) – PostgreSQL connection string
  - Format: `postgres://user:password@host:port/database`
  - Supports connection pooling automatically

## API Reference

### Factory Functions
- `createSQLiteStorage(config: { type: "sqlite", databasePath: string }): AgentCheckpointProvider`
- `createMySQLStorage(config: { type: "mysql", connectionString: string }): AgentCheckpointProvider`
- `createPostgresStorage(config: { type: "postgres", connectionString: string }): AgentCheckpointProvider`

### AgentCheckpointProvider Interface
- `start(): Promise<void>` - Initialize database connection and apply migrations
- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
- `retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>`
- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`

### Types
- `NamedAgentCheckpoint`: `{ agentId: string; name: string; state: any; createdAt: number }`
- `StoredAgentCheckpoint`: `{ id: string; name: string; agentId: string; state: any; createdAt: number }`
- `AgentCheckpointListItem`: `{ id: string; name: string; agentId: string; createdAt: number }`

## Dependencies

**Runtime:**
- `drizzle-orm`: Type-safe ORM
- `mysql2`: MySQL driver
- `postgres`: PostgreSQL driver
- `@tokenring-ai/checkpoint`: Token Ring checkpoint system integration
- `bun:sqlite`: SQLite runtime (Bun)

**Development:**
- `drizzle-kit`: Migration generator
- `vitest`: Testing framework
- `testcontainers`: Docker container management for tests

## Testing

Run comprehensive tests with automatic Docker container provisioning:

```bash
bun run test
```

Test coverage:
- SQLite with local file database
- MySQL with Docker container (mysql:8.0)
- PostgreSQL with Docker container (postgres:16)
- CRUD operations for all database types
- Edge cases (non-existent records, etc.)

## Migration Management

### Generate Migrations

After modifying the schema in `db/schema.ts`:

```bash
bun run db:generate
```

This generates SQL migration files for all three database types:
- `db/migrations/` – SQLite migrations
- `db/migrations-mysql/` – MySQL migrations
- `db/migrations-postgres/` – PostgreSQL migrations

### Migration Application

Migrations are automatically applied at runtime when the storage is initialized. Drizzle tracks applied migrations in the database to prevent duplicate execution.

## Advantages over SQLite Storage

- ✅ Multi-database support (production-ready MySQL/PostgreSQL)
- ✅ Type-safe queries with Drizzle ORM
- ✅ Automatic migration management
- ✅ Better scalability for production workloads
- ✅ Connection pooling for MySQL/PostgreSQL
- ✅ Comprehensive test coverage with real databases
- ✅ Same interface as sqlite-storage (drop-in replacement)

## Notes

- State must be JSON-serializable
- Migrations auto-apply on initialization
- Connection pooling enabled for MySQL/PostgreSQL
- SQLite requires Bun runtime
- Suitable for production workloads with MySQL/PostgreSQL
- Drop-in replacement for `@tokenring-ai/sqlite-storage`</think>
</tool_call></tool_call>
<tool_call>@tokenring-ai/filesystem/search
<arg_key>files</arg_key>
<arg_value>[".tokenring/knowledge/documentation.md"]