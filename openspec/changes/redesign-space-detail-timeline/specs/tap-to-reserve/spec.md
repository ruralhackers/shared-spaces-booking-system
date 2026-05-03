## ADDED Requirements

### Requirement: Tap on free area opens quick-book sheet

When a user taps on a free (unoccupied) area of the timeline, the quick-book sheet SHALL open with pre-filled start and end times.

#### Scenario: Tapping free slot opens sheet
- **GIVEN** the timeline shows a free slot at hour 10
- **WHEN** the user taps the free slot
- **THEN** the quick-book sheet SHALL open

---

### Requirement: Sheet pre-fills start time as tapped hour rounded down

The quick-book sheet SHALL pre-fill the start time as the hour of the tapped row, rounded down to the hour boundary (e.g., tap anywhere in the 10:00 row → start = 10:00).

#### Scenario: Start time is the tapped hour
- **GIVEN** the user taps the free slot at hour 10
- **WHEN** the quick-book sheet opens
- **THEN** the start time input SHALL be pre-filled with "10:00"

#### Scenario: Start time is rounded down to hour boundary
- **GIVEN** the user taps the free slot at hour 14
- **WHEN** the quick-book sheet opens
- **THEN** the start time input SHALL be pre-filled with "14:00" (not 14:30 or any sub-hour value)

#### Scenario: Tapping within an hour rounds down to hour boundary
- **GIVEN** the user taps the free slot at hour 14 at position 14:37 (e.g., tap Y position corresponds to 14:37)
- **WHEN** the quick-book sheet opens
- **THEN** the start time input SHALL be pre-filled with "14:00" (rounded down)
- **AND** the end time input SHALL be pre-filled with "15:00" (start + 1h, capped at next booking or close time)

---

### Requirement: Sheet pre-fills end time as start + 1 hour, capped

The quick-book sheet SHALL pre-fill the end time as start time + 1 hour, capped at the earlier of:
- The start time of the next booking
- The space's close time for the day

#### Scenario: End time is start + 1 hour when no conflicts
- **GIVEN** the user taps the free slot at hour 10, and there are no bookings until 15:00
- **WHEN** the quick-book sheet opens
- **THEN** the end time input SHALL be pre-filled with "11:00"

#### Scenario: End time is capped at next booking
- **GIVEN** the user taps the free slot at hour 10, and the next booking starts at 10:30
- **WHEN** the quick-book sheet opens
- **THEN** the end time input SHALL be pre-filled with "10:30" (not 11:00)

#### Scenario: End time is capped at close time
- **GIVEN** the user taps the free slot at hour 21, and the space closes at 22:00
- **WHEN** the quick-book sheet opens
- **THEN** the end time input SHALL be pre-filled with "22:00" (not 23:00 or later)

#### Scenario: End time is capped at close time when close is before start + 1h
- **GIVEN** the user taps the free slot at hour 21, and the space closes at 21:30
- **WHEN** the quick-book sheet opens
- **THEN** the end time input SHALL be pre-filled with "21:30" (not 22:00)

---

### Requirement: User can adjust times in sheet before confirming

The quick-book sheet SHALL allow the user to adjust the pre-filled start and end times before confirming the booking.

#### Scenario: User changes start time
- **GIVEN** the quick-book sheet is open with start = "10:00"
- **WHEN** the user changes the start time to "10:15"
- **THEN** the start time input SHALL reflect "10:15"

#### Scenario: User changes end time
- **GIVEN** the quick-book sheet is open with end = "11:00"
- **WHEN** the user changes the end time to "11:30"
- **THEN** the end time input SHALL reflect "11:30"

---

### Requirement: Tap on own booking opens cancel dialog

When a user taps on a booking block that belongs to them (booker name matches the name stored in localStorage), the cancel booking dialog SHALL open.

#### Scenario: Tapping own booking opens cancel dialog
- **GIVEN** the timeline shows a booking with bookerName = "Marta", and localStorage contains name = "Marta"
- **WHEN** the user taps the booking block
- **THEN** the cancel booking dialog SHALL open with the booking details

---

### Requirement: Tap on someone else's booking does nothing

When a user taps on a booking block that does NOT belong to them (booker name does not match the name stored in localStorage), no action SHALL be taken.

#### Scenario: Tapping someone else's booking does nothing
- **GIVEN** the timeline shows a booking with bookerName = "Pablo", and localStorage contains name = "Marta"
- **WHEN** the user taps the booking block
- **THEN** no dialog or sheet SHALL open

---

### Requirement: Successful booking refreshes timeline

After a booking is successfully created via the quick-book sheet, the timeline SHALL refresh to display the new booking.

#### Scenario: Timeline updates after booking
- **GIVEN** the user has successfully created a booking via the quick-book sheet
- **WHEN** the sheet closes
- **THEN** the `spaces.dayView` query SHALL be invalidated
- **AND** the timeline SHALL re-fetch and display the new booking

---

### Requirement: Failed booking shows error toast and keeps sheet open

If a booking creation fails (e.g., conflict, validation error), an error toast SHALL be displayed and the quick-book sheet SHALL remain open so the user can adjust and retry.

#### Scenario: Error toast on booking failure
- **GIVEN** the user submits a booking that conflicts with an existing booking
- **WHEN** the API returns an error
- **THEN** an error toast SHALL be displayed with the error message
- **AND** the quick-book sheet SHALL remain open

#### Scenario: User can retry after error
- **GIVEN** the quick-book sheet is open after a failed booking attempt
- **WHEN** the user adjusts the times and submits again
- **THEN** the booking SHALL be attempted again
