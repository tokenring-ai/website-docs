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

- `attach(agent: Agent): Promise<void>`: Initializes thinking state for an agent
- `processStep(toolName: string, args: any, agent: Agent, processor: (session: ReasoningSession, args: any) => any): any`: Processes reasoning steps
- `clearSession(toolName: string, agent: Agent): void`: Clears specific tool session
- `clearAll(agent: Agent): void`: Clears all reasoning sessions

### ThinkingState

Agent state slice that manages reasoning session persistence.

- `serialize(): object`: Serializes the current session state for storage
- `deserialize(data: any): void`: Deserializes state from serialized data
- `reset(what: ResetWhat[]): void`: Resets specified parts of the state (e.g., clears sessions when 'chat' is included)
- `show(): string[]`: Returns summary of active sessions (step counts and completion status)

### ReasoningSession

Individual reasoning session state interface.

```typescript
interface ReasoningSession {
  tool: string;
  problem: string;
  stepNumber: number;
  data: Record<string, any>;
  completedSteps: string[];
  complete: boolean;
}
```

## Services and APIs

### ThinkingService API

| Method | Parameters | Description |
|--------|------------|-------------|
| `attach` | `agent: Agent` | Initializes ThinkingState for agent |
| `processStep` | `toolName: string`, `args: any`, `agent: Agent`, `processor: Function` | Processes step in reasoning session |
| `clearSession` | `toolName: string`, `agent: Agent` | Clears specific tool session |
| `clearAll` | `agent: Agent` | Clears all reasoning sessions |

### ThinkingState API

| Method | Parameters | Description |
|--------|------------|-------------|
| `serialize` | - | Returns serialized state object |
| `deserialize` | `data: any` | Loads state from serialized data |
| `reset` | `what: ResetWhat[]` | Resets state based on reset flags |
| `show` | - | Returns session summary array |

## Commands and Tools

### 1. Scientific Method (`scientific-method-reasoning`)

Enforces strict scientific method reasoning with 7 core steps:

```typescript
await agent.executeTool('scientific-method-reasoning', {
  problem: "Why does water boil at different temperatures at different altitudes?",
  step: "question_observation",
  content: "Water boils at 100°C at sea level but at lower temperatures at higher altitudes.",
  nextThoughtNeeded: true
});
```

**Available steps:** question_observation, background_research, hypothesis_formulation, prediction, testing_experimentation, analysis, conclusion

### 2. Socratic Dialogue (`socratic-dialogue`)

Questions assumptions through structured inquiry:

```typescript
await agent.executeTool('socratic-dialogue', {
  problem: "Is democracy the best form of government?",
  step: "question_formulation",
  content: "What makes a form of government 'best'?",
  nextThoughtNeeded: true
});
```

**Available steps:** question_formulation, assumption_identification, challenge_assumption, explore_contradiction, refine_understanding, synthesis

### 3. Design Thinking (`design-thinking`)

Human-centered design process:

```typescript
await agent.executeTool('design-thinking', {
  problem: "Design a better mobile app for task management",
  step: "empathize",
  content: "Users need simple, intuitive task organization with minimal cognitive load",
  nextThoughtNeeded: true
});
```

**Available steps:** empathize, define, ideate, prototype, test, iterate

### 4. Root Cause Analysis (`root-cause-analysis`)

5 Whys methodology for finding fundamental causes:

```typescript
await agent.executeTool('root-cause-analysis', {
  problem: "Customer complaints about slow response times",
  step: "ask_why",
  content: "Why are response times slow? Because support team is understaffed",
  nextThoughtNeeded: true
});
```

**Available steps:** state_problem, ask_why, identify_root_cause, propose_solution

### 5. SWOT Analysis (`swot-analysis`)

Strategic planning through strengths, weaknesses, opportunities, threats:

```typescript
await agent.executeTool('swot-analysis', {
  problem: "Expanding our startup into international markets",
  step: "strengths",
  content: "We have strong technical expertise and proven product-market fit",
  nextThoughtNeeded: true
});
```

**Available steps:** define_objective, strengths, weaknesses, opportunities, threats, synthesize_strategy

### 6. Pre-Mortem (`pre-mortem`)

Imagines failure to prevent it:

```typescript
await agent.executeTool('pre-mortem', {
  problem: "Launching our new product feature",
  step: "list_failure_reasons",
  content: "Users don't understand how to use the new feature",
  likelihood: "high",
  nextThoughtNeeded: true
});
```

**Available steps:** define_goal, assume_failure, list_failure_reasons, assess_likelihood, develop_mitigations, revise_plan

### 7. Dialectical Reasoning (`dialectical-reasoning`)

Considers opposing views:

```typescript
await agent.executeTool('dialectical-reasoning', {
  problem: "Should we prioritize growth or profitability?",
  step: "state_thesis",
  content: "We should prioritize growth to capture market share",
  nextThoughtNeeded: true
});
```

**Available steps:** state_thesis, develop_antithesis, identify_contradictions, find_common_ground, synthesize

### 8. First Principles (`first-principles`)

Breaks down to fundamental truths:

```typescript
await agent.executeTool('first-principles', {
  problem: "How can we reduce battery costs?",
  step: "identify_assumptions",
  content: "Assumption: Batteries must use current lithium-ion technology",
  nextThoughtNeeded: true
});
```

**Available steps:** state_problem, identify_assumptions, challenge_assumptions, break_to_fundamentals, rebuild_from_basics, novel_solution

### 9. Decision Matrix (`decision-matrix`)

Structured multi-criteria decision making:

```typescript
await agent.executeTool('decision-matrix', {
  problem: "Which cloud provider should we choose?",
  step: "list_options",
  content: "AWS",
  nextThoughtNeeded: true
});
```

**Available steps:** define_decision, list_options, define_criteria, weight_criteria, score_options, calculate_decide

### 10. Lateral Thinking (`lateral-thinking`)

Creative problem reframing:

```typescript
await agent.executeTool('lateral-thinking', {
  problem: "How to reduce office space usage?",
  step: "generate_stimulus",
  content: "Coffee shops have high productivity per square foot",
  nextThoughtNeeded: true
});
```

**Available steps:** state_problem, generate_stimulus, force_connection, explore_tangent, extract_insight, apply_to_problem

### 11. Agile Sprint (`agile-sprint`)

Iterative development planning:

```typescript
await agent.executeTool('agile-sprint', {
  problem: "Build a customer portal in 2 weeks",
  step: "break_into_stories",
  content: "User authentication module",
  estimate: 3,
  nextThoughtNeeded: true
});
```

**Available steps:** define_goal, break_into_stories, estimate_effort, prioritize, plan_sprint, execute, review, retrospect

### 12. Feynman Technique (`feynman-technique`)

Learning through explanation:

```typescript
await agent.executeTool('feynman-technique', {
  problem: "Understand blockchain technology",
  step: "explain_simply",
  content: "Blockchain is like a shared notebook that multiple people can write in, but no one can erase what's already written",
  nextThoughtNeeded: true
});
```

**Available steps:** choose_concept, explain_simply, identify_gaps, review_source, simplify_further, use_analogies

### 13. Six Thinking Hats (`six-thinking-hats`)

Parallel thinking from different perspectives:

```typescript
await agent.executeTool('six-thinking-hats', {
  problem: "Should we implement mandatory remote work?",
  step: "think",
  hat: "white",
  content: "Facts: 70% of employees prefer remote work options",
  nextThoughtNeeded: true
});
```

**Available hats:** white, red, black, yellow, green, blue

**Available steps:** think, synthesize

## Configuration

No additional configuration required. The package uses sensible defaults and automatically integrates with the Token Ring framework.

## Usage Examples

### Basic Integration

```typescript
// Execute a scientific method reasoning session
const result = await agent.executeTool('scientific-method-reasoning', {
  problem: "What causes climate change?",
  step: "question_observation",
  content: "Global temperatures have risen significantly since the 1980s",
  nextThoughtNeeded: true
});

// Continue the session with next step
const result2 = await agent.executeTool('scientific-method-reasoning', {
  step: "background_research",
  content: "Historical temperature records show consistent warming trend",
  nextThoughtNeeded: true
});
```

### Multi-Tool Workflow

```typescript
// Use decision matrix to evaluate cloud providers
const decisionResult = await agent.executeTool('decision-matrix', {
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

// Define criteria
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

## API Reference

### ThinkingService

```typescript
class ThinkingService implements TokenRingService {
  name: string = "ThinkingService";
  description: string = "Provides structured reasoning functionality";

  async attach(agent: Agent): Promise<void>;
  processStep(toolName: string, args: any, agent: Agent, processor: (session: ReasoningSession, args: any) => any): any;
  clearSession(toolName: string, agent: Agent): void;
  clearAll(agent: Agent): void;
}
```

### ThinkingState

```typescript
class ThinkingState implements AgentStateSlice {
  name: string = "ThinkingState";
  sessions: Map<string, ReasoningSession> = new Map();

  serialize(): object;
  deserialize(data: any): void;
  reset(what: ResetWhat[]): void;
  show(): string[];
}
```

### ReasoningSession

```typescript
interface ReasoningSession {
  tool: string;
  problem: string;
  stepNumber: number;
  data: Record<string, any>;
  completedSteps: string[];
  complete: boolean;
}
```

## Integration

The plugin automatically registers with the Token Ring application through the plugin system:

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

## Monitoring and Debugging

- **Session Monitoring**: Use `agent.getState(ThinkingState).show()` to view active sessions and their progress:

```typescript
const state = agent.getState(ThinkingState);
console.log(state.show());
// Output: ["Active Sessions: 1", "  scientific-method-reasoning: 3 steps, in progress"]
```

- **Error Handling**: All tools validate inputs using Zod schemas and throw descriptive errors on invalid arguments.

- **Debugging Tools**: The `ThinkingState.show()` method provides clear session summaries for debugging.

## Development

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

### Package Structure

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
└── test/                 # Test suite
    ├── tools.test.ts
    ├── integration.test.ts
    ├── firstPrinciples.test.ts
    ├── decisionMatrix.test.ts
    ├── scientificMethod.test.ts
    ├── thinkingState.test.ts
    └── thinkingService.test.ts
```

### License

MIT