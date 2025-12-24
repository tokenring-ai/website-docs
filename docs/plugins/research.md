# Research Plugin

Research tooling for web-enabled AI research using configurable AI models with web search capabilities.

## Overview

The `@tokenring-ai/research` package provides a research tool that dispatches web-enabled AI model requests to generate detailed research on given topics and prompts. It uses a configurable AI model (like Gemini 2.5 Flash Web Search) to perform comprehensive research with web search capabilities.

## Key Features

- **Web search-backed research**: Uses AI models with web search capabilities
- **Simple interface**: Single function call for research with topic and prompt
- **Token usage logging**: Built-in analytics tracking for research operations
- **Chat integration**: Outputs research results directly to chat
- **Scripting function**: Global `research()` function for programmatic access
- **Service integration**: Integrates with Token Ring agent and AI client systems
- **Error handling**: Comprehensive error handling and validation

## Core Components

### ResearchService

The main service that handles research requests:

```typescript
class ResearchService implements TokenRingService {
  name = "ResearchService";
  description = "Provides Research functionality";
  
  constructor({ researchModel }: ResearchServiceConfig)
  
  async runResearch(topic: string, prompt: string, agent: Agent): Promise<string>
}
```

**Configuration Schema:**
```typescript
const ResearchServiceConfigSchema = z.object({
  researchModel: z.string(), // Required: AI model name for research
});
```

### Research Tool

The `research` tool is automatically registered with chat services and provides:

```typescript
interface ResearchArgs {
  topic: string;      // The main topic or subject to research
  prompt: string;     // Detailed research questions to investigate
}

type ResearchResult = string; // Returns the generated research text directly
```

### Global Scripting Function

When `@tokenring-ai/scripting` is available, the research package registers a global function:

```typescript
research(topic: string, prompt: string): Promise<string>
```

## Usage Examples

### Chat Tool Usage

```typescript
// Using the research tool through chat service
const result = await chatService.executeTool("research", {
  topic: "Large Language Models",
  prompt: "Compare safety techniques and cite recent sources"
});

// Result handling - returns the research text directly
console.log(result); // Contains the generated research
```

### Direct Service Usage

```typescript
import ResearchService from "@tokenring-ai/research";

const researchService = new ResearchService({
  researchModel: "gemini-2.5-flash-web-search"
});

const agent = /* your agent instance */;
const research = await researchService.runResearch(
  "Climate Tech Startups",
  "Summarize funding trends in 2024 and notable companies",
  agent
);

console.log(research); // Contains the generated research text
```

### Scripting Function Usage

```typescript
// Global function signature
const research = await research(
  "Quantum Computing",
  "What are the latest breakthroughs and commercial applications?"
);
```

## Configuration Options

The research package requires configuration through the Token Ring application's config system:

```typescript
// Example configuration
{
  research: {
    researchModel: "gemini-2.5-flash-web-search" // Required: AI model with web search capability
  }
}
```

### Required Configuration:
- `researchModel`: String identifier for the AI model that supports web search (e.g., "gemini-2.5-flash-web-search")

## Integration with Token Ring Ecosystem

### Plugin Integration

The research package automatically integrates with Token Ring applications through its plugin:

```typescript
export default {
  name: "@tokenring-ai/research",
  version: "0.2.0",
  install(app: TokenRingApp) {
    // 1. Register scripting function when ScriptingService is available
    app.services.waitForItemByType(ScriptingService, (scriptingService) => {
      scriptingService.registerFunction("research", {
        type: 'native',
        params: ["topic", "prompt"],
        async execute(this: ScriptingThis, topic: string, prompt: string): Promise<string> {
          return await this.agent.requireServiceByType(ResearchService).runResearch(topic, prompt, this.agent);
        }
      });
    });

    // 2. Register research tool with chat service
    app.waitForService(ChatService, chatService => 
      chatService.addTools(packageJSON.name, tools)
    );

    // 3. Initialize ResearchService when configuration is present
    const config = app.getConfigSlice('research', ResearchServiceConfigSchema.optional());
    if (config) {
      app.addServices(new ResearchService(config));
    }
  }
}
```

### Service Dependencies

The research package requires these services to be available:

1. **ChatModelRegistry** (via agent): For accessing AI models
2. **Agent**: For accessing services and system messages
3. **ChatService** (optional): For status messages and analytics
4. **ScriptingService** (optional): For global function registration

### Agent Integration

```typescript
// Agents can access research service directly
const researchService = agent.requireServiceByType(ResearchService);
const research = await researchService.runResearch(topic, prompt, agent);
```

## API Reference

### ResearchService.runResearch()

```typescript
async runResearch(topic: string, prompt: string, agent: Agent): Promise<string>
```

**Parameters:**
- `topic` (string): The main topic or subject to research
- `prompt` (string): Detailed research questions or specific aspects to investigate
- `agent` (Agent): The current agent instance for service access

**Returns:**
- `Promise<string>`: Generated research content

**Process:**
1. Retrieves AI client from model registry using configured research model
2. Sends system message indicating research dispatch
3. Executes research using AI chat with web search capability
4. Logs completion and outputs research to chat
5. Records analytics data
6. Returns generated research text

## Dependencies

- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/agent`: Core agent system
- `@tokenring-ai/ai-client`: AI client and model registry
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/scripting`: Scripting service (optional)
- `zod@^4.0.17`: Schema validation

## Development

### Package Structure

- `index.ts` - Package exports
- `plugin.ts` - Plugin integration logic
- `ResearchService.ts` - Core service implementation
- `tools.ts` - Tool exports
- `tools/research.ts` - Tool implementation and schemas
- `package.json` - Package configuration
- `README.md` - Comprehensive package documentation

### Dependencies

```json
{
  "dependencies": {
    "@tokenring-ai/app": "0.2.0",
    "@tokenring-ai/ai-client": "0.2.0",
    "@tokenring-ai/chat": "0.2.0",
    "@tokenring-ai/agent": "0.2.0",
    "@tokenring-ai/scripting": "0.2.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```

### Testing

The package includes Vitest configuration for testing:

```typescript
// vitest.config.ts
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Error Handling

The research package provides comprehensive error handling:

1. **Input Validation**: Zod schemas validate all inputs before execution
2. **Service Dependencies**: Graceful handling when required services aren't available
3. **Model Access**: Proper error handling when AI models are unavailable
4. **Execution Errors**: Catch and report errors during research generation
5. **Timeout Handling**: Proper timeout management through agent configuration

## Performance Considerations

- **Model Selection**: Uses model registry to find first available research model
- **Async Operations**: All research operations are properly asynchronous
- **Resource Cleanup**: Proper cleanup of AI client resources
- **Analytics**: Built-in analytics collection without performance impact

## License

MIT (see LICENSE file)