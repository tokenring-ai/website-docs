# @tokenring-ai/slack

The `@tokenring-ai/slack` package provides comprehensive Slack integration for TokenRing agents, enabling natural language conversations through Slack channels, @mentions, thread-based responses, direct messages, and file attachments. The plugin supports managing multiple Slack bots simultaneously, with each channel getting a dedicated agent instance that maintains conversation history and context.

## Overview

This package provides a Slack bot service that integrates with TokenRing agents, enabling natural language conversations through Slack. Each Slack channel gets its own dedicated agent instance that maintains conversation history and context. The service handles message routing, event processing, and automatic agent management. It also supports escalation workflows for agent-to-human communication.

The package uses the `@slack/bolt` framework for event handling and supports Socket Mode for firewall-friendly connections.

Key capabilities include:
- Multi-bot management with independent configurations
- Per-channel agent instances with persistent chat history
- Thread-based synchronous communication for escalation workflows
- Direct messaging support with user authorization
- File attachment processing (up to 20MB by default)
- Automatic escalation provider registration when used with the escalation plugin
- Message buffering and throttling to handle long responses
- Socket Mode support for firewall-friendly connections
- User authorization controls per channel and for DMs

## Key Features

- **Multiple Bot Support**: Manage multiple discrete Slack bots in a single service, each with independent configurations
- **Per-Channel Agents**: Each Slack channel gets a dedicated agent with persistent chat history and isolated context
- **Thread-Based Messaging**: Send messages and await synchronous responses via Slack thread mechanism for escalation workflows
- **Direct Messaging**: Support for direct messages with authorized users, configurable via `dmAgentType` and `dmAllowedUsers`
- **File Attachments**: Download and process Slack file attachments (up to 20MB by default), supports various file types
- **Escalation Provider**: Implements `EscalationProvider` interface for agent-to-human escalation workflows with automatic registration
- **Message Buffering**: Automatic message chunking for long responses (3900 char limit) with throttling (250ms delay)
- **Authorization Control**: User whitelist for access management per channel and for direct messages
- **Socket Mode Support**: Optional Socket Mode for firewall-friendly connections without public endpoints
- **Join Messages**: Optional welcome message when bot joins configured channels
- **Event-Driven Communication**: Handles agent events (output.chat, output.info, output.warning, output.error, input.handled) and sends responses back to Slack
- **Graceful Shutdown**: Proper cleanup of all channel agents on shutdown with message flushing
- **Plugin Integration**: Seamless integration with TokenRing plugin system with automatic escalation provider registration when both slack and escalation plugins are installed
- **Error Handling**: Robust error handling with user-friendly error messages and service logging via `serviceOutput` and `serviceError`
- **Timeout Management**: Configurable agent timeout handling via `maxRunTime`

## Core Components

### SlackService

Main service class implementing `TokenRingService` for managing multiple Slack bots.

**Properties:**
- `name`: `"SlackService"` - Service name identifier
- `description`: `"Manages multiple Slack bots for interacting with TokenRing agents."` - Service description

**Constructor:**
```typescript
constructor(app: TokenRingApp, options: ParsedSlackServiceConfig)
```

**Methods:**
- **`run(signal: AbortSignal): Promise<void>`**: Starts all configured Slack bots and begins listening for messages. Handles graceful shutdown when the signal is aborted.
- **`getBot(botName: string): SlackBot | undefined`**: Gets a bot instance by name
- **`getAvailableBots(): string[]`**: Returns list of configured bot names

**Key Features:**
- Manages multiple Slack bots simultaneously using `KeyedRegistry`
- Creates per-channel agent instances automatically
- Maintains conversation history per channel
- Routes messages to appropriate agents based on channel configuration
- Handles graceful shutdown with message flushing and agent cleanup

### SlackBot

Individual bot instance managing a single Slack bot connection using `@slack/bolt`.

**Constructor:**
```typescript
constructor(
  tokenRingApp: TokenRingApp,
  slackService: SlackService,
  botName: string,
  config: ParsedSlackBotConfig
)
```

**Methods:**
- **`start(): Promise<void>`**: Starts the Slack bot, registers event handlers, and announces to configured channels
- **`stop(): Promise<void>`**: Stops the Slack bot, flushes pending messages, and deletes all channel agents
- **`createCommunicationChannelWithChannel(channelName: string): CommunicationChannel`**: Creates a communication channel for a configured channel
- **`createCommunicationChannelWithUser(userId: string): CommunicationChannel`**: Creates a communication channel for a specific user/channel ID
- **`getBotUserId(): string | undefined`**: Returns the bot's user ID

**Key Features:**
- Uses `@slack/bolt` App for event handling
- Handles message events and @mention events
- Implements message buffering with 3900 character limit and 250ms throttle delay
- Manages per-channel agent lifecycle (create, reuse, delete)
- Tracks message IDs for thread-based reply handling
- Processes agent events and formats responses appropriately
- Supports direct messages with authorized users
- Downloads and processes file attachments

### SlackEscalationProvider

Escalation provider implementation for agent-to-human communication via Slack.

**Constructor:**
```typescript
constructor(config: ParsedSlackEscalationProviderConfig)
```

**Methods:**
- **`createCommunicationChannelWithUser(channelName: string, agent: Agent): Promise<CommunicationChannel>`**: Creates a communication channel for escalation workflows

**Key Features:**
- Integrates with `EscalationService` for agent-to-human communication
- Uses configured bot and channel for communication
- Supports thread-based synchronous responses

### splitIntoChunks Function

Splits text into chunks suitable for Slack messages, respecting Slack's 3900 character limit per message.

```typescript
function splitIntoChunks(text: string | null): string[]
```

- **Parameters**:
  - `text`: The text to split, or null for a "working" message
- **Returns**: Array of message chunks (max 3900 characters each)

**Chunking Strategy:**
- **Null Text**: Returns a randomized "working" message (e.g., "***Working... ⏳***")
- **Section-Based Splitting**: Attempts to split on header lines (lines starting with `#`) for more natural chunk boundaries
- **Hard Limit Enforcement**: Any chunk exceeding 3900 characters is force-split at the limit
- **Preserves Structure**: Tries to keep related content together when possible

**Key Features:**
- Splits long messages into 3900 character chunks
- Handles null text by returning a randomized "working" message
- Uses section-based splitting for more natural chunk boundaries
- Force-splits oversized chunks to respect Slack's limits
- Used by SlackBot for message buffering

## Services

### SlackService

The main service that manages multiple Slack bots and integrates with the TokenRing application.

**Service Registration:**
When using the plugin, the `SlackService` is automatically registered:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import slackPlugin from '@tokenring-ai/slack';

const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: ["U06T1LWJG"],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(slackPlugin);
await app.start();
```

**Service Lifecycle:**
- **Start**: All configured bots are started, event handlers are registered, and announcement messages are sent to configured channels
- **Run**: Bots listen for messages and route them to appropriate channel agents
- **Stop**: All bots are stopped gracefully, pending messages are flushed, and all channel agents are deleted

## Provider Documentation

### SlackEscalationProvider

The Slack package provides an `EscalationProvider` implementation for agent-to-human communication workflows.

**Provider Interface:**
Implements the `EscalationProvider` interface with the following capabilities:
- Creates communication channels with specific channels
- Supports thread-based synchronous messaging
- Integrates with the escalation service for workflow management

**Provider Registration:**
When both `slackPlugin` and `escalationPlugin` are installed with escalation configuration, the plugin automatically registers `SlackEscalationProvider` instances:

```typescript
const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  },
  escalation: {
    providers: {
      slack: {
        type: 'slack',
        bot: 'mainBot',
        channel: 'engineering'
      }
    },
    groups: {
      "admins": ["engineering@slack"]
    }
  }
});

app.install(slackPlugin);  // Registers bots and automatically registers escalation provider
app.install(escalationPlugin);  // Enables escalation service
```

**Manual Registration:**
For more control, you can manually register the escalation provider:

```typescript
import {SlackEscalationProvider} from '@tokenring-ai/slack';
import {SlackEscalationProviderConfigSchema} from '@tokenring-ai/slack/schema';
import {EscalationService} from '@tokenring-ai/escalation';

const escalationService = agent.requireServiceByType(EscalationService);
escalationService.registerProvider('slackProvider', new SlackEscalationProvider(
  SlackEscalationProviderConfigSchema.parse({
    type: 'slack',
    bot: 'mainBot',
    channel: 'engineering'
  })
));
```

## RPC Endpoints

This package does not define RPC endpoints. Communication is handled through Slack's API via `@slack/bolt` and `@slack/web-api`.

## Chat Commands

This package does not define chat commands. Communication is handled through Slack messages and @mentions.

## Configuration

### Configuration Schemas

The package uses Zod schema validation for configuration with a nested structure for multiple bots.

**Bot Configuration Schema:**
```typescript
import {z} from "zod";

export const SlackBotConfigSchema = z.object({
  name: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  appToken: z.string().optional(),
  signingSecret: z.string().min(1, "Signing secret is required"),
  joinMessage: z.string().optional(),
  maxFileSize: z.number().default(20_971_520), // 20MB default
  channels: z.record(z.string(), z.object({
    channelId: z.string(),
    allowedUsers: z.array(z.string()).default([]),
    agentType: z.string(),
  })),
  dmAgentType: z.string().optional(),
  dmAllowedUsers: z.array(z.string()).default([]),
});

export type ParsedSlackBotConfig = z.output<typeof SlackBotConfigSchema>;
```

**Service Configuration Schema:**
```typescript
export const SlackServiceConfigSchema = z.object({
  bots: z.record(z.string(), SlackBotConfigSchema)
});

export type ParsedSlackServiceConfig = z.output<typeof SlackServiceConfigSchema>;
```

**Escalation Provider Configuration Schema:**
```typescript
export const SlackEscalationProviderConfigSchema = z.object({
  type: z.literal('slack'),
  bot: z.string(),
  channel: z.string(),
});

export type ParsedSlackEscalationProviderConfig = z.output<typeof SlackEscalationProviderConfigSchema>;
```

### Configuration Options

**Bot Configuration:**
- `name` (string): Bot display name (required)
- `botToken` (string): Slack Bot User OAuth Token starting with `xoxb-` (required)
- `signingSecret` (string): Slack Signing Secret (required)
- `appToken` (string): Slack App-Level Token for Socket Mode starting with `xapp-` (optional)
- `joinMessage` (string): Message to post when bot joins channels (optional)
- `maxFileSize` (number): Maximum file size for attachments in bytes (optional, default: 20MB)
- `channels` (object): Record of channel configurations (required)
- `dmAgentType` (string): Agent type for direct messages (optional, enables DMs if set)
- `dmAllowedUsers` (string[]): Array of user IDs allowed to DM the bot (optional)

**Channel Configuration:**
- `channelId` (string): Slack channel ID (required)
- `allowedUsers` (string[]): Array of authorized user IDs (optional, empty array = all users)
- `agentType` (string): Agent type to create for the channel (required)

**Note**: The `channels` record can be empty. This is useful when the bot is only used for direct messages or when channels are added dynamically.

### Multiple Bots Configuration

The Slack plugin supports managing multiple bots simultaneously:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import slackPlugin from "@tokenring-ai/slack";
import escalationPlugin from "@tokenring-ai/escalation";

const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        appToken: process.env.SLACK_APP_TOKEN, // Optional for Socket Mode
        joinMessage: "Hello! I'm the AI assistant bot.", // Optional welcome message
        maxFileSize: 20_971_520, // 20MB default
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: ["U06T1LWJG", "UABCDEF123"],
            agentType: "teamLeader"
          },
          "support": {
            channelId: "C9876543210",
            allowedUsers: [],
            agentType: "supportAgent"
          }
        },
        dmAgentType: "dmAgent", // Optional: Enable DMs with this agent type
        dmAllowedUsers: ["U06T1LWJG"] // Optional: Restrict DMs to specific users
      },
      "secondaryBot": {
        name: "Secondary Bot",
        botToken: process.env.SLACK_SECONDARY_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SECONDARY_SIGNING_SECRET!,
        channels: {
          "general": {
            channelId: "C1112223333",
            allowedUsers: [],
            agentType: "generalAgent"
          }
        }
      }
    }
  },
  escalation: {
    providers: {
      slack: {
        type: 'slack',
        bot: 'mainBot',
        channel: 'engineering'
      }
    },
    groups: {
      "admins": ["engineering@slack"]
    }
  }
});

app.install(slackPlugin);
app.install(escalationPlugin);
await app.start();
```

## Integration

### Plugin Installation

Install the plugin with your TokenRing application:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import slackPlugin from '@tokenring-ai/slack';
import escalationPlugin from '@tokenring-ai/escalation';

const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: ["U06T1LWJG"],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(slackPlugin);
await app.start();
```

**Note**: When both `slackPlugin` and `escalationPlugin` are installed and escalation configuration is present, the plugin automatically registers `SlackEscalationProvider` instances for each provider with `type: 'slack'`.

### Manual Service Creation

Create the Slack service manually if you prefer more control:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import SlackService from '@tokenring-ai/slack/SlackService';
import {SlackServiceConfigSchema} from '@tokenring-ai/slack/schema';

const app = new TokenRingApp({});

const config = {
  bots: {
    "mainBot": {
      name: "Main Bot",
      botToken: process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      channels: {
        "engineering": {
          channelId: "C1234567890",
          allowedUsers: ["U06T1LWJG"],
          agentType: "teamLeader"
        }
      }
    }
  }
};

const validatedConfig = SlackServiceConfigSchema.parse(config);
const slackService = new SlackService(app, validatedConfig);
app.addServices(slackService);

await slackService.run(signal);
```

### Agent System Integration

The Slack service integrates with the agent system as follows:

1. **Agent Creation**: When a message is received in a channel, an agent is created if one doesn't exist
2. **Agent Reuse**: Existing agents are reused for subsequent messages in the same channel
3. **Event Subscription**: The bot subscribes to agent state changes and processes events
4. **Agent Deletion**: When the bot stops, all channel agents are deleted via `AgentManager.deleteAgent`

**Event Handling:**
The service handles the following agent events:
- **`output.chat`**: Processes chat content and sends accumulated responses to Slack via message buffering
- **`output.info`**: Formats system messages with level indicators `[INFO]`
- **`output.warning`**: Formats system messages with level indicators `[WARNING]`
- **`output.error`**: Formats system messages with level indicators `[ERROR]`
- **`input.handled`**: Handles input completion, cleans up subscriptions, manages timeouts, and flushes pending messages

**Slack Bot Event Handlers:**
The Slack bot registers the following event handlers:
- **`message()`**: Handles all message events, including direct messages and channel messages
- **`event('app_mention')`**: Handles @mention events in channels

Both handlers:
- Filter out bot messages
- Validate user authorization
- Route messages to the appropriate channel agent
- Handle thread replies for synchronous communication

## Usage Examples

### Basic Plugin Usage

```typescript
import TokenRingApp from '@tokenring-ai/app';
import slackPlugin from '@tokenring-ai/slack';

const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(slackPlugin);
await app.start();
```

### Communication Channel API

Create a communication channel for synchronous messaging:

```typescript
import SlackService from '@tokenring-ai/slack';

const slackService = agent.requireServiceByType(SlackService);

// Get a bot instance
const bot = slackService.getBot('mainBot');

// Create a communication channel with a channel
const channel = bot.createCommunicationChannelWithChannel('engineering');

// Send a message
await channel.send('Please approve this deployment');

// Listen for a response
for await (const message of channel.receive()) {
  console.log('User responded:', message);
  break;
}

// Close the channel when done
await channel[Symbol.asyncDispose]();
```

### Escalation Provider Usage

Use the escalation provider to create communication channels with users or groups:

```typescript
import {SlackEscalationProvider} from '@tokenring-ai/slack';
import {SlackEscalationProviderConfigSchema} from '@tokenring-ai/slack/schema';
import {EscalationService} from '@tokenring-ai/escalation';

// Programmatic registration
const escalationService = agent.requireServiceByType(EscalationService);
escalationService.registerProvider('slackProvider', new SlackEscalationProvider(
  SlackEscalationProviderConfigSchema.parse({
    type: 'slack',
    bot: 'mainBot',
    channel: 'engineering'
  })
));

// Use the escalation channel
const channel = await escalationService.initiateContactWithUserOrGroup(
  'engineering@slack',
  'Approve production deployment?',
  agent
);

for await (const message of channel.receive()) {
  if (message.toLowerCase().includes('yes')) {
    console.log('Deployment approved');
  }
  await channel.close();
  break;
}
```

### Socket Mode Configuration

Enable Socket Mode for firewall-friendly connections:

```typescript
const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        appToken: process.env.SLACK_APP_TOKEN!, // Required for Socket Mode
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(slackPlugin);
await app.start();
```

### Direct Messaging Configuration

Enable direct messaging with authorized users:

```typescript
const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        dmAgentType: "dmAgent", // Enable DMs with this agent type
        dmAllowedUsers: ["U06T1LWJG", "UABCDEF123"], // Restrict to specific users
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(slackPlugin);
await app.start();
```

### File Attachment Configuration

Configure file attachment handling with custom max file size:

```typescript
const app = new TokenRingApp({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        maxFileSize: 50_000_000, // 50MB max file size
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: [],
            agentType: "teamLeader"
          }
        }
      }
    }
  }
});

app.install(slackPlugin);
await app.start();
```

## Message Buffering and Throttling

The Slack bot implements message buffering and throttling to handle long responses and respect Slack's API limits:

- **Maximum Message Length**: 3900 characters (Slack's limit)
- **Throttle Delay**: 250ms between message sends
- **Message Chunking**: Long messages are automatically split into chunks using `splitIntoChunks`
- **Message Update**: Subsequent chunks update the original message when possible
- **Buffer Flushing**: All pending messages are flushed before shutdown

### How Message Buffering Works

1. Agent output is accumulated in a buffer per channel
2. When the buffer is ready to send, the bot checks if the message exceeds 3900 characters
3. If it exceeds the limit:
   - First chunk is posted as a new message
   - Message timestamp is stored
   - Remaining text is kept in buffer
   - Buffer is re-queued for processing
4. If it fits within the limit:
   - If no message exists, post a new message
   - If a message exists, attempt to update it
   - If update fails (message not found), post a new message
5. A 250ms throttle delay is enforced between sends

## Best Practices

### Security

- **Bot Token Security**: Never commit bot tokens to version control. Use environment variables.
- **User Authorization**: Use `allowedUsers` to restrict bot access per channel when needed.
- **DM Authorization**: Use `dmAllowedUsers` to restrict direct message access.
- **File Size Limits**: Configure `maxFileSize` appropriately for your use case.
- **Input Validation**: All user input is validated and sanitized by the service.
- **Error Information**: Error messages are user-friendly without exposing internal details.

### Performance

- **Socket Mode**: Use Socket Mode for development to avoid managing public endpoints.
- **Agent Reuse**: Leverage per-channel agent persistence for better conversation context.
- **Message Throttling**: The built-in throttling prevents rate limit issues.

### Reliability

- **Graceful Shutdown**: The service properly cleans up resources on shutdown.
- **Error Handling**: All message processing is wrapped in try-catch to prevent crashes.
- **Timeout Management**: Configure `maxRunTime` on agents to prevent long-running operations.

### Testing

- **Environment Variables**: Use different tokens for development and production.
- **Channel Isolation**: Test with dedicated channels to avoid disrupting production.
- **Authorization Testing**: Verify `allowedUsers` and `dmAllowedUsers` configuration works as expected.

## Testing and Development

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Package Structure

```
pkg/slack/
├── index.ts                    # Main exports
├── plugin.ts                   # TokenRing plugin definition
├── schema.ts                   # Zod configuration schemas
├── SlackService.ts             # Main service class
├── SlackBot.ts                 # Individual bot implementation
├── SlackEscalationProvider.ts  # Escalation provider implementation
├── splitIntoChunks.ts          # Message chunking utility
├── package.json                # Package configuration
├── README.md                   # Package documentation
├── vitest.config.ts           # Test configuration
└── integration.test.ts         # Integration tests
```

## Dependencies

**Production Dependencies:**
- `@tokenring-ai/app` (0.2.0) - TokenRing application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/agent` (0.2.0) - Agent system
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `@tokenring-ai/escalation` (0.2.0) - Escalation service
- `@slack/bolt` (^4.6.0) - Slack Bolt framework
- `@slack/web-api` (^7.15.0) - Slack Web API
- `axios` (^1.13.6) - HTTP client for file downloads
- `zod` (^4.3.6) - Schema validation

**Development Dependencies:**
- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

## Error Handling

### Bot-Level Errors

- **Connection Errors**: Logged via `serviceError` with error details
- **Message Processing**: Wrapped in try-catch to prevent crashes, errors logged via `serviceError`
- **Bot Startup**: Validates configuration before initialization

### User-Level Errors

- **Authorization**: Sends "Sorry, you are not authorized." for unauthorized users
- **DM Authorization**: Sends "DMs are not enabled for this bot." or "Sorry, you are not authorized to DM this bot." for unauthorized DMs
- **Timeout**: Agent timeout is handled via `maxRunTime` configuration, aborts agent execution
- **No Response**: Sends "No response received from agent." when no output is generated

### Service-Level Errors

- **Configuration**: Validates bot tokens and signing secrets via Zod schema on construction
- **Shutdown**: Graceful cleanup with error handling for bot stop operations, all pending messages are flushed
- **Resource Management**: Proper cleanup of all channel agents on service termination via `AgentManager.deleteAgent`
- **File Download Errors**: Failed file downloads are logged but don't block message processing

## Agent Lifecycle Management

The Slack bot automatically manages agent lifecycle:

1. **Agent Creation**: When a message is received in a channel, an agent is created if one doesn't exist
2. **Agent Reuse**: Existing agents are reused for subsequent messages in the same channel
3. **Agent Deletion**: When the bot stops, all channel agents are deleted via `AgentManager.deleteAgent` with reason "Slack bot was shut down."

## Thread-Based Communication

### How Thread Handling Works

1. Service sends message to channel via Slack
2. Message ID is stored with a reply handler
3. User replies to the message using Slack's thread feature
4. Service detects the thread reply and invokes registered listeners with the response text
5. Response is processed by the communication channel

### Message ID Tracking

The bot tracks message IDs to enable thread-based replies:
- Each sent message is assigned an ID in format `{channelId}-{ts}`
- Message IDs are mapped to the bot's user ID
- Thread replies are matched to the original message
- Reply handlers are invoked with the response text

## Direct Messaging

### How DMs Work

1. User sends a direct message to the bot
2. Bot validates that `dmAgentType` is configured
3. Bot validates that the user is in `dmAllowedUsers` (if configured)
4. Bot creates or reuses an agent for the user's channel ID
5. Bot processes the message and sends responses back via DM

### DM Configuration

- **Enable DMs**: Set `dmAgentType` to the agent type to use for DMs
- **Restrict Access**: Set `dmAllowedUsers` to an array of user IDs allowed to DM the bot
- **Agent Type**: Each DM user gets their own agent instance with the specified agent type

## File Attachments

### How File Attachments Work

1. Bot receives a message with file attachments
2. Bot validates file size against `maxFileSize`
3. Bot downloads files using `axios` with bot token authorization
4. Bot converts file content to base64 and adds to message attachments
5. Bot passes attachments to the agent for processing

### File Attachment Configuration

- **Max File Size**: Configure `maxFileSize` in bytes (default: 20MB)
- **File Types**: Supports any file type that Slack provides a download URL for
- **Error Handling**: Failed file downloads are logged but don't block message processing

## Related Components

- **@tokenring-ai/escalation**: Escalation service for agent-to-human communication
- **@tokenring-ai/agent**: Agent system for AI-powered interactions
- **@tokenring-ai/app**: TokenRing application framework

## License

MIT License - see LICENSE file for details.
