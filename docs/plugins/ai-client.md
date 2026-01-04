# AI Client Plugin

## Overview

The `@tokenring-ai/ai-client` package provides a unified interface for interacting with multiple AI providers through the Vercel AI SDK. It integrates with the Token Ring Agent framework to manage AI configurations, model selection, chat history, and request building.

**Key Features:**

- **Multi-Provider Support**: OpenAI, Anthropic, Google, Groq, DeepSeek, Cerebras, xAI, Perplexity, Azure, Ollama, OpenRouter, Fal, ElevenLabs, Llama, and OpenAI-compatible endpoints
- **Model Registry**: Automatic model selection based on cost, capabilities (reasoning, intelligence, speed, tools), and availability
- **Chat Management**: Conversation history, streaming responses, cost/timing analytics
- **Multiple Modalities**: Chat completions, embeddings, image generation, speech synthesis, and audio transcription
- **Reranking**: Document ranking and relevance scoring using AI models
- **Feature Management**: Dynamic feature selection and configuration per model
- **Auto-Configuration**: Automatic provider detection from environment variables
- **Cost Tracking**: Detailed cost calculation and tracking for all AI operations

## Installation

Part of the Token Ring monorepo. Install dependencies and build:

```bash
bun install
bun run build
```

## Core Properties

- `ai.autoConfigure`: Whether to automatically configure providers from environment variables
- `ai.providers`: Configuration object for AI providers

## Key Features

- **Multi-Provider Support**: Integrates with 15+ AI providers including OpenAI, Anthropic, Google, Groq, and others
- **Model Registries**: Centralized management of chat, image generation, embedding, speech, transcription, and reranking models
- **Type-Safe Configuration**: Zod schema for validation
- **Extensible Provider System**: Custom providers can be added via the provider registry
- **Cost Tracking**: Automatic cost calculation and tracking for AI usage
- **Feature Flags**: Runtime feature configuration per model
- **Streaming Support**: Full streaming capabilities for chat completions
- **Context Compaction**: Automatic conversation summarization to manage token usage
- **Reranking**: Document ranking and relevance scoring
- **Multiple Modalities**: Support for chat, embeddings, images, speech, and transcription

## Core Methods/API

### ChatModelRegistry

The `ChatModelRegistry` manages chat completion models and provides methods for model selection and client creation.

**Methods:**

- `getClient(name: string)`: Get a chat client for a specific model
- `getModelSpecsByRequirements(requirements)`: Get models matching specified requirements
- `getCheapestModelByRequirements(requirements)`: Get the cheapest model matching requirements
- `registerAllModelSpecs(modelSpecs)`: Register multiple model specifications
- `getAllModelsWithOnlineStatus()`: Get all models with their availability status
- `getModelsByProvider()`: Get models grouped by provider

**Example:**

```typescript
const chatRegistry = app.getService(ChatModelRegistry);

// Get a client for a specific model
const client = await chatRegistry.getClient('openai:gpt-4.1');

// Get cheapest model with high reasoning capability
const cheapest = chatRegistry.getCheapestModelByRequirements({
  reasoningText: 4,
  contextLength: 100000
});
```

### EmbeddingModelRegistry

The `EmbeddingModelRegistry` manages text embedding models for generating vector representations of text.

**Methods:**

- `getClient(name: string)`: Get an embedding client for a specific model
- `getModelSpecsByRequirements(requirements)`: Get models matching requirements
- `registerAllModelSpecs(modelSpecs)`: Register multiple model specifications

**Example:**

```typescript
const embeddingRegistry = app.getService(EmbeddingModelRegistry);
const client = await embeddingRegistry.getClient('openai:text-embedding-3-small');

const results = await client.getEmbeddings({
  input: ['Hello', 'World']
});
console.log(results[0].embedding); // Vector array
```

### ImageGenerationModelRegistry

The `ImageGenerationModelRegistry` manages image generation models.

**Methods:**

- `getClient(name: string)`: Get an image generation client
- `registerAllModelSpecs(modelSpecs)`: Register model specifications

**Example:**

```typescript
const imageRegistry = app.getService(ImageGenerationModelRegistry);
const client = await imageRegistry.getClient('openai:gpt-image-1');

const [image, result] = await client.generateImage({
  prompt: 'A serene mountain landscape',
  size: '1024x1024',
  n: 1
}, agent);
```

### SpeechModelRegistry

The `SpeechModelRegistry` manages text-to-speech models.

**Methods:**

- `getClient(name: string)`: Get a speech synthesis client
- `registerAllModelSpecs(modelSpecs)`: Register model specifications

**Example:**

```typescript
const speechRegistry = app.getService(SpeechModelRegistry);
const client = await speechRegistry.getClient('openai:tts-1-hd');

const [audio, result] = await client.generateSpeech({
  text: 'Hello, welcome to Token Ring AI!',
  voice: 'alloy',
  speed: 1.0
}, agent);
```

### TranscriptionModelRegistry

The `TranscriptionModelRegistry` manages audio transcription models.

**Methods:**

- `getClient(name: string)`: Get a transcription client
- `registerAllModelSpecs(modelSpecs)`: Register model specifications

**Example:**

```typescript
const transcriptionRegistry = app.getService(TranscriptionModelRegistry);
const client = await transcriptionRegistry.getClient('openai:whisper-1');

const [text, result] = await client.transcribe({
  audio: audioBuffer,
  language: 'en',
  prompt: 'Context for better transcription'
}, agent);
```

### RerankingModelRegistry

The `RerankingModelRegistry` manages document reranking models.

**Methods:**

- `getClient(name: string)`: Get a reranking client
- `registerAllModelSpecs(modelSpecs)`: Register model specifications

**Example:**

```typescript
const rerankingRegistry = app.getService(RerankingModelRegistry);
const client = await rerankingRegistry.getClient('openai:rerank');

const result = await client.rerank({
  query: 'What is AI?',
  documents: [
    'Artificial intelligence is...',
    'Machine learning is...',
    'Deep learning is...'
  ],
  topN: 2
});
```

## Usage Examples

### Basic Chat Completion

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ChatModelRegistry } from '@tokenring-ai/ai-client';

const agent = new Agent();
const chatRegistry = new ChatModelRegistry();
agent.registerService(chatRegistry);

// Get chat client for a specific model
const chatClient = await chatRegistry.getClient('openai:gpt-4.1');

// Stream chat completion
const [text, response] = await chatClient.streamChat({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ],
  tools: {},
}, agent);

console.log('Chat response:', text);
console.log('Cost:', response.cost.total);
```

### Generating Embeddings

```typescript
import { EmbeddingModelRegistry } from '@tokenring-ai/ai-client';

const embeddingRegistry = new EmbeddingModelRegistry();
agent.registerService(embeddingRegistry);
const embeddingClient = await embeddingRegistry.getClient('openai:text-embedding-3-large');

const embeddings = await embeddingClient.getEmbeddings({
  input: ['Token Ring AI is a framework for building AI applications']
});
```

### Generating Images

```typescript
import { ImageGenerationModelRegistry } from '@tokenring-ai/ai-client';

const imageRegistry = new ImageGenerationModelRegistry();
agent.registerService(imageRegistry);
const imageClient = await imageRegistry.getClient('openai:gpt-image-1');

const [image, result] = await imageClient.generateImage({
  prompt: 'A beautiful sunset over mountains',
  size: '1024x1024',
  quality: 'standard',
  n: 1
}, agent);

console.log('Generated image:', image);
```

### Generating Speech

```typescript
import { SpeechModelRegistry } from '@tokenring-ai/ai-client';

const speechRegistry = new SpeechModelRegistry();
agent.registerService(speechRegistry);
const speechClient = await speechRegistry.getClient('openai:tts-1-hd');

const [audio, result] = await speechClient.generateSpeech({
  text: 'Hello, welcome to Token Ring AI!',
  voice: 'alloy',
  speed: 1.0
}, agent);

console.log('Generated audio:', audio);
```

### Transcribing Audio

```typescript
import { TranscriptionModelRegistry } from '@tokenring-ai/ai-client';

const transcriptionRegistry = new TranscriptionModelRegistry();
agent.registerService(transcriptionRegistry);
const transcriptionClient = await transcriptionRegistry.getClient('openai:whisper-1');

const [text, result] = await transcriptionClient.transcribe({
  audio: new URL('audio.mp3'),
  language: 'en',
  prompt: 'Context for better transcription'
}, agent);

console.log('Transcribed text:', text);
```

### Reranking Documents

```typescript
const chatRegistry = app.getService(ChatModelRegistry);
const client = await chatRegistry.getClient('openai:gpt-4.1');

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

## Configuration

The plugin configuration is defined in `schema.ts` and can be set in the application configuration.

### Provider Configuration

Configure providers in your `.tokenring/coder-config.mjs`:

```javascript
export default {
  ai: {
    defaultModel: "gpt-4.1",
    autoConfigure: true, // Set to true to auto-configure from environment variables
    providers: {
      "OpenAI": {
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY
      },
      "Anthropic": {
        provider: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY
      },
      "Google": {
        provider: "google",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
      },
      "xAI": {
        provider: "xai",
        apiKey: process.env.XAI_API_KEY
      },
      "Perplexity": {
        provider: "perplexity",
        apiKey: process.env.PERPLEXITY_API_KEY
      },
      "Groq": {
        provider: "groq",
        apiKey: process.env.GROQ_API_KEY
      },
      "DeepSeek": {
        provider: "deepseek",
        apiKey: process.env.DEEPSEEK_API_KEY
      },
      "Cerebras": {
        provider: "cerebras",
        apiKey: process.env.CEREBRAS_API_KEY
      },
      "Azure": {
        provider: "azure",
        apiKey: process.env.AZURE_API_KEY,
        baseURL: process.env.AZURE_API_ENDPOINT
      },
      "Ollama": {
        provider: "ollama",
        baseURL: process.env.LLAMA_BASE_URL ?? "http://127.0.0.1:11434"
      },
      "OpenRouter": {
        provider: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY
      },
      "Llama": {
        provider: "llama",
        apiKey: process.env.META_LLAMA_API_KEY
      },
      "OpenAI-Compatible": {
        provider: "openaiCompatible",
        baseURL: "https://api.example.com/v1",
        apiKey: process.env.API_KEY
      },
      "Fal": {
        provider: "fal",
        apiKey: process.env.FAL_API_KEY
      },
      "ElevenLabs": {
        provider: "elevenlabs",
        apiKey: process.env.ELEVENLABS_API_KEY
      }
    }
  }
};
```

### Auto-Configuration

Set `autoConfigure: true` to automatically detect providers from environment variables:

| Environment Variable | Provider |
|----------------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic |
| `AZURE_API_KEY` + `AZURE_API_ENDPOINT` | Azure |
| `CEREBRAS_API_KEY` | Cerebras |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google |
| `GROQ_API_KEY` | Groq |
| `META_LLAMA_API_KEY` | Llama |
| `OPENAI_API_KEY` | OpenAI |
| `LLAMA_BASE_URL` / `LLAMA_API_KEY` | Ollama |
| `OPENROUTER_API_KEY` | OpenRouter |
| `PERPLEXITY_API_KEY` | Perplexity |
| `XAI_API_KEY` | xAI |
| `DASHSCOPE_API_KEY` | Qwen (OpenAI-compatible) |
| `ZAI_API_KEY` | zAI (OpenAI-compatible) |

### Model Features

Models can have various features that can be enabled/disabled:

#### OpenAI Models

| Feature | Description | Default |
|---------|-------------|---------|
| `websearch` | Enables web search capability | false |
| `reasoningEffort` | Reasoning effort level (none, minimal, low, medium, high) | "medium" |
| `reasoningSummary` | Reasoning summary mode (auto, detailed) | undefined |
| `serviceTier` | Service tier (auto, flex, priority, default) | "auto" |
| `textVerbosity` | Text verbosity (low, medium, high) | "medium" |
| `strictJsonSchema` | Use strict JSON schema validation | false |
| `promptCacheRetention` | Prompt cache retention policy | "in_memory" |

#### Anthropic Models

| Feature | Description | Default |
|---------|-------------|---------|
| `maxSearchUses` | Maximum web searches (0-20) | 0 |

#### Google Models

| Feature | Description | Default |
|---------|-------------|---------|
| `websearch` | Enables web search | false |
| `responseModalities` | Response modalities | ["TEXT"] |
| `thinkingBudget` | Thinking token budget | undefined |
| `thinkingLevel` | Thinking depth (Gemini 3) | undefined |
| `includeThoughts` | Include thought summaries | false |

#### xAI Models

| Feature | Description | Default |
|---------|-------------|---------|
| `websearch` | Enables web search | false |
| `maxSearchResults` | Max search results | 20 |
| `returnCitations` | Return citations | false |

#### Perplexity Models

| Feature | Description | Default |
|---------|-------------|---------|
| `websearch` | Enables web search | true |
| `searchContextSize` | Search context size (low, medium, high) | "low" |

#### OpenRouter Models

| Feature | Description | Default |
|---------|-------------|---------|
| `websearch` | Enables web search plugin | false |
| `searchEngine` | Search engine (native, exa) | undefined |
| `maxResults` | Max search results | 5 |
| `temperature` | Temperature (0-2.0) | undefined |
| `topP` | Top P sampling (0-1.0) | undefined |
| `topK` | Top K sampling | undefined |

**Example:**

```typescript
// Select model with web search enabled
const client = await chatRegistry.getClient('openai/gpt-5?websearch=1');

// Set features on a client
client.setFeatures({
  websearch: true,
  reasoningEffort: 'high',
  serviceTier: 'priority'
});
```

## Supported Providers

| Provider | Chat | Embeddings | Images | Speech | Transcription | Reranking | Notes |
|----------|------|------------|--------|--------|---------------|-----------|-------|
| OpenAI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | GPT-4.1, GPT-5, O3, O4-mini, TTS, Whisper |
| Anthropic | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Claude 4.5, 4.1 |
| Google | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | Gemini 2.5 Pro/Flash, Imagen |
| xAI | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | Grok 3, 4, 4.1 |
| DeepSeek | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | DeepSeek Chat, Reasoner |
| Groq | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Fast inference, Llama models |
| Cerebras | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Ultra-fast inference |
| Perplexity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Sonar models with web search |
| Azure | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Azure OpenAI Service |
| Ollama | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Local models |
| OpenRouter | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Access to many providers |
| Fal | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Image generation |
| OpenAI-Compatible | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Custom endpoints |
| Llama | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Meta Llama models |
| ElevenLabs | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | TTS and transcription |

## Integration

The AI Client integrates with the Agent system by registering model services. Agents can access these services via the application's service registry.

### Chat Commands

The package registers the following chat commands for interactive use:

- `/chat [message]`: Send a message to the AI using the current model and configuration
- `/model [model_name]`: Set or show the current model (supports interactive selection)
- `/ai settings key=value [...]`: Update AI configuration settings
- `/ai context`: Show all context items that would be included in the next chat request
- `/compact`: Manually compact the conversation context by summarizing prior messages
- `/rerank query="..." documents="..."`: Rank documents by relevance to a query

## Cost Tracking

All responses include detailed cost information:

```typescript
const [output, response] = await runChat({ input: 'Hello' }, agent);

console.log(`Input: $${response.cost.input.toFixed(4)}`);
console.log(`Cached: $${response.cost.cachedInput?.toFixed(4) || 0}`);
console.log(`Output: $${response.cost.output.toFixed(4)}`);
console.log(`Reasoning: $${response.cost.reasoning?.toFixed(4) || 0}`);
console.log(`Total: $${response.cost.total.toFixed(4)}`);
```

**Cost Response Type:**

```typescript
type AIResponseCost = {
  input?: number;           // Cost of input tokens
  cachedInput?: number;     // Cost of cached input tokens
  output?: number;          // Cost of output tokens
  reasoning?: number;       // Cost of reasoning tokens
  total?: number;           // Total cost
};

type AIResponseTiming = {
  elapsedMs: number;        // Time elapsed in milliseconds
  tokensPerSec?: number;    // Tokens processed per second
  totalTokens?: number;     // Total tokens processed
};
```

## Best Practices

- Use `autoConfigure` for development to automatically detect available providers
- For production, explicitly configure providers to ensure reliability and performance
- Always validate configuration using the provided Zod schema
- For long conversations, enable context compaction to manage token usage
- Use model features (e.g., web search, reasoning effort) to optimize performance
- Take advantage of cost tracking to monitor AI usage expenses

## Testing

The package includes unit tests using Vitest. Run tests with:

```bash
bun run test              # Run tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

## Package Structure

```
pkg/ai-client/
├── client/
│   ├── AIChatClient.ts           # Chat completion client with streaming support
│   ├── AIEmbeddingClient.ts      # Text embedding client
│   ├── AIImageGenerationClient.ts # Image generation client
│   ├── AISpeechClient.ts         # Text-to-speech client
│   ├── AITranscriptionClient.ts  # Audio transcription client
│   └── AIRerankingClient.ts      # Document reranking client
├── providers/
│   ├── anthropic.ts              # Anthropic provider
│   ├── azure.ts                  # Azure provider
│   ├── cerebras.ts               # Cerebras provider
│   ├── deepseek.ts               # DeepSeek provider
│   ├── elevenlabs.ts             # ElevenLabs provider (speech & transcription)
│   ├── fal.ts                    # Fal provider (image generation)
│   ├── google.ts                 # Google provider
│   ├── groq.ts                   # Groq provider
│   ├── llama.ts                  # Llama provider
│   ├── ollama.ts                 # Ollama provider (local models)
│   ├── openai.ts                 # OpenAI provider
│   ├── openaiCompatible.ts       # OpenAI-compatible provider
│   ├── openrouter.ts             # OpenRouter provider
│   ├── perplexity.ts             # Perplexity provider
│   ├── xai.ts                    # xAI provider
│   └── xai-responses.ts          # xAI responses provider
├── util/
│   ├── cachedDataRetriever.ts    # Data caching utilities
│   └── resequenceMessages.ts     # Message resequencing utilities
├── ModelRegistry.ts              # Model registries for each modality
├── ModelTypeRegistry.ts          # Generic model registry with features
├── providers.ts                  # Provider registration and config schema
├── schema.ts                     # AI model provider interface and schemas
├── autoConfig.ts                 # Auto-configuration from environment
├── plugin.ts                     # Plugin entry point
└── index.ts                      # Package exports
```

## Related Components

- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/agent`: Agent orchestration system
- `@ai-sdk/openai`: OpenAI provider implementation
- `@ai-sdk/anthropic`: Anthropic provider implementation
- `@ai-sdk/google`: Google provider implementation
- `@tokenring-ai/utility`: Shared utilities

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
