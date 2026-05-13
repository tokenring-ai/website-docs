# Vault Plugin

Secure encrypted vault for managing secrets and credentials with AES-256-GCM encryption, session management, and dual interface (CLI tool and TokenRing service).

## Overview

The `@tokenring-ai/vault` package provides a secure, encrypted vault for managing secrets and credentials. It works both as a standalone CLI tool and as a TokenRing service for programmatic access. The vault uses AES-256-GCM encryption with PBKDF2 key derivation for industry-standard security, and includes session management with password caching.

## Key Features

- **AES-256-GCM Encryption**: Industry-standard encryption for secrets at rest
- **Dual Interface**: CLI tool and TokenRing service
- **Environment Variable Injection**: Run commands with vault secrets as env vars
- **Secure Password Input**: Hidden password entry in terminal with raw mode support
- **Restrictive Permissions**: Vault files created with 0o600 (owner-only access)
- **Session Management**: Password caching during session for multiple operations
- **Commander CLI**: Full featured command-line interface with password masking
- **TokenRing Integration**: Seamless integration with TokenRing application framework
- **Service Architecture**: Plugin-based service registration and configuration
- **Chat Commands**: Integrated chat commands for agent interaction
- **Zod Configuration**: Type-safe configuration with schema validation
- **RPC Endpoints**: Remote procedure call support for vault operations
- **Comprehensive Testing**: Unit and integration tests with Vitest

## User Guide

### User Guide Overview

The vault package provides a secure, encrypted storage solution for managing secrets and credentials.

### User Components

#### VaultService Overview

The main service class for programmatic access to the vault. Implements the `TokenRingService` interface.

```typescript
import { VaultService } from '@tokenring-ai/vault';

const vault = new VaultService({
  vaultFile: '.vault',
  relockTime: 300000 // 5 minutes (optional)
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"VaultService"` | Service identifier |
| `description` | `"A vault service for storing persisted credentials"` | Service description |
| `options` | `ParsedVaultConfig` | Configuration options passed to constructor |
| `unlocked` | `boolean` | Whether the vault is currently unlocked |

### Chat Commands

Integrated chat commands for agent interaction, defined in `commands.ts` and located in `commands/vault/`:

| Command | Description |
|---------|-------------|
| `/vault unlock` | Unlock the vault with password prompt |
| `/vault lock` | Lock the vault, clearing cached credentials |
| `/vault list` | List all credential keys stored in the vault |
| `/vault store <key> <value>` | Store a credential in the vault (format: `category.key`) |

### Tools

The vault package does not define any MCP tools.

### User Configuration

#### Plugin Configuration

The plugin configuration options are defined in `schema.ts` and `plugin.ts`.

```typescript
import vaultPlugin from '@tokenring-ai/vault';
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp();
app.usePlugin(vaultPlugin, {
  vault: {
    vaultFile: '.vault',
    relockTime: 300000
  }
});
```

#### Plugin Configuration Schema

The plugin uses Zod for type-safe configuration validation:

```typescript
const packageConfigSchema = z.object({
  vault: VaultConfigSchema.exactOptional()
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vault` | `VaultConfig` | `undefined` | Optional vault configuration object |

#### VaultConfig Schema

```typescript
const VaultConfigSchema = z.object({
  vaultFile: z.string().min(1),
  relockTime: z.number().exactOptional()
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vaultFile` | `string` | Required | Path to the vault file |
| `relockTime` | `number` | Optional | Time in milliseconds before automatic relock (default: not set) |

### User Integration

#### TokenRing Application Integration

Install the vault plugin with configuration:

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import vaultPlugin from '@tokenring-ai/vault';

const app = new TokenRingApp();
app.usePlugin(vaultPlugin, {
  vault: {
    vaultFile: '.vault',
    relockTime: 300000
  }
});

// Access the service after plugin installation
const vaultService = app.getService<VaultService>('VaultService');
```

**Note:** The plugin only installs the `VaultService` and registers chat commands if the `vault` configuration is provided.

#### Agent Integration

Use the vault service directly with an Agent:

```typescript
import { Agent } from '@tokenring-ai/agent';
import { VaultService } from '@tokenring-ai/vault';

const agent = new Agent({
  services: [
    new VaultService({
      vaultFile: '.vault',
      relockTime: 300000
    })
  ]
});

// Access vault through agent
const vault = agent.getService<VaultService>('VaultService');
await vault.unlock(agent);
const apiKey = vault.requireItem('api', 'OPENAI_KEY');
```

#### Password Configuration

The vault plugin supports multiple password sources:

1. **Environment Variable**: Set `TR_VAULT_PASSWORD` environment variable
2. **Secrets Manager**: Reads from Bun secrets with service `tokenring` and name `vault-password`
3. **Interactive Prompt**: Prompts at startup if no password is configured

```bash
# Using environment variable
export TR_VAULT_PASSWORD="my-secret-password"
bun run app

# Or in .env file
TR_VAULT_PASSWORD=my-secret-password
```

### User Usage Examples

#### CLI Workflow

```bash
# Initialize vault
vault init -f .production.vault

# Store production secrets
vault -f .production.vault set api.OPENAI_KEY sk-prod-...
vault -f .production.vault set env.DATABASE_URL postgres://...

# List stored keys
vault -f .production.vault list

# Run application with secrets
vault -f .production.vault run node server.js
```

#### TokenRing Service Usage

```typescript
import { Agent } from '@tokenring-ai/agent';
import { VaultService } from '@tokenring-ai/vault';

const agent = new Agent({
  services: [
    new VaultService({
      vaultFile: '.vault',
      relockTime: 300000
    })
  ]
});

// Access vault through agent
const vault = agent.getService<VaultService>('VaultService');
await vault.unlock(agent);
const apiKey = vault.requireItem('api', 'OPENAI_KEY');

// Or use chat commands
// /vault unlock
// /vault list
// /vault store api.OPENAI_KEY sk-1234567890
```

#### Environment Variable Injection

```typescript
await vault.setItem('env', 'API_KEY', 'secret_value');
vault.injectEnv();
console.log(process.env.API_KEY); // 'secret_value'
```

### User Best Practices

#### Security Best Practices

- Use strong, unique passwords for vault encryption
- Store vault files in secure locations
- Don't commit vault files to version control
- Use `.gitignore` to exclude vault files
- Rotate secrets regularly
- Use different vaults for different environments
- Never log or expose vault passwords in error messages

#### Session Management

- Password is cached during the session for multiple operations
- Call `lock()` explicitly when done with sensitive operations
- Consider `relockTime` based on security requirements if using automatic relocking

#### Configuration

- Validate configuration using the provided Zod schemas
- Use appropriate `relockTime` values for your use case
- Store vault files in secure, non-public directories
- Use environment-specific vault files for different deployments

## Developer Reference

### Developer Overview

This section provides detailed technical documentation for developers integrating the vault package.

### Developer Core Components

#### VaultService Implementation

The main service class for programmatic access to the vault. Implements `TokenRingService`.

```typescript
import { VaultService } from '@tokenring-ai/vault';
import type { ParsedVaultConfig } from '@tokenring-ai/vault/schema';

const vault = new VaultService({
  vaultFile: '.vault',
  relockTime: 300000
} satisfies ParsedVaultConfig);
```

#### Service Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"VaultService"` | Service identifier |
| `description` | `"A vault service for storing persisted credentials"` | Service description |
| `options` | `ParsedVaultConfig` | Configuration options passed to constructor |
| `unlocked` | `boolean` | Whether the vault is currently unlocked |

#### Service Methods

##### `start(): Promise<void>`

Starts the vault service. Initializes the vault if a password is available via environment variable or secrets manager.

```typescript
const vaultService = new VaultService({ vaultFile: '.vault', relockTime: 300000 });
await vaultService.start();
```

**Returns:** `Promise<void>`

##### `unlock(agent?: Agent): Promise<VaultFileData>`

Unlocks the vault by prompting for the password (if not already unlocked), decrypts the vault file, and returns the data. If the vault is already unlocked, returns the cached data.

```typescript
const vaultService = agent.getService<VaultService>('VaultService');
const data = await vaultService.unlock(agent);
console.log(Object.keys(data.entries)); // List of categories
```

**Parameters:**

- `agent` (`Agent`): Optional Agent instance used for human interaction prompts, such as password entry.

**Returns:** `Promise<VaultFileData>` - The decrypted vault data

**Throws:** Error if password is empty or decryption fails

##### `lock(): void`

Locks the vault, clearing all cached data and session password. The vault must be re-unlocked to access secrets.

```typescript
vaultService.lock();
```

**Returns:** `void`

##### `save(modifications: VaultEntryUpdate[]): Promise<void>`

Writes the updated vault data to the vault file, re-encrypting it with the current session password.

```typescript
await vaultService.save([{ category: 'api', key: 'my_key', value: 'my_value' }]);
```

**Parameters:**

- `modifications` (`VaultEntryUpdate[]`): Array of updates to apply before saving.

**Returns:** `Promise<void>`

**Throws:** Error if vault is not unlocked (no session password)

##### `setItem(category: string, key: string, value: string): Promise<void>`

Sets a secret value in the vault. Automatically saves the changes.

```typescript
await vaultService.setItem('api', 'OPENAI_KEY', 'sk-1234567890');
```

**Parameters:**

- `category` (`string`): The category for the secret.
- `key` (`string`): The secret key within the category.
- `value` (`string`): The value to store.

**Returns:** `Promise<void>`

##### `setJsonItem(category: string, key: string, value: unknown): Promise<void>`

Sets a JSON-serialized value in the vault.

```typescript
await vaultService.setJsonItem('config', 'settings', { timeout: 30, retries: 3 });
```

**Parameters:**

- `category` (`string`): The category for the secret.
- `key` (`string`): The secret key within the category.
- `value` (`unknown`): The value to store (will be JSON-serialized).

**Returns:** `Promise<void>`

##### `deleteItem(category: string, key: string, agent?: Agent): Promise<void>`

Deletes a secret from the vault.

```typescript
await vaultService.deleteItem('api', 'OLD_KEY', agent);
```

**Parameters:**

- `category` (`string`): The category for the secret.
- `key` (`string`): The secret key within the category.
- `agent` (`Agent`): Optional Agent instance for interaction.

**Returns:** `Promise<void>`

##### `requireItem(category: string, key: string): string`

Retrieves a secret value by key. Throws if the vault is locked or the item does not exist.

```typescript
const apiKey = vaultService.requireItem('api', 'OPENAI_KEY');
console.log(`API Key: ${apiKey}`);
```

**Parameters:**

- `category` (`string`): The category for the secret.
- `key` (`string`): The secret key within the category.

**Returns:** `string` - The secret value

**Throws:** Error if vault is locked or item does not exist

##### `requireJsonItem<T>(category: string, key: string, schema: z.ZodType<T>): T`

Retrieves and parses a JSON-serialized value from the vault.

```typescript
const config = vaultService.requireJsonItem('config', 'settings', z.object({
  timeout: z.number(),
  retries: z.number()
}));
```

**Parameters:**

- `category` (`string`): The category for the secret.
- `key` (`string`): The secret key within the category.
- `schema` (`z.ZodType<T>`): Zod schema to parse and validate the value.

**Returns:** `T` - The parsed value

**Throws:** Error if parsing fails or item does not exist

##### `injectEnv(): void`

Injects all secrets in the `env` category into process environment variables.

```typescript
await vaultService.setItem('env', 'API_KEY', 'secret_value');
vaultService.injectEnv();
console.log(process.env.API_KEY); // 'secret_value'
```

**Returns:** `void`

##### `setPassword(password: string): void`

Sets the session password for the vault.

```typescript
vaultService.setPassword('my-secret-password');
await vaultService.unlock();
```

**Parameters:**

- `password` (`string`): The password to use for encryption/decryption.

**Returns:** `void`

### Developer Services

#### VaultService Service

The main service class for programmatic access to the vault. Implements `TokenRingService`.

See **Developer Core Components** section above for detailed documentation.

### Provider Documentation

This package does not use a provider-based architecture. The `VaultService` is directly instantiated and registered with the TokenRing application framework.

### RPC Endpoints

The vault package provides RPC endpoints for remote vault operations.

#### Endpoint Path: `/rpc/vault`

##### `listEntries()`

Lists all entries in the vault as a flat key-value map.

- **Type:** Query
- **Input:** `{}`
- **Result:** `Record<string, string>` - Map of `category.key` to values

**Example:**

```typescript
import { rpcClient } from '@tokenring-ai/rpc';

const entries = await rpcClient.call('/rpc/vault', 'listEntries', {});
console.log(entries); // { 'api.OPENAI_KEY': 'sk-...', 'env.API_URL': 'https://...' }
```

##### `setItems({ updates })`

Sets multiple items in the vault.

- **Type:** Mutation
- **Input:** `{ updates: Array<{ category: string, key: string, value: string }> }`
- **Result:** `{ success: boolean, message: string }`

**Example:**

```typescript
const result = await rpcClient.call('/rpc/vault', 'setItems', {
  updates: [
    { category: 'api', key: 'OPENAI_KEY', value: 'sk-123' },
    { category: 'api', key: 'ANTHROPIC_KEY', value: 'sk-456' }
  ]
});
console.log(result); // { success: true, message: 'Saved 2 item(s)' }
```

##### `deleteItems({ updates })`

Deletes multiple items from the vault.

- **Type:** Mutation
- **Input:** `{ updates: Array<{ category: string, key: string }> }`
- **Result:** `{ success: boolean, message: string }`

**Example:**

```typescript
const result = await rpcClient.call('/rpc/vault', 'deleteItems', {
  updates: [
    { category: 'api', key: 'OLD_KEY' }
  ]
});
console.log(result); // { success: true, message: 'Deleted 1 item(s)' }
```

### Developer Chat Commands

The vault package provides integrated chat commands for managing credentials within the agent interface. These commands are automatically registered when the vault plugin is installed and the `AgentCommandService` is available.

#### `/vault unlock`

Unlock the vault with a password prompt.

**Example:**

```bash
/vault unlock
```

**Response:** "Vault unlocked successfully"

#### `/vault lock`

Lock the vault, clearing all cached data and session password.

**Example:**

```bash
/vault lock
```

**Response:** "Vault locked"

#### `/vault list`

List all credential keys stored in the vault.

**Example:**

```bash
/vault list
```

**Response:**

- If empty: "Vault is empty"
- If has keys: "Vault credentials:\n- category.key1\n- category.key2\n- category.key3"

**Implementation:** Uses `markdownList` utility from `@tokenring-ai/utility` to format the output.

#### `/vault store <key> <value>`

Store a credential in the vault. The key must be in the format `category.key`.

**Arguments:**

- `key`: The credential key in format `category.key` (e.g., `api.OPENAI_KEY`)
- `value`: The credential value

**Example:**

```bash
/vault store api.OPENAI_KEY sk-1234567890
```

**Response:** "Stored credential: api.OPENAI_KEY"

**Implementation:** Validates that the key contains a category and key separated by a dot.

### Developer Usage Examples

#### Complete Chat Command Workflow

```bash
/vault unlock
/vault list
/vault store api.OPENAI_KEY sk-1234567890
/vault list
/vault lock
```

#### RPC Usage Example

```typescript
import { rpcClient } from '@tokenring-ai/rpc';

// List all entries
const entries = await rpcClient.call('/rpc/vault', 'listEntries', {});

// Set multiple items
await rpcClient.call('/rpc/vault', 'setItems', {
  updates: [
    { category: 'api', key: 'OPENAI_KEY', value: 'sk-123' },
    { category: 'env', key: 'API_URL', value: 'https://api.example.com' }
  ]
});

// Delete an item
await rpcClient.call('/rpc/vault', 'deleteItems', {
  updates: [
    { category: 'api', key: 'OLD_KEY' }
  ]
});
```

### Testing and Development

#### Testing

The package includes Vitest configuration for testing:

```typescript
// vitest.config.ts
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

Run tests:

```bash
bun run test
bun run test:watch
bun run test:coverage
```

#### Test Structure

The package includes comprehensive tests using Vitest:

- **Unit Tests:**
  - `test/vault.unit.test.ts` - Core encryption/decryption functions (`deriveKey`, `encrypt`, `decrypt`, `readVault`, `writeVault`, `initVault`)
  - `test/vault-service.unit.test.ts` - `VaultService` methods and session management
  - `test/plugin.unit.test.ts` - Plugin installation and configuration validation
  - `test/test-utils.ts` - Test utilities including `createTempFile()` for isolated test vaults

- **Integration Tests:**
  - `test/cli.integration.test.ts` - CLI command integration tests using `spawn` to run actual CLI commands

#### Package Structure

```text
pkg/vault/
├── cli.ts                   # CLI implementation with Commander
├── index.ts                 # Package exports
├── plugin.ts                # TokenRing plugin integration
├── VaultService.ts          # TokenRing service implementation
├── vault.ts                 # Core encryption and file operations
├── schema.ts                # Zod configuration schema
├── commands.ts              # Chat command router
├── commands/
│   └── vault/
│       ├── list.ts          # /vault list command
│       ├── lock.ts          # /vault lock command
│       ├── store.ts         # /vault store command
│       └── unlock.ts        # /vault unlock command
├── rpc/
│   ├── schema.ts            # RPC schema definition
│   └── vault.ts             # RPC endpoint implementation
├── test/
│   ├── cli.integration.test.ts
│   ├── plugin.unit.test.ts
│   ├── test-utils.ts
│   ├── vault-service.unit.test.ts
│   └── vault.unit.test.ts
├── vitest.config.ts         # Vitest configuration
├── LICENSE                  # MIT license
├── package.json             # Package configuration
└── README.md                # Package documentation
```

#### Development Commands

```bash
bun run build          # Type-check with TypeScript
bun run test           # Run tests once
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage report
```

#### Test Utilities

The `test-utils.ts` file provides helper functions for testing:

```typescript
// createTempFile() - Creates a temporary directory for isolated test vaults
const tempDir = createTempFile();
const tempVaultFile = `${tempDir}/test.vault`;

// Clean up after tests
await fs.remove(tempDir);
```

### Schema Definitions

#### VaultFileSchema

The structure of the vault file:

```typescript
const VaultFileSchema = z.object({
  vaultVersion: z.number().default(1),
  entries: z.record(z.string().min(1), z.record(z.string().min(1), z.string())),
});
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `vaultVersion` | `number` | Schema version (currently 1) |
| `entries` | `Record<string, Record<string, string>>` | Category-key-value structure |

**Example:**

```json
{
  "vaultVersion": 1,
  "entries": {
    "env": {
      "API_KEY": "secret_value",
      "API_URL": "https://api.example.com"
    },
    "api": {
      "OPENAI_KEY": "sk-1234567890",
      "ANTHROPIC_KEY": "sk-abcdef123456"
    }
  }
}
```

#### VaultEntryUpdateSchema

For updating vault entries:

```typescript
const VaultEntryUpdateSchema = z.object({
  category: z.string().min(1),
  key: z.string().min(1),
  value: z.string().min(1),
});
```

#### VaultEntryDeleteSchema

For deleting vault entries:

```typescript
const VaultEntryDeleteSchema = z.object({
  category: z.string().min(1),
  key: z.string().min(1),
});
```

### Error Handling

The package provides comprehensive error handling:

- **Invalid Password**: Throws error when decryption fails due to wrong password
- **Corrupted Vault**: Detects and reports corrupted vault files
- **File Permission Errors**: Handles issues with file access permissions
- **Configuration Errors**: Validates configuration schema with Zod
- **Session Errors**: Handles invalid session management attempts (e.g., saving without unlocking)
- **Environment Variable Errors**: Proper handling of injection failures in CLI `run` command
- **Empty Password**: Throws error when password input is empty or cancelled

#### Common Errors

```typescript
try {
  vaultService.requireItem('api', 'OPENAI_KEY');
} catch (error) {
  if (error.message.includes('Vault is uninitialized or locked')) {
    console.error('Vault must be unlocked first');
    await vaultService.unlock(agent);
  } else if (error.message.includes('does not exist')) {
    console.error('Secret not found in vault');
  }
}
```

### State Management

The VaultService maintains internal state for:

- `vaultData`: Cached decrypted vault data
- `sessionPassword`: Cached password for the current session
- `unlocked`: Boolean indicating if vault is currently unlocked

#### Session Password Caching

Once unlocked, the password is cached in memory for the duration of the session. This allows multiple operations without re-prompting for the password. The password is cleared when:

- `lock()` is called explicitly
- The service is restarted

#### Environment Variable Injection State

The `injectEnv()` method injects all secrets in the `env` category into `process.env`. This is useful for applications that expect secrets in environment variables.

```typescript
await vaultService.setItem('env', 'API_KEY', 'secret_value');
vaultService.injectEnv();
// process.env.API_KEY is now 'secret_value'
```

## Dependencies

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | `0.2.0` | TokenRing application framework |
| `@tokenring-ai/agent` | `0.2.0` | Agent orchestration system |
| `@tokenring-ai/utility` | `0.2.0` | Shared utilities |
| `@tokenring-ai/rpc` | `0.2.0` | RPC framework |
| `@types/fs-extra` | `^11.0.4` | Type definitions for fs-extra |
| `commander` | `^14.0.3` | CLI framework |
| `fs-extra` | `^11.3.4` | Enhanced file system operations |
| `zod` | `^4.3.6` | Schema validation |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | `^4.1.1` | Testing framework |
| `typescript` | `^6.0.2` | TypeScript compiler |

## Related Components

- **@tokenring-ai/agent** - Agent system that integrates with `VaultService`
- **@tokenring-ai/app** - Application framework with plugin system
- **@tokenring-ai/rpc** - RPC framework for remote vault operations
- **@tokenring-ai/utility** - Utility functions including `markdownList` for command output

## License

MIT License - see `LICENSE` file for details.
