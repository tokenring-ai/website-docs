# CLI Plugin

## Overview

The `@tokenring-ai/cli` package provides a comprehensive command-line interface for interacting with TokenRing AI agents. This terminal-based interface enables users to manage agents, execute commands, and handle human interface requests with a rich, responsive UI. The package supports two UI frameworks: **OpenTUI** (default) and **Ink**, allowing you to choose the rendering engine that best fits your needs.

## Key Features

- **Dual UI Framework Support**: Choose between OpenTUI (default) or Ink rendering engines
- **Agent Management**: Select, create, and connect to AI agents through an interactive selection screen
- **Interactive Chat**: Communicate with agents through a terminal interface with color-coded output
- **Built-in Commands**: Execute slash-prefixed commands like `/edit` and `/multi`
- **Human Interface Requests**: Handle text inputs, tree selections, file selections, and form submissions
- **Keyboard Navigation**: Use arrow keys for command history navigation, escape for cancel, Ctrl+C for agent switch or exit
- **Real-time Events**: Stream agent outputs (chat, reasoning, system messages) with color-coded formatting
- **Custom Screens**: Render interactive UI screens for various interaction types
- **Command History**: Input history with up/down arrow navigation
- **Auto-completion**: Command auto-completion for registered agent commands
- **Abort Signal Support**: Graceful handling of abort signals for canceling operations
- **Editor Integration**: Built-in editor commands for complex prompt creation using system editor (`EDITOR` environment variable)

## Core Components

### AgentCLI Service

The main service that manages CLI operations, including user input, agent selection, and interaction handling.

**Constructor:**
```typescript
import AgentCLI from "@tokenring-ai/cli";

const cli = new AgentCLI(app, {
  chatBanner: "TokenRing CLI",
  loadingBannerNarrow: "Loading...",
  loadingBannerWide: "Loading TokenRing CLI...",
  loadingBannerCompact: "Loading",
  screenBanner: "TokenRing CLI",
  uiFramework: "opentui" // or "ink"
});

// Start the CLI interface
await cli.run(signal);
```

**Key Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `run(signal)` | Starts the CLI interface and manages agent interactions | `signal: AbortSignal` | `Promise<void>` |

### AgentLoop Class

Handles agent execution loop and event streaming for a selected agent.

**Constructor:**
```typescript
constructor(
  readonly agent: Agent,
  readonly options: AgentLoopOptions
)
```

**Key Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `run(externalSignal)` | Main entry point for the agent loop | `externalSignal: AbortSignal` | `Promise<void>` |
| `shutdown()` | Shuts down the loop cleanly | - | `void` |
| `renderEvent(event)` | Renders a single agent event | `event: AgentEventEnvelope` | `void` |
| `redraw(state)` | Performs a full screen redraw | `state: AgentEventState` | `void` |

**AgentLoopOptions Interface:**
```typescript
export interface AgentLoopOptions {
  availableCommands: string[];
  rl: readline.Interface;
  config: z.infer<typeof CLIConfigSchema>;
}
```

### commandPrompt Function

Provides a prompt implementation using a shared Node.js readline interface.

**Interface:**
```typescript
export interface CommandPromptOptions {
  rl: readline.Interface;
  message: string;
  prefix?: string;
  history?: string[];
  autoCompletion?: string[] | ((line: string) => Promise<string[]> | string[]);
  signal?: AbortSignal;
}

export async function commandPrompt(options: CommandPromptOptions): Promise<string>
```

**Usage:**
```typescript
import {commandPrompt} from "@tokenring-ai/cli";

const answer = await commandPrompt({
  rl: readlineInterface,
  message: "Enter your prompt:",
  prefix: chalk.yellowBright("user"),
  history: [],
  autoCompletion: [],
});
```

### SimpleSpinner Class

Custom spinner class for loading states that integrates with abort signals. Uses a simple ASCII animation instead of a third-party library to avoid conflicts with signal handling.

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `start(message)` | Start the spinner animation | `message?: string` | `void` |
| `stop()` | Stop the spinner animation | - | `void` |
| `updateMessage(message)` | Update the spinner message | `message: string` | `void` |

### Plugin Configuration

The CLI plugin supports configuration options that define the user interface behavior and appearance. These options are defined in `schema.ts` as `CLIConfigSchema`.

**Configuration Example:**
```typescript
import cliPlugin from "@tokenring-ai/cli";

const config = {
  cli: {
    chatBanner: "TokenRing CLI",
    loadingBannerNarrow: "Loading...",
    loadingBannerWide: "Loading TokenRing CLI...",
    loadingBannerCompact: "Loading",
    screenBanner: "TokenRing CLI",
    uiFramework: "opentui", // or "ink"
    startAgent: {
      type: "coder",
      prompt: "Write a function to calculate Fibonacci",
      shutdownWhenDone: true
    }
  }
};

app.install(cliPlugin, config);
```

**Configuration Schema:**
```typescript
export const CLIConfigSchema = z.object({
  chatBanner: z.string(),
  loadingBannerNarrow: z.string(),
  loadingBannerWide: z.string(),
  loadingBannerCompact: z.string(),
  screenBanner: z.string(),
  uiFramework: z.enum(['ink', 'opentui']).default('opentui'),
  startAgent: z.object({
    type: z.string(),
    prompt: z.string().optional(),
    shutdownWhenDone: z.boolean().default(true),
  }).optional(),
})
```

**Configuration Options:**

- **chatBanner**: Banner message displayed during agent chat sessions (default: "TokenRing CLI")
- **loadingBannerNarrow**: Banner message for narrow terminal windows during loading (default: "Loading...")
- **loadingBannerWide**: Banner message for wide terminal windows during loading (default: "Loading TokenRing CLI...")
- **loadingBannerCompact**: Banner message for compact terminal layouts during loading (default: "Loading")
- **screenBanner**: Banner message displayed on all interactive screens (default: "TokenRing CLI")
- **uiFramework**: UI rendering framework to use - `'opentui'` (default) or `'ink'`
- **startAgent**: Optional agent to automatically spawn on startup
  - **type**: Agent type to spawn
  - **prompt**: Initial prompt to send to the agent
  - **shutdownWhenDone**: Whether to shutdown after agent completes (default: true)

## Chat Commands

The CLI package provides built-in chat commands for enhanced input capabilities:

### /edit Command

Opens your system's default editor to create or edit a prompt. Useful for complex prompts, code examples, or detailed instructions that benefit from proper formatting and editing capabilities.

**Usage:**
```bash
/edit [initial-text]
```

**Arguments:**
- **initial-text** (optional): Text to pre-fill in the editor

**Editor Selection:**
- Uses the `EDITOR` environment variable if set
- Falls back to `vi` on Unix/Linux systems
- Falls back to `notepad` on Windows systems

**Examples:**
```bash
/edit                    # Open editor with blank content
/edit Write a story...   # Open editor with initial text
/edit #include <stdio.h> # Start with code snippet
```

### /multi Command

Opens an editor for multiline input. The entered text will be processed as the next input.

**Usage:**
```bash
/multi
```

**Behavior:**
- Opens your system's default text editor (`EDITOR` environment variable)
- If no `EDITOR` is set, uses `vi` on Unix/Linux, `notepad` on Windows
- Save and close the editor to submit your text as input
- If you cancel or provide empty input, nothing will be sent

## UI Frameworks

The CLI supports two rendering frameworks that can be selected via the `uiFramework` configuration option:

### OpenTUI (Default)

- **Package**: `@opentui/react` and `@opentui/core`
- **Features**: Advanced terminal rendering with alternate screen buffer support
- **Components**: Uses `<box>` and `<text>` JSX elements
- **Hooks**: `useTerminalDimensions()`, `useKeyboard()`
- **Best for**: Full-featured terminal applications with complex layouts

### Ink

- **Package**: `ink`
- **Features**: React-based terminal rendering with simpler API
- **Components**: Uses `<Box>` and `<Text>` JSX elements (capitalized)
- **Hooks**: `useStdout()`, `useInput()`
- **Best for**: Simpler terminal UIs with React-like development experience

### Framework Selection

```typescript
// Use OpenTUI (default)
const config = {
  cli: {
    uiFramework: "opentui"
  }
};

// Use Ink
const config = {
  cli: {
    uiFramework: "ink"
  }
};
```

Both frameworks provide identical functionality and component interfaces. The choice is primarily based on preference and specific use case requirements.

## Screen Components

### AgentSelectionScreen

Interactive agent selection with tree interface. Supports spawning new agents, connecting to existing agents, opening web apps, and running workflows.

**Features:**
- Category-based organization (Spawners, Current Agents, Workflows, Web Apps)
- Preview pane showing agent details when highlighted
- Keyboard navigation with full keyboard support
- Responsive layout for narrow/short terminals

### LoadingScreen

Loading state indicator with dynamic banner display based on terminal width.

### QuestionInputScreen

Dynamic question input screen supporting multiple question types:

- Text questions with multi-line input
- Tree selection questions with hierarchical options
- File selection questions with file system browser
- Form questions with sequential field navigation

## Input Components

### TextInput

Text input field supporting multi-line input with keyboard navigation.

### TreeSelect

Hierarchical tree selection component with keyboard navigation and expand/collapse support.

### FileSelect

File system browser component for file/directory selection with recursive directory loading.

### FormInput

Multi-step form component with sequential field navigation and progress indicator.

## Theme Configuration

The CLI uses a color theme defined in `theme.ts` that controls the appearance of all UI elements:

```typescript
export const theme = {
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
  loadingScreenBackground: '#023683',
  loadingScreenBannerBackground: '#022f6c',
  loadingScreenText: '#f0f9ff',
} as const;
```

### Theme Usage

The theme is automatically applied to all UI components:

- **OpenTUI components**: Use `fg` and `backgroundColor` props with theme values
- **Ink components**: Use `color` and `backgroundColor` props with theme values
- **Terminal output**: Uses `chalk.hex()` with theme values

## Services

### AgentCLI Service

The main service that manages CLI operations, including user input, agent selection, and interaction handling.

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `run(signal)` | Starts the CLI interface and manages agent interactions | `signal: AbortSignal` | `Promise<void>` |

**Agent Loop Operations:**

The `AgentCLI` service uses an `AgentLoop` instance to handle individual agent interactions:

- **Event Processing**: Consumes agent events and renders them to the terminal
- **Execution State Sync**: Syncs with agent execution state to show appropriate UI indicators
- **Input Collection**: Gathers user input via the `commandPrompt` function
- **Human Request Handling**: Processes human interface requests from agents
- **Spinner Management**: Displays loading spinners during agent activity
- **Signal Handling**: Responds to abort signals and handles graceful shutdown

### AgentLoop Service

The `AgentLoop` class handles the interactive loop for individual agents, managing input collection, event rendering, and human request handling.

**Constructor:**
```typescript
constructor(
  readonly agent: Agent,
  readonly options: AgentLoopOptions
)
```

**Methods:**

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `run(signal)` | Starts the agent interaction loop | `signal: AbortSignal` | `Promise<void>` |
| `shutdown()` | Shuts down the loop cleanly | - | `void` |
| `renderEvent(event)` | Renders a single agent event | `event: AgentEventEnvelope` | `void` |
| `redraw(state)` | Performs a full screen redraw | `state: AgentEventState` | `void` |

## Providers

The CLI package does not define any providers that register with a KeyedRegistry.

## RPC Endpoints

The CLI package does not define any RPC endpoints.

## State Management

The CLI package manages the following state components through the agent system:

- **AgentEventCursor**: Tracks current position in the event stream
- **AgentEventState**: Manages agent event history and rendering state
- **AgentExecutionState**: Tracks agent execution status and active operations
- **CommandHistoryState**: Manages input history for command completion

## Integration

### Plugin Registration

The CLI is installed as a plugin through the app's plugin system:

```typescript
import cliPlugin from "@tokenring-ai/cli";

app.install(cliPlugin, {
  cli: {
    chatBanner: "TokenRing CLI",
    uiFramework: "opentui"
  }
});
```

### Agent Command Integration

The CLI plugin integrates with the `AgentCommandService` to register built-in chat commands:

```typescript
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(chatCommands)
);
```

### Agent Management Integration

The CLI service integrates with the `AgentManager` to spawn and manage agents:

```typescript
const agentManager = this.app.requireService(AgentManager);
initialAgent = await agentManager.spawnAgent({agentType: this.config.startAgent.type, headless: true});
```

## Usage Examples

### Basic CLI Usage as Plugin

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliPlugin from "@tokenring-ai/cli";

const app = new TokenRingApp();

const config = {
  cli: {
    chatBanner: "TokenRing CLI",
    loadingBannerNarrow: "Loading...",
    loadingBannerWide: "Loading TokenRing CLI...",
    loadingBannerCompact: "Loading",
    screenBanner: "TokenRing CLI",
    uiFramework: "opentui"
  }
};

app.install(cliPlugin, config);
await app.start();
```

### Manual CLI Usage (without plugin)

```typescript
import TokenRingApp from "@tokenring-ai/app";
import AgentCLI from "@tokenring-ai/cli";

const app = new TokenRingApp();

app.addServices(new AgentCLI(app, {
  chatBanner: "TokenRing CLI",
  loadingBannerNarrow: "Loading...",
  loadingBannerWide: "Loading TokenRing CLI...",
  loadingBannerCompact: "Loading",
  screenBanner: "TokenRing CLI",
  uiFramework: "opentui"
}));

await app.start();
```

### Starting a Specific Agent on Startup

```typescript
const config = {
  cli: {
    chatBanner: "TokenRing CLI",
    uiFramework: "opentui",
    startAgent: {
      type: "coder",
      prompt: "Help me debug this issue...",
      shutdownWhenDone: false // Keep agent running after completion
    }
  }
};
```

### Using Custom Command History

```typescript
import {commandPrompt} from "@tokenring-ai/cli";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const answer = await commandPrompt({
  rl,
  message: "Enter your prompt:",
  prefix: chalk.yellowBright("user"),
  history: ["previous command 1", "previous command 2"],
  autoCompletion: ["command1", "command2", "command3"],
});
```

## Best Practices

### Using Editor Commands

- Set your preferred editor using the `EDITOR` environment variable
- Use `/edit` for complex prompts that benefit from proper formatting
- Use `/multi` for multi-line input without external editor dependencies

### UI Framework Selection

- Use OpenTUI for full-featured terminal applications with complex layouts
- Use Ink for simpler terminal UIs with React-like development experience
- Consider terminal capabilities and performance requirements

### State Management

- The CLI manages state through the agent system
- Use `AgentEventCursor` to track event stream position
- Monitor `AgentExecutionState` for agent activity status

### Signal Handling

- Always pass an `AbortSignal` to CLI operations
- Handle partial input errors gracefully
- Use abort signals to cancel long-running operations

### Theme Customization

- Override theme colors by importing and modifying the theme object
- Use hex color values for precise color control
- Maintain consistency with the established color scheme

## Testing

The package uses vitest for unit testing:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Package Structure

```
pkg/cli/
├── components/                      # UI components (framework-specific)
│   └── inputs/                      # Input components
│       ├── FileSelect.tsx
│       ├── FormInput.tsx
│       ├── TextInput.tsx
│       └── types.ts
├── commands/                        # Chat command implementations
│   ├── edit.ts                      # /edit command implementation
│   └── multi.ts                     # /multi command implementation
├── hooks/                           # Shared React hooks
│   ├── useAbortSignal.ts            # Shared abort signal hook
│   └── useResponsiveLayout.ts       # Shared responsive layout
├── ink/                             # Ink-specific implementations
│   ├── components/                  # Ink UI components
│   ├── hooks/                       # Ink React hooks
│   ├── screens/                     # Ink screen components
│   │   ├── AgentSelectionScreen.tsx
│   │   ├── QuestionInputScreen.tsx
│   │   └── LoadingScreen.tsx
│   └── renderScreen.tsx             # Ink screen rendering
├── opentui/                         # OpenTUI-specific implementations
│   ├── components/                  # OpenTUI UI components
│   ├── hooks/                       # OpenTUI React hooks
│   ├── screens/                     # OpenTUI screen components
│   │   ├── AgentSelectionScreen.tsx
│   │   ├── QuestionInputScreen.tsx
│   │   └── LoadingScreen.tsx
│   └── renderScreen.tsx             # OpenTUI screen rendering
├── utility/                         # Utility functions
│   └── applyMarkdownStyles.ts       # Markdown styling utility
├── AgentCLI.ts                      # Main CLI service class
├── AgentLoop.ts                     # Agent interaction loop handler
├── commandPrompt.ts                 # Command prompt with history support
├── SimpleSpinner.ts                 # Spinner component for loading states
├── theme.ts                         # Color theme definitions
├── chatCommands.ts                  # Chat commands export
├── plugin.ts                        # Plugin definition
├── index.ts                         # Main entry point
├── schema.ts                        # Configuration schema definition
├── package.json
├── vitest.config.ts
└── README.md
```

### Key Files

- **AgentCLI.ts**: Main service class that coordinates CLI operations
- **AgentLoop.ts**: Handles the interaction loop for individual agents
- **commandPrompt.ts**: Provides readline-based input with history and completion
- **SimpleSpinner.ts**: Custom spinner implementation that integrates with abort signals
- **renderScreen.tsx** (both frameworks): Renders interactive UI screens
- **theme.ts**: Defines the color theme used throughout the CLI

## Dependencies

### Core Dependencies

- `@tokenring-ai/app` (0.2.0)
- `@tokenring-ai/agent` (0.2.0)
- `@tokenring-ai/chat` (0.2.0)
- `@tokenring-ai/utility` (0.2.0)
- `@tokenring-ai/web-host` (0.2.0)
- `@tokenring-ai/workflow` (0.2.0)
- `@tokenring-ai/filesystem` (0.2.0)
- `@tokenring-ai/rpc` (0.2.0)

### UI Frameworks

- `@opentui/core` (^0.1.80)
- `@opentui/react` (^0.1.80)
- `ink` (^6.6.0)
- `react` (^19.2.4)
- `fullscreen-ink` (^0.1.0)

### Prompt Handling

- `@inquirer/prompts` (^8.2.1)

### Utilities

- `chalk` (^5.6.2)
- `execa` (^9.6.1)
- `open` (^11.0.0)
- `zod` (^4.3.6)

### Development Dependencies

- `vitest` (^4.0.18)
- `typescript` (^5.9.3)
- `@types/react` (^19.2.14)

## Related Components

- `@tokenring-ai/agent`: Agent framework for AI interactions
- `@tokenring-ai/app`: Application framework and plugin system
- `@tokenring-ai/chat`: Chat service and tool definitions
- `@tokenring-ai/utility`: Utility functions for formatting and string manipulation
- `@tokenring-ai/rpc`: Remote procedure call utilities

## License

MIT License - see LICENSE file for details.
