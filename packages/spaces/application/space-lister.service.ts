import type { BookingRepository } from '../domain/booking.repository'
import type { SpaceRepository } from '../domain/space.repository'
import type { SpaceDto } from './dtos'

export class SpaceLister {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async run(): Promise<SpaceDto[]> {
    const [spaces, activeBookings] = await Promise.all([
      this.spaceRepo.listAll(),
      this.bookingRepo.findActiveAt(new Date())
    ])
    const occupiedSpaceIds = new Set(activeBookings.map((b) => b.toDto().spaceId))
    return spaces.map((s) => ({
      ...s.toDto(),
      isOccupiedNow: occupiedSpaceIds.has(s.toDto().id)
    }))
  }
}
