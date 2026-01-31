# Drizzle Storage Plugin

Multi-database storage for agent state checkpoints using Drizzle ORM with support for SQLite, MySQL, and PostgreSQL.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a production-ready, multi-database storage solution for managing agent state checkpoints in the Token Ring AI system. It implements the `AgentCheckpointProvider` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations and automatic table creation.

## Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, PostgreSQL
- **Type-Safe Operations**: Full TypeScript type safety with Drizzle ORM
- **Automatic Table Creation**: Schema creation on initialization
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Unified Interface**: Same API across all database types
- **Token Ring Plugin**: Seamless integration via Token Ring's plugin system
- **JSON State Management**: Automatic JSON serialization/deserialization
- **Comprehensive Testing**: Vitest with Docker containers for MySQL and PostgreSQL

## Installation

```bash
bun install @tokenring-ai/drizzle-storage
```

## Configuration

### Plugin Configuration

The package includes a TokenRing plugin that automatically sets up the storage provider. Configure it in your Token Ring config file:

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

The plugin uses Zod schemas for configuration validation:

```typescript
import {z} from "zod";

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

```typescript
createSQLiteStorage(config: SQLiteConfig): AgentCheckpointProvider
createMySQLStorage(config: MySQLConfig): AgentCheckpointProvider
createPostgresStorage(config: PostgresConfig): AgentCheckpointProvider
```

### Plugin Implementation

The plugin automatically registers the storage provider with the Token Ring checkpoint service:

```typescript
// pkg/drizzle-storage/plugin.ts
import {TokenRingPlugin} from "@tokenring-ai/app";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import {CheckpointConfigSchema} from "@tokenring-ai/checkpoint/schema";
import {z} from "zod";
import {createMySQLStorage, mysqlStorageConfigSchema} from "./mysql/createMySQLStorage.js";
import {createPostgresStorage, postgresStorageConfigSchema} from "./postgres/createPostgresStorage.js";
import {createSQLiteStorage, sqliteStorageConfigSchema} from "./sqlite/createSQLiteStorage.js";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
})

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.checkpoint) {
      app.services
        .waitForItemByType(AgentCheckpointService, (checkpointService) => {
          const provider = config.checkpoint!.provider;

          if (provider.type === "sqlite") {
            checkpointService.setCheckpointProvider(
              createSQLiteStorage(sqliteStorageConfigSchema.parse(provider))
            );
          } else if (provider.type === "mysql") {
            checkpointService.setCheckpointProvider(
              createMySQLStorage(mysqlStorageConfigSchema.parse(provider))
            );
          } else if (provider.type === "postgres") {
            checkpointService.setCheckpointProvider(
              createPostgresStorage(postgresStorageConfigSchema.parse(provider))
            )
          }
        });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## API Reference

### Factory Functions

#### createSQLiteStorage

Creates a SQLite storage provider for local development:

```typescript
import { createSQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = createSQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});
```

#### createMySQLStorage

Creates a MySQL storage provider with connection pooling:

```typescript
import { createMySQLStorage } from '@tokenring-ai/drizzle-storage';

const storage = createMySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:password@localhost:3306/database"
});
```

#### createPostgresStorage

Creates a PostgreSQL storage provider with connection pooling:

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage';

const storage = createPostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:password@localhost:5432/database"
});
```

### AgentCheckpointProvider Interface

All storage providers implement this interface:

```typescript
interface AgentCheckpointProvider {
  start(): Promise<void>;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

#### start()

Initializes the database connection and creates tables if they don't exist:

```typescript
await storage.start();
```

#### storeCheckpoint()

Stores a new checkpoint with the provided data:

```typescript
const checkpoint = {
  agentId: "agent-123",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  config: { customConfig: "value" },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);
console.log('Checkpoint ID:', id);
```

#### retrieveCheckpoint()

Retrieves a checkpoint by its ID:

```typescript
const retrieved = await storage.retrieveCheckpoint(id);
if (retrieved) {
  console.log('Retrieved state:', retrieved.state);
  console.log('Retrieved config:', retrieved.config);
}
```

#### listCheckpoints()

Lists all checkpoints ordered by creation time (descending):

```typescript
const checkpoints = await storage.listCheckpoints();
console.log('Total checkpoints:', checkpoints.length);
checkpoints.forEach(cp => {
  console.log(`${cp.name} (${cp.agentId}): ${new Date(cp.createdAt)}`);
});
```

### Data Types

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

## Database Schema

All databases use the same logical schema:

| Column      | Type           | Description                              |
|-------------|----------------|------------------------------------------|
| `id`        | Integer/BigInt | Auto-incrementing primary key            |
| `agentId`   | Text           | Agent identifier                         |
| `name`      | Text           | Checkpoint name                          |
| `config`    | Text           | JSON-serialized configuration data       |
| `state`     | Text           | JSON-serialized state data               |
| `createdAt` | Integer/BigInt | Unix timestamp                           |

### Schema Implementation

Each database type has its own schema file:

- **SQLite**: `sqlite/schema.ts`
- **MySQL**: `mysql/schema.ts`
- **PostgreSQL**: `postgres/schema.ts`

Example schema (SQLite):

```typescript
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const agentState = sqliteTable("AgentState", {
  id: integer("id").primaryKey({autoIncrement: true}),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  config: text("config").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull,
});
```

## Usage Examples

### Full Workflow Example

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

async function checkpointWorkflow() {
  const storage = createPostgresStorage({
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  });

  // Initialize the storage
  await storage.start();

  // Store initial state
  const initialCheckpoint = {
    agentId: 'my-agent',
    name: 'initial',
    state: { step: 0, message: 'Starting workflow' },
    config: { timeout: 30000, retries: 3 },
    createdAt: Date.now()
  };

  const initialId = await storage.storeCheckpoint(initialCheckpoint);
  console.log('Initial checkpoint stored:', initialId);

  // Retrieve and update
  const current = await storage.retrieveCheckpoint(initialId);
  if (current) {
    current.state.step += 1;
    current.state.message = 'Processing...';

    const updatedId = await storage.storeCheckpoint({
      ...current,
      createdAt: Date.now()
    });
    console.log('Checkpoint updated:', updatedId);
  }

  // List all checkpoints
  const checkpoints = await storage.listCheckpoints();
  console.log('Total checkpoints:', checkpoints.length);
}
```

### Multiple Checkpoint Types

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

async function manageCheckpoints() {
  const storage = createPostgresStorage({
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  });

  await storage.start();

  // Store session checkpoints
  const sessionId = await storage.storeCheckpoint({
    agentId: 'agent-123',
    name: 'session-1',
    state: { messages: [{ role: 'user', content: 'Hello' }] },
    createdAt: Date.now()
  });

  // Store state snapshots
  const snapshotId = await storage.storeCheckpoint({
    agentId: 'agent-123',
    name: 'snapshot-1',
    state: { variables: { x: 10, y: 20 } },
    createdAt: Date.now()
  });

  // Retrieve specific checkpoint
  const session = await storage.retrieveCheckpoint(sessionId);
  console.log('Session messages:', session?.state.messages);
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

### Example Test

```typescript
import {AgentCheckpointProvider, NamedAgentCheckpoint} from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import {createMySQLStorage} from "./mysql/createMySQLStorage.js";

describe("DrizzleAgentStateStorage", () => {
  let storage: AgentCheckpointProvider;

  beforeAll(async () => {
    storage = createMySQLStorage({
      type: "mysql",
      connectionString: "mysql://root:test@localhost:3306/testdb",
    });
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  it("should store and retrieve checkpoint", async () => {
    const checkpoint: NamedAgentCheckpoint = {
      agentId: "test-agent-1",
      name: "session-1",
      state: {agentState: {messages: {hello: "world"}}, toolsEnabled: ["foo"]},
      createdAt: Date.now(),
    };

    const id = await storage.storeCheckpoint(checkpoint);
    expect(id).toBeDefined();

    const retrieved = await storage.retrieveCheckpoint(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.agentId).toBe(checkpoint.agentId);
    expect(retrieved?.state).toEqual(checkpoint.state);
  });

  it("should list checkpoints", async () => {
    const list = await storage.listCheckpoints();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("id");
    expect(list[0]).toHaveProperty("name");
    expect(list[0]).toHaveProperty("agentId");
    expect(list[0]).toHaveProperty("createdAt");
  });

  it("should return null for non-existent checkpoint", async () => {
    const retrieved = await storage.retrieveCheckpoint("999999");
    expect(retrieved).toBeNull();
  });
});
```

## Package Structure

```
pkg/drizzle-storage/
├── index.ts                    # Package entry point with exports
├── plugin.ts                   # TokenRingPlugin implementation
├── package.json                # Dependencies and scripts
├── README.md                   # Package documentation
├── DrizzleAgentStateStorage.test.ts  # Test suite
├── vitest.config.ts            # Test configuration
├── LICENSE                     # MIT License
├── sqlite/                     # SQLite implementation
│   ├── createSQLiteStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── drizzle.config.ts      # Drizzle configuration
├── mysql/                      # MySQL implementation
│   ├── createMySQLStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── drizzle.config.ts      # Drizzle configuration
└── postgres/                   # PostgreSQL implementation
    ├── createPostgresStorage.ts # Factory function
    ├── schema.ts              # Drizzle schema
    └── drizzle.config.ts      # Drizzle configuration
```

## Dependencies

### Runtime Dependencies

- `drizzle-orm`: Type-safe ORM for database operations
- `mysql2`: MySQL driver with connection pooling
- `postgres`: PostgreSQL driver with connection pooling
- `zod`: Schema validation
- `@tokenring-ai/checkpoint`: Token Ring checkpoint interface
- `@tokenring-ai/app`: Token Ring application framework
- `bun:sqlite`: Bun's built-in SQLite driver (for SQLite only)

### Development Dependencies

- `drizzle-kit`: Migration generator
- `vitest`: Testing framework
- `testcontainers`: Docker container management for testing
- `typescript`: TypeScript compiler
- `bun-types`: TypeScript definitions for Bun

## Migration Strategy

This package uses Drizzle's codebase-first approach:

1. **Define Schema**: Schema is defined in TypeScript files for each database type (`sqlite/schema.ts`, `mysql/schema.ts`, `postgres/schema.ts`)
2. **Create Tables**: Tables are automatically created at runtime when the `start()` method is called using `CREATE TABLE IF NOT EXISTS` statements
3. **Note**: Migrations are not automatically applied via Drizzle's migration system due to Bun packaging constraints. The `start()` method creates tables directly.

## Error Handling

The package includes comprehensive error handling:

- Database connection errors
- Invalid checkpoint data
- Non-existent checkpoint retrieval
- JSON parsing errors for state and config

## Performance Considerations

- **SQLite**: Single-file database, ideal for development and small-scale applications
- **MySQL**: Connection pooling for high-performance applications
- **PostgreSQL**: Advanced features for enterprise workloads with connection pooling

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
- Plugin automatically registers with Token Ring checkpoint service

## License

MIT License - see LICENSE file for details.
