---
slug: mcp-plugin
title: MCP Plugin - Model Context Protocol Support
authors: [mdierolf]
tags: [tokenring, plugins, mcp, integration, announcement]
---

# MCP Plugin - Model Context Protocol Support

TokenRing Coder now supports the Model Context Protocol (MCP) for standardized AI tool integration.

<!-- truncate -->

## What is MCP?

Model Context Protocol is a standardized way for AI applications to connect with external tools and data sources. It enables seamless integration with MCP servers.

## Key Features

### 🔌 Multiple Transport Types
Support for stdio, SSE, and HTTP transports:

**Stdio Transport** (Process-based):
```typescript
{
  type: 'stdio',
  command: 'node',
  args: ['path/to/mcp-server.js']
}
```

**SSE Transport** (Server-Sent Events):
```typescript
{
  type: 'sse',
  url: 'http://localhost:3000/sse'
}
```

**HTTP Transport**:
```typescript
{
  type: 'http',
  url: 'http://localhost:3000/mcp'
}
```

### 🛠️ Automatic Tool Registration
MCP server tools are automatically registered with TokenRing agents. No manual configuration needed.

### 🔄 Seamless Integration
Works with existing TokenRing agent architecture. MCP tools appear alongside native tools.

## Usage

```typescript
import { MCPService } from '@tokenring-ai/mcp';
import { AgentTeam } from '@tokenring-ai/agent';

const mcpService = new MCPService();
const team = new AgentTeam();

// Register MCP server
await mcpService.register('myserver', {
  type: 'stdio',
  command: 'node',
  args: ['path/to/mcp-server.js']
}, team);
```

## Benefits

- **Standardization**: Use any MCP-compatible tool
- **Ecosystem**: Access growing MCP tool ecosystem
- **Flexibility**: Mix MCP and native tools seamlessly
- **Future-Proof**: Built on open protocol

Connect TokenRing Coder to the broader MCP ecosystem and unlock unlimited integrations.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
