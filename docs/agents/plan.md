# Planning Agent

**Agent ID:** `plan`  
**Application:** TokenRing Coder  
**Category:** `Coding`

## Overview

Analyzes a task and generates a detailed implementation plan with specific steps, files to modify, and agent assignments. Returns the plan for review without executing it.

## Source Configuration

`app/coder/src/config/agents/coding/plan.yaml`

## Enabled Tools

- `todo`
- `file_*`
- `shell_*`
- `coding_explore`

## Delegation

This agent can delegate to: `coding_explore`.
