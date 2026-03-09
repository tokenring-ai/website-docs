# Telegram Plugin

Telegram bot integration with group-based and direct messaging agent management, file attachments, and escalation support for AI-powered interactions.

## Overview

The `@tokenring-ai/telegram` package integrates Telegram with TokenRing agents, enabling bot interactions through Telegram's messaging platform. The service supports multiple bots with group-based configurations, where each group gets its own dedicated agent instance. It also supports direct messaging (DM) with per-user agent instances. The plugin provides escalation capabilities through the `EscalationProvider` interface for agent-to-human decision workflows.

Key capabilities include:
- Multi-bot support with named configurations
- Group-based agent instances with persistent conversation history
- Direct messaging with reply-based response handling
- File attachment support (photos and documents)
- Integration with the escalation system for human-in-the-loop workflows
- Message buffering and intelligent edit/update patterns
- Configurable command mapping for custom bot commands
- Markdown support with fallback to plain text

## Key Features

- **Multi-Bot Support**: Manage multiple Telegram bots simultaneously with named configurations
- **Group-Based Agent Management**: Each Telegram group gets a dedicated agent instance with persistent chat history
- **Direct Messaging (DM) Support**: Optional DM support with per-user agent instances and authorization control
- **Authorization Control**: User whitelist for access management per group and DM
- **Direct Messaging with Replies**: Send messages to users and await responses via Telegram reply mechanism
- **Escalation Provider**: Implements `EscalationProvider` interface for agent-to-human escalation workflows
- **Event-Driven Communication**: Handles agent events and sends responses back to Telegram
- **Message Buffering**: Efficient message buffering with automatic edit/update for long responses
- **Timeout Management**: Configurable agent timeout handling with user feedback
- **Graceful Shutdown**: Proper cleanup of all user agents on service termination
- **Plugin Integration**: Seamless integration with TokenRing plugin system
- **File Attachments**: Supports photos and documents with configurable size limits
- **Command Mapping**: Configurable command mapping for custom bot commands
- **Markdown Support**: Messages are sent with Markdown formatting (with fallback to plain text)

## Core Components

### TelegramService

Main service class implementing `TokenRingService` for managing multiple Telegram bots.

#### Constructor

```typescript
constructor(app: TokenRingApp, options: ParsedTelegramServiceConfig)
```

- **app**: TokenRingApp instance
- **options**: Validated configuration object with bots configuration

#### Properties

- `name`: "TelegramService" - Service identifier
- `description`: "Manages multiple Telegram bots for interacting with TokenRing agents."
- `getAvailableBots()`: Returns array of available bot names
- `getBot(botName: string)`: Returns the specified TelegramBot instance

#### Methods

- `run(signal: AbortSignal): Promise<void>`: Starts the Telegram bots and begins polling for messages. Handles the complete service lifecycle including startup, message processing, and graceful shutdown.

### TelegramBot

Bot implementation handling message processing and user interactions. This class is not exported from the main entry point; access via `telegramService.getBot()`.

#### Constructor

```typescript
constructor(app: TokenRingApp, telegramService: TelegramService, botName: string, botConfig: ParsedTelegramBotConfig)
```

- **app**: TokenRingApp instance
- **telegramService**: The parent TelegramService instance
- **botName**: Name of this bot configuration
- **botConfig**: Validated bot configuration

#### Methods

- `start(): Promise<void>`: Starts the Telegram bot and begins polling
- `stop(): Promise<void>`: Gracefully stops the bot and cleans up resources
- `createCommunicationChannelWithGroup(groupName: string): CommunicationChannel`: Creates a communication channel for a specific group
- `createCommunicationChannelWithUser(userId: string): CommunicationChannel`: Creates a communication channel for a specific user
- `getBotUsername(): string | undefined`: Returns the bot's username

### TelegramEscalationProvider

Escalation provider implementation for agent-to-human workflows.

#### Constructor

```typescript
constructor(config: ParsedTelegramEscalationProviderConfig)
```

- **config**: Configuration with `bot` (bot name) and `group` (group name)

#### Methods

- `createCommunicationChannelWithUser(groupName: string, agent: Agent): Promise<CommunicationChannel>`: Creates a communication channel for escalation

## Services

### TelegramService

The `TelegramService` manages multiple Telegram bots and provides the core functionality for bot operations.

#### Configuration Schema

```typescript
export const TelegramServiceConfigSchema = z.object({
  bots: z.record(z.string(), TelegramBotConfigSchema)
});
```

#### Example Service Usage

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { TelegramService } from '@tokenring-ai/telegram';
import { TelegramServiceConfigSchema } from '@tokenring-ai/telegram/schema';

const app = new TokenRingApp();

const config = {
  bots: {
    "primaryBot": {
      name: "Primary Bot",
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      groups: {
        "developers": {
          groupId: -1001234567890,
          allowedUsers: [],
          agentType: "developerAgent"
        }
      }
    }
  }
};

const validatedConfig = TelegramServiceConfigSchema.parse(config);
const telegramService = new TelegramService(app, validatedConfig);
app.addServices(telegramService);
```

## Provider Documentation

### EscalationProvider Implementation

The `TelegramEscalationProvider` implements the `EscalationProvider` interface from `@tokenring-ai/escalation`.

#### Configuration Schema

```typescript
export const TelegramEscalationProviderConfigSchema = z.object({
  type: z.literal('telegram'),
  bot: z.string(),
  group: z.string(),
});
```

#### Registration Example

```typescript
import TokenRingApp from '@tokenring-ai/app';
import telegramPlugin from '@tokenring-ai/telegram';
import escalationPlugin from '@tokenring-ai/escalation';

const app = new TokenRingApp({
  telegram: {
    bots: {
      "primaryBot": {
        name: "Primary Bot",
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
        groups: {
          "admins": {
            groupId: -1001234567890,
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  },
  escalation: {
    providers: {
      "telegramAdmins": {
        type: "telegram",
        bot: "primaryBot",
        group: "admins"
      }
    },
    groups: {
      "admins": ["123456789@telegram"]
    }
  }
});

app.install(escalationPlugin);
app.install(telegramPlugin);
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

This package does not define any chat commands. Commands are handled by the agents themselves. However, the package supports configurable command mapping that allows you to map bot commands to agent commands.

### Command Mapping

The `commandMapping` configuration option allows you to map Telegram bot commands to agent commands:

```typescript
{
  commandMapping: {
    "/reset": "/chat reset",
    "/help": "/chat help"
  }
}
```

By default, the package includes the following mapping:

```typescript
{
  "/reset": "/chat reset"
}
```

When a user sends a command that exists in the `commandMapping`, the bot will prepend the mapped command to the message and send it to the agent. For example, if a user sends `/reset`, the agent will receive `/chat reset`.

Commands not in the mapping that start with `/` will result in an error. Commands that don't start with `/` are sent as regular chat messages.

## Configuration

### Plugin Configuration Schema

The plugin uses nested configuration with both `telegram` and `escalation` options.

```typescript
export const packageConfigSchema = z.object({
  telegram: TelegramServiceConfigSchema.optional(),
  escalation: EscalationServiceConfigSchema.optional()
});
```

### Telegram Service Configuration

#### Required Bot Properties

| Property | Type | Description |
|----------|------|-------------|
| `botToken` | `string` | Telegram bot token obtained from @BotFather (required) |
| `name` | `string` | Unique name for this bot configuration |

#### Optional Bot Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `joinMessage` | `string` | `undefined` | Message to send when bot starts up to all configured groups |
| `maxPhotoPixels` | `number` | `1000000` | Maximum pixel count for photos (width × height) |
| `maxFileSize` | `number` | `20971520` | Maximum file size for files in bytes (20MB) - *Note: Currently unused* |
| `maxDocumentSize` | `number` | `10485760` | Maximum file size for documents in bytes (10MB) |
| `groups` | `object` | `{}` | Map of group configurations |
| `dmAgentType` | `string` | `undefined` | Agent type for direct messages (DMs disabled if not provided) |
| `dmAllowedUsers` | `number[]` | `[]` | Array of Telegram user IDs allowed to use DMs |
| `commandMapping` | `Record<string, string>` | `{"/reset": "/chat reset"}` | Map of bot commands to agent commands |

#### Group Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `groupId` | `number` | (required) | Telegram group/chat ID (must be negative) |
| `allowedUsers` | `number[]` | `[]` | Array of Telegram user IDs allowed to interact (empty = all users allowed) |
| `agentType` | `string` | (required) | Agent type to use for this group |

### Example Configuration

```typescript
{
  bots: {
    "primaryBot": {
      name: "Primary Bot",
      botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      joinMessage: "Bot is online! Type /help for available commands.",
      maxPhotoPixels: 1000000,
      maxFileSize: 20971520,
      maxDocumentSize: 10485760,
      commandMapping: {
        "/reset": "/chat reset",
        "/help": "/chat help"
      },
      groups: {
        "developers": {
          groupId: -1001234567890,
          allowedUsers: [123456789, 987654321],
          agentType: "developerAgent"
        },
        "managers": {
          groupId: -1009876543210,
          allowedUsers: [],
          agentType: "managerAgent"
        }
      },
      dmAgentType: "personalAgent",
      dmAllowedUsers: [123456789]
    },
    "secondaryBot": {
      name: "Secondary Bot",
      botToken: "987654:XYZ-ABC5678jkl-Mno987Qrs456def22",
      groups: {
        "support": {
          groupId: -1005555555555,
          allowedUsers: [],
          agentType: "supportAgent"
        }
      }
    }
  }
}
```

## Integration

### Plugin Installation

The recommended way to use the Telegram service is through the TokenRing plugin system:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import telegramPlugin from '@tokenring-ai/telegram';

const app = new TokenRingApp({
  // Your app configuration
});

// Install the Telegram plugin
app.install(telegramPlugin);

await app.start();
```

### Escalation Integration

To use the Telegram escalation provider, configure both the Telegram plugin and escalation plugin:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import telegramPlugin from '@tokenring-ai/telegram';
import escalationPlugin from '@tokenring-ai/escalation';

const app = new TokenRingApp({
  telegram: {
    bots: {
      "primaryBot": {
        name: "Primary Bot",
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
        groups: {
          "admins": {
            groupId: -1001234567890,
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  },
  escalation: {
    providers: {
      "telegramAdmins": {
        type: "telegram",
        bot: "primaryBot",
        group: "admins"
      }
    },
    groups: {
      "admins": ["123456789@telegram"]
    }
  }
});

app.install(escalationPlugin);
app.install(telegramPlugin);
```

### Agent Integration

The Telegram service integrates with agents by creating dedicated agent instances for each group or DM user:

- **Agent Creation**: Creates agents using `agentType` from group configuration or `dmAgentType` for DMs
- **Event Processing**: Subscribes to agent events for response handling
- **State Management**: Maintains persistent state across conversations
- **Resource Management**: Proper cleanup of agent resources

## Usage Examples

### Basic Bot Setup (Groups Only)

```typescript
import TokenRingApp from '@tokenring-ai/app';
import telegramPlugin from '@tokenring-ai/telegram';

const app = new TokenRingApp({
  telegram: {
    bots: {
      "primaryBot": {
        name: "Primary Bot",
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
        groups: {
          "developers": {
            groupId: -1001234567890,
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(telegramPlugin);
await app.start();
```

### Bot Setup with Direct Messaging

```typescript
import TokenRingApp from '@tokenring-ai/app';
import telegramPlugin from '@tokenring-ai/telegram';

const app = new TokenRingApp({
  telegram: {
    bots: {
      "primaryBot": {
        name: "Primary Bot",
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
        groups: {
          "developers": {
            groupId: -1001234567890,
            allowedUsers: [],
            agentType: "teamLeader"
          }
        },
        dmAgentType: "personalAgent",
        dmAllowedUsers: [123456789, 987654321]
      }
    }
  }
});

app.install(telegramPlugin);
await app.start();
```

### Direct Messaging with Escalation

```typescript
// In agent code
const escalationService = agent.requireServiceByType(EscalationService);

// Create a communication channel and send message
const channel = await escalationService.initiateContactWithUserOrGroup(
  'admins', // Group name
  'Approve production deployment?',
  agent
);

// Listen for response
for await (const message of channel.receive()) {
  if (message.toLowerCase().includes('yes')) {
    // Proceed with deployment
    console.log('Deployment approved');
  }
  await channel[Symbol.asyncDispose]();
  break;
}
```

### Manual Bot Management

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { TelegramService } from '@tokenring-ai/telegram';

const app = new TokenRingApp();

const telegramService = new TelegramService(app, {
  bots: {
    "primaryBot": {
      name: "Primary Bot",
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      groups: {
        "developers": {
          groupId: -1001234567890,
          allowedUsers: [],
          agentType: "developerAgent"
        }
      }
    }
  }
});

app.addServices(telegramService);
await telegramService.run(signal);
```

### Using Communication Channels

```typescript
// Get the Telegram service from an agent
const telegramService = agent.requireServiceByType(TelegramService);

// Get the bot instance
const bot = telegramService.getBot("primaryBot");

// Create a communication channel with a specific group
const channel = bot.createCommunicationChannelWithGroup("developers");

// Send a message
await channel.send('Please approve this deployment');

// Listen for a response
for await (const message of channel.receive()) {
  console.log('User responded:', message);
  break; // Process response and break out of loop
}

// Clean up the channel
await channel[Symbol.asyncDispose]();
```

## Best Practices

### Bot Token Security

- Never commit bot tokens to version control
- Use environment variables for bot tokens
- Rotate tokens regularly for production bots

### Group Configuration

- Use descriptive group names for clarity
- Limit `allowedUsers` for security-critical applications
- Test group configurations before production deployment

### Direct Messaging

- Configure `dmAgentType` only if you want to enable DMs
- Use `dmAllowedUsers` to restrict DM access to specific users
- Monitor DM usage to prevent abuse

### Error Handling

- Implement proper error logging for debugging
- Monitor bot health through service events
- Handle rate limiting by respecting Telegram API limits

### File Attachments

- Set appropriate `maxPhotoPixels` for your use case
- Configure `maxDocumentSize` based on your storage constraints
- Note that audio, voice, video, and GIF attachments are not currently supported

### Command Mapping

- Use clear and consistent command names
- Map common commands to improve user experience
- Document available commands in your `joinMessage`

## Message Processing Flow

### Regular Messages (Group)

1. **Mention Check**: Verifies message contains bot username mention (`@botname`)
2. **Authorization Check**: Verifies user is authorized for the group (if user whitelist is configured)
3. **Agent Management**: Gets or creates dedicated agent for the group
4. **State Wait**: Waits for agent to be idle before processing new input
5. **Input Handling**: Sends message to agent for processing
6. **Event Processing**: Subscribes to agent events:
   - `output.chat`: Sends chat responses to Telegram (with buffering)
   - `output.info`: Sends system messages with level formatting
   - `output.warning`: Sends system messages with level formatting
   - `output.error`: Sends system messages with level formatting
   - `input.handled`: Cleans up event subscription and handles timeouts
7. **Response Accumulation**: Accumulates chat content with intelligent buffering
8. **Timeout Handling**: Implements configurable timeout with user feedback

### Direct Messages (DM)

1. **Authorization Check**: Verifies user is authorized for DM (if user whitelist is configured)
2. **Agent Management**: Gets or creates dedicated agent for the user
3. **State Wait**: Waits for agent to be idle before processing new input
4. **Input Handling**: Sends message to agent for processing
5. **Event Processing**: Same as group messages
6. **Response Delivery**: Sends accumulated responses to the user

### Reply Handling (Escalation)

1. **Message Sent**: Bot sends message to user via `CommunicationChannel.send()`
2. **Handler Registered**: Message ID is tracked for reply detection
3. **User Replies**: User uses Telegram reply feature to respond
4. **Reply Processed**: Registered listeners are invoked with response text
5. **Confirmation Sent**: User receives confirmation (reply handler cleanup)
6. **Cleanup**: Handler removed from registry

## File Attachments

The service supports the following file types:

### Photos

- Extracts the highest quality photo that fits within `maxPhotoPixels`
- Downloads and converts to base64
- Sent as image attachment to agent

### Documents

- Downloads and converts to base64
- Respects `maxDocumentSize` limit (default 10MB)
- Skips image documents (processed as photos)
- Preserves original filename and MIME type

### Unsupported Attachments

The following attachment types are currently not supported:
- Audio
- Voice messages
- Video
- Video notes (video messages)
- Animations/GIFs

## Error Handling

### Bot-Level Errors

- **Polling Errors**: Logged to console with error details
- **Message Processing**: Wrapped in try-catch to prevent crashes
- **Bot Startup**: Validates configuration before initialization

### User-Level Errors

- **Authorization**: Sends "Sorry, you are not authorized to use this bot." for unauthorized users
- **Timeout**: Sends `Agent timed out after {time} seconds.` when agents exceed max runtime
- **No Response**: Sends "No response received from agent." when no output is generated
- **Group Not Found**: Throws error when referencing non-existent group configuration
- **DM Not Enabled**: Sends "DMs are not enabled for this bot." when dmAgentType is not configured

### Service-Level Errors

- **Configuration**: Validates bot token presence on construction
- **Shutdown**: Graceful cleanup with error handling for bot stop operations
- **Resource Management**: Proper cleanup of all user agents on service termination
- **Bot Not Found**: Throws error when referencing non-existent bot configuration

## Testing and Development

### Running Tests

The package includes comprehensive unit and integration tests:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Development Setup

1. Clone the repository
2. Install dependencies with `bun install`
3. Set up environment variables for testing
4. Run tests with `bun test`

### Package Structure

```
pkg/telegram/
├── index.ts                              # Main exports
├── plugin.ts                             # Plugin definition for TokenRing integration
├── TelegramService.ts                    # Core service implementation
├── TelegramBot.ts                        # Bot implementation with message handling
├── TelegramEscalationProvider.ts         # Escalation provider implementation
├── schema.ts                             # Configuration schemas
├── parseCommand.ts                       # Command parsing utility
├── fetchTelegramFile.ts                  # File download utility
├── splitIntoChunks.ts                    # Message chunking utility
├── throttledBatchProcessor.ts            # Batch processing utility
├── vitest.config.ts                      # Vitest configuration
└── README.md                             # Package README
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/agent` (0.2.0) - Agent management
- `@tokenring-ai/utility` (0.2.0) - Utility functions
- `@tokenring-ai/escalation` (0.2.0) - Escalation provider interface
- `node-telegram-bot-api` (^0.67.0) - Telegram API binding
- `axios` (^1.13.6) - HTTP client for file downloads
- `marked` (^17.0.3) - Markdown parsing
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `@types/node-telegram-bot-api` (^0.64.14) - TypeScript definitions
- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent management system
- `@tokenring-ai/escalation` - Escalation service
- `@tokenring-ai/utility` - Utility functions and patterns

## License

MIT License - see `LICENSE` file for details.
