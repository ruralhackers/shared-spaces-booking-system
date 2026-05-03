## ADDED Requirements

### Requirement: Workspace Surface

The monorepo SHALL expose exactly the apps and packages required by the coliving spaces booking product. No mobile app, authentication package, or sample users package is part of the workspace.

#### Scenario: Apps directory contains only api and webapp

- **WHEN** an engineer lists the contents of `apps/`
- **THEN** the only entries are `api/` and `webapp/`, and no `mobile/` directory exists

#### Scenario: Packages directory contains only the active baseline

- **WHEN** an engineer lists the contents of `packages/`
- **THEN** the only entries are `api/`, `common/`, `database/`, and `ui/`, and no `auth/` or `users/` directories exist

#### Scenario: Root workspaces declaration matches the filesystem

- **WHEN** the root `package.json` is parsed
- **THEN** the `workspaces.packages` array lists exactly `packages/*`, `apps/api`, and `apps/webapp`, in that order, with no entry for `apps/mobile`

#### Scenario: Mobile-related root scripts are removed

- **WHEN** the root `package.json` `scripts` block is inspected
- **THEN** there are no scripts named `mobile`, `mobile:ios`, or `mobile:android`, and there is no `preinstall` script that mutates the workspaces array

### Requirement: HTTP API Surface

The HTTP API exposed by `apps/api` SHALL serve only the tRPC entry point and a health endpoint. No authentication handler is mounted, and no authentication context is injected into tRPC requests.

#### Scenario: Auth handler route is not mounted

- **WHEN** a client sends any request to `/api/auth/*`
- **THEN** the server responds with a 404 (no route registered), and `apps/api/src/index.ts` contains no reference to `auth.handler` or any auth route

#### Scenario: tRPC context is auth-free

- **WHEN** `createTRPCContext` is invoked
- **THEN** the returned context contains `db` and the original request headers only, with no `session` field and no import from `@dfs/auth`

#### Scenario: Auth bootstrap files are absent

- **WHEN** the contents of `apps/api/src/` are listed
- **THEN** there is no `auth.ts` file, and no file in that directory imports from `@dfs/auth`

#### Scenario: Health endpoint remains available

- **WHEN** a client sends `GET /`
- **THEN** the server responds with `{ ok: true, service: '@dfs/api-server' }`

### Requirement: tRPC Router Surface

The shared tRPC router exported by `@dfs/api` SHALL expose only the routers required by the active product. The example user router and any dependency on `@dfs/users` are removed.

#### Scenario: Root router excludes the user router

- **WHEN** the `appRouter` exported from `packages/api/infrastructure/routers/root.router.ts` is inspected
- **THEN** it contains the `table` router and no `user` router, and the file does not import from `./user.router`

#### Scenario: User router file is deleted

- **WHEN** the contents of `packages/api/infrastructure/routers/` are listed
- **THEN** there is no `user.router.ts` file

#### Scenario: api package no longer depends on @dfs/users

- **WHEN** `packages/api/package.json` is parsed
- **THEN** the `dependencies` block contains no entry for `@dfs/users`, and no source file under `packages/api/` imports from `@dfs/users`

### Requirement: Webapp Surface

The webapp SHALL not contain any authentication routes, clients, or dependencies. A placeholder authenticated landing route MAY remain as a stub until the spaces UI replaces it.

#### Scenario: Login route is removed

- **WHEN** the contents of `apps/webapp/src/routes/` are listed
- **THEN** there is no `login.tsx` file

#### Scenario: Auth client module is removed

- **WHEN** the contents of `apps/webapp/src/lib/` are listed
- **THEN** there is no `auth-client.ts` file, and no file under `apps/webapp/src/` imports from `@dfs/auth`

#### Scenario: Webapp does not depend on @dfs/auth

- **WHEN** `apps/webapp/package.json` is parsed
- **THEN** the `dependencies` block contains no entry for `@dfs/auth`

#### Scenario: Dashboard placeholder still mounts

- **WHEN** the webapp is built and the `/dashboard` route is rendered
- **THEN** the route mounts without error and renders a placeholder component (no auth guard, no redirect)

### Requirement: Database Schema Surface

The Prisma schema SHALL not declare any models inherited from better-auth. The generated SQL fixture used by integration tests SHALL match the trimmed Prisma schema.

#### Scenario: Auth models are removed from Prisma schema

- **WHEN** `packages/database/prisma/schema.prisma` is parsed
- **THEN** it declares no `User`, `Session`, `Account`, or `Verification` model

#### Scenario: schema.sql matches schema.prisma

- **WHEN** `bun run -F @dfs/database db:sync` is executed
- **THEN** the resulting `packages/database/prisma/schema.sql` is identical to the version committed to the repository (i.e. the committed SQL was regenerated from the trimmed Prisma schema)

### Requirement: Validation Trio Passes On A Clean Install

After cleanup, the standard validation trio SHALL succeed against a fresh checkout with no manual fixes.

#### Scenario: Fresh install passes typecheck, lint, and tests

- **WHEN** an engineer runs `bun install && bun run typecheck && bun run lint && bun test` on a fresh clone
- **THEN** all four commands exit with status 0, with no errors, no warnings about missing modules, and no skipped suites

### Requirement: Documentation Reflects Active Surface

`AGENTS.md` SHALL describe only the apps, packages, and commands that exist after cleanup.

#### Scenario: Quick Reference omits removed pieces

- **WHEN** the Quick Reference section of `AGENTS.md` is read
- **THEN** it does not mention `apps/mobile`, Expo, React Native, NativeWind, better-auth, `@dfs/auth`, or `@dfs/users`, and the listed packages match the post-cleanup `packages/` directory

#### Scenario: Commands list omits removed scripts

- **WHEN** the Commands block of `AGENTS.md` is read
- **THEN** it does not list `bun run mobile`, `bun run mobile:ios`, or `bun run mobile:android`
