import { describe, expect, test } from 'bun:test'
import type { Logger } from '@dfs/common'
import { NoOpNotifier } from '../no-op.notifier'
import { SlackWebhookNotifier } from '../slack-webhook.notifier'
import { NotifierFactory } from './notifier.factory'

const logger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
}

describe('The NotifierFactory', () => {
  test('returns SlackWebhookNotifier when a non-empty URL is provided', () => {
    const notifier = NotifierFactory.create('https://hooks.slack.com/test', logger)
    expect(notifier).toBeInstanceOf(SlackWebhookNotifier)
  })

  test('returns NoOpNotifier when URL is empty string', () => {
    const notifier = NotifierFactory.create('', logger)
    expect(notifier).toBeInstanceOf(NoOpNotifier)
  })

  test('returns NoOpNotifier when URL is undefined', () => {
    const notifier = NotifierFactory.create(undefined, logger)
    expect(notifier).toBeInstanceOf(NoOpNotifier)
  })
})
