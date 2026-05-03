---
name: action-tests
description: "Generate tests for existing code following project testing conventions (AAA, bun:test, InMemory fakes). Triggers: 'generate tests', 'add tests', 'write tests for'."
argument-hint: "[file or module path]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Generate Tests

Generate tests for existing code following `docs/conventions/patterns/testing.md`.

## Steps

1. Read the source file to understand its behavior.
2. Identify test cases: happy path, alternatives, edge cases.
3. Create the test file in the correct location:
   - Unit tests alongside the source (`<name>.test.ts`).
   - Integration tests as `<name>.integration.test.ts`.
4. Write tests using the AAA pattern (Arrange-Act-Assert).
5. Use descriptive names — `describe("The [Subject]")`, `test("[business rule]")`.
6. Run `bun test` to verify all tests pass.

## Rules

- Use `bun:test` imports: `import { describe, expect, test, mock } from "bun:test"`.
- Prefer InMemory implementations or lightweight fakes over mocks.
- Each test must be independent — no shared mutable state.
- Test behavior, not implementation details.

## Reference

- `docs/conventions/patterns/testing.md`
- `/action-tdd` for TDD-driven development (test first, then code).
