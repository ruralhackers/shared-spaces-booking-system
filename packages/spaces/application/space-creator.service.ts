import { generateSlug } from '@dfs/common'
import { SpaceSlugCollisionError } from '../domain/errors'
import type { OpenHours } from '../domain/open-hours'
import type { SpaceDto } from '../domain/space.entity'
import { Space } from '../domain/space.entity'
import type { SpaceRepository } from '../domain/space.repository'

export interface CreateSpaceInput {
  name: string
  description: string
  openHours: OpenHours
  color?: string | null
}

const MAX_SLUG_ATTEMPTS = 100

export class SpaceCreator {
  constructor(private readonly spaceRepo: SpaceRepository) {}

  async run(input: CreateSpaceInput): Promise<SpaceDto> {
    const baseSlug = generateSlug(input.name)
    const slug = await this.findAvailableSlug(baseSlug)

    const space = Space.create({
      slug,
      name: input.name,
      description: input.description,
      openHours: input.openHours,
      color: input.color ?? null
    })

    await this.spaceRepo.save(space)
    return space.toDto()
  }

  private async findAvailableSlug(baseSlug: string): Promise<string> {
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`
      if (!(await this.spaceRepo.slugExists(candidate))) return candidate
    }
    throw new SpaceSlugCollisionError(baseSlug)
  }
}
