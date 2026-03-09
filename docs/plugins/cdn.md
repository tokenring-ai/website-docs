# CDN Plugin

## Overview

The `@tokenring-ai/cdn` package provides a centralized service for managing content delivery network operations within the Token Ring ecosystem. It offers a unified abstraction layer for CDN providers, enabling consistent file upload, download, delete, and existence check operations across different CDN implementations.

This package is designed as a Token Ring plugin that integrates with the application framework using the service registry pattern, allowing agents and other services to perform CDN operations through a consistent interface.

## Key Features

- **Multi-Provider Support**: Register and manage multiple CDN providers with a unified interface
- **Unified API**: Consistent interface across different CDN implementations (AWS S3, Cloudflare R2, custom providers)
- **Core Operations**: Upload, download, delete, and check file existence
- **Type-Safe Configuration**: Zod-based schema validation for configuration
- **Service Registry**: Built on Token Ring's KeyedRegistry for provider management
- **Plugin Integration**: Seamless integration with Token Ring applications via service registry
- **Comprehensive Error Handling**: Clear error messages for common scenarios
- **Flexible Configuration**: Customizable options for different CDN providers
- **Default Implementations**: Built-in HTTP-based download and exists operations using fetch

## Core Components

### CDNService

The main service class that manages CDN operations and provider registration. Implements the `TokenRingService` interface and is registered with the Token Ring application when the plugin is installed with CDN configuration.

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();
```

#### Properties

- **name**: `"CDNService"` - Service identifier for the Token Ring registry
- **description**: `"Abstract interface for CDN operations"` - Human-readable service description

#### Methods

##### registerProvider

Register a CDN provider with a unique name. Uses KeyedRegistry internally for provider management. The name is automatically extracted from the provider instance.

This method is exposed as a public property for convenience:

```typescript
cdnService.registerProvider = this.providers.register;
```

```typescript
// Register a provider
cdnService.registerProvider(new S3CDNProvider());
```

**Parameters:**
- `provider` (CDNProvider): Provider implementation instance

**Returns:** Registered CDNProvider instance

**Note:** The provider's name is automatically extracted from the instance for registration

##### getCDNByName

Retrieves a registered CDN provider by name.

```typescript
const provider = cdnService.getCDNByName('s3');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider

**Returns:** The CDNProvider instance

**Throws:** Error with message `CDN {cdnName} not found. Please register it first with registerCDN(cdnName, cdnProvider).` if provider is not found

##### upload

Uploads data to a specific CDN provider. Automatically converts string data to Buffer.

```typescript
const result = await cdnService.upload('s3', fileBuffer, {
  filename: 'example.txt',
  contentType: 'text/plain',
  metadata: { author: 'test' }
});
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `data` (string | Buffer): File content as string or Buffer
- `options` (UploadOptions): Optional upload parameters

**Returns:** Promise resolving to `UploadResult`

**Throws:** 
- Error if no CDN provider is found with the given name
- Error if CDNName is empty ("No active CDN set. Please set an active CDN before uploading.")

**Implementation Detail:**
```typescript
async upload(cdnName: string, data: string | Buffer, options: UploadOptions): Promise<UploadResult> {
  if (!cdnName) throw new Error("No active CDN set. Please set an active CDN before uploading.");

  if (typeof data === "string") data = Buffer.from(data);

  return this.getCDNByName(cdnName).upload(data, options);
}
```

##### delete

Deletes a file from a specific CDN provider.

```typescript
const result = await cdnService.delete('s3', 'https://example.com/file.txt');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `url` (string): URL of the file to delete

**Returns:** Promise resolving to `DeleteResult`

**Throws:** 
- Error if CDN provider not found
- Error if delete method is not supported by the provider ("Active CDN does not support deletion")

**Note:** The delete method is optional - providers may not implement it

**Implementation Detail:**
```typescript
async delete(cdnName: string, url: string): Promise<DeleteResult> {
  const cdn = this.getCDNByName(cdnName);
  if (!cdn) throw new Error(`No active CDN set. Please set an active CDN before deleting.`);

  if (!cdn.delete) throw new Error(`Active CDN does not support deletion`);
  return cdn.delete(url);
}
```

##### download

Downloads a file from a specific CDN provider.

```typescript
const data = await cdnService.download('s3', 'https://example.com/file.txt');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `url` (string): URL of the file to download

**Returns:** Promise resolving to Buffer containing file data

**Throws:** Error if CDN provider not found or download fails

**Note:** Uses the provider's download implementation, which defaults to HTTP GET via fetch if not overridden

**Implementation Detail:**
```typescript
async download(cdnName: string, url: string): Promise<Buffer> {
  const cdn = this.getCDNByName(cdnName)
  if (!cdn) throw new Error(`No active CDN set. Please set an active CDN before downloading.`);

  return cdn.download(url);
}
```

##### exists

Checks if a file exists in a specific CDN provider.

```typescript
const exists = await cdnService.exists('s3', 'https://example.com/file.txt');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `url` (string): URL of the file to check

**Returns:** Promise resolving to boolean indicating file existence

**Note:** Returns false if CDN provider not found (does not throw). Uses the provider's exists implementation, which defaults to HTTP HEAD via fetch if not overridden

**Implementation Detail:**
```typescript
async exists(cdnName: string, url: string): Promise<boolean> {
  const cdn = this.getCDNByName(cdnName);
  if (!cdn) return false;

  return cdn.exists(url);
}
```

### CDNProvider

Abstract base class for implementing CDN providers. All CDN providers must extend this class and implement the required `upload` method. Default implementations are provided for `download` and `exists` using HTTP fetch.

```typescript
import CDNProvider from "@tokenring-ai/cdn";

class MyCDNProvider extends CDNProvider {
  // Implementation here
}
```

#### Required Methods

##### upload

Implement upload logic for your CDN provider. This is the only required method.

```typescript
async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
  // Implement upload logic
  const url = await this.uploadToCustomCDN(data, options);
  return { url };
}
```

**Parameters:**
- `data` (Buffer): File content as Buffer
- `options` (UploadOptions): Optional upload parameters

**Returns:** Promise resolving to `UploadResult` with url, optional id, and metadata

**Throws:** Error with message "Method 'upload' must be implemented by subclasses" if not overridden

#### Optional Methods

##### delete?

Delete a file from the CDN. Optional method with no default implementation. Must be implemented if delete functionality is needed.

```typescript
async delete?(url: string): Promise<DeleteResult> {
  const success = await this.deleteFromCustomCDN(url);
  return { success };
}
```

**Parameters:**
- `url` (string): URL of the file to delete

**Returns:** Promise resolving to `DeleteResult`

**Note:** This is an optional method - providers may choose not to implement it

##### download

Download a file from the CDN using HTTP GET via fetch. Default implementation provided.

```typescript
async download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
```

**Parameters:**
- `url` (string): URL of the file to download

**Returns:** Promise resolving to Buffer containing file data

**Throws:** Error with message `Failed to download file: {statusText}` on HTTP errors

**Note:** Can be overridden for CDN-specific download logic

##### exists

Check if a file exists in the CDN using HTTP HEAD via fetch. Default implementation provided.

```typescript
async exists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

**Parameters:**
- `url` (string): URL of the file to check

**Returns:** Promise resolving to boolean

**Note:** Returns false on network errors. Can be overridden for CDN-specific existence checks

## Type Definitions

### UploadOptions

```typescript
export interface UploadOptions {
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}
```

### UploadResult

```typescript
export interface UploadResult {
  url: string;
  id?: string;
  metadata?: Record<string, any>;
}
```

### DeleteResult

```typescript
export interface DeleteResult {
  success: boolean;
  message?: string;
}
```

### CDNConfigSchema

Zod schema for validating CDN configuration. Available as a named export from the package:

```typescript
import { CDNConfigSchema } from "@tokenring-ai/cdn";
```

Schema definition:
```typescript
z.object({
  providers: z.record(z.string(), z.any())
}).optional()
```

## Services

### CDNService

The CDNService implements the `TokenRingService` interface and provides the following capabilities:

- **Service Name**: `CDNService`
- **Provider Management**: Uses KeyedRegistry to manage multiple CDN providers
- **Operation Routing**: Routes CDN operations to the appropriate provider based on name
- **Error Handling**: Provides clear error messages for common scenarios

#### Service Registration

When the CDN plugin is installed with configuration, the CDNService is automatically registered:

```typescript
import CDNPlugin from "@tokenring-ai/cdn/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [CDNPlugin],
  config: {
    cdn: {
      providers: {
        // Your CDN provider configurations
      }
    }
  }
});

// CDNService is automatically registered when config.cdn exists
const cdnService = app.services.getItemByType(CDNService);
```

**Plugin Installation Logic:**
```typescript
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.cdn) {
      const service = new CDNService();
      app.addServices(service);
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

**Important:** The plugin checks if `config.cdn` exists in the configuration. If present, the CDNService is registered with the Token Ring application. The actual provider implementations must be registered programmatically using `registerProvider()` with your specific CDN implementation instances.

## Provider Documentation

### CDNProvider Interface

The CDNProvider is an abstract class that provides a unified interface for CDN operations. All custom CDN providers must extend this class.

#### Provider Implementation Pattern

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

#### Provider Registration

Providers are registered with the CDNService using the KeyedRegistry pattern:

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();
const provider = new CustomCDNProvider();

// Register provider - name is extracted from provider instance
cdnService.registerProvider(provider);

// Retrieve by name
const retrievedProvider = cdnService.getCDNByName('custom');
```

## RPC Endpoints

This package does not define RPC endpoints. CDN operations are accessed through the service registry pattern.

## Chat Commands

This package does not define chat commands. CDN operations are accessed programmatically through the CDNService.

## Configuration

Configure the CDN service through the Token Ring application configuration:

```typescript
// In your app configuration
const config = {
  cdn: {
    providers: {
      // Your CDN provider configurations here
    }
  }
};
```

**Configuration Structure:**
- `cdn.providers`: Record of provider names to provider configurations
- Each provider can define its own configuration schema

Example provider configuration:

```typescript
{
  cdn: {
    providers: {
      s3: {
        bucket: 'my-bucket',
        region: 'us-east-1',
        // Provider-specific settings
      },
      cloudflare: {
        accountId: 'my-account',
        zoneId: 'my-zone',
        // Provider-specific settings
      }
    }
  }
}
```

## Integration

### Token Ring Application Integration

The CDN package integrates with Token Ring applications through the plugin system:

```typescript
import CDNPlugin from "@tokenring-ai/cdn/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [CDNPlugin],
  config: {
    cdn: {
      providers: {
        // Provider configurations
      }
    }
  }
});

// Access the CDN service
const cdnService = app.services.getItemByType(CDNService);
```

### Agent System Integration

The CDNService is registered with the Token Ring agent system, allowing agents to perform CDN operations through the service registry:

```typescript
import { CDNService } from "@tokenring-ai/cdn";

// In an agent command or tool
const cdnService = app.services.getItemByType(CDNService);
const result = await cdnService.upload('provider-name', fileBuffer, { 
  filename: 'file.txt',
  contentType: 'text/plain'
});
```

### Plugin Registration

The CDN plugin is registered as a Token Ring plugin:

```typescript
import CDNPlugin from "@tokenring-ai/cdn/plugin";

// Plugin properties
CDNPlugin.name;        // "@tokenring-ai/cdn"
CDNPlugin.version;     // "0.2.0"
CDNPlugin.description; // "A CDN abstraction for Token Ring"
```

## Usage Examples

### Basic Integration

```typescript
import CDNPlugin from "@tokenring-ai/cdn/plugin";
import { TokenRingApp } from "@tokenring-ai/app";
import CDNService from "@tokenring-ai/cdn";

const app = new TokenRingApp({
  plugins: [CDNPlugin],
  config: {
    cdn: {
      providers: {}
    }
  }
});

// Access CDN service
const cdnService = app.services.getItemByType(CDNService);
```

### Creating a Custom CDN Provider

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

// Register the provider
const cdnService = new CDNService();
cdnService.registerProvider(new MyCustomCDNProvider());
```

### Working with Multiple Providers

```typescript
import CDNService from "@tokenring-ai/cdn";

const cdnService = new CDNService();

// Register multiple providers
cdnService.registerProvider(new S3CDNProvider());
cdnService.registerProvider(new CloudflareCDNProvider());

// Upload to specific provider
const s3Result = await cdnService.upload('s3', fileBuffer, { 
  filename: 'file.txt',
  contentType: 'text/plain'
});
const cloudflareResult = await cdnService.upload('cloudflare', fileBuffer, { 
  filename: 'file.txt'
});

// Download from specific provider
const s3Data = await cdnService.download('s3', s3Result.url);
const cloudflareData = await cdnService.download('cloudflare', cloudflareResult.url);

// Check if file exists
const s3Exists = await cdnService.exists('s3', s3Result.url);
```

### Using Default Provider Implementations

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
cdnService.registerProvider(new HTTPCDNProvider());
```

### String to Buffer Conversion

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

## Best Practices

### Provider Implementation

1. **Implement Required Methods**: Always implement the `upload` method as it's the only required method
2. **Optional Delete**: Implement `delete` only if your CDN supports deletion
3. **Leverage Defaults**: Use the default `download` and `exists` implementations for HTTP-based CDNs
4. **Error Handling**: Provide clear error messages when operations fail
5. **Metadata**: Include relevant metadata in upload results when available

### Service Usage

1. **Provider Registration**: Register all providers before attempting to use them
2. **Error Handling**: Handle errors from `getCDNByName` as it throws when provider is not found
3. **Optional Operations**: Check if `delete` is available before calling it on a provider
4. **Type Safety**: Use TypeScript for type-safe CDN operations

### Configuration

1. **Schema Validation**: Use the provided `CDNConfigSchema` for configuration validation
2. **Provider Configurations**: Store provider-specific configurations in the `providers` object
3. **Environment Variables**: Use environment variables for sensitive configuration values

## Testing and Development

### Package Structure

```
pkg/cdn/
├── index.ts              # Main exports and Zod schema
├── types.ts              # TypeScript type definitions
├── CDNService.ts         # Main CDN service implementation
├── CDNProvider.ts        # Abstract CDN provider base class
├── plugin.ts             # Token Ring plugin integration
├── package.json
├── LICENSE
├── test/                 # Test files
│   ├── CDNProvider.test.ts
│   ├── CDNService.test.ts
│   └── types.test.ts
└── vitest.config.ts      # Test configuration
```

### Testing

Run tests with bun:

```bash
bun run test
bun run test:coverage
bun run test:watch
```

Tests use vitest and cover:
- CDNService provider registration and retrieval
- CDNProvider default implementations
- Type definitions and schemas

### Building

```bash
bun run build
```

This runs TypeScript type checking with `tsc --noEmit`.

### Development Guidelines

- Follow existing code style and patterns
- Add unit tests for new functionality
- Update documentation for new features
- Ensure all changes work with Token Ring agent framework
- Use TypeScript strict mode
- Maintain backward compatibility

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/app`: `0.2.0` - Token Ring application framework
- `@tokenring-ai/chat`: `0.2.0` - Chat interface integration
- `@tokenring-ai/agent`: `0.2.0` - Agent system integration
- `@tokenring-ai/utility`: `0.2.0` - Utility functions including KeyedRegistry
- `zod`: `^4.3.6` - Schema validation
- `uuid`: `^13.0.0` - UUID generation (may be used by provider implementations)

### Dev Dependencies

- `vitest`: `^4.0.18` - Testing framework
- `typescript`: `^5.9.3` - TypeScript compiler

## Related Components

- **@tokenring-ai/app**: Base application framework with service management
- **@tokenring-ai/agent**: Agent orchestration system
- **@tokenring-ai/utility**: Utility functions including KeyedRegistry
- **@tokenring-ai/chat**: Chat interface for human interaction
- **@tokenring-ai/s3**: AWS S3 CDN provider implementation
- **@tokenring-ai/wordpress**: WordPress CDN provider implementation
- **@tokenring-ai/ghost-io**: Ghost.io CDN provider implementation

## License

MIT License - see `LICENSE` file for details.
