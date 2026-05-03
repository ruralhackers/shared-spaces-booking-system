import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { Logger } from '@dfs/common'
import { SlackWebhookNotifier } from './slack-webhook.notifier'

const payload = {
  bookingId: 'clh0000000000000000000001',
  spaceDisplayName: 'Chill House',
  bookerName: 'Ana',
  startsAt: '2026-05-04T13:00:00.000Z',
  endsAt: '2026-05-04T14:00:00.000Z'
}

function makeLogger(): Logger {
  return {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {})
  }
}

describe('The SlackWebhookNotifier', () => {
  let fetchMock: ReturnType<typeof mock>
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    fetchMock = mock(() => Promise.resolve(new Response('ok', { status: 200 })))
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  test('posts booking creation with space, booker, and time range', async () => {
    const logger = makeLogger()
    const notifier = new SlackWebhookNotifier('https://hooks.slack.com/test', logger)

    notifier.bookingCreated(payload)
    await Promise.resolve() // flush microtask

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://hooks.slack.com/test')
    const body = JSON.parse(init.body as string)
    expect(body.text).toContain('Chill House')
    expect(body.text).toContain('Ana')
    expect(body.text).toContain('created')

    globalThis.fetch = originalFetch
  })

  test('includes attribution in cancellation message', async () => {
    const logger = makeLogger()
    const notifier = new SlackWebhookNotifier('https://hooks.slack.com/test', logger)

    notifier.bookingCancelled(payload, 'admin')
    await Promise.resolve()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.text).toContain('admin')
    expect(body.text).toContain('cancelled')

    globalThis.fetch = originalFetch
  })

  test('logs non-2xx response without throwing', async () => {
    fetchMock = mock(() => Promise.resolve(new Response('bad', { status: 500 })))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const logger = makeLogger()
    const notifier = new SlackWebhookNotifier('https://hooks.slack.com/test', logger)

    expect(() => notifier.bookingCreated(payload)).not.toThrow()
    await Promise.resolve()

    globalThis.fetch = originalFetch
  })

  test('logs fetch error without throwing', async () => {
    fetchMock = mock(() => Promise.reject(new Error('network down')))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const logger = makeLogger()
    const notifier = new SlackWebhookNotifier('https://hooks.slack.com/test', logger)

    expect(() => notifier.bookingCreated(payload)).not.toThrow()
    await new Promise((r) => setTimeout(r, 10)) // let rejection settle

    expect(logger.error).toHaveBeenCalled()
    globalThis.fetch = originalFetch
  })
})
