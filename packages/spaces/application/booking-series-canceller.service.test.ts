import { describe, expect, test } from 'bun:test'
import { FixedClock } from '@dfs/common'
import { BookingNotFoundError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemoryBookingSeriesRepository } from '../infrastructure/booking-series-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { BookingSeriesCanceller } from './booking-series-canceller.service'
import { BookingSeriesCreator } from './booking-series-creator.service'

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

const clock = new FixedClock(new Date('2026-06-01T12:00:00-03:00'))

function makeService() {
  const spaceRepo = new InMemorySpaceRepository()
  const bookingRepo = new InMemoryBookingRepository()
  const seriesRepo = new InMemoryBookingSeriesRepository()
  spaceRepo.seed([chillHouse])
  const creator = new BookingSeriesCreator(spaceRepo, bookingRepo, seriesRepo, clock, TZ)
  const canceller = new BookingSeriesCanceller(bookingRepo, seriesRepo, clock)
  return { creator, canceller, bookingRepo, seriesRepo }
}

describe('The BookingSeriesCanceller', () => {
  test('cancels single occurrence when scope is this', async () => {
    // Arrange
    const { creator, canceller, bookingRepo } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    const occurrenceId = result.created[2].id // 3rd occurrence

    // Act
    await canceller.run({
      seriesId: result.seriesId,
      scope: 'this',
      occurrenceId,
      bookerName: 'Ana'
    })

    // Assert
    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(4) // 5 - 1 cancelled
  })

  test('cancels this and future occurrences when scope is thisAndFuture', async () => {
    // Arrange
    const { creator, canceller, bookingRepo } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    const occurrenceId = result.created[2].id // 3rd occurrence (2026-06-03)

    // Act
    await canceller.run({
      seriesId: result.seriesId,
      scope: 'thisAndFuture',
      occurrenceId,
      bookerName: 'Ana'
    })

    // Assert
    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(2) // First 2 remain active
  })

  test('rejects cancellation with mismatched booker name', async () => {
    // Arrange
    const { creator, canceller } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    const occurrenceId = result.created[0].id

    // Act & Assert
    await expect(
      canceller.run({
        seriesId: result.seriesId,
        scope: 'this',
        occurrenceId,
        bookerName: 'Bob'
      })
    ).rejects.toThrow('name does not match')
  })

  test('rejects cancellation of already-cancelled occurrence', async () => {
    // Arrange
    const { creator, canceller } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    const occurrenceId = result.created[0].id

    await canceller.run({
      seriesId: result.seriesId,
      scope: 'this',
      occurrenceId,
      bookerName: 'Ana'
    })

    // Act & Assert
    await expect(
      canceller.run({
        seriesId: result.seriesId,
        scope: 'this',
        occurrenceId,
        bookerName: 'Ana'
      })
    ).rejects.toThrow('already cancelled')
  })

  test('rejects cancellation when series does not exist', async () => {
    // Arrange
    const { canceller } = makeService()

    // Act & Assert
    await expect(
      canceller.run({
        seriesId: 'non-existent-series',
        scope: 'this',
        occurrenceId: 'some-id',
        bookerName: 'Ana'
      })
    ).rejects.toThrow(BookingNotFoundError)
  })

  test('rejects cancellation when occurrence does not exist', async () => {
    // Arrange
    const { creator, canceller } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    // Act & Assert
    await expect(
      canceller.run({
        seriesId: result.seriesId,
        scope: 'this',
        occurrenceId: 'non-existent-occurrence',
        bookerName: 'Ana'
      })
    ).rejects.toThrow(BookingNotFoundError)
  })

  test('cancels only the first occurrence when scope is thisAndFuture on first booking', async () => {
    // Arrange
    const { creator, canceller, bookingRepo } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    const firstOccurrenceId = result.created[0].id

    // Act
    const cancelResult = await canceller.run({
      seriesId: result.seriesId,
      scope: 'thisAndFuture',
      occurrenceId: firstOccurrenceId,
      bookerName: 'Ana'
    })

    // Assert
    expect(cancelResult.cancelledCount).toBe(5) // All 5 cancelled
    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(0)
  })

  test('cancels only the last occurrence when scope is thisAndFuture on last booking', async () => {
    // Arrange
    const { creator, canceller, bookingRepo } = makeService()

    const result = await creator.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    const lastOccurrenceId = result.created[4].id

    // Act
    const cancelResult = await canceller.run({
      seriesId: result.seriesId,
      scope: 'thisAndFuture',
      occurrenceId: lastOccurrenceId,
      bookerName: 'Ana'
    })

    // Assert
    expect(cancelResult.cancelledCount).toBe(1) // Only last one
    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(4)
  })
})
