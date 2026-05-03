import type { BookingSeriesDto } from '../domain/booking-series.entity'
import type { BookingSeriesRepository } from '../domain/booking-series.repository'
import type { SpaceRepository } from '../domain/space.repository'

export interface AdminBookingSeriesItemDto extends BookingSeriesDto {
  spaceSlug: string
  spaceDisplayName: string
}

export interface ListBookingSeriesInput {
  spaceId?: string
}

export class AdminBookingSeriesLister {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly seriesRepo: BookingSeriesRepository
  ) {}

  async run(input?: ListBookingSeriesInput): Promise<AdminBookingSeriesItemDto[]> {
    const series = await this.seriesRepo.listActive(input?.spaceId)

    const spaceIds = [...new Set(series.map((s) => s.toDto().spaceId))]
    const spaces = await Promise.all(spaceIds.map((id) => this.spaceRepo.findById(id)))
    const spaceById = new Map(
      spaces.filter((s): s is NonNullable<typeof s> => s !== null).map((s) => [s.toDto().id, s])
    )

    return series.map((s) => {
      const dto = s.toDto()
      const space = spaceById.get(dto.spaceId)
      return {
        ...dto,
        spaceSlug: space?.toDto().slug ?? '',
        spaceDisplayName: space?.toDto().displayName ?? ''
      }
    })
  }
}
