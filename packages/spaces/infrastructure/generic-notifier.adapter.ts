import type { Notifier as GenericNotifier, NotificationBookingPayload } from '@dfs/notifications'
import type { Booking } from '../domain/booking.entity'
import type { Notifier } from '../domain/notifier.port'
import type { Space } from '../domain/space.entity'

function toPayload(booking: Booking, space: Space): NotificationBookingPayload {
  const dto = booking.toDto()
  return {
    bookingId: dto.id,
    spaceDisplayName: space.toDto().displayName,
    bookerName: dto.bookerName,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt
  }
}

export class GenericNotifierAdapter implements Notifier {
  constructor(private readonly inner: GenericNotifier) {}

  bookingCreated(booking: Booking, space: Space): void {
    this.inner.bookingCreated(toPayload(booking, space))
  }

  bookingCancelled(booking: Booking, space: Space, by: 'booker' | 'admin'): void {
    this.inner.bookingCancelled(toPayload(booking, space), by)
  }
}
