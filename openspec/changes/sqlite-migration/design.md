# Design: sqlite-migration

## Context

The application currently uses PostgreSQL as the primary database with Docker Compose for local development and PGlite for in-memory integration tests. For a single-deployment booking system, PostgreSQL adds unnecessary complexity:
- Requires Docker or managed service
- Connection pooling overhead
- Backup/restore complexity
- Network latency (even locally)

SQLite offers:
- Single-file database (easy backups via file copy)
- No separate server process
- Excellent read performance
- Zero-configuration deployment
- Built-in WAL mode for concurrent reads

Current database usage:
- Two tables: `spaces` and `bookings`
- Simple queries (no complex joins, no full-text search)
- Read-heavy workload (bookings are queried frequently, created occasionally)
- Single-server deployment (no distributed transactions)

## Goals / Non-Goals

**Goals:**
- Replace PostgreSQL with SQLite for production and development
- Maintain all existing functionality (no feature loss)
- Simplify deployment (single binary + single database file)
- Use SQLite `:memory:` mode for integration tests (faster than PGlite)
- Document SQLite file management and backup strategy

**Non-Goals:**
- Support both PostgreSQL and SQLite simultaneously
- Automatic migration of existing PostgreSQL data
- SQLite replication or clustering
- Advanced PostgreSQL features (full-text search, JSONB operators)
- Performance tuning beyond SQLite defaults

## Decisions

### 1. SQLite File Location

**Decision:** Store database at `./data/app.db` relative to the API server's working directory

**Rationale:**
- Keeps data separate from code
- Easy to back up (single file + `-wal` and `-shm` files)
- Standard convention for file-based databases
- `.gitignore` the `data/` directory to avoid committing database files

**Alternatives considered:**
- `/var/lib/app/app.db`: Requires system-level permissions, harder for local development
- `./app.db` in project root: Clutters the root directory
- Environment variable path: Adds configuration complexity

### 2. SQLite Configuration

**Decision:** Enable WAL mode and set reasonable pragmas

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

**Rationale:**
- **WAL mode**: Allows concurrent reads while writing (critical for web apps)
- **synchronous = NORMAL**: Balance between safety and performance (safe for most use cases)
- **foreign_keys = ON**: Enforce referential integrity (matches PostgreSQL behavior)
- **busy_timeout = 5000**: Retry for 5 seconds if database is locked (handles concurrent writes)

**Alternatives considered:**
- Default settings: No WAL mode means writes block reads (unacceptable for web app)
- `synchronous = FULL`: Slower writes, overkill for booking system
- No busy_timeout: Immediate failures on concurrent writes

### 3. Prisma Schema Changes

**Decision:** Change provider to `sqlite` and update connection URL format

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

`DATABASE_URL=file:./data/app.db`

**Rationale:**
- Minimal schema changes (Prisma abstracts most differences)
- Existing models work as-is (no data type changes needed)
- `cuid()` IDs work identically in SQLite

**Alternatives considered:**
- Keep PostgreSQL for production, SQLite for dev: Increases complexity, risks dev/prod parity issues
- Use Prisma's multi-provider support: Overkill for this use case

### 4. Integration Test Strategy

**Decision:** Replace PGlite with SQLite `:memory:` mode

```typescript
// Before (PGlite)
const prisma = await createTestPrisma()

// After (SQLite in-memory)
const prisma = new PrismaClient({
  datasources: { db: { url: 'file::memory:?cache=shared' } }
})
await prisma.$executeRawUnsafe(schemaSQL)
```

**Rationale:**
- Faster than PGlite (no WASM overhead)
- Simpler setup (no separate library)
- Identical behavior to production SQLite
- `:memory:` database is isolated per test (no cleanup needed)

**Alternatives considered:**
- Keep PGlite: Adds dependency mismatch (testing PostgreSQL, running SQLite)
- Shared SQLite file for tests: Requires cleanup, slower, risks test pollution

### 5. Backup Strategy

**Decision:** Document file-based backup approach (copy `data/` directory)

**Rationale:**
- SQLite backups are simple file copies
- WAL mode requires copying all three files: `app.db`, `app.db-wal`, `app.db-shm`
- Can use `sqlite3 .backup` command for online backups
- Deployment platform (e.g., Fly.io, Railway) can handle volume snapshots

**Alternatives considered:**
- Automated backup service: Overkill for single-deployment app
- Export to SQL: Slower, more complex than file copy

### 6. Docker Compose Changes

**Decision:** Remove PostgreSQL service, keep Redis (if used)

**Rationale:**
- SQLite doesn't need a separate service
- Simplifies `bun run dbs` (only starts Redis)
- Reduces Docker overhead

**Alternatives considered:**
- Keep PostgreSQL as optional: Adds maintenance burden, confusing for new developers

### 7. Migration from PostgreSQL (if needed)

**Decision:** Manual export/import via SQL dump

```bash
# Export from PostgreSQL
pg_dump -d $DATABASE_URL --data-only --inserts > data.sql

# Import to SQLite (after schema migration)
sqlite3 data/app.db < data.sql
```

**Rationale:**
- One-time operation (not automated)
- Simple for small datasets
- Prisma doesn't support cross-database migrations

**Alternatives considered:**
- Custom migration script: Overkill for one-time operation
- Prisma migrate: Doesn't support cross-database migrations

## Risks / Trade-offs

**Risk:** SQLite doesn't support some PostgreSQL features (e.g., `JSONB` operators, full-text search)
→ **Mitigation:** Current schema uses `Json` type only for `openHours` (simple storage, no queries); no advanced features used

**Risk:** Concurrent write performance lower than PostgreSQL
→ **Mitigation:** Booking system is read-heavy; WAL mode handles concurrent reads well; single-server deployment means no distributed writes

**Risk:** Database file corruption if server crashes during write
→ **Mitigation:** WAL mode + `synchronous = NORMAL` provides good durability; regular backups via file copy

**Trade-off:** No connection pooling (SQLite is in-process)
→ **Acceptable:** Eliminates network latency; single Prisma client instance is sufficient

**Trade-off:** Database file grows over time (no auto-vacuum by default)
→ **Mitigation:** Enable `PRAGMA auto_vacuum = INCREMENTAL` or run `VACUUM` periodically

**Risk:** Deployment platforms may not persist volumes by default
→ **Mitigation:** Document volume configuration for platforms like Fly.io, Railway, Render

## Migration Plan

1. **Phase 1: Update Prisma Schema**
   - Change provider to `sqlite`
   - Update `DATABASE_URL` format in `.env.local`
   - Run `bun run -F @dfs/database db:sync` to regenerate client

2. **Phase 2: Update Test Utilities**
   - Replace `createTestPrisma()` with SQLite `:memory:` setup
   - Update all integration tests to use new utility
   - Verify all tests pass

3. **Phase 3: Update API Configuration**
   - Remove PostgreSQL connection logic
   - Add SQLite pragma initialization
   - Update environment variable documentation

4. **Phase 4: Update Docker Compose**
   - Remove PostgreSQL service
   - Update `bun run dbs` script (if only Redis remains, rename to `bun run redis`)

5. **Phase 5: Documentation**
   - Update README with SQLite setup instructions
   - Document backup strategy
   - Document deployment volume configuration

6. **Phase 6: Validation**
   - Run full test suite
   - Manual QA of all features
   - Verify database file is created correctly
   - Test backup/restore process

**Rollback:** If critical issues arise, revert Prisma schema to PostgreSQL provider and restore `docker-compose.yml`.

## Open Questions

- Should we keep PostgreSQL as an optional provider for users who prefer it? → **Decision: No** (adds complexity, this is a single-deployment app)
- Should we add automated backups? → **Decision: No** (deployment platform handles this; document manual process)
- Should we use `better-sqlite3` directly instead of Prisma's driver? → **Decision: No** (Prisma abstracts the driver; no need to change)
