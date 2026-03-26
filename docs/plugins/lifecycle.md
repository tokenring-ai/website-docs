# @tokenring-ai/lifecycle

The `@tokenring-ai/lifecycle` package provides agent lifecycle management capabilities for the Token Ring ecosystem. It enables agents to manage and execute hooks at various lifecycle events, allowing for customizable behavior during agent operations such as input processing, response handling, and state transitions.

## Overview

The lifecycle package implements a hook-based system that allows developers to register and execute custom callbacks at specific points in the agent's lifecycle. This provides a flexible mechanism for extending agent behavior without modifying core agent code.

### Key Features

- **Hook Registration**: Register custom hooks for various agent lifecycle events
- **Dynamic Hook Management**: Enable, disable, and manage hooks at runtime
- **State Persistence**: Hook configurations are persisted and restored across agent sessions
- **Interactive Management**: CLI commands for managing hooks via tree selection
- **RPC API**: Remote procedure call endpoints for programmatic hook management
- **Type-Safe**: Full TypeScript support with Zod schema validation

## Core Components

### AgentLifecycleService

The primary service that manages hook registration, execution, and state.

**Location**: `pkg/lifecycle/AgentLifecycleService.ts`

**Key Methods**:

```typescript
class AgentLifecycleService implements TokenRingService {
  readonly name = "AgentLifecycleService";
  description = "A service which dispatches hooks when certain agent lifecycle event happen.";

  // Hook Management
  registerHook(hookName: string, hook: HookSubscription): void;
  getAllHookEntries(): Array<[string, HookSubscription]>;
  getAllHookNames(): string[];

  // Agent State Management
  attach(agent: Agent): void;
  getEnabledHooks(agent: Agent): string[];
  setEnabledHooks(hookNames: string[], agent: void): void;
  enableHooks(hookNames: string[], agent: Agent): void;
  disableHooks(hookNames: string[], agent: Agent): void;
  executeHooks(data: Hook, agent: Agent): Promise<void>;
}
```

### Hook Types

The package defines several hook types for different lifecycle events:

```typescript
// pkg/lifecycle/util/hooks.ts

class BeforeAgentInput {
  readonly type = "hook";
  constructor(readonly request: ParsedInputReceived) {}
}

class AfterAgentInputSuccess {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentSuccessResponse
  ) {}
}

class AfterAgentInputError {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentErrorResponse
  ) {}
}

class AfterAgentInputCancelled {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentCancelledResponse
  ) {}
}

class AfterAgentInputHandled {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentResponse
  ) {}
}
```

### HookCallback

Used to register callbacks for specific hook types:

```typescript
class HookCallback<T extends Hook> {
  constructor(
    readonly hookConstructor: abstract new (...args: any[]) => T,
    readonly callback: (data: T, agent: Agent) => Promise<void> | void
  ) {}
}
```

### HookSubscription

Defines a registered hook with its metadata:

```typescript
type HookSubscription = {
  name: string;
  displayName: string;
  description: string;
  callbacks: HookCallback<any>[];
};
```

## Services

### AgentLifecycleService

**Type**: `TokenRingService`

**Purpose**: Central service for managing agent lifecycle hooks

**Registration**: Automatically registered when the plugin is installed

**Configuration**:
```typescript
import { LifecycleServiceConfigSchema } from "@tokenring-ai/lifecycle/schema";

const config = {
  lifecycle: {
    agentDefaults: {
      enabledHooks: [] // Default enabled hooks for new agents
    }
  }
};
```

## RPC Endpoints

The package provides the following RPC endpoints at `/rpc/lifecycle`:

| Endpoint | Type | Description | Request Parameters | Response Parameters |
|----------|------|-------------|-------------------|---------------------|
| `getAvailableHooks` | query | Get all registered hooks | `{}` | `{ hooks: Record<string, { displayName: string, description?: string }> }` |
| `getEnabledHooks` | query | Get enabled hooks for an agent | `{ agentId: string }` | `{ hooks: string[] }` |
| `setEnabledHooks` | mutation | Set enabled hooks (replaces current) | `{ agentId: string, hooks: string[] }` | `{ hooks: string[] }` |
| `enableHooks` | mutation | Enable additional hooks | `{ agentId: string, hooks: string[] }` | `{ hooks: string[] }` |
| `disableHooks` | mutation | Disable specified hooks | `{ agentId: string, hooks: string[] }` | `{ hooks: string[] }` |

### RPC Example

```typescript
import { createRPCClient } from "@tokenring-ai/rpc";
import LifecycleRpcSchema from "@tokenring-ai/lifecycle/rpc/schema";

const client = createRPCClient(LifecycleRpcSchema, rpcTransport);

// Get available hooks
const available = await client.getAvailableHooks({});
console.log(available.hooks);

// Get enabled hooks for an agent
const enabled = await client.getEnabledHooks({ agentId: "my-agent" });
console.log(enabled.hooks);

// Enable specific hooks
await client.enableHooks({ 
  agentId: "my-agent", 
  hooks: ["preProcess", "postProcess"] 
});
```

## Chat Commands

The package provides the following slash-prefixed commands:

### `/hooks list`

List all registered hooks.

**Usage**:
```
/hooks list
```

**Example**:
```
/hooks list
# Output:
# Registered hooks:
# - preProcess
# - postProcess
# - onMessage
```

### `/hooks get`

Show currently enabled hooks.

**Usage**:
```
/hooks get
```

**Example**:
```
/hooks get
# Output:
# Currently enabled hooks: preProcess, postProcess
```

### `/hooks enable <hookNames>`

Add one or more hooks to the current enabled set.

**Usage**:
```
/hooks enable <hookName1> [hookName2] ...
```

**Example**:
```
/hooks enable preProcess
# Output: Enabled Hooks: preProcess

/hooks enable preProcess onMessage
# Output: Enabled Hooks: preProcess, onMessage
```

### `/hooks disable <hookNames>`

Remove one or more hooks from the current enabled set.

**Usage**:
```
/hooks disable <hookName1> [hookName2] ...
```

**Example**:
```
/hooks disable preProcess
# Output: Disabled Hooks: preProcess
```

### `/hooks set <hookNames>`

Set enabled hooks, replacing the current selection entirely.

**Usage**:
```
/hooks set <hookName1> [hookName2] ...
```

**Example**:
```
/hooks set preProcess onMessage
# Output: Selected hooks: preProcess, onMessage
```

### `/hooks select`

Open an interactive tree-based selector to choose which hooks to enable.

**Usage**:
```
/hooks select
```

**Example**:
```
/hooks select
# Opens interactive UI for hook selection
# Note: Only available in interactive (non-headless) mode
```

### `/hooks reset`

Reset the enabled hooks to the initial configuration.

**Usage**:
```
/hooks reset
```

**Example**:
```
/hooks reset
# Output: Reset hooks to initial selections: (none)
```

## Configuration

### Plugin Configuration

```typescript
import { LifecycleServiceConfigSchema } from "@tokenring-ai/lifecycle/schema";

const config = {
  lifecycle: {
    agentDefaults: {
      enabledHooks: [] // Default enabled hooks for new agents
    }
  }
};
```

### Agent Configuration Schema

```typescript
import { LifecycleAgentConfigSchema } from "@tokenring-ai/lifecycle/schema";

// Per-agent configuration
const agentConfig = {
  lifecycle: {
    enabledHooks: ["preProcess", "postProcess"]
  }
};
```

### Configuration Types

```typescript
// Service-level configuration
type ParsedLifecycleServiceConfig = {
  agentDefaults: {
    enabledHooks: string[];
  };
};

// Agent-level configuration
type ParsedLifecycleAgentConfig = {
  enabledHooks?: string[];
};
```

## Integration

### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import lifecyclePlugin from "@tokenring-ai/lifecycle/plugin";

const app = new TokenRingApp();

// Install the lifecycle plugin
await app.install(lifecyclePlugin, {
  lifecycle: {
    agentDefaults: {
      enabledHooks: []
    }
  }
});

// The AgentLifecycleService is automatically registered
const lifecycleService = app.requireService(AgentLifecycleService);
```

### Registering Hooks

```typescript
import AgentLifecycleService from "@tokenring-ai/lifecycle/AgentLifecycleService";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import { AfterAgentInputSuccess } from "@tokenring-ai/lifecycle/util/hooks";

// Register a hook
lifecycleService.registerHook("postProcess", {
  name: "postProcess",
  displayName: "Post-Process",
  description: "Execute after agent input is successfully processed",
  callbacks: [
    new HookCallback(AfterAgentInputSuccess, async (data, agent) => {
      console.log("Agent successfully processed input:", data.request);
      // Perform post-processing tasks
    })
  ]
});
```

### State Management Integration

```typescript
import { LifecycleState } from "@tokenring-ai/lifecycle/state/lifecycleState";

// Access lifecycle state from an agent
const lifecycleState = agent.getState(LifecycleState);
console.log("Enabled hooks:", lifecycleState.enabledHooks);

// Modify lifecycle state
agent.mutateState(LifecycleState, (state) => {
  state.enabledHooks.push("newHook");
});
```

## Usage Examples

### Basic Hook Registration

```typescript
import AgentLifecycleService from "@tokenring-ai/lifecycle/AgentLifecycleService";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import { AfterAgentInputSuccess } from "@tokenring-ai/lifecycle/util/hooks";

// In your plugin's install function
export default {
  name: "my-plugin",
  install(app, config) {
    app.waitForService(AgentLifecycleService, (lifecycleService) => {
      lifecycleService.registerHook("myCustomHook", {
        name: "myCustomHook",
        displayName: "My Custom Hook",
        description: "A custom hook for demonstration",
        callbacks: [
          new HookCallback(AfterAgentInputSuccess, async (data, agent) => {
            console.log("Custom hook executed!");
          })
        ]
      });
    });
  }
};
```

### Dynamic Hook Management

```typescript
// Enable hooks dynamically
agent.requireServiceByType(AgentLifecycleService).enableHooks(
  ["preProcess", "postProcess"],
  agent
);

// Disable hooks dynamically
agent.requireServiceByType(AgentLifecycleService).disableHooks(
  ["preProcess"],
  agent
);

// Get current enabled hooks
const enabledHooks = agent.requireServiceByType(AgentLifecycleService)
  .getEnabledHooks(agent);
```

### State Persistence

```typescript
import { LifecycleState } from "@tokenring-ai/lifecycle/state/lifecycleState";

// State is automatically persisted and restored
// Serialize state
const serialized = lifecycleState.serialize();

// Deserialize state
lifecycleState.deserialize(serialized);

// Reset to initial configuration
lifecycleState.reset();
```

## Best Practices

### Hook Registration

1. **Register hooks early**: Register hooks during plugin installation before agents are created
2. **Use descriptive names**: Choose clear, descriptive names for your hooks
3. **Document hook behavior**: Provide clear descriptions for each hook
4. **Handle errors gracefully**: Wrap hook callbacks in try-catch blocks

### Hook Execution

```typescript
lifecycleService.registerHook("safeHook", {
  name: "safeHook",
  displayName: "Safe Hook",
  description: "A hook with error handling",
  callbacks: [
    new HookCallback(AfterAgentInputSuccess, async (data, agent) => {
      try {
        // Your hook logic here
        await processAgentResponse(data, agent);
      } catch (error) {
        console.error("Hook execution failed:", error);
        // Don't let hook failures break the agent flow
      }
    })
  ]
});
```

### State Management

1. **Use agent state**: Store hook configurations in agent state for persistence
2. **Respect initial config**: Always respect the initial configuration when resetting
3. **Validate hook names**: Ensure hook names match registered hooks before enabling

## Testing and Development

### Package Structure

```
pkg/lifecycle/
├── plugin.ts           # Plugin definition and installation
├── index.ts            # Package exports
├── schema.ts           # Configuration schemas
├── types.ts            # Type definitions
├── AgentLifecycleService.ts  # Main service implementation
├── commands.ts         # Command registration
├── rpc/
│   ├── schema.ts       # RPC schema definition
│   └── lifecycle.ts    # RPC endpoint implementation
├── state/
│   └── lifecycleState.ts   # Agent state slice
├── util/
│   └── hooks.ts        # Hook utilities and types
├── commands/
│   └── hooks/
│       ├── list.ts     # List command
│       ├── get.ts      # Get command
│       ├── enable.ts   # Enable command
│       ├── disable.ts  # Disable command
│       ├── set.ts      # Set command
│       ├── select.ts   # Select command
│       └── reset.ts    # Reset command
├── package.json        # Package configuration
└── vitest.config.ts    # Test configuration
```

### Running Tests

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Development Setup

```bash
# Install dependencies
npm install

# Type check
npm run build
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/agent` | 0.2.0 | Agent framework and types |
| `@tokenring-ai/app` | 0.2.0 | Application framework |
| `@tokenring-ai/rpc` | 0.2.0 | RPC system |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions |
| `zod` | ^4.3.6 | Schema validation |

## Related Components

- **@tokenring-ai/agent**: Core agent framework that lifecycle hooks integrate with
- **@tokenring-ai/app**: Application framework for plugin management
- **@tokenring-ai/rpc**: RPC system for remote hook management

## License

MIT License - see LICENSE file for details.
