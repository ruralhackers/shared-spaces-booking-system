import type { Booking } from '../domain/booking.entity'
import type { Notifier } from '../domain/notifier.port'
import type { Space } from '../domain/space.entity'

export class InMemoryNotifier implements Notifier {
  readonly calls: Array<{
    event: 'created' | 'cancelled'
    bookingId: string
    by?: 'booker' | 'admin'
  }> = []

  bookingCreated(booking: Booking, _space: Space): void {
    this.calls.push({ event: 'created', bookingId: booking.toDto().id })
  }

  bookingCancelled(booking: Booking, _space: Space, by: 'booker' | 'admin'): void {
    this.calls.push({ event: 'cancelled', bookingId: booking.toDto().id, by })
  }
}
