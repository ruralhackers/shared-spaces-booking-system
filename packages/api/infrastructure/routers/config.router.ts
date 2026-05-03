import { publicProcedure } from '../trpc/procedures'
import { t } from '../trpc/trpc'

export const configRouter = t.router({
  siteInfo: publicProcedure.query(({ ctx }) => ({
    name: ctx.siteConfig.name,
    shortName: ctx.siteConfig.shortName,
    logoUrl: ctx.siteConfig.logoUrl
  }))
})
