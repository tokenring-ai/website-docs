# @tokenring-ai/ghost-io

The `@tokenring-ai/ghost-io` package provides comprehensive integration with the Ghost.io blog platform for the Token Ring ecosystem. It implements both `BlogProvider` and `CDNProvider` interfaces for seamless blog management and content delivery through Ghost's v5.0 Admin API.

## User Guide

### Overview

The Ghost.io package integrates with the Token Ring framework, providing provider-based blog management and CDN services. It enables agents to create, update, and manage blog posts through the BlogService and CDNService infrastructure. The package wraps the official Ghost Admin SDK with secure authentication and provides automatic data structure conversion between Ghost's native format and Token Ring's provider model.

### Key Features

- **Full Ghost Admin API v5.0 Integration**: Complete wrapper around Ghost's official Admin SDK
- **CRUD Operations**: Create, read, update blog posts with full lifecycle management
- **Post Status Support**: Draft, published, and scheduled post statuses
- **Image Upload**: Upload images directly to Ghost CDN with metadata support
- **Post Filtering**: Search posts by keyword, status, and limit results
- **Data Structure Conversion**: Automatic conversion between Ghost and Token Ring formats
- **Plugin-Based Architecture**: Seamless integration with Token Ring applications
- **Multiple Provider Support**: Register multiple Ghost blog and CDN providers via account configuration
- **Environment Variable Configuration**: Load Ghost accounts from environment variables

### Chat Commands

This package does not define any chat commands. Blog operations are performed through the provider API or tools registered by other packages.

### Tools

This package does not provide any tools directly. It provides provider classes (`GhostBlogProvider`, `GhostCDNProvider`) that are registered with the Token Ring services (BlogService and CDNService) via the plugin system.

### Configuration

The plugin uses an account-based configuration pattern that combines blog and CDN settings. It automatically loads accounts from environment variables and registers providers for each configured account.

#### Configuration Schema

```yaml
# Example configuration in YAML format
ghost:
  accounts:
    my-blog:
      url: https://your-ghost-site.ghost.io
      apiKey: your-admin-api-key
      blog:
        description: My Ghost Blog
        cdn: ghost-cdn
      cdn: {}
```

The configuration schema structure:

```typescript
import { z } from "zod";

export const GhostAccountCDNSchema = z.object({}).prefault({});

export const GhostAccountBlogSchema = z
  .object({
    description: z.string().default("Ghost blog"),
    cdn: z.string().exactOptional(),
  })
  .prefault({});

export const GhostAccountSchema = z.object({
  url: z.string(),
  apiKey: z.string(),
  blog: GhostAccountBlogSchema,
  cdn: GhostAccountCDNSchema,
});

export const GhostConfigSchema = z.object({
  accounts: z.record(z.string(), GhostAccountSchema).default({}),
});
```

#### Configuration Options

**Required Properties:**

| Property | Type   | Description                                                    |
|----------|--------|----------------------------------------------------------------|
| `url`    | string | Your Ghost site URL (e.g., `https://demo.ghost.io`)            |
| `apiKey` | string | Admin API key for writes (create/update/publish, image upload) |

**Optional Properties:**

| Property           | Type   | Description                                                    |
|--------------------|--------|----------------------------------------------------------------|
| `blog`             | object | Blog configuration (optional, enables BlogProvider)            |
| `blog.description` | string | Human-readable description of the blog (default: "Ghost blog") |
| `blog.cdn`         | string | Name of the CDN provider to use                                |
| `cdn`              | object | Empty object to enable CDN provider registration               |

**Notes:**

- The `blog` property is optional. If provided, a `GhostBlogProvider` will be registered with the `BlogService`.
- The `cdn` property is optional. If provided (as an empty object `{}`), a `GhostCDNProvider` will be registered with the `CDNService`.
- An account can have only `blog`, only `cdn`, or both configurations.

#### Plugin Installation

```typescript
import { App } from "@tokenring-ai/app";
import ghostIoPlugin from "@tokenring-ai/ghost-io/plugin";

const app = new App();

// Install the plugin with configuration
app.installPlugin(ghostIoPlugin, {
  ghost: {
    accounts: {
      "my-blog": {
        url: "https://your-ghost-site.ghost.io",
        apiKey: "your-admin-api-key",
        blog: {
          description: "My Ghost Blog",
          cdn: "my-cdn"
        },
        cdn: {}
      }
    }
  }
});
```

#### Environment Variable Configuration

The plugin automatically loads Ghost accounts from environment variables using the following pattern:

```bash
# Required for each account
GHOST_URL=https://your-ghost-site.ghost.io
GHOST_API_KEY=your-admin-api-key

# Optional
GHOST_ACCOUNT_NAME=my-blog  # Defaults to hostname if not provided
GHOST_DESCRIPTION=My Ghost Blog  # Defaults to "Ghost.io (account-name)"
GHOST_BLOG_CDN=my-cdn  # Optional CDN name for the blog
```

For multiple accounts, append a number to the variable names:

```bash
# Account 1
GHOST_URL=https://blog1.example.com
GHOST_API_KEY=key1

# Account 2
GHOST_URL2=https://blog2.example.com
GHOST_API_KEY2=key2
GHOST_ACCOUNT_NAME2=production-blog
```

### Integration

This package integrates with the Token Ring framework through the plugin architecture and service registration patterns.

#### Plugin Registration

The `plugin.ts` automatically registers providers when the application starts based on configured accounts:

```typescript
install(app, config) {
  // First, load accounts from environment variables
  addAccountsFromEnv(config.ghost.accounts);

  // Then, register providers for each account
  for (const [name, account] of Object.entries(config.ghost.accounts)) {
    if (account.cdn) {
      app.services.waitForItemByType(CDNService, (cdnService) => {
        cdnService.registerProvider(name, new GhostCDNProvider({ url: account.url, apiKey: account.apiKey }));
      });
    }

    if (account.blog) {
      app.services.waitForItemByType(BlogService, (blogService) => {
        blogService.registerBlog(
          name,
          new GhostBlogProvider({
            url: account.url,
            apiKey: account.apiKey,
            description: account.blog.description,
            cdn: account.blog.cdn ?? name,
          }),
        );
      });
    }
  }
}
```

#### Service Access

Agents access the providers through the BlogService and CDNService via `requireServiceByType()`:

```typescript
const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");

const cdnService = agent.requireServiceByType(CDNService);
const cdnProvider = cdnService.getProvider("my-cdn");
```

#### Service Integration

The package integrates with the following Token Ring services:

| Service       | Integration           | Purpose                     |
|---------------|-----------------------|-----------------------------|
| `BlogService` | Provider registration | Blog post CRUD operations   |
| `CDNService`  | Provider registration | Image upload and management |

### Best Practices

#### Required Operations

1. **Access Provider by Name**

   Use the service's `getBlog()` or `getProvider()` method with the account name.

   ```typescript
   const provider = blogService.getBlog("my-blog");
   ```

2. **Select Post Before Update**

   Use `getPostById()` to retrieve the post, then `updatePost()` with the ID.

   ```typescript
   const post = await provider.getPostById(postId);
   await provider.updatePost(postId, data);
   ```

3. **Use Appropriate Status Values**

   - Use `'draft'` for work-in-progress
   - Use `'scheduled'` for future publishing (requires `published_at`)
   - Use `'published'` for live content
   - Avoid `'pending'` and `'private'` (not supported by Ghost API)

#### Configuration Tips

1. **Use Environment Variables**

   Store API keys securely.

   ```bash
   GHOST_URL=https://blog.example.com
   GHOST_API_KEY=your-api-key
   ```

2. **Choose Appropriate CDN**

   Ensure blog and CDN providers reference the same Ghost site.

   ```json
   {
     "ghost": {
       "accounts": {
         "production": {
           "url": "https://blog.example.com",
           "blog": { "cdn": "production" },
           "cdn": {}
         }
       }
     }
   }
   ```

3. **Descriptive Account Names**

   Use meaningful names for multiple providers.

   ```json
   {
     "ghost": {
       "accounts": {
         "production": { "url": "https://blog.example.com", ... },
         "staging": { "url": "https://staging.example.com", ... }
       }
     }
   }
   ```

#### API Usage Tips

1. **Content Handling**

   - Use `html` for formatted content
   - Provide proper HTML structure for best results

2. **Image Metadata**

   - Include relevant metadata when uploading
   - Use descriptive filenames

3. **Error Handling**

   Always wrap provider calls in try-catch blocks.

   ```typescript
   try {
     const post = await provider.createPost(data);
   } catch (error) {
     if (error.message.includes("not found")) {
       console.log("Post does not exist");
     } else {
       console.error("Unexpected error:", error.message);
     }
   }
   ```

## Developer Reference

### Core Components

#### GhostBlogProvider

The `GhostBlogProvider` class implements the `BlogProvider` interface for Ghost.io blog management.

```typescript
import { BlogService } from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");
```

##### GhostBlogProvider Constructor

```typescript
constructor(options: GhostBlogProviderOptions)
```

Parameters:

- `options.url`: Your Ghost site URL (e.g., `https://demo.ghost.io`)
- `options.apiKey`: Admin API key for writes (create/update/publish, image upload)
- `options.cdn`: Name of the CDN provider to use (must match CDN provider name)
- `options.description`: Human-readable description of the blog

##### GhostBlogProvider Properties

- `description`: Human-readable description of the blog
- `cdnName`: Name of the CDN provider to use
- `options`: Original configuration

##### GhostBlogProvider Key Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getAllPosts()` | - | `Promise<BlogPostListItem[]>` | Fetches all blog posts from Ghost Admin API |
| `getRecentPosts(filter)` | `filter: BlogPostFilterOptions` | `Promise<BlogPostListItem[]>` | Fetches recent posts with filtering |
| `createPost(data)` | `data: CreatePostData` | `Promise<BlogPost>` | Creates a new draft post |
| `updatePost(id, data)` | `id: string, data: UpdatePostData` | `Promise<BlogPost>` | Updates a post by ID |
| `getPostById(id)` | `id: string` | `Promise<BlogPost>` | Fetches a post by its ID with HTML content |

#### GhostCDNProvider

The `GhostCDNProvider` class extends `CDNProvider` for image uploads to Ghost's CDN.

```typescript
import { CDNService } from "@tokenring-ai/cdn";

const cdnService = agent.requireServiceByType(CDNService);
const provider = cdnService.getProvider("my-cdn");
```

##### GhostCDNProvider Constructor

```typescript
constructor(options: GhostCDNProviderOptions)
```

Parameters:

- `options.url`: Your Ghost site URL
- `options.apiKey`: Admin API key for image upload operations

##### GhostCDNProvider Key Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `upload(data, options)` | `data: Buffer, options?: UploadOptions` | `Promise<UploadResult>` | Uploads image buffer to Ghost CDN |

### Services

This package does not export service classes directly. Instead, it exports provider classes (`GhostBlogProvider`, `GhostCDNProvider`) that are registered with the BlogService and CDNService at runtime via the plugin system.

#### Service Registration Pattern

The plugin uses the `waitForItemByType` pattern to ensure services are available before registering providers:

```typescript
// BlogService registration
app.services.waitForItemByType(BlogService, (blogService) => {
  blogService.registerBlog(name, new GhostBlogProvider(options));
});

// CDNService registration
app.services.waitForItemByType(CDNService, (cdnService) => {
  cdnService.registerProvider(name, new GhostCDNProvider(options));
});
```

This pattern ensures that:

- Providers are only registered after the target service is initialized
- Multiple accounts can be registered without race conditions
- The service's KeyedRegistry manages multiple provider instances

### RPC Endpoints

This package does not define any RPC endpoints. It operates through the BlogService and CDNService provider interfaces.

### Usage Examples

#### Full Blog Workflow

```typescript
import { BlogService } from "@tokenring-ai/blog";

// Access blog service
const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");

// List all posts
const allPosts = await provider.getAllPosts();
console.log(`Total posts: ${allPosts.length}`);
console.log(`Published: ${allPosts.filter(p => p.status === "published").length}`);

// Create new post
const post = await provider.createPost({
  title: "Getting Started with Ghost",
  html: "<h1>Welcome</h1><p>This is a sample blog post.</p>",
  tags: ["ghost", "tutorial"]
});

console.log(`Created post: ${post.id}`);

// Update post
const updated = await provider.updatePost(post.id, {
  status: "published",
  html: "<h1>Welcome</h1><p>This article explains how to get started.</p>"
});

console.log(`Published post: ${updated.title}`);

// Filter posts
const drafts = await provider.getRecentPosts({
  status: "draft",
  limit: 10
});

console.log(`Draft posts: ${drafts.length}`);
```

#### Image Upload Workflow

```typescript
import { CDNService } from "@tokenring-ai/cdn";
import fs from "fs";

// Access CDN service
const cdnService = agent.requireServiceByType(CDNService);
const provider = cdnService.getProvider("my-cdn");

// Upload image
const imageBuffer = fs.readFileSync("featured.jpg");
const result = await provider.upload(imageBuffer, {
  filename: "featured-image.jpg",
  metadata: {
    alt: "Featured image description"
  }
});

console.log(`Image URL: ${result.url}`);
console.log(`Image ID: ${result.id}`);

// Use uploaded image in blog post
const newPost = await provider.createPost({
  title: "Post with Image",
  html: `<p>Check out this image:</p><img src="${result.url}" />`,
  feature_image: {
    url: result.url
  }
});
```

#### Filtering Posts

```typescript
import { BlogService } from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");

// Search by keyword
const keywordResults = await provider.getRecentPosts({
  keyword: "tutorial",
  limit: 10
});

console.log(`Found ${keywordResults.length} posts with "tutorial"`);

// Filter by status
const published = await provider.getRecentPosts({
  status: "published",
  limit: 5
});

console.log(`Latest 5 published posts`);

// Combined filter
const filtered = await provider.getRecentPosts({
  keyword: "ghost",
  status: "draft",
  limit: 10
});

console.log(`Draft posts about ghost: ${filtered.length}`);
```

### Testing and Development

#### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run integration tests
bun run test:integration

# Run e2e tests
bun run test:e2e

# Run all tests including external integration tests
bun run test:all
```

#### Build Instructions

```bash
bun run build
```

#### Package Structure

```text
pkg/ghost-io/
├── index.ts                         # Package entry point and exports
├── plugin.ts                        # TokenRing plugin integration
├── GhostBlogProvider.ts             # Blog provider implementation
├── GhostCDNProvider.ts              # CDN provider implementation
├── schema.ts                        # Configuration schemas
├── package.json                     # Package metadata and dependencies
├── vitest.config.ts                 # Test configuration
└── docs/                            # Additional documentation
    ├── admin-api.md
    ├── content-api.md
    ├── design.md
    ├── javascript-admin-sdk.md
    └── javascript-content-sdk.md
```

### Dependencies

#### Production Dependencies

| Package                 | Version | Purpose                                      |
|-------------------------|---------|----------------------------------------------|
| `@tokenring-ai/app`     | 0.2.0   | Core application framework and plugin registration |
| `@tokenring-ai/utility` | 0.2.0   | Utility functions including object utilities |
| `@tokenring-ai/blog`    | 0.2.0   | Blog service interface and provider system   |
| `@tokenring-ai/cdn`     | 0.2.0   | CDN service interface and provider system    |
| `zod`                   | ^4.3.6  | Schema validation                            |
| `@tryghost/admin-api`   | ^1.14.7 | Official Ghost Admin SDK (v5.0)              |
| `form-data`             | ^4.0.5  | Multipart form data for image uploads        |
| `uuid`                  | 14.0.0  | Unique identifier generation                 |

#### Development Dependencies

| Package          | Version | Purpose                          |
|------------------|---------|----------------------------------|
| `vitest`         | ^4.1.1  | Unit testing framework           |
| `typescript`     | ^6.0.2  | Type definitions                 |

### Related Components

- `@tokenring-ai/blog`: Blog service interface and provider system
- `@tokenring-ai/cdn`: CDN service interface and provider system
- `@tokenring-ai/app`: Plugin registration framework
- `@tryghost/admin-api`: Official Ghost Admin SDK

## License

MIT License - see the LICENSE file for details.
