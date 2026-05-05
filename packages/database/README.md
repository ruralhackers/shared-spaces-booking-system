# @dfs/database

Prisma client, schema, and migration tooling. Shared across backend packages and apps.

## Exports

- `@dfs/database` — production client singleton. Reads `DATABASE_URL` at module load and connects to PGlite with file-based persistence (`dataDir`). Use from application code.
- `@dfs/database/testing` — `createTestPrisma()` factory. Spins up a fresh in-memory PGlite instance, loads `prisma/schema.sql`, and returns a scoped `PrismaClient`. Use from integration tests.

## Schema

Source of truth: `prisma/schema.prisma`.

Two derived artifacts:

- `prisma/generated/` — Prisma client, produced by `prisma generate`.
- `prisma/schema.sql` — plain-SQL DDL for an empty→current migration, produced by `prisma migrate diff`. Committed so tests can seed PGlite without Prisma CLI at runtime.

After editing `schema.prisma`, run `bun db:sync` to regenerate all three: client, SQL, and the pushed dev database.

## Scripts

| Script | Purpose |
|---|---|
| `bun generate` | Regenerate the Prisma client. |
| `bun db:sql` | Regenerate `prisma/schema.sql` from the current schema. |
| `bun db:push` | Push schema to the dev Postgres (loads `.env.local`). |
| `bun db:seed` | Run `src/seed.ts`. |
| `bun db:sync` | `generate` + `db:sql` + `db:push`. Use after any schema edit. |
| `bun db:fresh` | Reset dev DB and reseed. |
| `bun db:studio` | Open Prisma Studio against dev DB. |

## Testing

Integration tests do NOT require Docker. They call `createTestPrisma()` from `@dfs/database/testing`, which boots PGlite (embedded PostgreSQL via WASM) in-memory per test suite and tears it down in `afterAll`.

See [docs/conventions/patterns/testing.md](../../docs/conventions/patterns/testing.md) for the pattern and fidelity caveats.

### Prisma version and the PGlite adapter

`pglite-prisma-adapter` is a community package that trails official Prisma releases. When bumping `@prisma/client`, re-run `bun test` before merging — if the adapter lags, it may pull an older `@prisma/driver-adapter-utils` into the tree. Two versions can coexist as long as tests pass, but a breaking change in the driver-adapter protocol will surface here first.
