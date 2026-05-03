# TDD Practices

This document defines the test-driven development discipline used throughout the monorepo. Every feature starts with a failing test. Production code without a prior red test is a defect in process, not a shortcut.

## The 5-Step Cycle

TDD in this repo is not just "Red → Green → Refactor". There's a step before (Reason) and after (Re-evaluate) that keep the cycle honest.

### 0. Reason

Before writing any test:

- Clarify the requirement in plain language.
- List the cases you'll cover, ordered from **simplest to most complex**:
  1. Happy path (smallest representative case).
  2. Alternative cases.
  3. Edge cases and failure modes.
- Record the list as `TODO:` comments at the top of the test file. Delete each as the corresponding case goes green.

```typescript
// user-creator.service.test.ts

// TODO: creates a user with a valid email and password
// TODO: rejects an email that already exists
// TODO: rejects a password shorter than 8 characters
// TODO: hashes the password before persisting

describe('The UserCreator', () => { ... })
```

### 1. Red

- Take the simplest pending case.
- Write the test. It must fail — either it does not compile, or the assertion fails when run.
- If it doesn't compile, add the **minimum** structure (types, empty class, stub method) to compile. Do not implement.
- Run `bun test <path>` and confirm it fails **for the reason you expect**.

If the test passes on the first run, something is wrong — the test isn't actually exercising new behavior.

### 2. Green

- Write the **minimum** code that makes the test pass.
- Pick the simplest transformation from TPP (see below) that turns the red bar green.
- Run `bun test <path>` and confirm it passes.

It's fine — encouraged, even — to hard-code values in the first green. The next test will force generalization.

```typescript
// First test: "returns 1 for count of new users"
// Green:
class UserCounter {
  run() { return 1 }  // ← hard-coded is OK
}
```

### 3. Refactor

Only when the suite is green.

- Remove duplication, improve names, extract helpers.
- Apply the naming and structural rules from [naming-conventions.md](../naming-conventions.md) and [service-patterns.md](./service-patterns.md).
- Keep tests green on every small step; run them frequently.
- **Rule of Three**: don't abstract on the second occurrence. Wait for the third.
- Never refactor production and tests in the same commit — separate the intents.

### 4. Re-evaluate

- Cross out the case you just finished.
- Is the next case on your list still the simplest remaining step? If a smaller case became obvious, reorder.
- Return to step 1.

## TPP — Transformation Priority Premise

When going from red to green, prefer the **lowest-priority transformation** that works. The ordering (simplest first):

| # | Transformation | Example |
|---|---|---|
| 1 | `{}` → `nil` | Empty program → return `null`/`undefined` |
| 2 | `nil` → constant | Return a constant |
| 3 | constant → constant+ | Add more constants / richer return |
| 4 | constant → scalar | Replace constant with a variable |
| 5 | statement → statements | Single line → sequence |
| 6 | unconditional → `if` | Add a conditional |
| 7 | scalar → array | Single value → collection |
| 8 | array → container | Array → map / set |
| 9 | statement → recursion | Straight line → recursive |
| 10 | `if` → `while` | Conditional → loop |
| 11 | expression → function | Extract a function |
| 12 | variable → assignment | Mutable state |

If you reach for `while` on the second test, you jumped too far — step back and pick a simpler path.

## Inside-Out Development

Work from the center of the hexagon outward:

1. **Domain** — entities, value objects, domain services. Pure logic, no IO.
2. **Application** — the `run()` service, driven by an InMemory repository fake.
3. **Infrastructure** — real adapters (Prisma repo, tRPC procedure, UI component) once the application layer is stable.

### Why Inside-Out

- **Domain tests are the fastest feedback loop** — you catch design problems before wiring.
- **Application tests with InMemory adapters** keep the service honest without DB flakiness.
- **Infrastructure tests are the slowest**; by the time you reach them, the behavior is already locked in.

```
Red → Green → Refactor  (Domain layer)
       ↓
Red → Green → Refactor  (Application layer, uses InMemory repo)
       ↓
Red → Green → Refactor  (Infrastructure, wires Prisma / tRPC / UI)
```

Each layer has its own TDD cycle. You don't mix them.

## What Breaks the Cycle

- Writing production code with no failing test in mind → stop, write the test.
- Making a second test pass by adding logic beyond what the test asserts → you've jumped a transformation; step back.
- Refactoring while red → finish green first, then refactor.
- Deleting a red test to get to green faster → the test was telling you something; fix the implementation.
- Committing with a red test → use `/task-validate` before every commit.

## Related

- [`/action-tdd`](../../../.agents/skills/action-tdd/SKILL.md) — the interactive workflow skill.
- [Testing](./testing.md) — test structure, tooling, and coverage rules.
- [Pre-Commit Workflow](../pre-commit-workflow.md) — the gate that catches red tests before they land.
