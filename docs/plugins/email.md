# @tokenring-ai/email

Abstract email interface for Token Ring with provider-based inbox, search, draft, and send workflows.

## User Guide

### Overview

The `@tokenring-ai/email` package provides a provider-based email abstraction for Token Ring agents. It supplies a shared `EmailService`, a provider interface for concrete integrations, chat tools, slash commands, and scripting functions for common email workflows.

This package is intentionally abstract. Concrete integrations such as Gmail register providers into `EmailService`.

### Key Features

- **Provider-based email architecture**: Plug in any email provider implementation
- **Inbox listing and message search**: Retrieve and search email messages
- **Message selection for follow-up work**: Select and inspect specific messages
- **Draft creation and updates**: Compose and modify email drafts
- **Sending drafts**: Send currently selected email drafts
- **Email watching**: Automated processing of incoming emails based on patterns
- **Slash commands and chat tools**: Interactive use in chat interface
- **Agent-scoped provider selection**: Each agent can have its own active provider
- **Scripting integration**: Programmatic access for automation

### Chat Commands

#### Provider Commands

| Command | Description |
|---------|-------------|
| `/email provider get` | Display the currently active email provider |
| `/email provider set <name>` | Set the active email provider by name |
| `/email provider select` | Interactively select the active email provider |
| `/email provider reset` | Reset the active email provider to the initial configured value |

**Examples:**

```bash
# Get current provider
/email provider get
# Output: Current provider: gmail

# Set provider by name
/email provider set gmail
# Output: Active provider set to: gmail

# Interactively select provider
/email provider select
# Opens tree selection interface

# Reset to initial provider
/email provider reset
# Output: Provider reset to gmail
```

#### Messages Commands

| Command | Description |
|---------|-------------|
| `/email messages list` | List messages from a selected email box |
| `/email search <query>` | Search messages from the active email provider |

**Examples:**

```bash
# List messages in inbox (default)
/email messages list

# List messages with options
/email messages list --box sent --limit 10 --page-token <token>

# Search for messages
/email search invoice
/email search --box sent invoice
/email search "from:alex@example.com project"
```

#### Message Commands

| Command | Description |
|---------|-------------|
| `/email message get` | Display the currently selected email message subject |
| `/email message select` | Interactively select an inbox message to inspect |
| `/email message set --id <id>` | Select an email message by its ID |
| `/email message info` | Display detailed information about the currently selected email message |
| `/email message clear` | Clear the current email message selection |

**Examples:**

```bash
# Get current message
/email message get
# Output: Current message: Status update

# Select message interactively
/email message select
# Opens tree selection interface with recent messages

# Select message by ID
/email message set --id 12345
# Output: Selected message: "Subject line"

# Get message details
/email message info
# Output: Provider, subject, from, to, received, read status, etc.

# Clear selection
/email message clear
# Output: Message cleared. No email message is currently selected.
```

#### Draft Commands

| Command | Description |
|---------|-------------|
| `/email draft get` | Display the currently selected draft subject |
| `/email draft clear` | Clear the current email draft selection |
| `/email draft send` | Send the currently selected email draft |

**Examples:**

```bash
# Get current draft
/email draft get
# Output: Current draft: Meeting notes

# Clear draft selection
/email draft clear
# Output: Draft cleared. No email draft is currently selected.

# Send draft
/email draft send
# Output: Sent email "Subject" to recipient names
```

### Tools

The package registers the following tools with `ChatService`:

| Tool | Description |
|------|-------------|
| `email_getMessages` | Retrieve messages from a selected email box |
| `email_searchMessages` | Search email messages using the active email provider |
| `email_selectMessage` | Select an email message by ID for further inspection |
| `email_getCurrentMessage` | Retrieve the currently selected email message |
| `email_createDraft` | Create a new email draft |
| `email_updateDraft` | Update the currently selected email draft |
| `email_getCurrentDraft` | Retrieve the currently selected email draft |
| `email_sendCurrentDraft` | Send the currently selected email draft |

### Configuration

The plugin is configured under the `email` key.

#### Configuration Schema

```yaml
email:
  pollInterval: 60  # Poll interval in seconds (default: 60)
  agentDefaults:
    provider: gmail  # Default provider for agents
    watch:
      markAsRead: true  # Mark processed emails as read (default: false)
      unreadOnly: true  # Only consider unread emails (default: false)
      maxEmailsToConsider: 50  # Max emails to process (default: 50)
      actions:
        - pattern: ".*invoice.*"
          command: "/process invoice"
        - pattern: ".*urgent.*"
          command: "/alert priority"
```

#### Environment Variables

No environment variables are defined by this package. Provider-specific packages may define their own environment variables.

#### Example Configuration

```yaml
email:
  providers:
    gmail:
      type: gmail
      description: Primary inbox
      account: primary
  pollInterval: 60
  agentDefaults:
    provider: gmail
    watch:
      markAsRead: true
      unreadOnly: true
      maxEmailsToConsider: 50
      actions:
        - pattern: ".*invoice.*"
          command: "/process invoice"
        - pattern: ".*urgent.*"
          command: "/alert priority"
```

**Relevant schemas:**

- `EmailConfigSchema` - Main plugin configuration
- `EmailAgentConfigSchema` - Per-agent configuration
- `EmailWatchSchema` - Email watching configuration

### Integration

#### Plugin Installation

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

#### Programmatic Usage

```typescript
import {EmailService} from "@tokenring-ai/email";

// Get service from agent
const emailService = agent.requireServiceByType(EmailService);

// List messages
const messages = await emailService.getMessages({box: "inbox", limit: 10}, agent);

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

#### Email Watching

Email watching automatically processes incoming messages based on configured patterns:

```yaml
email:
  agentDefaults:
    provider: gmail
    watch:
      markAsRead: true
      unreadOnly: true
      maxEmailsToConsider: 50
      actions:
        - pattern: ".*urgent.*"
          command: "/alert priority"
```

When a matching email arrives:

1. The message body is prepared with headers
2. Pattern matching is performed against each action
3. Matching actions trigger:
   - Message selection via `/message set --id <id>`
   - Command execution with the message as an attachment

### Best Practices

1. **Provider State Management**: Keep provider-specific selection state inside the provider package, not in `EmailState`.

2. **Data Normalization**: Normalize provider-specific data into the shared `EmailMessage` and `EmailDraft` shapes defined in this package.

3. **Draft Workflows**: Use draft workflows instead of one-shot sending when an LLM may refine content before sending.

4. **Error Handling**: Always handle provider errors gracefully and provide meaningful feedback to users.

5. **Polling Interval**: Set appropriate poll intervals based on provider rate limits and use case urgency.

6. **Watch Patterns**: Use specific, well-tested regex patterns for email watching to avoid false positives.

7. **Message Selection**: Use message selection commands to focus context before performing operations on specific emails.

## Developer Reference

### Core Components

#### EmailService (Core)

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
  requireEmailProvider: (name: string) => EmailProvider;

  // Provider selection
  setActiveProvider(name: string, agent: Agent): void;
  requireActiveEmailProvider(agent: Agent): EmailProvider;

  // Box operations
  getBoxes(agent: Agent): Promise<EmailBox[]>;

  // Message operations
  getMessages(filter: EmailMessageQueryOptions, agent: Agent): Promise<EmailMessagePage>;
  searchMessages(filter: EmailSearchOptions, agent: Agent): Promise<EmailMessage[]>;
  getMessageById(id: string, agent: Agent): Promise<EmailMessage>;

  // Message selection
  selectMessageById(id: string, agent: Agent): Promise<EmailMessage>;
  getCurrentMessage(agent: Agent): EmailMessage | undefined;
  clearCurrentMessage(agent: Agent): void;

  // Draft operations
  createDraft(data: DraftEmailData, agent: Agent): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData, agent: Agent): Promise<EmailDraft>;
  getCurrentDraft(agent: Agent): EmailDraft | undefined;
  clearCurrentDraft(agent: Agent): void;

  // Sending
  sendCurrentDraft(agent: Agent): Promise<EmailDraft>;

  // Email watching
  watchEmails(agent: Agent): void;
  checkForNewEmails(watch: EmailWatchSchema, agent: Agent): Promise<void>;
}
```

#### EmailProvider

Provider interface implemented by concrete email integration packages.

```typescript
interface EmailProvider {
  description: string;

  // Inbox operations
  listBoxes(): Promise<EmailBox[]>;
  getMessages(filter: EmailMessageQueryOptions): Promise<EmailMessagePage>;
  searchMessages(filter: EmailSearchOptions): Promise<EmailMessage[]>;
  getMessageById(id: string): Promise<EmailMessage>;

  // Draft operations
  createDraft(data: DraftEmailData): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData): Promise<EmailDraft>;
  sendDraft(id: string): Promise<void>;
}
```

**Note:** The `EmailProvider` interface does NOT include message selection or draft selection methods. Those are managed by `EmailService` and stored in agent state.

### Services

#### EmailService (Registration)

Implements `TokenRingService` and is registered by the package plugin.

**Integration points:**

- `ChatService` for email tools registration
- `AgentCommandService` for `/email ...` commands registration
- `ScriptingService` for scripting function registration

### Provider Documentation

This package defines the provider interface but does not include a concrete provider itself. Extension packages are expected to:

1. Implement `EmailProvider` interface
2. Initialize provider-local state in `attach()` method
3. Register themselves through `EmailService.registerEmailProvider()`
4. Normalize provider-specific data into shared `EmailMessage` and `EmailDraft` shapes

#### Provider Implementation Example

```typescript
import {EmailProvider, EmailMessage, EmailDraft} from "@tokenring-ai/email";
import {Agent, AgentCreationContext} from "@tokenring-ai/agent";

class GmailProvider implements EmailProvider {
  description = "Gmail API integration";

  async listBoxes() {
    // Implement Gmail API calls to list boxes/folders
    return boxes;
  }

  async getMessages(filter) {
    // Implement Gmail API calls to get messages
    return {messages, nextPageToken};
  }

  async searchMessages(filter) {
    // Implement Gmail search
    return results;
  }

  async getMessageById(id) {
    // Fetch specific message
    return message;
  }

  async createDraft(data) {
    // Create Gmail draft
    return draft;
  }

  async updateDraft(data) {
    // Update Gmail draft
    return draft;
  }

  async sendDraft(id) {
    // Send from Gmail draft
  }
}
```

### RPC Endpoints

This package defines RPC endpoints for programmatic access to email operations.

**Endpoint path:** `/rpc/email`

#### Methods

##### `getEmailProviders`

Get list of available email providers.

**Input:**

```typescript
{
  // No input parameters
}
```

**Output:**

```typescript
{
  providers: string[];  // List of available provider names
}
```

##### `getEmailBoxes`

Get available email boxes/folders for a provider.

**Input:**

```typescript
{
  provider: string;  // Provider name
}
```

**Output:**

```typescript
{
  boxes: EmailBox[];  // List of available boxes
}
```

##### `getMessages`

Get messages from a specific box.

**Input:**

```typescript
{
  provider: string;  // Provider name
  box?: string;  // Box name (default: "inbox")
  limit?: number;  // Maximum number of messages
  unreadOnly?: boolean;  // Filter to unread messages only
  pageToken?: string;  // Pagination token
}
```

**Output:**

```typescript
{
  messages: EmailMessage[];  // List of messages
  count: number;  // Number of messages returned
  nextPageToken?: string;  // Token for next page
  message: string;  // Status message
}
```

##### `searchMessages`

Search messages in a specific box.

**Input:**

```typescript
{
  provider: string;  // Provider name
  query: string;  // Search query
  box?: string;  // Box to search (default: "inbox")
  limit?: number;  // Maximum results
  unreadOnly?: boolean;  // Filter to unread messages only
}
```

**Output:**

```typescript
{
  messages: EmailMessage[];  // List of matching messages
  count: number;  // Number of results
  message: string;  // Status message
}
```

##### `getMessageById`

Get a specific message by ID.

**Input:**

```typescript
{
  provider: string;  // Provider name
  id: string;  // Message ID
}
```

**Output:**

```typescript
{
  email: EmailMessage;  // The message
  message: string;  // Status message
}
```

##### `createDraft`

Create a new email draft.

**Input:**

```typescript
{
  agentId: string;  // Agent ID
  subject: string;  // Email subject
  to: EmailAddress[];  // Primary recipients
  cc?: EmailAddress[];  // CC recipients
  bcc?: EmailAddress[];  // BCC recipients
  textBody?: string;  // Plain text body
  htmlBody?: string;  // HTML body
}
```

**Output:**

```typescript
{
  status: "success";
  draft: EmailDraft;  // Created draft
  message: string;  // Status message
}
```

##### `updateDraft`

Update the current draft.

**Input:**

```typescript
{
  agentId: string;  // Agent ID
  updatedData: Partial<Omit<EmailDraft, "id" | "createdAt" | "updatedAt">>;
}
```

**Output:**

```typescript
{
  status: "success";
  draft: EmailDraft;  // Updated draft
  message: string;  // Status message
}
```

##### `sendCurrentDraft`

Send the current draft.

**Input:**

```typescript
{
  agentId: string;  // Agent ID
}
```

**Output:**

```typescript
{
  status: "success";
  draft: EmailDraft;  // Sent draft
  message: string;  // Status message
}
```

##### `getEmailState`

Get the current email state for an agent.

**Input:**

```typescript
{
  agentId: string;  // Agent ID
}
```

**Output:**

```typescript
{
  status: "success";
  selectedMessageId: string | null;
  selectedDraftId: string | null;
  selectedProvider: string | null;
  availableProviders: string[];
}
```

##### `updateEmailState`

Update the email state for an agent.

**Input:**

```typescript
{
  agentId: string;  // Agent ID
  selectedProvider?: string;  // New provider
  selectedMessageId?: string;  // New message selection
}
```

**Output:**

```typescript
{
  status: "success";
  selectedMessageId: string | null;
  selectedDraftId: string | null;
  selectedProvider: string | null;
  availableProviders: string[];
}
```

### Usage Examples

#### Chat Tool Workflows

1. **Review inbox:** Use `email_getMessages` to inspect recent messages
2. **Search for specific content:** Use `email_searchMessages` to find relevant messages
3. **Select and inspect:** Use `email_selectMessage` to focus on a specific message
4. **Compose response:** Use `email_createDraft` to start a new draft
5. **Refine content:** Use `email_updateDraft` to modify the draft
6. **Send:** Use `email_sendCurrentDraft` to send the email

#### Scripting Workflow

The package registers the following functions with `ScriptingService`:

| Function | Parameters | Description |
|----------|------------|-------------|
| `getEmailBoxes` | none | Get available email boxes |
| `getMessages` | box?, limit?, pageToken?, unreadOnly? | Get messages from a box |
| `searchEmailMessages` | query, box?, limit?, unreadOnly? | Search messages |
| `createEmailDraft` | subject, bodyText, toCsv | Create a new draft |
| `sendCurrentEmailDraft` | none | Send current draft |

**Examples:**

```typescript
// Get available boxes
const boxes = JSON.parse(await scripting.getEmailBoxes());

// Get messages
const messages = JSON.parse(await scripting.getMessages("inbox", "10", undefined, "true"));

// Search messages
const results = JSON.parse(await scripting.searchEmailMessages("invoice", "sent", "20"));

// Create and send a draft
await scripting.createEmailDraft(
  "Monthly Report",
  "Attached is the monthly report...",
  "team@example.com"
);
await scripting.sendCurrentEmailDraft();
```

#### Background Email Processing

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

### Testing and Development

#### Package Structure

```text
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
│       ├── message/
│       │   ├── clear.ts
│       │   ├── get.ts
│       │   ├── info.ts
│       │   ├── select.ts
│       │   └── set.ts
│       ├── messages/
│       │   └── list.ts
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
│   ├── getMessages.ts
│   ├── searchMessages.ts
│   ├── selectMessage.ts
│   ├── sendCurrentDraft.ts
│   └── updateDraft.ts
├── tools.ts               # Tool registry
├── rpc/
│   ├── email.ts           # RPC endpoint implementation
│   └── schema.ts          # RPC schema definitions
├── package.json
└── vitest.config.ts
```

#### Running Tests

```bash
bun run test          # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage
bun run build         # Type check without emitting
```

### Dependencies

#### Runtime Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent framework and service management
- `@tokenring-ai/app` (0.2.0) - Base application framework
- `@tokenring-ai/chat` (0.2.0) - Chat tools and commands
- `@tokenring-ai/rpc` (0.2.0) - RPC service framework
- `@tokenring-ai/scripting` (0.2.0) - Scripting function registration
- `@tokenring-ai/utility` (0.2.0) - Shared utilities
- `zod` (^4.3.6) - Schema validation

#### Dev Dependencies

- `typescript` (^6.0.2)
- `vitest` (^4.1.1)

### Related Components

- `@tokenring-ai/google` - Gmail provider implementation
- `@tokenring-ai/chat` - Chat tools and commands framework
- `@tokenring-ai/agent` - Agent framework and state management
- `@tokenring-ai/scripting` - Scripting function registration
- `@tokenring-ai/rpc` - RPC service framework
- `@tokenring-ai/app` - Plugin system and service management

## License

MIT License - see LICENSE file for details.
