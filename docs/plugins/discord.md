# Discord Plugin

A Token Ring plugin providing Discord integration for AI-powered bot interactions. This plugin enables Discord users to interact with TokenRing agents through natural language conversations in Discord channels and direct messages.

## Overview

The Discord plugin creates a Discord bot that listens for messages, creates persistent agent instances for each user, and routes conversations through the TokenRing agent system. Each user gets their own dedicated agent with conversation history and context preservation.

## Key Features

- **Per-User Agents**: Each Discord user gets a dedicated agent with persistent chat history
- **@Mentions Support**: Respond to mentions in channels with intelligent AI responses
- **Direct Messages**: Private conversations with the bot in your DMs
- **Authorization**: Optional user whitelist for restricted access control
- **Event-Driven Communication**: Handles agent events and sends responses back to Discord
- **Automatic Agent Management**: Creates and manages agents for each user automatically
- **State Preservation**: Maintains agent state and conversation history across sessions
- **Timeout Handling**: Configurable response timeouts with automatic agent cleanup
- **Message Formatting**: System messages with proper formatting (info, warning, error levels)
- **Multiple Output Types**: Supports chat messages, info messages, warnings, and error messages
- **Message Chunking**: Automatically splits long messages to respect Discord's 2000 character limit
- **Plugin Architecture**: Seamlessly integrates with TokenRing's plugin system
- **Environment Variable Support**: Configuration via environment variables

## Core Components

### DiscordService

The main service class that handles all Discord integration and agent communication.

**Properties:**
- `botToken`: Discord bot authentication token (required)
- `channelId`: Optional channel for startup announcements
- `authorizedUserIds`: Optional list of authorized user IDs for access control
- `defaultAgentType`: Default agent type to use for new users (defaults to "teamLeader")

### Configuration Schema

```typescript
export const DiscordServiceConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  channelId: z.string().optional(),
  authorizedUserIds: z.array(z.string()).optional(),
  defaultAgentType: z.string().optional()
});
```

## API Reference

### DiscordService Class

```typescript
export default class DiscordService implements TokenRingService {
  constructor(
    app: TokenRingApp,
    config: DiscordServiceConfig
  )
  
  async run(signal: AbortSignal): Promise<void>
  private async getOrCreateAgentForUser(userId: string): Promise<Agent>
  private async handleChatOutput(message: Message, content: string): Promise<void>
  private async handleSystemOutput(message: Message, messageText: string, level: string): Promise<void>
  private chunkText(text: string, maxLength: number): string[]
}
```

### DiscordServiceConfig Interface

```typescript
interface DiscordServiceConfig {
  botToken: string;           // Required: Discord bot token
  channelId?: string;         // Optional: Channel for startup announcements
  authorizedUserIds?: string[]; // Optional: List of authorized user IDs
  defaultAgentType?: string;  // Optional: Default agent type (defaults to "teamLeader")
}
```

## Integration Patterns

### Plugin Installation

The Discord plugin follows TokenRing's plugin architecture and can be installed automatically through the application configuration:

```typescript
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: [
    "@tokenring-ai/discord" // Auto-installs if discord config exists
  ]
});

// Configure in your app config
app.config({
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN!,
    channelId: process.env.DISCORD_CHANNEL_ID,
    authorizedUserIds: ['123456789012345678'],
    defaultAgentType: 'teamLeader'
  }
});
```

### Manual Service Creation

For advanced use cases, you can create the service manually:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import { DiscordService } from "@tokenring-ai/discord";

const app = new TokenRingApp({ /* app configuration */ });
const discordService = new DiscordService(app, {
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID,
  authorizedUserIds: ['123456789012345678'],
  defaultAgentType: 'teamLeader'
});

app.addServices(discordService);
await discordService.run();
```

## Configuration Options

### Environment Variables

```bash
# Required
DISCORD_BOT_TOKEN=your-bot-token-here

# Optional
DISCORD_CHANNEL_ID=123456789012345678        # For startup announcements
DISCORD_AUTHORIZED_USERS=123456789012345678,987654321098765432  # Comma-separated list
DISCORD_DEFAULT_AGENT_TYPE=teamLeader        # Override default agent type
```

### Configuration Object

```typescript
const discordConfig = {
  botToken: "your-bot-token",
  channelId: "123456789012345678", // Optional
  authorizedUserIds: ["123456789012345678", "987654321098765432"], // Optional
  defaultAgentType: "teamLeader" // Optional, defaults to "teamLeader"
};
```

## Usage Examples

### Basic Interaction

Discord users can interact with the bot in two ways:

1. **@Mention in channel**: `@BotName what is the weather today?`
2. **Direct message**: Send a message directly to the bot in DMs

### Advanced Configuration

```typescript
// Environment variables
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_CHANNEL_ID=123456789012345678        // Optional for startup announcements
DISCORD_AUTHORIZED_USERS=123456789012345678,987654321098765432  // Optional comma-separated list
DISCORD_DEFAULT_AGENT_TYPE=teamLeader        // Optional: defaults to "teamLeader"
```

### Custom Agent Type

```typescript
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp({
  plugins: ["@tokenring-ai/discord"]
});

app.config({
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN!,
    defaultAgentType: "customAgentType" // Use a custom agent type
  }
});
```

## Event System Integration

The Discord service handles multiple event types from the agent system:

### Event Types Handled

- `output.chat`: Regular chat messages from the agent
- `output.info`: Informational messages
- `output.warning`: Warning messages  
- `output.error`: Error messages
- `input.handled`: Indicates that the agent has finished processing the input

### Message Formatting

The service formats messages differently based on type:

- **Chat messages**: Sent as normal Discord messages
- **System messages**: Formatted as `[TYPE]: message` where TYPE is INFO, WARNING, or ERROR

## Dependencies

- `discord.js` ^14.25.1 - Discord API library
- `@tokenring-ai/app` ^0.2.0 - TokenRing application framework
- `@tokenring-ai/agent` ^0.2.0 - TokenRing agent system
- `@tokenring-ai/chat` ^0.2.0 - TokenRing chat functionality
- `zod` ^4.1.13 - Schema validation

## Prerequisites

### Discord Developer Portal Setup

1. **Create Discord Application**: [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. **Create Bot**:
   - Go to "Bot" section
   - Click "Add Bot"
   - Enable "Message Content Intent" under Privileged Gateway Intents
   - Copy the bot token
3. **Set Bot Permissions**:
   - Go to "OAuth2" > "URL Generator"
   - Select scopes: `bot`
   - Select permissions: `Send Messages`, `Read Messages/View Channels`, `Read Message History`
   - Use generated URL to invite bot to your server
4. **Get Channel ID** (optional):
   - Enable Developer Mode in Discord (User Settings > Advanced)
   - Right-click channel and select "Copy ID"
5. **Get User IDs** (optional):
   - Right-click user and select "Copy ID"

## Best Practices

### Security Considerations

- **Token Protection**: Keep your Discord bot token secure and never commit it to version control
- **Authorization**: Use `authorizedUserIds` to restrict access if needed
- **Intents**: Ensure Message Content Intent is enabled for reading message content
- **Permissions**: Grant only necessary permissions to the bot

### Performance Considerations

- **Message Chunking**: The service automatically chunks long messages to respect Discord's 2000 character limit
- **Timeout Handling**: Agents have configurable timeouts that trigger automatic cleanup
- **Resource Management**: Agents are automatically cleaned up when the service stops

### Error Handling

The service handles various error scenarios:

- **Unauthorized Access**: Users not in `authorizedUserIds` receive an "not authorized" message
- **Bot Offline**: Check that the bot token is valid and the bot is invited to your server
- **Agent Timeouts**: Verify the `maxRunTime` setting in your agent configuration
- **Message Formatting**: System messages are properly formatted with type indicators

## Troubleshooting

### Common Issues

1. **Bot not responding**: Ensure Message Content Intent is enabled in Discord Developer Portal
2. **"Not authorized" message**: Add your user ID to `authorizedUserIds` or remove the restriction
3. **Bot offline**: Check that the bot token is valid and the bot is invited to your server
4. **Agent timeouts**: Verify the `maxRunTime` setting in your agent configuration
5. **Long messages not sent**: The service automatically chunks messages to respect Discord's character limit

## Related Components

- **@tokenring-ai/agent**: Core agent system that handles conversation logic
- **@tokenring-ai/app**: Application framework that manages service lifecycle
- **@tokenring-ai/chat**: Chat functionality and message processing

## License

MIT License - see [LICENSE](./LICENSE) file for details.