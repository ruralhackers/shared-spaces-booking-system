export interface NotificationBookingPayload {
  bookingId: string
  spaceDisplayName: string
  bookerName: string
  startsAt: string
  endsAt: string
}

export interface Notifier {
  bookingCreated(payload: NotificationBookingPayload): void
  bookingCancelled(payload: NotificationBookingPayload, by: 'booker' | 'admin'): void
}
