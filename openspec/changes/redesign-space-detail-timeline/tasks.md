## 1. Backend: Extend DayViewDto with openHoursForDay

- [ ] 1.1 **RED**: In `packages/spaces/application/space-day-viewer.service.test.ts`, add test asserting that `openHoursForDay` is present in the returned DTO
  - **GIVEN** a space with open hours on the selected day
  - **WHEN** `SpaceDayViewer.run()` is called
  - **THEN** the returned DTO SHALL include `openHoursForDay: OpenHoursWindow[]`
- [ ] 1.2 **GREEN**: In `packages/spaces/application/dtos/index.ts`, extend `DayViewDto` interface to include `openHoursForDay: OpenHoursWindow[]`
- [ ] 1.3 **GREEN**: In `packages/spaces/application/space-day-viewer.service.ts`, include `openHoursForDay` in the returned DTO (already computed on line 26, just add to return object on line 28-40)
- [ ] 1.4 **REFACTOR**: Review naming and structure; ensure consistency with existing DTO patterns
- [ ] 1.5 **COMMIT**: `feat(spaces): extend DayViewDto with openHoursForDay`

## 2. Frontend: DayTimeline component (TDD)

- [ ] 2.1 **RED**: Create `apps/webapp/src/features/spaces/day-timeline.test.tsx` with test "renders hour rows for open hours range"
  - **GIVEN** openHours = [{ start: "09:00", end: "22:00" }]
  - **WHEN** DayTimeline is rendered
  - **THEN** hour labels "09", "10", ..., "21" SHALL be visible (22 is the end boundary, not rendered as a row)
- [ ] 2.2 **GREEN**: Create `apps/webapp/src/features/spaces/day-timeline.tsx` with props `{ bookings, openHours, date, onSlotTap, onBookingTap }`. Render hour rows for the open hours range.
- [ ] 2.3 **COMMIT**: `feat(webapp): add DayTimeline component with hour rows`
- [ ] 2.4 **RED**: Add test "positions booking block proportional to start/end minutes"
  - **GIVEN** booking from 10:30 to 11:15, hourRowHeight = 56px
  - **WHEN** DayTimeline is rendered
  - **THEN** booking block SHALL have `top = 10.5 * 56px` and `height = 0.75 * 56px`
- [ ] 2.5 **GREEN**: Implement booking block positioning with absolute positioning and proportional top/height
- [ ] 2.6 **COMMIT**: `feat(webapp): position booking blocks proportionally`
- [ ] 2.7 **RED**: Add test "displays booker name in booking block"
  - **GIVEN** booking with bookerName = "Marta"
  - **WHEN** DayTimeline is rendered
  - **THEN** booking block SHALL display "Marta"
- [ ] 2.8 **GREEN**: Render booker name centered in booking block
- [ ] 2.9 **COMMIT**: `feat(webapp): display booker name in booking blocks`
- [ ] 2.10 **RED**: Add test "calls onSlotTap when free slot is clicked"
  - **GIVEN** free slot at hour 10
  - **WHEN** user clicks the slot
  - **THEN** onSlotTap SHALL be called with hour = 10
- [ ] 2.11 **GREEN**: Add click handler to free slots that calls `onSlotTap(hour)`
- [ ] 2.12 **COMMIT**: `feat(webapp): handle free slot tap`
- [ ] 2.13 **RED**: Add test "calls onBookingTap when booking block is clicked"
  - **GIVEN** booking block for booking id "123"
  - **WHEN** user clicks the block
  - **THEN** onBookingTap SHALL be called with bookingId = "123"
- [ ] 2.14 **GREEN**: Add click handler to booking blocks that calls `onBookingTap(bookingId)`
- [ ] 2.15 **COMMIT**: `feat(webapp): handle booking block tap`
- [ ] 2.16 **RED**: Add test "renders overlapping bookings side-by-side"
  - **GIVEN** two bookings that overlap (10:00-11:00 and 10:30-11:30)
  - **WHEN** DayTimeline is rendered
  - **THEN** both blocks SHALL be visible, each with 50% width
- [ ] 2.17 **GREEN**: Detect overlapping bookings and render them side-by-side with reduced width
- [ ] 2.18 **COMMIT**: `feat(webapp): handle overlapping bookings defensively`

## 3. Frontend: NowIndicator component (TDD)

- [ ] 3.1 **RED**: Create `apps/webapp/src/features/spaces/now-indicator.test.tsx` with test "renders horizontal line at current time position"
  - **GIVEN** current time = 10:30, hourRowHeight = 56px, timelineStartHour = 9
  - **WHEN** NowIndicator is rendered
  - **THEN** line SHALL be positioned at `top = (1.5 * 56)px` (1.5 hours from start)
- [ ] 3.2 **GREEN**: Create `apps/webapp/src/features/spaces/now-indicator.tsx` with props `{ currentTime, hourRowHeight, timelineStartHour }`. Render horizontal line at computed position.
- [ ] 3.3 **COMMIT**: `feat(webapp): add NowIndicator component`
- [ ] 3.4 **RED**: Add test "updates position every minute"
  - **GIVEN** NowIndicator is mounted
  - **WHEN** 60 seconds pass (use fake timers)
  - **THEN** position SHALL be recalculated
- [ ] 3.5 **GREEN**: Add `useEffect` with `setInterval(60_000)` to update current time state
- [ ] 3.6 **COMMIT**: `feat(webapp): update NowIndicator every minute`
- [ ] 3.7 **RED**: Add test "only renders when date is today"
  - **GIVEN** date is not today
  - **WHEN** NowIndicator is rendered
  - **THEN** nothing SHALL be rendered
- [ ] 3.8 **GREEN**: Add conditional rendering: return `null` if date is not today
- [ ] 3.9 **COMMIT**: `feat(webapp): hide NowIndicator on non-today dates`

## 4. Frontend: Integrate NowIndicator into DayTimeline

- [ ] 4.1 In `day-timeline.tsx`, render `<NowIndicator>` inside the timeline container
- [ ] 4.2 Add `useEffect` to auto-scroll to NowIndicator on mount when date is today: `nowIndicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })`
- [ ] 4.3 Update `day-timeline.test.tsx` to assert that NowIndicator is rendered when date is today

## 5. Frontend: Extend quick-book-sheet with default times

- [ ] 5.1 In `apps/webapp/src/features/spaces/quick-book-sheet.tsx`, add optional props `defaultStart?: string` and `defaultEnd?: string`
- [ ] 5.2 Update `useState` for start/end times to use `defaultStart` and `defaultEnd` if provided
- [ ] 5.3 Update `quick-book-sheet.test.tsx` to assert that default times are pre-filled when provided

## 6. Frontend: Tap-to-reserve handler wiring

- [ ] 6.1 In `apps/webapp/src/routes/spaces.$slug.tsx`, add state for `quickBookSheetOpen` and `quickBookDefaults: { start: string, end: string }`
- [ ] 6.2 Implement `handleSlotTap(hour: number)` that:
  - Computes `start = hour:00` (formatted as HH:MM)
  - Computes `end = (hour + 1):00`, capped at next booking start or space close time
  - Sets `quickBookDefaults` and opens `quickBookSheetOpen = true`
- [ ] 6.3 Render `<QuickBookSheet open={quickBookSheetOpen} defaultStart={...} defaultEnd={...} onClose={...} />`
- [ ] 6.4 On successful booking, close sheet and invalidate `spaces.dayView` query

## 7. Frontend: Tap-to-cancel handler wiring

- [ ] 7.1 In `apps/webapp/src/routes/spaces.$slug.tsx`, add state for `cancelDialogOpen`, `cancelBookingId: string | null`, and `cancelNameInput: string`
- [ ] 7.2 Implement `handleBookingTap(bookingId: string, bookerName: string)` that:
  - Reads stored booker name via `readStoredBookerName()` from `apps/webapp/src/features/spaces/booker-name-storage.ts`
  - Checks if booking belongs to current user (compare bookerName with stored name)
  - If yes, sets `cancelBookingId`, `cancelNameInput = ''`, and opens `cancelDialogOpen = true`
  - If no, does nothing (or shows tooltip — defer to phase 4)
- [ ] 7.3 Wire the `spaces.cancelBooking` mutation from tRPC
- [ ] 7.4 Render `<CancelBookingDialog>` with props:
  - `bookerName` (from the tapped booking)
  - `nameInput={cancelNameInput}`
  - `onNameChange={(value) => setCancelNameInput(value)}`
  - `onConfirm={(scope) => { /* call cancelMutation with bookingId, scope */ }}`
  - `isPending={cancelMutation.isPending}`
  - `seriesId={booking.seriesId}` (if available)
  - Note: The dialog does NOT take `bookingId` directly; the parent must call the mutation with the stored `cancelBookingId`
- [ ] 7.5 On successful cancel, close dialog, reset state, and invalidate `spaces.dayView` query

## 8. Frontend: AdvancedBookingSheet component

- [ ] 8.1 Create `apps/webapp/src/features/spaces/advanced-booking-sheet.tsx` as a bottom sheet (`<Sheet side="bottom">`)
- [ ] 8.2 Extract the recurring booking form logic from `booking-form.tsx` into `advanced-booking-sheet.tsx`
- [ ] 8.3 Render the full form (single OR recurring toggle, all time inputs, recurrence options)
- [ ] 8.4 Wire up the `bookMutation` from tRPC and handle success/error states

## 9. Frontend: Rewrite spaces.$slug.tsx with timeline

- [ ] 9.1 In `apps/webapp/src/routes/spaces.$slug.tsx`, add `validateSearch` schema for `{ date?: string }` (ISO date YYYY-MM-DD format)
- [ ] 9.2 Parse and validate the `date` query param; default to today if absent or invalid
- [ ] 9.3 Pass the parsed date to `<DayTimeline>` component
- [ ] 9.4 Add test asserting that visiting `/spaces/chill-house?date=2026-05-04` renders that date's timeline
- [ ] 9.5 Replace the bookings list section with `<DayTimeline>`
- [ ] 9.6 Remove the booking form section (replaced by tap-to-reserve + advanced sheet)
- [ ] 9.7 Add "Reserva avanzada (recurrente)" button at the bottom that opens `<AdvancedBookingSheet>`
- [ ] 9.8 Preserve date navigation (prev/next/today/date input)
- [ ] 9.9 Add empty state for closed days: "Cerrado los {weekday}"
- [ ] 9.10 Add loading and error states for `spaces.dayView` query

## 10. Cleanup: Remove unused components

- [ ] 10.1 Delete `apps/webapp/src/features/spaces/booking-list-item.tsx` (replaced by timeline booking blocks)
- [ ] 10.2 Refactor `apps/webapp/src/features/spaces/booking-form.tsx` to extract shared parts used by `advanced-booking-sheet.tsx` (or delete if fully replaced)

## 11. Locale keys

- [ ] 11.1 Add keys to `apps/webapp/src/locales/en/booking.json`: `advancedBooking`, `tapToReserve`, `closedOn`, `freeSlot`, `openHours`
- [ ] 11.2 Add keys to `apps/webapp/src/locales/es/booking.json`: `advancedBooking`, `tapToReserve`, `closedOn`, `freeSlot`, `openHours`
- [ ] 11.3 Add keys to `apps/webapp/src/locales/gl/booking.json`: `advancedBooking`, `tapToReserve`, `closedOn`, `freeSlot`, `openHours`

## 12. Validation

- [ ] 12.1 Run `/task-validate` to run lint, typecheck, and tests
- [ ] 12.2 Run `/task-code-review` to review production code against conventions
- [ ] 12.3 Run `/task-tests-review` to review test quality and coverage
- [ ] 12.4 Run `/task-architecture-review` to check hexagonal architecture compliance
- [ ] 12.5 Run `/task-frontend-review` to check component, hook, and tRPC integration
- [ ] 12.6 Fix any issues reported by the reviewers and re-run until clean

## 13. Commit

- [ ] 13.1 Commit all changes with conventional commit message: `feat(webapp): redesign space detail with visual timeline (phase 2)`
