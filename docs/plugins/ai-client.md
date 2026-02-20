# AI Client

## Overview

The AI Client package is a multi-provider AI integration system for the Token Ring ecosystem. It provides a unified interface for accessing various AI models across different providers, including chat models, image generation, embeddings, speech synthesis, speech recognition, video generation, and reranking.

### Key Features

- **Multi-Provider Support**: Integrates with 17 AI providers including Anthropic, OpenAI, Google, Groq, Cerebras, DeepSeek, ElevenLabs, Fal, xAI, xAI Responses, OpenRouter, Perplexity, Azure, Ollama, llama.cpp, Qwen, and z.ai
- **Seven AI Capabilities**: Chat, Embeddings, Image Generation, Video Generation, Reranking, Speech Synthesis, and Transcription
- **Model Registries**: Seven dedicated service registries for managing model specifications and capabilities
- **Dynamic Model Registration**: Register custom models with availability checks
- **Model Status Tracking**: Monitor model online, cold, and offline status
- **Auto-Configuration**: Automatic provider setup from environment variables
- **JSON-RPC API**: Remote procedure call endpoints for programmatic access via plugin registration
- **Streaming Support**: Real-time streaming responses with delta handling
- **Agent Integration**: Seamless integration with Token Ring agent system through services
- **Feature Queries**: Support for query parameters in model names (e.g., `provider:model?websearch=1`)
- **Feature System**: Rich feature specification system supporting boolean, number, string, enum, and array types with validation

## Core Components

### Model Registries

The AI Client provides specialized registries for different AI model types:

- **ChatModelRegistry**: Manages chat completion models with reasoning, tools, and streaming support
- **ImageGenerationModelRegistry**: Manages image generation models
- **EmbeddingModelRegistry**: Manages text embedding models
- **SpeechModelRegistry**: Manages text-to-speech models
- **TranscriptionModelRegistry**: Manages speech-to-text models
- **RerankingModelRegistry**: Manages text reranking models
- **VideoGenerationModelRegistry**: Manages video generation models

### Providers

The package supports integration with the following AI providers:

1. **Anthropic** - Claude models with reasoning and web search capabilities
2. **OpenAI** - GPT models, DALL-E, Whisper, TTS with multimodal support
3. **Azure** - Azure OpenAI services for enterprise deployment
4. **Google** - Google Generative AI models including Gemini and Imagen
5. **Groq** - Fast inference models based on LLaMA
6. **Cerebras** - High-performance LLaMA-based inference
7. **DeepSeek** - DeepSeek models with advanced reasoning
8. **ElevenLabs** - Professional text-to-speech synthesis
9. **Fal** - Fast image generation with Fal.ai
10. **xAI** - xAI models (Grok) with reasoning capabilities
11. **xAI Responses** - xAI responses API for advanced reasoning and search
12. **OpenRouter** - Multi-provider router for aggregated access
13. **Perplexity** - Perplexity models with web search integration
14. **Ollama** - Self-hosted models via Ollama integration
15. **llama.cpp** - Local inference via llama.cpp API
16. **Qwen** - Alibaba Qwen models with Chinese language support
17. **z.ai** - Z.ai API for coding and general purpose

## API Reference

### Model Requirements

#### ChatModelRequirements

```typescript
interface ChatModelRequirements {
  nameLike?: string;
  contextLength?: number;
  maxCompletionTokens?: number;
  research?: number;
  reasoningText?: number;
  intelligence?: number;
  speed?: number;
  webSearch?: number;
}
```

#### EmbeddingModelRequirements

```typescript
interface EmbeddingModelRequirements {
  nameLike?: string;
  contextLength?: number;
}
```

#### ImageModelRequirements

```typescript
interface ImageModelRequirements {
  nameLike?: string;
  contextLength?: number;
}
```

#### VideoModelRequirements

```typescript
interface VideoModelRequirements {
  nameLike?: string;
  contextLength?: number;
}
```

#### RerankingModelRequirements

```typescript
interface RerankingModelRequirements {
  nameLike?: string;
}
```

#### SpeechModelRequirements

```typescript
interface SpeechModelRequirements {
  nameLike?: string;
}
```

#### TranscriptionModelRequirements

```typescript
interface TranscriptionModelRequirements {
  nameLike?: string;
}
```

### Registry Methods

#### ChatModelRegistry

```typescript
class ChatModelRegistry extends ModelTypeRegistry<ChatModelSpec, AIChatClient, ChatModelRequirements>
```

**Methods:**

- `registerAllModelSpecs(specs: ChatModelSpec[])`: Register multiple chat model specifications
- `getModelSpecsByRequirements(requirements: ChatModelRequirements)`: Get models matching specific requirements
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name: string)`: Get a client instance matching the model name
- `getCheapestModelByRequirements(requirements: string, estimatedContextLength = 10000)`: Find the cheapest model matching requirements

**Model Specification:**

Each model specification includes:
- `modelId`: Unique identifier for the model
- `providerDisplayName`: Display name of the provider
- `impl`: Model implementation interface
- `costPerMillionInputTokens`: Cost per million input tokens (default: 600)
- `costPerMillionOutputTokens`: Cost per million output tokens (default: 600)
- `costPerMillionCachedInputTokens`: Cost per million cached input tokens (optional)
- `costPerMillionReasoningTokens`: Cost per million reasoning tokens (optional)
- `contextLength`: Maximum context length in tokens
- `isAvailable()`: Async function to check model availability
- `isHot()`: Async function to check if model is warmed up
- `mangleRequest()`: Optional function to modify the request before sending
- `settings`: Optional feature specifications for query parameters
- `speed`: Speed capability score (0-infinity)
- `research`: Research ability (0-infinity)
- `reasoningText`: Reasoning capability score (0-infinity)
- `tools`: Tools capability score (0-infinity)
- `intelligence`: Intelligence capability score (0-infinity)
- `maxCompletionTokens`: Maximum output tokens (optional)

**Example:**

```typescript
const registry = app.requireService(ChatModelRegistry);
const models = registry.getModelSpecsByRequirements({
  nameLike: "gpt-4.1"
});

const client = await registry.getClient("OpenAI:gpt-5");
const [text, response] = await client.textChat(
  {
    messages: [
      { role: "user", content: "Hello" }
    ]
  },
  agent
);
```

#### Other Registries

The other registries (Embedding, ImageGeneration, VideoGeneration, Speech, Transcription, Reranking) extend the base `ModelTypeRegistry` and provide similar model management functionality.

## Configuration

### Plugin Configuration Schema

```typescript
const pluginConfigSchema = z.object({
  ai: AIClientConfigSchema.prefault({})
});

interface AIClientConfigSchema {
  autoConfigure?: boolean;
  providers?: Record<string, AIProviderConfig>;
}
```

**Note**: The `provider` field in `AIProviderConfig` is a discriminator that matches provider names like "anthropic", "openai", "google", and so on (lowercase).

### Auto-Configuration

When `autoConfigure` is set to `true` or `providers` is not specified, the system automatically loads providers from environment variables:

- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Generative AI key
- `GROQ_API_KEY` - Groq API key
- `CEREBRAS_API_KEY` - Cerebras API key
- `DEEPSEEK_API_KEY` - DeepSeek API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `FAL_API_KEY` - Fal.ai API key
- `XAI_API_KEY` - xAI API key
- `XAI_RESPONSES_API_KEY` - xAI Responses API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `PERPLEXITY_API_KEY` - Perplexity API key
- `AZURE_API_KEY` - Azure OpenAI API key
- `AZURE_API_ENDPOINT` - Azure OpenAI endpoint (optional)
- `OLLAMA_BASE_URL` - Ollama base URL (default: http://127.0.0.1:11434/v1)
- `OLLAMA_API_KEY` - Ollama API key (optional)
- `LLAMA_BASE_URL` - llama.cpp base URL (default: http://127.0.0.1:11434/v1)
- `LLAMA_API_KEY` - llama.cpp API key (optional)
- `DASHSCOPE_API_KEY` - Alibaba Qwen API key
- `ZAI_API_KEY` - Z.ai API key

### Provider Configuration

Each provider has specific configuration requirements:

#### Anthropic

```typescript
{
  provider: "anthropic",
  apiKey: string
}
```

#### OpenAI

```typescript
{
  provider: "openai",
  apiKey: string
}
```

#### Azure

```typescript
{
  provider: "azure",
  apiKey: string,
  baseURL: string
}
```

#### OpenAI-Compatible Providers

```typescript
{
  provider: "openaiCompatible",
  apiKey?: string,
  baseURL: string,
  defaultContextLength?: number
}
```

#### Ollama

```typescript
{
  provider: "ollama",
  baseURL?: string,
  apiKey?: string
}
```

#### llama.cpp

```typescript
{
  provider: "llama",
  baseURL?: string,
  apiKey?: string
}
```

#### xAI Responses

```typescript
{
  provider: "xai-responses",
  apiKey: string
}
```

## RPC Endpoints

The AI Client provides the following JSON-RPC endpoints:

### Model Listing Endpoints

| Method | Input | Result |
|--------|-------|--------|
| `listChatModels` | `{}` | `{ models: Record<string, {status, available, hot, modelSpec}> }` |
| `listChatModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, {status, available, hot}> }` |
| `listEmbeddingModels` | `{}` | `{ models: Record<string, {status, available, hot, modelSpec}> }` |
| `listEmbeddingModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, {status, available, hot}> }` |
| `listImageGenerationModels` | `{}` | `{ models: Record<string, {status, available, hot, modelSpec}> }` |
| `listImageGenerationModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, {status, available, hot}> }` |
| `listSpeechModels` | `{}` | `{ models: Record<string, {status, available, hot, modelSpec}> }` |
| `listSpeechModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, {status, available, hot}> }` |
| `listTranscriptionModels` | `{}` | `{ models: Record<string, {status, available, hot, modelSpec}> }` |
| `listTranscriptionModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, {status, available, hot}> }` |
| `listRerankingModels` | `{}` | `{ models: Record<string, {status, available, hot, modelSpec}> }` |
| `listRerankingModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, {status, available, hot}> }` |

**Note**: As of the current implementation, video generation endpoints (`listVideoGenerationModels` and `listVideoGenerationModelsByProvider`) are not yet available in the RPC implementation but are supported by the VideoGenerationModelRegistry.

**Response Structure:**

```typescript
{
  models: {
    "provider:model": {
      status: "online" | "cold" | "offline",
      available: boolean,
      hot: boolean,
      modelSpec: ModelSpec
    }
  }
}
```

**ByProvider Response Structure:**

```typescript
{
  modelsByProvider: {
    "Provider Name": {
      "provider:model": {
        status: "online" | "cold" | "offline",
        available: boolean,
        hot: boolean
      }
    }
  }
}
```

**Example Usage:**

```typescript
// Call via RPC
const result = await rpcService.call("listChatModels", {});
console.log(result.models);
```

## Usage Examples

### Basic Setup with Auto-Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";

const app = new TokenRingApp();

app.addPlugin(aiClientPlugin, {
  ai: {
    autoConfigure: true
  }
});
```

### Manual Provider Configuration

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";

const app = new TokenRingApp();

app.addPlugin(aiClientPlugin, {
  ai: {
    autoConfigure: false,
    providers: {
      OpenAI: {
        provider: "openai",
        apiKey: "sk-..."
      },
      Anthropic: {
        provider: "anthropic",
        apiKey: "sk-ant-..."
      }
    }
  }
});
```

### Finding Cheapest Model

```typescript
const chatRegistry = app.requireService(ChatModelRegistry);

// Find cheapest model with reasoning and intelligence >= 5
const modelId = chatRegistry.getCheapestModelByRequirements(
  "reasoningText>=5,intelligence>=5",
  80000  // Estimated context length
);

console.log(`Recommended model: ${modelId}`);
```

### Accessing Model Specs

```typescript
const chatRegistry = app.requireService(ChatModelRegistry);
const models = await chatRegistry.getAllModelsWithOnlineStatus();

for (const [modelId, spec] of Object.entries(models)) {
  console.log(`Model: ${modelId}`);
  console.log(`  Status: ${spec.status}`);
  console.log(`  Available: ${spec.available}`);
  console.log(`  Hot: ${spec.hot}`);
  console.log(`  Context Length: ${spec.modelSpec.contextLength}`);
  console.log(`  Cost per Million Input: $${spec.modelSpec.costPerMillionInputTokens}`);
  console.log(`  Cost per Million Output: $${spec.modelSpec.costPerMillionOutputTokens}`);
}
```

### Using RPC to List Models

```typescript
// Get all chat models via RPC
const result = await rpcService.call("listChatModels", {});
const models = result.models;

for (const [modelId, info] of Object.entries(models)) {
  if (info.available) {
    console.log(`Available: ${modelId}`);
  }
}
```

### Provider-Specific Model Listing

```typescript
// Get models by provider
const result = await rpcService.call("listChatModelsByProvider", {});
const modelsByProvider = result.modelsByProvider;

for (const [provider, providerModels] of Object.entries(modelsByProvider)) {
  console.log(`Provider: ${provider}`);
  for (const [modelId, info] of Object.entries(providerModels)) {
    console.log(`  ${modelId}: ${info.status}`);
  }
}
```

### Chat Model Usage

```typescript
const chatRegistry = app.requireService(ChatModelRegistry);
const client = await chatRegistry.getClient("OpenAI:gpt-5");

// Text chat
const [text, response] = await client.textChat(
  {
    messages: [
      { role: "user", content: "Hello" }
    ]
  },
  agent
);

// Streaming chat
const streamResponse = await client.streamChat(
  {
    messages: [
      { role: "user", content: "Tell me a story" }
    ]
  },
  agent
);

// Structured output
const [result, structuredResponse] = await client.generateObject(
  {
    messages: [
      { role: "user", content: "Extract the following information" }
    ],
    schema: z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email()
    })
  },
  agent
);

// Rerank documents
const rankings = await client.rerank({
  query: "What is machine learning?",
  documents: [
    "Machine learning is a subset of AI...",
    "AI is a broad field...",
    "Deep learning is a type of ML..."
  ],
  topN: 3
}, agent);

// Calculate cost
const cost = client.calculateCost({
  inputTokens: 100,
  outputTokens: 50
});

// Calculate timing
const timing = client.calculateTiming(1500, {
  inputTokens: 100,
  outputTokens: 50
});
```

### Embedding Model Usage

```typescript
const embeddingRegistry = app.requireService(EmbeddingModelRegistry);
const client = embeddingRegistry.getClient("OpenAI:text-embedding-3-small");

const embeddings = await client.getEmbeddings([
  "Hello world",
  "Machine learning is great"
]);
```

### Image Generation Model Usage

```typescript
const imageRegistry = app.requireService(ImageGenerationModelRegistry);
const client = imageRegistry.getClient("OpenAI:dall-e-3");

const [image, result] = await client.generateImage({
  prompt: "A beautiful sunset over the ocean",
  size: "1024x1024",
  quality: "high"
}, agent);
```

### Video Generation Model Usage

```typescript
const videoRegistry = app.requireService(VideoGenerationModelRegistry);
const client = videoRegistry.getClient("OpenAI:video-model");

const [video, result] = await client.generateVideo({
  prompt: "A beautiful sunset over the ocean",
  aspectRatio: "16:9",
  duration: 5
}, agent);
```

### Speech Model Usage

```typescript
const speechRegistry = app.requireService(SpeechModelRegistry);
const client = speechRegistry.getClient("ElevenLabs:text");

const [audio, result] = await client.generateSpeech({
  text: "Hello, world!",
  voice: "alloy",
  speed: 1.0
}, agent);
```

### Transcription Model Usage

```typescript
const transcriptionRegistry = app.requireService(TranscriptionModelRegistry);
const client = transcriptionRegistry.getClient("OpenAI:whisper-1");

const [text, result] = await client.transcribe({
  audio: audioFile,
  language: "en",
  prompt: "Transcribe this audio"
}, agent);
```

### Using Feature Queries

```typescript
// Get model with specific configuration
const client = await chatRegistry.getClient("OpenAI:gpt-5?websearch=1");

// Use the client
const [result, response] = await client.textChat(
  {
    messages: [
      { role: "user", content: "Search the web for the latest AI news" }
    ]
  },
  agent
);
```

### Using Feature System

```typescript
// Get model with multiple features
const client = await chatRegistry.getClient("OpenAI:gpt-5?websearch=1&reasoningEffort=high&serviceTier=priority");

// Set features on client instance
client.setSettings({
  websearch: true,
  reasoningEffort: "high",
  serviceTier: "priority"
});

// Get current features
const features = client.getSettings();
```

## Integration with Agent System

The AI Client integrates seamlessly with the Token Ring agent system:

```typescript
import { TokenRingAgent } from "@tokenring-ai/agent";

const agent = new TokenRingAgent({
  name: "Research Agent",
  tools: [/* ... */],
  config: {
    chatModel: "gpt-4.1",  // Model name from registry
  }
});

// Agent automatically uses the configured chat model
const response = await agent.chat("Analyze this data...");
```

## Model Capabilities

### Chat Models

Chat models support various capabilities:

- **Reasoning**: Text-based reasoning capabilities (0-8 scale)
- **Intelligence**: Overall intelligence score (0-8 scale)
- **Speed**: Response speed (0-5 scale)
- **Tools**: Tool use capability (0-7 scale)
- **Context Length**: Maximum tokens in context
- **Cost**: Input/output token costs
- **Streaming**: Real-time streaming responses
- **Structured Output**: JSON schema-based output generation
- **Reranking**: Document relevance ranking

### Image Generation Models

Image models support:
- **Multiple Quality Levels**: High, medium, low quality variants
- **Cost Calculation**: Dynamic pricing based on image size
- **Variant Models**: Different quality options for same base model

### Video Generation Models

Video models support:
- **Text-to-Video**: Generate videos from text prompts
- **Image-to-Video**: Generate videos from images
- **Dynamic Pricing**: Cost based on video duration and resolution

### Speech Models

Speech models include:
- **TTS Models**: Text-to-speech (e.g., tts-1, tts-1-hd)
- **Transcription Models**: Speech-to-text (e.g., whisper-1)
- **Character/Minute Pricing**: Cost based on usage

### Embedding Models

Embedding models provide:
- **Text Vectorization**: Convert text to embeddings
- **Context Length**: Maximum input token length
- **Semantic Search**: Support for similarity-based search

### Reranking Models

Reranking models support:
- **Document Relevance**: Rank documents by relevance to query
- **Score Calculation**: Generate relevance scores between 0-1
- **Top-N Filtering**: Optional filtering for top results

## Best Practices

1. **Use Appropriate Models**: Choose models based on your specific use case (reasoning, speed, cost)
2. **Monitor Costs**: Use `getCheapestModelByRequirements` to optimize costs
3. **Check Availability**: Always check `available` status before using models
4. **Auto-Configure**: Use environment variables for easy deployment
5. **Provider Diversity**: Configure multiple providers for redundancy
6. **Cache Model Lists**: Model lists are cached; refresh when needed
7. **Use Feature Queries**: Leverage query parameters for flexible model selection
8. **Reuse Clients**: Create client instances once and reuse for multiple requests
9. **Check Model Hot Status**: Use `isHot()` to determine if a model needs to be warmed up
10. **Calculate Costs**: Use `calculateCost()` to estimate expenses before making requests
11. **Use Streaming for Long Responses**: Use `streamChat()` for better user experience with long responses
12. **Set Settings**: Use `setSettings()` on client instances to enable specific features
13. **Monitor Model Status**: Check model status before expensive operations to avoid failed requests
14. **Leverage Video Generation**: Use video models for dynamic content creation
15. **Use Reranking**: Improve search results with reranking models

## Testing

The package includes unit tests using Vitest:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Dependencies

### Runtime Dependencies

- **@tokenring-ai/app**: Core application framework with service and plugin system
- **@tokenring-ai/agent**: Agent framework for tool execution
- **@tokenring-ai/utility**: Shared utilities and registry functionality
- **@tokenring-ai/rpc**: RPC service for remote procedure calls
- **zod**: Runtime schema validation
- **ai**: Vercel AI SDK for streaming and client functionality
- **axios**: HTTP client for API requests

### AI SDK Dependencies

- **@ai-sdk/anthropic**: Anthropic AI SDK for Claude models
- **@ai-sdk/azure**: Azure OpenAI SDK for Azure hosting
- **@ai-sdk/cerebras**: Cerebras AI SDK for LLaMA models
- **@ai-sdk/deepseek**: DeepSeek AI SDK for DeepSeek models
- **@ai-sdk/elevenlabs**: ElevenLabs SDK for speech synthesis
- **@ai-sdk/fal**: Fal AI SDK for image generation
- **@ai-sdk/google**: Google Generative AI SDK for Gemini models
- **@ai-sdk/groq**: Groq AI SDK for LLaMA inference
- **@ai-sdk/openai**: OpenAI AI SDK for GPT, Whisper, TTS models
- **@ai-sdk/openai-compatible**: OpenAI-compatible API SDK
- **@ai-sdk/perplexity**: Perplexity AI SDK for Perplexity models
- **@ai-sdk/xai**: xAI SDK for Grok models
- **@ai-sdk/provider**: Core AI SDK provider interface
- **@openrouter/ai-sdk-provider**: OpenRouter SDK for provider aggregation
- **ollama-ai-provider-v2**: Ollama SDK for local model hosting

### Development Dependencies

- **@vitest/coverage-v8**: Code coverage
- **typescript**: TypeScript compiler
- **vitest**: Unit testing framework

## Development

The package follows the Token Ring plugin pattern:

1. **Install Phase**: Registers seven service instances (registries) and optionally registers RPC endpoint
2. **Start Phase**: Initializes providers and registers models through the provider initialization chain

The package does not include streaming client implementations directly. Streaming clients are provided by the individual provider SDKs and accessed through the registries.

## Limitations

- Video generation RPC endpoints are not yet implemented (but the functionality is available via direct client usage)
- The `VideoGenerationModelRegistry` exists but lacks RPC endpoints in the current implementation

## License

MIT License - see LICENSE file for details.

## Related Components

- **@tokenring-ai/agent**: Agent system for using AI models
- **@tokenring-ai/app**: Application framework
- **@tokenring-ai/rpc**: RPC service integration
