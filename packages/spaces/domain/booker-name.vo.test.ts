import { describe, expect, test } from 'bun:test'
import { ValidationError } from '@dfs/common'
import { BookerName } from './booker-name.vo'

describe('The BookerName value object', () => {
  describe('create()', () => {
    test('accepts valid name', () => {
      const name = BookerName.create('Ana Pérez')

      expect(name.toString()).toBe('Ana Pérez')
    })

    test('normalizes surrounding whitespace', () => {
      const name = BookerName.create('  Ana Pérez  ')

      expect(name.toString()).toBe('Ana Pérez')
    })

    test('normalizes internal whitespace', () => {
      const name = BookerName.create('Ana   Pérez')

      expect(name.toString()).toBe('Ana Pérez')
    })

    test('rejects whitespace-only input', () => {
      expect(() => BookerName.create('   ')).toThrow(ValidationError)
    })

    test('rejects name shorter than 2 characters', () => {
      expect(() => BookerName.create('A')).toThrow(ValidationError)
    })

    test('rejects name longer than 60 characters', () => {
      expect(() => BookerName.create('A'.repeat(61))).toThrow(ValidationError)
    })

    test('rejects name containing <', () => {
      expect(() => BookerName.create('<script>')).toThrow(ValidationError)
    })

    test('rejects name containing >', () => {
      expect(() => BookerName.create('foo>bar')).toThrow(ValidationError)
    })

    test('accepts exactly 2 characters', () => {
      expect(() => BookerName.create('AB')).not.toThrow()
    })

    test('accepts exactly 60 characters', () => {
      expect(() => BookerName.create('A'.repeat(60))).not.toThrow()
    })
  })

  describe('equals()', () => {
    test('matches exact same name', () => {
      const a = BookerName.create('Ana Pérez')
      const b = BookerName.create('Ana Pérez')

      expect(a.equals(b)).toBe(true)
    })

    test('matches case-insensitively', () => {
      const a = BookerName.create('Ana Pérez')
      const b = BookerName.create('ana pérez')

      expect(a.equals(b)).toBe(true)
    })

    test('matches when whitespace differs', () => {
      const a = BookerName.create('Ana Pérez')
      const b = BookerName.create('  Ana   Pérez  ')

      expect(a.equals(b)).toBe(true)
    })

    test('rejects different names', () => {
      const a = BookerName.create('Ana Pérez')
      const b = BookerName.create('Ana')

      expect(a.equals(b)).toBe(false)
    })
  })
})
