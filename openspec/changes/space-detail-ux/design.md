# Design: Space Detail UX Improvements

## Context

The space detail page (`/spaces/:slug`) was built in phases:
- `redesign-space-detail-timeline`: Visual timeline (Google Calendar day view style) with slot tap and booking tap interactions
- `recurring-bookings`: `AdvancedBookingSheet` with time editing, recurring options, and series booking

The page currently has three UX issues:
1. The sticky bar only shows a back link — the space name and Advanced Booking button are in the scrollable content
2. The timeline has a nested scroll container (`max-h-[600px]` + `overflow-y-auto`)
3. Slot taps open `QuickBookSheet` instead of `AdvancedBookingSheet`

### Existing Infrastructure

- **Sticky bar**: `<div className="sticky top-14 z-10 bg-background/95 backdrop-blur border-b flex items-center justify-between gap-2 -mx-6 px-6 py-2 mb-4">` at line 215 of `spaces.$slug.tsx`
- **Name block**: `<div className="mb-6">` at lines 240-261 containing `<h1>` with color dot, space name, "Today" button, and description
- **Timeline wrapper**: `<div className="mb-6 overflow-y-auto max-h-[600px]">` at line 297
- **Slot tap handler**: `handleSlotTap(hour)` at line 126 — calculates start/end times and opens `QuickBookSheet`
- **AdvancedBookingSheet**: Accepts `date`, `spaceName`, `onSubmit`, `isPending` — initializes `startsAt` and `endsAt` from `currentHourString()` / `nextHourString()`
- **QuickBookSheet**: Simple sheet with name input and confirm button — used only on this page

### Real Constraints

- Only **3 spaces** in this deployment
- **1-2 active bookings** per user typical
- Typical booking duration: **1 hour**
- Identification by name only (no auth, no PIN)
- 80% use case: "I want to book a space NOW or LATER TODAY"

## Goals / Non-Goals

### Goals

- Move space name (with color dot) and Advanced Booking button into the sticky bar
- Remove the `<h1>` name block from scrollable content
- Remove inner scroll from timeline wrapper
- Make slot taps open `AdvancedBookingSheet` with pre-filled times
- Add `defaultStart`/`defaultEnd` props to `AdvancedBookingSheet`
- Remove `QuickBookSheet` from the space detail page

### Non-Goals

- No changes to the home page or any other route
- No changes to the `QuickBookSheet` component itself
- No changes to the `DayTimeline` component
- No new tRPC procedures
- No backend changes
- No mobile app changes
- No PWA changes
- No new locale keys

## Decisions

### Decision 1: Sticky bar layout — three sections with flexbox

**Decision**: Use the existing `flex items-center justify-between` layout on the sticky bar. Left: "← All spaces" link. Center: space name with color dot. Right: "Advanced Booking" button.

**Rationale**:
- The sticky bar already uses `justify-between` — adding center content naturally fills the space
- Three-section layout is a common mobile pattern (back, title, action)
- No layout shift — the bar height stays the same

**Implementation**:
```tsx
<div className="sticky top-14 z-10 bg-background/95 backdrop-blur border-b flex items-center justify-between gap-2 -mx-6 px-6 py-2 mb-4">
  <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
    <ChevronLeft className="h-3.5 w-3.5" />
    {t('allSpaces')}
  </Link>
  {data && (
    <div className="flex items-center gap-1.5">
      {data.space.color && (
        <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.space.color }} />
      )}
      <span className="text-sm font-medium truncate max-w-[140px]">{data.space.displayName}</span>
    </div>
  )}
  {data && (
    <Button variant="outline" size="sm" onClick={() => setAdvancedOpen(true)}>
      {t('booking:advancedBooking')}
    </Button>
  )}
</div>
```

**Alternatives considered**:
- **Keep name in scrollable content**: Defeats the purpose — users must scroll to see what space they're viewing. Rejected.
- **Only add name, keep Advanced Booking button below**: Inconsistent — the button should be always accessible. Rejected.

### Decision 2: Remove `<h1>` name block entirely

**Decision**: Remove lines 240-261 (the `<div className="mb-6">` containing the `<h1>`, color dot, "Today" button, and description). The "Today" button moves into the date navigation row (next to the date input). The description moves below the sticky bar as a subtle subtitle.

**Rationale**:
- The name is now in the sticky bar — duplicating it would be redundant
- The "Today" button is more useful next to the date navigation controls
- The description is secondary info — a subtle subtitle below the sticky bar is sufficient

**Implementation**:
- Remove the entire `<div className="mb-6">` block (lines 240-261)
- Add description as a subtle line below the sticky bar: `<p className="text-xs text-muted-foreground mb-4">{data.space.description}</p>`
- Move "Today" button next to the date input in the date navigation row

**Alternatives considered**:
- **Keep name block but hide the name**: Would leave an empty block with just the description. Rejected.
- **Keep "Today" button in sticky bar**: Would clutter the sticky bar. Rejected.

### Decision 3: Remove inner scroll from timeline

**Decision**: Remove `overflow-y-auto` and `max-h-[600px]` from the timeline wrapper `<div>`. Keep only `mb-6` for spacing.

**Rationale**:
- Nested scrolling is disorienting — users must scroll within a scroll
- The timeline should flow naturally with the page
- On mobile, the timeline is the primary content — it should not be constrained
- The page already has a sticky bar for navigation — users can always access it

**Implementation**:
```tsx
// Before:
<div className="mb-6 overflow-y-auto max-h-[600px]">

// After:
<div className="mb-6">
```

**Alternatives considered**:
- **Keep inner scroll but increase max-h**: Still creates nested scrolling. Rejected.
- **Make the whole page scroll within a fixed viewport**: Over-engineering for this use case. Rejected.

### Decision 4: Slot tap opens AdvancedBookingSheet with pre-filled times

**Decision**: Update `handleSlotTap` to set `advancedOpen(true)` instead of `setQuickBookOpen(true)`. Pass the calculated start/end times as `defaultStart`/`defaultEnd` props to `AdvancedBookingSheet`. Remove `quickBookOpen`, `quickBookDefaults` state, and the `QuickBookSheet` JSX.

**Rationale**:
- The `AdvancedBookingSheet` is more appropriate for timeline interactions — users are visually selecting a time range and may want to adjust it
- The `QuickBookSheet` is designed for quick, pre-set durations (30min/1h/2h) — not for timeline-based selection
- Removing `QuickBookSheet` simplifies the page (fewer states, fewer components)
- The `AdvancedBookingSheet` already handles single bookings — no loss of functionality

**Implementation**:
- `handleSlotTap` calculates start/end as before, then calls `setAdvancedOpen(true)`
- Store `defaultStart` and `defaultEnd` as HH:MM strings in state
- Pass them to `AdvancedBookingSheet` as new optional props
- `AdvancedBookingSheet` uses these props to initialize `startsAt`/`endsAt` state instead of `currentHourString()`/`nextHourString()`

**Alternatives considered**:
- **Keep QuickBookSheet for slot taps**: Less useful — users can't adjust times or set recurring. Rejected.
- **Open a different sheet**: The AdvancedBookingSheet already exists and handles all cases. Rejected.

### Decision 5: Add defaultStart/defaultEnd props to AdvancedBookingSheet

**Decision**: Add optional `defaultStart?: string` and `defaultEnd?: string` props (HH:MM format, e.g. "14:00") to `AdvancedBookingSheetProps`. When provided, use them to initialize `startsAt`/`endsAt` state instead of `currentHourString()`/`nextHourString()`. When not provided, fall back to the current behavior.

**Rationale**:
- Backward compatible — existing callers (the "Advanced Booking" button at the bottom) don't pass these props and get the current behavior
- Simple — just two optional string props
- The HH:MM format matches the existing `startsAt`/`endsAt` state format

**Implementation**:
```tsx
interface AdvancedBookingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  spaceName: string
  onSubmit: (data: AdvancedBookingFormData) => void
  isPending?: boolean
  defaultStart?: string  // HH:MM, e.g. "14:00"
  defaultEnd?: string    // HH:MM, e.g. "15:00"
}

// In the component:
const [startsAt, setStartsAt] = useState(defaultStart ?? currentHourString)
const [endsAt, setEndsAt] = useState(defaultEnd ?? nextHourString)
```

**Alternatives considered**:
- **Pass full ISO strings**: More complex — the component works with HH:MM internally. Rejected.
- **Use a callback to set initial values**: Over-engineering. Rejected.

### Decision 6: Remove QuickBookSheet from spaces.$slug.tsx

**Decision**: Remove the `QuickBookSheet` import, the `quickBookOpen`/`quickBookDefaults` state, and the `<QuickBookSheet>` JSX block (lines 319-337). The `QuickBookSheet` component itself remains in the codebase for potential use on other pages.

**Rationale**:
- The `QuickBookSheet` is no longer used on this page
- Removing unused code reduces complexity and bundle size (tree-shaking will handle the import)
- The component stays available for other routes

**Alternatives considered**:
- **Delete QuickBookSheet entirely**: It may be used elsewhere or in the future. Rejected.

## Risks / Trade-offs

### Risk 1: Sticky bar may feel crowded on small screens

**Mitigation**: Use `truncate` with `max-w-[140px]` on the space name to prevent overflow. The "Advanced Booking" button uses `size="sm"` to stay compact. On very small screens (< 360px), the button text may need to be abbreviated.

**Trade-off**: Slightly less space for the name, but the name is still visible and the button is always accessible.

### Risk 2: Removing inner scroll may make the page feel long

**Mitigation**: The timeline is the primary content — users expect to scroll through it. The sticky bar provides persistent navigation. The page already has a max-width of `max-w-3xl` which keeps content focused.

**Trade-off**: Users must scroll more to see the full day, but this is natural for a timeline view.

### Risk 3: AdvancedBookingSheet may feel heavy for simple bookings

**Mitigation**: The sheet defaults to single booking mode (not recurring). The time inputs are pre-filled. Users can tap "Book" immediately without changing anything — same number of taps as the QuickBookSheet.

**Trade-off**: The sheet has more UI elements (time inputs, repeat toggle), but they don't add friction for the simple case.

## Migration Plan

### This change

1. Add `defaultStart`/`defaultEnd` props to `AdvancedBookingSheet`
2. Update sticky bar to include space name and Advanced Booking button
3. Remove `<h1>` name block, move description and "Today" button
4. Remove inner scroll from timeline wrapper
5. Update `handleSlotTap` to open `AdvancedBookingSheet`
6. Remove `QuickBookSheet` state and JSX from the page
7. Validation + commit

### Rollback

All changes are in `apps/webapp/src/`. Rollback is a simple git revert of the commit.

## Open Questions

None. All decisions are clear and scoped.
