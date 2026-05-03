import { describe, expect, test } from 'bun:test'
import { BusinessRuleError, FixedClock, TimeRange, ValidationError } from '@dfs/common'
import { BookerName } from './booker-name.vo'
import { Booking } from './booking.entity'
import { BookingOverlapError } from './errors/booking-overlap.error'
import { NameMismatchError } from './errors/name-mismatch.error'
import { OutsideOpenHoursError } from './errors/outside-open-hours.error'
import { Space } from './space.entity'

const TZ = 'America/Argentina/Buenos_Aires'

const space = Space.fromDto({
  id: 'clh1234567890abcdefghijk',
  slug: 'chill-house',
  displayName: 'Chill House',
  description: 'A lounge.',
  openHours: {
    mon: [{ start: '00:00', end: '24:00' }],
    tue: [{ start: '00:00', end: '24:00' }],
    wed: [{ start: '00:00', end: '24:00' }],
    thu: [{ start: '00:00', end: '24:00' }],
    fri: [{ start: '00:00', end: '24:00' }],
    sat: [{ start: '00:00', end: '24:00' }],
    sun: [{ start: '00:00', end: '24:00' }]
  }
})

const clock = new FixedClock(new Date('2026-05-04T12:00:00-03:00'))

const range1000to1100 = TimeRange.create({
  start: new Date('2026-05-04T10:00:00-03:00'),
  end: new Date('2026-05-04T11:00:00-03:00')
})

const range1030to1130 = TimeRange.create({
  start: new Date('2026-05-04T10:30:00-03:00'),
  end: new Date('2026-05-04T11:30:00-03:00')
})

const range1100to1200 = TimeRange.create({
  start: new Date('2026-05-04T11:00:00-03:00'),
  end: new Date('2026-05-04T12:00:00-03:00')
})

const bookerAna = BookerName.create('Ana Pérez')

describe('The Booking entity', () => {
  describe('create()', () => {
    test('accepts valid booking data', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      expect(booking.toDto().status).toBe('active')
    })

    test('rejects overlapping booking', () => {
      const existing = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      expect(() =>
        Booking.create({
          space,
          range: range1030to1130,
          bookerName: bookerAna,
          existing: [existing],
          clock,
          tz: TZ
        })
      ).toThrow(BookingOverlapError)
    })

    test('accepts adjacent booking (no overlap)', () => {
      const existing = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      expect(() =>
        Booking.create({
          space,
          range: range1100to1200,
          bookerName: bookerAna,
          existing: [existing],
          clock,
          tz: TZ
        })
      ).not.toThrow()
    })

    test('rejects booking outside open hours', () => {
      const closedSpace = Space.fromDto({
        id: 'clh1234567890abcdefghijk',
        slug: 'call-room',
        displayName: 'Call Room',
        description: 'Quiet.',
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

      expect(() =>
        Booking.create({
          space: closedSpace,
          range: range1000to1100,
          bookerName: bookerAna,
          existing: [],
          clock,
          tz: TZ
        })
      ).toThrow(OutsideOpenHoursError)
    })

    test('rejects booking that crosses midnight', () => {
      const crossMidnight = TimeRange.create({
        start: new Date('2026-05-04T23:30:00-03:00'),
        end: new Date('2026-05-05T00:30:00-03:00')
      })

      expect(() =>
        Booking.create({
          space,
          range: crossMidnight,
          bookerName: bookerAna,
          existing: [],
          clock,
          tz: TZ
        })
      ).toThrow(ValidationError)
    })
  })

  describe('cancelByBooker()', () => {
    test('accepts exact name match', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      booking.cancelByBooker(BookerName.create('Ana Pérez'), clock)

      expect(booking.toDto().status).toBe('cancelled')
      expect(booking.toDto().cancelledBy).toBe('booker')
    })

    test('accepts case-insensitive name match', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      booking.cancelByBooker(BookerName.create('ana pérez'), clock)

      expect(booking.toDto().status).toBe('cancelled')
    })

    test('rejects name mismatch', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      expect(() => booking.cancelByBooker(BookerName.create('Bob'), clock)).toThrow(
        NameMismatchError
      )
    })

    test('rejects cancelling already-cancelled booking', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })
      booking.cancelByBooker(bookerAna, clock)

      expect(() => booking.cancelByBooker(bookerAna, clock)).toThrow(BusinessRuleError)
    })
  })

  describe('cancelByAdmin()', () => {
    test('accepts cancellation without name verification', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      booking.cancelByAdmin(clock)

      expect(booking.toDto().status).toBe('cancelled')
      expect(booking.toDto().cancelledBy).toBe('admin')
    })

    test('rejects cancelling already-cancelled booking', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })
      booking.cancelByAdmin(clock)

      expect(() => booking.cancelByAdmin(clock)).toThrow(BusinessRuleError)
    })
  })

  describe('fromDto() / toDto()', () => {
    test('preserves all data through round-trip', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })
      const dto = booking.toDto()

      const restored = Booking.fromDto(dto)

      expect(restored.toDto()).toEqual(dto)
    })
  })

  describe('seriesId', () => {
    test('toDto includes seriesId when present', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ,
        seriesId: 'series-123'
      })

      const dto = booking.toDto()
      expect(dto.seriesId).toBe('series-123')
    })

    test('toDto has null seriesId when not part of series', () => {
      const booking = Booking.create({
        space,
        range: range1000to1100,
        bookerName: bookerAna,
        existing: [],
        clock,
        tz: TZ
      })

      const dto = booking.toDto()
      expect(dto.seriesId).toBeNull()
    })
  })
})
