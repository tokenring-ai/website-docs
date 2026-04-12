# @tokenring-ai/ai-client

## User Guide

Multi-provider AI integration client for the Token Ring ecosystem. Provides unified access to various AI models through a consistent interface, supporting chat, embeddings, image generation, reranking, speech synthesis, and transcription capabilities.

### Overview

The AI Client package acts as a unified interface to multiple AI providers, abstracting away provider-specific differences while maintaining full access to provider capabilities. It integrates with the Token Ring agent system through seven model registry services that manage model specifications and provide client instances. Models are automatically discovered and registered from each provider, with background processes checking availability and updating status.

### Key Features

- **15 Native AI Providers**: Anthropic, OpenAI, Google, Groq, Cerebras, DeepSeek, ElevenLabs, Fal, xAI, OpenRouter, Perplexity, Azure, Ollama, Llama (via Meta API), plus generic providers for OpenAI/Anthropic/Responses-compatible APIs
- **Generic Provider Support**: Configure custom providers via OpenAI-compatible, Anthropic-compatible, or Responses-compatible endpoints with dynamic model discovery
- **Seven AI Capabilities**: Chat, Embeddings, Image Generation, Video Generation, Reranking, Speech, and Transcription
- **Seven Model Registry Classes**: Dedicated registries for managing model specifications and capabilities
- **Dynamic Model Registration**: Register custom models with availability checks and background discovery
- **Model Status Tracking**: Monitor model online, cold, and offline status with automatic availability checking
- **Auto-Configuration**: Automatic provider setup from environment variables with fallback to manual configuration
- **JSON-RPC API**: Remote procedure call endpoints for programmatic access via plugin registration
- **Streaming Support**: Real-time streaming responses with delta handling for text and reasoning output
- **Agent Integration**: Seamless integration with Token Ring agent system through services with cost tracking
- **Feature System**: Rich feature specification system supporting boolean, number, string, enum, and array types with validation
- **Cost Tracking**: Automatic cost calculation and metrics integration with detailed cost breakdowns
- **Model Querying**: Query models by name pattern with optional feature settings and wildcard support

### Installation

```bash
bun add @tokenring-ai/ai-client
```

### Chat Commands

This package does not define any chat commands. It provides AI model access through the Token Ring agent system.

### Tools

This package does not define any tools directly. It provides AI model clients that can be used by other packages to implement tools.

### Configuration

The AI Client can be configured through environment variables or explicit provider configuration.

#### Auto-Configuration

Enable automatic provider configuration using environment variables:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";

const app = new TokenRingApp();

app.addPlugin(aiClientPlugin, {
  ai: {
    autoConfigure: true  // Auto-detect and configure providers from env vars
  }
});
```

#### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google API key | `AIza...` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | `...` |
| `XAI_API_KEY` | xAI API key | `...` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `...` |
| `PERPLEXITY_API_KEY` | Perplexity API key | `...` |
| `DEEPSEEK_API_KEY` | DeepSeek API key | `...` |
| `CEREBRAS_API_KEY` | Cerebras API key | `...` |
| `DASHSCOPE_API_KEY` | Qwen (DashScope) API key | `sk-...` |
| `META_LLAMA_API_KEY` | Meta API Service key | `sk-...` |
| `ZAI_API_KEY` | zAI API key | `...` |
| `CHUTES_API_KEY` | Chutes API key | `...` |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API key | `...` |
| `MINIMAX_API_KEY` | Minimax API key | `...` |
| `MIMO_API_KEY` | MiMo API key | `...` |
| `LLAMA_BASE_URL` | llama.cpp base URL | `http://127.0.0.1:11434/v1` |
| `LLAMA_API_KEY` | llama.cpp API key (optional) | `...` |
| `AZURE_API_ENDPOINT` | Azure API endpoint | `https://...` |
| `AZURE_API_KEY` | Azure API key | `<key>` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://127.0.0.1:11434/v1` |

#### Manual Configuration

```typescript
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

#### Configuration Schema

```yaml
ai:
  autoConfigure: true  # Default: true
  providers:
    OpenAI:
      provider: "openai"
      apiKey: "sk-..."
    Anthropic:
      provider: "anthropic"
      apiKey: "sk-ant-..."
```

**Note**: The `provider` field in `AIProviderConfig` is a discriminator that matches provider names like "anthropic", "openai", "google", and so on (lowercase).

### Integration

The AI Client integrates with the Token Ring ecosystem through:

1. **Service Registry**: Seven model registry services are registered during plugin installation
2. **RPC Endpoint**: JSON-RPC endpoint at `/rpc/ai-client` for programmatic access
3. **Agent Integration**: Clients work with Token Ring agents for cost tracking and streaming output
4. **Metrics Service**: Automatic cost tracking through the MetricsService

### Best Practices

1. **Auto-Configure**: Use `autoConfigure: true` for convenience and automatic environment variable detection
2. **Check Availability**: Always verify models are available using `getAllModelsWithOnlineStatus()` or `getClient()`
3. **Use Feature Queries**: Leverage query parameters for flexible model selection without creating multiple clients
4. **Monitor Status**: Check model status before expensive operations to avoid failed requests
5. **Reuse Clients**: Create client instances once and reuse for multiple requests for better performance
6. **Select Appropriate Models**: Choose models based on context length and cost requirements
7. **Custom Registrations**: Add custom models when needed using `registerAllModelSpecs()`
8. **Use RPC for Remote Access**: For programmatic access across processes, use the JSON-RPC endpoint
9. **Set Settings**: Use `setSettings()` on client instances to enable specific features without creating multiple clients
10. **Calculate Costs**: Use `calculateCost()` to estimate expenses before making requests
11. **Use Cheapest Model**: Use `getCheapestModelByRequirements()` to find the most cost-effective model for your needs
12. **Check Model Hot Status**: Use `isHot()` to determine if a model needs to be warmed up

## Developer Reference

### Core Components

#### Model Registries

The package provides seven model registry services, each implementing the `TokenRingService` interface:

- **ChatModelRegistry**: Manages chat model specifications
- **ImageGenerationModelRegistry**: Manages image generation model specifications
- **VideoGenerationModelRegistry**: Manages video generation model specifications
- **EmbeddingModelRegistry**: Manages embedding model specifications
- **SpeechModelRegistry**: Manages speech synthesis model specifications
- **TranscriptionModelRegistry**: Manages speech-to-text transcription model specifications
- **RerankingModelRegistry**: Manages document reranking model specifications

#### Client Classes

- **AIChatClient**: Chat completion and structured output generation
- **AIEmbeddingClient**: Text vectorization and embeddings
- **AIImageGenerationClient**: Image generation from text prompts
- **AIVideoGenerationClient**: Video generation from text or images
- **AISpeechClient**: Text-to-speech synthesis
- **AITranscriptionClient**: Audio-to-text transcription
- **AIRerankingClient**: Document relevance ranking

#### Utilities

- **modelSettings**: Parses and serializes model names with feature settings
- **resequenceMessages**: Resequences chat messages to maintain proper alternation

### Services

#### ChatModelRegistry

Manages chat model specifications and provides access to chat completion capabilities.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register multiple chat model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern (e.g., `"openai:gpt-5"` or `"openai:*"`) |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name (supports query parameters for features) |
| `getCheapestModelByRequirements(nameLike, estimatedContextLength)` | Find the cheapest model matching a name pattern |

**Model Specification:**

```typescript
{
  modelId: string;
  providerDisplayName: string;
  impl: LanguageModel;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
  costPerMillionCachedInputTokens?: number;
  costPerMillionReasoningTokens?: number;
  maxContextLength: number;
  isAvailable(): Promise<boolean>;
  isHot(): Promise<boolean>;
  mangleRequest?(req: ChatRequest, settings: ChatModelSettings): void;
  settings?: ChatModelSettings;
  inputCapabilities?: Partial<ChatModelInputCapabilities>;
}
```

#### ImageGenerationModelRegistry

Manages image generation model specifications.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register image generation model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name |

#### VideoGenerationModelRegistry

Manages video generation model specifications.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register video generation model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name |

#### EmbeddingModelRegistry

Manages embedding model specifications for text vectorization.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register embedding model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name |

#### SpeechModelRegistry

Manages speech synthesis model specifications.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register speech model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name |

#### TranscriptionModelRegistry

Manages speech-to-text transcription model specifications.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register transcription model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name |

#### RerankingModelRegistry

Manages document reranking model specifications.

**Methods:**

| Method | Description |
|--------|-------------|
| `registerAllModelSpecs(specs)` | Register reranking model specifications |
| `getModelSpecsByRequirements(nameLike)` | Get models matching a name pattern |
| `getModelsByProvider()` | Get all registered models grouped by provider |
| `getAllModelsWithOnlineStatus()` | Get all models with their online status |
| `getClient(name)` | Get a client instance matching the model name |

### Provider Documentation

The package supports the following AI providers:

| Provider | SDK/Model Support | Key Features |
|----------|-------------------|--------------|
| Anthropic | Claude models | Reasoning, analysis, web search, context caching, image input, file input |
| OpenAI | GPT models, Whisper, TTS, Image Generation | Reasoning, multimodal, real-time audio, image generation, web search, deep research, audio input/output |
| Google | Gemini, Imagen | Thinking, multimodal, image generation, web search, video input, audio input |
| Groq | LLaMA-based models | High-speed inference, Llama, Qwen, Kimi models |
| Cerebras | Cerebras models | High performance inference |
| DeepSeek | DeepSeek models | Reasoning capabilities, chat and reasoner |
| ElevenLabs | Speech synthesis and transcription | Multilingual voice generation, speaker diarization |
| Fal | Image generation | Fast image generation, Flux models |
| xAI | Grok models | Reasoning and analysis, image generation, video generation |
| OpenRouter | Aggregated access | Multiple provider access, dynamic model discovery |
| Perplexity | Perplexity models | Web search integration, deep research |
| Azure | Azure OpenAI | Enterprise deployment |
| Ollama | Self-hosted models | Local inference, chat and embedding models |
| Llama | Meta Llama models (via Meta API) | Remote inference via Meta API |
| Generic | OpenAI/Anthropic/Responses-compatible | Custom providers, llama.cpp, any compatible API |

### RPC Endpoints

The AI Client exposes JSON-RPC endpoints for programmatic access via the RPC service. The endpoint is registered under the path `/rpc/ai-client`.

#### Available Endpoints

| Method | Request Params | Response Params | Purpose |
|--------|----------------|-----------------|---------|
| `listChatModels` | `{}` | `{ models: {...} }` | Get all available chat models with their status |
| `listChatModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get chat models grouped by provider |
| `listEmbeddingModels` | `{}` | `{ models: {...} }` | Get all available embedding models |
| `listEmbeddingModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get embedding models grouped by provider |
| `listImageGenerationModels` | `{}` | `{ models: {...} }` | Get all available image generation models |
| `listImageGenerationModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get image generation models grouped by provider |
| `listVideoGenerationModels` | `{}` | `{ models: {...} }` | Get all available video generation models |
| `listVideoGenerationModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get video generation models grouped by provider |
| `listSpeechModels` | `{}` | `{ models: {...} }` | Get all available speech models |
| `listSpeechModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get speech models grouped by provider |
| `listTranscriptionModels` | `{}` | `{ models: {...} }` | Get all available transcription models |
| `listTranscriptionModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get transcription models grouped by provider |
| `listRerankingModels` | `{}` | `{ models: {...} }` | Get all available reranking models |
| `listRerankingModelsByProvider` | `{}` | `{ modelsByProvider: {...} }` | Get reranking models grouped by provider |

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

### Usage Examples

#### Direct Client Creation

```typescript
import TokenRingApp from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";

const app = new TokenRingApp();

app.addPlugin(aiClientPlugin, {
  ai: {
    autoConfigure: true
  }
});

// Wait for services to be registered
await app.waitForService('ChatModelRegistry', chatRegistry => {
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

  // Use the client
  const [text, response] = await client.textChat(
    {
      messages: [
        { role: "user", content: "Hello" }
      ]
    },
    agent
  );

  console.log(text); // "Hi there!"
});
```

#### Using Model Registries

```typescript
// Chat models
await app.waitForService('ChatModelRegistry', chatRegistry => {
  const client = chatRegistry.getClient("openai:gpt-5");
  const [text, response] = await client.textChat(
    { messages: [{ role: "user", content: "Hello" }] },
    agent
  );
});

// Embedding models
await app.waitForService('EmbeddingModelRegistry', embeddingRegistry => {
  const client = embeddingRegistry.getClient("openai:text-embedding-3-small");
  const embeddings = await client.getEmbeddings(["your text here"]);
});

// Image generation
await app.waitForService('ImageGenerationModelRegistry', imageRegistry => {
  const client = imageRegistry.getClient("openai:gpt-image-1-high");
  const [image, result] = await client.generateImage({
    prompt: "A beautiful sunset over the ocean",
    size: "1024x1024",
    n: 1
  }, agent);
});

// Speech synthesis
await app.waitForService('SpeechModelRegistry', speechRegistry => {
  const client = speechRegistry.getClient("openai:tts-1");
  const [audio, result] = await client.generateSpeech({
    text: "Hello, world!",
    voice: "alloy",
    speed: 1.0
  }, agent);
});

// Transcription
await app.waitForService('TranscriptionModelRegistry', transcriptionRegistry => {
  const client = transcriptionRegistry.getClient("openai:whisper-1");
  const [text, result] = await client.transcribe({
    audio: audioFile
  }, agent);
});
```

#### Custom Model Registration

```typescript
// Get registry instance
const chatRegistry = app.getService('ChatModelRegistry');

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

#### Using Feature Queries

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

### Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Dependencies

#### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Base application framework |
| `@tokenring-ai/agent` | 0.2.0 | Agent framework |
| `@tokenring-ai/rpc` | 0.2.0 | RPC service |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities |
| `@tokenring-ai/metrics` | 0.2.0 | Metrics service |
| `ai` | ^6.0.138 | Vercel AI SDK |
| `zod` | ^4.3.6 | Schema validation |
| `axios` | ^1.13.6 | HTTP client |

#### AI SDK Dependencies

| Package | Purpose |
|---------|---------|
| `@ai-sdk/anthropic` | Anthropic Claude models |
| `@ai-sdk/azure` | Azure OpenAI |
| `@ai-sdk/cerebras` | Cerebras models |
| `@ai-sdk/deepseek` | DeepSeek models |
| `@ai-sdk/elevenlabs` | ElevenLabs speech/transcription |
| `@ai-sdk/fal` | Fal image generation |
| `@ai-sdk/google` | Google Gemini/Imagen |
| `@ai-sdk/groq` | Groq inference |
| `@ai-sdk/openai` | OpenAI GPT/Whisper/TTS |
| `@ai-sdk/openai-compatible` | OpenAI-compatible APIs |
| `@ai-sdk/open-responses` | OpenAI Responses API |
| `@ai-sdk/perplexity` | Perplexity models |
| `@ai-sdk/xai` | xAI Grok models |
| `@openrouter/ai-sdk-provider` | OpenRouter aggregation |
| `ollama-ai-provider-v2` | Ollama local models |

#### Package Information

- **Version**: 0.2.0
- **License**: MIT

### Related Components

- **@tokenring-ai/app**: Base application framework with service and plugin system
- **@tokenring-ai/agent**: Agent framework for tool execution
- **@tokenring-ai/rpc**: RPC service for programmatic access
- **@tokenring-ai/utility**: Shared utilities and registry functionality
- **@tokenring-ai/metrics**: Metrics service for cost tracking

## License

MIT License - see LICENSE file for details.
