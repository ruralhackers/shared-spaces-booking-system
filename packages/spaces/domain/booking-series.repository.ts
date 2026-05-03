import type { BookingSeries } from './booking-series.entity'

export interface BookingSeriesRepository {
  save(series: BookingSeries): Promise<void>
  findById(id: string): Promise<BookingSeries | null>
  listActive(spaceId?: string): Promise<BookingSeries[]>
}
