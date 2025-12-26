# Workflow Plugin

Service for running multi-step agent workflows with configuration-driven setup and support for agent spawning.

## Overview

The `@tokenring-ai/workflow` package provides a comprehensive system for defining and executing multi-step workflows within the TokenRing AI ecosystem. It integrates seamlessly with the agent system to run sequential command chains, supporting both direct execution on the current agent and spawning new agents with specific types. The package includes JSON-RPC endpoints for remote workflow management and chat commands for interactive execution.

## Key Features

- **Multi-step Workflow Execution**: Execute sequential command chains with any agent commands
- **Agent Spawning**: Create new agents of specified types to run workflows
- **Configuration-driven**: Workflows defined in configuration files with schema validation
- **JSON-RPC API**: Remote workflow management via WebSocket API
- **Interactive Commands**: `/workflow` chat command with subcommands
- **Workflow Listing**: Display available workflows with details
- **Headless Support**: Run workflows in background agents
- **Error Handling**: Comprehensive error handling for workflow execution

## Core Components

### WorkflowService

The main service class that manages workflow execution:

```typescript
class WorkflowService implements TokenRingService {
  name = "WorkflowService";
  description = "Manages multi-step agent workflows";
  
  constructor(app: TokenRingApp, workflows: Record<string, WorkflowItem>)
  
  // Service lifecycle
  async run(): Promise<void>
  
  // Workflow management
  getWorkflow(name: string): WorkflowItem | undefined
  listWorkflows(): Array<{ key: string; workflow: WorkflowItem }>
  
  // Agent spawning
  async spawnWorkflow(workflowName: string, { headless }: { headless: boolean }): Promise<Agent>
}
```

### WorkflowItem Schema

Defines the structure for workflow configuration:

```typescript
interface WorkflowItem {
  name: string;           // Human-readable workflow name
  description: string;    // Detailed description
  agentType: string;      // Required agent type for execution
  steps: string[];        // Sequential commands to execute
}
```

### JSON-RPC Schema

The workflow package exposes a JSON-RPC API for remote workflow management:

```typescript
{
  path: "/rpc/workflow",
  methods: {
    listWorkflows: {
      type: "query",
      input: z.object({}),
      result: z.array(z.object({
        key: z.string(),
        name: z.string(),
        description: z.string(),
        agentType: z.string(),
        steps: z.array(z.string()),
      }))
    },
    getWorkflow: {
      type: "query",
      input: z.object({ name: z.string() }),
      result: z.object({
        key: z.string(),
        name: z.string(),
        description: z.string(),
        agentType: z.string(),
        steps: z.array(z.string()),
      })
    },
    spawnWorkflow: {
      type: "mutation",
      input: z.object({ 
        workflowName: z.string(), 
        headless: z.boolean().default(false) 
      }),
      result: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    }
  }
}
```

### Chat Commands

The workflow package provides a `/workflow` command with the following subcommands:

- `/workflow` - List available workflows
- `/workflow run <name>` - Run a workflow on the current agent
- `/workflow spawn <name>` - Spawn a new agent and run the workflow

## Services and APIs

### WorkflowService Methods

#### `constructor(app: TokenRingApp, workflows: Record<string, WorkflowItem>)`

Initializes the workflow service with configuration.

**Parameters:**
- `app`: TokenRingApp instance
- `workflows`: Configuration object with workflow definitions

#### `async run(): Promise<void>`

Initializes the workflow service and outputs status information.

#### `getWorkflow(name: string): WorkflowItem | undefined`

Retrieves a workflow by name.

**Parameters:**
- `name`: The workflow identifier

**Returns:**
- WorkflowItem or undefined if not found

#### `listWorkflows(): Array<{ key: string; workflow: WorkflowItem }>` 

Lists all available workflows.

**Returns:**
- Array of workflow entries with key and workflow object

#### `async spawnWorkflow(workflowName: string, { headless }: { headless: boolean }): Promise<Agent>`

Spawns a new agent and runs the specified workflow.

**Parameters:**
- `workflowName`: The name of the workflow to run
- `headless`: Whether to run in headless mode (default: false)

**Returns:**
- Promise resolving to the spawned Agent instance

### JSON-RPC Endpoints

#### `listWorkflows(args, app: TokenRingApp)`

Lists all available workflows.

**Returns:**
- Array of workflow entries with key, name, description, agentType, and steps

#### `getWorkflow(args, app: TokenRingApp)`

Retrieves a specific workflow by name.

**Parameters:**
- `args.name`: The workflow identifier

**Returns:**
- Workflow details including key, name, description, agentType, and steps

#### `spawnWorkflow(args, app: TokenRingApp)`

Spawns a new agent and runs the specified workflow.

**Parameters:**
- `args.workflowName`: The name of the workflow to run
- `args.headless`: Whether to run in headless mode (default: false)

**Returns:**
- Agent details including id, name, and description

## Commands and Tools

### Chat Command: `/workflow`

#### Usage

```
/workflow                  # List available workflows
/workflow run <name>       # Run workflow on current agent
/workflow spawn <name>     # Spawn new agent and run workflow
```

#### Examples

**List Workflows:**
```bash
/workflow
```

**Output:**
```
Available workflows:
morning-article: MarketMinute Morning Article Generator (9AM EST)
  Automatically write and publish the 9AM EST morning market minute articles
  Steps: 4

daily-report: Daily Report Generator
  Generate and send daily reports
  Steps: 3

content-pipeline: Content Creation Pipeline
  Research, write, and publish content
  Steps: 5
```

**Run Workflow:**
```bash
/workflow run content-pipeline
```

**Spawn Workflow:**
```bash
/workflow spawn morning-article
```

## Configuration

### Configuration Schema

```typescript
import {z} from "zod";

export const WorkflowConfigSchema = z.record(z.string(), WorkflowItemSchema).default({});

export const WorkflowItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  agentType: z.string(),
  steps: z.array(z.string()),
});
```

### Configuration Examples

Add a `workflows` section to your `.tokenring/config.mjs`:

```javascript
export default {
  workflows: {
    "morning-article": {
      name: "MarketMinute Morning Article Generator (9AM EST)",
      description: "Automatically write and publish the 9AM EST morning market minute articles",
      agentType: "contentWriter",
      steps: [
        "/tools enable @tokenring-ai/research/research",
        "/tools enable @tokenring-ai/websearch/searchNews",
        "/chat Write morning market analysis",
        "/chat Publish to blog"
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
import TokenRingApp from "@tokenring-ai/app";
import workflow from "@tokenring-ai/workflow";

export default {
  name: "@tokenring-ai/workflow",
  version: "0.2.0",
  install(app: TokenRingApp) {
    const config = app.getConfigSlice('workflows', WorkflowConfigSchema);
    app.waitForService(AgentCommandService, agentCommandService => 
      agentCommandService.addAgentCommands(chatCommands)
    );
    const workflowService = new WorkflowService(app, config);
    app.addServices(workflowService);

    app.waitForService(WebHostService, webHostService => {
      webHostService.registerResource("Workflow RPC endpoint", new JsonRpcResource(app, workflowRPC));
    });
  }
} satisfies TokenRingPlugin;
```

### Service Dependencies

The workflow package requires these services to be available:

1. **AgentCommandService**: For registering and handling chat commands
2. **WebHostService**: For exposing JSON-RPC endpoints
3. **AgentManager**: For spawning and managing agents
4. **Agent**: For accessing service instances and executing workflows

### Event Forwarding

When spawning workflows, the system handles event forwarding:

```typescript
await runSubAgent({
  agentType: workflow.agentType,
  command: `/workflow run ${workflowName}`,
  headless: agent.headless,
  forwardChatOutput: true,
  forwardReasoning: true,
  forwardHumanRequests: true,
  forwardSystemOutput: true
}, agent, true)
```

## Usage Examples

### Programmatic Workflow Execution

```typescript
import { WorkflowService } from '@tokenring-ai/workflow';

const workflowService = agent.app.getService(WorkflowService);

// List all workflows
const workflows = workflowService.listWorkflows();
console.log('Available workflows:', workflows.map(w => w.key));

// Get specific workflow
const workflow = workflowService.getWorkflow('morning-article');
if (workflow) {
  console.log('Workflow:', workflow.name);
  console.log('Steps:', workflow.steps.join(', '));
  console.log('Agent Type:', workflow.agentType);
}

// Spawn workflow on dedicated agent
const spawnedAgent = await workflowService.spawnWorkflow('morning-article', {
  headless: true
});

console.log('Spawned agent ID:', spawnedAgent.id);
console.log('Agent name:', spawnedAgent.name);
```

### JSON-RPC API Usage

```typescript
import { createJsonRPCEndpoint } from '@tokenring-ai/web-host/jsonrpc/createJsonRPCEndpoint';

// Create JSON-RPC endpoint
const workflowRpc = createJsonRPCEndpoint(WorkflowRpcSchema, {
  listWorkflows(args, app) {
    const workflowService = app.requireService(WorkflowService);
    return workflowService.listWorkflows();
  },
  
  getWorkflow(args, app) {
    const workflowService = app.requireService(WorkflowService);
    return workflowService.getWorkflow(args.name);
  },
  
  spawnWorkflow(args, app) {
    const workflowService = app.requireService(WorkflowService);
    return workflowService.spawnWorkflow(args.workflowName, {
      headless: args.headless
    });
  }
});

// Use the endpoint in your application
const workflows = await workflowRpc.listWorkflows({});
const specificWorkflow = await workflowRpc.getWorkflow({ name: "morning-article" });
const agent = await workflowRpc.spawnWorkflow({ workflowName: "morning-article", headless: true });
```

## Error Handling

The workflow package provides comprehensive error handling:

- **Workflow Not Found**: Clear error message when specified workflow doesn't exist
- **Configuration Validation**: Schema validation ensures proper workflow structure
- **Step Execution**: Individual step failures are reported but don't stop workflow execution
- **Agent Spawning**: Proper error handling for agent creation failures
- **RPC Endpoint Errors**: Error handling for remote procedure calls

## Testing and Development

### Package Structure

```
pkg/workflow/
├── index.ts                           # Package exports and configuration schema
├── plugin.ts                          # Plugin integration logic
├── WorkflowService.ts                 # Core service implementation
├── chatCommands.ts                    # Chat command definitions
├── rpc/workflow.ts                    # RPC endpoint implementation
├── rpc/schema.ts                      # RPC schema definitions
├── commands/workflow.ts               # Workflow command implementation
├── commands/workflow.test.ts          # Tests for workflow commands
├── package.json                       # Package configuration
└── README.md                          # Comprehensive documentation
```

### Dependencies

```json
{
  "dependencies": {
    "@tokenring-ai/app": "0.2.0",
    "@tokenring-ai/agent": "0.2.0",
    "@tokenring-ai/web-host": "0.2.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```

### Testing

The package uses Vitest for testing:

```typescript
// vitest.config.ts
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Related Components

- **@tokenring-ai/agent**: Agent system and command execution
- **@tokenring-ai/app**: Base application framework
- **@tokenring-ai/web-host**: WebSocket server and JSON-RPC support
- **@tokenring-ai/research**: Research tools for workflow steps
- **@tokenring-ai/websearch**: Web search tools for workflow steps

## License

MIT License - see LICENSE file for details.