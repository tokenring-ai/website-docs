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
- **Automatic Relocking**: Vault automatically locks after 5 minutes of inactivity

## CLI Usage

### Initialize Vault

```bash
vault init
vault init -f ~/.secrets.vault
```

Creates a new encrypted vault file. You'll be prompted to set a password.

### Store Secrets

```bash
vault set API_KEY sk-1234567890
vault set DB_PASSWORD mySecretPassword
vault set -f ~/.secrets.vault AWS_KEY abc123
```

### Retrieve Secrets

```bash
vault get API_KEY
vault get DB_PASSWORD
```

### List Keys

```bash
vault list
```

Shows all secret keys (not values) stored in the vault.

### Remove Secrets

```bash
vault remove API_KEY
vault remove OLD_TOKEN
```

### Change Password

```bash
vault change-password
```

Re-encrypts the vault with a new password.

### Run Commands with Secrets

```bash
vault run -- node app.js
vault run -- bun start
vault run -- bash -c 'echo $API_KEY'
```

Executes a command with all vault secrets injected as environment variables. Only string values are injected.

### CLI Commands

#### `vault init`

Initialize a new encrypted vault file.

**Options:**
- `-f, --file &lt;path&gt;`: Specify vault file path (default: `.vault`)

#### `vault get &lt;key&gt;`

Retrieve a secret value by key.

#### `vault set &lt;key&gt; &lt;value&gt;`

Store a secret value.

#### `vault list`

List all secret keys (not values) stored in the vault.

#### `vault remove &lt;key&gt;`

Remove a secret by key.

#### `vault change-password`

Change the vault encryption password.

#### `vault run &lt;command&gt; [args...]`

Run a command with vault secrets injected as environment variables.

## TokenRing Service Usage

### Configuration

```typescript
import &#123; VaultService &#125; from '@tokenring-ai/vault';

const vault = new VaultService(&#123;
  vaultFile: '.vault',
  relockTime: 300000  // 5 minutes in milliseconds
&#125;);
```

### Service Methods

#### unlockVault(agent: Agent): Promise&lt;Record&lt;string, string&gt;&gt;

Prompts for password and unlocks the vault. Returns the vault data.

```typescript
const data = await vault.unlockVault(agent);
```

**Parameters:**
- `agent`: The current agent instance for service access and human interaction

**Returns:**
- `Promise&lt;Record&lt;string, string&gt;&gt;`: The decrypted vault data as key-value pairs

#### lock(): Promise&lt;void&gt;

Locks the vault and clears cached password and data.

```typescript
await vault.lock();
```

#### getItem(key: string, agent: Agent): Promise&lt;string | undefined&gt;

Retrieves a value by key. Unlocks vault if needed. Returns string or undefined.

```typescript
const apiKey = await vault.getItem('API_KEY', agent);
```

**Parameters:**
- `key`: The key to retrieve
- `agent`: The current agent instance

**Returns:**
- `Promise&lt;string | undefined&gt;`: The value or undefined if key doesn't exist

#### setItem(key: string, value: string, agent: Agent): Promise&lt;void&gt;

Stores a string value by key. Unlocks vault if needed.

```typescript
await vault.setItem('API_KEY', 'sk-1234567890', agent);
```

**Parameters:**
- `key`: The key to store
- `value`: The string value to store
- `agent`: The current agent instance

#### save(vaultData: Record&lt;string, string&gt;, agent: Agent): Promise&lt;void&gt;

Saves the entire vault data.

```typescript
await vault.save(&#123; API_KEY: 'new-key', DB_PASSWORD: 'new-pass' &#125;, agent);
```

**Parameters:**
- `vaultData`: The complete vault data to save
- `agent`: The current agent instance

### Service Features

- **Password Caching**: Password cached during session, cleared on lock
- **Automatic Locking**: Vault locks after configured timeout (default: 5 minutes)
- **Session Management**: Relock timer resets on each access
- **Plugin Integration**: Auto-registers with TokenRing application framework
- **Agent Integration**: Uses Agent's human interaction for password prompts
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Configuration Validation**: Zod schema validation for configuration
- **Human Interface**: Integrates with Agent's `askForPassword` request type

## Plugin Integration

The vault package integrates with TokenRing applications through a plugin system:

```typescript
import &#123; TokenRingPlugin &#125; from "@tokenring-ai/app";
import &#123; VaultService &#125; from "@tokenring-ai/vault";
import &#123; vaultConfigSchema &#125; from "./VaultService.ts";
import packageJSON from "./package.json";

export default &#123;
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) &#123;
    if (config.vault) &#123;
      app.addServices(new VaultService(config.vault));
    &#125;
  &#125;,
  config: z.object(&#123; vault: vaultConfigSchema.optional() &#125;)
&#125; satisfies TokenRingPlugin;
```

### Configuration Schema

```typescript
import &#123; z &#125; from 'zod';

export const vaultConfigSchema = z.object(&#123;
  vaultFile: z.string().min(1),
  relockTime: z.number().positive(),
&#125;);
```

**Configuration Options:**
- `vaultFile`: Path to vault file (default: `.vault`)
- `relockTime`: Auto-lock timeout in milliseconds (default: 300000)

## Programmatic Vault Access

For direct vault file manipulation without the service layer:

```typescript
import &#123; readVault, writeVault, initVault &#125; from '@tokenring-ai/vault/vault';

// Initialize new vault
await initVault('.vault', 'myPassword');

// Read vault (returns Record&lt;string, string&gt;)
const data = await readVault('.vault', 'myPassword');

// Write vault (accepts Record&lt;string, string&gt;)
await writeVault('.vault', 'myPassword', &#123; API_KEY: 'value' &#125;);
```

## Data Types

The vault stores string key-value pairs:
- Keys: strings
- Values: strings

## Security

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations using SHA-256
- **Salt**: 16 random bytes per encryption
- **IV**: 12 random bytes per encryption
- **Authentication**: GCM provides authenticated encryption
- **File Permissions**: Vault files created with `0o600` (owner read/write only)

### Best Practices

- Use strong, unique passwords for vault encryption
- Store vault files in secure locations
- Don't commit vault files to version control
- Use `.gitignore` to exclude vault files
- Rotate secrets regularly
- Use different vaults for different environments
- Use the auto-lock feature to prevent unauthorized access

## Usage Example

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

### TokenRing Integration

```typescript
import &#123; Agent &#125; from '@tokenring-ai/agent';
import &#123; VaultService &#125; from '@tokenring-ai/vault';

const agent = new Agent(&#123;
  services: [
    new VaultService(&#123;
      vaultFile: '.vault',
      relockTime: 300000
    &#125;)
  ]
&#125;);

// Access vault through agent
const vault = agent.getService('VaultService');
const apiKey = await vault.getItem('API_KEY', agent);
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

## Error Handling

The vault package provides comprehensive error handling:

1. **Invalid Password**: `Failed to decrypt vault. Invalid password or corrupted vault file.`
2. **File Not Found**: `Vault file does not exist`
3. **Empty Password**: `Password was empty, vault unlock cancelled`
4. **Save Without Unlock**: `Vault must be unlocked before saving`
5. **File Permissions**: Proper error handling for file system issues

```typescript
try &#123;
  const data = await readVault('.vault', password);
&#125; catch (error) &#123;
  // Handle invalid password or corrupted vault
  console.error('Failed to decrypt vault');
&#125;
```

## Package Structure

```
pkg/vault/
├── cli.ts              # CLI implementation with Commander
├── index.ts            # Package exports
├── plugin.ts           # TokenRing plugin integration
├── vault.ts            # Core encryption and file operations
├── VaultService.ts     # TokenRing service implementation
├── vitest.config.ts    # Vitest configuration
├── LICENSE             # MIT license
├── package.json        # Package configuration
└── README.md           # Package documentation
```

## Testing

The package includes Vitest configuration for testing:

```typescript
// vitest.config.ts
import &#123; defineConfig &#125; from "vitest/config";

export default defineConfig(&#123;
  test: &#123;
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  &#125;,
&#125;);
```

## License

MIT (see LICENSE file)