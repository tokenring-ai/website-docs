# @tokenring-ai/google

Google OAuth service and provider integrations for Gmail, Google Calendar, and Google Drive.

## Overview

The `@tokenring-ai/google` package provides a shared `GoogleService` for Google OAuth token handling and authenticated Google API access, plus concrete provider implementations for other abstract Token Ring packages.

Current provider integrations:

- Gmail for `@tokenring-ai/email`
- Google Calendar for `@tokenring-ai/calendar`
- Google Drive for `@tokenring-ai/filesystem`

The package follows the repository's provider-extension pattern: it integrates with existing abstract services rather than replacing them.

## Key Features

- **Google OAuth Account Configuration**: Centralized management of multiple Google accounts
- **Authorization URL Generation**: Create OAuth authorization URLs with configurable scopes and options
- **Authorization Code Exchange**: Exchange OAuth codes for access and refresh tokens
- **Token Management**: Automatic refresh token and access token handling with expiry tracking
- **Authenticated API Access**: Helper methods for making authenticated requests to Google APIs
- **Gmail Provider**: Full email provider implementation for Gmail with inbox, search, and draft capabilities
- **Google Calendar Provider**: Calendar provider implementation with event listing, search, and CRUD operations
- **Google Drive Provider**: Filesystem provider implementation for Google Drive with file and folder operations
- **Plugin-Based Registration**: Automatic provider registration into existing Token Ring services

## Chat Commands

| Command | Description |
|---------|-------------|
| `/google account list` | List all available Google accounts |
| `/google account get <name>` | Show details for a specific Google account |
| `/google account auth <name>` | Authenticate a Google account via OAuth |

### Command Details

#### `/google account list`

Lists all configured Google accounts with their authentication status and enabled integrations.

**Example:**

```text
/google account list
```

**Output:**

```text
Available Google accounts:
- primary: user@example.com [authenticated, profile (user@example.com), gmail, calendar, drive]
```

#### `/google account get <name>`

Displays detailed information about a specific Google account.

**Example:**

```text
/google account get primary
```

**Output:**

```text
Account: primary (user@example.com)
User Profile Email: user@example.com
Authenticated: yes
```

#### `/google account auth <name>`

Authenticates a Google account using OAuth flow. Opens a URL for sign-in and waits for the callback.

**Example:**

```text
/google account auth primary
```

This command:

1. Generates an OAuth authorization URL
2. Displays the URL for you to sign in to Google
3. Listens for the OAuth callback
4. Exchanges the authorization code for tokens
5. Stores the tokens in the vault

## User Guide

### Core Components

#### GoogleService

Main service for Google OAuth and authenticated HTTP requests.

**Implements:** `TokenRingService`

**Methods:**

```typescript
class GoogleService implements TokenRingService {
  readonly name: string;
  readonly description: string;

  constructor(app: TokenRingApp, options: GoogleConfig);

  getAvailableAccounts(): string[];

  getAccountStatus(accountName: string): {
    isAuthenticated: boolean;
    profile: UserInfo | undefined;
    account: GoogleAccount;
  };

  requireAccount(accountName: string): GoogleAccount;

  requireAuthorizedAccount(accountName: string): {
    isAuthenticated: boolean;
    profile: UserInfo | undefined;
    account: GoogleAccount;
  };

  createAuthorizationUrl(
    accountName: string,
    redirectUri: string,
    options?: {
      state?: string;
      scopes?: string[];
      accessType?: "offline" | "online";
      prompt?: "consent" | "none" | "select_account";
      loginHint?: string;
    }
  ): string;

  beginAuthorization(
    accountName: string,
    redirectUri: string
  ): {
    authorizationUrl: string;
    waitForCallback: Promise<string>;
  };

  completePendingAuthorization(callbackUrl: string): void;

  exchangeAuthorizationCode(
    name: string,
    code: string,
    redirectUri: string
  ): Promise<{
    isAuthenticated: boolean;
    profile: UserInfo | undefined;
    account: GoogleAccount;
  }>;

  withGmail<T>(
    accountName: string,
    request: GoogleRequestOptions,
    operation: (gmail: gmail_v1.Gmail) => Promise<T>
  ): Promise<T>;

  withCalendar<T>(
    accountName: string,
    request: GoogleRequestOptions,
    operation: (calendar: calendar_v3.Calendar) => Promise<T>
  ): Promise<T>;

  withDrive<T>(
    accountName: string,
    request: GoogleRequestOptions,
    operation: (drive: drive_v3.Drive) => Promise<T>
  ): Promise<T>;
}
```

**Method Details:**

- `getAvailableAccounts()`: Returns list of configured account names
- `getAccountStatus(accountName)`: Returns authentication status, profile, and account configuration
- `requireAccount(accountName)`: Returns the account configuration, throws if not found
- `requireAuthorizedAccount(accountName)`: Returns account status, throws if not authenticated
- `createAuthorizationUrl(accountName, redirectUri, options)`: Generates OAuth authorization URL
- `beginAuthorization(accountName, redirectUri)`: Begins OAuth flow, returns URL and promise for callback
- `completePendingAuthorization(callbackUrl)`: Processes the OAuth callback URL
- `exchangeAuthorizationCode(name, code, redirectUri)`: Exchanges OAuth code for tokens
- `withGmail(accountName, request, operation)`: Makes authenticated Gmail API requests
- `withCalendar(accountName, request, operation)`: Makes authenticated Calendar API requests
- `withDrive(accountName, request, operation)`: Makes authenticated Drive API requests

#### GmailEmailProvider

Concrete `EmailProvider` implementation for Gmail.

**Implements:** `EmailProvider`

**Capabilities:**

- List inbox messages with filtering (unread/read)
- Search messages with query and filtering
- Retrieve specific message by ID
- Create and update drafts
- Send the current draft
- List email boxes (Inbox, Sent, Drafts, Spam, Trash)

**Methods:**

```typescript
class GmailEmailProvider implements EmailProvider {
  readonly description: string;

  constructor(
    options: GmailEmailProviderOptions,
    googleService: GoogleService
  );

  listBoxes(): Promise<EmailBox[]>;

  getMessages(filter: EmailMessageQueryOptions): Promise<EmailMessagePage>;

  searchMessages(filter: EmailSearchOptions): Promise<EmailMessage[]>;

  getMessageById(id: string): Promise<EmailMessage>;

  createDraft(data: DraftEmailData): Promise<EmailDraft>;

  updateDraft(data: EmailDraft): Promise<EmailDraft>;

  sendDraft(id: string): Promise<void>;
}
```

**Supported Operations:**

- `listBoxes()`: Lists available email boxes (Inbox, Sent, Drafts, Spam, Trash)
- `getMessages(filter)`: Lists messages from inbox with optional unread filter
- `searchMessages(filter)`: Searches messages with query string and optional unread filter
- `getMessageById(id)`: Fetches full message content by ID
- `createDraft(data)`: Creates a new draft with to, cc, bcc, subject, and body
- `updateDraft(data)`: Updates an existing draft
- `sendDraft(id)`: Sends the draft by ID

#### GoogleCalendarProvider

Concrete `CalendarProvider` implementation for Google Calendar.

**Implements:** `CalendarProvider`

**Capabilities:**

- List upcoming events with time range filtering
- Search events with query and time range
- Retrieve specific event by ID
- Create events
- Update events
- Delete events

**Methods:**

```typescript
class GoogleCalendarProvider implements CalendarProvider {
  readonly description: string;

  constructor(
    options: GoogleCalendarProviderOptions,
    googleService: GoogleService
  );

  getUpcomingEvents(filter: CalendarEventFilterOptions): Promise<CalendarEvent[]>;

  searchEvents(filter: CalendarEventSearchOptions): Promise<CalendarEvent[]>;

  createEvent(data: CreateCalendarEventData): Promise<CalendarEvent>;

  updateEvent(id: string, data: UpdateCalendarEventData): Promise<CalendarEvent>;

  getEventById(id: string): Promise<CalendarEvent>;

  deleteEvent(id: string): Promise<void>;
}
```

**Supported Operations:**

- `getUpcomingEvents(filter)`: Lists upcoming events from the calendar with time range and limit
- `searchEvents(filter)`: Searches events by query string within time range
- `createEvent(data)`: Creates a new event with title, description, location, attendees, and timing
- `updateEvent(id, data)`: Updates an existing event by ID
- `getEventById(id)`: Fetches a specific event by ID
- `deleteEvent(id)`: Deletes an event by ID

#### GoogleDriveFileSystemProvider

Concrete `FileSystemProvider` implementation for Google Drive.

**Implements:** `FileSystemProvider`

**Capabilities:**

- List directories with tree generation
- Read files
- Write and append files
- Rename and move files
- Copy files
- Create folders
- Delete files
- Stat and existence checks

**Methods:**

```typescript
class GoogleDriveFileSystemProvider implements FileSystemProvider {
  readonly name: string;
  readonly description: string;

  constructor(
    options: GoogleDriveFileSystemProviderOptions,
    googleService: GoogleService
  );

  writeFile(filePath: string, content: string | Buffer): Promise<boolean>;

  appendFile(filePath: string, content: string | Buffer): Promise<boolean>;

  deleteFile(filePath: string): Promise<boolean>;

  readFile(filePath: string): Promise<Buffer | null>;

  rename(oldPath: string, newPath: string): Promise<boolean>;

  exists(filePath: string): Promise<boolean>;

  stat(filePath: string): Promise<StatLike>;

  createDirectory(dirPath: string, options?: { recursive?: boolean }): Promise<boolean>;

  copy(source: string, destination: string, options?: { overwrite?: boolean }): Promise<boolean>;

  getDirectoryTree(path: string, params?: DirectoryTreeOptions): AsyncGenerator<string>;
}
```

**Unsupported filesystem operations:**

The following methods throw errors because the Drive API does not provide equivalent behavior to local filesystem providers:

- `glob()` - Pattern-based file matching not supported
- `watch()` - File system watching not supported
- `grep()` - Content search across files not supported

## Configuration

The package is configured under the `google` key, and optionally under the abstract package keys it extends.

### Google Configuration Schema

```yaml
google:
  clientId: "your-client-id.apps.googleusercontent.com"
  clientSecret: "your-client-secret"
  agentDefaults:
    account: "primary"
  accounts:
    primary:
      email: "user@example.com"
      gmail:
        description: "Gmail"
      calendar:
        description: "Google Calendar"
        calendarId: "primary"
      drive:
        description: "Google Drive filesystem"
        rootFolderId: "root"
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes* |

\* Can also be provided in configuration

### Configuration Options

#### GoogleConfig

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | `string` | Google OAuth client ID |
| `clientSecret` | `string` | Google OAuth client secret |
| `accounts` | `Record<string, GoogleAccount>` | Configured Google accounts |
| `agentDefaults` | `GoogleAgentOptions` | Default options for agents |

#### GoogleAccount

| Field | Type | Description |
|-------|------|-------------|
| `email` | `string` | User email address |
| `gmail` | `GoogleAccountGmail` | Gmail configuration |
| `calendar` | `GoogleAccountCalendar` | Calendar configuration |
| `drive` | `GoogleAccountDrive` | Drive configuration |

#### GoogleAccountGmail

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `description` | `string` | Description of this Gmail account | "Gmail" |

#### GoogleAccountCalendar

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `description` | `string` | Description of this calendar | "Google Calendar" |
| `calendarId` | `string` | Calendar ID to use | "primary" |

#### GoogleAccountDrive

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `description` | `string` | Description of this Drive | "Google Drive filesystem" |
| `rootFolderId` | `string` | Root folder ID | "root" |

### Schemas

- `GoogleConfigSchema`
  - `clientId?: string`
  - `clientSecret?: string`
  - `accounts: Record<string, GoogleAccount>`
  - `agentDefaults?: GoogleAgentOptions`
- `GoogleAccountSchema`
  - `email: string`
  - `gmail: GoogleAccountGmail`
  - `calendar: GoogleAccountCalendar`
  - `drive: GoogleAccountDrive`
- `GoogleAccountGmailSchema`
  - `description: string` (default: "Gmail")
- `GoogleAccountCalendarSchema`
  - `description: string` (default: "Google Calendar")
  - `calendarId: string` (default: "primary")
- `GoogleAccountDriveSchema`
  - `description: string` (default: "Google Drive filesystem")
  - `rootFolderId: string` (default: "root")
- `GoogleStoredTokenSchema`
  - `refreshToken?: string`
  - `accessToken?: string`
  - `expiryDate?: number`
  - `grantedScopes?: string[]`
  - `profile?: UserInfo`
- `GmailEmailProviderOptionsSchema`
  - `description: string`
  - `account: string`
- `GoogleCalendarProviderOptionsSchema`
  - `description: string`
  - `account: string`
  - `calendarId: string` (default: "primary")
- `GoogleDriveFileSystemProviderOptionsSchema`
  - `description: string` (default: "Google Drive filesystem")
  - `account: string`
  - `rootFolderId: string` (default: "root")

## Integration

The plugin integrates with abstract Token Ring services rather than registering new tools or commands directly.

It registers:

- `GoogleService`
- Gmail providers into `EmailService`
- Google Calendar providers into `CalendarService`
- Google Drive providers into `FileSystemService`

This means `@tokenring-ai/google` is typically used alongside:

- `@tokenring-ai/email`
- `@tokenring-ai/calendar`
- `@tokenring-ai/filesystem`

### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import GooglePlugin from "@tokenring-ai/google/plugin";

const app = new TokenRingApp();
app.usePlugin(GooglePlugin, {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    agentDefaults: {
      account: "primary"
    },
    accounts: {
      primary: {
        email: "user@example.com",
        gmail: {
          description: "Primary Gmail inbox"
        },
        calendar: {
          description: "Primary Google Calendar",
          calendarId: "primary"
        },
        drive: {
          description: "Primary Google Drive",
          rootFolderId: "root"
        }
      }
    }
  }
});
```

### Programmatic OAuth Usage

```typescript
import { GoogleService } from "@tokenring-ai/google";

const googleService = app.requireService(GoogleService);

// Begin OAuth flow
const redirectUri = "http://localhost:3000/oauth/google/callback";
const { authorizationUrl, waitForCallback } = googleService.beginAuthorization("primary", redirectUri);

// Open authorizationUrl in browser, then wait for callback
const callbackUrl = await waitForCallback;

// Exchange code for tokens
const authStatus = await googleService.exchangeAuthorizationCode("primary", "AUTH_CODE", redirectUri);
```

### Provider Registration Flow

The plugin automatically registers providers when their corresponding abstract services are available:

1. `GoogleService` is registered immediately when `google` config is present
2. Email providers are registered when `EmailService` is available
3. Calendar providers are registered when `CalendarService` is available
4. Filesystem providers are registered when `FileSystemService` is available

The plugin uses `waitForItemByType()` to ensure proper ordering.

## Usage Examples

### Email Integration Example

```yaml
email:
  agentDefaults:
    provider: "gmail"
  providers:
    gmail:
      type: "gmail"
      description: "Primary Gmail inbox"
      account: "primary"
```

### Calendar Integration Example

```yaml
calendar:
  agentDefaults:
    provider: "google-calendar"
  providers:
    "google-calendar":
      type: "google-calendar"
      description: "Primary Google Calendar"
      account: "primary"
      calendarId: "primary"
```

### Filesystem Integration Example

```yaml
filesystem:
  agentDefaults:
    provider: "gdrive"
    selectedFiles: []
  providers:
    gdrive:
      type: "google-drive"
      description: "Primary Google Drive root"
      account: "primary"
      rootFolderId: "root"
```

## State Management

`GoogleService` keeps account token updates in memory at runtime.

Important behavior:

- Refreshed access tokens are stored in the service instance
- Refresh tokens returned during code exchange are also kept in memory
- Provider-specific state, such as current Gmail message, current Gmail draft, or current calendar event, is stored in
  provider-local agent state slices
- Token persistence is handled by the VaultService - tokens are automatically stored and retrieved from the vault

## Best Practices

- Configure a stable `agentDefaults.account` when most providers use the same Google identity.
- Persist refreshed credentials outside the service if long-lived operation matters.
- Limit provider scopes to what the application needs when possible.
- Treat Google Drive as an API-backed virtual filesystem, not a drop-in POSIX replacement.
- Be aware that `glob`, `watch`, and `grep` operations are not supported due to Drive API limitations.
- Use the `email` field in account configuration to specify the user's email address.
- Enable only the integrations (gmail, calendar, drive) that you need for each account.

## Testing

The package uses vitest for unit testing.

**Run tests:**

```bash
bun test
```

**Run tests in watch mode:**

```bash
bun test:watch
```

**Generate test coverage:**

```bash
bun test:coverage
```

## Dependencies

Key runtime dependencies:

- `@tokenring-ai/agent`
- `@tokenring-ai/app`
- `@tokenring-ai/calendar`
- `@tokenring-ai/email`
- `@tokenring-ai/filesystem`
- `@tokenring-ai/utility`
- `@tokenring-ai/vault`
- `@tokenring-ai/web-host`
- `googleapis`
- `zod`

## Related Components

- `@tokenring-ai/email` - Email service with Gmail provider integration
- `@tokenring-ai/calendar` - Calendar service with Google Calendar provider integration
- `@tokenring-ai/filesystem` - Filesystem service with Google Drive provider integration
- `@tokenring-ai/chat` - Chat interface for agent interaction
- `@tokenring-ai/agent` - Core agent framework
- `@tokenring-ai/app` - Application framework and plugin system

## License

MIT License - see LICENSE file for details.
