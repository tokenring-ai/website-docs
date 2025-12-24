# CLI Ink Plugin

Ink-based Command Line Interface for TokenRing AI agents. This package provides an interactive terminal interface using Ink framework for managing AI agents, executing commands, and handling human interface requests.

## Overview

The `@tokenring-ai/cli-ink` package serves as the primary CLI entry point for the Token Ring AI system, providing a feature-rich terminal experience with real-time event processing, comprehensive command support, and intuitive user interactions.

## Key Features

- **Interactive Terminal Interface**: Built with Ink framework for responsive terminal applications
- **Agent Management**: Select from running agents, create new ones, or connect to web applications
- **Real-time Event Processing**: Stream agent outputs (chat, reasoning, system messages) with proper formatting
- **Comprehensive Command Support**: Built-in commands like `/help`, `/markdown`, `/quit`, `/exit`
- **Human Interface Requests**: Handle confirmations, selections, password prompts, web page opening
- **Dynamic Screen Management**: Switch between agent selection, chat, and interactive request handling
- **Code Block Syntax Highlighting**: Render markdown with syntax highlighting for various programming languages
- **Responsive Layout**: Automatically adjusts to terminal window size
- **Workflow Integration**: Support for spawning workflow-based agents
- **Web Application Integration**: Connect to web applications via SPA resources

## Installation

This package is part of the TokenRing AI monorepo. To install and use:

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test
```

### Dependencies

- **Core**: `@tokenring-ai/agent`, `@tokenring-ai/app`, `@tokenring-ai/utility`, `@tokenring-ai/web-host`
- **CLI Framework**: `ink`, `ink-divider`, `ink-spinner`, `ink-syntax-highlight`, `ink-text-input`
- **Prompt Handling**: `@inquirer/prompts`, `@mishieck/ink-titled-box`
- **Utilities**: `chalk`, `cli-highlight`, `execa`, `open`, `marked`
- **Development**: `typescript`, `vitest`, `@types/react`

### Environment Variables

None required for basic functionality.

## Usage

### Basic Usage

```typescript
import TokenRingApp from "@tokenring-ai/app";
import cliInkPlugin from "@tokenring-ai/cli-ink";

// Create and configure the app
const app = new TokenRingApp();
app.install(cliInkPlugin);

// Start the CLI
await app.start();
```

### Plugin Integration

The CLI is designed as a TokenRing plugin that integrates seamlessly with the main application:

```typescript
import {AgentCommandService} from "@tokenring-ai/agent";

export default {
  name: "@tokenring-ai/cli-ink",
  version: "0.2.0",
  description: "Ink-based CLI for TokenRing apps",
  install(app) {
    app.waitForService(AgentCommandService, agentCommandService => 
      agentCommandService.addAgentCommands(chatCommands)
    );
    const config = app.getConfigSlice('inkCLI', InkCLIConfigSchema);
    app.addServices(new AgentInkCLI(app, config));
  },
} satisfies TokenRingPlugin;
```

## Configuration

### CLI Configuration Schema

```typescript
export const InkCLIConfigSchema = z.object({
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
  bannerColor: z.string().optional().default('cyan'),
});
```

### Configuration Options

- **bannerNarrow**: Narrow banner displayed in compact mode
- **bannerWide**: Wide banner displayed in full mode
- **bannerCompact**: Compact banner for agent chat screens
- **bannerColor**: Color for the banner (uses Chalk color names)

## Core Features

### Agent Selection & Management

- Connect to existing running agents
- Create new agents of various types
- Switch between running agents
- Exit or detach from agents
- Connect to web applications
- Spawn workflow-based agents

### Interactive Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/help` | Show available commands | `/help` |
| `/markdown` | Outputs a sample of markdown | `/markdown` |
| `/quit` | Quit current agent | `/quit` |
| `/exit` | Exit current agent | `/exit` |
| `/switch` | Return to agent selection | `/switch` |

### Keyboard Shortcuts

**Ctrl-C Actions:**
- `Ctrl-C` - Exit the application when in agent selection, return to agent selection when in chat

### Human Interface Requests

The CLI handles various types of human interface requests:

- **Ask for Text**: Open editor for multi-line responses
- **Confirm**: Yes/no prompts with timeout support
- **Selection**: Single choice from list
- **Tree Selection**: Navigate hierarchical structures (agent types, categories)
- **Password**: Secure input prompts
- **Open Web Page**: Launch URLs in browser
- **Multiple Tree Selection**: Choose multiple items from hierarchical structures

## API Reference

### AgentInkCLI Service

Main service class implementing the CLI functionality.

```typescript
export default class AgentInkCLI implements TokenRingService {
  constructor(app: TokenRingApp, config: z.infer<typeof InkCLIConfigSchema>)
  async run(): Promise<void>
}
```

### AgentCLI Component

Main component that manages screen state and rendering.

```typescript
interface AgentCLIProps extends z.infer<typeof InkCLIConfigSchema> {
  agentManager: AgentManager;
  app: TokenRingApp;
}
export default function AgentCLI(props: AgentCLIProps)
```

### Screen Types

```typescript
type Screen = 
  | { name: 'selectAgent' }
  | { name: 'chat'; agentId: string }
  | { name: 'askForConfirmation'; request: HumanInterfaceRequestFor<"askForConfirmation">, onResponse: (response: HumanInterfaceResponseFor<'askForConfirmation'>) => void }
  | { name: 'askForPassword'; request: HumanInterfaceRequestFor<"askForPassword">, onResponse: (response: HumanInterfaceResponseFor<'askForPassword'>) => void }
  | { name: 'openWebPage'; request: HumanInterfaceRequestFor<"openWebPage">, onResponse: (response: HumanInterfaceResponseFor<"openWebPage">) => void }
  | { name: 'askForSingleTreeSelection'; request: HumanInterfaceRequestFor<"askForSingleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForSingleTreeSelection'>) => void }
  | { name: 'askForMultipleTreeSelection'; request: HumanInterfaceRequestFor<"askForMultipleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForMultipleTreeSelection'>) => void }
  | { name: 'askForText'; request: HumanInterfaceRequestFor<"askForText">, onResponse: (response: HumanInterfaceResponseFor<'askForText'>) => void };
```

## Event Handling

The CLI processes various agent events in real-time:

- **output.chat**: Chat messages (green color)
- **output.reasoning**: Agent reasoning (yellow color)
- **output.system**: System messages with levels (error/warning/info)
- **state.busy**: Loading states with spinners
- **state.idle**: Ready for user input
- **state.exit**: Agent exit notifications
- **input.received**: Echo user input
- **human.request**: Handle interactive prompts

## Examples

### Basic Agent Interaction

```typescript
// 1. Start the CLI
await app.start();

// 2. Select or create an agent
// CLI will show agent selection menu with categories and options

// 3. Chat with the agent
// Type your questions and press Enter

// 4. Use commands
/help          # Show available commands
/markdown      # Output markdown sample
/switch        # Return to agent selection
```

### Web Application Integration

```typescript
// The CLI automatically detects web applications
// and provides options to connect to them
```

### Workflow Agent Spawning

```typescript
// Workflows are listed in the agent selection screen
// and can be spawned as agents
```

## Integration Details

### Service Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/agent/AgentCommandService`: Command registration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/web-host`: Web resource hosting
- `@tokenring-ai/utility`: Shared utilities

### Event Handling

The CLI subscribes to agent events and renders them appropriately:

- `output.chat`: Regular chat messages
- `output.reasoning`: Agent's internal reasoning
- `output.info`: Informational messages
- `output.warning`: Warning messages
- `output.error`: Error messages
- `input.handled`: Input processing status
- `input.received`: User input display
- `human.request`: Handle interactive prompts

### Human Interface Requests

The CLI handles various human interface request types:

- `askForText`: Text input prompts
- `askForConfirmation`: Yes/no questions
- `askForMultipleTreeSelection`: Multi-select from hierarchy
- `askForSingleTreeSelection`: Single selection from hierarchy
- `openWebPage`: Display web content
- `askForPassword`: Secure password input

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm test:watch
npm test:coverage
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

1. Create a new file in `screens/` directory
2. Implement the screen component following the existing patterns
3. Add support in `AgentCLI.tsx` for handling the new screen type

## Package Structure

```
pkg/cli-ink/
├── index.ts                 # Main entry point and exports
├── plugin.ts                # Plugin definition for TokenRing app integration
├── AgentInkCLI.ts           # Main service class
├── AgentCLI.tsx             # Core component managing screen state
├── chatCommands.ts          # Command exports
├── components/              # Reusable components
│   ├── Markdown.tsx         # Markdown rendering with syntax highlighting
│   ├── CommandInput.tsx     # Command input with history and auto-completion
│   └── SelectInput.tsx      # Selection input component
├── hooks/                  # Custom hooks
│   ├── useAgentEvents.ts    # Agent event state management
│   ├── useOutputBlocks.tsx  # Output block processing
│   └── useScreenSize.ts     # Terminal size management
├── screens/                # Screen components
│   ├── AgentChatScreen.tsx  # Agent chat interface
│   ├── AgentSelectionScreen.tsx # Agent selection interface
│   ├── AskScreen.tsx        # Text input screen
│   ├── ConfirmationScreen.tsx # Confirmation prompt screen
│   ├── PasswordScreen.tsx   # Password input screen
│   ├── TreeSelectionScreen.tsx # Tree-based selection
│   └── WebPageScreen.tsx    # Web page opening screen
├── commands/               # Individual command implementations
│   ├── markdown.ts         # /markdown command
│   ├── quit.ts             # /quit command
│   └── exit.ts             # /exit command
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## License

MIT License - see LICENSE file for details.