# Thinking Plugin

## Overview

The `@tokenring-ai/thinking` package provides a comprehensive suite of 13 structured reasoning tools that implement various thinking methodologies with persistent state management. Each tool guides AI agents through disciplined problem-solving using proven human cognitive frameworks and maintains reasoning sessions across multiple calls.

## Key Features

- **13 Structured Thinking Tools**: Scientific method, design thinking, root cause analysis, SWOT analysis, and more
- **State Management**: Persistent reasoning sessions that track progress across multiple calls
- **Automatic Integration**: Tools automatically register with chat services and agents
- **Session Isolation**: Independent session tracking for each reasoning tool
- **Progress Tracking**: Monitor completed steps and reasoning progress
- **Session Cleanup**: Clear individual or all reasoning sessions
- **Tool Integration**: Automatically registered with Token Ring agent chat systems
- **Zod Validation**: Typed input schemas for all tools
- **Error Handling**: Comprehensive error handling and validation
- **Testing**: Full test coverage with vitest

## Core Components

### ThinkingService

Main service class that manages reasoning sessions and state persistence.

```typescript
import { ThinkingService } from "@tokenring-ai/thinking";

const thinkingService = new ThinkingService();
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name ("ThinkingService") |
| `description` | `string` | Service description ("Provides structured reasoning functionality") |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `attach` | `agent: Agent` | `void` | Initializes ThinkingState for agent |
| `processStep` | `toolName: string`, `args: any`, `agent: Agent`, `processor: (session, args) => any` | `any` | Processes step in reasoning session |
| `clearSession` | `toolName: string`, `agent: Agent` | `void` | Clears specific tool session |
| `clearAll` | `agent: Agent` | `void` | Clears all reasoning sessions |

### ThinkingState

Agent state slice that manages reasoning session persistence.

```typescript
import { ThinkingState } from "@tokenring-ai/thinking";

// Automatically attached to agents by ThinkingService
const state = agent.getState(ThinkingState);
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | State slice name ("ThinkingState") |
| `serializationSchema` | `ZodSchema` | Zod schema for serialization |
| `sessions` | `Map<string, ReasoningSession>` | Active reasoning sessions |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `constructor` | `data: Partial<ThinkingState>` | `void` | Create new state instance with optional initial data |
| `transferStateFromParent` | `parent: Agent` | `void` | Transfer state from parent agent |
| `reset` | `what: ResetWhat[]` | `void` | Reset state based on flags (e.g., `['chat']` clears sessions) |
| `serialize` | - | `z.output<typeof serializationSchema>` | Returns serialized state object |
| `deserialize` | `data: z.output<typeof serializationSchema>` | `void` | Load state from serialized data |
| `show` | - | `string[]` | Returns session summary array |

### ReasoningSession

Individual reasoning session state interface.

```typescript
interface ReasoningSession {
  tool: string;                  // Tool name
  problem: string;               // Problem being investigated
  stepNumber: number;            // Current step count
  data: Record<string, any>;     // Tool-specific data storage
  completedSteps: string[];      // Steps completed
  complete: boolean;             // Whether reasoning is complete
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `tool` | `string` | Tool name (e.g., "scientific-method-reasoning") |
| `problem` | `string` | Problem being investigated |
| `stepNumber` | `number` | Current step count in the session |
| `data` | `Record<string, any>` | Tool-specific data storage |
| `completedSteps` | `string[]` | Array of completed step names |
| `complete` | `boolean` | Whether reasoning is complete |

## Services

### ThinkingService Implementation

```typescript
export default class ThinkingService implements TokenRingService {
  readonly name = "ThinkingService";
  description = "Provides structured reasoning functionality";

  attach(agent: Agent): void {
    agent.initializeState(ThinkingState, {});
  }

  processStep(
    toolName: string,
    args: any,
    agent: Agent,
    processor: (session: ReasoningSession, args: any) => any
  ): any {
    const state = agent.getState(ThinkingState);
    let session = state.sessions.get(toolName);

    if (!session) {
      if (!args.problem) {
        throw new Error("Problem must be defined on first call");
      }
      session = {
        tool: toolName,
        problem: args.problem,
        stepNumber: 0,
        data: {},
        completedSteps: [],
        complete: false,
      };
    }

    agent.mutateState(ThinkingState, (s: ThinkingState) => {
      session!.stepNumber++;
      if (args.step && !session!.completedSteps.includes(args.step)) {
        session!.completedSteps.push(args.step);
      }
      const result = processor(session!, args);
      session!.complete = args.nextThoughtNeeded === false || args.complete === true;
      s.sessions.set(toolName, session!);
      return result;
    });

    return agent.getState(ThinkingState).sessions.get(toolName);
  }

  clearSession(toolName: string, agent: Agent): void {
    agent.mutateState(ThinkingState, (state: ThinkingState) => {
      state.sessions.delete(toolName);
    });
  }

  clearAll(agent: Agent): void {
    agent.mutateState(ThinkingState, (state: ThinkingState) => {
      state.sessions.clear();
    });
  }
}
```

## Provider Documentation

This package does not implement a provider architecture.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands. Tools are accessed via `agent.executeTool()`.

## Configuration

No additional configuration required. The package uses sensible defaults and automatically integrates with the Token Ring framework.

### Plugin Configuration

```typescript
import packageConfigSchema from "@tokenring-ai/thinking/plugin";

// Schema is empty as no configuration is needed
const schema = z.object({});
```

## Integration

The package automatically integrates with the Token Ring application through the plugin system:

```typescript
import thinkingPlugin from "@tokenring-ai/thinking/plugin";

// Automatically registered in plugin.ts
// No manual registration needed
```

### Service Registration

The ThinkingService is automatically registered with the application's service registry and can be accessed by agents:

```typescript
const thinkingService = agent.requireServiceByType(ThinkingService);
```

### Tool Registration

All 13 reasoning tools are automatically registered with the chat system:

```typescript
await agent.executeTool('scientific-method-reasoning', {...});
await agent.executeTool('first-principles', {...});
// ... etc for all 13 tools
```

## Usage Examples

### Basic Usage with Scientific Method

```typescript
// First call - initializes session
const result1 = await agent.executeTool('scientific-method-reasoning', {
  problem: "Why does water boil at different temperatures at different altitudes?",
  step: "question_observation",
  content: "Water boils at 100°C at sea level but at lower temperatures at higher altitudes.",
  nextThoughtNeeded: true
});

// Continue the session with next step
const result2 = await agent.executeTool('scientific-method-reasoning', {
  step: "background_research",
  content: "Historical temperature records show consistent warming trend",
  nextThoughtNeeded: true
});

// Final step - completes the session
const result3 = await agent.executeTool('scientific-method-reasoning', {
  step: "conclusion",
  content: "Water boils at lower temperatures at higher altitudes due to reduced atmospheric pressure.",
  nextThoughtNeeded: false,
  final_answer: "Reduced atmospheric pressure at higher altitudes causes water to boil at lower temperatures."
});
```

### Multi-Tool Workflow with Decision Matrix

```typescript
// Define decision
await agent.executeTool('decision-matrix', {
  problem: "Which cloud provider should we choose?",
  step: "define_decision",
  content: "Select the most effective cloud provider for our project",
  nextThoughtNeeded: true
});

// Add options
await agent.executeTool('decision-matrix', {
  step: "list_options",
  content: "AWS",
  nextThoughtNeeded: true
});

await agent.executeTool('decision-matrix', {
  step: "list_options",
  content: "Azure",
  nextThoughtNeeded: true
});

// Define criteria with weights
await agent.executeTool('decision-matrix', {
  step: "define_criteria",
  content: "Performance",
  weight: 3,
  nextThoughtNeeded: true
});

await agent.executeTool('decision-matrix', {
  step: "define_criteria",
  content: "Cost",
  weight: 1,
  nextThoughtNeeded: true
});

// Score options
await agent.executeTool('decision-matrix', {
  step: "score_options",
  option: "AWS",
  criterion: "Performance",
  score: 8,
  nextThoughtNeeded: true
});

await agent.executeTool('decision-matrix', {
  step: "score_options",
  option: "AWS",
  criterion: "Cost",
  score: 5,
  nextThoughtNeeded: true
});

// Get final recommendation
const finalResult = await agent.executeTool('decision-matrix', {
  step: "calculate_decide",
  content: "AWS offers the best balance of performance and cost",
  nextThoughtNeeded: false
});
```

### Using Design Thinking

```typescript
// Empathize phase
await agent.executeTool('design-thinking', {
  problem: "Improve user onboarding flow",
  step: "empathize",
  content: "Users feel overwhelmed during first-time setup",
  nextThoughtNeeded: true
});

// Define problem
await agent.executeTool('design-thinking', {
  step: "define",
  content: "Users need a simplified, step-by-step onboarding experience",
  nextThoughtNeeded: true
});

// Ideate solutions
await agent.executeTool('design-thinking', {
  step: "ideate",
  content: "Create a guided tour with interactive elements",
  nextThoughtNeeded: true
});

// Prototype solution
await agent.executeTool('design-thinking', {
  step: "prototype",
  content: "Create a Figma prototype with onboarding flow",
  nextThoughtNeeded: true
});

// Test prototype
await agent.executeTool('design-thinking', {
  step: "test",
  content: "User testing shows 40% improvement in completion rate",
  nextThoughtNeeded: true
});

// Iterate based on feedback
await agent.executeTool('design-thinking', {
  step: "iterate",
  content: "Add video tutorials and reduce required steps by 50%",
  nextThoughtNeeded: false
});
```

### Checking Session Progress

```typescript
const state = agent.getState(ThinkingState);
console.log(state.show());
// Output: ["Active Sessions: 1", "  scientific-method-reasoning: 3 steps, in progress"]
```

### Clearing Sessions

```typescript
// Clear a specific tool's session
thinkingService.clearSession('scientific-method-reasoning', agent);

// Clear all reasoning sessions
thinkingService.clearAll(agent);
```

### State Transfer Between Agents

```typescript
const childAgent = new Agent();
const parentAgent = new Agent();

// Transfer state from parent to child
const childThinkingState = new ThinkingState();
childThinkingState.transferStateFromParent(parentAgent);

// Now child agent has the same reasoning sessions as parent
```

### State Serialization and Deserialization

```typescript
// Serialize state
const state = agent.getState(ThinkingState);
const serialized = state.serialize();

// Save to storage (e.g., database, file)
const savedState = JSON.stringify(serialized);

// Later, deserialize state
const savedData = JSON.parse(savedState);
const newState = new ThinkingState(savedData);
```

### State Reset

```typescript
const state = agent.getState(ThinkingState);

// Reset only chat-related state
state.reset(['chat']);

// Reset all state
state.reset(['all']);
```

## Best Practices

### Session Management

1. **Always provide problem on first call**: The `problem` field is required on the first call to any tool
2. **Track step progress**: Use `agent.getState(ThinkingState).show()` to monitor session progress
3. **Complete sessions properly**: Set `nextThoughtNeeded: false` only when the reasoning is complete
4. **Clear sessions when done**: Use `clearSession()` or `clearAll()` to free memory

### Tool Selection

1. **Use scientific method** for hypothesis-driven investigations
2. **Use design thinking** for user-centered problems
3. **Use decision matrix** for multi-criteria decisions
4. **Use pre-mortem** for risk analysis
5. **Use six thinking hats** for comprehensive perspective analysis

### Integration Patterns

1. **Automatic registration**: No manual registration needed - tools are automatically available
2. **Service access**: Access ThinkingService via `agent.requireServiceByType(ThinkingService)`
3. **State persistence**: Sessions persist across multiple calls and agent restarts

## Testing

### Unit Tests

The package includes comprehensive unit tests for all tools:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Coverage

- **ThinkingService**: All service methods tested
- **ThinkingState**: State management, serialization, and transfer tested
- **All 13 tools**: Tool execution and state management tested
- **Integration tests**: Full workflow scenarios tested

### Example Test Pattern

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import Agent from "@tokenring-ai/agent";
import ThinkingService from "../../ThinkingService.ts";
import { ThinkingState } from "../../state/thinkingState.ts";

describe("ThinkingService", () => {
  let agent: Agent;
  let thinkingService: ThinkingService;

  beforeEach(() => {
    agent = new Agent({
      workHandler: async (work) => {
        // Handle work requests
      }
    });
    thinkingService = new ThinkingService();
    thinkingService.attach(agent);
  });

  it("processes scientific method steps correctly", async () => {
    // First call - initialize session
    const result1 = await thinkingService.processStep(
      'scientific-method-reasoning',
      {
        problem: "Test problem",
        step: "question_observation",
        content: "Test content",
        nextThoughtNeeded: true
      },
      agent,
      (session, args) => {
        return { type: "json", data: { step: args.step } };
      }
    );

    expect(result1).toBeDefined();
    expect(result1!.stepNumber).toBe(1);
    expect(result1!.problem).toBe("Test problem");

    // Second call - continue session
    const result2 = await thinkingService.processStep(
      'scientific-method-reasoning',
      {
        step: "background_research",
        content: "More content",
        nextThoughtNeeded: false
      },
      agent,
      (session, args) => {
        return { type: "json", data: { step: args.step } };
      }
    );

    expect(result2!.stepNumber).toBe(2);
    expect(result2!.complete).toBe(true);
  });
});
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework and service management
- `@tokenring-ai/chat` (0.2.0) - Chat service and tool definitions
- `@tokenring-ai/agent` (0.2.0) - Agent system and state management
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Package Structure

```
pkg/thinking/
├── index.ts              # Package exports
├── plugin.ts             # Auto-registration plugin
├── ThinkingService.ts    # Core service implementation
├── tools.ts              # Tool exports and registry
├── state/
│   └── thinkingState.ts  # State management for sessions
├── tools/                # Individual tool implementations
│   ├── scientificMethod.ts
│   ├── socraticDialogue.ts
│   ├── designThinking.ts
│   ├── rootCauseAnalysis.ts
│   ├── swotAnalysis.ts
│   ├── preMortem.ts
│   ├── dialecticalReasoning.ts
│   ├── firstPrinciples.ts
│   ├── decisionMatrix.ts
│   ├── lateralThinking.ts
│   ├── agileSprint.ts
│   ├── feynmanTechnique.ts
│   └── sixThinkingHats.ts
├── test/                 # Test suite
│   ├── tools.test.ts
│   ├── integration.test.ts
│   ├── firstPrinciples.test.ts
│   ├── decisionMatrix.test.ts
│   ├── scientificMethod.test.ts
│   ├── thinkingState.test.ts
│   └── thinkingService.test.ts
└── vitest.config.ts      # Test configuration
```

## Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Watch Tests

```bash
bun run test:watch
```

### Coverage

```bash
bun run test:coverage
```

## Related Components

- [@tokenring-ai/agent](agent.md) - Agent system and state management
- [@tokenring-ai/chat](chat.md) - Chat service and tool definitions
- [@tokenring-ai/app](token-ring-app.md) - Application framework and service management
- [@tokenring-ai/utility](utility.md) - Shared utilities and helpers

## License

MIT
