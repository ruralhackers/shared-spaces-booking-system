## ADDED Requirements

### Requirement: System SHALL expose a fixed catalog of bookable spaces

The system SHALL provide a read-only catalog of bookable spaces. The catalog is seeded by migration and not editable through the application; introducing or removing a space requires a database migration.

For v1 the catalog contains exactly two spaces:
- `chill-house` — display name "Chill House", a lounge for relaxed hangouts.
- `call-room` — display name "Call Room", a quiet room for video calls.

#### Scenario: Listing the seeded catalog

- **WHEN** a client calls the spaces list endpoint
- **THEN** the response contains exactly two entries with slugs `chill-house` and `call-room`, each with `displayName`, `description`, and `openHours`

#### Scenario: Spaces survive application restarts

- **WHEN** the application restarts after a database is freshly seeded
- **THEN** the same two spaces remain available without any user action

#### Scenario: No write API for spaces

- **WHEN** any client attempts to create, update, or delete a space through the public or admin API
- **THEN** no such endpoint exists; the action is impossible without a database migration

### Requirement: A Space SHALL have a unique slug, display name, description, and open hours

Each space SHALL be uniquely identified by a kebab-case slug. The slug is the URL identifier used by the webapp (`/spaces/<slug>`) and the booking creation API.

Each space SHALL declare its weekly open hours as a per-day list of `HH:mm`–`HH:mm` windows in the configured timezone. An empty list for a day means the space is closed that day. Multiple windows model midday closures.

#### Scenario: Slug uniqueness

- **WHEN** the seed migration runs against an empty database
- **THEN** every inserted space has a slug not present on any other space

#### Scenario: Open hours represent a full week

- **WHEN** a space is read from the catalog
- **THEN** its `openHours` field has exactly seven entries keyed by `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`

#### Scenario: A day with no windows is closed

- **WHEN** a space has `openHours.sun = []`
- **THEN** the booking system rejects any attempt to book that space on a Sunday with `OutsideOpenHoursError`

#### Scenario: Multiple windows model a midday closure

- **WHEN** a space has `openHours.mon = [{start: "07:00", end: "12:00"}, {start: "14:00", end: "23:00"}]`
- **THEN** a booking from 12:30 to 13:30 on a Monday is rejected with `OutsideOpenHoursError`
- **AND** a booking from 10:00 to 11:00 on a Monday is accepted (subject to other invariants)

### Requirement: The webapp SHALL display the catalog on the homepage

The webapp homepage SHALL render every space in the catalog with its display name and description. Each space entry SHALL link to the per-space day view at `/spaces/<slug>`. The list SHALL show a skeleton loading state while the query is in flight and an error message if the query fails.

> **Note (v1 decision):** Real-time `Free` / `Busy until HH:mm` status was deferred. The `spaces.list` tRPC procedure does not return current booking state; computing it would require an additional query per space on every homepage load. This can be added in a future change by extending `SpaceDto` with an optional `currentBooking` field populated by the lister service.

#### Scenario: All spaces visible on first paint

- **WHEN** a resident loads the homepage
- **THEN** both `chill-house` and `call-room` are visible without further interaction

#### Scenario: Clicking a space opens its day view

- **WHEN** a resident clicks a space entry
- **THEN** the webapp navigates to `/spaces/<slug>` for that space

#### Scenario: Loading state is shown while fetching

- **WHEN** the homepage is loading the spaces list
- **THEN** skeleton placeholder cards are shown instead of empty content

#### Scenario: Error state is shown on fetch failure

- **WHEN** the spaces list query fails
- **THEN** a human-readable error message is displayed
