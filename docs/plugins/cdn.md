# CDN Plugin Documentation

A CDN (Content Delivery Network) abstraction for the Token Ring platform, providing a unified interface for managing content delivery networks across multiple providers.

## Overview

The CDN plugin provides a flexible and extensible CDN management system that allows you to work with multiple CDN providers through a consistent API. It's designed as a Token Ring plugin that integrates seamlessly with the Token Ring application framework using the service registry pattern.

## Key Features

- **Multi-Provider Support**: Register and manage multiple CDN providers with a unified interface
- **Unified API**: Consistent interface across different CDN implementations
- **Core Operations**: Upload, download, delete, and check file existence
- **Plugin Integration**: Seamless integration with Token Ring applications via service registry
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Zod Validation**: Configuration validation using Zod schemas
- **Service Registry**: Built on Token Ring's KeyedRegistry for provider management

## Core Components

### CDNService

The main service class that manages CDN operations and provider registration.

```typescript
import { CDNService } from '@tokenring-ai/cdn';

// Access the CDN service from the Token Ring application
const cdnService = app.getService('CDNService');
```

#### Methods

##### `registerProvider(name: string, provider: CDNProvider): void`

Register a CDN provider with a unique name.

```typescript
cdnService.registerProvider('s3', new S3CDNProvider());
cdnService.registerProvider('cloudflare', new CloudflareCDNProvider());
```

##### `upload(cdnName: string, data: string | Buffer, options?: UploadOptions): Promise<UploadResult>`

Upload data to a specific CDN provider.

```typescript
const result = await cdnService.upload('s3', fileBuffer, {
  filename: 'example.jpg',
  contentType: 'image/jpeg',
  metadata: { author: 'John Doe' }
});
```

##### `download(cdnName: string, url: string): Promise<Buffer>`

Download a file from a specific CDN provider.

```typescript
const data = await cdnService.download('s3', 'https://example.com/file.jpg');
```

##### `delete(cdnName: string, url: string): Promise<DeleteResult>`

Delete a file from a specific CDN provider.

```typescript
const result = await cdnService.delete('s3', 'https://example.com/file.jpg');
```

##### `exists(cdnName: string, url: string): Promise<boolean>`

Check if a file exists in a specific CDN provider.

```typescript
const exists = await cdnService.exists('s3', 'https://example.com/file.jpg');
```

### CDNProvider

Abstract base class for implementing CDN providers.

```typescript
import { CDNProvider } from '@tokenring-ai/cdn';

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
```

## Types and Interfaces

### UploadOptions

Configuration options for uploading files.

```typescript
export interface UploadOptions {
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}
```

### UploadResult

Result of an upload operation.

```typescript
export interface UploadResult {
  url: string;
  id?: string;
  metadata?: Record<string, any>;
}
```

### DeleteResult

Result of a delete operation.

```typescript
export interface DeleteResult {
  success: boolean;
  message?: string;
}
```

## Configuration

### CDN Configuration Schema

```typescript
import { CDNConfigSchema } from '@tokenring-ai/cdn';

const config = {
  cdn: {
    providers: {
      // Your CDN provider configurations here
    }
  }
};
```

### Example Configuration

```typescript
const config = {
  cdn: {
    providers: {
      s3: {
        endpoint: 'https://s3.amazonaws.com',
        bucket: 'my-bucket',
        accessKeyId: 'your-access-key',
        secretAccessKey: 'your-secret-key'
      },
      cloudflare: {
        accountId: 'your-account-id',
        apiKey: 'your-api-key',
        zoneId: 'your-zone-id'
      }
    }
  }
};
```

## Integration with Token Ring

### Plugin Installation

The CDN plugin integrates with the Token Ring application framework:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import CDNPlugin from '@tokenring-ai/cdn';

const app = new TokenRingApp();
app.use(CDNPlugin);
app.start();
```

### Service Access

Access the CDN service through the Token Ring service registry:

```typescript
const cdnService = app.getService('CDNService');
```

## Usage Examples

### Basic CDN Operations

```typescript
import { CDNService } from '@tokenring-ai/cdn';

// Access the CDN service
const cdnService = app.getService('CDNService');

// Register providers
cdnService.registerProvider('s3', new S3CDNProvider());
cdnService.registerProvider('cloudflare', new CloudflareCDNProvider());

// Upload to S3
const uploadOptions = {
  filename: 'document.pdf',
  contentType: 'application/pdf',
  metadata: { author: 'John Doe', created: new Date().toISOString() }
};

const result = await cdnService.upload('s3', fileBuffer, uploadOptions);
console.log('Uploaded to:', result.url);

// Download from Cloudflare
const data = await cdnService.download('cloudflare', result.url);

// Delete from S3
const deleteResult = await cdnService.delete('s3', result.url);
console.log('Delete successful:', deleteResult.success);
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

// Check file existence
const s3Exists = await cdnService.exists('s3', s3Result.url);
const cloudflareExists = await cdnService.exists('cloudflare', cloudflareResult.url);
```

### Error Handling

The CDN service provides clear error messages for common scenarios:

```typescript
try {
  const result = await cdnService.upload('s3', fileBuffer);
} catch (error) {
  if (error.message.includes('CDN')) {
    console.error('CDN provider not found:', error.message);
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

## Creating Custom CDN Providers

To create a custom CDN provider, extend the `CDNProvider` class:

```typescript
import CDNProvider from "@tokenring-ai/cdn";

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

  async download(url: string): Promise<Buffer> {
    // Implement your download logic
    return await this.downloadFromCustomCDN(url);
  }

  async exists(url: string): Promise<boolean> {
    // Implement your exists logic
    return await this.checkExistsInCustomCDN(url);
  }
}

// Register the custom provider
cdnService.registerProvider('custom', new MyCustomCDNProvider());
```

## Testing

The CDN plugin uses Vitest for testing. Run tests with:

```bash
bun test
```

## Package Structure

```
pkg/cdn/
├── index.ts              # Main exports and Zod schema
├── types.ts              # TypeScript type definitions
├── CDNService.ts         # Main CDN service implementation
├── CDNProvider.ts        # Abstract CDN provider base class
├── plugin.ts             # Token Ring plugin integration
├── test/                 # Test files
│   ├── CDNProvider.test.ts
│   ├── CDNService.test.ts
│   └── types.test.ts
└── vitest.config.ts      # Test configuration
```

## License

MIT