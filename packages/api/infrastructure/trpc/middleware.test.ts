import { describe, expect, test } from 'bun:test'
import type { TRPCContext } from '../../domain/types/trpc-context'
import { adminMiddleware } from './middleware'
import { t } from './trpc'

function makeCtx(isAdmin: boolean): TRPCContext {
  return {
    db: {} as TRPCContext['db'],
    headers: new Headers(),
    spacesServices: {} as TRPCContext['spacesServices'],
    isAdmin
  }
}

describe('The adminMiddleware', () => {
  test('rejects request when isAdmin is false', async () => {
    const procedure = t.procedure.use(adminMiddleware)
    const caller = t.router({ test: procedure.query(() => 'ok') }).createCaller(makeCtx(false))

    await expect(caller.test()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  test('allows request when isAdmin is true', async () => {
    const procedure = t.procedure.use(adminMiddleware)
    const caller = t.router({ test: procedure.query(() => 'ok') }).createCaller(makeCtx(true))

    const result = await caller.test()

    expect(result).toBe('ok')
  })
})
