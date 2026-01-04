# Workflow Plugin

## Overview

The Workflow Plugin provides a comprehensive system for defining and executing multi-step agent workflows within the TokenRing AI ecosystem. It enables users to configure sequences of commands that can be executed either on the current agent or in a newly spawned agent with specific agent types. The plugin integrates seamlessly with the agent system and provides both chat commands and JSON-RPC endpoints for workflow management.

Workflows are configuration-driven, defined in your application's configuration file with schema validation. Each workflow consists of a sequence of commands that are executed in order, allowing for automated multi-step tasks that can span research, analysis, content generation, and other agent operations.

## Key Features

- **Multi-step Workflow Execution**: Execute sequential command chains with any agent commands
- **Agent Spawning**: Create new agents of specified types to run workflows independently
- **Configuration-driven**: Workflows defined in configuration files with Zod schema validation
- **JSON-RPC API**: Remote workflow management via WebSocket API endpoints
- **Interactive Commands**: `/workflow` chat command with subcommands for listing, running, and spawning workflows
- **Headless Support**: Run workflows in background agents without user interaction
- **Output Forwarding**: Automatic forwarding of chat, reasoning, human requests, and system output when spawning agents
- **Workflow Listing**: Display available workflows with names, descriptions, and step counts

## Core Components

### WorkflowService

The primary service managing workflow execution within the TokenRing application.

**Properties:**
- `name`: The service identifier ("WorkflowService")
- `description`: Human-readable service description

**Methods:**

#### `getWorkflow(name: string): WorkflowItem | undefined`

Retrieves a workflow by its configuration key name.

**Parameters:**
- `name`: The workflow identifier key from the configuration

**Returns:** The WorkflowItem configuration or undefined if not found

#### `listWorkflows(): Array&lt;&#123; key: string; workflow: WorkflowItem &#125;&gt;`

Lists all available workflows from the configuration.

**Returns:** Array of workflow entries containing the configuration key and WorkflowItem object

#### `spawnWorkflow(workflowName: string, &#123; headless &#125;: &#123; headless: boolean &#125;): Promise&lt;Agent&gt;`

Spawns a new agent of the specified type and runs the workflow on it.

**Parameters:**
- `workflowName`: The name key of the workflow to run
- `headless`: Whether to run in headless mode (default: false)

**Returns:** Promise resolving to the spawned Agent instance

### WorkflowItem Schema

The configuration structure defining a workflow's properties:

```typescript
interface WorkflowItem &#123;
  name: string;           // Human-readable workflow name
  description: string;    // Detailed description of workflow purpose
  agentType: string;      // Required agent type for execution
  steps: string[];        // Sequential commands to execute in order
&#125;
```

All properties are required and validated through Zod schema validation at application startup.

## Usage Examples

### Basic Workflow Configuration

Configure workflows in your TokenRing application's configuration file (e.g., `.tokenring/config.mjs`):

```typescript
export default &#123;
  workflows: &#123;
    "morning-article": &#123;
      name: "MarketMinute Morning Article Generator (9AM EST)",
      description: "Automatically write and publish the 9AM EST morning market minute articles",
      agentType: "contentWriter",
      steps: [
        "/tools enable @tokenring-ai/research/research",
        "/tools enable @tokenring-ai/agent/runAgent",
        "/tools enable @tokenring-ai/websearch/searchNews",
        "/chat Write morning market analysis"
      ]
    &#125;,
    "daily-report": &#123;
      name: "Daily Report Generator",
      description: "Generate and send daily reports",
      agentType: "reportGenerator",
      steps: [
        "/tools enable @tokenring-ai/database/query",
        "/chat Generate daily metrics report",
        "/chat Send report to team"
      ]
    &#125;,
    "content-pipeline": &#123;
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
    &#125;
  &#125;
&#125;;
```

### Chat Commands

#### List Available Workflows

```bash
/workflow
```

Displays all configured workflows with their names, descriptions, and step counts.

**Example Output:**
```
Available workflows:

**morning-article**: MarketMinute Morning Article Generator (9AM EST)
  Automatically write and publish the 9AM EST morning market minute articles
  Steps: 4

**daily-report**: Daily Report Generator
  Generate and send daily reports
  Steps: 3

**content-pipeline**: Content Creation Pipeline
  Research, write, and publish content
  Steps: 5
```

#### Run Workflow on Current Agent

```bash
/workflow run &lt;name&gt;
```

Executes all steps in the specified workflow sequentially on the current agent. Each step is processed through the agent's `handleInput` method.

**Example:**
```bash
/workflow run content-pipeline
```

This runs each step in sequence on the current agent, with the output displayed in the chat interface.

#### Spawn Agent and Run Workflow

```bash
/workflow spawn &lt;name&gt;
```

Creates a new agent of the type specified in the workflow configuration, then executes all workflow steps on that new agent. Output is forwarded back to the parent agent.

**Example:**
```bash
/workflow spawn morning-article
```

The spawned agent runs independently and its output (chat, reasoning, human requests, and system output) is forwarded to the parent agent.

### Programmatic Workflow Execution

```typescript
import &#123; WorkflowService &#125; from '@tokenring-ai/workflow';

const workflowService = agent.app.getService(WorkflowService);

// List all workflows
const workflows = workflowService.listWorkflows();
console.log('Available workflows:', workflows.map(w =&gt; w.key));
// Output: ['morning-article', 'daily-report', 'content-pipeline']

// Get specific workflow
const workflow = workflowService.getWorkflow('morning-article');
if (workflow) &#123;
  console.log('Workflow:', workflow.name);
  console.log('Steps:', workflow.steps);
  console.log('Agent Type:', workflow.agentType);
&#125;

// Spawn workflow on dedicated agent
const spawnedAgent = await workflowService.spawnWorkflow('morning-article', &#123;
  headless: true
&#125;);

console.log('Spawned agent ID:', spawnedAgent.id);
console.log('Agent name:', spawnedAgent.name);
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

## Configuration

### Configuration Schema

The workflow configuration uses Zod schema validation:

```typescript
import &#123; z &#125; from 'zod';
import &#123; WorkflowItemSchema &#125; from './WorkflowService.ts';

const WorkflowConfigSchema = z.record(z.string(), WorkflowItemSchema).default(&#123;&#125;);

const WorkflowItemSchema = z.object(&#123;
  name: z.string(),
  description: z.string(),
  agentType: z.string(),
  steps: z.array(z.string()),
&#125;);
```

### Plugin Configuration

When installing the workflow plugin, you can provide custom configuration:

```typescript
import workflow from '@tokenring-ai/workflow';

export default &#123;
  plugins: [
    &#123;
      name: '@tokenring-ai/workflow',
      version: '0.2.0',
      config: &#123;
        workflows: &#123;
          // Your workflow configurations
        &#125;
      &#125;
    &#125;
  ]
&#125;;
```

### Configuration Validation

At application startup, all workflow configurations are validated against the schema. Invalid configurations will prevent the application from starting with descriptive error messages indicating which workflows are misconfigured.

## Integration

### Plugin Integration

The workflow package integrates with TokenRing applications through the plugin system:

```typescript
import &#123;AgentCommandService&#125; from "@tokenring-ai/agent";
import &#123;TokenRingPlugin&#125; from "@tokenring-ai/app";
import &#123;WebHostService&#125; from "@tokenring-ai/web-host";
import JsonRpcResource from "@tokenring-ai/webhost/JsonRpcResource";
import &#123;z&#125; from "zod";
import chatCommands from "./chatCommands.ts";
import &#123;WorkflowConfigSchema&#125; from "./index.ts";
import packageJSON from "./package.json" with &#123;type: "json"&#125;;
import workflowRPC from "./rpc/workflow";
import WorkflowService from "./WorkflowService";

const packageConfigSchema = z.object(&#123;
  workflows: WorkflowConfigSchema
&#125;);

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    app.waitForService(AgentCommandService, agentCommandService =&gt;
      agentCommandService.addAgentCommands(chatCommands)
    );
    const workflowService = new WorkflowService(app, config.workflows);
    app.addServices(workflowService);

    app.waitForService(WebHostService, webHostService =&gt; &#123;
      webHostService.registerResource("Workflow RPC endpoint", new JsonRpcResource(app, workflowRPC));
    &#125;);
  &#125;,
  config: packageConfigSchema
&#125; satisfies TokenRingPlugin&lt;typeof packageConfigSchema&gt;;
```

### Service Dependencies

The workflow package requires these services to be available:

| Service | Purpose |
|---------|---------|
| AgentCommandService | Registers and handles chat commands for workflow interaction |
| WebHostService | Exposes JSON-RPC endpoints for remote workflow management |
| AgentManager | Handles agent spawning and lifecycle management |
| Agent | Provides access to service instances and workflow execution |

### Event Forwarding with runSubAgent

When spawning workflows, the system handles automatic event forwarding:

```typescript
await runSubAgent(&#123;
  agentType: workflow.agentType,
  command: `/workflow run $&#123;workflowName&#125;`,
  headless: agent.headless,
  forwardChatOutput: true,
  forwardReasoning: true,
  forwardHumanRequests: true,
  forwardSystemOutput: true
&#125;, agent, true)
```

This ensures that output from the spawned agent is seamlessly forwarded to the parent agent's interface.

## API Reference

### JSON-RPC Endpoints

The workflow package provides JSON-RPC endpoints under `/rpc/workflow`:

#### `listWorkflows(args, app: TokenRingApp)`

Lists all available workflows.

**Input Parameters:**
```typescript
args: &#123;&#125;
```

**Returns:** Array of workflow objects with the following structure:
```typescript
Array&lt;&#123;
  key: string;
  name: string;
  description: string;
  agentType: string;
  steps: string[];
&#125;&gt;
```

#### `getWorkflow(args, app: TokenRingApp)`

Retrieves a specific workflow by name.

**Input Parameters:**
```typescript
args: &#123;
  name: string;  // The workflow identifier
&#125;
```

**Returns:** Single workflow object:
```typescript
&#123;
  key: string;
  name: string;
  description: string;
  agentType: string;
  steps: string[];
&#125;
```

**Errors:** Throws error if workflow is not found

#### `spawnWorkflow(args, app: TokenRingApp)`

Spawns a new agent and runs the specified workflow.

**Input Parameters:**
```typescript
args: &#123;
  workflowName: string;  // The name of the workflow to run
  headless?: boolean;     // Whether to run in headless mode (default: false)
&#125;
```

**Returns:** Agent information object:
```typescript
&#123;
  id: string;
  name: string;
  description: string;
&#125;
```

### Chat Command API

The `/workflow` command accepts the following syntax:

| Command | Description |
|---------|-------------|
| `/workflow` | List all available workflows |
| `/workflow run &lt;name&gt;` | Run workflow on current agent |
| `/workflow spawn &lt;name&gt;` | Spawn new agent and run workflow |

**Help Text:**
```markdown
# /workflow

## Description
Run multi-step workflows on the current agent.

## Usage
/workflow                  - List available workflows
/workflow run &lt;name&gt;       - Run a workflow by name on current agent
/workflow spawn &lt;name&gt;     - Spawn new agent and run workflow

## Example
/workflow run myWorkflow
/workflow spawn myWorkflow
```

## Related Components

| Component | Purpose |
|-----------|---------|
| @tokenring-ai/agent | Agent system and command execution |
| @tokenring-ai/app | Base application framework and service management |
| @tokenring-ai/web-host | WebSocket server and JSON-RPC support |
| @tokenring-ai/research | Research tools for workflow steps |
| @tokenring-ai/websearch | Web search tools for workflow steps |
| @tokenring-ai/database | Database query tools for workflow steps |

## Development

### Package Structure

```
pkg/workflow/
├── index.ts                           # Package exports and configuration schema
├── plugin.ts                          # Plugin integration logic
├── WorkflowService.ts                 # Core service implementation
├── chatCommands.ts                    # Chat command definitions
├── commands/workflow.ts               # Workflow command implementation
├── commands/workflow.test.ts          # Tests for workflow commands
├── rpc/workflow.ts                    # RPC endpoint implementation
├── rpc/schema.ts                      # RPC schema definitions
├── package.json                       # Package configuration
└── LICENSE                            # License file
```

### Testing

The package uses Vitest for testing:

```bash
cd pkg/workflow
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Building

TypeScript compilation verification:

```bash
cd pkg/workflow
npm run build
```

## Monitoring and Debugging

The Workflow Plugin provides comprehensive monitoring and debugging capabilities:

### Error Handling

- **Workflow Not Found**: Clear error message when specified workflow doesn't exist
- **Configuration Validation**: Schema validation ensures proper workflow structure at startup
- **Step Execution**: Individual step failures are logged but don't stop workflow execution
- **Agent Spawning**: Proper error handling for agent creation failures
- **RPC Endpoint Errors**: Descriptive errors for malformed requests

### Logging

All workflow steps and execution status are logged via the agent's output stream. Each step's result is captured and displayed in the chat interface. The WorkflowService outputs a summary message on startup:

```
[WorkflowService] Loaded &#123;N&#125; workflows
```

### Debugging Commands

Use `/workflow` commands to inspect workflow states and errors:

```bash
/workflow                          # List all configured workflows
/workflow run &lt;name&gt; --verbose     # Run with detailed output
/workflow spawn &lt;name&gt; --debug     # Spawn with debug information
```

### Performance Tracking

Workflow execution time can be monitored through agent logs, which include timestamps for each step. The sequential nature of workflow execution ensures predictable timing for performance analysis.

## License

MIT License - see [LICENSE](https://github.com/tokenring-ai/monorepo/blob/main/LICENSE) for details.
