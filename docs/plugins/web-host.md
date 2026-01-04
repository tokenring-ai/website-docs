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
export const WebHostConfigSchema = z.object(&#123;
  host: z.string().default("127.0.0.1"),
  port: z.number().optional(),
  auth: AuthConfigSchema.optional(),
  resources: z.record(z.string(), z.discriminatedUnion("type", [
    staticResourceConfigSchema,
    spaResourceConfigSchema
  ])).optional(),
&#125;)
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
export const AuthConfigSchema = z.object(&#123;
  users: z.record(z.string(), z.object(&#123;
    password: z.string().optional(),
    bearerToken: z.string().optional(),
  &#125;))
&#125;)
```

**Authentication Options:**

| Option | Type | Description |
|--------|------|-------------|
| `users` | Record | Map of usernames to credentials |
| `password` | string | Optional password for Basic authentication |
| `bearerToken` | string | Optional bearer token for Bearer authentication |

### Static Resource Configuration

```typescript
export const staticResourceConfigSchema = z.object(&#123;
  type: z.literal("static"),
  root: z.string(),
  description: z.string(),
  indexFile: z.string(),
  notFoundFile: z.string().optional(),
  prefix: z.string()
&#125;)
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
export const spaResourceConfigSchema = z.object(&#123;
  type: z.literal("spa"),
  file: z.string(),
  description: z.string(),
  prefix: z.string()
&#125;)
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
class WebHostService implements TokenRingService &#123;
  name = "WebHostService";
  description = "Fastify web host for serving resources and APIs";

  private server!: FastifyInstance;

  resources: KeyedRegistry&lt;WebResource&gt;;
  registerResource = this.resources.register;
  getResources = this.resources.getAllItems;

  constructor(private app: TokenRingApp, private config: z.output&lt;typeof WebHostConfigSchema&gt;);

  async run(signal: AbortSignal): Promise&lt;void&gt;;
  getURL(): URL;
&#125;
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service name (`"WebHostService"`) |
| `description` | string | Service description |
| `resources` | `KeyedRegistry&lt;WebResource&gt;` | Registry of registered resources |
| `server` | `FastifyInstance` | The Fastify server instance |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerResource` | `(name: string, resource: WebResource) =&gt; void` | Register a new web resource |
| `getResources` | `() =&gt; Record&lt;string, WebResource&gt;` | Get all registered resources |
| `getURL` | `() =&gt; URL` | Get the current server URL |
| `run` | `(signal: AbortSignal) =&gt; Promise&lt;void&gt;` | Start the server |

### WebResource Interface

Interface for pluggable web resources.

```typescript
interface WebResource &#123;
  register(server: FastifyInstance): Promise&lt;void&gt;;
&#125;
```

### StaticResource Class

Serves static files from a directory.

```typescript
class StaticResource implements WebResource &#123;
  constructor(private config: z.output&lt;typeof staticResourceConfigSchema&gt;) &#123;&#125;

  async register(server: FastifyInstance): Promise&lt;void&gt; &#123;
    await server.register(fastifyStatic, &#123;
      root: this.config.root,
      prefix: this.config.prefix,
      index: this.config.indexFile
    &#125;);

    if (this.config.notFoundFile) &#123;
      server.setNotFoundHandler((request, reply) =&gt; &#123;
        reply.sendFile(this.config.notFoundFile!);
      &#125;);
    &#125;
  &#125;
&#125;
```

**Constructor Options:**

| Option | Type | Description |
|--------|------|-------------|
| `config` | `StaticResourceConfig` | Configuration for the static resource |

### SPAResource Class

Serves single-page applications with proper client-side routing.

```typescript
class SPAResource implements WebResource &#123;
  constructor(public config: z.output&lt;typeof spaResourceConfigSchema&gt;) &#123;&#125;

  async register(server: FastifyInstance): Promise&lt;void&gt; &#123;
    // Validates file exists, sets up static file serving, and handles SPA routing
  &#125;
&#125;
```

**Constructor Options:**

| Option | Type | Description |
|--------|------|-------------|
| `config` | `SPAResourceConfig` | Configuration for the SPA resource |

### JsonRpcResource Class

Provides JSON-RPC 2.0 API endpoints with streaming support.

```typescript
class JsonRpcResource implements WebResource &#123;
  constructor(private app: TokenRingApp, private endpoint: JsonRpcEndpoint) &#123;&#125;

  async register(server: FastifyInstance): Promise&lt;void&gt; &#123;
    // Registers JSON-RPC API endpoints with streaming support
  &#125;
&#125;
```

## JSON-RPC API Implementation

### Defining RPC Schemas

```typescript
import &#123; z &#125; from "zod";

const calculatorSchema = &#123;
  path: "/api/calc",
  methods: &#123;
    add: &#123;
      type: "query" as const,
      input: z.object(&#123; a: z.number(), b: z.number() &#125;),
      result: z.object(&#123; result: z.number() &#125;)
    &#125;,
    streamResult: &#123;
      type: "stream" as const,
      input: z.object(&#123; steps: z.number() &#125;),
      result: z.object(&#123; step: z.number(), value: z.number() &#125;)
    &#125;
  &#125;
&#125;;
```

### Implementing RPC Methods

```typescript
const calculator = &#123;
  add: async (params: &#123; a: number; b: number &#125;, app: TokenRingApp) =&gt; (&#123;
    result: params.a + params.b
  &#125;),

  streamResult: async function* (params: &#123; steps: number &#125;, app: TokenRingApp, signal: AbortSignal) &#123;
    let value = 0;
    for (let i = 0; i &lt; params.steps; i++) &#123;
      if (signal.aborted) break;
      value += Math.random();
      yield &#123; step: i, value &#125;;
      await new Promise(resolve =&gt; setTimeout(resolve, 500));
    &#125;
  &#125;
&#125;;
```

### Creating JSON-RPC Endpoints

```typescript
import &#123; createJsonRPCEndpoint &#125; from "@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint";

const calculatorEndpoint = createJsonRPCEndpoint(calculatorSchema, calculator);
const rpcResource = new JsonRpcResource(app, calculatorEndpoint);
```

### JSON-RPC Client

```typescript
import &#123; createJsonRPCClient &#125; from "@tokenring-ai/web-host/jsonrpc/createJsonRPCClient";

const client = createJsonRPCClient(new URL("http://localhost:3000"), calculatorSchema);

// Call query methods
const result = await client.add(&#123; a: 5, b: 3 &#125;);
console.log(result.result); // &#123; result: 8 &#125;

// Stream methods return async generators
for await (const update of client.streamResult(&#123; steps: 5 &#125;)) &#123;
  console.log(update);
&#125;
```

### JSON-RPC Type Utilities

```typescript
import type &#123;
  JsonRPCSchema,
  JsonRPCImplementation,
  JsonRpcEndpoint,
  ResultOfRPCCall,
  ParamsOfRPCCall
&#125; from "@tokenring-ai/web-host/jsonrpc/types";

// Type inference for RPC calls
type AddResult = ResultOfRPCCall&lt;typeof calculatorSchema, "add"&gt;;
type AddParams = ParamsOfRPCCall&lt;typeof calculatorSchema, "add"&gt;;
```

## Usage Examples

### Basic Setup

```typescript
import &#123; TokenRingApp &#125; from "@tokenring-ai/app";
import webHostPackage from "@tokenring-ai/web-host";

const app = new TokenRingApp(&#123;
  webHost: &#123;
    port: 3000,
    host: "127.0.0.1",
    resources: &#123;
      "static-files": &#123;
        type: "static",
        root: "./public",
        description: "Public static files",
        indexFile: "index.html",
        prefix: "/static"
      &#125;,
      "spa": &#123;
        type: "spa",
        file: "./dist/index.html",
        description: "Main application",
        prefix: "/"
      &#125;
    &#125;
  &#125;
&#125;);

await app.addPackages([webHostPackage]);
await app.start();
```

### Complete Configuration with Authentication

```typescript
const app = new TokenRingApp(&#123;
  webHost: &#123;
    port: 3000,
    host: "0.0.0.0",
    auth: &#123;
      users: &#123;
        "admin": &#123;
          password: "admin123",
          bearerToken: "admin-token"
        &#125;,
        "api-user": &#123;
          bearerToken: "api-key-abc123"
        &#125;
      &#125;
    &#125;,
    resources: &#123;
      "public": &#123;
        type: "static",
        root: "./public",
        description: "Public static files",
        indexFile: "index.html",
        prefix: "/"
      &#125;
    &#125;
  &#125;
&#125;);
```

### Registering Custom Resources Programmatically

```typescript
import &#123; WebHostService &#125; from "@tokenring-ai/web-host";
import &#123; WebResource &#125; from "@tokenring-ai/web-host/types";
import &#123; FastifyInstance &#125; from "fastify";

// Get the web host service
const webHost = app.getServiceByType(WebHostService);

if (webHost) &#123;
  // Create a custom API resource
  const apiResource: WebResource = &#123;
    async register(server: FastifyInstance) &#123;
      server.get("/api/health", async () =&gt; &#123;
        return &#123; status: "ok" &#125;;
      &#125;);

      server.post("/api/data", async (request, reply) =&gt; &#123;
        const data = request.body;
        return &#123; received: data &#125;;
      &#125;);
    &#125;
  &#125;;

  webHost.registerResource("customAPI", apiResource);
&#125;
```

### Registering JSON-RPC Resources

```typescript
import &#123; JsonRpcResource &#125; from "@tokenring-ai/web-host/JsonRpcResource";
import &#123; createJsonRPCEndpoint &#125; from "@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint";
import &#123; z &#125; from "zod";

const chatSchema = &#123;
  path: "/api/chat",
  methods: &#123;
    sendMessage: &#123;
      type: "query" as const,
      input: z.object(&#123; message: z.string() &#125;),
      result: z.object(&#123; response: z.string() &#125;)
    &#125;,
    streamMessages: &#123;
      type: "stream" as const,
      input: z.object(&#123; count: z.number() &#125;),
      result: z.object(&#123; message: z.string() &#125;)
    &#125;
  &#125;
&#125;;

const chatImplementation = &#123;
  sendMessage: async (params: &#123; message: string &#125;, app: TokenRingApp) =&gt; (&#123;
    response: `You said: $&#123;params.message&#125;`
  &#125;),

  streamMessages: async function* (params: &#123; count: number &#125;, app: TokenRingApp, signal: AbortSignal) &#123;
    for (let i = 0; i &lt; params.count; i++) &#123;
      if (signal.aborted) break;
      yield &#123; message: `Message $&#123;i + 1&#125;` &#125;;
      await new Promise(resolve =&gt; setTimeout(resolve, 1000));
    &#125;
  &#125;
&#125;;

const chatEndpoint = createJsonRPCEndpoint(chatSchema, chatImplementation);
const chatResource = new JsonRpcResource(app, chatEndpoint);

webHost.registerResource("chatAPI", chatResource);
```

### Serving Static Files

```typescript
import &#123; StaticResource &#125; from "@tokenring-ai/web-host";

// Add custom static resource
const staticResource = new StaticResource(&#123;
  type: "static",
  root: "./public",
  description: "Public static files",
  indexFile: "index.html",
  notFoundFile: "404.html",
  prefix: "/static"
&#125;);

webHost.registerResource("public", staticResource);
```

### Serving Single-Page Application

```typescript
import &#123; SPAResource &#125; from "@tokenring-ai/web-host";

const spaResource = new SPAResource(&#123;
  type: "spa",
  file: "./dist/index.html",
  description: "Main application",
  prefix: "/"
&#125;);

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
export &#123; default as WebHostService &#125; from "./WebHostService.js";
export &#123; default as StaticResource &#125; from "./StaticResource.js";
export type &#123; WebResource &#125; from "./types.js";
export &#123; WebHostConfigSchema &#125; from "./index.ts";
```

### Exports from `jsonrpc/`

```typescript
// createJsonRPCEndpoint.ts
export function createJsonRPCEndpoint&lt;T extends JsonRPCSchema&gt;(
  schemas: T,
  implementation: JsonRPCImplementation&lt;T&gt;
): JsonRpcEndpoint;

// createJsonRPCClient.ts
export default function createJsonRPCClient&lt;T extends JsonRPCSchema&gt;(
  baseURL: URL,
  schemas: T
): &#123; [K in keyof T["methods"]]: ... &#125;;

export type ResultOfRPCCall&lt;T, K&gt; = ...;
export type ParamsOfRPCCall&lt;T, K&gt; = ...;
```

### Auth Functions

```typescript
export const AuthConfigSchema = z.object(&#123; ... &#125;);
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
server.get("/api/whoami", async (request) =&gt; &#123;
  return &#123; user: (request as any).user &#125;;
&#125;);
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
