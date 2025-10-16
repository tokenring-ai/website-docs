# Web Host Plugin

Fastify-based web server for serving resources, APIs, and WebSocket endpoints in TokenRing.

## Overview

The `@tokenring-ai/web-host` package provides a high-performance Fastify web server with WebSocket support and a pluggable resource registration system. It serves as the foundation for hosting web UIs, REST APIs, and real-time communication endpoints.

## Key Features

- **Fastify Server**: High-performance HTTP/HTTPS server
- **WebSocket Support**: Built-in WebSocket capabilities via @fastify/websocket
- **Resource Registration**: Pluggable system for registering web resources
- **Static File Serving**: Serve static files and single-page applications
- **Configurable Port**: Flexible port configuration

## Core Components

### WebHostService

Central service managing the Fastify server and resource registration.

**Key Methods:**
- `registerResource(key: string, resource: WebResource)` - Register a web resource
- `start(agentTeam: AgentTeam): Promise<void>` - Start the web server
- `stop(): Promise<void>` - Stop the web server
- `getServer(): FastifyInstance` - Get Fastify instance for advanced usage

**Properties:**
- `name` - Service name: "WebHostService"
- `description` - Service description
- `port` - Server port (default: 3000)

### WebResource Interface

Interface for pluggable web resources.

```typescript
interface WebResource {
  name: string;
  register(server: FastifyInstance): Promise<void> | void;
}
```

Resources can register:
- HTTP routes (GET, POST, PUT, DELETE, etc.)
- WebSocket endpoints
- Static file directories
- Middleware
- Any Fastify plugin functionality

## Usage Examples

### Basic Setup

```typescript
import { AgentTeam } from "@tokenring-ai/agent";
import { packageInfo } from "@tokenring-ai/web-host";

const team = new AgentTeam({
  webHost: {
    enabled: true,
    port: 3000
  }
});

await team.addPackages([packageInfo]);
// Server starts automatically and listens on port 3000
```

### Registering Custom Resources

```typescript
import { WebHostService } from "@tokenring-ai/web-host";
import type { WebResource } from "@tokenring-ai/web-host";

// Create a custom resource
const myResource: WebResource = {
  name: "MyAPI",
  async register(server) {
    server.get("/api/hello", async () => {
      return { hello: "world" };
    });
    
    server.post("/api/data", async (request, reply) => {
      const data = request.body;
      return { received: data };
    });
  }
};

// Register the resource
const webHost = team.services.getItemByType(WebHostService);
webHost.registerResource("myAPI", myResource);
```

### Serving Static Files

```typescript
import fastifyStatic from "@fastify/static";
import { join } from "path";

const staticResource: WebResource = {
  name: "StaticFiles",
  async register(server) {
    await server.register(fastifyStatic, {
      root: join(__dirname, "public"),
      prefix: "/static/",
    });
  }
};

webHost.registerResource("static", staticResource);
```

### WebSocket Endpoint

```typescript
const wsResource: WebResource = {
  name: "WebSocketAPI",
  async register(server) {
    server.get("/ws", { websocket: true }, (socket, req) => {
      socket.on("message", (data) => {
        console.log("Received:", data.toString());
        socket.send(JSON.stringify({ echo: data.toString() }));
      });
      
      socket.on("close", () => {
        console.log("Client disconnected");
      });
    });
  }
};

webHost.registerResource("websocket", wsResource);
```

### Single-Page Application

```typescript
const spaResource: WebResource = {
  name: "SPA",
  async register(server) {
    await server.register(fastifyStatic, {
      root: join(__dirname, "dist"),
      prefix: "/",
    });
    
    // Serve index.html for all routes (SPA routing)
    server.setNotFoundHandler((request, reply) => {
      reply.sendFile("index.html");
    });
  }
};

webHost.registerResource("spa", spaResource);
```

## Configuration

**WebHostConfigSchema:**
```typescript
{
  port: number;        // Server port (default: 3000)
  enabled: boolean;    // Enable/disable service (default: true)
}
```

**AgentTeam Config:**
```typescript
const team = new AgentTeam({
  webHost: {
    enabled: true,
    port: 8080
  }
});
```

## Advanced Usage

### Accessing Fastify Instance

```typescript
const webHost = team.services.getItemByType(WebHostService);
const server = webHost.getServer();

// Add custom plugins
await server.register(require("@fastify/cors"), {
  origin: "*"
});

// Add hooks
server.addHook("onRequest", async (request, reply) => {
  console.log(`${request.method} ${request.url}`);
});
```

### Multiple Resources

```typescript
// Register multiple resources
webHost.registerResource("api", apiResource);
webHost.registerResource("admin", adminResource);
webHost.registerResource("frontend", frontendResource);

// Resources are registered in order during server start
```

## Integration with Other Packages

The web-host package is designed to work with:
- `@tokenring-ai/agent-api` - WebSocket API for agent communication
- `@tokenring-ai/web-frontend` - React-based web UI
- Custom web resources for specialized functionality

## Dependencies

- `@tokenring-ai/agent` (^0.1.0): Agent system integration
- `@tokenring-ai/utility` (^0.1.0): Keyed registry
- `fastify` (^5.2.0): Web server framework
- `@fastify/websocket` (^11.0.1): WebSocket support
- `@fastify/static` (^8.0.2): Static file serving

## License

MIT License - Copyright (c) 2025 Mark Dierolf
