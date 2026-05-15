# Git Plugin

## User Guide

### Overview

The Git plugin provides comprehensive version control integration for TokenRing, enabling commit management, branch operations, and automated rollbacks directly through the agent interface. It integrates with the terminal service to execute git commands and supports AI-generated commit messages.

### Key Features

- **Branch Management**: Create, switch, delete, and list git branches
- **Commit Operations**: Commit changes with optional AI-generated messages
- **Rollback Capability**: Revert to previous commits or specific commit hashes
- **Auto-Commit**: Automatically commit changes after successful test runs
- **Terminal Integration**: Executes git commands through the terminal service

### Chat Commands

The Git plugin provides the following slash commands for agent interaction:

| Command | Description | Example |
|---------|-------------|---------|
| `/git branch create <branchName>` | Create and switch to a new branch | `/git branch create feature-xyz` |
| `/git branch current` | Show the currently active branch | `/git branch current` |
| `/git branch delete <branchName>` | Delete an existing branch | `/git branch delete feature-xyz` |
| `/git branch list` | List all local and remote branches | `/git branch list` |
| `/git branch switch <branchName>` | Switch to an existing branch | `/git branch switch main` |
| `/git commit [message]` | Commit changes (AI-generated message if none provided) | `/git commit` or `/git commit Fix bug` |
| `/git rollback [steps]` | Roll back to previous commit(s) | `/git rollback` or `/git rollback 3` |

### Tools

The Git plugin exposes the following tools for programmatic use:

| Tool | Description |
|------|-------------|
| `git_branch` | Manages git branches - list, create, switch, or delete branches |
| `git_commit` | Commits changes in the source directory to git |
| `git_rollback` | Rolls back to a previous git commit |

### Configuration

The Git plugin does not require any configuration. It uses default settings and integrates with the terminal service for command execution.

### Integration

The Git plugin integrates with the following components:

- **TerminalService**: Executes git commands in the terminal
- **FileSystemService**: Tracks file system dirty state and updates after commits
- **ChatService**: Provides context for AI-generated commit messages
- **ChatModelRegistry**: Uses AI models to generate commit messages when none are provided
- **TestingService**: Coordinates with auto-commit hook to only commit after successful tests
- **AgentLifecycleService**: Registers the auto-commit hook for test completion events

### Best Practices

1. **Commit Messages**: Provide explicit commit messages when possible for better traceability. Allow AI generation for quick check-ins.

2. **Branch Naming**: Use descriptive branch names that indicate the feature or fix being worked on (e.g., `feature/user-auth`, `fix/login-bug`).

3. **Rollback Safety**: Ensure no uncommitted changes exist before rolling back. The rollback tool will abort if uncommitted changes are detected.

4. **Auto-Commit**: The auto-commit feature only triggers after tests pass. Ensure your test suite provides adequate coverage before relying on automatic commits.

5. **Branch Operations**: Always verify you're on the correct branch before creating new branches or making commits.

---

## Developer Reference

### Core Components

#### GitService

The `GitService` class provides the core git functionality service implementation.

**Location**: `pkg/git/GitService.ts`

```typescript
import type { TokenRingService } from "@tokenring-ai/app/types";

export default class GitService implements TokenRingService {
  readonly name = "GitService";
  description = "Provides Git functionality";
}
```

**Properties**:

- `name`: "GitService" - Service identifier
- `description`: "Provides Git functionality" - Service description

### Services

#### GitService (TokenRingService Implementation)

The GitService is a TokenRingService implementation that provides git functionality. It is registered during plugin installation and available throughout the application lifecycle.

**Registration**: The service is added via `app.addServices(new GitService())` in the plugin's `install` method.

### Git Tools

#### git_branch

**Location**: `pkg/git/tools/branch.ts`

**Purpose**: Manages git branches including listing, creating, switching, and deleting branches.

**Input Schema**:

```typescript
const inputSchema = z.object({
  action: z.enum(["list", "create", "switch", "delete", "current"]).describe("The branch action to perform"),
  branchName: z.string().describe("The name of the branch (required for create, switch, and delete actions)").exactOptional(),
});
```

**Actions**:

- `list`: Lists all local and remote branches using `git branch -a`
- `create`: Creates a new branch and switches to it using `git checkout -b <branchName>`
- `switch`: Switches to an existing branch using `git checkout <branchName>`
- `delete`: Deletes a branch using `git branch -d <branchName>`
- `current`: Shows the current branch using `git branch --show-current`

**Dependencies**:

- `TerminalService`: Executes git commands

#### git_commit

**Location**: `pkg/git/tools/commit.ts`

**Purpose**: Commits changes in the source directory to git with optional AI-generated commit messages.

**Input Schema**:

```typescript
const inputSchema = z.object({
  message: z.string().describe("Optional commit message. If not provided, a message will be generated based on the chat context.").exactOptional(),
});
```

**Behavior**:

1. Stages all changes using `git add .`
2. If no message is provided:
   - Attempts to generate a commit message using the AI model based on chat context
   - Falls back to "TokenRing Automatic Checkin" if generation fails
3. Commits with `git commit -m <message>` using TokenRing as the author
4. Marks the file system as clean

**Dependencies**:

- `FileSystemService`: Updates dirty state after commit
- `TerminalService`: Executes git commands
- `ChatModelRegistry`: Provides AI model for message generation
- `ChatService`: Retrieves chat context and builds messages

#### git_rollback

**Location**: `pkg/git/tools/rollback.ts`

**Purpose**: Rolls back to a previous git commit.

**Input Schema**:

```typescript
const inputSchema = z.object({
  commit: z.string().describe("The commit hash to rollback to").exactOptional(),
  steps: z.number().int().describe("Number of commits to roll back").exactOptional(),
});
```

**Behavior**:

1. Checks for uncommitted changes - aborts if any are detected
2. Rollback options:
   - Specific commit: `git reset --hard <commit>`
   - By steps: `git reset --hard HEAD~<steps>`
   - Default (one step): `git reset --hard HEAD~1`

**Dependencies**:

- `TerminalService`: Executes git commands

### Hooks

#### autoCommit

**Location**: `pkg/git/hooks/autoCommit.ts`

**Purpose**: Automatically commits changes after successful test runs.

**Registration**: Registered with `AgentLifecycleService` during plugin installation.

**Trigger**: `AfterTestsPassed` hook from the testing package.

**Behavior**:

1. Checks if the file system is dirty (has uncommitted changes)
2. Verifies all tests passed via `TestingService`
3. If both conditions are met, commits changes with an empty message (triggers AI generation)
4. If tests failed, logs an error and skips the commit

**Dependencies**:

- `FileSystemService`: Checks dirty state
- `TestingService`: Verifies test results
- `git_commit` tool: Performs the actual commit

### RPC Endpoints

The Git plugin does not expose RPC endpoints. All functionality is accessed through chat commands and tools.

### Usage Examples

#### Creating a Branch

```typescript
// Using the tool directly
import branchTool from "./tools/branch.ts";

await branchTool.execute(
  { action: "create", branchName: "feature-new-ui" },
  agent
);
```

#### Committing with AI-Generated Message

```typescript
// Using the tool without a message
import commitTool from "./tools/commit.ts";

await commitTool.execute({}, agent);
// AI will generate a commit message based on chat context
```

#### Rolling Back Multiple Commits

```typescript
// Using the tool to rollback 3 commits
import rollbackTool from "./tools/rollback.ts";

await rollbackTool.execute({ steps: 3 }, agent);
```

### Testing

The Git package uses Vitest for testing. Test configuration is in `pkg/git/vitest.config.ts`.

**Run Tests**:

```bash
cd pkg/git
bun test
```

**Run with Coverage**:

```bash
bun test:coverage
```

### Dependencies

**Package Dependencies** (from `pkg/git/package.json`):

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@tokenring-ai/ai-client` | workspace:* | AI model integration |
| `@tokenring-ai/app` | workspace:* | Core application framework |
| `@tokenring-ai/chat` | workspace:* | Chat service and schema |
| `@tokenring-ai/agent` | workspace:* | Agent command definitions |
| `@tokenring-ai/filesystem` | workspace:* | File system state management |
| `@tokenring-ai/lifecycle` | workspace:* | Lifecycle hooks |
| `@tokenring-ai/testing` | workspace:* | Testing service integration |
| `@tokenring-ai/terminal` | workspace:* | Terminal command execution |
| `zod` | ^4.3.6 | Schema validation |

**Dev Dependencies**:

- `vitest`: ^4.1.1
- `typescript`: ^6.0.2

### Related Components

- **Terminal Plugin**: Provides command execution capabilities
- **Filesystem Plugin**: Manages file system state tracking
- **Testing Plugin**: Provides test execution and result tracking
- **AI Client Plugin**: Enables AI model interactions for commit message generation

### Schema Definitions

#### Branch Tool Input Schema

```typescript
const inputSchema = z.object({
  action: z.enum(["list", "create", "switch", "delete", "current"])
    .describe("The branch action to perform"),
  branchName: z.string()
    .describe("The name of the branch (required for create, switch, and delete actions)")
    .exactOptional(),
});
```

**Notes**:

- `action` is required and must be one of the enumerated values
- `branchName` is optional in the schema but required for `create`, `switch`, and `delete` actions at runtime

#### Commit Tool Input Schema

```typescript
const inputSchema = z.object({
  message: z.string()
    .describe("Optional commit message. If not provided, a message will be generated based on the chat context.")
    .exactOptional(),
});
```

**Notes**:

- `message` is optional - if not provided, AI generation is attempted

#### Rollback Tool Input Schema

```typescript
const inputSchema = z.object({
  commit: z.string()
    .describe("The commit hash to rollback to")
    .exactOptional(),
  steps: z.number().int()
    .describe("Number of commits to roll back")
    .exactOptional(),
});
```

**Notes**:

- Both `commit` and `steps` are optional
- If neither is provided, defaults to rolling back one commit (`HEAD~1`)
- If both are provided, `commit` takes precedence

---

## License

MIT License - see LICENSE file for details.
