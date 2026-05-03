# .agents — Source of Truth

This folder is the **canonical location** for everything that customizes AI agents in this repo: reviewer subagents and skills.

## Layout

- `agents/` — subagent definitions (Markdown with frontmatter). Each file describes one focused responsibility (review code, validate project, draft a spec).
- `skills/` — skill prompts grouped by purpose:
  - `guidelines/` — design, hexagonal, TDD, testing, frontend, git rules.
  - `openspec-*` — Spec Driven Development workflow (explore, propose, apply, archive).
  - `action-*` — focused workflows (TDD, refactor, generate tests).
  - `task-*` — task-oriented automations (validate, code review, QA).

## Consumers

| Tool | How it reads `.agents/` |
|---|---|
| **OpenCode** | `opencode.json` references files under `.agents/` directly. |
| **Claude Code** | `.claude/agents` and `.claude/skills` are **symlinks** into `.agents/`. |
| **GitHub Copilot / Cursor** | Read top-level `AGENTS.md`; do not consume this folder directly. |

## Rule

Always edit and reference files under `.agents/`. Never edit through the `.claude/` symlinks and never reference `.claude/...` paths in configuration or docs — they are a compatibility surface, not a canonical path.
