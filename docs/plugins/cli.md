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
export default class AgentCLI implements TokenRingService &#123;
  name = "AgentCLI";
  description = "Command-line interface for interacting with agents";
&#125;
```

### CommandPrompt

A custom prompt implementation using Node.js readline interface with history and auto-completion support.

```typescript
export interface CommandPromptOptions &#123;
  rl: readline.Interface;
  message: string;
  prefix?: string;
  history?: string[];
  autoCompletion?: string[] | ((line: string) =&gt; Promise&lt;string[]&gt; | string[]);
  signal?: AbortSignal;
&#125;

export class PartialInputError extends Error &#123;
  constructor(public buffer: string);
&#125;
```

### SimpleSpinner

A custom spinner class for rendering loading animations in the terminal.

```typescript
export class SimpleSpinner &#123;
  start(message?: string): void;
  stop(): void;
  updateMessage(message: string): void;
&#125;
```

### Theme

Color theme configuration for the CLI interface.

```typescript
export const theme = &#123;
  agentSelectionBanner: '#cf6e32',
  chatOutputText: '#66BB6AFF',
  chatReasoningText: '#FFEB3BFF',
  chatPreviousInput: '#8c6ac6',
  chatSystemInfoMessage: '#64B5F6FF',
  chatSystemWarningMessage: '#FFEB3BFF',
  chatSystemErrorMessage: '#EF5350FF',
  chatDivider: '#9E9E9EFF',
  chatSpinner: '#FFEB3BFF',
&#125; as const;
```

## API Reference

### AgentCLI

**Constructor**

```typescript
constructor(app: TokenRingApp, config: z.infer&lt;typeof CLIConfigSchema&gt;)
```

Initializes the CLI service with the application instance and configuration.

**Methods**

- `async run(): Promise&lt;void&gt;` - Starts the main CLI loop, handling user input and agent interactions

- `private async selectOrCreateAgent(): Promise&lt;Agent | null&gt;` - Displays the agent selection screen and handles agent creation

- `private async runAgentLoop(agent: Agent): Promise&lt;void&gt;` - Main interaction loop for a selected agent

- `private async gatherInput(agent: Agent, signal: AbortSignal): Promise&lt;string&gt;` - Collects user input with history and auto-completion

- `private async handleHumanRequest(&#123; request, id &#125;: &#123; request: HumanInterfaceRequest, id: string &#125;, signal: AbortSignal): Promise&lt;[id: string, reply: any]&gt;` - Processes human interface requests

- `private async withAbortSignal&lt;T&gt;(fn: (signal: AbortSignal) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt;` - Executes a function with abort signal management

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
export const CLIConfigSchema = z.object(&#123;
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
&#125;);
```

- **bannerNarrow**: Banner message for narrow terminal windows
- **bannerWide**: Banner message for wide terminal windows (default)
- **bannerCompact**: Banner message for compact terminal layouts

## Usage Examples

### Basic CLI Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliPlugin from "@tokenring-ai/cli";
import &#123; AgentCommandService &#125; from "@tokenring-ai/agent";

// Create and configure the app
const app = new TokenRingApp();

// Plugin configuration
const config = &#123;
  cli: &#123;
    bannerNarrow: "[TokenRing AI]",
    bannerWide: "[TokenRing AI - Command Line Interface]",
    bannerCompact: "[TokenRing AI]",
  &#125;
&#125;;

app.install(cliPlugin, config);

// Start the CLI - this will block and run interactively
await app.start();
```

### Plugin Integration

```typescript
import &#123; AgentCommandService &#125; from "@tokenring-ai/agent";
import &#123; TokenRingPlugin &#125; from "@tokenring-ai/app";
import &#123; z &#125; from "zod";
import AgentCLI, &#123; CLIConfigSchema &#125; from "./AgentCLI.ts";
import chatCommands from "./chatCommands.ts";
import packageJSON from './package.json' with &#123; type: 'json' &#125;;

const packageConfigSchema = z.object(&#123;
  cli: CLIConfigSchema.optional()
&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    if (config.cli) &#123;
      app.waitForService(AgentCommandService, agentCommandService =&gt;
        agentCommandService.addAgentCommands(chatCommands)
      );
      app.addServices(new AgentCLI(app, config.cli));
    &#125;
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
```

### Custom Command Integration

```typescript
import &#123; Agent &#125; from "@tokenring-ai/agent";
import &#123; TokenRingAgentCommand &#125; from "@tokenring-ai/agent/types";

const customCommand = &#123;
  description: "/custom - Execute custom functionality",
  async execute(args: string, agent: Agent): Promise&lt;void&gt; &#123;
    agent.handleInput(&#123; message: `Custom command: $&#123;args&#125;` &#125;);
  &#125;,
  help: `# /custom - Execute custom functionality

## Description
Execute custom functionality with the provided arguments.

## Usage
/custom [args]

## Examples
/custom hello world`,
&#125; satisfies TokenRingAgentCommand;

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
const config = &#123;
  cli: &#123;
    bannerNarrow: "Your narrow banner text",
    bannerWide: "Your wide banner text (shown by default)",
    bannerCompact: "Your compact banner text",
  &#125;
&#125;;
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
app.waitForService(AgentCommandService, agentCommandService =&gt;
  agentCommandService.addAgentCommands(chatCommands)
);
```

### Screen Registry

Screens are registered through the ScreenRegistry type:

```typescript
type ScreenRegistry = &#123;
  AgentSelectionScreen: ScreenRegistryEntry&lt;&#123; agentManager, webHostService?, banner &#125;, Agent | null&gt;;
  AskScreen: ScreenRegistryEntry&lt;&#123; request &#125;, string&gt;;
  ConfirmationScreen: ScreenRegistryEntry&lt;&#123; message, defaultValue?, timeout? &#125;, boolean&gt;;
  TreeSelectionScreen: &#123; props: &#123; request &#125;, response, component &#125;;
  WebPageScreen: ScreenRegistryEntry&lt;&#123; request &#125;, void&gt;;
  PasswordScreen: ScreenRegistryEntry&lt;&#123; request &#125;, string&gt;;
  FormScreen: ScreenRegistryEntry&lt;&#123; request &#125;, Record&lt;string, any&gt;&gt;;
&#125;;
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
import &#123; Agent &#125; from "@tokenring-ai/agent";
import &#123; TokenRingAgentCommand &#125; from "@tokenring-ai/agent/types";

const description: string = "/mycommand - Description of your command";

async function execute(args: string, agent: Agent): Promise&lt;void&gt; &#123;
  // Command implementation
  agent.handleInput(&#123; message: args &#125;);
&#125;

const help: string = `# /mycommand - Description

## Description
Detailed description of the command.

## Usage
/mycommand [arguments]

## Examples
/mycommand example`;

export default &#123;
  description,
  execute,
  help,
&#125; satisfies TokenRingAgentCommand;
```

3. Export the command in `chatCommands.ts`:

```typescript
import edit from "./commands/edit.ts";
import multi from "./commands/multi.ts";
import mycommand from "./commands/mycommand.ts";

export default &#123;
  edit,
  multi,
  mycommand,
&#125;;
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
