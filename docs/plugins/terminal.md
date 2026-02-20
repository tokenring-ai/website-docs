# Terminal Package

## Overview

The Terminal package provides a unified interface for executing shell commands with safety validation and provider-based architecture. It enables agents to execute shell commands safely with configurable timeouts, output truncation, and command safety validation.

## Key Features

- Shell command execution with timeout support (default 120 seconds)
- Command safety validation (safe, unknown, dangerous categories)
- Compound command parsing (&&, ||, ;, |)
- Configurable output truncation
- Multi-provider architecture for different terminal backends
- **Isolation level support** for sandboxed execution (none, sandbox, container)
- State management for agent-specific terminal configuration
- Tool-based interface with safety confirmation prompts
- **Persistent terminal sessions** for long-running processes and interactive shells
- **Session management** with start, continue, stop, and list operations
- **Configurable wait intervals** for output collection (minInterval, settleInterval, maxInterval)
- **Position-based output tracking** for incremental reads
- **Chat command interface** with `/terminal` command for manual session management

## Core Components

### TerminalService

The main service class that manages terminal operations and command execution.

**Properties:**

- `name: string` - Service name
- `description: string` - Service description
- `defaultProvider: TerminalProvider` - Default terminal provider instance
- `terminalProviderRegistry: KeyedRegistry<TerminalProvider>` - Registry for terminal providers

**Methods:**

#### `start(signal?: AbortSignal): void`

Lifecycle method called by the application to initialize the service.

```typescript
terminal.start(signal);
```

#### `attach(agent: Agent): void`

Attaches the service to an agent and initializes the agent's TerminalState slice.

```typescript
terminal.attach(agent);
```

#### `executeCommand(command: string, args: string[], options: Partial<ExecuteCommandOptions>, agent: Agent): Promise<ExecuteCommandResult>`

Execute a shell command.

```typescript
const result = await terminal.executeCommand(
  'npm install',
  [],
  { timeoutSeconds: 120 },
  agent
);
console.log(result.output);
```

**Parameters:**

- `command`: Shell command to execute
- `args`: Command arguments
- `options`: Execution options (timeout, workingDirectory, env, input)
- `agent`: Agent instance

**Returns:** Command execution result

#### `runScript(script: string, options: Partial<ExecuteCommandOptions>, agent: Agent): Promise<ExecuteCommandResult>`

Execute a shell script.

```typescript
const result = await terminal.runScript(
  'cat package.json',
  { timeoutSeconds: 60 },
  agent
);
console.log(result.output);
```

**Parameters:**

- `script`: Shell script to execute
- `options`: Execution options (timeout, workingDirectory, env, input)
- `agent`: Agent instance

**Returns:** Command execution result

#### `startInteractiveSession(agent: Agent, command: string): Promise<string>`

Start a new interactive terminal session.

```typescript
const sessionId = await terminal.startInteractiveSession(agent, 'npm run dev');
// Returns: 'session-id'
```

**Parameters:**

- `agent`: Agent instance
- `command`: Initial command to execute

**Returns:** Session ID

#### `sendInputToSession(sessionId: string, input: string, agent: Agent): Promise<void>`

Send input to a running terminal session.

```typescript
await terminal.sendInputToSession('session-id', 'y\n', agent);
```

**Parameters:**

- `sessionId`: Terminal session ID
- `input`: Input to send to the terminal
- `agent`: Agent instance

#### `retrieveSessionOutput(sessionId: string, agent: Agent): Promise<{ output: string; position: number; complete: boolean }>`

Retrieve output from a terminal session with automatic waiting strategy.

```typescript
const result = await terminal.retrieveSessionOutput('session-id', agent);
// Returns: { output: '...', position: 100, complete: false }
```

**Parameters:**

- `sessionId`: Terminal session ID
- `agent`: Agent instance

**Returns:** Output, position, and completion status

#### `getCompleteSessionOutput(sessionId: string, agent: Agent): Promise<string>`

Get the complete output from a terminal session without waiting.

```typescript
const complete = await terminal.getCompleteSessionOutput('session-id', agent);
// Returns: 'complete output string'
```

**Parameters:**

- `sessionId`: Terminal session ID
- `agent`: Agent instance

**Returns:** Complete output string

#### `terminateSession(sessionId: string, agent: Agent): Promise<void>`

Terminate a terminal session.

```typescript
await terminal.terminateSession('session-id', agent);
```

**Parameters:**

- `sessionId`: Terminal session ID
- `agent`: Agent instance

#### `getCommandSafetyLevel(shellString: string): "safe" | "unknown" | "dangerous"`

Determine if a command is safe to execute.

```typescript
const level = terminal.getCommandSafetyLevel('rm -rf /');
// Returns: 'dangerous'

const unknownLevel = terminal.getCommandSafetyLevel('my_custom_script.sh');
// Returns: 'unknown'

const safeLevel = terminal.getCommandSafetyLevel('ls -la');
// Returns: 'safe'
```

**Parameters:**

- `shellString`: Shell command string

**Returns:** Safety level (safe, unknown, dangerous)

#### `parseCompoundCommand(command: string): string[]`

Parse compound commands into individual commands.

```typescript
const commands = terminal.parseCompoundCommand('git add . && git commit -m "test" || echo "failed"');
// Returns: ['git', 'add', '.', 'git', 'commit', '-m', '"test"', 'echo', '"failed"']
```

**Parameters:**

- `command`: Shell command string

**Returns:** Array of individual command names

#### `requireActiveTerminal(agent: Agent): TerminalProvider`

Get the active terminal provider for an agent.

```typescript
const provider = terminal.requireActiveTerminal(agent);
const result = await provider.executeCommand('ls', ['-la'], { timeoutSeconds: 30 });
```

**Parameters:**

- `agent`: Agent instance

**Returns:** TerminalProvider instance

**Throws:** Error if no terminal provider configured

#### `setActiveTerminal(providerName: string, agent: Agent): void`

Set the active terminal provider for an agent.

```typescript
terminal.setActiveTerminal('my-provider', agent);
```

**Parameters:**

- `providerName`: Name of the terminal provider
- `agent`: Agent instance

**Throws:** Error if provider doesn't exist

#### `registerTerminalProvider(name: string, provider: TerminalProvider): void`

Register a new terminal provider.

```typescript
class MyTerminalProvider implements TerminalProvider {
  async executeCommand(command, args, options) {
    // Implementation
  }

  async runScript(script, options) {
    // Implementation
  }
}

terminal.registerTerminalProvider('my-provider', new MyTerminalProvider());
terminal.setActiveTerminal('my-provider', agent);
```

**Parameters:**

- `name`: Unique provider name
- `provider`: TerminalProvider instance

#### `requireTerminalProviderByName(name: string): TerminalProvider`

Retrieve a terminal provider by name.

```typescript
const provider = terminal.requireTerminalProviderByName('my-provider');
const result = await provider.executeCommand('ls', ['-la'], { timeoutSeconds: 30 });
```

**Parameters:**

- `name`: Provider name

**Returns:** TerminalProvider instance

**Throws:** Error if provider doesn't exist

#### `getAvailableProviders(): string[]`

Get all available provider names.

```typescript
const providers = terminal.getAvailableProviders();
// Returns: ['local', 'my-provider', ...]
```

**Returns:** Array of provider names

### TerminalProvider

Interface for terminal provider implementations.

```typescript
interface TerminalProvider {
  executeCommand(
    command: string,
    args: string[],
    options: ExecuteCommandOptions,
  ): Promise<ExecuteCommandResult>;

  runScript(
    script: string,
    options: ExecuteCommandOptions,
  ): Promise<ExecuteCommandResult>;

  startInteractiveSession(options: ExecuteCommandOptions): Promise<string>;

  sendInput(sessionId: string, input: string): Promise<void>;

  collectOutput(
    sessionId: string,
    fromPosition: number,
    waitOptions: OutputWaitOptions
  ): Promise<InteractiveTerminalOutput>;

  terminateSession(sessionId: string): Promise<void>;

  getSessionStatus(sessionId: string): SessionStatus | null;

  getIsolationLevel(): TerminalIsolationLevel;
}
```

#### TerminalIsolationLevel

```typescript
type TerminalIsolationLevel = 'none' | 'sandbox' | 'container';
```

- `'none'` - No isolation, commands run directly on the host
- `'sandbox'` - Commands run in a sandbox (e.g., bubblewrap)
- `'container'` - Commands run in a container (e.g., Docker)

#### ExecuteCommandOptions

```typescript
interface ExecuteCommandOptions {
  input?: string;
  timeoutSeconds: number;
  env?: Record<string, string | undefined>;
  workingDirectory?: string;
}
```

#### ExecuteCommandResult

```typescript
type ExecuteCommandResult = {
  status: "success",
  output: string,
} | {
  status: "badExitCode",
  output: string,
  exitCode: number,
} | {
  status: "timeout",
} | {
  status: "unknownError",
  error: string,
};
```

#### OutputWaitOptions

```typescript
interface OutputWaitOptions {
  minInterval: number;     // Minimum time to wait before checking output (seconds)
  settleInterval: number;  // Time of output inactivity before responding (seconds)
  maxInterval: number;     // Maximum time to wait before forcing response (seconds)
}
```

#### InteractiveTerminalOutput

```typescript
interface InteractiveTerminalOutput {
  output: string;
  newPosition: number;
  isComplete: boolean;
  exitCode?: number;
}
```

#### SessionStatus

```typescript
interface SessionStatus {
  id: string;
  running: boolean;
  startTime: number;
  outputLength: number;
  exitCode?: number;
}
```

### TerminalState

Agent state slice for terminal-specific configuration and persistent sessions.

**Properties:**

- `providerName: string | null` - Active terminal provider name
- `bash: { cropOutput: number, timeoutSeconds: number }` - Bash execution options
- `interactiveConfig: { minInterval: number, settleInterval: number, maxInterval: number }` - Output collection intervals
- `sessions: Map<string, SessionRecord>` - Active terminal sessions

**SessionRecord:**

```typescript
interface SessionRecord {
  id: string;
  command: string;
  lastPosition: number;
  startTime: number;
  running: boolean;
}
```

**Methods:**

#### `registerSession(id: string, command: string): void`

Register a new session.

```typescript
state.registerSession('session-id', 'npm run dev');
```

#### `updateSessionPosition(id: string, position: number): void`

Update session position.

```typescript
state.updateSessionPosition('session-id', 100);
```

#### `getSession(id: string): SessionRecord | undefined`

Get session by ID.

```typescript
const session = state.getSession('session-id');
```

**Parameters:**

- `id`: Session ID

**Returns:** Session record or undefined

#### `removeSession(id: string): void`

Remove session from state.

```typescript
state.removeSession('session-id');
```

#### `listSessions(): SessionRecord[]`

List all sessions.

```typescript
const sessions = state.listSessions();
```

**Returns:** Array of session records

#### `serialize(): z.output<typeof serializationSchema>`

Serialize state.

```typescript
const data = state.serialize();
```

**Returns:** Serialized state data

#### `deserialize(data: z.output<typeof serializationSchema>): void`

Deserialize state.

```typescript
state.deserialize(data);
```

**Parameters:**

- `data`: Serialized state data

#### `show(): string[]`

Display state information.

```typescript
const info = state.show();
// Returns: ['Provider: local', 'Output Crop Limit: 10000 chars', 'Active Sessions: 2']
```

**Returns:** Array of state information strings

### Tools

#### terminal_bash

Tool for executing shell commands through the agent interface.

**Parameters:**

- `command`: The shell command to execute (string)

**Behavior:**

1. Validates command is present
2. Checks command safety level
3. If unknown, prompts user for confirmation (10-second timeout)
4. If dangerous, prompts user for confirmation (no timeout)
5. Executes command with configured timeout
6. Truncates output if exceeds crop limit
7. Returns formatted result with exit code and output

**Safety Confirmation:**

- Unknown commands: Requires user confirmation with 10-second timeout
- Dangerous commands: Requires user confirmation without timeout

#### terminal_start

Tool for starting persistent terminal sessions.

**Parameters:**

- `command`: The shell command to execute (string)

**Behavior:**

1. Validates command and checks safety level
2. Starts a persistent terminal session
3. Waits for initial output using configured intervals
4. Returns session ID, output, and position marker

**Usage:**

```markdown
Terminal Session Started
Terminal Id: term-1
Sent Command: npm run dev

Output:
[initial output]
```

**Important:** Only use this for the FIRST command in a new task or when you need to start fresh. Always reuse existing terminal sessions for subsequent commands within the same task.

#### terminal_continue

Tool for continuing interaction with persistent terminal sessions.

**Parameters:**

- `sessionId`: The terminal session ID (string)
- `stdin`: Input to send to the terminal (optional string)

**Behavior:**

1. Retrieves session from state
2. Sends stdin if provided
3. Waits for new output using configured intervals
4. Returns new output since last position
5. Updates position in state

**Usage:**

```markdown
Terminal Session: term-1

Output:
[new output]
```

**Important:** ALWAYS use this tool instead of terminal_start for follow-up commands within the same task. This ensures efficient use of resources and maintains session state across multiple commands.

#### terminal_stop

Tool for terminating persistent terminal sessions.

**Parameters:**

- `sessionId`: The terminal session ID to terminate (string)

**Behavior:**

1. Terminates the process
2. Removes session from state

**Returns:**

```markdown
Terminal session term-1 terminated.
```

#### terminal_list

Tool for listing all active persistent terminal sessions.

**Parameters:** None

**Returns:**

```markdown
Active Terminal Sessions:
ID           | Command                        | Position | Running | Uptime
-------------|--------------------------------|----------|---------|--------
term-1       | npm run dev                    | 1024     | Yes     | 45s
term-2       | python server.py               | 2048     | Yes     | 120s
```

#### terminal_output

Tool for getting the complete output from a terminal session without truncation.

**Parameters:**

- `sessionId`: The terminal session ID (string)

**Behavior:**

1. Retrieves the complete output from the session
2. Does not use the incremental waiting strategy
3. Returns the full output without truncation

**Usage:**

```markdown
Terminal Session: term-1
Complete Output:
[complete output]
```

**Important:** Use this only if the incremental output from terminal_start or terminal_continue gets confusing.

### Services

The package implements the `TokenRingService` interface and provides:

- `start(signal?: AbortSignal): void` - Service initialization
- `attach(agent: Agent): void` - Agent attachment with state slice initialization
- `registerTerminalProvider(name: string, provider: TerminalProvider): void` - Provider registration
- `requireTerminalProviderByName(name: string): TerminalProvider` - Provider retrieval
- `getAvailableProviders(): string[]` - List available providers

### Provider Documentation

For packages implementing provider architecture, see the [Provider Documentation Pattern](#provider-documentation) section below.

### RPC Endpoints

This package does not define any RPC endpoints.

## Configuration

### Plugin Configuration

```typescript
import {z} from "zod";
import {TerminalConfigSchema} from "@tokenring-ai/terminal";

const packageConfigSchema = z.object({
  terminal: TerminalConfigSchema.optional(),
});

const config = {
  terminal: {
    agentDefaults: {
      provider: 'local',
      bash: {
        cropOutput: 10000,
        timeoutSeconds: 60
      },
      interactive: {
        minInterval: 1,      // Minimum wait before checking output (seconds)
        settleInterval: 2,   // Inactivity time before responding (seconds)
        maxInterval: 30      // Maximum wait time (seconds)
      }
    },
    providers: {
      local: { type: 'local' }
    },
    safeCommands: [
      'awk', 'cat', 'cd', 'chdir', 'diff', 'echo', 'find', 'git', 'grep', 'head', 'help',
      'hostname', 'id', 'ipconfig', 'tee', 'ls', 'netstat', 'ps', 'pwd', 'sort', 'tail',
      'tree', 'type', 'uname', 'uniq', 'wc', 'which', 'touch', 'mkdir', 'npm', 'yarn',
      'bun', 'tsc', 'node', 'npx', 'bunx', 'vitest'
    ],
    dangerousCommands: [
      "(^|\\s)dd\\s",
      "(^|\\s)rm.*-.*r",
      "(^|\\s)chmod.*-.*r",
      "(^|\\s)chown.*-.*r",
      "(^|\\s)rmdir\\s",
      "find.*-(delete|exec)",
      "(^|\\s)sudo\\s",
      "(^|\\s)del\\s",
      "(^|\\s)format\\s",
      "(^|\\s)reboot",
      "(^|\\s)shutdown",
      "git.*reset"
    ]
  }
};
```

**Configuration Schema:**

```typescript
const TerminalConfigSchema = z.object({
  agentDefaults: z.object({
    provider: z.string(),
    bash: z.object({
      cropOutput: z.number().default(10000),
      timeoutSeconds: z.number().default(60),
    }).prefault({}),
    interactive: z.object({
      minInterval: z.number().default(1),
      settleInterval: z.number().default(2),
      maxInterval: z.number().default(30),
    }).prefault({}),
  }),
  providers: z.record(z.string(), z.any()),
  safeCommands: z.array(z.string()).default([...]),
  dangerousCommands: z.array(z.string()).default([...])
}).strict();
```

### Agent Configuration

```typescript
const agentConfig = {
  terminal: {
    provider: 'local', // Optional, defaults to agentDefaults.provider
    bash: {
      cropOutput: 5000, // Optional, defaults to agentDefaults.bash.cropOutput
      timeoutSeconds: 30 // Optional, defaults to agentDefaults.bash.timeoutSeconds
    },
    persistent: {
      minInterval: 1, // Optional, defaults to agentDefaults.interactive.minInterval
      settleInterval: 2, // Optional, defaults to agentDefaults.interactive.settleInterval
      maxInterval: 30 // Optional, defaults to agentDefaults.interactive.maxInterval
    }
  }
};
```

## State Management

### State Slice

The package registers a `TerminalState` state slice for each agent:

```typescript
class TerminalState implements AgentStateSlice {
  readonly name = "TerminalState";
  serializationSchema = serializationSchema;
  
  constructor(readonly initialConfig: z.output<typeof TerminalConfigSchema>["agentDefaults"]);
  
  registerSession(id: string, command: string): void;
  updateSessionPosition(id: string, position: number): void;
  getSession(id: string): SessionRecord | undefined;
  removeSession(id: string): void;
  listSessions(): SessionRecord[];
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `providerName` | `string | null` | Active terminal provider name |
| `bash` | `bash: { cropOutput: number, timeoutSeconds: number }` | Bash execution options |
| `interactiveConfig` | `{ minInterval: number, settleInterval: number, maxInterval: number }` | Output collection intervals |
| `sessions` | `Map<string, SessionRecord>` | Active terminal sessions |

#### State Persistence

- **Persistence**: State is persisted across agent sessions
- **Serialization**: Uses Zod schema for type-safe serialization
- **Deserialization**: Automatic type checking on deserialization
- **Integration**: Registered with agent system via `attach()` method

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

### /terminal Command

The `/terminal` command provides a manual interface for managing terminal sessions and providers.

**Syntax:**

```
/terminal [action] [subaction] [arguments]
```

**Actions:**

#### Session Management

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List all active terminal sessions | `/terminal list` |
| `start <command>` | Start a new terminal session | `/terminal start npm run dev` |
| `send <sessionId> <input>` | Send input to a session | `/terminal send term-1 y` |
| `output <sessionId>` | Get complete output without truncation | `/terminal output term-1` |
| `stop <sessionId>` | Terminate a session | `/terminal stop term-1` |

#### Provider Management

| Command | Description | Example |
|---------|-------------|---------|
| `provider get` | Display current provider | `/terminal provider get` |
| `provider select` | Select provider interactively | `/terminal provider select` |
| `provider set <name>` | Set provider by name | `/terminal provider set local` |
| `provider list` | List all providers | `/terminal provider list` |

**Examples:**

```bash
/terminal list
/terminal start npm run dev
/terminal send term-1 y
/terminal output term-1
/terminal stop term-1
/terminal provider get
/terminal provider select
/terminal provider set local
/terminal provider list
```

## Integration

### Integration with Agent System

The package integrates with the Token Ring agent system by:

1. **State Management**: Registers `TerminalState` as an agent state slice for persistence
2. **Command Registration**: Registers chat commands with `AgentCommandService`
3. **Service Registration**: Implements `TokenRingService` for integration with the app framework

### Integration with Chat Service

The package integrates with the chat service by:

1. **Tool Registration**: Registers tools with `ChatService`
2. **Tool Processing**: Processes tools through agent interface
3. **Error Handling**: Provides clear error messages for tool failures

### Integration with Other Packages

The package integrates with:

- **@tokenring-ai/app**: For service registration and app framework integration
- **@tokenring-ai/agent**: For agent state management and command registration
- **@tokenring-ai/chat**: For chat service integration
- **@tokenring-ai/utility**: For utility functions and providers

## Usage Examples

### Basic Command Execution

```typescript
import TerminalService from '@tokenring-ai/terminal';

const terminal = new TerminalService(config);

const result = await terminal.executeCommand(
  'npm install',
  [],
  { timeoutSeconds: 120 },
  agent
);

console.log(result.output);
```

### Command Safety Check

```typescript
const level = terminal.getCommandSafetyLevel('rm -rf /');
// Returns: 'dangerous'

const unknownLevel = terminal.getCommandSafetyLevel('my_custom_script.sh');
// Returns: 'unknown'

const safeLevel = terminal.getCommandSafetyLevel('ls -la');
// Returns: 'safe'
```

### Compound Command Parsing

```typescript
const commands = terminal.parseCompoundCommand('git add . && git commit -m "test" || echo "failed"');
// Returns: ['git', 'add', '.', 'git', 'commit', '-m', '"test"', 'echo', '"failed"']
```

### Register Terminal Provider

```typescript
class MyTerminalProvider implements TerminalProvider {
  async executeCommand(command, args, options) {
    // Implementation
  }

  async runScript(script, options) {
    // Implementation
  }

  async startInteractiveSession(options) {
    // Implementation
  }

  async sendInput(sessionId, input) {
    // Implementation
  }

  async collectOutput(sessionId, fromPosition, waitOptions) {
    // Implementation
  }

  async terminateSession(sessionId) {
    // Implementation
  }

  getSessionStatus(sessionId) {
    // Implementation
  }

  getIsolationLevel() {
    return 'none';
  }
}

terminal.registerTerminalProvider('my-provider', new MyTerminalProvider());
terminal.setActiveTerminal('my-provider', agent);
```

### Using the terminal_bash Tool

When using the agent interface:

```typescript
// Agent will automatically use terminal_bash tool
const result = await agent.execute({
  tool: 'terminal_bash',
  arguments: {
    command: 'ls -la'
  }
});

console.log(result.output);
```

### Using Persistent Terminal Sessions

```typescript
// Start a development server
const startResult = await agent.execute({
  tool: 'terminal_start',
  arguments: {
    command: 'npm run dev'
  }
});
// Returns: { id: 'term-1', output: 'Server starting...', position: 100 }

// Send input to the session
const continueResult = await agent.execute({
  tool: 'terminal_continue',
  arguments: {
    sessionId: 'term-1',
    stdin: 'y\n'
  }
});
// Returns: { output: 'Server started on port 3000', position: 250, complete: false }

// List active sessions
const listResult = await agent.execute({
  tool: 'terminal_list',
  arguments: {}
});

// Stop the session
await agent.execute({
  tool: 'terminal_stop',
  arguments: { sessionId: 'term-1' }
});
```

### Interactive Shell Example

```typescript
// Start a Python REPL
const { id } = await agent.execute({
  tool: 'terminal_start',
  arguments: { command: 'python3' }
});

// Execute Python code
await agent.execute({
  tool: 'terminal_continue',
  arguments: {
    sessionId: id,
    stdin: 'print("Hello from Python")\n'
  }
});

// Execute more code
await agent.execute({
  tool: 'terminal_continue',
  arguments: {
    sessionId: id,
    stdin: 'x = 42\nprint(x * 2)\n'
  }
});

// Exit the REPL
await agent.execute({
  tool: 'terminal_stop',
  arguments: { sessionId: id }
});
```

## Best Practices

1. **Use persistent sessions efficiently**: Always use `terminal_continue` for follow-up commands within the same task
2. **Validate command safety**: Use `getCommandSafetyLevel()` before executing commands in custom implementations
3. **Set appropriate timeouts**: Configure timeouts based on expected command execution time
4. **Use output truncation**: Prevent excessively long outputs by setting crop limits
5. **Register providers early**: Register terminal providers before attaching agents
6. **Handle errors gracefully**: Always check result status and handle errors appropriately
7. **Configure output collection intervals**: Adjust minInterval, settleInterval, and maxInterval based on your use case
8. **Use session cleanup**: Call `terminal_stop` to terminate sessions when no longer needed

## Testing

The package includes comprehensive unit and integration tests:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Test Coverage

The test suite includes:

- **Command validation**: Tests for safe/unknown/dangerous command detection
- **Compound command parsing**: Tests for parsing &&, ||, ;, | separators
- **Edge cases**: Tests for empty commands, special characters, and boundary conditions
- **Security scenarios**: Tests for preventing dangerous command patterns
- **Performance tests**: Tests for memory efficiency and large command handling

Example test:

```typescript
// Test for command safety validation
expect(terminalService.getCommandSafetyLevel('rm -rf /')).toBe('dangerous');
expect(terminalService.getCommandSafetyLevel('npm install')).toBe('safe');
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent orchestration system
- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `@vitest/coverage-v8` (^4.0.18) - Test coverage
- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## License

MIT License - see LICENSE file for details.

## Provider Documentation

### Provider Interface

The `TerminalProvider` interface defines the contract for terminal backend implementations:

```typescript
interface TerminalProvider {
  executeCommand(
    command: string,
    args: string[],
    options: ExecuteCommandOptions,
  ): Promise<ExecuteCommandResult>;

  runScript(
    script: string,
    options: ExecuteCommandOptions,
  ): Promise<ExecuteCommandResult>;

  startInteractiveSession(options: ExecuteCommandOptions): Promise<string>;

  sendInput(sessionId: string, input: string): Promise<void>;

  collectOutput(
    sessionId: string,
    fromPosition: number,
    waitOptions: OutputWaitOptions
  ): Promise<InteractiveTerminalOutput>;

  terminateSession(sessionId: string): Promise<void>;

  getSessionStatus(sessionId: string): SessionStatus | null;

  getIsolationLevel(): TerminalIsolationLevel;
}
```

#### Provider Methods

| Method | Description |
|--------|-------------|
| `executeCommand` | Execute a shell command |
| `runScript` | Execute a shell script |
| `startInteractiveSession` | Start a new interactive session |
| `sendInput` | Send input to a running session |
| `collectOutput` | Collect output from a session |
| `terminateSession` | Terminate a session |
| `getSessionStatus` | Get session status |
| `getIsolationLevel` | Get isolation level |

### Provider Registration

#### Plugin Registration

```typescript
// In plugin.ts
app.addServices(new TerminalService(config.terminal));
app.waitForService(ChatService, chatService => {
  chatService.addTools(tools);
});
app.waitForService(AgentCommandService, agentCommandService => {
  agentCommandService.addAgentCommands(commands);
});
```

#### Programmatic Registration

```typescript
const terminal = app.requireService(TerminalService);
terminal.registerTerminalProvider('local', new LocalTerminalProvider());
terminal.setActiveTerminal('local', agent);
```

### Provider Implementation Example

```typescript
class LocalTerminalProvider implements TerminalProvider {
  getIsolationLevel(): TerminalIsolationLevel {
    return 'none';
  }

  async executeCommand(
    command: string,
    args: string[],
    options: ExecuteCommandOptions
  ): Promise<ExecuteCommandResult> {
    // Implementation
  }

  async runScript(
    script: string,
    options: ExecuteCommandOptions
  ): Promise<ExecuteCommandResult> {
    // Implementation
  }

  async startInteractiveSession(
    options: ExecuteCommandOptions
  ): Promise<string> {
    // Implementation
  }

  async sendInput(sessionId: string, input: string): Promise<void> {
    // Implementation
  }

  async collectOutput(
    sessionId: string,
    fromPosition: number,
    waitOptions: OutputWaitOptions
  ): Promise<InteractiveTerminalOutput> {
    // Implementation
  }

  async terminateSession(sessionId: string): Promise<void> {
    // Implementation
  }

  getSessionStatus(sessionId: string): SessionStatus | null {
    // Implementation
  }
}
```

## Integration Documentation

### Integration with Agent System

The package integrates with the Token Ring agent system by:

1. **State Management**: Registers `TerminalState` as an agent state slice for persistence
2. **Command Registration**: Registers chat commands with `AgentCommandService`
3. **Service Registration**: Implements `TokenRingService` for integration with the app framework

### Integration with Chat Service

The package integrates with the chat service by:

1. **Tool Registration**: Registers tools with `ChatService`
2. **Tool Processing**: Processes tools through agent interface
3. **Error Handling**: Provides clear error messages for tool failures

### Integration with Other Packages

The package integrates with:

- **@tokenring-ai/app**: For service registration and app framework integration
- **@tokenring-ai/agent**: For agent state management and command registration
- **@tokenring-ai/chat**: For chat service integration
- **@tokenring-ai/utility**: For utility functions and providers

## Error Handling

The package provides comprehensive error handling:

- **Provider not found**: Returns helpful error message for unknown types
- **Invalid spec**: Validates provider arguments before definition
- **Session not found**: Clear error when referencing non-existent sessions
- **Processing errors**: Individual session errors don't affect other sessions
- **State errors**: Proper serialization/deserialization with type checking

## Performance Considerations

- **Streaming processing**: Output is collected incrementally to minimize memory usage
- **State checkpoints**: Maintains state between iterations for consistency
- **Error isolation**: Errors in one session don't affect others
- **Provider efficiency**: Providers should implement efficient data access patterns

## Related Components

- **@tokenring-ai/agent**: Agent system that manages state and services
- **@tokenring-ai/chat**: Chat service that provides tools
- **@tokenring-ai/app**: Base application framework and plugin system
- **@tokenring-ai/utility**: Shared utilities and registry system
