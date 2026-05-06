## Why

The "other date" date picker in the availability finder (`AvailabilityFinder`) does not work on iOS Safari. When a user taps "Otra fecha", the native date picker either fails to open or does not update the value because the controlled input starts with an empty string (`value=""`), which iOS Safari handles incorrectly. This blocks mobile users from booking on any date other than today or tomorrow.

## What Changes

- Initialize `chosenDate` to today's date (not `""`) when the "other date" preset is selected, so the `<input type="date">` is never rendered with an empty controlled value on iOS.
- Replace the raw `<input>` element with the shadcn `<Input>` component for consistent styling and touch target sizing on mobile.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `booking-page-layout`: The availability finder date selection UX changes — the "other date" input now pre-selects today's date instead of being blank, and uses the shared `<Input>` component.

## Impact

- `apps/webapp/src/features/spaces/availability-finder.tsx` — `handleOtherPreset` and the date input element.
- No API, backend, or schema changes.
- No breaking changes.

## Non-goals

- Replacing the native date picker with a custom calendar widget.
- Fixing any other date/time inputs in the app (time pickers in advanced booking sheet are out of scope).
