# cli-ink Plugin

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
app.install(cliInkPlugin, &#123;
  inkCLI: &#123;
    bannerNarrow: 'TokenRing CLI',
    bannerWide: 'TokenRing AI CLI',
    bannerCompact: 'CLI',
    bannerColor: 'cyan'
  &#125;
&#125;);
await app.start();
```

### Plugin Integration

```typescript
import TokenRingApp, &#123; TokenRingPlugin &#125; from '@tokenring-ai/app';
import AgentInkCLI, &#123; InkCLIConfigSchema &#125; from '@tokenring-ai/cli-ink';
import &#123; z &#125; from 'zod';

import packageJSON from './package.json' with &#123; type: 'json' &#125;;

const packageConfigSchema = z.object(&#123;
  inkCLI: InkCLIConfigSchema.optional(),
&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    if (config.inkCLI) &#123;
      app.addServices(new AgentInkCLI(app, config.inkCLI));
    &#125;
  &#125;,
  config: packageConfigSchema,
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
```

## Configuration

### CLI Configuration Schema

```typescript
export const InkCLIConfigSchema = z.object(&#123;
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
  bannerColor: z.string().optional().default('cyan'),
&#125;);
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
export default class AgentInkCLI implements TokenRingService &#123;
  name = 'AgentInkCLI';
  description = 'Ink-based CLI for interacting with agents';

  constructor(app: TokenRingApp, config: z.infer&lt;typeof InkCLIConfigSchema&gt;);

  async run(): Promise&lt;void&gt;;
&#125;
```

### AgentCLI Component

Top-level component managing screen state transitions and rendering.

```typescript
interface AgentCLIProps extends z.infer&lt;typeof InkCLIConfigSchema&gt; &#123;
  agentManager: AgentManager;
  app: TokenRingApp;
&#125;

export default function AgentCLI(props: AgentCLIProps);
```

### Screen Types

```typescript
type Screen =
  | &#123; name: 'selectAgent' &#125;
  | &#123; name: 'chat'; agentId: string &#125;
  | &#123; name: 'askForConfirmation'; request: HumanInterfaceRequestFor&lt;"askForConfirmation"&gt;, onResponse: (response: HumanInterfaceResponseFor&lt;'askForConfirmation'&gt;) =&gt; void &#125;
  | &#123; name: 'askForPassword'; request: HumanInterfaceRequestFor&lt;"askForPassword"&gt;, onResponse: (response: HumanInterfaceResponseFor&lt;'askForPassword'&gt;) =&gt; void &#125;
  | &#123; name: 'openWebPage'; request: HumanInterfaceRequestFor&lt;"openWebPage"&gt;, onResponse: (response: HumanInterfaceResponseFor&lt;'openWebPage'&gt;) =&gt; void &#125;
  | &#123; name: 'askForSingleTreeSelection'; request: HumanInterfaceRequestFor&lt;"askForSingleTreeSelection"&gt;, onResponse: (response: HumanInterfaceResponseFor&lt;'askForSingleTreeSelection'&gt;) =&gt; void &#125;
  | &#123; name: 'askForMultipleTreeSelection'; request: HumanInterfaceRequestFor&lt;"askForMultipleTreeSelection"&gt;, onResponse: (response: HumanInterfaceResponseFor&lt;'askForMultipleTreeSelection'&gt;) =&gt; void &#125;
  | &#123; name: 'askForText'; request: HumanInterfaceRequestFor&lt;"askForText"&gt;, onResponse: (response: HumanInterfaceResponseFor&lt;'askForText'&gt;) =&gt; void &#125;;
```

## Screen Components

### AgentChatScreen

Main chat interface displaying agent outputs and handling input.

```typescript
interface AgentChatScreenProps &#123;
  agentEventState: AgentEventState | null;
  currentAgent: Agent;
  setScreen: (screen: Screen) =&gt; void;
&#125;

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
interface AgentSelectionScreenProps &#123;
  app: TokenRingApp;
  setScreen: (screen: Screen) =&gt; void;
  onCancel: () =&gt; void;
&#125;

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
export interface CommandInputProps &#123;
  history?: string[];
  autoCompletion?: string[];
  onSubmit: (value: string) =&gt; void;
  onCancel?: () =&gt; void;
  onCtrlC?: () =&gt; void;
  prompt?: string;
&#125;

export const CommandInput: React.FC&lt;CommandInputProps&gt;;
```

Features:
- Command history navigation (up/down arrows)
- Tab auto-completion
- Ctrl+C handling
- Escape to cancel

### SelectInput

Generic selection input component.

```typescript
export interface SelectOption&lt;T = string&gt; &#123;
  label: string;
  value: T;
&#125;

export interface SelectInputProps&lt;T = string&gt; &#123;
  message?: string;
  options: SelectOption&lt;T&gt;[];
  onSelect: (value: T) =&gt; void;
  onCancel?: () =&gt; void;
&#125;

export function SelectInput&lt;T = string&gt;(props: SelectInputProps&lt;T&gt;): React.ReactElement;
```

### Markdown

Renders markdown with syntax highlighting.

```typescript
export interface InkMarkdownProps &#123;
  children: string;
  options?: InkMarkdownOptions;
&#125;

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
export function useAgentEvents(agent: Agent | null) &#123;
  // Returns AgentEventState or null
&#125;
```

### useOutputBlocks

Processes agent events into structured output blocks.

```typescript
export type OutputBlock =
  | &#123; type: 'chat'; message: string &#125;
  | &#123; type: 'reasoning'; message: string &#125;
  | &#123; type: 'input'; message: string &#125;
  | &#123; type: 'system'; message: string; level: 'info' | 'warning' | 'error' &#125;;

export function useOutputBlocks(events: AgentEventState["events"] | null) &#123;
  // Returns OutputBlock[]
&#125;
```

### useScreenSize

Tracks terminal dimensions for responsive layout.

```typescript
export default function useScreenSize() &#123;
  // Returns &#123; rows: number, columns: number &#125;
&#125;
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
