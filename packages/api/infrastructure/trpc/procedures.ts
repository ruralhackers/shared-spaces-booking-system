import { adminMiddleware, domainErrorMiddleware, timingMiddleware } from './middleware'
import { t } from './trpc'

export const publicProcedure = t.procedure.use(timingMiddleware).use(domainErrorMiddleware)
export const adminProcedure = publicProcedure.use(adminMiddleware)
