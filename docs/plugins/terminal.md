# Terminal Package

## Overview

The Terminal package provides a unified interface for executing shell commands with safety validation and provider-based architecture. It enables agents to execute shell commands safely with configurable timeouts, output truncation, and command safety validation.

## Key Features

- Shell command execution with timeout support (default 120 seconds)
- Command safety validation (safe, unknown, dangerous categories)
- Compound command parsing (&&, ||, ;, |)
- Configurable output truncation
- Multi-provider architecture for different terminal backends
- State management for agent-specific terminal configuration
- Tool-based interface with safety confirmation prompts

## Core Properties

### TerminalService

The main service class that manages terminal operations and command execution.

**Properties:**

- `name: string` - Service name
- `description: string` - Service description
- `defaultProvider: TerminalProvider` - Default terminal provider instance
- `terminalProviderRegistry: KeyedRegistry<TerminalProvider>` - Registry for terminal providers

### TerminalProvider

Interface for terminal provider implementations.

**Properties:**

- `executeCommand(command: string, args: string[], options: ExecuteCommandOptions): Promise<ExecuteCommandResult>`
- `runScript(script: string, options: ExecuteCommandOptions): Promise<ExecuteCommandResult>`

### TerminalState

Agent state slice for terminal-specific configuration.

**Properties:**

- `providerName: string | null` - Active terminal provider name
- `bash: { cropOutput: number, timeoutSeconds: number }` - Bash execution options

## Core Methods/API

### TerminalService Methods

#### `run(): void`

Lifecycle method called by the application to initialize the service.

```typescript
terminal.run();
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
    return {
      ok: true,
      output: '',
      exitCode: 0,
      stdout: '',
      stderr: ''
    };
  }

  async runScript(script, options) {
    // Implementation
    return {
      ok: true,
      output: '',
      exitCode: 0,
      stdout: '',
      stderr: ''
    };
  }
}

terminal.registerTerminalProvider('my-provider', new MyTerminalProvider());
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

### TerminalState Methods

#### `reset(what: ResetWhat[]): void`

Reset state (does not reset on chat reset).

```typescript
terminalState.reset(['all']);
```

**Parameters:**

- `what`: Array of reset targets

#### `serialize(): z.output<typeof serializationSchema>`

Serialize state.

```typescript
const data = terminalState.serialize();
```

**Returns:** Serialized state data

#### `deserialize(data: z.output<typeof serializationSchema>): void`

Deserialize state.

```typescript
terminalState.deserialize(data);
```

**Parameters:**

- `data`: Serialized state data

#### `show(): string[]`

Display state information.

```typescript
const info = terminalState.show();
console.log(info);
// Output:
// Provider: local
// Output Crop Limit: 10000 chars
```

**Returns:** Array of state information strings

### Tool: bash

Tool for executing shell commands through the agent interface.

**Parameters:**

- `command`: The shell command to execute (string)

**Behavior:**

1. Validates command is present
2. Checks command safety level
3. If unknown, prompts user for confirmation
4. If dangerous, prompts user for confirmation
5. Executes command with configured timeout
6. Truncates output if exceeds crop limit
7. Returns formatted result with exit code and output

**Safety Confirmation:**

- Unknown commands: Requires user confirmation with 10-second timeout
- Dangerous commands: Requires user confirmation without timeout

**Example:**

```typescript
// Agent will automatically use bash tool
const result = await agent.execute({
  tool: 'bash',
  arguments: {
    command: 'ls -la'
  }
});

console.log(result.output);
```

## Configuration

### Plugin Configuration

```typescript
const config = {
  terminal: {
    agentDefaults: {
      provider: 'local',
      bash: {
        cropOutput: 10000,
        timeoutSeconds: 60
      }
    },
    providers: {
      local: { type: 'local' }
    },
    safeCommands: [
      'awk', 'cat', 'cd', 'chdir', 'diff', 'echo', 'find', 'git', 'grep',
      'head', 'help', 'hostname', 'id', 'ipconfig', 'tee', 'ls', 'netstat',
      'ps', 'pwd', 'sort', 'tail', 'tree', 'type', 'uname', 'uniq', 'wc',
      'which', 'touch', 'mkdir', 'npm', 'yarn', 'bun', 'tsc', 'node',
      'npx', 'bunx', 'vitest'
    ],
    dangerousCommands: [
      '(^|\\s)dd\\s',
      '(^|\\s)rm.*-.*r',
      '(^|\\s)chmod.*-.*r',
      '(^|\\s)chown.*-.*r',
      '(^|\\s)rmdir\\s',
      'find.*-(delete|exec)',
      '(^|\\s)sudo\\s',
      '(^|\\s)del\\s',
      '(^|\\s)format\\s',
      '(^|\\s)reboot',
      '(^|\\s)shutdown',
      'git.*reset'
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
    }).default({}),
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
    }
  }
};
```

## Integration

### Plugin Integration

The terminal package integrates with the Token Ring plugin system:

```typescript
import TokenRingPlugin from '@tokenring-ai/app';
import ChatService from '@tokenring-ai/chat';
import TerminalService from './TerminalService.js';
import tools from './tools.js';

const plugin = {
  name: '@tokenring-ai/terminal',
  version: '0.2.0',
  description: 'Terminal and shell command execution service',
  install(app, config) {
    if (config.terminal) {
      app.addServices(new TerminalService(config.terminal));
      app.waitForService(ChatService, chatService => {
        chatService.addTools(tools);
      });
    }
  },
  config: packageConfigSchema
};

export default plugin;
```

### Registering Custom Providers

You can register custom terminal providers to support different backends:

```typescript
class RemoteTerminalProvider implements TerminalProvider {
  async executeCommand(command, args, options) {
    // Implementation for remote execution
    const response = await fetch('/api/command', {
      method: 'POST',
      body: JSON.stringify({ command, args, options })
    });
    return response.json();
  }

  async runScript(script, options) {
    // Implementation for running scripts
    const response = await fetch('/api/script', {
      method: 'POST',
      body: JSON.stringify({ script, options })
    });
    return response.json();
  }
}

// Register the provider
terminal.registerTerminalProvider('remote', new RemoteTerminalProvider());
terminal.setActiveTerminal('remote', agent);
```

### Using with Agent

Agents can use the terminal service through tools:

```typescript
// The agent automatically has access to the bash tool
const result = await agent.execute({
  tool: 'bash',
  arguments: {
    command: 'npm install'
  }
});
```

## Best Practices

1. **Always validate command safety**: Use `getCommandSafetyLevel()` before executing commands in custom implementations
2. **Set appropriate timeouts**: Configure timeouts based on expected command execution time
3. **Use output truncation**: Prevent excessively long outputs by setting crop limits
4. **Register providers early**: Register terminal providers before attaching agents
5. **Handle errors gracefully**: Always check `result.ok` and handle errors appropriately
6. **Use compound commands carefully**: Be aware that commands are parsed by command name only

## Testing

```bash
bun test
bun test:watch
bun test:coverage
```

## Related Components

- **@tokenring-ai/agent**: Agent system that manages state and services
- **@tokenring-ai/chat**: Chat service that provides tools
- **@tokenring-ai/app**: Base application framework and plugin system
- **@tokenring-ai/utility**: Shared utilities and registry system
