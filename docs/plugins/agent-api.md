# Agent API Plugin

WebSocket API for real-time agent communication, management, and event streaming.

## Overview

The `@tokenring-ai/agent-api` package provides a WebSocket-based API for interacting with TokenRing agents from web browsers and other clients. It enables real-time agent management, input/output streaming, event monitoring, and human interaction handling.

## Key Features

- **WebSocket API**: Real-time bidirectional communication
- **Agent Management**: Create, list, connect, and delete agents
- **Event Streaming**: Receive all agent events in real-time
- **Human Interaction**: Handle human input requests from agents
- **Browser Client**: JavaScript library for frontend integration
- **Multi-Agent Support**: Connect to different agents dynamically

## Core Components

### AgentAPIResource

WebSocket resource that handles agent communication protocol.

**Registered Endpoint:** `ws://[host]/ws`

**Features:**
- Agent lifecycle management
- Event streaming per connected agent
- Input message routing
- Human response handling
- Error handling and reporting

### AgentClient (Browser)

JavaScript client library for connecting to the Agent API from web browsers.

**Key Methods:**
- `connect(): Promise<void>` - Connect to WebSocket
- `disconnect(): void` - Close connection
- `on(event: string, callback: Function)` - Listen for events
- `off(event: string, callback: Function)` - Remove listener
- `listAgents()` - Request agent list
- `createAgent(agentType: string)` - Create new agent
- `connectAgent(agentId: string)` - Connect to agent
- `sendInput(message: string)` - Send input to agent
- `sendHumanResponse(sequence: number, response: any)` - Respond to human request
- `deleteAgent(agentId: string)` - Delete agent

## WebSocket Protocol

### Client → Server Messages

**List Agents:**
```json
{ "type": "listAgents" }
```

**Create Agent:**
```json
{ "type": "createAgent", "agentType": "interactiveCodeAgent" }
```

**Connect to Agent:**
```json
{ "type": "connectAgent", "agentId": "agent-uuid" }
```

**Send Input:**
```json
{ "type": "input", "message": "Hello, agent!" }
```

**Human Response:**
```json
{ "type": "humanResponse", "sequence": 123, "response": "Yes" }
```

**Delete Agent:**
```json
{ "type": "deleteAgent", "agentId": "agent-uuid" }
```

### Server → Client Messages

**Agent List:**
```json
{
  "type": "agentList",
  "agents": [
    { "id": "uuid", "name": "Agent Name", "type": "interactiveCodeAgent" }
  ]
}
```

**Agent Created:**
```json
{ "type": "agentCreated", "agentId": "uuid", "name": "Agent Name" }
```

**Agent Connected:**
```json
{ "type": "agentConnected", "agentId": "uuid" }
```

**Agent Deleted:**
```json
{ "type": "agentDeleted", "agentId": "uuid" }
```

**Agent Event:**
```json
{
  "type": "event",
  "event": {
    "type": "output.chat",
    "data": { "content": "Hello!" }
  }
}
```

**Error:**
```json
{ "type": "error", "message": "Error description" }
```

## Agent Event Types

Events streamed from connected agents:

- `output.chat` - Chat output from agent
- `output.reasoning` - Reasoning/thinking output
- `output.system` - System messages (info/warning/error)
- `state.busy` - Agent is busy processing
- `state.notBusy` - Agent finished processing
- `state.idle` - Agent is idle and ready for input
- `state.aborted` - Operation was aborted
- `state.exit` - Agent is exiting
- `input.received` - Input was received by agent
- `human.request` - Agent requests human input
- `human.response` - Human response was provided
- `reset` - Agent state was reset

## Usage Examples

### Server Setup

```typescript
import { AgentTeam } from "@tokenring-ai/agent";
import { packageInfo as webHostPackage } from "@tokenring-ai/web-host";
import { packageInfo as agentApiPackage } from "@tokenring-ai/agent-api";

const team = new AgentTeam({
  webHost: { enabled: true, port: 3000 }
});

await team.addPackages([webHostPackage, agentApiPackage]);
// API available at ws://localhost:3000/ws
```

### Browser Client - Basic Usage

```typescript
import { AgentClient } from "@tokenring-ai/agent-api/client";

const client = new AgentClient(); // Connects to ws://[host]/ws
await client.connect();

// List available agents
client.listAgents();

// Listen for agent list
client.on("agentList", (data) => {
  console.log("Agents:", data.agents);
});

// Create a new agent
client.createAgent("interactiveCodeAgent");

// Listen for agent creation
client.on("agentCreated", (data) => {
  console.log("Created:", data.agentId);
  client.connectAgent(data.agentId);
});
```

### Event Handling

```typescript
// Listen for chat output
client.on("event:output.chat", (data) => {
  console.log("Agent:", data.content);
});

// Listen for reasoning
client.on("event:output.reasoning", (data) => {
  console.log("Thinking:", data.content);
});

// Listen for system messages
client.on("event:output.system", (data) => {
  console.log(`[${data.level}]`, data.message);
});

// Listen for state changes
client.on("event:state.busy", (data) => {
  console.log("Busy:", data.message);
});

client.on("event:state.idle", () => {
  console.log("Ready for input");
});
```

### Sending Input

```typescript
// Wait for agent to be ready
client.on("event:state.idle", () => {
  client.sendInput("Write a hello world function");
});

// Listen for input confirmation
client.on("event:input.received", (data) => {
  console.log("Received:", data.message);
});
```

### Human Interaction

```typescript
// Handle human input requests
client.on("event:human.request", (data) => {
  const response = prompt(data.request.message || "Input required:");
  client.sendHumanResponse(data.sequence, response);
});

// Or with custom UI
client.on("event:human.request", async (data) => {
  const response = await showCustomDialog(data.request);
  client.sendHumanResponse(data.sequence, response);
});
```

### Complete Example

```typescript
import { AgentClient } from "@tokenring-ai/agent-api/client";

const client = new AgentClient();
await client.connect();

let currentAgentId: string | null = null;

// Setup event listeners
client.on("agentCreated", (data) => {
  currentAgentId = data.agentId;
  client.connectAgent(data.agentId);
});

client.on("agentConnected", (data) => {
  console.log("Connected to agent:", data.agentId);
});

client.on("event:output.chat", (data) => {
  console.log("Agent:", data.content);
});

client.on("event:state.idle", () => {
  console.log("Agent ready");
});

client.on("event:human.request", (data) => {
  const response = prompt(data.request.message);
  client.sendHumanResponse(data.sequence, response);
});

// Create and interact with agent
client.createAgent("interactiveCodeAgent");

// Later, send input
setTimeout(() => {
  client.sendInput("Help me refactor this code");
}, 2000);

// Cleanup
process.on("SIGINT", () => {
  if (currentAgentId) {
    client.deleteAgent(currentAgentId);
  }
  client.disconnect();
});
```

### Custom WebSocket URL

```typescript
// Connect to custom host/port
const client = new AgentClient("ws://localhost:8080/ws");
await client.connect();
```

## Integration

The agent-api package requires:
- `@tokenring-ai/web-host` - Provides the Fastify server and WebSocket support
- `@tokenring-ai/agent` - Provides the agent system

Typically used with:
- `@tokenring-ai/web-frontend` - React UI that uses AgentClient

## Error Handling

```typescript
// Connection errors
try {
  await client.connect();
} catch (error) {
  console.error("Failed to connect:", error);
}

// Server errors
client.on("error", (data) => {
  console.error("Server error:", data.message);
});

// WebSocket errors
client.ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};
```

## Dependencies

- `@tokenring-ai/agent` (^0.1.0): Agent system
- `@tokenring-ai/web-host` (^0.1.0): Web server and WebSocket support

## License

MIT License - Copyright (c) 2025 Mark Dierolf
