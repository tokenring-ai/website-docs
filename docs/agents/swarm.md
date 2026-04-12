# Swarm Agent

**Agent ID:** `swarm`  
**Application:** TokenRing Coder  
**Category:** `Coding`

## Overview

Orchestrates multiple agents in parallel to execute complex tasks. Analyzes requirements, breaks down work into parallel tasks, and uses the `tasks_run` tool to execute them simultaneously.

## Source Configuration

`app/coder/src/config/agents/coding/swarm.yaml`

## Enabled Tools

- `todo`
- `tasks_run`
- `coding_*`
- `research_*`
- `file_*`
- `shell_*`

## Delegation

This agent can delegate to any available sub-agent.
