# Google Services

## User Guide

### Overview

The `@tokenring-ai/google` package provides Google OAuth account management and concrete providers for Google-backed services in the Token Ring ecosystem. It integrates with abstract Token Ring services to enable Gmail email access, Google Calendar management, and Google Drive filesystem operations.

This package handles the complete OAuth 2.0 flow for Google authentication, token storage, and authenticated API access to Google services.

### Key Features

- **OAuth 2.0 Authentication**: Complete OAuth flow with automatic token refresh
- **Gmail Integration**: Email provider for sending, receiving, and managing Gmail messages
- **Google Calendar Integration**: Calendar provider for event management
- **Google Drive Integration**: Filesystem provider for Google Drive file operations
- **Secure Token Storage**: Tokens persisted to VaultService for long-term access
- **Multi-Account Support**: Configure and manage multiple Google accounts
- **Automatic Scope Management**: Scopes automatically determined based on enabled integrations

### Chat Commands

| Command                          | Description                                    |
|----------------------------------|------------------------------------------------|
| `/google account list`           | List all available Google accounts             |
| `/google account get <name>`     | Show details for a specific Google account     |
| `/google account auth <name>`    | Authenticate a Google account via OAuth        |

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
2. Displays the URL for you to open in your browser
3. Listens for the OAuth callback via WebHostService
4. Exchanges the authorization code for tokens
5. Stores the tokens in the vault
6. Fetches and stores the user profile

### Tools

The Google package does not define standalone tools. Instead, it registers providers into abstract Token Ring services:

- **Email Tools**: Available through `@tokenring-ai/email` when Gmail provider is configured
- **Calendar Tools**: Available through `@tokenring-ai/calendar` when Google Calendar provider is configured
- **Filesystem Tools**: Available through `@tokenring-ai/filesystem` when Google Drive provider is configured

### Configuration

#### Environment Variables

| Variable               | Description                | Required |
|------------------------|----------------------------|----------|
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     | Yes*     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes*     |

\* Can also be provided in configuration

#### Configuration Example

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
        description: "Primary Gmail inbox"
      calendar:
        description: "Primary Google Calendar"
        calendarId: "primary"
      drive:
        description: "Primary Google Drive"
        rootFolderId: "root"
```

#### Configuration Options

#### GoogleConfig

| Field           | Type                            | Description                          |
|-----------------|---------------------------------|--------------------------------------|
| `clientId`      | `string`                        | Google OAuth client ID               |
| `clientSecret`  | `string`                        | Google OAuth client secret           |
| `accounts`      | `Record<string, GoogleAccount>` | Configured Google accounts           |
| `agentDefaults` | `GoogleAgentOptions`            | Default options for agents           |

#### GoogleAccount

| Field      | Type                    | Description            |
|------------|-------------------------|------------------------|
| `email`    | `string`                | User email address     |
| `gmail`    | `GoogleAccountGmail`    | Gmail configuration    |
| `calendar` | `GoogleAccountCalendar` | Calendar configuration |
| `drive`    | `GoogleAccountDrive`    | Drive configuration    |

#### GoogleAccountGmail

| Field         | Type     | Description                       | Default |
|---------------|----------|-----------------------------------|---------|
| `description` | `string` | Description of this Gmail account | "Gmail" |

#### GoogleAccountCalendar

| Field         | Type     | Description                  | Default           |
|---------------|----------|------------------------------|-------------------|
| `description` | `string` | Description of this calendar | "Google Calendar" |
| `calendarId`  | `string` | Calendar ID to use           | "primary"         |

#### GoogleAccountDrive

| Field          | Type     | Description               | Default                   |
|----------------|----------|---------------------------|---------------------------|
| `description`  | `string` | Description of this Drive | "Google Drive filesystem" |
| `rootFolderId` | `string` | Root folder ID            | "root"                    |

### Integration

The Google package integrates with the following Token Ring services:

- **@tokenring-ai/email**: Registers GmailEmailProvider for email operations
- **@tokenring-ai/calendar**: Registers GoogleCalendarProvider for calendar operations
- **@tokenring-ai/filesystem**: Registers GoogleDriveFileSystemProvider for file operations
- **@tokenring-ai/web-host**: Registers OAuth callback handler at `/oauth/google/callback`
- **@tokenring-ai/vault**: Stores OAuth tokens securely

#### Email Integration Example

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

#### Calendar Integration Example

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

#### Filesystem Integration Example

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

### Best Practices

- Configure a stable `agentDefaults.account` when most providers use the same Google identity
- Use descriptive account names that reflect the identity or purpose (e.g., "primary", "work", "personal")
- Enable only the integrations (gmail, calendar, drive) that you need for each account to minimize required scopes
- Treat Google Drive as an API-backed virtual filesystem, not a drop-in POSIX replacement
- Be aware that `glob`, `watch`, and `grep` operations are not supported due to Drive API limitations
- Configure the `email` field in account configuration to match the user's expected email address
- Tokens are automatically persisted to VaultService and refreshed when expired

## Developer Reference

### Core Components

#### GoogleService

Main service for Google OAuth and authenticated HTTP requests.

**Implements:** `TokenRingService`

**Constructor:**

```typescript
constructor(app: TokenRingApp, options: GoogleConfig)
```

**Properties:**

| Property      | Type             | Description                          |
|---------------|------------------|--------------------------------------|
| `name`        | `string`         | Service name: "GoogleService"        |
| `description` | `string`         | Service description                  |
| `app`         | `TokenRingApp`   | Reference to the TokenRing app       |
| `options`     | `GoogleConfig`   | Configured Google options            |

**Methods:**

| Method | Description |
|--------|-------------|
| `getAvailableAccounts()` | Returns list of configured account names |
| `getAccountStatus(accountName)` | Returns authentication status, profile, and account configuration |
| `requireAccount(accountName)` | Returns the account configuration, throws if not found |
| `requireAuthorizedAccount(accountName)` | Returns account status, throws if not authenticated |
| `createAuthorizationUrl(accountName, redirectUri, options)` | Generates OAuth authorization URL |
| `beginAuthorization(accountName, redirectUri)` | Begins OAuth flow, returns URL and promise for callback |
| `completePendingAuthorization(callbackUrl)` | Processes the OAuth callback URL |
| `exchangeAuthorizationCode(name, code, redirectUri)` | Exchanges OAuth code for tokens |
| `withGmail(accountName, request, operation)` | Makes authenticated Gmail API requests |
| `withCalendar(accountName, request, operation)` | Makes authenticated Calendar API requests |
| `withDrive(accountName, request, operation)` | Makes authenticated Drive API requests |

**OAuth Flow:**

The `GoogleService` manages the complete OAuth 2.0 flow:

1. **Authorization URL Generation**: `createAuthorizationUrl()` or `beginAuthorization()` generates the URL with appropriate scopes based on the account's enabled integrations
2. **User Authentication**: User signs in via the generated URL and grants permissions
3. **Callback Handling**: `completePendingAuthorization()` processes the callback URL from `WebHostService`
4. **Token Exchange**: `exchangeAuthorizationCode()` exchanges the authorization code for access and refresh tokens
5. **Token Storage**: Tokens are stored in memory and persisted to `VaultService`
6. **Automatic Refresh**: The OAuth client automatically refreshes expired access tokens

**Scope Management:**

Scopes are automatically determined based on enabled integrations:

- **User Info**: `https://www.googleapis.com/auth/userinfo.email` (always included)
- **Gmail**: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.compose`, `https://www.googleapis.com/auth/gmail.send`
- **Calendar**: `https://www.googleapis.com/auth/calendar`
- **Drive**: `https://www.googleapis.com/auth/drive`

### Services

#### GmailEmailProvider

Concrete `EmailProvider` implementation for Gmail.

**Implements:** `EmailProvider`

**Constructor:**

```typescript
constructor(options: GmailEmailProviderOptions, googleService: GoogleService)
```

**Capabilities:**

- List inbox messages with filtering (unread/read)
- Search messages with query and filtering
- Retrieve specific message by ID
- Create and update drafts
- Send the current draft
- List email boxes (Inbox, Sent, Drafts, Spam, Trash)

**Methods:**

| Method | Description |
|--------|-------------|
| `listBoxes()` | Lists available email boxes (Inbox, Sent, Drafts, Spam, Trash) |
| `getMessages(filter)` | Lists messages from inbox with optional unread filter |
| `searchMessages(filter)` | Searches messages with query string and optional unread filter |
| `getMessageById(id)` | Fetches full message content by ID |
| `createDraft(data)` | Creates a new draft with to, cc, bcc, subject, and body |
| `updateDraft(data)` | Updates an existing draft |
| `sendDraft(id)` | Sends the draft by ID |

**Scope Requirements:**

- `https://www.googleapis.com/auth/gmail.readonly` - For listing and reading messages
- `https://www.googleapis.com/auth/gmail.compose` - For creating and updating drafts
- `https://www.googleapis.com/auth/gmail.send` - For sending drafts

#### GoogleCalendarProvider

Concrete `CalendarProvider` implementation for Google Calendar.

**Implements:** `CalendarProvider`

**Constructor:**

```typescript
constructor(options: GoogleCalendarProviderOptions, googleService: GoogleService)
```

**Capabilities:**

- List upcoming events with time range filtering
- Search events with query and time range
- Retrieve specific event by ID
- Create events
- Update events
- Delete events

**Methods:**

| Method | Description |
|--------|-------------|
| `getUpcomingEvents(filter)` | Lists upcoming events from the calendar with time range and limit |
| `searchEvents(filter)` | Searches events by query string within time range |
| `createEvent(data)` | Creates a new event with title, description, location, attendees, and timing |
| `updateEvent(id, data)` | Updates an existing event by ID |
| `getEventById(id)` | Fetches a specific event by ID |
| `deleteEvent(id)` | Deletes an event by ID |

**Scope Requirements:**

- `https://www.googleapis.com/auth/calendar` - Full access to calendar events

#### GoogleDriveFileSystemProvider

Concrete `FileSystemProvider` implementation for Google Drive.

**Implements:** `FileSystemProvider`

**Constructor:**

```typescript
constructor(options: GoogleDriveFileSystemProviderOptions, googleService: GoogleService)
```

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

| Method | Description |
|--------|-------------|
| `writeFile(filePath, content)` | Creates or updates a file |
| `appendFile(filePath, content)` | Appends content to a file |
| `deleteFile(filePath)` | Deletes a file |
| `readFile(filePath)` | Reads file content as a buffer |
| `rename(oldPath, newPath)` | Renames or moves a file |
| `exists(filePath)` | Checks if a path exists |
| `stat(filePath)` | Returns file/directory metadata |
| `createDirectory(dirPath, options)` | Creates a directory |
| `copy(source, destination, options)` | Copies a file |
| `getDirectoryTree(path, params)` | Generates directory tree as async iterator |

**Unsupported filesystem operations:**

The following methods throw errors because the Drive API does not provide equivalent behavior to local filesystem providers:

- `glob()` - Pattern-based file matching not supported
- `watch()` - File system watching not supported
- `grep()` - Content search across files not supported

**Path Handling:**

- Paths use forward slashes (`/`) as separators
- The root folder is represented as an empty string or the configured `rootFolderId`
- Files and folders are cached by ID for performance

**Scope Requirements:**

- `https://www.googleapis.com/auth/drive` - Full access to Google Drive files

### Provider

#### GoogleOAuthCallbackResource

Web resource that handles OAuth callback requests from Google.

**Implements:** `WebResource`

**Constructor:**

```typescript
constructor(googleService: GoogleService)
```

**Registration:**

The resource is automatically registered with `WebHostService` at the path `/oauth/google/callback`.

**Behavior:**

- Handles GET requests to the callback URL
- Extracts the authorization code and state from query parameters
- Calls `GoogleService.completePendingAuthorization()` to process the callback
- Returns an HTML page indicating success or failure
- Resolves the pending authorization promise in `GoogleService`

**HTML Response:**

- **Success**: Displays "Google account connected" with instructions to close the tab
- **Failure**: Displays the error message and returns HTTP 400

### RPC Endpoints

The package registers a web resource endpoint:

- **GET `/oauth/google/callback`**: OAuth callback handler for Google authentication

### Usage Examples

#### Plugin Installation

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

#### Programmatic OAuth Usage

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

### Testing

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

### Dependencies

Key runtime dependencies:

- `@tokenring-ai/agent` - Agent orchestration and command handling
- `@tokenring-ai/app` - Base application and service registry
- `@tokenring-ai/calendar` - Calendar service for provider registration
- `@tokenring-ai/email` - Email service for provider registration
- `@tokenring-ai/filesystem` - Filesystem service for provider registration
- `@tokenring-ai/utility` - Utility functions and registries
- `@tokenring-ai/vault` - Secure token storage
- `@tokenring-ai/web-host` - OAuth callback handling
- `googleapis` - Google API client libraries
- `zod` - Schema validation

### Related Components

- `@tokenring-ai/email` - Abstract email service
- `@tokenring-ai/calendar` - Abstract calendar service
- `@tokenring-ai/filesystem` - Abstract filesystem service
- `@tokenring-ai/vault` - Secure storage service
- `@tokenring-ai/web-host` - Web hosting service

## License

MIT License - see LICENSE file for details.
