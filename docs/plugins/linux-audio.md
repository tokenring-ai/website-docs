# Linux Audio Plugin

## Overview

Linux audio integration using naudiodon3 for Token Ring AI, providing native audio recording and playback capabilities on Linux systems. This plugin integrates with the Token Ring AI ecosystem to enable system-level audio operations within the framework.

## Key Features

- **Recording**: Capture audio from the microphone using naudiodon3 with configurable sample rate and channels
- **Playback**: Play WAV audio files through system audio, with automatic format conversion via ffmpeg for non-WAV formats
- **Format Support**: WAV format for recording; supports playback of multiple audio formats (WAV, MP3, etc.) via ffmpeg
- **Configurable Options**: Customizable sample rate, channels, and format parameters
- **Abort Signal Support**: Recording can be stopped via AbortSignal with automatic cleanup
- **Plugin Integration**: Automatically registers with Token Ring AI AudioService when configured

## Core Components

### LinuxAudioProvider

The main class that implements the `AudioProvider` interface for Linux systems. It handles audio recording and playback operations using naudiodon3 and system-level audio tools.

**Implements:** `AudioProvider`

**Package Path:** `@tokenring-ai/linux-audio/LinuxAudioProvider.ts`

**Usage:**

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));
```

## Services

### LinuxAudioProvider

The main service class that implements the AudioProvider interface for Linux systems.

#### Constructor

```typescript
new LinuxAudioProvider(options: LinuxAudioProviderOptions)
```

**Parameters:**
- `options` (`LinuxAudioProviderOptions`): Configuration options including type, record settings, and playback settings

#### Methods

##### `record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>`

Records audio from the system microphone to a WAV file.

**Parameters:**
- `abortSignal`: AbortSignal to stop recording
- `options`: Optional recording configuration (sampleRate, channels)

**Returns:** `Promise<RecordingResult>` containing the path to the recorded WAV file

**Example:**

```typescript
const abortController = new AbortController();
const recording = await provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});
console.log('Recording saved to:', recording.filePath);
```

##### `playback(filename: string): Promise<string>`

Plays an audio file through the system audio. Supports WAV files directly and other formats via ffmpeg.

**Parameters:**
- `filename`: Path to audio file (WAV or other formats)

**Returns:** `Promise<string>` with the filename on success

**Example:**

```typescript
// WAV file
await provider.playback('/tmp/recording.wav');

// Other formats (MP3, etc.) via ffmpeg
await provider.playback('/tmp/recording.mp3');
```

### RecordingOptions Interface

```typescript
interface RecordingOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
  timeout?: number;
}
```

**Properties:**
- `sampleRate`: Audio sample rate in Hz (optional, defaults to provider configuration)
- `channels`: Number of audio channels (optional, defaults to provider configuration)
- `format`: Audio format (optional, defaults to provider configuration)
- `timeout`: Recording timeout in milliseconds (optional)

### RecordingResult Interface

```typescript
interface RecordingResult {
  filePath: string;
}
```

**Properties:**
- `filePath`: Path to the recorded audio file

## Providers

### LinuxAudioProvider

The LinuxAudioProvider implements the AudioProvider interface and can be registered with the AudioService.

**Configuration Schema:** `LinuxAudioProviderOptionsSchema`

**Export Path:** `@tokenring-ai/linux-audio/LinuxAudioProvider.ts`

#### Configuration Schema

```typescript
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const config = LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
});
```

**Configuration Options:**
- `type`: Must be `"linux"` for this provider (required)
- `record`: Recording configuration object
  - `sampleRate`: Audio sample rate in Hz (default: 48000)
  - `channels`: Number of audio channels (default: 1, mono)
  - `format`: Audio format for recording (default: 'wav')
- `playback`: Empty object for future playback configuration options (default: {})

#### Plugin Registration

The provider can be registered with AudioService either through the plugin or manually:

```typescript
import { AudioService } from '@tokenring-ai/audio/AudioService';
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const audioService = new AudioService();
const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

// Register with audio service
audioService.registerProvider('linux', provider);
audioService.setActiveProvider('linux');
```

## RPC Endpoints

This package does not define RPC endpoints. Audio operations are handled through the AudioService interface.

## Chat Commands

This package does not define chat commands. Chat commands are handled by the `@tokenring-ai/audio` package.

## Configuration

### Plugin Configuration

The plugin is configured through the Token Ring AI application configuration. When installed, it automatically registers the LinuxAudioProvider with the AudioService.

**Configuration Schema:**

```typescript
const packageConfigSchema = z.object({
  audio: AudioServiceConfigSchema,
});
```

**Example Application Configuration:**

```json
{
  "audio": {
    "providers": {
      "linux": {
        "type": "linux",
        "record": {
          "sampleRate": 48000,
          "channels": 1,
          "format": "wav"
        },
        "playback": {}
      }
    }
  }
}
```

**Configuration Properties:**
- `audio.providers.linux.type`: Must be `"linux"`
- `audio.providers.linux.record.sampleRate`: Audio sample rate in Hz (default: 48000)
- `audio.providers.linux.record.channels`: Number of channels (default: 1)
- `audio.providers.linux.record.format`: Audio format (default: 'wav')
- `audio.providers.linux.playback`: Playback configuration (currently empty)

## Integration

The Linux Audio Plugin integrates with the Token Ring AI AudioService to provide native audio operations. It registers as a provider for the AudioService, allowing applications to use it for recording and playback.

### Service Integration

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const audioService = new AudioService();
const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

audioService.registerProvider('linux', provider);
const recording = await audioService.record(abortSignal);
await audioService.playback(recording.filePath);
```

### Plugin Integration

The plugin automatically registers the provider when the application is configured:

```typescript
// In plugin.ts
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.audio) {
      app.waitForService(AudioService, audioService => {
        for (const name in config.audio!.providers) {
          const provider = config.audio!.providers[name];
          if (provider.type === "linux") {
            audioService.registerProvider(name, new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Usage Examples

### Automatic Registration (Recommended)

When used as part of the Token Ring AI application, the plugin automatically registers with the AudioService based on the app configuration:

```typescript
// Configure in your app config
const config = {
  audio: {
    providers: {
      linux: {
        type: 'linux',
        record: {
          sampleRate: 48000,
          channels: 1,
          format: 'wav'
        },
        playback: {}
      }
    }
  }
};
```

### Manual Registration

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { AudioService } from '@tokenring-ai/audio/AudioService';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

const audioService = new AudioService();
audioService.registerProvider('linux', provider);
audioService.setActiveProvider('linux');

// Use audio operations
const recording = await audioService.record(abortSignal);
await audioService.playback(recording.filePath);
```

### Recording with Abort Signal

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

const abortController = new AbortController();

// Start recording
const recordingPromise = provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});

// Stop recording after 10 seconds
setTimeout(() => {
  abortController.abort();
}, 10000);

const recording = await recordingPromise;
console.log('Recording saved to:', recording.filePath);
```

### Playback with Error Handling

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

try {
  await provider.playback('/path/to/audio.wav');
  console.log('Playback completed');
} catch (error) {
  if (error instanceof Error) {
    console.error('Playback failed:', error.message);
    if (error.message.includes('Audio file not found')) {
      console.error('File does not exist');
    }
  }
}
```

## Best Practices

### Recording Best Practices

- Use AbortSignal to properly stop recording and clean up resources
- Set appropriate sample rates based on audio quality requirements (48000 Hz recommended)
- Use mono (1 channel) for speech recording to reduce file size
- Store recordings in `/tmp/` with timestamp-based filenames for temporary use
- Clean up old recordings periodically to free disk space

### Playback Best Practices

- Ensure audio files exist before playback to avoid errors
- Use WAV format for simple audio playback for direct compatibility
- Use ffmpeg for complex audio formats (MP3, etc.) that require conversion
- Handle playback errors gracefully with appropriate retry logic

### Performance Optimization

- Higher sample rates improve audio quality but increase file size
- Mono channels (1 channel) reduce file size compared to stereo
- Recording duration is limited by available disk space
- Use AbortSignal to prevent resource leaks
- Consider using audio compression for long recordings

## Monitoring and Debugging

### Error Handling

The provider includes robust error handling for audio operations:

**Recording Errors:**

```typescript
try {
  const recording = await provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
    // Handle specific errors based on error message
  }
}
```

**Playback Errors:**

```typescript
try {
  await provider.playback('/path/to/audio.wav');
} catch (error) {
  if (error instanceof Error) {
    console.error('Playback failed:', error.message);
    // Handle file not found or audio device errors
  }
}
```

### Logging

Debug logs can be enabled via the Token Ring AI logging system to monitor audio operations.

### Performance Considerations

- Higher sample rates improve audio quality but increase file size
- Mono channels (1 channel) reduce file size compared to stereo
- Recording duration is limited by available disk space
- Recording files are stored in `/tmp/` with timestamp-based filenames (e.g., `recording-2025-01-15T10-30-00-000Z.wav`)
- Ensure proper cleanup by using AbortSignal to stop recording
- Audio files are written using the wav.FileWriter from the wav package

## Testing

### Unit Tests

The package includes unit tests using Vitest. Run tests with:

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Integration Testing

To test the Linux audio functionality:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

describe('LinuxAudioProvider', () => {
  let provider: LinuxAudioProvider;
  
  beforeEach(() => {
    provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
      type: 'linux',
      record: {
        sampleRate: 44100,
        channels: 1,
        format: 'wav'
      },
      playback: {}
    }));
  });
  
  it('should create provider with default options', () => {
    expect(provider).toBeDefined();
  });
});
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/ai-client`: ^0.2.0
- `@tokenring-ai/app`: ^0.2.0
- `@tokenring-ai/agent`: ^0.2.0
- `@tokenring-ai/audio`: ^0.2.0
- `@tokenring-ai/chat`: ^0.2.0
- `@tokenring-ai/naudiodon3`: ^2.5.0
- `wav`: ^1.0.2
- `@types/wav`: ^1.0.4
- `zod`: ^4.3.6

### Development Dependencies

- `vitest`: ^4.0.18
- `typescript`: ^5.9.3

### System Dependencies

- Linux operating system (Ubuntu/Debian tested)
- ALSA (Advanced Linux Sound Architecture)
- Node.js 18+ or later
- System audio libraries: `libasound2-dev`
- Optional: `ffmpeg` for non-WAV audio playback

## System Requirements

### Minimum Requirements

- Linux operating system (Ubuntu/Debian recommended)
- ALSA (Advanced Linux Sound Architecture)
- Node.js 18+ or later
- At least 100MB free disk space for audio recordings
- Audio input device (microphone)

### Installation of System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install libasound2-dev build-essential

# Optional: for non-WAV audio playback
sudo apt-get install ffmpeg

# Verify installation
aplay -l  # List audio devices
arecord -l  # List recording devices
```

## Development

### Building the Package

```bash
# Install dependencies
bun install

# Build type definitions
tsc --noEmit

# Run tests
bun test

# Run tests with coverage
bun test --coverage
```

### Package Structure

```
pkg/linux-audio/
├── plugin.ts              # Plugin definition and registration
├── LinuxAudioProvider.ts  # Main provider implementation
├── index.ts               # Package exports
├── package.json           # Package metadata and dependencies
├── README.md              # Package documentation
└── vitest.config.ts       # Vitest configuration
```

### Export Structure

```typescript
// package.json exports
{
  ".": "./index.ts",
  "./*": "./*.ts"
}
```

**Available Exports:**

- `@tokenring-ai/linux-audio`: Main package entry point (exports LinuxAudioProvider)
- `@tokenring-ai/linux-audio/LinuxAudioProvider.ts`: LinuxAudioProvider class
- `@tokenring-ai/linux-audio/LinuxAudioProviderOptionsSchema`: Configuration schema

## Related Components

- `@tokenring-ai/audio`: Audio service and interfaces (AudioProvider, AudioService)
- `@tokenring-ai/naudiodon3`: Native audio I/O for Node.js
- `@tokenring-ai/agent`: Agent system integration
- `@tokenring-ai/app`: Application framework
- `wav`: WAV file format support

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contributing

When contributing to this package:

1. Ensure all tests pass: `bun test`
2. Run type checking: `tsc --noEmit`
3. Update documentation for any API changes
4. Follow the existing code style and patterns
5. Test on Linux systems with ALSA

## Changelog

### v0.2.0

- Initial release with Linux audio support
- Recording functionality using naudiodon3
- Audio playback with WAV format support
- Automatic format conversion via ffmpeg for non-WAV files
- Plugin integration with Token Ring AI ecosystem
