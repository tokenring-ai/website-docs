# @tokenring-ai/thinking

Structured reasoning service with 13 specialized thinking tools for disciplined problem-solving and persistent state management.

## Overview

The `@tokenring-ai/thinking` package provides a comprehensive suite of 13 structured reasoning tools that implement various thinking methodologies with persistent state management. Each tool guides AI agents through disciplined problem-solving using proven human cognitive frameworks and maintains reasoning sessions across multiple calls.

## Key Features

- **13 Structured Thinking Tools**: Scientific method, design thinking, root cause analysis, SWOT analysis, pre-mortem, dialectical reasoning, first principles, decision matrix, lateral thinking, agile sprint, Feynman technique, socratic dialogue, and six thinking hats
- **State Management**: Persistent reasoning sessions that track progress across multiple calls
- **Automatic Integration**: Tools automatically register with chat services and agents via plugin system
- **Session Isolation**: Independent session tracking for each reasoning tool
- **Progress Tracking**: Monitor completed steps and reasoning progress via `show()` method
- **Session Cleanup**: Clear individual or all reasoning sessions
- **Tool Integration**: Automatically registered with Token Ring agent chat systems
- **Zod Validation**: Typed input schemas for all tools
- **Error Handling**: Comprehensive error handling and validation
- **Testing**: Full test coverage with vitest

## Core Components

### ThinkingService

Main service class that manages reasoning sessions and state persistence.

```typescript
import ThinkingService from "@tokenring-ai/thinking/ThinkingService";

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
| `processStep` | `toolName: string`, `args: any`, `agent: Agent`, `processor: (session: ReasoningSession, args: any) => any` | `ReasoningSession` | Processes step in reasoning session and returns updated session |
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
| `reset` | `void` | `void` | Reset state (clears all sessions) |
| `serialize` | `void` | `z.output<typeof serializationSchema>` | Returns serialized state object |
| `deserialize` | `data: z.output<typeof serializationSchema>` | `void` | Load state from serialized data |
| `show` | `void` | `string[]` | Returns session summary array |

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

## Available Tools

### 1. Scientific Method (`scientific-method-reasoning`)

A strictly disciplined reasoning tool that enforces exact adherence to the scientific method with hypothesis tracking.

**Steps:**

1. `question_observation` - Clearly state the problem and relevant observations
2. `background_research` - Gather and restate existing knowledge, constraints, or facts
3. `hypothesis_formulation` - Formulate testable hypotheses (one or more; each must be falsifiable)
4. `prediction` - State specific, testable predictions derived from a hypothesis
5. `testing_experimentation` - Perform tests to gather evidence
6. `analysis` - Interpret evidence objectively
7. `conclusion` - Draw evidence-based conclusion

**Input Schema:**

```typescript
z.object({
  problem: z.string().optional(),
  step: z.enum([
    "question_observation",
    "background_research",
    "hypothesis_formulation",
    "prediction",
    "testing_experimentation",
    "analysis",
    "conclusion"
  ]),
  content: z.string(),
  targets_hypothesis_id: z.array(z.string()).optional(),
  hypothesis_update: z.object({
    hypothesis_id: z.string().optional(),
    new_hypothesis_text: z.string().optional(),
    action: z.enum(["propose", "refine", "refute", "support"]).optional()
  }).optional(),
  nextThoughtNeeded: z.boolean(),
  final_answer: z.string().optional()
});
```

### 2. Socratic Dialogue (`socratic-dialogue`)

Questions assumptions through structured inquiry.

**Steps:**

1. `question_formulation` - Formulate the initial question
2. `assumption_identification` - Identify underlying assumptions
3. `challenge_assumption` - Challenge identified assumptions
4. `explore_contradiction` - Explore contradictions that arise
5. `refine_understanding` - Refine understanding based on analysis
6. `synthesis` - Synthesize new understanding

### 3. Design Thinking (`design-thinking`)

Human-centered design process.

**Steps:**

1. `empathize` - Understand user needs and perspectives
2. `define` - Define the problem clearly
3. `ideate` - Generate creative solutions
4. `prototype` - Build prototypes of solutions
5. `test` - Test prototypes with users
6. `iterate` - Iterate based on feedback

### 4. Root Cause Analysis (`root-cause-analysis`)

5 Whys methodology for finding fundamental causes.

**Steps:**

1. `state_problem` - Clearly state the problem
2. `ask_why` - Ask why the problem occurs
3. `identify_root_cause` - Identify the fundamental root cause
4. `propose_solution` - Propose a solution addressing the root cause

### 5. SWOT Analysis (`swot-analysis`)

Strategic planning through strengths, weaknesses, opportunities, threats.

**Steps:**

1. `define_objective` - Define the objective or goal to analyze
2. `strengths` - Identify internal strengths
3. `weaknesses` - Identify internal weaknesses
4. `opportunities` - Identify external opportunities
5. `threats` - Identify external threats
6. `synthesize_strategy` - Synthesize findings into a strategy

### 6. Pre-Mortem (`pre-mortem`)

Imagines failure to prevent it.

**Steps:**

1. `define_goal` - Define the goal or plan to analyze
2. `assume_failure` - Assume the plan has failed
3. `list_failure_reasons` - List reasons for the failure
4. `assess_likelihood` - Assess likelihood of each failure reason
5. `develop_mitigations` - Develop mitigations for high-likelihood failures
6. `revise_plan` - Revise the plan based on mitigations

### 7. Dialectical Reasoning (`dialectical-reasoning`)

Considers opposing views.

**Steps:**

1. `state_thesis` - State the initial position or thesis
2. `develop_antithesis` - Develop the opposing position
3. `identify_contradictions` - Identify contradictions between thesis and antithesis
4. `find_common_ground` - Find common ground between opposing views
5. `synthesize` - Synthesize a higher understanding

### 8. First Principles (`first-principles`)

Breaks down to fundamental truths.

**Steps:**

1. `state_problem` - State the problem to solve
2. `identify_assumptions` - Identify assumptions about the problem
3. `challenge_assumptions` - Challenge each assumption
4. `break_to_fundamentals` - Break down to fundamental truths
5. `rebuild_from_basics` - Rebuild solution from fundamentals
6. `novel_solution` - Create novel solution

### 9. Decision Matrix (`decision-matrix`)

Structured multi-criteria decision making.

**Steps:**

1. `define_decision` - Define the decision to be made
2. `list_options` - List available options
3. `define_criteria` - Define evaluation criteria
4. `weight_criteria` - Weight the criteria by importance
5. `score_options` - Score each option against each criterion
6. `calculate_decide` - Calculate totals and make decision

### 10. Lateral Thinking (`lateral-thinking`)

Creative problem reframing.

**Steps:**

1. `state_problem` - State the problem
2. `generate_stimulus` - Generate random stimulus
3. `force_connection` - Force connection between stimulus and problem
4. `explore_tangent` - Explore the tangent idea
5. `extract_insight` - Extract insight from exploration
6. `apply_to_problem` - Apply insight to original problem

### 11. Agile Sprint (`agile-sprint`)

Iterative development planning.

**Steps:**

1. `define_goal` - Define the sprint goal
2. `break_into_stories` - Break goal into user stories
3. `estimate_effort` - Estimate effort for each story
4. `prioritize` - Prioritize stories
5. `plan_sprint` - Plan the sprint
6. `execute` - Execute sprint tasks
7. `review` - Review sprint results
8. `retrospect` - Conduct retrospective

### 12. Feynman Technique (`feynman-technique`)

Learning through explanation.

**Steps:**

1. `choose_concept` - Choose the concept to understand
2. `explain_simply` - Explain it simply
3. `identify_gaps` - Identify gaps in understanding
4. `review_source` - Review source material
5. `simplify_further` - Simplify further
6. `use_analogies` - Use analogies to explain

### 13. Six Thinking Hats (`six-thinking-hats`)

Parallel thinking from different perspectives.

**Hats:**

- `white` - Facts and information
- `red` - Emotions and feelings
- `black` - Risks and caution
- `yellow` - Benefits and optimism
- `green` - Creativity and new ideas
- `blue` - Process and control

**Steps:**

1. `think` - Think from the perspective of a specific hat
2. `synthesize` - Synthesize all perspectives

## Usage Examples

### Scientific Method

```typescript
// First call - initialize with problem and observation
const result1 = await agent.executeTool('scientific-method-reasoning', {
  problem: "Why does water boil at different temperatures at different altitudes?",
  step: "question_observation",
  content: "Water boils at 100°C at sea level but at lower temperatures at higher altitudes.",
  nextThoughtNeeded: true
});

// Formulate hypothesis
const result2 = await agent.executeTool('scientific-method-reasoning', {
  step: "hypothesis_formulation",
  content: "Lower atmospheric pressure at higher altitudes reduces the boiling point.",
  hypothesis_update: {
    new_hypothesis_text: "Reduced atmospheric pressure causes water to boil at lower temperatures",
    action: "propose"
  },
  nextThoughtNeeded: true
});

// Test the hypothesis
const result3 = await agent.executeTool('scientific-method-reasoning', {
  step: "testing_experimentation",
  content: "At 3000m altitude, atmospheric pressure is ~70% of sea level, and water boils at ~90°C.",
  targets_hypothesis_id: ["h1"],
  nextThoughtNeeded: true
});

// Final conclusion
const result4 = await agent.executeTool('scientific-method-reasoning', {
  step: "conclusion",
  content: "Evidence confirms that reduced atmospheric pressure at higher altitudes causes water to boil at lower temperatures.",
  nextThoughtNeeded: false,
  final_answer: "Reduced atmospheric pressure at higher altitudes causes water to boil at lower temperatures."
});
```

### Decision Matrix

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

### Design Thinking

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

### Pre-Mortem Analysis

```typescript
await agent.executeTool('pre-mortem', {
  problem: "Launching our new product feature",
  step: "assume_failure",
  content: "The feature launch failed to meet adoption targets",
  nextThoughtNeeded: true
});

await agent.executeTool('pre-mortem', {
  step: "list_failure_reasons",
  content: "Users don't understand how to use the new feature",
  likelihood: "high",
  nextThoughtNeeded: true
});

await agent.executeTool('pre-mortem', {
  step: "develop_mitigations",
  content: "Create onboarding tutorial and in-app guidance",
  targets_scenario: "Users don't understand how to use the new feature",
  nextThoughtNeeded: true
});
```

### Six Thinking Hats

```typescript
await agent.executeTool('six-thinking-hats', {
  problem: "Should we implement mandatory remote work?",
  step: "think",
  hat: "white",
  content: "Facts: 70% of employees prefer remote work options",
  nextThoughtNeeded: true
});

await agent.executeTool('six-thinking-hats', {
  step: "think",
  hat: "black",
  content: "Risks: Reduced collaboration, potential security concerns",
  nextThoughtNeeded: true
});

await agent.executeTool('six-thinking-hats', {
  step: "think",
  hat: "yellow",
  content: "Benefits: Increased productivity, better work-life balance",
  nextThoughtNeeded: true
});

await agent.executeTool('six-thinking-hats', {
  step: "synthesize",
  content: "Hybrid model balances collaboration needs with flexibility preferences",
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

// Reset state (clears all sessions)
state.reset();
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

- `vitest` (^4.1.0) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Package Structure

```
pkg/thinking/
├── index.ts                    # Package exports (ThinkingService)
├── plugin.ts                   # Auto-registration plugin
├── ThinkingService.ts          # Core service implementation
├── tools.ts                    # Tool exports and registry
├── state/
│   └── thinkingState.ts        # State management for sessions
├── tools/                      # Individual tool implementations
│   ├── scientificMethod.ts     # Scientific method reasoning
│   ├── socraticDialogue.ts     # Socratic dialogue
│   ├── designThinking.ts       # Design thinking
│   ├── rootCauseAnalysis.ts    # Root cause analysis (5 Whys)
│   ├── swotAnalysis.ts         # SWOT analysis
│   ├── preMortem.ts            # Pre-mortem analysis
│   ├── dialecticalReasoning.ts # Dialectical reasoning
│   ├── firstPrinciples.ts      # First principles thinking
│   ├── decisionMatrix.ts       # Decision matrix
│   ├── lateralThinking.ts      # Lateral thinking
│   ├── agileSprint.ts          # Agile sprint planning
│   ├── feynmanTechnique.ts     # Feynman technique
│   └── sixThinkingHats.ts      # Six thinking hats
├── test/                       # Test suite
│   └── *.test.ts               # Test files
└── vitest.config.ts            # Test configuration
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
- [@tokenring-ai/app](app.md) - Application framework and service management
- [@tokenring-ai/utility](utility.md) - Shared utilities and helpers

## License

MIT
