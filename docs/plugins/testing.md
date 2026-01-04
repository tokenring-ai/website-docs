# Testing Plugin

## Overview

The `@tokenring-ai/testing` plugin provides tools for executing and validating shell commands within the TokenRing ecosystem. It integrates with the agent command system to enable chat-based testing workflows and supports configuration-driven resource management.

## Key Features

- **Testing Resources**: Pluggable components for defining and running tests (shell commands, custom resources)
- **Service Layer**: Central `TestingService` for managing and executing tests across resources
- **Chat Commands**: Interactive `/test` command for manual control
- **Automation Hooks**: Automatic test execution after file modifications
- **Configuration-Based Setup**: Declarative resource configuration through plugin system
- **State Management**: Checkpoint-based state preservation during repair workflows

## Core Components

- **TestingService**: Manages testing resources and executes tests based on configuration.
- **ShellCommandTestingResource**: Handles execution of shell commands and validation of outputs.
- **Chat Commands**: Predefined commands for interacting with testing functionality via chat.
- **Lifecycle Hooks**: Integrates with agent lifecycle to manage plugin setup and teardown.
- **State Management**: `TestingState` for tracking test results and repair counts.

## Services and APIs

### TestingService

The central service for managing and executing tests across all registered resources.

**Methods:**

- `registerResource(name: string, resource: TestingResource)`: Register a testing resource
- `getAvailableResources()`: Get all registered resource names
- `runTests(likeName: string, agent: Agent)`: Execute tests matching the given pattern
- `allTestsPassed(agent: Agent): boolean`: Check if all tests passed

### ShellCommandTestingResource

Concrete implementation for running shell commands as tests.

**Constructor Options:**

```typescript
interface ShellCommandTestingResourceOptions &#123;
  type: "shell";
  name: string;
  description?: string;
  workingDirectory?: string;
  command: string;
  timeoutSeconds?: number;
&#125;
```

**Properties:**

- `description`: Description of the testing resource
- `options`: The configuration options passed to the constructor

### TestingResource (Interface)

Base interface for implementing custom test resources.

```typescript
interface TestingResource &#123;
  description: string;
  runTest: (agent: Agent) =&gt; Promise&lt;TestResult&gt;;
&#125;
```

### TestResult Interface

```typescript
interface TestResult &#123;
  startedAt: number;
  finishedAt: number;
  passed: boolean;
  output?: string;
  error?: unknown;
&#125;
```

## Commands and Tools

### /test Command

Run tests interactively through the chat interface.

**Usage:**

- `/test list` - Show available tests
- `/test run &lt;test_name|*&gt;` - Run specific tests or all tests

**Examples:**

```
/test list                    # Lists all available tests
/test run build-test          # Run the 'build-test' resource
/test run *                   # Execute every available test
```

**Output:**

- `PASSED`: Test completed successfully
- `FAILED`: Test failed with error output shown

## Configuration

The plugin is configured under the `testing` section in the application config.

```typescript
import &#123; TokenRingApp &#125; from "@tokenring-ai/app";

const app = new TokenRingApp(&#123;
  testing: &#123;
    resources: &#123;
      buildTest: &#123;
        type: "shell",
        name: "build-test",
        command: "bun run build",
        workingDirectory: "./project",
        timeoutSeconds: 120
      &#125;,
      unitTests: &#123;
        type: "shell",
        name: "unit-tests",
        command: "bun test",
        workingDirectory: "./project"
      &#125;
    &#125;,
    maxAutoRepairs: 5
  &#125;
&#125;);
```

### Configuration Schema

The `testingConfigSchema` defines the structure for testing configuration:

```typescript
const testingConfigSchema = z.object(&#123;
  resources: z.record(z.string(), z.any()).optional(),
  maxAutoRepairs: z.number().default(5),
&#125;);
```

The `shellCommandTestingConfigSchema` defines the structure for shell resources:

```typescript
const shellCommandTestingConfigSchema = z.object(&#123;
  type: z.literal("shell"),
  name: z.string(),
  description: z.string().optional(),
  workingDirectory: z.string().optional(),
  command: z.string(),
  timeoutSeconds: z.number().optional(),
&#125;);
```

## Usage Examples

### Basic Shell Command Execution

Configure a shell resource in your app config:

```typescript
const app = new TokenRingApp(&#123;
  testing: &#123;
    resources: &#123;
      shellTest: &#123;
        type: "shell",
        name: "shell-test",
        command: "echo 'Hello World'"
      &#125;
    &#125;
  &#125;
&#125;);
```

### Programmatic Usage

```typescript
import TestingService from '@tokenring-ai/testing/TestingService';
import ShellCommandTestingResource from '@tokenring-ai/testing/ShellCommandTestingResource';

const testingService = new TestingService(&#123;
  resources: &#123;
    buildTest: &#123;
      type: "shell",
      name: "build-test",
      command: "bun run build",
      workingDirectory: "./project",
      timeoutSeconds: 120
    &#125;
  &#125;,
  maxAutoRepairs: 5
&#125;);

const shellResource = new ShellCommandTestingResource(&#123;
  type: "shell",
  name: 'build-test',
  command: 'bun run build',
  workingDirectory: './project',
  timeoutSeconds: 120
&#125;);

testingService.registerResource('build-test', shellResource);

// Run tests
const agent = new Agent(/* config */);
await testingService.runTests("build-test", agent);

// Check results
console.log(testingService.allTestsPassed(agent) ? 'All tests passed!' : 'Some tests failed');
```

### Interactive Testing Workflow

```bash
# In agent chat:
/test list              # See available tests
/test run *             # Run all tests
```

## Automation Hooks

### autoTest Hook

Automatically runs tests after chat completion when files have been modified.

**Trigger:** `afterChatCompletion`
**Condition:** Filesystem is dirty (file modifications detected)

**Behavior:**

1. Detects file modifications via `filesystem.dirty`
2. Runs all enabled tests across services
3. Reports pass/fail status for each test
4. Logs results to agent output

**Test Failure Handling:**

- If tests fail, the system tracks failures
- Offers to automatically repair when `maxAutoRepairs` limit not reached
- Handles repair input directly to the agent

## State Management

The TestingService manages state through the `TestingState` class:

```typescript
class TestingState implements AgentStateSlice &#123;
  name: string = "TestingState";
  testResults: Record&lt;string, TestResult&gt; = &#123;&#125;;
  repairCount: number = 0;
  maxAutoRepairs: number;
&#125;
```

**State Preservation:**

- Test results are persisted across sessions
- Repair count is tracked to prevent infinite loops
- State can be serialized and deserialized for checkpoint recovery

## Integration

- Registers chat commands via `AgentCommandService`
- Adds hooks to `AgentLifecycleService` for startup/shutdown
- Integrates with the agent system to provide testing functionality as part of the chat interface
- Auto-registers `TestingService` with application

## Development

### Build Instructions

- Build TypeScript: `npm run build`
- Run linter: `npm run eslint`

### Testing

- Run unit tests: `npm run test`
- Watch mode: `npm run test:watch`
- Generate coverage report: `npm run test:coverage`

### Package Structure

```
pkg/testing/
├── index.ts                          # Main entry point
├── plugin.ts                         # TokenRingPlugin definition
├── TestingService.ts                 # Core testing service implementation
├── ShellCommandTestingResource.ts    # Shell command resource handler
├── TestingResource.ts                # TestingResource interface
├── chatCommands.ts                   # Agent chat commands
├── commands/
│   └── test.ts                       # /test command implementation
├── hooks.ts                          # Lifecycle hooks
├── hooks/
│   └── autoTest.ts                   # autoTest hook implementation
├── schema.ts                         # Zod schemas for configuration
├── state/
│   └── testingState.ts               # TestingState for state management
├── package.json                      # Package configuration
├── vitest.config.ts                  # Vitest configuration
└── README.md                         # Package documentation
```

## License

MIT License
