# @tokenring-ai/email

Abstract email interface for Token Ring with provider-based inbox, search, draft, and send workflows.

## Overview

The `@tokenring-ai/email` package provides a provider-based email abstraction for Token Ring agents. It supplies a shared `EmailService`, a provider interface for concrete integrations, chat tools, slash commands, and scripting functions for common email workflows.

This package is intentionally abstract. Concrete integrations such as Gmail register providers into `EmailService`.

## Key Features

- Provider-based email architecture
- Inbox listing and message search
- Message selection for follow-up work
- Draft creation and draft updates
- Sending the current draft
- Slash commands and chat tools for interactive use
- Agent-scoped provider selection
- Scripting integration for automation

## Core Components

### `EmailService`

Main service for email operations.

Key responsibilities:

- register providers
- resolve the active provider for an agent
- proxy inbox, search, message, and draft operations
- manage provider selection in `EmailState`

Key methods:

- `registerEmailProvider(name, provider)`
- `getAvailableProviders()`
- `setActiveProvider(name, agent)`
- `getInboxMessages(filter, agent)`
- `searchMessages(filter, agent)`
- `selectMessageById(id, agent)`
- `getCurrentMessage(agent)`
- `clearCurrentMessage(agent)`
- `createDraft(data, agent)`
- `updateDraft(data, agent)`
- `getCurrentDraft(agent)`
- `clearCurrentDraft(agent)`
- `sendCurrentDraft(agent)`

### `EmailProvider`

Provider interface implemented by concrete packages.

```ts
interface EmailProvider {
  description: string;
  attach(agent: Agent, creationContext: AgentCreationContext): void;
  getInboxMessages(filter: EmailInboxFilterOptions, agent: Agent): Promise<EmailMessage[]>;
  searchMessages(filter: EmailSearchOptions, agent: Agent): Promise<EmailMessage[]>;
  selectMessageById(id: string, agent: Agent): Promise<EmailMessage>;
  getCurrentMessage(agent: Agent): EmailMessage | null;
  clearCurrentMessage(agent: Agent): Promise<void>;
  createDraft(data: DraftEmailData, agent: Agent): Promise<EmailDraft>;
  updateDraft(data: UpdateDraftEmailData, agent: Agent): Promise<EmailDraft>;
  getCurrentDraft(agent: Agent): EmailDraft | null;
  clearCurrentDraft(agent: Agent): Promise<void>;
  sendCurrentDraft(agent: Agent): Promise<SentEmail>;
}
```

### Types

- `EmailMessage`
- `EmailDraft`
- `SentEmail`
- `EmailInboxFilterOptions`
- `EmailSearchOptions`
- `DraftEmailData`
- `UpdateDraftEmailData`

## Services

### `EmailService`

Implements `TokenRingService` and is registered by the package plugin.

Integration points:

- `ChatService` for email tools
- `AgentCommandService` for `/email ...` commands
- `ScriptingService` for scripting functions

## Provider Documentation

This package defines the provider interface but does not include a concrete provider itself. Extension packages are expected to:

- implement `EmailProvider`
- initialize provider-local state in `attach(...)`
- register themselves through `EmailService.registerEmailProvider(...)`

## Chat Commands

Provider commands:

- `/email provider get`
- `/email provider set <name>`
- `/email provider select`
- `/email provider reset`

Inbox and search commands:

- `/email inbox list [limit]`
- `/email search <query>`

Message commands:

- `/email message get`
- `/email message select`
- `/email message info`
- `/email message clear`

Draft commands:

- `/email draft get`
- `/email draft clear`
- `/email draft send`

## Configuration

The plugin is configured under the `email` key.

```ts
{
  email: {
    agentDefaults: {
      provider: "gmail"
    },
    providers: {
      gmail: {
        type: "gmail",
        description: "Primary inbox",
        account: "primary"
      }
    }
  }
}
```

Relevant schemas:

- `EmailAgentConfigSchema`
- `EmailConfigSchema`

## Integration

Typical installation:

```ts
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

Programmatic usage:

```ts
import {EmailService} from "@tokenring-ai/email";

const emailService = agent.requireServiceByType(EmailService);
const inbox = await emailService.getInboxMessages({limit: 10}, agent);
const draft = await emailService.createDraft({
  subject: "Status update",
  to: [{email: "alex@example.com"}],
  textBody: "Here is the latest update.",
}, agent);
await emailService.sendCurrentDraft(agent);
```

## Usage Examples

Chat tool workflows:

- use `email_getInboxMessages` to inspect recent inbox state
- use `email_searchMessages` to find a relevant message
- use `email_selectMessage` to focus follow-up work
- use `email_createDraft` and `email_updateDraft` to compose
- use `email_sendCurrentDraft` to send

## Best Practices

- Keep provider-specific selection state inside the provider package, not in `EmailState`.
- Normalize provider data into the shared `EmailMessage` and `EmailDraft` shapes.
- Use draft workflows instead of one-shot sending when an LLM may refine content before send.

## Testing

The package uses `vitest` and provides `vitest.config.ts` for package-level tests.

Basic checks:

```bash
bun run build
bun run test
```

## Dependencies

Key dependencies:

- `@tokenring-ai/agent`
- `@tokenring-ai/app`
- `@tokenring-ai/chat`
- `@tokenring-ai/scripting`
- `@tokenring-ai/utility`
- `zod`

## Related Components

- `@tokenring-ai/google`
- `@tokenring-ai/chat`
- `@tokenring-ai/agent`
- `@tokenring-ai/scripting`
