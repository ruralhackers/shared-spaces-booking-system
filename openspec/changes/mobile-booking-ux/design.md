## Context

The space booking page (`/spaces/:slug`) is a single-page view that combines date navigation, a bookings list, and a booking form. Currently:

- The "Book" submit button lives at the bottom of the form, which is below the fold on mobile after the bookings list.
- The "Today" shortcut is in the date navigation row alongside prev/next arrows and a date picker input.
- The date heading shows verbose text: "Today · Sat, May 2" — too wide for small screens.
- `BookingForm` initialises `startsAt` and `endsAt` as empty strings, requiring the user to type times manually.
- `LanguageSwitcher` uses `variant="ghost"` — indistinguishable from plain text on mobile.

All changes are confined to `apps/webapp` (presentation layer). No API, domain, or database changes are needed.

## Goals / Non-Goals

**Goals**
- Make the primary booking action reachable without scrolling on mobile.
- Reduce cognitive load in the date header (shorter text, less visual noise).
- Pre-fill sensible default times so most users can book in one tap.
- Make the language switcher obviously interactive.

**Non-goals**
- Redesigning the bookings list or cancel flow.
- Changing the mobile app (`apps/mobile`).
- Changing any API surface or domain logic.

## Decisions

### 1. "Book" button placement — page-level header row, not global nav

**Decision**: Add a sticky header row *inside* the space page content (below the global nav), containing the "All spaces" back link on the left and a "Book" button on the right. The global `<header>` in `__root.tsx` is not modified.

**Rationale**: The global nav is shared across all routes; injecting a route-specific action there would require context passing or a portal, adding complexity. A local sticky bar scoped to `SpacePage` is simpler and keeps the global nav clean.

**Alternative considered**: Floating action button (FAB) fixed to bottom-right. Rejected — FABs can overlap content and are less conventional for a form-submit action.

### 2. "Today" button — next to space name, not in date nav row

**Decision**: Move the "Today" button to sit inline with the space name (`<h1>`), as a small ghost/outline button to the right of the name.

**Rationale**: The date nav row is already crowded (prev, date text, date picker, next). Moving "Today" near the space name gives it breathing room and makes it a "reset to now" affordance rather than a navigation control.

### 3. Date heading — numeric day only

**Decision**: Replace `formatDateHeading` output with just the numeric day of month (e.g. `"2"`), with a small relative badge ("Today", "Tomorrow", "Yesterday") when applicable. Remove the weekday and month text.

**Rationale**: On mobile, the date nav row is narrow. The date picker input already shows the full date. The heading just needs to orient the user to which day they're viewing.

### 4. Default times — current hour on the dot, +1 hour

**Decision**: In `BookingForm`, initialise `startsAt` with `currentHourString()` and `endsAt` with `nextHourString()` directly in `useState` (no `useEffect`).

**Rationale**: `currentHourString()` and `nextHourString()` already exist in the file. Moving them from the `setNow()` handler into the initial state is a one-line change with no side effects. The "Set to now" button remains as a reset.

### 5. Language switcher — `variant="outline"`

**Decision**: Change `LanguageSwitcher` from `variant="ghost"` to `variant="outline"`.

**Rationale**: `outline` adds a visible border, making it look like a button. No other changes needed.

## Risks / Trade-offs

- **Sticky inner header on mobile**: A second sticky bar (below the global nav) may feel heavy on very small screens. Mitigation: keep it minimal — just back link + Book button, no extra chrome.
- **Pre-filled times may be wrong for late-night users**: If it's 23:05, start = 23:00, end = 00:00 (next day). The `nextHourString()` already handles `% 24`, so the time string is valid; the API validates that `endsAt > startsAt` in booking-tz terms. Mitigation: acceptable edge case; user can adjust.
- **Date heading loses context**: Removing weekday/month text means users must open the date picker to see the full date. Mitigation: the date picker input is always visible in the nav row.

## Migration Plan

No data migration. All changes are UI-only. Deploy as a normal frontend release.

## Open Questions

- Should the "Book" button in the sticky bar scroll to the form, or open a modal/sheet? (Current plan: scroll to form — simpler, no new component needed.)
- Should the date heading show the short month too on non-today dates (e.g. "2 May")? (Current plan: numeric day only for today/tomorrow/yesterday; short date "2 May" for other days.)
