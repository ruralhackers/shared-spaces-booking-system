## MODIFIED Requirements

### Requirement: The webapp SHALL display the catalog on the homepage

The webapp homepage SHALL render every space in the catalog with its display name and description. Each space entry SHALL link to the per-space day view at `/spaces/<slug>`. The list SHALL show a skeleton loading state while the query is in flight and an error message if the query fails.

When the catalog is empty, the homepage SHALL display a friendly empty state message.

All interactive elements on the homepage SHALL have a minimum tap area of 44×44px.

#### Scenario: All spaces visible on first paint

- **WHEN** a resident loads the homepage and spaces exist
- **THEN** all spaces are visible without further interaction

#### Scenario: Clicking a space opens its day view

- **WHEN** a resident clicks a space entry
- **THEN** the webapp navigates to `/spaces/<slug>` for that space

#### Scenario: Loading state is shown while fetching

- **WHEN** the homepage is loading the spaces list
- **THEN** skeleton placeholder cards are shown instead of empty content

#### Scenario: Error state is shown on fetch failure

- **WHEN** the spaces list query fails
- **THEN** a human-readable error message is displayed

#### Scenario: Empty state is shown when no spaces exist

- **WHEN** the homepage loads and no spaces have been created
- **THEN** a friendly message is displayed (e.g., "No spaces available yet")

#### Scenario: Theme toggle meets touch target minimum

- **WHEN** a user taps the theme toggle on a mobile device
- **THEN** the tap area SHALL be at least 44×44px

## ADDED Requirements

### Requirement: Cancelling a booking SHALL require confirmation

The webapp SHALL display a confirmation dialog before executing a booking cancellation, on both the public space page and the admin bookings page. The dialog SHALL clearly state the booking being cancelled and offer "Cancel" and "Confirm" actions.

#### Scenario: User cancels a booking on the space page

- **WHEN** a user enters their name and clicks the "Cancel" button on a booking
- **THEN** a confirmation dialog appears asking to confirm the cancellation
- **AND** the booking is only cancelled if the user confirms

#### Scenario: User dismisses the cancel confirmation

- **WHEN** a user clicks "Cancel" in the confirmation dialog (or presses Escape)
- **THEN** the dialog closes and the booking remains active

#### Scenario: Admin cancels a booking from the admin panel

- **WHEN** an admin clicks "Cancel" on a booking in the admin bookings list
- **THEN** a confirmation dialog appears before the cancellation executes

### Requirement: All confirmation dialogs SHALL be accessible

All modal dialogs in the webapp (delete-space, cancel-booking) SHALL use an accessible dialog component with focus trap, Escape key dismissal, `aria-modal="true"`, and scroll lock.

#### Scenario: Dialog traps focus

- **WHEN** a confirmation dialog is open
- **THEN** Tab key cycles only through focusable elements inside the dialog

#### Scenario: Escape key closes dialog

- **WHEN** a confirmation dialog is open and the user presses Escape
- **THEN** the dialog closes without performing the action

#### Scenario: Screen reader announces dialog

- **WHEN** a confirmation dialog opens
- **THEN** the dialog has `role="alertdialog"` and `aria-modal="true"`

### Requirement: Invalid admin key SHALL show feedback

When a user navigates to `/admin` without a valid `?key` parameter, the webapp SHALL redirect to the homepage and display a toast notification explaining that access was denied.

#### Scenario: Missing admin key

- **WHEN** a user navigates to `/admin` without a `?key` parameter
- **THEN** the user is redirected to `/`
- **AND** a toast notification says "Admin access denied"

#### Scenario: Invalid admin key

- **WHEN** a user navigates to `/admin?key=wrong`
- **THEN** the admin page shows an error message (from the API unauthorized response)

### Requirement: Past bookings SHALL be visually dimmed

On the space day view, bookings whose `endsAt` is in the past SHALL be rendered with reduced opacity to distinguish them from upcoming bookings.

#### Scenario: Past booking appears dimmed

- **WHEN** a booking's end time has passed
- **THEN** the booking row is rendered with reduced opacity (e.g., `opacity-50`)

#### Scenario: Current/future booking appears normal

- **WHEN** a booking's end time is in the future
- **THEN** the booking row is rendered at full opacity

### Requirement: Touch targets SHALL meet 44px minimum

All interactive elements in the webapp (buttons, links, checkboxes, inputs) SHALL have a minimum tap area of 44×44px on mobile viewports. This applies to the theme toggle, back navigation link, open-hours checkboxes, and time inputs.

#### Scenario: Theme toggle tap area

- **WHEN** the theme toggle is rendered on a mobile viewport
- **THEN** its clickable area is at least 44×44px

#### Scenario: Back link tap area

- **WHEN** the "All spaces" back link is rendered
- **THEN** its clickable area is at least 44×44px

#### Scenario: Open hours checkbox tap area

- **WHEN** the "Open 24h" checkbox is rendered
- **THEN** its clickable area (including label) is at least 44px tall

### Requirement: "Set to now" shortcut SHALL be a visible button

The "Set to now" action in the booking form SHALL be rendered as a ghost button instead of an underlined text link, making it more discoverable.

#### Scenario: Set to now is a button

- **WHEN** the booking form is rendered
- **THEN** "Set to now" appears as a ghost-styled button (not an underlined link)
