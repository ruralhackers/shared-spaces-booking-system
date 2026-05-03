import { describe, expect, test } from 'bun:test'
import { ValidationError } from '@dfs/common'
import { RecurrenceFrequency } from './recurrence-frequency.vo'

describe('RecurrenceFrequency', () => {
  test('creates daily frequency', () => {
    const frequency = RecurrenceFrequency.create('daily')
    expect(frequency.toString()).toBe('daily')
  })

  test('creates weekly frequency', () => {
    const frequency = RecurrenceFrequency.create('weekly')
    expect(frequency.toString()).toBe('weekly')
  })

  test('rejects invalid frequency', () => {
    expect(() => RecurrenceFrequency.create('monthly')).toThrow(ValidationError)
    expect(() => RecurrenceFrequency.create('')).toThrow(ValidationError)
  })
})
