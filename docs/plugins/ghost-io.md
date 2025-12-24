# Ghost.io Plugin

Ghost.io integration for creating and managing blog posts via Ghost Admin and Content APIs.

## Overview

The `@tokenring-ai/ghost-io` package provides Ghost.io integration for the Token Ring writer. It enables agents to browse, create, and manage Ghost blog posts through the official Ghost Admin and Content APIs, with state management for tracking the current post.

## Key Features

- **Dual Provider Architecture**: Separate blog and CDN providers for content management and image uploads
- **State Management**: Tracks the currently selected post across chat sessions
- **AI Image Generation**: Supports generating AI images for featured images
- **Plugin Integration**: Automatically registers services with the application framework
- **Chat Commands**: Interactive command interface for post management

## Core Components

### GhostBlogProvider

Blog provider implementation for Ghost.io integration.

**Constructor:**
```typescript
new GhostBlogProvider({
  url: string,
  apiKey: string,
  imageGenerationModel: string,
  cdn: string,
  description: string
})
```

**Key Methods:**
- `getCurrentPost(agent: Agent): BlogPost | null` - Get the currently selected post
- `getAllPosts(): Promise<BlogPost[]>` - Browse all posts
- `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>` - Create new post
- `updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>` - Update selected post
- `selectPostById(id: string, agent: Agent): Promise<BlogPost>` - Fetch post by ID
- `clearCurrentPost(agent: Agent): Promise<void>` - Clear current post selection
- `publishPost(agent: Agent): Promise<BlogPost>` - Publish selected post

### GhostCDNProvider

CDN provider for image uploads to Ghost.

**Constructor:**
```typescript
new GhostCDNProvider({
  url: string,
  apiKey: string
})
```

**Key Method:**
- `upload(data: Buffer, options?: UploadOptions): Promise<UploadResult>` - Upload image to Ghost CDN

### GhostBlogState

State management for tracking the current post.

**Properties:**
- `currentPost: GhostPost | null` - The currently selected post (or null)

## Tools

### createPost

Create a new Ghost post from Markdown content.

**Input Schema:**
```typescript
interface CreatePostData {
  title: string;
  content: string;
  tags?: string[];
  feature_image?: { url: string };
}
```

**Usage:**
```typescript
const result = await agent.executeTool('ghost-io/createPost', {
  title: 'Hello Ghost from Token Ring',
  content: '# Heading\n\nThis was written by an agent.',
  tags: ['tokenring', 'ghost']
});
```

### getCurrentPost

Return details of the currently selected post.

**Usage:**
```typescript
const result = await agent.executeTool('ghost-io/getCurrentPost');
```

### updatePost

Update the selected post.

**Input Schema:**
```typescript
interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: string[];
  feature_image?: { url: string };
  status?: 'draft' | 'published' | 'scheduled';
}
```

**Usage:**
```typescript
const result = await agent.executeTool('ghost-io/updatePost', {
  title: 'Updated Title',
  content: '## Updated Content\n\nThis content was updated by an agent.',
  tags: ['updated', 'tokenring'],
  status: 'draft'
});
```

### clearCurrentPost

Clear the current post selection.

**Usage:**
```typescript
const result = await agent.executeTool('ghost-io/clearCurrentPost');
```

### publishPost

Publish the selected post.

**Usage:**
```typescript
const result = await agent.executeTool('ghost-io/publishPost');
```

### generateImageForPost

Generate AI image and set as featured image.

**Input Schema:**
```typescript
interface GenerateImageInput {
  prompt: string;
  aspectRatio?: 'square' | 'tall' | 'wide';
  detail?: 'low' | 'high' | 'auto';
  model?: string;
}
```

**Usage:**
```typescript
const result = await agent.executeTool('ghost-io/generateImageForPost', {
  prompt: 'A futuristic city skyline',
  aspectRatio: 'wide',
  detail: 'high'
});
```

## Chat Commands

**Command**: `/ghost`

**Usage**: `/ghost [post|cdn] [action]`

- `post select`: Open tree selector to choose existing post or clear selection
- `post info`: Show details about currently selected post
- `post new`: Clear selection for new post creation
- `post create`: Create new post (requires title and content)
- `post update`: Update selected post
- `post publish`: Publish selected post
- `cdn upload`: Upload image to Ghost CDN (requires file selection)

## Configuration Options

### GhostBlogProvider Configuration

```typescript
interface GhostBlogProviderOptions {
  url: string; // Ghost site URL (e.g., https://demo.ghost.io)
  apiKey: string; // Admin API key for writes
  imageGenerationModel: string; // AI image generation model (e.g., gpt-image-1)
  cdn: string; // CDN provider name configured in CDN service
  description: string; // Human-readable description
}
```

### GhostCDNProvider Configuration

```typescript
interface GhostCDNProviderOptions {
  url: string; // Ghost site URL
  apiKey: string; // Admin API key
}
```

**Environment Variables:**
- `GHOST_URL`: Ghost site URL
- `GHOST_ADMIN_API_KEY`: Admin API key for writes
- `GHOST_CONTENT_API_KEY`: Content API key for reads
- `GHOST_IMAGE_MODEL`: AI image generation model (optional)

## Package Structure

```
pkg/ghost-io/
├── index.ts              # Main exports
├── plugin.ts             # Token Ring plugin for auto-registration
├── GhostBlogProvider.ts  # Blog provider implementation
├── GhostCDNProvider.ts   # CDN provider implementation
├── state/
│   └── GhostBlogState.ts # State management for current post
└── tools/               # (Future: agent tools)
```

## Integration with Agent System

The package integrates with the Token Ring agent system through:

1. **State Management**: `GhostBlogState` tracks the current post selection
2. **Plugin Architecture**: Automatically registers services when the app starts
3. **Service Registry**: Services are registered with the application framework via plugins
4. **Tool Registration**: Tools are automatically registered with chat systems

## Usage Examples

### Basic Setup

```typescript
import { GhostBlogProvider, GhostCDNProvider } from "@tokenring-ai/ghost-io";
import { BlogService, CDNService } from "@tokenring-ai/blog";

// Configure CDN service with Ghost CDN provider
const cdnService = new CDNService().registerProvider("ghost", new GhostCDNProvider({
  url: process.env.GHOST_URL!,
  apiKey: process.env.GHOST_ADMIN_API_KEY!
}));

// Configure blog service with Ghost blog provider
const blogService = new BlogService().registerBlog("ghost", new GhostBlogProvider({
  url: process.env.GHOST_URL!,
  apiKey: process.env.GHOST_ADMIN_API_KEY!,
  imageGenerationModel: "gpt-image-1",
  cdn: "ghost",
  description: "Ghost blog integration"
}));

// The package provides plugin-based integration that automatically registers services
// when the app starts with the correct configuration
```

### Creating a Draft Post

```typescript
import { GhostBlogProvider } from "@tokenring-ai/ghost-io";

const provider = new GhostBlogProvider({
  url: "https://your-ghost-site.com",
  apiKey: "your-admin-api-key",
  imageGenerationModel: "gpt-image-1",
  cdn: "ghost",
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

### Uploading an Image

```typescript
import { GhostCDNProvider } from "@tokenring-ai/ghost-io";

const provider = new GhostCDNProvider({
  url: "https://your-ghost-site.com",
  apiKey: "your-admin-api-key"
});

// Assuming you have a file buffer from somewhere
const imageBuffer = Buffer.from("image-data", "binary");

const result = await provider.upload(imageBuffer, {
  filename: "featured-image.jpg",
  purpose: "image"
});

console.log("Uploaded to:", result.url);
```

## Dependencies

This package depends on:

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/blog`: Blog service abstraction
- `@tokenring-ai/cdn`: CDN service abstraction
- `@tryghost/admin-api`: Official Ghost Admin API client
- `@tryghost/content-api`: Official Ghost Content API client
- `form-data`: For image uploads
- `uuid`: For generating unique filenames

## Notes and Caveats

- Requires both Admin and Content API keys
- Some operations rely on `currentPost`; use `selectPostById` or the `/ghost post select` command to set context
- The package provides two distinct providers: `GhostBlogProvider` for blog posts and `GhostCDNProvider` for image uploads
- Ensure your Ghost site is running Ghost 5.0+ for full API compatibility
- AI image generation requires an image model to be configured and available