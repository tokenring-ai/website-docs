# Web Host Plugin

Fastify-based web server for serving resources, APIs, and applications in TokenRing, featuring comprehensive support for static files, SPAs, and JSON-RPC APIs with authentication and streaming capabilities.

## Overview

The `@tokenring-ai/web-host` package provides a high-performance Fastify web server with a pluggable resource registration system. It serves as the foundation for hosting web UIs, REST APIs, and real-time communication endpoints. The package includes authentication, resource management, and a flexible configuration system with support for JSON-RPC 2.0 APIs and WebSocket RPC with streaming capabilities.

## Key Features

- **Fastify Server**: High-performance HTTP/HTTPS server with plugin architecture
- **Authentication**: Basic and Bearer token authentication
- **Resource Registration**: Pluggable system for registering web resources
- **Static File Serving**: Serve static files and directories
- **Single-Page Applications**: Serve SPA applications with proper routing
- **Configurable Port**: Flexible port configuration
- **JSON-RPC API**: Built-in JSON-RPC 2.0 support with streaming capabilities
- **WebSocket RPC**: WebSocket-based RPC with real-time streaming
- **Command Integration**: `/webhost` command for monitoring and management
- **Automatic Endpoint Registration**: Automatic registration of RPC endpoints during startup

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
  getResourceEntries = this.resources.entries;

  constructor(private app: TokenRingApp, private config: ParsedWebHostConfig);

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
| `getResourceEntries` | `() => Iterable<[string, WebResource]>` | Get all registered resources as key-value pairs |
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
  constructor(private app: TokenRingApp, private jsonRpcEndpoint: RpcEndpoint) {}

  async register(server: FastifyInstance): Promise<void> {
    // Registers JSON-RPC API endpoints with streaming support
  }
}
```

### WsRpcResource Class

Provides WebSocket-based RPC endpoints for real-time communication.

```typescript
class WsRpcResource implements WebResource {
  constructor(private app: TokenRingApp, private jsonRpcEndpoint: RpcEndpoint) {}

  async register(server: FastifyInstance): Promise<void> {
    // Registers WebSocket RPC endpoints with streaming support
  }
}
```

## JSON-RPC API Implementation

### Defining RPC Schemas

RPC endpoints are defined using the schema format from `@tokenring-ai/rpc`:

```typescript
import { z } from "zod";
import { RpcSchema } from "@tokenring-ai/rpc/types";

const calculatorSchema: RpcSchema = {
  name: "Calculator",
  path: "/api/calc",
  methods: {
    add: {
      type: "query" as const,
      input: z.object({ a: z.number(), b: z.number() }),
      result: z.object({ result: z.number() })
    },
    multiply: {
      type: "mutation" as const,
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

  multiply: async (params: { a: number; b: number }, app: TokenRingApp) => ({
    result: params.a * params.b
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
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";

const endpoint = createRPCEndpoint(calculatorSchema, calculator);
```

### Automatic Endpoint Registration

When using the web-host plugin, RPC endpoints are automatically registered during the `start` phase:

```typescript
// In plugin.ts, during the start phase:
// 1. Get all endpoints from RpcService
// 2. Create JsonRpcResource for HTTP JSON-RPC endpoints
// 3. Create WsRpcResource for WebSocket RPC endpoints
```

### JSON-RPC Client

```typescript
import { createJsonRPCClient } from "@tokenring-ai/web-host/createJsonRPCClient";

const client = createJsonRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query/mutation methods
const result = await client.add({ a: 5, b: 3 });
console.log(result.result); // { result: 8 }

// Stream methods return async generators
for await (const update of client.streamResult({ steps: 5 }, signal)) {
  console.log(update);
}
```

### WebSocket RPC Client

```typescript
import { createWsRPCClient } from "@tokenring-ai/web-host/createWsRPCClient";

const wsClient = createWsRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query/mutation methods
const result = await wsClient.add({ a: 5, b: 3 });
console.log(result.result); // { result: 8 }

// Stream methods return async generators
for await (const update of wsClient.streamResult({ steps: 5 }, signal)) {
  console.log(update);
}
```

### JSON-RPC Type Utilities

```typescript
import type {
  FunctionTypeOfRPCCall,
  ResultOfRPCCall,
  ParamsOfRPCCall,
  RPCSchema
} from "@tokenring-ai/rpc/types";

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
    host: "127.0.0.1"
  }
});

await app.addPlugin(webHostPackage);
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

await app.addPlugin(webHostPackage);
await app.start();
```

### Registering Custom Resources Programmatically

```typescript
import { WebHostService } from "@tokenring-ai/web-host";
import { WebResource } from "@tokenring-ai/web-host/types";

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
}
```

### Registering JSON-RPC Resources

```typescript
import { JsonRpcResource } from "@tokenring-ai/web-host/JsonRpcResource";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import { RpcService } from "@tokenring-ai/rpc";
import { z } from "zod";

const chatSchema = {
  name: "Chat",
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

const endpoint = createRPCEndpoint(chatSchema, chatImplementation);

// Register with RpcService (web-host plugin will automatically create resources)
const rpcService = app.getService(RpcService);
rpcService.registerEndpoint("chat", endpoint);
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

## Plugin Integration

### Plugin Registration

The web-host package integrates as a plugin with two phases:

**Install Phase:**
- Creates WebHostService with provided configuration
- Registers resources from configuration
- Registers `/webhost` command with AgentCommandService

**Start Phase:**
- Starts the Fastify server
- Automatically creates JsonRpcResource and WsRpcResource for each RPC endpoint registered with RpcService
- Logs registered endpoint paths

### Plugin Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "0.0.0.0",
    auth: {
      users: {
        "admin": {
          password: "secret123",
          bearerToken: "admin-token"
        }
      }
    },
    resources: {
      "static-files": {
        type: "static",
        root: "./public",
        description: "Static files",
        indexFile: "index.html",
        prefix: "/static"
      }
    }
  }
});

await app.addPlugin(webHostPackage);
await app.start();
```

## Chat Commands

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

**Command Description:** Displays the current web host URL and lists all registered resources.

## Package Structure

```
pkg/web-host/
├── index.ts                     # Main entry point and exports
├── plugin.ts                    # Plugin definition for TokenRing integration
├── package.json                 # Package manifest
├── WebHostService.ts            # Main service implementation
├── StaticResource.ts            # Static file resource
├── SPAResource.ts              # SPA resource implementation
├── JsonRpcResource.ts          # JSON-RPC resource implementation
├── WsRpcResource.ts            # WebSocket RPC resource implementation
├── auth.ts                     # Authentication utilities
├── types.ts                    # Type definitions
├── schema.ts                   # Configuration schemas
├── createJsonRPCClient.ts      # HTTP JSON-RPC client
├── createWsRPCClient.ts        # WebSocket RPC client
├── commands/
│   └── webhost.ts              # /webhost command
└── vitest.config.ts            # Vitest configuration
```

## API Reference

### Exports from `index.ts`

```typescript
export { default as WebHostService } from "./WebHostService.js";
export { default as StaticResource } from "./StaticResource.js";
export { default as JsonRpcResource } from "./JsonRpcResource.js";
export { default as WsRpcResource } from "./WsRpcResource.js";
export { default as SPAResource } from "./SPAResource.js";
export { default as createJsonRPCClient } from "./createJsonRPCClient.js";
export { default as createWsRPCClient } from "./createWsRPCClient.js";
export type { WebResource } from "./types.js";
export { AuthConfigSchema, WebHostConfigSchema } from "./schema.js";
export type { ParsedAuthConfig, ParsedWebHostConfig } from "./schema.js";
export { spaResourceConfigSchema } from "./SPAResource.js";
export { staticResourceConfigSchema } from "./StaticResource.js";
```

### Exports from `auth.ts`

```typescript
export const AuthConfigSchema: ZodSchema<AuthConfig>;
export function registerAuth(server: FastifyInstance, config: AuthConfig): void;
```

## Integration with Other Packages

The web-host package is designed to work with:

- `@tokenring-ai/agent` - Agent system integration and command registration
- `@tokenring-ai/app` - Service registration and lifecycle management
- `@tokenring-ai/chat` - Chat services and human interface
- `@tokenring-ai/rpc` - RPC endpoint registration and execution
- `@tokenring-ai/utility` - Registry and utility functions
- Custom web resources for specialized functionality

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

The JSON-RPC implementation includes proper error handling with standard JSON-RPC 2.0 error codes:

| Error Code | Description |
|------------|-------------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid Request (wrong JSON-RPC version) |
| -32601 | Method not found |
| -32603 | Internal error (validation or execution error) |

## Best Practices

1. **Use Resource Registration**: Register resources at startup or through the plugin system for consistent initialization.

2. **Validate Configuration**: Use the provided Zod schemas to validate configuration before creating resources.

3. **Handle Streaming Properly**: When implementing stream methods, always check the `AbortSignal` to support graceful shutdown.

4. **Use Type Safety**: Leverage the type utilities (`ResultOfRPCCall`, `ParamsOfRPCCall`) for type-safe RPC interactions.

5. **Configure Authentication**: Use authentication for all production deployments to secure your APIs.

6. **Automatic Endpoint Registration**: Let the web-host plugin automatically create JSON-RPC and WebSocket RPC resources from RpcService endpoints.

## Testing

The package includes comprehensive unit and integration tests using Vitest:

```bash
bun test                    # Run all tests
bun test:watch             # Watch mode
bun test:coverage          # Coverage report
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Base application framework with service management and plugin architecture
- `@tokenring-ai/agent` (0.2.0) - Agent system with state management
- `@tokenring-ai/chat` (0.2.0) - Chat service for human interaction
- `@tokenring-ai/utility` (0.2.0) - Shared utilities and helpers
- `@tokenring-ai/rpc` (0.2.0) - RPC endpoint registration and execution
- `fastify` (^5.7.4) - High-performance web server
- `@fastify/websocket` (^11.2.0) - WebSocket support for Fastify
- `@fastify/static` (^9.0.0) - Static file serving for Fastify
- `zod` (^4.3.6) - Schema validation
- `ws` (^8.19.0) - WebSocket implementation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler
- `@types/ws` (^8.18.1) - WebSocket type definitions

## License

MIT License - Copyright (c) 2025 Mark Dierolf
