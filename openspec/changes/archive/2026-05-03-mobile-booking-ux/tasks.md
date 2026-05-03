## 1. Language switcher border

- [ ] 1.1 Change `LanguageSwitcher` in `apps/webapp/src/components/language-switcher.tsx` from `variant="ghost"` to `variant="outline"`

## 2. Booking form default times

- [ ] 2.1 In `BookingForm` (`apps/webapp/src/features/spaces/booking-form.tsx`), initialise `startsAt` state with `currentHourString()` and `endsAt` state with `nextHourString()` instead of empty strings
- [ ] 2.2 Update `booking-form.test.tsx` to assert that start and end time inputs are pre-filled on render

## 3. Compact date heading

- [ ] 3.1 Rewrite `formatDateHeading` in `spaces.$slug.tsx` to return only the numeric day for today/tomorrow/yesterday, and a short "d MMM" format for other dates (remove weekday and full month+year text)
- [ ] 3.2 Update locale keys if any date-label translation keys become unused; keep `today`/`tomorrow`/`yesterday` keys in `common.json` (still used elsewhere)

## 4. "Today" button next to space name

- [ ] 4.1 Remove the "Today" `<Button>` from the date navigation row in `spaces.$slug.tsx`
- [ ] 4.2 Add the "Today" button inline with the `<h1>` space name, to its right, as a small `variant="ghost"` button

## 5. Sticky "Book" button in top bar

- [ ] 5.1 In `spaces.$slug.tsx`, wrap the "All spaces" back link and a new "Book" button in a flex row that acts as a sticky local header (below the global nav)
- [ ] 5.2 The "Book" button SHALL be `disabled` when `bookMutation.isPending`
- [ ] 5.3 Clicking "Book" SHALL scroll to the booking form section (use a `ref` on the `<section>` and `scrollIntoView`)
- [ ] 5.4 Add a `ref` to the booking form `<section>` to support the scroll target

## 6. Validation

- [ ] 6.1 Run `bun run lint:fix && bun run typecheck && bun test` from `apps/webapp/` and fix any issues
