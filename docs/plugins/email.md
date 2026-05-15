# Email Plugin

## User Guide

### Overview

The Email plugin provides an abstract interface for managing email drafts and sending emails via multiple providers. It implements a provider-based architecture that allows Token Ring AI agents to interact with email inboxes, search messages, manage drafts, and send emails through chat tools, slash commands, scripting functions, and RPC endpoints.

This package serves as the foundation for email integrations, with concrete implementations (such as Gmail, Exchange, IMAP-backed services, or custom internal mail systems) extending the provider interface.

### Key Features

- **Provider-based Architecture**: Pluggable email providers with a unified interface
- **Inbox Management**: Read and list inbox messages from the active provider
- **Message Search**: Search messages by query across the inbox
- **Message Selection**: Select specific messages for follow-up work and inspection
- **Draft Management**: Create, update, and manage email drafts
- **Draft Sending**: Send the current draft through the active provider
- **Provider Management**: Select and manage email providers per agent
- **Email Watching**: Configure automated email monitoring with pattern-based action triggers
- **Type-Safe**: Full TypeScript support with Zod schemas for validation

### Chat Commands

The package registers 14 slash-prefixed commands organized into four categories:

#### Provider Commands

| Command | Description |
|---------|-------------|
| `/email provider get` | Display the currently active email provider |
| `/email provider set <name>` | Set the active email provider by name |
| `/email provider select` | Interactively select the active email provider |
| `/email provider reset` | Reset the active email provider to the initial configured value |

**Examples**:

```bash
# Get current provider
/email provider get
# Output: Current provider: gmail

# Set provider
/email provider set gmail
# Output: Active provider set to: gmail

# Interactive selection
/email provider select
# Opens interactive tree selection

# Reset to default
/email provider reset
# Output: Provider reset to gmail
```

#### Messages Commands

| Command | Description |
|---------|-------------|
| `/email messages list` | List recent messages from a selected email box |
| `/email search <query>` | Search messages from the active email provider |

**Examples**:

```bash
# List messages
/email messages list
/email messages list --box sent
/email messages list --limit 10 --page-token <token>

# Search messages
/email search invoice
/email search --box sent invoice
/email search "from:alex@example.com project"
```

**Options for `/email messages list`**:

- `--box <box>`: Email box to list from (default: "inbox")
- `--limit <number>`: Optional limit for number of messages (default: 20)
- `--page-token <token>`: Pagination token for retrieving next page

**Options for `/email search`**:

- `--box <box>`: Email box to search within (default: "inbox")

#### Message Commands

| Command | Description |
|---------|-------------|
| `/email message get` | Display the currently selected email message subject |
| `/email message select` | Interactively select an inbox message to inspect |
| `/email message set --id <id>` | Select an email message by its ID |
| `/email message info` | Display detailed information about the selected message |
| `/email message clear` | Clear the current email message selection |

**Examples**:

```bash
# Get current message
/email message get
# Output: Current message: Project Update

# Select message interactively
/email message select
/email message select --box sent

# Select by ID
/email message set --id 12345
# Output: Selected message: Project Update

# Get message info
/email message info
# Output: Provider, Subject, From, To, Received, Read, CC, Labels, Snippet

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

**Examples**:

```bash
# Get current draft
/email draft get
# Output: Current draft: Follow up

# Clear draft
/email draft clear
# Output: Draft cleared. No email draft is currently selected.

# Send draft
/email draft send
# Output: Sent email "Follow up" to alex@example.com
```

### Tools

The package registers 8 tools with the chat system:

| Tool | Description |
|------|-------------|
| `email_getMessages` | Retrieve messages from a selected email box |
| `email_searchMessages` | Search messages using the active email provider |
| `email_selectMessage` | Select a message by ID for further inspection |
| `email_getCurrentMessage` | Retrieve the currently selected email message |
| `email_createDraft` | Create a new email draft |
| `email_updateDraft` | Update the currently selected email draft |
| `email_getCurrentDraft` | Retrieve the currently selected email draft |
| `email_sendCurrentDraft` | Send the currently selected email draft |

#### Tool Details

**`email_getMessages`**

Retrieve messages from a selected email box.

- **Parameters**:
  - `box` (optional, string): Email box to read from (default: "inbox")
  - `limit` (optional, number): Maximum messages to return (default: 25)
  - `unreadOnly` (optional, boolean): Filter to unread messages only
  - `pageToken` (optional, string): Pagination token for next page
- **Returns**: Formatted table of messages with ID, From, Subject, Received, and Read status

**`email_searchMessages`**

Search messages using the active email provider.

- **Parameters**:
  - `query` (string): Search query to run against the inbox
  - `box` (optional, string): Email box to search within (default: "inbox")
  - `limit` (optional, number): Maximum results (default: 25)
  - `unreadOnly` (optional, boolean): Filter to unread only
- **Returns**: Formatted table of matching messages

**`email_selectMessage`**

Select a message by ID for further inspection.

- **Parameters**:
  - `id` (string): The unique identifier of the email message
- **Returns**: Selected message details with subject, from, received date, and JSON representation

**`email_getCurrentMessage`**

Retrieve the currently selected email message.

- **Parameters**: None
- **Returns**: Current message data as JSON or "No email message is currently selected"

**`email_createDraft`**

Create a new email draft.

- **Parameters**:
  - `subject` (string): Email subject line
  - `to` (array): Primary recipients (minimum 1), each with `email` and optional `name`
  - `cc` (optional, array): CC recipients
  - `bcc` (optional, array): BCC recipients
  - `textBody` (optional, string): Plain text email body
  - `htmlBody` (optional, string): HTML email body
  - `threadId` (optional, string): Optional thread to associate
- **Returns**: Created draft with ID

**`email_updateDraft`**

Update the currently selected email draft.

- **Parameters** (all optional):
  - `subject`: Updated email subject line
  - `to`: Primary recipients
  - `cc`: CC recipients
  - `bcc`: BCC recipients
  - `textBody`: Updated plain text body
  - `htmlBody`: Updated HTML body
  - `threadId`: Optional thread association
- **Returns**: Updated draft

**`email_getCurrentDraft`**

Retrieve the currently selected email draft.

- **Parameters**: None
- **Returns**: Current draft as JSON or "No email draft is currently selected"

**`email_sendCurrentDraft`**

Send the currently selected email draft.

- **Parameters**: None
- **Returns**: Sent email confirmation as JSON

### Configuration

The package is configured under the `email` key in the plugin configuration.

#### Configuration Schema

```yaml
email:
  # Providers configuration
  providers:
    gmail:
      type: "gmail"
      description: "Primary Gmail inbox"
      account: "primary"
    exchange:
      type: "exchange"
      description: "Corporate Exchange"
      server: "exchange.company.com"
  
  # Polling interval in seconds (default: 60, transformed to milliseconds)
  pollInterval: 60
  
  # Agent-level defaults
  agentDefaults:
    # Initial provider selection
    provider: "gmail"
    
    # Email watching configuration
    watch:
      markAsRead: false          # Mark watched emails as read (default: false)
      unreadOnly: true           # Only consider unread emails (default: false)
      maxEmailsToConsider: 25    # Max emails to process per check (default: 50)
      actions:
        invoicePattern:
          pattern: "invoice|receipt|payment"
          command: "/research find latest invoice from sender"
```

#### Environment Variables

No environment variables are defined by this package. Provider-specific packages may define their own environment variables.

#### Configuration Schemas

**`EmailWatchSchema`**: Watch configuration

- `markAsRead`: boolean (default: false)
- `unreadOnly`: boolean (default: false)
- `maxEmailsToConsider`: number (default: 50)
- `actions`: Array of `{ pattern: string, command: string }`

**`EmailAgentConfigSchema`**: Agent-level config

- `provider`: optional string
- `watch`: optional EmailWatchSchema

**`EmailConfigSchema`**: Full package config

- `pollInterval`: number (default: 60, transformed to milliseconds)
- `agentDefaults`: EmailAgentConfigSchema (prefaulted)

### Integration

#### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import EmailPlugin from "@tokenring-ai/email/plugin";

const app = new TokenRingApp();

app.usePlugin(EmailPlugin, {
  email: {
    providers: {
      gmail: {
        type: "gmail",
        description: "Primary Gmail inbox",
        account: "primary"
      }
    },
    agentDefaults: {
      provider: "gmail"
    }
  }
});
```

#### Programmatic Service Usage

```typescript
import { EmailService } from "@tokenring-ai/email";

// Get the service from an agent
const emailService = agent.requireServiceByType(EmailService);

// List inbox messages
const messages = await emailService.getMessages(
  { limit: 10, unreadOnly: true },
  agent
);

// Create a draft
const draft = await emailService.createDraft({
  subject: "Follow up",
  to: [{ email: "alex@example.com", name: "Alex" }],
  textBody: "Checking in on the proposal."
}, agent);

// Send the draft
await emailService.sendCurrentDraft(agent);

// Switch providers
emailService.setActiveProvider("exchange", agent);
```

#### Provider Registration

Concrete provider packages register implementations with the service:

```typescript
import EmailService from "@tokenring-ai/email/EmailService";

// In provider package
class GmailProvider implements EmailProvider {
  description = "Gmail integration";

  async listBoxes() {
    return [{ id: "inbox", name: "Inbox" }];
  }

  async getMessages(filter) {
    // Implementation
  }

  async searchMessages(filter) {
    // Implementation
  }

  async getMessageById(id) {
    // Implementation
  }

  async createDraft(data) {
    // Implementation
  }

  async updateDraft(data) {
    // Implementation
  }

  async sendDraft(id) {
    // Implementation
  }
}

// Register with the service
const emailService = app.requireService(EmailService);
emailService.registerEmailProvider("gmail", new GmailProvider());
```

### Best Practices

#### Provider Selection

- Always select a provider before performing email operations
- Use `/email provider select` for interactive selection
- Use `/email provider set <name>` for programmatic selection
- Check `getAvailableProviders()` before setting

#### Draft Management

- Create a draft before updating or sending
- Use `getCurrentDraft()` to check current state
- Clear drafts with `clearCurrentDraft()` when done

#### Message Handling

- Select messages before inspecting details
- Use `getMessageById()` for direct access
- Clear selections with `clearCurrentMessage()` when finished

#### Email Watching Configuration

- Configure watching carefully to avoid excessive processing
- Use regex patterns that are specific to your use case
- Monitor the `processedEmails` set to prevent duplicate processing
- Set appropriate `maxEmailsToConsider` limits

#### Error Handling

- Always handle `No email provider is currently selected` errors
- Check for available providers before operations
- Use try-catch blocks for provider-specific operations

---

## Developer Reference

### Core Components

#### EmailService

The main service class that orchestrates email operations across providers.

**Location**: `pkg/email/EmailService.ts`

**Implements**: `TokenRingService`

**Key Methods**:

```typescript
class EmailService implements TokenRingService {
  readonly name = "EmailService";
  description = "Abstract interface for email inbox and drafting operations";

  // Provider Management
  registerEmailProvider(name: string, provider: EmailProvider): void;
  getAvailableProviders(): string[];
  requireEmailProvider(name: string): EmailProvider;
  setActiveProvider(name: string, agent: Agent): void;

  // Inbox Operations
  getBoxes(agent: Agent): Promise<EmailBox[]>;
  getMessages(filter: EmailMessageQueryOptions, agent: Agent): Promise<EmailMessagePage>;
  searchMessages(filter: EmailSearchOptions, agent: Agent): Promise<EmailMessage[]>;
  getMessageById(id: string, agent: Agent): Promise<EmailMessage>;
  selectMessageById(id: string, agent: Agent): Promise<EmailMessage>;
  getCurrentMessage(agent: Agent): EmailMessage | undefined;
  clearCurrentMessage(agent: Agent): void;

  // Draft Operations
  createDraft(data: DraftEmailData, agent: Agent): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData, agent: Agent): Promise<EmailDraft>;
  getCurrentDraft(agent: Agent): EmailDraft | undefined;
  clearCurrentDraft(agent: Agent): void;
  sendCurrentDraft(agent: Agent): Promise<EmailDraft>;

  // Background Tasks
  watchEmails(agent: Agent): void;
  checkForNewEmails(watchConfig: EmailWatchSchema, agent: Agent): Promise<void>;
}
```

#### EmailProvider

The provider interface that concrete implementations must follow.

**Location**: `pkg/email/EmailProvider.ts`

```typescript
interface EmailProvider {
  description: string;

  listBoxes(): Promise<EmailBox[]>;
  getMessages(filter: EmailMessageQueryOptions): Promise<EmailMessagePage>;
  searchMessages(filter: EmailSearchOptions): Promise<EmailMessage[]>;
  getMessageById(id: string): Promise<EmailMessage>;
  createDraft(data: DraftEmailData): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData): Promise<EmailDraft>;
  sendDraft(id: string): Promise<void>;
}
```

### Services

#### EmailService Implementation

The EmailService is a `TokenRingService` implementation that:

1. **Manages Providers**: Uses a `KeyedRegistry` to register and retrieve email providers
2. **Maintains Agent State**: Each agent has its own state including:
   - Active provider selection
   - Current message selection
   - Current draft selection
   - Email watching configuration
   - Processed emails set (for watching)
3. **Orchestrates Operations**: Delegates all operations to the active provider
4. **Background Tasks**: Supports email watching with configurable polling

**State Management**:

```typescript
import { EmailState } from "@tokenring-ai/email/state/EmailState";

// Get current state
const state = agent.getState(EmailState);
console.log(state.activeProvider); // "gmail"
console.log(state.currentEmail);   // EmailMessage | undefined

// Update state
agent.mutateState(EmailState, state => {
  state.activeProvider = "exchange";
});
```

**State Lifecycle**:

1. **Initialization**: State is initialized from agent config during service attachment
2. **Inheritance**: Child agents inherit provider selection from parent agents
3. **Persistence**: State is serialized/deserialized for agent checkpointing
4. **Provider-agnostic**: Base state handles common state; providers manage their-specific state

### Provider Interfaces

#### EmailAddress

Email address with optional name.

```typescript
{
  email: string;
  name?: string;
}
```

#### EmailMessage

Normalized inbox message.

```typescript
{
  id: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  snippet?: string;
  textBody?: string;
  htmlBody?: string;
  labels?: string[];
  isRead: boolean;
  receivedAt: Date;
  sentAt?: Date;
}
```

#### EmailDraft

Editable draft structure.

```typescript
{
  id: string;
  threadId?: string;
  subject: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  textBody?: string;
  htmlBody?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### EmailBox

Email box/folder.

```typescript
{
  id: string;
  name: string;
}
```

#### EmailMessageQueryOptions

Message query filters.

```typescript
{
  box?: string;
  limit?: number;
  unreadOnly?: boolean;
  pageToken?: string;
}
```

#### EmailMessagePage

Paginated message results.

```typescript
{
  messages: EmailMessage[];
  nextPageToken?: string;
}
```

#### EmailSearchOptions

Search filters.

```typescript
{
  query: string;
  box?: string;
  limit?: number;
  unreadOnly?: boolean;
}
```

#### DraftEmailData

Draft creation payload.

```typescript
Omit<EmailDraft, "id" | "createdAt" | "updatedAt">
```

#### UpdateDraftEmailData

Draft update payload.

```typescript
Partial<DraftEmailData>
```

### RPC Endpoints

The package exposes 10 RPC methods at `/rpc/email`.

#### Query Methods

**`getEmailProviders`**

Get list of available email providers.

- **Input**: `{}`
- **Output**: `{ providers: string[] }`

**`getEmailBoxes`**

Get available boxes for a provider.

- **Input**: `{ provider: string }`
- **Output**: `{ boxes: EmailBox[] }`

**`getMessages`**

Get messages from a provider's box.

- **Input**: `{ provider: string, box?: string, limit?: number, unreadOnly?: boolean, pageToken?: string }`
- **Output**: `{ messages: EmailMessage[], count: number, nextPageToken?: string, message: string }`

**`searchMessages`**

Search messages in a provider.

- **Input**: `{ provider: string, query: string, box?: string, limit?: number, unreadOnly?: boolean }`
- **Output**: `{ messages: EmailMessage[], count: number, message: string }`

**`getMessageById`**

Get a specific message by ID.

- **Input**: `{ provider: string, id: string }`
- **Output**: `{ email: EmailMessage, message: string }`

**`getEmailState`**

Get current email state for an agent.

- **Input**: `{ agentId: string }`
- **Output**: `{ status: "success", selectedMessageId: string | null, selectedDraftId: string | null, selectedProvider: string | null, availableProviders: string[] }` or `AgentNotFoundSchema`

#### Mutation Methods

**`createDraft`**

Create a new email draft.

- **Input**: `{ agentId: string, subject: string, to: EmailAddress[], cc?: EmailAddress[], bcc?: EmailAddress[], textBody?: string, htmlBody?: string }`
- **Output**: `{ status: "success", draft: EmailDraft, message: string }` or `{ status: "agentNotFound" }`

**`updateDraft`**

Update the current draft.

- **Input**: `{ agentId: string, updatedData: Partial<DraftEmailData> }`
- **Output**: `{ status: "success", draft: EmailDraft, message: string }` or `{ status: "agentNotFound" }`

**`sendCurrentDraft`**

Send the current draft.

- **Input**: `{ agentId: string }`
- **Output**: `{ status: "success", draft: EmailDraft, message: string }` or `{ status: "agentNotFound" }`

**`updateEmailState`**

Update email state for an agent.

- **Input**: `{ agentId: string, selectedProvider?: string, selectedMessageId?: string }`
- **Output**: `{ status: "success", selectedMessageId: string | null, selectedDraftId: string | null, selectedProvider: string | null, availableProviders: string[] }` or `{ status: "agentNotFound" }`

### Usage Examples

#### Creating and Sending an Email

```typescript
import { EmailService } from "@tokenring-ai/email";

const emailService = agent.requireServiceByType(EmailService);

// Create a draft
const draft = await emailService.createDraft({
  subject: "Project Update",
  to: [{ email: "alex@example.com", name: "Alex" }],
  cc: [{ email: "bob@example.com" }],
  textBody: "Hi Alex,\n\nHere's the project update..."
}, agent);

// Update the draft
const updatedDraft = await emailService.updateDraft({
  subject: "Updated: Project Update"
}, agent);

// Send the draft
const sentEmail = await emailService.sendCurrentDraft(agent);
```

#### Searching and Processing Messages

```typescript
import { EmailService } from "@tokenring-ai/email";

const emailService = agent.requireServiceByType(EmailService);

// Search for messages
const results = await emailService.searchMessages({
  query: "invoice",
  box: "inbox",
  limit: 10
}, agent);

// Select a message
const message = await emailService.selectMessageById("msg_12345", agent);

// Get message details
const currentMessage = emailService.getCurrentMessage(agent);
```

#### Email Watching in Background Tasks

Configure automated email monitoring with pattern-based action triggers:

```yaml
email:
  agentDefaults:
    watch:
      markAsRead: true
      unreadOnly: true
      maxEmailsToConsider: 25
      actions:
        invoicePattern:
          pattern: "invoice|receipt|payment"
          command: "/research find latest invoice from sender"
        supportPattern:
          pattern: "support|help|issue"
          command: "/ticket create --priority high"
```

When a matching email is found:

1. The email message is selected using `/message set --id <id>`
2. The configured command is executed with the email body as an attachment
3. The email is marked as processed to prevent duplicate processing

### Testing

#### Running Tests

```bash
cd pkg/email
bun test
```

#### Watch Mode

```bash
bun test:watch
```

#### Coverage

```bash
bun test:coverage
```

#### Type Checking

```bash
bun build
```

### Dependencies

#### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/agent` | workspace:* | Agent orchestration |
| `@tokenring-ai/app` | workspace:* | Service management |
| `@tokenring-ai/chat` | workspace:* | Chat tools |
| `@tokenring-ai/rpc` | workspace:* | RPC endpoints |
| `@tokenring-ai/scripting` | workspace:* | Scripting functions |
| `@tokenring-ai/utility` | workspace:* | Utility functions |
| `zod` | ^4.3.6 | Schema validation |

#### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^6.0.2 | Type checking |
| `vitest` | ^4.1.1 | Testing |

### Related Components

- **`@tokenring-ai/agent`**: Core agent orchestration
- **`@tokenring-ai/chat`**: Chat tools and commands
- **`@tokenring-ai/scripting`**: Scripting function registry
- **`@tokenring-ai/rpc`**: RPC service
- **`@tokenring-ai/app`**: Application framework

## License

MIT License - see LICENSE file for details.
