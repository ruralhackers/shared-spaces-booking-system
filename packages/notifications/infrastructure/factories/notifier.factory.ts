import type { Logger } from '@dfs/common'
import type { Notifier } from '../../domain/notifier.port'
import { NoOpNotifier } from '../no-op.notifier'
import { SlackWebhookNotifier } from '../slack-webhook.notifier'

export class NotifierFactory {
  static create(webhookUrl: string | undefined, logger: Logger): Notifier {
    if (webhookUrl) {
      return new SlackWebhookNotifier(webhookUrl, logger)
    }
    return new NoOpNotifier()
  }
}
