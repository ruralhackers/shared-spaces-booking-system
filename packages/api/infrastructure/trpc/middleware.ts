import { mapDomainErrorToTRPC } from '@dfs/common'
import { TRPCError } from '@trpc/server'
import { t } from './trpc'

export const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  const result = await next()

  const end = Date.now()
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`)

  return result
})

export const domainErrorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    throw mapDomainErrorToTRPC(error as Error)
  }
})

export const adminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' })
  }
  return next({ ctx })
})
