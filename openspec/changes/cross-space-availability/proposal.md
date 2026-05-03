# Proposal: Cross-Space Availability Finder (Phase 3 of 4)

## Why

The current home page (redesigned in phase 1) optimizes for the 80% use case: "I want to book a space NOW." However, users also need to book for later today, tomorrow, or a specific future time. The original availability search form was removed in phase 1 because it was poorly integrated and not mobile-first.

Real constraints (confirmed by product owner):
- Only **3 spaces** in this deployment
- **1-2 active bookings** per user typical
- Typical booking duration: **1 hour**
- 80% use case: "I want to book a space NOW or LATER TODAY"
- Recurring bookings are an edge case

**This is phase 3 of a 4-phase UX redesign.** Phase 1 (`redesign-home-quick-book`) introduced quick-book cards on the home page. Phase 2 (`redesign-space-detail-timeline`) added a visual timeline to the detail page. Phase 3 brings back cross-space availability search with a redesigned, mobile-first UX that integrates seamlessly into the home page.

The goal: enable users to answer "Which spaces are free at 4pm today?" or "Which spaces are free tomorrow morning?" without navigating away from the home page.

## What Changes

### Frontend — Home Page Availability Section (`apps/webapp`)

**Add** a new section at the bottom of the home page (below the 3 space cards from phase 1):

- **Section heading**: "Reservar para más tarde" (i18n key)
- **Three preset chips**: "Hoy", "Mañana", "Otra fecha"
  - Tapping a chip shows the time picker below
  - Active chip has visual highlight
- **Time picker** (appears when a preset is selected):
  - Two time inputs: "Desde" (start) and "Hasta" (end) in HH:MM format
  - Duration display: "Duración: Xh Ymin" computed automatically
  - "Buscar disponibilidad" button
  - Validation: end > start, minimum 30min duration
- **Preset behavior**:
  - **"Hoy"**: Default times = next round hour from now → +1h. If current time is past close time, fall back to tomorrow's first open hour.
  - **"Mañana"**: Default times = first open hour tomorrow → +1h
  - **"Otra fecha"**: Show date picker first, then time picker with default = first open hour of chosen date → +1h
- **Results section** (appears below time picker after query):
  - Heading: "Para HH:MM – HH:MM" (chosen time window)
  - One row per space:
    - Available space: ✓ icon + space name + "[Reservar]" button
    - Occupied space: ✗ icon + space name + "(occupant name)" + "[Ver día]" button
    - Closed space: grey icon + space name + "Cerrado" label (no button)
  - Empty state when all spaces unavailable: "No hay espacios disponibles en este horario"
  - Loading state during query: skeleton rows
  - Error state on query failure: error message with retry button
- **Actions**:
  - **"[Reservar]" button** → opens `quick-book-sheet.tsx` (from phase 1) pre-filled with chosen time window + space slug
  - **"[Ver día]" button** → navigates to `/spaces/:slug?date=YYYY-MM-DD` (timeline view from phase 2)
- **Layout decision**: Section stays inline on home page (`/`). No separate route. Picker and results stack vertically (picker stays at top for refinement, results below).

**New components**:
- `apps/webapp/src/features/spaces/availability-finder.tsx` — main section component. Owns state for selected preset (today/tomorrow/other), date, times. Triggers tRPC query. Renders preset chips + time picker + results.
- `apps/webapp/src/features/spaces/availability-time-picker.tsx` — subcomponent for start/end time inputs with duration display and validation.
- `apps/webapp/src/features/spaces/availability-results-list.tsx` — subcomponent for results rendering. Receives `SpaceAvailabilityDto[]` from tRPC query, renders rows with action buttons.

**Reuse from phase 1 + 2**:
- `apps/webapp/src/features/spaces/quick-book-sheet.tsx` (phase 1) — already accepts `defaultDate`, `defaultStart`, `defaultEnd`, and `space` props per phase 1's contract.
- Timeline view (phase 2) — phase 2 wires `validateSearch` for `?date=YYYY-MM-DD` in `routes/spaces.$slug.tsx` (phase 2 tasks 9.1–9.4); phase 3 depends on it and navigates with the param.

**Locale keys** (new):
- **Reuse from `common.json`**: `today`, `closed` (already exist)
- **Reuse from `spaces.json`**: `searchAvailability`, `available` (already exist)
- **Add to `spaces.json`**: `bookForLater`, `tomorrow`, `otherDate`, `chooseTime`, `from`, `until`, `duration`, `forTimeWindow`, `noSpacesAvailable`, `viewDay`, `reserve`, `todayClosedShowingTomorrow`, `minimumDuration30min`, `endMustBeAfterStart`, `cannotBookInPast`, `couldNotLoadAvailability`, `retry`
- `booking.json`: (no new keys needed — reuse existing)

### Backend — Extend SpaceAvailabilityDto with `state` field (`packages/spaces`)

**Minor backend extension needed.** The existing `spaces.availability` tRPC procedure (defined in `packages/api/infrastructure/routers/spaces.router.ts` line 23-36) already:
- Accepts `startsAt` and `endsAt` (ISO strings)
- Calls `SpaceAvailabilityChecker.run()` (defined in `packages/spaces/application/space-availability-checker.service.ts`)
- Returns `SpaceAvailabilityDto[]` with fields: `spaceSlug`, `spaceName`, `status` ('available' | 'occupied'), `occupiedBy?`, `color?`

**Change needed**: Extend `SpaceAvailabilityDto` (in `packages/spaces/domain/space-availability.vo.ts`) to add a first-class `state: 'free' | 'occupied' | 'closed'` field. This aligns with phase 1's `currentStatus.state` pattern on `SpaceListerDto` and removes the fragile inference of "closed" from `status === 'occupied' && !occupiedBy`.

**Tasks**:
- Update `SpaceAvailabilityDto` to include `state` field
- Update `SpaceAvailabilityChecker.run()` to return `state: 'closed'` for windows outside the space's open hours
- Update tRPC router output schema to include `state`

**Verification task**: Confirm the DTO includes `color` and `spaceSlug` (both are already present in the current implementation — see `packages/spaces/domain/space-availability.vo.ts` line 4-9).

### Bounded Context

This change belongs to the **`spaces`** bounded context (`packages/spaces`) and the **`webapp`** frontend app (`apps/webapp`).

## Non-goals

- **New tRPC procedures** — reuse `spaces.availability`
- **Multi-day search** ("which day this week is best") — single date only
- **Saved searches or favorites** — out of scope
- **Notifications when a slot opens up** — out of scope
- **Admin changes** — admin panel unchanged
- **Mobile app** — no changes to `apps/mobile` in this phase
- **Animations and polish** (phase 4)
- **Recurring bookings** — flow unchanged (still on detail page via "advanced" sheet)

## Capabilities

### New Capabilities

1. **`cross-space-availability`** — Home page section with preset chips (today/tomorrow/other), time picker, and cross-space results list. Enables users to find available spaces for a chosen time window without navigating away from home.

### Modified Capabilities

None. This change introduces a new capability without modifying existing ones. The existing `spaces.availability` tRPC procedure (introduced in archived change `2026-05-03-availability-search`) is reused as-is.

## Impact

### Affected Packages

- **`packages/spaces`** — MINOR CHANGE: extend `SpaceAvailabilityDto` to add `state: 'free' | 'occupied' | 'closed'` field; update `SpaceAvailabilityChecker.run()` to return `state`
- **`packages/api`** — MINOR CHANGE: update `spaces.availability` tRPC procedure output schema to include `state` field

### Affected Apps

- **`apps/webapp`**:
  - `src/routes/index.tsx` — add `<AvailabilityFinder />` section below the 3 space cards
  - `src/features/spaces/availability-finder.tsx` — NEW
  - `src/features/spaces/availability-time-picker.tsx` — NEW
  - `src/features/spaces/availability-results-list.tsx` — NEW
  - `src/features/spaces/quick-book-sheet.tsx` — extend props to accept `defaultDate`, `defaultStart`, `defaultEnd`, `spaceSlug` (if not already from phase 1)
  - `src/routes/spaces.$slug.tsx` — wire `?date=` query param parsing if not done in phase 2
  - `src/locales/{en,es,gl}/spaces.json` — new keys
  - `src/locales/{en,es,gl}/booking.json` — (no new keys)

### Files Created

- `openspec/changes/cross-space-availability/.openspec.yaml`
- `openspec/changes/cross-space-availability/proposal.md`
- `openspec/changes/cross-space-availability/design.md`
- `openspec/changes/cross-space-availability/tasks.md`
- `openspec/changes/cross-space-availability/specs/cross-space-availability/spec.md`

### Dependencies

**Depends on**:
1. **`redesign-home-quick-book`** (phase 1) — this change reuses `quick-book-sheet.tsx` created in phase 1
2. **`redesign-space-detail-timeline`** (phase 2) — this change navigates to the timeline view with `?date=` query param

### Deployment Notes

- No database schema changes
- No environment variable changes
- No API changes (reuse existing `spaces.availability` procedure)
- Backward compatible — new UI section is additive
