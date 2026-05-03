## ADDED Requirements

### Requirement: An admin URL SHALL be gated by a shared-secret query parameter

The webapp route `/admin` SHALL be unreachable without an `?key=<secret>` query parameter that matches the server-side `ADMIN_KEY` environment variable. The webapp SHALL forward the secret on every admin tRPC request via the `x-admin-key` HTTP header. The secret value SHALL NOT be persisted in `localStorage`, `sessionStorage`, cookies, or any other client storage; refreshing the tab without the query parameter must return the visitor to a non-admin state.

The server SHALL compare the provided header against `ADMIN_KEY` using a constant-time comparison.

#### Scenario: Visiting `/admin` without a key redirects to the homepage

- **WHEN** a visitor opens `/admin` with no `key` query parameter
- **THEN** the router redirects them to `/` before the admin component mounts
- **AND** no admin queries are issued

#### Scenario: Visiting `/admin` with a wrong key shows a denied state

- **WHEN** a visitor opens `/admin?key=wrong`
- **THEN** the page shows an "invalid admin key" message
- **AND** any admin tRPC call returns `UnauthorizedError`

#### Scenario: Visiting `/admin` with the correct key shows the admin list

- **WHEN** a visitor opens `/admin?key=<correct-secret>`
- **THEN** the page issues the admin bookings list query and renders the result

#### Scenario: Refreshing the admin tab without the query parameter loses access

- **WHEN** an admin reloads `/admin` after stripping the `?key=...` from the URL
- **THEN** the page falls back to the "missing admin key" state

#### Scenario: Constant-time comparison resists timing analysis

- **WHEN** the server validates an admin header
- **THEN** the comparison uses `crypto.timingSafeEqual` (or equivalent) rather than `===`

### Requirement: An admin SHALL be able to list and force-cancel any active booking

The system SHALL expose an admin-only endpoint that returns all currently active bookings across every space, ordered by `startsAt` ascending. The system SHALL expose a second admin-only endpoint that cancels any booking by id, without requiring a name match.

Force-cancellation SHALL emit the same cancellation notification as a self-service cancellation (see `slack-notifications`), tagged so the audit can distinguish admin actions from booker actions.

#### Scenario: Admin list returns all active bookings

- **WHEN** the database contains five active bookings across both spaces and two cancelled bookings
- **AND** an admin queries the admin bookings list
- **THEN** the response contains exactly the five active bookings, ordered by `startsAt` ascending

#### Scenario: Admin force-cancel succeeds without a name

- **WHEN** an admin issues a force-cancel for an active booking id
- **THEN** the booking transitions to `cancelled`
- **AND** no booker name was required

#### Scenario: Admin force-cancel of an unknown booking fails

- **WHEN** an admin issues a force-cancel for an id that does not exist
- **THEN** the request fails with `BookingNotFoundError`

#### Scenario: Admin force-cancel of an already-cancelled booking fails

- **WHEN** an admin issues a force-cancel for a booking already in `cancelled` state
- **THEN** the request fails with a `BusinessRuleError`

#### Scenario: Non-admin caller cannot reach admin endpoints

- **WHEN** a request without a valid `x-admin-key` header reaches an admin procedure
- **THEN** the procedure rejects with `UnauthorizedError`
