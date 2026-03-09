# Chat Plugin

## Overview

The Chat plugin provides AI chat capabilities for the Token Ring ecosystem. It enables AI-powered conversations with advanced context management, tool integration, and interactive command-line controls. The plugin integrates seamlessly with the Token Ring application framework and supports multiple AI providers through the ChatModelRegistry system.

## Key Features

- **AI Chat Interface**: Seamless integration with multiple AI models and providers via `@tokenring-ai/ai-client`
- **Context Management**: Intelligent context handling with automatic compaction and customizable context sources
- **Tool Integration**: Extensible tool system with plugin architecture and wildcard matching
- **Interactive Commands**: Rich command set for chat management including `/chat`, `/model`, `/tools`, and `/compact`
- **State Preservation**: Persistent chat history with message history management and message stack for undo operations
- **Multi-Provider Support**: Works with various AI model providers (OpenAI, Anthropic, etc.) via `ChatModelRegistry`
- **Interactive Selection**: Tree-based UI for model and tool selection
- **Feature Management**: Advanced model feature flags and capabilities
- **Context Debugging**: Display and inspect chat context for transparency
- **Parallel/Sequential Tool Execution**: Configurable tool execution mode with queue-based processing
- **Token Usage Analytics**: Detailed breakdown of input/output tokens, costs, and timing
- **RPC Endpoints**: Remote procedure call support for chat management
- **Tool Call Artifacts**: Automatic output of tool call requests and responses as artifacts
- **Hook System**: Extensible lifecycle hooks for post-chat completion processing
- **Attachment Support**: Support for text, image, and file attachments in chat messages

## Core Components

### ChatService

The main chat service class that manages AI chat functionality. The service implements `TokenRingService` and provides:

- AI model configuration and selection with auto-selection capabilities
- Chat message history and state management
- Tool registration and management with wildcard support
- Context handlers for building chat requests
- Interactive command handling through the agent system
- State persistence and serialization via `ChatServiceState`
- RPC endpoints for remote management

**Constructor:**

```typescript
import ChatService from "@tokenring-ai/chat";

const chatService = new ChatService(app, options);
```

**Properties:**

- `name: string` - Service name ("ChatService")
- `description: string` - Service description
- `app: TokenRingApp` - Application instance
- `options: z.output<typeof ChatServiceConfigSchema>` - Configuration options
- `defaultModel: string | null` - Selected default model

**Methods:**

#### Service Lifecycle

| Method | Description |
|--------|-------------|
| `start()` | Initialize the service and select default model |
| `attach(agent, creationContext)` | Attach service to agent with state initialization |

#### Model Management

| Method | Description |
|--------|-------------|
| `setModel(model: string, agent: Agent): void` | Set the AI model for the agent |
| `getModel(agent: Agent): string \| null` | Get the current model name or null |
| `requireModel(agent: Agent): string` | Get the current model or throw an error |
| `getModelAndSettings(agent: Agent)` | Get model and settings using `getModelAndSettings` utility |

#### Configuration Management

| Method | Description |
|--------|-------------|
| `getChatConfig(agent: Agent): ParsedChatConfig` | Get current chat configuration |
| `updateChatConfig(aiConfig: Partial<ParsedChatConfig>, agent: Agent): void` | Update configuration with partial updates |

#### Message History Management

| Method | Description |
|--------|-------------|
| `getChatMessages(agent: Agent): StoredChatMessage[]` | Get all chat messages |
| `getLastMessage(agent: Agent): StoredChatMessage \| null` | Get the last message or null |
| `pushChatMessage(message: StoredChatMessage, agent: Agent): void` | Add a message to history |
| `clearChatMessages(agent: Agent): void` | Clear all messages |
| `popMessage(agent: Agent): void` | Remove the last message (undo) |

#### Tool Management

| Method | Description |
|--------|-------------|
| `addTools(tools: Record<string, TokenRingToolDefinition>): void` | Register tools from a package |
| `getAvailableToolNames(): string[]` | Get all available tool names |
| `getAvailableToolEntries()` | Get all available tool definitions as entries |
| `getToolNamesLike(pattern: string): string[]` | Get tool names matching a pattern |
| `ensureToolNamesLike(pattern: string): string[]` | Expand wildcard patterns to tool names |
| `getEnabledTools(agent: Agent): string[]` | Get enabled tool names |
| `setEnabledTools(toolNames: string[], agent: Agent): string[]` | Set exact enabled tools |
| `enableTools(toolNames: string[], agent: Agent): string[]` | Enable additional tools |
| `disableTools(toolNames: string[], agent: Agent): string[]` | Disable tools |
| `requireTool(toolName: string): NamedTool` | Get a tool by name |

#### Context Handler Management

| Method | Description |
|--------|-------------|
| `getContextHandlerByName(name: string): ContextHandler \| undefined` | Get a context handler by name |
| `requireContextHandlerByName(name: string): ContextHandler` | Get a context handler or throw |
| `registerContextHandler(name: string, handler: ContextHandler): void` | Register a single context handler |
| `registerContextHandlers(handlers: Record<string, ContextHandler>): void` | Register multiple context handlers |

#### Message Building

| Method | Description |
|--------|-------------|
| `buildChatMessages(options: BuildChatMessagesOptions): Promise<ContextItem[]>` | Build chat request messages from context handlers |

### Context Handlers

Context handlers build the AI chat request by gathering relevant information. Each handler is an async generator that yields `ChatInputMessage` items:

- **system-message**: Adds system prompts (supports dynamic system prompts via functions)
- **prior-messages**: Includes previous conversation history with intelligent truncation
- **current-message**: Adds the current user input with attachment support
- **tool-context**: Includes context from enabled tools based on their required context handlers

### ChatServiceState

The state management class that tracks:

- `currentConfig`: Current configuration (model, tools, context settings, etc.)
- `messages`: Chat message history with timestamps
- `toolQueue`: Async queue for sequential tool execution
- `parallelTools`: Boolean flag for parallel/sequential tool execution mode
- `initialConfig`: Initial configuration for reset operations

**Methods:**

- `serialize()`: Serialize state for persistence
- `deserialize(data)`: Deserialize state from persistence
- `show()`: Return array of strings for display in agent UI
- `resetSettings()`: Reset configuration to initial values
- `resetChat()`: Clear all chat messages
- `runToolMaybeInParallel(executeToolFunction)`: Execute tool with parallel/sequential mode

## Chat Commands

Interactive commands for chat management:

### Chat Commands

- **`/chat send <message>`**: Send a message to the AI with optional attachments
- **`/chat context`**: Display context items for debugging
- **`/chat compact [<focus>]`**: Compact conversation context
- **`/chat reset`**: Reset chat context

### Model Commands

- **`/model get`**: Show current model
- **`/model set <model_name>`**: Set specific model
- **`/model select`**: Interactive model selection
- **`/model reset`**: Reset to initial model

### Model Settings Commands

- **`/model settings show`**: Show model settings
- **`/model settings set <key[=value]>`**: Set a feature flag
- **`/model settings select`**: Interactive feature selection
- **`/model settings enable <key[=value]> ...`**: Enable feature flags
- **`/model settings disable <key> ...`**: Disable feature flags

### Tool Commands

- **`/tools list`**: List enabled tools
- **`/tools enable <tool1> [tool2...]`**: Enable tools
- **`/tools disable <tool1> [tool2...]`**: Disable tools
- **`/tools set <tool1> [tool2...]`**: Set exact tool list
- **`/tools select`**: Interactive tool selection

### Utility Commands

- **`/compact [<focus>]`**: Alias for `/chat compact`

## API Reference

### runChat Function

The core chat execution function that handles streaming responses, tool calls, and context compaction.

```typescript
import runChat from "@tokenring-ai/chat/runChat";

async function runChat({
  input: string,
  attachments?: InputAttachment[],
  chatConfig: ParsedChatConfig,
  agent: Agent,
}): Promise<AIResponse>
```

**Parameters:**

- `input`: The user input message
- `attachments`: Optional input attachments (text, image, or file)
- `chatConfig`: Chat configuration including model, tools, and context settings
- `agent`: The agent instance

**Returns:** A promise resolving to the AI response object

**Key Features:**

- Automatic context compaction when approaching token limits
- Tool call execution with parallel/sequential mode
- Max steps limit with user confirmation option
- Streaming responses with detailed analytics
- Automatic artifact output for tool calls
- Integration with agent lifecycle hooks
- Hook execution via `AfterChatCompletion` event

### Hooks

The package provides lifecycle hooks for extending chat functionality:

#### AfterChatCompletion

Executed after a chat completion is received:

```typescript
import {AfterChatCompletion} from "@tokenring-ai/chat";

// Hook is automatically executed via AgentLifecycleService
class MyHookHandler {
  async executeHook(hook: AfterChatCompletion, agent: Agent) {
    if (hook instanceof AfterChatCompletion) {
      // Process chat completion
      console.log("Chat completed with", hook.response);
    }
  }
}
```

### Utility Functions

#### tokenRingTool

Converts a tool definition to TokenRing format with automatic artifact generation:

```typescript
import {tokenRingTool} from "@tokenring-ai/chat";
import {z} from "zod";

const tool = tokenRingTool({
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

- **text**: Simple string result or text object with type and content
  ```typescript
  // String result
  return "Success!";
  
  // Text object
  return { type: "text", text: "Success!" };
  
  // With artifact
  return { type: "text", text: "Success!", artifact: { name: "Result", ... } };
  ```

- **media**: Media result with type, mediaType, and data (base64 encoded)
  ```typescript
  return {
    type: "media",
    mediaType: "image/png",
    data: "base64-encoded-data"
  };
  ```

- **json**: JSON result with type and data (automatically stringified)
  ```typescript
  return {
    type: "json",
    data: { key: "value", number: 42 }
  };
  ```

#### getChatAnalytics

Returns token usage and cost analytics as a formatted string:

```typescript
import {getChatAnalytics} from "@tokenring-ai/chat";

const analytics = getChatAnalytics(response);
console.log(analytics);
```

**Output Includes:**

- Input/Output/Total token counts
- Cached token information
- Reasoning tokens (if applicable)
- Cost breakdown (input, output, total)
- Timing information (elapsed time, tokens/sec)

#### compactContext

Manually compacts conversation context:

```typescript
import {compactContext} from "@tokenring-ai/chat/util/compactContext";

await compactContext("focus topic", agent);
```

**Parameters:**

- `focus`: Optional string to guide the summary focus (defaults to "important details, context, and what was being worked on")
- `agent`: The agent instance

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
      windowThreshold: 0.7,
      backtrack: 1,
      background: false
    },
    enabledTools: [],
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
        policy: "ask", // "automatic" | "ask" | "never"
        compactionThreshold: 0.5, // Threshold for automatic compaction
        windowThreshold: 0.7, // Window threshold
        backtrack: 1, // Backtrack steps
        background: false // Run compaction in background
      },
      
      // List of enabled tool names (supports wildcards)
      enabledTools: [],
      
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
| `compaction.windowThreshold` | number | 0.7 | Window threshold for compaction |
| `compaction.backtrack` | number | 1 | Number of steps to backtrack after compaction |
| `compaction.background` | boolean | false | Run compaction in background |
| `enabledTools` | string[] | [] | List of enabled tool names (supports wildcards) |
| `context.initial` | ContextItem[] | [system-message, tool-context, prior-messages, current-message] | Context items for initial messages |
| `context.followUp` | ContextItem[] | [prior-messages, current-message] | Context items for follow-up messages |

### Context Source Types

| Type | Description |
|------|-------------|
| `system-message` | Adds the system prompt |
| `prior-messages` | Adds previous conversation history |
| `current-message` | Adds the current user input |
| `tool-context` | Adds context from enabled tools |

### Model Selection

The chat plugin supports various model selection strategies:

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
      enabledTools: []
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

### RPC Integration

The chat plugin provides RPC endpoints for remote management:

```typescript
// Get available tools
const tools = await rpc.call("getAvailableTools", {});

// Get current model
const model = await rpc.call("getModel", { agentId: "agent-1" });

// Set model
await rpc.call("setModel", { agentId: "agent-1", model: "gpt-4" });

// Get enabled tools
const enabled = await rpc.call("getEnabledTools", { agentId: "agent-1" });

// Set enabled tools
await rpc.call("setEnabledTools", { agentId: "agent-1", tools: ["web-search"] });
```

**RPC Endpoints:**

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

## Providers

The chat package uses the `ChatModelRegistry` provider from `@tokenring-ai/ai-client` for model selection and client management. This registry provides:

- Model availability tracking (online, cold, offline)
- Model cost information
- Context length specifications
- Automatic client selection and management

## State Management

The chat service maintains state including:

- **Chat message history**: Full request/response pairs with timestamps
- **Current configuration**: Model, tools, and context settings
- **Enabled tools**: List of active tools
- **Tool execution queue**: Sequential tool execution with async queue
- **Parallel tools mode**: Optional parallel tool execution
- **Message stack**: Stack of messages for undo operations
- **Initial configuration**: For reset operations

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
      windowThreshold: number,
      backtrack: number,
      background: boolean
    },
    enabledTools: string[],
    context: {
      initial: ContextItem[],
      followUp: ContextItem[]
    }
  },
  messages: StoredChatMessage[],
  parallelTools: boolean,
  toolQueue: async.queue,
  initialConfig: ParsedChatConfig
}
```

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

### Context Optimization

- Enable automatic compaction for long conversations
- Use manual compaction before starting new topics
- Monitor token usage with analytics output

### Error Handling

- Always check for `CommandFailedError` in command execution
- Handle model unavailability with retry logic
- Validate tool inputs before execution

### Tool Development

- Always include artifacts for better debugging
- Handle errors gracefully in tool execution
- Use descriptive tool names and descriptions
- Include proper input schema validation

### Attachment Handling

- Use appropriate MIME types for attachments
- Handle different encoding formats (text, base64, href)
- Consider `allowRemoteAttachments` setting for security
- Validate attachment sizes before processing

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
├── contextHandlers/
│   ├── currentMessage.ts       # Current message handler
│   ├── priorMessages.ts        # Prior messages handler
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
│       └── set.ts              # Set tools
├── util/
│   ├── tokenRingTool.ts        # Tool wrapper utility
│   ├── compactContext.ts       # Context compaction
│   └── getChatAnalytics.ts     # Analytics output
├── state/
│   └── chatServiceState.ts     # State management class
├── rpc/
│   ├── chat.ts                 # RPC endpoints
│   └── schema.ts               # RPC schema definitions
└── vitest.config.ts            # Test configuration
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/ai-client` (0.2.0) - AI model registry and client management
- `@tokenring-ai/agent` (0.2.0) - Agent system
- `@tokenring-ai/utility` (0.2.0) - Utility functions
- `@tokenring-ai/rpc` (0.2.0) - RPC endpoints
- `zod` (^4.3.6) - Schema validation
- `async` (^3.2.6) - Async utilities

### Development Dependencies

- `@vitest/coverage-v8` (^4.0.18) - Test coverage
- `typescript` (^5.9.3) - TypeScript compiler
- `vitest` (^4.0.18) - Testing framework

## Related Components

- `@tokenring-ai/ai-client`: AI model registry and client management
- `@tokenring-ai/agent`: Agent system integration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/rpc`: RPC endpoint framework
- `@tokenring-ai/utility`: Utility functions and helpers

## License

MIT License
