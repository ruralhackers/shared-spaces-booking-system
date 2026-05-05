import { describe, expect, test } from 'bun:test'
import { FixedClock } from '@dfs/common'
import { SpaceNotFoundError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemoryBookingRepository } from '../infrastructure/booking-in-memory.repository'
import { InMemoryBookingSeriesRepository } from '../infrastructure/booking-series-in-memory.repository'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
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
  const service = new BookingSeriesCreator(spaceRepo, bookingRepo, seriesRepo, clock, TZ)
  return { service, bookingRepo, seriesRepo }
}

describe('The BookingSeriesCreator', () => {
  test('creates all occurrences when no conflicts exist', async () => {
    // Arrange
    const { service, bookingRepo, seriesRepo } = makeService()

    // Act
    const result = await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    // Assert
    expect(result.created).toHaveLength(5)
    expect(result.skipped).toHaveLength(0)
    expect(result.seriesId).toBeDefined()

    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(5)

    const series = await seriesRepo.findById(result.seriesId)
    expect(series).not.toBeNull()
  })

  test('skips overlapping occurrences and creates remaining ones', async () => {
    // Arrange
    const { service } = makeService()

    // Create a conflicting booking on 2026-06-03
    await service.run({
      slug: 'chill-house',
      bookerName: 'Bob',
      startsAt: new Date('2026-06-03T10:00:00-03:00'),
      endsAt: new Date('2026-06-03T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-03' }
    })

    // Act
    const result = await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-05' }
    })

    // Assert
    expect(result.created).toHaveLength(4)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].date).toBe('2026-06-03')
  })

  test('skips occurrences outside open hours', async () => {
    // Arrange
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const seriesRepo = new InMemoryBookingSeriesRepository()

    const restrictedSpace = Space.fromDto({
      id: 'clh2234567890abcdefghijk',
      slug: 'restricted',
      displayName: 'Restricted',
      description: 'Closed on weekends',
      openHours: {
        mon: [{ start: '07:00', end: '23:00' }],
        tue: [{ start: '07:00', end: '23:00' }],
        wed: [{ start: '07:00', end: '23:00' }],
        thu: [{ start: '07:00', end: '23:00' }],
        fri: [{ start: '07:00', end: '23:00' }],
        sat: [],
        sun: []
      }
    })
    spaceRepo.seed([restrictedSpace])

    const service = new BookingSeriesCreator(spaceRepo, bookingRepo, seriesRepo, clock, TZ)

    // Act
    const result = await service.run({
      slug: 'restricted',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-02T10:00:00-03:00'), // Monday
      endsAt: new Date('2026-06-02T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-08' } // Includes Sat/Sun
    })

    // Assert
    expect(result.created).toHaveLength(5) // Mon-Fri
    expect(result.skipped).toHaveLength(2) // Sat, Sun
  })

  test('rejects series when all occurrences are skipped', async () => {
    // Arrange
    const spaceRepo = new InMemorySpaceRepository()
    const bookingRepo = new InMemoryBookingRepository()
    const seriesRepo = new InMemoryBookingSeriesRepository()

    const closedSpace = Space.fromDto({
      id: 'clh3334567890abcdefghijk',
      slug: 'closed',
      displayName: 'Closed',
      description: 'Always closed',
      openHours: {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: []
      }
    })
    spaceRepo.seed([closedSpace])

    const service = new BookingSeriesCreator(spaceRepo, bookingRepo, seriesRepo, clock, TZ)

    // Act & Assert
    await expect(
      service.run({
        slug: 'closed',
        bookerName: 'Ana',
        startsAt: new Date('2026-06-01T10:00:00-03:00'),
        endsAt: new Date('2026-06-01T11:00:00-03:00'),
        frequency: 'daily',
        end: { type: 'date', value: '2026-06-05' }
      })
    ).rejects.toThrow('All occurrences were skipped')
  })

  test('converts occurrence count to end date for daily series', async () => {
    // Arrange
    const { service } = makeService()

    // Act
    const result = await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'count', value: 5 }
    })

    // Assert
    expect(result.created).toHaveLength(5)
  })

  test('converts occurrence count to end date for weekly series', async () => {
    // Arrange
    const { service } = makeService()

    // Act
    const result = await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-02T17:00:00-03:00'), // Tuesday
      endsAt: new Date('2026-06-02T18:00:00-03:00'),
      frequency: 'weekly',
      end: { type: 'count', value: 3 }
    })

    // Assert
    expect(result.created).toHaveLength(3)
    // Should be 3 Tuesdays: 2026-06-02, 2026-06-09, 2026-06-16
  })

  test('rejects series for non-existent space', async () => {
    // Arrange
    const { service } = makeService()

    // Act & Assert
    await expect(
      service.run({
        slug: 'non-existent',
        bookerName: 'Ana',
        startsAt: new Date('2026-06-01T10:00:00-03:00'),
        endsAt: new Date('2026-06-01T11:00:00-03:00'),
        frequency: 'daily',
        end: { type: 'date', value: '2026-06-05' }
      })
    ).rejects.toThrow(SpaceNotFoundError)
  })

  test('associates all created bookings with series ID', async () => {
    // Arrange
    const { service, bookingRepo } = makeService()

    // Act
    const result = await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: new Date('2026-06-01T10:00:00-03:00'),
      endsAt: new Date('2026-06-01T11:00:00-03:00'),
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-03' }
    })

    // Assert
    const bookings = await bookingRepo.listAllActive()
    for (const booking of bookings) {
      expect(booking.toDto().seriesId).toBe(result.seriesId)
    }
  })

  test('extracts time in local timezone, not UTC (timezone bug)', async () => {
    // Arrange
    const { service, bookingRepo } = makeService()
    
    // Simulate what frontend sends: 10:00 ART converted to UTC
    // 10:00 ART (UTC-3) = 13:00 UTC
    const startsAtUtc = new Date('2026-06-01T13:00:00.000Z') // 10:00 ART → UTC
    const endsAtUtc = new Date('2026-06-01T14:00:00.000Z')   // 11:00 ART → UTC

    // Act
    const result = await service.run({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      frequency: 'daily',
      end: { type: 'date', value: '2026-06-03' }
    })

    // Assert
    // With the bug, booking would be at 13:00 ART (wrong)
    // After fix, booking should be at 10:00 ART (correct)
    const bookings = await bookingRepo.listAllActive()
    expect(bookings).toHaveLength(3)
    
    // Check first booking time (should be 10:00 ART = 13:00 UTC)
    const firstBooking = bookings[0]
    if (!firstBooking) throw new Error('No booking created')
    
    const dto = firstBooking.toDto()
    const startDate = new Date(dto.startsAt)
    
    // Convert to ART to check local time
    // 10:00 ART = 13:00 UTC
    // The bug would make it 16:00 UTC (13:00 ART)
    expect(startDate.toISOString()).toBe('2026-06-01T13:00:00.000Z')
  })
})
