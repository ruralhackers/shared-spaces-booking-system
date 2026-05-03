---
name: task-tests-review
description: Review test quality and coverage inside a safe scope, fix low-ambiguity issues, add missing tests when behavior is clear. Triggers "review tests", "tests review", "check coverage".
argument-hint: "[git range]"
context: fork
agent: tests-reviewer
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Tests Review

Launch the `tests-reviewer` subagent to audit test quality and coverage on a safe scope, fix issues, and optionally add missing tests when the expected behavior is clear.

## Scope resolution (in order)

1. If `$ARGUMENTS` is a git range (e.g. `abc123...HEAD`), use it:
   ```bash
   git diff --name-only <range> -- '*.test.ts' '*.test.tsx' '*.integration.test.ts'
   ```
2. Otherwise prefer staged or unstaged changed files.
3. Otherwise diff the current branch against `main`:
   ```bash
   git diff --name-only main -- '*.test.ts' '*.test.tsx' '*.integration.test.ts'
   ```
4. If none of those produces a trustworthy scope, stop and ask the user to narrow it.

Include the production files related to the scoped tests. Exclude generated files, build outputs, coverage, `node_modules`, and unrelated packages.

## What the agent checks

- **Structure & naming**: AAA (Arrange-Act-Assert) with business-oriented names.
- **Imports**: `bun:test` only; `mock()` from `bun:test`, not Jest.
- **Test doubles policy**: InMemory implementations or lightweight fakes over mocks.
- **Coverage gaps** on affected production paths (report broad gaps instead of inventing large suites).

## Rules

- Never review or edit the whole repository by default.
- Never touch files outside the resolved scope.
- Never use `npm` — Bun only.
- Never introduce mocks where conventions prefer fakes/InMemory.
- Only add tests when behavior is clear from code and existing patterns; otherwise report the gap.

## Validation

1. `bun run typecheck`
2. Smallest relevant test command — prefer `bun test <path>`; fall back to `bun test`.

## References

- `docs/conventions/patterns/testing.md`
- `docs/conventions/pre-commit-workflow.md`

## Output

Quality fixes applied, remaining coverage gaps, and any tests added.
