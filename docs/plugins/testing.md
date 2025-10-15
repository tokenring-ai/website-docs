# Testing Plugin

Testing framework for agents with resources, service for execution, and auto-repair hooks.

## Overview

The `@tokenring-ai/testing` package provides a comprehensive testing framework for AI agents within the TokenRing AI ecosystem. It enables automated and manual testing of codebases, integration with shell commands for executing tests, AI-assisted code repair for failing tests, and hooks for seamless integration into agent workflows.

## Key Features

- **Testing Resources**: Pluggable components for defining and running tests
- **Service Layer**: Central `TestingService` to manage and execute tests
- **Chat Commands**: Interactive `/test` and `/repair` commands
- **Automation Hooks**: Automatic test execution and repair queuing
- **Repair Agent**: AI agent specialized in diagnosing and fixing test failures
- **Shell Integration**: Execute tests via shell commands with timeout support

## Core Components

### TestingService

Central hub for test execution that registers pluggable `TestingResource` instances.

**Key Methods:**
- `registerResource(resource, name)`: Registers a testing resource
- `runTests({ names? }, agent)`: Runs specified (or all active) tests
  - Returns: Object mapping resource names to `TestResult`
- `getLatestTestResults()`: Retrieves most recent results
- `allTestsPassed(agent)`: Checks if all active tests passed
- `enableResources(names)`: Activates specific resources
- `getAvailableResources()`: Lists all registered resources

### TestingResource (Abstract)

Base class for defining custom test implementations.

**Key Methods:**
- `runTest(agent)`: Executes the test and returns result
  - `TestResult`: `{ startedAt, finishedAt, passed, output?, error? }`
- `_runTest(agent)`: Abstract method to implement test logic
- `getLatestTestResult()`: Gets last run result

### ShellCommandTestingResource

Concrete implementation that runs shell commands as tests.

**Constructor Options:**
```typescript
{
  name: string;
  description?: string;
  workingDirectory?: string;
  command: string;
  timeoutSeconds?: number;  // Default: 60
}
```

**Behavior:**
- Uses `@tokenring-ai/filesystem/tools/runShellCommand`
- Passes if `ok: true`
- Throws error with stdout/stderr on failure

### Chat Commands

**/test [test_name|all]**: Run tests
- Lists available tests if no args
- Runs specific tests or all
- Reports pass/fail

**/repair [--modify code|test|either] [test_name|all]**: AI-assisted repair
- Runs tests, then uses AI to repair failures
- `--modify` specifies what to fix:
  - `code`: Fix implementation
  - `test`: Fix test
  - `either`: AI decides (default)
- Enqueues AI chat with repair prompt

### Hooks

**autoTest (afterChatComplete)**: Triggers after agent chat if filesystem is dirty
- Runs all tests across services
- Logs pass/fail

**autoRepair (afterTesting)**: Triggers after testing if failures exist
- Enqueues repair tasks to `WorkQueueService`
- Includes checkpoint and failure details

### Repair Agent

AI agent config for autonomous code repair with specialized system prompt for analyzing failures and fixing code.

## Usage Examples

### Registering and Running Tests

```typescript
import TestingService from '@tokenring-ai/testing/TestingService';
import ShellCommandTestingResource from '@tokenring-ai/testing/ShellCommandTestingResource';
import { Agent } from '@tokenring-ai/agent';

const testingService = new TestingService();
const shellResource = new ShellCommandTestingResource({
  name: 'build-test',
  command: 'npm run build',
});
testingService.registerResource(shellResource, 'build-test');
testingService.enableResources(['build-test']);

const agent = new Agent(/* config */);
const results = await testingService.runTests({}, agent);
console.log(results['build-test'].passed ? 'Build passed!' : 'Build failed');
```

### Using Chat Commands

```bash
/test all
# Runs all enabled tests and displays results

/repair --modify code npm-test
# Runs tests and uses AI to fix failing code
```

### Auto-Repair Workflow

After file changes in chat, hooks automatically test. If failures occur, repair tasks are queued for AI processing.

## Configuration Options

- **Resource Registration**: Enable via `enableResources(names)` in `TestingService`
- **Shell Commands**: Customize `command`, `workingDirectory`, `timeoutSeconds` per resource
- **Repair Mode**: Use `--modify` flag in `/repair` to control fix target
- **Hooks**: Enabled by default in package

## Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/filesystem`: File operations and shell execution
- `@tokenring-ai/utility`: Registry utilities
- `@tokenring-ai/ai-client`: AI chat and service integration
- `@tokenring-ai/queue`: Work queue for repair tasks
