# Testing Plugin

## Overview

The `@tokenring-ai/testing` package provides an automated testing framework for AI agents within the Token Ring ecosystem. It enables declarative test resource configuration, shell command integration, and automatic test execution with error repair workflows.

### Key Features

- **Testing Resources**: Pluggable test resource system with `TestingResource` interface
- **Shell Command Tests**: Built-in `ShellCommandTestingResource` for running test commands
- **Service Layer**: Central `TestingService` for managing test resources and execution
- **Chat Commands**: Interactive `/test` command for manual test control
- **Automation Hooks**: Automatic test execution after file modifications via `autoTest` hook
- **Configuration-Based Setup**: Declarative resource configuration through Zod schemas
- **State Management**: Checkpoint-based state preservation with test results tracking and repair count
- **Repair Workflows**: Automatic test failure recovery with configurable auto-repair limits

## Core Components

### TestingService

The central service that manages testing resources and executes tests across all registered resources.

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

Implementation of `TestingResource` that executes shell commands as tests.

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

### Configuration Schemas

**TestingServiceConfigSchema** (Plugin-level configuration):

```typescript
const TestingServiceConfigSchema = z.object({
  agentDefaults: z.object({
    maxAutoRepairs: z.number().default(5),
  }).prefault({}),
  resources: z.record(z.string(), z.any()).optional(),
}).strict().prefault({});
```

**shellCommandTestingConfigSchema** (Resource-level configuration):

```typescript
const shellCommandTestingConfigSchema = z.object({
  type: z.literal("shell"),
  name: z.string(),
  description: z.string().optional(),
  workingDirectory: z.string().optional(),
  command: z.string(),
  timeoutSeconds: z.number().default(120),
  cropOutput: z.number().default(10000),
});
```

**TestingAgentConfigSchema** (Agent-level configuration):

```typescript
const TestingAgentConfigSchema = z.object({
  maxAutoRepairs: z.number().optional(),
}).default({});
```

**testResultSchema** (Test result discriminator):

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

This package does not use provider patterns. Resources are registered directly through the `TestingService`.

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
  description: "/test list - List available tests",
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
  description: "/test run - Run tests",
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

### Example Usage

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

### Plugin Configuration

Configure testing resources through the plugin system:

```typescript
import testingPlugin from '@tokenring-ai/testing/plugin';

const config = {
  testing: {
    agentDefaults: {
      maxAutoRepairs: 5
    },
    resources: {
      'build-test': {
        type: 'shell',
        name: 'build-test',
        command: 'bun run build',
        workingDirectory: './project',
        timeoutSeconds: 120
      },
      'unit-tests': {
        type: 'shell',
        name: 'unit-tests',
        command: 'bun test',
        workingDirectory: './project'
      }
    }
  }
};

app.addPlugin(testingPlugin, config);
```

### Agent Configuration

Configure agent-specific testing defaults:

```typescript
const agentConfig = {
  testing: {
    maxAutoRepairs: 3  // Override service default
  }
};
```

### Configuration Validation

All configuration is validated using Zod schemas:

```typescript
import { TestingServiceConfigSchema } from '@tokenring-ai/testing';

// Validate configuration
const validatedConfig = TestingServiceConfigSchema.parse(config.testing);

// Access defaults
const maxRepairs = validatedConfig.agentDefaults.maxAutoRepairs; // Default: 5
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

**Automatic Registration:**

When the plugin is installed, it automatically:

1. Registers chat commands with `AgentCommandService`
2. Registers hooks with `AgentLifecycleService`
3. Registers `TestingService` with the application
4. Creates `ShellCommandTestingResource` instances from configuration

### Auto Test Hook

Enable automatic test execution after chat completion:

```typescript
import hooks from '@tokenring-ai/testing/hooks';

// The autoTest hook is automatically registered when the plugin is installed
// It will run tests automatically when:
// 1. Chat completion occurs (afterChatCompletion event)
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

Testing state is automatically initialized for agents:

```typescript
// Access testing state
const testingState = agent.getState('TestingState');

// View test results
console.log(testingState.show());
// Output:
// Test Results:
// [Test: build-test]: PASSED
// [Test: unit-tests]: FAILED
//   error output here
//
// Total Repairs: 2

// State properties
interface TestingState {
  name: string;
  serializationSchema: z.Schema;
  testResults: Record<string, TestResult>;
  repairCount: number;
  maxAutoRepairs: number;

  // Methods
  reset(what: ResetWhat[]): void;
  serialize(): z.output<typeof serializationSchema>;
  deserialize(data: z.output<typeof serializationSchema>): void;
  show(): string[];
}
```

**State Serialization:**

```typescript
const serializationSchema = z.object({
  testResults: z.record(z.string(), z.any()),
  repairCount: z.number(),
  maxAutoRepairs: z.number()
});

// Serialize state for checkpointing
const stateData = testingState.serialize();

// Deserialize from checkpoint
testingState.deserialize(stateData);
```

## Usage Examples

### Basic Resource Configuration

Configure testing resources through the plugin system:

```typescript
const appConfig = {
  testing: {
    agentDefaults: {
      maxAutoRepairs: 5
    },
    resources: {
      'build-test': {
        type: "shell",
        name: "build-test",
        command: "bun run build",
        workingDirectory: "./project",
        timeoutSeconds: 120
      },
      'unit-tests': {
        type: "shell",
        name: "unit-tests",
        command: "bun test",
        workingDirectory: "./project"
      }
    }
  }
};

app.config = {
  testing: TestingServiceConfigSchema.parse(appConfig.testing)
};
```

### Interactive Testing Workflow

Use the `/test` command in the chat interface:

```bash
# List all available tests
/test list

# Run specific test
/test run build-test

# Run all tests (uses "*" pattern)
/test run

# Run test matching a name pattern
/test run userAuth
```

### Programmatic Usage

```typescript
import TestingService from '@tokenring-ai/testing/TestingService';
import ShellCommandTestingResource from '@tokenring-ai/testing/ShellCommandTestingResource';

// Create service with configuration
const testingService = new TestingService({
  agentDefaults: { maxAutoRepairs: 5 },
  resources: {}
});

// Register shell command resource
const shellResource = new ShellCommandTestingResource({
  type: "shell",
  name: 'build-test',
  command: 'bun run build',
  workingDirectory: './project',
  timeoutSeconds: 120
});

testingService.registerResource('build-test', shellResource);

// Run tests using agent context
await testingService.runTests("*", agent);

// Check if all tests passed
const allPassed = testingService.allTestsPassed(agent);
if (allPassed) {
  agent.chatOutput("All tests passed!");
}
```

### Resource Registration from Config

Programmatically register resources from application configuration:

```typescript
import { TestingServiceConfigSchema, shellCommandTestingConfigSchema } from '@tokenring-ai/testing';

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

// Parse configuration
const testingConfig = TestingServiceConfigSchema.parse(appConfig.testing);

// Create service
const testingService = new TestingService(testingConfig);

// Register resources
if (testingConfig.resources) {
  for (const name in testingConfig.resources) {
    const resourceConfig = testingConfig.resources[name];
    if (resourceConfig.type === "shell") {
      const parsed = shellCommandTestingConfigSchema.parse(resourceConfig);
      testingService.registerResource(
        name,
        new ShellCommandTestingResource(parsed)
      );
    }
  }
}
```

### Custom Test Resource Implementation

Create custom test resources by implementing the `TestingResource` interface:

```typescript
import type { TestingResource } from '@tokenring-ai/testing/TestingResource';
import type { TestResult } from '@tokenring-ai/testing/schema';

class CustomTestingResource implements TestingResource {
  description = 'Custom test resource';

  async runTest(agent): Promise<TestResult> {
    const startedAt = Date.now();

    try {
      // Perform custom test logic
      const result = await this.performTest(agent);

      return {
        status: "passed" as const,
        startedAt,
        finishedAt: Date.now(),
        output: result.output
      };
    } catch (error) {
      return {
        status: "error" as const,
        startedAt,
        finishedAt: Date.now(),
        error: String(error)
      };
    }
  }

  private async performTest(agent) {
    // Test implementation
    return { success: true, output: 'Test output' };
  }
}

const customResource = new CustomTestingResource();
testingService.registerResource('custom', customResource);
```

### Automated Repair Workflow

The testing package supports automatic repair workflows:

```typescript
// When tests fail, the service:
// 1. Collects failure reports
// 2. Checks repair count against maxAutoRepairs
// 3. Asks for user approval to repair
// 4. If approved, sends failure details to agent for repair

// Example flow:
await testingService.runTests("*", agent);
// If tests fail:
// - User is prompted: "The following tests failed. Would you like to ask the agent to automatically repair the errors?"
// - If confirmed: agent.handleInput({ message: "After running the test suite, the following problems were encountered..." })
// - repairCount is incremented
// - Tests are run again to verify repair
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

### Development

**Building and Testing:**

```bash
# Install dependencies
bun install

# Build (type-check)
bun run build

# Lint
bun run eslint

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage
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

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: Application framework and plugin system (0.2.0)
- `@tokenring-ai/chat`: Chat functionality (0.2.0)
- `@tokenring-ai/agent`: Agent framework and command system (0.2.0)
- `@tokenring-ai/filesystem`: File system operations (0.2.0)
- `@tokenring-ai/terminal`: Terminal service for shell command execution (0.2.0)
- `@tokenring-ai/queue`: Queue utilities (0.2.0)
- `@tokenring-ai/utility`: Utility classes including KeyedRegistry (0.2.0)
- `glob-gitignore`: Glob pattern matching with gitignore support (^1.0.15)
- `zod`: Runtime type validation for configuration schemas (^4.3.6)

### Development Dependencies

- `typescript`: TypeScript compilation (^5.9.3)
- `vitest`: Unit testing framework with watch mode and coverage support (^4.0.18)

## Related Components

- **@tokenring-ai/filesystem**: Provides file system operations and modification detection
- **@tokenring-ai/agent**: Agent framework for command execution and state management
- **@tokenring-ai/utility**: KeyedRegistry for resource management
- **@tokenring-ai/terminal**: Terminal service for executing shell commands in tests
- **@tokenring-ai/app**: Application framework and plugin system

## Limitations

- Shell tests assume Unix-like environments (Windows paths and commands may need adjustments)
- Auto-repair quality depends on agent capabilities and configuration
- Filesystem modification detection requires proper integration with FileSystemService
- Only shell resource type is provided; custom resources can be implemented
- Repair prompts user but execution of remediation depends on user confirmation

## License

MIT License - see LICENSE file in package directory.
