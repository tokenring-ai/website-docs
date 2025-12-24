# MCP Plugin

Model Context Protocol (MCP) client integration for connecting TokenRing agents with MCP servers.

## Overview

The `@tokenring-ai/mcp` package provides MCP client functionality to connect TokenRing agents with MCP servers, enabling access to external tools and resources through the Model Context Protocol. It automatically registers MCP server tools with the TokenRing chat service for seamless integration.

## Key Features

- **Multiple transport types**: Support for stdio, SSE, and HTTP transports
- **Automatic tool registration**: MCP server tools are automatically registered with TokenRing chat service
- **Seamless integration**: Works with existing TokenRing application framework
- **Dynamic tool discovery**: Tools are automatically discovered and registered from MCP servers
- **Service-based architecture**: Integrated as a TokenRing service with proper lifecycle management

## Core Components

### MCPService

Main service for managing MCP server connections and tool registration.

**Key Methods:**
- `register(name, config, app)`: Registers an MCP server with the TokenRing application
  - `name`: Unique identifier for the MCP server
  - `config`: Transport configuration object
  - `app`: TokenRing application instance to register tools with

### Transport Types

**Stdio Transport**: Process-based communication
```typescript
{
  type: 'stdio',
  command: 'node',
  args: ['path/to/mcp-server.js']
}
```

**SSE Transport**: Server-Sent Events
```typescript
{
  type: 'sse',
  url: 'http://localhost:3000/sse'
}
```

**HTTP Transport**: Standard HTTP
```typescript
{
  type: 'http',
  url: 'http://localhost:3000/mcp'
}
```

### Configuration Schema

```typescript
export const MCPConfigSchema = z.object({
  transports: z.record(z.string(), z.looseObject({
    type: z.string()
  }))
}).optional();
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
        "url": "http://localhost:3000/mcp"
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

## Plugin Integration

The MCP plugin integrates with the TokenRing application framework through the standard plugin pattern:

```typescript
import { MCPPlugin } from '@tokenring-ai/mcp';

// In your TokenRing application configuration
plugins: [MCPPlugin]
```

## Dependencies

- `@tokenring-ai/app`: Core application framework
- `@tokenring-ai/chat`: Chat service integration
- `@ai-sdk/mcp`: MCP client implementation
- `@modelcontextprotocol/sdk`: MCP protocol libraries
- `ai`: AI SDK
- `zod`: Configuration schema validation

## Package Structure

```
pkg/mcp/
├── index.ts          # Type exports and configuration schema
├── MCPService.ts     # Main service implementation
├── plugin.ts         # Plugin registration
├── package.json     # Package metadata
└── *.test.ts         # Tests
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

## Future Enhancements

- Enhanced transport options with TLS and authentication
- Dynamic tool discovery and hot-reloading
- Tool versioning and namespacing
- Metrics and observability
- Health checks and auto-reconnect
- Caching layer for tool definitions
- CLI utility for management
- Enhanced error handling and diagnostics