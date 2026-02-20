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
- Review pattern escalation for publishing workflows

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

## Core Properties

### BlogConfigSchema

The blog package is configured through the `BlogConfigSchema`:

```typescript
export const BlogConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),
  agentDefaults: BlogAgentConfigSchema,
});

export const BlogAgentConfigSchema = z.object({
  provider: z.string().optional(),
  reviewPatterns: z.array(z.string()).optional(),
  reviewEscalationTarget: z.string().optional(),
}).default({});
```

### Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `providers` | `Record<string, any>` | Object mapping provider names to their configuration objects |
| `agentDefaults` | `BlogAgentConfigSchema` | Default configuration for agents using this blog service |
| `provider` | `string` | Optional string specifying the default blog provider |
| `reviewPatterns` | `string[]` | Array of regex patterns that trigger review escalation |
| `reviewEscalationTarget` | `string` | Email or identifier for review escalation |

## Key Features

### Multi-Provider Support

The blog service supports multiple blog providers through the `BlogProvider` interface, allowing you to work with different blogging platforms through a unified API.

### AI-Powered Image Generation

Generate and attach AI-generated images to blog posts using the `generateImageForPost` tool with configurable aspect ratios (square, tall, wide).

### Review Pattern Escalation

Configure review patterns that trigger human review before publishing posts that match specific content criteria.

### JSON-RPC Endpoints

Comprehensive RPC endpoints for programmatic access to blog operations, including post creation, updates, and management.

### State Management

Robust state management through `BlogState` for tracking active providers, current posts, and review configurations.

## Core Methods/API

### BlogService Methods

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
async getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>
```
Retrieve recent posts with optional filtering by keyword, status, and limit.

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

### BlogProvider Interface

```typescript
interface BlogProvider {
  description: string;
  imageGenerationModel: string;
  cdnName: string;
  
  attach(agent: Agent): void;
  getAllPosts(agent: Agent): Promise<BlogPost[]>;
  getRecentPosts(filter: BlogPostFilterOptions, agent: Agent): Promise<BlogPost[]>;
  createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>;
  updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>;
  selectPostById(id: string, agent: Agent): Promise<BlogPost>;
  getCurrentPost(agent: Agent): BlogPost | null;
  clearCurrentPost(agent: Agent): Promise<void>;
}
```

### Chat Commands

| Command | Description |
|---------|-------------|
| `/blog provider get` | Display the currently active blog provider |
| `/blog provider select` | Select an active blog provider interactively |
| `/blog provider set <name>` | Set a specific blog provider by name |
| `/blog provider reset` | Reset to the initial configured blog provider |
| `/blog post get` | Display the currently selected post title |
| `/blog post select` | Select an existing article or clear selection |
| `/blog post info` | Display detailed information about the selected post |
| `/blog post clear` | Clears the current post selection |
| `/blog post publish` | Publish the currently selected post |

### RPC Endpoints

| Endpoint | Type | Description |
|----------|------|-------------|
| `getCurrentPost` | GET | Get the currently selected post |
| `getAllPosts` | GET | Get all posts with optional filtering |
| `getActiveProvider` | GET | Get the currently active provider |
| `createPost` | POST | Create a new blog post |
| `updatePost` | POST | Update an existing blog post |
| `selectPostById` | POST | Select a post by ID |
| `clearCurrentPost` | POST | Clear current post selection |
| `publishPost` | POST | Publish the currently selected post |
| `setActiveProvider` | POST | Set the active blog provider |
| `generateImageForPost` | POST | Generate and attach an AI image |

## Configuration

### BlogConfigSchema

Setup configures blog providers and agent defaults:

```typescript
export const BlogConfigSchema = z.object({
  providers: z.record(z.string(), z.any()),
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

### Configuration Properties

#### providers
- **Type**: `Record<string, any>`
- **Required**: Yes
- **Description**: Object mapping provider names to their configuration objects

#### agentDefaults
- **Type**: `BlogAgentConfigSchema`
- **Required**: No
- **Description**: Default configuration for agents using this blog service

##### agentDefaults properties:
- **provider**: Optional string specifying the default blog provider
- **reviewPatterns**: Array of regex patterns that trigger review escalation
- **reviewEscalationTarget**: Email or identifier for review escalation

## Integration

### Plugin Registration

The plugin integrates with the TokenRing application framework through the plugin system:

```typescript
import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {RpcService} from "@tokenring-ai/rpc";
import {ScriptingService} from "@tokenring-ai/scripting";
import {ScriptingThis} from "@tokenring-ai/scripting/ScriptingService";
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
      scriptingService.registerFunction(
        "createPost", {
          type: 'native',
          params: ['title', 'content'],
          async execute(this: ScriptingThis, title: string, content: string): Promise<string> {
            const post = await this.agent.requireServiceByType(BlogService).createPost({title, content}, this.agent);
            return `Created post: ${post.id}`;
          }
        });

      scriptingService.registerFunction("updatePost", {
          type: 'native',
          params: ['title', 'content'],
          async execute(this: ScriptingThis, title: string, content: string): Promise<string> {
            const post = await this.agent.requireServiceByType(BlogService).updatePost({title, content}, this.agent);
            return `Updated post: ${post.id}`;
          }
        }
      );

      scriptingService.registerFunction("getCurrentPost", {
          type: 'native',
          params: [],
          async execute(this: ScriptingThis): Promise<string> {
            const post = this.agent.requireServiceByType(BlogService).getCurrentPost(this.agent);
            return post ? JSON.stringify(post) : 'No post selected';
          }
        }
      );

      scriptingService.registerFunction("getAllPosts", {
          type: 'native',
          params: [],
          async execute(this: ScriptingThis): Promise<string> {
            const posts = await this.agent.requireServiceByType(BlogService).getAllPosts(this.agent);
            return JSON.stringify(posts);
          }
        }
      );
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

### State Management

The blog plugin maintains session state through `BlogState`:

```typescript
import {BlogState} from "@tokenring-ai/blog";

// Initialize state
agent.initializeState(BlogState, {provider: "wordpress", reviewPatterns: ["(?:confidential)"], reviewEscalationTarget: "manager@example.com"});

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
newState.deserialize(data);
```

### Provider Integration

Create a concrete implementation of `BlogProvider` for your specific blog platform:

```typescript
import { BlogProvider, type BlogPost, type CreatePostData, type UpdatePostData } from '@tokenring-ai/blog';
import { Agent } from '@tokenring-ai/agent';

class CustomBlogProvider implements BlogProvider {
  description = "Custom blog integration";
  imageGenerationModel = "gpt-4";
  cdnName = "custom-cdn";

  attach(agent: Agent): void {
    // Initialize client connections here
  }

  async getAllPosts(agent: Agent): Promise<BlogPost[]> {
    // Fetch posts from your platform's API
    const response = await fetch('https://api.yourblog.com/posts');
    const rawData = await response.json();

    // Convert platform-specific structure to BlogPost format
    return rawData.map(mapPlatformPostToBlogPost);
  }

  // ... other required methods
}
```

## Best Practices

### Provider Development
1. Implement the `BlogProvider` interface completely
2. Use `attach(agent)` to initialize provider state
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

MIT License - see [LICENSE](./LICENSE) file for details.
