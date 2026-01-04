# CLI (Ink) Plugin

The `cli-ink` plugin provides an interactive terminal interface for TokenRing AI agents using the Ink framework. It enables users to manage agents, execute commands, handle human interface requests, and interact with the system through a responsive command-line environment.

## Overview

The cli-ink package serves as the primary CLI entry point for the TokenRing AI system. It provides a feature-rich terminal experience with real-time event processing, comprehensive command support, and intuitive user interactions.

### Key Features

- **Interactive Terminal Interface**: Built with Ink framework for responsive terminal applications
- **Agent Management**: Select from running agents, create new ones, or connect to web applications
- **Real-time Event Processing**: Stream agent outputs (chat, reasoning, system messages) with proper formatting
- **Comprehensive Command Support**: Built-in commands like `/switch` for agent switching
- **Human Interface Requests**: Handle confirmations, selections, password prompts, web page opening, and text input
- **Dynamic Screen Management**: Switch between agent selection, chat, and interactive request handling
- **Markdown Rendering**: Full markdown support with syntax highlighting for code blocks
- **Responsive Layout**: Automatically adjusts to terminal window size
- **Workflow Integration**: Support for spawning workflow-based agents
- **Web Application Integration**: Connect to web applications via SPA resources
- **Command History**: Input history with up/down arrow navigation
- **Auto-completion**: Command auto-completion with tab key support

## Installation

This package is part of the TokenRing AI monorepo.

```bash
# Install dependencies
bun install

# Run tests
vitest run
```

## Usage Examples

### Basic Initialization and Startup

```typescript
import TokenRingApp from '@tokenring-ai/app';
import cliInkPlugin from '@tokenring-ai/cli-ink';

const app = new TokenRingApp();
app.install(cliInkPlugin);
await app.start();
```

### Customizing the Banner

```typescript
const app = new TokenRingApp();
app.install(cliInkPlugin, {
  inkCLI: {
    bannerNarrow: 'TokenRing CLI',
    bannerWide: 'TokenRing AI CLI',
    bannerCompact: 'CLI',
    bannerColor: 'cyan'
  }
});
await app.start();
```

### Plugin Integration

```typescript
import TokenRingApp, { TokenRingPlugin } from '@tokenring-ai/app';
import AgentInkCLI, { InkCLIConfigSchema } from '@tokenring-ai/cli-ink';
import { z } from 'zod';

import packageJSON from './package.json' with { type: 'json' };

const packageConfigSchema = z.object({
  inkCLI: InkCLIConfigSchema.optional(),
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.inkCLI) {
      app.addServices(new AgentInkCLI(app, config.inkCLI));
    }
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
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

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `bannerNarrow` | string | Yes | - | Narrow banner displayed in compact mode |
| `bannerWide` | string | Yes | - | Wide banner displayed in full mode |
| `bannerCompact` | string | Yes | - | Compact banner for agent chat screens |
| `bannerColor` | string | No | `'cyan'` | Color for the banner (uses Chalk color names) |

## Core Components

### AgentInkCLI Service

Main service class implementing the CLI functionality.

```typescript
export default class AgentInkCLI implements TokenRingService {
  name = 'AgentInkCLI';
  description = 'Ink-based CLI for interacting with agents';

  constructor(app: TokenRingApp, config: z.infer<typeof InkCLIConfigSchema>);

  async run(): Promise<void>;
}
```

### AgentCLI Component

Top-level component managing screen state transitions and rendering.

```typescript
interface AgentCLIProps extends z.infer<typeof InkCLIConfigSchema> {
  agentManager: AgentManager;
  app: TokenRingApp;
}

export default function AgentCLI(props: AgentCLIProps);
```

### Screen Types

```typescript
type Screen =
  | { name: 'selectAgent' }
  | { name: 'chat'; agentId: string }
  | { name: 'askForConfirmation'; request: HumanInterfaceRequestFor<"askForConfirmation">, onResponse: (response: HumanInterfaceResponseFor<'askForConfirmation'>) => void }
  | { name: 'askForPassword'; request: HumanInterfaceRequestFor<"askForPassword">, onResponse: (response: HumanInterfaceResponseFor<'askForPassword'>) => void }
  | { name: 'openWebPage'; request: HumanInterfaceRequestFor<"openWebPage">, onResponse: (response: HumanInterfaceResponseFor<'openWebPage'>) => void }
  | { name: 'askForSingleTreeSelection'; request: HumanInterfaceRequestFor<"askForSingleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForSingleTreeSelection'>) => void }
  | { name: 'askForMultipleTreeSelection'; request: HumanInterfaceRequestFor<"askForMultipleTreeSelection">, onResponse: (response: HumanInterfaceResponseFor<'askForMultipleTreeSelection'>) => void }
  | { name: 'askForText'; request: HumanInterfaceRequestFor<"askForText">, onResponse: (response: HumanInterfaceResponseFor<'askForText'>) => void };
```

## Screen Components

### AgentChatScreen

Main chat interface displaying agent outputs and handling input.

```typescript
interface AgentChatScreenProps {
  agentEventState: AgentEventState | null;
  currentAgent: Agent;
  setScreen: (screen: Screen) => void;
}

export default function AgentChatScreen(props: AgentChatScreenProps);
```

Features:
- Displays agent responses with markdown rendering
- Shows thinking/reasoning process
- Displays user input
- Command input with history and auto-completion
- Status line and busy state indicators

### AgentSelectionScreen

For selecting agents from categories or connecting to existing ones.

```typescript
interface AgentSelectionScreenProps {
  app: TokenRingApp;
  setScreen: (screen: Screen) => void;
  onCancel: () => void;
}

export default function AgentSelectionScreen(props: AgentSelectionScreenProps);
```

Features:
- Categorized agent list (by configuration)
- Current running agents
- Web applications
- Workflows
- Error display for agent spawning failures

### Human Interface Screens

| Screen | Purpose |
|--------|---------|
| `AskScreen` | Multi-line text input (Ctrl+D to submit, Esc to cancel) |
| `ConfirmationScreen` | Yes/no prompts with arrow key navigation and timeout support |
| `PasswordScreen` | Secure input with masked characters |
| `TreeSelectionScreen` | Hierarchical tree-based selection (single or multiple) |
| `WebPageScreen` | Opens URLs in browser |

## Reusable Components

### CommandInput

Input field with history and auto-completion.

```typescript
export interface CommandInputProps {
  history?: string[];
  autoCompletion?: string[];
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  onCtrlC?: () => void;
  prompt?: string;
}

export const CommandInput: React.FC<CommandInputProps>;
```

Features:
- Command history navigation (up/down arrows)
- Tab auto-completion
- Ctrl+C handling
- Escape to cancel

### SelectInput

Generic selection input component.

```typescript
export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface SelectInputProps<T = string> {
  message?: string;
  options: SelectOption<T>[];
  onSelect: (value: T) => void;
  onCancel?: () => void;
}

export function SelectInput<T = string>(props: SelectInputProps<T>): React.ReactElement;
```

### Markdown

Renders markdown with syntax highlighting.

```typescript
export interface InkMarkdownProps {
  children: string;
  options?: InkMarkdownOptions;
}

export function InkMarkdown(props: InkMarkdownProps): React.ReactElement;
```

Features:
- Full markdown parsing using marked
- Syntax highlighting for 40+ languages
- Tables, lists, blockquotes, and code blocks
- Responsive width handling

## Custom Hooks

### useAgentEvents

Subscribes to agent event state.

```typescript
export function useAgentEvents(agent: Agent | null) {
  // Returns AgentEventState or null
}
```

### useOutputBlocks

Processes agent events into structured output blocks.

```typescript
export type OutputBlock =
  | { type: 'chat'; message: string }
  | { type: 'reasoning'; message: string }
  | { type: 'input'; message: string }
  | { type: 'system'; message: string; level: 'info' | 'warning' | 'error' };

export function useOutputBlocks(events: AgentEventState["events"] | null) {
  // Returns OutputBlock[]
}
```

### useScreenSize

Tracks terminal dimensions for responsive layout.

```typescript
export default function useScreenSize() {
  // Returns { rows: number, columns: number }
}
```

## Integration

The cli-ink plugin integrates with several core TokenRing packages:

- **@tokenring-ai/agent**: For agent management and event handling
- **@tokenring-ai/app**: As the main application framework
- **@tokenring-ai/web-host**: To detect and connect to web applications (SPA resources)
- **@tokenring-ai/workflow**: For spawning workflow-based agents

It registers itself as a service and handles human interface requests through the agent system's event system.

## Event Types

The CLI processes various agent events with color-coded output:

| Event Type | Color | Description |
|------------|-------|-------------|
| `output.chat` | Green | Chat messages from the agent |
| `output.reasoning` | Yellow | Agent reasoning process |
| `output.info` | Blue | Informational system messages |
| `output.warning` | Yellow | Warning system messages |
| `output.error` | Red | Error system messages |
| `input.received` | Yellow | User input echo |
| `human.request` | - | Interactive prompt handling |

## Keyboard Shortcuts

### Ctrl+C Actions
- `Ctrl+C` - Exit the application when in agent selection, return to agent selection when in chat

### Navigation
- `Up/Down Arrow` - Navigate lists and command history
- `Tab` - Auto-complete commands
- `Left/Right Arrow` - Expand/collapse tree nodes
- `Space` - Toggle selections (multiple choice)
- `Enter` - Select/submit
- `Esc` or `q` - Cancel/cancel selection
- `Ctrl+D` - Submit multi-line input

## Development

### Building

```bash
bun run build
```

### Testing

```bash
vitest run         # Run tests
vitest run:watch  # Watch mode
vitest run:coverage # Coverage report
```

### Adding New Screens

1. Create a new file in `screens/` directory
2. Implement the screen component
3. Add the screen type to the `Screen` union type in `AgentCLI.tsx`
4. Add handling in the main `AgentCLI` component

### Adding New Commands

1. Update `CommandInput.tsx` with command handlers
2. Add documentation for the new command
3. Register command names from the `AgentCommandService`

## Package Structure

```
pkg/cli-ink/
├── index.ts                    # Main entry point and exports
├── plugin.ts                   # Plugin definition for TokenRing app integration
├── AgentInkCLI.ts              # Main service class
├── AgentCLI.tsx                # Core component managing screen state
├── components/                 # Reusable components
│   ├── CommandInput.tsx        # Command input with history and auto-completion
│   ├── SelectInput.tsx         # Selection input component
│   └── Markdown.tsx            # Markdown rendering with syntax highlighting
├── hooks/                      # Custom hooks
│   ├── useAgentEvents.ts       # Agent event state management
│   ├── useOutputBlocks.tsx     # Output block processing
│   └── useScreenSize.ts        # Terminal size management
├── screens/                    # Screen components
│   ├── AgentChatScreen.tsx     # Agent chat interface
│   ├── AgentSelectionScreen.tsx # Agent selection interface
│   ├── AskScreen.tsx           # Text input screen
│   ├── ConfirmationScreen.tsx  # Confirmation prompt screen
│   ├── PasswordScreen.tsx      # Password input screen
│   ├── TreeSelectionScreen.tsx # Tree-based selection
│   └── WebPageScreen.tsx       # Web page opening screen
├── markdown.sample.md          # Markdown rendering sample
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Related Packages

- [@tokenring-ai/agent](./agent.md) - Agent orchestration and management
- [@tokenring-ai/app](./app.md) - Base application framework
- [@tokenring-ai/web-host](./web-host.md) - Web application hosting
- [@tokenring-ai/workflow](./workflow.md) - Workflow-based agent spawning

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
