# @tokenring-ai/memory

The `@tokenring-ai/memory` package provides short-term memory management functionality for Token Ring AI agents. It enables agents to store and recall information during chat sessions, maintaining context across interactions with a simple, effective memory system. Memories are stored in agent state and accessible via service methods, tools, chat commands, context handlers, and scripting functions.

## Key Features

- **Memory Storage**: Store and retrieve text-based memories as strings in an ordered list
- **State Management**: Memories stored in agent state with serialization and persistence support
- **Service-Based Access**: Programmatic access to memories through ShortTermMemoryService
- **Interactive Management**: Chat commands for interactive memory operations
- **Context Injection**: Automatic injection of memories into agent context via context handlers
- **Scripting Integration**: Native functions for scripting workflows
- **Memory Manipulation**: Full CRUD operations including add, remove, replace, and update
- **Sub-agent Support**: State transfer capability between parent and child agents
- **Session Management**: Memories clear on chat or memory resets

## Core Components

### ShortTermMemoryService

The primary service class implementing memory management for agents. Provides programmatic access to memory operations.

```typescript
import ShortTermMemoryService from '@tokenring-ai/memory/ShortTermMemoryService';

// Service is automatically available through agent
const memoryService = agent.requireServiceByType(ShortTermMemoryService);
```

**Service Class**

```typescript
class ShortTermMemoryService implements TokenRingService {
  name = "ShortTermMemoryService";
  description = "Provides Short Term Memory functionality";

  attach(agent: Agent): void;
  addMemory(memory: string, agent: Agent): void;
  clearMemory(agent: Agent): void;
  spliceMemory(index: number, count: number, agent: Agent, ...items: string[]): void;
}
```

**Properties:**
- `name: string = "ShortTermMemoryService"` — Service identifier
- `description: string = "Provides Short Term Memory functionality"` — Service description

**Methods:**

- `attach(agent: Agent): void` — Initializes the `MemoryState` on agent attachment. Stores memories in agent state.

  ```typescript
  service.attach(agent);
  // Initializes MemoryState with empty memories array
  ```

- `addMemory(memory: string, agent: Agent): void` — Adds a memory string to the agent's memory state. Memory is pushed to the end of the memories array.

  ```typescript
  memoryService.addMemory('Important meeting at 3 PM', agent);
  ```

- `clearMemory(agent: Agent): void` — Clears all memories from the agent's state.

  ```typescript
  memoryService.clearMemory(agent);
  ```

- `spliceMemory(index: number, count: number, agent: Agent, ...items: string[]): void` — Modifies the memory array at the specified index. Can be used for:
  - Removing items: `spliceMemory(0, 1, agent)` — Remove first item
  - Replacing items: `spliceMemory(0, 1, agent, 'New memory')` — Replace first item with new content
  - Inserting items: `spliceMemory(0, 0, agent, 'New memory')` — Insert at beginning

  ```typescript
  // Remove first memory
  memoryService.spliceMemory(0, 1, agent);

  // Replace first memory
  memoryService.spliceMemory(0, 1, agent, 'Updated memory');

  // Insert at beginning
  memoryService.spliceMemory(0, 0, agent, 'New memory at start');
  ```

### MemoryState

The memory state slice that stores memory data with serialization support. This is the actual storage mechanism used by the memory service.

```typescript
import { MemoryState } from '@tokenring-ai/memory/state/memoryState';

const state = new MemoryState({ memories: ['First memory'] });
```

**State Class**

```typescript
class MemoryState implements AgentStateSlice<typeof serializationSchema> {
  name = "MemoryState";
  serializationSchema = serializationSchema;
  memories: string[] = [];

  reset(): void;
  transferStateFromParent(parent: Agent): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}

const serializationSchema = z.object({
  memories: z.array(z.string())
});
```

**Properties:**
- `name: string = "MemoryState"` — State slice name
- `serializationSchema: z.ZodObject` — Zod schema for serialization validation
- `memories: string[]` — Array of memory strings

**Methods:**

- `constructor({memories = []}: { memories?: string[] } = {})` — Creates a new memory state with optional initial memories.

  ```typescript
  const state = new MemoryState({ memories: ['Initial memory'] });
  ```

- `reset(): void` — Clears all memories when reset is called for chat or memory resets.

  ```typescript
  state.reset();
  // memories array is cleared
  ```

- `transferStateFromParent(parent: Agent): void` — Transfers state from parent agent to this agent. Useful for sub-agent patterns.

  ```typescript
  const subState = subAgent.getState(MemoryState);
  subState.transferStateFromParent(parentAgent);
  ```

- `serialize(): z.output<typeof serializationSchema>` — Serializes memories to a plain object for persistence.

  ```typescript
  const data = state.serialize();
  // Returns: { memories: ['memory1', 'memory2'] }
  ```

- `deserialize(data: z.output<typeof serializationSchema>): void` — Restores memories from serialized data.

  ```typescript
  state.deserialize({ memories: ['memory1', 'memory2'] });
  ```

- `show(): string[]` — Returns a formatted string representation of memories with 1-based indexing.

  ```typescript
  const display = state.show();
  // Returns:
  // [
  //   'Memories: 2',
  //   '  [1] memory1',
  //   '  [2] memory2'
  // ]
  ```

## Services

### ShortTermMemoryService

The `ShortTermMemoryService` is a `TokenRingService` implementation that provides memory management functionality. It is automatically registered when the memory plugin is installed.

**Service Registration**

```typescript
import ShortTermMemoryService from '@tokenring-ai/memory/ShortTermMemoryService';

// Automatic registration via plugin
import memoryPlugin from '@tokenring-ai/memory/plugin';
app.installPlugin(memoryPlugin);

// Or manual registration
app.addServices(new ShortTermMemoryService());
```

**Service Methods**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `attach` | Initialize memory state on agent attachment | `agent: Agent` | `void` |
| `addMemory` | Add a memory string to the agent's memory state | `memory: string`, `agent: Agent` | `void` |
| `clearMemory` | Clear all memories from the agent's state | `agent: Agent` | `void` |
| `spliceMemory` | Modify the memory array at specified index | `index: number`, `count: number`, `agent: Agent`, `...items: string[]` | `void` |

## RPC Endpoints

This package does not define any RPC endpoints. Memory operations are accessed through:
- Tools (via ChatService)
- Chat commands (via AgentCommandService)
- Service methods (via Agent)
- Scripting functions (via ScriptingService)

## Chat Commands

The package provides the following slash-prefixed commands for memory management:

| Command | Description | Example |
|---------|-------------|---------|
| `/memory list` | Display all stored memory items | `/memory list` |
| `/memory add <text>` | Add a new memory item | `/memory add Remember to call client` |
| `/memory clear` | Clear all memory items | `/memory clear` |
| `/memory remove <index>` | Remove memory item at specified index (0-based) | `/memory remove 0` |
| `/memory set <index> <text>` | Update memory item at specified index | `/memory set 1 Updated meeting notes` |

### Command Details

#### `/memory list`

Display all stored memory items.

**Help:**
```
# /memory list

Display all stored memory items.

## Example

/memory list
```

**Output Format:**
```
Memory items:
[0] First memory item
[1] Second memory item
```

#### `/memory add <text>`

Add a new memory item.

**Help:**
```
# /memory add

Add a new memory item.

## Example

/memory add Remember to buy groceries tomorrow
```

**Output:**
```
Added new memory: Remember to buy groceries tomorrow
Memory items:
[0] Remember to buy groceries tomorrow
```

#### `/memory clear`

Remove all memory items.

**Help:**
```
# /memory clear

Remove all memory items.

## Example

/memory clear
```

**Output:**
```
Cleared all memory items
```

#### `/memory remove <index>`

Remove memory item at specific index.

**Help:**
```
# /memory remove

Remove memory item at specific index.

## Example

/memory remove 0
```

**Output:**
```
Removed memory item at index 0
Memory items:
[0] Remaining memory item
```

#### `/memory set <index> <text>`

Update memory item at specific index.

**Help:**
```
# /memory set

Update memory item at specific index.

## Example

/memory set 0 Updated meeting notes
```

**Output:**
```
Updated memory item at index 0
Memory items:
[0] Updated meeting notes
```

**Usage Examples**

```typescript
// Add memory items
await agent.executeCommand('/memory add Remember to check emails tomorrow');
await agent.executeCommand('/memory add Meeting notes: Discuss project timeline');

// List memory items
const result = await agent.executeCommand('/memory list');
// Output:
// Memory items:
// [0] Remember to check emails tomorrow
// [1] Meeting notes: Discuss project timeline

// Remove memory at index 0
await agent.executeCommand('/memory remove 0');
// Output:
// Removed memory item at index 0
// Memory items:
// [0] Meeting notes: Discuss project timeline

// Update memory at index 0
await agent.executeCommand('/memory set 0 Updated meeting time');
// Output:
// Updated memory item at index 0
// Memory items:
// [0] Updated meeting time

// Clear all memories
await agent.executeCommand('/memory clear');
// Output:
// Cleared all memory items
```

## Configuration

### Plugin Configuration

The memory plugin has no specific configuration options. The configuration schema is empty:

```typescript
import { z } from "zod";

const packageConfigSchema = z.object({});
```

## Integration

### Agent System

The memory service integrates with the agent framework through:

- **Service Registration**: `TokenRingService` interface implementation
- **State Management**: AgentStateSlice for memory persistence
- **Agent Access**: Service accessed via `agent.requireServiceByType()`
- **State Mutation**: `agent.mutateState()` for memory modifications

### Chat Service

Memory tools and context handlers are registered with the chat service automatically when the plugin is installed:

```typescript
// Automatic registration via plugin
import memoryPlugin from '@tokenring-ai/memory/plugin';
app.installPlugin(memoryPlugin);

// The plugin automatically registers:
// - addMemory tool with ChatService
// - short-term-memory context handler with ChatService
```

### Agent Command Service

Chat commands are registered with the agent command service for interactive management:

```typescript
// Automatic registration via plugin
// The memory commands are registered with AgentCommandService:
// - memory list
// - memory add
// - memory clear
// - memory remove
// - memory set
```

### Scripting Service

Global functions provide scripting access to memory operations:

```typescript
// Automatic registration via plugin
// The following functions are registered with ScriptingService:
// - addMemory(memory: string): string
// - clearMemory(): string
```

## Usage Examples

### Basic Memory Operations

```typescript
import Agent from '@tokenring-ai/agent/Agent';
import { ShortTermMemoryService } from '@tokenring-ai/memory';
import { MemoryState } from '@tokenring-ai/memory/state/memoryState';

// Create agent with memory service
const agent = new Agent({ services: [new ShortTermMemoryService()] });
const memoryService = agent.requireServiceByType(ShortTermMemoryService);

// Add memories
memoryService.addMemory('User prefers dark mode', agent);
memoryService.addMemory('Meeting at 3 PM tomorrow', agent);

// Check memory state
const state = agent.getState(MemoryState);
console.log(state.show());
// Output:
// [
//   'Memories: 2',
//   '  [1] User prefers dark mode',
//   '  [2] Meeting at 3 PM tomorrow'
// ]
```

### Memory Manipulation

```typescript
// Replace first memory with new content
memoryService.spliceMemory(0, 1, agent, 'Updated user preference');

// Insert new memory at index 1
memoryService.spliceMemory(1, 0, agent, 'New important fact');

// Remove memory at index 2
memoryService.spliceMemory(2, 1, agent);

// Display updated memory list
const state = agent.getState(MemoryState);
console.log(state.show());
```

### State Persistence

```typescript
import { MemoryState } from '@tokenring-ai/memory/state/memoryState';

// Serialize memories for persistence
const state = agent.getState(MemoryState);
const serializedData = state.serialize();
console.log('Serialized:', serializedData);
// Output: { memories: ['memory1', 'memory2'] }

// Save serialized data (e.g., to database, file)
// ... persistence logic ...

// Later, restore memories for a new agent
const newAgent = new Agent({ services: [new ShortTermMemoryService()] });
const newState = newAgent.getState(MemoryState);
const savedData = { memories: ['memory1', 'memory2'] };
newState.deserialize(savedData);
```

### Sub-agent Integration

```typescript
import { MemoryState } from '@tokenring-ai/memory/state/memoryState';

// Parent agent with memory
const parentAgent = new Agent({ services: [new ShortTermMemoryService()] });
parentAgent.addState(new MemoryState({ memories: ['Parent memory 1', 'Parent memory 2'] }));

// Create sub-agent
const subAgent = parentAgent.createSubAgent();
const subState = subAgent.getState(MemoryState);

// Transfer state from parent
subState.transferStateFromParent(parentAgent);

// Sub-agent now has access to parent's memories
console.log(subState.show());
// Output:
// [
//   'Memories: 2',
//   '  [1] Parent memory 1',
//   '  [2] Parent memory 2'
// ]
```

### Tool Usage

```typescript
// Execute memory_add tool programmatically
await agent.executeTool('memory_add', {
  memory: 'Project deadline is Friday'
});
```

### Context Handler Integration

The context handler automatically injects memories into agent context:

```typescript
// Context structure after adding memories:
// [
//   ...previous conversation,
//   { role: "user", content: "User prefers coffee over tea" },
//   { role: "user", content: "Meeting scheduled for 2 PM tomorrow" }
// ]
```

### Scripting Integration

```typescript
import { ScriptingService } from '@tokenring-ai/scripting';

// Access scripting service
const scriptingService = app.requireService(ScriptingService);

// Add memory via scripting
await scriptingService.eval('addMemory("Scripting example")');
// Returns: "Added memory: Scripting example..."

// Clear memory via scripting
await scriptingService.eval('clearMemory()');
// Returns: "Memory cleared"
```

## Best Practices

1. **Use Service Methods**: Access memories through `ShortTermMemoryService` methods for consistency
2. **Handle State Correctly**: Always use `agent.mutateState()` for memory modifications (handled automatically by service methods)
3. **Serialize Before Persistence**: Call `state.serialize()` before saving agent state
4. **Use Index Carefully**: Remember that indices are 0-based in memory operations
5. **Validate Input**: Use tool and command functions for proper validation
6. **Transfer State Appropriately**: Only transfer state between related parent/child agents
7. **Leverage Context Handlers**: Use the context handler system for automatic memory injection rather than manual injection

## Error Handling

The package provides error handling for memory operations through input validation and service methods:

### Error Types

| Error Type | Description | When Thrown |
|------------|-------------|-------------|
| `Error` | Missing parameter error | When `memory_add` tool receives empty memory |

### Error Examples

```typescript
// Tool error - missing memory parameter
try {
  await agent.executeTool('memory_add', { memory: '' });
} catch (error) {
  console.error(error.message); // "[memory_add] Missing parameter: memory"
}

// Command validation errors are handled by the input schema
// Invalid index will be caught by the command service
try {
  await agent.executeCommand('/memory remove abc');
} catch (error) {
  // Error handled by command service
}
```

**Note:** Command validation errors (missing required parameters, invalid types) are automatically handled by the command service through the input schema validation. The `CommandFailedError` may be thrown by the command service for invalid operations, but the memory commands themselves do not throw this error directly.

## Testing and Development

### Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Build TypeScript (type check only)
bun run build
```

### Package Structure

```
pkg/memory/
├── index.ts                              # Main entry point, exports ShortTermMemoryService
├── ShortTermMemoryService.ts             # Service implementation providing memory methods
├── state/
│   └── memoryState.ts                    # Agent state slice for memory storage and serialization
├── contextHandlers/
│   └── shortTermMemory.ts                # Context handler for injecting memories into agent context
├── tools/
│   └── addMemory.ts                      # Tool to add memory items
├── commands/
│   ├── memory.ts                         # /memory command index
│   └── memory/
│       ├── list.ts                       # /memory list
│       ├── add.ts                        # /memory add
│       ├── clear.ts                      # /memory clear
│       ├── remove.ts                     # /memory remove
│       ├── set.ts                        # /memory set
│       └── _listMemories.ts              # Shared list helper
├── tools.ts                              # Exports agent tools
├── commands.ts                           # Exports chat commands
├── contextHandlers.ts                    # Exports context handlers
├── plugin.ts                             # Plugin for automatic service registration
├── package.json                          # Package metadata and dependencies
├── vitest.config.ts                      # Vitest configuration
└── README.md                             # Package documentation
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Application framework for service registration and plugin system |
| `@tokenring-ai/chat` | 0.2.0 | Chat functionality and tool definitions |
| `@tokenring-ai/agent` | 0.2.0 | Agent framework and state management |
| `@tokenring-ai/scripting` | 0.2.0 | Scripting capability for custom functions |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions |
| `zod` | ^4.3.6 | Runtime type validation for state serialization |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

## Related Components

- **@tokenring-ai/agent** — Agent framework with state management
- **@tokenring-ai/app** — Application system and service registration
- **@tokenring-ai/chat** — Chat functionality and tool system
- **@tokenring-ai/scripting** — Scripting context for custom functions
- **State Management** — Agent state slices for persistence

## License

MIT License - see LICENSE file for details.
