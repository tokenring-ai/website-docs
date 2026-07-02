# TokenRing One Documentation

Comprehensive documentation for TokenRing One - a local-first, multi-agent workspace that bundles five purpose-built apps — coding, canvas, documents, media, and research — into a single product.

## 📚 Documentation Scope

This documentation site covers:

- **Getting Started**: Installation, setup, and quick start guides
- **Core Concepts**: Agent system, AI providers, and architecture
- **Plugin Reference**: Complete documentation for all 37+ plugins
  - Core plugins (Agent, AI Client, Memory, etc.)
  - Storage & Database (MySQL, SQLite, Checkpoints)
  - Filesystem operations (Local, S3, File Index)
  - Development tools (Git, Testing, JavaScript)
  - Cloud & Infrastructure (AWS, Docker, Kubernetes)
  - Web & Search (Serper, ScraperAPI, Wikipedia)
  - Audio & Media capabilities
  - Utilities and integrations
- **Configuration**: Setup and customization options
- **API Reference**: Detailed API documentation for developers
- **Examples**: Real-world usage examples and patterns

## 🚀 Quick Start

### Installation

```bash
yarn install
```

### Local Development

```bash
yarn start
```

Starts a local development server at `http://localhost:3000` with live reload.

### Build

```bash
yarn build
```

Generates static content into the `build` directory for production deployment.

### Serve Built Site

```bash
yarn serve
```

Serves the production build locally for testing.

## 📖 Documentation Structure

```
docs/
├── intro.md                 # Getting started guide
├── configuration.md         # Configuration reference
├── plugins/
│   ├── overview.md         # Plugin system overview
│   ├── agent.md            # Agent plugin docs
│   ├── ai-client.md        # AI Client plugin docs
│   └── ...                 # 35+ more plugin docs
└── api/                    # API reference (if applicable)
```

## 🛠️ Built With

- [Docusaurus](https://docusaurus.io/) - Modern static site generator
- [React](https://reactjs.org/) - UI framework
- [MDX](https://mdxjs.com/) - Markdown with JSX support

## 📝 Contributing to Documentation

1. Edit markdown files in the `docs/` directory
2. Test locally with `yarn start`
3. Build to verify with `yarn build`
4. Submit pull request with changes

### Adding New Plugin Documentation

1. Create new file in `docs/plugins/[plugin-name].md`
2. Follow the standard plugin documentation template
3. Update `docs/plugins/overview.md` to include the new plugin
4. Add to sidebar configuration in `docusaurus.config.ts`

## 🚢 Deployment

### GitHub Pages (SSH)

```bash
USE_SSH=true yarn deploy
```

### GitHub Pages (HTTPS)

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

Builds the website and pushes to the `gh-pages` branch.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.
