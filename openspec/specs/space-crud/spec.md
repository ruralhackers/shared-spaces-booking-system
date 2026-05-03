## ADDED Requirements

### Requirement: An admin SHALL be able to create a new space

The system SHALL expose an admin-only tRPC procedure `spaces.create` that accepts `{ name, description, openHours }` and creates a new space. The slug SHALL be auto-generated from the name using kebab-case conversion. If the generated slug already exists, the system SHALL append `-2`, `-3`, etc. until a unique slug is found (max 100 attempts).

The name SHALL be 2–100 characters. The description is optional (defaults to empty string). The openHours SHALL be validated (see open hours validation requirement).

#### Scenario: Creating a space with a unique name

- **WHEN** an admin creates a space with name `"Sala S"` and valid open hours
- **THEN** the space is created with slug `"sala-s"`
- **AND** the response includes the generated slug

#### Scenario: Creating a space with a name that collides

- **WHEN** a space with slug `"sala-s"` already exists
- **AND** an admin creates a space with name `"Sala S"`
- **THEN** the space is created with slug `"sala-s-2"`

#### Scenario: Creating a space with accented characters

- **WHEN** an admin creates a space with name `"Café Lounge"`
- **THEN** the space is created with slug `"cafe-lounge"` (accents stripped)

#### Scenario: Creating a space with a name that is too short

- **WHEN** an admin creates a space with name `"A"` (1 character)
- **THEN** the request fails with `ValidationError`

#### Scenario: Creating a space with a name that is too long

- **WHEN** an admin creates a space with name longer than 100 characters
- **THEN** the request fails with `ValidationError`

#### Scenario: Non-admin cannot create a space

- **WHEN** a request without a valid `x-admin-key` header calls `spaces.create`
- **THEN** the request fails with `UnauthorizedError`

### Requirement: An admin SHALL be able to edit an existing space

The system SHALL expose an admin-only tRPC procedure `spaces.update` that accepts `{ slug, name?, description?, openHours? }` and updates the specified space. The slug is used to identify the space and SHALL NOT be changed. Only provided fields are updated; omitted fields remain unchanged.

#### Scenario: Updating a space's name

- **WHEN** an admin updates space `"sala-s"` with name `"Sala Small"`
- **THEN** the space's display name becomes `"Sala Small"`
- **AND** the slug remains `"sala-s"`

#### Scenario: Updating a space's description

- **WHEN** an admin updates space `"sala-s"` with description `"A cozy room for small meetings"`
- **THEN** the space's description is updated

#### Scenario: Updating a space's open hours

- **WHEN** an admin updates space `"sala-s"` with new open hours
- **THEN** the space's open hours are replaced with the new value
- **AND** existing bookings are not affected (they remain valid even if now outside new hours)

#### Scenario: Updating a non-existent space

- **WHEN** an admin updates a space with slug `"does-not-exist"`
- **THEN** the request fails with `SpaceNotFoundError`

#### Scenario: Non-admin cannot update a space

- **WHEN** a request without a valid `x-admin-key` header calls `spaces.update`
- **THEN** the request fails with `UnauthorizedError`

### Requirement: An admin SHALL be able to delete a space

The system SHALL expose an admin-only tRPC procedure `spaces.delete` that accepts `{ slug }` and permanently deletes the space. All bookings associated with the space SHALL be deleted (hard delete, cascade).

#### Scenario: Deleting a space with no bookings

- **WHEN** an admin deletes space `"sala-s"` which has no bookings
- **THEN** the space is removed from the database
- **AND** `spaces.list` no longer includes it

#### Scenario: Deleting a space with active bookings

- **WHEN** an admin deletes space `"sala-s"` which has 3 active bookings
- **THEN** the space is removed from the database
- **AND** all 3 bookings are also deleted (cascade)

#### Scenario: Deleting a non-existent space

- **WHEN** an admin deletes a space with slug `"does-not-exist"`
- **THEN** the request fails with `SpaceNotFoundError`

#### Scenario: Non-admin cannot delete a space

- **WHEN** a request without a valid `x-admin-key` header calls `spaces.delete`
- **THEN** the request fails with `UnauthorizedError`

### Requirement: Open hours SHALL be validated on create and update

Open hours are represented as a per-day object with keys `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`. Each day maps to an array of time windows `[{ start: "HH:mm", end: "HH:mm" }]`.

Validation rules:
- Each window's `start` and `end` SHALL be in `HH:mm` format (00:00–24:00).
- Each window's `end` SHALL be strictly greater than `start` (no zero or negative duration).
- Windows within the same day SHALL NOT overlap.
- An empty array for a day means the space is closed that day.
- `24:00` is allowed as an end time to represent "end of day".

#### Scenario: Valid 24/7 open hours

- **WHEN** an admin creates a space with all days set to `[{ start: "00:00", end: "24:00" }]`
- **THEN** the space is created successfully

#### Scenario: Valid business hours

- **WHEN** an admin creates a space with Monday set to `[{ start: "09:00", end: "17:00" }]`
- **THEN** the space is created successfully

#### Scenario: Valid split hours (midday closure)

- **WHEN** an admin creates a space with Monday set to `[{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }]`
- **THEN** the space is created successfully

#### Scenario: Invalid time format rejected

- **WHEN** an admin creates a space with a window `{ start: "9:00", end: "17:00" }` (missing leading zero)
- **THEN** the request fails with `ValidationError`

#### Scenario: Zero-duration window rejected

- **WHEN** an admin creates a space with a window `{ start: "09:00", end: "09:00" }`
- **THEN** the request fails with `ValidationError`

#### Scenario: Negative-duration window rejected

- **WHEN** an admin creates a space with a window `{ start: "17:00", end: "09:00" }`
- **THEN** the request fails with `ValidationError`

#### Scenario: Overlapping windows rejected

- **WHEN** an admin creates a space with Monday set to `[{ start: "09:00", end: "14:00" }, { start: "12:00", end: "18:00" }]`
- **THEN** the request fails with `ValidationError` indicating overlapping windows

#### Scenario: Closed day is valid

- **WHEN** an admin creates a space with Sunday set to `[]`
- **THEN** the space is created successfully with Sunday marked as closed

### Requirement: The webapp SHALL provide an admin UI for space management

The webapp SHALL provide routes for admins to manage spaces:
- `/admin/spaces` — list all spaces with create and delete actions
- `/admin/spaces/new` — form to create a new space
- `/admin/spaces/$slug/edit` — form to edit an existing space

These routes SHALL be protected by the same admin key mechanism as `/admin` (redirect to `/` if no `?key=` parameter).

#### Scenario: Admin spaces list shows all spaces

- **WHEN** an admin visits `/admin/spaces?key=<valid>`
- **THEN** the page displays a list of all spaces with name, slug, and description

#### Scenario: Admin can navigate to create form

- **WHEN** an admin clicks "Create space" on `/admin/spaces`
- **THEN** the webapp navigates to `/admin/spaces/new`

#### Scenario: Admin can create a space via form

- **WHEN** an admin fills in name, description, and open hours on `/admin/spaces/new` and submits
- **THEN** the space is created and the admin is redirected to `/admin/spaces`
- **AND** a success toast is shown

#### Scenario: Admin can navigate to edit form

- **WHEN** an admin clicks "Edit" on a space row in `/admin/spaces`
- **THEN** the webapp navigates to `/admin/spaces/$slug/edit`

#### Scenario: Admin can edit a space via form

- **WHEN** an admin modifies fields on `/admin/spaces/$slug/edit` and submits
- **THEN** the space is updated and the admin is redirected to `/admin/spaces`
- **AND** a success toast is shown

#### Scenario: Admin can delete a space with confirmation

- **WHEN** an admin clicks "Delete" on a space row in `/admin/spaces`
- **THEN** a confirmation dialog appears warning that all bookings will be deleted
- **AND** if confirmed, the space is deleted and removed from the list

#### Scenario: Visiting admin spaces without key redirects

- **WHEN** a visitor opens `/admin/spaces` without a `?key=` parameter
- **THEN** the router redirects them to `/`

### Requirement: The webapp SHALL provide an open hours editor component

The webapp SHALL provide an `OpenHoursEditor` component for configuring per-day time windows. The editor SHALL display all 7 days with the ability to add, remove, and edit windows for each day.

#### Scenario: Editor displays all 7 days

- **WHEN** the open hours editor is rendered
- **THEN** it displays sections for Monday through Sunday

#### Scenario: Adding a window to a day

- **WHEN** an admin clicks "Add window" on Monday
- **THEN** a new window row appears with empty start and end time inputs

#### Scenario: Removing a window from a day

- **WHEN** an admin clicks "Remove" on a window row
- **THEN** the window is removed from that day

#### Scenario: Setting a day to 24 hours

- **WHEN** an admin clicks "Open 24h" checkbox on Monday
- **THEN** Monday's windows are replaced with `[{ start: "00:00", end: "24:00" }]`

#### Scenario: Inline validation shows errors

- **WHEN** an admin enters overlapping windows
- **THEN** an inline error message is displayed before form submission
