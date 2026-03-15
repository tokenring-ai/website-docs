# @tokenring-ai/reddit

## Overview

The `@tokenring-ai/reddit` package provides Reddit integration for the Token Ring ecosystem. It enables agents to search subreddits, retrieve post content, and fetch the latest posts from communities using Reddit's public JSON API. This package provides both tool-based interactions for chat systems and scripting functions for programmatic access.

The Reddit package integrates seamlessly with the Token Ring agent framework, providing structured, type-safe access to Reddit's vast repository of discussions and information while maintaining compliance with Reddit's API guidelines through proper User-Agent headers.

## Key Features

- **Subreddit Search**: Search posts within specific subreddits with advanced filtering and sorting options
- **Post Retrieval**: Retrieve full post content and comments by URL with automatic JSON parsing
- **Latest Posts**: Get newest posts from subreddits in chronological order
- **Chat Tools Integration**: Three tools registered with the chat service for direct agent interaction
- **Scripting Support**: Global functions available in scripting contexts for automation
- **Type-Safe Configuration**: Zod schema validation for all tool inputs and service configuration
- **Automatic Pagination**: Support for Reddit's pagination mechanism using `after` and `before` cursors
- **Compliant User-Agent**: Automatic User-Agent header for Reddit API compliance
- **Retry Logic**: Built-in retry logic for network requests through HttpService base class

## Core Components

### RedditService

The core service handling all Reddit API communication. This service implements `TokenRingService` and extends the `HttpService` base class to handle HTTP requests with retry logic and automatic JSON parsing.

```typescript
import RedditService from "@tokenring-ai/reddit";

const reddit = new RedditService({
  baseUrl: "https://www.reddit.com"
});
```

### Chat Tools

The plugin registers three tools with the chat service:

1. **reddit_searchSubreddit**: Search posts in a specific subreddit
2. **reddit_retrievePost**: Retrieve a Reddit post's content by URL
3. **reddit_getLatestPosts**: Get the latest posts from a subreddit

### Scripting Functions

The plugin registers three global functions when the scripting service is available:

1. **searchSubreddit(subreddit, query)**: Simple search function
2. **getRedditPost(url)**: Retrieve a post by URL
3. **getLatestPosts(subreddit)**: Get latest posts from a subreddit

## Services

### RedditService

The core service for Reddit API interactions. This service implements `TokenRingService` and extends the `HttpService` base class to handle HTTP requests with retry logic and automatic JSON parsing.

**Service Definition:**

```typescript
class RedditService extends HttpService implements TokenRingService {
  readonly name = "RedditService";
  description = "Service for searching Reddit posts and retrieving content";
  
  constructor(config: ParsedRedditConfig);
  async searchSubreddit(subreddit: string, query: string, opts?: RedditSearchOptions): Promise<any>;
  async retrievePost(postUrl: string): Promise<any>;
  async getLatestPosts(subreddit: string, opts?: RedditListingOptions): Promise<any>;
}
```

**Constructor**

```typescript
constructor(config: ParsedRedditConfig)
```

**Parameters:**
- `config` (ParsedRedditConfig): Configuration object with the following properties:
  - `baseUrl` (string): Base URL for Reddit API (default: "https://www.reddit.com")

**Methods**

#### searchSubreddit

Search posts within a specific subreddit.

```typescript
async searchSubreddit(subreddit: string, query: string, opts?: RedditSearchOptions): Promise<any>
```

**Parameters:**
- `subreddit` (string): Subreddit name without the r/ prefix
- `query` (string): Search query string
- `opts` (RedditSearchOptions, optional): Additional options for the search

**Returns**: Promise containing the search results

**Example:**

```typescript
const results = await reddit.searchSubreddit("programming", "typescript", {
  limit: 10,
  sort: "relevance",
  t: "week"
});
```

#### retrievePost

Retrieve a Reddit post by URL.

```typescript
async retrievePost(postUrl: string): Promise<any>
```

**Parameters:**
- `postUrl` (string): Full URL to the Reddit post

**Returns**: Promise containing the post data and comments

**Example:**

```typescript
const post = await reddit.retrievePost("https://www.reddit.com/r/programming/comments/abc123/my_post/");
```

#### getLatestPosts

Get the latest posts from a subreddit.

```typescript
async getLatestPosts(subreddit: string, opts?: RedditListingOptions): Promise<any>
```

**Parameters:**
- `subreddit` (string): Subreddit name without the r/ prefix
- `opts` (RedditListingOptions, optional): Additional options for the request

**Returns**: Promise containing the latest posts

**Example:**

```typescript
const posts = await reddit.getLatestPosts("technology", {
  limit: 20
});
```

**Configuration Interface**

```typescript
interface ParsedRedditConfig {
  baseUrl: string;  // Default: "https://www.reddit.com"
}
```

**Search Options**

```typescript
interface RedditSearchOptions {
  limit?: number;                                     // Number of results (1-100, default: 25)
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';  // Sort order (default: relevance)
  t?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';   // Time period
  after?: string;                                     // Pagination cursor
  before?: string;                                    // Pagination cursor
}
```

**Listing Options**

```typescript
interface RedditListingOptions {
  limit?: number;   // Number of posts (1-100, default: 25)
  after?: string;   // Pagination cursor
  before?: string;  // Pagination cursor
}
```

## Providers

This package does not use a provider architecture.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands.

## Tools

### reddit_searchSubreddit

Search for posts within a specific subreddit. Returns structured JSON with search results including post titles, authors, scores, and metadata.

**Tool Name**: `reddit_searchSubreddit`

```typescript
await agent.executeTool("reddit_searchSubreddit", {
  subreddit: "programming",
  query: "javascript async await",
  limit: 10,
  sort: "relevance",
  t: "week"
});
```

**Input Schema:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| subreddit | string | Yes | Subreddit name without the r/ prefix |
| query | string | Yes | Search query string |
| limit | number | No | Number of results (1-100, default: 25) |
| sort | enum | No | Sort order: relevance, hot, top, new, comments (default: relevance) |
| t | enum | No | Time period: hour, day, week, month, year, all |
| after | string | No | Fullname of a thing for pagination (get items after this) |
| before | string | No | Fullname of a thing for pagination (get items before this) |

### reddit_retrievePost

Retrieve a Reddit post's content and comments by URL. Returns the full post object including title, author, body text, and comments.

**Tool Name**: `reddit_retrievePost`

```typescript
await agent.executeTool("reddit_retrievePost", {
  postUrl: "https://www.reddit.com/r/programming/comments/abc123/my_post/"
});
```

**Input Schema:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| postUrl | string (url) | Yes | Reddit post URL (e.g., https://www.reddit.com/r/subreddit/comments/id/title/) |

### reddit_getLatestPosts

Get the latest posts from a subreddit. Returns newest posts in chronological order, useful for monitoring trending topics and recent discussions.

**Tool Name**: `reddit_getLatestPosts`

```typescript
await agent.executeTool("reddit_getLatestPosts", {
  subreddit: "technology",
  limit: 20
});
```

**Input Schema:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| subreddit | string | Yes | Subreddit name without the r/ prefix |
| limit | number | No | Number of posts (1-100, default: 25) |
| after | string | No | Fullname of a thing for pagination (get items after this) |
| before | string | No | Fullname of a thing for pagination (get items before this) |

## Configuration

### Plugin Configuration

The Reddit plugin uses a nested configuration schema with a base URL option:

```typescript
interface RedditPluginConfig {
  reddit: {
    baseUrl?: string;  // Optional custom base URL (default: https://www.reddit.com)
  };
}
```

**Example Configuration:**

```typescript
// Default configuration
const config = {
  reddit: {
    baseUrl: "https://www.reddit.com"
  }
};

// Custom base URL
const customConfig = {
  reddit: {
    baseUrl: "https://custom.reddit.com"
  }
};
```

### Service Configuration

The `RedditService` accepts an optional configuration object:

```typescript
interface RedditConfig {
  baseUrl?: string;  // Optional custom base URL (default: https://www.reddit.com)
}
```

**Example:**

```typescript
// Default configuration
const reddit = new RedditService(RedditConfigSchema.parse({}));

// Custom base URL (for testing or alternative instances)
const customReddit = new RedditService({
  baseUrl: "https://www.reddit.com"
});
```

### Request Headers

The service automatically sets a compliant User-Agent header for all requests:

```
User-Agent: TokenRing-Writer/1.0 (https://github.com/tokenring/writer)
```

This header helps identify requests and complies with Reddit's API guidelines.

## Integration

### Agent System Integration

The plugin automatically integrates with the agent system by:

1. Waiting for the `ScriptingService` to register custom functions
2. Registering three custom functions: `searchSubreddit`, `getRedditPost`, `getLatestPosts`
3. Waiting for the `ChatService` to register chat tools
4. Adding three tools to the chat service

### Service Registration

The plugin registers the `RedditService` with the application:

```typescript
app.addServices(new RedditService(config.reddit));
```

### Chat Service Integration

The plugin waits for the `ChatService` and registers its tools:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(tools)
);
```

### Scripting Service Integration

The plugin registers functions with the `ScriptingService`:

```typescript
scriptingService.registerFunction("searchSubreddit", {
  type: 'native',
  params: ['subreddit', 'query'],
  async execute(this: ScriptingThis, subreddit: string, query: string): Promise<string> {
    const result = await this.agent.requireServiceByType(RedditService).searchSubreddit(subreddit, query);
    return JSON.stringify(result.data.children);
  }
});
```

### Package Exports

The package exports the `RedditService` class:

```typescript
// Default export
import RedditService from "@tokenring-ai/reddit";

// Named export
import { RedditService } from "@tokenring-ai/reddit";
```

## Usage Examples

### Basic Search Workflow

```typescript
// Search for relevant discussions
const searchResults = await agent.executeTool("reddit_searchSubreddit", {
  subreddit: "programming",
  query: "best practices 2024",
  limit: 20,
  sort: "top",
  t: "month"
});

// Analyze specific posts
for (const post of searchResults) {
  const postData = await agent.executeTool("reddit_retrievePost", {
    postUrl: `https://www.reddit.com/r/programming/comments/${post.id}/${post.title}/`
  });
}
```

### Content Research

```typescript
// Research a topic across multiple subreddits
const subreddits = ["programming", "learnprogramming", "cscareerquestions"];

for (const sub of subreddits) {
  const results = await agent.executeTool("reddit_searchSubreddit", {
    subreddit: sub,
    query: "career advice beginners",
    limit: 10,
    sort: "top",
    t: "year"
  });
  console.log(`Results from r/${sub}:`, results.length);
}
```

### Monitoring Trending Topics

```typescript
// Get latest posts from trending subreddits
const trendingSubs = ["technology", "science", "news"];

for (const sub of trendingSubs) {
  const posts = await agent.executeTool("reddit_getLatestPosts", {
    subreddit: sub,
    limit: 5
  });
  console.log(`Latest from r/${sub}:`, posts.map(p => p.data.title));
}
```

### Pagination Handling

```typescript
// Get first page of posts
const page1 = await agent.executeTool("reddit_getLatestPosts", {
  subreddit: "technology",
  limit: 25
});

// Get next page using 'after' cursor
const page2 = await agent.executeTool("reddit_getLatestPosts", {
  subreddit: "technology",
  limit: 25,
  after: page1[page1.length - 1].name  // Use last item's fullname
});
```

### Scripting Automation

```typescript
// Search for content across subreddits
const searchResults = await scriptingService.execute(
  'searchSubreddit',
  'webdevelopment',
  'react vs vue'
);

// Parse and process results (results are JSON stringified)
const posts = JSON.parse(searchResults);
posts.forEach((post: any) => {
  console.log(`Title: ${post.data.title}`);
  console.log(`Score: ${post.data.score}`);
});
```

### Direct Service Usage

```typescript
import RedditService from "@tokenring-ai/reddit";

// Create service instance with default configuration
const reddit = new RedditService({});

// Search for posts
const searchResults = await reddit.searchSubreddit("programming", "typescript", {
  limit: 10,
  sort: "relevance"
});

// Get latest posts
const latestPosts = await reddit.getLatestPosts("technology", {
  limit: 20
});

// Retrieve specific post
const postData = await reddit.retrievePost(
  "https://www.reddit.com/r/programming/comments/abc123/post/"
);
```

## Best Practices

### Rate Limiting

- Reddit's API has rate limits. Avoid making excessive requests in quick succession
- Use pagination to limit the number of results when full content is not needed
- Consider caching results for frequently accessed data

### URL Handling

- Always use the full Reddit post URL including the .json extension if needed
- The service automatically appends .json if missing
- URLs should follow the format: `https://www.reddit.com/r/subreddit/comments/id/title/`

### Error Handling

- Wrap API calls in try-catch blocks for robustness
- Handle network errors gracefully with retries
- Validate inputs before making API calls

### Security

- Reddit's JSON API is public and requires no authentication
- No sensitive data is transmitted
- User-Agent header helps identify legitimate requests

## Error Handling

### Error Types

The Reddit service and tools throw errors in the following scenarios:

#### Missing Required Parameters

```typescript
// Error: [reddit_searchSubreddit] subreddit is required
await reddit.searchSubreddit("", "query");

// Error: [reddit_searchSubreddit] query is required
await reddit.searchSubreddit("programming", "");
```

#### Invalid URLs

```typescript
// Error: [reddit_retrievePost] postUrl is required
await reddit.retrievePost("");

// Error: [reddit_retrievePost] Invalid URL
await reddit.retrievePost("not-a-valid-url");
```

#### Network Errors

Network errors are handled by the underlying `HttpService` with retry logic. If all retries fail, an error is thrown with the failure message.

### Error Handling Examples

```typescript
try {
  const results = await agent.executeTool("reddit_searchSubreddit", {
    subreddit: "programming",
    query: "typescript"
  });
  console.log("Search successful:", results);
} catch (error: any) {
  console.error("Search failed:", error.message);
  // Handle the error appropriately
}
```

## State Management

This package does not implement state management. It does not maintain any persistent state slices, and no checkpoint generation or recovery is required.

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Coverage

The package includes vitest for unit testing. Tests cover:

- Service method functionality
- Tool input validation
- Error handling
- Pagination handling

### Build Verification

```bash
# Type-check the package
bun run build
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: TokenRing application framework
- `@tokenring-ai/chat`: Chat service and tool system
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/utility`: Shared utilities including HTTP service
- `@tokenring-ai/scripting`: Scripting service (used by plugin)
- `zod`: Schema validation

### Development Dependencies

- `vitest`: Test runner
- `@vitest/coverage-v8`: Test coverage reporting
- `typescript`: TypeScript compiler (uses root tsconfig.json)

## Installation

```bash
bun install @tokenring-ai/reddit
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
