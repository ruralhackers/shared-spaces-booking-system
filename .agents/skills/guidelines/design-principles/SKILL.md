---
name: design-principles
description: Design, naming, and error-handling rules for this monorepo — kebab-case.type.ts files, PascalCase classes, run() service entry point, constructor injection, no getters/setters, rich domain models, typed DomainError hierarchy. Load when writing, renaming, or reviewing TypeScript code in packages/ or apps/.
---

# Design Principles

Short checklist. Canonical rules live in `docs/conventions/` — go there for full tables, examples, and edge cases.

## Naming

- Files: `kebab-case.type.ts` — suffixes `.entity`, `.vo`, `.dto`, `.service`, `.repository`, `.controller`, `.adapter`, `.factory`.
- Classes: `PascalCase`. Interfaces: `PascalCase` with **no `I` prefix**.
- Methods: `camelCase`. Constants: `SCREAMING_SNAKE_CASE`.
- Functions = verbs (`findByEmail`). Classes = nouns (`UserCreator`).
- No `helper`, `util`, `manager` catch-alls. No `Impl`, `Abstract`, `Base` unless the abstraction is real.

→ Full tables and examples: [naming-conventions.md](../../../../docs/conventions/naming-conventions.md)

## Classes and modules

- Constructor injection for every dependency — no service locators, no globals.
- No getters/setters on domain models — expose behavior through methods.
- Rich domain models — invariants and transitions on the entity, not in a service.
- Application services expose a single public `run()` method. No `UseCase` suffix.
- Entities and value objects are immutable at the persistence boundary; use `create()`, `fromDto()`, `toDto()` when crossing it.

→ Full service pattern: [patterns/service-patterns.md](../../../../docs/conventions/patterns/service-patterns.md)

## Functions

- Single responsibility.
- Guard clauses over deep nesting.
- Boolean parameters split into specific functions (`activateUser()` / `deactivateUser()`, not `setActive(bool)`).
- Return types inferred by TypeScript — only annotate them on interfaces and abstract methods.
- Rule of Three: don't abstract before the third occurrence of duplication.

## Error handling

- Domain failures throw a typed `DomainError` subclass (`ValidationError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`, `UnauthorizedError`, `ForbiddenError`).
- Infrastructure failures propagate; wrap with context only when it adds value.
- Never `catch (e) {}`. Never `@ts-ignore` or `as any` to mask a type problem.

→ Full error hierarchy and status-code table: [patterns/error-handling.md](../../../../docs/conventions/patterns/error-handling.md)

## Comments and JSDoc

- No JSDoc by default — TypeScript types are the contract.
- Only comment the *why* when it's non-obvious (hidden constraint, workaround, surprising invariant).
- Never reference the current task, ticket, or author in comments.
