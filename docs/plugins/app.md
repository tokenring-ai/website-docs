# App

## User Guide

### Overview

The `@tokenring-ai/app` package provides the base application framework for TokenRing applications. It serves as the foundational infrastructure for building modular, extensible applications with comprehensive lifecycle management, service orchestration, plugin architecture, and state management.

### Key Features

- **Service-Oriented Architecture**: Organizes functionality into configurable services with registry-based management
- **Plugin-Based Extensions**: Seamless integration with plugin system for modular functionality
- **Type-Safe Configuration**: Zod-based validation for all configuration schemas with layered config loading
- **Lifecycle Management**: Controlled initialization, startup, and shutdown processes with automatic service restart on error
- **State Isolation**: Separate state slices with serialization and deserialization support
- **Signal-Based Shutdown**: Graceful termination using AbortSignal with progress indicator
- **Background Task Management**: Automatic error handling for async background tasks with tracking
- **Comprehensive Logging**: Structured output for system messages and errors with service context
- **Async State Subscriptions**: Support for async state observation with abort handling
- **Service Auto-Restart**: Services that exit unexpectedly are automatically restarted after 5 seconds
- **Session Checkpointing**: Generate and restore app session state with persistence
- **Config Directory Loading**: Load configuration from multiple YAML files across directories
- **RPC Endpoints**: Exposes plugin and log information via RPC interface

### Tools

The app package provides the following tools for application management:

| Tool Name | Description |
|-----------|-------------|
| `TokenRingApp` | Main application class for orchestrating services, configuration, and lifecycle |
| `StateManager` | Type-safe state management with serialization support |
| `PluginManager` | Manages plugin installation and lifecycle |
| `buildTokenRingAppConfig` | Utility for building application configuration from YAML files |

### User Guide Configuration

The app package requires configuration through the `TokenRingAppConfig` schema.

#### Environment Variables

No specific environment variables are required. Configuration is provided through YAML files.

#### Configuration Example

```yaml
app:
  dataDirectory: /path/to/data
  configDirectories:
    - /path/to/config
  shutdownMonitorIntervalMs: 2000
  serviceRestartDelayMs: 5000
  printLogs: false
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataDirectory` | string | Required | Directory for storing application data |
| `configDirectories` | string[] | Required | Array of directories to load configuration from |
| `shutdownMonitorIntervalMs` | number | 2000 | Interval in milliseconds for shutdown progress monitoring |
| `serviceRestartDelayMs` | number | 5000 | Delay in milliseconds before restarting a failed service |
| `printLogs` | boolean | false | Whether to print logs to console |

### Integration

The app package integrates with the following components:

- **@tokenring-ai/agent**: Core agent orchestration
- **@tokenring-ai/utility**: Shared utilities and helpers
- **@tokenring-ai/rpc**: RPC infrastructure

### Best Practices

1. **Service Registration**: Register services in the order they should be initialized
2. **Error Handling**: Use `runBackgroundTask` for background operations to ensure errors are logged
3. **State Management**: Use typed state slices for type-safe state access
4. **Configuration**: Validate all configuration using Zod schemas
5. **Shutdown**: Use graceful shutdown with `shutdown()` method to ensure clean service termination
6. **Plugin Lifecycle**: Implement `earlyInstall`, `install`, and `start` hooks appropriately for plugin initialization

---

## Developer Reference

### Core Components

#### TokenRingApp

The main application class that orchestrates services, configuration, and lifecycle management.

##### TokenRingApp Constructor

```typescript
constructor(readonly config: TokenRingAppConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | TokenRingAppConfig | Application configuration with validated schema |

##### Properties

| Property | Type | Description |
|----------|------|-------------|
| `sessionId` | string | Unique session ID for this instance (auto-generated) |
| `stateManager` | StateManager<AppStateSlice<any>> | State manager for app-level state |
| `runningServices` | Set<TokenRingService> | Set of services currently running |
| `stoppingServices` | Set<TokenRingService> | Set of services currently stopping |
| `backgroundTasks` | Map<string, number> | Map tracking background task counts per service name |
| `services` | TypedRegistry<TokenRingService> | Registry of all registered services |
| `config` | TokenRingAppConfig | The application configuration |

##### TokenRingApp Methods

###### Service Management

```typescript
addServices(...services: TokenRingService[]): void
```

Register services with the application. Services are automatically initialized in registration order.

```typescript
requireService<T>(serviceType: abstract new (...args: any[]) => T): T
```

Get a service by type. Throws an error if the service is not found.

```typescript
getService<T>(serviceType: abstract new (...args: any[]) => T): T | undefined
```

Get a service by type. Returns undefined if the service is not found.

```typescript
getServices(): TokenRingService[]
```

Get all registered services.

```typescript
waitForService<T extends TokenRingService>(
  serviceType: abstract new (...args: any[]) => T,
  callback: (service: T) => void
): void
```

Wait for a service to become available. The callback is invoked immediately if the service is already registered, or when the service is registered if it hasn't been registered yet.

###### Logging

```typescript
serviceOutput(service: TokenRingService, ...messages: any[]): void
```

Log informational messages with service context. Messages are prefixed with the service name and stored in the logs array.

```typescript
serviceError(service: TokenRingService, ...messages: any[]): void
```

Log error messages with service context. Messages are prefixed with the service name and logged at error level.

```typescript
get logs(): LogEntry[]
```

Get all log entries (info and error).

```typescript
async *subscribeLogsAsync(position: number, signal: AbortSignal): AsyncGenerator<LogEntry, void, unknown>
```

Async generator that yields log entries starting from the given position. Yields new log entries as they are added until the signal is aborted.

###### Background Task Management

```typescript
runBackgroundTask(service: TokenRingService, initiator: (signal: AbortSignal) => Promise<void>): void
```

Track an app-level promise and log any errors that occur. The task runs in the background and errors are automatically logged to the service. Tracks the number of concurrent background tasks per service name.

###### State Management

```typescript
generateStateCheckpoint(): Record<string, object>
```

Generate a session checkpoint containing the current state. Returns the serialized state from the state manager.

```typescript
restoreState(state: AppSessionCheckpoint["state"]): void
```

Restore state from a checkpoint. Unknown state slices trigger a log message.

###### Configuration

```typescript
getConfigSlice<T extends { parse: (any: any) => any }>(key: string, schema: T): z.output<T>
```

Get a validated config slice using a Zod schema. Throws if the key doesn't exist or validation fails.

###### Lifecycle

```typescript
shutdown(reason: string = "App shutdown for unknown reason"): void
```

Stop the application by aborting the internal AbortController. Displays a progress indicator showing services still running and background tasks. Automatically exits when all services have stopped.

```typescript
async run(): Promise<void>
```

Start all registered services and run the application lifecycle:

1. Calls `start()` on all registered services
2. Runs `run()` on all services that have it in a loop
   - If a service exits without error but we aren't aborted, it logs an error and restarts after 5 seconds
   - If a service throws an error, it logs the error and restarts after 5 seconds
   - Services continue running until the abort signal is triggered
3. Calls `stop()` on all registered services when shutdown

```typescript
get isShuttingDown(): boolean
```

Check if the application is shutting down. Returns true if the abort signal has been triggered.

#### StateManager

Type-safe state management with serialization support.

##### StateManager Constructor

```typescript
constructor(startingState: Record<string, unknown> = {})
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `startingState` | Record<string, unknown> | Optional initial state to restore on initialization |

##### StateManager Methods

```typescript
initializeState<S, T extends SerializableStateSlice>(
  StateClass: new (props: S) => T,
  props: S
): T
```

Initialize a state slice with the given class and props. If the starting state contains data for this slice, it will be deserialized automatically. Returns the initialized state slice.

```typescript
getState<T extends SerializableStateSlice>(
  StateClass: new (...args: any[]) => T
): T
```

Get a state slice by class. Throws if not initialized.

```typescript
mutateState<R, T extends SerializableStateSlice>(
  StateClass: new (...args: any[]) => T,
  callback: (state: T) => R
): R
```

Mutate state with a callback. Returns the callback result. Automatically notifies all subscribers after mutation.

```typescript
serialize(): Record<string, object>
```

Serialize all state slices to a record keyed by state slice class name.

```typescript
deserialize(data: Record<string, unknown>, onMissing?: (key: string) => void): void
```

Deserialize state slices. Unknown keys trigger the onMissing callback. Validates data against serialization schema. Notifies all subscribers after deserialization.

```typescript
forEach(cb: (item: SerializableStateSlice) => void): void
```

Iterate over all state slices.

```typescript
slices(): IterableIterator<SerializableStateSlice>
```

Get an iterator of all state slices.

```typescript
subscribe<T extends SerializableStateSlice>(
  StateClass: new (...args: any[]) => T,
  callback: (state: T) => void
): () => void
```

Subscribe to state changes. Returns an unsubscribe function. The callback is invoked immediately via `queueMicrotask` with the current state.

```typescript
waitForState<T extends SerializableStateSlice>(
  StateClass: new (...args: any[]) => T,
  predicate: (state: T) => boolean
): Promise<T>
```

Wait for a state predicate to become true. Returns a promise that resolves when the predicate is satisfied.

```typescript
timedWaitForState<T extends SerializableStateSlice>(
  StateClass: new (...args: any[]) => T,
  predicate: (state: T) => boolean,
  timeoutMs: number
): Promise<T>
```

Wait for a state predicate with timeout. Rejects with an error if the timeout is exceeded.

```typescript
async *subscribeAsync<T extends SerializableStateSlice>(
  StateClass: new (...args: any[]) => T,
  signal: AbortSignal
): AsyncGenerator<T, void, unknown>
```

Async generator that yields state updates until aborted. Buffers state updates and yields them one at a time.

#### PluginManager

Manages plugin installation and lifecycle. Implements `TokenRingService`.

##### PluginManager Constructor

```typescript
constructor(app: TokenRingApp)
```

Creates a new PluginManager and automatically registers it as a service with the provided app.

##### PluginManager Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | "PluginManager" | Service name |
| `description` | "Manages plugins" | Service description |

##### PluginManager Methods

```typescript
getPlugins(): TokenRingPlugin<any>[]
```

Get all installed plugins.

```typescript
async installPlugins(plugins: TokenRingPlugin<any>[]): Promise<void>
```

Install plugins with configuration validation. The process is:

1. Call `earlyInstall()` on all plugins (if defined) - errors prevent plugin registration
2. Call `install()` on all plugins (if defined) - errors prevent plugin registration
3. Register all plugins
4. Call `start()` on all plugins (if defined) - errors prevent successful installation

For plugins with configuration, the config is parsed from `app.config` and passed to `earlyInstall()`, `install()`, and `start()`. For plugins without configuration, an empty object is passed.

Errors during installation prevent plugin registration. Errors during startup also prevent the plugin from being considered successfully installed.

```typescript
async reconfigurePlugins(newConfig: TokenRingAppConfig): Promise<{ restartRequired: boolean }>
```

Reconfigure all plugins with new application configuration. The process is:

1. For each plugin with configuration, compare the current config slice with the new config slice
2. If the config changed and the plugin has a `reconfigure()` method, call it
3. If the config changed but the plugin doesn't support reconfiguration, set `restartRequired` to true

Returns `{ restartRequired: boolean }` indicating whether any plugins require a restart.

### buildTokenRingAppConfig

```typescript
function buildTokenRingAppConfig<T extends z.ZodTypeAny>(
  configSchema: T,
  defaultConfig: z.input<T> & z.input<typeof TokenRingAppConfigSchema>
): z.output<T>
```

Build application configuration by loading from multiple YAML files across directories with Zod validation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `configSchema` | T | Zod schema for validating the configuration |
| `defaultConfig` | z.input<T> & z.input<typeof TokenRingAppConfigSchema> | Default configuration including app config structure |

**Config Loading Process**: Config files are loaded from each directory in `configDirectories` in order. All `.yaml` files in each directory are scanned and merged using `deepMerge` from `@tokenring-ai/utility`. The config is validated at each step to ensure it is complete and well-formed.

**Additional Behavior**:

- Creates the data directory if it doesn't exist
- Creates a `.gitignore` file in the data directory if it doesn't exist (with `*.sqlite*` pattern)
- Merges configs using `deepClone` from `@tokenring-ai/utility`
- Validates the merged config at each step using `configSchema.parse()`
- Supports YAML configuration files only

### RPC Endpoints

The package exposes RPC endpoints for plugin and log information via `/rpc/app`.

#### Schema

```typescript
const AppRpcSchema = {
  name: "App RPC",
  path: "/rpc/app",
  methods: {
    listPlugins: {
      type: "query" as const,
      input: z.object({}),
      result: z.object({
        plugins: z.array(
          z.object({
            name: z.string(),
            displayName: z.string(),
            version: z.string(),
            description: z.string(),
            hasConfig: z.boolean(),
          }),
        ),
      }),
    },
    getLogs: {
      type: "query" as const,
      input: z.object({}),
      result: z.object({
        logs: z.array(
          z.object({
            timestamp: z.number(),
            level: z.enum(["info", "error"]),
            message: z.string(),
          }),
        ),
      }),
    },
  },
};
```

#### listPlugins

Returns information about all installed plugins.

**Input**: `{}`

**Output**:
```typescript
{
  plugins: Array<{
    name: string;
    displayName: string;
    version: string;
    description: string;
    hasConfig: boolean;
  }>;
}
```

#### getLogs

Returns all log entries from the application.

**Input**: `{}`

**Output**:
```typescript
{
  logs: Array<{
    timestamp: number;
    level: "info" | "error";
    message: string;
  }>;
}
```

### Types

#### TokenRingService

Interface for services that can be registered with the application.

```typescript
interface TokenRingService {
  readonly name: string;
  readonly description: string;

  run?(signal: AbortSignal): MaybePromise<void>;

  start?(signal: AbortSignal): MaybePromise<void>;

  stop?(): MaybePromise<void>;

  attach?(agent: Agent, creationContext: AgentCreationContext): void;

  detach?(agent: Agent): void;
}
```

| Property/Method | Description |
|-----------------|-------------|
| `name` | Unique service name |
| `description` | Human-readable service description |
| `run` | Main service loop. Called after `start()`. Exited services are automatically restarted after 5 seconds |
| `start` | Initialization logic. Called before `run()` |
| `stop` | Cleanup logic. Called during shutdown |
| `attach` | Attach to an agent with creation context |
| `detach` | Detach from an agent |

#### TokenRingPlugin

There are two types of plugins:

##### Simple Plugin (no config)

```typescript
{
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly description: string;
  earlyInstall?: (app: TokenRingApp) => MaybePromise<void>;
  install?: (app: TokenRingApp) => MaybePromise<void | undefined>;
  start?: (app: TokenRingApp) => MaybePromise<void>;
}
```

##### Plugin with Configuration

```typescript
{
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly description: string;
  readonly config: ConfigType;  // Zod schema
  earlyInstall?: (app: TokenRingApp, config: z.output<ConfigType>) => MaybePromise<void>;
  install?: (app: TokenRingApp, config: z.output<ConfigType>) => MaybePromise<void | undefined>;
  start?: (app: TokenRingApp, config: z.output<ConfigType>) => MaybePromise<void>;
  reconfigure?: (app: TokenRingApp, config: z.output<ConfigType>) => MaybePromise<void>;
}
```

**Important Notes**:

- `earlyInstall()` is called before `install()` and can be awaited
- `install()` is called for all plugins before any `start()` is called
- `start()` is called after all plugins are installed
- `reconfigure()` is called when plugin configuration changes and the plugin supports reconfiguration
- For plugins with config, `earlyInstall()`, `install()`, and `start()` receive the parsed config from `app.config`

#### SerializableStateSlice

Abstract base class for state slices that can be serialized and deserialized.

```typescript
abstract class SerializableStateSlice<SerializationSchema extends z.ZodTypeAny> {
  constructor(
    public readonly name: string,
    public readonly serializationSchema: SerializationSchema
  )

  abstract serialize(): z.input<SerializationSchema>;

  abstract deserialize(data: z.output<SerializationSchema>): void;
}
```

| Method | Description |
|--------|-------------|
| `serialize()` | Serialize state to a format matching the schema's input |
| `deserialize()` | Deserialize state from validated schema output |

#### AppStateSlice

Abstract base class for app state slices.

```typescript
abstract class AppStateSlice<SerializationSchema extends z.ZodTypeAny> 
  extends SerializableStateSlice<SerializationSchema>
```

#### AppSessionCheckpoint

Interface for app session checkpoints.

```typescript
interface AppSessionCheckpoint {
  sessionId: string;
  createdAt: number;
  hostname: string;
  projectDirectory: string;
  state: Record<string, object>;
}
```

| Property | Description |
|----------|-------------|
| `sessionId` | Unique session ID |
| `createdAt` | Timestamp when checkpoint was created |
| `hostname` | Hostname of the machine |
| `projectDirectory` | Working directory path |
| `state` | Serialized state |

#### StateStorageInterface

Interface for state storage implementations.

```typescript
interface StateStorageInterface<SpecificStateSliceType extends SerializableStateSlice<any>> {
  getState<T extends SpecificStateSliceType>(ClassType: new (...args: any[]) => T): T;
  mutateState<R, T extends SpecificStateSliceType>(
    ClassType: new (...args: any[]) => T,
    callback: (state: T) => R,
  ): R;
  initializeState<S, T extends SpecificStateSliceType>(
    ClassType: new (props: S) => T,
    props: S,
  ): void;
}
```

#### TokenRingAppConfig

```typescript
export const TokenRingAppConfigSchema = z.object({
  app: z.object({
    dataDirectory: z.string(),
    configDirectories: z.array(z.string()),
    shutdownMonitorIntervalMs: z.number().default(2000),
    serviceRestartDelayMs: z.number().default(5000),
    printLogs: z.boolean().default(false),
  }),
});

export const LooseTokenRingAppConfigSchema = TokenRingAppConfigSchema.loose();
export type TokenRingAppConfig = z.output<typeof LooseTokenRingAppConfigSchema>;
```

#### LogEntry

```typescript
interface LogEntry {
  timestamp: number;
  level: "info" | "error";
  message: string;
}
```

#### AppLogsState

State slice for managing application logs.

```typescript
class AppLogsState extends AppStateSlice<typeof serializationSchema> {
  logs: LogEntry[] = [];
  
  addLog(level: "info" | "error", message: string): void;
  getLogs(): LogEntry[];
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
}
```

| Method | Description |
|--------|-------------|
| `addLog()` | Add a log entry with timestamp, level, and message |
| `getLogs()` | Get all log entries |
| `serialize()` | Serialize logs for checkpointing |
| `deserialize()` | Deserialize logs from checkpoint |

### Usage Examples

#### Basic Application Setup

```typescript
import TokenRingApp from "@tokenring-ai/app";
import { z } from "zod";

const AppConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string().default("gpt-3.5-turbo")
});

const config = {
  app: {
    dataDirectory: "/path/to/data",
    configDirectories: ["/path/to/config"],
    shutdownMonitorIntervalMs: 2000,
    serviceRestartDelayMs: 5000,
    printLogs: false,
  },
  apiKey: "your-api-key",
  model: "gpt-3.5-turbo"
};

const app = new TokenRingApp(config);

console.log(app.sessionId); // Unique session ID for this instance
console.log(app.isShuttingDown); // false
```

#### Service Management Example

```typescript
import TokenRingApp, { TokenRingService } from "@tokenring-ai/app";

class MyService implements TokenRingService {
  name = "MyService";
  description = "A custom service";

  async start(signal: AbortSignal) {
    console.log("MyService starting");
  }

  async run(signal: AbortSignal) {
    console.log("MyService running");
    while (!signal.aborted) {
      // Do work
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async stop() {
    console.log("MyService stopping");
  }

  doSomething() {
    return "Service result";
  }
}

// Add service to application
app.addServices(new MyService());

// Get service by type
const myService = app.requireService(MyService);

// Start the application
await app.run();
```

#### Plugin with Configuration Example

```typescript
import { z } from "zod";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import TokenRingApp, { PluginManager } from "@tokenring-ai/app";

const MyPluginConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string().default("gpt-3.5-turbo")
});

const myPlugin: TokenRingPlugin<typeof MyPluginConfigSchema> = {
  name: "my-plugin",
  displayName: "My Plugin",
  version: "1.0.0",
  description: "My custom plugin with config",
  config: MyPluginConfigSchema,
  earlyInstall(app, config) {
    console.log(`Early installing with API key: ${config.apiKey}`);
    // Can await here
  },
  install(app, config) {
    console.log(`Installing with model: ${config.model}`);
    // Can await here
  },
  start(app, config) {
    console.log(`Starting with model: ${config.model}`);
  },
  reconfigure(app, config) {
    console.log(`Reconfiguring with model: ${config.model}`);
  }
};

// Add plugin to application via PluginManager
const app = new TokenRingApp(config);
const pluginManager = new PluginManager(app);
await pluginManager.installPlugins([myPlugin]);
```

#### Plugin without Configuration

```typescript
import type { TokenRingPlugin } from "@tokenring-ai/app";
import TokenRingApp, { PluginManager } from "@tokenring-ai/app";

const myPlugin: TokenRingPlugin = {
  name: "my-simple-plugin",
  displayName: "My Simple Plugin",
  version: "1.0.0",
  description: "A simple plugin without config",
  earlyInstall(app) {
    console.log("Early installing simple plugin");
    // Can await here
  },
  install(app) {
    console.log("Installing simple plugin");
    // Can await here
  },
  start(app) {
    console.log("Starting simple plugin");
    // Can await here
  }
};

// Add plugin to application via PluginManager
const app = new TokenRingApp(config);
const pluginManager = new PluginManager(app);
await pluginManager.installPlugins([myPlugin]);
```

#### State Management Example

```typescript
import StateManager, { SerializableStateSlice } from "@tokenring-ai/app/StateManager";
import { z } from "zod";

const serializationSchema = z.object({
  name: z.string(),
  email: z.string(),
});

interface UserState extends SerializableStateSlice<typeof serializationSchema> {
  name: string;
  email: string;
}

class UserStateSlice extends SerializableStateSlice<typeof serializationSchema> implements UserState {
  readonly name = "UserState";
  serializationSchema = serializationSchema;

  constructor(public name: string, public email: string) {
    super("UserState", serializationSchema);
  }

  serialize() {
    return { name: this.name, email: this.email };
  }

  deserialize(data: z.output<typeof serializationSchema>) {
    this.name = data.name;
    this.email = data.email;
  }
}

// Initialize state
const stateManager = new StateManager();
stateManager.initializeState(
  UserStateSlice,
  { name: "John", email: "john@example.com" }
);

// Update state
const result = stateManager.mutateState(UserStateSlice, (state) => {
  state.name = "Jane";
  return state.name;
});

console.log(result); // "Jane"

// Subscribe to changes
const unsubscribe = stateManager.subscribe(UserStateSlice, (state) => {
  console.log("State changed:", state);
});

// Async state observation
const signal = new AbortController().signal;
const stateStream = stateManager.subscribeAsync(UserStateSlice, signal);
for await (const state of stateStream) {
  console.log("New state:", state);
}

// Wait for state predicate
await stateManager.waitForState(UserStateSlice, (state) => state.name === "Jane");

// Wait for state predicate with timeout
try {
  await stateManager.timedWaitForState(UserStateSlice, (state) => state.name === "Jane", 5000);
} catch (error) {
  console.log("Timeout waiting for state");
}

// Iterate over state entries
for (const slice of stateManager.slices()) {
  console.log("State slice:", slice.name);
}
```

#### Build Config from Files

```typescript
import buildTokenRingAppConfig from "@tokenring-ai/app/buildTokenRingAppConfig";
import { z } from "zod";

const AppConfigSchema = z.object({
  apiKey: z.string(),
  model: z.string().default("gpt-4")
});

const config = buildTokenRingAppConfig(AppConfigSchema, {
  app: {
    dataDirectory: "/path/to/data",
    configDirectories: ["/path/to/config"],
    shutdownMonitorIntervalMs: 2000,
    serviceRestartDelayMs: 5000,
    printLogs: false,
  },
  apiKey: "",
  model: "gpt-3.5-turbo"
});
```

#### Plugin Manager Usage

```typescript
import PluginManager, { type TokenRingPlugin } from "@tokenring-ai/app";
import TokenRingApp from "@tokenring-ai/app";

const pluginManager = new PluginManager(app);

const myPlugin: TokenRingPlugin = {
  name: "my-plugin",
  displayName: "My Plugin",
  version: "1.0.0",
  description: "Custom plugin",
  install(app) {
    // Set up plugin (can await)
  },
  start(app) {
    // Start plugin (can await)
  }
};

await pluginManager.installPlugins([myPlugin]);

// Get all installed plugins
const plugins = pluginManager.getPlugins();
```

#### Plugin Reconfiguration Example

```typescript
import { z } from "zod";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import TokenRingApp, { PluginManager } from "@tokenring-ai/app";

const MyPluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  models: z.array(z.string()).default([])
});

const myPlugin: TokenRingPlugin<typeof MyPluginConfigSchema> = {
  name: "my-plugin",
  displayName: "My Plugin",
  version: "1.0.0",
  description: "Plugin with reconfiguration support",
  config: MyPluginConfigSchema,
  install(app, config) {
    // Initial setup
  },
  start(app, config) {
    // Start service
  },
  reconfigure(app, config) {
    // Handle config changes
  }
};

// Add plugin via PluginManager
await pluginManager.installPlugins([myPlugin]);

// Later, when app config changes:
const { restartRequired } = await pluginManager.reconfigurePlugins(newAppConfig);
if (restartRequired) {
  console.log("Some plugins require restart");
}
```

#### Background Task Management Example

```typescript
import TokenRingApp, { TokenRingService } from "@tokenring-ai/app";

class BackgroundService implements TokenRingService {
  name = "BackgroundService";
  description = "Runs background tasks";

  run(signal: AbortSignal) {
    // Run a background task that will be tracked
    app.runBackgroundTask(this, async (signal) => {
      while (!signal.aborted) {
        const result = await longRunningOperation();
        processResult(result);
      }
    });
  }
}

const app = new TokenRingApp(config);
app.addServices(new BackgroundService());

// Errors in background tasks are automatically logged
```

#### Service Auto-Restart

```typescript
import TokenRingApp, { TokenRingService } from "@tokenring-ai/app";

class UnstableService implements TokenRingService {
  name = "UnstableService";
  description = "Service that may exit unexpectedly";

  async run(signal: AbortSignal) {
    // If this exits without error, it will restart after 5 seconds
    // If this throws an error, it will restart after 5 seconds
    // Services continue restarting until shutdown is called
    await doWork();
  }
}

const app = new TokenRingApp(config);
app.addServices(new UnstableService());

// The service will automatically restart if it exits unexpectedly
await app.run();
```

#### State Checkpointing

```typescript
import fs from "node:fs";
import TokenRingApp from "@tokenring-ai/app";

// Generate checkpoint (returns serialized state)
const state = app.generateStateCheckpoint();
console.log(state);

// Save checkpoint with metadata
const checkpoint = {
  sessionId: app.sessionId,
  createdAt: Date.now(),
  hostname: "localhost",
  projectDirectory: "/path/to/project",
  state: state
};
await fs.writeFile("checkpoint.json", JSON.stringify(checkpoint));

// Restore checkpoint
const savedCheckpoint = JSON.parse(await fs.readFile("checkpoint.json", "utf-8"));
app.restoreState(savedCheckpoint.state);
```

#### Shutdown with Progress Indicator

```typescript
import TokenRingApp, { TokenRingService } from "@tokenring-ai/app";

class LongRunningService implements TokenRingService {
  name = "LongRunningService";
  description = "Service that runs for a while";

  async run(signal: AbortSignal) {
    while (!signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

const app = new TokenRingApp(config);
app.addServices(new LongRunningService());

// Start the app
const runPromise = app.run();

// Later, shutdown the app
app.shutdown("User requested shutdown");

// The shutdown will show a progress indicator
// and automatically exit when all services have stopped
```

#### Log Subscription

```typescript
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp(config);

// Subscribe to log entries
const signal = new AbortController().signal;
for await (const entry of app.subscribeLogsAsync(0, signal)) {
  console.log(`[${entry.level}] ${entry.message}`);
}

// Logs are also accessible via app.logs
console.log(app.logs);
```

### Dependencies

This package depends on:

- `@tokenring-ai/agent` (workspace:*) - Core agent orchestration
- `@tokenring-ai/utility` (workspace:*) - Shared utilities and helpers
- `@tokenring-ai/rpc` (workspace:*) - RPC infrastructure
- `zod` (^4.3.6) - Type validation

**Dev Dependencies**:

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - Type checking

### Related Components

- `@tokenring-ai/coder` - Developer assistant application
- `@tokenring-ai/writer` - Content creation and management application
- `@tokenring-ai/webterminal` - Lightweight coding terminal interface

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

## License

MIT License - see LICENSE file for details.
