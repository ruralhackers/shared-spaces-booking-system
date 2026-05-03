import { createTRPCRouter } from '../trpc'
import { configRouter } from './config.router'
import { spacesRouter } from './spaces.router'
import { tableRouter } from './table.router'

export const appRouter = createTRPCRouter({
  config: configRouter,
  table: tableRouter,
  spaces: spacesRouter
})

export type AppRouter = typeof appRouter
