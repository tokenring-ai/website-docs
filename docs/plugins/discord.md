# Discord Plugin

## Overview

The Discord Plugin integrates Discord with TokenRing agents, enabling natural conversations through Discord's messaging system. Each Discord user gets their own persistent agent instance that maintains conversation history and context. The plugin listens for messages, creates dedicated agents for authorized users, and routes AI responses back to Discord channels.

### Key Features

- **Per-User Agents**: Each Discord user gets a dedicated agent with persistent chat history
- **@Mentions**: Respond to mentions in channels with intelligent AI responses
- **Direct Messages**: Private conversations with the bot in your DMs
- **Authorization**: Optional user whitelist for restricted access
- **Event-Driven Communication**: Handles agent events and sends responses back to Discord
- **Automatic Agent Management**: Creates and manages agents for each user automatically
- **Plugin Architecture**: Automatically integrates with TokenRing applications
- **State Preservation**: Maintains agent state and conversation history across sessions
- **Timeout Handling**: Configurable response timeouts with automatic agent cleanup
- **Message Formatting**: System messages with proper formatting (info, warning, error levels)
- **Multiple Output Types**: Supports chat messages, info messages, warnings, and error messages
- **Message Chunking**: Automatically splits long messages to respect Discord's 2000 character limit

### Integration with TokenRing Ecosystem

This plugin seamlessly integrates with TokenRing's agent system, allowing Discord users to interact with AI agents through Discord's messaging platform. The plugin creates a separate agent for each Discord user, maintaining individual conversation contexts.

## Core Components

### DiscordService

The primary service class responsible for managing Discord bot interactions.

- **Responsibilities**: Handles incoming messages, manages per-user agents, processes events, and sends responses to Discord channels.
- **Configuration Schema**: Validates and processes the Discord service configuration options.
- **Event Handling**: Processes AgentEventState events including output.chat, output.info, output.warning, output.error, and input.handled.

### DiscordServiceConfigSchema

Configuration schema for the Discord service, defined using Zod:

```typescript
const DiscordServiceConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  channelId: z.string().optional(),
  authorizedUserIds: z.array(z.string()).optional(),
  defaultAgentType: z.string().optional()
});
```

### DiscordServiceConfig

Type definition for the configuration:

```typescript
type DiscordServiceConfig = {
  botToken: string;
  channelId?: string;
  authorizedUserIds?: string[];
  defaultAgentType?: string;
};
```

## Services and APIs

### DiscordService Class

The main service class that implements TokenRingService interface.

#### Constructor

```typescript
constructor(app: TokenRingApp, config: DiscordServiceConfig)
```

**Parameters:**

- `app`: TokenRingApp instance
- `config`: DiscordServiceConfig object containing:
  - `botToken`: Discord bot token (required)
  - `channelId`: Optional channel ID for startup announcement
  - `authorizedUserIds`: Optional list of authorized user IDs
  - `defaultAgentType`: Optional default agent type (defaults to "teamLeader")

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `run` | `run(signal: AbortSignal): Promise<void>` | Starts the Discord bot and begins listening for messages. The service will automatically handle cleanup when the signal is aborted. |
| `handleChatOutput` | `handleChatOutput(message: Message, content: string): Promise<void>` | Formats and sends chat messages to Discord, splitting long messages into chunks to respect Discord's character limits. |
| `handleSystemOutput` | `handleSystemOutput(message: Message, messageText: string, level: string): Promise<void>` | Formats system messages (info, warning, error) with appropriate labels. |
| `chunkText` | `chunkText(text: string, maxLength: number): string[]` | Splits text into chunks of specified maximum length. |
| `getOrCreateAgentForUser` | `getOrCreateAgentForUser(userId: string): Promise<Agent>` | Gets or creates an agent for the specified user. |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name, always "DiscordService" |
| `description` | `string` | Service description |
| `running` | `boolean` | Indicates if the service is currently running |

### Plugin Interface

The plugin provides a TokenRingPlugin that:

```typescript
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.discord) {
      app.addServices(new DiscordService(app, config.discord));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Commands and Tools

### Chat Commands

The Discord plugin supports interaction via Discord messages:

- **Mentions in Channels**: When mentioned in a channel (e.g., `@BotName what is the weather today?`), the bot processes the message and responds with agent-generated content.
- **Direct Messages**: Users can send private messages to the bot for conversations without channel context.

#### Message Processing Flow

1. Bot receives a message (via mention or DM)
2. Message is cleaned by removing the bot mention
3. Agent waits for idle state before processing
4. Message is sent to the agent via `handleInput`
5. Agent events are subscribed to for output handling
6. Responses are sent back to Discord

#### Output Formats

- **Chat Messages**: Normal messages sent as Discord replies.
- **System Messages**: Formatted as `[LEVEL]: message` where LEVEL is INFO, WARNING, or ERROR.
- **Timeout Messages**: Sent when agent exceeds maxRunTime configuration.

### Event Types

The service handles the following AgentEventState events:

| Event Type | Format | Description |
|------------|--------|-------------|
| `output.chat` | Direct response | Regular chat messages from the agent |
| `output.info` | `[INFO]: message` | Informational messages |
| `output.warning` | `[WARNING]: message` | Warning messages |
| `output.error` | `[ERROR]: message` | Error messages |
| `input.handled` | N/A | Indicates agent processing completion |

## Configuration

### Plugin Configuration

The Discord service can be configured via the TokenRing app configuration or manually.

#### Plugin Usage (Recommended)

```typescript
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: ["@tokenring-ai/discord"]
});

app.config({
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN!,
    channelId: process.env.DISCORD_CHANNEL_ID,
    authorizedUserIds: ['123456789012345678'],
    defaultAgentType: 'teamLeader'
  }
});
```

#### Manual Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import { DiscordService } from "@tokenring-ai/discord";

const app = new TokenRingApp();
const discordService = new DiscordService(app, {
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID,
  authorizedUserIds: ['123456789012345678'],
  defaultAgentType: 'teamLeader'
});

app.addServices(discordService);
await app.start();
```

#### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `botToken` | `string` | Yes | - | Discord bot token from Discord Developer Portal |
| `channelId` | `string` | No | - | Optional channel ID for startup announcement message |
| `authorizedUserIds` | `string[]` | No | `[]` | List of user IDs authorized to interact with the bot |
| `defaultAgentType` | `string` | No | `"teamLeader"` | Default agent type to spawn for users |

#### Environment Variables

- `DISCORD_BOT_TOKEN` (required): Discord bot token.
- `DISCORD_CHANNEL_ID` (optional): Channel ID for startup announcements.
- `DISCORD_AUTHORIZED_USERS` (optional): Comma-separated list of authorized user IDs.
- `DISCORD_DEFAULT_AGENT_TYPE` (optional): Default agent type (default: `teamLeader`).

## Usage Examples

### Basic Interaction

- **Mention in channel**: `@BotName what is the weather today?`
- **Direct message**: Send a message directly to the bot.

### Environment Variables Setup

```bash
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_CHANNEL_ID=123456789012345678
DISCORD_AUTHORIZED_USERS=123456789012345678,987654321098765432
DISCORD_DEFAULT_AGENT_TYPE=teamLeader
```

### Complete App Configuration

```typescript
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp({
  name: "My Discord Bot",
  plugins: [
    "@tokenring-ai/discord",
    // other plugins...
  ]
});

app.config({
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN!,
    channelId: process.env.DISCORD_CHANNEL_ID,
    authorizedUserIds: ['123456789012345678'],
    defaultAgentType: 'teamLeader'
  }
});

await app.start();
```

## Integration

### Agent System Integration

Each Discord user is assigned a dedicated agent instance that maintains conversation history. The plugin integrates with the TokenRing agent manager to create and manage these agents.

#### Agent Lifecycle

1. **Agent Creation**: When a user messages the bot for the first time, a new agent is created via `AgentManager.spawnAgent()`
2. **Message Processing**: Messages are sent to the agent via `agent.handleInput()`
3. **Event Subscription**: The plugin subscribes to agent events to process responses
4. **Cleanup**: When the service stops, all user agents are deleted via `AgentManager.deleteAgent()`

### Event Handling

The Discord service processes agent events including:

- `output.chat`: Sent as regular Discord messages
- `output.info`, `output.warning`, `output.error`: Formatted as system messages with appropriate labels
- `input.handled`: Indicates agent processing completion and triggers timeout check

### Service Registration

The plugin registers itself with the TokenRing app via the plugin architecture, automatically adding the DiscordService to the application when configured.

#### Gateway Intents

The Discord client uses the following Gateway Intents:

- `GatewayIntentBits.Guilds`: Server/guild operations
- `GatewayIntentBits.GuildMessages`: Guild message events
- `GatewayIntentBits.MessageContent`: Message content access
- `GatewayIntentBits.DirectMessages`: Direct message events

## Monitoring and Debugging

### Common Issues

| Issue | Solution |
|-------|----------|
| Bot not responding | Ensure Message Content Intent is enabled in Discord Developer Portal |
| Authorization errors | Add your user ID to the authorized list or remove restrictions |
| Bot offline | Verify bot token validity and invite status |
| Agent timeouts | Adjust `maxRunTime` in agent configuration |
| Long messages | Automatically chunked, but may require manual splitting for very large responses |

### Debug Tips

1. **Verify Bot Token**: Ensure the token is valid and has correct permissions
2. **Check Message Content Intent**: Must be enabled in Discord Developer Portal
3. **Verify Server Invitation**: Bot must be invited to the server with correct permissions
4. **Monitor Agent State**: Check if agents are being created correctly
5. **Check Event Subscriptions**: Verify events are being processed correctly

### Logging

The service outputs logs via the agent's info/warning/error methods:

- `agent.infoLine()`: General information about agent actions
- `agent.warningLine()`: Warnings about agent configuration
- `agent.errorLine()`: Errors during agent processing

## Development

### Testing

To run tests for the Discord plugin:

```bash
bun install
bun test
```

### Test Configuration

The plugin uses Vitest with the following configuration:

```typescript
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Test Coverage

Tests include:
- Configuration validation
- Schema parsing
- Edge cases handling
- Type inference verification

### Build

The plugin uses TypeScript and can be built with:

```bash
bun build
```

### Package Structure

```
pkg/discord/
├── DiscordService.ts      # Main service implementation
├── plugin.ts              # Plugin interface
├── schema.ts              # Configuration schema (if separate)
├── index.ts               # Exports
├── package.json           # Package metadata
├── vitest.config.ts       # Test configuration
├── LICENSE                # MIT license
└── README.md              # Package documentation
```

### Exports

```typescript
export {default as DiscordService} from "./DiscordService.ts";
export type { DiscordServiceConfig } from "./DiscordService.ts";
export { DiscordServiceConfigSchema } from "./DiscordService.ts";
```

## Best Practices

### Authorization

- Use `authorizedUserIds` to restrict access to specific users
- Empty array (default) allows all users to interact
- Add user IDs as strings, not mentions

### Agent Configuration

- Set appropriate `maxRunTime` for your use case
- Use `defaultAgentType` to specify which agent type to spawn
- Consider agent capabilities when choosing agent types

### Message Handling

- Long messages are automatically chunked to 2000 characters
- System messages use special formatting for easy identification
- Consider the context window size when designing prompts

### Performance

- Each user gets their own agent instance
- Agents persist until the service stops
- Consider memory usage with many concurrent users

## Related Components

- `@tokenring-ai/agent`: Agent system and management
- `@tokenring-ai/chat`: Chat service for agent interactions
- `@tokenring-ai/app`: Application framework and plugin system

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
