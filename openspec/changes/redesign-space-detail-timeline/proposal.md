# Proposal: Redesign Space Detail with Visual Timeline (Phase 2 of 4)

## Why

The current space detail page (`apps/webapp/src/routes/spaces.$slug.tsx`) presents bookings as a disconnected list followed by a separate booking form. This design forces users to:

1. Read through a list of bookings to understand availability
2. Scroll to the form section
3. Manually type start/end times, hoping they don't conflict with existing bookings

This is optimized for data entry, not for the dominant use case: **"I want to see the day at a glance and tap a free slot to reserve it."**

Real constraints (confirmed by product owner):
- Only **3 spaces** in this deployment
- **1-2 active bookings** per user typical
- Typical booking duration: **1 hour**
- 80% use case: "I want to book a space NOW or LATER TODAY"
- Recurring bookings are an edge case

**This is phase 2 of a 4-phase UX redesign.** Phase 1 (`redesign-home-quick-book`) introduced quick-book on the home page. Phase 2 replaces the detail page's list+form with a **vertical visual timeline** (Google Calendar day view style) where users can tap free slots to reserve and tap their own bookings to cancel.

## What Changes

### Frontend — Space Detail Page (`apps/webapp`)

**Replace** the bookings list + form sections with a vertical timeline:

- **Vertical timeline** rendering the day:
  - Each hour is a fixed-height row (56px minimum for touch targets)
  - Time gutter on left (HH labels)
  - Booking blocks positioned absolutely with top/height proportional to start/end minutes
  - Booking blocks show booker name centered, colored with space.color
  - Free slots are tappable (light background)
  - "Now" indicator line (horizontal) at current time, only visible on today, auto-scrolled into view on mount, updates every minute
  - Closed hours outside open hours are not rendered (timeline shows only open hours range)
  - Closed days show empty state "Cerrado los {weekday}" instead of timeline

- **Date navigation** preserved:
  - Prev/next buttons + date input
  - "Today" button (only visible when viewing a different day)

- **Tap on free slot** → opens `quick-book-sheet.tsx` (created in phase 1, reused here) with:
  - Start time = tapped hour rounded down to hour boundary
  - End time = start + 1h, capped at next booking or close time
  - User can adjust times in sheet before confirming
  - Name input pre-filled from localStorage

- **Tap on own booking** → opens `cancel-booking-dialog.tsx` (existing) as modal instead of inline form

- **"Reserva avanzada (recurrente)" button** at bottom → opens new `advanced-booking-sheet.tsx` with full form (single OR recurring, with all current options). This preserves current functionality but moves it out of the main flow.

**Remove**:
- `apps/webapp/src/features/spaces/booking-form.tsx` — removed from main detail flow, logic extracted to `advanced-booking-sheet.tsx`
- `apps/webapp/src/features/spaces/booking-list-item.tsx` — replaced by booking blocks in timeline

**New components**:
- `apps/webapp/src/features/spaces/day-timeline.tsx` — main timeline component. Props: `bookings`, `openHours`, `date`, `onSlotTap`, `onBookingTap`. Computes layout, renders gutter + slots + blocks + now-indicator.
- `apps/webapp/src/features/spaces/now-indicator.tsx` — subcomponent for "now" line, auto-updates with `useEffect` + `setInterval(60_000)`
- `apps/webapp/src/features/spaces/advanced-booking-sheet.tsx` — wraps existing recurring form, presented as bottom sheet

**Reuse from phase 1**:
- `apps/webapp/src/features/spaces/quick-book-sheet.tsx` — extended with optional `defaultStart` and `defaultEnd` props

**Locale keys** (new):
- `booking.json`: `advancedBooking`, `tapToReserve`, `closedOn`, `freeSlot`, `openHours`

### Backend — Open Hours in Day View (`packages/spaces`)

**Extend** `SpaceDayViewer` application service to return `openHoursForDay`:

- **Current DTO** (`packages/spaces/application/dtos/index.ts`):
  ```typescript
  interface DayViewDto {
    space: SpaceDto
    date: string
    bookings: BookingDto[]
  }
  ```

- **New DTO** (extend `DayViewDto`):
  ```typescript
  interface DayViewDto {
    space: SpaceDto
    date: string
    openHoursForDay: OpenHoursWindow[] // already computed in service, now exposed in DTO
    bookings: BookingDto[]
  }
  ```

**Application changes**:
- `SpaceDayViewer.run()` already computes `openHoursForDay` internally (line 26 in `space-day-viewer.service.ts`). Change: include it in the returned DTO (line 28-40).

**No domain changes needed** — `Space` entity already has `openHours` and the service already computes the day's windows.

**No tRPC procedure signature change** — `spaces.dayView` continues to return `DayViewDto`, but the DTO shape is extended.

### Bounded Context

This change belongs to the **`spaces`** bounded context (`packages/spaces`) and the **`webapp`** frontend app (`apps/webapp`).

## Non-goals

- **Home page** is NOT touched (phase 1 deliverable)
- **Cross-space availability flow** not added (phase 3)
- **Animations and polish** (phase 4)
- **Drag-to-resize bookings** — out of scope
- **Multi-day view** — out of scope
- **Swipe gestures** for date navigation — deferred to phase 4
- **Admin changes** — admin panel unchanged
- **Mobile app** — no changes to `apps/mobile` in this phase

## Capabilities

### New Capabilities

1. **`space-day-timeline`** — Visual timeline UX for space detail page, rendering bookings as positioned blocks on a vertical hour grid
2. **`tap-to-reserve`** — Interaction pattern: tap free slot → quick-book sheet, tap own booking → cancel dialog

### Modified Capabilities

1. **`booking-page-layout`** (defined in `mobile-booking-ux` change) — Several requirements are REMOVED because the old form-at-bottom flow is replaced by the timeline:
   - "Book button is always visible without scrolling" → REMOVED (replaced by tap-to-reserve from timeline)
   - "Booking form pre-fills default times on load" → REMOVED (no separate booking form anymore; quick-book sheet handles defaults)
   - Preserved: "Today shortcut next to space name", "Date heading shows compact day label", "Language switcher has visible border" (still apply)

## Impact

### Affected Packages

- **`packages/spaces`** (application):
  - `application/space-day-viewer.service.ts` — extend DTO to include `openHoursForDay`
  - `application/dtos/index.ts` — extend `DayViewDto` interface

- **`packages/api`**:
  - `infrastructure/routers/spaces.router.ts` — no signature change, but DTO shape extended

### Affected Apps

- **`apps/webapp`**:
  - `src/routes/spaces.$slug.tsx` — full rewrite of body (timeline replaces list+form)
  - `src/features/spaces/day-timeline.tsx` — NEW
  - `src/features/spaces/now-indicator.tsx` — NEW
  - `src/features/spaces/advanced-booking-sheet.tsx` — NEW
  - `src/features/spaces/quick-book-sheet.tsx` — extend with optional `defaultStart`/`defaultEnd` props (created in phase 1)
  - `src/features/spaces/booking-form.tsx` — refactor into shared parts for `advanced-booking-sheet`
  - `src/features/spaces/booking-list-item.tsx` — REMOVED
  - `src/features/spaces/cancel-booking-dialog.tsx` — KEPT, invoked from timeline tap instead of inline
  - `src/locales/{en,es,gl}/booking.json` — new keys

### Files Created

- `openspec/changes/redesign-space-detail-timeline/.openspec.yaml`
- `openspec/changes/redesign-space-detail-timeline/proposal.md`
- `openspec/changes/redesign-space-detail-timeline/design.md`
- `openspec/changes/redesign-space-detail-timeline/tasks.md`
- `openspec/changes/redesign-space-detail-timeline/specs/space-day-timeline/spec.md`
- `openspec/changes/redesign-space-detail-timeline/specs/tap-to-reserve/spec.md`
- `openspec/changes/redesign-space-detail-timeline/specs/booking-page-layout/spec.md` (REMOVED requirements)

### Dependencies

**Depends on**: `redesign-home-quick-book` (phase 1) — this change reuses `quick-book-sheet.tsx` created in phase 1.

### Deployment Notes

- No database schema changes
- No environment variable changes
- No breaking API changes (DTO is extended, not replaced)
- Backward compatible — old clients will ignore `openHoursForDay` field
