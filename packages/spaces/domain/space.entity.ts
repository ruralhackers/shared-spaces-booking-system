import { Id, type TimeRange, ValidationError } from '@dfs/common'
import { toZonedTime } from 'date-fns-tz'
import type { Booking } from './booking.entity'
import { type DayKey, type OpenHours, openHoursContains, validateOpenHours } from './open-hours'

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getUtcOffsetMs(date: Date, tz: string): number {
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

function parseHhmmForDate(hhmm: string, baseDate: Date, tz: string): Date {
  const [hStr, mStr] = hhmm.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  const zoned = toZonedTime(baseDate, tz)
  const year = zoned.getFullYear()
  const month = zoned.getMonth()
  const day = zoned.getDate()
  if (h === 24) {
    return new Date(Date.UTC(year, month, day + 1, 0, 0, 0) + getUtcOffsetMs(baseDate, tz))
  }
  const localMs = Date.UTC(year, month, day, h, m, 0)
  return new Date(localMs + getUtcOffsetMs(baseDate, tz))
}


export interface SpaceDto {
  id: string
  slug: string
  displayName: string
  description: string
  openHours: OpenHours
  color: string | null
}

export interface CreateSpaceParams {
  slug: string
  name: string
  description: string
  openHours: OpenHours
  color?: string | null
}

export interface UpdateSpaceDetailsParams {
  name?: string
  description?: string
  openHours?: OpenHours
  color?: string | null
}

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100

function assertValidName(name: string): void {
  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Space name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`
    )
  }
}

export class Space {
  private displayName: string
  private description: string
  private openHours: OpenHours
  private color: string | null

  private constructor(
    private readonly id: Id,
    private readonly slug: string,
    displayName: string,
    description: string,
    openHours: OpenHours,
    color: string | null
  ) {
    this.displayName = displayName
    this.description = description
    this.openHours = openHours
    this.color = color
  }

  static create(params: CreateSpaceParams): Space {
    assertValidName(params.name)
    validateOpenHours(params.openHours)
    return new Space(
      Id.generateUniqueId(),
      params.slug,
      params.name,
      params.description,
      params.openHours,
      params.color ?? null
    )
  }

  static fromDto(dto: SpaceDto): Space {
    return new Space(
      Id.fromString(dto.id),
      dto.slug,
      dto.displayName,
      dto.description,
      dto.openHours,
      dto.color
    )
  }

  updateDetails(params: UpdateSpaceDetailsParams): void {
    if (params.name !== undefined) {
      assertValidName(params.name)
      this.displayName = params.name
    }
    if (params.description !== undefined) {
      this.description = params.description
    }
    if (params.openHours !== undefined) {
      validateOpenHours(params.openHours)
      this.openHours = params.openHours
    }
    if (params.color !== undefined) {
      this.color = params.color
    }
  }

  isOpenAt(range: TimeRange, tz: string): boolean {
    return openHoursContains(this.openHours, range, tz)
  }

  computeFreeUntil(bookings: Booking[], now: Date, tz: string): Date | null {
    const dayKey = DAY_KEYS[toZonedTime(now, tz).getDay()]
    if (!dayKey) return null
    const windows = this.openHours[dayKey]
    if (!windows || windows.length === 0) return null

    const nowMs = now.getTime()
    const currentWindow = windows.find((w) => {
      const start = parseHhmmForDate(w.start, now, tz)
      const end = parseHhmmForDate(w.end, now, tz)
      return start.getTime() <= nowMs && nowMs < end.getTime()
    })

    if (!currentWindow) return null

    const closeTime = parseHhmmForDate(currentWindow.end, now, tz)

    const nextBooking = bookings
      .filter((b) => {
        const dto = b.toDto()
        return dto.status === 'active' && new Date(dto.startsAt).getTime() > nowMs
      })
      .sort((a, b) => new Date(a.toDto().startsAt).getTime() - new Date(b.toDto().startsAt).getTime())[0]

    if (!nextBooking) return closeTime

    const nextStart = new Date(nextBooking.toDto().startsAt)
    return nextStart.getTime() < closeTime.getTime() ? nextStart : closeTime
  }

  computeNextOpenAt(now: Date, tz: string): Date | null {
    const dayKey = DAY_KEYS[toZonedTime(now, tz).getDay()]
    if (!dayKey) return null
    const windows = this.openHours[dayKey]
    if (!windows || windows.length === 0) return null

    const nowMs = now.getTime()

    // If currently open, return null
    const isOpenNow = windows.some((w) => {
      const start = parseHhmmForDate(w.start, now, tz)
      const end = parseHhmmForDate(w.end, now, tz)
      return start.getTime() <= nowMs && nowMs < end.getTime()
    })
    if (isOpenNow) return null

    // Find first window that starts after now
    const nextWindow = windows
      .map((w) => ({ w, start: parseHhmmForDate(w.start, now, tz) }))
      .filter(({ start }) => start.getTime() > nowMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

    return nextWindow ? nextWindow.start : null
  }

  toDto(): SpaceDto {
    return {
      id: this.id.toString(),
      slug: this.slug,
      displayName: this.displayName,
      description: this.description,
      openHours: this.openHours,
      color: this.color
    }
  }
}
