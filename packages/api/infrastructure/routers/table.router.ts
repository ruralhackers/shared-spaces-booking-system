import { createTRPCRouter, publicProcedure } from '../trpc'

export const tableRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({ ok: true }))
})
