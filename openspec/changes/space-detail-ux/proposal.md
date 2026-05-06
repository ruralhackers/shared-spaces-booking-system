# Proposal: Space Detail UX Improvements

## Why

The space detail page (`/spaces/:slug`) has three UX issues that degrade the booking experience:

1. **Sticky bar is underutilized**: The sticky top bar only shows a "← All spaces" back link. The space name and the "Advanced Booking" button are buried in the scrollable content, requiring users to scroll to see what space they're viewing or to access advanced booking.

2. **Timeline has an inner scroll container**: The timeline is wrapped in a `max-h-[600px]` + `overflow-y-auto` container, creating a nested scroll area. This is disorienting — users must scroll within a scroll, and the timeline feels cramped.

3. **Slot tap opens the wrong sheet**: Tapping a free slot on the timeline opens the `QuickBookSheet` (simple name + confirm), but the `AdvancedBookingSheet` (with time editing, recurring options) is more appropriate for timeline interactions where users are visually selecting a time range. The `QuickBookSheet` becomes redundant on this page.

These are small, high-impact changes that make the space detail page feel more cohesive and reduce friction in the booking flow.

## What Changes

### 1. Sticky bar: name + Advanced Booking button

Move the space name (with color dot) and the "Advanced Booking" button into the sticky top bar, alongside the existing "← All spaces" link. Remove the `<h1>` name block from the scrollable content since it's now in the sticky bar.

```
┌─────────────────────────────────────────────────────┐
│ ← All spaces   🟣 Sala L          [Advanced Booking]│  ← sticky
└─────────────────────────────────────────────────────┘
```

### 2. Remove inner scroll from timeline

Remove `overflow-y-auto` and `max-h-[600px]` from the timeline wrapper so the timeline flows naturally with the page scroll. No inner scroll container.

### 3. Slot tap opens AdvancedBookingSheet instead of QuickBookSheet

Update `handleSlotTap` to open the `AdvancedBookingSheet` with pre-calculated start/end times passed as defaults. Add optional `defaultStart` and `defaultEnd` (HH:MM strings) props to `AdvancedBookingSheet` to pre-fill the time inputs. Remove the `QuickBookSheet` from this page entirely.

### Files Involved

- `apps/webapp/src/routes/spaces.$slug.tsx` — main page (sticky bar, timeline, slot tap)
- `apps/webapp/src/features/spaces/advanced-booking-sheet.tsx` — needs `defaultStart`/`defaultEnd` props

### Bounded Context

This change belongs to the **`webapp`** frontend application (`apps/webapp`). No backend changes.

## Non-goals

- No changes to the home page or any other route
- No changes to the `QuickBookSheet` component itself (it remains available for other pages)
- No changes to the `DayTimeline` component
- No new tRPC procedures
- No backend changes
- No mobile app changes (`apps/mobile`)
- No PWA changes
- No new locale keys (reuses existing keys)

## Capabilities

### Modified Capabilities

1. **`booking-page-layout`** — Sticky bar now includes space name and Advanced Booking button; name block removed from scrollable content; timeline inner scroll removed; slot tap opens AdvancedBookingSheet with pre-filled times.

## Impact

### Affected Packages

None. This is a frontend-only change.

### Affected Apps

- **`apps/webapp`**:
  - `src/routes/spaces.$slug.tsx` — MODIFIED (sticky bar, timeline wrapper, slot tap handler, remove QuickBookSheet)
  - `src/features/spaces/advanced-booking-sheet.tsx` — MODIFIED (add defaultStart/defaultEnd props)

### Files Created

- `openspec/changes/space-detail-ux/.openspec.yaml`
- `openspec/changes/space-detail-ux/proposal.md`
- `openspec/changes/space-detail-ux/design.md`
- `openspec/changes/space-detail-ux/specs/space-detail-ux/spec.md`
- `openspec/changes/space-detail-ux/tasks.md`

### Deployment Notes

- No database schema changes
- No environment variable changes
- No API changes
- No breaking changes
- Backward compatible — this is a frontend-only UX improvement

### Dependencies

This change depends on the following being deployed:
- `redesign-space-detail-timeline` — the visual timeline that this change enhances
- `recurring-bookings` — the `AdvancedBookingSheet` that slot taps will now open
