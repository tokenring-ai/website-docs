# Web Host Plugin

Fastify-based web server for serving resources, APIs, and applications in TokenRing, featuring comprehensive support for static files, SPAs, and JSON-RPC APIs with authentication and streaming capabilities.

## Overview

The `@tokenring-ai/web-host` package provides a high-performance Fastify web server with a pluggable resource registration system. It serves as the foundation for hosting web UIs, REST APIs, and real-time communication endpoints. The package includes authentication, resource management, and a flexible configuration system with support for JSON-RPC 2.0 APIs and WebSocket RPC with streaming capabilities.

## Key Features

- **Fastify Server**: High-performance HTTP server with plugin architecture
- **Authentication**: Basic and Bearer token authentication with per-user credentials
- **Resource Registration**: Pluggable system for registering web resources via KeyedRegistry
- **Static File Serving**: Serve static files and directories with custom not-found handling
- **Single-Page Applications**: Serve SPA applications with proper client-side routing
- **Configurable Port**: Flexible port configuration with automatic port assignment
- **JSON-RPC API**: Built-in JSON-RPC 2.0 support with streaming via Server-Sent Events
- **WebSocket RPC**: WebSocket-based RPC with real-time streaming support
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

Authentication configuration schema supporting both Basic and Bearer token authentication:

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

**Note:** Each user can have either a password, a bearer token, or both. Users without either credential cannot authenticate.

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

**SPA Routing Behavior:**

- Static files (JS, CSS, images) are served by the `fastifyStatic` middleware
- The root path (`/` or with prefix) serves the specified index.html file
- All other routes that don't match static files also serve index.html (for client-side routing)
- If the SPA file doesn't exist, a warning is logged but the server continues

## Core Components

### WebHostService

Central service managing the Fastify server and resource registration.

```typescript
class WebHostService implements TokenRingService {
  name = "WebHostService";
  description = "Fastify web host for serving resources and APIs";

  resources: KeyedRegistry<WebResource>;
  registerResource = this.resources.register;
  getResourceEntries = this.resources.entries;

  constructor(app: TokenRingApp, config: ParsedWebHostConfig);

  async start(signal: AbortSignal): Promise<void>;
  async stop(): Promise<void>;
  getURL(): URL;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service name (`"WebHostService"`) |
| `description` | string | Service description |
| `resources` | `KeyedRegistry<WebResource>` | Registry of registered resources |
| `registerResource` | `(name: string, resource: WebResource) => void` | Method to register resources |
| `getResourceEntries` | `() => Iterable<[string, WebResource]>` | Method to get all resources |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `(signal: AbortSignal) => Promise<void>` | Start the Fastify server and register all resources |
| `stop` | `() => Promise<void>` | Stop the server and close all connections |
| `getURL` | `() => URL` | Get the current server URL |

**Server Lifecycle:**

1. **Start Phase:**
   - Registers WebSocket support via `@fastify/websocket`
   - Registers authentication if configured
   - Registers all web resources
   - Binds to configured host and port
   - Logs the server URL

2. **Stop Phase:**
   - Closes the server and all active connections

### WebResource Interface

Interface for pluggable web resources.

```typescript
interface WebResource {
  register(server: FastifyInstance): Promise<void>;
}
```

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(server: FastifyInstance) => Promise<void>` | Register routes, handlers, and middleware |

### StaticResource Class

Serves static files from a directory using `@fastify/static`.

```typescript
class StaticResource implements WebResource {
  constructor(config: z.output<typeof staticResourceConfigSchema>)

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

**Configuration:**

| Option | Type | Description |
|--------|------|-------------|
| `type` | `"static"` | Resource type discriminator |
| `root` | string | Directory containing static files |
| `description` | string | Human-readable description |
| `indexFile` | string | Default file to serve for directory requests |
| `notFoundFile` | string | Optional custom 404 page |
| `prefix` | string | URL prefix (e.g., `/static`) |

**Behavior:**

- Files are served under the specified prefix
- Index file is served for directory requests
- Custom 404 page is served if `notFoundFile` is configured

### SPAResource Class

Serves single-page applications with proper client-side routing support.

```typescript
class SPAResource implements WebResource {
  constructor(config: z.output<typeof spaResourceConfigSchema>)

  async register(server: FastifyInstance): Promise<void> {
    // Validates file exists
    // Registers static file serving for SPA directory
    // Handles root path with index.html
    // Sets not-found handler for client-side routes
  }
}
```

**Configuration:**

| Option | Type | Description |
|--------|------|-------------|
| `type` | `"spa"` | Resource type discriminator |
| `file` | string | Path to the SPA index.html file |
| `description` | string | Human-readable description |
| `prefix` | string | URL prefix (e.g., `/app`) |

**Routing Behavior:**

- **Static files**: Served directly by `fastifyStatic` middleware
- **Root path**: Serves the SPA index.html file
- **Client-side routes**: All non-static-file requests serve index.html
- **Missing files**: Logs warning if SPA file doesn't exist

**Example Routing:**

```
/app/           → index.html
/app/dashboard  → index.html (client-side routing)
/app/main.js    → main.js (static file)
/app/missing.css → 404 (file doesn't exist)
```

### JsonRpcResource Class

Provides JSON-RPC 2.0 API endpoints with streaming support via Server-Sent Events.

```typescript
class JsonRpcResource implements WebResource {
  constructor(app: TokenRingApp, jsonRpcEndpoint: RpcEndpoint)

  async register(server: FastifyInstance): Promise<void> {
    // Registers POST endpoint for JSON-RPC calls
    // Handles query, mutation, and stream methods
    // Stream methods use Server-Sent Events (text/event-stream)
  }
}
```

**JSON-RPC Error Codes:**

| Error Code | Description |
|------------|-------------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid Request (wrong JSON-RPC version) |
| -32601 | Method not found |
| -32603 | Internal error (validation or execution error) |

**Streaming Behavior:**

- Stream methods return Server-Sent Events (SSE) format
- Content-Type: `text/event-stream`
- Each event is prefixed with `data:` and followed by `\n\n`
- Client can abort the stream by closing the connection

### WsRpcResource Class

Provides WebSocket-based RPC endpoints for real-time communication.

```typescript
class WsRpcResource implements WebResource {
  constructor(app: TokenRingApp, jsonRpcEndpoint: RpcEndpoint)

  async register(server: FastifyInstance): Promise<void> {
    // Registers WebSocket endpoint at the same path as JSON-RPC
    // Handles query, mutation, and stream methods
    // Stream methods emit individual JSON-RPC responses
  }
}
```

**WebSocket Message Format:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

**Streaming Behavior:**

- Stream methods emit individual JSON-RPC responses
- Stream ends with `{"stream": "end"}` marker
- Errors are sent as JSON-RPC error responses
- Client can close the WebSocket to abort streaming

## JSON-RPC API Implementation

### RPC Endpoint Structure

RPC endpoints are defined using the `RpcEndpoint` type from `@tokenring-ai/rpc`:

```typescript
import { z } from "zod";
import type { RpcEndpoint } from "@tokenring-ai/rpc/types";

const calculatorEndpoint: RpcEndpoint = {
  name: "Calculator",
  path: "/api/calc",
  methods: {
    add: {
      type: "query",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      resultSchema: z.object({ result: z.number() }),
      execute: async (params, app) => ({ result: params.a + params.b })
    },
    multiply: {
      type: "mutation",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      resultSchema: z.object({ result: z.number() }),
      execute: async (params, app) => ({ result: params.a * params.b })
    },
    streamResult: {
      type: "stream",
      inputSchema: z.object({ steps: z.number() }),
      resultSchema: z.object({ step: number, value: number }),
      execute: async function* (params, app, signal) {
        let value = 0;
        for (let i = 0; i < params.steps; i++) {
          if (signal.aborted) break;
          value += Math.random();
          yield { step: i, value };
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }
};
```

### Method Types

**Query Methods:**

- Read-only operations
- Return a single result
- No side effects

**Mutation Methods:**

- Operations that modify state
- Return a single result
- May have side effects

**Stream Methods:**

- Operations that emit a sequence of results
- Return an async generator
- Support abort via AbortSignal
- JSON-RPC: SSE format, WebSocket: individual messages

### Creating RPC Endpoints

```typescript
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";

const endpoint = createRPCEndpoint(calculatorSchema, calculatorImplementation);
```

### Automatic Endpoint Registration

When using the web-host plugin, RPC endpoints are automatically registered during the `start` phase:

```typescript
// In plugin.ts, during the start phase:
// 1. Get all endpoints from RpcService
// 2. For each endpoint:
//    - Create JsonRpcResource for HTTP JSON-RPC
//    - Create WsRpcResource for WebSocket RPC
//    - Log the endpoint path
```

## JSON-RPC Clients

### HTTP JSON-RPC Client

```typescript
import { createJsonRPCClient } from "@tokenring-ai/web-host/createJsonRPCClient";
import type { RPCSchema } from "@tokenring-ai/rpc/types";

const calculatorSchema: RPCSchema = {
  name: "Calculator",
  path: "/api/calc",
  methods: {
    add: {
      type: "query",
      input: z.object({ a: z.number(), b: z.number() }),
      result: z.object({ result: z.number() })
    },
    streamResult: {
      type: "stream",
      input: z.object({ steps: z.number() }),
      result: z.object({ step: number, value: number })
    }
  }
};

const client = createJsonRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query/mutation methods
const result = await client.add({ a: 5, b: 3 });
console.log(result); // { result: 8 }

// Stream methods return async generators
for await (const update of client.streamResult({ steps: 5 }, signal)) {
  console.log(update);
}
```

**Error Handling:**

```typescript
try {
  const result = await client.add({ a: 5, b: 3 });
} catch (error) {
  console.error("RPC call failed:", error.message);
}
```

**Streaming with Abort:**

```typescript
const controller = new AbortController();

// Start streaming
const stream = client.streamResult({ steps: 10 }, controller.signal);

// Stop after 3 updates
let count = 0;
for await (const update of stream) {
  console.log(update);
  if (++count >= 3) {
    controller.abort();
    break;
  }
}
```

### WebSocket RPC Client

```typescript
import { createWsRPCClient } from "@tokenring-ai/web-host/createWsRPCClient";
import type { RPCSchema } from "@tokenring-ai/rpc/types";

const wsClient = createWsRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query/mutation methods
const result = await wsClient.add({ a: 5, b: 3 });
console.log(result); // { result: 8 }

// Stream methods return async generators
for await (const update of wsClient.streamResult({ steps: 5 }, signal)) {
  console.log(update);
}
```

**WebSocket Client Behavior:**

- Automatically manages WebSocket connection
- Queues requests if connection is not yet open
- Handles connection errors and reconnection attempts
- Supports streaming with abort signals

**Error Handling:**

```typescript
try {
  const result = await wsClient.add({ a: 5, b: 3 });
} catch (error) {
  if (error.message === "Socket closed") {
    console.error("WebSocket connection closed");
  } else {
    console.error("RPC call failed:", error.message);
  }
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
    host: "127.0.0.1"
  }
});

await app.addPlugin(webHostPackage);
await app.start();

// Server will be available at http://127.0.0.1:3000
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
import type { WebResource } from "@tokenring-ai/web-host/types";

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

      // Access authenticated user if authentication is enabled
      server.get("/api/whoami", async (request) => {
        return { user: (request as any).user };
      });
    }
  };

  webHost.registerResource("customAPI", apiResource);
}
```

### Registering JSON-RPC Resources

```typescript
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
  sendMessage: async (params: { message: string }, app) => ({
    response: `You said: ${params.message}`
  }),

  streamMessages: async function* (params: { count: number }, app, signal) {
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

1. Creates `WebHostService` with provided configuration
2. Registers resources from configuration (StaticResource, SPAResource)
3. Registers `/webhost` command with AgentCommandService

**Start Phase:**

1. Starts the Fastify server
2. Automatically creates `JsonRpcResource` and `WsRpcResource` for each RPC endpoint registered with `RpcService`
3. Logs registered endpoint paths

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

**Help Text:**

```markdown
# /webhost

## Description
Displays the current web host URL and lists all registered resources.

## Usage
/webhost

## Output
- Web host URL with port
- List of registered resources and their names

## Example
/webhost
# Output:
# Web host running at: http://localhost:3000
# Registered resources:
#   - trpcBackend
#   - defaultFrontend
```

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
export const AuthConfigSchema: ZodSchema<ParsedAuthConfig>;
export function registerAuth(server: FastifyInstance, config: ParsedAuthConfig): void;
```

### Exports from `schema.ts`

```typescript
export const AuthConfigSchema: ZodSchema<ParsedAuthConfig>;
export const WebHostConfigSchema: ZodSchema<ParsedWebHostConfig>;
export type ParsedAuthConfig: z.output<typeof AuthConfigSchema>;
export type ParsedWebHostConfig: z.output<typeof WebHostConfigSchema>;
```

## Integration with Other Packages

The web-host package is designed to work with:

- `@tokenring-ai/agent` - Agent system integration and command registration
- `@tokenring-ai/app` - Service registration and lifecycle management
- `@tokenring-ai/chat` - Chat services and human interface
- `@tokenring-ai/rpc` - RPC endpoint registration and execution
- `@tokenring-ai/utility` - Registry and utility functions
- Custom web resources for specialized functionality

## Authentication

### Basic Authentication

```bash
curl -u admin:admin123 http://localhost:3000/api/status
```

### Bearer Token Authentication

```bash
curl -H "Authorization: Bearer admin-token" http://localhost:3000/api/status
```

### Accessing User Information

When authentication is enabled, the authenticated username is available in request handlers:

```typescript
server.get("/api/whoami", async (request: FastifyRequest) => {
  const user = (request as any).user;
  return { user };
});
```

**Note:** The `user` property is added to the request object by the authentication hook.

## Error Handling

### JSON-RPC Errors

The JSON-RPC implementation includes proper error handling with standard JSON-RPC 2.0 error codes:

| Error Code | Description |
|------------|-------------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid Request (wrong JSON-RPC version) |
| -32601 | Method not found |
| -32603 | Internal error (validation or execution error) |

### HTTP Errors

- **401 Unauthorized**: Authentication required but not provided or invalid credentials
- **404 Not Found**: Resource not found (for static files with custom notFoundFile)

### WebSocket Errors

- Connection errors are propagated to the client
- Stream errors are sent as JSON-RPC error responses

## Best Practices

1. **Use Resource Registration**: Register resources at startup or through the plugin system for consistent initialization.

2. **Validate Configuration**: Use the provided Zod schemas to validate configuration before creating resources.

3. **Handle Streaming Properly**: When implementing stream methods, always check the `AbortSignal` to support graceful shutdown.

4. **Use Type Safety**: Leverage the type utilities (`FunctionTypeOfRPCCall`, `ResultOfRPCCall`, `ParamsOfRPCCall`) for type-safe RPC interactions.

5. **Configure Authentication**: Use authentication for all production deployments to secure your APIs.

6. **Automatic Endpoint Registration**: Let the web-host plugin automatically create JSON-RPC and WebSocket RPC resources from RpcService endpoints.

7. **SPA Routing**: Use SPAResource for single-page applications to ensure proper client-side routing.

8. **Error Handling**: Implement proper error handling in RPC methods to provide meaningful error messages.

## Testing

The package includes comprehensive unit and integration tests using Vitest:

```bash
bun test                    # Run all tests
bun test:watch             # Watch mode
bun test:coverage          # Coverage report
```

**Test Files:**

- `WebHostService.test.ts` - Service lifecycle and resource registration
- `StaticResource.test.ts` - Static file serving
- `SPAResource.test.ts` - SPA routing
- `JsonRpcResource.test.ts` - JSON-RPC API endpoints
- `WsRpcResource.test.ts` - WebSocket RPC endpoints
- `auth.test.ts` - Authentication
- `integration.test.ts` - Integration tests
- `createJsonRPCClient.test.ts` - HTTP client
- `createWsRPCClient.test.ts` - WebSocket client

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
