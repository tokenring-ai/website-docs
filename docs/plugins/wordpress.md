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
- **Post Status Management**: Support for publish, future, draft, pending, and private statuses
- **Current Post Tracking**: Maintain selected post context across agent sessions

## Core Components

### WordPressBlogProvider

The main blog provider that implements the `BlogProvider` interface.

**Constructor Options:**
```typescript
&#123;
  url: string,
  username: string,
  password: string,
  imageGenerationModel: string,
  cdn: string,
  description: string
&#125;
```

**Key Methods:**
- `getAllPosts(): Promise&lt;BlogPost[]&gt;` - Get all posts with statuses (publish, future, draft, pending, private)
- `getCurrentPost(agent: Agent): BlogPost | null` - Get currently selected post
- `createPost(data: CreatePostData, agent: Agent): Promise&lt;BlogPost&gt;` - Create new draft post
- `updatePost(data: UpdatePostData, agent: Agent): Promise&lt;BlogPost&gt;` - Update selected post
- `selectPostById(id: string, agent: Agent): Promise&lt;BlogPost&gt;` - Select post by ID
- `clearCurrentPost(agent: Agent): Promise&lt;void&gt;` - Clear current post selection

### WordPressCDNProvider

CDN provider that uses WordPress media library for file storage.

**Constructor Options:**
```typescript
&#123;
  url: string,
  username: string,
  password: string
&#125;
```

**Key Methods:**
- `upload(data: Buffer, options?: UploadOptions): Promise&lt;UploadResult&gt;` - Upload file to WordPress media library
- `name: string = "WordPressCDN"` - Provider name
- `description: string = "CDN backed by a WordPress media library"` - Provider description

### WordPressBlogState

State management for tracking the currently selected post.

**Properties:**
- `currentPost: WPPost | null` - Currently selected WordPress post

**Methods:**
- `reset(what: ResetWhat[]): void` - Reset state based on reset type
- `serialize(): object` - Serialize state for persistence
- `deserialize(data: any): void` - Deserialize state from persistence
- `show(): string[]` - Show current state information

### Data Models

#### BlogPost
```typescript
interface BlogPost &#123;
  id: string;
  title: string;
  content: string;
  status: "published" | "scheduled" | "draft" | "pending" | "private";
  created_at: Date;
  updated_at: Date;
  published_at: Date;
&#125;
```

#### CreatePostData
```typescript
interface CreatePostData &#123;
  title: string;
  content?: string;
  tags?: string[];
  feature_image?: &#123; id: string &#125;;
&#125;
```

#### UpdatePostData
```typescript
interface UpdatePostData &#123;
  title?: string;
  content?: string;
  tags?: string[];
  feature_image?: &#123; id: string &#125;;
  status?: "published" | "scheduled" | "draft" | "pending" | "private";
&#125;
```

### Tools

**wordpress/createPost**: Create a new WordPress post from Markdown
- Input: `&#123; title: string, content: string, tags?: string[], feature_image?: &#123; id: string &#125; &#125;`
- Converts Markdown to HTML and creates draft post

**wordpress/getCurrentPost**: Return details of currently selected post

**wordpress/updatePost**: Update selected post
- Input: `&#123; title?: string, content?: string, tags?: string[], feature_image?: &#123; id: string &#125;, status?: 'published'|'scheduled'|'draft'|'pending'|'private' &#125;`

**wordpress/selectPostById**: Select post by ID
- Input: `&#123; id: string &#125;`

**wordpress/clearCurrentPost**: Clear current post selection

**wordpress/generateImageForPost**: Generate AI image and set as featured image
- Input: `&#123; prompt: string, aspectRatio?: 'square'|'tall'|'wide' &#125;`

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
import &#123; WordPressBlogProvider, WordPressCDNProvider &#125; from '@tokenring-ai/wordpress';
import &#123; BlogService, CDNService &#125; from '@tokenring-ai/blog';
import &#123; CDNService &#125; from '@tokenring-ai/cdn';

// Initialize WordPress blog provider
const wpBlogProvider = new WordPressBlogProvider(&#123;
  url: process.env.WORDPRESS_URL!,
  username: process.env.WORDPRESS_USERNAME!,
  password: process.env.WORDPRESS_PASSWORD!,
  imageGenerationModel: process.env.AI_IMAGE_MODEL!,
  cdn: 'wordpress',
  description: 'WordPress Blog'
&#125;);

// Initialize WordPress CDN provider
const wpCDNProvider = new WordPressCDNProvider(&#123;
  url: process.env.WORDPRESS_URL!,
  username: process.env.WORDPRESS_USERNAME!,
  password: process.env.WORDPRESS_PASSWORD!
&#125;);

// Register with services
app.services.waitForItemByType(BlogService, blogService =&gt; &#123;
  blogService.registerBlog('wordpress', wpBlogProvider);
&#125;);

app.services.waitForItemByType(CDNService, cdnService =&gt; &#123;
  cdnService.registerProvider('wordpress', wpCDNProvider);
&#125;);

// Create a post
const result = await agent.executeTool('wordpress/createPost', &#123;
  title: 'Hello WordPress from Token Ring',
  content: '# Hello World\n\nThis is a test post created by an agent.',
  tags: ['tokenring', 'wordpress', 'test']
&#125;);

// Generate featured image
await agent.executeTool('wordpress/generateImageForPost', &#123;
  prompt: 'A beautiful landscape image for a blog post'
&#125;);
```

## Configuration Options

### Blog Provider Configuration

```json
&#123;
  "blog": &#123;
    "providers": &#123;
      "wordpress": &#123;
        "type": "wordpress",
        "url": "https://your-site.com",
        "username": "your-username",
        "password": "your-app-password",
        "imageGenerationModel": "dall-e-3",
        "cdn": "wordpress",
        "description": "WordPress Blog"
      &#125;
    &#125;
  &#125;
&#125;
```

### CDN Provider Configuration

```json
&#123;
  "cdn": &#123;
    "providers": &#123;
      "wordpress": &#123;
        "type": "wordpress",
        "url": "https://your-site.com",
        "username": "your-username",
        "password": "your-app-password"
      &#125;
    &#125;
  &#125;
&#125;
```

**Environment Variables:**
- `WORDPRESS_URL` - WordPress site URL
- `WORDPRESS_USERNAME` - WordPress username
- `WORDPRESS_PASSWORD` - WordPress application password (not regular password)
- `AI_IMAGE_MODEL` - AI image generation model name

### Runtime Dependencies

- `@tokenring-ai/app`: Core application framework
- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/blog`: Blog abstraction layer
- `@tokenring-ai/cdn`: CDN abstraction layer
- `wordpress-api-client@0.4.9`: WordPress REST API client
- `marked@17.0.1`: Markdown to HTML converter
- `zod`: Schema validation
- `uuid`: UUID generation

### Development Dependencies

- `vitest`: Testing framework
- `@vitest/coverage-v8`: Coverage reporting

## WordPress REST API Integration

The package integrates with WordPress REST API endpoints:

### Posts API
- `GET /wp/v2/posts` - List posts
- `POST /wp/v2/posts` - Create post
- `GET /wp/v2/posts/&#123;id&#125;` - Get post
- `POST /wp/v2/posts/&#123;id&#125;` - Update post
- `DELETE /wp/v2/posts/&#123;id&#125;` - Delete post

### Media API
- `GET /wp/v2/media` - List media
- `POST /wp/v2/media` - Upload media
- `GET /wp/v2/media/&#123;id&#125;` - Get media item
- `POST /wp/v2/media/&#123;id&#125;` - Update media
- `DELETE /wp/v2/media/&#123;id&#125;` - Delete media

### Tags API
- `GET /wp/v2/tags` - List tags
- `POST /wp/v2/tags` - Create tag

## Status Mapping

WordPress status → Blog status:
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
- **Post not found**: Verify post ID is correct and post exists

## Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Plugin Integration

The package automatically integrates with Token Ring applications through the plugin system. No additional setup is required for standard usage.

## License

MIT License - see repository LICENSE file for details.