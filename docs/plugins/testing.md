# Testing Plugin

Testing framework with auto-repair hooks and shell command testing capabilities.

## Overview

The `@tokenring-ai/testing` package provides testing functionality for the Token Ring ecosystem, enabling automated test execution with shell command testing resources and auto-repair capabilities when tests fail.

## Key Features

- **Shell Command Testing**: Execute shell commands as test cases
- **Auto-Repair Integration**: Automatically attempt repairs when tests fail
- **Test Resource Registry**: Register and manage multiple testing resources
- **State Management**: Maintain test results and repair count across sessions
- **Interactive Commands**: Chat commands for test execution and management

## Core Components

### TestingService

Central service that manages test resources and execution.

**Key Methods:**
- `registerResource(name, resource)`: Registers a testing resource
- `runTests(testPattern, agent)`: Executes tests matching the pattern
- `allTestsPassed(agent)`: Checks if all tests have passed
- `getAvailableResources()`: Lists registered test resource names

### TestingResource Interface

Abstract interface for test resources.

**Required Methods:**
- `runTest(agent)`: Executes the test and returns results
- `description`: Description of the testing resource

### TestResult

Standardized result format for test executions.

**Structure:**
```typescript
{
  startedAt: number;    // Timestamp when test started
  finishedAt: number;   // Timestamp when test finished
  passed: boolean;     // Whether test passed
  output?: string;     // Test output or error message
  error?: unknown;     // Error details if test failed
}
```

### ShellCommandTestingResource

Implementation for shell command testing.

**Configuration Options:**
- `name`: Unique identifier for the test
- `command`: Shell command to execute
- `workingDirectory`: Optional working directory
- `timeoutSeconds`: Optional timeout for command execution
- `description`: Optional description of the test

**Methods:**
- `runTest(agent)`: Executes the shell command and returns test results

## Tools

**test**: Executes registered tests

- Input schema validates test selection
- Returns test results with pass/fail status
- Includes command output in results

## Chat Commands

**/test**: Interactive command for test execution
- Subcommands: `run <test-pattern>` to execute tests
- Displays results in chat with pass/fail status
- Auto-repair prompt when tests fail

## Global Scripting Functions

When `@tokenring-ai/scripting` is available:

**test(name, agent)**: Runs a specific test
```bash
/var $result = test("my-test")
/echo Test result: $result.passed
```

**runTests(pattern)**: Runs tests matching a pattern
```bash
/var $results = runTests("*")
/echo All tests passed: $results.allPassed
```

## Configuration Options

### Testing Configuration

```typescript
{
  resources: Record<string, TestingResourceConfig>; // Registered test resources
  maxAutoRepairs: number; // Maximum auto-repair attempts (default: 5)
}
```

### Shell Command Test Configuration

```typescript
{
  type: "shell";
  name: string;
  command: string;
  workingDirectory?: string;
  timeoutSeconds?: number;
  description?: string;
}
```

## Usage Examples

### Registering a Shell Command Test

```typescript
import { Agent } from '@tokenring-ai/agent';
import { TestingService } from '@tokenring-ai/testing';
import { ShellCommandTestingResource } from './ShellCommandTestingResource';

const agent = new Agent();
const testingService = new TestingService({ maxAutoRepairs: 3 });
agent.registerService(testingService);

const testResource = new ShellCommandTestingResource({
  name: 'build-check',
  command: 'bun test',
  workingDirectory: './my-project',
  timeoutSeconds: 30
});

testingService.registerResource('build-check', testResource);
```

### Running Tests

```typescript
// Programmatic execution
await testingService.runTests('*', agent);

// Using the tool
const result = await agent.executeTool('test', { name: 'build-check' });

if (result.passed) {
  console.log('Test passed!');
} else {
  console.log('Test failed:', result.output);
}
```

### Interactive Chat Command

```bash
/test run build*
```

## Auto-Repair Flow

When tests fail, the plugin:
1. Displays failure report with test outputs
2. Asks for confirmation to attempt auto-repair
3. If confirmed, processes the failure report and attempts to fix issues
4. Tracks repair attempts and limits to `maxAutoRepairs`

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/filesystem`: Filesystem operations for shell commands
- `@tokenring-ai/queue`: Queue management
- `@tokenring-ai/utility`: Utility functions and registries

## Notes

- Test results are preserved in agent state for cross-session tracking
- Auto-repair functionality requires human confirmation after each failure
- Shell command tests support timeout configuration to prevent hanging processes
- Test resources can be registered dynamically based on configuration