# @tokenring-ai/web-host

The `@tokenring-ai/web-host` package provides a high-performance Bun web
server with a pluggable resource registration system for the Token Ring
ecosystem. It serves as the foundation for hosting web UIs, REST APIs, and
real-time communication endpoints with support for static files, SPAs,
WebSocket RPC, and authentication.

## User Guide

### Overview and Purpose

The `@tokenring-ai/web-host` package provides a high-performance web server
built on **Bun.serve** for hosting TokenRing application services. It features
a pluggable resource registration system that allows different packages to
extend web functionality through resources. The package supports static file
serving, SPA routing, WebSocket RPC, and authentication.

**Key capabilities:**

- High-performance HTTP and WebSocket server using Bun.serve
- Pluggable resource registration via KeyedRegistry
- Static file serving with customizable routing
- Single-Page Application (SPA) support with client-side routing
- WebSocket-based JSON-RPC with streaming support
- Basic and Bearer token authentication
- Integration with TokenRing plugin system
- Automatic WebSocket RPC registration from RpcService

### Key Features

- **High-Performance Server**: Built on Bun.serve for low-latency HTTP and
  WebSocket handling
- **Resource Registration System**: Pluggable architecture using KeyedRegistry
  for web resources
- **Static File Serving**: Serve static files with custom routing prefixes and
  index handling
- **SPA Support**: Single Page Application routing with fallback for
  client-side navigation
- **WebSocket RPC**: Real-time WebSocket-based RPC with streaming support
- **Authentication**: Basic and Bearer token authentication with per-user
  credentials
- **Plugin Integration**: Seamless integration with TokenRing plugin system
- **Automatic RPC Registration**: Auto-creates WebSocket RPC resource from
  RpcService endpoints
- **Type Safety**: Full TypeScript support with Zod configuration validation
- **Configurable Port**: Port 0 enables automatic port assignment

### Chat Commands

| Command | Description |
|---------|-------------|
| `/webhost show` | Show web host URL and available resources |
| `/webhost start` | Start the web host server |
| `/webhost stop` | Stop the web host server |

#### /webhost show

Displays the current web host URL and lists all registered resources.

**Usage:**

```bash
/webhost show
```

**Output Example:**

```text
Web host running at: http://localhost:3000
Registered resources:
  - Websocket RPC
  - static-files
  - spa
```

**Output when no resources registered:**

```text
Web host running at: http://localhost:3000
No resources registered
```

#### /webhost start

Starts the web host server.

**Usage:**

```bash
/webhost start
```

**Output:**

```text
Web host started at: http://localhost:3000
```

**Notes:**

- Server must not already be listening
- Configuration is taken from the plugin config
- Auto-generates port if configured with port 0

#### /webhost stop

Stops the web host server.

**Usage:**

```bash
/webhost stop
```

**Output:**

```text
Web host stopped
```

**Notes:**

- Closes all active connections
- Safe to call when server is not running

### Tools

This package does not define any tools. Tools are typically used for
agent-assisted operations, and the web-host package focuses on web server
functionality rather than agent tools.

### Configuration

#### WebHostConfigSchema

The main configuration schema for the web host service:

```typescript
import { z } from "zod";
import {
  WebHostConfigSchema,
  WebHostAuthConfigSchema,
} from "@tokenring-ai/web-host";

type ParsedWebHostConfig = z.output<typeof WebHostConfigSchema>;
type ParsedWebHostAuthConfig = z.output<typeof WebHostAuthConfigSchema>;
```

The schema is defined as:

```typescript
const WebHostConfigSchema = z
  .object({
    autoStart: z.boolean().default(false),
    host: z.string().default("127.0.0.1"),
    port: z.number().default(0),
    auth: WebHostAuthConfigSchema.exactOptional(),
  })
  .prefault({});
```

**Configuration Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `autoStart` | boolean | No | `false` | Whether to automatically start the server when plugin starts |
| `host` | string | No | `127.0.0.1` | Host address to bind to |
| `port` | number | No | `0` | Port number. If 0 or not specified, an available port is automatically assigned |
| `auth` | AuthConfig | No | - | Authentication configuration |

#### AuthConfigSchema

Authentication configuration schema supporting both Basic and Bearer token
authentication:

```typescript
const WebHostAuthConfigSchema = z.object({
  users: z.record(
    z.string(),
    z.object({
      password: z.string().exactOptional(),
      bearerToken: z.string().exactOptional(),
    }),
  ),
});
```

**Authentication Options:**

| Option | Type | Description |
|--------|------|-------------|
| `users` | Record | Map of usernames to credentials |
| `password` | string | Optional password for Basic authentication |
| `bearerToken` | string | Optional bearer token for Bearer authentication |

Each user can have either a password, a bearer token, or both. Users without
either credential cannot authenticate.

#### Static Resource Configuration

```typescript
const staticResourceConfigSchema = z.object({
  type: z.literal("static"),
  root: z.string(),
  description: z.string(),
  indexFile: z.string(),
  notFoundFile: z.string().exactOptional(),
  prefix: z.string(),
});
```

| Option | Type | Description |
|--------|------|-------------|
| `type` | `static` | Discriminator for static resource type |
| `root` | string | Directory path for static files |
| `description` | string | Human-readable description |
| `indexFile` | string | Default index file name |
| `notFoundFile` | string | Optional custom 404 page |
| `prefix` | string | URL prefix for this resource |

#### SPA Resource Configuration

```typescript
const spaResourceConfigSchema = z.object({
  type: z.literal("spa"),
  file: z.string(),
  description: z.string(),
  prefix: z.string(),
});
```

| Option | Type | Description |
|--------|------|-------------|
| `type` | `spa` | Discriminator for SPA resource type |
| `file` | string | Path to the index.html file |
| `description` | string | Human-readable description |
| `prefix` | string | URL prefix for SPA routing |

#### Sample Configuration

```yaml
webHost:
  autoStart: true
  host: "127.0.0.1"
  port: 3000
  auth:
    users:
      admin:
        password: "secret123"
        bearerToken: "admin-token-xyz"
      user1:
        password: "user-pass-123"
```

**Configuration Notes:**

- `autoStart`: Set to `true` to automatically start the server when the plugin
  starts
- `port`: Use `0` for automatic port assignment, or specify a specific port
  number
- `auth`: Optional; if not provided, the server accepts all requests without
  authentication
- Each user can have either `password`, `bearerToken`, or both credentials

### Integration

#### Plugin Installation

The web-host package integrates as a plugin with the TokenRing application:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "127.0.0.1",
  },
});

await app.addPlugin(webHostPackage);
await app.start();
```

#### Plugin Lifecycle

**Install Phase:**

1. Creates `WebHostService` with provided configuration
2. Registers chat commands (`/webhost show`, `/webhost start`, `/webhost stop`)
   with AgentCommandService

**Start Phase:**

1. Checks if RpcService is available
2. If RpcService exists, registers a `WsRpcResource` at `/rpc:ws` endpoint
3. Starts the Bun server if `autoStart` is enabled in configuration

**Reconfigure Phase:**

1. Stops the server if currently running
2. Updates configuration with new values
3. Restarts the server if it was listening before reconfiguration or if
   `autoStart` is enabled

**Stop Phase:**

The plugin does not define a specific stop phase handler. The server can be
stopped via:

- The `/webhost stop` chat command
- Calling `webHostService.stop()` programmatically

#### Service Integration

The web-host service integrates with:

- **@tokenring-ai/app**: Service registration and lifecycle management
- **@tokenring-ai/agent**: Agent command registration via `/webhost show`,
  `/webhost start`, `/webhost stop` commands
- **@tokenring-ai/rpc**: WebSocket RPC resource for RpcService endpoints
- **@tokenring-ai/utility**: Registry and utility functions

#### WebSocket RPC Integration

When the plugin starts and an RpcService is available, it automatically
registers a `WsRpcResource` at the `/rpc:ws` endpoint. This provides
WebSocket-based JSON-RPC access to all methods registered with the RpcService.

**Automatic Registration Behavior:**

- Single WebSocket endpoint at `/rpc:ws` handles all registered RPC methods
- All endpoints from all registered RpcService endpoints are accessible
- Supports query, mutation, and streaming method types
- Streaming methods support graceful abort via WebSocket close

**WebSocket Connection:**

Clients connect to `ws://<host>:<port>/rpc:ws` and send JSON-RPC 2.0 formatted
messages. The server responds with JSON-RPC responses or errors.

### Usage Examples

#### Basic Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "127.0.0.1",
  },
});

await app.addPlugin(webHostPackage);
await app.start();

// Access the service after plugin starts
const webHostService = app.getService(WebHostService);
```

**Port Assignment:**

- Use port `3000` for a specific port
- Use port `0` for automatic port assignment (server chooses available port)
- After starting, call `webHostService.getURL()` to get the actual URL

#### Static File Serving

```typescript
import { StaticResource, WebHostService } from "@tokenring-ai/web-host";

const webHostService = app.getService(WebHostService);
webHostService.registerResource(
  "public",
  new StaticResource({
    type: "static",
    root: "./public",
    description: "Public static files",
    indexFile: "index.html",
    prefix: "/static",
  }),
);
```

#### SPA Routing

```typescript
import { SPAResource, WebHostService } from "@tokenring-ai/web-host";

const webHostService = app.getService(WebHostService);
const spaResource = new SPAResource({
  type: "spa",
  file: "./dist/index.html",
  description: "Main SPA application",
  prefix: "/",
});

webHostService.registerResource("spa", spaResource);
```

SPA routing behavior:

- **Static files** (JS, CSS, images): Served directly by Bun's native file
  serving
- **Root path**: Serves the specified index.html file
- **Client-side routes**: All non-static-file requests serve index.html (for
  client-side routing)
- **Missing files**: Returns 404 if static file doesn't exist

**Example routing:**

```text
/app/           -> index.html (SPA entry point)
/app/dashboard  -> index.html (client-side route)
/app/main.js    -> main.js (static file)
/app/missing.css -> 404 (file doesn't exist)
```

#### Custom Resource Registration

```typescript
import { WebHostService, type WebResource } from "@tokenring-ai/web-host";

const webHost = app.getService(WebHostService);

if (webHost) {
  const apiResource: WebResource = {
    async register(router) {
      router.get("/api/health", async (_request, response) => {
        return response.json({ status: "ok" });
      });

      router.post("/api/data", async (request, response) => {
        const data = await request.json();
        return response.json({ received: data });
      });
    },
  };

  webHost.registerResource("customAPI", apiResource);
}
```

#### WebSocket RPC Client

```typescript
import { createWsRPCClient, WebHostService } from "@tokenring-ai/web-host";
import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

const calculatorSchema: RPCSchema = {
  name: "Calculator",
  path: "/api/calc",
  methods: {
    add: {
      type: "query",
      input: z.object({ a: z.number(), b: z.number() }),
      result: z.object({ result: z.number() }),
    },
    streamResult: {
      type: "stream",
      input: z.object({ steps: z.number() }),
      result: z.object({ step: z.number(), value: z.number() }),
    },
  },
};

const webHostService = app.getService(WebHostService);
const wsClient = createWsRPCClient(
  webHostService.getURL(),
  calculatorSchema,
);

// Call query/mutation methods
const result = await wsClient.add({ a: 5, b: 3 });

// Stream methods return async generators
const controller = new AbortController();
for await (const update of wsClient.streamResult(
  { steps: 5 },
  controller.signal,
)) {
  console.log(update);
  if (update.step >= 2) {
    controller.abort();
    break;
  }
}
```

### Authentication

The web-host package supports both Basic and Bearer token authentication.
Authentication is configured per-user and applies to all HTTP and WebSocket
requests.

#### Basic Authentication

Uses HTTP Basic Auth with username and password.

```bash
curl -u admin:secret123 http://localhost:3000/api/status
```

#### Bearer Token Authentication

Uses the Authorization header with a Bearer token.

```bash
curl -H "Authorization: Bearer admin-token-xyz" \
  http://localhost:3000/api/status
```

**Authentication Behavior:**

- Credentials are validated against the configured `users` map
- On failure, returns `401 Unauthorized` with `{ "error": "Unauthorized" }`
- Each user can have a `password`, `bearerToken`, or both
- WebSocket upgrades also require valid authentication
- User information is validated but not attached to request objects

**Note:** To pass user information to handlers, implement custom header-based
authentication or modify the auth.ts file to attach user context.

### Best Practices

1. **Use Resource Registration**: Register resources at startup or through
   the plugin system for consistent initialization.

2. **Validate Configuration**: Use the provided Zod schemas to validate
   configuration before creating resources.

3. **Handle Streaming Properly**: When implementing stream methods, always
   check the `AbortSignal` to support graceful shutdown.

4. **Use Type Safety**: Leverage the type utilities for type-safe RPC
   interactions.

5. **Configure Authentication**: Use authentication for all production
   deployments to secure your APIs.

6. **SPA Routing**: Use SPAResource for single-page applications to ensure
   proper client-side routing.

7. **Error Handling**: Implement proper error handling in RPC methods to
   provide meaningful error messages.

8. **Port Management**: Use port `0` for automatic port assignment in
   development; specify explicit ports in production.

9. **Resource Lifecycle**: Register resources after the plugin starts but
   before calling `listen()` if not using `autoStart`.

10. **WebSocket Cleanup**: Always handle WebSocket close events to properly
    clean up resources and abort streaming operations.

## Developer Reference

### Core Components

#### WebHostService

The main service that manages the web server lifecycle and resource
registration.

```typescript
class WebHostService implements TokenRingService {
  readonly name = "WebHostService";
  description = "Bun web host for serving resources and APIs";

  resources: KeyedRegistry<WebResource>;
  registerResource: (name: string, resource: WebResource) => void;
  getResourceEntries: () => Iterable<[string, WebResource]>;

  constructor(
    app: TokenRingApp,
    config: Omit<ParsedWebHostConfig, "autoStart">,
  );

  get listening: boolean;

  getURL(): URL;

  async listen(): Promise<void>;

  async reconfigure(config: ParsedWebHostConfig): Promise<void>;

  stop(): void;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service name (`WebHostService`) |
| `description` | string | Service description |
| `resources` | `KeyedRegistry<WebResource>` | Registry of registered web resources |
| `registerResource` | `(name: string, resource: WebResource) => void` | Register a web resource |
| `getResourceEntries` | `() => Iterable<[string, WebResource]>` | Get all registered resources |
| `listening` | `boolean` | Whether server is currently listening |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `listen` | `() => Promise<void>` | Start the Bun server and register all resources |
| `stop` | `() => void` | Stop the server and close all connections |
| `reconfigure` | `(config: ParsedWebHostConfig) => Promise<void>` | Reconfigure and restart the server |
| `getURL` | `() => URL` | Get the current server URL |

#### WebResource Interface

Interface for web resources that can be registered with the WebHostService.

```typescript
interface WebResource {
  register(router: BunRouter): MaybePromise<void>;
}
```

#### BunRouter Interface

Router interface for registering handlers, websockets, and static files.

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

#### BunRequest Interface

Request object passed to route handlers.

```typescript
interface BunRequest {
  method: string;
  url: string;
  path: string;
  headers: Headers;
  body: () => MaybePromise<any>;
  json: () => MaybePromise<any>;
  text: () => MaybePromise<string>;
  arrayBuffer: () => MaybePromise<ArrayBuffer>;
}
```

#### BunResponse Interface

Response utilities.

```typescript
interface BunResponse {
  json(data: any, status?: number): Response;
  text(data: string, status?: number): Response;
  file(path: string): MaybePromise<Response>;
  html(data: string, status?: number): Response;
  redirect(url: string, status?: number): Response;
  stream(
    callback: (controller: ReadableStreamDefaultController) =>
      MaybePromise<void>,
  ): Response;
}
```

#### RouteHandler Type

Route handler function type.

```typescript
type RouteHandler = (
  request: BunRequest,
  response: BunResponse,
) => MaybePromise<Response | void>;
```

#### WebSocketHandler Interface

WebSocket handler interface for managing WebSocket connections.

```typescript
interface WebSocketHandler {
  open?(ws: BunWebSocket): void;
  close?(ws: BunWebSocket): void;
  message?(ws: BunWebSocket, message: string | Buffer): void;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `open` | `(ws: BunWebSocket) => void` | Optional handler called when a WebSocket connection opens |
| `close` | `(ws: BunWebSocket) => void` | Optional handler called when a WebSocket connection closes |
| `message` | `(ws: BunWebSocket, message: string \| Buffer) => void` | Optional handler called when a message is received |

#### BunWebSocket Interface

WebSocket wrapper interface.

```typescript
interface BunWebSocket {
  data: any;
  send(data: string | object): void;
  close(): void;
}
```

**Properties and Methods:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `data` | `any` | Arbitrary data stored on the WebSocket connection |
| `send` | `(data: string \| object) => void` | Send data to the client (objects are JSON-stringified) |
| `close` | `() => void` | Close the WebSocket connection |

#### StaticOptions Interface

Static file serving options.

```typescript
interface StaticOptions {
  index?: string;
  notFound?: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `index` | `string` | Optional index file name for directory requests |
| `notFound` | `string` | Optional custom 404 page file path |

#### StaticResource Class

Serves static files from a directory using Bun's native file serving.

```typescript
class StaticResource implements WebResource {
  constructor(config: z.output<typeof staticResourceConfigSchema>);

  register(router: BunRouter): void;
}
```

Behavior:

- Files are served under the specified prefix
- Index file is served for directory requests
- Uses Bun's native static file serving

#### SPAResource Class

Serves single-page applications with proper client-side routing support.

```typescript
class SPAResource implements WebResource {
  readonly config: z.output<typeof spaResourceConfigSchema>;

  constructor(config: z.output<typeof spaResourceConfigSchema>);

  register(router: BunRouter): void;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `config` | `z.output<typeof spaResourceConfigSchema>` | The SPA resource configuration (public readonly property) |

Routing behavior:

- **Static files**: Served directly by Bun's native file serving
- **Root path**: Serves the SPA index.html file
- **Client-side routes**: All non-static-file requests serve index.html
- **Missing files**: Returns 404 if static file doesn't exist

Example routing:

```text
/app/           -> index.html
/app/dashboard  -> index.html (client-side routing)
/app/main.js    -> main.js (static file)
/app/missing.css -> 404 (file doesn't exist)
```

#### WsRpcResource Class

Provides WebSocket-based RPC endpoints for real-time communication.

```typescript
class WsRpcResource implements WebResource {
  constructor(app: TokenRingApp, jsonRpcEndpoint: string);

  register(router: BunRouter): void;
}
```

WebSocket message format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { }
}
```

Streaming behavior:

- Stream methods emit individual JSON-RPC responses
- Stream ends with `{ "stream": "end" }` marker
- Errors are sent as JSON-RPC error responses
- Client can close the WebSocket to abort streaming

JSON-RPC error codes:

| Error Code | Description |
|------------|-------------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid Request (wrong JSON-RPC version) |
| -32601 | Method not found |
| -32603 | Internal error (validation or execution error) |

#### createWsRPCClient Function

Factory function for creating type-safe WebSocket RPC clients.

```typescript
function createWsRPCClient<T extends RPCSchema>(
  wsUrl: URL,
  schemas: T,
): {
  [K in keyof T["methods"]]: FunctionTypeOfRPCCall<T, K>;
};
```

Features:

- **Automatic WebSocket connection management**: Socket caching with
  automatic reconnection for closed sockets
- **Type-safe method calls**: Method signatures inferred from RPC schema
- **Support for all method types**: Query, mutation, and stream method types
- **Async generator support**: Streaming methods return async generators
- **AbortSignal support**: Cancel streaming operations gracefully
- **Request/Response tracking**: Automatic request ID management and response
  routing

**Socket Caching Behavior:**

```typescript
// First call creates the WebSocket connection
const client1 = createWsRPCClient(url, schema);

// Second call with the same URL reuses the existing connection
const client2 = createWsRPCClient(url, schema);
// client1 and client2 share the same WebSocket
```

**Stream Method Implementation:**

Stream methods use an internal queue system to handle asynchronous message
delivery:

```typescript
// Stream method returns an async generator
for await (const update of client.streamMethod(params, signal)) {
  console.log(update);
  // Process each update as it arrives
}

// Abort stream by cancelling the signal
signal.abort();
```

**Error Handling:**

```typescript
try {
  const result = await client.queryMethod(params);
} catch (error) {
  // Error contains the JSON-RPC error message
  console.error(error.message);
}
```

### Services

#### WebHostService Usage

The primary service provided by this package. It implements the
`TokenRingService` interface and manages the Bun web server lifecycle.

**Service Registration:**

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";
import { WebHostService } from "@tokenring-ai/web-host";

const app = new TokenRingApp({
  webHost: {
    port: 3000,
    host: "127.0.0.1",
  },
});

await app.addPlugin(webHostPackage);
await app.start();

// Access the service
const webHost = app.getService(WebHostService);
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

### Provider Documentation

The web-host package uses a plugin-based registration pattern rather than a
traditional provider architecture. Resources are registered programmatically
by calling `registerResource` on the WebHostService.

**KeyedRegistry Pattern:**

The package uses `KeyedRegistry` from `@tokenring-ai/utility` to manage
resources:

```typescript
import KeyedRegistry from "@tokenring-ai/utility/registry/KeyedRegistry";

// Resources are stored in a KeyedRegistry
resources = new KeyedRegistry<WebResource>();

// Register a resource
registerResource = this.resources.set;

// Get all resources
getResourceEntries = this.resources.entriesArray;
```

### State Management

The web-host package is stateless in its request processing:

- **WebHostService**: Maintains runtime state for the server lifecycle
  (listening status, registered resources, active server instance). This state
  is not serialized or persisted.
- **Resources**: StaticResource and SPAResource are stateless; each request is
  processed independently. SPAResource exposes its configuration as a readonly
  public `config` property.
- **WsRpcResource**: Stateless RPC execution; each RPC request is processed
  independently. WebSocket connections maintain per-connection state
  (AbortController) that is cleaned up on connection close.
- **createWsRPCClient**: Maintains client-side state (socket cache, pending
  requests, pending streams). This state is not serialized.

### RPC Endpoints

#### WebSocket RPC Endpoint

The web-host package registers a single WebSocket RPC endpoint at `/rpc:ws`
when the RpcService is available. This endpoint provides access to all
methods registered with the RpcService.

**Automatic Registration:**

During the plugin's `start` phase, if RpcService is available:

```typescript
const rpcService = app.getService(RpcService);
if (rpcService) {
  webHostService.registerResource(
    "Websocket RPC",
    new WsRpcResource(app, "/rpc:ws"),
  );
}
```

**Connecting:**

Clients connect to the WebSocket endpoint at the `/rpc:ws` path on the web
host URL. All RPC methods registered with the RpcService are accessible
through this single endpoint.

### Testing

#### Running Tests

```bash
bun test                    # Run all tests
bun test:watch              # Watch mode
bun test:coverage           # Coverage report
```

The package uses vitest as the testing framework with Bun as the runtime.

#### Test Files

- `WebHostService.test.ts` - Service lifecycle and resource registration
- `StaticResource.test.ts` - Static file serving
- `FallbackResource.test.ts` - SPA routing
- `auth.test.ts` - Authentication
- `integration.test.ts` - Integration tests

### Dependencies

#### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| @tokenring-ai/app | workspace | Base application framework with service management |
| @tokenring-ai/agent | workspace | Agent system with state management |
| @tokenring-ai/utility | workspace | Registry and utility functions |
| @tokenring-ai/rpc | workspace | RPC endpoint registration and execution |
| zod | ^4.4.3 | Schema validation |

#### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| vitest | ^4.1.1 | Testing framework |
| typescript | ^6.0.2 | TypeScript compiler |

### Package Structure

```text
pkg/web-host/
├── index.ts                   # Main entry point and exports
├── plugin.ts                  # Plugin definition for TokenRing integration
├── package.json               # Package manifest
├── LICENSE                    # MIT License
├── README.md                  # Package README
├── WebHostService.ts          # Main service implementation
├── StaticResource.ts          # Static file resource
├── SPAResource.ts             # SPA resource implementation
├── WsRpcResource.ts           # WebSocket RPC resource implementation
├── auth.ts                    # Authentication utilities
├── types.ts                   # Type definitions
├── schema.ts                  # Configuration schemas
├── createWsRPCClient.ts       # WebSocket RPC client
├── commands.ts                # Command exports
├── commands/
│   ├── webhost-show.ts        # /webhost show command
│   ├── webhost-start.ts       # /webhost start command
│   └── webhost-stop.ts        # /webhost stop command
└── vitest.config.ts           # Vitest configuration
```

### Exports

#### Named Exports

| Export | Type | Description |
|--------|------|-------------|
| `WebHostService` | default | Main web host service class |
| `StaticResource` | default | Static file serving resource |
| `staticResourceConfigSchema` | const | Zod schema for static resource config |
| `FallbackResource` | default | SPA routing resource |
| `FallbackResourceConfigSchema` | const | Zod schema for SPA resource config |
| `WsRpcResource` | default | WebSocket RPC resource |
| `createWsRPCClient` | default | WebSocket RPC client factory |
| `WebHostConfigSchema` | const | Zod schema for web host configuration |
| `WebHostAuthConfigSchema` | const | Zod schema for auth configuration |

#### Type Exports

| Export | Description |
|--------|-------------|
| `WebResource` | Interface for web resources |
| `ParsedWebHostAuthConfig` | Type for parsed authentication config |
| `ParsedWebHostConfig` | Type for parsed web host configuration |

### Schema Exports

The package exports the following Zod schemas:

**Configuration Schemas:**

- `WebHostConfigSchema`: Web host configuration schema with autoStart, host,
  port, and auth options
- `WebHostAuthConfigSchema`: Authentication configuration schema for user
  credentials

**Resource Schemas:**

- `staticResourceConfigSchema`: Static file resource configuration schema
- `FallbackResourceConfigSchema`: SPA resource configuration schema

**Schema Usage:**

```typescript
import {
  WebHostConfigSchema,
  WebHostAuthConfigSchema,
  staticResourceConfigSchema,
  spaResourceConfigSchema,
} from "@tokenring-ai/web-host";

// Validate configuration
const config = WebHostConfigSchema.parse({
  port: 3000,
  host: "127.0.0.1",
  autoStart: true,
});

// Validate static resource config
const staticConfig = staticResourceConfigSchema.parse({
  type: "static",
  root: "./public",
  description: "Public files",
  indexFile: "index.html",
  prefix: "/static",
});

// Validate SPA resource config
const spaConfig = spaResourceConfigSchema.parse({
  type: "spa",
  file: "./dist/index.html",
  description: "Main application",
  prefix: "/",
});
```

### Related Components

- `@tokenring-ai/rpc` - RPC endpoint definition and execution
- `@tokenring-ai/agent` - Agent system integration
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/utility` - KeyedRegistry and utilities

## License

MIT License - see LICENSE file for details.
