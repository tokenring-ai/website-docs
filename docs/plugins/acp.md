---
sidebar_position: 1
---

# Agent Client Protocol (ACP)

## User Guide

### Overview

The `@tokenring-ai/acp` package provides Agent Client Protocol (ACP) integration for TokenRing agents. It implements the Agent Client Protocol specification, enabling TokenRing agents to communicate with ACP-compatible clients through a stdio-based transport mechanism.

This package serves as a bridge between TokenRing's agent ecosystem and the broader Agent Client Protocol ecosystem, allowing external ACP clients to create sessions, execute commands, manage files, and interact with AI agents in a standardized way.

### Key Features

- **ACP Protocol Implementation**: Full implementation of the Agent Client Protocol specification
- **Session Management**: Create, list, and manage multiple agent sessions with working directory support
- **File System Integration**: ACP-compatible file system provider for file operations (read, write, append)
- **Terminal Integration**: ACP-compatible terminal provider for command execution
- **Event Streaming**: Real-time forwarding of agent events (chat, reasoning, warnings, errors, artifacts)
- **Permission Handling**: Integration with ACP client for tool approval requests
- **State Management**: Seamless integration with TokenRing agent state persistence
- **Working Directory Support**: Session-specific working directories with path validation

### Chat Commands

This package does not define chat commands. Interactions are handled through the ACP protocol's prompt mechanism.

### Tools

This package does not define tools. Tool execution is handled through the ACP protocol.

### Configuration

The package accepts an optional configuration object under the `acp` key:

```yaml
acp:
  transport: "stdio"  # Currently only stdio is supported
  defaultAgentType: "coder"  # Optional: default agent type for ACP sessions
```

#### Configuration Schema

The ACP package uses the following configuration schema defined in `schema.ts`:

```typescript
import { z } from "zod";

export const ACPConfigSchema = z.object({
  transport: z.literal("stdio").default("stdio"),
  defaultAgentType: z.string().exactOptional(),
});

export type ACPConfig = z.output<typeof ACPConfigSchema>;
```

#### Configuration Options

| Property           | Type      | Required | Default     | Description                                        |
|--------------------|-----------|----------|-------------|----------------------------------------------------|
| `transport`        | `"stdio"` | No       | `"stdio"`   | Transport mechanism (currently only stdio support) |
| `defaultAgentType` | `string`  | No       | `undefined` | Default agent type to use for sessions             |

#### Plugin Configuration

Configure the ACP service through the plugin:

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
  acp: {}
```

### Integration

#### With AgentManager

The ACP service integrates with the TokenRing agent system through the `AgentManager`:

```typescript
const agentManager = app.getService(AgentManager);

// ACP service uses AgentManager to spawn agents for each session
const session = await acpService.createSession({ cwd: '/path/to/project' });

// Each session gets its own agent instance with decorated ACP handlers
const agent = session.agent;
```

#### With FileSystemService

The ACP service registers an `ACPFileSystemProvider` with the FileSystemService when the ACP client supports file capabilities:

```typescript
// ACPFileSystemProvider is registered automatically when client capabilities are detected
// File operations are routed through ACP if client supports readTextFile/writeTextFile
// Falls back to other providers if ACP client doesn't support the capability
```

#### With TerminalService

The ACP service registers an `ACPTerminalProvider` with the TerminalService when the ACP client supports terminal capabilities:

```typescript
// ACPTerminalProvider is registered automatically when client capabilities are detected
// Terminal operations are routed through ACP if client supports terminal capability
```

#### With AgentEventState

The ACP service integrates with agent event state for streaming responses:

```typescript
// Event types forwarded to ACP client
// - 'output.chat': Chat messages
// - 'output.reasoning': Reasoning/thought content
// - 'output.info': Informational messages
// - 'output.warning': Warnings
// - 'output.error': Errors
// - 'output.artifact': File attachments/artifacts
```

### Best Practices

1. **Working Directory**: Always use absolute paths for session working directories. The ACP service validates that all paths are absolute.

2. **Path Validation**: File operations are automatically sandboxed to the session's working directory. Paths outside the working directory will be rejected.

3. **Session Lifecycle**: Properly manage session creation and cleanup to avoid resource leaks. Sessions are automatically cleaned up when the ACP connection is closed, the service is stopped, or the application is shut down.

4. **Capability Detection**: Check client capabilities before relying on file/terminal operations. The ACP service only registers providers when the client advertises the corresponding capabilities:
   - File system: `fs.readTextFile` or `fs.writeTextFile`
   - Terminal: `terminal` capability

5. **Error Handling**: Implement proper error handling for ACP protocol operations. The service throws `RequestError` for protocol-level errors.

6. **Timeout Management**: Use appropriate timeouts for long-running terminal operations. The default timeout is 120 seconds.

7. **Agent Configuration**: The ACP service automatically configures agents with:
   - `headless: true` mode
   - Session-specific working directory for filesystem and terminal
   - Decorated permission handling for tool approvals

8. **Event Streaming**: Agent events are forwarded in real-time to the ACP client:
   - Chat messages → `agent_message_chunk`
   - Reasoning/thoughts → `agent_thought_chunk`
   - Artifacts → `resource` content blocks

---

## Developer Reference

### Core Components

#### ACPService (Core Service)

The main service implementing the Agent Client Protocol for TokenRing.

**Location**: `ACPService.ts`

**Implements**: `TokenRingService`

**Service Name**: `ACPService`

**Description**: ACP (Agent Client Protocol) server for TokenRing agents

**Constructor Parameters**:

- `app`: `TokenRingApp` - The TokenRing application instance
- `config`: `ACPConfig` - ACP configuration

##### `initialize(params: InitializeRequest): InitializeResponse`

Initializes the ACP connection and returns protocol capabilities.

**Parameters**:

- `params`: `InitializeRequest` - ACP initialization request containing client capabilities

**Returns**: `InitializeResponse` - Protocol version and agent capabilities

**Protocol Capabilities**:

- `loadSession`: `false` - Session loading is not supported
- `promptCapabilities`: Supports embedded context, images, and audio
- `sessionCapabilities`: Supports session listing

##### `createSession(params: NewSessionRequest): Promise<NewSessionResponse>`

Creates a new ACP session with a TokenRing agent.

**Parameters**:

- `params`: `NewSessionRequest` - Session creation request with working directory

**Returns**: `NewSessionResponse` - Created session ID

**Example**:

```typescript
const response = await acpService.createSession({
  cwd: '/path/to/working/directory'
});
// response.sessionId => 'uuid-string'
```

**Session Configuration**:

The service automatically configures the agent with:

- `headless: true` mode
- Working directory for filesystem and terminal
- Decorated ACP permission handlers

##### `listSessions(params: ListSessionsRequest): ListSessionsResponse`

Lists all active sessions, optionally filtered by working directory.

**Parameters**:

- `params`: `ListSessionsRequest` - Optional working directory filter

**Returns**: `ListSessionsResponse` - Array of session info

##### `prompt(connection: AgentSideConnection, params: PromptRequest): Promise<PromptResponse>`

Handles ACP prompt requests, streaming agent responses back to the client.

**Parameters**:

- `connection`: `AgentSideConnection` - ACP connection instance
- `params`: `PromptRequest` - Prompt request with message and attachments

**Returns**: `PromptResponse` - Response with stop reason and message ID

**Event Forwarding**:

The method forwards agent events to the ACP client:

- Chat messages → `agent_message_chunk`
- Reasoning/thoughts → `agent_thought_chunk`
- Warnings/Errors → `agent_thought_chunk` with prefixes
- Artifacts → `resource` content blocks

##### `cancel(params: CancelNotification): void`

Cancels an active prompt in a session.

**Parameters**:

- `params`: `CancelNotification` - Cancellation notification with session ID

**Note**: This is a notification (no return value). The agent operation is aborted asynchronously.

##### `start(): void`

Starts the ACP service and initializes the stdio transport connection.

**Transport**: Uses Node.js stdin/stdout streams converted to web streams.

##### `run(signal: AbortSignal): Promise<void>`

Runs the ACP service until the connection is closed or signal is aborted.

**Note**: This method must be called to start the ACP connection. It blocks until the connection closes.

##### `stop(): void`

Stops the ACP service and cleans up all sessions.

**Cleanup**:

- Unregisters file system and terminal providers
- Deletes all agents
- Clears session maps

#### TokenRingACPAgent

Internal class that implements the ACP `Agent` interface and delegates to `ACPService`.

**Location**: `ACPService.ts` (internal class)

**Methods**:

- `initialize`: Delegates to `ACPService.initialize`
- `authenticate`: No-op authentication
- `newSession`: Delegates to `ACPService.createSession`
- `listSessions`: Delegates to `ACPService.listSessions`
- `prompt`: Delegates to `ACPService.prompt`
- `cancel`: Delegates to `ACPService.cancel`

### Services

The ACPService implements the `TokenRingService` interface with the following lifecycle methods:

- `start()`: Initializes the stdio transport and ACP connection
- `run(signal)`: Runs the ACP connection until closure or abort
- `stop()`: Cleans up all sessions and providers

### Provider Documentation

#### ACPFileSystemProvider

File system provider that routes file operations through the ACP connection.

**Location**: `ACPFileSystemProvider.ts`

**Implements**: `FileSystemProvider`

**Constructor Parameters**:

- `connection`: `AgentSideConnection` - ACP connection instance
- `sessionId`: `string` - Session identifier
- `capabilities`: `ClientCapabilities` - Client capabilities for feature detection

**Properties**:

- `name`: `"ACPFileSystemProvider"` - Provider identifier
- `displayName`: `"ACP FileSystem (session: {sessionId})"` - Human-readable name

**Supported Operations**:

- `readFile`: Reads file content through ACP client (`fs.readTextFile` capability required)
- `writeFile`: Writes file content through ACP client
- `appendFile`: Appends content to file through ACP client
- `exists`: Checks if file exists through ACP client (`fs.readTextFile` capability required)
- `stat`: Gets file statistics through ACP client (`fs.readTextFile` capability required)

**Unsupported Operations** (throws `Error`):

- `deleteFile`: Not supported in ACP mode
- `rename`: Not supported in ACP mode
- `createDirectory`: Not supported in ACP mode
- `copy`: Not supported in ACP mode
- `getDirectoryTree`: Not supported in ACP mode

**Behavior**:

- Returns `null` from `readFile` if `fs.readTextFile` capability is not available
- Returns `false` from `exists` if capability is not available
- Returns stat with `exists: false` if capability is not available
- All file paths are validated to be within the session's working directory

#### ACPTerminalProvider

Terminal provider that routes terminal operations through the ACP connection.

**Location**: `ACPTerminalProvider.ts`

**Implements**: `NonInteractiveTerminalProvider`

**Constructor Parameters**:

- `connection`: `AgentSideConnection` - ACP connection instance
- `sessionId`: `string` - Session identifier

**Properties**:

- `name`: `"ACPTerminalProvider"` - Provider identifier
- `displayName`: `"ACP Terminal (session: {sessionId})"` - Human-readable name
- `isInteractive`: `false` - Non-interactive terminal provider
- `supportedIsolationLevels`: `["none"]` - Only supports no isolation

**Supported Operations**:

- `executeCommand`: Executes commands through ACP client terminal
- `runScript`: Runs shell scripts through ACP client terminal (uses `SHELL` env or `/bin/bash`)

**Behavior**:

- Creates a terminal handle via ACP connection
- Waits for command completion with configurable timeout (default: 120 seconds)
- Returns `success`, `badExitCode`, `timeout`, or `unknownError` status
- Truncates output if it exceeds ACP client limits
- Automatically releases terminal handle after execution

### RPC Endpoints

The ACP service implements the following ACP protocol methods through the `AgentSideConnection`:

| Endpoint       | Request               | Response               | Description                                      |
|----------------|-----------------------|------------------------|--------------------------------------------------|
| `initialize`   | `InitializeRequest`   | `InitializeResponse`   | Initialize ACP connection with client capabilities |
| `authenticate` | `AuthenticateRequest` | `AuthenticateResponse` | Authentication (currently no-op, returns empty response) |
| `newSession`   | `NewSessionRequest`   | `NewSessionResponse`   | Create new agent session with working directory  |
| `listSessions` | `ListSessionsRequest` | `ListSessionsResponse` | List active sessions, optionally filtered by cwd |
| `prompt`       | `PromptRequest`       | `PromptResponse`       | Send prompt and stream agent response            |
| `cancel`       | `CancelNotification`  | `void`                 | Cancel active prompt (notification, no response) |

#### Session Updates

The service also sends session updates to the client:

| Update Type           | Description                                      |
|-----------------------|--------------------------------------------------|
| `agent_message_chunk` | Stream assistant message content                 |
| `agent_thought_chunk` | Stream reasoning/thought content                 |
| `session_info_update` | Update session title and timestamp               |

#### Client Requests

The service handles these requests from the ACP client:

| Request Type        | Description                                      |
|---------------------|--------------------------------------------------|
| `readTextFile`      | Read file content (if capability advertised)     |
| `writeTextFile`     | Write file content (if capability advertised)    |
| `createTerminal`    | Create terminal handle (if capability advertised)|
| `requestPermission` | Request tool approval from client                |

### Usage Examples

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

When the ACP client supports file operations, the ACPFileSystemProvider routes file operations through the ACP connection:

```typescript
// File operations are routed through ACP if client supports the capability
const fileSystemService = app.getService(FileSystemService);

// Read file (routed through ACP)
const content = await fileSystemService.readTextFile('./src/index.ts', agent);

// Write file (routed through ACP)
await fileSystemService.writeFile('./src/output.txt', 'Hello World', agent);

// Append file (routed through ACP)
await fileSystemService.appendFile('./src/output.txt', '\nMore content', agent);
```

#### Terminal Operations (ACP Client Integration)

When the ACP client supports terminal operations, the ACPTerminalProvider routes terminal operations through the ACP connection:

```typescript
const terminalService = app.getService(TerminalService);

// Register the ACP terminal provider for a session
terminalService.registerTerminalProvider(
  'acp-terminal-session123',
  new ACPTerminalProvider(connection, sessionId)
);

// Execute command (routed through ACP)
const result = await terminalService.executeCommand('ls', ['-la'], {
  timeoutSeconds: 30,
  workingDirectory: '/path/to/project'
}, agent);
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

**Note**: The `build` script runs TypeScript type checking without emitting output.

### Dependencies

#### Core Dependencies

| Package                          | Version      | Purpose                                      |
|----------------------------------|--------------|----------------------------------------------|
| `@tokenring-ai/agent`            | workspace:*  | Agent orchestration and management           |
| `@tokenring-ai/app`              | workspace:*  | Base application framework and plugin system |
| `@tokenring-ai/filesystem`       | workspace:*  | File system service and providers            |
| `@tokenring-ai/terminal`         | workspace:*  | Terminal service and providers               |

#### External Dependencies

| Package                          | Version    | Purpose                                      |
|----------------------------------|------------|----------------------------------------------|
| `@agentclientprotocol/sdk`       | ^0.18.0    | Agent Client Protocol SDK implementation     |
| `zod`                            | ^4.3.6     | TypeScript-first schema validation           |

#### Dev Dependencies

| Package                          | Version    | Purpose                                      |
|----------------------------------|------------|----------------------------------------------|
| `typescript`                     | ^6.0.2     | TypeScript compiler                          |
| `vitest`                         | ^4.1.1     | Next-gen testing framework                   |

### Exports

The package exports the following:

```typescript
// Main service
export { default as ACPService } from "./ACPService.ts";

// Configuration schema
export { ACPConfigSchema } from "./schema.ts";
```

### Schema Definitions

#### ACPConfigSchema

```typescript
import { z } from "zod";

export const ACPConfigSchema = z.object({
  transport: z.literal("stdio").default("stdio"),
  defaultAgentType: z.string().optional(),
});

export type ACPConfig = z.output<typeof ACPConfigSchema>;
```

**Schema Fields**:

| Field              | Type           | Default     | Description                                    |
|--------------------|----------------|-------------|------------------------------------------------|
| `transport`        | `"stdio"`      | `"stdio"`   | Transport mechanism (currently only stdio)     |
| `defaultAgentType` | `string`       | `undefined` | Default agent type for ACP sessions            |

### Related Components

#### Core TokenRing Dependencies

| Package                          | Purpose                                      |
|----------------------------------|----------------------------------------------|
| `@tokenring-ai/agent`            | Agent orchestration, spawning, and management |
| `@tokenring-ai/app`              | Base application framework and plugin system  |
| `@tokenring-ai/filesystem`       | File system service and providers             |
| `@tokenring-ai/terminal`         | Terminal service and providers                |

### Development Notes

#### Session Providers

The ACP service dynamically registers providers with TokenRing services based on client capabilities:

##### File System Provider Registration

- **Condition**: Client advertises `fs.readTextFile` OR `fs.writeTextFile` capability
- **Provider Name**: `acp-fs-{sessionId}`
- **Registration**: `FileSystemService.registerFileSystemProvider()`
- **Activation**: `FileSystemService.setActiveFileSystem()`

##### Terminal Provider Registration

- **Condition**: Client advertises `terminal` capability
- **Provider Name**: `acp-terminal-{sessionId}`
- **Registration**: `TerminalService.registerTerminalProvider()`
- **Activation**: `TerminalService.setActiveProvider()`

#### Event Forwarding

Agent events are forwarded to the ACP client in real-time through the `prompt` method:

| Agent Event Type      | ACP Update Type          | Content Format                    |
|-----------------------|--------------------------|-----------------------------------|
| `output.chat`         | `agent_message_chunk`    | Text content block                |
| `output.reasoning`    | `agent_thought_chunk`    | Text content block                |
| `output.info`         | `agent_thought_chunk`    | Text content block                |
| `output.warning`      | `agent_thought_chunk`    | Text with `[warning]` prefix      |
| `output.error`        | `agent_thought_chunk`    | Text with `[error]` prefix        |
| `output.artifact`     | `resource`               | Resource content block (text/blob)|

#### Permission Handling

Tool approvals are delegated to the ACP client's permission system:

| Agent Method      | ACP Behavior                                      |
|-------------------|---------------------------------------------------|
| `askForApproval`  | Sends `requestPermission` to client, waits for response |
| `askForText`      | Throws `Error` (not supported in ACP mode)        |
| `askQuestion`     | Throws `Error` (not supported in ACP mode)        |

**Permission Response Options**:

- `allow`: Approve the tool call once
- `reject`: Reject the tool call once
- `cancelled`: Client cancelled the permission request (returns `null`)

#### Session Lifecycle

##### Session Creation

1. Validate working directory (must be absolute path)
2. Spawn agent from configured agent type
3. Decorate agent with ACP permission handlers
4. Register session providers (if capabilities available)
5. Store session in maps
6. Send session info update to client

##### Session Cleanup

Sessions are cleaned up when:

- The ACP connection is closed
- The service is stopped
- The application is shut down

**Cleanup Process**:

1. Unregister file system provider (if registered)
2. Unregister terminal provider (if registered)
3. Delete agent via `AgentManager.deleteAgent()`
4. Remove from session maps

#### Agent Configuration

When creating sessions, the ACP service automatically configures agents with:

```typescript
{
  ...baseAgentConfig,
  headless: true,
  filesystem: {
    ...baseAgentConfig.filesystem,
    workingDirectory: cwd
  },
  terminal: {
    ...baseAgentConfig.terminal,
    workingDirectory: cwd
  }
}
```

#### Transport Mechanism

The ACP service uses stdio transport for communication:

- **Input**: Node.js `process.stdin` converted to web readable stream
- **Output**: Node.js `process.stdout` converted to web writable stream
- **Protocol**: NDJSON (Newline Delimited JSON) stream
- **Connection**: `AgentSideConnection` from `@agentclientprotocol/sdk`

#### Error Handling

The service uses `RequestError` from the ACP SDK for protocol-level errors:

- `RequestError.invalidParams()`: Invalid request parameters
- `RequestError.invalidRequest()`: Invalid request state
- Custom `Error`: Application-level errors

#### State Management

##### Session State

Each ACP session maintains the following state:

```typescript
type ACPSession = {
  sessionId: string;                    // Unique session identifier (UUID)
  cwd: string;                          // Working directory (absolute path)
  agent: TokenRingAgent;                // Agent instance for this session
  activePrompt: ACPPromptState | null;  // Current active prompt state
  updatedAt: string;                    // Last update timestamp (ISO string)
  fileSystemProviderName?: string;      // Registered file system provider name
  terminalProvider?: ACPTerminalProvider; // Terminal provider instance
  terminalProviderName?: string;        // Registered terminal provider name
};

type ACPPromptState = {
  requestId: string;                    // ID of the active prompt request
};
```

**Session Maps**:

The service maintains two maps for session lookup:

- `sessions`: Map of `sessionId` → `ACPSession`
- `sessionsByAgentId`: Map of `agent.id` → `ACPSession`

##### Agent State Integration

ACP sessions integrate with the following agent state slices:

- **`AgentEventState`**: Event cursor for streaming agent events
  - Used to track which events have been forwarded to the client
  - Allows resuming event streaming from the last position

**Note**: The ACP service does not directly manage `FileSystemState` or `TerminalState`. These are configured on the agent during session creation with the session's working directory.

## License

MIT License - see LICENSE file for details.
