import { NotFoundError } from '@dfs/common'

export class SpaceNotFoundError extends NotFoundError {
  constructor(slug: string) {
    super('Space', slug, { slug })
  }
}
