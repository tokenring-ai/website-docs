# Codebase Plugin

## Overview

The Codebase Plugin provides codebase context to AI agents by managing multiple types of resources that deliver file structures, symbol information, and complete file contents. It allows selective inclusion of project files and directories, enabling AI agents to reason about and interact with the codebase effectively.

The plugin serves as a context provider that injects relevant codebase information into chat sessions through a context handler. It supports three resource types: file trees (directory structure), repo maps (symbol information), and whole files (complete file contents). Users can manage which resources are enabled through interactive commands or programmatic configuration.

## Chat Commands

The plugin provides the following chat commands for managing codebase resources:

| Command | Description | Example |
|---------|-------------|---------|
| `/codebase select` | Interactive resource selection via tree view | `/codebase select` |
| `/codebase enable [resources...]` | Enable specific codebase resources | `/codebase enable src/utils src/types` |
| `/codebase disable [resources...]` | Disable specific codebase resources | `/codebase disable src/utils` |
| `/codebase set [resources...]` | Set specific codebase resources (replaces existing) | `/codebase set src/api src/docs` |
| `/codebase list` | List all currently enabled resources | `/codebase list` |
| `/codebase clear` | Remove all resources from the session | `/codebase clear` |
| `/codebase show repo` | Display repository map with symbols | `/codebase show repo` |

### Usage Examples

```bash
# Interactive resource selection
/codebase select

# Enable specific resources
/codebase enable src/* utils/*

# Disable specific resources
/codebase disable test/*

# List enabled resources
/codebase list

# Generate repository map
/codebase show repo

# Clear all resources
/codebase clear

# Set specific resources
/codebase set src/api
```

## Plugin Configuration

The plugin is configured through the `codebase` section in the plugin configuration. It accepts a `CodeBaseServiceConfigSchema` which defines available resources and default agent settings.

### Configuration Schema

```typescript
import { z } from "zod";

const CodeBaseServiceConfigSchema = z.object({
  resources: z.record(z.string(), z.any()),
  agentDefaults: z.object({
    enabledResources: z.array(z.string()).default([])
  }).default({ enabledResources: [] })
});

const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).optional()
  }).default({});
```

### Configuration Example

```typescript
const pluginConfig = {
  codebase: {
    resources: {
      "src": {
        type: "fileTree"
      },
      "api": {
        type: "repoMap"
      },
      "config": {
        type: "wholeFile"
      },
      "docs": {
        type: "fileTree"
      }
    },
    agentDefaults: {
      enabledResources: []
    }
  }
};
```

### Plugin Registration

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp();

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      "src": {
        type: "fileTree"
      },
      "api": {
        type: "repoMap"
      },
      "config": {
        type: "wholeFile"
      }
    },
    agentDefaults: {
      enabledResources: []
    }
  }
});
```

## Agent Configuration

The CodeBaseService provides agent-level configuration through the `attach` method, which merges service defaults with agent-specific settings. This allows different agents to have different resource enablement preferences while maintaining consistent resource availability.

### Agent Configuration Schema

```typescript
import { z } from "zod";

const CodeBaseAgentConfigSchema = z.object({
  enabledResources: z.array(z.string()).optional()
}).default({});
```

### Agent Configuration Example

```typescript
import { Agent } from "@tokenring-ai/agent";

const agent = new Agent({
  config: {
    codebase: {
      enabledResources: ["src/components", "src/utils"]
    }
  }
});

// CodeBaseService.attach() merges service defaults with agent config
// resulting in the union of both enabled resource sets
```

### Configuration Merging

When an agent attaches to the CodeBaseService:

1. Service defaults from `agentDefaults` are merged with
2. Agent-specific configuration from `agent.getAgentConfigSlice('codebase')`
3. The result determines which resources are enabled for that agent

During configuration merging, the service uses `ensureItemNamesLike` to handle wildcard patterns in resource names, mapping them to actual tool names.

## Services

### CodeBaseService

The main service class that implements `TokenRingService`. It manages a registry of `FileMatchResource` instances and provides methods for resource management and repository map generation.

**Service Interface:**

```typescript
interface TokenRingService {
  name: string;
  description: string;
  readonly options: z.output<typeof CodeBaseServiceConfigSchema>;

  attach(agent: Agent): void;
}
```

**Service Properties:**

- `name`: Service identifier ("CodeBaseService")
- `description`: Service description
- `resourceRegistry`: `KeyedRegistry<FileMatchResource>` - Registry managing all resource instances
- `options`: Service configuration options

**Resource Management Methods:**

```typescript
registerResource(
  name: string,
  resource: FileMatchResource
): void

getAvailableResources(): string[]

getEnabledResources(
  agent: Agent
): FileMatchResource[]

getEnabledResourceNames(
  agent: Agent
): Set<string>

setEnabledResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

enableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

disableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>
```

**Repository Mapping Methods:**

```typescript
async generateRepoMap(
  files: Set<string>,
  fileSystem: FileSystemService,
  agent: Agent
): Promise<string | null>

getLanguageFromExtension(
  ext: string
): LanguageEnum | null

formatFileOutput(
  filePath: string,
  chunks: any[]
): string | null
```

**Method Descriptions:**

- `registerResource(name, resource)`: Registers a new resource with the service, making it available for use
- `getAvailableResources()`: Returns all registered resource names as an array
- `getEnabledResources(agent)`: Returns an array of enabled `FileMatchResource` instances for the specified agent
- `getEnabledResourceNames(agent)`: Returns a `Set` of enabled resource names
- `setEnabledResources(resourceNames, agent)`: Sets the enabled resources to the provided list, replacing any existing resources
- `enableResources(resourceNames, agent)`: Adds the specified resources to the enabled set
- `disableResources(resourceNames, agent)`: Removes the specified resources from the enabled set
- `generateRepoMap(files, fileSystem, agent)`: Generates a repository map showing symbol snippets from the specified files
- `getLanguageFromExtension(ext)`: Maps file extensions to language types (typescript, javascript, python, c, cpp, rust, go, java, ruby, bash)
- `formatFileOutput(filePath, chunks)`: Formats file output for repository maps, showing the first line of each symbol

## Tools

This package does not define any tools. Resource operations are handled through the resource registry and agent commands.

## Providers

This package does not use provider registration patterns. Resources are registered directly with the CodeBaseService.

## RPC Endpoints

This package does not define any RPC endpoints.

## State Management

### CodeBaseState

The `CodeBaseState` class implements `AgentStateSlice` and manages the enabled resources state for agents.

**State Interface:**

```typescript
interface AgentStateSlice {
  name: string;
  enabledResources: Set<string>;

  transferStateFromParent(parent: Agent): void;
  reset(what: ResetWhat[]): void;
  serialize(): object;
  deserialize(data: any): void;
  show(): string[];
}
```

**State Methods:**

```typescript
constructor(initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"])

transferStateFromParent(parent: Agent): void

reset(what: ResetWhat[]): void

serialize(): object

deserialize(data: any): void

show(): string[]
```

**State Behavior:**

- `enabledResources`: A `Set<string>` containing the names of currently enabled resources
- `transferStateFromParent`: Copies enabled resources from parent agent state
- `reset`: No-op method (resources are not reset by default)
- `serialize`: Returns an object with `enabledResources` as an array
- `deserialize`: Restores enabled resources from serialized data
- `show`: Returns a formatted string showing enabled resources

**State Persistence:**

Enabled resources persist across agent sessions through the state serialization/deserialization mechanism. When an agent is created, it inherits the enabled resources from its parent agent via the `transferStateFromParent` method.

**State Initialization:**

```typescript
constructor(
  initialConfig: z.output<typeof CodeBaseServiceConfigSchema>["agentDefaults"]
)
```

The state is initialized with the enabled resources from the agent defaults configuration.

## Context Handlers

The plugin provides a context handler that injects relevant codebase information into chat sessions when files are being processed or when the agent needs code context.

### codebase-context Handler

The context handler generates three types of context items in the following order:

1. **File Tree Context**: Directory structure of the codebase for files that are not whole files or repo maps
2. **Repo Map Context**: Symbol information showing function and class signatures from repo map resources
3. **Whole File Context**: Complete contents of files from whole file resources

**Context Handler Function:**

```typescript
async function* getContextItems(
  input: string,
  chatConfig: ParsedChatConfig,
  params: {},
  agent: Agent
): AsyncGenerator<ContextItem>
```

**Context Generation Flow:**

```typescript
// 1. Generate file tree context for non-whole-file and non-repo-map resources
const fileTreeFiles = new Set<string>();
for (const resource of resources) {
  if (
    !(resource instanceof WholeFileResource) &&
    !(resource instanceof RepoMapResource)
  ) {
    await resource.addFilesToSet(fileTreeFiles, agent);
  }
}

if (fileTreeFiles.size > 0) {
  yield {
    role: "user",
    content: `// Directory Tree of project files:\n${Array.from(fileTreeFiles)
      .sort()
      .join("\n")}`,
  };
}

// 2. Generate repo map context for repo map resources
const repoMapFiles = new Set<string>();
for (const resource of resources) {
  if (resource instanceof RepoMapResource) {
    await resource.addFilesToSet(repoMapFiles, agent);
  }
}

if (repoMapFiles.size > 0) {
  const repoMap = await codebaseService.generateRepoMap(
    repoMapFiles,
    fileSystem,
    agent,
  );
  if (repoMap) {
    yield {
      role: "user",
      content: repoMap,
    };
  }
}

// 3. Generate whole file context for whole file resources
const wholeFiles = new Set<string>();
for (const resource of resources) {
  if (resource instanceof WholeFileResource) {
    await resource.addFilesToSet(wholeFiles, agent);
  }
}

for await (const file of wholeFiles) {
  const content = await fileSystem.readTextFile(file, agent);
  yield {
    role: "user",
    content: `// Complete contents of file: ${file}\n${content}`,
  };
}
```

**Context Handler Registration:**

The context handler is automatically registered during plugin installation:

```typescript
app.waitForService(ChatService, chatService => {
  chatService.registerContextHandlers(contextHandlers);
});
```

## Core Components

### FileTreeResource

Represents directory structure of the codebase. Extends `FileMatchResource` from `@tokenring-ai/filesystem`. Provides file trees showing the directory hierarchy of the codebase without including file contents.

**Class Definition:**

```typescript
import {FileMatchResource} from "@tokenring-ai/filesystem";

export default class FileTreeResource extends FileMatchResource {
  readonly name = "FileTreeService";
  description = "Provides FileTree functionality";
}
```

**Usage:**

```typescript
codebaseService.registerResource("src", new FileTreeResource({
  // FileMatchResource configuration options
}));
```

### RepoMapResource

Generates symbol-based repository maps showing function and class signatures. Uses `code-chopper` to parse code and extract symbols, providing the AI with a high-level view of the codebase structure.

**Class Definition:**

```typescript
import {FileMatchResource} from "@tokenring-ai/filesystem";

export default class RepoMapResource extends FileMatchResource {
  readonly name = "RepoMapResource";
  description = "Provides RepoMap functionality";
}
```

**Usage:**

```typescript
codebaseService.registerResource("api", new RepoMapResource({
  // FileMatchResource configuration options
}));
```

### WholeFileResource

Includes the full contents of specified files. Useful for configuration files, small utilities, or files that need complete context.

**Class Definition:**

```typescript
import {FileMatchResource} from "@tokenring-ai/filesystem";

export default class WholeFileResource extends FileMatchResource {
  readonly name = "WholeFileResource";
  description = "Provides whole files to include in the chat context";
}
```

**Usage:**

```typescript
codebaseService.registerResource("config", new WholeFileResource({
  // FileMatchResource configuration options
}));
```

## Usage Examples

### Basic Setup

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp();

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      "src": {
        type: "fileTree"
      },
      "api": {
        type: "repoMap"
      },
      "config": {
        type: "wholeFile"
      }
    },
    agentDefaults: {
      enabledResources: []
    }
  }
});
```

### Interactive Resource Selection

```bash
# Start a chat session
/codebase select

# The agent will display an interactive tree view of available resources
# Use arrow keys to navigate, space to select, and enter to confirm

# After selection, the enabled resources are updated automatically
# The agent will receive the selected resources in subsequent context
```

### Programmatic Resource Management

```typescript
import { Agent } from "@tokenring-ai/agent";
import { CodeBaseService } from "@tokenring-ai/codebase";

// Create an agent with codebase configuration
const agent = new Agent({
  config: {
    codebase: {
      enabledResources: ["src/components", "src/utils"]
    }
  }
});

// Get the CodeBaseService
const codebaseService = agent.requireServiceByType(CodeBaseService);

// Enable additional resources
codebaseService.enableResources(["src/types"], agent);

// List all enabled resources
const enabled = codebaseService.getEnabledResourceNames(agent);
console.log("Enabled resources:", Array.from(enabled));

// Disable specific resources
codebaseService.disableResources(["test/*"], agent);

// Set specific resources (replaces existing)
codebaseService.setEnabledResources(["src/api"], agent);
```

### Generating Repository Map

```typescript
import { Agent } from "@tokenring-ai/agent";
import { CodeBaseService } from "@tokenring-ai/codebase";
import { FileSystemService } from "@tokenring-ai/filesystem";

const agent = new Agent();
const codebaseService = agent.requireServiceByType(CodeBaseService);
const fileSystem = agent.requireServiceByType(FileSystemService);

// Get repo map resources
const repoMapResources = codebaseService.getEnabledResources(agent)
  .filter(resource => resource instanceof RepoMapResource);

// Collect files from all repo map resources
const repoMapFiles = new Set<string>();
for (const resource of repoMapResources) {
  await resource.addFilesToSet(repoMapFiles, agent);
}

// Generate repository map
const repoMap = await codebaseService.generateRepoMap(
  repoMapFiles,
  fileSystem,
  agent
);

if (repoMap) {
  console.log("Repository map:");
  console.log(repoMap);
}
```

### Custom Resource Registration

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";
import { FileMatchResource } from "@tokenring-ai/filesystem";

// Create a custom resource
class CustomResource extends FileMatchResource {
  name = "CustomResource";
  description = "Provides custom file matching logic";
}

// Register the custom resource
codebaseService.registerResource("custom", new CustomResource({
  // Resource-specific configuration
}));

// Enable the custom resource
codebaseService.enableResources(["custom"], agent);
```

### Multi-language Repository Mapping

The service automatically detects file types and generates appropriate repository maps:

```typescript
// Language mappings supported by getLanguageFromExtension
const languageMap = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".h": "c",
  ".c": "c",
  ".hxx": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".cpp": "cpp",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".rb": "ruby",
  ".sh": "bash",
  ".bash": "bash"
};

// Unsupported extensions return null and are skipped during repo map generation
```

### Context Injection in Chat

The context handler automatically injects codebase information when the agent needs it:

```typescript
// When the agent starts a chat session, the context handler generates:
// 1. File tree for non-whole-file, non-repo-map resources
// 2. Repo map for repo map resources
// 3. Whole file contents for whole file resources

// These context items are added to the chat as user messages:
// - Directory structure of project files
// - Symbol snippets from code files
// - Complete contents of specific files
```

## Integration

### FileSystemService

The CodeBaseService uses `FileSystemService` to retrieve file contents for generating repository maps and providing whole file context.

```typescript
import { FileSystemService } from "@tokenring-ai/filesystem";

const fileSystem = agent.requireServiceByType(FileSystemService);

// Read file content
const content = await fileSystem.readTextFile(filePath, agent);

// Get file metadata
const metadata = await fileSystem.getFileMetadata(filePath, agent);
```

### Agent

The plugin integrates with the agent system through several mechanisms:

**Chat Commands:**

Commands are registered through the plugin's install method:

```typescript
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands(chatCommands)
);
```

**Context Handlers:**

Context handlers are registered through the plugin's install method:

```typescript
app.waitForService(ChatService, chatService => {
  chatService.registerContextHandlers(contextHandlers);
});
```

**State Initialization:**

State is initialized when the agent attaches to the service:

```typescript
attach(agent: Agent): void {
  const { enabledResources } = deepMerge(this.options.agentDefaults, agent.getAgentConfigSlice('codebase', CodeBaseAgentConfigSchema));
  // The enabled resources can include wildcards, so they need to be mapped to actual tool names with ensureItemNamesLike
  agent.initializeState(CodeBaseState, {
    enabledResources: enabledResources.map(resourceName => this.resourceRegistry.ensureItemNamesLike(resourceName)).flat()
  });
}
```

### Plugin Installation

The plugin is installed during application initialization:

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp();

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      "src": {
        type: "fileTree"
      },
      "api": {
        type: "repoMap"
      },
      "config": {
        type: "wholeFile"
      }
    },
    agentDefaults: {
      enabledResources: []
    }
  }
});
```

## Best Practices

### Resource Selection Strategies

- **Use `/codebase select`** for interactive exploration when unsure of exact resource names
- **Start with file trees** for large codebases to provide directory structure
- **Add repo maps** for specific areas of interest (e.g., `api`, `components`)
- **Use whole files** only for small, critical files (e.g., `config`, `README`)
- **Enable resources incrementally** and test the context quality

### Performance Considerations

- **Large codebases**: Use file trees and repo maps instead of whole files to reduce context size
- **Multiple agents**: Configure different `enabledResources` for different agent types
- **Wildcard patterns**: Use wildcards (`src/*`) for enabling multiple resources efficiently
- **Lazy evaluation**: Resources are only loaded when needed during context generation

### Wildcard Pattern Matching

- Wildcard patterns in resource names are resolved using `ensureItemNamesLike`
- Patterns like `src/*` match all resources under `src/` directory
- Partial matches work (e.g., `src` matches `src/components`, `src/utils`)
- Multiple patterns on a single line are supported (e.g., `/codebase enable src/* utils/*`)

### State Management

- Resources persist across agent sessions through state serialization
- Use `transferStateFromParent` to inherit resources from parent agents
- Reset resources when needed using `reset()` method

### Error Handling

- Errors during file processing are logged but don't stop context generation
- Unsupported file types are skipped during repo map generation
- Empty resource sets are handled gracefully

### Agent Configuration

- Service defaults provide a baseline for all agents
- Agent-specific overrides allow customization per agent
- Use `getAgentConfigSlice('codebase')` to retrieve agent-specific configuration

## Testing and Development

### Running Tests

```bash
bun test
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"]
    }
  },
});
```

### Test Coverage

```bash
bun test --coverage
```

### Package Structure

```
pkg/codebase/
├── CodeBaseService.ts      # Main service class
├── FileTreeResource.ts      # File tree resource implementation
├── RepoMapResource.ts       # Repository map resource implementation
├── WholeFileResource.ts     # Whole file resource implementation
├── chatCommands.ts          # Chat command definitions
├── contextHandlers.ts       # Context handler definitions
├── schema.ts                # Configuration schemas
├── state/
│   └── codeBaseState.ts     # State management implementation
├── commands/
│   └── codebase.ts          # Chat command implementations
├── contextHandlers/
│   └── codebaseContext.ts   # Context handler implementation
├── plugin.ts                # Plugin registration
├── package.json             # Package metadata
└── index.ts                 # Public exports
```

### Build Instructions

```bash
bun run build
```

### Dependencies

- `@tokenring-ai/agent` - Central orchestration system
- `@tokenring-ai/app` - Base application framework and plugin system
- `@tokenring-ai/chat` - Chat service and context handling
- `@tokenring-ai/filesystem` - File system operations and resources
- `@tokenring-ai/utility` - Shared utilities including deepMerge and KeyedRegistry
- `code-chopper` - Code parsing and symbol extraction
- `zod` - Runtime type validation and schema definition

## Related Components

- **FileMatchResource**: Base class for all file-based resources from `@tokenring-ai/filesystem`
- **Chat Commands**: `/codebase select`, `/codebase enable`, `/codebase disable`, `/codebase set`, `/codebase list`, `/codebase clear`, `/codebase show repo`
- **Context Handlers**: `codebase-context` - Automatic codebase context injection
- **Agent State**: `CodeBaseState` - Resource enablement state management
- **KeyedRegistry**: Resource registry pattern from `@tokenring-ai/utility`

## License

MIT License
