# Vault Plugin

Secure encrypted vault for managing secrets and credentials with AES-256-GCM encryption, session management, and dual interface (CLI tool and TokenRing service).

## Overview

The `@tokenring-ai/vault` package provides a secure, encrypted vault for managing secrets and credentials. It works both as a standalone CLI tool and as a TokenRing service for programmatic access. The vault uses AES-256-GCM encryption with PBKDF2 key derivation for industry-standard security, and includes session management with automatic locking.

## Key Features

- **AES-256-GCM Encryption**: Industry-standard encryption for secrets at rest
- **Dual Interface**: CLI tool and TokenRing service
- **Environment Variable Injection**: Run commands with vault secrets as env vars
- **Secure Password Input**: Hidden password entry in terminal with raw mode support
- **Restrictive Permissions**: Vault files created with 0o600 (owner-only access)
- **Session Management**: Automatic locking and password caching during session
- **Commander CLI**: Full featured command-line interface with password masking
- **TokenRing Integration**: Seamless integration with TokenRing application framework
- **Service Architecture**: Plugin-based service registration and configuration
- **Chat Commands**: Integrated chat commands for agent interaction (/vault unlock, lock, list, store, get)
- **Automatic Relocking**: Vault automatically locks after 5 minutes of inactivity
- **Zod Configuration**: Type-safe configuration with schema validation
- **Comprehensive Testing**: Unit and integration tests with Vitest

## Core Components

### VaultService

The main service class for programmatic access to the vault. Implements the `TokenRingService` interface.

**Constructor:**
```typescript
constructor(options: ParsedVaultConfig)
```

**Properties:**
- `name`: `"VaultService"` - The service identifier
- `description`: `"A vault service for storing persisted credentials"` - Service description
- `options`: `ParsedVaultConfig` - The configuration options passed to the constructor

**Methods:**
- `unlockVault(agent: Agent): Promise<Record<string, string>>` - Unlocks the vault and returns decrypted data
- `lock(): Promise<void>` - Locks the vault and clears cached data
- `getItem(key: string, agent: Agent): Promise<string | undefined>` - Retrieves a secret by key
- `setItem(key: string, value: string, agent: Agent): Promise<void>` - Stores a secret
- `save(vaultData: Record<string, string>, agent: Agent): Promise<void>` - Saves vault data

### Vault Core Functions

Direct vault file manipulation functions exported from `vault.ts`:

- `initVault(vaultFile: string, password: string): Promise<void>` - Initialize a new vault
- `readVault(vaultFile: string, password: string): Promise<Record<string, string>>` - Read vault contents
- `writeVault(vaultFile: string, password: string, data: Record<string, string>): Promise<void>` - Write vault contents
- `deriveKey(password: string, salt: Buffer): Buffer` - Derive encryption key from password
- `encrypt(data: string, password: string): string` - Encrypt data using AES-256-GCM
- `decrypt(encryptedData: string, password: string): string` - Decrypt data using AES-256-GCM

### Chat Commands

Integrated chat commands for agent interaction, defined in `commands.ts` and located in `commands/vault/`:

- `/vault unlock` - Unlock the vault with password
- `/vault lock` - Lock the vault
- `/vault list` - List all credential keys in the vault
- `/vault store <key>` - Store a credential in the vault
- `/vault get <key>` - Retrieve and display a credential from the vault

### CLI Commands

Standalone command-line interface commands built with Commander:

- `vault init` - Initialize a new encrypted vault file
- `vault get <key>` - Retrieve a secret value by key
- `vault set <key> <value>` - Store a secret value
- `vault list` - List all secret keys (not values) stored in the vault
- `vault remove <key>` - Remove a secret by key
- `vault change-password` - Change the vault encryption password
- `vault run <command> [args...]` - Run a command with vault secrets as environment variables

## Services

### VaultService

The main service class for programmatic access to the vault. Implements `TokenRingService`.

```typescript
import { VaultService } from '@tokenring-ai/vault';

const vault = new VaultService({
  vaultFile: '.vault',
  relockTime: 300000 // 5 minutes
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service identifier ("VaultService") |
| `description` | string | Service description |
| `options` | ParsedVaultConfig | Configuration options passed to constructor |

#### Methods

##### `unlockVault(agent: Agent): Promise<Record<string, string>>`

Unlocks the vault by prompting for the password (if not already unlocked), decrypts the vault file, and returns the data. If the vault is already unlocked, returns the cached data.

```typescript
const data = await vault.unlockVault(agent);
```

**Parameters:**
- `agent` (Agent): The Agent instance used for human interaction prompts, such as password entry via `askForText` with masked input.

**Returns:** `Promise<Record<string, string>>` - The decrypted vault data.

**Throws:** 
- Error if password is empty or cancelled
- Error if decryption fails (invalid password or corrupted vault file)

**Implementation Details:**
- Uses `agent.askForText()` with `masked: true` for secure password input
- Caches session password to avoid repeated prompts
- Automatically initializes new vault if file doesn't exist
- Schedules automatic relock after configured timeout

##### `lock(): Promise<void>`

Locks the vault, clearing all cached data and session password.

```typescript
await vault.lock();
```

**Returns:** `Promise<void>`

**Implementation Details:**
- Clears `vaultData` cache
- Clears `sessionPassword`
- Cancels any pending relock timer

##### `getItem(key: string, agent: Agent): Promise<string | undefined>`

Retrieves a secret value by key. Automatically unlocks the vault if needed.

```typescript
const apiKey = await vault.getItem('API_KEY', agent);
```

**Parameters:**
- `key` (string): The secret key to retrieve.
- `agent` (Agent): Agent instance for interaction.

**Returns:** `Promise<string | undefined>` - The secret value or undefined if not found.

**Implementation Details:**
- Calls `unlockVault()` internally to ensure vault is unlocked
- Returns undefined if key doesn't exist (no error thrown)

##### `setItem(key: string, value: string, agent: Agent): Promise<void>`

Updates the vault with a new key-value pair, saving the changes. Automatically unlocks the vault if needed.

```typescript
await vault.setItem('API_KEY', 'sk-1234567890', agent);
```

**Parameters:**
- `key` (string): The secret key to set.
- `value` (string): The value to store for the key.
- `agent` (Agent): Agent instance for interaction.

**Returns:** `Promise<void>`

**Implementation Details:**
- Calls `unlockVault()` internally to ensure vault is unlocked
- Updates the vault data in memory
- Calls `save()` to persist changes
- Re-encrypts vault file with session password

##### `save(vaultData: Record<string, string>, agent: Agent): Promise<void>`

Writes the updated vault data to the vault file, re-encrypting it with the current session password.

```typescript
await vault.save({ API_KEY: 'new-key' }, agent);
```

**Parameters:**
- `vaultData` (`Record<string, string>`): The updated vault data to save.
- `agent` (Agent): Agent instance for interaction.

**Returns:** `Promise<void>`

**Throws:** Error if vault is not unlocked (no session password).

**Implementation Details:**
- Requires vault to be unlocked (session password must exist)
- Encrypts data using AES-256-GCM
- Writes file with 0o600 permissions (owner read/write only)
- Updates internal `vaultData` cache

## Provider Documentation

This package does not use a provider-based architecture. The `VaultService` is directly instantiated and registered with the TokenRing application framework.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

The vault package provides integrated chat commands for managing credentials within the agent interface. These commands are automatically registered when the vault plugin is installed and the `AgentCommandService` is available.

### `/vault unlock`

Unlock the vault with a password prompt.

**Example:**
```
/vault unlock
```

**Response:** "Vault unlocked successfully"

### `/vault lock`

Lock the vault, clearing all cached data and session password.

**Example:**
```
/vault lock
```

**Response:** "Vault locked"

### `/vault list`

List all credential keys stored in the vault.

**Example:**
```
/vault list
```

**Response:** 
- If empty: "Vault is empty"
- If has keys: "Vault credentials:\n- key1\n- key2\n- key3"

**Implementation:** Uses `markdownList` utility from `@tokenring-ai/utility` to format the output.

### `/vault store <key>`

Store a credential in the vault. Prompts securely for the value using masked input.

**Example:**
```
/vault store api_key
```

**Response:** 
- Success: "Stored credential: api_key"
- Cancelled: "Store cancelled"

**Implementation:** Uses `agent.askForText()` with `masked: true` for secure password entry.

### `/vault get <key>`

Retrieve and display a credential from the vault.

**Example:**
```
/vault get api_key
```

**Response:** 
- Found: `"api_key: <value>"`
- Not found: Error `"Credential 'api_key' not found in vault"`

**Implementation:** Throws `CommandFailedError` if key is not found or if no key is provided.

**Complete example usage:**
```
/vault unlock
/vault list
/vault store api_key
/vault get api_key
/vault lock
```

## Configuration

### Plugin Configuration

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
  vault: VaultConfigSchema.optional()
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vault` | `VaultConfig` | `undefined` | Optional vault configuration object |

#### VaultConfig Schema

```typescript
const VaultConfigSchema = z.object({
  vaultFile: z.string().min(1),
  relockTime: z.number().positive().default(300 * 1000),
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vaultFile` | `string` | Required | Path to the vault file |
| `relockTime` | `number` | `300000` | Time in milliseconds before the vault automatically locks (default: 5 minutes) |

### Service Configuration

The `VaultService` accepts configuration options through its constructor, validated by the `VaultConfigSchema`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vaultFile` | string | Required | Path to the vault file |
| `relockTime` | number | `300000` | Time in milliseconds before the vault automatically locks |

**Example:**
```typescript
new VaultService({
  vaultFile: '.vault',
  relockTime: 300000 // 5 minutes
});
```

## Integration

### TokenRing Application Integration

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

### Agent Integration

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
const apiKey = await vault.getItem('API_KEY', agent);
```

### Chat Command Integration

Chat commands are automatically registered when:
1. The vault plugin is installed with configuration
2. The `AgentCommandService` is available

The plugin uses `app.waitForService()` to wait for the `AgentCommandService` before registering commands:

```typescript
app.waitForService(AgentCommandService, commandService => {
  commandService.addAgentCommands(agentCommands)
})
```

Commands are defined in `commands.ts` and import individual command modules from `commands/vault/`:
- `get.ts` - `/vault get` command
- `list.ts` - `/vault list` command
- `lock.ts` - `/vault lock` command
- `store.ts` - `/vault store` command
- `unlock.ts` - `/vault unlock` command

### Service Registration Pattern

The plugin registers the `VaultService` using the standard TokenRing service registration:

```typescript
app.addServices(new VaultService(config.vault))
```

Commands use `agent.requireServiceByType(VaultService)` to access the service:

```typescript
const value = await agent.requireServiceByType(VaultService).getItem(key, agent);
```

## Usage Examples

### CLI Workflow

```bash
# Initialize vault
vault init -f .production.vault

# Store production secrets
vault -f .production.vault set DATABASE_URL postgres://...
vault -f .production.vault set API_KEY sk-prod-...
vault -f .production.vault set JWT_SECRET random-secret

# List stored keys
vault -f .production.vault list

# Run application with secrets
vault -f .production.vault run -- node server.js
```

### TokenRing Service Usage

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
const apiKey = await vault.getItem('API_KEY', agent);

// Or use chat commands
// /vault unlock
// /vault get API_KEY
```

### Direct Vault Access

```typescript
import { readVault, writeVault, initVault, deriveKey, encrypt, decrypt } from '@tokenring-ai/vault/vault';
import crypto from 'crypto';

// Initialize new vault
await initVault('.vault', 'myPassword');

// Read vault contents
const data = await readVault('.vault', 'myPassword');

// Write vault contents
await writeVault('.vault', 'myPassword', { API_KEY: 'value' });

// Derive encryption key
const salt = crypto.randomBytes(16);
const key = deriveKey('myPassword', salt);

// Encrypt data
const encrypted = encrypt('sensitive data', 'myPassword');

// Decrypt data
const decrypted = decrypt(encrypted, 'myPassword');
```

### Environment Variable Pattern

```bash
# Store all environment variables
vault set NODE_ENV production
vault set PORT 3000
vault set DATABASE_URL postgres://localhost/mydb
vault set REDIS_URL redis://localhost:6379

# Run with all secrets injected
vault run -- bun start
```

### Error Handling

```typescript
try {
  const apiKey = await vault.getItem('API_KEY', agent);
  console.log(`API Key: ${apiKey}`);
} catch (error) {
  if (error.message.includes('Invalid password')) {
    console.error('Wrong password provided');
  } else if (error.message.includes('Vault must be unlocked')) {
    console.error('Session expired, please unlock again');
  } else if (error.message.includes('not found')) {
    console.error('Secret not found in vault');
  }
}
```

### Command Error Handling

Chat commands throw `CommandFailedError` for invalid usage:

```typescript
import { CommandFailedError } from '@tokenring-ai/agent/AgentError';

// In /vault get command:
if (!key) throw new CommandFailedError("Usage: /vault get <key>");
if (value === undefined) throw new CommandFailedError(`Credential "${key}" not found in vault`);
```

## Best Practices

### Security Best Practices

- Use strong, unique passwords for vault encryption
- Store vault files in secure locations
- Don't commit vault files to version control
- Use `.gitignore` to exclude vault files
- Rotate secrets regularly
- Use different vaults for different environments
- Use the auto-lock feature to prevent unauthorized access
- Use chat commands for secure credential management in agents
- Never log or expose vault passwords in error messages

### Session Management

- The vault automatically locks after the configured timeout (default: 5 minutes)
- Password is cached during the session but cleared on lock
- Each vault access resets the relock timer
- Consider `relockTime` based on security requirements
- Call `lock()` explicitly when done with sensitive operations

### Error Handling

- Handle invalid password errors when decrypting vaults
- Check for file existence before operations
- Handle empty password cancellations
- Use proper error boundaries when integrating with agents
- Catch and handle `CommandFailedError` for chat command errors

### Configuration

- Validate configuration using the provided Zod schemas
- Use appropriate `relockTime` values for your use case
- Store vault files in secure, non-public directories
- Use environment-specific vault files for different deployments

## Testing and Development

### Testing

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

### Test Structure

The package includes comprehensive tests using Vitest:

- **Unit Tests:**
  - `test/vault.unit.test.ts` - Core encryption/decryption functions (`deriveKey`, `encrypt`, `decrypt`, `readVault`, `writeVault`, `initVault`)
  - `test/vault-service.unit.test.ts` - `VaultService` methods and session management
  - `test/plugin.unit.test.ts` - Plugin installation and configuration validation
  - `test/test-utils.ts` - Test utilities including `createTempFile()` for isolated test vaults

- **Integration Tests:**
  - `test/cli.integration.test.ts` - CLI command integration tests using `spawn` to run actual CLI commands

### Package Structure

```
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
│       ├── get.ts           # /vault get command
│       ├── list.ts          # /vault list command
│       ├── lock.ts          # /vault lock command
│       ├── store.ts         # /vault store command
│       └── unlock.ts        # /vault unlock command
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

### Development Commands

```bash
bun run build          # Type-check with TypeScript
bun run test           # Run tests once
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage report
```

### Test Utilities

The `test-utils.ts` file provides helper functions for testing:

```typescript
// createTempFile() - Creates a temporary directory for isolated test vaults
const tempDir = createTempFile();
const tempVaultFile = `${tempDir}/test.vault`;

// Clean up after tests
await fs.remove(tempDir);
```

## Dependencies

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | `0.2.0` | TokenRing application framework |
| `@tokenring-ai/agent` | `0.2.0` | Agent orchestration system |
| `@tokenring-ai/utility` | `0.2.0` | Shared utilities |
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
- **@tokenring-ai/utility** - Utility functions including `markdownList` for command output

## License

MIT License - see `LICENSE` file for details.
