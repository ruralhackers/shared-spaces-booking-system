# Tasks: Redesign Home with Quick Book

## 1. Domain — Status Computation Methods

### 1.1 RED: Test `Space.computeFreeUntil()` when no bookings today

- [ ] Write test in `packages/spaces/domain/space.entity.test.ts`:
  - **Arrange**: Create a space with open hours 09:00-18:00, no bookings, now = 10:00
  - **Act**: Call `space.computeFreeUntil([], now, tz)`
  - **Assert**: Returns today's close time (18:00)

### 1.2 GREEN: Implement `Space.computeFreeUntil()`

- [ ] Add method to `Space` entity:
  ```typescript
  computeFreeUntil(bookings: Booking[], now: Date, tz: string): Date | null
  ```
- [ ] Logic:
  - If space is closed now, return `null`
  - Find next booking that starts after `now` and is today
  - If no next booking, return today's close time
  - If next booking exists, return `min(nextBooking.startsAt, todayCloseTime)`
- [ ] Run test, confirm green

### 1.3 COMMIT: Domain status computation (free until)

- [ ] Commit with message: `feat(spaces): add Space.computeFreeUntil() for live status`

### 1.4 RED: Test `Space.computeFreeUntil()` when next booking exists

- [ ] Write test:
  - **Arrange**: Space open 09:00-18:00, booking 14:00-15:00, now = 10:00
  - **Act**: Call `space.computeFreeUntil([booking], now, tz)`
  - **Assert**: Returns 14:00 (next booking start)

### 1.5 GREEN: Extend `Space.computeFreeUntil()` to handle next booking

- [ ] Update logic to find next booking start
- [ ] Run test, confirm green

### 1.6 COMMIT: Handle next booking in free-until computation

- [ ] Commit with message: `feat(spaces): handle next booking in computeFreeUntil()`

### 1.7 RED: Test `Space.computeNextOpenAt()` when closed now but opens later today

- [ ] Write test in `packages/spaces/domain/space.entity.test.ts`:
  - **Arrange**: Space open 14:00-18:00, now = 10:00
  - **Act**: Call `space.computeNextOpenAt(now, tz)`
  - **Assert**: Returns 14:00 (next open time today)

### 1.8 GREEN: Implement `Space.computeNextOpenAt()`

- [ ] Add method to `Space` entity:
  ```typescript
  computeNextOpenAt(now: Date, tz: string): Date | null
  ```
- [ ] Logic:
  - Get today's open hours windows
  - Find first window that starts after `now`
  - If found, return window start time
  - If not found, return `null` (closed rest of day)
- [ ] Run test, confirm green

### 1.9 COMMIT: Domain status computation (next open at)

- [ ] Commit with message: `feat(spaces): add Space.computeNextOpenAt() for closed status`

### 1.10 RED: Test `Space.computeNextOpenAt()` when closed all day

- [ ] Write test:
  - **Arrange**: Space open hours empty for today, now = 10:00
  - **Act**: Call `space.computeNextOpenAt(now, tz)`
  - **Assert**: Returns `null`

### 1.11 GREEN: Handle closed-all-day case

- [ ] Update logic to return `null` when no open windows today
- [ ] Run test, confirm green

### 1.12 COMMIT: Handle closed-all-day in next-open computation

- [ ] Commit with message: `feat(spaces): handle closed-all-day in computeNextOpenAt()`

## 2. Infrastructure — Repository Method for Bookings by Date

### 2.1 RED: Test `BookingRepository.findForDate()` returns bookings for given date

- [ ] Write test in `packages/spaces/infrastructure/prisma-booking.repository.integration.test.ts`:
  - **Arrange**: Create bookings for 2026-05-03 (10:00-11:00, 14:00-15:00) and 2026-05-04 (10:00-11:00)
  - **Act**: Call `repo.findForDate(new Date('2026-05-03'), tz)`
  - **Assert**: Returns 2 bookings (only 2026-05-03)

### 2.2 GREEN: Implement `PrismaBookingRepository.findForDate()`

- [ ] Add method to `packages/spaces/infrastructure/prisma-booking.repository.ts`:
  ```typescript
  async findForDate(date: Date, tz: string): Promise<Booking[]>
  ```
- [ ] Logic:
  - Convert `date` to start-of-day and end-of-day in `tz`
  - Query Prisma for bookings where `startsAt >= startOfDay AND startsAt < endOfDay AND status = 'active'`
  - Map to domain `Booking` entities
- [ ] Run test, confirm green

### 2.3 COMMIT: Repository method for bookings by date

- [ ] Commit with message: `feat(spaces): add BookingRepository.findForDate() for status computation`

### 2.4 Update `BookingRepository` port interface

- [ ] Add method signature to `packages/spaces/domain/booking.repository.ts`:
  ```typescript
  findForDate(date: Date, tz: string): Promise<Booking[]>
  ```

### 2.5 COMMIT: Add findForDate to repository port

- [ ] Commit with message: `feat(spaces): add findForDate() to BookingRepository port`

## 3. Application — Extend SpaceLister DTO and Service

### 3.1 Extend `SpaceDto` with `currentStatus` field

- [ ] Edit `packages/spaces/application/dtos/index.ts`:
  ```typescript
  export interface SpaceDto extends DomainSpaceDto {
    isOccupiedNow: boolean
    currentStatus: {
      state: 'free' | 'occupied' | 'closed'
      freeUntil?: string
      freeWindowMinutes?: number
      occupiedBy?: string
      occupiedUntil?: string
      nextOpenAt?: string | null
    }
  }
  ```

### 3.2 COMMIT: Extend SpaceDto with currentStatus

- [ ] Commit with message: `feat(spaces): extend SpaceDto with currentStatus field`

### 3.3 RED: Test `SpaceLister.run()` returns free status when space is free

- [ ] Write test in `packages/spaces/application/space-lister.service.test.ts`:
  - **Arrange**: InMemory repos with 1 space (open 09:00-18:00), no bookings, now = 10:00
  - **Act**: Call `spaceLister.run()`
  - **Assert**: `currentStatus.state === 'free'`, `freeUntil === '2026-05-03T18:00:00Z'`, `freeWindowMinutes === 480`

### 3.4 GREEN: Implement status computation in `SpaceLister.run()`

- [ ] Modify `packages/spaces/application/space-lister.service.ts`:
  - Inject `Clock` and `tz` via constructor
  - Fetch bookings for today via `bookingRepo.findForDate(now, tz)`
  - For each space, compute status:
    - If occupied now: `state = 'occupied'`, `occupiedBy`, `occupiedUntil`
    - Else if closed now: `state = 'closed'`, `nextOpenAt`
    - Else: `state = 'free'`, `freeUntil`, `freeWindowMinutes`
  - Assemble DTO with `currentStatus`
- [ ] Run test, confirm green

### 3.5 COMMIT: Compute live status in SpaceLister

- [ ] Commit with message: `feat(spaces): compute live status in SpaceLister.run()`

### 3.6 RED: Test `SpaceLister.run()` returns occupied status when space is occupied

- [ ] Write test:
  - **Arrange**: 1 space, 1 active booking (10:00-11:00), now = 10:30
  - **Act**: Call `spaceLister.run()`
  - **Assert**: `currentStatus.state === 'occupied'`, `occupiedBy === 'Alice'`, `occupiedUntil === '2026-05-03T11:00:00Z'`

### 3.7 GREEN: Handle occupied status

- [ ] Update logic to detect occupied state and populate `occupiedBy`, `occupiedUntil`
- [ ] Run test, confirm green

### 3.8 COMMIT: Handle occupied status in SpaceLister

- [ ] Commit with message: `feat(spaces): handle occupied status in SpaceLister`

### 3.9 RED: Test `SpaceLister.run()` returns closed status when space is closed

- [ ] Write test:
  - **Arrange**: 1 space (open 14:00-18:00), now = 10:00
  - **Act**: Call `spaceLister.run()`
  - **Assert**: `currentStatus.state === 'closed'`, `nextOpenAt === '2026-05-03T14:00:00Z'`

### 3.10 GREEN: Handle closed status

- [ ] Update logic to detect closed state and populate `nextOpenAt`
- [ ] Run test, confirm green

### 3.11 COMMIT: Handle closed status in SpaceLister

- [ ] Commit with message: `feat(spaces): handle closed status in SpaceLister`

### 3.12 REFACTOR: Extract status computation to helper function

- [ ] Extract status computation logic to private method `computeStatusForSpace(space, bookings, now, tz)`
- [ ] Run tests, confirm green

### 3.13 COMMIT: Refactor status computation to helper

- [ ] Commit with message: `refactor(spaces): extract status computation to helper method`

## 4. Infrastructure — Wire SpaceLister with Clock and TZ

### 4.1 Update `SpaceLister` constructor to accept `Clock` and `tz`

- [ ] Edit `packages/spaces/application/space-lister.service.ts`:
  ```typescript
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly clock: Clock,
    private readonly tz: string
  ) {}
  ```

### 4.2 Update factory to inject `Clock` and `tz`

- [ ] Edit `packages/spaces/infrastructure/spaces-services.factory.ts` (or equivalent):
  - Inject `clock` from `@dfs/common`
  - Inject `tz` from `siteConfig`
  - Pass to `SpaceLister` constructor

### 4.3 COMMIT: Wire SpaceLister with Clock and TZ

- [ ] Commit with message: `feat(spaces): wire SpaceLister with Clock and timezone`

## 5. Frontend — Install shadcn Sheet Component

### 5.1 Install `<Sheet>` component via shadcn CLI

- [ ] Run: `bunx shadcn@latest add sheet` in `apps/webapp`
- [ ] Verify `apps/webapp/src/components/ui/sheet.tsx` exists

### 5.2 COMMIT: Add shadcn Sheet component

- [ ] Commit with message: `chore(webapp): add shadcn Sheet component`

## 6. Frontend — Locale Keys

### 6.1 Add locale keys for status labels

- [ ] Edit `apps/webapp/src/locales/es/spaces.json`:
  ```json
  {
    "freeUntil": "Libre · hasta las {{time}}",
    "freeAllDay": "Libre todo el día",
    "occupiedUntil": "{{name}} · hasta las {{time}} ({{minutes}}min restantes)",
    "closedOpensAt": "Cerrado · abre {{time}}",
    "closedToday": "Cerrado hoy",
    "bookLater": "Reservar después"
  }
  ```
- [ ] Repeat for `en` and `gl` locales

### 6.2 Add locale keys for quick-book sheet

- [ ] Edit `apps/webapp/src/locales/es/booking.json`:
  ```json
  {
    "confirmBooking": "Confirmar reserva",
    "yourName": "Tu nombre"
  }
  ```
- [ ] Edit `apps/webapp/src/locales/es/spaces.json` (add quick-book duration labels):
  ```json
  {
    "quickBook30min": "30min",
    "quickBook1h": "1h",
    "quickBook2h": "2h"
  }
  ```
- [ ] Repeat for `en` and `gl` locales

### 6.3 COMMIT: Add locale keys for quick-book UX

- [ ] Commit with message: `feat(webapp): add locale keys for quick-book home page`

## 7. Frontend — SpaceCard Component

### 7.1 RED: Test `<SpaceCard>` renders free status with quick buttons

- [ ] Write test in `apps/webapp/src/features/spaces/space-card.test.tsx`:
  - **Arrange**: Render `<SpaceCard>` with `space.currentStatus.state === 'free'`, `freeWindowMinutes === 120`
  - **Act**: Query for quick buttons [30min] [1h] [2h]
  - **Assert**: All 3 buttons visible

### 7.2 GREEN: Implement `<SpaceCard>` component

- [ ] Create `apps/webapp/src/features/spaces/space-card.tsx`:
  - Props: `space: SpaceDto`, `onQuickBook: (duration: number) => void`, `onNavigate: () => void`
  - Render card with `space.color` as background
  - Render status line based on `currentStatus.state`
  - Render quick buttons [30min] [1h] [2h] when `state === 'free'`
  - Hide button if `freeWindowMinutes < duration`
  - Render "Reservar después" button when `state === 'occupied'`
  - Tap card body (not buttons) calls `onNavigate()`
- [ ] Run test, confirm green

### 7.3 COMMIT: Implement SpaceCard component

- [ ] Commit with message: `feat(webapp): implement SpaceCard with live status`

### 7.4 RED: Test `<SpaceCard>` hides [1h] button when only 30min free

- [ ] Write test:
  - **Arrange**: Render `<SpaceCard>` with `freeWindowMinutes === 30`
  - **Act**: Query for [1h] button
  - **Assert**: Button not in document

### 7.5 GREEN: Hide buttons when insufficient free time

- [ ] Update logic to filter buttons by `freeWindowMinutes`
- [ ] Run test, confirm green

### 7.6 COMMIT: Hide quick buttons when insufficient free time

- [ ] Commit with message: `feat(webapp): hide quick buttons when insufficient free time`

### 7.7 RED: Test `<SpaceCard>` renders occupied status with "Reservar después"

- [ ] Write test:
  - **Arrange**: Render `<SpaceCard>` with `state === 'occupied'`, `occupiedBy === 'Alice'`
  - **Act**: Query for "Reservar después" button
  - **Assert**: Button visible, quick buttons not visible

### 7.8 GREEN: Render occupied status

- [ ] Update component to render occupied status line and "Reservar después" button
- [ ] Run test, confirm green

### 7.9 COMMIT: Render occupied status in SpaceCard

- [ ] Commit with message: `feat(webapp): render occupied status in SpaceCard`

### 7.10 RED: Test `<SpaceCard>` renders closed status

- [ ] Write test:
  - **Arrange**: Render `<SpaceCard>` with `state === 'closed'`, `nextOpenAt === '2026-05-03T14:00:00Z'`
  - **Act**: Query for status line
  - **Assert**: Shows "Cerrado · abre 14:00"

### 7.11 GREEN: Render closed status

- [ ] Update component to render closed status line
- [ ] Run test, confirm green

### 7.12 COMMIT: Render closed status in SpaceCard

- [ ] Commit with message: `feat(webapp): render closed status in SpaceCard`

## 8. Frontend — QuickBookSheet Component

### 8.1 Define TypeScript prop interface for `<QuickBookSheet>`

- [ ] Create `apps/webapp/src/features/spaces/quick-book-sheet.tsx` with prop interface:
  ```typescript
  interface QuickBookSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    space: { id: string; slug: string; name: string }
    defaultStart?: Date | string
    defaultEnd?: Date | string
    defaultDate?: Date | string
    onConfirm?: () => void
    onCancel?: () => void
  }
  ```
- [ ] Document that phase 1 passes no defaults (uses "now + duration"), phases 2-3 will pass pre-filled times

### 8.2 RED: Test `<QuickBookSheet>` renders with pre-filled name

- [ ] Write test in `apps/webapp/src/features/spaces/quick-book-sheet.test.tsx`:
  - **Arrange**: Mock `readStoredBookerName()` to return 'Alice', render `<QuickBookSheet>` with `open={true}`, `space`, no defaults
  - **Act**: Query for input
  - **Assert**: Input value is 'Alice'

### 8.3 GREEN: Implement `<QuickBookSheet>` component

- [ ] Implement component:
  - Use `<Sheet>` with `side="bottom"`
  - Pre-fill name from `readStoredBookerName()` (via `apps/webapp/src/features/spaces/booker-name-storage.ts`)
  - Render title "Confirmar reserva"
  - Render subtitle with space name + time range (computed from defaults or now + 1h)
  - Render input "Tu nombre"
  - Render "Confirmar reserva" button (calls `onConfirm()`)
  - Render cancel button (calls `onCancel()`)
- [ ] Run test, confirm green

### 8.4 RED: Test `<QuickBookSheet>` uses pre-filled times when defaults are passed

- [ ] Write test:
  - **Arrange**: Render with `defaultStart="2026-05-03T14:00:00Z"`, `defaultEnd="2026-05-03T16:00:00Z"`
  - **Act**: Query for subtitle
  - **Assert**: Shows "Hoy 14:00 – 16:00 (2h)"

### 8.5 GREEN: Implement default time handling

- [ ] Add logic to compute start/end from `defaultStart`/`defaultEnd` or fallback to now + 1h
- [ ] Run test, confirm green

### 8.6 RED: Test `<QuickBookSheet>` falls back to "now + 1h" when defaults are absent

- [ ] Write test:
  - **Arrange**: Render without `defaultStart`/`defaultEnd`, now = 14:37
  - **Act**: Query for subtitle
  - **Assert**: Shows "Hoy 14:37 – 15:37 (1h)"

### 8.7 GREEN: Confirm fallback logic

- [ ] Verify fallback to now + 1h works
- [ ] Run test, confirm green

### 8.8 COMMIT: Implement QuickBookSheet component

- [ ] Commit with message: `feat(webapp): implement QuickBookSheet with full prop contract`

## 9. Frontend — Rewrite Home Page

### 9.1 RED: Test home page renders 3 space cards

- [ ] Write test in `apps/webapp/src/routes/index.test.tsx`:
  - **Arrange**: Mock `api.spaces.list.useQuery()` to return 3 spaces
  - **Act**: Render `<HomePage>`
  - **Assert**: 3 `<SpaceCard>` components rendered

### 9.2 GREEN: Rewrite home page with space cards

- [ ] Edit `apps/webapp/src/routes/index.tsx`:
  - Remove `<AvailabilitySearch>` and `<AvailabilityResults>` sections
  - Render `<SpaceCard>` for each space
  - Pass `onQuickBook={(duration) => handleQuickBook(space, duration)}`
  - Pass `onNavigate={() => navigate({ to: '/spaces/$slug', params: { slug: space.slug } })}`
- [ ] Run test, confirm green

### 9.3 COMMIT: Rewrite home page with space cards

- [ ] Commit with message: `feat(webapp): rewrite home page with live status cards`

### 9.4 RED: Test quick-book flow opens sheet

- [ ] Write test:
  - **Arrange**: Render home page, mock `api.spaces.list.useQuery()`
  - **Act**: Click [1h] button on first card
  - **Assert**: `<QuickBookSheet>` is open

### 9.5 GREEN: Implement quick-book flow

- [ ] Add state `const [sheetState, setSheetState] = useState<{ space: SpaceDto, duration: number } | null>(null)`
- [ ] Implement `handleQuickBook(space, duration)` to set `sheetState`
- [ ] Render `<QuickBookSheet>` with `open={!!sheetState}`, `space={sheetState?.space}`, `duration={sheetState?.duration}`
- [ ] Run test, confirm green

### 9.6 COMMIT: Implement quick-book sheet flow

- [ ] Commit with message: `feat(webapp): implement quick-book sheet flow on home page`

### 9.7 RED: Test quick-book confirmation creates booking

- [ ] Write test:
  - **Arrange**: Render home page, open sheet, mock `api.spaces.book.useMutation()`
  - **Act**: Type name, click "Confirmar reserva"
  - **Assert**: Mutation called with correct params (slug, name, startsAt, endsAt)

### 9.8 GREEN: Implement booking creation

- [ ] Implement `handleConfirm(name)`:
  - Compute `startsAt` (now) and `endsAt` (now + duration)
  - Call `bookMutation.mutate({ slug, bookerName: name, startsAt, endsAt })`
  - On success: close sheet, invalidate `api.spaces.list`, store name via `writeStoredBookerName(name)`
  - On error: show toast
- [ ] Run test, confirm green

### 9.9 COMMIT: Implement booking creation in quick-book flow

- [ ] Commit with message: `feat(webapp): implement booking creation in quick-book flow`

### 9.10 RED: Test loading skeleton while spaces.list is in flight

- [ ] Write test:
  - **Arrange**: Mock `api.spaces.list.useQuery()` with `isLoading: true`
  - **Act**: Render home page
  - **Assert**: `<SpaceCardSkeleton>` components rendered

### 9.11 GREEN: Render loading skeleton

- [ ] Update home page to render `<SpaceCardSkeleton>` when `isLoading`
- [ ] Run test, confirm green

### 9.12 COMMIT: Render loading skeleton on home page

- [ ] Commit with message: `feat(webapp): render loading skeleton on home page`

### 9.13 RED: Test empty state when no spaces exist

- [ ] Write test:
  - **Arrange**: Mock `api.spaces.list.useQuery()` to return `[]`
  - **Act**: Render home page
  - **Assert**: Empty state message rendered

### 9.14 GREEN: Render empty state

- [ ] Update home page to render empty state when `spaces?.length === 0`
- [ ] Run test, confirm green

### 9.15 COMMIT: Render empty state on home page

- [ ] Commit with message: `feat(webapp): render empty state on home page`

## 10. Frontend — Remove Old Components

### 10.1 Delete `<AvailabilitySearch>` component

- [ ] Delete `apps/webapp/src/features/spaces/availability-search.tsx`

### 10.2 Delete `<AvailabilityResults>` component

- [ ] Delete `apps/webapp/src/features/spaces/availability-results.tsx`

### 10.3 COMMIT: Remove old availability search components

- [ ] Commit with message: `chore(webapp): remove old availability search components`

## 11. Validation and Review

### 11.1 Run all reviewers in parallel

- [ ] Run `/task-validate` to execute lint, typecheck, and tests
- [ ] Run `/task-code-review` on `packages/spaces/` and `apps/webapp/src/`
- [ ] Run `/task-tests-review` on `packages/spaces/` and `apps/webapp/src/`
- [ ] Run `/task-architecture-review` on `packages/spaces/`
- [ ] Run `/task-frontend-review` on `apps/webapp/src/`

### 11.2 COMMIT: Apply reviewer-driven fixes (if any)

- [ ] Address findings from all reviewers
- [ ] Commit with message: `fix(webapp,spaces): apply review findings for quick-book redesign` (or skip if no fixes needed)

### 11.3 COMMIT: Final feature commit

- [ ] Commit with message: `feat(webapp): redesign home with quick-book sheet [phase 1]`
