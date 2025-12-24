# Slack Plugin

Slack workspace integration enabling bot interactions with persistent per-user agent instances and comprehensive command handling.

## Overview

The `@tokenring-ai/slack` package integrates Slack with TokenRing agents, enabling bot interactions within your workspace. Each Slack user gets their own persistent agent instance that maintains conversation history, providing personalized AI assistance through direct messages, @mentions, and slash commands. The plugin handles message routing, event processing, and maintains per-user agent sessions.

## Key Features

- **Per-User Agents**: Each Slack user gets a dedicated agent with persistent chat history
- **Multiple Interaction Methods**: @mentions, direct messages, and slash commands
- **Socket Mode Support**: No public endpoint required for development
- **Authorization Control**: Optional user whitelist for access management
- **Persistent Sessions**: Conversation state maintained per user
- **Agent Cleanup**: Automatic cleanup when service stops
- **Message Routing**: Handles chat, info, warning, and error messages
- **Timeout Handling**: Configurable response timeouts per agent

## Prerequisites

To use the Slack plugin, you need:

- Slack workspace with app creation permissions
- **Bot Token (`botToken`)**: OAuth token starting with `xoxb-`
- **Signing Secret (`signingSecret`)**: Verifies incoming Slack requests
- **App-Level Token (`appToken`)** (Optional): Token starting with `xapp-` for Socket Mode
- **Channel ID (`channelId`)** (Optional): Channel for startup announcements (e.g., `C1234567890`)
- **Authorized User IDs (`authorizedUserIds`)** (Optional): Array of user IDs allowed to use the bot
- **Default Agent Type (`defaultAgentType`)** (Optional): Agent type to create for users (defaults to "teamLeader")

## Setup

### 1. Create Slack App

Visit [https://api.slack.com/apps](https://api.slack.com/apps) and create a new app.

### 2. Add Bot Token Scopes

Configure the following OAuth scopes:
- `chat:write` - Send messages
- `app_mentions:read` - Receive @mentions
- `im:history`, `im:read`, `im:write` - Direct messages
- `commands` - Slash commands (optional)

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

The Slack plugin integrates with the TokenRing application framework via the plugin system:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import SlackPlugin from '@tokenring-ai/slack';

// Create TokenRing app
const app = new TokenRingApp({
  // app configuration
});

// Configure Slack service
const slackConfig = {
  botToken: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  appToken: process.env.SLACK_APP_TOKEN, // Optional, enables Socket Mode
  channelId: process.env.SLACK_CHANNEL_ID, // Optional
  authorizedUserIds: ['U06T1LWJG', 'UABCDEF123'], // Optional
  defaultAgentType: 'teamLeader' // Optional
};

// Install the plugin
app.installPlugin(SlackPlugin, slackConfig);
```

## Usage

### Mention the Bot

In any channel where the bot is present:
```
@BotName what is the weather?
```

### Direct Message

Send a direct message to the bot for private conversations.

### Slash Commands

Use slash commands to interact with the agent's command system:
```
/help
@BotName /reset
```

## Core Components

### SlackBotService

Main service class implementing TokenRingService for Slack integration.

**Constructor Options:**
- `botToken`: Required OAuth token for bot
- `signingSecret`: Required secret for request verification
- `appToken`: Optional token for Socket Mode
- `channelId`: Optional channel for announcements
- `authorizedUserIds`: Optional array of allowed user IDs
- `defaultAgentType`: Optional default agent type

**Key Features:**
- Creates per-user agent instances
- Maintains conversation history per user
- Routes messages to appropriate agents
- Handles @mentions, DMs, and commands
- Cleans up agents on service stop
- Processes different message types (chat, info, warning, error)
- Manages response timeouts

### Socket Mode vs HTTP Mode

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

- **Chat Messages**: Regular conversational responses
- **Info Messages**: System information with `[INFO]` prefix
- **Warning Messages**: Warning information with `[WARNING]` prefix
- **Error Messages**: Error information with `[ERROR]` prefix

## Authorization

### Open Access

If `authorizedUserIds` is empty or not provided, all users can interact with the bot.

### Restricted Access

Provide an array of Slack user IDs to restrict access:
```typescript
authorizedUserIds: ['U06T1LWJG', 'UABCDEF123']
```

Only listed users will be able to interact with the bot.

## Agent Management

### Per-User Agents

Each Slack user automatically gets:
- Dedicated agent instance
- Independent conversation state
- Persistent chat history
- Isolated context

### Agent Lifecycle

- **Creation**: Agent created on first user interaction
- **Persistence**: Maintained throughout service lifetime
- **Cleanup**: Automatically cleaned up when service stops

## Configuration Options

- `botToken`: Slack Bot User OAuth Token (required)
- `signingSecret`: Slack Signing Secret (required)
- `appToken`: Slack App-Level Token for Socket Mode (optional)
- `channelId`: Channel ID for startup announcements (optional)
- `authorizedUserIds`: Array of authorized user IDs (optional, empty = all users)
- `defaultAgentType`: Default agent type for new users (optional)

## Environment Variables

Recommended setup using environment variables:

```bash
export SLACK_BOT_TOKEN="xoxb-your-bot-token"
export SLACK_SIGNING_SECRET="your-signing-secret"
export SLACK_APP_TOKEN="xapp-your-app-token"  # Optional
export SLACK_CHANNEL_ID="C1234567890"  # Optional
```

## Dependencies

- `@tokenring-ai/app`: TokenRing application framework
- `@tokenring-ai/agent`: Core agent framework
- `@slack/bolt@^4.6.0`: Slack Bolt framework
- `@slack/web-api@^7.13.0`: Slack Web API client
- `zod`: Validation library
- `@tokenring-ai/utility`: Utility functions
- `@tokenring-ai/chat`: Chat service

## Notes

- Each user's agent maintains independent conversation state
- Socket Mode recommended for development (no public endpoint needed)
- HTTP mode requires configuring event subscriptions in Slack app settings
- Authorization list can be updated at runtime
- Agents are cleaned up gracefully when service stops
- Bot must be invited to channels to receive mentions
- Response timeouts are configurable per agent (default: 30 seconds)
- The service handles different message types with appropriate formatting
- Per-user agent instances provide personalized experiences

## Example Workflow

1. User @mentions the bot in a channel
2. Slack service creates or retrieves user's agent
3. Agent processes the message and generates response
4. Response is formatted and sent back to Slack
5. Agent state is maintained for future interactions

## Troubleshooting

### Common Issues

- **Bot not responding**: Check if bot is invited to the channel
- **Permission errors**: Verify OAuth scopes and token permissions
- **Timeout errors**: Check if `maxRunTime` is configured appropriately
- **Authorization issues**: Verify user IDs in `authorizedUserIds` array

### Error Messages

- `[ERROR]: ...` - Agent processing errors
- `[WARNING]: ...` - Warning messages
- `[INFO]: ...` - System information messages

## API Reference

### SlackServiceConfigSchema

```typescript
import { z } from 'zod';

export const SlackServiceConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required").refine(s => s.trim().length > 0, "Bot token cannot be whitespace"),
  signingSecret: z.string().min(1, "Signing secret is required").refine(s => s.trim().length > 0, "Signing secret cannot be whitespace"),
  appToken: z.string().optional(),
  channelId: z.string().optional(),
  authorizedUserIds: z.array(z.string()).default([]),
  defaultAgentType: z.string().default("teamLeader")
});
```

### SlackService Methods

**Constructor:**
```typescript
constructor(app: TokenRingApp, config: z.output<typeof SlackServiceConfigSchema>)
```

**run(signal: AbortSignal): Promise<void>**
- Starts the Slack service
- Sets up event listeners
- Manages agent instances

**getOrCreateAgentForUser(userId: string): Promise<Agent>**
- Creates agent for new users
- Returns existing agent for returning users
- Maintains user-to-agent mapping

**handleChatOutput(say: any, message: string): Promise<void>**
- Sends chat messages to Slack
- Marks response as sent

**handleSystemOutput(say: any, message: string, level: string): Promise<void>**
- Formats and sends system messages
- Adds appropriate prefix based on level