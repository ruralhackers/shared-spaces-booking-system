---
name: testing-standards
description: Testing rules for this monorepo — bun:test runner, AAA structure, business-oriented describe/test names, InMemory fakes over mocks, tests alongside source, integration tests as *.integration.test.ts, FIRST principles. Load when writing, reviewing, or refactoring test files.
---

# Testing Standards

Short checklist. Full structure, examples, and setup live in `docs/conventions/patterns/testing.md` — go there for any detail.

## Tooling

- Import from `"bun:test"` only. Never `"jest"`, never `"vitest"`.
- Run tests with `bun test` (or `bun test <path>` for a scope).
- Coverage and timeouts live in `bunfig.toml`.

## Test location

- Unit tests: `<name>.test.ts` **next to** the source file.
- Integration tests: `<name>.integration.test.ts` (touches a real adapter — DB, HTTP, file system).
- No `__tests__/` folders. No separate `tests/` hierarchy mirroring `src/`.

## Structure and naming

- AAA — Arrange / Act / Assert, blank lines between sections.
- `describe("The [Subject]")`, `test("[business rule]")` — domain language, not technical verbs.
- One logical assertion per test (multiple fields of the same outcome is fine).

## Test doubles policy

**Prefer real implementations and InMemory fakes over mocks.**

- InMemory adapters live next to the production adapter (e.g. `user-in-memory.repository.ts`).
- Use `mock()` only for external boundaries that cannot run in-process (third-party HTTP, push notifications).
- Never mock a type you own when you can write an InMemory implementation — owned fakes stay in sync at compile time.

## FIRST

**F**ast (sub-second unit tests), **I**ndependent (no shared mutable state), **R**epeatable (seed randomness and clocks), **S**elf-validating (assertions, not `console.log`), **T**imely (test before code — see `tdd-practices`).

## Integration tests

- Real Postgres via `bun run dbs` (docker-compose).
- `bun run db:sync` before running against a fresh schema.
- Reset state with transactions or truncate in `beforeEach`.

## What not to do

- No `any` casting in test setup.
- No `skip` / `only` committed — they silently reduce coverage.
- No "tests the mock" tests — if removing production code keeps the test green, rewrite it.
- No snapshot tests unless the output is genuinely stable.

→ Canonical reference: [docs/conventions/patterns/testing.md](../../../../docs/conventions/patterns/testing.md)
