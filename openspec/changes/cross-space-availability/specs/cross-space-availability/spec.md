## ADDED Requirements

### Requirement: Home page displays "book for later" section with preset chips

The home page SHALL display a section below the 3 space cards with heading "Reservar para más tarde" and three preset chips: "Hoy", "Mañana", "Otra fecha". Tapping a chip SHALL show the time picker below.

#### Scenario: User taps "Hoy" preset
- **GIVEN** the user is on the home page
- **WHEN** the user taps the "Hoy" chip
- **THEN** the time picker SHALL appear below the chips
- **AND** the start time SHALL default to the next round hour from now
- **AND** the end time SHALL default to start time + 1 hour
- **AND** the "Hoy" chip SHALL have a visual highlight indicating it is selected

#### Scenario: User taps "Mañana" preset
- **GIVEN** the user is on the home page
- **WHEN** the user taps the "Mañana" chip
- **THEN** the time picker SHALL appear below the chips
- **AND** the start time SHALL default to the first open hour tomorrow
- **AND** the end time SHALL default to start time + 1 hour
- **AND** the "Mañana" chip SHALL have a visual highlight indicating it is selected

#### Scenario: User taps "Otra fecha" preset
- **GIVEN** the user is on the home page
- **WHEN** the user taps the "Otra fecha" chip
- **THEN** a date picker SHALL appear
- **AND** the "Otra fecha" chip SHALL have a visual highlight indicating it is selected

#### Scenario: User selects a date in "Otra fecha" preset
- **GIVEN** the user has tapped "Otra fecha" and the date picker is visible
- **WHEN** the user selects a date
- **THEN** the time picker SHALL appear below the date picker
- **AND** the start time SHALL default to the first open hour of the chosen date
- **AND** the end time SHALL default to start time + 1 hour

---

### Requirement: "Hoy" preset falls back to tomorrow when tapped after close time

When the "Hoy" preset is tapped and the current time is past today's close time, the time picker SHALL default to tomorrow's first open hour instead of today.

#### Scenario: User taps "Hoy" after close time
- **GIVEN** the current time is past today's close time (e.g., 23:30 and close time is 23:00)
- **WHEN** the user taps the "Hoy" chip
- **THEN** the time picker SHALL appear with start time = tomorrow's first open hour
- **AND** the end time SHALL default to start time + 1 hour
- **AND** a hint message SHALL appear: "Hoy ya cerró. Mostrando mañana." (dismissible)

---

### Requirement: Time picker displays start time, end time, and computed duration

The time picker SHALL display two time inputs (start and end) and a computed duration label. The duration SHALL update automatically when either time changes.

#### Scenario: User views time picker with default times
- **GIVEN** the user has selected a preset and the time picker is visible
- **WHEN** the time picker renders
- **THEN** the start time input SHALL display the default start time
- **AND** the end time input SHALL display the default end time
- **AND** the duration label SHALL display "Duración: Xh Ymin" computed from end - start

#### Scenario: User changes start time
- **GIVEN** the time picker is visible with start = 14:00 and end = 15:00
- **WHEN** the user changes start time to 14:30
- **THEN** the duration label SHALL update to "Duración: 0h 30min"

#### Scenario: User changes end time
- **GIVEN** the time picker is visible with start = 14:00 and end = 15:00
- **WHEN** the user changes end time to 16:00
- **THEN** the duration label SHALL update to "Duración: 2h 0min"

---

### Requirement: Time picker validates end > start and minimum 30min duration

The time picker SHALL validate that end time is after start time and that the duration is at least 30 minutes. Validation SHALL occur when the user taps "Buscar disponibilidad".

#### Scenario: User submits with end time before start time
- **GIVEN** the time picker is visible with start = 15:00 and end = 14:00
- **WHEN** the user taps "Buscar disponibilidad"
- **THEN** an error message SHALL appear: "La hora de fin debe ser posterior a la de inicio"
- **AND** the query SHALL NOT be triggered

#### Scenario: User submits with duration less than 30min
- **GIVEN** the time picker is visible with start = 14:00 and end = 14:15
- **WHEN** the user taps "Buscar disponibilidad"
- **THEN** an error message SHALL appear: "La duración mínima es 30 minutos"
- **AND** the query SHALL NOT be triggered

#### Scenario: User submits with valid times
- **GIVEN** the time picker is visible with start = 14:00 and end = 15:00
- **WHEN** the user taps "Buscar disponibilidad"
- **THEN** no error message SHALL appear
- **AND** the tRPC query SHALL be triggered with the chosen times

---

### Requirement: Time picker validates booking is not in the past

The time picker SHALL validate that the chosen date and time are not in the past. Validation SHALL occur when the user taps "Buscar disponibilidad".

#### Scenario: User submits with past date/time
- **GIVEN** the time picker is visible with a date/time in the past
- **WHEN** the user taps "Buscar disponibilidad"
- **THEN** an error message SHALL appear: "No puedes reservar en el pasado"
- **AND** the query SHALL NOT be triggered

---

### Requirement: "Buscar disponibilidad" button triggers cross-space availability query

When the user taps "Buscar disponibilidad" with valid times, the system SHALL query the backend `spaces.availability` procedure and display results below the time picker.

#### Scenario: User searches for availability
- **GIVEN** the time picker is visible with valid times (start = 14:00, end = 15:00)
- **WHEN** the user taps "Buscar disponibilidad"
- **THEN** the system SHALL call `trpc.spaces.availability.useQuery()` with `startsAt` and `endsAt` as ISO strings
- **AND** a loading state SHALL appear (skeleton rows)
- **AND** the results section SHALL appear below the time picker after the query completes

---

### Requirement: Results section displays availability status per space

The results section SHALL display one row per space with status icon, space name, occupant name (if occupied), and action button. The section SHALL have a heading "Para HH:MM – HH:MM" showing the chosen time window.

#### Scenario: Available space in results
- **GIVEN** the query returned a space with state = 'free'
- **WHEN** the results section renders
- **THEN** the row SHALL display a ✓ icon
- **AND** the row SHALL display the space name
- **AND** the row SHALL display a "[Reservar]" button

#### Scenario: Occupied space with occupant name in results
- **GIVEN** the query returned a space with state = 'occupied' and occupiedBy = "Marta"
- **WHEN** the results section renders
- **THEN** the row SHALL display a ✗ icon
- **AND** the row SHALL display the space name
- **AND** the row SHALL display "(Marta)" next to the space name
- **AND** the row SHALL display a "[Ver día]" button

#### Scenario: Closed space in results
- **GIVEN** the query returned a space with state = 'closed'
- **WHEN** the results section renders
- **THEN** the row SHALL display a grey icon
- **AND** the row SHALL display the space name
- **AND** the row SHALL display "Cerrado" label
- **AND** the row SHALL NOT display any action button

---

### Requirement: Results section displays empty state when all spaces unavailable

When the query returns no available spaces, the results section SHALL display a friendly empty state message.

#### Scenario: All spaces unavailable
- **GIVEN** the query returned 3 spaces, all with state = 'occupied' or state = 'closed'
- **WHEN** the results section renders
- **THEN** the section SHALL display the message: "No hay espacios disponibles en este horario. Prueba otro horario o revisa el calendario de cada sala."

---

### Requirement: Results section displays loading state during query

While the availability query is in flight, the results section SHALL display a loading state with skeleton rows.

#### Scenario: Query in progress
- **GIVEN** the user has tapped "Buscar disponibilidad"
- **WHEN** the query is in flight
- **THEN** the results section SHALL display 3 skeleton rows (one per space)
- **AND** the skeleton rows SHALL have a shimmer effect

---

### Requirement: Results section displays error state on query failure

When the availability query fails, the results section SHALL display an error message with a retry button.

#### Scenario: Query fails
- **GIVEN** the user has tapped "Buscar disponibilidad"
- **WHEN** the query fails (e.g., network error)
- **THEN** the results section SHALL display the message: "No se pudo cargar la disponibilidad"
- **AND** the results section SHALL display a "[Reintentar]" button

#### Scenario: User taps retry button
- **GIVEN** the error state is visible
- **WHEN** the user taps "[Reintentar]"
- **THEN** the query SHALL be re-triggered
- **AND** the loading state SHALL appear

---

### Requirement: "[Reservar]" button opens quick-book sheet with pre-filled data

When the user taps "[Reservar]" on an available space in the results, the quick-book sheet SHALL open with the chosen time window and space pre-filled.

#### Scenario: User taps "Reservar" on available space
- **GIVEN** the results section displays an available space "Sala Reuniones"
- **WHEN** the user taps "[Reservar]"
- **THEN** the quick-book sheet SHALL open
- **AND** the sheet SHALL receive `space` = `{ id, slug: "sala-reuniones", name: "Sala Reuniones" }` (matching phase 1's prop contract)
- **AND** the sheet SHALL have `defaultDate` = chosen date (YYYY-MM-DD)
- **AND** the sheet SHALL have `defaultStart` = chosen start time (HH:MM)
- **AND** the sheet SHALL have `defaultEnd` = chosen end time (HH:MM)
- **AND** the sheet's name input SHALL be pre-filled from localStorage

---

### Requirement: "[Ver día]" button navigates to space detail page with date param

When the user taps "[Ver día]" on an occupied space in the results, the system SHALL navigate to the space detail page with the chosen date as a query parameter.

#### Scenario: User taps "Ver día" on occupied space
- **GIVEN** the results section displays an occupied space "Cocina" with slug "cocina"
- **AND** the chosen date is 2026-05-04
- **WHEN** the user taps "[Ver día]"
- **THEN** the system SHALL navigate to `/spaces/cocina?date=2026-05-04`
- **AND** the detail page SHALL render the timeline for 2026-05-04

---

### Requirement: Results stay visible after rendering (picker remains at top)

After the results section renders, the time picker SHALL remain visible at the top of the section. The results SHALL appear below the picker, allowing the user to refine their search without scrolling back up.

#### Scenario: Results render below picker
- **GIVEN** the user has searched for availability and results are visible
- **WHEN** the results section renders
- **THEN** the time picker SHALL remain visible at the top
- **AND** the results SHALL appear below the picker
- **AND** the user SHALL be able to adjust times and search again without scrolling
