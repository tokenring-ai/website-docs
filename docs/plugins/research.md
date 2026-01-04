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
export default class ResearchService implements TokenRingService &#123;
  name = "ResearchService";
  description = "Provides Research functionality";
  researchModel: string;

  constructor(&#123; researchModel &#125;: ResearchServiceConfig) &#123;
    this.researchModel = researchModel;
  &#125;

  async runResearch(topic: string, prompt: string, agent: Agent): Promise&lt;string&gt; &#123;
    // Implementation details...
  &#125;
&#125;
```

**Methods:**
- `runResearch(topic, prompt, agent)`: Executes research and returns comprehensive research text

### Research Tool

The research tool is automatically registered with chat services and provides:

```typescript
interface ResearchArgs &#123;
  topic: string;      // The main topic or subject to research
  prompt: string;     // Detailed research questions to investigate
&#125;

export interface ResearchSuccessResult &#123;
  status: "completed";
  topic: string;
  research: string;
  message: string;
&#125;

export interface ResearchErrorResult &#123;
  status: "error";
  topic: string;
  error: string;
  message: string;
&#125;

export type ResearchResult = ResearchSuccessResult | ResearchErrorResult;
```

## API Reference

### ResearchService.runResearch()

```typescript
async runResearch(topic: string, prompt: string, agent: Agent): Promise&lt;string&gt;
```

**Parameters:**
- `topic` (string): The main topic or subject to research
- `prompt` (string): Detailed research questions to investigate
- `agent` (Agent): The current agent instance for service access

**Returns:**
- `Promise&lt;string&gt;`: Generated research content

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
  &#123;topic, prompt&#125;: z.infer&lt;typeof inputSchema&gt;,
  agent: Agent
): Promise&lt;ResearchResult&gt;
```

**Input Schema:**
```typescript
const inputSchema = z.object(&#123;
  topic: z.string().describe("The main topic or subject to research"),
  prompt: z.string().describe("The detailed research prompt or specific questions to investigate about the topic")
&#125;);
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
&#123;
  research: &#123;
    researchModel: "gemini-2.5-flash-web-search" // Required: AI model name
  &#125;
&#125;
```

### Configuration Schema

```typescript
const ResearchServiceConfigSchema = z.object(&#123;
  researchModel: z.string(), // Required: Name of the AI model for research
&#125;);
```

**Required Configuration:**
- `researchModel`: String identifier for the AI model that supports web search (e.g., "gemini-2.5-flash-web-search")

## Usage Examples

### Basic Tool Usage

```typescript
// Using the research tool through chat service
const result = await chatService.executeTool("research", &#123;
  topic: "Large Language Models",
  prompt: "Compare safety techniques and cite recent sources"
&#125;);

// Result handling
if (result.status === "completed") &#123;
  console.log(result.research);
&#125; else &#123;
  console.error(result.error);
&#125;
```

### Direct Service Usage

```typescript
import ResearchService from "@tokenring-ai/research";

const researchService = new ResearchService(&#123;
  researchModel: "gemini-2.5-flash-web-search"
&#125;);

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
research(topic: string, prompt: string): Promise&lt;string&gt;

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
chatService.addTools("@tokenring-ai/research", &#123; research &#125;);

// Tool execution through chat
const result = await chatService.executeTool("research", &#123; topic, prompt &#125;);
```

### Scripting Integration

```typescript
// Global function registration (when scripting available)
scriptingService.registerFunction("research", &#123;
  type: 'native',
  params: ["topic", "prompt"],
  async execute(/* ... */)
&#125;);
```

### Plugin Integration

The research package automatically integrates with Token Ring applications through its plugin:

```typescript
import &#123; TokenRingPlugin &#125; from "@tokenring-ai/app";
import &#123; ChatService &#125; from "@tokenring-ai/chat";
import &#123; ScriptingService &#125; from "@tokenring-ai/scripting";
import &#123; ScriptingThis &#125; from "@tokenring-ai/scripting/ScriptingService";
import &#123; z &#125; from "zod";
import packageJSON from './package.json' with &#123; type: 'json' &#125;;
import ResearchService, &#123; ResearchServiceConfigSchema &#125; from "./ResearchService.ts";
import tools from "./tools.ts";

const packageConfigSchema = z.object(&#123;
  research: ResearchServiceConfigSchema.optional()
&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    app.services.waitForItemByType(ScriptingService, (scriptingService: ScriptingService) =&gt; &#123;
      scriptingService.registerFunction("research", &#123;
          type: 'native',
          params: ["topic", "prompt"],
          async execute(this: ScriptingThis, topic: string, prompt: string): Promise&lt;string&gt; &#123;
            return await this.agent.requireServiceByType(ResearchService).runResearch(topic, prompt, this.agent);
          &#125;
        &#125;
      );
    &#125;);
    app.waitForService(ChatService, chatService =&gt;
      chatService.addTools(packageJSON.name, tools)
    );
    if (config.research) &#123;
      app.addServices(new ResearchService(config.research));
    &#125;
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
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
