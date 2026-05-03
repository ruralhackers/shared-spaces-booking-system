import type { Clock } from '@dfs/common'
import { addDays } from 'date-fns'
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

    // Normalize end to date
    const firstDate = new Date(input.startsAt)
    firstDate.setHours(0, 0, 0, 0)

    let endDate: Date
    if (input.end.type === 'date') {
      endDate = new Date(input.end.value as string)
      endDate.setHours(0, 0, 0, 0)
    } else {
      // count
      const count = input.end.value as number
      endDate = new Date(firstDate)
      if (frequency.toString() === 'daily') {
        endDate = addDays(endDate, count - 1)
      } else {
        // weekly
        endDate = addDays(endDate, (count - 1) * 7)
      }
    }

    // Extract time from input
    const startTime = `${String(input.startsAt.getHours()).padStart(2, '0')}:${String(input.startsAt.getMinutes()).padStart(2, '0')}`
    const endTime = `${String(input.endsAt.getHours()).padStart(2, '0')}:${String(input.endsAt.getMinutes()).padStart(2, '0')}`

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
        skipped.push({
          date: dateStr,
          reason: this.getErrorMessage(error)
        })
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
