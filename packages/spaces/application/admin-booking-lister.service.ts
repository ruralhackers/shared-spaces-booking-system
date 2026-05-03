import type { BookingRepository } from '../domain/booking.repository'
import type { SpaceRepository } from '../domain/space.repository'
import type { BookingDto } from './dtos'

export class AdminBookingLister {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async run(): Promise<BookingDto[]> {
    const bookings = await this.bookingRepo.listAllActive()
    const spaceIds = [...new Set(bookings.map((b) => b.toDto().spaceId))]
    const spaces = await Promise.all(spaceIds.map((id) => this.spaceRepo.findById(id)))
    const spaceMap = new Map(
      spaces.filter((s): s is NonNullable<typeof s> => s !== null).map((s) => [s.toDto().id, s])
    )

    return bookings.map((b) => {
      const dto = b.toDto()
      const space = spaceMap.get(dto.spaceId)
      return {
        ...dto,
        spaceSlug: space?.toDto().slug ?? '',
        spaceDisplayName: space?.toDto().displayName ?? ''
      }
    })
  }
}
