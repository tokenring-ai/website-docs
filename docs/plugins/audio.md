# @tokenring-ai/audio

## Overview

The `@tokenring-ai/audio` package provides comprehensive audio processing capabilities for the TokenRing ecosystem, enabling voice recording, transcription, text-to-speech synthesis, and audio playback. It integrates seamlessly with TokenRing's agent and chat systems through a provider-based architecture.

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
- Interactive model selection with availability status indicators

## Installation

```bash
bun install @tokenring-ai/audio
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/ai-client` (0.2.0) - AI client services for transcription and speech
- `@tokenring-ai/app` (0.2.0) - Base application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service for tool registration
- `@tokenring-ai/agent` (0.2.0) - Agent framework for commands and state
- `@tokenring-ai/utility` (0.2.0) - Utility functions including KeyedRegistry
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.1.0) - Testing framework
- `typescript` (^5.9.3) - Type checking

## Core Components

### AudioService

The `AudioService` class is the primary service managing audio operations and provider registry. It handles activation of providers, recording, transcription, speech synthesis, and playback. Implements the `TokenRingService` interface.

**Package Path:** `@tokenring-ai/audio/AudioService`

**Service Properties:**
- `name`: Always `"AudioService"`
- `description`: Always `"Service for Audio Operations"`
- `options`: Configuration options passed during construction
- `providerRegistry`: Internal `KeyedRegistry<AudioProvider>` for provider management

**Service Methods:**

| Method | Description |
|--------|-------------|
| `registerProvider(name: string, provider: AudioProvider)` | Registers an audio provider in the KeyedRegistry (exposed from registry) |
| `getAvailableProviders(): string[]` | Returns list of registered provider names |
| `attach(agent: Agent): void` | Initializes audio state for an agent with default configuration |
| `requireAudioProvider(agent: Agent): AudioProvider` | Gets the active audio provider for an agent (throws if none enabled) |
| `setActiveProvider(name: string, agent: Agent): void` | Sets the active audio provider for an agent |
| `convertAudioToText(audioFile: any, { language?: string }, agent: Agent): Promise<TranscriptionResult>` | Transcribes audio to text using configured STT model |
| `convertTextToSpeech(text: string, { voice?: string, speed?: number }, agent: Agent): Promise<AudioResult>` | Converts text to speech using configured TTS model |

**Constructor:**

```typescript
constructor(options: z.output<typeof AudioServiceConfigSchema>)
```

**Parameters:**
- `options`: Service configuration including tmpDirectory, providers, and agentDefaults

**Example:**

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';
import { AudioServiceConfigSchema } from '@tokenring-ai/audio';

const audioService = new AudioService({
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
});
```

### AudioProvider Interface

Abstract interface for implementing audio providers. Providers must implement both recording and playback functionality.

**Package Path:** `@tokenring-ai/audio/AudioProvider`

```typescript
export interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}
```

**RecordingOptions:**

```typescript
export interface RecordingOptions {
  sampleRate?: number;   // Sample rate for recording
  channels?: number;     // Number of audio channels
  format?: string;       // Audio format (e.g., 'wav', 'mp3')
  timeout?: number;      // Recording timeout in milliseconds
}
```

**RecordingResult:**

```typescript
export interface RecordingResult {
  filePath: string;      // Path to the recorded audio file
}
```

**AudioResult:**

```typescript
export interface AudioResult {
  data: any;             // Audio data (typically Uint8Array or Buffer)
}
```

**Example Implementation:**

```typescript
import { AudioProvider, RecordingOptions, RecordingResult } from '@tokenring-ai/audio/AudioProvider';

class CustomAudioProvider implements AudioProvider {
  async record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult> {
    // Custom recording implementation
    // Use abortSignal to handle cancellation
    return { filePath: '/path/to/recording.wav' };
  }

  async playback(filename: string): Promise<string> {
    // Custom playback implementation
    return filename;
  }
}
```

## Services

### AudioService

The main service that manages audio operations and provider registry.

**Implements:** `TokenRingService`

**Service Registration:**

The service is automatically registered when the plugin is installed (if audio configuration is provided):

```typescript
import audioPlugin from '@tokenring-ai/audio';

app.registerPlugin(audioPlugin.withConfig({
  audio: {
    // configuration
  }
}));
```

**Note:** The plugin only installs services if the `audio` configuration is provided. If `config.audio` is undefined, the plugin exits early without registering anything.

**Service Attachment:**

When an agent is created, the `AudioService.attach()` method:
1. Merges service defaults with agent-specific configuration using `deepMerge`
2. Initializes the `AudioState` for the agent
3. Sets up state persistence and restoration

```typescript
attach(agent: Agent): void {
  const agentConfig = deepMerge(
    this.options.agentDefaults,
    agent.getAgentConfigSlice('audio', AudioAgentConfigSchema)
  );
  agent.initializeState(AudioState, agentConfig);
}
```

## Provider Documentation

The audio package uses a provider-based architecture where different implementations can be registered for specific platforms or use cases.

### Provider Interface

All providers must implement the `AudioProvider` interface:

```typescript
interface AudioProvider {
  record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>;
  playback(filename: string): Promise<string>;
}
```

### KeyedRegistry Pattern

The `AudioService` uses the `KeyedRegistry` pattern for provider management:

```typescript
const audioService = new AudioService(config);

// Register providers
audioService.registerProvider('linux', linuxProvider);
audioService.registerProvider('macos', macosProvider);

// Get available providers
const providers = audioService.getAvailableProviders(); // ['linux', 'macos']

// Set active provider
audioService.setActiveProvider('linux', agent);

// Get active provider (throws if none enabled)
const provider = audioService.requireAudioProvider(agent);
```

### Provider Configuration

Providers are configured through the plugin configuration:

```typescript
import audioPlugin from '@tokenring-ai/audio';

const app = new TokenRingApp({
  plugins: [
    audioPlugin.withConfig({
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
        },
        agentDefaults: {
          provider: 'linux',
          // ... other defaults
        },
      },
    }),
  ],
});
```

## RPC Endpoints

This package does not define RPC endpoints. Audio operations are handled through the `AudioService` interface and agent tools.

## Chat Commands

The package provides the `/audio` command suite for interactive audio operations.

### Command Overview

| Command | Description |
|---------|-------------|
| `/audio record [options]` | Record audio from microphone (Ctrl+C to stop) |
| `/audio play <file>` | Play audio file through speakers |
| `/audio speak <text> [options]` | Convert text to speech and play |
| `/audio transcribe <file> [options]` | Transcribe audio file to text |
| `/audio model tts ...` | Manage TTS (text-to-speech) models |
| `/audio model stt ...` | Manage STT (speech-to-text) models |

### Recording Command

```bash
/audio record [--format <fmt>]
```

Records audio from the microphone. Press Ctrl+C to stop recording.

**Options:**
- `--format <fmt>` - Audio format for recording

**Example:**

```bash
/audio record
/audio record --format wav
```

**Output:** `Recording saved: <filepath>`

### Play Command

```bash
/audio play <file>
```

Plays an audio file through the speakers.

**Arguments:**
- `<file>` - Path to the audio file to play

**Example:**

```bash
/audio play output.mp3
```

**Output:** `Played: <filepath>`

**Errors:** Throws `CommandFailedError` if no filename is provided.

### Speak Command

```bash
/audio speak <text> [--voice <id>] [--speed <n>]
```

Converts text to speech and plays it through the speakers.

**Arguments:**
- `<text>` - Text to convert to speech

**Options:**
- `--voice <id>` - Voice ID to use for speech generation (accepted but currently not used in tool implementation)
- `--speed <n>` - Speech speed (numeric value)

**Example:**

```bash
/audio speak "Hello world"
/audio speak "Welcome" --voice female --speed 1.2
```

**Output:** `Speech generated: <filepath>`

### Transcribe Command

```bash
/audio transcribe <file> [--language <code>]
```

Transcribes an audio file to text.

**Arguments:**
- `<file>` - Path to the audio file to transcribe

**Options:**
- `--language <code>` - Language code for transcription (e.g., `en`, `en-US`)

**Example:**

```bash
/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US
```

**Output:** `Transcription: <text>`

**Errors:** Throws `CommandFailedError` if no filename is provided.

### Model Management Commands

#### TTS Model Management

| Command | Description |
|---------|-------------|
| `/audio model tts get` | Show current TTS model |
| `/audio model tts set <model>` | Set TTS model |
| `/audio model tts select` | Interactive model selection |
| `/audio model tts reset` | Reset to initial configured model |

**Examples:**

```bash
/audio model tts get
/audio model tts set openai/tts-1
/audio model tts select
/audio model tts reset
```

#### STT Model Management

| Command | Description |
|---------|-------------|
| `/audio model stt get` | Show current STT model |
| `/audio model stt set <model>` | Set STT model |
| `/audio model stt select` | Interactive model selection |
| `/audio model stt reset` | Reset to initial configured model |

**Examples:**

```bash
/audio model stt get
/audio model stt set openai/whisper-1
/audio model stt select
/audio model stt reset
```

#### Interactive Model Selection

Both TTS and STT interactive selectors (`/audio model tts select` and `/audio model stt select`) provide:

- Models grouped by provider (OpenAI, Anthropic, etc.)
- Status indicators:
  - ✅ **Online** - Ready for immediate use
  - 🧊 **Cold** - May have startup delay
  - 🔴 **Offline** - Currently unavailable
- Tree-based selection interface
- Provider-level summary showing online/total counts

**Example Output:**

```
Choose a Text to Speech model:
├─ OpenAI (3/5 online)
│  ├─ tts-1 (online)
│  ├─ tts-1-hd (online)
│  ├─ echo (cold)
│  ├─ shimmer (offline)
│  └─ nova (offline)
└─ Anthropic (0/2 online)
   ├─ voice-1 (offline)
   └─ voice-2 (offline)
```

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

### Configuration Schemas

#### Service Configuration

```typescript
const AudioServiceConfigSchema = z.object({
  tmpDirectory: z.string().default('/tmp'),
  providers: z.record(z.string(), z.any()),
  agentDefaults: AudioAgentDefaultsSchema,
});
```

#### Agent Defaults Configuration

```typescript
const AudioAgentDefaultsSchema = z.object({
  provider: z.string(),
  transcribe: AudioTranscriptionConfigSchema.prefault({}),
  speech: AudioSpeechConfigSchema.prefault({}),
});
```

#### Transcription Configuration

```typescript
const AudioTranscriptionConfigSchema = z.object({
  model: z.string().default('whisper-1'),
  prompt: z.string().default('Convert the audio to english'),
  language: z.string().default('en'),
});
```

#### Speech Configuration

```typescript
const AudioSpeechConfigSchema = z.object({
  model: z.string().default('OpenAI:tts-1'),
  voice: z.string().default('alloy'),
  speed: z.number().default(1.0),
});
```

#### Agent Configuration Slice

```typescript
const AudioAgentConfigSchema = z.object({
  provider: z.string().optional(),
  transcribe: AudioTranscriptionConfigSchema.optional(),
  speech: AudioSpeechConfigSchema.optional()
}).prefault({});
```

### Configuration Options

#### Service-Level Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tmpDirectory` | `string` | `/tmp` | Directory for temporary audio files |
| `providers` | `Record<string, any>` | `{}` | Audio provider configurations |
| `agentDefaults` | `AudioAgentDefaultsSchema` | required | Default configuration for agents |

#### Agent Defaults

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | `string` | required | Default audio provider name |
| `transcribe` | `AudioTranscriptionConfigSchema` | `{}` | Default transcription settings (prefaulted) |
| `speech` | `AudioSpeechConfigSchema` | `{}` | Default speech settings (prefaulted) |

#### Transcription Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `string` | `whisper-1` | Transcription model identifier |
| `prompt` | `string` | `Convert the audio to english` | Prompt for transcription |
| `language` | `string` | `en` | Language code for transcription |

#### Speech Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `string` | `OpenAI:tts-1` | Speech generation model |
| `voice` | `string` | `alloy` | Voice identifier |
| `speed` | `number` | `1.0` | Speech speed multiplier |

## Integration

### TokenRing Plugin Integration

```typescript
import audioPlugin from '@tokenring-ai/audio';

app.registerPlugin(audioPlugin);
```

The plugin automatically:
1. Registers the `AudioService` with the application (if audio config is provided)
2. Registers all audio tools with the `ChatService`
3. Registers all agent commands with the `AgentCommandService`

**Note:** The plugin only installs services if the `audio` configuration is provided. If `config.audio` is undefined, the plugin exits early without registering anything.

### Agent Integration

```typescript
// Service automatically available through agent
const audioService = agent.requireServiceByType(AudioService);

// Transcribe audio
const result = await audioService.convertAudioToText(audioFile, {
  language: 'en',
}, agent);
// result = { text: "Transcribed text" }

// Generate speech
const speech = await audioService.convertTextToSpeech('Hello world', {
  voice: 'alloy',
  speed: 1.2,
}, agent);
// speech = { data: Uint8Array [...] }

// Set active provider
audioService.setActiveProvider('linux', agent);

// Get active provider
const provider = audioService.requireAudioProvider(agent);
```

### Provider Integration

```typescript
const audioService = agent.requireServiceByType(AudioService);

// Register a custom provider
audioService.registerProvider('custom', {
  async record(signal, options) {
    // Custom recording implementation
    // signal: AbortSignal for cancellation
    // options: RecordingOptions
    return { filePath: '/path/to/recording.wav' };
  },
  async playback(filename) {
    // Custom playback implementation
    return filename;
  },
});

// Use the provider
audioService.setActiveProvider('custom', agent);
```

### Tool Registration

Tools are automatically registered when the plugin is installed:

```typescript
// Tools available after plugin installation:
// - voice_record
// - voice_transcribe
// - voice_speak
// - audio_playback
```

### Command Registration

Commands are automatically registered when the plugin is installed:

```typescript
// Commands available after plugin installation:
// - /audio record
// - /audio play
// - /audio speak
// - /audio transcribe
// - /audio model tts {get|set|select|reset}
// - /audio model stt {get|set|select|reset}
```

## Usage Examples

### Basic Agent Integration

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';

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
console.log('Speech generated');
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

// Get available providers
const providers = audioService.getAvailableProviders();
console.log('Available providers:', providers);
```

### Tool Usage

```typescript
// Voice record tool
const recording = await agent.callTool('voice_record', {
  format: 'wav',
  timeout: 30000
});
console.log('Recording saved:', recording.data.filePath);

// Voice transcribe tool
const transcription = await agent.callTool('voice_transcribe', {
  audioFile: '/path/to/recording.wav',
  language: 'en'
});
console.log('Transcription:', transcription);

// Voice speak tool
const result = await agent.callTool('voice_speak', {
  text: 'Hello, world!',
  speed: 1.2
});
console.log(result); // "Playback succeeded"

// Audio playback tool
const playback = await agent.callTool('audio_playback', {
  filename: '/path/to/audio.mp3'
});
console.log('Played:', playback.data.filePath);
```

### Chat Command Usage

```bash
# Recording
/audio record --format wav

# Playback
/audio play output.mp3

# Text-to-speech
/audio speak "Hello world"
/audio speak "Welcome" --speed 1.2

# Transcription
/audio transcribe recording.wav
/audio transcribe audio.mp3 --language en-US

# Model management
/audio model tts get
/audio model tts set openai/tts-1
/audio model stt get
/audio model stt set openai/whisper-1
```

## State Management

### AudioState

The `AudioState` class manages audio configuration persistence across agent sessions. Implements `AgentStateSlice` interface.

**Package Path:** `@tokenring-ai/audio/state/audioState`

```typescript
export class AudioState extends AgentStateSlice<typeof serializationSchema> {
  readonly name = "AudioState";
  serializationSchema = serializationSchema;
  
  activeProvider: string | null;
  transcribe: z.output<typeof AudioTranscriptionConfigSchema>;
  speech: z.output<typeof AudioSpeechConfigSchema>;
  initialConfig: z.output<typeof AudioServiceConfigSchema>["agentDefaults"];
  
  constructor(initialConfig: z.output<typeof AudioServiceConfigSchema>["agentDefaults"]);
  transferStateFromParent(parent: Agent): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `activeProvider` | `string \| null` | Currently active audio provider |
| `transcribe` | `AudioTranscriptionConfigSchema` | Current transcription configuration |
| `speech` | `AudioSpeechConfigSchema` | Current speech configuration |
| `initialConfig` | `AudioAgentDefaultsSchema` | Initial configuration (for reset operations) |

#### State Methods

| Method | Description |
|--------|-------------|
| `transferStateFromParent(parent: Agent): void` | Inherit state from parent agent |
| `serialize(): SerializationSchema` | Convert state to JSON for persistence |
| `deserialize(data: SerializationSchema): void` | Restore state from JSON |
| `show(): string[]` | Generate displayable state summary |

#### State Serialization Schema

```typescript
const serializationSchema = z.object({
  activeProvider: z.string().nullable(),
  transcribe: AudioTranscriptionConfigSchema,
  speech: AudioSpeechConfigSchema
});
```

#### State Display Format

The `show()` method returns an array of strings for UI display:

```
Active Provider: <provider_name>
Transcription Model: <model_name>
Transcription Prompt: <prompt>
Transcription Language: <language>
Speech Model: <model_name>
Speech Voice: <voice>
Speech Speed: <speed>
```

## Best Practices

### Provider Selection

- Register providers that match your deployment environment
- Use the `linux` provider for Linux-based deployments (via `@tokenring-ai/linux-audio`)
- Implement custom providers for specialized hardware or services
- Always set a default provider in `agentDefaults.provider`

### Model Management

- Set appropriate default models in configuration
- Use interactive selection for runtime flexibility
- Monitor model availability status when selecting models
- Reset models to defaults when configuration changes

### Error Handling

- Always check if a provider is registered before operations
- Handle `CommandFailedError` for command operations
- Implement timeout for recording operations
- Check for empty text before speech generation

### State Persistence

- Audio state is automatically persisted across sessions
- Use `show()` method to display current state
- Reset models to defaults when needed
- Ensure `activeProvider` is set before audio operations

### Recording Best Practices

- Use AbortSignal to properly stop recording and clean up resources
- Implement timeout to prevent indefinite recordings
- Choose appropriate sample rates (48000 Hz for high quality, 16000 Hz for voice)
- Use mono channels for speech recording to reduce file size

### Playback Best Practices

- Validate file existence before playback
- Handle both file not found and audio device errors gracefully
- Ensure proper cleanup of audio streams
- Use appropriate formats for your platform

## Testing and Development

### Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Type check
bun run build
```

### Package Structure

```
pkg/audio/
├── index.ts                 # Main exports
├── AudioService.ts          # Main audio service implementation
├── AudioProvider.ts         # Audio provider interfaces
├── schema.ts                # Zod configuration schemas
├── plugin.ts                # TokenRing plugin for service registration
├── state/
│   └── audioState.ts        # Audio state management
├── tools.ts                 # Tool registry
├── tools/
│   ├── record.ts            # Voice recording tool
│   ├── transcribe.ts        # Audio transcription tool
│   ├── speak.ts             # Text-to-speech tool
│   └── playback.ts          # Audio playback tool
├── commands.ts              # Command registry
├── commands/
│   └── audio/
│       ├── record.ts        # /audio record command
│       ├── play.ts          # /audio play command
│       ├── speak.ts         # /audio speak command
│       ├── transcribe.ts    # /audio transcribe command
│       └── model/
│           ├── tts/
│           │   ├── get.ts   # TTS model get command
│           │   ├── set.ts   # TTS model set command
│           │   ├── select.ts # TTS model select command
│           │   └── reset.ts # TTS model reset command
│           └── stt/
│               ├── get.ts   # STT model get command
│               ├── set.ts   # STT model set command
│               ├── select.ts # STT model select command
│               └── reset.ts # STT model reset command
├── package.json             # Package manifest
├── vitest.config.ts         # Vitest configuration
└── README.md                # Package documentation
```

### Exports

```typescript
// Main exports from index.ts
export {AudioServiceConfigSchema, AudioAgentConfigSchema} from "./schema.ts";
export {default as AudioService} from "./AudioService.ts";
```

## Error Handling

The package includes robust error handling for audio operations.

### Error Types

- **CommandFailedError**: Thrown when command arguments are invalid or missing
- **Error**: Thrown when no audio provider is enabled
- **Error**: Thrown from underlying AI client operations

### Error Handling Examples

```typescript
import { CommandFailedError } from '@tokenring-ai/agent/AgentError';

// Command error handling
try {
  const result = await agent.executeCommand('audio play', '');
} catch (error) {
  if (error instanceof CommandFailedError) {
    console.error('Command failed:', error.message);
    // Usage: /audio play <filename> [flags]
  }
}

// Provider error handling
try {
  const provider = audioService.requireAudioProvider(agent);
  await provider.playback('audio.wav');
} catch (error) {
  if (error instanceof Error) {
    console.error('No audio provider enabled:', error.message);
  }
}

// Tool error handling
try {
  const result = await agent.callTool('voice_speak', {
    text: '',  // Empty text will cause an error
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Tool execution failed:', error.message);
  }
}
```

### Cancellation Patterns

Recording can be cancelled using an AbortSignal:

```typescript
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

## Related Components

- [`@tokenring-ai/ai-client`](./ai-client.md) - AI client for transcription and speech models
- [`@tokenring-ai/chat`](./chat.md) - Chat service for tool integration
- [`@tokenring-ai/agent`](./agent.md) - Agent framework for command handling
- [`@tokenring-ai/app`](./app.md) - Application framework
- [`@tokenring-ai/linux-audio`](./linux-audio.md) - Linux audio implementation
- [`@tokenring-ai/utility`](./utility.md) - Utility functions including KeyedRegistry

## License

MIT License - see `LICENSE` file for details.
