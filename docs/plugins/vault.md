# Vault Plugin

Secure encrypted vault for managing secrets and credentials with AES-256-GCM encryption, session management, and dual interface (CLI tool and TokenRing service).

## Overview

The `@tokenring-ai/vault` package provides a secure, encrypted vault for managing secrets and credentials. It works both as a standalone CLI tool and as a TokenRing service for programmatic access. The vault uses AES-256-GCM encryption with PBKDF2 key derivation for industry-standard security, and includes session management with automatic locking.

## Key Features

- **AES-256-GCM Encryption**: Industry-standard encryption for secrets at rest
- **Dual Interface**: CLI tool and TokenRing service
- **Environment Variable Injection**: Run commands with vault secrets as env vars
- **Secure Password Input**: Hidden password entry in terminal with masking
- **Restrictive Permissions**: Vault files created with 0o600 (owner-only access)
- **Session Management**: Automatic locking and password caching during session
- **Interactive CLI**: Full featured command-line interface with password masking
- **TokenRing Integration**: Seamless integration with TokenRing application framework
- **Service Architecture**: Plugin-based service registration and configuration
- **Chat Commands**: Integrated chat commands for agent interaction (/vault unlock, lock, list, store, get)
- **Automatic Relocking**: Vault automatically locks after 5 minutes of inactivity
- **Zod Configuration**: Type-safe configuration with schema validation

## Core Components

### VaultService

The main service class for programmatic access to the vault.

**Properties:**
- `name`: "VaultService" - The service identifier
- `description`: "A vault service for storing persisted credentials" - Service description
- `options`: ParsedVaultConfig - The configuration options passed to the constructor

**Methods:**
- `unlockVault(agent: Agent): Promise<Record<string, string>>` - Unlocks the vault and returns decrypted data
- `lock(): Promise<void>` - Locks the vault and clears cached data
- `getItem(key: string, agent: Agent): Promise<string | undefined>` - Retrieves a secret by key
- `setItem(key: string, value: string, agent: Agent): Promise<void>` - Stores a secret
- `save(vaultData: Record<string, string>, agent: Agent): Promise<void>` - Saves vault data

### Vault Core Functions

Direct vault file manipulation functions:

- `initVault(vaultFile: string, password: string): Promise<void>` - Initialize a new vault
- `readVault(vaultFile: string, password: string): Promise<Record<string, string>>` - Read vault contents
- `writeVault(vaultFile: string, password: string, data: Record<string, string>): Promise<void>` - Write vault contents
- `deriveKey(password: string, salt: Buffer): Buffer` - Derive encryption key from password

### Chat Commands

Integrated chat commands for agent interaction:

- `/vault unlock` - Unlock the vault with password
- `/vault lock` - Lock the vault
- `/vault list` - List all credential keys in the vault
- `/vault store <key>` - Store a credential in the vault
- `/vault get <key>` - Retrieve and display a credential from the vault

### CLI Commands

Standalone command-line interface commands:

- `vault init` - Initialize a new encrypted vault file
- `vault get <key>` - Retrieve a secret value by key
- `vault set <key> <value>` - Store a secret value
- `vault list` - List all secret keys (not values) stored in the vault
- `vault remove <key>` - Remove a secret by key
- `vault change-password` - Change the vault encryption password
- `vault run <command> [args...]` - Run a command with vault secrets as environment variables

## Services

### VaultService

The main service class for programmatic access to the vault.

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

Unlocks the vault by prompting for the password (if not already unlocked), decrypts the vault file, and returns the data.

```typescript
const data = await vault.unlockVault(agent);
```

**Parameters:**
- `agent` (Agent): The Agent instance used for human interaction prompts, such as password entry.

**Returns:** Promise resolving to the decrypted vault data.

##### `lock(): Promise<void>`

Locks the vault, clearing all cached data and password.

```typescript
await vault.lock();
```

##### `getItem(key: string, agent: Agent): Promise<string | undefined>`

Retrieves a secret value by key.

```typescript
const apiKey = await vault.getItem('API_KEY', agent);
```

**Parameters:**
- `key` (string): The secret key to retrieve.
- `agent` (Agent): Agent instance for interaction.

**Returns:** Promise resolving to the secret value or undefined if not found.

##### `setItem(key: string, value: string, agent: Agent): Promise<void>`

Updates the vault with a new key-value pair, saving the changes.

```typescript
await vault.setItem('API_KEY', 'sk-1234567890', agent);
```

**Parameters:**
- `key` (string): The secret key to set.
- `value` (string): The value to store for the key.
- `agent` (Agent): Agent instance for interaction.

##### `save(vaultData: Record<string, string>, agent: Agent): Promise<void>`

Writes the updated vault data to the vault file, re-encrypting it with the current session password.

```typescript
await vault.save({ API_KEY: 'new-key' }, agent);
```

**Parameters:**
- `vaultData` (Record<string, string>): The updated vault data to save.
- `agent` (Agent): Agent instance for interaction.

## Provider Documentation

This package does not use a provider-based architecture.

## RPC Endpoints

This package does not define any RPC endpoints.

## Chat Commands

The vault package provides integrated chat commands for managing credentials within the agent interface.

### `/vault unlock`

Unlock the vault with password.

**Example:**
```
/vault unlock
```

### `/vault lock`

Lock the vault.

**Example:**
```
/vault lock
```

### `/vault list`

List all credential keys in the vault.

**Example:**
```
/vault list
```

### `/vault store <key>`

Store a credential in the vault. Prompts for the credential value securely.

**Example:**
```
/vault store api_key
```

### `/vault get <key>`

Retrieve and display a credential from the vault.

**Example:**
```
/vault get api_key
```

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
app.usePlugin(vaultPlugin);
```

#### Plugin Configuration Schema

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vault` | `VaultConfigSchema` | `undefined` | Optional vault configuration |

### Service Configuration

The VaultService accepts configuration options through its constructor.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vaultFile` | string | `.vault` | Path to the vault file |
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

```typescript
import { TokenRingApp } from '@tokenring-ai/app';
import vaultPlugin from '@tokenring-ai/vault';

const app = new TokenRingApp();
app.usePlugin(vaultPlugin);
```

### Agent Integration

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
```

### Chat Command Integration

Chat commands are automatically registered when the vault plugin is installed and the AgentCommandService is available.

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
const vault = agent.getService('VaultService');
const apiKey = await vault.getItem('API_KEY', agent);

// Or use chat commands
// /vault unlock
// /vault get API_KEY
```

### Direct Vault Access

```typescript
import { readVault, writeVault, initVault } from '@tokenring-ai/vault/vault';

// Initialize new vault
await initVault('.vault', 'myPassword');

// Read vault contents
const data = await readVault('.vault', 'myPassword');

// Write vault contents
await writeVault('.vault', 'myPassword', { API_KEY: 'value' });
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

### Session Management

- The vault automatically locks after the configured timeout (default: 5 minutes)
- Password is cached during the session but cleared on lock
- Each vault access resets the relock timer
- Consider relockTime based on security requirements

### Error Handling

- Handle invalid password errors when decrypting vaults
- Check for file existence before operations
- Handle empty password cancellations
- Use proper error boundaries when integrating with agents

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

### Package Structure

```
pkg/vault/
├── cli.ts                   # CLI implementation with Commander
├── index.ts                 # Package exports
├── plugin.ts                # TokenRing plugin integration
├── VaultService.ts          # TokenRing service implementation
├── vault.ts                 # Core encryption and file operations
├── schema.ts                # Zod configuration schema
├── chatCommands.ts          # Chat commands for agent integration
├── commands/                # Chat command implementations
│   ├── vault.ts            # Main command router
│   ├── unlock.ts           # Unlock command
│   ├── lock.ts             # Lock command
│   ├── list.ts             # List command
│   ├── store.ts            # Store command
│   └── get.ts              # Get command
├── vitest.config.ts        # Vitest configuration
├── LICENSE                 # MIT license
├── package.json            # Package configuration
└── README.md               # Package documentation
```

### Development Commands

```bash
bun run build          # Type-check with TypeScript
bun run test           # Run tests once
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage report
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/app`: 0.2.0 - TokenRing application framework
- `@tokenring-ai/agent`: 0.2.0 - Agent orchestration system
- `@tokenring-ai/utility`: 0.2.0 - Shared utilities
- `@types/fs-extra`: ^11.0.4 - Type definitions for fs-extra
- `commander`: ^14.0.3 - CLI framework
- `fs-extra`: ^11.3.3 - Enhanced file system operations
- `zod`: ^4.3.6 - Schema validation

### Development Dependencies

- `vitest`: ^4.0.18 - Testing framework
- `typescript`: ^5.9.3 - TypeScript compiler

## License

MIT License - see [LICENSE](./LICENSE) file for details.