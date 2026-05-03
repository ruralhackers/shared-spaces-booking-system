## Why

The webapp has several UX issues on small screens (≤ 375px) and accessibility gaps that hurt usability: undersized touch targets (theme toggle at 32px, checkboxes at 14px), missing confirmation dialogs before destructive actions (booking cancellation), a silent redirect when the admin key is invalid, and an inaccessible custom delete modal (no focus trap, no Escape key). These are the top findings from a UX audit and need to be addressed before the app is usable on real mobile devices.

## What Changes

- **Increase touch targets** across the app: theme toggle button, open-hours checkboxes, time inputs, and the "All spaces" back link — all brought to ≥ 44px tap area.
- **Add cancel-booking confirmation** on both the public space page and admin bookings page, consistent with the existing delete-space dialog pattern.
- **Show feedback on invalid admin key** instead of silently redirecting to `/`.
- **Replace custom delete dialog** with a proper accessible modal (focus trap, Escape key, `aria-modal`).
- **Minor polish**: clarify cancel-name input purpose with helper text, make "Set to now" more discoverable as a ghost button, dim past bookings visually.

## Non-goals

- Redesigning the overall layout or visual identity.
- Changing the `max-w-3xl` container width.
- Adding a footer, "copy to all days" shortcut, or date-input validation — these are separate enhancements.
- Mobile app (`apps/mobile`) changes — this is webapp-only.

## Capabilities

### New Capabilities

_None — all changes are improvements to existing UI._

### Modified Capabilities

- `space-management`: Adding cancel-booking confirmation flow and visual differentiation for past bookings on the space detail page.

## Impact

- **`apps/webapp`**: All route files under `src/routes/`, `src/features/spaces/booking-form.tsx`, `src/features/spaces/open-hours-editor.tsx`, `src/components/ui/` (if adding a Dialog component).
- **Bounded context**: Presentation layer only — no domain, application, or infrastructure changes.
- **Dependencies**: May need `@radix-ui/react-dialog` (already available via shadcn/ui) if replacing the custom modal.
