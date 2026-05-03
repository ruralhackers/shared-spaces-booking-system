import type { BookingSeries } from '../domain/booking-series.entity'
import type { BookingSeriesRepository } from '../domain/booking-series.repository'

export class InMemoryBookingSeriesRepository implements BookingSeriesRepository {
  private series = new Map<string, BookingSeries>()

  async save(series: BookingSeries): Promise<void> {
    this.series.set(series.toDto().id, series)
  }

  async findById(id: string): Promise<BookingSeries | null> {
    return this.series.get(id) ?? null
  }

  async listActive(spaceId?: string): Promise<BookingSeries[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return Array.from(this.series.values()).filter((s) => {
      const dto = s.toDto()
      const endDate = new Date(dto.endDate)
      const matchesSpace = spaceId ? dto.spaceId === spaceId : true
      return endDate >= today && matchesSpace
    })
  }
}
