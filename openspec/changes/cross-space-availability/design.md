# Design: Cross-Space Availability Finder

## Context

The home page (redesigned in phase 1) shows 3 large space cards with live status and quick-book buttons for "now" bookings. The detail page (redesigned in phase 2) shows a visual timeline for a single space. Users need a way to search across all 3 spaces for a specific future time window without navigating away from the home page.

The original availability search form (`apps/webapp/src/features/spaces/availability-search.tsx` and `availability-results.tsx`) was removed in phase 1 because it was poorly integrated. This phase brings back the functionality with a mobile-first, preset-driven UX.

The backend `spaces.availability` tRPC procedure already exists (defined in `packages/api/infrastructure/routers/spaces.router.ts` line 23-36) and returns `SpaceAvailabilityDto[]` with fields: `spaceSlug`, `spaceName`, `status`, `occupiedBy?`, `color?`. **Minor backend extension needed**: add a first-class `state: 'free' | 'occupied' | 'closed'` field to `SpaceAvailabilityDto` to align with phase 1's pattern and remove fragile inference of "closed" from `status === 'occupied' && !occupiedBy`.

## Goals / Non-Goals

**Goals:**

- Add a "book for later" section to the home page with preset chips (today/tomorrow/other) and time picker
- Show cross-space availability results inline (no separate route)
- Reuse `quick-book-sheet.tsx` (phase 1) for booking action
- Navigate to timeline view (phase 2) with `?date=` param for "view day" action
- Mobile-first, touch-friendly UX

**Non-Goals:**

- Multi-day search ("which day this week is best")
- Saved searches or favorites
- Notifications when a slot opens up
- New backend procedures (minor extension: add `state` field to `SpaceAvailabilityDto`)
- Animations and polish (phase 4)

## Decisions

### 1. Inline section on home page vs separate `/availability` route

**Decision**: Inline section on home page (`/`).

**Rationale**: With only 3 spaces, the results list is short (3 rows max). Keeping it inline avoids extra navigation and feels more cohesive. The section appears below the 3 space cards, so it doesn't interfere with the primary "book now" flow.

**Alternative rejected**: Separate `/availability` route — adds friction for a simple query.

### 2. Preset chips ("Hoy", "Mañana", "Otra fecha") vs free-form date picker

**Decision**: Preset chips with smart defaults.

**Rationale**: 80% use case is "later today" or "tomorrow morning". Presets optimize for this. "Otra fecha" is available for edge cases.

**Alternative rejected**: Free-form date picker as primary entry point — adds cognitive load for the common case.

### 3. Default times per preset

**Decision**:
- **"Hoy"**: Next round hour from now → +1h. If current time is past close time, fall back to tomorrow's first open hour.
- **"Mañana"**: First open hour tomorrow → +1h.
- **"Otra fecha"**: First open hour of chosen date → +1h.

**Rationale**: Typical booking duration is 1 hour. Rounding to the next hour simplifies mental math. Fallback to tomorrow when "Hoy" is tapped after close time prevents confusion.

**Edge case**: If "now" is 23:45 and close time is 00:00, "Hoy" falls back to tomorrow. This is acceptable — the user can still adjust times manually.

### 4. Time picker UX: native `<input type="time">` vs custom dropdown

**Decision**: Native `<input type="time">` with `step="3600"` (hour increments).

**Rationale**: Native time pickers are well-tested on mobile, support accessibility, and reduce custom code. Hour-step aligns with typical booking patterns.

**Alternative rejected**: Custom dropdown with 30min increments — more code, more testing, marginal UX benefit.

### 5. Minimum duration validation

**Decision**: Minimum 30min duration. Validate on "Buscar disponibilidad" button click.

**Rationale**: Bookings shorter than 30min are rare and likely user error. Validation prevents accidental 0-duration or negative-duration queries.

**Error message**: "La duración mínima es 30 minutos" (i18n key).

### 6. "Cerrado" vs "Ocupado" — when is a space closed vs occupied?

**Decision**: Extend `SpaceAvailabilityDto` to add a first-class `state: 'free' | 'occupied' | 'closed'` field (aligning with phase 1's `currentStatus.state` pattern). Backend `SpaceAvailabilityChecker` will return:
- `state: 'free'` when space is available
- `state: 'occupied'` when space has a booking (with `occupiedBy` name)
- `state: 'closed'` when space is not open during the queried window (no `occupiedBy`)

Frontend interprets: if `state === 'closed'`, show "Cerrado". If `state === 'occupied'`, show occupant name.

**Rationale**: First-class `state` field removes fragile inference and aligns with phase 1's pattern. Minimal backend change.

### 7. Results layout: replace picker vs stack vertically

**Decision**: Stack vertically. Picker stays at top, results appear below.

**Rationale**: Users may want to refine their search after seeing results. Keeping the picker visible avoids scrolling back up.

**Alternative rejected**: Replace picker with results — forces user to tap "back" or "new search" to refine.

### 8. Empty state when all spaces are unavailable

**Decision**: Show friendly message: "No hay espacios disponibles en este horario. Prueba otro horario o revisa el calendario de cada sala." (i18n key).

**Rationale**: Guides user to next action (adjust time or check detail pages).

### 9. Loading state during query

**Decision**: Show 3 skeleton rows (one per space) with shimmer effect.

**Rationale**: Indicates progress, prevents layout shift.

### 10. Error state on query failure

**Decision**: Show error message: "No se pudo cargar la disponibilidad. [Reintentar]" (i18n key) with retry button.

**Rationale**: Network failures are rare but possible. Retry button avoids forcing user to reload the page.

### 11. "Hoy" preset tapped after close time — fallback behavior

**Decision**: If current time is past today's close time, "Hoy" preset defaults to tomorrow's first open hour → +1h. Show a subtle hint: "Hoy ya cerró. Mostrando mañana." (i18n key, dismissible).

**Rationale**: Prevents confusion. User can still manually adjust date if needed.

**Alternative rejected**: Disable "Hoy" chip after close time — less discoverable, adds complexity.

### 12. Time inputs validate end > start

**Decision**: Validate on "Buscar disponibilidad" button click. Show error: "La hora de fin debe ser posterior a la de inicio" (i18n key).

**Rationale**: Prevents invalid queries. Validation on submit (not on blur) avoids interrupting user while typing.

### 13. Query param wiring for `/spaces/:slug?date=`

**Decision**: Verify TanStack Router setup in `routes/spaces.$slug.tsx` supports `?date=` query param. If not, add task to wire it.

**Rationale**: Phase 2 proposal mentions this but doesn't confirm implementation. Verification task ensures it works.

### 14. `quick-book-sheet.tsx` props extension

**Decision**: Extend props to accept `defaultDate?: string`, `defaultStart?: string`, `defaultEnd?: string`, `spaceSlug?: string`. If these are already present from phase 1, no changes needed.

**Rationale**: Sheet needs to pre-fill the chosen time window and space when opened from availability results.

## Risks / Trade-offs

- **User picks a time window that spans open/closed hours** → Backend `SpaceAvailabilityChecker` already handles this (returns 'occupied' if space is not open for the entire window). No mitigation needed.
- **User picks a time window in the past** → Frontend validates: if chosen date+time is in the past, show error: "No puedes reservar en el pasado" (i18n key). Validation on submit.
- **Time picker on iOS Safari has quirks** → Native `<input type="time">` is well-supported on iOS 14+. Fallback: if browser doesn't support it, input degrades to text field (user types HH:MM). Acceptable.
- **Results list is short (3 rows) but could feel empty** → Mitigated by showing space color dots and clear status icons. Empty state message guides next action.

## Migration Plan

No migration needed. This is a new additive feature. Existing users see the new section on the home page after deployment.

## Open Questions

1. **Should "Otra fecha" preset show a calendar picker or a date input field?**
   - **Recommendation**: Use native `<input type="date">` for simplicity. Calendar picker (e.g., shadcn `<Calendar>`) is more visual but adds complexity.
   - **Decision deferred to implementation**: Start with native input, upgrade to calendar picker in phase 4 if user feedback requests it.

2. **Should the section be collapsible (accordion-style) to save space on mobile?**
   - **Recommendation**: No. With only 3 spaces, the section is short. Collapsing adds interaction cost.
   - **Decision**: Keep expanded by default. Revisit in phase 4 if user feedback indicates it's too prominent.

3. **Should the "Buscar disponibilidad" button be sticky at the bottom of the viewport on mobile?**
   - **Recommendation**: No. The section is short enough that the button is always visible without scrolling.
   - **Decision**: Standard button placement. Revisit in phase 4 if user testing shows discoverability issues.
