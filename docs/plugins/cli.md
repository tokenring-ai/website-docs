# CLI Plugin

Command-line interface for interacting with Token Ring AI agents and services.

## Overview

The `@tokenring-ai/cli` package provides a terminal-based interface for interacting with Token Ring AI agents. It enables users to:

- Select and run different AI agents
- Use chat commands like `/edit`, `/multi`
- Handle human interface requests (forms, confirmations, web pages)
- Manage agent sessions with a rich terminal UI
- Support for command history, auto-completion, and keyboard shortcuts

## Key Features

- **Interactive Agent Selection**: Browse and select from available agents
- **Rich Terminal UI**: Color-coded output, spinners, and structured layouts
- **Human Interface Handling**: Forms, confirmations, password prompts, web page displays
- **Command System**: Chat commands for special operations
- **Session Management**: Multiple agent sessions with clean separation
- **Keyboard Navigation**: Arrow keys for history, Escape for cancellation
- **Signal Handling**: Graceful shutdown and abort handling

## Core Components

### AgentCLI Service

The main CLI service that manages the terminal interface and agent interaction.

**Key Methods:**
- `run()`: Starts the CLI interface and handles agent sessions
- `selectOrCreateAgent()`: Renders agent selection screen
- `runAgentLoop(agent)`: Manages a single agent session
- `gatherInput(agent, signal)`: Collects user input with history
- `handleHumanRequest(request, signal)`: Handles human interface requests

### Chat Commands

The CLI provides built-in chat commands for enhanced functionality:

#### `/edit`
- Opens system editor for complex prompt creation
- Pre-fills editor with optional initial text
- Returns edited content as agent input

**Usage:** `/edit [initial-text]`

#### `/multi`
- Opens editor for multi-line input
- Simple interface for long text or code
- Submits content when editor is saved/closed

**Usage:** `/multi`

### Terminal Screens

Multiple interactive screens for different UI needs:

- **AgentSelectionScreen**: Browse and select agents
- **AskScreen**: Text input prompts
- **ConfirmationScreen**: Yes/no confirmation dialogs
- **PasswordScreen**: Secure password input
- **TreeSelectionScreen**: Hierarchical selection
- **WebPageScreen**: Display web content in terminal
- **FormScreen**: Multi-field input forms

## Configuration Options

### CLI Config Schema

```typescript
const CLIConfigSchema = z.object({
  bannerNarrow: z.string(),
  bannerWide: z.string(),
  bannerCompact: z.string(),
});
```

### Configuration Options
- `bannerNarrow`: Narrow banner text for small terminals
- `bannerWide`: Wide banner text for full-width display
- `bannerCompact`: Compact banner for minimal display

## Usage Examples

### Basic CLI Usage

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();
app.use(cliPlugin);
app.start();
```

### Interactive Session

1. Run the Token Ring app with CLI enabled
2. Select an agent from the agent selection screen
3. Type questions and hit Enter
4. Use commands like `/edit` for complex prompts
5. Type `/switch` to change agents or `/quit` to exit

### Command Examples

```bash
# Open editor for prompt creation
/edit Write a detailed story about AI

# Open editor for multi-line input
/multi

# Switch to another agent
/switch

# Exit to agent selection
/quit
```

## Terminal Features

### Output Types

- **Chat Output**: Regular conversation messages
- **Reasoning Output**: Agent's internal reasoning
- **Info Messages**: System information
- **Warning Messages**: Non-critical issues
- **Error Messages**: Critical problems

### Keyboard Shortcuts

- `Ctrl+C`: Abort current operation or exit
- `↑/↓`: Navigate command history
- `Esc`: Cancel current input
- `Ctrl+T`: Show shortcuts (when available)

## Integration Details

### Service Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/agent/AgentCommandService`: Command registration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service for commands
- `@tokenring-ai/agent/services/AgentManager`: Agent lifecycle management

### Event Handling

The CLI subscribes to agent events and renders them appropriately:

- `output.chat`: Regular chat messages
- `output.reasoning`: Agent's thinking process
- `output.info`: Informational messages
- `output.warning`: Warning messages
- `output.error`: Error messages
- `input.handled`: Input processing status
- `input.received`: User input display

### Human Interface Requests

The CLI handles various human interface request types:

- `askForText`: Text input prompts
- `askForConfirmation`: Yes/no questions
- `askForMultipleTreeSelection`: Multi-select from hierarchy
- `askForSingleTreeSelection`: Single selection from hierarchy
- `openWebPage`: Display web content
- `askForPassword`: Secure password input
- `askForForm`: Multi-field form input

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service
- `@tokenring-ai/agent/services/AgentManager`: Agent management
- `@tokenring-ai/utility`: String utilities and helpers
- `@inquirer/prompts`: Interactive prompts
- `chalk`: Terminal color styling
- `execa`: Process execution
- `open`: URL opening
- `@opentui/core`: Terminal UI components
- `@opentui/react`: React components for TUI
- `react`: UI library
- `zod`: Schema validation
- `node:readline`: Terminal input handling

## Development

### Testing

Run tests with:
```bash
bun run test
```

### Building

Build the package with:
```bash
bun run build
```

### Configuration

The CLI uses environment variables for editor selection:
- `EDITOR`: Set preferred text editor
- Falls back to platform defaults (vi/notepad)

## Notes

- The CLI supports both narrow and wide terminal modes
- Color schemes are configurable through theme
- All input is handled with proper signal cancellation
- Session state is maintained per agent
- Human interface requests are rendered in terminal-friendly formats
```