# Drizzle Storage Plugin

Multi-database storage for agent state checkpoints using Drizzle ORM with support for SQLite, MySQL, and PostgreSQL.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a production-ready, multi-database storage solution for managing agent state checkpoints in the Token Ring AI system. It implements the `AgentCheckpointProvider` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations and automatic schema migrations.

## Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, PostgreSQL
- **Type-Safe Operations**: Full TypeScript type safety with Drizzle ORM
- **Automatic Table Creation**: Schema creation on initialization
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Unified Interface**: Same API across all database types
- **Token Ring Plugin**: Seamless integration via Token Ring's plugin system
- **JSON State Management**: Automatic JSON serialization/deserialization
- **Comprehensive Testing**: Vitest with Docker containers for MySQL and PostgreSQL

## Plugin Configuration

The plugin integrates with Token Ring via the `install` function, which registers the appropriate storage provider based on configuration. Configure it in your Token Ring config file:

```javascript
// .tokenring/coder-config.mjs
export default {
  checkpoint: {
    provider: {
      type: "postgres",
      connectionString: process.env.DATABASE_URL
    }
  }
};
```

### Configuration Schema

The package uses Zod schemas for configuration validation:

```typescript
const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
})
```

#### SQLite Configuration

```typescript
const sqliteStorageConfigSchema = z.object({
  type: z.literal("sqlite"),
  databasePath: z.string(),
  migrationsFolder: z.string().optional(),
});
```

#### MySQL Configuration

```typescript
const mysqlStorageConfigSchema = z.object({
  type: z.literal("mysql"),
  connectionString: z.string(),
});
```

#### PostgreSQL Configuration

```typescript
const postgresStorageConfigSchema = z.object({
  type: z.literal("postgres"),
  connectionString: z.string(),
});
```

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

- `start(): Promise<void>`
  - Initializes database connection and creates tables if they don't exist
  - Must be called before using other storage methods

- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
  - Stores a new checkpoint
  - Parameters: `{ agentId, name, state, config?, createdAt }`
  - Returns: ID of stored checkpoint

- `retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>`
  - Retrieves a checkpoint by ID
  - Parses JSON state from database
  - Returns checkpoint with parsed state, or null if not found

- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`
  - Lists all checkpoints ordered by creation time (descending)
  - Returns array with ID, name, agentId, createdAt (excludes state)

### Database Schema

All databases use the same logical schema stored in the respective subdirectories:

| Column      | Type           | Description                              |
|-------------|----------------|------------------------------------------|
| `id`        | Integer/BigInt | Auto-incrementing primary key            |
| `agentId`   | Text           | Agent identifier                         |
| `name`      | Text           | Checkpoint name                          |
| `config`    | Text           | JSON-serialized configuration data       |
| `state`     | Text           | JSON-serialized state data               |
| `createdAt` | Integer/BigInt | Unix timestamp                           |

#### SQLite Schema (`sqlite/schema.ts`)

```typescript
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const agentState = sqliteTable("AgentState", {
  id: integer("id").primaryKey({autoIncrement: true}),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  config: text("config").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});
```

#### MySQL Schema (`mysql/schema.ts`)

```typescript
import {bigint, mysqlTable, text as mysqlText} from "drizzle-orm/mysql-core";

export const agentState = mysqlTable("AgentState", {
  id: bigint("id", {mode: "number"}).primaryKey().autoincrement(),
  agentId: mysqlText("agentId").notNull(),
  name: mysqlText("name").notNull(),
  config: mysqlText("config").notNull(),
  state: mysqlText("state").notNull(),
  createdAt: bigint("createdAt", {mode: "number"}).notNull(),
});
```

#### PostgreSQL Schema (`postgres/schema.ts`)

```typescript
import {bigint as pgBigint, bigserial, pgTable, text as pgText} from "drizzle-orm/pg-core";

export const agentState = pgTable("AgentState", {
  id: bigserial("id", {mode: "number"}).primaryKey(),
  agentId: pgText("agentId").notNull(),
  name: pgText("name").notNull(),
  config: pgText("config").notNull(),
  state: pgText("state").notNull(),
  createdAt: pgBigint("createdAt", {mode: "number"}).notNull(),
});
```

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
console.log('Retrieved state:', retrieved?.state);
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

## API Reference

### Factory Functions

```typescript
// SQLite
createSQLiteStorage(config: {
  type: "sqlite",
  databasePath: string,
  migrationsFolder?: string
}): AgentCheckpointProvider

// MySQL
createMySQLStorage(config: {
  type: "mysql",
  connectionString: string
}): AgentCheckpointProvider

// PostgreSQL
createPostgresStorage(config: {
  type: "postgres",
  connectionString: string
}): AgentCheckpointProvider
```

### AgentCheckpointProvider Interface

```typescript
interface AgentCheckpointProvider {
  start(): Promise<void>;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

### Types

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  name: string;
  state: any;
  config?: any;
  createdAt: number;
}

interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

interface AgentCheckpointListItem {
  id: string;
  name: string;
  agentId: string;
  createdAt: number;
}
```

## Testing

Run comprehensive tests with automatic Docker container provisioning:

```bash
bun run test
```

### Test Coverage

- **SQLite**: Local file database (skipped in non-Bun environments)
- **MySQL**: Docker container (mysql:8.0)
- **PostgreSQL**: Docker container (postgres:16)
- CRUD operations for all database types
- Error handling and edge cases
- Non-existent checkpoint retrieval
- Connection management

### Test Configuration

The test suite uses Vitest with the following configuration:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Migration Management

### Generate Migrations

After modifying the schema in the respective `schema.ts` files:

```bash
bun run db:generate
```

This generates SQL migration files for all three database types:
- `sqlite/migrations/` – SQLite migrations
- `mysql/migrations/` – MySQL migrations
- `postgres/migrations/` – PostgreSQL migrations

### Migration Application

Tables are automatically created at runtime when the `start()` method is called. The package uses Drizzle's codebase-first approach where migrations are generated and tables are created via `CREATE TABLE IF NOT EXISTS` statements.

**Note:** Migrations are not automatically applied via Drizzle's migration system due to Bun packaging constraints. The `start()` method creates tables directly.

## Package Structure

```
pkg/drizzle-storage/
├── index.ts                    # Package entry point
├── plugin.ts                   # TokenRingPlugin implementation
├── package.json                # Dependencies and scripts
├── README.md                   # Package documentation
├── DrizzleAgentStateStorage.test.ts  # Test suite
├── vitest.config.ts            # Test configuration
├── sqlite/                     # SQLite implementation
│   ├── createSQLiteStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   ├── drizzle.config.ts      # Drizzle configuration
│   └── migrations/            # Migration files
├── mysql/                      # MySQL implementation
│   ├── createMySQLStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   ├── drizzle.config.ts      # Drizzle configuration
│   └── migrations/            # Migration files
└── postgres/                   # PostgreSQL implementation
    ├── createPostgresStorage.ts # Factory function
    ├── schema.ts              # Drizzle schema
    ├── drizzle.config.ts      # Drizzle configuration
    └── migrations/            # Migration files
```

## Advantages over SQLite Storage

- Multi-database support (production-ready MySQL/PostgreSQL)
- Type-safe queries with Drizzle ORM
- Better scalability for production workloads
- Connection pooling for MySQL/PostgreSQL
- Comprehensive test coverage with real databases
- Same interface as `@tokenring-ai/sqlite-storage` (drop-in replacement)

## Notes

- State must be JSON-serializable
- Tables are created on initialization (not via migrations)
- Connection pooling enabled for MySQL/PostgreSQL
- SQLite requires Bun runtime
- Suitable for production workloads with MySQL/PostgreSQL
- Drop-in replacement for `@tokenring-ai/sqlite-storage`
