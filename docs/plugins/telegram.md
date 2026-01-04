# Telegram Plugin

Telegram bot integration with persistent per-user agent instances and conversation history for AI-powered interactions.

## Overview

The `@tokenring-ai/telegram` package integrates Telegram with TokenRing agents, enabling bot interactions through Telegram's messaging platform. Each Telegram user gets their own persistent agent instance that maintains conversation history, providing personalized AI assistance through direct messages and commands.

## Key Features

- **Per-User Agents**: Each Telegram user gets a dedicated agent with persistent chat history
- **Direct Messages**: Private one-on-one conversations with the bot
- **Event-Driven Communication**: Handles agent events and sends responses back to Telegram
- **Authorization Control**: Optional user whitelist for access management
- **Message Accumulation**: Accumulates chat content and sends complete responses
- **Timeout Management**: Configurable agent timeout handling with user feedback
- **Error Handling**: Robust error handling with user-friendly error messages
- **Graceful Shutdown**: Proper cleanup of all user agents on service termination
- **Plugin Integration**: Seamless integration with TokenRing plugin system

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
2. Visit: `https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getUpdates`
3. Find the `chat.id` value in the response

### 3. Get User IDs (Optional)

To restrict access to specific users:
1. Have users send a message to your bot
2. Visit the `/getUpdates` endpoint (same as above)
3. Find the `from.id` values for each user

## Configuration

The Telegram service uses Zod schema validation for configuration. Here are the available options:

### Required

- **`botToken`** (string): Telegram bot token obtained from BotFather

### Optional

- **`chatId`** (string): Chat ID for startup announcements. If provided, the bot will send a "Telegram bot is online!" message when started.
- **`authorizedUserIds`** (string[]): Array of Telegram user IDs allowed to interact with the bot. If empty or undefined, all users can interact.
- **`defaultAgentType`** (string): Default agent type to create for users (defaults to "teamLeader").

```typescript
import TelegramService, &#123; TelegramServiceConfigSchema &#125; from '@tokenring-ai/telegram';

const config: TelegramServiceConfig = &#123;
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID,
  authorizedUserIds: ['123456789', '987654321'],
  defaultAgentType: 'teamLeader'
&#125;;

// Validate configuration
const validatedConfig = TelegramServiceConfigSchema.parse(config);
```

## Usage

### Plugin Installation

The recommended way to use the Telegram service is through the TokenRing plugin system:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import telegramPlugin from '@tokenring-ai/telegram';

const app = new TokenRingApp(&#123;
  // Your app configuration
&#125;);

// Install the Telegram plugin
app.install(telegramPlugin);

// Configure via environment variables or app configuration
// TELEGRAM_BOT_TOKEN=your-bot-token
// TELEGRAM_CHAT_ID=your-chat-id (optional)
// TELEGRAM_AUTHORIZED_USER_IDS=123456789,987654321 (optional)
// TELEGRAM_DEFAULT_AGENT_TYPE=teamLeader (optional)

await app.start();
```

### Manual Service Creation

For more control, you can create the service manually:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import TelegramService, &#123; TelegramServiceConfigSchema &#125; from '@tokenring-ai/telegram';

const app = new TokenRingApp(&#123;
  // Your app configuration
&#125;);

const config: TelegramServiceConfig = &#123;
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID,
  authorizedUserIds: ['123456789', '987654321'],
  defaultAgentType: 'teamLeader'
&#125;;

// Validate configuration
const validatedConfig = TelegramServiceConfigSchema.parse(config);

const telegramService = new TelegramService(app, validatedConfig);
app.addServices(telegramService);

await telegramService.run(signal);
```

## Core Components

### TelegramService

Main service class implementing TokenRingService for Telegram integration.

**Constructor:**
```typescript
constructor(app: TokenRingApp, config: TelegramServiceConfig)
```

**Key Properties:**
- `name`: "TelegramService" - Service identifier
- `description`: "Provides a Telegram bot for interacting with TokenRing agents."
- `running`: Service running status

**Methods:**
- `run(signal: AbortSignal): Promise&lt;void&gt;`: Starts the Telegram bot and begins polling for messages

## Message Processing Flow

1. **Authorization Check**: Verifies user is authorized (if user whitelist is configured)
2. **Agent Management**: Gets or creates dedicated agent for the user
3. **State Wait**: Waits for agent to be idle before processing new input
4. **Input Handling**: Sends message to agent for processing
5. **Event Processing**: Subscribes to agent events:
   - `output.chat`: Sends chat responses to Telegram
   - `output.info`: Sends system messages with level formatting (INFO)
   - `output.warning`: Sends system messages with level formatting (WARNING)
   - `output.error`: Sends system messages with level formatting (ERROR)
   - `input.handled`: Cleans up event subscription and handles timeouts
6. **Response Accumulation**: Accumulates chat content and sends when complete
7. **Timeout Handling**: Implements configurable timeout with user feedback

## Authorization

### Open Access

If `authorizedUserIds` is empty or not provided, all users can interact with the bot:

```typescript
const telegramService = new TelegramService(app, &#123;
  botToken: process.env.TELEGRAM_BOT_TOKEN!
  // No authorizedUserIds = open to all
&#125;);
```

### Restricted Access

Provide an array of Telegram user IDs to restrict access:

```typescript
const telegramService = new TelegramService(app, &#123;
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  authorizedUserIds: ['123456789', '987654321']
&#125;);
```

Only listed users will be able to interact with the bot. Unauthorized users will receive the message "Sorry, you are not authorized to use this bot."

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

## Environment Variables

Recommended setup using environment variables:

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
export TELEGRAM_CHAT_ID="-1001234567890"  # Optional
export TELEGRAM_AUTHORIZED_USERS="123456789,987654321"  # Optional
export TELEGRAM_DEFAULT_AGENT_TYPE="teamLeader"  # Optional
```

## Error Handling

### Bot-Level Errors

- **Polling Errors**: Logged to console with error details
- **Message Processing**: Wrapped in try-catch to prevent crashes
- **Bot Startup**: Validates configuration before initialization

### User-Level Errors

- **Authorization**: Sends "Sorry, you are not authorized to use this bot." for unauthorized users
- **Timeout**: Sends "Agent timed out after &#123;time&#125; seconds." when agents exceed max runtime
- **No Response**: Sends "No response received from agent." when no output is generated

### Service-Level Errors

- **Configuration**: Validates bot token presence on construction
- **Shutdown**: Graceful cleanup with error handling for bot stop operations
- **Resource Management**: Proper cleanup prevents resource leaks

## Security Considerations

- **Bot Token Security**: Never commit bot tokens to version control
- **User Authorization**: Use `authorizedUserIds` to restrict bot access to specific users
- **Input Validation**: All user input is validated and sanitized
- **Error Information**: Error messages are user-friendly without exposing internal details
- **Resource Cleanup**: Proper cleanup prevents resource leaks

## Troubleshooting

### Common Issues

1. **"Bot token is required" error**: Ensure you've provided a valid bot token in configuration
2. **"Not authorized" message**: Add your user ID to `authorizedUserIds` array or remove the restriction
3. **Bot not responding**: Check that the service is started and polling is enabled
4. **Timeout messages**: Adjust `maxRunTime` in agent configuration or increase timeout period

### Debug Information

Enable detailed logging to troubleshoot issues:

```typescript
import &#123; setLogLevel &#125; from '@tokenring-ai/utility';

setLogLevel('debug');
```

### Environment Variables

Ensure these environment variables are properly set:

- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `TELEGRAM_CHAT_ID`: Optional chat ID for startup messages
- `TELEGRAM_AUTHORIZED_USERS`: Comma-separated list of authorized user IDs
- `TELEGRAM_DEFAULT_AGENT_TYPE`: Agent type for new users (default: "teamLeader")

## Notes

- Each user's agent maintains independent conversation state
- All interactions are private direct messages (no group chat support)
- Authorization list can be updated by restarting the service
- Agents are cleaned up gracefully when service stops
- Bot token must be kept secret and never committed to version control
- User IDs are numeric strings (e.g., "123456789")
- Commands are forwarded to the agent's command system
- Message processing includes proper event handling and state management
