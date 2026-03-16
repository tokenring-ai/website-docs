# @tokenring-ai/testing

The `@tokenring-ai/testing` package provides an automated testing framework for AI agents within the Token Ring ecosystem. It enables declarative test resource configuration, shell command integration, automatic test execution, and error repair workflows.

## Overview

The testing package enables automated and manual testing of codebases. It integrates shell command execution for tests and includes automation hooks for seamless workflow integration. The package is designed to work seamlessly with the Token Ring agent framework, providing both tool-based interactions and scripting functions for programmatic testing.

### Key Features

- **Testing Resources**: Pluggable components for defining and running tests (shell commands, custom resources)
- **Service Layer**: Central `TestingService` for managing and executing tests across resources
- **Chat Commands**: Interactive `/test` command for manual control
- **Automation Hooks**: Automatic test execution after file modifications via `autoTest` hook
- **Configuration-Based Setup**: Declarative resource configuration through plugin system with Zod schemas
- **State Management**: Checkpoint-based state preservation during repair workflows
- **Auto-Repair**: Automatic error detection and repair suggestions when tests fail
- **Resource Registration**: Support for custom `TestingResource` implementations

## Core Components

### TestingService

The central service for managing and executing tests across all registered resources.

**Implements:** `TokenRingService`

**Class Signature:**

```typescript
class TestingService implements TokenRingService {
  readonly name: string = "TestingService"
  description: string = "Provides testing functionality"

  registerResource(name: string, resource: TestingResource): void
  getAvailableResources(): Iterable<string>
  runTests(likeName: string, agent: Agent): Promise<void>
  allTestsPassed(agent: Agent): boolean
  attach(agent: Agent): void

  constructor(readonly options: z.output<typeof TestingServiceConfigSchema>)
}
```

**Properties:**

- `name: string` - Service name ("TestingService")
- `description: string` - Service description ("Provides testing functionality")
- `options: z.output<typeof TestingServiceConfigSchema>` - Service configuration options

**Methods:**

- `registerResource(name: string, resource: TestingResource): void` - Register a new testing resource
- `getAvailableResources(): Iterable<string>` - Get names of all available resources
- `runTests(likeName: string, agent: Agent): Promise<void>` - Run tests matching the pattern
- `allTestsPassed(agent: Agent): boolean` - Check if all tests passed for an agent
- `attach(agent: Agent): void` - Attach service to agent and initialize state

**Example:**

```typescript
import TestingService from '@tokenring-ai/testing/TestingService';

const testingService = agent.requireServiceByType(TestingService);
await testingService.runTests("*", agent);
const allPassed = testingService.allTestsPassed(agent);
if (allPassed) {
  agent.chatOutput("All tests passed!");
}
```

### TestingResource Interface

Base interface for implementing custom test resources.

**Interface Definition:**

```typescript
interface TestingResource {
  description: string;
  runTest: (agent: Agent) => Promise<TestResult>;
}
```

**Properties:**

- `description: string` - Resource description

**Methods:**

- `runTest(agent: Agent): Promise<TestResult>` - Execute the test and return result

### ShellCommandTestingResource

Concrete implementation for running shell commands as tests.

**Implements:** `TestingResource`

**Class Signature:**

```typescript
class ShellCommandTestingResource implements TestingResource {
  description: string = "Provides ShellCommandTesting functionality"

  constructor(private readonly options: z.output<typeof shellCommandTestingConfigSchema>)

  runTest(agent: Agent): Promise<TestResult>
}
```

**Constructor Options:**

```typescript
interface ShellCommandTestingResourceOptions {
  type: "shell";
  name: string;
  description?: string;
  workingDirectory?: string;
  command: string;
  timeoutSeconds?: number;
  cropOutput?: number;
}
```

**Properties:**

- `description: string` - Resource description ("Provides ShellCommandTesting functionality")
- `options: z.output<typeof shellCommandTestingConfigSchema>` - Resource configuration

**Default Values:**

- `timeoutSeconds`: 120 seconds
- `cropOutput`: 10000 characters

**Example:**

```typescript
import ShellCommandTestingResource from '@tokenring-ai/testing/ShellCommandTestingResource';

const resource = new ShellCommandTestingResource({
  type: "shell",
  name: 'build-test',
  command: 'bun run build',
  workingDirectory: './project',
  timeoutSeconds: 120
});

testingService.registerResource('build-test', resource);
```

### TestResult Type

Defines the structure for test execution results using a discriminated union.

**Type Definition:**

```typescript
type TestResult =
  | {
      status: "passed";
      startedAt: number;
      finishedAt: number;
      output?: string;
    }
  | {
      status: "failed";
      startedAt: number;
      finishedAt: number;
      output: string;
    }
  | {
      status: "timeout";
      startedAt: number;
      finishedAt: number;
    }
  | {
      status: "error";
      startedAt: number;
      finishedAt: number;
      error: string;
    };
```

**Status Values:**

- `passed` - Test completed successfully
- `failed` - Test failed with output
- `timeout` - Test exceeded timeout
- `error` - Test encountered an error

## Services

### TestingService

The `TestingService` class implements the `TokenRingService` interface and provides testing capabilities to agents.

**Service Registration:**

The service is automatically registered when the plugin is installed:

```typescript
import testingPlugin from '@tokenring-ai/testing/plugin';

app.addPlugin(testingPlugin, {
  testing: {
    agentDefaults: { maxAutoRepairs: 5 },
    resources: {
      'build-test': {
        type: 'shell',
        name: 'build-test',
        command: 'bun run build'
      }
    }
  }
});
```

**Usage:**

```typescript
// Get service from agent
const testingService = agent.requireServiceByType(TestingService);

// Register a resource
testingService.registerResource('build-test', new ShellCommandTestingResource({
  type: 'shell',
  name: 'build-test',
  command: 'bun run build'
}));

// List available resources
const resources = testingService.getAvailableResources();

// Run all tests
await testingService.runTests('*', agent);

// Check if all tests passed
if (testingService.allTestsPassed(agent)) {
  agent.chatOutput('All tests passed!');
}
```

**State Attachment:**

When attached to an agent, the service initializes state:

```typescript
// Service automatically calls attach() during plugin installation
// This initializes TestingState with agent-specific configuration
testingService.attach(agent);

// Access state
const state = agent.getState('TestingState');
console.log(state.show());
```

## Provider Documentation

This package does not use provider patterns. Resources are registered directly through the `TestingService` using the `KeyedRegistry` pattern.

## RPC Endpoints

This package does not define RPC endpoints.

## Chat Commands

### /test Command

Run and manage tests interactively through the chat interface.

**Subcommands:**

- `/test list` - Display all available test resources
- `/test run [test_name|*]` - Execute specific test or all tests

**Command Definitions:**

```typescript
// /test list
{
  name: "test list",
  description: "List available tests",
  help: `# /test list

Show all available tests.

## Example

/test list`,
  execute: async (_remainder: string, agent: Agent): Promise<string> => {
    const available = Array.from(
      agent.requireServiceByType(TestingService).getAvailableResources()
    );
    return available.length === 0
      ? "No tests available."
      : "Available tests:\n" + available.map(n => ` - ${n}`).join('\n');
  }
}

// /test run
{
  name: "test run",
  description: "Run tests",
  help: `# /test run [test_name]

Run a specific test or all tests. If tests fail, the agent may offer to automatically repair the issues.

## Example

/test run
/test run userAuth`,
  execute: async (remainder: string, agent: Agent): Promise<string> => {
    await agent.requireServiceByType(TestingService)
      .runTests(remainder?.trim() || "*", agent);
    return "Tests executed";
  }
}
```

**Example Usage:**

```bash
# List available tests
/test list
# Output: Available tests:
#   - build-test
#   - unit-tests
#   - integration-tests

# Run specific test
/test run build-test
# Output: - **[Test: build-test]** : ✅ PASSED

# Run all tests
/test run
# Output: **All tests passed!** ✨

# Run test matching pattern
/test run userAuth
# Output: - **[Test: userAuth]** : ❌ FAILED
#         (followed by repair prompt if configured)
```

**Output Status Indicators:**

- `✅ PASSED` - Test completed successfully
- `❌ FAILED` - Test failed with output
- `⏳ TIMEOUT` - Test exceeded timeout
- `⚠️ ERROR` - Test encountered an error

## Configuration

### Plugin Configuration Schema

```typescript
import { TestingServiceConfigSchema } from '@tokenring-ai/testing/schema';
import { z } from 'zod';

// Plugin-level configuration
const packageConfigSchema = z.object({
  testing: TestingServiceConfigSchema.optional()
});
```

### Testing Service Configuration

```typescript
import { TestingServiceConfigSchema } from '@tokenring-ai/testing/schema';

const config = {
  agentDefaults: {
    maxAutoRepairs: 5  // Maximum number of auto-repair attempts
  },
  resources: {
    // Resource definitions go here
  }
};
```

### Resource Configuration

Configure testing resources through your application config:

```typescript
{
  "testing": {
    "agentDefaults": {
      "maxAutoRepairs": 5
    },
    "resources": {
      "build-test": {
        "type": "shell",
        "name": "build-test",
        "command": "bun run build",
        "workingDirectory": "./project",
        "timeoutSeconds": 120
      },
      "unit-tests": {
        "type": "shell",
        "name": "unit-tests",
        "command": "bun test",
        "workingDirectory": "./project"
      }
    }
  }
}
```

**Note:** The `name` field in resources is required and should match the resource name in the config key.

### Agent Configuration

Individual agents can override the default testing configuration:

```typescript
// Agent-level configuration that merges with service defaults
const agentConfig = {
  testing: {
    maxAutoRepairs: 10
  }
};
```

### Configuration Schemas

**TestingServiceConfigSchema:**

```typescript
const TestingServiceConfigSchema = z.object({
  agentDefaults: z.object({
    maxAutoRepairs: z.number().default(5),
  }).prefault({}),
  resources: z.record(z.string(), z.any()).optional(),
}).strict().prefault({});
```

**shellCommandTestingConfigSchema:**

```typescript
const shellCommandTestingConfigSchema = z.object({
  type: z.literal("shell"),
  name: z.string(),
  description: z.string().optional(),
  workingDirectory: z.string().optional(),
  command: z.string(),
  timeoutSeconds: z.number().default(120),
  cropOutput: z.number().default(10000)
});
```

**TestingAgentConfigSchema:**

```typescript
const TestingAgentConfigSchema = z.object({
  maxAutoRepairs: z.number().optional(),
}).default({});
```

**testResultSchema:**

```typescript
const testResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("passed"),
    startedAt: z.number(),
    finishedAt: z.number(),
    output: z.string().optional(),
  }),
  z.object({
    status: z.literal("failed"),
    startedAt: z.number(),
    finishedAt: z.number(),
    output: z.string(),
  }),
  z.object({
    status: z.literal("timeout"),
    startedAt: z.number(),
    finishedAt: z.number(),
  }),
  z.object({
    status: z.literal("error"),
    startedAt: z.number(),
    finishedAt: z.number(),
    error: z.string(),
  }),
]);
```

## Integration

### Plugin Installation

Add the testing plugin to your application:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import testingPlugin from '@tokenring-ai/testing/plugin';

const app = new TokenRingApp();

// Add testing plugin with configuration
app.addPlugin(testingPlugin, {
  testing: {
    agentDefaults: {
      maxAutoRepairs: 5
    },
    resources: {
      'build': {
        type: 'shell',
        name: 'build',
        command: 'bun run build'
      },
      'test': {
        type: 'shell',
        name: 'test',
        command: 'bun test'
      }
    }
  }
});
```

**Automatic Registration Flow:**

When the plugin is installed, it automatically:

1. Registers chat commands with `AgentCommandService` via `agentCommandService.addAgentCommands(agentCommands)`
2. Registers hooks with `AgentLifecycleService` via `lifecycleService.addHooks(hooks)`
3. Auto-registers `TestingService` with application via `app.addServices(testingService)`
4. Creates `ShellCommandTestingResource` instances from configuration via `testingConfig.type === "shell"`
5. Uses `TestingServiceConfigSchema` and `shellCommandTestingConfigSchema` for validation

### Auto Test Hook

Enable automatic test execution after chat completion:

```typescript
import hooks from '@tokenring-ai/testing/hooks';

// The autoTest hook is automatically registered when the plugin is installed
// It will run tests automatically when:
// 1. Chat completion occurs (AfterAgentInputSuccess event)
// 2. File system has been modified (filesystem.isDirty(agent) === true)

// Hook implementation:
const autoTestHook = {
  name: "autoTest",
  displayName: "Testing/Auto Test",
  description: "Runs tests automatically after chat is complete",
  callbacks: [
    new HookCallback(AfterAgentInputSuccess, async (_data, agent) => {
      const filesystem = agent.requireServiceByType(FileSystemService);
      const testingService = agent.requireServiceByType(TestingService);

      if (filesystem.isDirty(agent)) {
        agent.infoMessage("Working Directory was updated, running test suite...");
        await testingService.runTests("*", agent);
      }
    })
  ]
};
```

### AfterTestsPassed Hook Event

A custom hook event type that can be used to trigger actions after all tests have passed.

**Class Definition:**

```typescript
class AfterTestsPassed {
  readonly type = "hook";
  constructor() {}
}
```

This hook event type is exported from the package and can be used to subscribe to test completion events.

### State Management

The TestingService manages state through the `TestingState` class.

```typescript
class TestingState implements AgentStateSlice<typeof serializationSchema> {
  readonly name: string = "TestingState"
  readonly serializationSchema: z.output<typeof serializationSchema>

  testResults: Record<string, TestResult> = {}
  repairCount: number = 0
  maxAutoRepairs: number

  constructor(readonly initialConfig: z.output<typeof TestingServiceConfigSchema>["agentDefaults"])

  // Methods
  reset(what: ResetWhat[]): void
  serialize(): z.output<typeof serializationSchema>
  deserialize(data: z.output<typeof serializationSchema>): void
  show(): string[]
}
```

**State Properties:**

- `testResults`: Record of test name to TestResult objects
- `repairCount`: Number of auto-repair attempts made
- `maxAutoRepairs`: Maximum number of auto-repairs allowed before stopping

**State Lifecycle:**

1. **Initialization**: Created via `agent.initializeState(TestingState, config)` during service attach
2. **Serialization**: State can be serialized using `serialize()` method and checkpointed
3. **Deserialization**: State can be restored from checkpoint using `deserialize(data)`
4. **UI Display**: State information shown via `show()` method
5. **Reset**: `reset(what)` method can clear specific state portions

**Serialization Schema:**

```typescript
const serializationSchema = z.object({
  testResults: z.record(z.string(), z.any()),
  repairCount: z.number(),
  maxAutoRepairs: z.number()
});
```

**State Display Output:**

The `show()` method returns a formatted string array showing:

- Test results with PASS/FAIL status
- Error information if a test failed
- Total repair count

Structure:
```
[
  "Test Results:",
  "[Test: name]: PASSED/FAILED/TIMEOUT/ERROR\nerror",
  "",
  "Total Repairs: N"
]
```

**State Preservation:**

- Test results are persisted across sessions via serialization
- Repair count is tracked and stored to prevent infinite loops
- State can be serialized and deserialized for checkpoint recovery
- State is automatically restored when agent is reinitialized

## Usage Examples

### Basic Setup and Testing

```typescript
import TestingService from '@tokenring-ai/testing/TestingService';
import ShellCommandTestingResource from '@tokenring-ai/testing/ShellCommandTestingResource';

// Create service with configuration
const testingService = new TestingService({
  agentDefaults: { maxAutoRepairs: 5 },
  resources: {}
});

// Register a resource
const shellResource = new ShellCommandTestingResource({
  type: "shell",
  name: 'build-test',
  command: 'bun run build',
  workingDirectory: './project',
  timeoutSeconds: 120
});

testingService.registerResource('build-test', shellResource);

// In an agent context
const agent = new Agent(/* config */);
await testingService.runTests("build-test", agent);
const allPassed = testingService.allTestsPassed(agent);
console.log(allPassed ? 'All tests passed!' : 'Some tests failed');
```

### Resource Registration from Config

```typescript
import { TestingServiceConfigSchema, shellCommandTestingConfigSchema } from '@tokenring-ai/testing/schema';
import TestingService from '@tokenring-ai/testing/TestingService';
import ShellCommandTestingResource from '@tokenring-ai/testing/ShellCommandTestingResource';

const appConfig = {
  testing: {
    agentDefaults: { maxAutoRepairs: 5 },
    resources: {
      build: {
        type: "shell",
        name: "build",
        command: "bun run build"
      },
      test: {
        type: "shell",
        name: "test",
        command: "bun test"
      }
    }
  }
};

// Parse and register in plugin install hook
const parsedConfig = TestingServiceConfigSchema.parse(appConfig.testing);
const testingService = new TestingService(parsedConfig);

for (const name in parsedConfig.resources) {
  if (parsedConfig.resources[name].type === "shell") {
    const resourceConfig = shellCommandTestingConfigSchema.parse(parsedConfig.resources[name]);
    testingService.registerResource(name,
      new ShellCommandTestingResource(resourceConfig)
    );
  }
}
```

### Interactive Testing Workflow

```bash
# In agent chat:
/test list              # See available tests
/test run               # Run all tests (default)
/test run build-test    # Run specific test
```

### Automated Repair Workflow

```typescript
// Hook integration - automatically triggers when:
// 1. File modifications detected (filesystem.isDirty(agent) = true)
// 2. AfterAgentInputSuccess hook executes
// 3. Tests run via testingService.runTests("*", agent)
// 4. Failures detected and repairCount < maxAutoRepairs
// 5. User confirms repair through agent.askForApproval()

// If user confirms repair:
// 1. Agent receives failure details from agent.handleInput()
// 2. Agent attempts to fix issues
// 3. Tests run again to verify repair
// 4. repairCount is incremented
```

### Custom Test Resource Implementation

```typescript
import type { TestingResource } from '@tokenring-ai/testing/TestingResource';
import type { TestResult } from '@tokenring-ai/testing/schema';
import type Agent from '@tokenring-ai/agent/Agent';

class CustomTestingResource implements TestingResource {
  description = 'Custom test resource';

  async runTest(agent: Agent): Promise<TestResult> {
    const startedAt = Date.now();

    try {
      // Perform custom test logic
      const result = await this.performTest(agent);

      return {
        status: "passed",
        startedAt,
        finishedAt: Date.now(),
        output: result.output
      };
    } catch (error) {
      return {
        status: "error",
        startedAt,
        finishedAt: Date.now(),
        error: String(error)
      };
    }
  }

  private async performTest(agent: Agent) {
    // Test implementation
    return { success: true, output: 'Test output' };
  }
}

const customResource = new CustomTestingResource();
testingService.registerResource('custom', customResource);
```

## Best Practices

### Resource Configuration

1. **Use Descriptive Names**: Test resource names should clearly indicate their purpose

   ```typescript
   resources: {
     "lint-typescript": { type: "shell", command: "tsc --noEmit" },
     "test-unit": { type: "shell", command: "bun test" },
     "test-integration": { type: "shell", command: "bun test integration" }
   }
   ```

2. **Set Working Directories**: Use absolute paths or relative to project root

   ```typescript
   workingDirectory: process.cwd()
   ```

3. **Configure Timeouts**: Set appropriate timeouts for resource-intensive operations

   ```typescript
   timeoutSeconds: 300  // 5 minutes for full test suite
   ```

4. **Configure Output Cropping**: Use `cropOutput` to limit output size

   ```typescript
   cropOutput: 10000  // Default is 10000 characters
   ```

### State Management

1. **Enable Auto-Repairs**: Set reasonable `maxAutoRepairs` to enable testing-based repair workflows

   ```typescript
   agentDefaults: { maxAutoRepairs: 5 }
   ```

2. **Track Test Results**: Use `allTestsPassed(agent)` to check overall status

   ```typescript
   const allPassed = testingService.allTestsPassed(agent);
   if (!allPassed) {
     // Handle failures
   }
   ```

3. **Review State**: Check `TestingState.show()` for detailed results

   ```typescript
   const state = agent.getState('TestingState');
   console.log(state.show());
   ```

### Test Design

1. **Separate Tests**: Create dedicated resources for different testing phases
2. **Clear Output**: Shell commands should return meaningful exit codes and messages
3. **Fast Feedback**: Prioritize quick tests (linting, type checking) for frequent runs

### Integration

1. **Hook Automation**: Enable `autoTest` hook to integrate testing into development workflow
2. **Chat Commands**: Leverage `/test` command for interactive testing scenarios
3. **Plugin Registration**: Add plugin to application to ensure all services are registered automatically

## Testing and Development

### Building

```bash
bun run build          # Type-check the code
bun run eslint         # Run linter
```

### Testing

```bash
bun run test                 # Run all tests
bun run test:watch           # Run tests in watch mode
bun run test:coverage        # Generate coverage report
```

### Environment

- **Node.js Version**: v18+
- **Package Manager**: bun (recommended)
- **Testing Framework**: vitest
- **Type Safety**: TypeScript strict mode

### Package Structure

```
pkg/testing/
├── commands.ts              # Chat command exports
├── commands/
│   └── test/
│       ├── list.ts          # /test list subcommand
│       └── run.ts           # /test run subcommand
├── hooks.ts                 # Hook exports
├── hooks/
│   └── autoTest.ts          # autoTest hook implementation
├── state/
│   └── testingState.ts      # TestingState class
├── TestingResource.ts       # TestingResource interface
├── ShellCommandTestingResource.ts
├── TestingService.ts
├── schema.ts                # Zod schemas for configuration
├── plugin.ts                # Plugin registration
├── index.ts                 # Public exports
├── package.json             # Dependencies and scripts
└── vitest.config.ts         # Vitest configuration
```

### Vitest Configuration

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

### Known Limitations

- Shell tests assume Unix-like environment (Windows may need adjustments)
- Repair quality depends on agent capabilities
- Auto-repair prompts user but execution depends on user confirmation
- File system modification detection requires proper integration with FileSystemService
- Only shell resource type is currently provided; custom resources can be implemented
- No automatic test discovery; tests must be manually configured

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @tokenring-ai/app | 0.2.0 | Application framework and plugin system |
| @tokenring-ai/chat | 0.2.0 | Chat interface integration |
| @tokenring-ai/agent | 0.2.0 | Agent framework and command system |
| @tokenring-ai/filesystem | 0.2.0 | File system service for dirty detection |
| @tokenring-ai/lifecycle | 0.2.0 | Lifecycle and hook management |
| @tokenring-ai/terminal | 0.2.0 | Terminal service for shell command execution |
| @tokenring-ai/queue | 0.2.0 | Queue service for task management |
| @tokenring-ai/utility | 0.2.0 | Utility classes including KeyedRegistry |
| glob-gitignore | ^1.0.15 | Gitignore pattern matching |
| zod | ^4.3.6 | Runtime type validation |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.9.3 | TypeScript compiler |
| vitest | ^4.1.0 | Testing framework |

## Related Components

- **@tokenring-ai/filesystem**: Provides file system operations and modification detection
- **@tokenring-ai/agent**: Agent framework for command execution and state management
- **@tokenring-ai/utility**: KeyedRegistry for resource management
- **@tokenring-ai/terminal**: Terminal service for executing shell commands in tests
- **@tokenring-ai/app**: Application framework and plugin system
- **@tokenring-ai/lifecycle**: Lifecycle and hook management for automation

## License

MIT License - see LICENSE file for details.
