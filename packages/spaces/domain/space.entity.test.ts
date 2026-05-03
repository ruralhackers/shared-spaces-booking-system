import { describe, expect, test } from 'bun:test'
import { TimeRange, ValidationError } from '@dfs/common'
import { Booking } from './booking.entity'
import { Space } from './space.entity'

const TZ = 'America/Argentina/Buenos_Aires'

const validDto = {
  id: 'clh1234567890abcdefghijk',
  slug: 'chill-house',
  displayName: 'Chill House',
  description: 'A lounge.',
  color: null,
  openHours: {
    mon: [{ start: '00:00', end: '24:00' }],
    tue: [{ start: '00:00', end: '24:00' }],
    wed: [{ start: '00:00', end: '24:00' }],
    thu: [{ start: '00:00', end: '24:00' }],
    fri: [{ start: '00:00', end: '24:00' }],
    sat: [{ start: '00:00', end: '24:00' }],
    sun: [{ start: '00:00', end: '24:00' }]
  }
}

describe('The Space entity', () => {
  describe('create()', () => {
    test('creates space with provided slug', () => {
      const space = Space.create({
        slug: 'chill-house',
        name: 'Chill House',
        description: 'A lounge.',
        openHours: validDto.openHours
      })

      expect(space.toDto().slug).toBe('chill-house')
      expect(space.toDto().displayName).toBe('Chill House')
      expect(space.toDto().color).toBeNull()
    })

    test('creates space with a color', () => {
      const space = Space.create({
        slug: 'chill-house',
        name: 'Chill House',
        description: 'A lounge.',
        openHours: validDto.openHours,
        color: '#3b82f6'
      })

      expect(space.toDto().color).toBe('#3b82f6')
    })

    test('enforces minimum name length of 2 characters', () => {
      expect(() =>
        Space.create({ slug: 'x', name: 'A', description: '', openHours: validDto.openHours })
      ).toThrow(ValidationError)
    })

    test('enforces maximum name length of 100 characters', () => {
      expect(() =>
        Space.create({
          slug: 'x',
          name: 'A'.repeat(101),
          description: '',
          openHours: validDto.openHours
        })
      ).toThrow(ValidationError)
    })

    test('validates open hours structure', () => {
      const badHours = { ...validDto.openHours, mon: [{ start: '18:00', end: '09:00' }] }

      expect(() =>
        Space.create({ slug: 'x', name: 'My Space', description: '', openHours: badHours })
      ).toThrow(ValidationError)
    })
  })

  describe('updateDetails()', () => {
    test('updates provided fields', () => {
      const space = Space.fromDto(validDto)
      space.updateDetails({ name: 'New Name' })
      expect(space.toDto().displayName).toBe('New Name')
    })

    test('leaves other fields unchanged', () => {
      const space = Space.fromDto(validDto)
      space.updateDetails({ name: 'New Name' })
      expect(space.toDto().description).toBe('A lounge.')
      expect(space.toDto().slug).toBe('chill-house')
    })

    test('updates color', () => {
      const space = Space.fromDto(validDto)
      space.updateDetails({ color: '#ef4444' })
      expect(space.toDto().color).toBe('#ef4444')
    })

    test('removes color by setting to null', () => {
      const space = Space.fromDto({ ...validDto, color: '#ef4444' })
      space.updateDetails({ color: null })
      expect(space.toDto().color).toBeNull()
    })

    test('slug remains immutable', () => {
      const space = Space.fromDto(validDto)
      space.updateDetails({ name: 'New Name' })
      expect(space.toDto().slug).toBe('chill-house')
    })

    test('validates name length on update', () => {
      const space = Space.fromDto(validDto)
      expect(() => space.updateDetails({ name: 'A' })).toThrow(ValidationError)
    })

    test('validates open hours on update', () => {
      const space = Space.fromDto(validDto)
      const badHours = { ...validDto.openHours, mon: [{ start: '18:00', end: '09:00' }] }
      expect(() => space.updateDetails({ openHours: badHours })).toThrow(ValidationError)
    })
  })

  describe('fromDto() / toDto()', () => {
    test('preserves all data through round-trip', () => {
      const space = Space.fromDto(validDto)

      expect(space.toDto()).toEqual(validDto)
    })
  })

  describe('computeFreeUntil()', () => {
    const TZ_BUENOS_AIRES = 'America/Argentina/Buenos_Aires'

    const spaceOpen9to18 = Space.fromDto({
      ...validDto,
      openHours: {
        mon: [{ start: '09:00', end: '18:00' }],
        tue: [{ start: '09:00', end: '18:00' }],
        wed: [{ start: '09:00', end: '18:00' }],
        thu: [{ start: '09:00', end: '18:00' }],
        fri: [{ start: '09:00', end: '18:00' }],
        sat: [{ start: '09:00', end: '18:00' }],
        sun: [{ start: '09:00', end: '18:00' }]
      }
    })

    // Task 1.1 RED: no bookings today
    test('returns close time when no bookings today', () => {
      // 2026-05-03 is a Sunday, now = 10:00 in Buenos Aires (UTC-3) = 13:00 UTC
      const now = new Date('2026-05-03T13:00:00Z')

      const result = spaceOpen9to18.computeFreeUntil([], now, TZ_BUENOS_AIRES)

      // 18:00 Buenos Aires = 21:00 UTC
      expect(result?.toISOString()).toBe('2026-05-03T21:00:00.000Z')
    })

    // Task 1.4 RED: next booking exists
    test('returns next booking start when booking exists after now', () => {
      const now = new Date('2026-05-03T13:00:00Z') // 10:00 Buenos Aires
      // Booking at 14:00 Buenos Aires = 17:00 UTC
      const booking = Booking.fromDto({
        id: 'clh0000000000000000000001',
        spaceId: validDto.id,
        seriesId: null,
        bookerName: 'Alice',
        startsAt: '2026-05-03T17:00:00.000Z',
        endsAt: '2026-05-03T18:00:00.000Z',
        status: 'active',
        createdAt: '2026-05-03T13:00:00.000Z',
        cancelledAt: null,
        cancelledBy: null
      })

      const result = spaceOpen9to18.computeFreeUntil([booking], now, TZ_BUENOS_AIRES)

      expect(result?.toISOString()).toBe('2026-05-03T17:00:00.000Z')
    })

    test('returns null when space is closed now', () => {
      // Space opens at 14:00, now = 10:00
      const spaceOpen14to18 = Space.fromDto({
        ...validDto,
        openHours: {
          mon: [{ start: '14:00', end: '18:00' }],
          tue: [{ start: '14:00', end: '18:00' }],
          wed: [{ start: '14:00', end: '18:00' }],
          thu: [{ start: '14:00', end: '18:00' }],
          fri: [{ start: '14:00', end: '18:00' }],
          sat: [{ start: '14:00', end: '18:00' }],
          sun: [{ start: '14:00', end: '18:00' }]
        }
      })
      const now = new Date('2026-05-03T13:00:00Z') // 10:00 Buenos Aires

      const result = spaceOpen14to18.computeFreeUntil([], now, TZ_BUENOS_AIRES)

      expect(result).toBeNull()
    })
  })

  describe('computeNextOpenAt()', () => {
    const TZ_BUENOS_AIRES = 'America/Argentina/Buenos_Aires'

    // Task 1.7 RED: closed now but opens later today
    test('returns next open time when closed now but opens later today', () => {
      const spaceOpen14to18 = Space.fromDto({
        ...validDto,
        openHours: {
          mon: [{ start: '14:00', end: '18:00' }],
          tue: [{ start: '14:00', end: '18:00' }],
          wed: [{ start: '14:00', end: '18:00' }],
          thu: [{ start: '14:00', end: '18:00' }],
          fri: [{ start: '14:00', end: '18:00' }],
          sat: [{ start: '14:00', end: '18:00' }],
          sun: [{ start: '14:00', end: '18:00' }]
        }
      })
      const now = new Date('2026-05-03T13:00:00Z') // 10:00 Buenos Aires

      const result = spaceOpen14to18.computeNextOpenAt(now, TZ_BUENOS_AIRES)

      // 14:00 Buenos Aires = 17:00 UTC
      expect(result?.toISOString()).toBe('2026-05-03T17:00:00.000Z')
    })

    // Task 1.10 RED: closed all day
    test('returns null when space has no open hours today', () => {
      const spaceClosed = Space.fromDto({
        ...validDto,
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
      const now = new Date('2026-05-03T13:00:00Z') // 10:00 Buenos Aires

      const result = spaceClosed.computeNextOpenAt(now, TZ_BUENOS_AIRES)

      expect(result).toBeNull()
    })

    test('returns null when space is already open', () => {
      const spaceOpen9to18 = Space.fromDto({
        ...validDto,
        openHours: {
          mon: [{ start: '09:00', end: '18:00' }],
          tue: [{ start: '09:00', end: '18:00' }],
          wed: [{ start: '09:00', end: '18:00' }],
          thu: [{ start: '09:00', end: '18:00' }],
          fri: [{ start: '09:00', end: '18:00' }],
          sat: [{ start: '09:00', end: '18:00' }],
          sun: [{ start: '09:00', end: '18:00' }]
        }
      })
      const now = new Date('2026-05-03T13:00:00Z') // 10:00 Buenos Aires - open now

      const result = spaceOpen9to18.computeNextOpenAt(now, TZ_BUENOS_AIRES)

      expect(result).toBeNull()
    })

    test('returns next window start when between windows', () => {
      const spaceTwoWindows = Space.fromDto({
        ...validDto,
        openHours: {
          mon: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          tue: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          wed: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          thu: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          fri: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          sat: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ],
          sun: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ]
        }
      })
      // 13:00 Buenos Aires = 16:00 UTC (between morning and afternoon windows)
      const now = new Date('2026-05-03T16:00:00Z')

      const result = spaceTwoWindows.computeNextOpenAt(now, TZ_BUENOS_AIRES)

      // 14:00 Buenos Aires = 17:00 UTC
      expect(result?.toISOString()).toBe('2026-05-03T17:00:00.000Z')
    })
  })

  describe('isOpenAt()', () => {
    test('accepts booking within open hours', () => {
      const space = Space.fromDto(validDto)
      const range = TimeRange.create({
        start: new Date('2026-05-04T10:00:00-03:00'),
        end: new Date('2026-05-04T11:00:00-03:00')
      })

      expect(space.isOpenAt(range, TZ)).toBe(true)
    })

    test('rejects booking when space is closed that day', () => {
      const closedDto = {
        ...validDto,
        openHours: { ...validDto.openHours, mon: [] }
      }
      const space = Space.fromDto(closedDto)
      const range = TimeRange.create({
        start: new Date('2026-05-04T10:00:00-03:00'),
        end: new Date('2026-05-04T11:00:00-03:00')
      })

      expect(space.isOpenAt(range, TZ)).toBe(false)
    })
  })
})
