# Design: Redesign Space Detail with Day Timeline

## Context

The space detail page (`/spaces/:slug`) currently displays bookings as a list followed by a separate booking form. Users must:
1. Scan the list to understand availability
2. Scroll to the form
3. Manually type times, hoping they don't conflict

This is phase 2 of a 4-phase UX redesign. Phase 1 (`redesign-home-quick-book`) introduced quick-book on the home page. Phase 2 replaces the detail page's list+form with a **vertical visual timeline** (Google Calendar day view style).

Real constraints:
- Only **3 spaces** in this deployment
- Typical booking duration: **1 hour**
- 80% use case: "I want to book a space NOW or LATER TODAY"
- Recurring bookings are an edge case (hide behind "advanced" sheet)

All changes are confined to `apps/webapp` (presentation layer) and `packages/spaces` (application layer — DTO extension only). No domain or database changes.

## Goals / Non-Goals

**Goals**
- Replace disconnected list+form with a visual timeline that shows the day at a glance
- Enable tap-to-reserve on free slots (opens quick-book sheet with pre-filled times)
- Enable tap-to-cancel on own bookings (opens cancel dialog)
- Preserve recurring booking functionality behind an "advanced" button
- Reuse `quick-book-sheet.tsx` from phase 1

**Non-goals**
- Home page changes (phase 1 deliverable)
- Cross-space availability flow (phase 3)
- Animations and polish (phase 4)
- Drag-to-resize bookings
- Multi-day view
- Swipe gestures for date navigation (deferred to phase 4)
- Mobile app changes

## Decisions

### 1. Hour row height — 56px minimum for touch targets

**Decision**: Each hour row in the timeline is 56px tall (3.5rem). Sub-hour bookings are positioned absolutely within the row using proportional top/height based on start/end minutes.

**Rationale**: iOS Human Interface Guidelines recommend 44pt minimum touch target; Material Design recommends 48dp. 56px (3.5rem) provides comfortable touch targets on mobile while keeping the timeline compact enough to show 4-5 hours on screen without scrolling.

**Alternative considered**: 48px (3rem) — rejected because it's too tight for bookings shorter than 30 minutes (would be only 24px tall, below minimum touch target).

### 2. Sub-hour positioning math

**Decision**: Booking blocks are positioned using:
- `top = (startMinutes / 60) * hourRowHeight`
- `height = ((endMinutes - startMinutes) / 60) * hourRowHeight`

Where `startMinutes` and `endMinutes` are minutes since midnight.

**Rationale**: Standard calendar layout math. A booking from 10:30–11:15 starts at row 10 + 30/60 of row height, with height = 45/60 * row height.

**Alternative considered**: Snap all bookings to hour boundaries in the UI — rejected because it would misrepresent actual booking times and cause confusion.

### 3. Closed hours — hide them unless bookings exist

**Decision**: The timeline only renders rows for open hours. Hours outside the space's open hours for the day are not rendered UNLESS a booking exists at that hour (defensive case).

**Rationale**: Simpler UI, less scrolling. Users don't need to see "closed" rows when the space is never open during those hours. However, if a booking exists outside open hours (shouldn't happen by domain, but defensive UI), that hour row MUST be rendered with a "closed" visual indicator (grey background or badge) so the booking is visible.

**Alternative considered**: Render all 24 hours with closed hours greyed out — rejected because it adds visual noise and requires more scrolling. Render closed hours without bookings — rejected because it's unnecessary clutter.

### 4. Tap-to-reserve start time rounding — hour boundary

**Decision**: When a user taps a free slot, the quick-book sheet pre-fills start time = the hour of the tapped row (rounded down to hour boundary, e.g., tap anywhere in the 10:00 row → start = 10:00).

**Rationale**: Simplest rounding. Most bookings start on the hour. Users can adjust to 15-minute increments in the sheet if needed.

**Alternative considered**: Round to nearest 15-minute increment based on tap Y position within the row — rejected because it adds complexity and may feel unpredictable (user taps "somewhere in the 10:00 row" and gets 10:15 or 10:30 depending on exact tap position).

### 5. Default duration for tap-to-reserve — 1 hour, capped

**Decision**: End time = start + 1h, capped at the earlier of:
- Next booking start time
- Space close time for the day

**Rationale**: 1 hour is the typical booking duration (confirmed by product owner). Capping at next booking prevents overlaps. Capping at close time prevents bookings that extend past open hours.

**Alternative considered**: Fixed 1h without capping — rejected because it would allow the sheet to pre-fill invalid times (overlapping or past close time), forcing the user to fix them.

### 6. Now-indicator update frequency — every minute

**Decision**: The "now" indicator line updates its position every 60 seconds via `setInterval(60_000)` in a `useEffect`.

**Rationale**: Minute-level precision is sufficient for booking UX. Updating every second would be wasteful (no user-visible change within a minute). Updating less frequently (e.g., every 5 minutes) would feel stale.

**Alternative considered**: Update on every render — rejected because it would cause unnecessary re-renders and battery drain.

### 7. Auto-scroll on mount — smooth scroll to "now" line

**Decision**: When the timeline mounts and the selected date is today, the component auto-scrolls to center the "now" indicator line in the viewport using `scrollIntoView({ behavior: 'smooth', block: 'center' })`.

**Rationale**: Orients the user to the current time immediately. Smooth scroll feels polished. Centering the line (not top/bottom) keeps context visible above and below.

**Alternative considered**: Instant scroll (`behavior: 'auto'`) — rejected because it feels jarring. Scroll to top of "now" hour (`block: 'start'`) — rejected because it hides earlier bookings.

### 8. Color of booking blocks — space.color directly

**Decision**: Booking blocks use `space.color` as the background color, with white text for the booker name.

**Rationale**: Consistent with the existing space card design (phase 1). Each space has a distinct color; using it for bookings reinforces the space identity.

**Alternative considered**: Use a default "booking" color (e.g., blue) for all bookings — rejected because it loses the space identity. Use a darker shade of `space.color` — rejected because it adds complexity (color manipulation) and may reduce contrast.

### 9. Overlapping bookings — defensive stacking

**Decision**: If two bookings overlap (shouldn't happen by domain, but defensive UI), render them side-by-side with reduced width (50% each) within the hour row.

**Rationale**: Defensive programming. If a bug or race condition creates overlapping bookings, the UI should still render them both (not hide one). Side-by-side layout makes the conflict visible.

**Alternative considered**: Render overlapping bookings on top of each other with z-index — rejected because it would hide one booking. Throw an error — rejected because it would break the page.

### 10. Time formatting — 24-hour format

**Decision**: Time labels in the gutter use 24-hour format (e.g., "09", "14", "22") without ":00" suffix.

**Rationale**: The existing app uses 24-hour format via `formatTime` helper. Consistent with user expectations. Removing ":00" keeps the gutter compact.

**Alternative considered**: 12-hour format with AM/PM — rejected because it's inconsistent with the rest of the app and takes more horizontal space.

### 11. Mobile gestures — deferred to phase 4

**Decision**: Swipe left/right for prev/next day is NOT implemented in this phase. Users navigate via prev/next buttons + date input.

**Rationale**: Swipe gestures are polish, not core functionality. Phase 4 is dedicated to animations and polish. Implementing swipe now would delay phase 2 delivery.

**Alternative considered**: Implement swipe now — rejected because it adds complexity (gesture detection, conflict with scroll, accessibility) and is not essential for the 80% use case.

## Risks / Trade-offs

- **Timeline may feel unfamiliar to users accustomed to list+form**: Mitigation: The timeline is a widely-recognized pattern (Google Calendar, Outlook, Apple Calendar). The "advanced booking" button preserves the old form for users who prefer it.
- **Sub-hour bookings may be hard to tap on mobile**: Mitigation: Minimum hour row height (56px) ensures even 30-minute bookings are 28px tall, above the 24px minimum. Bookings shorter than 30 minutes are rare (typical duration is 1 hour).
- **Overlapping bookings (defensive case) may look broken**: Mitigation: Side-by-side layout makes the conflict visible. The domain should prevent overlaps, so this is a last-resort fallback.
- **Auto-scroll on mount may disorient users**: Mitigation: Smooth scroll (not instant) and centering (not top) keep context visible. Only happens on today; other days load at the top.
- **"Advanced booking" button may be overlooked**: Mitigation: Place it prominently at the bottom of the timeline, with clear label "Reserva avanzada (recurrente)". Users who need recurring bookings will find it.

## Migration Plan

No data migration. All changes are UI-only and DTO-extension (backward compatible). Deploy as a normal frontend release.

**Rollout**:
1. Deploy backend change (extend `DayViewDto` with `openHoursForDay`) — backward compatible, old clients ignore the new field.
2. Deploy frontend change (new timeline components, rewrite `spaces.$slug.tsx`).
3. Monitor for user feedback on timeline UX.

**Rollback**: If critical issues arise, revert frontend to previous version. Backend change is harmless (just adds a field).

## Open Questions

1. **Should the timeline show a visual indicator for "current booking" (user's own booking)?** Current plan: no special indicator; user recognizes their name. Could add a subtle border or icon in phase 4 if users report confusion.

2. **Should tapping someone else's booking show a tooltip with booking details (booker name, time)?** Current plan: no action on tap (booking block already shows booker name). Could add a tooltip in phase 4 if users request it.

3. **Should the "advanced booking" button be at the top or bottom of the timeline?** Current plan: bottom (after the timeline). Rationale: keeps the timeline as the primary focus. Alternative: top (before the timeline) — would make it more discoverable but push the timeline down.

4. **Should closed days show an empty state or redirect to the next open day?** Current plan: show empty state "Cerrado los {weekday}". Rationale: preserves user intent (they navigated to that day). Alternative: auto-redirect to next open day — rejected because it's surprising (user loses control of navigation).
