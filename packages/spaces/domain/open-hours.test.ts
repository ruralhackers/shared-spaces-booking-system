import { describe, expect, test } from 'bun:test'
import { TimeRange, ValidationError } from '@dfs/common'
import { openHoursContains, validateOpenHours } from './open-hours'

const TZ = 'America/Argentina/Buenos_Aires'

// 2026-05-04 is a Monday
const monday = (startHour: number, endHour: number) =>
  TimeRange.create({
    start: new Date(`2026-05-04T${String(startHour).padStart(2, '0')}:00:00-03:00`),
    end: new Date(`2026-05-04T${String(endHour).padStart(2, '0')}:00:00-03:00`)
  })

describe('openHoursContains()', () => {
  test('accepts a range on a fully open day (24/7)', () => {
    const openHours = {
      mon: [{ start: '00:00', end: '24:00' }],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
    }
    expect(openHoursContains(openHours, monday(10, 11), TZ)).toBe(true)
  })

  test('rejects a range on a closed day (empty windows)', () => {
    const openHours = {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
    }
    expect(openHoursContains(openHours, monday(10, 11), TZ)).toBe(false)
  })

  test('accepts a range fully inside one window', () => {
    const openHours = {
      mon: [{ start: '07:00', end: '23:00' }],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
    }
    expect(openHoursContains(openHours, monday(10, 11), TZ)).toBe(true)
  })

  test('rejects a range that starts before the window', () => {
    const openHours = {
      mon: [{ start: '07:00', end: '23:00' }],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
    }
    expect(openHoursContains(openHours, monday(6, 8), TZ)).toBe(false)
  })

  test('rejects a range that straddles a midday closure', () => {
    const openHours = {
      mon: [
        { start: '07:00', end: '12:00' },
        { start: '14:00', end: '23:00' }
      ],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
    }
    // 11:00–14:30 straddles the closure
    const range = TimeRange.create({
      start: new Date('2026-05-04T11:00:00-03:00'),
      end: new Date('2026-05-04T14:30:00-03:00')
    })
    expect(openHoursContains(openHours, range, TZ)).toBe(false)
  })

  test('accepts a range fully inside the second window of a midday closure', () => {
    const openHours = {
      mon: [
        { start: '07:00', end: '12:00' },
        { start: '14:00', end: '23:00' }
      ],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: []
    }
    expect(openHoursContains(openHours, monday(15, 16), TZ)).toBe(true)
  })
})

describe('validateOpenHours()', () => {
  const allClosed = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }

  test('accepts valid 24/7 open hours', () => {
    const openHours = {
      mon: [{ start: '00:00', end: '24:00' }],
      tue: [{ start: '00:00', end: '24:00' }],
      wed: [{ start: '00:00', end: '24:00' }],
      thu: [{ start: '00:00', end: '24:00' }],
      fri: [{ start: '00:00', end: '24:00' }],
      sat: [{ start: '00:00', end: '24:00' }],
      sun: [{ start: '00:00', end: '24:00' }]
    }
    expect(() => validateOpenHours(openHours)).not.toThrow()
  })

  test('accepts valid business hours', () => {
    const openHours = { ...allClosed, mon: [{ start: '09:00', end: '18:00' }] }
    expect(() => validateOpenHours(openHours)).not.toThrow()
  })

  test('accepts valid split hours', () => {
    const openHours = {
      ...allClosed,
      mon: [
        { start: '07:00', end: '12:00' },
        { start: '14:00', end: '23:00' }
      ]
    }
    expect(() => validateOpenHours(openHours)).not.toThrow()
  })

  test('detects invalid time format', () => {
    const openHours = { ...allClosed, mon: [{ start: '9:00', end: '18:00' }] }

    expect(() => validateOpenHours(openHours)).toThrow(ValidationError)
  })

  test('detects zero-duration window', () => {
    const openHours = { ...allClosed, mon: [{ start: '09:00', end: '09:00' }] }

    expect(() => validateOpenHours(openHours)).toThrow(ValidationError)
  })

  test('detects negative-duration window', () => {
    const openHours = { ...allClosed, mon: [{ start: '18:00', end: '09:00' }] }

    expect(() => validateOpenHours(openHours)).toThrow(ValidationError)
  })

  test('detects overlapping windows', () => {
    const openHours = {
      ...allClosed,
      mon: [
        { start: '07:00', end: '14:00' },
        { start: '12:00', end: '20:00' }
      ]
    }

    expect(() => validateOpenHours(openHours)).toThrow(ValidationError)
  })
})
