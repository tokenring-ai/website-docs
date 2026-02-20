# Database Plugin

## Overview

The `@tokenring-ai/database` package provides an abstract database layer for managing database resources within TokenRing AI agents. It enables the registration and interaction with multiple database connections through a unified `DatabaseService` that integrates with the TokenRing plugin system and agent framework.

The package focuses on abstraction, requiring implementers to extend `DatabaseProvider` for specific database types. It supports tool-based interaction with agents, context handlers for database availability, and write operation protection through human confirmation for non-SELECT queries.

## Core Components

- **DatabaseService**: Service class that manages registered database providers via KeyedRegistry
- **DatabaseProvider**: Abstract base class for database implementations
- **executeSql**: Tool for executing SQL queries with write protection
- **showSchema**: Tool for inspecting database schema
- **available-databases**: Context handler that provides list of registered database names

## Key Features

- Abstract database provider interface for multiple database systems
- Unified service management through `DatabaseService` with KeyedRegistry pattern
- Tool-based interaction with agents via ChatService
- Context handlers for database availability injection
- Write protection with human confirmation for non-SELECT queries
- Schema inspection capabilities
- Type-safe tool execution with Zod schemas
- Required context handler enforcement (`available-databases`)

## Installation

```bash
bun install @tokenring-ai/database
```

## Package Structure

```
pkg/database/
├── index.ts                        # Package entry point and configuration schemas
├── package.json                    # Package metadata and dependencies
├── README.md                       # Main documentation
├── vitest.config.ts                # Test configuration
├── DatabaseProvider.ts             # Abstract base class for database implementations
├── DatabaseService.ts              # Core service for managing database providers
├── plugin.ts                       # TokenRing plugin integration
├── tools.ts                        # Tool exports (barrel file)
├── tools/
│   ├── executeSql.ts               # SQL execution tool implementation
│   └── showSchema.ts               # Schema inspection tool implementation
├── contextHandlers.ts              # Context handler exports (barrel file)
└── contextHandlers/
    └── availableDatabases.ts       # Database availability context handler
```

## Plugin Integration

### Plugin Registration

The plugin is installed using the application's install method:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";

const app = new TokenRingApp();

app.install(databasePlugin, {
  database: {
    providers: {
      myPostgres: {},
      myReadonlyDb: {}
    }
  }
});

// Service, tools, and context handlers are now available
```

### Plugin Configuration Schema

The plugin configuration uses a Zod schema for validation:

```typescript
const packageConfigSchema = z.object({
  database: DatabaseConfigSchema.optional(),
});

export const DatabaseConfigSchema = z.object({
  providers: z.record(z.string(), z.any())
}).optional();
```

### Installation Lifecycle

The plugin's `install()` method executes during application initialization:

```typescript
export default {
  name: "@tokenring-ai/database",
  version: "0.2.0",
  description: "Abstract database resources and interfaces",
  install(app, config) {
    if (config.database) {
      // Wait for ChatService then register tools and context handlers
      app.waitForService(ChatService, chatService => {
        chatService.addTools(tools);
        chatService.registerContextHandlers(contextHandlers);
      });
      // Add service to app's service registry
      app.addServices(new DatabaseService());
    }
  },
  config: packageConfigSchema,
};
```

## Services

### DatabaseService

The main service class that implements `TokenRingService` interface. It manages a registry of `DatabaseProvider` instances using the `KeyedRegistry` from `@tokenring-ai/utility`.

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  readonly databases: KeyedRegistry<DatabaseProvider>;
}
```

**Service Properties:**

- `name`: Service identifier ("DatabaseService")
- `description`: Service description ("Database service")
- `databases`: `KeyedRegistry<DatabaseProvider>` - Registry managing all database provider instances

**Resource Management Methods:**

```typescript
registerDatabase(name: string, provider: DatabaseProvider): void

getDatabaseByName(name: string): DatabaseProvider | undefined

getAvailableDatabases(): string[]
```

**Method Descriptions:**

- `registerDatabase(name, provider)`: Registers a database provider with the service
- `getDatabaseByName(name)`: Retrieves a database provider by name
- `getAvailableDatabases()`: Returns an array of all registered database names

**KeyedRegistry Methods Used:**

- `register(name, item)`: Register a database provider
- `getItemByName(name)`: Get database provider by name
- `getAllItemNames()`: Get all registered database names

## Tools

The plugin provides two agent tools that integrate with the TokenRing chat system.

### database_executeSql

Executes an arbitrary SQL query on a database. WARNING: Use with extreme caution as this can modify or delete data.

**Tool Definition:**

```typescript
{
  name: "database_executeSql",
  displayName: "Database/executeSql",
  description: "Executes an arbitrary SQL query on a database using the DatabaseResource. WARNING: Use with extreme caution as this can modify or delete data.",
  inputSchema: {
    databaseName?: string
    sqlQuery: string
  },
  requiredContextHandlers: ["available-databases"]
}
```

**Parameters:**

- `databaseName` (optional): The name of the database to target. May also be specified in the SQL query.
- `sqlQuery` (required): The SQL query to execute.

**Execute Function Signature:**

```typescript
async execute(
  {databaseName, sqlQuery}: z.infer<typeof inputSchema>,
  agent: Agent
): Promise<ExecuteSqlResult>
```

**Features:**

- **Write Protection**: Automatically prompts for human confirmation for non-SELECT queries
- **Validation**: Validates database existence before execution
- **Error Handling**: Provides detailed error messages for missing databases
- **Required Context Handler**: Requires `available-databases` context handler to be registered

**Usage Example:**

```typescript
// Execute a SELECT query
await agent.callTool('database_executeSql', {
  databaseName: 'postgres',
  sqlQuery: 'SELECT * FROM users WHERE active = true'
});

// Execute with optional database name (can also be specified in SQL query)
await agent.callTool('database_executeSql', {
  sqlQuery: 'SELECT * FROM users WHERE active = true'
});

// Execute a write operation (requires confirmation)
await agent.callTool('database_executeSql', {
  sqlQuery: 'UPDATE users SET last_login = NOW() WHERE id = 123'
});
```

**Execute Implementation Details:**

```typescript
// Check database existence
const databaseResource = databaseService.getDatabaseByName(databaseName);
if (!databaseResource) {
  throw new Error(`[${name}] Database ${databaseName} not found`);
}

// Write protection for non-SELECT queries
if (!sqlQuery.trim().startsWith("SELECT")) {
  const approved = await agent.askForApproval({
    message: `Execute SQL write operation on database '${databaseName}'?\n\nQuery: ${sqlQuery}`,
  });

  if (!approved) {
    throw new Error("User did not approve the SQL query that was provided.");
  }
}

// Execute query
return databaseResource.executeSql(sqlQuery);
```

### database_showSchema

Shows the `'CREATE TABLE'` statements (or equivalent) for all tables in the specified database.

**Tool Definition:**

```typescript
{
  name: "database_showSchema",
  displayName: "Database/showSchema",
  description: "Shows the 'CREATE TABLE' statements (or equivalent) for all tables in the specified database.",
  inputSchema: {
    databaseName: string
  },
  requiredContextHandlers: ["available-databases"]
}
```

**Parameters:**

- `databaseName` (required): The name of the database for which to show the schema.

**Execute Function Signature:**

```typescript
async execute(
  { databaseName }: { databaseName: string },
  agent: Agent
): Promise<Record<string, string> | string>
```

**Features:**

- **Validation**: Validates database existence before execution
- **Structured Output**: Returns structured schema information as key-value pairs
- **Required Context Handler**: Requires `available-databases` context handler to be registered

**Usage Example:**

```typescript
// Show database schema
const schema = await agent.callTool('database_showSchema', {
  databaseName: 'postgresql'
});

// Returns something like:
// {
//   "users": "CREATE TABLE users (...)",
//   "auth": "CREATE TABLE auth (...)",
//   "products": "CREATE TABLE products (...)"
// }
```

**Execute Implementation Details:**

```typescript
// Check database existence
const databaseResource = databaseService.getDatabaseByName(databaseName);
if (!databaseResource) {
  throw new Error(`[${name}] Database ${databaseName} not found`);
}

// Delegate to provider's showSchema() method
return databaseResource.showSchema();
```

## Context Handlers

The plugin provides context handlers that inject relevant information into chat sessions.

### available-databases

Automatically provides agents with information about available databases.

**Context Handler Function:**

```typescript
async function* getContextItems(
  input: string,
  chatConfig: ParsedChatConfig,
  params: {},
  agent: Agent
): AsyncGenerator<ContextItem>
```

**Functionality:**

- Retrieves all registered database names via `databaseService.databases.getAllItemNames()`
- Yields database names as formatted context items
- Returns early if no databases are registered
- Provides formatted list for agent awareness

**Context Item Format:**

```
/* These are the databases available for the database tool */:
- postgresql
- mysql
- sqlite
```

**Implementation:**

```typescript
export default async function* getContextItems(
  input: string,
  chatConfig: ParsedChatConfig,
  params: {},
  agent: Agent
): AsyncGenerator<ContextItem> {
  const databaseService = agent.requireServiceByType(DatabaseService);
  const available = databaseService['databases'].getAllItemNames();
  if (available.length === 0) return;

  yield {
    role: "user",
    content:
      "/* These are the databases available for the database tool */:\n" +
      available.map((name) => `- ${name}`).join("\n"),
  };
}
```

**Required Context Handlers:**

The `database_executeSql` and `database_showSchema` tools require the `available-databases` context handler to be registered during plugin installation.

## Providers

### DatabaseProvider

Abstract base class for concrete database implementations. All database provider implementations must extend this class and implement the required methods.

**Constructor Options:**

```typescript
export interface DatabaseProviderOptions {
  allowWrites?: boolean;
}

export class DatabaseProvider {
  allowWrites: boolean;

  constructor({allowWrites}: DatabaseProviderOptions) {
    this.allowWrites = allowWrites ?? false;
  }
}
```

**Properties:**

- `allowWrites: boolean`: Whether write operations are allowed on this provider (defaults to false)

**Result Interfaces:**

```typescript
export interface ExecuteSqlResult {
  rows: Record<string, string | number | null>[];
  fields: string[];
}
```

**Abstract Methods (must be implemented):**

```typescript
async executeSql(_sqlQuery: string): Promise<ExecuteSqlResult>;

async showSchema(): Promise<Record<string, string>>;
```

**Method Descriptions:**

- `executeSql(sqlQuery)`: Executes an SQL query and returns structured results with rows and field names
- `showSchema()`: Returns table schemas as a key-value map where keys are table names and values are schema definitions

## Usage Examples

### 1. Implementing a Concrete DatabaseProvider

```typescript
import DatabaseProvider from '@tokenring-ai/database';
import { Pool } from 'pg';

export class PostgresProvider extends DatabaseProvider {
  private pool: Pool;

  constructor(options: { connectionString: string, allowWrites?: boolean }) {
    super({ allowWrites: options.allowWrites ?? false });
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

### 2. Using Direct Service API

```typescript
import { DatabaseService } from '@tokenring-ai/database/DatabaseService';
import PostgresProvider from './PostgresProvider';

// Create the service
const dbService = new DatabaseService();

// Register a database provider
const postgresDb = new PostgresProvider({
  allowWrites: true,
  connectionString: process.env.DB_URL
});

dbService.registerDatabase('myPostgres', postgresDb);

// Register multiple databases
const mysqlDb = new MysqlProvider({
  allowWrites: false,
  connection: mysql.createPool(process.env.MYSQL_URL)
});

dbService.registerDatabase('analytics', mysqlDb);

// List available databases
const available = dbService.getAvailableDatabases();
console.log('Available databases:', available);
// Output: ['myPostgres', 'analytics']

// Get specific database
const postgresResource = dbService.getDatabaseByName('myPostgres');
if (postgresResource) {
  const schema = await postgresResource.showSchema();
  console.log('Schema:', schema);
}
```

### 3. Managing Multiple Databases

```typescript
import DatabaseService from '@tokenring-ai/database/DatabaseService';
import PostgresProvider from './PostgresProvider';
import MySQLProvider from './MySQLProvider';

const dbService = new DatabaseService();

// Register multiple databases with varying permissions
dbService.registerDatabase('production', new PostgresProvider({
  allowWrites: true,
  connectionString: process.env.PROD_DB_URL
}));

dbService.registerDatabase('analytics', new PostgresProvider({
  allowWrites: false,
  connectionString: process.env.ANALYTICS_DB_URL
}));

dbService.registerDatabase('cache', new MySQLProvider({
  allowWrites: false,
  connection: mysql.createPool(process.env.CACHE_DB_URL)
}));

// List available databases
const databases = dbService.getAvailableDatabases();
console.log('Available databases:', databases);
// Output: ['production', 'analytics', 'cache']

// Get database by name
const productionDb = dbService.getDatabaseByName('production');
const cacheDb = dbService.getDatabaseByName('cache');

// Check write permissions
console.log('Production allows writes:', productionDb.allowWrites);
console.log('Cache allows writes:', cacheDb.allowWrites);
```

### 4. Using Tools in Agents

```typescript
import { Agent } from "@tokenring-ai/agent";
import { DatabaseService } from "@tokenring-ai/database";

const agent = new Agent();

// Services are available through agent dependency injection
const databaseService = agent.requireServiceByType(DatabaseService);

// List available databases
const available = databaseService.getAvailableDatabases();
console.log('Available databases:', available);

// Show schema
const schema = await agent.callTool('database_showSchema', {
  databaseName: 'myPostgres'
});

// Execute SELECT query
const result = await agent.callTool('database_executeSql', {
  databaseName: 'myPostgres',
  sqlQuery: 'SELECT * FROM users WHERE active = true'
});

console.log('Query results:', result);

// Execute write query (requires confirmation)
const updateResult = await agent.callTool('database_executeSql', {
  sqlQuery: 'UPDATE users SET last_login = NOW() WHERE id = 123'
});
```

## Best Practices

- **Singleton Pattern**: Always handle database connections in a singleton pattern to prevent multiple connections to the same database
- **Parameterized Queries**: Use parameterized queries to prevent SQL injection attacks
- **Write Protection**: Use the `allowWrites` flag to restrict write operations, and always require human confirmation for non-SELECT queries
- **Error Handling**: Ensure proper error handling when executing database operations
- **Connection Management**: Always release database connections to avoid resource leaks
- **Schema Validation**: Validate database names using the context handler before executing queries
- **Tool Usage**: Use tools (`database_executeSql` and `database_showSchema`) instead of direct service calls
- **Required Context Handlers**: Always register `available-databases` context handler to provide database names to agents
- **Provider Abstraction**: Implement custom providers for specific database systems to maintain abstraction layer

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/chat`: Chat service for tool and context handler registration
- `@tokenring-ai/agent`: Agent framework for tool execution
- `@tokenring-ai/utility`: Shared utilities including KeyedRegistry for registry pattern
- `zod`: Runtime type validation for configuration and tool inputs

### Development Dependencies

- `bun-types`: TypeScript definitions for Bun
- `vitest`: Unit testing framework
- `typescript`: TypeScript compiler

## Testing

The package uses vitest for unit testing. Configure test environment and coverage in `vitest.config.ts`:

```typescript
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

**Test Setup Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DatabaseService from '../DatabaseService';
import DatabaseProvider from '../DatabaseProvider';

// Mock provider
class MockProvider extends DatabaseProvider {
  async executeSql(sqlQuery: string) {
    return { rows: [], fields: [] };
  }

  async showSchema() {
    return { 'mock_table': 'CREATE TABLE mock_table (...)' };
  }
}

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockProvider: MockProvider;

  beforeEach(() => {
    dbService = new DatabaseService();
    mockProvider = new MockProvider({
      allowWrites: false
    });
  });

  afterEach(() => {
    dbService.databases.clear();
  });

  it('registers and retrieves databases', () => {
    dbService.registerDatabase('test-db', mockProvider);

    expect(dbService.getDatabaseByName('test-db')).toBe(mockProvider);
    expect(dbService.getAvailableDatabases()).toEqual(['test-db']);
  });

  it('returns undefined for non-existent database', () => {
    expect(dbService.getDatabaseByName('non-existent')).toBeUndefined();
    expect(dbService.getAvailableDatabases()).toEqual([]);
  });

  it('returns all database names', () => {
    dbService.registerDatabase('db1', mockProvider);
    dbService.registerDatabase('db2', new MockProvider({ allowWrites: false }));

    expect(dbService.getAvailableDatabases()).toEqual(['db1', 'db2']);
  });
});
```

## Related Components

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/chat`: Chat service and context handling
- `@tokenring-ai/agent`: Agent-based orchestration
- `@tokenring-ai/utility`: Shared utility functions including KeyedRegistry

## License

MIT License - see LICENSE file for details.
