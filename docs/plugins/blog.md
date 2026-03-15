# @tokenring-ai/blog

A blog abstraction for Token Ring providing unified API for managing blog posts across multiple platforms.

## Overview

The `@tokenring-ai/blog` package provides a comprehensive interface for managing blog posts across different blogging platforms. It integrates with the Token Ring agent system to enable AI-powered content creation, management, and publishing.

### Key Features

- Multi-provider blog support with unified interface
- AI-powered image generation for blog posts with CDN integration
- Interactive chat commands for comprehensive blog management
- State management for active provider and post tracking
- Scripting API for programmatic post operations
- JSON-RPC endpoints for remote procedure calls
- CDN integration for automatic image uploads
- Markdown and HTML content processing with `marked`
- Zod schema validation for type safety
- Robust error handling with clear messages
- Review pattern escalation for publishing workflows
- Interactive post selection with tree-based UI

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

Initialize the blog service with the agent. Registers state, attaches all providers, and logs the selected provider.

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

#### `getAllPosts(agent: Agent): Promise<BlogPost[]>`

Retrieve all posts from the active provider.

**Parameters:**
- `agent`: The agent to get posts from

**Returns:** Array of all blog posts

#### `getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>`

Retrieve recent posts with filtering options.

**Parameters:**
- `filter`: Filter options (keyword, limit, status)
- `agent`: The agent to get posts from

**Returns:** Array of filtered blog posts

#### `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>`

Create a new post.

**Parameters:**
- `data`: Post creation data (title, content, tags, feature_image)
- `agent`: The agent to create the post for

**Returns:** The created blog post

#### `updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>`

Update an existing post.

**Parameters:**
- `data`: Post update data (any BlogPost fields except id, created_at, updated_at)
- `agent`: The agent to update the post for

**Returns:** The updated blog post

#### `getCurrentPost(agent: Agent): BlogPost | null`

Get the currently selected post.

**Parameters:**
- `agent`: The agent to get the current post from

**Returns:** The currently selected post or null

#### `selectPostById(id: string, agent: Agent): Promise<BlogPost>`

Select a post by ID.

**Parameters:**
- `id`: The ID of the post to select
- `agent`: The agent to select the post for

**Returns:** The selected blog post

#### `clearCurrentPost(agent: Agent): Promise<void>`

Clear the current post selection.

**Parameters:**
- `agent`: The agent to clear the selection for

#### `publishPost(agent: Agent): Promise<void>`

Publish the currently selected post with review escalation support.

**Parameters:**
- `agent`: The agent to publish the post for

**Review Escalation Flow:**
1. Checks if post content matches any configured review patterns
2. If a pattern matches and an escalation target is configured:
   - Sends escalation message to the target via EscalationService
   - Waits for user response (approve/reject)
   - Publishes if approved, rejects if rejected
3. If no patterns match or no escalation target:
   - Directly publishes the post

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
- `imageGenerationModel: string` - Model name for image generation
- `cdnName: string` - CDN name for image uploads

**Methods:**
- `attach(agent: Agent, creationContext: AgentCreationContext): void` - Initialize provider with agent
- `getAllPosts(agent: Agent): Promise<BlogPost[]>` - Get all posts
- `getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>` - Get recent posts
- `createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>` - Create a new post
- `updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>` - Update a post
- `selectPostById(id: string, agent: Agent): Promise<BlogPost>` - Select a post by ID
- `getCurrentPost(agent: Agent): BlogPost | null` - Get the current post
- `clearCurrentPost(agent: Agent): Promise<void>` - Clear the current post

### BlogPost Interface

Represents a blog post.

**Properties:**
- `id: string` - Unique identifier
- `title: string` - Post title
- `content?: string` - Post content in HTML
- `status: 'draft' | 'published' | 'scheduled' | 'pending' | 'private'` - Post status
- `tags?: string[]` - Post tags
- `created_at: Date` - Creation date
- `updated_at: Date` - Last update date
- `published_at?: Date` - Publication date
- `feature_image?: { id?: string, url?: string }` - Featured image
- `url?: string` - Post URL

### BlogState

Manages blog-related state for agents.

**Properties:**
- `activeProvider: string | null` - Currently selected blog provider
- `reviewPatterns?: string[]` - Array of regex patterns for review escalation
- `reviewEscalationTarget?: string` - Email or identifier for review escalation

**Methods:**
- `serialize(): z.output<typeof serializationSchema>` - Serialize state to JSON
- `deserialize(data: z.output<typeof serializationSchema>): void` - Deserialize state from JSON
- `transferStateFromParent(parent: Agent): void` - Transfer state from parent agent
- `show(): string[]` - Show state representation

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

**Returns:** 
- Success: `{ type: 'json', data: { success: true, post: BlogPost, message: string } }`
- Failure: `{ type: 'json', data: { success: false, error: string, suggestion: string } }`

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
| `getCurrentPost` | `agentId: string` | `post: BlogPost \| null`, `message: string` |
| `getAllPosts` | `agentId: string`, `status?` ("draft" \| "published" \| "all"), `tag?` (string), `limit?` (number) | `posts: BlogPost[]`, `count: number`, `currentlySelected: string \| null`, `message: string` |
| `getActiveProvider` | `agentId: string` | `provider: string \| null`, `availableProviders: string[]` |

### Mutation Endpoints

| Endpoint | Request Params | Response Params |
|----------|----------------|-----------------|
| `createPost` | `agentId: string`, `title: string`, `contentInMarkdown: string`, `tags?` (string[]) | `post: BlogPost`, `message: string` |
| `updatePost` | `agentId: string`, `title?`, `contentInMarkdown?`, `tags?`, `status?`, `feature_image?` | `post: BlogPost`, `message: string` |
| `selectPostById` | `agentId: string`, `id: string` | `post: BlogPost`, `message: string` |
| `clearCurrentPost` | `agentId: string` | `success: boolean`, `message: string` |
| `publishPost` | `agentId: string` | `success: boolean`, `message: string` |
| `setActiveProvider` | `agentId: string`, `name: string` | `success: boolean`, `message: string` |
| `generateImageForPost` | `agentId: string`, `prompt: string`, `aspectRatio?` ("square" \| "tall" \| "wide") | `success: boolean`, `imageUrl?`, `message: string` |

**Important Notes:**
- The RPC `publishPost` endpoint does **not** include review escalation logic. Review escalation is only available through the `BlogService.publishPost()` method when called directly.
- The `getActiveProvider` endpoint returns the provider's **description**, not the provider name.
- The `updatePost` RPC endpoint supports `status` and `feature_image` parameters, which are not available in the `blog_updatePost` tool.

## Chat Commands

### Provider Management

| Command | Description |
|---------|-------------|
| `/blog provider get` | Display the currently active blog provider |
| `/blog provider set <name>` | Set the active blog provider by name |
| `/blog provider select` | Interactively select the active blog provider |
| `/blog provider reset` | Reset the active blog provider to the initial configured value |

### Post Management

| Command | Description |
|---------|-------------|
| `/blog post get` | Display the currently selected post title |
| `/blog post select` | Interactively select a post to work with |
| `/blog post info` | Display detailed information about the currently selected post |
| `/blog post clear` | Clear the current post selection |
| `/blog post publish` | Publish the currently selected post |

### Testing

| Command | Description |
|---------|-------------|
| `/blog test` | Test blog connection by listing posts, creating a test post, uploading an image, and updating the post |

## Scripting API

The package registers the following functions with the ScriptingService:

### `createPost(title, content)`

Create a new blog post.

**Parameters:**
- `title` (string): Post title
- `content` (string): Post content in Markdown

**Returns:** Post ID as string

**Example:**
```typescript
const postId = await scripting.createPost("My Post", "# My Post\nContent here");
```

### `updatePost(title, content)`

Update the currently selected blog post.

**Parameters:**
- `title` (string): New title
- `content` (string): New content in Markdown

**Returns:** Post ID as string

**Example:**
```typescript
const postId = await scripting.updatePost("Updated Title", "# Updated\nNew content");
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
export const BlogConfigSchema = z.object({
  providers: z.record(z.string(), z.any()).default({}),
  agentDefaults: BlogAgentConfigSchema,
});

export const BlogAgentConfigSchema = z.object({
  provider: z.string().optional(),
  reviewPatterns: z.array(z.string()).optional(),
  reviewEscalationTarget: z.string().optional(),
}).default({});
```

### Example Configuration

```json
{
  "blog": {
    "providers": {
      "wordpress": {
        "url": "https://example.com/wp-json",
        "username": "admin",
        "password": "secret"
      }
    },
    "agentDefaults": {
      "provider": "wordpress",
      "reviewPatterns": ["(?:confidential|proprietary)"],
      "reviewEscalationTarget": "manager@example.com"
    }
  }
}
```

### Configuration Options

#### BlogConfigSchema

- **providers**: Record of provider names to their configuration objects
- **agentDefaults**: Default configuration for blog agents

#### BlogAgentConfigSchema

- **provider**: Optional default blog provider name
- **reviewPatterns**: Array of regex patterns that trigger review escalation before publishing
- **reviewEscalationTarget**: Email or identifier for review escalation target

## Integration

### Plugin Registration

```typescript
import blogPlugin from '@tokenring-ai/blog/plugin';

app.installPlugin(blogPlugin, {
  blog: {
    providers: {
      // Your provider configurations
    },
    agentDefaults: {
      provider: 'wordpress',
      reviewPatterns: ['(?:confidential|proprietary)'],
      reviewEscalationTarget: 'review@example.com'
    }
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

Register providers with the BlogService:

```typescript
import BlogService from '@tokenring-ai/blog/BlogService';

const blogService = agent.requireServiceByType(BlogService);
blogService.registerBlog('myProvider', {
  description: 'My Custom Provider',
  imageGenerationModel: 'dall-e-3',
  cdnName: 'my-cdn',
  // ... implement interface methods
});
```

## Usage Examples

### Basic Workflow

```typescript
import {BlogService} from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);

// Create a new post
const newPost = await blogService.createPost({
  title: 'Getting Started with AI Writing',
  content: '<h1>Welcome</h1><p>This is a sample blog post about AI writing assistants.</p>',
  tags: ['ai', 'writing', 'tutorial']
}, agent);

console.log('Created post:', newPost.id);
console.log('Status:', newPost.status);

// Select and update the post
await blogService.selectPostById(newPost.id, agent);
const updatedPost = await blogService.updatePost({
  title: 'Getting Started with AI Writing - Updated',
  tags: ['ai', 'writing', 'tutorial', 'artificial-intelligence']
}, agent);

// Get recent posts
const recentPosts = await blogService.getRecentPosts(
  { status: "published", keyword: "ai", limit: 10 },
  agent
);
console.log(`Found ${recentPosts.length} recent posts`);

// Publish the post
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
import { BlogProvider, type BlogPost, type CreatePostData, type UpdatePostData, type BlogPostFilterOptions } from '@tokenring-ai/blog';
import { Agent } from '@tokenring-ai/agent';
import type { AgentCreationContext } from '@tokenring-ai/agent/types';

class CustomBlogProvider implements BlogProvider {
  description = "Custom blog integration";
  imageGenerationModel = "dall-e-3";
  cdnName = "custom-cdn";

  attach(agent: Agent, creationContext: AgentCreationContext): void {
    // Initialize client connections here
    creationContext.items.push(`Attached to custom blog provider`);
  }

  async getAllPosts(agent: Agent): Promise<BlogPost[]> {
    // Fetch posts from your platform's API
    const response = await fetch('https://api.yourblog.com/posts');
    const rawData = await response.json();

    // Convert platform-specific structure to BlogPost format
    return rawData.map(mapPlatformPostToBlogPost);
  }

  async getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]> {
    const posts = await this.getAllPosts(agent);
    
    // Apply filters
    let filtered = posts;
    if (filter.keyword) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(filter.keyword.toLowerCase()) ||
        post.content?.toLowerCase().includes(filter.keyword.toLowerCase())
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

  async createPost(data: CreatePostData, agent: Agent): Promise<BlogPost> {
    // Create post on your platform
    const response = await fetch('https://api.yourblog.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return mapPlatformPostToBlogPost(result);
  }

  async updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost> {
    const currentPost = this.getCurrentPost(agent);
    if (!currentPost) throw new Error("No post currently selected");
    
    // Update post on your platform
    const response = await fetch(`https://api.yourblog.com/posts/${currentPost.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return mapPlatformPostToBlogPost(result);
  }

  async selectPostById(id: string, agent: Agent): Promise<BlogPost> {
    // Store the selected post ID in agent state
    // This is typically handled by the BlogService
    throw new Error("Method not implemented - selectPostById is typically handled by BlogService");
  }

  getCurrentPost(agent: Agent): BlogPost | null {
    // Get the currently selected post from agent state
    // This is typically handled by the BlogService
    throw new Error("Method not implemented - getCurrentPost is typically handled by BlogService");
  }

  async clearCurrentPost(agent: Agent): Promise<void> {
    // Clear the selected post from agent state
    // This is typically handled by the BlogService
    throw new Error("Method not implemented - clearCurrentPost is typically handled by BlogService");
  }
}
```

## Best Practices

### Provider Development
1. Implement the `BlogProvider` interface completely
2. Use `attach(agent, creationContext)` to initialize provider state
3. Handle errors gracefully with clear messages
4. Maintain consistent `BlogPost` field types
5. Support all required statuses: draft, published, pending, scheduled, private
6. Set appropriate `imageGenerationModel` and `cdnName` for integration

### State Management
1. Use `BlogState` for provider and post tracking
2. Implement `transferStateFromParent()` for agent inheritance
3. Use `serialize()/deserialize()` for persistence
4. Store review patterns and escalation targets in agent defaults

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
1. Provide content in Markdown for tools (automatically converted to HTML)
2. Strip headers from markdown content when creating/updating posts
3. Use proper HTML formatting for direct content
4. Include meaningful tags for better organization

### RPC vs Service Usage
1. Note that RPC `publishPost` does not include review escalation
2. Use `BlogService.publishPost()` directly for review workflow support
3. RPC endpoints are suitable for basic CRUD operations
4. Service methods provide full functionality including escalation

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

- `@tokenring-ai/ai-client` - AI client for image generation
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent orchestration
- `@tokenring-ai/chat` - Chat service integration
- `@tokenring-ai/utility` - Shared utilities
- `@tokenring-ai/rpc` - JSON-RPC implementation
- `@tokenring-ai/cdn` - CDN service for image uploads
- `@tokenring-ai/scripting` - Scripting API
- `@tokenring-ai/escalation` - Escalation service for review workflows
- `zod` - Schema validation
- `marked` - Markdown to HTML conversion
- `uuid` - Unique ID generation

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
