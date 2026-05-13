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
- RPC endpoints for external calendar operations

## User Guide

### Chat Commands

#### Provider Commands

| Command | Description |
|---------|-------------|
| `/calendar provider get` | Display the currently active calendar provider |
| `/calendar provider set <providerName>` | Set the active calendar provider by name |
| `/calendar provider select` | Interactively select the active calendar provider |
| `/calendar provider reset` | Reset the active calendar provider to the initial configured value |

#### Event Commands

| Command | Description |
|---------|-------------|
| `/calendar event list [limit]` | List upcoming events from the active calendar provider |
| `/calendar event search <query>` | Search calendar events by query |
| `/calendar event create <title> \| <start> \| <end> \| <description>` | Create a new calendar event |
| `/calendar event get` | Display the currently selected calendar event title |
| `/calendar event select` | Interactively select an upcoming event |
| `/calendar event info` | Display detailed information about the currently selected event |
| `/calendar event clear` | Clear the current event selection |
| `/calendar event delete` | Delete the currently selected event |

### Tools

| Tool | Description |
|------|-------------|
| `calendar_getUpcomingEvents` | Retrieve upcoming calendar events from the active provider |
| `calendar_searchEvents` | Search calendar events using the active provider |
| `calendar_selectEvent` | Select a calendar event by ID for follow-up actions |
| `calendar_getCurrentEvent` | Retrieve the currently selected calendar event |
| `calendar_createEvent` | Create a new calendar event |
| `calendar_updateEvent` | Update the currently selected calendar event |
| `calendar_deleteCurrentEvent` | Delete the currently selected calendar event |

### Configuration

The plugin is configured under the `calendar` key.

```yaml
calendar:
  pollInterval: 300  # seconds, default 300 (5 minutes)
  agentDefaults:
    provider: google-calendar  # Initial provider for agents
    watch:
      checkInterval: 300  # seconds between checks
      lookbackMinutes: 15  # how far back to check for new events
      actions:
        - pattern: "team sync"  # regex pattern to match
          command: "/calendar event info"  # command to run on match
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollInterval` | number | 300 | Poll interval in seconds (transformed to milliseconds) |
| `agentDefaults.provider` | string | undefined | Initial calendar provider for agents |
| `agentDefaults.watch` | object | undefined | Watch configuration for automated monitoring |
| `agentDefaults.watch.checkInterval` | number | 300 | Seconds between event checks |
| `agentDefaults.watch.lookbackMinutes` | number | 15 | How far back to check for new events |
| `agentDefaults.watch.actions` | array | [] | List of pattern/command actions |

### Integration

The calendar package integrates with the following Token Ring services:

- **ChatService**: Registers calendar tools for AI-assisted calendar operations
- **AgentCommandService**: Registers `/calendar ...` slash commands
- **ScriptingService**: Registers scripting functions for automation
- **RpcService**: Registers RPC endpoints for external calendar operations

### Best Practices

- Normalize provider data into the shared `CalendarEvent` shape
- Keep current-event selection in `CalendarState`, not provider state
- Prefer explicit UTC timestamps or full ISO strings when creating or updating events
- Use `selectEventById` before update/delete operations
- Configure watches carefully to avoid excessive command triggering
- Handle provider errors gracefully in provider implementations

## Developer Reference

### Core Components

#### `CalendarService`

Main service for calendar operations implementing `TokenRingService`.

**Key Responsibilities:**

- Register and manage calendar providers via `KeyedRegistry`
- Resolve the active provider for each agent
- Proxy event listing, search, selection, creation, update, and delete operations
- Manage provider selection and event state in `CalendarState`
- Implement watch functionality for automated event monitoring

**Interface:**

```typescript
class CalendarService implements TokenRingService {
  readonly name = "CalendarService";
  readonly description = "Abstract interface for calendar operations";

  // Provider management
  registerCalendarProvider: (name: string, provider: CalendarProvider) => void;
  getAvailableProviders: () => string[];
  requireCalendarProvider: (name: string) => CalendarProvider;

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
  clearCurrentEvent(agent: Agent): void;
  deleteCurrentEvent(agent: Agent): Promise<void>;

  // Utility
  formatEventForPatternMatching(event: CalendarEvent): string;
}
```

#### `CalendarProvider`

Provider interface implemented by concrete calendar platform integrations.

**Important:** State management (`currentEvent`, `activeProvider`) is handled by `CalendarService` and stored in `CalendarState`. Providers should NOT manage their own state slices.

- Providers should return event data without modifying agent state
- `CalendarService` manages setting `currentEvent` after create/select/update operations
- Providers can read `currentEvent` via `getCurrentEvent()` for operations like update/delete
- Providers should NOT call `agent.mutateState()` or `agent.initializeState()`

**Interface:**

```typescript
interface CalendarProvider {
  description: string;

  /**
   * Get upcoming calendar events.
   * @returns Array of events
   */
  getUpcomingEvents(filter: CalendarEventFilterOptions): Promise<CalendarEvent[]>;

  /**
   * Search calendar events.
   * @returns Array of events
   */
  searchEvents(filter: CalendarEventSearchOptions): Promise<CalendarEvent[]>;

  /**
   * Create a new calendar event.
   * @returns The created event
   */
  createEvent(data: CreateCalendarEventData): Promise<CalendarEvent>;

  /**
   * Update an event.
   * @returns The updated event
   */
  updateEvent(id: string, data: UpdateCalendarEventData): Promise<CalendarEvent>;

  /**
   * Get an event by ID.
   * @returns The selected event
   */
  getEventById(id: string): Promise<CalendarEvent>;

  /**
   * Delete an event.
   * CalendarService will handle clearing the state after deletion.
   */
  deleteEvent(id: string): Promise<void>;
}
```

### Services

#### `CalendarService` (Developer Reference)

Implements `TokenRingService` and is registered by the package plugin.

**Integration Points:**

- `ChatService` for calendar tools
- `AgentCommandService` for `/calendar ...` commands
- `ScriptingService` for scripting functions
- `RpcService` for RPC endpoints

### State Management

#### `CalendarState`

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
  show(): string;
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
}).prefault({ activeProvider: null, currentEvent: null });
```

### Types

#### `CalendarEvent`

```typescript
const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().exactOptional(),
  location: z.string().exactOptional(),
  startAt: z.date(),
  endAt: z.date(),
  allDay: z.boolean().exactOptional(),
  attendees: z.array(z.object({
    email: z.string(),
    name: z.string().exactOptional(),
    responseStatus: z.enum(["accepted", "declined", "tentative", "needsAction"]).exactOptional(),
  })).exactOptional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).exactOptional(),
  url: z.string().exactOptional(),
  meetingUrl: z.string().exactOptional(),
  createdAt: z.number().exactOptional(),
  updatedAt: z.number().exactOptional(),
});

type CalendarEvent = z.input<typeof CalendarEventSchema>;
```

#### `CalendarAttendee`

```typescript
interface CalendarAttendee {
  email: string;
  name?: string | undefined;
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
}
```

#### Filter Options

```typescript
interface CalendarEventFilterOptions {
  limit?: number | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
}

interface CalendarEventSearchOptions {
  query: string;
  limit?: number | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
}
```

#### Data Types

```typescript
type CreateCalendarEventData = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;
type UpdateCalendarEventData = Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>;
```

### Configuration Schemas

#### `CalendarConfigSchema`

```typescript
const CalendarConfigSchema = z.object({
  pollInterval: z.number().default(300).transform(seconds => seconds * 1000),
  agentDefaults: CalendarAgentConfigSchema.prefault({}),
});
```

#### `CalendarAgentConfigSchema`

```typescript
const CalendarAgentConfigSchema = z.object({
  provider: z.string().exactOptional(),
  watch: CalendarWatchSchema.exactOptional(),
}).default({});
```

#### `CalendarWatchSchema`

```typescript
const CalendarWatchSchema = z.object({
  checkInterval: z.number().int().positive().default(300),  // seconds
  lookbackMinutes: z.number().int().positive().default(15),  // how far back to check
  actions: z.array(z.object({
    pattern: z.string(),  // regex pattern
    command: z.string(),  // command to trigger
  })).default([]),
}).prefault({});
```

### RPC Endpoints

The package registers RPC endpoints under `/rpc/calendar`:

| Method | Type | Description |
|--------|------|-------------|
| `getCalendarProviders` | query | Get list of available calendar providers |
| `getUpcomingEvents` | query | Get upcoming events from a specific provider |
| `searchEvents` | query | Search events in a specific provider |
| `createEvent` | mutation | Create a new event in a specific provider |
| `updateEvent` | mutation | Update an event in a specific provider |
| `deleteEvent` | mutation | Delete an event from a specific provider |
| `getCalendarState` | query | Get calendar state for a specific agent |
| `updateCalendarState` | mutation | Update calendar state for a specific agent |

**Example RPC Usage:**

```typescript
// Get available providers
const providers = await rpcClient.call("getCalendarProviders", {});
// { providers: ["google-calendar", "outlook-calendar"] }

// Get upcoming events
const events = await rpcClient.call("getUpcomingEvents", {
  provider: "google-calendar",
  limit: 10,
});
// { events: [...], count: 10, message: "Found 10 upcoming events" }

// Create event
const result = await rpcClient.call("createEvent", {
  provider: "google-calendar",
  title: "Team sync",
  startAt: "2026-03-10T17:00:00.000Z",
  endAt: "2026-03-10T17:30:00.000Z",
  description: "Weekly status sync",
});
// { event: {...}, message: "Created event: event-id" }
```

### Usage Examples

#### Plugin Installation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import CalendarPlugin from "@tokenring-ai/calendar/plugin";

const app = new TokenRingApp();
app.usePlugin(CalendarPlugin, {
  calendar: {
    agentDefaults: {
      provider: "google-calendar",
    },
  },
});
```

#### Programmatic Usage

```typescript
import { CalendarService } from "@tokenring-ai/calendar";

// Get service from agent
const calendarService = agent.requireServiceByType(CalendarService);

// List upcoming events
const events = await calendarService.getUpcomingEvents({ limit: 10 }, agent);

// Search events
const results = await calendarService.searchEvents({ query: "team sync", limit: 5 }, agent);

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

#### Provider Registration

Concrete providers register themselves with the service:

```typescript
import type { CalendarProvider } from "@tokenring-ai/calendar";

const myProvider: CalendarProvider = {
  description: "My Calendar Provider",

  async getUpcomingEvents(filter): Promise<CalendarEvent[]> {
    // Return events from provider
    return events;
  },

  async searchEvents(filter): Promise<CalendarEvent[]> {
    // Search events
    return results;
  },

  async createEvent(data): Promise<CalendarEvent> {
    // Create event via provider API
    return createdEvent;
  },

  async updateEvent(id, data): Promise<CalendarEvent> {
    // Update event via provider API
    return updatedEvent;
  },

  async getEventById(id): Promise<CalendarEvent> {
    // Get event by ID
    return event;
  },

  async deleteEvent(id): Promise<void> {
    // Delete event via provider API
  },
};

// Register the provider
const calendarService = app.requireService(CalendarService);
calendarService.registerCalendarProvider("my-provider", myProvider);
```

### Watch Functionality

Calendar watches enable automated monitoring and command triggering based on event patterns.

#### How Watches Work

1. When `watch` is configured in agent defaults, the service starts a background task
2. The task periodically checks for new events within the lookback window
3. New events are matched against configured patterns
4. Matching events trigger the associated commands as user input

#### Example Watch Configuration

```yaml
calendar:
  agentDefaults:
    provider: google-calendar
    watch:
      checkInterval: 300  # Check every 5 minutes
      lookbackMinutes: 15  # Look back 15 minutes for new events
      actions:
        - pattern: "team sync"  # Match events with "team sync" in title/description
          command: "/calendar event info"  # Show event details
        - pattern: "urgent.*meeting"
          command: "Flag this meeting for immediate attention"
```

#### Pattern Matching

Events are formatted for pattern matching as:

```text
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

### Scripting Functions

The package registers the following functions with the `ScriptingService`:

#### `getUpcomingCalendarEvents(limit?: string)`

Get upcoming calendar events.

```typescript
const events = await getUpcomingCalendarEvents("10");
const eventsArray = JSON.parse(events);
```

#### `searchCalendarEvents(query: string, limit?: string)`

Search calendar events.

```typescript
const results = await searchCalendarEvents("team sync", "5");
const eventsArray = JSON.parse(results);
```

#### `createCalendarEvent(title: string, startIso: string, endIso: string, description?: string)`

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

#### `deleteCurrentCalendarEvent()`

Delete the current calendar event.

```typescript
const result = await deleteCurrentCalendarEvent();
// Returns: "Deleted current calendar event"
```

### Testing and Development

The package uses `vitest` for unit testing.

```bash
bun run build
bun run test
bun run test:watch
bun run test:coverage
```

#### Package Structure

```text
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
- `@tokenring-ai/rpc` - RPC system for external operations
- `@tokenring-ai/scripting` - Scripting function registration
- `@tokenring-ai/utility` - Utility helpers including `KeyedRegistry`
- `zod` - Schema validation

## Related Components

- `@tokenring-ai/chat` - Chat system for tool and command integration
- `@tokenring-ai/agent` - Agent framework for service management
- `@tokenring-ai/scripting` - Scripting function registration
- `@tokenring-ai/app` - Plugin system and service registry
- `@tokenring-ai/rpc` - RPC system for external operations

## License

MIT License - see LICENSE file for details.
