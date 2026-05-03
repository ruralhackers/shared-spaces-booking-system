import type { Logger } from '@dfs/common'
import { format } from 'date-fns'
import type { NotificationBookingPayload, Notifier } from '../domain/notifier.port'

export class SlackWebhookNotifier implements Notifier {
  constructor(
    private readonly webhookUrl: string,
    private readonly logger: Logger
  ) {}

  bookingCreated(payload: NotificationBookingPayload): void {
    this.post(this.buildMessage(payload, 'created')).catch((err) =>
      this.logger.error('Slack notification failed', { err })
    )
  }

  bookingCancelled(payload: NotificationBookingPayload, by: 'booker' | 'admin'): void {
    this.post(this.buildMessage(payload, `cancelled by ${by}`)).catch((err) =>
      this.logger.error('Slack notification failed', { err })
    )
  }

  private buildMessage(payload: NotificationBookingPayload, action: string): string {
    const start = format(new Date(payload.startsAt), 'MMM d, HH:mm')
    const end = format(new Date(payload.endsAt), 'HH:mm')
    return `Booking ${action}: *${payload.spaceDisplayName}* — ${payload.bookerName} — ${start}–${end}`
  }

  private async post(text: string): Promise<void> {
    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    if (!res.ok) {
      this.logger.error('Slack webhook returned non-2xx', { status: res.status })
    }
  }
}
