# CLI Plugin

## Overview

The `@tokenring-ai/cli` package provides a comprehensive command-line interface for interacting with TokenRing AI agents. This terminal-based interface enables users to manage agents, execute commands, and handle human interface requests with a rich, responsive UI built on OpenTUI and React.

## Key Features

- **Agent Management**: Select, create, and connect to AI agents through an interactive selection screen
- **Interactive Chat**: Communicate with agents through a terminal interface with color-coded output
- **Built-in Commands**: Execute slash-prefixed commands like `/edit` and `/multi`
- **Human Interface Requests**: Handle text inputs, tree selections, file selections, and form submissions
- **Keyboard Navigation**: Use arrow keys for command history navigation, escape for cancel, Ctrl+C for agent switch or exit
- **Real-time Events**: Stream agent outputs (chat, reasoning, system messages) with color-coded formatting
- **Custom Screens**: Render interactive UI screens for various interaction types using OpenTUI and React
- **Command History**: Input history with up/down arrow navigation
- **Auto-completion**: Command auto-completion for registered agent commands
- **Abort Signal Support**: Graceful handling of abort signals for canceling operations

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
  screenBanner: "TokenRing CLI"
});

// Start the CLI interface
await cli.run();
```

**Installation as a Plugin:**
```typescript
import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {z} from "zod";
import AgentCLI from "@tokenring-ai/cli";
import chatCommands from "./chatCommands.ts";
import packageJSON from "./package.json" with {type: 'json'};
import {CLIConfigSchema} from "./schema.ts";

const packageConfigSchema = z.object({
  cli: CLIConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.cli) {
      // Register chat commands with AgentCommandService
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      // Add CLI service to the application
      app.addServices(new AgentCLI(app, config.cli));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### AgentLoop Service

Handles the main interaction loop for a selected agent, including event rendering, input gathering, and human interface request handling.

**Note:** The AgentLoop service is not exported from the main index - it's used internally by AgentCLI.

### CommandPrompt

A custom prompt implementation using Node.js readline interface with history and auto-completion support.

```typescript
import { commandPrompt, PartialInputError } from "./commandPrompt.ts";

const result = await commandPrompt({
  rl: readlineInterface,
  message: "Enter your input:",
  prefix: "user",
  history: ["previous command"],
  autoCompletion: ["/edit", "/multi"],
  signal: abortSignal,
});
```

### SimpleSpinner

A custom spinner class for rendering loading animations in the terminal without conflicting with signal handling.

```typescript
import { SimpleSpinner } from "./SimpleSpinner.ts";
import { theme } from "./theme.ts";

const spinner = new SimpleSpinner("Processing...", theme.chatSpinner);
spinner.start();
spinner.stop();
```

### Theme

Color theme configuration for the CLI interface.

```typescript
import { theme } from "./theme.ts";

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

## Chat Commands

The following commands are registered with the AgentCommandService:

| Command | Description | Usage |
|---------|-------------|-------|
| `/edit` | Open system editor for prompt creation | `/edit [text]` |
| `/multi` | Open editor for multiline input | `/multi` |

### /edit Command

Opens your system's default text editor to create or edit a prompt.

**Usage:**
```
/edit [initial-text]
```

**Arguments:**
- `initial-text` (optional): Text to pre-fill in the editor

**Behavior:**
- Creates a temporary file for editing
- Opens your configured editor (uses `EDITOR` environment variable or defaults to `vi`/`notepad`)
- When you save and close the editor, the content is sent as input to the current agent
- The temporary file is automatically cleaned up after use

**Examples:**
```
/edit                    # Open editor with blank content
/edit Write a story...   # Open editor with initial text
/edit #include <stdio.h> # Start with code snippet
```

**Editor Selection:**
- Uses the `EDITOR` environment variable if set
- Falls back to `vi` on Unix/Linux systems
- Falls back to `notepad` on Windows systems
- You can configure your preferred editor by setting `EDITOR`

**Tips:**
- Set `EDITOR=vim` in your shell config to use vim
- Set `EDITOR=code` in your shell config to use VS Code
- Use this for complex prompts that need formatting
- The editor will close automatically when you save

**Related Commands:**
- `/multi` - Open editor for multi-line input (simpler interface)

### /multi Command

Opens an editor for multiline input. The entered text will be processed as the next input.

**Usage:**
```
/multi
```

**Behavior:**
- Opens your system's default text editor (uses `EDITOR` environment variable or defaults to `vi`/`notepad`)
- Start with a blank editor or continue from previous input
- Save and close the editor to submit your text as input
- If you cancel or provide empty input, nothing will be sent

**Examples:**
```
/multi                    # Open editor with blank content
/multi Write a story...   # Open editor with initial text
```

**Tips:**
- Use this for complex code examples, long prompts, or detailed instructions that benefit from proper formatting
- The editor will automatically close when you save
- Your changes are only sent if you save the file

## Plugin Configuration

```typescript
import { z } from "zod";
import AgentCLI, { CLIConfigSchema } from "@tokenring-ai/cli";

const packageConfigSchema = z.object({
  cli: CLIConfigSchema.optional()
});

const config = {
  cli: {
    chatBanner: "TokenRing CLI",
    loadingBannerNarrow: "Loading...",
    loadingBannerWide: "Loading TokenRing CLI...",
    loadingBannerCompact: "Loading",
    screenBanner: "TokenRing CLI"
  }
};
```

### Configuration Schema

```typescript
export const CLIConfigSchema = z.object({
  chatBanner: z.string(),
  loadingBannerNarrow: z.string(),
  loadingBannerWide: z.string(),
  loadingBannerCompact: z.string(),
  screenBanner: z.string(),
});
```

### Configuration Options

- **chatBanner**: Banner message displayed during agent chat sessions
- **loadingBannerNarrow**: Banner message for narrow terminal windows during loading
- **loadingBannerWide**: Banner message for wide terminal windows during loading (default)
- **loadingBannerCompact**: Banner message for compact terminal layouts during loading
- **screenBanner**: Banner message displayed on all interactive screens

## Human Interface Requests

The CLI handles the following human interface request types through the QuestionInputScreen:

| Request Type | Description | Component |
|--------------|-------------|-----------|
| `text` | Multi-line text input | TextInput |
| `treeSelect` | Tree-based item selection | TreeSelect |
| `fileSelect` | File selection from filesystem | FileSelect |
| `form` | Form input with multiple fields | FormInput |

### Event Rendering

The CLI renders the following event types from the agent state:

| Event Type | Description | Color |
|------------|-------------|-------|
| `agent.created` | Agent creation notification | Blue (from `output.info`) |
| `output.chat` | Chat messages | Green (`theme.chatOutputText`) |
| `output.reasoning` | Agent reasoning | Yellow (`theme.chatReasoningText`) |
| `output.info` | System messages | Blue (`theme.chatSystemInfoMessage`) |
| `output.warning` | System warnings | Yellow (`theme.chatSystemWarningMessage`) |
| `output.error` | System errors | Red (`theme.chatSystemErrorMessage`) |
| `input.handled` | Input processing status | Error color if cancelled/error |
| `input.received` | User input echo | Purple (`theme.chatPreviousInput`) |

## Screen Components

### LoadingScreen

Displays a loading banner with automatic timeout (2 seconds). Shows different banners based on terminal width.

```typescript
import LoadingScreen from "./screens/LoadingScreen.tsx";
```

### AgentSelectionScreen

Interactive tree-based interface for:

- **Spawning agents**: Create new agents by type
- **Connecting to agents**: Connect to existing running agents
- **Web applications**: Launch web applications via web host service
- **Running workflows**: Execute predefined workflows

```typescript
import AgentSelectionScreen from "./screens/AgentSelectionScreen.tsx";
```

### QuestionInputScreen

Displays human interface request prompts with appropriate input components.

```typescript
import QuestionInputScreen from "./screens/QuestionInputScreen.tsx";
```

#### TextInput Component

Simple text input with Ctrl+D to submit, Esc to cancel.

```typescript
import TextInput from "./components/inputs/TextInput.tsx";
```

#### TreeSelect Component

Hierarchical tree-based selection with single or multiple selection modes.

```typescript
import TreeSelect from "./components/inputs/TreeSelect.tsx";
```

#### FileSelect Component

File browser with directory navigation.

```typescript
import FileSelect from "./components/inputs/FileSelect.tsx";
```

#### FormInput Component

Multi-section form with auto-advance between fields.

```typescript
import FormInput from "./components/inputs/FormInput.tsx";
```

## Usage Examples

### Basic CLI Usage as Plugin

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliPlugin from "@tokenring-ai/cli";

// Create and configure the app
const app = new TokenRingApp();

// Plugin configuration
const config = {
  cli: {
    chatBanner: "TokenRing CLI",
    loadingBannerNarrow: "Loading...",
    loadingBannerWide: "Loading TokenRing CLI...",
    loadingBannerCompact: "Loading",
    screenBanner: "TokenRing CLI"
  }
};

app.install(cliPlugin, config);

// Start the CLI - this will block and run interactively
await app.start();
```

### Manual CLI Usage (without plugin)

```typescript
import TokenRingApp from "@tokenring-ai/app";
import AgentCLI from "@tokenring-ai/cli";

// Create and configure the app
const app = new TokenRingApp();

// Add CLI service with configuration
app.addServices(new AgentCLI(app, {
  chatBanner: "TokenRing CLI",
  loadingBannerNarrow: "Loading...",
  loadingBannerWide: "Loading TokenRing CLI...",
  loadingBannerCompact: "Loading",
  screenBanner: "TokenRing CLI"
}));

// Start the CLI
await app.start();
```

### Custom Command Integration

```typescript
import { Agent } from "@tokenring-ai/agent";
import { TokenRingAgentCommand } from "@tokenring-ai/agent/types";

const description: string = "/custom - Execute custom functionality";

async function execute(args: string, agent: Agent): Promise<void> {
  // Command implementation
  agent.handleInput({message: `Custom command: ${args}`});
}

const help: string = `# /custom - Execute custom functionality

## Description
Execute custom functionality with the provided arguments.

## Usage
/custom [arguments]

## Examples
/custom hello world`;

export default {
  description,
  execute,
  help,
} satisfies TokenRingAgentCommand;
```

### Add Custom Command to CLI

```typescript
import chatCommands from "./chatCommands.ts";
import { TokenRingAgentCommand } from "@tokenring-ai/agent/types";

// Create your custom command
const myCommand: TokenRingAgentCommand = {
  description: "/mycommand - Description of your command",
  async execute(args: string, agent: Agent): Promise<void> {
    // Command implementation
    agent.handleInput({ message: args });
  },
  help: `# /mycommand - Description

## Description
Detailed description of the command.

## Usage
/mycommand [arguments]

## Examples
/mycommand example`
};

// Add to existing commands
chatCommands.mycommand = myCommand;

// Register with AgentCommandService in plugin.ts
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(chatCommands)
);
```

## Package Structure

```
pkg/cli/
├── components/
│   └── inputs/
│       ├── TextInput.tsx            # Text input component
│       ├── TreeSelect.tsx           # Tree selection component
│       ├── FileSelect.tsx           # File selection component
│       ├── FormInput.tsx            # Form input component
│       └── types.ts                 # Component prop types
├── commands/
│   ├── edit.ts                      # /edit command implementation
│   └── multi.ts                     # /multi command implementation
├── hooks/
│   ├── useAbortSignal.ts            # Abort signal management hook
│   └── useResponsiveLayout.ts       # Responsive layout management
├── screens/
│   ├── AgentSelectionScreen.tsx     # Agent selection interface
│   ├── LoadingScreen.tsx            # Initial loading screen
│   └── QuestionInputScreen.tsx      # Human interface request handling
├── utility/
│   └── applyMarkdownStyles.ts       # Markdown styling utility
├── AgentCLI.ts                      # Main CLI service class
├── AgentLoop.ts                     # Agent interaction loop handler
├── commandPrompt.ts                 # Command prompt with history support
├── renderScreen.tsx                 # Screen rendering utility
├── SimpleSpinner.ts                 # Spinner component for loading states
├── theme.ts                         # Color theme definitions
├── chatCommands.ts                  # Chat commands export
├── plugin.ts                        # Plugin definition
├── index.ts                         # Main entry point (exports AgentCLI and CLIConfigSchema)
├── schema.ts                        # Configuration schema definition
├── package.json
├── vitest.config.ts
└── README.md
```

## Dependencies

### Core Dependencies

- `@tokenring-ai/app` (0.2.0)
- `@tokenring-ai/agent` (0.2.0)
- `@tokenring-ai/chat` (0.2.0)
- `@tokenring-ai/utility` (0.2.0)

### UI Framework

- `@opentui/core` (^0.1.72)
- `@opentui/react` (^0.1.72)
- `react` (catalog)

### Prompt Handling

- `@inquirer/prompts` (^8.2.0)

### Utilities

- `chalk` (^5.6.2)
- `execa` (^9.6.1)
- `open` (^11.0.0)
- `zod` (catalog)

### Development

- `typescript` (catalog)
- `vitest` (catalog)
- `@types/react` (catalog)

## Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Best Practices

- Use the `/edit` command for complex prompts that benefit from proper text editing
- Use the `/multi` command for multi-line input that doesn't need editing
- Configure appropriate banner text for your terminal size
- Handle abort signals properly when implementing custom commands
- Use the AgentCommandService for registering new chat commands
- Check the `theme.ts` file for the complete color palette definition
- Terminal requirements: minimum 40x10 for minimal mode, 80x24 for full functionality

## Related Components

- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent system and command service
- `@tokenring-ai/utility` - String utilities and formatting
- `@opentui/core` - TUI framework
- `@opentui/react` - React bindings for TUI

## License

MIT License - see LICENSE file for details.