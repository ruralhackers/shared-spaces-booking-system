import { SpaceNotFoundError } from '../domain/errors'
import type { SpaceRepository } from '../domain/space.repository'

export interface DeleteSpaceInput {
  slug: string
}

export class SpaceDeleter {
  constructor(private readonly spaceRepo: SpaceRepository) {}

  async run(input: DeleteSpaceInput): Promise<{ deleted: true }> {
    const space = await this.spaceRepo.findBySlug(input.slug)
    if (!space) throw new SpaceNotFoundError(input.slug)

    await this.spaceRepo.delete(space.toDto().id)
    return { deleted: true }
  }
}
