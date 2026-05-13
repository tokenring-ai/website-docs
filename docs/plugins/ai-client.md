# AI Client

## User Guide

Multi-provider AI integration client for the Token Ring ecosystem. Provides unified access to various AI models through a consistent interface, supporting chat, embeddings, image generation, reranking, speech synthesis, and transcription capabilities.

### Overview and Purpose

The AI Client package (`@tokenring-ai/ai-client`) provides a unified interface to multiple AI providers, abstracting away provider-specific differences while maintaining full access to provider capabilities. It integrates with the Token Ring agent system through seven model registry classes that manage model specifications and provide client instances.

The package supports 16 native AI providers and a generic provider for custom endpoints, offering access to chat, embeddings, image generation, video generation, reranking, speech synthesis, and transcription capabilities through a consistent API built on the Vercel AI SDK.

### Key Features

- **16 Native AI Providers**: Anthropic, OpenAI, Google, Groq, Cerebras, DeepSeek, ElevenLabs, Fal, xAI, OpenRouter, Perplexity, Azure, Ollama, Llama (via Meta API), Minimax, plus generic providers for OpenAI/Anthropic/Responses-compatible APIs
- **Seven AI Capabilities**: Chat, Embeddings, Image Generation, Video Generation, Reranking, Speech, and Transcription
- **Seven Model Registry Classes**: Dedicated registries for managing model specifications and capabilities (ChatModelRegistry, ImageGenerationModelRegistry, VideoGenerationModelRegistry, EmbeddingModelRegistry, SpeechModelRegistry, TranscriptionModelRegistry, and RerankingModelRegistry)
- **Dynamic Model Registration**: Register custom models with availability checks and background discovery
- **Model Status Tracking**: Monitor model online, cold, and offline status with automatic availability checking
- **Auto-Configuration**: Automatic provider setup from environment variables with fallback to manual configuration (defaults to `autoConfigure: true`)
- **JSON-RPC API**: Remote procedure call endpoints for programmatic access via plugin registration at `/rpc/ai-client`
- **Streaming Support**: Real-time streaming responses with delta handling for text and reasoning output
- **Agent Integration**: Seamless integration with Token Ring agent system through services with automatic cost tracking
- **Feature System**: Rich feature specification system supporting boolean, number, string, enum, and array types with validation
- **Cost Tracking**: Automatic cost calculation and metrics integration with detailed cost breakdowns
- **Model Querying**: Query models by name pattern with optional feature settings and wildcard support (e.g., `openai:*` for all OpenAI models)

### Chat Commands

This package does not define any chat commands. It provides AI model access through the Token Ring agent system.

### Tools

The AI Client package does not define any tools directly. Tools are typically defined in other packages that use the AI Client to interact with models.

### Configuration

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

The plugin configuration schema is:

```typescript
{
  ai: {
    autoConfigure?: boolean;  // Default: true
    providers?: Record<string, AIProviderConfig>;
  }
}
```

**Note**: The `provider` field in `AIProviderConfig` is a discriminator that matches provider names like "anthropic", "openai", "google", etc. (lowercase). The top-level keys (like "OpenAI", "Anthropic", "xAi") are display names that can be customized.

### Integration

The AI Client integrates with the Token Ring ecosystem through:

1. **Service Registration**: Seven model registry services are registered during plugin installation
2. **RPC Endpoint**: JSON-RPC endpoint registered at `/rpc/ai-client` for programmatic access
3. **Agent Integration**: Seamless integration with Token Ring agent system through services with automatic cost tracking
4. **Metrics Integration**: Automatic cost tracking and metrics collection

### Best Practices

1. **Use Auto-Configuration**: Enable `autoConfigure: true` for convenience and automatic environment variable detection
2. **Check Availability**: Always verify models are available using `getAllModelsWithOnlineStatus()` before use
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

The package provides seven model registry services and multiple client classes:

#### Model Registries

- **ChatModelRegistry**: Manages chat model specifications and provides chat completion capabilities
- **ImageGenerationModelRegistry**: Manages image generation model specifications
- **VideoGenerationModelRegistry**: Manages video generation model specifications
- **EmbeddingModelRegistry**: Manages embedding model specifications for text vectorization
- **SpeechModelRegistry**: Manages speech synthesis model specifications
- **TranscriptionModelRegistry**: Manages speech-to-text transcription model specifications
- **RerankingModelRegistry**: Manages document reranking model specifications

#### Client Classes

Accessed through model registries via `getClient()`:

- **AIChatClient**: Chat completion and structured output generation with streaming support
- **AIEmbeddingClient**: Text vectorization and embeddings
- **AIImageGenerationClient**: Image generation from text prompts
- **AIVideoGenerationClient**: Video generation from text or images
- **AISpeechClient**: Text-to-speech synthesis
- **AITranscriptionClient**: Audio-to-text transcription
- **AIRerankingClient**: Document relevance ranking

### Services

Each registry implements the `TokenRingService` interface and provides methods for managing model specifications and retrieving clients.

#### ChatModelRegistry

Manages chat model specifications and provides access to chat completion capabilities.

**Methods:**

- `registerAllModelSpecs(specs)`: Register multiple chat model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern (e.g., `"openai:gpt-5"` or `"openai:*"`)
- `getModelsByProvider()`: Get all registered models grouped by provider (async)
- `getAllModelsWithOnlineStatus()`: Get all models with their online status (async)
- `getClient(name)`: Get a client instance matching the model name (supports query parameters for features)
- `getCheapestModelByRequirements(nameLike, estimatedContextLength)`: Find the cheapest model matching a name pattern

**Note**: The `getModelSpecsByRequirements` method accepts a name pattern string (e.g., `"openai:gpt-5"` or `"openai:*"`) to filter models by name.
The method returns all models matching the pattern that also support the features specified in the query string
(e.g., `"openai:gpt-5?websearch=1"`).

**Model Specification:**

```typescript
{
  modelId: string;
  providerDisplayName: string;
  impl: ModelImplementation;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
  costPerMillionCachedInputTokens?: number;
  costPerMillionReasoningTokens?: number;
  maxContextLength: number;
  isAvailable(): Promise<boolean>;
  isHot(): Promise<boolean>;
  mangleRequest?(request: unknown): unknown;
  settings?: FeatureSpecification;
  inputCapabilities?: InputCapability;
}
```

#### ImageGenerationModelRegistry

Manages image generation model specifications.

**Methods:**

- `registerAllModelSpecs(specs)`: Register image generation model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name)`: Get a client instance matching the model name

#### VideoGenerationModelRegistry

Manages video generation model specifications.

**Methods:**

- `registerAllModelSpecs(specs)`: Register video generation model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name)`: Get a client instance matching the model name

#### EmbeddingModelRegistry

Manages embedding model specifications for text vectorization.

**Methods:**

- `registerAllModelSpecs(specs)`: Register embedding model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name)`: Get a client instance matching the model name

#### SpeechModelRegistry

Manages speech synthesis model specifications.

**Methods:**

- `registerAllModelSpecs(specs)`: Register speech model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name)`: Get a client instance matching the model name

#### TranscriptionModelRegistry

Manages speech-to-text transcription model specifications.

**Methods:**

- `registerAllModelSpecs(specs)`: Register transcription model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name)`: Get a client instance matching the model name

#### RerankingModelRegistry

Manages document reranking model specifications.

**Methods:**

- `registerAllModelSpecs(specs)`: Register reranking model specifications
- `getModelSpecsByRequirements(nameLike)`: Get models matching a name pattern
- `getModelsByProvider()`: Get all registered models grouped by provider
- `getAllModelsWithOnlineStatus()`: Get all models with their online status
- `getClient(name)`: Get a client instance matching the model name

### Provider Documentation

The package supports the following AI providers through dedicated integrations. For detailed model information, see the package README.

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
| Minimax | Minimax models | Chat and reasoning models |
| Generic | OpenAI/Anthropic/Responses-compatible | Custom providers, llama.cpp, any compatible API |

### RPC Endpoints

The AI Client exposes JSON-RPC endpoints for programmatic access via the RPC service. The endpoint is registered under the path `/rpc/ai-client`.

#### Available Methods

| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `listChatModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available chat models with their status |
| `listChatModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get chat models grouped by provider |
| `listEmbeddingModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available embedding models |
| `listEmbeddingModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get embedding models grouped by provider |
| `listImageGenerationModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available image generation models |
| `listImageGenerationModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get image generation models grouped by provider |
| `listVideoGenerationModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available video generation models |
| `listVideoGenerationModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get video generation models grouped by provider |
| `listSpeechModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available speech models |
| `listSpeechModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get speech models grouped by provider |
| `listTranscriptionModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available transcription models |
| `listTranscriptionModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get transcription models grouped by provider |
| `listRerankingModels` | `{}` | `{ models: Record<string, ModelStatus> }` | Get all available reranking models |
| `listRerankingModelsByProvider` | `{}` | `{ modelsByProvider: Record<string, Record<string, ModelStatus>> }` | Get reranking models grouped by provider |

#### Model Status Structure

```typescript
{
  status: "online" | "cold" | "offline";
  available: boolean;
  hot: boolean;
  modelSpec: ModelSpec;
}
```

### Usage Examples

#### Basic Plugin Configuration

```typescript
import TokenRingApp from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";

const app = new TokenRingApp();

app.addPlugin(aiClientPlugin, {
  ai: {
    autoConfigure: true
  }
});
```

#### Using Model Registries

```typescript
import TokenRingApp from "@tokenring-ai/app";
import aiClientPlugin from "@tokenring-ai/ai-client";

const app = new TokenRingApp();

app.addPlugin(aiClientPlugin, {
  ai: {
    autoConfigure: true
  }
});

// Chat models
await app.waitForService('ChatModelRegistry', async chatRegistry => {
  // Get models matching requirements
  const models = chatRegistry.getModelSpecsByRequirements("gpt-5");

  // Get a client
  const client = chatRegistry.getClient("openai:gpt-5");

  // Use the client
  const [text, response] = await client.textChat(
    {
      messages: [
        { role: "user", content: "Hello" }
      ],
      tools: {}
    },
    agent
  );

  console.log(text);
});

// Embedding models
await app.waitForService('EmbeddingModelRegistry', async embeddingRegistry => {
  const client = embeddingRegistry.getClient("openai:text-embedding-3-small");
  const embeddings = await client.getEmbeddings({ input: ["your text here"] });
});

// Image generation
await app.waitForService('ImageGenerationModelRegistry', async imageRegistry => {
  const client = imageRegistry.getClient("openai:gpt-image-1-high");
  const [image, result] = await client.generateImage({
    prompt: "A beautiful sunset over the ocean",
    size: "1024x1024",
    n: 1
  }, agent);
});

// Video generation
await app.waitForService('VideoGenerationModelRegistry', async videoRegistry => {
  const client = videoRegistry.getClient("xai:grok-imagine-video");
  const [video, result] = await client.generateVideo({
    prompt: "A beautiful sunset over the ocean",
    aspectRatio: "16:9",
    duration: 5
  }, agent);
});

// Speech synthesis
await app.waitForService('SpeechModelRegistry', async speechRegistry => {
  const client = speechRegistry.getClient("openai:tts-1");
  const [audio, result] = await client.generateSpeech({
    text: "Hello, world!",
    voice: "alloy",
    speed: 1.0
  }, agent);
});

// Transcription
await app.waitForService('TranscriptionModelRegistry', async transcriptionRegistry => {
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

// Get a client for the custom model
const client = chatRegistry.getClient("CustomProvider:custom-model");
```

#### Using Feature Queries

```typescript
// Get model with specific configuration
const client = chatRegistry.getClient("openai:gpt-5?websearch=1");

// Use the client
const [result, response] = await client.textChat(
  {
    messages: [
      { role: "user", content: "Search the web for the latest AI news" }
    ],
    tools: {}
  },
  agent
);
```

#### Using Feature System

```typescript
// Get model with multiple features
const client = chatRegistry.getClient("openai:gpt-5?websearch=1&reasoningEffort=high");

// Set features on client instance
client.setSettings(new Map([
  ["websearch", true],
  ["reasoningEffort", "high"]
]));

// Get current features
const features = client.getSettings();
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

- `@tokenring-ai/app`: 0.2.0
- `@tokenring-ai/agent`: 0.2.0
- `@tokenring-ai/rpc`: 0.2.0
- `@tokenring-ai/utility`: 0.2.0
- `@tokenring-ai/metrics`: 0.2.0
- `ai`: ^6.0.149
- `zod`: ^4.3.6
- `@ai-sdk/anthropic`: ^3.0.67
- `@ai-sdk/azure`: ^3.0.52
- `@ai-sdk/cerebras`: ^2.0.44
- `@ai-sdk/deepseek`: ^2.0.28
- `@ai-sdk/elevenlabs`: ^2.0.28
- `@ai-sdk/fal`: ^2.0.29
- `@ai-sdk/google`: ^3.0.59
- `@ai-sdk/groq`: ^3.0.34
- `@ai-sdk/openai`: ^3.0.51
- `@ai-sdk/openai-compatible`: ^2.0.40
- `@ai-sdk/open-responses`: ^1.0.10
- `@ai-sdk/provider`: ^3.0.8
- `@ai-sdk/perplexity`: ^3.0.28
- `@ai-sdk/xai`: ^3.0.79
- `@openrouter/ai-sdk-provider`: ^2.4.3
- `ollama-ai-provider-v2`: ^3.5.0

#### Development Dependencies

- `typescript`: ^6.0.2
- `vitest`: ^4.1.1

### RPC Usage Example

```typescript
import { RpcService } from "@tokenring-ai/rpc";

const rpcService = app.requireService(RpcService);

// List all chat models
const chatModels = await rpcService.call("listChatModels", {});

// Get models by provider
const modelsByProvider = await rpcService.call("listChatModelsByProvider", {});

// List video generation models
const videoModels = await rpcService.call("listVideoGenerationModels", {});

// List embedding models
const embeddingModels = await rpcService.call("listEmbeddingModels", {});
```

### Related Components

- **@tokenring-ai/agent**: Agent system that integrates with AI Client services
- **@tokenring-ai/rpc**: RPC service for remote procedure calls
- **@tokenring-ai/app**: Core Token Ring application framework

## License

MIT License - see LICENSE file for details.
