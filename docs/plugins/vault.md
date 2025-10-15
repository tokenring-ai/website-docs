# Vault Plugin

Secure, encrypted vault for managing secrets and credentials with AES-256-GCM encryption.

## Overview

The `@tokenring-ai/vault` package provides a secure, encrypted vault for managing secrets and credentials. It works both as a standalone CLI tool and as a TokenRing service for programmatic access.

## Key Features

- **AES-256-GCM Encryption**: Industry-standard encryption for secrets at rest
- **Dual Interface**: CLI tool and TokenRing service
- **Environment Variable Injection**: Run commands with vault secrets as env vars
- **Secure Password Input**: Hidden password entry in terminal
- **Restrictive Permissions**: Vault files created with 0o600 (owner-only access)
- **Session Management**: Automatic locking and password caching

## CLI Usage

### Initialize Vault

```bash
vault init
vault init -f ~/.secrets.vault
```

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

### Remove Secrets

```bash
vault remove API_KEY
vault remove OLD_TOKEN
```

### Change Password

```bash
vault change-password
```

### Run Commands with Secrets

```bash
vault run -- node app.js
vault run -- npm start
vault run -- bash -c 'echo $API_KEY'
```

Executes commands with all vault secrets injected as environment variables.

### CLI Options

- `-f, --file <path>`: Specify vault file path (default: `.vault`)

## TokenRing Service Usage

### Configuration

```typescript
import { VaultService } from '@tokenring-ai/vault';

const vault = new VaultService({
  vaultFile: '.vault',
  relockTime: 300000  // 5 minutes
});
```

### Service Methods

**unlockVault(agent)**: Prompts for password and unlocks vault
```typescript
const data = await vault.unlockVault(agent);
```

**lock()**: Locks vault and clears cached password
```typescript
await vault.lock();
```

**getItem(key, agent)**: Retrieves value by key
```typescript
const apiKey = await vault.getItem('API_KEY', agent);
```

**setItem(key, value, agent)**: Stores string value
```typescript
await vault.setItem('API_KEY', 'sk-1234567890', agent);
```

**save(vaultData, agent)**: Saves entire vault data
```typescript
await vault.save({ API_KEY: 'new-key' }, agent);
```

## Programmatic Access

```typescript
import { readVault, writeVault, initVault } from '@tokenring-ai/vault/vault';

// Initialize new vault
await initVault('.vault', 'myPassword');

// Read vault
const data = await readVault('.vault', 'myPassword');

// Write vault
await writeVault('.vault', 'myPassword', { API_KEY: 'value' });
```

## Security

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations using SHA-256
- **Salt**: 16 random bytes per encryption
- **IV**: 12 random bytes per encryption
- **Authentication**: GCM provides authenticated encryption

### File Security

- Vault files created with `0o600` permissions (owner read/write only)
- Password never stored, only cached in memory during session
- Automatic session timeout prevents unauthorized access

### Best Practices

- Use strong, unique passwords
- Store vault files in secure locations
- Don't commit vault files to version control
- Use `.gitignore` to exclude vault files
- Rotate secrets regularly
- Use different vaults for different environments

## Usage Example

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

## Configuration Options

- **vaultFile**: Path to vault file (default: '.vault')
- **relockTime**: Auto-lock timeout in milliseconds (default: 300000)

## Dependencies

- `@tokenring-ai/agent@0.1.0`: Core agent framework
- Node.js crypto module

## Notes

- Stores string key-value pairs only
- Password caching during session
- Automatic locking after timeout
- Relock timer resets on each access
