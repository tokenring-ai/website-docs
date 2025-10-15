---
slug: cloud-storage-plugins
title: Cloud Storage Plugins - S3 and CDN Support
authors: [mdierolf]
tags: [tokenring, plugins, cloud, storage, announcement]
---

# Cloud Storage Plugins - S3 and CDN Support

TokenRing Coder now supports cloud storage with S3 filesystem and CDN integrations.

<!-- truncate -->

## S3 Plugin

AWS S3 integration for filesystem operations and CDN functionality:

### S3 Filesystem Provider
Treat S3 buckets as a filesystem:
- **File Operations**: Read, write, delete, rename, copy
- **Directory Simulation**: Uses S3 prefixes for directory structures
- **Path Normalization**: Handles relative and absolute paths
- **Error Handling**: Graceful handling of non-existent objects

### S3 CDN Resource
Content delivery using S3:
- **Upload**: Store files with metadata
- **Delete**: Remove objects by URL
- **Existence Checks**: Verify file presence
- **Public URLs**: Generate accessible URLs for content

### Usage
```typescript
const fsProvider = new S3FileSystemProvider({
  bucketName: 'my-bucket',
  clientConfig: { region: 'us-east-1' }
});

await fsProvider.writeFile('hello.txt', 'Hello, S3!');
const content = await fsProvider.readFile('hello.txt', 'utf8');
```

## CDN Plugin

Abstract CDN service interface for content delivery:

### Features
- **Upload Operations**: Upload data and return public URLs
- **File Management**: Delete files, check existence, retrieve metadata
- **Agent Tools**: Upload and delete tools for AI agents
- **Extensible**: Concrete implementations extend the base class

Provides the foundation for S3 and other CDN implementations.

## Use Cases

- Store agent-generated content in the cloud
- Serve static assets via CDN
- Backup and sync files across environments
- Share files with public URLs

---

*Mark Dierolf*  
*Creator of TokenRing AI*
