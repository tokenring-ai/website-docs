# Ghost.io Plugin

The Ghost.io Plugin integrates Ghost CMS services into the Token Ring ecosystem, enabling seamless blog management and CDN operations using Ghost's Admin API. This plugin provides providers for both blog and CDN services, allowing Token Ring applications to interact with Ghost instances for content management and asset delivery.

## Overview

Ghost.io is a popular headless CMS and blogging platform. The Ghost.io Plugin enables Token Ring agents to:

- Browse and select existing Ghost posts as working context
- Create new draft posts from Markdown/HTML content
- Read and update post details
- Upload images to Ghost CDN
- Track the currently selected post across chat sessions

The plugin wraps Ghost's official Admin SDK and integrates with Token Ring's service architecture.

## Key Features

- **Dual Provider Architecture**: Separate blog and CDN providers for content management and image uploads
- **State Management**: Tracks the currently selected post across chat sessions via GhostBlogState
- **Plugin Integration**: Automatically registers services with the application framework
- **Type-Safe Configuration**: Uses Zod schemas for configuration validation
- **Agent Integration**: Attaches state management to agents for seamless post tracking

## Core Components

### GhostBlogProvider

GhostBlogProvider implements the `BlogProvider` interface and provides blog service operations using Ghost's Admin API:

```typescript
class GhostBlogProvider implements BlogProvider {
  constructor(options: GhostBlogProviderOptions);

  // State management
  attach(agent: Agent): Promise<void>;

  // Post operations
  getCurrentPost(agent: Agent): BlogPost | null;
  getAllPosts(): Promise<BlogPost[]>;
  createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>;
  updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>;
  selectPostById(id: string, agent: Agent): Promise<BlogPost>;
  clearCurrentPost(agent: Agent): Promise<void>;
}
```

**Key Properties:**

- `description`: Human-readable description of the blog
- `cdnName`: Name of the CDN provider for feature images
- `imageGenerationModel`: AI model for generating featured images

### GhostCDNProvider

GhostCDNProvider extends `CDNProvider` and handles CDN operations via Ghost's Admin API:

```typescript
class GhostCDNProvider extends CDNProvider {
  constructor(options: GhostCDNProviderOptions);

  // Upload an image to Ghost CDN
  upload(data: Buffer, options?: UploadOptions): Promise<UploadResult>;
}
```

### GhostBlogState

GhostBlogState implements `AgentStateSlice` for state management:

```typescript
class GhostBlogState implements AgentStateSlice {
  name: "GhostBlogState";
  currentPost: GhostPost | null;

  reset(what: ResetWhat[]): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
}
```

## Configuration

The plugin is configured through your application config with separate sections for CDN and blog providers:

```yaml
ghost:
  cdn:
    providers:
      ghost-cdn:
        type: "ghost"
        url: "https://your-site.ghost.io"
        apiKey: "${GHOST_ADMIN_API_KEY}"
  blog:
    providers:
      ghost-blog:
        type: "ghost"
        url: "https://your-site.ghost.io"
        apiKey: "${GHOST_ADMIN_API_KEY}"
        imageGenerationModel: "gpt-image-1"
        cdn: "ghost-cdn"
        description: "My Ghost Blog"
```

### Configuration Options

#### GhostCDNProvider Options

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Ghost site URL (e.g., `https://demo.ghost.io`) |
| `apiKey` | string | Admin API key for authentication |

#### GhostBlogProvider Options

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Ghost site URL |
| `apiKey` | string | Admin API key for writes |
| `imageGenerationModel` | string | AI model for generating featured images (e.g., `gpt-image-1`) |
| `cdn` | string | CDN provider name for feature images |
| `description` | string | Human-readable description |

## Usage Examples

### Basic Setup

```typescript
import { GhostBlogProvider, GhostCDNProvider } from "@tokenring-ai/ghost-io";
import { BlogService, CDNService } from "@tokenring-ai/blog";

// The plugin handles service registration automatically when configured
// No manual service setup required - just configure and use
```

### Creating a Draft Post

```typescript
import { GhostBlogProvider } from "@tokenring-ai/ghost-io";

const provider = new GhostBlogProvider({
  url: "https://your-ghost-site.com",
  apiKey: "your-admin-api-key",
  imageGenerationModel: "gpt-image-1",
  cdn: "ghost-cdn",
  description: "My Ghost Blog"
});

// Create a new post
const newPost = await provider.createPost({
  title: "Hello Ghost from Token Ring",
  content: "# Heading\n\nThis was written by an agent.",
  tags: ["tokenring", "ghost"]
}, agent);

console.log("Created post:", newPost.id, newPost.title);
```

### Uploading an Image to CDN

```typescript
import { GhostCDNProvider } from "@tokenring-ai/ghost-io";

const provider = new GhostCDNProvider({
  url: "https://your-ghost-site.com",
  apiKey: "your-admin-api-key"
});

// Assuming you have a file buffer from somewhere
const imageBuffer = Buffer.from("image-data", "binary");

const result = await provider.upload(imageBuffer, {
  filename: "featured-image.jpg"
});

console.log("Uploaded to:", result.url);
```

### Selecting and Updating a Post

```typescript
import { GhostBlogProvider } from "@tokenring-ai/ghost-io";

const provider = new GhostBlogProvider({
  url: "https://your-ghost-site.com",
  apiKey: "your-admin-api-key",
  imageGenerationModel: "gpt-image-1",
  cdn: "ghost-cdn",
  description: "My Ghost Blog"
});

// First select a post by ID
const post = await provider.selectPostById("post-id-here", agent);

// Then update it
const updatedPost = await provider.updatePost({
  title: "Updated Title",
  content: "## Updated Content\n\nThis content was updated by an agent.",
  tags: ["updated", "tokenring"],
  status: "draft"
}, agent);

console.log("Updated post:", updatedPost.title);
```

## API Reference

### GhostBlogProvider Methods

| Method | Description |
|--------|-------------|
| `attach(agent)` | Initializes GhostBlogState for the agent |
| `getCurrentPost(agent)` | Returns the currently selected post |
| `getAllPosts()` | Fetches all posts from Ghost Admin API |
| `createPost(data, agent)` | Creates a new draft post |
| `updatePost(data, agent)` | Updates the currently selected post |
| `selectPostById(id, agent)` | Fetches and selects a post by ID |
| `clearCurrentPost(agent)` | Clears the current post selection |

### GhostCDNProvider Methods

| Method | Description |
|--------|-------------|
| `upload(data, options)` | Uploads an image buffer to Ghost CDN |

### GhostBlogState Methods

| Method | Description |
|--------|-------------|
| `reset(what)` | Resets state (triggers on 'chat' reset) |
| `serialize()` | Returns serializable state |
| `deserialize(data)` | Restores state from data |
| `show()` | Returns display string for current post |

## Integration

The plugin integrates with Token Ring through:

1. **Plugin Architecture**: Exports a `TokenRingPlugin` that handles service registration
2. **Service Registry**: Uses `app.services.waitForItemByType()` to wait for BlogService and CDNService
3. **Provider Registration**: Registers GhostBlogProvider and GhostCDNProvider with their respective services
4. **State Management**: GhostBlogState attaches to agents for persistent post tracking

### Service Integration Flow

```typescript
// Plugin registration flow
plugin.install(app, config) {
  // Wait for CDNService and register GhostCDNProvider
  app.services.waitForItemByType(CDNService, cdnService => {
    cdnService.registerProvider(name, new GhostCDNProvider(options));
  });

  // Wait for BlogService and register GhostBlogProvider
  app.services.waitForItemByType(BlogService, blogService => {
    blogService.registerBlog(name, new GhostBlogProvider(options));
  };
}
```

## Development

### Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Building

```bash
# Type check the package
bun run build
```

### Package Structure

```
pkg/ghost-io/
├── index.ts                 # Main exports
├── plugin.ts                # Token Ring plugin for auto-registration
├── GhostBlogProvider.ts     # Blog provider implementation
├── GhostCDNProvider.ts      # CDN provider implementation
├── state/
│   └── GhostBlogState.ts    # State management for current post
├── vitest.config.ts         # Vitest configuration
├── package.json             # Package manifest
└── docs/                    # Ghost API reference documentation
```

## Notes and Caveats

- GhostBlogProvider only uses the Admin API (not Content API) for all operations
- The `currentPost` selection is required for update operations; use `selectPostById` first
- Ghost does not support "pending" or "private" post statuses
- The package provides two distinct providers that must be configured separately
- Ensure your Ghost site is running Ghost 5.0+ for full API compatibility
- Admin API keys must be kept secure and are not suitable for client-side use

## Related Components

- [Blog Plugin](blog.md): Blog service abstraction and interfaces
- [CDN Plugin](cdn.md): CDN service abstraction and interfaces
- [Agent Plugin](agent.md): Agent system and state management
- [Image Generation Plugin](image-generation.md): AI image generation for featured images

## License

MIT License

Copyright (c) 2025 Mark Dierolf

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
