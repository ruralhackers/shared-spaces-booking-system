## ADDED Requirements

### Requirement: A booking SHALL belong to a single space and a single calendar day in the configured timezone

Each booking SHALL reference exactly one space and SHALL have a start and end instant such that both fall on the same calendar day in the configured application timezone. Bookings spanning midnight SHALL be rejected at the application layer.

#### Scenario: Booking within a single day is accepted

- **WHEN** a client creates a booking for `chill-house` from 14:00 to 16:00 in the configured timezone on a given date
- **THEN** the booking is persisted and returned with `status = "active"`

#### Scenario: Booking that crosses midnight is rejected

- **WHEN** a client creates a booking from 23:30 to 00:30 in the configured timezone
- **THEN** the request fails with a `ValidationError` and no booking is persisted

### Requirement: A booking SHALL have a positive duration and lie within the space's open hours

A booking's `endsAt` SHALL be strictly after its `startsAt` (zero-duration bookings are rejected). The full `[startsAt, endsAt)` interval SHALL be contained within at least one open-hours window for the booking's day on that space.

#### Scenario: Zero-duration booking is rejected

- **WHEN** a client creates a booking with `startsAt == endsAt`
- **THEN** the request fails with a `ValidationError`

#### Scenario: Negative-duration booking is rejected

- **WHEN** a client creates a booking with `endsAt` before `startsAt`
- **THEN** the request fails with a `ValidationError`

#### Scenario: Booking outside open hours is rejected

- **WHEN** a client creates a booking from 06:00 to 07:00 on a space whose Monday open hours start at 07:00
- **THEN** the request fails with `OutsideOpenHoursError` and no booking is persisted

#### Scenario: Booking that straddles a closure is rejected

- **WHEN** a space has Monday windows `[{07:00–12:00}, {14:00–23:00}]` and a client books 11:00–14:30
- **THEN** the request fails with `OutsideOpenHoursError`

### Requirement: The system SHALL prevent overlapping bookings on the same space

Two active bookings on the same space MUST NOT have overlapping `[startsAt, endsAt)` intervals. The first persisted booking wins; subsequent overlapping requests SHALL be rejected with `BookingOverlapError`. Cancelled bookings do not count toward overlap.

#### Scenario: Second overlapping booking is rejected

- **WHEN** a booking exists for `call-room` from 10:00 to 11:00
- **AND** a client creates a second booking for `call-room` from 10:30 to 11:30
- **THEN** the second request fails with `BookingOverlapError`

#### Scenario: Adjacent bookings are accepted

- **WHEN** a booking exists for `call-room` from 10:00 to 11:00
- **AND** a client creates a second booking for `call-room` from 11:00 to 12:00
- **THEN** the second booking is accepted

#### Scenario: Cancelled bookings free their slot

- **WHEN** a booking for `call-room` from 10:00 to 11:00 has been cancelled
- **AND** a client creates a new booking for `call-room` from 10:00 to 11:00
- **THEN** the new booking is accepted

#### Scenario: Concurrent overlapping requests are resolved deterministically

- **WHEN** two clients submit overlapping booking requests for the same space at the same time
- **THEN** exactly one succeeds and the other receives `BookingOverlapError`

### Requirement: A booking SHALL be tagged with a normalized booker name

Each booking SHALL carry a `bookerName` value object created from a free-text input. The normalized form trims surrounding whitespace, collapses internal whitespace to single spaces, and preserves original casing for display. The normalized name SHALL be 2–60 characters long and SHALL NOT contain `<` or `>`. Equality comparisons (used for cancellation) operate on the normalized form, case-insensitively.

#### Scenario: Whitespace-only name is rejected

- **WHEN** a client submits a booking with `bookerName = "   "`
- **THEN** the request fails with a `ValidationError`

#### Scenario: Name shorter than two characters is rejected

- **WHEN** a client submits a booking with `bookerName = "A"`
- **THEN** the request fails with a `ValidationError`

#### Scenario: Name longer than 60 characters is rejected

- **WHEN** a client submits a booking with a 61-character `bookerName`
- **THEN** the request fails with a `ValidationError`

#### Scenario: Names with angle brackets are rejected

- **WHEN** a client submits a booking with `bookerName = "<script>"`
- **THEN** the request fails with a `ValidationError`

#### Scenario: Surrounding whitespace is trimmed for storage

- **WHEN** a client submits a booking with `bookerName = "  Ana Pérez  "`
- **THEN** the persisted booking exposes `bookerName = "Ana Pérez"`

### Requirement: A booker SHALL be able to cancel their own booking by re-entering the exact name

The system SHALL provide a public cancellation endpoint that accepts a booking id and a booker name. The cancellation succeeds only when the supplied name matches the booking's stored name after normalization, case-insensitively. On success the booking transitions to `status = "cancelled"`. On mismatch the request fails with `NameMismatchError` and the booking remains active.

#### Scenario: Exact-match cancellation succeeds

- **WHEN** a booking exists with `bookerName = "Ana Pérez"`
- **AND** a client cancels with `bookerName = "Ana Pérez"`
- **THEN** the booking's status becomes `cancelled`

#### Scenario: Case-insensitive match succeeds

- **WHEN** a booking exists with `bookerName = "Ana Pérez"`
- **AND** a client cancels with `bookerName = "ana pérez"`
- **THEN** the cancellation succeeds

#### Scenario: Whitespace differences are tolerated

- **WHEN** a booking exists with `bookerName = "Ana Pérez"`
- **AND** a client cancels with `bookerName = "  Ana   Pérez  "`
- **THEN** the cancellation succeeds

#### Scenario: Name mismatch is rejected

- **WHEN** a booking exists with `bookerName = "Ana Pérez"`
- **AND** a client cancels with `bookerName = "Ana"`
- **THEN** the request fails with `NameMismatchError` and the booking remains `active`

#### Scenario: Cancelling a missing booking fails

- **WHEN** a client cancels a booking id that does not exist
- **THEN** the request fails with `BookingNotFoundError`

#### Scenario: Cancelling an already-cancelled booking is rejected

- **WHEN** a client cancels a booking that is already `cancelled`
- **THEN** the request fails with a `BusinessRuleError`

### Requirement: The system SHALL expose a per-space day view

The system SHALL expose a query that returns, for a given space slug and a given calendar date in the configured timezone, the space metadata, that day's open-hours windows, and all active bookings whose interval intersects that day.

#### Scenario: Day view returns active bookings only

- **WHEN** a space has one active and one cancelled booking on a given date
- **THEN** the day view for that date contains only the active booking

#### Scenario: Day view includes the day's open hours

- **WHEN** a client requests the day view for `chill-house` on a Monday
- **THEN** the response includes the Monday entry from the space's `openHours`

#### Scenario: Day view for a future date with no bookings

- **WHEN** a client requests the day view for any date with no bookings
- **THEN** the response succeeds with an empty `bookings` array

#### Scenario: Day view for an unknown space

- **WHEN** a client requests the day view for a slug that does not exist
- **THEN** the response fails with `SpaceNotFoundError`

### Requirement: The webapp SHALL provide a booking flow on the per-space day view

The webapp route `/spaces/$slug` SHALL render the day's bookings as a flat list and provide a form with three fields — booker name, start time (`<input type="time">`), end time (`<input type="time">`) — that submits a booking creation request. On success the day-view query is invalidated and refetched, and a toast confirmation is shown. On domain failure a toast error is shown.

The form SHALL include a "Set to now" control that pre-fills the start time with the current hour (`:00`) and the end time with the next hour, so residents can quickly book the current slot.

The route SHALL also provide an inline cancel control on each active booking row: a name input and a cancel button. On success the day-view query is invalidated and a toast confirmation is shown. On name mismatch a toast error is shown.

The route SHALL provide day navigation controls — previous day, next day, a date picker, and a "Today" shortcut — so residents can browse bookings across any date.

> **Note (v1 decision):** The vertical timeline with 30-minute visual rows described in the original design was deferred in favour of a simpler flat list. The flat list is sufficient for the current audience size and avoids the complexity of pixel-mapping time ranges to a scrollable grid.

#### Scenario: Successful booking refreshes the day view

- **WHEN** a resident submits a valid booking on `/spaces/chill-house`
- **THEN** the new booking appears in the list without a full-page reload
- **AND** a success toast is shown

#### Scenario: Overlap error is shown as a toast

- **WHEN** a resident submits a booking that overlaps an existing one
- **THEN** a toast displays the overlap error message

#### Scenario: Submit button is disabled during the request

- **WHEN** a resident submits the booking form
- **THEN** the submit button is disabled until the request resolves

#### Scenario: Cancel from the day view succeeds

- **WHEN** a resident enters the matching booker name and confirms cancellation on a booking row
- **THEN** the row disappears from the list after refetch
- **AND** a success toast is shown

#### Scenario: "Set to now" pre-fills the time fields

- **WHEN** a resident clicks "Set to now" on the booking form
- **THEN** the start time is set to the current hour (HH:00) and the end time to the next hour

#### Scenario: Day navigation moves to the previous or next day

- **WHEN** a resident clicks the previous-day or next-day arrow
- **THEN** the date changes by one day and the bookings list reloads for the new date

#### Scenario: "Today" shortcut returns to the current date

- **WHEN** a resident clicks "Today" after navigating to a different date
- **THEN** the date resets to today in the configured timezone
