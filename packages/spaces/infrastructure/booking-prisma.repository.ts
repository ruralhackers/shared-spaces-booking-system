import type { PrismaClient } from '@dfs/database'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { Booking } from '../domain/booking.entity'
import type { BookingRepository } from '../domain/booking.repository'

type PrismaBookingRow = {
  id: string
  spaceId: string
  seriesId: string | null
  bookerName: string
  startsAt: Date
  endsAt: Date
  status: 'active' | 'cancelled'
  createdAt: Date
  cancelledAt: Date | null
  cancelledBy: 'booker' | 'admin' | null
}

export class BookingPrismaRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Booking | null> {
    const row = await this.prisma.booking.findUnique({ where: { id } })
    return row ? this.toEntity(row as PrismaBookingRow) : null
  }

  async listActiveOnDay(spaceId: string, date: Date, tz: string): Promise<Booking[]> {
    const zoned = toZonedTime(date, tz)
    const year = zoned.getFullYear()
    const month = zoned.getMonth()
    const day = zoned.getDate()

    // Convert day boundaries from the given timezone back to UTC for the query
    const dayStart = fromZonedTime(new Date(year, month, day, 0, 0, 0), tz)
    const dayEnd = fromZonedTime(new Date(year, month, day + 1, 0, 0, 0), tz)

    const rows = await this.prisma.booking.findMany({
      where: {
        spaceId,
        status: 'active',
        startsAt: { gte: dayStart, lt: dayEnd }
      },
      orderBy: { startsAt: 'asc' }
    })
    return rows.map((r) => this.toEntity(r as PrismaBookingRow))
  }

  async findActiveAt(at: Date): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: {
        status: 'active',
        startsAt: { lte: at },
        endsAt: { gte: at }
      }
    })
    return rows.map((r) => this.toEntity(r as PrismaBookingRow))
  }

  async listAllActive(): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: { status: 'active' },
      orderBy: { startsAt: 'asc' }
    })
    return rows.map((r) => this.toEntity(r as PrismaBookingRow))
  }

  async findOverlapping(spaceId: string, startsAt: Date, endsAt: Date): Promise<Booking[]> {
    const rows = await this.prisma.booking.findMany({
      where: {
        spaceId,
        status: 'active',
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      },
      orderBy: { startsAt: 'asc' }
    })
    return rows.map((r) => this.toEntity(r as PrismaBookingRow))
  }

  async findForDate(date: Date, tz: string): Promise<Booking[]> {
    const zoned = toZonedTime(date, tz)
    const year = zoned.getFullYear()
    const month = zoned.getMonth()
    const day = zoned.getDate()

    const dayStart = fromZonedTime(new Date(year, month, day, 0, 0, 0), tz)
    const dayEnd = fromZonedTime(new Date(year, month, day + 1, 0, 0, 0), tz)

    const rows = await this.prisma.booking.findMany({
      where: {
        status: 'active',
        startsAt: { gte: dayStart, lt: dayEnd }
      },
      orderBy: { startsAt: 'asc' }
    })
    return rows.map((r) => this.toEntity(r as PrismaBookingRow))
  }

  async save(booking: Booking): Promise<void> {
    const dto = booking.toDto()
    // Note: Overlap checking is enforced in the domain layer (Booking.create)
    // SQLite does not support exclusion constraints for temporal overlap
    await this.prisma.booking.upsert({
      where: { id: dto.id },
      update: {
        status: dto.status,
        cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : null,
        cancelledBy: dto.cancelledBy ?? null
      },
      create: {
        id: dto.id,
        spaceId: dto.spaceId,
        seriesId: dto.seriesId,
        bookerName: dto.bookerName,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: dto.status,
        createdAt: new Date(dto.createdAt),
        cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : null,
        cancelledBy: dto.cancelledBy ?? null
      }
    })
  }

  private toEntity(row: PrismaBookingRow): Booking {
    return Booking.fromDto({
      id: row.id,
      spaceId: row.spaceId,
      seriesId: row.seriesId,
      bookerName: row.bookerName,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      cancelledBy: row.cancelledBy
    })
  }
}
