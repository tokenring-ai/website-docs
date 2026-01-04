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

## API Reference

### LinuxAudioProvider

#### Constructor

```typescript
new LinuxAudioProvider(options: LinuxAudioProviderOptions)
```

**Parameters:**
- `options` (`LinuxAudioProviderOptions`): Configuration options including type, record settings, and playback settings

#### `record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>`

Records audio from the system microphone to a WAV file.

**Parameters:**
- `abortSignal`: AbortSignal to stop recording
- `options`: Optional recording configuration (sampleRate, channels)

**Returns:** `Promise<RecordingResult>` containing the path to the recorded WAV file

```typescript
const abortController = new AbortController();
const recording = await provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});
console.log('Recording saved to:', recording.filePath);
```

#### `playback(filename: string): Promise<string>`

Plays an audio file through the system audio. Supports WAV files directly and other formats via ffmpeg.

**Parameters:**
- `filename`: Path to audio file (WAV or other formats)

**Returns:** `Promise<string>` with the filename on success

```typescript
// WAV file
await provider.playback('/tmp/recording.wav');

// Other formats (MP3, etc.) via ffmpeg
await provider.playback('/tmp/recording.mp3');
```

### LinuxAudioProviderOptionsSchema

```typescript
const LinuxAudioProviderOptionsSchema = z.object({
  type: z.literal("linux"),
  record: z.object({
    sampleRate: z.number().default(48000),
    channels: z.number().default(1),
    format: z.string().default('wav'),
  }).default({
    sampleRate: 48000,
    channels: 1,
    format: 'wav',
  }),
  playback: z.object({}).default({})
});
```

**Configuration Options:**
- `type`: Must be `"linux"` for this provider
- `record.sampleRate`: Audio sample rate in Hz (default: 48000)
- `record.channels`: Number of audio channels (default: 1, mono)
- `record.format`: Audio format for recording (default: 'wav')
- `playback`: Empty object for future playback configuration options

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

The plugin handles registration automatically:

```typescript
// plugin.ts
import {TokenRingPlugin} from "@tokenring-ai/app";
import {AudioServiceConfigSchema} from "@tokenring-ai/audio";
import AudioService from "@tokenring-ai/audio/AudioService";
import LinuxAudioProvider, {LinuxAudioProviderOptionsSchema} from "./LinuxAudioProvider.ts";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
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

### Manual Registration

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import { AudioService } from '@tokenring-ai/audio';

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

## Configuration

### Application Configuration

Configure the provider via the Token Ring AI application configuration:

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

**Record Options:**
- `sampleRate`: Audio sample rate in Hz (default: 48000)
- `channels`: Number of audio channels (default: 1, mono)
- `format`: Audio format (default: 'wav')

## Integration

The Linux Audio Plugin integrates with the Token Ring AI AudioService to provide native audio operations. It registers as a provider for the AudioService, allowing applications to use it for recording and playback.

### Service Integration

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const audioService = new AudioService();
const provider = new LinuxAudioProvider({
  type: 'linux',
  record: { sampleRate: 48000, channels: 1, format: 'wav' },
  playback: {}
});

audioService.registerProvider('linux', provider);
const recording = await audioService.record(abortSignal);
await audioService.playback(recording.filePath);
```

## Monitoring and Debugging

### Error Handling

The provider includes robust error handling for audio operations:

```typescript
// Recording error handling
try {
  const recording = await provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
    // Handle specific errors
    if (error.message.includes('Audio device not available')) {
      // Handle device issues
    }
  }
}

// Playback error handling
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

## Development

### Testing

The package includes unit tests using Vitest. Run tests with:

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Build and Installation

- Install dependencies: `bun install`
- Build type definitions: `tsc --noEmit`
- Test with coverage: `bun test --coverage`

### System Requirements

- Linux OS (Ubuntu/Debian tested)
- ALSA (Advanced Linux Sound Architecture)
- Node.js 18+
- System libraries: `libasound2-dev`
- Optional: `ffmpeg` for non-WAV audio playback

### Installation of System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install libasound2-dev build-essential

# Optional: for non-WAV audio playback
sudo apt-get install ffmpeg
```

## Related Components

- `@tokenring-ai/audio`: Audio service and interfaces
- `@tokenring-ai/naudiodon3`: Native audio I/O for Node.js
- `wav`: WAV file format support

## License

MIT License - see LICENSE file for details.
