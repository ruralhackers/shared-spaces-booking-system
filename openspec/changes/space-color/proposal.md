## Why

Spaces have no visual identity — in the list and detail views they all look the same. Adding an optional color per space lets admins brand each room, making the UI scannable at a glance (especially on mobile where space is limited).

## What Changes

- Add an optional `color` field (`string | null`) to the `Space` entity, DTO, and Prisma schema.
- Accept `color` in the create and update API endpoints.
- New `ColorPicker` component in the admin forms (create + edit space) showing a 4×4 grid of 16 preset colors plus a free-form hex input.
- Display the space color as a visual accent in the spaces list and space detail page.

## Non-goals

- No color validation in the domain (it's a presentation attribute, any string is fine).
- No color on bookings — only on spaces.
- No mobile app changes.

## Capabilities

### New Capabilities

- `space-color`: Optional color attribute on spaces with admin picker UI and visual display.

### Modified Capabilities

- `space-crud`: The create/update flows gain a `color` field.

## Impact

- `packages/database/prisma/schema.prisma` — new nullable `color` column on `Space`
- `packages/spaces/domain/space.entity.ts` — `color` in `SpaceDto`, `CreateSpaceParams`, `UpdateSpaceDetailsParams`
- `packages/spaces/application/` — `CreateSpaceInput`, `UpdateSpaceInput` gain `color`
- `packages/api/infrastructure/routers/spaces.router.ts` — `color` in zod schemas
- `apps/webapp/` — new `ColorPicker` component, admin forms, visual display in list/detail
