import type { Clock } from '@dfs/common'
import { BookerName } from '../domain/booker-name.vo'
import type { BookingRepository } from '../domain/booking.repository'
import type { BookingSeriesRepository } from '../domain/booking-series.repository'
import { BookingNotFoundError, NameMismatchError } from '../domain/errors'

export interface CancelBookingSeriesInput {
  seriesId: string
  scope: 'this' | 'thisAndFuture'
  occurrenceId: string
  bookerName: string
}

export interface CancelBookingSeriesResult {
  cancelledCount: number
}

export class BookingSeriesCanceller {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly seriesRepo: BookingSeriesRepository,
    private readonly clock: Clock
  ) {}

  async run(input: CancelBookingSeriesInput): Promise<CancelBookingSeriesResult> {
    const series = await this.seriesRepo.findById(input.seriesId)
    if (!series) {
      throw new BookingNotFoundError(input.seriesId)
    }

    const seriesDto = series.toDto()
    const inputName = BookerName.create(input.bookerName)
    const seriesName = BookerName.create(seriesDto.bookerName)

    if (!inputName.equals(seriesName)) {
      throw new NameMismatchError()
    }

    const occurrence = await this.bookingRepo.findById(input.occurrenceId)
    if (!occurrence) {
      throw new BookingNotFoundError(input.occurrenceId)
    }

    if (input.scope === 'this') {
      occurrence.cancelByBooker(inputName, this.clock)
      await this.bookingRepo.save(occurrence)
      return { cancelledCount: 1 }
    }

    // scope: thisAndFuture
    const occurrenceDto = occurrence.toDto()
    const occurrenceStart = new Date(occurrenceDto.startsAt)

    // Find all bookings in this series with startsAt >= occurrence.startsAt
    const allBookings = await this.bookingRepo.listAllActive()
    const futureBookings = allBookings.filter((b) => {
      const dto = b.toDto()
      return dto.seriesId === input.seriesId && new Date(dto.startsAt) >= occurrenceStart
    })

    for (const booking of futureBookings) {
      booking.cancelByBooker(inputName, this.clock)
      await this.bookingRepo.save(booking)
    }

    return { cancelledCount: futureBookings.length }
  }
}
