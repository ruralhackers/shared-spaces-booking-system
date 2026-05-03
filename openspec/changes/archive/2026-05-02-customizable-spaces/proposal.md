## Why

The current system has two hardcoded spaces (`chill-house`, `call-room`) seeded via migration, and the site name "Shared Spaces" is baked into the UI. A creative hub wants to deploy this for their own rooms (Sala S, Sala M, Sala L) with their own branding. We need per-deployment branding and admin-managed space CRUD so operators can configure the system without code changes.

## What Changes

- Add `SITE_NAME` and `SITE_LOGO_URL` environment variables for per-deployment branding; render in the nav header.
- Add admin-only space management: create, edit, and delete spaces through the UI.
- Space creation accepts name, description, and open hours; slug is auto-generated server-side from the name.
- Space editing allows changing name, description, and open hours; slug remains immutable.
- Space deletion is a hard delete that cascades to all bookings for that space.
- Add an open hours editor component for configuring per-day time windows.
- Remove the seed migration inserts for `chill-house` and `call-room`; spaces start empty and are created by the admin.

## Capabilities

### New Capabilities

- `site-branding`: Per-deployment site name and logo URL via environment variables, exposed to the webapp and rendered in the navigation header.
- `space-crud`: Admin-only create, edit, and delete operations for spaces, including slug auto-generation, open hours configuration, and hard delete with booking cascade.

### Modified Capabilities

- `space-management`: The existing read-only space catalog becomes writable by admins. The seed-based fixed catalog is removed; spaces are now dynamic.

## Impact

- **`packages/common`**: Add slug generation utility (kebab-case, collision suffix).
- **`packages/spaces/domain`**: Add `Space.create()` factory, `space.updateDetails()` method, new errors (`SpaceSlugCollisionError`).
- **`packages/spaces/application`**: Add `SpaceCreator`, `SpaceUpdater`, `SpaceDeleter` services.
- **`packages/spaces/infrastructure`**: Extend `SpaceRepository` with `save()`, `delete()`, `slugExists()` methods; update Prisma and InMemory adapters.
- **`packages/api`**: Add `spaces.create`, `spaces.update`, `spaces.delete` admin procedures; add `config.siteInfo` public procedure.
- **`packages/database`**: Remove space seed inserts from `seed.ts`; keep schema unchanged (already supports all fields).
- **`apps/api`**: Add `SITE_NAME` and `SITE_LOGO_URL` to env schema; wire into tRPC context.
- **`apps/webapp`**: Update `__root.tsx` to fetch and render site branding; add `/admin/spaces` route with list, create form, and delete; add `/admin/spaces/$slug/edit` route; add `OpenHoursEditor` component.

## Non-goals

- Soft delete / archive spaces (hard delete only).
- Slug editing after creation (immutable).
- Space reordering or display order customization.
- Per-space permissions (all admins can manage all spaces).
- Logo upload (URL only; external hosting assumed).
- Theme colors or other visual customization beyond name and logo.
