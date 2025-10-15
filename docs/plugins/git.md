# Git Plugin

Git integration for commits, rollbacks, branch management, with auto-commit hook after tests.

## Overview

The `@tokenring-ai/git` package provides Git integration for TokenRing AI agents. It enables automated Git operations within the agent framework, such as committing changes, rolling back commits, and managing branches. Key features include AI-generated commit messages, automatic commits after successful tests, and slash commands for interactive Git management.

## Key Features

- **Commit Operations**: Add all changes and commit with AI-generated or custom messages
- **Rollback**: Reset to previous commits with safety checks
- **Branch Management**: List, create, switch, and delete branches
- **Auto-Commit Hook**: Automatically commit after successful tests
- **AI-Generated Messages**: Create commit messages from chat context

## Core Components

### GitService

Basic service class implementing `TokenRingService` for Git functionality.

### Tools

**commit**: Adds all changes and commits
- Optional custom message or AI-generated
- Sets filesystem as clean after success
- Uses default Git user: `TokenRing Coder <coder@tokenring.ai>`

```typescript
await commit({ message: 'Fix authentication bug' }, agent);
```

**rollback**: Hard reset to previous commit
- Aborts if uncommitted changes exist
- Supports specific commit hash or number of steps back

```typescript
await rollback({ steps: 2 }, agent);  // Roll back 2 commits
```

**branch**: Manage Git branches
- Actions: `list`, `create`, `switch`, `delete`, `current`
- Requires branchName for create/switch/delete

```typescript
await branch({ action: 'create', branchName: 'feature-xyz' }, agent);
```

### Chat Commands

**/git**: Handles subcommands
- `commit [message]`: Commit with optional message
- `rollback [steps]`: Rollback commits
- `branch [action] [branchName]`: Branch operations

```bash
/git commit "Update README"
/git rollback 1
/git branch create new-feature
```

### Hooks

**autoCommit**: Runs after testing
- Triggers if filesystem is dirty and all tests pass
- Auto-commits changes using the commit tool

## Usage Example

```typescript
import { execute as commit } from '@tokenring-ai/git/tools/commit';
import { execute as branch } from '@tokenring-ai/git/tools/branch';

// Manual commit with AI message
await commit({}, agent);  // Generates message from chat context

// Branch management
await branch({ action: 'switch', branchName: 'main' }, agent);
```

## Configuration Options

- **Git User Config**: Hardcoded defaults (override via environment or Git config)
- **AI Integration**: Uses agent's AIService for commit message generation
- **No environment variables**: Uses agent's services

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`: For AI chat requests
- `@tokenring-ai/agent@0.1.0`: Core agent framework
- `@tokenring-ai/filesystem@0.1.0`: Executes Git shell commands
- `@tokenring-ai/testing@0.1.0`: Checks test passes for auto-commit
- `execa@^9.6.0`: Shell command execution
