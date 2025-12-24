# Web Host Plugin

Fastify-based web server for serving resources, APIs, and applications in TokenRing.

## Overview

The `@tokenring-ai/web-host` package provides a high-performance Fastify web server with a pluggable resource registration system. It serves as the foundation for hosting web UIs, REST APIs, and real-time communication endpoints. The package includes authentication, resource management, and a flexible configuration system.

## Key Features

- **Fastify Server**: High-performance HTTP/HTTPS server
- **Authentication**: Basic and Bearer token authentication
- **Resource Registration**: Pluggable system for registering web resources
- **Static File Serving**: Serve static files and directories
- **Single-Page Applications**: Serve SPA applications with proper routing
- **Configurable Port**: Flexible port configuration
- **WebSocket Support**: Built-in WebSocket capabilities

## Configuration

### WebHostConfigSchema

```typescript
export const WebHostConfigSchema = z.object({
  host: z.string().default("127.0.0.1"),
  port: z.number().optional(),
  auth: AuthConfigSchema.optional(),
  resources: z.record(z.string(), z.discriminatedUnion("type", [
    staticResourceConfigSchema,
    spaResourceSchema,
  ])).optional(),
})
```

### AuthConfigSchema

```typescript
export const AuthConfigSchema = z.object({
  users: z.record(z.string(), z.object({
    password: z.string().optional(),
    bearerToken: z.string().optional(),
  }))
})
```

### Static Resource Configuration

```typescript
export const staticResourceConfigSchema = z.object({
  type: z.literal("static"),
  root: z.string(),
  description: z.string(),
  indexFile: z.string(),
  notFoundFile: z.string().optional(),
  prefix: z.string()
})
```

### SPA Resource Configuration

```typescript
export const spaResourceConfigSchema = z.object({
  type: z.literal("spa"),
  file: z.string(),
  description: z.string(),
  prefix: z.string()
})
```

## Core Components

### WebHostService

Central service managing the Fastify server and resource registration.

**Key Methods:**
- `registerResource(key: string, resource: WebResource)` - Register a web resource
- `start()` - Start the web server
- `stop()` - Stop the web server
- `getServer(): FastifyInstance` - Get Fastify instance for advanced usage

**Properties:**
- `name` - Service name: "WebHostService"
- `description` - Service description
- `config` - Current configuration

### WebResource Interface

Interface for pluggable web resources.

```typescript
interface WebResource {
  register(server: FastifyInstance): Promise<void> | void;
}
```

### StaticResource Class

Serves static files from a directory.

```typescript
class StaticResource implements WebResource {
  constructor(private config: z.output<typeof staticResourceConfigSchema>) {}
  
  async register(server: FastifyInstance): Promise<void> {
    await server.register(fastifyStatic, {
      root: this.config.root,
      prefix: this.config.prefix,
      index: this.config.indexFile
    });

    if (this.config.notFoundFile) {
      server.setNotFoundHandler((request, reply) => {
        reply.sendFile(this.config.notFoundFile!);
      });
    }
  }
}
```

### SPAResource Class

Serves single-page applications with proper routing.

```typescript
class SPAResource implements WebResource {
  constructor(public config: z.output<typeof spaResourceConfigSchema>) {}
  
  async register(server: FastifyInstance): Promise<void> {
    try {
      await fs.access(this.config.file);
    } catch (error) {
      console.log(`SPA file does not exist: ${this.config.file}`);
    }

    const root = path.dirname(this.config.file);
    const fileName = path.basename(this.config.file);

    await server.register((childContext, _, done) => {
      childContext.register(fastifyStatic, {root, index: fileName});
      childContext.setNotFoundHandler((request, reply) => {
        reply.sendFile(fileName);
      });
      done();
    }, { prefix: this.config.prefix });
  }
}
```

## Usage Examples

### Basic Setup

```typescript
import { AgentTeam } from "@tokenring-ai/agent";
import { packageInfo } from "@tokenring-ai/web-host";

const team = new AgentTeam({
  webHost: {
    enabled: true,
    host: "127.0.0.1",
    port: 3000,
    resources: {
      "api": {
        type: "static",
        root: "./api",
        description: "API endpoints",
        indexFile: "index.html",
        prefix: "/api"
      },
      "dashboard": {
        type: "spa",
        file: "./dist/index.html",
        description: "Dashboard SPA",
        prefix: "/"
      }
    }
  }
});

await team.addPackages([packageInfo]);
// Server starts automatically and listens on port 3000
```

### Registering Custom Resources Programmatically

```typescript
import { WebHostService } from "@tokenring-ai/web-host";
import type { WebResource } from "@tokenring-ai/web-host";

// Create a custom API resource
const apiResource: WebResource = {
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

// Get the web host service
const webHost = team.services.getItemByType(WebHostService);
if (webHost) {
  webHost.registerResource("customAPI", apiResource);
}
```

### Authentication Setup

```typescript
const team = new AgentTeam({
  webHost: {
    enabled: true,
    port: 3000,
    auth: {
      users: {
        "admin": {
          password: "admin123",
          bearerToken: "admin-token"
        },
        "user": {
          bearerToken: "user-token"
        }
      }
    }
  }
});
```

### Serving Static Files

```typescript
import fastifyStatic from "@fastify/static";
import { join } from "path";

const staticResource: WebResource = {
  async register(server) {
    await server.register(fastifyStatic, {
      root: join(__dirname, "public"),
      prefix: "/static/",
    });
  }
};

webHost.registerResource("static", staticResource);
```

### Serving Single-Page Application

```typescript
const spaResource: WebResource = {
  async register(server) {
    await server.register((childContext, _, done) => {
      childContext.register(fastifyStatic, {
        root: "./dist",
        index: "index.html"
      });
      childContext.setNotFoundHandler((request, reply) => {
        reply.sendFile("index.html");
      });
      done();
    }, { prefix: "/" });
  }
};

webHost.registerResource("frontend", spaResource);
```

## Package Structure

```
pkg/web-host/
├── index.ts                # Main entry point and schemas
├── plugin.ts              # Plugin registration
├── package.json           # Package manifest
├── auth.ts                # Authentication utilities
├── WebHostService.js      # Main service implementation
├── StaticResource.ts      # Static file resource
├── SPAResource.ts         # SPA resource implementation
└── commands/              # Command definitions
    └── webhost.js         # Web host commands
```

## Integration with Other Packages

The web-host package is designed to work with:

- `@tokenring-ai/agent-api` - WebSocket API for agent communication
- `@tokenring-ai/web-frontend` - React-based web UI
- `@tokenring-ai/agent` - Agent system integration
- Custom web resources for specialized functionality

## Dependencies

- `@tokenring-ai/agent` (^0.2.0): Agent system integration
- `@tokenring-ai/app` (^0.2.0): Application framework
- `@tokenring-ai/agent` (^0.2.0): Agent services
- `@tokenring-ai/chat` (^0.2.0): Chat services
- `@tokenring-ai/utility` (^0.2.0): Utility functions
- `fastify` (^5.6.2): Web server framework
- `@fastify/static` (^8.3.0): Static file serving
- `zod`: Validation library

## License

MIT License - Copyright (c) 2025 Mark Dierolf