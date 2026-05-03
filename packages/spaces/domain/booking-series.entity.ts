import { type Clock, Id, TimeRange, ValidationError } from '@dfs/common'
import { addDays } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { RecurrenceFrequency } from './recurrence-frequency.vo'

export interface BookingSeriesDto {
  id: string
  spaceId: string
  bookerName: string
  frequency: string
  startTime: string
  endTime: string
  firstDate: string
  endDate: string
  createdAt: string
}

export interface CreateBookingSeriesParams {
  spaceId: string
  bookerName: string
  frequency: RecurrenceFrequency
  startTime: string
  endTime: string
  firstDate: Date
  endDate: Date
  clock: Clock
}

export class BookingSeries {
  private constructor(
    private readonly id: Id,
    private readonly spaceId: string,
    private readonly bookerName: string,
    private readonly frequency: RecurrenceFrequency,
    private readonly startTime: string,
    private readonly endTime: string,
    private readonly firstDate: Date,
    private readonly endDate: Date,
    private readonly createdAt: Date
  ) {}

  static create(params: CreateBookingSeriesParams): BookingSeries {
    const { spaceId, bookerName, frequency, startTime, endTime, firstDate, endDate, clock } = params

    // Cap series length at 365 occurrences (worst case: daily for 365 days).
    // 365 days inclusive => endDate - firstDate must be <= 364 days.
    const daysDiff = Math.ceil((endDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 364) {
      throw new ValidationError('Series cannot exceed 365 occurrences')
    }

    return new BookingSeries(
      Id.generateUniqueId(),
      spaceId,
      bookerName,
      frequency,
      startTime,
      endTime,
      firstDate,
      endDate,
      clock.now()
    )
  }

  static fromDto(dto: BookingSeriesDto): BookingSeries {
    return new BookingSeries(
      Id.fromString(dto.id),
      dto.spaceId,
      dto.bookerName,
      RecurrenceFrequency.create(dto.frequency),
      dto.startTime,
      dto.endTime,
      new Date(dto.firstDate),
      new Date(dto.endDate),
      new Date(dto.createdAt)
    )
  }

  expandOccurrences(tz: string): TimeRange[] {
    const occurrences: TimeRange[] = []
    let currentDate = new Date(this.firstDate)

    while (currentDate <= this.endDate) {
      const startInstant = fromZonedTime(
        `${currentDate.toISOString().split('T')[0]}T${this.startTime}:00`,
        tz
      )
      const endInstant = fromZonedTime(
        `${currentDate.toISOString().split('T')[0]}T${this.endTime}:00`,
        tz
      )

      occurrences.push(TimeRange.create({ start: startInstant, end: endInstant }))

      if (this.frequency.toString() === 'daily') {
        currentDate = addDays(currentDate, 1)
      } else {
        // weekly
        currentDate = addDays(currentDate, 7)
      }
    }

    return occurrences
  }

  toDto(): BookingSeriesDto {
    return {
      id: this.id.toString(),
      spaceId: this.spaceId,
      bookerName: this.bookerName,
      frequency: this.frequency.toString(),
      startTime: this.startTime,
      endTime: this.endTime,
      firstDate: this.firstDate.toISOString(),
      endDate: this.endDate.toISOString(),
      createdAt: this.createdAt.toISOString()
    }
  }
}
