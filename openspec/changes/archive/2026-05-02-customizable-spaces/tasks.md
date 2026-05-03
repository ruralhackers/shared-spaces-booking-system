# Tasks — `customizable-spaces`

Tasks marked **TDD** follow Red → Green → Refactor. Plain tasks (types, DTOs, wiring, schema, env) skip the failing-test step. Inside-out order: shared kernel → domain → application → infrastructure → tRPC → webapp → final validation. Run `bun run typecheck && bun run lint:fix && bun test` after each group.

## 1. Shared kernel additions (`@dfs/common`)

- [x] 1.1 **TDD** Add `generateSlug(name: string): string` utility at `packages/common/src/generate-slug.ts`. Tests: converts to lowercase, strips accents, replaces non-alphanumeric with dashes, trims leading/trailing dashes, truncates to 60 chars.
- [x] 1.2 Re-export `generateSlug` from `packages/common/index.ts`.
- [x] 1.3 Validation trio.

## 2. Domain layer (`@dfs/spaces`)

- [x] 2.1 **TDD** Add `OpenHours.validate(openHours)` function at `packages/spaces/domain/open-hours.ts`. Tests: accepts valid 24/7, valid business hours, valid split hours; rejects invalid time format, zero-duration, negative-duration, overlapping windows.
- [x] 2.2 **TDD** Add `Space.create({ name, description, openHours, slug })` factory to `packages/spaces/domain/space.entity.ts`. Tests: creates space with provided slug, validates name length (2–100), validates open hours via `OpenHours.validate()`.
- [x] 2.3 **TDD** Add `space.updateDetails({ name?, description?, openHours? })` method to `Space` entity. Tests: updates provided fields, leaves others unchanged, validates name length and open hours, slug remains immutable.
- [x] 2.4 Add `SpaceSlugCollisionError` at `packages/spaces/domain/errors/space-slug-collision.error.ts`.
- [x] 2.5 Extend `SpaceRepository` port with `save(space): Promise<void>`, `delete(id): Promise<void>`, `slugExists(slug): Promise<boolean>`.
- [x] 2.6 Re-export new domain surface from `packages/spaces/domain/index.ts`.
- [x] 2.7 Validation trio.

## 3. Application layer (`@dfs/spaces`)

- [x] 3.1 **TDD** Add `SpaceCreator` service at `packages/spaces/application/space-creator.service.ts`. Tests: creates space with auto-generated slug, handles slug collision by appending `-2`, `-3`, etc., throws `SpaceSlugCollisionError` after 100 attempts, validates inputs.
- [x] 3.2 **TDD** Add `SpaceUpdater` service at `packages/spaces/application/space-updater.service.ts`. Tests: updates space fields, throws `SpaceNotFoundError` for unknown slug, validates inputs.
- [x] 3.3 **TDD** Add `SpaceDeleter` service at `packages/spaces/application/space-deleter.service.ts`. Tests: deletes space, throws `SpaceNotFoundError` for unknown slug.
- [x] 3.4 Update `SpacesServicesFactory` to include `spaceCreator`, `spaceUpdater`, `spaceDeleter`.
- [x] 3.5 Re-export new application surface from `packages/spaces/application/index.ts`.
- [x] 3.6 Validation trio.

## 4. Infrastructure layer (`@dfs/spaces`)

- [x] 4.1 Extend `InMemorySpaceRepository` with `save()`, `delete()`, `slugExists()` methods.
- [x] 4.2 **TDD (integration)** Extend `SpacePrismaRepository` with `save()`, `delete()`, `slugExists()` methods. Tests: save inserts new space, save updates existing space, delete removes space, delete cascades bookings, slugExists returns true/false correctly.
- [x] 4.3 Validation trio.

## 5. Site branding (`apps/api`)

- [x] 5.1 Add `SITE_NAME` (default: `"Shared Spaces"`) and `SITE_LOGO_URL` (optional) to `apps/api/src/env.ts`.
- [x] 5.2 Add `configRouter` at `packages/api/infrastructure/routers/config.router.ts` with `siteInfo` public procedure returning `{ name, logoUrl }`.
- [x] 5.3 Mount `configRouter` on `appRouter` in `packages/api/infrastructure/routers/root.router.ts`.
- [x] 5.4 Update `.env.example` with `SITE_NAME` and `SITE_LOGO_URL`.
- [x] 5.5 Validation trio.

## 6. Space CRUD tRPC procedures (`@dfs/api`)

- [x] 6.1 Add `spaces.create` admin procedure — input `{ name, description, openHours }` → `SpaceCreator.run()`.
- [x] 6.2 Add `spaces.update` admin procedure — input `{ slug, name?, description?, openHours? }` → `SpaceUpdater.run()`.
- [x] 6.3 Add `spaces.delete` admin procedure — input `{ slug }` → `SpaceDeleter.run()`.
- [x] 6.4 **TDD (integration)** Add tests for space CRUD procedures in `apps/api/tests/spaces-crud.integration.test.ts`. Tests: create space, create with collision, update space, update non-existent, delete space, delete cascades bookings, non-admin rejected.
- [x] 6.5 Validation trio.

## 7. Webapp — site branding

- [x] 7.1 Update `apps/webapp/src/routes/__root.tsx` to fetch `config.siteInfo` and render logo (if set) + site name in nav.
- [x] 7.2 Add `staleTime: Infinity` to the `siteInfo` query for aggressive caching.
- [x] 7.3 Validation trio.

## 8. Webapp — admin space management routes

- [x] 8.1 Add `apps/webapp/src/routes/admin.spaces.tsx` — list all spaces with Edit/Delete actions, "Create space" button.
- [x] 8.2 Add `apps/webapp/src/routes/admin.spaces.new.tsx` — form with name, description, open hours editor; submit calls `spaces.create`.
- [x] 8.3 Add `apps/webapp/src/routes/admin.spaces.$slug.edit.tsx` — pre-filled form; submit calls `spaces.update`.
- [x] 8.4 Add delete confirmation dialog to `/admin/spaces` — warns about booking cascade, calls `spaces.delete` on confirm.
- [x] 8.5 Add admin key gate to all `/admin/spaces*` routes via `beforeLoad` (same pattern as `/admin`).
- [x] 8.6 Validation trio.

## 9. Webapp — OpenHoursEditor component

- [x] 9.1 Add `apps/webapp/src/features/spaces/open-hours-editor.tsx` component with 7-day sections, add/remove window controls, time inputs.
- [x] 9.2 Add "Open 24h" checkbox per day that toggles `[{ start: "00:00", end: "24:00" }]`.
- [x] 9.3 Add inline validation for overlapping windows, invalid times.
- [x] 9.4 **TDD** Add component tests for `OpenHoursEditor` — renders 7 days, add/remove windows, validation errors.
- [x] 9.5 Validation trio.

## 10. Webapp — empty state and cleanup

- [x] 10.1 Update homepage (`index.tsx`) to show friendly empty state when no spaces exist.
- [x] 10.2 Remove seed inserts for `chill-house` and `call-room` from `packages/database/src/seed.ts`.
- [x] 10.3 Validation trio.

## 11. End-to-end smoke

- [x] 11.1 Manual e2e: start API + webapp, visit `/admin/spaces?key=...`, create a space, verify it appears on homepage.
- [x] 11.2 Manual e2e: edit the space's name and open hours, verify changes persist.
- [x] 11.3 Manual e2e: book a slot on the space, then delete the space, verify booking is also deleted.
- [x] 11.4 Manual e2e: verify site branding (set `SITE_NAME` and `SITE_LOGO_URL` in `.env.local`, restart API, verify nav shows them).

## 12. Final review gate (mandatory)

- [x] 12.1 Run `/task-validate` until clean (lint + typecheck + tests, repeat until green).
- [x] 12.2 Run `/task-code-review`, `/task-architecture-review`, `/task-tests-review`, and `/task-frontend-review` in parallel. Address findings.
- [x] 12.3 Re-run validation trio after review fixes.
- [x] 12.4 Mark all tasks complete and report the change ready to archive.
