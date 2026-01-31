# Testing Plugin

## Overview

The `@tokenring-ai/testing` package provides an automated testing framework for AI agents within the Token Ring ecosystem. It enables declarative test resource configuration, shell command integration, and automatic test execution with error repair workflows.

## Key Features

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

**Class Signature:**

```typescript
class TestingService implements TokenRingService {
  name: string = "TestingService"
  description: string = "Provides testing functionality"

  registerResource(name: string, resource: TestingResource): void
  getAvailableResources(): Iterable<string>
  runTests(likeName: string, agent: Agent): Promise<void>
  allTestsPassed(agent: Agent): boolean
  attach(agent: Agent): void

  constructor(readonly options: z.output<typeof TestingServiceConfigSchema>)
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

### ShellCommandTestingResource

Comprehensive implementation of testing resources that execute shell commands as tests.

**Constructor Options:**

```typescript
interface ShellCommandTestingResourceOptions {
  type: "shell";
  name: string;
  description?: string;
  workingDirectory?: string;
  command: string;
  timeoutSeconds?: number;
}
```

**Properties:**

```typescript
class ShellCommandTestingResource implements TestingResource {
  description: string = "Provides ShellCommandTesting functionality";
  readonly options: z.output<typeof shellCommandTestingConfigSchema>;
}
```

### TestResult Interface

Defines the structure for test execution results.

```typescript
interface TestResult {
  startedAt: number;
  finishedAt: number;
  passed: boolean;
  output?: string;
  error?: unknown;
}
```

### Configuration Schemas

**TestingServiceConfigSchema** (Plugin-level configuration):

```typescript
const TestingServiceConfigSchema = z.object({
  agentDefaults: z.object({
    maxAutoRepairs: z.number().default(5),
  }).strict(),
  resources: z.record(z.string(), z.any()).optional(),
}).strict();
```

**shellCommandTestingConfigSchema** (Resource-level configuration):

```typescript
const shellCommandTestingConfigSchema = z.object({
  type: z.literal("shell"),
  name: z.string(),
  description: z.string().optional(),
  workingDirectory: z.string().optional(),
  command: z.string(),
  timeoutSeconds: z.number().optional(),
}).strict();
```

**TestingAgentConfigSchema** (Agent-level configuration):

```typescript
const TestingAgentConfigSchema = z.object({
  maxAutoRepairs: z.number().optional(),
}).default({});
```

## Usage Examples

### Installation and Setup

```typescript
import testingPlugin from '@tokenring-ai/testing/plugin';

// Add testing plugin to application
app.addPlugin(testingPlugin);
```

### Basic Resource Configuration

Configure testing resources through the plugin system:

```typescript
const appConfig = {
  testing: {
    agentDefaults: {
      maxAutoRepairs: 5
    },
    resources: {
      build-test: {
        type: "shell",
        name: "build-test",
        command: "bun run build",
        workingDirectory: "./project",
        timeoutSeconds: 120
      },
      unit-tests: {
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
/test list                    # List all available tests
/test run build-test          # Run specific test
/test run                    # Run all tests (uses "*" pattern)
/test run userAuth           # Run test matching a name pattern
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
import {TestingServiceConfigSchema, shellCommandTestingConfigSchema} from '@tokenring-ai/testing';

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

## Chat Commands

### /test Command

Run and manage tests interactively through the chat interface.

**Subcommands:**

- `/test list` - Display all available test resources
- `/test run [test_name|*]` - Execute specific test or all tests

**Help Text:**

```
/test list - Show all available tests
/test run <test_name> - Run a specific test
/test run - Run all available tests (default)

If tests fail, the agent will track the results and may offer to automatically repair the errors, provided the maximum auto-repair limit hasn't been reached.
```

### Example Usage

```bash
/test list
# Output: Available tests:
#   build-test
#   unit-tests
#   integration-tests

/test run build-test
# Output: [Test: build-test]: PASSED

/test run
# Output: All tests passed!
```

## Automation Hooks

### autoTest Hook

Automatically executes tests after chat completion when the filesystem has been modified.

**Hook Configuration:**

```typescript
const hookConfig = {
  name: "autoTest",
  displayName: "Testing/Auto Test",
  description: "Runs tests automatically after chat is complete",
  afterChatCompletion: async (agent: Agent) => {
    const filesystem = agent.requireServiceByType(FileSystemService);
    const testingService = agent.requireServiceByType(TestingService);

    if (filesystem.isDirty(agent)) {
      agent.infoMessage("Working Directory was updated, running test suite...");
      await testingService.runTests("*", agent);
    }
  }
};
```

**Trigger Behavior:**

1. Hook fires after chat completion event
2. Checks filesystem for modifications via `filesystem.isDirty(agent)`
3. If modified, displays message "Working Directory was updated, running test suite..."
4. Executes all registered tests matching "*"
5. Reports pass/fail status for each test
6. On failures, offers auto-repair with timeout based on `maxAutoRepairs` configuration

**Configuration Impact:**

- Uses `agentDefaults.maxAutoRepairs` from the TestingService configuration
- Agent-level `testing.maxAutoRepairs` overrides service defaults
- Timeout is 30 seconds unless `repairCount > maxAutoRepairs` then undefined
- Integrates with agent's `handleInput()` for repair workflows

## State Management

### TestingState Class

Manages test state including results, repair count, and persistence.

```typescript
class TestingState implements AgentStateSlice<typeof serializationSchema> {
  name: string = "TestingState";
  serializationSchema: z.infer<typeof serializationSchema>;

  testResults: Record<string, TestResult> = {};
  repairCount: number = 0;
  maxAutoRepairs: number;

  constructor(readonly initialConfig: z.output<typeof TestingServiceConfigSchema>["agentDefaults"])

  reset(what: ResetWhat[]): void

  serialize(): z.output<typeof serializationSchema>
  deserialize(data: z.output<typeof serializationSchema>): void
  show(): string[]
}
```

**State Properties:**

- `testResults`: Record mapping test names to their results
- `repairCount`: Number of auto-repair attempts made
- `maxAutoRepairs`: Maximum allowed auto-repair attempts

**Serialization Schema:**

```typescript
const serializationSchema = z.object({
  testResults: z.record(z.string(), z.any()),
  repairCount: z.number(),
  maxAutoRepairs: z.number()
});
```

**State Display Method:**

The `show()` method returns formatted output:

```typescript
[
  "Test Results:",
  "[Test: name]: PASSED",
  "",  // Empty line between sections
  "Total Repairs: 2"
]
```

**State Lifecycle:**

1. **Initialization**: Created via `agent.initializeState(TestingState, config)` during `attach()`
2. **Snapshot**: Run tests update `testResults` and increment `repairCount`
3. **Persistence**: State serialized via `serialize()` for checkpoint recovery
4. **Restoration**: State deserialized via `deserialize(data)` from checkpoints
5. **Reset**: `reset(what)` method for selective state clearing
6. **UI Display**: `show()` method for formatted status output

## Services and Tools

### Plugin Services

**TokenRingService Implementation:**

- Implements `TokenRingService` interface
- Registered with application via `app.addServices(testingService)`
- Uses `agentDefaults` configuration merged with agent-specific settings via `deepMerge()`
- Provides `attach()` method for agent state initialization

## Dependencies

**Direct Dependencies:**

- `zod`: Runtime type validation for configuration schemas
- `@tokenring-ai/app`: Application framework and plugin system
- `@tokenring-ai/chat`: Chat functionality
- `@tokenring-ai/agent`: Agent framework and command system
- `@tokenring-ai/filesystem`: File system operations and shell command execution
- `@tokenring-ai/queue`: Queue utilities
- `@tokenring-ai/utility`: Utility classes including KeyedRegistry for resource management

**Development Dependencies:**

- `typescript`: TypeScript compilation
- `vitest`: Unit testing framework with watch mode and coverage support

## Package Structure

```
pkg/testing/
├── TestingService.ts                    # Core testing service implementation
├── TestingResource.ts                   # TestingResource interface definition
├── ShellCommandTestingResource.ts       # Shell command resource handler
├── schema.ts                            # Zod schemas for configuration
├── state/
│   └── testingState.ts                  # TestingState class for state management
├── commands/
│   └── test/
│       ├── list.ts                      # /test list subcommand
│       └── run.ts                       # /test run subcommand
├── chatCommands.ts                      # Chat command exports
├── hooks.ts                            # Hook exports
├── hooks/
│   └── autoTest.ts                      # autoTest hook implementation
├── plugin.ts                           # TokenRingPlugin definition
├── index.ts                            # Public exports
├── package.json                         # Package metadata and dependencies
├── vitest.config.ts                    # Vitest test configuration
└── tsconfig.json                        # TypeScript compiler configuration
```

## Development

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

## Best Practices

### Resource Configuration

1. **Use Descriptive Names**: Test resource names should clearly indicate their purpose
   ```typescript
   resources: {
     "lint-typescript": { type: "shell", command: "tsc --noEmit" },
     "test-unit": { type: "shell", command: "bun test" }
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
   const state = agent.getState(TestingState);
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

## Limitations

- Shell tests assume Unix-like environments (Windows paths and commands may need adjustments)
- Auto-repair quality depends on agent capabilities and configuration
- Filesystem modification detection requires proper integration with FileSystemService
- Only shell resource type is provided; custom resources can be implemented
- Repair prompts user but execution of remediation depends on user confirmation

## License

MIT License - see LICENSE file in package directory.

## Related Components

- **@tokenring-ai/filesystem**: Provides shell command execution via `execute` tool
- **@tokenring-ai/agent**: Agent framework for command execution and state management
- **@tokenring-ai/utility**: KeyedRegistry for resource management

## Version

Current version: 0.2.0
