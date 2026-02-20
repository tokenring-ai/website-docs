# Template Plugin

Reusable AI-powered prompt templates with chaining, context management, and tool control.

## Overview

The `@tokenring-ai/template` package provides a comprehensive system for managing and executing reusable AI prompt templates. It enables users to accelerate repetitive tasks through template chaining, context management, and selective tool activation. The package includes plugin integration, chat commands, and tools for seamless template usage within the TokenRing ecosystem.

## Key Features

- **Template Registry**: Centralized management of named template functions
- **Template Chaining**: Execute multiple templates in sequence with automatic context passing
- **Context Management**: Reset specific contexts (chat, memory, events) between template executions
- **Tool Control**: Enable/disable specific tools during template execution
- **Multiple Inputs**: Process arrays of inputs within a single template execution
- **Circular Reference Detection**: Prevent infinite template loops
- **State Persistence**: Preserve and restore agent tool states during template execution
- **Plugin Architecture**: Automatic integration with TokenRing applications via plugin system
- **Chat Commands**: Interactive `/template` command with subcommands (list, info, run)
- **Tool Integration**: `template_list` and `template_run` tools for programmatic access

## Core Components

### TemplateService

The central service that manages template registration and execution:

```typescript
import { Agent } from "@tokenring-ai/agent";
import { TemplateService } from "@tokenring-ai/template";

// Access via agent
const templateService = agent.requireServiceByType(TemplateService);

// List available templates
const templates = templateService.listTemplates();

// Get a specific template
const template = templateService.getTemplateByName("myTemplate");

// Run a template
const result = await templateService.runTemplate(
  { templateName: "myTemplate", input: "Hello world" },
  agent
);
```

### TemplateChatRequest Schema

```typescript
interface TemplateChatRequest {
  inputs: string[];                    // Array of inputs to process
  nextTemplate?: string;               // Next template to run
  reset?: ResetWhat[];                 // Context types to reset (chat, memory, events)
  activeTools?: string[];              // Tools to enable during execution
}
```

### TemplateResult Schema

```typescript
interface TemplateResult {
  ok: boolean;
  output?: string;
  response?: any;
  error?: string;
  nextTemplateResult?: TemplateResult; // For chained templates
}
```

## Template Structure

Templates are async functions that accept an input string and return a `TemplateChatRequest`:

```typescript
import { TemplateChatRequest } from "@tokenring-ai/template";

export async function myTemplate(input: string): Promise<TemplateChatRequest> {
  return {
    inputs: [input],
    // Optional parameters
    nextTemplate: "followUpTemplate", // Chain to another template
    reset: ["chat", "memory"],       // Reset context types
    activeTools: ["websearch", "wikipedia"], // Enable specific tools
  };
}
```

## Usage Examples

### Basic Template Execution

```typescript
// Run a template
const result = await templateService.runTemplate(
  { templateName: "summarize", input: "Long article text..." },
  agent
);

console.log(result.output); // AI response
```

### Template Chaining

```typescript
// First template generates content
export async function generateDraft(input: string): Promise<TemplateChatRequest> {
  return {
    inputs: [input],
    nextTemplate: "improveDraft", // Chain to improvement template
  };
}

// Second template improves the draft
export async function improveDraft(input: string): Promise<TemplateChatRequest> {
  return {
    inputs: [input],
    // No nextTemplate, so this ends the chain
  };
}
```

### Context Reset and Tool Management

```typescript
export async function newTaskTemplate(input: string): Promise<TemplateChatRequest> {
  return {
    inputs: [input],
    reset: ["chat", "memory", "events"], // Clear previous context
    activeTools: ["websearch", "wikipedia"], // Enable only these tools
  };
}
```

### Multiple Inputs

```typescript
export async function multiStepAnalysis(input: string): Promise<TemplateChatRequest> {
  return {
    inputs: [
      "Analyze this data for trends",
      "Identify key insights",
      "Generate recommendations"
    ],
  };
}
```

## Plugin Configuration

The plugin registers templates with the TokenRing application via the configuration system:

```typescript
// Configuration schema is automatically validated
export default {
  templates: {
    // Template name -> Template function mapping
    summarize: async (input: string) => ({
      inputs: [input],
    }),
    translateToFrench: async (input: string) => ({
      inputs: [input],
      system: "You are a professional translator.",
    }),
    research: async (input: string) => ({
      inputs: [input],
      activeTools: ["websearch", "wikipedia"],
      nextTemplate: "summarizeFindings",
    }),
  }
};
```

The package provides a configuration schema that can be used for validation:

```typescript
import { TemplateConfigSchema } from "@tokenring-ai/template";

const config = {
  templates: TemplateConfigSchema.parse({
    summarize: async (input: string) => ({
      inputs: [input],
    }),
  })
};
```

## Agent Configuration

The TemplateService does not require agent-specific configuration.

## Tools

The package provides two main tools for programmatic template access:

### `template_list`

Lists all available templates.

**Parameters:** None  
**Returns:** `{ templates: string[] }`

**Tool Definition:**
```typescript
{
  name: "template_list",
  displayName: "Template/listTemplates",
  description: "Lists all available templates. Returns an array of template names that can be used with the runTemplate tool.",
  inputSchema: z.object({}),
  execute: (input, agent) => Promise<{ type: "json", data: { templates: string[] } }>
}
```

### `template_run`

Runs a template with the given input.

**Parameters:**
- `templateName`: Name of the template to run
- `input`: Input text for the template

**Returns:** `{ output?: string, response?: any }`

**Tool Definition:**
```typescript
{
  name: "template_run",
  displayName: "Template/runTemplate",
  description: "Run a template with the given input. Templates are predefined prompt patterns that generate AI requests.",
  inputSchema: z.object({
    templateName: z.string().describe("The name of the template to run."),
    input: z.string().describe("The input to pass to the template."),
  }),
  execute: ({templateName, input}, agent) => Promise<{ type: "json", data: { output?: string, response?: any } }>
}
```

## Services

The package provides one service:

### TemplateService

Implements `TokenRingService` interface and manages template registration and execution.

**Constructor Parameters:**
- `templates`: `TemplateServiceOptions` - Record of template names to template functions

**Methods:**
- `listTemplates(): string[]` - Returns an array of all registered template names
- `getTemplateByName(name: string): TemplateFunction | undefined` - Retrieves a template function by name
- `runTemplate({ templateName, input, visitedTemplates? }, agent): Promise<TemplateResult>` - Executes a template with the given input

**Integration Example:**
```typescript
import { TemplateService } from "@tokenring-ai/template";

// Access via agent
const templateService = agent.requireServiceByType(TemplateService);

// List available templates
const templates = templateService.listTemplates();
```

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

The package provides the `/template` command with the following subcommands:

### `/template list`

List all available templates.

**Example:**
```
/template list
```

### `/template run <templateName> [input]`

Run a template with optional input.

**Arguments:**
- `templateName`: Name of the template to run
- `input`: Optional input text for the template

**Example:**
```
/template run summarize This is the text to summarize
```

### `/template info <templateName>`

Show information about a specific template.

**Arguments:**
- `templateName`: Name of the template to get info about

**Example:**
```
/template info summarize
```

## Integration

### Plugin Architecture

The package automatically integrates with TokenRing applications via the plugin system. The plugin registers:

- **ChatTools**: `template_list` and `template_run` tools
- **AgentCommands**: `/template` command with subcommands (`list`, `info`, `run`)
- **TemplateService**: Manages template registry and execution

**Plugin Configuration:**
```typescript
export default {
  templates: {
    myTemplate: myTemplateFunction,
    anotherTemplate: anotherTemplateFunction,
  }
}
```

### Service Dependencies

- **ChatService**: For chat execution and tool management
- **Agent**: For template execution context

### State Management

- **Tool State**: Automatically preserved and restored during template execution
- **Context**: Supports selective context reset via `reset` parameter
- **Chain Tracking**: Prevents circular references in template chains

## Usage Examples

### Plugin Registration

```typescript
import { TokenRingAppConfig } from "@tokenring-ai/app";
import templatePlugin from "@tokenring-ai/template";

export default {
  plugins: {
    template: {
      templates: {
        summarize: async (input: string) => ({
          inputs: [input],
        }),
        translateToFrench: async (input: string) => ({
          inputs: [input],
          system: "You are a professional translator.",
        }),
        research: async (input: string) => ({
          inputs: [input],
          activeTools: ["websearch", "wikipedia"],
          nextTemplate: "summarizeFindings",
        }),
      }
    }
  }
} satisfies TokenRingAppConfig;
```

### Agent Integration

```typescript
import { Agent } from "@tokenring-ai/agent";
import { TemplateService } from "@tokenring-ai/template";

export async function exampleAgentFunction(agent: Agent): Promise<void> {
  // Access the TemplateService
  const templateService = agent.requireServiceByType(TemplateService);
  
  // List templates
  const templates = templateService.listTemplates();
  
  // Run a template
  const result = await templateService.runTemplate(
    { templateName: "summarize", input: "Content to summarize..." },
    agent
  );
  
  // Handle result
  console.log(result.output);
}
```

### Tool Usage

```typescript
import { Agent } from "@tokenring-ai/agent";

export async function useTools(agent: Agent): Promise<void> {
  // List available templates
  const listResult = await agent.callTool("template_list", {});
  
  // Run a template
  const runResult = await agent.callTool("template_run", {
    templateName: "summarize",
    input: "Content to summarize..."
  });
  
  console.log(runResult.data.output);
}
```

### Chat Command Usage

```typescript
// User types in chat interface:
/template list

// User types in chat interface:
/template run summarize This is the text to summarize

// User types in chat interface:
/template info summarize
```

## Best Practices

1. **Template Naming**: Use clear, descriptive names that indicate the template's purpose
2. **Chaining**: Keep template chains short and well-documented to avoid confusion
3. **Context Reset**: Use `reset` parameter when starting new tasks to avoid context contamination
4. **Tool Selection**: Enable only necessary tools for each template to optimize performance
5. **Error Handling**: Always handle potential errors when running templates
6. **Circular References**: Use the `visitedTemplates` tracking mechanism to prevent infinite loops

## Error Handling

The package includes comprehensive error handling:

- **Missing Templates**: Clear error when template not found
- **Circular References**: Detection and prevention of template chain loops
- **Invalid Inputs**: Validation of required parameters
- **Tool State**: Proper restoration of tool states even on errors

### Error Examples

```typescript
// Missing template
try {
  await templateService.runTemplate({ templateName: "nonexistent", input: "test" }, agent);
} catch (error) {
  console.log(error.message); // "Template not found: nonexistent"
}

// Circular reference
const templateWithCircularRef = async (input: string) => ({
  inputs: [input],
  nextTemplate: "anotherTemplate", // This could create a circular reference
});
```

## Testing

### Running Tests

```bash
bun run test
```

### Testing Templates

```typescript
// Test your template function directly
const chatRequest = await myCustomTemplate("test input");
console.log(chatRequest.inputs); // ["test input"]
console.log(chatRequest.nextTemplate); // undefined if no chaining
```

## Package Structure

```
pkg/template/
├── index.ts                    # Package exports (TemplateConfigSchema, TemplateService)
├── package.json                # Package metadata and dependencies
├── plugin.ts                   # TokenRing plugin implementation
├── TemplateService.ts          # Core template management service
├── tools.ts                    # Tool exports (template_list, template_run)
├── tools/
│   ├── listTemplates.ts        # List templates tool implementation
│   └── runTemplate.ts          # Run template tool implementation
├── chatCommands.ts             # Chat command exports (/template)
├── commands/
│   └── template/
│       ├── template.ts         # Main template command router
│       ├── info.ts             # /template info subcommand
│       ├── list.ts             # /template list subcommand
│       └── run.ts              # /template run subcommand
├── tests/
│   ├── TemplateService.test.ts
│   ├── commands.test.ts
│   ├── integration.test.ts
│   └── tools.test.ts
└── docs/
    └── design.md               # Design documentation
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/ai-client`: Multi-provider AI integration
- `@tokenring-ai/app`: Base application framework
- `@tokenring-ai/agent`: Central orchestration system
- `@tokenring-ai/chat`: Chat service and integration
- `@tokenring-ai/utility`: Shared utilities and helpers
- `zod`: Schema validation

### Development Dependencies

- `vitest`: Testing framework
- `typescript`: TypeScript compiler

## Related Components

- [`@tokenring-ai/chat`](chat.md): Chat service for template execution
- [`@tokenring-ai/agent`](agent.md): Agent system for template context
- [`@tokenring-ai/ai-client`](ai-client.md): AI client for template generation

## License

MIT

## Version

0.2.0
