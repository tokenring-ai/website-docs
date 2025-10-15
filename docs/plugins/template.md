# Template Plugin

Reusable AI-powered prompt templates for accelerating repetitive tasks.

## Overview

The `@tokenring-ai/template` package provides functionality for running reusable AI-powered prompt templates by name. This allows users to accelerate repetitive tasks such as translation, drafting, and summarization.

## Key Features

- Run prompt templates with custom input
- List available templates
- View template information
- Error handling for template execution
- Configurable template registry

## Core Components

### TemplateRegistry

Manages and provides access to templates.

**Key Methods:**
- `register(name, template)` - Registers a template function
- `unregister(name)` - Unregisters a template
- `get(name)` - Gets a template function by name
- `list()` - Lists all registered templates
- `loadTemplates(templates)` - Loads templates from configuration

### Chat Commands

**/template**: Template management
- `list` - Lists all available templates
- `run <templateName> <input>` - Runs the specified template
- `info <templateName>` - Shows information about a template

## Template Structure

Templates are JavaScript functions that accept input and return a chat request object:

```javascript
export async function myTemplate(prompt) {
  return {
    system: "System prompt for the AI",
    user: prompt,
    // Optional parameters
    temperature: 0.7,
    model: "specific-model-name"
  };
}
```

## Example Templates

**translateToFrench**: Translates text to French
```bash
/template run translateToFrench "Hello world"
```

**createCompanyHistoryArticle**: Creates detailed company history article
```bash
/template run createCompanyHistoryArticle "Microsoft (MSFT)"
```

## Usage Example

```typescript
// Configuration
export default {
  templates: {
    translateToFrench: (await import("./templates/translateToFrench.js")).translateToFrench,
    createCompanyHistoryArticle: (await import("./templates/createCompanyHistoryArticle.js")).createCompanyHistoryArticle,
  }
};

// Using templates
await agent.handleInput('/template run translateToFrench "Hello"');
await agent.handleInput('/template info createCompanyHistoryArticle');
```

## Configuration Options

Templates are configured in your application config file:

```javascript
export default {
  templates: {
    templateName: templateFunction,
    // Add custom templates here
  }
};
```

## Creating Custom Templates

1. Create a JavaScript function that accepts input
2. Return a chat request object with system and user prompts
3. Add optional parameters (temperature, model, etc.)
4. Register in configuration file

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/ai-client@0.1.0`: AI integration

## Notes

- Templates are loaded from configuration
- Support for custom parameters per template
- Can specify different models per template
- Useful for standardizing common AI tasks
