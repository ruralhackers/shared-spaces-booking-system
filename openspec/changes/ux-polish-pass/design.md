# Design: UX Polish Pass

## Context

Phases 1, 2, and 3 of the webapp UX redesign have delivered functional improvements:
- **Phase 1** (`redesign-home-quick-book`): Home page with 3 large cards showing live status + quick-book bottom sheet for 30min/1h/2h durations
- **Phase 2** (`redesign-space-detail-timeline`): Visual timeline on `/spaces/:slug` (Google Calendar day view style)
- **Phase 3** (`cross-space-availability`): "Book for later" entry point with cross-space results

These phases focused on **functionality** — the flows work, but the experience lacks polish. Users encounter:
- Hard state transitions (no animations)
- Blank screens during loading (no skeletons)
- Technical error messages ("Conflict: booking overlaps existing booking")
- No onboarding hint for the name-only identification pattern
- Inconsistent touch feedback on mobile
- Missing accessibility labels

**This is phase 4 of 4** — the polish layer. The goal is to take the experience from "functional" to "delightful" without changing any behavior.

### Existing Infrastructure

- **Frontend**: Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4
- **Toasts**: sonner is already installed (verify config)
- **Animations**: Tailwind v4 supports `@keyframes` and `animate-*` utilities
- **Skeletons**: shadcn `<Skeleton>` component may not be installed yet (check and install if missing)
- **Locale**: `apps/webapp/src/locales/{en,es,gl}/*.json` — i18n infrastructure exists
- **Storage**: `readStoredBookerName()` and `writeStoredBookerName()` exist in `apps/webapp/src/features/spaces/booker-name-storage.ts`

### Real Constraints

- Only **3 spaces** in this deployment
- **1-2 active bookings** per user typical
- Typical booking duration: **1 hour**
- Identification by name only (no auth, no PIN)
- 80% use case: "I want to book a space NOW or LATER TODAY"

## Goals / Non-Goals

### Goals

- Smooth animations and transitions (card press, sheet entrance, status changes, now-indicator pulse)
- Loading skeletons matching final content geometry (home, detail, cross-space)
- Human-friendly error messages in all 3 locales (en, es, gl)
- Contextual onboarding hint for first-time users (dismissible, persisted)
- Tactile micro-interactions (button press, timeline tap, status icon)
- Accessibility audit (aria-labels, focus, screen reader, touch targets)
- Theme consistency (dark mode pass, token audit, typography, spacing)

### Non-Goals

- No functional changes — pure presentation layer
- No new tRPC procedures
- No backend changes
- No new admin features
- No mobile app changes
- No PWA changes
- "Undo cancel" toast action is deferred as optional
- Page transition animations (TanStack Router default — keep as-is)

## Decisions

### Decision 1: Use Tailwind keyframes + CSS for animations (no framer-motion)

**Decision**: Implement animations using Tailwind's built-in `animate-*` utilities and custom `@keyframes` in `tailwind.config.ts` or inline CSS. Do NOT add framer-motion or any animation library.

**Rationale**:
- Keeps bundle size small — framer-motion adds ~50KB gzipped
- Tailwind v4 supports custom keyframes and CSS variables for animation timing
- The animations needed are simple (scale, fade, pulse) — no complex gestures or physics
- Aligns with existing Tailwind-first approach

**Alternatives considered**:
- **framer-motion**: Powerful but overkill for simple transitions. Rejected due to bundle size.
- **react-spring**: Similar to framer-motion. Rejected for the same reason.

### Decision 2: Sonner config — top-center on mobile, top-right on desktop

**Decision**: Configure sonner with `position="top-center"` on mobile (viewport width < 768px) and `position="top-right"` on desktop. Success toasts auto-dismiss in 4s, error toasts in 6s.

**Rationale**:
- Top-center on mobile avoids blocking the bottom sheet (which slides from bottom)
- Top-right on desktop is standard for non-blocking notifications
- 4s for success is enough to read space name + time
- 6s for errors gives more time to read and act

**Alternatives considered**:
- **Bottom-center on mobile**: Would conflict with bottom sheets. Rejected.
- **Same position for all devices**: Less optimal UX. Rejected.

### Decision 3: Error message mapping table in `lib/error-message.ts`

**Decision**: Create a helper `getErrorMessage(error: TRPCClientError, locale: string): string` that maps domain error codes to human-friendly messages. The mapping table is a TypeScript object with keys like `ConflictError`, `OutsideOpenHoursError`, `NotFoundError`, and values are i18n keys.

**Rationale**:
- Centralizes error message logic — no duplication across components
- Type-safe — TypeScript ensures all error codes are handled
- Testable — unit tests can verify the mapping
- Aligns with existing i18n pattern (keys in `locales/*/common.json`)

**Alternatives considered**:
- **Inline error messages in components**: Would duplicate logic. Rejected.
- **Backend returns localized messages**: Would couple backend to frontend locales. Rejected.

### Decision 4: Onboarding hint placement — contextual, above name input in quick-book sheet

**Decision**: Show the onboarding hint as a small note above the name input in the quick-book sheet, only when:
1. User opens the quick-book sheet for the first time (no `onboarding-name-shown` in localStorage)
2. AND no `bookerName` in localStorage

The hint is dismissible (X button) and dismissal is persisted in localStorage.

**Rationale**:
- Contextual — appears exactly when relevant (user is about to enter their name)
- Non-intrusive — does not block the UI or require a modal
- Dismissible — user can close it if they already understand
- Persistent dismissal — does not annoy returning users

**Alternatives considered**:
- **Persistent banner at top**: Would take up space on every page. Rejected.
- **Tooltip on name input**: Would require hover (not mobile-friendly). Rejected.
- **Modal on first visit**: Too intrusive for a simple hint. Rejected.

### Decision 5: Defer "undo cancel" toast action to a separate change

**Decision**: The cancel booking toast will show space name + time but will NOT include an "Undo" action button in this phase. This feature is flagged as optional and can be implemented in a separate small change later.

**Rationale**:
- Undo requires holding the cancelled booking data on the client for 6s and re-issuing the booking on undo
- This adds complexity (state management, race conditions if user navigates away)
- The core polish layer (animations, skeletons, error tone) is more valuable
- Undo is a nice-to-have, not a must-have

**Alternatives considered**:
- **Include undo in this phase**: Would delay the polish layer. Rejected.

### Decision 6: Skeleton geometry matches final content within ±10%

**Decision**: All skeletons (home cards, timeline, cross-space results) must match the final content geometry within ±10% to avoid layout shift. Use `animate-pulse` (Tailwind built-in) for the shimmer effect.

**Rationale**:
- Avoids Cumulative Layout Shift (CLS) — a Core Web Vital metric
- Provides visual continuity — user sees the structure before content loads
- `animate-pulse` is built-in and performant

**Alternatives considered**:
- **Generic spinner**: Does not show structure. Rejected.
- **Exact geometry match**: Too brittle (content height varies). Rejected.

### Decision 7: Dark mode pass — verify contrast on space color cards

**Decision**: Audit all new components from phases 1-3 in dark mode. Specifically, check that text on space color cards (which use `background-color: var(--space-color)`) meets WCAG AA contrast (4.5:1 for normal text). If not, add a semi-transparent overlay or border.

**Rationale**:
- Space colors are user-configurable — some may be light (e.g., yellow, cyan)
- White text on light background fails WCAG in dark mode
- Overlay or border ensures readability without changing the color

**Alternatives considered**:
- **Force dark space colors**: Would limit user choice. Rejected.
- **Ignore contrast**: Would fail accessibility. Rejected.

### Decision 8: All interactive elements have 44×44px minimum touch target

**Decision**: Audit all interactive elements (buttons, links, icons) and ensure they have `min-height: 44px` and `min-width: 44px` (or equivalent padding). This applies to quick-book buttons, timeline slots, card tap areas, and icon buttons.

**Rationale**:
- Apple HIG and Material Design both recommend 44×44px minimum touch target
- Prevents mis-taps on mobile
- Improves accessibility for users with motor impairments

**Alternatives considered**:
- **Smaller touch targets**: Would hurt mobile UX. Rejected.

### Decision 9: Status icon uses Lucide `Circle` filled with CSS variable color

**Decision**: Replace any hardcoded status icons (🟢/🔴/⚫) with Lucide `Circle` component filled with `fill="var(--status-color)"` where `--status-color` is set via inline style based on status (`free` → primary, `occupied` → destructive, `closed` → muted-foreground).

**Rationale**:
- Consistent rendering across platforms (emoji rendering varies)
- Respects theme tokens (colors come from Tailwind theme)
- Accessible — can add `aria-label` to the icon
- Uses `--primary` for "free" status instead of a non-existent `--success` token (project tokens do not include a success color; primary serves as the positive indicator)

**Alternatives considered**:
- **Keep emoji**: Inconsistent rendering. Rejected.
- **Custom SVG**: More work than using Lucide. Rejected.
- **Add --success token**: Would require modifying `packages/ui/tokens.ts` and violate the "frontend-only" constraint of this phase. Rejected.

### Decision 10: Focus trap in bottom sheets

**Decision**: Verify that shadcn `<Sheet>` traps focus while open (user cannot tab outside the sheet). If not, add `react-focus-lock` or similar.

**Rationale**:
- Accessibility requirement — keyboard users should not tab outside the modal
- Aligns with ARIA Authoring Practices for dialogs

**Alternatives considered**:
- **No focus trap**: Would fail accessibility. Rejected.

## Risks / Trade-offs

### Risk 1: Animations may feel sluggish on low-end devices

**Mitigation**: Use short durations (150ms for press, 200ms for fade) and `prefers-reduced-motion` media query to disable animations for users who prefer reduced motion.

**Trade-off**: Slightly more CSS complexity in exchange for better UX on modern devices.

### Risk 2: Skeletons may not match final content geometry perfectly

**Mitigation**: Test skeletons with real data and adjust heights/widths. Accept ±10% variance as acceptable.

**Trade-off**: Some layout shift is unavoidable, but skeletons reduce it significantly.

### Risk 3: Error message mapping may miss some error codes

**Mitigation**: Add a fallback message for unmapped errors ("Algo salió mal. Inténtalo de nuevo."). Log unmapped errors to console in dev mode.

**Trade-off**: Generic fallback is less helpful, but prevents blank error toasts.

### Risk 4: Onboarding hint may be dismissed too quickly

**Mitigation**: Make the hint visually distinct (border, background color) and include a clear message. Track dismissal rate in analytics (if available).

**Trade-off**: Some users may dismiss without reading, but persistent hints are more annoying.

### Risk 5: Dark mode contrast issues on space color cards

**Mitigation**: Add a semi-transparent overlay (`bg-black/20`) on space color cards in dark mode if contrast fails. Test with all space colors in production.

**Trade-off**: Overlay slightly darkens the color, but ensures readability.

## Migration Plan

### Phase 4 (this change)

1. Install shadcn `<Skeleton>` component if missing (`bunx shadcn@latest add skeleton`)
2. Create `lib/error-message.ts` helper with mapping table (TDD)
3. Create `lib/onboarding-storage.ts` localStorage helpers (TDD)
4. Create `<OnboardingNameHint>` component (TDD)
5. Add skeletons to home page (visual, no TDD)
6. Add skeletons to detail page (visual, no TDD)
7. Add skeletons to cross-space results (visual, no TDD)
8. Add animations: card press, sheet entrance, now-indicator pulse, button highlights (visual, no TDD)
9. Tune sonner config: position, duration, success/error templates per locale
10. Rewrite error toasts in all mutations to use `error-message.ts`
11. Add empty states with friendly tone (across phases)
12. Add locale keys for all new messages (3 locales: en, es, gl)
13. Theme audit: scan new components for hardcoded colors, replace with tokens
14. Accessibility audit: aria-labels, focus, screen reader, touch targets
15. Validation + commit

### Post-Phase 4 (optional)

- "Undo cancel" toast action (separate small change)
- Polling for live status updates (if needed)
- Advanced animations (if requested)

## Open Questions

1. **Should we add a "Refresh" button to manually update status?**
   - **Proposed**: No, rely on automatic invalidation after booking. Phase 4 can add polling if needed.
   - **Decision needed**: Confirm with product owner.

2. **Should we show a loading skeleton for the quick-book sheet?**
   - **Proposed**: No, the sheet opens instantly (no async data). Only the "Confirmar reserva" button shows a spinner during mutation.
   - **Decision needed**: Confirm with product owner.

3. **Should we add a "Loading..." message while skeletons are visible?**
   - **Proposed**: No, skeletons are self-explanatory. Adding text would clutter the UI.
   - **Decision needed**: Confirm with product owner.

4. **Should we animate the transition between "free" and "occupied" status on cards?**
   - **Proposed**: Yes, use a 200ms fade transition. This is subtle and does not distract.
   - **Decision needed**: Confirm with product owner.

5. **Should we add a "pulse" animation to the quick-book buttons when a space is free?**
   - **Proposed**: No, pulsing buttons are distracting. Reserve pulse for the now-indicator only.
   - **Decision needed**: Confirm with product owner.

6. **Should we add a "success" sound when a booking is created?**
   - **Proposed**: No, sound is intrusive in a shared space. Visual feedback (toast + card update) is sufficient.
   - **Decision needed**: Confirm with product owner.

7. **Should we add a "haptic feedback" vibration on mobile when a booking is created?**
   - **Proposed**: Optional — can be added in a separate change if requested. Not critical for phase 4.
   - **Decision needed**: Confirm with product owner.

8. **Should we add a "dark mode toggle" in the UI?**
   - **Proposed**: No, dark mode is already controlled by OS preference. Adding a toggle is out of scope for phase 4.
   - **Decision needed**: Confirm with product owner.
