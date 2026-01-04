# Codebase Plugin

## Overview

The Codebase Plugin manages resources for providing file content and directory structure to AI context. It allows selective inclusion of project files and directories, enabling the AI to reference codebase structure and specific files during interactions. The plugin enables AI agents to reason about and interact with the codebase by providing file trees, full file contents, and symbol information as needed through context handlers.

## Usage Examples

### Interactive Resource Selection

```
/codebase select
```

Enables an interactive tree view for selecting which codebase resources to include in the chat context.

### Enabling Resources

```
/codebase enable src/* utils/*
```

Enables specific resources by name, supporting wildcard patterns for matching multiple resources.

### Disabling Resources

```
/codebase disable test/*
```

Disables specific resources from the enabled set.

### Listing Enabled Resources

```
/codebase list
```

Displays all currently enabled codebase resources.

### Generating Repository Map

```
/codebase show repo
```

Displays the repository map showing symbols (functions, classes) from enabled RepoMap resources.

### Clearing All Resources

```
/codebase clear
```

Removes all resources from the enabled set.

### Setting Specific Resources

```
/codebase set src/api
```

Replaces the current enabled resources with the specified set.

## Core Properties

### FileTreeResource

Represents directory structure of the codebase. Extends `FileMatchResource` from `@tokenring-ai/filesystem`. Provides file trees showing the directory hierarchy of the codebase without including file contents.

### RepoMapResource

Generates symbol-based repository maps showing function and class signatures. Uses `code-chopper` to parse code and extract symbols, providing the AI with a high-level view of the codebase structure.

### WholeFileResource

Includes the full contents of specified files. Useful for configuration files, small utilities, or files that need complete context.

### CodeBaseState

Manages state for enabled resources across agent sessions. Implements `AgentStateSlice` interface for persistence and restoration.

## Key Features

- **Resource Management**: Register and manage multiple types of codebase resources (file trees, repo maps, whole files)
- **Interactive Selection**: Tree-based interactive selection for exploring available resources
- **Repository Map Generation**: Automatic symbol extraction using code-chopper for multi-language support
- **Context Injection**: Automatic context injection to AI agents through context handlers
- **State Persistence**: Enabled resources persist across agent sessions
- **Wildcard Support**: Resource names support wildcard patterns for flexible matching
- **Multi-language Support**: Automatic language detection for TypeScript, JavaScript, Python, C/C++, Rust, Go, Java, Ruby, and Bash

## Core Methods/API

### CodeBaseService Methods

#### registerResource

```typescript
registerResource(name: string, resource: FileMatchResource): void
```

Registers a new resource with the service.

#### getAvailableResources

```typescript
getAvailableResources(): string[]
```

Returns all available resource names.

#### getEnabledResources

```typescript
getEnabledResources(agent: Agent): FileMatchResource[]
```

Returns currently enabled resources for the specified agent.

#### getEnabledResourceNames

```typescript
getEnabledResourceNames(agent: Agent): Set<string>
```

Returns the names of currently enabled resources.

#### enableResources

```typescript
enableResources(resourceNames: string[], agent: Agent): Set<string>
```

Enables specified resources by name. Returns the updated enabled set.

#### disableResources

```typescript
disableResources(resourceNames: string[], agent: Agent): Set<string>
```

Disables specified resources by name. Returns the updated enabled set.

#### setEnabledResources

```typescript
setEnabledResources(resourceNames: string[], agent: Agent): Set<string>
```

Sets the enabled resources to the provided list, replacing any existing enabled resources.

#### generateRepoMap

```typescript
generateRepoMap(
  files: Set<string>,
  fileSystem: FileSystemService,
  agent: Agent
): Promise<string | null>
```

Generates a repository map from specified files, showing symbol snippets. Uses code-chopper for parsing and supports multiple languages.

#### getLanguageFromExtension

```typescript
getLanguageFromExtension(ext: string): LanguageEnum | null
```

Maps file extensions to language types. Returns the language enum for the extension or null if unsupported.

### Resource Methods

#### FileMatchResource Methods

Resources extend `FileMatchResource` which provides:

- `addFilesToSet(fileSet: Set<string>, agent: Agent)`: Adds files matching the resource criteria to the set

## Usage Examples

### Basic Configuration

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";

const appConfig = {
  codebase: {
    resources: {
      "src": {
        type: "fileTree",
      },
      "api": {
        type: "repoMap",
      },
      "config": {
        type: "wholeFile",
      },
    },
    agentDefaults: {
      enabledResources: ["src", "api"],
    },
  },
};

app.addPlugin(codeBasePlugin, appConfig.codebase);
```

### Enabling Resources Programmatically

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";
import { Agent } from "@tokenring-ai/agent";

// Get the CodeBaseService from the agent
const codebaseService = agent.requireServiceByType(CodeBaseService);

// Enable specific resources
codebaseService.enableResources(["src/components", "src/utils"], agent);

// List enabled resources
const enabled = Array.from(codebaseService.getEnabledResourceNames(agent));
console.log("Enabled resources:", enabled);
```

### Generating Repository Map

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";
import { FileSystemService } from "@tokenring-ai/filesystem";

const codebaseService = agent.requireServiceByType(CodeBaseService);
const fileSystem = agent.requireServiceByType(FileSystemService);

const files = new Set([
  "src/main.ts",
  "src/components/Button.tsx",
  "src/utils/helpers.ts",
]);

const repoMap = await codebaseService.generateRepoMap(files, fileSystem, agent);
console.log("Repository map:", repoMap);
```

### Using Context Handler

The plugin automatically adds context items when the chat session starts. Context items are generated through the `codebase-context` handler:

```typescript
// Context generation flow
for (const fileTreeFile of fileTreeFiles) {
  // File tree context: directory structure
  yield {
    role: "user",
    content: `// Directory Tree of project files:\n${fileTreeFiles.sort().join("\n")}`,
  };
}

for (const repoMapFile of repoMapFiles) {
  // Repo map context: symbol information
  const repoMap = await codebaseService.generateRepoMap(repoMapFiles, fileSystem, agent);
  yield {
    role: "user",
    content: repoMap,
  };
}

for (const wholeFile of wholeFiles) {
  // Whole file context: complete file contents
  const content = await fileSystem.getFile(wholeFile, agent);
  yield {
    role: "user",
    content: `// Complete contents of file: ${wholeFile}\n${content}`,
  };
}
```

### Multi-language Repository Mapping

The service automatically detects file types and generates appropriate repository maps:

```typescript
// Language mappings
getLanguageFromExtension(".js")   // "javascript"
getLanguageFromExtension(".ts")   // "typescript"
getLanguageFromExtension(".tsx")  // "typescript"
getLanguageFromExtension(".py")   // "python"
getLanguageFromExtension(".c")    // "c"
getLanguageFromExtension(".h")    // "c"
getLanguageFromExtension(".cpp")  // "cpp"
getLanguageFromExtension(".rs")   // "rust"
getLanguageFromExtension(".go")   // "go"
getLanguageFromExtension(".java") // "java"
getLanguageFromExtension(".rb")   // "ruby"
getLanguageFromExtension(".sh")   // "bash"
```

## Configuration

The Codebase service is configured via the `codebase` section in the agent's configuration.

### Configuration Schema

```typescript
import { z } from "zod";

const CodeBaseAgentConfigSchema = z.object({
  enabledResources: z.array(z.string()).optional()
}).default({});

const CodeBaseServiceConfigSchema = z.object({
  resources: z.record(z.string(), z.any()),
  agentDefaults: z.object({
    enabledResources: z.array(z.string()).default([])
  }).default({ enabledResources: [] })
});
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `resources` | `Record<string, ResourceConfig>` | Registry of available resources |
| `agentDefaults.enabledResources` | `string[]` | Resources enabled by default for agents |

### Resource Configuration

```json
{
  "codebase": {
    "resources": {
      "src": {
        "type": "fileTree"
      },
      "api-docs": {
        "type": "repoMap"
      },
      "config": {
        "type": "wholeFile"
      }
    },
    "agentDefaults": {
      "enabledResources": ["src", "api-docs"]
    }
  }
}
```

### Plugin Configuration

```typescript
const packageConfigSchema = z.object({
  codebase: CodeBaseServiceConfigSchema.optional(),
});
```

## Integration

### FileSystemService

Used to retrieve file contents. The CodeBaseService uses FileSystemService to read files for generating repository maps and providing whole file context.

### Agent

- Registers chat commands via `AgentCommandService`
- Registers context handlers via `ChatService`
- Initializes state via `CodeBaseState`
- Provides agent configuration via `getAgentConfigSlice`

### Chat Commands

Commands are registered through the plugin:

```typescript
import chatCommands from "./chatCommands";

agentCommandService.addAgentCommands(chatCommands);
```

### Context Handlers

Context handlers are registered through the plugin:

```typescript
import contextHandlers from "./contextHandlers";

chatService.registerContextHandlers(contextHandlers);
```

### State Management

State is managed through `CodeBaseState` which implements `AgentStateSlice`:

```typescript
class CodeBaseState implements AgentStateSlice {
  name = "CodeBaseState";
  enabledResources = new Set<string>([]);

  serialize(): object {
    return { enabledResources: Array.from(this.enabledResources) };
  }

  deserialize(data: any): void {
    this.enabledResources = new Set(data.enabledResources || []);
  }
}
```

## Best Practices

### Resource Selection

- Use `/codebase select` to explore available resources when unsure of exact names
- The interactive selection provides a tree view of all available resources

### Performance Considerations

- For large codebases, prefer RepoMap resources over WholeFile resources to reduce context size
- Use fileTree resources for directory structure when full contents aren't needed

### Wildcard Patterns

- Use wildcard patterns (e.g., `src/*`) for enabling multiple resources at once
- Wildcards are resolved using `ensureItemNamesLike` which matches partial names

### Language Detection

- Ensure file extensions match expected languages for proper repo map generation
- Unsupported file types are skipped during repo map generation

## Testing

The plugin uses Vitest for testing.

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
  },
});
```

### Test Coverage

```bash
bun test --coverage
```

## Related Components

- **FileTreeResource**: Manages directory tree structure
- **RepoMapResource**: Generates symbol-based repository maps
- **WholeFileResource**: Includes full contents of specific files
- **CodeBaseState**: Manages enabled resource state
- **CodeBaseService**: Main service class
- **Chat Commands**: `/codebase select`, `/codebase enable`, `/codebase disable`, `/codebase list`, `/codebase clear`, `/codebase show repo`
