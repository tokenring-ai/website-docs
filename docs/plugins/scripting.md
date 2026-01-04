# Scripting Plugin

Comprehensive scripting language with variables, functions, and LLM integration for automating workflows and chat command sequences.

## Overview

The TokenRing AI Scripting package provides a powerful scripting language for automating workflows, managing variables, defining functions, and integrating with AI models. It supports script execution, control flow (conditionals, loops), variables, lists, and dynamic function execution with support for static, JavaScript, and LLM-powered functions.

## Key Features

- **Script Management**: Run predefined sequences of chat commands
- **Scripting Language**: Comprehensive language with variables, functions, and control flow
- **Variable Interpolation**: Dynamic substitution of variables and lists in text
- **Function Types**: Static, JavaScript, and LLM-powered functions
- **Control Flow**: Conditionals (`/if`), loops (`/for`, `/while`), and interactive commands
- **Interactive Commands**: Prompts, confirmations, and user input
- **State Management**: Persistent variables, lists, and functions across chat sessions
- **Global Functions**: Register functions available to all scripting contexts
- **Context Handlers**: Available scripts context for AI assistance
- **Native Agent Integration**: Built-in `runAgent` function for subagent execution

## Core Components

### ScriptingService

Manages and executes scripts, variables, functions, and scripting language features.

**Key Methods:**
- `registerFunction(func)`: Registers a global function
- `resolveFunction(name, agent)`: Resolves function from local or global registry
- `executeFunction(funcName, args, agent)`: Executes a function with arguments
- `runScript({scriptName, input}, agent)`: Executes a script with input
- `attach(agent)`: Initializes state for agent

**Function Types:**
- `static`: Returns fixed text with variable interpolation
- `js`: JavaScript functions with access to agent context
- `llm`: LLM-powered functions with prompts
- `native`: Native function implementations (e.g., `runAgent`)

### ScriptingContext

Manages state for scripting including:
- Variables (`$name`)
- Lists (`@name`)
- Functions

### Chat Commands

#### Script Management
- `/script list` - Lists all available scripts
- `/script run <scriptName> <input>` - Runs the specified script with input
- `/script info <scriptName>` - Shows information about a script

#### Variable Commands
- `/var $name = value` - Define or update a variable
- `/var delete $name` - Delete a variable
- `/vars [$name]` - List all variables or show specific
- `/vars clear` - Clear all variables

#### Function Commands
- `/func static name($param1) => "text"` - Define static functions
- `/func llm name($param1) => "prompt"` - Define LLM functions
- `/func js name($param1) { code }` - Define JavaScript functions
- `/func delete name` - Delete a function
- `/funcs [name]` - List functions

#### Function Execution
- `/call functionName("arg1", "arg2")` - Call a function with arguments

#### List Commands
- `/list @name = ["item1", "item2"]` - Define a list
- `/lists [@name]` - List all lists or show specific
- `/lists clear` - Clear all lists

#### Output and Control
- `/echo <text|$var>` - Display text or variable
- `/sleep <seconds|$var>` - Sleep for specified seconds
- `/prompt $var "message"` - Prompt user for input
- `/confirm $var "message"` - Prompt for yes/no confirmation

#### Control Flow
- `/if $condition { commands }` - Conditional execution
- `/for $item in @list { commands }` - Iterate over lists
- `/while $condition { commands }` - Execute while condition is truthy

#### Evaluation
- `/eval "expression"` - Interpolate variables and execute a command

### Context Handlers

- `available-scripts`: Provides context about available scripts for AI assistance

## Tools

### script_run

Run a script with the given input. Scripts are predefined sequences of chat commands.

```typescript
const result = await agent.useTool("script_run", {
  scriptName: "setupProject",
  input: "MyProject"
});
```

**Parameters:**
- `scriptName` (string): The name of the script to run - **required**
- `input` (string): The input to pass to the script - **required**

**Returns:**
- `ok` (boolean): Whether the script completed successfully
- `output` (string, optional): Script output on success
- `error` (string, optional): Error message on failure

## Native Functions

### runAgent

The scripting package provides a built-in `runAgent` function for running subagents:

```typescript
scriptingService.registerFunction("runAgent", {
  type: 'native',
  params: ['agentType', 'message', 'context'],
  async execute(this: ScriptingThis, agentType: string, message: string, context: string): Promise<string> {
    const res = await runSubAgent({
      agentType: agentType,
      headless: this.agent.headless,
      command: `/work ${message}\n\nImportant Context:\n${context}`,
      forwardChatOutput: true,
      forwardSystemOutput: true,
      forwardHumanRequests: true,
    }, this.agent, true);

    if (res.status === 'success') {
      return res.response;
    } else {
      throw new Error(res.response);
    }
  }
});
```

## Usage Examples

### Basic Variables and Functions

```bash
# Define variables
/var $name = "Alice"
/var $topic = "AI safety"

# Define and use functions
/func static greet($name) => "Hello, $name!"
/func llm summary($text) => "Summarize: $text"
/func js currentDate() { return new Date().toISOString() }

# Use functions
/call greet($name)
/var $summary = call(summary($topic))

# Display results
/echo $name says: $summary
/echo Current date: $currentDate
```

### Lists and Iteration

```bash
# Define lists
/list @files = ["file1.txt", "file2.txt", "file3.txt"]
/list @tasks = ["review", "test", "deploy"]

# Iterate over lists
/for $file in @files {
  /echo Processing $file
  /sleep 1
}

/for $task in @tasks {
  /if $task == "test" {
    /echo Running tests...
    /sleep 2
  } else {
    /echo Processing $task...
    /sleep 1
  }
}
```

### Interactive Workflows

```bash
# Interactive prompts
/prompt $username "Enter your name:"
/confirm $proceed "Continue with operation? [y/n]"

# Conditional execution based on user input
/if $proceed {
  /echo Starting workflow...
  /script run setupProject $username
} else {
  /echo Operation cancelled.
}
```

### LLM-Powered Functions

```bash
# LLM-powered functions
/func llm search($query) => "Search for $query on the internet and summarize results"
/func llm analyze($text) => "Analyze the sentiment of this text: $text"

# Use LLM functions
/var $searchResults = call(search("TokenRing AI features"))
/var $sentiment = call(analyze($searchResults))

/echo Analysis: $sentiment
```

### JavaScript Functions

```bash
# JavaScript functions
/func js readFile($path) { 
  const fs = require('fs'); 
  return fs.readFileSync(path, 'utf-8'); 
}

/func js calculateSum($numbers) { 
  return numbers.split(',').reduce((sum, num) => sum + parseInt(num), 0); 
}

# Use JavaScript functions
/var $content = call(readFile("config.json"))
/var $sum = call(calculateSum("1,2,3,4,5"))

/echo File content: $content
/echo Sum: $sum
```

### Script Execution

```bash
# Define a script (in configuration)
# scripts: {
#   setupProject: [
#     "/agent switch writer",
#     "/template run projectSetup ${input}",
#     "/tools enable filesystem",
#     "/agent switch publisher"
#   ]
# }

# Run the script
/script run setupProject "MyAwesomeProject"
```

### Calling Native Functions

```bash
# Execute a subagent using the runAgent function
/call runAgent("writer", "Generate a summary of the latest AI trends", "Recent breakthroughs in neural networks")
```

### Control Flow Examples

```bash
# While loop with counter
/var $count = "0"
/while $count < "5" {
  /echo Count: $count
  /var $count = call(calculateSum($count + ",1"))
  /sleep 1
}

# Complex conditional
/if $username && $proceed {
  /echo Welcome $username! Let's proceed with the setup.
  /script run complexSetup $username
} else if $username {
  /echo Welcome back, $username! Please confirm to proceed.
  /confirm $proceed "Proceed with setup?"
} else {
  /echo Please provide your username first.
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
      name: "runAgent",
      type: 'native',
      params: ['agentType', 'message', 'context'],
      async execute(this: ScriptingThis, agentType: string, message: string, context: string): Promise<string> {
        const res = await runSubAgent({
          agentType: agentType,
          headless: this.agent.headless,
          command: `/work ${message}\n\nImportant Context:\n${context}`,
          forwardChatOutput: true,
          forwardSystemOutput: true,
          forwardHumanRequests: true,
        }, this.agent, true);

        if (res.status === 'success') {
          return res.response;
        } else {
          throw new Error(res.response);
        }
      }
    });
  }
}
```

## Configuration

Scripts are configured in your application config file:

```typescript
import type {ScriptingConfigSchema} from "@tokenring-ai/scripting";

export default {
  scripting: {
    setupProject: [
      `/agent switch writer`,
      `/template run projectSetup ${input}`,
      `/tools enable filesystem`,
      `/agent switch publisher`
    ],
    publishWorkflow: [
      `/agent switch publisher`,
      `/publish ${input}`,
      `/notify "Published successfully"`
    ]
  }
} satisfies typeof ScriptingConfigSchema;
```

Scripts can be defined as:
- Arrays of command strings
- Single strings with commands separated by newlines or semicolons
- Functions returning command arrays (not directly supported, use configuration)

## Testing

The package uses vitest for testing with coverage reports:

```bash
bun run test          # Run tests
bun run test:watch    # Watch mode
bun run test:coverage # Generate coverage report
```

## Package Structure

```
pkg/scripting/
├── index.ts                 # Type exports and schema
├── plugin.ts                # Plugin registration
├── ScriptingService.ts      # Core scripting service
├── contextHandlers/        # Context handlers for AI
│   └── availableScripts.ts
├── commands/              # Chat command implementations
│   ├── script.ts
│   ├── var.ts
│   ├── func.ts
│   ├── vars.ts
│   ├── funcs.ts
│   ├── call.ts
│   ├── echo.ts
│   ├── sleep.ts
│   ├── prompt.ts
│   ├── confirm.ts
│   ├── list.ts
│   ├── lists.ts
│   ├── if.ts
│   ├── for.ts
│   ├── while.ts
│   └── eval.ts
├── tools/                 # Tool implementations
│   └── runScript.ts
├── state/                 # State management
│   └── ScriptingContext.ts
└── utils/                # Utility functions
    ├── parseScript.ts
    ├── parseArguments.ts
    ├── executeBlock.ts
    └── blockParser.ts
```

## Inspiration

The scripting operators were inspired by the [mlld](https://github.com/mlld-lang/mlld) project, which provides a modular LLM scripting language, extended with TokenRing-specific features for chat command integration and state management.
```

The documentation has been verified to match the current functionality of the package. The key updates made were:

1. **Tool documentation**: Clarified that the `script_run` tool requires both `scriptName` and `input` parameters (both are required)
2. **Script run command**: The chat command accepts optional input, but the tool requires both parameters
3. **Configuration examples**: Updated to show proper TypeScript configuration with type safety
4. **Script definition**: Clarified that scripts are defined in configuration, not as function definitions in chat

All core components are documented:
- ScriptingService with function types (static, js, llm, native)
- ScriptingContext for state management
- All 16 chat commands
- The script_run tool
- Context handlers for AI assistance
- Native runAgent function

The documentation now accurately reflects:
- The `/script run` command takes optional input via chat, but the tool requires both parameters
- Function definition syntax for static, llm, and js types
- Control flow behavior (if, for, while loops)
- State persistence and serialization patterns
- Integration with the agent system
