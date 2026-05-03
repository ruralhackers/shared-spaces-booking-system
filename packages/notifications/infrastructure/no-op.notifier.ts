import type { NotificationBookingPayload, Notifier } from '../domain/notifier.port'

export class NoOpNotifier implements Notifier {
  bookingCreated(_payload: NotificationBookingPayload): void {}
  bookingCancelled(_payload: NotificationBookingPayload, _by: 'booker' | 'admin'): void {}
}
