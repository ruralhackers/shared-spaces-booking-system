import { describe, expect, test } from 'bun:test'
import { SystemClock } from './system-clock.adapter'

describe('The SystemClock', () => {
  test('returns a Date close to Date.now()', () => {
    const clock = new SystemClock()
    const before = Date.now()
    const result = clock.now()
    const after = Date.now()

    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })
})
