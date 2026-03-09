# WordPress Plugin

WordPress integration for creating and managing blog posts via REST API, with support for CDN functionality using WordPress media library.

## Overview

The `@tokenring-ai/wordpress` package provides comprehensive WordPress integration for the Token Ring ecosystem. It enables AI agents to browse, create, manage, and publish WordPress blog posts through the WordPress REST API, with built-in CDN functionality for media management.

## Key Features

- **Blog Management**: Create, update, and publish WordPress posts
- **CDN Integration**: Use WordPress media library as CDN for file uploads
- **Markdown Support**: Convert Markdown to HTML automatically using `marked`
- **Tag Management**: Create and manage post tags dynamically
- **State Preservation**: Maintain current post context across interactions
- **Media Handling**: Upload images to WordPress media library
- **Post Status Management**: Support for publish, future, draft, pending, and private statuses
- **Current Post Tracking**: Maintain selected post context across agent sessions
- **Type-Safe Configuration**: Zod schemas for validation
- **Agent Integration**: Automatic state initialization and management

## Core Components

### WordPressBlogProvider

The main blog provider that implements the `BlogProvider` interface from `@tokenring-ai/blog`.

**Constructor Options:**

```typescript
interface WordPressBlogProviderOptions {
  url: string;                    // WordPress site URL
  username: string;               // WordPress username
  password: string;               // WordPress application password
  imageGenerationModel: string;   // AI image generation model name
  cdn: string;                    // CDN provider name for media uploads
  description: string;            // Provider description
}
```

**Schema:**

```typescript
const WordPressBlogProviderOptionsSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
  imageGenerationModel: z.string(),
  cdn: z.string(),
  description: z.string(),
});
```

**Key Methods:**

- `attach(agent: Agent): void` - Initialize the blog state for an agent
- `getAllPosts(): Promise<BlogPost[]>` - Get all posts with statuses (publish, future, draft, pending, private)
- `getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>` - Get recent posts with filtering
  - `filter.status?: BlogPostStatus` - Filter by status
  - `filter.keyword?: string` - Search keyword
  - `filter.limit?: number` - Maximum number of posts
- `getCurrentPost(agent: Agent): BlogPost | null` - Get currently selected post
- `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>` - Create new draft post
  - `data.title: string` - Post title
  - `data.content?: string` - Post content in Markdown
  - `data.tags?: string[]` - Array of tag names
  - `data.feature_image?: { id: string }` - Featured image attachment ID
- `updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>` - Update selected post
  - `data.title?: string` - Updated title
  - `data.content?: string` - Updated content in Markdown
  - `data.tags?: string[]` - Updated tags
  - `data.feature_image?: { id: string }` - Updated featured image
  - `data.status?: BlogPostStatus` - New status
- `selectPostById(id: string, agent: Agent): Promise<BlogPost>` - Select post by ID
- `clearCurrentPost(agent: Agent): Promise<void>` - Clear current post selection
- `getOrCreateTagIds(tagNames: string[]): Promise<number[]>` - Internal method to get existing tags or create new ones

**Status Mapping:**

WordPress status → Blog status:

| WordPress | BlogPost   |
|-----------|------------|
| publish   | published  |
| future    | scheduled  |
| draft     | draft      |
| pending   | pending    |
| private   | private    |

**Properties:**

- `description: string` - Provider description
- `cdnName: string` - Name of the configured CDN provider
- `imageGenerationModel: string` - AI image generation model name

### WordPressCDNProvider

CDN provider that uses WordPress media library for file storage, extending `CDNProvider` from `@tokenring-ai/cdn`.

**Constructor Options:**

```typescript
interface WordPressCDNProviderOptions {
  url: string;
  username: string;
  password: string;
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

**Key Methods:**

- `upload(data: Buffer, options?: UploadOptions): Promise<UploadResult>` - Upload file to WordPress media library
  - `options.filename?: string` - Optional filename override (defaults to UUID.jpg)
  - Returns: `{ url: string, id: string }`

**Properties:**

- `name: string = "WordPressCDN"` - Provider name
- `description: string = "CDN backed by a WordPress media library"` - Provider description

### WordPressBlogState

State management for tracking the currently selected post. Implements `AgentStateSlice` interface.

**Properties:**

- `currentPost: WPPost | null` - Currently selected WordPress post

**Methods:**

- `reset(what: ResetWhat[]): void` - Reset state based on reset type (clears on 'chat' reset)
- `serialize(): object` - Serialize state for persistence
- `deserialize(data: any): void` - Deserialize state from persistence
- `show(): string[]` - Show current state information

**Schema:**

```typescript
const serializationSchema = z.object({
  currentPost: z.any().nullable()
});
```

## Services

### BlogService Integration

The WordPress plugin registers `WordPressBlogProvider` instances with the `BlogService` from `@tokenring-ai/blog`. The provider implements the following interface methods:

- `getAllPosts()` - Retrieve all WordPress posts
- `getRecentPosts(filter, agent)` - Retrieve filtered recent posts
- `getCurrentPost(agent)` - Get the currently selected post
- `createPost(data, agent)` - Create a new blog post
- `updatePost(data, agent)` - Update an existing blog post
- `selectPostById(id, agent)` - Select a post by ID
- `clearCurrentPost(agent)` - Clear the current post selection

### CDNService Integration

The WordPress plugin registers `WordPressCDNProvider` instances with the `CDNService` from `@tokenring-ai/cdn`. The provider implements:

- `upload(data, options)` - Upload media files to WordPress media library

## Provider Documentation

### WordPressBlogProvider

**Provider Type**: `"wordpress"`

**Interface**: `BlogProvider` from `@tokenring-ai/blog`

**Authentication**: Basic authentication using WordPress username and application password

**Content Format**: 
- Input: Markdown
- Output: HTML (converted via `marked` library)

**Features**:
- Automatic tag creation if tags don't exist
- Full WordPress post status support
- Featured image support via CDN integration
- State management integration with agents

**Configuration Schema**:

```typescript
const WordPressBlogProviderOptionsSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
  imageGenerationModel: z.string(),
  cdn: z.string(),
  description: z.string(),
});
```

**Provider Registration Patterns**:

**Plugin-based registration:**

```typescript
import WordPressPlugin from "@tokenring-ai/wordpress/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    blog: {
      providers: {
        wordpress: {
          type: "wordpress",
          url: "https://your-site.com",
          username: "admin",
          password: "app_password",
          imageGenerationModel: "dall-e-3",
          cdn: "wordpress",
          description: "Main WordPress blog"
        }
      }
    }
  }
});
```

**Direct instantiation:**

```typescript
import WordPressBlogProvider from "@tokenring-ai/wordpress/WordPressBlogProvider";

const provider = new WordPressBlogProvider({
  url: "https://your-site.com",
  username: "admin",
  password: "app_password",
  imageGenerationModel: "dall-e-3",
  cdn: "wordpress",
  description: "Main WordPress blog"
});

// Attach to agent
provider.attach(agent);
```

### WordPressCDNProvider

**Provider Type**: `"wordpress"`

**Interface**: Extends `CDNProvider` from `@tokenring-ai/cdn`

**Authentication**: Basic authentication using WordPress username and application password

**File Format**: Defaults to `.jpg` if no extension provided

**ID Format**: Returns WordPress media ID as string

**URL Format**: Returns WordPress media source URL

**Configuration Schema**:

```typescript
const WordPressCDNProviderOptionsSchema = z.object({
  url: z.string(),
  username: z.string(),
  password: z.string(),
});
```

**Provider Registration Patterns**:

**Plugin-based registration:**

```typescript
import WordPressPlugin from "@tokenring-ai/wordpress/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    cdn: {
      providers: {
        wordpress: {
          type: "wordpress",
          url: "https://your-site.com",
          username: "admin",
          password: "app_password"
        }
      }
    }
  }
});
```

**Direct instantiation:**

```typescript
import WordPressCDNProvider from "@tokenring-ai/wordpress/WordPressCDNProvider";

const provider = new WordPressCDNProvider({
  url: "https://your-site.com",
  username: "admin",
  password: "app_password"
});
```

## RPC Endpoints

This package does not define any RPC endpoints directly. It uses the WordPress REST API endpoints through the `wordpress-api-client` library.

### WordPress REST API Endpoints Used

| Endpoint                      | Method | Description                    |
|-------------------------------|--------|--------------------------------|
| `/wp/v2/posts`                | GET    | List posts                     |
| `/wp/v2/posts`                | POST   | Create post                    |
| `/wp/v2/posts/{id}`           | GET    | Get post                       |
| `/wp/v2/posts/{id}`           | POST   | Update post                    |
| `/wp/v2/posts/{id}`           | DELETE | Delete post                    |
| `/wp/v2/media`                | GET    | List media                     |
| `/wp/v2/media`                | POST   | Upload media                   |
| `/wp/v2/media/{id}`           | GET    | Get media item                 |
| `/wp/v2/media/{id}`           | POST   | Update media                   |
| `/wp/v2/media/{id}`           | DELETE | Delete media                   |
| `/wp/v2/tags`                 | GET    | List tags                      |
| `/wp/v2/tags`                 | POST   | Create tag                     |

## Chat Commands

This package does not define any chat commands directly. Blog operations are performed through service methods and provider interfaces.

## Configuration

The WordPress plugin integrates with the Token Ring application configuration system.

### Plugin Configuration Schema

```typescript
import { z } from "zod";
import { CDNConfigSchema } from "@tokenring-ai/cdn";
import { BlogConfigSchema } from "@tokenring-ai/blog";

const packageConfigSchema = z.object({
  cdn: CDNConfigSchema.optional(),
  blog: BlogConfigSchema.optional(),
});
```

### Example Configuration

```typescript
{
  cdn: {
    providers: {
      wordpress: {
        type: "wordpress",
        url: process.env.WORDPRESS_URL,
        username: process.env.WORDPRESS_USERNAME,
        password: process.env.WORDPRESS_PASSWORD
      }
    }
  },
  blog: {
    providers: {
      wordpress: {
        type: "wordpress",
        url: process.env.WORDPRESS_URL,
        username: process.env.WORDPRESS_USERNAME,
        password: process.env.WORDPRESS_PASSWORD,
        imageGenerationModel: "dall-e-3",
        cdn: "wordpress",
        description: "Main WordPress blog"
      }
    }
  }
}
```

### Environment Variables

- `WORDPRESS_URL` - WordPress site URL
- `WORDPRESS_USERNAME` - WordPress username
- `WORDPRESS_PASSWORD` - WordPress application password (not regular password)
- `AI_IMAGE_MODEL` - AI image generation model name

## Integration

### Plugin Registration

The WordPress plugin automatically registers both blog and CDN providers when configured:

```typescript
import WordPressPlugin from "@tokenring-ai/wordpress/plugin";
import { TokenRingApp } from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [WordPressPlugin],
  config: {
    // Configuration as shown above
  }
});
```

### Service Registration

The plugin registers providers with the following services:

- **BlogService**: Registers `WordPressBlogProvider` as a blog provider
- **CDNService**: Registers `WordPressCDNProvider` as a CDN provider

### Agent Integration

The `WordPressBlogProvider.attach()` method initializes state management for agents:

```typescript
// Provider automatically attaches to agents when used
provider.attach(agent);
// Initializes WordPressBlogState for the agent
```

### Auto-Registration Features

- **Blog Service Integration**: Registers WordPress blog providers automatically
- **CDN Service Integration**: Registers WordPress CDN providers automatically
- **Configuration-Based Setup**: Reads configuration from app config slices
- **Service Dependencies**: Handles service lifecycle and dependencies

## Usage Examples

### Basic Setup with Plugin

```typescript
import { WordPressPlugin } from '@tokenring-ai/wordpress';
import { TokenRingApp } from '@tokenring-ai/app';
import { BlogService } from '@tokenring-ai/blog';
import { CDNService } from '@tokenring-ai/cdn';

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

### Get Recent Posts with Filtering

```typescript
// Retrieve recent posts with filtering
const recentPosts = await wpProvider.getRecentPosts({
  status: 'published',
  keyword: 'technology',
  limit: 10
}, agent);
```

### Get All Posts

```typescript
// Retrieve all posts
const allPosts = await wpProvider.getAllPosts();

// Posts include status: published, scheduled, draft, pending, private
```

### Direct Provider Instantiation

```typescript
import WordPressBlogProvider from "@tokenring-ai/wordpress/WordPressBlogProvider";
import WordPressCDNProvider from "@tokenring-ai/wordpress/WordPressCDNProvider";

// Blog provider
const blogProvider = new WordPressBlogProvider({
  url: "https://your-site.com",
  username: "admin",
  password: "app_password",
  imageGenerationModel: "dall-e-3",
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

## Best Practices

1. **Use Application Passwords**: Always use WordPress application passwords instead of user passwords for API access
2. **Configure CDN Integration**: Set up WordPress CDN provider for featured image support
3. **Handle State Management**: Clear current post selection when done to avoid conflicts
4. **Error Handling**: Wrap provider calls in try-catch blocks for production use
5. **Environment Variables**: Store credentials in environment variables, not in code
6. **Tag Names**: Use consistent tag naming conventions for better organization
7. **Markdown Content**: Always provide content in Markdown format; it will be automatically converted to HTML
8. **Featured Images**: Ensure the WordPress CDN provider is configured before setting featured images
9. **Post Selection**: Always check if a post is currently selected before creating a new one
10. **Status Management**: Use the correct status values (published, scheduled, draft, pending, private)

## Error Handling

Common error scenarios and their handling:

### Create Post Errors

- **"A post is currently selected. Clear the selection before creating a new post."**
  - Cause: Attempting to create a new post while another post is selected
  - Solution: Call `clearCurrentPost(agent)` before creating a new post

- **"Wordpress feature image must be an attachment id - is wordpress not set as the CDN?"**
  - Cause: Feature image provided without a valid CDN provider
  - Solution: Ensure WordPress CDN provider is configured and upload image first

### Update Post Errors

- **"No post is currently selected. Select a post before updating."**
  - Cause: Attempting to update without selecting a post first
  - Solution: Call `selectPostById(id, agent)` before updating

### Select Post Errors

- **"Post with ID {id} not found"**
  - Cause: Attempting to select a non-existent post
  - Solution: Verify the post ID exists using `getAllPosts()` or `getRecentPosts()`

### General Errors

- **Missing credentials**: Ensure WordPress application password is set
- **Tag creation failure**: Check WordPress permissions for tag management
- **Post not found**: Verify post ID is correct and post exists
- **Feature image without CDN**: Feature images require a configured CDN provider

**Example Error Handling:**

```typescript
try {
  await wpProvider.createPost({
    title: 'New Post',
    content: 'Content here',
    tags: ['test']
  }, agent);
} catch (error) {
  if (error.message.includes('A post is currently selected')) {
    await wpProvider.clearCurrentPost(agent);
    // Retry the operation
  } else {
    console.error('Failed to create post:', error);
  }
}
```

## State Management

The package maintains agent state for tracking the currently selected post:

- **State Slice**: `WordPressBlogState`
- **Persistence**: State persists within agent sessions
- **Reset Behavior**: State is cleared when chat context is reset
- **Checkpoint Support**: Full state serialization for agent checkpoints

**State Structure:**

```typescript
interface WordPressBlogState {
  currentPost: WPPost | null;
}
```

**State Operations:**

```typescript
// Get current state
const state = agent.getState(WordPressBlogState);
console.log(state.currentPost);

// Mutate state
agent.mutateState(WordPressBlogState, (state) => {
  state.currentPost = newPost;
});

// Reset state
state.reset(['chat']); // Clears currentPost
```

## Testing and Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Test Configuration

The package uses vitest for testing with the following configuration:

```typescript
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
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
├── vitest.config.ts             # Test configuration
├── package.json                 # Package metadata and dependencies
├── README.md                    # Package README
└── LICENSE                      # MIT License
```

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/app@0.2.0` - Core application framework
- `@tokenring-ai/agent@0.2.0` - Core agent framework
- `@tokenring-ai/blog@0.2.0` - Blog abstraction layer
- `@tokenring-ai/cdn@0.2.0` - CDN abstraction layer
- `@tokenring-ai/ai-client@0.2.0` - AI client integration
- `@tokenring-ai/filesystem@0.2.0` - File system utilities
- `@tokenring-ai/utility@0.2.0` - Utility functions
- `wordpress-api-client@^0.4.9` - WordPress REST API client
- `marked@^17.0.3` - Markdown to HTML converter
- `uuid@^13.0.0` - UUID generation
- `zod@^4.3.6` - Schema validation

### Development Dependencies

- `vitest@^4.0.18` - Testing framework
- `@vitest/coverage-v8@^4.0.18` - Coverage reporting
- `typescript@^5.9.3` - TypeScript compiler

## Related Components

- `@tokenring-ai/blog` - Blog service interface and types
- `@tokenring-ai/cdn` - CDN service and provider interfaces
- `@tokenring-ai/agent` - Agent system and state management
- `@tokenring-ai/app` - Application framework
- `@tokenring-ai/ai-client` - AI client integration
- `wordpress-api-client` - WordPress REST API client library

## License

MIT License - see `LICENSE` file for details.
