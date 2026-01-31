# Ghost.io Integration

## Overview

The @tokenring-ai/ghost-io package provides comprehensive integration with the Ghost.io blog platform for Token Ring AI agents. It wraps the Ghost Admin SDK to provide secure authentication and implements both the BlogProvider and CDNProvider interfaces for seamless blog management and content delivery.

### Core Capabilities

- **Blog Management**: Create, update, select, and clear blog posts with full CRUD operations
- **CDN Integration**: Upload images directly to Ghost's content delivery network
- **Agent State Management**: Track currently selected post per agent session
- **API Wrapping**: Secure access to Ghost v5.0 Admin API with proper authentication
- **Post Conversion**: Automatic conversion between Ghost's data structures and Token Ring's blog provider model

### Integration Points

- **BlogService**: Registers GhostBlogProvider for blog post management
- **CDNService**: Registers GhostCDNProvider for media content delivery
- **Agent State**: Uses GhostBlogState to track active post per agent session
- **Authentication**: Uses API key-based authentication via Ghost Admin SDK

## Installation

```bash
bun add @tokenring-ai/ghost-io
```

## Configuration

The plugin uses separate configuration schemas for blog and CDN providers:

### Plugin Configuration

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import packageJSON from './package.json' with {type: 'json'};
import GhostBlogProvider from "./GhostBlogProvider.ts";
import GhostCDNProvider from "./GhostCDNProvider.ts";

const packageConfigSchema = z.object({
  cdn: z.object({
    providers: z.record(z.string(), z.object({
      type: z.literal("ghost"),
      url: z.string(),
      apiKey: z.string(),
    })).optional(),
  }).optional(),
  blog: z.object({
    providers: z.record(z.string(), z.object({
      type: z.literal("ghost"),
      url: z.string(),
      apiKey: z.string(),
      imageGenerationModel: z.string(),
      cdn: z.string(),
      description: z.string(),
    })).optional(),
  }).optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  config: packageConfigSchema,
  install(app, config) {
    if (config.cdn?.providers) {
      app.services.waitForItemByType(CDNService, cdnService => {
        for (const [name, providerConfig] of Object.entries(config.cdn.providers)) {
          if (providerConfig.type === "ghost") {
            cdnService.registerProvider(name, new GhostCDNProvider(providerConfig));
          }
        }
      });
    }

    if (config.blog?.providers) {
      app.services.waitForItemByType(BlogService, blogService => {
        for (const [name, providerConfig] of Object.entries(config.blog.providers)) {
          if (providerConfig.type === "ghost") {
            blogService.registerBlog(name, new GhostBlogProvider(providerConfig));
          }
        }
      });
    }
  }
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Blog Provider Configuration

```typescript
{
  "blog": {
    "providers": {
      "my-blog": {
        "type": "ghost",
        "url": "https://my-ghost-blog.com",
        "apiKey": "your-api-key",
        "imageGenerationModel": "gpt-4",
        "cdn": "my-cdn",
        "description": "Ghost blog at my-ghost-blog.com"
      }
    }
  }
}
```

### CDN Provider Configuration

```typescript
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

## Core Components

### GhostBlogProvider

The GhostBlogProvider class implements the BlogProvider interface for Ghost.io blog management. All methods require the plugin's `attach(agent)` method to be called first.

```typescript
import {BlogService} from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);
const provider = blogService.getCurrentProvider();

await provider.attach(agent);
```

#### Key Methods

**attach(agent)**
- Initializes GhostBlogState for the agent
- REQUIRED before using any provider methods
- No return value

```typescript
provider.attach(agent);
```

**getCurrentPost(agent)**
- Retrieves the currently selected post from agent state
- Returns BlogPost | null if no post is selected

```typescript
const post = provider.getCurrentPost(agent);
if (post) {
  console.log(post.title, post.status);
}
```

**getAllPosts()**
- Fetches all blog posts from Ghost Admin API
- Returns array of BlogPost objects

```typescript
const allPosts = await provider.getAllPosts();
console.log(`Found ${allPosts.length} posts`);
```

**createPost(data, agent)**
- Creates a new draft post on Ghost.io
- **REQUIRES**: attach(agent) called first
- **REQUIRES**: No post currently selected (clearCurrentPost first)
- Raises error if post already selected

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

**updatePost(data, agent)**
- Updates the currently selected post
- **REQUIRES**: attach(agent) called first
- **REQUIRES**: A post must be selected (via selectPostById)
- **LIMITATION**: Cannot use status 'pending' or 'private' (Ghost API limitation)

```typescript
const currentPost = provider.getCurrentPost(agent);
if (!currentPost) {
  throw new Error("No post selected. Call selectPostById() first.");
}

const updatedPost = await provider.updatePost({
  title: "Updated Title",
  content: "<p>Updated content...</p>",
  status: "published"
}, agent);

console.log(`Updated post: ${updatedPost.title}`);
```

**selectPostById(id, agent)**
- Fetches and selects a post by ID as the current post
- **REQUIRES**: attach(agent) called first
- Raises error if post not found

```typescript
const post = await provider.selectPostById("1e0b8941-1234-5678-90ab-cdef12345678", agent);
console.log(`Selected post: ${post.title}`);
```

**clearCurrentPost(agent)**
- Clears the current post selection from state

```typescript
await provider.clearCurrentPost(agent);
```

### GhostCDNProvider

The GhostCDNProvider class extends CDNProvider for image uploads to Ghost's CDN.

```typescript
import {CDNService} from "@tokenring-ai/cdn";

const cdnService = agent.requireServiceByType(CDNService);
const provider = cdnService.getCurrentProvider();
```

#### Key Methods

**upload(data, options)**
- Uploads image buffer to Ghost CDN
- Generates unique filename using uuid if not provided
- Returns UploadResult with URL and metadata

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

## GhostBlogState

Each agent maintains its own GhostBlogState instance for tracking the currently selected post.

### State Properties

```typescript
{
  currentPost: GhostPost | null
}
```

### State Lifecycle

- **Initialization**: Created when attach(agent) is called
- **Persistence**: Serialized/deserialized across agent sessions
- **Reset**: Cleared when chat ends (chat reset)
- **Inheritance**: Child agents inherit parent's currentPost selection

### State Access

```typescript
// Initialize state
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

// Reset on chat end
state.reset(['chat']);
```

## Post Conversion

GhostPost objects are automatically converted to BlogPost objects when using provider methods.

### Conversion Requirements

The converter validates:
- **id**: Required field
- **title**: Required field
- **status**: Required field (draft, published, scheduled)

### Conversion Behavior

```typescript
function GhostPostToBlogPost({
  id,
  title,
  content,
  html,
  status,
  created_at,
  updated_at,
  published_at,
  feature_image,
  // ... other fields
}): BlogPost {
  // Validates required fields
  // Converts timestamps to Date objects
  // Uses content or html as content property
  // Converts feature_image string to { url } object
  // Returns BlogPost-compatible object
}
```

### Supported GhostPost Fields

All GhostPost fields are supported:
- **id**: Unique post identifier
- **title**: Post title
- **content**: Markdown content (if present)
- **html**: HTML content (fallback)
- **status**: draft | published | scheduled
- **tags**: Array of tag names
- **created_at**: Creation timestamp (ISO 8601)
- **updated_at**: Last update timestamp (ISO 8601)
- **published_at**: Publication timestamp (ISO 8601)
- **feature_image**: Image URL string
- **excerpt**: Post excerpt
- **url**: Published URL
- **slug**: URL slug

## API Interface

GhostBlogProvider wraps the Ghost Admin API v5.0 interface:

```typescript
interface GhostAdminAPI {
  posts: {
    browse: (params: { limit: string }) => Promise<GhostPost[]>;
    add: (data: GhostPost, options?: { source: string }) => Promise<GhostPost>;
    edit: (data: GhostPost) => Promise<GhostPost>;
    read: (params: { id: string, formats?: string }) => Promise<GhostPost | null>;
  };
  tags: {
    browse: () => Promise<string[]>;
  };
  images: {
    upload: (data: Buffer, options?: { filename: string, purpose: string }) => Promise<{
      url: string;
      id: string;
      metadata: any
    }>;
  }
}
```

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

// Select and update post
const selected = await provider.selectPostById(post.id, agent);
const updated = await provider.updatePost({
  status: "published",
  content: "# Welcome\n\nThis article explains how to get started."
}, agent);

// List all posts
const allPosts = await provider.getAllPosts();
console.log(`Active posts: ${allPosts.filter(p => p.status === 'published').length}`);

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

  // Create content
  const post = await provider.createPost({
    title: "My Article",
    content: "<p>Content here</p>"
  }, agent);

  // Work with post
  const current = provider.getCurrentPost(agent);
  console.log(`Current: ${current?.title}`);

  // Clean up
  await provider.clearCurrentPost(agent);
}
```

## Error Handling

### Common Errors

1. **Post Already Selected**
   ```typescript
   // Attempt to create post while one is selected
   throw new Error("A post is currently selected. Clear the selection before creating a new post.");
   ```

2. **No Post Selected**
   ```typescript
   // Attempt to update post without selecting first
   throw new Error("No post is currently selected. Select a post before updating.");
   ```

3. **Status Not Supported**
   ```typescript
   // Attempt to use 'pending' or 'private' status
   throw new Error("Ghost does not support pending or private posts");
   ```

4. **Post Not Found**
   ```typescript
   // Attempt to select non-existent post
   throw new Error(`Post with ID ${id} not found`);
   ```

5. **Missing Configuration**
   ```typescript
   // Missing required fields
   throw new Error("Error in Ghost config: No url provided");
   ```

### Error Handling Pattern

```typescript
try {
  const post = await provider.createPost(data, agent);
  console.log(`Post created: ${post.title}`);
} catch (error) {
  if (error.message.includes("currently selected")) {
    // Clear selection and retry
    await provider.clearCurrentPost(agent);
    const newPost = await provider.createPost(data, agent);
  } else if (error.message.includes("No post is currently selected")) {
    // Select post first
    const post = await provider.selectPostById("some-id", agent);
  } else {
    console.error("Blog operation failed:", error.message);
  }
}
```

## Best Practices

### Required Operations

1. **Always Call attach(agent) First**
   - Required before any provider method
   - Initializes state and hooks
   ```typescript
   provider.attach(agent);
   ```

2. **Select Post Before Update**
   - Must call selectPostById before updatePost
   - Keeps context clear and reduces errors
   ```typescript
   await provider.selectPostById(postId, agent);
   await provider.updatePost(data, agent);
   ```

3. **Clear Selection After Use**
   - Prevents selection conflicts
   - Helps manage agent state lifecycle
   ```typescript
   await provider.clearCurrentPost(agent);
   ```

### Configuration Tips

1. **Use Environment Variables**
   - Store API keys securely
   - Never hardcode in codebases
   ```typescript
   const config = {
     url: process.env.GHOST_URL,
     apiKey: process.env.GHOST_API_KEY
   };
   ```

2. **Choose Appropriate CDN**
   - Ensure blog and CDN providers reference the same Ghost site
   - Use descriptive names for providers
   ```typescript
   {
     blog: { providers: { "my-blog": { ... } } },
     cdn: { providers: { "my-cdn": { ... } } }
   }
   ```

### API Usage Tips

1. **Status Best Practices**
   - Use 'draft' for work-in-progress
   - Use 'scheduled' for future publishing
   - Avoid 'pending' and 'private' (not supported)

2. **Content Handling**
   - Use `content` (markdown) preferentially
   - Use `html` as fallback
   - Provide both for maximum compatibility

3. **Image Metadata**
   - Include relevant metadata when uploading
   - Use descriptive filenames
   - Maintain image quality settings

## Dependencies

### Core Dependencies

- **@tokenring-ai/blog**: Blog provider interface and BlogService
- **@tokenring-ai/cdn**: CDN provider interface and CDNService
- **@tokenring-ai/agent**: Agent system and state management
- **@tokenring-ai/app**: Plugin registration framework
- **@tryghost/admin-api**: Official Ghost Admin SDK (v5.0)
- **@lexical/headless**: Lexical editor integration
- **@lexical/markdown**: Markdown content format

### Utility Dependencies

- **form-data**: Multipart form data for image uploads
- **uuid**: Unique identifier generation
- **zod**: Schema validation
- **typescript**: Type definitions

### Development Dependencies

- **vitest**: Unit testing framework
- **@vitest/coverage-v8**: Code coverage reporting

## Testing

### Example Test Setup

```typescript
import {describe, expect, it} from 'vitest';
import GhostBlogProvider from "../src/GhostBlogProvider.ts";

describe("GhostBlogProvider", () => {
  it("should initialize with valid configuration", () => {
    const provider = new GhostBlogProvider({
      url: "https://test.ghost.io",
      apiKey: "test-key",
      imageGenerationModel: "gpt-4",
      cdn: "test-cdn",
      description: "Test blog"
    });

    expect(provider).toBeDefined();
  });

  it("should throw error when missing required config", () => {
    expect(() => {
      new GhostBlogProvider({
        url: "https://test.ghost.io",
        apiKey: "test-key"
        // Missing imageGenerationModel, cdn, description
      });
    }).toThrow("Error in Ghost config");
  });
});
```

## License

MIT License - see LICENSE file for details.
