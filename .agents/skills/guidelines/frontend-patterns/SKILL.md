---
name: frontend-patterns
description: Frontend conventions for apps/webapp (Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4), apps/mobile (Expo 54 + expo-router + NativeWind), apps/api (Bun + Elysia), and packages/ui (tokens + CVA variants). Covers component structure, hooks, data fetching via tRPC/TanStack Query, styling, and the api/client boundary. Load when writing, reviewing, or refactoring anything under apps/ or packages/ui/.
---

# Frontend Patterns

Short checklist. Full structure, examples, and rationale live in [docs/conventions/patterns/frontend-patterns.md](../../../../docs/conventions/patterns/frontend-patterns.md) — go there for any detail.

## Stay on the tRPC boundary

- Every data read/write goes through `@dfs/api` procedures via the tRPC client.
- Mutations must invalidate the relevant queries on success.
- No direct Prisma, repository, or `@dfs/<context>/domain` imports from frontend code.
- No business invariants in the UI — call an application service; let it enforce the rule and surface the `DomainError`.
- Never use raw `fetch()` — it bypasses tracing, auth, and error translation.
- Both web and mobile point at `apps/api` via `VITE_API_URL` / `EXPO_PUBLIC_API_URL` with `credentials: 'include'`.

## Vite SPA — `apps/webapp`

- File-based routing under `src/routes/` via `@tanstack/router-plugin/vite` (autoCodeSplitting).
- Auth guards live in `beforeLoad` and `throw redirect(...)` — not in the component body.
- Data needed before paint: put it in `loader`. Otherwise `useQuery` inside the component.
- Compose with primitives from `components/ui/` (shadcn recipes that consume `@dfs/ui/variants/*`); don't fork them.
- Every query-backed section has loading / empty / error states.
- Tailwind v4 theme tokens only — no hardcoded colors. `rem` for sizing; `px` only for hairlines.
- Theme (light/dark) via Zustand `persist` + `localStorage`; inline `<script>` in `index.html` prevents FOUC.
- Layout: `routes/` (file routes), `features/`, `components/ui/`, `hooks/`, `trpc/`, `lib/`, `stores/`, `styles/`, `env.ts` (import.meta.env.VITE_*).

## Expo — `apps/mobile`

- `expo-router` conventions — `<Link>`, `useRouter`, route groups `(name)`. No manual stacks.
- NativeWind `className` on `View`/`Text`/`Pressable`. Share class strings with web where possible.
- Shared tokens via `@dfs/ui/tokens.tailwind` consumed in `tailwind.config.js`.
- Safe-area via `SafeAreaProvider` / `useSafeAreaInsets`. Never hardcode insets.
- `Platform.OS` only when behavior genuinely diverges.
- RN-only concerns (gestures, animations) keep using `StyleSheet` or `react-native-reanimated`.

## Backend host — `apps/api`

- Bun + Elysia mounting `@dfs/api` router via `fetchRequestHandler` at `/api/trpc/*`.
- better-auth fetch handler at `/api/auth/*` — `auth.handler(request)`.
- CORS list must include the webapp origin (`http://localhost:3000` in dev, app domain in prod) with `credentials: true`.
- No domain logic here — this is a thin HTTP shell around already-framework-agnostic packages.

## Shared foundations — `packages/ui`

- Tokens in `tokens.ts`; CSS vars generated via `scripts/build-css-vars.ts`; mobile consumes `tokens.tailwind` helper.
- CVA variants in `variants/*.variants.ts` — classNames only, platform-agnostic.
- No rendered components in `@dfs/ui`. Each app renders its own `<button>` / `<Pressable>` wrapping the shared variant.
- Icons not shared: web uses `lucide-react`, mobile uses `lucide-react-native`.

## Hooks

- One hook, one concern. Complete dependency arrays.
- Return a named object (`{ projects, isLoading, refresh }`), not a tuple.
- No data fetching inline — wrap tRPC queries/mutations in a hook when a component needs lifecycle around them.

## What to avoid

- Hosting the tRPC router or better-auth handler inside `apps/webapp` — they belong in `apps/api`.
- Rendered components inside `@dfs/ui` that couple to DOM or RN primitives — only variants and tokens cross the boundary.
- Business rules in components or hooks.
- `any` in props or hook returns.
- Conditional hooks or hooks inside loops.
- Global mutable stores for data the server owns — use the tRPC cache.
- Class components in new code.
