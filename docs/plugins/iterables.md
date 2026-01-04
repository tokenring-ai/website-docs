# Iterables Plugin

The Iterables plugin provides a comprehensive system for managing named iterables and processing collections with customizable providers.

## Overview

The Iterables plugin enables efficient batch processing of data collections through a flexible provider architecture. It allows agents to define, manage, and process iterables (collections of items) using various data sources like files, JSON, and other custom providers.

## Key Features

- **Named Iterable Management**: Define and manage reusable collections with descriptive names
- **Provider Architecture**: Support for multiple data sources through pluggable providers
- **Batch Processing**: Process entire collections with custom prompts using `/foreach`
- **State Management**: Persistent iterable definitions across agent sessions
- **Template Variables**: Dynamic variable substitution in prompts using `{variable}` syntax
- **Checkpoint Preservation**: Maintains state between iterations for consistent processing
- **Error Isolation**: Individual item failures don't stop batch processing
- **Streaming Generation**: Efficient memory usage with async generators

## Installation

```bash
bun install @tokenring-ai/iterables
```

## Package Structure

```
pkg/iterables/
├── index.ts                 # Main exports
├── plugin.ts                # Plugin definition for TokenRing integration
├── IterableService.ts       # Core service implementation
├── IterableProvider.ts      # Provider interface and types
├── state/
│   └── iterableState.ts     # State management for iterables
├── commands/
│   ├── iterable.ts          # /iterable command implementation
│   └── foreach.ts           # /foreach command implementation
├── chatCommands.ts          # Command exports
└── LICENSE
```

## Core Components

### IterableService

Main service that manages iterable definitions and provides the core API.

```typescript
class IterableService implements TokenRingService {
  name = "IterableService";
  description = "Manages named iterables for batch operations";

  registerProvider(provider: IterableProvider): void;
  getProvider(type: string): IterableProvider | undefined;

  async define(name: string, type: string, spec: IterableSpec, agent: Agent): Promise<void>;
  get(name: string, agent: Agent): StoredIterable | undefined;
  list(agent: Agent): StoredIterable[];
  delete(name: string, agent: Agent): boolean;
  async* generate(name: string, agent: Agent): AsyncGenerator<IterableItem>;
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `registerProvider(type, provider)` | Register a new provider type |
| `getProvider(type)` | Get a provider by type name |
| `define(name, type, spec, agent)` | Create a new iterable |
| `get(name, agent)` | Retrieve an iterable by name |
| `list(agent)` | List all defined iterables |
| `delete(name, agent)` | Remove an iterable |
| `generate(name, agent)` | Generate items from an iterable as async generator |

### IterableProvider Interface

Defines the contract for iterable providers that can generate items from various data sources.

```typescript
interface IterableProvider {
  readonly type: string;
  readonly description: string;

  getArgsConfig(): { options: Record<string, { type: 'string' | 'boolean', multiple?: boolean }> };
  generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem>;
}
```

#### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Unique identifier for the provider type |
| `description` | `string` | Human-readable description |

#### Required Methods

| Method | Description |
|--------|-------------|
| `getArgsConfig()` | Define command-line arguments for configuration |
| `generate(spec, agent)` | Generate iterable items asynchronously |

#### IterableItem Interface

Items yielded by providers:

```typescript
interface IterableItem {
  value: any;                    // Raw item data
  variables: Record<string, any>; // Variables for prompt interpolation
}
```

#### IterableSpec Interface

Configuration parameters for an iterable:

```typescript
interface IterableSpec {
  [key: string]: any;           // Provider-specific configuration
}
```

#### StoredIterable Interface

Stored iterable definitions:

```typescript
interface StoredIterable {
  name: string;
  type: string;
  spec: IterableSpec;
  createdAt: Date;
  updatedAt: Date;
}
```

### IterableState

State management class for persisting iterable definitions:

```typescript
class IterableState implements AgentStateSlice {
  name = "IterableState";
  iterables: Map<string, StoredIterable> = new Map();

  constructor({iterables?: StoredIterable[]});
  reset(what: ResetWhat[]): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
}
```

## Chat Commands

### `/iterable` - Manage Named Iterables

Manage named iterables - collections of data that can be processed iteratively.

#### Commands

| Command | Description |
|---------|-------------|
| `define <name> --type <type> [options]` | Create a new iterable |
| `list` | Show all defined iterables |
| `show <name>` | Display detailed information about an iterable |
| `delete <name>` | Remove a defined iterable |

#### Usage Examples

```bash
# Define a file-based iterable
/iterable define ts-files --type file --pattern "src/**/*.ts" --description "TypeScript source files"

# Define a JSON iterable with array path
/iterable define projects --type json --file "data/projects.json" --arrayPath "projects" --description "Project data collection"

# List all iterables
/iterable list

# Show details of a specific iterable
/iterable show ts-files

# Delete an iterable
/iterable delete old-projects
```

#### Define Command Options

| Option | Type | Description |
|--------|------|-------------|
| `--type` | string | Required. Provider type to use |
| `--description` | string | Optional description |

### `/foreach @<iterable> <prompt>` - Process Each Item

Run a prompt on each item in an iterable.

#### Usage

```bash
/foreach @<iterable> <prompt>
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `@<iterable>` | Name of the iterable to process (prefixed with @) |
| `<prompt>` | Template prompt to execute for each item |

#### Prompt Template Variables

| Syntax | Description |
|--------|-------------|
| `{variable}` | Access item properties |
| `{variable:default}` | Access with fallback value |
| `{nested.value}` | Nested property access |

#### Examples

```bash
# Process files in the 'ts-files' iterable
/foreach @ts-files "Add JSDoc comments to {file}"

# Process users with custom welcome messages
/foreach @users "Welcome {name} from {city} to our platform"

# Process projects with fallback descriptions
/foreach @projects "Review {name}: {description:No description available}"

# Access nested properties with fallback
/foreach @data "Process {nested.value:default value}"

# Process with item index
/foreach @files "File {index}: {file} (size: {size} bytes)"
```

## Common Iterable Types

### File Provider

Process files matching specified patterns.

**Configuration:**

| Option | Type | Description |
|--------|------|-------------|
| `pattern` | string | File matching pattern (e.g., `**/*.ts`) |
| `directory` | string | Base directory for file search (optional) |
| `recursive` | boolean | Include subdirectories (optional) |
| `description` | string | Optional description |

**Example:**

```bash
/iterable define ts-files --type file --pattern "**/*.ts" --directory "src" --recursive
```

### JSON Provider

Process items from JSON files.

**Configuration:**

| Option | Type | Description |
|--------|------|-------------|
| `file` | string | Path to JSON file |
| `arrayPath` | string | JSONPath to specific array (e.g., `data.items`) |
| `description` | string | Optional description |

**Example:**

```bash
/iterable define projects --type json --file "data/projects.json" --arrayPath "projects"
```

## Programmatic Usage

### Service Integration

```typescript
import { Agent } from '@tokenring-ai/agent';
import IterableService from '@tokenring-ai/iterables/IterableService';

// Create agent with IterableService
const service = new IterableService();
agent.attach(service);

// Define an iterable programmatically
await service.define('files', 'file', {
  pattern: '**/*.ts'
}, agent);

// Generate and process items
for await (const item of service.generate('files', agent)) {
  console.log('Processing:', item.variables.file);
}
```

### Custom Provider Creation

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import {IterableItem, IterableProvider, IterableSpec} from "@tokenring-ai/iterables";

export default class CustomProvider implements IterableProvider {
  readonly type = 'custom';
  readonly description = 'Custom data source';

  getArgsConfig() {
    return {
      options: {
        source: { type: 'string' as const },
        limit: { type: 'string' as const, multiple: true },
      }
    };
  }

  async* generate(spec: IterableSpec, agent: Agent): AsyncGenerator<IterableItem> {
    const source = spec.source;
    const limit = spec.limit;

    // Implementation to generate items
    yield { value: 'item1', variables: { custom: 'value1' } };
    yield { value: 'item2', variables: { custom: 'value2' } };
  }
}

// Register the provider
service.registerProvider('custom', new CustomProvider());
```

### Plugin Configuration

The iterables plugin uses a minimal configuration schema:

```typescript
import {z} from "zod";

const packageConfigSchema = z.object({});
```

No configuration is required by default. The plugin automatically:

1. Registers chat commands (`/iterable` and `/foreach`)
2. Adds the IterableService to the application
3. Initializes the IterableState for each agent

## State Management

Iterables are stored in agent state and persist across sessions. The `IterableState` class manages:

- `iterables: Map<string, StoredIterable>`: Collection of defined iterables
- Automatic serialization/deserialization
- State preservation during agent resets
- Checkpoint generation and recovery

### State Persistence

```typescript
// Iterables persist across resets
const resetTypes: ResetWhat[] = ['memory', 'filesystem'];
state.reset(resetTypes);

// Serialize state
const serialized = state.serialize();
// { iterables: [...] }

// Deserialize state
state.deserialize(serialized);
```

## Error Handling

Common error scenarios:

| Error | Description |
|-------|-------------|
| `Unknown iterable type: {type}` | Provider not registered |
| `Iterable not found: {name}` | Name doesn't exist |
| `Usage: /iterable define <name> --type <type> [options]` | Missing required parameters |
| `Error processing item {n}: {error}` | Individual item processing failures |
| `Generation failed` | Provider generation errors |

## Integration Patterns

### With Other Plugins

The iterables plugin integrates seamlessly with:

- **Chat services** for prompt execution via `/foreach`
- **Agent services** for state management
- **Command services** for chat command registration

### Typical Workflow

1. Define iterables using `/iterable define`
2. Process collections using `/foreach`
3. Maintain state across multiple processing sessions

### Integration with Agent System

```typescript
// In your plugin
import {AgentCommandService} from "@tokenring-ai/agent";
import IterableService from "./IterableService";

export default {
  name: '@tokenring-ai/iterables',
  install(app, config) {
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.addServices(new IterableService());
  },
} satisfies TokenRingPlugin;
```

## Development

### Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

### Build

```bash
bun run build
```

### Example: Database Provider

```typescript
export default class SqlIterableProvider implements IterableProvider {
  readonly type = "sql";
  readonly description = "Iterate over SQL query results";

  getArgsConfig() {
    return {
      options: {
        query: { type: 'string' as const },
        database: { type: 'string' as const }
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

**Usage:**

```bash
/iterable define users --type sql --query "SELECT * FROM users WHERE active=1"
/foreach @users "Send email to {email} for user {name}"
```

## Common Use Cases

- **Code analysis and refactoring** across multiple files
- **Data processing and transformation** on structured datasets
- **Content generation** for multiple items
- **Batch operations** on database results
- **API data processing** from multiple endpoints

## Performance Considerations

- **Streaming processing**: Items are processed one at a time to minimize memory usage
- **State checkpoints**: Maintains state between iterations for consistency
- **Error isolation**: Errors in one item don't affect others
- **Provider efficiency**: Providers should implement efficient data access patterns

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
