## MODIFIED Requirements

### Requirement: System SHALL expose a dynamic catalog of bookable spaces

The system SHALL provide a catalog of bookable spaces that can be managed by admins through the application. The catalog starts empty; admins create spaces via the admin UI. Spaces are persisted in the database and survive application restarts.

> **Change from v1:** The catalog is no longer seeded by migration. The two hardcoded spaces (`chill-house`, `call-room`) are removed. Admins create all spaces via the UI.

#### Scenario: Listing an empty catalog

- **WHEN** a client calls the spaces list endpoint on a fresh deployment
- **THEN** the response contains an empty array

#### Scenario: Listing spaces after admin creates them

- **WHEN** an admin has created spaces `"Sala S"`, `"Sala M"`, `"Sala L"`
- **AND** a client calls the spaces list endpoint
- **THEN** the response contains three entries with the created spaces

#### Scenario: Spaces survive application restarts

- **WHEN** the application restarts after spaces have been created
- **THEN** the same spaces remain available without any user action

### Requirement: A Space SHALL have a unique slug, display name, description, and open hours

Each space SHALL be uniquely identified by a kebab-case slug. The slug is auto-generated from the display name on creation and is immutable thereafter. The slug is the URL identifier used by the webapp (`/spaces/<slug>`) and the booking creation API.

Each space SHALL declare its weekly open hours as a per-day list of `HH:mm`–`HH:mm` windows in the configured timezone. An empty list for a day means the space is closed that day. Multiple windows model midday closures.

> **Change from v1:** Slug is now auto-generated from the display name, not manually specified in a migration.

#### Scenario: Slug uniqueness enforced on creation

- **WHEN** an admin creates two spaces with the same name
- **THEN** the second space receives a slug with a numeric suffix (e.g., `sala-s-2`)

#### Scenario: Slug is immutable after creation

- **WHEN** an admin edits a space's name
- **THEN** the slug remains unchanged

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

When the catalog is empty, the homepage SHALL display a friendly empty state message.

> **Change from v1:** Added empty state handling since the catalog can now be empty.

#### Scenario: All spaces visible on first paint

- **WHEN** a resident loads the homepage and spaces exist
- **THEN** all spaces are visible without further interaction

#### Scenario: Clicking a space opens its day view

- **WHEN** a resident clicks a space entry
- **THEN** the webapp navigates to `/spaces/<slug>` for that space

#### Scenario: Loading state is shown while fetching

- **WHEN** the homepage is loading the spaces list
- **THEN** skeleton placeholder cards are shown instead of empty content

#### Scenario: Error state is shown on fetch failure

- **WHEN** the spaces list query fails
- **THEN** a human-readable error message is displayed

#### Scenario: Empty state is shown when no spaces exist

- **WHEN** the homepage loads and no spaces have been created
- **THEN** a friendly message is displayed (e.g., "No spaces available yet")

## REMOVED Requirements

### Requirement: System SHALL expose a fixed catalog of bookable spaces

**Reason:** Replaced by dynamic catalog managed by admins. The fixed, seeded catalog is no longer needed.

**Migration:** Remove seed inserts from `seed.ts`. Admins create spaces via `/admin/spaces`.
