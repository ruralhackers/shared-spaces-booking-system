# Tasks — `pglite-migration`

## Phase A — Local Implementation

### 1. Compatibility Verification

**Goal**: Verify `pglite-prisma-adapter` and `@electric-sql/pglite` are compatible with current stack before making any changes.

- [ ] 1.1 Check npm registry for `pglite-prisma-adapter` — verify it supports Prisma 7.8.0 (check package.json peerDependencies and GitHub releases)
- [ ] 1.2 Check npm registry for `@electric-sql/pglite` — verify it runs in Bun 1.x (check package.json engines and GitHub issues)
- [ ] 1.3 If blocker found (incompatible versions), document options: (a) downgrade Prisma, (b) wait for adapter release, (c) abort to real Postgres — STOP and report to human

### 2. Database Package Changes (`packages/database`)

**Goal**: Replace SQLite with PGlite in the database package.

- [ ] 2.1 Update `prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`
- [ ] 2.2 Update `package.json`: remove `@libsql/client` and `@prisma/adapter-libsql`, add `@electric-sql/pglite` and `pglite-prisma-adapter`
- [ ] 2.3 Run `bun install` to install new dependencies
- [ ] 2.4 Delete `src/sqlite-init.ts` (PostgreSQL doesn't need pragma initialization)
- [ ] 2.5 Rewrite `src/client.ts`:
  - Replace `PrismaLibSql` import with `PGlite` and `PrismaPGlite`
  - Parse DATABASE_URL: `const dataDir = process.env.DATABASE_URL?.replace('pglite:', '') ?? './data/pglite'`
  - Replace `new PrismaLibSql({ url: 'file:...' })` with `new PGlite({ dataDir })` + adapter
  - Remove `initializeSqlitePragmas()` call
  - Keep `mkdirSync(dirname(dataDir), { recursive: true })` for production persistence
- [ ] 2.6 Rewrite `src/testing.ts`:
  - Replace `PrismaLibSql` import with `PGlite` and `PrismaPGlite`
  - Replace temp directory + file logic with `new PGlite()` (no dataDir = in-memory)
  - Remove `initializeSqlitePragmas()` call
  - Keep schema.sql loading logic (now PostgreSQL DDL)
  - Remove temp directory cleanup (no longer needed)
- [ ] 2.7 Run `bun run -F @dfs/database generate` to regenerate Prisma client with postgresql provider
- [ ] 2.8 Run `bun run -F @dfs/database db:sql` to regenerate `prisma/schema.sql` with PostgreSQL DDL
- [ ] 2.9 Verify `prisma/schema.sql` changes: DATETIME → TIMESTAMP, JSON → JSONB, CREATE TYPE ... AS ENUM for BookingStatus/CancelledBy/RecurrenceFrequency
- [ ] 2.10 Verify `src/seed.ts` is compatible with postgresql provider (currently minimal seed, no enum values or JSONB fields to validate)
- [ ] 2.11 Update `README.md`:
  - Replace SQLite references with PGlite
  - Update "Exports" section: `@dfs/database` uses PGlite with dataDir, `@dfs/database/testing` uses PGlite in-memory
  - Update "Prisma version and the PGlite adapter" section: note `pglite-prisma-adapter` is community-maintained
  - Remove Docker Postgres references if any (PGlite doesn't need Docker)
- [ ] 2.12 Update `packages/database/prisma.config.ts`:
  - Line 7: change default DATABASE_URL from `file:./data/app.db` to `pglite:./data/pglite`
  - Lines 8-12: update the `file:./` prefix parsing logic to handle `pglite:` paths (resolve relative to project root)
- [ ] 2.13 Update `prisma/prisma.config.ts`: change default `datasourceUrl` from `file:./data/app.db` to `pglite:./data/pglite` (line 4)

### 3. Environment Configuration

**Goal**: Update environment variables and validation for new DATABASE_URL format.

- [ ] 3.1 Update `.env.local`: set `DATABASE_URL=pglite:./data/pglite` (pglite: prefix, path will be parsed in client.ts)
- [ ] 3.2 Update `.env.example`: same as 3.1, update comment to explain PGlite dataDir format
- [ ] 3.3 Check `apps/api/src/env.ts`: if DATABASE_URL has regex validation, update to accept `pglite:` prefix (or remove validation if not needed)

### 4. Integration Tests Validation

**Goal**: Verify all integration tests pass with PGlite.

- [ ] 4.0 List all `*.integration.test.ts` files in the project → verify count matches expected (5 files: space-prisma, booking-prisma, booking-series-prisma, spaces, spaces-crud)
- [ ] 4.1 Run `bun test packages/spaces/infrastructure/space-prisma.repository.integration.test.ts` → verify green
- [ ] 4.2 Run `bun test packages/spaces/infrastructure/booking-prisma.repository.integration.test.ts` → verify green
- [ ] 4.3 Run `bun test packages/spaces/infrastructure/booking-series-prisma.repository.integration.test.ts` → verify green
- [ ] 4.4 Run `bun test apps/api/tests/spaces.integration.test.ts` → verify green
- [ ] 4.5 Run `bun test apps/api/tests/spaces-crud.integration.test.ts` → verify green
- [ ] 4.6 If failures due to SQLite/Postgres differences (ordering, casing, enum casting), fix minimally:
  - Check for explicit string casts on enum fields (`status as string`, `status === 'active'`)
  - Check for date/time formatting differences (DATETIME vs TIMESTAMP)
  - Check for JSON field access differences (TEXT vs JSONB)

### 5. Local Development Validation

**Goal**: Verify the API and webapp work end-to-end with PGlite.

- [ ] 5.1 Run `bun run lint:fix` → verify no lint errors
- [ ] 5.2 Run `bun run typecheck` → verify no type errors
- [ ] 5.3 Run `bun test` → verify all tests green (unit + integration)
- [ ] 5.4 Delete `apps/api/data/` directory if it exists (clean slate)
- [ ] 5.5 Run `bun run -F @dfs/database db:push` → verify schema pushed to PGlite
- [ ] 5.6 Run `bun run -F @dfs/database db:seed` → verify seed data created
- [ ] 5.7 Run `bun run api` in one terminal → verify API starts without errors
- [ ] 5.8 Run `bun run webapp` in another terminal → verify webapp starts
- [ ] 5.9 Open http://localhost:3000 → verify spaces load
- [ ] 5.10 Create a booking → verify success
- [ ] 5.11 Reload page → verify booking persists
- [ ] 5.12 Cancel booking → verify success
- [ ] 5.13 Stop API (Ctrl+C), restart `bun run api` → verify data persists (check `apps/api/data/pglite/` exists)
- [ ] 5.14 Delete `apps/api/data/pglite/`, restart API → verify clean start + `db:seed` works

### 6. Phase A Checkpoint

**Goal**: Commit Phase A changes and stop for human validation.

- [ ] 6.1 Human validation: all features work locally with PGlite (spaces load, bookings persist, tests pass)
- [ ] 6.2 Run `/task-validate` → verify lint, typecheck, tests all green
- [ ] 6.3 Run `/task-code-review` on `packages/database/src/` → verify no design violations
- [ ] 6.4 Run `/task-tests-review` on `packages/database/src/` → verify test quality
- [ ] 6.5 Run `/task-architecture-review` on `packages/database/` → verify no layer violations
- [ ] 6.6 Commit Phase A changes with message: `chore(database): migrate from SQLite to PGlite for local dev`
- [ ] 6.7 **STOP — do not proceed to Phase B until explicitly approved by human**

---

## Phase B — Production Deployment

**Prerequisites**:
- Phase A merged and validated
- Explicit human approval to proceed

### 7. Pre-Deployment Preparation

**Goal**: Update deployment documentation and scripts for PGlite.

- [ ] 7.1 SSH to VPS, backup `/opt/apps/shared-spaces-booking-system/apps/api/data/app.db` to `/root/backups/app.db.$(date +%Y%m%d)` (for reference, not restore)
- [ ] 7.2 Update `docs/deployment/initial-setup.md`:
  - Replace SQLite file path with PGlite dataDir: `mkdir -p apps/api/data/pglite`
  - Update DATABASE_URL format in env file example: `DATABASE_URL=pglite:./data/pglite`
  - Update backup instructions: `cp -r data/pglite/ data/pglite.backup/`
- [ ] 7.3 Update `docs/deployment/env-reference.md`:
  - Document DATABASE_URL format: `pglite:./data/pglite` (pglite: prefix + relative or absolute path)
  - Explain PGlite dataDir persistence model
- [ ] 7.4 Update `docs/deployment/runbook.md`:
  - Backup section: replace `cp app.db app.db.backup` with `cp -r data/pglite/ data/pglite.backup/`
  - Restore section: replace `cp app.db.backup app.db` with `cp -r data/pglite.backup/ data/pglite/`
- [ ] 7.5 Update `README.md`:
  - Replace SQLite references with PGlite in "Quick Reference" and "Operational Defaults"
  - Update deployment section: mention PGlite dataDir instead of SQLite file
- [ ] 7.6 Update `/root/deploy-shared-spaces.sh` on VPS:
  - Add logic to create `apps/api/data/pglite/` if it doesn't exist
  - Add logic to run `bun run -F @dfs/database db:push` on first deploy (when dataDir is empty)
  - Add logic to run `bun run -F @dfs/database db:seed` on first deploy

### 8. Production Deployment

**Goal**: Deploy PGlite to production VPS and seed fresh data.

- [ ] 8.1 SSH to VPS, update `DATABASE_URL` in `/etc/shared-spaces/api.env` to `pglite:/opt/apps/shared-spaces-booking-system/apps/api/data/pglite` (absolute path for production)
- [ ] 8.2 `cd /opt/apps/shared-spaces-booking-system && git pull` → pull Phase A changes
- [ ] 8.3 `bun install` → install new PGlite dependencies
- [ ] 8.4 Build webapp: `cd apps/webapp && VITE_API_URL=https://salas.espacioarroelo.es bun run build`
- [ ] 8.5 Stop API service: `systemctl stop shared-spaces-api`
- [ ] 8.6 Remove old SQLite files: `rm -rf apps/api/data/app.db*`
- [ ] 8.7 Create PGlite directory: `mkdir -p apps/api/data/pglite`
- [ ] 8.8 Run `bun run -F @dfs/database db:push` → create schema in PGlite
- [ ] 8.9 Run `bun run -F @dfs/database db:seed` → seed initial data (spaces, etc.)
- [ ] 8.10 Start API service: `systemctl start shared-spaces-api`
- [ ] 8.11 Check logs: `journalctl -u shared-spaces-api -n 50 --no-pager` → verify no errors

### 9. Production Validation

**Goal**: Verify the production webapp works end-to-end with PGlite.

- [ ] 9.1 Open https://salas.espacioarroelo.es → verify spaces visible
- [ ] 9.2 Create a booking → verify success
- [ ] 9.3 Reload page → verify booking persists
- [ ] 9.4 Cancel booking → verify success
- [ ] 9.5 Check `apps/api/data/pglite/` on VPS → verify directory exists with PGlite files (not empty)
- [ ] 9.6 Check logs again: `journalctl -u shared-spaces-api -n 100 --no-pager` → verify no errors during booking flow

### 10. Rollback Plan (if needed)

**Goal**: Document rollback steps in case Phase B fails.

- [ ] 10.1 If validation fails, SSH to VPS and run: `cd /opt/apps/shared-spaces-booking-system && git checkout <previous-commit-sha>`
- [ ] 10.2 Restore `DATABASE_URL=file:./data/app.db` in `/etc/shared-spaces/api.env`
- [ ] 10.3 Restore `app.db` from backup: `cp /root/backups/app.db.YYYYMMDD /opt/apps/shared-spaces-booking-system/apps/api/data/app.db`
- [ ] 10.4 Restart API service: `systemctl restart shared-spaces-api`
- [ ] 10.5 Verify old version works: open https://salas.espacioarroelo.es and check spaces load

### 11. Phase B Finalization

**Goal**: Commit Phase B changes and close the change.

- [ ] 11.1 Commit Phase B changes with message: `chore(deployment): update production to use PGlite`
- [ ] 11.2 Update `openspec/changes/pglite-migration/.openspec.yaml`: change `status: proposed` to `status: implemented`
- [ ] 11.3 Archive the change: move `openspec/changes/pglite-migration/` to `openspec/changes/archive/pglite-migration/`
- [ ] 11.4 Update `openspec/config.yaml` context if needed (already mentions PGlite, so likely no change)
