# Memory Plugin

## Overview

The `@tokenring-ai/memory` package provides short-term memory management functionality for Token Ring AI agents. It enables agents to store and recall information during chat sessions, maintaining context across interactions with a simple, effective memory system. Memories are stored in agent state and service methods for programmatic access. This package integrates with the TokenRing agent system via tools, chat commands, context handlers, and scripting functions.

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
  getMemories(input: string, chatConfig: unknown, params: {}, agent: Agent): AsyncGenerator<ContextItem>;
}
```

**Properties:**
- `name: string = "ShortTermMemoryService"` — Service identifier
- `description: string = "Provides Short Term Memory functionality"` — Service description

**Methods:**

- `attach(agent: Agent): void` — Initializes the `MemoryState` on agent attachment. Stores memories in agent state.

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

- `getMemories(input: string, chatConfig: unknown, params: {}, agent: Agent): AsyncGenerator<ContextItem>` — Yields memories as context items for agent processing. This method is used by the context handler system to automatically inject memories into agent context.

  ```typescript
  for await (const memory of memoryService.getMemories("", {}, {}, agent)) {
    console.log(memory.content);
    // Returns each memory as a ContextItem with role "user"
  }
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

  reset(what: ResetWhat[]): void;
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

- `reset(what: ResetWhat[]): void` — Clears memories when reset is called for chat or memory components.

  ```typescript
  state.reset(['chat', 'memory']);
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

- `show(): string[]` — Returns a formatted string representation of memories.

  ```typescript
  const display = state.show();
  // Returns:
  // [
  //   'Memories: 2',
  //   '  [1] memory1',
  //   '  [2] memory2'
  // ]
  ```

## Tools

### memory_add

Adds a memory item via the memory service.

**Tool Definition**

```typescript
const name = "memory_add";
const displayName = "Memory/addMemory";
const description = "Add an item to the memory list. The item will be presented in future chats to help keep important information in the back of your mind.";
```

**Input Schema**

```typescript
const inputSchema = z.object({
  memory: z.string().describe("The fact, idea, or info to remember."),
});
```

**Tool Usage**

```bash
# Through chat
/memory add Remember to buy groceries

# Programmatic execution
await agent.executeTool('memory_add', {
  memory: 'Project deadline is Friday'
});
```

## Chat Commands

### /memory [operation] [arguments]

The `/memory` command provides interactive memory management through chat.

**No arguments:** Shows help message with command usage

**Operations:**

| Operation | Description | Example |
|-----------|-------------|---------|
| `list` | Display all stored memory items with indices | `/memory list` |
| `add <text>` | Add a new memory item | `/memory add Remember to call client` |
| `clear` | Clear all memory items | `/memory clear` |
| `remove <index>` | Remove memory item at specified index | `/memory remove 0` |
| `set <index> <text>` | Update memory item at specified index | `/memory set 1 Updated meeting notes` |

**Usage Examples**

```bash
/memory add Remember to check emails tomorrow
/memory add Meeting notes: Discuss project timeline
/memory list
# Output:
# Memory items:
# [0] Remember to check emails tomorrow
# [1] Meeting notes: Discuss project timeline

/memory remove 0
# Output:
# [memory_add] Added new memory
# [memory] Removed memory item at index 0
# Memory items:
# [0] Meeting notes: Discuss project timeline

/memory set 0 Updated meeting time
# Output:
# [memory] Updated memory item at index 0
# Memory items:
# [0] Updated meeting time

/memory clear
# Output:
# [memory] Cleared all memory items
```

## Context Handlers

The memory package provides a context handler for automatic memory injection into agent context.

### short-term-memory

This context handler yields all stored memories as context items with role "user", making them available to the agent in all future interactions.

```typescript
import shortTermMemory from '@tokenring-ai/memory/contextHandlers/shortTermMemory';

export default async function* getContextItems(
  input: string,
  chatConfig: ParsedChatConfig,
  params: {},
  agent: Agent
): AsyncGenerator<ContextItem> {
  const state = agent.getState(MemoryState);
  for (const memory of state.memories ?? []) {
    yield {
      role: "user",
      content: memory,
    };
  }
}
```

**Usage in Plugin Registration**

The context handler is automatically registered when the memory plugin is installed:

```typescript
import memoryPlugin from '@tokenring-ai/memory/plugin';
app.installPlugin(memoryPlugin);
```

**Context Integration**

Memories are automatically injected into the agent's context before processing each request:

```typescript
// Context structure after adding memories:
// [
//   ...previous conversation,
//   { role: "user", content: "User prefers coffee over tea" },
//   { role: "user", content: "Meeting scheduled for 2 PM tomorrow" }
// ]
```

## Scripting Functions

The package registers global scripting functions when the ScriptingService is available. These functions are called using native script execution.

### addMemory

Adds a memory string to the agent's memory state.

**Function Definition**

```typescript
{
  type: 'native',
  params: ['memory'],
  execute(this: ScriptingThis, memory: string): string {
    this.agent.requireServiceByType(ShortTermMemoryService).addMemory(memory, this.agent);
    return `Added memory: ${memory.substring(0, 50)}...`;
  }
}
```

**Usage**

```typescript
// Execute via scripting service
await scriptingService.executeFunction('addMemory', 'Important user preference');
// Returns: "Added memory: Important user perference..."
```

### clearMemory

Clears all memory items from the agent's state.

**Function Definition**

```typescript
{
  type: 'native',
  params: [],
  execute(this: ScriptingThis): string {
    this.agent.requireServiceByType(ShortTermMemoryService).clearMemory(this.agent);
    return 'Memory cleared';
  }
}
```

**Usage**

```typescript
// Execute via scripting service
await scriptingService.executeFunction('clearMemory');
// Returns: "Memory cleared"
```

## Configuration and Setup

### Plugin Configuration

The memory plugin has no specific configuration options. The configuration schema is empty:

```typescript
import { z } from "zod";

const packageConfigSchema = z.object({});
```

### Automatic Integration

When installed as a TokenRing plugin (`app.installPlugin(memoryPlugin)`), the following automatic registration occurs:

1. **Service Registration**: `ShortTermMemoryService` is added to the application's services
2. **Tool Registration**: `memory_add` tool is registered with `ChatService`
3. **Command Registration**: `/memory` command is registered with `AgentCommandService`
4. **Scripting Functions**: Global functions `addMemory` and `clearMemory` are registered with `ScriptingService`
5. **Context Handlers**: `short-term-memory` context handler is registered with `ChatService`
6. **State Initialization**: MemoryState is initialized on agent attachment

```typescript
// Plugin registration
import memoryPlugin from '@tokenring-ai/memory/plugin';
app.installPlugin(memoryPlugin);
```

## Usage Examples

### Basic Memory Operations

```typescript
import Agent from '@tokenring-ai/agent/Agent';
import { ShortTermMemoryService } from '@tokenring-ai/memory';

// Create agent with memory service
const agent = new Agent({ services: [new ShortTermMemoryService()] });
const memoryService = agent.requireServiceByType(ShortTermMemoryService);

// Add memories
memoryService.addMemory('User prefers dark mode', agent);
memoryService.addMemory('Meeting at 3 PM tomorrow', agent);

// Check memory state
const state = agent.getState(MemoryState);
console.log(state.show());

// Get memories as context items
for await (const memory of memoryService.getMemories("", {}, {}, agent)) {
  console.log(memory.content);
}
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
state.show();
```

### State Persistence

```typescript
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

### Context Handler Integration

```typescript
// Context handler is automatically registered with chat service
// Memories are automatically injected into agent context

// Access the context handler directly if needed
const contextHandler = chatService.getContextHandler('short-term-memory');

// Get memories as context items
for await (const memory of contextHandler("", {}, {}, agent)) {
  console.log(memory.role, memory.content);
}
```

### Scripting Integration

```typescript
import { ScriptingService } from '@tokenring-ai/scripting';

// Access scripting service
const scriptingService = app.requireService(ScriptingService);

// Add memory via scripting
scriptingService.registerFunction({
  type: 'native',
  params: ['memory'],
  execute(this, memory) {
    this.agent.requireServiceByType(ShortTermMemoryService).addMemory(memory, this.agent);
    return `Added memory: ${memory.substring(0, 50)}...`;
  }
});

// Execute function
await scriptingService.execute('addMemory("Scripting example")');
// Returns: "Added memory: Scripting example..."
```

## Integration Points

### Agent System

The memory service integrates with the agent framework through:

- **Service Registration**: `TokenRingService` interface implementation
- **State Management**: AgentStateSlice for memory persistence
- **Agent Access**: Service accessed via `agent.requireServiceByType()`
- **State Mutation**: `agent.mutateState()` for memory modifications

### Chat Service

Memory tools and context handlers are registered with the chat service:

```typescript
chatService.addTools({ addMemory, ... });
chatService.registerContextHandlers({ 'short-term-memory': shortTermMemory, ... });
```

### Agent Command Service

Chat commands are registered with the agent command service for interactive management:

```typescript
agentCommandService.addAgentCommands({ memory, ... });
```

### Scripting Service

Global functions provide scripting access to memory operations:
```typescript
scriptingService.registerFunction('addMemory', ...);
scriptingService.registerFunction('clearMemory', ...);
```

## State Management

The memory system uses AgentStateSlice for comprehensive state management:

- **Initialization**: MemoryState created via `agent.initializeState(MemoryState, {})` in `attach()` method
- **Mutation**: `agent.mutateState()` ensures thread-safe state modifications
- **Serialization**: Memory data serializes to plain objects for storage
- **Restoration**: Serialized data can be deserialized to restore memory state
- **Reset Handling**: Memories can be cleared on chat or memory reset operations
- **Sub-agent Transfer**: State can be transferred from parent to child agents

## Dependencies

- `@tokenring-ai/app` — Application framework for service registration and plugin system
- `@tokenring-ai/chat` — Chat functionality and tool definitions
- `@tokenring-ai/agent` — Agent framework and state management
- `@tokenring-ai/scripting` — Scripting capability for custom functions
- `@tokenring-ai/utility` — Utility functions
- `zod` — Runtime type validation for state serialization

## Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Build TypeScript
bun run build
```

## Package Structure

```
pkg/memory/
├── index.ts                              # Main entry point, exports ShortTermMemoryService
├── ShortTermMemoryService.ts             # Service implementation providing memory methods
├── state/
│   └── memoryState.ts                    # Agent state slice for memory storage and serialization
├── contextHandlers/
│   └── shortTermMemory.ts                # Context handler for injecting memories into agent context
├── tools/
│   ├── addMemory.ts                      # Tool to add memory items
│   └── tools.ts                          # Exports tools array
├── commands/
│   └── memory.ts                         # Chat commands for memory management
├── chatCommands.ts                       # Exports chat commands array
├── contextHandlers.ts                    # Exports context handlers record
├── plugin.ts                             # Plugin for automatic service registration
└── package.json                          # Package metadata and dependencies
```

## Best Practices

1. **Use Service Methods**: Access memories through `ShortTermMemoryService` methods for consistency
2. **Handle State Correctly**: Always use `agent.mutateState()` for memory modifications
3. **Serialize Before Persistence**: Call `state.serialize()` before saving agent state
4. **Use Index Carefully**: Remember that indices are 0-based in memory operations
5. **Validate Input**: Use tool and command functions for proper validation
6. **Transfer State Appropriately**: Only transfer state between related parent/child agents
7. **Leverage Context Handlers**: Use the context handler system for automatic memory injection rather than manual injection

## Related Components

- **@tokenring-ai/agent** — Agent framework with state management
- **@tokenring-ai/app** — Application system and service registration
- **@tokenring-ai/chat** — Chat functionality and tool system
- **@tokenring-ai/scripting** — Scripting context for custom functions
- **State Management** — Agent state slices for persistence

## License

MIT License - see LICENSE file for details.
