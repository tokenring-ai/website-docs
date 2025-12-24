# CLI Packages Overview

## Overview

Token Ring provides two primary CLI packages for different use cases:

### `@tokenring-ai/cli` - Legacy Terminal Interface

**Purpose**: Provides a basic terminal interface for interacting with Token Ring AI agents and services.

**Key Features:**
- Simple terminal-based interface
- Agent selection and management
- Basic human interface request handling
- Command history and auto-completion
- Support for commands like `/edit` and `/multi`

**Use Case**: Simple terminal interactions with minimal UI features.

### `@tokenring-ai/cli-ink` - Ink-based Interactive CLI

**Purpose**: Provides an enhanced, interactive terminal interface using the Ink framework for rich terminal applications.

**Key Features:**
- Interactive terminal interface with Ink framework
- Real-time event processing with color-coded output
- Comprehensive command support (`/help`, `/markdown`, `/quit`, `/exit`)
- Dynamic screen management
- Code block syntax highlighting
- Responsive layout that adapts to terminal size
- Web application integration
- Workflow agent spawning

**Use Case**: Feature-rich terminal experience with advanced UI capabilities.

## Comparison

| Feature | `@tokenring-ai/cli` | `@tokenring-ai/cli-ink` |
|---------|-------------------|------------------------|
| **UI Framework** | Basic terminal UI | Ink framework |
| **Output Formatting** | Basic text | Color-coded, syntax highlighting |
| **Commands** | `/edit`, `/multi` | `/help`, `/markdown`, `/quit`, `/exit` |
| **Screen Management** | Basic screens | Dynamic screen switching |
| **Human Interface** | Basic handling | Comprehensive handling with multiple request types |
| **Web Integration** | Limited | Full SPA and web application support |
| **Workflow Support** | Basic | Advanced workflow agent spawning |

## Usage

### For Basic Terminal Interface

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();
app.use(cliPlugin);
await app.start();
```

### For Enhanced Ink-based Interface

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import cliInkPlugin from '@tokenring-ai/cli-ink';

const app = new TokenRingApp();
app.install(cliInkPlugin);
await app.start();
```

## Dependencies

### `@tokenring-ai/cli` Dependencies
- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework  
- `@tokenring-ai/chat`: Chat service
- `@inquirer/prompts`: Interactive prompts
- `chalk`: Terminal color styling
- `execa`: Process execution

### `@tokenring-ai/cli-ink` Dependencies
- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/utility`: Shared utilities
- `@tokenring-ai/web-host`: Web resource hosting
- `ink`: Terminal UI framework
- `ink-syntax-highlight`: Code syntax highlighting
- `@inquirer/prompts`: Interactive prompts
- `chalk`: Terminal color styling
- `execa`: Process execution
- `open`: URL opening

## Development Status

- `@tokenring-ai/cli`: Legacy package, maintained for compatibility
- `@tokenring-ai/cli-ink`: Active development, recommended for new projects

## Migration

For users looking to upgrade from the basic CLI to the enhanced Ink-based CLI:

1. Replace `@tokenring-ai/cli` with `@tokenring-ai/cli-ink` in your imports
2. Update configuration to use `InkCLIConfigSchema` instead of `CLIConfigSchema`
3. Take advantage of the enhanced commands and features
4. Benefit from improved terminal UI and responsiveness

The Ink-based CLI maintains compatibility with the same core functionality while providing significant UI and feature improvements.