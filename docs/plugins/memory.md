# Memory Plugin

Short-term memory storage for agents, with tools and commands for adding and retrieving items during a session.

## Overview

The `@tokenring-ai/memory` package provides short-term memory management for AI agents within the TokenRing framework. It enables agents to store and recall simple facts or information during a session, maintaining context across interactions without persistent storage. Memories are automatically injected into agent context for all future interactions within that session.

## Key Features

- **Memory Storage**: Store and retrieve memories as strings
- **Context Injection**: Memories automatically included in agent context
- **Session-Scoped**: Memories persist within a session and reset on chat reset
- **Sub-Agent Persistence**: Memories automatically persist to sub-agents
- **Tools and Commands**: Programmatic and interactive management via tools and chat commands
- **Scripting Integration**: Global functions for scripting workflows

## Core Components

### ShortTermMemoryService

The primary service class implementing memory management for agents, implementing `TokenRingService`.

**Key Methods:**
- `async attach(agent)`: Initializes the `MemoryState` on agent attachment
- `addMemory(memory, agent)`: Adds a memory string to the agent's state
- `clearMemory(agent)`: Clears all memories from the agent's state
- `spliceMemory(index, count, agent, ...items)`: Modifies the memory array (remove/replace/insert)
- `async *getContextItems(agent)`: Yields memories as context items for agent context injection

### MemoryState

An agent state slice for storing memories with serialization support, implementing `AgentStateSlice`.

**Properties:**
- `memories: string[]`: Array of memory strings
- `persistToSubAgents: boolean`: Set to `true`; memories persist to sub-agents automatically

**Key Methods:**
- `reset(what)`: Clears memories when chat resets
- `serialize()`: Serializes memories for persistence
- `deserialize(data)`: Deserializes memories from stored data

### Tools

**memory/add**: Adds a memory item to the agent's memory state
- Input: `{ memory: string }`
- Description: "Add an item to the memory list. The item will be presented in future chats to help keep important information in the back of your mind."

### Chat Commands

**/memory [op] [args]**: Memory management
- No arguments: Shows help
- `list`: Shows all memory items with indices
- `add <text>`: Adds a new memory item
- `clear`: Clears all memory items
- `remove <index>`: Removes memory item at specified index
- `set <index> <text>`: Updates memory item at specified index

Output is provided via `agent.infoLine()` and `agent.errorLine()` methods.

### Global Scripting Functions

When `@tokenring-ai/scripting` is available, the memory package automatically registers:

**addMemory(memory: string): string** - Adds a memory to short-term storage
- Returns: `"Added memory: <first 50 chars of memory>..."`
```bash
/var $result = addMemory("Remember this important fact")
/call addMemory("User prefers dark mode")
```

**clearMemory(): string** - Clears all memories
- Returns: `"Memory cleared"`
```bash
/var $result = clearMemory()
/call clearMemory()
```

Example workflow:
```bash
# Store context during a conversation
/var $fact = "User is interested in AI research"
/call addMemory($fact)

# Clear when starting a new topic
/call clearMemory()
```

## Usage Examples

### Basic Usage

```typescript
import Agent from '@tokenring-ai/agent';
import { ShortTermMemoryService } from '@tokenring-ai/memory';

const agent = new Agent({ services: [new ShortTermMemoryService()] });
const memoryService = agent.requireServiceByType(ShortTermMemoryService);

// Add memory
memoryService.addMemory('I like coffee.', agent);

// Retrieve context items
for await (const contextItem of memoryService.getContextItems(agent)) {
  console.log(contextItem.content); // "I like coffee."
}
```

### Using Tools

```typescript
// Assuming agent is configured with tools
await agent.executeTool('memory/add', { memory: 'Remember this fact.' });
```

### Chat Command

```bash
/memory add Remember to check emails
# Agent outputs: Added new memory: Remember to check emails
# Then lists updated memories
```

### Using Scripting Functions

```bash
/call addMemory("User prefers detailed explanations")
/var $count = 5
/call addMemory(`Need to process ${$count} items`)
```

## Configuration Options

- No runtime configuration or environment variables required
- Memories are session-scoped and reset when the chat resets
- Memories automatically persist to sub-agents via the `persistToSubAgents` flag
- No item limits; all memories are retained until explicitly cleared or the session resets

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework, types, and service integration
- `@tokenring-ai/utility@0.1.0`: Utilities package
- `@tokenring-ai/scripting` (optional): For global scripting function registration (e.g., `addMemory()`, `clearMemory()`). Automatically integrated when available
