# Proposal: Recurring Bookings

## Why

Residents need to reserve shared spaces on a recurring schedule (e.g., weekly yoga sessions, daily standup meetings) without manually creating individual bookings for each occurrence. The current system only supports one-off bookings, forcing users to repeat the booking flow dozens of times for regular activities. This creates friction and increases the likelihood of booking conflicts when users forget to reserve ahead.

## What Changes

- Add **recurring booking series** with daily or weekly frequency patterns
- Materialize all occurrences as individual `Booking` rows linked by `seriesId`
- Skip conflicting occurrences (overlap or outside open hours) and report them to the user
- Support two cancellation scopes: cancel a single occurrence, or cancel "this and all future" occurrences
- Add toggle UI in the booking form to enable recurrence with frequency and end date/count controls
- Display recurrence indicator (icon + tooltip) in the day view grid
- Add admin section to list and cancel active series
- Enforce hard limits: maximum 1 year duration or 365 occurrences per series

## Capabilities

### New Capabilities

- `booking-recurrences`: Create, cancel, and manage recurring booking series with daily or weekly frequency patterns

### Modified Capabilities

- `booking-management`: Extend booking creation and cancellation to support series operations; add `seriesId` to bookings

## Impact

**Affected packages:**
- `packages/spaces` — new `BookingSeries` aggregate, `RecurrenceFrequency` VO, `BookingSeriesRepository` port, `BookingSeriesCreator` / `BookingSeriesCanceller` services, Prisma adapter
- `packages/database` — new `booking_series` table, add `seriesId` column to `bookings` table, migration

**Affected apps:**
- `apps/api` — new tRPC procedures: `bookingSeries.create`, `bookingSeries.cancelByBooker`, `admin.bookingSeries.list`, `admin.bookingSeries.cancel`
- `apps/webapp` — extend `BookingForm` with recurrence toggle, new `RecurringConfirmationDialog`, extend `CancelBookingDialog` with scope selector, add recurrence icon to day grid, new admin "Series" section

**Breaking changes:**
- None. Existing bookings remain unchanged; `seriesId` is nullable.

## Non-goals

- **Slack notifications for series**: Series creation and cancellation will NOT trigger Slack notifications in this change. Individual occurrence cancellations continue to notify as before.
- **Editing existing series**: Users cannot modify a series after creation. Workaround: cancel "this and future" and create a new series.
- **Complex recurrence patterns**: No support for RRULE-style patterns (BYDAY, BYMONTHDAY, exceptions). Only daily or weekly (same weekday as first occurrence).
- **Authentication for series ownership**: Series use the same `bookerName` string matching as single bookings. No tokens or PINs introduced in this change.
