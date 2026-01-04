# Research Plugin

## Overview

The Research Plugin provides AI-powered research capabilities through web-search-enabled models. It integrates seamlessly with the Token Ring agent, chat, and AI client systems to dispatch research requests and return comprehensive results.

Key capabilities include:
- Dispatching research requests to web-search-capable AI models (e.g., Gemini 2.5 Flash Web Search)
- Type-safe input validation using Zod schemas
- Integration with Token Ring chat services for real-time status updates and analytics
- Support for both tool-based and direct API access
- Global scripting function registration for programmatic usage
- Comprehensive error handling and input validation

## Key Features

- AI-Powered Research: Generates comprehensive research using web-search-enabled models
- Type-Safe APIs: Strongly-typed parameters and results with Zod validation
- Deep Service Integration: Works with Token Ring agent, chat, and AI client services
- Automatic Tool Registration: Registers research tool with chat services
- Scripting Support: Global function registration for scripting environments
- Analytics Integration: Built-in token usage logging and chat analytics
- Error Handling: Comprehensive validation and error management

## Core Components

### ResearchService

The main service that handles research requests:

```typescript
export default class ResearchService implements TokenRingService {
  name = "ResearchService";
  description = "Provides Research functionality";
  researchModel: string;

  constructor({ researchModel }: ResearchServiceConfig) {
    this.researchModel = researchModel;
  }

  async runResearch(topic: string, prompt: string, agent: Agent): Promise<string> {
    // Implementation details...
  }
}
```

**Methods:**
- `runResearch(topic, prompt, agent)`: Executes research and returns comprehensive research text

### Research Tool

The research tool is automatically registered with chat services and provides:

```typescript
interface ResearchArgs {
  topic: string;      // The main topic or subject to research
  prompt: string;     // Detailed research questions to investigate
}

export interface ResearchSuccessResult {
  status: "completed";
  topic: string;
  research: string;
  message: string;
}

export interface ResearchErrorResult {
  status: "error";
  topic: string;
  error: string;
  message: string;
}

export type ResearchResult = ResearchSuccessResult | ResearchErrorResult;
```

## API Reference

### ResearchService.runResearch()

```typescript
async runResearch(topic: string, prompt: string, agent: Agent): Promise<string>
```

**Parameters:**
- `topic` (string): The main topic or subject to research
- `prompt` (string): Detailed research questions to investigate
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

### Research Tool Execute

```typescript
async function execute(
  {topic, prompt}: z.infer<typeof inputSchema>,
  agent: Agent
): Promise<ResearchResult>
```

**Input Schema:**
```typescript
const inputSchema = z.object({
  topic: z.string().describe("The main topic or subject to research"),
  prompt: z.string().describe("The detailed research prompt or specific questions to investigate about the topic")
});
```

**Error Handling:**
- Validates that `topic` is provided
- Validates that `prompt` is provided
- Throws descriptive errors for missing parameters
- Returns error result object on execution failures

## Configuration

The research plugin requires configuration through the Token Ring application's config system:

```typescript
// Example configuration
{
  research: {
    researchModel: "gemini-2.5-flash-web-search" // Required: AI model name
  }
}
```

### Configuration Schema

```typescript
const ResearchServiceConfigSchema = z.object({
  researchModel: z.string(), // Required: Name of the AI model for research
});
```

**Required Configuration:**
- `researchModel`: String identifier for the AI model that supports web search (e.g., "gemini-2.5-flash-web-search")

## Usage Examples

### Basic Tool Usage

```typescript
// Using the research tool through chat service
const result = await chatService.executeTool("research", {
  topic: "Large Language Models",
  prompt: "Compare safety techniques and cite recent sources"
});

// Result handling
if (result.status === "completed") {
  console.log(result.research);
} else {
  console.error(result.error);
}
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

console.log(research);
```

### Scripting Function

When `@tokenring-ai/scripting` is available, the research package registers a global function:

```javascript
// Global function signature
research(topic: string, prompt: string): Promise<string>

// Usage in scripting context
const research = await research(
  "Quantum Computing",
  "What are the latest breakthroughs and commercial applications?"
);
```

## Integration

### Agent Integration

```typescript
// Agents can access research service directly
const researchService = agent.requireServiceByType(ResearchService);
const research = await researchService.runResearch(topic, prompt, agent);
```

### Chat Service Integration

```typescript
// Automatic tool registration
chatService.addTools("@tokenring-ai/research", { research });

// Tool execution through chat
const result = await chatService.executeTool("research", { topic, prompt });
```

### Scripting Integration

```typescript
// Global function registration (when scripting available)
scriptingService.registerFunction("research", {
  type: 'native',
  params: ["topic", "prompt"],
  async execute(/* ... */)
});
```

### Plugin Integration

The research package automatically integrates with Token Ring applications through its plugin:

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { ScriptingService } from "@tokenring-ai/scripting";
import { ScriptingThis } from "@tokenring-ai/scripting/ScriptingService";
import { z } from "zod";
import packageJSON from './package.json' with { type: 'json' };
import ResearchService, { ResearchServiceConfigSchema } from "./ResearchService.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object({
  research: ResearchServiceConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.services.waitForItemByType(ScriptingService, (scriptingService: ScriptingService) => {
      scriptingService.registerFunction("research", {
          type: 'native',
          params: ["topic", "prompt"],
          async execute(this: ScriptingThis, topic: string, prompt: string): Promise<string> {
            return await this.agent.requireServiceByType(ResearchService).runResearch(topic, prompt, this.agent);
          }
        }
      );
    });
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
    if (config.research) {
      app.addServices(new ResearchService(config.research));
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Service Dependencies

The research package requires these services to be available:

1. **ChatModelRegistry** (via agent): For accessing AI models
2. **Agent**: For accessing services and system messages
3. **ChatService** (optional): For status messages and analytics
4. **ScriptingService** (optional): For global function registration

## Best Practices

### Error Handling

The research plugin provides comprehensive error handling:
- Input validation via Zod schemas
- Graceful handling when required services are unavailable
- Proper error handling for AI model access failures
- Execution errors during research generation
- Timeout handling through agent configuration

### Performance Considerations

- Model selection from registry to find available research model
- Async operations for non-blocking execution
- Resource cleanup for AI clients
- Analytics collection without performance impact

### Recommended Patterns

- Use web-search-capable models (e.g., Gemini 2.5 Flash Web Search)
- Provide specific, detailed prompts for better research results
- Handle both success and error result types in your code
- Consider implementing retry logic for transient failures

## Development

### Package Structure

- `index.ts` - Package exports
- `plugin.ts` - Plugin integration logic
- `ResearchService.ts` - Core service implementation
- `tools.ts` - Tool exports
- `tools/research.ts` - Tool implementation and schemas
- `package.json` - Package configuration

### Testing

The package includes Vitest configuration for testing:

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Related Components

- **@tokenring-ai/ai-client**: Provides AI model registry and chat capabilities
- **@tokenring-ai/chat**: Manages chat services and tool registration
- **@tokenring-ai/scripting**: Enables scripting function registration
- **@tokenring-ai/agent**: Provides agent context and service access

## License

MIT License - See LICENSE file for details.
