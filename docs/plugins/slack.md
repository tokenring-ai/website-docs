# Slack Plugin

Slack workspace integration enabling bot interactions with persistent per-user agent instances.

## Overview

The `@tokenring-ai/slack` package integrates Slack with TokenRing agents, enabling bot interactions within your workspace. Each Slack user gets their own persistent agent instance that maintains conversation history, providing personalized AI assistance through direct messages, mentions, and slash commands.

## Key Features

- **Per-User Agents**: Each Slack user gets a dedicated agent with persistent chat history
- **Multiple Interaction Methods**: @mentions, direct messages, and slash commands
- **Socket Mode Support**: No public endpoint required for development
- **Authorization Control**: Optional user whitelist for access management
- **Persistent Sessions**: Conversation state maintained per user
- **Agent Cleanup**: Automatic cleanup when service stops

## Prerequisites

To use the Slack plugin, you need:

- Slack workspace with app creation permissions
- **Bot Token (`botToken`)**: OAuth token starting with `xoxb-`
- **Signing Secret (`signingSecret`)**: Verifies incoming Slack requests
- **App-Level Token (`appToken`)** (Optional): Token starting with `xapp-` for Socket Mode
- **Channel ID (`channelId`)** (Optional): Channel for startup announcements (e.g., `C1234567890`)
- **Authorized User IDs (`authorizedUserIds`)** (Optional): Array of user IDs allowed to use the bot
- **Default Agent Type (`defaultAgentType`)** (Optional): Agent type to create for users (defaults to first available)

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

```typescript
import SlackService from '@tokenring-ai/slack/SlackBotService';
import { AgentTeam } from '@tokenring-ai/agent';

const slackService = new SlackService({
  botToken: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  appToken: process.env.SLACK_APP_TOKEN, // Optional, enables Socket Mode
  channelId: process.env.SLACK_CHANNEL_ID, // Optional
  authorizedUserIds: ['U06T1LWJG', 'UABCDEF123'], // Optional
  defaultAgentType: 'teamLeader' // Optional
});

const agentTeam = new AgentTeam(config);
await agentTeam.addServices(slackService);
await slackService.start(agentTeam);
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

### Socket Mode vs HTTP Mode

**Socket Mode** (when `appToken` provided):
- No public endpoint required
- Ideal for development
- Real-time WebSocket connection

**HTTP Mode** (without `appToken`):
- Requires public endpoint
- Production-ready
- Event subscriptions via HTTP

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

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@slack/bolt@^4.2.0`: Slack Bolt framework
- `@slack/web-api@^7.11.0`: Slack Web API client

## Notes

- Each user's agent maintains independent conversation state
- Socket Mode recommended for development (no public endpoint needed)
- HTTP mode requires configuring event subscriptions in Slack app settings
- Authorization list can be updated at runtime
- Agents are cleaned up gracefully when service stops
- Bot must be invited to channels to receive mentions
