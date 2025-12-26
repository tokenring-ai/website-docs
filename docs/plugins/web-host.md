# Web Host Plugin

Fastify-based web server for serving resources, APIs, and applications in TokenRing, featuring comprehensive support for static files, SPAs, and JSON-RPC APIs with authentication and streaming capabilities.

## Overview

The `@tokenring-ai/web-host` package provides a high-performance Fastify web server with a pluggable resource registration system. It serves as the foundation for hosting web UIs, REST APIs, and real-time communication endpoints. The package includes authentication, resource management, and a flexible configuration system with support for JSON-RPC 2.0 APIs and streaming capabilities.

## Key Features

- **Fastify Server**: High-performance HTTP/HTTPS server with plugin architecture
- **Authentication**: Basic and Bearer token authentication
- **Resource Registration**: Pluggable system for registering web resources
- **Static File Serving**: Serve static files and directories
- **Single-Page Applications**: Serve SPA applications with proper routing
- **Configurable Port**: Flexible port configuration
- **JSON-RPC API**: Built-in JSON-RPC 2.0 support with streaming capabilities
- **WebSocket Support**: Built-in WebSocket capabilities
- **Command Integration**: `/webhost` command for monitoring and management

## Configuration

### WebHostConfigSchema

```typescript
export const WebHostConfigSchema = z.object({
  host: z.string().default("127.0.0.1"),
  port: z.number().optional(),
  auth: AuthConfigSchema.optional(),
  resources: z.record(z.string(), z.discriminatedUnion("type", [
    staticResourceConfigSchema,
    spaResourceConfigSchema,
    jsonRpcResourceConfigSchema
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

### JSON-RPC Resource Configuration

```typescript
export const jsonRpcResourceConfigSchema = z.object({
  type: z.literal("jsonrpc"),
  path: z.string(),
  methods: z.record(z.string(), z.object({
    type: z.enum(["query", "mutation", "stream"]),
    input: z.ZodType,
    result: z.ZodType
  }))
})
```

## Core Components

### WebHostService

Central service managing the Fastify server and resource registration.

```typescript
class WebHostService implements TokenRingService {
  name = "WebHostService";
  description = "Fastify web host for serving resources and APIs";
  
  private server!: FastifyInstance;
  
  resources = new KeyedRegistry<WebResource>();
  registerResource = this.resources.register;
  getResources = this.resources.getAllItems;
  
  constructor(private app: TokenRingApp, private config: WebHostConfig);
  
  async run(signal: AbortSignal): Promise<void>;
  getURL(): URL;
}
```

**Methods:**
- `registerResource(name: string, resource: WebResource)`: Register a new web resource
- `getResources()`: Get all registered resources
- `getURL()`: Get the current server URL
- `run(signal)`: Start the server (usually called automatically)

### WebResource Interface

Interface for pluggable web resources.

```typescript
interface WebResource {
  register(server: FastifyInstance): Promise<void>;
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
      childContext.register(fastifyStatic, { root, index: fileName });
      childContext.setNotFoundHandler((request, reply) => {
        reply.sendFile(fileName);
      });
      done();
    }, { prefix: this.config.prefix });
  }
}
```

### JsonRpcResource Class

Provides JSON-RPC 2.0 API endpoints with streaming support.

```typescript
class JsonRpcResource implements WebResource {
  constructor(private app: TokenRingApp, private endpoint: JsonRpcEndpoint) {}
  
  async register(server: FastifyInstance): Promise<void> {
    // Registers JSON-RPC API endpoints with streaming support
    server.post(this.endpoint.path, async (request, reply) => {
      // Implementation handles JSON-RPC request processing
    });
  }
}
```

## JSON-RPC API Implementation

### Defining RPC Schemas

```typescript
import { z } from "zod";

const calculatorSchema: JsonRPCSchema = {
  path: "/api/calc",
  methods: {
    add: {
      type: "query" as const,
      input: z.object({ a: z.number(), b: z.number() }),
      result: z.object({ result: z.number() })
    },
    streamResult: {
      type: "stream" as const,
      input: z.object({ steps: z.number() }),
      result: z.object({ step: z.number(), value: z.number() })
    }
  }
};
```

### Implementing RPC Methods

```typescript
const calculator: JsonRPCImplementation<typeof calculatorSchema> = {
  add: async (params: { a: number; b: number }, app: TokenRingApp) => ({
    result: params.a + params.b
  }),
  
  streamResult: async function* (params: { steps: number }, app: TokenRingApp, signal: AbortSignal) {
    let value = 0;
    for (let i = 0; i < params.steps; i++) {
      if (signal.aborted) break;
      value += Math.random();
      yield { step: i, value };
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};
```

### Creating JSON-RPC Endpoints

```typescript
import { createJsonRPCEndpoint } from "@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint";

const calculatorEndpoint = createJsonRPCEndpoint(calculatorSchema, calculator);
const rpcResource = new JsonRpcResource(app, calculatorEndpoint);
```

### JSON-RPC Client

```typescript
import { createJsonRPCClient } from "@tokenring-ai/web-host/jsonrpc/createJsonRPCClient";

const client = createJsonRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query methods
const result = await client.add({ a: 5, b: 3 });
console.log(result.result); // { result: 8 }

// Stream methods return async generators
for await (const update of client.streamResult({ steps: 5 })) {
  console.log(update);
}
```

## Usage Examples

### Basic Setup

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "127.0.0.0.1",
    resources: {
      "static-files": {
        type: "static",
        root: "./public",
        description: "Public static files",
        indexFile: "index.html",
        prefix: "/static"
      },
      "spa": {
        type: "spa",
        file: "./dist/index.html",
        description: "Main application",
        prefix: "/"
      },
      "calculator": {
        type: "jsonrpc",
        path: "/api/calc",
        methods: {
          add: {
            type: "query",
            input: z.object({ a: z.number(), b: z.number() }),
            result: z.object({ result: z.number() })
          }
        }
      }
    }
  }
});

await app.addPackages([webHostPackage]);
await app.start();
```

### Registering Custom Resources Programmatically

```typescript
import { WebHostService } from "@tokenring-ai/web-host";
import { JsonRpcResource } from "@tokenring-ai/web-host/jsonrpc/JsonRpcResource";
import { createJsonRPCEndpoint } from "@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint";
import { z } from "zod";

// Get the web host service
const webHost = app.getServiceByType(WebHostService);

if (webHost) {
  // Create a custom API resource
  const apiResource: WebResource = {
    async register(server) {
      server.get("/api/health", async () => {
        return { status: "ok" };
      });
      
      server.post("/api/data", async (request, reply) => {
        const data = request.body;
        return { received: data };
      });
    }
  };
  
  webHost.registerResource("customAPI", apiResource);
  
  // Create JSON-RPC endpoint
  const chatSchema = {
    path: "/api/chat",
    methods: {
      sendMessage: {
        type: "query",
        input: z.object({ message: z.string() }),
        result: z.object({ response: z.string() })
      },
      streamMessages: {
        type: "stream",
        input: z.object({ count: z.number() }),
        result: z.object({ message: z.string() })
      }
    }
  };
  
  const chatImplementation = {
    sendMessage: async (params: { message: string }, app: TokenRingApp) => ({
      response: `You said: ${params.message}`
    }),
    
    streamMessages: async function* (params: { count: number }, app: TokenRingApp, signal: AbortSignal) {
      for (let i = 0; i < params.count; i++) {
        if (signal.aborted) break;
        yield { message: `Message ${i + 1}` };
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };
  
  const chatEndpoint = createJsonRPCEndpoint(chatSchema, chatImplementation);
  const chatResource = new JsonRpcResource(app, chatEndpoint);
  
  webHost.registerResource("chatAPI", chatResource);
}
```

### Authentication Setup

```typescript
const app = new TokenRingApp({
  webHost: {
    port: 3000,
    auth: {
      users: {
        "admin": {
          password: "admin123",
          bearerToken: "admin-token"
        },
        "api-user": {
          bearerToken: "api-key-abc123"
        }
      }
    }
  }
});
```

### Serving Static Files

```typescript
import { StaticResource } from "@tokenring-ai/web-host";

// Add custom static resource
const staticResource = new StaticResource({
  type: "static",
  root: "./public",
  description: "Public static files",
  indexFile: "index.html",
  prefix: "/static"
});

webHost.registerResource("public", staticResource);
```

### Serving Single-Page Application

```typescript
import { SPAResource } from "@tokenring-ai/web-host";

const spaResource = new SPAResource({
  type: "spa",
  file: "./dist/index.html",
  description: "Main application",
  prefix: "/"
});

webHost.registerResource("frontend", spaResource);
```

### Using the WebHost Command

The web-host package provides a `/webhost` command for monitoring:

```bash
# Show web host URL and registered resources
/webhost

# Output:
# Web host running at: http://localhost:3000
# Registered resources:
#   - static-files
#   - spa
#   - calculator
#   - customAPI
#   - chatAPI
```

## Package Structure

```
pkg/web-host/
├── index.ts                # Main entry point and schemas
├── plugin.ts              # Plugin registration
├── package.json           # Package manifest
├── auth.ts                # Authentication utilities
├── WebHostService.ts      # Main service implementation
├── StaticResource.ts      # Static file resource
├── SPAResource.ts         # SPA resource implementation
├── JsonRpcResource.ts     # JSON-RPC resource implementation
├── types.ts               # Type definitions
├── commands/              # Command definitions
│   └── webhost.ts         # Web host commands
└── jsonrpc/               # JSON-RPC implementation
    ├── createJsonRPCEndpoint.ts
    ├── createJsonRPCClient.ts
    └── types.ts
```

## Integration with Other Packages

The web-host package is designed to work with:

- `@tokenring-ai/agent` - Agent system integration and command registration
- `@tokenring-ai/app` - Service registration and lifecycle management
- `@tokenring-ai/chat` - Chat services and human interface
- Custom web resources for specialized functionality
- JSON-RPC endpoints for agent communication and API services

## Dependencies

- `@tokenring-ai/agent` (^0.2.0): Agent system integration
- `@tokenring-ai/app` (^0.2.0): Application framework
- `@tokenring-ai/chat` (^0.2.0): Chat services
- `@tokenring-ai/utility` (^0.2.0): Utility functions
- `fastify` (^5.6.2): Web server framework
- `@fastify/static` (^8.3.0): Static file serving
- `zod`: Validation library

## License

MIT License - Copyright (c) 2025 Mark Dierolf