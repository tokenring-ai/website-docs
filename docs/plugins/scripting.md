# Scripting Plugin

Lightweight scripting language with variables, functions, and LLM integration for automating workflows.

## Overview

The TokenRing AI Scripting package provides functionality for running predefined sequences of chat commands by name, as well as a lightweight scripting language with variables, functions, and LLM integration. This allows users to automate repetitive workflows and create dynamic, reusable command sequences.

## Key Features

- Run predefined scripts consisting of chat command sequences
- Scripting language with variables (`/var`), functions (`/func`), and LLM integration
- Variable interpolation in prompts and expressions
- Dynamic function calls with parameters
- Control flow: conditionals (`/if`), loops (`/for`, `/while`)
- Lists and iterables support
- Global function registration for packages

## Core Components

### ScriptingService

Manages and executes scripts and scripting language features.

**Key Methods:**
- `register(name, script)`: Registers a script function
- `unregister(name)`: Unregisters a script
- `get(name)`: Gets a script function by name
- `list()`: Lists all registered scripts
- `runScript({scriptName, input}, agent)`: Executes a script
- `registerFunction(func)`: Registers a global function

### Chat Commands

#### Script Management
- `/script list` - Lists all available scripts
- `/script run <scriptName> <input>` - Runs the specified script
- `/script info <scriptName>` - Shows information about a script

#### Scripting Language
- `/var $name = value` - Define variables
- `/var delete $name` - Delete a variable
- `/vars [$name]` - List all variables or show specific
- `/vars clear` - Clear all variables
- `/func static name($param1) => "text"` - Define static functions
- `/func llm name($param1) => "prompt"` - Define LLM functions
- `/func js name($param1) { code }` - Define JavaScript functions
- `/func delete name` - Delete a function
- `/funcs [name]` - List functions
- `/call functionName("arg1")` - Call a function
- `/list @name = ["item1", "item2"]` - Define lists
- `/echo <text|$var>` - Display text or variable
- `/sleep <seconds|$var>` - Sleep for specified seconds
- `/prompt $var "message"` - Prompt user for input
- `/confirm $var "message"` - Prompt for yes/no
- `/if $condition { commands }` - Conditional execution
- `/for $item in @list { commands }` - Iterate over lists
- `/while $condition { commands }` - Execute while condition is truthy

## Usage Examples

### Variables and LLM Integration

```bash
# Variables with static values
/var $name = "Alice"
/var $topic = "AI safety"

# Variables with LLM responses
/var $summary = llm("Summarize the key points about $topic")
/var $analysis = llm("Analyze this summary: $summary")
```

### Functions

```bash
# Define and use functions
/func static greet($name) => "Hello, $name!"
/func llm search($query, $site) => "Search for $query on $site"
/var $results = search("quantum computing", "Google Scholar")
/call search("quantum computing", "Google Scholar")
```

### Lists and Iteration

```bash
# Lists with @ prefix
/list @files = ["file1.txt", "file2.txt", "file3.txt"]
/for $file in @files { /echo Processing $file }

# Iterables (dynamic)
/iterable define ts-files --type glob --pattern "src/**/*.ts"
/for $f in @ts-files { /echo $basename at $path }
```

### Control Flow

```bash
# Interactive prompts
/prompt $username "Enter your name:"
/confirm $proceed "Continue with operation?"

# Conditional execution
/if $proceed { /echo Continuing... } else { /echo Stopped }
```

### Predefined Scripts

```javascript
export async function setupProject(projectName) {
  return [
    `/agent switch writer`,
    `/template run projectSetup ${projectName}`,
    `/tools enable filesystem`,
    `/agent switch publisher`
  ];
}
```

## Global Functions

Packages can register global functions available to all scripting contexts:

```typescript
import {ScriptingService} from "@tokenring-ai/scripting";

async attach(agent: Agent): Promise<void> {
  const scriptingService = agent.requireServiceByType(ScriptingService);
  if (scriptingService) {
    scriptingService.registerFunction({
      name: "readFile",
      item: {
        type: 'js',
        params: ['path'],
        body: `
          const fs = require('fs');
          return fs.readFileSync(path, 'utf-8');
        `
      }
    });
  }
}
```

## Configuration Options

Scripts are configured in your application config file:

```javascript
export default {
  scripts: {
    setupProject: (await import("../../scripts/setupProject.js")).setupProject,
    publishWorkflow: (await import("../../scripts/publishWorkflow.js")).publishWorkflow,
  }
};
```

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/ai-client`: AI integration
- Various utility packages for parsing and execution

## Inspiration

The scripting operators were inspired by the [mlld](https://github.com/mlld-lang/mlld) project, which provides a modular LLM scripting language.
