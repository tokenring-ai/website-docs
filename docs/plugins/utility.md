# @tokenring-ai/utility Plugin

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
| `pick` | `(obj: T, keys: K[]) =&gt; Pick&lt;T, K&gt;` | Creates an object with picked properties |
| `omit` | `(obj: T, keys: K[]) =&gt; Omit&lt;T, K&gt;` | Creates an object without specified properties |
| `transform` | `(obj: T, transformer) =&gt; &#123; [K]: R &#125;` | Transforms object values |
| `requireFields` | `(obj: T, required: (keyof T)[], context?) =&gt; void` | Validates required fields exist |
| `pickValue` | `(obj: T, key: K) =&gt; T[K] \| undefined` | Safely picks a single value |
| `deepMerge` | `(target: T, source: S) =&gt; T & S` | Deeply merges two objects |
| `parametricObjectFilter` | `(requirements) =&gt; (obj) =&gt; boolean` | Creates a filter function |

### String Utilities

| Function | Type | Description |
|----------|------|-------------|
| `convertBoolean` | `(text: string) =&gt; boolean` | Converts string to boolean |
| `trimMiddle` | `(str, start, end) =&gt; string` | Truncates middle of string |
| `shellEscape` | `(arg: string) =&gt; string` | Escapes string for shell |
| `joinDefault` | `(separator, iterable, default?) =&gt; string \| T` | Joins with default if empty |
| `formatLogMessages` | `(msgs) =&gt; string` | Formats log messages |
| `createAsciiTable` | `(data, options) =&gt; string` | Generates ASCII table |
| `wrapText` | `(text, width) =&gt; string[]` | Wraps text to specified width |

### HTTP Utilities

| Component | Type | Description |
|-----------|------|-------------|
| `HttpService` | `abstract class` | Base class for HTTP services |
| `doFetchWithRetry` | `(url, init?) =&gt; Promise&lt;Response&gt;` | Fetch with retry logic |

### Promise Utilities

| Function | Type | Description |
|----------|------|-------------|
| `abandon` | `(promise: Promise&lt;T&gt;) =&gt; void` | Prevents unhandled rejection |
| `waitForAbort` | `(signal, callback) =&gt; Promise&lt;T&gt;` | Waits for abort signal |
| `backoff` | `(options, fn) =&gt; Promise&lt;T&gt;` | Retries with exponential backoff |

### Registry Utilities

| Component | Type | Description |
|-----------|------|-------------|
| `KeyedRegistry&lt;T&gt;` | `class` | Generic registry by string keys |
| `TypedRegistry&lt;T&gt;` | `class` | Registry for classes with name property |
| `NamedClass` | `interface` | Interface for named classes |

### Timer Utilities

| Function | Type | Description |
|----------|------|-------------|
| `throttle` | `(func) =&gt; (minWait, ...args) =&gt; void` | Throttles function calls |
| `debounce` | `(func, delay) =&gt; (...args) =&gt; void` | Debounces function calls |

### Type Definitions

| Type | Definition | Description |
|------|------------|-------------|
| `PrimitiveType` | `string \| number \| boolean \| null \| undefined` | Primitive JavaScript types |

## Core Methods

### KeyedRegistry Methods

```typescript
register(name: string, resource: T): void
unregister(name: string): void
waitForItemByName(name: string, callback: (item: T) =&gt; void): void
getItemByName(name: string): T | undefined
requireItemByName(name: string): T
ensureItems(names: string[]): void
getAllItemNames(): string[]
getAllItems(): Record&lt;string, T&gt;
getAllItemValues(): T[]
getItemNamesLike(likeName: string): string[]
ensureItemNamesLike(likeName: string): string[]
getItemEntriesLike(likeName: string): [string, T][]
forEach(callback: (key: string, item: T) =&gt; void): void
entries(): [string, T][]
registerAll(items: Record&lt;string, T&gt;): void
```

### TypedRegistry Methods

```typescript
register(...items: MinimumType[]): void
unregister(...items: MinimumType[]): void
getItems: MinimumType[]
waitForItemByType&lt;R&gt;(type: new () =&gt; R, callback: (item: R) =&gt; void): void
getItemByType&lt;R&gt;(type: new () =&gt; R): R | undefined
requireItemByType&lt;R&gt;(type: new () =&gt; R): R
getItemByName(name: string): MinimumType | undefined
requireItemByName(name: string): MinimumType
```

### HttpService Methods

```typescript
fetchJson(path: string, opts: RequestInit, context: string): Promise&lt;any&gt;
parseJsonOrThrow(res: Response, context: string): Promise&lt;any&gt;
```

### Timer Functions

```typescript
// throttle returns a function with signature:
(minWait: number, ...args: Parameters&lt;T&gt;) =&gt; void

// debounce returns a function with signature:
(...args: Parameters&lt;T&gt;) =&gt; void
```

## Usage Examples

### Object Manipulation

```typescript
import &#123; pick, omit, transform, pickValue &#125; from '@tokenring-ai/utility/object';

const user = &#123;
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  password: 'secret'
&#125;;

// Pick specific fields
const publicUser = pick(user, ['id', 'name']);
// &#123; id: 1, name: 'Alice' &#125;

// Remove sensitive fields
const safeUser = omit(user, ['password']);
// &#123; id: 1, name: 'Alice', email: 'alice@example.com' &#125;

// Transform values
const stringifiedUser = transform(user, (value) =&gt; String(value));
// &#123; id: '1', name: 'Alice', email: 'alice@example.com', password: 'secret' &#125;

// Get single value safely
const id = pickValue(user, 'id');
// 1
```

### String Formatting

```typescript
import &#123;
  shellEscape,
  joinDefault,
  createAsciiTable,
  wrapText,
  formatLogMessages
&#125; from '@tokenring-ai/utility/string';

// Shell escape example
const filename = "my file's name.txt";
const command = `rm $&#123;shellEscape(filename)&#125;`;
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
  &#123; columnWidths: [10, 5], grid: true &#125;
);

// Text wrapping
const wrapped = wrapText('This is a long line that needs to be wrapped at 30 characters', 30);
```

### Registry Pattern

```typescript
import KeyedRegistry from '@tokenring-ai/utility/registry/KeyedRegistry';
import TypedRegistry from '@tokenring-ai/utility/registry/TypedRegistry';

// Create a registry for database connections
const dbRegistry = new KeyedRegistry&lt;string&gt;();

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
interface Database extends NamedClass &#123;
  connect(): void;
&#125;

class PostgresDatabase implements Database &#123;
  static name = 'postgres';
  connect() &#123; /* ... */ &#125;
&#125;

class MySqlDatabase implements Database &#123;
  static name = 'mysql';
  connect() &#123; /* ... */ &#125;
&#125;

const typedRegistry = new TypedRegistry&lt;Database&gt;();
typedRegistry.register(PostgresDatabase, MySqlDatabase);

const db = typedRegistry.getItemByType(PostgresDatabase);
```

### Timer Utilities

```typescript
import &#123; throttle, debounce &#125; from '@tokenring-ai/utility/timer';

// Throttle example - limit function calls to once per second
const throttledApiCall = throttle(async (param: string) =&gt; &#123;
  console.log('API call with:', param);
&#125;);

throttledApiCall(1000, 'param1');
throttledApiCall(1000, 'param2'); // Will be ignored
throttledApiCall(1000, 'param3'); // Will be ignored

// Debounce example - delay execution until user stops typing
const debouncedSearch = debounce(async (query: string) =&gt; &#123;
  console.log('Performing search for:', query);
  // Call search API
&#125;, 300);

debouncedSearch('react');
debouncedSearch('react hooks'); // Will cancel previous call
debouncedSearch('react components'); // Will cancel previous call
```

### HTTP Service Integration

```typescript
import &#123; HttpService &#125; from '@tokenring-ai/utility/http/HttpService';

class UserService extends HttpService &#123;
  protected baseUrl = 'https://api.example.com';
  protected defaultHeaders = &#123;
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  &#125;;

  async getUser(id: string) &#123;
    return this.fetchJson(`/users/$&#123;id&#125;`, &#123;&#125;, 'getUser');
  &#125;

  async createUser(userData: any) &#123;
    return this.fetchJson('/users', &#123;
      method: 'POST',
      body: JSON.stringify(userData)
    &#125;, 'createUser');
  &#125;
&#125;

const userService = new UserService();
const user = await userService.getUser('123');
```

### Promise Utilities

```typescript
import &#123; abandon, backoff &#125; from '@tokenring-ai/utility/promise';

// Abandon promise to prevent unhandled rejection
const fetchPromise = fetch('https://api.example.com/data');
abandon(fetchPromise);

// Retry with exponential backoff
await backoff(
  &#123; times: 3, interval: 1000, multiplier: 2 &#125;,
  async (&#123; attempt &#125;) =&gt; &#123;
    const response = await fetch('https://api.example.com/data');
    if (response.ok) return response.json();
    if (attempt === 3) throw new Error('Failed after 3 attempts');
    return null;
  &#125;
);
```

### Parametric Object Filtering

```typescript
import parametricObjectFilter from '@tokenring-ai/utility/object/parametricObjectFilter';

const filter = parametricObjectFilter(&#123;
  age: '&gt;20',
  name: 'Alice'
&#125;);

const users = [
  &#123; name: 'Alice', age: 25 &#125;,
  &#123; name: 'Bob', age: 18 &#125;,
  &#123; name: 'Alice', age: 30 &#125;
];

const filtered = users.filter(filter);
// [&#123; name: 'Alice', age: 25 &#125;, &#123; name: 'Alice', age: 30 &#125;]
```

## Configuration

### Table Options for `createAsciiTable`

```typescript
interface TableOptions &#123;
  columnWidths: number[];     // Width for each column
  padding?: number;           // Padding between content and borders
  grid?: boolean;             // Whether to draw table borders
&#125;
```

### Backoff Options for `backoff`

```typescript
interface BackoffOptions &#123;
  times: number;              // Maximum retry attempts
  interval: number;           // Initial delay in milliseconds
  multiplier: number;         // Exponential multiplier per retry
&#125;
```

## Integration

The utility package is designed to be used as a foundational dependency across the Token Ring ecosystem. It can be integrated into any package or application that requires common utility functions.

### Service Integration

```typescript
import &#123; HttpService &#125; from '@tokenring-ai/utility/http/HttpService';
import &#123; KeyedRegistry &#125; from '@tokenring-ai/utility/registry/KeyedRegistry';

// Create a service that combines HTTP and registry functionality
class DataService extends HttpService &#123;
  private registry = new KeyedRegistry&lt;string&gt;();
  
  constructor() &#123;
    super();
    // Register database connections
    this.registry.register('db', 'postgresql://localhost:5432');
  &#125;
  
  async fetchData() &#123;
    const dbUrl = this.registry.getItemByName('db');
    const response = await this.fetchJson('/data', &#123;&#125;, 'fetchData');
    return &#123; data: response, dbUrl &#125;;
  &#125;
&#125;
```

### Custom HTTP Service

```typescript
import &#123; HttpService &#125; from '@tokenring-ai/utility/http/HttpService';

class GitHubApi extends HttpService &#123;
  protected baseUrl = 'https://api.github.com';
  protected defaultHeaders = &#123;
    'Accept': 'application/vnd.github.v3+json'
  &#125;;

  async getRepository(owner: string, repo: string) &#123;
    return this.fetchJson(`/repos/$&#123;owner&#125;/$&#123;repo&#125;`, &#123;&#125;, 'getRepository');
  &#125;

  async getUser(username: string) &#123;
    return this.fetchJson(`/users/$&#123;username&#125;`, &#123;&#125;, 'getUser');
  &#125;
&#125;

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
import &#123; pick, omit &#125; from '@tokenring-ai/utility/object';
import &#123; throttle, debounce &#125; from '@tokenring-ai/utility/timer';

describe('Object Utilities', () =&gt; &#123;
  test('pick extracts specified properties', () =&gt; &#123;
    const obj = &#123; a: 1, b: 2, c: 3 &#125;;
    expect(pick(obj, ['a', 'b'])).toEqual(&#123; a: 1, b: 2 &#125;);
  &#125;);

  test('omit removes specified properties', () =&gt; &#123;
    const obj = &#123; a: 1, b: 2, c: 3 &#125;;
    expect(omit(obj, ['c'])).toEqual(&#123; a: 1, b: 2 &#125;);
  &#125;);
&#125;);

describe('Timer Utilities', () =&gt; &#123;
  test('throttle limits function calls', () =&gt; &#123;
    const fn = jest.fn();
    const throttled = throttle(fn);
    throttled(100, 'a');
    throttled(100, 'b');
    expect(fn).toHaveBeenCalledTimes(1);
  &#125;);

  test('debounce delays function execution', () =&gt; &#123;
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    expect(fn).not.toHaveBeenCalled();
  &#125;);
&#125;);
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
