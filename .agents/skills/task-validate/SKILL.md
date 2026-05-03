---
name: task-validate
description: Run full project validation — lint, typecheck, tests — fix issues, and re-run until clean. Triggers "validate", "check project", "run checks".
context: fork
agent: project-validator
allowed-tools: Read, Glob, Grep, Bash, Edit
---

# Validate

Launch the `project-validator` subagent to run full project validation (Biome lint, tsc, `bun test`), auto-fix formatting and lint issues, and report remaining errors.

## What the agent does

1. `bun run lint:fix` (Biome `check --write`)
2. `bun run format` if formatting drift remains
3. `bun run typecheck` (tsc)
4. `bun test`
5. Analyzes failures, applies minimum fixes, and re-runs until clean.

## Rules

- Never disable linter rules to silence errors.
- Never suppress type errors with `@ts-ignore` or `as any`.
- Never delete or modify tests to make them pass — fix the implementation.
- Never use `npm` — Bun only.

## Output

A summary table (lint / typecheck / tests) with pass/fail status, what was fixed automatically, and any remaining issues with root cause and minimum fix.
