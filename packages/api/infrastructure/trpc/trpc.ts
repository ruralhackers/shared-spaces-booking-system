import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { TRPCContext } from '../../domain/types/trpc-context'

export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause as { code?: string; metadata?: Record<string, unknown> } | undefined
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        errorCode: cause?.code,
        metadata: cause?.metadata
      }
    }
  }
})

export const createTRPCRouter = t.router
