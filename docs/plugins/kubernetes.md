# Kubernetes Plugin

The `@tokenring-ai/kubernetes` package (v0.2.0) provides comprehensive Kubernetes cluster integration for TokenRing AI agents. It enables agents to discover and interact with Kubernetes clusters by listing all accessible API resources, including core and custom resources across namespaces.

## Overview

This plugin allows AI agents to query Kubernetes clusters without direct kubectl access. It uses the official Kubernetes Node.js client library to connect to clusters via API server URLs, tokens, or certificates. The plugin automatically registers the KubernetesService and provides tools for resource discovery.

## Usage Examples

### Basic Agent Setup

```typescript
import &#123; Agent &#125; from '@tokenring-ai/agent';
import KubernetesService from '@tokenring-ai/kubernetes';
import listKubernetesApiResources from '@tokenring-ai/kubernetes/tools/listKubernetesApiResources';

const agent = new Agent(&#123;
  services: [new KubernetesService(&#123;
    clusterName: 'my-cluster',
    apiServerUrl: 'https://api.example.com:6443',
    namespace: 'default',
    token: process.env.K8S_TOKEN,
  &#125;)],
  tools: [listKubernetesApiResources],
&#125;);

// Execute the tool through the agent
const result = await agent.executeTool('kubernetes/listKubernetesApiResources', &#123;&#125;);
const resources = JSON.parse(result.output);
console.log(resources);
```

### Plugin Configuration

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp(&#123;
  config: &#123;
    kubernetes: &#123;
      clusterName: 'my-cluster',
      apiServerUrl: 'https://api.example.com:6443',
      namespace: 'production',
      token: process.env.K8S_TOKEN,
    &#125;
  &#125;
&#125;);
```

## Core Properties

### KubernetesService Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Always `"KubernetesService"` |
| `description` | `string` | Always `"Provides Kubernetes functionality"` |
| `clusterName` | `string` | Unique identifier for the cluster |
| `apiServerUrl` | `string` | Full URL to the Kubernetes API server |
| `namespace` | `string` | Target namespace (defaults to "default") |
| `token` | `string \| undefined` | Bearer token for authentication |
| `clientCertificate` | `string \| undefined` | Client certificate in PEM format |
| `clientKey` | `string \| undefined` | Client private key in PEM format |
| `caCertificate` | `string \| undefined` | CA certificate for server verification |

## Key Features

- **Resource Discovery**: Lists all accessible API resources across core and custom resource groups
- **Multi-Namespace Support**: Discovers resources across all namespaces or specified namespace
- **Authentication Support**: Token-based and client certificate authentication
- **Plugin Integration**: Automatic integration with TokenRing applications
- **Error Handling**: Graceful error handling with detailed error messages
- **Service Architecture**: Built on TokenRing service architecture for seamless agent integration

## Core Methods and API

### Constructor

```typescript
constructor(params: KubernetesServiceParams)
```

**Parameters:**
- `clusterName: string` (required): Unique identifier for the cluster
- `apiServerUrl: string` (required): Full URL to the Kubernetes API server
- `namespace?: string`: Target namespace (defaults to "default")
- `token?: string`: Bearer token for authentication
- `clientCertificate?: string`: Client certificate in PEM format
- `clientKey?: string`: Client private key in PEM format
- `caCertificate?: string`: CA certificate for server verification (optional)

**Throws:** Error if `clusterName` or `apiServerUrl` are missing

### Getters

- `getClusterName(): string` - Returns cluster name
- `getApiServerUrl(): string` - Returns API server URL
- `getNamespace(): string` - Returns target namespace
- `getToken(): string | undefined` - Returns authentication token
- `getClientCertificate(): string | undefined` - Returns client certificate
- `getClientKey(): string | undefined` - Returns client private key
- `getCaCertificate(): string | undefined` - Returns CA certificate

### listAllApiResourceTypes

```typescript
listAllApiResourceTypes(agent: Agent): Promise&lt;K8sResourceInfo[]&gt;
```

Discovers and lists all API resources in the configured Kubernetes cluster.

**Returns:** `Promise&lt;K8sResourceInfo[]&gt;` - Array of discovered resources

**Response Format:**
```typescript
interface K8sResourceInfo &#123;
  group?: string;      // API group (e.g., "apps" or "" for core)
  version?: string;    // API version (e.g., "v1")
  kind?: string;       // Resource kind (e.g., "Pod")
  namespace?: string;  // Namespace for namespaced resources
  name?: string;       // Resource name
  error?: string;      // Error message if listing failed
&#125;
```

### Tools

#### listKubernetesApiResources

TokenRing AI tool for listing Kubernetes resources without direct service access.

**Tool Definition:**
- **Internal Name:** `kubernetes_listKubernetesApiResources`
- **Public Name:** `kubernetes/listKubernetesApiResources` (when registered)
- **Input Schema:** `z.object(&#123;&#125;)` (no inputs required)
- **Description:** "Lists all instances of all accessible API resource types in the configured Kubernetes cluster. Fetches resources from all discoverable namespaces if the service is configured to do so, or from the default/specified namespace."

**Execution:**
```typescript
execute(&#123;&#125;, agent: Agent): Promise&lt;&#123; output: string &#125;&gt;
```

Returns JSON-stringified results from `KubernetesService.listAllApiResourceTypes(agent)`.

## Configuration

### KubernetesServiceParams Schema

```typescript
const schema = z.object(&#123;
  clusterName: z.string(),
  apiServerUrl: z.string(),
  namespace: z.string().optional(),
  token: z.string().optional(),
  clientCertificate: z.string().optional(),
  clientKey: z.string().optional(),
  caCertificate: z.string().optional(),
&#125;);
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `clusterName` | `string` | Unique identifier for the cluster |
| `apiServerUrl` | `string` | Full URL to the Kubernetes API server |
| `namespace` | `string` | Target namespace (optional - defaults to "default") |
| `token` | `string` | Bearer token for authentication (preferred over certificates) |
| `clientCertificate` | `string` | Client certificate in PEM format |
| `clientKey` | `string` | Client private key in PEM format |
| `caCertificate` | `string` | CA certificate for server verification (optional) |

### Authentication Methods

1. **Token Authentication** (Recommended):

```typescript
&#123;
  clusterName: 'cluster',
  apiServerUrl: 'https://api.example.com:6443',
  token: 'your-bearer-token',
&#125;
```

2. **Certificate Authentication**:

```typescript
&#123;
  clusterName: 'cluster',
  apiServerUrl: 'https://api.example.com:6443',
  clientCertificate: 'cert-data',
  clientKey: 'key-data',
  caCertificate: 'ca-cert-data', // optional
&#125;
```

### Namespace Handling

- **Specified namespace**: Service scans only the specified namespace
- **No namespace**: Service attempts to discover all namespaces using `CoreV1Api.listNamespace()`
- **Fallback**: If namespace discovery fails, defaults to "default" namespace

## Integration

### Service Registration

The KubernetesService automatically registers with TokenRing applications through the plugin architecture:

```typescript
// Plugin automatically handles service registration
app.addServices(new KubernetesService(config));
```

### Tool Registration

Tools are automatically added to chat services:

```typescript
chatService.addTools(packageJSON.name, tools)
```

### Event System

The service follows TokenRing's event-driven architecture. While specific event types aren't documented here, it integrates with the global event system for:
- Service lifecycle events
- Agent interaction events
- Error propagation events

### Plugin Integration

```typescript
const kubernetesPlugin = &#123;
  name: "@tokenring-ai/kubernetes",
  version: "0.2.0",
  description: "Kubernetes resources integration",
  install: (app: TokenRingApp) =&gt; void
&#125;;
```

## Best Practices

1. **Credential Management**: Handle credentials securely (use environment variables in production)
2. **Token Security**: Avoid logging authentication tokens
3. **Certificate Handling**: Store certificates securely and rotate regularly
4. **Network Security**: Use HTTPS URLs for API server connections
5. **Namespace Access**: Respect Kubernetes RBAC permissions for namespace and resource access

## Testing

Run tests with:

```bash
bun run test
```

Tests cover:
- Tool execution functionality
- Service method calls
- Error handling scenarios
- Registry integration

## Related Components

- `@tokenring-ai/agent`: Agent framework that uses KubernetesService
- `@tokenring-ai/app`: Application framework that integrates the plugin
- `@tokenring-ai/chat`: Chat service that provides tool registration
- `@kubernetes/client-node`: Official Kubernetes Node.js client library

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@kubernetes/client-node` | ^1.4.0 | Official Kubernetes Node.js client library |
| `@tokenring-ai/agent` | 0.2.0 | TokenRing AI agent framework |
| `@tokenring-ai/app` | 0.2.0 | TokenRing AI application framework |
| `@tokenring-ai/chat` | 0.2.0 | TokenRing AI chat services |
| `zod` | catalog: | Schema validation library |
| `glob-gitignore` | ^1.0.15 | Glob patterns with .gitignore support |
| `next-auth` | ^4.24.13 | Authentication for Next.js applications |
| `react-syntax-highlighter` | ^16.1.0 | Syntax highlighting for React |
| `vite` | 7.3.0 | Build tool for modern web projects |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | catalog: | Testing framework |
| `typescript` | catalog: | TypeScript compiler |

## Limitations

- **Read-only Operations**: Currently focused on resource discovery and listing
- **No CRUD Operations**: Create, update, delete operations not yet implemented
- **Pagination**: Large clusters may produce verbose results (no pagination implemented)
- **Authentication**: Only token and client certificate authentication supported
- **Error Handling**: Resource-specific errors are captured in individual `K8sResourceInfo.error` fields

## License

MIT License - see LICENSE file for details.
