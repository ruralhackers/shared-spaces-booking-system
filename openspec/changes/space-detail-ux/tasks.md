## 1. Sticky Bar Enhancements

- [x] 1.1 Add space name with color dot to sticky bar (center slot)
- [x] 1.2 Add Advanced Booking button to sticky bar (right slot) and remove old centered button below timeline
- [x] 1.3 Remove h1 name block from scrollable content; add description subtitle; move Today button to date nav row

## 2. Timeline Inner Scroll Removal

- [x] 2.1 Remove overflow-y-auto and max-h-[600px] from timeline wrapper div

## 3. Slot Tap Opens AdvancedBookingSheet

- [x] 3.1 Add optional defaultStart/defaultEnd (HH:MM) props to AdvancedBookingSheet; reset times on open via useEffect
- [x] 3.2 Update handleSlotTap to open advancedOpen with pre-filled times; pass defaults to AdvancedBookingSheet; fix bookMutation.onSuccess
- [x] 3.3 Remove QuickBookSheet import, state, and JSX from spaces.$slug.tsx

## 4. Validation & Deploy

- [x] 4.1 Run bun run lint:fix && bun run typecheck && bun test — all must pass
- [ ] 4.2 Commit, push and deploy to production
