# @tokenring-ai/ghost-io

The `@tokenring-ai/ghost-io` package provides comprehensive integration with the Ghost.io blog platform for the Token Ring ecosystem. It implements both `BlogProvider` and `CDNProvider` interfaces for seamless blog management and content delivery through Ghost's v5.0 Admin API.

## Overview

The Ghost.io package integrates with the Token Ring framework, providing provider-based blog management and CDN services. It enables agents to create, update, and manage blog posts through the BlogService and CDNService infrastructure. The package wraps the official Ghost Admin SDK with secure authentication and provides automatic data structure conversion between Ghost's native format and Token Ring's provider model.

### Core Capabilities

- **Blog Management**: Full CRUD operations for blog posts with draft, published, and scheduled statuses
- **CDN Integration**: Image upload to Ghost's content delivery network
- **API Wrapping**: Secure access to Ghost v5.0 Admin API with proper authentication
- **Post Conversion**: Automatic conversion between Ghost's data structures and Token Ring's blog provider model
- **Provider Architecture**: Supports multiple Ghost blog and CDN provider registration via account-based configuration

### Integration Points

- **BlogService**: Registers `GhostBlogProvider` for blog post management
- **CDNService**: Registers `GhostCDNProvider` for media content delivery
- **Plugin System**: Automatic provider registration via TokenRing plugin architecture with account-based configuration

## Key Features

- **Full Ghost Admin API v5.0 Integration**: Complete wrapper around Ghost's official Admin SDK
- **CRUD Operations**: Create, read, update blog posts with full lifecycle management
- **Post Status Support**: Draft, published, and scheduled post statuses
- **Image Upload**: Upload images directly to Ghost CDN with metadata support
- **Post Filtering**: Search posts by keyword, status, and limit results
- **Data Structure Conversion**: Automatic conversion between Ghost and Token Ring formats
- **Plugin-Based Architecture**: Seamless integration with Token Ring applications
- **Multiple Provider Support**: Register multiple Ghost blog and CDN providers via account configuration
- **Environment Variable Configuration**: Load Ghost accounts from environment variables

## Core Components

### GhostBlogProvider

The `GhostBlogProvider` class implements the `BlogProvider` interface for Ghost.io blog management.

```typescript
import {BlogService} from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");
```

#### Constructor

```typescript
constructor(options: GhostBlogProviderOptions)
```

Parameters:
- `options.url`: Your Ghost site URL (e.g., `https://demo.ghost.io`)
- `options.apiKey`: Admin API key for writes (create/update/publish, image upload)
- `options.cdn`: Name of the CDN provider to use (must match CDN provider name)
- `options.description`: Human-readable description of the blog

#### Properties

- `description`: Human-readable description of the blog
- `cdnName`: Name of the CDN provider to use
- `options`: Original configuration

#### Key Methods

**`getAllPosts(): Promise<BlogPostListItem[]>`**

Fetches all blog posts from Ghost Admin API.

Returns: Array of `BlogPostListItem` objects converted from Ghost's native format.

```typescript
const allPosts = await provider.getAllPosts();
console.log(`Found ${allPosts.length} posts`);
allPosts.forEach(post => {
  console.log(`- ${post.title} (${post.status})`);
});
```

**`getRecentPosts(filter: BlogPostFilterOptions): Promise<BlogPostListItem[]>`**

Fetches recent posts from Ghost Admin API with optional filtering.

Parameters:
- `filter.keyword`: Keyword to search across title and html content
- `filter.status`: Filter by post status (`draft`, `published`, `scheduled`)
- `filter.limit`: Limit number of posts returned (default: "all")

Returns: Array of `BlogPostListItem` objects.

```typescript
const recentPosts = await provider.getRecentPosts({
  keyword: "tokenring",
  status: "published",
  limit: 10
});

console.log(`Found ${recentPosts.length} posts matching "tokenring"`);
```

**`createPost(data: CreatePostData): Promise<BlogPost>`**

Creates a new draft post on Ghost.io.

Creates the post with `status: "draft"` by default.

```typescript
const newPost = await provider.createPost({
  title: "My New Blog Post",
  html: "<p>Welcome to my blog!</p>",
  tags: ["tutorial", "guides"],
  feature_image: {
    url: "https://example.com/image.jpg"
  }
});

console.log(`Created post: ${newPost.title} (ID: ${newPost.id})`);
```

**`updatePost(id: string, data: UpdatePostData): Promise<BlogPost>`**

Updates a post by ID.

**LIMITATION**: Cannot use status 'pending' or 'private' (Ghost API limitation)

```typescript
const updatedPost = await provider.updatePost("post-id-here", {
  title: "Updated Title",
  html: "<p>Updated content...</p>",
  status: "published",
  tags: ["updated", "published"]
});

console.log(`Updated post: ${updatedPost.title}`);
```

**`getPostById(id: string): Promise<BlogPost>`**

Fetches a post by its ID with HTML content.

Raises error if post not found.

```typescript
const post = await provider.getPostById("1e0b8941-1234-5678-90ab-cdef12345678");
console.log(`Retrieved post: ${post.title} (Status: ${post.status})`);
```

### GhostCDNProvider

The `GhostCDNProvider` class extends `CDNProvider` for image uploads to Ghost's CDN.

```typescript
import {CDNService} from "@tokenring-ai/cdn";

const cdnService = agent.requireServiceByType(CDNService);
const provider = cdnService.getProvider("my-cdn");
```

#### Constructor

```typescript
constructor(options: GhostCDNProviderOptions)
```

Parameters:
- `options.url`: Your Ghost site URL
- `options.apiKey`: Admin API key for image upload operations

#### Key Methods

**`upload(data: Buffer, options?: UploadOptions): Promise<UploadResult>`**

Uploads image buffer to Ghost CDN.

Parameters:
- `data`: Buffer containing the image data
- `options.filename`: Optional filename (generates unique UUID-based filename if not provided)
- `options.metadata`: Optional metadata object

Returns: `UploadResult` with `url`, `id`, and optional `metadata`

```typescript
import fs from "fs";

const imageBuffer = fs.readFileSync("path/to/image.jpg");
const uploadResult = await provider.upload(imageBuffer, {
  filename: "featured-image.jpg",
  metadata: {
    width: 1200,
    height: 800
  }
});

console.log(`Image uploaded to: ${uploadResult.url}`);
console.log(`Image ID: ${uploadResult.id}`);
```

### Data Structures

**GhostPostListItem**

```typescript
interface GhostPostListItem {
  id: string;
  title: string;
  status: "draft" | "published" | "scheduled";
  tags?: string[];
  created_at: string;
  updated_at: string;
  feature_image?: string;
  published_at?: string;
  excerpt?: string;
  url?: string;
  slug?: string;
}
```

**GhostPost**

```typescript
interface GhostPost extends GhostPostListItem {
  html?: string;
}
```

## Services

This package does not export service classes directly. Instead, it exports provider classes (`GhostBlogProvider`, `GhostCDNProvider`) that are registered with the BlogService and CDNService at runtime via the plugin system.

### Service Registration Pattern

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

### GhostBlogProvider

The `GhostBlogProvider` class implements the `BlogProvider` interface for Ghost.io blog management.

**Internal Ghost API Interface**

The provider wraps the Ghost Admin API with the following interface:

```typescript
interface GhostAPI {
  posts: {
    browse: (params: { limit: string | number, filter?: string }) => Promise<GhostPost[]>;
    add: (data: Omit<GhostPost, "id" | "created_at" | "updated_at">, options?: { source: string }) => Promise<GhostPost>;
    edit: (data: GhostPost) => Promise<GhostPost>;
    read: (params: { id: string, formats?: "html" }) => Promise<GhostPost | null>;
  };
  tags: {
    browse: () => Promise<string[]>;
  };
  images: {
    upload: (data: FormData, options?: { filename: string; purpose: string }) => Promise<{ url: string; id: string; metadata: any }>;
  };
}
```

**Error Handling**

- Throws error if `id`, `title`, or `status` is missing during conversion to `BlogPostListItem`
- Throws error when post not found during `getPostById` or `updatePost`
- Throws error when attempting to use unsupported status values ('pending', 'private')
- Wraps Ghost Admin API errors with descriptive messages

### GhostCDNProvider

The `GhostCDNProvider` class extends `CDNProvider` for image uploads to Ghost's CDN.

**Configuration Interface**

```typescript
interface GhostCDNProviderOptions {
  url: string;
  apiKey: string;
}
```

**Error Handling**

- Throws error if image upload fails with the underlying error message
- Uses FormData for multipart upload to Ghost's image endpoint

## RPC Endpoints

This package does not define any RPC endpoints. It operates through the BlogService and CDNService provider interfaces.

## Chat Commands

This package does not define any chat commands. Blog operations are performed through the provider API or tools registered by other packages.

## Configuration

The plugin uses an account-based configuration pattern that combines blog and CDN settings.

### Plugin Configuration

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import {GhostConfigSchema} from "./schema.ts";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({
  ghost: GhostConfigSchema.prefault({accounts: {}}),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    for (const [name, account] of Object.entries(config.ghost.accounts)) {
      if (account.cdn) {
        app.services.waitForItemByType(CDNService, (cdnService) => {
          cdnService.registerProvider(
            name,
            new GhostCDNProvider({url: account.url, apiKey: account.apiKey}),
          );
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
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Account Configuration

```json
{
  "ghost": {
    "accounts": {
      "my-blog": {
        "url": "https://my-ghost-blog.com",
        "apiKey": "your-api-key",
        "blog": {
          "description": "Ghost blog at my-ghost-blog.com",
          "cdn": "my-cdn"
        },
        "cdn": {}
      }
    }
  }
}
```

**Required Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Your Ghost site URL (e.g., `https://demo.ghost.io`) |
| `apiKey` | string | Admin API key for writes (create/update/publish, image upload) |

**Optional Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `blog.description` | string | Human-readable description of the blog (default: "Ghost blog") |
| `blog.cdn` | string | Name of the CDN provider to use |
| `cdn` | object | Empty object to enable CDN provider registration |

### Environment Variable Configuration

The plugin automatically loads Ghost accounts from environment variables:

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

## Integration

This package integrates with the Token Ring framework through the plugin architecture and service registration patterns.

### Plugin Registration

The `plugin.ts` automatically registers providers when the application starts based on configured accounts:

```typescript
install(app, config) {
  for (const [name, account] of Object.entries(config.ghost.accounts)) {
    if (account.cdn) {
      app.services.waitForItemByType(CDNService, (cdnService) => {
        cdnService.registerProvider(
          name,
          new GhostCDNProvider({url: account.url, apiKey: account.apiKey}),
        );
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

### Service Access

Agents access the providers through the BlogService and CDNService via `requireServiceByType()`:

```typescript
const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");

const cdnService = agent.requireServiceByType(CDNService);
const cdnProvider = cdnService.getProvider("my-cdn");
```

### Provider Registration

Multiple providers can be registered, and the service manages them via the KeyedRegistry pattern. Provider selection is handled by the service based on configuration or explicit selection by name.

## Usage Examples

### Full Blog Workflow

```typescript
import {BlogService} from "@tokenring-ai/blog";

// Access blog service
const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getBlog("my-blog");

// List all posts
const allPosts = await provider.getAllPosts();
console.log(`Total posts: ${allPosts.length}`);
console.log(`Published: ${allPosts.filter(p => p.status === 'published').length}`);

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

### Image Upload Workflow

```typescript
import {CDNService} from "@tokenring-ai/cdn";
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

### Agent Integration Pattern

```typescript
import {Agent} from "@tokenring-ai/agent";
import {BlogService} from "@tokenring-ai/blog";

async function agentWorkflow(agent: Agent) {
  const blogService = agent.requireServiceByType(BlogService);
  const provider = blogService.getBlog("my-blog");

  try {
    // List available posts
    const allPosts = await provider.getAllPosts();
    console.log(`Found ${allPosts.length} posts`);

    // Filter for drafts
    const drafts = allPosts.filter(p => p.status === 'draft');
    console.log(`Draft posts: ${drafts.length}`);

    // Create new content
    const post = await provider.createPost({
      title: "My Article",
      html: "<p>Content here</p>",
      tags: ["article"]
    });

    // Update post
    await provider.updatePost(post.id, {
      status: "published"
    });

  } catch (error) {
    console.error("Error in blog workflow:", error);
  }
}
```

### Filtering Posts

```typescript
import {BlogService} from "@tokenring-ai/blog";

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

## Best Practices

### Required Operations

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

### Configuration Tips

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

### API Usage Tips

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

## Testing and Development

### Running Tests

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

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Example Test Setup

```typescript
import {describe, expect, it} from 'vitest';
import GhostBlogProvider from "../src/GhostBlogProvider.ts";
import GhostCDNProvider from "../src/GhostCDNProvider.ts";

describe("GhostBlogProvider", () => {
  it("should initialize with valid configuration", () => {
    const provider = new GhostBlogProvider({
      url: "https://test.ghost.io",
      apiKey: "test-key",
      cdn: "test-cdn",
      description: "Test blog"
    });

    expect(provider).toBeDefined();
    expect(provider.description).toBe("Test blog");
  });

  it("should throw error when missing required config", () => {
    expect(() => {
      new GhostBlogProvider({
        url: "https://test.ghost.io",
        apiKey: "test-key"
        // Missing cdn, description
      });
    }).toThrow();
  });
});

describe("GhostCDNProvider", () => {
  it("should initialize with valid configuration", () => {
    const provider = new GhostCDNProvider({
      url: "https://test.ghost.io",
      apiKey: "test-key"
    });

    expect(provider).toBeDefined();
  });
});
```

### Package Structure

```
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

### Build Instructions

```bash
bun run build
```

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Core application framework and plugin registration |
| `@tokenring-ai/blog` | 0.2.0 | Blog service interface and provider system |
| `@tokenring-ai/cdn` | 0.2.0 | CDN service interface and provider system |
| `@tokenring-ai/agent` | 0.2.0 | Agent system and state management |
| `@tokenring-ai/chat` | 0.2.0 | Chat interface integration |
| `@tokenring-ai/filesystem` | 0.2.0 | Filesystem operations |
| `@tokenring-ai/ai-client` | 0.2.0 | AI client integration |
| `@tryghost/admin-api` | ^1.14.7 | Official Ghost Admin SDK (v5.0) |
| `@lexical/headless` | ^0.42.0 | Lexical editor headless mode for content processing |
| `@lexical/markdown` | ^0.42.0 | Markdown content format conversion |
| `form-data` | ^4.0.5 | Multipart form data for image uploads |
| `uuid` | ^13.0.0 | Unique identifier generation |
| `zod` | ^4.3.6 | Schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Unit testing framework |
| `@vitest/coverage-v8` | ^4.1.1 | Code coverage reporting |
| `typescript` | ^6.0.2 | Type definitions |

## Related Components

- `@tokenring-ai/blog`: Blog service interface and provider system
- `@tokenring-ai/cdn`: CDN service interface and provider system
- `@tokenring-ai/agent`: Agent system and state management
- `@tokenring-ai/app`: Plugin registration framework
- `@tokenring-ai/chat`: Chat interface integration
- `@tryghost/admin-api`: Official Ghost Admin SDK

## License

MIT License - see the LICENSE file for details.
