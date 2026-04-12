# Database Plugin

## Overview

The `@tokenring-ai/database` package provides an abstract database layer for managing database resources within TokenRing AI agents. It enables the registration and interaction with multiple database connections through a unified `DatabaseService` that integrates with the TokenRing plugin system and agent framework.

The package focuses on abstraction, requiring implementers to extend `DatabaseProvider` for specific database types. It supports tool-based interaction with agents, context handlers for database availability, and write operation protection through human confirmation for non-SELECT queries.

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
bun add @tokenring-ai/database
```

## Core Components

- **DatabaseService**: Service class that manages registered database providers via KeyedRegistry
- **DatabaseProvider**: Abstract base class for database implementations
- **database_executeSql**: Tool for executing SQL queries with write protection
- **database_showSchema**: Tool for inspecting database schema
- **available-databases**: Context handler that provides list of registered database names

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

## Services

### DatabaseService

The main service class that implements `TokenRingService` interface. It manages a registry of `DatabaseProvider` instances using the `KeyedRegistry` from `@tokenring-ai/utility`.

**Service Properties:**

- `name: string` - Service identifier ("DatabaseService")
- `description: string` - Service description ("Database service")
- `databases: KeyedRegistry<DatabaseProvider>` - Registry managing all database provider instances

**Resource Management Methods:**

The service exposes the following methods as arrow functions that delegate to the underlying `KeyedRegistry`:

```typescript
registerDatabase(name: string, provider: DatabaseProvider): void

getDatabaseByName(name: string): DatabaseProvider | undefined

getAvailableDatabases(): string[]
```

**Method Descriptions:**

- `registerDatabase(name, provider)`: Registers a database provider with the service
- `getDatabaseByName(name)`: Retrieves a database provider by name
- `getAvailableDatabases()`: Returns an array of all registered database names

**Implementation:**

```typescript
export default class DatabaseService implements TokenRingService {
  readonly name = "DatabaseService";
  description = "Database service";
  databases = new KeyedRegistry<DatabaseProvider>();

  registerDatabase = this.databases.register;
  getDatabaseByName = this.databases.getItemByName;
  getAvailableDatabases = this.databases.getAllItemNames;
}
```

## Providers

### DatabaseProvider

Abstract base class for concrete database implementations. All database provider implementations must extend this class and implement the required methods.

**Constructor:**

```typescript
constructor(private allowWrites: boolean = false)
```

**Parameters:**

- `allowWrites` (optional): Whether write operations are allowed on this provider (defaults to false)

**Properties:**

- `allowWrites: boolean` - Whether write operations are allowed on this provider (private property)

**Result Interface:**

```typescript
export interface ExecuteSqlResult {
  rows: Record<string, string | number | null>[];
  fields: string[];
}
```

**Methods:**

The `DatabaseProvider` class provides default implementations that throw errors. Concrete implementations must override both methods:

```typescript
async executeSql(_sqlQuery: string): Promise<ExecuteSqlResult>

async showSchema(): Promise<Record<string, string>>
```

**Method Descriptions:**

- `executeSql(sqlQuery)`: Executes an SQL query and returns structured results with rows and field names. Default implementation throws an error.
- `showSchema()`: Returns table schemas as a key-value map where keys are table names and values are schema definitions. Default implementation throws an error.

**Example Implementation:**

```typescript
import DatabaseProvider, { ExecuteSqlResult } from '@tokenring-ai/database';
import { Pool } from 'pg';

export class PostgresProvider extends DatabaseProvider {
  private pool: Pool;

  constructor(connectionString: string, allowWrites: boolean = false) {
    super(allowWrites);
    this.pool = new Pool({ connectionString });
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
    databaseName?: string,
    sqlQuery: string
  },
  requiredContextHandlers: ["available-databases"]
}
```

**Parameters:**

- `databaseName` (optional): The name of the database to target. May also be specified in the SQL query.
- `sqlQuery` (required): The SQL query to execute.

**Features:**

- **Write Protection**: Automatically prompts for human confirmation for non-SELECT queries
- **Validation**: Validates database existence before execution
- **Error Handling**: Provides detailed error messages for missing databases
- **Required Context Handler**: Requires `available-databases` context handler to be registered

**Usage Example:**

```typescript
// Execute a SELECT query
const result = await agent.callTool('database_executeSql', {
  databaseName: 'postgres',
  sqlQuery: 'SELECT * FROM users WHERE active = true'
});

// Execute with optional database name (can also be specified in SQL query)
const result = await agent.callTool('database_executeSql', {
  sqlQuery: 'SELECT * FROM users WHERE active = true'
});

// Execute a write operation (requires confirmation)
const result = await agent.callTool('database_executeSql', {
  sqlQuery: 'UPDATE users SET last_login = NOW() WHERE id = 123'
});
```

**Execute Implementation Details:**

```typescript
async function execute(
  {databaseName, sqlQuery}: z.output<typeof inputSchema>,
  agent: Agent
): Promise<TokenRingToolJSONResult<any>> {
  const databaseService = agent.requireServiceByType(DatabaseService);

  const databaseResource = databaseService.getDatabaseByName(databaseName || '');
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

  const result = await databaseResource.executeSql(sqlQuery);
  return { type: 'json', data: result };
}
```

**Error Handling:**

- If the database is not found: `[database_executeSql] Database <databaseName> not found`
- If user does not approve write operation: `User did not approve the SQL query that was provided.`

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
async function execute(
  { databaseName }: { databaseName: string },
  agent: Agent
): Promise<TokenRingToolJSONResult<any>> {
  const databaseService = agent.requireServiceByType(DatabaseService);

  const databaseResource = databaseService.getDatabaseByName(databaseName);
  if (!databaseResource) {
    throw new Error(`[${name}] Database ${databaseName} not found`);
  }

  return { type: 'json', data: await databaseResource.showSchema() };
}
```

**Error Handling:**

- If the database is not found: `[database_showSchema] Database <databaseName> not found`

## Context Handlers

The plugin provides context handlers that inject relevant information into chat sessions.

### available-databases

Automatically provides agents with information about available databases.

**Context Handler Function:**

```typescript
function* getContextItems({agent}: ContextHandlerOptions): Generator<ContextItem>
```

**Functionality:**

- Retrieves all registered database names via `databaseService.getAvailableDatabases()`
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
export default function* getContextItems({agent}: ContextHandlerOptions): Generator<ContextItem> {
  const databaseService = agent.requireServiceByType(DatabaseService);
  const available = databaseService.getAvailableDatabases();
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

## Configuration

### Plugin Configuration Schema

The plugin configuration uses a Zod schema for validation:

```typescript
const packageConfigSchema = z.object({
  database: DatabaseConfigSchema.optional(),
});

export const DatabaseConfigSchema = z.object({}).optional();
```

**Note:** The `DatabaseConfigSchema` is an empty optional object schema. The configuration serves only to signal that the plugin should be activated and the `DatabaseService` should be registered. Actual database provider instantiation and configuration must be done manually by the implementer.

### Configuration Example

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";
import { DatabaseService } from "@tokenring-ai/database";
import { PostgresProvider } from "./postgres-provider";

const app = new TokenRingApp();

// Install plugin with database configuration to activate the service
app.install(databasePlugin, {
  database: {} // Empty config signals activation
});

// Manually register database providers with the service
app.waitForService(DatabaseService, dbService => {
  const postgresProvider = new PostgresProvider(
    process.env.PROD_DB_URL,
    true // allowWrites
  );
  dbService.registerDatabase('production', postgresProvider);
});
```

**Important:** The plugin does not automatically instantiate database providers from configuration. The configuration object serves two purposes:

1. It signals that the plugin should be activated
2. It triggers the registration of the `DatabaseService`

Implementers must manually create and register database provider instances with the service after installation.

### Plugin Registration

The plugin is installed using the application's install method:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";

const app = new TokenRingApp();

app.install(databasePlugin, {
  database: {}
});
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

**Important Notes:**

- The `DatabaseService` is registered when the plugin is installed with a `database` configuration
- The `DatabaseService` is added to the app immediately during plugin installation
- Tools and context handlers are registered asynchronously after the `ChatService` is available via `waitForService`
- The plugin does not instantiate database providers - this must be done manually by the implementer
- Providers must be registered with the `DatabaseService` after the plugin is installed

### Service Registration

The `DatabaseService` is automatically registered when the plugin is installed with a database configuration.

### Tool Registration

The plugin automatically registers two tools with the ChatService:

- `database_executeSql` - SQL execution tool
- `database_showSchema` - Schema inspection tool

### Context Handler Registration

The plugin automatically registers the `available-databases` context handler with the ChatService.

## RPC Endpoints

This package does not define RPC endpoints. Database operations are performed through the agent tool system.

## State Management

This package does not define state slices. Database providers manage their own connection state.

## Usage Examples

### 1. Implementing a Concrete DatabaseProvider

```typescript
import DatabaseProvider, { ExecuteSqlResult } from '@tokenring-ai/database';
import { Pool } from 'pg';

export class PostgresProvider extends DatabaseProvider {
  private pool: Pool;

  constructor(connectionString: string, allowWrites: boolean = false) {
    super(allowWrites);
    this.pool = new Pool({ connectionString });
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
import DatabaseService from '@tokenring-ai/database/DatabaseService';
import PostgresProvider from './PostgresProvider';

// Create the service
const dbService = new DatabaseService();

// Register a database provider
const postgresDb = new PostgresProvider(
  process.env.DB_URL,
  true  // allowWrites
);

dbService.registerDatabase('myPostgres', postgresDb);

// List available databases
const available = dbService.getAvailableDatabases();
console.log('Available databases:', available);
// Output: ['myPostgres']

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
dbService.registerDatabase('production', new PostgresProvider(
  process.env.PROD_DB_URL,
  true  // allowWrites
));

dbService.registerDatabase('analytics', new PostgresProvider(
  process.env.ANALYTICS_DB_URL,
  false  // read-only
));

dbService.registerDatabase('cache', new MySQLProvider(
  mysql.createPool(process.env.CACHE_DB_URL),
  false  // read-only
));

// List available databases
const databases = dbService.getAvailableDatabases();
console.log('Available databases:', databases);
// Output: ['production', 'analytics', 'cache']

// Get database by name
const productionDb = dbService.getDatabaseByName('production');
const cacheDb = dbService.getDatabaseByName('cache');
```

### 4. Using Tools in Agents

```typescript
import { Agent } from "@tokenring-ai/agent";
import DatabaseService from "@tokenring-ai/database/DatabaseService";

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

### 5. Error Handling

```typescript
try {
  const result = await agent.callTool('database_executeSql', {
    databaseName: 'myPostgres',
    sqlQuery: 'DELETE FROM users WHERE id = 1'
  });
} catch (error) {
  if (error.message.includes('User did not approve')) {
    console.log('Query was not approved by user');
  } else if (error.message.includes('not found')) {
    console.log('Database not found');
  } else {
    console.log('Query execution failed:', error);
  }
}
```

## Best Practices

- **Singleton Pattern**: Always handle database connections in a singleton pattern to prevent multiple connections to the same database
- **Parameterized Queries**: Use parameterized queries to prevent SQL injection attacks
- **Write Protection**: Use the `allowWrites` flag to restrict write operations. Non-SELECT queries automatically require human confirmation via `agent.askForApproval()`
- **Error Handling**: Ensure proper error handling when executing database operations. Tool errors include descriptive messages for database not found and approval denial
- **Connection Management**: Always release database connections to avoid resource leaks. Use try/finally patterns or connection pooling
- **Schema Validation**: The `available-databases` context handler provides database names to agents. Tools validate database existence before execution
- **Tool Usage**: Prefer using tools (`database_executeSql` and `database_showSchema`) for agent interactions. They include built-in safety checks and context handling
- **Required Context Handlers**: The `available-databases` context handler is required by both tools. It is automatically registered when the plugin is installed with a database configuration and the ChatService is available
- **Case-Sensitive SELECT Check**: The write protection check is case-sensitive. Only queries starting with uppercase "SELECT" bypass the approval requirement
- **Provider Abstraction**: Implement custom providers for specific database systems (PostgreSQL, MySQL, SQLite, etc.) to maintain the abstraction layer
- **Manual Provider Registration**: The plugin does not automatically instantiate providers from configuration. After installing the plugin, manually create and register provider instances:

  ```typescript
  app.install(databasePlugin, { database: {} });
  app.waitForService(DatabaseService, dbService => {
    const provider = new MyCustomProvider(config);
    dbService.registerDatabase('mydb', provider);
  });
  ```
- **Service Availability**: The `DatabaseService` is available immediately after plugin installation. Tools and context handlers are registered after `ChatService` is available
- **Tool Execution Flow**: Tools retrieve the database from `DatabaseService`, perform safety checks (approval for writes), then execute the operation and return JSON results

## Testing

The package uses vitest for unit testing.

**Run Tests:**

```bash
bun test
```

**Run Tests in Watch Mode:**

```bash
bun test:watch
```

**Generate Coverage:**

```bash
bun test:coverage
```

**Test Setup Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DatabaseService from '../DatabaseService';
import DatabaseProvider from '../DatabaseProvider';

// Mock provider
class MockProvider extends DatabaseProvider {
  constructor() {
    super(false);
  }

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
    mockProvider = new MockProvider();
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
    dbService.registerDatabase('db1', new MockProvider());
    dbService.registerDatabase('db2', new MockProvider());

    expect(dbService.getAvailableDatabases()).toEqual(['db1', 'db2']);
  });
});
```

**Testing Tools:**

When testing tools, mock the `Agent` and `DatabaseService`:

```typescript
import { describe, it, expect } from 'vitest';
import executeSql from './tools/executeSql';
import DatabaseService from './DatabaseService';
import Agent from '@tokenring-ai/agent/Agent';

// Mock agent
const mockAgent = {
  requireServiceByType: () => mockDbService,
  askForApproval: async () => true, // Auto-approve for testing
} as unknown as Agent;

// Mock database service
const mockDbService = {
  getDatabaseByName: () => ({
    executeSql: async (query: string) => ({ rows: [], fields: [] }),
  }),
} as unknown as DatabaseService;

describe('executeSql tool', () => {
  it('executes SELECT queries without approval', async () => {
    const result = await executeSql(
      { databaseName: 'test', sqlQuery: 'SELECT * FROM users' },
      mockAgent
    );
    expect(result.type).toBe('json');
  });

  it('requests approval for non-SELECT queries', async () => {
    // Setup mock to return false for approval
    (mockAgent.askForApproval as any) = async () => false;

    await expect(
      executeSql(
        { databaseName: 'test', sqlQuery: 'DELETE FROM users' },
        mockAgent
      )
    ).rejects.toThrow('User did not approve');
  });
});
```

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

## Related Components

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/chat`: Chat service and context handling
- `@tokenring-ai/agent`: Agent-based orchestration
- `@tokenring-ai/utility`: Shared utility functions including KeyedRegistry
- `@tokenring-ai/drizzle-storage`: Drizzle ORM-based storage implementation
- `@tokenring-ai/sqlite-storage`: SQLite database storage implementation
- `@tokenring-ai/mysql`: MySQL database provider implementation

## License

MIT License - see LICENSE file for details.
```
