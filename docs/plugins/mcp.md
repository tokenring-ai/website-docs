# @tokenring-ai/mcp

## Overview

The `@tokenring-ai/mcp` package provides MCP (Model Context Protocol) client functionality to connect TokenRing agents with MCP servers. It automatically registers MCP server tools with the TokenRing chat service, making them available for agent use. The plugin supports multiple transport types (stdio, SSE, HTTP) and provides comprehensive configuration validation using Zod schemas with passthrough support for additional properties.

## Key Features

- **Multiple transport types**: Support for stdio, SSE, and HTTP transports
- **Automatic tool registration**: MCP server tools are automatically registered with TokenRing chat service
- **Seamless integration**: Works with existing TokenRing application framework
- **Zod schema validation**: Comprehensive configuration validation with detailed error messages
- **Type-safe configuration**: Strong typing for all configuration options
- **Error handling**: Proper error handling for transport connections and tool registration
- **Tool schema preservation**: Maintains original MCP tool schemas during registration
- **Plugin-based architecture**: Integrates as a TokenRing plugin with automatic service registration
- **Passthrough configuration**: Supports additional configuration properties via Zod passthrough

## Core Components

### MCPService

Main service for managing MCP server connections and tool registration.

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import TokenRingApp from '@tokenring-ai/app';

const mcpService = new MCPService();
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service identifier (`"MCPService"`) |
| `description` | `string` | Service description (`"Service for MCP (Model Context Protocol) servers"`) |

**Methods:**

| Method | Return Type | Description |
|--------|-------------|-------------|
| `register(name, config, app)` | `Promise<void>` | Registers an MCP server with the TokenRing application |

#### `register(name: string, config: MCPTransportConfig, app: TokenRingApp): Promise<void>`

Registers an MCP server with the TokenRing application.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Unique identifier for the MCP server |
| `config` | `MCPTransportConfig` | Transport configuration object |
| `app` | `TokenRingApp` | TokenRingApp instance to register tools with |

**Behavior:**

1. Creates the appropriate transport instance (StdioClientTransport, SSEClientTransport, or StreamableHTTPClientTransport)
2. Creates an MCP client using the transport
3. Retrieves available tools from the MCP server
4. Registers each tool with the TokenRing chat service with namespaced format `{serverName}/{toolName}`
5. Preserves tool schemas, descriptions, and execution handlers

**Throws:**

- `Error` - when transport type is unknown
- `Error` - when MCP client creation fails
- `Error` - when tool retrieval fails

**Example:**

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import TokenRingApp from '@tokenring-ai/app';

const mcpService = new MCPService();
const app = new TokenRingApp();

// Register an MCP server with stdio transport
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'mcp-server',
  args: ['--config', 'config.json'],
  env: {
    DEBUG: 'true'
  }
}, app);
```

### Configuration Schemas

#### MCPConfigSchema

```typescript
export const MCPConfigSchema = z.object({
  transports: z.record(z.string(), z.looseObject({type: z.string()}))
}).optional();
```

**Structure:**

- `transports`: Record mapping server names to transport configuration objects
- Each transport must include a `type` field specifying the connection method
- Configuration is optional for the plugin
- Uses `z.looseObject()` which allows additional properties beyond the `type` field

#### MCPTransportConfigSchema

```typescript
export const MCPTransportConfigSchema = z.discriminatedUnion("type", [
  z.object({type: z.literal("stdio")}).passthrough(),
  z.object({type: z.literal("sse"), url: z.url()}).passthrough(),
  z.object({type: z.literal("http"), url: z.url()}).passthrough(),
]);
```

**Discriminated Union Types:**

| Type | Required Fields | Optional Fields | Passthrough |
|------|----------------|-----------------|-------------|
| `stdio` | `type`, `command` | `args`, `env`, `cwd` | Yes |
| `sse` | `type`, `url` | `headers`, `timeout` | Yes |
| `http` | `type`, `url` | `method`, `headers`, `timeout` | Yes |

**Key Features:**

- **Discriminated Union**: Uses `type` field to determine transport type
- **Passthrough**: Allows additional properties beyond the defined schema
- **URL Validation**: SSE and HTTP transports require valid URLs
- **Type Safety**: TypeScript types are inferred from the schema

#### MCPTransportConfig Type

```typescript
type MCPTransportConfig = z.infer<typeof MCPTransportConfigSchema>;
```

The schema uses discriminated union with passthrough, allowing three transport types:

- **stdio**: `{ type: "stdio"; command: string; args?: string[]; env?: Record<string, string>; cwd?: string; [key: string]: any }`
- **sse**: `{ type: "sse"; url: string; headers?: Record<string, string>; timeout?: number; [key: string]: any }`
- **http**: `{ type: "http"; url: string; method?: "GET" | "POST" | "PUT" | "DELETE"; headers?: Record<string, string>; timeout?: number; [key: string]: any }`

## Services

### MCPService

The `MCPService` class implements the `TokenRingService` interface and provides MCP server management functionality.

#### Service Interface

```typescript
interface TokenRingService {
  name: string;
  description: string;
  // No specific lifecycle methods required
}
```

#### Plugin Registration

The MCP service is registered automatically when the plugin is installed:

```typescript
// In plugin.ts
install(app, config) {
  if (config.mcp) {
    const mcpService = new MCPService();
    app.addServices(mcpService);
  }
}
```

**Behavior:**

- If `config.mcp` is undefined, no service is added
- If `config.mcp` exists (even with empty transports), the service is added
- The service is added regardless of whether transports are configured

#### Registering Multiple Servers

The plugin supports registering multiple MCP servers with different transport types:

```typescript
// In plugin.ts
async start(app, config) {
  if (config.mcp) {
    for (const name in config.mcp.transports) {
      await app.requireService(MCPService).register(name, config.mcp.transports[name] as any, app);
    }
  }
}
```

**Behavior:**

- Iterates through all configured transports
- Registers each transport with the MCPService
- Awaits each registration before proceeding to the next

## Provider Documentation

This package does not use provider patterns. It directly implements service functionality.

## RPC Endpoints

This package does not define RPC endpoints.

## Chat Commands

This package does not define chat commands.

## Configuration

### Plugin Configuration

Configure MCP servers in your TokenRing application:

```typescript
{
  plugins: [
    {
      name: "@tokenring-ai/mcp",
      config: {
        mcp: {
          transports: {
            myserver: {
              type: "stdio",
              command: "mcp-server",
              args: ["--config", "config.json"],
              env: {
                DEBUG: "true"
              }
            },
            remoteserver: {
              type: "sse",
              url: "http://localhost:3000/sse",
              headers: {
                "Authorization": "Bearer token123"
              }
            },
            apiserver: {
              type: "http",
              url: "http://localhost:3001/api/mcp",
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              }
            }
          }
        }
      }
    }
  ]
}
```

### Transport Types

#### Stdio Transport

Execute an MCP server as a child process:

```typescript
{
  type: 'stdio',
  command: string,           // Required: Command to execute
  args?: string[],          // Optional: Command arguments
  env?: Record<string, string>,   // Optional: Environment variables
  cwd?: string,             // Optional: Working directory
  [key: string]: any        // Additional properties passed through
}
```

**Transport Creation:**

The stdio transport is created by passing the entire config object to `StdioClientTransport`:

```typescript
transport = new StdioClientTransport(config as any);
```

**Example:**

```typescript
await mcpService.register('local-server', {
  type: 'stdio',
  command: 'mcp-server',
  args: ['--config', 'config.json'],
  env: {
    DEBUG: 'true'
  },
  cwd: '/path/to/server'
}, app);
```

#### SSE Transport

Connect to an MCP server using Server-Sent Events:

```typescript
{
  type: 'sse',
  url: string,              // Required: SSE endpoint URL
  headers?: Record<string, string>, // Optional: Custom headers
  timeout?: number,         // Optional: Connection timeout in ms
  [key: string]: any        // Additional properties passed through
}
```

**Transport Creation:**

The SSE transport is created with a URL object:

```typescript
transport = new SSEClientTransport(new URL(config.url));
```

**Example:**

```typescript
await mcpService.register('remote-server', {
  type: 'sse',
  url: 'http://localhost:3000/sse',
  headers: {
    'Authorization': 'Bearer token123'
  },
  timeout: 10000
}, app);
```

#### HTTP Transport

Connect to an MCP server using HTTP (streamable HTTP):

```typescript
{
  type: 'http',
  url: string,              // Required: HTTP endpoint URL
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE', // Optional: HTTP method
  headers?: Record<string, string>, // Optional: Custom headers
  timeout?: number,         // Optional: Connection timeout in ms
  [key: string]: any        // Additional properties passed through
}
```

**Transport Creation:**

The HTTP transport is created with a URL object:

```typescript
transport = new StreamableHTTPClientTransport(new URL(config.url));
```

**Example:**

```typescript
await mcpService.register('api-server', {
  type: 'http',
  url: 'http://localhost:3001/api/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
}, app);
```

### Complete Configuration Example

```json
{
  "mcp": {
    "transports": {
      "stdio-server": {
        "type": "stdio",
        "command": "node",
        "args": ["path/to/mcp-server.js"]
      },
      "sse-server": {
        "type": "sse",
        "url": "http://localhost:3000/sse"
      },
      "http-server": {
        "type": "http",
        "url": "http://localhost:3001/api/mcp",
        "method": "POST"
      }
    }
  }
}
```

### Minimal Configuration

```json
{
  "mcp": {
    "transports": {
      "my-server": {
        "type": "stdio",
        "command": "mcp-server"
      }
    }
  }
}
```

## Integration

### Plugin Integration

The MCP plugin integrates with the TokenRing application framework through the standard plugin pattern.

#### Plugin Lifecycle

The plugin implements the TokenRing plugin lifecycle with two hooks:

**install(app, config)**

Called when the plugin is installed. Creates the MCPService instance and adds it to the application services.

```typescript
install(app, config) {
  if (config.mcp) {
    const mcpService = new MCPService();
    app.addServices(mcpService);
  }
}
```

**Behavior:**

- If `config.mcp` is undefined, no service is added
- If `config.mcp` exists (even with empty transports), the service is added
- The service is added regardless of whether transports are configured

**start(app, config)**

Called when the plugin starts. Iterates through configured transports and registers each MCP server.

```typescript
async start(app, config) {
  if (config.mcp) {
    for (const name in config.mcp.transports) {
      await app.requireService(MCPService).register(name, config.mcp.transports[name] as any, app);
    }
  }
}
```

**Behavior:**

- Iterates through all configured transports
- Registers each transport with the MCPService
- Awaits each registration before proceeding to the next

### Service Dependencies

The MCPService requires the following services from the TokenRing application:

- **ChatService**: Used for registering tools from MCP servers
- **TokenRingApp**: Provides the application context for service management

These services are automatically provided by the TokenRing application framework.

### Agent Integration

Agents can access MCP tools through the registered tool names:

```typescript
// Access MCP service
const mcpService = agent.requireServiceByType(MCPService);

// Call registered MCP tools
// Tools are available as: {server-name}/{tool-name}
await agent.callTool('weather/get_forecast', {
  location: 'San Francisco',
  days: 7
});
```

## Usage Examples

### Plugin Installation

The MCP plugin automatically registers when configured:

```typescript
// In your TokenRing app configuration
{
  plugins: [
    {
      name: "@tokenring-ai/mcp",
      config: {
        mcp: {
          transports: {
            myserver: {
              type: "stdio",
              command: "mcp-server",
              args: ["--config", "config.json"]
            }
          }
        }
      }
    }
  ]
}
```

### Manual Service Usage

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import TokenRingApp from '@tokenring-ai/app';

const mcpService = new MCPService();
const app = new TokenRingApp();

// Register an MCP server with stdio transport
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'mcp-server',
  args: ['--config', 'config.json'],
  env: {
    DEBUG: 'true'
  }
}, app);

// Register with SSE transport
await mcpService.register('remoteserver', {
  type: 'sse',
  url: 'http://localhost:3000/sse',
  headers: {
    'Authorization': 'Bearer token123'
  }
}, app);

// Register with HTTP transport
await mcpService.register('apiserver', {
  type: 'http',
  url: 'http://localhost:3001/api/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, app);
```

### Tool Registration

When an MCP server is registered, the package:

1. Creates a client connection using the specified transport type
2. Retrieves available tools from the MCP server using `client.tools()`
3. Registers each tool with the TokenRing chat service
4. Tool names are prefixed with the server name (e.g., `myserver/tool-name`)
5. Tool schemas are preserved and passed to the chat service
6. Tool execution functions are bound to the MCP client

**Registration Structure:**

```typescript
chatService.registerTool(`${name}/${toolName}`, {
  name: `${name}/${toolName}`,
  tool: {
    inputSchema: tool.inputSchema,
    execute: tool.execute,
    description: tool.description
  }
});
```

### Tool Naming Convention

Each tool from an MCP server is registered with a composite name:

- **Format**: `{server-name}/{tool-name}`
- **Example**: If server is "weather" and tool is "get_forecast", the registered tool will be "weather/get_forecast"
- **Access**: Agents can call tools using the full composite name

### Tool Schema Preservation

The package maintains the original MCP tool schemas:

- Input schemas are passed through to the chat service
- Tool descriptions are preserved
- Execution handlers are bound to the MCP client
- Type safety is maintained through TypeScript types

## State Management

This package does not implement state management.

## Error Handling

The package provides comprehensive error handling:

- **Invalid Configuration**: Throws clear validation errors for invalid transport configurations using Zod
- **Transport Failures**: Handles connection errors with descriptive messages
  - Stdio: Process execution errors, command not found
  - SSE: Connection timeouts, invalid URLs
  - HTTP: Network errors, connection refused
- **Tool Registration Failures**: Returns errors when tools cannot be registered with chat service
- **Service Dependencies**: Checks for required services (ChatService, TokenRingApp) before registration
- **Unknown Transport Types**: Throws errors for unsupported transport types

### Error Scenarios

#### Configuration Errors

```typescript
// Invalid transport type
{
  type: 'unknown'  // Will throw: "Unknown connection type unknown"
}

// Missing required field
{
  type: 'sse'
  // Missing 'url' field - will throw validation error
}
```

#### Connection Errors

```typescript
// Stdio command not found
{
  type: 'stdio',
  command: 'nonexistent-command'
  // Will throw process execution error
}

// Invalid URL
{
  type: 'sse',
  url: 'not-a-valid-url'
  // Will throw connection error
}
```

#### MCP Client Creation Failure

```typescript
// When the MCP server is unreachable
{
  type: 'sse',
  url: 'http://unreachable-server:3000/sse'
  // Will throw connection error from MCP client creation
}
```

#### Tool Retrieval Failure

```typescript
// When the server cannot provide tools
{
  type: 'stdio',
  command: 'mcp-server'
  // Will throw error if server fails to respond to tools() request
}
```

## Best Practices

### Transport Selection

- **Use stdio** for local MCP servers that can be executed as child processes
- **Use SSE** for remote MCP servers that support Server-Sent Events
- **Use HTTP** for MCP servers that expose streamable HTTP endpoints

### Tool Naming

- Choose descriptive server names that identify the server's purpose
- Server names become prefixes for all tools, so keep them concise
- Avoid special characters in server names that might conflict with tool naming

### Error Handling

- Always wrap MCP server registration in try/catch blocks
- Log connection errors for debugging
- Implement retry logic for transient connection failures

### Configuration Validation

- Use TypeScript to catch configuration errors at compile time
- Validate configurations before passing to the plugin
- Use Zod schemas for runtime validation when needed

### Passthrough Configuration

- The schema uses `.passthrough()` to allow additional properties
- Additional properties are passed through to transport constructors
- Be aware that invalid properties may cause runtime errors in transport creation

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Files

- `MCPService.test.ts`: Unit tests for MCPService
- `configuration.test.ts`: Configuration validation tests
- `integration.test.ts`: Integration tests with TokenRing services

### Build Verification

```bash
bun run build
```

### Test Coverage

The test suite covers:

- Configuration validation for all transport types
- Transport type discrimination
- Tool registration with proper naming
- Error handling for various failure scenarios
- Integration with TokenRing services
- Concurrent operations
- Tool schema preservation

## Package Structure

```
pkg/mcp/
├── index.ts              # Type exports and configuration schema
├── MCPService.ts         # Main service implementation
├── plugin.ts             # Plugin registration
├── package.json          # Package metadata
├── README.md             # Package README
├── LICENSE               # MIT License
├── vitest.config.ts      # Test configuration
├── MCPService.test.ts    # Unit tests
├── configuration.test.ts # Configuration schema tests
└── integration.test.ts   # Integration tests
```

## Dependencies

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | `0.2.0` | Core TokenRing application framework |
| `@tokenring-ai/chat` | `0.2.0` | Chat service for tool registration |
| `@tokenring-ai/agent` | `0.2.0` | Agent system for tool execution |
| `@ai-sdk/mcp` | `^1.0.30` | AI SDK integration for MCP protocol |
| `@modelcontextprotocol/sdk` | `^1.28.0` | Official MCP SDK implementation |
| `ai` | `^6.0.138` | AI SDK core functionality |
| `zod` | `^4.3.6` | Schema validation library |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | `^4.1.1` | Testing framework |
| `typescript` | `^6.0.2` | TypeScript compiler |

## Related Components

- **@tokenring-ai/chat**: Chat service that receives MCP tool registrations
- **@tokenring-ai/agent**: Agent system that executes MCP tools
- **@tokenring-ai/app**: Core application framework that manages the plugin lifecycle

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
