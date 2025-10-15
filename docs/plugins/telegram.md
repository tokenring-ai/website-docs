# Telegram Plugin

Telegram bot integration with persistent per-user agent instances and conversation history.

## Overview

The `@tokenring-ai/telegram` package integrates Telegram with TokenRing agents, enabling bot interactions through Telegram's messaging platform. Each Telegram user gets their own persistent agent instance that maintains conversation history, providing personalized AI assistance through direct messages and commands.

## Key Features

- **Per-User Agents**: Each Telegram user gets a dedicated agent with persistent chat history
- **Direct Messages**: Private one-on-one conversations with the bot
- **Authorization Control**: Optional user whitelist for access management
- **Slash Commands**: Forward commands to agent's command system (e.g., `/help`, `/reset`)
- **Persistent Sessions**: Conversation state maintained per user
- **Agent Cleanup**: Automatic cleanup when service stops

## Prerequisites

To use the Telegram plugin, you need:

- Telegram bot token from [@BotFather](https://t.me/botfather)
- **Bot Token (`botToken`)**: Token provided by BotFather (required)
- **Chat ID (`chatId`)** (Optional): Chat for startup announcements
- **Authorized User IDs (`authorizedUserIds`)** (Optional): Array of user IDs allowed to use the bot
- **Default Agent Type (`defaultAgentType`)** (Optional): Agent type to create for users (defaults to "teamLeader")

## Setup

### 1. Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Save the bot token provided by BotFather

### 2. Get Chat ID (Optional)

To get a chat ID for announcements:
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find the `chat.id` value in the response

### 3. Get User IDs (Optional)

To restrict access to specific users:
1. Have users send a message to your bot
2. Visit the `/getUpdates` endpoint (same as above)
3. Find the `from.id` values for each user

## Configuration

```typescript
import TelegramBotService from '@tokenring-ai/telegram/TelegramBotService';
import { AgentTeam } from '@tokenring-ai/agent';

const telegramService = new TelegramBotService({
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID, // Optional
  authorizedUserIds: ['123456789', '987654321'], // Optional
  defaultAgentType: 'teamLeader' // Optional
});

const agentTeam = new AgentTeam(config);
await agentTeam.addServices(telegramService);
await telegramService.start(agentTeam);
```

## Usage

### Send Messages

Simply send any message to your bot in a direct message conversation:
```
Hello, can you help me with my code?
```

### Use Commands

Forward commands to the agent's command system:
```
/help
/reset
/model
```

### Private Conversations

All interactions are private direct messages between the user and the bot. Each user has their own isolated conversation context.

## Core Components

### TelegramBotService

Main service class implementing TokenRingService for Telegram integration.

**Constructor Options:**
- `botToken`: Required bot token from BotFather
- `chatId`: Optional chat ID for startup announcements
- `authorizedUserIds`: Optional array of allowed user IDs (strings)
- `defaultAgentType`: Optional default agent type (defaults to "teamLeader")

**Key Features:**
- Creates per-user agent instances on first interaction
- Maintains conversation history per user
- Routes messages to appropriate agents
- Handles slash commands
- Cleans up agents on service stop

## Authorization

### Open Access

If `authorizedUserIds` is empty or not provided, all users can interact with the bot:

```typescript
const telegramService = new TelegramBotService({
  botToken: process.env.TELEGRAM_BOT_TOKEN!
  // No authorizedUserIds = open to all
});
```

### Restricted Access

Provide an array of Telegram user IDs to restrict access:

```typescript
const telegramService = new TelegramBotService({
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  authorizedUserIds: ['123456789', '987654321']
});
```

Only listed users will be able to interact with the bot. Unauthorized users will receive no response.

## Agent Management

### Per-User Agents

Each Telegram user automatically gets:
- Dedicated agent instance
- Independent conversation state
- Persistent chat history
- Isolated context

### Agent Lifecycle

- **Creation**: Agent created on first user message
- **Persistence**: Maintained throughout service lifetime
- **Cleanup**: Automatically cleaned up when service stops

## Configuration Options

- `botToken`: Telegram bot token from BotFather (required)
- `chatId`: Chat ID for startup announcements (optional)
- `authorizedUserIds`: Array of authorized user IDs as strings (optional, empty = all users)
- `defaultAgentType`: Default agent type for new users (optional, defaults to "teamLeader")

## Environment Variables

Recommended setup using environment variables:

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
export TELEGRAM_CHAT_ID="-1001234567890"  # Optional
```

## Usage Example

```typescript
import TelegramBotService from '@tokenring-ai/telegram/TelegramBotService';
import { AgentTeam } from '@tokenring-ai/agent';

// Create agent team with configuration
const agentTeam = new AgentTeam({
  agents: {
    teamLeader: { /* agent config */ },
    developer: { /* agent config */ }
  }
});

// Initialize Telegram service
const telegramService = new TelegramBotService({
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID,
  authorizedUserIds: process.env.TELEGRAM_AUTHORIZED_USERS?.split(','),
  defaultAgentType: 'teamLeader'
});

// Add service and start
await agentTeam.addServices(telegramService);
await telegramService.start(agentTeam);

console.log('Telegram bot is running!');
```

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `node-telegram-bot-api@^0.66.0`: Telegram Bot API client

## Notes

- Each user's agent maintains independent conversation state
- All interactions are private direct messages
- Authorization list can be updated by restarting the service
- Agents are cleaned up gracefully when service stops
- Bot token must be kept secret and never committed to version control
- User IDs are numeric strings (e.g., "123456789")
- Commands are forwarded to the agent's command system
- No group chat support - only direct messages
