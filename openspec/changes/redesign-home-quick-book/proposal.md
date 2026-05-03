# Proposal: Redesign Home with Quick Book (Phase 1 of 4)

## Why

The current home page (`apps/webapp/src/routes/index.tsx`) presents a generic list of spaces followed by an availability search form. This design does not align with the actual usage patterns of the coliving booking system:

- **80% use case**: "I want to book a space NOW or LATER TODAY"
- Only **3 spaces** in this deployment
- Typical booking duration: **1 hour**
- **1-2 active bookings** per user typical
- Recurring bookings are an edge case

The current UX forces users to:
1. Navigate to a space detail page
2. Scan a list of bookings to understand availability
3. Fill a form with date/time pickers

This is optimized for exploration, not for the dominant "quick book now" flow.

**This is phase 1 of a 4-phase UX redesign.** The goal of phase 1 is to replace the home page with a "now & next" view that surfaces live status of all 3 spaces and enables one-tap booking for common durations (30min, 1h, 2h).

## What Changes

### Frontend — Home Page (`apps/webapp`)

**Replace** the current home page with a new design:

- **3 large cards** (one per space) showing:
  - Space name and color (preserved from current behavior — text white on color background)
  - **Live status line**:
    - Free: "Libre · hasta las HH:MM" (until next booking or close time) or "Libre todo el día"
    - Occupied: "{bookerName} · hasta las HH:MM (Xmin restantes)"
    - Closed: "Cerrado · abre HH:MM" or "Cerrado hoy"
  - **Quick duration buttons** [30min] [1h] [2h] when space is free (hidden if insufficient free time)
  - **"Reservar después →" button** when space is occupied (navigates to detail page)
- **Tap quick button** → opens bottom sheet with:
  - Title: "Confirmar reserva"
  - Subtitle: space name + "Hoy HH:MM – HH:MM (Xh)"
  - Input "Tu nombre" (pre-filled from localStorage via existing `readStoredBookerName()`)
  - Primary button: "Confirmar reserva"
  - Cancel button
- **Tap card body** (not buttons) → navigate to `/spaces/:slug` (existing detail view, unchanged in this phase)
- **After successful booking**: sheet closes, card updates to show new occupant

**Remove**:
- `<AvailabilitySearch>` component (will be replaced in phase 3)
- `<AvailabilityResults>` component (will be replaced in phase 3)

**New components**:
- `apps/webapp/src/features/spaces/space-card.tsx` — card with status + quick buttons
- `apps/webapp/src/features/spaces/quick-book-sheet.tsx` — bottom sheet (uses shadcn `<Sheet>` with `side="bottom"`)

**Locale keys** (new):
- `spaces.json`: `freeUntil`, `freeAllDay`, `occupiedUntil`, `closedOpensAt`, `closedToday`, `bookLater`, `quickBook30min`, `quickBook1h`, `quickBook2h`
- `booking.json`: `confirmBooking`, `yourName`

### Backend — Live Status Computation (`packages/spaces`)

**Extend** `SpaceLister` application service to return live status per space:

- **Current DTO** (`packages/spaces/application/dtos/index.ts`):
  ```typescript
  interface SpaceDto extends DomainSpaceDto {
    isOccupiedNow: boolean
  }
  ```

- **New DTO** (extend `SpaceDto`):
  ```typescript
  interface SpaceDto extends DomainSpaceDto {
    isOccupiedNow: boolean
    currentStatus: {
      state: 'free' | 'occupied' | 'closed'
      freeUntil?: string // ISO timestamp (next booking start or today's close)
      freeWindowMinutes?: number // minutes until freeUntil
      occupiedBy?: string // booker name
      occupiedUntil?: string // ISO timestamp (current booking end)
      nextOpenAt?: string | null // ISO timestamp (next open slot today, or null if closed all day)
    }
  }
  ```

**Domain changes**:
- Add methods to `Space` entity (`packages/spaces/domain/space.entity.ts`) to compute:
  - `computeFreeUntil(bookings: Booking[], now: Date, tz: string): Date | null` — returns next booking start or today's close time, whichever is first
  - `computeNextOpenAt(now: Date, tz: string): Date | null` — returns next open slot today, or null if closed all day
- These methods use the existing `openHours` and `isOpenAt()` logic

**Application changes**:
- Modify `SpaceLister.run()` to:
  1. Fetch all spaces
  2. Fetch all active bookings (already done)
  3. Fetch all bookings for today (new query)
  4. For each space, compute `currentStatus` using domain methods
  5. Return extended DTO

**No changes to tRPC procedure signature** — `spaces.list` continues to return `SpaceDto[]`, but the DTO shape is extended.

### Bounded Context

This change belongs to the **`spaces`** bounded context (`packages/spaces`).

## Non-goals

- **Detail view** (`/spaces/:slug`) is NOT touched in this phase (will be redesigned in phase 2 with a visual timeline)
- **"Later today" flow** not implemented in this phase (will be added in phase 3 as a cross-space availability view)
- **Animations** beyond defaults (phase 4)
- **Admin changes** — admin panel unchanged
- **Mobile app** — no changes to `apps/mobile` in this phase
- **Auth/PIN** — no new authentication; name-only identification preserved
- **Recurring bookings** — flow on detail page unchanged in this phase

## Capabilities

### New Capabilities

1. **`home-quick-book`** — Home page UX with live status cards and quick-book bottom sheet
2. **`space-live-status`** — Backend capability to compute real-time free-until / occupied-until status per space

### Modified Capabilities

None. This change introduces new capabilities without modifying existing ones.

## Impact

### Affected Packages

- **`packages/spaces`** (domain, application, infrastructure):
  - `domain/space.entity.ts` — new methods for status computation
  - `domain/booking.repository.ts` — new query method `findForDate(date: Date, tz: string): Promise<Booking[]>`
  - `application/space-lister.service.ts` — extend DTO and computation logic
  - `application/dtos/index.ts` — extend `SpaceDto` with `currentStatus`
  - `infrastructure/prisma-booking.repository.ts` — implement `findForDate()`

- **`packages/api`**:
  - `infrastructure/routers/spaces.router.ts` — no signature change, but DTO shape extended

### Affected Apps

- **`apps/webapp`**:
  - `src/routes/index.tsx` — full rewrite
  - `src/features/spaces/space-card.tsx` — NEW
  - `src/features/spaces/quick-book-sheet.tsx` — NEW
  - `src/features/spaces/availability-search.tsx` — REMOVED (will be replaced in phase 3)
  - `src/features/spaces/availability-results.tsx` — REMOVED (will be replaced in phase 3)
  - `src/locales/{en,es,gl}/spaces.json` — new keys
  - `src/locales/{en,es,gl}/booking.json` — new keys

### Files Created

- `openspec/changes/redesign-home-quick-book/.openspec.yaml`
- `openspec/changes/redesign-home-quick-book/proposal.md`
- `openspec/changes/redesign-home-quick-book/design.md`
- `openspec/changes/redesign-home-quick-book/tasks.md`
- `openspec/changes/redesign-home-quick-book/specs/home-quick-book/spec.md`
- `openspec/changes/redesign-home-quick-book/specs/space-live-status/spec.md`

### Deployment Notes

- No database schema changes
- No environment variable changes
- No breaking API changes (DTO is extended, not replaced)
- Backward compatible — old clients will ignore `currentStatus` field
