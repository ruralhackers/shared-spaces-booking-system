# @dfs/ui

Platform-agnostic design assets shared between `apps/webapp` (Next.js + Tailwind) and `apps/mobile` (Expo + NativeWind).

## What lives here

- `src/tokens.ts` — single source of truth for design tokens (colors, radius, spacing, fonts).
- `src/tokens.tailwind.ts` / `src/tokens.tailwind.cjs` — helpers that transform `tokens.ts` into the shape Tailwind/NativeWind expect (`{ DEFAULT, foreground }`). The `.cjs` variant is consumed by `apps/mobile/tailwind.config.js` (Node require); the `.ts` variant by bundled consumers.
- `src/variants/*.variants.ts` (empty today) — shared CVA variants (strings of Tailwind classes). Only variants with **two real consumers** belong here (see "Rule of two" below).
- `src/lib/cn.ts` — `clsx + tailwind-merge` helper.
- `scripts/build-css-vars.ts` — generates `dist/tokens.css` for the webapp.

## What does NOT live here

- Component JSX (`Button`, `Input`, etc.). Each platform owns its own components:
  - Web: `apps/webapp/src/components/ui/*` (shadcn).
  - Mobile: `apps/mobile/components/ui/*` (React Native primitives).
- `react-native` / `nativewind` imports. This package is platform-neutral; pulling RN types into it caused TS duplication issues under Bun's isolated linker.

## Rule of two

A variants file (`*.variants.ts`) is promoted into `src/variants/` only when it has **two real consumers**. Until then, each app keeps its CVA inline. Reason: premature sharing forces portability constraints on class strings (no `has-[>svg]:`, no `focus-visible:` without a native fallback) that are expensive to revert later.

When promoting:

1. Move the `cva(...)` block into `packages/ui/src/variants/<name>.variants.ts`.
2. Add `"./variants/<name>": "./src/variants/<name>.variants.ts"` to the `exports` map in `package.json`.
3. Replace the inline `cva(...)` in both consumers with `import { xxxVariants } from '@dfs/ui/variants/<name>'`.
4. Audit the class string: any web-only selector that doesn't map to a NativeWind equivalent must either be removed or split into platform-specific variants.

## What should NOT be shared

Don't attempt to share: navigation primitives (Next `<Link>` vs `expo-router`), forms (field layouts diverge), images (`next/image` vs `expo-image`), modals/sheets (gesture semantics differ), anything that wraps Radix (web-only).
