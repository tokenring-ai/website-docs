# @tokenring-ai/iterables

## Overview

The `@tokenring-ai/iterables` package provides a framework for managing named iterables - collections of data that can be processed iteratively through batch operations. It enables users to define reusable iterable collections and process them with prompts using specialized chat commands.

This package implements a provider-based architecture where different iterable types can be registered to handle various data sources (files, JSON, CSV, APIs, etc.). It integrates seamlessly with the Token Ring agent system to provide state persistence and checkpoint recovery during batch operations.

## Key Features

- **Named Iterable Management**: Define, list, show, and delete named iterables with persistent state
- **Provider Architecture**: Register custom iterable providers for different data sources
- **Chat Commands**: `/iterable` and `/foreach` commands for managing and processing iterables
- **Template Interpolation**: Support for variable interpolation in prompts using `{variable}` syntax
- **State Persistence**: Iterables are persisted across sessions using the agent's state system
- **Checkpoint Recovery**: Automatic checkpoint creation and restoration during batch processing
- **Error Handling**: Graceful error handling with recovery during batch operations
- **Concurrent Processing**: Support for processing multiple iterables simultaneously

## Core Components

### IterableService

The central service that manages all iterable operations:

```typescript
class IterableService implements TokenRingService {
  readonly name = "IterableService";
  description = "Manages named iterables for batch operations";

  // Provider registry
  registerProvider: (type: string, provider: IterableProvider) => void;
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
class IterableState implements AgentStateSlice {
  readonly name = "IterableState";
  iterables: Map<string, StoredIterable>;

  serialize(): SerializedData;
  deserialize(data: SerializedData): void;
  show(): string[];
}
```

### StoredIterable Type

```typescript
interface StoredIterable {
  name: string;
  type: string;
  spec: IterableSpec;
  createdAt: Date;
  updatedAt: Date;
}
```

## Services

### IterableService

The main service for managing iterables:

#### Provider Registration

Register custom iterable providers with the service:

```typescript
app.addServices(new IterableService());
iterableService.registerProvider('file', fileProvider);
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

## Providers

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
    for (const file of findFiles(spec)) {
      yield {
        value: file,
        variables: {
          file,
          basename: path.basename(file),
          ext: path.extname(file)
        }
      };
    }
  }
}
```

### Provider Registration

#### Plugin Registration

Register providers through the plugin system:

```typescript
// In plugin.ts
app.addServices(new IterableService());
```

#### Programmatic Registration

Register providers directly:

```typescript
const service = new IterableService();
service.registerProvider('file', new FileIterableProvider());
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

### /iterable - Manage Named Iterables

The `/iterable` command provides subcommands for managing iterables:

#### /iterable define <name> --type <type> [options]

Create a new iterable with specified type and configuration.

**Examples:**
```
/iterable define files --type file --pattern "**/*.ts"
/iterable define projects --type json --file "projects.json" --description "My project list"
```

**Options:**
- `--type <type>`: The iterable provider type to use (required)
- Provider-specific options: Additional options depend on the provider type

#### /iterable list

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

#### /iterable show <name>

Display detailed information about a specific iterable.

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

#### /iterable delete <name>

Remove a defined iterable permanently.

**Example:**
```
/iterable delete old-projects
```

### /foreach - Process Iterables with Prompts

The `/foreach` command processes each item in an iterable with a custom prompt:

#### /foreach @<iterable> <prompt>

Process each item in an iterable with a template prompt.

**Syntax:**
- `@<iterable>`: Name of the iterable to process (prefixed with @)
- `<prompt>`: Template prompt to execute for each item

**Variable Interpolation:**
- `{variable}` - Access item properties
- `{variable:default}` - Fallback values for missing properties
- `{nested.property}` - Access nested properties with dot notation

**Examples:**
```
/foreach @files "Add comments to {file}"
/foreach @users "Welcome {name} from {city}"
/foreach @projects "Review {name}: {description:No description}"
/foreach @data "Process {nested.value:default}"
```

**Prompt Template Variables:**
- `{variable}` - Access item properties directly
- `{variable:default}` - Provide fallback values for missing properties
- `{nested.property}` - Access nested properties using dot notation
- `{nested.property:default}` - Combine nested access with fallbacks

**Common Use Cases:**
- Code analysis and refactoring across multiple files
- Data processing and transformation
- Content generation for multiple items
- Batch operations on structured data

**Important Notes:**
- The command maintains checkpoint state between iterations and restores it after processing each item
- If an error occurs during processing of an item, processing continues with the next item
- The final state is restored after all items are processed

## Configuration

This package does not require any plugin configuration. The package configuration schema is empty:

```typescript
const packageConfigSchema = z.object({});
```

## Integration

### Integration with Agent System

The package integrates with the Token Ring agent system by:

1. **State Management**: Registers `IterableState` as an agent state slice for persistence
2. **Command Registration**: Registers chat commands with `AgentCommandService`
3. **Service Registration**: Implements `TokenRingService` for integration with the app framework

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
    // Process item
    agent.restoreState(checkpoint.state); // Restore before each item
  }
} finally {
  agent.restoreState(checkpoint.state); // Restore final state
}
```

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
service.registerProvider('static', {
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
    const files = await findFiles(pattern, directory, spec.recursive);

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
service.registerProvider('file', new FileIterableProvider());

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

## Best Practices

1. **Provider Naming**: Use clear, descriptive provider names that reflect their purpose
2. **Spec Structure**: Design provider specs to be flexible and extensible
3. **Variable Names**: Use intuitive variable names in provider implementations
4. **Error Handling**: Always handle errors gracefully in provider implementations
5. **Checkpoint Management**: The framework handles checkpoints automatically - don't manually manage them in provider code
6. **Iterable Lifecycle**: Define iterables before processing them with `/foreach`
7. **State Persistence**: Understand that iterables persist across sessions
8. **Naming Conventions**: Use meaningful names for iterables that describe their content

## Testing

The package includes comprehensive unit and integration tests:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Files

- `test/commands.test.ts` - Unit tests for chat commands
- `test/integration.test.ts` - Integration tests for full workflows
- `test/IterableProvider.test.ts` - Provider-specific tests
- `test/IterableState.test.ts` - State management tests

### Testing Provider Implementations

```typescript
class TestProvider implements IterableProvider {
  readonly type = 'test';
  readonly description = 'Test provider';

  getArgsConfig() {
    return { options: {} };
  }

  async *generate(spec, agent) {
    yield { value: 'test', variables: { data: 'value' } };
  }
}

// Test provider registration and usage
service.registerProvider('test', new TestProvider());
await service.define('test-iterable', 'test', {}, agent);
const items = [];
for await (const item of service.generate('test-iterable', agent)) {
  items.push(item);
}
expect(items).toHaveLength(1);
```

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

## License

MIT License - see LICENSE file for details.