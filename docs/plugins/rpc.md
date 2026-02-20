# RPC Service

## Overview

The RPC (Remote Procedure Call) service provides a centralized, type-safe mechanism for registering and executing remote procedures within the Token Ring ecosystem. This service uses a KeyedRegistry to manage endpoints and supports three method types: queries (read-only), mutations (state-changing), and streaming methods for real-time data.

## Key Features

- **Centralized Registry**: KeyedRegistry-based endpoint management with type safety
- **Type-Safe Operations**: Full TypeScript support with Zod schema validation
- **Three Method Types**:
  - **Query**: Read-only operations that return a single value
  - **Mutation**: State-changing operations that modify data
  - **Stream**: Asynchronous generators for real-time data streams
- **Schema-First Design**: Separate schema definitions from implementation logic
- **Local Client**: Direct in-process endpoint calls for testing
- **Plugin Integration**: Seamless integration with web-host and other services
- **Abort Support**: Stream methods support abort signals for cancellation

## Core Components

### RpcService

The main service that manages RPC endpoints using a KeyedRegistry.

```typescript
import RpcService from '@tokenring-ai/rpc';

// Create and register the service
const rpcService = new RpcService();
app.addServices(rpcService);

// Register endpoints
rpcService.registerEndpoint(endpoint);

// Get endpoint by name
const endpoint = rpcService.getEndpoint('myservice');

// Get all registered endpoints
const allEndpoints = rpcService.getAllEndpoints();
```

### createRPCEndpoint

Helper function to create type-safe RPC endpoints from schemas and implementations.

```typescript
import {createRPCEndpoint} from '@tokenring-ai/rpc/createRPCEndpoint';

const endpoint = createRPCEndpoint(schemas, implementation);
```

### createLocalRPCClient

Creates an RPC client that calls endpoint methods directly in-process. Useful for tests or when the UI and Backend run in the same process.

```typescript
import createLocalRPCClient from '@tokenring-ai/rpc/createLocalRPCClient';

const endpoint = rpcService.getEndpoint('myservice');
if (endpoint) {
  const client = createLocalRPCClient(endpoint, app);
  
  // Call methods directly on the client
  const result = await client.greet({ name: 'World' });
  console.log(result.message); // "Hello, World!"
}
```

### Types

The RPC package provides several TypeScript types for defining and implementing RPC endpoints.

#### RPCSchema

Defines the structure of an RPC endpoint including its name, path, and method schemas.

```typescript
export type RPCSchema = {
  name: string;
  path: string;
  methods: {
    [method: string]: {
      type: "query" | "mutation" | "stream";
      input: z.ZodSchema;
      result: z.ZodSchema;
    };
  };
}
```

#### RPCImplementation

Defines the function signatures for each method implementation based on the method type.

```typescript
export type RPCImplementation<T extends RPCSchema> = {
  [P in keyof T["methods"]]: T["methods"][P]["type"] extends "stream"
    ? (args: z.infer<T["methods"][P]["input"]>, app: TokenRingApp, signal: AbortSignal) => AsyncGenerator<z.infer<T["methods"][P]["result"]>>
    : (args: z.infer<T["methods"][P]["input"]>, app: TokenRingApp) => Promise<z.infer<T["methods"][P]["result"]>> | z.infer<T["methods"][P]["result"]>;
}
```

#### RpcMethod

Represents a single method within an endpoint.

```typescript
export type RpcMethod<InputSchema extends z.ZodObject<any>, ResultSchema extends z.ZodTypeAny, Type extends "query" | "mutation" | "stream"> = {
  type: Type;
  inputSchema: InputSchema;
  resultSchema: ResultSchema;
  execute: Type extends "stream"
    ? (args: z.infer<InputSchema>, app: TokenRingApp, signal: AbortSignal) => AsyncGenerator<z.infer<ResultSchema>>
    : (args: z.infer<InputSchema>, app: TokenRingApp) => z.infer<ResultSchema>;
};
```

#### RpcEndpoint

Represents a complete RPC endpoint with all its methods.

```typescript
export type RpcEndpoint = {
  readonly name: string;
  path: string;
  methods: Record<string, RpcMethod<any, any, any>>;
};
```

#### Helper Types

Additional type aliases for working with RPC calls:

```typescript
// Extract result type for a method
ResultOfRPCCall<T, K>

// Extract parameter type for a method
ParamsOfRPCCall<T, K>

// Extract function type for a method (handles both async and streaming)
FunctionTypeOfRPCCall<T, K>
```

## Usage Examples

### Basic Setup

```typescript
import RpcService from '@tokenring-ai/rpc';

const rpcService = new RpcService();
app.addServices(rpcService);
```

### Registering an Endpoint

```typescript
import {z} from 'zod';
import {createRPCEndpoint} from '@tokenring-ai/rpc/createRPCEndpoint';

// Define schemas
const myServiceSchemas = {
  name: "My Service",
  path: '/rpc/myservice',
  methods: {
    greet: {
      type: 'query' as const,
      input: z.object({ name: z.string() }),
      result: z.object({ message: z.string() })
    },
    updateUser: {
      type: 'mutation' as const,
      input: z.object({ id: z.string(), name: z.string() }),
      result: z.object({ success: z.boolean() })
    },
    streamLogs: {
      type: 'stream' as const,
      input: z.object({ count: z.number() }),
      result: z.object({ log: z.string() })
    }
  }
};

// Define implementation
const myServiceImpl = {
  greet: async (args, app) => {
    return { message: `Hello, ${args.name}!` };
  },
  updateUser: async (args, app) => {
    // Update logic here
    return { success: true };
  },
  streamLogs: async function* (args, app, signal) {
    for (let i = 0; i < args.count; i++) {
      if (signal.aborted) break;
      yield { log: `Log entry ${i}` };
    }
  }
};

// Create and register endpoint
const myEndpoint = createRPCEndpoint(myServiceSchemas, myServiceImpl);
rpcService.registerEndpoint(myEndpoint);
```

### Calling RPC Methods

```typescript
// Get endpoint and call method directly
const endpoint = rpcService.getEndpoint('myservice');
if (endpoint) {
  const result = await endpoint.methods.greet.execute(
    { name: 'World' },
    app
  );
  console.log(result.message); // "Hello, World!"
}

// Stream example
const streamMethod = endpoint.methods.streamLogs;
if (streamMethod.type === 'stream') {
  const controller = new AbortController();
  for await (const item of streamMethod.execute(
    { count: 5 },
    app,
    controller.signal
  )) {
    console.log(item.log);
  }
}
```

### Using the Local Client

```typescript
import createLocalRPCClient from '@tokenring-ai/rpc/createLocalRPCClient';

const endpoint = rpcService.getEndpoint('myservice');
if (endpoint) {
  const client = createLocalRPCClient(endpoint, app);
  
  // Call methods directly on the client
  const result = await client.greet({ name: 'World' });
  console.log(result.message); // "Hello, World!"
  
  // For streaming methods
  for await (const item of client.streamLogs({ count: 5 }, controller.signal)) {
    console.log(item.log);
  }
}
```

### Integration with Web Host

```typescript
import {WebHostService} from '@tokenring-ai/web-host';
import JsonRpcResource from '@tokenring-ai/web-host/JsonRpcResource';

app.waitForService(WebHostService, webHostService => {
  const endpoint = rpcService.getEndpoint('myservice');
  if (endpoint) {
    webHostService.registerResource(
      'My Service RPC',
      new JsonRpcResource(app, endpoint)
    );
  }
});
```

### Plugin Integration

```typescript
import {TokenRingPlugin} from '@tokenring-ai/app';
import RpcService from '@tokenring-ai/rpc';
import {createRPCEndpoint} from '@tokenring-ai/rpc/createRPCEndpoint';
import {z} from 'zod';

export default {
  name: '@my/plugin',
  version: '1.0.0',
  install(app, config) {
    app.waitForService(RpcService, rpcService => {
      const schemas = {
        name: "My Plugin",
        path: '/rpc/myplugin',
        methods: {
          ping: {
            type: 'query' as const,
            input: z.object({}),
            result: z.object({ pong: z.boolean() })
          }
        }
      };

      const impl = {
        ping: async (args, app) => ({ pong: true })
      };

      const endpoint = createRPCEndpoint(schemas, impl);
      rpcService.registerEndpoint(endpoint);
    });
  }
} satisfies TokenRingPlugin;
```

## Configuration

The RPC package has a minimal configuration schema with no required options:

```typescript
const packageConfigSchema = z.object({});
```

No configuration is required by default. The plugin automatically:
1. Registers the RpcService with the application
2. Provides the RPC endpoint registry

## Package Exports

The package exports the following:

- `@tokenring-ai/rpc` - Main entry point, exports `RpcService`
- `@tokenring-ai/rpc/createRPCEndpoint` - Create type-safe RPC endpoints
- `@tokenring-ai/rpc/createLocalRPCClient` - Create local RPC client for in-process calls
- `@tokenring-ai/rpc/types` - All type definitions (RPCSchema, RPCImplementation, etc.)

## Integration

The package integrates with:

- **@tokenring-ai/app**: For service registration and app framework integration
- **@tokenring-ai/utility**: For KeyedRegistry implementation
- **@tokenring-ai/web-host**: For HTTP/WebSocket endpoint registration

## Best Practices

1. **Separate Schemas from Implementation**: Always define your schemas first, then implement the methods separately. This promotes clear separation of concerns.

2. **Use Appropriate Method Types**: Choose the correct method type based on whether the operation is read-only (query), state-changing (mutation), or produces streaming data.

3. **Validate Input and Output**: Always use Zod schemas to validate input and output types, ensuring type safety and preventing runtime errors.

4. **Handle Abort Signals**: For stream methods, properly handle abort signals to allow proper cleanup and resource release.

5. **Use Semantic Names**: Choose clear, descriptive names for endpoints and methods to improve code readability and maintainability.

6. **Document Method Behavior**: Document the expected behavior of each method, including any side effects and error conditions.

7. **Test Edge Cases**: Include tests for edge cases such as empty method lists, single methods, and mixed method types.

8. **Leverage Plugin Pattern**: Use the plugin pattern to register RPC endpoints in a way that integrates cleanly with the Token Ring application lifecycle.

9. **Use Local Client for Tests**: For unit tests where the UI and Backend run in the same process, use `createLocalRPCClient` instead of making actual HTTP calls.

10. **Direct Endpoint Registration**: Always register the complete endpoint object with `registerEndpoint()` method.

## Testing

The package includes comprehensive tests for the `createRPCEndpoint` function:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Coverage

The test suite covers:

- Endpoint creation with correct path
- Query method conversion
- Mutation method conversion
- Stream method conversion
- Empty methods handling
- Method implementation preservation
- Single method handling
- Mixed method types

## Dependencies

- **@tokenring-ai/app**: Base application framework and service management
- **@tokenring-ai/utility**: Shared utilities, including KeyedRegistry
- **zod**: Schema validation library

## Related Components

- **@tokenring-ai/app**: Base application framework for service management and plugin architecture
- **@tokenring-ai/web-host**: Provides HTTP/WebSocket endpoints for RPC resources
- **@tokenring-ai/utility**: Shared utilities including KeyedRegistry implementation
- **@tokenring-ai/rpc/createLocalRPCClient**: For direct in-process endpoint calls

## License

MIT License - see LICENSE file for details.
