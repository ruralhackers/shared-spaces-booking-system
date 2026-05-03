## ADDED Requirements

### Requirement: Book button is always visible without scrolling

The space page SHALL display a "Book" button in a sticky bar at the top of the page content, at the same vertical level as the "All spaces" back link, so users can initiate a booking without scrolling to the bottom of the page.

#### Scenario: Book button visible on page load
- **WHEN** a user opens a space page on a mobile device
- **THEN** the "Book" button SHALL be visible in the sticky top bar without any scrolling

#### Scenario: Book button scrolls to the booking form
- **WHEN** a user taps the "Book" button in the sticky bar
- **THEN** the page SHALL scroll to the booking form section

#### Scenario: Book button is disabled while a booking is pending
- **WHEN** a booking submission is in progress (`isPending = true`)
- **THEN** the "Book" button in the sticky bar SHALL be disabled

---

### Requirement: Today shortcut is positioned next to the space name

The space page SHALL display a "Today" button immediately to the right of the space name (`<h1>`), allowing users to reset the selected date to today without interacting with the date navigation row.

#### Scenario: Today button resets date to today
- **WHEN** a user has navigated to a different day and taps the "Today" button next to the space name
- **THEN** the selected date SHALL be reset to today's date in the booking timezone

#### Scenario: Today button is not shown in the date navigation row
- **WHEN** the space page is rendered
- **THEN** the "Today" button SHALL NOT appear inside the date navigation row (prev/next arrows area)

---

### Requirement: Date heading shows a compact day label

The date navigation heading SHALL display only the numeric day of the month for today, tomorrow, and yesterday (e.g. "2"), and a short date (e.g. "2 May") for all other dates. Verbose formats including weekday names and full month+year SHALL NOT be used.

#### Scenario: Today shows numeric day only
- **WHEN** the selected date is today
- **THEN** the heading SHALL display only the numeric day (e.g. "2")

#### Scenario: Tomorrow shows numeric day only
- **WHEN** the selected date is tomorrow
- **THEN** the heading SHALL display only the numeric day (e.g. "3")

#### Scenario: Yesterday shows numeric day only
- **WHEN** the selected date is yesterday
- **THEN** the heading SHALL display only the numeric day (e.g. "1")

#### Scenario: Other dates show short date
- **WHEN** the selected date is neither today, tomorrow, nor yesterday
- **THEN** the heading SHALL display a short date format (e.g. "28 Apr")

---

### Requirement: Booking form pre-fills default times on load

When the booking form is rendered, the start time SHALL be pre-filled with the current hour on the dot (minutes = 00), and the end time SHALL be pre-filled with start time + 1 hour. Both values SHALL be set immediately on mount without requiring user interaction.

#### Scenario: Start time defaults to current hour
- **WHEN** the booking form is rendered at 10:05
- **THEN** the start time input SHALL show "10:00"

#### Scenario: End time defaults to start + 1 hour
- **WHEN** the booking form is rendered at 10:05
- **THEN** the end time input SHALL show "11:00"

#### Scenario: Set to now button still works as a reset
- **WHEN** a user has changed the times and taps "Set to now"
- **THEN** start and end times SHALL be reset to the current hour and current hour + 1

---

### Requirement: Language switcher has a visible border

The language switcher control SHALL render with a visible border so it is clearly identifiable as an interactive button, not plain text.

#### Scenario: Language switcher appears as an outlined button
- **WHEN** the page header is rendered
- **THEN** the language switcher SHALL have a visible border (outline variant)
