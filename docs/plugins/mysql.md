# MySQL Plugin

## Overview

The `@tokenring-ai/mysql` package provides MySQL database integration for the TokenRing AI platform. It extends the base `DatabaseProvider` from `@tokenring-ai/database` to offer connection pooling, SQL query execution, and schema inspection capabilities specifically for MySQL databases.

The plugin follows a configuration-driven pattern where MySQL providers are automatically registered with the DatabaseService based on application configuration, enabling seamless database access within the TokenRing ecosystem.

## Key Features

- **Connection Pooling**: Efficient, reusable connections using mysql2 with automatic management
- **SQL Execution**: Asynchronous query execution with result handling for SELECT, INSERT, UPDATE, DELETE operations
- **Schema Inspection**: Retrieve table schemas via SHOW TABLES and SHOW CREATE TABLE commands
- **Read/Write Control**: Optional write permission enforcement to prevent unauthorized modifications
- **Plugin Integration**: Automatically registers configured MySQL providers during application startup
- **Type-Safe Configuration**: Zod-based schema validation for configuration options

## Core Components

### MySQLProvider Class

Extends `DatabaseProvider` to manage MySQL connections and queries using mysql2's connection pool.

**Constructor:**

```typescript
new MySQLProvider({
  allowWrites?: boolean,        // default: false
  host: string,                 // required
  port?: number,                // default: 3306
  user: string,                 // required
  password: string,             // required
  databaseName: string,         // required
  connectionLimit?: number      // default: 10
})
```

**Key Methods:**

- `executeSql(sqlQuery: string): Promise<ExecuteSqlResult>`
  - Executes a raw SQL query using a connection from the pool
  - Returns: `{ rows: RowDataPacket[], fields: string[] }`
  - Supports all SQL operations based on allowWrites configuration
  - Auto-manages connection pooling and release
  - Handles result set metadata and field names

- `showSchema(): Promise<Record<string, string>>`
  - Retrieves CREATE TABLE statements for all tables in the database
  - Returns object mapping table names to CREATE TABLE SQL statements
  - Uses SHOW TABLES and SHOW CREATE TABLE queries for comprehensive schema inspection

### Plugin Registration

The plugin automatically registers MySQL providers with the DatabaseService based on configuration:

```typescript
// In your application configuration (database section)
{
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
```

## Plugin Configuration

### Configuration Schema

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

### Provider Configuration Options (MySQLResourceProps)

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `host` | string | Yes | - | MySQL server hostname or IP |
| `port` | number | No | 3306 | MySQL port number |
| `user` | string | Yes | - | Database username |
| `password` | string | Yes | - | Database password |
| `databaseName` | string | Yes | - | Target database name |
| `connectionLimit` | number | No | 10 | Maximum pooled connections |
| `allowWrites` | boolean | No | false | Enable write operations |

### Pool Configuration (Internal)

The connection pool uses these internal settings:
- `waitForConnections: true` - Wait for available connections
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

These tools are automatically available when the plugin is registered with a TokenRing application.

## Services

### MySQLProvider Registration

The MySQL plugin registers MySQL providers with the `DatabaseService` when configured:

```typescript
// After plugin installation
const databaseService = app.services.find(s => s.name === "DatabaseService");
const mysqlProvider = databaseService.getDatabaseByName("mymysql");
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

- `host`: MySQL server hostname or IP address (required)
- `port`: MySQL port number (default: `3306`)
- `user`: Database username (required)
- `password`: Database password (required)
- `databaseName`: Name of the target database (required)
- `connectionLimit`: Maximum number of pooled connections (default: `10`)
- `allowWrites`: Whether to allow write operations (default: `false`)

### Provider Registration

MySQL providers can be registered either through plugin configuration or directly:

**Plugin-based registration:**

```typescript
const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        mymysql: {
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
databaseService.registerDatabase("mymysql", mysqlProvider);
```

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not have state slices or state management functionality.

## Error Handling

The package provides comprehensive error handling:

- **Invalid Credentials**: Throws clear error messages for invalid MySQL credentials
- **Connection Failures**: Handles network issues with descriptive errors
- **SQL Errors**: Proper error handling for invalid SQL queries
- **Write Permissions**: Prevents write operations when `allowWrites` is false
- **Connection Pool Management**: Handles pool exhaustion and connection failures

Common error scenarios:

| Error | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Network issues or incorrect host/port | Verify host, port, and network connectivity |
| Authentication failure | Invalid credentials | Verify username, password, and MySQL user privileges |
| Database access error | Insufficient permissions | Ensure the user has proper permissions for the database |
| SQL syntax error | Invalid SQL query | Validate your SQL queries before execution |
| Connection pool exhaustion | Too many concurrent connections | Increase connectionLimit in configuration |
| Pool connection unavailable | Connection pool failure | Check MySQL server availability and pool configuration |

## Security Considerations

- Use environment variables for sensitive credentials
- Configure allowWrites carefully to prevent unauthorized modifications
- Consider using read-only users for agents that only need to query data
- Validate and sanitize all SQL input to prevent injection attacks
- Limit database access to necessary tables and operations based on agent requirements
- Use SSL connections for production environments when possible
- Implement connection pool monitoring and alerting
- Regularly rotate database credentials

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
        mymysql: {
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
const mysqlProvider = databaseService.getDatabaseByName("mymysql");

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
        mysqlPrimary: {
          type: "mysql",
          host: "prod-db.example.com",
          port: 3306,
          user: "app_user",
          password: process.env.MYSQL_PASSWORD,
          databaseName: "production_db",
          connectionLimit: 20,
          allowWrites: true
        },
        mysqlReplica: {
          type: "mysql",
          host: "replica-db.example.com",
          port: 3306,
          user: "read_only_user",
          password: process.env.MYSQL_READONLY_PASSWORD,
          databaseName: "production_db",
          connectionLimit: 10,
          allowWrites: false
        }
      }
    }
  }
});
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

### Watch Mode

```bash
bun run test:watch
```

## Package Structure

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

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` - Base application framework and plugin system
- `@tokenring-ai/database` - Abstract database provider and service
- `mysql2` - MySQL driver with promise support
- `zod` - Schema validation

### Development Dependencies

- `vitest` - Testing framework
- `typescript` - TypeScript compiler

## Related Components

- `@tokenring-ai/database` - Base database abstraction and DatabaseService
- `@tokenring-ai/app` - Application framework for plugin integration
- `@tokenring-ai/postgres` - PostgreSQL database provider (if available)
- `@tokenring-ai/scraperapi` - Web search provider integration

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
