# @tokenring-ai/blog

A blog abstraction for Token Ring providing unified API for managing blog posts across multiple platforms.

## Overview

The `@tokenring-ai/blog` package provides a comprehensive abstraction for managing blog posts across different blogging platforms. It integrates with the Token Ring agent system to enable AI-powered content creation, management, and publishing.

**Note:** This is an abstract interface package. Concrete blog platform implementations (e.g., WordPress, Ghost) are provided by separate packages that implement the `BlogProvider` interface.

### Key Features

- Multi-provider blog support with unified interface (providers registered programmatically)
- AI-powered image generation for blog posts with CDN integration
- Interactive chat commands for comprehensive blog management
- State management for active provider, post tracking, and review escalation settings
- Scripting API for programmatic post operations
- JSON-RPC endpoints for remote procedure calls
- CDN integration for automatic image uploads
- Markdown to HTML content processing with `marked`
- Zod schema validation for type safety
- Review pattern escalation for publishing workflows via `EscalationService`
- Interactive post selection with tree-based UI (shows status icons: 📝 published, 🔒 draft)

---

## User Guide

### Chat Commands

#### Provider Management

| Command | Description |
| :--- | :--- |
| `/blog provider get` | Display the currently active blog provider |
| `/blog provider list` | List all registered blog providers (shows active provider) |
| `/blog provider set <name>` | Set the active blog provider by name |
| `/blog provider select` | Interactively select the active blog provider (auto-selects if only one configured) |
| `/blog provider reset` | Reset the active blog provider to the initial configured value |

#### Post Management

| Command | Description |
| :--- | :--- |
| `/blog post get` | Display the currently selected post title |
| `/blog post select` | Interactively select a post to work with (shows status: 📝 published, 🔒 draft) |
| `/blog post info` | Display detailed information about the currently selected post (title, status, dates, word count, tags, URL) |
| `/blog post clear` | Clear the current post selection |
| `/blog post publish` | Publish the currently selected post (with review escalation if configured) |

#### Testing

| Command | Description |
| :--- | :--- |
| `/blog test` | Test blog connection by listing posts, creating a test post, uploading an image, and updating the post |

### Tools

The package registers the following tools with the ChatService:

| Tool | Description |
| :--- | :--- |
| `blog_createPost` | Create a new blog post |
| `blog_updatePost` | Update the currently selected blog post |
| `blog_getRecentPosts` | Retrieve recent posts |
| `blog_getCurrentPost` | Get the currently selected post |
| `blog_selectPost` | Select a post by ID |
| `blog_generateImageForPost` | Generate AI image for the currently selected post |

#### `blog_createPost`

Create a new blog post.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | Yes | Title of the blog post |
| `contentInMarkdown` | string | Yes | The content of the post in Markdown format. The title of the post goes in the title tag, NOT inside the content |
| `tags` | string[] | No | Tags for the post |

**Returns:** `{ type: 'json', data: BlogPost }`

**Note:** The tool automatically strips the header from the markdown content and converts it to HTML using `marked`.

#### `blog_updatePost`

Update the currently selected blog post.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | No | New title for the post |
| `contentInMarkdown` | string | No | The content of the post in Markdown format |
| `tags` | string[] | No | New tags for the post |

**Returns:** `{ type: 'json', data: BlogPost }`

**Note:** The tool automatically strips the header from the markdown content and converts it to HTML using `marked`.

**Important:** This tool only updates title, content, and tags. To update status or feature_image, use the RPC endpoint or call the service method directly.

#### `blog_getRecentPosts`

Retrieves the most recent published posts, optionally filtered by status and keyword.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | "draft" \| "published" \| "all" | No | Filter by status |
| `keyword` | string | No | Keyword to filter by |
| `limit` | number | No | Maximum number of posts to return (default: 50) |

**Returns:** Formatted table of recent posts as a string

#### `blog_getCurrentPost`

Get the currently selected post from a blog service.

**Parameters:** None

**Returns:** JSON object with success status and post data

**Note:** Returns error if no post is currently selected.

#### `blog_selectPost`

Selects a blog post by its ID to perform further actions on it.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | The unique identifier of the post to select |

**Returns:** Formatted string with post details and JSON representation

#### `blog_generateImageForPost`

Generate an AI image for the currently selected blog post and set it as the featured image.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | string | Yes | Description of the image to generate |
| `aspectRatio` | "square" \| "tall" \| "wide" | No | Aspect ratio for the image (default: "square") |

**Aspect Ratio Options:**

- `square`: 1024x1024
- `tall`: 1024x1536
- `wide`: 1536x1024

**Returns:** JSON object with success status and image URL

**Note:** This tool uses the `ImageGenerationService` to generate the image, uploads it to the active provider's configured `CDNService`, and updates the current post with the featured image. Requires both services to be available.

### Configuration

The plugin is configured using the `BlogConfigSchema`:

```yaml
blog:
  agentDefaults:
    provider: wordpress
    reviewPatterns:
      - "(?:confidential|proprietary)"
    reviewEscalationTarget: manager@example.com
  defaultImageModels:
    - dall-e-3
    - stable-diffusion
```

#### Configuration Options

**BlogConfigSchema:**

| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `agentDefaults` | object | No | Default configuration for blog agents |
| `defaultImageModels` | string[] | No | Default image model names (used by image generation) |

**BlogAgentConfigSchema:** (nested under `agentDefaults`)

| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `provider` | string | No | Default blog provider name to activate on agent initialization |
| `imageModel` | string | No | Default image generation model |
| `reviewPatterns` | string[] | No | Regex patterns to detect sensitive content requiring review |
| `reviewEscalationTarget` | string | No | Email address for review escalation notifications |

### Scripting API

The package registers the following functions with the ScriptingService:

#### `createPost(title, html)`

Create a new blog post.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | Yes | Post title |
| `html` | string | Yes | Post content in HTML format |

**Returns:** String message with created post ID

#### `updatePost(title, html)`

Update the currently selected blog post.

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | Yes | New title for the post |
| `html` | string | Yes | New content in HTML format |

**Returns:** String message with updated post ID

#### `getCurrentPost()`

Get the currently selected post.

**Returns:** Post object as JSON string, or "No post selected" if none selected

#### `getAllPosts()`

Get all posts from the active provider.

**Returns:** Array of posts as JSON string

### Integration

#### Plugin Registration

```typescript
import blogPlugin from '@tokenring-ai/blog/plugin';

app.installPlugin(blogPlugin, {
  blog: {
    agentDefaults: {
      provider: 'wordpress',
      reviewPatterns: ['(?:confidential|proprietary)'],
      reviewEscalationTarget: 'review@example.com'
    },
    defaultImageModels: ['dall-e-3', 'stable-diffusion']
  }
});
```

#### Provider Registration

Providers must be registered programmatically with the `BlogService`:

```typescript
import BlogService from '@tokenring-ai/blog/BlogService';
import type {
  BlogProvider,
  CreatePostData,
  UpdatePostData,
  BlogPostFilterOptions,
  BlogPostListItem,
  BlogPost
} from '@tokenring-ai/blog/BlogProvider';

const myProvider: BlogProvider = {
  description: 'My Custom Provider',
  cdnName: 'my-cdn',

  async getAllPosts(): Promise<BlogPostListItem[]> {
    return [];
  },

  async getRecentPosts(
    filter: BlogPostFilterOptions
  ): Promise<BlogPostListItem[]> {
    return [];
  },

  async createPost(data: CreatePostData): Promise<BlogPost> {
    return {
      ...data,
      id: 'generated-id',
      created_at: Date.now(),
      updated_at: Date.now(),
      status: 'draft'
    };
  },

  async updatePost(
    id: string,
    updatedData: UpdatePostData
  ): Promise<BlogPost> {
    return {} as BlogPost;
  },

  async getPostById(id: string): Promise<BlogPost> {
    return {} as BlogPost;
  }
};

const blogService = agent.requireServiceByType(BlogService);
blogService.registerBlog('myProvider', myProvider);
```

**Note:** Providers are NOT configured through the plugin config. They must be registered via `BlogService.registerBlog()` after the service is available.

### Best Practices

1. **Provider Registration**: Register blog providers programmatically via `BlogService.registerBlog()` after the service is available. Providers are NOT configured through the plugin configuration.

2. **Review Patterns**: Configure `reviewPatterns` in `agentDefaults` to detect sensitive content (e.g., confidential information) that requires human approval before publishing.

3. **Review Escalation**: Configure `reviewEscalationTarget` to enable automatic email escalation when review patterns are matched. The escalation target will receive a notification and can approve or reject the post.

4. **Image Generation**: Use descriptive prompts for image generation to get relevant results. The generated image is automatically uploaded to the provider's configured CDN and set as the featured image.

5. **Post Selection**: Always select a post before performing operations that require a current post (e.g., update, publish, generate image).

6. **Error Handling**: Check for null returns when getting current post or undefined when getting current provider. Tools will throw errors if required state is missing.

7. **Content Format**:
   - **Tools**: Provide content in Markdown (automatically converted to HTML)
   - **RPC**: Provide content in Markdown (automatically converted to HTML)
   - **Direct Service Calls**: Provide content in HTML
   - **Scripting API**: Provide content in HTML

8. **RPC vs Service**: RPC endpoints require an explicit `provider` parameter to specify which blog provider to use. Tools and commands use the agent's active provider state.

9. **State Management**: Blog state (active provider, current post, review patterns) is managed per-agent through `BlogState`. Child agents inherit state from parent agents where applicable.

---

## Developer Reference

### Core Components

#### BlogService

The main service that manages all blog operations and provider registration.

**Implements:** `TokenRingService`

**Key Properties:**

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | string | "BlogService" |
| `description` | string | "Abstract interface for blog operations" |
| `options` | `BlogConfigSchema` | Configuration options |

**Provider Registry Methods:**

| Method | Description |
| :--- | :--- |
| `registerBlog(name, provider)` | Register a blog provider by name |
| `getAvailableBlogs()` | Get array of registered provider names |
| `getBlogProvider(name)` | Get a provider by name (returns undefined if not found) |
| `requireBlogProvider(name)` | Get a provider by name (throws if not found) |

**Service Methods:**

| Method | Description |
| :--- | :--- |
| `attach(agent, creationContext)` | Initialize the blog service with agent state |
| `requireActiveBlogProvider(agent)` | Require an active blog provider (throws if none selected) |
| `setActiveProvider(name, agent)` | Set the active blog provider for the agent |
| `getAllPosts(agent)` | Retrieve all posts from the active provider |
| `getRecentPosts(filter, agent)` | Retrieve recent posts with optional filtering |
| `createPost(data, agent)` | Create a new post with the active provider |
| `updateCurrentPost(updatedData, agent)` | Update the currently selected post |
| `getCurrentPost(agent)` | Get the currently selected post (returns null if none) |
| `selectPostById(id, agent)` | Select a post by ID and set as current |
| `clearCurrentPost(agent)` | Clear the current post selection |
| `publishPost(agent)` | Publish the selected post with review escalation |

#### BlogProvider Interface

The interface for implementing blog platform integrations. Concrete providers (e.g., WordPress, Ghost) must implement this interface.

**Properties:**

| Property | Type | Description |
| :--- | :--- | :--- |
| `description` | string | Human-readable provider description |
| `cdnName` | string | Name of the CDN service to use for image uploads |

**Methods:**

| Method | Returns | Description |
| :--- | :--- | :--- |
| `getAllPosts()` | `Promise<BlogPostListItem[]>` | Get all posts from the platform |
| `getRecentPosts(filter)` | `Promise<BlogPostListItem[]>` | Get recent posts with optional filtering |
| `createPost(data)` | `Promise<BlogPost>` | Create a new post on the platform |
| `updatePost(id, updatedData)` | `Promise<BlogPost>` | Update an existing post by ID |
| `getPostById(id)` | `Promise<BlogPost>` | Get a specific post by its ID |

**Note:** The `BlogProvider` interface handles platform-specific operations only. State management (current post selection, active provider) is handled by the `BlogService`. Providers do NOT implement `attach`, `getCurrentPost`, `clearCurrentPost`, or `selectPostById` methods.

### State Management

The package uses `BlogState` for state management.

#### BlogState

**Properties:**

| Property | Type | Description |
| :--- | :--- | :--- |
| `activeProvider` | string or undefined | Currently selected provider |
| `reviewPatterns` | string[] or undefined | Regex patterns for review |
| `reviewEscalationTarget` | string or undefined | Escalation target email |
| `currentPost` | BlogPost or undefined | Currently selected post |

**Constructor:**

```typescript
constructor(initialConfig: z.output<typeof BlogAgentConfigSchema>)
```

**Methods:**

| Method | Returns | Description |
| :--- | :--- | :--- |
| `serialize()` | JSON object | Serialize state to JSON |
| `deserialize(data)` | void | Deserialize state from JSON |
| `transferStateFromParent(parent)` | void | Transfer state from parent |
| `show()` | string | Show state representation |

### RPC Endpoints

The package provides JSON-RPC endpoints at `/rpc/blog`.

#### Query Endpoints

| Endpoint | Request Params | Response Params |
| :--- | :--- | :--- |
| `getAllPosts` | `provider`, `status?`, `tag?`, `limit?` | `posts`, `count`, `currentlySelected`, `message` |
| `getPostById` | `provider`, `id` | `post`, `message` |
| `getBlogState` | `agentId` | `status`, `selectedPostId`, `selectedProvider`, `availableProviders` |

#### Mutation Endpoints

| Endpoint | Request Params | Response Params |
| :--- | :--- | :--- |
| `createPost` | `provider`, `title`, `contentInMarkdown`, `tags?` | `post`, `message` |
| `updatePost` | `provider`, `id`, `updatedData` | `post`, `message` |
| `updateBlogState` | `agentId`, `selectedPostId?`, `selectedProvider?` | `status`, `selectedPostId`, `selectedProvider`, `availableProviders` |

**Important Notes:**

- RPC endpoints require a `provider` parameter to specify which blog provider to use, unlike tools/commands which use the agent's active provider state.
- The RPC `createPost` endpoint automatically strips markdown headers and converts content to HTML using `marked`.
- The RPC `updatePost` endpoint accepts `updatedData` as a partial BlogPost object (omits id, then partial).
- The `getBlogState` and `updateBlogState` endpoints work with agent state.
- Review escalation is NOT available through RPC endpoints. Use the chat command `/blog post publish` or direct service method for review.

### Type Definitions

All types are exported from `BlogProvider.ts` and are Zod-validated.

#### BlogPostStatusSchema

```typescript
z.enum(["draft", "published", "scheduled", "pending", "private"])
```

#### BlogPostListItem

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique identifier |
| `title` | string | Post title |
| `status` | BlogPostStatusSchema | Post status |
| `tags` | string[] or undefined | Optional post tags |
| `created_at` | number | Creation date (Unix timestamp in milliseconds) |
| `updated_at` | number | Last update date (Unix timestamp in milliseconds) |
| `published_at` | number or undefined | Optional publication date |
| `feature_image` | `{ id?: string, url?: string }` or undefined | Optional featured image |
| `url` | string or undefined | Optional post URL |

#### BlogPost

Extends `BlogPostListItem` with:

| Property | Type | Description |
| :--- | :--- | :--- |
| `html` | string | Post content in HTML format |

#### CreatePostData

```typescript
type CreatePostData = Omit<
  BlogPost,
  'id' | 'created_at' | 'updated_at' | 'published_at' | 'status'
>;
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `title` | string | Post title |
| `html` | string | Post content in HTML format |
| `tags` | string[] or undefined | Optional tags |
| `feature_image` | `{ id?: string, url?: string }` or undefined | Optional featured image |

#### UpdatePostData

```typescript
type UpdatePostData = Partial<
  Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
>;
```

All fields from `BlogPost` except `id`, `created_at`, `updated_at` (all optional).

#### BlogPostFilterOptions

```typescript
type BlogPostFilterOptions = {
  keyword?: string;
  limit?: number;
  status?: 'draft' | 'published' | 'scheduled' | 'pending' | 'private';
};
```

**Note:** The `status` filter uses the `BlogPostStatusSchema` enum values.

### Testing and Development

#### Running Tests

```bash
bun test
```

#### Build (Type Check)

```bash
bun run build
```

#### Test Blog Connection

Use the `/blog test` command to test blog connectivity. This will:

1. List current posts
2. Create a test post with timestamped title
3. Upload a test image (`hello.png`)
4. Update the post with the uploaded image as featured image

**Note:** The test utility requires a `hello.png` file in the package directory (`pkg/blog/hello.png`).

#### Package Structure

```text
pkg/blog/
├── BlogProvider.ts       # Provider interface and type definitions
├── BlogService.ts        # Main service implementation
├── commands.ts           # Agent command exports
├── index.ts              # Package main exports
├── plugin.ts             # Plugin registration and setup
├── schema.ts             # Configuration Zod schemas
├── tools.ts              # Chat tool exports
├── vitest.config.ts      # Test configuration
├── commands/             # Agent command implementations
│   └── blog/
│       ├── post/
│       │   ├── clear.ts      # Clear current post selection
│       │   ├── get.ts        # Get current post title
│       │   ├── info.ts       # Get detailed post info
│       │   ├── publish.ts    # Publish current post
│       │   └── select.ts     # Interactively select a post
│       ├── provider/
│       │   ├── get.ts        # Get current provider
│       │   ├── list.ts       # List all providers
│       │   ├── reset.ts      # Reset to initial provider
│       │   ├── select.ts     # Interactively select provider
│       │   └── set.ts        # Set provider by name
│       └── test.ts           # Test blog connection
├── rpc/
│   ├── blog.ts           # RPC endpoint implementation
│   ├── schema.ts         # RPC schema definitions
│   └── test/             # RPC endpoint tests
├── state/
│   └── BlogState.ts      # Agent state management
├── tools/                # Chat tool implementations
│   ├── createPost.ts
│   ├── generateImageForPost.ts
│   ├── getCurrentPost.ts
│   ├── getRecentPosts.ts
│   ├── selectPost.ts
│   └── updatePost.ts
└── util/
    └── testBlogConnection.ts  # Connection testing utility
```

### Usage Examples

#### Basic Workflow

```typescript
import BlogService from '@tokenring-ai/blog/BlogService';

const blogService = agent.requireServiceByType(BlogService);

// Create a new post (content must be in HTML)
const newPost = await blogService.createPost({
  title: 'Getting Started with AI Writing',
  html: '<h1>Welcome</h1><p>This is a sample blog post about AI writing assistants.</p>',
  tags: ['ai', 'writing', 'tutorial']
}, agent);

console.log('Created post:', newPost.id);
console.log('Status:', newPost.status);

// Select and update the post
await blogService.selectPostById(newPost.id, agent);
const updatedPost = await blogService.updateCurrentPost({
  title: 'Getting Started with AI Writing - Updated',
  tags: ['ai', 'writing', 'tutorial', 'artificial-intelligence']
}, agent);

// Get recent posts
const recentPosts = await blogService.getRecentPosts(
  { status: 'published', keyword: 'ai', limit: 10 },
  agent
);
console.log(`Found ${recentPosts.length} recent posts`);

// Publish the post (with review escalation if configured)
await blogService.publishPost(agent);
console.log('Post published successfully');
```

#### Using Chat Commands

```bash
# Select a blog provider
/blog provider select
# [Interactive tree selector opens]

# View current provider
/blog provider get
# Output: Current provider: wordpress

# View current post
/blog post get
# Output: Current post: My Article

# View detailed post info
/blog post info
# [Shows full post metadata]

# Generate a featured image
/blog post select
# [Select a post first]

# Publish the post
/blog post publish
# Output: Post "My Article" has been published.
```

#### Provider Implementation

```typescript
import type {
  BlogProvider,
  CreatePostData,
  UpdatePostData,
  BlogPostFilterOptions,
  BlogPostListItem,
  BlogPost
} from '@tokenring-ai/blog/BlogProvider';

class CustomBlogProvider implements BlogProvider {
  description = 'Custom blog integration';
  cdnName = 'custom-cdn';

  async getAllPosts(): Promise<BlogPostListItem[]> {
    // Fetch posts from your platform's API (no agent parameter)
    const response = await fetch('https://api.yourblog.com/posts');
    const rawData = await response.json();

    // Convert platform-specific structure to BlogPostListItem format
    return rawData.map(mapPlatformPostToBlogPostListItem);
  }

  async getRecentPosts(
    filter: BlogPostFilterOptions
  ): Promise<BlogPostListItem[]> {
    const posts = await this.getAllPosts();

    // Apply filters
    let filtered = posts;
    if (filter.keyword) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(filter.keyword.toLowerCase())
      );
    }
    if (filter.status) {
      filtered = filtered.filter(post => post.status === filter.status);
    }
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  async createPost(data: CreatePostData): Promise<BlogPost> {
    // Create post on your platform (no agent parameter)
    const response = await fetch('https://api.yourblog.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        content: data.html,
        tags: data.tags
      })
    });

    const result = await response.json();
    return mapPlatformPostToBlogPost(result);
  }

  async updatePost(
    id: string,
    updatedData: UpdatePostData
  ): Promise<BlogPost> {
    // Update post on your platform (id is passed explicitly, no agent parameter)
    const response = await fetch(`https://api.yourblog.com/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    const result = await response.json();
    return mapPlatformPostToBlogPost(result);
  }

  async getPostById(id: string): Promise<BlogPost> {
    // Get a specific post by ID (no agent parameter)
    const response = await fetch(`https://api.yourblog.com/posts/${id}`);
    const result = await response.json();
    return mapPlatformPostToBlogPost(result);
  }
}
```

**Note:** The `BlogProvider` interface methods do NOT take `agent` as a parameter. The `BlogService` handles agent state management (active provider, current post) separately from the provider implementation.

## License

MIT License - see LICENSE file for details.
