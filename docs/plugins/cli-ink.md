# CLI (Ink) - Deprecated

## ⚠️ Deprecated

The `cli-ink` package has been deprecated. The `@tokenring-ai/cli` package now uses a **raw terminal UI** implementation with direct ANSI escape code rendering, which provides maximum compatibility and does not require external UI frameworks like Ink or OpenTUI.

## Current Implementation

The current `@tokenring-ai/cli` package implements a raw terminal UI that:

- Uses direct ANSI escape codes for terminal control
- Leverages Node.js readline for input handling
- Provides incremental screen rendering with full replay on resize
- Supports bracketed paste mode for efficient text input
- Applies hex color theming via Chalk for consistent styling

### Why Raw Terminal UI?

The raw terminal UI approach was chosen for:

1. **Maximum Compatibility**: Works across all terminal emulators without framework dependencies
2. **Lightweight**: No external UI framework overhead
3. **Full Control**: Complete control over rendering behavior and performance
4. **Simplified Dependencies**: Reduces package size and complexity

## Migration Guide

If you were using `@tokenring-ai/cli-ink`, migrate to the current `@tokenring-ai/cli` package:

### Before (Deprecated - cli-ink)

```typescript
import cliInkPlugin from '@tokenring-ai/cli-ink';

const app = new TokenRingApp();
app.install(cliInkPlugin);
await app.start();
```

### After (Current - raw terminal UI)

```typescript
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();
app.install(cliPlugin, {
  cli: {
    chatBanner: 'TokenRing CLI',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
    verbose: false,
  },
});
await app.start();
```

## Configuration

The current CLI uses the `CLIConfigSchema` from `@tokenring-ai/cli/schema`:

```typescript
import { CLIConfigSchema } from '@tokenring-ai/cli';

// Configuration options:
const config = {
  cli: {
    chatBanner: string,           // Banner during chat sessions
    loadingBannerNarrow: string,  // Banner for narrow terminals
    loadingBannerWide: string,    // Banner for wide terminals
    loadingBannerCompact: string, // Banner for compact layouts
    screenBanner: string,         // Banner on all interactive screens
    uiFramework: 'ink' | 'opentui', // Reserved for future use
    verbose: boolean,             // Show reasoning/artifacts
    startAgent?: {
      type: string,               // Agent type to spawn
      prompt?: string,            // Initial prompt
      shutdownWhenDone?: boolean, // Shutdown after completion
    },
  },
};
```

## Key Features

The current `@tokenring-ai/cli` provides:

- **Interactive Agent Selection**: Choose from available agents, workflows, or web apps
- **Real-time Streaming**: Incremental rendering of agent output
- **Command Completion**: Tab completion for slash commands
- **File Path Completion**: `@` syntax for workspace file search
- **Human Interface Handling**: Questions, follow-ups, and forms
- **Keyboard Shortcuts**: Full navigation and control
- **Customizable Theme**: Hex color theming via `theme.ts`
- **Graceful Shutdown**: Proper signal handling and cleanup

## Migration Checklist

- [ ] Replace `@tokenring-ai/cli-ink` import with `@tokenring-ai/cli`
- [ ] Add `cli` configuration object with required banner options
- [ ] Remove any Ink-specific dependencies
- [ ] Update any custom theme configurations to use hex colors
- [ ] Test the migrated configuration

## Related Documentation

- [CLI Plugin Documentation](./cli.md) - Current CLI package documentation
- [CLI Packages Overview](./cli-overview.md) - Overview of CLI packages

## License

MIT License - see LICENSE file for details.
