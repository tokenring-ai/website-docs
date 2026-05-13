# Escalation Plugin

An abstract service to initiate communication with one or more users via escalation channels, enabling AI agents to request human assistance and await responses.

## Overview

The `@tokenring-ai/escalation` package provides a pluggable system for AI agents to escalate decisions or requests to human users through various communication platforms (Slack, Telegram, etc.). It supports both individual user targeting and group messaging, with a unified interface for sending messages and receiving responses via the `CommunicationChannel` pattern.

## Key Features

- **Multi-Provider Support**: Pluggable providers for different communication platforms
- **User and Group Targeting**: Send messages to individual users or predefined groups
- **Communication Channel Pattern**: Bidirectional messaging using async generators
- **Flexible Addressing**: Use `service:userId` format for clear routing
- **Built-in /escalate Command**: Chat command for agent interactions
- **Group Broadcasting**: Built-in `GroupEscalationProvider` for group messaging with automatic broadcast
- **Async Resource Management**: Automatic cleanup using `Symbol.asyncDispose`

## Installation

```bash
bun add @tokenring-ai/escalation
```

## Chat Commands

| Command | Description |
|---------|-------------|
| `/escalate {target} {message}` | Send an escalation request to a user or group |

### /escalate

Send an escalation request to a user or group.

**Usage:**

```text
/escalate {service:userId|group:groupName} {message}
```

**Arguments:**

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `target` | `string` | Yes | Target user or group in `service:userId` format (e.g., `slack:U123ABC`, `telegram:123456`, `group:dev-team`) |
| `message` | `string` | Yes | Message content to send |

**Examples:**

```text
/escalate telegram:123456789 Project deadline extension request
/escalate slack:U123ABC Production server experiencing high latency
/escalate group:dev-team Need code review for authentication module
/escalate group:managers Approval needed for budget increase
```

**Notes:**

- This command sends the message and returns immediately
- The response from the recipient will be displayed in the chat once received
- Use `await using` for proper resource cleanup

## Tools

The escalation package does not define any tools.

## Configuration

Configure the escalation service in your TokenRing app configuration:

```yaml
escalation:
  groups:
    dev-team:
      members:
        dev-team:
          - "telegram:123456"
          - "slack:U123ABC"
    managers:
      members:
        managers:
          - "telegram:789012"
          - "telegram:345678"
```

### Configuration Schema

```typescript
import { z } from "zod";

const GroupEscalationProviderConfigSchema = z.object({
  members: z.record(z.string(), z.array(z.string())),
});

const EscalationServiceConfigSchema = z.object({
  groups: z.record(z.string(), GroupEscalationProviderConfigSchema),
});
```

**Configuration Options:**

| Option | Type | Description |
|--------|------|-------------|
| `escalation.groups` | `Record<string, GroupEscalationProviderConfig>` | Map of group names to their configurations |
| `groups.<name>.members` | `Record<string, string[]>` | Map of group IDs to arrays of `service:userId` addresses |

### Configuration Example

```typescript
import { defineConfig } from "@tokenring-ai/app";

export default defineConfig({
  escalation: {
    groups: {
      "dev-team": {
        members: {
          "dev-team": ["telegram:123456", "slack:U123ABC"]
        }
      },
      "managers": {
        members: {
          "managers": ["telegram:789012", "telegram:345678"]
        }
      }
    }
  }
});
```

## Integration

### Plugin Registration

The escalation package provides a plugin for easy TokenRing integration:

```typescript
import escalationPlugin from '@tokenring-ai/escalation/plugin';

app.installPlugin(escalationPlugin, {
  escalation: {
    groups: {
      "dev-team": {
        members: {
          "dev-team": ["telegram:123456", "slack:U123ABC"]
        }
      }
    }
  }
});
```

### Service Registration

Manual service registration:

```typescript
import EscalationService from '@tokenring-ai/escalation/EscalationService';
import GroupEscalationProvider from '@tokenring-ai/escalation/GroupEscalationProvider';

const service = new EscalationService({
  groups: {}
});

app.addServices(service);

// Register group provider
service.registerProvider('dev-team', new GroupEscalationProvider({
  members: {
    'dev-team': ['telegram:123456', 'slack:U123ABC']
  }
}));
```

### Command Registration

Commands are automatically registered when using the plugin. For manual registration:

```typescript
import { AgentCommandService } from '@tokenring-ai/agent';
import agentCommands from '@tokenring-ai/escalation/commands';

app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(agentCommands)
);
```

## Best Practices

1. **Always use `await using`**: Ensure proper cleanup of communication channels
2. **Validate addresses**: Check address format before calling `initiateContactWithUser`
3. **Handle errors gracefully**: Wrap escalation calls in try/catch blocks
4. **Use groups for collaboration**: Leverage group messaging for team decisions
5. **Set timeouts**: Consider implementing timeouts for long-running conversations
6. **Monitor resource usage**: Be mindful of multiple concurrent channels

---

## Developer Reference

### Core Components

#### EscalationService

The core service that manages escalation providers and initiates contact with users.

**Implements:** `TokenRingService`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name: "EscalationService" |
| `description` | `string` | Service description |
| `config` | `object` | Service configuration |

**Methods:**

| Method | Description |
|--------|-------------|
| `registerProvider(name: string, provider: EscalationProvider)` | Register a new escalation provider |
| `initiateContactWithUser(serviceNameAndUser: string, agent: Agent): Promise<CommunicationChannel>` | Initiate contact with a user or group and return a communication channel |

#### EscalationProvider

Interface for creating communication channels with users.

```typescript
interface EscalationProvider {
  createCommunicationChannelWithUser: (userId: string, agent: Agent) => Promise<CommunicationChannel>;
}
```

#### CommunicationChannel

Type for bidirectional messaging with async resource management.

```typescript
type CommunicationChannel = {
  send: (message: string) => Promise<void>;
  receive: () => AsyncGenerator<string>;
  [Symbol.asyncDispose]: () => Promise<void>;
};
```

**Methods:**

| Method | Description |
|--------|-------------|
| `send(message: string)` | Send a message to the user or group |
| `receive()` | Get async generator to receive incoming messages |
| `[Symbol.asyncDispose]` | Async cleanup method (used with `await using`) |

#### GroupEscalationProvider

Built-in provider for group messaging with automatic broadcast capabilities.

**Constructor:**

```typescript
constructor(config: { members: Record<string, string[]> })
```

**Features:**

- Broadcast messages to all group members
- Collect responses from all members
- Automatically broadcast responses to other group members with `@userId` prefix
- Clean resource management with AbortController

### Services

#### EscalationService Implementation

The `EscalationService` implements the `TokenRingService` interface and provides the core escalation functionality.

```typescript
import EscalationService from '@tokenring-ai/escalation/EscalationService';

const service = new EscalationService({
  groups: {}
});

app.addServices(service);
```

### Provider Documentation

#### EscalationProvider Interface

The `EscalationProvider` interface defines how to create communication channels with users:

```typescript
interface EscalationProvider {
  createCommunicationChannelWithUser: (userId: string, agent: Agent) => Promise<CommunicationChannel>;
}
```

#### Creating a Custom Provider

Implement the `EscalationProvider` interface:

```typescript
import type { EscalationProvider } from '@tokenring-ai/escalation';
import type { Agent } from '@tokenring-ai/agent';

export class MyEscalationProvider implements EscalationProvider {
  async createCommunicationChannelWithUser(userId: string, agent: Agent) {
    // Create and return a CommunicationChannel for this user
    return {
      send: async (message: string) => {
        // Send message to user via your platform
        console.log(`Sending to ${userId}: ${message}`);
      },
      receive: async function* () {
        // Generate incoming messages as an async generator
        // This should yield messages as they arrive
        yield 'Hello from user';
      },
      [Symbol.asyncDispose]: async () => {
        // Clean up resources
        console.log(`Cleaning up channel for ${userId}`);
      }
    };
  }
}
```

#### GroupEscalationProvider Configuration

The `GroupEscalationProvider` uses the following configuration schema:

```typescript
const GroupEscalationProviderConfigSchema = z.object({
  members: z.record(z.string(), z.array(z.string()))
});
```

**Configuration Options:**

| Option | Type | Description |
|--------|------|-------------|
| `members` | `Record<string, string[]>` | Map of group IDs to arrays of `service:userId` addresses |

**Note:** The `members` configuration is a record where each key is a group ID and the value is an array of user addresses. When calling `initiateContactWithUser`, pass the group ID (with the `group:` prefix) and the provider will look up the members from the `members` record.

### RPC Endpoints

The escalation package does not define any RPC endpoints.

### Usage Examples

#### Programmatic Usage

```typescript
import { EscalationService } from '@tokenring-ai/escalation';

const escalationService = agent.requireServiceByType(EscalationService);

// Send to individual user and receive responses
await using channel = await escalationService.initiateContactWithUser(
  'telegram:123456789',
  agent
);

// Send a message
await channel.send('Need approval for production deployment');

// Receive responses using async generator
for await (const message of channel.receive()) {
  console.log('Received response:', message);
  // Process response
  // Send additional messages if needed
  await channel.send('Additional information');
}

// Channel is automatically closed via Symbol.asyncDispose
```

#### Group Communication

Groups allow broadcasting to multiple users across different platforms:

```typescript
{
  escalation: {
    groups: {
      "dev-team": {
        members: {
          "dev-team": ["telegram:123456", "slack:U123ABC", "telegram:789012"]
        }
      },
      "managers": {
        members: {
          "managers": ["telegram:345678", "slack:U456DEF"]
        }
      }
    }
  }
}
```

When messaging a group, all users receive the message and responses are collected:

```typescript
await using channel = await escalationService.initiateContactWithUser(
  'group:dev-team',
  agent
);

// Broadcast to all group members
await channel.send('Need approval for production deployment');

// Receive responses from all members
for await (const message of channel.receive()) {
  console.log('Received response:', message);
}
```

#### Creating a Custom Escalation Provider

```typescript
import type { EscalationProvider } from '@tokenring-ai/escalation';
import type { Agent } from '@tokenring-ai/agent';

export class MyEscalationProvider implements EscalationProvider {
  async createCommunicationChannelWithUser(userId: string, agent: Agent) {
    return {
      send: async (message: string) => {
        // Send message to user via your platform
        console.log(`Sending to ${userId}: ${message}`);
      },
      receive: async function* () {
        // Generate incoming messages as an async generator
        yield 'Hello from user';
      },
      [Symbol.asyncDispose]: async () => {
        // Clean up resources
        console.log(`Cleaning up channel for ${userId}`);
      }
    };
  }
}

// Register provider
const service = app.requireService(EscalationService);
service.registerProvider('myplatform', new MyEscalationProvider());
```

### Address Format

Addresses use the format `service:userId`:

- `service`: Registered provider name (e.g., `telegram`, `slack`, `group`)
- `userId`: Platform-specific user identifier or group ID

**Examples:**

- `telegram:123456789` - Telegram user by ID
- `slack:U123ABC` - Slack user
- `group:dev-team` - Group name (with `group:` prefix)

### Error Handling

The service throws errors for:

- **Invalid address format**: Missing `:` separator in address
- **Unknown provider**: Provider name not registered
- **Unknown group**: Group name not found in provider configuration
- **Provider-specific errors**: Network issues, unauthorized users, etc.

```typescript
import { EscalationService } from '@tokenring-ai/escalation';

try {
  const escalationService = agent.requireServiceByType(EscalationService);
  const channel = await escalationService.initiateContactWithUser(
    'unknown:123',
    agent
  );
} catch (error) {
  if (error.message.includes('Invalid user or group ID')) {
    console.error('Invalid address format');
  } else if (error.message.includes('Provider')) {
    console.error('Unknown provider');
  } else {
    console.error('Escalation failed:', error);
  }
}
```

### State Management

The escalation service itself does not maintain state, but communication channels are managed through the async dispose pattern. Channels are automatically cleaned up when:

- The `await using` block exits
- The `[Symbol.asyncDispose]` method is called
- An error occurs during communication

### Testing

Run the test suite with vitest:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Dependencies

#### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/agent` | 0.2.0 | Agent orchestration system |
| `@tokenring-ai/app` | 0.2.0 | Application framework |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities and registry |
| `zod` | ^4.3.6 | Schema validation |

#### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

### Related Components

- **@tokenring-ai/agent**: Agent orchestration and command execution
- **@tokenring-ai/app**: Application framework and plugin system
- **@tokenring-ai/utility**: KeyedRegistry and utility functions

### Package Structure

```text
pkg/escalation/
├── index.ts                    # Main exports
├── plugin.ts                   # Plugin definition for TokenRing integration
├── EscalationService.ts        # Core service implementation
├── EscalationProvider.ts       # Provider interface and types
├── GroupEscalationProvider.ts  # Built-in group provider implementation
├── schema.ts                   # Configuration schemas
├── commands.ts                 # Command exports
├── commands/
│   └── escalate.ts             # /escalate command implementation
├── vitest.config.ts            # Vitest configuration
└── LICENSE                     # MIT License
```

## License

MIT License - see LICENSE file for details.
