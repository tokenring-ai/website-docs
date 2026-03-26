# @tokenring-ai/drizzle-storage

Multi-database storage for agent state checkpoints and app session checkpoints using Drizzle ORM with support for SQLite, MySQL, and PostgreSQL.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a production-ready, multi-database storage solution for managing agent state checkpoints and app session checkpoints in the Token Ring AI system. It implements both the `AgentCheckpointStorage` and `AppCheckpointStorage` interfaces with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations and automatic table creation.

## Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, PostgreSQL
- **Dual Storage Interfaces**: Implements both `AgentCheckpointStorage` and `AppCheckpointStorage`
- **Type-Safe Operations**: Full TypeScript type safety with Drizzle ORM
- **Automatic Table Creation**: Schema creation on initialization via `start()` method
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Unified Interface**: Same API across all database types
- **Token Ring Service**: Seamless integration via Token Ring's service system
- **JSON State Management**: Automatic JSON serialization/deserialization
- **Plugin Support**: TokenRingPlugin for automatic configuration
- **Latest Checkpoint Retrieval**: Specialized method for retrieving the latest app checkpoint

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

The package provides storage classes for each database type, all implementing the `AgentCheckpointStorage`, `AppCheckpointStorage`, and `TokenRingService` interfaces.

```typescript
import { SQLiteStorage, MySQLStorage, PostgresStorage } from '@tokenring-ai/drizzle-storage';
```

### Plugin Implementation

The plugin automatically registers the storage service with the Token Ring checkpoint services:

```typescript
// pkg/drizzle-storage/plugin.ts
import { TokenRingPlugin } from "@tokenring-ai/app";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import AppCheckpointService from "@tokenring-ai/checkpoint/AppCheckpointService";
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
        app.services.waitForItemByType(AppCheckpointService, (checkpointService) => {
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

SQLite storage provider implementing `TokenRingService`, `AgentCheckpointStorage`, and `AppCheckpointStorage`:

```typescript
class SQLiteStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "sqlite";
    databasePath: string;
    migrationsFolder?: string;
  });

  start(): Promise<void>;
  // AgentCheckpointStorage methods
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
  // AppCheckpointStorage methods
  storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

**Properties:**
- `name`: "SQLiteStorage"
- `description`: "SQLite storage provider"
- `displayName`: "SQLite (database_path)"

### MySQLStorage

MySQL storage provider implementing `TokenRingService`, `AgentCheckpointStorage`, and `AppCheckpointStorage`:

```typescript
class MySQLStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "mysql";
    connectionString: string;
  });

  start(): Promise<void>;
  // AgentCheckpointStorage methods
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
  // AppCheckpointStorage methods
  storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

**Properties:**
- `name`: "MySQLStorage"
- `description`: "MySQL storage provider"
- `displayName`: "MySQL (connection_string)"

### PostgresStorage

PostgreSQL storage provider implementing `TokenRingService`, `AgentCheckpointStorage`, and `AppCheckpointStorage`:

```typescript
class PostgresStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "postgres";
    connectionString: string;
  });

  start(): Promise<void>;
  // AgentCheckpointStorage methods
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
  // AppCheckpointStorage methods
  storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

**Properties:**
- `name`: "PostgresStorage"
- `description`: "PostgreSQL storage provider"
- `displayName`: "Postgres (connection_string)"

## API Reference

### AgentCheckpointStorage Interface

All storage classes implement this interface for agent-level checkpoint storage:

```typescript
interface AgentCheckpointStorage {
  start?(): Promise<void>;
  storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
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
- Creates the `AgentCheckpoints` and `AppCheckpoints` tables if they don't exist
- Prepares the storage for checkpoint operations

#### storeAgentCheckpoint()

Stores a new agent checkpoint with the provided data:

```typescript
const checkpoint = {
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeAgentCheckpoint(checkpoint);
console.log('Checkpoint ID:', id);
```

**Parameters:**
- `checkpoint: NamedAgentCheckpoint` - The checkpoint data to store

**Returns:**
- `Promise<string>` - The ID of the stored checkpoint

#### retrieveAgentCheckpoint()

Retrieves an agent checkpoint by its ID:

```typescript
const retrieved = await storage.retrieveAgentCheckpoint(id);
if (retrieved) {
  console.log('Retrieved state:', retrieved.state);
  console.log('Retrieved agentId:', retrieved.agentId);
}
```

**Parameters:**
- `id: string` - The checkpoint ID to retrieve

**Returns:**
- `Promise<StoredAgentCheckpoint | null>` - The checkpoint data or null if not found

#### listAgentCheckpoints()

Lists all agent checkpoints ordered by creation time (descending):

```typescript
const checkpoints = await storage.listAgentCheckpoints();
console.log('Total checkpoints:', checkpoints.length);
checkpoints.forEach(cp => {
  console.log(`${cp.name} (${cp.agentId}): ${new Date(cp.createdAt)}`);
});
```

**Returns:**
- `Promise<AgentCheckpointListItem[]>` - Array of checkpoint summaries

### AppCheckpointStorage Interface

All storage classes also implement this interface for app-level session checkpoint storage:

```typescript
interface AppCheckpointStorage {
  start?(): Promise<void>;
  storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

#### storeAppCheckpoint()

Stores a new app session checkpoint:

```typescript
const checkpoint = {
  sessionId: "session-456",
  hostname: "localhost",
  projectDirectory: "/home/user/project",
  state: { files: ["index.ts"], config: {} },
  createdAt: Date.now()
};

const id = await storage.storeAppCheckpoint(checkpoint);
console.log('App Checkpoint ID:', id);
```

**Parameters:**
- `checkpoint: AppSessionCheckpoint` - The app session checkpoint data to store

**Returns:**
- `Promise<string>` - The ID of the stored checkpoint

#### retrieveAppCheckpoint()

Retrieves an app session checkpoint by its ID:

```typescript
const retrieved = await storage.retrieveAppCheckpoint(id);
if (retrieved) {
  console.log('Retrieved state:', retrieved.state);
  console.log('Working directory:', retrieved.projectDirectory);
}
```

**Parameters:**
- `id: string` - The checkpoint ID to retrieve

**Returns:**
- `Promise<StoredAppCheckpoint | null>` - The checkpoint data or null if not found

#### listAppCheckpoints()

Lists all app session checkpoints ordered by creation time (descending):

```typescript
const checkpoints = await storage.listAppCheckpoints();
console.log('Total app checkpoints:', checkpoints.length);
checkpoints.forEach(cp => {
  console.log(`${cp.hostname}: ${new Date(cp.createdAt)}`);
});
```

**Returns:**
- `Promise<AppSessionListItem[]>` - Array of checkpoint summaries

#### retrieveLatestAppCheckpoint()

Retrieves the most recent app session checkpoint:

```typescript
const latest = await storage.retrieveLatestAppCheckpoint();
if (latest) {
  console.log('Latest session:', latest.sessionId);
  console.log('State:', latest.state);
}
```

**Returns:**
- `Promise<StoredAppCheckpoint | null>` - The latest checkpoint data or null if no checkpoints exist

### Data Types

#### Agent Checkpoint Types

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

#### App Checkpoint Types

```typescript
interface AppSessionCheckpoint {
  sessionId: string;
  hostname: string;
  projectDirectory: string;
  state: any;
  createdAt: number;
}

interface StoredAppCheckpoint extends AppSessionCheckpoint {
  id: string;
}

interface AppSessionListItem {
  id: string;
  sessionId: string;
  hostname: string;
  projectDirectory: string;
  createdAt: number;
}
```

## Database Schema

The package creates two tables in each database: `AgentCheckpoints` and `AppCheckpoints`.

### AgentCheckpoints Table

| Column      | Type           | Description                              |
|-------------|----------------|------------------------------------------|
| `id`        | Integer/BigInt | Auto-incrementing primary key            |
| `sessionId` | Text           | Session identifier                       |
| `agentId`   | Text           | Agent identifier                         |
| `agentType` | Text           | Type of agent (e.g., "coder", "writer")  |
| `name`      | Text           | Checkpoint name                          |
| `state`     | Text           | JSON-serialized state data               |
| `createdAt` | Integer/BigInt | Unix timestamp                           |

### AppCheckpoints Table

| Column          | Type           | Description                              |
|-----------------|----------------|------------------------------------------|
| `id`            | Integer/BigInt | Auto-incrementing primary key            |
| `sessionId`     | Text           | Session identifier                       |
| `hostname`      | Text           | Hostname of the app session              |
| `projectDirectory` | Text        | Working directory of the app session     |
| `state`         | Text           | JSON-serialized state data               |
| `createdAt`     | Integer/BigInt | Unix timestamp                           |

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

export const appCheckpoints = sqliteTable("AppCheckpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(),
  hostname: text("hostname").notNull(),
  projectDirectory: text("projectDirectory").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});
```

**Note:** There is a known inconsistency in the MySQL and PostgreSQL `start()` methods where the table creation SQL does not match the actual schema files. The schema files define the correct structure, but the `start()` method may create tables with incorrect column definitions. This should be addressed in future updates.

## Usage Examples

### SQLite Usage

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

await storage.start();

// Store an agent checkpoint
const agentCheckpoint = {
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const agentId = await storage.storeAgentCheckpoint(agentCheckpoint);
console.log('Agent checkpoint stored with ID:', agentId);

// Store an app checkpoint
const appCheckpoint = {
  sessionId: "session-456",
  hostname: "localhost",
  projectDirectory: "/home/user/project",
  state: { files: ["index.ts"], config: {} },
  createdAt: Date.now()
};

const appId = await storage.storeAppCheckpoint(appCheckpoint);
console.log('App checkpoint stored with ID:', appId);
```

### MySQL Usage

```typescript
import { MySQLStorage } from '@tokenring-ai/drizzle-storage';

const storage = new MySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:password@localhost:3306/database"
});

await storage.start();

// Store an agent checkpoint
const agentId = await storage.storeAgentCheckpoint({
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"] },
  createdAt: Date.now()
});

// Store an app checkpoint
const appId = await storage.storeAppCheckpoint({
  sessionId: "session-456",
  hostname: "localhost",
  projectDirectory: "/home/user/project",
  state: { files: ["index.ts"] },
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

// Store an agent checkpoint
const agentId = await storage.storeAgentCheckpoint({
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"] },
  createdAt: Date.now()
});

// Store an app checkpoint
const appId = await storage.storeAppCheckpoint({
  sessionId: "session-456",
  hostname: "localhost",
  projectDirectory: "/home/user/project",
  state: { files: ["index.ts"] },
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

  // Store initial agent state
  const initialAgentCheckpoint = {
    agentId: 'my-agent',
    sessionId: 'session-1',
    agentType: 'coder',
    name: 'initial',
    state: { step: 0, message: 'Starting workflow' },
    createdAt: Date.now()
  };

  const initialAgentId = await storage.storeAgentCheckpoint(initialAgentCheckpoint);
  console.log('Initial agent checkpoint stored:', initialAgentId);

  // Store initial app state
  const initialAppCheckpoint = {
    sessionId: 'session-1',
    hostname: 'localhost',
    projectDirectory: '/home/user/project',
    state: { files: ['index.ts'], step: 0 },
    createdAt: Date.now()
  };

  const initialAppId = await storage.storeAppCheckpoint(initialAppCheckpoint);
  console.log('Initial app checkpoint stored:', initialAppId);

  // Retrieve and update agent checkpoint
  const current = await storage.retrieveAgentCheckpoint(initialAgentId);
  if (current) {
    current.state.step += 1;
    current.state.message = 'Processing...';

    const updatedId = await storage.storeAgentCheckpoint({
      ...current,
      createdAt: Date.now()
    });
    console.log('Agent checkpoint updated:', updatedId);
  }

  // Retrieve latest app checkpoint
  const latestApp = await storage.retrieveLatestAppCheckpoint();
  if (latestApp) {
    console.log('Latest app session:', latestApp.sessionId);
    console.log('Working directory:', latestApp.projectDirectory);
  }

  // List all agent checkpoints
  const agentCheckpoints = await storage.listAgentCheckpoints();
  console.log('Total agent checkpoints:', agentCheckpoints.length);

  // List all app checkpoints
  const appCheckpoints = await storage.listAppCheckpoints();
  console.log('Total app checkpoints:', appCheckpoints.length);
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

    const agentCheckpoint = {
      agentId: "agent-123",
      sessionId: "session-1",
      agentType: "coder",
      name: "session-1",
      state: { messages: ["Hello"] },
      createdAt: Date.now()
    };

    const id = await storage.storeAgentCheckpoint(agentCheckpoint);
    console.log('Checkpoint stored:', id);

    // Handle non-existent checkpoint
    const missing = await storage.retrieveAgentCheckpoint("999999");
    if (missing === null) {
      console.log('Checkpoint not found');
    }

    // Handle no app checkpoints
    const latest = await storage.retrieveLatestAppCheckpoint();
    if (latest === null) {
      console.log('No app checkpoints exist');
    }
  } catch (error) {
    console.error('Database operation failed:', error);
  }
}
```

### Plugin Integration Example

```typescript
// Configure in .tokenring/coder-config.mjs
export default {
  drizzleStorage: {
    type: "sqlite",
    databasePath: "./tokenring-state.db"
  }
};

// The plugin will automatically:
// 1. Create the storage instance
// 2. Register it with the app services
// 3. Set it as the checkpoint provider for AgentCheckpointService
// 4. Set it as the checkpoint provider for AppCheckpointService
```

## Best Practices

- **Use the Plugin**: When possible, use the TokenRing plugin for automatic integration with both checkpoint services
- **JSON Serialization**: Ensure state objects are JSON-serializable
- **Connection Pooling**: Use MySQL or PostgreSQL for production workloads with connection pooling
- **Error Handling**: Wrap storage operations in try-catch blocks to handle database errors
- **Checkpoint Naming**: Use descriptive names for checkpoints to make them easier to identify
- **Cleanup**: Regularly review and clean up old checkpoints to manage storage space
- **Session Tracking**: Always include `sessionId` and `agentType` fields for proper checkpoint organization
- **Separate Concerns**: Use agent checkpoints for agent-specific state and app checkpoints for application-level session state
- **Latest Checkpoint**: Use `retrieveLatestAppCheckpoint()` when you need the most recent app session state
- **Schema Consistency**: Be aware of the schema inconsistency issue in MySQL/PostgreSQL `start()` methods

## Integration

### Integration with Agent System

The package integrates with the Token Ring agent system through the TokenRing plugin:

1. **Service Registration**: Automatically registers the storage service with the application
2. **Agent Checkpoint Service Integration**: Automatically registers the storage provider with AgentCheckpointService
3. **App Checkpoint Service Integration**: Automatically registers the storage provider with AppCheckpointService
4. **State Management**: Provides storage backend for both agent state checkpoints and app session checkpoints
5. **Automatic Configuration**: Reads configuration from Token Ring config files

### Integration with Other Packages

The package integrates with:

- **@tokenring-ai/app**: For plugin registration and app framework integration
- **@tokenring-ai/checkpoint**: For checkpoint storage interfaces and types (both AgentCheckpointStorage and AppCheckpointStorage)
- **@tokenring-ai/agent**: For agent state management and persistence

## Testing

Run comprehensive tests with Bun runtime:

```bash
bun run test
```

### Test Coverage

- **SQLite**: Local file database (requires Bun runtime due to `bun:sqlite` module)
- **MySQL/PostgreSQL**: Tests are currently skipped (require Docker/testcontainers)
- CRUD operations for both agent and app checkpoints
- Error handling and edge cases
- Non-existent checkpoint retrieval (returns `null`)
- Latest app checkpoint retrieval
- Complex state structure preservation

### Important Notes on Testing

- **SQLite tests require Bun runtime**: The SQLite implementation uses Bun's native `bun:sqlite` module, so tests must be run with `bun test`
- **MySQL/PostgreSQL tests are skipped**: These tests require Docker containers via testcontainers and are currently marked as skipped
- To enable MySQL/PostgreSQL tests, you'll need to set up Docker containers using testcontainers

### Example Test

```typescript
import { AgentCheckpointStorage, NamedAgentCheckpoint } from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import { AppCheckpointStorage, AppSessionCheckpoint } from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { SQLiteStorage } from "./sqlite/createSQLiteStorage.js";

describe("DrizzleStorage - SQLite (Bun Required)", () => {
  // Check for Bun runtime
  const isBun = typeof Bun !== "undefined";
  
  if (!isBun) {
    it.skip("SQLite tests require Bun runtime", () => {
      expect(true).toBe(true);
    });
    return;
  }

  describe("SQLite Storage Operations", () => {
    let storage: AgentCheckpointStorage;
    const dbPath = "./test-agent-state.db";

    beforeAll(async () => {
      // Use dynamic import to avoid bun:sqlite import error in Node.js
      const { SQLiteStorage } = await import("./sqlite/createSQLiteStorage.js");
      storage = new SQLiteStorage({
        type: "sqlite",
        databasePath: dbPath,
      });
      await storage.start();
    });

    afterAll(async () => {
      // Cleanup: remove test database file
      const { unlinkSync, existsSync } = await import("node:fs");
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
    });

    it("should store and retrieve checkpoint", async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-1",
        sessionId: "session-1",
        agentType: "general",
        name: "session-1",
        state: { agentState: { messages: { hello: "world" } }, toolsEnabled: ["foo"], hooksEnabled: ["bar"] },
        createdAt: Date.now(),
      };

      const id = await storage.storeAgentCheckpoint(checkpoint);
      expect(id).toBeDefined();
      expect(typeof id).toBe("string");

      const retrieved = await storage.retrieveAgentCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(checkpoint.agentId);
      expect(retrieved?.name).toBe(checkpoint.name);
      expect(retrieved?.state).toEqual(checkpoint.state);
    });

    it("should return null for non-existent checkpoint", async () => {
      const retrieved = await storage.retrieveAgentCheckpoint("999999");
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
- `@tokenring-ai/checkpoint`: Token Ring checkpoint interfaces

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
4. **Known Issue**: There is an inconsistency between the schema files and the table creation SQL in the `start()` methods for MySQL and PostgreSQL. The schema files define the correct structure, but the `start()` method may create tables with incorrect column definitions.

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
- Plugin automatically registers with both Token Ring checkpoint services (AgentCheckpointService and AppCheckpointService)
- Agent checkpoints include `sessionId` and `agentType` fields for proper organization
- App checkpoints include `hostname` and `projectDirectory` fields for session context
- Each storage class implements both `AgentCheckpointStorage` and `AppCheckpointStorage` interfaces
- `retrieveLatestAppCheckpoint()` provides convenient access to the most recent app session state
- All checkpoint lists are ordered by creation time (descending)
- **Important**: There is a known schema inconsistency in MySQL/PostgreSQL `start()` methods that should be addressed

## Related Components

- [@tokenring-ai/checkpoint](./checkpoint.md) - Checkpoint management system
- [@tokenring-ai/agent](./agent.md) - Agent orchestration system
- [@tokenring-ai/app](./app.md) - Token Ring application framework

## License

MIT License - see LICENSE file for details.
