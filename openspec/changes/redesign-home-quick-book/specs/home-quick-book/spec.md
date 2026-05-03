# Capability: Home Quick Book

## ADDED Requirements

### Requirement: The home page SHALL display live status cards for all spaces

The home page (`apps/webapp/src/routes/index.tsx`) displays a card for each space returned by `api.spaces.list.useQuery()`. Each card shows:

- Space name and color (background color from `space.color`, text white)
- Live status line based on `space.currentStatus.state`:
  - **Free**: "Libre · hasta las HH:MM" (until next booking or close time) or "Libre todo el día" (if free until close with no bookings)
  - **Occupied**: "{bookerName} · hasta las HH:MM (Xmin restantes)" (current occupant and time remaining)
  - **Closed**: "Cerrado · abre HH:MM" (next open time) or "Cerrado hoy" (if closed all day)
- Quick duration buttons [30min] [1h] [2h] when space is free (see next requirement)
- "Reservar después →" button when space is occupied (navigates to `/spaces/:slug`)

Tapping the card body (not buttons) navigates to `/spaces/:slug` (existing detail view).

#### Scenario: Free space with no bookings today

- **WHEN** the user loads the home page
- **AND** a space is free with no bookings for the rest of the day
- **AND** the space closes at 18:00
- **AND** the current time is 10:00
- **THEN** the card shows "Libre · hasta las 18:00"
- **AND** the quick buttons [30min] [1h] [2h] are visible

#### Scenario: Free space with next booking at 14:00

- **WHEN** the user loads the home page
- **AND** a space is free now
- **AND** the next booking starts at 14:00
- **AND** the current time is 10:00
- **THEN** the card shows "Libre · hasta las 14:00"
- **AND** the quick buttons [30min] [1h] [2h] are visible

#### Scenario: Occupied space with booking ending at 15:00

- **WHEN** the user loads the home page
- **AND** a space is occupied by "Alice"
- **AND** the booking ends at 15:00
- **AND** the current time is 14:30
- **THEN** the card shows "Alice · hasta las 15:00 (30min restantes)"
- **AND** the quick buttons are NOT visible
- **AND** the "Reservar después →" button is visible

#### Scenario: Closed space opening at 14:00

- **WHEN** the user loads the home page
- **AND** a space is closed now
- **AND** the space opens at 14:00
- **AND** the current time is 10:00
- **THEN** the card shows "Cerrado · abre 14:00"
- **AND** no buttons are visible

#### Scenario: Closed space all day

- **WHEN** the user loads the home page
- **AND** a space has no open hours today
- **THEN** the card shows "Cerrado hoy"
- **AND** no buttons are visible

#### Scenario: Tap card body navigates to detail page

- **WHEN** the user taps the card body (not a button)
- **THEN** the app navigates to `/spaces/:slug`

#### Scenario: Tap "Reservar después" navigates to detail page

- **WHEN** the user taps the "Reservar después →" button on an occupied card
- **THEN** the app navigates to `/spaces/:slug`

### Requirement: Quick duration buttons SHALL be hidden when insufficient free time

When a space is free, the card displays quick duration buttons [30min] [1h] [2h]. A button is hidden if the free window (`space.currentStatus.freeWindowMinutes`) is shorter than the button's duration.

#### Scenario: All buttons visible when 2 hours free

- **WHEN** a space is free
- **AND** `freeWindowMinutes === 120`
- **THEN** all three buttons [30min] [1h] [2h] are visible

#### Scenario: Only [30min] visible when 45 minutes free

- **WHEN** a space is free
- **AND** `freeWindowMinutes === 45`
- **THEN** the [30min] button is visible
- **AND** the [1h] and [2h] buttons are hidden

#### Scenario: No buttons visible when 20 minutes free

- **WHEN** a space is free
- **AND** `freeWindowMinutes === 20`
- **THEN** all three buttons are hidden

### Requirement: Tapping a quick button SHALL open the confirmation sheet

When the user taps a quick duration button ([30min], [1h], or [2h]), a bottom sheet opens with a booking confirmation form.

The `<QuickBookSheet>` component accepts the following props:

**Required props:**
- `open: boolean` — controls sheet visibility
- `onOpenChange: (open: boolean) => void` — callback when sheet open state changes
- `space: { id: string; slug: string; name: string }` — the space to book

**Optional props:**
- `defaultStart?: Date | string` — pre-filled start time (ISO or Date). If absent, defaults to current time.
- `defaultEnd?: Date | string` — pre-filled end time (ISO or Date). If absent, defaults to start + 1h.
- `defaultDate?: Date | string` — pre-filled date (ISO or Date). If absent, defaults to today.
- `onConfirm?: () => void` — callback after successful booking
- `onCancel?: () => void` — callback when sheet closed without confirming

This contract supports phase 1's "now + duration" use case and enables phases 2 and 3 to pre-fill times from timeline taps or availability search results.

#### Scenario: Tap [1h] button opens sheet

- **WHEN** the user taps the [1h] button on a free space card
- **THEN** a bottom sheet opens
- **AND** the sheet title is "Confirmar reserva"
- **AND** the sheet subtitle shows the space name and time range (e.g., "Sala de Reuniones · Hoy 14:37 – 15:37 (1h)")
- **AND** the sheet contains an input "Tu nombre"
- **AND** the sheet contains a "Confirmar reserva" button
- **AND** the sheet contains a cancel button

#### Scenario: Sheet renders with pre-filled times when defaults are passed

- **WHEN** the sheet is opened with `defaultStart="2026-05-03T14:00:00Z"` and `defaultEnd="2026-05-03T16:00:00Z"`
- **THEN** the subtitle shows "Hoy 14:00 – 16:00 (2h)"
- **AND** the booking will use the pre-filled times when confirmed

#### Scenario: Sheet falls back to "now + 1h" when defaults are absent

- **WHEN** the sheet is opened without `defaultStart` or `defaultEnd`
- **AND** the current time is 14:37
- **THEN** the subtitle shows "Hoy 14:37 – 15:37 (1h)"
- **AND** the booking will use current time + 1h when confirmed

### Requirement: The confirmation sheet SHALL pre-fill the booker name from localStorage

The "Tu nombre" input in the confirmation sheet is pre-filled with the value from `readStoredBookerName()` (localStorage key `bookerName`). If no stored name exists, the input is empty.

#### Scenario: Pre-fill name when stored in localStorage

- **WHEN** the confirmation sheet opens
- **AND** `readStoredBookerName()` returns "Alice"
- **THEN** the "Tu nombre" input value is "Alice"

#### Scenario: Empty input when no stored name

- **WHEN** the confirmation sheet opens
- **AND** `readStoredBookerName()` returns `null`
- **THEN** the "Tu nombre" input value is empty

### Requirement: Confirming the booking SHALL create a booking with computed start and end times

When the user clicks "Confirmar reserva" in the sheet, the app calls `api.spaces.book.useMutation()` with:

- `slug`: the space slug
- `bookerName`: the value from the "Tu nombre" input
- `startsAt`: current time (now) as ISO string
- `endsAt`: current time + duration (e.g., now + 60 minutes for [1h]) as ISO string

On success:
- The sheet closes
- The booker name is stored via `writeStoredBookerName(name)`
- The `api.spaces.list` query is invalidated (to refresh the cards)
- A success toast is shown

On error:
- An error toast is shown with the error message

#### Scenario: Successful booking for 1 hour

- **WHEN** the user opens the sheet for a space
- **AND** the user types "Alice" in the "Tu nombre" input
- **AND** the user clicks "Confirmar reserva"
- **AND** the current time is 2026-05-03T14:37:00Z
- **AND** the duration is 60 minutes
- **THEN** the mutation is called with:
  - `slug`: the space slug
  - `bookerName`: "Alice"
  - `startsAt`: "2026-05-03T14:37:00Z"
  - `endsAt`: "2026-05-03T15:37:00Z"
- **AND** on success, the sheet closes
- **AND** "Alice" is stored in localStorage
- **AND** the `api.spaces.list` query is invalidated
- **AND** a success toast is shown

#### Scenario: Booking fails due to overlap

- **WHEN** the user confirms a booking
- **AND** the mutation fails with a `BookingOverlapError`
- **THEN** an error toast is shown with the error message
- **AND** the sheet remains open

### Requirement: The home page SHALL show a loading skeleton while spaces are loading

While `api.spaces.list.useQuery()` is in flight (`isLoading === true`), the home page displays skeleton cards instead of real cards.

#### Scenario: Loading skeleton on initial load

- **WHEN** the user loads the home page
- **AND** `api.spaces.list.useQuery()` is loading
- **THEN** skeleton cards are displayed
- **AND** real cards are NOT displayed

#### Scenario: Real cards after loading completes

- **WHEN** the spaces query completes
- **THEN** skeleton cards are hidden
- **AND** real cards are displayed

### Requirement: The home page SHALL show an empty state when no spaces exist

When `api.spaces.list.useQuery()` returns an empty array, the home page displays an empty state message.

#### Scenario: Empty state when no spaces

- **WHEN** the user loads the home page
- **AND** `api.spaces.list.useQuery()` returns `[]`
- **THEN** an empty state message is displayed
- **AND** no cards are displayed

### Requirement: The home page SHALL handle query errors gracefully

When `api.spaces.list.useQuery()` fails, the home page displays an error message.

#### Scenario: Error message on query failure

- **WHEN** the user loads the home page
- **AND** `api.spaces.list.useQuery()` fails
- **THEN** an error message is displayed
- **AND** no cards are displayed
