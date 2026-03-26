# @tokenring-ai/web-host

The `@tokenring-ai/web-host` package provides a high-performance Bun web server with a pluggable resource registration system for the Token Ring ecosystem. It serves as the foundation for hosting web UIs, REST APIs, and real-time communication endpoints with comprehensive support for static files, SPAs, JSON-RPC APIs, WebSocket RPC, and authentication.

## Overview

The web-host package provides a complete web server solution using Bun's native HTTP and WebSocket capabilities. It features a flexible resource registration system that allows both configuration-based and programmatic resource registration. The package integrates seamlessly with the Token Ring agent framework, automatically registering RPC endpoints and providing a `/webhost` command for monitoring.

## Key Features

- **Bun Server**: High-performance HTTP server using Bun's native HTTP and WebSocket support
- **Authentication**: Basic and Bearer token authentication with per-user credentials
- **Resource Registration**: Pluggable system for registering web resources via KeyedRegistry
- **Static File Serving**: Serve static files and directories with customizable index and 404 handling
- **Single-Page Applications**: Serve SPA applications with proper client-side routing support
- **Configurable Port**: Flexible port configuration with automatic port assignment (port 0)
- **JSON-RPC API**: Built-in JSON-RPC 2.0 support with streaming via Server-Sent Events
- **WebSocket RPC**: WebSocket-based RPC with real-time streaming support
- **Command Integration**: `/webhost` command for monitoring and management
- **Automatic Endpoint Registration**: Automatic registration of RPC endpoints during startup
- **Type-Safe Configuration**: Full TypeScript support with Zod schema validation

## Core Components

### WebHostService

Central service managing the Bun server and resource registration.

```typescript
class WebHostService implements TokenRingService {
  readonly name = "WebHostService";
  readonly description = "Bun web host for serving resources and APIs";

  resources: KeyedRegistry<WebResource>;
  registerResource: (name: string, resource: WebResource) => void;
  getResourceEntries: () => Iterable<[string, WebResource]>;

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
| `start` | `(signal: AbortSignal) => Promise<void>` | Start the Bun server and register all resources |
| `stop` | `() => Promise<void>` | Stop the server and close all connections |
| `getURL` | `() => URL` | Get the current server URL |

**Server Lifecycle:**

1. **Start Phase:**
   - Registers authentication if configured
   - Registers all web resources
   - Binds to configured host and port using Bun.serve
   - Logs the server URL

2. **Stop Phase:**
   - Closes the server and all active connections

### WebResource Interface

Interface for pluggable web resources.

```typescript
interface WebResource {
  register(router: BunRouter): Promise<void>;
}
```

### BunRouter Interface

The router interface used by resources to register handlers:

```typescript
interface BunRouter {
  get(path: string, handler: RouteHandler): void;
  post(path: string, handler: RouteHandler): void;
  put(path: string, handler: RouteHandler): void;
  delete(path: string, handler: RouteHandler): void;
  ws(path: string, handler: WebSocketHandler): void;
  static(prefix: string, root: string, options?: StaticOptions): void;
  fallback(handler: RouteHandler): void;
}
```

### BunRequest Interface

Request object passed to route handlers:

```typescript
interface BunRequest {
  method: string;
  url: string;
  path: string;
  headers: Headers;
  body: () => Promise<any>;
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}
```

### BunResponse Interface

Response utilities:

```typescript
interface BunResponse {
  json(data: any, status?: number): Response;
  text(data: string, status?: number): Response;
  file(path: string): Promise<Response>;
  html(data: string, status?: number): Response;
  redirect(url: string, status?: number): Response;
  stream(callback: (controller: ReadableStreamDefaultController) => Promise<void>): Response;
}
```

### StaticResource Class

Serves static files from a directory using Bun's native file serving.

```typescript
class StaticResource implements WebResource {
  constructor(config: z.output<typeof staticResourceConfigSchema>)

  async register(router: BunRouter): Promise<void> {
    router.static(this.config.prefix, this.config.root, {
      index: this.config.indexFile,
      notFound: this.config.notFoundFile
    });
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
| `notFoundFile` | string | Optional custom 404 page (note: not currently used by Bun) |
| `prefix` | string | URL prefix (e.g., `/static`) |

**Behavior:**

- Files are served under the specified prefix
- Index file is served for directory requests
- Uses Bun's native static file serving

### SPAResource Class

Serves single-page applications with proper client-side routing support.

```typescript
class SPAResource implements WebResource {
  constructor(config: z.output<typeof spaResourceConfigSchema>)

  async register(router: BunRouter): Promise<void> {
    // Validates file exists
    // Registers static file serving for SPA directory
    // Handles root path with index.html
    // Sets fallback handler for client-side routes
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

- **Static files**: Served directly by Bun's native file serving
- **Root path**: Serves the SPA index.html file
- **Client-side routes**: All non-static-file requests serve index.html
- **Missing files**: Returns 404 if static file doesn't exist

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

  async register(router: BunRouter): Promise<void> {
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

  async register(router: BunRouter): Promise<void> {
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

## Services

### WebHostService

The primary service provided by this package. It implements the `TokenRingService` interface and manages the Bun web server lifecycle.

**Service Registration:**

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

// Access the service
const webHost = app.getServiceByType(WebHostService);
```

**Service Methods:**

```typescript
// Get the server URL
const url = webHost.getURL();
console.log(url.toString()); // http://127.0.0.1:3000

// Register a custom resource
webHost.registerResource("myResource", customResource);

// Get all registered resources
for (const [name, resource] of webHost.getResourceEntries()) {
  console.log(name);
}
```

## Provider Documentation

The web-host package uses a plugin-based registration pattern rather than a traditional provider architecture. Resources are registered through:

1. **Configuration-based registration**: Define resources in the plugin configuration
2. **Programmatic registration**: Call `registerResource` on the WebHostService

**KeyedRegistry Pattern:**

The package uses `KeyedRegistry` from `@tokenring-ai/utility` to manage resources:

```typescript
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";

// Resources are stored in a KeyedRegistry
resources = new KeyedRegistry<WebResource>();

// Register a resource
registerResource = this.resources.register;

// Get all resources
getResourceEntries = this.resources.entries;
```

## RPC Endpoints

The web-host package automatically registers JSON-RPC and WebSocket RPC endpoints for all endpoints registered with the `RpcService` from `@tokenring-ai/rpc`.

### Automatic Endpoint Registration

During the plugin's `start` phase:

```typescript
// 1. Get all endpoints from RpcService
const rpcService = app.getService(RpcService);

// 2. For each endpoint:
for (const endpoint of rpcService.getAllEndpoints()) {
  // Create JSON-RPC resource
  webHostService.registerResource(
    endpoint.name,
    new JsonRpcResource(app, endpoint)
  );
  
  // Create WebSocket RPC resource
  webHostService.registerResource(
    `${endpoint.name} (WS)`,
    new WsRpcResource(app, endpoint)
  );
}
```

### RPC Endpoint Path Registration

Each RPC endpoint is registered at its configured path with both HTTP and WebSocket variants:

| Endpoint Name | HTTP Path | WebSocket Path |
|--------------|-----------|----------------|
| `Calculator` | `/api/calc` | `/api/calc` (WS) |
| `UserService` | `/api/users` | `/api/users` (WS) |

Both endpoints accept the same JSON-RPC 2.0 requests, but WebSocket provides real-time streaming capabilities.

### Creating RPC Endpoints

```typescript
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import { z } from "zod";

const calculatorSchema = {
  name: "Calculator",
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
      result: z.object({ step: number, value: number })
    }
  }
};

const calculatorImplementation = {
  add: async (params: { a: number, b: number }, app) => ({
    result: params.a + params.b
  }),
  
  streamResult: async function* (params: { steps: number }, app, signal) {
    let value = 0;
    for (let i = 0; i < params.steps; i++) {
      if (signal.aborted) break;
      value += Math.random();
      yield { step: i, value };
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

const endpoint = createRPCEndpoint(calculatorSchema, calculatorImplementation);
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

## Configuration

### WebHostConfigSchema

The main configuration schema for the web host service:

```typescript
export const WebHostConfigSchema = z.object({
  host: z.string().default("127.0.0.1"),
  port: z.number().default(0),
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
| `port` | number | No | `0` | Port number. If 0 or not specified, an available port is automatically assigned |
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
| `notFoundFile` | string | Optional custom 404 page (note: not currently used by Bun) |
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

## Integration

### Plugin Registration

The web-host package integrates as a plugin with two phases:

**Install Phase:**

1. Creates `WebHostService` with provided configuration
2. Registers resources from configuration (StaticResource, SPAResource)
3. Registers `/webhost` command with AgentCommandService

**Start Phase:**

1. Starts the Bun server
2. Automatically creates `JsonRpcResource` and `WsRpcResource` for each RPC endpoint registered with `RpcService`
3. Logs registered endpoint paths

### Plugin Installation

The package is installed as a plugin using the standard TokenRing plugin installation pattern:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

// Create app with configuration
const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "127.0.0.1"
  }
});

// Install the plugin
await app.addPlugin(webHostPackage);
await app.start();
```

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
    async register(router) {
      router.get("/api/health", async (request, response) => {
        return response.json({ status: "ok" });
      });

      router.post("/api/data", async (request, response) => {
        const data = await request.json();
        return response.json({ received: data });
      });

      // Access authenticated user if authentication is enabled
      router.get("/api/whoami", async (request, response) => {
        return response.json({ user: (request as any).user });
      });
    }
  };

  webHost.registerResource("customAPI", apiResource);
}
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

### JSON-RPC Client Usage

```typescript
import { createJsonRPCClient } from "@tokenring-ai/web-host/createJsonRPCClient";
import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

const calculatorSchema: RPCSchema = {
  name: "Calculator",
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

### WebSocket RPC Client Usage

```typescript
import { createWsRPCClient } from "@tokenring-ai/web-host/createWsRPCClient";
import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

const wsClient = createWsRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query/mutation methods
const result = await wsClient.add({ a: 5, b: 3 });
console.log(result); // { result: 8 }

// Stream methods return async generators
for await (const update of wsClient.streamResult({ steps: 5 }, signal)) {
  console.log(update);
}
```

## Best Practices

1. **Use Resource Registration**: Register resources at startup or through the plugin system for consistent initialization.

2. **Validate Configuration**: Use the provided Zod schemas to validate configuration before creating resources.

3. **Handle Streaming Properly**: When implementing stream methods, always check the `AbortSignal` to support graceful shutdown.

4. **Use Type Safety**: Leverage the type utilities (`FunctionTypeOfRPCCall`, `ResultOfRPCCall`, `ParamsOfRPCCall`) for type-safe RPC interactions.

5. **Configure Authentication**: Use authentication for all production deployments to secure your APIs.

6. **Automatic Endpoint Registration**: Let the web-host plugin automatically create JSON-RPC and WebSocket RPC resources from RpcService endpoints.

7. **SPA Routing**: Use SPAResource for single-page applications to ensure proper client-side routing.

8. **Error Handling**: Implement proper error handling in RPC methods to provide meaningful error messages.

## Testing and Development

### Running Tests

```bash
bun test                    # Run all tests
bun test:watch              # Watch mode
bun test:coverage           # Coverage report
```

Note: The package uses vitest as the testing framework with Bun as the runtime.

### Test Files

- `WebHostService.test.ts` - Service lifecycle and resource registration
- `StaticResource.test.ts` - Static file serving
- `SPAResource.test.ts` - SPA routing
- `JsonRpcResource.test.ts` - JSON-RPC API endpoints
- `WsRpcResource.test.ts` - WebSocket RPC endpoints
- `auth.test.ts` - Authentication
- `integration.test.ts` - Integration tests
- `createJsonRPCClient.test.ts` - HTTP client
- `createWsRPCClient.test.ts` - WebSocket client

### Development Setup

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run type checking
bun run build

# Run tests with coverage
bun test:coverage
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

### Exports from `schema.ts`

```typescript
export const AuthConfigSchema: ZodSchema<ParsedAuthConfig>;
export const WebHostConfigSchema: ZodSchema<ParsedWebHostConfig>;
export type ParsedAuthConfig: z.output<typeof AuthConfigSchema>;
export type ParsedWebHostConfig: z.output<typeof WebHostConfigSchema>;
```

### Exports from `auth.ts`

```typescript
export function registerAuth(router: BunRouter, config: ParsedAuthConfig): void;
export function checkAuth(request: BunRequest, config: ParsedAuthConfig): string | null;
export function unauthorizedResponse(response: BunResponse): Response;
```

### Exports from `types.ts`

```typescript
export interface WebResource;
export interface BunRouter;
export interface BunRequest;
export interface BunResponse;
export type RouteHandler;
export interface WebSocketHandler;
export interface BunWebSocket;
export interface StaticOptions;
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Base application framework with service management and plugin architecture
- `@tokenring-ai/agent` (0.2.0) - Agent system with state management
- `@tokenring-ai/chat` (0.2.0) - Chat service for human interaction
- `@tokenring-ai/utility` (0.2.0) - Shared utilities and helpers
- `@tokenring-ai/rpc` (0.2.0) - RPC endpoint registration and execution
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

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
router.get("/api/whoami", async (request: BunRequest, response: BunResponse) => {
  const user = (request as any).user;
  return response.json({ user });
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
- **404 Not Found**: Resource not found (for static files)

### WebSocket Errors

- Connection errors are propagated to the client
- Stream errors are sent as JSON-RPC error responses

## Related Components

- `@tokenring-ai/rpc` - RPC endpoint definition and execution
- `@tokenring-ai/agent` - Agent system integration
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/utility` - KeyedRegistry and utilities

## License

MIT License - see LICENSE file for details.
