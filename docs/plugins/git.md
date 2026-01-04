# @tokenring-ai/git Plugin Documentation

Git integration package for TokenRing AI agents, providing automated Git operations within the agent framework.

## Overview

The `@tokenring-ai/git` package enables AI-driven Git operations for TokenRing agents, including automated commits, rollbacks, branch management, and AI-generated commit messages. This package is designed to work seamlessly with the TokenRing ecosystem, providing both programmatic tools and interactive slash commands for Git operations.

Key features include:
- AI-powered commit message generation based on chat context
- Automated commits after successful testing
- Interactive slash commands for Git operations
- Branch management capabilities (list, create, switch, delete)
- Safe rollback operations with validation
- Git status checks and dirty file detection
- Integrated with TokenRing's filesystem and testing services

## Core Properties

### GitService

The main service class that provides Git functionality.

```typescript
import { GitService } from '@tokenring-ai/git';

// Access via dependency injection
const gitService = agent.requireServiceByType(GitService);
```

**Properties:**
- `name: string = "GitService"` - Service identifier
- `description: string = "Provides Git functionality"` - Service description

## Key Features

- **AI-Powered Commit Messages**: Generate commit messages based on chat context
- **Automated Commits**: Automatic commits after successful testing via hooks
- **Interactive Commands**: Slash commands for Git operations
- **Branch Management**: List, create, switch, delete branches
- **Safe Rollbacks**: Validation before rollbacks to prevent data loss
- **Filesystem Integration**: Works with TokenRing's filesystem service
- **Error Handling**: Comprehensive validation and error messages

## Core Methods/API

### Tools

The git package provides three tools that are automatically registered with the agent's chat service:

#### git_commit

Commits changes to the Git repository with optional AI-generated commit messages.

```typescript
// The tool is registered automatically via the plugin
// Usage via agent.executeTool
await agent.executeTool('git_commit', { message: "Fix authentication bug" });
```

**Parameters:**
- `message?: string` - Optional custom commit message. If not provided, generates one using AI based on chat context

**Features:**
- Automatically adds all changes (`git add .`)
- Uses AI to generate commit messages when none provided
- Sets filesystem as clean after successful commit
- Uses default Git user: `TokenRing Coder <coder@tokenring.ai>`
- Validates git repository state before committing
- Generates commit messages based on recent chat context

#### git_rollback

Rolls back to a previous commit state.

```typescript
// Usage via agent.executeTool
// Roll back by number of commits
await agent.executeTool('git_rollback', { steps: 2 });

// Roll back to specific commit
await agent.executeTool('git_rollback', { commit: "abc123" });
```

**Parameters:**
- `commit?: string` - Specific commit hash to reset to
- `steps?: number` - Number of commits to roll back (default: 1)

**Features:**
- Validates no uncommitted changes exist before rollback
- Performs hard reset (`git reset --hard`)
- Ensures clean filesystem state after operation
- Validates input parameters

#### git_branch

Manages git branches - list, create, switch, or delete branches.

```typescript
// Usage via agent.executeTool
// List all branches
await agent.executeTool('git_branch', { action: "list" });

// Create a new branch
await agent.executeTool('git_branch', { action: "create", branchName: "feature-xyz" });

// Switch to a branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });
```

**Parameters:**
- `action: "list" | "create" | "switch" | "delete" | "current"` - The branch action to perform
- `branchName?: string` - The name of the branch (required for create, switch, and delete actions)

**Features:**
- Lists all branches (local and remote)
- Creates and switches to new branches
- Switches to existing branches
- Deletes branches safely
- Shows current branch

**Note:** The `git_branch` tool is registered automatically by the plugin but is not exported as a named export from the tools module.

### Exported Tools

The package exports the following tools for direct import:

```typescript
import { commitTool, rollbackTool } from '@tokenring-ai/git/tools';
```

**Available exports:**
- `commitTool` - The commit tool definition and execution function
- `rollbackTool` - The rollback tool definition and execution function

The `git_branch` tool is available to agents via `agent.executeTool()` but is not exported from the tools module.

## Usage Examples

### 1. Automated Commit with AI Message

```typescript
// In agent code - no message provided, AI generates from context
await agent.executeTool('git_commit', {});
```

### 2. Manual Commit with Custom Message

```typescript
// In agent code - provide custom message
await agent.executeTool('git_commit', {
  message: "Fix authentication vulnerability"
});
```

### 3. Branch Management

```typescript
// List all branches
await agent.executeTool('git_branch', { action: "list" });

// Show current branch
await agent.executeTool('git_branch', { action: "current" });

// Create a new branch
await agent.executeTool('git_branch', { action: "create", branchName: "new-feature" });

// Switch to a branch
await agent.executeTool('git_branch', { action: "switch", branchName: "main" });

// Delete a branch
await agent.executeTool('git_branch', { action: "delete", branchName: "old-feature" });
```

### 4. Rollback Operations

```typescript
// Roll back one commit
await agent.executeTool('git_rollback', {});

// Roll back multiple commits
await agent.executeTool('git_rollback', { steps: 3 });

// Roll back to specific commit
await agent.executeTool('git_rollback', {
  commit: "a1b2c3d4e5f6"
}, agent);
```

### 5. Using the Chat Command

```bash
# In chat interface

# Commit with AI-generated message
/git commit

# Commit with custom message
/git commit "Fix bug in authentication logic"

/git commit "Update documentation"

/# Roll back 1 commit (default)
/git rollback

# Roll back 2 commits
/git rollback 2

# List all branches
/git branch list

# Show current branch
/git branch current

# Create and switch to new branch
/git branch create feature-update

# Switch to existing branch
/git branch switch main

# Delete a branch
/git branch delete feature-update
```

## Configuration

### Plugin Configuration

The plugin has an empty configuration schema:

```typescript
const config = {};
```

### Git User Configuration

The package uses default Git user configuration:
- Name: `TokenRing Coder`
- Email: `coder@tokenring.ai`

This can be overridden by setting your own Git configuration or through environment variables.

### AI Integration

Commit message generation relies on the agent's AI service configuration. The AI analyzes recent chat context to generate appropriate commit messages.

## Integration

### TokenRing Plugin

Automatically registers GitService, tools, and hooks with the TokenRing app.

```typescript
import gitPlugin from '@tokenring-ai/git';

app.registerPlugin(gitPlugin);
```

### Agent Integration

The tools are automatically available to agents via the chat service:

```typescript
// Tools are registered automatically
await agent.executeTool('git_commit', { message: "Your commit message" });
```

### Hook Integration

The autoCommit hook is automatically registered and triggers after testing completes:

```typescript
// Hook behavior:
// - Triggers after testing completes
// - Checks if filesystem has uncommitted changes
// - Only commits if all tests pass
// - Uses the commit tool with empty message (AI generates from context)
```

### Chat Commands

The `/git` command provides an interactive interface to Git operations:

```typescript
// Available subcommands:
/git commit [message]     // Commit with optional message
/git rollback [steps]     // Rollback by number of steps (default: 1)
/git branch [action] [branchName]  // Branch management
```

## Testing and Development

### Scripts

```bash
# Lint the code
bun run eslint

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Package Structure

```
pkg/git/
├── GitService.ts         # Main service class
├── plugin.ts             # Plugin registration
├── tools.ts              # Tool exports (commitTool, rollbackTool)
├── chatCommands.ts       # Chat command exports
├── hooks.ts              # Hook exports (autoCommit)
├── tools/
│   ├── commit.ts         # git_commit tool implementation
│   ├── rollback.ts       # git_rollback tool implementation
│   └── branch.ts         # git_branch tool implementation
├── hooks/
│   └── autoCommit.ts     # Auto-commit hook implementation
├── commands/
│   └── git.ts            # /git command implementation
├── package.json
├── vitest.config.ts
└── LICENSE
```

## Limitations and Considerations

- **Git Repository**: Assumes the working directory is a Git repository
- **Local Operations**: Currently only supports local Git operations (no remote push/pull)
- **Safety**: Rollback operations discard changes - use with caution
- **AI Dependencies**: Commit message generation depends on available AI services and chat context
- **Testing**: Uses vitest for testing
- **Branch Operations**: Requires proper Git branch naming conventions

## Related Components

- `@tokenring-ai/filesystem` - Filesystem service for executing Git commands
- `@tokenring-ai/testing` - Testing service for auto-commit hooks
- `@tokenring-ai/ai-client` - AI client for commit message generation
- `@tokenring-ai/chat` - Chat service for tool integration

## License

MIT License - see LICENSE file for details.
