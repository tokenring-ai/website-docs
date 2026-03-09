# AI Client

## Overview

The AI Client package (`@tokenring-ai/ai-client`) is a multi-provider AI integration system for the Token Ring ecosystem. It provides a unified interface for accessing various AI models across different providers, including chat models, image generation, embeddings, speech synthesis, speech recognition, video generation, and reranking.

### Key Features

- **Multi-Provider Support**: Integrates with 15 AI providers including Anthropic, OpenAI, Google, Groq, Cerebras, DeepSeek, ElevenLabs, Fal, xAI, OpenRouter, Perplexity, Azure, Ollama, llama.cpp, and additional providers via OpenAI-compatible APIs (Chutes, NVIDIA NIM, Meta Llama, Qwen/DashScope, zAI)
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

The AI Client provides specialized registries for different AI model types. Each registry implements the `TokenRingService` interface and provides methods for managing model specifications and retrieving client instances.

- **ChatModelRegistry**: Manages chat completion models with reasoning, tools, and streaming support
- **ImageGenerationModelRegistry**: Manages image generation models
- **EmbeddingModelRegistry**: Manages text embedding models
- **SpeechModelRegistry**: Manages text-to-speech models
- **TranscriptionModelRegistry**: Manages speech-to-text models
- **RerankingModelRegistry**: Manages text reranking models
- **VideoGenerationModelRegistry**: Manages video generation models

### Services

The package registers seven service instances during plugin installation:

```typescript
export class ChatModelRegistry extends ModelTypeRegistry<ChatModelSpec, AIChatClient, ChatModelRequirements> implements TokenRingService {
  readonly name = "ChatModelRegistry";
  description = "Model registry for chat models";
  
  // Methods inherited from ModelTypeRegistry
  registerAllModelSpecs(specs: ChatModelSpec[]): void
  getModelSpecsByRequirements(requirements: ChatModelRequirements): Record<string, ChatModelSpec>
  getModelsByProvider(): Promise<Record<string, Record<string, ChatModelSpec>>>
  getAllModelsWithOnlineStatus(): Promise<Record<string, ModelStatus<ChatModelSpec>>>
  getClient(name: string): Promise<AIChatClient>
  
  // ChatModelRegistry-specific method
  getCheapestModelByRequirements(requirements: string, estimatedContextLength?: number): string | null
}

export class EmbeddingModelRegistry extends ModelTypeRegistry<EmbeddingModelSpec, AIEmbeddingClient, EmbeddingModelRequirements> implements TokenRingService {
  readonly name = "EmbeddingModelRegistry";
  description = "Model registry for embedding models";
}

export class ImageGenerationModelRegistry extends ModelTypeRegistry<ImageModelSpec, AIImageGenerationClient, ImageModelRequirements> implements TokenRingService {
  readonly name = "ImageGenerationModelRegistry";
  description = "Model registry for image generation models";
}

export class VideoGenerationModelRegistry extends ModelTypeRegistry<VideoModelSpec, AIVideoGenerationClient, VideoModelRequirements> implements TokenRingService {
  readonly name = "VideoGenerationModelRegistry";
  description = "Model registry for video generation models";
}

export class SpeechModelRegistry extends ModelTypeRegistry<SpeechModelSpec, AISpeechClient, SpeechModelRequirements> implements TokenRingService {
  readonly name = "SpeechModelRegistry";
  description = "Model registry for speech models";
}

export class TranscriptionModelRegistry extends ModelTypeRegistry<TranscriptionModelSpec, AITranscriptionClient, TranscriptionModelRequirements> implements TokenRingService {
  readonly name = "TranscriptionModelRegistry";
  description = "Model registry for transcription models";
}

export class RerankingModelRegistry extends ModelTypeRegistry<RerankingModelSpec, AIRerankingClient, RerankingModelRequirements> implements TokenRingService {
  readonly name = "RerankingModelRegistry";
  description = "Model registry for reranking models";
}
```

## Providers

The package supports integration with the following AI providers through dedicated providers:

### Core Providers

| Provider | SDK/Model Support | Key Features |
|----------|-------------------|--------------|
| Anthropic | Claude models | Reasoning, analysis, web search |
| OpenAI | GPT models, Whisper, TTS | Reasoning, multimodal, real-time audio |
| Azure | Azure OpenAI | Enterprise deployment |
| Google | Gemini, Imagen | Thinking, multimodal, image generation |
| Groq | LLaMA-based models | High-speed inference |
| Cerebras | LLaMA-based models | High performance |
| DeepSeek | DeepSeek models | Reasoning capabilities |
| ElevenLabs | Speech synthesis | Multilingual voice generation |
| Fal | Image generation | Fast image generation |
| xAI | xAI models | Reasoning and analysis, X search |
| OpenRouter | Aggregated access | Multiple provider access |
| Perplexity | Perplexity models | Web search integration |
| Ollama | Self-hosted models | Local inference |
| llama.cpp | Self-hosted models | Local inference |

### OpenAI-Compatible Providers

Additional providers are supported via the `openaiCompatible` provider, including:

- **Chutes**: LLM hosting with OpenAI-compatible API
- **NVIDIA NIM**: NVIDIA models with OpenAI-compatible API
- **Meta Llama**: Meta's llama.com API
- **Qwen (DashScope)**: Chinese language support, long context
- **zAI**: High-performance models

## API Reference

### Model Requirements

Model requirements are used to filter and select models based on specific capabilities.

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

### Model Specification

Each model specification includes the following properties:

```typescript
interface ChatModelSpec {
  modelId: string;
  providerDisplayName: string;
  impl: any; // Model implementation interface
  costPerMillionInputTokens?: number;
  costPerMillionOutputTokens?: number;
  costPerMillionCachedInputTokens?: number;
  costPerMillionReasoningTokens?: number;
  maxContextLength?: number;
  maxCompletionTokens?: number;
  isAvailable(): Promise<boolean>;
  isHot(): Promise<boolean>;
  mangleRequest?(req: any, settings: Map<string, any>): any;
  settings?: Record<string, FeatureSpecification>;
  speed?: number;
  research?: number;
  reasoningText?: number;
  tools?: number;
  intelligence?: number;
}
```

### Registry Methods

All registries extend `ModelTypeRegistry` and provide the following methods:

#### registerAllModelSpecs

```typescript
registerAllModelSpecs(specs: ModelSpec[]): void
```

Register multiple model specifications for the registry type.

#### getModelSpecsByRequirements

```typescript
getModelSpecsByRequirements(requirements: ModelRequirements): Record<string, ModelSpec>
```

Get models matching specific requirements.

#### getModelsByProvider

```typescript
getModelsByProvider(): Promise<Record<string, Record<string, ModelSpec>>>
```

Get all registered models grouped by provider.

#### getAllModelsWithOnlineStatus

```typescript
getAllModelsWithOnlineStatus(): Promise<Record<string, ModelStatus<ModelSpec>>>
```

Get all models with their online status.

#### getClient

```typescript
getClient(name: string): Promise<ClientType>
```

Get a client instance matching the model name.

### ChatModelRegistry-Specific Methods

#### getCheapestModelByRequirements

```typescript
getCheapestModelByRequirements(requirements: string, estimatedContextLength?: number): string | null
```

Find the cheapest model matching requirements.

**Parameters:**
- `requirements`: String representation of requirements (e.g., `reasoningText>=5,intelligence>=5`)
- `estimatedContextLength`: Estimated context length in tokens (default: 10000)

**Returns:** Model ID of the cheapest matching model, or null if no match found.

**Example:**

```typescript
const chatRegistry = app.requireService(ChatModelRegistry);
const modelId = chatRegistry.getCheapestModelByRequirements(
  "reasoningText>=5,intelligence>=5",
  80000  // Estimated context length
);
console.log(`Recommended model: ${modelId}`);
```

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

**Note:** The `provider` field in `AIProviderConfig` is a discriminator that matches provider names like `anthropic`, `openai`, `google`, and so on (lowercase).

### Auto-Configuration

When `autoConfigure` is set to `true` or `providers` is not specified, the system automatically loads providers from environment variables.

#### Environment Variables

| Provider | Environment Variable |
|----------|---------------------|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` |
| Groq | `GROQ_API_KEY` |
| Cerebras | `CEREBRAS_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |
| ElevenLabs | `ELEVENLABS_API_KEY` |
| Fal | `FAL_API_KEY` |
| xAI | `XAI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Perplexity | `PERPLEXITY_API_KEY` |
| Azure | `AZURE_API_KEY`, `AZURE_API_ENDPOINT` |
| Ollama | `OLLAMA_BASE_URL`, `OLLAMA_API_KEY` |
| llama.cpp | `LLAMA_BASE_URL`, `LLAMA_API_KEY` |
| Qwen (DashScope) | `DASHSCOPE_API_KEY` |
| zAI | `ZAI_API_KEY` |
| Chutes | `CHUTES_API_KEY` |
| Meta Llama | `META_LLAMA_API_KEY` |
| NVIDIA NIM | `NVIDIA_NIM_API_KEY` |

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

#### Google

```typescript
{
  provider: "google",
  apiKey: string
}
```

#### Groq

```typescript
{
  provider: "groq",
  apiKey: string
}
```

#### Cerebras

```typescript
{
  provider: "cerebras",
  apiKey: string
}
```

#### DeepSeek

```typescript
{
  provider: "deepseek",
  apiKey: string
}
```

#### ElevenLabs

```typescript
{
  provider: "elevenlabs",
  apiKey: string
}
```

#### Fal

```typescript
{
  provider: "fal",
  apiKey: string
}
```

#### xAI

```typescript
{
  provider: "xai",
  apiKey: string
}
```

#### OpenRouter

```typescript
{
  provider: "openrouter",
  apiKey: string
}
```

#### Perplexity

```typescript
{
  provider: "perplexity",
  apiKey: string
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

#### OpenAI-Compatible

```typescript
{
  provider: "openaiCompatible",
  apiKey?: string,
  baseURL: string,
  defaultContextLength?: number
}
```

## RPC Endpoints

The AI Client provides the following JSON-RPC endpoints via the `/rpc/ai-client` path.

### Model Listing Endpoints

| Method | Input | Result |
|--------|-------|--------|
| `listChatModels` | `{}` | `{ models: Record<string, ModelStatus> }` |
| `listChatModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` |
| `listEmbeddingModels` | `{}` | `{ models: Record<string, ModelStatus> }` |
| `listEmbeddingModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` |
| `listImageGenerationModels` | `{}` | `{ models: Record<string, ModelStatus> }` |
| `listImageGenerationModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` |
| `listSpeechModels` | `{}` | `{ models: Record<string, ModelStatus> }` |
| `listSpeechModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` |
| `listTranscriptionModels` | `{}` | `{ models: Record<string, ModelStatus> }` |
| `listTranscriptionModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` |
| `listRerankingModels` | `{}` | `{ models: Record<string, ModelStatus> }` |
| `listRerankingModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` |

**Note:** Video generation endpoints (`listVideoGenerationModels` and `listVideoGenerationModelsByProvider`) are not yet available in the RPC implementation but are supported by the `VideoGenerationModelRegistry` service.

### Response Structure

#### Model Status Response

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

#### ByProvider Response

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

### RPC Usage Example

```typescript
import { RpcService } from "@tokenring-ai/rpc";

// Get all chat models via RPC
const result = await rpcService.call("listChatModels", {});
const models = result.models;

for (const [modelId, info] of Object.entries(models)) {
  if (info.available) {
    console.log(`Available: ${modelId}`);
  }
}

// Get models by provider
const byProvider = await rpcService.call("listChatModelsByProvider", {});
const modelsByProvider = byProvider.modelsByProvider;

for (const [provider, providerModels] of Object.entries(modelsByProvider)) {
  console.log(`Provider: ${provider}`);
  for (const [modelId, info] of Object.entries(providerModels)) {
    console.log(`  ${modelId}: ${info.status}`);
  }
}
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
      },
      Google: {
        provider: "google",
        apiKey: "AIza..."
      }
    }
  }
});
```

### Chat Model Usage

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";
import { TokenRingAgent } from "@tokenring-ai/agent";

const app = new TokenRingApp();
app.addPlugin(aiClientPlugin, { ai: { autoConfigure: true } });

// Wait for the registry to be available
await app.waitForService("ChatModelRegistry", async (chatRegistry) => {
  // Get models matching requirements
  const models = chatRegistry.getModelSpecsByRequirements({
    nameLike: "gpt-5"
  });

  // Get all models with online status
  const allModels = await chatRegistry.getAllModelsWithOnlineStatus();

  // Get models by provider
  const byProvider = await chatRegistry.getModelsByProvider();

  // Get a client
  const client = await chatRegistry.getClient("openai:gpt-5");

  // Text chat
  const [text, response] = await client.textChat(
    {
      messages: [
        { role: "user", content: "Hello" }
      ]
    },
    agent
  );

  console.log(text); // "Hi there!"

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
});
```

### Embedding Model Usage

```typescript
await app.waitForService("EmbeddingModelRegistry", async (embeddingRegistry) => {
  const client = embeddingRegistry.getClient("openai:text-embedding-3-small");
  const embeddings = await client.getEmbeddings([
    "Hello world",
    "Machine learning is great"
  ]);
});
```

### Image Generation Model Usage

```typescript
await app.waitForService("ImageGenerationModelRegistry", async (imageRegistry) => {
  const client = imageRegistry.getClient("openai:gpt-image-1-high");
  const [image, result] = await client.generateImage({
    prompt: "A beautiful sunset over the ocean",
    size: "1024x1024",
    n: 1
  }, agent);
});
```

### Video Generation Model Usage

```typescript
await app.waitForService("VideoGenerationModelRegistry", async (videoRegistry) => {
  const client = videoRegistry.getClient("xai:grok-imagine-video");
  const [video, result] = await client.generateVideo({
    prompt: "A beautiful sunset over the ocean",
    aspectRatio: "16:9",
    duration: 5
  }, agent);
});
```

### Speech Model Usage

```typescript
await app.waitForService("SpeechModelRegistry", async (speechRegistry) => {
  const client = speechRegistry.getClient("openai:tts-1");
  const [audio, result] = await client.generateSpeech({
    text: "Hello, world!",
    voice: "alloy",
    speed: 1.0
  }, agent);
});
```

### Transcription Model Usage

```typescript
await app.waitForService("TranscriptionModelRegistry", async (transcriptionRegistry) => {
  const client = transcriptionRegistry.getClient("openai:whisper-1");
  const [text, result] = await client.transcribe({
    audio: audioFile,
    language: "en"
  }, agent);
});
```

### Using Feature Queries

```typescript
// Get model with specific configuration
const client = await chatRegistry.getClient("openai:gpt-5?websearch=1");

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
const client = await chatRegistry.getClient("openai:gpt-5?websearch=1&reasoningEffort=high");

// Set features on client instance
client.setSettings({
  websearch: true,
  reasoningEffort: "high"
});

// Get current features
const features = client.getSettings();
```

### Custom Model Registration

```typescript
// Get registry instance
const chatRegistry = app.getService("ChatModelRegistry");

chatRegistry.registerAllModelSpecs([
  {
    modelId: "custom-model",
    providerDisplayName: "CustomProvider",
    impl: customProvider("custom-model"),
    costPerMillionInputTokens: 5,
    costPerMillionOutputTokens: 15,
    maxContextLength: 100000,
    async isAvailable() {
      return true;
    }
  }
]);
```

## Provider-Specific Features

Different providers support different features that can be configured via query parameters or `setSettings()`.

### OpenAI Features

- `websearch`: Enable web search tool (boolean)
- `reasoningEffort`: Reasoning effort level (enum: minimal, low, medium, high)
- `reasoningSummary`: Reasoning summary mode (enum: auto, detailed)
- `serviceTier`: Service tier (enum: auto, flex, priority, default)
- `textVerbosity`: Text verbosity (enum: low, medium, high)
- `strictJsonSchema`: Use strict JSON schema validation (boolean)
- `promptCacheRetention`: Prompt cache retention policy (enum: in_memory, 24h)

### Anthropic Features

- `maxSearchUses`: Maximum number of web searches (number, 0-20, default: 0)

### xAI Features

- `websearch`: Enable web search (boolean)
- `webImageUnderstanding`: Enable image understanding in web search (boolean)
- `XSearch`: Enable X search (boolean)
- `XFromDate`: From date for X search (string)
- `XToDate`: To date for X search (string)
- `XAllowedHandles`: Allowed handles for X search (string)
- `XImageUnderstanding`: Enable image understanding in X search (boolean)
- `XVideoUnderstanding`: Enable video understanding in X search (boolean)

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

## Model Status

Models track their online status:

- **online**: Model is available and ready for use
- **cold**: Model is available but needs to be warmed up
- **offline**: Model is not available

### Availability Checking

Models check their availability in the background shortly after startup:

```typescript
// Check model availability
const allModels = await chatRegistry.getAllModelsWithOnlineStatus();

// Check if a specific model is available
const modelSpec = chatRegistry.getModelSpecsByRequirements({
  nameLike: "gpt-5"
})["openai:gpt-5"];

const isAvailable = await modelSpec.isAvailable();
const isHot = await modelSpec.isHot();
```

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

### Plugin Lifecycle

1. **Install Phase**: Registers seven service instances (registries) and registers RPC endpoint
2. **Start Phase**: Initializes providers and registers models through the provider initialization chain

### Plugin Structure

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";

export default {
  name: "@tokenring-ai/ai-client",
  version: "0.2.0",
  description: "AI client for the Token Ring ecosystem",
  
  install(app, config) {
    // Register seven service registries
    app.addServices(new ChatModelRegistry());
    app.addServices(new ImageGenerationModelRegistry());
    app.addServices(new EmbeddingModelRegistry());
    app.addServices(new SpeechModelRegistry());
    app.addServices(new TranscriptionModelRegistry());
    app.addServices(new RerankingModelRegistry());
    app.addServices(new VideoGenerationModelRegistry());
    
    // Register RPC endpoint
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(aiClientRPC);
    });
  },
  
  async start(app, config) {
    // Configure providers
    let providerConfig = config.ai.providers;
    if (config.ai.autoConfigure || !providerConfig) {
      providerConfig = autoConfig();
    }
    
    await registerProviders(providerConfig, app);
  },
  
  config: pluginConfigSchema
} satisfies TokenRingPlugin<typeof pluginConfigSchema>;
```

### Exports

The package exports the following from `index.ts`:

- `Tool`: Type from Vercel AI SDK
- `UserModelMessage`: Type from Vercel AI SDK
- `chatTool`: Tool creation function from Vercel AI SDK
- `stepCountIs`: Step counting function from Vercel AI SDK

The actual client classes (`AIChatClient`, `AIEmbeddingClient`, etc.) are internal implementation details and are accessed through the model registries.

## Limitations

- Video generation RPC endpoints are not yet implemented (but the functionality is available via direct client usage)
- The `VideoGenerationModelRegistry` exists but lacks RPC endpoints in the current implementation

## License

MIT License - see LICENSE file for details.

## Related Components

- **@tokenring-ai/agent**: Agent system for using AI models
- **@tokenring-ai/app**: Application framework
- **@tokenring-ai/rpc**: RPC service integration
