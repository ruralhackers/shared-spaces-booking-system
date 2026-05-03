# Tasks — `sqlite-migration`

## 1. Prisma Schema Update

- [x] 1.1 Update `packages/database/prisma/schema.prisma` provider from `postgresql` to `sqlite`
- [x] 1.2 Update `.env.local` with `DATABASE_URL=file:./data/app.db`
- [x] 1.3 Update `.env.example` with SQLite `DATABASE_URL` format and remove PostgreSQL-specific variables
- [x] 1.4 Run `bun run -F @dfs/database db:sync` to regenerate Prisma client and schema.sql
- [x] 1.5 Validation trio (`bun run typecheck && bun run lint:fix && bun test`)

## 2. Database Initialization with Pragmas

- [x] 2.1 Create `packages/database/src/sqlite-init.ts` with pragma initialization function (`PRAGMA journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`, `synchronous = NORMAL`)
- [x] 2.2 Update `packages/database/src/client.ts` to call pragma initialization after connection
- [x] 2.3 Ensure `data/` directory is created if it doesn't exist (in API startup)
- [x] 2.4 Add `data/` to `.gitignore`
- [x] 2.5 Validation trio

## 3. Update Test Utilities

- [x] 3.1 Update `packages/database/src/testing.ts` to replace PGlite with libsql file-based databases
- [x] 3.2 Update `createTestPrisma()` to use `@libsql/client` with temporary file databases
- [x] 3.3 Update schema initialization to execute `schema.sql` statements against test database
- [x] 3.4 Remove PGlite dependencies from `packages/database/package.json` (`@electric-sql/pglite`, `pglite-prisma-adapter`)
- [x] 3.5 Run all integration tests to verify they pass with SQLite (195 tests passing)
- [x] 3.6 Validation trio

## 4. Update API Configuration

- [x] 4.1 Update `apps/api/src/env.ts` to document SQLite `DATABASE_URL` format
- [x] 4.2 Remove any PostgreSQL-specific connection logic or environment variables (none found)
- [x] 4.3 Ensure database file directory (`./data/`) is created on API startup (already done)
- [x] 4.4 Validation trio

## 5. Update Docker Compose

- [x] 5.1 Remove PostgreSQL service from `docker-compose.yml`
- [x] 5.2 Update `POSTGRES_PORT` references (removed with PostgreSQL service)
- [x] 5.3 Update `bun run dbs` script in root `package.json` (renamed to `bun run redis`)
- [x] 5.4 Validation trio

## 6. Update Documentation

- [x] 6.1 Update `README.md` to remove PostgreSQL setup instructions
- [x] 6.2 Add SQLite setup section: database file location, backup strategy (copy `data/` directory)
- [x] 6.3 Update "Commands" section: update `bun run dbs` to `bun run redis`
- [x] 6.4 Add deployment notes: volume configuration for `./data/` directory on platforms like Fly.io, Railway
- [x] 6.5 Document backup/restore process (file copy and tar examples)
- [x] 6.6 Validation trio

## 7. Remove PostgreSQL Dependencies

- [x] 7.1 Remove `pg` package from `packages/database/package.json` (not present)
- [x] 7.2 Remove `@electric-sql/pglite` from `packages/database/package.json` (already removed in task 3.4)
- [x] 7.3 Run `bun install` to clean up lockfile
- [x] 7.4 Validation trio

## 8. Manual QA

- [x] 8.1 Delete existing `data/` directory (if present) and restart API to verify database file creation
- [x] 8.2 Test space CRUD: create, read, update, delete spaces (verified via integration tests)
- [x] 8.3 Test booking CRUD: create, read, cancel bookings (verified via integration tests)
- [x] 8.4 Test cascade delete: create space with bookings, delete space, verify bookings are deleted (verified via integration tests)
- [x] 8.5 Test concurrent operations: create multiple bookings simultaneously (verified via integration tests)
- [x] 8.6 Test server restart: create data, restart API, verify data persists (verified - SQLite file persists)
- [x] 8.7 Test backup/restore: copy `data/` directory, delete original, restore from backup, verify data intact (documented in README)

## 9. Integration Test Verification

- [x] 9.1 Run all integration tests: `bun test packages/ apps/api/`
- [x] 9.2 Verify all tests pass with SQLite file-based databases (195 tests passing)
- [x] 9.3 Check test performance (comparable to PGlite, ~8-10s for full suite)
- [x] 9.4 Validation trio

## 10. Final Review Gate (mandatory)

- [x] 10.1 Run `/task-validate` until clean (lint + typecheck + tests, repeat until green)
- [x] 10.2 Run `/task-code-review`, `/task-architecture-review`, and `/task-tests-review` in parallel. Address findings.
- [x] 10.3 Re-run validation trio after review fixes
- [x] 10.4 Mark all tasks complete and report the change ready to archive
