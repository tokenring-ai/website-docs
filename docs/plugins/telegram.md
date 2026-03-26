# Telegram Plugin

Telegram bot service for TokenRing agents with multi-bot support, group/DM conversations, and escalation provider integration.

## Overview

The `@tokenring-ai/telegram` package provides a comprehensive Telegram bot service that integrates with TokenRing agents, enabling natural language conversations through Telegram. Each Telegram user or group gets their own dedicated agent instance that maintains conversation history and context. The service handles message routing, event processing, and automatic agent management.

As a core integration package, it provides:

- **Multi-Bot Support**: Manage multiple Telegram bots simultaneously with named configurations
- **Group-Based Configuration**: Configure bots with specific groups for different agent types
- **Direct Messaging (DM) Support**: Optional DM support with per-user agent instances
- **Per-User/Group Agents**: Each Telegram user or group gets a dedicated agent with persistent chat history
- **Event-Driven Communication**: Handles agent events and sends responses back to Telegram
- **Escalation Provider**: Implements `EscalationProvider` interface for agent-to-human escalation workflows
- **Message Buffering**: Efficient message buffering with automatic edit/update for long responses
- **File Attachments**: Supports photos and documents with configurable size limits
- **Command Mapping**: Configurable command mapping for custom bot commands
- **Markdown Support**: Messages are sent with Markdown formatting (with fallback to plain text)

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

- **Multi-Bot Architecture**: Support for multiple independently configured bots
- **Authorization Control**: User whitelists for both groups and DMs
- **Reply-Based Communication**: Support for Telegram reply feature in escalation workflows
- **Intelligent Message Buffering**: 250ms throttled batching with message editing
- **Automatic Agent Lifecycle**: Creates, manages, and cleans up agents per chat
- **Graceful Shutdown**: Proper cleanup of all resources on service termination
- **Error Handling**: Robust error handling with Markdown parse error fallbacks
- **File Processing**: Photo and document extraction with size validation

## Installation

```bash
bun add @tokenring-ai/telegram
```

### Dependencies

This package requires the following dependencies:

- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/agent` (0.2.0) - Agent management
- `@tokenring-ai/utility` (0.2.0) - Utility functions
- `@tokenring-ai/escalation` (0.2.0) - Escalation provider interface
- `node-telegram-bot-api` (^0.67.0) - Telegram API binding
- `axios` (^1.13.6) - HTTP client for file downloads
- `marked` (^17.0.5) - Markdown parsing
- `zod` (^4.3.6) - Schema validation

## Core Components

### TelegramService

The main service class that manages multiple Telegram bot instances.

**Location**: `TelegramService.ts`

**Implements**: `TokenRingService`

**Key Methods**:

- `constructor(app: TokenRingApp, options: ParsedTelegramServiceConfig)`: Initializes the service with app instance and configuration
- `run(signal: AbortSignal): Promise<void>`: Starts all configured bots and handles lifecycle
- `getAvailableBots(): string[]`: Returns array of configured bot names
- `getBot(botName: string): TelegramBot`: Returns the specified bot instance

**Properties**:

- `name: string`: Service identifier ("TelegramService")
- `description: string`: Service description

#### Constructor

```typescript
constructor(app: TokenRingApp, options: ParsedTelegramServiceConfig)
```

- **app**: TokenRingApp instance
- **options**: Validated configuration object with bots configuration

### TelegramBot

The bot implementation that handles Telegram API interactions and message processing.

**Location**: `TelegramBot.ts`

**Note**: Not exported from main entry point. Access via `telegramService.getBot()`.

**Key Methods**:

- `constructor(app: TokenRingApp, telegramService: TelegramService, botName: string, botConfig: ParsedTelegramBotConfig)`: Initializes bot with configuration
- `start(): Promise<void>`: Starts the bot and begins polling
- `stop(): Promise<void>`: Gracefully stops the bot and cleans up resources
- `createCommunicationChannelWithGroup(groupName: string): CommunicationChannel`: Creates a communication channel for escalation
- `createCommunicationChannelWithUser(userId: string): CommunicationChannel`: Creates a communication channel for a specific user
- `getBotUsername(): string | undefined`: Returns the bot's username

**Internal Components**:

- **Message Handling**: Processes incoming messages with authorization checks
- **Agent Management**: Creates and manages agents per chat ID
- **Event Processing**: Subscribes to agent events and forwards to Telegram
- **Response Buffering**: Implements throttled batch processing for efficient messaging
- **File Extraction**: Handles photo and document attachments

#### Constructor

```typescript
constructor(app: TokenRingApp, telegramService: TelegramService, botName: string, botConfig: ParsedTelegramBotConfig)
```

- **app**: TokenRingApp instance
- **telegramService**: The parent TelegramService instance
- **botName**: Name of this bot configuration
- **botConfig**: Validated bot configuration

### TelegramEscalationProvider

Implements the `EscalationProvider` interface for escalation workflows.

**Location**: `TelegramEscalationProvider.ts`

**Key Methods**:

- `constructor(config: ParsedTelegramEscalationProviderConfig)`: Initializes with bot and group configuration
- `createCommunicationChannelWithUser(groupName: string, agent: Agent): Promise<CommunicationChannel>`: Creates a communication channel for escalation

#### Constructor

```typescript
constructor(config: ParsedTelegramEscalationProviderConfig)
```

- **config**: Configuration with `bot` (bot name) and `group` (group name)

## Services

### TelegramService

The `TelegramService` manages multiple Telegram bots and provides the core functionality for bot operations.

**Type**: `TokenRingService`

**Purpose**: Manages multiple Telegram bot instances and their lifecycle

**Registration**: Automatically registered when plugin is installed with telegram configuration

**Integration**:

- Integrates with `TokenRingApp` for service management
- Uses `AgentManager` for agent lifecycle
- Integrates with `EscalationService` when escalation plugin is configured

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
import { TelegramServiceConfigSchema } from '@tokenring-ai/telegram/schema.ts';

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

When using the plugin, escalation providers are automatically registered when both `telegram` and `escalation` configurations are present:

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
    }
  }
});

app.install(telegramPlugin);
app.install(escalationPlugin);
```

## RPC Endpoints

This package does not define any RPC endpoints. It uses the Telegram Bot API directly via the `node-telegram-bot-api` library.

## Chat Commands

The package supports configurable command mapping via the `commandMapping` configuration option. Default mapping:

```typescript
{
  "/reset": "/chat reset"
}
```

**Supported Commands**:

- `/reset` - Resets the agent conversation (maps to `/chat reset`)
- `/stop` - Special command that aborts the current agent operation

**Custom Commands**: Add custom command mappings in configuration:

```typescript
commandMapping: {
  "/reset": "/chat reset",
  "/help": "/chat help",
  "/status": "/chat status"
}
```

Commands not in the mapping that start with `/` will result in an error. Commands that don't start with `/` are sent as regular chat messages.

## Configuration

### Configuration Schemas

The package uses Zod schemas for configuration validation:

```typescript
import { 
  TelegramBotConfigSchema, 
  TelegramServiceConfigSchema, 
  TelegramEscalationProviderConfigSchema 
} from '@tokenring-ai/telegram/schema.ts';
```

### TelegramBotConfigSchema

Configuration for individual bot instances:

```typescript
export const TelegramBotConfigSchema = z.object({
  name: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  joinMessage: z.string().optional(),
  maxPhotoPixels: z.number().default(1_000_000),
  maxFileSize: z.number().default(20_971_520), // 20MB default
  maxDocumentSize: z.number().default(10_485_760), // 10MB default
  groups: z.record(z.string(), z.object({
    groupId: z.number().max(0, "Group ID must be a negative number"),
    allowedUsers: z.array(z.number()).default([]),
    agentType: z.string(),
  })),
  dmAgentType: z.string(),
  dmAllowedUsers: z.array(z.number()).default([]),
  commandMapping: z.record(z.string(), z.string()).default({
    "/reset": "/chat reset",
  })
});
```

**Properties**:

- **`name`** (string): Unique name for this bot configuration
- **`botToken`** (string): Telegram bot token from [BotFather](https://t.me/botfather)
- **`joinMessage`** (string, optional): Message sent to all groups on bot startup
- **`maxPhotoPixels`** (number): Maximum pixel count for photos (width × height), default 1,000,000
- **`maxFileSize`** (number): Maximum file size in bytes, default 20MB (20,971,520)
- **`maxDocumentSize`** (number): Maximum document size in bytes, default 10MB (10,485,760)
- **`groups`** (object): Map of group configurations
  - **`groupId`** (number): Telegram group/chat ID (must be negative)
  - **`allowedUsers`** (number[]): Array of allowed user IDs (empty = all users)
  - **`agentType`** (string): Agent type for this group
- **`dmAgentType`** (string): Agent type for direct messages (DMs disabled if not provided)
- **`dmAllowedUsers`** (number[]): Array of allowed DM user IDs (empty = all users)
- **`commandMapping`** (`Record<string, string>`): Map of bot commands to agent commands

### TelegramServiceConfigSchema

Configuration for the service with multiple bots:

```typescript
export const TelegramServiceConfigSchema = z.object({
  bots: z.record(z.string(), TelegramBotConfigSchema)
});
```

### TelegramEscalationProviderConfigSchema

Configuration for escalation provider:

```typescript
export const TelegramEscalationProviderConfigSchema = z.object({
  type: z.literal('telegram'),
  bot: z.string(),
  group: z.string(),
});
```

### Plugin Configuration Schema

The plugin uses nested configuration with both `telegram` and `escalation` options.

```typescript
export const packageConfigSchema = z.object({
  telegram: TelegramServiceConfigSchema.optional(),
  escalation: EscalationServiceConfigSchema.optional()
});
```

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

### Escalation Integration

To use the Telegram escalation provider, configure both the Telegram and escalation plugins:

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

app.install(telegramPlugin);
app.install(escalationPlugin);
await app.start();
```

### Manual Service Registration

For advanced usage, services can be registered manually:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import TelegramService from '@tokenring-ai/telegram/TelegramService.ts';
import { TelegramServiceConfigSchema } from '@tokenring-ai/telegram/schema.ts';

const app = new TokenRingApp();

const config = TelegramServiceConfigSchema.parse({
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
});

app.addServices(new TelegramService(app, config));
await app.start();
```

### Agent Integration

The Telegram service integrates with agents by creating dedicated agent instances for each group or DM user:

- **Agent Creation**: Creates agents using `agentType` from group configuration or `dmAgentType` for DMs
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
      "myBot": {
        name: "My Bot",
        botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        groups: {
          "main": {
            groupId: -1001234567890,
            allowedUsers: [],
            agentType: "developerAgent"
          }
        }
      }
    }
  }
});

app.install(telegramPlugin);
await app.start();
```

### Direct Messaging Setup

```typescript
const app = new TokenRingApp({
  telegram: {
    bots: {
      "myBot": {
        name: "My Bot",
        botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        groups: {
          "main": {
            groupId: -1001234567890,
            allowedUsers: [],
            agentType: "developerAgent"
          }
        },
        dmAgentType: "personalAgent",
        dmAllowedUsers: [123456789, 987654321]
      }
    }
  }
});
```

### Communication Channel Example

```typescript
import { TelegramService } from '@tokenring-ai/telegram';
import { EscalationService } from '@tokenring-ai/escalation';

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

// Clean up
await channel[Symbol.asyncDispose]();
```

### Escalation Example

```typescript
import { EscalationService } from '@tokenring-ai/escalation';

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
    console.log('Deployment approved');
  }
  await channel[Symbol.asyncDispose]();
  break;
}
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

## Best Practices

### Security

1. **Never commit bot tokens**: Use environment variables for bot tokens
2. **Use user authorization**: Configure `allowedUsers` and `dmAllowedUsers` to restrict access
3. **Validate group IDs**: Ensure group IDs are negative numbers as required by Telegram
4. **Handle errors gracefully**: Implement proper error handling for all Telegram API calls

### Performance

1. **Configure appropriate limits**: Set `maxPhotoPixels` and `maxDocumentSize` based on your needs
2. **Use message buffering**: The built-in buffering (250ms) optimizes API calls
3. **Clean up resources**: Always dispose of communication channels after use
4. **Monitor agent lifecycle**: The service automatically manages agent lifecycle per chat

### Message Handling

1. **Use Markdown carefully**: Messages support Markdown with automatic fallback to plain text
2. **Handle long responses**: The service automatically chunks messages over 4090 characters
3. **Test reply functionality**: Verify reply-based communication works as expected
4. **Monitor rate limits**: The service includes built-in rate limiting to avoid Telegram API limits

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

## Utility Functions

### parseCommand

**Location**: `parseCommand.ts`

Parses incoming messages and maps commands to agent commands.

```typescript
type ParsedCommand =
  | { type: 'mapped'; message: string }
  | { type: 'stop' }
  | { type: 'unknown'; command: string }
  | { type: 'chat'; message: string };

export function parseCommand(
  text: string | undefined,
  commandMapping: Record<string, string>,
  from?: { first_name?: string; username?: string }
): ParsedCommand
```

**Parameters**:

- `text`: The message text to parse
- `commandMapping`: Map of bot commands to agent commands
- `from`: Optional sender information for chat message formatting

**Returns**: ParsedCommand object with type and message

### fetchTelegramFile

**Location**: `fetchTelegramFile.ts`

Downloads a file from Telegram and returns it as a Buffer.

```typescript
export async function fetchTelegramFile(
  bot: TelegramBotAPI,
  botToken: string,
  fileId: string
): Promise<Buffer>
```

**Parameters**:

- `bot`: TelegramBotAPI instance
- `botToken`: Bot token for API authentication
- `fileId`: Telegram file ID to download

**Returns**: Buffer containing the file data

### splitIntoChunks

**Location**: `splitIntoChunks.ts`

Splits text into chunks suitable for Telegram messages (max 4090 characters).

```typescript
export function splitIntoChunks(text: string | null): string[]
```

**Parameters**:

- `text`: Text to split into chunks

**Returns**: Array of message chunks

**Features**:

- Splits on headers (`\n#`) and paragraph breaks (`\n\n`)
- Force-splits oversized sections at line breaks
- Falls back to character-based splitting if needed
- Returns "working..." message for null input

### ThrottledBatchProcessor

**Location**: `throttledBatchProcessor.ts`

Batch processor with throttling for efficient message sending.

```typescript
export class ThrottledBatchProcessor<T> {
  constructor(
    processItems: (items: T[]) => Promise<void>,
    intervalMs: number = 250
  )

  add(item: T): void
  flush(): Promise<void>
  dispose(): void
  get hasPending(): boolean
}
```

**Parameters**:

- `processItems`: Function to process batch of items
- `intervalMs`: Minimum interval between batches (default 250ms)

**Methods**:

- `add(item)`: Add item to pending batch
- `flush()`: Process all pending items immediately
- `dispose()`: Clear pending items and cancel timer
- `hasPending`: Check if there are pending items

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

### Test Configuration

The package uses Vitest with the following configuration (`vitest.config.ts`):

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

### Development Setup

1. Install dependencies: `bun install`
2. Run type check: `bun run build`
3. Run tests: `bun test`

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
- `marked` (^17.0.5) - Markdown parsing
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `@types/node-telegram-bot-api` (^0.64.14) - TypeScript definitions
- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

## Related Components

- **@tokenring-ai/agent**: Core agent system used by Telegram bots
- **@tokenring-ai/escalation**: Escalation service integrated with Telegram provider
- **@tokenring-ai/app**: Base application framework
- **@tokenring-ai/chat**: Chat service for agent interactions

## License

MIT License - see `LICENSE` file for details.
