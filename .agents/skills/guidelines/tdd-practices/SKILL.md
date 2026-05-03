---
name: tdd-practices
description: TDD discipline for this monorepo — 5-step cycle (Reason → Red → Green → Refactor → Re-evaluate), TPP (Transformation Priority Premise), inside-out development (domain → application → infrastructure). Load when planning, implementing, or reviewing a feature that needs test-first discipline.
---

# TDD Practices

Short checklist. Full cycle, TPP table, and inside-out rationale live in [docs/conventions/patterns/tdd-practices.md](../../../../docs/conventions/patterns/tdd-practices.md).

## The 5-step cycle

1. **Reason** — list cases simplest-first as `TODO:` comments in the test file.
2. **Red** — write the simplest pending test; confirm it fails for the expected reason.
3. **Green** — minimum code to pass. Hard-coded values are fine on the first pass.
4. **Refactor** — only when green. Apply naming and structural rules. Rule of Three.
5. **Re-evaluate** — cross off the case; reorder if a smaller one became obvious. Back to step 1.

## TPP — Transformation Priority Premise

When going red → green, prefer the **lowest-priority transformation** that works.

Ordering (simplest first): `{}` → `nil` → constant → richer constants → scalar → statements → `if` → array → container → recursion → `while` → extract function → mutable assignment.

If you reach for `while` on the second test, you jumped too far.

→ Full table: [patterns/tdd-practices.md](../../../../docs/conventions/patterns/tdd-practices.md#tpp--transformation-priority-premise)

## Inside-out development

Work from the center of the hexagon outward:

1. **Domain** — pure logic, no IO.
2. **Application** — the `run()` service, driven by an InMemory repository fake.
3. **Infrastructure** — real adapters (Prisma, tRPC, UI) once the application layer is stable.

Each layer has its own TDD cycle. Don't mix them.

## What breaks the cycle

- Writing production code with no failing test → stop, write the test.
- Making a second test pass by adding logic beyond what it asserts → you jumped a transformation; step back.
- Refactoring while red → finish green first.
- Deleting a red test to get to green → the test was telling you something.

## When to use `/action-tdd`

- Starting a new feature.
- Mid-implementation and drifting.
- Implementation is jumping too far (`/action-tdd tpp`).
