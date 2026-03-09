# Workflow Plugin

## Overview

The Workflow Plugin provides a comprehensive system for defining and executing multi-step agent workflows within the TokenRing AI ecosystem. It enables users to configure sequences of commands that can be executed either on the current agent or in a newly spawned agent with specific agent types. The plugin integrates seamlessly with the agent system and provides both chat commands and JSON-RPC endpoints for workflow management.

Workflows are configuration-driven, defined in your application's configuration file with Zod schema validation. Each workflow consists of a sequence of commands that are executed in order, allowing for automated multi-step tasks that can span research, analysis, content generation, and other agent operations.

## Key Features

- **Multi-step Workflow Execution**: Execute sequential command chains with any agent commands
- **Agent Spawning**: Create new agents of specified types to run workflows independently
- **Configuration-driven**: Workflows defined in configuration files with Zod schema validation
- **JSON-RPC API**: Remote workflow management via WebSocket API endpoints
- **Interactive Commands**: `/workflow` chat command with subcommands for listing, running, and spawning workflows
- **Headless Support**: Run workflows in background agents without user interaction
- **Workflow Listing**: Display available workflows with names, descriptions, and step counts
- **Abort Support**: Workflow execution can be aborted via agent abort signal
- **Comprehensive Testing**: Unit tests for all command implementations

## Core Components

### WorkflowService

The primary service managing workflow execution within the TokenRing application.

**Properties:**
- `name`: The service identifier ("WorkflowService")
- `description`: Human-readable service description
- `workflows`: Map of workflow configurations keyed by workflow name

**Methods:**

#### `constructor(app: TokenRingApp, workflows: ParsedWorkflowConfig)`

Initializes the workflow service with the application instance and workflow configurations.

**Parameters:**
- `app`: The TokenRing application instance
- `workflows`: Parsed workflow configuration object

#### `getWorkflow(name: string): WorkflowItem | undefined`

Retrieves a workflow by its configuration key name.

**Parameters:**
- `name`: The workflow identifier key from the configuration

**Returns:** The WorkflowItem configuration or undefined if not found

#### `listWorkflows(): Array<{ key: string; workflow: WorkflowItem }>`

Lists all available workflows from the configuration.

**Returns:** Array of workflow entries containing the configuration key and WorkflowItem object

#### `spawnWorkflow(workflowName: string, { headless }: { headless: boolean }): Promise<Agent>`

Spawns a new agent of the specified type and runs the workflow on it.

**Parameters:**
- `workflowName`: The name key of the workflow to run
- `headless`: Whether to run in headless mode

**Returns:** Promise resolving to the spawned Agent instance

### WorkflowItem Type

The configuration structure defining a workflow's properties:

```typescript
export type WorkflowItem = z.infer<typeof WorkflowItemSchema>;
// Which resolves to:
{
  name: string;           // Human-readable workflow name
  description: string;    // Detailed description of workflow purpose
  agentType: string;      // Required agent type for execution
  steps: string[];        // Sequential commands to execute in order
}
```

All properties are required and validated through Zod schema validation at application startup.

## Services

### WorkflowService

The workflow package implements the `TokenRingService` interface:

```typescript
export default class WorkflowService implements TokenRingService {
  readonly name = "WorkflowService";
  description = "Manages multi-step agent workflows";
  workflows: Map<string, WorkflowItem>;

  constructor(private app: TokenRingApp, workflows: ParsedWorkflowConfig)

  getWorkflow(name: string): WorkflowItem | undefined
  listWorkflows(): Array<{ key: string; workflow: WorkflowItem }>
  async spawnWorkflow(workflowName: string, { headless }: { headless: boolean }): Promise<Agent>
}
```

**Service Registration:**

The service is automatically registered when the plugin is installed. The workflow service integrates with:

- **AgentCommandService**: Registers chat commands for workflow interaction
- **RpcService**: Registers JSON-RPC endpoints for remote workflow management
- **AgentManager**: Handles agent spawning for workflow execution

## Provider Documentation

This package does not implement a provider architecture.

## RPC Endpoints

The workflow package provides JSON-RPC endpoints under `/rpc/workflow`:

### `listWorkflows`

Lists all available workflows.

**Type:** `query`

**Input:**
```typescript
{
  // No parameters required
}
```

**Output:**
```typescript
Array<{
  key: string;           // Workflow identifier
  name: string;          // Human-readable workflow name
  description: string;   // Workflow description
  agentType: string;     // Agent type for execution
  steps: string[];       // List of workflow steps
}>
```

**Example:**
```typescript
const workflows = await rpcClient.listWorkflows({});
// Returns: [
//   { key: "morning-article", name: "MarketMinute Morning Article", description: "...", agentType: "contentWriter", steps: [...] },
//   { key: "daily-report", name: "Daily Report Generator", description: "...", agentType: "reportGenerator", steps: [...] }
// ]
```

### `getWorkflow`

Retrieves a specific workflow by name.

**Type:** `query`

**Input:**
```typescript
{
  name: string;  // The workflow identifier
}
```

**Output:**
```typescript
{
  key: string;           // Workflow identifier
  name: string;          // Human-readable workflow name
  description: string;   // Workflow description
  agentType: string;     // Agent type for execution
  steps: string[];       // List of workflow steps
}
```

**Errors:** Throws error if workflow is not found

**Example:**
```typescript
const workflow = await rpcClient.getWorkflow({ name: "morning-article" });
// Returns: { key: "morning-article", name: "MarketMinute Morning Article", description: "...", agentType: "contentWriter", steps: [...] }
```

### `spawnWorkflow`

Spawns a new agent and runs the specified workflow.

**Type:** `mutation`

**Input:**
```typescript
{
  workflowName: string;  // The name of the workflow to run
  headless?: boolean;     // Whether to run in headless mode (default: false)
}
```

**Output:**
```typescript
{
  id: string;            // Spawned agent ID
  name: string;          // Spawned agent name
  description: string;   // Spawned agent description
}
```

**Example:**
```typescript
const result = await rpcClient.spawnWorkflow({ workflowName: "morning-article", headless: true });
// Returns: { id: "agent-123", name: "MarketMinute Morning Article", description: "..." }
```

## Chat Commands

### `/workflow - Manage and run workflows`

The `/workflow` command provides functionality for listing, running, and spawning workflows.

**Help Text:**
```markdown
# /workflow

Manage and run workflows on the current agent.

## Usage

/workflow              - List available workflows
/workflow list         - List available workflows
/workflow run <name>   - Run a workflow by name on current agent
/workflow spawn <name> - Spawn new agent and run workflow

## Example

/workflow
/workflow run myWorkflow
/workflow spawn myWorkflow
```

#### `/workflow list`

Lists all available workflows with their names, descriptions, and step counts.

**Syntax:**
```
/workflow list
```

**Examples:**
```bash
/workflow list
```

**Example Output:**
```
Available workflows:

**morning-article**: MarketMinute Morning Article Generator (9AM EST)
  Automatically write and publish the 9AM EST morning market minute articles
  Steps: 4

**daily-report**: Daily Report Generator
  Generate and send daily reports
  Steps: 3
```

#### `/workflow run <name>`

Executes a workflow by name on the current agent.

**Syntax:**
- `<name>` - Required workflow identifier

**Errors:** Throws `CommandFailedError` if workflow not found or if no name is provided

**Examples:**
```bash
/workflow run content-pipeline
```

**Implementation Details:**
- Uses `AgentCommandService.executeAgentCommand` to execute each step
- Processes steps sequentially with abort signal support
- Returns completion message when all steps are executed

#### `/workflow spawn <name>`

Spawns a new agent and runs the specified workflow.

**Syntax:**
- `<name>` - Required workflow identifier

**Errors:** Throws `CommandFailedError` if workflow not found or if no name is provided

**Examples:**
```bash
/workflow spawn morning-article
```

**Implementation Details:**
- Uses `runSubAgent` to spawn a new agent with the specified agent type
- Executes workflow steps on the spawned agent
- Output is forwarded back to the parent agent

## Configuration

### Configuration Schema

The workflow configuration uses Zod schema validation:

```typescript
import { z } from 'zod';

const WorkflowItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  agentType: z.string(),
  steps: z.array(z.string()),
});

const WorkflowConfigSchema = z.record(z.string(), WorkflowItemSchema);
```

### Plugin Configuration

The workflow plugin automatically loads workflows from your application configuration:

```javascript
export default {
  workflows: {
    "my-workflow": {
      name: "My Workflow",
      description: "A sample workflow",
      agentType: "contentWriter",
      steps: ["/chat Do something"]
    }
  }
};
```

### Configuration Validation

At application startup, all workflow configurations are validated against the schema. Invalid configurations will prevent the application from starting with descriptive error messages indicating which workflows are misconfigured.

### Full Configuration Example

```javascript
export default {
  workflows: {
    "morning-article": {
      name: "MarketMinute Morning Article Generator (9AM EST)",
      description: "Automatically write and publish the 9AM EST morning market minute articles",
      agentType: "contentWriter",
      steps: [
        "/tools enable @tokenring-ai/research/research",
        "/tools enable @tokenring-ai/agent/runAgent",
        "/tools enable @tokenring-ai/websearch/searchNews",
        "/chat Write morning market analysis"
      ]
    },
    "daily-report": {
      name: "Daily Report Generator",
      description: "Generate and send daily reports",
      agentType: "reportGenerator",
      steps: [
        "/tools enable @tokenring-ai/database/query",
        "/chat Generate daily metrics report",
        "/chat Send report to team"
      ]
    },
    "content-pipeline": {
      name: "Content Creation Pipeline",
      description: "Research, write, and publish content",
      agentType: "contentWriter",
      steps: [
        "/tools enable @tokenring-ai/research/research",
        "/tools enable @tokenring-ai/websearch/searchNews",
        "/chat Research latest trends in AI",
        "/chat Write article based on research",
        "/chat Publish to blog"
      ]
    }
  }
};
```

## Integration

### Plugin Integration

The workflow package integrates with TokenRing applications through the plugin system:

```typescript
import {AgentCommandService} from "@tokenring-ai/agent";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {RpcService} from "@tokenring-ai/rpc";
import {z} from "zod";
import agentCommands from "./commands.ts";
import packageJSON from "./package.json" with {type: "json"};
import workflowRPC from "./rpc/workflow";
import {WorkflowConfigSchema} from "./schema.ts";
import WorkflowService from "./WorkflowService";

const packageConfigSchema = z.object({
  workflows: WorkflowConfigSchema.prefault({})
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(AgentCommandService, agentCommandService =>
      agentCommandService.addAgentCommands(agentCommands)
    );
    const workflowService = new WorkflowService(app, config.workflows);
    app.addServices(workflowService);

    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(workflowRPC);
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

### Service Dependencies

The workflow package requires these services to be available:

| Service | Purpose |
|---------|---------|
| AgentCommandService | Registers and handles chat commands for workflow interaction |
| RpcService | Exposes JSON-RPC endpoints for remote workflow management |
| AgentManager | Handles agent spawning and lifecycle management |
| Agent | Provides access to service instances and workflow execution |

### Workflow Command Router

The `/workflow` command acts as a router that handles subcommands:

```typescript
const subcommands = [
  {name: "list", command: list},
  {name: "run", command: run},
  {name: "spawn", command: spawn},
];
```

When no subcommand is provided, the `list` subcommand is executed by default. Unknown subcommands return a list of available subcommands.

## Usage Examples

### Chat Commands

#### List Available Workflows

```bash
/workflow
```

Displays all configured workflows with their names, descriptions, and step counts.

#### Run Workflow on Current Agent

```bash
/workflow run <name>
```

Executes all steps in the specified workflow sequentially on the current agent. Each step is processed through the `AgentCommandService.executeAgentCommand` method.

**Example:**
```bash
/workflow run content-pipeline
```

This runs each step in sequence on the current agent, with the output displayed in the chat interface.

#### Spawn Agent and Run Workflow

```bash
/workflow spawn <name>
```

Creates a new agent of the type specified in the workflow configuration, then executes all workflow steps on that new agent. Output is forwarded back to the parent agent.

**Example:**
```bash
/workflow spawn morning-article
```

The spawned agent runs independently and its output (chat, reasoning, human requests, and system output) is forwarded to the parent agent.

### Programmatic Workflow Execution

```typescript
import { WorkflowService } from '@tokenring-ai/workflow';

const workflowService = app.getService(WorkflowService);

// List all workflows
const workflows = workflowService.listWorkflows();
console.log('Available workflows:', workflows.map(w => w.key));
// Output: ['morning-article', 'daily-report', 'content-pipeline']

// Get specific workflow
const workflow = workflowService.getWorkflow('morning-article');
if (workflow) {
  console.log('Workflow:', workflow.name);
  console.log('Steps:', workflow.steps);
  console.log('Agent Type:', workflow.agentType);
}

// Spawn workflow on dedicated agent
const spawnedAgent = await workflowService.spawnWorkflow('morning-article', {
  headless: true
});

console.log('Spawned agent ID:', spawnedAgent.id);
console.log('Agent name:', spawnedAgent.displayName);
```

### Workflow Step Types

Workflow steps can include any valid agent commands:

**Tool Commands:**
```typescript
steps: [
  "/tools enable @tokenring-ai/research/research",
  "/tools enable @tokenring-ai/websearch/searchNews"
]
```

**Chat Commands:**
```typescript
steps: [
  "/chat Write morning market analysis",
  "/chat Generate daily metrics report"
]
```

**Mixed Commands:**
```typescript
steps: [
  "/tools enable @tokenring-ai/database/query",
  "/chat Generate daily metrics report",
  "/chat Send report to team"
]
```

### RPC Client Usage

```typescript
// Using the RPC client to interact with workflow endpoints
const workflows = await rpcClient.listWorkflows({});
const specificWorkflow = await rpcClient.getWorkflow({ name: "morning-article" });
const agent = await rpcClient.spawnWorkflow({ workflowName: "morning-article", headless: true });
```

## Best Practices

### Workflow Design

1. **Keep workflows focused**: Design workflows for specific tasks rather than complex multi-step processes
2. **Use descriptive names**: Choose clear, self-documenting workflow names and keys
3. **Test workflows incrementally**: Test each step before adding more complexity
4. **Consider error handling**: Include appropriate error handling in workflow steps
5. **Document workflows**: Add detailed descriptions for complex workflows

### Agent Spawning

1. **Choose appropriate agent types**: Select agent types that match the workflow's requirements
2. **Use headless mode for background tasks**: Set `headless: true` for automated workflows
3. **Monitor spawned agents**: Track spawned agent status and output

### Configuration

1. **Validate workflow schemas**: Ensure all workflows conform to the schema before deployment
2. **Use consistent naming**: Follow naming conventions for workflow keys (kebab-case recommended)
3. **Group related workflows**: Organize workflows by function or domain in configuration

### Error Handling

1. **Handle workflow not found errors**: Check if workflow exists before execution
2. **Monitor step execution**: Track individual step success/failure
3. **Implement abort handling**: Support workflow cancellation via abort signals

## Testing

### Testing Setup

The package includes comprehensive unit and integration tests using Vitest:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Coverage

- **Command Implementation**: Tests for list, run, and spawn subcommands
- **Workflow Execution**: Tests for workflow step-by-step execution
- **Agent Spawning**: Tests for runSubAgent integration
- **Error Handling**: Tests for workflow not found scenarios
- **Input Parsing**: Tests for various input formats and edge cases
- **Integration**: Full workflow execution flow tests
- **Command Routing**: Tests for subcommand routing in main workflow command

### Example Test

```typescript
import {Agent, AgentCommandService} from '@tokenring-ai/agent';
import createTestingAgent from '@tokenring-ai/agent/test/createTestingAgent';
import TokenRingApp from '@tokenring-ai/app';
import createTestingApp from '@tokenring-ai/app/test/createTestingApp';
import WorkflowService from '../WorkflowService';
import workflowCommand from './commands/workflow';

describe('workflow command', () => {
  let app: TokenRingApp;
  let agent: Agent;
  let workflowService: WorkflowService;
  let agentCommandService: AgentCommandService;

  const mockWorkflows = {
    testWorkflow: {
      name: 'Test Workflow',
      description: 'A test workflow',
      agentType: 'test-agent',
      steps: ['step1', 'step2', 'step3'],
    },
  };

  beforeEach(() => {
    app = createTestingApp();
    workflowService = new WorkflowService(app, mockWorkflows);
    agentCommandService = new AgentCommandService();
    app.addServices(workflowService);
    app.addServices(agentCommandService);
    agent = createTestingAgent(app);
  });

  it('should execute workflow steps', async () => {
    const result = await workflowCommand.execute('run testWorkflow', agent);
    // Test implementation
  });

  it('should list workflows', async () => {
    const result = await workflowCommand.execute('list', agent);
    expect(result).toContain('Available workflows');
  });

  it('should spawn workflow agent', async () => {
    const result = await workflowCommand.execute('spawn testWorkflow', agent);
    expect(result).toContain('Spawned agent for workflow');
  });
});
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app` (0.2.0) - Base application framework
- `@tokenring-ai/agent` (0.2.0) - Agent orchestration and management
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/rpc` (0.2.0) - JSON-RPC endpoint management
- `@tokenring-ai/utility` (0.2.0) - Utility functions and helpers (for `indent` function)
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.0.18) - Testing framework
- `typescript` (^5.9.3) - TypeScript compiler

## Related Components

| Component | Purpose |
|-----------|---------|
| @tokenring-ai/agent | Agent system and command execution |
| @tokenring-ai/app | Base application framework and service management |
| @tokenring-ai/rpc | JSON-RPC endpoint management |
| @tokenring-ai/utility | Utility functions and helpers |
| @tokenring-ai/research | Research tools for workflow steps |
| @tokenring-ai/websearch | Web search tools for workflow steps |
| @tokenring-ai/database | Database query tools for workflow steps |
| @tokenring-ai/chat | Chat service for workflow step commands |

## Development

### Package Structure

```
pkg/workflow/
├── index.ts                 # Main exports (WorkflowService, WorkflowItem)
├── plugin.ts                # Plugin definition for TokenRing integration
├── package.json             # Dependencies and scripts
├── README.md                # Package-level documentation
├── schema.ts                # Zod schema definitions
├── WorkflowService.ts       # Core service implementation
├── vitest.config.ts         # Vitest configuration
├── commands.ts              # Command registry (exports main workflow command)
├── commands/
│   ├── workflow.ts          # Main /workflow command with subcommand router
│   ├── workflow.test.ts     # Unit tests for chat commands
│   └── workflow/
│       ├── list.ts          # /workflow list implementation
│       ├── run.ts           # /workflow run implementation
│       └── spawn.ts         # /workflow spawn implementation
└── rpc/
    ├── schema.ts            # JSON-RPC schema definition
    └── workflow.ts          # RPC endpoint implementation
```

### Building

TypeScript compilation verification:

```bash
bun build
```

### Testing Commands

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Error Types

The workflow commands use the following error types:

- **CommandFailedError**: Thrown when workflow execution fails (e.g., workflow not found, missing arguments)

**Example Error Handling:**

```typescript
import {CommandFailedError} from '@tokenring-ai/agent/AgentError';

try {
  await workflowCommand.execute('run nonexistent', agent);
} catch (error) {
  if (error instanceof CommandFailedError) {
    console.error('Workflow execution failed:', error.message);
  }
}
```

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
