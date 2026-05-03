import type { Clock } from '@dfs/common'
import type { Booking } from '../domain/booking.entity'
import type { BookingRepository } from '../domain/booking.repository'
import type { Space } from '../domain/space.entity'
import type { SpaceRepository } from '../domain/space.repository'
import type { SpaceDto } from './dtos'

export class SpaceLister {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly clock: Clock,
    private readonly tz: string
  ) {}

  async run(): Promise<SpaceDto[]> {
    const now = this.clock.now()
    const [spaces, todayBookings] = await Promise.all([
      this.spaceRepo.listAll(),
      this.bookingRepo.findForDate(now, this.tz)
    ])
    const activeBookings = todayBookings.filter((b) => b.toDto().status === 'active')
    return spaces.map((s) => this.toSpaceDto(s, activeBookings, now))
  }

  private toSpaceDto(space: Space, bookings: Booking[], now: Date): SpaceDto {
    return {
      ...space.toDto(),
      isOccupiedNow: this.isOccupiedNow(space, bookings, now),
      currentStatus: this.computeStatusForSpace(space, bookings, now, this.tz)
    }
  }

  private isOccupiedNow(space: Space, bookings: Booking[], now: Date): boolean {
    const nowMs = now.getTime()
    const spaceId = space.toDto().id
    return bookings.some((b) => {
      const dto = b.toDto()
      return (
        dto.spaceId === spaceId &&
        dto.status === 'active' &&
        new Date(dto.startsAt).getTime() <= nowMs &&
        new Date(dto.endsAt).getTime() >= nowMs
      )
    })
  }

  private computeStatusForSpace(
    space: Space,
    bookings: Booking[],
    now: Date,
    tz: string
  ): SpaceDto['currentStatus'] {
    const spaceId = space.toDto().id
    const spaceBookings = bookings.filter((b) => b.toDto().spaceId === spaceId)
    const nowMs = now.getTime()

    // Check if occupied now
    const currentBooking = spaceBookings.find((b) => {
      const dto = b.toDto()
      return (
        dto.status === 'active' &&
        new Date(dto.startsAt).getTime() <= nowMs &&
        new Date(dto.endsAt).getTime() >= nowMs
      )
    })

    if (currentBooking) {
      const dto = currentBooking.toDto()
      return {
        state: 'occupied',
        occupiedBy: dto.bookerName,
        occupiedUntil: dto.endsAt
      }
    }

    // Check if open now
    const freeUntil = space.computeFreeUntil(spaceBookings, now, tz)
    if (freeUntil !== null) {
      const freeWindowMinutes = Math.round((freeUntil.getTime() - nowMs) / 60_000)
      return {
        state: 'free',
        freeUntil: freeUntil.toISOString(),
        freeWindowMinutes
      }
    }

    // Space is closed
    const nextOpenAt = space.computeNextOpenAt(now, tz)
    return {
      state: 'closed',
      nextOpenAt: nextOpenAt?.toISOString() ?? null
    }
  }
}
