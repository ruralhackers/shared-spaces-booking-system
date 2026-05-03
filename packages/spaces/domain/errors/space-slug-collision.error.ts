import { ConflictError } from '@dfs/common'

export class SpaceSlugCollisionError extends ConflictError {
  constructor(baseSlug: string) {
    super(`Could not generate a unique slug for base "${baseSlug}" after 100 attempts.`, {
      baseSlug
    })
  }
}
