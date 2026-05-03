## Why

Coliving residents currently coordinate access to the two single-occupancy shared rooms (the "chill house" and the "call room") informally — a Slack message, a knock on the door, a sticky note. There is no shared source of truth for who has the room when, and conflicts (two people showing up for the same slot) happen frequently. We want a tiny, friction-free webapp where any resident can see the day's bookings at a glance and reserve a slot in seconds, without creating an account.

## What Changes

- Introduce a `spaces` bounded context owning **Space** and **Booking** aggregates, with all invariants (slot validity, overlap detection, cancel-by-name) enforced in the domain layer.
- Seed two fixed spaces (`chill-house`, `call-room`) via Prisma migration; spaces are not user-created in v1.
- Expose a tRPC router under `spaces.*`: `list`, `getDayView`, `book`, `cancel` — all unauthenticated, name-only.
- Build the webapp homepage: list of spaces (name + description), each linking to a per-space day view with a booking form (name + start + end) and a "Set to now" shortcut that pre-fills the current hour. The day view includes prev/next day navigation and a "Today" shortcut so residents can browse bookings across any date.
- Add an unauthenticated cancel flow: a booker can cancel their own booking by re-entering the exact name they booked under.
- Add an admin override page at `/admin?key=<shared-secret>` that lists all bookings and lets the admin force-cancel any of them (no name match required); secret is read from `ADMIN_KEY` env.
- Send an outbound Slack notification (incoming webhook) on every successful booking and cancellation, fire-and-forget; failures are logged but do not block the response.
- Introduce a clock port + system clock adapter so domain logic and tests are time-deterministic.

## Capabilities

### New Capabilities

- `space-management`: Models the `Space` aggregate (id, slug, display name, description, open hours), seeds the two fixed spaces, and exposes a read API for listing them.
- `booking-management`: Models the `Booking` aggregate (id, space ref, booker name, time range, status), enforces overlap and open-hours invariants, supports name-match cancellation, and exposes booking + day-view read APIs.
- `admin-override`: Shared-secret URL gate (`ADMIN_KEY`) that unlocks an admin-only "cancel any booking" capability layered on top of `booking-management`.
- `slack-notifications`: Outbound notifier port + Slack incoming-webhook adapter, invoked on booking and cancellation events; fire-and-forget with structured logging on failure.

### Modified Capabilities

(none — `spaces-booking-mvp` is the first feature change after the baseline cleanup; no existing specs to amend.)

## Impact

- **New package**: `packages/spaces` (domain + application + infrastructure) following the hexagonal layout established by the cleanup baseline.
- **New package**: `packages/notifications` (Slack notifier port + adapter) — kept separate from `spaces` so the booking domain has no transport concerns.
- **`packages/database`**: new Prisma models `Space` and `Booking`; new migration; updated `seed.ts` to insert the two fixed spaces.
- **`packages/api`**: new `spaces.router.ts` mounted on `appRouter`; existing `tableRouter.ping` stub stays as a smoke endpoint until removed in a later cleanup.
- **`packages/common`**: may receive a new `Clock` port + `SystemClock` adapter if not already present, plus a `TimeRange` value object.
- **`apps/webapp`**: replace placeholder routes — `/` becomes the spaces list, `/spaces/$slug` becomes the day view, `/admin` becomes the admin override page; remove the current `/dashboard` placeholder.
- **`apps/api`**: new env vars `ADMIN_KEY` (required) and `SLACK_WEBHOOK_URL` (optional — when absent, notifier is a no-op).
- **No auth, no sessions, no user accounts.** Bookings are identified by booker name only; cancellation requires exact-match (case-insensitive, trimmed).
- **Single timezone** (configured via env `TZ`, default `America/Argentina/Buenos_Aires`); no per-user TZ.
- **No recurring bookings, no min/max duration** — all explicitly out of scope for v1.

## Non-goals

- User accounts, authentication, or per-user history.
- Recurring or repeating bookings.
- Conflict resolution beyond "first booking wins" (overlap is rejected).
- Notifications other than Slack (no email, no push, no SMS).
- Admin CRUD for spaces (the two spaces are seeded; editing requires a migration).
- Multi-house, multi-timezone, or per-space access control.
- Mobile app (the repo is web-only after the cleanup change).
