# Blog Plugin

Abstract blog service interface for managing blog posts across different platforms.

## Overview

The `@tokenring-ai/blog` package provides an abstract blog service interface for managing blog posts across different platforms. It defines a standardized interface for blog operations that concrete implementations (e.g., WordPress, Ghost.io) can extend.

## Key Features

- Abstract interface for multiple blog platforms
- Post creation and management
- Post selection and retrieval
- Unified API across different blog providers
- Integration with scripting system

## Core Components

### BlogProvider (Abstract Base Class)

The abstract `BlogProvider` class defines a standardized interface for blog operations.

**Key Methods:**
- `getAllPosts(): Promise<BlogPost[]>` - Get all posts
- `createPost(data: CreatePostData): Promise<BlogPost>` - Create a new post
- `updatePost(data: UpdatePostData): Promise<BlogPost>` - Update existing post
- `getCurrentPost(): BlogPost | null` - Get currently selected post
- `selectPostById(id: string): Promise<BlogPost>` - Select a post by ID
- `clearCurrentPost(): Promise<void>` - Clear current selection

### BlogService

Manages multiple blog providers and provides a unified interface for blog operations.

**Key Methods:**
- `registerBlog(name, provider)` - Register a blog provider
- `getAllPosts(agent)` - Get all posts from active blog
- `createPost(data, agent)` - Create a new post
- `updatePost(data, agent)` - Update existing post
- `publishPost(agent)` - Publish the current post

### Tools

**createPost**: Create a new blog post
- Input: `{ title: string, content: string, tags?: string[] }`

**updatePost**: Update the currently selected post
- Input: `{ title?: string, content?: string, tags?: string[] }`

**getAllPosts**: Get all posts from the active blog

**getCurrentPost**: Get the currently selected post

**generateImageForPost**: Generate and set a featured image for the current post

## Global Scripting Functions

When `@tokenring-ai/scripting` is available:

- **createPost(title, content)**: Creates a new blog post
  ```bash
  /var $result = createPost("My Title", "Post content here")
  /call createPost("Article", "Content")
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

## Usage Example

```typescript
import { BlogService } from '@tokenring-ai/blog';

// Concrete implementations extend BlogProvider
class MyBlogProvider extends BlogProvider {
  async getAllPosts(agent: Agent): Promise<BlogPost[]> {
    // Implementation specific logic
  }
  
  async createPost(data: CreatePostData, agent: Agent): Promise<BlogPost> {
    // Implementation specific logic
  }
}

// Use with agent
const blogService = new BlogService();
blogService.registerBlog('myBlog', new MyBlogProvider());
agent.addService(blogService);
```

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/scripting@0.1.0`: Optional, for global functions

## Implementations

See `@tokenring-ai/wordpress` and `@tokenring-ai/ghost-io` for concrete implementations.
