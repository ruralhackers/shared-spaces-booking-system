---
name: task-architecture-review
description: Review hexagonal/DDD architecture compliance inside a safe scope, fix violations, and validate. Triggers "architecture review", "review architecture", "check layers".
argument-hint: "[git range]"
context: fork
agent: architecture-reviewer
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Architecture Review

Launch the `architecture-reviewer` subagent to check DDD/hexagonal compliance on a safe scope, apply fixes, and re-run the smallest relevant validation.

## Scope resolution (in order)

1. If `$ARGUMENTS` is a git range (e.g. `abc123...HEAD`), use it:
   ```bash
   git diff --name-only <range> -- '*.ts' '*.tsx'
   ```
2. Otherwise prefer staged or unstaged changed files.
3. Otherwise diff the current branch against `main`:
   ```bash
   git diff --name-only main -- '*.ts' '*.tsx'
   ```
4. If none of those produces a trustworthy scope, stop and ask the user to narrow it.

## What the agent checks

- **Dependency direction**: Domain has no external deps; Application depends on Domain; Infrastructure depends on both.
- **Layer responsibilities**: domain logic stays in entities / domain services; application services orchestrate through `run()`; infrastructure owns adapters and wiring.
- **Repository pattern**: port in domain, Prisma implementation in infrastructure.
- **Cross-context boundaries**: communicate through application services or domain ports, never direct adapter coupling.
- **Frontend delegation**: `apps/webapp` and `apps/mobile` must delegate to application services through the tRPC boundary, not reimplement domain logic.

## Rules

- Never review or edit the whole repository by default.
- Never touch files outside the resolved scope.
- Never use `npm` commands — Bun only.
- Never copy assumptions from other projects onto this one.
- Never force `UseCase` naming where `run()`-based services are the convention.

## Validation

1. `bun run typecheck`
2. Smallest relevant test command — prefer `bun test <package-or-app-path>`; fall back to `bun test`.

## References

- `docs/conventions/architecture/ddd-principles.md`
- `docs/conventions/patterns/service-patterns.md`
- `docs/conventions/patterns/repository-patterns.md`
- `docs/conventions/patterns/file-organization.md`

## Output

A table of violations found, fixes applied per file, and residual risks.
