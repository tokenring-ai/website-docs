# @tokenring-ai/codebase

## User Guide

### Overview and Purpose

The `@tokenring-ai/codebase` package provides a service for managing codebase
resources in TokenRing AI agents. Its primary purpose is to selectively include
project files, directory structures, and repository maps into the agent's
context through context handlers.

This enables AI agents to reason about and interact with the codebase by
providing file trees, full file contents, and symbol information as needed.

### Key Features

- **Multiple Resource Types**: File trees, repository maps, and whole files
- **Interactive Management**: Agent commands for resource selection
- **State Management**: Persistent resource enablement across sessions
- **Wildcard Support**: Pattern matching for resource selection
- **Multi-language Repository Mapping**: Symbol extraction for 10 languages
- **Context Injection**: Automatic codebase context in chat sessions
- **Symbol-Level Mapping**: Uses code-chopper for symbol extraction

### Chat Commands

The package provides a comprehensive set of agent commands for managing
codebase resources. These commands are available in the agent chat interface.

| Command | Description |
| :------ | :---------- |
| `/codebase select` | Interactive resource selection via tree view |
| `/codebase enable` | Enable specific resources (adds to selection) |
| `/codebase disable` | Disable specific resources (removes from selection) |
| `/codebase set` | Set resources (replaces current selection) |
| `/codebase reset` | Reset to initial configuration |
| `/codebase list` | List currently enabled resources |
| `/codebase show repo` | Display repository map and structure |

#### Command Usage Examples

```text
# Browse and select resources interactively via tree view
/codebase select

# Set specific codebase resources by name (replaces selection)
/codebase set src docs

# Enable all resources matching wildcard pattern
/codebase enable src/*

# Enable specific resources by name (adds to selection)
/codebase enable api docs

# Disable specific resources matching wildcard pattern
/codebase disable src/*

# Show currently enabled resources
/codebase list

# Reset to initial configuration
/codebase reset

# View repository structure and symbols
/codebase show repo
```

### Configuration

The plugin provides configuration through the `codebase` section of your app
configuration.

#### Configuration Schema

```typescript
import { z } from "zod";

export const CodeBaseAgentConfigSchema = z
  .object({
    enabledResources: z.array(z.string()).optional(),
  })
  .default({});

export const CodeBaseServiceConfigSchema = z.object({
  resources: z.record(z.string(), z.any()),
  agentDefaults: z
    .object({
      enabledResources: z.array(z.string()).default([]),
    })
    .default({ enabledResources: [] }),
});
```

#### Configuration Example

```yaml
codebase:
  resources:
    src:
      type: fileTree
    docs:
      type: repoMap
    config:
      type: wholeFile
  agentDefaults:
    enabledResources: []
```

#### Plugin Registration

```typescript
import codeBasePlugin from "@tokenring-ai/codebase";
import TokenRingApp from "@tokenring-ai/app";

const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        src: { type: "fileTree" },
        docs: { type: "repoMap" },
        config: { type: "wholeFile" },
      },
      agentDefaults: {
        enabledResources: [],
      },
    },
  },
});

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      src: { type: "fileTree" },
      docs: { type: "repoMap" },
      config: { type: "wholeFile" },
    },
    agentDefaults: {
      enabledResources: [],
    },
  },
});
```

#### Environment Variables

This package does not define any environment variables. Configuration is
provided through the plugin configuration object.

### Integration

The codebase package integrates with the following components:

- **ChatService**: Registers context handlers for automatic context injection
- **AgentCommandService**: Registers agent commands for resource management
- **FileSystemService**: Provides file reading capabilities for repository
  map generation
- **Agent**: Manages agent-specific state and configuration

### Best Practices

#### Resource Selection Strategies

- Use `/codebase select` for interactive exploration when unsure of exact
  resource names
- Start with file trees for large codebases to provide directory structure
- Add repo maps for specific areas of interest (e.g., `api`, `components`)
- Use whole files only for small, critical files (e.g., `config`, `README`)
- Enable resources incrementally and test the context quality

#### Performance Considerations

- Large codebases: Use file trees and repo maps instead of whole files to
  reduce context size
- Multiple agents: Configure different `enabledResources` for different agent
  types
- Wildcard patterns: Use wildcards (`src/*`) for enabling multiple resources
  efficiently
- Lazy evaluation: Resources are only loaded when needed during context
  generation

#### State Management

- Resources persist across agent sessions through state serialization
- Use `transferStateFromParent` to inherit resources from parent agents
- Reset resources when needed using the `/codebase reset` command

---

## Developer Reference

### Core Components

The package consists of the following core components:

- **CodeBaseService**: Main service implementing `TokenRingService`
- **FileTreeResource**: Provides directory structure context
- **RepoMapResource**: Provides symbol-level repository mapping
- **WholeFileResource**: Provides complete file contents
- **CodeBaseState**: Manages agent state for enabled resources

### Services

#### CodeBaseService

The main service class implementing `TokenRingService`. It manages a registry
of `FileMatchResource` instances and provides methods for resource management
and repository map generation.

**Service Properties:**

| Property | Type | Description |
| :------- | :--- | :---------- |
| `name` | `"CodeBaseService"` | Service identifier |
| `description` | `string` | Service description |
| `resourceRegistry` | `KeyedRegistry<FileMatchResource>` | Registry managing resources |
| `options` | `CodeBaseServiceConfigSchema` | Service configuration options |

**Resource Management Methods:**

```typescript
// Registers a new resource with the service's internal KeyedRegistry
registerResource(name: string, resource: FileMatchResource): void

// Returns all registered resource names as a sorted array
getAvailableResources(): string[]

// Returns the names of currently enabled resources from agent state
getEnabledResourceNames(agent: Agent): Set<string>

// Returns the currently enabled FileMatchResource instances
getEnabledResources(agent: Agent): FileMatchResource[]

// Sets enabled resources (replaces current selection); handles wildcards
setEnabledResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

// Enables specific resources (adds to current selection); handles wildcards
enableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>

// Disables specific resources (removes from current selection)
disableResources(
  resourceNames: string[],
  agent: Agent
): Set<string>
```

**Repository Mapping Methods:**

```typescript
// Generates repository map from files using code-chopper
async generateRepoMap(
  files: Set<string>,
  fileSystem: FileSystemService,
  agent: Agent
): Promise<string | null>

// Maps file extension to language type for code-chopper
getLanguageFromExtension(ext: string): LanguageEnum | null

// Formats repository map output from code chunks
formatFileOutput(
  filePath: string,
  chunks: any[]
): string | null
```

**Supported Languages:**

| Extension | Language |
| :-------- | :------- |
| `.js`, `.jsx` | javascript |
| `.ts`, `.tsx` | typescript |
| `.py` | python |
| `.h`, `.c` | c |
| `.hxx`, `.cxx`, `.hpp`, `.cpp` | cpp |
| `.rs` | rust |
| `.go` | go |
| `.java` | java |
| `.rb` | ruby |
| `.sh`, `.bash` | bash |

### Provider Documentation

The package includes three resource types that extend `FileMatchResource` from
`@tokenring-ai/filesystem`.

#### FileTreeResource

Extends `FileMatchResource`. Provides directory structure and file tree context
for enabled resources.

```typescript
import { FileMatchResource } from "@tokenring-ai/filesystem";

export default class FileTreeResource extends FileMatchResource {
  readonly name = "FileTreeService";
  description = "Provides FileTree functionality";
}
```

**Usage:**

```typescript
codebaseService.registerResource("src", new FileTreeResource({}));
```

**Methods:**

- `addFilesToSet(files: Set<string>, agent: Agent): Promise<void>` - Inherited
  from `FileMatchResource`

#### RepoMapResource

Extends `FileMatchResource`. Provides symbol-level repository mapping using
code-chopper.

```typescript
import { FileMatchResource } from "@tokenring-ai/filesystem";

export default class RepoMapResource extends FileMatchResource {
  readonly name = "RepoMapResource";
  description = "Provides RepoMap functionality";
}
```

**Usage:**

```typescript
codebaseService.registerResource("api", new RepoMapResource({}));
```

**Methods:**

- `addFilesToSet(files: Set<string>, agent: Agent): Promise<void>` - Inherited
  from `FileMatchResource`

#### WholeFileResource

Extends `FileMatchResource`. Provides complete file contents to agent context.

```typescript
import { FileMatchResource } from "@tokenring-ai/filesystem";

export default class WholeFileResource extends FileMatchResource {
  readonly name = "WholeFileResource";
  description = "Provides whole files to include in the chat context";
}
```

**Usage:**

```typescript
codebaseService.registerResource("config", new WholeFileResource({}));
```

**Methods:**

- `addFilesToSet(files: Set<string>, agent: Agent): Promise<void>` - Inherited
  from `FileMatchResource`

### Usage Examples

#### Basic Setup

```typescript
import TokenRingApp from "@tokenring-ai/app";
import codeBasePlugin from "@tokenring-ai/codebase";

const app = new TokenRingApp({
  config: {
    codebase: {
      resources: {
        src: { type: "fileTree" },
        api: { type: "repoMap" },
        config: { type: "wholeFile" },
      },
      agentDefaults: {
        enabledResources: [],
      },
    },
  },
});

app.install(codeBasePlugin, {
  codebase: {
    resources: {
      src: { type: "fileTree" },
      api: { type: "repoMap" },
      config: { type: "wholeFile" },
    },
    agentDefaults: {
      enabledResources: [],
    },
  },
});
```

#### Manual Service Usage

```typescript
import { CodeBaseService } from "@tokenring-ai/codebase";
import { FileSystemService } from "@tokenring-ai/filesystem";
import { Agent } from "@tokenring-ai/agent";

// Create and configure service
const codebaseService = new CodeBaseService({
  resources: {
    src: { type: "fileTree" },
    api: { type: "repoMap" },
  },
  agentDefaults: {
    enabledResources: [],
  },
});

// Register resources
codebaseService.registerResource("src", new FileTreeResource({}));
codebaseService.registerResource("api", new RepoMapResource({}));

// Generate repository map
const agent = new Agent(/* config */);
const fileSystem = new FileSystemService();
const files = new Set(["src/main.ts", "src/utils.ts"]);
const repoMap = await codebaseService.generateRepoMap(
  files, fileSystem, agent
);
```

#### Managing Resources

```typescript
// Get enabled resource names (returns Set<string>)
const names = codebaseService.getEnabledResourceNames(agent);

// Get enabled resource instances (returns FileMatchResource[])
const resources = codebaseService.getEnabledResources(agent);

// Set enabled resources (mutates state, replaces current selection)
const updated = codebaseService.setEnabledResources(["src", "api"], agent);

// Enable resources (mutates state, adds to current selection)
const added = codebaseService.enableResources(["doc"], agent);

// Disable resources (mutates state, removes from current selection)
const removed = codebaseService.disableResources(["src"], agent);

// Handle wildcard patterns (e.g., "src/*" matches all resources under src/)
const wildcardMatched = codebaseService.enableResources(["src/*"], agent);
```

#### Using Commands

```typescript
// Select resources interactively
await agent.executeChatCommand("codebase select");

// Enable specific resources
await agent.executeChatCommand("codebase enable src docs");

// List currently enabled resources
await agent.executeChatCommand("codebase list");

// Reset to initial configuration
await agent.executeChatCommand("codebase reset");

// Show repository map
await agent.executeChatCommand("codebase show repo");
```

#### Interactive Resource Selection

```typescript
import { buildResourceTree } from
  "@tokenring-ai/codebase/commands/codebase/buildResourceTree";

const resources = ["src/utils", "src/types", "api/handlers", "docs/readme"];
const tree = buildResourceTree(resources);

// Result:
// [
//   {
//     name: "src",
//     children: [
//       { name: "utils", value: "src/utils" },
//       { name: "types", value: "src/types" }
//     ]
//   },
//   {
//     name: "api",
//     children: [
//       { name: "handlers", value: "api/handlers" }
//     ]
//   },
//   {
//     name: "docs",
//     children: [
//       { name: "readme", value: "docs/readme" }
//     ]
//   }
// ]

// Resources without a path prefix (no slash) are grouped under "Unknown"
const resources2 = ["utils", "types", "api/handlers"];
const tree2 = buildResourceTree(resources2);
```

### Testing

#### Running Tests

```bash
bun run test
```

#### Test Watch Mode

```bash
bun run test:watch
```

#### Test Coverage

```bash
bun run test:coverage
```

#### Test Configuration

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

### Dependencies

#### Runtime Dependencies

| Package | Version | Description |
| :------ | :------ | :---------- |
| `@tokenring-ai/agent` | 0.2.0 | Central orchestration system for agent management |
| `@tokenring-ai/app` | 0.2.0 | Base application framework with plugin architecture |
| `@tokenring-ai/chat` | 0.2.0 | Chat service and context handlers |
| `@tokenring-ai/filesystem` | 0.2.0 | File system operations and `FileMatchResource` base class |
| `@tokenring-ai/utility` | 0.2.0 | Shared utilities including `KeyedRegistry`, `deepMerge`, and `numberedList` |
| `code-chopper` | ^0.1.8 | Code parsing and symbol extraction library |
| `zod` | ^4.3.6 | Schema validation and type inference |

#### Dev Dependencies

| Package | Version | Description |
| :------ | :------ | :---------- |
| `vitest` | ^4.1.1 | Testing framework |
| `typescript` | ^6.0.2 | TypeScript compiler |

### Related Components

- **FileMatchResource**: Base class for all file-based resources from
  `@tokenring-ai/filesystem`
- **Chat Commands**: `/codebase select`, `/codebase enable`, `/codebase
  disable`, `/codebase set`, `/codebase reset`, `/codebase list`, `/codebase
  show repo`
- **Context Handlers**: `codebase-context` - Automatic codebase context
  injection
- **Agent State**: `CodeBaseState` - Resource enablement state management
- **KeyedRegistry**: Resource registry pattern from `@tokenring-ai/utility`

### Package Structure

```text
pkg/codebase/
├── commands/
│   └── codebase/
│       ├── buildResourceTree.ts   # Tree building for interactive selection
│       ├── disable.ts             # codebase disable command
│       ├── enable.ts              # codebase enable command
│       ├── list.ts                # codebase list command
│       ├── reset.ts               # codebase reset command
│       ├── select.ts              # codebase select command
│       ├── set.ts                 # codebase set command
│       └── showRepo.ts            # codebase show repo command
├── contextHandlers/
│   └── codebaseContext.ts        # Context handler for chat integration
├── state/
│   └── codeBaseState.ts          # Agent state management
├── CodeBaseService.ts            # Main service implementation
├── FileTreeResource.ts           # File tree resource provider
├── RepoMapResource.ts            # Repository map resource provider
├── WholeFileResource.ts          # Whole file resource provider
├── commands.ts                   # Command exports (barrel file)
├── contextHandlers.ts            # Context handler exports (barrel file)
├── index.ts                      # Public API exports
├── plugin.ts                     # Plugin registration and installation
├── schema.ts                     # Configuration schemas
├── package.json                  # Package metadata
├── vitest.config.ts             # Test configuration
├── LICENSE                       # License file
└── README.md                     # Package README
```

### Public API Exports

The package uses the following export pattern in `package.json`:

```json
{
  "exports": {
    ".": "./index.ts",
    "./*": "./*.ts"
  }
}
```

#### Main Entry Point (`@tokenring-ai/codebase`)

```typescript
// Resource types
export { default as FileTreeResource } from "./FileTreeResource.ts";
export { default as RepoMapResource } from "./RepoMapResource.ts";
export { default as WholeFileResource } from "./WholeFileResource.ts";

// Main service
export { default as CodeBaseService } from "./CodeBaseService.ts";
```

#### Direct File Imports

```typescript
// Plugin
import codeBasePlugin from "@tokenring-ai/codebase/plugin";

// Configuration schemas
import {
  CodeBaseServiceConfigSchema,
  CodeBaseAgentConfigSchema
} from "@tokenring-ai/codebase/schema";

// Context handlers
import contextHandlers from "@tokenring-ai/codebase/contextHandlers";

// Commands
import agentCommands from "@tokenring-ai/codebase/commands";

// State management
import { CodeBaseState } from "@tokenring-ai/codebase/state/codeBaseState";

// Utility functions
import { buildResourceTree } from
  "@tokenring-ai/codebase/commands/codebase/buildResourceTree";
```

## License

MIT License - see LICENSE file for details.
