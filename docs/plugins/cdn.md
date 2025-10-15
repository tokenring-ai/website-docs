# CDN Plugin

Abstract CDN service interface for uploading and managing files in content delivery networks.

## Overview

The `@tokenring-ai/cdn` package provides an abstract CDN service interface for uploading and managing files in content delivery networks. It defines a standardized interface for CDN operations that concrete implementations (e.g., AWS S3, Cloudflare) can extend.

## Key Features

- **Abstract Interface**: Standardized CDN operations for multiple providers
- **Upload Operations**: Upload data to CDN and return public URLs
- **File Management**: Delete files, check existence, and retrieve metadata
- **Agent Tools**: Upload and delete tools for AI agents
- **Extensible**: Concrete implementations extend the base class

## Core Components

### CDNService (Abstract Base Class)

The abstract `CDNService` class defines a standardized interface for CDN operations.

**Key Methods:**
- `upload(data: Buffer, options?: UploadOptions): Promise<UploadResult>`: Upload data to CDN
  - Options: `filename`, `contentType`, `metadata`
  - Returns: `{ url, id, metadata }`
- `delete(url: string): Promise<DeleteResult>`: Delete file from CDN by URL
  - Returns: `{ success, message }`
- `exists(url: string): Promise<boolean>`: Check if file exists in CDN
- `getMetadata(url: string): Promise<Record<string, any> | null>`: Get file metadata

### Tools

**upload**: Upload base64 encoded data to CDN
- Input: `{ data: string, filename?: string, contentType?: string }`
- Decodes base64 data and uploads to active CDN provider
- Returns public URL

**delete**: Delete a file from CDN by URL
- Input: `{ url: string }`
- Removes file from CDN
- Returns success status

## Usage Example

```typescript
import { CDNService } from '@tokenring-ai/cdn';

// Concrete implementation extends CDNService
class MyCDNProvider extends CDNService {
  async upload(data: Buffer, options?: UploadOptions): Promise<UploadResult> {
    // Implementation specific logic
    return { url: 'https://cdn.example.com/file.jpg', id: 'file-id' };
  }
  
  async delete(url: string): Promise<DeleteResult> {
    // Implementation specific logic
    return { success: true, message: 'Deleted' };
  }
  
  async exists(url: string): Promise<boolean> {
    // Implementation specific logic
    return true;
  }
  
  async getMetadata(url: string): Promise<Record<string, any> | null> {
    // Implementation specific logic
    return { size: 1024, contentType: 'image/jpeg' };
  }
}

// Use with agent
const cdnProvider = new MyCDNProvider();
agent.addService(cdnProvider);
```

## Configuration Options

- **UploadOptions**: `{ filename?: string, contentType?: string, metadata?: Record<string, any> }`
- **UploadResult**: `{ url: string, id: string, metadata?: Record<string, any> }`
- **DeleteResult**: `{ success: boolean, message: string }`

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `zod@^4.0.17`: Schema validation for tools

## Implementations

See `@tokenring-ai/s3` for a concrete S3-based CDN implementation.
