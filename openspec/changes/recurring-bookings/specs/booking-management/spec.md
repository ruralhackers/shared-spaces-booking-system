## MODIFIED Requirements

### Requirement: A booking SHALL belong to a single space and a single calendar day in the configured timezone

Each booking SHALL reference exactly one space and SHALL have a start and end instant such that both fall on the same calendar day in the configured application timezone. Bookings spanning midnight SHALL be rejected at the application layer.

Each booking MAY optionally reference a booking series via a `seriesId` field. If `seriesId` is present, the booking is part of a recurring series; otherwise it is a standalone booking.

#### Scenario: Booking within a single day is accepted

- **WHEN** a client creates a booking for `chill-house` from 14:00 to 16:00 in the configured timezone on a given date
- **THEN** the booking is persisted and returned with `status = "active"`

#### Scenario: Booking that crosses midnight is rejected

- **WHEN** a client creates a booking from 23:30 to 00:30 in the configured timezone
- **THEN** the request fails with a `ValidationError` and no booking is persisted

#### Scenario: Booking with seriesId links to a series

- **WHEN** a booking is created as part of a series
- **THEN** the booking's `seriesId` field references the series
- **AND** the booking can be queried by `seriesId`

#### Scenario: Standalone booking has no seriesId

- **WHEN** a booking is created without a series
- **THEN** the booking's `seriesId` field is `null`
