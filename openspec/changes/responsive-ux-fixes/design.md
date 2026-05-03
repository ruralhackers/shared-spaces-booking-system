## Context

The webapp (`apps/webapp`) went through a first responsive pass that fixed layout overflow on mobile (date navigation stacking, booking row stacking, padding adjustments). A subsequent UX audit identified remaining issues: undersized touch targets, missing confirmation dialogs for destructive actions, a silent admin redirect, an inaccessible custom modal, and minor polish gaps. All changes are presentation-layer only — no domain or API changes.

## Goals / Non-Goals

**Goals:**
- All interactive elements meet the 44×44px minimum touch target guideline on mobile.
- Destructive actions (booking cancellation) require explicit confirmation before executing.
- Invalid admin key shows clear feedback instead of a silent redirect.
- The delete-space dialog is accessible (focus trap, Escape key, `aria-modal`).
- Past bookings are visually dimmed for better scannability.
- "Set to now" shortcut in the booking form is more discoverable.

**Non-Goals:**
- No layout redesign, container width changes, or new pages.
- No backend/API changes.
- No mobile app (`apps/mobile`) changes.

## Decisions

### D1: Use shadcn/ui AlertDialog for all confirmation dialogs

**Choice:** Replace the custom `DeleteDialog` in `admin.spaces.index.tsx` with shadcn/ui's `AlertDialog` (built on `@radix-ui/react-alert-dialog`). Use the same component for the new cancel-booking confirmation.

**Why over custom modal:** Radix provides focus trap, Escape key, `aria-modal`, scroll lock, and portal rendering out of the box. The project already uses shadcn/ui primitives — this is consistent.

**Alternative considered:** Adding `onKeyDown` + focus trap manually to the existing custom modal. Rejected because it's more code to maintain and shadcn/ui already solves this.

### D2: Touch targets via padding, not element resizing

**Choice:** Increase tap areas by adding padding/min-height to the clickable element rather than making the visual element larger. For example, the theme toggle stays visually compact but gets `min-h-[44px] min-w-[44px]` on the button wrapper.

**Why:** Preserves the current visual density on desktop while meeting mobile accessibility guidelines.

### D3: Past booking detection via client-side time comparison

**Choice:** Compare `booking.endsAt` against `new Date()` on the client to determine if a booking is in the past, then apply `opacity-50` styling.

**Why:** No API change needed. The `endsAt` field is already an ISO string. The visual dimming is purely presentational — it doesn't affect any behavior.

### D4: Admin key feedback via toast + redirect

**Choice:** When `?key` is missing or invalid, redirect to `/` and show a toast notification ("Admin access denied — invalid key"). Use `sonner` which is already in the project.

**Why over a dedicated login page:** The app uses shared-secret URL auth, not a login form. A toast on redirect is proportional to the auth model. A full login page would over-engineer the current auth approach.

## Risks / Trade-offs

- **[Risk] AlertDialog adds a new shadcn/ui component** → Low risk; it's a standard shadcn primitive with no extra dependencies beyond what Radix already provides.
- **[Risk] Past-booking detection uses client clock** → If the user's clock is wrong, bookings may appear incorrectly dimmed. Acceptable for a visual hint — it doesn't affect functionality.
- **[Trade-off] Cancel confirmation adds one extra click** → Intentional friction for a destructive action. The confirmation dialog clearly states what will happen.
