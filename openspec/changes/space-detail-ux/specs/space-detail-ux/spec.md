## MODIFIED Requirements

### Requirement: Sticky bar displays space name and Advanced Booking button

The space page sticky bar SHALL display the space name (with color dot) centered between the "All spaces" back link and the "Advanced Booking" button, so users can identify the space and access advanced booking without scrolling.

#### Scenario: Sticky bar shows space name with color dot
- **WHEN** a user opens a space page and data has loaded
- **THEN** the sticky bar SHALL display the space name with the space's color dot next to it, centered between the back link and the Advanced Booking button

#### Scenario: Sticky bar shows Advanced Booking button
- **WHEN** a user opens a space page and data has loaded
- **THEN** the sticky bar SHALL display an "Advanced Booking" button on the right side

#### Scenario: Sticky bar hides name and button while loading
- **WHEN** a user opens a space page and data is still loading
- **THEN** the sticky bar SHALL only show the "All spaces" back link, without the space name or Advanced Booking button

#### Scenario: Sticky bar hides name and button on error
- **WHEN** a user opens a space page and an error occurs
- **THEN** the sticky bar SHALL only show the "All spaces" back link, without the space name or Advanced Booking button

#### Scenario: Advanced Booking button opens the AdvancedBookingSheet
- **WHEN** a user taps the "Advanced Booking" button in the sticky bar
- **THEN** the AdvancedBookingSheet SHALL open with default times set to the current hour and current hour + 1

---

### Requirement: Space name block is removed from scrollable content

The space page SHALL NOT display the space name as an `<h1>` block in the scrollable content area, since it is now shown in the sticky bar.

#### Scenario: No h1 name block in scrollable content
- **WHEN** a user opens a space page and data has loaded
- **THEN** the scrollable content SHALL NOT contain an `<h1>` element with the space name

#### Scenario: Space description is shown as subtitle
- **WHEN** a user opens a space page and data has loaded
- **THEN** the space description SHALL be displayed as a subtle subtitle below the sticky bar

#### Scenario: Today button is in date navigation row
- **WHEN** a user has navigated to a different day
- **THEN** a "Today" button SHALL be visible in the date navigation row (next to the date input)

---

### Requirement: Timeline has no inner scroll container

The timeline SHALL flow naturally with the page scroll without a nested scroll container.

#### Scenario: Timeline scrolls with the page
- **WHEN** a user scrolls the space page
- **THEN** the timeline SHALL scroll together with the rest of the page content, without an independent scroll area

#### Scenario: No max-height constraint on timeline
- **WHEN** the timeline is rendered
- **THEN** the timeline wrapper SHALL NOT have a `max-height` or `overflow-y-auto` style

---

### Requirement: Slot tap opens AdvancedBookingSheet with pre-filled times

Tapping a free slot on the timeline SHALL open the AdvancedBookingSheet with the start and end times pre-filled based on the tapped slot's position and adjacent bookings/open hours.

#### Scenario: Slot tap opens AdvancedBookingSheet
- **WHEN** a user taps a free slot on the timeline
- **THEN** the AdvancedBookingSheet SHALL open (not the QuickBookSheet)

#### Scenario: Slot tap pre-fills start time
- **WHEN** a user taps the 14:00 slot on the timeline
- **THEN** the AdvancedBookingSheet start time input SHALL show "14:00"

#### Scenario: Slot tap pre-fills end time based on next booking
- **WHEN** a user taps the 14:00 slot and there is a booking starting at 15:30
- **THEN** the AdvancedBookingSheet end time input SHALL show "15:30"

#### Scenario: Slot tap pre-fills end time as start + 1 hour when no constraints
- **WHEN** a user taps the 14:00 slot and there are no bookings or close time within the next hour
- **THEN** the AdvancedBookingSheet end time input SHALL show "15:00"

#### Scenario: Slot tap pre-fills end time based on close time
- **WHEN** a user taps the 17:00 slot and the space closes at 18:00
- **THEN** the AdvancedBookingSheet end time input SHALL show "18:00"

---

### Requirement: AdvancedBookingSheet accepts optional default time props

The AdvancedBookingSheet SHALL accept optional `defaultStart` and `defaultEnd` props (HH:MM strings) to pre-fill the time inputs. When not provided, it SHALL default to the current hour and current hour + 1.

#### Scenario: Default times are used when provided
- **WHEN** the AdvancedBookingSheet is opened with `defaultStart="14:00"` and `defaultEnd="15:30"`
- **THEN** the start time input SHALL show "14:00" and the end time input SHALL show "15:30"

#### Scenario: Current time defaults are used when props are not provided
- **WHEN** the AdvancedBookingSheet is opened without `defaultStart` and `defaultEnd` props at 10:05
- **THEN** the start time input SHALL show "10:00" and the end time input SHALL show "11:00"

---

### Requirement: QuickBookSheet is not rendered on the space detail page

The space detail page SHALL NOT render the QuickBookSheet component.

#### Scenario: QuickBookSheet is not present
- **WHEN** the space detail page is rendered
- **THEN** the QuickBookSheet component SHALL NOT be in the DOM
