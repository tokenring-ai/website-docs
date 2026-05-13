# @tokenring-ai/acp

## User Guide

### Overview

The `@tokenring-ai/acp` package provides Agent Client Protocol (ACP) integration for TokenRing agents. It implements the
Agent Client Protocol specification, enabling TokenRing agents to communicate with ACP-compatible clients through a
stdio-based transport mechanism.

This package serves as a bridge between TokenRing's agent ecosystem and the broader Agent Client Protocol ecosystem,
allowing external ACP clients to create sessions, execute commands, manage files, and interact with AI agents in a
standardized way.

### Key Features

- **ACP Protocol Implementation**: Full implementation of the Agent Client Protocol specification
- **Session Management**: Create, list, and manage multiple agent sessions with working directory support
- **File System Integration**: ACP-compatible file system provider for file operations (read, write, append)
- **Terminal Integration**: ACP-compatible terminal provider for command execution
- **Event Streaming**: Real-time forwarding of agent events (chat, reasoning, warnings, errors, artifacts)
- **Permission Handling**: Integration with ACP client for tool approval requests
- **State Management**: Seamless integration with TokenRing agent state persistence
- **Working Directory Support**: Session-specific working directories with path validation and sandboxing

### Installation

```bash
bun add @tokenring-ai/acp
```

### Dependencies

| Package                    | Version | Description                |
|----------------------------|---------|----------------------------|
| `@agentclientprotocol/sdk` | ^0.18.0 | Agent Client Protocol SDK  |
| `@tokenring-ai/agent`      | 0.2.0   | Agent orchestration        |
| `@tokenring-ai/app`        | 0.2.0   | Base application framework |
| `@tokenring-ai/filesystem` | 0.2.0   | File system service        |
| `@tokenring-ai/terminal`   | 0.2.0   | Terminal service           |
| `zod`                      | ^4.3.6  | Schema validation          |

### Chat Commands

The ACP package does not define chat commands directly. Commands are handled through the ACP protocol's prompt
mechanism.

### Tools

The ACP package does not define tools directly. Tool execution is handled through the ACP protocol's terminal and file
system capabilities.

### Configuration

#### ACP Configuration Schema

```typescript
import { ACPConfigSchema } from '@tokenring-ai/acp';

// Schema definition
export const ACPConfigSchema = z.object({
  transport: z.literal('stdio').default('stdio'),
  defaultAgentType: z.string().exactOptional(),
});

const config = ACPConfigSchema.parse({
  transport: 'stdio',
  defaultAgentType: 'coder'
});
```

**Configuration Options**:

| Property           | Type      | Required | Default     | Description                                          |
|--------------------|-----------|----------|-------------|------------------------------------------------------|
| `transport`        | `"stdio"` | No       | `"stdio"`   | Transport mechanism (currently only stdio supported) |
| `defaultAgentType` | `string`  | No       | `undefined` | Default agent type to use for sessions               |

#### Plugin Configuration

When installing the plugin, provide ACP configuration:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import acpPlugin from '@tokenring-ai/acp/plugin';

const app = new TokenRingApp();

await app.install(acpPlugin, {
  acp: {
    defaultAgentType: 'coder'
  }
});

await app.start();
```

#### YAML Configuration

Configure the ACP plugin in your TokenRing configuration file:

```yaml
plugins:
  acp:
    transport: stdio
    defaultAgentType: coder
```

Or with minimal configuration (uses defaults):

```yaml
plugins:
  acp: { }
```

### Integration

#### With AgentSystem

The ACP service integrates with the TokenRing agent system through the `AgentManager`:

```typescript
const agentManager = app.getService(AgentManager);

// ACP service uses AgentManager to spawn agents for each session
const session = await acpService.createSession({ cwd: '/path/to/project' });

// Each session gets its own agent instance with decorated ACP handlers
const agent = session.agent;
```

**Agent Decoration**:

The ACP service decorates each spawned agent with ACP-specific handlers:

- `askForApproval`: Routes approval requests through ACP client permission system
- `askForText`: Throws error (not supported in ACP mode)
- `askQuestion`: Throws error (not supported in ACP mode)

#### With FileSystemService

The ACP service registers an `ACPFileSystemProvider` with the FileSystemService when the ACP client supports file
capabilities:

```typescript
// ACPFileSystemProvider is registered automatically when client capabilities are detected
// File operations are routed through ACP if client supports readTextFile/writeTextFile
// Falls back to other providers if ACP client doesn't support the capability

const fileSystemService = app.getService(FileSystemService);

// Read file (routed through ACP if client supports readTextFile)
const content = await fileSystemService.readTextFile('./src/index.ts', agent);

// Write file (routed through ACP if client supports writeTextFile)
await fileSystemService.writeFile('./src/output.txt', 'Hello World', agent);

// Append file (routed through ACP if client supports both read and write)
await fileSystemService.appendFile('./src/output.txt', '\nMore content', agent);
```

**Path Resolution**:

- All file paths are resolved relative to the session's working directory
- Paths outside the working directory are rejected with an error
- Absolute paths are normalized and validated

#### With TerminalService

The ACP service registers an `ACPTerminalProvider` with the TerminalService when the ACP client supports terminal
capabilities:

```typescript
const terminalService = app.getService(TerminalService);

// Execute command (routed through ACP)
const result = await terminalService.executeCommand('ls', ['-la'], {
  timeoutSeconds: 30,
  workingDirectory: '/path/to/project'
}, agent);
```

**Terminal Provider Configuration**:

- `isInteractive`: `false` (non-interactive terminal provider)
- `supportedIsolationLevels`: `["none"]`
- Timeout: 120 seconds default

#### With AgentEventState

The ACP service integrates with agent event state for streaming responses:

```typescript
// Event types forwarded to ACP client
-'output.chat'
:
Chat
messages -> agent_message_chunk
  - 'output.reasoning'
:
Reasoning / thought
content -> agent_thought_chunk
  - 'output.info'
:
Informational
messages -> agent_thought_chunk
  - 'output.warning'
:
Warnings -> agent_thought_chunk
with [warning] prefix
- 'output.error'
:
Errors -> agent_thought_chunk
with [error] prefix
- 'output.artifact'
:
File
attachments / artifacts
->
resource
content
blocks
```

### Usage Examples: Plugin Registration

Register the ACP service in your TokenRing application:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import acpPlugin from '@tokenring-ai/acp/plugin';

const app = new TokenRingApp();

await app.install(acpPlugin, {
  acp: {
    defaultAgentType: 'coder'
  }
});

await app.start();
```

#### Programmatic Service Registration

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { ACPService, ACPConfigSchema } from '@tokenring-ai/acp';

const app = new TokenRingApp();
const config = ACPConfigSchema.parse({
  defaultAgentType: 'coder'
});

app.addServices(new ACPService(app, config));
await app.start();

// ACP connection runs via stdio
const signal = AbortSignal.timeout(30000);
await app.run(signal);
```

#### Session Management

```typescript
// Create a session
const sessionResponse = await acpConnection.newSession({
  cwd: '/path/to/project'
});
const sessionId = sessionResponse.sessionId;

// List sessions
const listResponse = await acpConnection.listSessions({
  cwd: '/path/to/project' // optional filter
});

// Send a prompt
const promptResponse = await acpConnection.prompt({
  sessionId,
  message: [
    {
      type: 'text',
      text: 'Analyze this codebase'
    }
  ]
});
```

#### File Operations (ACP Client Integration)

When the ACP client supports file operations, the ACPFileSystemProvider routes file operations through the ACP
connection:

```typescript
// File operations are routed through ACP if client supports the capability
const fileSystemService = app.getService(FileSystemService);

// Read file (routed through ACP if client supports readTextFile)
const content = await fileSystemService.readTextFile('./src/index.ts', agent);

// Write file (routed through ACP if client supports writeTextFile)
await fileSystemService.writeFile('./src/output.txt', 'Hello World', agent);

// Append file (routed through ACP if client supports both read and write)
await fileSystemService.appendFile('./src/output.txt', '\nMore content', agent);
```

#### Terminal Operations (ACP Client Integration)

When the ACP client supports terminal operations, the ACPTerminalProvider routes terminal operations through the ACP
connection:

```typescript
const terminalService = app.getService(TerminalService);

// Execute command (routed through ACP)
const result = await terminalService.executeCommand('ls', ['-la'], {
  timeoutSeconds: 30,
  workingDirectory: '/path/to/project'
}, agent);
```

### Best Practices

1. **Working Directory**: Always use absolute paths for session working directories
2. **Path Validation**: File operations are automatically sandboxed to the working directory
3. **Session Lifecycle**: Properly manage session creation and cleanup to avoid resource leaks
4. **Capability Detection**: Check client capabilities before relying on file/terminal operations
5. **Error Handling**: Implement proper error handling for ACP protocol operations
6. **Timeout Management**: Use appropriate timeouts for long-running terminal operations
7. **State Management**: Leverage agent state slices for persistent session data

## Developer Reference

### Core Components

### ACPService

The main service implementing the Agent Client Protocol for TokenRing.

**Location**: `ACPService.ts`

**Implements**: `TokenRingService`

**Service Name**: `ACPService`

**Description**: ACP (Agent Client Protocol) server for TokenRing agents

**Key Methods**:

#### `initialize(params: InitializeRequest): InitializeResponse`

Initializes the ACP connection and returns protocol capabilities.

**Parameters**:

- `params`: `InitializeRequest` - ACP initialization request containing client capabilities

**Returns**: `InitializeResponse` - Protocol version and agent capabilities

**Agent Capabilities**:

- `loadSession`: Disabled
- `promptCapabilities`:
 - `embeddedContext`: Enabled
 - `image`: Enabled
 - `audio`: Enabled
- `sessionCapabilities`: List sessions supported

#### `createSession(params: NewSessionRequest): Promise<NewSessionResponse>`

Creates a new ACP session with a TokenRing agent.

**Parameters**:

- `params`: `NewSessionRequest` - Session creation request with working directory

**Returns**: `NewSessionResponse` - Created session ID

**Behavior**:

- Validates that the working directory is an absolute path
- Spawns a new TokenRing agent using the configured or default agent type
- Decorates the agent with ACP-specific handlers for approvals and prompts
- Registers the session in internal session maps

**Example**:

```typescript
const response = await acpService.createSession({
  cwd: '/path/to/working/directory'
});
// response.sessionId => 'uuid-string'
```

#### `listSessions(params: ListSessionsRequest): ListSessionsResponse`

Lists all active sessions, optionally filtered by working directory.

**Parameters**:

- `params`: `ListSessionsRequest` - Optional working directory filter

**Returns**: `ListSessionsResponse` - Array of session info with sessionId, cwd, title, and updatedAt

#### `prompt(connection: AgentSideConnection, params: PromptRequest): Promise<PromptResponse>`

Handles ACP prompt requests, streaming agent responses back to the client.

**Parameters**:

- `connection`: `AgentSideConnection` - ACP connection instance
- `params`: `PromptRequest` - Prompt request with message and attachments

**Returns**: `PromptResponse` - Response with stop reason and message ID

**Behavior**:

- Converts ACP prompt content blocks to agent input format
- Handles text, image, audio, and resource attachments
- Streams agent events back to the client in real-time
- Supports cancellation via the `cancel` method

**Event Forwarding**:

- `output.chat`: Forwarded as `agent_message_chunk`
- `output.reasoning`: Forwarded as `agent_thought_chunk`
- `output.info`: Forwarded as `agent_thought_chunk`
- `output.warning`: Forwarded as `agent_thought_chunk` with `[warning]` prefix
- `output.error`: Forwarded as `agent_thought_chunk` with `[error]` prefix
- `output.artifact`: Forwarded as `resource` content blocks

#### `cancel(params: CancelNotification): void`

Cancels an active prompt in a session.

**Parameters**:

- `params`: `CancelNotification` - Cancellation notification with session ID

**Behavior**: Calls `agent.abortCurrentOperation()` on the session's agent

### TokenRingACPAgent

Internal agent implementation that delegates to ACPService.

**Location**: `ACPService.ts` (inner class)

**Implements**: `Agent` (from @agentclientprotocol/sdk)

**Methods**:

- `initialize`: Delegates to ACPService.initialize()
- `authenticate`: No authentication required (returns empty response)
- `newSession`: Delegates to ACPService.createSession()
- `listSessions`: Delegates to ACPService.listSessions()
- `prompt`: Delegates to ACPService.prompt()
- `cancel`: Delegates to ACPService.cancel()

### Services

#### ACPService (TokenRingService)

**Features**:

- stdio-based transport mechanism
- Session lifecycle management
- File system provider registration
- Terminal provider registration
- Event streaming and forwarding
- Permission request handling

### Provider Documentation

#### ACPFileSystemProvider

File system provider that routes file operations through the ACP connection.

**Location**: `ACPFileSystemProvider.ts`

**Implements**: `FileSystemProvider`

**Supported Operations**:

- `readFile`: Reads file content through ACP client
- `writeFile`: Writes file content through ACP client
- `appendFile`: Appends content to file through ACP client
- `exists`: Checks if file exists through ACP client
- `stat`: Gets file statistics through ACP client

**Unsupported Operations**:

- `deleteFile`: Not supported in ACP mode
- `rename`: Not supported in ACP mode
- `createDirectory`: Not supported in ACP mode
- `copy`: Not supported in ACP mode
- `getDirectoryTree`: Not supported in ACP mode

#### ACPTerminalProvider

Terminal provider that routes terminal operations through the ACP connection.

**Location**: `ACPTerminalProvider.ts`

**Implements**: `NonInteractiveTerminalProvider`

**Supported Operations**:

- `executeCommand`: Executes commands through ACP client terminal
- `runScript`: Runs shell scripts through ACP client terminal

**Configuration**:

- `isInteractive`: `false` (non-interactive terminal provider)
- `supportedIsolationLevels`: `["none"]`

### RPC Endpoints

The ACP service implements the following ACP protocol endpoints through the AgentSideConnection:

| Endpoint         | Request                 | Response                 | Description                                        |
|------------------|-------------------------|--------------------------|----------------------------------------------------|
| `initialize`     | `InitializeRequest`     | `InitializeResponse`     | Initialize ACP connection with client capabilities |
| `authenticate`   | `AuthenticateRequest`   | `AuthenticateResponse`   | Authentication (currently no-op)                   |
| `newSession`     | `NewSessionRequest`     | `NewSessionResponse`     | Create new agent session                           |
| `listSessions`   | `ListSessionsRequest`   | `ListSessionsResponse`   | List active sessions                               |
| `prompt`         | `PromptRequest`         | `PromptResponse`         | Send prompt and stream response                    |
| `cancel`         | `CancelNotification`    | `void`                   | Cancel active prompt                               |
| `readTextFile`   | `ReadTextFileRequest`   | `ReadTextFileResponse`   | Read file through ACP client                       |
| `writeTextFile`  | `WriteTextFileRequest`  | `WriteTextFileResponse`  | Write file through ACP client                      |
| `createTerminal` | `CreateTerminalRequest` | `CreateTerminalResponse` | Create terminal through ACP client                 |

### Developer Usage Examples

#### Session State Management

```typescript
type ACPSession = {
  sessionId: string;           // Unique session identifier
  cwd: string;                 // Working directory
  agent: TokenRingAgent;       // Agent instance for this session
  activePrompt: ACPPromptState | null; // Current active prompt state
  updatedAt: string;           // Last update timestamp
  fileSystemProviderName?: string;     // Registered file system provider name
  terminalProvider?: ACPTerminalProvider; // Terminal provider instance
  terminalProviderName?: string;         // Registered terminal provider name
};
```

#### File System Provider Implementation

```typescript
// ACPFileSystemProvider implementation details
class ACPFileSystemProvider implements FileSystemProvider {
  readonly name = "ACPFileSystemProvider";
  readonly displayName: string;

  async readFile(absolutePath: string): Promise<Buffer | null> {
    if (!this.capabilities.fs?.readTextFile) {
      return null;
    }
    try {
      const response = await this.connection.readTextFile({
        sessionId: this.sessionId,
        path: absolutePath,
      });
      return Buffer.from(response.content, "utf-8");
    } catch {
      return null;
    }
  }

  async writeFile(absolutePath: string, content: string | Buffer): Promise<boolean> {
    const textContent = toTextContent(content);
    await this.connection.writeTextFile({
      sessionId: this.sessionId,
      path: absolutePath,
      content: textContent,
    });
    return true;
  }
}
```

#### Terminal Provider Implementation

```typescript
// ACPTerminalProvider implementation details
class ACPTerminalProvider implements NonInteractiveTerminalProvider {
  readonly isInteractive = false;
  readonly name = "ACPTerminalProvider";
  readonly supportedIsolationLevels: TerminalIsolationLevel[] = ["none"];

  async executeCommand(command: string, args: string[], options: ExecuteCommandOptions): Promise<ExecuteCommandResult> {
    const handle = await this.connection.createTerminal({
      sessionId: this.sessionId,
      command,
      ...(args.length > 0 && { args }),
      cwd: options.workingDirectory,
    });

    try {
      const timeoutSeconds = options.timeoutSeconds ?? 120;
      const exitResult = await Promise.race([
        handle.waitForExit().then(result => ({ type: "exit", result })),
        delay(timeoutSeconds * 1000).then(() => ({ type: "timeout" })),
      ]);

      if (exitResult.type === "timeout") {
        await handle.kill().catch(() => undefined);
        return { status: "timeout" };
      }

      const output = await handle.currentOutput();
      const formattedOutput = output.truncated ? `${output.output}\n[...Terminal output truncated by ACP client...]\n` : output.output;
      const exitCode = exitResult.result.exitCode ?? output.exitStatus?.exitCode ?? 1;

      if (exitCode === 0 && !exitResult.result.signal) {
        return { status: "success", output: formattedOutput, exitCode: 0 };
      }

      return { status: "badExitCode", output: formattedOutput, exitCode };
    } catch (error: unknown) {
      return { status: "unknownError", error: (error as Error).message };
    } finally {
      await handle.release().catch(() => undefined);
    }
  }
}
```

### Testing

#### Running Tests

```bash
cd pkg/acp
bun test
```

#### Watch Mode

```bash
bun test:watch
```

#### Coverage

```bash
bun test:coverage
```

#### Build

```bash
bun build
```

### Package Dependencies

| Package                    | Version | Description                |
|----------------------------|---------|----------------------------|
| `@agentclientprotocol/sdk` | ^0.18.0 | Agent Client Protocol SDK  |
| `@tokenring-ai/agent`      | 0.2.0   | Agent orchestration        |
| `@tokenring-ai/app`        | 0.2.0   | Base application framework |
| `@tokenring-ai/filesystem` | 0.2.0   | File system service        |
| `@tokenring-ai/terminal`   | 0.2.0   | Terminal service           |
| `zod`                      | ^4.3.6  | Schema validation          |

### Related Components

- `@tokenring-ai/agent`: Agent orchestration and management
- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/filesystem`: File system service
- `@tokenring-ai/terminal`: Terminal service
- `@agentclientprotocol/sdk`: Agent Client Protocol SDK

### Development Notes

#### Session Providers

The ACP service registers file system and terminal providers with the respective TokenRing services when the ACP client
advertises the corresponding capabilities:

- `ACPFileSystemProvider`: Registered with `FileSystemService` when client supports `fs.readTextFile` or
  `fs.writeTextFile`
- `ACPTerminalProvider`: Registered with `TerminalService` when client supports `terminal`

#### Event Forwarding

Agent events are forwarded to the ACP client in real-time:

- Chat messages → `agent_message_chunk`
- Reasoning/thoughts → `agent_thought_chunk`
- Artifacts → `resource` content blocks

#### Permission Handling

Tool approvals are handled through the ACP client's permission system:

- `askForApproval`: Prompts client for tool approval
- `askForText`: Not supported in ACP mode
- `askQuestion`: Not supported in ACP mode

#### Session Cleanup

Sessions are cleaned up when:

- The ACP connection is closed
- The service is stopped
- The application is shut down

All terminal handles are released and agents are deleted during cleanup.

## License

MIT License - see LICENSE file for details.
