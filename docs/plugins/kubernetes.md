# Kubernetes Plugin

Kubernetes integration for discovering and interacting with cluster resources.

## Overview

The `@tokenring-ai/kubernetes` package provides Kubernetes integration for TokenRing AI agents. It enables AI agents to discover and interact with Kubernetes clusters by listing all accessible API resources, including core and custom resources across namespaces.

## Key Features

- Discover all API resources in a cluster
- List resources across namespaces
- Support for core and custom resources
- Authentication via token or client certificates
- Fallback handling for namespace listing

## Core Components

### KubernetesService

Main class for Kubernetes integration.

**Constructor Parameters:**
- `clusterName`: Required cluster identifier
- `apiServerUrl`: Required Kubernetes API server URL
- `namespace?`: Target namespace (defaults to "default")
- `token?`: Bearer token for authentication
- `clientCertificate?`: Client certificate (PEM/Base64)
- `clientKey?`: Client private key (PEM/Base64)
- `caCertificate?`: CA certificate for server verification

**Key Methods:**
- `getClusterName()`: Returns cluster name
- `getApiServerUrl()`: Returns API server URL
- `getNamespace()`: Returns configured namespace
- `listAllApiResourceTypes(agent)`: Discovers and lists all API resources
  - Returns: `K8sResourceInfo[]` with details or errors

### Tools

**listKubernetesApiResources**: Lists all instances of all accessible API resource types
- Input: None
- Output: JSON-stringified array of `K8sResourceInfo`

## Usage Example

```typescript
import KubernetesService from '@tokenring-ai/kubernetes';

const service = new KubernetesService({
  clusterName: 'my-cluster',
  apiServerUrl: 'https://api.example.com:6443',
  namespace: 'default',
  token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
});

console.log(service.getClusterName());  // "my-cluster"

// In agent context
const resources = await service.listAllApiResourceTypes(agent);
resources.forEach(resource => {
  if (resource.error) {
    console.warn(`Error for ${resource.kind}: ${resource.error}`);
  } else {
    console.log(`${resource.kind} in ${resource.namespace || 'cluster'}: ${resource.name}`);
  }
});
```

## Configuration Options

- **Authentication**: Supports token (preferred) or client cert/key
- **Namespace Handling**: Auto-discovers all namespaces if omitted, falls back to "default"
- **CA Certificate**: Optional for insecure setups (not recommended)

## Dependencies

- `@kubernetes/client-node` (^1.3.0): Kubernetes client library
- `@tokenring-ai/agent` (0.1.0): TokenRing AI framework
- `zod`: Schema validation
