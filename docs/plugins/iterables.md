# Iterables Plugin

The Iterables plugin provides a comprehensive system for managing named iterables and processing collections with customizable providers.

## Overview

The Iterables plugin enables efficient batch processing of data collections through a flexible provider architecture. It allows agents to define, manage, and process iterables (collections of items) using various data sources like files, JSON, and other custom providers.

## Key Features

- **Named Iterable Management**: Define and manage reusable collections with descriptive names
- **Provider Architecture**: Support for multiple data sources through pluggable providers
- **Batch Processing**: Process entire collections with custom prompts using `/foreach`
- **State Management**: Persistent iterable definitions across agent sessions
- **Template Variables**: Dynamic variable substitution in prompts using `&#123;variable&#125;` syntax
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
class IterableService implements TokenRingService &#123;
  name = "IterableService";
  description = "Manages named iterables for batch operations";

  registerProvider(provider: IterableProvider): void;
  getProvider(type: string): IterableProvider | undefined;

  async define(name: string, type: string, spec: IterableSpec, agent: Agent): Promise&lt;void&gt;;
  get(name: string, agent: Agent): StoredIterable | undefined;
  list(agent: Agent): StoredIterable[];
  delete(name: string, agent: Agent): boolean;
  async* generate(name: string, agent: Agent): AsyncGenerator&lt;IterableItem&gt;;
&#125;
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
interface IterableProvider &#123;
  readonly type: string;
  readonly description: string;

  getArgsConfig(): &#123; options: Record&lt;string, &#123; type: 'string' | 'boolean', multiple?: boolean &#125;&gt; &#125;;
  generate(spec: IterableSpec, agent: Agent): AsyncGenerator&lt;IterableItem&gt;;
&#125;
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
interface IterableItem &#123;
  value: any;                    // Raw item data
  variables: Record&lt;string, any&gt;; // Variables for prompt interpolation
&#125;
```

#### IterableSpec Interface

Configuration parameters for an iterable:

```typescript
interface IterableSpec &#123;
  [key: string]: any;           // Provider-specific configuration
&#125;
```

#### StoredIterable Interface

Stored iterable definitions:

```typescript
interface StoredIterable &#123;
  name: string;
  type: string;
  spec: IterableSpec;
  createdAt: Date;
  updatedAt: Date;
&#125;
```

### IterableState

State management class for persisting iterable definitions:

```typescript
class IterableState implements AgentStateSlice &#123;
  name = "IterableState";
  iterables: Map&lt;string, StoredIterable&gt; = new Map();

  constructor(&#123;iterables?: StoredIterable[]&#125;);
  reset(what: ResetWhat[]): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
&#125;
```

## Chat Commands

### `/iterable` - Manage Named Iterables

Manage named iterables - collections of data that can be processed iteratively.

#### Commands

| Command | Description |
|---------|-------------|
| `define &lt;name&gt; --type &lt;type&gt; [options]` | Create a new iterable |
| `list` | Show all defined iterables |
| `show &lt;name&gt;` | Display detailed information about an iterable |
| `delete &lt;name&gt;` | Remove a defined iterable |

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

### `/foreach @&lt;iterable&gt; &lt;prompt&gt;` - Process Each Item

Run a prompt on each item in an iterable.

#### Usage

```bash
/foreach @&lt;iterable&gt; &lt;prompt&gt;
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `@&lt;iterable&gt;` | Name of the iterable to process (prefixed with @) |
| `&lt;prompt&gt;` | Template prompt to execute for each item |

#### Prompt Template Variables

| Syntax | Description |
|--------|-------------|
| `&#123;variable&#125;` | Access item properties |
| `&#123;variable:default&#125;` | Access with fallback value |
| `&#123;nested.value&#125;` | Nested property access |

#### Examples

```bash
# Process files in the 'ts-files' iterable
/foreach @ts-files "Add JSDoc comments to &#123;file&#125;"

# Process users with custom welcome messages
/foreach @users "Welcome &#123;name&#125; from &#123;city&#125; to our platform"

# Process projects with fallback descriptions
/foreach @projects "Review &#123;name&#125;: &#123;description:No description available&#125;"

# Access nested properties with fallback
/foreach @data "Process &#123;nested.value:default value&#125;"

# Process with item index
/foreach @files "File &#123;index&#125;: &#123;file&#125; (size: &#123;size&#125; bytes)"
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
import &#123; Agent &#125; from '@tokenring-ai/agent';
import IterableService from '@tokenring-ai/iterables/IterableService';

// Create agent with IterableService
const service = new IterableService();
agent.attach(service);

// Define an iterable programmatically
await service.define('files', 'file', &#123;
  pattern: '**/*.ts'
&#125;, agent);

// Generate and process items
for await (const item of service.generate('files', agent)) &#123;
  console.log('Processing:', item.variables.file);
&#125;
```

### Custom Provider Creation

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import &#123;IterableItem, IterableProvider, IterableSpec&#125; from "@tokenring-ai/iterables";

export default class CustomProvider implements IterableProvider &#123;
  readonly type = 'custom';
  readonly description = 'Custom data source';

  getArgsConfig() &#123;
    return &#123;
      options: &#123;
        source: &#123; type: 'string' as const &#125;,
        limit: &#123; type: 'string' as const, multiple: true &#125;,
      &#125;
    &#125;;
  &#125;

  async* generate(spec: IterableSpec, agent: Agent): AsyncGenerator&lt;IterableItem&gt; &#123;
    const source = spec.source;
    const limit = spec.limit;

    // Implementation to generate items
    yield &#123; value: 'item1', variables: &#123; custom: 'value1' &#125; &#125;;
    yield &#123; value: 'item2', variables: &#123; custom: 'value2' &#125; &#125;;
  &#125;
&#125;

// Register the provider
service.registerProvider('custom', new CustomProvider());
```

### Plugin Configuration

The iterables plugin uses a minimal configuration schema:

```typescript
import &#123;z&#125; from "zod";

const packageConfigSchema = z.object(&#123;&#125;);
```

No configuration is required by default. The plugin automatically:

1. Registers chat commands (`/iterable` and `/foreach`)
2. Adds the IterableService to the application
3. Initializes the IterableState for each agent

## State Management

Iterables are stored in agent state and persist across sessions. The `IterableState` class manages:

- `iterables: Map&lt;string, StoredIterable&gt;`: Collection of defined iterables
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
// &#123; iterables: [...] &#125;

// Deserialize state
state.deserialize(serialized);
```

## Error Handling

Common error scenarios:

| Error | Description |
|-------|-------------|
| `Unknown iterable type: &#123;type&#125;` | Provider not registered |
| `Iterable not found: &#123;name&#125;` | Name doesn't exist |
| `Usage: /iterable define &lt;name&gt; --type &lt;type&gt; [options]` | Missing required parameters |
| `Error processing item &#123;n&#125;: &#123;error&#125;` | Individual item processing failures |
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
import &#123;AgentCommandService&#125; from "@tokenring-ai/agent";
import IterableService from "./IterableService";

export default &#123;
  name: '@tokenring-ai/iterables',
  install(app, config) &#123;
    app.waitForService(AgentCommandService, agentCommandService =&gt;
      agentCommandService.addAgentCommands(chatCommands)
    );
    app.addServices(new IterableService());
  &#125;,
&#125; satisfies TokenRingPlugin;
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
export default class SqlIterableProvider implements IterableProvider &#123;
  readonly type = "sql";
  readonly description = "Iterate over SQL query results";

  getArgsConfig() &#123;
    return &#123;
      options: &#123;
        query: &#123; type: 'string' as const &#125;,
        database: &#123; type: 'string' as const &#125;
      &#125;
    &#125;;
  &#125;

  async* generate(spec: IterableSpec, agent: Agent): AsyncGenerator&lt;IterableItem&gt; &#123;
    const dbService = agent.requireServiceByType(DatabaseService);
    const db = dbService.getDatabase(spec.database || 'default');

    const rows = await db.query(spec.query);

    for (let i = 0; i &lt; rows.length; i++) &#123;
      yield &#123;
        value: rows[i],
        variables: &#123;
          row: rows[i],
          rowNumber: i + 1,
          totalRows: rows.length,
          ...rows[i]  // Flatten columns as variables
        &#125;
      &#125;;
    &#125;
  &#125;
&#125;
```

**Usage:**

```bash
/iterable define users --type sql --query "SELECT * FROM users WHERE active=1"
/foreach @users "Send email to &#123;email&#125; for user &#123;name&#125;"
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
