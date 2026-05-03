import { describe, expect, test } from 'bun:test'
import { FixedClock, TimeRange } from '@dfs/common'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import { SpaceNotFoundError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceDayViewer } from './space-day-viewer.service'

const TZ = 'America/Argentina/Buenos_Aires'
const OPEN_HOURS = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

const chillHouse = Space.fromDto({
  id: 'clh1234567890abcdefghijk',
  slug: 'chill-house',
  displayName: 'Chill House',
  description: 'Lounge',
  openHours: OPEN_HOURS
})

const clock = new FixedClock(new Date('2026-05-04T12:00:00-03:00'))

describe('The SpaceDayViewer service', () => {
  test('lists active bookings for requested day', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    spaceRepo.seed([chillHouse])
    const booking = Booking.create({
      space: chillHouse,
      range: TimeRange.create({
        start: new Date('2026-05-04T10:00:00-03:00'),
        end: new Date('2026-05-04T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Ana'),
      existing: [],
      clock,
      tz: TZ
    })
    await bookingRepo.save(booking)
    const service = new SpaceDayViewer(spaceRepo, bookingRepo, TZ)

    const result = await service.run({ slug: 'chill-house', date: '2026-05-04' })

    expect(result.bookings).toHaveLength(1)
    expect(result.bookings[0]?.bookerName).toBe('Ana')
  })

  test('shows empty list when no bookings on that date', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    spaceRepo.seed([chillHouse])
    const service = new SpaceDayViewer(spaceRepo, bookingRepo, TZ)

    const result = await service.run({ slug: 'chill-house', date: '2026-05-04' })

    expect(result.bookings).toHaveLength(0)
  })

  test('includes day open hours in response', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    spaceRepo.seed([chillHouse])
    const service = new SpaceDayViewer(spaceRepo, bookingRepo, TZ)

    const result = await service.run({ slug: 'chill-house', date: '2026-05-04' })

    // 2026-05-04 is a Monday
    expect(result.openHoursForDay).toEqual(OPEN_HOURS.mon)
  })

  test('rejects unknown slug', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const service = new SpaceDayViewer(spaceRepo, bookingRepo, TZ)

    expect(service.run({ slug: 'unknown', date: '2026-05-04' })).rejects.toThrow(SpaceNotFoundError)
  })
})
