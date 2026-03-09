# @tokenring-ai/calendar

Abstract calendar interface for Token Ring with provider-based event listing, search, creation, updates, and deletion.

## Overview

The `@tokenring-ai/calendar` package provides a provider-based calendar abstraction for Token Ring agents. It supplies a shared `CalendarService`, a provider interface for concrete implementations, chat tools, slash commands, and scripting functions for calendar workflows.

This package is intentionally abstract. Concrete integrations such as Google Calendar register providers into `CalendarService`.

## Key Features

- Provider-based calendar architecture
- Upcoming-event listing
- Free-text event search
- Current-event selection for follow-up work
- Event creation and updates
- Event deletion
- Slash commands and chat tools for interactive use
- Agent-scoped provider selection
- Scripting integration for automation

## Core Components

### `CalendarService`

Main service for calendar operations.

Key responsibilities:

- register providers
- resolve the active provider for an agent
- proxy event listing, search, selection, creation, update, and delete operations
- manage provider selection in `CalendarState`

Key methods:

- `registerCalendarProvider(name, provider)`
- `getAvailableProviders()`
- `setActiveProvider(name, agent)`
- `getUpcomingEvents(filter, agent)`
- `searchEvents(filter, agent)`
- `createEvent(data, agent)`
- `updateEvent(data, agent)`
- `selectEventById(id, agent)`
- `getCurrentEvent(agent)`
- `clearCurrentEvent(agent)`
- `deleteCurrentEvent(agent)`

### `CalendarProvider`

Provider interface implemented by concrete packages.

```ts
interface CalendarProvider {
  description: string;
  attach(agent: Agent, creationContext: AgentCreationContext): void;
  getUpcomingEvents(filter: CalendarEventFilterOptions, agent: Agent): Promise<CalendarEvent[]>;
  searchEvents(filter: CalendarEventSearchOptions, agent: Agent): Promise<CalendarEvent[]>;
  createEvent(data: CreateCalendarEventData, agent: Agent): Promise<CalendarEvent>;
  updateEvent(data: UpdateCalendarEventData, agent: Agent): Promise<CalendarEvent>;
  selectEventById(id: string, agent: Agent): Promise<CalendarEvent>;
  getCurrentEvent(agent: Agent): CalendarEvent | null;
  clearCurrentEvent(agent: Agent): Promise<void>;
  deleteCurrentEvent(agent: Agent): Promise<void>;
}
```

### Types

- `CalendarEvent`
- `CalendarAttendee`
- `CalendarEventFilterOptions`
- `CalendarEventSearchOptions`
- `CreateCalendarEventData`
- `UpdateCalendarEventData`

## Services

### `CalendarService`

Implements `TokenRingService` and is registered by the package plugin.

Integration points:

- `ChatService` for calendar tools
- `AgentCommandService` for `/calendar ...` commands
- `ScriptingService` for scripting functions

## Provider Documentation

This package defines the provider interface but does not include a concrete provider itself. Extension packages are expected to:

- implement `CalendarProvider`
- initialize provider-local state in `attach(...)`
- register themselves through `CalendarService.registerCalendarProvider(...)`

## Chat Commands

Provider commands:

- `/calendar provider get`
- `/calendar provider set <name>`
- `/calendar provider select`
- `/calendar provider reset`

Event commands:

- `/calendar event list [limit]`
- `/calendar event search <query>`
- `/calendar event create <title> | <start ISO> | <end ISO> | [description]`
- `/calendar event update [title] | [start ISO] | [end ISO] | [description]`
- `/calendar event get`
- `/calendar event select`
- `/calendar event info`
- `/calendar event clear`
- `/calendar event delete`

## Configuration

The plugin is configured under the `calendar` key.

```ts
{
  calendar: {
    agentDefaults: {
      provider: "google-calendar"
    },
    providers: {
      "google-calendar": {
        type: "google-calendar",
        description: "Primary calendar",
        account: "primary",
        calendarId: "primary"
      }
    }
  }
}
```

Relevant schemas:

- `CalendarAgentConfigSchema`
- `CalendarConfigSchema`

## Integration

Typical installation:

```ts
import TokenRingApp from "@tokenring-ai/app";
import CalendarPlugin from "@tokenring-ai/calendar/plugin";

const app = new TokenRingApp();
app.usePlugin(CalendarPlugin, {
  calendar: {
    agentDefaults: {
      provider: "google-calendar",
    },
    providers: {
      "google-calendar": {
        type: "google-calendar",
        description: "Primary calendar",
        account: "primary",
        calendarId: "primary",
      },
    },
  },
});
```

Programmatic usage:

```ts
import {CalendarService} from "@tokenring-ai/calendar";

const calendarService = agent.requireServiceByType(CalendarService);
const events = await calendarService.getUpcomingEvents({limit: 10}, agent);
const event = await calendarService.createEvent({
  title: "Team sync",
  startAt: new Date("2026-03-10T17:00:00.000Z"),
  endAt: new Date("2026-03-10T17:30:00.000Z"),
  description: "Weekly status sync",
}, agent);
await calendarService.updateEvent({description: "Updated agenda"}, agent);
```

## Usage Examples

Chat tool workflows:

- use `calendar_getUpcomingEvents` to inspect the near-term schedule
- use `calendar_searchEvents` to find a specific meeting
- use `calendar_selectEvent` to focus follow-up work
- use `calendar_createEvent` and `calendar_updateEvent` to schedule or revise meetings
- use `calendar_deleteCurrentEvent` to remove the selected event

## Best Practices

- Normalize provider data into the shared `CalendarEvent` shape.
- Keep current-event selection in provider-local state slices.
- Prefer explicit UTC timestamps or full ISO strings when creating or updating events through automation.

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
