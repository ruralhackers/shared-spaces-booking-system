import { describe, expect, test } from 'bun:test'
import { TimeRange, ValidationError } from '@dfs/common'
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
