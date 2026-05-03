## ADDED Requirements

### Requirement: The system SHALL post to Slack on booking creation and cancellation

The system SHALL emit an outbound notification to a configured Slack incoming webhook whenever a booking is successfully created or cancelled. The notification SHALL include the space display name, the booker name, the booking's start and end time in the configured timezone, and the action (`created` or `cancelled`). Cancellation notifications SHALL also indicate whether the cancellation was performed by the booker or by an admin.

#### Scenario: Notification is sent on successful booking

- **WHEN** a booking creation succeeds
- **THEN** the system posts a message to the configured Slack webhook containing the space, booker name, time range, and the action `created`

#### Scenario: Notification is sent on self-service cancellation

- **WHEN** a booker successfully cancels their own booking
- **THEN** the system posts a message to the configured Slack webhook tagged with `cancelled by booker`

#### Scenario: Notification is sent on admin force-cancellation

- **WHEN** an admin force-cancels a booking
- **THEN** the system posts a message to the configured Slack webhook tagged with `cancelled by admin`

#### Scenario: No notification is sent when domain validation fails

- **WHEN** a booking creation fails validation (overlap, outside open hours, invalid name)
- **THEN** no Slack message is posted

### Requirement: Slack delivery SHALL be fire-and-forget and SHALL NOT block or fail the user response

The system SHALL invoke the Slack webhook asynchronously after the booking has been successfully persisted. Failures of the Slack call (network error, non-2xx response, timeout) SHALL be logged via the application logger but SHALL NOT propagate to the caller of the booking endpoint. The user-facing booking response SHALL succeed regardless of Slack reachability.

#### Scenario: Slack webhook timeout does not delay the user response

- **WHEN** the Slack endpoint takes 30 seconds to respond
- **THEN** the booking creation response returns within its normal latency budget
- **AND** the user receives a successful response

#### Scenario: Slack webhook failure is logged

- **WHEN** the Slack endpoint returns HTTP 500
- **THEN** the application logger records a warning with the booking id and the failure cause
- **AND** the booking creation response succeeds

#### Scenario: Slack webhook network error does not roll back the booking

- **WHEN** the Slack call throws a network error
- **THEN** the booking remains persisted as `active`

### Requirement: The notifier SHALL degrade to a no-op when Slack is not configured

When the `SLACK_WEBHOOK_URL` environment variable is unset or empty, the system SHALL select a no-op notifier implementation at startup. The application SHALL boot and operate normally; bookings and cancellations SHALL succeed; no outbound HTTP call SHALL be made.

#### Scenario: Application boots without `SLACK_WEBHOOK_URL`

- **WHEN** the application starts with `SLACK_WEBHOOK_URL` unset
- **THEN** startup completes without error

#### Scenario: No HTTP call is made when Slack is not configured

- **WHEN** `SLACK_WEBHOOK_URL` is unset and a booking is created
- **THEN** no outbound HTTP request to any Slack endpoint is issued

#### Scenario: Switching to a configured Slack URL requires a restart

- **WHEN** `SLACK_WEBHOOK_URL` is set in the environment and the application is restarted
- **THEN** subsequent bookings post to the configured webhook
