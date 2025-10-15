# Reddit Plugin

Reddit integration for searching subreddit posts and retrieving post content via JSON API.

## Overview

The `@tokenring-ai/reddit` package provides seamless integration with Reddit's JSON API for searching subreddit posts and retrieving post content. It enables agents to query Reddit programmatically without authentication.

## Key Features

- Search posts within specific subreddits
- Various sorting and filtering options
- Retrieve full post content including comments
- Built-in retry logic for API requests
- No authentication required (uses public JSON API)

## Core Components

### RedditService

Main service for Reddit API interactions.

**Constructor:**
```typescript
new RedditService({ baseUrl?: string })
```

**Key Methods:**
- `searchSubreddit(subreddit, query, opts?)` - Search posts in subreddit
- `retrievePost(postUrl)` - Get full post content and comments

### Tools

**searchSubreddit**: Search posts within a subreddit
- Input: `{ subreddit: string, query: string, limit?: number, sort?: 'relevance'|'hot'|'top'|'new'|'comments', t?: 'hour'|'day'|'week'|'month'|'year'|'all', after?: string, before?: string }`
- Returns: Array of matching posts

**retrievePost**: Retrieve full post content by URL
- Input: `{ postUrl: string }`
- Returns: Post data with comments

## Global Scripting Functions

When `@tokenring-ai/scripting` is available:

- **searchSubreddit(subreddit, query)**: Searches posts within a subreddit
  ```bash
  /var $posts = searchSubreddit("programming", "javascript")
  /call searchSubreddit("technology", "AI")
  ```

- **getRedditPost(url)**: Retrieves a Reddit post by URL
  ```bash
  /var $post = getRedditPost("https://www.reddit.com/r/programming/comments/abc123/title/")
  ```

- **getLatestPosts(subreddit)**: Gets the latest posts from a subreddit
  ```bash
  /var $latest = getLatestPosts("technology")
  /call getLatestPosts("programming")
  ```

## Usage Example

```typescript
import RedditService from '@tokenring-ai/reddit';

const reddit = new RedditService();

// Search subreddit
const searchResults = await reddit.searchSubreddit('programming', 'javascript', {
  limit: 5,
  sort: 'top',
  t: 'week'
});

// Get post content
const postContent = await reddit.retrievePost(
  'https://www.reddit.com/r/programming/comments/abc123/title/'
);

// Using tools
const response = await agent.executeTool('reddit/searchSubreddit', {
  subreddit: 'technology',
  query: 'artificial intelligence',
  limit: 10,
  sort: 'hot'
});
```

## Configuration Options

- **baseUrl**: Custom Reddit base URL (default: 'https://www.reddit.com')
- **User-Agent**: Fixed for compliance: "TokenRing-Writer/1.0"
- **Retry Logic**: Handled internally by `doFetchWithRetry`

## Search Options

- **limit**: Number of results (1-100, default: 25)
- **sort**: Sort order ('relevance', 'hot', 'top', 'new', 'comments')
- **t**: Time period ('hour', 'day', 'week', 'month', 'year', 'all')
- **after/before**: Pagination using fullnames

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/utility@0.1.0`: For `doFetchWithRetry`
- `@tokenring-ai/scripting@0.1.0`: Optional, for global functions
- `zod@^4.0.17`: Schema validation

## Notes

- Uses Reddit's public JSON API (no authentication required)
- Respects Reddit's API rate limits
- Text-only; binary files not supported
- User-Agent required for API compliance
