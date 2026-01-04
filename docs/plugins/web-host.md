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
- **Command Integration**: `/webhost` command for monitoring and management

## Installation

```bash
bun install @tokenring-ai/web-host
```

## Configuration

### WebHostConfigSchema

The main configuration schema for the web host service:

```typescript
export const WebHostConfigSchema = z.object({
  host: z.string().default("127.0.0.1"),
  port: z.number().optional(),
  auth: AuthConfigSchema.optional(),
  resources: z.record(z.string(), z.discriminatedUnion("type", [
    staticResourceConfigSchema,
    spaResourceConfigSchema
  ])).optional(),
})
```

**Configuration Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `host` | string | No | `"127.0.0.1"` | Host address to bind to |
| `port` | number | No | - | Port number. If not specified, an available port is automatically assigned |
| `auth` | AuthConfig | No | - | Authentication configuration |
| `resources` | Record | No | - | Web resources to register at startup |

### AuthConfigSchema

Authentication configuration schema:

```typescript
export const AuthConfigSchema = z.object({
  users: z.record(z.string(), z.object({
    password: z.string().optional(),
    bearerToken: z.string().optional(),
  }))
})
```

**Authentication Options:**

| Option | Type | Description |
|--------|------|-------------|
| `users` | Record | Map of usernames to credentials |
| `password` | string | Optional password for Basic authentication |
| `bearerToken` | string | Optional bearer token for Bearer authentication |

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

| Option | Type | Description |
|--------|------|-------------|
| `type` | `"static"` | Discriminator for static resource type |
| `root` | string | Directory path for static files |
| `description` | string | Human-readable description |
| `indexFile` | string | Default index file name |
| `notFoundFile` | string | Optional custom 404 page |
| `prefix` | string | URL prefix for this resource |

### SPA Resource Configuration

```typescript
export const spaResourceConfigSchema = z.object({
  type: z.literal("spa"),
  file: z.string(),
  description: z.string(),
  prefix: z.string()
})
```

| Option | Type | Description |
|--------|------|-------------|
| `type` | `"spa"` | Discriminator for SPA resource type |
| `file` | string | Path to the index.html file |
| `description` | string | Human-readable description |
| `prefix` | string | URL prefix for SPA routing |

## Core Components

### WebHostService

Central service managing the Fastify server and resource registration.

```typescript
class WebHostService implements TokenRingService {
  name = "WebHostService";
  description = "Fastify web host for serving resources and APIs";

  private server!: FastifyInstance;

  resources: KeyedRegistry<WebResource>;
  registerResource = this.resources.register;
  getResources = this.resources.getAllItems;

  constructor(private app: TokenRingApp, private config: z.output<typeof WebHostConfigSchema>);

  async run(signal: AbortSignal): Promise<void>;
  getURL(): URL;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service name (`"WebHostService"`) |
| `description` | string | Service description |
| `resources` | `KeyedRegistry<WebResource>` | Registry of registered resources |
| `server` | `FastifyInstance` | The Fastify server instance |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerResource` | `(name: string, resource: WebResource) => void` | Register a new web resource |
| `getResources` | `() => Record<string, WebResource>` | Get all registered resources |
| `getURL` | `() => URL` | Get the current server URL |
| `run` | `(signal: AbortSignal) => Promise<void>` | Start the server |

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

**Constructor Options:**

| Option | Type | Description |
|--------|------|-------------|
| `config` | `StaticResourceConfig` | Configuration for the static resource |

### SPAResource Class

Serves single-page applications with proper client-side routing.

```typescript
class SPAResource implements WebResource {
  constructor(public config: z.output<typeof spaResourceConfigSchema>) {}

  async register(server: FastifyInstance): Promise<void> {
    // Validates file exists, sets up static file serving, and handles SPA routing
  }
}
```

**Constructor Options:**

| Option | Type | Description |
|--------|------|-------------|
| `config` | `SPAResourceConfig` | Configuration for the SPA resource |

### JsonRpcResource Class

Provides JSON-RPC 2.0 API endpoints with streaming support.

```typescript
class JsonRpcResource implements WebResource {
  constructor(private app: TokenRingApp, private endpoint: JsonRpcEndpoint) {}

  async register(server: FastifyInstance): Promise<void> {
    // Registers JSON-RPC API endpoints with streaming support
  }
}
```

## JSON-RPC API Implementation

### Defining RPC Schemas

```typescript
import { z } from "zod";

const calculatorSchema = {
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
const calculator = {
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

### JSON-RPC Type Utilities

```typescript
import type {
  JsonRPCSchema,
  JsonRPCImplementation,
  JsonRpcEndpoint,
  ResultOfRPCCall,
  ParamsOfRPCCall
} from "@tokenring-ai/web-host/jsonrpc/types";

// Type inference for RPC calls
type AddResult = ResultOfRPCCall<typeof calculatorSchema, "add">;
type AddParams = ParamsOfRPCCall<typeof calculatorSchema, "add">;
```

## Usage Examples

### Basic Setup

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "127.0.0.1",
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
      }
    }
  }
});

await app.addPackages([webHostPackage]);
await app.start();
```

### Complete Configuration with Authentication

```typescript
const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "0.0.0.0",
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
    },
    resources: {
      "public": {
        type: "static",
        root: "./public",
        description: "Public static files",
        indexFile: "index.html",
        prefix: "/"
      }
    }
  }
});
```

### Registering Custom Resources Programmatically

```typescript
import { WebHostService } from "@tokenring-ai/web-host";
import { WebResource } from "@tokenring-ai/web-host/types";
import { FastifyInstance } from "fastify";

// Get the web host service
const webHost = app.getServiceByType(WebHostService);

if (webHost) {
  // Create a custom API resource
  const apiResource: WebResource = {
    async register(server: FastifyInstance) {
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
}
```

### Registering JSON-RPC Resources

```typescript
import { JsonRpcResource } from "@tokenring-ai/web-host/JsonRpcResource";
import { createJsonRPCEndpoint } from "@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint";
import { z } from "zod";

const chatSchema = {
  path: "/api/chat",
  methods: {
    sendMessage: {
      type: "query" as const,
      input: z.object({ message: z.string() }),
      result: z.object({ response: z.string() })
    },
    streamMessages: {
      type: "stream" as const,
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
  notFoundFile: "404.html",
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

## Command Integration

### `/webhost` Command

The web-host package provides a `/webhost` command for monitoring:

```bash
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
├── index.ts                     # Main entry point and schemas
├── plugin.ts                    # Plugin registration
├── package.json                 # Package manifest
├── WebHostService.ts            # Main service implementation
├── StaticResource.ts            # Static file resource
├── SPAResource.ts              # SPA resource implementation
├── JsonRpcResource.ts          # JSON-RPC resource implementation
├── auth.ts                     # Authentication utilities
├── types.ts                    # Type definitions
├── commands/
│   └── webhost.ts              # Web host command
└── jsonrpc/
    ├── createJsonRPCEndpoint.ts
    ├── createJsonRPCClient.ts
    └── types.ts
```

## API Reference

### Exports from `index.ts`

```typescript
export { default as WebHostService } from "./WebHostService.js";
export { default as StaticResource } from "./StaticResource.js";
export type { WebResource } from "./types.js";
export { WebHostConfigSchema } from "./index.ts";
```

### Exports from `jsonrpc/`

```typescript
// createJsonRPCEndpoint.ts
export function createJsonRPCEndpoint<T extends JsonRPCSchema>(
  schemas: T,
  implementation: JsonRPCImplementation<T>
): JsonRpcEndpoint;

// createJsonRPCClient.ts
export default function createJsonRPCClient<T extends JsonRPCSchema>(
  baseURL: URL,
  schemas: T
): { [K in keyof T["methods"]]: ... };

export type ResultOfRPCCall<T, K> = ...;
export type ParamsOfRPCCall<T, K> = ...;
```

### Auth Functions

```typescript
export const AuthConfigSchema = z.object({ ... });
export function registerAuth(server: FastifyInstance, config: AuthConfig): void;
```

## Integration with Other Packages

The web-host package is designed to work with:

- `@tokenring-ai/agent` - Agent system integration and command registration
- `@tokenring-ai/app` - Service registration and lifecycle management
- `@tokenring-ai/chat` - Chat services and human interface
- `@tokenring-ai/utility` - Registry and utility functions
- Custom web resources for specialized functionality
- JSON-RPC endpoints for agent communication and API services

## Authentication Examples

### Basic Authentication

```bash
curl -u admin:admin123 http://localhost:3000/api/status
```

### Bearer Token Authentication

```bash
curl -H "Authorization: Bearer admin-token" http://localhost:3000/api/status
```

### Accessing User Information

```typescript
server.get("/api/whoami", async (request) => {
  return { user: (request as any).user };
});
```

## Error Handling

The JSON-RPC implementation includes proper error handling:

```typescript
// Error codes
-32600: Invalid Request (wrong JSON-RPC version)
-32601: Method not found
-32603: Internal error (validation or execution error)
```

## Best Practices

1. **Use Resource Registration**: Register resources at startup or through the plugin system for consistent initialization.

2. **Validate Configuration**: Use the provided Zod schemas to validate configuration before creating resources.

3. **Handle Streaming Properly**: When implementing stream methods, always check the `AbortSignal` to support graceful shutdown.

4. **Use Type Safety**: Leverage the type utilities (`ResultOfRPCCall`, `ParamsOfRPCCall`) for type-safe RPC interactions.

5. **Configure Authentication**: Use authentication for all production deployments to secure your APIs.

## Testing

The package includes comprehensive unit tests using Vitest:

```bash
bun test                    # Run all tests
bun test:watch             # Watch mode
bun test:coverage          # Coverage report
```

## License

MIT License - Copyright (c) 2025 Mark Dierolf
