import type { PrismaClient } from '@dfs/database'
import { BookingSeries } from '../domain/booking-series.entity'
import type { BookingSeriesRepository } from '../domain/booking-series.repository'

type PrismaBookingSeriesRow = {
  id: string
  spaceId: string
  bookerName: string
  startTime: string
  endTime: string
  frequency: 'daily' | 'weekly'
  firstDate: Date
  endDate: Date
  createdAt: Date
}

export class BookingSeriesPrismaRepository implements BookingSeriesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(series: BookingSeries): Promise<void> {
    const dto = series.toDto()
    await this.prisma.bookingSeries.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        spaceId: dto.spaceId,
        bookerName: dto.bookerName,
        startTime: dto.startTime,
        endTime: dto.endTime,
        frequency: dto.frequency as 'daily' | 'weekly',
        firstDate: new Date(dto.firstDate),
        endDate: new Date(dto.endDate),
        createdAt: new Date(dto.createdAt)
      },
      update: {
        spaceId: dto.spaceId,
        bookerName: dto.bookerName,
        startTime: dto.startTime,
        endTime: dto.endTime,
        frequency: dto.frequency as 'daily' | 'weekly',
        firstDate: new Date(dto.firstDate),
        endDate: new Date(dto.endDate)
      }
    })
  }

  async findById(id: string): Promise<BookingSeries | null> {
    const row = await this.prisma.bookingSeries.findUnique({
      where: { id }
    })

    if (!row) return null

    return this.toDomain(row)
  }

  async listActive(spaceId?: string): Promise<BookingSeries[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const rows = await this.prisma.bookingSeries.findMany({
      where: {
        endDate: {
          gte: today
        },
        ...(spaceId ? { spaceId } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return rows.map((row) => this.toDomain(row))
  }

  private toDomain(row: PrismaBookingSeriesRow): BookingSeries {
    return BookingSeries.fromDto({
      id: row.id,
      spaceId: row.spaceId,
      bookerName: row.bookerName,
      frequency: row.frequency,
      startTime: row.startTime,
      endTime: row.endTime,
      firstDate: row.firstDate.toISOString(),
      endDate: row.endDate.toISOString(),
      createdAt: row.createdAt.toISOString()
    })
  }
}
