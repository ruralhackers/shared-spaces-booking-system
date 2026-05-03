## 1. Branch and baseline

- [x] 1.1 Create branch `chore/cleanup-unused-stack` off `main`.
- [x] 1.2 Run `bun install && bun run typecheck && bun run lint && bun test` and confirm a green baseline before any deletion.

## 2. Remove `apps/mobile`

- [x] 2.1 Delete the `apps/mobile/` directory in full (including `app/`, `components/`, `lib/`, `providers/`, `assets/`, `hooks/`, `constants/`, `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `app.json`, `global.css`, `nativewind-env.d.ts`).
- [x] 2.2 Edit root `package.json`: remove `apps/mobile` from `workspaces.packages`; delete the `mobile`, `mobile:ios`, `mobile:android`, and `preinstall` scripts.
- [x] 2.3 Run `bun install` to refresh the lockfile, then `bun run typecheck && bun run lint && bun test`.
- [x] 2.4 Commit: `chore(mobile): remove apps/mobile and root scripts`.

## 3. Strip auth from `apps/webapp`

- [x] 3.1 Delete `apps/webapp/src/routes/login.tsx`.
- [x] 3.2 Delete `apps/webapp/src/lib/auth-client.ts`.
- [x] 3.3 Edit `apps/webapp/src/routes/dashboard.tsx`: remove any auth guard / `useSession` / redirect logic; reduce the component body to a placeholder rendering `"Spaces booking — coming soon"`.
- [x] 3.4 Edit `apps/webapp/src/routes/index.tsx`: remove any auth-conditional redirect to `/dashboard` or `/login`; ensure the file still compiles as a static index route (placeholder content is fine).
- [x] 3.5 Search `apps/webapp/src/` for any remaining import of `@dfs/auth` or `auth-client` and remove the importing code or simplify the file to a placeholder.
- [x] 3.6 Edit `apps/webapp/package.json`: remove the `@dfs/auth` dependency entry.
- [x] 3.7 Run `bun install && bun run -F webapp build` (or `bun run typecheck`) to confirm the webapp compiles, then `bun run lint && bun test`.
- [x] 3.8 Commit: `chore(webapp): remove auth routes, client, and dependency`.

## 4. Strip auth from `apps/api`

- [x] 4.1 Edit `apps/api/src/index.ts`: remove the `import { auth } from './auth.ts'` line and the `.all('/api/auth/*', ...)` Elysia route.
- [x] 4.2 Edit `apps/api/src/context.ts`: remove the `createAuthContext` import and call; reduce `createTRPCContext` to return `{ db, ...opts }` only.
- [x] 4.3 Delete `apps/api/src/auth.ts`.
- [x] 4.4 Delete `apps/api/tests/auth-otp.integration.test.ts`.
- [x] 4.5 Edit `apps/api/package.json`: remove the `@dfs/auth` dependency entry.
- [x] 4.6 Run `bun install && bun run typecheck && bun run lint && bun test`.
- [x] 4.7 Commit: `chore(api): drop better-auth handler and context`.

## 5. Strip the user surface from `packages/api`

- [x] 5.1 Edit `packages/api/infrastructure/routers/root.router.ts`: remove the `userRouter` import and the `user: userRouter` entry in the `appRouter` object.
- [x] 5.2 Delete `packages/api/infrastructure/routers/user.router.ts`.
- [x] 5.3 Edit `packages/api/infrastructure/repositories/table-repository-proxy.adapter.ts`: remove the `import { UserFactory } from '@dfs/users'` line and any code that depends on it; if the file becomes obsolete, delete it and update its consumers.
- [x] 5.4 Search `packages/api/` for any remaining import of `@dfs/users` and remove or refactor.
- [x] 5.5 Edit `packages/api/package.json`: remove the `@dfs/users` dependency entry.
- [x] 5.6 Run `bun install && bun run typecheck && bun run lint && bun test`.
- [x] 5.7 Commit: `chore(api): remove example user router and @dfs/users dependency`.

## 6. Delete the now-orphan packages

- [x] 6.1 Run `rg "@dfs/auth" -n` and `rg "@dfs/users" -n` across the repo; confirm zero matches outside the deleted areas.
- [x] 6.2 Delete the `packages/auth/` directory in full.
- [x] 6.3 Delete the `packages/users/` directory in full.
- [x] 6.4 Run `bun install && bun run typecheck && bun run lint && bun test`.
- [x] 6.5 Commit: `chore: remove @dfs/auth and @dfs/users packages`.

## 7. Trim the Prisma schema

- [x] 7.1 Edit `packages/database/prisma/schema.prisma`: delete the `User`, `Session`, `Account`, and `Verification` models; keep the `generator client` and `datasource db` blocks.
- [x] 7.2 Run `bun run -F @dfs/database db:sync` to regenerate `packages/database/prisma/schema.sql` and the Prisma client output under `packages/database/prisma/generated/`.
- [x] 7.3 Run `bun run typecheck && bun test` (integration tests using `createTestPrisma()` must still pass).
- [x] 7.4 Commit: `chore(database): drop better-auth models and regenerate schema.sql`.

## 8. Update documentation

- [x] 8.1 Edit `AGENTS.md` Quick Reference: remove mentions of `apps/mobile`, Expo, React Native, NativeWind, better-auth, `@dfs/auth`, `@dfs/users`; update the package list to `api, common, database, ui` and the apps list to `api, webapp`.
- [x] 8.2 Edit `AGENTS.md` Commands block: remove `bun run mobile`, `bun run mobile:ios`, `bun run mobile:android` lines.
- [x] 8.3 Search the rest of `AGENTS.md` and `docs/` for references to mobile / auth / users that are now stale; either delete them or replace with a forward reference to the spaces change.
- [x] 8.4 Commit: `docs: align AGENTS.md with cleaned-up baseline`.

## 9. Final validation

- [x] 9.1 From a clean state, run `bun install && bun run typecheck && bun run lint && bun test`; all four MUST exit 0.
- [x] 9.2 Run `/task-validate` to lint:fix + typecheck + test in one shot and absorb any remaining auto-fixes.
- [x] 9.3 Run `/task-code-review`, `/task-architecture-review`, and `/task-frontend-review` in parallel on the full diff; address findings.
- [x] 9.4 Run `/task-tests-review` on the full diff; address findings (expect mostly deletions, since the removed tests were auth-only).
- [x] 9.5 Final commit (if reviews produced fixes): `chore: address review feedback for cleanup-unused-stack`.
- [x] 9.6 Open a PR titled `chore: clean up unused mobile, auth, and users stack` targeting `main`.
