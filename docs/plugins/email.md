# @tokenring-ai/email

Abstract email interface for Token Ring with provider-based inbox, search, draft, and send workflows.

## Overview

The `@tokenring-ai/email` package provides a provider-based email abstraction for Token Ring agents. It supplies a shared `EmailService`, a provider interface for concrete integrations, chat tools, slash commands, and scripting functions for common email workflows.

This package is intentionally abstract. Concrete integrations such as Gmail register providers into `EmailService`.

## Key Features

- **Provider-based email architecture**: Plug in any email provider implementation
- **Inbox listing and message search**: Retrieve and search email messages
- **Message selection for follow-up work**: Select and inspect specific messages
- **Draft creation and updates**: Compose and modify email drafts
- **Sending drafts**: Send currently selected email drafts
- **Email watching**: Automated processing of incoming emails based on patterns
- **Slash commands and chat tools**: Interactive use in chat interface
- **Agent-scoped provider selection**: Each agent can have its own active provider
- **Scripting integration**: Programmatic access for automation

## Core Components

### EmailService

Main service for email operations, implementing `TokenRingService`.

**Key responsibilities:**
- Register and manage email providers via `KeyedRegistry`
- Resolve the active provider for each agent
- Proxy inbox, search, message, and draft operations to the active provider
- Manage provider selection state in `EmailState`
- Background task for email watching and pattern-based automation

**Key methods:**

```typescript
class EmailService implements TokenRingService {
  readonly name = "EmailService";
  description = "Abstract interface for email inbox and drafting operations";

  // Provider management
  registerEmailProvider: (name: string, provider: EmailProvider) => void;
  getAvailableProviders: () => string[];

  // Provider selection
  setActiveProvider(name: string, agent: Agent): void;
  requireActiveEmailProvider(agent: Agent): EmailProvider;

  // Inbox operations
  getInboxMessages(filter: EmailInboxFilterOptions, agent: Agent): Promise<EmailMessage[]>;
  searchMessages(filter: EmailSearchOptions, agent: Agent): Promise<EmailMessage[]>;
  getMessageById(id: string, agent: Agent): Promise<EmailMessage>;

  // Message selection
  selectMessageById(id: string, agent: Agent): Promise<EmailMessage>;
  getCurrentMessage(agent: Agent): EmailMessage | undefined;
  clearCurrentMessage(agent: Agent): Promise<void>;

  // Draft operations
  createDraft(data: DraftEmailData, agent: Agent): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData, agent: Agent): Promise<EmailDraft>;
  getCurrentDraft(agent: Agent): EmailDraft | undefined;
  clearCurrentDraft(agent: Agent): Promise<void>;

  // Sending
  sendCurrentDraft(agent: Agent): Promise<EmailDraft>;

  // Email watching
  watchEmails(agent: Agent): void;
  checkForNewEmails(watch: EmailWatchSchema, agent: Agent): Promise<void>;
}
```

### EmailProvider

Provider interface implemented by concrete email integration packages.

```typescript
interface EmailProvider {
  description: string;

  // Optional lifecycle hook called when agent is created
  attach?(agent: Agent, creationContext: AgentCreationContext): void;

  // Inbox operations
  getInboxMessages(filter: EmailInboxFilterOptions, agent: Agent): Promise<EmailMessage[]>;
  searchMessages(filter: EmailSearchOptions, agent: Agent): Promise<EmailMessage[]>;
  getMessageById(id: string, agent: Agent): Promise<EmailMessage>;

  // Draft operations
  createDraft(data: DraftEmailData, agent: Agent): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData, agent: Agent): Promise<EmailDraft>;
  sendDraft(id: string, agent: Agent): Promise<void>;
}
```

**Note:** The `EmailProvider` interface does NOT include message selection or draft selection methods. Those are managed by `EmailService` and stored in agent state.

### Types

#### EmailAddress

```typescript
{
  email: string;      // Email address
  name?: string;      // Optional display name
}
```

#### EmailMessage

```typescript
{
  id: string;                    // Unique message identifier
  threadId?: string;             // Optional thread/conversation ID
  subject: string;               // Message subject
  from: EmailAddress;            // Sender information
  to: EmailAddress[];            // Primary recipients
  cc?: EmailAddress[];           // CC recipients
  bcc?: EmailAddress[];          // BCC recipients
  snippet?: string;              // Message preview/snippet
  textBody?: string;             // Plain text body
  htmlBody?: string;             // HTML body
  labels?: string[];             // Message labels/tags
  isRead: boolean;               // Read/unread status
  receivedAt: Date;              // When message was received
  sentAt?: Date;                 // When message was sent (if applicable)
}
```

#### EmailDraft

```typescript
{
  id: string;                    // Unique draft identifier
  threadId?: string;             // Optional thread/conversation ID
  subject: string;               // Draft subject
  to: EmailAddress[];            // Primary recipients
  cc?: EmailAddress[];           // CC recipients
  bcc?: EmailAddress[];          // BCC recipients
  textBody?: string;             // Plain text body
  htmlBody?: string;             // HTML body
  createdAt: Date;               // When draft was created
  updatedAt: Date;               // When draft was last updated
}
```

#### EmailInboxFilterOptions

```typescript
{
  limit?: number;        // Maximum number of messages to return
  unreadOnly?: boolean;  // Filter to unread messages only
}
```

#### EmailSearchOptions

```typescript
{
  query: string;         // Search query string
  limit?: number;        // Maximum number of results
  unreadOnly?: boolean;  // Filter to unread messages only
}
```

#### DraftEmailData

```typescript
Omit<EmailDraft, "id" | "createdAt" | "updatedAt">
```

#### UpdateDraftEmailData

```typescript
Partial<Omit<EmailDraft, "id" | "createdAt" | "updatedAt">>
```

## Services

### EmailService

Implements `TokenRingService` and is registered by the package plugin.

**Integration points:**
- `ChatService` for email tools registration
- `AgentCommandService` for `/email ...` commands registration
- `ScriptingService` for scripting function registration

## Provider Documentation

This package defines the provider interface but does not include a concrete provider itself. Extension packages are expected to:

1. Implement `EmailProvider` interface
2. Initialize provider-local state in `attach(...)` method
3. Register themselves through `EmailService.registerEmailProvider(...)`
4. Normalize provider-specific data into shared `EmailMessage` and `EmailDraft` shapes

### Provider Implementation Example

```typescript
import {EmailProvider, EmailMessage, EmailDraft} from "@tokenring-ai/email";
import {Agent, AgentCreationContext} from "@tokenring-ai/agent";

class GmailProvider implements EmailProvider {
  description = "Gmail API integration";

  async getInboxMessages(filter, agent) {
    // Implement Gmail API calls
    return messages;
  }

  async searchMessages(filter, agent) {
    // Implement Gmail search
    return results;
  }

  async getMessageById(id, agent) {
    // Fetch specific message
    return message;
  }

  async createDraft(data, agent) {
    // Create Gmail draft
    return draft;
  }

  async updateDraft(data, agent) {
    // Update Gmail draft
    return draft;
  }

  async sendDraft(id, agent) {
    // Send from Gmail draft
  }
}
```

## Chat Commands

### Provider Commands

#### `/email provider get`

Display the currently active email provider.

**Example:**
```
/email provider get
# Output: Current provider: gmail
```

#### `/email provider set <name>`

Set the active email provider by name.

**Example:**
```
/email provider set gmail
# Output: Active provider set to: gmail
```

#### `/email provider select`

Interactively select the active email provider. Auto-selects if only one provider is configured.

**Example:**
```
/email provider select
# Opens tree selection interface
```

#### `/email provider reset`

Reset the active email provider to the initial configured value.

**Example:**
```
/email provider reset
# Output: Provider reset to gmail
```

### Inbox and Search Commands

#### `/email inbox list [limit]`

List recent inbox messages from the active provider.

**Options:**
- `--limit <number>`: Optional limit for number of messages (default: 20)

**Example:**
```
/email inbox list
/email inbox list --limit 10
```

#### `/email search <query>`

Search messages from the active email provider.

**Example:**
```
/email search invoice
/email search "from:alex@example.com project"
```

### Message Commands

#### `/email message get`

Display the currently selected email message subject.

**Example:**
```
/email message get
# Output: Current message: Status update
```

#### `/email message select`

Interactively select an inbox message to inspect.

**Example:**
```
/email message select
# Opens tree selection interface with recent messages
```

#### `/email message info`

Display detailed information about the currently selected email message.

**Example:**
```
/email message info
# Output: Provider, subject, from, to, received, read status, etc.
```

#### `/email message set --id <id>`

Select an email message by its ID.

**Example:**
```
/email message set --id 12345
# Output: Selected message: "Subject line"
```

#### `/email message clear`

Clear the current email message selection.

**Example:**
```
/email message clear
# Output: Message cleared. No email message is currently selected.
```

### Draft Commands

#### `/email draft get`

Display the currently selected draft subject.

**Example:**
```
/email draft get
# Output: Current draft: Meeting notes
```

#### `/email draft clear`

Clear the current email draft selection.

**Example:**
```
/email draft clear
# Output: Draft cleared. No email draft is currently selected.
```

#### `/email draft send`

Send the currently selected email draft.

**Example:**
```
/email draft send
# Output: Sent email "Subject" to recipient names
```

## RPC Endpoints

This package does not define RPC endpoints. Email operations are accessed through the `EmailService` via agent service requests.

## Chat Tools

The package registers the following tools with `ChatService`:

### `email_getInboxMessages`

Retrieve recent messages from the current inbox.

**Input Schema:**
```typescript
{
  limit?: number;      // Maximum number of messages (default: 25)
  unreadOnly?: boolean; // Filter to unread messages only
}
```

**Returns:** Formatted table of messages with ID, From, Subject, Received, and Read status.

### `email_searchMessages`

Search email messages using the active email provider.

**Input Schema:**
```typescript
{
  query: string;       // Search query
  limit?: number;      // Maximum results (default: 25)
  unreadOnly?: boolean; // Filter to unread messages only
}
```

**Returns:** Formatted table of matching messages with ID, Subject, From, and Received.

### `email_selectMessage`

Select an email message by ID for further inspection.

**Input Schema:**
```typescript
{
  id: string;  // Message ID to select
}
```

**Returns:** Selected message details and JSON representation.

### `email_getCurrentMessage`

Retrieve the currently selected email message.

**Input Schema:** `{}`

**Returns:** Current message object or "No email message is currently selected."

### `email_createDraft`

Create a new email draft.

**Input Schema:**
```typescript
{
  subject: string;           // Email subject line
  to: [{email, name?}[];     // Primary recipients (at least 1)
  cc?: [{email, name?}][];   // CC recipients
  bcc?: [{email, name?}][];  // BCC recipients
  textBody?: string;         // Plain text body
  htmlBody?: string;         // HTML body
  threadId?: string;         // Optional thread association
}
```

**Returns:** Created draft object.

### `email_updateDraft`

Update the currently selected email draft.

**Input Schema:**
```typescript
{
  subject?: string;          // Updated subject
  to?: [{email, name?}][];   // Updated recipients
  cc?: [{email, name?}][];   // Updated CC
  bcc?: [{email, name?}][];  // Updated BCC
  textBody?: string;         // Updated plain text
  htmlBody?: string;         // Updated HTML
  threadId?: string;         // Thread association
}
```

**Returns:** Updated draft object.

### `email_getCurrentDraft`

Retrieve the currently selected email draft.

**Input Schema:** `{}`

**Returns:** Current draft object or "No email draft is currently selected."

### `email_sendCurrentDraft`

Send the currently selected email draft.

**Input Schema:** `{}`

**Returns:** Sent draft object.

## Scripting Functions

The package registers the following functions with `ScriptingService`:

### `getInboxMessages(limit?)`

Get inbox messages with optional limit.

**Parameters:**
- `limit?: string` - Optional limit as string

**Returns:** JSON string of messages array.

**Example:**
```typescript
const messages = JSON.parse(await scripting.getInboxMessages("10"));
```

### `searchEmailMessages(query, limit?)`

Search email messages.

**Parameters:**
- `query: string` - Search query
- `limit?: string` - Optional limit as string

**Returns:** JSON string of matching messages.

**Example:**
```typescript
const results = JSON.parse(await scripting.searchEmailMessages("invoice", "20"));
```

### `createEmailDraft(subject, bodyText, toCsv)`

Create an email draft.

**Parameters:**
- `subject: string` - Email subject
- `bodyText: string` - Email body text
- `toCsv: string` - Comma-separated recipient emails

**Returns:** String with draft ID.

**Example:**
```typescript
const result = await scripting.createEmailDraft(
  "Status Update",
  "Here is the update...",
  "alex@example.com,bob@example.com"
);
// Returns: "Created draft: draft-id-123"
```

### `sendCurrentEmailDraft()`

Send the current email draft.

**Parameters:** None

**Returns:** String with sent email ID.

**Example:**
```typescript
const result = await scripting.sendCurrentEmailDraft();
// Returns: "Sent email: sent-id-123"
```

## Configuration

The plugin is configured under the `email` key.

### Configuration Schema

```typescript
{
  email: {
    providers: Record<string, any>;  // Provider configurations
    pollInterval: number;             // Poll interval in seconds (default: 60)
    agentDefaults: {
      provider?: string;              // Default provider for agents
      watch?: {
        markAsRead: boolean;          // Mark processed emails as read (default: false)
        unreadOnly: boolean;          // Only consider unread emails (default: false)
        maxEmailsToConsider: number;  // Max emails to process (default: 50)
        actions: Array<{
          pattern: string;            // Regex pattern to match
          command: string;            // Command to execute on match
        }>;
      };
    };
  };
}
```

### Example Configuration

```typescript
{
  email: {
    providers: {
      gmail: {
        type: "gmail",
        description: "Primary inbox",
        account: "primary"
      }
    },
    pollInterval: 60,
    agentDefaults: {
      provider: "gmail",
      watch: {
        markAsRead: true,
        unreadOnly: true,
        maxEmailsToConsider: 50,
        actions: [
          {
            pattern: ".*invoice.*",
            command: "/process invoice"
          },
          {
            pattern: ".*urgent.*",
            command: "/alert priority"
          }
        ]
      }
    }
  }
}
```

**Relevant schemas:**
- `EmailConfigSchema` - Main plugin configuration
- `EmailAgentConfigSchema` - Per-agent configuration
- `EmailWatchSchema` - Email watching configuration

## State Management

### EmailState

Agent state slice for email operations.

**Properties:**
- `activeProvider?: string` - Currently selected provider name
- `currentEmail?: EmailMessage` - Currently selected message
- `currentDraft?: EmailDraft` - Currently selected draft
- `watch?: EmailWatchSchema` - Watch configuration for this agent
- `processedEmails: Set<string>` - Set of processed message IDs
- `isWatching: boolean` - Whether email watching is active

**Serialization:**
```typescript
serialize(): {
  activeProvider?: string;
  watch?: EmailWatchSchema;
  processedEmails?: string[];
  currentEmail?: EmailMessage;
  currentDraft?: EmailDraft;
}
```

**State Transfer:**
When creating child agents, the state is transferred with:
- `activeProvider` inherited if not set
- `currentEmail` inherited if not set
- `currentDraft` inherited if not set

## Integration

### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import EmailPlugin from "@tokenring-ai/email/plugin";

const app = new TokenRingApp();
app.usePlugin(EmailPlugin, {
  email: {
    agentDefaults: {
      provider: "gmail",
    },
    providers: {
      gmail: {
        type: "gmail",
        description: "Primary inbox",
        account: "primary",
      },
    },
  },
});
```

### Programmatic Usage

```typescript
import {EmailService} from "@tokenring-ai/email";

// Get service from agent
const emailService = agent.requireServiceByType(EmailService);

// List inbox
const inbox = await emailService.getInboxMessages({limit: 10}, agent);

// Search messages
const results = await emailService.searchMessages({query: "invoice"}, agent);

// Select a message
const message = await emailService.selectMessageById("msg-123", agent);

// Create a draft
const draft = await emailService.createDraft({
  subject: "Status update",
  to: [{email: "alex@example.com"}],
  textBody: "Here is the latest update.",
}, agent);

// Update the draft
await emailService.updateDraft({
  textBody: "Updated content...",
}, agent);

// Send the draft
const sent = await emailService.sendCurrentDraft(agent);
```

### Email Watching

Email watching automatically processes incoming messages based on configured patterns:

```typescript
{
  email: {
    agentDefaults: {
      provider: "gmail",
      watch: {
        markAsRead: true,
        unreadOnly: true,
        maxEmailsToConsider: 50,
        actions: [
          {
            pattern: ".*invoice.*from:accounts@example.com",
            command: "/process invoice --auto"
          }
        ]
      }
    }
  }
}
```

When a matching email arrives:
1. The message body is prepared with headers
2. Pattern matching is performed against each action
3. Matching actions trigger:
   - Message selection via `/message set --id <id>`
   - Command execution with the message as an attachment

## Usage Examples

### Chat Tool Workflows

1. **Review inbox:** Use `email_getInboxMessages` to inspect recent messages
2. **Search for specific content:** Use `email_searchMessages` to find relevant messages
3. **Select and inspect:** Use `email_selectMessage` to focus on a specific message
4. **Compose response:** Use `email_createDraft` to start a new draft
5. **Refine content:** Use `email_updateDraft` to modify the draft
6. **Send:** Use `email_sendCurrentDraft` to send the email

### Scripting Workflow

```typescript
// Get recent messages
const messages = JSON.parse(await scripting.getInboxMessages("10"));

// Search for invoices
const invoices = JSON.parse(await scripting.searchEmailMessages("invoice", "5"));

// Create and send a draft
await scripting.createEmailDraft(
  "Monthly Report",
  "Attached is the monthly report...",
  "team@example.com"
);
await scripting.sendCurrentEmailDraft();
```

### Background Email Processing

```typescript
// Enable email watching in agent config
agent.mutateState(EmailState, state => {
  state.watch = {
    markAsRead: true,
    unreadOnly: true,
    maxEmailsToConsider: 50,
    actions: [
      {
        pattern: ".*urgent.*",
        command: "/alert priority"
      }
    ]
  };
});

// Start watching (happens automatically when agent is created with watch config)
emailService.watchEmails(agent);
```

## Best Practices

1. **Provider State Management:** Keep provider-specific selection state inside the provider package, not in `EmailState`.

2. **Data Normalization:** Normalize provider-specific data into the shared `EmailMessage` and `EmailDraft` shapes defined in this package.

3. **Draft Workflows:** Use draft workflows instead of one-shot sending when an LLM may refine content before sending.

4. **Error Handling:** Always handle provider errors gracefully and provide meaningful feedback to users.

5. **Polling Interval:** Set appropriate poll intervals based on provider rate limits and use case urgency.

6. **Watch Patterns:** Use specific, well-tested regex patterns for email watching to avoid false positives.

7. **Message Selection:** Use message selection commands to focus context before performing operations on specific emails.

## Testing and Development

### Package Structure

```
pkg/email/
├── EmailProvider.ts       # Provider interface and types
├── EmailService.ts        # Main service implementation
├── index.ts               # Exports
├── plugin.ts              # Plugin registration
├── schema.ts              # Configuration schemas
├── state/
│   └── EmailState.ts      # Agent state slice
├── commands/
│   └── email/
│       ├── draft/
│       │   ├── clear.ts
│       │   ├── get.ts
│       │   └── send.ts
│       ├── inbox/
│       │   └── list.ts
│       ├── message/
│       │   ├── clear.ts
│       │   ├── get.ts
│       │   ├── info.ts
│       │   ├── select.ts
│       │   └── set.ts
│       ├── provider/
│       │   ├── get.ts
│       │   ├── reset.ts
│       │   ├── select.ts
│       │   └── set.ts
│       └── search.ts
├── commands.ts            # Command registry
├── tools/
│   ├── createDraft.ts
│   ├── getCurrentDraft.ts
│   ├── getCurrentMessage.ts
│   ├── getInboxMessages.ts
│   ├── searchMessages.ts
│   ├── selectMessage.ts
│   ├── sendCurrentDraft.ts
│   └── updateDraft.ts
├── tools.ts               # Tool registry
├── package.json
└── tsconfig.json
```

### Running Tests

```bash
bun run test          # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage
bun run build         # Type check without emitting
```

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent framework and service management
- `@tokenring-ai/app` (0.2.0) - Base application framework
- `@tokenring-ai/chat` (0.2.0) - Chat tools and commands
- `@tokenring-ai/scripting` (0.2.0) - Scripting function registration
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `zod` (^4.3.6) - Schema validation

### Dev Dependencies

- `typescript` (^6.0.2)
- `vitest` (^4.1.1)

## License

MIT License - see LICENSE file for details.

## Related Components

- `@tokenring-ai/google` - Gmail provider implementation
- `@tokenring-ai/chat` - Chat tools and commands framework
- `@tokenring-ai/agent` - Agent framework and state management
- `@tokenring-ai/scripting` - Scripting function registration
- `@tokenring-ai/app` - Plugin system and service management
