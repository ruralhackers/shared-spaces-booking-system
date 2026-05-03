import type { Clock } from '@dfs/common'
import { BookerName } from '../domain/booker-name.vo'
import type { BookingRepository } from '../domain/booking.repository'
import { BookingNotFoundError, SpaceNotFoundError } from '../domain/errors'
import type { Notifier } from '../domain/notifier.port'
import type { SpaceRepository } from '../domain/space.repository'
import type { BookingDto } from './dtos'

export interface CancelBookingInput {
  id: string
  bookerName: string
}

export class BookingCanceller {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock
  ) {}

  async run(input: CancelBookingInput): Promise<BookingDto> {
    const booking = await this.bookingRepo.findById(input.id)
    if (!booking) throw new BookingNotFoundError(input.id)

    const space = await this.spaceRepo.findById(booking.toDto().spaceId)
    if (!space) throw new SpaceNotFoundError(booking.toDto().spaceId)

    const bookerName = BookerName.create(input.bookerName)
    booking.cancelByBooker(bookerName, this.clock)
    await this.bookingRepo.save(booking)

    this.notifier.bookingCancelled(booking, space, 'booker')

    return {
      ...booking.toDto(),
      spaceSlug: space.toDto().slug,
      spaceDisplayName: space.toDto().displayName
    }
  }
}
