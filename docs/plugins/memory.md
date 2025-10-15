# Memory Plugin

Short-term memory and attention storage for agents, with tools and commands for adding and retrieving items.

## Overview

The `@tokenring-ai/memory` package provides memory management functionality for AI agents within the TokenRing framework. It handles short-term, ephemeral storage of memories (simple facts or information) and attention items (categorized lists like goals or focus areas). This allows agents to maintain context across interactions without persistent storage.

## Key Features

- **Memory Storage**: Store and retrieve memories as strings
- **Attention Management**: Manage categorized attention items (goals, focus)
- **Async Generators**: Yield memories and attention in agent contexts
- **Tools and Commands**: Interactive management via chat
- **Ephemeral Storage**: In-memory implementation included

## Core Components

### MemoryService (Abstract Base Class)

Defines the interface for memory services.

**Key Methods:**
- `addMemory(memory: string)`: Adds a memory string
- `clearMemory()`: Clears all memories
- `spliceMemory(index, count?, ...items)`: Modifies memory array
- `pushAttentionItem(type, item)`: Adds item to typed attention list
- `clearAttentionItems(type?)`: Clears attention items
- `spliceAttentionItems(type, index, count?, ...items)`: Modifies attention list
- `async *getMemories(agent)`: Yields memories as chat messages
- `async *getAttentionItems(agent)`: Yields formatted attention items

### EphemeralMemoryService

In-memory storage for memories and attention, extends `MemoryService`.

**Internal State:**
- `memories: string[]`: Array of memory strings
- `attentionItems: Record<string, string[]>`: Map of type to items

**Additional Methods:**
- `unshiftAttentionItem(type, item)`: Adds to front of list

### Tools

**memory/add-memory**: Adds to memories
- Input: `{ memory: string }`

**memory/add-goal**: Adds to attention type "goals"
- Limits to last 20 items
- Input: `{ item: string }`

**memory/add-focus**: Adds to attention type "focus"
- Limits to last 10 items
- Input: `{ item: string }`

### Chat Commands

**/memory [op] [args]**: Memory management
- `list`: Shows indexed memories
- `add <text>`: Add memory
- `clear`: Clear all
- `remove <index>`: Remove specific
- `set <index> <text>`: Update specific

**/attention [op] [args]**: Attention management
- `add <type> <text>`: Add attention item
- `clear [type]`: Clear items
- `remove <type> <index>`: Remove specific
- `set <type> <index> <text>`: Update specific

### Global Scripting Functions

When `@tokenring-ai/scripting` is available:

**addMemory(memory)**: Adds a memory to short-term storage
```bash
/var $result = addMemory("Remember this important fact")
/call addMemory("User prefers dark mode")
```

**clearMemory()**: Clears all memories
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
import { EphemeralMemoryService } from '@tokenring-ai/memory';

const agent = new Agent({ services: [new EphemeralMemoryService()] });
const memoryService = agent.getFirstServiceByType(EphemeralMemoryService);

// Add memory
memoryService.addMemory('I like coffee.');

// Add attention
memoryService.pushAttentionItem('goals', 'Finish documentation');

// Yield in context
for await (const mem of memoryService.getMemories(agent)) {
  console.log(mem.content); // "I like coffee."
}
```

### Using Tools

```typescript
// Assuming agent is configured with tools
await agent.executeTool('memory/add-memory', { memory: 'Remember this fact.' });
```

### Chat Command

```bash
/memory add Remember to check emails
# Agent outputs: Added new memory: Remember to check emails
```

## Configuration Options

- No runtime configs or env vars in ephemeral implementation
- Limits in tools: Goals (20 items), Focus (10 items)
- For custom limits or persistence, extend `EphemeralMemoryService`

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework and types
- `@tokenring-ai/utility@0.1.0`: Utilities
- `@tokenring-ai/scripting@0.1.0`: Optional, for global functions
- `zod`: Tool input schemas
