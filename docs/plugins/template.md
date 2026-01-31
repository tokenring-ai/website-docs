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

## Configuration

Templates are configured via the TokenRing configuration system:

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

The package does not have a plugin.ts file. Templates must be registered manually in your application configuration, and the TemplateService can be accessed via the agent system:

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
  templates: {
    myCustomTemplate: myCustomTemplate,
  }
}
```

3. Use it via the TemplateService:

```typescript
const result = await templateService.runTemplate(
  { templateName: "myCustomTemplate", input: "Your input here" },
  agent
);
```

### Testing Templates

```typescript
// Test your template function directly
const chatRequest = await myCustomTemplate("test input");
console.log(chatRequest.inputs); // ["test input"]
console.log(chatRequest.nextTemplate); // undefined if no chaining
```

### Running Tests

```bash
bun run test
```

## API Reference

### TemplateService Methods

#### `listTemplates(): string[]`

Returns an array of all registered template names.

#### `getTemplateByName(name: string): TemplateFunction | undefined`

Retrieves a template function by name.

#### `runTemplate({ templateName, input, visitedTemplates? }, agent): Promise<TemplateResult>`

Executes a template with the given input.

**Parameters:**
- `templateName`: Name of the template to run
- `input`: Input text for the template
- `visitedTemplates`: Array to track template chain (internal use)

**Returns:**
```typescript
interface TemplateResult {
  ok: boolean;
  output?: string;
  response?: any;
  error?: string;
  nextTemplateResult?: TemplateResult; // For chained templates
}
```

## License

MIT

## Version

0.2.0
