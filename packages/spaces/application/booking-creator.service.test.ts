import { describe, expect, test } from 'bun:test'
import { FixedClock, ValidationError } from '@dfs/common'
import { BookingOverlapError, OutsideOpenHoursError, SpaceNotFoundError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemoryNotifier } from '../infrastructure/notifier-in-memory'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { BookingCreator } from './booking-creator.service'

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

function makeService() {
  const spaceRepo = new InMemorySpaceRepository()
  const bookingRepo = new InMemoryBookingRepository()
  const notifier = new InMemoryNotifier()
  spaceRepo.seed([chillHouse])
  const service = new BookingCreator(spaceRepo, bookingRepo, notifier, clock, TZ)
  return { service, bookingRepo, notifier }
}

describe('The BookingCreator service', () => {
  test('persists valid booking', async () => {
    const { service, bookingRepo } = makeService()

    await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-05-04T10:00:00-03:00'),
      endsAt: new Date('2026-05-04T11:00:00-03:00')
    })

    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(1)
  })

  test('notifies after persistence', async () => {
    const { service, notifier } = makeService()

    await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-05-04T10:00:00-03:00'),
      endsAt: new Date('2026-05-04T11:00:00-03:00')
    })

    expect(notifier.calls).toHaveLength(1)
    expect(notifier.calls[0]?.event).toBe('created')
  })

  test('rejects overlap', async () => {
    const { service } = makeService()
    await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-05-04T10:00:00-03:00'),
      endsAt: new Date('2026-05-04T11:00:00-03:00')
    })

    expect(
      service.run({
        slug: 'chill-house',
        bookerName: 'Bob',
        startsAt: new Date('2026-05-04T10:30:00-03:00'),
        endsAt: new Date('2026-05-04T11:30:00-03:00')
      })
    ).rejects.toThrow(BookingOverlapError)
  })

  test('rejects booking outside open hours', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const notifier = new InMemoryNotifier()
    const closedSpace = Space.fromDto({
      id: 'clh1234567890abcdefghijk',
      slug: 'chill-house',
      displayName: 'Chill House',
      description: 'Lounge',
      openHours: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
    })
    spaceRepo.seed([closedSpace])
    const service = new BookingCreator(spaceRepo, bookingRepo, notifier, clock, TZ)

    expect(
      service.run({
        slug: 'chill-house',
        bookerName: 'Ana',
        startsAt: new Date('2026-05-04T10:00:00-03:00'),
        endsAt: new Date('2026-05-04T11:00:00-03:00')
      })
    ).rejects.toThrow(OutsideOpenHoursError)
  })

  test('rejects cross-midnight booking', async () => {
    const { service } = makeService()

    expect(
      service.run({
        slug: 'chill-house',
        bookerName: 'Ana',
        startsAt: new Date('2026-05-04T23:30:00-03:00'),
        endsAt: new Date('2026-05-05T00:30:00-03:00')
      })
    ).rejects.toThrow(ValidationError)
  })

  test('rejects unknown slug', async () => {
    const { service } = makeService()

    expect(
      service.run({
        slug: 'unknown',
        bookerName: 'Ana',
        startsAt: new Date('2026-05-04T10:00:00-03:00'),
        endsAt: new Date('2026-05-04T11:00:00-03:00')
      })
    ).rejects.toThrow(SpaceNotFoundError)
  })
})
