# Blog Plugin

Abstract blog service interface for managing blog posts across different platforms with comprehensive post creation, management, and publishing capabilities.

## Overview

The `@tokenring-ai/blog` package provides a powerful abstraction layer for managing blog posts across multiple platforms. It offers a unified API for blog operations, state management, and tool integration that works with concrete implementations like WordPress and Ghost.io.

## Key Features

- **Unified API Interface**: Abstract interface for multiple blog platforms with consistent methods
- **Post Lifecycle Management**: Create, update, publish, and manage posts with full status tracking
- **State Management**: Active provider and post selection with persistent state
- **Tool Integration**: Complete set of tools for chat-based blog management
- **Command Interface**: Interactive command system for provider and post management
- **Image Generation**: AI-powered featured image generation and CDN integration
- **Filtering and Search**: Advanced post filtering by status and tags
- **Provider Registry**: Multi-provider support with easy switching

## Core Components

### BlogProvider Interface

The `BlogProvider` interface defines the standardized contract for blog operations across different platforms:

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
  };
  url?: string;
}

export type CreatePostData = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'status'>;
export type UpdatePostData = Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>>;

export interface BlogProvider {
  description: string;
  
  imageGenerationModel: string;
  cdnName: string;

  attach(agent: Agent): Promise<void>;

  getAllPosts(agent: Agent): Promise<BlogPost[]>;

  createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>;

  updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>;

  selectPostById(id: string, agent: Agent): Promise<BlogPost>;

  getCurrentPost(agent: Agent): BlogPost | null;

  clearCurrentPost(agent: Agent): Promise<void>;
}
```

### BlogService

Manages multiple blog providers and provides a unified interface for blog operations:

```typescript
export default class BlogService implements TokenRingService {
  name = "BlogService";
  description = "Abstract interface for blog operations";

  // Register and manage blog providers
  registerBlog(provider: BlogProvider): void;
  getAvailableBlogs(): string[];

  // Post operations
  createPost(data: CreatePostData, agent: Agent): Promise<BlogPost>;
  updatePost(data: UpdatePostData, agent: Agent): Promise<BlogPost>;
  getAllPosts(agent: Agent): Promise<BlogPost[]>;
  
  // Post selection and management
  selectPostById(id: string, agent: Agent): Promise<BlogPost>;
  getCurrentPost(agent: Agent): BlogPost | null;
  clearCurrentPost(agent: Agent): Promise<void>;
  publishPost(agent: Agent): Promise<void>;
}
```

## Available Tools

### createPost

Create a new blog post with title and content.

- **Input Schema**: 
  ```typescript
  {
    title: string,
    contentInMarkdown: string,
    tags?: string[]
  }
  ```
- **Description**: Creates a new blog post using Markdown content
- **Returns**: Created BlogPost object
- **Example**:
  ```typescript
  await agent.useTool('blog_createPost', {
    title: 'My New Post',
    contentInMarkdown: '# My New Post\\n\\nThis is the content of my post.',
    tags: ['technology', 'ai']
  });
  ```

### updatePost

Update the currently selected blog post.

- **Input Schema**: 
  ```typescript
  {
    title?: string,
    contentInMarkdown?: string,
    tags?: string[]
  }
  ```
- **Description**: Updates the currently selected post with new content or metadata
- **Returns**: Updated BlogPost object
- **Example**:
  ```typescript
  await agent.useTool('blog_updatePost', {
    title: 'Updated Title',
    contentInMarkdown: '## Updated Content\\n\\nNew content here.',
    tags: ['updated', 'blog']
  });
  ```

### getAllPosts

Get all posts from the active blog with filtering options.

- **Input Schema**: 
  ```typescript
  {
    status?: 'draft' | 'published' | 'all',
    tag?: string,
    limit?: number
  }
  ```
- **Description**: Retrieves posts with optional filtering by status and tags
- **Returns**: Array of BlogPost objects with metadata
- **Example**:
  ```typescript
  await agent.useTool('blog_getAllPosts', {
    status: 'published',
    limit: 10
  });
  ```

### getCurrentPost

Get the currently selected post.

- **Input Schema**: `{}` (no parameters)
- **Description**: Retrieves the currently selected post or indicates no selection
- **Returns**: BlogPost object or error if no post selected
- **Example**:
  ```typescript
  await agent.useTool('blog_getCurrentPost', {});
  ```

### generateImageForPost

Generate an AI image and set it as the featured image for the current post.

- **Input Schema**: 
  ```typescript
  {
    prompt: string,
    aspectRatio?: 'square' | 'tall' | 'wide'
  }
  ```
- **Description**: Generates an AI image using configured model and uploads to CDN
- **Returns**: Image upload result with URL
- **Example**:
  ```typescript
  await agent.useTool('blog_generateImageForPost', {
    prompt: 'A beautiful sunset over mountains',
    aspectRatio: 'wide'
  });
  ```

## Command Interface

The plugin provides an interactive `/blog` command system for managing blogs and posts.

### Provider Management

- `/blog provider select` - Interactively select an active blog provider
- `/blog provider set <name>` - Directly set an active provider by name

### Post Management

- `/blog post select` - Select an existing post or clear selection
- `/blog post info` - Display information about the currently selected post
- `/blog post new` - Clear selection and start new post
- `/blog post publish` - Publish the currently selected post

### Testing

- `/blog test` - Run comprehensive connection test with post creation and image upload

## Global Scripting Functions

When `@tokenring-ai/scripting` is available, the following functions are automatically registered:

- **createPost(title, content)**: Creates a new blog post
  ```bash
  /var $result = createPost("My Title", "Post content here")
  ```

- **updatePost(title, content)**: Updates the currently selected post
  ```bash
  /var $result = updatePost("New Title", "Updated content")
  ```

- **getCurrentPost()**: Gets the currently selected post as JSON
  ```bash
  /var $post = getCurrentPost()
  ```

- **getAllPosts()**: Gets all posts as JSON
  ```bash
  /var $posts = getAllPosts()
  ```

## Usage Examples

### Basic Integration

```typescript
import { BlogService } from '@tokenring-ai/blog';

// Concrete implementations extend BlogProvider
class MyBlogProvider implements BlogProvider {
  async getAllPosts(agent: Agent): Promise<BlogPost[]> {
    // Platform-specific implementation
  }
  
  async createPost(data: CreatePostData, agent: Agent): Promise<BlogPost> {
    // Platform-specific implementation
  }
}

// Use with agent
const blogService = new BlogService();
blogService.registerBlog('myBlog', new MyBlogProvider());
agent.addService(blogService);
```

### Using the Command Interface

```typescript
// In chat interface
/blog provider select  // Choose from available providers
/blog post select     // Select a post to work with
/blog post info       // View post details
/blog post new        // Start creating a new post
/blog post publish    // Publish the selected post
```

### Using Tools Programmatically

```typescript
import { BlogService } from '@tokenring-ai/blog';

const blogService = agent.requireServiceByType(BlogService);

// Create a new post
const newPost = await blogService.createPost({
  title: 'AI Blog Post',
  content: 'Content in HTML format',
  tags: ['ai', 'technology']
}, agent);

// Update the current post
const updatedPost = await blogService.updatePost({
  title: 'Updated Title',
  content: 'Updated content'
}, agent);

// Get all posts with filtering
const posts = await blogService.getAllPosts(agent);
```

## Configuration

### Blog Configuration Schema

```typescript
import {z} from "zod";

export const BlogConfigSchema = z.object({
  providers: z.record(z.string(), z.any()).optional()
});
```

### Environment Setup

- Ensure `@tokenring-ai/app` is installed and configured
- Register the BlogService with your application
- Configure providers in the app configuration

## Dependencies

- `@tokenring-ai/agent`: Core agent framework and state management
- `@tokenring-ai/app`: Application service management
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/scripting`: Scripting function registration
- `@tokenring-ai/cdn`: CDN service for image uploads
- `@tokenring-ai/ai-client`: AI client for image generation
- `marked`: Markdown parsing and conversion
- `uuid`: Unique identifier generation

## Provider Implementations

See the following implementations for concrete blog platform support:

- `@tokenring-ai/wordpress`: WordPress integration
- `@tokenring-ai/ghost-io`: Ghost.io integration

## Testing

The plugin includes comprehensive testing with:

- Unit tests using vitest
- Integration tests for tool functionality
- Command interface testing
- Provider connection testing

Run tests with:
```bash
bun run test
```

## Development

### Package Structure

```
pkg/blog/
├── BlogProvider.ts          # Interface definitions
├── BlogService.ts           # Main service implementation
├── state/BlogState.ts       # State management
├── tools/                   # Tool implementations
│   ├── createPost.ts
│   ├── updatePost.ts
│   ├── getAllPosts.ts
│   ├── getCurrentPost.ts
│   └── generateImageForPost.ts
├── commands/blog.ts         # Chat commands
├── chatCommands.ts          # Command registration
└── plugin.ts                # Plugin installation
```

### Package.json Dependencies

```json
{
  "dependencies": {
    "@tokenring-ai/ai-client": "0.2.0",
    "@tokenring-ai/app": "0.2.0", 
    "@tokenring-ai/cdn": "0.2.0",
    "zod": "catalog:",
    "@tokenring-ai/agent": "0.2.0",
    "@tokenring-ai/chat": "0.2.0",
    "@tokenring-ai/utility": "0.2.0",
    "@tokenring-ai/scripting": "0.2.0",
    "marked": "^17.0.1",
    "uuid": "^13.0.0"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```