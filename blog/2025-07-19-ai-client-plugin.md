---
slug: ai-client-plugin
title: AI Client Plugin - Multi-Provider AI Integration
authors: [mdierolf]
tags: [tokenring, plugins, ai, announcement]
---

# AI Client Plugin - Multi-Provider AI Integration

The AI Client plugin brings unified multi-provider AI integration to TokenRing Coder, supporting OpenAI, Anthropic, Google, Groq, and more.

<!-- truncate -->

## Key Features

### 🔄 Model Registry
Automatically selects and routes requests to appropriate models based on requirements like context length, cost, and capabilities. No more manual model selection.

### 🌐 Multi-Provider Support
Pre-configured specs for major AI providers:
- OpenAI (GPT-3.5, GPT-4, GPT-4o series)
- Anthropic (Claude 3 series)
- Google (Gemini models)
- Groq, Cerebras, DeepSeek
- Azure OpenAI, Perplexity, XAI, OpenRouter, Ollama, Qwen

### 💬 Chat Management
Handles conversation history, streaming responses, and cost/timing calculations. Track token usage and optimize spending.

### 🛠️ Request Building
Constructs chat requests with system prompts, prior messages, tools, and memories. Seamless integration with the agent framework.

## Usage

```typescript
import ModelRegistry from '@tokenring-ai/ai-client/ModelRegistry';
import { init as initOpenAI } from '@tokenring-ai/ai-client/models/openai';

const modelRegistry = new ModelRegistry();
await modelRegistry.initializeModels(
  { openai: { init: initOpenAI } },
  { openai: { apiKey: process.env.OPENAI_API_KEY } }
);

const [output, response] = await runChat(
  { input: 'Hello, world!', model: 'gpt-4o-mini' },
  agent
);
```

## No Vendor Lock-In

Switch between providers seamlessly. Use the cheapest model for simple tasks, and powerful models for complex reasoning.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
