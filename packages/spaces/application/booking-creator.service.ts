import type { Clock } from '@dfs/common'
import { TimeRange } from '@dfs/common'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import type { BookingRepository } from '../domain/booking.repository'
import { SpaceNotFoundError } from '../domain/errors'
import type { Notifier } from '../domain/notifier.port'
import type { SpaceRepository } from '../domain/space.repository'
import type { BookingDto } from './dtos'

export interface CreateBookingInput {
  slug: string
  bookerName: string
  startsAt: Date
  endsAt: Date
}

export class BookingCreator {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly tz: string
  ) {}

  async run(input: CreateBookingInput): Promise<BookingDto> {
    const space = await this.spaceRepo.findBySlug(input.slug)
    if (!space) throw new SpaceNotFoundError(input.slug)

    const range = TimeRange.create({ start: input.startsAt, end: input.endsAt })
    const bookerName = BookerName.create(input.bookerName)

    const existing = await this.bookingRepo.listActiveOnDay(
      space.toDto().id,
      input.startsAt,
      this.tz
    )

    const booking = Booking.create({
      space,
      range,
      bookerName,
      existing,
      clock: this.clock,
      tz: this.tz
    })
    await this.bookingRepo.save(booking)

    this.notifier.bookingCreated(booking, space)

    return {
      ...booking.toDto(),
      spaceSlug: space.toDto().slug,
      spaceDisplayName: space.toDto().displayName
    }
  }
}
