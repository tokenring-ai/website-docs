# Iterables Plugin

The Iterables plugin provides a comprehensive system for managing named iterables and processing collections with customizable providers.

## Overview

The Iterables plugin enables efficient batch processing of data collections through a flexible provider architecture. It allows agents to define, manage, and process iterables (collections of items) using various data sources like files, JSON, CSV, APIs, and more.

## Key Features

- **Named Iterable Management**: Define and manage reusable collections with descriptive names
- **Provider Architecture**: Support for multiple data sources (files, JSON, CSV, API endpoints)
- **Batch Processing**: Process entire collections with custom prompts using `/foreach`
- **State Management**: Persistent iterable definitions across agent sessions
- **Template Variables**: Dynamic variable substitution in prompts using `{variable}` syntax
- **Checkpoint Preservation**: Maintains state between iterations for consistent processing

## Core Components

### IterableService
Main service that manages iterable definitions and provides the core API.

#### Methods
- `define(name: string, type: string, spec: IterableSpec, agent: Agent)`: Create a new iterable
- `get(name: string, agent: Agent)`: Retrieve an iterable by name
- `list(agent: Agent)`: List all defined iterables
- `delete(name: string, agent: Agent)`: Remove an iterable
- `generate(name: string, agent: Agent)`: Generate items from an iterable

### IterableProvider Interface
Defines the contract for iterable providers that can generate items from various data sources.

#### Required Properties
- `type: string`: Unique identifier for the provider type
- `description: string`: Human-readable description

#### Methods
- `getArgsConfig()`: Define command-line arguments for configuration
- `generate(spec: IterableSpec, agent: Agent)`: Generate iterable items asynchronously

## Chat Commands

### `/iterable` - Manage Named Iterables

#### Commands
- **define <name> --type <type> [options]**: Create a new iterable
- **list**: Show all defined iterables
- **show <name>**: Display detailed information about an iterable
- **delete <name>**: Remove a defined iterable

#### Examples
```bash
# Define a file-based iterable
/iterable define files --type file --pattern "**/*.ts"

# List all iterables
/iterable list

# Show details of a specific iterable
/iterable show files

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
# Process files in the 'files' iterable
/foreach @files "Add comments to {file}"

# Process users with custom welcome messages
/foreach @users "Welcome {name} from {city}"

# Process projects with fallback descriptions
/foreach @projects "Review {name}: {description:No description}"

# Access nested properties
/foreach @data "Process {nested.value:default}"
```

## Common Iterable Types

### File Provider
Process files matching specified patterns.

**Configuration:**
- `pattern`: File matching pattern (e.g., `**/*.ts`)
- `description`: Optional description

**Example:**
```bash
/iterable define files --type file --pattern "**/*.ts"
```

### JSON Provider
Process items from JSON files.

**Configuration:**
- `file`: Path to JSON file
- `path`: Optional JSONPath to specific array (e.g., `data.items`)
- `description`: Optional description

**Example:**
```bash
/iterable define projects --type json --file "projects.json" --path "data.projects"
```

### CSV Provider
Process rows from CSV files.

**Configuration:**
- `file`: Path to CSV file
- `description`: Optional description

**Example:**
```bash
/iterable define users --type csv --file "users.csv"
```

### API Provider
Process items from API endpoints.

**Configuration:**
- `url`: API endpoint URL
- `method`: HTTP method (GET, POST, etc.)
- `params`: Query parameters
- `body`: Request body
- `description`: Optional description

**Example:**
```bash
/iterable define products --type api --url "https://api.example.com/products" --method get
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
        limit: { type: 'string' },
      }
    };
  }

  async* generate(spec: any, agent: Agent): AsyncGenerator<{ value: any, variables: Record<string, any> }> {
    // Implementation to generate items
    yield { value: 'item1', variables: { custom: 'value1' } };
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

## Error Handling

Common error scenarios:

- **Unknown iterable type**: Provider not registered
- **Iterable not found**: Name doesn't exist
- **Invalid configuration**: Missing required parameters
- **Processing errors**: Individual item processing failures

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