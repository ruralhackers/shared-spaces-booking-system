import { describe, expect, test } from 'bun:test'
import { FixedClock, TimeRange } from '@dfs/common'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { AdminBookingLister } from './admin-booking-lister.service'

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

describe('The AdminBookingLister service', () => {
  test('lists all active bookings ordered by startsAt ascending', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    spaceRepo.seed([chillHouse])
    const b1 = Booking.create({
      space: chillHouse,
      range: TimeRange.create({
        start: new Date('2026-05-04T14:00:00-03:00'),
        end: new Date('2026-05-04T15:00:00-03:00')
      }),
      bookerName: BookerName.create('Bob'),
      existing: [],
      clock,
      tz: TZ
    })
    const b2 = Booking.create({
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
    await bookingRepo.save(b1)
    await bookingRepo.save(b2)
    const service = new AdminBookingLister(spaceRepo, bookingRepo)

    const result = await service.run()

    expect(result).toHaveLength(2)
    expect(result[0]?.bookerName).toBe('Ana')
    expect(result[1]?.bookerName).toBe('Bob')
  })

  test('excludes cancelled bookings', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    spaceRepo.seed([chillHouse])
    const b = Booking.create({
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
    b.cancelByAdmin(clock)
    await bookingRepo.save(b)
    const service = new AdminBookingLister(spaceRepo, bookingRepo)

    const result = await service.run()

    expect(result).toHaveLength(0)
  })
})
