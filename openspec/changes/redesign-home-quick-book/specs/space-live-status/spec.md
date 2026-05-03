# Capability: Space Live Status

## ADDED Requirements

### Requirement: SpaceLister SHALL return currentStatus for each space

The `SpaceLister.run()` application service returns a `SpaceDto[]` where each DTO includes a `currentStatus` object with the following fields:

- `state`: `'free' | 'occupied' | 'closed'`
- `freeUntil`: ISO timestamp (next booking start or today's close time, whichever is first) — only when `state === 'free'`
- `freeWindowMinutes`: number of minutes until `freeUntil` — only when `state === 'free'`
- `occupiedBy`: booker name — only when `state === 'occupied'`
- `occupiedUntil`: ISO timestamp (current booking end) — only when `state === 'occupied'`
- `nextOpenAt`: ISO timestamp (next open slot today) or `null` (if closed all day) — only when `state === 'closed'`

The status is computed using the configured booking timezone (`tz` parameter passed to `SpaceLister.run()`).

#### Scenario: Free space with no bookings today

- **WHEN** `SpaceLister.run()` is called
- **AND** a space is open from 09:00 to 18:00
- **AND** there are no bookings for the rest of the day
- **AND** the current time is 10:00
- **THEN** the DTO includes:
  - `currentStatus.state === 'free'`
  - `currentStatus.freeUntil === '2026-05-03T18:00:00Z'` (today's close time)
  - `currentStatus.freeWindowMinutes === 480` (8 hours)

#### Scenario: Free space with next booking at 14:00

- **WHEN** `SpaceLister.run()` is called
- **AND** a space is open from 09:00 to 18:00
- **AND** there is a booking from 14:00 to 15:00
- **AND** the current time is 10:00
- **THEN** the DTO includes:
  - `currentStatus.state === 'free'`
  - `currentStatus.freeUntil === '2026-05-03T14:00:00Z'` (next booking start)
  - `currentStatus.freeWindowMinutes === 240` (4 hours)

#### Scenario: Occupied space with booking ending at 15:00

- **WHEN** `SpaceLister.run()` is called
- **AND** a space has an active booking by "Alice" from 14:00 to 15:00
- **AND** the current time is 14:30
- **THEN** the DTO includes:
  - `currentStatus.state === 'occupied'`
  - `currentStatus.occupiedBy === 'Alice'`
  - `currentStatus.occupiedUntil === '2026-05-03T15:00:00Z'` (current booking end)

#### Scenario: Closed space opening at 14:00

- **WHEN** `SpaceLister.run()` is called
- **AND** a space is open from 14:00 to 18:00
- **AND** the current time is 10:00
- **THEN** the DTO includes:
  - `currentStatus.state === 'closed'`
  - `currentStatus.nextOpenAt === '2026-05-03T14:00:00Z'` (next open time today)

#### Scenario: Closed space all day

- **WHEN** `SpaceLister.run()` is called
- **AND** a space has no open hours today
- **AND** the current time is 10:00
- **THEN** the DTO includes:
  - `currentStatus.state === 'closed'`
  - `currentStatus.nextOpenAt === null` (closed all day)

### Requirement: Space entity SHALL compute freeUntil based on bookings and open hours

The `Space` entity provides a method `computeFreeUntil(bookings: Booking[], now: Date, tz: string): Date | null` that returns:

- `null` if the space is closed now
- The next booking start time if a booking exists after `now` and before today's close
- Today's close time if no bookings exist for the rest of the day
- The earlier of (next booking start, today's close) if both exist

The computation uses the booking timezone (`tz`) to determine "today" and open hours.

#### Scenario: No bookings, space closes at 18:00

- **WHEN** `space.computeFreeUntil([], now, tz)` is called
- **AND** the space is open from 09:00 to 18:00
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns 2026-05-03T18:00:00 in `tz` (today's close time)

#### Scenario: Next booking at 14:00, space closes at 18:00

- **WHEN** `space.computeFreeUntil([booking], now, tz)` is called
- **AND** the space is open from 09:00 to 18:00
- **AND** `booking` starts at 14:00
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns 2026-05-03T14:00:00 in `tz` (next booking start)

#### Scenario: Space is closed now

- **WHEN** `space.computeFreeUntil([], now, tz)` is called
- **AND** the space is open from 14:00 to 18:00
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns `null` (space is closed)

#### Scenario: Next booking at 17:30, space closes at 18:00

- **WHEN** `space.computeFreeUntil([booking], now, tz)` is called
- **AND** the space is open from 09:00 to 18:00
- **AND** `booking` starts at 17:30
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns 2026-05-03T17:30:00 in `tz` (next booking start, earlier than close)

### Requirement: Space entity SHALL compute nextOpenAt for closed spaces

The `Space` entity provides a method `computeNextOpenAt(now: Date, tz: string): Date | null` that returns:

- The start time of the next open hours window today if the space is closed now but opens later
- `null` if the space is closed for the rest of the day

The computation uses the booking timezone (`tz`) to determine "today" and open hours.

#### Scenario: Closed now, opens at 14:00

- **WHEN** `space.computeNextOpenAt(now, tz)` is called
- **AND** the space is open from 14:00 to 18:00
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns 2026-05-03T14:00:00 in `tz` (next open time today)

#### Scenario: Closed all day

- **WHEN** `space.computeNextOpenAt(now, tz)` is called
- **AND** the space has no open hours today
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns `null` (closed all day)

#### Scenario: Open now

- **WHEN** `space.computeNextOpenAt(now, tz)` is called
- **AND** the space is open from 09:00 to 18:00
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns `null` (space is already open)

#### Scenario: Closed now, opens at 14:00 and 16:00

- **WHEN** `space.computeNextOpenAt(now, tz)` is called
- **AND** the space has two open windows: 09:00-12:00 and 14:00-18:00
- **AND** `now` is 2026-05-03T13:00:00 in `tz` (between windows)
- **THEN** the method returns 2026-05-03T14:00:00 in `tz` (next open window start)

### Requirement: BookingRepository SHALL provide findForDate method

The `BookingRepository` port provides a method `findForDate(date: Date, tz: string): Promise<Booking[]>` that returns all active bookings for a given date in the booking timezone.

The method:
- Converts `date` to start-of-day and end-of-day in `tz`
- Returns all bookings where `startsAt >= startOfDay AND startsAt < endOfDay AND status === 'active'`
- Returns domain `Booking` entities (not DTOs)

#### Scenario: Find bookings for 2026-05-03

- **WHEN** `repo.findForDate(new Date('2026-05-03'), tz)` is called
- **AND** there are bookings on 2026-05-03 (10:00-11:00, 14:00-15:00)
- **AND** there is a booking on 2026-05-04 (10:00-11:00)
- **THEN** the method returns 2 bookings (only 2026-05-03)

#### Scenario: No bookings for date

- **WHEN** `repo.findForDate(new Date('2026-05-03'), tz)` is called
- **AND** there are no bookings on 2026-05-03
- **THEN** the method returns an empty array

#### Scenario: Cancelled bookings are excluded

- **WHEN** `repo.findForDate(new Date('2026-05-03'), tz)` is called
- **AND** there is an active booking on 2026-05-03 (10:00-11:00)
- **AND** there is a cancelled booking on 2026-05-03 (14:00-15:00)
- **THEN** the method returns 1 booking (only the active one)

### Requirement: Status computation SHALL be timezone-aware

All status computation (free until, next open at, closed today) uses the configured booking timezone (`tz` parameter). "Today" means today in the booking timezone, not UTC.

#### Scenario: Today in booking timezone vs UTC

- **WHEN** `SpaceLister.run()` is called
- **AND** the booking timezone is `Europe/Madrid` (UTC+1)
- **AND** the current UTC time is 2026-05-03T23:30:00Z (2026-05-04T00:30:00 in Madrid)
- **AND** a space is open from 09:00 to 18:00 on 2026-05-04 in Madrid
- **THEN** the status is computed for 2026-05-04 in Madrid (not 2026-05-03 in UTC)
- **AND** the space is closed (before 09:00)

#### Scenario: Open hours are in local time

- **WHEN** `space.computeFreeUntil([], now, tz)` is called
- **AND** the space is open from 09:00 to 18:00 (local time in `tz`)
- **AND** `now` is 2026-05-03T10:00:00 in `tz`
- **THEN** the method returns 2026-05-03T18:00:00 in `tz` (not UTC)

### Requirement: SpaceLister SHALL inject Clock and timezone

The `SpaceLister` application service accepts `Clock` and `tz` (timezone string) via constructor injection. The `Clock` is used to get the current time (`clock.now()`), and `tz` is passed to domain methods for timezone-aware computation.

#### Scenario: SpaceLister uses injected Clock

- **WHEN** `SpaceLister.run()` is called
- **AND** the injected `Clock` returns 2026-05-03T10:00:00Z
- **THEN** the status is computed using 2026-05-03T10:00:00Z as "now"

#### Scenario: SpaceLister uses injected timezone

- **WHEN** `SpaceLister.run()` is called
- **AND** the injected `tz` is `Europe/Madrid`
- **THEN** all status computation uses `Europe/Madrid` as the timezone
