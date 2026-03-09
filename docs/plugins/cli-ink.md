# CLI (Ink) - Deprecated

## ⚠️ Deprecated

The `cli-ink` package has been deprecated and merged into the main `@tokenring-ai/cli` package.

## Migration Guide

If you were using `@tokenring-ai/cli-ink`, please migrate to `@tokenring-ai/cli` with the `uiFramework` configuration option set to `"ink"`.

### Before (Deprecated)

```typescript
import cliInkPlugin from '@tokenring-ai/cli-ink';

const app = new TokenRingApp();
app.install(cliInkPlugin);
await app.start();
```

### After (Current)

```typescript
import cliPlugin from '@tokenring-ai/cli';

const app = new TokenRingApp();
app.install(cliPlugin, {
  cli: {
    uiFramework: 'ink',
    chatBanner: 'TokenRing CLI',
    loadingBannerNarrow: 'Loading...',
    loadingBannerWide: 'Loading TokenRing CLI...',
    loadingBannerCompact: 'Loading',
    screenBanner: 'TokenRing CLI',
  }
});
await app.start();
```

## Current Implementation

The Ink framework support is now included in the main `@tokenring-ai/cli` package. See the [CLI Plugin Documentation](./cli.md) for complete information.

### Key Features (Now in @tokenring-ai/cli)

- **Ink Framework Support**: React-based terminal rendering
- **Dual Framework**: Choose between OpenTUI or Ink at runtime
- **Same API**: Identical functionality across both frameworks
- **Unified Configuration**: Single configuration schema for both frameworks

### Package Structure

The Ink-specific implementations are located in `pkg/cli/ink/`:

```
pkg/cli/
├── ink/                           # Ink-specific implementations
│   ├── components/                # Ink UI components
│   │   └── inputs/                # Ink input components
│   │       ├── FileSelect.tsx
│   │       ├── FormInput.tsx
│   │       ├── TextInput.tsx
│   │       ├── TreeSelect.tsx
│   │       └── types.ts
│   ├── hooks/                     # Ink React hooks
│   │   └── useResponsiveLayout.ts # Ink responsive layout
│   ├── screens/                   # Ink screen components
│   │   ├── AgentSelectionScreen.tsx
│   │   ├── QuestionInputScreen.tsx
│   │   └── LoadingScreen.tsx
│   └── renderScreen.tsx           # Ink screen rendering
```

## Migration Checklist

- [ ] Replace `@tokenring-ai/cli-ink` import with `@tokenring-ai/cli`
- [ ] Add `cli` configuration object with `uiFramework: 'ink'`
- [ ] Add required banner configuration options
- [ ] Update any custom theme configurations
- [ ] Test the migrated configuration

## Related Documentation

- [CLI Plugin Documentation](./cli.md) - Current CLI package documentation
- [CLI Packages Overview](./cli-overview.md) - Overview of CLI packages

## License

MIT License - see LICENSE file for details.
