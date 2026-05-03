## Why

The booking page (`/spaces/:slug`) was designed desktop-first and has several friction points on mobile: the "Book" button is buried at the bottom of a long scroll, the date heading wastes space with verbose text, the default time requires manual input, and the language switcher looks like plain text rather than a tappable control. These issues make the core booking flow harder to use on phones, which is the primary device for most users.

## What Changes

- **"Book" button moves to the top-right header area** of the space page, at the same height as the "All spaces" back link — always visible without scrolling.
- **"Today" button moves next to the space name** (top of content area), replacing the current position in the date navigation row.
- **Date heading simplified** — remove the verbose "Today · Sat, May 2" format; show only the numeric day (e.g. "2") or a short relative label ("Today", "Tomorrow", "Yesterday") without the weekday/month text.
- **Default booking time pre-filled on page load** — start time = current hour on the dot (e.g. 10:00 if it's 10:05), end time = start + 1 hour. No manual input needed for the common case.
- **Language switcher gets a visible border** — change from `variant="ghost"` to `variant="outline"` so it looks like a button, not plain text.

## Non-goals

- No changes to the mobile app (`apps/mobile`).
- No changes to the booking API or domain logic.
- No changes to the admin pages.
- No redesign of the bookings list or cancel flow.

## Capabilities

### New Capabilities

- `booking-page-layout`: Revised layout for the space booking page — sticky "Book" action in the header area, simplified date display, pre-filled default times, and repositioned "Today" shortcut.

### Modified Capabilities

- (none — this is a presentation-only change; no existing spec requirements change)

## Impact

- `apps/webapp/src/routes/spaces.$slug.tsx` — layout restructure, date heading simplification, "Today" button relocation.
- `apps/webapp/src/features/spaces/booking-form.tsx` — pre-fill start/end times on mount.
- `apps/webapp/src/components/language-switcher.tsx` — `variant="outline"` instead of `variant="ghost"`.
- `apps/webapp/src/locales/{en,es,gl}/booking.json` — possibly remove or simplify date label keys.
- No API, domain, or database changes.
