# @tokenring-ai/app

## Overview

Base application framework for TokenRing applications, providing service management, plugin architecture, and state management through a unified interface. The package serves as the foundational infrastructure for building modular, extensible TokenRing applications with comprehensive lifecycle management.

### Key Features

- **Service-Oriented Architecture**: Organizes functionality into configurable services with registry-based management
- **Plugin-Based Extensions**: Seamless integration with plugin system for modular functionality
- **Type-Safe Configuration**: Zod-based validation for all configuration schemas with layered config loading
- **Lifecycle Management**: Controlled initialization, startup, and shutdown processes
- **State Isolation**: Separate state slices with serialization and deserialization support
- **Signal-Based Shutdown**: Graceful termination using AbortSignal
- **Promise Tracking**: Automatic error handling for async operations
- **Scheduled Tasks**: Built-in task scheduling for recurring operations
- **Comprehensive Logging**: Structured output for system messages and errors
- **Async State Subscriptions**: Support for async state observation with abort handling

## Core Components

### TokenRingApp

The main application class that orchestrates services, configuration, and lifecycle management.

### PluginManager

Manages plugin installation and lifecycle. Implements `TokenRingService`.

### StateManager

Type-safe state management with serialization support.

### buildTokenRingAppConfig

Configuration builder that loads from multiple locations with Zod validation.

## Usage Examples

### Basic Application Setup

```typescript
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp("/path/to/app", &#123;
  apiKey: process.env.API_KEY,
  model: "gpt-4"
&#125;);
```

### Service Management

```typescript
import TokenRingApp, &#123; TokenRingService &#125; from "@tokenring-ai/app";

class MyService implements TokenRingService &#123;
  name = "MyService";
  description = "A custom service";

  async run(signal: AbortSignal) &#123;
    console.log("MyService started");
    signal.addEventListener("abort", () =&gt; &#123;
      console.log("MyService stopped");
    &#125;);
  &#125;

  doSomething() &#123;
    return "Service result";
  &#125;
&#125;

// Add service to application
app.addServices(new MyService());

// Get service by type
const myService = app.requireService(MyService);
```

### Plugin with Configuration

```typescript
import &#123; z &#125; from "zod";
import type &#123; TokenRingPlugin &#125; from "@tokenring-ai/app/types.ts";

const MyPluginConfigSchema = z.object(&#123;
  apiKey: z.string(),
  model: z.string().default("gpt-3.5-turbo")
&#125;);

const myPlugin: TokenRingPlugin&lt;typeof MyPluginConfigSchema&gt; = &#123;
  name: "MyPlugin",
  version: "1.0.0",
  description: "My custom plugin with config",
  config: MyPluginConfigSchema,
  install(app, config) &#123;
    console.log(`Installing with API key: $&#123;config.apiKey&#125;`);
  &#125;,
  start(app, config) &#123;
    console.log(`Starting with model: $&#123;config.model&#125;`);
  &#125;
&#125;;

await pluginManager.installPlugins([myPlugin]);
```

### State Management

```typescript
import StateManager from "@tokenring-ai/app/StateManager";
import type &#123; SerializableStateSlice &#125; from "@tokenring-ai/app/StateManager.ts";

interface UserState extends SerializableStateSlice &#123;
  name: string;
  email: string;
&#125;

class UserStateSlice implements UserState &#123;
  name = "UserState";
  email: string;

  constructor(props: &#123; name: string; email: string &#125;) &#123;
    this.name = props.name;
    this.email = props.email;
  &#125;

  serialize() &#123;
    return &#123; name: this.name, email: this.email &#125;;
  &#125;

  deserialize(data: object) &#123;
    this.name = (data as UserState).name;
    this.email = (data as UserState).email;
  &#125;
&#125;

// Initialize state
const stateManager = new StateManager&lt;UserState&gt;();
stateManager.initializeState(
  UserStateSlice,
  new UserStateSlice(&#123; name: "John", email: "john@example.com" &#125;)
);

// Update state
const result = stateManager.mutateState(UserStateSlice, (state) =&gt; &#123;
  state.name = "Jane";
  return state.name;
&#125;);

console.log(result); // "Jane"

// Subscribe to changes
const unsubscribe = stateManager.subscribe(UserStateSlice, (state) =&gt; &#123;
  console.log("State changed:", state);
&#125;);

// Async state observation
const stateStream = stateManager.subscribeAsync(UserStateSlice, signal);
for await (const state of stateStream) &#123;
  console.log("New state:", state);
&#125;
```

### Scheduled Tasks

```typescript
// Schedule a task that runs every 5 seconds
app.scheduleEvery(5000, async () =&gt; &#123;
  const result = await fetchData();
  console.log("Scheduled task result:", result);
&#125;);

// The task can be stopped by shutting down the app
app.shutdown();
```

### Build Config from Files

```typescript
import buildTokenRingAppConfig from "@tokenring-ai/app/buildTokenRingAppConfig";
import &#123; z &#125; from "zod";

const AppConfigSchema = z.object(&#123;
  apiKey: z.string(),
  model: z.string().default("gpt-4")
&#125;);

const config = await buildTokenRingAppConfig(&#123;
  workingDirectory: "/path/to/app",
  dataDirectory: "/path/to/data",
  configFileName: "app.config",
  configSchema: AppConfigSchema,
  defaultConfig: &#123;
    apiKey: "",
    model: "gpt-3.5-turbo"
  &#125;
&#125;);
```

## Core Properties

### TokenRingApp Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | `TokenRingAppConfig` | The application configuration |
| `packageDirectory` | `string` | Path to the application directory |
| `logs` | `LogEntry[]` | Array of logged system messages |
| `services` | `TypedRegistry&lt;TokenRingService&gt;` | Registry of all registered services |

### PluginManager Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Always "PluginManager" |
| `description` | `string` | Always "Manages plugins" |

### StateManager Properties

| Property | Type | Description |
|----------|------|-------------|
| `state` | `Map&lt;string, SpecificStateSliceType&gt;` | Internal state storage |

## Core Methods

### TokenRingApp Methods

#### Service Management

```typescript
addServices(...services: TokenRingService[]): void
```
Register services with the application. Services are automatically initialized in registration order.

```typescript
requireService&lt;T&gt;(serviceType: abstract new (...args: any[]) =&gt; T): T
```
Get a service by type. Throws an error if the service is not found.

```typescript
getService&lt;T&gt;(serviceType: abstract new (...args: any[]) =&gt; T): T | undefined
```
Get a service by type. Returns undefined if the service is not found.

```typescript
getServices(): TokenRingService[]
```
Get all registered services.

```typescript
waitForService&lt;T&gt;(
  serviceType: abstract new (...args: any[]) =&gt; T,
  callback: (service: R) =&gt; void
): void
```
Wait for a service to become available. The callback is invoked when the service is registered.

#### Logging

```typescript
serviceOutput(...messages: any[]): void
```
Log system messages with formatted output.

```typescript
serviceError(...messages: any[]): void
```
Log error messages with formatted output.

#### Promise Management

```typescript
trackPromise(initiator: (signal: AbortSignal) =&gt; Promise&lt;void&gt;): void
```
Track an app-level promise and log any errors that occur.

#### Scheduling

```typescript
scheduleEvery(
  interval: number,
  callback: () =&gt; Promise&lt;void&gt;,
  signal?: AbortSignal
): void
```
Schedule a recurring task with a specified interval. The task runs until aborted.

#### Configuration

```typescript
getConfigSlice&lt;T extends &#123; parse: (any: any) =&gt; any &#125;&gt;(
  key: string,
  schema: T
): z.output&lt;T&gt;
```
Get a validated config slice using a Zod schema. Throws if the key doesn't exist or validation fails.

#### Lifecycle

```typescript
shutdown(): void
```
Stop the application by aborting the internal AbortController.

```typescript
run(): Promise&lt;void&gt;
```
Start all registered services. Returns a promise that resolves when all services complete or the abort signal is triggered.

### PluginManager Methods

```typescript
getPlugins(): TokenRingPlugin&lt;unknown&gt;[]
```
Get all installed plugins.

```typescript
async installPlugins(plugins: TokenRingPlugin&lt;any&gt;[]): Promise&lt;void&gt;
```
Install plugins with configuration validation. All plugins are installed first, then started. Errors during installation prevent plugin registration.

### StateManager Methods

```typescript
initializeState&lt;S, T extends SerializableStateSlice&gt;(
  StateClass: new (props: S) =&gt; T,
  props: S
): void
```
Initialize a state slice with the given class and props.

```typescript
getState&lt;T extends SerializableStateSlice&gt;(
  StateClass: new (...args: any[]) =&gt; T
): T
```
Get a state slice by class. Throws if not initialized.

```typescript
mutateState&lt;R, T extends SerializableStateSlice&gt;(
  StateClass: new (...args: any[]) =&gt; T,
  callback: (state: T) =&gt; R
): R
```
Mutate state with a callback. Returns the callback result.

```typescript
serialize(): Record&lt;string, object&gt;
```
Serialize all state slices to a record.

```typescript
deserialize(
  data: Record&lt;string, object&gt;,
  onMissing?: (key: string) =&gt; void
): void
```
Deserialize state slices. Unknown keys trigger the onMissing callback.

```typescript
forEach(cb: (item: SerializableStateSlice) =&gt; void): void
```
Iterate over all state slices.

```typescript
entries(): IterableIterator&lt;[string, SerializableStateSlice]&gt;
```
Get an iterator of [key, value] pairs for all state slices.

```typescript
subscribe&lt;T extends SerializableStateSlice&gt;(
  StateClass: new (...args: any[]) =&gt; T,
  callback: (state: T) =&gt; void
): () =&gt; void
```
Subscribe to state changes. Returns an unsubscribe function.

```typescript
waitForState&lt;T extends SerializableStateSlice&gt;(
  StateClass: new (...args: any[]) =&gt; T,
  predicate: (state: T) =&gt; boolean
): Promise&lt;T&gt;
```
Wait for a state predicate to become true.

```typescript
timedWaitForState&lt;T extends SerializableStateSlice&gt;(
  StateClass: new (...args: any[]) =&gt; T,
  predicate: (state: T) =&gt; boolean,
  timeoutMs: number
): Promise&lt;T&gt;
```
Wait for a state predicate with timeout.

```typescript
subscribeAsync&lt;T extends SerializableStateSlice&gt;(
  StateClass: new (...args: any[]) =&gt; T,
  signal: AbortSignal
): AsyncGenerator&lt;T, void, unknown&gt;
```
Async generator that yields state updates until aborted.

### buildTokenRingAppConfig

```typescript
async function buildTokenRingAppConfig&lt;ConfigSchema extends ZodObject&gt;(&#123;
  workingDirectory,
  dataDirectory,
  configFileName,
  configSchema,
  defaultConfig,
  mergeConfig
&#125;: CreateTokenRingAppOptions&lt;ConfigSchema&gt;): Promise&lt;z.output&lt;ConfigSchema&gt;&gt;
```
Build application configuration by loading from multiple locations with Zod validation.

## Configuration

### Application Configuration Schema

```typescript
const TokenRingAppConfigSchema = z.record(z.string(), z.unknown());
type TokenRingAppConfig = z.infer&lt;typeof TokenRingAppConfigSchema&gt;;
```

### Plugin Configuration Schema

```typescript
const MyPluginSchema = z.object(&#123;
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  models: z.array(z.string()).default([])
&#125;);

const myPlugin: TokenRingPlugin&lt;typeof MyPluginSchema&gt; = &#123;
  name: "MyPlugin",
  version: "1.0.0",
  description: "Plugin with config",
  config: MyPluginSchema,
  install(app, config) &#123;
    // Config is already validated
    if (config.enabled) &#123;
      // Initialize plugin
    &#125;
  &#125;
&#125;;
```

### Config Loading Order

Config files are loaded from `~` (home) and `dataDirectory` in that order, with extensions `.ts`, `.mjs`, `.cjs`, `.js`.

## Integration

### Plugin Integration

```typescript
import PluginManager from "@tokenring-ai/app/PluginManager";
import type &#123; TokenRingPlugin &#125; from "@tokenring-ai/app/types.ts";

const pluginManager = new PluginManager(app);

const myPlugin: TokenRingPlugin = &#123;
  name: "MyPlugin",
  version: "1.0.0",
  description: "Custom plugin",
  install(app) &#123;
    // Set up plugin
  &#125;,
  start(app) &#123;
    // Start plugin
  &#125;
&#125;;

await pluginManager.installPlugins([myPlugin]);
```

### State Serialization

```typescript
// Save state
const serialized = stateManager.serialize();
await fs.writeFile("state.json", JSON.stringify(serialized));

// Load state
const data = JSON.parse(await fs.readFile("state.json", "utf-8"));
stateManager.deserialize(data, (key) =&gt; &#123;
  console.log(`Unknown state: $&#123;key&#125;`);
&#125;);
```

### Abort Signal Handling

```typescript
const app = new TokenRingApp("/path", &#123;&#125;);

app.trackPromise(async (signal) =&gt; &#123;
  while (!signal.aborted) &#123;
    const result = await longRunningOperation();
    processResult(result);
  &#125;
&#125;);

// Stop the app
app.shutdown();
```

## API Reference

### TokenRingApp

| Method | Description |
|--------|-------------|
| `addServices(...services)` | Register services with application |
| `requireService(serviceType)` | Get service by type (throws if not found) |
| `getService(serviceType)` | Get service by type (returns undefined if not found) |
| `getServices()` | Get all registered services |
| `waitForService(serviceType, callback)` | Wait for service to be available |
| `getConfigSlice(key, schema)` | Get validated config slice |
| `serviceOutput(...messages)` | Log system messages |
| `serviceError(...messages)` | Log error messages |
| `trackPromise(initiator)` | Track promise and log errors |
| `scheduleEvery(interval, callback, signal)` | Schedule recurring task |
| `shutdown()` | Stop the application |
| `run()` | Start application services |

### PluginManager

| Method | Description |
|--------|-------------|
| `installPlugins(plugins)` | Install plugins with validation |
| `getPlugins()` | Get all installed plugins |

### StateManager

| Method | Description |
|--------|-------------|
| `initializeState(StateClass, props)` | Initialize state slice |
| `getState(StateClass)` | Get state slice |
| `mutateState(StateClass, callback)` | Mutate state with callback |
| `serialize()` | Serialize all state slices |
| `deserialize(data, onMissing)` | Deserialize state slices |
| `forEach(cb)` | Iterate over state slices |
| `entries()` | Get [key, value] iterator |
| `subscribe(StateClass, callback)` | Subscribe to changes |
| `waitForState(StateClass, predicate)` | Wait for state predicate |
| `timedWaitForState(StateClass, predicate, timeout)` | Wait with timeout |
| `subscribeAsync(StateClass, signal)` | Async state generator |

## Types

### TokenRingService

```typescript
interface TokenRingService &#123;
  name: string;
  description: string;
  run?(signal: AbortSignal): Promise&lt;void&gt; | void;
  attach?(agent: Agent): Promise&lt;void&gt; | void;
  detach?(agent: Agent): Promise&lt;void&gt; | void;
&#125;
```

### TokenRingPlugin

```typescript
type TokenRingPlugin&lt;ConfigType&gt; = &#123;
  name: string;
  version: string;
  description: string;
  install?: (app: TokenRingApp) =&gt; void;
  start?: (app: TokenRingApp) =&gt; Promise&lt;void&gt; | void;
&#125; | &#123;
  name: string;
  version: string;
  description: string;
  config: ConfigType;
  install?: (app: TokenRingApp, config: z.output&lt;ConfigType&gt;) =&gt; void;
  start?: (app: TokenRingApp, config: z.output&lt;ConfigType&gt;) =&gt; Promise&lt;void&gt; | void;
&#125;;
```

### SerializableStateSlice

```typescript
interface SerializableStateSlice &#123;
  name: string;
  serialize(): object;
  deserialize(data: object): void;
&#125;
```

### TokenRingAppConfig

```typescript
export const TokenRingAppConfigSchema = z.record(z.string(), z.unknown());
export type TokenRingAppConfig = z.infer&lt;typeof TokenRingAppConfigSchema&gt;;
```

### LogEntry

```typescript
type LogEntry = &#123;
  timestamp: number;
  level: "info" | "error";
  message: string;
&#125;;
```

## Error Handling

The application provides comprehensive error handling:

- **Configuration Errors**: Zod validation errors with descriptive messages
- **Service Not Found**: Clear error when requiring a service that doesn't exist
- **Promise Errors**: Automatic logging of unhandled promise rejections
- **Lifecycle Errors**: Graceful shutdown handling during startup failures
- **State Errors**: Safe deserialization with error callbacks

## Development

### Testing

```bash
bun test
bun test:watch
bun test:coverage
```

### Building

```bash
bun run build
```

### Package Structure

```
pkg/app/
├── TokenRingApp.ts        # Main application class
├── PluginManager.ts       # Plugin lifecycle management
├── StateManager.ts        # State management utility
├── buildTokenRingAppConfig.ts  # Config builder function
├── types.ts               # Type definitions
├── index.ts               # Main exports
├── test/
│   ├── TokenRingApp.test.ts
│   ├── PluginManager.test.ts
│   ├── StateManager.test.ts
│   ├── integration.test.ts
│   └── createTestingApp.ts
└── LICENSE
```

### Contribution Guidelines

- Follow established coding patterns
- Write unit tests for new functionality
- Ensure Zod schema validation for all configuration
- Update documentation for new features
- Test with multiple service configurations

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
