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
- **Post Status Management**: Support for publish, future, draft, pending, and private statuses
- **Current Post Tracking**: Maintain selected post context across agent sessions

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
- `getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>` - Get recent posts with filtering
- `getCurrentPost(agent: Agent): BlogPost | null` - Get currently selected post
- `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>` - Create new draft post
- `updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>` - Update selected post
- `selectPostById(id: string, agent: Agent): Promise<BlogPost>` - Select post by ID
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
  - `options.filename?: string` - Optional filename override
- Returns: `{ url: string, id: string }`
- `name: string = "WordPressCDN"` - Provider name
- `description: string = "CDN backed by a WordPress media library"` - Provider description

### WordPressBlogState

State management for tracking the currently selected post.

**Properties:**

- `currentPost: WPPost | null` - Currently selected WordPress post

**Methods:**

- `reset(what: ResetWhat[]): void` - Reset state based on reset type (clears on 'chat' reset)
- `serialize(): object` - Serialize state for persistence
- `deserialize(data: any): void` - Deserialize state from persistence
- `show(): string[]` - Show current state information

### Data Models

#### BlogPost

```typescript
interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: "published" | "scheduled" | "draft" | "pending" | "private";
  created_at: Date;
  updated_at: Date;
  published_at: Date;
}
```

#### CreatePostData

```typescript
interface CreatePostData {
  title: string;
  content?: string;
  tags?: string[];
  feature_image?: { id: string };
}
```

#### UpdatePostData

```typescript
interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: string[];
  feature_image?: { id: string };
  status?: "published" | "scheduled" | "draft" | "pending" | "private";
}
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

### Runtime Dependencies

- `@tokenring-ai/app`: Core application framework
- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/blog`: Blog abstraction layer
- `@tokenring-ai/cdn`: CDN abstraction layer
- `wordpress-api-client@^0.4.9`: WordPress REST API client
- `marked@^17.0.3`: Markdown to HTML converter
- `uuid@^13.0.0`: UUID generation
- `zod@^4.3.6`: Schema validation

### Development Dependencies

- `vitest@^4.0.18`: Testing framework
- `@vitest/coverage-v8@^4.0.18`: Coverage reporting
- `typescript@^5.9.3`: TypeScript compiler

## Usage Example

### Basic Setup with Plugin

The WordPress plugin automatically integrates with Token Ring applications through the plugin system. When installed via the plugin system, no manual service registration is required.

```typescript
import { WordPressPlugin } from '@tokenring-ai/wordpress';
import { TokenRingApp } from '@tokenring-ai/app';

// Initialize app with WordPress plugin
const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    blog: {
      providers: {
        wordpress: {
          type: 'wordpress',
          url: process.env.WORDPRESS_URL!,
          username: process.env.WORDPRESS_USERNAME!,
          password: process.env.WORDPRESS_PASSWORD!,
          imageGenerationModel: 'dall-e-3',
          cdn: 'wordpress',
          description: 'WordPress Blog'
        }
      }
    },
    cdn: {
      providers: {
        wordpress: {
          type: 'wordpress',
          url: process.env.WORDPRESS_URL!,
          username: process.env.WORDPRESS_USERNAME!,
          password: process.env.WORDPRESS_PASSWORD!
        }
      }
    }
  }
});

// Get the blog provider
const blogService = app.services.getItemByType(BlogService);
const wpProvider = blogService.getProvider('wordpress');

// Get the CDN provider
const cdnService = app.services.getItemByType(CDNService);
const wpCDN = cdnService.getProvider('wordpress');
```

### Create a Post

```typescript
// Initialize state for the agent
wpProvider.attach(agent);

// Create a new post
const result = await wpProvider.createPost({
  title: 'Hello WordPress from Token Ring',
  content: '# Hello World\n\nThis is a test post created by an agent.',
  tags: ['tokenring', 'wordpress', 'test']
}, agent);

// The post is automatically set as current post
const currentPost = wpProvider.getCurrentPost(agent);
```

### Upload Media

```typescript
// Upload an image to WordPress media library
const uploadResult = await wpCDN.upload(imageBuffer, {
  filename: 'featured-image.jpg'
});

// Result: { url: "https://site.com/wp-content/uploads/image.jpg", id: "123" }

// Use the image as a featured image
await wpProvider.createPost({
  title: 'Post with Featured Image',
  content: '# Hello World\n\nThis post has a featured image.',
  feature_image: { id: uploadResult.id }
}, agent);
```

### Update Post

```typescript
// Select a post by ID
const post = await wpProvider.selectPostById("123", agent);

// Update the post
await wpProvider.updatePost({
  title: 'Updated Title',
  content: 'Updated content',
  status: 'published'
}, agent);

// Clear current post selection when done
await wpProvider.clearCurrentPost(agent);
```

### Select Post

```typescript
// Select an existing post by ID
const selectedPost = await wpProvider.selectPostById("456", agent);

// View current post
const currentPost = wpProvider.getCurrentPost(agent);

// Clear current post selection
await wpProvider.clearCurrentPost(agent);
```

### Get All Posts

```typescript
// Retrieve all posts
const allPosts = await wpProvider.getAllPosts();

// Posts include status: published, scheduled, draft, pending, private
```

### Get Recent Posts with Filtering

```typescript
// Retrieve recent posts with filtering
const recentPosts = await wpProvider.getRecentPosts({
  status: 'published',
  keyword: 'technology',
  limit: 10
}, agent);
```

## Plugin Integration

### Auto-Registration Features

- **Blog Service Integration**: Registers WordPress blog providers automatically
- **CDN Service Integration**: Registers WordPress CDN providers automatically
- **Configuration-Based Setup**: Reads configuration from app config slices
- **Service Dependencies**: Handles service lifecycle and dependencies

### Configuration Schema

The plugin uses the following configuration schema:

```typescript
const packageConfigSchema = z.object({
  cdn: CDNConfigSchema.optional(),
  blog: BlogConfigSchema.optional(),
});
```

## WordPress REST API Integration

The package integrates with WordPress REST API endpoints:

### Posts API
- `GET /wp/v2/posts` - List posts
- `POST /wp/v2/posts` - Create post
- `GET /wp/v2/posts/{id}` - Get post
- `POST /wp/v2/posts/{id}` - Update post
- `DELETE /wp/v2/posts/{id}` - Delete post

### Media API
- `GET /wp/v2/media` - List media
- `POST /wp/v2/media` - Upload media
- `GET /wp/v2/media/{id}` - Get media item
- `POST /wp/v2/media/{id}` - Update media
- `DELETE /wp/v2/media/{id}` - Delete media

### Tags API
- `GET /wp/v2/tags` - List tags
- `POST /wp/v2/tags` - Create tag

## Status Mapping

WordPress status → Blog status:

| WordPress | BlogPost |
|-----------|----------|
| publish   | published |
| future    | scheduled |
| draft     | draft     |
| pending   | pending   |
| private   | private   |

## Error Handling

Common error scenarios:

- **Missing credentials**: Ensure WordPress application password is set
- **Post already selected**: Clear current selection before creating new post
- **No post selected**: Select a post before attempting updates
- **Invalid media ID**: Ensure CDN is properly configured for WordPress
- **Tag creation failure**: Check WordPress permissions for tag management
- **Post not found**: Verify post ID is correct and post exists

## State Management

The package maintains agent state for tracking the currently selected post:

- **State Slice**: `WordPressBlogState`
- **Persistence**: State persists within agent sessions
- **Reset Behavior**: State is cleared when chat context is reset
- **Checkpoint Support**: Full state serialization for agent checkpoints

## Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
bun run test:coverage
```

### Package Structure

```
pkg/wordpress/
├── index.ts                     # Main exports
├── plugin.ts                    # Plugin integration and auto-registration
├── WordPressBlogProvider.ts     # Core blog management implementation
├── WordPressCDNProvider.ts      # Media/CDN provider implementation
├── state/
│   └── WordPressBlogState.ts    # Agent state management for current post
├── design/
│   ├── posts.md                 # WordPress Posts API reference and schema
│   ├── media.md                 # WordPress Media API reference and schema
│   └── typescript-api.md        # TypeScript client API documentation
└── README.md                    # This file
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
