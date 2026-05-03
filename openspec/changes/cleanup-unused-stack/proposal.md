## Why

The repository was bootstrapped from a fullstack DDD starter that includes a mobile app (`apps/mobile`), an authentication context (`packages/auth` + better-auth), and a sample users domain (`packages/users`). The product we are building — a coliving shared-spaces booking webapp — does not need any of these: it is web-only, uses no sign-in (anyone with the link can book by typing a name), and has no use for the example user domain. Carrying this code forward adds compile cost, dependency surface, and cognitive overhead, and forces every future change to reason about auth flows that will never fire. Removing it now, before the spaces feature lands, gives us a smaller, honest baseline.

## What Changes

- **BREAKING**: Remove `apps/mobile` from the workspace, including its `package.json`, source, configs, and the `mobile` / `mobile:ios` / `mobile:android` root scripts.
- **BREAKING**: Remove `packages/auth` (better-auth wiring, OTP client, auth context factory) and uninstall its dependents.
- **BREAKING**: Remove `packages/users` (sample domain) and uninstall its dependents.
- **BREAKING**: Drop the `user` tRPC router from `packages/api` (`packages/api/infrastructure/routers/user.router.ts`) and any `@dfs/users` imports inside `packages/api`.
- **BREAKING**: Simplify `apps/api`: remove `apps/api/src/auth.ts`, strip `createAuthContext` from `apps/api/src/context.ts`, drop the `/api/auth/*` route from `apps/api/src/index.ts`, and delete `apps/api/tests/auth-otp.integration.test.ts`.
- **BREAKING**: Simplify `apps/webapp`: delete `apps/webapp/src/lib/auth-client.ts`, remove the auth dependency, delete the `/login` route, and replace the auth-gated `/dashboard` route with a placeholder until the spaces UI lands.
- Drop the `RENDER`-only mobile stripping `preinstall` script — mobile is gone unconditionally.
- Update `package.json` workspaces to remove `apps/mobile`.
- Update `AGENTS.md` so the Quick Reference no longer advertises mobile, auth, or the users package.

## Capabilities

### New Capabilities

- `repository-baseline`: Records the active surface of the monorepo (which apps, packages, and root scripts exist) so future changes have a single source of truth for what is — and is not — part of the project.

### Modified Capabilities

<!-- None: no prior specs exist in openspec/specs/. -->

## Impact

- **Affected apps**: `apps/api` (context, index, auth handler, integration test), `apps/webapp` (routes, lib, package.json), `apps/mobile` (deleted entirely).
- **Affected packages**: `packages/api` (user router + dependency), `packages/auth` (deleted), `packages/users` (deleted).
- **Dependencies removed**: `better-auth`, `@dfs/auth`, `@dfs/users`, `nativewind`, `expo`, `expo-router`, `react-native`, and all transitive mobile/auth-only packages.
- **Database**: any `User` / `Session` / `Account` / `Verification` Prisma models inherited from better-auth become unreferenced; they are removed from `packages/database/prisma/schema.prisma` and the generated `schema.sql` is regenerated.
- **Bounded contexts**: removes `auth` and `users`; leaves `common`, `database`, `api`, `ui` as the active baseline. No new context introduced.
- **Docs**: `AGENTS.md` Quick Reference and any references to `bun run mobile` are updated.
- **Risk**: low — none of this code is used by the target product. The main risk is missing a transitive import; mitigated by `bun run typecheck` + `bun test` after each removal step.
