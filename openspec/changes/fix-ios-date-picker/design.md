## Context

`AvailabilityFinder` (`apps/webapp/src/features/spaces/availability-finder.tsx`) lets users search for available spaces. When the user picks "Otra fecha", a controlled `<input type="date">` is rendered with `value={chosenDate}` where `chosenDate` is initialised to `""`.

iOS Safari has a well-documented bug with controlled `<input type="date">` elements whose `value` is an empty string: the native date picker either does not open, or opens but discards the selection on close because React re-renders with `value=""` before iOS can commit the change. The result is that `chosenDate` stays `""`, the time picker never appears, and the user cannot book on any date other than today or tomorrow.

## Goals / Non-Goals

**Goals:**
- Make the "other date" picker work correctly on iOS Safari.
- Keep the fix minimal and contained to `availability-finder.tsx`.
- Use the shared `<Input>` component for consistency.

**Non-Goals:**
- Replacing the native date picker with a custom calendar.
- Fixing time pickers (`type="time"`) in other sheets.
- Any backend or API changes.

## Decisions

### 1. Pre-initialise `chosenDate` to today when "other date" is selected

**Decision:** In `handleOtherPreset`, set `chosenDate` to `localDateString(now, tz)` instead of `""`.

**Rationale:** iOS Safari's broken behaviour only triggers when `value=""`. By always providing a valid date string, the picker opens with today pre-selected and the `onChange` event fires correctly. The user can then change it to any future date. This is the minimal fix with no new dependencies.

**Alternative considered:** Use an uncontrolled input (`defaultValue` + `ref`). Rejected because it breaks React's controlled-input model and makes the value harder to read in `handleSearch`.

### 2. Replace raw `<input>` with shadcn `<Input>`

**Decision:** Swap the manually-styled `<input>` for the `<Input>` component already used everywhere else in the form.

**Rationale:** Consistent touch target size (44px height on mobile), consistent focus ring, and avoids a one-off Tailwind class list that diverges from the design system.

## Risks / Trade-offs

- **iOS still has quirks with `type="date"`** → The fix removes the known empty-value bug; any remaining iOS-specific rendering differences are cosmetic and out of scope.
- **Pre-selecting today may surprise users who want a future date** → Acceptable: the picker opens on today and the user scrolls to their desired date, which is standard iOS UX.

## Migration Plan

Single-file change, no data migration. Deploy via the normal `bash /root/deploy-shared-spaces.sh` flow.
