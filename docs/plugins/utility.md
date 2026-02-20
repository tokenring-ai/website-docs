# Utility Plugin

## Overview

The `@tokenring-ai/utility` package provides a comprehensive collection of general-purpose utility functions and classes used across the Token Ring ecosystem. This package serves as a foundational dependency for many other packages, offering reusable helpers for common programming tasks including object manipulation, string processing, HTTP operations, promise handling, registry management, timer utilities, and buffer analysis.

## Key Features

- **Object Utilities**: Safe object manipulation with type safety
- **String Utilities**: Comprehensive string processing and formatting
- **HTTP Utilities**: Robust HTTP client with automatic retry logic
- **Promise Utilities**: Advanced promise handling and management
- **Registry Utilities**: Flexible registry patterns for service management
- **Timer Utilities**: Throttle and debounce functions
- **Buffer Utilities**: Binary data detection
- **Type Safety**: Comprehensive TypeScript definitions
- **Error Handling**: Built-in error handling and validation

## Core Components

### Object Utilities

| Function | Type | Description |
|----------|------|-------------|
| `pick` | `(obj: T, keys: K[]) => Pick<T, K>` | Creates an object with picked properties |
| `omit` | `(obj: T, keys: K[]) => Omit<T, K>` | Creates an object without specified properties |
| `transform` | `(obj: T, transformer) => { [K]: R }` | Transforms object values using a transformer function |
| `requireFields` | `(obj: T, required: (keyof T)[], context?) => void` | Validates required fields exist |
| `pickValue` | `(obj: T, key: unknown) => T[keyof T] \| undefined` | Safely picks a single value by key |
| `deepMerge` | `(target: T \| null \| undefined, source: S \| null \| undefined) => T & S` | Deeply merges two objects |
| `parametricObjectFilter` | `(requirements) => (obj) => boolean` | Creates a filter function for object arrays |
| `isEmpty` | `(obj: Object \| Array \| Map \| Set \| null \| undefined) => boolean` | Checks if object is empty |
| `deepEquals` | `(a: unknown, b: unknown) => boolean` | Deeply compares two values for equality |

### String Utilities

| Function | Type | Description |
|----------|------|-------------|
| `convertBoolean` | `(text: string \| undefined \| null) => boolean` | Converts string to boolean |
| `trimMiddle` | `(str, startLength, endLength) => string` | Truncates middle of string |
| `shellEscape` | `(arg: string) => string` | Escapes string for shell usage |
| `joinDefault` | `(separator, iterable, default?) => string \| OtherReturnType` | Joins with default if iterable is empty |
| `formatLogMessages` | `(msgs: (string \| Error)[]) => string` | Formats log messages |
| `createAsciiTable` | `(data, options) => string` | Generates ASCII table |
| `wrapText` | `(text, maxWidth) => string[]` | Wraps text to specified width |
| `indent` | `(input: string \| string[], level: number) => string` | Indents text by level |
| `markdownList` | `(items: string[], indentLevel?) => string` | Creates markdown list |
| `numberedList` | `(items: string[], indentLevel?) => string` | Creates numbered list |
| `codeBlock` | `(code, language?) => string` | Wraps code in markdown code block |
| `errorToString` | `(error: any) => string` | Converts error to string |
| `markdownTable` | `(columns, rows) => string` | Generates Markdown table |
| `dedupe` | `(items: string[]) => string[]` | Removes duplicates from string array |
| `like` | `(likeName, thing) => boolean` | Pattern matching for strings |

### HTTP Utilities

| Component | Type | Description |
|-----------|------|-------------|
| `HttpService` | `abstract class` | Base class for HTTP services |
| `doFetchWithRetry` | `(url, init?) => Promise<Response>` | Fetch with automatic retry logic |

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
| `TypedRegistry<T>` | `class` | Registry for classes with constructor property |

### Timer Utilities

| Function | Type | Description |
|----------|------|-------------|
| `throttle` | `(func) => (minWait, ...args) => void` | Throttles function calls |
| `debounce` | `(func, delay) => (...args) => void` | Debounces function calls |

### Buffer Utilities

| Function | Type | Description |
|----------|------|-------------|
| `isBinaryData` | `(buffer: Buffer) => boolean` | Detects binary data in Buffer |

### Type Definitions

| Type | Definition | Description |
|------|------------|-------------|
| `PrimitiveType` | `string \| number \| boolean \| null \| undefined` | Primitive JavaScript types |
| `ParametricObjectRequirements` | `Record<string, number \| string \| null \| undefined>` | Requirements for parametric filtering |

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
getAllItemValues(): T[]
getItemNamesLike(likeName: string | string[]): string[]
ensureItemNamesLike(likeName: string | string[]): string[]
getItemEntriesLike(likeName: string | string[]): [string, T][]
forEach(callback: (key: string, item: T) => void): void
entries(): [string, T][]
registerAll(items: Record<string, T> | Map<string, T>): void
getLongestPrefixMatch(input: string): { key: string; item: T; remainder: string } | undefined
```

### TypedRegistry Methods

```typescript
register(...items: MinimumType[] | MinimumType[][]): void
unregister(...items: MinimumType[]): void
getItems: MinimumType[]
waitForItemByType<R>(type: abstract new (...args: any[]) => R, callback: (item: R) => void): void
getItemByType<R>(type: abstract new (...args: any[]) => R): R | undefined
requireItemByType<R>(type: abstract new (...args: any[]) => R): R
getItemByName(name: string): MinimumType | undefined
requireItemByName(name: string): MinimumType
```

### HttpService Methods

```typescript
protected abstract baseUrl: string
protected abstract defaultHeaders: Record<string, string>

protected async fetchJson(path: string, opts?: RequestInit, context: string): Promise<any>
protected async parseJsonOrThrow(res: Response, context: string): Promise<any>
```

## Usage Examples

### Object Manipulation

```typescript
import { pick, omit, transform, pickValue, deepMerge, deepEquals, isEmpty, parametricObjectFilter, requireFields } from '@tokenring-ai/utility/object';

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
const stringifiedUser = transform(user, (value, key) => String(value));
// { id: '1', name: 'Alice', email: 'alice@example.com', password: 'secret' }

// Get single value safely
const id = pickValue(user, 'id');
// 1

// Check if object is empty
isEmpty(user);     // false
isEmpty({});       // true
isEmpty([]);       // true

// Deep merge
const configA = { port: 3000, host: 'localhost' };
const configB = { host: '127.0.0.1', cache: true };
const merged = deepMerge(configA, configB);
// { port: 3000, host: '127.0.0.1', cache: true }

// Deep equals
deepEquals({ a: 1 }, { a: 1 }); // true

// Parametric filtering
const filter = parametricObjectFilter({
  age: '>20',
  name: 'Alice'
});

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 18 },
  { name: 'Charlie', age: 30 }
];

const filtered = users.filter(filter);
// [{ name: 'Alice', age: 25 }, { name: 'Charlie', age: 30 }]

// Require fields
try {
  requireFields(user, ['id', 'name', 'email']);
  console.log('All required fields present');
} catch (error) {
  console.error(error.message);
}
```

### String Formatting

```typescript
import {
  convertBoolean,
  trimMiddle,
  shellEscape,
  joinDefault,
  formatLogMessages,
  createAsciiTable,
  wrapText,
  indent,
  markdownList,
  numberedList,
  codeBlock,
  errorToString,
  markdownTable,
  dedupe,
  like
} from '@tokenring-ai/utility/string';

// Boolean conversion
convertBoolean('true');   // true
convertBoolean('yes');    // true
convertBoolean('false');  // false
convertBoolean('no');     // false
convertBoolean('maybe');  // Throws: Unknown string used as boolean value: maybe

// String shrinking
trimMiddle('FullDocumentWithLotsOfText', 10, 10);
// 'FullDocu...omitted...xample.txt'

// Shell escaping
const filename = "my file's name.txt";
const command = `rm ${shellEscape(filename)}`;
// "rm 'my file's'\\'''s name.txt'"

// Join with default
const items = null;
const joined = joinDefault(', ', items, 'none');
// 'none'

// Log formatting
const output = formatLogMessages([
  'User loaded',
  new Error('Connection failed')
]);
// 'User loaded Error: Connection failed\n    at...'

// ASCII table
const table = createAsciiTable(
  [
    ['Name', 'Age', 'Email'],
    ['Alice', '30', 'alice@example.com'],
    ['Bob', '25', 'bob@example.com']
  ],
  { columnWidths: [10, 5, 20], padding: 1, grid: true }
);

// Text wrapping
const lines = wrapText('This is a long line of text that needs to be wrapped', 20);
// ['This is a long line', 'of text that needs', 'to be wrapped']

// Markdown list
const list = markdownList(['Item 1', 'Item 2', 'Item 3'], 2);
// '   - Item 1\n   - Item 2\n   - Item 3'

// Numbered list
const numbered = numberedList(['Step 1', 'Step 2', 'Step 3'], 1);
// '1. Step 1\n2. Step 2\n3. Step 3'

// Code block
const code = codeBlock('console.log("hello")', 'typescript');
// '```typescript\nconsole.log("hello")\n```'

// Error to string
const errorStr = errorToString(new Error('Something went wrong'));
// 'Error: Something went wrong\n    at...'

// Markdown table
const mdTable = markdownTable(
  ['Name', 'Age'],
  [['Alice', '30'], ['Bob', '25']]
);
// '| Name  | Age |\n|-------|-----|\n| Alice | 30  |\n| Bob   | 25  |'

// Dedupe
const items = ['a', 'b', 'a', 'c', 'b'];
const unique = dedupe(items);
// ['a', 'b', 'c']

// Like pattern matching
like('db*', 'database');      // true
like('db', 'database');       // false
like('database', 'database'); // true
like('DB', 'database');       // true (case-insensitive)
```

### Registry Pattern

```typescript
import KeyedRegistry from '@tokenring-ai/utility/registry/KeyedRegistry';
import TypedRegistry from '@tokenring-ai/utility/registry/TypedRegistry';

// Create a keyed registry for connections
const dbRegistry = new KeyedRegistry<string>();

// Register different database connections
dbRegistry.register('postgres', 'postgresql://localhost:5432');
dbRegistry.register('mysql', 'mysql://localhost:3306');

// Get all registered items
const allItems = dbRegistry.getAllItemValues();
// ['postgresql://localhost:5432', 'mysql://localhost:3306']

// Get item by name
const postgresUrl = dbRegistry.getItemByName('postgres');
// 'postgresql://localhost:5432'

// Pattern matching
const matchingItems = dbRegistry.getItemNamesLike('my*');
// ['mysql']

// With callback (waits for registration if needed)
dbRegistry.waitForItemByName('postgres', (item) => {
  console.log('Postgres registered:', item);
});

// Ensure items exist
dbRegistry.ensureItems(['postgres', 'mysql']);

// Get longest prefix match (useful for command routing)
dbRegistry.register('db connect', 'connection-string');
const match = dbRegistry.getLongestPrefixMatch('db connect server1');
// { key: 'db connect', item: 'connection-string', remainder: 'server1' }

// Using TypedRegistry
interface Database {
  connect(): void;
}

class PostgresDatabase implements Database {
  connect() { /* ... */ }
}

class MySqlDatabase implements Database {
  connect() { /* ... */ }
}

const typedRegistry = new TypedRegistry<Database>();
typedRegistry.register(PostgresDatabase, MySqlDatabase);

const db = typedRegistry.getItemByType(PostgresDatabase);
db.connect();
```

### Timer Utilities

```typescript
import { throttle, debounce } from '@tokenring-ai/utility/timer';

// Throttle example - limit function calls to once per second
const throttledApiCall = throttle(async (param: string) => {
  console.log('API call with:', param);
});

throttledApiCall(1000, 'param1'); // Executes immediately
throttledApiCall(1000, 'param2'); // Will be ignored
throttledApiCall(1000, 'param3'); // Will be ignored

// With zero minWait, executes immediately
throttledApiCall(0, 'Immediate'); // Executes immediately

// Debounce example - delay execution until user stops typing
const debouncedSearch = debounce(async (query: string) => {
  console.log('Performing search for:', query);
  // Call search API
}, 300);

debouncedSearch('react');
debouncedSearch('react hooks'); // Cancels previous call
debouncedSearch('react components'); // Cancels previous call
// Output after 300ms: 'Performing search for: react components'
```

### HTTP Service Integration

```typescript
import { HttpService } from '@tokenring-ai/utility/http/HttpService';

class GitHubApi extends HttpService {
  protected baseUrl = 'https://api.github.com';
  protected defaultHeaders = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TokenRing-App'
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

### Promise Utilities

```typescript
import { abandon, waitForAbort, backoff } from '@tokenring-ai/utility/promise';

// Abandon promise to prevent unhandled rejection warning
const fetchPromise = fetch('https://api.example.com/data');
abandon(fetchPromise);

// Wait for abort signal
const controller = new AbortController();
const signal = controller.signal;

const result = await waitForAbort(signal, (ev) => {
  console.log('Aborted:', ev);
  return Promise.resolve('aborted');
});

// Exponential backoff with retry
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

### Buffer Detection

```typescript
import isBinaryData from '@tokenring-ai/utility/buffer/isBinaryData';
import fs from 'fs';

// Check if a file is binary
const buffer = fs.readFileSync('image.png');
const isBinary = isBinaryData(buffer);
console.log('Is binary:', isBinary);

const textBuffer = Buffer.from('hello world', 'utf-8');
const isText = isBinaryData(textBuffer);
console.log('Is text:', isText);
```

## Configuration

### TableOptions for `createAsciiTable`

```typescript
interface TableOptions {
  columnWidths: number[];     // Width for each column
  padding?: number;           // Padding between content and borders (default: 0)
  header?: string[];          // Optional header row
  grid?: boolean;             // Whether to draw table borders (default: false)
}
```

### BackoffOptions for `backoff`

```typescript
interface BackoffOptions {
  times: number;              // Number of retry attempts
  interval: number;           // Initial delay in milliseconds
  multiplier: number;         // Multiplier for exponential backoff
}
```

## Integration

The utility package is designed to be used as a foundational dependency across the Token Ring ecosystem. It can be integrated into any package or application that requires common utility functions.

### Service Integration

```typescript
import { HttpService } from '@tokenring-ai/utility/http/HttpService';
import KeyedRegistry from '@tokenring-ai/utility/registry/KeyedRegistry';

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

### Registry Pattern with Callbacks

```typescript
import KeyedRegistry from '@tokenring-ai/utility/registry/KeyedRegistry';

// Registry with callback support for async initialization
const pluginRegistry = new KeyedRegistry<Plugin>();

// Register plugins
pluginRegistry.register('plugin-a', pluginA);
pluginRegistry.register('plugin-b', pluginB);

// Wait for plugin to be registered (useful for async initialization)
pluginRegistry.waitForItemByName('plugin-a', (plugin) => {
  console.log('Plugin A is ready:', plugin);
  // Use plugin
});

// If the item already exists, callback is called immediately
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
- Use `indent`, `markdownList`, and `numberedList` for formatted output
- Use `wrapText` for text wrapping in tables and displays
- Use `shellEscape` for safely executing shell commands with user input
- Use `convertBoolean` for parsing configuration values
- Use `dedupe` to remove duplicates from arrays
- Use `like` for prefix-based string matching

## Testing

The package uses vitest for unit testing. Run tests with:

```bash
bun test
bun test:watch
bun test:coverage
```

### Example Test

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

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent`: ^0.2.0

### Development Dependencies

- `vitest`: ^4.0.18
- `typescript`: ^5.9.3

## Related Components

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/rpc`: RPC service management
- `@tokenring-ai/chat`: Chat interface

## Notes

- This package is designed to be dependency-free except for core Token Ring packages
- All utilities are type-safe and tested with vitest
- The package follows the Token Ring documentation standards
- Utilities are organized into logical modules for easy import
- Consider the specific needs of your application when choosing utilities
- Error handling is built into most utilities for robustness
- The registry pattern is particularly useful for service management in the Token Ring ecosystem
- Timer utilities help manage performance and prevent excessive API calls
- String utilities provide comprehensive formatting options for CLI and web interfaces
- Object utilities support both simple and complex transformation scenarios

## Development

### Build

```bash
bun build
```

This runs TypeScript type checking without emitting files.

### Dependencies

```bash
bun install
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
