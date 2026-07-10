---
slug: introducing-tokenring-one
title: Introducing TokenRing One
authors: [mdierolf]
tags: [tokenring, ai, announcement, unified, coding, content-creation]
---

# Introducing TokenRing One

Today, I'm excited to announce **TokenRing One** — a single, unified AI assistant that brings together everything we built across TokenRing Coder and TokenRing Writer into one product. One app, one set of agents, one ecosystem.

{/* truncate */}

## One App to Replace Two

A little over a year ago we launched **TokenRing Coder**, our AI-powered coding assistant. Two months later we followed up with **TokenRing Writer**, bringing that same local-first, privacy-respecting philosophy to content creation. Both products shared the same engine, the same packages, and the same agents — so it was only natural to ask: *why make people choose between them?*

TokenRing One is the answer. It merges Coder and Writer into a single application with the full weight of our 50+-package ecosystem behind it. The same agents, the same configuration, the same local-first security — now across coding, content, research, publishing, and automation.

## What's New in One

### A Unified Agent Roster

The specialized agents from both products now live side by side. Spin up a team that codes a feature, writes the docs, drafts the announcement blog post, researches the market, and publishes it — all from one workspace:

- **Engineering**: full-stack developer, frontend designer, backend designer, API designer, database designer, test engineer, security review, devops engineer
- **Planning**: team leader, planning agent, product manager, system architect
- **Content**: content writer, managing editor, researcher, publisher
- **Specialists**: UI/UX, documentation, accessibility, SEO, performance

### Five Apps in One

TokenRing One bundles five purpose-built surfaces into a single product:

- **Coding** — edit, refactor, test, and ship with multi-agent orchestration
- **Canvas** — visual thinking and diagramming
- **Documents** — long-form writing and knowledge work
- **Media** — audio processing, transcription, and text-to-speech
- **Research** — web search, scraping, and source-gathered investigation

### Everything You Already Loved

Nothing from Coder or Writer is lost. Multi-provider AI support (OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, and more), Git auto-commit, Docker and Kubernetes integration, Tree-sitter code intelligence, Ghost.io and WordPress publishing, audio pipelines, and MCP extensibility are all here — under one roof.

## A Familiar Experience

If you used Coder or Writer, you'll feel right at home. The same plugin architecture, the same `.tokenring/` configuration directory, and the same local-first security model. The biggest change is simply that there's less to keep track of.

```bash
# Run with npx
npx @tokenring-ai/one

# Or run from source
bun run tokenring
```

## Why We Unified

Maintaining two applications on a shared core meant duplicated effort: two release tracks, two sets of docs, two things to keep in sync. By unifying, we can move faster, focus our energy on one experience, and let every user benefit from improvements made for any use case. A fix for content workflows makes coding better, and vice versa.

It also reflects how people actually work. The line between "coding" and "content" is blurry — you write docs for your code, ship a changelog, publish a launch post, research a library before adopting it. One assistant that spans all of it fits the real workflow better than two apps you switch between.

## What's Next

This is just the beginning for TokenRing One. We're continuing to invest in:

- Deeper multi-agent orchestration and parallel "swarm" workflows
- Richer canvas and document experiences
- More publishing and integration partners
- Performance and cost optimizations across providers
- Community-contributed plugins and agents

## Get Started

- **npm**: `npx @tokenring-ai/one`
- **Docker**: `docker pull ghcr.io/tokenring-ai/one:latest`
- **Docs**: [github.com/tokenring-ai/one](https://github.com/tokenring-ai/one)

Existing TokenRing Coder and TokenRing Writer users can migrate by switching to the `@tokenring-ai/one` package and renaming their config to `one-config.mjs`. Your agents, plugins, and workflows carry over directly.

Welcome to TokenRing One. Let's build something great — code, content, and everything in between. 🚀

---

*Mark Dierolf*
*Creator of TokenRing AI*
