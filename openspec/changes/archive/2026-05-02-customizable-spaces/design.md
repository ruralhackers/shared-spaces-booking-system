## Context

The `spaces-booking-mvp` change established a working booking system with two hardcoded spaces seeded via migration. The site name "Shared Spaces" is hardcoded in `__root.tsx`. This works for the original coliving use case but blocks adoption by other operators (e.g., a creative hub with rooms named Sala S, Sala M, Sala L).

Current state:
- Spaces are inserted by `packages/database/src/seed.ts` and the migration.
- No write API exists for spaces — `SpaceRepository` only has `findBySlug()` and `listAll()`.
- The `Space` entity has `fromDto()` but no `create()` factory for new instances.
- The admin panel (`/admin`) only manages bookings, not spaces.
- Site branding is hardcoded in the webapp nav.

Constraints:
- Must preserve the existing booking flow (public users book via `/spaces/$slug`).
- Admin gate remains the same (`?key=` query param, `x-admin-key` header, `ADMIN_KEY` env var).
- No auth system — admin is anyone with the key.
- Single deployment, single timezone (no multi-tenancy).

## Goals / Non-Goals

**Goals:**
- Per-deployment branding via `SITE_NAME` and `SITE_LOGO_URL` env vars.
- Admin-only CRUD for spaces: create, edit, delete.
- Slug auto-generation from display name, with collision handling.
- Open hours editor for per-day time windows.
- Hard delete of spaces cascades to bookings (no orphans).
- Empty initial state — no seeded spaces; admin creates them.

**Non-Goals:**
- Soft delete / archive (hard delete only).
- Slug editing after creation (immutable for URL stability).
- Space reordering or custom display order.
- Logo upload (external URL only).
- Multi-tenancy or per-tenant branding.

## Decisions

### 1. Site branding via env vars and a dedicated tRPC query

Add `SITE_NAME` (default: `"Shared Spaces"`) and `SITE_LOGO_URL` (optional, no default) to `apps/api/src/env.ts`. Expose via a new `config.siteInfo` public tRPC procedure that returns `{ name: string, logoUrl: string | null }`.

The webapp's `__root.tsx` fetches `config.siteInfo` and renders the logo (if set) as a clickable image linking to `/`, plus the site name. If the logo URL is broken, the browser shows a broken image — no server-side validation.

**Why not hardcode in the webapp?** The webapp is a static build; env vars at build time would require rebuilding for each deployment. Fetching from the API allows runtime configuration.

**Why a dedicated procedure instead of embedding in context?** Keeps the tRPC context lean; site info is static per deployment and can be cached aggressively by TanStack Query (`staleTime: Infinity`).

### 2. Space.create() factory with slug generation in the domain

Add a `Space.create({ name, description, openHours, generateSlug })` factory to the `Space` entity. The `generateSlug` function is injected (not imported) so the domain stays pure and testable.

Slug generation logic (lives in `packages/common`):
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
```

Collision handling happens in the application layer (`SpaceCreator`), not the domain. The service calls `repository.slugExists(slug)` and appends `-2`, `-3`, etc. until unique (max 100 attempts, then throws `SpaceSlugCollisionError`).

**Why inject generateSlug?** Keeps the entity testable without importing infrastructure. Tests can inject a stub that returns a fixed slug.

### 3. SpaceRepository extended with save(), delete(), slugExists()

Add to the `SpaceRepository` port:
- `save(space: Space): Promise<void>` — upsert (insert or update by id).
- `delete(id: string): Promise<void>` — hard delete; Prisma cascades bookings via FK.
- `slugExists(slug: string): Promise<boolean>` — for collision detection.

The Prisma adapter uses `prisma.space.upsert()` for save and `prisma.space.delete()` for delete. The InMemory adapter mirrors this for tests.

**Why upsert instead of separate create/update?** Simplifies the service layer — `SpaceCreator` and `SpaceUpdater` both call `save()`. The entity tracks whether it's new via an internal flag or the repository checks existence.

### 4. Three new application services: SpaceCreator, SpaceUpdater, SpaceDeleter

**SpaceCreator.run({ name, description, openHours })**
1. Validate inputs (name 2–100 chars, description optional, openHours valid).
2. Generate base slug from name.
3. Loop: check `slugExists()`, append suffix if collision, max 100 attempts.
4. Call `Space.create()` with the unique slug.
5. Call `repository.save(space)`.
6. Return `SpaceDto`.

**SpaceUpdater.run({ slug, name?, description?, openHours? })**
1. Load space via `findBySlug()` or throw `SpaceNotFoundError`.
2. Call `space.updateDetails({ name, description, openHours })` — slug stays immutable.
3. Call `repository.save(space)`.
4. Return `SpaceDto`.

**SpaceDeleter.run({ slug })**
1. Load space via `findBySlug()` or throw `SpaceNotFoundError`.
2. Call `repository.delete(space.id)`.
3. Return `{ deleted: true }`.

No confirmation prompt in the service — the UI handles "are you sure?" before calling.

### 5. Open hours validation in the domain

`OpenHours` is already a type (`{ mon: Window[], tue: Window[], ... }`). Add validation in `Space.create()` and `space.updateDetails()`:
- Each window has `start` and `end` in `HH:mm` format.
- `end > start` (no zero or negative duration).
- No overlapping windows within the same day.
- Empty array for a day = closed.

Validation errors throw `ValidationError` with a descriptive message.

### 6. Admin tRPC procedures for space CRUD

Add to `spacesRouter`:
- `spaces.create` (admin) — input `{ name, description, openHours }` → `SpaceCreator.run()`.
- `spaces.update` (admin) — input `{ slug, name?, description?, openHours? }` → `SpaceUpdater.run()`.
- `spaces.delete` (admin) — input `{ slug }` → `SpaceDeleter.run()`.

All three use `adminProcedure` (existing middleware checks `x-admin-key`).

### 7. Webapp admin routes for space management

**`/admin/spaces`** (new route):
- Fetches `spaces.list` (reuse existing public procedure).
- Renders a table: name, slug, description (truncated), actions (Edit, Delete).
- "Create space" button opens an inline form or navigates to `/admin/spaces/new`.
- Delete button shows a confirm dialog, then calls `spaces.delete`.

**`/admin/spaces/new`** (new route):
- Form: name (required), description (optional), open hours editor.
- Open hours default to 24/7 (all days `[{ start: "00:00", end: "24:00" }]`).
- Submit calls `spaces.create`, on success navigates to `/admin/spaces`.

**`/admin/spaces/$slug/edit`** (new route):
- Fetches space via `spaces.dayView` (reuse, or add a `spaces.get` procedure).
- Pre-fills form with current values; slug shown as read-only.
- Submit calls `spaces.update`, on success navigates to `/admin/spaces`.

**`OpenHoursEditor` component**:
- 7 sections (Mon–Sun), each collapsible or tabbed.
- Per day: list of windows, each with start/end time inputs and a remove button.
- "Add window" button per day.
- "Open 24h" checkbox per day — toggles between `[{ 00:00, 24:00 }]` and empty.
- Inline validation: overlaps, invalid times.

### 8. Remove seed inserts, keep schema

Delete the `chill-house` and `call-room` inserts from `packages/database/src/seed.ts`. The `Space` and `Booking` tables remain; the app starts with zero spaces. Admins create spaces via the UI.

The Prisma schema already has `onDelete: Cascade` on `Booking.spaceId`, so deleting a space cascades bookings automatically.

### 9. Nav branding in __root.tsx

Update `__root.tsx`:
1. Fetch `config.siteInfo` via `useQuery` with `staleTime: Infinity`.
2. Render: `{logoUrl && <img src={logoUrl} alt="" />} <span>{name}</span>`.
3. Wrap in `<Link to="/">` so clicking navigates home.
4. Fallback while loading: show nothing or a skeleton (avoid layout shift).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Slug collision after 100 retries** | Throw `SpaceSlugCollisionError`; admin picks a different name. Unlikely in practice (100 variants of "Sala S"). |
| **Hard delete loses booking history** | Accepted — admin is trusted. If audit is needed later, add soft delete in a follow-up change. |
| **Broken logo URL shows broken image** | Accepted — no server-side fetch. Admin can test the URL before saving. |
| **Open hours editor is complex UI** | Keep it simple: no drag-and-drop, just time inputs. Validate on blur and on submit. |
| **Editing open hours doesn't affect existing bookings** | Accepted — bookings are historical. New bookings respect new hours. Document this in the UI. |
| **Slug immutability frustrates admins** | Document clearly: "Slug cannot be changed. To rename, delete and recreate." Bookings are lost on delete anyway. |
| **Empty initial state confuses new admins** | Show a friendly empty state: "No spaces yet. Create your first space to get started." |

## Migration Plan

1. Land domain + application changes (Space.create, services) behind no new routes — existing read-only flow unchanged.
2. Land tRPC procedures (`spaces.create`, `spaces.update`, `spaces.delete`, `config.siteInfo`).
3. Land webapp routes (`/admin/spaces`, `/admin/spaces/new`, `/admin/spaces/$slug/edit`) and `OpenHoursEditor`.
4. Update `__root.tsx` to fetch and render site branding.
5. Remove seed inserts from `seed.ts`.
6. Deploy with `SITE_NAME` and `SITE_LOGO_URL` set (or defaults).

Rollback: revert code, re-add seed inserts. Spaces created via UI remain in DB but are harmless.

## Open Questions

- **Should `spaces.list` be admin-only after this change?** Current: public. Recommendation: keep public — the homepage needs it. Admin-only would break the public booking flow.
- **Should we add a `spaces.get` procedure for fetching a single space by slug?** Current: `dayView` returns space + bookings. Recommendation: reuse `dayView` for the edit form; it's one extra field (bookings) that the form ignores.
