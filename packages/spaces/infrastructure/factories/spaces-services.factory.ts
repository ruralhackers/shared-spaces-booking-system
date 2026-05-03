import type { Clock } from '@dfs/common'
import type { PrismaClient } from '@dfs/database'
import type { Notifier as GenericNotifier } from '@dfs/notifications'
import { AdminBookingCanceller } from '../../application/admin-booking-canceller.service'
import { AdminBookingLister } from '../../application/admin-booking-lister.service'
import { AdminBookingSeriesCanceller } from '../../application/admin-booking-series-canceller.service'
import { AdminBookingSeriesLister } from '../../application/admin-booking-series-lister.service'
import { BookingCanceller } from '../../application/booking-canceller.service'
import { BookingCreator } from '../../application/booking-creator.service'
import { BookingSeriesCanceller } from '../../application/booking-series-canceller.service'
import { BookingSeriesCreator } from '../../application/booking-series-creator.service'
import { SpaceAvailabilityChecker } from '../../application/space-availability-checker.service'
import { SpaceCreator } from '../../application/space-creator.service'
import { SpaceDayViewer } from '../../application/space-day-viewer.service'
import { SpaceDeleter } from '../../application/space-deleter.service'
import { SpaceLister } from '../../application/space-lister.service'
import { SpaceUpdater } from '../../application/space-updater.service'
import { BookingPrismaRepository } from '../booking-prisma.repository'
import { BookingSeriesPrismaRepository } from '../booking-series-prisma.repository'
import { GenericNotifierAdapter } from '../generic-notifier.adapter'
import { SpacePrismaRepository } from '../space-prisma.repository'

export interface SpacesServices {
  spaceLister: SpaceLister
  spaceDayViewer: SpaceDayViewer
  availabilityChecker: SpaceAvailabilityChecker
  bookingCreator: BookingCreator
  bookingCanceller: BookingCanceller
  adminBookingCanceller: AdminBookingCanceller
  adminBookingLister: AdminBookingLister
  bookingSeriesCreator: BookingSeriesCreator
  bookingSeriesCanceller: BookingSeriesCanceller
  adminBookingSeriesCanceller: AdminBookingSeriesCanceller
  adminBookingSeriesLister: AdminBookingSeriesLister
  spaceCreator: SpaceCreator
  spaceUpdater: SpaceUpdater
  spaceDeleter: SpaceDeleter
}

export class SpacesServicesFactory {
  static create(
    prisma: PrismaClient,
    clock: Clock,
    notifier: GenericNotifier,
    tz: string
  ): SpacesServices {
    const spaceRepo = new SpacePrismaRepository(prisma)
    const bookingRepo = new BookingPrismaRepository(prisma)
    const bookingSeriesRepo = new BookingSeriesPrismaRepository(prisma)
    const spacesNotifier = new GenericNotifierAdapter(notifier)

    return {
      spaceLister: new SpaceLister(spaceRepo, bookingRepo, clock, tz),
      spaceDayViewer: new SpaceDayViewer(spaceRepo, bookingRepo, tz),
      availabilityChecker: new SpaceAvailabilityChecker(spaceRepo, bookingRepo),
      bookingCreator: new BookingCreator(spaceRepo, bookingRepo, spacesNotifier, clock, tz),
      bookingCanceller: new BookingCanceller(spaceRepo, bookingRepo, spacesNotifier, clock),
      adminBookingCanceller: new AdminBookingCanceller(
        spaceRepo,
        bookingRepo,
        spacesNotifier,
        clock
      ),
      adminBookingLister: new AdminBookingLister(spaceRepo, bookingRepo),
      bookingSeriesCreator: new BookingSeriesCreator(
        spaceRepo,
        bookingRepo,
        bookingSeriesRepo,
        clock,
        tz
      ),
      bookingSeriesCanceller: new BookingSeriesCanceller(bookingRepo, bookingSeriesRepo, clock),
      adminBookingSeriesCanceller: new AdminBookingSeriesCanceller(
        bookingRepo,
        bookingSeriesRepo,
        clock
      ),
      adminBookingSeriesLister: new AdminBookingSeriesLister(spaceRepo, bookingSeriesRepo),
      spaceCreator: new SpaceCreator(spaceRepo),
      spaceUpdater: new SpaceUpdater(spaceRepo),
      spaceDeleter: new SpaceDeleter(spaceRepo)
    }
  }
}
