# TokenRing Coder

**An AI-powered coding assistant that works with your codebase locally**

TokenRing Coder is an interactive AI assistant designed to help developers with coding tasks like editing, refactoring, testing, and git operations. It runs locally on your machine and supports multiple AI providers while keeping your code secure.

## Features

- 🤖 **Multiple AI Providers**: OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, and more
- 💬 **Interactive Chat**: Natural language conversations about your code
- 🔧 **Code Operations**: Edit, refactor, test, and commit code changes
- 🌐 **Web Search**: Integrated search capabilities for research and documentation
- 🐳 **Docker Support**: Containerized execution environments
- ☁️ **Cloud Integration**: AWS, S3, and other cloud services
- 🎯 **Specialized Agents**: Different AI agents for specific tasks (frontend, backend, testing, etc.)
- 💾 **Persistent Sessions**: Chat history and checkpoints saved locally
- 🔒 **Local & Secure**: Your code stays on your machine

## Quick Start

### Option 1: Run with npx (Easiest)

```bash
# Initialize your project
npx @tokenring-ai/coder --source ./your-project --initialize

# Set up API keys
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"

# Start coding with AI
npx @tokenring-ai/coder --source ./your-project
```

### Option 2: Run with Docker

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/tokenring-ai/tokenring-coder:latest

# Initialize your project
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  ghcr.io/tokenring-ai/tokenring-coder:latest \
  --source /repo --initialize

# Start coding with AI
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  -e OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY \
  ghcr.io/tokenring-ai/tokenring-coder:latest \
  --source /repo
```

### Option 3: Clone and Build from Source

```bash
# Clone and setup
git clone https://github.com/tokenring-ai/tokenring-coder.git
cd tokenring-coder
git submodule update --init --recursive
bun install

# Initialize your project
bun src/tr-coder.ts --source ./your-project --initialize

# Set up API keys
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"

# Start coding with AI
bun src/tr-coder.ts --source ./your-project
```

## Usage Examples

### Basic Chat

```
> Help me refactor this function to be more readable
> Add error handling to the user authentication code
> Write unit tests for the payment processing module
```

### Commands

```
/help          # Show available commands
/model         # Switch AI models
/commit        # Commit changes with AI-generated message
/reset         # Reset conversation
/tools enable  # Enable specific tools
```

### Specialized Agents

```
> @leader Create a new user dashboard feature
> @test-engineer Add comprehensive tests for the API
> @security-review Check this code for vulnerabilities
```

## Available Agents

TokenRing Coder includes specialized AI agents for different development tasks:

### Core Agents
- **code** - General code assistant for direct development tasks
- **leader** - Orchestrates full-stack projects and coordinates other agents
- **plan** - Generates implementation plans without executing them
- **swarm** - Breaks work into parallel tasks and runs them across multiple agents
- **research** - Produces verified research reports with web search

### Planning & Management
- **product-manager** - Creates PRDs, defines user stories, and plans feature roadmaps
- **product-design-engineer** - Product enhancement and comprehensive PRD creation
- **system-architect** - Designs system architectures and selects technology stacks

### Development Specialists
- **full-stack-developer** - Implements complete features across frontend and backend
- **frontend-design** - Creates React/Vue components, responsive layouts, and state management
- **backend-design** - Implements server-side logic, business rules, and data processing
- **api-designer** - Designs REST/GraphQL APIs and creates OpenAPI specifications
- **database-design** - Designs schemas, implements migrations, and optimizes queries

### Engineering Specialists
- **business-logic-engineer** - Implements workflows, rules engines, and automation systems
- **data-engineer** - Creates ETL pipelines, data migrations, and processing workflows
- **integration-engineer** - Implements third-party integrations, APIs, and webhooks
- **auth-design** - Designs authentication and authorization systems, including OAuth/OIDC

### Quality & Operations
- **test-engineer** - Creates unit, integration, and E2E tests plus test automation
- **code-quality-engineer** - Handles code reviews, refactoring, and standards enforcement
- **security-review** - Performs security assessments and vulnerability remediation
- **performance-engineer** - Focuses on performance optimization, caching, and scalability
- **devops-engineer** - Sets up CI/CD pipelines, Docker configs, and infrastructure

### Design & Documentation
- **ui-ux-designer** - Creates wireframes, design systems, and user flows
- **accessibility-engineer** - Audits and improves accessibility and usability compliance
- **seo-engineer** - Optimizes metadata, crawlability, and search visibility
- **documentation-engineer** - Produces technical documentation, API docs, and user guides

## Architecture

TokenRing Coder is built as a modular TypeScript monorepo with these core components:

- **Agent System**: Orchestrates AI interactions and tool usage
- **AI Client**: Unified interface for multiple AI providers
- **File System**: Safe file operations with ignore patterns
- **Tools & Commands**: Extensible functionality for development tasks
- **Web Search**: Research capabilities via multiple providers
- **Cloud Integration**: AWS, Docker, and other cloud services

## Configuration

Configuration is stored in `.tokenring/coder-config.mjs` in your project:

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

## Docker Usage

### Using Pre-built Image from GHCR

```bash
# Pull latest image
docker pull ghcr.io/tokenring-ai/tokenring-coder:latest

# Run with your project mounted
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  -e OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY \
  ghcr.io/tokenring-ai/tokenring-coder:latest \
  --source /repo
```

### Building from Source

```bash
# Build
docker build -t tokenring-coder -f docker/Dockerfile .

# Run with your project mounted
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  -e OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY \
  tokenring-coder \
  --source /repo
```

## Development

```bash
# Build the project
bun run build

# Run tests
bun run test

# Format code
bun run biome

# Start development server
bun run coder
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run `bun run biome` to format
6. Submit a pull request

## License

MIT License

## Support

- Check the [plugin documentation](/docs/plugins/overview) for detailed guides
- Open an issue for bugs or feature requests

---

**Ready to supercharge your coding workflow with AI? Get started today!** 🚀
