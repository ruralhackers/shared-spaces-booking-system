import { describe, expect, test } from 'bun:test'
import { NoOpNotifier } from './no-op.notifier'

describe('The NoOpNotifier', () => {
  test('completes booking creation without HTTP call', async () => {
    const originalFetch = globalThis.fetch
    let fetchCalled = false
    globalThis.fetch = async () => {
      fetchCalled = true
      return new Response()
    }
    const notifier = new NoOpNotifier()

    notifier.bookingCreated({
      bookingId: 'id',
      spaceDisplayName: 'Chill House',
      bookerName: 'Ana',
      startsAt: '2026-05-04T10:00:00Z',
      endsAt: '2026-05-04T11:00:00Z'
    })

    globalThis.fetch = originalFetch
    expect(fetchCalled).toBe(false)
  })

  test('completes booking cancellation without HTTP call', async () => {
    const originalFetch = globalThis.fetch
    let fetchCalled = false
    globalThis.fetch = async () => {
      fetchCalled = true
      return new Response()
    }
    const notifier = new NoOpNotifier()

    notifier.bookingCancelled(
      {
        bookingId: 'id',
        spaceDisplayName: 'Chill House',
        bookerName: 'Ana',
        startsAt: '2026-05-04T10:00:00Z',
        endsAt: '2026-05-04T11:00:00Z'
      },
      'booker'
    )

    globalThis.fetch = originalFetch
    expect(fetchCalled).toBe(false)
  })
})
