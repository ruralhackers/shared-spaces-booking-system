# Tasks: Cross-Space Availability Finder

## 1. Backend — Extend SpaceAvailabilityDto with `state` field (TDD)

**Files**:
- `packages/spaces/domain/space-availability.vo.ts`
- `packages/spaces/application/space-availability-checker.service.ts`
- `packages/spaces/application/space-availability-checker.service.test.ts`
- `packages/api/infrastructure/routers/spaces.router.ts`

- [ ] 1.1 Verify `SpaceAvailabilityDto` includes `color` and `spaceSlug` fields (already present — confirm no changes needed)
- [ ] 1.2 **RED**: Write test in `space-availability-checker.service.test.ts` — "returns state: 'closed' for window outside open hours" — assert DTO includes `state: 'closed'` when querying a time outside the space's `openHours`
- [ ] 1.3 **GREEN**: Extend `SpaceAvailabilityDto` interface to add `state: 'free' | 'occupied' | 'closed'` field
- [ ] 1.4 **GREEN**: Update `SpaceAvailabilityChecker.run()` to compute and return `state` field:
  - `state: 'free'` when space is available
  - `state: 'occupied'` when space has a booking
  - `state: 'closed'` when space is not open during the queried window
- [ ] 1.5 **RED**: Write test "returns state: 'free' for available space" — assert `state: 'free'`
- [ ] 1.6 **GREEN**: Confirm existing logic returns `state: 'free'` for available spaces
- [ ] 1.7 **RED**: Write test "returns state: 'occupied' for booked space" — assert `state: 'occupied'`
- [ ] 1.8 **GREEN**: Confirm existing logic returns `state: 'occupied'` for booked spaces
- [ ] 1.9 Update `spaces.availability` tRPC procedure output schema in `spaces.router.ts` to include `state` field (add to zod schema)
- [ ] 1.10 Run `bun test` in `packages/spaces/` — confirm all tests green
- [ ] 1.11 **Refactor**: Extract state computation logic to helper method if needed
- [ ] 1.12 Commit with message: `feat(spaces): add state field to SpaceAvailabilityDto`

## 2. Frontend — AvailabilityTimePicker component (TDD)

**File**: `apps/webapp/src/features/spaces/availability-time-picker.tsx`

**Test file**: `apps/webapp/src/features/spaces/availability-time-picker.test.tsx`

- [ ] 2.1 **Reason**: List test cases in `availability-time-picker.test.tsx` as TODO comments:
  - Renders start and end time inputs
  - Displays computed duration (hours and minutes)
  - Validates end > start on submit
  - Validates minimum 30min duration on submit
  - Calls onSubmit with valid times
  - Shows error message when validation fails
- [ ] 2.2 **Red**: Write test "renders start and end time inputs" — assert inputs exist with correct labels
- [ ] 2.3 **Green**: Implement component skeleton with two `<input type="time">` fields
- [ ] 2.4 **Red**: Write test "displays computed duration" — assert duration text updates when times change
- [ ] 2.5 **Green**: Add duration computation logic (end - start in hours/minutes)
- [ ] 2.6 **Red**: Write test "validates end > start on submit" — assert error message appears
- [ ] 2.7 **Green**: Add validation logic in submit handler
- [ ] 2.8 **Red**: Write test "validates minimum 30min duration" — assert error message appears
- [ ] 2.9 **Green**: Add minimum duration validation
- [ ] 2.10 **Red**: Write test "calls onSubmit with valid times" — assert callback receives correct values
- [ ] 2.11 **Green**: Wire submit handler to call `onSubmit` prop
- [ ] 2.12 **Refactor**: Extract validation logic to helper function, apply naming conventions

## 3. Frontend — AvailabilityResultsList component (TDD)

**File**: `apps/webapp/src/features/spaces/availability-results-list.tsx`

**Test file**: `apps/webapp/src/features/spaces/availability-results-list.test.tsx`

- [ ] 3.1 **Reason**: List test cases in `availability-results-list.test.tsx` as TODO comments:
  - Renders available space (state: 'free') with "Reservar" button
  - Renders occupied space (state: 'occupied') with occupant name and "Ver día" button
  - Renders closed space (state: 'closed') with "Cerrado" label
  - Renders empty state when all spaces unavailable
  - Renders loading state (skeleton rows)
  - Renders error state with retry button
  - Calls onReserve with correct space slug when "Reservar" clicked
  - Calls onViewDay with correct space slug and date when "Ver día" clicked
- [ ] 3.2 **Red**: Write test "renders available space with Reservar button" — assert button exists for `state: 'free'`
- [ ] 3.3 **Green**: Implement component with conditional rendering based on `state`
- [ ] 3.4 **Red**: Write test "renders occupied space with occupant name" — assert name and button for `state: 'occupied'`
- [ ] 3.5 **Green**: Add occupied case with `occupiedBy` display
- [ ] 3.6 **Red**: Write test "renders closed space with Cerrado label" — assert no button for `state: 'closed'`
- [ ] 3.7 **Green**: Add closed case (state: 'closed')
- [ ] 3.8 **Red**: Write test "renders empty state when all spaces unavailable" — assert message
- [ ] 3.9 **Green**: Add empty state conditional
- [ ] 3.10 **Red**: Write test "renders loading state" — assert skeleton rows
- [ ] 3.11 **Green**: Add loading prop and skeleton UI
- [ ] 3.12 **Red**: Write test "renders error state with retry button" — assert button
- [ ] 3.13 **Green**: Add error prop and error UI with retry callback
- [ ] 3.14 **Red**: Write test "calls onReserve with correct space slug" — assert callback
- [ ] 3.15 **Green**: Wire "Reservar" button to `onReserve` prop
- [ ] 3.16 **Red**: Write test "calls onViewDay with correct space slug and date" — assert callback
- [ ] 3.17 **Green**: Wire "Ver día" button to `onViewDay` prop
- [ ] 3.18 **Refactor**: Extract row rendering to subcomponent, apply naming conventions

## 4. Frontend — AvailabilityFinder orchestrator component (TDD)

**File**: `apps/webapp/src/features/spaces/availability-finder.tsx`

**Test file**: `apps/webapp/src/features/spaces/availability-finder.test.tsx`

- [ ] 4.1 **Reason**: List test cases in `availability-finder.test.tsx` as TODO comments:
  - Renders preset chips (Hoy, Mañana, Otra fecha)
  - "Hoy" chip shows time picker with default = next round hour
  - "Mañana" chip shows time picker with default = first open hour tomorrow
  - "Otra fecha" chip shows date picker, then time picker
  - "Hoy" chip after close time falls back to tomorrow with hint message
  - "Buscar disponibilidad" button triggers tRPC query
  - Results appear below time picker after query
  - "Reservar" button opens quick-book sheet with pre-filled data
  - "Ver día" button navigates to `/spaces/:slug?date=`
  - Loading state during query
  - Error state on query failure with retry
- [ ] 4.2 **Red**: Write test "renders preset chips" — assert 3 chips exist
- [ ] 4.3 **Green**: Implement component skeleton with 3 buttons
- [ ] 4.4 **Red**: Write test "Hoy chip shows time picker with default next round hour" — assert time picker appears with correct defaults
- [ ] 4.5 **Green**: Add state for selected preset, compute default times for "Hoy"
- [ ] 4.6 **Red**: Write test "Mañana chip shows time picker with default first open hour tomorrow" — assert defaults
- [ ] 4.7 **Green**: Add "Mañana" preset logic
- [ ] 4.8 **Red**: Write test "Otra fecha chip shows date picker" — assert date input appears
- [ ] 4.9 **Green**: Add "Otra fecha" preset with date picker state
- [ ] 4.10 **Red**: Write test "Hoy chip after close time falls back to tomorrow" — assert hint message
- [ ] 4.11 **Green**: Add fallback logic in "Hoy" preset
- [ ] 4.12 **Red**: Write test "Buscar disponibilidad button triggers tRPC query" — mock tRPC, assert query called
- [ ] 4.13 **Green**: Wire button to `trpc.spaces.availability.useQuery()` with chosen times
- [ ] 4.14 **Red**: Write test "Results appear below time picker" — assert results list renders
- [ ] 4.15 **Green**: Pass query data to `<AvailabilityResultsList>`
- [ ] 4.16 **Red**: Write test "Reservar button opens quick-book sheet" — assert sheet opens with correct props
- [ ] 4.17 **Green**: Wire `onReserve` callback to open sheet with pre-filled data
- [ ] 4.18 **Red**: Write test "Ver día button navigates to detail page" — assert navigation
- [ ] 4.19 **Green**: Wire `onViewDay` callback to `navigate()` with query param
- [ ] 4.20 **Red**: Write test "Loading state during query" — assert loading prop passed to results list
- [ ] 4.21 **Green**: Pass `isLoading` from tRPC query to results list
- [ ] 4.22 **Red**: Write test "Error state on query failure" — assert error prop passed
- [ ] 4.23 **Green**: Pass `error` from tRPC query to results list
- [ ] 4.24 **Refactor**: Extract preset logic to helper functions, apply naming conventions

## 5. Frontend — Integrate quick-book-sheet from phase 1

**File**: `apps/webapp/src/features/spaces/quick-book-sheet.tsx` (from phase 1)

**Dependency**: Phase 1 (`redesign-home-quick-book`) owns the `<QuickBookSheet>` component and its prop contract (`defaultDate`, `defaultStart`, `defaultEnd`, `spaceSlug`).

- [ ] 5.1 Import `<QuickBookSheet>` from `features/spaces/quick-book-sheet.tsx`
- [ ] 5.2 Wire `onReserve` callback in `AvailabilityFinder` to open sheet with props: `{ spaceSlug, defaultDate, defaultStart, defaultEnd, open: true }`
- [ ] 5.3 **RED**: Write test "opens quick-book sheet with pre-filled data when Reservar tapped" — assert sheet receives correct props
- [ ] 5.4 **GREEN**: Pass props to sheet component in `onReserve` handler
- [ ] 5.5 **Refactor**: Extract sheet state management to custom hook if needed

## 6. Frontend — Navigate to detail page with date param (phase 2 integration)

**File**: `apps/webapp/src/features/spaces/availability-finder.tsx`

**Dependency**: Phase 2 (`redesign-space-detail-timeline`) owns the `/spaces/:slug?date=YYYY-MM-DD` route and its `validateSearch` schema.

- [ ] 6.1 Import `useNavigate` from `@tanstack/react-router`
- [ ] 6.2 Wire `onViewDay` callback to navigate to `/spaces/${spaceSlug}?date=${chosenDate}` (format date as YYYY-MM-DD)
- [ ] 6.3 **RED**: Write test "navigates to detail page with date param when Ver día tapped" — assert navigation called with correct URL
- [ ] 6.4 **GREEN**: Implement navigation in `onViewDay` handler

## 7. Frontend — Integrate AvailabilityFinder into home page

**File**: `apps/webapp/src/routes/index.tsx`

- [ ] 7.1 Import `<AvailabilityFinder />` component
- [ ] 7.2 Add component below the 3 space cards (after the grid/list from phase 1)
- [ ] 7.3 Wrap in a section with heading "Reservar para más tarde" (i18n key)
- [ ] 7.4 Add spacing/padding to separate from space cards above

## 8. Locale keys

**Files**: `apps/webapp/src/locales/{en,es,gl}/spaces.json`

**Note**: Reuse existing keys from `common.json` (`today`, `closed`) and `spaces.json` (`searchAvailability`, `available`). Only add new domain-specific keys to `spaces.json`.

- [ ] 8.1 Add keys to `spaces.json`:
  - `bookForLater`: "Book for later" / "Reservar para más tarde" / "Reservar para máis tarde"
  - `tomorrow`: "Tomorrow" / "Mañana" / "Mañá"
  - `otherDate`: "Other date" / "Otra fecha" / "Outra data"
  - `chooseTime`: "Choose time" / "Elige hora" / "Elixe hora"
  - `from`: "From" / "Desde" / "Desde"
  - `until`: "Until" / "Hasta" / "Ata"
  - `duration`: "Duration" / "Duración" / "Duración"
  - `forTimeWindow`: "For {start} – {end}" / "Para {start} – {end}" / "Para {start} – {end}"
  - `noSpacesAvailable`: "No spaces available at this time. Try another time or check each room's calendar." / "No hay espacios disponibles en este horario. Prueba otro horario o revisa el calendario de cada sala." / "Non hai espazos dispoñibles neste horario. Proba outro horario ou revisa o calendario de cada sala."
  - `viewDay`: "View day" / "Ver día" / "Ver día"
  - `reserve`: "Reserve" / "Reservar" / "Reservar"
  - `todayClosedShowingTomorrow`: "Today is closed. Showing tomorrow." / "Hoy ya cerró. Mostrando mañana." / "Hoxe xa pechou. Mostrando mañá."
  - `minimumDuration30min`: "Minimum duration is 30 minutes" / "La duración mínima es 30 minutos" / "A duración mínima é 30 minutos"
  - `endMustBeAfterStart`: "End time must be after start time" / "La hora de fin debe ser posterior a la de inicio" / "A hora de fin debe ser posterior á de inicio"
  - `cannotBookInPast`: "Cannot book in the past" / "No puedes reservar en el pasado" / "Non podes reservar no pasado"
  - `couldNotLoadAvailability`: "Could not load availability" / "No se pudo cargar la disponibilidad" / "Non se puido cargar a dispoñibilidade"
  - `retry`: "Retry" / "Reintentar" / "Reintentar"

## 9. Validation + commit

- [ ] 9.1 Run `bun run lint:fix` from root
- [ ] 9.2 Run `bun run typecheck` from root
- [ ] 9.3 Run `bun test` from `packages/spaces/`
- [ ] 9.4 Run `bun test` from `apps/webapp/`
- [ ] 9.5 Run `/task-code-review` to review production code against conventions
- [ ] 9.6 Run `/task-tests-review` to review test quality and coverage
- [ ] 9.7 Run `/task-architecture-review` to check hexagonal architecture compliance
- [ ] 9.8 Run `/task-frontend-review` to check component, hook, and tRPC integration
- [ ] 9.9 Manual test: open home page, tap "Hoy", verify default times, search, verify results, tap "Reservar", verify sheet opens
- [ ] 9.10 Manual test: tap "Mañana", verify default times, search, verify results
- [ ] 9.11 Manual test: tap "Otra fecha", pick a date, verify time picker, search, verify results
- [ ] 9.12 Manual test: tap "Hoy" after close time, verify fallback to tomorrow with hint
- [ ] 9.13 Manual test: tap "Ver día" on occupied space, verify navigation to detail page with date param
- [ ] 9.14 Commit with message: `feat(webapp): add cross-space availability finder to home page`
