---
name: action-refactor
description: "Refactor or rename code following project conventions (after a green test). Modes: code (default), rename. Triggers: 'refactor', 'rename', 'clean up code'."
argument-hint: "[code | rename]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Refactor

Apply design standards to code without changing behavior.

## Usage

```
/action-refactor           → Refactor production code (default)
/action-refactor code      → Same as default
/action-refactor rename    → Rename symbols across the codebase
```

## Mode: Code (default)

Apply the design rules from `docs/conventions/patterns/service-patterns.md` and `docs/conventions/naming-conventions.md`:

1. Read the selected code and identify improvement opportunities.
2. Check for violations:
   - Functions with too many responsibilities.
   - Deep nesting (use guard clauses).
   - Boolean parameters (split into specific functions).
   - Anemic models (move logic into the class).
   - Law of Demeter (long chains).
   - Commented code (delete).
   - Magic strings/numbers (extract to constants or enums).
3. Apply improvements one at a time.
4. Run `bun test` after each change to keep green.
5. When done, run `bun run lint:fix && bun run typecheck && bun test`.

Rules:

- Never change behavior — only improve structure.
- Rule of Three: only abstract when duplication appears 3 times.
- Don't refactor tests and production code at the same time.

## Mode: Rename

Apply the naming rules from `docs/conventions/naming-conventions.md`:

1. Identify the symbol and its new name.
2. Apply naming conventions:
   - Files: `kebab-case.type.ts` (e.g. `user-creator.service.ts`, `email.vo.ts`).
   - Classes: `PascalCase`.
   - Methods: `camelCase`.
   - Constants: `SCREAMING_SNAKE_CASE`.
   - Interfaces: `PascalCase` (no `I` prefix).
3. Find all usages across the codebase (imports, references, tests).
4. Rename consistently in every location.
5. Run `bun run lint:fix && bun run typecheck && bun test`.

Rules:

- Pronounceable English names, no abbreviations.
- No redundant prefixes/suffixes (`I`, `Impl`, `Abstract`).
- No catch-all words (`helper`, `util`, `manager`).
- Verb names for functions, noun names for classes.

## Reference

- `docs/conventions/naming-conventions.md`
- `docs/conventions/patterns/service-patterns.md`
- `docs/conventions/patterns/file-organization.md`
