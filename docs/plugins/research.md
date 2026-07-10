# Research Plugin

**Package:** `@tokenring-ai/research`

## Overview

Orchestrates **deep research** agents for TokenRing One: ensures a research output directory, spawns agents of type `research`, sets their filesystem working directory, and kicks off `/deep research`.

The plugin exposes:

- **ResearchService** — programmatic start/list/resolve
- **RPC** (`/rpc/research`) — Research web app
- **Chat tool** `research_run` — start deep research from another agent
- **Scripting** `research(topic, prompt)` — same as start, returns JSON

Agent prompts, enabled tools, and slash commands are defined in app agent YAML (not in this package):

| Agent | ID | Config | Command |
|-------|----|--------|---------|
| Deep Research | `research` | `app/one/config/agents/coding/research.yaml` | `/deep research` |
| Search Agent | `search-agent` | `app/one/config/agents/coding/search-agent.yaml` | `/search agent` |

## Configuration

```js
// .tokenring / One defaults
research: {
  researchDirectory: ".tokenring/research",
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `researchDirectory` | `.tokenring/research` | Root directory for research project folders. Relative paths resolve against the project directory. |

TokenRing One sets this to `<dataDirectory>/research` by default.

## Service: ResearchService

| Method | Description |
|--------|-------------|
| `startResearch(query, { headless? })` | Ensure directory → spawn `research` agent → set cwd → `handleInput("/deep research …")` → `{ agentId, researchDirectory }` |
| `resolveResearchDirectory()` | Absolute path of the research root |
| `ensureResearchDirectory()` | Create root if missing; return absolute path |
| `listResearchProjects()` | Subdirectories under the root (`name`, `path`, `modifiedAt`), newest first |
| `applyWorkingDirectory(agent)` | Set `FileSystemState.workingDirectory` to the research root |
| `attach(agent)` | For `agentType === "research"`, apply the research working directory on create |

## Flow

```text
startResearch(query)
  → mkdir researchDirectory
  → spawnAgent({ agentType: "research" })
  → workingDirectory = researchDirectory
  → handleInput("/deep research " + query)
  → (requireNewAgent: false) steps run in-place via /chat send
```

When `/deep research` is run from a **different** agent type, the agent-command system starts a **background** research agent instead of blocking the parent.

## RPC (`/rpc/research`)

| Method | Type | Description |
|--------|------|-------------|
| `startResearch` | mutation | Input: `{ query, headless? }`. Result: `{ agentId, researchDirectory }` |
| `getResearchConfig` | query | Resolved absolute `researchDirectory` |
| `listResearchProjects` | query | Past project folders under the research root |

## Tools

| Tool | Display name | Description |
|------|--------------|-------------|
| `research_run` | Research/deep research | Starts deep research asynchronously; returns agent id and directory |

**Parameters:** `topic` (string), `prompt` (string). Combined into a single research query.

## Scripting

```text
research(topic, prompt)  →  JSON { agentId, researchDirectory }
```

## Related agents

- [Deep Research](../agents/deep-research.md) — multi-file dossier agent
- [Search Agent](../agents/search.md) — lighter verified web-search report

## Related plugins

- [Web Search](./websearch.md) — search providers used by research agents
- [Filesystem](./filesystem.md) — working directory and file tools for deep research
