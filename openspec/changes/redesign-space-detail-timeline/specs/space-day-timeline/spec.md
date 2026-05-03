## ADDED Requirements

### Requirement: Timeline renders open hours range vertically

The space detail page SHALL display a vertical timeline showing only the hours when the space is open on the selected day. Each hour SHALL be rendered as a fixed-height row with a time label in a left gutter.

#### Scenario: Timeline shows only open hours
- **GIVEN** a space with openHours = [{ start: "09:00", end: "22:00" }] on the selected day
- **WHEN** the space detail page is rendered
- **THEN** the timeline SHALL display hour rows for 09, 10, 11, ..., 21 (22 is the end boundary, not rendered as a row)
- **AND** hours outside the open range (00-08, 22-23) SHALL NOT be rendered

#### Scenario: Timeline shows multiple open windows
- **GIVEN** a space with openHours = [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }] on the selected day
- **WHEN** the space detail page is rendered
- **THEN** the timeline SHALL display hour rows for 09-12 and 15-19
- **AND** the gap (13-14) SHALL NOT be rendered

#### Scenario: Closed day shows empty state
- **GIVEN** a space with openHours = [] on the selected day (closed all day)
- **WHEN** the space detail page is rendered
- **THEN** the timeline SHALL NOT be rendered
- **AND** an empty state message "Cerrado los {weekday}" SHALL be displayed

---

### Requirement: Each hour row has a minimum height for touch targets

Each hour row in the timeline SHALL have a minimum height of 56px (3.5rem) to ensure comfortable touch targets on mobile devices.

#### Scenario: Hour rows are tall enough to tap
- **WHEN** the timeline is rendered
- **THEN** each hour row SHALL have a height of at least 56px

---

### Requirement: Booking blocks are positioned proportional to start/end minutes

Booking blocks SHALL be positioned absolutely within the timeline using top and height values proportional to the booking's start and end times relative to midnight.

#### Scenario: Full-hour booking fills the row
- **GIVEN** a booking from 10:00 to 11:00, hourRowHeight = 56px
- **WHEN** the timeline is rendered
- **THEN** the booking block SHALL have `top = 10 * 56px` and `height = 1 * 56px`

#### Scenario: Sub-hour booking is positioned within the row
- **GIVEN** a booking from 10:30 to 11:15, hourRowHeight = 56px
- **WHEN** the timeline is rendered
- **THEN** the booking block SHALL have `top = (10 + 30/60) * 56px = 588px` and `height = (45/60) * 56px = 42px`

#### Scenario: Booking spanning multiple hours
- **GIVEN** a booking from 10:00 to 13:00, hourRowHeight = 56px
- **WHEN** the timeline is rendered
- **THEN** the booking block SHALL have `top = 10 * 56px = 560px` and `height = 3 * 56px = 168px`

---

### Requirement: Booking block displays booker name

Each booking block SHALL display the booker's name centered within the block.

#### Scenario: Booker name is visible
- **GIVEN** a booking with bookerName = "Marta"
- **WHEN** the timeline is rendered
- **THEN** the booking block SHALL display "Marta" centered

---

### Requirement: Booking blocks use space color

Booking blocks SHALL use the space's color as the background color, with white text for the booker name.

#### Scenario: Booking block uses space color
- **GIVEN** a space with color = "#3b82f6" (blue)
- **WHEN** a booking is rendered in the timeline
- **THEN** the booking block SHALL have `background-color: #3b82f6` and `color: white`

---

### Requirement: Now indicator visible only on today

The timeline SHALL display a horizontal "now" indicator line at the current time position, but ONLY when the selected date is today.

#### Scenario: Now indicator visible on today
- **GIVEN** the selected date is today and the current time is 10:30
- **WHEN** the timeline is rendered
- **THEN** a horizontal line SHALL be visible at the 10:30 position

#### Scenario: Now indicator hidden on other days
- **GIVEN** the selected date is tomorrow
- **WHEN** the timeline is rendered
- **THEN** the "now" indicator line SHALL NOT be rendered

---

### Requirement: Now indicator auto-scrolled into view on mount

When the timeline is rendered and the selected date is today, the timeline SHALL automatically scroll to center the "now" indicator line in the viewport using smooth scrolling.

#### Scenario: Timeline auto-scrolls to now on mount
- **GIVEN** the selected date is today and the current time is 14:00
- **WHEN** the space detail page is loaded
- **THEN** the timeline SHALL scroll smoothly to center the 14:00 position in the viewport

#### Scenario: No auto-scroll on other days
- **GIVEN** the selected date is tomorrow
- **WHEN** the space detail page is loaded
- **THEN** the timeline SHALL NOT auto-scroll (loads at the top)

---

### Requirement: Now indicator updates every minute

The "now" indicator line SHALL update its position every 60 seconds to reflect the current time.

#### Scenario: Now indicator position updates
- **GIVEN** the timeline is rendered at 10:30 with the now indicator visible
- **WHEN** 60 seconds pass
- **THEN** the now indicator SHALL move to the 10:31 position

---

### Requirement: Closed hours without bookings are not rendered

If a space has multiple open windows on a day (e.g., 09:00-13:00 and 15:00-20:00), the timeline SHALL NOT render hour rows for the closed gap (13:00-15:00) UNLESS a booking exists in that gap.

#### Scenario: Gap between open windows is not rendered when no bookings
- **GIVEN** openHours = [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }] and no bookings in the 13-14 gap
- **WHEN** the timeline is rendered
- **THEN** hour rows for 13 and 14 SHALL NOT be rendered

#### Scenario: Gap between open windows is rendered when booking exists
- **GIVEN** openHours = [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "20:00" }] and a booking from 13:00 to 14:00
- **WHEN** the timeline is rendered
- **THEN** hour row 13 SHALL be rendered with a "closed" visual indicator (grey background or badge)
- **AND** the booking block SHALL be visible

---

### Requirement: Bookings outside open hours force hour row rendering

If a booking exists outside the space's open hours (defensive case — shouldn't happen by domain), the timeline SHALL render the hour row for that booking with a "closed" visual indicator.

#### Scenario: Booking before open hours extends timeline
- **GIVEN** openHours = [{ start: "09:00", end: "22:00" }] and a booking from 08:00 to 09:00
- **WHEN** the timeline is rendered
- **THEN** hour row 08 SHALL be rendered with a "closed" visual indicator (grey background or badge)
- **AND** the booking block SHALL be visible

#### Scenario: Booking after close hours extends timeline
- **GIVEN** openHours = [{ start: "09:00", end: "22:00" }] and a booking from 22:00 to 23:00
- **WHEN** the timeline is rendered
- **THEN** hour row 22 SHALL be rendered with a "closed" visual indicator
- **AND** the booking block SHALL be visible

---

### Requirement: Overlapping bookings are rendered side-by-side

If two bookings overlap (defensive case — shouldn't happen by domain), the timeline SHALL render them side-by-side with reduced width (50% each) so both are visible.

#### Scenario: Overlapping bookings are both visible
- **GIVEN** two bookings: 10:00-11:00 (Marta) and 10:30-11:30 (Pablo)
- **WHEN** the timeline is rendered
- **THEN** both booking blocks SHALL be visible, each with 50% width, side-by-side

---

### Requirement: Date navigation is preserved

The space detail page SHALL preserve the existing date navigation controls: prev/next buttons, date input, and "Today" button.

#### Scenario: Prev/next buttons navigate days
- **GIVEN** the selected date is May 3
- **WHEN** the user clicks the "next" button
- **THEN** the timeline SHALL reload with bookings for May 4

#### Scenario: Today button resets to today
- **GIVEN** the selected date is May 5
- **WHEN** the user clicks the "Today" button
- **THEN** the timeline SHALL reload with bookings for today

#### Scenario: Today button is hidden when viewing today
- **GIVEN** the selected date is today
- **WHEN** the timeline is rendered
- **THEN** the "Today" button SHALL NOT be visible

---

### Requirement: Loading and error states are preserved

The space detail page SHALL display loading and error states for the `spaces.dayView` query.

#### Scenario: Loading state while fetching bookings
- **GIVEN** the `spaces.dayView` query is pending
- **WHEN** the space detail page is rendered
- **THEN** a loading spinner or skeleton SHALL be displayed

#### Scenario: Error state on query failure
- **GIVEN** the `spaces.dayView` query fails
- **WHEN** the space detail page is rendered
- **THEN** an error message SHALL be displayed

---

### Requirement: Timeline renders date from query param

When the space detail page is visited with a `?date=YYYY-MM-DD` query parameter, the timeline SHALL render that date instead of today.

#### Scenario: Query param overrides default date
- **GIVEN** a user visits `/spaces/chill-house?date=2026-05-04`
- **WHEN** the page loads
- **THEN** the timeline SHALL render bookings for May 4, 2026 (not today)

#### Scenario: Invalid date query param falls back to today
- **GIVEN** a user visits `/spaces/chill-house?date=invalid`
- **WHEN** the page loads
- **THEN** the timeline SHALL render bookings for today

#### Scenario: Missing date query param defaults to today
- **GIVEN** a user visits `/spaces/chill-house` (no date param)
- **WHEN** the page loads
- **THEN** the timeline SHALL render bookings for today
