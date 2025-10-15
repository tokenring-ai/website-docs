---
slug: introducing-tokenring-writer
title: Introducing TokenRing Writer
authors: [mdierolf]
tags: [tokenring, ai, writing, content-creation, announcement]
---

# Introducing TokenRing Writer

Two months after launching TokenRing Coder, I'm thrilled to announce **TokenRing Writer** - an AI-powered writing assistant built on the same secure, local-first architecture.

<!-- truncate -->

## From Code to Content

TokenRing Coder proved that AI assistance doesn't require sacrificing privacy. Now we're bringing that same philosophy to content creation.

## What is TokenRing Writer?

TokenRing Writer is an AI-powered writing assistant that helps you:
- **Create content** - Blog posts, documentation, articles, and more
- **Research topics** - Integrated web search and Wikipedia access
- **Maintain consistency** - Style guides and tone management
- **Work offline** - Your content stays local and secure

## Built on TokenRing Architecture

TokenRing Writer leverages the same powerful plugin system as TokenRing Coder:

### 🌐 Web Research
- **Web Search** - Serper.dev and ScraperAPI integration
- **Wikipedia** - Direct API access for research
- **Chrome Automation** - Puppeteer for advanced scraping

### 📝 Content Management
- **Filesystem** - Local and S3 storage options
- **Version Control** - Git integration for content versioning
- **Database** - MySQL and SQLite for content organization

### 🤖 AI Flexibility
- **Multiple Providers** - OpenAI, Anthropic, Google, and more
- **Model Switching** - Choose the best model for each task
- **Cost Control** - Track usage and optimize spending

### 🔒 Privacy First
- **Local Processing** - Content stays on your machine
- **No Cloud Lock-in** - Use your own AI API keys
- **Full Control** - You own your data

## Use Cases

### Technical Writing
- API documentation
- Tutorial creation
- README files
- Technical blog posts

### Content Marketing
- Blog articles
- Social media content
- Email newsletters
- Landing pages

### Research & Analysis
- Market research reports
- Competitive analysis
- Literature reviews
- Data summaries

## Getting Started

```bash
git clone https://github.com/tokenring-ai/writer.git
cd tokenring-writer
bun install
bun src/tr-writer.ts --initialize
```

Configure your AI providers:
```bash
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
```

Start writing:
```bash
bun src/tr-writer.ts
```

## The TokenRing Ecosystem

With TokenRing Coder and TokenRing Writer, we're building a complete AI-powered development and content creation ecosystem:

- **TokenRing Coder** - For software development
- **TokenRing Writer** - For content creation
- **Shared Plugins** - Reusable components across tools
- **Local-First** - Privacy and security by design

## What's Next?

We're continuing to expand the TokenRing ecosystem with:
- More specialized agents
- Additional plugin integrations
- Enhanced collaboration features
- Community-contributed extensions

## Join Us

- GitHub: [tokenring-writer](https://github.com/tokenring-ai/writer)
- Documentation: [docs.tokenring.ai](https://docs.tokenring.ai)
- Community: [GitHub Discussions](https://github.com/tokenring-ai/writer/discussions)

Let's build the future of AI-assisted content creation together! ✍️

---

*Mark Dierolf*  
*Creator of TokenRing AI*
