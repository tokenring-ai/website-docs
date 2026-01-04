# Chat Plugin

## Overview

The Chat plugin provides AI chat capabilities for the Token Ring ecosystem. It enables AI-powered conversations with advanced context management, tool integration, and interactive command-line controls. The plugin integrates seamlessly with the Token Ring application framework and supports multiple AI providers through a provider registry system.

## Key Features

- **AI Chat Interface**: Seamless integration with multiple AI models and providers
- **Context Management**: Intelligent context handling with automatic compaction and customizable context sources
- **Tool Integration**: Extensible tool system with plugin architecture and wildcard matching
- **Interactive Commands**: Rich command set for chat management including `/chat`, `/model`, `/tools`, and `/compact`
- **State Preservation**: Persistent chat history and configuration with undo/redo capabilities
- **Multi-Provider Support**: Works with various AI model providers (OpenAI, Anthropic, etc.)
- **Interactive Selection**: Tree-based UI for model and tool selection
- **Feature Management**: Advanced model feature flags and capabilities
- **Context Debugging**: Display and inspect chat context for transparency
- **Parallel/Sequential Tool Execution**: Configurable tool execution mode with queue-based processing
- **Token Usage Analytics**: Detailed breakdown of input/output tokens, costs, and timing

## Core Components

### ChatService

The main chat service class that manages AI chat functionality. The service implements `TokenRingService` and provides:

- AI model configuration and selection with auto-selection capabilities
- Chat message history and state management
- Tool registration and management with wildcard support
- Context handlers for building chat requests
- Interactive command handling through the agent system
- State persistence and serialization

### Context Handlers

Context handlers build the AI chat request by gathering relevant information. Each handler is an async generator that yields `ChatInputMessage` items:

- `system-message`: Adds system prompts (supports dynamic system prompts via functions)
- `prior-messages`: Includes previous conversation history with intelligent truncation
- `current-message`: Adds the current user input
- `tool-context`: Includes context from enabled tools based on their required context handlers
- `tool-call`: Includes tool call results in context (native TokenRing tools only)

### Chat Commands

Interactive commands for chat management:

- `/chat`: Send messages and manage chat settings with subcommands (`send`, `settings`, `feature`, `context`)
- `/model`: Set or show the target AI model with interactive selection
- `/compact`: Compact conversation context by summarizing prior messages
- `/tools`: List, enable, disable, or set enabled tools with tree-based UI

### ChatServiceState

The state management class that tracks:

- Current configuration (model, tools, context settings, etc.)
- Chat message history with timestamps
- Tool execution queue (sequential by default)
- Parallel/sequential tool execution mode
- Initial config for reset operations

## API Reference

### ChatService Methods

#### Model Management

| Method | Description |
|--------|-------------|
| `setModel(model: string, agent: Agent)` | Set the AI model for the agent |
| `getModel(agent: Agent)` | Get the current model name or null |
| `requireModel(agent: Agent)` | Get the current model or throw an error |

#### Configuration Management

| Method | Description |
|--------|-------------|
| `getChatConfig(agent: Agent)` | Get current chat configuration |
| `updateChatConfig(aiConfig: Partial&lt;ChatConfig&gt;, agent: Agent)` | Update configuration with partial updates |

#### Message History Management

| Method | Description |
|--------|-------------|
| `getChatMessages(agent: Agent)` | Get all chat messages |
| `getLastMessage(agent: Agent)` | Get the last message or null |
| `pushChatMessage(message: StoredChatMessage, agent: Agent)` | Add a message to history |
| `clearChatMessages(agent: Agent)` | Clear all messages |
| `popMessage(agent: Agent)` | Remove the last message (undo) |

#### Tool Management

| Method | Description |
|--------|-------------|
| `addTools(pkgName: string, tools: Record&lt;string, TokenRingToolDefinition&gt;)` | Register tools from a package |
| `getAvailableToolNames()` | Get all available tool names |
| `getEnabledTools(agent: Agent)` | Get enabled tool names |
| `setEnabledTools(toolNames: string[], agent: Agent)` | Set exact enabled tools |
| `enableTools(toolNames: string[], agent: Agent)` | Enable additional tools |
| `disableTools(toolNames: string[], agent: Agent)` | Disable tools |
| `ensureToolNamesLike(pattern: string)` | Expand wildcard patterns to tool names |
| `getToolNamesLike(pattern: string)` | Get tool names matching a pattern |

#### Context Handler Management

| Method | Description |
|--------|-------------|
| `getContextHandlerByName(name: string)` | Get a context handler by name |
| `requireContextHandlerByName(name: string)` | Get a context handler or throw |
| `registerContextHandler(name: string, handler: ContextHandler)` | Register a single context handler |
| `registerContextHandlers(handlers: Record&lt;string, ContextHandler&gt;)` | Register multiple context handlers |

#### Message Building

| Method | Description |
|--------|-------------|
| `buildChatMessages(input: string, chatConfig: ChatConfig, agent: Agent)` | Build chat request messages from context handlers |

### runChat Function

The core chat execution function that handles streaming responses, tool calls, and context compaction.

```typescript
import runChat from "@tokenring-ai/chat/runChat.ts";

async function runChat(
  input: string,
  chatConfig: ChatConfig,
  agent: Agent,
): Promise&lt;[string, AIResponse]&gt;
```

**Parameters:**

- `input`: The user input message
- `chatConfig`: Chat configuration including model, tools, and context settings
- `agent`: The agent instance

**Returns:** A promise resolving to `[output, response]` where output is the text response and response is the full AI response object

### Utility Functions

#### tokenRingTool

Converts a tool definition to TokenRing format:

```typescript
import &#123;tokenRingTool&#125; from "@tokenring-ai/chat";

const tool = tokenRingTool(&#123;
  name: "my-tool",
  description: "Does something useful",
  inputSchema: z.object(&#123;
    param: z.string()
  &#125;),
  async execute(input, agent) &#123;
    return "result";
  &#125;
&#125;);
```

#### outputChatAnalytics

Outputs token usage and cost analytics:

```typescript
import &#123;outputChatAnalytics&#125; from "@tokenring-ai/chat";

outputChatAnalytics(response, agent, "Chat Complete");
```

#### compactContext

Manually compacts conversation context:

```typescript
import &#123;compactContext&#125; from "@tokenring-ai/chat/util/compactContext.ts";

await compactContext("focus topic", agent);
```

## Usage Examples

### Basic Chat Setup

```typescript
import &#123;TokenRingApp&#125; from "@tokenring-ai/app";
import ChatService from "@tokenring-ai/chat";

const app = new TokenRingApp();

// Add chat service with configuration
app.addServices(new ChatService(app, &#123;
  defaultModels: ["auto"],
  agentDefaults: &#123;
    model: "auto",
    autoCompact: true,
    maxSteps: 30,
    enabledTools: [],
    context: &#123;
      initial: [
        &#123;type: "system-message"&#125;,
        &#123;type: "tool-context"&#125;,
        &#123;type: "prior-messages"&#125;,
        &#123;type: "current-message"&#125;
      ],
      followUp: [
        &#123;type: "prior-messages"&#125;,
        &#123;type: "current-message"&#125;
      ]
    &#125;
  &#125;
&#125;));

await app.start();
```

### Sending Messages Programmatically

```typescript
import runChat from "@tokenring-ai/chat/runChat.ts";

// Build chat configuration
const chatConfig = &#123;
  model: "auto",
  systemPrompt: "You are a helpful assistant",
  maxSteps: 30,
  autoCompact: true,
  enabledTools: [],
  context: &#123;
    initial: [
      &#123;type: "system-message"&#125;,
      &#123;type: "tool-context"&#125;,
      &#123;type: "prior-messages"&#125;,
      &#123;type: "current-message"&#125;
    ],
    followUp: [
      &#123;type: "prior-messages"&#125;,
      &#123;type: "current-message"&#125;
    ]
  &#125;
&#125;;

// Run a chat message
const [response, aiResponse] = await runChat(
  "Hello, how are you?",
  chatConfig,
  agent
);
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

### Interactive Chat Commands

#### Send a Message

```bash
/chat send Hello, how are you?
```

#### Configure AI Settings

```bash
/chat settings temperature=0.5 maxTokens=2000
```

#### Manage Model Features

```bash
/chat feature list                              # List features
/chat feature enable reasoning                  # Enable a feature
/chat feature disable reasoning                 # Disable a feature
```

#### Show Context

```bash
/chat context
```

#### Compact Context

```bash
/compact
/compact specifics of the task at hand
```

#### Manage Tools

```bash
/tools                    # Interactive tool selection
/tools enable web-search calculator
/tools disable file-system
/tools set web-search calculator
```

#### Select Model

```bash
/model                    # Interactive model selection
/model get                # Show current model
/model set gpt-4-turbo    # Set specific model
/model reset              # Reset to default
```

## Configuration

### Plugin Configuration Schema

The chat plugin is configured through the application's plugin configuration:

```typescript
import &#123;z&#125; from "zod";

const configSchema = z.object(&#123;
  chat: z.object(&#123;
    defaultModels: z.array(z.string()),
    agentDefaults: z.object(&#123;
      model: z.string().default("auto"),
      autoCompact: z.boolean().default(true),
      enabledTools: z.array(z.string()).default([]),
      maxSteps: z.number().default(30),
      context: z.object(&#123;
        initial: z.array(ContextSourceSchema).default(initialContextItems),
        followUp: z.array(ContextSourceSchema).default(followUpContextItems),
      &#125;).optional(),
    &#125;),
  &#125;),
&#125;);
```

### Chat Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `model` | string | "auto" | AI model identifier (supports "auto", "auto:reasoning", "auto:frontier", or specific model names) |
| `systemPrompt` | string \| function | - | System instructions for the AI (can be a function for dynamic prompts) |
| `maxSteps` | number | 30 | Maximum processing steps before prompting for continuation |
| `autoCompact` | boolean | true | Enable automatic context compaction when approaching token limits |
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
| `tool-call` | Adds tool call results (for native tools) |

### Available Settings

Settings can be configured via `/chat settings`:

- `temperature`: Controls randomness (0.0-2.0)
- `maxTokens`: Maximum response length
- `topP`: Nucleus sampling threshold (0.0-1.0)
- `frequencyPenalty`: Reduce repetition (-2.0 to 2.0)
- `presencePenalty`: Encourage new topics (-2.0 to 2.0)
- `stopSequences`: Sequences to stop at
- `autoCompact`: Enable automatic context compaction

## Integration

### Plugin Registration

The chat plugin integrates with the Token Ring application framework:

```typescript
import chatPlugin from "@tokenring-ai/chat";

// Register the plugin
app.use(chatPlugin);
```

### Service Registration

The plugin automatically registers:

- `ChatService`: Main chat service with all methods
- Context handlers for building chat requests
- Interactive chat commands (`/chat`, `/model`, `/tools`, `/compact`)
- Model feature management
- Context debugging tools
- State management via ChatServiceState

### Agent Configuration

Agents can have their own chat configuration merged with service defaults:

```typescript
const agentConfig = &#123;
  chat: &#123;
    model: "gpt-4",
    systemPrompt: "You are a helpful assistant",
    maxSteps: 50,
    autoCompact: true,
    enabledTools: ["web-search", "calculator"],
    context: &#123;
      initial: [
        &#123;type: "system-message"&#125;,
        &#123;type: "tool-context"&#125;,
        &#123;type: "prior-messages"&#125;,
        &#123;type: "current-message"&#125;
      ],
      followUp: [
        &#123;type: "prior-messages"&#125;,
        &#123;type: "current-message"&#125;
      ]
    &#125;
  &#125;
&#125;;
```

### Tool Integration

Tools are registered through packages using the `addTools` method:

```typescript
chatService.addTools("my-package", &#123;
  "my-tool": &#123;
    name: "my-tool",
    description: "Does something useful",
    inputSchema: z.object(&#123;
      param: z.string()
    &#125;),
    async execute(input, agent) &#123;
      // Tool implementation
      return "result";
    &#125;
  &#125;
&#125;);
```

## Monitoring and Debugging

### Context Debugging

Use `/chat context` to view the current context structure:

```bash
/chat context
```

This shows all context items that would be included in a chat request.

### Compact Context

Use `/compact` to summarize messages and reduce token usage:

```bash
/compact
/compact focus on the main task details
```

### Analytics

The `outputChatAnalytics` function provides detailed token usage and cost information:

```typescript
import &#123;outputChatAnalytics&#125; from "@tokenring-ai/chat";

outputChatAnalytics(response, agent, "Chat Complete");
```

Output includes:
- Input/Output/Total token counts
- Cached token information
- Reasoning tokens (if applicable)
- Cost breakdown (input, output, total)
- Timing information (elapsed time, tokens/sec)

## Development

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
├── chatCommands.ts             # Command exports
├── contextHandlers.ts          # Context handler exports
├── contextHandlers/
│   ├── currentMessage.ts       # Current message handler
│   ├── priorMessages.ts        # Prior messages handler
│   ├── systemMessage.ts        # System message handler
│   ├── toolContext.ts          # Tool context handler
│   └── toolCall.ts             # Tool call handler
├── commands/
│   ├── chat.ts                 # Chat command with subcommands
│   ├── model.ts                # Model command with subcommands
│   ├── tool.ts                 # Tool management command
│   └── compact.ts              # Context compaction command
│   ├── chat/
│   │   ├── send.ts             # Send message implementation
│   │   ├── settings.ts         # Settings configuration
│   │   ├── feature.ts          # Feature management
│   │   └── context.ts          # Context display
│   └── model/
│       ├── set.ts              # Set model implementation
│       ├── get.ts              # Get model implementation
│       ├── select.ts           # Interactive selection
│       ├── reset.ts            # Reset to default
│       └── default.ts          # Show current and select
├── util/
│   ├── tokenRingTool.ts        # Tool wrapper utility
│   ├── compactContext.ts       # Context compaction
│   └── outputChatAnalytics.ts  # Analytics output
├── state/
│   └── chatServiceState.ts     # State management class
└── vitest.config.ts            # Test configuration
```

## Related Components

- `@tokenring-ai/ai-client`: AI model registry and client management
- `@tokenring-ai/agent`: Agent system integration
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/scheduler`: Task scheduling integration

## License

MIT License
