import { describe, expect, test } from 'bun:test'
import { FixedClock } from '@dfs/common'
import { Booking } from '../domain/booking.entity'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceLister } from './space-lister.service'

const TZ = 'America/Argentina/Buenos_Aires'

const OPEN_HOURS_24H = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

const OPEN_HOURS_9_18 = {
  mon: [{ start: '09:00', end: '18:00' }],
  tue: [{ start: '09:00', end: '18:00' }],
  wed: [{ start: '09:00', end: '18:00' }],
  thu: [{ start: '09:00', end: '18:00' }],
  fri: [{ start: '09:00', end: '18:00' }],
  sat: [{ start: '09:00', end: '18:00' }],
  sun: [{ start: '09:00', end: '18:00' }]
}

const OPEN_HOURS_14_18 = {
  mon: [{ start: '14:00', end: '18:00' }],
  tue: [{ start: '14:00', end: '18:00' }],
  wed: [{ start: '14:00', end: '18:00' }],
  thu: [{ start: '14:00', end: '18:00' }],
  fri: [{ start: '14:00', end: '18:00' }],
  sat: [{ start: '14:00', end: '18:00' }],
  sun: [{ start: '14:00', end: '18:00' }]
}

const SPACE_A = Space.fromDto({
  id: 'clh1234567890abcdefghijk',
  slug: 'chill-house',
  displayName: 'Chill House',
  description: 'Lounge',
  openHours: OPEN_HOURS_24H,
  color: null
})

const SPACE_B = Space.fromDto({
  id: 'clh1234567890abcdefghijl',
  slug: 'call-room',
  displayName: 'Call Room',
  description: 'Quiet',
  openHours: OPEN_HOURS_24H,
  color: null
})

describe('The SpaceLister service', () => {
  test('lists all spaces as DTOs', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A, SPACE_B])
    const bookingRepo = new InMemoryBookingRepository()
    // now = 10:00 Buenos Aires (UTC-3)
    const clock = new FixedClock(new Date('2026-05-03T13:00:00Z'))
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result).toHaveLength(2)
    expect(result.map((s) => s.slug)).toContain('chill-house')
    expect(result.map((s) => s.slug)).toContain('call-room')
  })

  test('shows empty list when no spaces exist', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const clock = new FixedClock(new Date('2026-05-03T13:00:00Z'))
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result).toHaveLength(0)
  })

  test('space with no active bookings has isOccupiedNow false', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A])
    const bookingRepo = new InMemoryBookingRepository()
    const clock = new FixedClock(new Date('2026-05-03T13:00:00Z'))
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result[0]?.isOccupiedNow).toBe(false)
  })

  test('space with an active booking spanning now has isOccupiedNow true', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A])
    const bookingRepo = new InMemoryBookingRepository()
    // now = 10:30 Buenos Aires = 13:30 UTC
    const now = new Date('2026-05-03T13:30:00Z')
    const clock = new FixedClock(now)
    await bookingRepo.save(
      Booking.fromDto({
        id: 'clh0000000000000000000001',
        spaceId: SPACE_A.toDto().id,
        seriesId: null,
        bookerName: 'Alice',
        startsAt: '2026-05-03T13:00:00.000Z', // 10:00 BA
        endsAt: '2026-05-03T14:00:00.000Z',   // 11:00 BA
        status: 'active',
        createdAt: '2026-05-03T13:00:00.000Z',
        cancelledAt: null,
        cancelledBy: null
      })
    )
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result[0]?.isOccupiedNow).toBe(true)
  })

  // Task 3.3 RED: free status
  test('returns free status with freeUntil and freeWindowMinutes when space is free', async () => {
    // Space open 09:00-18:00, no bookings, now = 10:00 Buenos Aires = 13:00 UTC
    const space = Space.fromDto({
      id: 'clh1234567890abcdefghijk',
      slug: 'chill-house',
      displayName: 'Chill House',
      description: 'Lounge',
      openHours: OPEN_HOURS_9_18,
      color: null
    })
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([space])
    const bookingRepo = new InMemoryBookingRepository()
    const clock = new FixedClock(new Date('2026-05-03T13:00:00Z')) // 10:00 BA
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result[0]?.currentStatus.state).toBe('free')
    // 18:00 Buenos Aires = 21:00 UTC
    expect(result[0]?.currentStatus.freeUntil).toBe('2026-05-03T21:00:00.000Z')
    expect(result[0]?.currentStatus.freeWindowMinutes).toBe(480)
  })

  // Task 3.6 RED: occupied status
  test('returns occupied status with occupiedBy and occupiedUntil', async () => {
    // Space open 24h, booking 10:00-11:00 BA, now = 10:30 BA
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A])
    const bookingRepo = new InMemoryBookingRepository()
    // now = 10:30 Buenos Aires = 13:30 UTC
    const now = new Date('2026-05-03T13:30:00Z')
    const clock = new FixedClock(now)
    await bookingRepo.save(
      Booking.fromDto({
        id: 'clh0000000000000000000002',
        spaceId: SPACE_A.toDto().id,
        seriesId: null,
        bookerName: 'Alice',
        startsAt: '2026-05-03T13:00:00.000Z', // 10:00 BA
        endsAt: '2026-05-03T14:00:00.000Z',   // 11:00 BA
        status: 'active',
        createdAt: '2026-05-03T13:00:00.000Z',
        cancelledAt: null,
        cancelledBy: null
      })
    )
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result[0]?.currentStatus.state).toBe('occupied')
    expect(result[0]?.currentStatus.occupiedBy).toBe('Alice')
    expect(result[0]?.currentStatus.occupiedUntil).toBe('2026-05-03T14:00:00.000Z')
  })

  // Task 3.9 RED: closed status
  test('returns closed status with nextOpenAt when space is closed', async () => {
    // Space open 14:00-18:00, now = 10:00 BA
    const space = Space.fromDto({
      id: 'clh1234567890abcdefghijk',
      slug: 'chill-house',
      displayName: 'Chill House',
      description: 'Lounge',
      openHours: OPEN_HOURS_14_18,
      color: null
    })
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([space])
    const bookingRepo = new InMemoryBookingRepository()
    const clock = new FixedClock(new Date('2026-05-03T13:00:00Z')) // 10:00 BA
    const service = new SpaceLister(spaceRepo, bookingRepo, clock, TZ)

    const result = await service.run()

    expect(result[0]?.currentStatus.state).toBe('closed')
    // 14:00 Buenos Aires = 17:00 UTC
    expect(result[0]?.currentStatus.nextOpenAt).toBe('2026-05-03T17:00:00.000Z')
  })
})
