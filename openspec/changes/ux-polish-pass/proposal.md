# Proposal: UX Polish Pass (Phase 4 of 4)

## Why

Phases 1, 2, and 3 of the webapp UX redesign have delivered functional improvements:
- Phase 1: Home with quick-book cards
- Phase 2: Visual timeline on space detail pages
- Phase 3: Cross-space availability search

These phases focused on **functionality** — the flows work, but the experience lacks polish. Users encounter:
- Hard state transitions (no animations)
- Blank screens during loading (no skeletons)
- Technical error messages ("Conflict: booking overlaps existing booking")
- No onboarding hint for the name-only identification pattern
- Inconsistent touch feedback on mobile
- Missing accessibility labels

**This is phase 4 of 4** — the polish layer. The goal is to take the experience from "functional" to "delightful" without changing any behavior. This phase addresses:
- Smooth animations and transitions
- Loading skeletons matching final content geometry
- Human-friendly error messages in all 3 locales (en, es, gl)
- Contextual onboarding hint for first-time users
- Tactile micro-interactions (button press, card tap)
- Accessibility audit (aria-labels, focus, screen reader)
- Theme consistency (dark mode pass, token audit)

## What Changes

### Frontend — Polish Layer (`apps/webapp`)

**Animations & Transitions**:
- Card press: `active:scale-95` for tactile feedback
- Status changes: 200ms fade transition when booking is created/cancelled
- Timeline now-indicator: gentle 2s pulse animation (low opacity range)
- Bottom sheet entrance: verify and tune shadcn `<Sheet>` spring animation
- Toast slide-in: smooth easing via sonner config

**Skeletons & Loading States**:
- Home page: 3 card-shaped skeletons matching final card height (avoid layout shift)
- Detail page: timeline skeleton with grey blocks at typical hours + now-indicator placeholder
- Quick-book sheet: button shows spinner + "Reservando..." during mutation
- Cross-space search: skeleton list of 3 items while query is loading
- All skeletons use `animate-pulse` and match content geometry within ±10%

**Error Handling & Tone**:
- Rewrite all error toasts to be human-friendly in Spanish, English, Galician
- Examples:
  - Technical: "Conflict: booking overlaps existing booking" → Human: "Esa franja se acaba de ocupar. Prueba con otra hora."
  - Technical: "Failed to fetch" → Human: "No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo."
- Add `lib/error-message.ts` helper that maps tRPC error codes to localized messages
- Inline errors for form validation, toasts for system/server errors
- Empty states with friendly tone and actionable next step

**Toasts**:
- Tune sonner position: top-center on mobile, top-right on desktop
- Success toast: include space name + time, e.g., "Sala Reuniones reservada · 14:30 – 15:30" (auto-dismiss 4s)
- Error toasts: 6s duration (more time to read)
- Cancel toast: include space name + time

**Onboarding Hint**:
- First time user opens quick-book sheet AND no `bookerName` in localStorage → show dismissible hint above name input
- Message: "Recuerda este nombre — lo necesitarás si quieres cancelar."
- Dismissal persisted in localStorage (`onboarding-name-shown`)
- Not shown when name is already stored

**Micro-interactions**:
- Quick book buttons (30min/1h/2h): brief background flash (150ms) on press
- Timeline tap on free slot: subtle background highlight before sheet opens
- Card status icon: use Lucide `Circle` filled with status color from CSS variables
- Confirm dialogs for destructive actions: `variant="destructive"` on primary button
- All interactive elements: `min-height: 44px` and `min-width: 44px` (touch target standard)

**Theme & Visual Consistency**:
- Dark mode pass: verify all new components work correctly in dark mode (check contrast on space color cards)
- Theme tokens audit: replace any hardcoded colors with Tailwind theme tokens
- Typography pass: ensure consistent font sizes (Tailwind's default scale, no arbitrary values)
- Spacing pass: consistent rhythm (multiples of 4px / Tailwind spacing scale)

**Accessibility**:
- All icon-only interactive elements have `aria-label`
- Color is not the only indicator (status icons accompany color changes)
- Focus visible on keyboard navigation
- Bottom sheets trap focus while open
- Screen reader announces toast content (verify sonner supports this)

### New Files

- `apps/webapp/src/lib/error-message.ts` — helper for error → human message mapping
- `apps/webapp/src/components/onboarding-name-hint.tsx` — dismissible hint component
- `apps/webapp/src/lib/onboarding-storage.ts` — localStorage helpers for hint dismissal
- `apps/webapp/src/components/ui/skeleton.tsx` — verify exists, install via shadcn if missing

### Modified Files

All new components from phases 1-3 receive polish:
- `apps/webapp/src/features/spaces/space-card.tsx` — add press animation, skeleton
- `apps/webapp/src/features/spaces/quick-book-sheet.tsx` — add onboarding hint, loading state
- `apps/webapp/src/features/spaces/day-timeline.tsx` — add skeleton, now-indicator pulse
- `apps/webapp/src/features/spaces/availability-finder.tsx` — add skeleton
- `apps/webapp/src/locales/{en,es,gl}/*.json` — many new keys for friendly messages

### Bounded Context

This change belongs to the **`webapp`** frontend application (`apps/webapp`). No backend changes.

## Non-goals

- No functional changes — pure presentation layer
- No new tRPC procedures
- No backend changes
- No new admin features
- No mobile app changes (`apps/mobile`)
- No PWA changes
- "Undo cancel" toast action is deferred as optional (can be a separate small change later)
- Page transition animations (TanStack Router default — keep as-is, animation framework would be overkill)
- No changes to shared packages (`packages/ui`, `packages/common`) — this is a frontend-only polish layer

## Capabilities

### New Capabilities

1. **`ux-polish`** — Polish layer covering animations, loading states, error tone, toasts, onboarding hint, micro-interactions, and accessibility

### Modified Capabilities

None. This change introduces a new capability without modifying existing ones. The polish layer enhances the presentation of capabilities from phases 1-3 but does not change their behavior.

## Impact

### Affected Packages

None. This is a frontend-only change.

### Affected Apps

- **`apps/webapp`**:
  - `src/lib/error-message.ts` — NEW
  - `src/lib/onboarding-storage.ts` — NEW
  - `src/components/onboarding-name-hint.tsx` — NEW
  - `src/components/ui/skeleton.tsx` — verify exists, install if missing
  - `src/features/spaces/space-card.tsx` — MODIFIED (animations, skeleton)
  - `src/features/spaces/quick-book-sheet.tsx` — MODIFIED (onboarding hint, loading state)
  - `src/features/spaces/day-timeline.tsx` — MODIFIED (skeleton, pulse animation)
  - `src/features/spaces/availability-finder.tsx` — MODIFIED (skeleton)
  - `src/locales/{en,es,gl}/common.json` — MODIFIED (error messages)
  - `src/locales/{en,es,gl}/spaces.json` — MODIFIED (empty states)
  - `src/locales/{en,es,gl}/booking.json` — MODIFIED (onboarding hint, loading states)
  - Possibly `tailwind.config.ts` — if custom keyframe animations are needed

### Files Created

- `openspec/changes/ux-polish-pass/.openspec.yaml`
- `openspec/changes/ux-polish-pass/proposal.md`
- `openspec/changes/ux-polish-pass/design.md`
- `openspec/changes/ux-polish-pass/tasks.md`
- `openspec/changes/ux-polish-pass/specs/ux-polish/spec.md`

### Deployment Notes

- No database schema changes
- No environment variable changes
- No API changes
- No breaking changes
- Backward compatible — this is a frontend-only polish layer

### Dependencies

This change **depends on phases 1, 2, and 3 being deployed**:
- Phase 1: `redesign-home-quick-book` (home cards + quick-book sheet)
- Phase 2: `redesign-space-detail-timeline` (visual timeline on detail page)
- Phase 3: `cross-space-availability` (cross-space search for "later today")

Without these phases, the polish layer has nothing to polish.
