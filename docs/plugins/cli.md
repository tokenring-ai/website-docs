# CLI Plugin Documentation

## Overview

The `@tokenring-ai/cli` package provides a comprehensive command-line interface for interacting with TokenRing AI agents. This terminal-based interface enables users to manage agents, execute commands, and handle human interface requests with a rich, responsive UI built on OpenTUI.

## Key Features

- **Agent Management**: Select, create, and connect to AI agents through an interactive selection screen
- **Interactive Chat**: Communicate with agents through a terminal interface with color-coded output
- **Built-in Commands**: Execute slash-prefixed commands like `/edit` and `/multi`
- **Human Interface Requests**: Handle confirmations, text inputs, password prompts, form submissions, tree selections, and web page interactions
- **Keyboard Navigation**: Use arrow keys for command history navigation, escape for cancel, Ctrl+C for agent switch or exit
- **Real-time Events**: Stream agent outputs (chat, reasoning, system messages) with color-coded formatting
- **Custom Screens**: Render interactive UI screens for various interaction types using OpenTUI and React
- **Command History**: Input history with up/down arrow navigation
- **Auto-completion**: Command auto-completion for registered agent commands
- **Abort Signal Support**: Graceful handling of abort signals for canceling operations

## Core Components

### AgentCLI Service

The main service that manages CLI operations, including user input, agent selection, and interaction handling.

```typescript
export default class AgentCLI implements TokenRingService {
  name = "AgentCLI";
  description = "Command-line interface for interacting with agents";
}
```

### CommandPrompt

A custom prompt implementation using Node.js readline interface with history and auto-completion support.

```typescript
export interface CommandPromptOptions {
  rl: readline.Interface;
  message: string;
  prefix?: string;
  history?: string[];
  autoCompletion?: string[] | ((line: string) => Promise<string[]> | string[]);
  signal?: AbortSignal;
}

export class PartialInputError extends Error {
  constructor(public buffer: string);
}
```

### SimpleSpinner

A custom spinner class for rendering loading animations in the terminal.

```typescript
export class SimpleSpinner {
  start(message?: string): void;
  stop(): void;
  updateMessage(message: string): void;
}
```

### Theme

Color theme configuration for the CLI interface.

```typescript
export const theme = {
  agentSelectionBanner: '#cf6e32',
  chatOutputText: '#66BB6AFF',
  chatReasoningText: '#FFEB3BFF',
  chatPreviousInput: '#8c6ac6',
  chatSystemInfoMessage: '#64B5F6FF',
  chatSystemWarningMessage: '#FFEB3BFF',
  chatSystemErrorMessage: '#EF5350FF',
  chatDivider: '#9E9E9EFF',
  chatSpinner: '#FFEB3BFF',
} as const;
```

## API Reference

### AgentCLI

**Constructor**

```typescript
constructor(app: TokenRingApp, config: z.infer<typeof CLIConfigSchema>)
```

Initializes the CLI service with the application instance and configuration.

**Methods**

- `async run(): Promise<void>` - Starts the main CLI loop, handling user input and agent interactions

- `private async selectOrCreateAgent(): Promise<Agent | null>` - Displays the agent selection screen and handles agent creation

- `private async runAgentLoop(agent: Agent): Promise<void>` - Main interaction loop for a selected agent

- `private async gatherInput(agent: Agent, signal: AbortSignal): Promise<string>` - Collects user input with history and auto-completion

- `private async handleHumanRequest({ request, id }: { request: HumanInterfaceRequest, id: string }, signal: AbortSignal): Promise<[id: string, reply: any]>` - Processes human interface requests

- `private async withAbortSignal<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T>` - Executes a function with abort signal management

### Chat Commands

The following commands are registered with the AgentCommandService:

| Command | Description | Usage |
|---------|-------------|-------|
| `/edit` | Open system editor for prompt creation | `/edit [text]` |
| `/multi` | Open editor for multiline input | `/multi` |

**Special Commands (handled internally)**

- `/switch` - Returns to agent selection (handled by empty input on Ctrl+C)
- `/quit` / `/exit` - Exit current agent session

### Human Interface Requests

The CLI handles the following human interface request types:

| Request Type | Description | Screen |
|--------------|-------------|--------|
| `askForText` | Multi-line text input | AskScreen |
| `askForConfirmation` | Yes/no prompt with timeout | ConfirmationScreen |
| `askForPassword` | Secure password input | PasswordScreen |
| `askForForm` | Structured form with multiple fields | FormScreen |
| `askForSingleTreeSelection` | Single item from hierarchical structure | TreeSelectionScreen |
| `askForMultipleTreeSelection` | Multiple items from hierarchical structure | TreeSelectionScreen |
| `openWebPage` | Launch URLs in browser | WebPageScreen |

### Events

The CLI renders the following event types from the agent state:

| Event Type | Description | Color |
|------------|-------------|-------|
| `agent.created` | Agent creation notification | Info (blue) |
| `output.chat` | Chat messages | Green |
| `output.reasoning` | Agent reasoning (yellow) | Yellow |
| `output.info` | System messages | Blue |
| `output.warning` | System warnings | Yellow |
| `output.error` | System errors | Red |
| `input.handled` | Input processing status | Error color if cancelled/error |
| `input.received` | User input echo | Purple |

### Configuration Schema

```typescript
export const CLIConfigSchema = z.object({
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
});
```

- **bannerNarrow**: Banner message for narrow terminal windows
- **bannerWide**: Banner message for wide terminal windows (default)
- **bannerCompact**: Banner message for compact terminal layouts

## Usage Examples

### Basic CLI Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliPlugin from "@tokenring-ai/cli";
import { AgentCommandService } from "@tokenring-ai/agent";

// Create and configure the app
const app = new TokenRingApp();

// Plugin configuration
const config = {
  cli: {
    bannerNarrow: "[TokenRing AI]",
    bannerWide: "[TokenRing AI - Command Line Interface]",
    bannerCompact: "[TokenRing AI]",
  }
};

app.install(cliPlugin, config);

// Start the CLI - this will block and run interactively
await app.start();
```

### Plugin Integration

```typescript
import { AgentCommandService } from "@tokenring-ai/agent";
import { TokenRingPlugin } from "@tokenring-ai/app";
import { z } from "zod";
import AgentCLI, { CLIConfigSchema } from "./AgentCLI.ts";
import chatCommands from "./chatCommands.ts";
import packageJSON from './package.json' with { type: 'json' };

const packageConfigSchema = z.object({
  cli: CLIConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.cli) {
      app.waitForService(AgentCommandService, agentCommandService =>
        agentCommandService.addAgentCommands(chatCommands)
      );
      app.addServices(new AgentCLI(app, config.cli));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Custom Command Integration

```typescript
import { Agent } from "@tokenring-ai/agent";
import { TokenRingAgentCommand } from "@tokenring-ai/agent/types";

const customCommand = {
  description: "/custom - Execute custom functionality",
  async execute(args: string, agent: Agent): Promise<void> {
    agent.handleInput({ message: `Custom command: ${args}` });
  },
  help: `# /custom - Execute custom functionality

## Description
Execute custom functionality with the provided arguments.

## Usage
/custom [args]

## Examples
/custom hello world`,
} satisfies TokenRingAgentCommand;

export default customCommand;
```

### Event Handling

The AgentCLI subscribes to agent state events and renders them:

```typescript
// Events are rendered by the CLI automatically:
// - Chat messages (output.chat)
// - Reasoning traces (output.reasoning)
// - System messages (output.info, output.warning, output.error)
// - User input echo (input.received)
// - Input handling status (input.handled)
```

## Configuration

### Plugin Configuration

The CLI plugin uses the following configuration schema in the application config:

```typescript
const config = {
  cli: {
    bannerNarrow: "Your narrow banner text",
    bannerWide: "Your wide banner text (shown by default)",
    bannerCompact: "Your compact banner text",
  }
};
```

### Package Dependencies

- **Core**:
  - `@tokenring-ai/app` (0.2.0)
  - `@tokenring-ai/agent` (0.2.0)
  - `@tokenring-ai/chat` (0.2.0)
  - `@tokenring-ai/utility` (0.2.0)
- **UI Framework**:
  - `@opentui/core` (^0.1.63)
  - `@opentui/react` (^0.1.63)
  - `react` (catalog)
- **Prompt Handling**:
  - `@inquirer/prompts` (^8.1.0)
- **Utilities**:
  - `chalk` (^5.6.2)
  - `execa` (^9.6.1)
  - `open` (^11.0.0)
  - `zod` (catalog)
- **Development**:
  - `typescript` (catalog)
  - `vitest` (catalog)
  - `@types/react` (catalog)

## Integration

### AgentCommandService Integration

Chat commands are registered via the AgentCommandService:

```typescript
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(chatCommands)
);
```

### Screen Registry

Screens are registered through the ScreenRegistry type:

```typescript
type ScreenRegistry = {
  AgentSelectionScreen: ScreenRegistryEntry<{ agentManager, webHostService?, banner }, Agent | null>;
  AskScreen: ScreenRegistryEntry<{ request }, string>;
  ConfirmationScreen: ScreenRegistryEntry<{ message, defaultValue?, timeout? }, boolean>;
  TreeSelectionScreen: { props: { request }, response, component };
  WebPageScreen: ScreenRegistryEntry<{ request }, void>;
  PasswordScreen: ScreenRegistryEntry<{ request }, string>;
  FormScreen: ScreenRegistryEntry<{ request }, Record<string, any>>;
};
```

## Development

### Testing

```bash
# Run tests
vitest run

# Run tests in watch mode
vitest

# Run tests with coverage
vitest run --coverage
```

### Package Structure

```
pkg/cli/
├── src/
│   ├── runTUIScreen.tsx         # Main TUI screen rendering
│   ├── theme.ts                 # Color theme definitions
│   └── screens/
│       ├── AgentSelectionScreen.tsx  # Agent selection interface
│       ├── AskScreen.tsx             # Text input screen
│       ├── ConfirmationScreen.tsx    # Confirmation prompt screen
│       ├── FormScreen.tsx            # Form input screen
│       ├── PasswordScreen.tsx        # Password input screen
│       ├── TreeSelectionScreen.tsx   # Tree-based selection
│       ├── WebPageScreen.tsx         # Web page opening screen
│       └── ScreenRegistry.ts         # Screen registry types
├── commands/
│   ├── edit.ts                  # /edit command implementation
│   └── multi.ts                 # /multi command implementation
├── AgentCLI.ts                  # Main CLI service class
├── chatCommands.ts              # Chat commands export
├── commandPrompt.ts             # Command prompt with history
├── SimpleSpinner.ts             # Spinner animation
├── plugin.ts                    # Plugin definition
├── index.ts                     # Main entry point
├── package.json
├── vitest.config.ts
└── README.md
```

### Adding New Commands

1. Create a new file in `commands/` directory (e.g., `commands/mycommand.ts`)

2. Implement the command interface:

```typescript
import { Agent } from "@tokenring-ai/agent";
import { TokenRingAgentCommand } from "@tokenring-ai/agent/types";

const description: string = "/mycommand - Description of your command";

async function execute(args: string, agent: Agent): Promise<void> {
  // Command implementation
  agent.handleInput({ message: args });
}

const help: string = `# /mycommand - Description

## Description
Detailed description of the command.

## Usage
/mycommand [arguments]

## Examples
/mycommand example`;

export default {
  description,
  execute,
  help,
} satisfies TokenRingAgentCommand;
```

3. Export the command in `chatCommands.ts`:

```typescript
import edit from "./commands/edit.ts";
import multi from "./commands/multi.ts";
import mycommand from "./commands/mycommand.ts";

export default {
  edit,
  multi,
  mycommand,
};
```

### Adding New Screens

1. Create a new file in `src/screens/` directory

2. Implement the screen component using OpenTUI/React

3. Add the screen to the ScreenRegistry type in `src/screens/ScreenRegistry.ts`

## Best Practices

- Use the `/edit` command for complex prompts that benefit from proper text editing
- Use the `/multi` command for multi-line input that doesn't need editing
- Configure appropriate banner text for your terminal size
- Handle abort signals properly when implementing custom commands
- Use the AgentCommandService for registering new chat commands

## Related Components

- `@tokenring-ai/app` - Base application framework
- `@tokenring-ai/agent` - Agent system and command service
- `@tokenring-ai/utility` - String utilities and formatting
- `@opentui/core` - TUI framework
- `@opentui/react` - React bindings for TUI

## License

MIT License - see LICENSE file for details.
