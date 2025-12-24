# WordPress Plugin

WordPress integration for creating and managing blog posts via REST API, with support for CDN functionality using WordPress media library.

## Overview

The `@tokenring-ai/wordpress` package provides comprehensive WordPress integration for the Token Ring writer. It enables agents to browse, create, manage, and publish WordPress blog posts through the WordPress REST API, with built-in CDN functionality for media management.

## Key Features

- **Blog Management**: Create, update, and publish WordPress posts
- **CDN Integration**: Use WordPress media library as CDN for file uploads
- **Markdown Support**: Convert Markdown to HTML automatically
- **Tag Management**: Create and manage post tags dynamically
- **State Preservation**: Maintain current post context across interactions
- **Media Handling**: Upload images to WordPress media library
- **AI Image Generation**: Generate featured images for posts (requires AI image client)

## Core Components

### WordPressBlogProvider

The main blog provider that implements the `BlogProvider` interface.

**Constructor Options:**
```typescript
{
  url: string,
  username: string,
  password: string,
  imageGenerationModel: string,
  cdn: string,
  description: string
}
```

**Key Methods:**
- `getAllPosts(): Promise<BlogPost[]>` - Get all posts with statuses (publish, future, draft, pending, private)
- `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>` - Create new draft post
- `updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>` - Update selected post
- `selectPostById(id: string, agent: Agent): Promise<BlogPost>` - Select post by ID
- `getCurrentPost(agent: Agent): BlogPost | null` - Get currently selected post
- `clearCurrentPost(agent: Agent): Promise<void>` - Clear current post selection

### WordPressCDNProvider

CDN provider that uses WordPress media library for file storage.

**Constructor Options:**
```typescript
{
  url: string,
  username: string,
  password: string
}
```

**Key Methods:**
- `upload(data: Buffer, options?: UploadOptions): Promise<UploadResult>` - Upload file to WordPress media library

### WordPressBlogState

State management for tracking the currently selected post.

**Properties:**
- `currentPost: WPPost | null` - Currently selected WordPress post

### Tools

**wordpress/createPost**: Create a new WordPress post from Markdown
- Input: `{ title: string, content: string, tags?: string[], feature_image?: { id: string } }`
- Converts Markdown to HTML and creates draft post

**wordpress/getCurrentPost**: Return details of currently selected post

**wordpress/updatePost**: Update selected post
- Input: `{ title?: string, content?: string, tags?: string[], feature_image?: { id: string }, status?: 'published'|'scheduled'|'draft'|'pending'|'private' }`

**wordpress/selectPostById**: Select post by ID
- Input: `{ id: string }`

**wordpress/clearCurrentPost**: Clear current post selection

**wordpress/generateImageForPost**: Generate AI image and set as featured image
- Input: `{ prompt: string, aspectRatio?: 'square'|'tall'|'wide' }`

### Chat Commands

**/wordpress**: WordPress post management
- `post select`: Open tree selector to choose existing post
- `post info`: Show details about currently selected post
- `post new`: Clear selection for new post creation
- `post update`: Update currently selected post
- `post publish`: Publish currently selected post
- `post clear`: Clear current post selection
- `post tags add`: Add tags to current post
- `post tags remove`: Remove tags from current post

## Usage Example

```typescript
import { WordPressBlogProvider, WordPressCDNProvider } from '@tokenring-ai/wordpress';
import { BlogService, CDNService } from '@tokenring-ai/blog';
import { CDNService } from '@tokenring-ai/cdn';

// Initialize WordPress blog provider
const wpBlogProvider = new WordPressBlogProvider({
  url: process.env.WORDPRESS_URL!,
  username: process.env.WORDPRESS_USERNAME!,
  password: process.env.WORDPRESS_PASSWORD!,
  imageGenerationModel: process.env.AI_IMAGE_MODEL!,
  cdn: 'wordpress',
  description: 'WordPress Blog'
});

// Initialize WordPress CDN provider
const wpCDNProvider = new WordPressCDNProvider({
  url: process.env.WORDPRESS_URL!,
  username: process.env.WORDPRESS_USERNAME!,
  password: process.env.WORDPRESS_PASSWORD!
});

// Register with services
app.services.waitForItemByType(BlogService, blogService => {
  blogService.registerBlog('wordpress', wpBlogProvider);
});

app.services.waitForItemByType(CDNService, cdnService => {
  cdnService.registerProvider('wordpress', wpCDNProvider);
});

// Create a post
const result = await agent.executeTool('wordpress/createPost', {
  title: 'Hello WordPress from Token Ring',
  content: '# Hello World\\n\\nThis is a test post created by an agent.',
  tags: ['tokenring', 'wordpress', 'test']
});

// Generate featured image
await agent.executeTool('wordpress/generateImageForPost', {
  prompt: 'A beautiful landscape image for a blog post'
});
```

## Configuration Options

### Blog Provider Configuration

```json
{
  "blog": {
    "providers": {
      "wordpress": {
        "type": "wordpress",
        "url": "https://your-site.com",
        "username": "your-username",
        "password": "your-app-password",
        "imageGenerationModel": "dall-e-3",
        "cdn": "wordpress",
        "description": "WordPress Blog"
      }
    }
  }
}
```

### CDN Provider Configuration

```json
{
  "cdn": {
    "providers": {
      "wordpress": {
        "type": "wordpress",
        "url": "https://your-site.com",
        "username": "your-username",
        "password": "your-app-password"
      }
    }
  }
}
```

**Environment Variables:**
- `WORDPRESS_URL` - WordPress site URL
- `WORDPRESS_USERNAME` - WordPress username
- `WORDPRESS_PASSWORD` - WordPress application password (not regular password)
- `AI_IMAGE_MODEL` - AI image generation model name

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/blog`: Blog abstraction layer
- `@tokenring-ai/cdn`: CDN abstraction layer
- `@tokenring-ai/app`: Application framework
- `wordpress-api-client@0.4.9`: WordPress REST API client
- `marked@17.0.1`: Markdown to HTML converter
- `zod`: Schema validation
- `uuid`: UUID generation

## Notes

- Requires WordPress application password (generated in WordPress admin dashboard)
- generateImageForPost requires AI image model configuration
- Posts are created as drafts by default
- Markdown content is automatically converted to HTML
- Tags are created if they don't exist, or reused if they do
- CDN service stores files in WordPress media library with proper MIME type handling
- Status mapping: WordPress status → Blog status
  - `publish` → `published`
  - `future` → `scheduled`
  - `draft` → `draft`
  - `pending` → `pending`
  - `private` → `private`

## Error Handling

Common error scenarios:
- **Missing credentials**: Ensure WordPress application password is set
- **Post already selected**: Clear current selection before creating new post
- **No post selected**: Select a post before attempting updates
- **Invalid media ID**: Ensure CDN is properly configured for WordPress
- **Tag creation failure**: Check WordPress permissions for tag management