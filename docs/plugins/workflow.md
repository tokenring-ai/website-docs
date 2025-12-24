# Workflow Plugin

Service for defining and executing multi-step agent workflows with chat commands and JSON-RPC endpoints.

## Overview

The `@tokenring-ai/workflow` package provides workflow management capabilities for the Token Ring ecosystem. It enables the creation and execution of multi-step agent workflows with support for both direct agent command execution and remote procedure calls through JSON-RPC endpoints. The package allows users to define workflows that consist of a series of steps to be executed by agents, with the ability to either run workflows directly on the current agent or spawn dedicated agents for workflow execution.

## Key Features

- **Multi-step Workflows**: Define and execute complex agent workflows with structured steps
- **Web Integration**: JSON-RPC endpoints for remote workflow management and monitoring
- **Agent Spawning**: Create dedicated agent instances for workflow execution
- **Workflow Definition**: Structured workflow definitions with names, descriptions, agent types, and steps
- **Chat Commands**: Interactive `/workflow` command for workflow management
- **Headless Operation**: Support for background workflow execution in both run and spawn modes
- **Service Integration**: Seamless integration with Token Ring service architecture and agent systems

## Core Components

### WorkflowService

Manages workflow definitions and execution, implementing the `TokenRingService` interface.

```typescript
class WorkflowService implements TokenRingService {
  name = "WorkflowService";
  description = "Manages multi-step agent workflows";
  
  constructor(app: TokenRingApp, workflows: Record<string, WorkflowItem>)
  async run(): Promise<void>
  getWorkflow(name: string): WorkflowItem | undefined
  listWorkflows(): Array<{ key: string; workflow: WorkflowItem }>
  async spawnWorkflow(workflowName: string, { headless }: { headless: boolean }): Promise<Agent>
}
```

### WorkflowItem

Defines the structure of a workflow:

```typescript
interface WorkflowItem {
  name: string;          // Workflow name (human-readable)
  description: string;   // Workflow description
  agentType: string;     // Agent type to use for execution
  steps: string[];       // Array of workflow steps/messages to execute
}
```

### Chat Commands

**/workflow**: Interactive command for workflow management

**Subcommands:**
- `/workflow` - List available workflows
- `/workflow run <name>` - Run a workflow on current agent
- `/workflow spawn <name>` - Spawn new agent and run workflow

## Usage Examples

### Listing Available Workflows

```typescript
import { Agent } from '@tokenring-ai/agent';

const agent = new Agent();

// List workflows using chat command
agent.handleInput({ message: '/workflow' });

// Output shows:
// Available workflows:
// **data-analysis**: Data Analysis Workflow
//   Comprehensive data analysis workflow
//   Steps: 4
//
// **content-creation**: Content Creation Workflow  
//   Content generation workflow
//   Steps: 5
```

### Running Workflow on Current Agent

```typescript
// Run workflow directly on current agent
agent.handleInput({ message: '/workflow run data-analysis' });

// The workflow steps will be executed in sequence:
// data-collection
// data-cleaning  
// analysis
// reporting
```

### Spawning Dedicated Agent for Workflow

```typescript
// Spawn new agent and run workflow in background
agent.handleInput({ message: '/workflow spawn data-analysis' });

// This creates a new agent of type 'data-scientist' 
// and executes the workflow steps on that agent
```

### Programmatic Workflow Execution

```typescript
import { WorkflowService } from '@tokenring-ai/workflow';

const workflowService = agent.app.getService(WorkflowService);

// List all workflows
const workflows = workflowService.listWorkflows();
console.log('Available workflows:', workflows.map(w => w.key));

// Get specific workflow
const workflow = workflowService.getWorkflow('data-analysis');
if (workflow) {
  console.log('Workflow:', workflow.name);
  console.log('Steps:', workflow.steps.join(', '));
  console.log('Agent Type:', workflow.agentType);
}

// Spawn workflow on dedicated agent
const spawnedAgent = await workflowService.spawnWorkflow('data-analysis', {
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
  async listWorkflows(args, app) {
    const workflowService = app.requireService(WorkflowService);
    return workflowService.listWorkflows();
  },
  
  async getWorkflow(args, app) {
    const workflowService = app.requireService(WorkflowService);
    return workflowService.getWorkflow(args.name);
  },
  
  async spawnWorkflow(args, app) {
    const workflowService = app.requireService(WorkflowService);
    return workflowService.spawnWorkflow(args.workflowName, {
      headless: args.headless
    });
  }
});

// Use the endpoint in your application
```

## Configuration Options

### Workflow Configuration

Add workflow configurations to your Token Ring configuration:

```typescript
export default {
  workflows: {
    'data-analysis': {
      name: 'Data Analysis Workflow',
      description: 'Comprehensive data analysis workflow',
      agentType: 'data-scientist',
      steps: ['data-collection', 'data-cleaning', 'analysis', 'reporting']
    },
    'content-creation': {
      name: 'Content Creation Workflow',
      description: 'Content generation workflow',
      agentType: 'content-creator',
      steps: ['research', 'outline', 'draft', 'review', 'publish']
    },
    'code-refactoring': {
      name: 'Code Refactoring Workflow',
      description: 'Systematic code refactoring process',
      agentType: 'code-reviewer',
      steps: ['analyze-code', 'identify-issues', 'propose-refactors', 'implement-changes', 'test']
    }
  }
}
```

### Configuration Schema

```typescript
import {z} from "zod";

const WorkflowItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  agentType: z.string(),
  steps: z.array(z.string())
});

export const WorkflowConfigSchema = z.record(z.string(), WorkflowItemSchema).default({});
```

## Integration with Token Ring Ecosystem

### Plugin Integration

The workflow package integrates with Token Ring applications:

```typescript
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
}
```

### Service Dependencies

The workflow package requires these services to be available:

1. **AgentCommandService**: For registering and handling chat commands
2. **WebHostService**: For exposing JSON-RPC endpoints
3. **AgentManager**: For spawning and managing agents
4. **Agent**: For accessing service instances and executing workflows

### Agent Command Integration

The workflow command integrates with the agent system:

```typescript
import Agent from "@tokenring-ai/agent/Agent";
import {AgentCommandService} from "@tokenring-ai/agent";
import type {TokenRingAgentCommand} from "@tokenring-ai/agent/types";
import WorkflowService from "../WorkflowService.ts";

const description = "/workflow run <name> - Run a workflow by name." as const;

export async function execute(remainder: string, agent: Agent): Promise<void> {
  const workflowService = agent.app.getService(WorkflowService);
  
  if (!workflowService) {
    agent.infoLine("Workflow service is not running.");
    return;
  }

  if (!remainder) {
    agent.infoLine("Available workflows:");
    const workflows = workflowService.listWorkflows();
    for (const {key, workflow} of workflows) {
      agent.infoLine(`**${key}**: ${workflow.name}`);
      agent.infoLine(`  ${workflow.description}`);
      agent.infoLine(`  Steps: ${workflow.steps.length}`);
    }
    return;
  }

  const [command, ...args] = remainder.trim().split(/\s+/);
  
  if (command === "run") {
    const workflowName = args.join(" ");
    if (!workflowName) {
      agent.infoLine("Usage: /workflow run <name>");
      return;
    }

    const workflow = workflowService.getWorkflow(workflowName);
    if (!workflow) {
      agent.infoLine(`Workflow "${workflowName}" not found.`);
      return;
    }

    agent.infoLine(`Running workflow: ${workflow.name}`);

    for (const message of workflow.steps) {
      agent.handleInput({message});
    }
  } else if (command === "spawn") {
    const workflowName = args.join(" ");
    if (!workflowName) {
      agent.infoLine("Usage: /workflow spawn <name>");
      return;
    }

    const workflow = workflowService.getWorkflow(workflowName);
    if (!workflow) {
      agent.infoLine(`Workflow "${workflowName}" not found.`);
      return;
    }

    agent.infoLine(`Spawning agent type "${workflow.agentType}" for workflow: ${workflow.name}`);

    await runSubAgent({
      agentType: workflow.agentType,
      command: `/workflow run ${workflowName}`,
      headless: agent.headless,
      forwardChatOutput: true,
      forwardReasoning: true,
      forwardHumanRequests: true,
      forwardSystemOutput: true
    }, agent, true)
  } else {
    agent.infoLine("Usage: /workflow run <name> | /workflow spawn <name>");
  }
}
```

## API Reference

### WorkflowService Methods

#### Constructor

```typescript
constructor(app: TokenRingApp, workflows: Record<string, WorkflowItem>)
```

**Parameters:**
- `app`: Token Ring application instance
- `workflows`: Configuration object with workflow definitions

#### run()

```typescript
async run(): Promise<void>
```

Initializes the workflow service and outputs status information about loaded workflows.

#### getWorkflow()

```typescript
getWorkflow(name: string): WorkflowItem | undefined
```

Retrieves a specific workflow by name.

**Parameters:**
- `name`: Name of the workflow to retrieve

**Returns:**
- WorkflowItem if found, undefined otherwise

#### listWorkflows()

```typescript
listWorkflows(): Array<{ key: string; workflow: WorkflowItem }>
```

Lists all available workflows with their keys.

**Returns:**
- Array of workflow entries with key and workflow details

#### spawnWorkflow()

```typescript
async spawnWorkflow(workflowName: string, { headless }: { headless: boolean }): Promise<Agent>
```

Spawns and starts a new agent workflow.

**Parameters:**
- `workflowName`: Name of the workflow to execute
- `headless`: Whether to run the workflow in headless mode

**Returns:**
- Spawned agent instance

## JSON-RPC Endpoints

### listWorkflows

```typescript
async listWorkflows(args, app: TokenRingApp)
```

Lists all available workflows.

### getWorkflow

```typescript
async getWorkflow(args, app: TokenRingApp)
```

Retrieves a specific workflow by name.

### spawnWorkflow

```typescript
async spawnWorkflow(args, app: TokenRingApp)
```

Spawns and starts a new workflow agent.

## Chat Command Usage

### Basic Usage

```bash
/workflow                  # List available workflows
/workflow run myWorkflow   # Run workflow on current agent
/workflow spawn myWorkflow # Spawn new agent for workflow
```

### Example Output

```
Available workflows:
data-analysis: Data Analysis Workflow
  Comprehensive data analysis workflow
  Steps: 4

content-creation: Content Creation Workflow
  Content generation workflow
  Steps: 5
```

## Error Handling

The package provides comprehensive error handling:

- **Workflow Not Found**: Graceful handling when requested workflow doesn't exist
- **Agent Spawning**: Proper error handling during agent creation
- **Configuration Validation**: Zod schema validation for workflow configurations
- **RPC Endpoint Errors**: Error handling for remote procedure calls
- **Service Dependencies**: Graceful handling when required services aren't available

## Performance Considerations

- **Agent Spawning**: Efficient agent creation and initialization
- **Workflow Execution**: Optimized workflow execution flow with sequential step processing
- **RPC Performance**: Efficient handling of remote procedure calls
- **Memory Management**: Proper resource management during workflow execution
- **Event Forwarding**: Efficient forwarding of events between agents during workflow execution

## Development

### Package Structure

```
pkg/workflow/
├── index.ts                           # Package exports and configuration schema
├── plugin.ts                          # Plugin integration logic
├── WorkflowService.ts                 # Core service implementation
├── chatCommands.ts                    # Chat command definitions and execution
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
    "@tokenring-ai/web-host": "0.2.0"
  },
  "devDependencies": {
    "vitest": "latest",
    "typescript": "latest"
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

## Contributing

1. Add new workflow definitions to configuration
2. Update schema and documentation
3. Ensure proper error handling
4. Add tests for new workflow types
5. Follow existing patterns for integration

### Workflow Development Guidelines

- Define clear workflow steps and descriptions
- Use consistent naming conventions
- Include comprehensive error handling
- Document workflow dependencies and requirements
- Test workflow execution in various scenarios

## Support

For issues related to workflow execution or configuration, please:

1. Check the workflow configuration syntax
2. Verify agent type availability
3. Review test cases for usage examples
4. Open an issue with workflow configuration and error details

--- 

**Version**: 0.2.0  
**License**: MIT  
**Maintainers**: Token Ring AI Team