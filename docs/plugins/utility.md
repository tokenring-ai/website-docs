# Utility Plugin

## Overview

The `@tokenring-ai/utility` package provides a comprehensive collection of general-purpose utility functions and classes used across the Token Ring ecosystem. This package serves as the foundation for many other packages, offering reusable helpers for common programming tasks including object manipulation, string processing, HTTP operations, promise handling, registry management, and timer utilities.

## Key Features

- **Object Utilities**: Safe object manipulation with type safety
- **String Utilities**: Comprehensive string processing and formatting
- **HTTP Utilities**: Robust HTTP client with retry logic
- **Promise Utilities**: Advanced promise handling and management
- **Registry Utilities**: Flexible registry patterns for service management
- **Timer Utilities**: Throttle and debounce functions
- **Type Safety**: Comprehensive TypeScript definitions
- **Error Handling**: Built-in error handling and validation

## Core Properties

### Object Utilities

| Function | Type | Description |
|----------|------|-------------|
| `pick` | `(obj: T, keys: K[]) => Pick<T, K>` | Creates an object with picked properties |
| `omit` | `(obj: T, keys: K[]) => Omit<T, K>` | Creates an object without specified properties |
| `transform` | `(obj: T, transformer) => { [K]: R }` | Transforms object values |
| `requireFields` | `(obj: T, required: (keyof T)[], context?) => void` | Validates required fields exist |
| `pickValue` | `(obj: T, key: K) => T[K] \| undefined` | Safely picks a single value |
| `deepMerge` | `(target: T, source: S) => T & S` | Deeply merges two objects |
| `parametricObjectFilter` | `(requirements) => (obj) => boolean` | Creates a filter function |

### String Utilities

| Function | Type | Description |
|----------|------|-------------|
| `convertBoolean` | `(text: string) => boolean` | Converts string to boolean |
| `trimMiddle` | `(str, start, end) => string` | Truncates middle of string |
| `shellEscape` | `(arg: string) => string` | Escapes string for shell |
| `joinDefault` | `(separator, iterable, default?) => string \| T` | Joins with default if empty |
| `formatLogMessages` | `(msgs) => string` | Formats log messages |
| `createAsciiTable` | `(data, options) => string` | Generates ASCII table |
| `wrapText` | `(text, width) => string[]` | Wraps text to specified width |

### HTTP Utilities

| Component | Type | Description |
|-----------|------|-------------|
| `HttpService` | `abstract class` | Base class for HTTP services |
| `doFetchWithRetry` | `(url, init?) => Promise<Response>` | Fetch with retry logic |

### Promise Utilities

| Function | Type | Description |
|----------|------|-------------|
| `abandon` | `(promise: Promise<T>) => void` | Prevents unhandled rejection |
| `waitForAbort` | `(signal, callback) => Promise<T>` | Waits for abort signal |
| `backoff` | `(options, fn) => Promise<T>` | Retries with exponential backoff |

### Registry Utilities

| Component | Type | Description |
|-----------|------|-------------|
| `KeyedRegistry<T>` | `class` | Generic registry by string keys |
| `TypedRegistry<T>` | `class` | Registry for classes with name property |
| `NamedClass` | `interface` | Interface for named classes |

### Timer Utilities

| Function | Type | Description |
|----------|------|-------------|
| `throttle` | `(func) => (minWait, ...args) => void` | Throttles function calls |
| `debounce` | `(func, delay) => (...args) => void` | Debounces function calls |

### Type Definitions

| Type | Definition | Description |
|------|------------|-------------|
| `PrimitiveType` | `string \| number \| boolean \| null \| undefined` | Primitive JavaScript types |

## Core Methods

### KeyedRegistry Methods

```typescript
register(name: string, resource: T): void
unregister(name: string): void
waitForItemByName(name: string, callback: (item: T) => void): void
getItemByName(name: string): T | undefined
requireItemByName(name: string): T
ensureItems(names: string[]): void
getAllItemNames(): string[]
getAllItems(): Record<string, T>
getAllItemValues(): T[]
getItemNamesLike(likeName: string): string[]
ensureItemNamesLike(likeName: string): string[]
getItemEntriesLike(likeName: string): [string, T][]
forEach(callback: (key: string, item: T) => void): void
entries(): [string, T][]
registerAll(items: Record<string, T>): void
```

### TypedRegistry Methods

```typescript
register(...items: MinimumType[]): void
unregister(...items: MinimumType[]): void
getItems: MinimumType[]
waitForItemByType<R>(type: new () => R, callback: (item: R) => void): void
getItemByType<R>(type: new () => R): R | undefined
requireItemByType<R>(type: new () => R): R
getItemByName(name: string): MinimumType | undefined
requireItemByName(name: string): MinimumType
```

### HttpService Methods

```typescript
fetchJson(path: string, opts: RequestInit, context: string): Promise<any>
parseJsonOrThrow(res: Response, context: string): Promise<any>
```

### Timer Functions

```typescript
// throttle returns a function with signature:
(minWait: number, ...args: Parameters<T>) => void

// debounce returns a function with signature:
(...args: Parameters<T>) => void
```

## Usage Examples

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
  createAsciiTable,
  wrapText,
  formatLogMessages
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
const table = createAsciiTable(
  [
    ['Name', 'Age'],
    ['Alice', '30'],
    ['Bob', '25']
  ],
  { columnWidths: [10, 5], grid: true }
);

// Text wrapping
const wrapped = wrapText('This is a long line that needs to be wrapped at 30 characters', 30);
```

### Registry Pattern

```typescript
import KeyedRegistry from '@tokenring-ai/utility/registry/KeyedRegistry';
import TypedRegistry from '@tokenring-ai/utility/registry/TypedRegistry';

// Create a registry for database connections
const dbRegistry = new KeyedRegistry<string>();

// Register different database connections
dbRegistry.register('postgres', 'postgresql://localhost:5432');
dbRegistry.register('mysql', 'mysql://localhost:3306');

// Get all registered items
const allItems = dbRegistry.getAllItemValues();
// ['postgresql://localhost:5432', 'mysql://localhost:3306']

// Pattern matching
const matchingItems = dbRegistry.getItemNamesLike('my*');
// ['mysql']

// Using TypedRegistry
interface Database extends NamedClass {
  connect(): void;
}

class PostgresDatabase implements Database {
  static name = 'postgres';
  connect() { /* ... */ }
}

class MySqlDatabase implements Database {
  static name = 'mysql';
  connect() { /* ... */ }
}

const typedRegistry = new TypedRegistry<Database>();
typedRegistry.register(PostgresDatabase, MySqlDatabase);

const db = typedRegistry.getItemByType(PostgresDatabase);
```

### Timer Utilities

```typescript
import { throttle, debounce } from '@tokenring-ai/utility/timer';

// Throttle example - limit function calls to once per second
const throttledApiCall = throttle(async (param: string) => {
  console.log('API call with:', param);
});

throttledApiCall(1000, 'param1');
throttledApiCall(1000, 'param2'); // Will be ignored
throttledApiCall(1000, 'param3'); // Will be ignored

// Debounce example - delay execution until user stops typing
const debouncedSearch = debounce(async (query: string) => {
  console.log('Performing search for:', query);
  // Call search API
}, 300);

debouncedSearch('react');
debouncedSearch('react hooks'); // Will cancel previous call
debouncedSearch('react components'); // Will cancel previous call
```

### HTTP Service Integration

```typescript
import { HttpService } from '@tokenring-ai/utility/http/HttpService';

class UserService extends HttpService {
  protected baseUrl = 'https://api.example.com';
  protected defaultHeaders = {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  };

  async getUser(id: string) {
    return this.fetchJson(`/users/${id}`, {}, 'getUser');
  }

  async createUser(userData: any) {
    return this.fetchJson('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }, 'createUser');
  }
}

const userService = new UserService();
const user = await userService.getUser('123');
```

### Promise Utilities

```typescript
import { abandon, backoff } from '@tokenring-ai/utility/promise';

// Abandon promise to prevent unhandled rejection
const fetchPromise = fetch('https://api.example.com/data');
abandon(fetchPromise);

// Retry with exponential backoff
await backoff(
  { times: 3, interval: 1000, multiplier: 2 },
  async ({ attempt }) => {
    const response = await fetch('https://api.example.com/data');
    if (response.ok) return response.json();
    if (attempt === 3) throw new Error('Failed after 3 attempts');
    return null;
  }
);
```

### Parametric Object Filtering

```typescript
import parametricObjectFilter from '@tokenring-ai/utility/object/parametricObjectFilter';

const filter = parametricObjectFilter({
  age: '>20',
  name: 'Alice'
});

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 18 },
  { name: 'Alice', age: 30 }
];

const filtered = users.filter(filter);
// [{ name: 'Alice', age: 25 }, { name: 'Alice', age: 30 }]
```

## Configuration

### Table Options for `createAsciiTable`

```typescript
interface TableOptions {
  columnWidths: number[];     // Width for each column
  padding?: number;           // Padding between content and borders
  grid?: boolean;             // Whether to draw table borders
}
```

### Backoff Options for `backoff`

```typescript
interface BackoffOptions {
  times: number;              // Maximum retry attempts
  interval: number;           // Initial delay in milliseconds
  multiplier: number;         // Exponential multiplier per retry
}
```

## Integration

The utility package is designed to be used as a foundational dependency across the Token Ring ecosystem. It can be integrated into any package or application that requires common utility functions.

### Service Integration

```typescript
import { HttpService } from '@tokenring-ai/utility/http/HttpService';
import { KeyedRegistry } from '@tokenring-ai/utility/registry/KeyedRegistry';

// Create a service that combines HTTP and registry functionality
class DataService extends HttpService {
  private registry = new KeyedRegistry<string>();
  
  constructor() {
    super();
    // Register database connections
    this.registry.register('db', 'postgresql://localhost:5432');
  }
  
  async fetchData() {
    const dbUrl = this.registry.getItemByName('db');
    const response = await this.fetchJson('/data', {}, 'fetchData');
    return { data: response, dbUrl };
  }
}
```

### Custom HTTP Service

```typescript
import { HttpService } from '@tokenring-ai/utility/http/HttpService';

class GitHubApi extends HttpService {
  protected baseUrl = 'https://api.github.com';
  protected defaultHeaders = {
    'Accept': 'application/vnd.github.v3+json'
  };

  async getRepository(owner: string, repo: string) {
    return this.fetchJson(`/repos/${owner}/${repo}`, {}, 'getRepository');
  }

  async getUser(username: string) {
    return this.fetchJson(`/users/${username}`, {}, 'getUser');
  }
}

const github = new GitHubApi();
const repo = await github.getRepository('tokenring-ai', 'token-ring');
```

## Best Practices

- Use `pick` and `omit` for safe object property manipulation
- Use `deepMerge` for combining configuration objects
- Use `abandon` when you intentionally want to ignore promise results
- Use `throttle` and `debounce` to control the rate of function calls
- Use `KeyedRegistry` for service discovery and management
- Use `TypedRegistry` for class-based service registration
- Use `backoff` for resilient API calls with retry logic
- Use `formatLogMessages` for consistent log output

## Testing

```typescript
import { pick, omit } from '@tokenring-ai/utility/object';
import { throttle, debounce } from '@tokenring-ai/utility/timer';

describe('Object Utilities', () => {
  test('pick extracts specified properties', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
  });

  test('omit removes specified properties', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['c'])).toEqual({ a: 1, b: 2 });
  });
});

describe('Timer Utilities', () => {
  test('throttle limits function calls', () => {
    const fn = jest.fn();
    const throttled = throttle(fn);
    throttled(100, 'a');
    throttled(100, 'b');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('debounce delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    expect(fn).not.toHaveBeenCalled();
  });
});
```

## Related Components

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/http`: HTTP-specific utilities
- `@tokenring-ai/registry`: Registry interfaces

## Notes

- This package is designed to be dependency-free except for core Token Ring packages
- All utilities are type-safe and tested with vitest
- The package follows the Token Ring documentation standards
- Utilities are organized into logical modules for easy import
- Consider the specific needs of your application when choosing utilities
- Error handling is built into most utilities for robustness
- The registry pattern is particularly useful for service management in the Token Ring ecosystem
- Timer utilities help manage performance and prevent excessive API calls
