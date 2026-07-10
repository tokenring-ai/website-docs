# Deep Research

**Agent ID:** `research`  
**Application:** TokenRing One  
**Category:** `Research`

## Overview

Produces thorough, verified, **multi-file** research dossiers on disk using web search, todos, and filesystem tools.

For each request the agent:

1. Creates a new subdirectory under its working directory (slug/date-friendly name from the topic).
2. Plans work with the **todo** tool (outline, search, write, review).
3. Gathers sources via **web search** / page fetch; cites URLs; prefers verbatim key facts; flags conflicts; no speculation.
4. Writes markdown inside the project folder:
   - `SUMMARY.md` — executive summary
   - `TOC.md` — table of contents linking to topic files
   - One markdown file per major topic (deep dive)
5. Finishes only when summary, TOC, and topic files are complete and consistent.

## Source Configuration

`app/one/config/agents/coding/research.yaml`

## Enabled Tools

- `websearch_*`
- `todo`
- `file_*`

## Commands

### `/deep research <topic or goal>`

Starts a deep research run that writes a structured markdown dossier.

| Invocation context | Behavior |
|--------------------|----------|
| On a `research` agent | Steps run **in the foreground** on that agent (`requireNewAgent: false`) |
| From another agent type (e.g. `code`) | A **background** `research` agent is started |

**Examples**

```text
/deep research Solid-state battery commercialization timeline 2024-2026
/deep research Compare regulatory approaches to open-source AI models in the US and EU
/deep research Market landscape for local-first AI developer tools
```

## Tool

Registered as chat tool `deep_research` (display name **Research Agents/Deep Research**) with `prompt` and optional `context`.

The Research plugin also exposes `research_run`, which calls `ResearchService.startResearch` (spawn + directory + `/deep research`).

## Research app

The web UI **Research** app (`/research`):

1. Accepts a user query.
2. Calls Research RPC `startResearch`.
3. Spawns a `research` agent under the configured research directory.
4. Runs `/deep research` with the query.
5. Navigates to the agent chat; lists past project folders from the research root.

## Working directory

When created through the Research plugin (or with `agentType: research` and plugin attached), the agent’s filesystem working directory is set to `research.researchDirectory` (One default: `<dataDirectory>/research`). Project subfolders are created under that root.

## Related

- [Search Agent](./search.md) — lighter chat-only verified web search (`/search agent`)
- [Research plugin](../plugins/research.md) — `ResearchService`, RPC, `research_run`
