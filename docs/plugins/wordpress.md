# WordPress Plugin

WordPress integration for creating and managing blog posts via REST API.

## Overview

The `@tokenring-ai/wordpress` package provides WordPress integration for the Token Ring writer. It enables agents to browse, create, and manage WordPress blog posts through the WordPress REST API.

## Key Features

- Browse and select existing posts
- Create new draft posts from Markdown
- Update and publish posts
- Generate AI images for featured images
- Upload images to WordPress media library
- Maintain current post context
- CDN service using WordPress media library

## Core Components

### WordPressService

Main service for WordPress integration.

**Constructor:**
```typescript
new WordPressService({
  url: string,
  username: string,
  password: string  // Application password
})
```

**Key Methods:**
- `getAllPosts(): Promise<WordPressPost[]>` - Browse all posts
- `createPost({ title, html, tags }): Promise<WordPressPost>` - Create post from HTML
- `updatePost({ title, content, tags }): Promise<WordPressPost>` - Edit selected post
- `publishPost(): Promise<WordPressPost>` - Publish selected post
- `selectPostById(id: string): Promise<WordPressPost>` - Fetch and select a post
- `uploadImage(formData): Promise<{ url: string }>` - Upload image
- `getCurrentPost()/setCurrentPost(post|null)` - Manage current selection

### WordPressCDNService

Uses WordPress media library as a CDN.

**Constructor:**
```typescript
new WordPressCDNService({
  url: string,
  username: string,
  password: string
})
```

Files uploaded via this service are stored in the WordPress media library.

### Tools

**createPost**: Create a new WordPress post from Markdown
- Input: `{ title: string, content: string, tags?: string[] }`
- Converts Markdown to HTML and creates draft post

**getCurrentPost**: Return details of currently selected post

**generateImageForPost**: Generate AI image and set as featured image
- Input: `{ prompt: string, aspectRatio?: 'square'|'tall'|'wide' }`
- Requires AI image client

### Chat Commands

**/wordpress**: WordPress post management
- `post select`: Open tree selector to choose existing post
- `post info`: Show details about currently selected post
- `post new`: Clear selection for new post creation

## Usage Example

```typescript
import { WordPressService, WordPressCDNService } from '@tokenring-ai/wordpress';

const wpService = new WordPressService({
  url: process.env.WORDPRESS_URL!,
  username: process.env.WORDPRESS_USERNAME!,
  password: process.env.WORDPRESS_PASSWORD!
});

const wpCDN = new WordPressCDNService({
  url: process.env.WORDPRESS_URL!,
  username: process.env.WORDPRESS_USERNAME!,
  password: process.env.WORDPRESS_PASSWORD!
});

agent.addService(wpService);
agent.addService(wpCDN);

// Create a post
const result = await agent.executeTool('wordpress/createPost', {
  title: 'Hello WordPress from Token Ring',
  content: '# Heading\n\nThis was written by an agent.',
  tags: ['tokenring', 'wordpress']
});
```

## Configuration Options

- **url**: WordPress site URL (e.g., https://your-site.com)
- **username**: WordPress username
- **password**: WordPress application password (not regular password)

**Environment Variables:**
- `WORDPRESS_URL`
- `WORDPRESS_USERNAME`
- `WORDPRESS_PASSWORD`

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/blog@0.1.0`: Blog abstraction
- `@tokenring-ai/cdn@0.1.0`: CDN abstraction
- `wordpress-api-client`: WordPress REST API client

## Notes

- Requires WordPress application password (not regular password)
- generateImageForPost requires AI image model configuration
- Posts are created as drafts by default
- Markdown is automatically converted to HTML
- CDN service stores files in WordPress media library
