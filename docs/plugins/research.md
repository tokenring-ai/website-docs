# @tokenring-ai/research

The `@tokenring-ai/research` package provides AI-powered research capabilities for the Token Ring ecosystem. It enables agents to conduct comprehensive research on any topic using web search-enabled AI models, generating detailed research content that can be used for decision-making, content creation, or information gathering.

## Overview

The research package integrates seamlessly with the Token Ring agent framework, providing both tool-based interactions and scripting functions for programmatic research. It leverages AI models with web search capabilities to gather and synthesize information from multiple sources.

### Key Features

- **AI-Powered Research**: Uses web search-enabled AI models to conduct comprehensive research
- **Tool-Based Integration**: Available as a tool in the TokenRing chat system
- **Scripting Support**: Provides a global `research` function for programmatic usage
- **Artifact Output**: Automatically generates artifacts with research results
- **Analytics Tracking**: Provides detailed analytics on research execution
- **Type-Safe API**: Full TypeScript support with proper type definitions

## Package Structure

```
pkg/research/
├── index.ts                         # Package entry point
├── ResearchService.ts               # Core research service
├── plugin.ts                        # Plugin registration
├── tools.ts                         # Tool exports
├── tools/
│   └── research.ts                  # Research tool implementation
├── package.json                     # Package metadata
└── vitest.config.ts                 # Test configuration
```

## Installation

```bash
bun install @tokenring-ai/research
```

## Core Components

### ResearchService

The main service class that implements research operations. It manages research requests using configured AI models with web search capabilities.

**Service Properties:**

- `name`: "ResearchService" - Service identifier
- `description`: "Provides Research functionality" - Service description
- `researchModel`: string - The AI model name configured for research (must support web search)

**Configuration Schema:**

```typescript
interface ResearchServiceConfig {
  researchModel: string;  // Required: AI model name that supports web search
}
```

### Research Tool

A tool available in the TokenRing chat system for interactive research.

**Tool Definition:**

```typescript
{
  name: "research_run",
  displayName: "Research/research",
  description: "Dispatches a research request to an AI agent, and returns the generated research content.",
  inputSchema: {
    topic: string,     // The main topic or subject to research
    prompt: string     // The detailed research prompt or specific questions
  }
}
```

### Scripting Function

A global function available in scripting contexts for programmatic research.

```typescript
research(topic: string, prompt: string): Promise<string>
```

## Usage Examples

### Basic Usage with Tool

```typescript
import { Agent } from "@tokenring-ai/agent";

const agent = new Agent();
const researchService = agent.requireServiceByType(ResearchService);

// Execute research using the tool
await agent.callTool('research_run', {
  topic: 'Quantum Computing',
  prompt: 'What are the latest breakthroughs and commercial applications?'
});
```

### Scripting Function Usage

```typescript
import scriptingService from "@tokenring-ai/scripting";

// Register research function (handled automatically by plugin)
const research = await research(
  'Artificial Intelligence',
  'What are the current trends in AI development?'
);

console.log(research);
```

### Programmatic Research

```typescript
import researchService from "@tokenring-ai/research";

// Execute research programmatically
const research = await researchService.runResearch(
  'Machine Learning',
  'Explain the latest advances in transformer models',
  agent
);

console.log('Research results:', research);
```

### Managing Multiple Research Models

```typescript
import app from "@tokenring-ai/app";
import researchPlugin from "@tokenring-ai/research";

const appInstance = new app.App();

// Configure multiple research plugins with different models
appInstance.addPlugin(researchPlugin, {
  name: 'research-fast',
  research: {
    researchModel: 'gemini-2.0-flash-exp'
  }
});

appInstance.addPlugin(researchPlugin, {
  name: 'research-deep',
  research: {
    researchModel: 'gemini-2.5-flash-web-search'
  }
});
```

### Integration with Application Framework

```typescript
import app from "@tokenring-ai/app";
import researchPlugin from "@tokenring-ai/research";

const appInstance = new app.App();

appInstance.addPlugin(researchPlugin, {
  research: {
    researchModel: "gemini-2.5-flash-web-search"
  }
});
```

## Configuration

### Plugin Configuration

The research package supports configuration through the Token Ring application config system:

```typescript
const ResearchServiceConfigSchema = z.object({
  researchModel: z.string(),
});
```

**Configuration Example:**

```typescript
const pluginConfig = {
  research: {
    researchModel: "gemini-2.5-flash-web-search"  // Required: AI model name that supports web search
  }
};
```

### Model Selection

Choose a research model that supports web search capabilities. Examples:

- `gemini-2.5-flash-web-search` - Recommended for comprehensive research
- `gemini-2.0-flash-exp` - Faster, experimental model
- Other models with web search capabilities supported by your AI client

### Plugin Registration

```typescript
import researchPlugin from "@tokenring-ai/research";
import app from "@tokenring-ai/app";

const appInstance = new app.App();

appInstance.addPlugin(researchPlugin, {
  research: {
    researchModel: "gemini-2.5-flash-web-search"
  }
});
```

## API Reference

### ResearchService Methods

#### `runResearch(topic: string, prompt: string, agent: Agent): Promise<string>`

Executes research using the configured AI model and returns comprehensive research text.

**Parameters:**

- `topic`: string - The main topic or subject to research
- `prompt`: string - The detailed research prompt or specific questions to investigate about the topic
- `agent`: Agent - The agent instance to use for execution

**Returns:**

- `Promise<string>` - Research content as a string

**Implementation Details:**

- Retrieves the configured research model from the agent's ChatModelRegistry
- Sends a system message instructing the AI to research the topic using web search
- Returns detailed research content as a string
- Generates artifact output with the research results
- Provides analytics on the research execution

**Example:**

```typescript
const research = await researchService.runResearch(
  'Artificial Intelligence',
  'What are the current trends in AI development?',
  agent
);

console.log(research);
```

### Tool Results

The `research_run` tool returns JSON results with the following structure:

```typescript
interface ResearchSuccessResult {
  status: "completed";
  topic: string;
  research: string;
  message: string;
}

interface ResearchErrorResult {
  status: "error";
  topic: string;
  error: string;
  message: string;
}

type ResearchResult = ResearchSuccessResult | ResearchErrorResult;
```

### Scripting Function

#### `research(topic: string, prompt: string): Promise<string>`

Executes research programmatically through the scripting system.

**Parameters:**

- `topic`: string - The main topic or subject to research
- `prompt`: string - The detailed research prompt or specific questions to investigate

**Returns:**

- `Promise<string>` - Research content as a string

**Example:**

```typescript
const research = await research(
  "Quantum Computing",
  "What are the latest breakthroughs and commercial applications?"
);
```

## Integration

### With Agent System

The plugin integrates with the agent system through several mechanisms:

**Tool Registration:**

Tools are registered through the plugin's install method:

```typescript
app.waitForService(ChatService, chatService => {
  chatService.addTools(tools);
});
```

**Scripting Function Registration:**

```typescript
app.services.waitForItemByType(ScriptingService, (scriptingService: ScriptingService) => {
  scriptingService.registerFunction("research", {
    type: 'native',
    params: ["topic", "prompt"],
    async execute(this: ScriptingThis, topic: string, prompt: string): Promise<string> {
      return await this.agent.requireServiceByType(ResearchService).runResearch(topic, prompt, this.agent);
    }
  });
});
```

### With FileSystemService

The ResearchService uses the agent's FileSystemService indirectly through artifact output capabilities. Research results are automatically saved as artifacts for easy access.

### With AI Client

The plugin integrates with the AI client system through the ChatModelRegistry, which retrieves the configured research model and handles the actual research operations.

## Result Types

### Success Result

```typescript
{
  status: "completed",
  topic: string,
  research: string,
  message: string
}
```

### Error Result

```typescript
{
  status: "error",
  topic: string,
  error: string,
  message: string
}
```

## Artifacts

Research results are automatically generated as artifacts with the following properties:

- **name**: `Research on {topic}`
- **encoding**: `text`
- **mimeType**: `text/markdown`
- **body**: Contains the topic, prompt, and research result

**Artifact Structure:**

```
Topic: {topic}
Prompt: {prompt}

Result: {research}
```

## Dependencies

The research package depends on the following packages:

- `@tokenring-ai/app` - Base application framework and plugin system
- `@tokenring-ai/agent` - Agent-based orchestration
- `@tokenring-ai/ai-client` - AI model registry and client
- `@tokenring-ai/chat` - Chat service and context handling
- `@tokenring-ai/scripting` - Scripting functions and execution
- `zod` - Runtime type validation and schema definition

## Best Practices

### Model Selection

- Choose a research model that supports web search capabilities (e.g., "gemini-2.5-flash-web-search")
- For faster results, consider using experimental models like "gemini-2.0-flash-exp"
- For comprehensive results, use models specifically designed for research tasks

### Topic Clarity

- Provide clear, specific topics for the best research results
- Use detailed prompts to guide the research toward relevant information
- Break down complex topics into smaller, more focused research queries

### Error Handling

- Handle potential errors from the AI model or network issues gracefully
- Check the status field in tool results to determine success or failure
- Use try-catch blocks when using the scripting function

### Performance Optimization

- Use multiple research plugins with different models for different use cases
- Cache research results when applicable to reduce API calls
- Monitor analytics provided by the agent's chat service to optimize performance

### Tool Usage

- Use tools (`research_run`) instead of direct service calls for better integration
- Leverage artifact output for easy access to research results
- Use the scripting function for programmatic research in scripts and workflows

## State Management

The ResearchService does not maintain persistent state. Each research request is processed independently and returns a result without storing intermediate state. Research results are returned directly to the caller and are not persisted beyond the request lifecycle.

## Testing

### Running Tests

```bash
bun test
```

### Test Coverage

The package includes comprehensive unit tests for:

- Service configuration and initialization
- Research execution
- Tool functionality
- Error handling
- Integration with agent system

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Development

### Build Instructions

```bash
bun run build
```

### Package Version

Current version: `0.2.0`

## Related Components

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/agent`: Agent-based orchestration and state management
- `@tokenring-ai/ai-client`: AI model registry and client for model management
- `@tokenring-ai/chat`: Chat service and context handling
- `@tokenring-ai/scripting`: Scripting functions and execution engine

## License

MIT License - see the root LICENSE file for details.
