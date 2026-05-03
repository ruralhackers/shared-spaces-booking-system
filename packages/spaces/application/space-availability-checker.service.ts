import { TimeRange } from '@dfs/common'
import type { BookingRepository } from '../domain/booking.repository'
import type { SpaceRepository } from '../domain/space.repository'
import { SpaceAvailability, type SpaceAvailabilityDto } from '../domain/space-availability.vo'

export interface CheckAvailabilityInput {
  startsAt: Date
  endsAt: Date
  tz: string
}

export class SpaceAvailabilityChecker {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async run(input: CheckAvailabilityInput): Promise<SpaceAvailabilityDto[]> {
    const spaces = await this.spaceRepo.listAll()
    const range = TimeRange.create({ start: input.startsAt, end: input.endsAt })

    const availabilities = await Promise.all(
      spaces.map(async (space) => {
        const spaceDto = space.toDto()

        if (!space.isOpenAt(range, input.tz)) {
          return SpaceAvailability.closed(
            spaceDto.slug,
            spaceDto.displayName,
            spaceDto.color
          ).toDto()
        }

        const overlapping = await this.bookingRepo.findOverlapping(
          spaceDto.id,
          input.startsAt,
          input.endsAt
        )

        const firstBooking = overlapping[0]
        if (firstBooking) {
          return SpaceAvailability.occupied(
            spaceDto.slug,
            spaceDto.displayName,
            firstBooking.toDto().bookerName,
            spaceDto.color
          ).toDto()
        }

        return SpaceAvailability.available(
          spaceDto.slug,
          spaceDto.displayName,
          spaceDto.color
        ).toDto()
      })
    )

    return availabilities
  }
}
