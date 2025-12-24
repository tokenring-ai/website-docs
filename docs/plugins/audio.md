# Audio Plugin

Voice recording, playback, and speech processing framework with AI integration for the Token Ring AI ecosystem.

## Overview

The `@tokenring-ai/audio` package provides a comprehensive audio processing framework for the Token Ring ecosystem. It includes recording from microphone, audio playback, speech-to-text transcription, and text-to-speech synthesis capabilities. The package uses an abstract provider architecture that allows for platform-specific implementations while providing a unified interface for all audio operations.

## Key Features

- **Audio Recording**: Capture audio from system microphone with configurable parameters
- **Voice Transcription**: Convert audio files to text using AI models
- **Text-to-Speech**: Generate speech from text using AI models
- **Audio Playback**: Play audio files through system speakers
- **Provider Architecture**: Abstract interface for platform-specific implementations
- **Multi-Provider Support**: Register and switch between different audio providers
- **Chat Commands**: Interactive voice operations through `/voice` command
- **Tool Integration**: Programmatic access via chat tools
- **Configurable Options**: Customizable sample rates, channels, formats, and models

## Core Components

### AudioProvider (Abstract Class)

Base class that defines the interface for audio operations:

```typescript
export abstract class AudioProvider {
  abstract record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>;
  abstract transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  abstract speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult>;
  abstract playback(filename: string, options?: PlaybackOptions): Promise<string>;
}
```

**Interface Options:**
- `RecordingOptions`: Sample rate, channels, format, timeout
- `TranscriptionOptions`: Model, prompt, language, timestamp granularity  
- `TextToSpeechOptions`: Model, voice, speed, format
- `PlaybackOptions`: Sample rate, channels, timeout

### AudioService

Service class that manages audio operations and provider registry:

```typescript
export class AudioService implements TokenRingService {
  registerProvider(provider: AudioProvider, name: string): void;
  getActiveProvider(): string | undefined;
  setActiveProvider(name: string): void;
  getAvailableProviders(): string[];
  
  record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>;
  transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult>;
  playback(filename: string, options?: PlaybackOptions): Promise<string>;
}
```

### Chat Commands

- `/voice` - Comprehensive voice operations command with subcommands:
  - `record` - Record audio from microphone
  - `transcribe` - Convert audio to text
  - `speak` - Generate speech from text
  - `playback` - Play audio files
  - `provider` - Show or set active audio provider

### Tools

- `voice_record` - Recording tool for agents
- `voice_transcribe` - Transcription tool for agents
- `voice_speak` - Text-to-speech tool for agents
- `voice_playback` - Audio playback tool for agents

## Configuration

### Audio Configuration Schema

```typescript
export const AudioConfigSchema = z.object({
  defaultProvider: z.string(),      // Name of the default audio provider
  providers: z.record(z.string(), z.any()) // Provider-specific configurations
}).optional();
```

### Example Configuration

```typescript
{
  audio: {
    defaultProvider: "linux",  // Set default provider
    providers: {
      linux: {
        // Linux-specific provider configuration
      },
      openai: {
        apiKey: "your-api-key",  // OpenAI provider configuration
        model: "whisper-1"
      }
    }
  }
}
```

## Chat Command Usage

### Basic Voice Operations

```bash
# Record audio from microphone
/voice record

# Transcribe audio file
/voice transcribe recording.wav --language en-US --model whisper-1

# Convert text to speech  
/voice speak "Hello, how are you today?" --voice female --speed 1.2 --format mp3

# Play audio file
/voice playback notification.wav --format wav

# Manage providers
/voice provider                    # Show current and available providers
/voice provider openai             # Set OpenAI as active provider
```

### Command Options

- **--model <name>** - Specify AI model for processing (e.g., whisper, gpt-4)
- **--voice <id>** - Voice ID for text-to-speech
- **--speed <n>** - Speech speed multiplier (1.0 = normal)
- **--format <fmt>** - Audio output format (mp3, wav, ogg, aac)
- **--language <code>** - Language code for transcription (e.g., en-US, es-ES)

## Tool Usage Examples

### Recording Audio

```typescript
import { voice_record } from '@tokenring-ai/audio/tools';

const result = await voice_record.execute(
  {
    sampleRate: 44100,
    channels: 2,
    format: 'wav',
    timeout: 30000
  },
  agent
);

console.log('Recording saved to:', result.filePath);
```

### Transcribing Audio

```typescript
import { voice_transcribe } from '@tokenring-ai/audio/tools';

const transcription = await voice_transcribe.execute(
  {
    audioFile: 'recording.wav',
    model: 'whisper-1',
    language: 'en-US',
    timestampGranularity: 'sentence'
  },
  agent
);

console.log('Transcription:', transcription.text);
```

### Text-to-Speech Generation

```typescript
import { voice_speak } from '@tokenring-ai/audio/tools';

const speech = await voice_speak.execute(
  {
    text: 'This is a test of the text-to-speech system',
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.1,
    format: 'mp3'
  },
  agent
);

console.log('Speech generated:', speech.data);
```

### Audio Playback

```typescript
import { voice_playback } from '@tokenring-ai/audio/tools';

const playbackResult = await voice_playback.execute(
  {
    filename: 'speech.mp3',
    sampleRate: 44100,
    channels: 2
  },
  agent
);

console.log('Playback completed:', playbackResult.filePath);
```

## Service API Usage

### Programmatic Integration

```typescript
import { AudioService } from '@tokenring-ai/audio';
import { Agent } from '@tokenring-ai/agent';

// Create audio service
const audioService = new AudioService();

// Register a provider
audioService.registerProvider('openai', new OpenAIAudioProvider({
  apiKey: process.env.OPENAI_API_KEY
}));

// Set active provider
audioService.setActiveProvider('openai');

// Perform audio operations
try {
  // Record audio
  const recording = await audioService.record(abortSignal, {
    sampleRate: 44100,
    format: 'wav'
  });
  console.log('Recording saved:', recording.filePath);

  // Transcribe audio
  const transcription = await audioService.transcribe(recording.filePath, {
    model: 'whisper-1',
    language: 'en-US'
  });
  console.log('Transcription:', transcription.text);

  // Generate speech
  const speech = await audioService.speak('Hello, world!', {
    model: 'tts-1',
    voice: 'nova',
    format: 'mp3'
  });
  console.log('Speech generated:', speech.data);

  // Playback audio
  await audioService.playback(speech.data, {
    sampleRate: 44100
  });
} catch (error) {
  console.error('Audio operation failed:', error);
}
```

## Provider Architecture

The audio system uses a provider-based architecture that allows different implementations for different platforms and services:

### Provider Interface

Each audio provider must implement the `AudioProvider` interface:

```typescript
export interface AudioProvider {
  record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>;
  transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult>;
  playback(filename: string, options?: PlaybackOptions): Promise<string>;
}
```

### Available Providers

- **LinuxAudioProvider** - Native Linux audio using `naudiodon3`
- **OpenAIAudioProvider** - OpenAI Whisper and TTS integration
- **Custom Providers** - Extend the interface for platform-specific implementations

## Error Handling

The audio service provides comprehensive error handling:

- **Input Validation**: Validates all parameters before execution
- **Service Dependencies**: Graceful handling when required services aren't available
- **Provider Errors**: Proper error handling when providers fail
- **Timeout Management**: Configurable timeouts for long-running operations
- **File Operations**: Error handling for file I/O operations

## Performance Considerations

- **Sample Rate Optimization**: Configurable sample rates for different use cases
- **Async Operations**: All audio operations are properly asynchronous
- **Resource Management**: Proper cleanup of audio resources
- **Provider Caching**: Efficient provider selection and caching
- **Batch Operations**: Support for sequential audio processing

## Dependencies

- `@tokenring-ai/agent`: Agent integration and service management
- `@tokenring-ai/ai-client`: AI model access and transcription
- `@tokenring-ai/app`: Application framework and service registry
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/utility`: Registry management and utilities
- `zod`: Schema validation for configuration and tools

## Development

### Package Structure

- `index.ts` - Package exports and configuration schemas
- `AudioService.ts` - Core audio service implementation
- `AudioProvider.ts` - Abstract provider interface
- `plugin.ts` - Plugin integration logic
- `chatCommands.ts` - Chat command definitions
- `tools.ts` - Tool exports
- `tools/` - Individual tool implementations
- `commands/` - Chat command implementations

### Testing

The package includes Vitest configuration for testing:

```typescript
// vitest.config.ts
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

### Building

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Build the package
bun run build
```

## Integration with Token Ring Ecosystem

### Plugin Integration

The audio package automatically integrates with Token Ring applications:

```typescript
export default {
  name: "@tokenring-ai/audio",
  version: "0.2.0",
  install(app: TokenRingApp) {
    // Register tools with chat service
    app.waitForService(ChatService, chatService => 
      chatService.addTools(packageJSON.name, tools)
    );
    
    // Register chat commands
    app.waitForService(AgentCommandService, agentCommandService => 
      agentCommandService.addAgentCommands(chatCommands)
    );
    
    // Add audio service
    app.addServices(new AudioService());
  },
  start(app: TokenRingApp) {
    // Set active provider from configuration
    const config = app.getConfigSlice('audio', AudioConfigSchema);
    if (config?.defaultProvider) {
      app.requireService(AudioService).setActiveProvider(config.defaultProvider);
    }
  }
} satisfies TokenRingPlugin;
```

### Service Dependencies

The audio service requires:
1. **ChatService**: For tool registration and chat integration
2. **AgentCommandService**: For chat command registration
3. **Agent**: For accessing services and system messages

## Common Use Cases

### Voice Notes and Transcription

```typescript
// Record a voice note
const recording = await voice_record.execute({}, agent);

// Transcribe the recording
const transcription = await voice_transcribe.execute(
  { audioFile: recording.filePath },
  agent
);

// Generate a summary using the transcription
const summary = await agent.chat.executeTool('research', {
  topic: 'Voice Note Summary',
  prompt: `Summarize this voice note: ${transcription.text}`
});
```

### Interactive Voice Commands

```typescript
// Create an interactive voice assistant
agent.chatOutput('Voice assistant ready. Say "help" for commands.');

// Handle voice commands through chat
// Users can record, transcribe, and get responses
```

### Multi-language Support

```typescript
// Record audio in one language
/voice record --language es-ES

// Transcribe to English
/voice transcribe recording.wav --language en-US

// Generate speech in Spanish
/voice speak "Hola, ¿cómo estás?" --language es-ES --voice en-US-Wavenet-A
```

## Best Practices

- **Quality Settings**: Use appropriate sample rates and formats for your use case
- **Error Handling**: Implement proper error handling for audio operations
- **Provider Management**: Register multiple providers for fallback options
- **Configuration**: Use environment variables for sensitive configuration
- **Testing**: Test audio functionality across different environments
- **Performance**: Optimize audio settings for your specific hardware

## License

MIT (see LICENSE file)