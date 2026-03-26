# @tokenring-ai/calendar

Abstract calendar interface for Token Ring with provider-based event listing, search, creation, updates, and deletion.

## Overview

The `@tokenring-ai/calendar` package provides a provider-based calendar abstraction for Token Ring agents. It supplies a shared `CalendarService`, a provider interface for concrete implementations, chat tools, slash commands, and scripting functions for calendar workflows.

This package is intentionally abstract. Concrete integrations such as Google Calendar register providers into `CalendarService`.

## Key Features

- Provider-based calendar architecture with `KeyedRegistry` for provider management
- Upcoming-event listing with filtering options
- Free-text event search
- Current-event selection for follow-up work
- Event creation and updates
- Event deletion
- Calendar watches for automated event monitoring and command triggering
- Slash commands and chat tools for interactive use
- Agent-scoped provider selection and state management
- Scripting integration for automation
- Background task support for periodic event checking

## Core Components

### `CalendarService`

Main service for calendar operations implementing `TokenRingService`.

Key responsibilities:
- Register and manage calendar providers via `KeyedRegistry`
- Resolve the active provider for each agent
- Proxy event listing, search, selection, creation, update, and delete operations
- Manage provider selection and event state in `CalendarState`
- Implement watch functionality for automated event monitoring

Key methods:

```typescript
class CalendarService implements TokenRingService {
  readonly name = "CalendarService";
  readonly description = "Abstract interface for calendar operations";
  
  // Provider management
  registerCalendarProvider: (name: string, provider: CalendarProvider) => void;
  getAvailableProviders: () => string[];
  
  // Service lifecycle
  attach(agent: Agent, creationContext: AgentCreationContext): void;
  watchCalendar(agent: Agent): void;
  checkForNewEvents(watch: z.output<typeof CalendarWatchSchema>, agent: Agent): Promise<void>;
  
  // Provider resolution
  requireActiveCalendarProvider(agent: Agent): CalendarProvider;
  setActiveProvider(name: string, agent: Agent): void;
  
  // Event operations
  getUpcomingEvents(filter: CalendarEventFilterOptions, agent: Agent): Promise<CalendarEvent[]>;
  searchEvents(filter: CalendarEventSearchOptions, agent: Agent): Promise<CalendarEvent[]>;
  createEvent(data: CreateCalendarEventData, agent: Agent): Promise<CalendarEvent>;
  updateEvent(data: UpdateCalendarEventData, agent: Agent): Promise<CalendarEvent>;
  selectEventById(id: string, agent: Agent): Promise<CalendarEvent>;
  getCurrentEvent(agent: Agent): CalendarEvent | null;
  clearCurrentEvent(agent: Agent): Promise<void>;
  deleteCurrentEvent(agent: Agent): Promise<void>;
  
  // Utility
  formatEventForPatternMatching(event: CalendarEvent): string;
}
```

### `CalendarProvider`

Provider interface implemented by concrete calendar platform integrations.

**Important:** State management (currentEvent, activeProvider) is handled by `CalendarService` and stored in `CalendarState`. Providers should NOT manage their own state slices.

```typescript
interface CalendarProvider {
  description: string;
  
  attach?(agent: Agent, creationContext: AgentCreationContext): void;
  getUpcomingEvents(filter: CalendarEventFilterOptions, agent: Agent): Promise<CalendarEvent[]>;
  searchEvents(filter: CalendarEventSearchOptions, agent: Agent): Promise<CalendarEvent[]>;
  createEvent(data: CreateCalendarEventData, agent: Agent): Promise<CalendarEvent>;
  updateEvent(id: string, data: UpdateCalendarEventData, agent: Agent): Promise<CalendarEvent>;
  selectEventById(id: string, agent: Agent): Promise<CalendarEvent>;
  deleteEvent(id: string, agent: Agent): Promise<void>;
}
```

**Provider Guidelines:**
- Providers should return event data without modifying agent state
- `CalendarService` manages setting `currentEvent` after create/select/update operations
- Providers can read `currentEvent` via `getCurrentEvent()` for operations like update/delete
- Providers should NOT call `agent.mutateState()` or `agent.initializeState()`

### Types

#### `CalendarEvent`

```typescript
const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.date(),
  endAt: z.date(),
  allDay: z.boolean().optional(),
  attendees: z.array(z.object({
    email: z.string(),
    name: z.string().optional(),
    responseStatus: z.enum(["accepted", "declined", "tentative", "needsAction"]).optional(),
  })).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  url: z.string().optional(),
  meetingUrl: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

type CalendarEvent = z.input<typeof CalendarEventSchema>;
```

#### `CalendarAttendee`

```typescript
interface CalendarAttendee {
  email: string;
  name?: string;
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
}
```

#### Filter Options

```typescript
interface CalendarEventFilterOptions {
  limit?: number;
  from?: Date;
  to?: Date;
}

interface CalendarEventSearchOptions {
  query: string;
  limit?: number;
  from?: Date;
  to?: Date;
}
```

#### Data Types

```typescript
type CreateCalendarEventData = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;
type UpdateCalendarEventData = Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>;
```

## Services

### `CalendarService`

Implements `TokenRingService` and is registered by the package plugin.

Integration points:
- `ChatService` for calendar tools
- `AgentCommandService` for `/calendar ...` commands
- `ScriptingService` for scripting functions

## State Management

### `CalendarState`

Agent-scoped state slice for calendar service.

```typescript
class CalendarState extends AgentStateSlice<typeof serializationSchema> {
  activeProvider: string | null;
  currentEvent: CalendarEvent | null;
  watch: z.output<typeof CalendarWatchSchema> | undefined;
  processedEventIds: Set<string>;
  isWatching: boolean;
  
  constructor(initialConfig: z.output<typeof CalendarAgentConfigSchema>);
  transferStateFromParent(parent: Agent): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

**State Fields:**
- `activeProvider`: Name of the currently selected calendar provider
- `currentEvent`: The currently selected event for follow-up actions
- `watch`: Watch configuration for automated event monitoring
- `processedEventIds`: Set of event IDs that have been processed by watches
- `isWatching`: Flag indicating if background watch task is active

**Serialization Schema:**
```typescript
const serializationSchema = z.object({
  activeProvider: z.string().nullable(),
  currentEvent: CalendarEventSchema.nullable().optional(),
  watch: CalendarWatchSchema.optional(),
  processedEventIds: z.array(z.string()).optional(),
}).prefault({activeProvider: null, currentEvent: null});
```

## Chat Commands

### Provider Commands

#### `/calendar provider get`

Display the currently active calendar provider.

```bash
/calendar provider get
# Output: Current provider: google-calendar
```

#### `/calendar provider set <providerName>`

Set the active calendar provider by name.

```bash
/calendar provider set google-calendar
# Output: Active provider set to: google-calendar
```

#### `/calendar provider select`

Interactively select the active calendar provider using a tree selection UI.

```bash
/calendar provider select
# Opens interactive selection with available providers
```

#### `/calendar provider reset`

Reset the active calendar provider to the initial configured value.

```bash
/calendar provider reset
# Output: Provider reset to google-calendar
```

### Event Commands

#### `/calendar event list [limit]`

List upcoming events from the active calendar provider.

```bash
/calendar event list
/calendar event list 5
# Output: Table with ID, Title, Start, End columns
```

#### `/calendar event search <query>`

Search calendar events by query.

```bash
/calendar event search standup
# Output: Table with ID, Title, Start, Location columns
```

#### `/calendar event create <title> | <start ISO> | <end ISO> | <description>`

Create a new calendar event.

```bash
/calendar event create Team sync | 2026-03-10T17:00:00.000Z | 2026-03-10T17:30:00.000Z | Weekly status sync
# Output: Created event "Team sync" (event-id) starting 3/10/2026, 5:00:00 PM
```

#### `/calendar event get`

Display the currently selected calendar event title.

```bash
/calendar event get
# Output: Current event: Team sync
```

#### `/calendar event select`

Interactively select an upcoming event using tree selection UI.

```bash
/calendar event select
# Opens interactive selection with upcoming events
```

#### `/calendar event info`

Display detailed information about the currently selected event.

```bash
/calendar event info
# Output: Provider, Title, Start, End, Location, Status, Attendees, Description, URLs
```

#### `/calendar event clear`

Clear the current event selection.

```bash
/calendar event clear
# Output: Event cleared. No calendar event is currently selected.
```

#### `/calendar event delete`

Delete the currently selected event.

```bash
/calendar event delete
# Output: Deleted current calendar event.
```

## Chat Tools

### `calendar_getUpcomingEvents`

Retrieve upcoming calendar events from the active provider.

**Input Schema:**
```typescript
{
  limit?: number,      // Optional limit for number of events (default: 10)
  from?: string,       // Optional ISO date-time to start listing from
  to?: string          // Optional ISO date-time upper bound
}
```

**Output:** Markdown table with ID, Title, Start, End, Location columns.

### `calendar_searchEvents`

Search calendar events using the active provider.

**Input Schema:**
```typescript
{
  query: string,       // Search query for calendar events
  limit?: number,      // Optional limit (default: 10)
  from?: string,       // Optional ISO date-time filter
  to?: string          // Optional ISO date-time filter
}
```

**Output:** Markdown table with ID, Title, Start, Status columns.

### `calendar_selectEvent`

Select a calendar event by ID for follow-up actions.

**Input Schema:**
```typescript
{
  id: string          // The unique identifier of the event
}
```

**Output:** Selected event details with title, ID, start/end times, and JSON representation.

### `calendar_getCurrentEvent`

Retrieve the currently selected calendar event.

**Input Schema:**
```typescript
{}
```

**Output:** Event object if selected, or message indicating no event is selected.

### `calendar_createEvent`

Create a new calendar event.

**Input Schema:**
```typescript
{
  title: string,           // Event title
  startAt: string,         // Event start time in ISO format
  endAt: string,           // Event end time in ISO format
  description?: string,    // Optional event description
  location?: string,       // Optional event location
  allDay?: boolean,        // Optional all-day flag
  attendees?: Array<{      // Optional attendees
    email: string,
    name?: string
  }>
}
```

**Output:** Created event object.

### `calendar_updateEvent`

Update the currently selected calendar event.

**Input Schema:**
```typescript
{
  title?: string,          // Optional new title
  startAt?: string,        // Optional new start time in ISO format
  endAt?: string,          // Optional new end time in ISO format
  description?: string,    // Optional new description
  location?: string,       // Optional new location
  allDay?: boolean,        // Optional new all-day flag
  attendees?: Array<{      // Optional new attendees
    email: string,
    name?: string
  }>,
  status?: "confirmed" | "tentative" | "cancelled"
}
```

**Output:** Updated event object.

### `calendar_deleteCurrentEvent`

Delete the currently selected calendar event.

**Input Schema:**
```typescript
{}
```

**Output:** Confirmation message.

## Scripting Functions

The package registers the following functions with the `ScriptingService`:

### `getUpcomingCalendarEvents(limit?: string)`

Get upcoming calendar events.

```typescript
const events = await getUpcomingCalendarEvents("10");
const eventsArray = JSON.parse(events);
```

### `searchCalendarEvents(query: string, limit?: string)`

Search calendar events.

```typescript
const results = await searchCalendarEvents("team sync", "5");
const eventsArray = JSON.parse(results);
```

### `createCalendarEvent(title: string, startIso: string, endIso: string, description?: string)`

Create a calendar event.

```typescript
const result = await createCalendarEvent(
  "Team sync",
  "2026-03-10T17:00:00.000Z",
  "2026-03-10T17:30:00.000Z",
  "Weekly status sync"
);
// Returns: "Created event: event-id"
```

### `deleteCurrentCalendarEvent()`

Delete the current calendar event.

```typescript
const result = await deleteCurrentCalendarEvent();
// Returns: "Deleted current calendar event"
```

## Configuration

The plugin is configured under the `calendar` key.

```typescript
{
  calendar: {
    providers: {
      "google-calendar": {
        // Provider-specific configuration
        type: "google-calendar",
        description: "Primary calendar",
        account: "primary",
        calendarId: "primary"
      }
    },
    pollInterval: 300,  // seconds, default 300 (5 minutes)
    agentDefaults: {
      provider: "google-calendar",  // Initial provider for agents
      watch: {
        checkInterval: 300,         // seconds between checks
        lookbackMinutes: 15,        // how far back to check for new events
        actions: [
          {
            pattern: "team sync",   // regex pattern to match
            command: "/calendar event info"  // command to run on match
          }
        ]
      }
    }
  }
}
```

### Configuration Schemas

#### `CalendarConfigSchema`

```typescript
const CalendarConfigSchema = z.object({
  providers: z.record(z.string(), z.any()).default({}),
  pollInterval: z.number().default(300).transform(seconds => seconds * 1000),
  agentDefaults: CalendarAgentConfigSchema.prefault({}),
});
```

#### `CalendarAgentConfigSchema`

```typescript
const CalendarAgentConfigSchema = z.object({
  provider: z.string().optional(),
  watch: CalendarWatchSchema.optional(),
}).default({});
```

#### `CalendarWatchSchema`

```typescript
const CalendarWatchSchema = z.object({
  checkInterval: z.number().int().positive().default(300),  // seconds
  lookbackMinutes: z.number().int().positive().default(15), // how far back to check
  actions: z.array(z.object({
    pattern: z.string(),     // regex pattern
    command: z.string(),     // command to trigger
  })).default([]),
}).prefault({});
```

## Integration

### Plugin Installation

```typescript
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

### Programmatic Usage

```typescript
import {CalendarService} from "@tokenring-ai/calendar";

// Get service from agent
const calendarService = agent.requireServiceByType(CalendarService);

// List upcoming events
const events = await calendarService.getUpcomingEvents({limit: 10}, agent);

// Search events
const results = await calendarService.searchEvents({query: "team sync", limit: 5}, agent);

// Create event
const event = await calendarService.createEvent({
  title: "Team sync",
  startAt: new Date("2026-03-10T17:00:00.000Z"),
  endAt: new Date("2026-03-10T17:30:00.000Z"),
  description: "Weekly status sync",
}, agent);

// Update event (requires event to be selected first)
await calendarService.selectEventById(event.id, agent);
const updated = await calendarService.updateEvent({
  description: "Updated agenda"
}, agent);

// Delete event
await calendarService.deleteCurrentEvent(agent);
```

### Provider Registration

Concrete providers register themselves with the service:

```typescript
import {CalendarProvider} from "@tokenring-ai/calendar";

const myProvider: CalendarProvider = {
  description: "My Calendar Provider",
  
  async attach(agent, creationContext) {
    // Initialize provider-specific state
    creationContext.items.push("My provider attached");
  },
  
  async getUpcomingEvents(filter, agent) {
    // Return events from provider
    return events;
  },
  
  async searchEvents(filter, agent) {
    // Search events
    return results;
  },
  
  async createEvent(data, agent) {
    // Create event via provider API
    return createdEvent;
  },
  
  async updateEvent(id, data, agent) {
    // Update event via provider API
    return updatedEvent;
  },
  
  async selectEventById(id, agent) {
    // Get event by ID
    return event;
  },
  
  async deleteEvent(id, agent) {
    // Delete event via provider API
  },
};

// Register the provider
calendarService.registerCalendarProvider("my-provider", myProvider);
```

## Watch Functionality

Calendar watches enable automated monitoring and command triggering based on event patterns.

### How Watches Work

1. When `watch` is configured in agent defaults, the service starts a background task
2. The task periodically checks for new events within the lookback window
3. New events are matched against configured patterns
4. Matching events trigger the associated commands as user input

### Example Watch Configuration

```typescript
{
  calendar: {
    agentDefaults: {
      provider: "google-calendar",
      watch: {
        checkInterval: 300,     // Check every 5 minutes
        lookbackMinutes: 15,    // Look back 15 minutes for new events
        actions: [
          {
            pattern: "team sync",  // Match events with "team sync" in title/description
            command: "/calendar event info"  // Show event details
          },
          {
            pattern: "urgent.*meeting",
            command: "Flag this meeting for immediate attention"
          }
        ]
      }
    }
  }
}
```

### Pattern Matching

Events are formatted for pattern matching as:

```
Title: <title>
Description: <description>
Location: <location>
Start: <ISO timestamp>
End: <ISO timestamp>
All Day: <boolean>
Attendees: <name> <email>, ...
Status: <status>
URL: <url>
Meeting URL: <meetingUrl>
```

Patterns are matched as case-insensitive regex against this formatted text.

## Best Practices

- Normalize provider data into the shared `CalendarEvent` shape
- Keep current-event selection in `CalendarState`, not provider state
- Prefer explicit UTC timestamps or full ISO strings when creating or updating events
- Use `selectEventById` before update/delete operations
- Configure watches carefully to avoid excessive command triggering
- Handle provider errors gracefully in provider implementations

## Testing and Development

The package uses `vitest` for unit testing.

```bash
bun run build
bun run test
bun run test:watch
bun run test:coverage
```

### Package Structure

```
pkg/calendar/
├── plugin.ts              # Plugin definition and registration
├── index.ts               # Exports
├── schema.ts              # Configuration schemas
├── CalendarService.ts     # Main service implementation
├── CalendarProvider.ts    # Provider interface and types
├── state/
│   └── CalendarState.ts   # Agent state slice
├── tools.ts               # Tool exports
├── tools/
│   ├── createEvent.ts
│   ├── deleteCurrentEvent.ts
│   ├── getCurrentEvent.ts
│   ├── getUpcomingEvents.ts
│   ├── searchEvents.ts
│   ├── selectEvent.ts
│   └── updateEvent.ts
├── commands.ts            # Command exports
└── commands/
    └── calendar/
        ├── provider/
        │   ├── get.ts
        │   ├── set.ts
        │   ├── select.ts
        │   └── reset.ts
        └── event/
            ├── list.ts
            ├── search.ts
            ├── create.ts
            ├── get.ts
            ├── select.ts
            ├── info.ts
            ├── clear.ts
            └── delete.ts
```

## Dependencies

Key dependencies:
- `@tokenring-ai/agent` - Agent framework and state management
- `@tokenring-ai/app` - Plugin system and service registry
- `@tokenring-ai/chat` - Chat tools and commands
- `@tokenring-ai/scripting` - Scripting function registration
- `@tokenring-ai/utility` - Utility helpers including `KeyedRegistry`
- `zod` - Schema validation

## Related Components

- `@tokenring-ai/google` - Google Calendar provider (example implementation)
- `@tokenring-ai/chat` - Chat system for tool and command integration
- `@tokenring-ai/agent` - Agent framework for service management
- `@tokenring-ai/scripting` - Scripting function registration
- `@tokenring-ai/app` - Plugin system and service registry

## License

MIT License - see LICENSE file for details.
