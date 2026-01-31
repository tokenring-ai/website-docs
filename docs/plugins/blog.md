# @tokenring-ai/blog

A blog abstraction for Token Ring providing unified API for managing blog posts across multiple platforms.

## Overview

The `@tokenring-ai/blog` package provides a comprehensive interface for managing blog posts across different blogging platforms. It integrates with the Token Ring agent system to enable AI-powered content creation, management, and publishing.

### Key Features

- Multi-provider blog support with unified interface
- AI-powered image generation for blog posts
- Interactive chat commands for comprehensive blog management
- State management for active provider and post tracking
- Scripting API for programmatic post operations
- JSON-RPC endpoints for remote procedure calls
- CDN integration for automatic image uploads
- Markdown and HTML content processing
- Zod schema validation for type safety
- Robust error handling with clear messages

## Installation

```bash
bun install @tokenring-ai/blog
```

## Configuration

### BlogConfigSchema

Setup configures blog providers and agent defaults:

```typescript
export const BlogConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),
  agentDefaults: BlogAgentConfigSchema,
});

export const BlogAgentConfigSchema = z.object({
  provider: z.string().optional()
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
      "provider": "wordpress"
    }
  }
}
```

## Core Components

### BlogProvider Interface

Standardized interface for blog provider implementations:

```typescript
export interface BlogPost {
  id: string;
  title: string;
  content?: string;
  status: 'draft' | 'published' | 'scheduled' | 'pending' | 'private';
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  feature_image?: {
    id?: string;
    url?: string;
  }
  url?: string;
}

export type CreatePostData = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'status'>;

export type UpdatePostData = Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>>;

export interface BlogProvider {
  description: string;

  imageGenerationModel: string;
  cdnName: string;

  attach(agent: Agent): void;

  getAllPosts(agent: Agent): Promise<BlogPost[]>;
  createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>;
  updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>;
  selectPostById(id: string, agent: Agent): Promise<BlogPost>;
  getCurrentPost(agent: Agent): BlogPost | null;
  clearCurrentPost(agent: Agent): Promise<void>;
}
```

### BlogService

The main service that manages all blog operations and provider registration:

```typescript
import BlogService from "@tokenring-ai/blog";

const blogService = await app.requireService(BlogService);

// Register a provider
blogService.registerBlog("wordpress", myWordPressProvider);

// Get available providers
const blogs = blogService.getAvailableBlogs(); // ["wordpress", "ghost"]

// Set active provider
blogService.setActiveProvider("wordpress", agent);
```

**Public Methods:**

```typescript
attach(agent: Agent): void
```
Initialize the blog service with the agent, attaching all configured providers.

```typescript
requireActiveBlogProvider(agent: Agent): BlogProvider
```
Require an active blog provider. Throws error if none is selected.

```typescript
setActiveProvider(name: string, agent: Agent): void
```
Set the active blog provider for session state.

```typescript
async getAllPosts(agent: Agent): Promise<BlogPost[]>
```
Retrieve all posts from the active blog provider.

```typescript
async createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>
```
Create a new blog post with title, content, and optional tags.

```typescript
async updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>
```
Update an existing blog post with new title, content, tags, status, or featured image.

```typescript
getCurrentPost(agent: Agent): BlogPost | null
```
Get the currently selected blog post.

```typescript
async selectPostById(id: string, agent: Agent): Promise<BlogPost>
```
Select a post by its ID.

```typescript
async clearCurrentPost(agent: Agent): Promise<void>
```
Clear the current post selection.

```typescript
async publishPost(agent: Agent): Promise<void>
```
Publish the currently selected post (changes status from draft to published).

```typescript
registerBlog(name: string, provider: BlogProvider): void
```
Register a blog provider with the service.

```typescript
getAvailableBlogs(): string[]
```
Get list of registered blog provider names.

### BlogState

State management for blog operations:

```typescript
import {BlogState} from "@tokenring-ai/blog";

// Initialize state
agent.initializeState(BlogState, {provider: "wordpress"});

// Access state
const state = agent.getState(BlogState);
console.log(state.activeProvider);

// Mutate state
agent.mutateState(BlogState, (state) => {
  state.activeProvider = "ghost";
});

// Transfer state from parent agent
state.transferStateFromParent(agent);

// Serialize/deserialize
const data = state.serialize();
const newState = new BlogState(config);

// Reset state
state.reset(['chat']); // Only reset chat-related state
```

## Tools

The following tools are registered with the ChatService for use in chat interactions:

### blog_createPost

Create a new blog post.

**Input Schema:**

```typescript
{
  title: string;              // Required - Title of the blog post
  contentInMarkdown: string;  // Required - The content of the post in Markdown format. The title of the post goes in the title tag, NOT inside the content
  tags?: string[];            // Optional - Tags for the post
}
```

**Behavior:**

- Automatically strips Markdown headers from content (`^#\s*`)
- Converts Markdown to HTML using marked library
- Throws error if title or content is missing

**Response:** BlogPost object

```typescript
{
  success: true,
  id: string;
  title: string;
  content?: string;
  status: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  feature_image?: {
    id?: string;
    url?: string;
  };
  url?: string;
}
```

### blog_updatePost

Update the currently selected blog post.

**Input Schema:**

```typescript
{
  title?: string;              // Optional - New title for the post
  contentInMarkdown?: string;  // Optional - The content of the post in Markdown format. The title of the post goes in the title tag, NOT inside the content
  tags?: string[];            // Optional - New tags for the post
}
```

**Behavior:**

- Requires a post to be selected via `selectPostById`
- Content is automatically stripped of Markdown headers and converted to HTML
- Only updates provided fields (all optional)
- Applies changes to the currently selected post

**Response:** Updated BlogPost object

### blog_getAllPosts

Retrieve all posts from the active blog provider.

**Input Schema:**

```typescript
{
  status?: "draft" | "published" | "all";  // Filter by status (default: "all")
  tag?: string;                            // Filter by tag name
  limit?: number;                          // Maximum results (default: 10)
}
```

**Response:** BlogPost[] with metadata

```typescript
{
  success: true,
  posts: BlogPost[];
  message: string;
  count: number;                  // Total matching posts
  currentlySelected: string | null;
}
```

### blog_getCurrentPost

Get the currently selected blog post.

**Input Schema:**

```typescript
{}
```

**Response:** BlogPost or error object

```typescript
{
  success: true,
  post: BlogPost;
  message: string;
}
```

**Error Response:**

```typescript
{
  success: false,
  error: string;
  suggestion: string;
}
```

### blog_generateImageForPost

Generate an AI image and set it as the featured image for the currently selected post.

**Input Schema:**

```typescript
{
  prompt: string;              // Required - Description of the image to generate
  aspectRatio?: "square" | "tall" | "wide";  // Optional - Image dimensions (default: "square")
}
```

**Supported Aspect Ratios:**

- `square`: 1024x1024 pixels
- `tall`: 1024x1536 pixels
- `wide`: 1536x1024 pixels
- Default: `square`

**Behavior:**

- Creates image using configured AI client (`imageGenerationModel`)
- Uploads image to configured CDN (`cdnName`)
- Updates post with `feature_image` containing CDN URL
- Applies changes to the currently selected post

**Response:**

```typescript
{
  success: true,
  imageUrl: string;
  message: string;
}
```

## Chat Commands

The plugin provides the following chat commands through the AgentCommandService:

### /blog provider [command]

Manage blog providers.

**Commands:**

```bash
/blog provider get        # Display the currently active blog provider
/blog provider select     # Select an active blog provider interactively
/blog provider set <name> # Set a specific blog provider by name
/blog provider reset      # Reset to the initial configured blog provider
```

**Example Usage:**

```bash
# View current provider
/blog provider get
# Output: Current provider: wordpress

# Interactive selection
/blog provider select
# [Tree selector opens with available providers]

# Set provider directly
/blog provider set wordpress
# Output: Active provider set to: wordpress

# Reset to default
/blog provider reset
# Output: Reset to initial provider: wordpress
```

### /blog post [command]

Manage blog posts.

**Commands:**

```bash
/blog post get              # Display the currently selected post title
/blog post select           # Select an existing article or clear selection
/blog post info             # Display detailed information about the selected post
/blog post clear            # Clears the current post selection
/blog post publish          # Publish the currently selected post
```

**Example Usage:**

```bash
# View current post
/blog post get
# Output: Current post: My Blog Post

# Select a post
/blog post select
# Select from tree: 📝 My Published Post (2024-01-15)
#                     🔒 My Draft Post (2024-01-14)
# Output: Selected post: "My Published Post"

# View post details
/blog post info
# Output:
# Blog: wordpress
# Title: My Published Post
# Status: published
# Created: 1/15/2024, 10:30:00 AM
# Updated: 1/15/2024, 2:45:00 PM
# Word count (approx.): 342
# Tags: ai, technology
# URL: https://example.com/my-published-post

# Clear selection
/blog post clear
# Output: Post selection cleared.

# Publish post
/blog post publish
# Output: Post "My Draft Post" has been published.
```

### /blog test

Test blog connection by creating a post and uploading an image.

## Scripting Functions

The plugin registers the following global scripting functions:

```typescript
import {ScriptingThis} from "@tokenring-ai/scripting/ScriptingService";

// Get access to the scripting service
const scriptingService = agent.requireServiceByType(ScriptingService);

// Create a new post
await scriptingService.createPost(
  "My Blog Post",
  "# Title\n\nThis is the content in **Markdown** format."
);

// Update the post
await scriptingService.updatePost(
  "Updated Title",
  "Updated content with **bold text**."
);

// List all posts
const posts = await scriptingService.getAllPosts();

// Get current post
const currentPost = await scriptingService.getCurrentPost();
```

**Function Signatures:**

```typescript
createPost(title: string, content: string): Promise<string>

updatePost(title: string, content: string): Promise<string>

getAllPosts(): Promise<string>

getCurrentPost(): Promise<string>
```

## RPC Endpoints

The plugin provides JSON-RPC endpoints at `/rpc/blog` for programmatic access.

### Query Endpoints

| Endpoint | Type | Request Params | Response Params |
|----------|------|----------------|-----------------|
| `getCurrentPost` | GET | agentId: string | post: BlogPost \| null, message: string |
| `getAllPosts` | GET | agentId, status?, tag?, limit? | posts: BlogPost[], count, currentlySelected, message |
| `getActiveProvider` | GET | agentId: string | provider: string \| null, availableProviders: string[] |

### Mutation Endpoints

| Endpoint | Type | Request Params | Response Params |
|----------|------|----------------|-----------------|
| `createPost` | POST | agentId, title, contentInMarkdown, tags? | post: BlogPost, message |
| `updatePost` | POST | agentId, title?, contentInMarkdown?, tags?, status?, feature_image? | post: BlogPost, message |
| `selectPostById` | POST | agentId, id: string | post: BlogPost, message |
| `clearCurrentPost` | POST | agentId | success: boolean, message |
| `publishPost` | POST | agentId | success: boolean, message |
| `setActiveProvider` | POST | agentId, name: string | success: boolean, message |
| `generateImageForPost` | POST | agentId, prompt, aspectRatio? | success: boolean, imageUrl?, message |

### RPC Usage Example

```typescript
const apiUrl = "http://localhost:3000/rpc/blog";

// Create a new post
const createResponse = await fetch(apiUrl + "/createPost", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    agentId: "agent-123",
    title: "RPC Test Post",
    contentInMarkdown: "# Test\n\nContent in **Markdown**",
    tags: ["test", "rpc"]
  })
});

const result = await createResponse.json();
console.log("Created post:", result.post);

// Get all posts
const postsResponse = await fetch(apiUrl + "/getAllPosts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    agentId: "agent-123",
    tag: "technology",
    limit: 20
  })
});

const postsResult = await postsResponse.json();
console.log("Found posts:", postsResult.count);
```

## Provider Integration

Create a concrete implementation of `BlogProvider` for your specific blog platform:

```typescript
import { BlogProvider, type BlogPost, type CreatePostData, type UpdatePostData } from '@tokenring-ai/blog';
import { Agent } from '@tokenring-ai/agent';

class CustomBlogProvider implements BlogProvider {
  description = "Custom blog integration";
  imageGenerationModel = "gpt-4";
  cdnName = "custom-cdn";

  async attach(agent: Agent): Promise<void> {
    // Initialize client connections here
    // Create/update agent state if needed
  }

  async getAllPosts(agent: Agent): Promise<BlogPost[]> {
    // Fetch posts from your platform's API
    const response = await fetch('https://api.yourblog.com/posts');
    const rawData = await response.json();

    // Convert platform-specific structure to BlogPost format
    return rawData.map(mapPlatformPostToBlogPost);
  }

  async createPost(data: CreatePostData, agent: Agent): Promise<BlogPost> {
    const payload = {
      title: data.title,
      content: data.content || '<p>No content</p>',
      status: 'draft',
      tags: data.tags || [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const response = await fetch('https://api.yourblog.com/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const newPost = await response.json();
    return mapPlatformPostToBlogPost(newPost);
  }

  async updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost> {
    const currentPost = this.getCurrentPost(agent);
    if (!currentPost) {
      throw new Error('No post currently selected');
    }

    const payload = {
      title: data.title || currentPost.title,
      content: data.content || currentPost.content,
      status: currentPost.status,
      tags: data.tags || currentPost.tags,
      updated_at: new Date()
    };

    const response = await fetch(`https://api.yourblog.com/posts/${currentPost.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    const updatedPost = await response.json();
    return mapPlatformPostToBlogPost(updatedPost);
  }

  async selectPostById(id: string, agent: Agent): Promise<BlogPost> {
    const response = await fetch(`https://api.yourblog.com/posts/${id}`);
    const post = await response.json();

    // Update agent state
    agent.mutateState(BlogState, (state) => {
      state.currentPost = post;
    });

    return mapPlatformPostToBlogPost(post);
  }

  getCurrentPost(agent: Agent): BlogPost | null {
    return agent.getState(BlogState)?.currentPost || null;
  }

  async clearCurrentPost(agent: Agent): Promise<void> {
    agent.mutateState(BlogState, (state) => {
      state.currentPost = null;
    });
  }
}

// Helper function to map platform posts to BlogPost format
function mapPlatformPostToBlogPost(platformPost: any): BlogPost {
  return {
    id: platformPost.id,
    title: platformPost.title,
    content: platformPost.content,
    status: platformPost.status,
    tags: platformPost.tags,
    created_at: new Date(platformPost.created_at),
    updated_at: new Date(platformPost.updated_at),
    published_at: platformPost.published_at ? new Date(platformPost.published_at) : undefined,
    feature_image: platformPost.feature_image ? {
      id: platformPost.feature_image.id,
      url: platformPost.feature_image.url
    } : undefined,
    url: platformPost.url
  };
}
```

**Example Usage:**

```typescript
import BlogService from "@tokenring-ai/blog";

const blogService = new BlogService({
  providers: {
    wordpress: new WordPressBlogProvider({
      url: process.env.WORDPRESS_URL!,
      username: process.env.WORDPRESS_USERNAME!,
      password: process.env.WORDPRESS_PASSWORD!
    }),
    ghost: new GhostBlogProvider({
      url: process.env.GHOST_URL!,
      apiKey: process.env.GHOST_API_KEY!
    })
  },
  agentDefaults: {
    provider: "wordpress"
  }
});
```

## Agent Integration

### State Management

The blog plugin maintains session state through `BlogState`:

```typescript
class BlogState implements AgentStateSlice<typeof serializationSchema> {
  name = "BlogState";
  serializationSchema = serializationSchema;
  activeProvider: string | null;

  constructor(readonly initialConfig: z.output<typeof BlogAgentConfigSchema>) {
    this.activeProvider = initialConfig.provider ?? null;
  }

  transferStateFromParent(parent: Agent): void {
    // Inherit active provider from parent if current is null
    this.activeProvider ??= parent.getState(BlogState).activeProvider;
  }

  reset(what: ResetWhat[]): void {
    // Override to selectively reset state based on what parameter
  }

  serialize(): z.output<typeof serializationSchema> {
    return { activeProvider: this.activeProvider };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.activeProvider = data.activeProvider;
  }

  show(): string[] {
    return [`Active Blog: ${this.activeProvider}`];
  }
}
```

### Service Registration

The plugin integrates with the Token Ring application framework through the plugin system:

```typescript
import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {ScriptingService} from "@tokenring-ai/scripting";
import {ScriptingThis} from "@tokenring-ai/scripting/ScriptingService";
import {RpcService} from "@tokenring-ai/rpc";
import {z} from "zod";
import BlogService from "./BlogService.ts";
import chatCommands from "./chatCommands.ts";
import {BlogConfigSchema} from "./index.ts";
import packageJSON from './package.json' with {type: 'json'};
import blogRPC from "./rpc/blog.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  blog: BlogConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (!config.blog) return;
    const service = new BlogService(config.blog);
    app.services.register(service);

    app.services.waitForItemByType(ScriptingService, (scriptingService: ScriptingService) => {
      // Register scripting functions
      scriptingService.registerFunction("createPost", {
        type: 'native',
        params: ['title', 'content'],
        async execute(this: ScriptingThis, title: string, content: string): Promise<string> {
          const post = await this.agent.requireServiceByType(BlogService).createPost(
            {title, content},
            this.agent
          );
          return `Created post: ${post.id}`;
        }
      });

      scriptingService.registerFunction("updatePost", {
        type: 'native',
        params: ['title', 'content'],
        async execute(this: ScriptingThis, title: string, content: string): Promise<string> {
          const post = await this.agent.requireServiceByType(BlogService).updatePost(
            {title, content},
            this.agent
          );
          return `Updated post: ${post.id}`;
        }
      });

      scriptingService.registerFunction("getCurrentPost", {
        type: 'native',
        params: [],
        async execute(this: ScriptingThis): Promise<string> {
          const post = this.agent.requireServiceByType(BlogService).getCurrentPost(this.agent);
          return post ? JSON.stringify(post) : 'No post selected';
        }
      });

      scriptingService.registerFunction("getAllPosts", {
        type: 'native',
        params: [],
        async execute(this: ScriptingThis): Promise<string> {
          const posts = await this.agent.requireServiceByType(BlogService).getAllPosts(this.agent);
          return JSON.stringify(posts);
        }
      });
    });

    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(chatCommands)
    );

    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(blogRPC);
    })
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Usage Examples

### Basic Workflow

```typescript
import {BlogService} from "@tokenring-ai/blog";

const blogService = agent.requireServiceByType(BlogService);

// Create a new post
const newPost = await blogService.createPost({
  title: 'Getting Started with AI Writing',
  content: '# Welcome\n\nThis is a sample blog post about AI writing assistants.',
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

// Get all posts
const allPosts = await blogService.getAllPosts(agent);
console.log(`Total posts: ${allPosts.length}`);

// Filter by status
const drafts = await blogService.getAllPosts(agent)
  .then(posts => posts.filter(p => p.status === 'draft'));

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

# Create a new post and select it
/blog post select
# [Tree selector opens with available posts]
# Output: Selected post: "My Article"

# View detailed post info
/blog post info
# [Shows full post metadata]

# Generate a featured image
/btn blog_generateImageForPost
# [Tool: Blog/generateImageForPost]
# Input: prompt "A beautiful sunset over mountains"
# Input: aspectRatio wide

# Publish the post
/blog post publish
# Output: Post "My Article" has been published.
```

### Generating Images

```typescript
const blogService = agent.requireServiceByType(BlogService);
const cdnService = agent.requireServiceByType(CDNService);
const imageModelRegistry = agent.requireServiceByType(ImageGenerationModelRegistry);

// Get active blog to check configuration
const activeBlog = blogService.requireActiveBlogProvider(agent);

// Generate image
const imageClient = await imageModelRegistry.getClient(activeBlog.imageGenerationModel);

// Generate square image
const squareImage = await imageClient.generateImage({
  prompt: "A futuristic cityscape at sunset",
  size: "1024x1024",
  n: 1
}, agent);

// Generate tall image for mobile banners
const tallImage = await imageClient.generateImage({
  prompt: "Abstract gradient with geometric shapes",
  size: "1024x1536",
  n: 1
}, agent);

// Generate wide image for blog headers
const wideImage = await imageClient.generateImage({
  prompt: "Technology concept with digital elements",
  size: "1536x1024",
  n: 1
}, agent);

// Upload to CDN
const uploadResult = await cdnService.upload(
  activeBlog.cdnName,
  Buffer.from(squareImage.uint8Array),
  {
    filename: `${uuid()}.${squareImage.mediaType.split("/")[1]}`,
    contentType: squareImage.mediaType,
  }
);

console.log('Image URL:', uploadResult.url);
```

### RPC Integration

```typescript
// Create a blog provider implementation
class CustomProvider implements BlogProvider {
  // ... implementation
}

// Register provider with BlogService
const blogService = new BlogService({
  providers: {
    custom: new CustomProvider()
  }
});

// Create RPC endpoint
import {createRPCEndpoint} from "@tokenring-ai/rpc/createRPCEndpoint";
import BlogRpcSchema from "./rpc/blog.ts";

const blogRpc = createRPCEndpoint(BlogRpcSchema, {
  async getAllPosts(args, app) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    const blogService = app.requireService(BlogService);

    let posts = await blogService.getAllPosts(agent);

    // Apply filtering
    if (args.status && args.status !== "all") {
      posts = posts.filter(post => post.status === args.status);
    }

    return {
      posts: posts.slice(0, args.limit || 10)
    };
  },

  async createPost(args, app) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    const blogService = app.requireService(BlogService);

    const post = await blogService.createPost({
      title: args.title,
      content: args.contentInMarkdown, // Already processed to HTML
      tags: args.tags
    }, agent);

    return { post, message: `Post created: ${post.id}` };
  }
});

// Register with web host
webHostService.registerResource("Blog RPC", new JsonRpcResource(app, blogRpc));
```

## Error Handling

The plugin provides robust error handling with clear, actionable error messages:

### Common Errors

**1. No Active Provider**

```typescript
// Thrown when trying to access posts without selecting a provider
try {
  const posts = await blogService.getAllPosts(agent);
} catch (error) {
  console.error(error.message);
  // "No blog provider is currently selected"
}
```

**2. No Post Selected**

```typescript
// Thrown when trying to update non-existent post
try {
  const currentPost = blogService.getCurrentPost(agent);
  await blogService.updatePost({title: "New Title"}, agent);
} catch (error) {
  console.error(error.message);
  // "No post is currently selected"
}
```

**3. Missing Content**

```typescript
// Thrown by createPost tool when title or content missing
try {
  await agent.executeTool("Blog/createPost", {
    title: "",
    contentInMarkdown: ""
  });
} catch (error) {
  // "Title is required"
  // "Content is required"
}
```

**4. Image Generation Error**

```typescript
// Thrown when no post selected for image generation
try {
  await agent.executeTool("Blog/generateImageForPost", {
    prompt: "Beautiful landscape"
  });
} catch (error) {
  console.error(error.message);
  // "No post currently selected"
}
```

**Error Handling Pattern:**

```typescript
try {
  await blogService.requireActiveBlogProvider(agent);
  const posts = await blogService.getAllPosts(agent);

  if (posts.length === 0) {
    agent.infoMessage("No posts found. Create a new post first.");
  } else {
    // Process posts...
  }
} catch (error) {
  if (error.message.includes("No blog provider")) {
    agent.infoMessage("Please select a blog provider first:");
    agent.infoMessage("/blog provider select");
  } else {
    agent.errorMessage("Failed to fetch posts:", error);
  }
}
```

## Dependencies

The package depends on the following core packages:

- `@tokenring-ai/agent` - Agent orchestration and state management
- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/chat` - Chat service and tool definitions
- `@tokenring-ai/rpc` - Remote procedure call support
- `@tokenring-ai/scripting` - Scripting functionality
- `@tokenring-ai/cdn` - Content delivery network service
- `@tokenring-ai/ai-client` - AI model integration (image generation)
- `@tokenring-ai/utility` - Shared utilities
- `zod` - Schema validation for configuration
- `marked` - Markdown parsing and HTML conversion
- `uuid` - Unique identifier generation

## Testing

The package uses vitest for unit testing:

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Example Test Setup

```typescript
import {describe, expect, it, vi} from 'vitest';
import BlogService from "../BlogService.ts";
import {BlogState} from "../state/BlogState.ts";

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
});
```

## Package Structure

```
pkg/blog/
├── index.ts                      # Main exports
├── plugin.ts                     # Plugin installation and registration
├── README.md                     # This documentation
├── package.json                  # Package configuration
├── schema.ts                     # Configuration schemas
│
├── BlogProvider.ts               # Interface and type definitions
├── BlogService.ts                # Main service implementation
├── state/
│   └── BlogState.ts              # State management class
│
├── tools/                        # Chat service tools
│   ├── createPost.ts             # Tool: Create new post
│   ├── updatePost.ts             # Tool: Update post
│   ├── getAllPosts.ts            # Tool: List posts with filters
│   ├── getCurrentPost.ts         # Tool: Get selected post
│   └── generateImageForPost.ts   # Tool: Generate and set featured image
│
├── commands/                     # Chat command implementations
│   └── blog.ts                   # Main command router
│       ├── post/                 # Post management commands
│       │   ├── get.ts            # Show current post title
│       │   ├── select.ts         # Interactive post selection
│       │   ├── info.ts           # Show post details
│       │   ├── publish.ts        # Publish selected post
│       │   └── clear.ts          # Clear current selection
│       ├── provider/             # Provider management commands
│       │   ├── get.ts            # Show active provider
│       │   ├── select.ts         # Interactive provider selection
│       │   ├── set.ts            # Set provider by name
│       │   └── reset.ts          # Reset to default provider
│       └── test.ts               # Test connection
│
├── rpc/                          # JSON-RPC endpoints
│   ├── blog.ts                   # RPC method implementations
│   └── schema.ts                 # RPC schema definitions
│
└── util/
    └── testBlogConnection.ts     # Connection testing utilities

```

## Plugin Integration Pattern

This package follows the Token Ring plugin integration pattern:

1. **Plugin Registration**: Uses the TokenRingPlugin interface
2. **Service Registration**: Registers BlogService with app.services
3. **Tool Registration**: Registers tools with ChatService via plugin installation
4. **Command Registration**: Registers commands with AgentCommandService
5. **Scripting Functions**: Registers global functions with ScriptingService
6. **RPC Endpoints**: Registers endpoints with RpcService
7. **State Management**: Integrates with Agent state slice system

**Key Integration Points:**

- `install()` method handles all service registrations
- `config` schema defines the plugin configuration structure
- Uses `waitForItemByType()` and `waitForService()` for dependency resolution
- Register functions execute during `install()` phase

## Best Practices

### Provider Development
1. Implement the `BlogProvider` interface completely
2. Use `attach(agent)` to initialize provider state
3. Handle errors gracefully with clear messages
4. Maintain consistent `BlogPost` field types
5. Support all required statuses: draft, published, pending, scheduled, private

### State Management
1. Use `BlogState` for provider and post tracking
2. Implement `transferStateFromParent()` for agent inheritance
3. Use `serialize()/deserialize()` for persistence
4. Can be selectively reset via `reset([what])` parameter

### Tool Development
1. Return tool definitions with proper schemas
2. Use `agent.infoMessage()` for user feedback
3. Validate required parameters
4. Access resources via `agent.requireServiceByType()`
5. Follow naming convention: `bot_<operation>_<component>`

### Error Handling
1. Throw descriptive errors with clear messages
2. Use service methods (`requireActiveBlogProvider`) for validation
3. Return error objects with `success: false` pattern
4. Provide helpful suggestions for resolution

## Migration Notes

### Version 0.2.0+
- Package structure renamed for clarity
- Added comprehensive RPC endpoints
- Enhanced state management with transfer capabilities
- Improved error handling patterns
- Added Markdown header stripping to content inputs

### Breaking Changes
- None (backward compatible API)

## License

MIT License - see the root LICENSE file for details.
