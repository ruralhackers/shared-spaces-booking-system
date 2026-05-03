## ADDED Requirements

### Requirement: The webapp SHALL display loading skeletons while data is loading

The webapp SHALL display loading skeletons that match the final content geometry (within ±10%) to avoid layout shift. Skeletons SHALL use the `animate-pulse` animation (Tailwind built-in) for a shimmer effect.

#### Scenario: Home page shows skeleton while spaces.list loads

- **GIVEN** the user navigates to the home page
- **WHEN** `api.spaces.list.useQuery()` is in loading state
- **THEN** the page displays 3 card-shaped skeletons matching the final card height
- **AND** each skeleton has a color block, status line placeholder, and button row placeholder

#### Scenario: Detail page shows skeleton while dayView loads

- **GIVEN** the user navigates to a space detail page
- **WHEN** `api.spaces.dayView.useQuery()` is in loading state
- **THEN** the page displays a timeline skeleton with hour labels, grey blocks at typical hours, and a now-indicator placeholder

#### Scenario: Cross-space availability shows skeleton while query loads

- **GIVEN** the user opens the cross-space availability search
- **WHEN** `api.spaces.availability.useQuery()` is in loading state
- **THEN** the page displays a skeleton list of 3 card-shaped items

#### Scenario: Quick-book button shows loading state while booking is pending

- **GIVEN** the user taps a quick-book button (30min/1h/2h)
- **WHEN** `api.spaces.book.useMutation()` is pending
- **THEN** the "Confirmar reserva" button shows a spinner and text "Reservando..."
- **AND** the button is disabled

### Requirement: The webapp SHALL map domain error codes to human-friendly messages

The webapp SHALL map tRPC error codes to human-friendly messages in the user's locale (en, es, gl). Error messages SHALL be displayed in toasts (for system/server errors) or inline (for form validation errors).

#### Scenario: BookingOverlapError is mapped to human-friendly message

- **GIVEN** a booking mutation fails with `BookingOverlapError` (booking overlaps existing booking)
- **WHEN** the error toast is displayed
- **THEN** the message is "Esa franja se acaba de ocupar. Prueba con otra hora." (Spanish)
- **OR** "That time slot was just taken. Try another time." (English)
- **OR** "Esa franxa acaba de ocuparse. Proba con outra hora." (Galician)

#### Scenario: OutsideOpenHoursError is mapped to human-friendly message

- **GIVEN** a booking mutation fails with `OutsideOpenHoursError`
- **WHEN** the error toast is displayed
- **THEN** the message is "Esa hora está fuera del horario de apertura. Prueba con otra hora." (Spanish)
- **OR** "That time is outside open hours. Try another time." (English)
- **OR** "Esa hora está fóra do horario de apertura. Proba con outra hora." (Galician)

#### Scenario: BookingNotFoundError or SpaceNotFoundError is mapped to human-friendly message

- **GIVEN** a booking mutation fails with `BookingNotFoundError` or `SpaceNotFoundError`
- **WHEN** the error toast is displayed
- **THEN** the message is "Esa sala o reserva no se encontró." (Spanish)
- **OR** "That space or booking was not found." (English)
- **OR** "Esa sala ou reserva non se atopou." (Galician)

#### Scenario: Unmapped error code returns generic fallback

- **GIVEN** a mutation fails with an unmapped error code
- **WHEN** the error toast is displayed
- **THEN** the message is "Algo salió mal. Inténtalo de nuevo." (Spanish)
- **OR** "Something went wrong. Please try again." (English)
- **OR** "Algo saíu mal. Téntao de novo." (Galician)

#### Scenario: Network error is mapped to human-friendly message

- **GIVEN** a mutation fails with a network error (fetch failed)
- **WHEN** the error toast is displayed
- **THEN** the message is "No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo." (Spanish)
- **OR** "Could not connect. Check your connection and try again." (English)
- **OR** "Non puidemos conectar. Comproba a túa conexión e téntao de novo." (Galician)

### Requirement: The webapp SHALL show an onboarding hint for first-time users

The webapp SHALL show a dismissible onboarding hint above the name input in the quick-book sheet when:
1. The user opens the quick-book sheet for the first time (no `onboarding-name-shown` in localStorage)
2. AND no `bookerName` is stored in localStorage

The hint SHALL be dismissible (X button) and dismissal SHALL be persisted in localStorage.

#### Scenario: Onboarding hint shows when first opening quick-book sheet AND no name in localStorage

- **GIVEN** the user has never opened the quick-book sheet before
- **AND** no `bookerName` is stored in localStorage
- **WHEN** the user opens the quick-book sheet
- **THEN** the hint is displayed above the name input
- **AND** the hint message is "Recuerda este nombre — lo necesitarás si quieres cancelar." (Spanish)
- **OR** "Remember this name — you'll need it to cancel your bookings." (English)
- **OR** "Lembra este nome — necesitarao se queres cancelar." (Galician)

#### Scenario: Onboarding hint is dismissible

- **GIVEN** the onboarding hint is displayed
- **WHEN** the user clicks the close button (X)
- **THEN** the hint is hidden
- **AND** `onboarding-name-shown` is set to `"true"` in localStorage

#### Scenario: Onboarding hint is not shown after dismissal

- **GIVEN** the user has dismissed the onboarding hint
- **WHEN** the user opens the quick-book sheet again
- **THEN** the hint is not displayed

#### Scenario: Onboarding hint is not shown when name is already stored

- **GIVEN** `bookerName` is stored in localStorage
- **WHEN** the user opens the quick-book sheet
- **THEN** the hint is not displayed (even if `onboarding-name-shown` is not set)

### Requirement: The webapp SHALL provide tactile feedback on interactive elements

The webapp SHALL provide visual feedback on interactive elements (buttons, cards, timeline slots) when pressed or tapped. Feedback SHALL be subtle (scale, background color change) and short-duration (150-200ms).

#### Scenario: Card press shows scale-down animation

- **GIVEN** the user is on the home page
- **WHEN** the user presses a space card
- **THEN** the card scales down to 95% (`scale-95`) for 150ms
- **AND** the card returns to 100% scale when released

#### Scenario: Quick-book button shows highlight on press

- **GIVEN** the user opens the quick-book sheet
- **WHEN** the user presses a quick-book button (30min/1h/2h)
- **THEN** the button background briefly highlights (darker shade) for 150ms

#### Scenario: Timeline slot shows highlight on tap

- **GIVEN** the user is on a space detail page
- **WHEN** the user taps a free slot on the timeline
- **THEN** the slot background briefly highlights (muted color) for 150ms before the sheet opens

### Requirement: The webapp SHALL animate status changes on space cards

The webapp SHALL animate status changes on space cards (free → occupied, occupied → free) with a 200ms fade transition to avoid hard state swaps.

#### Scenario: Status line fades when card status updates

- **GIVEN** the user is on the home page
- **WHEN** a booking is created and the card status updates from "free" to "occupied"
- **THEN** the status line fades out and fades in with the new status over 200ms

### Requirement: The webapp SHALL animate the timeline now-indicator with a gentle pulse

The webapp SHALL animate the timeline now-indicator with a gentle 2s pulse animation (opacity 0.5 → 1 → 0.5) to make it visible but not distracting.

#### Scenario: Now-indicator pulses gently

- **GIVEN** the user is on a space detail page
- **WHEN** the timeline is displayed
- **THEN** the now-indicator line pulses gently with a 2s loop
- **AND** the opacity oscillates between 0.5 and 1

### Requirement: The webapp SHALL display toasts in a position appropriate for the device

The webapp SHALL display toasts in `top-center` position on mobile (viewport width < 768px) and `top-right` position on desktop. Success toasts SHALL auto-dismiss in 4s, error toasts in 6s.

#### Scenario: Toast appears in top-center on mobile

- **GIVEN** the user is on a mobile device (viewport width < 768px)
- **WHEN** a toast is displayed
- **THEN** the toast appears in the top-center position

#### Scenario: Toast appears in top-right on desktop

- **GIVEN** the user is on a desktop device (viewport width >= 768px)
- **WHEN** a toast is displayed
- **THEN** the toast appears in the top-right position

#### Scenario: Success toast auto-dismisses in 4s

- **GIVEN** a booking is created successfully
- **WHEN** the success toast is displayed
- **THEN** the toast auto-dismisses after 4 seconds

#### Scenario: Error toast auto-dismisses in 6s

- **GIVEN** a booking mutation fails
- **WHEN** the error toast is displayed
- **THEN** the toast auto-dismisses after 6 seconds

### Requirement: The webapp SHALL include space name and time in booking success toasts

The webapp SHALL include the space name, start time, and end time in booking success toasts. The format SHALL be: "{spaceName} reservada · {startTime} – {endTime}".

#### Scenario: Booking success toast includes space name and time

- **GIVEN** the user creates a booking for "Sala Reuniones" from 14:30 to 15:30
- **WHEN** the booking is created successfully
- **THEN** the success toast displays "Sala Reuniones reservada · 14:30 – 15:30" (Spanish)
- **OR** "Sala Reuniones reserved · 14:30 – 15:30" (English)
- **OR** "Sala Reuniones reservada · 14:30 – 15:30" (Galician)

### Requirement: The webapp SHALL include space name and time in cancel booking toasts

The webapp SHALL include the space name, start time, and end time in cancel booking toasts. The format SHALL be: "{spaceName} cancelada · {startTime} – {endTime}".

#### Scenario: Cancel booking toast includes space name and time

- **GIVEN** the user cancels a booking for "Sala Reuniones" from 14:30 to 15:30
- **WHEN** the booking is cancelled successfully
- **THEN** the success toast displays "Sala Reuniones cancelada · 14:30 – 15:30" (Spanish)
- **OR** "Sala Reuniones cancelled · 14:30 – 15:30" (English)
- **OR** "Sala Reuniones cancelada · 14:30 – 15:30" (Galician)

### Requirement: The webapp SHALL display empty states with friendly tone and actionable next step

The webapp SHALL display empty states with friendly tone when no data is available. Empty states SHALL include a message and, when applicable, an actionable next step.

#### Scenario: Home page shows empty state when no spaces exist

- **GIVEN** no spaces exist in the system
- **WHEN** the user navigates to the home page
- **THEN** the page displays "No spaces available yet." (English)
- **OR** "No hay salas disponibles aún." (Spanish)
- **OR** "Non hai salas dispoñibles aínda." (Galician)

#### Scenario: Detail page shows empty state when no bookings exist

- **GIVEN** a space has no bookings
- **WHEN** the user navigates to the space detail page
- **THEN** the page displays "No bookings yet. Be the first!" (English)
- **OR** "No hay reservas aún. ¡Sé el primero!" (Spanish)
- **OR** "Non hai reservas aínda. Sé o primeiro!" (Galician)

#### Scenario: Cross-space availability shows empty state when no results

- **GIVEN** the user searches for availability and no slots are found
- **WHEN** the results are displayed
- **THEN** the page displays "No available slots found. Try a different time." (English)
- **OR** "No se encontraron franjas disponibles. Prueba con otra hora." (Spanish)
- **OR** "Non se atoparon franxas dispoñibles. Proba con outra hora." (Galician)

### Requirement: The webapp SHALL ensure all interactive elements have a minimum 44×44px touch target

The webapp SHALL ensure all interactive elements (buttons, links, icons) have a minimum touch target of 44×44px (or equivalent padding) to meet accessibility standards (Apple HIG, Material Design).

#### Scenario: Quick-book buttons have 44×44px minimum touch target

- **GIVEN** the user opens the quick-book sheet
- **WHEN** the quick-book buttons (30min/1h/2h) are rendered
- **THEN** each button has a minimum height of 44px and minimum width of 44px

#### Scenario: Timeline slots have 44×44px minimum touch target

- **GIVEN** the user is on a space detail page
- **WHEN** the timeline slots are rendered
- **THEN** each slot has a minimum height of 44px (or equivalent padding)

#### Scenario: Icon buttons have 44×44px minimum touch target

- **GIVEN** the user sees an icon button (close, dismiss, etc.)
- **WHEN** the button is rendered
- **THEN** the button has a minimum height of 44px and minimum width of 44px (or equivalent padding)

### Requirement: The webapp SHALL use Lucide Circle icons for status indicators

The webapp SHALL use Lucide `Circle` icons filled with CSS variable colors for status indicators (free, occupied, closed) instead of emoji. This ensures consistent rendering across platforms and respects theme tokens.

#### Scenario: Free status uses primary color Circle icon

- **GIVEN** a space is free
- **WHEN** the space card is rendered
- **THEN** the status icon is a Lucide `Circle` filled with `hsl(var(--primary))` (using primary as success indicator)
- **AND** the icon has `aria-label="Free"`

#### Scenario: Occupied status uses red Circle icon

- **GIVEN** a space is occupied
- **WHEN** the space card is rendered
- **THEN** the status icon is a Lucide `Circle` filled with `hsl(var(--destructive))` (red)
- **AND** the icon has `aria-label="Occupied"`

#### Scenario: Closed status uses gray Circle icon

- **GIVEN** a space is closed
- **WHEN** the space card is rendered
- **THEN** the status icon is a Lucide `Circle` filled with `hsl(var(--muted-foreground))` (gray)
- **AND** the icon has `aria-label="Closed"`

### Requirement: The webapp SHALL ensure all icon-only buttons have aria-labels

The webapp SHALL ensure all icon-only buttons (close, dismiss, etc.) have descriptive `aria-label` attributes for screen readers.

#### Scenario: Close button has aria-label

- **GIVEN** the user opens a bottom sheet
- **WHEN** the close button (X icon) is rendered
- **THEN** the button has `aria-label="Close"`

#### Scenario: Dismiss hint button has aria-label

- **GIVEN** the onboarding hint is displayed
- **WHEN** the dismiss button (X icon) is rendered
- **THEN** the button has `aria-label="Dismiss hint"`

### Requirement: The webapp SHALL ensure focus is visible on keyboard navigation

The webapp SHALL ensure all interactive elements have a visible focus ring when navigated with keyboard (Tab, Shift+Tab). The focus ring SHALL use Tailwind's default `focus-visible:ring-2` style.

#### Scenario: Interactive elements show focus ring on keyboard navigation

- **GIVEN** the user navigates with keyboard (Tab)
- **WHEN** an interactive element (button, link, input) receives focus
- **THEN** the element displays a visible focus ring (2px, ring color)

### Requirement: The webapp SHALL trap focus inside bottom sheets

The webapp SHALL trap focus inside bottom sheets while they are open. Keyboard navigation (Tab, Shift+Tab) SHALL not escape the sheet.

#### Scenario: Focus is trapped inside bottom sheet

- **GIVEN** the user opens a bottom sheet
- **WHEN** the user navigates with keyboard (Tab)
- **THEN** focus cycles through interactive elements inside the sheet
- **AND** focus does not escape to elements outside the sheet

### Requirement: The webapp SHALL announce toast content to screen readers

The webapp SHALL announce toast content to screen readers using `role="status"` or `aria-live="polite"`. This ensures screen reader users are notified of success and error messages.

#### Scenario: Screen reader announces success toast

- **GIVEN** a booking is created successfully
- **WHEN** the success toast is displayed
- **THEN** the screen reader announces the toast content

#### Scenario: Screen reader announces error toast

- **GIVEN** a booking mutation fails
- **WHEN** the error toast is displayed
- **THEN** the screen reader announces the toast content

### Requirement: The webapp SHALL use theme tokens for all colors

The webapp SHALL use Tailwind theme tokens (e.g., `text-foreground`, `bg-background`, `text-destructive`) for all colors. Hardcoded colors (hex, rgb) SHALL NOT be used.

#### Scenario: No hardcoded colors in new components

- **GIVEN** a new component is rendered
- **WHEN** the component's styles are inspected
- **THEN** all colors use Tailwind theme tokens (e.g., `text-foreground`, `bg-muted`)
- **AND** no hardcoded colors (hex, rgb) are present

### Requirement: The webapp SHALL ensure dark mode contrast on space color cards

The webapp SHALL ensure text on space color cards meets WCAG AA contrast (4.5:1) in dark mode. If contrast fails, a semi-transparent overlay SHALL be added.

#### Scenario: Space color card has sufficient contrast in dark mode

- **GIVEN** the user is in dark mode
- **WHEN** a space color card is rendered with a light space color (e.g., yellow, cyan)
- **THEN** the text has sufficient contrast (4.5:1 or higher)
- **OR** a semi-transparent overlay (`bg-black/20` or `bg-black/40`) is applied to improve contrast

### Requirement: The webapp SHALL use consistent typography scale

The webapp SHALL use Tailwind's default typography scale (e.g., `text-sm`, `text-base`, `text-lg`) for all font sizes. Arbitrary font sizes (e.g., `text-[14px]`) SHALL NOT be used.

#### Scenario: No arbitrary font sizes in new components

- **GIVEN** a new component is rendered
- **WHEN** the component's styles are inspected
- **THEN** all font sizes use Tailwind's typography scale (e.g., `text-sm`, `text-base`)
- **AND** no arbitrary font sizes (e.g., `text-[14px]`) are present

### Requirement: The webapp SHALL use consistent spacing scale

The webapp SHALL use Tailwind's default spacing scale (e.g., `p-3`, `p-4`, `p-6`) for all spacing. Arbitrary spacing (e.g., `p-[12px]`) SHALL NOT be used.

#### Scenario: No arbitrary spacing in new components

- **GIVEN** a new component is rendered
- **WHEN** the component's styles are inspected
- **THEN** all spacing uses Tailwind's spacing scale (e.g., `p-3`, `p-4`)
- **AND** no arbitrary spacing (e.g., `p-[12px]`) is present
