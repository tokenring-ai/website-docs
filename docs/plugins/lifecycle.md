# @tokenring-ai/lifecycle

The `@tokenring-ai/lifecycle` package provides agent lifecycle management capabilities for the Token Ring ecosystem. It enables a hook-based system for dispatching events during agent lifecycle operations, allowing custom handlers to be registered and executed at key points in the agent's request/response cycle.

## User Guide

### Overview

The lifecycle package implements an event dispatching service that enables agents to notify registered handlers about lifecycle events such as input processing, success responses, error responses, and cancellations. This provides a flexible mechanism for extending agent behavior without modifying core agent code.

### Key Features

- **Hook-based event system** for agent lifecycle events
- **Per-Agent Configuration**: Each agent maintains its own set of enabled hooks
- **Interactive Commands**: CLI commands for listing, enabling, disabling, and selecting hooks
- **RPC API**: Remote procedure call endpoints for programmatic hook management
- **State Persistence**: Hook configuration persists across agent sessions
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Event-Driven Architecture**: Callback-based execution with async support

### Chat Commands

The package provides the following slash-prefixed commands for hook management:

| Command                    | Description                                    |
|----------------------------|------------------------------------------------|
| `/hooks list`              | List all registered hooks                      |
| `/hooks get`               | Show currently enabled hooks                   |
| `/hooks set <hooks...>`    | Set enabled hooks (replaces current selection) |
| `/hooks enable <hooks...>` | Add hooks to the enabled set                   |
| `/hooks disable <hooks...>`| Remove hooks from the enabled set              |
| `/hooks select`            | Interactive tree-based hook selection          |
| `/hooks reset`             | Reset enabled hooks to initial configuration   |

#### `/hooks list`

List all registered hooks.

```bash
/hooks list
```

**Example Output**:

```text
Registered hooks:
- preProcess
- onMessage
- onError
```

#### `/hooks get`

Show currently enabled hooks for the agent.

```bash
/hooks get
```

**Example Output**:

```text
Currently enabled hooks: preProcess, onMessage
```

#### `/hooks set <hooks...>`

Set enabled hooks, replacing the current selection entirely.

```bash
/hooks set preProcess onMessage
```

#### `/hooks enable <hooks...>`

Add one or more hooks to the enabled set.

```bash
/hooks enable onError
```

#### `/hooks disable <hooks...>`

Remove one or more hooks from the enabled set.

```bash
/hooks disable preProcess
```

#### `/hooks select`

Open an interactive tree-based selector to choose which hooks to enable.

```bash
/hooks select
```

> **Note**: Only available in interactive (non-headless) mode.

#### `/hooks reset`

Reset the enabled hooks to the initial configuration.

```bash
/hooks reset
```

### Tools

The lifecycle package does not define any MCP tools. It provides chat commands and RPC endpoints for hook management.

### Configuration

#### Plugin Configuration

Configure the lifecycle plugin with default settings for new agents:

```yaml
lifecycle:
  agentDefaults:
    enabledHooks: []
```

#### Service Configuration Schema

```typescript
import { LifecycleServiceConfigSchema } from "@tokenring-ai/lifecycle/schema";

const config = {
  lifecycle: {
    agentDefaults: {
      enabledHooks: string[]  // Default enabled hooks for new agents
    }
  }
};
```

#### Agent Configuration

Each agent maintains its own lifecycle configuration:

```typescript
import { LifecycleAgentConfigSchema } from "@tokenring-ai/lifecycle/schema";

// Per-agent configuration
const agentConfig = {
  enabledHooks: string[]  // Agent-specific enabled hooks
};
```

#### Environment Variables

The lifecycle package does not require any environment variables.

### Integration

#### Plugin Installation

Install the lifecycle plugin in your TokenRing application:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import lifecyclePlugin from "@tokenring-ai/lifecycle/plugin";

const app = new TokenRingApp();

// Install the plugin with configuration
await app.install(lifecyclePlugin, {
  lifecycle: {
    agentDefaults: {
      enabledHooks: []  // No hooks enabled by default
    }
  }
});
```

#### Registering Hooks

Register custom hooks with the lifecycle service:

```typescript
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import { HookCallback, AfterAgentInputSuccess } from "@tokenring-ai/lifecycle/util/hooks";

// Get the lifecycle service
const lifecycleService = app.getService(AgentLifecycleService);

// Register a new hook subscription
lifecycleService.registerHook("onMessage", {
  name: "onMessage",
  displayName: "On Message Success",
  description: "Executed after successful agent response",
  callbacks: [
    new HookCallback(
      AfterAgentInputSuccess,
      async (data, agent) => {
        console.log(`Response: ${data.response}`);
        // Custom post-processing logic
      }
    )
  ]
});
```

#### Managing Hooks

Enable and disable hooks for individual agents:

```typescript
// Enable hooks for an agent
lifecycleService.enableHooks(["preProcess", "onMessage"], agent);

// Disable specific hooks
lifecycleService.disableHooks(["preProcess"], agent);

// Set exact hook list (replaces current)
lifecycleService.setEnabledHooks(["onMessage"], agent);

// Get currently enabled hooks
const enabled = lifecycleService.getEnabledHooks(agent);
```

### Best Practices

1. **Register Hooks Early**: Register all hooks during plugin initialization before agent creation
2. **Use Descriptive Names**: Give hooks clear, descriptive names and descriptions
3. **Handle Async Properly**: Hook callbacks can be async; await them appropriately
4. **Handle Errors Gracefully**: Wrap hook callbacks in try-catch blocks to prevent breaking agent flow
5. **Enable Selectively**: Only enable hooks that are needed for specific agent tasks
6. **Monitor Performance**: Be aware that hooks add overhead to agent processing

## Developer Reference

### Core Components

#### AgentLifecycleService (Service Class)

The main service class that manages hook registration and execution.

**Location**: `pkg/lifecycle/AgentLifecycleService.ts`

**Implements**: `TokenRingService`

```typescript
export default class AgentLifecycleService implements TokenRingService {
  readonly name = "AgentLifecycleService";
  description = "A service which dispatches hooks when certain agent lifecycle event happen.";

  // Hook registration
  registerHook: (name: string, hook: HookSubscription) => void
  getAllHookEntries: () => [string, HookSubscription][]
  getAllHookNames: () => string[]

  // Agent lifecycle
  attach(agent: Agent): void

  // Hook management
  addHooks: (hooks: Record<string, HookSubscription>) => void
  getEnabledHooks: (agent: Agent) => string[]
  setEnabledHooks: (hookNames: string[], agent: Agent) => void
  enableHooks: (hookNames: string[], agent: Agent) => void
  disableHooks: (hookNames: string[], agent: Agent) => void

  // Hook execution
  executeHooks: (data: Hook, agent: Agent) => Promise<void>
}
```

**Constructor Parameters**:

```typescript
constructor(readonly options: ParsedLifecycleServiceConfig)
```

### Services

#### AgentLifecycleService (TokenRingService)

**Type**: `TokenRingService`

**Purpose**: Central service for managing agent lifecycle hooks

**Registration**: Automatically registered when the plugin is installed via `app.install()`

**Configuration**:

```typescript
import { LifecycleServiceConfigSchema } from "@tokenring-ai/lifecycle/schema";

type ParsedLifecycleServiceConfig = {
  agentDefaults: {
    enabledHooks: string[]
  }
};
```

### Provider Documentation

#### Hook Types

The package defines several predefined hook classes for different lifecycle stages:

**Base Hook Interface**:

```typescript
export type Hook = {
  type: "hook";
};
```

**Predefined Hook Classes**:

##### BeforeAgentInput

Triggered before processing an agent input.

```typescript
export class BeforeAgentInput {
  readonly type = "hook";
  constructor(readonly request: ParsedInputReceived) {}
}
```

##### AfterAgentInputSuccess

Triggered after a successful agent response.

```typescript
export class AfterAgentInputSuccess {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentSuccessResponse
  ) {}
}
```

##### AfterAgentInputError

Triggered when an agent encounters an error.

```typescript
export class AfterAgentInputError {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentErrorResponse
  ) {}
}
```

##### AfterAgentInputCancelled

Triggered when an agent request is cancelled.

```typescript
export class AfterAgentInputCancelled {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentCancelledResponse
  ) {}
}
```

##### AfterAgentInputHandled

Triggered after any agent response (success, error, or cancelled).

```typescript
export class AfterAgentInputHandled {
  readonly type = "hook";
  constructor(
    readonly request: ParsedInputReceived,
    readonly response: ParsedAgentResponse
  ) {}
}
```

#### HookCallback

Callback registration for hook execution.

```typescript
export class HookCallback<T extends Hook> {
  constructor(
    readonly hookConstructor: abstract new (...args: any[]) => T,
    readonly callback: (data: T, agent: Agent) => MaybePromise<void>
  ) {}
}
```

**Parameters**:

- `hookConstructor`: The hook class constructor to match against executed hooks
- `callback`: Async or sync function to execute when the hook is triggered

#### HookSubscription

Defines a registered hook with its metadata.

```typescript
export type HookSubscription = {
  name: string;
  displayName: string;
  description: string;
  callbacks: HookCallback<any>[];
};
```

### RPC Endpoints

The package provides RPC endpoints for remote hook management at `/rpc/lifecycle`.

**RPC Schema**: `pkg/lifecycle/rpc/schema.ts`

| Endpoint         | Method    | Request Parameters                       | Response Parameters                                                                 |
|------------------|-----------|------------------------------------------|-------------------------------------------------------------------------------------|
| `getAvailableHooks` | query   | `{}`                                     | `{ hooks: Record<string, { displayName: string, description: string }> }`          |
| `getEnabledHooks`   | query   | `{ agentId: string }`                    | `{ status: "success", hooks: string[] }` or `{ status: "agentNotFound" }`          |
| `setEnabledHooks`   | mutation| `{ agentId: string, hooks: string[] }`   | `{ status: "success", hooks: string[] }` or `{ status: "agentNotFound" }`          |
| `enableHooks`       | mutation| `{ agentId: string, hooks: string[] }`   | `{ status: "success", hooks: string[] }` or `{ status: "agentNotFound" }`          |
| `disableHooks`      | mutation| `{ agentId: string, hooks: string[] }`   | `{ status: "success", hooks: string[] }` or `{ status: "agentNotFound" }`          |

#### RPC Usage Example

```typescript
import { createRPCClient } from "@tokenring-ai/rpc";
import LifecycleRpcSchema from "@tokenring-ai/lifecycle/rpc/schema";

const client = createRPCClient(LifecycleRpcSchema, rpcTransport);

// Get available hooks
const available = await client.getAvailableHooks({});
console.log("Available hooks:", available.hooks);

// Get enabled hooks for an agent
const enabled = await client.getEnabledHooks({ agentId: "agent-123" });
if (enabled.status === "success") {
  console.log("Enabled hooks:", enabled.hooks);
}

// Enable hooks
const result = await client.enableHooks({
  agentId: "agent-123",
  hooks: ["preProcess", "onMessage"]
});
if (result.status === "success") {
  console.log("Updated hooks:", result.hooks);
}
```

### Usage Examples

#### Basic Hook Registration

```typescript
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import { HookCallback, AfterAgentInputSuccess } from "@tokenring-ai/lifecycle/util/hooks";

// In your plugin's install function
export default {
  name: "my-plugin",
  install(app, config) {
    app.waitForService(AgentLifecycleService, (lifecycleService) => {
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
    });
  }
};
```

#### Dynamic Hook Management

```typescript
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";

// Enable hooks dynamically
const lifecycleService = agent.requireServiceByType(AgentLifecycleService);
lifecycleService.enableHooks(["preProcess", "onMessage"], agent);

// Disable hooks dynamically
lifecycleService.disableHooks(["preProcess"], agent);

// Get current enabled hooks
const enabledHooks = lifecycleService.getEnabledHooks(agent);
console.log("Enabled hooks:", enabledHooks);
```

#### Error Handling in Hooks

```typescript
import { HookCallback, AfterAgentInputSuccess } from "@tokenring-ai/lifecycle/util/hooks";

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

The package uses `LifecycleState` for per-agent state persistence.

**Location**: `pkg/lifecycle/state/lifecycleState.ts`

```typescript
export class LifecycleState extends AgentStateSlice {
  enabledHooks: string[] = [];

  constructor(readonly initialConfig: ParsedLifecycleServiceConfig["agentDefaults"])

  // State methods
  reset(): void
  serialize(): { enabledHooks: string[] }
  deserialize(data: { enabledHooks: string[] }): void
  show(): string
}
```

**Persistence**: Hook configuration is automatically persisted to SQLite and restored when agents are reloaded.

**Checkpointing**: State checkpoints include hook configuration for recovery scenarios.

#### State Usage Example

```typescript
import { LifecycleState } from "@tokenring-ai/lifecycle/state/lifecycleState";

// Access lifecycle state from an agent
const lifecycleState = agent.getState(LifecycleState);
console.log("Enabled hooks:", lifecycleState.enabledHooks);

// Modify lifecycle state
agent.mutateState(LifecycleState, (state) => {
  state.enabledHooks.push("newHook");
});

// Serialize state
const serialized = lifecycleState.serialize();

// Deserialize state
lifecycleState.deserialize(serialized);

// Reset to initial configuration
lifecycleState.reset();
```

### Testing

#### Running Tests

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

#### Development Setup

```bash
# Install dependencies
bun install

# Type check
bun run build
```

### Dependencies

| Package                    | Version | Purpose                      |
|----------------------------|---------|------------------------------|
| `@tokenring-ai/agent`      | 0.2.0   | Core agent system            |
| `@tokenring-ai/app`        | 0.2.0   | Base application framework   |
| `@tokenring-ai/rpc`        | 0.2.0   | RPC service                  |
| `@tokenring-ai/utility`    | 0.2.0   | Shared utilities             |
| `zod`                      | ^4.3.6  | Schema validation            |

### Related Components

- **@tokenring-ai/agent**: Core agent system that uses lifecycle hooks
- **@tokenring-ai/app**: Base application framework
- **@tokenring-ai/rpc**: RPC service for remote endpoints

## License

MIT License - see LICENSE file for details.
