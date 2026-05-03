import { SpaceNotFoundError } from '../domain/errors'
import type { OpenHours } from '../domain/open-hours'
import type { SpaceDto } from '../domain/space.entity'
import type { SpaceRepository } from '../domain/space.repository'

export interface UpdateSpaceInput {
  slug: string
  name?: string
  description?: string
  openHours?: OpenHours
  color?: string | null
}

export class SpaceUpdater {
  constructor(private readonly spaceRepo: SpaceRepository) {}

  async run(input: UpdateSpaceInput): Promise<SpaceDto> {
    const space = await this.spaceRepo.findBySlug(input.slug)
    if (!space) throw new SpaceNotFoundError(input.slug)

    space.updateDetails({
      name: input.name,
      description: input.description,
      openHours: input.openHours,
      color: input.color
    })

    await this.spaceRepo.save(space)
    return space.toDto()
  }
}
