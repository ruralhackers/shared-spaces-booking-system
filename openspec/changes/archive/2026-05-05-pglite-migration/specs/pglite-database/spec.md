# Spec: pglite-database

## ADDED Requirements

### Requirement: The system SHALL use PGlite as embedded PostgreSQL database

#### Scenario: PGlite provides full PostgreSQL semantics
- **WHEN** Prisma schema uses `provider = "postgresql"`
- **THEN** it uses PostgreSQL types (TIMESTAMP, JSONB, real enums) instead of SQLite equivalents

#### Scenario: No separate server process required
- **WHEN** API server starts
- **THEN** PGlite runs embedded in the process (no Docker, no PostgreSQL service)

### Requirement: Production database SHALL persist to file-based dataDir

#### Scenario: Default dataDir location
- **WHEN** `DATABASE_URL` environment variable is not set
- **THEN** it defaults to `./data/pglite` relative to project root

#### Scenario: Custom dataDir from DATABASE_URL
- **WHEN** `DATABASE_URL` is set to a PGlite path
- **THEN** it connects to PGlite with dataDir at specified path

#### Scenario: DataDir creation on first start
- **WHEN** PGlite dataDir does not exist
- **AND** API server starts
- **THEN** it creates the directory and initializes an empty database

#### Scenario: Existing dataDir preserves data
- **WHEN** PGlite dataDir exists with data
- **AND** API server starts
- **THEN** it connects to the existing database and preserves all data

#### Scenario: Data persistence across restarts
- **WHEN** API server is stopped and restarted
- **THEN** all data persists (spaces, bookings, series)

### Requirement: Integration tests SHALL use in-memory PGlite instances

#### Scenario: In-memory instance creation
- **WHEN** `createTestPrisma()` is called
- **THEN** it returns a PrismaClient connected to an in-memory PGlite instance (no dataDir)

#### Scenario: Test isolation
- **WHEN** multiple test suites call `createTestPrisma()` in parallel
- **THEN** each gets an isolated in-memory PGlite instance with no shared state

#### Scenario: Test cleanup
- **WHEN** test suite completes
- **THEN** the in-memory instance is closed and all data is discarded

#### Scenario: Schema initialization in tests
- **WHEN** in-memory PGlite instance is created
- **AND** schema.sql is loaded
- **THEN** all tables, enums, and constraints are created

### Requirement: Schema SHALL use real PostgreSQL types

#### Scenario: JSONB for JSON fields
- **WHEN** `Space.openHours` field with type `Json` is queried via Prisma
- **THEN** it uses real JSONB type (not text) and supports JSON operators

#### Scenario: Real enum types
- **WHEN** Prisma generates client for enums (`BookingStatus`, `CancelledBy`, `RecurrenceFrequency`)
- **THEN** enum types are real PostgreSQL enums (CREATE TYPE ... AS ENUM)

#### Scenario: Timestamp types
- **WHEN** Prisma generates schema.sql
- **THEN** datetime fields use TIMESTAMP (not DATETIME)

#### Scenario: Foreign key enforcement
- **WHEN** schema with foreign keys is loaded
- **THEN** foreign keys are enforced by PGlite (no pragma initialization needed)

### Requirement: Backup and restore SHALL use directory copy

#### Scenario: Backup PGlite data
- **WHEN** backup is needed
- **THEN** copy entire `data/pglite/` directory (e.g., `cp -r data/pglite/ data/pglite.backup/`)

#### Scenario: Restore from backup
- **WHEN** restore is needed
- **THEN** copy backup directory to `data/pglite/` and restart API server

#### Scenario: Backup consistency
- **WHEN** backup is performed while API is running
- **THEN** backup may be inconsistent (stop API first for consistent backup)

### Requirement: System SHALL handle PGlite errors gracefully

#### Scenario: Non-writable dataDir
- **WHEN** PGlite dataDir is not writable
- **AND** API server starts
- **THEN** it throws an error and fails to start

#### Scenario: Corrupted dataDir
- **WHEN** PGlite dataDir is corrupted
- **AND** API server starts
- **THEN** it throws an error and fails to start (restore from backup)

#### Scenario: Invalid schema in tests
- **WHEN** integration test loads invalid schema.sql
- **THEN** `createTestPrisma()` throws an error and test fails

### Requirement: System SHALL NOT support multi-instance deployments

#### Scenario: Concurrent access to same dataDir
- **WHEN** multiple API server instances try to connect to the same PGlite dataDir
- **THEN** behavior is undefined (PGlite is single-process; use managed PostgreSQL for multi-instance)

### Requirement: System SHALL handle disk space limits

#### Scenario: Disk full during write
- **WHEN** database grows beyond available space on disk
- **THEN** write operations fail with disk full error

### Requirement: No automatic migration from SQLite

#### Scenario: Fresh start required
- **WHEN** migrating from existing SQLite database (`app.db`)
- **THEN** no automatic migration is provided (fresh start with `db:seed`)

## Non-functional Requirements

### Performance
- In-memory PGlite instances for tests SHOULD be faster than temp file SQLite databases
- Production PGlite with dataDir SHOULD have comparable performance to SQLite for read-heavy workloads
- JSONB queries SHOULD be faster than text-based JSON queries in SQLite

### Compatibility
- `pglite-prisma-adapter` MUST support the current Prisma version (7.8.0 or later)
- PGlite MUST run in Bun 1.x runtime
- Schema MUST be compatible with standard PostgreSQL (for future migration to managed Postgres)

### Operational Simplicity
- No separate server process required (embedded database)
- No Docker required for development or production
- Backup is a simple directory copy (no pg_dump needed)
- Restore is a simple directory copy (no pg_restore needed)

## Dependencies
- `@electric-sql/pglite` — PGlite WASM/Node implementation
- `pglite-prisma-adapter` — Prisma driver adapter for PGlite
- `@prisma/client` — Prisma client with postgresql provider

## Related Specs
- `space-management` — uses PGlite for space persistence
- `space-crud` — uses PGlite for CRUD operations

## Notes
- PGlite is embedded and single-process; not suitable for multi-instance deployments (use managed PostgreSQL for that)
- `pglite-prisma-adapter` is community-maintained and may lag Prisma releases
- Production data is not migrated from SQLite; fresh start with `db:seed` is required
