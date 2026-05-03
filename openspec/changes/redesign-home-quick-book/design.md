# Design: Redesign Home with Quick Book

## Context

The current home page (`apps/webapp/src/routes/index.tsx`) presents:
1. A list of all spaces (cards with chevron to detail)
2. An `<AvailabilitySearch>` form (date + start + end)
3. An `<AvailabilityResults>` section after submit (with inline book form)

This design does not match the actual usage patterns:
- Only **3 spaces** in this deployment
- **80% use case**: "I want to book a space NOW or LATER TODAY"
- Typical booking duration: **1 hour**
- **1-2 active bookings** per user typical

The current UX forces users to navigate to a detail page and scan a list of bookings to understand availability. This is optimized for exploration, not for the dominant "quick book now" flow.

**This is phase 1 of a 4-phase UX redesign.** The goal is to replace the home page with a "now & next" view that surfaces live status of all 3 spaces and enables one-tap booking for common durations (30min, 1h, 2h).

### Existing Infrastructure

- **Backend**: `SpaceLister` application service (`packages/spaces/application/space-lister.service.ts`) already fetches spaces and active bookings. It returns `SpaceDto` with `isOccupiedNow: boolean`.
- **Frontend**: Home page uses `api.spaces.list.useQuery()` to fetch spaces. Booking creation uses `api.spaces.book.useMutation()`.
- **Locale**: `readStoredBookerName()` and `writeStoredBookerName()` exist in `apps/webapp/src/features/spaces/booker-name-storage.ts`.
- **shadcn components**: `<Card>`, `<Button>`, `<Input>`, `<Label>` exist. `<Sheet>` does NOT exist yet (needs to be added via shadcn CLI).

### Hexagonal Layers

- **Domain** (`packages/spaces/domain`): `Space` entity, `Booking` entity, `SpaceRepository`, `BookingRepository` ports
- **Application** (`packages/spaces/application`): `SpaceLister` service with `run()` entry point, DTOs
- **Infrastructure** (`packages/spaces/infrastructure`): Prisma adapters for repositories, tRPC router wiring in `packages/api`
- **Frontend** (`apps/webapp`): React components, TanStack Router, tRPC client

## Goals / Non-Goals

### Goals

- Replace home page with live status cards for all 3 spaces
- Enable one-tap booking for common durations (30min, 1h, 2h) when space is free
- Show real-time occupancy status (free until, occupied by, closed)
- Pre-fill booker name from localStorage
- Preserve existing detail page navigation (tap card body)
- Maintain backward compatibility (DTO extension, not replacement)

### Non-Goals

- Detail view redesign (phase 2)
- "Later today" cross-space availability flow (phase 3)
- Animations beyond defaults (phase 4)
- Admin panel changes
- Mobile app changes
- Auth/PIN changes
- Recurring bookings flow changes

## Decisions

### Decision 1: Extend `SpaceDto` with `currentStatus` field

**Decision**: Extend the existing `SpaceDto` returned by `SpaceLister.run()` to include a `currentStatus` object with `state`, `freeUntil`, `freeWindowMinutes`, `occupiedBy`, `occupiedUntil`, `nextOpenAt`.

**Rationale**:
- Co-locates status data with space data, reducing round-trips
- Backward compatible — old clients ignore the new field
- Aligns with the existing pattern of `isOccupiedNow` (which is already a computed field)
- Keeps the tRPC procedure signature unchanged

**Alternatives considered**:
- **New procedure `spaces.currentStatus`**: Would require a second query on the frontend, increasing latency and complexity. Rejected because status is always needed alongside space data on the home page.
- **Polling with a separate query**: Would add unnecessary network traffic. Rejected because the home page already fetches spaces on mount.

### Decision 2: Compute status in domain methods, orchestrate in application service

**Decision**: Add domain methods to `Space` entity:
- `computeFreeUntil(bookings: Booking[], now: Date, tz: string): Date | null`
- `computeNextOpenAt(now: Date, tz: string): Date | null`

The `SpaceLister` application service orchestrates: fetch spaces, fetch bookings, call domain methods, assemble DTO.

**Rationale**:
- Follows hexagonal architecture — domain owns business logic, application orchestrates
- `Space` already has `isOpenAt(range, tz)` method, so it owns the "open hours" invariant
- Keeps application service thin — no business rules, just coordination
- Testable in isolation — domain methods are pure functions (given bookings + now + tz, return status)

**Alternatives considered**:
- **Compute status in application service**: Would violate hexagonal architecture by putting business logic in the orchestration layer. Rejected.
- **Compute status in infrastructure (Prisma query)**: Would couple domain logic to database schema. Rejected.

### Decision 3: Hide quick buttons when insufficient free time

**Decision**: If a space is free but the free window is shorter than a button's duration, hide that button. For example, if only 25 minutes are free, hide all three buttons ([30min], [1h], [2h]).

**Rationale**:
- Prevents user frustration — tapping a button that will fail is a bad UX
- Simpler than disabling (disabled buttons are confusing without explanation)
- Aligns with the "quick book" mental model — if you can't book it quickly, use the detail page

**Alternatives considered**:
- **Disable buttons with tooltip**: More complex to implement, requires hover state (not mobile-friendly). Rejected.
- **Show all buttons, fail on tap**: Bad UX — user discovers the constraint after tapping. Rejected.

### Decision 4: Quick-book sheet uses shadcn `<Sheet>` with `side="bottom"`

**Decision**: Implement the confirmation UI as a bottom sheet (drawer) using shadcn's `<Sheet>` component with `side="bottom"`.

**Rationale**:
- Mobile-first pattern — bottom sheets are standard on mobile for quick actions
- Non-blocking — user can dismiss by tapping outside or swiping down
- Consistent with shadcn/ui conventions already in use
- Preserves context — user still sees the card behind the sheet

**Alternatives considered**:
- **Inline form on card**: Would require expanding the card, pushing other cards down. Rejected because it disrupts the "at-a-glance" layout.
- **Modal dialog**: More disruptive than a bottom sheet. Rejected because the action is lightweight (one input, one button).
- **Navigate to detail page**: Would lose the "quick book" benefit. Rejected.

### Decision 5: Round booking start time to current minute (not next 5-minute interval)

**Decision**: When a user taps a quick button, the booking starts at the current minute (e.g., 14:37) and ends at current minute + duration (e.g., 15:37 for 1h).

**Note**: The `<QuickBookSheet>` component itself does not round times. The **caller** computes `defaultStart` and `defaultEnd`. In phase 1, the home page passes `now` and `now + duration` (no rounding). In phase 2, the detail page's tap-to-reserve will pass hour-rounded times. In phase 3, the availability finder will pass user-picked times verbatim.

**Rationale**:
- Simpler implementation — no rounding logic in phase 1
- More accurate — user expects "now" to mean "right now"
- Aligns with existing `Booking.create()` behavior (no rounding in domain)

**Alternatives considered**:
- **Round to next 5-minute interval**: Would add complexity and delay the start time. Rejected because the domain does not enforce 5-minute boundaries.

### Decision 6: Fetch bookings for today (not just active bookings)

**Decision**: Add a new repository method `BookingRepository.findForDate(date: Date, tz: string): Promise<Booking[]>` that returns all active bookings for a given date in the booking timezone.

**Rationale**:
- Needed to compute "free until" (next booking start)
- Existing `findActiveAt(now)` only returns bookings active at a specific instant, not future bookings today
- Timezone-aware — "today" means today in the booking timezone, not UTC

**Alternatives considered**:
- **Fetch all bookings, filter in application**: Inefficient and couples application to database schema. Rejected.
- **Compute "free until" in SQL**: Would couple domain logic to database. Rejected.

### Decision 7: Status computation is timezone-aware

**Decision**: All status computation (free until, next open at, closed today) uses the configured booking timezone (`ctx.siteConfig.tz` in tRPC context, passed to domain methods).

**Rationale**:
- "Today" must mean today in the booking timezone, not UTC
- Open hours are defined in local time (e.g., "09:00" means 09:00 in booking-tz)
- Aligns with existing `Booking.create()` behavior (uses `toZonedTime()` for cross-midnight check)

**Alternatives considered**:
- **Use UTC everywhere**: Would break the "today" concept for users in different timezones. Rejected.

### Decision 8: Remove `<AvailabilitySearch>` and `<AvailabilityResults>` in this phase

**Decision**: Delete `apps/webapp/src/features/spaces/availability-search.tsx` and `availability-results.tsx` in this phase. The "later today" flow will be re-implemented in phase 3 as a cross-space availability view.

**Rationale**:
- Simplifies the home page to focus on "quick book now"
- Avoids maintaining two parallel booking flows during the transition
- Phase 3 will introduce a better "later today" UX (cross-space availability)

**Alternatives considered**:
- **Keep both flows**: Would clutter the home page and confuse users. Rejected.
- **Move to a separate route**: Would add navigation complexity. Rejected because phase 3 will introduce a dedicated route.

### Decision 9: Client-side overlap validation is not performed

**Decision**: The quick-book sheet does not validate that the free window is still available when the user submits. The backend's `Booking.create()` validation (overlap check) is the source of truth. If another user books in the meantime, the mutation will fail with a `ConflictError`, and the frontend shows an error toast.

**Rationale**:
- Simpler — no duplication of overlap logic between frontend and backend
- Server is the source of truth — prevents stale-cache races
- Aligns with existing booking form behavior (server-side validation only)

**Alternatives considered**:
- **Optimistic client check**: Would require duplicating the overlap logic in the frontend and keeping it in sync with the backend. Rejected because it adds complexity and can still fail (race condition between check and submit).

## Risks / Trade-offs

### Risk 1: Users who need to book "later today" lose that capability temporarily

**Mitigation**: Users can still navigate to the detail page (`/spaces/:slug`) and use the existing booking form. Phase 3 will restore and improve the "later today" flow.

**Trade-off**: Temporary regression in UX for the 20% use case (booking later today) in exchange for a better UX for the 80% use case (booking now).

### Risk 2: `<Sheet>` component does not exist yet

**Mitigation**: Add a task to install `<Sheet>` via shadcn CLI (`bunx shadcn@latest add sheet`). Verify it supports `side="bottom"` (it does in shadcn/ui v2).

**Trade-off**: Adds a dependency installation step, but shadcn components are already in use and well-tested.

### Risk 3: Status computation adds latency to `spaces.list`

**Mitigation**: The computation is in-memory (no additional database queries beyond fetching bookings for today). Benchmark in testing.

**Trade-off**: Slightly increased response time for `spaces.list` in exchange for eliminating a second query for status.

### Risk 4: Removing `<AvailabilitySearch>` may confuse existing users

**Mitigation**: The new UX is more intuitive for the dominant use case. Users who need "later today" can still use the detail page.

**Trade-off**: Short-term confusion for power users in exchange for long-term simplicity.

## Migration Plan

### Phase 1 (this change)

1. Extend domain with status computation methods
2. Extend application service to return `currentStatus`
3. Add repository method `findForDate()`
4. Install shadcn `<Sheet>` component
5. Rewrite home page with new card + sheet components
6. Remove `<AvailabilitySearch>` and `<AvailabilityResults>`
7. Add locale keys for status labels

### Phase 2 (next)

Replace detail page (`/spaces/:slug`) with a visual timeline (Google Calendar day view style).

### Phase 3 (future)

Re-introduce "later today" flow as a cross-space availability view.

### Phase 4 (future)

Polish pass — animations, skeletons, error tone, onboarding hint for name.

## Open Questions

1. **Should we show "X minutes remaining" for occupied spaces?**
   - **Proposed**: Yes, show "(Xmin restantes)" in the status line. Helps users decide whether to wait or pick another space.
   - **Decision needed**: Confirm with product owner.

2. **What happens if a space is closed but will open later today?**
   - **Proposed**: Show "Cerrado · abre HH:MM" with the next open time. If closed all day, show "Cerrado hoy".
   - **Decision needed**: Confirm with product owner.

3. **Should we show a loading skeleton while `spaces.list` is in flight?**
   - **Proposed**: Yes, preserve the existing `<SpaceCardSkeleton>` behavior.
   - **Decision needed**: Confirm with product owner.

4. **Should we invalidate `spaces.list` after a successful booking?**
   - **Proposed**: Yes, call `utils.spaces.list.invalidate()` in the mutation's `onSuccess` to refresh the cards.
   - **Decision needed**: Confirm with product owner.

5. **Should we add a "Refresh" button to manually update status?**
   - **Proposed**: No, rely on automatic invalidation after booking. Phase 4 can add polling if needed.
   - **Decision needed**: Confirm with product owner.

6. **What if localStorage does not have a stored name?**
   - **Proposed**: Input is empty, user must type their name. After successful booking, store the name via `writeStoredBookerName()`.
   - **Decision needed**: Confirm with product owner.
