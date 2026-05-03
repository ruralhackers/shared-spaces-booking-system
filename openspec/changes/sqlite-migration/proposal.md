# Proposal: sqlite-migration

## Why

PostgreSQL adds deployment complexity (requires Docker or managed service, connection pooling, backups). For a small-scale booking system with a single deployment, SQLite offers simpler operations: single-file database, no separate server process, built-in backups via file copy, and excellent performance for read-heavy workloads. This reduces infrastructure overhead and makes the application easier to deploy and maintain.

## What Changes

- Replace PostgreSQL with SQLite as the primary database
- Update Prisma schema to use SQLite provider
- Replace PGlite in-memory testing with SQLite `:memory:` mode
- Update database connection configuration in `apps/api`
- Remove Docker Compose PostgreSQL service
- Update deployment documentation for SQLite file management
- Ensure all existing features work identically with SQLite

## Capabilities

### New Capabilities
- `sqlite-database`: SQLite as primary database with file-based storage and backup strategy

### Modified Capabilities
<!-- No existing capabilities require spec-level changes - database is an implementation detail -->

## Impact

**Affected packages:**
- `@dfs/database` — Prisma schema provider change, connection setup, test utilities

**Affected apps:**
- `apps/api` — database connection configuration, environment variables

**Infrastructure:**
- Remove `docker-compose.yml` PostgreSQL service (or make it optional)
- SQLite database file location and backup strategy
- Development workflow changes (no `bun run dbs` needed)

**Dependencies:**
- Remove `pg` driver dependency
- Add `better-sqlite3` (if not already included by Prisma)
- Update Prisma to ensure SQLite support is enabled

**Breaking changes:**
- **BREAKING**: Existing PostgreSQL databases cannot be automatically migrated; requires data export/import
- **BREAKING**: `DATABASE_URL` format changes from `postgresql://...` to `file:./data/app.db`

## Non-goals

- Multi-database support (PostgreSQL + SQLite)
- Automatic data migration from PostgreSQL to SQLite
- Distributed/replicated SQLite setup
- PostgreSQL-specific features (e.g., full-text search, advanced indexing)
- Performance optimization beyond SQLite defaults
