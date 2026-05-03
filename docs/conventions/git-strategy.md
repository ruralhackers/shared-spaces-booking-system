# Git Strategy

This document defines branching, commit messages, and the pre-commit gate used throughout the monorepo.

## Branching

- **Default branch is `main`.** Treat it as protected — no direct pushes.
- Feature branches off `main`:

| Prefix | Use for |
|---|---|
| `feat/<short-kebab-name>` | New feature |
| `fix/<short-kebab-name>` | Bug fix |
| `chore/<short-kebab-name>` | Tooling, deps, refactors with no behavior change |
| `docs/<short-kebab-name>` | Documentation only |
| `refactor/<short-kebab-name>` | Restructure without behavior change |

- PR target is the branch you branched from (usually `main`), not a long-lived integration branch.

```bash
# ✅ Good
git checkout -b feat/user-email-verification
git checkout -b fix/login-redirect-loop

# ❌ Bad
git checkout -b my-stuff
git checkout -b OR-123
```

## Commit Messages — Conventional Commits

Format:

```
<type>(<scope>): <short summary>

<optional body — the why, not the what>
```

### Types

| Type | Use for |
|---|---|
| `feat` | User-facing capability |
| `fix` | Bug fix |
| `chore` | Maintenance (deps, config, cleanup) |
| `docs` | Documentation |
| `refactor` | Restructure without behavior change |
| `test` | Add or adjust tests |

### Scope

The package or app touched: `api`, `users`, `webapp`, `mobile`, `database`, `common`, `auth`, or `ui` / `errors` / `index` for cross-cutting areas.

### Examples

```
feat(errors): implement domain error handling system
docs(readme): update project structure and documentation references
chore(index): remove console log statement
fix(webapp): redirect to /login when session expires
refactor(users): extract EmailNormalizer from UserCreator
```

### Rules

- Summary in imperative mood, lower-case, no trailing period, ≤ 72 chars.
- One logical change per commit. Don't mix a rename with a behavior change.
- Body explains **why** the change exists — the diff already shows what.
- Don't reference Claude, Copilot, or any assistant in the message.

## Pre-Commit Workflow (Mandatory)

Run all three checks before every commit. CI runs the same checks and will reject anything that fails:

```bash
bun run lint:fix     # Biome: format + lint auto-fix
bun run typecheck    # tsc --noEmit
bun test             # bun:test runner
```

Or invoke `/task-validate` to run and auto-fix the trio in one shot.

See [Pre-Commit Workflow](./pre-commit-workflow.md) for the detailed check list and common failure modes.

### Non-Negotiables

- Never commit with a red test. Fix the implementation; don't skip or delete the test.
- Never use `--no-verify` to bypass hooks. If a hook fails, the underlying issue is the problem.
- Never `@ts-ignore` or `as any` to get a type check to pass — fix the signature.

## TDD Commit Discipline

When following the TDD cycle from [TDD Practices](./patterns/tdd-practices.md):

- **One commit per green step** is fine for small cycles.
- **One commit per section** (group of related cases, e.g. "domain model for X") is preferred for larger features — keeps history readable.
- **Refactor commits are separate** from feature commits and labelled `refactor(<scope>): …`.

```
feat(users): add UserCreator application service          ← domain + application in one slice
refactor(users): extract EmailNormalizer from UserCreator  ← refactor, separate commit
feat(users): wire UserCreator into tRPC router            ← infra in next commit
```

## Pushing and PRs

- Push the feature branch: `git push -u origin <branch>`.
- Open the PR against the branch you branched from (`main` in the common case).
- PR title follows the same Conventional Commits rules as a commit message.
- Keep PRs small — one feature slice or one fix. Split vertically (domain + application + infra for one concern) rather than horizontally (one PR per layer).

## What Not To Do

- Force-push to shared branches (`main`, long-lived feature branches that others track).
- Amend commits that have already been pushed and reviewed.
- Commit `.env*` files, DB dumps, or generated Prisma client output.
- Merge commits on feature branches — prefer rebase to keep history linear.
- Fast-forward a branch onto someone else's WIP commits — always coordinate.

## Related

- [Pre-Commit Workflow](./pre-commit-workflow.md) — the check list in detail.
- [TDD Practices](./patterns/tdd-practices.md) — the cycle that drives commit granularity.
- [`/task-validate`](../../.agents/skills/task-validate/SKILL.md) — the automated pre-commit trio.
