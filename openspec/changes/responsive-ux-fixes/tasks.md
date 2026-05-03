## 1. Add shadcn/ui AlertDialog component

- [x] 1.1 Add the AlertDialog component to `apps/webapp/src/components/ui/alert-dialog.tsx` via shadcn CLI or manual copy from shadcn/ui registry

## 2. Touch targets

- [x] 2.1 Increase theme toggle tap area to 44×44px in `__root.tsx` (`min-h-[44px] min-w-[44px]`)
- [x] 2.2 Increase "All spaces" back link tap area in `spaces.$slug.tsx` (add `py-2` padding)
- [x] 2.3 Increase open-hours "Open 24h" checkbox + label tap area in `open-hours-editor.tsx` (min-height 44px on the label wrapper)
- [x] 2.4 Increase open-hours time input height to `h-9` in `open-hours-editor.tsx`

## 3. Cancel-booking confirmation dialog

- [x] 3.1 RED: Write test for cancel-booking confirmation on space page — clicking Cancel opens a dialog, confirming executes mutation
- [x] 3.2 GREEN: Add cancel confirmation AlertDialog to `spaces.$slug.tsx` — store pending cancel ID in state, show dialog, confirm triggers mutation
- [x] 3.3 RED: Write test for cancel-booking confirmation on admin page — clicking Cancel opens a dialog
- [x] 3.4 GREEN: Add cancel confirmation AlertDialog to `admin.index.tsx`

## 4. Replace custom delete dialog with AlertDialog

- [x] 4.1 Replace `DeleteDialog` in `admin.spaces.index.tsx` with shadcn/ui AlertDialog (focus trap, Escape, aria-modal come for free)

## 5. Admin key feedback

- [x] 5.1 Update `admin.tsx` `beforeLoad` to show a toast ("Admin access denied") before redirecting when `?key` is missing

## 6. Past bookings visual dimming

- [x] 6.1 RED: Write test that past bookings render with reduced opacity class
- [x] 6.2 GREEN: In `spaces.$slug.tsx`, compare `booking.endsAt` to current time and apply `opacity-50` to past booking rows

## 7. "Set to now" button upgrade

- [x] 7.1 Convert "Set to now" from underlined text link to a ghost Button in `booking-form.tsx`

## 8. Validation and review

- [x] 8.1 Run `/task-validate` (lint:fix + typecheck + test)
- [ ] 8.2 Run `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, `/task-frontend-review` in parallel
- [ ] 8.3 Address any findings from reviews
- [ ] 8.4 Commit all changes with conventional commit: `fix(webapp): improve responsive UX and accessibility`
