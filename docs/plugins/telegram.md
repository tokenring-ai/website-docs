# Telegram Plugin

Telegram bot integration with group-based agent management and escalation support for AI-powered interactions.

## Overview

The `@tokenring-ai/telegram` package integrates Telegram with TokenRing agents, enabling bot interactions through Telegram's messaging platform. The service supports multiple bots with group-based configurations, where each group gets its own dedicated agent instance. The plugin also provides escalation capabilities through the `EscalationProvider` interface for agent-to-human decision workflows.

## Key Features

- **Multi-Bot Support**: Manage multiple Telegram bots simultaneously with named configurations
- **Group-Based Agent Management**: Each Telegram group gets a dedicated agent instance
- **Authorization Control**: User whitelist for access management per group
- **Direct Messaging with Replies**: Send messages to users and await responses via Telegram reply mechanism
- **Escalation Provider**: Implements `EscalationProvider` interface for agent-to-human escalation workflows
- **Event-Driven Communication**: Handles agent events and sends responses back to Telegram
- **Message Buffering**: Efficient message buffering with automatic edit/update for long responses
- **Timeout Management**: Configurable agent timeout handling with user feedback
- **Graceful Shutdown**: Proper cleanup of all user agents on service termination
- **Plugin Integration**: Seamless integration with TokenRing plugin system

## Core Components

### TelegramBotService

Main service class implementing `TokenRingService` for managing multiple Telegram bots.

#### Constructor

```typescript
constructor(app: TokenRingApp, options: ParsedTelegramServiceConfig)
```

#### Properties

- `name`: "TelegramService" - Service identifier
- `description`: "Manages multiple Telegram bots for interacting with TokenRing agents."
- `getAvailableBots()`: Returns array of available bot names
- `getBot(botName: string)`: Returns the specified TelegramBot instance

#### Methods

- `run(signal: AbortSignal): Promise<void>`: Starts the Telegram bots and begins polling for messages

### TelegramBot

Bot implementation handling message processing and user interactions.

#### Constructor

```typescript
constructor(app: TokenRingApp, botName: string, botConfig: ParsedTelegramBotConfig)
```

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

#### Methods

- `createCommunicationChannelWithUser(groupName: string, agent: Agent): Promise<CommunicationChannel>`: Creates a communication channel for escalation

## Services

### TelegramBotService

The `TelegramBotService` manages multiple Telegram bots and provides the core functionality for bot operations.

#### Configuration Schema

```typescript
export const TelegramServiceConfigSchema = z.object({
  bots: z.record(z.string(), TelegramBotConfigSchema)
});
```

#### Example Service Usage

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { TelegramBotService } from '@tokenring-ai/telegram';
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
const telegramService = new TelegramBotService(app, validatedConfig);
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
| `groups` | `object` | `{}` | Map of group configurations |

#### Group Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `groupId` | `number` | (required) | Telegram group/chat ID (must be negative) |
| `allowedUsers` | `string[]` | `[]` | Array of Telegram user IDs allowed to interact (empty = all users allowed) |
| `agentType` | `string` | (required) | Agent type to use for this group |

### Example Configuration

```typescript
{
  bots: {
    "primaryBot": {
      name: "Primary Bot",
      botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      joinMessage: "Bot is online! Type /help for available commands.",
      groups: {
        "developers": {
          groupId: -1001234567890,
          allowedUsers: ["123456789", "987654321"],
          agentType: "developerAgent"
        },
        "managers": {
          groupId: -1009876543210,
          allowedUsers: [],
          agentType: "managerAgent"
        }
      }
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

The Telegram service integrates with agents by creating dedicated agent instances for each group:

- **Agent Creation**: Creates agents using `agentType` from group configuration
- **Event Processing**: Subscribes to agent events for response handling
- **State Management**: Maintains persistent state across conversations
- **Resource Management**: Proper cleanup of agent resources

## Usage Examples

### Basic Bot Setup

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
import { TelegramBotService } from '@tokenring-ai/telegram';

const app = new TokenRingApp();

const telegramService = new TelegramBotService(app, {
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

## Best Practices

### Bot Token Security

- Never commit bot tokens to version control
- Use environment variables for bot tokens
- Rotate tokens regularly for production bots

### Group Configuration

- Use descriptive group names for clarity
- Limit `allowedUsers` for security-critical applications
- Test group configurations before production deployment

### Error Handling

- Implement proper error logging for debugging
- Monitor bot health through service events
- Handle rate limiting by respecting Telegram API limits

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
├── index.ts                 # Main exports
├── plugin.ts                # Plugin definition for TokenRing integration
├── TelegramService.ts       # Core service implementation
├── TelegramBot.ts           # Bot implementation with message handling
├── TelegramEscalationProvider.ts  # Escalation provider implementation
├── schema.ts                # Configuration schemas
├── test/                    # Test files
└── vitest.config.ts         # Vitest configuration
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/agent` (0.2.0) - Agent management
- `@tokenring-ai/utility` (0.2.0) - Utility functions
- `@tokenring-ai/escalation` (0.2.0) - Escalation provider interface
- `node-telegram-bot-api` (^0.67.0) - Telegram API binding

### Development Dependencies

- `@types/node-telegram-bot-api` (^0.64.13) - TypeScript definitions
- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent management system
- `@tokenring-ai/escalation` - Escalation service
- `@tokenring-ai/utility` - Utility functions and patterns

## License

MIT License - see [LICENSE](../../LICENSE) file for details.