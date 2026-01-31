# Git Package Documentation

The `@tokenring-ai/git` package provides Git integration for Token Ring AI agents, enabling automated Git operations through tools, slash commands, and hooks. This package integrates deeply with the Token Ring ecosystem, providing AI-powered commit messages, safe rollback operations, and comprehensive branch management.

## Overview

The Git package enables AI-driven Git operations for Token Ring agents, including:
- AI-powered commit message generation from chat context
- Automated commits after successful testing via hooks
- Interactive slash commands for Git operations
- Complete branch management (list, create, switch, delete)
- Safe rollback operations with validation
- Comprehensive error handling and state management

## Core Properties

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

## Key Features

- **AI-Powered Commit Messages**: Generate commit messages based on last 2 chat messages
- **Automated Commits**: Automatic commits after testing completes via autoCommit hook
- **Interactive Commands**: Slash commands for Git operations (/git)
- **Branch Management**: Full branch lifecycle management (list, create, switch, delete, current)
- **Safe Rollbacks**: Validates clean state before rollbacks
- **Filesystem Integration**: Deep integration with TokenRing's FileSystemService
- **Error Handling**: Comprehensive tool-name prefixed error messages
- **State Validation**: Clean state checks for commits and rollbacks

## Core Methods/API

### Tools

The git package provides three tools that are automatically registered with the agent's chat service.

#### git_commit

Commits changes to the Git repository with optional AI-generated commit messages.

```typescript
// Tool is registered automatically via the plugin
await agent.executeTool('git_commit', { message: "Fix authentication bug" });
```

**Input Schema:**
```typescript
{
  message?: string
}
```

**Parameters:**
- `message? : string` - Optional custom commit message. If not provided, generates one using AI based on chat context

**Functionality:**
- Automatically adds all changes (`git add .`)
- Uses AI to generate commit messages when none provided by extracting last 2 chat messages
- Sets git user identity as "TokenRing Coder / coder@tokenring.ai"
- Returns only success message without tool name prefix
- Calls `filesystem.setDirty(false)` after successful commit

**AI Message Generation:**
- Extracts context from last 2 messages from ChatService
- Uses specific prompt: "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text."
- Falls back to "TokenRing Coder Automatic Checkin" if AI returns empty
- Caches and logs tool result with tool name prefix

#### git_rollback

Rolls back to a previous git commit with validation.

```typescript
// Rollback by number of steps
await agent.executeTool('git_rollback', { steps: 2 });

// Rollback to specific commit hash
await agent.executeTool('git_rollback', { commit: "abc123def456" });
```

**Input Schema:**
```typescript
{
  commit?: string
  steps?: number
}
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
{
  action: "list" | "create" | "switch" | "delete" | "current"
  branchName?: string  // Required for create, switch, delete
}
```

**Parameters:**
- `action : "list" | "create" | "switch" | "delete" | "current"` - The branch action to perform
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

**Note:** `git_branch` tool is available to agents via `agent.executeTool()` but is not exported from tools.ts module.

## Usage Examples

### Basic Commit with Custom Message

```typescript
// Using tool
await agent.executeTool('git_commit', { message: "Update README" });

// Using slash command
// Agent command service executes: /git commit "Update README"
```

### Commit with AI-Generated Message

```typescript
// Using tool
await agent.executeTool('git_commit', {});

// Using slash command
// Agent command service executes: /git commit
// AI generates message from last 2 chat messages
```

### AI Message Generation Workflow

```typescript
// 1. Submit commit tool with no message
await agent.executeTool('git_commit', {});

// 2. Agent requests AI to generate message
await chatService.buildChatMessages(
  "Please create a git commit message for the set of changes you recently made. The message should be a short description of the changes you made. Only output the exact git commit message. Do not include any other text..",
  chatConfig,
  agent
);

// 3. AI returns commit message based on context
// 4. Commit executes with generated message
// 5. Filesystem marked as clean
```

### Rollback Operations

```typescript
// Rollback one commit (default)
await agent.executeTool('git_rollback', {});

// Rollback by steps
await agent.executeTool('git_rollback', { steps: 3 });

// Rollback to specific commit
await agent.executeTool('git_rollback', { commit: "abc123def456" });

// Using slash command
// /git rollback
// /git rollback 3
// /git rollback abc123def456
```

### Branch Management

```typescript
// List all branches (returns using git branch -a)
await agent.executeTool('git_branch', { action: "list" });

// Show current branch (returns using git branch --show-current)
await agent.executeTool('git_branch', { action: "current" });

// Show current branch and list local branches (default behavior)
await agent.executeTool('git_branch', {});

// Create a new branch and switch to it
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });

// Switch to an existing branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });

// Delete a branch
await agent.executeTool('git_branch', { action: "delete", branchName: "feature-xyz" });

// Using slash command
// /git branch
// /git branch list
// /git branch current
// /git branch create feature-xyz
// /git branch switch main
// /git branch delete feature-xyz
```

### Automatic Commit After Testing

```typescript
// 1. Agent makes changes to files
// 2. Agent runs tests via testing service
// 3. TestingService.allTestsPassed(agent) returns true
// 4. autoCommit hook fires after testing completes
// 5. autoCommit checks: isDirty(agent) && allTestsPassed
// 6. git_commit executed with empty message
// 7. AI generates commit message from chat history
// 8. Files committed and dirty state cleared
```

### Safe Rollback Validation

```typescript
// 1. Agent attempts rollback via git_rollback
// 2. FileSystemService.executeCommand(['git', 'status', '--porcelain'])
// 3. If statusOutput is not empty:
//    - Error thrown with message "[git_rollback] Rollback aborted: uncommitted changes detected"
// 4. Rollback does NOT execute (safe safety check)
```

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

### Git Version

The package uses standard Git CLI commands compatible with Git 2.x and later versions.

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
import chatCommands from "./chatCommands.ts";
import GitService from "./GitService.js";
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
      agentCommandService.addAgentCommands(chatCommands)
    );

    // Register GitService
    app.addServices(new GitService());

    // Register hooks with AgentLifecycleService
    app.waitForService(AgentLifecycleService, lifecycleService =>
      lifecycleService.addHooks(packageJSON.name, hooks)
    );
  }
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Required Services

For tools and hooks to function properly:

- **ChatService**: Required for tool registration (added by framework)
- **ChatModelRegistry**: Used by git_commit for AI message generation
- **FileSystemService**: Used for all Git command execution and state checks
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
// Response: [git_commit] Changes successfully committed to git
```

### Tool Export Pattern

The git package exports only a subset of tools:

```typescript
// tools.ts
import commitTool from "./tools/commit.ts";
import rollbackTool from "./tools/rollback.ts";

export default {
  commitTool,      // Exported tool
  rollbackTool,    // Exported tool
  // git_branch is NOT exported but is available via agent.executeTool()
};
```

### Hook Integration

The autoCommit hook is automatically registered and triggers after testing completes:

```typescript
// hooks.ts
import autoCommit from "./hooks/autoCommit.ts";

export default { autoCommit };

// Hook behavior:
// - Type: afterTesting lifecycle hook
// - Triggered after all tests complete
// - Only commits if all tests pass AND repository is dirty
// - Commits with empty message (triggers AI generation)
// - Marks repository clean after commit
```

### Chat Command Integration

The `/git` command provides an interactive interface to Git operations:

```typescript
// commands/git.ts
export default {
  description: "/git - Git operations.",
  execute,
  help
} satisfies TokenRingAgentCommand;

// Available actions:
// - /git commit [message]     - Commit with optional message
// - /git rollback [steps]     - Rollback by number of steps (default: 1)
// - /git branch [action] [branchName]  - Branch management
```

## Error Handling

### Validation Errors

**Branch Name Required:**
```typescript
// git_branch tool
if (!branchName) {
  throw new Error(`[${name}] Branch name is required for ${action} action`);
}
```

**Invalid Rollback Position:**
```typescript
// Unexpected: if steps is non-positive integer
await agent.executeTool('git_rollback', { steps: 0 });
// Error: Invalid rollback position: "0". Must be a positive integer.
```

**Invalid Branch Action:**
```typescript
// commands/git.ts
case "invalid":
  agent.errorMessage(
    `Invalid branch action: "${args[1]}". Valid actions are: list, current, create, switch, delete`,
  );
  return;
```

**Unknown Git Action:**
```typescript
// commands/git.ts
default:
  agent.errorMessage(
    `Unknown git action: "${action}". Use 'commit', 'rollback', or 'branch'.`,
  );
```

### Git Errors

**Uncommitted Changes:**
```typescript
// git_rollback tool
const {stdout: statusOutput} = await fileSystem.executeCommand([
  "git", "status", "--porcelain"
], {}, agent);

if (statusOutput.trim() !== "") {
  throw new Error(`[${name}] Rollback aborted: uncommitted changes detected`);
}
```

**Git Command Failures:**
```typescript
// Wrapped in try/catch with tool name prefix
try {
  await fileSystem.executeCommand([...], {}, agent);
} catch (error: any) {
  throw new Error(`[${name}] Rollback failed: ${error.shortMessage || error.message}`);
}
```

**Preemptive Commit on Clean Repository:**
```typescript
// git_commit tool only commits if repository is dirty
if (statusOutput.trim() === "") {
  // Already clean, skip commit
  agent.infoMessage(`[${name}] Repository is already clean, skipping commit.`);
  return;
}
```

### State Checks

**Dirty State Check (autoCommit hook):**
```typescript
// autoCommit hook
if (filesystem.isDirty(agent)) {
  if (!testingService.allTestsPassed(agent)) {
    agent.errorMessage("Not committing changes, due to tests not passing");
    return;
  }
  await commit({message: ""}, agent);
} else {
  // Repository is clean, skip commit
  agent.infoMessage("No uncommitted changes detected, skipping commit.");
}
```

**Clean Repository Check (rollback):**
```typescript
// git_rollback tool
await fileSystem.executeCommand(["git", "status", "--porcelain"], {}, agent);
```

### Error Message Format

All git tools prefix errors with tool name for consistency:

```bash
[git_commit] Asking OpenAI to generate a git commit message...
[git_commit] Using provided commit message.
[git_commit] Changes committed to git.

[git_rollback] Rolling back to previous commit...
[git_rollback] Rollback completed successfully.
[git_rollback] Rollback aborted: uncommitted changes detected

[git_branch] Branch name is required for current action
[git_branch] Successfully created and switched to branch: feature-xyz
```

### Graceful Failures

**AI Message Generation Fallback:**
```typescript
if (output && output.trim() !== "") {
  gitCommitMessage = output;
} else {
  agent.warningMessage(
    `[${name}] AI did not provide a commit message, using default.`
  );
}
// Falls back to "TokenRing Coder Automatic Checkin"
```

**Chat Context Availability:**
```typescript
if (currentMessage) {
  // Proceed with AI generation
} else {
  agent.errorMessage(
    `[${name}] Most recent chat message does not have a response id, unable to generate a git commit message, using default.`
  );
}
```

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

// File existence checks
await fileSystem.executeCommand([...], {}, agent);
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
├── chatCommands.ts            # Chat command exports (git command)
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
// vitest.config.ts sample
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
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

## Related Components

- **@tokenring-ai/filesystem**: Provides FileSystemService for executing Git commands and managing state
- **@tokenring-ai/testing**: Provides TestingService for test status checking in autoCommit hook
- **@tokenring-ai/ai-client**: Provides ChatModelRegistry for AI message generation in git_commit tool
- **@tokenring-ai/chat**: Provides ChatService for message context extraction and tool registration
- **@tokenring-ai/agent**: Provides AgentCommandService for slash command registration and AgentLifecycleService for hook management

## Performance Characteristics

- **Tool Execution**: Immediate via FileSystemService command execution
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
- no interactive prompt for confirming dangerous operations like rollback

## Contributing

### Adding New Tools

1. Create new tool file in `tools/` directory
2. Export tool definition from `tools.ts`
3. Update documentation with new tool schema and functionality
4. Add examples to usage sections

### Adding Commands/Actions

1. Implement new action in appropriate command file
2. Update help text in command description
3. Add error handling for invalid actions
4. Update documentation

## License

MIT License - see LICENSE file for details.