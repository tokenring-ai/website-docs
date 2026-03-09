# CLI Packages Overview

## Overview

Token Ring provides a primary CLI package for terminal interactions:

### `@tokenring-ai/cli` - Current Terminal Interface

**Purpose**: Provides a comprehensive terminal interface for interacting with Token Ring AI agents and services.

**Key Features:**
- Dual UI framework support (OpenTUI default, Ink optional)
- Agent selection and management
- Interactive chat with color-coded output
- Human interface request handling
- Command history and auto-completion
- Support for `/multi` command for multiline input
- Real-time event streaming
- Responsive layout adaptation
- Customizable theme

**Use Case**: Primary terminal interface for all TokenRing AI interactions.

## UI Frameworks

The `@tokenring-ai/cli` package supports two rendering frameworks:

### OpenTUI (Default)

- **Packages**: `@opentui/react`, `@opentui/core`
- **Features**: Advanced terminal rendering with alternate screen buffer support
- **Components**: Uses `<box>` and `<text>` JSX elements
- **Hooks**: `useTerminalDimensions()`, `useKeyboard()`
- **Best for**: Full-featured terminal applications with complex layouts

### Ink

- **Package**: `ink`
- **Features**: React-based terminal rendering
- **Components**: Uses `<Box>` and `<Text>` JSX elements (capitalized)
- **Hooks**: `useStdout()`, `useInput()`
- **Best for**: Users preferring React-like development experience

Both frameworks provide identical functionality. The choice is based on preference.

## Usage

### Basic CLI Usage

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();
app.install(cliPlugin, {
  cli: {
    chatBanner: 'TokenRing CLI',
    uiFramework: 'opentui', // or 'ink'
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
  }
});
await app.start();
```

### Using Ink Framework

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();
app.install(cliPlugin, {
  cli: {
    chatBanner: 'TokenRing CLI',
    uiFramework: 'ink',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
  }
});
await app.start();
```

## Dependencies

### @tokenring-ai/cli Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service
- `@tokenring-ai/utility`: Shared utilities
- `@tokenring-ai/web-host`: Web resource hosting
- `@tokenring-ai/workflow`: Workflow support
- `@tokenring-ai/filesystem`: File system operations
- `@inquirer/prompts`: Interactive prompts
- `chalk`: Terminal color styling
- `execa`: Process execution
- `open`: URL opening
- `zod`: Schema validation
- `@opentui/core`: OpenTUI core (if using OpenTUI)
- `@opentui/react`: OpenTUI React (if using OpenTUI)
- `ink`: Terminal UI framework (if using Ink)
- `react`: React library
- `fullscreen-ink`: Fullscreen support (if using Ink)

## Development Status

- `@tokenring-ai/cli`: Active development, recommended for all projects
- Supports both OpenTUI and Ink frameworks
- Regular updates and improvements

## Related Documentation

- [CLI Plugin Documentation](./cli.md) - Detailed documentation for `@tokenring-ai/cli`
- [CLI Ink Documentation](./cli-ink.md) - Ink-specific implementation details

## License

MIT License - see LICENSE file for details.
