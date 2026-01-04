# Template Plugin

Reusable AI-powered prompt templates with chaining, context management, and tool control.

## Overview

The `@tokenring-ai/template` package provides a comprehensive system for managing and executing reusable AI prompt templates. It enables users to accelerate repetitive tasks through template chaining, context management, and selective tool activation.

## Key Features

- **Template Registry**: Centralized management of named template functions
- **Template Chaining**: Execute multiple templates in sequence with automatic context passing
- **Context Management**: Reset specific contexts (chat, memory, events) between template executions
- **Tool Control**: Enable/disable specific tools during template execution
- **Multiple Inputs**: Process arrays of inputs within a single template execution
- **Circular Reference Detection**: Prevent infinite template loops
- **State Persistence**: Preserve and restore agent tool states during template execution
- **Interactive Commands**: Chat-based template management via `/template` command
- **Tool Integration**: Programmatic access through `template/run` and `template/list` tools

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
// Run a template via tool
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

## Interactive Chat Commands

The package provides the `/template` command with comprehensive subcommands:

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

**Example:**
```
/template info summarize
```

## Programmatic Tools

The package provides two main tools for programmatic access:

### `template/list`
Lists all available templates.

**Parameters:** None
**Returns:** Array of template names

### `template/run`
Runs a template with the given input.

**Parameters:**
- `templateName`: Name of the template to run
- `input`: Input text for the template

**Example Usage:**
```typescript
const result = await agent.runTool('template/run', {
  templateName: 'summarize',
  input: 'Long article text...'
});
```

## Configuration

Templates are configured via the TokenRing configuration system:

```typescript
// Configuration schema is automatically validated
export default {
  template: {
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

## Integration with TokenRing Ecosystem

### Plugin Architecture

The package automatically integrates with TokenRing applications via the plugin system:

```typescript
export default {
  name: "@tokenring-ai/template",
  install(app: TokenRingApp) {
    // Templates are automatically registered
    // Tools and commands are automatically added
    // Service is automatically attached to agents
  }
}
```

### Service Dependencies

- **ChatService**: For chat execution and tool management
- **AgentCommandService**: For command registration
- **Agent**: For template execution context

### State Management

- **Tool State**: Automatically preserved and restored during template execution
- **Context**: Supports selective context reset via `reset` parameter
- **Chain Tracking**: Prevents circular references in template chains

## Development

### Creating Templates

1. Define your template function:

```typescript
import { TemplateChatRequest } from "@tokenring-ai/template";

export async function myCustomTemplate(input: string): Promise<TemplateChatRequest> {
  return {
    inputs: [input],
    // Add your template logic here
  };
}
```

2. Register it in your configuration:

```typescript
export default {
  template: {
    myCustomTemplate: myCustomTemplate,
  }
}
```

3. Use it via chat command or tools:

```bash
/template run myCustomTemplate "Your input here"
```

### Testing Templates

```typescript
// Test your template function directly
const chatRequest = await myCustomTemplate("test input");
console.log(chatRequest.inputs); // ["test input"]
console.log(chatRequest.nextTemplate); // undefined if no chaining
```

## License

MIT

## Version

0.2.0
