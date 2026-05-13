# @tokenring-ai/wordpress

WordPress integration for the Token Ring ecosystem, providing blog post management and media handling capabilities through the WordPress REST API.

## Overview

The `@tokenring-ai/wordpress` package provides WordPress integration for Token Ring applications, enabling AI agents to:

- **Blog Management**: Create, update, and manage WordPress blog posts through the REST API
- **Media Handling**: Upload and manage media files through WordPress media library
- **Content Processing**: Convert Markdown to HTML for WordPress compatibility
- **Tag Management**: Automatically create and manage WordPress tags
- **Featured Images**: Set featured images for posts via CDN integration

## Key Features

- Full WordPress REST API integration for posts and media
- Automatic Markdown to HTML conversion using `marked`
- Tag creation and management (auto-creates tags if they don't exist)
- Featured image support via CDN integration
- Type-safe provider configuration with Zod schemas
- Support for all WordPress post statuses (publish, future, draft, pending, private)
- Multi-account support with environment variable configuration

## User Guide

### Chat Commands

This package does not define any chat commands directly. Blog operations are performed through service methods and provider interfaces.

### Tools

This package does not define any tools directly. Blog and CDN operations are accessed through the `BlogService` and `CDNService`.

### Configuration

The WordPress plugin uses a multi-account configuration system that supports both direct configuration and environment variable injection.

#### Plugin Configuration Schema

```typescript
import { z } from "zod";

const WordPressAccountBlogSchema = z.object({
  description: z.string().default("WordPress blog"),
  cdn: z.string(),
});

const WordPressAccountCDNSchema = z.object({});

const WordPressAccountSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
  blog: WordPressAccountBlogSchema,
  cdn: WordPressAccountCDNSchema,
});

const WordPressConfigSchema = z.object({
  accounts: z.record(z.string(), WordPressAccountSchema).default({}),
});
```

#### Configuration Example

```yaml
wordpress:
  accounts:
    main-blog:
      url: "https://example.com"
      username: "admin"
      password: "application_password"
      blog:
        description: "My Main WordPress Blog"
        cdn: "main-blog-cdn"
      cdn: {}
    secondary-blog:
      url: "https://blog.example.com"
      username: "writer"
      password: "another_app_password"
      blog:
        description: "Secondary Blog"
        cdn: "secondary-cdn"
      cdn: {}
```

#### Environment Variables

The plugin supports configuring accounts via environment variables. For each account number (0-9), set the following:

| Variable | Description |
|----------|-------------|
| `WORDPRESS_URL{n}` | WordPress site URL |
| `WORDPRESS_USERNAME{n}` | WordPress username |
| `WORDPRESS_PASSWORD{n}` | WordPress application password |
| `WORDPRESS_NAME{n}` | Account name (defaults to hostname) |
| `WORDPRESS_DESCRIPTION{n}` | Blog description (defaults to "WordPress ({name})") |
| `WORDPRESS_CDN{n}` | CDN name (defaults to account name) |

Example:

```bash
WORDPRESS_URL0=https://example.com
WORDPRESS_USERNAME0=admin
WORDPRESS_PASSWORD0=application_password
WORDPRESS_NAME0=main-blog
WORDPRESS_DESCRIPTION0=My Main Blog
WORDPRESS_CDN0=main-cdn
```

### Integration

#### Plugin Registration

The WordPress plugin automatically registers both blog and CDN providers when configured:

```typescript
import WordPressPlugin from "@tokenring-ai/wordpress/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    wordpress: {
      accounts: {
        "main-blog": {
          url: "https://example.com",
          username: "admin",
          password: "application_password",
          blog: {
            description: "My WordPress Blog",
            cdn: "main-blog-cdn"
          },
          cdn: {}
        }
      }
    }
  }
});
```

#### Service Registration

The plugin registers providers with the following services:

- **BlogService**: Registers `WordPressBlogProvider` as a blog provider
- **CDNService**: Registers `WordPressCDNProvider` as a CDN provider

The plugin uses `waitForItemByType` to ensure services are available before registering providers.

### Best Practices

1. **Use Application Passwords**: Always use WordPress application passwords instead of user passwords for API access
2. **Configure CDN Integration**: Set up WordPress CDN provider for featured image support
3. **Environment Variables**: Store credentials in environment variables, not in code
4. **Tag Names**: Use consistent tag naming conventions for better organization
5. **Markdown Content**: Always provide content in Markdown format; it will be automatically converted to HTML
6. **Featured Images**: Ensure the WordPress CDN provider is configured before setting featured images
7. **Post Status**: Use the correct status values (published, scheduled, draft, pending, private)

## Developer Reference

### Core Components

#### WordPressBlogProvider

The main blog provider implementing the `BlogProvider` interface for WordPress blog management.

**File**: `pkg/wordpress/WordPressBlogProvider.ts`

**Constructor Options:**

```typescript
interface WordPressBlogProviderOptions {
  url: string;           // WordPress site URL
  username: string;      // WordPress username
  password: string;      // WordPress application password
  cdn: string;           // CDN provider name
  description: string;   // Provider description
}
```

**Schema:**

```typescript
const WordPressBlogProviderOptionsSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
  cdn: z.string(),
  description: z.string(),
});
```

**Methods:**

| Method | Description |
|--------|-------------|
| `getAllPosts()` | Retrieve all posts from WordPress (all statuses) |
| `getRecentPosts(filter)` | Retrieve recent posts with filtering |
| `createPost(data)` | Create new blog post from Markdown |
| `updatePost(id, data)` | Update existing post by ID |
| `getPostById(id)` | Get a specific post by ID |

**Method Details:**

- `getAllPosts()`: Returns all posts with statuses: publish, future, draft, pending, private
- `getRecentPosts(filter)`:
  - `filter.status?: BlogPostStatus` - Filter by status
  - `filter.keyword?: string` - Search keyword
  - `filter.limit?: number` - Maximum number of posts
- `createPost(data)`:
  - `data.title: string` - Post title
  - `data.html: string` - Post content in HTML (Markdown converted automatically)
  - `data.tags?: string[]` - Array of tag names (auto-created if not exist)
  - `data.feature_image?: { id: string }` - Featured image attachment ID
- `updatePost(id, data)`:
  - `id: string` - Post ID
  - `data.title?: string` - Updated title
  - `data.html?: string` - Updated content
  - `data.tags?: string[]` - Updated tags
  - `data.feature_image?: { id: string }` - Updated featured image
  - `data.status?: BlogPostStatus` - New status
- `getPostById(id)`: Retrieves full post content by ID

**Properties:**

- `description: string` - Provider description
- `cdnName: string` - CDN provider name

**Status Mapping:**

WordPress status values are automatically mapped to BlogPost status values:

| WordPress | BlogPost   |
|-----------|------------|
| publish   | published  |
| future    | scheduled  |
| draft     | draft      |
| pending   | pending    |
| private   | private    |

**Error Handling:**

- `createPost`: Throws error if feature_image.id is missing
- `updatePost`: Throws error if feature_image.id is missing when updating featured image
- `getPostById`: Throws error if post not found ("Post with ID {id} not found")
- Tag creation failures are silently caught and ignored

#### WordPressCDNProvider

CDN provider for media file management, implementing the `CDNProvider` interface.

**File**: `pkg/wordpress/WordPressCDNProvider.ts`

**Constructor Options:**

```typescript
interface WordPressCDNProviderOptions {
  url: string;      // WordPress site URL
  username: string; // WordPress username
  password: string; // WordPress application password
}
```

**Schema:**

```typescript
const WordPressCDNProviderOptionsSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
});
```

**Methods:**

| Method | Description |
|--------|-------------|
| `upload(data, options)` | Upload media files to WordPress media library |

**Method Details:**

- `upload(data, options)`:
  - `data: Buffer` - Image data to upload
  - `options.filename?: string` - Optional filename override (defaults to UUID.jpg)
  - Returns: `{ url: string, id: string }`

**Properties:**

- `name: string = "WordPressCDN"` - Provider name
- `description: string = "CDN backed by a WordPress media library"` - Provider description

### Services

#### BlogService Integration

The WordPress plugin registers `WordPressBlogProvider` instances with the `BlogService` from `@tokenring-ai/blog`.

**Registration Pattern:**

```typescript
app.services.waitForItemByType(BlogService, blogService => {
  blogService.registerBlog(
    name,
    new WordPressBlogProvider({
      url: account.url,
      username: account.username,
      password: account.password,
      description: account.blog.description,
      cdn: account.blog.cdn ?? name,
    }),
  );
});
```

#### CDNService Integration

The WordPress plugin registers `WordPressCDNProvider` instances with the `CDNService` from `@tokenring-ai/cdn`.

**Registration Pattern:**

```typescript
app.services.waitForItemByType(CDNService, cdnService => {
  cdnService.registerProvider(
    name,
    new WordPressCDNProvider({
      url: account.url,
      username: account.username,
      password: account.password,
    }),
  );
});
```

### Provider Registration

The plugin provides a convenient way to register WordPress providers through the Token Ring application configuration.

**WordPressBlogProvider Registration:**

```typescript
import WordPressPlugin from "@tokenring-ai/wordpress/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    wordpress: {
      accounts: {
        "my-blog": {
          url: "https://your-site.com",
          username: "admin",
          password: "app_password",
          blog: {
            description: "Main WordPress blog",
            cdn: "my-blog"
          },
          cdn: {}
        }
      }
    }
  }
});
```

**WordPressCDNProvider Registration:**

```typescript
import WordPressPlugin from "@tokenring-ai/wordpress/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    wordpress: {
      accounts: {
        "my-blog": {
          url: "https://your-site.com",
          username: "admin",
          password: "app_password",
          blog: {
            description: "Main WordPress blog",
            cdn: "my-blog"
          },
          cdn: {}
        }
      }
    }
  }
});
```

### RPC Endpoints

This package does not define any RPC endpoints directly. It uses the WordPress REST API endpoints through the `wordpress-api-client` library.

#### WordPress REST API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp/v2/posts` | GET | List posts |
| `/wp/v2/posts` | POST | Create post |
| `/wp/v2/posts/{id}` | GET | Get post by ID |
| `/wp/v2/posts/{id}` | POST | Update post |
| `/wp/v2/media` | POST | Upload media |
| `/wp/v2/tags` | GET | List tags |
| `/wp/v2/tags` | POST | Create tag |

### Usage Examples

#### Basic Setup with Plugin

```typescript
import WordPressPlugin from '@tokenring-ai/wordpress/plugin';
import { TokenRingApp } from '@tokenring-ai/app';
import { BlogService } from '@tokenring-ai/blog';
import { CDNService } from '@tokenring-ai/cdn';

// Initialize app with WordPress plugin
const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    wordpress: {
      accounts: {
        "main-blog": {
          url: process.env.WORDPRESS_URL!,
          username: process.env.WORDPRESS_USERNAME!,
          password: process.env.WORDPRESS_PASSWORD!,
          blog: {
            description: "My WordPress Blog",
            cdn: "main-blog"
          },
          cdn: {}
        }
      }
    }
  }
});

// Get the blog service
const blogService = app.services.getItemByType(BlogService);
const wpProvider = blogService.getBlog("main-blog");

// Get the CDN service
const cdnService = app.services.getItemByType(CDNService);
const wpCDN = cdnService.getProvider("main-blog");
```

#### Create a Post

```typescript
// Create a new post
const result = await wpProvider.createPost({
  title: 'Hello WordPress from Token Ring',
  html: '# Hello World\n\nThis is a test post created by an agent.',
  tags: ['tokenring', 'wordpress', 'test']
});

// Result is a BlogPost object with id, title, status, etc.
```

#### Upload Media

```typescript
// Upload an image to WordPress media library
const uploadResult = await wpCDN.upload(imageBuffer, {
  filename: 'featured-image.jpg'
});

// Result: { url: "https://site.com/wp-content/uploads/image.jpg", id: "123" }

// Use the image as a featured image
await wpProvider.createPost({
  title: 'Post with Featured Image',
  html: '# Hello World\n\nThis post has a featured image.',
  feature_image: { id: uploadResult.id }
});
```

#### Update Post

```typescript
// Update a post by ID
await wpProvider.updatePost("123", {
  title: 'Updated Title',
  html: 'Updated content',
  status: 'published'
});
```

#### Get Recent Posts with Filtering

```typescript
// Retrieve recent posts with filtering
const recentPosts = await wpProvider.getRecentPosts({
  status: 'published',
  keyword: 'technology',
  limit: 10
});
```

#### Get All Posts

```typescript
// Retrieve all posts (all statuses)
const allPosts = await wpProvider.getAllPosts();

// Posts include status: published, scheduled, draft, pending, private
```

#### Direct Provider Instantiation

```typescript
import WordPressBlogProvider from "@tokenring-ai/wordpress/WordPressBlogProvider";
import WordPressCDNProvider from "@tokenring-ai/wordpress/WordPressCDNProvider";

// Blog provider
const blogProvider = new WordPressBlogProvider({
  url: "https://your-site.com",
  username: "admin",
  password: "app_password",
  cdn: "wordpress",
  description: "Main WordPress blog"
});

// CDN provider
const cdnProvider = new WordPressCDNProvider({
  url: "https://your-site.com",
  username: "admin",
  password: "app_password"
});
```

### Error Handling

Common error scenarios and their handling:

#### Create/Update Post Errors

- **"Wordpress feature image must be an attachment id - is wordpress not set as the CDN?"**
  - Cause: Feature image provided without a valid CDN provider or missing id
  - Solution: Ensure WordPress CDN provider is configured and upload image first

#### Get Post Errors

- **"Post with ID {id} not found"**
  - Cause: Attempting to get a non-existent post
  - Solution: Verify the post ID exists using `getAllPosts()` or `getRecentPosts()`

#### General Errors

- **Missing credentials**: Ensure WordPress application password is set
- **Tag creation failure**: Check WordPress permissions for tag management (errors are silently caught)
- **Post not found**: Verify post ID is correct and post exists
- **Feature image without CDN**: Feature images require a configured CDN provider

**Example Error Handling:**

```typescript
try {
  const result = await wpProvider.createPost({
    title: 'New Post',
    html: 'Content here',
    tags: ['test']
  });
} catch (error) {
  console.error('Failed to create post:', error.message);
}
```

### Testing and Development

#### Building

```bash
bun run build
```

#### Testing

```bash
bun run test
bun run test:watch
bun run test:coverage
```

#### Test Configuration

The package uses vitest for testing with the following configuration:

```typescript
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

#### Package Structure

```text
pkg/wordpress/
├── index.ts                       # Main exports
├── plugin.ts                      # Plugin integration and auto-registration
├── WordPressBlogProvider.ts       # Core blog management implementation
├── WordPressCDNProvider.ts        # Media/CDN provider implementation
├── schema.ts                      # Zod schemas for configuration
├── package.json                   # Package metadata and dependencies
├── README.md                      # Package README
├── vitest.config.ts               # Test configuration
└── LICENSE                        # MIT License
```

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Core application framework |
| `@tokenring-ai/blog` | 0.2.0 | Blog abstraction layer |
| `@tokenring-ai/cdn` | 0.2.0 | CDN abstraction layer |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions |
| `wordpress-api-client` | ^0.4.9 | WordPress REST API client |
| `marked` | ^17.0.6 | Markdown to HTML converter |
| `uuid` | ^13.0.0 | UUID generation |
| `zod` | ^4.3.6 | Schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

## Related Components

- `@tokenring-ai/blog` - Blog service interface and types
- `@tokenring-ai/cdn` - CDN service and provider interfaces
- `@tokenring-ai/app` - Application framework
- `wordpress-api-client` - WordPress REST API client library

## License

MIT License - see `LICENSE` file for details.
