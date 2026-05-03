## Context

`Space` entity has: id, slug, displayName, description, openHours. No visual attributes. Admin creates/edits spaces via forms in `apps/webapp`. The Prisma schema uses PostgreSQL. The `SpaceDto` flows from domain → application → tRPC → frontend.

## Goals / Non-Goals

**Goals:**

- Add `color: string | null` through the full stack (DB → domain → application → API → frontend).
- Provide a usable color picker in admin forms.
- Show color as a visual accent in public views.

**Non-Goals:**

- Domain validation of color format.
- Value Object for color.
- Mobile app support.

## Decisions

### 1. `color` as plain `string | null` in domain, not a Value Object

- **Rationale**: It's a presentation hint, not a business invariant. No behavior depends on it. A VO would add ceremony with no benefit.
- **Alternative rejected**: `SpaceColor` VO with hex validation — YAGNI.

### 2. 16 preset colors from Tailwind palette (500 shade)

- Colors: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, violet, purple, fuchsia, pink, rose.
- Stored as hex strings: `#ef4444`, `#f97316`, `#f59e0b`, `#eab308`, `#84cc16`, `#22c55e`, `#10b981`, `#14b8a6`, `#06b6d4`, `#0ea5e9`, `#3b82f6`, `#8b5cf6`, `#a855f7`, `#d946ef`, `#ec4899`, `#f43f5e`.
- **Rationale**: Consistent with the design system, visually balanced.

### 3. Free-form hex input alongside the grid

- **Rationale**: Power users may want brand-specific colors. The grid covers 90% of cases.

### 4. `ColorPicker` as a feature component, not in `components/ui/`

- Location: `apps/webapp/src/features/spaces/color-picker.tsx`
- **Rationale**: It's domain-specific (space color), not a generic UI primitive.

### 5. Visual display: colored left border on space cards, dot on detail

- In the spaces list: `border-l-4` with `style={{ borderLeftColor: space.color }}`.
- In the space detail: colored dot next to the space name.
- **Rationale**: Subtle, doesn't clash with existing UI. Falls back gracefully when `color` is null.

### 6. DB migration: nullable column, no backfill

- `color String?` in Prisma schema. Existing spaces get `null`. Run `bun run -F @dfs/database db:sync`.

## Risks / Trade-offs

- **User picks low-contrast color** → No mitigation needed; it's their choice.
- **Free-form input allows invalid values** → Frontend validates hex format before sending; backend accepts any string (no domain validation per decision #1).
