# @tokenring-ai/linux-audio

## Overview

Linux audio integration using naudiodon3 for Token Ring AI, providing native audio recording and playback capabilities on Linux systems. This plugin integrates with the Token Ring AI ecosystem to enable system-level audio operations within the framework.

The `@tokenring-ai/linux-audio` package implements the `AudioProvider` interface for Linux systems, using the [naudiodon3](https://github.com/antoniomgorczynski/naudiodon3) library for native audio I/O operations. It works seamlessly with the `@tokenring-ai/audio` package's `AudioService` to provide recording and playback functionality.

## Key Features

- **Recording**: Capture audio from the microphone using naudiodon3 with configurable sample rate and channels
- **Playback**: Play WAV audio files through system audio, with automatic format conversion via ffmpeg for non-WAV formats
- **Format Support**: WAV format for recording; supports playback of multiple audio formats (WAV, MP3, etc.) via ffmpeg
- **Configurable Options**: Customizable sample rate, channels, and format parameters
- **Abort Signal Support**: Recording can be stopped via AbortSignal with automatic cleanup
- **Plugin Integration**: Automatically registers with Token Ring AI AudioService when configured
- **16-bit Audio**: Records audio in 16-bit PCM format for high quality
- **Linux-Only**: Designed specifically for Linux systems with ALSA support

## Core Components

### LinuxAudioProvider

The main class that implements the `AudioProvider` interface for Linux systems. It handles audio recording and playback operations using naudiodon3 and system-level audio tools.

**Implements:** `AudioProvider`

**Package Path:** `@tokenring-ai/linux-audio/LinuxAudioProvider.ts`

**Usage:**

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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
- `abortSignal` (`AbortSignal`): Signal to stop recording
- `options` (`RecordingOptions`, optional): Recording configuration with `sampleRate` and `channels`

**Returns:** `Promise<RecordingResult>` containing the path to the recorded WAV file

**Throws:** Errors if audio device is unavailable or file cannot be written

**Example:**

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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

try {
  const recording = await provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
  console.log('Recording saved to:', recording.filePath);
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
  }
}
```

##### `playback(filename: string): Promise<string>`

Plays an audio file through the system audio. Supports WAV files directly and other formats via ffmpeg.

**Parameters:**
- `filename` (`string`): Path to audio file (WAV or other formats)

**Returns:** `Promise<string>` with the filename on success

**Throws:** `Error` if file not found or playback fails

**Example:**

```typescript
// WAV file - direct playback
await provider.playback('/tmp/recording.wav');

// Other formats (MP3, etc.) via ffmpeg
await provider.playback('/tmp/recording.mp3');
```

**Implementation Details:**
- For WAV files: Uses `wav.Reader` to parse the file and naudiodon3 for playback
- For other formats: Uses `ffmpeg` to convert to raw PCM and streams to naudiodon3

**Note:** When playing non-WAV files via ffmpeg, the audio is converted to stereo (2 channels) 48000Hz PCM format regardless of the original file's format. This may result in channel upconversion for mono files.

### RecordingResult Interface

```typescript
interface RecordingResult {
  filePath: string;
}
```

**Properties:**
- `filePath` (`string`): Path to the recorded audio file (e.g., `/tmp/recording-2025-01-15T10-30-00-000Z.wav`)

## Providers

### LinuxAudioProvider

The LinuxAudioProvider implements the AudioProvider interface and can be registered with the AudioService.

**Configuration Schema:** `LinuxAudioProviderOptionsSchema`

**Export Path:** `@tokenring-ai/linux-audio`

#### Configuration Schema

```typescript
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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
- `type` (`'linux'`): Must be `"linux"` for this provider (required)
- `record` (`object`): Recording configuration object
  - `sampleRate` (`number`, default: `48000`): Audio sample rate in Hz
  - `channels` (`number`, default: `1`): Number of audio channels (1=mono, 2=stereo)
  - `format` (`string`, default: `'wav'`): Audio format for recording
- `playback` (`object`, default: `{}`): Playback configuration (currently reserved for future options)

#### Provider Interface

The LinuxAudioProvider implements the `AudioProvider` interface from `@tokenring-ai/audio`:

```typescript
interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}
```

#### Plugin Registration

The provider can be registered with AudioService either through the plugin or manually:

```typescript
import { AudioService } from '@tokenring-ai/audio/AudioService';
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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

// Use the provider
const abortController = new AbortController();
const recording = await audioService.record(abortController.signal);
await audioService.playback(recording.filePath);
```

## RPC Endpoints

This package does not define RPC endpoints. Audio operations are handled through the `AudioService` interface from `@tokenring-ai/audio`.

## Chat Commands

This package does not define chat commands. Chat commands for audio operations are handled by the `@tokenring-ai/audio` package.

## Configuration

### Plugin Configuration

The plugin is configured through the Token Ring AI application configuration. When installed, it automatically registers the LinuxAudioProvider with the AudioService.

**Configuration Schema:**

```typescript
import { z } from 'zod';
import { AudioServiceConfigSchema } from '@tokenring-ai/audio';

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

### Configuration Validation

The configuration is validated using Zod schema:

```typescript
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

// Valid configuration
const validConfig = LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
});

// Invalid configuration will throw
try {
  LinuxAudioProviderOptionsSchema.parse({
    type: 'macos', // Invalid - must be 'linux'
    record: {}
  });
} catch (error) {
  console.error('Invalid configuration:', error);
}
```

## Integration

The Linux Audio Plugin integrates with the Token Ring AI AudioService to provide native audio operations. It registers as a provider for the AudioService, allowing applications to use it for recording and playback.

### Service Integration

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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
audioService.setActiveProvider('linux');

const recording = await audioService.record(abortSignal);
await audioService.playback(recording.filePath);
```

### Plugin Integration

The plugin automatically registers the provider when the application is configured:

**Plugin Implementation:**

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {AudioServiceConfigSchema} from "@tokenring-ai/audio";
import AudioService from "@tokenring-ai/audio/AudioService";
import {z} from "zod";
import LinuxAudioProvider, {LinuxAudioProviderOptionsSchema} from "./LinuxAudioProvider.ts";

const packageConfigSchema = z.object({
  audio: AudioServiceConfigSchema,
});

export default {
  name: '@tokenring-ai/linux-audio',
  version: '0.2.0',
  description: 'Linux audio integration using naudiodon3 for Token Ring',
  install(app, config) {
    if (config.audio) {
      app.waitForService(AudioService, audioService => {
        for (const name in config.audio!.providers) {
          const provider = config.audio!.providers[name];
          if (provider.type === "linux") {
            audioService.registerProvider(
              name, 
              new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider))
            );
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### KeyedRegistry Pattern

The provider uses the KeyedRegistry pattern for provider management within AudioService:

```typescript
// AudioService maintains a registry of providers
audioService.registerProvider('linux', provider);

// Multiple providers can be registered
audioService.registerProvider('linux', linuxProvider);
audioService.registerProvider('macos', macosProvider);

// Set active provider for operations
audioService.setActiveProvider('linux');

// Get provider by name
const provider = audioService.getProvider('linux');
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
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { AudioService } from '@tokenring-ai/audio/AudioService';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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

try {
  const recording = await recordingPromise;
  console.log('Recording saved to:', recording.filePath);
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed or was cancelled:', error.message);
  }
}
```

### Playback with Error Handling

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';
import fs from 'node:fs';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

// Check file exists before playback
const filename = '/path/to/audio.wav';
if (!fs.existsSync(filename)) {
  console.error('Audio file not found:', filename);
  process.exit(1);
}

try {
  await provider.playback(filename);
  console.log('Playback completed');
} catch (error) {
  if (error instanceof Error) {
    console.error('Playback failed:', error.message);
    if (error.message.includes('Audio file not found')) {
      console.error('File does not exist');
    } else if (error.message.includes('Audio device')) {
      console.error('Audio device error - check your audio configuration');
    }
  }
}
```

### Complete Recording and Playback Workflow

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

async function recordAndPlayback(durationMs: number) {
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

  try {
    // Start recording
    const recordingPromise = provider.record(abortController.signal, {
      sampleRate: 48000,
      channels: 1
    });

    // Stop recording after specified duration
    setTimeout(() => {
      abortController.abort();
    }, durationMs);

    // Wait for recording to complete
    const recording = await recordingPromise;
    console.log('Recording completed:', recording.filePath);

    // Play back the recording
    console.log('Starting playback...');
    await provider.playback(recording.filePath);
    console.log('Playback completed');

  } catch (error) {
    if (error instanceof Error) {
      console.error('Audio operation failed:', error.message);
      throw error;
    }
  }
}

// Record for 5 seconds and play back
await recordAndPlayback(5000);
```

## Best Practices

### Recording Best Practices

- **Use AbortSignal**: Always use AbortSignal to properly stop recording and clean up resources
- **Sample Rate Selection**: Use 48000 Hz for high-quality audio, 16000 Hz for voice-only applications
- **Channel Configuration**: Use mono (1 channel) for speech recording to reduce file size
- **File Location**: Recordings are stored in `/tmp/` with timestamp-based filenames (e.g., `recording-2025-01-15T10-30-00-000Z.wav`)
- **File Cleanup**: Implement cleanup logic for production use as `/tmp/` files may be automatically deleted
- **Error Handling**: Always wrap audio operations in try/catch blocks

### Playback Best Practices

- **File Validation**: Check file existence before playback to avoid errors
- **Format Selection**: Use WAV format for best compatibility; use ffmpeg for other formats
- **Error Handling**: Handle both file not found and audio device errors gracefully
- **Resource Management**: Ensure proper cleanup of audio streams
- **FFmpeg Conversion**: When playing non-WAV files, note that ffmpeg converts to stereo 48000Hz PCM format, which may upconvert mono files to stereo

### Performance Optimization

- **Sample Rate**: Higher sample rates improve audio quality but increase file size
- **Channels**: Mono channels (1 channel) reduce file size compared to stereo
- **Recording Duration**: Duration is limited by available disk space in `/tmp/`
- **AbortSignal**: Use AbortSignal to prevent resource leaks and control recording duration
- **16-bit Format**: Audio is recorded in 16-bit PCM format for good quality/size balance

### Production Considerations

- **File Cleanup**: Implement periodic cleanup of `/tmp/` recordings
- **Disk Space**: Monitor available disk space in `/tmp/`
- **Audio Device Availability**: Handle cases where audio devices are not available
- **Permissions**: Ensure the application has permission to access audio devices and write to `/tmp/`

## Error Handling

The provider includes robust error handling for audio operations.

### Recording Errors

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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

try {
  const recording = await provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
  console.log('Recording saved to:', recording.filePath);
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('Audio device not available')) {
      console.error('Please check your audio device configuration');
      console.error('Run: aplay -l and arecord -l to list audio devices');
    } else if (error.message.includes('Permission denied')) {
      console.error('Check permissions for /tmp directory');
    } else if (error.message.includes('Abort')) {
      console.error('Recording was cancelled');
    }
  }
}
```

### Playback Errors

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';
import fs from 'node:fs';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

const filename = '/path/to/audio.wav';

// Pre-validate file exists
if (!fs.existsSync(filename)) {
  throw new Error(`Audio file not found: ${filename}`);
}

try {
  await provider.playback(filename);
  console.log('Playback completed');
} catch (error) {
  if (error instanceof Error) {
    console.error('Playback failed:', error.message);
    
    // Handle file not found
    if (error.message.includes('not found')) {
      console.error('Audio file does not exist');
    }
    
    // Handle audio device errors
    if (error.message.includes('Audio device')) {
      console.error('Check your audio output device');
      console.error('Run: aplay -l to list audio devices');
    }
    
    // Handle ffmpeg errors
    if (error.message.includes('ffmpeg')) {
      console.error('ffmpeg is not installed or failed to convert audio');
      console.error('Install ffmpeg: sudo apt-get install ffmpeg');
    }
  }
}
```

### Cancellation Pattern

Recording can be cancelled using an AbortSignal:

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

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

// Cancel after 3 seconds
setTimeout(() => {
  abortController.abort();
}, 3000);

try {
  const recording = await recordingPromise;
  console.log('Recording completed');
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Abort') || error.name === 'AbortError') {
      console.log('Recording was cancelled');
    } else {
      console.error('Recording failed:', error.message);
    }
  }
}
```

## Monitoring and Debugging

### Error Types

The provider can throw the following errors:

- **General Error**: `Error` with descriptive message for various failure scenarios
- **File Not Found**: `Error` with message `"Audio file not found: <filename>"`
- **Audio Device Errors**: Errors from naudiodon3 when devices are unavailable
- **FFmpeg Errors**: Errors when ffmpeg conversion fails

### Debug Logging

Debug logs can be enabled via the Token Ring AI logging system to monitor audio operations. Add logging to track:

- Recording start and stop events
- File paths created
- Playback start and completion
- Error conditions

### Performance Monitoring

Monitor the following metrics:

- Recording duration
- File sizes created
- Playback success rate
- Error frequencies

## Testing

### Unit Tests

The package includes unit tests using Vitest. Run tests with:

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Build and type check
bun run build
```

**Vitest Configuration:**

The package uses the following vitest configuration:

```typescript
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Integration Testing

To test the Linux audio functionality:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

describe('LinuxAudioProvider', () => {
  let provider: LinuxAudioProvider;
  
  beforeEach(() => {
    provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
      type: 'linux',
      record: {
        sampleRate: 48000,
        channels: 1,
        format: 'wav'
      },
      playback: {}
    }));
  });
  
  it('should create provider with valid options', () => {
    expect(provider).toBeDefined();
    expect(provider.options.type).toBe('linux');
    expect(provider.options.record.sampleRate).toBe(48000);
    expect(provider.options.record.channels).toBe(1);
  });
  
  it('should have default options', () => {
    const providerWithDefaults = new LinuxAudioProvider(
      LinuxAudioProviderOptionsSchema.parse({ type: 'linux' })
    );
    expect(providerWithDefaults.options.record.sampleRate).toBe(48000);
    expect(providerWithDefaults.options.record.channels).toBe(1);
    expect(providerWithDefaults.options.record.format).toBe('wav');
  });
});
```

### Manual Testing

To manually test audio recording and playback:

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

async function testAudio() {
  const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
    type: 'linux',
    record: {
      sampleRate: 48000,
      channels: 1,
      format: 'wav'
    },
    playback: {}
  }));

  console.log('Starting recording for 5 seconds...');
  const abortController = new AbortController();
  
  const recordingPromise = provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
  
  setTimeout(() => {
    abortController.abort();
  }, 5000);
  
  const recording = await recordingPromise;
  console.log('Recording saved to:', recording.filePath);
  
  console.log('Starting playback...');
  await provider.playback(recording.filePath);
  console.log('Playback completed');
}

testAudio().catch(console.error);
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/ai-client`: 0.2.0
- `@tokenring-ai/app`: 0.2.0
- `@tokenring-ai/agent`: 0.2.0
- `@tokenring-ai/audio`: 0.2.0
- `@tokenring-ai/chat`: 0.2.0
- `@tokenring-ai/naudiodon3`: 2.5.0
- `wav`: ^1.0.2
- `@types/wav`: ^1.0.4
- `zod`: ^4.3.6

### Development Dependencies

- `vitest`: ^4.1.0
- `typescript`: ^5.9.3

### Peer Dependencies

- `@tokenring-ai/audio`: Provides the `AudioProvider` interface and `AudioService`

## System Requirements

### Minimum Requirements

- Linux operating system (Ubuntu/Debian recommended)
- ALSA (Advanced Linux Sound Architecture)
- Node.js 18+ or later
- At least 100MB free disk space for audio recordings
- Audio input device (microphone)
- Audio output device (speakers/headphones)

### Installation of System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libasound2-dev build-essential

# Optional: for non-WAV audio playback
sudo apt-get install ffmpeg

# Verify installation
aplay -l  # List playback audio devices
arecord -l  # List recording audio devices

# Test audio devices
arecord -f cd -d 5 test.wav  # Record 5 seconds
aplay test.wav  # Play back
```

### Platform Support

- **Linux**: Fully supported (Ubuntu, Debian, Fedora tested)
- **macOS**: Not supported (use `@tokenring-ai/macos-audio` instead)
- **Windows**: Not supported (use `@tokenring-ai/windows-audio` instead)

## Development

### Building the Package

```bash
# Install dependencies
bun install

# Build type definitions
bun run build

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage
```

### Package Structure

```
pkg/linux-audio/
├── plugin.ts              # Plugin definition and registration
├── LinuxAudioProvider.ts  # Main provider implementation
├── index.ts               # Package exports
├── package.json           # Package metadata and dependencies
├── README.md              # Package documentation
├── vitest.config.ts       # Vitest configuration
└── test/                  # Test files
```

### Export Structure

**package.json exports:**

```json
{
  "exports": {
    ".": "./index.ts",
    "./*": "./*.ts"
  }
}
```

**Available Exports:**

- `@tokenring-ai/linux-audio`: Main package entry point (exports `LinuxAudioProvider`)
- `@tokenring-ai/linux-audio/LinuxAudioProvider.ts`: `LinuxAudioProvider` class and `LinuxAudioProviderOptionsSchema`

### Code Style

- Use TypeScript with strict mode
- Follow ESLint rules from the Token Ring AI project
- Use async/await for asynchronous operations
- Include error handling in all async methods
- Document all public methods with JSDoc comments

## Related Components

- [`@tokenring-ai/audio`](./audio.md): Audio service and provider interfaces
- [`@tokenring-ai/naudiodon3`](https://www.npmjs.com/package/naudiodon3): Native audio I/O for Node.js
- [`@tokenring-ai/agent`](./agent.md): Agent system integration
- [`@tokenring-ai/app`](./app.md): Application framework
- [`wav`](https://github.com/toots/wav): WAV file format support

## License

MIT License - see `LICENSE` file for details.

## Contributing

When contributing to this package:

1. Ensure all tests pass: `bun run test`
2. Run type checking: `bun run build`
3. Update documentation for any API changes
4. Follow the existing code style and patterns
5. Test on Linux systems with ALSA
6. Add tests for new functionality

## Changelog

### v0.2.0

- Initial release with Linux audio support
- Recording functionality using naudiodon3
- Audio playback with WAV format support
- Automatic format conversion via ffmpeg for non-WAV files
- Plugin integration with Token Ring AI ecosystem
- 16-bit PCM audio recording
- AbortSignal support for recording cancellation
