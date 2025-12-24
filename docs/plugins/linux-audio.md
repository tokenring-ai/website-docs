# Linux Audio Plugin

Linux audio integration using naudiodon3 for Token Ring, providing recording, transcription, text-to-speech, and playback capabilities.

## Overview

The `@tokenring-ai/linux-audio` package provides Linux-specific audio processing capabilities for the Token Ring ecosystem. It implements the `AudioProvider` interface with native Linux audio handling using `naudiodon3` for recording and playback, and integrates with AI clients for transcription and text-to-speech functionality.

### Key Features

- **Native Linux Audio**: Uses `naudiodon3` for high-quality audio recording and playback
- **Audio Recording**: Record audio from system microphone with configurable parameters
- **Voice Transcription**: Transcribe audio files using AI models (Whisper, etc.)
- **Text-to-Speech**: Convert text to speech using AI models (TTS engines)
- **Audio Playback**: Play audio files through system speakers
- **Configurable Options**: Customizable sample rates, channels, and formats
- **Service Integration**: Seamless integration with Token Ring audio service
- **Agent Integration**: Requires agent context for AI model access

## Core Components

### LinuxAudioProvider

The main class implementing the `AudioProvider` interface for Linux audio operations.

```typescript
export default class LinuxAudioProvider extends AudioProvider {
  constructor(options?: LinuxAudioProviderOptions)
  async record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>
  async transcribe(audioFile: any, options?: TranscriptionOptions, agent?: Agent): Promise<TranscriptionResult>
  async speak(text: string, options?: TextToSpeechOptions, agent?: Agent): Promise<AudioResult>
  async playback(filename: string, options?: PlaybackOptions): Promise<string>
}
```

### Configuration Schema

```typescript
export const LinuxAudioProviderOptionsSchema = z.object({
  type: z.literal("linux"),
  sampleRate: z.number().optional(),  // Default: 48000
  channels: z.number().optional(),    // Default: 1 (mono)
  format: z.string().optional()       // Default: 'wav'
});

export interface LinuxAudioProviderOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
}
```

## Plugin Integration

The plugin integrates with the Token Ring audio service, registering itself as a provider when the `audio` configuration specifies `linux` type providers.

```typescript
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const audioConfig = app.getConfigSlice('audio', AudioConfigSchema);
    if (audioConfig) {
      app.waitForService(AudioService, audioService => {
        for (const name in audioConfig.providers) {
          const provider = audioConfig.providers[name];
          if (provider.type === "linux") {
            audioService.registerProvider(name, new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  }
}
```

### Required Configuration

```typescript
// Example Token Ring configuration
{
  audio: {
    providers: {
      "linux-recorder": {
        type: "linux",
        sampleRate: 48000,
        channels: 1,
        format: "wav"
      }
    }
  }
}
```

## Audio Operations

### Recording Audio

Record audio from the system microphone to a temporary file.

```typescript
const recording = await audioService.record({ 
  sampleRate: 48000, 
  channels: 1, 
  format: 'wav' 
});

console.log('Recording saved to:', recording.filePath);
```

#### Recording Options

- `sampleRate`: Audio sampling rate in Hz (default: 48000)
- `channels`: Number of audio channels (1 for mono, 2 for stereo)
- `format`: Audio file format (default: 'wav')
- `abortSignal`: Cancel the recording operation

### Transcribing Audio

Transcribe audio files using AI models through the agent's transcription service.

```typescript
const transcription = await audioService.transcribe(
  recording.filePath,
  { 
    model: 'whisper-1', 
    language: 'en',
    prompt: 'Technical documentation about AI systems'
  },
  agent
);

console.log('Transcribed text:', transcription.text);
```

#### Transcription Options

- `model`: AI model name (default: 'whisper-1')
- `language`: Target language for transcription
- `prompt`: Optional prompt for the transcription model

### Text-to-Speech

Generate speech from text using AI models.

```typescript
const audioResult = await audioService.speak(
  'Hello, welcome to Token Ring AI!',
  { 
    model: 'tts-1', 
    voice: 'alloy',
    speed: 1.0
  },
  agent
);

// The audio data can be played or saved
await audioService.playback('path/to/output.mp3');
```

#### Text-to-Speech Options

- `model`: TTS model name (default: 'tts-1')
- `voice`: Voice selection (default: 'alloy')
- `speed`: Speech speed (default: 1.0)

### Audio Playback

Play audio files through the system speakers.

```typescript
await audioService.playback('path/to/audio.wav');
```

## Usage Examples

### Basic Recording and Transcription Workflow

```typescript
import { Agent } from '@tokenring-ai/agent';
import { AudioService } from '@tokenring-ai/audio';

const agent = new Agent();
const audioService = new AudioService();
agent.registerService(audioService);

// Register Linux audio provider
const linuxProvider = new LinuxAudioProvider({ sampleRate: 48000 });
audioService.registerProvider('linux', linuxProvider);
audioService.setActiveProvider('linux');

// Record audio
const recording = await audioService.record({ 
  duration: 5000, // Record for 5 seconds
  sampleRate: 48000 
});

// Transcribe the recording
const transcription = await audioService.transcribe(
  recording.filePath,
  { model: 'whisper-1' },
  agent
);

console.log('Transcribed:', transcription.text);
```

### Text-to-Speech and Playback

```typescript
// Generate speech from text
const audioResult = await audioService.speak(
  'The Linux audio plugin provides high-quality audio processing.',
  { 
    voice: 'echo',
    speed: 1.2
  },
  agent
);

// Save the generated audio
fs.writeFileSync('output.mp3', audioResult.data);

// Play the audio
await audioService.playback('output.mp3');
```

### Configuration with Multiple Providers

```typescript
// Token Ring configuration
{
  audio: {
    providers: {
      "high-quality": {
        type: "linux",
        sampleRate: 96000,
        channels: 2,
        format: "wav"
      },
      "quick": {
        type: "linux",
        sampleRate: 16000,
        channels: 1,
        format: "wav"
      }
    }
  }
}
```

## Dependencies

- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/audio`: Audio service and provider interface
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/ai-client`: AI client and model registry
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/naudiodon3@2.5.0`: Linux audio input/output
- `wav@1.0.2`: WAV audio file handling
- `zod`: Schema validation

## Development

### Package Structure

- `plugin.ts`: Plugin integration logic
- `LinuxAudioProvider.ts`: Core audio provider implementation
- `package.json`: Package configuration
- `README.md`: Package documentation

### Testing

The package uses Vitest for testing:

```bash
bun run test
bun run test:coverage
```

### Build

```bash
bun run build
```

## Error Handling

The plugin handles various error scenarios:

- **Recording Errors**: Audio device access issues, file system errors
- **Transcription Errors**: Model access issues, invalid audio formats
- **TTS Errors**: Model access issues, text processing errors
- **Playback Errors**: Audio device issues, file not found errors

## Performance Considerations

- **Sample Rate**: Higher sample rates provide better audio quality but larger file sizes
- **Channels**: Stereo (2 channels) provides better audio but doubles data size
- **Format**: WAV provides lossless quality but larger file sizes
- **AI Model Selection**: Different models have varying performance and quality trade-offs

## License

MIT (see LICENSE file)