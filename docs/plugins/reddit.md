# Reddit Plugin

## Overview

The Reddit plugin provides integration with Reddit's JSON API, enabling AI agents to search subreddits, retrieve post content, and fetch the latest posts from communities. This plugin enables intelligent content discovery and research workflows by providing programmatic access to Reddit's vast repository of discussions and information.

## Key Features

- **Subreddit Search**: Search posts within specific subreddits with advanced filtering and sorting options
- **Post Retrieval**: Retrieve full post content and comments by URL with automatic JSON parsing
- **Latest Posts**: Get newest posts from subreddits in chronological order
- **Chat Tools Integration**: Three tools registered with the chat service for direct agent interaction
- **Scripting Support**: Global functions available in scripting contexts for automation
- **Type-Safe Configuration**: Zod schema validation for all tool inputs
- **Automatic Pagination**: Support for Reddit's pagination mechanism using `after` and `before` cursors

## Core Components

### RedditService

The core service handling all Reddit API communication. This service extends `HttpService` and implements `TokenRingService`, providing a standardized interface for Reddit interactions.

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

## Tools

### searchSubreddit

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

**Input Schema**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| subreddit | string | Yes | Subreddit name without the r/ prefix |
| query | string | Yes | Search query string |
| limit | number | No | Number of results (1-100, default: 25) |
| sort | enum | No | Sort order: relevance, hot, top, new, comments (default: relevance) |
| t | enum | No | Time period: hour, day, week, month, year, all |
| after | string | No | Fullname of a thing for pagination (get items after this) |
| before | string | No | Fullname of a thing for pagination (get items before this) |

### retrievePost

Retrieve a Reddit post's content and comments by URL. Returns the full post object including title, author, body text, and comments.

**Tool Name**: `reddit_retrievePost`

```typescript
await agent.executeTool("reddit_retrievePost", {
  postUrl: "https://www.reddit.com/r/programming/comments/abc123/my_post/"
});
```

**Input Schema**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| postUrl | string (url) | Yes | Reddit post URL (e.g., https://www.reddit.com/r/subreddit/comments/id/title/) |

### getLatestPosts

Get the latest posts from a subreddit. Returns newest posts in chronological order, useful for monitoring trending topics and recent discussions.

**Tool Name**: `reddit_getLatestPosts`

```typescript
await agent.executeTool("reddit_getLatestPosts", {
  subreddit: "technology",
  limit: 20
});
```

**Input Schema**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| subreddit | string | Yes | Subreddit name without the r/ prefix |
| limit | number | No | Number of posts (1-100, default: 25) |
| after | string | No | Fullname of a thing for pagination (get items after this) |
| before | string | No | Fullname of a thing for pagination (get items before this) |

## Scripting Functions

### searchSubreddit(subreddit, query)

Search for posts in a subreddit using a simple function signature. Returns a JSON stringified array of posts that must be parsed.

```typescript
const searchResults = await scriptingService.execute('searchSubreddit', 'typescript', 'advanced');
const posts = JSON.parse(searchResults);
console.log(posts.map((post: any) => post.data.title));
```

**Parameters**:
- `subreddit` (string): Subreddit name without r/ prefix
- `query` (string): Search query

### getRedditPost(url)

Retrieve a post by its URL. Returns a JSON stringified post object.

```typescript
const postData = await scriptingService.execute('getRedditPost', 'https://www.reddit.com/r/programming/comments/abc123/title/');
const post = JSON.parse(postData);
console.log(post[0].data.children[0].data.title);
```

**Parameters**:
- `url` (string): Reddit post URL

### getLatestPosts(subreddit)

Get the latest posts from a subreddit. Returns a JSON stringified array of posts.

```typescript
const latestPosts = await scriptingService.execute('getLatestPosts', 'golang');
const posts = JSON.parse(latestPosts);
posts.forEach((post: any) => console.log(post.data.title));
```

**Parameters**:
- `subreddit` (string): Subreddit name without r/ prefix

## Configuration

### Plugin Configuration

The Reddit plugin has no configuration schema:

```typescript
const packageConfigSchema = z.object({});
```

### Service Configuration

The `RedditService` accepts an optional configuration object:

```typescript
interface RedditConfig {
  baseUrl?: string;  // Optional custom base URL (default: https://www.reddit.com)
}
```

**Example**:

```typescript
// Default configuration
const reddit = new RedditService();

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
app.addServices(new RedditService());
```

### Chat Service Integration

The plugin waits for the `ChatService` and registers its tools:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(packageJSON.name, tools)
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

// Parse and process results
const posts = JSON.parse(searchResults);
posts.forEach((post: any) => {
  console.log(`Title: ${post.data.title}`);
  console.log(`Score: ${post.data.score}`);
});
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

## Related Components

- **@tokenring-ai/websearch**: Web search capabilities for broader content discovery
- **@tokenring-ai/research**: Research workflow integration
- **@tokenring-ai/chat**: Chat service for tool integration

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
