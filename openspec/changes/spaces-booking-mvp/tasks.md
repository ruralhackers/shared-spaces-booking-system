# Tasks — `spaces-booking-mvp`

Tasks marked **TDD** follow Red → Green → Refactor. Plain tasks (types, DTOs, wiring, schema, seed) skip the failing-test step. Inside-out order: shared kernel → domain → application → infrastructure → tRPC → webapp → final validation. Run `bun run typecheck && bun run lint && bun test` after each group; never carry red across group boundaries.

> No git commits in this change — git is not initialized in the workspace. The user will commit when they choose.

## 1. Shared kernel additions (`@dfs/common`)

- [x] 1.1 Add `Clock` port at `packages/common/src/clock.port.ts` (interface with `now(): Date`).
- [x] 1.2 **TDD** Add `SystemClock` adapter at `packages/common/src/system-clock.adapter.ts`. Test: returns a `Date` close to `Date.now()`.
- [x] 1.3 **TDD** Add `FixedClock` test adapter at `packages/common/src/fixed-clock.adapter.ts`. Tests: `now()` returns the fixed instant; `advance(ms)` mutates the instant.
- [x] 1.4 **TDD** Add `TimeRange` value object at `packages/common/src/time-range.vo.ts`. Tests: `create({start, end})` rejects zero/negative duration; `overlaps(other)`, `contains(instant)`, `durationMs()`, `toDto()`, `fromDto()`.
- [x] 1.5 Re-export `Clock`, `SystemClock`, `FixedClock`, `TimeRange` from `packages/common/index.ts` (and from `packages/common/testing.ts` for `FixedClock` if a separate testing barrel exists).
- [x] 1.6 Run validation trio for `@dfs/common`.

## 2. Database schema and seed (`@dfs/database`)

- [x] 2.1 Add `Space` Prisma model: `id` (cuid), `slug` (unique), `displayName`, `description`, `openHours` (Json), `createdAt`, `updatedAt`.
- [x] 2.2 Add `Booking` Prisma model: `id` (cuid), `spaceId` (FK → Space), `bookerName`, `startsAt` (TIMESTAMPTZ), `endsAt` (TIMESTAMPTZ), `status` (enum: `active`, `cancelled`), `createdAt`, `cancelledAt?`, `cancelledBy?` (enum: `booker`, `admin`).
- [x] 2.3 Add Prisma index on `(spaceId, status, startsAt)` to support overlap and day-view queries.
- [x] 2.4 Author migration `20260501_spaces_and_bookings`:
  - `CREATE EXTENSION IF NOT EXISTS btree_gist;`
  - Tables for `spaces` and `bookings`.
  - `EXCLUDE USING gist (space_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'active')`.
  - Seed inserts for `chill-house` and `call-room` with 24/7 open hours.
- [x] 2.5 Run `bun run -F @dfs/database db:sync` to regenerate `schema.sql`.
- [x] 2.6 Update `packages/database/src/seed.ts` to upsert the two seed spaces (idempotent), keeping the existing dev-seed entry-point shape.
- [x] 2.7 Validation trio.

## 3. `packages/spaces` skeleton

- [x] 3.1 Create `packages/spaces` workspace package with `package.json` (deps: `@dfs/common`, `@dfs/database`), `tsconfig.json` extending root, and the `domain/`, `application/`, `infrastructure/` directories.
- [x] 3.2 Create `packages/spaces/index.ts` with empty barrel; add it to root `package.json` workspaces if it is not auto-included by `packages/*`.
- [x] 3.3 `bun install` to wire the new workspace; confirm `bun run typecheck` is green from a clean state.

## 4. Spaces — domain layer

- [x] 4.1 **TDD** `BookerName` VO at `packages/spaces/domain/booker-name.vo.ts`. Tests: trims, collapses whitespace, rejects `< 2`, `> 60`, whitespace-only, and `<>`-containing inputs; `equals()` is case-insensitive on the normalized form.
- [x] 4.2 Define `OpenHours` type and `OpenHoursWindow` type in `packages/spaces/domain/open-hours.ts` (per-day arrays of `{start: "HH:mm", end: "HH:mm"}`).
- [x] 4.3 **TDD** `OpenHours.contains(range, tz)` helper. Tests: full day open, closed day rejects, midday closure rejects straddling range, accepts ranges fully inside one window.
- [x] 4.4 Define typed errors in `packages/spaces/domain/errors/`: `space-not-found.error.ts`, `booking-not-found.error.ts`, `booking-overlap.error.ts`, `outside-open-hours.error.ts`, `name-mismatch.error.ts` (extend the appropriate `DomainError` subclass from `@dfs/common`).
- [x] 4.5 **TDD** `Space` entity at `packages/spaces/domain/space.entity.ts`. Tests: `create()` validates slug shape, `fromDto()`/`toDto()` round-trip, exposes behavior `isOpenAt(range, tz)` (delegates to `OpenHours.contains`).
- [x] 4.6 **TDD** `Booking` entity at `packages/spaces/domain/booking.entity.ts`. Tests: `create({space, range, bookerName, existing, clock, tz})` rejects overlap, rejects outside open hours, rejects cross-midnight, accepts adjacent ranges; `cancelByBooker(name)` rejects mismatch, rejects already-cancelled, succeeds on match; `cancelByAdmin()` succeeds without a name and rejects already-cancelled; `fromDto()`/`toDto()` round-trip.
- [x] 4.7 Define repository ports at `packages/spaces/domain/space.repository.ts` and `packages/spaces/domain/booking.repository.ts` (business-language methods: `findBySlug`, `listAll`, `findById`, `listActiveOnDay`, `listAllActive`, `save`).
- [x] 4.8 Define `Notifier` port at `packages/spaces/domain/notifier.port.ts` (`bookingCreated(booking, space)`, `bookingCancelled(booking, space, by: 'booker'|'admin')`).
- [x] 4.9 Re-export domain surface from `packages/spaces/domain/index.ts`.
- [x] 4.10 Validation trio.

## 5. Spaces — application layer

- [x] 5.1 **TDD** `SpaceLister` service (`run(): SpaceDto[]`) using an `InMemorySpaceRepository`. Test: returns whatever the repository returns, mapped to DTOs.
- [x] 5.2 **TDD** `SpaceDayViewer` service (`run({slug, date}): DayViewDto`). Tests: returns active bookings for the day, includes the day's open hours, throws `SpaceNotFoundError` for unknown slug, returns empty `bookings` when none on that date.
- [x] 5.3 **TDD** `BookingCreator` service (`run({slug, bookerName, range})`). Tests: persists a valid booking, rejects overlap, rejects outside open hours, rejects cross-midnight, calls `notifier.bookingCreated` after persistence; uses an `InMemoryNotifier` to assert the call.
- [x] 5.4 **TDD** `BookingCanceller` service (`run({id, bookerName})`). Tests: cancels on name match, rejects on mismatch (`NameMismatchError`), rejects on missing (`BookingNotFoundError`), rejects on already-cancelled (`BusinessRuleError`), calls `notifier.bookingCancelled(..., 'booker')` after persistence.
- [x] 5.5 **TDD** `AdminBookingCanceller` service (`run({id})`). Tests: cancels without a name, rejects on missing, rejects on already-cancelled, calls `notifier.bookingCancelled(..., 'admin')`.
- [x] 5.6 **TDD** `AdminBookingLister` service (`run(): BookingDto[]`). Tests: returns all active bookings ordered by `startsAt` ascending; ignores cancelled.
- [x] 5.7 Define DTOs alongside services in `packages/spaces/application/dtos/`.
- [x] 5.8 Re-export application surface from `packages/spaces/application/index.ts`.
- [x] 5.9 Validation trio.

## 6. Spaces — infrastructure layer

- [x] 6.1 Create `InMemorySpaceRepository` next to the port at `packages/spaces/infrastructure/space-in-memory.repository.ts` (used by application tests; ensure it is exported from a `testing` barrel).
- [x] 6.2 Create `InMemoryBookingRepository` and `InMemoryNotifier` similarly.
- [x] 6.3 **TDD (integration)** `SpacePrismaRepository` at `packages/spaces/infrastructure/space-prisma.repository.ts`, tested via `*.integration.test.ts` using `createTestPrisma()`. Tests: `findBySlug` hits/misses, `listAll` returns seed.
- [x] 6.4 **TDD (integration)** `BookingPrismaRepository`. Tests: `save` inserts, `findById`, `listActiveOnDay` ignores cancelled and other days, `listAllActive` orders by `startsAt`. Translate Postgres `EXCLUDE` violation to `BookingOverlapError` and add a test for that translation (Postgres-only — guard with `if (process.env.SKIP_PG_INTEGRATION) test.skip(...)` if PGlite cannot exercise it).
- [x] 6.5 Create `SpacesServicesFactory` at `packages/spaces/infrastructure/factories/spaces-services.factory.ts` that wires repositories + clock + notifier into all six application services and returns them as a typed object.
- [x] 6.6 Re-export infrastructure barrel and a `testing` barrel (in-memory fakes) from `packages/spaces/index.ts`.
- [x] 6.7 Validation trio.

## 7. `packages/notifications`

- [x] 7.1 Create `packages/notifications` workspace (deps: `@dfs/common`).
- [x] 7.2 Define a generic `Notifier` shape in `packages/notifications/domain/notifier.port.ts` matching the `spaces` notifier port (`bookingCreated`, `bookingCancelled`).
- [x] 7.3 **TDD** `NoOpNotifier` at `packages/notifications/infrastructure/no-op.notifier.ts`. Tests: methods resolve without making any HTTP call (use a fake `fetch` spy that asserts zero calls).
- [x] 7.4 **TDD** `SlackWebhookNotifier` at `packages/notifications/infrastructure/slack-webhook.notifier.ts`. Tests: posts a JSON body containing space, booker, formatted time range, and action; `bookingCancelled` includes the `by` field; failures (non-2xx, thrown error) are caught, logged via injected `Logger`, and never thrown.
- [x] 7.5 `NotifierFactory` at `packages/notifications/infrastructure/factories/notifier.factory.ts`: returns `SlackWebhookNotifier` when given a non-empty URL, else `NoOpNotifier`. Test both branches.
- [x] 7.6 Re-export through `packages/notifications/index.ts`.
- [x] 7.7 Validation trio.

## 8. `packages/api` — tRPC surface

- [x] 8.1 Add `@dfs/spaces` and `@dfs/notifications` to `packages/api/package.json` deps.
- [x] 8.2 Extend `TRPCContext` (`packages/api/domain/types/trpc-context.ts`) to carry the wired `spacesServices` object plus a boolean `isAdmin` derived from the `x-admin-key` header. Update `apps/api/src/context.ts` to populate them via factories.
- [x] 8.3 **TDD** Add `adminMiddleware` and `adminProcedure` to `packages/api/infrastructure/trpc/`. Tests: throws `UnauthorizedError` when `isAdmin` is false; passes through when true.
- [x] 8.4 Implement `spaces.router.ts` at `packages/api/infrastructure/routers/`:
  - `list` (public) → `SpaceLister.run()`
  - `getDayView` (public, input `{slug, date}`) → `SpaceDayViewer.run(...)`
  - `book` (public, input `{slug, bookerName, startsAt, endsAt}`) → `BookingCreator.run(...)`
  - `cancel` (public, input `{id, bookerName}`) → `BookingCanceller.run(...)`
  - `adminList` (admin) → `AdminBookingLister.run()`
  - `adminCancel` (admin, input `{id}`) → `AdminBookingCanceller.run(...)`
- [x] 8.5 Mount `spacesRouter` on `appRouter` in `root.router.ts`. Keep `tableRouter.ping` for now.
- [x] 8.6 **TDD (integration)** `apps/api/tests/spaces.integration.test.ts`: spin up Elysia + tRPC against PGlite, exercise list / day view / book / cancel / admin list / admin cancel; assert constant-time admin gate (wrong key → `UNAUTHORIZED`, missing key → `UNAUTHORIZED`).
- [x] 8.7 Re-export the appropriate types from `packages/api/index.ts` for the webapp to consume.
- [x] 8.8 Validation trio.

## 9. `apps/api` — env wiring and host

- [x] 9.1 Add `ADMIN_KEY` (required) and `SLACK_WEBHOOK_URL` (optional) to `apps/api/src/env.ts` (or wherever env is parsed); fail-fast at startup if `ADMIN_KEY` is missing.
- [x] 9.2 In `apps/api/src/context.ts`, wire `SystemClock`, `NotifierFactory.create(SLACK_WEBHOOK_URL)`, the Prisma repositories, and `SpacesServicesFactory` into context.
- [x] 9.3 Configure CORS to expose the `x-admin-key` header.
- [x] 9.4 Update `.env.example` and any deployment docs (`render.yaml` if relevant) to add the two new env vars.
- [x] 9.5 Manual smoke test: `bun run dbs && bun run db:sync && bun run api`, hit `GET /api/trpc/spaces.list` via curl.
- [x] 9.6 Validation trio.

## 10. `apps/webapp` — routes and forms

- [x] 10.1 Delete `apps/webapp/src/routes/dashboard.tsx` (placeholder no longer needed).
- [x] 10.2 Replace `apps/webapp/src/routes/index.tsx` with the spaces list:
  - `loader` prefetches `spaces.list` and computes "free / busy until HH:mm" using a server-side current-instant snapshot included in the response (or computes it client-side from `getDayView` for today — pick the simpler approach during implementation).
  - Renders one card per space linking to `/spaces/$slug`.
- [x] 10.3 Add `apps/webapp/src/routes/spaces.$slug.tsx` with:
  - Day view (vertical timeline, 30-min visual rows, booking bars at actual minutes).
  - Date picker (defaults to today; navigates without route remount via search param).
  - Booking form (name + start time + end time); disables submit while in-flight; shows inline error on `BookingOverlapError` / `OutsideOpenHoursError` / `ValidationError`.
  - Per-row inline cancel form (name input + confirm).
  - tRPC mutations invalidate the day-view query on success.
- [x] 10.4 Add `apps/webapp/src/routes/admin.tsx`:
  - Read `?key=` via TanStack Router search params; reject (show denied state) if missing or empty.
  - Pass the key as `x-admin-key` header in the tRPC client (extend the existing `httpBatchLink` config to set it via a per-request `headers` callback — no localStorage).
  - Render the admin bookings list with per-row force-cancel.
- [x] 10.5 Update `apps/webapp/src/trpc/react.tsx` (or equivalent) to support per-request headers without leaking the admin key into other queries.
- [x] 10.6 Add a `useFormatTime(tz)` hook (or pure helper) backed by `date-fns-tz` for consistent time formatting in the configured TZ.
- [x] 10.7 Add minimal smoke component tests for the booking form (renders, disables on submit, shows error message) using Testing Library.
- [x] 10.8 Validation trio.

## 11. End-to-end smoke

- [x] 11.1 Manual e2e flow against `bun run api` + `bun run webapp`: list → day view → book → see updated list → cancel by name → see freed slot.
- [x] 11.2 Manual admin flow: open `/admin?key=<correct>` → see list → force-cancel → confirm booker-side day view refreshes.
- [x] 11.3 Manual negative flows: wrong admin key → `UNAUTHORIZED`; overlap and outside-hours errors surface as toasts; name mismatch returns `NAME_MISMATCH` error.

## 13. UI polish pass

- [x] 13.1 Replace emoji icons and AI-generated filler copy with clean typography throughout all routes.
- [x] 13.2 Add sticky nav with dark/light theme toggle to `__root.tsx`; FOUC prevention via inline `<script>` in `index.html`.
- [x] 13.3 Add `Card`, `Badge`, `Separator` UI primitives to `apps/webapp/src/components/ui/`.
- [x] 13.4 Redesign homepage as a plain list of spaces (name + description + chevron); skeleton loading state.
- [x] 13.5 Add prev/next day arrows, date picker, and "Today" shortcut to `/spaces/$slug` so residents can browse bookings across any date.
- [x] 13.6 Add "Set to now" control to the booking form that pre-fills start = current hour, end = next hour.
- [x] 13.7 Replace inline error text with `sonner` toasts for booking and cancellation feedback.
- [x] 13.8 Redesign admin page: grouped by space, active-booking count badge, skeleton loading, outline/destructive cancel button.
- [x] 13.9 Change webapp port to 3001 and API port to 4001; update `CORS_ORIGINS`, `VITE_API_URL` default, `BETTER_AUTH_URL`, and `.env.local` accordingly.
- [x] 13.10 Fix CORS: add `trpc-accept` to `Access-Control-Allow-Headers` (required by `httpBatchStreamLink`); remove `@elysiajs/cors` plugin to eliminate double-header conflict; consolidate CORS logic in `trpc-handler.ts`.

## 12. Final review gate (mandatory)

- [x] 12.1 Run `/task-validate` until clean (lint + typecheck + tests, repeat until green).
- [x] 12.2 Run `/task-code-review`, `/task-architecture-review`, `/task-tests-review`, and `/task-frontend-review` in parallel on the full diff. Address findings.
- [x] 12.3 Re-run validation trio after review fixes.
- [x] 12.4 Mark all tasks complete and report the change ready to archive (`@archive spaces-booking-mvp`).
