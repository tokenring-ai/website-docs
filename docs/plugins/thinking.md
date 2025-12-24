# Thinking Plugin

Scientific method reasoning service with structured thinking tools and state management.

## Overview

The `@tokenring-ai/thinking` package provides structured reasoning tools that implement various thinking methodologies and maintain persistent reasoning state. It includes tools for scientific method, design thinking, root cause analysis, and other structured reasoning approaches, with state management to track reasoning sessions across multiple steps.

## Key Features

- **Structured Thinking Tools**: Multiple reasoning methodologies (scientific method, design thinking, etc.)
- **State Management**: Persistent reasoning sessions with step tracking and data persistence
- **Tool Integration**: Automatically registered with chat services
- **Session Management**: Track multiple reasoning sessions independently
- **Progress Tracking**: Monitor completed steps and reasoning progress
- **Result Persistence**: Maintain reasoning data across tool calls
- **Session Cleanup**: Clear individual or all reasoning sessions
- **Data Tracking**: Maintain tool-specific data and hypothesis tracking
- **Iterative Process**: Support for multi-step reasoning with state preservation

## Core Components

### ThinkingService

The main service that manages reasoning sessions and state:

```typescript
class ThinkingService implements TokenRingService {
  name = "ThinkingService";
  description = "Provides structured reasoning functionality";
  
  async attach(agent: Agent): Promise<void>
  processStep(toolName: string, args: any, agent: Agent, processor: (session: ReasoningSession, args: any) => any): any
  clearSession(toolName: string, agent: Agent): void
  clearAll(agent: Agent): void
}
```

### Reasoning State

Manages reasoning session data with persistent state:

```typescript
interface ReasoningSession {
  tool: string;                  // Tool name (e.g., "scientific-method-reasoning")
  problem: string;               // The problem being investigated
  stepNumber: number;            // Current step number
  data: Record<string, any>;     // Session-specific data (e.g., hypotheses, thoughts)
  completedSteps: string[];      // Completed reasoning steps
  complete: boolean;             // Whether reasoning is complete
}

class ThinkingState implements AgentStateSlice {
  sessions: Map<string, ReasoningSession> = new Map();
  
  // State management methods
  reset(what: ResetWhat[]): void
  serialize(): object
  deserialize(data: any): void
  show(): string[]
}
```

### Available Tools

**scientificMethod**: Scientific method reasoning tool
- Enforces strict adherence to scientific method steps
- Maintains hypothesis tracking with explicit IDs and statuses
- Supports multiple hypotheses and testing
- Maintains thought history with step tracking

**socraticDialogue**: Socratic questioning and dialogue
- Structured questioning approach
- Progress tracking through dialogue steps
- State persistence for conversation flow

**designThinking**: Design thinking methodology
- Empathize, Define, Ideate, Prototype, Test
- User-centered design approach
- Session-based workflow tracking

**rootCauseAnalysis**: Root cause analysis using 5 Whys
- Systematic problem analysis
- Cause identification and validation
- Step-by-step root cause discovery

**swotAnalysis**: SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
- Strategic analysis framework
- Balanced assessment approach
- Categorized analysis tracking

**preMortem**: Pre-mortem analysis
- Future failure prediction
- Risk mitigation planning
- Hypothesis-based risk assessment

**dialecticalReasoning**: Dialectical thinking approach
- Thesis-antithesis-synthesis
- Critical thinking and debate
- Multi-perspective analysis

**firstPrinciples**: First principles reasoning
- Fundamental reasoning from basics
- Problem decomposition
- Core concept validation

**decisionMatrix**: Decision matrix analysis
- Multi-criteria decision making
- Weighted evaluation
- Structured decision tracking

**lateralThinking**: Lateral thinking techniques
- Creative problem solving
- Alternative approaches
- Brainstorming session management

**agileSprint**: Agile sprint planning and reflection
- Sprint goal setting
- Retrospective analysis
- Iterative improvement tracking

**feynmanTechnique**: Feynman learning technique
- Concept understanding validation
- Simplification and teaching
- Knowledge assessment tracking

**sixThinkingHats**: Six Thinking Hats method
- Multiple perspective analysis
- Balanced decision making
- Parallel thinking approach

## Usage Examples

### Scientific Method Reasoning

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ThinkingService } from '@tokenring-ai/thinking';

const agent = new Agent();
const thinkingService = new ThinkingService();
agent.registerService(thinkingService);

// Start scientific method reasoning
const result = await agent.chat.executeTool('scientific-method-reasoning', {
  problem: 'How does gravity affect planetary orbits?',
  step: 'question_observation',
  content: 'Observe planetary motion patterns and gravitational effects',
  nextThoughtNeeded: true
});

// Continue with background research
await agent.chat.executeTool('scientific-method-reasoning', {
  step: 'background_research', 
  content: 'Review existing research on gravitational physics and orbital mechanics',
  nextThoughtNeeded: true
});

// Formulate hypothesis
await agent.chat.executeTool('scientific-method-reasoning', {
  step: 'hypothesis_formulation',
  content: 'Planets maintain orbits due to balanced gravitational and centrifugal forces',
  hypothesis_update: {
    new_hypothesis_text: 'Gravitational force provides centripetal acceleration for orbital motion'
  },
  nextThoughtNeeded: true
});

// Make predictions
await agent.chat.executeTool('scientific-method-reasoning', {
  step: 'prediction',
  content: 'Planets closer to the sun will orbit faster than those farther away',
  targets_hypothesis_id: ['h1'],
  nextThoughtNeeded: true
});

// Test and analyze
await agent.chat.executeTool('scientific-method-reasoning', {
  step: 'testing_experimentation',
  content: 'Analyze Kepler\'s laws and observational data',
  targets_hypothesis_id: ['h1'],
  nextThoughtNeeded: true
});

// Draw conclusion
await agent.chat.executeTool('scientific-method-reasoning', {
  step: 'analysis',
  content: 'Kepler\'s laws confirm gravitational forces govern orbital motion',
  hypothesis_update: {
    hypothesis_id: 'h1',
    action: 'support'
  },
  nextThoughtNeeded: false,
  final_answer: 'Gravity provides the centripetal force that maintains planetary orbits, with orbital speed decreasing with distance from the sun'
});
```

### Design Thinking

```typescript
import { Agent } from '@tokenring-ai/agent';

const agent = new Agent();

// Empathize - understand user needs
await agent.chat.executeTool('designThinking', {
  step: 'empathize',
  content: 'Research user pain points with current product interface',
  nextThoughtNeeded: true
});

// Define - clarify problem statement
await agent.chat.executeTool('designThinking', {
  step: 'define',
  content: 'Users struggle with complex navigation in mobile app',
  nextThoughtNeeded: true
});

// Ideate - generate solutions
await agent.chat.executeTool('designThinking', {
  step: 'ideate', 
  content: 'Simplify navigation with clear categories and search functionality',
  nextThoughtNeeded: true
});

// Prototype - create solution concept
await agent.chat.executeTool('designThinking', {
  step: 'prototype',
  content: 'Design wireframes with improved navigation structure',
  nextThoughtNeeded: true
});

// Test - validate with users
await agent.chat.executeTool('designThinking', {
  step: 'test',
  content: 'User testing shows 40% improvement in task completion time',
  nextThoughtNeeded: false
});
```

### Managing Reasoning Sessions

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ThinkingService } from '@tokenring-ai/thinking';

const agent = new Agent();
const thinkingService = agent.requireServiceByType(ThinkingService);

// Clear a specific reasoning session
thinkingService.clearSession('scientific-method-reasoning', agent);

// Clear all reasoning sessions
thinkingService.clearAll(agent);

// Check current sessions
const thinkingState = agent.getState(ThinkingState);
console.log(thinkingState.sessions.size); // Number of active sessions
console.log(thinkingState.show()); // Show session status
```

### Accessing Session Data

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ThinkingState } from '@tokenring-ai/thinking/state';

const agent = new Agent();
const thinkingState = agent.getState(ThinkingState);

// Access specific session
const session = thinkingState.sessions.get('scientific-method-reasoning');
if (session) {
  console.log('Current step:', session.stepNumber);
  console.log('Problem:', session.problem);
  console.log('Completed steps:', session.completedSteps);
  console.log('Session data:', session.data);
}
```

## Configuration

The thinking package requires no specific configuration. It automatically integrates with the Token Ring application through its plugin system.

## Integration with Token Ring Ecosystem

### Plugin Integration

The thinking package automatically integrates with Token Ring applications through its plugin:

```typescript
export default {
  name: "@tokenring-ai/thinking",
  version: "0.2.0",
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService => {
      chatService.addTools(packageJSON.name, tools);
    });
    app.addServices(new ThinkingService());
  }
}
```

### Service Dependencies

The thinking package requires these services to be available:

1. **ChatService**: For tool registration and execution
2. **Agent**: For state management and service access

### Agent Integration

```typescript
// Agents can access thinking service directly
const thinkingService = agent.requireServiceByType(ThinkingService);
const result = thinkingService.processStep('scientific-method-reasoning', args, agent, processor);
```

## API Reference

### ThinkingService Methods

#### attach(agent: Agent): Promise<void>
Attaches the thinking service to an agent and initializes state.

**Parameters:**
- `agent` (Agent): The agent to attach the service to

#### processStep(toolName: string, args: any, agent: Agent, processor: (session: ReasoningSession, args: any) => any): any
Processes a reasoning step for a specific tool.

**Parameters:**
- `toolName` (string): Name of the reasoning tool
- `args` (any): Tool-specific arguments
- `agent` (Agent): The current agent instance
- `processor` (function): Function to process the reasoning step

**Returns:**
- Processed result from the reasoning step

#### clearSession(toolName: string, agent: Agent): void
Clears a specific reasoning session.

**Parameters:**
- `toolName` (string): Name of the tool/session to clear
- `agent` (Agent): The agent instance

#### clearAll(agent: Agent): void
Clears all reasoning sessions.

**Parameters:**
- `agent` (Agent): The agent instance

## Tool Input Schemas

Each thinking tool has its own input schema that enforces the specific methodology:

### Scientific Method Tool Input Schema

```typescript
const inputSchema = z.object({
  problem: z.string().optional().describe("The exact question or problem to investigate—required on first call only"),
  step: z.enum([
    "question_observation",
    "background_research", 
    "hypothesis_formulation",
    "prediction",
    "testing_experimentation",
    "analysis",
    "conclusion"
  ]).describe("The specific scientific method step this contribution advances"),
  content: z.string().describe("Clear, focused contribution to the chosen step"),
  targets_hypothesis_id: z.array(z.string()).optional().describe("Hypothesis ID(s) this step references (e.g., ['h1'])—required for prediction, testing, analysis"),
  hypothesis_update: z.object({
    hypothesis_id: z.string().optional().describe("Existing ID to modify/refute (omit for new hypothesis)"),
    new_hypothesis_text: z.string().optional().describe("Text of a new or revised hypothesis (must be testable)"),
    action: z.enum(["propose", "refine", "refute", "support"]).optional().describe("Action taken on the hypothesis in this step")
  }).optional().describe("Create or update a hypothesis in hypothesis_formulation or analysis steps"),
  nextThoughtNeeded: z.boolean().describe("False only when conclusion step provides a final, evidence-based answer"),
  final_answer: z.string().optional().describe("The concluded answer—required when nextThoughtNeeded is false; must be justified by prior steps")
});
```

### Tool Result Structure

Each tool returns a structured result with session information:

```typescript
interface ToolResult {
  thoughtNumber: number;         // Current step number
  currentStep: string;           // The step being processed
  nextThoughtNeeded: boolean;    // Whether more input is needed
  problem: string;              // The problem being investigated
  hypotheses: any[];            // Current hypotheses (for scientific method)
  completedSteps: string[];      // Steps completed so far
  conclusionReached: boolean;    // Whether conclusion has been reached
  thoughtHistoryLength: number;  // Total number of thoughts recorded
}
```

## Dependencies

- `@tokenring-ai/app@0.2.0`: Application framework
- `@tokenring-ai/agent@0.2.0`: Core agent system
- `@tokenring-ai/chat@0.2.0`: Chat service integration
- `zod@^4.0.17`: Schema validation

## Development

### Package Structure

- `index.ts` - Package exports
- `plugin.ts` - Plugin integration logic
- `ThinkingService.ts` - Core service implementation
- `tools.ts` - Tool exports
- `tools/` - Individual tool implementations
- `state/` - State management and session tracking
- `package.json` - Package configuration
- `README.md` - Comprehensive package documentation

### Dependencies

```json
{
  "dependencies": {
    "@tokenring-ai/app": "0.2.0",
    "@tokenring-ai/chat": "0.2.0", 
    "@tokenring-ai/agent": "0.2.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```

### Testing

The package includes Vitest configuration for testing:

```typescript
// vitest.config.ts
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Error Handling

The thinking package provides comprehensive error handling:

1. **Input Validation**: Zod schemas validate all tool inputs
2. **State Management**: Proper session state tracking and validation
3. **Session Clearing**: Graceful handling of session cleanup
4. **Tool Execution**: Error handling during reasoning step processing
5. **State Reset**: Proper handling when agent state is reset
6. **First Call Validation**: Ensures problem is defined on first call

## Performance Considerations

- **State Management**: Efficient state tracking with Map data structure
- **Session Isolation**: Independent session management prevents cross-contamination
- **Tool Processing**: Asynchronous processing for responsive user experience
- **Memory Management**: Proper session cleanup to prevent memory leaks
- **Data Persistence**: Efficient serialization and deserialization of session data

## License

MIT (see LICENSE file)