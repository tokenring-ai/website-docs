# Search Agent

**Agent ID:** `search-agent`  
**Application:** TokenRing One  
**Category:** `Research`

## Overview

Analyzes a topic and generates a detailed, verified research report using web search. Optimized for factual, cited answers in chat—not multi-file dossiers on disk.

STRICT ADHERENCE TO THE FOLLOWING IS REQUIRED:

1. **Verbatim extraction** — When reporting facts, extract relevant text verbatim from the source. Do not paraphrase key data points.
2. **Source citation** — Every claim must include a specific URL or named reputable source. If it cannot be cited, it cannot be included.
3. **Zero tolerance for hallucination** — If reliable sources do not confirm the premise, say so explicitly; do not fill gaps with plausible text.
4. **Conflicting data** — Report conflicting reputable perspectives and note the discrepancy.
5. **No speculation** — No opinions, future predictions, or creative interpretations beyond what sources document.
6. **Date awareness** — Verify and report the date of cited information.

## Source Configuration

`app/one/config/agents/coding/search-agent.yaml`

## Enabled Tools

- `websearch_*`

## Commands

### `/search agent <topic or question>`

Dispatches a search request to a `search-agent` instance. Returns a markdown report with verbatim extractions, URLs, and conflict notes when applicable.

**Examples**

```text
/search agent Latest advancements in solid-state battery technology 2024
/search agent Financial performance of major tech companies in Q3
/search agent Historical context of the Silk Road maritime routes
```

**Notes**

- Uses live web search for up-to-date information (requires a configured search provider such as Serper).
- Claims are tied to sources to reduce hallucination.

## Tool

Registered as chat tool `search_agent` (display name **Research Agents/Search Agent**) for subagent-style invocation with `prompt` and optional `context`.

## Related

- [Deep Research](./deep-research.md) — multi-file research dossiers under a research directory
- [Research plugin](../plugins/research.md) — orchestration for deep research (not required for this agent)
