---
name: task-code-review
description: Review production code inside a safe scope against design, naming, and error-handling conventions, apply fixes, and validate. Triggers "code review", "review code".
argument-hint: "[git range]"
context: fork
agent: code-reviewer
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Code Review

Launch the `code-reviewer` subagent to review changed production files on a safe scope, fix issues, and re-run the smallest relevant validation.

## Scope resolution (in order)

1. If `$ARGUMENTS` is a git range (e.g. `abc123...HEAD`), use it:
   ```bash
   git diff --name-only <range> -- '*.ts' '*.tsx' '*.js' '*.jsx'
   ```
2. Otherwise prefer staged or unstaged changed files.
3. Otherwise diff the current branch against `main`:
   ```bash
   git diff --name-only main -- '*.ts' '*.tsx' '*.js' '*.jsx'
   ```
4. If none of those produces a trustworthy scope, stop and ask the user to narrow it.

Keep only production code files. Exclude tests (`*.test.ts`, `*.integration.test.ts`), snapshots, generated files, build outputs, coverage, and `node_modules`.

## What the agent checks

- **Service patterns**: single responsibility, `run()` entry point, constructor injection.
- **Naming conventions**: `kebab-case.type.ts`, pronounceable, no redundant suffixes.
- **Error handling**: domain failures vs infrastructure failures, typed domain errors.
- **Frontend/backend boundary**: apps delegate to application services through tRPC.

## Rules

- Never review or edit the whole repository by default.
- Never touch files outside the resolved scope.
- Never use `npm` — Bun only.
- Never impose undocumented rules from other projects (mandatory `Maybe` wrappers, `UseCase` naming, etc.).
- Update directly related tests only when needed to keep the scoped change correct.

## Validation

1. `bun run typecheck`
2. Smallest relevant test command — prefer `bun test <path>`; fall back to `bun test`.

## References

- `docs/conventions/patterns/service-patterns.md`
- `docs/conventions/naming-conventions.md`
- `docs/conventions/patterns/error-handling.md`

## Output

A table of issues found and fixes applied per file, plus residual risks.
