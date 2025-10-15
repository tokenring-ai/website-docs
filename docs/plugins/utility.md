# Utility Plugin

General-purpose helpers for promises, caching, logging, terminal output, and shell escaping.

## Overview

The `@tokenring-ai/utility` package provides a collection of general-purpose helpers used across the Token Ring ecosystem. It includes promise handling, in-memory caching with TTL, log formatting, colored terminal output, and safe shell argument escaping.

## Key Features

- **Promise Utilities**: Safely ignore promise outcomes without unhandled rejection warnings
- **Caching**: Lightweight in-memory cache with optional TTL per entry
- **Log Formatting**: Stringify mixed values and errors in readable format
- **Terminal Output**: Colored string helpers for info, success, error, and warning messages
- **Shell Escaping**: Safe argument escaping for POSIX-like shells

## Core Components

### abandon

Safely consume a promise's resolution/rejection to avoid unhandled rejection warnings.

**Usage:**
```typescript
import { abandon } from '@tokenring-ai/utility/abandon';

const p = fetch('https://example.com/api');
abandon(p); // consume resolution/rejection quietly
```

### Cache

In-memory cache with optional TTL per key.

**Key Methods:**
- `get(key): V | undefined`: Retrieve cached value
- `set(key, value, ttl?): void`: Store value with optional TTL (milliseconds)
- `getOrSet(key, factory, ttl?): Promise<V>`: Get or compute and cache
- `delete(key): void`: Remove entry
- `clear(): void`: Clear all entries

**Singleton Instance:**
```typescript
import cache, { Cache } from '@tokenring-ai/utility/cache';

// Use singleton
await cache.getOrSet('user:42', async () => {
  const user = await loadUserFromDb(42);
  return user;
}, 5_000); // cache for 5 seconds

// Or create isolated cache
const local = new Cache<number>();
local.set('answer', 42, 1_000);
console.log(local.get('answer')); // 42
```

### formatLogMessages

Stringify mixed values (including Error objects) into a readable single string.

**Usage:**
```typescript
import formatLogMessages from '@tokenring-ai/utility/formatLogMessage';

const output = formatLogMessages([
  'User loaded',
  { id: 1, name: 'Ada' },
  new Error('Oops')
]);
console.log(output);
```

### Pretty String Helpers

Colorize strings for terminal output (adds trailing newline).

**Functions:**
- `infoLine(text)`: Blue text for informational messages
- `successLine(text)`: Green text for success messages
- `errorLine(text)`: Red text for error messages
- `warningLine(text)`: Yellow text for warning messages

**Usage:**
```typescript
import { infoLine, successLine, errorLine, warningLine } from '@tokenring-ai/utility/prettyString';

process.stdout.write(infoLine('Starting…'));
process.stdout.write(successLine('Done'));
process.stdout.write(warningLine('Careful'));
process.stdout.write(errorLine('Something went wrong'));
```

### shellEscape

Escape a string for safe inclusion in shell commands.

**Usage:**
```typescript
import { shellEscape } from '@tokenring-ai/utility/shellEscape';

const file = "my file's name.txt";
const cmd = `cat ${shellEscape(file)}`;
// Produces: cat 'my file'\''s name.txt'
```

## Usage Examples

### Promise Handling

```typescript
import { abandon } from '@tokenring-ai/utility/abandon';

// Fire and forget without warnings
const backgroundTask = performLongOperation();
abandon(backgroundTask);
```

### Caching with TTL

```typescript
import cache from '@tokenring-ai/utility/cache';

// Cache expensive computation
const result = await cache.getOrSet('computation', async () => {
  return await expensiveComputation();
}, 60_000); // 1 minute TTL
```

### Log Formatting

```typescript
import formatLogMessages from '@tokenring-ai/utility/formatLogMessage';

try {
  // some operation
} catch (error) {
  const message = formatLogMessages(['Operation failed:', error]);
  console.error(message);
}
```

### Terminal Output

```typescript
import { successLine, errorLine } from '@tokenring-ai/utility/prettyString';

if (success) {
  process.stdout.write(successLine('Build completed successfully'));
} else {
  process.stdout.write(errorLine('Build failed'));
}
```

### Shell Command Building

```typescript
import { shellEscape } from '@tokenring-ai/utility/shellEscape';
import { exec } from 'child_process';

const filename = "user's file.txt";
const command = `cat ${shellEscape(filename)}`;
exec(command);
```

## Configuration Options

- **Cache TTL**: Specified per entry in milliseconds
- **Cache Cleanup**: Automatic cleanup on access and via setTimeout
- **ANSI Colors**: Standard terminal color codes (blue, green, red, yellow)
- **Shell Escaping**: POSIX-like shell syntax

## API Reference

### abandon
- `abandon(promise: Promise<any>): void`

### Cache
- `get(key: string): V | undefined`
- `set(key: string, value: V, ttl?: number): void`
- `getOrSet(key: string, factory: () => Promise<V>, ttl?: number): Promise<V>`
- `delete(key: string): void`
- `clear(): void`

### formatLogMessages
- `formatLogMessages(messages: unknown[]): string`

### prettyString
- `infoLine(text: string): string`
- `successLine(text: string): string`
- `errorLine(text: string): string`
- `warningLine(text: string): string`

### shellEscape
- `shellEscape(arg: string): string`

## Dependencies

No external dependencies - pure TypeScript utilities.

## Notes

- TTL cleanup happens on access and via setTimeout
- formatLogMessages includes Error name, message, and stack
- prettyString helpers add newline at end
- shellEscape uses single-quote wrapping with proper escaping
