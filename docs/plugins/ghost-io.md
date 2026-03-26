# @tokenring-ai/ghost-io

The `@tokenring-ai/ghost-io` package provides comprehensive integration with the Ghost.io blog platform for the Token Ring ecosystem. It implements both `BlogProvider` and `CDNProvider` interfaces for seamless blog management and content delivery through Ghost's v5.0 Admin API.

## Overview

The Ghost.io package integrates with the Token Ring agent framework, providing provider-based blog management and CDN services. It enables agents to create, update, and manage blog posts while maintaining agent-specific state for the currently selected post. The package wraps the official Ghost Admin SDK with secure authentication and provides automatic data structure conversion between Ghost's native format and Token Ring's provider model.

### Core Capabilities

- **Blog Management**: Full CRUD operations for blog posts with draft, published, and scheduled statuses
- **CDN Integration**: Image upload to Ghost's content delivery network
- **Agent State Management**: Per-agent tracking of currently selected post
- **API Wrapping**: Secure access to Ghost v5.0 Admin API with proper authentication
- **Post Conversion**: Automatic conversion between Ghost's data structures and Token Ring's blog provider model
- **Provider Architecture**: Supports multiple Ghost blog and CDN provider registration

### Integration Points

- **BlogService**: Registers `GhostBlogProvider` for blog post management
- **CDNService**: Registers `GhostCDNProvider` for media content delivery
- **Agent State**: Uses `GhostBlogState` to track active post per agent session
- **Plugin System**: Automatic provider registration via TokenRing plugin architecture
## Key Features

- **Full Ghost Admin API v5.0 Integration**: Complete wrapper around Ghost's official Admin SDK
- **CRUD Operations**: Create, read, update, and delete blog posts with full lifecycle management
- **Post Status Support**: Draft, published, and scheduled post statuses
- **Image Upload**: Upload images directly to Ghost CDN with metadata support
- **Post Filtering**: Search posts by keyword, status, and limit results
- **Agent State Management**: Per-agent `GhostBlogState` for tracking current post selection
- **Data Structure Conversion**: Automatic conversion between Ghost and Token Ring formats
- **Plugin-Based Architecture**: Seamless integration with Token Ring applications
- **Multiple Provider Support**: Register multiple Ghost blog and CDN providers via KeyedRegistry pattern
- **Lexical Editor Integration**: Content processing with Lexical headless mode
- **Markdown Support**: Content format conversion with @lexical/markdown
## Core Components

### GhostBlogProvider

The `GhostBlogProvider` class implements the `BlogProvider` interface for Ghost.io blog management. All methods that interact with agent state require the provider's `attach(agent)` method to be called first.

```typescript
import {BlogService} from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getCurrentProvider();

await provider.attach(agent);
```

#### Constructor

```typescript
constructor(options: GhostBlogProviderOptions)
```

Parameters:
- `options.url`: Your Ghost site URL (e.g., `https://demo.ghost.io`)
- `options.apiKey`: Admin API key for writes (create/update/publish, image upload)
- `options.imageGenerationModel`: AI image generation model to use (e.g., `gpt-image-1`)
- `options.cdn`: Name of the CDN provider to use (must match CDN provider name)
- `options.description`: Human-readable description of the blog

#### Properties

- `description`: Human-readable description of the blog
- `cdnName`: Name of the CDN provider to use
- `imageGenerationModel`: AI image generation model to use

#### Key Methods

**`attach(agent: Agent): void`**

Initializes `GhostBlogState` for the agent. REQUIRED before using any provider methods that interact with agent state.

```typescript
provider.attach(agent);
```

**`getCurrentPost(agent: Agent): BlogPost | null`**

Retrieves the currently selected post from agent state.

Returns: `BlogPost` object if a post is selected, `null` if no post is selected.

```typescript
const post = provider.getCurrentPost(agent);
if (post) {
  console.log(post.title, post.status);
} else {
  console.log("No post selected");
}
```

**`getAllPosts(): Promise<BlogPost[]>`**

Fetches all blog posts from Ghost Admin API. Does not require an active post selection.

Returns: Array of `BlogPost` objects converted from Ghost's native format.

```typescript
const allPosts = await provider.getAllPosts();
console.log(`Found ${allPosts.length} posts`);
allPosts.forEach(post => {
  console.log(`- ${post.title} (${post.status})`);
});
```

**`getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>`**

Fetches recent posts from Ghost Admin API with optional filtering.

Parameters:
- `filter.keyword`: Keyword to search across title and html content
- `filter.status`: Filter by post status (`draft`, `published`, `scheduled`)
- `filter.limit`: Limit number of posts returned (default: "all")

Returns: Array of `BlogPost` objects.

```typescript
const recentPosts = await provider.getRecentPosts({
  keyword: "tokenring",
  status: "published",
  limit: 10
}, agent);

console.log(`Found ${recentPosts.length} posts matching "tokenring"`);
```

**`createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>`**

Creates a new draft post on Ghost.io.

**REQUIRES**: `attach(agent)` called first  
**REQUIRES**: No post currently selected (call `clearCurrentPost` first)  
**LIMITATION**: Throws error if a post is already selected

Creates the post with `status: "draft"` by default.

```typescript
const newPost = await provider.createPost({
  title: "My New Blog Post",
  content: "<p>Welcome to my blog!</p>",
  tags: ["tutorial", "guides"],
  feature_image: {
    url: "https://example.com/image.jpg"
  }
}, agent);

console.log(`Created post: ${newPost.title} (ID: ${newPost.id})`);
```

**`updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>`**

Updates the currently selected post.

**REQUIRES**: `attach(agent)` called first  
**REQUIRES**: A post must be selected (via `selectPostById`)  
**LIMITATION**: Cannot use status 'pending' or 'private' (Ghost API limitation)

```typescript
const currentPost = provider.getCurrentPost(agent);
if (!currentPost) {
  throw new Error("No post selected. Call selectPostById() first.");
}

const updatedPost = await provider.updatePost({
  title: "Updated Title",
  content: "<p>Updated content...</p>",
  status: "published",
  tags: ["updated", "published"]
}, agent);

console.log(`Updated post: ${updatedPost.title}`);
```

**`selectPostById(id: string, agent: Agent): Promise<BlogPost>`**

Fetches and selects a post by ID as the current post.

**REQUIRES**: `attach(agent)` called first  
Raises error if post not found

```typescript
const post = await provider.selectPostById("1e0b8941-1234-5678-90ab-cdef12345678", agent);
console.log(`Selected post: ${post.title} (Status: ${post.status})`);
```

**`clearCurrentPost(agent: Agent): Promise<void>`**

Clears the current post selection from state. Does not delete the post from Ghost.

```typescript
await provider.clearCurrentPost(agent);
console.log("Post selection cleared");
```

### GhostCDNProvider

The `GhostCDNProvider` class extends `CDNProvider` for image uploads to Ghost's CDN.

```typescript
import {CDNService} from "@tokenring-ai/cdn";

const cdnService = agent.requireServiceByType(CDNService);
const provider = cdnService.getCurrentProvider();
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

### GhostBlogState

Each agent maintains its own `GhostBlogState` instance for tracking the currently selected post. The state is initialized automatically when `provider.attach(agent)` is called.

#### State Properties

```typescript
{
  currentPost: GhostPost | null
}
```

Where `GhostPost` has the following structure:

```typescript
interface GhostPost {
  id: string;
  title: string;
  html?: string;
  content?: string;
  status: 'draft' | 'published' | 'scheduled';
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

#### State Schema

```typescript
const serializationSchema = z.object({
  currentPost: z.any().nullable()
});
```

#### State Methods

- `serialize()`: Serializes state for persistence
- `deserialize(data)`: Deserializes state from persisted data
- `show()`: Returns a string representation of the current state
- `reset()`: Resets state by clearing the current post selection

#### State Lifecycle

- **Initialization**: Created when `attach(agent)` is called
- **Persistence**: Serialized/deserialized across agent sessions
- **Reset**: Cleared when calling `reset()` or `clearCurrentPost(agent)`
- **Inheritance**: Child agents inherit parent's `currentPost` selection

#### State Access

```typescript
// Initialize state (done automatically by attach)
agent.initializeState(GhostBlogState, {});

// Access state
const state = agent.getState(GhostBlogState);
console.log(state.currentPost?.title);

// Modify state
agent.mutateState(GhostBlogState, (state) => {
  state.currentPost = selectedPost;
});

// Serialize/deserialize
const data = state.serialize();
const newState = new GhostBlogState(data);

// Reset state
state.reset();
```

## Services

This package does not export service classes directly. Instead, it exports provider classes (`GhostBlogProvider`, `GhostCDNProvider`) that are registered with the BlogService and CDNService at runtime via the plugin system.

### GhostBlogProvider

The `GhostBlogProvider` class implements the `BlogProvider` interface for Ghost.io blog management. All methods that interact with agent state require the provider's `attach(agent)` method to be called first.

**Interface Implementation**

```typescript
interface GhostAdminAPI {
  posts: {
    browse: (params: { limit: string; filter?: string }) => Promise<GhostPost[]>;
    add: (data: GhostPost, options?: { source: string }) => Promise<GhostPost>;
    edit: (data: GhostPost) => Promise<GhostPost>;
    read: (params: { id: string; formats?: string }) => Promise<GhostPost | null>;
  };
  tags: {
    browse: () => Promise<string[]>;
  };
  images: {
    upload: (data: FormData, options?: { filename: string; purpose: string }) => Promise< {
      url: string;
      id: string;
      metadata: any;
    }>;
  }
}
```

**Data Conversion**

The `GhostPostToBlogPost` function converts Ghost posts to Token Ring's `BlogPost` format:

- Uses `content` field if available, otherwise falls back to `html`
- Converts date strings to Date objects
- Requires `id`, `title`, and `status` fields (throws error if missing)
- Sets default dates to current time if not provided

**Error Handling**

- Throws error if `id`, `title`, or `status` is missing during conversion
- Throws error when creating post if a post is already selected
- Throws error when updating if no post is selected
- Throws error when post not found during `selectPostById`
- Throws error when attempting to use unsupported status values ('pending', 'private')

### GhostCDNProvider

The `GhostCDNProvider` class extends `CDNProvider` for image uploads to Ghost's CDN.

**Interface**

```typescript
interface GhostCDNProviderOptions {
  url: string;
  apiKey: string;
}
```

**Error Handling**

- Throws error if image upload fails with the underlying error message

## RPC Endpoints

This package does not define any RPC endpoints. It operates through the BlogService and CDNService provider interfaces.

## Chat Commands

This package does not define any chat commands. Blog operations are performed through the provider API or tools registered by other packages.

## Configuration

The plugin uses separate configuration schemas for blog and CDN providers.

### Plugin Configuration

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {BlogConfigSchema, BlogService} from "@tokenring-ai/blog";
import {CDNConfigSchema, CDNService} from "@tokenring-ai/cdn";
import {z} from "zod";
import GhostBlogProvider, {GhostBlogProviderOptionsSchema} from "./GhostBlogProvider.ts";
import GhostCDNProvider, {GhostCDNProviderOptionsSchema} from "./GhostCDNProvider.ts";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({
  cdn: CDNConfigSchema.optional(),
  blog: BlogConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.cdn) {
      app.services.waitForItemByType(CDNService, cdnService => {
        for (const name in config.cdn!.providers) {
          const provider = config.cdn!.providers[name];
          if (provider.type === "ghost") {
            cdnService.registerProvider(name, new GhostCDNProvider(GhostCDNProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }

    if (config.blog) {
      app.services.waitForItemByType(BlogService, blogService => {
        for (const name in config.blog!.providers) {
          const provider = config.blog!.providers[name];
          if (provider.type === "ghost") {
            blogService.registerBlog(name, new GhostBlogProvider(GhostBlogProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Blog Provider Configuration

```json
{
  "blog": {
    "providers": {
      "my-blog": {
        "type": "ghost",
        "url": "https://my-ghost-blog.com",
        "apiKey": "your-api-key",
        "imageGenerationModel": "gpt-image-1",
        "cdn": "my-cdn",
        "description": "Ghost blog at my-ghost-blog.com"
      }
    }
  }
}
```

**Required Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Must be `"ghost"` for GhostBlogProvider |
| `url` | string | Your Ghost site URL (e.g., `https://demo.ghost.io`) |
| `apiKey` | string | Admin API key for writes (create/update/publish, image upload) |
| `imageGenerationModel` | string | AI image generation model to use (e.g., `gpt-image-1`) |
| `cdn` | string | Name of the CDN provider to use (must match CDN provider name) |
| `description` | string | Human-readable description of the blog |

### CDN Provider Configuration

```json
{
  "cdn": {
    "providers": {
      "my-cdn": {
        "type": "ghost",
        "url": "https://my-ghost-blog.com",
        "apiKey": "your-api-key"
      }
    }
  }
}
```

**Required Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Must be `"ghost"` for GhostCDNProvider |
| `url` | string | Your Ghost site URL |
| `apiKey` | string | Admin API key for image upload operations |

## Integration

This package integrates with the Token Ring agent system through the plugin architecture and service registration patterns.

### Plugin Registration

The `plugin.ts` automatically registers providers when the application starts:

```typescript
install(app, config) {
  if (config.cdn) {
    app.services.waitForItemByType(CDNService, cdnService => {
      for (const name in config.cdn!.providers) {
        const provider = config.cdn!.providers[name];
        if (provider.type === "ghost") {
          cdnService.registerProvider(name, new GhostCDNProvider(GhostCDNProviderOptionsSchema.parse(provider)));
        }
      }
    });
  }

  if (config.blog) {
    app.services.waitForItemByType(BlogService, blogService => {
      for (const name in config.blog!.providers) {
        const provider = config.blog!.providers[name];
        if (provider.type === "ghost") {
          blogService.registerBlog(name, new GhostBlogProvider(GhostBlogProviderOptionsSchema.parse(provider)));
        }
      }
    });
  }
}
```

### Agent State Integration

Each agent gets its own `GhostBlogState` slice for tracking the current post selection, initialized via `attach(agent)`:

```typescript
attach(agent: Agent): void {
  agent.initializeState(GhostBlogState, {});
}
```

### Service Access

Agents access the providers through the BlogService and CDNService via `requireServiceByType() `:

```typescript
const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getCurrentProvider();
await provider.attach(agent);
```

### Provider Registration

Multiple providers can be registered, and the service manages them via the KeyedRegistry pattern. Provider selection is handled by the service based on configuration or explicit selection.

## Usage Examples

### Full Blog Workflow

```typescript
import {BlogService} from "@tokenring-ai/blog";

// Access blog service
const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getCurrentProvider();

// Initialize provider
await provider.attach(agent);

// Create new post
const post = await provider.createPost({
  title: "Getting Started with Ghost",
  content: "# Welcome\n\nThis is a sample blog post.",
  tags: ["ghost", "tutorial"]
}, agent);

console.log(`Created post: ${post.id}`);

// Select and update post
const selected = await provider.selectPostById(post.id, agent);
const updated = await provider.updatePost({
  status: "published",
  content: "# Welcome\n\nThis article explains how to get started."
}, agent);

console.log(`Published post: ${updated.title}`);

// List all posts
const allPosts = await provider.getAllPosts();
console.log(`Total posts: ${allPosts.length}`);
console.log(`Published: ${allPosts.filter(p => p.status === 'published').length}`);

// Cleanup
await provider.clearCurrentPost(agent);
```

### Image Upload Workflow

```typescript
import {CDNService} from "@tokenring-ai/cdn";
import fs from "fs";

// Access CDN service
const cdnService = agent.requireServiceByType(CDNService);
const provider = cdnService.getCurrentProvider();

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
  content: `<p>Check out this image:</p><img src="${result.url}" />`,
  feature_image: {
    url: result.url
  }
}, agent);
```

### Agent Integration Pattern

```typescript
import {Agent} from "@tokenring-ai/agent";
import {BlogService} from "@tokenring-ai/blog";

async function agentWorkflow(agent: Agent) {
  const blogService = agent.requireServiceByType(BlogService);
  const provider = blogService.getCurrentProvider();

  // Initialize state
  provider.attach(agent);

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
      content: "<p>Content here</p>",
      tags: ["article"]
    }, agent);

    // Work with post
    const current = provider.getCurrentPost(agent);
    console.log(`Current: ${current?.title}`);

    // Update post
    await provider.updatePost({
      status: "published"
    }, agent);

  } catch (error) {
    console.error("Error in blog workflow:", error);
  } finally {
    // Clean up
    await provider.clearCurrentPost(agent);
  }
}
```

### Filtering Posts

```typescript
import {BlogService} from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getCurrentProvider();

await provider.attach(agent);

// Search by keyword
const keywordResults = await provider.getRecentPosts({
  keyword: "tutorial",
  limit: 10
}, agent);

console.log(`Found ${keywordResults.length} posts with "tutorial"`);

// Filter by status
const published = await provider.getRecentPosts({
  status: "published",
  limit: 5
}, agent);

console.log(`Latest 5 published posts`);

// Combined filter
const filtered = await provider.getRecentPosts({
  keyword: "ghost",
  status: "draft",
  limit: 10
}, agent);

console.log(`Draft posts about ghost: ${filtered.length}`);
```

## Best Practices

### Required Operations

1. **Always Call attach(agent) First**

   Required before any provider method that interacts with agent state.

   ```typescript
   provider.attach(agent);
   ```

2. **Select Post Before Update**

   Must call `selectPostById` before `updatePost`.

   ```typescript
   await provider.selectPostById(postId, agent);
   await provider.updatePost(data, agent);
   ```

3. **Clear Selection After Use**

   Prevents selection conflicts and helps manage agent state lifecycle.

   ```typescript
   await provider.clearCurrentPost(agent);
   ```

4. **Check State Before Create**

   Ensure no post is selected before creating a new one.

   ```typescript
   const current = provider.getCurrentPost(agent);
   if (current) {
     await provider.clearCurrentPost(agent);
   }
   const newPost = await provider.createPost(data, agent);
   ```

### Configuration Tips

1. **Use Environment Variables**

   Store API keys securely.

   ```typescript
   const config = {
     url: process.env.GHOST_URL,
     apiKey: process.env.GHOST_API_KEY,
     imageGenerationModel: process.env.IMAGE_MODEL || "gpt-image-1",
     cdn: "ghost-cdn",
     description: "Production Ghost Blog"
   };
   ```

2. **Choose Appropriate CDN**

   Ensure blog and CDN providers reference the same Ghost site.

   ```json
   {
     "blog": { "providers": { "production-blog": { "cdn": "production-cdn", ... } } },
     "cdn": { "providers": { "production-cdn": { "url": "https://my-ghost-blog.com", ... } } }
   }
   ```

3. **Descriptive Provider Names**

   Use meaningful names for multiple providers.

   ```json
   {
     "blog": {
       "providers": {
         "production": { "url": "https://blog.example.com", ... },
         "staging": { "url": "https://staging.example.com", ... }
       }
     }
   }
   ```

### API Usage Tips

1. **Status Best Practices**

   - Use `'draft'` for work-in-progress
   - Use `'scheduled'` for future publishing (requires `published_at`)
   - Use `'published'` for live content
   - Avoid `'pending'` and `'private'` (not supported by Ghost API)

2. **Content Handling**

   - Use `content` (markdown) for new posts
   - Use `html` when working with formatted content
   - Provide both for maximum compatibility

3. **Image Metadata**

   - Include relevant metadata when uploading
   - Use descriptive filenames
   - Maintain image quality settings

4. **Error Handling**

   Always wrap provider calls in try-catch blocks.

   ```typescript
   try {
     const post = await provider.createPost(data, agent);
   } catch (error) {
     if (error.message.includes("currently selected")) {
       await provider.clearCurrentPost(agent);
       // Retry or handle accordingly
     } else {
       throw error;
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
      imageGenerationModel: "gpt-image-1",
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
        // Missing imageGenerationModel, cdn, description
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
├── state/
│   └── GhostBlogState.ts            # Agent state slice for current post
├── package.json                     # Package metadata and dependencies
└── vitest.config.ts                 # Test configuration
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
