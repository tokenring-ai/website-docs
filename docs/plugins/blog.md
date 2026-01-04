# Blog Plugin

## Overview

The Blog plugin provides an abstract blog service interface for managing blog posts across different platforms. It offers a unified API for creating, updating, and managing blog posts with support for multiple blog providers, enabling seamless integration with the TokenRing AI ecosystem.

## Installation

```bash
bun install @tokenring-ai/blog
```

## Key Features

- **Unified API**: Standardized interface across multiple blog platforms
- **Multi-Provider Support**: Works with WordPress, Medium, Ghost, and custom blog providers
- **AI Image Generation**: Generate featured images using AI models
- **State Management**: Persistent post selection and provider state
- **Chat Command Integration**: Interactive commands for blog management
- **Scripting Support**: Global functions for programmatic access
- **CDN Integration**: Automatic image uploads to configured CDN service
- **Type-Safe Configuration**: Zod-based schema validation

## Core Components

### BlogProvider Interface

The `BlogProvider` interface defines the contract for blog provider implementations:

```typescript
export interface BlogPost &#123;
  id: string;
  title: string;
  content?: string;
  status: 'draft' | 'published' | 'scheduled' | 'pending' | 'private';
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  feature_image?: &#123;
    id?: string;
    url?: string;
  &#125;
  url?: string;
&#125;

export type CreatePostData = Omit&lt;BlogPost, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'status'&gt;;

export type UpdatePostData = Partial&lt;Omit&lt;BlogPost, 'id' | 'created_at' | 'updated_at'&gt;&gt;;

export interface BlogProvider &#123;
  description: string;
  imageGenerationModel: string;
  cdnName: string;

  attach(agent: Agent): Promise&lt;void&gt;;
  getAllPosts(agent: Agent): Promise&lt;BlogPost[]&gt;;
  createPost(data: CreatePostData, agent: Agent): Promise&lt;BlogPost&gt;;
  updatePost(data: UpdatePostData, agent: Agent): Promise&lt;BlogPost&gt;;
  selectPostById(id: string, agent: Agent): Promise&lt;BlogPost&gt;;
  getCurrentPost(agent: Agent): BlogPost | null;
  clearCurrentPost(agent: Agent): Promise&lt;void;
&#125;
```

### BlogService

The `BlogService` class manages blog providers and post operations:

```typescript
export default class BlogService implements TokenRingService &#123;
  name = "BlogService";
  description = "Abstract interface for blog operations";

  registerBlog(provider: BlogProvider): void;
  getAvailableBlogs(): string[];
  async attach(agent: Agent): Promise&lt;void&gt;;
  setActiveProvider(name: string, agent: Agent): void;
  async getAllPosts(agent: Agent): Promise&lt;BlogPost[]&gt;;
  async createPost(data: CreatePostData, agent: Agent): Promise&lt;BlogPost&gt;;
  async updatePost(data: UpdatePostData, agent: Agent): Promise&lt;BlogPost&gt;;
  getCurrentPost(agent: Agent): BlogPost | null;
  async selectPostById(id: string, agent: Agent): Promise&lt;BlogPost&gt;;
  async clearCurrentPost(agent: Agent): Promise&lt;void&gt;;
  async publishPost(agent: Agent): Promise&lt;void&gt;;
&#125;
```

### BlogState

The `BlogState` class manages state for blog operations:

```typescript
export class BlogState implements AgentStateSlice &#123;
  name = "BlogState";
  activeProvider: string | null;

  constructor(readonly initialConfig: z.output&lt;typeof BlogAgentConfigSchema&gt;);
  transferStateFromParent(parent: Agent): void;
  reset(what: ResetWhat[]): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
&#125;
```

## Chat Commands

The plugin provides the following chat commands through the AgentCommandService:

### Provider Management

- `/blog provider get` - Display the currently active blog provider
- `/blog provider select` - Select an active blog provider interactively
- `/blog provider set &lt;name&gt;` - Set a specific blog provider by name
- `/blog provider reset` - Reset to the initial configured blog provider

### Post Management

- `/blog post get` - Display the currently selected post title
- `/blog post select` - Select an existing article or clear selection
- `/blog post info` - Display information about the currently selected post
- `/blog post clear` - Clears the current post selection
- `/blog post publish` - Publish the currently selected post

### Testing

- `/blog test` - Test blog connection by creating a post and uploading an image

## Tools

The plugin provides the following tools through the ChatService:

### blog_createPost

Creates a new blog post with title, content, and tags.

**Input Schema:**
```typescript
&#123;
  title: z.string().describe("Title of the blog post"),
  contentInMarkdown: z.string().describe("The content of the post in Markdown format. The title of the post goes in the title tag, NOT inside the content"),
  tags: z.array(z.string()).describe("Tags for the post").optional()
&#125;
```

### blog_updatePost

Updates the currently selected blog post.

**Input Schema:**
```typescript
&#123;
  title: z.string().describe("New title for the post").optional(),
  contentInMarkdown: z.string().describe("The content of the post in Markdown format. The title of the post goes in the title tag, NOT inside the content").optional(),
  tags: z.array(z.string()).describe("New tags for the post").optional()
&#125;
```

### blog_getAllPosts

Gets all posts from a blog service with filtering options.

**Input Schema:**
```typescript
&#123;
  status: z.enum(['draft', 'published', 'all']).default('all').optional(),
  tag: z.string().describe("Filter by tag").optional(),
  limit: z.number().int().positive().default(10).optional()
&#125;
```

### blog_getCurrentPost

Gets the currently selected post.

**Input Schema:**
```typescript
&#123;&#125;
```

### blog_generateImageForPost

Generates an AI image and sets it as the featured image for the currently selected post.

**Input Schema:**
```typescript
&#123;
  prompt: z.string().describe("Description of the image to generate"),
  aspectRatio: z.enum(['square', 'tall', 'wide']).default('square').optional()
&#125;
```

## Scripting Functions

The plugin registers the following global scripting functions:

### createPost(title: string, content: string)

Creates a new blog post with the given title and content.

**Parameters:**
- `title` (string): Title of the blog post (required)
- `content` (string): Markdown-formatted content (required)

**Returns:** String containing the ID of the created post

**Example:**
```typescript
await scriptingService.createPost("My First Post", "## Hello World\nThis is a test post.");
```

### updatePost(title: string, content: string)

Updates an existing blog post or creates a new one if not found.

**Parameters:**
- `title` (string): Title of the blog post to update (required)
- `content` (string): New content in Markdown format (required)

**Returns:** String containing the ID of the updated post

**Example:**
```typescript
await scriptingService.updatePost("My First Post", "Updated content here.");
```

### getCurrentPost()

Retrieves the currently selected post.

**Returns:** JSON string of the current post or "No post selected" if none selected

**Example:**
```typescript
const currentPost = await scriptingService.getCurrentPost();
```

### getAllPosts()

Returns all available posts.

**Returns:** JSON string containing an array of blog posts

**Example:**
```typescript
const posts = await scriptingService.getAllPosts();
```

## Configuration

The plugin is configured through the `blog` section in the Token Ring configuration.

**Configuration Schema:**

```typescript
const BlogAgentConfigSchema = z.object(&#123;
  provider: z.string().optional()
&#125;).default(&#123;&#125;);

const BlogConfigSchema = z.object(&#123;
  providers: z.record(z.string(), z.any()),
  agentDefaults: BlogAgentConfigSchema,
&#125;);
```

**Example Configuration:**

```json
&#123;
  "blog": &#123;
    "providers": &#123;
      "wordpress": &#123;
        "url": "https://example.com/wp-json",
        "username": "admin",
        "password": "secret"
      &#125;
    &#125;,
    "agentDefaults": &#123;
      "provider": "wordpress"
    &#125;
  &#125;
&#125;
```

## Usage Examples

### Basic Setup

```typescript
import &#123; BlogService &#125; from '@tokenring-ai/blog';

const blogService = new BlogService(&#123;
  providers: &#123;
    wordpress: wordpressProvider,
    // other providers
  &#125;,
  agentDefaults: &#123;
    provider: 'wordpress'
  &#125;
&#125;);

await blogService.attach(agent);
```

### Creating a Post

```typescript
const blogService = agent.requireServiceByType(BlogService);
const newPost = await blogService.createPost(&#123;
  title: 'My New Post',
  content: 'This is the content in **Markdown** format.',
  tags: ['technology', 'ai']
&#125;, agent);
```

### Using Chat Commands

```bash
# Provider management
/blog provider get
/blog provider select
/blog provider set wordpress
/blog provider reset

# Post management
/blog post get
/blog post select
/blog post info
/blog post clear
/blog post publish

# Testing
/blog test
```

### Using Tools

```typescript
// Using tools directly
await tools.createPost(&#123;
  title: "My New Post",
  contentInMarkdown: "## Introduction\n\nThis is my new post content.",
  tags: ["technology", "ai"]
&#125;);

await tools.updatePost(&#123;
  title: "Updated Title",
  contentInMarkdown: "Updated content here.",
  tags: ["updated"]
&#125;);

const result = await tools.getAllPosts(&#123;
  status: "draft",
  limit: 10
&#125;);

await tools.generateImageForPost(&#123;
  prompt: "A beautiful sunset over the ocean",
  aspectRatio: "wide"
&#125;);
```

### Using Scripting Functions

```typescript
// Create a new post
await scriptingService.createPost("My Blog Post", "This is the content in **Markdown** format.");

// Update the post
await scriptingService.updatePost("My Blog Post", "Updated content with **bold text**.");

// Get all posts
const posts = await scriptingService.getAllPosts();
console.log(posts);

// Get current post
const currentPost = await scriptingService.getCurrentPost();
```

## Integration

### Agent System

- Registers commands via `AgentCommandService`
- Registers tools via `ChatService`
- Uses `BlogState` for persisting active provider and post selection

### Scripting Service

Registers global functions:
- `createPost(title, content)`
- `updatePost(title, content)`
- `getCurrentPost()`
- `getAllPosts()`

### CDN Integration

- Automatically uploads generated images to the configured CDN service
- Uses the CDN name specified by the active blog provider

### AI Client Integration

- Uses the image generation model specified by the blog provider
- Supports various AI models for generating featured images

## Best Practices

- Always validate input before creating or updating posts
- Use `/blog provider select` to ensure correct provider is active
- For image generation, provide detailed prompts for better results
- Handle errors in scripting functions to ensure robustness
- Clear post selection after publishing with `/blog post clear`
- Use the `/blog test` command to verify blog connection

## Error Handling

The package provides comprehensive error handling:

- **Provider Errors**: Clear messages when providers are not registered
- **Validation Errors**: Zod validation for all inputs
- **State Errors**: Handling invalid post selections
- **Service Errors**: Proper handling of missing dependencies
- **API Errors**: Descriptive messages for provider API failures

## Testing and Development

### Running Tests

```bash
# Run tests
vitest run

# Run tests with coverage
vitest run --coverage

# Run tests in watch mode
vitest
```

### Test Coverage

Test cases cover:
- Post creation and update
- Provider selection and switching
- Image generation workflow
- Error handling scenarios
- State management and persistence

### Development Setup

1. Install dependencies: `bun install`
2. Run type checking: `bun run build`
3. Run tests: `vitest run`

## Related Components

- `@tokenring-ai/agent`: Core agent orchestration system
- `@tokenring-ai/chat`: Chat interface and command handling
- `@tokenring-ai/scripting`: Scripting service for programmatic access
- `@tokenring-ai/cdn`: Content delivery network for media uploads
- `@tokenring-ai/ai-client`: AI model integration for image generation
- `@tokenring-ai/utility`: Shared utilities and helpers
- `zod`: Schema validation for configuration
- `marked`: Markdown rendering library
- `uuid`: Unique identifier generation for posts

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
