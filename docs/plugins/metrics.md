# Metrics & Monitoring

## User Guide

### Overview

The `@tokenring-ai/metrics` package (version 0.2.0) provides comprehensive
cost tracking and performance metrics for Token Ring AI agents. It integrates
with the agent system to collect, persist, and display metrics about agent
operations, particularly focusing on cost tracking across different categories.

### Key Features

- **Cost Tracking**: Sum and track costs by category
  (AI Chat, Image Generation, Web Search, and custom categories)
- **State Persistence**: Costs are persisted across sessions using the
  agent state management system
- **Agent Integration**: Seamlessly integrates with Token Ring agents via
  the MetricsService
- **Command Interface**: Provides `/costs` command to display current
  cost metrics
- **Type-Safe**: Fully typed with TypeScript and Zod schemas
- **Plugin Architecture**: Installable as a Token Ring plugin for
  easy integration

### Installation

```bash
bun add @tokenring-ai/metrics
```

### Chat Commands

| Command | Description |
|---------|-------------|
| `/costs` | Displays total costs incurred by the Agent |

#### `/costs`

Displays total costs incurred by the Agent, including AI Chat, Image
Generation, Web Search, and other tracked categories.

**Notes:**

- Costs are summed from the beginning of the current session until
  the current time
- Costs are displayed in USD with 4 decimal places
- Categories are dynamically tracked based on what costs are added

**Output Format:**

```text
Overall Costs: $0.0475
- AI Chat Cost: $0.0025
- Image Generation Cost: $0.0350
- Web Search Cost: $0.0100
```

### Tools

This package does not define any tools.

### Configuration

The package accepts a configuration object via the plugin or service
constructor. The current schema is empty, designed for future extensibility.

#### Configuration Example

```yaml
metrics: {}
```

#### ENV Variables

This package does not require any environment variables.

### Integration

#### With Agent System

The MetricsService integrates with the agent system by:

1. Implementing the `TokenRingService` interface
2. Attaching to agents via the `attach()` method
3. Initializing `CostTrackingState` on agent attach
4. Providing the `addCost()` method for external cost tracking

#### With Plugin System

The package exports a `TokenRingPlugin` that:

1. Registers `MetricsService` with the app
2. Waits for `AgentCommandService` to be available
3. Registers the `/costs` command with the agent command service

**Plugin Registration:**

```typescript
import metricsPlugin from '@tokenring-ai/metrics/plugin';

app.install(metricsPlugin, {
  metrics: {}
});
```

#### With Other Packages

The metrics package is designed to work with:

- **@tokenring-ai/ai-client**: Track AI chat and image generation costs
- **@tokenring-ai/websearch**: Track web search costs
- **Custom Services**: Any service that needs to track costs can
  call `addCost()`

### Best Practices

1. **Consistent Category Naming**: Use consistent category names
   across your application (e.g., "AI Chat", "Image Generation",
   "Web Search")

2. **Regular Cost Recording**: Record costs immediately after operations
   to ensure accurate tracking

3. **Session Management**: Reset costs at the beginning of new sessions
   using `costState.reset()`

4. **Display Formatting**: Use the `show()` method for consistent
   formatting of cost data

5. **Error Handling**: Wrap cost tracking calls in try-catch blocks
   to prevent cost tracking failures from affecting main functionality

---

## Developer Reference

### Core Components

#### MetricsService

The core service that collects and manages metrics data.

**Location:** `pkg/metrics/MetricsService.ts`

**Purpose:** Collects metrics about the agent performance,
particularly cost tracking.

**Interface:**

```typescript
class MetricsService implements TokenRingService {
  readonly name = "MetricsService";
  description = "Collects metrics about the agent's performance.";

  constructor(options: z.output<typeof MetricsServiceConfigSchema>);

  /**
   * Attach the service to an agent and initialize state
   */
  attach(agent: Agent): void;

  /**
   * Add a cost entry for a specific category
   * @param category - The cost category
   *   (e.g., 'AI Chat', 'Image Generation')
   * @param amount - The cost amount in USD
   * @param agent - The agent instance to update
   */
  addCost(category: string, amount: number, agent: Agent): void;
}
```

#### CostTrackingState

State slice for tracking costs across sessions.

**Location:** `pkg/metrics/state/costTrackingState.ts`

**Purpose:** Persists cost data in the agent state with serialization
and deserialization support.

**Properties:**

- `costs: Record<string, number>` - Map of cost categories to amounts
- `initialCosts: Costs` - Initial costs provided at construction (readonly)

**Interface:**

```typescript
class CostTrackingState extends AgentStateSlice<
  typeof serializationSchema
> {
  costs: Costs;

  constructor(readonly initialCosts: Costs = {});

  /**
   * Clear all costs by resetting the costs record to an empty object
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
   * Display costs as formatted string
   * @returns Formatted cost string with overall total
   *   and per-category breakdown
   *   Uses markdownList utility for consistent formatting
   */
  show(): string;
}
```

### Services

#### MetricsService Registration

The `MetricsService` is a `TokenRingService` implementation that provides
cost tracking capabilities.

**Registration:**

```typescript
import { MetricsService } from '@tokenring-ai/metrics';

app.addServices(new MetricsService({}));
```

### Provider Documentation

This package does not define any providers.

### RPC Endpoints

This package does not define any RPC endpoints.

### Schema Documentation

#### MetricsServiceConfigSchema

Zod schema for the MetricsService configuration. Currently empty,
designed for future extensibility.

```typescript
import { MetricsServiceConfigSchema }
  from '@tokenring-ai/metrics/schema';

// z.object({}).prefault({})
```

**Fields:**

This schema is currently empty and accepts any configuration object.

#### serializationSchema

Internal Zod schema used by `CostTrackingState` for state serialization
and deserialization.

```typescript
import { z } from 'zod';

const serializationSchema = z
  .object({
    costs: z.record(z.string(), z.number()).default({}),
  })
  .prefault({});
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `costs` | `Record<string, number>` | Map of cost categories to amounts |

**Notes:**

- The `costs` field is a record mapping category names to amounts
- The field has a default value of an empty object `{}`
- Category names are strings (e.g., "AI Chat", "Image Generation")
- Amounts are numbers representing USD costs

### Usage Examples

#### Adding Costs

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

#### Retrieving Costs

```typescript
// Get cost tracking state from agent
import { CostTrackingState }
  from '@tokenring-ai/metrics/state/costTrackingState';

const costState = agent.getState(CostTrackingState);

// Display formatted costs
console.log(costState.show());

// Output:
// Overall Costs: $0.0475
// - AI Chat Cost: $0.0025
// - Image Generation Cost: $0.0350
// - Web Search Cost: $0.0100
```

#### Resetting Costs

```typescript
// Reset all costs for a new session
const costState = agent.getState(CostTrackingState);
costState.reset();
```

#### State Persistence

```typescript
// Costs are automatically persisted through the agent's state system
// No additional configuration needed for persistence

// Checkpoint generation includes cost state automatically
// State is restored when agent is reinitialized
```

### State Management

The package uses `CostTrackingState` to manage cost data:

- **Initialization**: State is initialized when the agent attaches the
  MetricsService
- **Persistence**: Costs are automatically persisted through the agent's
  state system
- **Checkpoint Generation**: State is included in agent checkpoints for
  recovery
- **Session Tracking**: Costs accumulate within a session and can be
  reset with `reset()`

### Exports

The package exports the following modules:

| Export Path | Description |
|-------------|-------------|
| `@tokenring-ai/metrics` | Main entry point, exports `MetricsService` |
| `@tokenring-ai/metrics/plugin` | TokenRing plugin for app installation |
| `@tokenring-ai/metrics/schema` | Zod schemas for configuration validation |
| `@tokenring-ai/metrics/commands` | Agent command definitions |
| `@tokenring-ai/metrics/state/costTrackingState` | `CostTrackingState` class |

### Testing

#### Running Tests

```bash
cd pkg/metrics
bun run test
```

#### Running Tests in Watch Mode

```bash
bun run test:watch
```

#### Running Tests with Coverage

```bash
bun run test:coverage
```

#### Building

```bash
bun run build
```

### Package Structure

```text
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
├── vitest.config.ts            # Test configuration
└── README.md                   # Package documentation
```

### Dependencies

| Dependency | Purpose |
|------------|---------|
| `@tokenring-ai/agent` | Agent orchestration and state management |
| `@tokenring-ai/app` | Application framework and plugin system |
| `@tokenring-ai/utility` | Shared utilities (deepClone, markdownList) |
| `zod` | Schema validation |

### Related Components

- [@tokenring-ai/agent](./agent.md) - Core agent orchestration
- [@tokenring-ai/app](./app.md) - Application framework
- [@tokenring-ai/utility](./utility.md) - Shared utilities (deepClone,
  markdownList)

## License

MIT License - see the root LICENSE file for details.
