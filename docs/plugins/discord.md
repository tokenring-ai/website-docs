# Discord Plugin

## Overview
Provides Discord integration for TokenRing, allowing users to interact with agents through Discord channels and direct messages. The plugin creates a Discord bot that can be mentioned or messaged directly, enabling seamless communication between Discord and TokenRing agents.

## Key Features
- **Discord Bot Integration**: Full Discord bot functionality using discord.js
- **Channel-Based Communication**: Support for both server channels and direct messages
- **User Authorization**: Configurable authorized user IDs for security
- **Automatic Agent Spawning**: Creates dedicated agents for each Discord user
- **Real-time Event Processing**: Handles agent outputs and system messages
- **Response Chunking**: Automatically splits long responses to fit Discord's 2000 character limit
- **Timeout Handling**: Configurable agent timeout settings
- **Multi-User Support**: Each Discord user gets their own dedicated agent instance

## Configuration
### DiscordServiceConfig Schema
```typescript
export const DiscordServiceConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  channelId: z.string().optional(),
  authorizedUserIds: z.array(z.string()).optional(),
  defaultAgentType: z.string().optional()
});
```

### Configuration Options
- **botToken**: Required Discord bot token for authentication
- **channelId**: Optional specific channel ID to send startup notification
- **authorizedUserIds**: Optional array of user IDs allowed to use the bot
- **defaultAgentType**: Optional default agent type to spawn (defaults to "teamLeader")

### Example Configuration
```json
{
  "discord": {
    "botToken": "your-bot-token-here",
    "channelId": "123456789012345678",
    "authorizedUserIds": ["987654321098765432", "112233445566778899"],
    "defaultAgentType": "researcher"
  }
}
```

## Core Components

### DiscordService
Main service class that manages Discord bot operations and agent integration.

#### Key Methods
- **run(signal: AbortSignal)**: Starts the Discord bot and begins listening for messages
- **handleChatOutput(message: Message, content: string)**: Processes chat responses and splits them into chunks
- **handleSystemOutput(message: Message, messageText: string, level: string)**: Handles system-level outputs (info, warning, error)
- **getOrCreateAgentForUser(userId: string)**: Manages agent creation and retrieval for Discord users

### Event Handling
The service processes various Discord events:
- **messageCreate**: Handles incoming messages from users
- **ready**: Bot connection and startup notifications

## Usage Examples

### Basic Setup
1. **Install the plugin**:
```bash
bun add @tokenring-ai/discord
```

2. **Configure in your TokenRing app**:
```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import discordPlugin from "@tokenring-ai/discord";

const app = new TokenRingApp({
  plugins: [discordPlugin]
});
```

3. **Provide Discord configuration**:
```typescript
app.setConfig({
  discord: {
    botToken: "your-discord-bot-token",
    channelId: "your-channel-id"
  }
});
```

### Interaction Workflow
1. User mentions the bot or sends a direct message
2. Bot validates user authorization (if configured)
3. Bot creates or retrieves a dedicated agent for the user
4. Bot sends the message to the agent
5. Bot subscribes to agent events and processes responses
6. Bot sends formatted responses back to Discord

### Message Handling
- **Mention-based interaction**: `@YourBot Hi there!`
- **Direct message interaction**: Simply send a message to the bot
- **System messages**: Bot responds with formatted system-level messages

## Integration Patterns

### Agent Management
Each Discord user gets their own agent instance managed by:
- **User-Agent Mapping**: Discord user IDs map to specific agent instances
- **Agent Spawning**: Automatic agent creation when a user first interacts
- **Agent Cleanup**: Proper agent deletion when the service stops

### Event Processing
The service handles agent events in real-time:
- **output.chat**: Normal chat responses
- **output.info**: Informational messages
- **output.warning**: Warning messages  
- **output.error**: Error messages
- **input.handled**: Notification that input has been processed

## Security Features

### User Authorization
- Configurable authorized user lists prevent unauthorized access
- Empty authorizedUserIds allows all users (not recommended for production)

### Bot Token Security
- Bot token should be stored securely (environment variables recommended)
- Token is required for Discord API authentication

## Troubleshooting

### Common Issues
- **Bot not responding**: Check bot token validity and Discord API permissions
- **Authorization errors**: Verify authorizedUserIds configuration
- **Long message truncation**: Discord's 2000 character limit is automatically handled
- **Connection issues**: Ensure proper Discord gateway intents are configured

### Error Handling
- Invalid bot token throws an error during initialization
- Unauthorized users receive a clear rejection message
- Agent timeout errors provide user feedback
- Connection errors are properly cleaned up on shutdown

## Package Structure

### Files
- `index.ts`: Plugin entry point
- `DiscordService.ts`: Main service implementation
- `package.json`: Package configuration and dependencies

### Dependencies
- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/agent`: Agent management
- `discord.js`: Discord API client
- `zod`: Configuration schema validation

## Development

### Testing
```bash
bun run test
bun run test:watch
bun run test:coverage
```

### Build
```bash
bun run build
```

## License
MIT License - see package.json for details.