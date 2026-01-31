# @tokenring-ai/kubernetes

Kubernetes integration for TokenRing AI agents, enabling discovery and interaction with Kubernetes clusters.

## Overview

The @tokenring-ai/kubernetes package provides comprehensive Kubernetes cluster integration for TokenRing AI agents. Agents can discover and query cluster resources including core and custom resources across namespaces. This package enables agents to interact with Kubernetes clusters without direct kubectl access, leveraging the official @kubernetes/client-node library.

## Core Properties

- **clusterName**: Unique identifier for the Kubernetes cluster configuration
- **apiServerUrl**: Full URL to the Kubernetes API server (e.g., "https://api.example.com:6443")
- **namespace**: Target namespace for resource discovery (defaults to "default")
- **token**: Bearer token for authentication
- **clientCertificate**: Client certificate in PEM format for certificate-based authentication
- **clientKey**: Client private key in PEM format
- **caCertificate**: CA certificate for server verification

## Key Features

- **Resource Discovery**: Discover and list all accessible API resources across the cluster
- **Multi-Namespace Support**: Scan all namespaces or specify a single namespace
- **Dual Authentication**: Support for both token-based and client certificate authentication
- **Core and Custom Resources**: Access to both core K8s resources (v1 API group) and custom resources
- **Error Resilience**: Graceful error handling with detailed error messages for each resource
- **Smart Namespace Discovery**: Automatically discovers all namespaces if none is specified
- **TokenRing Integration**: Seamless integration with TokenRing's service and tool framework

## Core Methods/API

### listAllApiResourceTypes(agent)

Discovers and lists all API resources available in the Kubernetes cluster.

**Method Signature:**
```typescript
async listAllApiResourceTypes(agent: Agent): Promise<K8sResourceInfo[]>
```

**Parameters:**
- `agent: Agent` - The agent instance (required for service registry access)

**Returns:**
- `Promise<K8sResourceInfo[]>` - Array of resource information objects

**Returns Structure:**
```typescript
interface K8sResourceInfo {
  group?: string;       // API group (e.g., "apps")
  version?: string;     // API version (e.g., "v1")
  kind?: string;        // Resource kind (e.g., "Pod")
  namespace?: string;   // Namespace for namespaced resources
  name?: string;        // Resource name
  error?: string;       // Error message if listing failed
}
```

**Behavior:**
- Scans core v1 API group first
- Discovers and processes additional API groups
- Supports both cluster-scoped and namespace-scoped resources
- Attempts namespace discovery if not specified
- Falls back to "default" namespace if discovery fails

### Tool: Kubernetes/listKubernetesApiResources

The primary tool for listing Kubernetes resources.

**Tool Definition:**
- **Name**: kubernetes_listKubernetesApiResources
- **Display Name**: Kubernetes/listKubernetesApiResources
- **Input Schema**: `z.object({})` (no parameters required)
- **Returns**: JSON string containing array of K8sResourceInfo objects

**Execution Flow:**
1. Retrieves KubernetesService from agent's service registry
2. Calls listAllApiResourceTypes() method
3. Returns JSON string of resource data
4. Agent receives clean output without tool name prefix

## Usage Examples

### Basic Service Usage

Create and configure a Kubernetes service:

```typescript
import KubernetesService from '@tokenring-ai/kubernetes';

const service = new KubernetesService({
  clusterName: 'my-cluster',
  apiServerUrl: 'https://api.example.com:6443',
  namespace: 'production',
  token: process.env.K8S_TOKEN,
});

console.log(service.clusterName);  // "my-cluster"
console.log(service.namespace);    // "production"
```

### Agent Integration with Tool

Configure an agent to access Kubernetes resources:

```typescript
import { Agent } from '@tokenring-ai/agent';
import KubernetesService from '@tokenring-ai/kubernetes';
import tools from '@tokenring-ai/kubernetes/tools';

const agent = new Agent({
  services: [
    new KubernetesService({
      clusterName: 'my-cluster',
      apiServerUrl: 'https://api.example.com:6443',
      namespace: 'default',
      token: process.env.K8S_TOKEN,
    })
  ],
  tools: [tools.listKubernetesApiResources],
});

// Execute the tool
const result = await agent.executeTool('Kubernetes/listKubernetesApiResources', {});
const resources = JSON.parse(result.output);
console.log(`Found ${resources.length} resources`);
```

### TokenRing App Plugin Configuration

Configure the plugin in a TokenRing application:

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp({
  config: {
    kubernetes: {
      clusterName: 'production-cluster',
      apiServerUrl: 'https://api.production.example.com:6443',
      namespace: 'production',
      token: process.env.K8S_TOKEN,
    }
  }
});

// Plugin automatically registers KubernetesService and tool
```

### Certificate-Based Authentication

Configure service with client certificates:

```typescript
const service = new KubernetesService({
  clusterName: 'secure-cluster',
  apiServerUrl: 'https://secure-api.example.com:6443',
  namespace: 'default',
  clientCertificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...',
  clientKey: 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQo=',
  caCertificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...',
});
```

### Multi-Namespace Discovery

Let the service discover all namespaces:

```typescript
const service = new KubernetesService({
  clusterName: 'multi-ns-cluster',
  apiServerUrl: 'https://api.example.com:6443',
  // No namespace specified
  token: 'your-token',
});

const agent = new Agent({ services: [service] });
const resources = await service.listAllApiResourceTypes(agent);
console.log(`Found ${resources.length} resources across all namespaces`);
```

## Configuration

### Configuration Schema

Use the Zod schema for type-safe configuration:

```typescript
import {KubernetesServiceConfigSchema} from '@tokenring-ai/kubernetes';

const configSchema = KubernetesServiceConfigSchema;
```

**Schema Definition:**
```typescript
{
  clusterName: z.string(),        // Required: Cluster identifier
  apiServerUrl: z.string(),       // Required: API server URL
  namespace?: z.string(),         // Optional: Target namespace (defaults to "default")
  token?: z.string(),             // Optional: Authentication token
  clientCertificate?: z.string(), // Optional: Client certificate (PEM/Base64)
  clientKey?: z.string(),         // Optional: Client private key (PEM/Base64)
  caCertificate?: z.string(),     // Optional: CA certificate
}
```

### Configuration Options

- **clusterName** (required): Unique identifier for the cluster configuration
- **apiServerUrl** (required): Full URL to the Kubernetes API server
- **namespace**: Target namespace (optional, defaults to "default")
- **token**: Bearer token for token-based authentication
- **clientCertificate**: Client certificate in PEM format
- **clientKey**: Client private key in PEM format
- **caCertificate**: CA certificate for server verification

### Authentication Methods

**Token Authentication (Recommended):**
```typescript
{
  clusterName: 'cluster',
  apiServerUrl: 'https://api.example.com:6443',
  token: 'your-bearer-token',
}
```

**Certificate Authentication:**
```typescript
{
  clusterName: 'cluster',
  apiServerUrl: 'https://api.example.com:6443',
  clientCertificate: 'cert-data',
  clientKey: 'key-data',
  caCertificate: 'ca-cert-data',  // Optional
}
```

### Namespace Handling

- **Specified namespace**: Service scans only the specified namespace
- **No namespace**: Service attempts to discover all namespaces using CoreV1Api.listNamespace()
- **Fallback**: If namespace discovery fails, defaults to "default" namespace
- **Empty discovery**: Gracefully handles clusters with no namespaces

## Integration

### Service Registration

The plugin automatically registers the KubernetesService when configured:

1. **Installation**: Plugin's `install()` method is called during app initialization
2. **Configuration Validation**: Uses Zod schema to validate configuration
3. **Service Creation**: Instantiates KubernetesService with validated configuration
4. **Service Registration**: Adds service to TokenRing application's service registry

### Tool Registration

The plugin automatically registers tools with the chat service:

1. **Tool Discovery**: Imports tools from `tools.ts` directory
2. **Tool Ingestion**: Adds tools to chat service via `ChatService.addTools()`
3. **Tool Execution**: Agent can execute tools through `agent.executeTool()`
4. **Output Format**: Tool returns JSON string for agent consumption

### Agent Integration

Agents interact with the package through:

1. **Service Request**: Agent obtains service via `agent.requireServiceByType(KubernetesService)`
2. **Tool Execution**: Agent calls tools to interact with Kubernetes
3. **Service Registry**: Service accessed through agent's service registry
4. **Error Handling**: Errors captured in K8sResourceInfo.error fields

## Best Practices

### Security

- **Credential Management**: Store tokens and certificates securely using environment variables
- **Token Security**: Never log authentication tokens in production
- **Certificate Handling**: Store certificates securely and rotate regularly
- **Network Security**: Always use HTTPS URLs for API server connections
- **RBAC Compliance**: Respect Kubernetes RBAC permissions for namespace and resource access

### Usage Patterns

- **Environment Variables**: Load tokens from environment variables in production
- **Namespace Selection**: Specify namespace when you need to limit scope
- **Error Monitoring**: Check error fields in returned resources for troubleshooting
- **Cluster Size**: Be aware of memory consumption with large clusters
- **Discovery Speed**: Namespace discovery can be slow on large clusters

### Development

- **Testing**: Use vitest for unit testing (follow package patterns)
- **Type Safety**: Leverage TypeScript types and Zod schemas
- **Error Handling**: Handle partial failures gracefully
- **Logging**: Use console.log for debugging during development
- **Build**: Run `bun run build` for type checking only

## Testing

### Testing Setup

The package uses vitest for unit testing:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Testing Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Build Instructions

```bash
# Type check the package
bun run build

# Note: Type checking only (tsc --noEmit) is required as this is an ES module-based package with no bundling
```

## Related Components

### Package Structure

```
pkg/kubernetes/
├── index.ts                    # Entry point - exports KubernetesService
├── KubernetesService.ts        # Core service implementation
├── plugin.ts                   # TokenRing plugin integration
├── tools.ts                    # Tool exports
├── tools/
│   └── listKubernetesApiResources.ts  # Resource listing tool
├── package.json                # Package metadata and dependencies
├── vitest.config.ts            # Vitest configuration
└── README.md                   # Package documentation
```

### Dependencies

**Runtime Dependencies:**
- `@tokenring-ai/app`: TokenRing service and plugin framework
- `@tokenring-ai/chat`: Chat service and tool definitions
- `@tokenring-ai/agent`: Agent orchestration
- `@kubernetes/client-node`: Official Kubernetes Node.js client (^1.4.0)
- `zod`: Schema validation

**Development Dependencies:**
- `vitest`: Unit testing framework
- `typescript`: TypeScript compiler

### External Integrations

- **@kubernetes/client-node**: Official Kubernetes API client
  - Provides access to CoreV1Api, CustomObjectsApi, ApisApi
  - Supports token and certificate authentication
  - Handles connection management and retries

## Limitations

- **Read-Only Operations**: Currently focused on resource discovery and listing
- **No CRUD Operations**: Create, update, delete operations not yet implemented
- **No Pagination**: Large clusters may produce verbose results
- **KubeConfig Support**: No Kubernetes config file load support
- **Authentication Batching**: Multi-cluster authentication requires separate service instances

## License

MIT License - see LICENSE file for details.
