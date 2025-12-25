# Model Context Protocol (MCP) Client Plugin

MCP client integration for connecting TokenRing agents with MCP servers, enabling access to external tools and resources through the Model Context Protocol.

## Overview

The `@tokenring-ai/mcp` package provides MCP client functionality to connect TokenRing agents with MCP servers. It automatically registers MCP server tools with the TokenRing chat service, making them available for agent use. The plugin supports multiple transport types (stdio, SSE, HTTP) and provides comprehensive configuration validation.

## Key Features

- **Multiple transport types**: Support for stdio, SSE, and HTTP transports
- **Automatic tool registration**: MCP server tools are automatically registered with TokenRing chat service
- **Seamless integration**: Works with existing TokenRing application framework
- **Zod schema validation**: Comprehensive configuration validation with detailed error messages
- **Type-safe configuration**: Strong typing for all configuration options
- **Error handling**: Proper error handling for transport connections and tool registration
- **Tool schema preservation**: Maintains original MCP tool schemas during registration
- **Plugin-based architecture**: Integrates as a TokenRing plugin with automatic service registration

## Installation

```bash
bun install @tokenring-ai/mcp
```

## Configuration

### Basic Configuration

Configure MCP servers in your TokenRing application configuration:

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

```typescript
{
  type: 'stdio',
  command: 'mcp-server',           // Required: Command to execute
  args?: string[],                // Optional: Command arguments
  env?: Record<string, string>,   // Optional: Environment variables
  cwd?: string                   // Optional: Working directory
}
```

#### SSE Transport

```typescript
{
  type: 'sse',
  url: 'http://localhost:3000/sse', // Required: SSE endpoint URL
  headers?: Record<string, string>, // Optional: Custom headers
  timeout?: number               // Optional: Connection timeout in ms
}
```

#### HTTP Transport

```typescript
{
  type: 'http',
  url: 'http://localhost:3001/api/mcp', // Required: HTTP endpoint URL
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE',     // Optional: HTTP method (default: GET)
  headers?: Record<string, string>,    // Optional: Custom headers
  timeout?: number                   // Optional: Connection timeout in ms
}
```

## Core Components

### MCPService

Main service for managing MCP server connections and tool registration.

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import TokenRingApp from '@tokenring-ai/app';

const mcpService = new MCPService();

// Register an MCP server with the application
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'mcp-server',
  args: ['--config', 'config.json'],
  env: {
    DEBUG: 'true'
  }
}, app);
```

**Properties:**
- `name`: "MCPService"
- `description`: "Service for MCP (Model Context Protocol) servers"

### Configuration Schemas

#### MCPConfigSchema

```typescript
export const MCPConfigSchema = z.object({
  transports: z.record(z.string(), MCPTransportConfigSchema)
}).optional();
```

#### MCPTransportConfigSchema

```typescript
export const MCPTransportConfigSchema = z.discriminatedUnion("type", [
  z.object({type: z.literal("stdio")}).passthrough(),
  z.object({type: z.literal("sse"), url: z.url()}).passthrough(),
  z.object({type: z.literal("http"), url: z.url()}).passthrough(),
]);
```

### MCPTransportConfig Type

```typescript
type MCPTransportConfig = 
  | { type: "stdio"; command: string; args?: string[]; env?: Record<string, string>; cwd?: string }
  | { type: "sse"; url: string; headers?: Record<string, string>; timeout?: number }
  | { type: "http"; url: string; method?: "GET" | "POST" | "PUT" | "DELETE"; headers?: Record<string, string>; timeout?: number };
```

## API Reference

### Exports

- `default`: TokenRing plugin object
- `MCPService`: Service class for manual MCP server registration
- `MCPConfigSchema`: Zod schema for plugin configuration
- `MCPTransportConfigSchema`: Zod schema for transport configuration
- `MCPTransportConfig`: Type alias for transport configuration

### MCPService Methods

#### `register(name: string, config: MCPTransportConfig, app: TokenRingApp): Promise<void>`

Registers an MCP server with the TokenRing application.

**Parameters:**
- `name`: Unique identifier for the MCP server
- `config`: Transport configuration object
- `app`: TokenRingApp instance to register tools with

**Example:**

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import TokenRingApp from '@tokenring-ai/app';

const mcpService = new MCPService();
const app = new TokenRingApp();

// Register with stdio transport
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'mcp-server',
  args: ['--config', 'config.json']
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

## Usage Examples

### Programmatic Integration

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp();
const mcpService = new MCPService();

// Register an MCP server with stdio transport
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'node',
  args: ['path/to/mcp-server.js']
}, app);

// Register an MCP server with SSE transport
await mcpService.register('another-server', {
  type: 'sse',
  url: 'http://localhost:3000/sse'
}, app);
```

### Configuration-based Integration (recommended)

Configure MCP servers in the application configuration:

```typescript
// config.json or environment
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

### Tool Usage in Chat

Once registered, MCP tools become available in the TokenRing chat system:

```
/user> /tool myserver/my_tool_name arg1=value1 arg2=value2
```

## Integration with TokenRing

### Plugin Integration

The MCP plugin integrates with the TokenRing application framework through the standard plugin pattern:

```typescript
import { default as MCPPlugin } from '@tokenring-ai/mcp';

// In your TokenRing application configuration
plugins: [MCPPlugin]
```

### Service Registration

The plugin automatically registers the `MCPService` with the TokenRing application when the configuration is provided:

```typescript
// The plugin installation process
async install(app: TokenRingApp) {
  const config = app.getConfigSlice('mcp', MCPConfigSchema);
  if (config) {
    const mcpService = new MCPService();
    app.addServices(mcpService);

    for (const name in config.transports) {
      await mcpService.register(name, config.transports[name] as any, app);
    }
  }
}
```

## Dependencies

- `@tokenring-ai/app`: Core application framework (0.2.0)
- `@tokenring-ai/chat`: Chat service integration (0.2.0)
- `@tokenring-ai/agent`: Agent framework (0.2.0)
- `@ai-sdk/mcp`: MCP client implementation (0.0.12)
- `@modelcontextprotocol/sdk`: MCP protocol libraries (1.25.0)
- `ai`: AI SDK (5.0.113)
- `zod`: Configuration schema validation

## Package Structure

```
pkg/mcp/
├── index.ts          # Type exports and configuration schema
├── MCPService.ts     # Main service implementation
├── plugin.ts         # Plugin registration
├── package.json     # Package metadata
├── *.test.ts         # Tests
└── README.md         # Package README
```

## Development

### Testing

```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Building

```bash
bun run build
```

## License

MIT License