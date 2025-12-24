# Plugin Overview

TokenRing Coder provides 37+ extensible plugins that add powerful capabilities to your AI-powered development workflow. Each plugin integrates seamlessly with the agent framework to provide specialized functionality.

## 🎯 Core Plugins

Essential plugins for agent functionality and AI integration.

| Plugin | Description |
|--------|-------------|
| [Agent](./agent.md) | Agent and AgentTeam management with tools, commands, and hooks |
| [AI Client](./ai-client.md) | Unified interface for multiple AI providers (OpenAI, Anthropic, Google, etc.) |
| [CLI](./cli.md) | Command-line interface utilities and argument parsing |
| [Memory](./memory.md) | Short-term memory and attention storage for agents |
| [History](./history.md) | Conversation history management and persistence |

## 💾 Storage & Database

Plugins for data persistence and database operations.

| Plugin | Description |
|--------|-------------|
| [Database](./database.md) | Abstract database interface for multiple providers (PostgreSQL, MySQL, etc.) |
| [MySQL](./mysql.md) | MySQL database integration with connection pooling |
| [Drizzle Storage](./drizzle-storage.md) | Multi-database storage (SQLite, MySQL, PostgreSQL) for agent state checkpoints |
| [Checkpoint](./checkpoint.md) | Checkpoint management system for saving agent states |
| [Vault](./vault.md) | Secure encrypted vault for managing secrets and credentials |

## 📁 Filesystem

File system operations and implementations.

| Plugin | Description |
|--------|-------------|
| [Filesystem](./filesystem.md) | Abstract filesystem with operations and ignore filters |
| [Local Filesystem](./local-filesystem.md) | Concrete local disk filesystem implementation |
| [S3](./s3.md) | AWS S3 filesystem and CDN implementations |
| [File Index](./file-index.md) | File indexing and search with semantic chunking |
| [Code Watch](./code-watch.md) | File watching and change detection for live updates |

## 🔧 Development Tools

Plugins for code development and testing.

| Plugin | Description |
|--------|-------------|
| [Git](./git.md) | Git integration with auto-commit and branch management |
| [Testing](./testing.md) | Testing framework with auto-repair hooks |
| [JavaScript](./javascript.md) | JavaScript/TypeScript utilities and operations |
| [Codebase](./codebase.md) | Codebase analysis and indexing capabilities |
| [Scripting](./scripting.md) | Scripting engine integration for custom workflows |
| [Template](./template.md) | Reusable AI-powered prompt templates for common tasks |

## ☁️ Cloud & Infrastructure

Cloud service integrations and container orchestration.

| Plugin | Description |
|--------|-------------|
| [AWS](./aws.md) | AWS service integrations and utilities |
| [Docker](./docker.md) | Docker integration via CLI with sandbox provider |
| [Kubernetes](./kubernetes.md) | Kubernetes orchestration and management |
| [Sandbox](./sandbox.md) | Abstract sandbox interface for isolated execution |
| [CDN](./cdn.md) | Abstract CDN service interface for content delivery |

## 🌐 Web & Search

Web scraping, search, and browser automation.

| Plugin | Description |
|--------|-------------|
| [Web Search](./websearch.md) | Abstract web search with pluggable providers |
| [Serper](./serper.md) | Serper.dev API integration for Google search |
| [ScraperAPI](./scraperapi.md) | ScraperAPI integration for web scraping and SERP |
| [Wikipedia](./wikipedia.md) | Wikipedia API integration for knowledge retrieval |
| [Chrome](./chrome.md) | Chrome browser automation via Puppeteer |
| [Reddit](./reddit.md) | Reddit integration for searching posts and retrieving content |
| [Research](./research.md) | Web-enabled AI research using Gemini models |

## 🎵 Audio & Media

Audio recording, playback, and transcription.

| Plugin | Description |
|--------|-------------|
| [Audio](./audio.md) | Abstract audio framework for recording and playback |
| [Linux Audio](./linux-audio.md) | Linux-specific audio implementation with naudiodon2 |

## 🛠️ Utilities

General-purpose helper plugins.

| Plugin | Description |
|--------|-------------|
| [Utility](./utility.md) | Promise handling, caching, logging, and shell escaping |
| [Queue](./queue.md) | Task queue management for async operations |
| [Tasks](./tasks.md) | Task scheduling and execution framework |
| [Feedback](./feedback.md) | User feedback collection and management |
| [Iterables](./iterables.md) | Iterable utilities and providers |

## 📝 Content & Publishing

Plugins for content creation and publishing.

| Plugin | Description |
|--------|-------------|
| [Blog](./blog.md) | Abstract blog service interface for multiple platforms |
| [WordPress](./wordpress.md) | WordPress integration via REST API |
| [Ghost.io](./ghost-io.md) | Ghost.io integration via Admin and Content APIs |
| [NewsRPM](./newsrpm.md) | NewsRPM API integration for news article management |

## 💰 Financial & Data

Plugins for financial data and market information.

| Plugin | Description |
|--------|-------------|
| [CloudQuote](./cloudquote.md) | Financial data tools for market quotes and news |

## 🔌 Integration

Protocol and integration plugins.

| Plugin | Description |
|--------|-------------|
| [MCP](./mcp.md) | Model Context Protocol support for standardized AI interactions |

## 🚀 Getting Started

### Installation

Plugins are included in the TokenRing Coder monorepo. Install dependencies:

```bash
bun install
```

### Using Plugins

Plugins are automatically loaded based on your configuration. To use a specific plugin:

```typescript
import { Agent } from '@tokenring-ai/agent';
import WikipediaService from '@tokenring-ai/wikipedia';

const agent = new Agent({
  services: [new WikipediaService()],
});
```

### Configuration

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

## 📚 Plugin Architecture

All plugins follow a consistent architecture:

- **TokenRingService**: Base interface for service plugins
- **Tools**: Agent-executable functions with Zod validation
- **Chat Commands**: Interactive commands for agent conversations
- **Hooks**: Lifecycle hooks for agent events

### Common Patterns

1. **Service Registration**: Register services with the agent
2. **Tool Execution**: Execute tools via agent.executeTool()
3. **Chat Commands**: Use /command syntax in conversations
4. **Event Hooks**: Subscribe to agent lifecycle events

## 🔗 Dependencies

Most plugins depend on:

- `@tokenring-ai/agent@0.1.0` - Core agent framework
- `zod@^4.0.17` - Schema validation

Check individual plugin documentation for specific dependencies.

## 📖 Next Steps

- Browse individual plugin documentation for detailed usage
- Check out the [Quick Start Guide](../intro.md)
- Explore [example configurations](../configuration.md)
- Join the community for support and contributions