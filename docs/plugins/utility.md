# Utility Plugin

General-purpose utility functions and classes for the Token Ring ecosystem.

## Overview

The `@tokenring-ai/utility` package provides a comprehensive collection of general-purpose utility functions and classes used across the Token Ring ecosystem. This package serves as the foundation for many other packages, offering reusable helpers for common programming tasks including object manipulation, string processing, HTTP operations, promise handling, registry management, and more.

## Key Features

- **Object Utilities**: Safe object manipulation with type safety
- **String Utilities**: Comprehensive string processing and formatting
- **HTTP Utilities**: Robust HTTP client with retry logic
- **Promise Utilities**: Advanced promise handling and management
- **Registry Utilities**: Flexible registry patterns for service management
- **Type Safety**: Comprehensive TypeScript definitions
- **Error Handling**: Built-in error handling and validation

## Core Components

### Object Utilities

#### `pick<T, K>(obj: T, keys: K[]): Pick<T, K>`
Creates an object composed of the picked object properties.

```typescript
import pick from '@tokenring-ai/utility/object/pick';

const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
const userInfo = pick(user, ['id', 'name']);
// { id: 1, name: 'Alice' }
```

#### `omit<T, K>(obj: T, keys: K[]): Omit<T, K>`
Creates an object composed of the properties not included in the given keys array.

```typescript
import omit from '@tokenring-ai/utility/object/omit';

const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
const publicInfo = omit(user, ['email']);
// { id: 1, name: 'Alice' }
```

#### `transform<T, R>(obj: T, transformer: (value: T[keyof T], key: keyof T) => R): { [K in keyof T]: R}`
Transforms an object's values using a transformer function.

```typescript
import transform from '@tokenring-ai/utility/object/transform';

const config = { port: 3000, host: 'localhost' };
const stringConfig = transform(config, (value) => String(value));
// { port: '3000', host: 'localhost' }
```

#### `requireFields<T>(obj: T, required: (keyof T)[], context?: string): void`
Validates that required fields exist in an object, throwing an error if any are missing.

```typescript
import requireFields from '@tokenring-ai/utility/object/requireFields';

const config = { port: 3000 };
requireFields(config, ['port', 'host'], 'ServerConfig');
// Throws: ServerConfig: Missing required field "host"
```

#### `pickValue<T, K extends keyof T>(obj: T, key: K): T[K] | undefined`
Safely picks a single value from an object.

```typescript
import pickValue from '@tokenring-ai/utility/object/pickValue';

const user = { id: 1, name: 'Alice' };
const id = pickValue(user, 'id');
// 1
```

### String Utilities

#### `convertBoolean(text: string | null | undefined): boolean`
Converts string representations to boolean values.

```typescript
import convertBoolean from '@tokenring-ai/utility/string/convertBoolean';

convertBoolean('true');   // true
convertBoolean('yes');    // true
convertBoolean('1');      // true
convertBoolean('false');  // false
convertBoolean('no');     // false
convertBoolean('0');      // false
```

#### `trimMiddle(str: string, startLength: number, endLength: number): string`
Truncates the middle of a string, keeping the beginning and end.

```typescript
import trimMiddle from '@tokenring-ai/utility/string/trimMiddle';

trimMiddle('abcdefghijklmnopqrstuvwxyz', 5, 5);
// 'abcde...vwxyz'
```

#### `shellEscape(arg: string): string`
Safely escapes a string for use in shell commands.

```typescript
import { shellEscape } from '@tokenring-ai/utility/string/shellEscape';

const filename = "my file's name.txt";
const command = `cat ${shellEscape(filename)}`;
// "cat 'my file'\\\\''s name.txt'"
```

#### `joinDefault<T>(separator: string, iterable: Iterable<string> | null | undefined, defaultValue?: T): string | T`
Joins strings with a separator, providing a default value if the iterable is empty.

```typescript
import joinDefault from '@tokenring-ai/utility/string/joinDefault';

joinDefault(', ', ['a', 'b', 'c']);       // 'a, b, c'
joinDefault(', ', null, 'default');       // 'default'
joinDefault(', ', ['single']);            // 'single'
```

#### `formatLogMessage(msgs: (string | Error)[]): string`
Formats log messages similar to console.log with special handling for errors.

```typescript
import formatLogMessage from '@tokenring-ai/utility/string/formatLogMessage';

const output = formatLogMessage([
  'User loaded',
  { id: 1, name: 'Alice' },
  new Error('Connection failed')
]);
```

#### `asciiTable(rows: string[][], headers?: string[]): string`
Creates an ASCII table from array data.

```typescript
import asciiTable from '@tokenring-ai/utility/string/asciiTable';

const table = asciiTable([
  ['Name', 'Age', 'Email'],
  ['Alice', '30', 'alice@example.com'],
  ['Bob', '25', 'bob@example.com']
]);
```

#### `wrapText(text: string, width: number, indent: string = ''): string`
Wraps text to a specific width with optional indentation.

```typescript
import wrapText from '@tokenring-ai/utility/string/wrapText';

const wrapped = wrapText('This is a long line of text that needs to be wrapped', 20);
```

### HTTP Utilities

#### `HttpService` (abstract base class)
Base class for HTTP services with automatic JSON parsing and error handling.

```typescript
import { HttpService } from '@tokenring-ai/utility/http/HttpService';

export class MyApiService extends HttpService {
  protected baseUrl = 'https://api.example.com';
  protected defaultHeaders = { 'Content-Type': 'application/json' };

  async getUser(id: string) {
    return this.fetchJson(`/users/${id}`, {}, 'getUser');
  }
}
```

#### `doFetchWithRetry(url: string, init?: RequestInit): Promise<Response>`
Fetch with automatic retry logic for network errors and rate limiting.

```typescript
import { doFetchWithRetry } from '@tokenring-ai/utility/http/doFetchWithRetry';

const response = await doFetchWithRetry('https://api.example.com/data', {
  method: 'GET'
});
```

### Promise Utilities

#### `abandon<T>(promise: Promise<T>): void`
Intentionally abandons a promise to prevent unhandled rejection warnings.

```typescript
import { abandon } from '@tokenring-ai/utility/promise/abandon';

const fetchPromise = fetch('https://api.example.com/data');
abandon(fetchPromise); // Consume resolution/rejection quietly
```

#### `waitForAbort(signal: AbortSignal, callback: (ev: Event) => Promise<T>): Promise<T>`
Waits for an AbortSignal to be triggered and resolves a promise with the callback result.

```typescript
import { waitForAbort } from '@tokenring-ai/utility/promise/waitForAbort';

const controller = new AbortController();
const signal = controller.signal;

// Wait for abort signal with callback
await waitForAbort(signal, (ev) => Promise.resolve('aborted'));
```

### Registry Utilities

#### `KeyedRegistry<T>`
A generic registry for storing and retrieving items by string keys.

```typescript
import KeyedRegistry from '@tokenring-ai/utility/registry/KeyedRegistry';

const registry = new KeyedRegistry<string>();
registry.register('db', 'postgresql://localhost:5432');
registry.register('cache', 'redis://localhost:6379');

const dbUrl = registry.getItemByName('db');
// 'postgresql://localhost:5432'
```

#### `TypedRegistry<T extends NamedClass>`
Registry for classes with a `name` property.

```typescript
import TypedRegistry from '@tokenring-ai/utility/registry/TypedRegistry';

class Database {
  static name = 'database';
  connect() { /* ... */ }
}

class Cache {
  static name = 'cache';
  connect() { /* ... */ }
}

const registry = new TypedRegistry();
registry.register(Database, Cache);

const db = registry.getItemByType(Database);
```

#### `RegistrySingleSelector<T>`
Registry selector for managing single active items with change notifications.

```typescript
import RegistrySingleSelector from '@tokenring-ai/utility/registry/RegistrySingleSelector';

const singleSelector = new RegistrySingleSelector(registry);
singleSelector.on('change', (item) => {
  console.log('New active item:', item);
});

singleSelector.setEnabledItem('database');
```

#### `RegistryMultiSelector<T>`
Registry selector for managing multiple active items.

```typescript
import RegistryMultiSelector from '@tokenring-ai/utility/registry/RegistryMultiSelector';

const multiSelector = new RegistryMultiSelector(registry);
multiSelector.on('change', (items) => {
  console.log('Active items:', items);
});

multiSelector.enableItems('database', 'cache');
```

#### `KeyedRegistryWithSingleSelection<T>`
Combined registry with single selection support.

```typescript
import KeyedRegistryWithSingleSelection from '@tokenring-ai/utility/registry/KeyedRegistryWithSingleSelection';

const registry = new KeyedRegistryWithSingleSelection<string>();
registry.register('db', 'postgresql://localhost:5432');
registry.selectItem('db');

const selected = registry.getSelected();
```

#### `KeyedRegistryWithMultipleSelection<T>`
Combined registry with multiple selection support.

```typescript
import KeyedRegistryWithMultipleSelection from '@tokenring-ai/utility/registry/KeyedRegistryWithMultipleSelection';

const registry = new KeyedRegistryWithMultipleSelection<string>();
registry.register('db', 'postgresql://localhost:5432');
registry.register('cache', 'redis://localhost:6432');

registry.selectItems('db', 'cache');

const selected = registry.getSelected();
```

### Type Definitions

#### `PrimitiveType`
Type representing primitive JavaScript types.

```typescript
import { PrimitiveType } from '@tokenring-ai/utility/types';

const value: PrimitiveType = 'string'; // or number, boolean, null, undefined
```

## Usage Patterns

### Object Manipulation

```typescript
import { pick, omit, transform, pickValue } from '@tokenring-ai/utility/object';

const user = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret'
};

// Pick specific fields
const publicUser = pick(user, ['id', 'name']);
// { id: 1, name: 'Alice' }

// Remove sensitive fields
const safeUser = omit(user, ['password']);
// { id: 1, name: 'Alice', email: 'alice@example.com' }

// Transform values
const stringifiedUser = transform(user, (value) => String(value));
// { id: '1', name: 'Alice', email: 'alice@example.com', password: 'secret' }

// Get single value safely
const id = pickValue(user, 'id');
// 1
```

### String Formatting

```typescript
import { 
  shellEscape, 
  joinDefault, 
  asciiTable, 
  wrapText,
  formatLogMessage 
} from '@tokenring-ai/utility/string';

// Shell escape example
const filename = "my file's name.txt";
const command = `rm ${shellEscape(filename)}`;
// "rm 'my file'\\\\''s name.txt'"

// Join with default
const items = null;
const joined = joinDefault(', ', items, 'none');
// 'none'

// ASCII table
const table = asciiTable([
  ['Name', 'Age'],
  ['Alice', '30'],
  ['Bob', '25']
]);

// Text wrapping
const wrapped = wrapText('This is a long line that needs to be wrapped at 30 characters', 30);
```

### Registry Pattern

```typescript
import { 
  KeyedRegistry, 
  RegistrySingleSelector,
  KeyedRegistryWithSingleSelection
} from '@tokenring-ai/utility/registry';

// Create a registry for database connections
const dbRegistry = new KeyedRegistry<DatabaseConnection>();

// Register different database implementations
dbRegistry.register('postgres', new PostgresConnection());
dbRegistry.register('mysql', new MySqlConnection());

// Use a selector to manage active database
const dbSelector = new RegistrySingleSelector(dbRegistry);
dbSelector.on('change', (activeDb) => {
  console.log('Active database changed:', activeDb);
});

dbSelector.setEnabledItem('postgres');

// Alternative: combined registry with selection
const combinedRegistry = new KeyedRegistryWithSingleSelection<DatabaseConnection>();
combinedRegistry.register('postgres', new PostgresConnection());
combinedRegistry.selectItem('postgres');
const activeDb = combinedRegistry.getSelected();
```

## Dependencies

- `@tokenring-ai/agent`: Core agent framework

## Notes

- This package is designed to be dependency-free except for core Token Ring packages
- All utilities are type-safe and tested
- The package follows the Token Ring documentation standards
- Utilities are organized into logical modules for easy import
- Consider the specific needs of your application when choosing utilities
- Error handling is built into most utilities for robustness
- The registry pattern is particularly useful for service management in the Token Ring ecosystem