# AI Client Plugin

Unified AI client for chat, embeddings, and images via Vercel AI SDK, with model registry and request builders.

## Overview

The `@tokenring-ai/ai-client` package provides a unified interface for interacting with various AI providers (e.g., OpenAI, Anthropic, Google, Groq) using the Vercel AI SDK. It supports chat completions (including streaming), embeddings, and image generation, integrating seamlessly with the `@tokenring-ai/agent` framework.

## Key Features

- **Model Registry**: Automatically selects and routes requests to appropriate models based on requirements (context length, cost, capabilities)
- **Multi-Provider Support**: Pre-configured specs for OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, and more
- **Request Building**: Constructs chat requests with system prompts, prior messages, tools, and memories
- **Chat Management**: Handles conversation history, streaming responses, and cost/timing calculations
- **Error Handling**: Includes retries, availability checks, and abort signals

## Supported Providers

- OpenAI (GPT-3.5, GPT-4, GPT-4o series)
- Anthropic (Claude 3 series)
- Google (Gemini models)
- Groq
- Cerebras
- DeepSeek
- Azure OpenAI
- Perplexity
- XAI
- OpenRouter
- Ollama
- Qwen

## Core Components

### ModelRegistry

Central service for managing AI models with chat, embedding, and image generation registries.

**Key Methods:**
- `initializeModels(providers, config)`: Registers providers with API keys and display names
- `chat.getFirstOnlineClient(requirements)`: Selects the cheapest online model matching criteria
- `getAllModelsWithOnlineStatus()`: Lists all models with availability status

### AIChatClient

Handles chat interactions using AI SDK's `streamText`, `generateText`, `generateObject`.

**Key Methods:**
- `streamChat(request, agent)`: Streams response, relays deltas to Agent
- `textChat(request, agent)`: Non-streaming text generation
- `generateObject(request, agent)`: Structured output via Zod schema
- `calculateCost(usage)`: Computes USD cost based on tokens
- `calculateTiming(elapsedMs, usage)`: Tokens/sec and totals

### AIService

Manages AI state in Agent.

**Key Methods:**
- `getAIConfig(agent)`: Returns AI configuration
- `updateAIConfig(partial, agent)`: Updates config
- `pushChatMessage(message, agent)`: Adds to history
- `getCurrentMessage(agent)`: Latest message
- `clearChatMessages(agent)`: Reset history

## Usage Example

```typescript
import Agent from '@tokenring-ai/agent/Agent';
import ModelRegistry from '@tokenring-ai/ai-client/ModelRegistry';
import { init as initOpenAI } from '@tokenring-ai/ai-client/models/openai';
import runChat from '@tokenring-ai/ai-client/runChat';

const agent = new Agent({
  ai: { systemPrompt: 'You are a helpful assistant.', temperature: 0.7 }
});

const modelRegistry = new ModelRegistry();
await modelRegistry.initializeModels(
  { openai: { init: initOpenAI } },
  { openai: { providerDisplayName: 'OpenAI', apiKey: process.env.OPENAI_API_KEY } }
);
agent.addService(modelRegistry);

const [output, response] = await runChat(
  { input: 'Hello, world!', model: 'gpt-4o-mini' },
  agent
);
console.log(output);
console.log(response.cost);
```

## Configuration Options

- **Provider Config**: `{ apiKey: string, providerDisplayName: string }` per provider
- **AIConfig**: `systemPrompt`, `forceModel`, `temperature`, `maxTokens`, `topP`, `stopSequences`
- **Model Requirements**: Filter with `{ provider?, contextLength?, reasoningText? }`

## Dependencies

- `ai@^5.0.15` (Vercel AI SDK)
- `@tokenring-ai/agent@0.1.0`
- Provider SDKs: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, etc.
- `zod@^4.0.17` (schemas)
- `axios@^1.11.0` (API calls)
