# Slack Plugin

Slack workspace integration enabling bot interactions with persistent per-channel agent instances and comprehensive message handling.

## Overview

The `@tokenring-ai/slack` package integrates Slack with TokenRing agents, enabling bot interactions within your workspace. Each Slack channel gets a dedicated agent instance that maintains conversation history, providing personalized AI assistance through channel messages, @mentions, and direct messages. The plugin handles message routing, event processing, and maintains per-channel agent sessions. It also supports escalation workflows for agent-to-human communication.

## Key Features

- **Multiple Bot Support**: Manage multiple discrete Slack bots in a single service
- **Per-Channel Agents**: Each Slack channel gets a dedicated agent with persistent chat history
- **Direct Messaging with Threads**: Send messages to channels and await responses via Slack thread mechanism
- **Escalation Provider**: Implements EscalationProvider interface for agent-to-human escalation workflows
- **Authorization Control**: Optional user whitelist for access management per channel
- **Persistent Sessions**: Conversation state maintained per channel
- **Agent Cleanup**: Automatic cleanup when service stops
- **Message Routing**: Handles chat, info, warning, and error messages
- **Timeout Handling**: Configurable response timeouts per agent
- **Plugin Architecture**: Automatically integrates with TokenRing applications
- **Event Handling**: Comprehensive handling of different message types

## Prerequisites

To use the Slack plugin, you need:

- Slack workspace with app creation permissions
- **Bot Token (`botToken`)**: OAuth token starting with `xoxb-`
- **Signing Secret (`signingSecret`)**: Verifies incoming Slack requests
- **App-Level Token (`appToken`)** (Optional): Token starting with `xapp-` for Socket Mode
- **Channel ID (`channelId`)** (Optional): Channel for startup announcements
- **Allowed User IDs (`allowedUsers`)** (Optional): Array of user IDs allowed to use the bot in a channel
- **Agent Type (`agentType`)** (Optional): Agent type to create for the channel (defaults to "teamLeader")

## Setup

### 1. Create Slack App

Visit [https://api.slack.com/apps](https://api.slack.com/apps) and create a new app.

### 2. Add Bot Token Scopes

Configure the following OAuth scopes:

- `chat:write` - Send messages
- `app_mentions:read` - Receive @mentions
- `channels:history` - Read channel messages
- `channels:read` - View channel info
- `im:history`, `im:read`, `im:write` - Direct messages (optional)

### 3. Get Credentials

- **Bot User OAuth Token**: From "OAuth & Permissions" page
- **Signing Secret**: From "Basic Information" > "App Credentials"
- **App-Level Token**: Enable Socket Mode and generate token (optional)

### 4. Install to Workspace

Install the app to your workspace and invite the bot to channels:
```
/invite @YourBotName
```

## Configuration

### Multiple Bots Configuration

The Slack plugin supports managing multiple bots simultaneously, each with their own configuration:

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
        }
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

### Escalation Provider Configuration

Configure the Slack escalation provider for agent-to-human communication:

```typescript
app.config({
  slack: {
    bots: {
      "mainBot": {
        name: "Main Bot",
        botToken: process.env.SLACK_BOT_TOKEN!,
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        channels: {
          "engineering": {
            channelId: "C1234567890",
            allowedUsers: ["U06T1LWJG", "UABCDEF123"],
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
```

## Core Components

### SlackService

Main service class implementing TokenRingService for managing multiple Slack bots.

**Constructor Options:**
- `app`: TokenRingApp instance
- `config`: ParsedSlackServiceConfig with bots configuration

**Key Features:**
- Manages multiple Slack bots simultaneously
- Creates per-channel agent instances
- Maintains conversation history per channel
- Routes messages to appropriate agents
- Handles @mentions, DMs, and channel messages
- Cleans up agents on service stop
- Processes different message types (chat, info, warning, error)
- Manages response timeouts

### SlackBot

Individual bot instance managing a single Slack bot connection.

**Methods:**
- **`createCommunicationChannelWithChannel(channelName: string)`**: Creates a communication channel for a configured channel
- **`createCommunicationChannelWithUser(userId: string)`**: Creates a communication channel for a specific user/channel ID
- **`getBotUserId(): string | undefined`**: Returns the bot's user ID
- **`start(): Promise<void>`**: Starts the Slack bot
- **`stop(): Promise<void>`**: Stops the Slack bot

### SlackEscalationProvider

Escalation provider implementation for agent-to-human communication.

**Configuration:**
- `type`: Must be 'slack'
- `bot`: Name of the bot configuration
- `channel`: Name of the channel configuration

**Methods:**
- **`createCommunicationChannelWithUser(channelName: string, agent: Agent)`**: Creates a communication channel for the specified channel

## Socket Mode vs HTTP Mode

**Socket Mode** (when `appToken` provided):
- No public endpoint required
- Ideal for development
- Real-time WebSocket connection

**HTTP Mode** (without `appToken`):
- Requires public endpoint
- Production-ready
- Event subscriptions via HTTP

## Message Handling

The Slack service handles different types of messages:

- **Chat Messages**: Regular conversational responses (accumulated and sent)
- **Info Messages**: System information with `[INFO]:` prefix
- **Warning Messages**: Warning information with `[WARNING]:` prefix
- **Error Messages**: Error information with `[ERROR]:` prefix

## Authorization

### Open Access

If `allowedUsers` is empty or not provided, all users can interact with the bot in that channel.

### Restricted Access

Provide an array of Slack user IDs to restrict access:
```typescript
allowedUsers: ['U06T1LWJG', 'UABCDEF123']
```

Only listed users will be able to interact with the bot in that channel.

## Agent Management

### Per-Channel Agents

Each Slack channel automatically gets:
- Dedicated agent instance
- Independent conversation state
- Persistent chat history
- Isolated context

### Agent Lifecycle

- **Creation**: Agent created on first interaction with channel
- **Persistence**: Maintained throughout service lifetime
- **Cleanup**: Automatically cleaned up when service stops

## Configuration Options

For each bot in the `bots` configuration:
- `name`: Bot display name (required)
- `botToken`: Slack Bot User OAuth Token (required)
- `signingSecret`: Slack Signing Secret (required)
- `appToken`: Slack App-Level Token for Socket Mode (optional)
- `channels`: Record of channel configurations (required)

For each channel in the `channels` configuration:
- `channelId`: Slack channel ID (required)
- `allowedUsers`: Array of authorized user IDs (optional, empty = all users)
- `agentType`: Agent type to create (optional, defaults to "teamLeader")

## Environment Variables

Recommended setup using environment variables:

```bash
export SLACK_BOT_TOKEN="xoxb-your-bot-token"
export SLACK_SIGNING_SECRET="your-signing-secret"
export SLACK_APP_TOKEN="xapp-your-app-token"  # Optional
export SLACK_SECONDARY_BOT_TOKEN="xoxb-secondary-bot-token"
export SLACK_SECONDARY_SIGNING_SECRET="secondary-signing-secret"
```

## Direct Messaging and Escalation

The Slack service supports direct messaging with thread-based responses, enabling synchronous communication between agents and users.

### Communication Channel API

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
```

### How Thread Handling Works

1. Service sends message to channel via Slack
2. Message ID is stored with a reply handler
3. User replies to the message using Slack's thread feature
4. Service detects the thread reply and invokes registered listeners with the response text
5. Response is processed by the communication channel

### Escalation Provider Integration

When using the plugin, the escalation provider is automatically registered if both plugins are installed.

## Notes

- Each channel's agent maintains independent conversation state
- Socket Mode recommended for development (no public endpoint needed)
- HTTP mode requires configuring event subscriptions in Slack app settings
- Authorization lists can be updated by changing configuration
- Agents are cleaned up gracefully when service stops
- Bot must be invited to channels to receive messages
- Response timeouts are configurable per agent (default: 30 seconds)
- The service handles different message types with appropriate formatting
- Multiple bots can be managed simultaneously with separate configurations
- Thread-based messaging enables synchronous agent-user interactions

## Example Workflow

1. User sends message to channel where bot is present
2. Slack service creates or retrieves channel's agent
3. Agent processes the message and generates response
4. Response is accumulated and formatted, then sent back to Slack
5. Agent state is maintained for future interactions in that channel
6. For escalation, agent can send message to channel and await thread responses

## Troubleshooting

### Common Issues

- **Bot not responding**: Check if bot is invited to the channel
- **Permission errors**: Verify OAuth scopes and token permissions
- **Timeout errors**: Check if `maxRunTime` is configured appropriately
- **Authorization issues**: Verify user IDs in `allowedUsers` array
- **Channel not found**: Verify channel IDs in configuration

### Error Messages

- `[ERROR]: ...` - Agent processing errors
- `[WARNING]: ...` - Warning messages
- `[INFO]: ...` - System information messages

## API Reference

### Configuration Schemas

```typescript
import { z } from 'zod';

export const SlackBotConfigSchema = z.object({
  name: z.string(),
  botToken: z.string().min(1, "Bot token is required"),
  appToken: z.string().optional(),
  signingSecret: z.string().min(1, "Signing secret is required"),
  channels: z.record(z.string(), z.object({
    channelId: z.string(),
    allowedUsers: z.array(z.string()).default([]),
    agentType: z.string(),
  }))
});

export const SlackServiceConfigSchema = z.object({
  bots: z.record(z.string(), SlackBotConfigSchema)
});

export const SlackEscalationProviderConfigSchema = z.object({
  type: z.literal('slack'),
  bot: z.string(),
  channel: z.string(),
});
```

### SlackService Methods

**Constructor:**
```typescript
constructor(app: TokenRingApp, config: z.output<typeof SlackServiceConfigSchema>)
```

**`run(signal: AbortSignal): Promise<void>`**
- Starts all configured Slack bots
- Sets up event listeners
- Manages agent instances

**`getBot(botName: string): SlackBot | undefined`**
- Gets a bot instance by name
- Returns undefined if bot not found

**`getAvailableBots(): string[]`**
- Returns list of configured bot names

### SlackBot Methods

**`createCommunicationChannelWithChannel(channelName: string)`**
- Creates a communication channel for a configured channel
- Returns CommunicationChannel for message exchange

**`createCommunicationChannelWithUser(userId: string)`**
- Creates a communication channel for a specific user/channel ID
- Returns CommunicationChannel for message exchange

**`start(): Promise<void>`**
- Starts the Slack bot
- Connects to Slack API

**`stop(): Promise<void>`**
- Stops the Slack bot
- Cleans up agent instances

**`getBotUserId(): string | undefined`**
- Returns the bot's user ID
- Undefined if bot not started

### Event Processing

The service processes different message types:

1. **Channel Messages**: Messages in channels where bot is present
2. **App Mentions**: Bot mentioned in channels
3. **Direct Messages**: Private messages to the bot
4. **Thread Replies**: Replies to bot messages in threads

Each message type is handled with appropriate authorization checks and agent interaction.

### Response Handling

The service handles different response types with proper formatting:

- **Chat responses**: Accumulated and sent to the channel
- **System messages**: Formatted with appropriate prefixes
- **Timeout handling**: Configurable per agent
- **Error handling**: Graceful error reporting

## Integration Examples

### Basic Integration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import SlackService from "@tokenring-ai/slack/SlackService";
import {SlackServiceConfigSchema} from "@tokenring-ai/slack/schema";

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

### Plugin Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import slackPlugin from "@tokenring-ai/slack";

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

### Escalation Integration

```typescript
import {SlackEscalationProvider} from "@tokenring-ai/slack";
import {SlackEscalationProviderConfigSchema} from "@tokenring-ai/slack/schema";
import {EscalationService} from "@tokenring-ai/escalation";

const slackEscalationProvider = new SlackEscalationProvider(
  SlackEscalationProviderConfigSchema.parse({
    type: 'slack',
    bot: 'mainBot',
    channel: 'engineering'
  })
);

const escalationService = agent.requireServiceByType(EscalationService);
escalationService.registerProvider('slack', slackEscalationProvider);

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

## Development Notes

- **Socket Mode**: Recommended for local development as it doesn't require public endpoints
- **Agent Persistence**: Each channel's agent maintains state across multiple interactions
- **Memory Management**: Agents are automatically cleaned up when the service stops
- **Concurrency**: Multiple users can interact simultaneously in different channels
- **Error Recovery**: The service handles agent creation failures gracefully
- **Testing**: Unit tests available in the package for verification of functionality
- **Multiple Bots**: The service can manage multiple bots simultaneously with different configurations
- **Thread Messaging**: Thread-based messaging enables synchronous communication patterns

## Dependencies

- `@slack/bolt` (^4.6.0) - Slack Bolt framework
- `@slack/web-api` (^7.14.1) - Slack Web API
- `zod` (^4.3.6) - Schema validation
- `@tokenring-ai/app` (0.2.0) - TokenRing application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/agent` (0.2.0) - Agent system
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `@tokenring-ai/escalation` (0.2.0) - Escalation service

## License

MIT License - see LICENSE file for details.