---
slug: sandbox-plugin
title: Sandbox Plugin - Isolated Code Execution
authors: [mdierolf]
tags: [tokenring, plugins, sandbox, security, announcement]
---

# Sandbox Plugin - Isolated Code Execution

The Sandbox plugin provides secure, isolated environments for running untrusted code and commands.

<!-- truncate -->

## Key Features

### 🔒 Abstract Provider Interface
Extensible for multiple sandbox backends including Docker, Kubernetes, and other container runtimes.

### 🐳 Container Lifecycle
Complete container management:
- **Create**: Spin up new containers with custom images
- **Execute**: Run commands in isolated environments
- **Stop**: Gracefully stop containers
- **Remove**: Clean up resources
- **Logs**: Access container output

### 🛠️ Agent Integration
Tools and chat commands for interactive control:

```bash
/sandbox create ubuntu:latest
/sandbox exec echo "Hello from sandbox"
/sandbox logs
/sandbox remove
```

## Usage

```typescript
const provider = new DockerSandboxProvider();
const { containerId } = await provider.createContainer({
  image: 'python:3.9',
  environment: { SCRIPT: 'print("Hello")' },
  workingDir: '/app'
});

const result = await provider.executeCommand(
  containerId, 
  'python -c "print(2+2)"'
);
console.log(result.stdout); // "4"

await provider.stopContainer(containerId);
await provider.removeContainer(containerId);
```

## Security Benefits

- **Isolation**: Code runs in separate containers
- **Resource Limits**: Control CPU, memory, and timeout
- **Clean State**: Each execution starts fresh
- **No Host Access**: Sandboxed from host filesystem

Perfect for running AI-generated code safely, testing in isolated environments, and executing untrusted scripts.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
