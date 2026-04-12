---
slug: core-plugins-launch
title: TokenRing Coder Core Plugins Launch
authors: [mdierolf]
tags: [tokenring, plugins, announcement]
---

# TokenRing Coder Core Plugins Launch

Today marks a major milestone - the launch of TokenRing Coder's core plugin system with 20+ essential plugins for AI-powered development.

<!-- truncate -->

## Core Foundation

The foundation of TokenRing Coder is built on these essential plugins:

### 🤖 Agent Plugin

The heart of the system - manages AI agents, tools, commands, and state persistence. Enables collaborative AI teams where agents share resources and coordinate on complex tasks.

### 🧠 AI Client Plugin

Unified interface for multiple AI providers including OpenAI, Anthropic, Google, Groq, Cerebras, and DeepSeek. Switch providers seamlessly with automatic model selection based on cost and capabilities.

### 💬 CLI Plugin

Interactive REPL for command-line interaction with agents. Features auto-completion, multiline editing, and human-in-the-loop confirmations.

### 💾 Memory Plugin

Short-term memory and attention management for agents. Store facts, goals, and focus areas to maintain context across interactions.

## Development Tools

### 📁 Filesystem Plugin

Abstract filesystem with read/write operations, globbing, searching, and ignore filters. Supports both local and cloud storage backends.

### 📂 Local Filesystem Plugin

Concrete implementation for local disk access with root-scoped operations and shell command execution.

### 🔍 File Index Plugin

Semantic file indexing and search with chunking and symbol extraction. Find relevant code snippets across your entire codebase.

### 📊 Codebase Plugin

Manage codebase resources and selectively include project files in AI context. Generate directory trees and file contents for AI reasoning.

### 👁️ Code Watch Plugin

Monitor file changes and detect AI-triggered comments for automatic code modification. Add `// AI!` comments to trigger intelligent code updates.

## Version Control & Testing

### 🔀 Git Plugin

Git integration with auto-commit, rollback, and branch management. AI-generated commit messages and automatic commits after successful tests.

### 🧪 Testing Plugin

Comprehensive testing framework with auto-repair hooks. AI agents can diagnose and fix failing tests automatically.

### 📦 JavaScript Plugin

JavaScript development tools including npm management, ESLint integration, and script execution in sandboxed environments.

## Cloud & Infrastructure

### ☁️ AWS Plugin

AWS integration with STS authentication and S3 operations. Secure credential handling and service status reporting.

### 🐳 Docker Plugin

Docker integration for container and image management. Create ephemeral containers or manage persistent sandboxes.

### ☸️ Kubernetes Plugin

Discover and interact with Kubernetes cluster resources. List all accessible API resources across namespaces.

### 🌐 Chrome Plugin

Browser automation using Puppeteer for running scripts and capturing console output.

## Database Support

### 🗄️ Database Plugin

Abstract layer for SQL execution and schema inspection. Support for multiple database types with write protection.

### 🗃️ SQLite Storage Plugin

SQLite-based checkpoint storage for persistent agent state. Lightweight local database for offline persistence.

## Utilities

### 🔧 Utility Plugin

Promise handling, caching, logging, and shell escaping. Essential helpers used across the entire ecosystem.

### 📋 Queue Plugin

Task queue management for batching and deferred execution. Sequential processing with state preservation.

### 🔄 Feedback Plugin

Collect feedback from users during task execution. Display files for review, ask questions, and preview React components.

## Getting Started

All core plugins are included in TokenRing Coder:

```bash
git clone https://github.com/tokenring-ai/coder.git
cd tokenring-coder
bun install
```

Configure plugins in `.tokenring/coder-config.mjs`:

```javascript
export default {
  defaults: {
    agent: "teamLeader",
    model: "gpt-4o"
  },
  models: {
    openai: {
      displayName: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY
    }
  }
};
```

## What's Next?

This is just the beginning. We're continuing to expand the plugin ecosystem with more integrations, specialized agents, and community-contributed extensions.

Check out the [plugin documentation](https://docs.tokenring.ai/docs/plugins/overview) for detailed usage guides!

---

*Mark Dierolf*  
*Creator of TokenRing AI*
