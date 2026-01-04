# CDN Plugin

## Overview

The CDN plugin provides a centralized service for managing content delivery network operations within the Token Ring ecosystem. It offers a unified abstraction layer for CDN providers, enabling consistent file upload, download, delete, and existence check operations across different CDN implementations.

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
- **Default Implementations**: Built-in HTTP-based download and exists operations

## Core Components

### CDNService

The main service class that manages CDN operations and provider registration. Implements the `TokenRingService` interface and is registered with the Token Ring application when the plugin is installed.

```typescript
import CDNService from "@tokenring-ai/cdn/CDNService.ts";

const cdnService = new CDNService();
```

#### Methods

##### registerProvider

Register a CDN provider with a unique name.

```typescript
cdnService.registerProvider('s3', new S3CDNProvider());
```

**Parameters:**
- `name` (string): Unique identifier for the provider
- `provider` (CDNProvider): Provider implementation instance

##### getCDNByName

Retrieves a registered CDN provider by name.

```typescript
const provider = cdnService.getCDNByName('s3');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider

**Returns:** The CDNProvider instance

**Throws:** Error if provider is not found

##### upload

Uploads data to a specific CDN provider.

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

**Throws:** Error if no CDN provider is set or provider not found

##### delete

Deletes a file from a specific CDN provider.

```typescript
const result = await cdnService.delete('s3', 'https://example.com/file.txt');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `url` (string): URL of the file to delete

**Returns:** Promise resolving to `DeleteResult`

**Throws:** Error if CDN not found or delete method not supported

##### download

Downloads a file from a specific CDN provider.

```typescript
const data = await cdnService.download('s3', 'https://example.com/file.txt');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `url` (string): URL of the file to download

**Returns:** Promise resolving to Buffer containing file data

**Throws:** Error if CDN not found or download fails

##### exists

Checks if a file exists in a specific CDN provider.

```typescript
const exists = await cdnService.exists('s3', 'https://example.com/file.txt');
```

**Parameters:**
- `cdnName` (string): Name of the registered CDN provider
- `url` (string): URL of the file to check

**Returns:** Promise resolving to boolean indicating file existence

**Note:** Returns false if CDN not found (does not throw)

### CDNProvider

Abstract base class for implementing CDN providers. Subclass this to create custom provider implementations.

```typescript
import CDNProvider from "@tokenring-ai/cdn/CDNProvider.ts";

class MyCDNProvider extends CDNProvider {
  // Implementation here
}
```

#### Required Methods

##### upload

Implement upload logic for your CDN provider.

```typescript
async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
  // Implement your upload logic
  const url = await this.uploadToCustomCDN(data, options);
  return { url };
}
```

**Parameters:**
- `data` (Buffer): File content as Buffer
- `options` (UploadOptions): Optional upload parameters

**Returns:** Promise resolving to `UploadResult` with url, optional id, and metadata

**Throws:** Must be implemented by subclass

#### Optional Methods

##### delete

Delete a file from the CDN. Override this method if your provider supports deletion.

```typescript
async delete(url: string): Promise<DeleteResult> {
  const success = await this.deleteFromCustomCDN(url);
  return { success };
}
```

**Parameters:**
- `url` (string): URL of the file to delete

**Returns:** Promise resolving to `DeleteResult`

**Default behavior:** Throws "Method 'delete' must be implemented by subclasses"

##### download

Download a file from the CDN. Default implementation uses HTTP GET via fetch.

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

**Throws:** "Failed to download file" on HTTP errors

##### exists

Check if a file exists in the CDN. Default implementation uses HTTP HEAD via fetch.

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

**Note:** Returns false on network errors

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

Zod schema for validating CDN configuration:

```typescript
export const CDNConfigSchema = z.object({
  providers: z.record(z.string(), z.any())
}).optional();
```

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

## Plugin Integration

As a Token Ring plugin, the CDN service automatically:
- Registers the CDN service when the plugin is installed
- Reads CDN configurations from the app's configuration slice using Zod validation
- Makes the service available through the Token Ring application registry

```typescript
import plugin from "@tokenring-ai/cdn/plugin.ts";

app.use(plugin, {
  cdn: {
    providers: {
      // Provider configurations
    }
  }
});

// Access the CDN service from the app
const cdnService = app.getService('CDNService');
```

## Usage Examples

### Basic Integration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import CDNPlugin from "@tokenring-ai/cdn";

const app = new TokenRingApp();
app.use(CDNPlugin);
app.start();
```

### Working with Multiple Providers

```typescript
// Register multiple providers
cdnService.registerProvider('s3', new S3CDNProvider());
cdnService.registerProvider('cloudflare', new CloudflareCDNProvider());

// Upload to specific provider
const s3Result = await cdnService.upload('s3', fileBuffer);
const cloudflareResult = await cdnService.upload('cloudflare', fileBuffer);

// Download from specific provider
const s3Data = await cdnService.download('s3', s3Result.url);
const cloudflareData = await cdnService.download('cloudflare', cloudflareResult.url);

// Check if file exists
const s3Exists = await cdnService.exists('s3', s3Result.url);
```

### Custom CDN Provider

```typescript
import CDNProvider from "@tokenring-ai/cdn";
import type { UploadOptions, UploadResult, DeleteResult } from "@tokenring-ai/cdn/types.ts";

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
    // Implement your delete logic
    const success = await this.deleteFromCustomCDN(url);
    return {
      success,
      message: success ? 'File deleted successfully' : 'Failed to delete file'
    };
  }
}

// Register the provider
cdnService.registerProvider('custom', new MyCustomCDNProvider());
```

### Using Default Provider Implementations

CDNProvider provides default implementations for `download` and `exists` using fetch:

```typescript
class HTTPCDNProvider extends CDNProvider {
  async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
    // Implement only upload - download and exists use defaults
    const url = `https://my-cdn.com/${options?.filename || 'default.txt'}`;
    return { url };
  }
  // download() uses default fetch implementation
  // exists() uses default HEAD implementation
}
```

## Error Handling

The CDN service provides clear error handling for common scenarios:

| Scenario               | Error Message                                                                            |
|------------------------|------------------------------------------------------------------------------------------|
| Provider Not Found     | `CDN [name] not found. Please register it first with registerCDN(cdnName, cdnProvider).` |
| No Active CDN          | `No active CDN set. Please set an active CDN before [operation].`                        |
| Method Not Implemented | `Method '[method]' must be implemented by subclasses`                                    |
| Download Failures      | `Failed to download file: [statusText]`                                                  |
| Configuration Errors   | Validation errors for invalid provider configurations                                    |
| Delete Not Supported   | `Active CDN does not support deletion`                                                   |

## Integration

### Agent System

The CDNService is registered with the Token Ring agent system, allowing agents to perform CDN operations through the service registry. Agents can access the CDN service via `app.getService('CDNService')`.

### Utility Package

Uses `@tokenring-ai/utility` for the `KeyedRegistry` class which provides the provider management functionality.

### Chat System

Integrates with the chat system to provide CDN operations as part of user interactions. Chat commands can access the CDN service through the agent system.

## Monitoring and Debugging

- **Error Logging**: All CDN operations log errors with relevant context
- **Provider Registry**: Track registered providers and their status
- **Operation Tracking**: Monitor upload, download, delete, and exists operations

## Development

### Testing

Run tests with:

```bash
bun run test
bun run test:coverage
```

### Build

TypeScript type checking:

```bash
bun run build
```

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

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
