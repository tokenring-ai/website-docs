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

## Core Components

### IterableService
Main service that manages iterable definitions and provides the core API.

#### Methods
- `define(name: string, type: string, spec: IterableSpec, agent: Agent)`: Create a new iterable
- `get(name: string, agent: Agent)`: Retrieve an iterable by name
- `list(agent: Agent)`: List all defined iterables
- `delete(name: string, agent: Agent)`: Remove an iterable
- `generate(name: string, agent: Agent)`: Generate items from an iterable
- `registerProvider(provider: IterableProvider)`: Add a new provider type

#### Properties
- `name: string = "IterableService"`: Service identifier
- `description: string = "Manages named iterables for batch operations"`: Service description

### IterableProvider Interface
Defines the contract for iterable providers that can generate items from various data sources.

#### Required Properties
- `type: string`: Unique identifier for the provider type
- `description: string`: Human-readable description

#### Required Methods
- `getArgsConfig()`: Define command-line arguments for configuration
- `generate(spec: IterableSpec, agent: Agent)`: Generate iterable items asynchronously

#### IterableItem Interface
Items yielded by providers:

```typescript
interface IterableItem {
  value: any;          // Raw item data
  variables: Record<string, any>; // Variables for prompt interpolation
}
```

#### IterableSpec Interface
Configuration parameters for an iterable:

```typescript
interface IterableSpec {
  [key: string]: any;  // Provider-specific configuration
}
```

### IterableState
State management class for persisting iterable definitions:

```typescript
class IterableState implements AgentStateSlice {
  name = "IterableState";
  iterables: Map<string, StoredIterable> = new Map();
  
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
  reset(what: ResetWhat[]): void;
}
```

## Chat Commands

### `/iterable` - Manage Named Iterables

#### Commands
- **define <name> --type <type> [options] [--description "text"]**: Create a new iterable
- **list**: Show all defined iterables
- **show <name>**: Display detailed information about an iterable
- **delete <name>**: Remove a defined iterable

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

### `/foreach @<iterable> <prompt>` - Process Each Item

#### Usage
```bash
/foreach @<iterable> <prompt>
```

#### Arguments
- **@<iterable>**: Name of the iterable to process (prefixed with @)
- **<prompt>**: Template prompt to execute for each item

#### Prompt Template Variables
- `{variable}`: Access item properties
- `{variable:default}`: Access with fallback value
- Nested access: `{user.name}`, `{nested.value}`

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
- `pattern`: File matching pattern (e.g., `**/*.ts`)
- `directory`: Base directory for file search (optional)
- `recursive`: Include subdirectories (boolean, optional)
- `description`: Optional description

**Example:**
```bash
/iterable define ts-files --type file --pattern "**/*.ts" --directory "src" --recursive
```

### JSON Provider
Process items from JSON files.

**Configuration:**
- `file`: Path to JSON file
- `arrayPath`: JSONPath to specific array (e.g., `data.items`)
- `description`: Optional description

**Example:**
```bash
/iterable define projects --type json --file "data/projects.json" --arrayPath "projects"
```

## Programmatic Usage

### Service Integration

```typescript
import { Agent } from '@tokenring-ai/agent';
import { IterableService } from '@tokenring-ai/iterables';

// Create agent with IterableService
const agent = new Agent({
  services: [new IterableService()],
});

// Define an iterable programmatically
await agent.requireServiceByType(IterableService).define('files', 'file', {
  pattern: '**/*.ts'
}, agent);

// Generate and process items
for await (const item of agent.requireServiceByType(IterableService).generate('files', agent)) {
  console.log('Processing:', item.variables.file);
}
```

### Custom Provider Creation

```typescript
import { IterableProvider } from '@tokenring-ai/iterables';

class CustomProvider implements IterableProvider {
  readonly type = 'custom';
  readonly description = 'Custom data source';

  getArgsConfig() {
    return {
      options: {
        source: { type: 'string' },
        limit: { type: 'string', multiple: true },
      }
    };
  }

  async* generate(spec: any, agent: Agent): AsyncGenerator<{ value: any, variables: Record<string, any> }> {
    // Implementation to generate items
    yield { value: 'item1', variables: { custom: 'value1' } };
    yield { value: 'item2', variables: { custom: 'value2' } };
  }
}

// Register the provider
agent.requireServiceByType(IterableService).registerProvider(new CustomProvider());
```

## State Management

Iterables are stored in agent state and persist across sessions. The `IterableState` class manages:

- `iterables: Map<string, StoredIterable>`: Collection of defined iterables
- Automatic serialization/deserialization
- State preservation during agent resets
- Checkpoint generation and recovery

## Error Handling

Common error scenarios:

- **Unknown iterable type**: Provider not registered
- **Iterable not found**: Name doesn't exist
- **Invalid configuration**: Missing required parameters
- **Processing errors**: Individual item processing failures
- **Provider generation errors**: Errors during item generation

## Integration Patterns

### With Other Plugins
The iterables plugin integrates seamlessly with:
- Chat services for prompt execution
- Agent services for state management
- Command services for chat command registration

### Typical Workflow
1. Define iterables using `/iterable define`
2. Process collections using `/foreach`
3. Maintain state across multiple processing sessions

## Dependencies

- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/agent`: Agent orchestration system
- `@tokenring-ai/chat`: Chat service integration
- `zod`: Schema validation
- `@tokenring-ai/utility`: Registry utilities

## Development

### Testing
```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Build
```bash
bun run build
```

## License

MIT