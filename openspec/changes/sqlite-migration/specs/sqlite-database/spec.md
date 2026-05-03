# Spec: sqlite-database

## ADDED Requirements

### Requirement: SQLite as primary database
The system SHALL use SQLite as the primary database for all data storage.

#### Scenario: Database file creation
- **WHEN** the API server starts for the first time
- **THEN** a SQLite database file is created at `./data/app.db`

#### Scenario: Database connection
- **WHEN** the API server starts
- **THEN** the system connects to the SQLite database using the `DATABASE_URL` environment variable

#### Scenario: Schema initialization
- **WHEN** the database file is created
- **THEN** the system applies the Prisma schema to create all tables and indexes

### Requirement: WAL mode enabled
The system SHALL enable Write-Ahead Logging (WAL) mode for concurrent read/write access.

#### Scenario: WAL mode initialization
- **WHEN** the database connection is established
- **THEN** the system executes `PRAGMA journal_mode = WAL`

#### Scenario: Concurrent reads during write
- **WHEN** a write operation is in progress
- **THEN** read operations can proceed without blocking

### Requirement: Foreign key constraints enforced
The system SHALL enforce foreign key constraints to maintain referential integrity.

#### Scenario: Foreign key enforcement
- **WHEN** the database connection is established
- **THEN** the system executes `PRAGMA foreign_keys = ON`

#### Scenario: Cascade delete
- **WHEN** a space is deleted
- **THEN** all associated bookings are automatically deleted (cascade)

### Requirement: Busy timeout configured
The system SHALL retry database operations for up to 5 seconds if the database is locked.

#### Scenario: Busy timeout initialization
- **WHEN** the database connection is established
- **THEN** the system executes `PRAGMA busy_timeout = 5000`

#### Scenario: Concurrent write retry
- **WHEN** a write operation encounters a locked database
- **THEN** the system retries for up to 5 seconds before failing

### Requirement: Data persistence
The system SHALL persist all data to the SQLite database file.

#### Scenario: Data survives server restart
- **WHEN** data is written to the database
- **AND** the server is restarted
- **THEN** the data is still present in the database

#### Scenario: WAL checkpoint
- **WHEN** the server shuts down gracefully
- **THEN** all WAL data is checkpointed to the main database file

### Requirement: Integration tests use in-memory SQLite
The system SHALL use SQLite `:memory:` mode for integration tests.

#### Scenario: Test database isolation
- **WHEN** an integration test runs
- **THEN** it uses an isolated in-memory SQLite database

#### Scenario: Test database cleanup
- **WHEN** an integration test completes
- **THEN** the in-memory database is automatically discarded

#### Scenario: Test schema initialization
- **WHEN** an integration test starts
- **THEN** the system applies the Prisma schema to the in-memory database

### Requirement: Database file location configurable
The system SHALL allow the database file location to be configured via environment variable.

#### Scenario: Custom database path
- **WHEN** `DATABASE_URL=file:./custom/path/db.sqlite` is set
- **THEN** the system uses the specified path for the database file

#### Scenario: Default database path
- **WHEN** `DATABASE_URL` is not set or uses default value
- **THEN** the system uses `./data/app.db` as the database file location

### Requirement: Backup via file copy
The system SHALL support backups by copying the database file and associated WAL files.

#### Scenario: Backup all files
- **WHEN** creating a backup
- **THEN** the backup includes `app.db`, `app.db-wal`, and `app.db-shm` files

#### Scenario: Restore from backup
- **WHEN** restoring from a backup
- **THEN** copying the backup files to the data directory restores the database

### Requirement: No PostgreSQL dependency
The system SHALL NOT require PostgreSQL or Docker for database operations.

#### Scenario: Development without Docker
- **WHEN** a developer clones the repository
- **THEN** they can run the application without starting Docker Compose

#### Scenario: Production deployment
- **WHEN** deploying to production
- **THEN** no PostgreSQL service or connection is required

### Requirement: Existing functionality preserved
The system SHALL maintain all existing database functionality after migrating to SQLite.

#### Scenario: Space CRUD operations
- **WHEN** performing space create, read, update, delete operations
- **THEN** all operations work identically to PostgreSQL implementation

#### Scenario: Booking CRUD operations
- **WHEN** performing booking create, read, update, delete operations
- **THEN** all operations work identically to PostgreSQL implementation

#### Scenario: Cascade delete behavior
- **WHEN** deleting a space with bookings
- **THEN** all associated bookings are deleted (same as PostgreSQL)

#### Scenario: CUID primary keys
- **WHEN** creating new records
- **THEN** CUID primary keys are generated correctly

#### Scenario: JSON field storage
- **WHEN** storing `openHours` JSON data
- **THEN** the data is stored and retrieved correctly
