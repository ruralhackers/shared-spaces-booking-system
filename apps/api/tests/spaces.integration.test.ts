import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import type { TRPCContext } from '@dfs/api/domain'
import { appRouter } from '@dfs/api/infrastructure'
import { SystemClock } from '@dfs/common'
import { createTestPrisma, type TestPrisma } from '@dfs/database/testing'
import { NoOpNotifier } from '@dfs/notifications'
import { SpacesServicesFactory } from '@dfs/spaces'

const TZ = 'America/Argentina/Buenos_Aires'

let db: TestPrisma

function makeCtx(isAdmin = false): TRPCContext {
  const spacesServices = SpacesServicesFactory.create(
    db.client,
    new SystemClock(),
    new NoOpNotifier(),
    TZ
  )
  return {
    db: db.client,
    headers: new Headers(),
    spacesServices,
    isAdmin,
    siteConfig: { name: 'Test Site', logoUrl: null }
  }
}

beforeAll(async () => {
  db = await createTestPrisma()
  await db.client.space.create({
    data: {
      id: 'clh0000000000000000000001',
      slug: 'chill-house',
      displayName: 'Chill House',
      description: 'Lounge',
      openHours: {
        mon: [{ start: '00:00', end: '24:00' }],
        tue: [{ start: '00:00', end: '24:00' }],
        wed: [{ start: '00:00', end: '24:00' }],
        thu: [{ start: '00:00', end: '24:00' }],
        fri: [{ start: '00:00', end: '24:00' }],
        sat: [{ start: '00:00', end: '24:00' }],
        sun: [{ start: '00:00', end: '24:00' }]
      } as object
    }
  })
})

afterAll(async () => {
  await db.close()
})

describe('spaces tRPC router', () => {
  test('lists seeded spaces', async () => {
    const caller = appRouter.createCaller(makeCtx())

    const spaces = await caller.spaces.list()

    expect(spaces.length).toBeGreaterThanOrEqual(1)
    expect(spaces[0]?.slug).toBe('chill-house')
  })

  test('shows empty bookings for day with no bookings', async () => {
    const caller = appRouter.createCaller(makeCtx())

    const view = await caller.spaces.dayView({ slug: 'chill-house', date: '2026-06-01' })

    expect(view.bookings).toEqual([])
  })

  test('creates booking and reflects it in day view', async () => {
    const caller = appRouter.createCaller(makeCtx())

    await caller.spaces.book({
      slug: 'chill-house',
      bookerName: 'Ana',
      startsAt: '2026-06-02T10:00:00-03:00',
      endsAt: '2026-06-02T11:00:00-03:00'
    })

    const view = await caller.spaces.dayView({ slug: 'chill-house', date: '2026-06-02' })
    expect(view.bookings.some((b) => b.bookerName === 'Ana')).toBe(true)
  })

  test('cancels booking when name matches', async () => {
    const caller = appRouter.createCaller(makeCtx())
    await caller.spaces.book({
      slug: 'chill-house',
      bookerName: 'Bob',
      startsAt: '2026-06-03T10:00:00-03:00',
      endsAt: '2026-06-03T11:00:00-03:00'
    })
    const view = await caller.spaces.dayView({ slug: 'chill-house', date: '2026-06-03' })
    const booking = view.bookings.find((b) => b.bookerName === 'Bob')
    if (!booking) throw new Error('Booking not found')

    await caller.spaces.cancel({ id: booking.id, bookerName: 'Bob' })

    const updated = await caller.spaces.dayView({ slug: 'chill-house', date: '2026-06-03' })
    expect(updated.bookings.some((b) => b.bookerName === 'Bob')).toBe(false)
  })

  test('rejects admin list without admin key', async () => {
    const caller = appRouter.createCaller(makeCtx(false))

    await expect(caller.spaces.adminList()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  test('lists all active bookings for admin', async () => {
    const caller = appRouter.createCaller(makeCtx(true))

    const bookings = await caller.spaces.adminList()

    expect(Array.isArray(bookings)).toBe(true)
  })

  test('force-cancels booking as admin', async () => {
    const caller = appRouter.createCaller(makeCtx(true))
    const publicCaller = appRouter.createCaller(makeCtx(false))
    await publicCaller.spaces.book({
      slug: 'chill-house',
      bookerName: 'Carol',
      startsAt: '2026-06-04T10:00:00-03:00',
      endsAt: '2026-06-04T11:00:00-03:00'
    })
    const all = await caller.spaces.adminList()
    const booking = all.find((b) => b.bookerName === 'Carol')
    if (!booking) throw new Error('Booking not found')

    await caller.spaces.adminCancel({ id: booking.id })

    const updated = await caller.spaces.adminList()
    expect(updated.some((b) => b.id === booking.id)).toBe(false)
  })
})
