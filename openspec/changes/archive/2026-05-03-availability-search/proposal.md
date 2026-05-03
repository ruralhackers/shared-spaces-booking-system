---
name: availability-search
schema: default
status: planning
created: 2026-05-03
---

# Availability Search

## Problem

Users currently must check each space individually to see availability. If there are 5 spaces, they need to visit 5 pages to find an available slot.

## Solution

Add a new flow: **Time → Available Spaces → Book**. Users select a date and time range, and the system shows which spaces are available, occupied (with occupant name), or closed (treated as occupied).

## Design

### Homepage Structure
```
┌─────────────────────────────────────┐
│ Date + Time Range Selector          │
│ [Search Availability]               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Available Spaces:                   │
│ ✅ Sala A  [Reservar]              │
│ 👤 Sala B  (Ana García)            │
│ ✅ Sala C  [Reservar]              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ All Spaces (existing list)          │
│ ...                                 │
└─────────────────────────────────────┘
```

### Backend API
- New tRPC query: `spaces.availability({ date, startsAt, endsAt })`
- Returns: `{ spaceSlug, spaceName, status: 'available' | 'occupied', occupiedBy?: string }[]`
- Logic:
  1. For each space, check if open hours cover the requested time
  2. If closed → mark as occupied (no occupiedBy)
  3. If open, check for overlapping bookings
  4. If booking exists → mark as occupied with booker name
  5. Otherwise → mark as available

### Frontend Flow
1. User selects date + start time + end time
2. Clicks "Search"
3. System shows filtered list:
   - **Available**: green checkmark + "Reservar" button
   - **Occupied**: user icon + occupant name (or "Cerrada" if closed)
4. User clicks "Reservar" → inline form (name only, date/time pre-filled)
5. Confirms → booking created, list refreshes

### Coexistence with Current Flow
- Availability search at top of homepage
- Existing space list below (browse by space still works)
- Individual space detail pages unchanged

## Technical Approach

### Domain Layer
- `SpaceAvailability` value object
- `Space.isOpenAt(startsAt, endsAt)` method
- `BookingRepository.findOverlapping(spaceSlug, startsAt, endsAt)` method

### Application Layer
- `SpaceAvailabilityChecker` service with `run()` method
- Unit tests with InMemory repositories

### Infrastructure Layer
- Implement `findOverlapping` in `BookingPrismaRepository`
- Integration tests with SQLite

### API Layer
- `spaces.availability` tRPC query
- Input: `{ date: string, startsAt: string, endsAt: string }` (ISO 8601)
- Output: `SpaceAvailability[]`

### Frontend
- `AvailabilitySearch` component (date/time inputs + search button)
- `AvailabilityResults` component (list with available/occupied states)
- Inline booking form on "Reservar" click
- i18n keys for all new strings (es/gl/en)

## Out of Scope
- Filtering by capacity, amenities, or other space attributes
- Calendar view of availability
- Multi-space booking (booking multiple spaces at once)
- Recurring bookings

## Success Criteria
- Users can search for available spaces by date/time
- Available spaces show "Reservar" button
- Occupied spaces show occupant name
- Closed spaces show as occupied
- Booking from availability search works end-to-end
- Both flows (search + browse) coexist on homepage
- All strings translated (es/gl/en)
- All tests pass (unit, integration, e2e)
