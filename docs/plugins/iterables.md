# @tokenring-ai/iterables

## Overview

The `@tokenring-ai/iterables` package provides a pluggable system for defining and using named iterables in TokenRing. Iterables are reusable data sources that can be used with the `/foreach` command to batch process items across various data types and sources.

This package implements a provider-based architecture where different iterable types can be registered to handle various data sources (files, JSON, CSV, APIs, database queries, etc.). It integrates seamlessly with the Token Ring agent system to provide state persistence and checkpoint recovery during batch operations.

## Key Features

- **Named Iterable Management**: Define, list, show, and delete named iterables with persistent state
- **Provider Architecture**: Register custom iterable providers for different data sources
- **Chat Commands**: `/iterable` and `/foreach` commands for managing and processing iterables
- **Template Interpolation**: Support for variable interpolation in prompts using `{variable}` syntax
- **State Persistence**: Iterables are persisted across sessions using the agent's state system
- **Checkpoint Recovery**: Automatic checkpoint creation and restoration during batch processing
- **Error Handling**: Graceful error handling with recovery during batch operations
- **Streaming Processing**: Items are processed one at a time to minimize memory usage

## Core Components

### IterableService

The central service that manages all iterable operations:

```typescript
class IterableService implements TokenRingService {
  readonly name = "IterableService";
  description = "Manages named iterables for batch operations";

  // Provider registry
  registerProvider: (provider: IterableProvider) => void;
  getProvider: (type: string) => IterableProvider | undefined;

  // Iterable management
  define(name: string, type: string, spec: IterableSpec, agent: Agent): Promise<void>;
  get(name: string, agent: Agent): StoredIterable | undefined;
  list(agent: Agent): StoredIterable[];
  delete(name: string, agent: Agent): boolean;

  // Iterable generation
  generate(name: string, agent: Agent): AsyncGenerator<IterableItem>;
}
```

### IterableProvider Interface

Interface for implementing custom iterable providers:

```typescript
interface IterableProvider {
  readonly type: string;
  readonly description: string;

  getArgsConfig(): {
    options: Record<string, { type: 'string' | 'boolean', multiple?: boolean }>;
  };

  generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem>;
}
```

### IterableState

State slice that persists iterable definitions across sessions:

```typescript
class IterableState implements AgentStateSlice<typeof serializationSchema> {
  readonly name = "IterableState";
  serializationSchema = serializationSchema;
  iterables: Map<string, StoredIterable> = new Map();

  constructor({iterables = []}: { iterables?: StoredIterable[] } = {});
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

### Type Definitions

#### StoredIterable

```typescript
interface StoredIterable {
  name: string;
  type: string;
  spec: IterableSpec;
  createdAt: Date;
  updatedAt: Date;
}
```

#### IterableItem

```typescript
interface IterableItem {
  value: any;
  variables: Record<string, any>;
}
```

#### IterableSpec

```typescript
interface IterableSpec {
  [key: string]: any;
}
```

## Services

### IterableService

The main service for managing iterables. Implements `TokenRingService` interface.

#### Provider Registration

Register custom iterable providers with the service. The provider's `type` property is used as the key:

```typescript
app.addServices(new IterableService());
iterableService.registerProvider(fileProvider); // Provider must have type: 'file'
```

#### Define Iterables

Create named iterables with specific types and specifications:

```typescript
await iterableService.define('files', 'file', {
  pattern: '*.ts',
  directory: 'src'
}, agent);
```

#### List Iterables

Retrieve all defined iterables:

```typescript
const iterables = iterableService.list(agent);
// Returns: StoredIterable[]
```

#### Get Iterable Details

Retrieve a specific iterable by name:

```typescript
const iterable = iterableService.get('files', agent);
// Returns: StoredIterable | undefined
```

#### Delete Iterables

Remove a defined iterable:

```typescript
const deleted = iterableService.delete('files', agent);
// Returns: boolean (true if deleted, false if not found)
```

#### Generate Iterable Items

Process items from an iterable using an async generator:

```typescript
for await (const item of iterableService.generate('files', agent)) {
  console.log(item.value);
  console.log(item.variables);
}
```

## Provider Documentation

### Provider Interface

All iterable providers must implement the `IterableProvider` interface:

```typescript
interface IterableProvider {
  readonly type: string; // Unique identifier for this provider type
  readonly description: string; // Human-readable description

  getArgsConfig(): {
    options: Record<string, {
      type: 'string' | 'boolean';
      multiple?: boolean;
    }>;
  }; // Configuration schema for this provider

  generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem>; // Generate items
}
```

### Provider Implementation Example

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import {IterableItem, IterableProvider, IterableSpec} from "@tokenring-ai/iterables";
import * as path from 'path';

class FileIterableProvider implements IterableProvider {
  readonly type = 'file';
  readonly description = 'File-based iterable provider';

  getArgsConfig() {
    return {
      options: {
        pattern: { type: 'string' },
        directory: { type: 'string' },
        recursive: { type: 'boolean' }
      }
    };
  }

  async *generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem> {
    // Implementation that yields IterableItem objects
    const pattern = spec.pattern as string || '*.txt';
    const directory = spec.directory as string || '.';
    const files = await findFiles(pattern, directory, spec.recursive as boolean);

    for (const file of files) {
      yield {
        value: file,
        variables: {
          file,
          basename: path.basename(file),
          ext: path.extname(file),
          directory
        }
      };
    }
  }
}
```

### Provider Registration

#### Plugin Registration

Register providers through the plugin system. The plugin automatically adds the IterableService:

```typescript
// In plugin.ts
import IterableService from './IterableService.ts';

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  install(app, config) {
    app.addServices(new IterableService());
    // Register additional providers here if needed
  }
};
```

#### Programmatic Registration

Register providers directly with the service:

```typescript
const service = new IterableService();
service.registerProvider(new FileIterableProvider());
```

#### KeyedRegistry Pattern

The IterableService uses a `KeyedRegistry` to manage providers. Each provider is registered with its `type` property as the key:

```typescript
class IterableService implements TokenRingService {
  private providers = new KeyedRegistry<IterableProvider>();
  registerProvider = this.providers.register;
  getProvider = this.providers.getItemByName;
}
```

### Provider Guidelines

#### getArgsConfig()

Return an object with `options` defining accepted arguments:

```typescript
getArgsConfig() {
  return {
    options: {
      // String argument
      name: {type: 'string'},

      // Boolean flag
      enabled: {type: 'boolean'},

      // Multiple values
      tags: {type: 'string', multiple: true}
    }
  };
}
```

#### generate()

- Return an `AsyncGenerator<IterableItem>`
- Each item must have `value` and `variables`
- `value` is the raw item data
- `variables` are exposed for prompt interpolation
- Access spec parameters directly: `spec.paramName`

#### Variables Best Practices

- Provide intuitive variable names
- Include both raw and formatted versions (e.g., `{date}` and `{dateFormatted}`)
- Document available variables in provider description
- Keep variable names consistent across similar providers

### Example: Database Provider

```typescript
export default class SqlIterableProvider implements IterableProvider {
  type = "sql";
  description = "Iterate over SQL query results";

  getArgsConfig() {
    return {
      options: {
        query: {type: 'string'},
        database: {type: 'string'}
      }
    };
  }

  async* generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem> {
    const dbService = agent.requireServiceByType(DatabaseService);
    const db = dbService.getDatabase(spec.database || 'default');

    const rows = await db.query(spec.query);

    for (let i = 0; i < rows.length; i++) {
      yield {
        value: rows[i],
        variables: {
          row: rows[i],
          rowNumber: i + 1,
          totalRows: rows.length,
          ...rows[i]  // Flatten columns as variables
        }
      };
    }
  }
}
```

Usage:

```bash
/iterable define users --type sql --query "SELECT * FROM users WHERE active=1"
/foreach @users "Send email to {email} for user {name}"
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

### /iterable - Manage Named Iterables

The `/iterable` command provides subcommands for managing iterables:

#### `/iterable define <name> --type <type> [options]`

Create a new iterable with specified type and configuration.

**Syntax:**
```
/iterable define <name> --type <type> [provider-options]
```

**Arguments:**
- `<name>`: Unique name for the iterable
- `--type <type>`: The iterable provider type to use (required)
- `[provider-options]`: Provider-specific options (e.g., `--pattern`, `--file`)

**Examples:**
```
/iterable define files --type file --pattern "**/*.ts"
/iterable define projects --type json --file "projects.json"
```

**Error Handling:**
- Throws `CommandFailedError` if name is missing
- Throws `CommandFailedError` if `--type` is missing or invalid
- Throws `CommandFailedError` if provider is not found

#### `/iterable list`

Show all defined iterables with their types.

**Example:**
```
/iterable list
```

**Output:**
```
Available iterables:
 - @files = file
 - @users = json
```

#### `/iterable show <name>`

Display detailed information about a specific iterable.

**Syntax:**
```
/iterable show <name>
```

**Arguments:**
- `<name>`: Name of the iterable to show

**Example:**
```
/iterable show files
```

**Output:**
```
Iterable: @files
Type: file
Spec: {
  "pattern": "**/*.ts",
  "directory": "src"
}
Created: 2024-01-01T00:00:00.000Z
Updated: 2024-01-01T00:00:00.000Z
```

**Error Handling:**
- Throws `CommandFailedError` if name is missing
- Throws `CommandFailedError` if iterable is not found

#### `/iterable delete <name>`

Remove a defined iterable permanently.

**Syntax:**
```
/iterable delete <name>
```

**Arguments:**
- `<name>`: Name of the iterable to delete

**Example:**
```
/iterable delete old-projects
```

**Error Handling:**
- Throws `CommandFailedError` if name is missing
- Throws `CommandFailedError` if iterable is not found

### /foreach - Process Iterables with Prompts

The `/foreach` command processes each item in an iterable with a custom prompt:

#### `/foreach @<iterable> <prompt>`

Process each item in an iterable with a template prompt.

**Syntax:**
```
/foreach @<iterable> <prompt>
```

**Arguments:**
- `@<iterable>`: Name of the iterable to process (prefixed with @)
- `<prompt>`: Template prompt to execute for each item

**Variable Interpolation:**
- `{variable}` - Access item properties
- `{variable:default}` - Fallback values for missing properties
- `{nested.property}` - Access nested properties with dot notation
- `{nested.property:default}` - Combine nested access with fallbacks

**Examples:**
```
/foreach @files "Add comments to {file}"
/foreach @users "Welcome {name} from {city}"
/foreach @projects "Review {name}: {description:No description}"
/foreach @data "Process {nested.value:default}"
```

**Common Use Cases:**
- Code analysis and refactoring across multiple files
- Data processing and transformation
- Content generation for multiple items
- Batch operations on structured data

**Important Notes:**
- The command maintains checkpoint state between iterations and restores it after processing each item
- If an error occurs during processing of an item, a `CommandFailedError` is thrown with the error message
- The final state is restored after all items are processed in the `finally` block

**Error Handling:**
- Throws `CommandFailedError` if remainder is empty
- Throws `CommandFailedError` if iterable name is not prefixed with @
- Throws `CommandFailedError` if prompt is missing
- Throws `CommandFailedError` if error occurs during item processing

## Configuration

This package does not require any plugin configuration. The package configuration schema is empty:

```typescript
import {z} from "zod";

const packageConfigSchema = z.object({});
```

No configuration is required by default. The plugin automatically:
1. Registers chat commands (`/iterable` and `/foreach`)
2. Adds the IterableService to the application
3. Initializes the IterableState for each agent

## Integration

### Integration with Agent System

The package integrates with the Token Ring agent system by:

1. **State Management**: Registers `IterableState` as an agent state slice for persistence
2. **Command Registration**: Registers chat commands with `AgentCommandService`
3. **Service Registration**: Implements `TokenRingService` for integration with the app framework

### Plugin Installation

Install the plugin in your application:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import iterablesPlugin from "@tokenring-ai/iterables";

const app = new TokenRingApp();
app.use(iterablesPlugin);
```

### Service Registration

The plugin automatically registers the `IterableService`:

```typescript
// In plugin.ts
import IterableService from "./IterableService.ts";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  install(app, config) {
    app.addServices(new IterableService());
  }
};
```

### Command Registration

The plugin registers the following commands with `AgentCommandService`:

```typescript
// In plugin.ts
import agentCommands from "./commands.ts";

export default {
  install(app, config) {
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(agentCommands)
    );
  }
};
```

### State Persistence

Iterables are persisted across sessions using the agent's state system:

```typescript
agent.initializeState(IterableState, {});
agent.mutateState(IterableState, (state) => {
  state.iterables.set(name, iterable);
});
```

### Checkpoint Recovery

The `/foreach` command uses checkpoint recovery to ensure consistent state:

```typescript
const checkpoint = agent.generateCheckpoint();

try {
  for await (const item of iterableService.generate(iterableName, agent)) {
    // Process item with interpolated prompt
    const interpolatedPrompt = interpolate(prompt, item.variables);
    await runChat({ input: interpolatedPrompt, chatConfig, agent});

    // Restore state before next iteration
    agent.restoreState(checkpoint.state);
  }
} finally {
  // Restore final state
  agent.restoreState(checkpoint.state);
}
```

### Variable Interpolation

The `/foreach` command supports variable interpolation using the following syntax:

```typescript
function interpolate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{([^}:]+)(?::([^}]*))?}/g, (match, key, defaultValue) => {
    const value = getNestedProperty(variables, key);
    return value !== undefined ? String(value) : (defaultValue || match);
  });
}

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}
```

**Interpolation Features:**
- **Simple variables**: `{variable}`
- **Default values**: `{variable:default}`
- **Nested properties**: `{user.name}`
- **Mixed**: `{nested.value:fallback}`

## Usage Examples

### Basic Iterable Definition and Processing

```typescript
import TokenRingApp from "@tokenring-ai/app";
import IterableService from "@tokenring-ai/iterables";
import Agent from "@tokenring-ai/agent";

const app = new TokenRingApp();
const service = new IterableService();
app.addServices(service);

// Register a provider
service.registerProvider({
  type: 'static',
  description: 'Static iterable provider',
  getArgsConfig: () => ({ options: {} }),
  async *generate(spec, agent) {
    yield { value: 'item1', variables: { name: 'Item 1' } };
    yield { value: 'item2', variables: { name: 'Item 2' } };
  }
});

// Define an iterable
await service.define('items', 'static', {}, agent);

// Process the iterable
for await (const item of service.generate('items', agent)) {
  console.log(item.value); // 'item1', 'item2'
  console.log(item.variables.name); // 'Item 1', 'Item 2'
}

// List all iterables
const iterables = service.list(agent);
console.log(iterables); // [{ name: 'items', type: 'static', ... }]
```

### Custom Provider Implementation

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import {IterableItem, IterableProvider, IterableSpec} from "@tokenring-ai/iterables";
import * as path from 'path';

class FileIterableProvider implements IterableProvider {
  readonly type = 'file';
  readonly description = 'File-based iterable provider';

  getArgsConfig() {
    return {
      options: {
        pattern: { type: 'string' },
        directory: { type: 'string' },
        recursive: { type: 'boolean' }
      }
    };
  }

  async *generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem> {
    const pattern = spec.pattern as string || '*.txt';
    const directory = spec.directory as string || '.';
    const files = await findFiles(pattern, directory, spec.recursive as boolean);

    for (const file of files) {
      yield {
        value: file,
        variables: {
          file,
          basename: path.basename(file),
          ext: path.extname(file),
          directory
        }
      };
    }
  }
}

// Register the provider
service.registerProvider(new FileIterableProvider());

// Use the provider
await service.define('sourceFiles', 'file', {
  pattern: '*.ts',
  directory: 'src',
  recursive: true
}, agent);
```

### Batch Processing with /foreach

```typescript
// Define a JSON iterable
await service.define('users', 'json', {
  file: 'users.json',
  arrayPath: 'data'
}, agent);

// Process users with a prompt
await chatService.executeCommand('/foreach @users "Send welcome email to {name} at {email}"', agent);
```

### Complex Variable Interpolation

```typescript
// With nested properties and fallbacks
/foreach @projects "Project: {name}, Status: {status:Unknown}, Owner: {owner.name:Unassigned}"
```

### Error Handling

```typescript
try {
  await service.define('test', 'unknown', {}, agent);
} catch (error) {
  console.error(error.message); // "Unknown iterable type: unknown"
}

try {
  for await (const item of service.generate('nonexistent', agent)) {
    // ...
  }
} catch (error) {
  console.error(error.message); // "Iterable not found: nonexistent"
}
```

## Best Practices

1. **Provider Naming**: Use clear, descriptive provider names that reflect their purpose
2. **Spec Structure**: Design provider specs to be flexible and extensible
3. **Variable Names**: Use intuitive variable names in provider implementations
4. **Error Handling**: Always handle errors gracefully in provider implementations
5. **Checkpoint Management**: The framework handles checkpoints automatically - don't manually manage them in provider code
6. **Iterable Lifecycle**: Define iterables before processing them with `/foreach`
7. **State Persistence**: Understand that iterables persist across sessions
8. **Naming Conventions**: Use meaningful names for iterables that describe their content
9. **Sequential Processing**: Items are processed one at a time to minimize memory usage
10. **Template Design**: Use clear, descriptive variable names in prompt templates

## Testing

The package includes comprehensive unit and integration tests using Vitest:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Type check
bun run build
```

### Test Files

- `test/commands.test.ts` - Unit tests for chat commands
- `test/integration.test.ts` - Integration tests for full workflows
- `test/IterableProvider.test.ts` - Provider-specific tests
- `test/IterableState.test.ts` - State management tests

### Testing Provider Implementations

```typescript
import {describe, it, expect} from 'vitest';
import IterableService from '../IterableService.ts';
import type {IterableProvider, IterableSpec} from '../IterableProvider.ts';
import Agent from '@tokenring-ai/agent/Agent';

class TestProvider implements IterableProvider {
  readonly type = 'test';
  readonly description = 'Test provider';

  getArgsConfig() {
    return { options: {} };
  }

  async *generate(spec, agent) {
    yield { value: 'test', variables: { data: 'value' } };
    yield { value: 'test2', variables: { data: 'value2' } };
  }
}

describe('IterableService', () => {
  it('should register and use a provider', async () => {
    const service = new IterableService();
    service.registerProvider(new TestProvider());

    const mockAgent = {
      initializeState: () => {},
      getState: () => ({ iterables: new Map() }),
      mutateState: () => {},
      requireServiceByType: () => service
    } as any;

    await service.define('test-iterable', 'test', {}, mockAgent);
    const items = [];
    for await (const item of service.generate('test-iterable', mockAgent)) {
      items.push(item);
    }

    expect(items).toHaveLength(2);
    expect(items[0].variables.data).toBe('value');
  });
});
```

## Performance Considerations

- **Streaming processing**: Items are processed one at a time to minimize memory usage
- **State checkpoints**: Maintains state between iterations for consistency
- **Error isolation**: Errors in one item can be handled without affecting others
- **Provider efficiency**: Providers should implement efficient data access patterns
- **Persistence**: Iterables are persisted across agent resets

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Core application framework
- `@tokenring-ai/agent` (0.2.0) - Agent system and state management
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/utility` (0.2.0) - Utility functions and providers
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- `@tokenring-ai/agent` - Agent system for state management and command execution
- `@tokenring-ai/chat` - Chat service for prompt execution
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/utility` - Utility functions including KeyedRegistry

## License

MIT License - see LICENSE file for details.
