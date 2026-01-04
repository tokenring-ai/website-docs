# Audio Plugin

## Overview

The `@tokenring-ai/audio` plugin provides comprehensive audio processing capabilities for the TokenRing ecosystem, enabling voice recording, transcription, text-to-speech synthesis, and audio playback. It integrates seamlessly with TokenRing's agent and chat systems through a provider-based architecture.

**Key Features:**
- Voice recording with configurable parameters (sample rate, channels, format, timeout)
- AI-powered audio transcription using speech-to-text (STT) models
- Text-to-speech (TTS) synthesis with customizable voices and speed
- Audio playback support across multiple providers
- Multi-provider architecture for flexible implementation
- Chat command integration (`/audio`) for agent interactions
- Full TypeScript type safety with Zod validation
- Seamless integration with TokenRing service architecture
- Plugin system for automatic service registration
- State management for persisting audio settings across agent sessions

## Installation

```bash
bun install @tokenring-ai/audio
```

## Core Components

### AudioService

The `AudioService` class is the primary service managing audio operations and provider registry. It handles activation of providers, recording, transcription, speech synthesis, and playback.

**Service Properties:**
- `name`: Always `"AudioService"`
- `description`: Always `"Service for Audio Operations"`
- `options`: Configuration options passed during construction

**Service Methods:**
- `registerProvider(name, provider)`: Registers an audio provider
- `getAvailableProviders()`: Returns list of registered provider names
- `requireAudioProvider(agent)`: Retrieves the active provider for an agent
- `setActiveProvider(name, agent)`: Sets the active provider for an agent
- `convertAudioToText(audioFile, { language }, agent)`: Transcribes audio to text
- `convertTextToSpeech(text, { voice, speed }, agent)`: Converts text to speech

### AudioProvider

Abstract interface for implementing audio providers. Providers must implement:

```typescript
interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}
```

**RecordingOptions:**
- `sampleRate?`: number - Sample rate for recording
- `channels?`: number - Number of audio channels
- `format?`: string - Audio format (e.g., "wav", "mp3")
- `timeout?`: number - Recording timeout in milliseconds

**RecordingResult:**
- `filePath`: string - Path to the recorded audio file

**AudioResult:**
- `data`: any - Audio data (typically a Buffer)

## Chat Commands

The plugin provides `/audio` commands for audio operations:

### Command Overview

| Command | Description |
|---------|-------------|
| `/audio record [flags]` | Record audio from microphone |
| `/audio play <file>` | Play audio file through speakers |
| `/audio speak <text> [flags]` | Convert text to speech |
| `/audio transcribe <file> [flags]` | Transcribe audio file to text |
| `/audio model tts ...` | Manage TTS (text-to-speech) models |
| `/audio model stt ...` | Manage STT (speech-to-text) models |

### Record Command

```bash
# Record audio from microphone
/audio record
/audio record --format wav
```

**Options:**
- `--format <fmt>` - Audio format (e.g., wav, mp3)

### Play Command

```bash
# Play audio file
/audio play output.mp3
/audio play recording.wav
```

### Speak Command

```bash
# Convert text to speech
/audio speak "Hello world"
/audio speak "Welcome" --voice alloy --speed 1.2
```

**Options:**
- `--voice <id>` - Voice ID (e.g., alloy, echo, fable)
- `--speed <n>` - Speech speed (e.g., 0.5, 1.0, 2.0)

### Transcribe Command

```bash
# Transcribe audio file
/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US
```

**Options:**
- `--language <code>` - Language code (e.g., en, en-US, zh)

### Model Management

```bash
# TTS model management
/audio model tts                    # Show current TTS model and open selector
/audio model tts get                # Show current TTS model
/audio model tts set openai/tts-1   # Set TTS model
/audio model tts select             # Interactive model selection
/audio model tts reset              # Reset to initial configured model

# STT model management
/audio model stt                    # Show current STT model and open selector
/audio model stt get                # Show current STT model
/audio model stt set openai/whisper-1  # Set STT model
/audio model stt select             # Interactive model selection
/audio model stt reset              # Reset to initial configured model
```

## Tools for Agent Integration

The plugin registers the following tools for agent use:

### voice_record

Record audio using the active voice provider.

```typescript
{
  name: "voice_record",
  description: "Record audio using the active voice provider",
  inputSchema: z.object({
    sampleRate: z.number().optional().describe("Sample rate for recording"),
    channels: z.number().optional().describe("Number of audio channels"),
    format: z.string().optional().describe("Audio format"),
    timeout: z.number().optional().describe("Recording timeout in milliseconds"),
  })
}
```

**Returns:** `{ filePath: string }`

### voice_transcribe

Transcribe audio file to text.

```typescript
{
  name: "voice_transcribe",
  description: "Transcribe audio using the active voice provider",
  inputSchema: z.object({
    audioFile: z.any().describe("Audio file to transcribe"),
    language: z.string().describe("Language to transcribe the audio to"),
  })
}
```

**Returns:** `{ text: string }`

### voice_speak

Convert text to speech.

```typescript
{
  name: "voice_speak",
  description: "Convert text to speech using the active voice provider",
  inputSchema: z.object({
    text: z.string().min(1).describe("Text to convert to speech"),
    speed: z.number().optional().describe("Speech speed"),
  })
}
```

**Returns:** `string` - Confirmation message

### voice_playback

Play audio file.

```typescript
{
  name: "voice_playback",
  description: "Play audio file using the active voice provider",
  inputSchema: z.object({
    filename: z.string().min(1).describe("Audio filename to play"),
  })
}
```

**Returns:** `{ filePath: string }`

## Configuration

### Plugin Configuration

```typescript
import audioPlugin from '@tokenring-ai/audio';

const app = new TokenRingApp({
  plugins: [
    audioPlugin.withConfig({
      audio: {
        tmpDirectory: '/tmp',
        providers: {
          linux: { /* provider config */ }
        },
        agentDefaults: {
          provider: 'linux',
          transcribe: {
            model: 'whisper-1',
            prompt: 'Convert the audio to english',
            language: 'en',
          },
          speech: {
            model: 'OpenAI:tts-1',
            voice: 'alloy',
            speed: 1.0,
          },
        },
      },
    }),
  ],
});
```

### Configuration Schema

```typescript
const AudioServiceConfigSchema = z.object({
  tmpDirectory: z.string().default('/tmp'),
  providers: z.record(z.string(), z.any()),
  agentDefaults: AudioAgentDefaultsSchema,
});

const AudioAgentConfigSchema = z.object({
  provider: z.string().optional(),
  transcribe: AudioTranscriptionConfigSchema.optional(),
  speech: AudioSpeechConfigSchema.optional(),
});

const AudioTranscriptionConfigSchema = z.object({
  model: z.string().default('whisper-1'),
  prompt: z.string().default('Convert the audio to english'),
  language: z.string().default('en'),
});

const AudioSpeechConfigSchema = z.object({
  model: z.string().default('OpenAI:tts-1'),
  voice: z.string().default('alloy'),
  speed: z.number().default(1.0),
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tmpDirectory` | string | `/tmp` | Directory for temporary audio files |
| `providers` | record | `{}` | Map of provider names to provider configs |
| `agentDefaults.provider` | string | - | Default audio provider |
| `agentDefaults.transcribe.model` | string | `whisper-1` | Default STT model |
| `agentDefaults.transcribe.prompt` | string | `Convert the audio to english` | Transcription prompt |
| `agentDefaults.transcribe.language` | string | `en` | Default transcription language |
| `agentDefaults.speech.model` | string | `OpenAI:tts-1` | Default TTS model |
| `agentDefaults.speech.voice` | string | `alloy` | Default TTS voice |
| `agentDefaults.speech.speed` | number | `1.0` | Default speech speed |

## Usage Examples

### Basic Agent Integration

```typescript
import AudioService from '@tokenring-ai/audio/AudioService.ts';

// Access the audio service
const audioService = agent.requireServiceByType(AudioService);

// Transcribe audio
const result = await audioService.convertAudioToText(audioFile, {
  language: 'en',
}, agent);
console.log('Transcription:', result.text);

// Generate speech
const speech = await audioService.convertTextToSpeech('Hello world', {
  voice: 'alloy',
  speed: 1.2,
}, agent);
```

### Provider Management

```typescript
const audioService = agent.requireServiceByType(AudioService);

// Register a custom provider
audioService.registerProvider('custom', {
  async record(signal, options) {
    // Custom recording implementation
    return { filePath: '/path/to/recording.wav' };
  },
  async playback(filename) {
    // Custom playback implementation
    return filename;
  },
});

// Set the active provider
audioService.setActiveProvider('custom', agent);
```

### Chat Command Examples

```bash
# Recording
/audio record --format wav

# Playback
/audio play output.mp3

# Text-to-speech
/audio speak "Hello world"
/audio speak "Welcome" --voice alloy --speed 1.2

# Transcription
/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US

# Model management
/audio model tts get
/audio model tts set openai/tts-1
/audio model stt get
/audio model stt set openai/whisper-1
```

## Integration

### Plugin Registration

The plugin is registered via TokenRing's plugin system:

```typescript
import audioPlugin from '@tokenring-ai/audio';

app.registerPlugin(audioPlugin);
```

### Service Dependencies

- **Requires**: `ChatService` for tool integration
- **Requires**: `AgentCommandService` for chat commands
- **Provides**: `AudioService` for audio operations
- **Uses**: `TokenRingApp` configuration system

### State Management

The `AudioState` class manages audio configuration persistence across agent sessions:

```typescript
class AudioState implements AgentStateSlice {
  name = "AudioState";
  activeProvider: string | null;
  transcribe: TranscriptionConfig;
  speech: SpeechConfig;
}
```

**State Properties:**
- `activeProvider`: Currently active audio provider
- `transcribe`: Transcription configuration (model, prompt, language)
- `speech`: Speech configuration (model, voice, speed)

**State Methods:**
- `transferStateFromParent(parent)`: Inherit state from parent agent
- `serialize()`: Convert state to JSON
- `deserialize(data)`: Restore state from JSON
- `show()`: Generate displayable state summary

## API Reference

### AudioService Methods

#### convertAudioToText

```typescript
async convertAudioToText(
  audioFile: any,
  { language }: { language?: string },
  agent: Agent
): Promise<TranscriptionResult>
```

Transcribes audio to text using the configured STT model.

**Parameters:**
- `audioFile`: Audio file path (string) or buffer
- `language`: Optional language override
- `agent`: The agent context

**Returns:** `{ text: string }`

#### convertTextToSpeech

```typescript
async convertTextToSpeech(
  text: string,
  { voice, speed }: { voice?: string, speed?: number },
  agent: Agent
): Promise<AudioResult>
```

Converts text to speech using the configured TTS model.

**Parameters:**
- `text`: Input text to convert
- `voice`: Optional voice override
- `speed`: Optional speed override
- `agent`: The agent context

**Returns:** `{ data: Buffer }`

#### setActiveProvider

```typescript
setActiveProvider(name: string, agent: Agent): void
```

Sets the active audio provider for the agent.

#### getAvailableProviders

```typescript
getAvailableProviders(): string[]
```

Returns the list of registered provider names.

### Interface Definitions

```typescript
interface RecordingOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
  timeout?: number;
}

interface RecordingResult {
  filePath: string;
}

interface AudioResult {
  data: any;
}

interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}
```

## Development

### Testing

```bash
# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Package Structure

```
pkg/audio/
├── index.ts                       # Main exports and configuration schema
├── AudioService.ts                # Main audio service implementation
├── AudioProvider.ts               # Audio provider interfaces
├── schema.ts                      # Zod configuration schemas
├── plugin.ts                      # TokenRing plugin for service registration
├── state/
│   └── audioState.ts              # Audio state management
├── tools.ts                       # Tool registry
├── tools/
│   ├── record.ts                  # Voice recording tool
│   ├── transcribe.ts              # Audio transcription tool
│   ├── speak.ts                   # Text-to-speech tool
│   └── playback.ts                # Audio playback tool
├── chatCommands.ts                # Chat command registry
├── commands/
│   └── audio/
│       ├── audio.ts               # /audio command implementation
│       ├── record.ts              # /audio record command
│       ├── play.ts                # /audio play command
│       ├── speak.ts               # /audio speak command
│       ├── transcribe.ts          # /audio transcribe command
│       └── model.ts               # /audio model command
│           └── model/
│               ├── tts.ts         # TTS model management
│               └── stt.ts         # STT model management
│                   └── tts/       # TTS: default, get, set, reset, select
│                   └── stt/       # STT: default, get, set, reset, select
├── package.json                   # Package manifest
├── vitest.config.ts               # Vitest configuration
└── README.md                      # Package documentation
```

## Related Components

- `@tokenring-ai/ai-client` - AI client for transcription and speech models
- `@tokenring-ai/chat` - Chat service for tool integration
- `@tokenring-ai/agent` - Agent framework for command handling

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
