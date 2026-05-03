import type { Space } from '../domain/space.entity'
import type { SpaceRepository } from '../domain/space.repository'

export class InMemorySpaceRepository implements SpaceRepository {
  private spaces: Map<string, Space> = new Map()

  async findById(id: string): Promise<Space | null> {
    return this.spaces.get(id) ?? null
  }

  async findBySlug(slug: string): Promise<Space | null> {
    for (const space of this.spaces.values()) {
      if (space.toDto().slug === slug) return space
    }
    return null
  }

  async listAll(): Promise<Space[]> {
    return Array.from(this.spaces.values())
  }

  async save(space: Space): Promise<void> {
    this.spaces.set(space.toDto().id, space)
  }

  async delete(id: string): Promise<void> {
    this.spaces.delete(id)
  }

  async slugExists(slug: string): Promise<boolean> {
    for (const space of this.spaces.values()) {
      if (space.toDto().slug === slug) return true
    }
    return false
  }

  seed(spaces: Space[]): void {
    for (const space of spaces) {
      this.spaces.set(space.toDto().id, space)
    }
  }
}
