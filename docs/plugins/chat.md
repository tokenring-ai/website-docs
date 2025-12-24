# Chat Plugin

## Overview

The Chat plugin provides a comprehensive AI chat interface for the Token Ring ecosystem, enabling AI-powered conversations with advanced features like context management, tool integration, and interactive command-line controls.

## Key Features

- **AI Chat Interface**: Seamless integration with multiple AI models and providers
- **Context Management**: Intelligent context handling with automatic compaction
- **Tool Integration**: Extensible tool system with plugin architecture
- **Interactive Commands**: Rich command set for chat management and configuration
- **State Preservation**: Persistent chat history and configuration
- **Multi-Provider Support**: Works with various AI model providers
- **Interactive Selection**: Tree-based UI for model and tool selection
- **Context Handlers**: Modular system for building chat requests with different sources
- **Command System**: Interactive chat commands with comprehensive help documentation

## Core Components

### ChatService

The main chat service class that manages:
- AI model configuration and selection
- Chat message history and state
- Tool registration and management
- Context handlers for building chat requests

```typescript
import ChatService from "@tokenring-ai/chat";

// Create chat service with default model
const chatService = new ChatService({ model: "default-model" });

// Register tools
chatService.addTools("package-name", {
  toolName: {
    name: "tool-name",
    description: "Tool description",
    inputSchema: z.object({ /* input schema */ }),
    execute: async (input, agent) => { /* tool implementation */ }
  }
});
```

### Context Handlers

Context handlers build the AI chat request by gathering relevant information:

- `system-message`: Adds system prompts
- `prior-messages`: Includes previous conversation history
- `current-message`: Adds the current user input
- `tool-context`: Includes context from enabled tools

### Chat Commands

Interactive commands for chat management:

- `/chat`: Send messages and manage chat settings
- `/model`: Set or show the target AI model
- `/compact`: Compact conversation context by summarizing prior messages
- `/tools`: List, enable, disable, or set enabled tools

## Chat Commands

### /chat

#### /chat send <message>

Send a message to the AI chat service. This is the primary command for communicating with the AI, using your selected model and current context.

##### Examples

```bash
/chat send Hello, how are you?          # Send a simple message
```

##### Features

- Uses your selected AI model (see `/model`)
- Includes conversation context and system prompts
- Provides available tools if enabled (see `/tools`)
- Shows detailed token usage analytics after completion

#### /chat settings [key=value ...]

Configure AI model settings and behavior. With no arguments, shows current configuration.

##### Available Settings

- **temperature=0.7** - Controls randomness (0.0-2.0, default: 1.0)
- **maxTokens=1000** - Maximum response length (integer)
- **topP=0.9** - Nucleus sampling threshold (0.0-1.0)
- **frequencyPenalty=0.0** - Reduce repetition (-2.0 to 2.0)
- **presencePenalty=0.0** - Encourage new topics (-2.0 to 2.0)
- **stopSequences=a,b,c** - Stop at these sequences
- **autoCompact=true** - Enable automatic context compaction

##### Examples

```bash
/chat settings                              # Show current settings
/chat settings temperature=0.5 maxTokens=2000
/chat settings autoCompact=true
```

#### /chat feature <list|enable|disable> [key[=value] ...]

Manage model feature flags that enable special capabilities.

##### /chat feature list

List currently enabled and available features for your model.

##### /chat feature enable key[=value] [...]

Enable or set model feature flags.

###### Value Types

- **Boolean**: true/false, 1/0
- **Number**: Numeric values
- **String**: Text values

###### Examples

```bash
/chat feature enable reasoning
/chat feature enable temperature=0.7
```

##### /chat feature disable key [...]

Remove/disable specific feature flags.

###### Examples

```bash
/chat feature disable reasoning
```

#### /chat context

Display all context items that would be included in a chat request. Useful for debugging and understanding what information the AI has access to.

##### Shows

- Total number of context messages
- System prompt configuration
- Previous conversation messages (with preview)

**Note:** Context display shows the exact data sent to the AI model.

### /tools

#### /tools [enable|disable|set] <tool1> <tool2> ...

Manage available tools for your chat session. Tools provide additional capabilities like web search, code execution, file operations, etc.

##### Modes

- `/tools` - Interactive tool selection (recommended)
- `/tools enable tool1 tool2` - Enable specific tools
- `/tools disable tool1` - Disable specific tools
- `/tools set tool1 tool2` - Set exactly which tools are enabled

##### Examples

```bash
/tools                    # Browse and select tools interactively
/tools enable web-search  # Enable web search tool
/tools disable calculator # Disable calculator tool
/tools set web-search calculator # Only enable these two tools
```

##### Interactive Mode

- Tools are grouped by package for easy browsing
- Current selection is shown with checkmarks
- Use spacebar to toggle selection, enter to confirm

**Note:** Some tools may require additional setup or permissions.

### /model

#### /model [model_name]

Set or display the AI model used for chat responses. Choose from available models based on your needs for speed, quality, and cost.

##### Usage

```bash
/model                    # Interactive model selection (recommended)
/model gpt-4              # Set to specific model
/model auto               # Auto-select best available model
/model auto:reasoning     # Auto-select with reasoning capabilities
/model auto:frontier      # Auto-select latest frontier model
```

##### Interactive Mode

- Models are grouped by provider (OpenAI, Anthropic, etc.)
- Status indicators show availability:
  - ✅ Online - Ready for immediate use
  - 🧊 Cold - May have startup delay
  - 🔴 Offline - Currently unavailable
- Current model is highlighted

##### Special Values

- **auto** - Automatically selects best available model
- **auto:reasoning** - Prefers models with advanced reasoning
- **auto:frontier** - Prefers latest cutting-edge models

##### Examples

```bash
/model                    # Browse and select model interactively
/model gpt-4-turbo        # Use GPT-4 Turbo for better performance
/model claude-3-sonnet    # Use Claude 3 Sonnet for balanced quality
/model auto               # Let system choose best model
```

**Note:** Model availability and performance may vary based on your subscription level and current server load.

### /compact

#### /compact [<focus>]

Compress the conversation context by creating intelligent summaries of prior messages. This helps reduce token usage and maintain context in long conversations.

##### How it works

- Analyzes all previous messages in the conversation
- Creates concise summaries while preserving key information
- Maintains conversation flow and important context
- Reduces token count for better performance and cost savings

##### When to use

- After many messages have been exchanged
- When you notice responses getting slower
- When approaching token limits
- Before starting a new topic in a long conversation

##### Benefits

- Faster response times in long conversations
- Lower API costs due to reduced token usage
- Maintains important context without losing information
- Prevents context overflow errors

##### Example

```bash
# Compresses all prior messages
/compact                   

# Gives more control over context compression
/compact specifics of the task at hand, including the goal and expected outcome
```

**Note:** Compaction is automatic in some cases, but manual compaction gives you control over when and how context is compressed.

## Configuration

### Chat Configuration Schema

```typescript
import {ChatConfigSchema} from "@tokenring-ai/chat";

const chatConfig = {
  model: "gpt-4",
  systemPrompt: "You are a helpful assistant",
  temperature: 0.7,
  maxTokens: 1000,
  maxSteps: 30,
  topP: 0.9,
  topK: 40,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  stopSequences: ["\n\n", "---"],
  autoCompact: true,
  enabledTools: [],
  context: {
    initial: [
      { type: "system-message" },
      { type: "tool-context" },
      { type: "prior-messages" },
      { type: "current-message" }
    ],
    followUp: [
      { type: "prior-messages" },
      { type: "current-message" }
    ]
  }
};
```

### Available Settings

- `model`: AI model identifier
- `systemPrompt`: System instructions for the AI
- `temperature`: Controls randomness (0.0-2.0)
- `maxTokens`: Maximum response length
- `maxSteps`: Maximum processing steps
- `topP`: Nucleus sampling threshold
- `topK`: Top-K sampling
- `frequencyPenalty`: Reduce repetition
- `presencePenalty`: Encourage new topics
- `stopSequences`: Sequences to stop at
- `autoCompact`: Enable automatic context compaction
- `enabledTools`: List of enabled tool names
- `context`: Configuration for context sources

## API Reference

### ChatService Methods

- `addTools(pkgName, tools)`: Register tools from a package
- `setModel(model, agent)`: Set the AI model
- `getModel(agent)`: Get the current model
- `getChatConfig(agent)`: Get current chat configuration
- `updateChatConfig(aiConfig, agent)`: Update configuration
- `getChatMessages(agent)`: Get chat message history
- `getLastMessage(agent)`: Get the last message
- `pushChatMessage(message, agent)`: Add a message to history
- `clearChatMessages(agent)`: Clear all messages
- `popMessage(agent)`: Remove the last message (undo)
- `getEnabledTools(agent)`: Get enabled tool names
- `setEnabledTools(toolNames, agent)`: Set enabled tools
- `enableTools(toolNames, agent)`: Enable additional tools
- `disableTools(toolNames, agent)`: Disable tools

### runChat Function

```typescript
import {runChat} from "@tokenring-ai/chat";

async function runChat(
  input: string,
  chatConfig: ChatConfig,
  agent: Agent
): Promise<[string, AIResponse]>
```

## Plugin Integration

The chat plugin integrates with the Token Ring application framework:

```typescript
import chatPlugin from "@tokenring-ai/chat";

// Register the plugin
app.use(chatPlugin);
```

### Service Registration

The plugin automatically registers:
- `ChatService`: Main chat service
- Context handlers for building chat requests
- Interactive chat commands

## State Management

The chat service maintains state including:
- Chat message history
- Current configuration
- Enabled tools
- Context preferences

State is automatically managed and preserved across sessions.

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
├── index.ts           # Main exports
├── ChatService.ts     # Core chat service
├── types.ts          # Type definitions
├── contextHandlers/  # Context handler implementations
├── commands/        # Chat command implementations
├── util/            # Utility functions
├── state/           # State management
└── plugin.ts        # Plugin registration
```

## Dependencies

- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/ai-client`: AI client integration
- `@tokenring-ai/agent`: Agent system
- `@tokenring-ai/utility`: Shared utilities
- `zod`: Schema validation
- `async`: Asynchronous utilities

## License

MIT License