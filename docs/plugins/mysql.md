# MySQL Plugin

MySQL database integration with connection pooling, SQL execution, and schema inspection.

## Overview

The `@tokenring-ai/mysql` package provides MySQL database integration for the TokenRing AI platform. It extends the base `DatabaseResource` from `@tokenring-ai/database` to offer connection pooling, SQL query execution, and schema inspection capabilities specifically for MySQL databases.

## Key Features

- **Connection Pooling**: Efficient, reusable connections using mysql2
- **SQL Execution**: Asynchronous query execution with result handling
- **Schema Inspection**: Retrieve table schemas via SHOW TABLES and SHOW CREATE TABLE
- **Read/Write Control**: Optional write permission enforcement
- **Agent Integration**: Designed for use in AI agents requiring database interactions

## Core Components

### MySQLResource Class

Extends `DatabaseResource` to manage MySQL connections and queries.

**Constructor:**
```typescript
new MySQLResource({
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
  - Executes raw SQL query
  - Returns: `{ rows: RowDataPacket[], fields: string[] }`
  - Supports SELECT, INSERT, UPDATE, DELETE based on allowWrites
  - Auto-manages connection pooling

- `showSchema(): Promise<Record<string, string>>`
  - Retrieves CREATE TABLE statements for all tables
  - Returns object mapping table names to CREATE TABLE SQL
  - Uses SHOW TABLES and SHOW CREATE TABLE queries

## Usage Examples

### Basic Connection and Query

```typescript
import MySQLResource from '@tokenring-ai/mysql';

const mysqlResource = new MySQLResource({
  host: 'localhost',
  user: 'root',
  password: 'password',
  databaseName: 'myapp',
  allowWrites: true
});

async function queryUsers() {
  try {
    const result = await mysqlResource.executeSql('SELECT * FROM users');
    console.log('Users:', result.rows);
    console.log('Fields:', result.fields);
  } catch (error) {
    console.error('Query failed:', error);
  }
}

queryUsers();
```

### Schema Inspection

```typescript
import MySQLResource from '@tokenring-ai/mysql';

const mysqlResource = new MySQLResource({
  host: 'localhost',
  user: 'root',
  password: 'password',
  databaseName: 'myapp'
});

async function inspectSchema() {
  const schema = await mysqlResource.showSchema();
  Object.entries(schema).forEach(([table, createSql]) => {
    console.log(`Table: ${table}`);
    console.log(`Schema: ${createSql}`);
  });
}

inspectSchema();
```

### Integration with TokenRing Agent

```typescript
import { TokenRingAgent } from '@tokenring-ai/agent';
import MySQLResource from '@tokenring-ai/mysql';

const agent = new TokenRingAgent({
  resources: [
    new MySQLResource({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      databaseName: process.env.MYSQL_DATABASE
    })
  ]
});
```

## Configuration Options

- **host**: MySQL server hostname or IP (required)
- **port**: MySQL port (default: 3306)
- **user**: Database username (required)
- **password**: Database password (required)
- **databaseName**: Target database name (required)
- **connectionLimit**: Maximum pooled connections (default: 10)
- **allowWrites**: Enable write operations (default: false)

**Pool Options** (internally fixed):
- `waitForConnections: true`
- `queueLimit: 0`

**Environment Variables** (recommended):
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

## Dependencies

- `@tokenring-ai/database@^0.1.0`: Base DatabaseResource class and types
- `mysql2@^3.14.1`: Promise-based MySQL client for Node.js

## Notes

- Connection pool not ended automatically; call `pool.end()` manually if needed
- Binary data handling not explicitly supported; use base64 if needed
- Error handling is basic; extend for transactions or advanced retries
- Assumes UTF-8 text encoding
