# Design: Recurring Bookings

## Context

The current booking system (`packages/spaces`) supports single bookings with:
- No authentication (name-only via `bookerName` string)
- Single-day constraint (cannot cross midnight)
- Overlap detection via `listActiveOnDay(spaceId, date, tz)`
- Open hours validation per space (weekly schedule, no holiday support)
- Cancellation by booker (name match) or admin

Residents need recurring bookings (e.g., "every Tuesday 17:00–18:00 until December") without manually creating dozens of individual bookings. The system must prevent conflicts, report skipped occurrences, and allow granular cancellation.

## Goals / Non-Goals

**Goals:**
- Support daily and weekly recurrence patterns with end date or occurrence count
- Materialize all occurrences as `Booking` rows to reuse existing overlap detection
- Skip conflicting occurrences (overlap or outside open hours) and report them
- Enable cancellation of a single occurrence or "this and all future" occurrences
- Enforce hard limits (1 year / 365 occurrences) to prevent abuse
- Maintain backward compatibility (existing bookings unchanged)

**Non-Goals:**
- Complex RRULE patterns (BYDAY, BYMONTHDAY, exceptions)
- Editing existing series (workaround: cancel + recreate)
- Slack notifications for series operations
- Authentication beyond current `bookerName` string matching

## Decisions

### Decision 1: Materialization vs. Virtual Patterns

**Chosen:** Materialize all occurrences as `Booking` rows with `seriesId` foreign key.

**Rationale:**
- Reuses existing `listActiveOnDay` query without modification
- Canceling a single occurrence is trivial (cancel that row)
- Overlap detection requires no new logic (existing bookings already checked)
- SQLite handles 365 rows per series without performance issues
- Trade-off: DB grows faster, but simplicity and query performance win

**Alternatives considered:**
- Virtual patterns (store only the rule, expand at query time): requires rewriting overlap detection to expand patterns in-memory; much more complex
- Hybrid (materialize rolling window): requires background job scheduler; over-engineering for coliving scale

### Decision 2: Conflict Handling During Materialization

**Chosen:** Skip conflicting occurrences and report them in the response.

**Rationale:**
- Rejecting the entire series for one conflict is frustrating (user has no control without auth to negotiate)
- Skipping silently would mislead the user
- Reporting skipped dates (`{ date, reason }[]`) gives transparency and allows user to decide next steps
- If zero occurrences are valid, reject with `EmptySeriesError`

**Alternatives considered:**
- Atomic (all-or-nothing): too rigid; one conflict blocks the entire series
- Preview + confirmation: adds UI complexity; better as future enhancement

### Decision 3: Bounded Context and Aggregate Placement

**Chosen:** New aggregate `BookingSeries` in existing `packages/spaces` bounded context.

**Rationale:**
- `BookingSeries` and `Booking` share ubiquitous language (space, time range, booker, overlap)
- Creating a new bounded context (`packages/recurrences`) would add cross-context coordination overhead without benefit
- `BookingSeries` is a separate aggregate with its own repository; `Booking` holds weak reference via `seriesId: string | null`

**Alternatives considered:**
- Embed series fields directly in `Booking`: violates SRP; single bookings would carry unused fields
- New bounded context: over-isolation for this domain

### Decision 4: Cancellation Scopes

**Chosen:** Two scopes: `this` (single occurrence) and `thisAndFuture` (this + all future occurrences).

**Rationale:**
- `this`: covers "I can't make it this week, but keep the rest"
- `thisAndFuture`: covers "I'm done with this activity; cancel from now on"
- No need for "entire series including past" (past occurrences already happened; canceling them retroactively has no value)
- Same `bookerName` auth as single bookings

**Alternatives considered:**
- Only single-occurrence cancellation: forces manual cancellation of each future occurrence
- Three scopes (add "entire series"): redundant with `thisAndFuture` for practical use cases

### Decision 5: End Condition (Date vs. Count)

**Chosen:** User chooses either end date OR occurrence count; internally normalize to end date.

**Rationale:**
- End date is more natural for "until end of semester" use cases
- Occurrence count is simpler for "next 10 sessions"
- Normalize to end date in domain layer for consistent query logic
- Hard limits: max 1 year from first occurrence, max 365 occurrences (whichever is stricter)

**Alternatives considered:**
- Only end date: less intuitive for fixed-count use cases
- Only occurrence count: less intuitive for calendar-based planning
- Both stored separately: unnecessary complexity; end date is canonical

### Decision 6: Notifier Behavior

**Chosen:** Series operations do NOT invoke `Notifier`. Single occurrence operations (create puntual booking, cancel single occurrence) continue to notify.

**Rationale:**
- Materializing 50 occurrences would spam Slack with 50 messages
- No series-specific notifier methods exist yet (out of scope)
- When series notifications are added (future change), they'll be summary messages (1 per series operation)

**Alternatives considered:**
- Notify each occurrence: unacceptable spam
- Notify series creation but not occurrences: inconsistent; better to defer all series notifications to a dedicated change

## Data Model

### New Table: `booking_series`

```prisma
model BookingSeries {
  id          String   @id @default(cuid())
  spaceId     String
  bookerName  String
  frequency   RecurrenceFrequency
  startTime   String   // HH:mm in system TZ
  endTime     String   // HH:mm in system TZ
  firstDate   DateTime // date of first occurrence
  endDate     DateTime // date of last occurrence (inclusive)
  createdAt   DateTime @default(now())

  space    Space     @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  bookings Booking[]

  @@map("booking_series")
}

enum RecurrenceFrequency {
  daily
  weekly
}
```

### Modified Table: `bookings`

Add:
- `seriesId String?` (nullable FK to `booking_series`, `onDelete: SetNull`)
- Index: `@@index([seriesId, startsAt])`

## Domain Layer (`packages/spaces/domain`)

### New Entities and VOs

**`RecurrenceFrequency` (VO)**:
- Enum: `daily` | `weekly`
- Validation: only these two values

**`BookingSeries` (Aggregate)**:
- `create(params)`: validates frequency, end date ≤ 1 year, occurrence count ≤ 365
- `expandOccurrences(tz): TimeRange[]`: generates array of time ranges for all occurrences
- `cancelFutureFrom(date, clock): void`: marks series as ended at `date` (updates `endDate`)
- `toDto(): BookingSeriesDto`

**`BookingSeriesRepository` (Port)**:
- `save(series): Promise<void>`
- `findById(id): Promise<BookingSeries | null>`
- `listActive(spaceId?): Promise<BookingSeries[]>` — series with `endDate >= today`

**New Error**:
- `EmptySeriesError`: thrown when all occurrences are skipped (zero valid bookings)

### Modified Entities

**`Booking`**:
- Add `seriesId: string | null` to constructor and DTO
- No behavior changes; series linkage is metadata only

## Application Layer (`packages/spaces/application`)

### New Services

**`BookingSeriesCreator`**:
- `run(input): Promise<{ seriesId, created: BookingDto[], skipped: { date, reason }[] }>`
- Input: `{ slug, bookerName, startsAt, endsAt, frequency, end: { type: 'date'|'count', value } }`
- Logic:
  1. Validate space exists
  2. Create `BookingSeries` entity (validates limits)
  3. Expand occurrences
  4. For each occurrence:
     - Try `Booking.create` (reuses existing validation: overlap, open hours, cross-midnight)
     - If succeeds: add to `created[]`, set `seriesId`
     - If fails: add to `skipped[]` with reason
  5. If `created.length === 0`: throw `EmptySeriesError`
  6. Save series + all created bookings
  7. Return summary

**`BookingSeriesCanceller`**:
- `run(input): Promise<{ cancelledCount: number }>`
- Input: `{ seriesId, scope: 'this'|'thisAndFuture', occurrenceId?, bookerName }`
- Logic:
  - `scope: 'this'`: find booking by `occurrenceId`, call `booking.cancelByBooker(name, clock)`
  - `scope: 'thisAndFuture'`: find all bookings with `seriesId` and `startsAt >= occurrence.startsAt`, cancel each, update series `endDate`
  - Validate `bookerName` matches series

**`AdminBookingSeriesCanceller`**:
- Same as above but no `bookerName` validation

**`AdminBookingSeriesLister`**:
- `run(): Promise<BookingSeriesDto[]>`
- Returns all active series

### Modified Services

**`BookingCreator`**: No changes. Continues to handle single bookings. Series creator invokes `Booking.create` directly (not via this service) to handle per-occurrence errors.

## Infrastructure Layer (`packages/spaces/infrastructure`)

**`BookingSeriesPrismaRepository`**:
- Implements `BookingSeriesRepository` port
- Maps Prisma `BookingSeries` model to domain entity

**`BookingSeriesInMemoryRepository`**:
- For application service tests
- Stores series in `Map<string, BookingSeries>`

**Modified `BookingPrismaRepository`**:
- Add `seriesId` to Prisma queries and DTOs

## API Layer (`packages/api`, `apps/api`)

New tRPC procedures:

**`bookingSeries.create`**:
- Input: `{ slug, bookerName, startsAt, endsAt, frequency, end: { type, value } }`
- Output: `{ seriesId, created, skipped }`
- Calls `BookingSeriesCreator.run()`

**`bookingSeries.cancelByBooker`**:
- Input: `{ seriesId, scope, occurrenceId?, bookerName }`
- Output: `{ cancelledCount }`
- Calls `BookingSeriesCanceller.run()`

**`admin.bookingSeries.list`**:
- Protected by admin secret
- Calls `AdminBookingSeriesLister.run()`

**`admin.bookingSeries.cancel`**:
- Input: `{ seriesId, scope, occurrenceId? }`
- Protected by admin secret
- Calls `AdminBookingSeriesCanceller.run()`

## Frontend Layer (`apps/webapp`)

### Modified Components

**`BookingForm`**:
- Add toggle switch "Repeat booking"
- When enabled, show:
  - Select: frequency (`daily` | `weekly`)
  - Radio: end type (`date` | `count`)
  - Input: end value (date picker or number input)
- On submit: call `bookingSeries.create` if repeat is enabled, else `booking.create` as before
- On success with skipped occurrences: open `RecurringConfirmationDialog`

**New `RecurringConfirmationDialog`**:
- Props: `{ created: BookingDto[], skipped: { date, reason }[] }`
- Shows: "Created X bookings. Y dates were skipped:" + list of skipped dates with reasons
- Button: "OK"

**`CancelBookingDialog`**:
- If `booking.seriesId` exists, show radio group: "Cancel this occurrence only" | "Cancel this and all future occurrences"
- Call `bookingSeries.cancelByBooker` with appropriate scope

**Day Grid (space detail page)**:
- For bookings with `seriesId`, render icon (↻) next to booker name
- Tooltip on hover: "Recurring: {frequency} until {endDate}"

### New Admin Section

**`/admin/series` route**:
- List all active series (table: space, booker, frequency, start time, end date, actions)
- Action button: "Cancel series" → calls `admin.bookingSeries.cancel` with `scope: 'thisAndFuture'` and `occurrenceId` = next future occurrence

### i18n

Add keys to `locales/{en,es,gl}/booking.json`:
- `repeatBooking`, `frequency`, `daily`, `weekly`, `endType`, `endDate`, `occurrenceCount`, `recurringConfirmationTitle`, `recurringConfirmationMessage`, `skippedDates`, `cancelScope`, `cancelThisOnly`, `cancelThisAndFuture`, `recurringSeries`, `activeSeries`, `cancelSeries`

## Risks / Trade-offs

**[Risk]** DB growth with long series → **Mitigation:** Hard limit of 1 year / 365 occurrences enforced in domain

**[Risk]** User creates series, leaves coliving, series continues indefinitely → **Mitigation:** Admin can cancel series via admin panel; future enhancement: auto-expire series after X months of inactivity

**[Risk]** Skipping occurrences silently confuses users → **Mitigation:** Explicit confirmation dialog showing skipped dates with reasons

**[Trade-off]** Materialization increases DB size vs. virtual patterns → **Accepted:** Simplicity and query performance outweigh storage cost at coliving scale

**[Trade-off]** No editing of series → **Accepted:** Cancel + recreate is acceptable workaround; editing adds significant complexity for uncertain value

**[Trade-off]** No Slack notifications for series → **Accepted:** Deferred to future change to avoid spam and keep scope manageable

## Migration Plan

1. **Schema migration**: Add `booking_series` table and `bookings.seriesId` column (nullable, default null)
2. **Deploy backend**: New domain entities, services, repositories, tRPC procedures
3. **Deploy frontend**: Updated `BookingForm`, new dialogs, admin section
4. **Rollback strategy**: Drop `booking_series` table and `bookings.seriesId` column; redeploy previous version

No data migration needed (new feature, no existing data to transform).

## Open Questions

None. All decisions resolved during planning phase.
