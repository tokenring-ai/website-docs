# @tokenring-ai/research

**Version:** 0.2.0

Research Tools - LLM-driven tools for systematic data gathering and deep analysis. This package enables agents to conduct comprehensive research on any topic using web search-enabled AI models, generating detailed research content with strict adherence to factual accuracy and source citation.

## User Guide

### Overview

The research package integrates seamlessly with the Token Ring agent framework,
providing both tool-based interactions and scripting functions for programmatic
research. It leverages AI models with web search capabilities to gather and
synthesize information from multiple sources while maintaining strict guidelines
against hallucination and speculation.

### Key Features

- **AI-Powered Research**: Uses web search-enabled AI models to conduct
  comprehensive research
- **Tool-Based Integration**: Available as the `research_run` tool in the
  TokenRing chat system
- **Scripting Support**: Provides a global `research` function for programmatic
  usage
- **Artifact Output**: Automatically generates markdown artifacts with research
  results
- **Analytics Tracking**: Provides detailed analytics on research execution
- **Strict Factual Accuracy**: Enforces verbatim extraction, source citation,
  and zero tolerance for hallucination
- **Type-Safe API**: Full TypeScript support with proper type definitions

### Tools

| Tool           | Description                                                    |
|----------------|----------------------------------------------------------------|
| `research_run` | Dispatches a research request to an AI agent, and returns the  |
|                | generated research content.                                    |

#### research_run

Dispatches a research request to an AI agent, and returns the generated
research content.

**Input Parameters:**

| Parameter | Type   | Required | Description                                           |
|-----------|--------|----------|-------------------------------------------------------|
| `topic`   | string | Yes      | The main topic or subject to research                 |
| `prompt`  | string | Yes      | The detailed research prompt or specific questions to |
|           |        |          | investigate about the topic                           |

**Return Type:**

The tool returns a `TokenRingToolResult` with:

| Field     | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| `summary` | string | Short summary of the research completion     |
| `result`  | string | JSON string containing the research result   |

The `result` field is a JSON string with the following structure:

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

**Result Schema:**

The research tool returns results with the following structure:

| Field     | Type   | Description                                          |
|-----------|--------|------------------------------------------------------|
| `status`  | string | `"completed"` for success, `"error"` for failure     |
| `topic`   | string | The topic that was researched                        |
| `research`| string | The generated research content (success only)        |
| `error`   | string | Error message (error only)                           |
| `message` | string | Human-readable status message                        |

**Error Handling:**

The tool throws `ToolCallError` when:

- Topic is missing or empty
- Prompt is missing or empty
- The research service fails to execute

**Features:**

- Uses configured research model with web search capabilities
- Generates comprehensive research content with strict factual accuracy
- Creates artifact output for research results in markdown format
- Provides detailed analytics on research execution
- Enforces source citation and verbatim extraction from reliable sources

### Scripting Functions

The plugin registers a global `research` function available in scripting
contexts for programmatic research operations.

**Function Signature:**

```typescript
research(topic: string, prompt: string): Promise<string>
```

**Parameters:**

| Parameter | Type   | Required | Description                                         |
|-----------|--------|----------|-----------------------------------------------------|
| `topic`   | string | Yes      | The main topic or subject to research               |
| `prompt`  | string | Yes      | The detailed research prompt or specific questions  |

**Returns:**

- `Promise<string>` - Research content as a string

**Example:**

```javascript
// In a script context
const result = await research(
  "Machine Learning",
  "Explain the latest advances in transformer models"
);
console.log(result);
```

### Configuration

The research package supports configuration through the Token Ring application
config system. The package defines a nested `research` configuration key.

**Configuration Options:**

| Option          | Type   | Default            | Description                                            |
|-----------------|--------|--------------------|--------------------------------------------------------|
| `researchModel` | string | `"auto?websearch"` | The AI model name for research (must support web search)|

**Configuration Example:**

```yaml
research:
  researchModel: "auto?websearch"
```

Or with a specific model:

```yaml
research:
  researchModel: "gemini-2.5-flash-web-search"
```

### Best Practices

#### Model Selection

- **Choose a research model that supports web search capabilities** (e.g.,
  `"auto?websearch"` or `"gemini-2.5-flash-web-search"`)
- For faster results, consider using experimental models
- For comprehensive results, use models specifically designed for research
  tasks

#### Topic Clarity

- **Provide clear, specific topics** for the best research results
- Use detailed prompts to guide the research toward relevant information
- Break down complex topics into smaller, more focused research queries

#### Error Handling

- **Handle potential errors** from the AI model or network issues gracefully
- Check the status field in tool results to determine success or failure
- Use try-catch blocks when using the scripting function

#### Tool Usage

- **Use tools (`research_run`)** instead of direct service calls for better
  integration
- Leverage artifact output for easy access to research results
- Use the scripting function for programmatic research in scripts and workflows

#### Source Verification

- Trust the strict guidelines that prevent hallucination and speculation
- The research AI is configured to verify sources and cite them appropriately
- Every claim will be accompanied by specific URLs or named sources

### System Instructions

The research AI follows strict guidelines:

1. **Verbatim Extraction**: Extracts relevant text verbatim from sources. Do
   not paraphrase key data points.
2. **Source Citation**: Every claim must be accompanied by a specific URL or
   named reputable source. If you cannot cite it, you cannot include it.
3. **Zero Tolerance for Hallucination**: If multiple reliable sources do not
   explicitly confirm the user's premise, state: "The information could not be
   found and the premise of the request may be incorrect." Never attempt to
   fill in gaps with plausible-sounding information.
4. **Conflicting Data**: If reputable sources provide conflicting information,
   report both perspectives verbatim and note the discrepancy.
5. **No Speculation**: Do not offer opinions, future predictions, or creative
   interpretations. Return only what is explicitly documented in the search
   results.

## Developer Reference

### Core Components

#### ResearchService

The main service class that implements `TokenRingService` and manages research
operations using configured AI models with web search capabilities.

**Service Properties:**

- `name`: `"ResearchService"` - Service identifier
- `description`: `"Provides Research functionality"` - Service description

**Constructor:**

```typescript
constructor(options: ResearchServiceConfig)
```

**Constructor Parameters:**

| Parameter | Type                    | Description                                            |
|-----------|-------------------------|--------------------------------------------------------|
| `options` | `ResearchServiceConfig` | Configuration object containing research model settings|

**Methods:**

```typescript
async runResearch(
  topic: string,
  prompt: string,
  agent: Agent
): Promise<string>
```

**Method Parameters:**

| Parameter | Type   | Description                                               |
|-----------|--------|-----------------------------------------------------------|
| `topic`   | string | The main topic or subject to research                     |
| `prompt`  | string | The detailed research prompt or specific questions to     |
|           |        | investigate                                               |
| `agent`   | Agent  | The agent instance for service access and output          |

**Returns:**

- `Promise<string>` - Comprehensive research content as a string

**Implementation Details:**

1. Retrieves the configured research model from the agent's `ChatModelRegistry`
2. Sends a system message instructing the AI to research the topic using web
   search with strict adherence to factual accuracy
3. Returns detailed research content as a string
4. Generates artifact output with the research results in markdown format
5. Provides analytics on the research execution through
   `getChatAnalytics(response)`

#### Research Tool

A tool available in the TokenRing chat system for interactive research.

**Tool Definition:**

```typescript
{
  name: "research_run",
  displayName: "Research/research",
  description: "Dispatches a research request to an AI agent, and returns the generated research content.",
  inputSchema: z.object({
    topic: z.string().describe("The main topic or subject to research"),
    prompt: z.string().describe("The detailed research prompt or specific questions to investigate about the topic")
  }),
  execute
}
```

**Input Schema:**

```typescript
const inputSchema = z.object({
  topic: z.string().describe("The main topic or subject to research"),
  prompt: z.string().describe("The detailed research prompt or specific questions to investigate about the topic"),
});
```

**Input Schema Fields:**

| Field    | Type   | Required | Description                                               |
|----------|--------|----------|-----------------------------------------------------------|
| `topic`  | string | Yes      | The main topic or subject to research                     |
| `prompt` | string | Yes      | The detailed research prompt or specific questions to investigate about the topic |

#### Scripting Function

A global function available in scripting contexts for programmatic research.

**Function Signature:**

```typescript
research(topic: string, prompt: string): Promise<string>
```

**Parameters:**

| Parameter | Type   | Required | Description                                           |
|-----------|--------|----------|-------------------------------------------------------|
| `topic`   | string | Yes      | The main topic or subject to research                 |
| `prompt`  | string | Yes      | The detailed research prompt or specific questions to |
|           |        |          | investigate                                           |

**Returns:**

- `Promise<string>` - Research content as a string

### Services

#### ResearchService Implementation

Implements `TokenRingService` for research operations.

**Registration:**

The service is automatically registered when the plugin is installed:

```typescript
app.addServices(new ResearchService(config.research));
```

**Usage:**

```typescript
import { Agent } from "@tokenring-ai/agent";
import { ResearchService } from "@tokenring-ai/research";

const agent = new Agent();
const researchService = agent.requireServiceByType(ResearchService);

const research = await researchService.runResearch(
  "Artificial Intelligence",
  "What are the current trends in AI development?",
  agent,
);

console.log("Research results:", research);
```

### Configuration Schema

```typescript
import { ResearchServiceConfigSchema } from "@tokenring-ai/research/schema";

const packageConfigSchema = z.object({
  research: ResearchServiceConfigSchema.prefault({}),
});
```

### Schema Documentation

#### ResearchServiceConfigSchema

The configuration schema for the ResearchService.

**Schema Definition:**

```typescript
const ResearchServiceConfigSchema = z.object({
  researchModel: z.string().default("auto?websearch"),
});
```

**Fields:**

| Field         | Type   | Default            | Required | Description                                          |
|---------------|--------|--------------------|----------|------------------------------------------------------|
| `researchModel` | string | `"auto?websearch"` | No       | The AI model name for research (must support web search) |

**Notes:**

- The `researchModel` field defaults to `"auto?websearch"` which enables web search capabilities
- The model must support web search functionality for optimal research results
- Example values: `"auto?websearch"`, `"gemini-2.5-flash-web-search"`

### Plugin Registration

```typescript
import app from "@tokenring-ai/app";
import researchPlugin from "@tokenring-ai/research";

const appInstance = new app.App();

appInstance.addPlugin(researchPlugin, {
  research: {
    researchModel: "auto?websearch",
  },
});
```

### Integration

#### With Agent System

The plugin integrates with the agent system through several mechanisms:

**Tool Registration:**

Tools are registered through the plugin's install method:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools(...tools),
);
```

Where `tools` is exported from `@tokenring-ai/research/tools`:

```typescript
import tools from "@tokenring-ai/research/tools";

// tools = [ { name: "research_run", ... } ]
```

**Scripting Function Registration:**

```typescript
app.services.waitForItemByType(
  ScriptingService,
  (scriptingService: ScriptingService) => {
    scriptingService.registerFunction("research", {
      type: "native",
      params: ["topic", "prompt"],
      async execute(
        this: ScriptingThis,
        topic: string,
        prompt: string,
      ): Promise<string> {
        return await this.agent.requireServiceByType(ResearchService)
          .runResearch(topic, prompt, this.agent);
      },
    });
  },
);
```

**Service Registration:**

```typescript
app.addServices(new ResearchService(config.research));
```

#### With AI Client

The plugin integrates with the AI client system through the `ChatModelRegistry`,
which retrieves the configured research model and handles the actual research
operations.

#### With ChatService

The plugin uses `ChatService` for:

- Adding the `research_run` tool to the chat system
- Providing analytics through `getChatAnalytics(response)`
- Generating artifact output for research results

### Usage Examples

#### 1. Using with TokenRing Plugin

```typescript
import app from "@tokenring-ai/app";
import researchPlugin from "@tokenring-ai/research";

const appInstance = new app.App();

appInstance.addPlugin(researchPlugin, {
  research: {
    researchModel: "auto?websearch",
  },
});
```

#### 2. Using Tools in Agents

```typescript
import { Agent } from "@tokenring-ai/agent";
import { ResearchService } from "@tokenring-ai/research";

const agent = new Agent();
const researchService = agent.requireServiceByType(ResearchService);

// Execute research
const research = await researchService.runResearch(
  "Artificial Intelligence",
  "What are the current trends in AI development?",
  agent,
);

console.log("Research results:", research);
```

#### 3. Using Scripting Function

```typescript
// The research function is automatically registered by the plugin
const researchResult = await research(
  "Machine Learning",
  "Explain the latest advances in transformer models",
);
console.log(researchResult);
```

#### 4. Direct Service Usage

```typescript
import { ResearchService } from "@tokenring-ai/research";
import { Agent } from "@tokenring-ai/agent";

const researchService = new ResearchService({
  researchModel: "auto?websearch",
});

const agent = new Agent();
agent.addServices(researchService);

const research = await researchService.runResearch(
  "Web3 Technologies",
  "What are the current trends in decentralized identity?",
  agent,
);

console.log("Research:", research);
```

#### 5. Error Handling

```typescript
try {
  const researchResult = await research(
    "Quantum Computing",
    "Latest breakthroughs in 2024",
  );
  console.log("Research completed:", researchResult);
} catch (error) {
  console.error("Research failed:", error.message);
}
```

#### 6. Using the research_run Tool

```typescript
import { Agent } from "@tokenring-ai/agent";

const agent = new Agent();

// Execute research through agent tool
const result = await agent.callTool("research_run", {
  topic: "Quantum Computing",
  prompt: "What are the latest breakthroughs and commercial applications?",
});

console.log("Research result:", result);
```

### Artifacts

Research results are automatically generated as artifacts with the following
properties:

- **name**: `Research on {topic}`
- **encoding**: `text`
- **mimeType**: `text/markdown`
- **body**: Contains the topic, prompt, and research result

**Artifact Structure:**

```text
Topic: {topic}
Prompt: {prompt}

Result: {research}
```

### State Management

The ResearchService does not maintain persistent state. Each research request is
processed independently and returns a result without storing intermediate state.
The service interacts with:

- **ChatModelRegistry**: Retrieves the configured AI model for research
- **Agent**: Uses the agent's system message and chat output capabilities
- **ChatService**: Provides analytics and output through the agent's chat
  interface

Research results are returned directly to the caller and are not persisted
beyond the request lifecycle.

### Testing

#### Running Tests

```bash
bun test
```

**Note:** No test files currently exist for this package. The test
infrastructure is configured via `vitest.config.ts` and ready for test
development.

#### Test Configuration

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

### Package Structure

```text
pkg/research/
├── index.ts                         # Package entry point and exports
├── ResearchService.ts               # Core service for research operations
├── plugin.ts                        # TokenRing plugin integration
├── tools.ts                         # Tool exports
├── tools/
│   └── research.ts                  # Research tool implementation
├── schema.ts                        # Configuration schema definitions
├── package.json                     # Package metadata and dependencies
└── vitest.config.ts                 # Test configuration
```

### Build Instructions

```bash
bun run build
```

### Dependencies

#### Production Dependencies

| Package                   | Version   | Purpose                                       |
|---------------------------|-----------|-----------------------------------------------|
| `@tokenring-ai/agent`     | workspace | Central orchestration system                  |
| `@tokenring-ai/app`       | workspace | Base application framework and plugin system  |
| `@tokenring-ai/ai-client` | workspace | AI model registry and client                  |
| `@tokenring-ai/chat`      | workspace | Chat service and context handling             |
| `@tokenring-ai/scripting` | workspace | Scripting functions and execution             |
| `@tokenring-ai/utility`   | workspace | Utility functions (e.g., markdownList)        |
| `zod`                     | ^4.4.3    | Runtime type validation and schema definition |

#### Development Dependencies

| Package      | Version | Purpose                |
|--------------|---------|------------------------|
| `vitest`     | ^4.1.1  | Unit testing framework |
| `typescript` | ^6.0.2  | TypeScript compiler    |

### Related Components

- `@tokenring-ai/app`: Base application framework and plugin system
- `@tokenring-ai/agent`: Agent-based orchestration and state management
- `@tokenring-ai/ai-client`: AI model registry and client for model management
- `@tokenring-ai/chat`: Chat service and context handling
- `@tokenring-ai/scripting`: Scripting functions and execution engine
- `@tokenring-ai/utility`: Shared utility functions

## License

MIT License - see the LICENSE file for details.
