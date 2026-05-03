import type { Space } from './space.entity'

export interface SpaceRepository {
  findById(id: string): Promise<Space | null>
  findBySlug(slug: string): Promise<Space | null>
  listAll(): Promise<Space[]>
  save(space: Space): Promise<void>
  delete(id: string): Promise<void>
  slugExists(slug: string): Promise<boolean>
}
