# Blog Service

## Overview

The Blog Service provides a comprehensive abstraction for managing blog posts across different blogging platforms within the Token Ring ecosystem. It integrates with the Token Ring agent system to enable AI-powered content creation, management, and publishing.

**Note:** This is an abstract interface package. Concrete blog platform implementations (e.g., WordPress, Ghost) are provided by separate packages that implement the `BlogProvider` interface.

## User Guide

### Installation

```bash
bun add @tokenring-ai/blog
```

### Key Features

- Multi-provider blog support with unified interface
- AI-powered image generation for blog posts with CDN integration
- Interactive chat commands for comprehensive blog management
- State management for active provider, post tracking, and review escalation
- Scripting API for programmatic post operations
- JSON-RPC endpoints for remote procedure calls
- CDN integration for automatic image uploads
- Markdown to HTML content processing with `marked`
- Zod schema validation for type safety
- Review pattern escalation for publishing workflows
- Interactive post selection with tree-based UI

### Chat Commands

#### Provider Management

| Command                     | Description                              |
|:----------------------------|:-----------------------------------------|
| `/blog provider get`        | Show current provider                    |
| `/blog provider list`       | List all registered providers            |
| `/blog provider set <name>` | Set the active provider by name          |
| `/blog provider select`     | Interactively select the provider        |
| `/blog provider reset`      | Reset to the initial configured provider |

#### Post Management

| Command              | Description                       |
|:---------------------|:----------------------------------|
| `/blog post get`     | Show current post title           |
| `/blog post select`  | Interactively select a post       |
| `/blog post info`    | Display detailed post information |
| `/blog post clear`   | Clear the current post selection  |
| `/blog post publish` | Publish the selected post         |

#### Testing

| Command      | Description          |
|:-------------|:---------------------|
| `/blog test` | Test blog connection |

### Tools

The package registers the following tools with the ChatService:

| Tool                        | Description                                       |
|:----------------------------|:--------------------------------------------------|
| `blog_createPost`           | Create a new blog post                            |
| `blog_updatePost`           | Update the selected blog post                     |
| `blog_getRecentPosts`       | Retrieve recent posts                             |
| `blog_getCurrentPost`       | Get the currently selected post                   |
| `blog_selectPost`           | Select a post by ID                               |
| `blog_generateImageForPost` | Generate AI image for the currently selected post |

#### `blog_createPost`

Create a new blog post.

**Parameters:**

| Parameter           | Type     | Required | Description                |
|:--------------------|:---------|:---------|:---------------------------|
| `title`             | string   | Yes      | Title of the blog post     |
| `contentInMarkdown` | string   | Yes      | Content in Markdown format |
| `tags`              | string[] | No       | Tags for the post          |

**Returns:** `{ type: 'json', data: BlogPost }`

**Note:** The tool automatically strips markdown headers and converts content to HTML using `marked`.

#### `blog_updatePost`

Update the currently selected blog post.

**Parameters:**

| Parameter           | Type     | Required | Description                |
|:--------------------|:---------|:---------|:---------------------------|
| `title`             | string   | No       | New title for the post     |
| `contentInMarkdown` | string   | No       | Content in Markdown format |
| `tags`              | string[] | No       | New tags for the post      |

**Returns:** `{ type: 'json', data: BlogPost }`

#### `blog_getRecentPosts`

Retrieves recent posts, optionally filtered by status and keyword.

**Parameters:**

| Parameter | Type   | Required | Description                 |
|:----------|:-------|:---------|:----------------------------|
| `status`  | string | No       | Filter by status            |
| `keyword` | string | No       | Keyword to filter by        |
| `limit`   | number | No       | Maximum posts (default: 50) |

**Returns:** Formatted table of recent posts as a string

#### `blog_getCurrentPost`

Get the currently selected post from a blog service.

**Parameters:** None

**Returns:** JSON object with success status and post data

**Note:** Returns error if no post is currently selected.

#### `blog_selectPost`

Selects a blog post by its ID.

**Parameters:**

| Parameter | Type   | Required | Description                       |
|:----------|:-------|:---------|:----------------------------------|
| `id`      | string | Yes      | The unique identifier of the post |

**Returns:** Formatted string with post details and JSON representation

#### `blog_generateImageForPost`

Generate an AI image for the currently selected blog post and set it as the featured image.

**Parameters:**

| Parameter     | Type   | Required | Description                          |
|:--------------|:-------|:---------|:-------------------------------------|
| `prompt`      | string | Yes      | Description of the image to generate |
| `aspectRatio` | string | No       | Aspect ratio (default: "square")     |

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
    imageModel: dall-e-3
    reviewPatterns:
      - "(?:confidential|proprietary)"
    reviewEscalationTarget: manager@example.com
  defaultImageModels:
    - dall-e-3
    - stable-diffusion
```

#### Configuration Options

**BlogConfigSchema:**

| Option               | Type     | Required | Description                                          |
|:---------------------|:---------|:---------|:-----------------------------------------------------|
| `agentDefaults`      | object   | No       | Default configuration for blog agents                |
| `defaultImageModels` | string[] | No       | Default image model names (used by image generation) |

**BlogAgentConfigSchema:** (nested under `agentDefaults`)

| Option                   | Type     | Required | Description                                                    |
|:-------------------------|:---------|:---------|:---------------------------------------------------------------|
| `provider`               | string   | No       | Default blog provider name to activate on agent initialization |
| `imageModel`             | string   | No       | Default image model for post image generation                  |
| `reviewPatterns`         | string[] | No       | Regex patterns to detect sensitive content requiring review    |
| `reviewEscalationTarget` | string   | No       | Email address for review escalation notifications              |

### Scripting API

The package registers the following functions with the ScriptingService:

#### `createPost(title, html)`

Create a new blog post.

**Parameters:**

| Parameter | Type   | Required | Description                 |
|:----------|:-------|:---------|:----------------------------|
| `title`   | string | Yes      | Post title                  |
| `html`    | string | Yes      | Post content in HTML format |

**Returns:** String message with created post ID

**Example:**

```typescript
const result = await scripting.createPost(
  "My Post",
  "<h1>My Post</h1><p>Content here</p>"
);
// Returns: "Created post: <post-id>"
```

#### `updatePost(title, html)`

Update the currently selected blog post.

**Parameters:**

| Parameter | Type   | Required | Description                |
|:----------|:-------|:---------|:---------------------------|
| `title`   | string | Yes      | New title for the post     |
| `html`    | string | Yes      | New content in HTML format |

**Returns:** String message with updated post ID

**Example:**

```typescript
const result = await scripting.updatePost(
  "Updated Title",
  "<h1>Updated</h1><p>New content</p>"
);
// Returns: "Updated post: <post-id>"
```

#### `getCurrentPost()`

Get the currently selected post.

**Returns:** Post object as JSON string, or "No post selected" if none selected

**Example:**

```typescript
const post = await scripting.getCurrentPost();
// Returns: JSON string of post object or "No post selected"
```

#### `getAllPosts()`

Get all posts from the active provider.

**Returns:** Array of posts as JSON string

**Example:**

```typescript
const posts = await scripting.getAllPosts();
// Returns: JSON string of posts array
```

**Note:** The scripting API expects content in HTML format. For tools and RPC endpoints, provide content in Markdown format (automatically converted to HTML).

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
  BlogPostFilterOptions
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

| Property      | Type               | Description                              |
|:--------------|:-------------------|:-----------------------------------------|
| `name`        | string             | "BlogService"                            |
| `description` | string             | "Abstract interface for blog operations" |
| `options`     | `BlogConfigSchema` | Configuration options                    |

**Provider Registry Methods:**

| Method                         | Description                                             |
|:-------------------------------|:--------------------------------------------------------|
| `registerBlog(name, provider)` | Register a blog provider by name                        |
| `getAvailableBlogs()`          | Get array of registered provider names                  |
| `getBlogProvider(name)`        | Get a provider by name (returns undefined if not found) |
| `requireBlogProvider(name)`    | Get a provider by name (throws if not found)            |

**Service Methods:**

| Method                                  | Description                                               |
|:----------------------------------------|:----------------------------------------------------------|
| `attach(agent, creationContext)`        | Initialize the blog service with agent state              |
| `requireActiveBlogProvider(agent)`      | Require an active blog provider (throws if none selected) |
| `setActiveProvider(name, agent)`        | Set the active blog provider for the agent                |
| `getAllPosts(agent)`                    | Retrieve all posts from the active provider               |
| `getRecentPosts(filter, agent)`         | Retrieve recent posts with optional filtering             |
| `createPost(data, agent)`               | Create a new post with the active provider                |
| `updateCurrentPost(updatedData, agent)` | Update the currently selected post                        |
| `getCurrentPost(agent)`                 | Get the currently selected post (returns null if none)    |
| `selectPostById(id, agent)`             | Select a post by ID and set as current                    |
| `clearCurrentPost(agent)`               | Clear the current post selection                          |
| `publishPost(agent)`                    | Publish the selected post with review escalation          |

#### BlogProvider Interface

The interface for implementing blog platform integrations. Concrete providers (e.g., WordPress, Ghost) must implement this interface.

**Properties:**

| Property      | Type   | Description                                      |
|:--------------|:-------|:-------------------------------------------------|
| `description` | string | Human-readable provider description              |
| `cdnName`     | string | Name of the CDN service to use for image uploads |

**Methods:**

| Method                        | Returns                       | Description                              |
|:------------------------------|:------------------------------|:-----------------------------------------|
| `getAllPosts()`               | `Promise<BlogPostListItem[]>` | Get all posts from the platform          |
| `getRecentPosts(filter)`      | `Promise<BlogPostListItem[]>` | Get recent posts with optional filtering |
| `createPost(data)`            | `Promise<BlogPost>`           | Create a new post on the platform        |
| `updatePost(id, updatedData)` | `Promise<BlogPost>`           | Update an existing post by ID            |
| `getPostById(id)`             | `Promise<BlogPost>`           | Get a specific post by its ID            |

**Note:** The `BlogProvider` interface handles platform-specific operations only. State management (current post selection, active provider) is handled by the `BlogService`. Providers do NOT implement `attach`, `getCurrentPost`, `clearCurrentPost`, or `selectPostById` methods.

### State Management

The package uses `BlogState` for state management.

#### BlogState

**Properties:**

| Property                 | Type                  | Description                 |
|:-------------------------|:----------------------|:----------------------------|
| `activeProvider`         | string or undefined   | Currently selected provider |
| `reviewPatterns`         | string[] or undefined | Regex patterns for review   |
| `reviewEscalationTarget` | string or undefined   | Escalation target email     |
| `currentPost`            | BlogPost or undefined | Currently selected post     |

**Constructor:**

```typescript
constructor(initialConfig: z.output<typeof BlogAgentConfigSchema>)
```

**Methods:**

| Method                            | Returns     | Description                 |
|:----------------------------------|:------------|:----------------------------|
| `serialize()`                     | JSON object | Serialize state to JSON     |
| `deserialize(data)`               | void        | Deserialize state from JSON |
| `transferStateFromParent(parent)` | void        | Transfer state from parent  |
| `show()`                          | string      | Show state representation   |

### RPC Endpoints

The package provides JSON-RPC endpoints at `/rpc/blog`.

#### Query Endpoints

| Endpoint       | Request Params                                                                 | Response Params                                                                 |
|:---------------|:-------------------------------------------------------------------------------|:--------------------------------------------------------------------------------|
| `getAllPosts`  | `provider`, `status?` ("draft"/"published"/"all", default: "all"), `tag?`, `limit?` (default: 10) | `posts`, `count`, `currentlySelected`, `message`                                |
| `getPostById`  | `provider`, `id`                                                               | `post`, `message`                                                               |
| `getBlogState` | `agentId`                                                                      | `status` ("success" or "agentNotFound"), `selectedPostId`, `selectedProvider`, `availableProviders` |

#### Mutation Endpoints

| Endpoint          | Request Params                                                                 | Response Params                                                                 |
|:------------------|:-------------------------------------------------------------------------------|:--------------------------------------------------------------------------------|
| `createPost`      | `provider`, `title`, `contentInMarkdown`, `tags?`                              | `post`, `message`                                                               |
| `updatePost`      | `provider`, `id`, `updatedData` (partial BlogPost excluding id)                | `post`, `message`                                                               |
| `updateBlogState` | `agentId`, `selectedPostId?`, `selectedProvider?`                              | `status` ("success" or "agentNotFound"), `selectedPostId`, `selectedProvider`, `availableProviders` |

**Important Notes:**

- RPC endpoints require a `provider` parameter to specify which blog provider to use, unlike tools/commands which use the agent's active provider state.
- The RPC `createPost` endpoint automatically strips markdown headers and converts content to HTML using `marked`.
- The RPC `updatePost` endpoint accepts `updatedData` as a partial BlogPost object (excluding id, created_at, updated_at).
- The `getBlogState` and `updateBlogState` endpoints work with agent state.
- Review escalation is NOT available through RPC endpoints. Use the chat command `/blog post publish` or direct service method for review.

### Type Definitions

All types are exported from `BlogProvider.ts` and are Zod-validated.

#### BlogPostStatusSchema

```typescript
z.enum(["draft", "published", "scheduled", "pending", "private"])
```

#### BlogPostListItem

| Property        | Type                                         | Description                                       |
|:----------------|:---------------------------------------------|:--------------------------------------------------|
| `id`            | string                                       | Unique identifier                                 |
| `title`         | string                                       | Post title                                        |
| `status`        | BlogPostStatusSchema                         | Post status                                       |
| `tags`          | string[] \| undefined                        | Optional post tags                                |
| `created_at`    | number                                       | Creation date (Unix timestamp in milliseconds)    |
| `updated_at`    | number                                       | Last update date (Unix timestamp in milliseconds) |
| `published_at`  | number \| undefined                          | Optional publication date                         |
| `feature_image` | `{ id?: string, url?: string }` \| undefined | Optional featured image                           |
| `url`           | string \| undefined                          | Optional post URL                                 |

#### BlogPost

Extends `BlogPostListItem` with:

| Property | Type   | Description                 |
|:---------|:-------|:----------------------------|
| `html`   | string | Post content in HTML format |

#### CreatePostData

```typescript
type CreatePostData = Omit<
  BlogPost,
  'id' | 'created_at' | 'updated_at' | 'published_at' | 'status'
>;
```

| Property        | Type                                         | Description                 |
|:----------------|:---------------------------------------------|:----------------------------|
| `title`         | string                                       | Post title                  |
| `html`          | string                                       | Post content in HTML format |
| `tags`          | string[] \| undefined                        | Optional tags               |
| `feature_image` | `{ id?: string, url?: string }` \| undefined | Optional featured image     |

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

### Dependencies

- `@tokenring-ai/ai-client` (0.2.0) - AI client for embeddings and chat
- `@tokenring-ai/app` (0.2.0) - Base application framework
- `@tokenring-ai/agent` (0.2.0) - Agent orchestration
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `@tokenring-ai/rpc` (0.2.0) - JSON-RPC implementation
- `@tokenring-ai/cdn` (0.2.0) - CDN service for image uploads
- `@tokenring-ai/scripting` (0.2.0) - Scripting API
- `@tokenring-ai/escalation` (0.2.0) - Review escalation service
- `@tokenring-ai/image-generation` (0.2.0) - AI image generation service
- `zod` (^4.3.6) - Schema validation
- `marked` (^17.0.6) - Markdown to HTML conversion
- `uuid` (14.0.0) - Unique ID generation

### Related Components

- [@tokenring-ai/wordpress](./wordpress.md) - WordPress blog provider implementation
- [@tokenring-ai/ghost-io](./ghost-io.md) - Ghost blog provider implementation
- [@tokenring-ai/escalation](./escalation.md) - Review escalation service
- [@tokenring-ai/image-generation](./image-generation.md) - AI image generation service
- [@tokenring-ai/cdn](./cdn.md) - CDN service for file uploads

## License

MIT License - see LICENSE file for details.
