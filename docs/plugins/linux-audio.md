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
import &#123; LinuxAudioProviderOptionsSchema &#125; from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(&#123;
  type: 'linux',
  record: &#123;
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  &#125;,
  playback: &#123;&#125;
&#125;));
```

## API Reference

### LinuxAudioProvider

#### Constructor

```typescript
new LinuxAudioProvider(options: LinuxAudioProviderOptions)
```

**Parameters:**
- `options` (`LinuxAudioProviderOptions`): Configuration options including type, record settings, and playback settings

#### `record(abortSignal: AbortSignal, options?: RecordingOptions): Promise&lt;RecordingResult&gt;`

Records audio from the system microphone to a WAV file.

**Parameters:**
- `abortSignal`: AbortSignal to stop recording
- `options`: Optional recording configuration (sampleRate, channels)

**Returns:** `Promise&lt;RecordingResult&gt;` containing the path to the recorded WAV file

```typescript
const abortController = new AbortController();
const recording = await provider.record(abortController.signal, &#123;
  sampleRate: 48000,
  channels: 1
&#125;);
console.log('Recording saved to:', recording.filePath);
```

#### `playback(filename: string): Promise&lt;string&gt;`

Plays an audio file through the system audio. Supports WAV files directly and other formats via ffmpeg.

**Parameters:**
- `filename`: Path to audio file (WAV or other formats)

**Returns:** `Promise&lt;string&gt;` with the filename on success

```typescript
// WAV file
await provider.playback('/tmp/recording.wav');

// Other formats (MP3, etc.) via ffmpeg
await provider.playback('/tmp/recording.mp3');
```

### LinuxAudioProviderOptionsSchema

```typescript
const LinuxAudioProviderOptionsSchema = z.object(&#123;
  type: z.literal("linux"),
  record: z.object(&#123;
    sampleRate: z.number().default(48000),
    channels: z.number().default(1),
    format: z.string().default('wav'),
  &#125;).default(&#123;
    sampleRate: 48000,
    channels: 1,
    format: 'wav',
  &#125;),
  playback: z.object(&#123;&#125;).default(&#123;&#125;)
&#125;);
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
const config = &#123;
  audio: &#123;
    providers: &#123;
      linux: &#123;
        type: 'linux',
        record: &#123;
          sampleRate: 48000,
          channels: 1,
          format: 'wav'
        &#125;,
        playback: &#123;&#125;
      &#125;
    &#125;
  &#125;
&#125;;
```

The plugin handles registration automatically:

```typescript
// plugin.ts
import &#123;TokenRingPlugin&#125; from "@tokenring-ai/app";
import &#123;AudioServiceConfigSchema&#125; from "@tokenring-ai/audio";
import AudioService from "@tokenring-ai/audio/AudioService";
import LinuxAudioProvider, &#123;LinuxAudioProviderOptionsSchema&#125; from "./LinuxAudioProvider.ts";

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  install(app, config) &#123;
    if (config.audio) &#123;
      app.waitForService(AudioService, audioService =&gt; &#123;
        for (const name in config.audio!.providers) &#123;
          const provider = config.audio!.providers[name];
          if (provider.type === "linux") &#123;
            audioService.registerProvider(name, new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider)));
          &#125;
        &#125;
      &#125;);
    &#125;
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
```

### Manual Registration

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio/LinuxAudioProvider.ts';
import &#123; AudioService &#125; from '@tokenring-ai/audio';

const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(&#123;
  type: 'linux',
  record: &#123;
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  &#125;,
  playback: &#123;&#125;
&#125;));

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
&#123;
  "audio": &#123;
    "providers": &#123;
      "linux": &#123;
        "type": "linux",
        "record": &#123;
          "sampleRate": 48000,
          "channels": 1,
          "format": "wav"
        &#125;,
        "playback": &#123;&#125;
      &#125;
    &#125;
  &#125;
&#125;
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
const provider = new LinuxAudioProvider(&#123;
  type: 'linux',
  record: &#123; sampleRate: 48000, channels: 1, format: 'wav' &#125;,
  playback: &#123;&#125;
&#125;);

audioService.registerProvider('linux', provider);
const recording = await audioService.record(abortSignal);
await audioService.playback(recording.filePath);
```

## Monitoring and Debugging

### Error Handling

The provider includes robust error handling for audio operations:

```typescript
// Recording error handling
try &#123;
  const recording = await provider.record(abortController.signal, &#123;
    sampleRate: 48000,
    channels: 1
  &#125;);
&#125; catch (error) &#123;
  if (error instanceof Error) &#123;
    console.error('Recording failed:', error.message);
    // Handle specific errors
    if (error.message.includes('Audio device not available')) &#123;
      // Handle device issues
    &#125;
  &#125;
&#125;

// Playback error handling
try &#123;
  await provider.playback('/path/to/audio.wav');
&#125; catch (error) &#123;
  if (error instanceof Error) &#123;
    console.error('Playback failed:', error.message);
    // Handle file not found or audio device errors
  &#125;
&#125;
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
