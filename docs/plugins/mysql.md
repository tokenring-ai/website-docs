# MySQL Plugin

## Overview

The `@tokenring-ai/mysql` package provides MySQL database integration for the TokenRing AI platform. It extends the base `DatabaseProvider` from `@tokenring-ai/database` to offer connection pooling, SQL query execution, and schema inspection capabilities specifically for MySQL databases.

The plugin follows a configuration-driven pattern where MySQL providers are automatically registered with the DatabaseService based on application configuration, enabling seamless database access within the TokenRing ecosystem.

## Key Features

- **Connection Pooling**: Efficient, reusable connections using mysql2 with automatic management and configurable connection limits
- **SQL Execution**: Asynchronous query execution with result handling for SELECT, INSERT, UPDATE, DELETE operations
- **Schema Inspection**: Retrieve table schemas via SHOW TABLES and SHOW CREATE TABLE commands
- **Read/Write Control**: Optional write permission enforcement to prevent unauthorized modifications via `allowWrites` flag
- **Plugin Integration**: Automatically registers configured MySQL providers during application startup
- **Type-Safe Configuration**: Zod-based schema validation using `DatabaseConfigSchema` from `@tokenring-ai/database`
- **Connection Management**: Automatic connection release after query execution using try/finally blocks
- **Error Handling**: Comprehensive error propagation from mysql2 driver with proper connection cleanup

## Core Components

### MySQLProvider Class

Extends `DatabaseProvider` to manage MySQL connections and queries using mysql2's connection pool.

**Interface: MySQLResourceProps**

```typescript
interface MySQLResourceProps extends DatabaseProviderOptions {
  host: string;
  port?: number;
  user: string;
  password: string;
  databaseName: string;
  connectionLimit?: number;
}
```

**Constructor:**

```typescript
constructor({
  allowWrites = false,        // default: false
  host: string,               // required
  port = 3306,                // default: 3306
  user: string,               // required
  password: string,           // required
  databaseName: string,       // required
  connectionLimit = 10        // default: 10
})
```

**Key Methods:**

#### executeSql

```typescript
async executeSql(sqlQuery: string): Promise<ExecuteSqlResult>
```

Executes a raw SQL query using a connection from the pool.

**Parameters:**
- `sqlQuery` (string): The SQL query to execute

**Returns:** `ExecuteSqlResult` object containing:
- `rows`: Array of row objects (`RowDataPacket[]`) - Each row is a record with column names as keys
- `fields`: Array of field names (`string[]`) - Column names from the query result

**Implementation Details:**
- Acquires a connection from the pool
- Executes the query using `connection.execute()`
- Automatically releases the connection in a `finally` block
- Returns rows and field names from the result

**Example:**

```typescript
const result = await mysqlProvider.executeSql("SELECT * FROM users WHERE id = 1");
console.log(result.rows); // [{ id: 1, name: "John", email: "john@example.com" }]
console.log(result.fields); // ["id", "name", "email"]
```

**Error Handling:**
- Throws errors for invalid SQL syntax
- Throws errors for connection failures
- Throws errors when write operations are attempted with `allowWrites: false`
- Connection is always released even if an error occurs

#### showSchema

```typescript
async showSchema(): Promise<Record<string, string>>
```

Retrieves the CREATE TABLE statements for all tables in the database.

**Returns:** Object mapping table names to their CREATE TABLE SQL strings.

**Implementation Details:**
- Executes `SHOW TABLES` to get all table names
- For each table, executes `SHOW CREATE TABLE \`$\{tableName\}\``
- Returns a record mapping table names to their CREATE TABLE statements
- If a table's CREATE statement cannot be retrieved, returns "Could not retrieve CREATE TABLE statement."
- Connection is always released in a `finally` block

**Example:**

```typescript
const schema = await mysqlProvider.showSchema();
console.log(schema.users);
// "CREATE TABLE `users` (
//   `id` int(11) NOT NULL AUTO_INCREMENT,
//   `name` varchar(255) NOT NULL,
//   `email` varchar(255) NOT NULL,
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
```

### Plugin Registration

The plugin automatically registers MySQL providers with the DatabaseService based on configuration:

```typescript
// In your application configuration (database section)
{
  "database": {
    "providers": {
      "mysql-primary": {
        "type": "mysql",
        "host": "localhost",
        "port": 3306,
        "user": "admin",
        "password": "secure-password",
        "databaseName": "my_database",
        "connectionLimit": 10,
        "allowWrites": true
      }
    }
  }
}
```

## Services

### MySQLProvider Registration

The MySQL plugin registers MySQL providers with the `DatabaseService` when configured:

```typescript
// After plugin installation
const databaseService = app.services.find(s => s.name === "DatabaseService");
const mysqlProvider = databaseService.getDatabaseByName("mysql-primary");
```

### DatabaseService Integration

The plugin uses the `DatabaseService` from `@tokenring-ai/database` to register MySQL providers:

```typescript
import DatabaseService from "@tokenring-ai/database/DatabaseService";

// The plugin waits for DatabaseService to be available
app.waitForService(DatabaseService, databaseService => {
  for (const name in config.database!.providers) {
    const provider = config.database!.providers[name];
    if (provider.type === "mysql") {
      databaseService.registerDatabase(name, new MySQLProvider(provider));
    }
  }
});
```

**Plugin Installation Flow:**
1. Plugin receives configuration with `database.providers` object
2. Iterates through all configured providers
3. For each provider with `type === "mysql"`, creates a new `MySQLProvider` instance
4. Registers the provider with `DatabaseService` using `registerDatabase(name, provider)`
5. Uses `app.waitForService` to ensure `DatabaseService` is available before registration

## Providers

### MySQLProvider

The `MySQLProvider` class extends `DatabaseProvider` from `@tokenring-ai/database` and implements the required methods for MySQL-specific functionality.

**Provider Interface:**

```typescript
interface MySQLResourceProps extends DatabaseProviderOptions {
  host: string;
  port?: number;
  user: string;
  password: string;
  databaseName: string;
  connectionLimit?: number;
}
```

**Provider Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `host` | string | Yes | - | MySQL server hostname or IP address |
| `port` | number | No | `3306` | MySQL port number |
| `user` | string | Yes | - | Database username |
| `password` | string | Yes | - | Database password |
| `databaseName` | string | Yes | - | Name of the target database |
| `connectionLimit` | number | No | `10` | Maximum number of pooled connections |
| `allowWrites` | boolean | No | `false` | Whether to allow write operations |

### Provider Registration

MySQL providers can be registered either through plugin configuration or directly:

**Plugin-based registration:**

```typescript
const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        mysqlPrimary: {
          type: "mysql",
          host: "localhost",
          port: 3306,
          user: "root",
          password: "password",
          databaseName: "myapp",
          connectionLimit: 10,
          allowWrites: false
        }
      }
    }
  }
});

app.use(databasePlugin);
app.use(mysqlPlugin);
await app.start();
```

**Direct instantiation:**

```typescript
import MySQLProvider from "@tokenring-ai/mysql";
import DatabaseService from "@tokenring-ai/database/DatabaseService";

const mysqlProvider = new MySQLProvider({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  databaseName: "myapp",
  connectionLimit: 10,
  allowWrites: true
});

// Register with DatabaseService manually if needed
const databaseService = app.getServiceByType(DatabaseService);
databaseService.registerDatabase("mysqlPrimary", mysqlProvider);
```

## Plugin Configuration

### Configuration Schema

The plugin uses the `DatabaseConfigSchema` from `@tokenring-ai/database` for configuration validation:

```typescript
import { z } from "zod";
import { DatabaseConfigSchema } from "@tokenring-ai/database";

const packageConfigSchema = z.object({
  database: DatabaseConfigSchema
});
```

### Example Configuration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";
import mysqlPlugin from "@tokenring-ai/mysql";

const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        mysqlPrimary: {
          type: "mysql",
          host: "localhost",
          port: 3306,
          user: "admin",
          password: "secure-password",
          databaseName: "myapp",
          connectionLimit: 10,
          allowWrites: false
        }
      }
    }
  }
});

app.use(databasePlugin);
app.use(mysqlPlugin);
await app.start();
```

### Pool Configuration (Internal)

The connection pool uses these internal settings:
- `waitForConnections: true` - Wait for available connections if pool is exhausted
- `queueLimit: 0` - Unlimited queue size
- `connectionLimit` - Configurable maximum connections (default: 10)

### Environment Variables (Recommended)

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=admin
export MYSQL_PASSWORD=secure-password
export MYSQL_DATABASE=myapp
export MYSQL_CONNECTION_LIMIT=10
```

## Agent Configuration

This package does not have any services with an `attach(agent: Agent)` method that merges in an agent config schema.

## Tools

The `@tokenring-ai/mysql` package itself doesn't define tools directly, but it works with the database tools provided by `@tokenring-ai/database`:

- **database_executeSql**: Executes SQL queries on registered MySQL databases
- **database_showSchema**: Retrieves database schemas for registered MySQL databases

These tools are automatically available when the plugin is registered with a TokenRing application and MySQL providers are configured.

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not have state slices or state management functionality.

## Chat Commands

This package does not define any chat commands.

## Error Handling

The package provides comprehensive error handling through the MySQL driver and connection pooling:

**Common Error Scenarios:**

| Error | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Network issues or incorrect host/port | Verify host, port, and network connectivity |
| Authentication failure | Invalid credentials | Verify username, password, and MySQL user privileges |
| Database access error | Insufficient permissions | Ensure the user has proper permissions for the database |
| SQL syntax error | Invalid SQL query | Validate your SQL queries before execution |
| Connection pool exhaustion | Too many concurrent connections | Increase `connectionLimit` in configuration |
| Write operation blocked | `allowWrites` is `false` | Set `allowWrites: true` if write operations are needed |

**Error Propagation:**
- Errors from `mysql2` are propagated directly to the caller
- Connection errors are thrown immediately if the pool cannot establish connections
- Query errors include the SQL statement and MySQL error details
- Connections are always released even when errors occur (using try/finally blocks)

**Error Handling Example:**

```typescript
try {
  const result = await mysqlProvider.executeSql("SELECT * FROM users");
  console.log("Users:", result.rows);
} catch (error) {
  console.error("Database query failed:", error);
  // Handle connection errors, SQL errors, etc.
}
```

## Security Considerations

- Use environment variables for sensitive credentials
- Configure `allowWrites` carefully to prevent unauthorized modifications
- Consider using read-only users for agents that only need to query data
- Validate and sanitize all SQL input to prevent injection attacks
- Limit database access to necessary tables and operations based on agent requirements
- Never commit credentials to version control
- Use SSL/TLS connections for production environments when possible
- Implement connection pool monitoring and alerting
- Regularly rotate database credentials

## Best Practices

### Connection Pool Management

- Set appropriate `connectionLimit` based on your application's concurrency needs
- Monitor connection pool usage in production
- Increase `connectionLimit` if you experience connection exhaustion errors
- Use read-only connections (`allowWrites: false`) for queries that don't modify data

### Query Execution

- Always use parameterized queries to prevent SQL injection
- Keep queries simple and focused
- Use transactions for operations that require atomicity
- Handle errors gracefully with try/catch blocks

### Schema Inspection

- Use `showSchema()` for debugging and development
- Cache schema information in production to reduce database load
- Be aware that `showSchema()` retrieves all tables, which may be slow for large databases

### Configuration

- Use environment variables for sensitive data
- Separate configuration for development, staging, and production
- Document all configuration options in your deployment documentation
- Validate configuration before starting the application

### Error Handling

- Implement comprehensive error handling for all database operations
- Log errors with sufficient context for debugging
- Implement retry logic for transient connection errors
- Use circuit breakers for production systems

### Performance

- Use connection pooling effectively
- Avoid long-running queries that hold connections
- Index frequently queried columns
- Monitor query performance and optimize slow queries

## Usage Examples

### Basic Plugin Integration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import databasePlugin from "@tokenring-ai/database";
import mysqlPlugin from "@tokenring-ai/mysql";

const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        mysqlPrimary: {
          type: "mysql",
          host: "localhost",
          port: 3306,
          user: "root",
          password: "password",
          databaseName: "myapp",
          connectionLimit: 10,
          allowWrites: false
        }
      }
    }
  }
});

app.use(databasePlugin);
app.use(mysqlPlugin);
await app.start();

// Database service and tools are now available
// MySQL providers are registered with DatabaseService
```

### Direct MySQLProvider Usage

```typescript
import MySQLProvider from "@tokenring-ai/mysql";

const mysqlProvider = new MySQLProvider({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  databaseName: "myapp",
  connectionLimit: 10,
  allowWrites: true
});

// Execute SQL query
const result = await mysqlProvider.executeSql("SELECT * FROM users");
console.log("Users:", result.rows);
console.log("Fields:", result.fields);

// Inspect database schema
const schema = await mysqlProvider.showSchema();
console.log("Table schemas:", schema);
```

### Integration with DatabaseService

Access MySQL providers through the DatabaseService:

```typescript
import { DatabaseService } from "@tokenring-ai/database";

// Get DatabaseService from app
const databaseService = app.getServiceByType(DatabaseService);

// Get registered MySQL provider
const mysqlProvider = databaseService.getDatabaseByName("mysqlPrimary");

// Execute queries
const result = await mysqlProvider.executeSql("SELECT * FROM users");
```

### Multiple MySQL Providers

Configure multiple MySQL providers for different environments:

```typescript
const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        production: {
          type: "mysql",
          host: "prod-db.example.com",
          port: 3306,
          user: "prod_user",
          password: process.env.MYSQL_PROD_PASSWORD,
          databaseName: "production_db",
          connectionLimit: 20,
          allowWrites: true
        },
        staging: {
          type: "mysql",
          host: "staging-db.example.com",
          port: 3306,
          user: "staging_user",
          password: process.env.MYSQL_STAGING_PASSWORD,
          databaseName: "staging_db",
          connectionLimit: 10,
          allowWrites: false
        }
      }
    }
  }
});

app.use(databasePlugin);
app.use(mysqlPlugin);
await app.start();

// Access different databases
const databaseService = app.getServiceByType(DatabaseService);
const productionDB = databaseService.getDatabaseByName("production");
const stagingDB = databaseService.getDatabaseByName("staging");
```

### Error Handling Example

```typescript
import MySQLProvider from "@tokenring-ai/mysql";

const mysqlProvider = new MySQLProvider({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  databaseName: "myapp",
  connectionLimit: 10,
  allowWrites: true
});

try {
  const result = await mysqlProvider.executeSql("SELECT * FROM users");
  console.log("Query succeeded:", result.rows);
} catch (error) {
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error("Authentication failed: Check credentials");
  } else if (error.code === 'ECONNREFUSED') {
    console.error("Connection refused: Check if MySQL is running");
  } else {
    console.error("Query failed:", error.message);
  }
}
```

### Schema Inspection Example

```typescript
import MySQLProvider from "@tokenring-ai/mysql";

const mysqlProvider = new MySQLProvider({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  databaseName: "myapp",
  connectionLimit: 10,
  allowWrites: false
});

// Get all table schemas
const schema = await mysqlProvider.showSchema();

// Log each table's schema
for (const [tableName, createStatement] of\ Object.entries(schema)) {
  console.log(`\n=== Table: $\{tableName\} ===`);
  console.log(createStatement);
}
```

## Types and Interfaces

### MySQLResourceProps Interface

```typescript
interface MySQLResourceProps extends DatabaseProviderOptions {
  host: string;
  port?: number;
  user: string;
  password: string;
  databaseName: string;
  connectionLimit?: number;
}
```

### ExecuteSqlResult Interface

```typescript
interface ExecuteSqlResult {
  rows: RowDataPacket[];
  fields: string[];
}
```

## Testing and Development

### Running Tests

```bash
bun run test
```

### Test Coverage

```bash
bun run test:coverage
```

### Building

```bash
bun run build
```

Runs TypeScript type checking with `tsc --noEmit`.

### Watch Mode

```bash
bun run test:watch
```

### Package Structure

```
pkg/mysql/
├── MySQLProvider.ts       # Core MySQL provider implementation
├── index.ts               # Main entry point and exports
├── plugin.ts              # TokenRing plugin registration
├── package.json           # Package metadata and dependencies
├── vitest.config.ts       # Vitest test configuration
├── README.md              # Package documentation
└── LICENSE                # MIT license
```

### Dependencies

#### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | `0.2.0` | Base application framework and plugin system |
| `@tokenring-ai/database` | `0.2.0` | Abstract database provider and service |
| `mysql2` | `^3.18.2` | MySQL driver with promise support |
| `zod` | `^4.3.6` | Schema validation library |

#### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | `^4.0.18` | Test framework |
| `typescript` | `^5.9.3` | TypeScript compiler |

## Related Components

- `@tokenring-ai/database` - Base database abstraction and DatabaseService
- `@tokenring-ai/app` - Application framework for plugin integration
- `@tokenring-ai/utility` - KeyedRegistry and other utility functions
- `@tokenring-ai/drizzle-storage` - Multi-database storage with Drizzle ORM

## License

MIT License

Copyright (c) 2025 Mark Dierolf
