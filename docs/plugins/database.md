# Database Plugin

Abstract layer for managing database resources with SQL execution and schema inspection.

## Overview

The `@tokenring-ai/database` package provides an abstract layer for managing database resources within TokenRing AI agents. It enables the registration, activation, and interaction with multiple database connections through a unified `DatabaseService`, supporting read-only and read-write operations.

## Key Features

- Multi-database resource management
- Abstract SQL execution and schema retrieval
- Integration with TokenRing tools
- Write protection configurable per resource
- Support for multiple database types (PostgreSQL, MySQL, etc.)

## Core Components

### DatabaseService

Central manager for database resources.

**Key Methods:**
- `registerResource(name, resource)`: Registers a database resource by name
- `enableResources(...names)`: Activates specific resources for use
- `getResourceByName(name)`: Retrieves an active resource
- `getAvailableResources()`: Lists all registered resources
- `getActiveResourceNames()`: Returns names of enabled resources
- `async* getMemories(agent)`: Yields a message listing available databases

### DatabaseResource (Abstract)

Abstract base class for concrete database implementations.

**Constructor Options:**
- `allowWrites?: boolean`: Defaults to `false`; enables write operations if `true`

**Key Methods (abstract):**
- `async executeSql(sqlQuery)`: Executes SQL and returns `{ rows, fields }`
- `async showSchema()`: Returns table schemas as key-value map

### Tools

**listDatabases**: Lists all active databases
- Input: None
- Output: String listing available databases

**executeSql**: Executes an SQL query on a specified database
- Input: `{ databaseName?, sqlQuery }`
- Output: `ExecuteSqlResult` object
- Warns about potential data modification

**showSchema**: Retrieves schema for all tables in a database
- Input: `{ databaseName }`
- Output: `Record<string, string>` of table schemas

## Usage Example

```typescript
import { Agent } from '@tokenring-ai/agent';
import DatabaseService from './DatabaseService';
import PostgresResource from './PostgresResource';

const agent = new Agent();
const dbService = new DatabaseService();
const postgresDb = new PostgresResource({ 
  allowWrites: true, 
  connectionString: process.env.DB_URL 
});

dbService.registerResource('myPostgres', postgresDb);
dbService.enableResources('myPostgres');
agent.services.push(dbService);

const result = await agent.executeTool('database/executeSql', {
  databaseName: 'myPostgres',
  sqlQuery: 'SELECT * FROM users LIMIT 5;'
});
```

## Configuration Options

- `allowWrites` (boolean, per DatabaseResource): Controls write permissions (default: `false`)
- Database connections: Handled in concrete implementations
- Tool inputs: Validated via Zod schemas

## Dependencies

- `@tokenring-ai/agent` (v0.1.0): Core agent framework
- Zod: Schema validation
- Database drivers in concrete implementations (e.g., `pg` for PostgreSQL)
