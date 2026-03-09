# @tokenring-ai/google

Google OAuth service and provider integrations for Gmail, Google Calendar, and Google Drive.

## Overview

The `@tokenring-ai/google` package provides a shared `GoogleService` for Google OAuth token handling and authenticated Google API access, plus concrete provider implementations for other abstract Token Ring packages.

Current provider integrations:

- Gmail for `@tokenring-ai/email`
- Google Calendar for `@tokenring-ai/calendar`
- Google Drive for `@tokenring-ai/filesystem`

The package follows the repository’s provider-extension pattern: it integrates with existing abstract services rather than replacing them.

## Key Features

- Google OAuth account configuration
- Authorization URL generation
- Authorization code exchange
- Refresh-token and access-token handling
- Gmail provider for abstract email workflows
- Google Calendar provider for abstract calendar workflows
- Google Drive filesystem provider for abstract filesystem workflows
- Plugin-based provider registration into existing Token Ring services

## Core Components

### `GoogleService`

Central service for Google account state and authenticated HTTP requests.

Key methods:

- `getAvailableAccounts()`
- `getDefaultAccountName()`
- `getAccount(name?)`
- `getUserEmail(name?)`
- `createAuthorizationUrl(name?, options?)`
- `exchangeAuthorizationCode(name, code)`
- `refreshAccessToken(name?)`
- `getAccessToken(name?)`
- `fetchGoogleJson(name, url, init, context)`
- `fetchGoogleRaw(name, url, init, context)`

### `GmailEmailProvider`

Concrete `EmailProvider` implementation.

Capabilities:

- list inbox messages
- search messages
- select the current message
- create and update drafts
- send the current draft

### `GoogleCalendarProvider`

Concrete `CalendarProvider` implementation.

Capabilities:

- list upcoming events
- search events
- select the current event
- create events
- update the current event
- delete the current event

### `GoogleDriveFileSystemProvider`

Concrete `FileSystemProvider` implementation.

Capabilities:

- read files
- write files
- append files
- rename and move files
- copy files
- create directories
- delete files
- stat and existence checks
- recursive directory walking

Unsupported operations:

- `glob`
- `grep`
- `watch`

## Services

### `GoogleService`

Implements `TokenRingService`.

The service is registered by the package plugin when `google` configuration is present. It does not expose its own slash commands or chat tools directly. Instead, it supports concrete provider implementations that integrate with other packages.

## Provider Documentation

### Gmail Provider

Provider option schema:

```ts
{
  type: "gmail" | "google",
  description: string,
  account: string
}
```

Registers into `EmailService`.

### Google Calendar Provider

Provider option schema:

```ts
{
  type: "google-calendar" | "gcal",
  description: string,
  account: string,
  calendarId: string
}
```

Registers into `CalendarService`.

### Google Drive Filesystem Provider

Provider option schema:

```ts
{
  type: "google-drive" | "gdrive",
  description: string,
  account: string,
  rootFolderId: string
}
```

Registers into `FileSystemService`.

## Chat Commands

This package does not currently register its own slash commands. User-facing commands come from the abstract packages it extends:

- `@tokenring-ai/email`
- `@tokenring-ai/calendar`
- `@tokenring-ai/filesystem`

## Configuration

Base Google account configuration:

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

Combined configuration example:

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

Typical plugin registration:

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

Programmatic OAuth usage:

```ts
import {GoogleService} from "@tokenring-ai/google";

const googleService = app.requireService(GoogleService);
const authorizationUrl = googleService.createAuthorizationUrl("primary");
const account = await googleService.exchangeAuthorizationCode("primary", "AUTH_CODE");
const token = await googleService.getAccessToken("primary");
```

## Usage Examples

- Use `GoogleService.createAuthorizationUrl(...)` during OAuth setup.
- Use `GoogleService.exchangeAuthorizationCode(...)` after redirect handling.
- Let `@tokenring-ai/google/plugin` register Gmail, Google Calendar, and Drive providers into their abstract services.

## Best Practices

- Persist refreshed credentials outside `GoogleService` if long-lived runtime state matters.
- Scope Google accounts conservatively to the APIs your application actually uses.
- Treat Google Drive as an API-backed virtual filesystem rather than a POSIX-equivalent provider.

## Testing

The package uses `vitest` and can be validated with:

```bash
bun run build
bun run test
```

Cross-package integration can be verified with:

```bash
npx tsc --noEmit
```

## Dependencies

Key dependencies:

- `@tokenring-ai/agent`
- `@tokenring-ai/app`
- `@tokenring-ai/calendar`
- `@tokenring-ai/email`
- `@tokenring-ai/filesystem`
- `@tokenring-ai/utility`
- `zod`

## Related Components

- `@tokenring-ai/email`
- `@tokenring-ai/calendar`
- `@tokenring-ai/filesystem`
- `@tokenring-ai/chat`
- `@tokenring-ai/agent`
