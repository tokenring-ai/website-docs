# CDN

## User Guide

### Overview

The `@tokenring-ai/cdn` package provides a Content Delivery Network (CDN) abstraction service for the Token Ring platform. It enables seamless integration with multiple CDN providers through a unified API, designed as a Token Ring plugin that integrates with the Token Ring application framework using the service registry pattern.

### Key Features

- **Multi-Provider Support**: Register and manage multiple CDN providers with a unified interface
- **Unified API**: Consistent interface across different CDN implementations
- **Core Operations**: Upload, download, delete, and check file existence
- **Type-Safe Configuration**: Zod-based schema validation for configuration
- **Service Registry**: Built on Token Ring's KeyedRegistry for provider management
- **Plugin Integration**: Seamless integration with Token Ring applications via service registry
- **Comprehensive Error Handling**: Clear error messages for common scenarios
- **Flexible Configuration**: Customizable options for different CDN providers
- **Default Implementations**: Built-in HTTP-based download and exists operations using fetch
- **String to Buffer Conversion**: Automatic conversion of string data to Buffer on upload

### Chat Commands

| Command              | Description                       |
|----------------------|-----------------------------------|
| `/cdn provider list` | List all registered CDN providers |

#### /cdn provider list

Lists all currently registered CDN providers in the system.

**Example:**

```bash
/cdn provider list
```

**Output:**

```text
s3
cloudflare
custom
```

If no providers are registered, the command returns: "No CDN providers are registered."

### Tools

This package does not define any tools. CDN operations are accessed through the service registry pattern.

### Configuration

The CDN package accepts an optional configuration object. The configuration schema is defined using Zod.

#### Configuration Schema

```yaml
cdn: {}
```

The CDN configuration schema accepts an empty configuration object or no configuration at all. Specific CDN provider implementations should define their own configuration schemas.

#### Environment Variables

This package does not define any environment variables. Provider-specific configurations should be handled by individual CDN provider implementations.

### Integration

The CDN package integrates with Token Ring applications through the plugin system:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import CDNPlugin from "@tokenring-ai/cdn";

const app = new TokenRingApp();

// Install plugin with CDN configuration
app.use(CDNPlugin, { cdn: {} });

// Access the CDN service
const cdnService = app.getService('CDNService');
```

### Best Practices

#### Provider Implementation

1. **Implement Required Methods**: Always implement the `upload` method as it's the only required method
2. **Optional Delete**: Implement `delete` only if your CDN supports deletion
3. **Leverage Defaults**: Use the default `download` and `exists` implementations for HTTP-based CDNs
4. **Error Handling**: Provide clear error messages when operations fail
5. **Metadata**: Include relevant metadata in upload results when available
6. **Binary Data**: Ensure your upload implementation handles Buffer data correctly for binary files

#### Service Usage

1. **Provider Registration**: Register all providers before attempting to use them
2. **Explicit Names**: Use clear, descriptive names when registering providers
3. **Error Handling**: Handle errors from `requireCDNByName` as it throws when provider is not found
4. **Optional Operations**: Check if `delete` is available before calling it on a provider
5. **Type Safety**: Use TypeScript for type-safe CDN operations

---

## Developer Reference

### Core Components

#### CDNService

The main service class that manages CDN operations and provider registration. Implements `TokenRingService` interface and is automatically registered with the Token Ring application when the plugin is installed with CDN configuration.

**Service Name**: `CDNService`

**Description**: `Abstract interface for CDN operations`

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();
```

##### Properties

- **name**: `"CDNService"` - Service identifier for the Token Ring registry
- **description**: `"Abstract interface for CDN operations"` - Human-readable service description
- **registerProvider**: Exposed public method from KeyedRegistry for registering CDN providers
- **getAvailableProviders**: Exposed public method from KeyedRegistry for listing registered providers

##### CDNService Methods

#### registerProvider

Register a CDN provider with an explicit unique name. Uses KeyedRegistry internally for provider management. The name must be explicitly provided when registering.

```typescript
cdnService.registerProvider('s3', new S3CDNProvider());
```

#### getAvailableProviders

Returns an array of registered provider names.

```typescript
const providers = cdnService.getAvailableProviders(); // ['s3', 'cloudflare']
```

#### requireCDNByName

Retrieves a registered CDN provider by name. Throws an error if the provider is not found.

Parameters:

- `cdnName`: The name of the registered CDN provider

Returns:

- `CDNProvider` instance

Throws:

- `Error` with message "CDN {cdnName} not found. Please register it first with registerCDN(cdnName, cdnProvider)."

```typescript
const provider = cdnService.requireCDNByName('s3');
```

#### upload

Upload data to a specific CDN provider. Converts string data to Buffer automatically.

Parameters:

- `cdnName`: The name of the registered CDN provider
- `data`: The file content as string or Buffer
- `options`: Optional upload parameters (filename, contentType, metadata)

Returns:

- Promise resolving to `UploadResult`

Throws:

- Error if no CDN provider is found with the given name

```typescript
const result = await cdnService.upload('s3', fileBuffer, {
  filename: 'file.txt',
  contentType: 'text/plain'
});
```

#### delete

Delete a file from a specific CDN provider.

Parameters:

- `cdnName`: The name of the registered CDN provider
- `url`: The URL of the file to delete

Returns:

- Promise resolving to `DeleteResult`

Throws:

- Error if CDN provider not found or delete method not supported by the provider

```typescript
const result = await cdnService.delete('s3', 'https://cdn.example.com/file.txt');
```

#### download

Download a file from a specific CDN provider.

Parameters:

- `cdnName`: The name of the registered CDN provider
- `url`: The URL of the file to download

Returns:

- Promise resolving to Buffer containing file data

Throws:

- Error if CDN provider not found or download fails

```typescript
const data = await cdnService.download('s3', 'https://cdn.example.com/file.txt');
```

#### exists

Check if a file exists in a specific CDN provider.

Parameters:

- `cdnName`: The name of the registered CDN provider
- `url`: The URL of the file to check

Returns:

- Promise resolving to boolean indicating file existence

Returns false if CDN provider not found (does not throw)

```typescript
const fileExists = await cdnService.exists('s3', 'https://cdn.example.com/file.txt');
```

#### CDNProvider

Abstract base class for implementing CDN providers. All CDN providers must extend this class and implement the required `upload` method. Default implementations are provided for `download` and `exists` using HTTP fetch.

```typescript
import CDNProvider from "@tokenring-ai/cdn";

class MyCDNProvider extends CDNProvider {
  // Implementation here
}
```

##### CDNProvider Methods

#### CDNProvider.upload

Implement upload logic for your CDN provider.

Parameters:

- `data`: The file content as Buffer
- `options`: Optional upload parameters (filename, contentType, metadata)

Returns:

- Promise resolving to `UploadResult` with url, optional id, and metadata

Throws:

- `Error` with message "Method 'upload' must be implemented by subclasses"

#### delete?

Delete a file from the CDN. Optional method with no default implementation. Must be implemented if delete functionality is needed.

Parameters:

- `url`: The URL of the file to delete

Returns:

- Promise resolving to `DeleteResult`

#### CDNProvider.download

Download a file from the CDN using HTTP GET via fetch. Default implementation provided.

Parameters:

- `url`: The URL of the file to download

Returns:

- Promise resolving to Buffer containing file data

Throws:

- `Error` with message "Failed to download file: {statusText}" on HTTP errors

#### CDNProvider.exists

Check if a file exists in the CDN using HTTP HEAD via fetch. Default implementation provided.

Parameters:

- `url`: The URL of the file to check

Returns:

- Promise resolving to boolean

Returns false on network errors

### Services

#### CDNService Implementation

The CDNService implements the `TokenRingService` interface and provides the following capabilities:

- **Service Name**: `CDNService`
- **Provider Management**: Uses KeyedRegistry to manage multiple CDN providers
- **Operation Routing**: Routes CDN operations to the appropriate provider based on name
- **Error Handling**: Provides clear error messages for common scenarios

##### Service Registration

When the CDN plugin is installed with configuration, the CDNService is automatically registered:

```typescript
// Plugin installation with CDN configuration
app.use(CDNPlugin, { cdn: {} });

// Service is automatically available
const cdnService = app.getService('CDNService');
```

### Provider Documentation

#### CDNProvider Interface

The CDNProvider is an abstract class that provides a unified interface for CDN operations. All custom CDN providers must extend this class.

##### Provider Implementation Pattern

```typescript
import CDNProvider from "@tokenring-ai/cdn";
import type { UploadOptions, UploadResult, DeleteResult } from "@tokenring-ai/cdn";

class CustomCDNProvider extends CDNProvider {
  async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
    // Implement upload logic
    // Must return UploadResult with at least a url property
  }

  async delete?(url: string): Promise<DeleteResult> {
    // Optional: Implement delete logic
  }

  // download() and exists() have default implementations
}
```

##### Provider Registration

Providers are registered with the CDNService using the KeyedRegistry pattern with explicit names:

```typescript
const cdnService = new CDNService();
const provider = new CustomCDNProvider();

// Register provider with explicit name
cdnService.registerProvider('custom', provider);

// Retrieve by name
const retrievedProvider = cdnService.requireCDNByName('custom');

// List all providers
const providerNames = cdnService.getAvailableProviders();
```

### RPC Endpoints

This package does not define RPC endpoints. CDN operations are accessed through the service registry pattern.

### Usage Examples

#### Basic Integration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import CDNPlugin from "@tokenring-ai/cdn";

const app = new TokenRingApp();
app.use(CDNPlugin, { cdn: {} });
app.start();

// Access CDN service
const cdnService = app.getService('CDNService');
```

#### Creating a Custom CDN Provider

```typescript
import CDNProvider from "@tokenring-ai/cdn";
import CDNService from "@tokenring-ai/cdn";
import type { UploadOptions, UploadResult, DeleteResult } from "@tokenring-ai/cdn";

class MyCustomCDNProvider extends CDNProvider {
  async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
    // Implement your upload logic
    const url = await this.uploadToCustomCDN(data, options);
    return {
      url,
      id: options?.filename,
      metadata: options?.metadata
    };
  }

  async delete?(url: string): Promise<DeleteResult> {
    // Optional: Implement delete logic
    const success = await this.deleteFromCustomCDN(url);
    return {
      success,
      message: success ? 'File deleted successfully' : 'Failed to delete file'
    };
  }
}

// Register the provider with explicit name
const cdnService = new CDNService();
cdnService.registerProvider('my-custom', new MyCustomCDNProvider());
```

#### Working with Multiple Providers

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();

// Register multiple providers with explicit names
cdnService.registerProvider('provider1', new CustomCDNProvider());
cdnService.registerProvider('provider2', new AnotherCDNProvider());

// List all providers
const providers = cdnService.getAvailableProviders(); // ['provider1', 'provider2']

// Upload to specific provider
const result = await cdnService.upload('provider1', fileBuffer, {
  filename: 'file.txt',
  contentType: 'text/plain'
});

// Download from specific provider
const data = await cdnService.download('provider1', result.url);

// Check if file exists
const exists = await cdnService.exists('provider1', result.url);
```

#### Using Default Provider Implementations

CDNProvider provides default implementations for `download` and `exists` using fetch:

```typescript
import CDNProvider from "@tokenring-ai/cdn";

class HTTPCDNProvider extends CDNProvider {
  async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
    // Implement only upload - download and exists use defaults
    const url = `https://my-cdn.com/${options?.filename || 'default.txt'}`;
    return { url };
  }

  // download() uses default fetch implementation
  // exists() uses default HEAD implementation
}

const cdnService = new CDNService();
cdnService.registerProvider('http', new HTTPCDNProvider());
```

#### String to Buffer Conversion

The CDNService automatically converts string data to Buffer:

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();

// String data is automatically converted to Buffer
const result = await cdnService.upload('provider', 'Hello, World!', {
  filename: 'hello.txt',
  contentType: 'text/plain'
});

// Buffer data works directly
const bufferResult = await cdnService.upload('provider', Buffer.from('Hello, World!'), {
  filename: 'hello.txt'
});
```

#### Error Handling

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();

// Register a provider first
cdnService.registerProvider('provider1', new CustomCDNProvider());

try {
  // This will succeed
  const result = await cdnService.upload('provider1', Buffer.from('data'), { filename: 'test.txt' });
} catch (error) {
  console.error('Upload failed:', error.message);
}

try {
  // This will throw - provider not found
  const result = await cdnService.upload('non-existent', Buffer.from('data'), { filename: 'test.txt' });
} catch (error) {
  console.error('Error:', error.message); // "CDN non-existent not found..."
}

try {
  // This will throw - delete not supported
  await cdnService.delete('provider-without-delete', 'https://example.com/file.txt');
} catch (error) {
  console.error('Error:', error.message); // "Active CDN does not support deletion"
}
```

### Testing

The package includes comprehensive tests using vitest. Tests cover:

- CDNService provider registration and retrieval
- CDNProvider default implementations
- Type definitions and schemas
- Upload, download, delete, and exists operations
- Error handling scenarios

Run tests with:

```bash
bun run test
bun run test:coverage
bun run test:watch
```

Test files are located in `pkg/cdn/test/`:

- `CDNProvider.test.ts`
- `CDNService.test.ts`
- `types.test.ts`

### Dependencies

#### Runtime Dependencies

- `@tokenring-ai/agent`: `workspace:*` - Agent system integration
- `@tokenring-ai/app`: `workspace:*` - Token Ring application framework
- `@tokenring-ai/utility`: `workspace:*` - Utility functions including KeyedRegistry
- `zod`: `^4.3.6` - Schema validation

#### Dev Dependencies

- `vitest`: `^4.1.1` - Testing framework
- `typescript`: `^6.0.2` - TypeScript compiler

### Related Components

- **@tokenring-ai/app**: Base application framework with service management
- **@tokenring-ai/utility**: Utility functions including KeyedRegistry
- **@tokenring-ai/agent**: Agent system for command integration

### Schema Definitions

#### UploadOptions

```typescript
export interface UploadOptions {
  filename?: string | undefined;
  contentType?: string | undefined;
  metadata?: Record<string, string> | undefined;
}
```

#### UploadResult

```typescript
export interface UploadResult {
  url: string;
  id?: string | undefined;
  metadata?: Record<string, any> | undefined;
}
```

#### DeleteResult

```typescript
export interface DeleteResult {
  success: boolean;
  message?: string | undefined;
}
```

#### CDNConfigSchema

Zod schema for validating CDN configuration:

```typescript
import { CDNConfigSchema } from "@tokenring-ai/cdn";

// Schema definition
z.object({}).exactOptional()
```

This schema accepts an empty configuration object or no configuration at all.

## License

MIT License - see LICENSE file for details.
