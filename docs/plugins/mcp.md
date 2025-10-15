# MCP Plugin

Model Context Protocol (MCP) client integration for connecting TokenRing agents with MCP servers.

## Overview

The `@tokenring-ai/mcp` package provides MCP client functionality to connect TokenRing agents with MCP servers, enabling access to external tools and resources through the Model Context Protocol.

## Key Features

- **Multiple transport types**: Support for stdio, SSE, and HTTP transports
- **Automatic tool registration**: MCP server tools are automatically registered with TokenRing agents
- **Seamless integration**: Works with existing TokenRing agent architecture
- Dynamic tool discovery from MCP servers

## Core Components

### MCPService

Main service for managing MCP server connections.

**Key Methods:**
- `register(name, config, team)`: Registers an MCP server with the TokenRing agent team
  - `name`: Unique identifier for the MCP server
  - `config`: Transport configuration object
  - `team`: AgentTeam instance to register tools with

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

## Usage Example

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import { AgentTeam } from '@tokenring-ai/agent';

const mcpService = new MCPService();
const team = new AgentTeam();

// Register an MCP server with stdio transport
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'node',
  args: ['path/to/mcp-server.js']
}, team);
```

## Configuration Options

- **Transport Type**: stdio, SSE, or HTTP
- **Connection Details**: Command/args for stdio, URL for SSE/HTTP
- **TLS Support**: Available for HTTP/SSE transports (future enhancement)

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- MCP protocol implementation libraries

## Future Enhancements

- Enhanced transport options with TLS and authentication
- Dynamic tool discovery and hot-reloading
- Tool versioning and namespacing
- Metrics and observability
- Health checks and auto-reconnect
- Caching layer for tool definitions
- CLI utility for management
