import { toZonedTime } from 'date-fns-tz'
import type { Booking } from '../domain/booking.entity'
import type { BookingRepository } from '../domain/booking.repository'

export class InMemoryBookingRepository implements BookingRepository {
  private bookings: Map<string, Booking> = new Map()

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) ?? null
  }

  async listActiveOnDay(spaceId: string, date: Date, tz: string): Promise<Booking[]> {
    const targetDate = toZonedTime(date, tz)
    const targetDay = targetDate.getDate()
    const targetMonth = targetDate.getMonth()
    const targetYear = targetDate.getFullYear()

    return Array.from(this.bookings.values()).filter((b) => {
      const dto = b.toDto()
      if (dto.spaceId !== spaceId || dto.status !== 'active') return false
      const startZoned = toZonedTime(new Date(dto.startsAt), tz)
      return (
        startZoned.getDate() === targetDay &&
        startZoned.getMonth() === targetMonth &&
        startZoned.getFullYear() === targetYear
      )
    })
  }

  async findForDate(date: Date, tz: string): Promise<Booking[]> {
    const targetDate = toZonedTime(date, tz)
    const targetDay = targetDate.getDate()
    const targetMonth = targetDate.getMonth()
    const targetYear = targetDate.getFullYear()

    return Array.from(this.bookings.values()).filter((b) => {
      const dto = b.toDto()
      if (dto.status !== 'active') return false
      const startZoned = toZonedTime(new Date(dto.startsAt), tz)
      return (
        startZoned.getDate() === targetDay &&
        startZoned.getMonth() === targetMonth &&
        startZoned.getFullYear() === targetYear
      )
    })
  }

  async findActiveAt(at: Date): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter((b) => {
      const dto = b.toDto()
      return dto.status === 'active' && new Date(dto.startsAt) <= at && new Date(dto.endsAt) >= at
    })
  }

  async listAllActive(): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter((b) => b.toDto().status === 'active')
      .sort(
        (a, b) => new Date(a.toDto().startsAt).getTime() - new Date(b.toDto().startsAt).getTime()
      )
  }

  async findOverlapping(spaceId: string, startsAt: Date, endsAt: Date): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter((b) => {
        const dto = b.toDto()
        if (dto.status !== 'active' || dto.spaceId !== spaceId) return false
        const bookingStart = new Date(dto.startsAt)
        const bookingEnd = new Date(dto.endsAt)
        return bookingStart < endsAt && bookingEnd > startsAt
      })
      .sort(
        (a, b) => new Date(a.toDto().startsAt).getTime() - new Date(b.toDto().startsAt).getTime()
      )
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.set(booking.toDto().id, booking)
  }
}
