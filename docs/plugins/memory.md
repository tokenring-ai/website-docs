# Memory Plugin

## Overview

The `@tokenring-ai/memory` package provides short-term memory management functionality for Token Ring AI agents. It enables agents to store and recall information during chat sessions, maintaining context across interactions with a simple, effective memory system. Memories are automatically included in the agent's context for future interactions within the same session.

## Key Features

- **Memory Storage**: Store and retrieve text-based memories
- **Context Injection**: Memories automatically included in agent context
- **Session-Scoped**: Memories persist within a session and reset on chat reset
- **Interactive Management**: Tools and chat commands for memory operations
- **Scripting Integration**: Native functions for scripting workflows
- **State Management**: Built-in state serialization and persistence
- **Context Handlers**: Automatic injection of memories into chat context

## Core Components

### ShortTermMemoryService

The primary service class implementing memory management for agents:

```typescript
class ShortTermMemoryService implements TokenRingService {
  name = "ShortTermMemoryService";
  description = "Provides Short Term Memory functionality";

  async attach(agent: Agent): Promise<void>;
  addMemory(memory: string, agent: Agent): void;
  clearMemory(agent: Agent): void;
  spliceMemory(index: number, count: number, agent: Agent, ...items: string[]): void;
}
```

### MemoryState

The state management class that stores memory data with serialization support:

```typescript
class MemoryState implements AgentStateSlice {
  name = "MemoryState";
  memories: string[] = [];

  reset(what: ResetWhat[]): void;
  transferStateFromParent(parent: Agent): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[]; // Returns formatted memory display
}
```

### Scripting Functions

Native scripting functions automatically registered when scripting service is available:

```typescript
// addMemory - Adds a memory item via scripting
scriptingService.registerFunction("addMemory", {
  type: 'native',
  params: ['memory'],
  execute(this: ScriptingThis, memory: string): string {
    this.agent.requireServiceByType(ShortTermMemoryService).addMemory(memory, this.agent);
    return `Added memory: ${memory.substring(0, 50)}...`;
  }
});

// clearMemory - Clears all memory items via scripting
scriptingService.registerFunction("clearMemory", {
  type: 'native',
  params: [],
  execute(this: ScriptingThis): string {
    this.agent.requireServiceByType(ShortTermMemoryService).clearMemory(this.agent);
    return 'Memory cleared';
  }
});
```

## Commands and Tools

### Chat Commands

The plugin registers a `/memory` command for interactive memory management:

#### Available Operations:

- **list**: Display all stored memory items with indices
- **`add <text>`**: Add a new memory item
- **clear**: Remove all memory items
- **`remove <index>`**: Remove memory item at specific index
- **`set <index> <text>`**: Update memory item at specific index

#### Usage Examples:

```bash
/memory list
/memory add Remember to buy groceries tomorrow
/memory remove 0
/memory set 2 Updated meeting notes
```

### Tools

#### memory_add Tool

```typescript
const name = "memory_add";

const description = "Add an item to the memory list. The item will be presented in future chats to help keep important information in the back of your mind.";

const inputSchema = z.object({
  memory: z.string().describe("The fact, idea, or info to remember."),
});

async function execute({memory}: z.infer<typeof inputSchema>, agent: Agent): Promise<string> {
  const memoryService = agent.requireServiceByType(ShortTermMemoryService);
  memoryService.addMemory(memory, agent);
  return "Memory added";
}
```

## Configuration

The memory plugin has no specific configuration options and integrates seamlessly with the agent system. It relies on the standard service registration pattern:

```typescript
app.addServices(new ShortTermMemoryService());
```

## Integration

### Agent Integration

The plugin integrates with agents through service registration:

```typescript
// In the plugin install method
app.addServices(new ShortTermMemoryService());
```

### Chat Service Integration

Memory tools are registered with the chat service:

```typescript
chatService.addTools(packageJSON.name, tools);
```

### Context Integration

Memory items are automatically included in chat context:

```typescript
export default async function * getContextItems(input: string, chatConfig: ChatConfig, params: {}, agent: Agent): AsyncGenerator<ContextItem> {
  const state = agent.getState(MemoryState);
  for (const memory of state.memories ?? []) {
    yield {
      role: "user",
      content: memory,
    };
  }
}
```

### Agent Command Integration

Chat commands are registered with the agent command service:

```typescript
agentCommandService.addAgentCommands(chatCommands);
```

## Usage Examples

### Basic Memory Operations

```typescript
// Add memory via scripting
await scriptingService.executeFunction("addMemory", "Important meeting at 3 PM");

// Add memory via tool
await chatService.useTool("memory_add", {memory: "Project deadline is Friday"});

// Clear all memories
await scriptingService.executeFunction("clearMemory");

// Use chat command
agent.chatInput("/memory add Remember to call client");
```

### Memory Display

Memories are automatically included in context and can be displayed:

```typescript
// List memories via chat command
agent.chatInput("/memory list");

// View memory state
const memoryState = agent.getState(MemoryState);
console.log(memoryState.show());
```

## State Management

The memory system uses AgentStateSlice for persistence:

- **Serialization**: Memory data is serialized when the agent is saved
- **Deserialization**: Memory data is restored when the agent is loaded
- **Reset Handling**: Memories can be cleared when `chat` or `memory` reset operations occur
- **Parent Transfer**: Memory state can be transferred between parent and child agents

## Development

### Testing

The plugin includes unit tests using Vitest:

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

### Package Structure

```
pkg/memory/
├── index.ts (plugin export)
├── package.json
├── ShortTermMemoryService.ts
├── state/
│   └── memoryState.ts
├── tools/
│   ├── addMemory.ts
│   └── index.ts
├── commands/
│   └── memory.ts
├── contextHandlers/
│   └── shortTermMemory.ts
└── chatCommands.ts
```

## License

MIT. Contributions welcome via PRs to the TokenRing repository.

## Issues and Support

For issues or features, refer to the main TokenRing project repository.
