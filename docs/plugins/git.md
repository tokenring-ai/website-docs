# @tokenring-ai/git

The `@tokenring-ai/git` package provides Git integration for Token Ring AI agents, enabling automated Git operations through tools, slash commands, and hooks. This package integrates deeply with the Token Ring ecosystem, providing AI-powered commit messages, safe rollback operations, and comprehensive branch management.

## Overview

The Git package enables AI-driven Git operations for Token Ring agents, including:
- AI-powered commit message generation from chat context
- Automated commits after successful testing via hooks
- Interactive slash commands for Git operations
- Complete branch management (list, create, switch, delete, current)
- Safe rollback operations with validation
- Comprehensive error handling and state management

## Key Features

- **AI-Powered Commit Messages**: Generate commit messages based on last 2 chat messages
- **Automated Commits**: Automatic commits after testing completes via autoCommit hook
- **Interactive Commands**: Slash commands for Git operations (/git)
- **Branch Management**: Full branch lifecycle management (list, create, switch, delete, current)
- **Safe Rollbacks**: Validates clean state before rollbacks
- **Filesystem Integration**: Deep integration with TokenRing's FileSystemService
- **Error Handling**: Comprehensive tool-name prefixed error messages
- **State Validation**: Clean state checks for commits and rollbacks

## Core Components

### GitService

The main service class provides basic Git service metadata.

```typescript
import { GitService } from "@tokenring-ai/git";

// Access via dependency injection
const gitService = agent.requireServiceByType(GitService);
```

**Properties:**
- `name: string = "GitService"` - Service identifier
- `description: string = "Provides Git functionality"` - Service description

**Note:** GitService provides only metadata and registration. Use tools (`git_commit`, `git_rollback`, `git_branch`) or chat commands for actual Git operations.

## Services

### GitService

The main service class that provides Git service metadata.

```typescript
import GitService from "@tokenring-ai/git/GitService";

const gitService = new GitService();
console.log(gitService.name); // "GitService"
console.log(gitService.description); // "Provides Git functionality"
```

**Properties:**
- `name: string = "GitService"`: Service identifier
- `description: string = "Provides Git functionality"`: Service description

## Core Methods/API

### Tools

The git package provides tools that are automatically registered with the agent's chat service.

**Important Export Pattern:** The `tools.ts` file exports only `commitTool` and `rollbackTool`. The `git_branch` tool is available as a standalone file but is NOT exported from `tools.ts`.

```typescript
// tools.ts exports
import commitTool from "./tools/commit.ts";
import rollbackTool from "./tools/rollback.ts";

export default {
  commitTool,
  rollbackTool,
  // Note: git_branch is NOT exported here
};

// git_branch is available as standalone import
import branchTool from "@tokenring-ai/git/tools/branch.ts";
```

#### git_commit

Commits changes to the Git repository with optional AI-generated commit messages.

```typescript
import commitTool from "@tokenring-ai/git/tools/commit.ts";

// Tool is registered automatically via the plugin
await agent.executeTool('git_commit', { message: "Fix authentication bug" });
```

**Input Schema:**
```typescript
const inputSchema = z.object({
  message: z
    .string()
    .describe(
      "Optional commit message. If not provided, a message will be generated based on the chat context.",
    )
    .optional(),
});
```

**Parameters:**
- `message?: string` - Optional custom commit message. If not provided, generates one using AI based on chat context

**Functionality:**
- Automatically adds all changes (`git add .`)
- Uses AI to generate commit messages when none provided by extracting last 2 chat messages
- Sets git user identity as "TokenRing Coder / coder@tokenring.ai"
- Returns only success message without tool name prefix
- Calls `filesystem.setDirty(false)` after successful commit

**AI Message Generation:**
- Extracts context from last 2 messages from ChatService
- Uses specific prompt: "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text.."
- Falls back to "TokenRing Coder Automatic Checkin" if AI returns empty
- Caches and logs tool result with tool name prefix

#### git_rollback

Rolls back to a previous git commit with validation.

```typescript
import rollbackTool from "@tokenring-ai/git/tools/rollback.ts";

// Rollback by number of steps
await agent.executeTool('git_rollback', { steps: 2 });

// Rollback to specific commit hash
await agent.executeTool('git_rollback', { commit: "abc123def456" });
```

**Input Schema:**
```typescript
const inputSchema = z.object({
  commit: z.string().describe("The commit hash to rollback to").optional(),
  steps: z.number().int().describe("Number of commits to roll back").optional(),
});
```

**Parameters:**
- `commit?: string` - Specific commit hash to reset to
- `steps?: number` - Number of commits to roll back (default: 1)

**Functionality:**
- Validates no uncommitted changes exist via `git status --porcelain`
- Throws error with tool name prefix if uncommitted changes detected
- Performs `git reset --hard` for specified commit or HEAD~N
- Supports rollback by number of steps (positive integers only)
- Supports rollback to specific commit hash
- Throws descriptive error with tool name prefix on failure

#### git_branch

Manages git branches - list, create, switch, delete, or show current branch.

```typescript
import branchTool from "@tokenring-ai/git/tools/branch.ts";

// List all branches
await agent.executeTool('git_branch', { action: "list" });

// Show current branch
await agent.executeTool('git_branch', { action: "current" });

// Create a new branch
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });

// Switch to an existing branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });

// Delete a branch
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });
```

**Input Schema:**
```typescript
const inputSchema = z.object({
  action: z
    .enum(["list", "create", "switch", "delete", "current"])
    .describe("The branch action to perform"),
  branchName: z
    .string()
    .describe(
      "The name of the branch (required for create, switch, and delete actions)",
    )
    .optional(),
});
```

**Parameters:**
- `action: "list" | "create" | "switch" | "delete" | "current"` - The branch action to perform
- `branchName?: string` - The name of the branch (required for create, switch, and delete actions)

**Functionality by Action:**

`list` - List all branches (local and remote):
```typescript
await agent.executeTool('git_branch', { action: "list" });
// Returns all branches from git branch -a
// Agent output includes tool name prefix for each branch line
```

`current` - Show current branch:
```typescript
await agent.executeTool('git_branch', { action: "current" });
// Returns current branch name from git branch --show-current
```

`create` - Create a new branch:
```typescript
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });
// Creates and switches to new branch using git checkout -b
// Agent confirms successful creation and checkout
```

`switch` - Switch to an existing branch:
```typescript
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });
// Switches to existing branch using git checkout
// Agent confirms successful switch
```

`delete` - Delete a branch:
```typescript
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });
// Deletes branch using git branch -d
// Agent confirms successful deletion
```

`default` - When no action or branchName specified:
```typescript
await agent.executeTool('git_branch', {});
// Shows current branch and all local branches
// Returns tool-prefixed output for current branch and each local branch
```

## Chat Commands

### /git Command

The `/git` command provides an interactive interface to Git operations through the agent command system.

**Usage:**
```
/git <action> [options]
```

**Available Actions:**

#### `/git commit [message]`

Commits changes in the source directory to git. If no message is provided, an AI-generated commit message will be used.

**Examples:**
```
/git commit
/git commit "Fix authentication bug"
```

**Functionality:**
- Uses the `git_commit` tool internally
- Parses remaining arguments as commit message
- Falls back to AI-generated message if no message provided

#### `/git rollback [steps]`

Rolls back to a previous commit state.

**Examples:**
```
/git rollback
/git rollback 3
```

**Functionality:**
- Uses the `git_rollback` tool internally
- Parses optional steps argument (default: 1)
- Validates positive integer input

#### `/git branch [action] [branchName]`

Manages git branches. If no action is specified, lists all branches (local and remote).

**Actions:**
- `list` - List all branches (local and remote)
- `current` - Show current branch
- `create` - Create and switch to a new branch
- `switch` - Switch to an existing branch
- `delete` - Delete a branch

**Examples:**
```
/git branch
/git branch list
/git branch current
/git branch create feature-xyz
/git branch switch main
/git branch delete feature-xyz
```

**Functionality:**
- Uses the `git_branch` tool internally
- Validates action names and branch names
- Provides helpful error messages for invalid inputs
- Default action (when no action specified) is `list` which shows all branches (local and remote)

## Configuration

### Plugin Configuration

The plugin has an empty configuration schema:

```typescript
const config = z.object({}); // No configuration required
```

### Default Git User

All git commits use the following identity:
- **Name**: `TokenRing Coder`
- **Email**: `coder@tokenring.ai`

This is set globally within each git command execution using `-c` flag.

### Configuration Schema Details

```typescript
// Plugin-level configuration (packageConfigSchema)
const packageConfigSchema = z.object({}); // Empty

// No agent-level configuration available
// All behavior is controlled via tools, commands, and hooks
```

## Integration

### Plugin Registration

Automatically registers GitService, tools, and hooks with the TokenRing app through plugin.ts.

```typescript
import gitPlugin from '@tokenring-ai/git';

// Automatic registration via plugin
app.registerPlugin(gitPlugin);
```

**Plugin Structure:**
```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {AgentCommandService, AgentLifecycleService} from "@tokenring-ai/agent";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import agentCommands from "./commands.ts";
import GitService from "./GitService";
import hooks from "./hooks.ts";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({}); // Empty configuration

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  config: packageConfigSchema,
  install(app, config) {
    // Register chat tools with ChatService
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );

    // Register chat commands with AgentCommandService
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(agentCommands)
    );

    // Register GitService
    app.addServices(new GitService());

    // Register hooks with AgentLifecycleService
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(hooks)
    );
  }
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Required Services

For tools and hooks to function properly:

- **ChatService**: Required for tool registration (added by framework)
- **ChatModelRegistry**: Used by git_commit for AI message generation
- **FileSystemService**: Used for state checks
- **TerminalService**: Used for all Git command execution
- **AgentCommandService**: Required for slash command registration
- **TestingService**: Used by autoCommit hook for test status
- **AgentLifecycleService**: Required for hook registration

### Agent Integration Pattern

```typescript
// Access GitService for metadata
import {GitService} from "@tokenring-ai/git";
const gitService = agent.requireServiceByType(GitService);
console.log(gitService.name, gitService.description);

// Use git_commit tool
await agent.executeTool('git_commit', { message: "My changes" });

// Use git_rollback tool
await agent.executeTool('git_rollback', { steps: 5 });

// Use git_branch tool
await agent.executeTool('git_branch', { action: "create", branchName: "feature-new" });

// Use slash commands directly in chat
// Agent sends: /git commit "Fix bug"
// Response: Changes successfully committed to git
```

### Tool Export Pattern

The git package exports tools from `tools.ts`:

```typescript
// tools.ts
import commitTool from "./tools/commit.ts";
import rollbackTool from "./tools/rollback.ts";

export default {
  commitTool,      // Exported tool
  rollbackTool,    // Exported tool
  // Note: git_branch is NOT exported from tools.ts
  // but is available as a standalone tool file
};

// To use git_branch, import directly:
import branchTool from "@tokenring-ai/git/tools/branch.ts";
```

### Hook Integration

The autoCommit hook is automatically registered and triggers after testing completes:

```typescript
// hooks.ts
import autoCommit from "./hooks/autoCommit.ts";

export default { autoCommit };

// Hook behavior:
// - Type: AfterTestsPassed hook from @tokenring-ai/testing/hooks
// - Triggered after all tests complete
// - Only commits if all tests pass AND repository is dirty
// - Commits with empty message (triggers AI generation)
// - Marks repository clean after commit
```

**Hook Implementation Details:**

```typescript
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import { AfterTestsPassed } from "@tokenring-ai/testing/hooks";

const callbacks = [
  new HookCallback(AfterTestsPassed, async (_data, agent) => {
    const testingService = agent.requireServiceByType(TestingService);
    const filesystem = agent.requireServiceByType(FileSystemService);
    if (filesystem.isDirty(agent)) {
      if (!testingService.allTestsPassed(agent)) {
        agent.errorMessage(
          "Not committing changes, due to tests not passing",
        );
        return;
      }
      await commit({message: ""}, agent);
    }
  })
];
```

### Chat Command Integration

The `/git` command provides an interactive interface to Git operations:

```typescript
// commands/git.ts
export default {
  description: "Git operations. ",
  execute,
  help
} satisfies TokenRingAgentCommand;

// Available actions:
// - /git commit [message]     - Commit with optional message
// - /git rollback [steps]     - Rollback by number of steps (default: 1)
// - /git branch [action] [branchName]  - Branch management
```

## RPC Endpoints

This package does not define any RPC endpoints. Git operations are performed via tools and commands.

## State Management

### GitService (Service Layer)

```typescript
export default class GitService implements TokenRingService {
  name = "GitService";
  description = "Provides Git functionality";
}
```

**State Properties:**
- `name: string = "GitService"`: Service identifier
- `description: string = "Provides Git functionality"`: Service description

**State Lifecycle:**
- GitService is a simple metadata service with no persistent state
- All state management occurs via FileSystemService

### FileSystemService Integration

```typescript
// State modification after commit
fileSystem.setDirty(false, agent);

// State validation before operations
const isDirty = filesystem.isDirty(agent);
```

**State Transfer:**
- No agent-specific state slice for Git package
- autoCommit hook manages dirty state via FileSystemService
- No serialization/deserialization required

### Agent State Effects

**Post-Commit:**
```typescript
// Mark repository as clean
fileSystem.setDirty(false, agent);

// Only success message returned to user
return "Changes successfully committed to git";
```

**Pre-Rollback:**
```typescript
// Validate clean state
const statusOutput = await fileSystem.executeCommand([
  "git", "status", "--porcelain"
], {}, agent);

if (statusOutput.trim() !== "") {
  throw new Error(`[${name}] Rollback aborted: uncommitted changes detected`);
}
```

## Best Practices

### Using AI-Generated Commit Messages

1. **Context Management**: Last 2 chat messages used for context, so keep relevant conversation before commit
2. **Prompt Specificity**: System uses very specific AI prompt for consistent output
3. **Fallback Behavior**: Gracefully falls back to default message if AI fails or context is unavailable
4. **Logging**: All AI message generation steps are logged with tool name prefix

### Safe Git Operations

1. **Always Validate State**: Check clean state before rollbacks to prevent data loss
2. **Test Before Commit**: Use hook to ensure tests pass before auto-commit
3. **Understand Rollback Effects**: `git reset --hard` discards all changes, use with caution
4. **Workspace Safety**: Never rollback without explicit confirmation

### Error Handling

1. **Tool Name Prefix**: All errors prefixed with tool name for clear identification
2. **Descriptive Messages**: Error messages explain what went wrong and how to fix it
3. **Early Validation**: Validate parameters before executing git commands
4. **Stack Trace Handling**: Extract short messages from errors for clearer output

### Branch Management

1. **Branch Naming**: Follow Git conventions (lowercase, hyphens, no spaces)
2. **Action Clarity**: Specify exact action (list/create/switch/delete/current)
3. **Name Required**: Always provide branchName for create/switch/delete actions
4. **Default Behavior**: Understand default action shows current and local branches

## Testing and Development

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Package Structure

```
pkg/git/
├── GitService.ts              # Main service class (TokenRingService implementation)
├── index.ts                   # Main export (GitService)
├── plugin.ts                  # Plugin registration and setup
├── tools.ts                   # Tool exports (commitTool, rollbackTool)
├── commands.ts                # Command exports (git command)
├── hooks.ts                   # Hook exports (autoCommit)
├── tools/
│   ├── commit.ts             # git_commit tool implementation
│   ├── rollback.ts           # git_rollback tool implementation
│   └── branch.ts             # git_branch tool implementation
├── hooks/
│   └── autoCommit.ts         # Auto-commit hook implementation
├── commands/
│   └── git.ts                # /git command implementation
├── package.json
├── vitest.config.ts
└── LICENSE
```

### Test Configuration

```typescript
// vitest.config.ts
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Example Tests

**Tool Function Tests:**
```typescript
// Test git_commit with provided message
await expect(
  execute({ message: "Test commit" }, agent)
).resolves.toBe("Changes successfully committed to git");

// Test git_rollback validation
await expect(
  execute({}, agent)
).rejects.toThrow("[git_rollback] Rollback aborted: uncommitted changes detected");

// Test git_branch validation
await expect(
  execute({ action: "create" }, agent)
).rejects.toThrow("[git_branch] Branch name is required for create action");
```

**Hook Tests:**
```typescript
// Test autoCommit hook
await autoCommit.afterTesting(agent);

// Verify dirty state cleared
expect(filesystem.isDirty(agent)).toBe(false);
```

## Dependencies

### Production Dependencies

| Package | Version |
|---------|---------|
| @tokenring-ai/ai-client | 0.2.0 |
| @tokenring-ai/app | 0.2.0 |
| @tokenring-ai/chat | 0.2.0 |
| @tokenring-ai/agent | 0.2.0 |
| @tokenring-ai/filesystem | 0.2.0 |
| @tokenring-ai/lifecycle | 0.2.0 |
| @tokenring-ai/testing | 0.2.0 |
| @tokenring-ai/utility | 0.2.0 |
| @tokenring-ai/terminal | 0.2.0 |
| execa | ^9.6.1 |
| zod | ^4.3.6 |

### Development Dependencies

| Package | Version |
|---------|---------|
| vitest | ^4.0.18 |
| typescript | 5.9.3 |

## Related Components

- **@tokenring-ai/filesystem**: Provides FileSystemService for executing Git commands and managing state
- **@tokenring-ai/testing**: Provides TestingService for test status checking in autoCommit hook
- **@tokenring-ai/ai-client**: Provides ChatModelRegistry for AI message generation in git_commit tool
- **@tokenring-ai/chat**: Provides ChatService for message context extraction and tool registration
- **@tokenring-ai/agent**: Provides AgentCommandService for slash command registration and AgentLifecycleService for hook management
- **@tokenring-ai/lifecycle**: Provides AgentLifecycleService and hook infrastructure

## Performance Characteristics

- **Tool Execution**: Immediate via TerminalService command execution
- **AI Message Generation**: Async with chat context building (uses last 2 messages)
- **State Validation**: Minimal overhead (git status --porcelain)
- **No Background Processing**: All operations synchronous with ChatService integration
- **Cleanup**: No temporary files or background processes

## Limitations

- **Git Repository**: Assumes working directory is a Git repository
- **Local Operations**: Currently only supports local Git operations (no remote push/pull)
- **Commit Context**: AI generation limited to last 2 chat messages
- **No Interactive Confirmation**: Rollback operations proceed without confirmation (use with caution)
- **No Advanced Git Features**: Lacks support for rebase, cherry-pick, stash, etc.
- **Tool Return Format**: Tools return only success message without context, all details logged via agent.infoMessage()
- **Branch Validation**: No validation for branch naming conventions (spaces, special characters)

## Known Issues

- Branch names with spaces or special characters may cause Git command failures (Git CLI limitation)
- AI message generation fails if last message lacks response id (caught and falls back to default)
- No interactive prompt for confirming dangerous operations like rollback

## Contributing

### Adding New Tools

1. Create new tool file in `tools/` directory
2. Export tool definition from `tools.ts` (or keep as standalone if needed)
3. Update documentation with new tool schema and functionality
4. Add examples to usage sections

### Adding Commands/Actions

1. Implement new action in appropriate command file
2. Update help text in command description
3. Add error handling for invalid actions
4. Update documentation

## License

MIT License - see LICENSE file for details.
