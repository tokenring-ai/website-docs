# CLI Plugin

REPL service for interactive command-line interaction with TokenRing AI agents.

## Overview

The `@tokenring-ai/cli` package provides a Read-Eval-Print Loop (REPL) service for interactive command-line interaction with TokenRing AI agents. It enables users to select or create agents, send chat inputs, execute built-in commands, and handle human interface requests such as confirmations, selections, and multiline inputs.

## Key Features

- Interactive agent selection and creation
- Real-time event streaming and display
- Built-in command execution (`/help`, `/edit`, etc.)
- Human interface requests (confirmations, selections)
- Multiline input support
- Colored terminal output
- Command auto-completion

## Core Components

### REPLService

Main REPL implementation managing the interactive CLI loop.

**Key Methods:**
- `run()`: Starts the REPL loop
- `injectPrompt(prompt)`: Queues a prompt to inject into current session
- `selectOrCreateAgent()`: Prompts user to connect to or create agents
- `runAgentLoop(agent)`: Sets up commands and runs agent-specific loop

### REPLInput

Prompt utilities for human-AI interactions.

**Key Functions:**
- `askForCommand(options)`: Gets user input with auto-completion
- `ask({ question })`: Multi-line editor prompt
- `askForConfirmation(options)`: Yes/no confirmation
- `askForSelection({ title, items })`: Single list selection
- `askForMultipleSelections({ title, items })`: Multiple checkbox selections
- `askForSingleTreeSelection(options)`: Tree-based single selection
- `askForMultipleTreeSelection(options)`: Tree-based multiple selection
- `openWebPage({ url })`: Opens URL in default browser

### Chat Commands

**help**: Lists all available commands with descriptions

**exit/quit**: Ends current agent session and returns to selection

**multi**: Opens Inquirer editor for multiline input

**edit**: Opens system editor (via `EDITOR` env) on temp file

## Usage Example

```typescript
import AgentTeam from '@tokenring-ai/agent/AgentTeam';
import REPLService from '@tokenring-ai/cli';

const team = new AgentTeam(/* config */);
const repl = new REPLService(team);
await repl.run();  // Starts interactive CLI
```

## Configuration Options

- `EDITOR` environment variable: Specifies default editor for `/edit` command (defaults to `vi` on Unix, `notepad` on Windows)
- Command auto-completion: Dynamically populated from available commands
- Output styling: Colors and spinners via Chalk/Ora

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent management
- `@tokenring-ai/ai-client@0.1.0`: AI integration
- `@inquirer/prompts@^7.8.2`: Interactive prompts
- `chalk@^5.5.0`: Terminal styling
- `ora@^8.2.0`: Spinners for loading
- `execa@^9.6.0`: Shell command execution
