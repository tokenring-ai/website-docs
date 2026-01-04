# Database Plugin

## Overview
The `@tokenring-ai/database` package (v0.2.0) provides an abstract database layer for managing database resources within TokenRing AI agents. It enables the registration and interaction with multiple database connections through a unified `DatabaseService` that integrates with the TokenRing agent framework.

The package focuses on abstraction, requiring implementers to extend `DatabaseProvider` for specific database types (e.g., PostgreSQL, MySQL). It supports read-only and read-write operations, with tools for safe querying and schema exploration, making it particularly useful for AI-driven applications that need to interact with databases dynamically.

## Package Structure

```
pkg/database/
├── index.ts                          # Package entry point and configuration schema
├── DatabaseService.ts                # Core service for managing database providers
├── DatabaseProvider.ts               # Abstract base class for database implementations
├── plugin.ts                         # TokenRing plugin integration
├── tools.ts                          # Tool exports
├── tools/
│   ├── executeSql.ts                 # SQL execution tool
│   └── showSchema.ts                 # Schema inspection tool
├── contextHandlers.ts                # Context handler exports
├── contextHandlers/
│   └── availableDatabases.ts         # Database availability context handler
├── vitest.config.ts                  # Vitest configuration
├── README.md                         # Package-specific documentation
├── LICENSE                           # License file
└── package.json                      # Package metadata and dependencies
```

## Core Components

### DatabaseService

The `DatabaseService` is the central manager for database providers, implementing the `TokenRingService` interface. It uses a `KeyedRegistry` for managing registered database providers.

**Key Methods:**
- `registerDatabase(name: string, provider: DatabaseProvider)`: Registers a database provider by name
- `getDatabaseByName(name: string): DatabaseProvider | undefined`: Retrieves a registered provider
- `getAvailableDatabases(): string[]`: Lists all registered database names

### DatabaseProvider

Abstract base class for concrete database implementations. Extend this to connect to specific databases.

**Constructor Options:**
```typescript
interface DatabaseProviderOptions {
  allowWrites?: boolean;  // Defaults to false
}
```

**Abstract Methods (must be implemented):**
- `async executeSql(sqlQuery: string): Promise<ExecuteSqlResult>`: Executes SQL and returns structured results
- `async showSchema(): Promise<Record<string, string>>`: Returns table schemas as key-value map

**Interfaces:**
```typescript
interface ExecuteSqlResult {
  rows: Record<string, string | number | null>[];  // Query result rows
  fields: string[];                               // Column names
}
```

## Tools

The package provides two agent tools that integrate with the TokenRing chat system:

### executeSql

- **Name**: `database_executeSql`
- **Description**: Executes an arbitrary SQL query on a database with built-in safety protections
- **Input Schema**:
  ```typescript
  {
    databaseName?: string,  // Optional: The name of the database to target
    sqlQuery: string        // The SQL query to execute
  }
  ```
- **Features**:
  - Automatically prompts for human confirmation on non-SELECT queries
  - Validates database existence before execution
  - Provides detailed error messages for missing databases
  - Requires `available-databases` context handler

**Usage Example:**
```typescript
// Execute a SELECT query
await agent.callTool('database_executeSql', {
  databaseName: 'myPostgres',
  sqlQuery: 'SELECT * FROM users WHERE active = true'
});

// Execute a write operation (requires human confirmation)
await agent.callTool('database_executeSql', {
  sqlQuery: 'UPDATE users SET last_login = NOW() WHERE id = 123'
});
```

### showSchema

- **Name**: `database_showSchema`
- **Description**: Shows the 'CREATE TABLE' statements for all tables in the specified database
- **Input Schema**:
  ```typescript
  {
    databaseName: string  // Required: The name of the database
  }
  ```
- **Features**:
  - Validates database existence
  - Returns structured schema information
  - Requires `available-databases` context handler

**Usage Example:**
```typescript
// Show database schema
const schema = await agent.callTool('database_showSchema', {
  databaseName: 'myPostgres'
});
```

## Context Handlers

### available-databases

Automatically provides agents with information about available databases through the context system.

**Functionality:**
- Yields database names as context items
- Returns empty if no databases are registered
- Provides formatted list of available databases for agent awareness

**Example Output:**
```
/* These are the databases available for the database tool */:
- myPostgres
- analytics
- reporting
```

## Plugin Integration

The package exports a TokenRing plugin that automatically integrates with the application:

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import packageJSON from "./package.json" with { type: "json" };
import { DatabaseConfigSchema } from "./index.ts";
import { ChatService } from "@tokenring-ai/chat";
import contextHandlers from "./contextHandlers.ts";
import DatabaseService from "./DatabaseService.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  database: DatabaseConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.database) {
      app.waitForService(ChatService, chatService => {
        chatService.addTools(packageJSON.name, tools);
        chatService.registerContextHandlers(contextHandlers);
      });
      app.addServices(new DatabaseService());
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Configuration

The Database plugin is configured via the `database.providers` field in the application's configuration. Each provider is defined with specific parameters depending on the database type.

Example configuration:

```json
{
  "database": {
    "providers": {
      "myPostgres": {
        "allowWrites": true,
        "connectionString": "postgres://user:pass@localhost:5432/db"
      },
      "mySqlite": {
        "path": "data/db.sqlite"
      }
    }
  }
}
```

Each provider's configuration varies by implementation. For example, PostgreSQL providers use `connectionString`, while SQLite providers use `path`.

## Usage Examples

### 1. Implementing a Concrete DatabaseProvider

```typescript
import DatabaseProvider from '@tokenring-ai/database';
import { Pool } from 'pg';

export class PostgresProvider extends DatabaseProvider {
  private pool: Pool;

  constructor(options: DatabaseProviderOptions & { connectionString: string }) {
    super(options);
    this.pool = new Pool({ connectionString: options.connectionString });
  }

  async executeSql(sqlQuery: string): Promise<ExecuteSqlResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sqlQuery);
      return {
        rows: result.rows,
        fields: result.fields.map(f => f.name)
      };
    } finally {
      client.release();
    }
  }

  async showSchema(): Promise<Record<string, string>> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(`
        SELECT table_name, pg_get_tabledef(table_name::regclass) as schema 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const schemas: Record<string, string> = {};
      for (const row of res.rows) {
        schemas[row.table_name] = row.schema;
      }
      return schemas;
    } finally {
      client.release();
    }
  }
}
```

### 2. Using with TokenRing Plugin

```typescript
import TokenRingApp from '@tokenring-ai/app';
import databasePlugin from '@tokenring-ai/database';

const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        myPostgres: {
          allowWrites: true,
          connectionString: process.env.DB_URL
        }
      }
    }
  }
});

app.use(databasePlugin);
```

### 3. Direct Usage

```typescript
import DatabaseService from '@tokenring-ai/database/DatabaseService';
import PostgresProvider from './PostgresProvider';

const dbService = new DatabaseService();
const postgresDb = new PostgresProvider({
  allowWrites: true,
  connectionString: process.env.DB_URL
});

dbService.registerDatabase('myPostgres', postgresDb);

// Now available to agents through the tools
```

## Best Practices
- Always handle database connections in a singleton pattern to prevent multiple connections.
- Use parameterized queries to prevent SQL injection.
- Ensure proper error handling when executing database operations.

## Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage

# Run ESLint
bun run eslint
```

## Related Components
- `@tokenring-ai/chat`: For chat integration and context handling.
- `@tokenring-ai/agent`: For agent-based orchestration.
- `@tokenring-ai/utility`: Shared utility functions.

## License
MIT License. See the [LICENSE](../LICENSE) file for details.