import { BusinessRuleError, type Clock, Id, TimeRange, ValidationError } from '@dfs/common'
import { toZonedTime } from 'date-fns-tz'
import { BookerName } from './booker-name.vo'
import { BookingOverlapError } from './errors/booking-overlap.error'
import { NameMismatchError } from './errors/name-mismatch.error'
import { OutsideOpenHoursError } from './errors/outside-open-hours.error'
import type { Space } from './space.entity'

export type BookingStatus = 'active' | 'cancelled'
export type CancelledBy = 'booker' | 'admin'

export interface BookingDto {
  id: string
  spaceId: string
  seriesId: string | null
  bookerName: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  createdAt: string
  cancelledAt: string | null
  cancelledBy: CancelledBy | null
}

export interface CreateBookingParams {
  space: Space
  range: TimeRange
  bookerName: BookerName
  existing: Booking[]
  clock: Clock
  tz: string
  seriesId?: string
}

export class Booking {
  private status: BookingStatus
  private cancelledAt: Date | null
  private cancelledBy: CancelledBy | null

  private constructor(
    private readonly id: Id,
    private readonly spaceId: string,
    private readonly seriesId: string | null,
    private readonly bookerName: BookerName,
    private readonly range: TimeRange,
    private readonly createdAt: Date,
    status: BookingStatus,
    cancelledAt: Date | null,
    cancelledBy: CancelledBy | null
  ) {
    this.status = status
    this.cancelledAt = cancelledAt
    this.cancelledBy = cancelledBy
  }

  static create(params: CreateBookingParams): Booking {
    const { space, range, bookerName, existing, clock, tz, seriesId } = params

    // Reject cross-midnight bookings
    const startZoned = toZonedTime(range.getStart(), tz)
    const endZoned = toZonedTime(range.getEnd(), tz)
    if (
      startZoned.getFullYear() !== endZoned.getFullYear() ||
      startZoned.getMonth() !== endZoned.getMonth() ||
      startZoned.getDate() !== endZoned.getDate()
    ) {
      throw new ValidationError('Bookings cannot span midnight')
    }

    if (!space.isOpenAt(range, tz)) {
      throw new OutsideOpenHoursError(space.toDto().slug)
    }

    for (const existingBooking of existing) {
      if (existingBooking.isActive() && existingBooking.overlaps(range)) {
        throw new BookingOverlapError(space.toDto().slug)
      }
    }

    return new Booking(
      Id.generateUniqueId(),
      space.toDto().id,
      seriesId ?? null,
      bookerName,
      range,
      clock.now(),
      'active',
      null,
      null
    )
  }

  static fromDto(dto: BookingDto): Booking {
    return new Booking(
      Id.fromString(dto.id),
      dto.spaceId,
      dto.seriesId,
      BookerName.create(dto.bookerName),
      TimeRange.fromDto({ start: dto.startsAt, end: dto.endsAt }),
      new Date(dto.createdAt),
      dto.status,
      dto.cancelledAt ? new Date(dto.cancelledAt) : null,
      dto.cancelledBy
    )
  }

  cancelByBooker(name: BookerName, clock: Clock): void {
    this.assertActive()
    if (!this.bookerName.equals(name)) {
      throw new NameMismatchError()
    }
    this.status = 'cancelled'
    this.cancelledAt = clock.now()
    this.cancelledBy = 'booker'
  }

  cancelByAdmin(clock: Clock): void {
    this.assertActive()
    this.status = 'cancelled'
    this.cancelledAt = clock.now()
    this.cancelledBy = 'admin'
  }

  isActive(): boolean {
    return this.status === 'active'
  }

  overlaps(range: TimeRange): boolean {
    return this.range.overlaps(range)
  }

  toDto(): BookingDto {
    return {
      id: this.id.toString(),
      spaceId: this.spaceId,
      seriesId: this.seriesId,
      bookerName: this.bookerName.toString(),
      startsAt: this.range.getStart().toISOString(),
      endsAt: this.range.getEnd().toISOString(),
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      cancelledAt: this.cancelledAt?.toISOString() ?? null,
      cancelledBy: this.cancelledBy
    }
  }

  private assertActive(): void {
    if (this.status !== 'active') {
      throw new BusinessRuleError('Booking is already cancelled', 'BOOKING_ALREADY_CANCELLED')
    }
  }
}
