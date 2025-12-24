# Reddit Plugin

Reddit integration for searching subreddit posts, retrieving post content, and monitoring latest content via Reddit's JSON API.

## Overview

The `@tokenring-ai/reddit` package provides comprehensive Reddit integration through a robust service layer and comprehensive tool suite. It enables AI agents to search Reddit posts, retrieve full post content with comments, and monitor latest posts from subreddits - all with built-in error handling, retry logic, and proper API compliance.

## Key Features

- **Subreddit Search**: Search posts within specific subreddits with various sorting options
- **Post Retrieval**: Retrieve full post content including comments
- **Latest Posts**: Get the newest posts from subreddits in chronological order
- **Pagination Support**: Cursor-based pagination for large datasets
- **Retry Logic**: Built-in retry mechanism for API requests
- **Scripting Functions**: Global functions when `@tokenring-ai/scripting` is available
- **Tool Integration**: Three built-in tools for chat and agent integration

## Core Components

### RedditService

Main service for Reddit API interactions with comprehensive error handling:

```typescript
import { default as RedditService } from "@tokenring-ai/reddit";

const reddit = new RedditService({
  baseUrl: "https://www.reddit.com"
});
```

**Configuration Options:**
```typescript
interface RedditConfig {
  baseUrl?: string;  // Optional custom base URL (default: 'https://www.reddit.com')
}
```

**Core Methods:**

**Subreddit Search:**
- `searchSubreddit(subreddit, query, options)`: Search posts within specific subreddits
- `getLatestPosts(subreddit, options)`: Get latest posts from a subreddit

**Post Retrieval:**
- `retrievePost(postUrl)`: Retrieve full post content and comments

## Tools

Three built-in tools are automatically registered when the plugin is installed:

### searchSubreddit Tool

Search for posts within specific subreddits:

```typescript
import searchSubreddit from "./tools/searchSubreddit";

// Execute through agent
await searchSubreddit.execute({
  subreddit: "programming",
  query: "javascript async await",
  limit: 10,
  sort: "relevance",
  t: "week"
}, agent);
```

**Input Schema:**
```typescript
{
  subreddit: string;        // Subreddit name (without r/ prefix)
  query: string;            // Search query string
  limit?: number;           // Number of results (1-100, default: 25)
  sort?: 'relevance'|'hot'|'top'|'new'|'comments';  // Sort order
  t?: 'hour'|'day'|'week'|'month'|'year'|'all';      // Time period for sorting
  after?: string;           // Pagination cursor
  before?: string;          // Pagination cursor
}
```

### retrievePost Tool

Retrieve full post content by URL:

```typescript
import retrievePost from "./tools/retrievePost";

await retrievePost.execute({
  postUrl: "https://www.reddit.com/r/programming/comments/abc123/my_post_title/"
}, agent);
```

**Input Schema:**
```typescript
{
  postUrl: string;  // Reddit post URL (e.g., https://www.reddit.com/r/subreddit/comments/id/title/)
}
```

### getLatestPosts Tool

Get latest posts from a subreddit:

```typescript
import getLatestPosts from "./tools/getLatestPosts";

await getLatestPosts.execute({
  subreddit: "technology",
  limit: 20
}, agent);
```

**Input Schema:**
```typescript
{
  subreddit: string;        // Subreddit name (without r/ prefix)
  limit?: number;           // Number of posts (1-100, default: 25)
  after?: string;           // Pagination cursor
  before?: string;          // Pagination cursor
}
```

## Global Scripting Functions

When `@tokenring-ai/scripting` is available, these functions are automatically registered as global functions:

- `searchSubreddit(subreddit, query)`: Search subreddit posts
- `getRedditPost(url)`: Retrieve post by URL
- `getLatestPosts(subreddit)`: Get latest subreddit posts

**Usage Examples:**
```javascript
// Research workflow
var posts = searchSubreddit("MachineLearning", "transformers");
var analysis = llm("Analyze these Reddit discussions: " + posts);

// Monitor subreddit
var latest = getLatestPosts("technology");
var summary = llm("Summarize today's tech news: " + latest);

// Post retrieval
var post = getRedditPost("https://www.reddit.com/r/programming/comments/abc123/title/");
```

## Plugin Integration

The package automatically integrates with TokenRing applications through its plugin system:

```typescript
import redditPlugin from "@tokenring-ai/reddit/plugin";

app.install(redditPlugin);
```

The plugin provides:
1. **Service Registration**: Automatically registers RedditService with the application
2. **Tool Registration**: Registers three tools with the chat service
3. **Scripting Functions**: Registers global functions when @tokenring-ai/scripting is available
4. **Error Handling**: Comprehensive error handling and validation

## Available Commands

When the plugin is installed, these commands become available through the chat interface:

- `/reddit searchSubreddit subreddit=programming query=javascript limit=10`
- `/reddit getLatestPosts subreddit=technology`
- `/reddit retrievePost postUrl=https://www.reddit.com/r/programming/comments/abc123/title/`

## Usage Examples

### Basic Service Usage

```typescript
import { default as RedditService } from "@tokenring-ai/reddit";

const reddit = new RedditService();

// Search posts in subreddit
const results = await reddit.searchSubreddit("programming", "javascript", {
  limit: 10,
  sort: "relevance",
  t: "week"
});

// Get latest posts
const latest = await reddit.getLatestPosts("technology", {
  limit: 20
});

// Retrieve specific post
const post = await reddit.retrievePost("https://www.reddit.com/r/programming/comments/abc123/my_post/");
```

### Agent Tool Integration

```typescript
// Search subreddit
const searchResults = await agent.executeTool("reddit/searchSubreddit", {
  subreddit: "artificial",
  query: "machine learning trends",
  limit: 15,
  sort: "hot"
});

// Get latest posts
const latestPosts = await agent.executeTool("reddit/getLatestPosts", {
  subreddit: "MachineLearning",
  limit: 10
});

// Retrieve post
const postData = await agent.executeTool("reddit/retrievePost", {
  postUrl: "https://www.reddit.com/r/MachineLearning/comments/xyz789/deep_learning_breakthrough/"
});
```

### Advanced Workflows

**Content Research:**
```typescript
// Search for relevant discussions
const discussions = await reddit.searchSubreddit("programming", "best practices", {
  limit: 20,
  sort: "top",
  t: "month"
});

// Get latest posts for trending topics
const trending = await reddit.getLatestPosts("news", {
  limit: 25
});

// Analyze specific posts
const postAnalysis = await reddit.retrievePost("https://www.reddit.com/r/programming/comments/abc123/trending_topic/");
```

**Monitoring Subreddits:**
```typescript
// Get latest posts with pagination
let after = null;
const posts = await reddit.getLatestPosts("news", {
  limit: 50,
  after: after
});

// Process posts
for (const post of posts.data.children) {
  // Analyze post data
  console.log(post.data.title);
}
```

## API Reference

### RedditService Methods

**searchSubreddit(subreddit, query, options)**

- **Parameters:**
  - `subreddit`: Subreddit name (without r/ prefix)
  - `query`: Search query string
  - `options`: Search configuration (limit, sort, time period, pagination)

- **Returns:** Structured JSON with search results including metadata and pagination support

**retrievePost(postUrl)**

- **Parameters:**
  - `postUrl`: Reddit post URL

- **Returns:** Complete Reddit post structure including content and comments

**getLatestPosts(subreddit, options)**

- **Parameters:**
  - `subreddit`: Subreddit name (without r/ prefix)
  - `options`: Listing configuration (limit, pagination)

- **Returns:** Listing with post metadata in chronological order

### Response Formats

**Search Results:**
```json
{
  "kind": "Listing",
  "data": {
    "children": [...],  // Array of post objects
    "after": "t3_abc123",
    "before": null
  }
}
```

**Post Content:**
```json
{
  "kind": "Listing",
  "data": {
    "children": [
      {
        "kind": "t3",
        "data": { /* post data */ }
      },
      {
        "kind": "t1",
        "data": { /* comment data */ }
      }
    ]
  }
}
```

## Configuration Options

### Service Configuration

```typescript
// Default configuration
const reddit = new RedditService();  // Uses https://www.reddit.com

// Custom base URL
const customReddit = new RedditService({
  baseUrl: "https://custom.reddit.com"
});
```

### Search Options

- `limit`: Number of results (1-100, default: 25)
- `sort`: Sort order ('relevance', 'hot', 'top', 'new', 'comments')
- `t`: Time period for sorting ('hour', 'day', 'week', 'month', 'year', 'all')
- `after`: Pagination cursor for subsequent requests
- `before`: Pagination cursor for previous requests

### Listing Options

- `limit`: Number of posts (1-100, default: 25)
- `after`: Pagination cursor for subsequent requests
- `before`: Pagination cursor for previous requests

## Error Handling

The service provides comprehensive error handling:

- **Parameter Validation**: Validates required parameters
- **HTTP Errors**: Handles 4xx, 5xx responses appropriately
- **Rate Limiting**: Implements exponential backoff
- **Network Issues**: Retry logic for temporary failures
- **URL Validation**: Validates Reddit URLs before requests

**Example Error Handling:**
```typescript
try {
  const results = await reddit.searchSubreddit("programming", "javascript");
  console.log(results);
} catch (error) {
  if (error.message.includes("rate limit")) {
    // Handle rate limiting
    await waitForRateLimitReset();
  }
}
```

## Performance Considerations

- **Request Optimization**: Efficient JSON parsing and response handling
- **Rate Limiting**: Respects Reddit's API limits
- **Pagination**: Supports cursor-based pagination for large datasets
- **Retry Logic**: Built-in retry mechanism for improved reliability
- **User-Agent Compliance**: Fixed User-Agent for API compliance

## Dependencies

- **@tokenring-ai/app**: Application framework
- **@tokenring-ai/chat**: Chat service integration
- **@tokenring-ai/agent**: Agent framework
- **@tokenring-ai/utility**: HTTP utilities and retry logic
- **@tokenring-ai/scripting**: Scripting language integration (optional)
- **zod**: Schema validation

## Development

### Testing

The package includes comprehensive integration tests:

```bash
bun run test
```

### Building

```bash
bun run build
```

### Plugin Development

Create custom Reddit integrations:

```typescript
import { default as RedditService } from "@tokenring-ai/reddit";

class ExtendedRedditService extends RedditService {
  // Add custom methods
  async getUserPosts(username: string) {
    // Custom implementation
  }
}
```

## Notes

- Uses Reddit's public JSON API (no authentication required)
- Respects Reddit's API rate limits
- Text-only; binary files not supported
- User-Agent required for API compliance
- Automatic .json URL conversion for post retrieval

## Related Packages

- **@tokenring-ai/utility**: HTTP utilities and retry logic
- **@tokenring-ai/chat**: Chat service and tool system
- **@tokenring-ai/agent**: Agent framework integration
- **@tokenring-ai/scripting**: Scripting language integration