# Proposal: pglite-migration

## Why

**Problem**: SQLite forces a divergent schema syntax, simulates JSONB as text, and lacks real enum types. The current implementation uses `@libsql/client` + `@prisma/adapter-libsql`, which diverges from the PostgreSQL-first conventions documented throughout the monorepo. While SQLite provides operational simplicity, it creates friction:

- `prisma/schema.sql` uses SQLite-specific DDL (DATETIME, TEXT for JSON, no real enums)
- Integration tests use temp file databases instead of true in-memory instances
- The schema's three enums (`BookingStatus`, `CancelledBy`, `RecurrenceFrequency`) are stored as strings, not typed enums
- Future features requiring PostgreSQL-specific types (JSONB operators, array types, full-text search) would require another migration

**Solution**: Migrate to **PGlite** — an embedded PostgreSQL implementation that runs via WASM/Node without a separate server process. PGlite provides:

- Full PostgreSQL semantics (real JSONB, real enum types, standard SQL)
- Same operational simplicity as SQLite (file-based persistence, no Docker required, simple backups)
- Better alignment with monorepo conventions that assume PostgreSQL
- More faithful integration tests (testing the same DB engine as production would use if scaled)
- Easier path to managed PostgreSQL (Neon, Supabase) if needed later

**Benefits**:
- Alignment with PostgreSQL-first conventions in `docs/conventions/`
- Real JSONB type for `Space.openHours` (enables JSON operators in queries)
- Real enum types for `BookingStatus`, `CancelledBy`, `RecurrenceFrequency`
- Faster integration tests (true in-memory mode, no temp file I/O)
- Simpler test setup (no pragma initialization, no line-by-line SQL parsing)
- Future-proof for PostgreSQL-specific features

**Trade-offs**:
- `pglite-prisma-adapter` is community-maintained and may lag Prisma releases (same caveat as documented in current `packages/database/README.md`)
- PGlite WASM bundle is larger than libsql (~3MB vs ~1MB), but this only affects test runs
- Production data is **not migrated** — fresh start with `db:seed` (acceptable for current deployment scale)

## What Changes

### Packages
- `@dfs/database`:
  - Change `prisma/schema.prisma` provider from `"sqlite"` to `"postgresql"`
  - Replace `@libsql/client` + `@prisma/adapter-libsql` with `@electric-sql/pglite` + `pglite-prisma-adapter`
  - Rewrite `src/client.ts` to use `PGlite` adapter with `dataDir: './data/pglite'` for production
  - Rewrite `src/testing.ts` to use `new PGlite()` in-memory (no dataDir) per test suite
  - Delete `src/sqlite-init.ts` (PostgreSQL doesn't need pragma initialization)
  - Regenerate `prisma/schema.sql` with real PostgreSQL DDL (TIMESTAMP, JSONB, CREATE TYPE ... AS ENUM)
  - Update `README.md` to document PGlite usage and adapter version caveat

### Apps
- `apps/api`:
  - Update `.env.local` and `.env.example` with new `DATABASE_URL` format (determine from adapter docs)
  - Update `src/env.ts` if DATABASE_URL has regex validation

### Documentation
- Update `README.md` — replace SQLite references with PGlite
- Update `docs/deployment/initial-setup.md` — new DATABASE_URL format, `mkdir data/pglite`
- Update `docs/deployment/env-reference.md` — document new DATABASE_URL format
- Update `docs/deployment/runbook.md` — backup section now copies `data/pglite/` directory

### Deployment
- Update `/root/deploy-shared-spaces.sh` on VPS to create `data/pglite/` and run `db:push` + `db:seed` on first deploy
- Change `DATABASE_URL` in `/etc/shared-spaces/api.env` on VPS
- Remove old `app.db` files, create `data/pglite/`, seed fresh data

## Capabilities

### New Capabilities
- `pglite-database`: Embedded PostgreSQL via PGlite with file-based persistence for production and in-memory mode for integration tests

### Removed Capabilities
<!-- No canonical sqlite-database spec exists in openspec/specs/ — SQLite was implementation detail only -->

### Modified Capabilities
<!-- No existing feature specs require changes — database is an implementation detail -->

## Impact

**Affected packages:**
- `@dfs/database` — schema provider, client setup, test utilities, dependencies

**Affected apps:**
- `apps/api` — database connection configuration, environment variables

**Infrastructure:**
- Production: `data/pglite/` directory instead of `data/app.db` file
- Backups: copy entire `data/pglite/` directory instead of single `.db` file
- Integration tests: 5 files consume `createTestPrisma()` — behavior unchanged, implementation faster

**Dependencies:**
- Remove: `@libsql/client`, `@prisma/adapter-libsql`
- Add: `@electric-sql/pglite`, `pglite-prisma-adapter`

**Breaking changes:**
- **BREAKING**: `DATABASE_URL` format changes from `file:./data/app.db` to new PGlite format
- **BREAKING**: Existing SQLite databases cannot be automatically migrated; production deployment starts fresh with `db:seed`
- **BREAKING**: Backup strategy changes from single-file copy to directory copy

## Non-goals

- Automatic data migration from SQLite to PGlite (fresh start is acceptable)
- Support for both SQLite and PGlite simultaneously
- Migration to managed PostgreSQL (Neon, Supabase) — PGlite keeps the embedded model
- Performance optimization beyond PGlite defaults
- Custom PGlite extensions or plugins
