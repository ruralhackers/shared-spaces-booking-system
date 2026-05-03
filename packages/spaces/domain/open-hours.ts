import type { TimeRange } from '@dfs/common'
import { ValidationError } from '@dfs/common'
import { toZonedTime } from 'date-fns-tz'

export interface OpenHoursWindow {
  start: string
  end: string
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type OpenHours = Record<DayKey, OpenHoursWindow[]>

export const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function parseHhmmForDate(hhmm: string, baseDate: Date, tz: string): Date {
  const [hStr, mStr] = hhmm.split(':')
  const h = Number(hStr)
  const m = Number(mStr)

  const zoned = toZonedTime(baseDate, tz)
  const year = zoned.getFullYear()
  const month = zoned.getMonth()
  const day = zoned.getDate()

  // Handle "24:00" as midnight of the next day
  if (h === 24) {
    return new Date(Date.UTC(year, month, day + 1, 0, 0, 0) + getUtcOffsetMs(baseDate, tz))
  }

  const localMs = Date.UTC(year, month, day, h, m, 0)
  return new Date(localMs + getUtcOffsetMs(baseDate, tz))
}

export function getUtcOffsetMs(date: Date, tz: string): number {
  const zoned = toZonedTime(date, tz)
  const utcMs = date.getTime()
  const zonedMs = Date.UTC(
    zoned.getFullYear(),
    zoned.getMonth(),
    zoned.getDate(),
    zoned.getHours(),
    zoned.getMinutes(),
    zoned.getSeconds(),
    zoned.getMilliseconds()
  )
  return utcMs - zonedMs
}

export function openHoursContains(openHours: OpenHours, range: TimeRange, tz: string): boolean {
  const start = range.getStart()
  const dayKey = DAY_KEYS[toZonedTime(start, tz).getDay()]

  if (!dayKey) return false

  const windows = openHours[dayKey]
  if (!windows || windows.length === 0) return false

  return windows.some((window) => {
    const windowStart = parseHhmmForDate(window.start, start, tz)
    const windowEnd = parseHhmmForDate(window.end, start, tz)
    return (
      range.getStart().getTime() >= windowStart.getTime() &&
      range.getEnd().getTime() <= windowEnd.getTime()
    )
  })
}

const HHMM_RE = /^(?:[01]\d|2[0-4]):[0-5]\d$/

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

export function validateOpenHours(openHours: OpenHours): void {
  const days = Object.keys(openHours) as DayKey[]
  for (const day of days) {
    const windows = openHours[day]
    for (const w of windows) {
      if (!HHMM_RE.test(w.start) || !HHMM_RE.test(w.end)) {
        throw new ValidationError(
          `Invalid time format in open hours for ${day}: "${w.start}"–"${w.end}". Use HH:mm.`
        )
      }
      const startMin = parseMinutes(w.start)
      const endMin = parseMinutes(w.end)
      if (endMin <= startMin) {
        throw new ValidationError(
          `Open hours window for ${day} must have end after start: "${w.start}"–"${w.end}".`
        )
      }
    }
    // Check overlaps
    const sorted = [...windows].sort((a, b) => parseMinutes(a.start) - parseMinutes(b.start))
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1] as OpenHoursWindow
      const curr = sorted[i] as OpenHoursWindow
      if (parseMinutes(curr.start) < parseMinutes(prev.end)) {
        throw new ValidationError(
          `Overlapping open hours windows for ${day}: "${prev.start}"–"${prev.end}" and "${curr.start}"–"${curr.end}".`
        )
      }
    }
  }
}
