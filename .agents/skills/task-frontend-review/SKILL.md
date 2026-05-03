---
name: task-frontend-review
description: Review frontend changes (apps/webapp, apps/mobile) for component, hook, routing, and tRPC integration issues. Triggers "review frontend", "check components", "frontend review".
argument-hint: "[git range]"
context: fork
agent: frontend-reviewer
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Frontend Review

Launch the `frontend-reviewer` subagent to review changed frontend files under `apps/webapp/src/` (Vite SPA) and `apps/mobile/` (Expo), fix issues, and re-run the smallest relevant validation.

## Scope resolution (in order)

1. If `$ARGUMENTS` is a git range (e.g. `abc123...HEAD`), use it:
   ```bash
   git diff --name-only <range> -- 'apps/webapp/src/**' 'apps/mobile/**' '*.tsx' '*.ts' '*.css'
   ```
2. Otherwise prefer staged or unstaged changed files.
3. Otherwise diff the current branch against `main`:
   ```bash
   git diff --name-only main -- 'apps/webapp/src/**' 'apps/mobile/**'
   ```
4. If none of those produces a trustworthy scope, stop and ask the user to narrow it.

Exclude tests, generated files, `node_modules`, and `public/` assets.

## What the agent checks

- **Components**: composition with `components/ui/` primitives (which consume `@dfs/ui/variants/*`), no business rules, accessibility, loading/empty/error states.
- **Routing**: TanStack Router guards in `beforeLoad` (not component body); `loader` for data the page needs to paint.
- **Hooks**: single responsibility, TanStack Query usage through the tRPC client, complete dependency arrays, clean API (object, not tuple).
- **Data layer**: all reads/writes through `@dfs/api` tRPC procedures; client points at `env.VITE_API_URL` with `credentials: 'include'`; correct query invalidation on mutations; no direct Prisma imports.
- **Styles**: Tailwind v4 + shadcn tokens, no hardcoded colors, `rem` for sizing, responsive below 900px.
- **Mobile**: `expo-router` for navigation, NativeWind `className` for styling (shared with web where possible), safe-area via providers, `Platform.OS` only when necessary.

## Rules

- Never review or edit the whole repository by default.
- Never touch files outside the resolved scope.
- Never move domain logic into frontend.
- Never use `npm` — Bun only.

## Validation

1. `bun run typecheck`
2. `bun run lint:fix`

## References

- `docs/conventions/patterns/service-patterns.md`
- `docs/conventions/patterns/file-organization.md`
- `docs/conventions/patterns/error-handling.md`

## Output

A table per file: issues found, fixes applied, residual risks.
