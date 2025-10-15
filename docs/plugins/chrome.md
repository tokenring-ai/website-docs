# Chrome Plugin

Chrome browser automation utilities using Puppeteer for running scripts and capturing console output.

## Overview

The `@tokenring-ai/chrome` package provides Chrome browser automation utilities for the Token Ring ecosystem. It exposes a tool to run arbitrary Puppeteer scripts within a managed browser/page context and report results and console logs back through the chat service.

## Key Features

- **Puppeteer Integration**: Run JavaScript functions in a live Puppeteer session
- **Console Capture**: Collect page console output and custom logs
- **Navigation Support**: Optionally navigate to URLs before script execution
- **Timeout Control**: Configurable execution timeouts (5-180 seconds)
- **Result Reporting**: Returns function results, logs, and error status

## Core Components

### Tool: runPuppeteerScript

Runs a Puppeteer script with access to a browser and page.

**Parameters:**
- `script`: string - JavaScript code string that evaluates to an async function taking `({ page, browser, consoleLog })`
- `navigateTo?`: string - Optional URL to load before running the script
- `timeoutSeconds?`: number - Maximum execution time (min 5, max 180, default 30)

**Returns:**
```typescript
{
  ok: boolean;
  result: unknown;  // value your function resolves to
  logs: string[];   // collected console output and custom consoleLog messages
  error: unknown;   // error message if any
}
```

**Behavior:**
- Launches Chromium instance via Puppeteer with `headless: false`
- Evaluates script using `new Function` and immediately invokes it
- Captures page console messages with `[browser]` prefix
- Provides `consoleLog` helper for custom log lines
- Cleans up browser instance after execution

## Usage Example

```typescript
import { ServiceRegistry } from '@tokenring-ai/registry';
import * as runPuppeteerScript from '@tokenring-ai/chrome/tools/runPuppeteerScript';
import ChatService from '@tokenring-ai/chat/ChatService';

const registry = new ServiceRegistry();
registry.registerService(new ChatService());

// Define script as a string that evaluates to an async function
const script = `async ({ page, browser, consoleLog }) => {
  await page.goto('https://example.com', { waitUntil: 'load' });
  const title = await page.title();
  consoleLog('Page title is:', title);
  return { title };
}`;

const res = await runPuppeteerScript.execute({ script }, registry);
if (res.ok) {
  console.log('Result:', res.result);
  console.log('Logs:', res.logs);
} else {
  console.error('Error:', res.error);
}
```

## Configuration Options

- **script**: JavaScript function as string with signature `async ({ page, browser, consoleLog }) => any`
- **navigateTo**: Optional URL to navigate to before execution
- **timeoutSeconds**: Execution timeout (5-180 seconds, default 30)
- **headless**: Currently set to `false` by default (modify source to change)

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Agent integration
- `@tokenring-ai/registry`: Service registry
- `@tokenring-ai/chat`: Chat service for logging
- `puppeteer@^23.14.0`: Browser automation
- `zod@^4.0.17`: Schema validation

## Security Notes

- Scripts are evaluated using `new Function` and run with process privileges
- Only run trusted code as it executes with full system access
- Console messages from the page are collected and returned
- Use the provided `consoleLog` function for guaranteed log capture
