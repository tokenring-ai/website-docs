# Ghost.io Plugin

Ghost.io integration for creating and managing blog posts via Ghost Admin and Content APIs.

## Overview

The `@tokenring-ai/ghost-io` package provides Ghost.io integration for the Token Ring writer. It enables agents to browse, create, and manage Ghost blog posts through the official Ghost Admin and Content APIs.

## Key Features

- Browse and select existing posts
- Create new draft posts from Markdown
- Update and publish posts
- Generate AI images for featured images
- Upload images to Ghost
- Maintain current post context

## Core Components

### GhostIOService

Main service for Ghost.io integration.

**Constructor:**
```typescript
new GhostIOService({
  url: string,
  adminApiKey: string,
  contentApiKey: string
})
```

**Key Methods:**
- `getAllPosts(): Promise<GhostPost[]>` - Browse all posts
- `createPost({ title, html, tags, published }): Promise<GhostPost>` - Create post from HTML
- `updatePost({ title, content, tags }): Promise<GhostPost>` - Edit selected post
- `publishPost(): Promise<GhostPost>` - Publish selected post
- `selectPostById(id: string): Promise<GhostPost>` - Fetch and select a post
- `uploadImage(formData): Promise<{ url: string }>` - Upload image
- `getCurrentPost()/setCurrentPost(post|null)` - Manage current selection

### Tools

**createPost**: Create a new Ghost post from Markdown
- Input: `{ title: string, content: string, tags?: string[] }`
- Converts Markdown to HTML and creates draft post

**getCurrentPost**: Return details of currently selected post

**generateImageForPost**: Generate AI image and set as featured image
- Input: `{ prompt: string, aspectRatio?: 'square'|'tall'|'wide', detail?: 'low'|'high'|'auto', model?: string }`
- Requires AI image client and filesystem resource

### Chat Commands

**/ghost**: Ghost post management
- `post select`: Open tree selector to choose existing post
- `post info`: Show details about currently selected post
- `post new`: Clear selection for new post creation

## Usage Example

```typescript
import { GhostIOService } from '@tokenring-ai/ghost-io';

const ghostService = new GhostIOService({
  url: process.env.GHOST_URL!,
  adminApiKey: process.env.GHOST_ADMIN_API_KEY!,
  contentApiKey: process.env.GHOST_CONTENT_API_KEY!
});

agent.addService(ghostService);

// Create a post
const result = await agent.executeTool('ghost-io/createPost', {
  title: 'Hello Ghost from Token Ring',
  content: '# Heading\n\nThis was written by an agent.',
  tags: ['tokenring', 'ghost']
});
```

## Configuration Options

- **url**: Ghost site URL (e.g., https://demo.ghost.io)
- **adminApiKey**: Admin API key for writes (create/update/publish, image upload)
- **contentApiKey**: Content API key for reads

**Environment Variables:**
- `GHOST_URL`
- `GHOST_ADMIN_API_KEY`
- `GHOST_CONTENT_API_KEY`

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/blog@0.1.0`: Blog abstraction
- Ghost Admin SDK
- Ghost Content SDK

## Notes

- Requires both Admin and Content API keys
- generateImageForPost requires AI image model configuration
- Posts are created as drafts by default
- Markdown is automatically converted to HTML
