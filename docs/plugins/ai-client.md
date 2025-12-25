# AI Client Plugin

Multi-provider AI integration with model registries for chat, embeddings, image generation, speech, and transcription.

## Overview

The `@tokenring-ai/ai-client` package provides comprehensive AI client integration for the Token Ring ecosystem. It offers a unified interface to multiple AI providers including OpenAI, Anthropic, Google, Groq, and others through the Vercel AI SDK. The package registers different model registries for various AI capabilities and manages provider configurations.

## Key Features

- **Multi-Provider Support**: Integrates with 12+ AI providers through the Vercel AI SDK
- **Model Registries**: Separate registries for chat, embeddings, image generation, speech, and transcription
- **Cost Tracking**: Automatic cost calculation and tracking for AI usage
- **Feature Flags**: Runtime feature configuration per model
- **Provider Registration**: Dynamic provider registration through configuration
- **Type-Safe Models**: Strong TypeScript types for all AI operations
- **Streaming Support**: Full streaming capabilities for chat completions
- **Context Compaction**: Automatic conversation summarization to manage token usage
- **Reranking**: Document ranking and relevance scoring
- **Multiple Modalities**: Support for chat, embeddings, images, speech, and transcription

## Core Components

### Model Registries

The package registers five primary model registries that extend the base `ModelTypeRegistry`:

#### ChatModelRegistry
- Manages chat models with comprehensive features
- Supports streaming and non-streaming chat completion
- Includes tool calling capabilities
- Cost tracking and usage metrics
- Reranking functionality
- Context compaction for long conversations

#### EmbeddingModelRegistry  
- Handles text embedding generation
- Batch processing for multiple inputs
- Provider-specific request mangling
- Feature flag support

#### ImageGenerationModelRegistry
- Image generation with provider-specific options
- Quality and size configuration
- Cost calculation per generation
- Uint8Array output format

#### SpeechModelRegistry
- Text-to-speech conversion
- Voice and speed configuration
- Audio output in Uint8Array format
- Provider-specific options

#### TranscriptionModelRegistry
- Audio transcription with language support
- Prompt-based transcription
- URL and DataContent input support
- Text output format

### Client Implementations

#### AIChatClient
Primary chat client with the following capabilities:

**Key Methods:**
- `streamChat(request, agent)`: Streams chat completion responses
- `textChat(request, agent)`: Returns full text chat completion
- `generateObject(request, agent)`: Generates structured objects with Zod schema
- `rerank(request, agent)`: Reranks documents based on relevance
- `calculateCost(usage)`: Calculates AI usage costs
- `calculateTiming(elapsedMs, usage)`: Computes timing metrics
- `setFeatures(features)`: Configures runtime feature flags

**Request Types:**
- `ChatRequest`: Standard chat completion request with messages, tools, and parameters
- `GenerateRequest<T extends ZodObject>`: Structured object generation request
- `RerankRequest`: Document reranking request

#### AIEmbeddingClient
Handles text embedding generation:

**Key Methods:**
- `getEmbeddings({ input })`: Generates embeddings for array of strings
- `setFeatures(features)`: Configures feature flags
- `getFeatures()`: Retrieves current feature configuration
- `getModelId()`: Returns model identifier

#### AIImageGenerationClient
Manages image generation:

**Key Methods:**
- `generateImage(request, agent)`: Generates images from prompts
- `setFeatures(features)`: Configures feature flags
- `getFeatures()`: Retrieves feature configuration
- `getModelId()`: Returns model identifier

#### AISpeechClient
Handles text-to-speech conversion:

**Key Methods:**
- `generateSpeech(request, agent)`: Converts text to speech
- `setFeatures(features)`: Configures feature flags
- `getFeatures()`: Retrieves feature configuration
- `getModelId()`: Returns model identifier

#### AITranscriptionClient
Manages audio transcription:

**Key Methods:**
- `transcribe(request, agent)`: Transcribes audio to text
- `setFeatures(features)`: Configures feature flags
- `getFeatures()`: Retrieves feature configuration
- `getModelId()`: Returns model identifier

## Usage Examples

### Basic Chat Completion

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ChatModelRegistry } from '@tokenring-ai/ai-client';

const agent = new Agent();
const chatRegistry = new ChatModelRegistry();
agent.registerService(chatRegistry);

// Get chat client for a specific model
const chatClient = await chatRegistry.getFirstOnlineClient('openai/gpt-4');

// Stream chat completion
const [text, response] = await chatClient.streamChat({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ],
  tools: {}, // Optional tool definitions
}, agent);

console.log('Chat response:', text);
console.log('Cost:', response.cost.total);
```

### Image Generation

```typescript
import { ImageGenerationModelRegistry } from '@tokenring-ai/ai-client';

const imageRegistry = new ImageGenerationModelRegistry();
agent.registerService(imageRegistry);
const imageClient = await imageRegistry.getFirstOnlineClient('dall-e-3');

const [image, result] = await imageClient.generateImage({
  prompt: 'A beautiful sunset over mountains',
  size: '1024x1024',
  quality: 'standard',
  n: 1
}, agent);

// Image is available as a GeneratedFile object
console.log('Generated image:', image);
```

### Text Embedding

```typescript
import { EmbeddingModelRegistry } from '@tokenring-ai/ai-client';

const embeddingRegistry = new EmbeddingModelRegistry();
agent.registerService(embeddingRegistry);
const embeddingClient = await embeddingRegistry.getFirstOnlineClient('text-embedding-3-large');

const embeddings = await embeddingClient.getEmbeddings({
  input: ['Token Ring AI is a framework for building AI applications']
});
```

### Speech Generation

```typescript
import { SpeechModelRegistry } from '@tokenring-ai/ai-client';

const speechRegistry = new SpeechModelRegistry();
agent.registerService(speechRegistry);
const speechClient = await speechRegistry.getFirstOnlineClient('tts-1');

const [audio, result] = await speechClient.generateSpeech({
  text: 'Hello, welcome to Token Ring AI!',
  voice: 'alloy',
  speed: 1.0
}, agent);

// Audio available as Uint8Array
console.log('Generated audio:', audio);
```

### Audio Transcription

```typescript
import { TranscriptionModelRegistry } from '@tokenring-ai/ai-client';

const transcriptionRegistry = new TranscriptionModelRegistry();
agent.registerService(transcriptionRegistry);
const transcriptionClient = await transcriptionRegistry.getFirstOnlineClient('whisper-1');

const [text, result] = await transcriptionClient.transcribe({
  audio: new URL('audio.mp3'),
  language: 'en',
  prompt: 'Context for better transcription'
}, agent);

console.log('Transcribed text:', text);
```

### Reranking Documents

```typescript
const client = await chatRegistry.getFirstOnlineClient('gpt-4');
const rankings = await client.rerank({
  query: 'What is artificial intelligence?',
  documents: [
    'Artificial intelligence is the simulation of human intelligence in machines.',
    'Machine learning is a subset of artificial intelligence.',
    'Deep learning is a type of machine learning.'
  ],
  topK: 2
}, agent);

console.log('Ranked documents:', rankings.rankings);
```

## Configuration Options

### Provider Configuration

Configure multiple providers in the app configuration:

```json
{
  "ai": {
    "providers": {
      "openai": {
        "apiKey": "your-openai-key",
        "modelId": "gpt-4"
      },
      "anthropic": {
        "apiKey": "your-anthropic-key",
        "modelId": "claude-3-5-sonnet"
      },
      "google": {
        "apiKey": "your-google-key",
        "modelId": "gemini-2.0-flash"
      }
    }
  }
}
```

### Feature Flags

Enable specific features for individual models:

```typescript
// Get model with web search feature enabled
const chatClient = await chatRegistry.getFirstOnlineClient('openai/gpt-4?websearch=1');

// Get model with reasoning text enabled
const chatClient = await chatRegistry.getFirstOnlineClient('openai/gpt-4?reasoningText=1');
```

### Model Specifications

Each model can have provider-specific configurations:

```typescript
type ChatModelSpec = ModelSpec & {
  impl: Exclude<LanguageModel, string>;
  mangleRequest?: (req: ChatRequest, features: FeatureOptions) => void;
  speed?: number;
  research?: number;
  reasoningText?: number;
  tools?: number;
  intelligence?: number;
  maxCompletionTokens?: number;
  contextLength: number;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
  costPerMillionCachedInputTokens?: number;
  costPerMillionReasoningTokens?: number;
};
```

## Provider Integration

The package integrates with multiple AI providers through the Vercel AI SDK:

- **OpenAI**: Full support for all models
- **Anthropic**: Claude models with tool calling
- **Google**: Gemini models with web search
- **Groq**: Fast inference models
- **DeepSeek**: Open-source models
- **Perplexity**: Web search optimized models
- **Cerebras**: High-performance models
- **Azure**: Azure AI services
- **Fal**: Image generation providers
- **XAI**: Elon Musk's AI models
- **OpenRouter**: Multi-provider access
- **Ollama**: Local model hosting
- **OpenAI-Compatible**: Custom endpoint support

## Cost Tracking

The AI client automatically tracks and calculates costs for all operations:

```typescript
interface AIResponseCost {
  input?: number;
  cachedInput?: number;
  output?: number;
  reasoning?: number;
  total?: number;
}

interface AIResponseTiming {
  elapsedMs: number;
  tokensPerSec?: number;
  totalTokens?: number;
}
```

Cost calculations are based on provider-specific pricing and usage metrics.

## Context Compaction

The AI client includes automatic context compaction for long conversations:

```typescript
// Enable auto-compact
aiService.updateAIConfig({ autoCompact: true }, agent);

// Manual compact
import { compactContext } from '@tokenring-ai/ai-client/util/compactContext';
await compactContext(agent);
```

Compaction creates a summary of the conversation, reducing token usage while preserving important context.

## Commands

The package provides chat commands for interactive use:

### `/chat [message]`

Send a message to the AI using the current model and configuration.

```
/chat Explain how async/await works in JavaScript
```

### `/model [model_name]`

Set or show the current model. Without arguments, shows an interactive tree selection.

```
/model gpt-4.1
/model                    # Interactive selection
```

### `/ai settings key=value [...]`

Update AI configuration settings.

```
/ai settings temperature=0.7 maxTokens=4000
/ai settings autoCompact=true
/ai                       # Show current settings
```

### `/ai context`

Show all context items that would be included in the next chat request.

```
/ai context
```

### `/compact`

Manually compact the conversation context by summarizing prior messages.

```
/compact
```

### `/rerank query=\"...\" documents=\"...\"`

Rank documents by relevance to a query.

```
/rerank query=\"best programming languages\" documents=\"JavaScript,Python,Rust\"
```

## Supported Providers

| Provider          | Chat | Embeddings | Images | Speech | Transcription | Reranking | Notes                                     |
|-------------------|------|------------|--------|--------|---------------|-----------|-------------------------------------------|
| OpenAI            | ✅    | ✅          | ✅      | ✅      | ✅             | ✅        | GPT-4.1, GPT-5, O3, O4-mini, TTS, Whisper   |
| Anthropic         | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | Claude 3.5, 4, 4.1                        |
| Google            | ✅    | ❌          | ✅      | ❌      | ❌             | ❌        | Gemini 2.5 Pro/Flash, web search          |
| xAI               | ✅    | ❌          | ✅      | ❌      | ❌             | ❌        | Grok 3, 4, code models                    |
| DeepSeek          | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | DeepSeek Chat, Reasoner                   |
| Groq              | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | Fast inference, Llama models              |
| Cerebras          | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | Ultra-fast inference                      |
| Perplexity        | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | Sonar models with web search              |
| Azure             | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | Azure OpenAI Service                      |
| Ollama            | ✅    | ✅          | ❌      | ❌      | ❌             | ❌        | Local models                              |
| OpenRouter        | ✅    | ❌          | ❌      | ❌      | ❌             | ❌        | Access to many providers                  |
| Fal               | ❌    | ❌          | ✅      | ❌      | ❌             | ❌        | Image generation                          |
| OpenAI-Compatible | ✅    | ✅          | ❌      | ❌      | ❌             | ❌        | Custom endpoints                          |

## Model Features

Models can have various features that can be enabled/disabled:

- **websearch**: Enables web search capability
- **reasoningEffort**: Reasoning effort level (none, minimal, low, medium, high)
- **reasoningSummary**: Reasoning summary mode (auto, detailed)
- **serviceTier**: Service tier (auto, flex, priority, default)
- **textVerbosity**: Text verbosity (low, medium, high)
- **strictJsonSchema**: Use strict JSON schema validation

**Example:**

```typescript
// Select model with web search enabled
const client = await chatRegistry.getFirstOnlineClient('openai/gpt-5?websearch=1');

// Set features on a client
client.setFeatures({
  websearch: true,
  reasoningEffort: 'high',
  serviceTier: 'priority'
});
```

## Dependencies

- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/agent`: Core agent system
- `@tokenring-ai/utility`: Shared utilities
- `ai@5.0.113`: Vercel AI SDK
- `zod`: Schema validation
- Multiple AI provider packages

## Development

### Testing

Run tests with:

```bash
bun run test
```

### Building

Compile TypeScript with:

```bash
bun run build
```

The package uses Vitest for testing and Bun as the package manager.

## License

MIT License - See LICENSE file for details.