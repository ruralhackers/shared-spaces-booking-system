import type { Clock } from '@dfs/common'
import type { BookingRepository } from '../domain/booking.repository'
import type { BookingSeriesRepository } from '../domain/booking-series.repository'
import { BookingNotFoundError } from '../domain/errors'

export interface AdminCancelBookingSeriesInput {
  seriesId: string
  scope: 'this' | 'thisAndFuture'
  /**
   * Required for `scope: 'this'`. For `scope: 'thisAndFuture'` it pins the
   * cutoff; when omitted, the canceller uses `clock.now()` as the cutoff.
   */
  occurrenceId?: string
}

export interface AdminCancelBookingSeriesResult {
  cancelledCount: number
}

export class AdminBookingSeriesCanceller {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly seriesRepo: BookingSeriesRepository,
    private readonly clock: Clock
  ) {}

  async run(input: AdminCancelBookingSeriesInput): Promise<AdminCancelBookingSeriesResult> {
    const series = await this.seriesRepo.findById(input.seriesId)
    if (!series) {
      throw new BookingNotFoundError(input.seriesId)
    }

    if (input.scope === 'this') {
      if (!input.occurrenceId) {
        throw new BookingNotFoundError('occurrence-required')
      }
      const occurrence = await this.bookingRepo.findById(input.occurrenceId)
      if (!occurrence) {
        throw new BookingNotFoundError(input.occurrenceId)
      }
      occurrence.cancelByAdmin(this.clock)
      await this.bookingRepo.save(occurrence)
      return { cancelledCount: 1 }
    }

    const cutoff = await this.resolveCutoff(input.occurrenceId)

    const allBookings = await this.bookingRepo.listAllActive()
    const futureBookings = allBookings.filter((b) => {
      const dto = b.toDto()
      return dto.seriesId === input.seriesId && new Date(dto.startsAt) >= cutoff
    })

    for (const booking of futureBookings) {
      booking.cancelByAdmin(this.clock)
      await this.bookingRepo.save(booking)
    }

    return { cancelledCount: futureBookings.length }
  }

  private async resolveCutoff(occurrenceId: string | undefined): Promise<Date> {
    if (!occurrenceId) {
      return this.clock.now()
    }
    const occurrence = await this.bookingRepo.findById(occurrenceId)
    if (!occurrence) {
      throw new BookingNotFoundError(occurrenceId)
    }
    return new Date(occurrence.toDto().startsAt)
  }
}
