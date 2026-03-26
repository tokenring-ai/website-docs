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

## Core Components

### GoogleService

Central service for Google account state and authenticated HTTP requests.

**Implements:** `TokenRingService`

**Constructor:**

```ts
constructor(options: GoogleConfig)
```

**Properties:**

- `name: string` - Service name ("GoogleService")
- `description: string` - Service description
- `options: GoogleConfig` - Configuration options

**Methods:**

```ts
getAvailableAccounts(): string[]
```
Returns list of configured account names.

```ts
getDefaultAccountName(): string | undefined
```
Returns the configured default account name, or undefined if not set.

```ts
getAccount(name?: string): GoogleAccount
```
Returns the account configuration for the specified name (or default). Throws if not found.

```ts
getUserEmail(name?: string): string
```
Returns the email address for the specified account (or default).

```ts
createAuthorizationUrl(name?: string, options?: AuthorizationOptions): string
```
Generates OAuth authorization URL with configurable options.

**AuthorizationOptions:**

```ts
type AuthorizationOptions = {
  state?: string;
  scopes?: string[];
  accessType?: "offline" | "online";
  prompt?: "consent" | "none" | "select_account";
  loginHint?: string;
};
```

```ts
exchangeAuthorizationCode(name: string, code: string): Promise<GoogleAccount>
```
Exchanges OAuth authorization code for tokens. Updates the account with refresh token and access token.

```ts
refreshAccessToken(name?: string): Promise<string>
```
Refreshes expired access token using refresh token. Returns the new access token.

```ts
getAccessToken(name?: string): Promise<string>
```
Returns valid access token, refreshing if necessary.

```ts
fetchGoogleJson<T>(name: string | undefined, url: string, init: RequestInit, context: string): Promise<T>
```
Makes authenticated request and parses JSON response. Throws on error.

```ts
fetchGoogleRaw(name: string | undefined, url: string, init: RequestInit, context: string): Promise<Response>
```
Makes authenticated request and returns raw Response object.

### GmailEmailProvider

Concrete `EmailProvider` implementation for Gmail.

**Implements:** `EmailProvider`

**Constructor:**

```ts
constructor(options: GmailEmailProviderOptions, googleService: GoogleService)
```

**Properties:**

- `description: string` - Provider description
- `options: GmailEmailProviderOptions` - Provider configuration

**Methods:**

```ts
getInboxMessages(filter: EmailInboxFilterOptions, agent: Agent): Promise<EmailMessage[]>
```
Lists messages from inbox with optional unread filter.

**EmailInboxFilterOptions:**

```ts
type EmailInboxFilterOptions = {
  unreadOnly?: boolean;
  limit?: number;
};
```

```ts
searchMessages(filter: EmailSearchOptions, agent: Agent): Promise<EmailMessage[]>
```
Searches messages with query string and optional unread filter.

**EmailSearchOptions:**

```ts
type EmailSearchOptions = {
  query: string;
  unreadOnly?: boolean;
  limit?: number;
};
```

```ts
getMessageById(id: string, agent: Agent): Promise<EmailMessage>
```
Fetches full message content by ID.

```ts
createDraft(data: DraftEmailData, agent: Agent): Promise<EmailDraft>
```
Creates a new draft with to, cc, bcc, subject, and body.

**DraftEmailData:**

```ts
type DraftEmailData = {
  to: Array<{email: string; name?: string}>;
  cc?: Array<{email: string; name?: string}>;
  bcc?: Array<{email: string; name?: string}>;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  threadId?: string;
};
```

```ts
updateDraft(data: EmailDraft, agent: Agent): Promise<EmailDraft>
```
Updates an existing draft.

```ts
sendDraft(id: string, agent: Agent): Promise<void>
```
Sends the draft by ID.

### GoogleCalendarProvider

Concrete `CalendarProvider` implementation for Google Calendar.

**Implements:** `CalendarProvider`

**Constructor:**

```ts
constructor(options: GoogleCalendarProviderOptions, googleService: GoogleService)
```

**Properties:**

- `description: string` - Provider description
- `options: GoogleCalendarProviderOptions` - Provider configuration

**Methods:**

```ts
getUpcomingEvents(filter: CalendarEventFilterOptions, agent: Agent): Promise<CalendarEvent[]>
```
Lists upcoming events from the calendar with time range and limit.

**CalendarEventFilterOptions:**

```ts
type CalendarEventFilterOptions = {
  from?: Date;
  to?: Date;
  limit?: number;
};
```

```ts
searchEvents(filter: CalendarEventSearchOptions, agent: Agent): Promise<CalendarEvent[]>
```
Searches events by query string within time range.

**CalendarEventSearchOptions:**

```ts
type CalendarEventSearchOptions = {
  query: string;
  from?: Date;
  to?: Date;
  limit?: number;
};
```

```ts
createEvent(data: CreateCalendarEventData, agent: Agent): Promise<CalendarEvent>
```
Creates a new event with title, description, location, attendees, and timing.

**CreateCalendarEventData:**

```ts
type CreateCalendarEventData = {
  title: string;
  description?: string;
  location?: string;
  attendees?: Array<{email: string; name?: string; responseStatus?: string}>;
  startAt: Date;
  endAt?: Date;
  allDay?: boolean;
  status?: "confirmed" | "tentative" | "cancelled";
};
```

```ts
updateEvent(id: string, data: UpdateCalendarEventData, agent: Agent): Promise<CalendarEvent>
```
Updates an existing event by ID.

**UpdateCalendarEventData:**

```ts
type UpdateCalendarEventData = {
  title?: string;
  description?: string;
  location?: string;
  attendees?: Array<{email: string; name?: string; responseStatus?: string}>;
  startAt?: Date;
  endAt?: Date;
  allDay?: boolean;
  status?: "confirmed" | "tentative" | "cancelled";
};
```

```ts
selectEventById(id: string, agent: Agent): Promise<CalendarEvent>
```
Fetches a specific event by ID.

```ts
deleteEvent(id: string, agent: Agent): Promise<void>
```
Deletes an event by ID.

### GoogleDriveFileSystemProvider

Concrete `FileSystemProvider` implementation for Google Drive.

**Implements:** `FileSystemProvider`

**Constructor:**

```ts
constructor(options: GoogleDriveFileSystemProviderOptions, googleService: GoogleService)
```

**Properties:**

- `name: string` - Provider name
- `description: string` - Provider description
- `options: GoogleDriveFileSystemProviderOptions` - Provider configuration

**Methods:**

```ts
writeFile(filePath: string, content: string | Buffer): Promise<boolean>
```
Writes or updates a file. Returns true on success.

```ts
appendFile(filePath: string, content: string | Buffer): Promise<boolean>
```
Appends content to a file. Returns true on success.

```ts
deleteFile(filePath: string): Promise<boolean>
```
Deletes a file. Returns true on success.

```ts
readFile(filePath: string): Promise<Buffer | null>
```
Reads file content. Returns null if file not found.

```ts
rename(oldPath: string, newPath: string): Promise<boolean>
```
Renames or moves a file. Returns true on success.

```ts
exists(filePath: string): Promise<boolean>
```
Checks if a file or folder exists.

```ts
stat(filePath: string): Promise<StatLike>
```
Returns file/folder statistics.

**DirectoryTreeOptions:**

```ts
type DirectoryTreeOptions = {
  recursive?: boolean;
  maxDepth?: number;
};
```

```ts
getDirectoryTree(path: string, params?: DirectoryTreeOptions): AsyncGenerator<string>
```
Returns async generator for recursive directory listing with tree structure.

```ts
createDirectory(dirPath: string, options?: {recursive?: boolean}): Promise<boolean>
```
Creates a directory. Returns true on success.

```ts
copy(source: string, destination: string, options?: {overwrite?: boolean}): Promise<boolean>
```
Copies a file. Returns true on success. Throws if destination exists and overwrite is false.

**Unsupported Operations:**

The following methods throw errors because the Drive API does not provide equivalent behavior to local filesystem providers:

- `glob()` - Pattern-based file matching not supported
- `watch()` - File system watching not supported
- `grep()` - Content search across files not supported

## Services

### GoogleService

Implements `TokenRingService`.

The service is registered by the package plugin when `google` configuration is present. It does not expose its own slash commands or chat tools directly. Instead, it supports concrete provider implementations that integrate with other packages.

**Service Registration:**

The plugin automatically registers `GoogleService` when `google` configuration is provided:

```ts
app.services.register(googleService);
```

## Provider Documentation

### Gmail Provider

Registers into `EmailService`.

**Provider Option Schema:**

```ts
{
  type: "gmail" | "google",
  description: string,
  account: string
}
```

**Example Configuration:**

```ts
{
  email: {
    agentDefaults: {
      provider: "gmail"
    },
    providers: {
      gmail: {
        type: "gmail",
        description: "Primary Gmail inbox",
        account: "primary"
      }
    }
  }
}
```

### Google Calendar Provider

Registers into `CalendarService`.

**Provider Option Schema:**

```ts
{
  type: "google-calendar" | "gcal",
  description: string,
  account: string,
  calendarId: string
}
```

**Example Configuration:**

```ts
{
  calendar: {
    agentDefaults: {
      provider: "google-calendar"
    },
    providers: {
      "google-calendar": {
        type: "google-calendar",
        description: "Primary Google Calendar",
        account: "primary",
        calendarId: "primary"
      }
    }
  }
}
```

### Google Drive Filesystem Provider

Registers into `FileSystemService`.

**Provider Option Schema:**

```ts
{
  type: "google-drive" | "gdrive",
  description: string,
  account: string,
  rootFolderId: string
}
```

**Example Configuration:**

```ts
{
  filesystem: {
    agentDefaults: {
      provider: "gdrive",
      selectedFiles: []
    },
    providers: {
      gdrive: {
        type: "google-drive",
        description: "Primary Google Drive root",
        account: "primary",
        rootFolderId: "root"
      }
    }
  }
}
```

## Chat Commands

This package does not currently register its own slash commands. User-facing commands come from the abstract packages it extends:

- `@tokenring-ai/email` - Email commands (`/email inbox`, `/email search`, `/email send`, etc.)
- `@tokenring-ai/calendar` - Calendar commands (`/calendar list`, `/calendar event create`, etc.)
- `@tokenring-ai/filesystem` - Filesystem commands (`/filesystem read`, `/filesystem write`, etc.)

## Configuration

### Base Google Account Configuration

```ts
{
  google: {
    defaultAccount: "primary",
    accounts: {
      primary: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: "http://localhost:3000/oauth/google/callback",
        userEmail: "me@example.com",
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: process.env.GOOGLE_ACCESS_TOKEN,
        expiryDate: 0,
        scopes: [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.compose",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/calendar"
        ]
      }
    }
  }
}
```

### Schema Definitions

**GoogleAccountSchema:**

```ts
{
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  userEmail: string (email format),
  refreshToken?: string,
  accessToken?: string,
  expiryDate?: number,
  scopes: string[] (default: Gmail and Calendar scopes)
}
```

**GoogleConfigSchema:**

```ts
{
  accounts: Record<string, GoogleAccount>,
  defaultAccount?: string
}
```

### Combined Configuration Example

```ts
{
  google: {
    defaultAccount: "primary",
    accounts: {
      primary: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: "http://localhost:3000/oauth/google/callback",
        userEmail: "me@example.com",
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      }
    }
  },
  email: {
    agentDefaults: {
      provider: "gmail"
    },
    providers: {
      gmail: {
        type: "gmail",
        description: "Primary Gmail inbox",
        account: "primary"
      }
    }
  },
  calendar: {
    agentDefaults: {
      provider: "google-calendar"
    },
    providers: {
      "google-calendar": {
        type: "google-calendar",
        description: "Primary Google Calendar",
        account: "primary",
        calendarId: "primary"
      }
    }
  },
  filesystem: {
    agentDefaults: {
      provider: "gdrive",
      selectedFiles: []
    },
    providers: {
      gdrive: {
        type: "google-drive",
        description: "Primary Google Drive root",
        account: "primary",
        rootFolderId: "root"
      }
    }
  }
}
```

## Integration

### Plugin Installation

```ts
import TokenRingApp from "@tokenring-ai/app";
import GooglePlugin from "@tokenring-ai/google/plugin";

const app = new TokenRingApp();
app.usePlugin(GooglePlugin, {
  google: {
    defaultAccount: "primary",
    accounts: {
      primary: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: "http://localhost:3000/oauth/google/callback",
        userEmail: "me@example.com",
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
      },
    },
  },
});
```

### Programmatic OAuth Usage

```ts
import {GoogleService} from "@tokenring-ai/google";

const googleService = app.requireService(GoogleService);

// Generate authorization URL
const authorizationUrl = googleService.createAuthorizationUrl("primary", {
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar"
  ],
  accessType: "offline",
  prompt: "consent"
});

// After user authorizes and redirects back with code:
const account = await googleService.exchangeAuthorizationCode("primary", "AUTH_CODE");

// Get access token for API calls
const token = await googleService.getAccessToken("primary");
```

### Provider Registration Flow

The plugin automatically registers providers when their corresponding abstract services are available:

1. `GoogleService` is registered immediately when `google` config is present
2. Email providers are registered when `EmailService` is available
3. Calendar providers are registered when `CalendarService` is available
4. Filesystem providers are registered when `FileSystemService` is available

The plugin uses `waitForItemByType()` to ensure proper ordering.

## Usage Examples

### OAuth Flow

```ts
// Step 1: Generate authorization URL
const googleService = app.requireService(GoogleService);
const authUrl = googleService.createAuthorizationUrl("primary", {
  accessType: "offline",
  prompt: "consent"
});
console.log("Visit this URL:", authUrl);

// Step 2: After user authorizes, exchange the code
// (This would typically happen in your OAuth callback handler)
const account = await googleService.exchangeAuthorizationCode("primary", "AUTH_CODE_FROM_CALLBACK");

// Step 3: Use the service for authenticated requests
const token = await googleService.getAccessToken("primary");
```

### Email Integration

```ts
// Configure email service with Gmail provider
const emailConfig = {
  email: {
    agentDefaults: { provider: "gmail" },
    providers: {
      gmail: {
        type: "gmail",
        description: "Gmail",
        account: "primary"
      }
    }
  }
};

// The GmailEmailProvider will be automatically registered
// when the plugin is installed with this configuration
```

### Calendar Integration

```ts
// Configure calendar service with Google Calendar provider
const calendarConfig = {
  calendar: {
    agentDefaults: { provider: "google-calendar" },
    providers: {
      "google-calendar": {
        type: "google-calendar",
        description: "Google Calendar",
        account: "primary",
        calendarId: "primary"
      }
    }
  }
};

// The GoogleCalendarProvider will be automatically registered
// when the plugin is installed with this configuration
```

### Filesystem Integration

```ts
// Configure filesystem service with Google Drive provider
const filesystemConfig = {
  filesystem: {
    agentDefaults: { provider: "gdrive", selectedFiles: [] },
    providers: {
      gdrive: {
        type: "google-drive",
        description: "Google Drive",
        account: "primary",
        rootFolderId: "root"
      }
    }
  }
};

// The GoogleDriveFileSystemProvider will be automatically registered
// when the plugin is installed with this configuration
```

## Best Practices

- **Credential Persistence**: Persist refreshed credentials outside `GoogleService` if long-lived runtime state matters. The service keeps tokens in memory only.
- **Scope Management**: Scope Google accounts conservatively to the APIs your application actually uses. Define custom scopes in the account configuration.
- **Drive as Virtual Filesystem**: Treat Google Drive as an API-backed virtual filesystem rather than a POSIX-equivalent provider. Not all filesystem operations are supported.
- **Error Handling**: Be prepared for API rate limits and quota issues when making frequent requests to Google APIs.
- **Token Expiry**: Monitor token expiry dates and handle refresh token rotation if needed.
- **Multi-Account Support**: Configure multiple accounts if your application needs to access different Google identities.

## Testing

The package uses `vitest` for unit testing.

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

**Build and type check:**

```bash
bun run build
npx tsc --noEmit
```

## Dependencies

Key runtime dependencies:

- `@tokenring-ai/agent` - Agent framework for tool and command execution
- `@tokenring-ai/app` - Application framework and plugin system
- `@tokenring-ai/calendar` - Calendar service and provider interface
- `@tokenring-ai/email` - Email service and provider interface
- `@tokenring-ai/filesystem` - Filesystem service and provider interface
- `@tokenring-ai/utility` - Shared utilities including HTTP helpers
- `zod` - Schema validation and type inference

## Related Components

- `@tokenring-ai/email` - Email service with Gmail provider integration
- `@tokenring-ai/calendar` - Calendar service with Google Calendar provider integration
- `@tokenring-ai/filesystem` - Filesystem service with Google Drive provider integration
- `@tokenring-ai/chat` - Chat interface for agent interaction
- `@tokenring-ai/agent` - Core agent framework
- `@tokenring-ai/app` - Application framework and plugin system
