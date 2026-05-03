---
name: git-strategy
description: Branching, commit messages, and pre-commit workflow for this monorepo — feature branches off main, Conventional Commits, mandatory lint:fix + typecheck + test before commit, no direct pushes to main. Load when planning a commit, opening a PR, or reviewing commit history.
---

# Git Strategy

Short checklist. Full rules and examples live in [docs/conventions/git-strategy.md](../../../../docs/conventions/git-strategy.md).

## Branching

- Default branch is `main`. No direct pushes.
- Feature branches off `main`: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/` — kebab-case short names.
- PR target = branch you branched from (usually `main`).

## Commit messages — Conventional Commits

```
<type>(<scope>): <short summary>
```

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Scope: package / app name (`api`, `users`, `webapp`, `mobile`, `database`, `common`, `auth`) or cross-cutting area (`ui`, `errors`, `index`).
- Summary: imperative, lower-case, no trailing period, ≤ 72 chars.
- One logical change per commit. Body explains *why*, not *what*.
- Don't reference Claude, Copilot, or any assistant.

## Pre-commit trio (mandatory)

```bash
bun run lint:fix     # Biome format + lint auto-fix
bun run typecheck    # tsc --noEmit
bun test             # bun:test runner
```

Or `/task-validate` to run and auto-fix in one shot.

## Non-negotiables

- Never commit a red test.
- Never `--no-verify`. If a hook fails, fix the issue.
- Never `@ts-ignore` / `as any` to pass typecheck.
- Never force-push to `main` or to shared feature branches.
- Never amend commits already pushed and reviewed.

## TDD commit discipline

- One commit per **green** step for small cycles; one per **section** for larger features.
- Refactor commits separate from feature commits.

→ Full rules and examples: [docs/conventions/git-strategy.md](../../../../docs/conventions/git-strategy.md)
