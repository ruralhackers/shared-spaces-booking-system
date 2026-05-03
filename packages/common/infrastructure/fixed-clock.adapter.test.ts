import { describe, expect, test } from 'bun:test'
import { FixedClock } from './fixed-clock.adapter'

describe('The FixedClock', () => {
  test('now() returns the fixed instant', () => {
    const instant = new Date('2026-05-01T10:00:00Z')
    const clock = new FixedClock(instant)

    expect(clock.now()).toEqual(instant)
  })

  test('advance(ms) moves the instant forward', () => {
    const instant = new Date('2026-05-01T10:00:00Z')
    const clock = new FixedClock(instant)

    clock.advance(60_000)

    expect(clock.now()).toEqual(new Date('2026-05-01T10:01:00Z'))
  })

  test('advance(ms) does not mutate the original Date passed in', () => {
    const instant = new Date('2026-05-01T10:00:00Z')
    const clock = new FixedClock(instant)

    clock.advance(60_000)

    expect(instant).toEqual(new Date('2026-05-01T10:00:00Z'))
  })
})
