# @tokenring-ai/cli

The `@tokenring-ai/cli` package provides a comprehensive command-line interface for interacting with TokenRing AI agents. This terminal-based interface enables users to manage agents, execute commands, and handle human interface requests with a rich, responsive UI using raw terminal rendering with ANSI escape codes.

## Overview

The CLI package integrates seamlessly with the TokenRing agent framework, providing an interactive terminal interface for agent communication. It supports real-time streaming of agent output, interactive input editing, command completion, file path completion, and handling of agent questions and interaction requests.

## Key Features

- **Raw Terminal UI**: Direct terminal rendering using ANSI escape codes for maximum compatibility
- **Agent Management**: Spawn, select, and interact with multiple agent types
- **Interactive Chat**: Real-time streaming of agent output with syntax highlighting and markdown formatting
- **Command History**: Navigate previous inputs with arrow keys and Ctrl+P/N
- **Auto-completion**: Command auto-completion with Tab navigation
- **File Path Completion**: Workspace file search using `@` syntax with arrow key navigation
- **Human Interface Handling**: Interactive handling of agent questions, follow-ups, and interaction requests
- **Responsive Layout**: Adapts to different terminal sizes with incremental rendering
- **Customizable Theme**: Full theming support for colors and styling
- **Background Loading Screen**: Optional loading screen while agents initialize
- **Graceful Shutdown**: Proper signal handling and cleanup with abort signals
- **Markdown Styling**: Applied markdown formatting to terminal output
- **Bracketed Paste**: Support for bracketed paste mode for efficient text input
- **Verbose Mode**: Toggle visibility of reasoning and artifact output
- **Model/Tools Selection**: Quick access to change agent configuration

## Core Components

### AgentCLI Service

The main service that manages CLI operations, including user input, agent selection, and interaction handling.

**Interface:**
```typescript
class AgentCLI implements TokenRingService {
  readonly name = "AgentCLI";
  description = "Command-line interface for interacting with agents";

  constructor(
    readonly app: TokenRingApp,
    readonly config: z.infer<typeof CLIConfigSchema>
  );

  async run(signal: AbortSignal): Promise<void>;
}
```

**Constructor Parameters:**
- `app`: The `TokenRingApp` instance to manage agents
- `config`: CLI configuration object matching `CLIConfigSchema`

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `run` | Starts the CLI interface and manages agent interactions | `signal: AbortSignal` | `Promise<void>` |

**Behavior:**
- Displays loading screen (if no auto-start agent configured)
- Presents agent selection screen
- Spawns selected agent and enters interaction loop
- Handles SIGINT for graceful shutdown
- Restarts agent selection after agent completion (unless `startAgent.shutdownWhenDone` is true)
- Supports automatic agent spawning with optional initial prompt
- Properly cleans up terminal state on exit

**Agent Loop Operations:**

The `AgentCLI` service uses an `AgentLoop` instance to handle individual agent interactions:

- **Event Processing**: Consumes agent events and renders them to the terminal
- **Execution State Sync**: Syncs with agent execution state to show appropriate UI indicators
- **Input Collection**: Gathers user input via the `RawChatUI` component
- **Human Request Handling**: Processes human interface requests from agents
- **Signal Handling**: Responds to abort signals and handles graceful shutdown

**Event Types Handled:**

| Event Type | Description |
|------------|-------------|
| `agent.created` | Display agent creation message |
| `agent.stopped` | Shutdown the interaction loop |
| `output.chat` | Stream chat output with formatting |
| `output.reasoning` | Stream reasoning output with formatting (when verbose) |
| `output.info/warning/error` | Display system messages |
| `output.artifact` | Display artifact information (when verbose) |
| `output.response` | Display response status |
| `input.received` | Display user input |
| `input.interaction` | Handle interaction requests |
| `cancel` | Display cancellation messages |

### AgentLoop Class

Handles the interactive loop for individual agents, managing input collection, event rendering, and human request handling.

**Interface:**
```typescript
class AgentLoop {
  constructor(
    readonly agent: Agent,
    readonly options: AgentLoopOptions
  );

  async run(externalSignal: AbortSignal): Promise<void>;
}
```

**AgentLoopOptions Interface:**
```typescript
interface AgentLoopOptions {
  availableCommands: CommandDefinition[];
  config: z.infer<typeof CLIConfigSchema>;
}
```

**Properties:**
- `agent`: The `Agent` instance to interact with
- `options`: Configuration including available commands and CLI config

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `run` | Starts the agent interaction loop | `externalSignal: AbortSignal` | `Promise<void>` |

**Event Handling:**
The `AgentLoop` processes the following agent events:
- `agent.created`: Display agent creation message
- `agent.stopped`: Shutdown the interaction loop
- `output.chat`: Stream chat output with formatting
- `output.reasoning`: Stream reasoning output with formatting
- `output.info/warning/error`: Display system messages
- `output.artifact`: Display artifact information
- `output.response`: Display response status
- `input.received`: Display user input
- `input.interaction`: Handle interaction requests

**State Management:**
- Tracks event cursor for incremental updates
- Subscribes to `AgentEventState` for real-time updates
- Handles abort signals for graceful cancellation
- Manages UI lifecycle with proper cleanup

### RawChatUI Class

The main chat UI component that handles terminal rendering, input editing, and interaction management. This is a raw terminal-based UI that works directly with ANSI escape codes for maximum compatibility and performance.

**Interface:**
```typescript
class RawChatUI {
  constructor(options: RawChatUIOptions);

  start(): void;
  stop(): void;
  renderEvent(event: AgentEventEnvelope): void;
  syncState(state: AgentEventState): void;
  flash(text: string, tone?: FlashMessage["tone"], durationMs?: number): void;
}
```

**RawChatUIOptions Interface:**
```typescript
interface RawChatUIOptions {
  agent: Agent;
  config: z.output<typeof CLIConfigSchema>;
  commands: CommandDefinition[];
  onSubmit: (message: string) => void;
  onOpenAgentSelection: () => void;
  onDeleteIdleAgent: () => void;
  onAbortCurrentActivity: () => boolean;
}
```

**Properties:**
- `chatEditor`: Multi-line input editor for chat messages
- `transcript`: Array of transcript entries showing conversation history
- `followupEditors`: Map of editors for follow-up interactions
- `questionSessions`: Map of inline question sessions
- `completionState`: Command completion state
- `fileSearchState`: File search state for `@` syntax

**Methods:**

| Method | Description | Parameters |
|--------|-------------|------------|
| `start` | Attaches terminal and starts rendering | - |
| `stop` | Detaches terminal and stops rendering | - |
| `renderEvent` | Renders an agent event to the transcript | `event: AgentEventEnvelope` |
| `syncState` | Synchronizes UI with agent state | `state: AgentEventState` |
| `flash` | Shows a temporary flash message | `text: string`, `tone?: FlashMessage["tone"]`, `durationMs?: number` |

**Keyboard Shortcuts:**
- `Ctrl+C`: Cancel current activity or exit the CLI
- `Ctrl+L`: Clear and replay the screen
- `Alt+A` / `F1`: Open agent selection
- `Alt+M` / `F3`: Open model selector
- `Alt+T` / `F2`: Open tools selector
- `Alt+V` / `F4`: Toggle verbose mode
- `Alt+Q` / `F6`: Toggle optional questions
- `Tab`: Command or file completion
- `Escape`: Cancel current activity or close picker
- `Ctrl+O`: Insert newline
- `Ctrl+P` / `Up`: Browse command history (previous)
- `Ctrl+N` / `Down`: Browse command history (next)
- `Up/Down`: Navigate completion lists
- `PageUp/PageDown`: Page through completion lists

**Input Editor Features:**
- Multi-line text editing with cursor navigation
- Word navigation (Alt+B/F)
- Line navigation (Home/End)
- Delete operations (Ctrl+U/K/W/D)
- Bracketed paste support
- History navigation with Ctrl+P/N and arrow keys

### Internal Utilities

The CLI package includes internal utilities that support the main functionality. These are not exported from the main package entry point but are available for internal use:

- **commandPrompt**: Provides a prompt implementation using a shared Node.js readline interface
- **PartialInputError**: Error class thrown when input is interrupted but contains non-empty buffer
- **applyMarkdownStyles**: Utility function that applies terminal-friendly styling to markdown text (available via `@tokenring-ai/cli/utility/applyMarkdownStyles`)

### applyMarkdownStyles Utility

Utility function that applies terminal-friendly styling to markdown text. Converts markdown syntax into ANSI-colored terminal output.

**Interface:**
```typescript
function applyMarkdownStyles(text: string): string
```

**Parameters:**
- `text`: Markdown-formatted text to style

**Returns:**
- Styled text with ANSI color codes

**Supported Markdown Elements:**

| Element | Markdown | Terminal Styling |
|---------|----------|------------------|
| Code blocks | ``` ```language ``` | Gray horizontal line with language |
| Horizontal rules | `---`, `***`, `___` | Gray line (60% of terminal width) |
| Unordered lists | `*`, `-`, `+` | Yellow bullet point |
| Ordered lists | `1.`, `2.` | Yellow number |
| Headings | `# Heading` | Bold + Underlined |
| Blockquotes | `> quote` | Gray vertical bar + italic |
| Bold | `**text**` or `__text__` | Bold |
| Italic | `*text*` or `_text_` | Italic |
| Strikethrough | `~~text~~` | Strikethrough |
| Inline code | `` `code` `` | White background, black text |
| Links | `[text](url)` | Cyan underlined text + gray URL |

**Usage:**
```typescript
import applyMarkdownStyles from '@tokenring-ai/cli/utility/applyMarkdownStyles';

const markdown = `
# Agent Status

## Overview
- Agent is running
- 5 tools enabled

### Code Example
\`\`\`typescript
const result = await agent.execute();
\`\`\`

> Note: This is a blockquote

**Important**: Always check the logs
`;

const styled = applyMarkdownStyles(markdown);
console.log(styled);
```

### InputEditor Class

Multi-line text editor component for chat input and follow-up responses.

**Features:**
- Cursor navigation with arrow keys
- Word navigation (Alt+B/F)
- Line navigation (Home/End)
- Delete operations (Backspace, Delete, Ctrl+U/K/W/D)
- Multi-line support with Enter
- Bracketed paste support

**Usage:**
```typescript
import InputEditor from '@tokenring-ai/cli/raw/InputEditor';

const editor = new InputEditor();
editor.setText('Hello, World!');
editor.insert('\nNew line');
console.log(editor.getText());
console.log(editor.getCursor());
```

### FileSearch Module

Workspace file search functionality for `@` syntax completion.

**Features:**
- Lazy-loading of workspace file index
- Fuzzy matching on file paths
- Keyboard navigation (Up/Down, PageUp/PageDown)
- Insert selected path with Tab or Enter
- Error handling for file system operations

**Usage:**
```typescript
import { findActiveFileSearchToken, getFileSearchMatches } from '@tokenring-ai/cli/raw/FileSearch';

// Find file search token in input
const token = findActiveFileSearchToken(input, cursor);
if (token) {
  const matches = getFileSearchMatches(workspaceFiles, token.query, 48);
  // Display matches and allow selection
}
```

### InlineQuestions Module

Handles inline question sessions for agent interaction requests.

**Features:**
- Text input questions
- Tree selection questions
- File selection questions
- Form-based multi-field questions
- Auto-submit with timer support
- Optional question picker

**Usage:**
```typescript
import { createInlineQuestionSession } from '@tokenring-ai/cli/raw/InlineQuestions';

const session = createInlineQuestionSession(question, {
  onSubmit: (result) => console.log('Response:', result),
  onCancel: () => console.log('Cancelled'),
  onRender: () => render(),
  listFileSelectEntries: (path) => listDirectory(path),
}, question.message);

// Handle keypress
session.handleKeypress(input, key);
```

### CommandCompletions Module

Command auto-completion functionality for the CLI.

**Features:**
- Context-aware command completion
- Tab navigation through matches
- Insert selected command with Tab or Enter
- Description preview for selected command

**Usage:**
```typescript
import { getCommandCompletionContext } from '@tokenring-ai/cli/raw/CommandCompletions';

const context = getCommandCompletionContext(input, cursor, commands);
if (context) {
  const matches = context.matches;
  // Display matches and allow selection
}
```

### NativeScreens Module

Contains loading screen and agent selection screen implementations.

**LoadingScreen:**
Displays a loading screen with animated spinner and configurable banner while the application initializes.

**Features:**
- Animated spinner with progress (braille spinner animation)
- Responsive banner selection based on terminal width (wide/narrow/compact)
- Random loading messages from a curated list
- Automatic width detection for banner selection
- Abort signal support for graceful cancellation

**AgentSelectionScreen:**
The main screen for selecting, spawning, or connecting to agents.

**Features:**
- **Spawn Agents**: Create new agent instances from available configurations in `AgentManager`
- **Connect to Agents**: Connect to already running agents from `AgentManager`
- **Open Web Applications**: Launch web browsers connected to SPA resources from `WebHostService`
- **Run Workflows**: Execute predefined workflows from `WorkflowService`

**Action Types:**

| Action | Format | Description |
|--------|--------|-------------|
| Spawn | `spawn:agentType` | Create a new agent of the specified type |
| Connect | `connect:agentId` | Connect to an existing running agent |
| Open | `open:url` | Open a web application in the system browser |
| Workflow | `workflow:workflowKey` | Execute a workflow and spawn an agent |

**Preview Panel:**
- Shows agent description and enabled tools when hovering over spawn options
- Displays agent status (idle/running) for connected agents
- Shows workflow description for workflow options
- Shows web application URL for SPA resources

**Agent Selection Categories:**

The selection screen organizes options into categories:

1. **Web Application**: SPA resources from `WebHostService`
2. **Running Agents**: Currently active agents from `AgentManager`
3. **Agent Types**: Configurable agent types (category defined in agent config)
4. **Workflows**: Available workflows from `WorkflowService`

**Keyboard Navigation:**
- Up/Down arrows or j/k: Move selection
- Enter: Confirm selection
- Escape/q: Cancel and quit
- Ctrl+C: Interrupt and quit

## Services

### AgentCLI

The CLI package implements the `TokenRingService` interface through the `AgentCLI` class.

**Service Registration:**
```typescript
import TokenRingApp from '@tokenring-ai/app';
import AgentCLI from '@tokenring-ai/cli';

const app = new TokenRingApp();

app.addServices(new AgentCLI(app, {
  chatBanner: 'TokenRing CLI',
  loadingBannerNarrow: 'Loading...',
  loadingBannerWide: 'Loading TokenRing CLI...',
  loadingBannerCompact: 'Loading',
  screenBanner: 'TokenRing CLI',
  verbose: false,
}));

await app.start();
```

**Service Behavior:**

The `AgentCLI` service manages the complete CLI lifecycle:

1. **Loading Screen**: Displays a loading screen while the application initializes (unless `startAgent` is configured)
2. **Agent Selection**: Presents an interactive agent selection screen with categories for:
   - Web Applications (SPAs hosted by `WebHostService`)
   - Running Agents (existing agents from `AgentManager`)
   - Agent Types (spawnable agent configurations)
   - Workflows (executable workflows from `WorkflowService`)
3. **Agent Spawning**: Creates new agents or connects to existing ones based on selection
4. **Interaction Loop**: Manages the agent interaction loop via `AgentLoop`
5. **Signal Handling**: Handles SIGINT for graceful shutdown
6. **Agent Lifecycle**: After agent completion, returns to agent selection (unless `startAgent.shutdownWhenDone` is true)
7. **Cleanup**: Properly restores terminal state on exit

## Configuration

The CLI plugin supports configuration options that define the user interface behavior and appearance.

**Configuration Schema:**
```typescript
const CLIConfigSchema = z.object({
  chatBanner: z.string(),
  loadingBannerNarrow: z.string(),
  loadingBannerWide: z.string(),
  loadingBannerCompact: z.string(),
  screenBanner: z.string(),
  uiFramework: z.enum(['ink', 'opentui']).default('opentui'),
  verbose: z.boolean().default(false),
  startAgent: z.object({
    type: z.string(),
    prompt: z.string().optional(),
    shutdownWhenDone: z.boolean().default(true),
  }).optional(),
});
```

**Configuration Options:**

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `chatBanner` | string | Yes | - | Banner message displayed during agent chat sessions |
| `loadingBannerNarrow` | string | Yes | - | Banner for narrow terminal windows during loading |
| `loadingBannerWide` | string | Yes | - | Banner for wide terminal windows during loading |
| `loadingBannerCompact` | string | Yes | - | Banner for compact terminal layouts during loading |
| `screenBanner` | string | Yes | - | Banner message displayed on all interactive screens |
| `uiFramework` | 'ink' \| 'opentui' | No | 'opentui' | UI rendering framework to use (currently only raw terminal is implemented) |
| `verbose` | boolean | No | false | Enable verbose output including reasoning and artifacts |
| `startAgent` | object | No | undefined | Optional agent to automatically spawn on startup |
| `startAgent.type` | string | If startAgent | - | Agent type to spawn |
| `startAgent.prompt` | string | If startAgent | undefined | Initial prompt to send to the agent |
| `startAgent.shutdownWhenDone` | boolean | If startAgent | true | Whether to shutdown after agent completes |

**Configuration Example:**
```typescript
const config = {
  cli: {
    chatBanner: 'TokenRing CLI',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
    uiFramework: 'opentui',
    verbose: true,
    startAgent: {
      type: 'coder',
      prompt: 'Write a function to calculate Fibonacci',
      shutdownWhenDone: true,
    },
  },
};
```

## Keyboard Shortcuts

The CLI provides comprehensive keyboard shortcuts for efficient interaction:

### General Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current activity or shut down idle agent |
| `Ctrl+L` | Clear and replay the screen (full replay) |
| `Alt+A` / `F1` | Open agent selection screen |
| `Escape` | Cancel current activity or close picker |

### Model and Tools

| Shortcut | Action |
|----------|--------|
| `Alt+M` / `F3` | Trigger "model select" command (opens model selector) |
| `Alt+T` / `F2` | Trigger "tools select" command (opens tools selector) |
| `Alt+V` / `F4` | Toggle verbose mode (show/hide reasoning and artifacts) |

### Questions and Interactions

| Shortcut | Action |
|----------|--------|
| `Alt+Q` / `F6` | Toggle optional questions picker |

### Input Editing

| Shortcut | Action |
|----------|--------|
| `Tab` | Command completion or insert selected file search match |
| `Ctrl+O` / `Meta+Enter` / `Shift+Enter` | Insert newline |
| `Ctrl+P` / `Up` | Browse command history (previous) or move up in completions |
| `Ctrl+N` / `Down` | Browse command history (next) or move down in completions |
| `PageUp` / `PageDown` | Page through completions |
| `Ctrl+A` | Move to start of line |
| `Ctrl+E` | Move to end of line |
| `Ctrl+U` | Delete to start of line |
| `Ctrl+K` | Delete to end of line |
| `Ctrl+W` | Delete word backward |
| `Ctrl+D` | Delete forward |
| `Alt+B` | Move word left |
| `Alt+F` | Move word right |
| `Home` | Move to start of line |
| `End` | Move to end of line |
| `Backspace` | Delete character before cursor |
| `Delete` | Delete character after cursor |

### Completion Navigation

When command completion or file search is active:

| Shortcut | Action |
|----------|--------|
| `Up/Down` | Navigate through matches |
| `PageUp/PageDown` | Page through matches (5 at a time) |
| `Tab` / `Enter` | Insert selected match |
| `Escape` | Dismiss completion/search |

## Input Handling

The CLI package handles interactive input through the `RawChatUI` class, which supports various agent interaction types.

### Chat Input

The main chat input supports:

- **Multi-line text editing**: Use `Ctrl+O`, `Meta+Enter`, or `Shift+Enter` to insert newlines
- **Command completion**: Type `/` to trigger command auto-completion
- **File path completion**: Type `@` to trigger workspace file search
- **History navigation**: Use `Ctrl+P/N` or arrow keys when at the first/last line

### File Search (`@` syntax)

Type `@` followed by a search query to find files in the workspace:

```
# Example usage in chat input:
Write code for @utils/helper.ts
```

**Features:**
- Real-time indexing of workspace files via `FileSystemService.glob()`
- Scoring-based match ranking (exact matches, path depth, character sequences)
- Navigation with `Up/Down` arrow keys or `Ctrl+P/N`
- Page navigation with `PageUp/PageDown`
- Insert selected path with `Tab` or `Enter`
- Dismiss with `Escape`

### Command Completion (`/` syntax)

Type `/` at the start of a line to trigger command auto-completion:

```
# Example usage:
/agen  # Shows: /agent <description>
```

**Features:**
- Auto-completion for all registered commands from `AgentCommandService`
- Navigation with `Up/Down` arrow keys or `Ctrl+P/N`
- Page navigation with `PageUp/PageDown`
- Insert selected command with `Tab` or `Enter`
- Dismiss with `Escape`

### Question Types

The CLI supports the following question types from agents via `ParsedInteractionRequest`:

| Type | Description | Interaction |
|------|-------------|-------------|
| **Text Input** | Multi-line text input with cursor navigation | Enter to submit, Alt+Enter for newline, Esc to cancel |
| **Tree Select** | Hierarchical tree selection for structured choices | Arrows to navigate, Space to toggle, Enter to submit, Right/Left to expand/collapse |
| **File Select** | File system browser for file/directory selection | Arrows to navigate, Space to expand/select directories, Enter to submit, Right/Left to expand/collapse |
| **Form** | Multi-section forms combining multiple field types | Navigate through fields with Enter, Esc to cancel current section |
| **Followup** | Simple follow-up prompts for additional input | Enter to submit, Alt+Enter/Shift+Enter for newline |

All question handling is done inline in the terminal with responsive layout adaptation. Optional questions can be accessed via `Alt+Q` / `F6`.

## Theme Configuration

The CLI uses a color theme defined in `theme.ts` that controls the appearance of all UI elements.

**Theme Properties:**

```typescript
const theme = {
  // Agent selection
  agentSelectionBanner: '#ffffff',
  agentSelectionBannerBackground: '#2c2c2c',

  // Question screen
  questionScreenBanner: '#ffffff',
  questionScreenBannerBackground: '#cf6e32',

  // General panel background style
  panelBackground: '#1e1e1e',
  screenBackground: '#1e1e1e',

  // Ask screen
  askMessage: '#00BCD4FF',

  // Confirmation screen
  confirmYes: '#66BB6AFF',
  confirmNo: '#EF5350FF',
  confirmInactive: '#9E9E9EFF',
  confirmTimeout: '#FFEB3BFF',

  // Chat styles
  chatOutputText: '#66BB6AFF',
  chatReasoningText: '#FFEB3BFF',
  chatPreviousInput: '#8c6ac6',
  chatSystemInfoMessage: '#64B5F6FF',
  chatSystemWarningMessage: '#FFEB3BFF',
  chatSystemErrorMessage: '#EF5350FF',
  chatDivider: '#9E9E9EFF',
  chatSpinner: '#FFEB3BFF',
  chatInputReceived: '#6699CCFF',
  chatInputHandledSuccess: '#99CC99FF',
  chatQuestionRequest: '#00BCD4FF',
  chatQuestionResponse: '#00BCD4FF',
  chatReset: '#AB47BCFF',
  chatAbort: '#EF5350FF',

  // Box styles
  boxTitle: '#FFF176FF',

  // Tree Selection screen
  treeMessage: '#00BCD4FF',
  treePartiallySelectedItem: '#FFF176FF',
  treeFullySelectedItem: '#66BB6AFF',
  treeNotSelectedItem: '#9E9E9EFF',
  treeHighlightedItem: '#FFEB3BFF',
  treeTimeout: '#FFEB3BFF',

  // Loading screen
  loadingScreenBackground: '#27292c',
  loadingScreenBannerBackground: '#2c2e32',
  loadingScreenText: '#f0f9ff',
} as const;
```

**Theme Usage:**

The theme is automatically applied to all UI components:
- **Terminal output**: Uses `chalk.hex()` with theme values
- **UI elements**: Theme colors are applied consistently across all screens

## Integration

### Integration with Agent System

The CLI integrates with the agent system through:

1. **Agent Selection**: Presents available agents from `AgentManager` service
2. **Event Subscription**: Subscribes to `AgentEventState` for real-time updates
3. **Input Handling**: Sends user input via `agent.handleInput()`
4. **Question Responses**: Sends responses to agent questions via `agent.sendInteractionResponse()`
5. **Command Registration**: Registers chat commands via `AgentCommandService`

### Integration with WebHostService

The CLI integrates with `WebHostService` to display and launch web applications:

```typescript
// WebHostService provides SPA resources that appear in the agent selection screen
// Selecting a web application option opens it in the system browser
```

### Integration with WorkflowService

The CLI integrates with `WorkflowService` to execute workflows:

```typescript
// Workflows appear in the agent selection screen under "Workflows" category
// Selecting a workflow spawns an agent running that workflow
```

### Plugin Registration

```typescript
import cliPlugin from '@tokenring-ai/cli';

app.install(cliPlugin, {
  cli: {
    chatBanner: 'TokenRing CLI',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
    verbose: false,
  },
});
```

### Service Registration

```typescript
import AgentCLI from '@tokenring-ai/cli';

app.addServices(new AgentCLI(app, {
  chatBanner: 'TokenRing CLI',
  loadingBannerNarrow: 'Loading...',
  loadingBannerWide: 'Loading TokenRing CLI...',
  loadingBannerCompact: 'Loading',
  screenBanner: 'TokenRing CLI',
  verbose: false,
}));
```

### Command Registration

The plugin automatically registers commands with `AgentCommandService`:

```typescript
// In plugin.ts
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(agentCommands)
);
```

## State Management

The CLI package manages the following state components through the agent system:

- **AgentEventCursor**: Tracks current position in the event stream
- **AgentEventState**: Manages agent event history and rendering state
- **AgentExecutionState**: Tracks agent execution status and active operations
- **CommandHistoryState**: Manages input history for command completion

**State Integration:**
```typescript
// Access event state
const eventState = agent.getState(AgentEventState);

// Get events since last cursor position
const events = eventState.yieldEventsByCursor(cursor);

// Update cursor after processing
cursor = eventState.getEventCursorFromCurrentPosition();
```

## Usage Examples

### Basic CLI Usage with Plugin

```typescript
import TokenRingApp from '@tokenring-ai/app';
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();

const config = {
  cli: {
    chatBanner: 'TokenRing CLI',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
    verbose: false,
  },
};

app.install(cliPlugin, config);
await app.start();
```

### Manual CLI Usage (without plugin)

```typescript
import TokenRingApp from '@tokenring-ai/app';
import AgentCLI from '@tokenring-ai/cli';

const app = new TokenRingApp();

app.addServices(new AgentCLI(app, {
  chatBanner: 'TokenRing CLI',
  loadingBannerNarrow: 'Loading...',
  loadingBannerWide: 'Loading TokenRing CLI...',
  loadingBannerCompact: 'Loading',
  screenBanner: 'TokenRing CLI',
  verbose: false,
}));

await app.start();
```

### Starting a Specific Agent

```typescript
const config = {
  cli: {
    chatBanner: 'TokenRing CLI',
    verbose: false,
    startAgent: {
      type: 'coder',
      prompt: 'Help me debug this issue...',
      shutdownWhenDone: false, // Keep agent running after completion
    },
  },
};
```

### Enable Verbose Mode

```typescript
const config = {
  cli: {
    chatBanner: 'TokenRing CLI',
    verbose: true, // Show reasoning and artifacts
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
  },
};
```

### Custom Theme Usage

```typescript
import { theme } from '@tokenring-ai/cli/theme';
import chalk from 'chalk';

// Access theme colors for custom components
const successColor = theme.chatOutputText;
const warningColor = theme.chatSystemWarningMessage;
const errorColor = theme.chatSystemErrorMessage;

const errorText = chalk.hex(errorColor)('Error occurred');
```

### Using Abort Signals

```typescript
const abortController = new AbortController();

try {
  const input = await commandPrompt({
    rl,
    message: 'Enter input:',
    signal: abortController.signal,
  });
  
  console.log('Input:', input);
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    console.log('Input was aborted');
  }
}
```

## Best Practices

### Signal Handling

Always pass abort signals to long-running operations:

```typescript
async function handleUserInput(signal: AbortSignal) {
  try {
    const input = await commandPrompt({
      rl,
      message: '>',
      signal,
    });
    // Process input
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Handle abort gracefully
    }
  }
}
```

### Responsive Layout

The UI automatically adapts to terminal size. Handle minimum size requirements:

```typescript
// Check terminal size before rendering
const { columns, rows } = process.stdout;
if (columns < 40 || rows < 10) {
  console.log('Terminal too small. Resize to at least 40x10.');
  return;
}
```

### Error Handling

Handle errors gracefully in the agent loop:

```typescript
try {
  await agentLoop.run(signal);
} catch (error) {
  process.stderr.write(formatLogMessages(['Error while running agent loop', error as Error]));
  await setTimeout(1000);
}
```

### Theme Consistency

Use theme colors consistently across components:

```typescript
import { theme } from '@tokenring-ai/cli/theme';
import chalk from 'chalk';

const errorText = chalk.hex(theme.chatSystemErrorMessage)('Error occurred');
```

### Markdown Styling

The CLI applies markdown styling to terminal output using `applyMarkdownStyles`:

```typescript
import applyMarkdownStyles from '@tokenring-ai/cli/utility/applyMarkdownStyles';

const styledText = applyMarkdownStyles('# Heading\n- Item 1\n- Item 2');
console.log(styledText);
```

### File Search Syntax

Use the `@` syntax for file path completion in the chat input:

```
# Type @ followed by a search query to find files
Write code for @utils/helper.ts
```

The file search will:
- Index all files in the workspace
- Show matches as you type
- Allow navigation with arrow keys
- Insert the selected path with Tab or Enter

### Terminal Requirements

The CLI requires a TTY terminal with minimum dimensions:

- **Minimum width**: 40 columns
- **Minimum height**: 10 rows

If the terminal is too small, the CLI will display a warning message and request resizing.

**Terminal Features Required:**
- TTY mode support
- Raw mode for keyboard input
- Bracketed paste mode
- ANSI escape code support
- SIGWINCH signal handling for resize detection

**Resize Handling:**
- The UI automatically detects terminal resize events
- Full screen replay is triggered on resize
- Content is reflowed to fit the new dimensions
- A throttle mechanism prevents excessive re-rendering during rapid resize

## Testing and Development

### Running Tests

```bash
# Run tests
bun test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

### Building

```bash
# Type check
bun run build
```

### Package Structure

The package uses TypeScript with ES modules:

```json
{
  "type": "module",
  "exports": {
    ".": "./index.ts",
    "./*": "./*.ts"
  },
  "types": "./dist-types/index.d.ts"
}
```

**Directory Structure:**
```
pkg/cli/
├── raw/                    # Raw terminal UI components (internal)
│   ├── CommandCompletions.ts      # Command completion logic and context extraction
│   ├── FileSearch.ts              # File search scoring, matching, and @-token handling
│   ├── InlineQuestions.ts         # Inline question session handling (text, tree, file, form)
│   ├── InputEditor.ts             # Multi-line text editor with cursor navigation
│   ├── NativeScreens.ts           # Loading screen and agent selection screen implementations
│   ├── RawChatUI.ts               # Main chat UI implementation with incremental rendering
│   └── *.test.ts                  # Test files for raw components
├── utility/               # Utility functions
│   └── applyMarkdownStyles.ts     # Markdown styling utility for terminal output
├── AgentCLI.ts            # Main CLI service implementing TokenRingService
├── AgentLoop.ts           # Agent interaction loop handler with event subscription
├── AgentSelection.ts      # Agent selection result types and parsing utilities
├── commandPrompt.ts       # Internal command prompt implementation (not exported)
├── index.ts               # Package exports (AgentCLI, CLIConfigSchema)
├── plugin.ts              # Plugin definition for app.install() integration
├── schema.ts              # Configuration schema definition (CLIConfigSchema)
├── theme.ts               # Color theme definitions for all UI elements
├── vitest.config.ts       # Vitest test configuration
└── package.json           # Package metadata
```

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/app` (0.2.0)
- `@tokenring-ai/ai-client` (0.2.0)
- `@tokenring-ai/chat` (0.2.0)
- `@tokenring-ai/agent` (0.2.0)
- `@tokenring-ai/utility` (0.2.0)
- `@tokenring-ai/web-host` (0.2.0)
- `@tokenring-ai/workflow` (0.2.0)
- `@tokenring-ai/filesystem` (0.2.0)
- `zod` (^4.3.6)
- `chalk` (^5.6.2)
- `open` (^11.0.0)

### Development Dependencies

- `vitest` (^4.1.1)
- `typescript` (^6.0.2)

## Related Components

- `@tokenring-ai/agent`: Agent framework for AI interactions
- `@tokenring-ai/app`: Application framework and plugin system
- `@tokenring-ai/chat`: Chat service and tool definitions
- `@tokenring-ai/utility`: Utility functions for formatting and string manipulation
- `@tokenring-ai/web-host`: Web server for serving resources and APIs
- `@tokenring-ai/workflow`: Workflow definition and execution service
- `@tokenring-ai/filesystem`: File system operations and directory tree navigation

## License

MIT License - see LICENSE file for details.
