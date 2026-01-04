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
export default &#123;
  checkpoint: &#123;
    provider: &#123;
      type: "postgres",
      connectionString: process.env.DATABASE_URL
    &#125;
  &#125;
&#125;;
```

### Configuration Schema

The package uses Zod schemas for configuration validation:

```typescript
const packageConfigSchema = z.object(&#123;
  checkpoint: CheckpointConfigSchema.optional(),
&#125;)
```

#### SQLite Configuration

```typescript
const sqliteStorageConfigSchema = z.object(&#123;
  type: z.literal("sqlite"),
  databasePath: z.string(),
  migrationsFolder: z.string().optional(),
&#125;);
```

#### MySQL Configuration

```typescript
const mysqlStorageConfigSchema = z.object(&#123;
  type: z.literal("mysql"),
  connectionString: z.string(),
&#125;);
```

#### PostgreSQL Configuration

```typescript
const postgresStorageConfigSchema = z.object(&#123;
  type: z.literal("postgres"),
  connectionString: z.string(),
&#125;);
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

- `start(): Promise&lt;void&gt;`
  - Initializes database connection and creates tables if they don't exist
  - Must be called before using other storage methods

- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise&lt;string&gt;`
  - Stores a new checkpoint
  - Parameters: `&#123; agentId, name, state, config?, createdAt &#125;`
  - Returns: ID of stored checkpoint

- `retrieveCheckpoint(id: string): Promise&lt;StoredAgentCheckpoint | null&gt;`
  - Retrieves a checkpoint by ID
  - Parses JSON state from database
  - Returns checkpoint with parsed state, or null if not found

- `listCheckpoints(): Promise&lt;AgentCheckpointListItem[]&gt;`
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
import &#123;integer, sqliteTable, text&#125; from "drizzle-orm/sqlite-core";

export const agentState = sqliteTable("AgentState", &#123;
  id: integer("id").primaryKey(&#123;autoIncrement: true&#125;),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  config: text("config").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
&#125;);
```

#### MySQL Schema (`mysql/schema.ts`)

```typescript
import &#123;bigint, mysqlTable, text as mysqlText&#125; from "drizzle-orm/mysql-core";

export const agentState = mysqlTable("AgentState", &#123;
  id: bigint("id", &#123;mode: "number"&#125;).primaryKey().autoincrement(),
  agentId: mysqlText("agentId").notNull(),
  name: mysqlText("name").notNull(),
  config: mysqlText("config").notNull(),
  state: mysqlText("state").notNull(),
  createdAt: bigint("createdAt", &#123;mode: "number"&#125;).notNull(),
&#125;);
```

#### PostgreSQL Schema (`postgres/schema.ts`)

```typescript
import &#123;bigint as pgBigint, bigserial, pgTable, text as pgText&#125; from "drizzle-orm/pg-core";

export const agentState = pgTable("AgentState", &#123;
  id: bigserial("id", &#123;mode: "number"&#125;).primaryKey(),
  agentId: pgText("agentId").notNull(),
  name: pgText("name").notNull(),
  config: pgText("config").notNull(),
  state: pgText("state").notNull(),
  createdAt: pgBigint("createdAt", &#123;mode: "number"&#125;).notNull(),
&#125;);
```

## Usage Examples

### SQLite

```typescript
import &#123; createSQLiteStorage &#125; from '@tokenring-ai/drizzle-storage/sqlite/createSQLiteStorage';

const storage = createSQLiteStorage(&#123;
  type: "sqlite",
  databasePath: "./agent_state.db"
&#125;);

// Initialize the storage
await storage.start();

const checkpoint = &#123;
  agentId: "agent-123",
  name: "session-1",
  state: &#123; messages: ["Hello"], count: 1 &#125;,
  createdAt: Date.now()
&#125;;

const id = await storage.storeCheckpoint(checkpoint);
const retrieved = await storage.retrieveCheckpoint(id);
console.log('Retrieved state:', retrieved?.state);
```

### MySQL

```typescript
import &#123; createMySQLStorage &#125; from '@tokenring-ai/drizzle-storage/mysql/createMySQLStorage';

const storage = createMySQLStorage(&#123;
  type: "mysql",
  connectionString: "mysql://user:pass@localhost:3306/dbname"
&#125;);

// Initialize the storage
await storage.start();

const id = await storage.storeCheckpoint(checkpoint);
```

### PostgreSQL

```typescript
import &#123; createPostgresStorage &#125; from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

const storage = createPostgresStorage(&#123;
  type: "postgres",
  connectionString: "postgres://user:pass@localhost:5432/dbname"
&#125;);

// Initialize the storage
await storage.start();

const id = await storage.storeCheckpoint(checkpoint);
```

### Full Workflow

```typescript
import &#123; createPostgresStorage &#125; from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

async function agentWorkflow() &#123;
  const storage = createPostgresStorage(&#123;
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  &#125;);

  // Initialize the storage
  await storage.start();

  // Store initial state
  const id = await storage.storeCheckpoint(&#123;
    agentId: 'my-agent',
    name: 'initial',
    state: &#123; step: 0 &#125;,
    createdAt: Date.now()
  &#125;);

  // Retrieve and update
  const current = await storage.retrieveCheckpoint(id);
  if (current) &#123;
    current.state.step += 1;
    await storage.storeCheckpoint(&#123; ...current, createdAt: Date.now() &#125;);
  &#125;

  // List all checkpoints
  const checkpoints = await storage.listCheckpoints();
  console.log('All checkpoints:', checkpoints);
&#125;
```

## API Reference

### Factory Functions

```typescript
// SQLite
createSQLiteStorage(config: &#123;
  type: "sqlite",
  databasePath: string,
  migrationsFolder?: string
&#125;): AgentCheckpointProvider

// MySQL
createMySQLStorage(config: &#123;
  type: "mysql",
  connectionString: string
&#125;): AgentCheckpointProvider

// PostgreSQL
createPostgresStorage(config: &#123;
  type: "postgres",
  connectionString: string
&#125;): AgentCheckpointProvider
```

### AgentCheckpointProvider Interface

```typescript
interface AgentCheckpointProvider &#123;
  start(): Promise&lt;void&gt;;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise&lt;string&gt;;
  retrieveCheckpoint(id: string): Promise&lt;StoredAgentCheckpoint | null&gt;;
  listCheckpoints(): Promise&lt;AgentCheckpointListItem[]&gt;;
&#125;
```

### Types

```typescript
interface NamedAgentCheckpoint &#123;
  agentId: string;
  name: string;
  state: any;
  config?: any;
  createdAt: number;
&#125;

interface StoredAgentCheckpoint extends NamedAgentCheckpoint &#123;
  id: string;
&#125;

interface AgentCheckpointListItem &#123;
  id: string;
  name: string;
  agentId: string;
  createdAt: number;
&#125;
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
export default defineConfig(&#123;
  test: &#123;
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  &#125;,
&#125;);
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
