# MySQL Plugin

## Overview

The `@tokenring-ai/mysql` package provides MySQL database integration for the TokenRing AI platform. It extends the base `DatabaseProvider` from `@tokenring-ai/database` to offer connection pooling, SQL query execution, and schema inspection capabilities specifically for MySQL databases. The plugin automatically registers MySQL providers with the DatabaseService based on configuration, enabling seamless database access within the TokenRing ecosystem.

### Key Features

- **Connection Pooling**: Efficient, reusable connections using mysql2 with automatic management
- **SQL Execution**: Asynchronous query execution with result handling for SELECT, INSERT, UPDATE, DELETE operations
- **Schema Inspection**: Retrieve table schemas via SHOW TABLES and SHOW CREATE TABLE commands
- **Read/Write Control**: Optional write permission enforcement to prevent unauthorized modifications
- **Plugin Integration**: Designed as a TokenRing plugin for automatic registration with the DatabaseService
- **Configuration-driven**: Automatically registers configured MySQL providers during application startup

## Core Components

### MySQLProvider Class

Extends `DatabaseProvider` to manage MySQL connections and queries.

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
  - Executes raw SQL query using a connection from the pool
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
      "allowWrites": true
    }
  }
}
```

### DatabaseService Integration

The plugin registers MySQL providers with the DatabaseService, making them available through the standard DatabaseService API:

```typescript
import { DatabaseService } from '@tokenring-ai/database';
import { MySQLProvider } from '@tokenring-ai/mysql';

// Register with DatabaseService
const databaseService = new DatabaseService();
databaseService.registerDatabase('mysql-primary', new MySQLProvider({
  host: 'localhost',
  user: 'admin',
  password: 'secure-password',
  databaseName: 'my_database'
}));

// Use the registered database resource
const resource = databaseService.getResource('mysql-primary');
const result = await resource.executeSql('SELECT * FROM users');
```

## Usage Examples

### Basic Plugin Integration

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { DatabaseConfigSchema } from '@tokenring-ai/database';

const app = new TokenRingApp();

// Configure MySQL provider
const databaseConfig = {
  providers: {
    'mysql-db': {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      databaseName: 'myapp',
      allowWrites: true
    }
  }
};

app.useDatabaseConfig(databaseConfig);

// The plugin automatically registers MySQL providers
app.registerService(new DatabaseService());
app.registerPlugin(MySQLProvider);

await app.start();
```

### Direct MySQLProvider Usage

```typescript
import MySQLProvider from '@tokenring-ai/mysql';

const mysqlProvider = new MySQLProvider({
  host: 'localhost',
  user: 'root',
  password: 'password',
  databaseName: 'myapp',
  connectionLimit: 10,
  allowWrites: false
});

// Execute SQL query
const result = await mysqlProvider.executeSql('SELECT * FROM users');
console.log('Users:', result.rows);
console.log('Fields:', result.fields);

// Inspect database schema
const schema = await mysqlProvider.showSchema();
console.log('Table schemas:', schema);
```

### Integration with TokenRing Agent

```typescript
import { TokenRingAgent } from '@tokenring-ai/agent';
import { DatabaseService } from '@tokenring-ai/database';
import { MySQLProvider } from '@tokenring-ai/mysql';

const agent = new TokenRingAgent({
  services: [new DatabaseService()],
  resources: [
    new MySQLProvider({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      databaseName: process.env.MYSQL_DATABASE
    })
  ]
});
```

### Configuration-driven Integration

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { DatabaseConfigSchema } from '@tokenring-ai/database';

const app = new TokenRingApp({
  config: {
    database: {
      providers: {
        'mysql-db': {
          type: 'mysql',
          host: 'localhost',
          user: 'admin',
          password: 'secure-password',
          databaseName: 'myapp'
        }
      }
    }
  }
});

// The plugin automatically registers MySQL providers
app.registerService(new DatabaseService());
app.registerPlugin(MySQLProvider);

await app.start();
```

## Configuration Options

### Provider Configuration (MySQLResourceProps)

- **allowWrites**: Enable write operations (INSERT, UPDATE, DELETE) - default: false
- **host**: MySQL server hostname or IP (required)
- **port**: MySQL port - default: 3306
- **user**: Database username (required)
- **password**: Database password (required)
- **databaseName**: Target database name (required)
- **connectionLimit**: Maximum pooled connections - default: 10

### Pool Configuration (Internal, fixed)

- `waitForConnections: true`
- `queueLimit: 0`
- `connectionLimit`: As configured in constructor

### Environment Variables (Recommended)

- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

## Dependencies

- `@tokenring-ai/database@^0.2.0`: Base DatabaseProvider class and types
- `@tokenring-ai/app@^0.2.0`: Application framework and plugin system
- `mysql2@^3.15.3`: Promise-based MySQL client for Node.js

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

## Notes

- Connection pool is managed automatically and persists while the application runs
- Connection errors are propagated to callers for proper error handling
- Binary data handling is supported through RowDataPacket but may require special handling
- Schema inspection may fail for tables with complex privileges or character sets
- All operations are asynchronous and use connection pooling for efficiency
- The plugin integrates seamlessly with the TokenRing service architecture

## Error Handling

Common error scenarios and troubleshooting:

- **Connection errors**: Check host, port, credentials, and network connectivity
- **Authentication failures**: Verify username/password and MySQL user privileges
- **Database access errors**: Ensure the user has proper permissions for the database
- **SQL syntax errors**: Validate your SQL queries before execution
- **Connection pool exhaustion**: Increase connectionLimit if you experience frequent pool exhaustion

## Security Considerations

- Use environment variables for sensitive credentials
- Configure allowWrites carefully to prevent unauthorized modifications
- Consider using read-only users for agents that only need to query data
- Validate and sanitize all SQL input to prevent injection attacks
- Limit database access to necessary tables and operations based on agent requirements

## Development and Testing

### Testing

Run the test suite:

```bash
bun run test
```

### Test Coverage

Generate test coverage report:

```bash
bun run test:coverage
```

### Building

The package uses TypeScript with ES modules. Build with:

```bash
bun run build
```

## License

MIT License - see [LICENSE](LICENSE) file for details.