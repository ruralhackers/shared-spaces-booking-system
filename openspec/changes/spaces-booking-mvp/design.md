## Context

This is the first feature change after `cleanup-unused-stack`. The repository is now a clean DDD/hexagonal monorepo with `packages/{api, common, database, ui}` and `apps/{api, webapp}` — no auth, no users, no mobile. The webapp homepage is a placeholder.

The product is intentionally tiny: two single-occupancy rooms in one coliving house, accessed by ~10 residents who already know each other. There is no auth and no notion of "user" — bookings are tagged with a free-text booker name, and cancellation by a non-admin requires re-entering that exact name. An admin URL gated by a shared secret can force-cancel anything.

We must absorb this feature without bending the architecture rules established in the cleanup baseline:
- Bounded contexts in `packages/`; apps stay thin.
- Domain layer pure; application services expose `run()`; infrastructure adapters implement ports defined in domain.
- tRPC router lives in `@dfs/api/infrastructure/routers/` and only orchestrates calls into application services.
- Frontend stays on the tRPC boundary — no Prisma, no domain imports.

## Goals / Non-Goals

**Goals:**
- A bookings model that makes overlapping reservations on the same space structurally impossible at the domain layer (not at the DB level alone).
- A clock abstraction so every time-dependent test is deterministic without `vi.useFakeTimers()`-style ceremony.
- A UI flow where a logged-out resident can book a slot in ≤ 4 clicks (homepage → space → slot → confirm).
- Slack notification on booking and cancellation, fire-and-forget — never block or fail the user response if Slack is down or unconfigured.
- An admin override that requires no UI complexity: a query-string secret gate, a flat list of upcoming bookings, a "cancel" button per row.

**Non-Goals:**
- User accounts, sessions, or any persistent identity.
- Recurring bookings, waitlists, calendar invites, or buffers between bookings.
- Per-space access control or role hierarchies.
- Spaces CRUD UI — the two spaces are seeded; changing them requires a migration.
- Multi-house, multi-timezone — single configured TZ.
- Real-time updates (websockets, polling) — TanStack Query refetch-on-focus is sufficient.

## Decisions

### 1. New bounded context: `packages/spaces`

Owns both `Space` and `Booking` aggregates. Considered splitting into `packages/spaces` + `packages/bookings`, but rejected: bookings only exist *of* a space, the day-view query joins both, and there is no realistic future where bookings live without spaces. One context, two aggregates, one repository per aggregate.

Layout:

```
packages/spaces/
  domain/
    space.entity.ts
    booking.entity.ts
    time-range.vo.ts            # re-exported from @dfs/common if shared
    booker-name.vo.ts
    space.repository.ts         # port
    booking.repository.ts       # port
    notifier.port.ts            # port (booking-events notifier)
    errors/
      booking-overlap.error.ts
      outside-open-hours.error.ts
      name-mismatch.error.ts
      space-not-found.error.ts
      booking-not-found.error.ts
  application/
    space-list.service.ts          # run(): SpaceDto[]
    space-day-view.service.ts      # run({ slug, date }): DayViewDto
    booking-creator.service.ts     # run({ slug, bookerName, range })
    booking-canceller.service.ts   # run({ id, bookerName })
    admin-booking-canceller.service.ts # run({ id })
    dtos/...
  infrastructure/
    space-prisma.repository.ts
    booking-prisma.repository.ts
    space-in-memory.repository.ts
    booking-in-memory.repository.ts
    factories/
      spaces-services.factory.ts
```

### 2. New bounded context: `packages/notifications`

Slack adapter sits in its own context, not inside `spaces`. The `spaces` domain only knows a `Notifier` port (`bookingCreated`, `bookingCancelled`). The Slack HTTP adapter implements that port and lives in `packages/notifications/infrastructure/`. Rationale: keeps the booking domain free of HTTP concerns and lets us add other transports later (or swap Slack for Discord) without touching `spaces`.

```
packages/notifications/
  domain/
    notifier.port.ts            # generic Notifier interface (or per-event)
  infrastructure/
    slack-webhook.notifier.ts
    no-op.notifier.ts           # used when SLACK_WEBHOOK_URL is unset
    factories/
      notifier.factory.ts       # picks slack vs no-op based on config
```

`spaces` depends on its **own** `Notifier` port (defined in `packages/spaces/domain/notifier.port.ts`) — `packages/notifications` provides an adapter that satisfies that shape. We do **not** import `@dfs/notifications/domain` from `@dfs/spaces`. The wiring (which adapter implements which port) happens in `apps/api` via factories. This preserves "bounded contexts communicate through application services or domain ports, never through direct adapter coupling."

### 3. Clock as a first-class port

Every time-dependent piece of logic (overlap detection, "free / busy until HH:mm", open-hours validation) takes a `Clock` dependency. Add to `packages/common`:

```ts
// packages/common/src/clock.port.ts
export interface Clock { now(): Date; }
// packages/common/src/system-clock.adapter.ts
export class SystemClock implements Clock { now() { return new Date(); } }
// packages/common/src/fixed-clock.adapter.ts (testing)
export class FixedClock implements Clock {
  constructor(private value: Date) {}
  now() { return this.value; }
  advance(ms: number) { this.value = new Date(this.value.getTime() + ms); }
}
```

Application services receive `Clock` via constructor; tests inject `FixedClock`. No `Date.now()` inside domain or application code.

### 4. `TimeRange` value object in `@dfs/common`

`TimeRange` is generic enough to belong in the shared kernel (we'll likely reuse it for open-hours, slot windows, and any future scheduling). Lives in `packages/common/src/time-range.vo.ts`.

Invariants enforced in `create({ start, end })`:
- `end` strictly after `start` (no zero-duration ranges).
- Both must be valid `Date` instances.
- Methods: `overlaps(other)`, `contains(instant)`, `durationMs()`, `toDto()`, `fromDto()`.

### 5. Open hours model

Per-space `openHours` stored as a JSON field on the `Space` row: `{ mon: [{start: "07:00", end: "23:00"}], tue: [...], ..., sun: [...] }`. Each day is an array of `HH:mm`-`HH:mm` windows in the configured TZ. Empty array = closed that day. Two windows = a midday closure.

Considered: a separate `space_open_hours` table. Rejected for v1 because (a) we have two spaces, both will likely use identical 24/7 or 07:00–23:00 schedules, and (b) JSON keeps the seed migration trivial. We can migrate to a relational shape later if admin CRUD is added.

### 6. Overlap detection — domain first, DB second

`Booking.create({ space, range, existing: Booking[] })` rejects with `BookingOverlapError` if any active booking in `existing` overlaps `range`. The application service loads candidate bookings (same space, same day) before constructing the entity. As defense in depth, add a Postgres exclusion constraint:

```sql
ALTER TABLE bookings
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    space_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  )
  WHERE (status = 'active');
```

Domain catches 99% of cases; the DB constraint catches races. We translate the Postgres error to `BookingOverlapError` in the repository adapter so the application layer always sees a `DomainError`.

### 7. Booker name normalization

`BookerName` value object trims, collapses internal whitespace, and stores the original casing for display. Equality (used in cancellation) is **case-insensitive on the normalized form**. Length: 2–60 chars; regex rejects empty/whitespace-only and obvious garbage (`< >` to block stray HTML). Stored in DB as the normalized display form.

### 8. Admin gate

Implemented as a tRPC middleware that reads `x-admin-key` header (sent by the webapp from the `?key=` URL parameter, kept in component state, never persisted). Compares against `ADMIN_KEY` env via `crypto.timingSafeEqual`. On mismatch, throws `UnauthorizedError`. Builds an `adminProcedure` alongside `publicProcedure` in `packages/api/infrastructure/trpc/procedures.ts`.

The `?key=` value never reaches localStorage or any persistent store; refresh requires re-pasting the URL. This is intentional — the admin URL is the credential.

### 9. Slack notifier — fire and forget, no failure propagation

`BookingCreatorService.run()` and `BookingCancellerService.run()` call `notifier.bookingCreated(...)` / `bookingCancelled(...)` **after** the booking is persisted. The notifier returns `void` (not `Promise<void>` exposed to callers) — internally it kicks off the HTTP call, catches any error, logs it via the injected `Logger`, and resolves immediately. The user response is never delayed by Slack latency.

Considered: queueing via a background job. Rejected for v1 — adds infrastructure (Redis, BullMQ) for a feature that fails silently anyway. Fire-and-forget is honest about the guarantee level.

### 10. Frontend routes

```
apps/webapp/src/routes/
  __root.tsx                 # sticky nav with theme toggle (dark/light)
  index.tsx                  # spaces list (name + description, no live status)
  spaces.$slug.tsx           # day view + booking form + cancel inline
  admin.tsx                  # ?key=... gated admin list, grouped by space
```

No `loader` prefetch — all data is fetched via `useQuery` inside components. TanStack Query's `defaultPreload: 'intent'` handles hover prefetch for the router. Mutations invalidate the relevant query on success and show a toast via `sonner`.

`/admin` without `?key=` redirects to `/` via `beforeLoad` — no "denied" page is rendered.

### 11. Day view — flat list, not a timeline

The original design called for a vertical 30-minute-row timeline. This was replaced with a flat sorted list of bookings for the selected day. Rationale: the audience is ~10 residents; a list is faster to scan and avoids the complexity of mapping time ranges to pixel positions. The timeline can be added later without any backend changes.

Day navigation (prev/next arrows, date picker, "Today" button) is provided so residents can browse any date's bookings.

### 12. Timezone handling

All `Date` values in the DB are UTC. The configured TZ (`process.env.TZ`, default `America/Argentina/Buenos_Aires`) is applied at the **edges**: parsing user input (`HH:mm` on a given date → UTC instant) and rendering output (UTC instant → `HH:mm` for display). Use `date-fns-tz` for both. The domain layer only ever sees UTC `Date` instances and treats them as opaque instants.

### 13. Idempotency

Booking creation is **not** idempotent in v1 — a double-submit creates two bookings (the second will likely fail overlap). The frontend disables the submit button while the mutation is in-flight, which is enough mitigation given the audience size. Revisit if we see real duplicates in logs.

## Risks / Trade-offs

- **Risk**: Postgres `EXCLUDE USING gist` requires the `btree_gist` extension. → **Mitigation**: `CREATE EXTENSION IF NOT EXISTS btree_gist` in the migration; PGlite (used in integration tests) doesn't support gist exclusion, so integration tests rely on the domain-level overlap check and we add a Postgres-only integration test guarded by an env flag (or simply document the gap).
- **Risk**: Storing open hours as JSON makes "find all spaces open at 14:00 on Tuesday" hard. → **Mitigation**: We don't need that query in v1 (spaces list is unfiltered). If we ever do, migrate to a relational table.
- **Risk**: Name-match cancellation is trivially defeatable by anyone who can read the booker name on the day view. → **Accepted**: this is a coliving of trusted residents; the real "you can't cancel mine" enforcement is social, not technical. The admin override exists for genuine abuse.
- **Risk**: `ADMIN_KEY` leaked once is leaked forever (no rotation UI). → **Mitigation**: documented in README that rotating means redeploying with a new env var; acceptable for a 10-person tool.
- **Risk**: Slack webhook URL leaked in client bundle. → **Mitigation**: lives only in `apps/api` env (server-side); webapp never sees it.
- **Risk**: A booking that spans midnight conflicts with both the "day view" abstraction and the per-day open-hours JSON. → **Decision**: reject bookings that cross midnight in v1 (`TimeRange.create` allows it generally, but `BookingCreatorService` enforces "single calendar day in configured TZ"). Document explicitly.
- **Trade-off**: Two new packages (`spaces`, `notifications`) in one change is a lot. → **Accepted**: keeping them separate avoids rework when the second notifier transport arrives, and the packages are small.

## Migration Plan

1. Land schema migration `20260501_spaces_and_bookings` with both tables, the `btree_gist` extension, the seed inserts for `chill-house` and `call-room`, and the exclusion constraint.
2. Land domain + application layers behind no router (compiles, tests pass, but no HTTP surface).
3. Land tRPC router + admin procedure; behind a feature-test only.
4. Land webapp routes; smoke test the full flow against a local dev API.
5. Set `ADMIN_KEY` (required) and `SLACK_WEBHOOK_URL` (optional) in deployment env. App must boot without `SLACK_WEBHOOK_URL` — notifier degrades to no-op.

Rollback: drop the two tables and the migration; the rest of the app is unaffected because spaces are an additive bounded context.

## Open Questions

- **Open hours for v1 seed**: confirm both spaces are 24/7, or pick a default like 07:00–23:00. Default assumption in tasks: **24/7** (every day `[{start: "00:00", end: "24:00"}]` represented as full-day open).
- **Admin URL UX**: do we want the admin page to also show a link to copy the current admin URL, or stay strictly view+cancel? Default assumption: **view + cancel only**.
- **Display of past bookings**: does the day view show yesterday/tomorrow, or only "today + future"? Default assumption: **any date you navigate to is fully shown**, with a date picker; past bookings render in a muted style and cannot be cancelled.
