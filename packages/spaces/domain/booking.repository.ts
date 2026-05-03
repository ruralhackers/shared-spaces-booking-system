import type { Booking } from './booking.entity'

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>
  listActiveOnDay(spaceId: string, date: Date, tz: string): Promise<Booking[]>
  listAllActive(): Promise<Booking[]>
  findActiveAt(at: Date): Promise<Booking[]>
  findOverlapping(spaceId: string, startsAt: Date, endsAt: Date): Promise<Booking[]>
  findForDate(date: Date, tz: string): Promise<Booking[]>
  save(booking: Booking): Promise<void>
}
