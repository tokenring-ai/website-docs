# @tokenring-ai/scripting

Custom workflow language for defining complex, reusable agent command sequences.

## User Guide

### Overview

The TokenRing AI Scripting package provides a powerful scripting language for automating
workflows, managing variables, defining functions, and integrating with AI models. It
supports script execution, control flow (conditionals, loops), variables, lists, and
dynamic function execution with support for expression, JavaScript, LLM-powered, and
native functions.

### Key Features

- **Script Management**: Run predefined sequences of chat commands
- **Scripting Language**: Comprehensive language with variables, functions, and control
  flow
- **Variable Interpolation**: Dynamic substitution of variables (`$var`) and lists
  (`@list`) in text
- **Function Types**: Expression, JavaScript, LLM-powered, and native functions
- **Control Flow**: Conditionals (`/if`), loops (`/for`, `/while`), and interactive
  commands
- **Interactive Commands**: Prompts, confirmations, and user input
- **State Management**: Persistent variables, lists, and functions across chat sessions
- **Global Functions**: Register functions available to all scripting contexts
- **Context Handlers**: Available scripts context for AI assistance
- **Native Agent Integration**: Built-in `runAgent` function for subagent execution
- **Block Parsing**: Support for nested blocks with balanced brace parsing
- **Argument Parsing**: Smart argument parsing that respects quotes and nested structures

### Chat Commands

#### Script Management

| Command | Description | Example |
|---------|-------------|---------|
| `/script list` | Lists all available scripts | `/script list` |
| `/script run <scriptName>` | Runs the specified script | `/script run setupProject` |
| `/script info <scriptName>` | Shows information about a script | `/script info setupProject` |

#### Variable Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/var set $name = value` | Define or update a variable | `/var set $name = "Alice"` |
| `/var set $name = llm("prompt")` | Define variable with LLM response | `/var set $summary = llm("Summarize the text")` |
| `/var set $name = func("arg")` | Define variable with function result | `/var set $result = process($input)` |
| `/var delete $name` | Delete a variable | `/var delete $temp` |
| `/vars list` | List all variables | `/vars list` |
| `/vars show $name` | Show a specific variable | `/vars show $name` |
| `/vars clear` | Clear all variables | `/vars clear` |

#### Function Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/function define expr name($p) => "text"` | Define expression function. Aliases: `/func define expr`, `/func define expression`, `/function define expression` | `/func define expr greet($name) => "Hello, $name!"` |
| `/function define llm name($p) => "prompt"` | Define LLM function. Alias: `/func define llm` | `/func define llm analyze($text) => "Analyze: $text"` |
| `/function define js name($p) { code }` | Define JavaScript function. Aliases: `/func define js`, `/func define javascript`, `/function define javascript` | `/func define js wordCount($text) { return $text.split(/\s+/).length; }` |
| `/function delete name` | Delete a function. Alias: `/func delete` | `/func delete greet` |
| `/functions list` | List all functions (local and global). Alias: `/function list` | `/functions list` |
| `/function show name` | Show a specific function | `/function show greet` |
| `/functions clear` | Clear all local functions. Aliases: `/function clear`, `/func clear` | `/functions clear` |

#### Function Execution

| Command | Description | Example |
|---------|-------------|---------|
| `/call functionName("arg1", "arg2")` | Call a function with arguments and display output | `/call greet("World")` |

#### List Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/list @name = ["item1", "item2"]` | Define a static list | `/list @files = ["file1.txt", "file2.txt"]` |
| `/list @name = [$var1, $var2]` | Define list from variables | `/list @items = [$item1, $item2]` |
| `/list @name = functionName("arg")` | Define list from function results | `/list @results = searchResults("query")` |
| `/lists` | List all lists | `/lists` |
| `/lists @name` | Show a specific list | `/lists @files` |

#### Output and Control

| Command | Description | Example |
|---------|-------------|---------|
| `/echo text\x7C$var` | Display text or variable value without LLM processing | `/echo Hello, $name!` |
| `/sleep seconds\x7C$var` | Sleep for specified seconds | `/sleep 5` |
| `/prompt $var "message"` | Prompt user for text input | `/prompt $name "Enter your name:"` |
| `/confirm $var "message"` | Prompt for yes\x2Fno confirmation | `/confirm $proceed "Continue?"` |

#### Control Flow

| Command | Description | Example |
|---------|-------------|---------|
| `/if $condition { commands } [else { commands }]` | Conditional execution | `/if $proceed { /echo Yes } else { /echo No }` |
| `/for $item in @list { commands }` | Iterate over lists | `/for $file in @files { /echo Processing $file }` |
| `/while $condition { commands }` | Execute while condition is truthy | `/while $continue { /echo Running... }` |

#### Evaluation

| Command | Description | Example |
|---------|-------------|---------|
| `/eval <command with $vars>` | Interpolates variables in the command string and then executes it | `/eval /$cmd Hello World` |

### Tools

#### script_run

Run a script with the given input. Scripts are predefined sequences of chat commands.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scriptName` | `string` | Yes | The name of the script to run |

**Required Context Handlers:**

- `available-scripts` - Required to determine available scripts

**Usage:**

```typescript
const result = await agent.useTool("script_run", {
  scriptName: "setupProject"
});
```

### Configuration

Scripts are configured in your application config file:

```yaml
scripting:
  setupProject:
    - /agent switch writer
    - /template run projectSetup ${input}
    - /tools enable filesystem
    - /agent switch publisher
  publishWorkflow:
    - /agent switch publisher
    - /publish ${input}
    - /notify "Published successfully"
```

Scripts can be defined as:

- Arrays of command strings
- Single strings with commands separated by newlines or semicolons

### Integration

The scripting package integrates with the Token Ring application through:

- **Chat Commands**: Registered with `AgentCommandService`
- **Tools**: Registered with `ChatService`
- **Context Handlers**: Registered with `ChatService`
- **Global Functions**: Registered with `ScriptingService`
- **State Management**: `ScriptingContext` state slices for each agent

**Plugin Installation:**

```typescript
import scriptingPlugin from "@tokenring-ai/scripting/plugin";

app.install(scriptingPlugin, {
  scripting: {
    // Script configurations
  }
});
```

### Best Practices

#### Variable Naming

- Use descriptive names: `$userName` instead of `$u`
- Prefix variables with `$` when referencing
- Use camelCase for multi-word names

#### Function Design

- Keep functions focused on single responsibilities
- Use descriptive function names
- Document function purpose in comments
- Test functions independently

#### Script Organization

- Group related commands into scripts
- Use meaningful script names
- Document script purpose and expected input
- Keep scripts modular and reusable

#### Error Handling

- Check for undefined variables before use
- Validate function arguments
- Use try-catch for critical operations
- Provide meaningful error messages

#### Performance

- Avoid unnecessary function calls
- Use expression functions for simple text generation
- Limit while loop iterations
- Cache frequently used values in variables

### Usage Examples

#### Basic Variables and Functions

```bash
# Define variables
/var set $name = "Alice"
/var set $topic = "AI safety"

# Define and use functions
/func define expr greet($name) => "Hello, $name!"
/func define llm summary($text) => "Summarize: $text"
/func define js currentDate() { return new Date().toISOString() }

# Use functions
/call greet($name)
/echo Current date: $currentDate
```

#### Lists and Iteration

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

#### Interactive Workflows

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

#### LLM-Powered Functions

```bash
# LLM-powered functions
/func define llm analyze($text) => "Analyze the sentiment of this text: $text"

# Use LLM functions
/var set $sentiment = llm("I love this product!")
/echo Analysis: $sentiment
```

#### JavaScript Functions

```bash
# JavaScript functions
/func define js wordCount($text) {
  return $text.split(/\s+/).length;
}

# Use JavaScript functions
/var set $count = wordCount("Hello world from TokenRing")
/echo Word count: $count
```

#### Script Execution

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
/script run setupProject
```

#### Calling Native Functions

```bash
# Execute a subagent using the runAgent function
/var set $result = runAgent("writer", "Generate a summary of the latest AI trends", "Recent breakthroughs in neural networks")
/echo Sub-agent result: $result
```

#### Control Flow Examples

```bash
# While loop with counter
/var set $count = "0"
/while $count < "5" {
  /echo Count: $count
  /var set $count = $count + 1
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

#### Variable Assignment with LLM

```bash
# Assign LLM response to variable
/var set $summary = llm("Summarize the latest AI developments in 3 sentences")

# Use LLM with variable interpolation
/var set $text = "The project aims to build an AI system"
/var set $analysis = llm("Analyze this text: $text")

/echo Analysis: $analysis
```

#### Variable Interpolation

```bash
# Variable interpolation in text
/var set $name = "World"
/echo Hello, $name!

# List interpolation
/list @items = ["apple", "banana", "cherry"]
/echo Fruits: @items

# Mixed interpolation
/var set $prefix = "Items:"
/echo $prefix @items
```

#### Dynamic Command Execution

```bash
# Store command in variable
/var set $cmd = echo

# Execute dynamically
/eval /$cmd "Hello World"

# Dynamic command with variables
/var set $filename = "data.txt"
/eval /process $filename
```

## Developer Reference

### Core Components

#### ScriptingService

Manages and executes scripts, variables, functions, and scripting language features.
Implements the `TokenRingService` interface.

**File:** `pkg/scripting/ScriptingService.ts`

**Exports:** `import ScriptingService from "@tokenring-ai/scripting"`

**Properties:**

- `name: "ScriptingService"` - Service identifier
- `description` - Service description
- `scripts` - Registry of predefined scripts (`KeyedRegistry`)
- `functions` - Registry of global functions (`KeyedRegistry`)

**Key Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `registerFunction` | `name: string, func: ScriptFunction` | Registers a global function |
| `resolveFunction` | `name: string, agent: Agent` | Resolves function from local context or global registry |
| `executeFunction` | `funcName: string, args: string[], agent: Agent` | Executes a function with arguments |
| `runScript` | `scriptName: string, agent: Agent` | Executes a script by name |
| `attach` | `agent: Agent` | Initializes `ScriptingContext` state for agent |
| `getScriptByName` | `name: string` | Gets a script by name |
| `listScripts` | - | Lists all script names |
| `getFunction` | `name: string` | Gets a global function by name |
| `listFunctions` | - | Lists all global function names |

**Function Types:**

| Type | Description |
|------|-------------|
| `expression` | Returns fixed text with variable interpolation |
| `js` | JavaScript functions with access to agent context |
| `llm` | LLM-powered functions with prompts |
| `native` | Native function implementations (e.g., `runAgent`) - only available globally |

**Types:**

```typescript
export type ScriptResult = {
  ok: boolean;
  output?: string;
  error?: string;
  nextScriptResult?: ScriptResult;
};

export type ScriptingThis = {
  agent: Agent;
};

export type ScriptFunction =
  | {
      type: "expression" | "llm" | "js";
      params: string[];
      body: string;
    }
  | {
      type: "native";
      params: string[];
      execute(...args: string[]): string | string[] | Promise<string | string[]>;
    };
```

#### ScriptingContext

Manages state for scripting including variables (`$name`), lists (`@name`), and
functions. Implements `AgentStateSlice` for persistence.

**File:** `pkg/scripting/state/ScriptingContext.ts`

**Properties:**

- `name: "ScriptingContext"` - State slice identifier
- `variables: Map<string, string>` - Variable storage
- `lists: Map<string, string[]>` - List storage
- `functions: Map<string, Function>` - Local function storage
  (expression, llm, js only)

**Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `setVariable` | `name: string, value: string` | Set a variable value |
| `getVariable` | `name: string` | Get a variable value |
| `setList` | `name: string, value: string[]` | Set a list value |
| `getList` | `name: string` | Get a list value |
| `defineFunction` | `name: string, type: "expression" \| "llm" \| "js", params: string[], body: string` | Define a local function |
| `getFunction` | `name: string` | Get a local function |
| `interpolate` | `text: string` | Interpolate variables (`$var`) and lists (`@list`) in text |
| `show` | - | Get formatted state information |
| `serialize` | - | Serialize state for persistence |
| `deserialize` | `data` | Restore state from serialization |
| `reset` | - | Reset state (clears all variables, lists, and functions) |

**Serialization Schema:**

```typescript
const serializationSchema = z.object({
  variables: z.array(z.tuple([z.string(), z.string()])),
  lists: z.array(z.tuple([z.string(), z.array(z.string())])),
  functions: z.array(
    z.tuple([
      z.string(),
      z.object({
        type: z.enum(["expression", "llm", "js"]),
        params: z.array(z.string()),
        body: z.string(),
      }),
    ]),
  ),
});
```

### Services

#### ScriptingService (Service Implementation)

The `ScriptingService` is the core service that manages scripts, functions, and
execution:

```typescript
import ScriptingService from "@tokenring-ai/scripting/ScriptingService";

const scriptingService = new ScriptingService(config.scripting ?? {});
app.addServices(scriptingService);
```

**Service Interface:**

- Implements `TokenRingService`
- Provides script and function registries
- Manages script execution
- Resolves and executes functions
- Attaches to agents and initializes state

### Provider Documentation

The scripting package does not define provider interfaces.

### RPC Endpoints

The scripting package does not define direct RPC endpoints. Instead, it provides:

- **Chat Commands**: Available via the `AgentCommandService`
- **Tools**: Available via the `ChatService`
- **Functions**: Available through the `ScriptingService`

### Schema Definitions

#### ScriptingServiceConfigSchema

Schema for configuring predefined scripts:

```typescript
export const ScriptSchema = z.union([z.string(), z.array(z.string())]);
export type Script = z.infer<typeof ScriptSchema>;

export const ScriptingServiceConfigSchema = z.record(z.string(), ScriptSchema);
export type ParsedScriptingServiceConfig = z.output<typeof ScriptingServiceConfigSchema>;
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| (script name) | `string \| string[]` | Script name mapped to commands (string or array of strings) |

#### ScriptingFunctionSchema

Schema for defining functions:

```typescript
export const ScriptingFunctionSchema = z.object({
  type: z.enum(["expression", "llm", "js"]),
  params: z.array(z.string()),
  body: z.string(),
});

export type ScriptionFunction = z.infer<typeof ScriptingFunctionSchema>;
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"expression" \| "llm" \| "js"` | The function type |
| `params` | `string[]` | Array of parameter names |
| `body` | `string` | Function body (expression text, LLM prompt, or JavaScript code) |

#### Serialization Schema

Schema for persisting scripting context state:

```typescript
const serializationSchema = z.object({
  variables: z.array(z.tuple([z.string(), z.string()])),
  lists: z.array(z.tuple([z.string(), z.array(z.string())])),
  functions: z.array(
    z.tuple([
      z.string(),
      z.object({
        type: z.enum(["expression", "llm", "js"]),
        params: z.array(z.string()),
        body: z.string(),
      }),
    ]),
  ),
});
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `variables` | `[string, string][]` | Array of variable name-value pairs |
| `lists` | `[string, string[]][]` | Array of list name-value pairs |
| `functions` | `[string, Function][]` | Array of function name-definition pairs |

### Scripting Functions

The package registers a global native function:

#### runAgent

The scripting package provides a built-in `runAgent` function for running subagents.
This is registered globally by the plugin and is not available as a local function.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentType` | `string` | The type of agent to run |
| `message` | `string` | The message to send to the agent |
| `context` | `string` | Additional context for the agent |

**Returns:** The agent's response as a string

**Throws:** Error if subagent execution fails

**Usage:**

```bash
/var set $result = runAgent("writer", "Generate a summary", "Context here")
/echo Result: $result
```

### Reserved Function Names

The following names cannot be used for functions:

`var`, `vars`, `func`, `funcs`, `call`, `echo`, `sleep`, `prompt`, `confirm`, `list`,
`lists`, `if`, `for`, `while`, `script`

### Error Handling in Scripts

The scripting system provides comprehensive error handling:

- **Invalid command syntax**: Throws `CommandFailedError` with descriptive message
- **Undefined variables**: Throws error when accessing undefined variable
- **Undefined functions**: Throws error when calling undefined function
- **Runtime execution errors**: Catches and reports JavaScript execution errors
- **Infinite loop protection**: Maximum 1000 iterations for while loops
- **Function argument validation**: Validates argument count matches parameter count
- **List and variable name conflicts**: Prevents naming conflicts between variables and
  lists
- **Unmatched braces**: Throws error for unbalanced block syntax

**Error Types:**

- `CommandFailedError` - For command syntax and execution errors
- `Error` - For function execution and runtime errors

### Utility Functions

#### parseArguments

Parses function arguments respecting quotes and nested structures:

```typescript
export function parseArguments(argsStr: string): string[] {
  // Handles quoted strings, nested parentheses, and escaped characters
}
```

**Examples:**

```typescript
parseArguments('"hello", "world"') // ['hello', 'world']
parseArguments('arg1, (nested), arg3') // ['arg1', '(nested)', 'arg3']
```

#### parseScript

Parses script content into individual commands:

```typescript
export function parseScript(script: string): string[] {
  // Handles multi-line scripts, semicolon separators, and block structures
  // Respects brace depth for nested blocks
}
```

**Examples:**

```typescript
parseScript('/echo hello; /echo world') // ['/echo hello', '/echo world']
parseScript('/echo hello\n/echo world') // ['/echo hello', '/echo world']
parseScript('/if $cond { /echo true }') // ['/if $cond { /echo true }']
```

#### blockParser

Provides block parsing utilities:

- `extractBlock(input, startPos)` - Extracts a balanced block from input
- `parseBlock(body)` - Parses block content into individual commands

**Examples:**

```typescript
extractBlock('/if $cond { /echo true } else { /echo false }', 0)
// { content: '/echo true } else { /echo false', endPos: 45 }

parseBlock('/echo hello; /echo world') // ['/echo hello', '/echo world']
```

#### executeBlock

Executes a list of commands in the given agent context:

```typescript
export async function executeBlock(
  commands: string[],
  agent: Agent
): Promise<void> {
  // Executes each command, handling both direct commands and interpolated text
}
```

### State Management

The scripting package uses `ScriptingContext` for state persistence:

**State Slice:**

```typescript
interface ScriptingContext {
  variables: Map<string, string>;
  lists: Map<string, string[]>;
  functions: Map<
    string,
    { type: "expression" | "llm" | "js"; params: string[]; body: string }
  >;
}
```

**Persistence:**

State is automatically persisted and restored:

```typescript
// State is initialized when agent attaches to service
agent.initializeState(ScriptingContext, {});

// State is serialized for checkpointing
const serialized = context.serialize();

// State is restored from checkpoint
context.deserialize(serialized);

// State is reset on chat reset
context.reset();
```

**Checkpoint Generation:**

State checkpoints are generated automatically during:

- Chat session persistence
- Agent state serialization
- Checkpoint-based recovery

### Usage Examples (Developer)

#### Plugin Registration

```typescript
import scriptingPlugin from "@tokenring-ai/scripting/plugin";

app.install(scriptingPlugin, {
  scripting: {
    // Script configurations
  },
});
```

#### Service Registration

The package automatically registers `ScriptingService`:

```typescript
const scriptingService = new ScriptingService(config.scripting ?? {});
app.addServices(scriptingService);

// Register function with the service
scriptingService.registerFunction("runAgent", {
  type: "native",
  params: ["agentType", "message", "context"],
  async execute(
    this: ScriptingThis,
    agentType: string,
    message: string,
    context: string
  ): Promise<string> {
    // Implementation
  },
});
```

#### Tool Registration

The package registers the `script_run` tool:

```typescript
chatService.addTools([
  {
    name: "script_run",
    description: "Run a script with the given input",
    inputSchema: z.object({
      scriptName: z.string(),
    }),
    execute: async ({ scriptName }, agent) => {
      const scriptingService = agent.requireServiceByType(ScriptingService);
      return await scriptingService.runScript(scriptName, agent);
    },
  },
]);
```

#### Context Handler Registration

The package registers context handlers:

```typescript
chatService.registerContextHandlers({
  "available-scripts": async function* getContextItems({ agent }) {
    const scriptingService = agent.requireServiceByType(ScriptingService);
    const scriptNames = scriptingService.listScripts();

    if (scriptNames.length > 0) {
      yield {
        role: "user",
        content:
          "The following scripts are available for use with the script tool:\n" +
          scriptNames.map((name) => `- ${name}`).join("\n"),
      };
    }
  },
});
```

### Testing

The package uses vitest for testing with coverage reports:

```bash
bun run test          # Run tests
bun run test:watch    # Watch mode
bun run test:coverage # Generate coverage report
```

**Test Files:**

- `test/blockParser.test.ts` - Block parsing utilities
- `test/context.test.ts` - ScriptingContext state
- `test/ScriptingService.test.ts` - Core service
- `test/commands.integration.test.ts` - Command integration
- `test/utils.test.ts` - Utility functions
- `test/commands.test.ts` - Command implementations
- `test/flaws.test.ts` - Edge case testing
- `test/functions.test.ts` - Function execution

## Dependencies

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | workspace:* | Application framework |
| `@tokenring-ai/chat` | workspace:* | Chat service |
| `@tokenring-ai/agent` | workspace:* | Agent system |
| `@tokenring-ai/utility` | workspace:* | Utility functions |
| `zod` | ^4.4.3 | Schema validation |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

## Related Components

- **@tokenring-ai/agent** - Core agent system
- **@tokenring-ai/chat** - Chat service and tools
- **@tokenring-ai/app** - Application framework
- **@tokenring-ai/utility** - Utility functions

## Package Structure

```bash
pkg/scripting/
├── index.ts                 # Type exports
├── plugin.ts                # Plugin registration
├── ScriptingService.ts      # Core scripting service
├── schema.ts                # Configuration schema
├── commands.ts              # Command registry
├── tools.ts                 # Tool registry
├── contextHandlers.ts       # Context handler registry
├── commands/                # Chat command implementations
│   ├── echo.ts              # Echo command
│   ├── call.ts              # Function call command
│   ├── eval.ts              # Evaluation command
│   ├── prompt.ts            # User prompt command
│   ├── confirm.ts           # Confirmation command
│   ├── sleep.ts             # Sleep/delay command
│   ├── if.ts                # Conditional execution
│   ├── for.ts               # List iteration
│   ├── while.ts             # Loop execution
│   ├── var/                 # Variable commands
│   │   ├── _shared.ts       # Shared utilities
│   │   ├── set.ts           # Variable setting
│   │   └── delete.ts        # Variable deletion
│   ├── vars/                # Variable management commands
│   │   ├── list.ts          # Variable listing
│   │   ├── show.ts          # Variable display
│   │   └── clear.ts         # Variable clearing
│   ├── func/                # Function commands
│   │   ├── _shared.ts       # Shared utilities
│   │   ├── defineExpression.ts # Expression function definition
│   │   ├── defineJs.ts      # JavaScript function definition
│   │   ├── defineLLM.ts     # LLM function definition
│   │   ├── delete.ts        # Function deletion
│   │   ├── list.ts          # Function listing
│   │   ├── show.ts          # Function display
│   │   └── clear.ts         # Function clearing
│   ├── script/              # Script commands
│   │   ├── list.ts          # Script listing
│   │   ├── run.ts           # Script execution
│   │   └── info.ts          # Script information
│   ├── list.ts              # List definition
│   └── lists.ts             # List listing
├── tools/                   # Tool implementations
│   └── runScript.ts         # Script execution tool
├── state/                   # State management
│   └── ScriptingContext.ts  # Context state slice
├── utils/                   # Utility functions
│   ├── parseScript.ts       # Script parsing
│   ├── parseArguments.ts    # Argument parsing
│   ├── executeBlock.ts      # Block execution
│   └── blockParser.ts       # Block parsing
├── contextHandlers/         # Context handler implementations
│   └── availableScripts.ts  # Available scripts context
└── test/                    # Test files
    ├── blockParser.test.ts
    ├── context.test.ts
    ├── ScriptingService.test.ts
    ├── commands.integration.test.ts
    ├── utils.test.ts
    ├── commands.test.ts
    ├── flaws.test.ts
    └── functions.test.ts
```

## License

MIT License - see LICENSE file for details.
