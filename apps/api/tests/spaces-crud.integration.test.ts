import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import type { TRPCContext } from '@dfs/api/domain'
import { appRouter } from '@dfs/api/infrastructure'
import { SystemClock } from '@dfs/common'
import { createTestPrisma, type TestPrisma } from '@dfs/database/testing'
import { NoOpNotifier } from '@dfs/notifications'
import { SpacesServicesFactory } from '@dfs/spaces'

const TZ = 'America/Argentina/Buenos_Aires'

let db: TestPrisma

const validOpenHours = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

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
})

afterAll(async () => {
  await db.close()
})

describe('spaces CRUD tRPC procedures', () => {
  test('creates a space', async () => {
    const caller = appRouter.createCaller(makeCtx(true))

    const space = await caller.spaces.create({
      name: 'Sala Grande',
      description: 'Big room',
      openHours: validOpenHours
    })

    expect(space.slug).toBe('sala-grande')
    expect(space.displayName).toBe('Sala Grande')
  })

  test('handles slug collision on create', async () => {
    const caller = appRouter.createCaller(makeCtx(true))
    await caller.spaces.create({ name: 'Sala Chica', description: '', openHours: validOpenHours })

    const second = await caller.spaces.create({
      name: 'Sala Chica',
      description: '',
      openHours: validOpenHours
    })

    expect(second.slug).toBe('sala-chica-2')
  })

  test('updates a space', async () => {
    const caller = appRouter.createCaller(makeCtx(true))
    await caller.spaces.create({ name: 'Sala Update', description: '', openHours: validOpenHours })

    const updated = await caller.spaces.update({ slug: 'sala-update', name: 'Sala Actualizada' })

    expect(updated.displayName).toBe('Sala Actualizada')
    expect(updated.slug).toBe('sala-update')
  })

  test('fails when updating non-existent space', async () => {
    const caller = appRouter.createCaller(makeCtx(true))

    await expect(caller.spaces.update({ slug: 'no-existe', name: 'X' })).rejects.toThrow()
  })

  test('deletes a space', async () => {
    const caller = appRouter.createCaller(makeCtx(true))
    await caller.spaces.create({ name: 'Sala Delete', description: '', openHours: validOpenHours })

    const result = await caller.spaces.delete({ slug: 'sala-delete' })

    expect(result.deleted).toBe(true)
    const spaces = await caller.spaces.list()
    expect(spaces.some((s) => s.slug === 'sala-delete')).toBe(false)
  })

  test('prevents create without admin authorization', async () => {
    const caller = appRouter.createCaller(makeCtx(false))

    await expect(
      caller.spaces.create({ name: 'Unauthorized', description: '', openHours: validOpenHours })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
