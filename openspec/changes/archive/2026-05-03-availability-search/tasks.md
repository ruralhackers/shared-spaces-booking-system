# Tasks — `availability-search`

## 1. Backend — Domain Layer

- [x] 1.1 Create `SpaceAvailability` value object in `packages/spaces/domain/` with fields: `spaceSlug`, `spaceName`, `status` ('available' | 'occupied'), `occupiedBy?`
- [x] 1.2 Add method to `Space` entity: `isOpenAt(startsAt: Date, endsAt: Date): boolean` — checks if space open hours cover the requested time window
- [x] 1.3 Add method to `BookingRepository` interface: `findOverlapping(spaceSlug: string, startsAt: Date, endsAt: Date): Promise<Booking[]>` — finds bookings that overlap with the time window
- [x] 1.4 Validation trio

## 2. Backend — Application Layer

- [x] 2.1 Create `SpaceAvailabilityChecker` service in `packages/spaces/application/` with `run(input: { date: string, startsAt: string, endsAt: string }): Promise<SpaceAvailability[]>`
- [x] 2.2 Service logic: for each space, check if open at that time; if open, check for overlapping bookings; return availability status
- [x] 2.3 Write unit tests for `SpaceAvailabilityChecker` using InMemory repositories
- [x] 2.4 Validation trio

## 3. Backend — Infrastructure Layer

- [x] 3.1 Implement `findOverlapping` in `BookingPrismaRepository` — query bookings where `spaceSlug` matches and time ranges overlap
- [x] 3.2 Write integration test for `findOverlapping` using real SQLite database
- [x] 3.3 Validation trio

## 4. Backend — tRPC API

- [x] 4.1 Add `spaces.availability` query to `@dfs/api` router with input schema: `{ date: string, startsAt: string, endsAt: string }` (ISO 8601 instants)
- [x] 4.2 Wire `SpaceAvailabilityChecker` service in the procedure
- [x] 4.3 Add integration test for the tRPC procedure
- [x] 4.4 Validation trio

## 5. Frontend — Availability Search Component

- [x] 5.1 Create `apps/webapp/src/features/spaces/availability-search.tsx` component with date picker + time inputs (start/end)
- [x] 5.2 Add "Search" button that triggers `api.spaces.availability.useQuery` with selected date/time
- [x] 5.3 Display loading/error/empty states
- [x] 5.4 Validation trio

## 6. Frontend — Availability Results Component

- [x] 6.1 Create `apps/webapp/src/features/spaces/availability-results.tsx` component that receives `SpaceAvailability[]`
- [x] 6.2 Render list with 3 visual states:
   - Available: green checkmark + space name + "Reservar" button
   - Occupied: user icon + space name + "(Nombre del ocupante)"
- [x] 6.3 "Reservar" button opens inline booking form (name input only, date/time pre-filled)
- [x] 6.4 Validation trio

## 7. Frontend — Homepage Integration

- [x] 7.1 Update `apps/webapp/src/routes/index.tsx` to show `AvailabilitySearch` at the top
- [x] 7.2 Below search, show `AvailabilityResults` if query has data
- [x] 7.3 Below results (or if no search yet), show existing space list (current homepage content)
- [x] 7.4 Ensure both flows coexist: search by availability OR browse by space
- [x] 7.5 Validation trio

## 8. i18n — Translation Keys

- [x] 8.1 Add keys to `apps/webapp/src/locales/en/spaces.json`: `searchAvailability`, `selectDateTime`, `startTime`, `endTime`, `searchButton`, `available`, `occupied`, `occupiedBy`, `noSpacesAvailable`
- [x] 8.2 Add Spanish translations to `apps/webapp/src/locales/es/spaces.json`
- [x] 8.3 Add Galician translations to `apps/webapp/src/locales/gl/spaces.json`
- [x] 8.4 Validation trio

## 9. Frontend — Booking from Availability

- [x] 9.1 When user clicks "Reservar" on an available space, show inline form with name input (date/time already set from search)
- [x] 9.2 On submit, call `api.spaces.book.useMutation` with pre-filled date/time + user-entered name
- [x] 9.3 On success, invalidate `spaces.availability` query and show success toast
- [x] 9.4 On error, show error toast
- [x] 9.5 Validation trio

## 10. Manual QA

- [x] 10.1 Test availability search: select date/time, verify correct spaces shown as available/occupied
- [x] 10.2 Test booking from availability: click "Reservar", enter name, confirm booking created
- [x] 10.3 Test edge cases: all spaces occupied, all spaces available, spaces closed (should show as occupied)
- [x] 10.4 Test i18n: verify all new strings display correctly in Spanish, Galician, English
- [x] 10.5 Test both flows: availability search AND individual space detail view still work

## 11. Final Review Gate (mandatory)

- [x] 11.1 Run `/task-validate` until clean
- [x] 11.2 Run `/task-code-review`, `/task-architecture-review`, `/task-frontend-review`, `/task-tests-review` in parallel
- [x] 11.3 Address all findings
- [x] 11.4 Re-run validation trio
- [x] 11.5 Mark all tasks complete and report ready to archive
