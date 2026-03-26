# @tokenring-ai/skills

The `@tokenring-ai/skills` package provides an agent skills system for the Token Ring ecosystem. It enables agents to manage and execute custom skills defined in markdown format, allowing for extensible functionality through downloadable skill packages.

## Overview

The skills system allows agents to:
- Install and manage custom skills from zip archives
- Execute skills with custom prompts
- Enable/disable individual skills
- Persist skill state across agent sessions
- Dynamically register skill commands

Skills are stored in the `.tokenring/skills` directory and follow a markdown-based definition format with frontmatter configuration.

## Key Features

- **Skill Management**: Install, download, enable, disable, delete, and reset skills
- **Dynamic Command Registration**: User-invocable skills are automatically registered as slash commands
- **State Persistence**: Skill enablement state is persisted across agent sessions
- **Flexible Context Modes**: Skills can run in the main agent context or as forked sub-agents
- **Template Variables**: Skills support variable substitution for dynamic content
- **Tool Integration**: All skill operations available as chat tools
- **Command Interface**: Full CLI command interface for skill management

## Core Components

### SkillService

The core service for managing skills. Implements `TokenRingService` interface.

**Location**: `pkg/skills/SkillService.ts`

**Key Methods**:

```typescript
class SkillService {
  readonly name = "SkillService";
  description = "Service for managing and running Token Ring skills";

  // Lifecycle
  attach(agent: Agent): void;
  start(): Promise<void>;

  // Skill Management
  listSkills(agent: Agent, {includeDisabled?: boolean}): Promise<SkillDefinition[]>;
  getSkill(name: string, agent: Agent): Promise<SkillDefinition>;
  downloadSkill(zipUrl: string, agent: Agent): Promise<SkillDefinition>;
  deleteSkill(name: string, agent: Agent): Promise<void>;
  enableSkill(name: string, agent: Agent): Promise<SkillDefinition>;
  disableSkill(name: string, agent: Agent): Promise<SkillDefinition>;
  resetSkill(name: string, agent: Agent): Promise<SkillDefinition>;
  runSkill(name: string, prompt: string, agent: Agent): Promise<string>;

  // Dynamic Commands
  setCommandService(commandService: AgentCommandService): void;
  registerDynamicSkillCommands(): Promise<void>;
}
```

### SkillDefinition

Represents an installed skill with its metadata and content.

```typescript
type SkillDefinition = {
  slug: string;           // URL-friendly identifier
  name: string;           // Human-readable name
  description: string;    // Skill description
  directory: string;      // Filesystem path to skill
  file: string;           // Path to SKILL.md file
  enabled: boolean;       // Whether skill is enabled
  frontmatter: SkillFrontmatter; // Skill configuration
  body: string;           // Skill content (markdown)
  sourceUrl?: string;     // Original download URL
};
```

### SkillFrontmatter

Configuration metadata for skills defined in YAML frontmatter.

```typescript
type SkillFrontmatter = {
  name?: string;                    // Skill name (slugified)
  description?: string;             // Skill description
  argumentHint?: string;            // Hint for command arguments
  disableModelInvocation?: boolean; // Disable AI model invocation
  userInvocable?: boolean;          // Enable as user command (default: true)
  context?: "fork";                 // Run in forked sub-agent context
  agent?: string;                   // Agent type for forked context
};
```

### SkillState

Agent state slice for persisting skill enablement.

```typescript
class SkillState extends AgentStateSlice {
  enabledSkills: Set<string>;

  // Methods
  serialize(): { enabledSkills: string[] };
  deserialize(data: { enabledSkills: string[] }): void;
  transferStateFromParent(parent: Agent): void;
  show(): string[];
}
```

## Services

### TokenRingService: SkillService

**Registration**: Automatically registered when plugin is installed

**Dependencies**:
- `@tokenring-ai/agent` - Agent framework and state management
- `@tokenring-ai/chat` - Tool registration and chat integration
- `@tokenring-ai/utility` - Utility functions

**Configuration Schema**:

```typescript
const SkillsConfigSchema = z.object({
  skillsDirectory: z.string().default(".tokenring/skills"),
  registryFile: z.string().default(".tokenring/skills/.skills-registry.json"),
  tempDirectory: z.string().default("/tmp/tokenring-skills"),
  defaultSkillAgentType: z.string().default("general-purpose"),
  agentDefaults: SkillsAgentConfigSchema.prefault({}),
});

const SkillsAgentConfigSchema = z.object({
  enabledSkills: z.array(z.string()).default([]),
}).prefault({});
```

## Provider Documentation

The skills package uses a plugin-based architecture:

**Plugin Registration**:

```typescript
import skillsPlugin from "@tokenring-ai/skills/plugin";

// In your app configuration
app.install(skillsPlugin, {
  skills: {
    skillsDirectory: ".tokenring/skills",
    registryFile: ".tokenring/skills/.skills-registry.json",
    tempDirectory: "/tmp/tokenring-skills",
    defaultSkillAgentType: "general-purpose",
    agentDefaults: {
      enabledSkills: ["skill-name-1", "skill-name-2"]
    }
  }
});
```

## Chat Commands

The following slash-prefixed commands are available:

### `/skills`

Main skills management command. Shows help and lists installed skills.

```
/skills
```

### `/skills list`

List all installed skills including disabled ones.

```
/skills list
```

**Output Format**:
```
Installed skills:

| Name | Enabled | Description | Source |
|------|---------|-------------|--------|
| code-review | yes | Review code changes | https://... |
| docs-gen | no | Generate documentation | |
```

### `/skills download <zip-url>`

Download and install a skill from a zip archive URL.

```
/skills download https://example.com/my-skill.zip
```

**Requirements**:
- ZIP must contain a `SKILL.md` file
- ZIP may contain additional files referenced by the skill

### `/skills run <name> [prompt]`

Run an installed skill with an optional prompt.

```
/skills run code-review
/skills run code-review Review this PR for security issues
```

### `/skills delete <name>`

Delete an installed skill.

```
/skills delete code-review
```

### `/skills enable <name>`

Enable a disabled skill.

```
/skills enable docs-gen
```

### `/skills disable <name>`

Disable an enabled skill without deleting it.

```
/skills disable code-review
```

### `/skills reset <name>`

Reset a skill to its downloaded state (re-downloads from source URL if available).

```
/skills reset code-review
```

### Dynamic Skill Commands

User-invocable skills are automatically registered as direct commands:

```
/skill-name [prompt]
```

Example:
```
/code-review Review this code
/docs-gen Generate API documentation
```

**Note**: Skills with `userInvocable: false` in frontmatter are not registered as direct commands.

## Configuration

### Plugin Configuration

```typescript
{
  skills: {
    // Directory where skills are stored
    skillsDirectory: ".tokenring/skills",
    
    // Registry file for tracking installed skills
    registryFile: ".tokenring/skills/.skills-registry.json",
    
    // Temporary directory for downloads
    tempDirectory: "/tmp/tokenring-skills",
    
    // Default agent type for forked skills
    defaultSkillAgentType: "general-purpose",
    
    // Agent-level defaults
    agentDefaults: {
      enabledSkills: ["skill-1", "skill-2"]
    }
  }
}
```

### Agent Configuration

Each agent can have its own enabled skills:

```typescript
agent.configureSlice("skills", SkillsAgentConfigSchema, {
  enabledSkills: ["code-review", "docs-gen"]
});
```

## Integration

### Plugin Installation

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import skillsPlugin from "@tokenring-ai/skills/plugin";

const app = new TokenRingApp();

app.install(skillsPlugin, {
  skills: {
    skillsDirectory: ".tokenring/skills"
  }
});

await app.start();
```

### Service Usage

```typescript
import {SkillService} from "@tokenring-ai/skills";

// Get service from agent
const skillService = agent.requireServiceByType(SkillService);

// List skills
const skills = await skillService.listSkills(agent);

// Run a skill
const result = await skillService.runSkill("code-review", "Review this PR", agent);
```

### Tool Integration

Skills tools are automatically registered with ChatService:

```typescript
// Available tools:
// - skills_listSkills
// - skills_runSkill
// - skills_downloadSkill
// - skills_deleteSkill
// - skills_enableSkill
// - skills_disableSkill
// - skills_resetSkill
```

## Usage Examples

### Basic Skill Installation

```typescript
// Download and install a skill
const skillService = agent.requireServiceByType(SkillService);
const skill = await skillService.downloadSkill(
  "https://github.com/example/code-review-skill/archive/main.zip",
  agent
);

console.log(`Installed skill: ${skill.name}`);
```

### Running a Skill

```typescript
// Run with prompt
const result = await skillService.runSkill(
  "code-review",
  "Review this code for security vulnerabilities",
  agent
);

console.log(result);
```

### Managing Skill State

```typescript
// List all skills
const allSkills = await skillService.listSkills(agent, {includeDisabled: true});

// Enable a skill
await skillService.enableSkill("docs-gen", agent);

// Disable a skill
await skillService.disableSkill("code-review", agent);

// Check enabled skills
const state = agent.getState(SkillState);
console.log(state.enabledSkills); // Set<string>
```

### Creating a Skill

Skills are markdown files with YAML frontmatter:

```markdown
---
name: code-review
description: Review code for issues and improvements
argument-hint: "path/to/code"
user-invocable: true
context: main
---

# Code Review Skill

Review the following code for:
- Security vulnerabilities
- Performance issues
- Code quality improvements

Code to review:
$ARGUMENTS

Please provide a detailed review with specific recommendations.
```

### Variable Substitution

Skills support the following template variables:

- `$ARGUMENTS` - Full prompt/arguments
- `$ARGUMENTS[0]`, `$ARGUMENTS[1]` - Individual arguments
- `$1`, `$2` - Positional arguments
- `${TOKENRING_SKILL_DIR}` - Path to skill directory
- `${TOKENRING_SESSION_ID}` - Agent session ID

Example:
```markdown
Review code in: ${TOKENRING_SKILL_DIR}
Session: ${TOKENRING_SESSION_ID}
Arguments: $ARGUMENTS[0]
```

### Forked Context Mode

Skills can run in a forked sub-agent context:

```markdown
---
name: complex-task
context: fork
agent: general-purpose
---

Perform this complex task as a separate agent:
$ARGUMENTS
```

## Best Practices

### Skill Development

1. **Use Descriptive Frontmatter**: Always include `name` and `description`
2. **Set User-Invocable Appropriately**: Use `user-invocable: false` for internal skills
3. **Choose Context Wisely**: Use `context: fork` for long-running or independent tasks
4. **Test Variable Substitution**: Ensure template variables work as expected
5. **Document Arguments**: Use `argument-hint` to guide users

### Skill Management

1. **Enable Selectively**: Only enable skills needed for current tasks
2. **Use Reset for Updates**: Reset skills to get latest from source URL
3. **Monitor State**: Check `SkillState` for enabled skills
4. **Clean Up**: Delete unused skills to reduce overhead

### Security Considerations

1. **Verify Sources**: Only download skills from trusted sources
2. **Review Content**: Inspect skill content before execution
3. **Limit Permissions**: Skills run with agent's permissions
4. **Monitor Execution**: Watch for unexpected skill behavior

## Testing and Development

### Development Setup

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Type check
bun run build
```

### Testing Skills

```typescript
import {describe, it, expect, beforeEach} from "vitest";
import {SkillService} from "@tokenring-ai/skills";
import {Agent} from "@tokenring-ai/agent";

describe("SkillService", () => {
  let service: SkillService;
  let agent: Agent;

  beforeEach(() => {
    service = new SkillService({
      skillsDirectory: ".test/skills",
      tempDirectory: "/tmp/test-skills",
      registryFile: ".test/skills/.registry.json",
      defaultSkillAgentType: "general-purpose",
      agentDefaults: {}
    });
  });

  it("should list installed skills", async () => {
    await service.start();
    const skills = await service.listSkills(agent);
    expect(skills).toBeInstanceOf(Array);
  });
});
```

### Skill Testing Pattern

```typescript
import {runSkill} from "@tokenring-ai/skills/tools/runSkill";

it("should execute skill with prompt", async () => {
  const result = await runSkill.execute(
    {name: "test-skill", prompt: "test prompt"},
    agent
  );
  expect(result).toBeDefined();
});
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/agent` | 0.2.0 | Agent framework and state management |
| `@tokenring-ai/app` | 0.2.0 | Application framework |
| `@tokenring-ai/chat` | 0.2.0 | Chat and tool integration |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions |
| `zod` | ^4.3.6 | Schema validation |
| `typescript` | ^6.0.2 | Type definitions (dev) |
| `vitest` | ^4.1.1 | Testing framework (dev) |

## Related Components

- **@tokenring-ai/agent**: Core agent framework used for skill execution
- **@tokenring-ai/chat**: Chat interface for skill invocation
- **@tokenring-ai/app**: Plugin system for skill registration
- **SubAgentService**: Used for forked skill context mode

## License

MIT License - see LICENSE file for details.
