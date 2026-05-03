## Context

The repository was initialized from a generic DDD fullstack starter that includes three pieces we will never use for the coliving shared-spaces booking webapp:

1. **`apps/mobile`** — an Expo + React Native + NativeWind shell. The product is web-only.
2. **`packages/auth` + better-auth** — OTP-based authentication, session/account/verification models, and a tRPC auth context. The product has no sign-in: anyone with the link books by typing a name.
3. **`packages/users`** — a sample domain entity wired into a `user` tRPC router on `packages/api`. Nothing in the target product talks to this domain.

These pieces are coupled to live application code:

- `apps/api/src/index.ts` mounts `/api/auth/*` to better-auth's handler.
- `apps/api/src/context.ts` calls `createAuthContext` from `@dfs/auth` and injects `session` into every tRPC call.
- `packages/api/infrastructure/routers/root.router.ts` exposes the `user` router; `table-repository-proxy.adapter.ts` and `user.router.ts` import `@dfs/users`.
- `apps/webapp` ships a `/login` route, an `auth-client.ts`, and a `/dashboard` route gated by it.
- `packages/database/prisma/schema.prisma` defines `User`, `Session`, `Account`, `Verification` — all and only for better-auth.
- The root `package.json` lists `apps/mobile` in workspaces and exposes `mobile`, `mobile:ios`, `mobile:android` scripts plus a `RENDER`-only `preinstall` hack to strip mobile during deploy.

The change is large in surface but mechanically simple: it is a coordinated deletion. The risk is missing a transitive consumer; the mitigation is the lint + typecheck + test trio after each step.

## Goals / Non-Goals

**Goals:**

- Reduce the active surface of the monorepo to exactly what the spaces booking product needs: `packages/{api, common, database, ui}` + `apps/{api, webapp}`.
- Leave the project in a state where `bun install`, `bun run typecheck`, `bun run lint`, and `bun test` all pass with zero references to mobile, auth, or sample users.
- Update `AGENTS.md` so contributors and agents see an accurate Quick Reference (no mobile, no auth, no `@dfs/users`).
- Regenerate `packages/database/prisma/schema.sql` so the SQL fixture used by PGlite integration tests matches the trimmed Prisma schema.
- Establish a `repository-baseline` capability spec that records the resulting surface, so future changes (starting with `spaces-booking-mvp`) have an unambiguous starting point.

**Non-Goals:**

- Building any spaces / booking domain code. That belongs to the next change.
- Reintroducing a different auth mechanism. The product is name-only by design; admin access (shared-secret URL) is part of `spaces-booking-mvp`, not this change.
- Renaming the monorepo, the `@dfs/` package prefix, or the root `name` field. Those are cosmetic and can wait.
- Removing dev-only scaffolding such as `apps/webapp/src/routes/dashboard.tsx`'s placeholder shell — we keep the route as an empty stub so the webapp still mounts cleanly until the spaces UI replaces it.
- Touching CI, docker-compose, or deployment configs beyond the `preinstall` script that exists *only* to delete mobile during deploy.

## Decisions

### 1. Delete in dependency order (leaves before roots)

We remove consumers before producers so the typecheck stays meaningful at every step:

1. `apps/mobile` (no internal consumer of it).
2. `apps/webapp` auth surface (`/login` route, `auth-client.ts`, dashboard guard, `@dfs/auth` dep).
3. `apps/api` auth surface (`auth.ts`, `context.ts` simplification, `index.ts` route, integration test).
4. `packages/api` user surface (`user.router.ts`, `table-repository-proxy.adapter.ts` user import, root router, package dep on `@dfs/users`).
5. `packages/auth` (now unreferenced).
6. `packages/users` (now unreferenced).
7. Prisma schema (drop `User` / `Session` / `Account` / `Verification`).
8. Root `package.json` workspaces, scripts, `preinstall` hack.
9. `AGENTS.md` Quick Reference.

**Alternative considered:** delete everything at once, then fix the resulting graveyard. Rejected — a single PR with no intermediate green state makes review and bisection much harder.

### 2. Keep `apps/webapp/src/routes/dashboard.tsx` as a stub, delete `/login`

`/login` is meaningless once auth is gone. `/dashboard` is referenced as the post-login redirect target and as a sample protected route. We delete `/login` outright and reduce `/dashboard` to a minimal placeholder component (`"Spaces booking — coming soon"`). Rationale: leaves a known landing page for manual smoke tests until the spaces UI lands in the next change. The route file will be replaced wholesale by `spaces-booking-mvp`.

**Alternative considered:** delete `/dashboard` too and have only `/`. Rejected — `index.tsx` currently redirects to `/dashboard` after auth; keeping a stub avoids a second simultaneous edit to the index route's logic.

### 3. Drop the `RENDER` `preinstall` script unconditionally

The script exists only to strip `apps/mobile` from workspaces during Render deploys. With mobile gone from the source of truth, the conditional is dead. We delete it and trust the workspaces array.

### 4. Regenerate `schema.sql` via the existing script, do not hand-edit

`packages/database/prisma/schema.sql` is generated from `schema.prisma` by `bun run -F @dfs/database db:sync`. We modify only `schema.prisma` (deleting the four better-auth models and any related enums/indexes), then run the sync command. Hand-editing `schema.sql` is forbidden.

**Alternative considered:** delete `schema.sql` entirely until the spaces models exist. Rejected — PGlite integration test setup (`createTestPrisma()`) reads it; we want an empty-but-valid schema, not a missing file.

### 5. Capability spec scope: `repository-baseline`, not per-removal specs

A spec per deletion would be noise — there is no behavior to specify for "the absence of a mobile app." Instead, one `repository-baseline` capability records the post-cleanup surface as positive requirements ("the workspace contains exactly these apps and packages", "the API exposes exactly these tRPC routers", "no auth handler is mounted"). This gives `spaces-booking-mvp` a single document to amend.

**Alternative considered:** no spec at all, since this is "just deletion." Rejected — without a spec the cleanup leaves no durable record of intent, and the next change has no target to evolve.

### 6. Keep `@dfs/api`'s `table` router

`tableRouter` is unrelated to auth or users and is the existing smoke-test surface for tRPC wiring. We leave it for now; the spaces change will replace it. Removing it here would force `spaces-booking-mvp` to add a router *and* re-prove tRPC wiring at the same time.

## Risks / Trade-offs

- **[Risk]** A transitive `@dfs/auth` or `@dfs/users` import is missed and breaks typecheck only after the package is deleted. → **Mitigation:** run `bun run typecheck` after step 4 (consumers gone) *before* step 5/6 (packages deleted). The typecheck in step 4 should already report zero references; deletion in 5/6 then becomes a trivial `rm -rf`.
- **[Risk]** `apps/api/tests/auth-otp.integration.test.ts` is the only integration test exercising the api app; deleting it shrinks the safety net. → **Mitigation:** acceptable — the test only covered better-auth, which no longer exists. The spaces change will add its own integration coverage.
- **[Risk]** `packages/database/prisma/schema.prisma` ends up empty after the auth models are removed. → **Mitigation:** Prisma tolerates an empty schema (just generator + datasource blocks). The regenerated `schema.sql` will contain only Prisma's metadata. The next change adds the spaces tables.
- **[Trade-off]** We delete `apps/mobile` rather than archiving it on a branch. Bringing mobile back later means reinstalling Expo and rewriting RN code from scratch. → Acceptable: the product is web-only by decision.
- **[Trade-off]** The `dashboard` placeholder route is a temporary smell. → Acceptable: it lives for one change cycle and is replaced by `spaces-booking-mvp`.

## Migration Plan

This change has no production deployment yet, so "migration" is local + CI:

1. Branch `chore/cleanup-unused-stack` off `main`.
2. Execute the 9-step deletion sequence in §Decisions.1, committing per logical step (Conventional Commits, e.g. `chore(mobile): remove apps/mobile`, `chore(auth): drop @dfs/auth and better-auth wiring`).
3. After each commit, run `bun install && bun run typecheck && bun run lint && bun test`.
4. After step 7, run `bun run -F @dfs/database db:sync` and commit the regenerated `schema.sql`.
5. Final commit: update `AGENTS.md` Quick Reference and the proposal/spec for this change folder.
6. Open PR; reviewer focus is "did anything break" rather than "is the design right" — the design discussion is locked in this document.

**Rollback:** revert the merge commit. There are no DB migrations to undo (no production DB exists yet).

## Open Questions

- None blocking. The `apps/api/src/db.ts` file currently builds a Prisma client wired to the better-auth schema; it stays as-is and the empty schema simply yields a Prisma client with no models. The spaces change will reintroduce models and re-validate this file.
