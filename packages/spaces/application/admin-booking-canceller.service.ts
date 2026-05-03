import type { Clock } from '@dfs/common'
import type { BookingRepository } from '../domain/booking.repository'
import { BookingNotFoundError, SpaceNotFoundError } from '../domain/errors'
import type { Notifier } from '../domain/notifier.port'
import type { SpaceRepository } from '../domain/space.repository'
import type { BookingDto } from './dtos'

export class AdminBookingCanceller {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock
  ) {}

  async run({ id }: { id: string }): Promise<BookingDto> {
    const booking = await this.bookingRepo.findById(id)
    if (!booking) throw new BookingNotFoundError(id)

    const space = await this.spaceRepo.findById(booking.toDto().spaceId)
    if (!space) throw new SpaceNotFoundError(booking.toDto().spaceId)

    booking.cancelByAdmin(this.clock)
    await this.bookingRepo.save(booking)

    this.notifier.bookingCancelled(booking, space, 'admin')

    return {
      ...booking.toDto(),
      spaceSlug: space.toDto().slug,
      spaceDisplayName: space.toDto().displayName
    }
  }
}
