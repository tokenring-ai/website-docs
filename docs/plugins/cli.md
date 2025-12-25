# CLI Plugin Documentation

## Overview

The `@tokenring-ai/cli` package provides a comprehensive command-line interface for interacting with TokenRing AI agents. This terminal-based interface enables users to manage agents, execute commands, and handle human interface requests with a rich, responsive UI built on OpenTUI.

### Key Features

- **Agent Management**: Select, create, and connect to AI agents
- **Interactive Chat**: Communicate with agents through a terminal interface
- **Built-in Commands**: Execute slash-prefixed commands like `/help`, `/edit`, `/multi`, `/switch`
- **Human Interface Requests**: Handle confirmations, selections, password prompts, and more
- **Keyboard Shortcuts**: Use Ctrl-T for quick actions and navigation
- **Real-time Events**: Stream agent outputs (chat, reasoning, system messages) with color-coded formatting
- **Custom Screens**: Render interactive UI screens for various interaction types
- **Workflow Integration**: Connect to and execute workflows
- **Web Host Integration**: Access web applications and resources

## Core Components

### AgentCLI Service

The main service class implementing the CLI functionality.

```typescript
export default class AgentCLI implements TokenRingService {
  constructor(app: TokenRingApp, config: z.infer<typeof CLIConfigSchema>)
  async run(): Promise<void>
  private async selectOrCreateAgent(): Promise<Agent | null>
  private async runAgentLoop(agent: Agent): Promise<void>
  private async gatherInput(agent: Agent, signal: AbortSignal): Promise<string>
  private async handleHumanRequest(request: HumanInterfaceRequest, id: string, signal: AbortSignal): Promise<[id: string, reply: any]>
  private async withAbortSignal<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T>
}
```

### Configuration

CLI configuration uses Zod schema validation:

```typescript
export const CLIConfigSchema = z.object({
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
});
```

### Command System

The CLI integrates with the AgentCommandService to provide built-in and custom commands:

```typescript
export default {
  name: "@tokenring-ai/cli",
  version: "0.2.0",
  description: "TokenRing CLI",
  install(app) {
    app.waitForService(AgentCommandService, agentCommandService => {
      agentCommandService.addAgentCommands(chatCommands);
    });
    const config = app.getConfigSlice('cli', CLIConfigSchema);
    app.addServices(new AgentCLI(app, config));
  },
} satisfies TokenRingPlugin;
```

## Interactive Screens

The CLI provides multiple interactive screens for different types of user interactions:

### Agent Selection Screen

- **Purpose**: Select or create new agents
- **Features**:
 - Browse running agents
 - Create new agents by type
 - Access web applications
 - Execute workflows
- **Navigation**: Arrow keys, Enter to select

### Ask Screen

- **Purpose**: Collect multi-line text input
- **Features**:
 - Multi-line editing support
 - Ctrl-D to submit
 - Escape to cancel
- **Usage**: For complex prompts or detailed input

### Confirmation Screen

- **Purpose**: Handle yes/no prompts
- **Features**:
 - Timeout support
 - Default values
 - Visual feedback
- **Navigation**: Y/N keys, Enter, Arrow keys

### Tree Selection Screen

- **Purpose**: Navigate hierarchical selections
- **Features**:
 - Expand/collapse nodes
 - Single and multiple selection
 - Loading support for dynamic content
- **Navigation**: Arrow keys, Space, Enter

### Password Screen

- **Purpose**: Secure password input
- **Features**:
 - Masked input
 - Basic navigation
- **Usage**: For sensitive input

### Web Page Screen

- **Purpose**: Open URLs in browser
- **Features**:
 - Automatic browser launch
 - Success/error feedback
- **Integration**: With web host service

### Form Screen

- **Purpose**: Fill structured forms
- **Features**:
 - Multiple field types (text, select, file, tree)
 - Validation support
 - Navigation between fields

## Built-in Commands

### `/help`
Shows available commands and their usage.

### `/edit [text]`
Opens system editor for prompt creation with optional initial text.

### `/multi`
Opens editor for multiline input.

### `/switch`
Returns to agent selection.

### `/exit` / `/quit`
Exits current agent.

### Keyboard Shortcuts

**Ctrl-T Actions:**
- `Ctrl-T` - Show help for shortcuts
- `Ctrl-T c` - Create new agent
- `Ctrl-T n` - Switch to next agent
- `Ctrl-T p` - Switch to previous agent
- `Ctrl-T s` - Return to agent selection
- `Ctrl-T x` - Exit current agent
- `Ctrl-T d` - Detach from agent

**General:**
- `↑/↓` - Navigate command history
- `Esc` - Cancel current operation
- `Ctrl-C` - Exit or abort
- `Ctrl-D` - Submit multiline input
- `Space` - Toggle selection in Tree screen
- `Right/Left` - Expand/Collapse tree nodes

## Human Interface Requests

The CLI handles various human interface request types:

### Ask For Text
Opens an editor for multi-line responses.

### Ask For Confirmation
Shows yes/no prompt with timeout support.

### Ask For Selection
Single choice from list of options.

### Ask For Multiple Selection
Choose multiple items from list.

### Ask For Tree Selection
Navigate hierarchical structures.

### Ask For Password
Secure password input.

### Open Web Page
Launch URLs in browser.

### Ask For Form
Fill out structured forms with multiple field types.

## Event Handling

The CLI processes agent events in real-time:

- **output.chat**: Chat messages (green)
- **output.reasoning**: Agent reasoning (yellow)
- **output.info**: System messages
- **output.warning**: System warnings
- **output.error**: System errors
- **input.handled**: Input processing status
- **input.received**: Echo user input
- **human.request**: Handle interactive prompts
- **busy**: Loading states with spinners
- **idle**: Ready for user input
- **exit**: Agent exit notifications
- **agent.created**: New agent created
- **agent.started**: Agent started
- **agent.stopped**: Agent stopped

## Integration

### Service Registration

```typescript
app.waitForService(AgentCommandService, agentCommandService => {
  agentCommandService.addAgentCommands(chatCommands);
});
```

### Configuration

```typescript
const config = app.getConfigSlice('cli', CLIConfigSchema);
app.addServices(new AgentCLI(app, config));
```

### Dependency Relationships

- Depends on: `@tokenring-ai/app`, `@tokenring-ai/agent`, `@tokenring-ai/chat`
- Uses: `@inquirer/prompts`, `@opentui/core`, `@opentui/react`
- Utilities: `chalk`, `execa`, `open`
- Development: `vitest`, `typescript`

## Usage Examples

### Basic CLI Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliPlugin from "@tokenring-ai/cli";

// Create and configure the app
const app = new TokenRingApp();
app.install(cliPlugin);

// Start the CLI
await app.start();
```

### Custom Command Integration

```typescript
// Add custom commands to chatCommands.ts
export const customCommand = {
  description: "/custom - Execute custom functionality",
  async execute(args: string, agent: Agent): Promise<void> {
    agent.handleInput({message: `Custom command: ${args}`});
  },
  help(): string[] {
    return ["/custom - Execute custom functionality"];
  }
} satisfies TokenRingAgentCommand;
```

### Event Handling Example

```typescript
agent.on('output.chat', (message) => {
  console.log('Chat message:', message);
});

agent.on('human.request', async (request) => {
  const response = await handleHumanRequest(request);
  agent.sendHumanResponse(request.id, response);
});
```

## Package Structure

```
pkg/cli/
├── index.ts                 # Main entry point and plugin definition
├── AgentCLI.ts              # Core CLI service implementation
├── chatCommands.ts          # Command exports
├── commandPrompt.ts         # Custom command prompt implementation
├── SimpleSpinner.ts         # Spinner animation utility
├── src/                    # UI component source
│   ├── runTUIScreen.tsx     # Main UI rendering logic
│   ├── theme.ts            # UI theme configuration
│   └── screens/            # Interactive screens
│       ├── AgentSelectionScreen.tsx
│       ├── AskScreen.tsx
│       ├── ConfirmationScreen.tsx
│       ├── FormScreen.tsx
│       ├── PasswordScreen.tsx
│       ├── TreeSelectionScreen.tsx
│       ├── WebPageScreen.tsx
│       └── index.ts        # Screen registry
├── commands/                # Individual command implementations
│   ├── edit.ts
│   └── multi.ts
├── package.json
└── README.md
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

### Adding New Commands

1. Create a new file in `commands/` directory
2. Implement the command interface:

```typescript
export default {
  description: string,
  execute(args: string, agent: Agent): Promise<void>,
  help(): string[]
} satisfies TokenRingAgentCommand;
```

3. Export the command in `chatCommands.ts`

### Adding New Screens

1. Create a new file in `src/screens/` directory
2. Implement the screen interface:

```typescript
export const YourScreen = ({ /* props */ }) => {
  // Screen implementation
};
```

3. Register the screen in `src/screens/index.ts`

## License

MIT License - see LICENSE file for details.