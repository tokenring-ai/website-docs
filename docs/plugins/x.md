# X (Twitter) Integration

The `@tokenring-ai/x` package provides an X (formerly Twitter) social media
integration for the Token Ring AI ecosystem. It implements the
`SocialMediaProvider` interface from `@tokenring-ai/social`, enabling agents
to authenticate with X/Twitter, retrieve user accounts, fetch recent posts,
look up posts by ID, and create new posts.

This package integrates with the social media service system to provide
seamless X/Twitter functionality within AI-powered workflows.

## User Guide

### Overview

The X (Twitter) Integration package (`@tokenring-ai/x`) provides authenticated
access to the X/Twitter API v2. It enables Token Ring applications to interact
with the X social media platform through a standardized social media provider
interface.

This package integrates with the `@tokenring-ai/social` package to register
X as a social media provider, allowing agents to post tweets, retrieve recent
posts, and look up posts by ID.

### Key Features

- **Multiple Account Support**: Configure and manage multiple X accounts within
  a single Token Ring instance
- **API v2 Integration**: Full support for X API v2 endpoints
- **Authentication**: Bearer token-based OAuth 2.0 authentication
- **Post Management**: Create posts, retrieve recent posts, and look up posts
  by ID
- **Filter Options**: Filter posts by date range, replies, and reshares
- **Metrics Tracking**: Access to post metrics including likes, replies,
  retweets, quotes, and impressions
- **Account Caching**: Provider caches account information to reduce API calls
- **Reply Threading**: Create posts as replies to existing tweets
- **Response Validation**: All API responses are validated with Zod schemas

### Installation

```bash
bun add @tokenring-ai/x
```

### Chat Commands

This package does not define any chat commands directly. Chat commands for
social media operations are provided by the `@tokenring-ai/social` package.

### Tools

This package does not define any tools directly. Tools for social media
operations are provided by the `@tokenring-ai/social` package.

### Configuration

#### Environment Variables

This package supports configuration through environment variables for quick
setup:

| Variable | Description | Required |
|----------|-------------|----------|
| `X_TOKEN` | Bearer token for the default account | No |
| `X_TOKEN{n}` | Bearer token for account {n} (e.g., `X_TOKEN0`, `X_TOKEN1`) | No |
| `X_ACCOUNT_NAME{n}` | Display name for account {n} | No (defaults to "X Account {n}") |

The bare `X_TOKEN` variable (without a numeric suffix) creates a default
account. When a numeric suffix is used, the display name defaults to
"X Account {n}".

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | `"https://api.x.com"` | X API base URL |
| `bearerToken` | string | Required | OAuth 2.0 Bearer Token |
| `userAgent` | string | `"TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"` | User-Agent header |
| `userId` | string | Exact Optional | Specific user ID to fetch (defaults to current user) |

#### Configuration Schema

The package accepts the following configuration structure:

```yaml
x:
  accounts:
    <account-name>:
      bearerToken: "your-bearer-token"
      baseUrl: "https://api.x.com"
      userAgent: "TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"
      userId: "user-id"
```

#### Configuration Example

```yaml
x:
  accounts:
    main:
      bearerToken: "your-bearer-token-here"
```

#### Programmatic Configuration

```typescript
import { App } from "@tokenring-ai/app";
import xPlugin from "@tokenring-ai/x/plugin";

const app = new App();

await app.install(xPlugin, {
  x: {
    accounts: {
      main: {
        bearerToken: "your-bearer-token",
      },
    },
  },
});
```

### Integration

The X package integrates with the following packages:

- **@tokenring-ai/social**: Core social media service that manages providers
  and accounts
- **@tokenring-ai/app**: Token Ring application framework
- **@tokenring-ai/agent**: Agent system for executing social media operations
- **@tokenring-ai/utility**: HTTP utilities and data manipulation tools

### Best Practices

1. **Secure Your Bearer Tokens**: Never commit bearer tokens to version
   control. Use environment variables or secure configuration management.
2. **Rate Limiting**: Be aware of X API rate limits. The package includes a
   10-second timeout for requests.
3. **Account Management**: Use descriptive account names for multiple accounts
   to easily identify them in logs and responses.
4. **Error Handling**: The package validates all API responses against Zod
   schemas, ensuring type safety.
5. **User Agent**: Customize the user agent string to identify your
   application in X API analytics.

---

## Developer Reference

### Core Components

#### XSocialMediaProvider

The main provider class that implements the `SocialMediaProvider` interface
for X/Twitter.

**Location**: `pkg/x/XSocialMediaProvider.ts`

**Description**: "Authenticated X/Twitter social media provider"

**Constructor**:

```typescript
constructor(options: XProviderOptions)
```

Where `XProviderOptions` is:

```typescript
export const XProviderOptionsSchema = z.object({
  baseUrl: z.string().default("https://api.x.com"),
  bearerToken: z.string(),
  userAgent: z.string()
    .default("TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"),
  userId: z.string().exactOptional(),
});
```

**Key Methods**:

| Method | Description |
|--------|-------------|
| `getAccount(agent): Promise<SocialMediaAccount>` | Retrieves the authenticated account information (cached after first call) |
| `getRecentPosts(filter, agent): Promise<SocialMediaPost[]>` | Fetches recent posts with filtering options |
| `getPostById(id, agent): Promise<SocialMediaPost>` | Retrieves a specific post by its ID, expanding author data |
| `createPost(data, agent): Promise<SocialMediaPost>` | Creates a new post, optionally as a reply |

#### getAccount

```typescript
async getAccount(agent: Agent): Promise<SocialMediaAccount>
```

Retrieves the authenticated user's account information. Uses
`GET /2/users/me` by default, or `GET /2/users/:id` if a `userId` option
was provided. The result is cached after the first call.

Returns: `SocialMediaAccount` with id, username, displayName, description,
avatarUrl, and url (`https://x.com/{username}`).

#### getRecentPosts

```typescript
async getRecentPosts(
  filter: SocialMediaPostFilterOptions,
  agent: Agent
): Promise<SocialMediaPost[]>
```

Fetches recent posts for the authenticated user.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter.limit` | number | Maximum results (capped at 100) |
| `filter.includeReplies` | boolean | Set to false to exclude replies |
| `filter.includeReshares` | boolean | Set to false to exclude retweets |
| `filter.since` | Date | Start time filter |
| `filter.until` | Date | End time filter |

Uses `GET /2/users/:id/tweets` endpoint. Returns an array of
`SocialMediaPost` objects with platform set to `"x"`.

#### getPostById

```typescript
async getPostById(id: string, agent: Agent): Promise<SocialMediaPost>
```

Retrieves a specific post by its ID. Expands author information via the
`author_id` expansion.

Uses `GET /2/tweets/:id` endpoint.

#### createPost

```typescript
async createPost(
  data: CreateSocialMediaPostData,
  agent: Agent
): Promise<SocialMediaPost>
```

Creates a new post. After creation, reloads the post via `getPostById` to
return full details.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `data.content` | string | Post text content (required) |
| `data.replyToPostId` | string | ID of the post to reply to (optional) |

Uses `POST /2/tweets` endpoint.

### Services

#### Integration with SocialMediaService

The X provider registers itself with the `SocialMediaService` during plugin
installation. The plugin waits for the `SocialMediaService` to be available,
then registers each configured account as a provider:

```typescript
app.services.waitForItemByType(SocialMediaService, socialService => {
  for (const [name, accountConfig] of Object.entries(config.x.accounts)) {
    socialService.registerSocialMediaProvider(
      name,
      new XSocialMediaProvider(accountConfig)
    );
  }
});
```

Once registered, agents use the social media service to interact with X
through the standard `SocialMediaService` API:

```typescript
import { SocialMediaService } from "@tokenring-ai/social";

const socialService = agent.requireServiceByType(SocialMediaService);

// Select the X provider by name (as configured in YAML or env vars)
socialService.setActiveProvider("main", agent);

// Get account info
const account = await socialService.getCurrentAccount(agent);
console.log(`Connected as @${account.username}`);

// Get recent posts
const posts = await socialService.getRecentPosts(
  { limit: 10, includeReplies: false },
  agent
);

// Create a new post
const post = await socialService.createPost(
  { content: "Hello from Token Ring!" },
  agent
);
console.log(`Posted at: ${post.url}`);
```

### Provider Documentation

#### SocialMediaProvider Interface

`XSocialMediaProvider` implements the `SocialMediaProvider` interface from
`@tokenring-ai/social`:

```typescript
export interface SocialMediaProvider {
  description: string;
  attach?(agent: Agent, creationContext: AgentCreationContext): void;
  getAccount(agent: Agent): MaybePromise<SocialMediaAccount>;
  getRecentPosts(filter: SocialMediaPostFilterOptions, agent: Agent): MaybePromise<SocialMediaPost[]>;
  getPostById(id: string, agent: Agent): MaybePromise<SocialMediaPost>;
  createPost(data: CreateSocialMediaPostData, agent: Agent): MaybePromise<SocialMediaPost>;
  deletePost?(id: string, agent: Agent): MaybePromise<void>;
}
```

The X provider does **not** implement `deletePost`, as the X API v2 endpoint
for deleting tweets requires elevated access.

### Schema Documentation

#### XProviderOptionsSchema

Defines the configuration options for a single X provider account.

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `baseUrl` | string | No | `"https://api.x.com"` | X API v2 base URL |
| `bearerToken` | string | Yes | - | OAuth 2.0 Bearer token |
| `userAgent` | string | No | `"TokenRing-Writer/1.0 (https://github.com/tokenring/writer)"` | User-Agent header value |
| `userId` | string | No | - | User ID for account lookup; uses `/2/users/me` if omitted |

#### XConfigSchema

Defines the overall configuration structure for the X plugin.

```typescript
export const XConfigSchema = z.object({
  accounts: z.record(z.string(), XProviderOptionsSchema),
});
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accounts` | Record<string, XProviderOptions> | Yes | Map of account names to provider options |

#### Internal Response Schemas

The provider validates all X API responses using Zod schemas:

| Schema | Purpose | Endpoint |
|--------|---------|----------|
| `XUserSchema` | User account data | `/2/users/me`, `/2/users/:id` |
| `XTweetSchema` | Individual tweet data | `/2/users/:id/tweets`, `/2/tweets/:id` |
| `XRecentPostsResponseSchema` | Array of tweets | `/2/users/:id/tweets` |
| `XPostLookupResponseSchema` | Single tweet with expanded author | `/2/tweets/:id` |
| `XCreatePostResponseSchema` | Created tweet ID | `POST /2/tweets` |
| `XAccountResponseSchema` | Single user account | `/2/users/me`, `/2/users/:id` |

### RPC Endpoints

This package does not expose direct RPC endpoints. All functionality is
accessed through the `SocialMediaService` interface.

### Usage Examples

#### Basic Usage with SocialMediaService

```typescript
import { App } from "@tokenring-ai/app";
import { SocialMediaService } from "@tokenring-ai/social";
import xPlugin from "@tokenring-ai/x/plugin";

const app = new App();
await app.install(xPlugin, {
  x: {
    accounts: {
      main: {
        bearerToken: process.env.X_TOKEN,
      },
    },
  },
});

const socialService = app.services.getItemByType(SocialMediaService);
```

#### Multiple Accounts

```typescript
await app.install(xPlugin, {
  x: {
    accounts: {
      personal: {
        bearerToken: process.env.X_TOKEN,
      },
      business: {
        bearerToken: process.env.X_TOKEN1,
      },
    },
  },
});
```

Or via environment variables:

```bash
export X_TOKEN="personal-bearer-token"
export X_TOKEN1="business-bearer-token"
export X_ACCOUNT_NAME0="Personal Account"
export X_ACCOUNT_NAME1="Business Account"
```

#### Direct Provider Usage

```typescript
import { XSocialMediaProvider } from "@tokenring-ai/x";

const provider = new XSocialMediaProvider({
  bearerToken: "your-bearer-token",
});

// Get account information
const account = await provider.getAccount(agent);
console.log(`Connected as @${account.username}`);

// Get recent posts
const posts = await provider.getRecentPosts(
  { limit: 10, includeReplies: false },
  agent
);

// Look up a post by ID
const post = await provider.getPostById("1234567890", agent);

// Create a new post
const newPost = await provider.createPost(
  { content: "Hello from Token Ring!" },
  agent
);

// Create a reply
const reply = await provider.createPost(
  { content: "Reply text", replyToPostId: post.id },
  agent
);
```

### Testing

The package uses Vitest for testing. Tests mock the HTTP layer to verify
provider behavior without making external API calls.

```bash
# Run all tests
bun test

# Run in watch mode
bun test:watch

# Run with coverage
bun test:coverage
```

#### Test Structure

- **Unit tests**: Test individual provider methods with mocked HTTP responses
- **Integration**: Tests verify proper request formatting and response parsing
- **Mocking**: HTTP layer (`doFetchWithRetry`) is mocked to test provider
  logic without external API calls

#### Test Configuration

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Package Structure

```text
pkg/x/
├── index.ts                          # Main exports (schemas, types, provider)
├── plugin.ts                         # TokenRingPlugin registration
├── schema.ts                         # Zod schema definitions
├── XSocialMediaProvider.ts           # Provider implementation
├── package.json                      # Package metadata and dependencies
├── vitest.config.ts                  # Test configuration
├── test/
│   └── XSocialMediaProvider.test.ts  # Provider unit tests
└── README.md                         # Package README
```

### Dependencies

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/agent` | 0.2.0 | Agent interface for social media operations |
| `@tokenring-ai/app` | 0.2.0 | Token Ring application framework |
| `@tokenring-ai/utility` | 0.2.0 | HTTPRetriever and stripUndefinedKeys utilities |
| `zod` | ^4.3.6 | Schema validation |

#### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^6.0.2 | TypeScript compiler |
| `vitest` | ^4.1.1 | Unit testing framework |

#### Peer Dependencies

- `@tokenring-ai/social`: Social media service abstractions (required for
  plugin installation)

### Related Components

- `@tokenring-ai/social`: Core social media service abstractions and provider
  interface
- `@tokenring-ai/agent`: Core agent system for service integration
- `@tokenring-ai/app`: Base application framework with plugin system
- `@tokenring-ai/utility`: HTTPRetriever and object utility functions

### License

MIT License - see LICENSE file for details.
