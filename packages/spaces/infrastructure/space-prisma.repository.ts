import type { PrismaClient } from '@dfs/database'
import type { OpenHours } from '../domain/open-hours'
import { Space } from '../domain/space.entity'
import type { SpaceRepository } from '../domain/space.repository'

export class SpacePrismaRepository implements SpaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Space | null> {
    const row = await this.prisma.space.findUnique({ where: { id } })
    return row ? this.toEntity(row) : null
  }

  async findBySlug(slug: string): Promise<Space | null> {
    const row = await this.prisma.space.findUnique({ where: { slug } })
    return row ? this.toEntity(row) : null
  }

  async listAll(): Promise<Space[]> {
    const rows = await this.prisma.space.findMany({ orderBy: { createdAt: 'asc' } })
    return rows.map((r) => this.toEntity(r))
  }

  async save(space: Space): Promise<void> {
    const dto = space.toDto()
    await this.prisma.space.upsert({
      where: { id: dto.id },
      update: {
        displayName: dto.displayName,
        description: dto.description,
        openHours: dto.openHours as object,
        color: dto.color
      },
      create: {
        id: dto.id,
        slug: dto.slug,
        displayName: dto.displayName,
        description: dto.description,
        openHours: dto.openHours as object,
        color: dto.color
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.space.delete({ where: { id } })
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.space.count({ where: { slug } })
    return count > 0
  }

  private toEntity(row: {
    id: string
    slug: string
    displayName: string
    description: string
    openHours: unknown
    color: string | null
  }): Space {
    return Space.fromDto({
      id: row.id,
      slug: row.slug,
      displayName: row.displayName,
      description: row.description,
      openHours: row.openHours as OpenHours,
      color: row.color
    })
  }
}
