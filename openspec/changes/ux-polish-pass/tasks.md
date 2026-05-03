# Tasks: UX Polish Pass

## Group 1: Error Message Helper (TDD)

### Task 1.1: Create error message mapping helper (RED)

**RED**: Write failing test for `getErrorMessage()` helper

- Create `apps/webapp/src/lib/error-message.test.ts`
- Test cases:
  - Maps `BookingOverlapError` to `errors.bookingConflict` key
  - Maps `OutsideOpenHoursError` to `errors.outsideOpenHours` key
  - Maps `BookingNotFoundError` to `errors.bookingNotFound` key
  - Maps `SpaceNotFoundError` to `errors.spaceNotFound` key
  - Returns fallback `errors.generic` for unmapped error codes
  - Handles non-TRPCClientError gracefully (returns fallback)

**GREEN**: Implement `apps/webapp/src/lib/error-message.ts`

- Export `getErrorMessage(error: unknown, locale: string): string`
- Map error codes to i18n keys
- Return fallback for unmapped errors

**COMMIT**: `feat(webapp): add error message mapping helper`

### Task 1.2: Add error message locale keys

- Add keys to `apps/webapp/src/locales/en/common.json`:
  - `errors.bookingConflict`: "That time slot was just taken. Try another time."
  - `errors.outsideOpenHours`: "That time is outside open hours. Try another time."
  - `errors.bookingNotFound`: "That booking was not found."
  - `errors.spaceNotFound`: "That space was not found."
  - `errors.generic`: "Something went wrong. Please try again."
  - `errors.networkError`: "Could not connect. Check your connection and try again."
- Add Spanish translations to `apps/webapp/src/locales/es/common.json`
- Add Galician translations to `apps/webapp/src/locales/gl/common.json`

**COMMIT**: `feat(webapp): add error message locale keys`

## Group 2: Onboarding Storage Helper (TDD)

### Task 2.1: Create onboarding storage helper (RED)

**RED**: Write failing test for onboarding storage helpers

- Create `apps/webapp/src/lib/onboarding-storage.test.ts`
- Test cases:
  - `hasSeenOnboardingHint()` returns `false` when key is not in localStorage
  - `hasSeenOnboardingHint()` returns `true` when key is `"true"` in localStorage
  - `markOnboardingHintSeen()` sets key to `"true"` in localStorage
  - Handles localStorage errors gracefully (returns `false` / no-op)

**GREEN**: Implement `apps/webapp/src/lib/onboarding-storage.ts`

- Export `hasSeenOnboardingHint(): boolean`
- Export `markOnboardingHintSeen(): void`
- Use localStorage key `"onboarding-name-shown"`
- Wrap in try-catch for localStorage errors

**COMMIT**: `feat(webapp): add onboarding storage helpers`

## Group 3: Onboarding Name Hint Component (TDD)

### Task 3.1: Create onboarding name hint component (RED)

**RED**: Write failing test for `<OnboardingNameHint>`

- Create `apps/webapp/src/components/onboarding-name-hint.test.tsx`
- Test cases:
  - Renders hint message when `show={true}`
  - Does not render when `show={false}`
  - Calls `onDismiss` when close button is clicked
  - Has accessible close button with `aria-label`

**GREEN**: Implement `apps/webapp/src/components/onboarding-name-hint.tsx`

- Props: `show: boolean`, `onDismiss: () => void`
- Render a dismissible note with message from `booking.onboardingHint` locale key
- Use Lucide `X` icon for close button
- Style with border, background, padding

**COMMIT**: `feat(webapp): add onboarding name hint component`

### Task 3.2: Add onboarding hint locale keys

- Add keys to `apps/webapp/src/locales/en/booking.json`:
  - `onboardingHint`: "Remember this name — you'll need it to cancel your bookings."
- Add Spanish translation to `apps/webapp/src/locales/es/booking.json`
- Add Galician translation to `apps/webapp/src/locales/gl/booking.json`

**COMMIT**: `feat(webapp): add onboarding hint locale keys`

### Task 3.3: Integrate onboarding hint into quick-book sheet

- Modify `apps/webapp/src/features/spaces/quick-book-sheet.tsx`
- Import `hasSeenOnboardingHint`, `markOnboardingHintSeen`, `<OnboardingNameHint>`
- Show hint when `!hasSeenOnboardingHint() && !readStoredBookerName()`
- Call `markOnboardingHintSeen()` on dismiss
- Position hint above name input

**COMMIT**: `feat(webapp): integrate onboarding hint into quick-book sheet`

## Group 4: Home Page Skeletons (Visual)

### Task 4.1: Install shadcn Skeleton component (if missing)

- Run `bunx shadcn@latest add skeleton`
- Verify `apps/webapp/src/components/ui/skeleton.tsx` exists

**COMMIT**: `chore(webapp): install shadcn skeleton component`

### Task 4.2: Add skeleton for home page space cards

- Modify `apps/webapp/src/routes/index.tsx`
- When `isLoading`, render 3 `<SpaceCardSkeleton>` components
- Create `apps/webapp/src/features/spaces/space-card-skeleton.tsx`
- Match card height, color block, status line, button row
- Use `<Skeleton>` from `components/ui/skeleton`

**COMMIT**: `feat(webapp): add skeleton for home page space cards`

## Group 5: Detail Page Skeletons (Visual)

### Task 5.1: Add skeleton for space detail timeline

- Modify `apps/webapp/src/features/spaces/day-timeline.tsx`
- When `isLoading`, render `<TimelineSkeleton>` component
- Create `apps/webapp/src/features/spaces/timeline-skeleton.tsx`
- Match timeline structure: header, hour labels, grey blocks at typical hours, now-indicator placeholder
- Use `<Skeleton>` from `components/ui/skeleton`

**COMMIT**: `feat(webapp): add skeleton for space detail timeline`

## Group 6: Cross-Space Availability Skeletons (Visual)

### Task 6.1: Add skeleton for cross-space availability results

- Modify `apps/webapp/src/features/spaces/availability-finder.tsx`
- When `isLoading`, render `<AvailabilityResultsSkeleton>` component
- Create `apps/webapp/src/features/spaces/availability-results-skeleton.tsx`
- Match result list structure: 3 card-shaped skeletons
- Use `<Skeleton>` from `components/ui/skeleton`

**COMMIT**: `feat(webapp): add skeleton for cross-space availability results`

## Group 7: Animations (Visual)

### Task 7.1: Add card press animation

- Modify `apps/webapp/src/features/spaces/space-card.tsx`
- Add `active:scale-95 transition-transform duration-150` to card wrapper
- Verify animation works on mobile (tap) and desktop (click)

**COMMIT**: `feat(webapp): add card press animation`

### Task 7.2: Add status change fade transition

- Modify `apps/webapp/src/features/spaces/space-card.tsx`
- Add `transition-opacity duration-200` to status line
- Verify transition when card status updates after booking

**COMMIT**: `feat(webapp): add status change fade transition`

### Task 7.3: Add now-indicator pulse animation

- Modify `apps/webapp/src/features/spaces/day-timeline.tsx`
- Add custom keyframe animation for pulse (2s loop, opacity 0.5 → 1 → 0.5)
- Apply to now-indicator line
- Add to `tailwind.config.ts` if needed:
  ```ts
  theme: {
    extend: {
      keyframes: {
        'pulse-gentle': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
      },
    },
  }
  ```

**COMMIT**: `feat(webapp): add now-indicator pulse animation`

### Task 7.4: Add quick-book button highlight on press

- Modify `apps/webapp/src/features/spaces/quick-book-sheet.tsx`
- Add `active:bg-primary/90 transition-colors duration-150` to quick-book buttons (30min/1h/2h)
- Verify animation works on mobile and desktop

**COMMIT**: `feat(webapp): add quick-book button highlight on press`

### Task 7.5: Add timeline slot highlight on tap

- Modify `apps/webapp/src/features/spaces/day-timeline.tsx`
- Add `hover:bg-muted/50 active:bg-muted transition-colors duration-150` to free slot tap areas
- Verify animation works on mobile and desktop

**COMMIT**: `feat(webapp): add timeline slot highlight on tap`

### Task 7.6: Verify bottom sheet entrance animation

- Verify `apps/webapp/src/components/ui/sheet.tsx` has smooth entrance animation
- If not, tune `transition` prop on `<Sheet>` (shadcn default should be good)

**COMMIT**: `chore(webapp): verify bottom sheet entrance animation`

## Group 8: Toast Tuning

### Task 8.1: Configure sonner position and duration

- Modify `apps/webapp/src/main.tsx` (or wherever `<Toaster>` is rendered)
- Set `position="top-center"` on mobile (viewport width < 768px), `position="top-right"` on desktop
- Set `duration={4000}` for success toasts, `duration={6000}` for error toasts
- Use `useMediaQuery` or CSS media query to detect mobile

**COMMIT**: `feat(webapp): configure sonner position and duration`

### Task 8.2: Add success toast template with space name and time

- Modify all booking mutations (`api.spaces.book.useMutation()`, etc.)
- On success, call `toast.success()` with template: `"{spaceName} reservada · {startTime} – {endTime}"`
- Use locale keys for template
- Add keys to `apps/webapp/src/locales/*/booking.json`:
  - `bookingSuccess`: "{{spaceName}} reserved · {{startTime}} – {{endTime}}"
  - (Spanish, Galician translations)

**COMMIT**: `feat(webapp): add success toast template with space name and time`

### Task 8.3: Add cancel toast with space name and time

- Modify cancel booking mutation (`api.spaces.cancelBooking.useMutation()`, etc.)
- On success, call `toast.success()` with template: `"{spaceName} cancelada · {startTime} – {endTime}"`
- Use locale keys for template
- Add keys to `apps/webapp/src/locales/*/booking.json`:
  - `bookingCancelled`: "{{spaceName}} cancelled · {{startTime}} – {{endTime}}"
  - (Spanish, Galician translations)

**COMMIT**: `feat(webapp): add cancel toast with space name and time`

## Group 9: Error Message Rewrites

### Task 9.1: Update error toasts in all mutations to use error-message helper

- Modify all mutations in `apps/webapp/src/features/spaces/`:
  - `api.spaces.book.useMutation()`
  - `api.spaces.cancelBooking.useMutation()`
  - Any other mutations
- On error, call `toast.error(getErrorMessage(error, locale))`
- Remove hardcoded error messages

**COMMIT**: `feat(webapp): update error toasts to use error-message helper`

## Group 10: Empty States with Friendly Tone

### Task 10.1: Add empty state for home page when no spaces exist

- Modify `apps/webapp/src/routes/index.tsx`
- When `spaces.length === 0`, render empty state:
  - Message: "No spaces available yet."
  - (No action — admin-only feature)
- Use locale keys

**COMMIT**: `feat(webapp): add empty state for home page`

### Task 10.2: Add empty state for detail page when no bookings exist

- Modify `apps/webapp/src/features/spaces/day-timeline.tsx`
- When `bookings.length === 0`, render empty state:
  - Message: "No bookings yet. Be the first!"
- Use locale keys

**COMMIT**: `feat(webapp): add empty state for detail page`

### Task 10.3: Add empty state for cross-space availability when no results

- Modify `apps/webapp/src/features/spaces/availability-finder.tsx`
- When `results.length === 0`, render empty state:
  - Message: "No available slots found. Try a different time."
- Use locale keys

**COMMIT**: `feat(webapp): add empty state for cross-space availability`

### Task 10.4: Add empty state locale keys

- Add keys to `apps/webapp/src/locales/en/spaces.json`:
  - `emptySpaces`: "No spaces available yet."
  - `emptyBookings`: "No bookings yet. Be the first!"
  - `emptyAvailability`: "No available slots found. Try a different time."
- Add Spanish translations to `apps/webapp/src/locales/es/spaces.json`
- Add Galician translations to `apps/webapp/src/locales/gl/spaces.json`

**COMMIT**: `feat(webapp): add empty state locale keys`

## Group 11: Locale Keys for All New Messages

### Task 11.1: Add loading state locale keys

- Add keys to `apps/webapp/src/locales/en/booking.json`:
  - `bookingInProgress`: "Booking..."
  - `cancellingInProgress`: "Cancelling..."
- Add Spanish translations to `apps/webapp/src/locales/es/booking.json`
- Add Galician translations to `apps/webapp/src/locales/gl/booking.json`

**COMMIT**: `feat(webapp): add loading state locale keys`

### Task 11.2: Update quick-book button to show loading state

- Modify `apps/webapp/src/features/spaces/quick-book-sheet.tsx`
- When mutation is pending, show spinner + `booking.bookingInProgress` text
- Disable button while pending

**COMMIT**: `feat(webapp): update quick-book button to show loading state`

## Group 12: Theme Audit

### Task 12.1: Scan new components for hardcoded colors

- Audit all new components from phases 1-3:
  - `apps/webapp/src/features/spaces/space-card.tsx`
  - `apps/webapp/src/features/spaces/quick-book-sheet.tsx`
  - `apps/webapp/src/features/spaces/day-timeline.tsx`
  - `apps/webapp/src/features/spaces/availability-finder.tsx`
- Replace any hardcoded colors (hex, rgb) with Tailwind theme tokens
- Examples: `#000` → `text-foreground`, `#fff` → `text-background`, `#f00` → `text-destructive`

**COMMIT**: `refactor(webapp): replace hardcoded colors with theme tokens`

### Task 12.2: Verify dark mode contrast on space color cards

- Test space color cards in dark mode with all space colors
- If text contrast fails WCAG AA (4.5:1), add semi-transparent overlay:
  - `<div className="absolute inset-0 bg-black/20 dark:bg-black/40" />`
- Position overlay behind text

**COMMIT**: `fix(webapp): improve dark mode contrast on space color cards`

### Task 12.3: Typography pass — ensure consistent font sizes

- Audit all new components for arbitrary font sizes (e.g., `text-[14px]`)
- Replace with Tailwind scale (e.g., `text-sm`, `text-base`, `text-lg`)

**COMMIT**: `refactor(webapp): use consistent typography scale`

### Task 12.4: Spacing pass — ensure consistent rhythm

- Audit all new components for arbitrary spacing (e.g., `p-[12px]`)
- Replace with Tailwind scale (e.g., `p-3`, `p-4`, `p-6`)

**COMMIT**: `refactor(webapp): use consistent spacing scale`

## Group 13: Accessibility Audit

### Task 13.1: Add aria-labels to icon-only buttons

- Audit all icon-only buttons (close, dismiss, etc.)
- Add `aria-label` with descriptive text
- Examples:
  - Close button: `aria-label="Close"`
  - Dismiss hint: `aria-label="Dismiss hint"`

**COMMIT**: `feat(webapp): add aria-labels to icon-only buttons`

### Task 13.2: Verify focus visible on keyboard navigation

- Test all interactive elements with keyboard (Tab, Enter, Space)
- Ensure focus ring is visible (Tailwind default `focus-visible:ring-2`)
- Add `focus-visible:ring-2 focus-visible:ring-ring` if missing

**COMMIT**: `feat(webapp): ensure focus visible on keyboard navigation`

### Task 13.3: Verify bottom sheets trap focus

- Test bottom sheets with keyboard (Tab should not escape sheet)
- Verify shadcn `<Sheet>` traps focus (it should by default)
- If not, add `react-focus-lock` or similar

**COMMIT**: `feat(webapp): verify bottom sheets trap focus`

### Task 13.4: Verify screen reader announces toast content

- Test toasts with screen reader (NVDA, VoiceOver)
- Verify sonner announces toast content (it should by default)
- If not, add `role="status"` or `aria-live="polite"` to toast container

**COMMIT**: `feat(webapp): verify screen reader announces toast content`

### Task 13.5: Ensure all interactive elements have 44×44px minimum touch target

- Audit all interactive elements (buttons, links, icons)
- Ensure `min-h-11 min-w-11` (44px) or equivalent padding
- Examples:
  - Quick-book buttons: already large enough
  - Timeline slots: add padding if needed
  - Icon buttons: add padding if needed

**COMMIT**: `feat(webapp): ensure 44×44px minimum touch target`

### Task 13.6: Replace emoji status icons with Lucide Circle

- Modify `apps/webapp/src/features/spaces/space-card.tsx`
- Replace 🟢/🔴/⚫ with Lucide `<Circle>` component
- Fill with CSS variable color based on status:
  - `free`: `fill="hsl(var(--primary))"` (using primary as success indicator)
  - `occupied`: `fill="hsl(var(--destructive))"`
  - `closed`: `fill="hsl(var(--muted-foreground))"`
- Add `aria-label` to icon

**COMMIT**: `feat(webapp): replace emoji status icons with Lucide Circle`

## Group 14: Validation + Commit

**Note**: This is a frontend-only change, so `/task-architecture-review` is optional per AGENTS.md. However, `/task-code-review`, `/task-tests-review`, and `/task-frontend-review` are mandatory.

### Task 14.1: Run validation suite

- Run `/task-validate` to execute lint, typecheck, and tests
- Fix any issues found

**COMMIT**: `chore(webapp): fix validation issues`

### Task 14.2: Run code review

- Run `/task-code-review` on `apps/webapp/src/`
- Fix any issues found

**COMMIT**: `refactor(webapp): apply code review fixes`

### Task 14.3: Run tests review

- Run `/task-tests-review` on `apps/webapp/src/`
- Fix any issues found

**COMMIT**: `test(webapp): apply tests review fixes`

### Task 14.4: Run frontend review

- Run `/task-frontend-review` on `apps/webapp/src/`
- Fix any issues found

**COMMIT**: `refactor(webapp): apply frontend review fixes`

### Task 14.5: Final commit

- Commit all changes with conventional commit message:
  - `feat(webapp): add UX polish pass (phase 4 of 4)`

**COMMIT**: `feat(webapp): add UX polish pass (phase 4 of 4)`
