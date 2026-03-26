# Metrics

## Overview

The `@tokenring-ai/metrics` package provides comprehensive cost tracking and performance metrics for Token Ring AI agents. It integrates with the agent system to collect, persist, and display metrics about agent operations, particularly focusing on cost tracking across different categories like AI chat, image generation, and web search.

## Key Features

- **Cost Tracking**: Sum and track costs by category (AI Chat, Image Generation, Web Search, etc.)
- **State Persistence**: Costs are persisted across sessions using the agent's state management system
- **Agent Integration**: Seamlessly integrates with Token Ring agents via the MetricsService
- **Command Interface**: Provides `/costs` command to display current cost metrics
- **Type-Safe**: Fully typed with TypeScript and Zod schemas
- **Plugin Architecture**: Installable as a Token Ring plugin for easy integration

## Core Components

### MetricsService

The core service that collects and manages metrics data.

**Location**: `pkg/metrics/MetricsService.ts`

**Purpose**: Collects metrics about the agent's performance, particularly cost tracking.

**Interface**:

```typescript
class MetricsService implements TokenRingService {
  readonly name = "MetricsService";
  readonly description = "Collects metrics about the agent's performance.";

  constructor(options: MetricsServiceConfig);

  /**
   * Attach the service to an agent and initialize state
   */
  attach(agent: Agent): void;

  /**
   * Add a cost entry for a specific category
   * @param category - The cost category (e.g., 'AI Chat', 'Image Generation')
   * @param amount - The cost amount in USD
   * @param agent - The agent instance to update
   */
  addCost(category: string, amount: number, agent: Agent): void;
}
```

### CostTrackingState

State slice for tracking costs across sessions.

**Location**: `pkg/metrics/state/costTrackingState.ts`

**Purpose**: Persists cost data in the agent's state with serialization/deserialization support.

**Properties**:

- `costs: Record<string, number>` - Map of cost categories to amounts

**Methods**:

```typescript
class CostTrackingState extends AgentStateSlice {
  costs: Costs;

  constructor(initialCosts?: Costs);

  /**
   * Reset all costs to zero
   */
  reset(): void;

  /**
   * Serialize state for persistence
   */
  serialize(): { costs: Record<string, number> };

  /**
   * Deserialize state from persisted data
   */
  deserialize(data: { costs: Record<string, number> }): void;

  /**
   * Display costs as formatted lines
   * @returns Array of formatted cost strings
   */
  show(): string[];
}
```

## Services

### MetricsService

The `MetricsService` is a `TokenRingService` implementation that provides cost tracking capabilities.

**Registration**:

```typescript
import { MetricsService } from '@tokenring-ai/metrics';

app.addServices(new MetricsService({}));
```

**Configuration Schema**:

```typescript
import { MetricsServiceConfigSchema } from '@tokenring-ai/metrics/schema';

// Current schema (empty, can be extended)
const config = {
  metrics: {}
};
```

## Chat Commands

### `/costs`

Displays total costs incurred by the Agent.

**Description**: Shows cumulative costs from the beginning of the current session, including AI Chat, Image Generation, Web Search, and other tracked categories.

**Output Format**:

```
Overall Costs: $0.0475
- AI Chat Cost: $0.0025
- Image Generation Cost: $0.0350
- Web Search Cost: $0.0100
```

**Notes**:

- Costs are summed from the beginning of the current session until the current time
- Costs are displayed in USD with 4 decimal places
- Categories are dynamically tracked based on what costs are added

## Configuration

The package accepts a configuration object via the plugin or service constructor:

```typescript
import metricsPlugin from '@tokenring-ai/metrics/plugin';

app.install(metricsPlugin, {
  metrics: {} // Empty config, can be extended
});
```

The configuration is validated using Zod schema (`MetricsServiceConfigSchema`).

## Integration

### With Agent System

The MetricsService integrates with the agent system by:

1. Implementing `TokenRingService` interface
2. Attaching to agents via `attach()` method
3. Initializing `CostTrackingState` on agent attach
4. Providing `addCost()` method for external cost tracking

### With Plugin System

The package exports a `TokenRingPlugin` that:

1. Registers `MetricsService` with the app
2. Waits for `AgentCommandService` to be available
3. Registers the `/costs` command with agent command service

**Plugin Registration**:

```typescript
import metricsPlugin from '@tokenring-ai/metrics/plugin';

app.install(metricsPlugin, {
  metrics: {}
});
```

### With Other Packages

The metrics package is designed to work with:

- **@tokenring-ai/ai-client**: Track AI chat and image generation costs
- **@tokenring-ai/websearch**: Track web search costs
- **Custom Services**: Any service that needs to track costs can call `addCost()`

## Usage Examples

### Adding Costs

```typescript
// In your service or tool implementation
import { MetricsService } from '@tokenring-ai/metrics';

// Get the metrics service from the app
const metricsService = app.getService('MetricsService');

// Add costs for different categories
metricsService.addCost('AI Chat', 0.0025, agent);
metricsService.addCost('Image Generation', 0.035, agent);
metricsService.addCost('Web Search', 0.01, agent);
```

### Retrieving Costs

```typescript
// Get cost tracking state from agent
import { CostTrackingState } from '@tokenring-ai/metrics/state/costTrackingState';

const costState = agent.getState(CostTrackingState);

// Display formatted costs
const costLines = costState.show();
console.log(costLines.join('\n'));

// Output:
// Overall Costs: $0.0475
// - AI Chat Cost: $0.0025
// - Image Generation Cost: $0.0350
// - Web Search Cost: $0.0100
```

### Resetting Costs

```typescript
// Reset all costs for a new session
const costState = agent.getState(CostTrackingState);
costState.reset();
```

### State Persistence

```typescript
// Costs are automatically persisted through the agent's state system
// No additional configuration needed for persistence

// Checkpoint generation includes cost state automatically
// State is restored when agent is reinitialized
```

## Best Practices

1. **Consistent Category Naming**: Use consistent category names across your application (e.g., 'AI Chat', 'Image Generation', 'Web Search')

2. **Regular Cost Recording**: Record costs immediately after operations to ensure accurate tracking

3. **Session Management**: Reset costs at the beginning of new sessions using `costState.reset()`

4. **Display Formatting**: Use the `show()` method for consistent formatting of cost data

5. **Error Handling**: Wrap cost tracking calls in try-catch blocks to prevent cost tracking failures from affecting main functionality

## Testing and Development

### Running Tests

```bash
cd pkg/metrics
bun test
```

### Running Tests in Watch Mode

```bash
bun test --watch
```

### Running Tests with Coverage

```bash
bun test --coverage
```

### Building

```bash
bun run build
```

### Package Structure

```
pkg/metrics/
├── index.ts                    # Main exports
├── plugin.ts                   # TokenRingPlugin implementation
├── MetricsService.ts           # Core service implementation
├── schema.ts                   # Configuration schema
├── commands.ts                 # Command registration
├── commands/
│   └── cost.ts                 # /costs command implementation
├── state/
│   └── costTrackingState.ts    # Cost tracking state slice
├── package.json                # Package configuration
├── vitest.config.ts           # Test configuration
└── README.md                   # Package documentation
```

## Dependencies

- `@tokenring-ai/agent`: Agent orchestration and state management
- `@tokenring-ai/app`: Application framework and plugin system
- `@tokenring-ai/utility`: Shared utilities
- `zod`: Schema validation

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Testing**: Vitest
- **Validation**: Zod
- **State Management**: Agent state slices

## Related Components

- [@tokenring-ai/agent](./agent.md) - Core agent orchestration
- [@tokenring-ai/app](./app.md) - Application framework
- [@tokenring-ai/ai-client](./ai-client.md) - AI client for cost tracking integration
