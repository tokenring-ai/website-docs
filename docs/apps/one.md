# TokenRing One

**A local AI assistant for software development, research, and workflow automation**

TokenRing One is the single TokenRing application. It combines the former app-specific workflows into one local assistant with a shared agent system, plugin ecosystem, web UI, and command-line interface.

## Features

- **Multiple AI providers**: OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, OpenRouter, and more
- **Interactive chat**: Natural language conversations about your project
- **Code operations**: Edit, refactor, test, and commit code changes
- **Research tools**: Web search, browser automation, and source-aware research workflows
- **Automation**: Multi-agent plans, task orchestration, scripting, and workflow tools
- **Infrastructure tools**: Git, Docker, Kubernetes, AWS, databases, and cloud storage
- **Local-first operation**: Your project files stay on your machine
- **Web interface**: Optional HTTP server with the bundled TokenRing frontend

## Quick Start

Run directly with npm:

```bash
npx @tokenring-ai/one
```

Run from a local monorepo checkout:

```bash
bun run tokenring
```

Run against a specific project directory:

```bash
tokenring --projectDirectory ./your-project
```

Run a one-shot prompt and exit when complete:

```bash
tokenring -p "Fix the failing tests"
```

Start the web interface:

```bash
tokenring --http 127.0.0.1:3000
```

Use ACP mode over stdin/stdout:

```bash
tokenring --acp --projectDirectory ./your-project
```

## Docker

Pull and run the published image:

```bash
docker pull ghcr.io/tokenring-ai/one:latest
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  -e OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY \
  ghcr.io/tokenring-ai/one:latest
```

Serve the web UI from Docker:

```bash
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  -e OPENAI_API_KEY \
  -p 3000:3000 \
  ghcr.io/tokenring-ai/one:latest \
  --http 0.0.0.0:3000
```

## Configuration

TokenRing One reads project configuration from `.tokenring/one-config.mjs`:

```javascript
export default {
  defaults: {
    agent: "leader",
    model: "gpt-4o"
  },
  models: {
    openai: {
      displayName: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY
    },
    anthropic: {
      displayName: "Anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY
    }
  }
};
```

## Available Agents

TokenRing One includes specialized agents for common development and planning workflows:

- **code** - General code assistant for direct development tasks
- **leader** - Orchestrates full-stack projects and coordinates other agents
- **plan** - Generates implementation plans without executing them
- **swarm** - Breaks work into parallel tasks across multiple agents
- **research** - Produces verified research reports
- **full-stack-developer** - Implements complete features across frontend and backend
- **frontend-design** - Creates frontend components, layouts, and state management
- **backend-design** - Implements server-side logic, APIs, and business rules
- **test-engineer** - Creates and repairs tests
- **security-review** - Performs security assessments and remediation
- **devops-engineer** - Handles CI/CD, Docker, and infrastructure

See the [Agents Overview](/docs/agents/overview) for the full list.

## Architecture

TokenRing One is built from reusable packages in the TokenRing monorepo:

- **Agent system**: Orchestrates AI interactions, tools, delegation, and commands
- **AI client**: Unified interface for multiple AI providers
- **Filesystem and terminal services**: Local project access with configurable providers
- **Tool plugins**: Git, testing, codebase search, browser automation, cloud services, and more
- **Storage**: SQLite-backed chat history, checkpoints, and session data
- **Web host and frontend**: Optional browser UI for local or remote access

## Development

From the monorepo root:

```bash
git submodule update --init --recursive
bun install
bun run build
bun run tokenring
```

## Links

- [TokenRing One repository](https://github.com/tokenring-ai/one)
- [TokenRing monorepo](https://github.com/tokenring-ai/monorepo)
- [Plugin overview](/docs/plugins/overview)
