# @tokenring-ai/discord

The `@tokenring-ai/discord` package provides comprehensive Discord integration for the Token Ring ecosystem. It enables agents to interact with users through Discord's messaging system, supporting a multi-bot architecture with channel-based routing, direct message support, and built-in escalation provider integration.

The discord package integrates seamlessly with the Token Ring agent framework, providing both service-based bot management and escalation provider capabilities for admin communications. It leverages discord.js for Discord API interactions and implements intelligent message buffering, attachment handling, and persistent agent context per channel.

## Key Features

- **Multi-bot architecture**: Run multiple Discord bots with independent configurations simultaneously
- **Channel-based routing**: Configure specific agents for different Discord channels
- **Direct message support**: Enable DM interactions with configurable user authorization
- **Per-channel agent isolation**: Each channel maintains persistent agent context
- **Buffered streaming responses**: Intelligent message chunking with 250ms rate limiting
- **Message editing**: Update existing messages instead of creating new ones
- **Attachment handling**: Process file attachments with configurable size limits (default 20MB)
- **Escalation integration**: Built-in `DiscordEscalationProvider` for admin communications
- **Reply-tracked communication**: Track user replies to bot messages for escalation workflows
- **Graceful shutdown**: Clean agent cleanup and bot disconnection
- **Authorization controls**: Per-channel and per-user access restrictions
- **Join announcements**: Optional welcome messages when bots join channels

## Core Components

### DiscordService

The main service that manages multiple Discord bot instances.

**Class**: `DiscordService implements TokenRingService`

**Properties**:
- `name: string` - Service name ("DiscordService")
- `description: string` - Service description ("Manages multiple Discord bots for interacting with TokenRing agents.")

**Methods**:
- `getAvailableBots(): string[]` - Returns array of registered bot names
- `getBot(botName: string): DiscordBot | undefined` - Returns a specific bot instance
- `run(signal: AbortSignal): Promise<void>` - Starts all configured bots and handles shutdown

**Constructor**:
```typescript
constructor(app: TokenRingApp, options: ParsedDiscordServiceConfig)
```

**Internal Implementation**:
- Uses `KeyedRegistry` to manage multiple `DiscordBot` instances
- Starts all configured bots on initialization
- Handles graceful shutdown by stopping all bots and cleaning up resources

### DiscordBot

Handles individual bot operations including message processing, agent management, and communication.

**Class**: `DiscordBot`

**Methods**:
- `start(): Promise<void>` - Initializes and starts the Discord bot
- `stop(): Promise<void>` - Stops the bot and cleans up resources
- `getBotUserId(): string | undefined` - Returns the Discord user ID of the bot
- `createCommunicationChannelWithChannel(channelName: string): CommunicationChannel` - Creates a communication channel for escalation
- `createCommunicationChannelWithUser(userId: string): CommunicationChannel` - Creates a DM communication channel

**Internal Methods**:
- `handleMessage(message: Message): Promise<void>` - Processes incoming Discord messages
- `handleDirectMessage(message: Message, userId: string, channelId: string, text: string): Promise<void>` - Handles DM messages
- `extractAllAttachments(message: Message): Promise<InputAttachment[]>` - Downloads and processes file attachments
- `ensureAgentForChannel(channelId: string, agentType: string): Promise<Agent>` - Ensures an agent exists for a channel
- `flushBuffer(channelId: string): Promise<void>` - Sends buffered messages to Discord
- `sendMessage(channelId: string, text: string): Promise<string>` - Sends a message to a channel
- `updateMessageWithFallback(channelId: string, messageId: string, text: string): Promise<string>` - Updates a message with fallback to new message
- `agentEventLoop(channelId: string, agent: Agent, signal: AbortSignal): Promise<void>` - Processes agent events for a channel

**Key Features**:
- **Message buffering**: Accumulates agent output and sends in chunks
- **Rate limiting**: 250ms delay between messages to respect Discord limits
- **Message editing**: Attempts to update existing messages before creating new ones
- **Reply tracking**: Tracks user replies to enable escalation workflows
- **Attachment processing**: Downloads and converts attachments to base64 for agent processing

### DiscordEscalationProvider

Integration with the escalation system for admin communications via Discord.

**Class**: `DiscordEscalationProvider implements EscalationProvider`

**Constructor**:
```typescript
constructor(config: ParsedDiscordEscalationProviderConfig)
```

**Methods**:
- `createCommunicationChannelWithUser(channelName: string, agent: Agent): Promise<CommunicationChannel>` - Creates a communication channel for escalation

**Implementation**:
- Retrieves the configured bot from `DiscordService`
- Creates a communication channel for the specified channel configuration
- Enables escalation workflows through Discord

### splitIntoChunks

Utility function for splitting long messages into Discord-compatible chunks.

**Function**: `splitIntoChunks(text: string | null): string[]`

**Parameters**:
- `text: string | null` - The text to split

**Returns**: Array of message chunks (max 1990 characters each)

**Behavior**:
- Splits text at markdown headers (`#`) when possible for better formatting
- Falls back to character-based splitting at 1990 character limit
- Returns working messages for null input (e.g., "Working...", "Processing...")

### Types

#### MessageCapableChannel

Type definition for Discord text channels that support message operations.

```typescript
type MessageCapableChannel = TextBasedChannel & {
  send: (content: string) => Promise<Message>;
  messages: {
    fetch: (id: string) => Promise<Message>;
  };
};
```

#### ChatResponse

Type for tracking chat response state per channel.

```typescript
type ChatResponse = {
  text: string | null;
  messageIds: (string | undefined)[];
  sentTexts: string[];
  isComplete?: boolean;
};
```

#### UserChannel

Type for tracking user communication channels for escalation.

```typescript
type UserChannel = {
  destinationId: string;
  trackedMessageIds: Set<string>;
  queue: string[];
  resolve?: (value: IteratorResult<string>) => void;
  closed: boolean;
};
```

## Services

### DiscordService

The primary service that manages Discord bot operations.

**Service Type**: `TokenRingService`

**Registration**: Automatically registered when the plugin is installed with Discord configuration.

**Lifecycle**:
1. **Initialization**: Creates `DiscordBot` instances for each configured bot
2. **Startup**: Logs in all bots and begins message processing
3. **Runtime**: Handles messages, manages agents, processes events
4. **Shutdown**: Flushes buffers, cleans up agents, disconnects bots

**State Management**:
- Maintains `KeyedRegistry` of bot instances
- Each bot manages its own channel agents, chat responses, and user channels

## Provider Documentation

### DiscordEscalationProvider

The package provides a built-in escalation provider for Discord-based admin communications.

**Provider Interface**: `EscalationProvider`

**Configuration Schema**:
```typescript
export const DiscordEscalationProviderConfigSchema = z.object({
  type: z.literal('discord'),
  bot: z.string(),
  channel: z.string(),
});
```

**Provider Registration**:
- Registered automatically when escalation configuration includes providers with `type: "discord"`
- Can also be registered programmatically with `EscalationService.registerProvider()`

**Usage**:
- Creates communication channels for escalation workflows
- Routes escalation messages to specified Discord channels
- Supports both guild channels and direct messages

## RPC Endpoints

This package does not expose RPC endpoints. Communication is handled through Discord's native messaging system and the escalation service's communication channel interface.

## Chat Commands

The Discord plugin does not define traditional slash commands. Instead, it processes messages through Discord's native messaging:

### Message Processing

**Guild Channel Messages**:
- Bot must be mentioned to trigger processing (e.g., `@BotName what is the weather?`)
- Mention is stripped from the message content
- Message is sent to the channel's agent

**Direct Messages**:
- Any message to the bot is processed (if DMs are enabled)
- No mention required

**Reply Messages**:
- Replies to bot messages are tracked for escalation workflows
- Reply content is sent back to the agent as user input

### Authorization

**Channel Authorization**:
- `allowedUsers: string[]` - Empty array allows all users
- Non-empty array restricts to specified user IDs
- Unauthorized users receive "Sorry, you are not authorized."

**DM Authorization**:
- `dmAllowedUsers: string[]` - Empty array allows all users (if `dmAgentType` is set)
- Non-empty array restricts to specified user IDs
- Unauthorized users receive "Sorry, you are not authorized to DM this bot."

## Configuration

### Configuration Schemas

#### DiscordBotConfigSchema

Configuration for a single Discord bot instance.

```typescript
export const DiscordBotConfigSchema = z.object({
  name: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  joinMessage: z.string().optional(),
  maxFileSize: z.number().default(20_971_520),
  channels: z.record(z.string(), z.object({
    channelId: z.string(),
    allowedUsers: z.array(z.string()).default([]),
    agentType: z.string(),
  })),
  dmAgentType: z.string().optional(),
  dmAllowedUsers: z.array(z.string()).default([]),
});
```

**Properties**:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Display name for the bot |
| `botToken` | string | Yes | - | Discord bot token |
| `joinMessage` | string | No | - | Message sent when bot joins a channel |
| `maxFileSize` | number | No | 20971520 (20MB) | Maximum attachment size in bytes |
| `channels` | Record | Yes | - | Channel configurations |
| `dmAgentType` | string | No | - | Agent type for DM interactions |
| `dmAllowedUsers` | string[] | No | [] | Authorized user IDs for DMs |

#### Channel Configuration

Each channel in the `channels` record:

```typescript
{
  channelId: string,
  allowedUsers: string[],
  agentType: string
}
```

**Properties**:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `channelId` | string | Yes | - | Discord channel ID |
| `allowedUsers` | string[] | No | [] | Authorized user IDs (empty = all users) |
| `agentType` | string | Yes | - | Type of agent to use for this channel |

#### DiscordServiceConfigSchema

Configuration for the Discord service.

```typescript
export const DiscordServiceConfigSchema = z.object({
  bots: z.record(z.string(), DiscordBotConfigSchema)
});
```

**Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `bots` | `Record<string, DiscordBotConfig>` | Yes | Map of bot names to configurations |

#### DiscordEscalationProviderConfigSchema

Configuration for the Discord escalation provider.

```typescript
export const DiscordEscalationProviderConfigSchema = z.object({
  type: z.literal('discord'),
  bot: z.string(),
  channel: z.string(),
});
```

**Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | "discord" | Yes | Provider type identifier |
| `bot` | string | Yes | Name of the bot to use |
| `channel` | string | Yes | Name of the channel configuration |

### Full Configuration Example

```typescript
const config = {
  discord: {
    bots: {
      primary: {
        name: "Primary Bot",
        botToken: process.env.DISCORD_BOT_TOKEN!,
        joinMessage: "🤖 TokenRing bot is online!",
        maxFileSize: 20_971_520,
        channels: {
          engineering: {
            channelId: "123456789012345678",
            allowedUsers: [],
            agentType: "teamLeader"
          },
          support: {
            channelId: "987654321098765432",
            allowedUsers: ["111111111111111111", "222222222222222222"],
            agentType: "supportAgent"
          }
        },
        dmAgentType: "personalAgent",
        dmAllowedUsers: ["111111111111111111"]
      }
    }
  },
  escalation: {
    providers: {
      discordAdmins: {
        type: "discord",
        bot: "primary",
        channel: "engineering"
      }
    }
  }
};
```

## Integration

### Plugin Registration

The package provides a TokenRing plugin that automatically registers services:

```typescript
import discordPlugin from "@tokenring-ai/discord/plugin";

const app = new TokenRingApp();
await app.installPlugin(discordPlugin, {
  discord: {
    bots: {
      primary: {
        name: "Primary Bot",
        botToken: process.env.DISCORD_BOT_TOKEN!,
        channels: {
          general: {
            channelId: "123456789012345678",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});
```

### Service Registration

The plugin automatically registers:
- **DiscordService**: Manages bot instances
- **DiscordEscalationProvider**: Registered with EscalationService for providers with `type: "discord"`

### Programmatic Registration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import DiscordService from "@tokenring-ai/discord/DiscordService";
import { DiscordEscalationProvider } from "@tokenring-ai/discord";
import { EscalationService } from "@tokenring-ai/escalation";

const app = new TokenRingApp();

// Register Discord service directly
const discordService = new DiscordService(app, {
  bots: {
    primary: {
      name: "Primary Bot",
      botToken: process.env.DISCORD_BOT_TOKEN!,
      channels: {
        general: {
          channelId: "123456789012345678",
          allowedUsers: [],
          agentType: "teamLeader"
        }
      }
    }
  }
});

app.addServices(discordService);

// Register escalation provider
app.waitForService(EscalationService, (escalationService) => {
  escalationService.registerProvider(
    "discordAdmins",
    new DiscordEscalationProvider({
      type: "discord",
      bot: "primary",
      channel: "general"
    })
  );
});
```

### Agent Integration

Each Discord channel maintains its own agent instance:
- Agents are spawned on first message to a channel
- Agent context persists for the channel's lifetime
- Background event loops process agent outputs
- Agents are cleaned up on bot shutdown

### Event Handling

The package handles Discord events:
- `messageCreate`: Processes incoming messages
- Bot mentions trigger agent interactions in guild channels
- Direct messages are handled separately
- Reply tracking enables escalation workflows

### Gateway Intents

The Discord client uses the following Gateway Intents:
- `GatewayIntentBits.Guilds`: Server/guild operations
- `GatewayIntentBits.GuildMessages`: Guild message events
- `GatewayIntentBits.MessageContent`: Message content access
- `GatewayIntentBits.DirectMessages`: Direct message events

### State Management Integration

- Each channel maintains a `ChatResponse` buffer
- Messages are tracked by Discord message ID
- User channels track reply messages for escalation
- State is cleaned up on bot shutdown

## Usage Examples

### Basic Configuration

```typescript
import { z } from "zod";
import TokenRingApp from "@tokenring-ai/app";
import discordPlugin from "@tokenring-ai/discord/plugin";

const config = {
  discord: {
    bots: {
      primary: {
        name: "Primary Bot",
        botToken: process.env.DISCORD_BOT_TOKEN!,
        joinMessage: "Discord bot is online and ready!",
        maxFileSize: 20_971_520,
        channels: {
          engineering: {
            channelId: "123456789012345678",
            allowedUsers: [],
            agentType: "teamLeader"
          },
          support: {
            channelId: "987654321098765432",
            allowedUsers: ["111111111111111111", "222222222222222222"],
            agentType: "supportAgent"
          }
        },
        dmAgentType: "personalAgent",
        dmAllowedUsers: ["111111111111111111"]
      }
    }
  }
};

const app = new TokenRingApp();
await app.installPlugin(discordPlugin, config);
```

### Direct Message Setup

```typescript
const config = {
  discord: {
    bots: {
      main: {
        name: "Main Bot",
        botToken: process.env.DISCORD_BOT_TOKEN!,
        channels: {
          general: {
            channelId: "123456789012345678",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        },
        dmAgentType: "personalAgent",
        dmAllowedUsers: [
          "111111111111111111",
          "222222222222222222"
        ]
      }
    }
  }
};
```

### Escalation Integration

```typescript
const config = {
  discord: {
    bots: {
      adminBot: {
        name: "Admin Bot",
        botToken: process.env.DISCORD_BOT_TOKEN!,
        channels: {
          adminChannel: {
            channelId: "123456789012345678",
            allowedUsers: ["111111111111111111"],
            agentType: "adminAgent"
          }
        }
      }
    }
  },
  escalation: {
    providers: {
      discordAdmins: {
        type: "discord",
        bot: "adminBot",
        channel: "adminChannel"
      }
    }
  }
};
```

### Multiple Bots

```typescript
const config = {
  discord: {
    bots: {
      primary: {
        name: "Primary Bot",
        botToken: process.env.DISCORD_BOT_TOKEN_1!,
        channels: {
          engineering: {
            channelId: "123456789012345678",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      },
      secondary: {
        name: "Secondary Bot",
        botToken: process.env.DISCORD_BOT_TOKEN_2!,
        channels: {
          support: {
            channelId: "987654321098765432",
            allowedUsers: [],
            agentType: "supportAgent"
          }
        }
      }
    }
  }
};
```

## Best Practices

### Bot Token Security

- Store tokens in environment variables
- Never commit tokens to version control
- Use different tokens for development and production

### Channel Authorization

- Use `allowedUsers` to restrict channel access
- Empty `allowedUsers` array allows all users
- Combine with Discord role-based permissions

### Message Rate Limiting

- The package implements 250ms rate limiting automatically
- Large responses are automatically chunked
- Message edits are preferred over new messages

### Attachment Handling

- Set appropriate `maxFileSize` limits
- Monitor attachment processing errors
- Consider bandwidth implications for large files

### Agent Configuration

- Use distinct `agentType` values per channel
- Configure appropriate agent capabilities per use case
- Monitor agent resource usage for high-traffic channels

### Escalation Setup

- Configure dedicated channels for escalation
- Use specific bot instances for admin communications
- Test escalation workflows before production use

### Multi-bot Architecture

- Use separate bots for different purposes (e.g., primary, admin, support)
- Configure appropriate channels for each bot
- Monitor resource usage across multiple bots

## Testing and Development

### Running Tests

```bash
cd pkg/discord
bun test
```

### Test Configuration

Tests use `vitest` for unit testing:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true
  }
});
```

### Example Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Discord Package', () => {
  it('should export required components', () => {
    expect(DiscordService).toBeDefined();
    expect(DiscordEscalationProvider).toBeDefined();
    expect(DiscordBotConfigSchema).toBeDefined();
  });
});
```

### Build

```bash
bun run build
```

### Test Watch Mode

```bash
bun run test:watch
```

### Test Coverage

```bash
bun run test:coverage
```

### Test File

The package includes a test file at `test/configuration.test.ts` for testing configuration validation and schema parsing.

## Dependencies

### Runtime Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/chat` | 0.2.0 | Chat service for agent interactions |
| `@tokenring-ai/agent` | 0.2.0 | Agent management and event handling |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities and helpers |
| `@tokenring-ai/escalation` | 0.2.0 | Escalation service and provider interface |
| `discord.js` | ^14.25.1 | Discord API client library |
| `axios` | ^1.13.6 | HTTP client for attachment downloads |
| `zod` | ^4.3.6 | Schema validation |

### Dev Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.1.0 | Testing framework |
| `typescript` | ^5.9.3 | TypeScript compiler |

## Related Components

- `@tokenring-ai/escalation`: Escalation service and provider interface
- `@tokenring-ai/agent`: Agent management and event handling
- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/chat`: Chat service for agent interactions
- `@tokenring-ai/utility`: Shared utilities and helpers
- `discord.js`: Discord API client library

## License

MIT License - see LICENSE file for details.
