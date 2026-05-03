## ADDED Requirements

### Requirement: A booking series SHALL define a recurrence pattern with daily or weekly frequency

A booking series SHALL specify a frequency (`daily` or `weekly`), a start time and end time (same for all occurrences), a first occurrence date, and an end date. Weekly series repeat on the same weekday as the first occurrence. The system SHALL materialize all occurrences as individual `Booking` rows linked by a `seriesId`.

#### Scenario: Daily series creates one booking per day

- **WHEN** a user creates a daily series from 2026-06-01 to 2026-06-05 at 10:00–11:00
- **THEN** the system creates 5 bookings (one per day) all with `seriesId` referencing the series

#### Scenario: Weekly series creates one booking per week on the same weekday

- **WHEN** a user creates a weekly series starting Tuesday 2026-06-02 until 2026-06-23 at 17:00–18:00
- **THEN** the system creates 4 bookings (2026-06-02, 2026-06-09, 2026-06-16, 2026-06-23) all on Tuesdays

#### Scenario: Series with end date inclusive

- **WHEN** a user creates a daily series from 2026-06-01 to 2026-06-03
- **THEN** the system creates bookings for 2026-06-01, 2026-06-02, and 2026-06-03 (3 total)

### Requirement: A booking series SHALL enforce hard limits of 1 year duration and 365 occurrences

The system SHALL reject any series where the end date is more than 1 year after the first occurrence date, or where the total number of occurrences exceeds 365, whichever is stricter.

#### Scenario: Series exceeding 1 year is rejected

- **WHEN** a user creates a daily series from 2026-06-01 to 2027-06-02
- **THEN** the request fails with a `ValidationError`

#### Scenario: Series exceeding 365 occurrences is rejected

- **WHEN** a user creates a daily series from 2026-06-01 with 366 occurrences
- **THEN** the request fails with a `ValidationError`

#### Scenario: Series at the limit is accepted

- **WHEN** a user creates a daily series from 2026-06-01 to 2027-05-31 (364 days)
- **THEN** the series is created successfully

### Requirement: The system SHALL accept end date or occurrence count and normalize to end date

The user MAY specify the series end as either an explicit end date or a number of occurrences. The system SHALL normalize occurrence count to an end date internally. The end date is inclusive (the last occurrence falls on that date).

#### Scenario: End date is used directly

- **WHEN** a user creates a weekly series starting 2026-06-02 with end date 2026-06-23
- **THEN** the system creates occurrences up to and including 2026-06-23

#### Scenario: Occurrence count is converted to end date

- **WHEN** a user creates a daily series starting 2026-06-01 with 5 occurrences
- **THEN** the system calculates end date as 2026-06-05 and creates 5 bookings

#### Scenario: Weekly occurrence count skips non-matching weekdays

- **WHEN** a user creates a weekly series starting Tuesday 2026-06-02 with 3 occurrences
- **THEN** the system creates bookings for 2026-06-02, 2026-06-09, 2026-06-16 (3 Tuesdays)

### Requirement: The system SHALL skip occurrences that conflict with existing bookings or open hours

When materializing a series, the system SHALL attempt to create each occurrence as a `Booking`. If an occurrence overlaps an existing active booking or falls outside the space's open hours, the system SHALL skip that occurrence and record the reason. If all occurrences are skipped, the system SHALL reject the series with `EmptySeriesError`.

#### Scenario: Overlapping occurrence is skipped

- **WHEN** a user creates a daily series from 2026-06-01 to 2026-06-03 at 10:00–11:00
- **AND** an existing booking occupies 2026-06-02 at 10:00–11:00
- **THEN** the system creates bookings for 2026-06-01 and 2026-06-03, and reports 2026-06-02 as skipped with reason "overlap"

#### Scenario: Occurrence outside open hours is skipped

- **WHEN** a user creates a daily series from 2026-06-01 to 2026-06-03 at 06:00–07:00
- **AND** the space opens at 07:00 on all days
- **THEN** all occurrences are skipped and the request fails with `EmptySeriesError`

#### Scenario: Partial series with some valid occurrences succeeds

- **WHEN** a user creates a weekly series with 4 occurrences
- **AND** 2 occurrences overlap existing bookings
- **THEN** the system creates 2 bookings and reports 2 skipped occurrences

#### Scenario: Series with all occurrences skipped is rejected

- **WHEN** a user creates a series where every occurrence conflicts
- **THEN** the request fails with `EmptySeriesError` and no bookings are created

### Requirement: The system SHALL return a summary of created and skipped occurrences

The series creation response SHALL include:
- `seriesId`: the unique identifier of the created series
- `created`: array of `BookingDto` for successfully created occurrences
- `skipped`: array of `{ date, reason }` for occurrences that could not be created

#### Scenario: Successful series with no skips

- **WHEN** a user creates a daily series with 3 occurrences and all succeed
- **THEN** the response contains `created` with 3 bookings and `skipped` as an empty array

#### Scenario: Partial series reports skipped dates

- **WHEN** a user creates a series with 5 occurrences and 2 are skipped
- **THEN** the response contains `created` with 3 bookings and `skipped` with 2 entries showing dates and reasons

### Requirement: A user SHALL be able to cancel a single occurrence or all future occurrences of a series

The cancellation endpoint SHALL accept a `scope` parameter:
- `this`: cancels only the specified occurrence (marks that `Booking` as cancelled)
- `thisAndFuture`: cancels the specified occurrence and all future occurrences (marks all bookings with `seriesId` and `startsAt >= occurrence.startsAt` as cancelled, and updates the series `endDate`)

Cancellation SHALL require the `bookerName` to match the series booker name (case-insensitive, normalized).

#### Scenario: Cancel single occurrence leaves others active

- **WHEN** a user cancels a single occurrence of a weekly series with scope `this`
- **THEN** only that occurrence is marked as cancelled
- **AND** future occurrences remain active

#### Scenario: Cancel this and future occurrences

- **WHEN** a user cancels an occurrence with scope `thisAndFuture`
- **AND** the series has 3 future occurrences after the cancelled one
- **THEN** the specified occurrence and all 3 future occurrences are marked as cancelled
- **AND** the series `endDate` is updated to the cancelled occurrence's date

#### Scenario: Cancel with mismatched booker name is rejected

- **WHEN** a user attempts to cancel an occurrence with a `bookerName` that does not match the series
- **THEN** the request fails with `NameMismatchError`

#### Scenario: Cancel already-cancelled occurrence is rejected

- **WHEN** a user attempts to cancel an occurrence that is already `cancelled`
- **THEN** the request fails with a `BusinessRuleError`

### Requirement: An admin SHALL be able to cancel any series or occurrence without name validation

The admin cancellation endpoint SHALL accept the same `scope` parameter but SHALL NOT require `bookerName` validation. Admins can cancel any series or occurrence regardless of the original booker.

#### Scenario: Admin cancels series without name check

- **WHEN** an admin cancels a series with scope `thisAndFuture`
- **THEN** all future occurrences are cancelled without requiring the booker name

#### Scenario: Admin cancels single occurrence

- **WHEN** an admin cancels a single occurrence with scope `this`
- **THEN** only that occurrence is cancelled

### Requirement: The webapp SHALL provide a recurrence toggle in the booking form

The booking form SHALL include a toggle control labeled "Repeat booking". When enabled, the form SHALL display:
- Frequency selector: `daily` or `weekly`
- End type selector: `date` or `count`
- End value input: date picker (if `date`) or number input (if `count`)

When the toggle is disabled, the form behaves as before (single booking).

#### Scenario: Toggle disabled creates single booking

- **WHEN** a user submits the booking form with the repeat toggle disabled
- **THEN** the system creates a single booking as before

#### Scenario: Toggle enabled with daily frequency

- **WHEN** a user enables the repeat toggle, selects `daily`, and sets end date
- **THEN** the form submits a series creation request with frequency `daily`

#### Scenario: Toggle enabled with weekly frequency

- **WHEN** a user enables the repeat toggle, selects `weekly`, and sets occurrence count
- **THEN** the form submits a series creation request with frequency `weekly` and the specified count

### Requirement: The webapp SHALL display a confirmation dialog showing created and skipped occurrences

After a series creation request succeeds, if any occurrences were skipped, the webapp SHALL display a dialog showing:
- Number of bookings created
- List of skipped dates with reasons (overlap or outside open hours)

The user SHALL acknowledge the dialog before continuing.

#### Scenario: All occurrences created shows no dialog

- **WHEN** a series is created with no skipped occurrences
- **THEN** the webapp shows a success toast and does not open the confirmation dialog

#### Scenario: Partial series shows skipped dates

- **WHEN** a series is created with 3 bookings and 2 skipped
- **THEN** the webapp opens a dialog showing "Created 3 bookings. 2 dates were skipped:" followed by the list of skipped dates and reasons

### Requirement: The webapp SHALL display a recurrence indicator on bookings that belong to a series

In the day view grid, bookings with a `seriesId` SHALL display a recurrence icon (↻) next to the booker name. Hovering over the icon SHALL show a tooltip with the series pattern (frequency and end date).

#### Scenario: Single booking has no recurrence indicator

- **WHEN** a booking is displayed in the day view and has no `seriesId`
- **THEN** no recurrence icon is shown

#### Scenario: Series occurrence shows recurrence icon

- **WHEN** a booking is displayed in the day view and has a `seriesId`
- **THEN** a recurrence icon (↻) is shown next to the booker name

#### Scenario: Tooltip shows series pattern

- **WHEN** a user hovers over the recurrence icon
- **THEN** a tooltip displays "Recurring: {frequency} until {endDate}"

### Requirement: The cancel dialog SHALL offer scope selection for series occurrences

When a user initiates cancellation of a booking that belongs to a series, the cancel dialog SHALL display two radio options:
- "Cancel this occurrence only"
- "Cancel this and all future occurrences"

The dialog SHALL submit the cancellation request with the selected scope.

#### Scenario: Cancel dialog for single booking has no scope selector

- **WHEN** a user opens the cancel dialog for a booking with no `seriesId`
- **THEN** the dialog shows only the name input and cancel button (no scope selector)

#### Scenario: Cancel dialog for series occurrence shows scope selector

- **WHEN** a user opens the cancel dialog for a booking with a `seriesId`
- **THEN** the dialog shows a scope selector with "this only" and "this and future" options

#### Scenario: User selects "this only" scope

- **WHEN** a user selects "Cancel this occurrence only" and confirms
- **THEN** the cancellation request is sent with `scope: 'this'`

#### Scenario: User selects "this and future" scope

- **WHEN** a user selects "Cancel this and all future occurrences" and confirms
- **THEN** the cancellation request is sent with `scope: 'thisAndFuture'`

### Requirement: The admin panel SHALL provide a section to list and cancel active series

The admin panel SHALL include a "Series" section that lists all active booking series (series with `endDate >= today`). Each series entry SHALL display:
- Space name
- Booker name
- Frequency
- Start time and end time
- First occurrence date and end date
- Action button: "Cancel series"

Clicking "Cancel series" SHALL cancel all future occurrences of that series.

#### Scenario: Admin lists all active series

- **WHEN** an admin navigates to the "Series" section
- **THEN** all series with `endDate >= today` are displayed in a table

#### Scenario: Admin cancels a series

- **WHEN** an admin clicks "Cancel series" on a series entry
- **THEN** all future occurrences of that series are cancelled
- **AND** the series is removed from the active list

#### Scenario: Completed series are not shown

- **WHEN** a series has `endDate < today`
- **THEN** it does not appear in the admin "Series" section
