import { describe, expect, test } from 'bun:test'
import { ValidationError } from '../errors'
import { TimeRange } from './time-range.vo'

describe('The TimeRange value object', () => {
  const t = (iso: string) => new Date(iso)

  describe('create()', () => {
    test('accepts a valid range', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(range).toBeDefined()
    })

    test('rejects zero-duration range', () => {
      const d = t('2026-05-01T10:00:00Z')
      expect(() => TimeRange.create({ start: d, end: d })).toThrow(ValidationError)
    })

    test('rejects negative-duration range', () => {
      expect(() =>
        TimeRange.create({
          start: t('2026-05-01T11:00:00Z'),
          end: t('2026-05-01T10:00:00Z')
        })
      ).toThrow(ValidationError)
    })
  })

  describe('overlaps()', () => {
    test('returns true for overlapping ranges', () => {
      const a = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      const b = TimeRange.create({
        start: t('2026-05-01T10:30:00Z'),
        end: t('2026-05-01T11:30:00Z')
      })
      expect(a.overlaps(b)).toBe(true)
    })

    test('returns false for adjacent ranges (end == start)', () => {
      const a = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      const b = TimeRange.create({
        start: t('2026-05-01T11:00:00Z'),
        end: t('2026-05-01T12:00:00Z')
      })
      expect(a.overlaps(b)).toBe(false)
    })

    test('returns false for non-overlapping ranges', () => {
      const a = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      const b = TimeRange.create({
        start: t('2026-05-01T12:00:00Z'),
        end: t('2026-05-01T13:00:00Z')
      })
      expect(a.overlaps(b)).toBe(false)
    })

    test('returns true when one range contains the other', () => {
      const outer = TimeRange.create({
        start: t('2026-05-01T09:00:00Z'),
        end: t('2026-05-01T13:00:00Z')
      })
      const inner = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(outer.overlaps(inner)).toBe(true)
    })
  })

  describe('contains()', () => {
    test('returns true for an instant inside the range', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(range.contains(t('2026-05-01T10:30:00Z'))).toBe(true)
    })

    test('returns true for the start instant (inclusive)', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(range.contains(t('2026-05-01T10:00:00Z'))).toBe(true)
    })

    test('returns false for the end instant (exclusive)', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(range.contains(t('2026-05-01T11:00:00Z'))).toBe(false)
    })

    test('returns false for an instant outside the range', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(range.contains(t('2026-05-01T12:00:00Z'))).toBe(false)
    })
  })

  describe('durationMs()', () => {
    test('returns the duration in milliseconds', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      expect(range.durationMs()).toBe(3_600_000)
    })
  })

  describe('toDto() / fromDto()', () => {
    test('round-trips through DTO', () => {
      const range = TimeRange.create({
        start: t('2026-05-01T10:00:00Z'),
        end: t('2026-05-01T11:00:00Z')
      })
      const dto = range.toDto()
      const restored = TimeRange.fromDto(dto)
      expect(restored.toDto()).toEqual(dto)
    })
  })
})
