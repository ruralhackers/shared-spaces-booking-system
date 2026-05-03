import type { Booking } from './booking.entity'
import type { Space } from './space.entity'

export interface Notifier {
  bookingCreated(booking: Booking, space: Space): void
  bookingCancelled(booking: Booking, space: Space, by: 'booker' | 'admin'): void
}
