import { describe, expect, test } from 'bun:test'
import { FixedClock, TimeRange } from '@dfs/common'
import { type OpenHours, Space } from '../domain'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceAvailabilityChecker } from './space-availability-checker.service'

const TZ = 'America/Argentina/Buenos_Aires'
const clock = new FixedClock(new Date('2026-05-04T12:00:00-03:00'))

const weekdayOpenHours: OpenHours = {
  mon: [{ start: '09:00', end: '18:00' }],
  tue: [{ start: '09:00', end: '18:00' }],
  wed: [{ start: '09:00', end: '18:00' }],
  thu: [{ start: '09:00', end: '18:00' }],
  fri: [{ start: '09:00', end: '18:00' }],
  sat: [],
  sun: []
}

function createSpace(name: string): Space {
  return Space.create({
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description: 'Test space',
    openHours: weekdayOpenHours,
    color: null
  })
}

describe('The SpaceAvailabilityChecker', () => {
  test('returns available when space is open and no bookings exist', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const space = createSpace('Chill House')
    await spaceRepo.save(space)

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-05T10:00:00-03:00'), // Tuesday
      endsAt: new Date('2026-05-05T11:00:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('available')
    expect(result[0]?.spaceSlug).toBe('chill-house')
  })

  test('returns state: closed for window outside open hours', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    await spaceRepo.save(createSpace('Chill House'))

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-02T10:00:00-03:00'), // Saturday (closed)
      endsAt: new Date('2026-05-02T11:00:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.state).toBe('closed')
    expect(result[0]?.occupiedBy).toBeUndefined()
  })

  test('returns state: free for available space', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    await spaceRepo.save(createSpace('Chill House'))

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-05T10:00:00-03:00'), // Tuesday (open)
      endsAt: new Date('2026-05-05T11:00:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.state).toBe('free')
  })

  test('returns state: occupied for booked space', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const space = createSpace('Chill House')
    await spaceRepo.save(space)

    const booking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-05T10:00:00-03:00'),
        end: new Date('2026-05-05T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Ana'),
      existing: [],
      clock,
      tz: TZ
    })
    await bookingRepo.save(booking)

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-05T10:30:00-03:00'),
      endsAt: new Date('2026-05-05T11:30:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.state).toBe('occupied')
  })

  test('returns occupied with booker name when overlapping booking exists', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const space = createSpace('Chill House')
    await spaceRepo.save(space)

    const booking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-05T10:00:00-03:00'),
        end: new Date('2026-05-05T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Ana'),
      existing: [],
      clock,
      tz: TZ
    })
    await bookingRepo.save(booking)

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-05T10:30:00-03:00'),
      endsAt: new Date('2026-05-05T11:30:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('occupied')
    expect(result[0]?.occupiedBy).toBe('Ana')
  })

  test('checks multiple spaces and returns mixed availability', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()

    const openSpace = createSpace('Open Room')
    const bookedSpace = createSpace('Booked Room')
    await spaceRepo.save(openSpace)
    await spaceRepo.save(bookedSpace)

    const booking = Booking.create({
      space: bookedSpace,
      range: TimeRange.create({
        start: new Date('2026-05-05T10:00:00-03:00'),
        end: new Date('2026-05-05T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Bob'),
      existing: [],
      clock,
      tz: TZ
    })
    await bookingRepo.save(booking)

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-05T10:00:00-03:00'),
      endsAt: new Date('2026-05-05T11:00:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(2)
    const available = result.find((r) => r.spaceSlug === 'open-room')
    const occupied = result.find((r) => r.spaceSlug === 'booked-room')
    expect(available?.status).toBe('available')
    expect(occupied?.status).toBe('occupied')
    expect(occupied?.occupiedBy).toBe('Bob')
  })

  test('ignores cancelled bookings when checking availability', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const space = createSpace('Chill House')
    await spaceRepo.save(space)

    const booking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-05T10:00:00-03:00'),
        end: new Date('2026-05-05T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Carol'),
      existing: [],
      clock,
      tz: TZ
    })
    booking.cancelByAdmin(clock)
    await bookingRepo.save(booking)

    const checker = new SpaceAvailabilityChecker(spaceRepo, bookingRepo)

    const result = await checker.run({
      startsAt: new Date('2026-05-05T10:00:00-03:00'),
      endsAt: new Date('2026-05-05T11:00:00-03:00'),
      tz: TZ
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('available')
  })
})
