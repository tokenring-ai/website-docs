# CLI Packages Overview

## Overview

Token Ring provides a primary CLI package for terminal interactions:

### `@tokenring-ai/cli` - Current Terminal Interface

**Purpose**: Provides a comprehensive terminal interface for interacting with Token Ring AI agents and services.

**Key Features:**
- Raw terminal UI with ANSI escape codes for maximum compatibility
- Agent selection and management via interactive screen
- Interactive chat with color-coded output and markdown styling
- Human interface request handling (questions, follow-ups, forms)
- Command history and auto-completion
- Real-time event streaming with incremental rendering
- Responsive layout adaptation with terminal resize handling
- Customizable theme with hex color values
- File path completion using `@` syntax
- Bracketed paste support for efficient text input

**Use Case**: Primary terminal interface for all TokenRing AI interactions.

## UI Frameworks

The `@tokenring-ai/cli` package currently implements a raw terminal UI using ANSI escape codes directly. The configuration schema includes a `uiFramework` option (`'ink'` | `'opentui'`) for future framework support, but the current implementation uses raw terminal rendering with:

- **Terminal Control**: Direct ANSI escape code sequences for cursor positioning, screen clearing, and text styling
- **Input Handling**: Node.js readline with keypress events and bracketed paste mode
- **Output Rendering**: Incremental screen updates with full replay on resize
- **Styling**: Chalk-based hex color theming for consistent appearance

This approach provides:
- Maximum compatibility across terminal emulators
- No external UI framework dependencies
- Full control over rendering behavior
- Lightweight implementation

### Configuration Options

```typescript
const config = {
  cli: {
    chatBanner: 'TokenRing CLI',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
    uiFramework: 'opentui', // Reserved for future use
    verbose: false,
  },
};
```

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

### @tokenring-ai/cli Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/ai-client` | 0.2.0 | AI model client integration |
| `@tokenring-ai/chat` | 0.2.0 | Chat service integration |
| `@tokenring-ai/agent` | 0.2.0 | Agent orchestration |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities |
| `@tokenring-ai/web-host` | 0.2.0 | Web hosting service |
| `@tokenring-ai/workflow` | 0.2.0 | Workflow management |
| `@tokenring-ai/filesystem` | 0.2.0 | File system operations |
| `zod` | ^4.3.6 | Schema validation |
| `chalk` | ^5.6.2 | Terminal styling |
| `open` | ^11.0.0 | Open URLs in browser |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

## Development Status

- `@tokenring-ai/cli`: Active development, recommended for all projects
- Raw terminal UI implementation with ANSI escape codes
- Regular updates and improvements
- Comprehensive test coverage with vitest

## Related Documentation

- [CLI Plugin Documentation](./cli.md) - Detailed documentation for `@tokenring-ai/cli`
- [CLI Ink Documentation](./cli-ink.md) - Ink-specific implementation details

## License

MIT License - see LICENSE file for details.
