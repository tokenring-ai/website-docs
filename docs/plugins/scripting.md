# Scripting Plugin

Comprehensive scripting language with variables, functions, and LLM integration for automating workflows and chat command sequences.

## Overview

The TokenRing AI Scripting package provides a powerful scripting language for automating workflows, managing variables, defining functions, and integrating with AI models. It supports script execution, control flow (conditionals, loops), variables, lists, and dynamic function execution with support for static, JavaScript, and LLM-powered functions.

## Key Features

- **Script Management**: Run predefined sequences of chat commands
- **Scripting Language**: Comprehensive language with variables, functions, and control flow
- **Variable Interpolation**: Dynamic substitution of variables (`$var`) and lists (`@list`) in text
- **Function Types**: Static, JavaScript, LLM-powered, and native functions
- **Control Flow**: Conditionals (`/if`), loops (`/for`, `/while`), and interactive commands
- **Interactive Commands**: Prompts, confirmations, and user input
- **State Management**: Persistent variables, lists, and functions across chat sessions
- **Global Functions**: Register functions available to all scripting contexts
- **Context Handlers**: Available scripts context for AI assistance
- **Native Agent Integration**: Built-in `runAgent` function for subagent execution
- **Block Parsing**: Support for nested blocks with balanced brace parsing
- **Argument Parsing**: Smart argument parsing that respects quotes and nested structures

## Core Components

### ScriptingService

Manages and executes scripts, variables, functions, and scripting language features. Implements the `TokenRingService` interface.

**Properties:**
- `name: "ScriptingService"` - Service identifier
- `description` - Service description
- `scripts` - Registry of predefined scripts (KeyedRegistry)
- `functions` - Registry of global functions (KeyedRegistry)

**Key Methods:**
- `registerFunction(name, func)` - Registers a global function in the registry
- `resolveFunction(name, agent)` - Resolves function from local context or global registry
- `executeFunction(funcName, args, agent)` - Executes a function with arguments
- `runScript({scriptName, input}, agent)` - Executes a script with input
- `attach(agent)` - Initializes ScriptingContext state for agent
- `getScriptByName(name)` - Gets a script by name (alias for scripts.getItemByName)
- `listScripts()` - Lists all script names (alias for scripts.getAllItemNames)
- `getFunction(name)` - Gets a global function by name (alias for functions.getItemByName)
- `listFunctions()` - Lists all global function names (alias for functions.getAllItemNames)

**Function Types:**
- `static` - Returns fixed text with variable interpolation
- `js` - JavaScript functions with access to agent context
- `llm` - LLM-powered functions with prompts
- `native` - Native function implementations (e.g., `runAgent`)

**ScriptResult Type:**
```typescript
type ScriptResult = {
  ok: boolean;
  output?: string;
  error?: string;
  nextScriptResult?: ScriptResult;
}
```

**ScriptingThis Type:**
```typescript
type ScriptingThis = {
  agent: Agent;
}
```

### ScriptingContext

Manages state for scripting including variables (`$name`), lists (`@name`), and functions. Implements `AgentStateSlice` for persistence.

**Properties:**
- `name: "ScriptingContext"` - State slice identifier
- `variables: Map<string, string>` - Variable storage
- `lists: Map<string, string[]>` - List storage
- `functions: Map<string, Function>` - Local function storage

**Methods:**
- `setVariable(name, value)` - Set a variable value
- `getVariable(name)` - Get a variable value
- `setList(name, value)` - Set a list value
- `getList(name)` - Get a list value
- `defineFunction(name, type, params, body)` - Define a local function
- `getFunction(name)` - Get a local function
- `interpolate(text)` - Interpolate variables (`$var`) and lists (`@list`) in text
- `show()` - Get formatted state information as string array
- `serialize()` - Serialize state for persistence
- `deserialize(data)` - Restore state from serialization
- `reset(what)` - Reset state based on reset type (e.g., "chat")

**Serialization Schema:**
```typescript
const serializationSchema = z.object({
  variables: z.array(z.tuple([z.string(), z.string()])),
  lists: z.array(z.tuple([z.string(), z.array(z.string())])),
  functions: z.array(z.tuple([
    z.string(),
    z.object({
      type: z.enum(['static', 'llm', 'js']),
      params: z.array(z.string()),
      body: z.string()
    })
  ]))
});
```

### Chat Commands

#### Script Management

- `/script list` - Lists all available scripts
- `/script run <scriptName> [input]` - Runs the specified script with optional input
- `/script info <scriptName>` - Shows information about a script

#### Variable Commands

- `/var $name = value` - Define or update a variable
- `/var $name = llm("prompt")` - Define variable with LLM response
- `/var $name = functionName("arg")` - Define variable with function result
- `/var delete $name` - Delete a variable
- `/vars [$name]` - List all variables or show specific
- `/vars clear` - Clear all variables

#### Function Commands

- `/func static name($param1) => "text"` - Define static function
- `/func llm name($param1) => "prompt"` - Define LLM function
- `/func js name($param1) { code }` - Define JavaScript function
- `/func delete name` - Delete a function
- `/funcs [name]` - List all functions (local and global)
- `/funcs clear` - Clear all local functions

#### Function Execution

- `/call functionName("arg1", "arg2")` - Call a function with arguments and display output

#### List Commands

- `/list @name = ["item1", "item2"]` - Define a static list
- `/list @name = [$var1, $var2]` - Define list from variables
- `/list @name = functionName("arg")` - Define list from function results
- `/lists [@name]` - List all lists or show specific contents

#### Output and Control

- `/echo <text|$var>` - Display text or variable value without LLM processing
- `/sleep <seconds|$var>` - Sleep for specified seconds
- `/prompt $var "message"` - Prompt user for text input
- `/confirm $var "message"` - Prompt for yes/no confirmation

#### Control Flow

- `/if $condition { commands } [else { commands }]` - Conditional execution
- `/for $item in @list { commands }` - Iterate over lists
- `/while $condition { commands }` - Execute while condition is truthy

#### Evaluation

- `/eval <command with $vars>` - Interpolates variables in the command string and then executes it

### Context Handlers

- `available-scripts` - Provides context about available scripts for AI assistance

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
- `scriptName` (string) - The name of the script to run - **required**
- `input` (string) - The input to pass to the script - **required**

**Returns:**
- `ok` (boolean) - Whether the script completed successfully
- `output` (string, optional) - Script output on success
- `error` (string, optional) - Error message on failure

**Required Context Handlers:**
- `available-scripts` - Required to determine available scripts

**Throws:**
- `CommandFailedError` - When script execution fails

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
      input: {
        message: `/work ${message}\n\nImportant Context:\n${context}`,
      }
    }, this.agent, true);

    if (res.status === 'success') {
      return res.response;
    } else {
      throw new Error(res.response);
    }
  }
});
```

**Parameters:**
- `agentType` (string) - The type of agent to run
- `message` (string) - The message to send to the agent
- `context` (string) - Additional context for the agent

**Returns:** The agent's response as a string

**Throws:** Error if subagent execution fails

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
/var $greeting = greet($name)
/var $summary = summary($topic)

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
/func llm analyze($text) => "Analyze the sentiment of this text: $text"

# Use LLM functions
/var $sentiment = analyze("I love this product!")

/echo Analysis: $sentiment
```

### JavaScript Functions

```bash
# JavaScript functions
/func js wordCount($text) { 
  return $text.split(/\s+/).length; 
}

# Use JavaScript functions
/var $count = wordCount("Hello world from TokenRing")

/echo Word count: $count
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
/var $result = runAgent("writer", "Generate a summary of the latest AI trends", "Recent breakthroughs in neural networks")
/echo Sub-agent result: $result
```

### Control Flow Examples

```bash
# While loop with counter
/var $count = "0"
/while $count < "5" {
  /echo Count: $count
  /var $count = $count + 1
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

### Variable Interpolation

```bash
# Variable interpolation in text
/var $name = "World"
/echo Hello, $name!

# List interpolation
/list @items = ["apple", "banana", "cherry"]
/echo Fruits: @items

# Mixed interpolation
/var $prefix = "Items:"
/echo $prefix @items
```

### Dynamic Command Execution

```bash
# Store command in variable
/var $cmd = echo

# Execute dynamically
/eval /$cmd "Hello World"

# Dynamic command with variables
/var $filename = "data.txt"
/eval /process $filename
```

## Global Functions

Packages can register global functions available to all scripting contexts:

```typescript
import {ScriptingService} from "@tokenring-ai/scripting";
import type {ScriptFunction, ScriptingThis} from "@tokenring-ai/scripting";

async attach(agent: Agent): Promise<void> {
  const scriptingService = agent.requireServiceByType(ScriptingService);
  if (scriptingService) {
    scriptingService.registerFunction("runAgent", {
      type: 'native',
      params: ['agentType', 'message', 'context'],
      async execute(this: ScriptingThis, agentType: string, message: string, context: string): Promise<string> {
        const res = await runSubAgent({
          agentType: agentType,
          headless: this.agent.headless,
          input: {
            message: `/work ${message}\n\nImportant Context:\n${context}`,
          }
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
import type {ScriptingServiceConfigSchema} from "@tokenring-ai/scripting";

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
} satisfies typeof ScriptingServiceConfigSchema;
```

Scripts can be defined as:
- Arrays of command strings
- Single strings with commands separated by newlines or semicolons

## Plugin Configuration

The package uses a minimal configuration schema:

```typescript
const packageConfigSchema = z.object({
  scripting: ScriptingServiceConfigSchema.prefault({})
});
```

No configuration is required by default. The plugin automatically:
1. Registers chat commands with `AgentCommandService`
2. Adds `ScriptingService` to the application
3. Registers tools with `ChatService`
4. Registers context handlers with `ChatService`
5. Initializes `ScriptingContext` state slices for each agent

## State Management

The scripting package uses `ScriptingContext` for state persistence:

- Variables, lists, and functions persist across script executions
- State is cleared when the chat is reset
- State can be serialized and restored for persistence

### State Schema

```typescript
interface ScriptingContext {
  variables: Map<string, string>;
  lists: Map<string, string[]>;
  functions: Map<string, { type: 'static' | 'llm' | 'js', params: string[], body: string }>;
}
```

### State Serialization

The context supports serialization and deserialization:

```typescript
// Serialize state
const serialized = context.serialize();

// Deserialize state
context.deserialize(serialized);
```

### State Reset

State is automatically reset when the chat is reset:

```typescript
// Reset happens on chat reset
context.reset(["chat"]);
```

## Integration with Agent System

The package integrates with the Token Ring agent system by:

1. **State Management**: Registers `ScriptingContext` as an agent state slice for persistence
2. **Command Registration**: Registers chat commands with `AgentCommandService`
3. **Service Registration**: Implements `TokenRingService` for integration with the app framework
4. **Tool Registration**: Registers tools with `ChatService`
5. **Context Handlers**: Registers context handlers with `ChatService`

## Service Registration

The package registers the `ScriptingService` with the application:

```typescript
const scriptingService = new ScriptingService(config.scripting ?? {});
app.addServices(scriptingService);

// Register function with the service
scriptingService.registerFunction("runAgent", {
  type: 'native',
  params: ['agentType', 'message', 'context'],
  async execute(this: ScriptingThis, agentType: string, message: string, context: string): Promise<string> {
    // Implementation
  }
});
```

## Reserved Function Names

The following names cannot be used for functions:
- `var`, `vars`, `func`, `funcs`, `call`, `echo`, `sleep`, `prompt`, `confirm`, `list`, `lists`, `if`, `for`, `while`, `script`

## Error Handling

The scripting system provides comprehensive error handling:

- **Invalid command syntax**: Throws `CommandFailedError` with descriptive message
- **Undefined variables**: Throws error when accessing undefined variable
- **Undefined functions**: Throws error when calling undefined function
- **Runtime execution errors**: Catches and reports JavaScript execution errors
- **Infinite loop protection**: Maximum 1000 iterations for while loops
- **Function argument validation**: Validates argument count matches parameter count
- **List and variable name conflicts**: Prevents naming conflicts between variables and lists
- **Unmatched braces**: Throws error for unbalanced block syntax

**Error Types:**
- `CommandFailedError` - For command syntax and execution errors
- `Error` - For function execution and runtime errors

## Utility Functions

### parseArguments

Parses function arguments respecting quotes and nested structures:

```typescript
function parseArguments(argsStr: string): string[] {
  // Handles quoted strings, nested parentheses, and escaped characters
}
```

**Examples:**
```typescript
parseArguments('"hello", "world"') // ['hello', 'world']
parseArguments('arg1, (nested), arg3') // ['arg1', '(nested)', 'arg3']
```

### parseScript

Parses script content into individual commands:

```typescript
function parseScript(script: string): string[] {
  // Handles multi-line scripts, semicolon separators, and block structures
}
```

**Examples:**
```typescript
parseScript('/echo hello; /echo world') // ['/echo hello', '/echo world']
parseScript('/echo hello\n/echo world') // ['/echo hello', '/echo world']
```

### blockParser

Provides block parsing utilities:

- `extractBlock(input, startPos)` - Extracts a balanced block from input
- `parseBlock(body)` - Parses block content into individual commands

**Examples:**
```typescript
extractBlock('/if $cond { /echo true } else { /echo false }', 0)
// { content: '/echo true } else { /echo false', endPos: 45 }

parseBlock('/echo hello; /echo world') // ['/echo hello', '/echo world']
```

### executeBlock

Executes a list of commands in the given agent context:

```typescript
async function executeBlock(commands: string[], agent: Agent): Promise<void> {
  // Executes each command, handling both direct commands and interpolated text
}
```

## Best Practices

### Variable Naming

- Use descriptive names: `$userName` instead of `$u`
- Prefix variables with `$` when referencing
- Use camelCase for multi-word names

### Function Design

- Keep functions focused on single responsibilities
- Use descriptive function names
- Document function purpose in comments
- Test functions independently

### Script Organization

- Group related commands into scripts
- Use meaningful script names
- Document script purpose and expected input
- Keep scripts modular and reusable

### Error Handling

- Check for undefined variables before use
- Validate function arguments
- Use try-catch for critical operations
- Provide meaningful error messages

### Performance

- Avoid unnecessary function calls
- Use static functions for simple text generation
- Limit while loop iterations
- Cache frequently used values in variables

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
├── schema.ts                # Configuration schema
├── commands.ts              # Command registry
├── tools.ts                 # Tool registry
├── contextHandlers.ts       # Context handler registry
├── commands/              # Chat command implementations
│   ├── script.ts          # Script management
│   ├── var.ts             # Variable definition
│   ├── func.ts            # Function definition
│   ├── vars.ts            # Variable listing
│   ├── funcs.ts           # Function listing
│   ├── call.ts            # Function execution
│   ├── echo.ts            # Text output
│   ├── sleep.ts           # Delay execution
│   ├── prompt.ts          # User input
│   ├── confirm.ts         # Confirmation
│   ├── list.ts            # List definition
│   ├── lists.ts           # List listing
│   ├── if.ts              # Conditional execution
│   ├── for.ts             # List iteration
│   ├── while.ts           # Loop execution
│   └── eval.ts            # Dynamic execution
├── tools/                 # Tool implementations
│   └── runScript.ts       # Script execution tool
├── state/                 # State management
│   └── ScriptingContext.ts # Context state slice
├── utils/                 # Utility functions
│   ├── parseScript.ts     # Script parsing
│   ├── parseArguments.ts  # Argument parsing
│   ├── executeBlock.ts    # Block execution
│   └── blockParser.ts     # Block parsing
└── design/                # Design documentation
    └── PATTERNS.md        # Product design patterns
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service
- `@tokenring-ai/agent` (0.2.0) - Agent system
- `@tokenring-ai/utility` (0.2.0) - Utility functions
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

- **@tokenring-ai/agent** - Core agent system
- **@tokenring-ai/chat** - Chat service and tools
- **@tokenring-ai/app** - Application framework
- **@tokenring-ai/utility** - Utility functions

## License

MIT License - see `LICENSE` file for details.
