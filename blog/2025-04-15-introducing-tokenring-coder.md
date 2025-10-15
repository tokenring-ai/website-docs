---
slug: introducing-tokenring-coder
title: Introducing TokenRing Coder
authors: [mdierolf]
tags: [tokenring, ai, coding-assistant, announcement]
---

# Introducing TokenRing Coder

Today, I'm excited to announce **TokenRing Coder** - an AI-powered coding assistant that works with your codebase locally, keeping your code secure while providing powerful development capabilities.

<!-- truncate -->

## Why TokenRing Coder?

As developers, we want AI assistance that:
- **Respects our privacy** - Your code stays on your machine
- **Works with any AI provider** - OpenAI, Anthropic, Google, Groq, and more
- **Integrates seamlessly** - Git, testing, Docker, cloud services
- **Extends easily** - 37+ plugins for every development need

## Key Features

### 🤖 Multiple AI Providers
Switch between OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, and more with a unified API. No vendor lock-in.

### 🔧 Code Operations
Edit, refactor, test, and commit code changes with AI assistance. Integrated git operations and automated testing.

### 🔒 Local & Secure
Your code never leaves your machine. Run locally with full control over your data and development environment.

### 🧩 Extensible Plugin System
37+ plugins covering:
- Filesystem operations (local, S3)
- Databases (MySQL, SQLite)
- Cloud services (AWS, Docker, Kubernetes)
- Web search and scraping
- Audio and media
- And much more

### 🎯 Specialized Agents
Different AI agents for specific tasks:
- Team Leader for project coordination
- Frontend/Backend specialists
- Test Engineer for comprehensive testing
- Security Reviewer for vulnerability checks

## Getting Started

```bash
git clone https://github.com/tokenring-ai/coder.git
cd tokenring-coder
bun install
bun src/tr-coder.ts --source ./your-project --initialize
```

Set up your API keys:
```bash
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
```

Start coding with AI:
```bash
bun src/tr-coder.ts --source ./your-project
```

## What's Next?

TokenRing Coder is just the beginning. We're building an ecosystem of AI-powered development tools that respect your privacy and enhance your workflow.

Stay tuned for more updates, and check out the [documentation](https://docs.tokenring.ai) to get started!

## Join the Community

- GitHub: [tokenring-coder](https://github.com/tokenring-ai/coder)
- Documentation: [docs.tokenring.ai](https://docs.tokenring.ai)
- Issues & Feature Requests: [GitHub Issues](https://github.com/tokenring-ai/coder/issues)

Happy coding! 🚀

---

*Mark Dierolf*  
*Creator of TokenRing AI*
