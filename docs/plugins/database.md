# @tokenring-ai/database

## User Guide

The `@tokenring-ai/database` package provides an abstract SQL interface for
schema inspection and query execution across providers. It enables the
registration and interaction with multiple database connections through a
unified `DatabaseService` that integrates with the TokenRing plugin system and
agent framework.

The package focuses on abstraction, requiring implementers to extend
`DatabaseProvider` for specific database types. It supports tool-based
interaction with agents, context handlers for database availability injection,
and write operation protection through human confirmation for non-SELECT
queries.

### Key Features

- Abstract database provider interface for multiple database systems
- Unified service management through `DatabaseService` with KeyedRegistry
  pattern
- Tool-based interaction with agents via ChatService
- Context handlers for database availability injection
- Write protection with human confirmation for non-SELECT queries
- Schema inspection capabilities
- Type-safe tool execution with Zod schemas
- Required context handlers enforcement (`available-databases`)

### Installation

```bash
bun add @tokenring-ai/database
```

### Chat Commands

This package does not define chat commands. Interaction is performed through
tools.

### Tools

| Tool Name             | Display Name        | Description                                  |
|-----------------------|---------------------|----------------------------------------------|
| `database_executeSql` | Database/executeSql | Execute arbitrary SQL queries on a database  |
| `database_showSchema` | Database/showSchema | Show CREATE TABLE statements for all tables  |

#### database_executeSql

Executes an arbitrary SQL query on a database. WARNING: Use with extreme
caution as this can modify or delete data.

**Input Schema:**

```typescript
z.object({
  databaseName: z.string().exactOptional()
    .describe("Optional: The name of the database to target. May also be specified in the SQL query."),
  sqlQuery: z.string().describe("The SQL query to execute.")
})
```

**Required Context Handlers:** `["available-databases"]`

**Behavior:**

1. Retrieves the target database from the `DatabaseService` using
   `databaseName` or an empty string `""` if not provided
2. If the database is not found, throws `ToolCallError`:
   `"Database ${databaseName} not found"`
3. If the query does not start with `"SELECT"` (case-sensitive), requests
   human approval via `agent.askForApproval()` with message:
   `"Execute SQL write operation on database '${databaseName}'?\n\nQuery: ${sqlQuery}"`
4. If approval is denied, throws `ToolCallError`:
   `"User did not approve the SQL query that was provided."`
5. Executes the SQL query and returns the result as a JSON string via
   `JSON.stringify(result)`

**Example Response:**

```json
{
  "rows": [
    {"id": 1, "name": "Alice", "active": true},
    {"id": 2, "name": "Bob", "active": false}
  ],
  "fields": ["id", "name", "active"]
}
```

**Note:** The SELECT check is case-sensitive. Only queries starting with
uppercase `"SELECT"` bypass the approval requirement. Queries starting with
`"select"` (lowercase) will require approval.

#### database_showSchema

Shows the 'CREATE TABLE' statements (or equivalent) for all tables in the
specified database.

**Input Schema:**

```typescript
z.object({
  databaseName: z.string()
    .describe("The name of the database for which to show the schema.")
})
```

**Required Context Handlers:** `["available-databases"]`

**Behavior:**

1. Retrieves the target database from the `DatabaseService`
2. If the database is not found, throws `ToolCallError`:
   `"Database ${databaseName} not found"`
3. Calls `showSchema()` on the database provider and returns the schema as a
   JSON string via `JSON.stringify(schema)`

**Example Response:**

```json
{
  "users": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)",
  "posts": "CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)"
}
```

### Configuration

#### Plugin Configuration

The plugin configuration uses a Zod schema for validation:

```typescript
const packageConfigSchema = z.object({
  database: DatabaseConfigSchema.exactOptional(),
});

export const DatabaseConfigSchema = z.object({}).exactOptional();
```

**Schema Definition:**

| Schema | Purpose | Description |
|--------|---------|-------------|
| `DatabaseConfigSchema` | Plugin configuration | Empty schema that signals plugin activation when present |
| `packageConfigSchema` | Package-level config | Wraps `DatabaseConfigSchema` under the `database` key |

**Configuration Example:**

```yaml
database: {}
```

**Note:** The `DatabaseConfigSchema` is exported from
`@tokenring-ai/database` and can be imported for type-safe configuration.

The plugin accepts a configuration object with a `database` property, which is
used to signal that the plugin should be activated. The actual database
provider instantiation and registration must be done manually by the
implementer.

**Important:** The plugin does not automatically instantiate database providers
from configuration. The configuration object serves two purposes:

1. It signals that the plugin should be activated
2. It triggers the registration of the `DatabaseService`

Implementers must manually create and register database provider instances with
the service after installation.

#### Environment Variables

This package does not define environment variables. Configuration is done
through the plugin configuration and manual provider registration.

### Integration

The plugin is installed using the application's install method:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";
import { DatabaseService } from "@tokenring-ai/database";

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
  dbService.registerDatabase("production", postgresProvider);
});
```

### Best Practices

- **Singleton Pattern**: Always handle database connections in a singleton
  pattern to prevent multiple connections to the same database

- **Parameterized Queries**: Use parameterized queries to prevent SQL injection
  attacks

- **Write Protection**: Use the `allowWrites` flag to restrict write
  operations. Non-SELECT queries automatically require human confirmation via
  `agent.askForApproval()`

- **Error Handling**: Ensure proper error handling when executing database
  operations. Tools use `ToolCallError` from
  `@tokenring-ai/chat/util/tokenRingTool` for descriptive error messages

- **Connection Management**: Always release database connections to avoid
  resource leaks. Use try/finally patterns or connection pooling

- **Schema Validation**: The `available-databases` context handler provides
  database names to agents. Tools validate database existence before execution

- **Tool Usage**: Prefer using tools (`database_executeSql` and
  `database_showSchema`) for agent interactions. They include built-in safety
  checks and context handling

- **Required Context Handlers**: The `available-databases` context handler is
  required by both tools. It is automatically registered when the plugin is
  installed with a database configuration and the ChatService is available

- **Case-Sensitive SELECT Check**: The write protection check is
  case-sensitive. Only queries starting with uppercase `"SELECT"` bypass the
  approval requirement

- **Provider Abstraction**: Implement custom providers for specific database
  systems (PostgreSQL, MySQL, SQLite, etc.) to maintain the abstraction layer

- **Manual Provider Registration**: The plugin does not automatically
  instantiate providers from configuration. After installing the plugin,
  manually create and register provider instances:

  ```typescript
  app.install(databasePlugin, { database: {} });
  app.waitForService(DatabaseService, dbService => {
    const provider = new MyCustomProvider(config);
    dbService.registerDatabase("mydb", provider);
  });
  ```

- **Service Availability**: The `DatabaseService` is available immediately
  after plugin installation. Tools and context handlers are registered after
  `ChatService` is available

- **Tool Execution Flow**: Tools retrieve the database from `DatabaseService`,
  perform safety checks (approval for writes), then execute the operation and
  return results as JSON strings via `JSON.stringify()`

---

## Developer Reference

### Core Components

#### DatabaseService

The main service class that implements `TokenRingService` interface. It manages
a registry of `DatabaseProvider` instances using the `KeyedRegistry` from
`@tokenring-ai/utility`.

**Service Properties:**

| Property      | Type                              | Description            |
|---------------|-----------------------------------|------------------------|
| `name`        | `string`                          | Service identifier     |
| `description` | `string`                          | Service description    |
| `databases`   | `KeyedRegistry<DatabaseProvider>` | Database provider registry |

**Resource Management Methods:**

```typescript
registerDatabase = this.databases.set
getDatabaseByName = this.databases.get
getAvailableDatabases = this.databases.keysArray
```

These methods are exposed as arrow functions that delegate to the underlying
`KeyedRegistry` instance.

**Service Definition:**

```typescript
import type { TokenRingService } from "@tokenring-ai/app/types";
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";
import type DatabaseProvider from "./DatabaseProvider.ts";

export default class DatabaseService implements TokenRingService {
  readonly name = "DatabaseService";
  description = "Database service";
  databases = new KeyedRegistry<DatabaseProvider>();

  registerDatabase = this.databases.set;
  getDatabaseByName = this.databases.get;
  getAvailableDatabases = this.databases.keysArray;
}
```

#### DatabaseProvider

Abstract base class for concrete database implementations. All database
provider implementations must extend this class and implement the required
methods.

**Constructor:**

```typescript
constructor(private allowWrites: boolean = false)
```

**Properties:**

- `allowWrites: boolean` (private) - Whether write operations are allowed
  (defaults to false)

**DatabaseProviderOptions Interface:**

```typescript
export interface DatabaseProviderOptions {
  allowWrites?: boolean | undefined;
}
```

**Note:** The `DatabaseProviderOptions` interface is exported for use by
concrete provider implementations. The `DatabaseProvider` constructor itself
accepts a boolean `allowWrites` parameter directly.

**ExecuteSqlResult Interface:**

```typescript
export interface ExecuteSqlResult {
  rows: Record<string, string | number | null>[];
  fields: string[];
}
```

**Abstract Methods (must be implemented):**

```typescript
async executeSql(_sqlQuery: string): Promise<ExecuteSqlResult>

async showSchema(): Promise<Record<string, string>>
```

**Note:** The `DatabaseProvider` class provides default implementations that
throw errors. Concrete implementations must override both methods.

**Base Class Definition:**

```typescript
export interface DatabaseProviderOptions {
  allowWrites?: boolean | undefined;
}

export interface ExecuteSqlResult {
  rows: Record<string, string | number | null>[];
  fields: string[];
}

export default class DatabaseProvider {
  constructor(private allowWrites: boolean = false) {}

  /**
   * Executes an SQL query.
   */
  executeSql(_sqlQuery: string): Promise<ExecuteSqlResult> {
    throw new Error("Method 'executeSql()' must be implemented.");
  }

  /**
   * Shows the schema for all tables in the database.
   */
  showSchema(): Promise<Record<string, string>> {
    throw new Error("Method 'showSchema()' must be implemented.");
  }
}
```

### Services

The `DatabaseService` implements the `TokenRingService` interface and provides
a centralized registry for database providers.

**Service Name:** `DatabaseService`

**Service Description:** `Database service`

**Registration Flow:**

The service is registered when the plugin is installed with a database
configuration. The plugin metadata is dynamically read from `package.json`:

```typescript
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import contextHandlers from "./contextHandlers.ts";
import DatabaseService from "./DatabaseService.ts";
import { DatabaseConfigSchema } from "./index.ts";
import packageJSON from "./package.json" with { type: "json" };
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  database: DatabaseConfigSchema.exactOptional(),
});

export default {
  name: packageJSON.name,
  displayName: "Database Layer",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.database) {
      app.waitForService(ChatService, chatService => {
        chatService.addTools(...tools);
        chatService.registerContextHandlers(contextHandlers);
      });
      app.addServices(new DatabaseService());
    }
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

**Important Notes:**

- The plugin metadata (`name`, `version`, `description`) is dynamically read
  from `package.json`
- The `DatabaseService` is registered when the plugin is installed with a
  `database` configuration
- The `DatabaseService` is added to the app immediately during plugin
  installation
- Tools and context handlers are registered asynchronously after the
  `ChatService` is available via `waitForService`
- The plugin does not instantiate database providers - this must be done
  manually by the implementer
- Providers must be registered with the `DatabaseService` after the plugin is
  installed

### Provider Documentation

#### Implementing a Concrete DatabaseProvider

All database provider implementations must extend `DatabaseProvider` and
implement the required methods:

```typescript
import DatabaseProvider from "@tokenring-ai/database";

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

**Required Methods:**

1. `executeSql(sqlQuery: string): Promise<ExecuteSqlResult>` - Executes an SQL
   query
2. `showSchema(): Promise<Record<string, string>>` - Returns schema definitions

**Optional Configuration:**

- Pass `allowWrites: true` to the constructor to enable write operations
- Default behavior (`allowWrites: false`) restricts write operations

#### Context Handlers Implementation

The `available-databases` context handler is implemented as a generator
function:

```typescript
import type { ContextHandlerOptions, ContextItem }
  from "@tokenring-ai/chat/schema";
import DatabaseService from "../DatabaseService.ts";

export default function* getContextItems(
  { agent }: ContextHandlerOptions
): Generator<ContextItem> {
  const databaseService = agent.requireServiceByType(DatabaseService);
  const available = databaseService.getAvailableDatabases();
  if (available.length === 0) return;

  yield {
    role: "user",
    content:
      "/* These are the databases available for the database tool */:\n"
      + available.map(name => `- ${name}`).join("\n"),
  };
}
```

Context handlers are exported as a record from `contextHandlers.ts`:

```typescript
import type { ContextHandler } from "@tokenring-ai/chat/schema";
import availableDatabases from "./contextHandlers/availableDatabases.ts";

export default {
  "available-databases": availableDatabases,
} as Record<string, ContextHandler>;
```

#### Tools Implementation

Tools are defined as objects satisfying `TokenRingToolDefinition` and exported
as an array from `tools.ts`:

```typescript
import executeSql from "./tools/executeSql.ts";
import showSchema from "./tools/showSchema.ts";

export default [executeSql, showSchema];
```

Each tool uses `ToolCallError` from `@tokenring-ai/chat/util/tokenRingTool` for
error handling:

```typescript
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";

// Example error usage
throw new ToolCallError(name, `Database ${databaseName} not found`);
```

### RPC Endpoints

This package does not define RPC endpoints. Database operations are performed
through the agent tool system.

### State Management

This package does not define state slices. Database providers manage their own
connection state. The `DatabaseService` maintains an in-memory registry of
database providers using the `KeyedRegistry` pattern from
`@tokenring-ai/utility`.

**State Characteristics:**

- **Service State**: The `DatabaseService` maintains a `KeyedRegistry` of
  `DatabaseProvider` instances
- **Provider State**: Each `DatabaseProvider` implementation manages its own
  connection state (connection pools, transactions, etc.)
- **No Persistent State**: The package does not define any persistent state
  slices for the application
- **Transient State**: Database connections are typically managed as singleton
  instances with their own internal connection pooling

**Recommended State Management Patterns:**

```typescript
import DatabaseService from "@tokenring-ai/database/DatabaseService";
import PostgresProvider from "./PostgresProvider";

// Create service instance (singleton pattern)
const dbService = new DatabaseService();

// Register database providers with connection configuration
const postgresProvider = new PostgresProvider(
  process.env.PROD_DB_URL,
  true  // allowWrites
);
dbService.registerDatabase("production", postgresProvider);

// Connection state is managed internally by the provider
// Service maintains only the registry of providers
```

### Usage Examples

#### 1. Using Direct Service API

```typescript
import DatabaseService from "@tokenring-ai/database/DatabaseService";
import PostgresProvider from "./PostgresProvider";

// Create the service
const dbService = new DatabaseService();

// Register a database provider
const postgresDb = new PostgresProvider(
  process.env.DB_URL,
  true  // allowWrites
);

dbService.registerDatabase("myPostgres", postgresDb);

// List available databases
const available = dbService.getAvailableDatabases();
console.log("Available databases:", available);
// Output: ['myPostgres']

// Get specific database
const postgresResource = dbService.getDatabaseByName("myPostgres");
if (postgresResource) {
  const schema = await postgresResource.showSchema();
  console.log("Schema:", schema);
}
```

#### 2. Using Tools in Agents

```typescript
import { Agent } from "@tokenring-ai/agent";
import { DatabaseService } from "@tokenring-ai/database";

const agent = new Agent();

// Services are available through agent dependency injection
const databaseService = agent.requireServiceByType(DatabaseService);

// List available databases
const available = databaseService.getAvailableDatabases();
console.log("Available databases:", available);

// Show schema
const schema = await agent.callTool("database_showSchema", {
  databaseName: "myPostgres"
});

// Execute SELECT query
const result = await agent.callTool("database_executeSql", {
  databaseName: "myPostgres",
  sqlQuery: "SELECT * FROM users WHERE active = true"
});

console.log("Query results:", result);
```

#### 3. Error Handling

```typescript
try {
  const result = await agent.callTool("database_executeSql", {
    databaseName: "myPostgres",
    sqlQuery: "DELETE FROM users WHERE id = 1"
  });
} catch (error) {
  if (error.message.includes("User did not approve")) {
    console.log("Query was not approved by user");
  } else if (error.message.includes("not found")) {
    console.log("Database not found");
  } else {
    console.log("Query execution failed:", error);
  }
}
```

### Testing

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
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import DatabaseService from "./DatabaseService";
import DatabaseProvider from "./DatabaseProvider";

// Mock provider for testing
class MockProvider extends DatabaseProvider {
  async executeSql(sqlQuery: string) {
    return { rows: [], fields: [] };
  }

  async showSchema() {
    return { "mock_table": "CREATE TABLE mock_table (...)" };
  }
}

describe("DatabaseService", () => {
  let dbService: DatabaseService;
  let mockProvider: MockProvider;

  beforeEach(() => {
    dbService = new DatabaseService();
    mockProvider = new MockProvider(false);
  });

  afterEach(() => {
    dbService.databases.clear();
  });

  it("registers and retrieves databases", () => {
    dbService.registerDatabase("test-db", mockProvider);

    expect(dbService.getDatabaseByName("test-db")).toBe(mockProvider);
    expect(dbService.getAvailableDatabases()).toEqual(["test-db"]);
  });

  it("returns undefined for non-existent database", () => {
    expect(dbService.getDatabaseByName("non-existent")).toBeUndefined();
    expect(dbService.getAvailableDatabases()).toEqual([]);
  });
});
```

**Testing Tools:**

When testing tools, mock the `Agent` and `DatabaseService`:

```typescript
import { describe, it, expect } from "vitest";
import executeSql from "./tools/executeSql";
import DatabaseService from "./DatabaseService";
import Agent from "@tokenring-ai/agent/Agent";

const mockAgent = {
  requireServiceByType: () => mockDbService,
  askForApproval: async () => true,
} as unknown as Agent;

const mockDbService = {
  getDatabaseByName: () => ({
    executeSql: async (query: string) => ({ rows: [], fields: [] }),
  }),
} as unknown as DatabaseService;

describe("executeSql tool", () => {
  it("executes SELECT queries without approval", async () => {
    const result = await executeSql.execute(
      { databaseName: "test", sqlQuery: "SELECT * FROM users" },
      mockAgent
    );
    expect(result).toBeDefined();
  });

  it("requests approval for non-SELECT queries", async () => {
    (mockAgent.askForApproval as any) = async () => false;

    await expect(
      executeSql.execute(
        { databaseName: "test", sqlQuery: "DELETE FROM users" },
        mockAgent
      )
    ).rejects.toThrow("User did not approve");
  });
});
```

### Dependencies

#### Production Dependencies

| Package                 | Version   | Description                                |
|-------------------------|-----------|--------------------------------------------|
| `@tokenring-ai/app`     | workspace | Base application framework and plugin system |
| `@tokenring-ai/chat`    | workspace | Chat service for tool registration         |
| `@tokenring-ai/agent`   | workspace | Agent framework for tool execution         |
| `@tokenring-ai/utility` | workspace | Shared utilities including KeyedRegistry   |
| `zod`                   | ^4.4.3    | Runtime type validation                    |

#### Development Dependencies

| Package        | Version | Description              |
|----------------|---------|--------------------------|
| `vitest`       | ^4.1.1  | Unit testing framework   |
| `typescript`   | ^6.0.2  | TypeScript compiler      |

### Related Components

#### Core Dependencies

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/chat`: Chat service and context handling
- `@tokenring-ai/agent`: Agent-based orchestration
- `@tokenring-ai/utility`: Shared utility functions including KeyedRegistry

#### Related Database Packages

Concrete database provider implementations that extend `DatabaseProvider`:

- `@tokenring-ai/mysql`: MySQL database provider

Note: These packages implement the `DatabaseProvider` interface to provide
concrete database functionality while leveraging the abstract service layer
provided by this package.

### Package Exports

The package provides the following exports via its `package.json`:

```json
{
  "exports": {
    ".": "./index.ts",
    "./*": "./*.ts"
  }
}
```

**Main Export (`@tokenring-ai/database`):**

From `index.ts`:

- `DatabaseConfigSchema` - Zod schema for plugin configuration
- `DatabaseProvider` - Abstract base class for database providers
- `DatabaseService` - Main service class for managing database providers

**Direct Imports (available via `./*` pattern):**

| Import Path | Export | Description |
|-------------|--------|-------------|
| `@tokenring-ai/database/DatabaseService` | `DatabaseService` | Main service class for managing database providers |
| `@tokenring-ai/database/DatabaseProvider` | `DatabaseProvider` | Abstract base class for database providers |
| `@tokenring-ai/database/plugin` | default | Plugin definition |
| `@tokenring-ai/database/tools` | default array | Tool definitions (`executeSql`, `showSchema`) |
| `@tokenring-ai/database/contextHandlers` | default record | Context handler definitions |
| `@tokenring-ai/database/tools/executeSql` | `executeSql` | SQL execution tool |
| `@tokenring-ai/database/tools/showSchema` | `showSchema` | Schema inspection tool |
| `@tokenring-ai/database/contextHandlers/availableDatabases` | `availableDatabases` | Available databases context handler |

## License

MIT License - see LICENSE file for details.
