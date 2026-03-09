# Drizzle Storage Plugin

Multi-database storage for agent state checkpoints using Drizzle ORM with support for SQLite, MySQL, and PostgreSQL.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a production-ready, multi-database storage solution for managing agent state checkpoints in the Token Ring AI system. It implements the `AgentCheckpointStorage` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations and automatic table creation.

## Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, PostgreSQL
- **Type-Safe Operations**: Full TypeScript type safety with Drizzle ORM
- **Automatic Table Creation**: Schema creation on initialization via `start()` method
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Unified Interface**: Same API across all database types
- **Token Ring Service**: Seamless integration via Token Ring's service system
- **JSON State Management**: Automatic JSON serialization/deserialization
- **Comprehensive Testing**: Vitest with Docker containers for MySQL and PostgreSQL
- **Plugin Support**: TokenRingPlugin for automatic configuration

## Installation

```bash
bun install @tokenring-ai/drizzle-storage
```

## Configuration

### Plugin Configuration

The package includes a TokenRing plugin that automatically registers the storage service. Configure it in your Token Ring config file using the `drizzleStorage` key:

```javascript
// .tokenring/coder-config.mjs
export default {
  drizzleStorage: {
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  }
};
```

### Configuration Schema

The plugin uses Zod schemas for configuration validation:

```typescript
import { z } from "zod";

const DrizzleStorageConfigSchema = z.discriminatedUnion("type", [
  sqliteStorageConfigSchema,
  postgresStorageConfigSchema,
  mysqlStorageConfigSchema
]);
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

### Storage Classes

The package provides storage classes for each database type, all implementing the `AgentCheckpointStorage` and `TokenRingService` interfaces.

```typescript
import { SQLiteStorage, MySQLStorage, PostgresStorage } from '@tokenring-ai/drizzle-storage';
```

### Plugin Implementation

The plugin automatically registers the storage service with the Token Ring checkpoint service:

```typescript
// pkg/drizzle-storage/plugin.ts
import { TokenRingPlugin } from "@tokenring-ai/app";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import { z } from "zod";
import { MySQLStorage } from "./mysql/createMySQLStorage.js";
import packageJSON from "./package.json" with { type: "json" };
import { PostgresStorage } from "./postgres/createPostgresStorage.js";
import { DrizzleStorageConfigSchema } from "./schema.ts";
import { SQLiteStorage } from "./sqlite/createSQLiteStorage.js";

const packageConfigSchema = z.object({
  drizzleStorage: DrizzleStorageConfigSchema,
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const storage = config.drizzleStorage;

    if (storage) {
      let storageService: SQLiteStorage | MySQLStorage | PostgresStorage | null = null;
      if (storage.type === "sqlite") {
        storageService = new SQLiteStorage(storage);
      } else if (storage.type === "mysql") {
        storageService = new MySQLStorage(storage);
      } else if (storage.type === "postgres") {
        storageService = new PostgresStorage(storage);
      }
      if (storageService) {
        app.services.register(storageService);
        app.services.waitForItemByType(AgentCheckpointService, (checkpointService) => {
          checkpointService.setCheckpointProvider(storageService);
        });
      }
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Services

### SQLiteStorage

SQLite storage provider implementing `TokenRingService` and `AgentCheckpointStorage`:

```typescript
class SQLiteStorage implements TokenRingService, AgentCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "sqlite";
    databasePath: string;
    migrationsFolder?: string;
  });

  start(): Promise<void>;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

**Properties:**
- `name`: "SQLiteStorage"
- `description`: "SQLite storage provider"
- `displayName`: "SQLite (database_path)"

### MySQLStorage

MySQL storage provider implementing `TokenRingService` and `AgentCheckpointStorage`:

```typescript
class MySQLStorage implements TokenRingService, AgentCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "mysql";
    connectionString: string;
  });

  start(): Promise<void>;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

**Properties:**
- `name`: "MySQLStorage"
- `description`: "MySQL storage provider"
- `displayName`: "MySQL (connection_string)"

### PostgresStorage

PostgreSQL storage provider implementing `TokenRingService` and `AgentCheckpointStorage`:

```typescript
class PostgresStorage implements TokenRingService, AgentCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "postgres";
    connectionString: string;
  });

  start(): Promise<void>;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

**Properties:**
- `name`: "PostgresStorage"
- `description`: "PostgreSQL storage provider"
- `displayName`: "Postgres (connection_string)"

## API Reference

### AgentCheckpointStorage Interface

All storage classes implement this interface:

```typescript
interface AgentCheckpointStorage {
  start?(): Promise<void>;
  storeCheckpoint(data: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

#### start()

Initializes the database connection and creates tables if they don't exist:

```typescript
const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

await storage.start();
```

This method:
- Establishes database connection
- Creates the `AgentCheckpoints` table if it doesn't exist (MySQL creates `AgentState`)
- Prepares the storage for checkpoint operations

#### storeCheckpoint()

Stores a new checkpoint with the provided data:

```typescript
const checkpoint = {
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);
console.log('Checkpoint ID:', id);
```

**Parameters:**
- `checkpoint: NamedAgentCheckpoint` - The checkpoint data to store

**Returns:**
- `Promise<string>` - The ID of the stored checkpoint

#### retrieveCheckpoint()

Retrieves a checkpoint by its ID:

```typescript
const retrieved = await storage.retrieveCheckpoint(id);
if (retrieved) {
  console.log('Retrieved state:', retrieved.state);
  console.log('Retrieved agentId:', retrieved.agentId);
}
```

**Parameters:**
- `id: string` - The checkpoint ID to retrieve

**Returns:**
- `Promise<StoredAgentCheckpoint | null>` - The checkpoint data or null if not found

#### listCheckpoints()

Lists all checkpoints ordered by creation time (descending):

```typescript
const checkpoints = await storage.listCheckpoints();
console.log('Total checkpoints:', checkpoints.length);
checkpoints.forEach(cp => {
  console.log(`${cp.name} (${cp.agentId}): ${new Date(cp.createdAt)}`);
});
```

**Returns:**
- `Promise<AgentCheckpointListItem[]>` - Array of checkpoint summaries

### Data Types

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  sessionId: string;
  agentType: string;
  name: string;
  state: any;
  createdAt: number;
}

interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

interface AgentCheckpointListItem {
  id: string;
  sessionId: string;
  name: string;
  agentId: string;
  agentType: string;
  createdAt: number;
}
```

## Database Schema

All databases use the same logical schema with the `AgentCheckpoints` table (MySQL uses `AgentState`):

| Column      | Type           | Description                              |
|-------------|----------------|------------------------------------------|
| `id`        | Integer/BigInt | Auto-incrementing primary key            |
| `sessionId` | Text           | Session identifier                       |
| `agentId`   | Text           | Agent identifier                         |
| `agentType` | Text           | Type of agent (e.g., "coder", "writer")  |
| `name`      | Text           | Checkpoint name                          |
| `state`     | Text           | JSON-serialized state data               |
| `createdAt` | Integer/BigInt | Unix timestamp                           |

### Schema Implementation

Each database type has its own schema file using Drizzle ORM:

- **SQLite**: `sqlite/schema.ts`
- **MySQL**: `mysql/schema.ts`
- **PostgreSQL**: `postgres/schema.ts`

Example schema (SQLite):

```typescript
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentCheckpoints = sqliteTable("AgentCheckpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  agentType: text("agentType").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});
```

## Usage Examples

### SQLite Usage

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

await storage.start();

// Store a checkpoint
const checkpoint = {
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);
console.log('Checkpoint stored with ID:', id);
```

### MySQL Usage

```typescript
import { MySQLStorage } from '@tokenring-ai/drizzle-storage';

const storage = new MySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:password@localhost:3306/database"
});

await storage.start();

// Store a checkpoint
const id = await storage.storeCheckpoint({
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"] },
  createdAt: Date.now()
});
```

### PostgreSQL Usage

```typescript
import { PostgresStorage } from '@tokenring-ai/drizzle-storage';

const storage = new PostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:password@localhost:5432/database"
});

await storage.start();

// Store a checkpoint
const id = await storage.storeCheckpoint({
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"] },
  createdAt: Date.now()
});
```

### Full Workflow Example

```typescript
import { PostgresStorage } from '@tokenring-ai/drizzle-storage';

async function checkpointWorkflow() {
  const storage = new PostgresStorage({
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  });

  // Initialize the storage
  await storage.start();

  // Store initial state
  const initialCheckpoint = {
    agentId: 'my-agent',
    sessionId: 'session-1',
    agentType: 'coder',
    name: 'initial',
    state: { step: 0, message: 'Starting workflow' },
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

### Error Handling

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';

async function safeCheckpointOperation() {
  const storage = new SQLiteStorage({
    type: "sqlite",
    databasePath: "./agent_state.db"
  });

  try {
    await storage.start();

    const checkpoint = {
      agentId: "agent-123",
      sessionId: "session-1",
      agentType: "coder",
      name: "session-1",
      state: { messages: ["Hello"] },
      createdAt: Date.now()
    };

    const id = await storage.storeCheckpoint(checkpoint);
    console.log('Checkpoint stored:', id);

    // Handle non-existent checkpoint
    const missing = await storage.retrieveCheckpoint("999999");
    if (missing === null) {
      console.log('Checkpoint not found');
    }
  } catch (error) {
    console.error('Database operation failed:', error);
  }
}
```

## Best Practices

- **Use the Plugin**: When possible, use the TokenRing plugin for automatic integration with the checkpoint service
- **JSON Serialization**: Ensure state objects are JSON-serializable
- **Connection Pooling**: Use MySQL or PostgreSQL for production workloads with connection pooling
- **Error Handling**: Wrap storage operations in try-catch blocks to handle database errors
- **Checkpoint Naming**: Use descriptive names for checkpoints to make them easier to identify
- **Cleanup**: Regularly review and clean up old checkpoints to manage storage space
- **Session Tracking**: Always include `sessionId` and `agentType` fields for proper checkpoint organization
- **Table Naming**: Be aware that MySQL creates `AgentState` table while SQLite and PostgreSQL create `AgentCheckpoints`

## Integration

### Integration with Agent System

The package integrates with the Token Ring agent system through the TokenRing plugin:

1. **Service Registration**: Automatically registers the storage service with the application
2. **Checkpoint Service Integration**: Automatically registers the storage provider with AgentCheckpointService
3. **State Management**: Provides storage backend for agent state checkpoints
4. **Automatic Configuration**: Reads configuration from Token Ring config files

### Integration with Other Packages

The package integrates with:

- **@tokenring-ai/app**: For plugin registration and app framework integration
- **@tokenring-ai/checkpoint**: For checkpoint storage interface and types
- **@tokenring-ai/agent**: For agent state management and persistence

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
import { AgentCheckpointStorage, NamedAgentCheckpoint } from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import { describe, expect, it, beforeAll } from "vitest";
import { MySQLStorage } from "./mysql/createMySQLStorage.js";

describe("DrizzleAgentStateStorage", () => {
  describe("MySQL", () => {
    let storage: AgentCheckpointStorage;

    beforeAll(async () => {
      storage = new MySQLStorage({
        type: "mysql",
        connectionString: "mysql://root:test@localhost:3306/testdb",
      });
      await storage.start();
    });

    it("should store and retrieve checkpoint", async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-1",
        sessionId: "session-1",
        agentType: "coder",
        name: "session-1",
        state: { agentState: { messages: { hello: "world" } }, toolsEnabled: ["foo"], hooksEnabled: ["bar"] },
        createdAt: Date.now(),
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect(id).toBeDefined();

      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(checkpoint.agentId);
      expect(retrieved?.sessionId).toBe(checkpoint.sessionId);
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
});
```

## Package Structure

```
pkg/drizzle-storage/
├── index.ts                    # Package entry point with exports
├── plugin.ts                   # TokenRingPlugin implementation
├── schema.ts                   # Combined configuration schema
├── package.json                # Dependencies and scripts
├── README.md                   # Package documentation
├── DrizzleAgentStateStorage.test.ts  # Test suite
├── vitest.config.ts            # Test configuration
├── LICENSE                     # MIT License
├── sqlite/                     # SQLite implementation
│   ├── createSQLiteStorage.ts  # SQLiteStorage class
│   ├── schema.ts               # Drizzle schema
│   └── drizzle.config.ts       # Drizzle configuration
├── mysql/                      # MySQL implementation
│   ├── createMySQLStorage.ts   # MySQLStorage class
│   ├── schema.ts               # Drizzle schema
│   └── drizzle.config.ts       # Drizzle configuration
└── postgres/                   # PostgreSQL implementation
    ├── createPostgresStorage.ts # PostgresStorage class
    ├── schema.ts               # Drizzle schema
    └── drizzle.config.ts       # Drizzle configuration
```

## Dependencies

### Runtime Dependencies

- `drizzle-orm`: Type-safe ORM for database operations
- `mysql2`: MySQL driver with connection pooling
- `postgres`: PostgreSQL driver with connection pooling
- `bun:sqlite`: Bun's built-in SQLite driver (for SQLite only)
- `zod`: Schema validation
- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/checkpoint`: Token Ring checkpoint interface

### Development Dependencies

- `drizzle-kit`: Migration generator
- `vitest`: Testing framework
- `testcontainers`: Docker container management for testing
- `typescript`: TypeScript compiler
- `bun-types`: TypeScript definitions for Bun

## Migration Strategy

This package uses Drizzle's codebase-first approach with runtime table creation:

1. **Define Schema**: Schema is defined in TypeScript files for each database type (`sqlite/schema.ts`, `mysql/schema.ts`, `postgres/schema.ts`)
2. **Create Tables**: Tables are automatically created at runtime when the `start()` method is called using `CREATE TABLE IF NOT EXISTS` statements
3. **Note**: Drizzle migrations are not automatically applied via the migration system due to Bun packaging constraints. The `start()` method creates tables directly.

## Error Handling

The package includes comprehensive error handling:

- Database connection errors
- Invalid checkpoint data
- Non-existent checkpoint retrieval (returns `null`)
- JSON parsing errors for state

## Performance Considerations

- **SQLite**: Single-file database, ideal for development and small-scale applications
- **MySQL**: Connection pooling for high-performance applications
- **PostgreSQL**: Advanced features for enterprise workloads with connection pooling

## Notes

- State must be JSON-serializable
- Tables are created on initialization (not via migrations)
- Connection pooling enabled for MySQL/PostgreSQL
- SQLite requires Bun runtime
- Suitable for production workloads with MySQL/PostgreSQL
- Plugin automatically registers with Token Ring checkpoint service
- Checkpoints include `sessionId` and `agentType` fields for proper organization
- MySQL creates `AgentState` table while SQLite and PostgreSQL create `AgentCheckpoints`
- MySQL and PostgreSQL `start()` methods include a `config` column in the table definition (not currently used)

## Related Components

- [@tokenring-ai/checkpoint](./checkpoint.md) - Checkpoint management system
- [@tokenring-ai/agent](./agent.md) - Agent orchestration system
- [@tokenring-ai/app](./token-ring-app.md) - Token Ring application framework

## License

MIT License - see LICENSE file for details.
