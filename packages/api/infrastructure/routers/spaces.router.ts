import { z } from 'zod'
import { adminProcedure, publicProcedure } from '../trpc/procedures'
import { t } from '../trpc/trpc'

const openHoursWindowSchema = z.object({
  start: z.string(),
  end: z.string()
})

const openHoursSchema = z.object({
  mon: z.array(openHoursWindowSchema),
  tue: z.array(openHoursWindowSchema),
  wed: z.array(openHoursWindowSchema),
  thu: z.array(openHoursWindowSchema),
  fri: z.array(openHoursWindowSchema),
  sat: z.array(openHoursWindowSchema),
  sun: z.array(openHoursWindowSchema)
})

export const spacesRouter = t.router({
  list: publicProcedure.query(({ ctx }) => ctx.spacesServices.spaceLister.run()),

  availability: publicProcedure
    .input(
      z.object({
        startsAt: z.string(),
        endsAt: z.string()
      })
    )
    .output(
      z.array(
        z.object({
          spaceSlug: z.string(),
          spaceName: z.string(),
          status: z.enum(['available', 'occupied']),
          state: z.enum(['free', 'occupied', 'closed']),
          occupiedBy: z.string().optional(),
          color: z.string().nullable().optional()
        })
      )
    )
    .query(({ ctx, input }) =>
      ctx.spacesServices.availabilityChecker.run({
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        tz: ctx.siteConfig.tz
      })
    ),

  dayView: publicProcedure
    .input(z.object({ slug: z.string(), date: z.string() }))
    .query(({ ctx, input }) =>
      ctx.spacesServices.spaceDayViewer.run({ slug: input.slug, date: input.date })
    ),

  book: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        bookerName: z.string(),
        startsAt: z.string(),
        endsAt: z.string()
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.spacesServices.bookingCreator.run({
        slug: input.slug,
        bookerName: input.bookerName,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt)
      })
    ),

  cancel: publicProcedure
    .input(z.object({ id: z.string(), bookerName: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.spacesServices.bookingCanceller.run({ id: input.id, bookerName: input.bookerName })
    ),

  bookingSeries: t.router({
    create: publicProcedure
      .input(
        z.object({
          slug: z.string(),
          bookerName: z.string(),
          startsAt: z.string(),
          endsAt: z.string(),
          frequency: z.enum(['daily', 'weekly']),
          end: z.discriminatedUnion('type', [
            z.object({ type: z.literal('date'), value: z.string() }),
            z.object({ type: z.literal('count'), value: z.number().int().positive() })
          ])
        })
      )
      .mutation(({ ctx, input }) =>
        ctx.spacesServices.bookingSeriesCreator.run({
          slug: input.slug,
          bookerName: input.bookerName,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          frequency: input.frequency,
          end: input.end
        })
      ),

    cancelByBooker: publicProcedure
      .input(
        z.object({
          seriesId: z.string(),
          scope: z.enum(['this', 'thisAndFuture']),
          occurrenceId: z.string(),
          bookerName: z.string()
        })
      )
      .mutation(({ ctx, input }) =>
        ctx.spacesServices.bookingSeriesCanceller.run({
          seriesId: input.seriesId,
          scope: input.scope,
          occurrenceId: input.occurrenceId,
          bookerName: input.bookerName
        })
      )
  }),

  adminList: adminProcedure.query(({ ctx }) => ctx.spacesServices.adminBookingLister.run()),

  adminCancel: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.spacesServices.adminBookingCanceller.run({ id: input.id })),

  adminBookingSeries: t.router({
    list: adminProcedure
      .input(z.object({ spaceId: z.string().optional() }).optional())
      .query(({ ctx, input }) => ctx.spacesServices.adminBookingSeriesLister.run(input)),

    cancel: adminProcedure
      .input(
        z.object({
          seriesId: z.string(),
          scope: z.enum(['this', 'thisAndFuture']),
          occurrenceId: z.string().optional()
        })
      )
      .mutation(({ ctx, input }) =>
        ctx.spacesServices.adminBookingSeriesCanceller.run({
          seriesId: input.seriesId,
          scope: input.scope,
          occurrenceId: input.occurrenceId
        })
      )
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().default(''),
        openHours: openHoursSchema,
        color: z.string().optional()
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.spacesServices.spaceCreator.run({
        name: input.name,
        description: input.description,
        openHours: input.openHours,
        color: input.color ?? null
      })
    ),

  update: adminProcedure
    .input(
      z.object({
        slug: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        openHours: openHoursSchema.optional(),
        color: z.string().optional().nullable()
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.spacesServices.spaceUpdater.run({
        slug: input.slug,
        name: input.name,
        description: input.description,
        openHours: input.openHours,
        color: input.color
      })
    ),

  delete: adminProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ ctx, input }) => ctx.spacesServices.spaceDeleter.run({ slug: input.slug }))
})
