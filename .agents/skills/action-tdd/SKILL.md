---
name: action-tdd
description: "Start or enforce a TDD cycle (Reason → Red → Green → Refactor → Re-evaluate) for the current task. Use when implementation is skipping the red-green-refactor flow. Triggers: 'apply TDD', 'start TDD', 'enforce TDD'."
argument-hint: "[feature or test description]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# TDD

Run a strict TDD cycle for the current task. Full reference: `docs/conventions/patterns/tdd-practices.md`.

## Flow

### 0. Reason
- Clarify the requirement.
- List test cases from simplest to most complex:
  1. Happy path.
  2. Alternative cases.
  3. Edge cases / exceptions.
- Record the list as TODO comments at the top of the test file.

### 1. Red
- Take the simplest case from the list.
- Write the test — it must not compile or must fail.
- Add the minimum structure for it to compile.
- Run `bun test` and confirm it fails.

### 2. Green
- Implement the minimum code to pass the test (TPP — lowest-priority transformation).
- Run `bun test` and confirm it passes.

### 3. Refactor
- Simplify while keeping tests green.
- Apply naming conventions and service patterns.
- Rule of Three: wait for 3 occurrences before abstracting.

### 4. Re-evaluate
- Review remaining cases.
- Is the next case still the simplest? Reorder if needed.
- Mark the completed case and return to step 1.

## Rules

- Never write production code without a failing test first.
- Never jump transformations — pick the lowest-priority one that makes the test pass.
- Never refactor while red.

## Reference

- `docs/conventions/patterns/tdd-practices.md`
- `docs/conventions/patterns/testing.md`
- `docs/conventions/patterns/service-patterns.md`
