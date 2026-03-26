# @tokenring-ai/chat

The `@tokenring-ai/chat` package provides AI chat capabilities for the Token Ring ecosystem. It enables AI-powered conversations with advanced context management, tool integration, and interactive command-line controls. The package integrates seamlessly with the Token Ring application framework and supports multiple AI providers through the ChatModelRegistry system.

## Overview

The chat package is the core component for AI interactions in the Token Ring ecosystem. It provides:

- **Multi-Provider Support**: Works with various AI model providers (OpenAI, Anthropic, etc.) via `@tokenring-ai/ai-client`
- **Context Management**: Intelligent context handling with automatic compaction and customizable context sources
- **Tool Integration**: Extensible tool system with plugin architecture and wildcard matching
- **Hidden Tools**: Ability to hide tools from the model while keeping them available, with search functionality
- **Interactive Commands**: Rich command set for chat management including `/chat`, `/model`, `/tools`, and `/compact`
- **State Preservation**: Persistent chat history with message history management and message stack for undo operations
- **Interactive Selection**: Tree-based UI for model and tool selection
- **Feature Management**: Advanced model feature flags and capabilities
- **Context Debugging**: Display and inspect chat context for transparency
- **Token Usage Analytics**: Detailed breakdown of input/output tokens, costs, and timing
- **RPC Endpoints**: Remote procedure call support for chat management
- **Tool Call Artifacts**: Automatic output of tool call requests and responses as artifacts
- **Parallel/Sequential Tool Execution**: Configurable tool execution mode with queue-based processing
- **Hook System**: Extensible lifecycle hooks for post-chat completion processing
- **Attachment Support**: Support for text, image, and file attachments in chat messages

## Key Features

- **AI-Powered Conversations**: Seamless integration with multiple AI models and providers
- **Smart Context Management**: Automatic and manual context compaction to manage token limits
- **Flexible Tool System**: Enable, disable, hide, and search tools with wildcard support
- **Interactive CLI**: Rich set of slash commands for all chat operations
- **State Persistence**: Chat history and configuration persist across sessions
- **Model Selection**: Automatic and manual model selection with feature flags
- **Analytics**: Detailed token usage and cost tracking
- **Extensible**: Custom context handlers and tools can be registered

## Core Components

### ChatService

The main service class for managing AI chat functionality. Implements `TokenRingService` and provides comprehensive chat management capabilities.

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = new ChatService(app, options);
```

#### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `app` | TokenRingApp | The application instance |
| `options` | `z.output&lt;typeof ChatServiceConfigSchema&gt;` | Configuration options |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"ChatService"` | Service name identifier |
| `description` | `string` | Service description |
| `app` | `TokenRingApp` | Application instance reference |
| `options` | `ParsedChatConfig` | Configuration options |
| `defaultModel` | `string \| null` | Selected default model |

#### Methods

##### Service Lifecycle

| Method | Description |
|--------|-------------|
| `start()` | Initialize the service and select default model |
| `attach(agent, creationContext)` | Attach service to agent with state initialization |

##### Model Management

| Method | Description |
|--------|-------------|
| `setModel(model: string, agent: Agent): void` | Set the AI model for the agent |
| `getModel(agent: Agent): string \| null` | Get the current model name or null |
| `requireModel(agent: Agent): string` | Get the current model or throw an error if not set |
| `getModelAndSettings(agent: Agent)` | Get model and settings using `getModelAndSettings` utility |

##### Configuration Management

| Method | Description |
|--------|-------------|
| `getChatConfig(agent: Agent): ParsedChatConfig` | Get current chat configuration |
| `updateChatConfig(aiConfig: Partial&lt;ParsedChatConfig&gt;, agent: Agent): void` | Update configuration with partial updates |

##### Message History Management

| Method | Description |
|--------|-------------|
| `getChatMessages(agent: Agent): StoredChatMessage[]` | Get all chat messages |
| `getLastMessage(agent: Agent): StoredChatMessage \| null` | Get the last message or null |
| `pushChatMessage(message: StoredChatMessage, agent: Agent): void` | Add a message to history |
| `clearChatMessages(agent: Agent): void` | Clear all messages |
| `popMessage(agent: Agent): void` | Remove the last message (undo) |

##### Tool Management

| Method | Description |
|--------|-------------|
| `addTools(tools: Record&lt;string, TokenRingToolDefinition<any&gt;>)` | Register tools from a package |
| `getAvailableToolNames(): string[]` | Get all available tool names |
| `getAvailableToolEntries()` | Get all available tool definitions as entries |
| `getToolNamesLike(pattern: string): string[]` | Get tool names matching a pattern |
| `ensureToolNamesLike(pattern: string): string[]` | Expand wildcard patterns to tool names |
| `getEnabledTools(agent: Agent): string[]` | Get enabled tool names |
| `getHiddenTools(agent: Agent): string[]` | Get hidden tool names |
| `setEnabledTools(toolNames: string[], agent: Agent): string[]` | Set exactly enabled tools |
| `enableTools(toolNames: string[], agent: Agent): string[]` | Enable additional tools |
| `disableTools(toolNames: string[], agent: Agent): string[]` | Disable tools |
| `hideTools(toolNames: string[], agent: Agent): string[]` | Hide tools (remove from enabled but keep available) |
| `requireTool(toolName: string): NamedTool` | Get a tool by name |

##### Context Handler Management

| Method | Description |
|--------|-------------|
| `getContextHandlerByName(name: string): ContextHandler \| undefined` | Get a context handler by name |
| `requireContextHandlerByName(name: string): ContextHandler` | Get a context handler or throw an error |
| `registerContextHandler(name: string, handler: ContextHandler): void` | Register a single context handler |
| `registerContextHandlers(handlers: Record&lt;string, ContextHandler&gt;): void` | Register multiple context handlers |

##### Message Building

| Method | Description |
|--------|-------------|
| `buildChatMessages(options: BuildChatMessagesOptions): Promise&lt;ContextItem[]&gt;` | Build chat request messages from context handlers |

##### Compaction Management

| Method | Description |
|--------|-------------|
| `getPendingCompaction(agent: Agent): StoredChatCompaction \| null` | Get pending compaction state |
| `hasPendingCompaction(agent: Agent): boolean` | Check if there is pending compaction |
| `isCompactionInProgress(agent: Agent): boolean` | Check if compaction is currently in progress |
| `applyPendingCompaction(agent: Agent): boolean` | Apply pending compaction to current message |
| `stageContextCompaction(compactionConfig, agent: Agent): Promise&lt;boolean&gt;` | Stage a compaction for later application |
| `compactContext(compactionConfig, agent: Agent): Promise&lt;void&gt;` | Perform immediate context compaction |

### ChatServiceState

The state management class that tracks chat state for each agent:

**State Properties:**
- `currentConfig`: Current chat configuration (model, tools, context settings, etc.)
- `messages`: Array of chat messages with timestamps
- `parallelTools`: Boolean flag for parallel/sequential tool execution mode
- `toolQueue`: Async queue for sequential tool execution
- `initialConfig`: Initial configuration for reset operations
- `pendingCompaction`: Staged compaction waiting to be applied
- `compactionInProgress`: Flag indicating if compaction is currently running

**Methods:**
- `serialize()`: Serialize state for persistence
- `deserialize(data)`: Deserialize state from persistence
- `show()`: Return array of strings for display in agent UI
- `resetSettings()`: Reset configuration to initial values
- `resetChat()`: Clear all chat messages
- `runToolMaybeInParallel(executeToolFunction)`: Execute tool with parallel/sequential mode

**State Persistence:**
- State is persisted across agent sessions
- Uses Zod schema for type-safe serialization/deserialization
- Registered with agent system via `attach()` method

### runChat

Core chat execution function that handles the complete chat lifecycle:

```typescript
import runChat from "@tokenring-ai/chat/runChat";

const response = await runChat({
  input: "Hello, how are you?",
  chatConfig: chatService.getChatConfig(agent),
  agent
});
```

**Parameters:**
- `input`: The user input message
- `attachments`: Optional input attachments (text, image, or file)
- `chatConfig`: Chat configuration including model, tools, and context settings
- `agent`: The agent instance

**Returns:** A promise resolving to the AI response object

**Key Features:**
- Automatic model selection and client management
- Context building from handlers
- Tool execution with parallel/sequential support
- Max steps enforcement with user approval
- Automatic context compaction when threshold exceeded
- Message history management
- Integration with agent lifecycle hooks
- Hook execution via `AfterChatCompletion` event
- Auto-activation of tools with `autoActivate` flag

## Context Handlers

Context handlers build the AI chat request by gathering relevant information. Each handler is an async generator that yields `ChatInputMessage` items:

| Handler | Description |
|---------|-------------|
| `system-message` | Adds the system prompt (supports dynamic system prompts via functions) |
| `prior-messages` | Includes previous conversation history with intelligent truncation |
| `current-message` | Adds the current user input with attachment support |
| `tool-context` | Includes context from enabled tools based on their required context handlers |

### Context Handler Options

Context handlers can be configured with additional options:

- **current-message**: Supports `allowRemoteAttachments` (default: `true`) to control remote attachment handling
- **prior-messages**: Supports `maxMessages` (default: `1000`, min: `4`) to limit the number of prior messages included

## Chat Commands

The package provides the following chat commands:

### /chat - Send messages and manage chat AI settings

#### /chat send &lt;message&gt;

Send a message to the AI chat service. This is the primary command for communicating with the AI, using your selected model and current context.

**Examples:**
```bash
/chat send Hello, how are you?
```

**Features:**
- Uses your selected AI model (see `/model`)
- Includes conversation context and system prompts
- Provides available tools if enabled (see `/tools`)
- Shows detailed token usage analytics after completion
- Supports attachments via `allowAttachments: true`

#### /chat context

Display all context items that would be included in a chat request. Useful for debugging and understanding what information the AI has access to.

**Examples:**
```bash
/chat context
```

**Shows:**
- Total number of context messages
- System prompt configuration
- Previous conversation messages (with preview)

**Note:** Context display shows the exact data sent to the AI model.

#### /chat compact [&lt;focus&gt;]

Compress the conversation context by creating intelligent summaries of prior messages.

**Examples:**
```bash
/chat compact
/chat compact specifics of the task at hand, including the goal and expected outcome
```

**How it works:**
- Analyzes all previous messages in the conversation
- Creates concise summaries while preserving key information
- Maintains conversation flow and important context
- Reduces token count for better performance and cost savings

**When to use:**
- After many messages have been exchanged
- When you notice responses getting slower
- When approaching token limits
- Before starting a new topic in a long conversation

**Benefits:**
- Faster response times in long conversations
- Lower API costs due to reduced token usage
- Maintains important context without losing information
- Prevents context overflow errors

#### /chat reset

Reset the chat context, clearing prior messages and starting a new conversation.

**Examples:**
```bash
/chat reset
```

### /model - Set or show the target model for chat

Manage the AI model used for chat responses.

**Examples:**
```bash
/model                     # Show current model and open selector (unless headless)
/model get                 # Show current model
/model set gpt-5.2         # Set to specific model
/model select              # Interactive model selection
/model reset               # Reset to initial configured model
/model settings            # Manage model feature flags
```

**Special Values:**
- `auto` - Automatically selects best available model
- `auto:reasoning` - Prefers models with advanced reasoning
- `auto:frontier` - Prefers latest cutting-edge models

#### /model get

Show the currently active chat model.

**Examples:**
```bash
/model get
```

#### /model set &lt;model_name&gt;

Set the chat model to a specific model by name.

**Examples:**
```bash
/model set gpt-5.2
```

#### /model select

Open an interactive tree-based selector to choose a chat model. Models are grouped by provider with availability status.

**Examples:**
```bash
/model select
```

#### /model reset

Reset to the initial configured model.

### /model settings - Manage model feature flags

#### /model settings show

Show the currently enabled feature flags and all available settings for the current model.

**Examples:**
```bash
/model settings show
```

**Shows:**
- Current model identifier
- Base model name
- Enabled settings/feature flags
- Available settings for the current model

#### /model settings set &lt;key[=value]&gt;

Set a single model feature flag.

**Examples:**
```bash
/model settings set websearch
/model settings set temperature=0.7
```

#### /model settings enable &lt;key[=value]&gt; ...

Enable one or more model feature flags.

**Examples:**
```bash
/model settings enable reasoning
/model settings enable websearch temperature=0.7
```

#### /model settings disable &lt;key&gt; ...

Disable one or more model feature flags.

**Examples:**
```bash
/model settings disable reasoning
/model settings disable reasoning websearch
```

#### /model settings select

Open an interactive selector to choose which feature flags to enable for the current model.

**Examples:**
```bash
/model settings select
```

### /tools - Manage available tools for your chat session

Manage available tools for your chat session.

**Examples:**
```bash
/tools                    # Show tools and open selector (unless headless)
/tools list               # List enabled tools
/tools enable web-search  # Enable a tool
/tools disable calculator # Disable a tool
/tools set web-search calculator  # Set exactly which tools are enabled
/tools select             # Interactive tool selection
/tools hide calculator    # Hide a tool (keeps it available but not visible to model)
```

#### /tools list

List all currently enabled tools.

**Examples:**
```bash
/tools list
```

#### /tools enable &lt;tool1&gt; [tool2...]

Enable one or more tools by name. Supports wildcard patterns.

**Examples:**
```bash
/tools enable web-search
/tools enable web-search calculator
```

#### /tools disable &lt;tool1&gt; [tool2...]

Disable one or more tools by name. Supports wildcard patterns.

**Examples:**
```bash
/tools disable calculator
/tools disable web-search calculator
```

#### /tools set &lt;tool1&gt; [tool2...]

Set exactly which tools are enabled, replacing the current selection. Supports wildcard patterns.

**Examples:**
```bash
/tools set web-search calculator
```

#### /tools select

Open an interactive tree-based selector to choose which tools to enable. Tools are grouped by package.

**Examples:**
```bash
/tools select
```

#### /tools hide &lt;tool1&gt; [tool2...]

Hide one or more tools by name, requiring the model to search for the tool to activate it before use. Saves context tokens; useful for agents that need access to large numbers of tools.

**Examples:**
```bash
/tools hide calculator
/tools hide web-search calculator
```

### /compact [&lt;focus&gt;]

Alias for `/chat compact` - Compress the conversation context by creating intelligent summaries of prior messages.

**Examples:**
```bash
/compact
/compact focus on the main task details
```

## Services

### ChatService Registration

The ChatService is automatically registered when using the plugin:

```typescript
import ChatService from "@tokenring-ai/chat";
import {TokenRingApp} from "@tokenring-ai/app";

const app = new TokenRingApp();

// Add chat service with default model
app.addServices(new ChatService({
  defaultModels: ["auto"],
  agentDefaults: {
    model: "auto",
    maxSteps: 30,
    compaction: {
      policy: "ask",
      compactionThreshold: 0.5
    },
    enabledTools: [],
    hiddenTools: [],
    context: {
      initial: [
        {type: "system-message"},
        {type: "tool-context"},
        {type: "prior-messages"},
        {type: "current-message"}
      ],
      followUp: [
        {type: "prior-messages"},
        {type: "current-message"}
      ]
    }
  }
}));

await app.start();
```

## Providers

The chat package uses the `ChatModelRegistry` provider from `@tokenring-ai/ai-client` for model selection and client management. This registry provides:

- Model availability tracking (online, cold, offline)
- Model cost information
- Context length specifications
- Automatic client selection and management

## RPC Endpoints

The chat package provides RPC endpoints for remote chat management:

| Endpoint | Type | Request | Response |
|----------|------|---------|----------|
| `getAvailableTools` | Query | `{}` | `{ tools: { [toolName]: { displayName: string } } }` |
| `getModel` | Query | `{ agentId: string }` | `{ model: string \| null }` |
| `setModel` | Mutation | `{ agentId: string, model: string }` | `{ success: boolean }` |
| `getEnabledTools` | Query | `{ agentId: string }` | `{ tools: string[] }` |
| `setEnabledTools` | Mutation | `{ agentId: string, tools: string[] }` | `{ tools: string[] }` |
| `enableTools` | Mutation | `{ agentId: string, tools: string[] }` | `{ tools: string[] }` |
| `disableTools` | Mutation | `{ agentId: string, tools: string[] }` | `{ tools: string[] }` |
| `getChatMessages` | Query | `{ agentId: string }` | `{ messages: StoredChatMessage[] }` |
| `clearChatMessages` | Mutation | `{ agentId: string }` | `{ success: boolean }` |

## Configuration

### Plugin Configuration Schema

The chat plugin is configured through the application's plugin configuration:

```typescript
import {z} from "zod";
import {ChatServiceConfigSchema} from "@tokenring-ai/chat";

const configSchema = z.object({
  chat: ChatServiceConfigSchema,
});
```

**Configuration Options:**

```typescript
const config = {
  chat: {
    // Array of default model names to try for auto-selection
    defaultModels: ["auto"],
    
    // Default configuration for all agents
    agentDefaults: {
      // Default model name (supports "auto", "auto:reasoning", "auto:frontier")
      model: "auto",
      
      // System instructions for the AI (string or function returning string)
      systemPrompt: "You are a helpful assistant",
      
      // Maximum processing steps before prompting for continuation
      maxSteps: 30,
      
      // Compaction settings
      compaction: {
        policy: "ask", // "automatic" \| "ask" \| "never"
        compactionThreshold: 0.5, // Threshold for automatic compaction
        applyThreshold: 0.7, // Threshold for applying pending compaction (defaults to compactionThreshold)
        background: false, // Run compaction in background
        focus: "Default focus text for compaction" // Focus topic for compaction
      },
      
      // List of enabled tool names (supports wildcards)
      enabledTools: [],
      
      // List of hidden tool names (supports wildcards) - hidden from model but available
      hiddenTools: [],
      
      // Context configuration
      context: {
        // Context items for initial messages
        initial: [
          {type: "system-message"},
          {type: "tool-context"},
          {type: "prior-messages"},
          {type: "current-message"}
        ],
        // Context items for follow-up messages
        followUp: [
          {type: "prior-messages"},
          {type: "current-message"}
        ]
      }
    }
  }
};
```

### Chat Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `model` | string | "auto" | AI model identifier (supports "auto", "auto:reasoning", "auto:frontier", or specific model names) |
| `systemPrompt` | string \| Function | - | System instructions for the AI (can be a function for dynamic prompts) |
| `maxSteps` | number | 30 | Maximum processing steps before prompting for continuation |
| `compaction.policy` | string | "ask" | Compaction policy: "automatic", "ask", or "never" |
| `compaction.compactionThreshold` | number | 0.5 | Threshold for automatic compaction (0.0-1.0) |
| `compaction.applyThreshold` | number | compactionThreshold | Threshold for applying pending compaction |
| `compaction.background` | boolean | false | Run compaction in background |
| `compaction.focus` | string | - | Focus topic for compaction |
| `enabledTools` | string[] | [] | List of enabled tool names (supports wildcards) |
| `hiddenTools` | string[] | [] | List of hidden tool names (supports wildcards) |
| `context.initial` | ContextItem[] | [system-message, tool-context, prior-messages, current-message] | Context items for initial messages |
| `context.followUp` | ContextItem[] | [prior-messages, current-message] | Context items for follow-up messages |

### Context Source Types

| Type | Description |
|------|-------------|
| `system-message` | Adds the system prompt |
| `prior-messages` | Adds previous conversation history |
| `current-message` | Adds the current user input |
| `tool-context` | Adds context from enabled tools |

### Compaction Policies

| Policy | Description |
|--------|-------------|
| `automatic` | Automatically compact when threshold is reached |
| `ask` | Ask user before compacting (in non-headless mode) |
| `never` | Never compact automatically |

### Model Selection

The chat package supports various model selection strategies:

- `auto`: Automatically selects the best available model
- `auto:reasoning`: Prefers models with advanced reasoning capabilities
- `auto:frontier`: Prefers the latest cutting-edge models
- Specific model names: e.g., `gpt-4`, `claude-3-opus`

### Model Settings

Model settings can be configured via `/model settings` commands:

- `temperature`: Controls randomness (0.0-2.0)
- `maxTokens`: Maximum response length
- `topP`: Nucleus sampling threshold (0.0-1.0)
- `frequencyPenalty`: Reduce repetition (-2.0 to 2.0)
- `presencePenalty`: Encourage new topics (-2.0 to 2.0)
- `stopSequences`: Sequences to stop at

Settings can be specified as query parameters in the model name:
```
gpt-4?reasoning=1&temperature=0.7
```

## State Management

The chat service maintains state including:

- **Chat message history**: Full request/response pairs with timestamps
- **Current configuration**: Model, tools, and context settings
- **Enabled tools**: List of active tools
- **Hidden tools**: List of hidden tools (available but not visible to model)
- **Tool execution queue**: Sequential tool execution with async queue
- **Parallel tools mode**: Optional parallel tool execution
- **Message stack**: Stack of messages for undo operations
- **Initial configuration**: For reset operations
- **Pending compaction**: Staged compaction waiting to be applied
- **Compaction in progress flag**: Indicates if compaction is currently running

State is automatically managed and preserved across sessions through the `ChatServiceState` class.

### State Structure

```typescript
{
  currentConfig: {
    model: string,
    systemPrompt: string \| Function,
    maxSteps: number,
    compaction: {
      policy: "automatic" \| "ask" \| "never",
      compactionThreshold: number,
      applyThreshold: number,
      background: boolean,
      focus: string
    },
    enabledTools: string[],
    hiddenTools: string[],
    context: {
      initial: ContextItem[],
      followUp: ContextItem[]
    }
  },
  messages: StoredChatMessage[],
  parallelTools: boolean,
  toolQueue: async.queue,
  initialConfig: ParsedChatConfig,
  pendingCompaction: StoredChatCompaction \| null,
  compactionInProgress: boolean
}
```

## Tools

### tokenRingTool

Converts a tool definition to TokenRing format with automatic artifact generation:

```typescript
import {tokenRingTool} from "@tokenring-ai/chat";
import {z} from "zod";

const toolDefinition = tokenRingTool({
  name: "my-tool",
  displayName: "My Tool",
  description: "Does something useful",
  inputSchema: z.object({
    param: z.string()
  }),
  async execute(input, agent) {
    // Tool implementation
    return "result";
  }
});
```

**Tool Result Types:**

- `text`: Simple string result or text object with type and content
  ```typescript
  // String result
  return "Success!";
  
  // Text object
  return { type: "text", text: "Success!" };
  
  // With artifact
  return { type: "text", text: "Success!", artifact: { name: "Result", ... } };
  ```

- `media`: Media result with type, mediaType, and data (base64 encoded)
  ```typescript
  return {
    type: "media",
    mediaType: "image/png",
    data: "base64-encoded-data"
  };
  ```

- `json`: JSON result with type and data (automatically stringified)
  ```typescript
  return {
    type: "json",
    data: { key: "value", number: 42 }
  };
  ```

**Artifact Generation:**
- Tool calls automatically generate artifacts showing request JSON and response
- Media tools generate base64-encoded artifacts
- Errors are caught and reported with clear error messages

### tool_search

Built-in tool for searching hidden tools by regex pattern:

```typescript
{
  name: "tool_search",
  displayName: "Chat/toolSearch",
  description: "Search for tools by regex pattern and enables matching tools",
  inputSchema: z.object({
    regex: z.string().describe("Regex pattern (case-insensitive) to match against tool names and descriptions")
  }),
  async execute({regex}, agent) {
    // Searches hidden tools and enables matching ones
  },
  autoActivate: (agent) => hiddenTools.length > 0
}
```

**Features:**
- Searches tool names and descriptions
- Case-insensitive regex matching
- Automatically enables matching tools
- Only searches hidden tools
- Automatically enabled when `hiddenTools` is configured

## Hooks

The package provides lifecycle hooks for extending chat functionality:

### AfterChatCompletion

Executed after a chat completion is received:

```typescript
import {AfterChatCompletion} from "@tokenring-ai/chat";

// Hook is automatically executed via AgentLifecycleService
// Access response data in hook handlers
class MyHookHandler {
  async executeHook(hook: AfterChatCompletion, agent: Agent) {
    if (hook instanceof AfterChatCompletion) {
      // Process chat completion
      console.log("Chat completed with", hook.response);
    }
  }
}
```

### AfterChatClear

Executed after chat messages are cleared.

### AfterChatCompaction

Executed after context compaction is completed.

## Integration

### Plugin Registration

The chat plugin integrates with the Token Ring application framework:

```typescript
import chatPlugin from "@tokenring-ai/chat/plugin";

// Register the plugin
app.use(chatPlugin, {
  chat: {
    defaultModels: ["auto"],
    agentDefaults: {
      model: "auto",
      systemPrompt: "You are a helpful assistant",
      maxSteps: 30,
      enabledTools: [],
      hiddenTools: []
    }
  }
});
```

### Service Registration

The plugin automatically registers:

- `ChatService`: Main chat service with all methods
- Context handlers for building chat requests
- Interactive chat commands (`/chat`, `/model`, `/tools`, `/compact`)
- Model feature management
- Context debugging tools
- State management via `ChatServiceState`
- RPC endpoints for remote management

### Agent Configuration

Agents can have their own chat configuration merged with service defaults:

```typescript
const agentConfig = {
  chat: {
    model: "gpt-4",
    systemPrompt: "You are a helpful assistant",
    maxSteps: 50,
    compaction: {
      policy: "automatic",
      compactionThreshold: 0.6
    },
    enabledTools: ["web-search", "calculator"],
    hiddenTools: ["advanced-calculator"],
    context: {
      initial: [
        {type: "system-message"},
        {type: "tool-context"},
        {type: "prior-messages"},
        {type: "current-message"}
      ],
      followUp: [
        {type: "prior-messages"},
        {type: "current-message"}
      ]
    }
  }
};
```

### Tool Integration

Tools are registered through packages using the `addTools` method:

```typescript
import ChatService from "@tokenring-ai/chat";
import {z} from "zod";

const chatService = agent.requireServiceByType(ChatService);

chatService.addTools({
  "my-tool": {
    name: "my-tool",
    displayName: "My Tool",
    description: "Does something useful",
    inputSchema: z.object({
      param: z.string()
    }),
    async execute(input, agent) {
      // Tool implementation
      return "result";
    }
  }
});
```

## Usage Examples

### Basic Chat Setup

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import ChatService from "@tokenring-ai/chat";

const app = new TokenRingApp();

// Add chat service with configuration
app.addServices(new ChatService(app, {
  defaultModels: ["auto"],
  agentDefaults: {
    model: "auto",
    systemPrompt: "You are a helpful assistant",
    maxSteps: 30,
    compaction: {
      policy: "ask",
      compactionThreshold: 0.5,
      background: false
    },
    enabledTools: [],
    hiddenTools: [],
    context: {
      initial: [
        {type: "system-message"},
        {type: "tool-context"},
        {type: "prior-messages"},
        {type: "current-message"}
      ],
      followUp: [
        {type: "prior-messages"},
        {type: "current-message"}
      ]
    }
  }
}));

await app.start();
```

### Sending Messages Programmatically

```typescript
import runChat from "@tokenring-ai/chat/runChat";
import ChatService from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);
const chatConfig = chatService.getChatConfig(agent);

const response = await runChat({
  input: "Hello, how are you?",
  chatConfig,
  agent
});
```

### Managing Tools

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);

// Get available tools
const availableTools = chatService.getAvailableToolNames();

// Enable specific tools
chatService.enableTools(["web-search", "calculator"], agent);

// Disable specific tools
chatService.disableTools(["file-system"], agent);

// Set exact tool list
chatService.setEnabledTools(["web-search", "calculator"], agent);

// Use wildcard patterns
chatService.ensureToolNamesLike("web-*"); // Expands to all web-* tools

// Hide tools (keep available but not visible to model)
chatService.hideTools(["advanced-calculator"], agent);

// Get hidden tools
const hiddenTools = chatService.getHiddenTools(agent);
```

### Managing Chat History

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);

// Get all messages
const allMessages = chatService.getChatMessages(agent);

// Get the last message
const lastMessage = chatService.getLastMessage(agent);

// Clear all messages
chatService.clearChatMessages(agent);

// Undo last message (remove from history)
chatService.popMessage(agent);

// Add new message
chatService.pushChatMessage({
  request: { messages: [] },
  response: { content: [] },
  createdAt: Date.now(),
  updatedAt: Date.now()
}, agent);
```

### Interactive Chat Commands

#### Send a Message

```bash
/chat send Hello, how are you?
```

#### Show Context

```bash
/chat context
```

#### Compact Context

```bash
/chat compact
/chat compact focus on the main task details
```

#### Reset Chat

```bash
/chat reset
```

#### Manage Tools

```bash
/tools list                    # List enabled tools
/tools enable web-search       # Enable a tool
/tools disable calculator      # Disable a tool
/tools set web-search calculator  # Set exact tools
/tools select                  # Interactive selection
/tools hide calculator         # Hide a tool
```

#### Manage Model

```bash
/model get                     # Show current model
/model set gpt-4-turbo         # Set specific model
/model select                  # Interactive selection
/model reset                   # Reset to default
```

#### Manage Model Settings

```bash
/model settings show           # Show current settings
/model settings set temperature=0.7  # Set a setting
/model settings enable reasoning     # Enable settings
/model settings disable reasoning    # Disable settings
/model settings select         # Interactive selection
```

### Registering Custom Tools

```typescript
import ChatService from "@tokenring-ai/chat";
import {z} from "zod";

const chatService = agent.requireServiceByType(ChatService);

// Register tools from a package
chatService.addTools({
  "my-tool": {
    name: "my-tool",
    displayName: "My Tool",
    description: "Does something useful",
    inputSchema: z.object({
      param: z.string()
    }),
    async execute(input, agent) {
      return `Processed: ${input.param}`;
    }
  }
});
```

### Parallel Tool Execution

```typescript
import ChatService from "@tokenring-ai/chat";
import {ChatServiceState} from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);
const state = agent.getState(ChatServiceState);

// Enable parallel tool execution
state.parallelTools = true;

// Tools will now execute in parallel instead of sequentially
```

### Custom Context Handlers

```typescript
import ChatService from "@tokenring-ai/chat";
import type {ContextHandler} from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);

// Register custom context handler
chatService.registerContextHandler("custom-context", async function* ({input, agent}) {
  yield {
    role: "user",
    content: `Custom context for: ${input}`
  };
});

// Use in context configuration
const config = chatService.getChatConfig(agent);
config.context.initial.push({type: "custom-context"});
```

### Sending Messages with Attachments

```typescript
import runChat from "@tokenring-ai/chat/runChat";

const response = await runChat({
  input: "Analyze this image",
  attachments: [
    {
      name: "diagram.png",
      mimeType: "image/png",
      encoding: "base64",
      body: "base64-encoded-image-data"
    }
  ],
  chatConfig,
  agent
});
```

### Using Hidden Tools

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);

// Configure hidden tools
chatService.hideTools(["advanced-search", "database-query"], agent);

// The tool_search tool is automatically enabled when hiddenTools is configured
// The AI can search for tools using regex patterns
// Example: tool_search with regex "database.*query" will find and enable "database-query"
```

### Staging Compaction

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);
const chatConfig = chatService.getChatConfig(agent);

// Stage compaction for later application
const staged = await chatService.stageContextCompaction(chatConfig.compaction, agent);

// Later, apply the staged compaction
const applied = chatService.applyPendingCompaction(agent);
```

### Dynamic System Prompt

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = agent.requireServiceByType(ChatService);

// Use a function for dynamic system prompts
chatService.updateChatConfig({
  systemPrompt: () => `You are helping with task: ${currentTask}`
}, agent);
```

## Best Practices

### Model Selection

- Use `auto` for automatic model selection based on availability
- Use `auto:reasoning` for complex reasoning tasks
- Use `auto:frontier` for cutting-edge capabilities
- Set specific models for reproducible results

### Tool Management

- Use wildcard patterns for enabling multiple tools (`web-*`)
- Enable only necessary tools to reduce context overhead
- Use `/tools select` for interactive tool selection
- Use hidden tools for large tool sets to save context tokens
- Use `tool_search` to search for hidden tools by pattern

### Context Optimization

- Enable automatic compaction for long conversations
- Use manual compaction before starting new topics
- Monitor token usage with analytics output
- Use staged compaction for non-blocking compaction
- Configure appropriate thresholds for your use case

### Error Handling

- Always check for `CommandFailedError` in command execution
- Handle model unavailability with retry logic
- Validate tool inputs before execution

### Tool Development

- Always include artifacts for better debugging
- Handle errors gracefully in tool execution
- Use descriptive tool names and descriptions
- Include proper input schema validation
- Use `requiredContextHandlers` to specify context needs

### Hidden Tools

- Use hidden tools when you have many tools available
- Hidden tools save context tokens while remaining accessible
- The `tool_search` tool enables dynamic tool activation
- Configure appropriate search patterns for your tools

### Attachment Handling

- Use appropriate MIME types for attachments
- Handle different encoding formats (text, base64, href)
- Consider `allowRemoteAttachments` setting for security
- Validate attachment sizes before processing

## Monitoring and Debugging

### Context Debugging

Use `/chat context` to view the current context structure:

```bash
/chat context
```

This shows all context items that would be included in a chat request.

### Compact Context

Use `/chat compact` or `/compact` to summarize messages and reduce token usage:

```bash
/chat compact
/chat compact focus on the main task details
```

### Analytics

The `getChatAnalytics` function provides detailed token usage and cost information:

```typescript
import {getChatAnalytics} from "@tokenring-ai/chat";

const analytics = getChatAnalytics(response);
console.log(analytics);
```

Output includes:
- Input/Output/Total token counts
- Cached token information
- Reasoning tokens (if applicable)
- Cost breakdown (input, output, total)
- Timing information (elapsed time, tokens/sec)

### Tool Call Debugging

Tool calls automatically generate artifacts showing:
- Request JSON with input parameters
- Response content
- Media data (if applicable)

These artifacts are displayed in the agent interface for debugging and transparency.

## Testing and Development

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test:coverage
```

### Build

```bash
# Build the package
bun run build
```

### Package Structure

```
pkg/chat/
├── index.ts                    # Main exports
├── ChatService.ts              # Core chat service class
├── runChat.ts                  # Core chat execution function
├── schema.ts                   # Type definitions and Zod schemas
├── plugin.ts                   # Plugin registration
├── commands.ts                 # Command exports
├── contextHandlers.ts          # Context handler exports
├── hooks.ts                    # Lifecycle hook definitions
├── tools.ts                    # Tool exports
├── contextHandlers/
│   ├── currentMessage.ts       # Current message handler with attachment support
│   ├── priorMessages.ts        # Prior messages handler with truncation
│   ├── systemMessage.ts        # System message handler
│   └── toolContext.ts          # Tool context handler
├── commands/
│   ├── chat/
│   │   ├── send.ts             # Send message implementation
│   │   ├── context.ts          # Context display
│   │   ├── compact.ts          # Context compaction
│   │   └── reset.ts            # Reset chat context
│   ├── model/
│   │   ├── get.ts              # Get model implementation
│   │   ├── set.ts              # Set model implementation
│   │   ├── select.ts           # Interactive selection
│   │   ├── reset.ts            # Reset to default
│   │   └── settings/
│   │       ├── show.ts         # Show model settings
│   │       ├── set.ts          # Set model settings
│   │       ├── select.ts       # Select model settings
│   │       ├── enable.ts       # Enable model settings
│   │       └── disable.ts      # Disable model settings
│   └── tool/
│       ├── list.ts             # List tools
│       ├── enable.ts           # Enable tools
│       ├── disable.ts          # Disable tools
│       ├── select.ts           # Select tools interactively
│       ├── set.ts              # Set tools
│       └── hide.ts             # Hide tools
├── util/
│   ├── tokenRingTool.ts        # Tool wrapper utility
│   └── getChatAnalytics.ts     # Analytics output
├── state/
│   └── chatServiceState.ts     # State management class
├── rpc/
│   ├── chat.ts                 # RPC endpoints
│   └── schema.ts               # RPC schema definitions
├── tools/
│   └── toolSearch.ts           # Tool search utility
└── vitest.config.ts            # Test configuration
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/ai-client` (0.2.0) - AI model registry and client management
- `@tokenring-ai/agent` (0.2.0) - Agent system
- `@tokenring-ai/utility` (0.2.0) - Utility functions
- `@tokenring-ai/lifecycle` (0.2.0) - Lifecycle management
- `@tokenring-ai/rpc` (0.2.0) - RPC endpoints
- `zod` (^4.3.6) - Schema validation
- `async` (^3.2.6) - Async utilities

### Development Dependencies

- `@vitest/coverage-v8` (^4.1.0) - Test coverage
- `typescript` (^5.9.3) - TypeScript compiler
- `vitest` (^4.1.0) - Testing framework

## Related Components

- `@tokenring-ai/ai-client`: AI model registry and client management
- `@tokenring-ai/agent`: Agent system integration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/rpc`: RPC endpoint framework
- `@tokenring-ai/utility`: Utility functions and helpers
- `@tokenring-ai/lifecycle`: Lifecycle and hook management

## License

MIT License - see LICENSE file for details.
