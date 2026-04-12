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
- Robust error handling with clear messages
- Review pattern escalation for publishing workflows via `EscalationService`
- Interactive post selection with tree-based UI (shows status icons: 📝 published, 🔒 draft)

## Core Components

### BlogService

The main service that manages all blog operations and provider registration.

**Implements:** `TokenRingService`

**Key Properties:**
- `name`: `"BlogService"`
- `description`: `"Abstract interface for blog operations"`
- `providers`: `KeyedRegistry<BlogProvider>` - Registry of registered blog providers
- `options`: Configuration object from `BlogConfigSchema`

**Key Methods:**

#### `attach(agent: Agent, creationContext: AgentCreationContext): void`

Initialize the blog service with the agent. Registers state and logs the selected provider.

**Parameters:**
- `agent`: The agent to attach to
- `creationContext`: The agent creation context

#### `requireActiveBlogProvider(agent: Agent): BlogProvider`

Require an active blog provider. Throws an error if no provider is selected.

**Parameters:**
- `agent`: The agent to get the provider from

**Returns:** The active blog provider

**Throws:** Error if no provider is selected

#### `setActiveProvider(name: string, agent: Agent): void`

Set the active blog provider by name.

**Parameters:**
- `name`: The name of the provider to set
- `agent`: The agent to set the provider for

#### `getAllPosts(agent: Agent): Promise<BlogPostListItem[]>`

Retrieve all posts from the active provider.

**Parameters:**
- `agent`: The agent to get posts from

**Returns:** Array of `BlogPostListItem` (summary without full HTML content)

#### `getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPostListItem[]>`

Retrieve recent posts with filtering options.

**Parameters:**
- `filter`: Filter options (keyword, limit, status)
- `agent`: The agent to get posts from

**Returns:** Array of filtered `BlogPostListItem` objects

**Filter Options:**
- `keyword`: Filter by keyword in title/content
- `limit`: Maximum number of posts to return
- `status`: Filter by status (draft, published, scheduled, pending, private)

#### `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>`

Create a new post.

**Parameters:**
- `data`: Post creation data
  - `title`: Post title
  - `html`: Post content in HTML (NOT markdown)
  - `tags`: Optional tags
  - `feature_image`: Optional featured image object with `id` and `url`
- `agent`: The agent to create the post for

**Returns:** The created blog post

#### `updateCurrentPost(updatedData: UpdatePostData, agent: Agent): Promise<BlogPost>`

Update the currently selected post.

**Parameters:**
- `updatedData`: Post update data
  - `title?: string` - New title
  - `html?: string` - New content in HTML
  - `tags?: string[]` - New tags
  - `feature_image?: { id?: string, url?: string }` - Featured image
- `agent`: The agent to update the post for

**Returns:** The updated blog post

**Note:** Requires a post to be currently selected. Updates state with the new post.

#### `getCurrentPost(agent: Agent): BlogPost | null`

Get the currently selected post.

**Parameters:**
- `agent`: The agent to get the current post from

**Returns:** The currently selected post or `null` if none selected

#### `selectPostById(id: string, agent: Agent): Promise<BlogPost>`

Select a post by ID and set it as current.

**Parameters:**
- `id`: The ID of the post to select
- `agent`: The agent to select the post for

**Returns:** The selected blog post

**Throws:** Error if post not found

#### `clearCurrentPost(agent: Agent): void`

Clear the current post selection.

**Parameters:**
- `agent`: The agent to clear the selection for

#### `publishPost(agent: Agent): Promise<void>`

Publish the currently selected post with review escalation support.

**Parameters:**
- `agent`: The agent to publish the post for

**Review Escalation Flow:**
1. Checks if post HTML content matches any configured review patterns
2. If a pattern matches and an escalation target is configured:
   - Sends escalation message via `EscalationService` to the target
   - Opens a `CommunicationChannel` and waits for user response (approve/reject)
   - Publishes if approved, rejects if rejected
3. If no patterns match or no escalation target:
   - Directly publishes the post by updating status to "published"

**Note:** If no post is currently selected, logs an informational message and returns without publishing.

#### `registerBlog(name: string, provider: BlogProvider): void`

Register a blog provider with the service. This is an alias for `providers.register`.

**Parameters:**
- `name`: The name to register the provider under
- `provider`: The blog provider implementation

#### `getAvailableBlogs(): string[]`

Get list of registered blog provider names. This is an alias for `providers.getAllItemNames`.

**Returns:** Array of provider names

### BlogProvider Interface

The interface that all blog providers must implement.

**Properties:**
- `description: string` - Provider description
- `cdnName: string` - CDN name for image uploads

**Methods:**
- `getAllPosts(): Promise<BlogPostListItem[]>` - Get all posts (summary list)
- `getRecentPosts(filter: BlogPostFilterOptions): Promise<BlogPostListItem[]>` - Get recent posts with filtering
- `createPost(data: CreatePostData): Promise<BlogPost>` - Create a new post
- `updatePost(id: string, updatedData: UpdatePostData): Promise<BlogPost>` - Update a post by ID
- `getPostById(id: string): Promise<BlogPost>` - Get a post by its ID

**Note:** The `BlogProvider` interface does NOT include `attach`, `getCurrentPost`, `clearCurrentPost`, or `selectPostById` methods. These are handled by the `BlogService` which manages provider registration and agent state.

### BlogPostListItem Interface

Represents a blog post summary (without full HTML content).

**Properties:**
- `id: string` - Unique identifier
- `title: string` - Post title
- `status: 'draft' | 'published' | 'scheduled' | 'pending' | 'private'` - Post status
- `tags?: string[]` - Post tags
- `created_at: number` - Creation date as Unix timestamp (milliseconds)
- `updated_at: number` - Last update date as Unix timestamp (milliseconds)
- `published_at?: number` - Publication date as Unix timestamp (milliseconds)
- `feature_image?: { id?: string, url?: string }` - Featured image
- `url?: string` - Post URL

### BlogPost Interface

Extends `BlogPostListItem` with:
- `html: string` - Post content in HTML format

### BlogState

Manages blog-related state for agents.

**Properties:**
- `activeProvider: string | undefined` - Currently selected blog provider
- `reviewPatterns?: string[]` - Array of regex patterns for review escalation
- `reviewEscalationTarget?: string` - Email or identifier for review escalation
- `currentPost: BlogPost | undefined` - Currently selected blog post

**Constructor:**
- `constructor(initialConfig: z.output<typeof BlogAgentConfigSchema>)` - Initializes state from agent config

**Methods:**
- `serialize(): z.output<typeof serializationSchema>` - Serialize state to JSON
- `deserialize(data: z.output<typeof serializationSchema>): void` - Deserialize state from JSON
- `transferStateFromParent(parent: Agent): void` - Transfer state from parent agent (uses nullish coalescing to preserve child state)
- `show(): string` - Show state representation as a single string

### State Serialization Schema

```typescript
const serializationSchema = z
  .object({
    activeProvider: z.string().optional(),
    reviewPatterns: z.array(z.string()).optional(),
    reviewEscalationTarget: z.string().optional(),
    currentPost: BlogPostSchema.optional(),
  })
  .prefault({});
```

**Note:** The state uses `prefault({})` which means all fields are optional and will default to `undefined` if not present.

## Services

### BlogService

The main blog service that implements `TokenRingService`.

**Registration:** Automatically registered when the plugin is installed.

**Configuration:** Accepts `BlogConfigSchema` configuration.

**Integration:**
- Registers with the app's service manager
- Attaches to agents during creation
- Integrates with ChatService for tools
- Integrates with AgentCommandService for commands
- Integrates with RpcService for endpoints
- Integrates with ScriptingService for programmatic API

**Provider Methods (Aliases):**
- `registerBlog(name, provider)` - Alias for `providers.register`
- `getAvailableBlogs()` - Alias for `providers.getAllItemNames`
- `getBlogProvider(name)` - Alias for `providers.getItemByName`
- `requireBlogProvider(name)` - Alias for `providers.requireItemByName`
## Tools

The package registers the following tools with the ChatService:

### `blog_createPost`

Create a new blog post.

**Parameters:**
- `title` (string): Title of the blog post
- `contentInMarkdown` (string): The content of the post in Markdown format. The title of the post goes in the title tag, NOT inside the content
- `tags` (string[], optional): Tags for the post

**Returns:** `{ type: 'json', data: BlogPost }`

**Note:** The tool automatically strips the header from the markdown content and converts it to HTML using `marked`.

**Example:**
```typescript
{
  title: "Getting Started with AI",
  contentInMarkdown: "# Getting Started with AI\n\nThis is a comprehensive guide...",
  tags: ["ai", "tutorial"]
}
```

### `blog_updatePost`

Update the currently selected blog post.

**Parameters:**
- `title` (string, optional): New title for the post
- `contentInMarkdown` (string, optional): The content of the post in Markdown format
- `tags` (string[], optional): New tags for the post

**Returns:** `{ type: 'json', data: BlogPost }`

**Note:** The tool automatically strips the header from the markdown content and converts it to HTML using `marked`.

**Important:** This tool only updates title, content, and tags. To update status or feature_image, use the RPC endpoint or call the service method directly.

**Example:**
```typescript
{
  title: "Updated Title",
  contentInMarkdown: "# Updated Title\n\nNew content here...",
  tags: ["ai", "updated"]
}
```

### `blog_getRecentPosts`

Retrieves the most recent published posts, optionally filtered by status and keyword.

**Parameters:**
- `status` ("draft" | "published" | "all", optional): Filter by status
- `keyword` (string, optional): Keyword to filter by
- `limit` (number, optional): Maximum number of posts to return (default: 50)

**Returns:** Formatted table of recent posts as a string

**Example:**
```typescript
{
  status: "published",
  keyword: "ai",
  limit: 10
}
```

### `blog_getCurrentPost`

Get the currently selected post from a blog service.

**Parameters:** None

**Returns:** `{ type: 'json', data: { success: boolean, post?: BlogPost, message?: string, error?: string, suggestion?: string } }`

**Note:** Returns error if no post is currently selected.

### `blog_selectPost`

Selects a blog post by its ID to perform further actions on it.

**Parameters:**
- `id` (string): The unique identifier of the post to select

**Returns:** Formatted string with post details and JSON representation

**Example:**
```typescript
{
  id: "abc-123-def"
}
```

### `blog_generateImageForPost`

Generate an AI image for the currently selected blog post.

**Parameters:**
- `prompt` (string): Description of the image to generate
- `aspectRatio` ("square" | "tall" | "wide", optional): Aspect ratio for the image (default: "square")

**Returns:** `{ type: 'json', data: { success: boolean, imageUrl: string, message: string } }`

**Note:** This tool:
1. Gets the active blog provider's image generation model
2. Generates an image using the AI client
3. Uploads the image to the provider's configured CDN
4. Updates the current post with the featured image

**Aspect Ratio Options:**
- `square`: 1024x1024
- `tall`: 1024x1536
- `wide`: 1536x1024

**Example:**
```typescript
{
  prompt: "A futuristic AI brain with neural networks",
  aspectRatio: "wide"
}
```

## RPC Endpoints

The package provides JSON-RPC endpoints at `/rpc/blog`.

### Query Endpoints

| Endpoint | Request Params | Response Params |
|----------|----------------|-----------------|
| `getAllPosts` | `provider: string`, `status?` ("draft"\|"published"\|"all"), `tag?`, `limit?` | `posts: BlogPostListItem[]`, `count: number`, `currentlySelected: string\|null`, `message: string` |
| `getPostById` | `provider: string`, `id: string` | `post: BlogPost`, `message: string` |
| `getBlogState` | `agentId: string` | `selectedPostId: string\|null`, `selectedProvider: string\|null`, `availableProviders: string[]` |

### Mutation Endpoints

| Endpoint | Request Params | Response Params |
|----------|----------------|-----------------|
| `createPost` | `provider: string`, `title: string`, `contentInMarkdown: string`, `tags?` | `post: BlogPost`, `message: string` |
| `updatePost` | `provider: string`, `id: string`, `updatedData: Partial<BlogPost>` | `post: BlogPost`, `message: string` |
| `updateBlogState` | `agentId: string`, `selectedPostId?`, `selectedProvider?` | `selectedPostId: string\|null`, `selectedProvider: string\|null`, `availableProviders: string[]` |

### RPC Endpoint Details

#### `getAllPosts`

Retrieve all posts from a specific provider.

**Request:**
```json
{
  "provider": "wordpress",
  "status": "published",
  "tag": "tutorial",
  "limit": 10
}
```

**Response:**
```json
{
  "posts": [...],
  "count": 5,
  "currentlySelected": null,
  "message": "Found 5 posts"
}
```

**Notes:**
- `status` defaults to "all" if not specified
- `limit` defaults to 10 if not specified
- Posts are filtered by tag if provided
- Returns summary list without full HTML content

#### `createPost`

Create a new blog post.

**Request:**
```json
{
  "provider": "wordpress",
  "title": "My New Post",
  "contentInMarkdown": "# My Post\n\nContent here...",
  "tags": ["tutorial", "ai"]
}
```

**Response:**
```json
{
  "post": {...},
  "message": "Post created with ID: abc-123"
}
```

**Notes:**
- Automatically strips markdown headers (`# Title`) from content
- Converts markdown to HTML using `marked`
- Post is created with "draft" status by default

#### `updatePost`

Update an existing blog post.

**Request:**
```json
{
  "provider": "wordpress",
  "id": "abc-123",
  "updatedData": {
    "title": "Updated Title",
    "html": "<p>Updated content</p>",
    "tags": ["updated", "ai"]
  }
}
```

**Response:**
```json
{
  "post": {...},
  "message": "Post updated: abc-123"
}
```

**Notes:**
- `updatedData` is a partial BlogPost (all fields optional except id)
- Does NOT automatically convert markdown to HTML - provide HTML directly
- Updates timestamp automatically

#### `getPostById`

Retrieve a specific post by ID.

**Request:**
```json
{
  "provider": "wordpress",
  "id": "abc-123"
}
```

**Response:**
```json
{
  "post": {...},
  "message": "Post: \"My Post Title\""
}
```

#### `getBlogState`

Get the current blog state for an agent.

**Request:**
```json
{
  "agentId": "agent-123"
}
```

**Response:**
```json
{
  "selectedPostId": "abc-123",
  "selectedProvider": "wordpress",
  "availableProviders": ["wordpress", "ghost"]
}
```

#### `updateBlogState`

Update the blog state for an agent.

**Request:**
```json
{
  "agentId": "agent-123",
  "selectedProvider": "wordpress",
  "selectedPostId": "abc-123"
}
```

**Response:**
```json
{
  "selectedPostId": "abc-123",
  "selectedProvider": "wordpress",
  "availableProviders": ["wordpress", "ghost"]
}
```

**Important Notes:**
- RPC endpoints require a `provider` parameter to specify which blog provider to use, unlike tools/commands which use the agent's active provider state.
- The RPC `createPost` endpoint automatically strips markdown headers and converts content to HTML using `marked`.
- The RPC `updatePost` endpoint accepts `updatedData` as a partial BlogPost object (excluding id, created_at, updated_at).
- The `getBlogState` and `updateBlogState` endpoints work with agent state (active provider, current post).
- Review escalation is **not** available through RPC endpoints - use the chat command `/blog post publish` or direct service method for review workflow support.
## Chat Commands

### Provider Management

| Command | Description |
|---------|-------------|
| `/blog provider get` | Display the currently active blog provider |
| `/blog provider list` | List all registered blog providers (shows active provider) |
| `/blog provider set <name>` | Set the active blog provider by name |
| `/blog provider select` | Interactively select the active blog provider (auto-selects if only one configured) |
| `/blog provider reset` | Reset the active blog provider to the initial configured value |

### Post Management

| Command | Description |
|---------|-------------|
| `/blog post get` | Display the currently selected post title |
| `/blog post select` | Interactively select a post to work with (shows status: 📝 published, 🔒 draft) |
| `/blog post info` | Display detailed information about the currently selected post (title, status, dates, word count, tags, URL) |
| `/blog post clear` | Clear the current post selection |
| `/blog post publish` | Publish the currently selected post (with review escalation if configured) |

### Testing

| Command | Description |
|---------|-------------|
| `/blog test` | Test blog connection by listing posts, creating a test post, uploading an image, and updating the post |

## Scripting API

The package registers the following functions with the ScriptingService:

### `createPost(title, html)`

Create a new blog post.

**Parameters:**
- `title` (string): Post title
- `html` (string): Post content in HTML (NOT Markdown)

**Returns:** Post ID as string

**Example:**
```typescript
const postId = await scripting.createPost("My Post", "<h1>My Post</h1><p>Content here</p>");
```

### `updatePost(title, html)`

Update the currently selected blog post.

**Parameters:**
- `title` (string): New title
- `html` (string): New content in HTML (NOT Markdown)

**Returns:** Post ID as string

**Example:**
```typescript
const postId = await scripting.updatePost("Updated Title", "<h1>Updated</h1><p>New content</p>");
```

### `getCurrentPost()`

Get the currently selected post.

**Returns:** Post object as JSON string or "No post selected"

**Example:**
```typescript
const post = await scripting.getCurrentPost();
```

### `getAllPosts()`

Get all posts.

**Returns:** Array of posts as JSON string

**Example:**
```typescript
const posts = await scripting.getAllPosts();
```

## Configuration

The plugin is configured using the `BlogConfigSchema`:

```typescript
export const BlogAgentConfigSchema = z
  .object({
    provider: z.string().optional(),
    imageModel: z.string().optional(),
    reviewPatterns: z.array(z.string()).optional(),
    reviewEscalationTarget: z.string().optional(),
  })
  .default({});

export const BlogConfigSchema = z.object({
  agentDefaults: BlogAgentConfigSchema,
  defaultImageModels: z.array(z.string()).default([]),
});
```

### Example Configuration

```json
{
  "blog": {
    "agentDefaults": {
      "provider": "wordpress",
      "imageModel": "dall-e-3",
      "reviewPatterns": ["(?:confidential|proprietary)"],
      "reviewEscalationTarget": "manager@example.com"
    },
    "defaultImageModels": ["dall-e-3", "stable-diffusion"]
  }
}
```

### Configuration Options

#### BlogConfigSchema

- **agentDefaults**: Default configuration for blog agents
- **defaultImageModels**: Array of default image generation model names

#### BlogAgentConfigSchema

- **provider**: Optional default blog provider name (must be registered via BlogService)
- **imageModel**: Optional default image generation model
- **reviewPatterns**: Array of regex patterns that trigger review escalation before publishing
- **reviewEscalationTarget**: Email or identifier for review escalation target

## Integration

### Plugin Registration

```typescript
import blogPlugin from '@tokenring-ai/blog/plugin';

app.installPlugin(blogPlugin, {
  blog: {
    agentDefaults: {
      provider: 'wordpress',
      imageModel: 'dall-e-3',
      reviewPatterns: ['(?:confidential|proprietary)'],
      reviewEscalationTarget: 'review@example.com'
    },
    defaultImageModels: ['dall-e-3', 'stable-diffusion']
  }
});
```

### Service Registration

The plugin automatically registers:
- `BlogService` - Main blog service
- Chat tools - All blog operations
- Agent commands - Interactive commands
- RPC endpoints - Remote procedure calls
- Scripting functions - Programmatic API

### Provider Registration

Providers must be registered programmatically with the `BlogService`:

```typescript
import BlogService from '@tokenring-ai/blog/BlogService';
import type {BlogProvider, CreatePostData, UpdatePostData, BlogPostFilterOptions, BlogPostListItem, BlogPost} from '@tokenring-ai/blog/BlogProvider';

const myProvider: BlogProvider = {
  description: 'My Custom Provider',
  cdnName: 'my-cdn',
  
  async getAllPosts(): Promise<BlogPostListItem[]> {
    // Implement retrieval of all posts
    return [];
  },
  
  async getRecentPosts(filter: BlogPostFilterOptions): Promise<BlogPostListItem[]> {
    // Implement filtered retrieval
    return [];
  },
  
  async createPost(data: CreatePostData): Promise<BlogPost> {
    // Implement post creation
    return {
      ...data,
      id: 'generated-id',
      created_at: Date.now(),
      updated_at: Date.now(),
      status: 'draft'
    };
  },
  
  async updatePost(id: string, updatedData: UpdatePostData): Promise<BlogPost> {
    // Implement post update
    return {} as BlogPost;
  },
  
  async getPostById(id: string): Promise<BlogPost> {
    // Implement post retrieval by ID
    return {} as BlogPost;
  }
};

const blogService = agent.requireServiceByType(BlogService);
blogService.registerBlog('myProvider', myProvider);
```

**Note:** Providers are NOT configured through the plugin config. They must be registered via `BlogService.registerBlog()` after the service is available.

## Usage Examples

### Basic Workflow

```typescript
import {BlogService} from "@tokenring-ai/blog";

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
  { status: "published", keyword: "ai", limit: 10 },
  agent
);
console.log(`Found ${recentPosts.length} recent posts`);

// Publish the post (with review escalation if configured)
await blogService.publishPost(agent);
console.log('Post published successfully');
```

### Using Chat Commands

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

### Provider Implementation

```typescript
import type { BlogProvider, CreatePostData, UpdatePostData, BlogPostFilterOptions, BlogPostListItem, BlogPost } from '@tokenring-ai/blog/BlogProvider';

class CustomBlogProvider implements BlogProvider {
  description = "Custom blog integration";
  cdnName = "custom-cdn";

  async getAllPosts(): Promise<BlogPostListItem[]> {
    // Fetch posts from your platform's API (no agent parameter)
    const response = await fetch('https://api.yourblog.com/posts');
    const rawData = await response.json();

    // Convert platform-specific structure to BlogPostListItem format
    return rawData.map(mapPlatformPostToBlogPostListItem);
  }

  async getRecentPosts(filter: BlogPostFilterOptions): Promise<BlogPostListItem[]> {
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

  async updatePost(id: string, updatedData: UpdatePostData): Promise<BlogPost> {
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

## Best Practices

### Provider Development
1. Implement the `BlogProvider` interface completely
2. Do NOT include `agent` parameters in provider methods - state is managed by `BlogService`
3. Handle errors gracefully with clear messages
4. Maintain consistent `BlogPostListItem` and `BlogPost` field types
5. Support all required statuses: draft, published, pending, scheduled, private
6. Set appropriate `cdnName` for image uploads (no `imageGenerationModel` in interface)

### State Management
1. Use `BlogState` for provider and post tracking
2. Implement `transferStateFromParent()` for agent inheritance (uses nullish coalescing)
3. Use `serialize()/deserialize()` for persistence
4. Store review patterns and escalation targets in agent defaults
5. Note that `show()` returns a string, not string[]

### Tool Development
1. Return tool definitions with proper schemas
2. Use `agent.infoMessage()` for user feedback
3. Validate required parameters
4. Access resources via `agent.requireServiceByType()`
5. Follow naming convention: `blog_<operation>_<component>`

### Error Handling
1. Throw descriptive errors with clear messages
2. Use service methods (`requireActiveBlogProvider`) for validation
3. Return error objects with `success: false` pattern
4. Provide helpful suggestions for resolution
5. Handle missing provider and post selection gracefully

### Review Pattern Usage
1. Configure review patterns in `agentDefaults.reviewPatterns`
2. Use descriptive regex patterns for content matching
3. Set `reviewEscalationTarget` to email or identifier
4. Test review patterns with various content scenarios
5. Handle escalation responses (approve/reject) appropriately

### Content Format
1. Provide content in Markdown for tools and RPC (automatically converted to HTML)
2. Provide content in HTML for direct service method calls
3. Strip headers from markdown content when creating/updating posts
4. Use proper HTML formatting for direct content
5. Include meaningful tags for better organization

### RPC vs Service Usage
1. RPC endpoints require explicit `provider` parameter
2. Tools/commands use the agent's active provider state
3. Note that RPC does not include review escalation
4. Use `BlogService.publishPost()` directly for review workflow support
5. RPC endpoints are suitable for basic CRUD operations
6. Service methods provide full functionality including escalation

### Provider Registration
1. Register providers programmatically via `BlogService.registerBlog()`
2. Providers are NOT configured through plugin config
3. Ensure provider is registered before setting as active
4. Use descriptive provider names for clarity

## Testing and Development

The package uses vitest for unit testing:

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Test Blog Connection

Use the `/blog test` command to test blog connectivity. This will:
1. List current posts
2. Create a test post
3. Upload a test image (hello.png)
4. Update the post with the image

**Note:** The test utility requires a `hello.png` file in the package directory.

### Example Test Setup

```typescript
import {describe, expect, it, vi} from 'vitest';
import BlogService from "../BlogService.ts";
import {BlogState} from "../state/BlogState.ts";
import createTestBlogService from "../rpc/test/createTestBlogService.ts";

describe("BlogService", () => {
  it("should create and register providers", () => {
    const service = new BlogService({
      providers: {
        testProvider: {
          type: "custom",
          // provider implementation
        }
      },
      agentDefaults: {}
    });

    expect(service.getAvailableBlogs()).toEqual(["testProvider"]);
  });

  it("should require active blog provider", () => {
    const service = new BlogService({
      providers: {},
      agentDefaults: {}
    });

    expect(() => {
      service.requireActiveBlogProvider(vi.fn());
    }).toThrow("No blog provider is currently selected");
  });

  it("should support state transfer", () => {
    const parentAgent = vi.fn();
    const childAgent = vi.fn();

    const blogState = new BlogState({provider: "wordpress"});
    blogState.transferStateFromParent(parentAgent);

    expect(blogState.activeProvider).toBe("wordpress");
  });

  it("should handle review patterns for escalation", async () => {
    const { blogService, testProvider } = createTestBlogService(app);
    
    // Configure review patterns
    const agent = app.createAgent({
      blog: {
        provider: "test",
        reviewPatterns: ["(?:confidential)"],
        reviewEscalationTarget: "manager@example.com"
      }
    });
    
    // Test post with confidential content
    const post = await blogService.createPost({
      title: "Test Post",
      content: "This is confidential information",
      tags: []
    }, agent);
    
    await blogService.selectPostById(post.id, agent);
    
    // Publishing should trigger escalation
    await blogService.publishPost(agent);
    // Escalation message should be sent to manager@example.com
  });
});

describe("BlogState", () => {
  it("should serialize and deserialize correctly", () => {
    const config = {provider: "ghost"};
    const state = new BlogState(config);

    const serialized = state.serialize();
    expect(serialized.activeProvider).toBe("ghost");

    const state2 = new BlogState(config);
    state2.deserialize(serialized);

    expect(state).toMatchObject(state2);
  });

  it("should inherit provider from parent", () => {
    const parentState = new BlogState({provider: "wordpress"});
    const childState = new BlogState({provider: null});

    childState.transferStateFromParent(vi.fn());

    expect(childState.activeProvider).toBe("wordpress");
  });

  it("should handle review patterns", () => {
    const config = {
      provider: "test",
      reviewPatterns: ["(?:confidential|proprietary)"],
      reviewEscalationTarget: "manager@example.com"
    };
    const state = new BlogState(config);

    expect(state.reviewPatterns).toEqual(config.reviewPatterns);
    expect(state.reviewEscalationTarget).toBe(config.reviewEscalationTarget);
  });
});
```

## Dependencies

- `@tokenring-ai/ai-client` (0.2.0) - AI client for image generation
- `@tokenring-ai/app` (0.2.0) - Base application framework
- `@tokenring-ai/agent` (0.2.0) - Agent orchestration
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `@tokenring-ai/rpc` (0.2.0) - JSON-RPC implementation
- `@tokenring-ai/cdn` (0.2.0) - CDN service for image uploads
- `@tokenring-ai/scripting` (0.2.0) - Scripting API
- `@tokenring-ai/escalation` (0.2.0) - Escalation service for review workflows
- `@tokenring-ai/image-generation` (0.2.0) - Image generation service for AI-powered image creation
- `zod` (^4.3.6) - Schema validation
- `marked` (^17.0.5) - Markdown to HTML conversion
- `uuid` (^13.0.0) - Unique ID generation

## Related Components

- `@tokenring-ai/agent` - Agent orchestration and state management
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/chat` - Chat service and tool definitions
- `@tokenring-ai/rpc` - Remote procedure call support
- `@tokenring-ai/scripting` - Scripting functionality
- `@tokenring-ai/cdn` - Content delivery network service
- `@tokenring-ai/ai-client` - AI model integration (image generation)
- `@tokenring-ai/utility` - Shared utilities
- `@tokenring-ai/escalation` - Human review escalation service

## License

MIT License - see `LICENSE` file for details.
