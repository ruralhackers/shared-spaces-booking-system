import { describe, expect, test } from 'bun:test'
import { BusinessRuleError, FixedClock, TimeRange } from '@dfs/common'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import { BookingNotFoundError, NameMismatchError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemoryNotifier } from '../infrastructure/notifier-in-memory'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { BookingCanceller } from './booking-canceller.service'

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

async function makeBooking(bookingRepo: InMemoryBookingRepository) {
  const booking = Booking.create({
    space: chillHouse,
    range: TimeRange.create({
      start: new Date('2026-05-04T10:00:00-03:00'),
      end: new Date('2026-05-04T11:00:00-03:00')
    }),
    bookerName: BookerName.create('Ana Pérez'),
    existing: [],
    clock,
    tz: TZ
  })
  await bookingRepo.save(booking)
  return booking
}

describe('The BookingCanceller service', () => {
  test('cancels booking when name matches', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const notifier = new InMemoryNotifier()
    spaceRepo.seed([chillHouse])
    const booking = await makeBooking(bookingRepo)
    const service = new BookingCanceller(spaceRepo, bookingRepo, notifier, clock)

    await service.run({ id: booking.toDto().id, bookerName: 'Ana Pérez' })

    const updated = await bookingRepo.findById(booking.toDto().id)
    expect(updated?.toDto().status).toBe('cancelled')
  })

  test('notifies with "booker" attribution', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const notifier = new InMemoryNotifier()
    spaceRepo.seed([chillHouse])
    const booking = await makeBooking(bookingRepo)
    const service = new BookingCanceller(spaceRepo, bookingRepo, notifier, clock)

    await service.run({ id: booking.toDto().id, bookerName: 'Ana Pérez' })

    expect(notifier.calls[0]?.by).toBe('booker')
  })

  test('rejects name mismatch', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const notifier = new InMemoryNotifier()
    spaceRepo.seed([chillHouse])
    const booking = await makeBooking(bookingRepo)
    const service = new BookingCanceller(spaceRepo, bookingRepo, notifier, clock)

    expect(service.run({ id: booking.toDto().id, bookerName: 'Bob' })).rejects.toThrow(
      NameMismatchError
    )
  })

  test('rejects missing booking', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const notifier = new InMemoryNotifier()
    spaceRepo.seed([chillHouse])
    const service = new BookingCanceller(spaceRepo, bookingRepo, notifier, clock)

    expect(service.run({ id: 'nonexistent', bookerName: 'Ana' })).rejects.toThrow(
      BookingNotFoundError
    )
  })

  test('rejects already-cancelled booking', async () => {
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const notifier = new InMemoryNotifier()
    spaceRepo.seed([chillHouse])
    const booking = await makeBooking(bookingRepo)
    const service = new BookingCanceller(spaceRepo, bookingRepo, notifier, clock)
    await service.run({ id: booking.toDto().id, bookerName: 'Ana Pérez' })

    expect(service.run({ id: booking.toDto().id, bookerName: 'Ana Pérez' })).rejects.toThrow(
      BusinessRuleError
    )
  })
})
