import { toZonedTime } from 'date-fns-tz'
import type { BookingRepository } from '../domain/booking.repository'
import { SpaceNotFoundError } from '../domain/errors'
import type { DayKey, OpenHoursWindow } from '../domain/open-hours'
import type { SpaceRepository } from '../domain/space.repository'
import type { DayViewDto } from './dtos'

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export class SpaceDayViewer {
  constructor(
    private readonly spaceRepo: SpaceRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly tz: string
  ) {}

  async run({ slug, date }: { slug: string; date: string }): Promise<DayViewDto> {
    const space = await this.spaceRepo.findBySlug(slug)
    if (!space) throw new SpaceNotFoundError(slug)

    const dateObj = new Date(`${date}T12:00:00Z`)
    const bookings = await this.bookingRepo.listActiveOnDay(space.toDto().id, dateObj, this.tz)

    const zonedDate = toZonedTime(dateObj, this.tz)
    const dayKey = DAY_KEYS[zonedDate.getDay()] as DayKey
    const openHoursForDay: OpenHoursWindow[] = space.toDto().openHours[dayKey] ?? []

    return {
      space: space.toDto(),
      date,
      openHoursForDay,
      bookings: bookings.map((b) => {
        const dto = b.toDto()
        return {
          ...dto,
          spaceSlug: slug,
          spaceDisplayName: space.toDto().displayName
        }
      })
    }
  }
}
