# Design: pglite-migration

## Context

The project currently uses SQLite via `@libsql/client` + `@prisma/adapter-libsql` for both production and integration tests. This was implemented in the `sqlite-migration` change (archived in `openspec/changes/archive/`) to reduce deployment complexity compared to PostgreSQL.

However, SQLite introduces friction:
- Schema divergence: `prisma/schema.sql` uses SQLite-specific DDL (DATETIME, TEXT for JSON, no real enums)
- Limited types: JSONB is simulated as text, enums are stored as strings
- Test complexity: temp file databases require pragma initialization and line-by-line SQL parsing
- Future constraints: PostgreSQL-specific features (JSONB operators, array types, full-text search) would require another migration

PGlite (embedded PostgreSQL via WASM/Node) provides the best of both worlds:
- Full PostgreSQL semantics (real JSONB, real enum types, standard SQL)
- Same operational simplicity as SQLite (file-based persistence, no Docker, simple backups)
- Better alignment with monorepo conventions that assume PostgreSQL
- Faster, more faithful integration tests (true in-memory mode)

## Goals

1. Replace SQLite with PGlite for both production and integration tests
2. Maintain operational simplicity (no separate server process, file-based persistence)
3. Align schema with PostgreSQL conventions (real JSONB, real enums)
4. Improve integration test performance (in-memory mode, no temp file I/O)
5. Preserve all existing features and behaviors

## Non-goals

- Automatic data migration from SQLite to PGlite (fresh start is acceptable)
- Support for both SQLite and PGlite simultaneously
- Migration to managed PostgreSQL (Neon, Supabase) — PGlite keeps the embedded model
- Performance optimization beyond PGlite defaults
- Custom PGlite extensions or plugins

## Decisions

### 1. Provider and Adapter

**Decision**: Use `provider = "postgresql"` in `schema.prisma` with `pglite-prisma-adapter` wrapping `@electric-sql/pglite`.

**Rationale**: PGlite implements the PostgreSQL wire protocol and SQL dialect, so Prisma treats it as a standard PostgreSQL database. The adapter translates Prisma's driver-adapter protocol to PGlite's API.

**Implementation**:
```typescript
// packages/database/src/client.ts
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGlite } from 'pglite-prisma-adapter'
import { PrismaClient } from '../prisma/generated/client'

const dataDir = process.env.DATABASE_URL?.replace('pglite:', '') ?? './data/pglite'
const pglite = new PGlite({ dataDir })
const adapter = new PrismaPGlite(pglite)
const prisma = new PrismaClient({ adapter })
```

### 2. No Pragma Initialization

**Decision**: Delete `src/sqlite-init.ts` entirely. PostgreSQL (and PGlite) handles foreign keys, journaling, and locking natively.

**Rationale**: SQLite requires explicit pragma configuration (WAL mode, foreign keys, busy timeout, synchronous mode). PostgreSQL has these behaviors built-in:
- Foreign keys are always enforced
- WAL-equivalent journaling is the default
- No busy timeout needed (PostgreSQL uses MVCC)
- Synchronous mode is handled by PGlite's persistence layer

**Impact**: Simpler client initialization, no async setup step before first query.

### 3. Testing Strategy

**Decision**: Use `new PGlite()` (no dataDir) for integration tests. Each test suite gets a fresh in-memory instance.

**Rationale**:
- Faster than temp file databases (no disk I/O)
- Better isolation (no risk of leftover state between suites)
- Simpler setup (no temp directory creation/cleanup)
- More faithful to production (same PostgreSQL engine, not SQLite)

**Implementation**:
```typescript
// packages/database/src/testing.ts
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGlite } from 'pglite-prisma-adapter'
import { PrismaClient } from '../prisma/generated/client'

export async function createTestPrisma(): Promise<TestPrisma> {
  const pglite = new PGlite() // in-memory
  const adapter = new PrismaPGlite(pglite)
  const client = new PrismaClient({ adapter })
  
  await client.$connect()
  
  // Load schema.sql (now PostgreSQL DDL)
  const schemaSql = await readFile(schemaSqlPath, 'utf8')
  await client.$executeRawUnsafe(schemaSql)
  
  return {
    client,
    async close() {
      await client.$disconnect()
      await pglite.close()
    }
  }
}
```

### 4. Schema SQL Regeneration

**Decision**: Regenerate `prisma/schema.sql` with `prisma migrate diff` pointing to postgresql provider. Format changes to real PostgreSQL DDL.

**Expected changes**:
- `DATETIME` → `TIMESTAMP`
- `TEXT` (for JSON) → `JSONB`
- Enum declarations: `CREATE TYPE "BookingStatus" AS ENUM ('active', 'cancelled');`
- Foreign key syntax: `CONSTRAINT ... FOREIGN KEY ... REFERENCES ... ON DELETE CASCADE`

**Rationale**: `schema.sql` is the source of truth for integration tests. It must match the PostgreSQL dialect that PGlite understands.

**Command**: `bun run -F @dfs/database db:sync` (runs `prisma generate` + `prisma migrate diff` + `prisma db push`)

### 5. Enum Handling

**Decision**: Existing enums (`BookingStatus`, `CancelledBy`, `RecurrenceFrequency`) become real PostgreSQL enum types. Verify no repositories do explicit string casts that would break.

**Rationale**: Prisma's `enum` in schema.prisma maps to:
- SQLite: CHECK constraint with string values
- PostgreSQL: `CREATE TYPE ... AS ENUM`

**Risk**: If any repository code does `status as string` or `status === 'active'` (instead of `BookingStatus.active`), it may break. Audit required.

**Mitigation**: Search for enum usage in repositories and application services. Prisma client already generates TypeScript enums, so most code should be type-safe.

### 6. DATABASE_URL Format

**Decision**: Use `DATABASE_URL=pglite:./data/pglite` format. Parse it in `client.ts` by stripping the `pglite:` prefix and passing the path as `dataDir` to PGlite constructor.

**Rationale**: PGlite is instantiated with a config object containing `dataDir`, not a connection URL. The `pglite-prisma-adapter` documentation shows:
```typescript
const client = new PGlite({ dataDir: process.env.DATABASE_DIR })
const adapter = new PrismaPGlite(client)
```

We'll use a `pglite:` URL prefix for consistency with the old `file:` format, then parse it:
```typescript
const dataDir = process.env.DATABASE_URL?.replace('pglite:', '') ?? './data/pglite'
const pglite = new PGlite({ dataDir })
```

**Implementation**:
- Default: `DATABASE_URL=pglite:./data/pglite`
- Parsing logic in `packages/database/src/client.ts`
- Update `.env.example` and `apps/api/src/env.ts` (if DATABASE_URL validation exists)

### 7. Adapter Version Compatibility

**Decision**: Verify `pglite-prisma-adapter` supports Prisma 7.8.0 before proceeding. If not, document options: (a) downgrade Prisma, (b) wait for adapter release, (c) abort PGlite and use real PostgreSQL.

**Rationale**: `pglite-prisma-adapter` is community-maintained and may lag Prisma releases. The current `packages/database/README.md` already documents this caveat for the old PGlite usage.

**Risk**: Blocker if adapter doesn't support current Prisma version. Check npm registry and GitHub releases during task 1.1.

**Fallback**: If adapter is incompatible, options are:
1. Downgrade Prisma to latest supported version (check breaking changes)
2. Wait for adapter update (delays implementation)
3. Abort PGlite migration and use real PostgreSQL with Docker (loses operational simplicity)

### 8. Rollback Strategy

**Decision**: Rollback is a simple `git revert` of the Phase A commit. Old `app.db` is lost (acceptable since Phase B starts fresh).

**Rationale**: No data migration means no complex rollback. If PGlite doesn't work in production, revert the commit, restore `DATABASE_URL=file:./data/app.db` in `/etc/shared-spaces/api.env`, restore `app.db` from backup (task 7.1), and restart the service.

**Risk**: If Phase A is merged and Phase B fails, production is down until rollback completes. Mitigation: Phase A must be fully validated locally before merging. Phase B is a separate session with explicit human approval.

## Migration Plan

### Phase A — Local Implementation (First Session)

**Goal**: Replace SQLite with PGlite in the codebase, validate locally, commit. No production changes.

**Steps**:
1. Verify compatibility: `pglite-prisma-adapter` supports Prisma 7.8.0, `@electric-sql/pglite` runs in Bun 1.x
2. Change `packages/database`: schema provider, client.ts, testing.ts, package.json deps, regenerate schema.sql, update README
3. Update `.env.local`, `.env.example`, `apps/api/src/env.ts` (if DATABASE_URL validation regex exists)
4. Validate: `bun run lint:fix && bun run typecheck && bun test` → all green
5. Validate: `bun run dev` → API starts, webapp works, bookings persist across restarts
6. **STOP — human validation checkpoint before Phase B**

**Deliverable**: Commit with message `chore(database): migrate from SQLite to PGlite for local dev`

**Checkpoint**: Human must validate all features work locally with PGlite before proceeding to Phase B.

### Phase B — Production Deployment (Separate Session)

**Goal**: Deploy PGlite to production VPS, seed fresh data, validate.

**Prerequisites**:
- Phase A merged and validated
- Explicit human approval to proceed

**Steps**:
1. Backup current `apps/api/data/app.db` from VPS (for historical reference, not for restore)
2. Update deployment docs: `docs/deployment/initial-setup.md`, `env-reference.md`, `runbook.md`, `README.md`
3. Update `/root/deploy-shared-spaces.sh` on VPS: create `data/pglite/`, run `db:push` + `db:seed` on first deploy
4. Change `DATABASE_URL` in `/etc/shared-spaces/api.env` on VPS
5. Deploy: `git pull`, `bun install`, build, remove old `app.db`, create `data/pglite/`, `db:push`, `db:seed`, restart systemd service
6. Validate: https://salas.espacioarroelo.es works (spaces visible, booking works, reload persists)

**Deliverable**: Commit with message `chore(deployment): update production to use PGlite`

**Rollback**: If validation fails, revert commit, restore `DATABASE_URL=file:./data/app.db`, restore `app.db` from backup, restart service.

## Risks and Trade-offs

### Risk: Adapter Compatibility

**Risk**: `pglite-prisma-adapter` may not support Prisma 7.8.0 yet.

**Likelihood**: Medium (community package, may lag official releases)

**Impact**: Blocker — cannot proceed without compatible adapter

**Mitigation**: Check npm registry and GitHub releases during task 1.1. If incompatible, document options and stop.

### Risk: PGlite WASM Bundle Size

**Risk**: PGlite WASM bundle is ~3MB vs libsql ~1MB. May slow test runs.

**Likelihood**: Low (bundle is cached after first load)

**Impact**: Minor — test runs may be 1-2 seconds slower on first run

**Mitigation**: Accept trade-off. In-memory mode should offset any bundle overhead.

### Risk: Production Data Loss

**Risk**: Fresh start with `db:seed` means existing bookings are lost.

**Likelihood**: Certain (by design)

**Impact**: Acceptable for current deployment scale (small coliving space, bookings are transient)

**Mitigation**: Backup `app.db` before Phase B (task 7.1). If historical data is needed, export to JSON before migration.

### Risk: Enum Type Casting

**Risk**: If any repository code does explicit string casts on enum fields, it may break with real PostgreSQL enums.

**Likelihood**: Low (Prisma client generates TypeScript enums, most code should be type-safe)

**Impact**: Medium — runtime errors in booking/cancellation flows

**Mitigation**: Audit enum usage during task 4.3. Search for `as string`, `=== 'active'`, etc. in repositories and application services.

### Trade-off: Community-Maintained Adapter

**Trade-off**: `pglite-prisma-adapter` is not officially maintained by Prisma. May lag releases or have bugs.

**Rationale**: Same caveat as documented in current `packages/database/README.md` for the old PGlite usage. Acceptable risk for the benefits (full PostgreSQL semantics, operational simplicity).

**Mitigation**: Pin adapter version in `package.json`. Test thoroughly before upgrading Prisma.

### Trade-off: Backup Strategy Change

**Trade-off**: Backups change from single-file copy (`cp app.db app.db.backup`) to directory copy (`cp -r data/pglite/ data/pglite.backup/`).

**Rationale**: PGlite stores data in multiple files (similar to PostgreSQL's data directory). Directory copy is still simple, just slightly more complex than single-file.

**Mitigation**: Update `docs/deployment/runbook.md` with new backup commands. Automate with a backup script if needed.

## Open Questions

1. **Enum casting audit**: Are there any repositories that do explicit string casts on enum fields? (Resolve in task 4.3)
2. **Adapter version**: Does `pglite-prisma-adapter` support Prisma 7.8.0? (Resolve in task 1.1)

## Success Criteria

### Phase A (Local)
- [ ] All integration tests pass with PGlite
- [ ] `bun run dev` starts API without errors
- [ ] Webapp loads spaces, creates bookings, persists data across restarts
- [ ] `data/pglite/` directory exists and contains PGlite files
- [ ] `bun run lint:fix && bun run typecheck && bun test` all green

### Phase B (Production)
- [ ] https://salas.espacioarroelo.es loads spaces
- [ ] Booking creation succeeds
- [ ] Booking persists after page reload
- [ ] Booking cancellation succeeds
- [ ] `data/pglite/` directory exists on VPS
- [ ] No errors in `journalctl -u shared-spaces-api`
