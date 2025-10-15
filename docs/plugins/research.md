# Research Plugin

Research tooling for web-enabled AI research using Gemini models with web search capabilities.

## Overview

The `@tokenring-ai/research` package provides research tooling for the Token Ring ecosystem. It exposes a research tool that dispatches web-enabled AI model requests (Gemini 2.5 Flash Web Search) to generate research on given topics and prompts.

## Key Features

- Web search-backed research via Gemini models
- Strongly-typed parameters and results
- Token usage logging
- Cost estimation
- Integration with AI Model Registry

## Core Components

### Tools

**research**: Dispatches research request to AI agent
- Input: `{ topic: string, prompt: string }`
- Returns: Generated research content with status
- Uses Gemini 2.5 Flash Web Search model

**Result Types:**
- Success: `{ status: 'completed', topic: string, research: string, message: string }`
- Error: `{ status: 'error', topic: string, error: string, message: string }`

## Global Scripting Functions

When `@tokenring-ai/scripting` is available:

- **getResearchModel()**: Gets the configured research model name
  ```bash
  /var $model = getResearchModel()
  /echo Using research model: $model
  ```

## Usage Example

```typescript
import { execute as researchExecute } from '@tokenring-ai/research/tools/research';

// Via tool
const result = await agent.executeTool('research', {
  topic: 'Large Language Models',
  prompt: 'Compare safety techniques and cite recent sources'
});

if (result.status === 'completed') {
  console.log(result.research);
}

// Direct API usage
const result = await researchExecute({
  topic: 'Climate Tech Startups',
  prompt: 'Summarize funding trends in 2024 and notable companies'
}, agent);
```

## Configuration Options

- **Model**: Uses Gemini 2.5 Flash Web Search by default
- **Token Limits**: Configured via AI model settings
- **Temperature**: Controlled by AI configuration

## Requirements

- Chat service registered in the Registry
- ModelRegistry service with Gemini model supporting web search
- Appropriate credentials for Gemini provider

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/ai-client@0.1.0`: AI model integration
- `@tokenring-ai/scripting@0.1.0`: Optional, for global functions

## Notes

- Requires Gemini model with web search capability
- Token usage data logged when available
- Status messages appear in interactive sessions
- Research results include web-sourced information
