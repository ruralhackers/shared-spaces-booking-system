# Tasks: Recurring Bookings

## 1. Database Schema

- [x] 1.1 Add `RecurrenceFrequency` enum to Prisma schema (`daily`, `weekly`)
- [x] 1.2 Add `BookingSeries` model to Prisma schema (id, spaceId, bookerName, frequency, startTime, endTime, firstDate, endDate, createdAt)
- [x] 1.3 Add `seriesId` field to `Booking` model (nullable, FK to BookingSeries, onDelete: SetNull)
- [x] 1.4 Add index `@@index([seriesId, startsAt])` to `Booking` model
- [x] 1.5 Run `bun run -F @dfs/database db:sync` to regenerate schema.sql and Prisma client

## 2. Domain Layer — Value Objects

- [x] 2.1 RED: Write test for `RecurrenceFrequency.create()` with valid values (`daily`, `weekly`)
- [x] 2.2 GREEN: Implement `RecurrenceFrequency` value object with validation
- [x] 2.3 RED: Write test for `RecurrenceFrequency.create()` rejecting invalid values
- [x] 2.4 GREEN: Add validation to reject invalid frequency values
- [x] 2.5 COMMIT: `feat(spaces): add RecurrenceFrequency value object`

## 3. Domain Layer — BookingSeries Entity

- [x] 3.1 RED: Write test for `BookingSeries.create()` with valid daily frequency
- [x] 3.2 GREEN: Implement `BookingSeries` entity with `create()` static method
- [x] 3.3 RED: Write test for `BookingSeries.create()` with valid weekly frequency
- [x] 3.4 GREEN: Extend `create()` to handle weekly frequency
- [x] 3.5 RED: Write test rejecting series exceeding 1 year duration
- [x] 3.6 GREEN: Add validation for 1 year limit in `create()`
- [x] 3.7 RED: Write test rejecting series exceeding 365 occurrences
- [x] 3.8 GREEN: Add validation for 365 occurrence limit in `create()`
- [x] 3.9 RED: Write test for `expandOccurrences()` with daily frequency
- [x] 3.10 GREEN: Implement `expandOccurrences()` for daily frequency
- [x] 3.11 RED: Write test for `expandOccurrences()` with weekly frequency
- [x] 3.12 GREEN: Extend `expandOccurrences()` for weekly frequency
- [x] 3.13 RED: Write test for `fromDto()` and `toDto()` round-trip
- [x] 3.14 GREEN: Implement `fromDto()` and `toDto()` methods
- [x] 3.15 COMMIT: `feat(spaces): add BookingSeries entity with expansion logic`

## 4. Domain Layer — Errors

- [x] 4.1 Create `EmptySeriesError` extending `DomainError` with code `EMPTY_SERIES`
- [x] 4.2 COMMIT: `feat(spaces): add EmptySeriesError for series with no valid occurrences`

## 5. Domain Layer — Repository Port

- [x] 5.1 Create `BookingSeriesRepository` interface with `save()`, `findById()`, `listActive()`
- [x] 5.2 COMMIT: `feat(spaces): add BookingSeriesRepository port`

## 6. Domain Layer — Modify Booking Entity

- [x] 6.1 RED: Write test for `Booking.toDto()` including `seriesId` field
- [x] 6.2 GREEN: Add `seriesId: string | null` to `Booking` constructor and `BookingDto`
- [x] 6.3 RED: Write test for `Booking.fromDto()` with `seriesId`
- [x] 6.4 GREEN: Update `fromDto()` to handle `seriesId`
- [x] 6.5 COMMIT: `feat(spaces): add seriesId to Booking entity`

## 7. Application Layer — BookingSeriesCreator Service

- [x] 7.1 RED: Write test for `BookingSeriesCreator.run()` creating a daily series with no conflicts
- [x] 7.2 GREEN: Implement `BookingSeriesCreator` service with `run()` method (validate space, create series, expand occurrences, save)
- [x] 7.3 RED: Write test for series creation skipping overlapping occurrences
- [x] 7.4 GREEN: Add overlap detection per occurrence, skip and record reason
- [x] 7.5 RED: Write test for series creation skipping occurrences outside open hours
- [x] 7.6 GREEN: Add open hours validation per occurrence, skip and record reason
- [x] 7.7 RED: Write test for `EmptySeriesError` when all occurrences are skipped
- [x] 7.8 GREEN: Throw `EmptySeriesError` if `created.length === 0`
- [x] 7.9 RED: Write test for weekly series with occurrence count converted to end date
- [x] 7.10 GREEN: Add logic to normalize occurrence count to end date
- [x] 7.11 COMMIT: `feat(spaces): add BookingSeriesCreator service`

## 8. Application Layer — BookingSeriesCanceller Service

- [x] 8.1 RED: Write test for cancelling single occurrence with scope `this`
- [x] 8.2 GREEN: Implement `BookingSeriesCanceller.run()` with scope `this` (find booking, validate name, cancel)
- [x] 8.3 RED: Write test for cancelling this and future occurrences with scope `thisAndFuture`
- [x] 8.4 GREEN: Extend `run()` to handle scope `thisAndFuture` (find all future bookings, cancel each, update series endDate)
- [x] 8.5 RED: Write test rejecting cancellation with mismatched booker name
- [x] 8.6 GREEN: Add booker name validation (case-insensitive, normalized)
- [x] 8.7 RED: Write test rejecting cancellation of already-cancelled occurrence
- [x] 8.8 GREEN: Add validation to reject already-cancelled bookings
- [x] 8.9 COMMIT: `feat(spaces): add BookingSeriesCanceller service`

## 9. Application Layer — Admin Services

- [x] 9.1 RED: Write test for `AdminBookingSeriesCanceller.run()` without name validation
- [x] 9.2 GREEN: Implement `AdminBookingSeriesCanceller` (same logic as `BookingSeriesCanceller` but skip name check)
- [x] 9.3 RED: Write test for `AdminBookingSeriesLister.run()` returning active series
- [x] 9.4 GREEN: Implement `AdminBookingSeriesLister` calling `repository.listActive()`
- [x] 9.5 COMMIT: `feat(spaces): add admin booking series services`

## 10. Infrastructure Layer — InMemory Repository

- [x] 10.1 RED: Write test for `BookingSeriesInMemoryRepository.save()` and `findById()`
- [x] 10.2 GREEN: Implement `BookingSeriesInMemoryRepository` with `Map<string, BookingSeries>`
- [x] 10.3 RED: Write test for `listActive()` filtering by endDate >= today
- [x] 10.4 GREEN: Implement `listActive()` with date filtering
- [x] 10.5 COMMIT: `feat(spaces): add BookingSeriesInMemoryRepository`

## 11. Infrastructure Layer — Prisma Repository

- [x] 11.1 RED: Write integration test for `BookingSeriesPrismaRepository.save()` and `findById()` with PGlite
- [x] 11.2 GREEN: Implement `BookingSeriesPrismaRepository` mapping Prisma model to domain entity
- [x] 11.3 RED: Write integration test for `listActive()` with PGlite
- [x] 11.4 GREEN: Implement `listActive()` querying Prisma with `where: { endDate: { gte: today } }`
- [x] 11.5 COMMIT: `feat(spaces): add BookingSeriesPrismaRepository`

## 12. Infrastructure Layer — Update Booking Prisma Repository

- [x] 12.1 RED: Write integration test for `BookingPrismaRepository` saving and loading bookings with `seriesId`
- [x] 12.2 GREEN: Update `BookingPrismaRepository` to include `seriesId` in Prisma queries and DTOs
- [x] 12.3 COMMIT: `feat(spaces): add seriesId to BookingPrismaRepository`

## 13. API Layer — tRPC Procedures

- [x] 13.1 Create `bookingSeries.create` procedure with input schema (slug, bookerName, startsAt, endsAt, frequency, end: { type, value })
- [x] 13.2 Wire `bookingSeries.create` to `BookingSeriesCreator.run()`
- [x] 13.3 Create `bookingSeries.cancelByBooker` procedure with input schema (seriesId, scope, occurrenceId, bookerName)
- [x] 13.4 Wire `bookingSeries.cancelByBooker` to `BookingSeriesCanceller.run()`
- [x] 13.5 Create `admin.bookingSeries.list` procedure (protected by admin secret)
- [x] 13.6 Wire `admin.bookingSeries.list` to `AdminBookingSeriesLister.run()`
- [x] 13.7 Create `admin.bookingSeries.cancel` procedure (protected by admin secret)
- [x] 13.8 Wire `admin.bookingSeries.cancel` to `AdminBookingSeriesCanceller.run()`
- [x] 13.9 COMMIT: `feat(api): add bookingSeries tRPC procedures`

## 14. Frontend — Booking Form

- [x] 14.1 RED: Write test for `BookingForm` rendering repeat toggle
- [x] 14.2 GREEN: Add toggle switch "Repeat booking" to `BookingForm` component
- [x] 14.3 RED: Write test for frequency selector appearing when toggle is enabled
- [x] 14.4 GREEN: Add frequency select (daily/weekly) shown conditionally when toggle is on
- [x] 14.5 RED: Write test for end type selector (date/count)
- [x] 14.6 GREEN: Add end type radio group and conditional inputs (date picker or number input)
- [x] 14.7 RED: Write test for form submission calling `bookingSeries.create` when repeat is enabled
- [x] 14.8 GREEN: Update form submit handler to call `bookingSeries.create` if repeat is on, else `booking.create`
- [x] 14.9 COMMIT: `feat(webapp): add recurrence controls to BookingForm`

## 15. Frontend — Recurring Confirmation Dialog

- [x] 15.1 RED: Write test for `RecurringConfirmationDialog` rendering created and skipped counts
- [x] 15.2 GREEN: Create `RecurringConfirmationDialog` component displaying created bookings and skipped dates with reasons
- [x] 15.3 RED: Write test for dialog opening after series creation with skipped occurrences
- [x] 15.4 GREEN: Update `BookingForm` to open dialog when response includes skipped occurrences
- [x] 15.5 COMMIT: `feat(webapp): add RecurringConfirmationDialog`

## 16. Frontend — Cancel Booking Dialog

- [x] 16.1 RED: Write test for `CancelBookingDialog` showing scope selector when booking has seriesId
- [x] 16.2 GREEN: Add conditional scope radio group to `CancelBookingDialog` (this only / this and future)
- [x] 16.3 RED: Write test for dialog calling `bookingSeries.cancelByBooker` with selected scope
- [x] 16.4 GREEN: Update dialog submit handler to call `bookingSeries.cancelByBooker` if seriesId exists, else `booking.cancelByBooker`
- [x] 16.5 COMMIT: `feat(webapp): add scope selector to CancelBookingDialog`

## 17. Frontend — Day Grid Recurrence Indicator

- [x] 17.1 RED: Write test for day grid rendering recurrence icon when booking has seriesId
- [x] 17.2 GREEN: Add recurrence icon (↻) next to booker name in day grid for bookings with seriesId
- [x] 17.3 RED: Write test for tooltip showing series pattern on hover
- [x] 17.4 GREEN: Add tooltip component displaying "Recurring: {frequency} until {endDate}"
- [x] 17.5 COMMIT: `feat(webapp): add recurrence indicator to day grid`

## 18. Frontend — Admin Series Section

- [x] 18.1 Create `/admin/series` route in TanStack Router
- [x] 18.2 RED: Write test for admin series list component rendering active series
- [x] 18.3 GREEN: Create admin series list component calling `admin.bookingSeries.list` and rendering table
- [x] 18.4 RED: Write test for "Cancel series" button calling `admin.bookingSeries.cancel`
- [x] 18.5 GREEN: Add "Cancel series" button to each row, calling `admin.bookingSeries.cancel` with scope `thisAndFuture`
- [x] 18.6 COMMIT: `feat(webapp): add admin series management section`

## 19. Frontend — i18n

- [x] 19.1 Add recurrence-related keys to `locales/en/booking.json` (repeatBooking, frequency, daily, weekly, endType, endDate, occurrenceCount, recurringConfirmationTitle, recurringConfirmationMessage, skippedDates, cancelScope, cancelThisOnly, cancelThisAndFuture, recurringSeries, activeSeries, cancelSeries)
- [x] 19.2 Add Spanish translations to `locales/es/booking.json`
- [x] 19.3 Add Galician translations to `locales/gl/booking.json`
- [x] 19.4 COMMIT: `feat(webapp): add i18n keys for recurring bookings`

## 20. Validation and Review

- [x] 20.1 Run `/task-validate` to ensure lint, typecheck, and tests pass
- [x] 20.2 Run `/task-code-review` to review production code against conventions
- [x] 20.3 Run `/task-tests-review` to review test quality and coverage
- [x] 20.4 Run `/task-architecture-review` to verify hexagonal architecture compliance
- [x] 20.5 Run `/task-frontend-review` to review frontend components and patterns
- [x] 20.6 Address all findings from review tasks

## 21. Final Commit

- [x] 21.1 Commit all changes with message: `feat(recurring-bookings): add recurring booking series with daily/weekly frequency`
