import type { Clock } from '@dfs/common'
import { addDays } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import type { BookingRepository } from '../domain/booking.repository'
import { BookingSeries } from '../domain/booking-series.entity'
import type { BookingSeriesRepository } from '../domain/booking-series.repository'
import { EmptySeriesError, SpaceNotFoundError } from '../domain/errors'
import { RecurrenceFrequency } from '../domain/recurrence-frequency.vo'
import type { SpaceRepository } from '../domain/space.repository'
import type { BookingDto } from './dtos'

export interface CreateBookingSeriesInput {
  slug: string
  bookerName: string
  startsAt: Date
  endsAt: Date
  frequency: 'daily' | 'weekly'
  end: { type: 'date' | 'count'; value: string | number }
}

export interface CreateBookingSeriesResult {
  seriesId: string
  created: BookingDto[]
  skipped: Array<{ date: string; reason: string }>
}

export class BookingSeriesCreator {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly seriesRepo: BookingSeriesRepository,
    private readonly clock: Clock,
    private readonly tz: string
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message || 'Unknown error'
    }
    return 'Unknown error'
  }

  async run(input: CreateBookingSeriesInput): Promise<CreateBookingSeriesResult> {
    const space = await this.spaceRepo.findBySlug(input.slug)
    if (!space) throw new SpaceNotFoundError(input.slug)

    const bookerName = BookerName.create(input.bookerName)
    const frequency = RecurrenceFrequency.create(input.frequency)

    // Convert UTC timestamps to local timezone
    const zonedStart = toZonedTime(input.startsAt, this.tz)
    const zonedEnd = toZonedTime(input.endsAt, this.tz)

    // Normalize end to date (use local date, not UTC)
    const firstDateStr = formatInTimeZone(input.startsAt, this.tz, 'yyyy-MM-dd')
    const firstDate = new Date(`${firstDateStr}T00:00:00`)

    let endDate: Date
    if (input.end.type === 'date') {
      endDate = new Date(`${input.end.value as string}T00:00:00`)
    } else {
      // count
      const count = input.end.value as number
      endDate = new Date(`${formatInTimeZone(input.startsAt, this.tz, 'yyyy-MM-dd')}T00:00:00`)
      if (frequency.toString() === 'daily') {
        endDate = addDays(endDate, count - 1)
      } else {
        // weekly
        endDate = addDays(endDate, (count - 1) * 7)
      }
    }

    // Extract time from input in local timezone
    const startTime = `${String(zonedStart.getHours()).padStart(2, '0')}:${String(zonedStart.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(zonedEnd.getHours()).padStart(2, '0')}:${String(zonedEnd.getMinutes()).padStart(2, '0')}`

    const series = BookingSeries.create({
      spaceId: space.toDto().id,
      bookerName: bookerName.toString(),
      frequency,
      startTime,
      endTime,
      firstDate,
      endDate,
      clock: this.clock
    })

    const occurrences = series.expandOccurrences(this.tz)

    const created: BookingDto[] = []
    const skipped: Array<{ date: string; reason: string }> = []

    for (const range of occurrences) {
      const occurrenceDate = range.getStart()
      const existing = await this.bookingRepo.listActiveOnDay(
        space.toDto().id,
        occurrenceDate,
        this.tz
      )

      try {
        const booking = Booking.create({
          space,
          range,
          bookerName,
          existing,
          clock: this.clock,
          tz: this.tz,
          seriesId: series.toDto().id
        })
        await this.bookingRepo.save(booking)
        created.push({
          ...booking.toDto(),
          spaceSlug: space.toDto().slug,
          spaceDisplayName: space.toDto().displayName
        })
      } catch (error) {
        const dateStr = occurrenceDate.toISOString().split('T')[0] ?? occurrenceDate.toISOString()
        const reason = this.getErrorMessage(error)
        console.error(`[BookingSeriesCreator] skipped ${dateStr}: ${reason}`)
        skipped.push({ date: dateStr, reason })
      }
    }

    if (created.length === 0) {
      throw new EmptySeriesError()
    }

    await this.seriesRepo.save(series)

    return {
      seriesId: series.toDto().id,
      created,
      skipped
    }
  }
}
