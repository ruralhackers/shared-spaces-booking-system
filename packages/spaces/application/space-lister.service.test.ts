import { describe, expect, test } from 'bun:test'
import { Booking } from '../domain/booking.entity'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceLister } from './space-lister.service'

const OPEN_HOURS = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

const SPACE_A = Space.fromDto({
  id: 'clh1234567890abcdefghijk',
  slug: 'chill-house',
  displayName: 'Chill House',
  description: 'Lounge',
  openHours: OPEN_HOURS
})

const SPACE_B = Space.fromDto({
  id: 'clh1234567890abcdefghijl',
  slug: 'call-room',
  displayName: 'Call Room',
  description: 'Quiet',
  openHours: OPEN_HOURS
})

describe('The SpaceLister service', () => {
  test('lists all spaces as DTOs', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A, SPACE_B])
    const bookingRepo = new InMemoryBookingRepository()
    const service = new SpaceLister(spaceRepo, bookingRepo)

    const result = await service.run()

    expect(result).toHaveLength(2)
    expect(result.map((s) => s.slug)).toContain('chill-house')
    expect(result.map((s) => s.slug)).toContain('call-room')
  })

  test('shows empty list when no spaces exist', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const service = new SpaceLister(spaceRepo, bookingRepo)

    const result = await service.run()

    expect(result).toHaveLength(0)
  })

  test('space with no active bookings has isOccupiedNow false', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A])
    const bookingRepo = new InMemoryBookingRepository()
    const service = new SpaceLister(spaceRepo, bookingRepo)

    const result = await service.run()

    expect(result[0].isOccupiedNow).toBe(false)
  })

  test('space with an active booking spanning now has isOccupiedNow true', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    spaceRepo.seed([SPACE_A])
    const bookingRepo = new InMemoryBookingRepository()
    const now = new Date()
    const past = new Date(now.getTime() - 60_000)
    const future = new Date(now.getTime() + 60_000)
    await bookingRepo.save(
      Booking.fromDto({
        id: 'clh0000000000000000000001',
        spaceId: SPACE_A.toDto().id,
        bookerName: 'Alice',
        startsAt: past.toISOString(),
        endsAt: future.toISOString(),
        status: 'active',
        createdAt: past.toISOString(),
        cancelledAt: null,
        cancelledBy: null
      })
    )
    const service = new SpaceLister(spaceRepo, bookingRepo)

    const result = await service.run()

    expect(result[0].isOccupiedNow).toBe(true)
  })
})
